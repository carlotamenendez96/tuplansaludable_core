import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verifyToken } from './jwt';
import { User } from '../models/User';
import { ChatMessage } from '../models/ChatMessage';
import { UserRole } from '../types';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: UserRole;
}

class SocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware(): void {
    // Middleware de autenticación para WebSocket
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Token de autenticación requerido'));
        }

        // Verificar token
        const decoded = verifyToken(token);
        
        // Verificar que el usuario existe y está activo
        const user = await User.findById(decoded.id);
        if (!user || !user.isActive) {
          return next(new Error('Usuario no encontrado o inactivo'));
        }

        // Agregar información del usuario al socket
        socket.userId = decoded.id;
        socket.userRole = decoded.role;
        
        next();
      } catch (error) {
        next(new Error('Token inválido'));
      }
    });
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`Usuario conectado: ${socket.userId}`);
      
      // Registrar usuario conectado
      if (socket.userId) {
        this.connectedUsers.set(socket.userId, socket.id);
        
        // Unirse a sala personal
        socket.join(`user_${socket.userId}`);
        
        // Notificar estado online
        this.broadcastUserStatus(socket.userId, 'online');
      }

      // Manejar envío de mensajes
      socket.on('send_message', async (data) => {
        await this.handleSendMessage(socket, data);
      });

      // Manejar marcado de mensajes como leídos
      socket.on('mark_as_read', async (data) => {
        await this.handleMarkAsRead(socket, data);
      });

      // Manejar indicador de escritura
      socket.on('typing_start', (data) => {
        this.handleTypingStart(socket, data);
      });

      socket.on('typing_stop', (data) => {
        this.handleTypingStop(socket, data);
      });

      // Manejar unirse a conversación
      socket.on('join_conversation', (data) => {
        this.handleJoinConversation(socket, data);
      });

      // Manejar salir de conversación
      socket.on('leave_conversation', (data) => {
        this.handleLeaveConversation(socket, data);
      });

      // Manejar desconexión
      socket.on('disconnect', () => {
        console.log(`Usuario desconectado: ${socket.userId}`);
        
        if (socket.userId) {
          this.connectedUsers.delete(socket.userId);
          this.broadcastUserStatus(socket.userId, 'offline');
        }
      });
    });
  }

  private async handleSendMessage(socket: AuthenticatedSocket, data: any): Promise<void> {
    try {
      if (!socket.userId) return;

      const { receiverId, message, messageType = 'text', attachments = [] } = data;

      // Verificar autorización para chatear
      const canChat = await this.canUsersChat(socket.userId, receiverId);
      if (!canChat) {
        socket.emit('error', { message: 'No tienes permisos para chatear con este usuario' });
        return;
      }

      // Crear mensaje en la base de datos
      const newMessage = new ChatMessage({
        senderId: socket.userId,
        receiverId,
        message,
        messageType,
        attachments
      });

      await newMessage.save();
      await newMessage.populate([
        { path: 'senderId', select: 'firstName lastName profilePicture' },
        { path: 'receiverId', select: 'firstName lastName profilePicture' }
      ]);

      // Emitir mensaje al remitente
      socket.emit('message_sent', {
        success: true,
        message: newMessage
      });

      // Emitir mensaje al destinatario si está conectado
      this.emitToUser(receiverId, 'new_message', newMessage);

      // Emitir notificación de nuevo mensaje
      this.emitToUser(receiverId, 'notification', {
        type: 'new_message',
        senderId: socket.userId,
        senderName: (newMessage.senderId as any).firstName + ' ' + (newMessage.senderId as any).lastName,
        message: message.length > 50 ? message.substring(0, 50) + '...' : message
      });

    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      socket.emit('error', { message: 'Error al enviar mensaje' });
    }
  }

  private async handleMarkAsRead(socket: AuthenticatedSocket, data: any): Promise<void> {
    try {
      if (!socket.userId) return;

      const { senderId } = data;

      // Marcar mensajes como leídos
      const result = await ChatMessage.updateMany(
        {
          senderId: senderId,
          receiverId: socket.userId,
          isRead: false
        },
        {
          $set: {
            isRead: true,
            readAt: new Date()
          }
        }
      );

      // Notificar al remitente que sus mensajes fueron leídos
      this.emitToUser(senderId, 'messages_read', {
        readerId: socket.userId,
        count: result.modifiedCount
      });

    } catch (error) {
      console.error('Error al marcar mensajes como leídos:', error);
    }
  }

  private handleTypingStart(socket: AuthenticatedSocket, data: any): void {
    if (!socket.userId) return;

    const { receiverId } = data;
    this.emitToUser(receiverId, 'user_typing', {
      userId: socket.userId,
      isTyping: true
    });
  }

  private handleTypingStop(socket: AuthenticatedSocket, data: any): void {
    if (!socket.userId) return;

    const { receiverId } = data;
    this.emitToUser(receiverId, 'user_typing', {
      userId: socket.userId,
      isTyping: false
    });
  }

  private handleJoinConversation(socket: AuthenticatedSocket, data: any): void {
    if (!socket.userId) return;

    const { partnerId } = data;
    const conversationRoom = this.getConversationRoom(socket.userId, partnerId);
    socket.join(conversationRoom);
  }

  private handleLeaveConversation(socket: AuthenticatedSocket, data: any): void {
    if (!socket.userId) return;

    const { partnerId } = data;
    const conversationRoom = this.getConversationRoom(socket.userId, partnerId);
    socket.leave(conversationRoom);
  }

  private async canUsersChat(userId1: string, userId2: string): Promise<boolean> {
    try {
      const [user1, user2] = await Promise.all([
        User.findById(userId1),
        User.findById(userId2)
      ]);

      if (!user1 || !user2) return false;

      // Verificar relación entrenador-cliente
      if (user1.role === UserRole.TRAINER && user2.role === UserRole.USER) {
        return user2.trainerId?.toString() === userId1;
      }
      
      if (user1.role === UserRole.USER && user2.role === UserRole.TRAINER) {
        return user1.trainerId?.toString() === userId2;
      }

      return false;
    } catch (error) {
      console.error('Error al verificar permisos de chat:', error);
      return false;
    }
  }

  private getConversationRoom(userId1: string, userId2: string): string {
    // Crear nombre de sala consistente ordenando los IDs
    const sortedIds = [userId1, userId2].sort();
    return `conversation_${sortedIds[0]}_${sortedIds[1]}`;
  }

  private broadcastUserStatus(userId: string, status: 'online' | 'offline'): void {
    this.io.emit('user_status', {
      userId,
      status,
      timestamp: new Date()
    });
  }

  // Métodos públicos para usar desde otros controladores

  public emitToUser(userId: string, event: string, data: any): void {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  public emitToRoom(room: string, event: string, data: any): void {
    this.io.to(room).emit(event, data);
  }

  public isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  public getOnlineUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Emitir notificaciones de progreso
  public emitProgressUpdate(userId: string, progressData: any): void {
    this.emitToUser(userId, 'progress_update', progressData);
    
    // También notificar al entrenador si existe
    User.findById(userId).then(user => {
      if (user && user.trainerId) {
        this.emitToUser(user.trainerId.toString(), 'client_progress_update', {
          clientId: userId,
          clientName: `${user.firstName} ${user.lastName}`,
          progressData
        });
      }
    }).catch(error => {
      console.error('Error al notificar progreso al entrenador:', error);
    });
  }

  // Emitir notificaciones de planes
  public emitPlanUpdate(userId: string, planData: any): void {
    this.emitToUser(userId, 'plan_update', planData);
  }

  public getIO(): SocketIOServer {
    return this.io;
  }
}

export default SocketService;


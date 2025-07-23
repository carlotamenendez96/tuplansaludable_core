import { Schema, model } from 'mongoose';
import { IChatMessage } from '../types';

const chatMessageSchema = new Schema<IChatMessage>({
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El ID del remitente es requerido']
  },
  receiverId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El ID del destinatario es requerido']
  },
  message: {
    type: String,
    required: [true, 'El mensaje es requerido'],
    trim: true,
    maxlength: [2000, 'El mensaje no puede exceder 2000 caracteres']
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file'],
    required: [true, 'El tipo de mensaje es requerido'],
    default: 'text'
  },
  attachments: [{
    type: String,
    validate: {
      validator: function(value: string) {
        return /^https?:\/\/.+/.test(value);
      },
      message: 'La URL del archivo adjunto debe ser válida'
    }
  }],
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
chatMessageSchema.index({ senderId: 1 });
chatMessageSchema.index({ receiverId: 1 });
chatMessageSchema.index({ senderId: 1, receiverId: 1 });
chatMessageSchema.index({ createdAt: -1 });
chatMessageSchema.index({ isRead: 1 });

// Compound index for conversation queries
chatMessageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });

// Virtual for conversation participants
chatMessageSchema.virtual('participants').get(function() {
  return [this.senderId, this.receiverId];
});

// Virtual for message age in minutes
chatMessageSchema.virtual('ageInMinutes').get(function() {
  const now = new Date();
  const diffMs = now.getTime() - this.createdAt.getTime();
  return Math.floor(diffMs / (1000 * 60));
});

// Virtual for formatted timestamp
chatMessageSchema.virtual('formattedTime').get(function() {
  return this.createdAt.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Pre-save middleware to validate message content based on type
chatMessageSchema.pre('save', function(next) {
  // Validate message content based on type
  if (this.messageType === 'text' && (!this.message || this.message.trim().length === 0)) {
    return next(new Error('Los mensajes de texto deben tener contenido'));
  }
  
  if ((this.messageType === 'image' || this.messageType === 'file') && 
      (!this.attachments || this.attachments.length === 0)) {
    return next(new Error('Los mensajes de imagen o archivo deben tener adjuntos'));
  }
  
  // Prevent self-messaging
  if (this.senderId.equals(this.receiverId)) {
    return next(new Error('No puedes enviarte mensajes a ti mismo'));
  }
  
  next();
});

// Pre-save middleware to set readAt when isRead changes to true
chatMessageSchema.pre('save', function(next) {
  if (this.isModified('isRead') && this.isRead && !this.readAt) {
    this.readAt = new Date();
  }
  next();
});

// Static method to find conversation between two users
chatMessageSchema.statics.findConversation = function(
  userId1: string, 
  userId2: string, 
  limit: number = 50,
  skip: number = 0
) {
  return this.find({
    $or: [
      { senderId: userId1, receiverId: userId2 },
      { senderId: userId2, receiverId: userId1 }
    ]
  })
  .populate('senderId', 'firstName lastName profilePicture')
  .populate('receiverId', 'firstName lastName profilePicture')
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip(skip);
};

// Static method to get recent conversations for a user
chatMessageSchema.statics.getRecentConversations = function(userId: string, limit: number = 10) {
  return this.aggregate([
    {
      $match: {
        $or: [
          { senderId: new Schema.Types.ObjectId(userId) },
          { receiverId: new Schema.Types.ObjectId(userId) }
        ]
      }
    },
    {
      $addFields: {
        partnerId: {
          $cond: {
            if: { $eq: ['$senderId', new Schema.Types.ObjectId(userId)] },
            then: '$receiverId',
            else: '$senderId'
          }
        }
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: '$partnerId',
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$receiverId', new Schema.Types.ObjectId(userId)] },
                  { $eq: ['$isRead', false] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'partner'
      }
    },
    {
      $unwind: '$partner'
    },
    {
      $project: {
        partnerId: '$_id',
        partnerName: { $concat: ['$partner.firstName', ' ', '$partner.lastName'] },
        partnerProfilePicture: '$partner.profilePicture',
        lastMessage: '$lastMessage.message',
        lastMessageType: '$lastMessage.messageType',
        lastMessageTime: '$lastMessage.createdAt',
        unreadCount: 1,
        isLastMessageFromMe: {
          $eq: ['$lastMessage.senderId', new Schema.Types.ObjectId(userId)]
        }
      }
    },
    {
      $sort: { lastMessageTime: -1 }
    },
    {
      $limit: limit
    }
  ]);
};

// Static method to mark messages as read
chatMessageSchema.statics.markAsRead = function(senderId: string, receiverId: string) {
  return this.updateMany(
    {
      senderId: senderId,
      receiverId: receiverId,
      isRead: false
    },
    {
      $set: {
        isRead: true,
        readAt: new Date()
      }
    }
  );
};

// Static method to get unread message count for a user
chatMessageSchema.statics.getUnreadCount = function(userId: string) {
  return this.countDocuments({
    receiverId: userId,
    isRead: false
  });
};

// Static method to get unread messages from a specific sender
chatMessageSchema.statics.getUnreadFromSender = function(senderId: string, receiverId: string) {
  return this.find({
    senderId: senderId,
    receiverId: receiverId,
    isRead: false
  })
  .populate('senderId', 'firstName lastName profilePicture')
  .sort({ createdAt: 1 });
};

// Instance method to mark as read
chatMessageSchema.methods.markAsRead = function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Instance method to check if message is from today
chatMessageSchema.methods.isFromToday = function(): boolean {
  const today = new Date();
  const messageDate = new Date(this.createdAt);
  
  return today.toDateString() === messageDate.toDateString();
};

// Instance method to check if message is recent (within last hour)
chatMessageSchema.methods.isRecent = function(): boolean {
  const now = new Date();
  const hourAgo = new Date(now.getTime() - (60 * 60 * 1000));
  
  return this.createdAt > hourAgo;
};

// Instance method to get conversation partner ID
chatMessageSchema.methods.getPartnerId = function(currentUserId: string): string {
  return this.senderId.toString() === currentUserId 
    ? this.receiverId.toString() 
    : this.senderId.toString();
};

export const ChatMessage = model<IChatMessage>('ChatMessage', chatMessageSchema);


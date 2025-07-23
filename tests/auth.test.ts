import request from 'supertest';
import app from '../src/index';
import { User } from '../src/models/User';
import { UserRole } from '../src/types';

describe('Auth Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test123456',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.USER
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.firstName).toBe(userData.firstName);
      expect(response.body.data.user.lastName).toBe(userData.lastName);
      expect(response.body.data.user.role).toBe(userData.role);
    });

    it('should not register user with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'Test123456',
        firstName: 'Test',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should not register user with weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123',
        firstName: 'Test',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should not register user with duplicate email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test123456',
        firstName: 'Test',
        lastName: 'User'
      };

      // Registrar primer usuario
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Intentar registrar segundo usuario con mismo email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('EMAIL_ALREADY_EXISTS');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Crear usuario de prueba
      const user = new User({
        email: 'test@example.com',
        password: 'Test123456',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.USER
      });
      await user.save();
    });

    it('should login user with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'Test123456'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe(loginData.email);
    });

    it('should not login user with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'Test123456'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('INVALID_CREDENTIALS');
    });

    it('should not login user with invalid password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('INVALID_CREDENTIALS');
    });

    it('should not login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken: string;
    let userId: string;

    beforeEach(async () => {
      // Registrar y obtener token
      const userData = {
        email: 'test@example.com',
        password: 'Test123456',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.USER
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      authToken = response.body.data.token;
      userId = response.body.data.user.id;
    });

    it('should get user info with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(userId);
      expect(response.body.data.email).toBe('test@example.com');
      expect(response.body.data.fullName).toBe('Test User');
    });

    it('should not get user info without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('NO_TOKEN');
    });

    it('should not get user info with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('INVALID_TOKEN');
    });
  });

  describe('PUT /api/auth/me', () => {
    let authToken: string;

    beforeEach(async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test123456',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.USER
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      authToken = response.body.data.token;
    });

    it('should update user info successfully', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        height: 175,
        weight: 70
      };

      const response = await request(app)
        .put('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe(updateData.firstName);
      expect(response.body.data.lastName).toBe(updateData.lastName);
      expect(response.body.data.height).toBe(updateData.height);
      expect(response.body.data.weight).toBe(updateData.weight);
    });

    it('should not update restricted fields', async () => {
      const updateData = {
        email: 'newemail@example.com',
        role: UserRole.TRAINER,
        firstName: 'Updated'
      };

      const response = await request(app)
        .put('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe(updateData.firstName);
      // Email y role no deberían cambiar
      expect(response.body.data.email).toBe('test@example.com');
      expect(response.body.data.role).toBe(UserRole.USER);
    });
  });

  describe('PUT /api/auth/change-password', () => {
    let authToken: string;

    beforeEach(async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test123456',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.USER
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      authToken = response.body.data.token;
    });

    it('should change password successfully', async () => {
      const passwordData = {
        currentPassword: 'Test123456',
        newPassword: 'NewTest123456'
      };

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verificar que se puede hacer login con nueva contraseña
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'NewTest123456'
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });

    it('should not change password with wrong current password', async () => {
      const passwordData = {
        currentPassword: 'WrongPassword',
        newPassword: 'NewTest123456'
      };

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('INVALID_CURRENT_PASSWORD');
    });

    it('should not change password with weak new password', async () => {
      const passwordData = {
        currentPassword: 'Test123456',
        newPassword: '123'
      };

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });
});


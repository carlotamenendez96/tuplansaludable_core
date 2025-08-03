const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testAPI() {
  try {
    console.log('🧪 Testing API...');

    // 1. Login como entrenador
    console.log('1. Logging in as trainer...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'trainer@example.com',
      password: 'password123'
    });

    const token = loginResponse.data.data.token;
    console.log('✅ Login successful, token:', token.substring(0, 20) + '...');

    // 2. Obtener información del usuario
    console.log('2. Getting user info...');
    const userResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ User info:', {
      id: userResponse.data.data._id,
      name: userResponse.data.data.firstName + ' ' + userResponse.data.data.lastName,
      role: userResponse.data.data.role
    });

    // 3. Obtener clientes
    console.log('3. Getting clients...');
    const clientsResponse = await axios.get(`${API_BASE_URL}/clients`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Clients response:', {
      success: clientsResponse.data.success,
      message: clientsResponse.data.message,
      dataLength: clientsResponse.data.data?.length || 0,
      clients: clientsResponse.data.data?.map(c => ({
        id: c._id,
        name: c.firstName + ' ' + c.lastName,
        email: c.email
      })) || []
    });

  } catch (error) {
    console.error('❌ Error testing API:', error.response?.data || error.message);
  }
}

testAPI(); 
// Script para verificar el estado del cliente
const BASE_URL = 'http://localhost:5000/api';
const CLIENT_ID = '68812786d6a07da255dfc973';

// Credenciales del entrenador
const TRAINER_CREDENTIALS = {
  email: 'trainer@example.com',
  password: 'password123'
};

async function checkClientStatus() {
  try {
    console.log('🔍 Verificando estado del cliente...');
    
    // 1. Autenticar como entrenador
    console.log('🔐 Autenticando como entrenador...');
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(TRAINER_CREDENTIALS)
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Error de autenticación: ${loginResponse.status}`);
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.data.token;
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // 2. Verificar lista de clientes del entrenador
    console.log('📋 Verificando clientes del entrenador...');
    const clientsResponse = await fetch(`${BASE_URL}/clients`, { headers });
    
    if (clientsResponse.ok) {
      const clientsData = await clientsResponse.json();
      console.log('✅ Clientes del entrenador:', clientsData.data.length);
      clientsData.data.forEach(client => {
        console.log(`   - ${client.firstName} ${client.lastName} (${client.email}) - ID: ${client._id}`);
      });
    } else {
      console.log('❌ Error al obtener clientes');
    }
    
    // 3. Verificar si el cliente específico existe
    console.log(`\n🔍 Verificando cliente específico (ID: ${CLIENT_ID})...`);
    const clientResponse = await fetch(`${BASE_URL}/clients/${CLIENT_ID}`, { headers });
    
    if (clientResponse.ok) {
      const clientData = await clientResponse.json();
      console.log('✅ Cliente encontrado:', clientData.data);
    } else {
      const errorData = await clientResponse.json();
      console.log('❌ Cliente no encontrado o no asignado:', errorData.message);
    }
    
    // 4. Verificar planes existentes
    console.log('\n📊 Verificando planes existentes...');
    
    const dietResponse = await fetch(`${BASE_URL}/plans/${CLIENT_ID}/diet`, { headers });
    if (dietResponse.ok) {
      const dietData = await dietResponse.json();
      console.log('✅ Plan de dieta existente:', dietData.data.title);
    } else {
      console.log('❌ No hay plan de dieta activo');
    }
    
    const workoutResponse = await fetch(`${BASE_URL}/plans/${CLIENT_ID}/workout`, { headers });
    if (workoutResponse.ok) {
      const workoutData = await workoutResponse.json();
      console.log('✅ Plan de entrenamiento existente:', workoutData.data.title);
    } else {
      console.log('❌ No hay plan de entrenamiento activo');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Ejecutar el script
checkClientStatus(); 
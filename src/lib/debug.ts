// src/lib/debug.ts - Debug script to test API connectivity
export const debugApi = async () => {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
  
  console.log('🔍 Starting API Debug Session');
  console.log('================================');
  console.log('Base URL:', baseURL);
  console.log('Environment:', import.meta.env.MODE);
  console.log('================================');

  // Test 1: Health Check
  console.log('\n1️⃣ Testing Health Check...');
  try {
    const healthResponse = await fetch(`${baseURL.replace('/api/v1', '')}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health Check Status:', healthResponse.status);
    console.log('✅ Health Check Data:', healthData);
  } catch (error) {
    console.error('❌ Health Check Failed:', error);
  }

  // Test 2: API Base Check
  console.log('\n2️⃣ Testing API Base...');
  try {
    const apiResponse = await fetch(`${baseURL.replace('/api/v1', '')}/api`);
    const apiData = await apiResponse.json();
    console.log('✅ API Base Status:', apiResponse.status);
    console.log('✅ API Base Data:', apiData);
  } catch (error) {
    console.error('❌ API Base Failed:', error);
  }

  // Test 3: Test Registration
  console.log('\n3️⃣ Testing Registration Endpoint...');
  try {
    const testUser = {
      name: 'Test User Debug',
      email: `test${Date.now()}@debug.com`,
      password: 'testpassword123',
      role: 'user'
    };

    console.log('Sending registration request:', testUser);

    const regResponse = await fetch(`${baseURL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });

    console.log('Registration Response Status:', regResponse.status);
    console.log('Registration Response Headers:', Object.fromEntries(regResponse.headers.entries()));

    const regText = await regResponse.text();
    console.log('Registration Raw Response:', regText);

    try {
      const regData = JSON.parse(regText);
      console.log('✅ Registration Parsed Data:', regData);
    } catch (parseError) {
      console.error('❌ Failed to parse registration response as JSON:', parseError);
    }

  } catch (error) {
    console.error('❌ Registration Test Failed:', error);
  }

  // Test 4: Test Login with Demo Credentials
  console.log('\n4️⃣ Testing Login with Demo Credentials...');
  try {
    const loginData = {
      email: 'admin@erthaexchange.com',
      password: 'admin123'
    };

    console.log('Sending login request:', loginData);

    const loginResponse = await fetch(`${baseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData),
    });

    console.log('Login Response Status:', loginResponse.status);
    console.log('Login Response Headers:', Object.fromEntries(loginResponse.headers.entries()));

    const loginText = await loginResponse.text();
    console.log('Login Raw Response:', loginText);

    try {
      const loginParsed = JSON.parse(loginText);
      console.log('✅ Login Parsed Data:', loginParsed);
    } catch (parseError) {
      console.error('❌ Failed to parse login response as JSON:', parseError);
    }

  } catch (error) {
    console.error('❌ Login Test Failed:', error);
  }

  // Test 5: CORS Check
  console.log('\n5️⃣ Testing CORS...');
  try {
    const corsResponse = await fetch(`${baseURL}/auth/login`, {
      method: 'OPTIONS',
    });
    console.log('✅ CORS OPTIONS Status:', corsResponse.status);
    console.log('✅ CORS Headers:', Object.fromEntries(corsResponse.headers.entries()));
  } catch (error) {
    console.error('❌ CORS Test Failed:', error);
  }

  console.log('\n🏁 Debug Session Complete');
  console.log('================================');
};

// Helper function to add debug button to page
export const addDebugButton = () => {
  if (import.meta.env.MODE === 'development') {
    const debugButton = document.createElement('button');
    debugButton.innerHTML = '🔍 Debug API';
    debugButton.style.position = 'fixed';
    debugButton.style.top = '10px';
    debugButton.style.right = '10px';
    debugButton.style.zIndex = '9999';
    debugButton.style.padding = '10px';
    debugButton.style.backgroundColor = '#3B82F6';
    debugButton.style.color = 'white';
    debugButton.style.border = 'none';
    debugButton.style.borderRadius = '8px';
    debugButton.style.cursor = 'pointer';
    debugButton.style.fontFamily = 'monospace';
    
    debugButton.onclick = debugApi;
    
    document.body.appendChild(debugButton);
  }
};
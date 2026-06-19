const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testAuth() {
  try {
    console.log('🔵 Testing Registration...');
    
    const registerData = {
      fullName: 'Test User AnhDTD',
      email: 'anhdtd.test@example.com',
      password: '123456',
      phone: '0987654321'
    };
    
    const registerRes = await axios.post(`${API_URL}/auth/register`, registerData);
    console.log('✅ Register response:', registerRes.data);
    console.log('\n📧 Check backend console for OTP code!\n');
    
    // Simulate OTP verification (you need to get OTP from backend console)
    console.log('⚠️  To complete registration:');
    console.log('   1. Check backend terminal for OTP');
    console.log('   2. Go to /verify-email page');
    console.log('   3. Enter email and OTP');
    
  } catch (error) {
    if (error.response) {
      console.error('❌ Error:', error.response.data);
    } else {
      console.error('❌ Network Error:', error.message);
    }
  }
}

async function testLogin() {
  try {
    console.log('\n🔵 Testing Login...');
    
    const loginData = {
      email: 'anhdtd.test@example.com',
      password: '123456'
    };
    
    const loginRes = await axios.post(`${API_URL}/auth/login`, loginData);
    console.log('✅ Login successful!');
    console.log('   Token:', loginRes.data.token);
    console.log('   User:', loginRes.data.user);
    
  } catch (error) {
    if (error.response) {
      console.error('❌ Login Error:', error.response.data);
      console.log('\n💡 Possible reasons:');
      console.log('   - Email chưa verify (cần verify OTP trước)');
      console.log('   - Email hoặc password không đúng');
      console.log('   - Account bị banned');
    } else {
      console.error('❌ Network Error:', error.message);
    }
  }
}

// Run tests
(async () => {
  await testAuth();
  
  console.log('\n⏳ Waiting 2 seconds before testing login...\n');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await testLogin();
})();

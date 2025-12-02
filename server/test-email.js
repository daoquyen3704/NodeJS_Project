import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

async function testForgotPassword() {
  try {
    console.log('Testing forgot password API...');
    const response = await axios.post(`${API_URL}/api/forgot-password`, {
      email: 'quyenne3704@gmail.com',
    });
    console.log('✅ Success:', response.data);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

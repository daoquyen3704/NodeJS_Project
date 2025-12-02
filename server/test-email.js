const axios = require('axios');

async function testForgotPassword() {
    try {
        console.log('Testing forgot password API...');
        const response = await axios.post('http://localhost:3000/api/forgot-password', {
            email: 'quyenne3704@gmail.com'
        });
        console.log('✅ Success:', response.data);
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testForgotPassword();

// Test đăng nhập trực tiếp
const axios = require('axios');

async function testLogin() {
    try {
        const response = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'testaddress@test.com',
            password: 'password123'
        });
        
        console.log('✅ Login response:', JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.error('❌ Login error:', error.response?.data || error.message);
        
        // Thử với tài khoản khác
        try {
            console.log('Thử với admin account...');
            const adminResponse = await axios.post('http://localhost:5000/api/auth/login', {
                email: 'admin@admin.com',
                password: 'admin123'
            });
            
            console.log('✅ Admin login:', JSON.stringify(adminResponse.data, null, 2));
            
        } catch (adminError) {
            console.error('❌ Admin login error:', adminError.response?.data);
        }
    }
}

testLogin();

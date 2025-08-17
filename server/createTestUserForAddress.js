// Tạo user test để thử nghiệm
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function createTestUser() {
    try {
        console.log('🧪 Tạo user test...');
        
        // Tạo user test
        const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
            name: 'Test User Address',
            email: 'testaddress@test.com',
            password: 'password123',
            phone: '0123456789'
        });
        
        console.log('✅ Đã tạo user test:', registerResponse.data.user?.name);
        
        // Đăng nhập
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: 'testaddress@test.com', 
            password: 'password123'
        });
        
        console.log('✅ Đăng nhập thành công');
        console.log('👤 User:', JSON.stringify(loginResponse.data, null, 2));
        
        return loginResponse.data;
        
    } catch (error) {
        if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
            console.log('📝 User đã tồn tại, thử đăng nhập...');
            
            const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
                email: 'testaddress@test.com',
                password: 'password123'
            });
            
            console.log('✅ Đăng nhập thành công');
            return loginResponse.data;
            
        } else {
            console.error('❌ Lỗi tạo user:', error.response?.data || error.message);
        }
    }
}

createTestUser();

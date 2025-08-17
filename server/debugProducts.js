// Debug products API
const axios = require('axios');

async function debugProducts() {
    try {
        // Login admin
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@test.com',
            password: 'admin123'
        });
        
        console.log('Admin login:', loginRes.data.success);
        const token = loginRes.data.data.token;
        
        // Get products
        const productsRes = await axios.get('http://localhost:5000/api/products?limit=1', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Products response structure:');
        console.log('success:', productsRes.data.success);
        console.log('data keys:', Object.keys(productsRes.data.data || {}));
        console.log('Full response:', JSON.stringify(productsRes.data, null, 2));
        
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

debugProducts();

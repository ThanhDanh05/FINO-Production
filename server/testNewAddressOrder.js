// Test script để tạo đơn hàng với địa chỉ mới
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testOrderWithNewAddress() {
    console.log('🧪 Bắt đầu test quy trình đặt hàng với địa chỉ mới...');
    
    try {
        // 1. Đăng nhập admin để lấy sản phẩm, sau đó đăng nhập user
        console.log('📋 Bước 1: Đăng nhập admin để lấy sản phẩm...');
        const adminLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: 'admin@test.com',
            password: 'admin123'
        });
        
        const adminToken = adminLoginResponse.data.data.token;
        
        // 2. Lấy danh sách sản phẩm với admin token
        console.log('📋 Bước 2: Lấy sản phẩm...');
        const productsResponse = await axios.get(`${API_BASE}/products?limit=1`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const product = productsResponse.data.data.data[0];
        console.log('✅ Sản phẩm được chọn:', product.name);
        console.log('📊 Product info:', {
            id: product._id,
            sizes: product.sizes,
            colors: product.colors,
            variants: product.variants
        });
        
        // 3. Đăng nhập user để test
        console.log('📋 Bước 3: Đăng nhập user...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: 'testaddress@test.com',
            password: 'password123'
        });
        
        const userToken = loginResponse.data.data.token;
        const userId = loginResponse.data.data.user._id;
        const userName = loginResponse.data.data.user.name;
        
        console.log('✅ Đăng nhập user thành công:', userName);
        
        // 4. Bỏ qua bước thêm vào giỏ hàng, tạo order trực tiếp
        console.log('📋 Bước 4: Bỏ qua giỏ hàng, tạo order trực tiếp...');
        
        // 5. Tạo địa chỉ mới
        console.log('📋 Bước 5: Tạo địa chỉ giao hàng mới...');
        const newAddressResponse = await axios.post(`${API_BASE}/users/addresses`, {
            street: '123 Đường Test Mới',
            ward: 'Phường Test',
            district: 'Quận Test',
            city: 'TP.HCM',
            phone: '0987654321',
            recipientName: 'Người Nhận Test',
            isDefault: true // Đặt làm địa chỉ mặc định
        }, {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        
        const newAddress = newAddressResponse.data.address;
        console.log('✅ Đã tạo địa chỉ mới:', newAddress.street);
        
        // 6. Tạo đơn hàng
        console.log('📋 Bước 6: Tạo đơn hàng...');
        const orderResponse = await axios.post(`${API_BASE}/orders`, {
            addressId: newAddress._id,
            paymentMethod: 'COD',
            items: [{
                productId: product._id,
                quantity: 1,
                size: product.sizes ? product.sizes[0] : 'M',
                color: product.colors ? product.colors[0] : 'default',
                price: product.salePrice || product.price
            }]
        }, {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        
        const order = orderResponse.data.order;
        console.log('✅ Đã tạo đơn hàng:', order.orderCode);
        
        // 7. Kiểm tra thông tin đơn hàng
        console.log('📋 Bước 7: Kiểm tra thông tin đơn hàng...');
        const orderDetailResponse = await axios.get(`${API_BASE}/orders/${order._id}`, {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        
        const orderDetail = orderDetailResponse.data.order;
        console.log('📊 Thông tin đơn hàng:');
        console.log('   - Mã đơn hàng:', orderDetail.orderCode);
        console.log('   - Địa chỉ giao hàng:', orderDetail.shippingAddress?.street);
        console.log('   - Người nhận:', orderDetail.shippingAddress?.recipientName);
        console.log('   - Số điện thoại:', orderDetail.shippingAddress?.phone);
        console.log('   - Thành phố:', orderDetail.shippingAddress?.city);
        
        console.log('🎉 Test hoàn tất! Bây giờ hãy kiểm tra admin panel:');
        console.log(`   👉 Admin URL: http://localhost:3002/admin/orders`);
        console.log(`   👉 Tìm đơn hàng: ${orderDetail.orderCode}`);
        console.log(`   👉 Kiểm tra địa chỉ có đúng là: ${newAddress.street}`);
        
        return {
            orderId: order._id,
            orderCode: order.orderCode,
            newAddress: newAddress
        };
        
    } catch (error) {
        console.error('❌ Lỗi trong quá trình test:', error.response?.data || error.message);
    }
}

// Chạy test
testOrderWithNewAddress();

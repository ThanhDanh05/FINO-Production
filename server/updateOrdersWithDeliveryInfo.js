const mongoose = require('mongoose');
const Order = require('./models/OrderSchema');

// Kết nối database trực tiếp
async function connectDB() {
  try {
    const DB_URI = 'mongodb+srv://finodev01:0101001@cluster0.pfafcr6.mongodb.net/asm?retryWrites=true&w=majority';
    await mongoose.connect(DB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

const deliveryPersons = [
  {
    name: 'Nguyễn Văn Thành',
    phone: '0901234567',
    company: 'FINO Express',
    vehicleNumber: '29A-12345',
    avatar: null
  },
  {
    name: 'Trần Minh Đức',
    phone: '0987654321', 
    company: 'FINO Express',
    vehicleNumber: '30B-98765',
    avatar: null
  },
  {
    name: 'Lê Hoàng Nam',
    phone: '0912345678',
    company: 'FINO Express', 
    vehicleNumber: '31C-11111',
    avatar: null
  },
  {
    name: 'Phạm Văn Chiếu',
    phone: '0923456789',
    company: 'FINO Express',
    vehicleNumber: '32D-22222',
    avatar: null
  },
  {
    name: 'Võ Minh Tâm',
    phone: '0934567890',
    company: 'FINO Express',
    vehicleNumber: '33E-33333',
    avatar: null
  }
];

function generateTrackingNumber() {
  const prefix = 'FE';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

function generateEstimatedDelivery() {
  const now = new Date();
  // Thêm 1-3 ngày cho giao hàng
  const daysToAdd = Math.floor(Math.random() * 3) + 1;
  const estimatedTime = new Date(now.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
  
  // Set thời gian giao hàng trong khoảng 8h-18h
  const deliveryHour = Math.floor(Math.random() * 10) + 8; // 8-17h
  const deliveryMinute = Math.floor(Math.random() * 60);
  
  estimatedTime.setHours(deliveryHour, deliveryMinute, 0, 0);
  return estimatedTime;
}

async function updateOrdersWithDeliveryInfo() {
  try {
    // Kết nối database trước
    await connectDB();
    
    console.log('🚀 Starting to update orders with delivery information...');
    
    // Lấy tất cả đơn hàng có status là shipped hoặc delivered
    const orders = await Order.find({
      status: { $in: ['shipped', 'delivered'] }
    });
    
    console.log(`📦 Found ${orders.length} orders to update`);
    
    let updatedCount = 0;
    
    for (const order of orders) {
      // Chọn ngẫu nhiên một người giao hàng
      const randomDeliveryPerson = deliveryPersons[Math.floor(Math.random() * deliveryPersons.length)];
      
      // Tạo tracking number
      const trackingNumber = generateTrackingNumber();
      
      // Tạo thời gian giao hàng dự kiến
      const estimatedDelivery = generateEstimatedDelivery();
      
      // Tạo thời gian shipped (1 ngày trước estimated delivery)
      const shippedAt = new Date(estimatedDelivery.getTime() - (24 * 60 * 60 * 1000));
      
      // Nếu đơn hàng đã delivered, tạo thời gian delivered
      let deliveredAt = null;
      if (order.status === 'delivered') {
        // Delivered trong vòng 0-2 ngày sau shipped
        const daysAfterShipped = Math.floor(Math.random() * 3);
        deliveredAt = new Date(shippedAt.getTime() + (daysAfterShipped * 24 * 60 * 60 * 1000));
        
        // Set thời gian delivered trong khoảng 8h-20h
        const deliveredHour = Math.floor(Math.random() * 12) + 8; // 8-19h
        const deliveredMinute = Math.floor(Math.random() * 60);
        deliveredAt.setHours(deliveredHour, deliveredMinute, 0, 0);
      }
      
      // Cập nhật đơn hàng
      const updateData = {
        deliveryPerson: randomDeliveryPerson,
        trackingNumber,
        estimatedDelivery,
        shippedAt
      };
      
      if (deliveredAt) {
        updateData.deliveredAt = deliveredAt;
      }
      
      await Order.updateOne(
        { _id: order._id },
        { $set: updateData }
      );
      
      updatedCount++;
      
      console.log(`✅ Updated order ${order.orderCode} with delivery info:`, {
        deliveryPerson: randomDeliveryPerson.name,
        trackingNumber,
        phone: randomDeliveryPerson.phone
      });
    }
    
    console.log(`🎉 Successfully updated ${updatedCount} orders with delivery information!`);
    
    // Hiển thị một số orders để kiểm tra
    console.log('\n📋 Sample updated orders:');
    const sampleOrders = await Order.find({
      status: { $in: ['shipped', 'delivered'] }
    }).limit(3).select('orderCode status deliveryPerson trackingNumber estimatedDelivery');
    
    sampleOrders.forEach(order => {
      console.log(`- ${order.orderCode}: ${order.deliveryPerson?.name} (${order.deliveryPerson?.phone}) - ${order.trackingNumber}`);
    });
    
  } catch (error) {
    console.error('❌ Error updating orders:', error);
  } finally {
    console.log('🔌 Closing database connection...');
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Chạy script
updateOrdersWithDeliveryInfo();

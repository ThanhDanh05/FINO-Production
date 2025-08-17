require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/OrderSchema');
const DeliveryDriver = require('./models/DeliveryDriverSchema');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fino_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const updateOrderWithDriver = async () => {
  try {
    console.log('🚀 Starting order update with delivery driver...');
    
    await connectDB();

    // Lấy tất cả drivers
    const drivers = await DeliveryDriver.find({ isActive: true });
    console.log(`📋 Found ${drivers.length} active drivers`);

    if (drivers.length === 0) {
      console.log('❌ No active drivers found! Please run seedDeliveryDrivers.js first');
      return;
    }

    // Lấy đơn hàng đầu tiên có status shipped hoặc delivered
    let order = await Order.findOne({ 
      status: { $in: ['shipped', 'delivered'] } 
    });

    // Nếu không có đơn hàng nào shipped/delivered, lấy đơn hàng đầu tiên
    if (!order) {
      order = await Order.findOne().sort({ createdAt: -1 });
      if (order) {
        // Cập nhật status thành shipped
        order.status = 'shipped';
        console.log(`📦 Updated order ${order.orderCode} status to shipped`);
      }
    }

    if (!order) {
      console.log('❌ No orders found in database');
      return;
    }

    // Chọn driver ngẫu nhiên
    const randomDriver = drivers[Math.floor(Math.random() * drivers.length)];
    
    // Cập nhật đơn hàng với thông tin tài xế
    order.deliveryDriver = randomDriver._id;
    order.deliveryInfo = {
      estimatedDeliveryTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // +1 ngày
      deliveryNotes: 'Gọi trước khi giao hàng 15 phút',
      trackingNumber: `FE${order.orderCode.replace('FINO', '')}${Math.random().toString().slice(-6)}`,
      deliveryAttempts: 0,
      deliveryStatus: 'in_transit'
    };

    await order.save();

    console.log('✅ Order updated successfully!');
    console.log(`📦 Order: ${order.orderCode}`);
    console.log(`🚚 Driver: ${randomDriver.name} (${randomDriver.phone})`);
    console.log(`🚗 Vehicle: ${randomDriver.vehicleTypeName || randomDriver.vehicleType} - ${randomDriver.vehicleNumber}`);
    console.log(`📋 Tracking: ${order.deliveryInfo.trackingNumber}`);
    console.log(`📅 Estimated Delivery: ${order.deliveryInfo.estimatedDeliveryTime.toLocaleDateString('vi-VN')}`);

  } catch (error) {
    console.error('❌ Error updating order:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📋 Database connection closed');
  }
};

// Run the update
updateOrderWithDriver();

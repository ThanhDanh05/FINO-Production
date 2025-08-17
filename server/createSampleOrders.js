require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/OrderSchema');
const User = require('./models/UserSchema');
const Address = require('./models/AddressSchema');
const PaymentMethod = require('./models/PaymentMethodSchema');
const DeliveryDriver = require('./models/DeliveryDriverSchema');
const ProductVariant = require('./models/ProductVariantSchema');

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

const createSampleOrders = async () => {
  try {
    console.log('🚀 Starting sample orders creation...');
    
    await connectDB();

    // Get sample data
    const user = await User.findOne({ role: 'customer' });
    const address = await Address.findOne();
    const paymentMethod = await PaymentMethod.findOne();
    const drivers = await DeliveryDriver.find({ isActive: true });
    const productVariants = await ProductVariant.find().populate('product').limit(5);

    if (!user || !address || !paymentMethod || drivers.length === 0 || productVariants.length === 0) {
      console.log('❌ Required data not found. Please ensure you have users, addresses, payment methods, drivers, and products in the database');
      return;
    }

    // Create sample orders
    const sampleOrders = [];

    for (let i = 0; i < 3; i++) {
      const orderCode = await Order.generateOrderCode();
      const randomDriver = drivers[Math.floor(Math.random() * drivers.length)];
      const randomVariant = productVariants[Math.floor(Math.random() * productVariants.length)];
      
      const quantity = Math.floor(Math.random() * 3) + 1;
      const price = randomVariant.product.salePrice || randomVariant.product.price;
      const total = price * quantity;
      const shippingFee = 20000;
      const finalTotal = total + shippingFee;

      const orderData = {
        orderCode,
        user: user._id,
        items: [{
          productVariant: randomVariant._id,
          quantity,
          price,
          totalPrice: total
        }],
        address: address._id,
        total,
        shippingFee,
        finalTotal,
        status: i === 0 ? 'shipped' : i === 1 ? 'delivered' : 'processing',
        paymentMethod: paymentMethod._id,
        paymentStatus: 'paid',
        deliveryDriver: randomDriver._id,
        deliveryInfo: {
          estimatedDeliveryTime: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
          deliveryNotes: `Gọi trước khi giao hàng 15 phút`,
          trackingNumber: `FE${orderCode.replace('FINO', '')}${Math.random().toString().slice(-6)}`,
          deliveryAttempts: 0,
          deliveryStatus: i === 0 ? 'in_transit' : i === 1 ? 'delivered' : 'assigned'
        }
      };

      sampleOrders.push(orderData);
    }

    // Insert orders
    const createdOrders = await Order.insertMany(sampleOrders);
    console.log(`✅ Created ${createdOrders.length} sample orders`);

    // Display created orders
    for (const order of createdOrders) {
      const populatedOrder = await Order.findById(order._id)
        .populate('deliveryDriver', 'name phone vehicleType vehicleNumber')
        .populate('user', 'name email');
      
      console.log(`📦 Order: ${populatedOrder.orderCode}`);
      console.log(`   Status: ${populatedOrder.status}`);
      console.log(`   Driver: ${populatedOrder.deliveryDriver?.name} (${populatedOrder.deliveryDriver?.phone})`);
      console.log(`   Customer: ${populatedOrder.user?.name}`);
      console.log(`   Total: ${populatedOrder.finalTotal.toLocaleString()}đ`);
      console.log('   ---');
    }

    console.log('✅ Sample orders creation completed successfully!');
  } catch (error) {
    console.error('❌ Error creating sample orders:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📋 Database connection closed');
  }
};

// Run the creation
createSampleOrders();

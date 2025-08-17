const mongoose = require('mongoose');
const Order = require('./models/OrderSchema');
const Address = require('./models/AddressSchema');
const User = require('./models/UserSchema');

mongoose.connect('mongodb+srv://finodev01:0101001@cluster0.pfafcr6.mongodb.net/asm?retryWrites=true&w=majority').then(async () => {
  console.log('Connected to DB');
  
  // Get multiple sample orders with populated address
  const orders = await Order.find()
    .populate('user', 'name email')
    .populate('address')
    .limit(5);
  
  if (orders.length > 0) {
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      console.log(`\n=== ORDER ${i + 1} ===`);
      console.log('Order ID:', order._id);
      console.log('Order Code:', order.orderCode);
      console.log('User Name:', order.user.name);
      
      if (!order.address) {
        console.log('❌ ORDER HAS NO ADDRESS!');
        continue;
      }
      
      console.log('Address ID in Order:', order.address._id);
      console.log('Address Data:', {
        addressLine: order.address.addressLine,
        isDefault: order.address.isDefault,
        city: order.address.city,
        phone: order.address.phone
      });
      
      // Get all addresses of this user
      const allAddresses = await Address.find({ user: order.user._id });
      console.log(`All addresses count: ${allAddresses.length}`);
      
      // Check if order address is the default one
      const defaultAddress = allAddresses.find(addr => addr.isDefault);
      const firstAddress = allAddresses[0];
      
      console.log('Default address ID:', defaultAddress?._id);
      console.log('First address ID:', firstAddress?._id);
      console.log('Order address ID:', order.address._id);
      console.log('Is order using default address?', order.address._id.toString() === defaultAddress?._id.toString());
      console.log('Is order using first address?', order.address._id.toString() === firstAddress?._id.toString());
      
      if (allAddresses.length > 1) {
        console.log('Multiple addresses detected!');
        allAddresses.forEach((addr, idx) => {
          console.log(`  Address ${idx + 1}: ${addr.addressLine} (isDefault: ${addr.isDefault})`);
        });
      }
    }
  } else {
    console.log('No orders found');
  }
  
  mongoose.disconnect();
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

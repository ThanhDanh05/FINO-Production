require('dotenv').config();
const mongoose = require('mongoose');
const DeliveryDriver = require('./models/DeliveryDriverSchema');

const sampleDrivers = [
  {
    name: 'Nguyễn Văn Anh',
    phone: '0901234567',
    email: 'nguyenvananh@delivery.com',
    vehicleType: 'motorbike',
    vehicleNumber: '59-H1 12345',
    licenseNumber: 'B12345678',
    isActive: true,
    currentLocation: {
      latitude: 10.8231,
      longitude: 106.6297,
      address: 'Quận 1, TP.HCM'
    },
    rating: 4.8,
    totalDeliveries: 245,
    avatar: null
  },
  {
    name: 'Trần Thị Bích',
    phone: '0912345678',
    email: 'tranthibich@delivery.com',
    vehicleType: 'motorbike',
    vehicleNumber: '59-G2 67890',
    licenseNumber: 'B23456789',
    isActive: true,
    currentLocation: {
      latitude: 10.7769,
      longitude: 106.7009,
      address: 'Quận 7, TP.HCM'
    },
    rating: 4.9,
    totalDeliveries: 189,
    avatar: null
  },
  {
    name: 'Lê Minh Tuấn',
    phone: '0923456789',
    email: 'leminhtuan@delivery.com',
    vehicleType: 'car',
    vehicleNumber: '59-A 123.45',
    licenseNumber: 'C34567890',
    isActive: true,
    currentLocation: {
      latitude: 10.8142,
      longitude: 106.6438,
      address: 'Quận 3, TP.HCM'
    },
    rating: 4.7,
    totalDeliveries: 156,
    avatar: null
  },
  {
    name: 'Phạm Văn Đức',
    phone: '0934567890',
    email: 'phamvanduc@delivery.com',
    vehicleType: 'motorbike',
    vehicleNumber: '59-F3 45678',
    licenseNumber: 'B45678901',
    isActive: true,
    currentLocation: {
      latitude: 10.8505,
      longitude: 106.7717,
      address: 'Quận 2, TP.HCM'
    },
    rating: 4.6,
    totalDeliveries: 298,
    avatar: null
  },
  {
    name: 'Hoàng Thị Mai',
    phone: '0945678901',
    email: 'hoangthimai@delivery.com',
    vehicleType: 'motorbike',
    vehicleNumber: '59-H2 78901',
    licenseNumber: 'B56789012',
    isActive: true,
    currentLocation: {
      latitude: 10.7546,
      longitude: 106.6645,
      address: 'Quận 4, TP.HCM'
    },
    rating: 4.9,
    totalDeliveries: 201,
    avatar: null
  }
];

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

const seedDeliveryDrivers = async () => {
  try {
    console.log('🚀 Starting delivery drivers seeding...');
    
    await connectDB();

    // Clear existing drivers
    await DeliveryDriver.deleteMany({});
    console.log('🗑️  Cleared existing delivery drivers');

    // Insert new drivers
    const createdDrivers = await DeliveryDriver.insertMany(sampleDrivers);
    console.log(`✅ Created ${createdDrivers.length} delivery drivers`);

    // Display created drivers
    createdDrivers.forEach((driver, index) => {
      console.log(`${index + 1}. ${driver.name} - ${driver.phone} - ${driver.vehicleTypeName} (${driver.vehicleNumber})`);
    });

    console.log('✅ Delivery drivers seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding delivery drivers:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📋 Database connection closed');
  }
};

// Run the seeding
seedDeliveryDrivers();

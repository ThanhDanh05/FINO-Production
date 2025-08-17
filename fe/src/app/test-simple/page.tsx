// Simple test page to check if images work
'use client';

export default function TestSimplePage() {
  const testImages = [
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500',
    'https://product.hstatic.net/200000041406/product/img_1069_078512292b32459190fe82b98124fab6_master.png',
    'https://via.placeholder.com/300x300?text=Test+Image'
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h1>Test Hình Ảnh Đơn Giản</h1>
      
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {testImages.map((image, index) => (
          <div key={index} style={{ border: '1px solid #ccc', padding: '10px' }}>
            <h3>Image {index + 1}</h3>
            <p style={{ fontSize: '10px', wordBreak: 'break-all' }}>URL: {image}</p>
            <img 
              src={image} 
              alt={`Test image ${index + 1}`}
              style={{ 
                width: '200px', 
                height: '200px', 
                objectFit: 'cover',
                border: '1px solid #ddd'
              }}
              onError={(e) => {
                console.error(`Test image ${index + 1} failed:`, image);
                e.currentTarget.src = 'https://via.placeholder.com/200x200?text=ERROR';
              }}
              onLoad={() => {
                console.log(`Test image ${index + 1} loaded:`, image);
              }}
            />
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: '30px' }}>
        <h2>Direct Product Test</h2>
        <img
          src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500"
          alt="Direct test"
          style={{ width: '300px', height: '300px', objectFit: 'cover' }}
        />
      </div>
    </div>
  );
}

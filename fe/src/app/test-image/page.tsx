// Test component để kiểm tra hình ảnh
'use client';

import { useEffect, useState } from 'react';

export default function TestImagePage() {
  const [product, setProduct] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/products/6874ee0f1401ccefbc67e887')
      .then(res => res.json())
      .then(data => {
        console.log('Product data:', data);
        setProduct(data);
      })
      .catch(err => console.error('Error:', err));
  }, []);

  if (!product) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Test Hình Ảnh Sản Phẩm</h1>
      <h2>{product.name}</h2>
      
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {product.images?.map((image, index) => (
          <div key={index} style={{ border: '1px solid #ccc', padding: '10px' }}>
            <h4>Ảnh {index + 1}</h4>
            <p style={{ fontSize: '12px', wordBreak: 'break-all' }}>URL: {image}</p>
            <img 
              src={image} 
              alt={`${product.name} ${index + 1}`}
              style={{ 
                width: '200px', 
                height: '200px', 
                objectFit: 'cover',
                border: '1px solid #ddd'
              }}
              onError={(e) => {
                console.error(`Image ${index + 1} failed to load:`, image);
                e.target.src = 'https://via.placeholder.com/200x200?text=Error+Loading+Image';
              }}
              onLoad={() => {
                console.log(`Image ${index + 1} loaded successfully:`, image);
              }}
            />
          </div>
        ))}
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Product Variants Images:</h3>
        {product.variants?.map((variant, vIndex) => (
          <div key={vIndex} style={{ border: '1px solid #eee', margin: '10px', padding: '10px' }}>
            <h4>Variant: {variant.color?.name} - {variant.size?.name}</h4>
            {variant.images?.map((image, iIndex) => (
              <div key={iIndex} style={{ display: 'inline-block', margin: '5px' }}>
                <p style={{ fontSize: '10px' }}>Variant Image {iIndex + 1}</p>
                <img 
                  src={image} 
                  alt={`Variant ${vIndex + 1} Image ${iIndex + 1}`}
                  style={{ 
                    width: '100px', 
                    height: '100px', 
                    objectFit: 'cover',
                    border: '1px solid #ccc'
                  }}
                  onError={(e) => {
                    console.error(`Variant image failed:`, image);
                    e.target.src = 'https://via.placeholder.com/100x100?text=Error';
                  }}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

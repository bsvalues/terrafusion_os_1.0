const express = require('express');
const path = require('path');
const app = express();
const PORT = 5000;

// Sample property data
const properties = [
  {
    id: 1,
    address: "123 Main Street",
    city: "Seattle", 
    state: "WA",
    zipCode: "98101",
    price: 750000,
    bedrooms: 4,
    bathrooms: 3,
    sqft: 2200,
    description: "Beautiful modern home with open floor plan",
    imageUrl: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600"
  },
  {
    id: 2,
    address: "456 Oak Avenue",
    city: "Portland",
    state: "OR", 
    zipCode: "97205",
    price: 550000,
    bedrooms: 3,
    bathrooms: 2.5,
    sqft: 1800,
    description: "Modern townhouse in downtown with rooftop deck",
    imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600"
  },
  {
    id: 3,
    address: "789 Pine Lane",
    city: "San Francisco",
    state: "CA",
    zipCode: "94107", 
    price: 1250000,
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1400,
    description: "Luxury condo with high-end finishes",
    imageUrl: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600"
  },
  {
    id: 4,
    address: "321 Maple Drive",
    city: "Denver",
    state: "CO",
    zipCode: "80202",
    price: 680000,
    bedrooms: 4,
    bathrooms: 3,
    sqft: 2400,
    description: "Spacious family home with large backyard",
    imageUrl: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600"
  },
  {
    id: 5,
    address: "654 Birch Street",
    city: "Austin",
    state: "TX",
    zipCode: "78704",
    price: 820000,
    bedrooms: 5,
    bathrooms: 4,
    sqft: 3000,
    description: "New construction home with premium finishes",
    imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600"
  },
  {
    id: 6,
    address: "987 Cedar Court",
    city: "Chicago",
    state: "IL",
    zipCode: "60611",
    price: 520000,
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1350,
    description: "Elegant condo in downtown with hardwood floors",
    imageUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600"
  }
];

// API endpoint for properties
app.get('/api/properties', (req, res) => {
  res.json({ properties });
});

// Serve static HTML directly for the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Real Estate App running at http://localhost:${PORT}`);
});
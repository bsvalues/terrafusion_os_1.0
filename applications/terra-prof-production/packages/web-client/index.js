/**
 * TerraFusionPro Web Client - Simple Express Server
 */

const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;

// Sample data - Properties
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

// API endpoints
app.get('/api/properties', (req, res) => {
  res.json({ properties });
});

// Create public directory if it doesn't exist
const fs = require('fs');
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Simple HTML page with inline JavaScript
const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TerraFusionPro</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f8f9fa;
    }
    .navbar-brand {
      font-weight: bold;
      color: #0d6efd;
    }
    .property-card {
      transition: transform 0.3s;
      height: 100%;
    }
    .property-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 20px rgba(0,0,0,0.1);
    }
    .property-img {
      height: 200px;
      object-fit: cover;
    }
    .price {
      font-size: 1.25rem;
      font-weight: bold;
      color: #0d6efd;
    }
    .banner {
      background: linear-gradient(to right, #0d6efd, #0dcaf0);
      color: white;
      padding: 4rem 0;
    }
    .details-badge {
      background-color: #e9ecef;
      color: #495057;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <!-- Navigation -->
  <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
    <div class="container">
      <a class="navbar-brand" href="#">TerraFusionPro</a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav ms-auto">
          <li class="nav-item">
            <a class="nav-link active" href="#">Home</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="#properties">Properties</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="#analytics">Analytics</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="#contact">Contact</a>
          </li>
        </ul>
      </div>
    </div>
  </nav>

  <!-- Banner -->
  <section class="banner mb-5">
    <div class="container text-center py-5">
      <h1 class="display-4 fw-bold mb-3">TerraFusionPro</h1>
      <p class="lead mb-4">Advanced Real Estate Technology Platform</p>
      <button class="btn btn-light btn-lg px-4">Explore Properties</button>
    </div>
  </section>

  <!-- Properties Section -->
  <section class="container mb-5" id="properties">
    <h2 class="text-center mb-4">Featured Properties</h2>
    <div class="row g-4" id="properties-container">
      <!-- Properties will be loaded here -->
      <div class="col-12 text-center">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
    </div>
  </section>

  <!-- Analytics Section -->
  <section class="bg-light py-5 mb-5" id="analytics">
    <div class="container">
      <h2 class="text-center mb-4">Market Insights</h2>
      <div class="row">
        <div class="col-md-6 mb-4">
          <div class="card h-100">
            <div class="card-body">
              <h5 class="card-title">Price Trends</h5>
              <p class="card-text">Average property prices have increased by 8.7% in the last 12 months.</p>
              <div class="mt-3">
                <div class="d-flex justify-content-between mb-1">
                  <span>Seattle</span>
                  <span class="text-primary">+12.3%</span>
                </div>
                <div class="progress mb-3" style="height: 10px;">
                  <div class="progress-bar" style="width: 76%"></div>
                </div>
                
                <div class="d-flex justify-content-between mb-1">
                  <span>Portland</span>
                  <span class="text-primary">+8.5%</span>
                </div>
                <div class="progress mb-3" style="height: 10px;">
                  <div class="progress-bar" style="width: 65%"></div>
                </div>
                
                <div class="d-flex justify-content-between mb-1">
                  <span>San Francisco</span>
                  <span class="text-primary">+6.2%</span>
                </div>
                <div class="progress mb-3" style="height: 10px;">
                  <div class="progress-bar" style="width: 58%"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-6 mb-4">
          <div class="card h-100">
            <div class="card-body">
              <h5 class="card-title">Inventory by Property Type</h5>
              <p class="card-text">Current distribution of property types in our database.</p>
              <div class="mt-3">
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <div>Single Family</div>
                  <span class="badge bg-primary">42%</span>
                </div>
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <div>Condo</div>
                  <span class="badge bg-primary">27%</span>
                </div>
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <div>Townhouse</div>
                  <span class="badge bg-primary">18%</span>
                </div>
                <div class="d-flex justify-content-between align-items-center">
                  <div>Multi-Family</div>
                  <span class="badge bg-primary">13%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Contact Section -->
  <section class="container mb-5" id="contact">
    <h2 class="text-center mb-4">Contact Us</h2>
    <div class="row justify-content-center">
      <div class="col-md-8">
        <div class="card">
          <div class="card-body">
            <form>
              <div class="mb-3">
                <label for="name" class="form-label">Name</label>
                <input type="text" class="form-control" id="name" placeholder="Your Name">
              </div>
              <div class="mb-3">
                <label for="email" class="form-label">Email</label>
                <input type="email" class="form-control" id="email" placeholder="your.email@example.com">
              </div>
              <div class="mb-3">
                <label for="message" class="form-label">Message</label>
                <textarea class="form-control" id="message" rows="5" placeholder="How can we help you?"></textarea>
              </div>
              <div class="text-center">
                <button type="submit" class="btn btn-primary px-4">Send Message</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="bg-dark text-white py-4">
    <div class="container">
      <div class="row">
        <div class="col-md-6">
          <h5>TerraFusionPro</h5>
          <p class="small">Advanced Real Estate Technology Platform</p>
          <p class="small">&copy; 2023-2025 TerraFusionPro. All rights reserved.</p>
        </div>
        <div class="col-md-6 text-md-end">
          <h5>Contact</h5>
          <p class="small">info@terrafusionpro.com</p>
          <p class="small">1-800-TERRA-PRO</p>
        </div>
      </div>
    </div>
  </footer>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script>
  <script>
    // Fetch properties
    fetch('/api/properties')
      .then(response => response.json())
      .then(data => {
        const propertiesContainer = document.getElementById('properties-container');
        
        if (data.properties && data.properties.length > 0) {
          let html = '';
          
          data.properties.forEach(property => {
            html += '<div class="col-md-6 col-lg-4">' +
                '<div class="card property-card">' +
                  '<img src="' + property.imageUrl + '" class="card-img-top property-img" alt="' + property.address + '">' +
                  '<div class="card-body">' +
                    '<h5 class="card-title">' + property.address + '</h5>' +
                    '<p class="card-subtitle mb-2 text-muted">' + property.city + ', ' + property.state + ' ' + property.zipCode + '</p>' +
                    '<p class="price">$' + property.price.toLocaleString() + '</p>' +
                    '<div class="d-flex gap-2 mb-3">' +
                      '<span class="badge details-badge">' + property.bedrooms + ' beds</span>' +
                      '<span class="badge details-badge">' + property.bathrooms + ' baths</span>' +
                      '<span class="badge details-badge">' + property.sqft.toLocaleString() + ' sqft</span>' +
                    '</div>' +
                    '<p class="card-text">' + property.description + '</p>' +
                    '<button class="btn btn-primary" onclick="alert(\'Property details for ID: ' + property.id + '\')">View Details</button>' +
                  '</div>' +
                '</div>' +
              '</div>';
          });
          
          propertiesContainer.innerHTML = html;
        } else {
          propertiesContainer.innerHTML = '<div class="col-12"><p class="text-center">No properties found</p></div>';
        }
      })
      .catch(error => {
        console.error('Error loading properties:', error);
        document.getElementById('properties-container').innerHTML = 
          '<div class="col-12"><div class="alert alert-danger">Failed to load properties. Please try again later.</div></div>';
      });
  </script>
</body>
</html>
`;

// Write the HTML file
fs.writeFileSync(path.join(publicDir, 'index.html'), html);

// Serve static file (simple index.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Serve static files
app.use(express.static(publicDir));

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`TerraFusionPro Web Client running on port ${PORT}`);
});
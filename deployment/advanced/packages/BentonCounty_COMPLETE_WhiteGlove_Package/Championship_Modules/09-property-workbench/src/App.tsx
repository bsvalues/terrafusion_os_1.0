import "./terrafusion-brand.css";
import { useState, useEffect } from "react";
import "./App.css";

interface Property {
  id: string;
  address: string;
  owner: string;
  value: number;
  status: 'active' | 'pending' | 'sold';
  type: 'residential' | 'commercial' | 'industrial';
}

function App() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Load sample properties
    setProperties([
      {
        id: '1',
        address: '123 Main St, Springfield, IL',
        owner: 'John Smith',
        value: 285000,
        status: 'active',
        type: 'residential'
      },
      {
        id: '2',
        address: '456 Oak Ave, Springfield, IL',
        owner: 'Jane Doe',
        value: 450000,
        status: 'pending',
        type: 'commercial'
      }
    ]);
  }, []);

  const filteredProperties = properties.filter(property =>
    property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.owner.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="workbench-container">
      <header className="workbench-header"><>

        <h1 className="tf-gradient-text">🏢 PropertyWorkbench</h1>
        <p
</>

</>>Professional Property Management Platform</p>
      </header>

      <div className="workbench-content">
        <div className="search-panel"><>

          <input
            type="text"
            placeholder="Search properties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div
</>

className="properties-grid">
          {filteredProperties.map(property => (
            <div
              key={property.id}
              className="tf-card property-card"
              onClick={() => setSelectedProperty(property)}
            ><>

              <h3>{property.address}</h3>
              <p
</>

</>><strong>Owner:</strong> {property.owner}</p>
              <p><strong>Value:</strong> ${property.value.toLocaleString()}</p>
              <p><strong>Type:</strong> {property.type}</p>
              <span className={`status-badge ${property.status}`}>
                {property.status.toUpperCase()}
              </span>
            </div>
          ))}
        </div>

        {selectedProperty && (
          <div className="property-details"><>

            <h2>Property Details</h2>
            <p
</>

</>><strong>Address:</strong> {selectedProperty.address}</p>
            <p><strong>Owner:</strong> {selectedProperty.owner}</p>
            <p><strong>Value:</strong> ${selectedProperty.value.toLocaleString()}</p>
            <p><strong>Type:</strong> {selectedProperty.type}</p>
            <p><strong>Status:</strong> {selectedProperty.status}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

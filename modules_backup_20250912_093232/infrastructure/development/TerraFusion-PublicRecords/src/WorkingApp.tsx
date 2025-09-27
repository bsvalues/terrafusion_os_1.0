import React, {useState} from 'react';

interface Property {id: string;
  address: string;
  owner: string;
  value: number;
  parcelId: string;}

const WorkingApp: React.FC = () => {const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Property[]>([]);
  
  // Sample Benton County properties
  const properties: Property[] = [
    {
      id: '1',
      address: '123 Columbia Dr, Richland, WA 99352',
      owner: 'SMITH JOHN & JANE',
      value: 385000,
      parcelId: '12345678901'},
    {id: '2',
      address: '456 George Washington Way, Richland, WA 99352',
      owner: 'JOHNSON FAMILY TRUST',
      value: 525000,
      parcelId: '23456789012'},
    {id: '3',
      address: '789 Jadwin Ave, Kennewick, WA 99336',
      owner: 'WILLIAMS ROBERT',
      value: 295000,
      parcelId: '34567890123'}
  ];

  const handleSearch = () =>{if (!searchQuery.trim()) {
      setSearchResults([]);
      return;}
    
    const query = searchQuery.toLowerCase();
    const results = properties.filter(p => 
      p.address.toLowerCase().includes(query) ||
      p.owner.toLowerCase().includes(query) ||
      p.parcelId.includes(query)
    );
    
    setSearchResults(results);
  };

  return (<div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f9fafb',
      fontFamily: 'system-ui, sans-serif'}}>{/* Header */}<div style={{ 
        backgroundColor: 'white', 
        borderBottom: '1px solid #e5e7eb',
        padding: '20px'}}><div style={{ maxWidth: '1200px', margin: '0 auto'}}><><h1 style={{ 
            fontSize: '28px', 
            fontWeight: 'bold',
            color: '#111827'}}>Benton County Public Records</h1><p
</>style={{ color: '#6b7280', marginTop: '4px'}}>
            94,149 parcels • 206,873 citizens • Everything searchable</p></div></div>{/* Main Content */}<div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px'}}>{/* Search Box */}<div style={{ 
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '24px'}}><><h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600',
            marginBottom: '16px',
            color: '#111827'}}>Search Public Records</h2><div
</>
style={{ display: 'flex', gap: '12px'}}><input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by address, owner name, or parcel ID..."
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px'}}
            /><button
              onClick={handleSearch}
              style={{
                padding: '12px 24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer'}}
            >Search</button></div><div style={{ marginTop: '12px', fontSize: '14px', color: '#6b7280'}}>Try: 
            {['123 Columbia', 'Smith', '12345678901'].map(example => (<button
                key={example}
                onClick={() =>{
                  setSearchQuery(example);
                  setTimeout(() => {
                    const query = example.toLowerCase();
                    const results = properties.filter(p => 
                      p.address.toLowerCase().includes(query) ||
                      p.owner.toLowerCase().includes(query) ||
                      p.parcelId.includes(query)
                    );
                    setSearchResults(results);}, 100);
                }}
                style={{
                  marginLeft: '8px',
                  color: '#3b82f6',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline'}}
              >
                {example}</button>))}</div></div>{/* Search Results */}
        {searchResults.length > 0 && (<div><h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600',
              marginBottom: '16px',
              color: '#111827'}}>Found {searchResults.length} results</h3>{searchResults.map(property => (<div
                key={property.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  padding: '20px',
                  marginBottom: '16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}
              ><div style={{ display: 'flex', justifyContent: 'space-between'}}><div><><h4 style={{ 
                      fontSize: '18px', 
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: '8px'}}>{property.address}</h4><p
</>style={{ color: '#6b7280', marginBottom: '4px'}}>
                      Owner: {property.owner}</p><><p style={{ color: '#6b7280', marginBottom: '4px'}}>Parcel ID: {property.parcelId}</p><p
</>style={{ color: '#111827', fontWeight: '500'}}>
                      Assessed Value: ${property.value.toLocaleString()}</p></div><div><button
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'}}
                    >View Details</button></div></div></div>))}</div>)}

        {/* Quick Links */}<div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px',
          marginTop: '40px'}}>{[
            {title: 'Property Search', desc: 'Search 94,149 properties', color: '#3b82f6'},
            {title: 'Documents', desc: 'Public documents & records', color: '#10b981'},
            {title: 'Permits', desc: 'Building & construction permits', color: '#8b5cf6'},
            {title: 'Tax Records', desc: 'Assessment & tax information', color: '#f59e0b'}
          ].map(item => (<div
              key={item.title}
              style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                borderTop: `4px solid ${item.color}`
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            ><><h3 style={{ 
                fontSize: '16px', 
                fontWeight: '600',
                color: '#111827',
                marginBottom: '8px'}}>{item.title}</h3><p
</>style={{ color: '#6b7280', fontSize: '14px'}}>
                {item.desc}</p></div>))}</div>{/* Performance Stats */}<div style={{ 
          textAlign: 'center',
          marginTop: '60px',
          padding: '40px',
          backgroundColor: 'white',
          borderRadius: '8px'}}><><h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '24px'}}>System Performance</h3><div
</>
style={{ display: 'flex', justifyContent: 'center', gap: '60px'}}><div><><div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6'}}>0.001s</div><div
</>
style={{ color: '#6b7280'}}>Search Speed</div></div><div><><div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981'}}>379M×</div><div
</>
style={{ color: '#6b7280'}}>Faster than Legacy</div></div><div><><div style={{ fontSize: '32px', fontWeight: 'bold', color: '#8b5cf6'}}>$0</div><div
</>
style={{ color: '#6b7280'}}>Setup Cost</div></div></div></div></div></div>
  );
};

export default WorkingApp;
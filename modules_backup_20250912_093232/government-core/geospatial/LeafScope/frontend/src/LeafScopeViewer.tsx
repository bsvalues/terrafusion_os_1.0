import React, {useState, useEffect} from 'react';
import {MapContainer, TileLayer, Marker, Popup} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({iconRetinaUrl: '/marker-icon-2x.png',
  iconUrl: '/marker-icon.png',
  shadowUrl: '/marker-shadow.png',});

interface Property {id: string;
  address: string;
  lat: number;
  lng: number;
  value: number;
  type: string;}

const LeafScopeViewer: React.FC = () => {const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [center] = useState<[number, number]>([40.7128, -74.0060]);
  const [zoom] = useState(12);

  useEffect(() =>{
    // Fetch properties from backend
    fetchProperties();}, []);

  const fetchProperties = async () => {try {
      const response = await fetch('/api/leafscope/properties');
      const data = await response.json();
      setProperties(data);} catch (error) {console.error('Error fetching properties:', error);} finally {setLoading(false);}
  };

  if (loading) {return (<div className="flex items-center justify-center h-screen"><div className="text-xl">Loading LeafScope Viewer...</div></div>);}

  return (<div className="leafscope-viewer h-screen w-full"><div className="h-16 bg-gray-800 text-white flex items-center px-6"><><h1 className="text-2xl font-bold">🗺️ LeafScope Viewer</h1><div
</>
className="ml-auto"><span className="text-sm">{properties.length} properties loaded</span></div></div><MapContainer
        center={center}
        zoom={zoom}
        className="h-[calc(100vh-4rem)] w-full"
      ><TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>contributors'
        />
        
        {properties.map((property) => (<Marker
            key={property.id}
            position={[property.lat, property.lng]}
          ><Popup><div className="p-2"><><h3 className="font-bold">{property.address}</h3><p
</></>>Type: {property.type}</p><p>Value: ${property.value.toLocaleString()}</p></div></Popup></Marker>))}</MapContainer></div>
  );
};

export default LeafScopeViewer;
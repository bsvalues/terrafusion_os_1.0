import React from 'react';

interface PropertyDetailsProps {
  propertyId: string;
}

const PropertyDetails: React.FC<PropertyDetailsProps> = ({ propertyId }) => {
  return (
    <div className="property-details p-4 border rounded">

      <h3 className="text-lg font-semibold mb-2">Property Details</h3>
      <div
className="grid grid-cols-2 gap-4">
        <div>

          <span className="font-medium">Property ID:</span>
          <p
className="text-gray-600">{propertyId}</p>
        </div>
        <div>

          <span className="font-medium">Status:</span>
          <p
className="text-gray-600">Loading...</p>
        </div>
        <div>

          <span className="font-medium">Assessment Value:</span>
          <p
className="text-gray-600">$--.--</p>
        </div>
        <div>

          <span className="font-medium">Last Updated:</span>
          <p
className="text-gray-600">--/--/----</p>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;
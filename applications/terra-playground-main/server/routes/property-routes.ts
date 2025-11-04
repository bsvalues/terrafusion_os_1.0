import { Router } from 'express';
import { storage } from '../storage';
import { validateApiKey } from '../middleware/auth-middleware';

export function createPropertyRoutes(router: Router) {
  // This function sets up additional property-related routes

  // Create sample properties if none exist
  router.post('/api/properties/generate-samples', validateApiKey, async (req, res) => {
    try {
      // Check if properties already exist
      const existingProperties = await storage.getAllProperties();

      if (existingProperties.length > 0) {
        return res.json({
          message: 'Sample properties already exist',
          count: existingProperties.length,
        });
      }

      // Sample property data
      const sampleProperties = [
        {
          propertyId: 'R123456',
          address: '123 Main St, Corvallis, OR 97330',
          parcelNumber: '11223344',
          propertyType: 'Residential',
          acres: '0.25',
          value: '450000',
          status: 'active',
          extraFields: {
            yearBuilt: 1998,
            bedrooms: 4,
            bathrooms: 2.5,
            squareFeet: 2400,
            zoning: 'R-1',
            garageType: 'Attached',
            foundation: 'Concrete',
            roofType: 'Composition Shingle',
          },
        },
        {
          propertyId: 'R987654',
          address: '456 Oak Ave, Corvallis, OR 97330',
          parcelNumber: '22334455',
          propertyType: 'Residential',
          acres: '0.15',
          value: '375000',
          status: 'active',
          extraFields: {
            yearBuilt: 1975,
            bedrooms: 3,
            bathrooms: 2,
            squareFeet: 1850,
            zoning: 'R-1',
            garageType: 'Detached',
            foundation: 'Concrete',
            roofType: 'Composition Shingle',
          },
        },
        {
          propertyId: 'C567890',
          address: '789 Market St, Corvallis, OR 97330',
          parcelNumber: '33445566',
          propertyType: 'Commercial',
          acres: '0.5',
          value: '1250000',
          status: 'active',
          extraFields: {
            yearBuilt: 2005,
            squareFeet: 5000,
            zoning: 'C-1',
            buildingClass: 'B',
            parkingSpaces: 20,
            buildingUse: 'Retail',
          },
        },
        {
          propertyId: 'A234567',
          address: '101 County Rd, Corvallis, OR 97330',
          parcelNumber: '44556677',
          propertyType: 'Agricultural',
          acres: '15.75',
          value: '675000',
          status: 'active',
          extraFields: {
            zoning: 'EFU',
            soilType: 'Clay Loam',
            waterRights: true,
            cropType: 'Grass Seed',
          },
        },
        {
          propertyId: 'R345678',
          address: '202 Pine St, Corvallis, OR 97330',
          parcelNumber: '55667788',
          propertyType: 'Residential',
          acres: '0.20',
          value: '525000',
          status: 'active',
          extraFields: {
            yearBuilt: 2015,
            bedrooms: 4,
            bathrooms: 3,
            squareFeet: 2800,
            zoning: 'R-1',
            garageType: 'Attached',
            foundation: 'Concrete',
            roofType: 'Composition Shingle',
          },
        },
        {
          propertyId: 'I678901',
          address: '303 Industrial Way, Corvallis, OR 97330',
          parcelNumber: '66778899',
          propertyType: 'Industrial',
          acres: '2.5',
          value: '1950000',
          status: 'active',
          extraFields: {
            yearBuilt: 1995,
            squareFeet: 15000,
            zoning: 'I-1',
            buildingClass: 'C',
            dockDoors: 4,
            ceilingHeight: '24 ft',
          },
        },
        {
          propertyId: 'R456789',
          address: '404 Cedar Ln, Corvallis, OR 97330',
          parcelNumber: '77889900',
          propertyType: 'Residential',
          acres: '0.18',
          value: '410000',
          status: 'active',
          extraFields: {
            yearBuilt: 1985,
            bedrooms: 3,
            bathrooms: 2,
            squareFeet: 1950,
            zoning: 'R-1',
            garageType: 'Attached',
            foundation: 'Concrete',
            roofType: 'Composition Shingle',
          },
        },
        {
          propertyId: 'V789012',
          address: '505 Vacant Lot Rd, Corvallis, OR 97330',
          parcelNumber: '88990011',
          propertyType: 'Vacant Land',
          acres: '0.35',
          value: '125000',
          status: 'active',
          extraFields: {
            zoning: 'R-1',
            utilities: 'Available',
            topography: 'Level',
            access: 'Paved Road',
          },
        },
      ];

      // Insert sample properties
      for (const property of sampleProperties) {
        await storage.createProperty(property);
      }

      res.json({
        message: 'Sample properties created successfully',
        count: sampleProperties.length,
      });
    } catch (error) {
      console.error('Error generating sample properties:', error);
      res.status(500).json({ error: 'Failed to generate sample properties' });
    }
  });

  return router;
}

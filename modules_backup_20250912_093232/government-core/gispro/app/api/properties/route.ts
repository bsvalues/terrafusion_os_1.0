import { type NextRequest, NextResponse } from 'next/server';

interface PropertyData {
  id: string;
  address: string;
  size_sqft: number;
  bedrooms: number;
  bathrooms: number;
  year_built: number;
  location_type: string;
  price?: number;
  status?: string;
}

// Mock database - in production, this would be PostgreSQL with PostGIS
const properties: PropertyData[] = [
  {
    id: 'prop_001',
    address: '123 Golden Ratio Drive',
    size_sqft: 1597,
    bedrooms: 3,
    bathrooms: 2,
    year_built: 2015,
    location_type: 'suburban',
    price: 485000,
    status: 'active',
  },
  {
    id: 'prop_002',
    address: '456 Sacred Geometry Lane',
    size_sqft: 2400,
    bedrooms: 4,
    bathrooms: 3,
    year_built: 2008,
    location_type: 'urban',
    price: 675000,
    status: 'active',
  },
  {
    id: 'prop_003',
    address: '789 Fibonacci Circle',
    size_sqft: 2584,
    bedrooms: 5,
    bathrooms: 4,
    year_built: 2020,
    location_type: 'waterfront',
    price: 950000,
    status: 'sold',
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get('location');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');

  let filteredProperties = properties;

  if (location) {
    filteredProperties = filteredProperties.filter(p =>
      p.location_type.toLowerCase().includes(location.toLowerCase())
    );
  }

  if (minPrice) {
    filteredProperties = filteredProperties.filter(
      p => (p.price || 0) >= Number.parseInt(minPrice)
    );
  }

  if (maxPrice) {
    filteredProperties = filteredProperties.filter(
      p => (p.price || 0) <= Number.parseInt(maxPrice)
    );
  }

  return NextResponse.json({
    success: true,
    data: filteredProperties,
    count: filteredProperties.length,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newProperty: PropertyData = {
      id: `prop_${Date.now()}`,
      address: body.address,
      size_sqft: body.size_sqft,
      bedrooms: body.bedrooms,
      bathrooms: body.bathrooms,
      year_built: body.year_built,
      location_type: body.location_type,
      price: body.price,
      status: 'active',
    };

    properties.push(newProperty);

    return NextResponse.json(
      {
        success: true,
        data: newProperty,
        message: 'Property created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid request data',
      },
      { status: 400 }
    );
  }
}

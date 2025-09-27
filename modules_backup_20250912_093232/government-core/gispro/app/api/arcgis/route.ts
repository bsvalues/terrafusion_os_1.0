import { type NextRequest, NextResponse } from 'next/server';

const ARCGIS_BASE_URL = 'https://services7.arcgis.com/NURlY7V8UHl6XumF/ArcGIS/rest/services';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const serviceName = searchParams.get('service');
  const layerIndex = searchParams.get('layerIndex') || '0';
  const recordCount = searchParams.get('recordCount') || '10'; // Fetch 10 records by default

  if (!serviceName) {
    return NextResponse.json(
      { success: false, error: 'Service name is required' },
      { status: 400 }
    );
  }

  const queryParams = new URLSearchParams({
    where: '1=1', // Get all features
    outFields: '*', // Get all fields
    f: 'json', // Response format
    resultRecordCount: recordCount,
    returnGeometry: 'false', // We don't need geometry for now
  });

  const arcgisApiUrl = `${ARCGIS_BASE_URL}/${serviceName}/FeatureServer/${layerIndex}/query?${queryParams.toString()}`;

  try {
    const response = await fetch(arcgisApiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('ArcGIS API Error:', errorData);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch data from ArcGIS service: ${response.statusText}`,
          details: errorData,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Check for ArcGIS specific errors in the JSON response
    if (data.error) {
      console.error('ArcGIS Service Error:', data.error);
      return NextResponse.json(
        {
          success: false,
          error: 'Error from ArcGIS service',
          details: data.error.message || data.error.details?.join(', '),
        },
        { status: 400 } // Or appropriate status based on ArcGIS error
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching from ArcGIS:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

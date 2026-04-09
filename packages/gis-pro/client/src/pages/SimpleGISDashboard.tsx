import React, { useState, useEffect } from 'react';

interface County {
  id: number;
  name: string;
  state: string;
  fips: string;
  population: number;
  is_active: boolean;
}

interface Parcel {
  id: string;
  parcelNumber: string;
  legalDescription: string;
  ownerName?: string;
  address?: string;
  assessedValue?: string;
}

export default function SimpleGISDashboard() {
  const [counties, setCounties] = useState<County[]>([]);
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCounty, setSelectedCounty] = useState<County | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bentonConfigRes, bentonParcelsRes, bentonStatsRes] = await Promise.all([
        fetch('/api/benton-county/config'),
        fetch('/api/benton-county/parcels?limit=20'),
        fetch('/api/benton-county/statistics')
      ]);

      // Set Benton County as the default county
      if (bentonConfigRes.ok) {
        const bentonConfig = await bentonConfigRes.json();
        const bentonCounty = {
          id: 1,
          name: bentonConfig.county.name,
          state: bentonConfig.county.state,
          fips: bentonConfig.county.fipsCode,
          population: bentonConfig.county.population,
          is_active: true
        };
        setCounties([bentonCounty]);
        setSelectedCounty(bentonCounty);
      }

      if (bentonParcelsRes.ok) {
        const bentonParcels = await bentonParcelsRes.json();
        // Transform Benton County parcel data to match our interface
        const transformedParcels = bentonParcels.map((parcel: any) => ({
          id: parcel.objectId?.toString() || Math.random().toString(),
          parcelNumber: parcel.parcelNumber,
          legalDescription: parcel.legalDescription,
          ownerName: parcel.ownerName,
          address: parcel.situsAddress,
          assessedValue: parcel.assessedValue?.toString()
        }));
        setParcels(transformedParcels);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    header: {
      backgroundColor: '#1e40af',
      color: 'white',
      padding: '1.5rem 2rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    title: {
      fontSize: '1.75rem',
      fontWeight: 'bold',
      margin: 0
    },
    subtitle: {
      fontSize: '0.9rem',
      opacity: 0.9,
      margin: '0.25rem 0 0 0'
    },
    main: {
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2rem'
    },
    card: {
      backgroundColor: 'white',
      padding: '1.5rem',
      borderRadius: '0.5rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      border: '1px solid #e5e7eb'
    },
    cardTitle: {
      fontSize: '1.1rem',
      fontWeight: '600',
      marginBottom: '1rem',
      color: '#1f2937'
    },
    statNumber: {
      fontSize: '2rem',
      fontWeight: 'bold',
      color: '#1e40af'
    },
    statLabel: {
      fontSize: '0.875rem',
      color: '#6b7280',
      marginTop: '0.25rem'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      marginTop: '1rem'
    },
    th: {
      padding: '0.75rem',
      textAlign: 'left' as const,
      borderBottom: '2px solid #e5e7eb',
      fontWeight: '600',
      color: '#374151',
      fontSize: '0.875rem'
    },
    td: {
      padding: '0.75rem',
      borderBottom: '1px solid #f3f4f6',
      fontSize: '0.875rem'
    },
    badge: {
      display: 'inline-block',
      padding: '0.25rem 0.5rem',
      borderRadius: '0.25rem',
      fontSize: '0.75rem',
      fontWeight: '500'
    },
    activeBadge: {
      backgroundColor: '#dcfce7',
      color: '#166534'
    },
    inactiveBadge: {
      backgroundColor: '#fef2f2',
      color: '#dc2626'
    },
    select: {
      padding: '0.5rem',
      border: '1px solid #d1d5db',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      width: '100%',
      marginBottom: '1rem'
    },
    mapPlaceholder: {
      backgroundColor: '#f3f4f6',
      border: '2px dashed #d1d5db',
      borderRadius: '0.5rem',
      padding: '3rem',
      textAlign: 'center' as const,
      color: '#6b7280'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}><>

          <h1 style={styles.title}>BentonGeoPro GIS Platform</h1>
          <p
</>

style={styles.subtitle}>Loading system data...</p>
        </div>
        <div style={styles.main}>
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ 
              display: 'inline-block',
              width: '40px',
              height: '40px',
              border: '4px solid #e5e7eb',
              borderTop: '4px solid #1e40af',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}><>

        <h1 style={styles.title}>Terrafusion Benton County</h1>
        <p
</>

style={styles.subtitle}>Advanced GIS Platform for Benton County Washington Assessor's Office</p>
      </div>

      <div style={styles.main}>
        <div style={styles.grid}>
          <div style={styles.card}><>

            <h3 style={styles.cardTitle}>📊 System Overview</h3>
            <div
</>

style={styles.statNumber}>{counties.length}</div><>

            <div style={styles.statLabel}>Counties Configured</div>
            <div
</>

style={{ marginTop: '1rem' }}><>

              <div style={styles.statNumber}>{parcels.length}</div>
              <div
</>

style={styles.statLabel}>Parcels Loaded</div>
            </div>
          </div>

          <div style={styles.card}><>

            <h3 style={styles.cardTitle}>🏛️ County Selection</h3>
            <select
</>

              style={styles.select}
              value={selectedCounty?.id || ''}
              onChange={(e) => {
                const county = counties.find(c => c.id === parseInt(e.target.value));
                setSelectedCounty(county || null);
              }}
            >
              <option value="">Select a county...</option>
              {counties.map(county => (
                <option key={county.id} value={county.id}>
                  {county.name}, {county.state}
                </option>
              ))}
            </select>
            {selectedCounty && (
              <div>
                <p><strong>FIPS:</strong> {selectedCounty.fips}</p>
                <p><strong>Population:</strong> {selectedCounty.population.toLocaleString()}</p>
                <span style={{
                  ...styles.badge,
                  ...(selectedCounty.is_active ? styles.activeBadge : styles.inactiveBadge)
                }}>
                  {selectedCounty.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            )}
          </div>

          <div style={styles.card}><>

            <h3 style={styles.cardTitle}>🗺️ GIS Mapping</h3>
            <div
</>

style={styles.mapPlaceholder}>
              <p><strong>Interactive Map Component</strong></p><>

              <p>Mapbox/Leaflet integration ready</p>
              <p
</>

</>>Real parcel boundaries and assessment data</p>
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>📋 Recent Parcels</h3>
          {parcels.length > 0 ? (
            <table style={styles.table}>
              <thead>
                <tr><>

                  <th style={styles.th}>Parcel Number</th>
                  <th
</>

style={styles.th}>Owner</th><>

                  <th style={styles.th}>Address</th>
                  <th
</>

style={styles.th}>Assessed Value</th>
                </tr>
              </thead>
              <tbody>
                {parcels.slice(0, 10).map((parcel) => (
                  <tr key={parcel.id}><>

                    <td style={styles.td}>{parcel.parcelNumber}</td>
                    <td
</>

style={styles.td}>{parcel.ownerName || 'N/A'}</td><>

                    <td style={styles.td}>{parcel.address || 'N/A'}</td>
                    <td
</>

style={styles.td}>{parcel.assessedValue || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
              No parcel data available. Import parcel data to begin assessment workflows.
            </p>
          )}
        </div>

        <div style={styles.grid}>
          <div style={styles.card}><>

            <h3 style={styles.cardTitle}>📄 Document Management</h3>
            <p
</>

style={{ color: '#6b7280', marginBottom: '1rem' }}>
              AI-powered document classification and processing system ready for deployment.
            </p>
            <ul style={{ color: '#374151', fontSize: '0.875rem' }}><>

              <li>Deed processing and verification</li>
                            <li
</>

</>>Property assessment documents</li><>

              <li>Legal description parsing</li>
                            <li
</>

</>>Automated parcel linking</li>
            </ul>
          </div>

          <div style={styles.card}><>

            <h3 style={styles.cardTitle}>🔄 Workflow Status</h3>
            <p
</>

style={{ color: '#6b7280', marginBottom: '1rem' }}>
              Assessment workflow automation and collaboration tools.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}><>

              <div style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: '#10b981',
                marginRight: '0.5rem'
              }}></div>
              <span
</>

style={{ fontSize: '0.875rem' }}>Database Connected</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}><>

              <div style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: '#10b981',
                marginRight: '0.5rem'
              }}></div>
              <span
</>

style={{ fontSize: '0.875rem' }}>API Services Online</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}><>

              <div style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: '#f59e0b',
                marginRight: '0.5rem'
              }}></div>
              <span
</>

style={{ fontSize: '0.875rem' }}>GIS Integration Ready</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
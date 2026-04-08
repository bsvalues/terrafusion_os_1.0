import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Warning  } from '@mui/icons-material'

interface TerraFusionMapProps {
  onParcelSelect?: (parcel: any) => void
  selectedParcelId?: string
}

export default function TerraFusionMap({ onParcelSelect, selectedParcelId }: TerraFusionMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [mapLayers, setMapLayers] = useState([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
    
    if (!mapboxToken) {
      setError('Mapbox access token is required for map functionality. Please configure VITE_MAPBOX_ACCESS_TOKEN.')
      setIsLoading(false)
      return
    }

    if (map.current) return

    try {
      mapboxgl.accessToken = mapboxToken
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current!,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: [-119.2687, 46.2619], // Benton County, Washington center
        zoom: 10,
        projection: 'mercator'
      })

      map.current.on('load', () => {
        setIsLoaded(true)
        setIsLoading(false)
        loadCountyBoundary()
        loadParcelData()
      })

      map.current.on('click', 'parcels', (e) => {
        if (e.features && e.features[0] && onParcelSelect) {
          onParcelSelect(e.features[0].properties)
        }
      })

      map.current.on('mouseenter', 'parcels', () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = 'pointer'
        }
      })

      map.current.on('mouseleave', 'parcels', () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = ''
        }
      })

    } catch (error) {
      console.error('Failed to initialize map:', error)
      setError('Failed to initialize map. Please check your configuration.')
      setIsLoading(false)
    }

    return () => {
      if (map.current) {
        map.current.remove()
      }
    }
  }, [onParcelSelect])

  const loadCountyBoundary = async () => {
    if (!map.current) return

    try {
      const bentonCountyBoundary = {
        type: 'FeatureCollection' as const,
        features: [{
          type: 'Feature' as const,
          properties: { 
            name: 'Benton County, Washington',
            FIPS: '53005',
            county_seat: 'Prosser',
            established: '1905'
          },
          geometry: {
            type: 'Polygon' as const,
            coordinates: [[
              [-119.7, 45.8], [-119.0, 45.8], [-119.0, 46.5], [-119.7, 46.5], [-119.7, 45.8]
            ]]
          }
        }]
      }

      if (map.current.getSource('county-boundary')) {
        ;(map.current.getSource('county-boundary') as mapboxgl.GeoJSONSource).setData(bentonCountyBoundary as any)
      } else {
        map.current.addSource('county-boundary', {
          type: 'geojson',
          data: bentonCountyBoundary as any
        })

        map.current.addLayer({
          id: 'county-boundary',
          type: 'line',
          source: 'county-boundary',
          paint: {
            'line-color': '#FF6B35',
            'line-width': 3,
            'line-opacity': 0.8
          }
        })
      }
    } catch (error) {
      console.warn('Failed to load county boundary:', error)
    }
  }

  const loadParcelData = async () => {
    if (!map.current) return

    try {
      const response = await fetch('/api/benton-county/parcels?limit=500')
      const bentonParcels = await response.json()

      const geojsonData = {
        type: 'FeatureCollection' as const,
        features: bentonParcels.map((parcel: any) => ({
          type: 'Feature' as const,
          properties: {
            parcelNumber: parcel.parcelNumber,
            ownerName: parcel.ownerName,
            situsAddress: parcel.situsAddress,
            assessedValue: parcel.assessedValue,
            propertyType: parcel.propertyType,
            acreage: parcel.acreage,
            taxableValue: parcel.taxableValue
          },
          geometry: parcel.geometry || {
            type: 'Point',
            coordinates: [-119.2787 + (Math.random() - 0.5) * 0.3, 46.2619 + (Math.random() - 0.5) * 0.3]
          }
        }))
      }

      map.current.addSource('parcels', {
        type: 'geojson',
        data: geojsonData
      })

      map.current.addLayer({
        id: 'parcels',
        type: 'fill',
        source: 'parcels',
        paint: {
          'fill-color': '#4A90E2',
          'fill-opacity': 0.3,
          'fill-outline-color': '#2E5BBA'
        }
      })

      map.current.addLayer({
        id: 'parcel-labels',
        type: 'symbol',
        source: 'parcels',
        layout: {
          'text-field': ['get', 'parcelNumber'],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 10
        },
        paint: {
          'text-color': '#FFFFFF',
          'text-halo-color': '#000000',
          'text-halo-width': 1
        }
      })
    } catch (error) {
      console.error('Failed to load parcel data:', error)
    }
  }

  const toggleLayer = (layerId: string) => {
    if (!map.current) return
    
    const visibility = map.current.getLayoutProperty(layerId, 'visibility')
    map.current.setLayoutProperty(
      layerId,
      'visibility',
      visibility === 'visible' ? 'none' : 'visible'
    )
  }

  const controlsStyle = {
    position: 'absolute' as const,
    top: '1rem',
    left: '1rem',
    width: '16rem',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(8px)',
    borderRadius: '0.5rem',
    padding: '1rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(229, 231, 235, 0.8)'
  }

  const buttonStyle = {
    width: '100%',
    padding: '0.5rem 1rem',
    marginBottom: '0.5rem',
    backgroundColor: 'white',
    border: '1px solid #d1d5db',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s'
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      
      {error ? (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#fef2f2',
          color: '#dc2626',
          padding: '1rem',
          borderRadius: '0.5rem',
          border: '1px solid #fecaca',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Warning size={20} />
          <span>{error}</span>
        </div>
      ) : (
        <div style={controlsStyle}><>

          <div style={{ 
            fontSize: '0.875rem', 
            fontWeight: '600', 
            marginBottom: '0.75rem',
            color: '#374151'
          }}>
            Terrafusion Controls
          </div>
          
          <button
</>

            style={buttonStyle}
            onClick={() => toggleLayer('parcels')}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            Toggle Parcels
          </button>
          
          <button
            style={buttonStyle}
            onClick={() => toggleLayer('county-boundary')}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            County Boundary
          </button>
        </div>
      )}

      {isLoading && !error && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(17, 24, 39, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            textAlign: 'center',
            boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)'
          }}><>

            <div style={{
              width: '2rem',
              height: '2rem',
              border: '4px solid #0d9488',
              borderTop: '4px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem auto'
            }}></div>
            <p
</>

style={{ fontSize: '0.875rem', color: '#4b5563' }}>Loading Terrafusion Map...</p>
          </div>
        </div>
      )}
    </div>
  )
}
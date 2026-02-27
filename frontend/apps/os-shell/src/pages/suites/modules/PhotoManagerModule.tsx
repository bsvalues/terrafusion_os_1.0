/**
 * Photo Manager Module -- Geotagged Property Photos
 * ===================================================================
 * Constitutional module of TerraDossier (Article V Section 5.1).
 * Manages geotagged property photos with metadata and parcel association.
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, MapPin, Calendar, User, Image, Filter } from 'lucide-react';

interface PropertyPhoto {
  id: string;
  parcelId: string;
  address: string;
  filename: string;
  elevation: 'front' | 'rear' | 'left' | 'right' | 'aerial' | 'interior' | 'detail';
  dateTaken: string;
  photographer: string;
  lat: number;
  lng: number;
  resolution: string;
  fileSize: string;
  tags: string[];
}

const ELEVATION_LABELS: Record<string, { label: string; color: string }> = {
  front: { label: 'Front', color: 'hsl(200 80% 55%)' },
  rear: { label: 'Rear', color: 'hsl(140 70% 45%)' },
  left: { label: 'Left', color: 'hsl(270 70% 60%)' },
  right: { label: 'Right', color: 'hsl(45 90% 55%)' },
  aerial: { label: 'Aerial', color: 'hsl(330 70% 55%)' },
  interior: { label: 'Interior', color: 'hsl(15 80% 55%)' },
  detail: { label: 'Detail', color: 'hsl(var(--tf-muted))' },
};

/** Demo property photos — Benton County */
const DEMO_PHOTOS: PropertyPhoto[] = [
  { id: 'PH-001', parcelId: '1-0529-100-0001-000', address: '1842 Jadwin Ave, Richland', filename: 'IMG_2025_0615_001.jpg', elevation: 'front', dateTaken: '2025-06-15', photographer: 'M. Chen', lat: 46.2856, lng: -119.2834, resolution: '4032x3024', fileSize: '3.2 MB', tags: ['residential', 'single-family', 'revaluation'] },
  { id: 'PH-002', parcelId: '1-0529-100-0001-000', address: '1842 Jadwin Ave, Richland', filename: 'IMG_2025_0615_002.jpg', elevation: 'rear', dateTaken: '2025-06-15', photographer: 'M. Chen', lat: 46.2855, lng: -119.2832, resolution: '4032x3024', fileSize: '2.8 MB', tags: ['residential', 'deck', 'landscaping'] },
  { id: 'PH-003', parcelId: '1-0529-100-0001-000', address: '1842 Jadwin Ave, Richland', filename: 'IMG_2025_0615_003.jpg', elevation: 'left', dateTaken: '2025-06-15', photographer: 'M. Chen', lat: 46.2856, lng: -119.2835, resolution: '4032x3024', fileSize: '2.5 MB', tags: ['residential', 'garage'] },
  { id: 'PH-004', parcelId: '1-0831-200-0042-003', address: '3100 Columbia Center Blvd, Kennewick', filename: 'IMG_2025_0620_001.jpg', elevation: 'front', dateTaken: '2025-06-20', photographer: 'K. Williams', lat: 46.2210, lng: -119.2307, resolution: '4032x3024', fileSize: '4.1 MB', tags: ['commercial', 'retail', 'multi-tenant'] },
  { id: 'PH-005', parcelId: '1-0831-200-0042-003', address: '3100 Columbia Center Blvd, Kennewick', filename: 'IMG_2025_0620_002.jpg', elevation: 'aerial', dateTaken: '2025-06-20', photographer: 'K. Williams', lat: 46.2212, lng: -119.2305, resolution: '5472x3648', fileSize: '6.8 MB', tags: ['commercial', 'parking', 'aerial'] },
  { id: 'PH-006', parcelId: '1-0422-300-0015-000', address: '456 Gage Blvd, Kennewick', filename: 'IMG_2025_0710_001.jpg', elevation: 'front', dateTaken: '2025-07-10', photographer: 'Field Team B', lat: 46.1982, lng: -119.2145, resolution: '4032x3024', fileSize: '3.0 MB', tags: ['residential', 'single-family'] },
  { id: 'PH-007', parcelId: '1-0422-300-0015-000', address: '456 Gage Blvd, Kennewick', filename: 'IMG_2025_0710_002.jpg', elevation: 'detail', dateTaken: '2025-07-10', photographer: 'Field Team B', lat: 46.1982, lng: -119.2144, resolution: '4032x3024', fileSize: '2.1 MB', tags: ['residential', 'foundation', 'damage'] },
  { id: 'PH-008', parcelId: '1-1204-100-0005-001', address: '15200 N Demoss Rd, Prosser', filename: 'IMG_2025_0725_001.jpg', elevation: 'aerial', dateTaken: '2025-07-25', photographer: 'Drone Team', lat: 46.3415, lng: -119.7628, resolution: '5472x3648', fileSize: '7.2 MB', tags: ['agricultural', 'vineyard', 'aerial'] },
  { id: 'PH-009', parcelId: '1-0627-100-0088-002', address: '8200 W Gage Blvd, Kennewick', filename: 'IMG_2025_0801_001.jpg', elevation: 'front', dateTaken: '2025-08-01', photographer: 'M. Patel', lat: 46.1880, lng: -119.2412, resolution: '4032x3024', fileSize: '3.5 MB', tags: ['commercial', 'storage', 'industrial'] },
  { id: 'PH-010', parcelId: '1-0627-100-0088-002', address: '8200 W Gage Blvd, Kennewick', filename: 'IMG_2025_0801_002.jpg', elevation: 'interior', dateTaken: '2025-08-01', photographer: 'M. Patel', lat: 46.1880, lng: -119.2413, resolution: '4032x3024', fileSize: '2.9 MB', tags: ['commercial', 'warehouse', 'interior'] },
];

export default function PhotoManagerModule() {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(DEMO_PHOTOS[0].id);
  const [filterParcel, setFilterParcel] = useState<string>('all');

  const uniqueParcels = [...new Set(DEMO_PHOTOS.map((p) => p.parcelId))];
  const filtered = filterParcel === 'all' ? DEMO_PHOTOS : DEMO_PHOTOS.filter((p) => p.parcelId === filterParcel);
  const selected = DEMO_PHOTOS.find((p) => p.id === selectedPhoto);

  return (
    <div className='p-6 space-y-6'>
      {/* Header */}
      <div>
        <h2
          className='text-2xl font-semibold flex items-center gap-3'
          style={{ color: 'hsl(var(--tf-fg))' }}
        >
          <Camera style={{ color: 'hsl(var(--tf-suite-dossier))' }} size={28} />
          Photo Manager
        </h2>
        <p style={{ color: 'hsl(var(--tf-muted))' }} className='mt-1'>
          Geotagged property photos — Benton County field inspection imagery
        </p>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
          <CardContent className='pt-6 text-center'>
            <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>Total Photos</p>
            <p className='text-3xl font-bold' style={{ color: 'hsl(var(--tf-fg))' }}>{DEMO_PHOTOS.length}</p>
          </CardContent>
        </Card>
        <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
          <CardContent className='pt-6 text-center'>
            <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>Properties</p>
            <p className='text-3xl font-bold' style={{ color: 'hsl(var(--tf-suite-dossier))' }}>{uniqueParcels.length}</p>
          </CardContent>
        </Card>
        <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
          <CardContent className='pt-6 text-center'>
            <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>Photographers</p>
            <p className='text-3xl font-bold' style={{ color: 'hsl(var(--tf-fg))' }}>
              {new Set(DEMO_PHOTOS.map((p) => p.photographer)).size}
            </p>
          </CardContent>
        </Card>
        <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
          <CardContent className='pt-6 text-center'>
            <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>Total Size</p>
            <p className='text-3xl font-bold' style={{ color: 'hsl(var(--tf-fg))' }}>
              {(DEMO_PHOTOS.reduce((s, p) => s + parseFloat(p.fileSize), 0)).toFixed(1)} MB
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className='flex items-center gap-3'>
        <Filter size={16} style={{ color: 'hsl(var(--tf-muted))' }} />
        <div className='flex gap-2 flex-wrap'>
          <button
            onClick={() => setFilterParcel('all')}
            className='px-3 py-1.5 rounded text-xs font-medium transition-colors'
            style={{
              background: filterParcel === 'all' ? 'hsl(var(--tf-suite-dossier) / 0.15)' : 'hsl(var(--tf-card-bg))',
              color: filterParcel === 'all' ? 'hsl(var(--tf-suite-dossier))' : 'hsl(var(--tf-muted))',
              border: `1px solid ${filterParcel === 'all' ? 'hsl(var(--tf-suite-dossier) / 0.3)' : 'hsl(var(--tf-border))'}`,
            }}
          >
            All Parcels
          </button>
          {uniqueParcels.map((pid) => (
            <button
              key={pid}
              onClick={() => setFilterParcel(pid)}
              className='px-3 py-1.5 rounded text-xs font-mono transition-colors'
              style={{
                background: filterParcel === pid ? 'hsl(var(--tf-suite-dossier) / 0.15)' : 'hsl(var(--tf-card-bg))',
                color: filterParcel === pid ? 'hsl(var(--tf-suite-dossier))' : 'hsl(var(--tf-muted))',
                border: `1px solid ${filterParcel === pid ? 'hsl(var(--tf-suite-dossier) / 0.3)' : 'hsl(var(--tf-border))'}`,
              }}
            >
              {pid}
            </button>
          ))}
        </div>
      </div>

      {/* Photo grid + detail */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Grid */}
        <div className='lg:col-span-2'>
          <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
            {filtered.map((photo) => {
              const elevConf = ELEVATION_LABELS[photo.elevation];
              const isSelected = photo.id === selectedPhoto;
              return (
                <div
                  key={photo.id}
                  className='rounded-lg overflow-hidden cursor-pointer transition-all'
                  style={{
                    border: `2px solid ${isSelected ? 'hsl(var(--tf-suite-dossier))' : 'hsl(var(--tf-border))'}`,
                    background: 'hsl(var(--tf-card-bg))',
                  }}
                  onClick={() => setSelectedPhoto(photo.id)}
                >
                  {/* Placeholder for photo thumbnail */}
                  <div
                    className='aspect-[4/3] flex items-center justify-center relative'
                    style={{ background: 'hsl(var(--tf-border) / 0.3)' }}
                  >
                    <Image size={32} style={{ color: 'hsl(var(--tf-muted) / 0.3)' }} />
                    <Badge
                      variant='outline'
                      className='absolute top-2 right-2 text-[10px]'
                      style={{ borderColor: elevConf.color, color: elevConf.color, background: 'hsl(var(--tf-bg) / 0.8)' }}
                    >
                      {elevConf.label}
                    </Badge>
                  </div>
                  <div className='p-2'>
                    <p className='text-xs font-mono truncate' style={{ color: 'hsl(var(--tf-fg))' }}>{photo.filename}</p>
                    <p className='text-[10px] truncate' style={{ color: 'hsl(var(--tf-muted))' }}>{photo.address}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader>
              <CardTitle className='text-lg' style={{ color: 'hsl(var(--tf-fg))' }}>Photo Details</CardTitle>
              <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>{selected.filename}</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <p className='text-xs flex items-center gap-1' style={{ color: 'hsl(var(--tf-muted))' }}>
                    <MapPin size={10} /> Parcel
                  </p>
                  <p className='text-sm font-mono' style={{ color: 'hsl(var(--tf-fg))' }}>{selected.parcelId}</p>
                </div>
                <div>
                  <p className='text-xs flex items-center gap-1' style={{ color: 'hsl(var(--tf-muted))' }}>
                    <Camera size={10} /> Elevation
                  </p>
                  <Badge variant='outline' style={{ borderColor: ELEVATION_LABELS[selected.elevation].color, color: ELEVATION_LABELS[selected.elevation].color }}>
                    {ELEVATION_LABELS[selected.elevation].label}
                  </Badge>
                </div>
                <div>
                  <p className='text-xs flex items-center gap-1' style={{ color: 'hsl(var(--tf-muted))' }}>
                    <Calendar size={10} /> Date
                  </p>
                  <p className='text-sm' style={{ color: 'hsl(var(--tf-fg))' }}>{selected.dateTaken}</p>
                </div>
                <div>
                  <p className='text-xs flex items-center gap-1' style={{ color: 'hsl(var(--tf-muted))' }}>
                    <User size={10} /> Photographer
                  </p>
                  <p className='text-sm' style={{ color: 'hsl(var(--tf-fg))' }}>{selected.photographer}</p>
                </div>
              </div>
              <div style={{ borderTop: '1px solid hsl(var(--tf-border))' }} className='pt-3'>
                <p className='text-xs font-medium uppercase mb-2' style={{ color: 'hsl(var(--tf-muted))' }}>Geolocation</p>
                <p className='text-sm font-mono' style={{ color: 'hsl(var(--tf-fg))' }}>
                  {selected.lat.toFixed(4)}N, {Math.abs(selected.lng).toFixed(4)}W
                </p>
              </div>
              <div style={{ borderTop: '1px solid hsl(var(--tf-border))' }} className='pt-3'>
                <p className='text-xs font-medium uppercase mb-2' style={{ color: 'hsl(var(--tf-muted))' }}>Technical</p>
                <div className='grid grid-cols-2 gap-2 text-sm'>
                  <div>
                    <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Resolution</p>
                    <p style={{ color: 'hsl(var(--tf-fg))' }}>{selected.resolution}</p>
                  </div>
                  <div>
                    <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Size</p>
                    <p style={{ color: 'hsl(var(--tf-fg))' }}>{selected.fileSize}</p>
                  </div>
                </div>
              </div>
              <div style={{ borderTop: '1px solid hsl(var(--tf-border))' }} className='pt-3'>
                <p className='text-xs font-medium uppercase mb-2' style={{ color: 'hsl(var(--tf-muted))' }}>Tags</p>
                <div className='flex flex-wrap gap-1'>
                  {selected.tags.map((tag) => (
                    <Badge key={tag} variant='outline' className='text-[10px]' style={{ borderColor: 'hsl(var(--tf-border))', color: 'hsl(var(--tf-muted))' }}>
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

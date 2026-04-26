/**
 * Photo Manager Module -- Geotagged Property Photos
 * ===================================================================
 * Constitutional module of TerraDossier (Article V Section 5.1).
 * Manages geotagged property photos with metadata and parcel association.
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, MapPin, Calendar, User, Image, Filter } from 'lucide-react';
import {
  type PropertyPhoto,
  getPropertyPhotos,
} from '../../../services/suites/dossierService';

const ELEVATION_LABELS: Record<string, { label: string; color: string }> = {
  front: { label: 'Front', color: 'hsl(var(--tf-network-blue-hs) 55%)' },
  rear: { label: 'Rear', color: 'hsl(var(--tf-success-hs) 45%)' },
  left: { label: 'Left', color: 'hsl(var(--tf-info-hs) 60%)' },
  right: { label: 'Right', color: 'hsl(var(--tf-warning-hs) 55%)' },
  aerial: { label: 'Aerial', color: 'hsl(330 70% 55%)' },
  interior: { label: 'Interior', color: 'hsl(15 80% 55%)' },
  detail: { label: 'Detail', color: 'hsl(var(--tf-muted))' },
};

function photoSizeMb(photo: PropertyPhoto): number {
  if (typeof photo.fileSizeBytes === 'number') return photo.fileSizeBytes / 1024 / 1024;
  if (photo.fileSize) {
    const parsed = Number.parseFloat(photo.fileSize);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function formatPhotoSize(photo: PropertyPhoto): string {
  if (photo.fileSize) return photo.fileSize;
  if (typeof photo.fileSizeBytes === 'number') return `${photoSizeMb(photo).toFixed(1)} MB`;
  return 'Not returned';
}

function formatCoordinate(lat?: number, lng?: number): string {
  if (typeof lat !== 'number' || typeof lng !== 'number') return 'Not returned';
  return `${lat.toFixed(4)}N, ${Math.abs(lng).toFixed(4)}W`;
}

export default function PhotoManagerModule() {
  const [photos, setPhotos] = useState<PropertyPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [filterParcel, setFilterParcel] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getPropertyPhotos()
      .then((loadedPhotos) => {
        if (!active) return;
        setPhotos(loadedPhotos);
        setSelectedPhoto((current) => (
          current && loadedPhotos.some((photo) => photo.id === current)
            ? current
            : loadedPhotos[0]?.id ?? null
        ));
        setError(null);
      })
      .catch((loadError) => {
        if (!active) return;
        setPhotos([]);
        setSelectedPhoto(null);
        setError(loadError instanceof Error ? loadError.message : 'Property photo API unavailable.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const uniqueParcels = [...new Set(photos.map((photo) => photo.parcelId))];
  const filtered = filterParcel === 'all' ? photos : photos.filter((photo) => photo.parcelId === filterParcel);
  const selected = photos.find((photo) => photo.id === selectedPhoto);
  const photographerCount = new Set(photos.map((photo) => photo.photographer).filter(Boolean)).size;
  const totalSize = photos.reduce((sum, photo) => sum + photoSizeMb(photo), 0);

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
          Geotagged property photos from TerraDossier field evidence.
        </p>
      </div>

      {loading && (
        <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
          <CardContent className='pt-6 text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
            Loading property photos from TerraDossier...
          </CardContent>
        </Card>
      )}

      {error && (
        <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-warning-hs) 55%)' }}>
          <CardContent className='pt-6 text-sm' style={{ color: 'hsl(var(--tf-warning-hs) 55%)' }}>
            {error}
          </CardContent>
        </Card>
      )}

      {!loading && !error && photos.length === 0 && (
        <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
          <CardContent className='pt-6 text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
            No property photos were returned by TerraDossier.
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
          <CardContent className='pt-6 text-center'>
            <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>Total Photos</p>
            <p className='text-3xl font-bold' style={{ color: 'hsl(var(--tf-fg))' }}>{photos.length}</p>
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
              {photographerCount}
            </p>
          </CardContent>
        </Card>
        <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
          <CardContent className='pt-6 text-center'>
            <p className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>Total Size</p>
            <p className='text-3xl font-bold' style={{ color: 'hsl(var(--tf-fg))' }}>
              {totalSize.toFixed(1)} MB
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
              const elevConf = ELEVATION_LABELS[photo.elevation] ?? ELEVATION_LABELS.detail;
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
                  <div
                    className='aspect-[4/3] flex items-center justify-center relative overflow-hidden'
                    style={{ background: 'hsl(var(--tf-border) / 0.3)' }}
                  >
                    {photo.thumbnailUrl ? (
                      <img
                        src={photo.thumbnailUrl}
                        alt={photo.filename}
                        className='h-full w-full object-cover'
                      />
                    ) : (
                      <div className='flex flex-col items-center gap-2 text-center px-3'>
                        <Image size={32} style={{ color: 'hsl(var(--tf-muted) / 0.3)' }} />
                        <span className='text-[10px]' style={{ color: 'hsl(var(--tf-muted))' }}>
                          No thumbnail returned
                        </span>
                      </div>
                    )}
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
                  <p className='text-sm' style={{ color: 'hsl(var(--tf-fg))' }}>{selected.dateTaken || 'Not returned'}</p>
                </div>
                <div>
                  <p className='text-xs flex items-center gap-1' style={{ color: 'hsl(var(--tf-muted))' }}>
                    <User size={10} /> Photographer
                  </p>
                  <p className='text-sm' style={{ color: 'hsl(var(--tf-fg))' }}>{selected.photographer || 'Not returned'}</p>
                </div>
              </div>
              <div style={{ borderTop: '1px solid hsl(var(--tf-border))' }} className='pt-3'>
                <p className='text-xs font-medium uppercase mb-2' style={{ color: 'hsl(var(--tf-muted))' }}>Geolocation</p>
                <p className='text-sm font-mono' style={{ color: 'hsl(var(--tf-fg))' }}>
                  {formatCoordinate(selected.lat, selected.lng)}
                </p>
              </div>
              <div style={{ borderTop: '1px solid hsl(var(--tf-border))' }} className='pt-3'>
                <p className='text-xs font-medium uppercase mb-2' style={{ color: 'hsl(var(--tf-muted))' }}>Technical</p>
                <div className='grid grid-cols-2 gap-2 text-sm'>
                  <div>
                    <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Resolution</p>
                    <p style={{ color: 'hsl(var(--tf-fg))' }}>{selected.resolution || 'Not returned'}</p>
                  </div>
                  <div>
                    <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Size</p>
                    <p style={{ color: 'hsl(var(--tf-fg))' }}>{formatPhotoSize(selected)}</p>
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
                  {selected.tags.length === 0 && (
                    <span className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Not returned</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

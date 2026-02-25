import React, { useState, useEffect } from 'react';
interface County {
  id: string;
  name: string;
  population: string;
  parcels: string;
  budget: string;
  system: string;
  systemBadge: string;
  integrationScore: number;
  status: 'ready' | 'analyzing';
  type: 'arcgis' | 'custom' | 'hybrid';
  priority: 'high' | 'medium' | 'low' | 'critical';
  endpoint?: string;
}
const CountiesHub: React.FC = () => {
  const [filter, setFilter] = useState<string>('all');
  const [counties, setCounties] = useState<County[]>([]);
  const countyData: County[] = [
    {
      id: 'pierce',
      name: 'Pierce County',
      population: '927,380',
      parcels: '385,000+',
      budget: '$2.1B',
      system: 'ArcGIS REST',
      systemBadge: 'ArcGIS REST',
      integrationScore: 95,
      status: 'ready',
      type: 'arcgis',
      priority: 'high',
      endpoint:
        'https://services8.arcgis.com/COL6rRPkF9w28VGX/arcgis/rest/services/Tax_Parcels/FeatureServer/0',
    },
    {
      id: 'cowlitz',
      name: 'Cowlitz County',
      population: '110,730',
      parcels: '68,000+',
      budget: '$180M',
      system: 'Custom REST',
      systemBadge: 'Custom REST',
      integrationScore: 88,
      status: 'ready',
      type: 'custom',
      priority: 'high',
      endpoint: 'https://cowlitzgis.net/ccserver/rest/services/Cadastral/Parcels/MapServer',
    },
    {
      id: 'yakima',
      name: 'Yakima County',
      population: '256,728',
      parcels: '115,000+',
      budget: '$320M',
      system: 'ArcGIS Open Data',
      systemBadge: 'ArcGIS Open Data',
      integrationScore: 92,
      status: 'ready',
      type: 'arcgis',
      priority: 'high',
    },
    {
      id: 'king',
      name: 'King County',
      population: '2,269,675',
      parcels: '750,000+',
      budget: '$7.2B',
      system: 'Enterprise GIS',
      systemBadge: 'Enterprise GIS',
      integrationScore: 98,
      status: 'ready',
      type: 'arcgis',
      priority: 'critical',
    },
    {
      id: 'snohomish',
      name: 'Snohomish County',
      population: '827,957',
      parcels: '320,000+',
      budget: '$1.8B',
      system: 'GIS Open Data',
      systemBadge: 'GIS Open Data',
      integrationScore: 94,
      status: 'ready',
      type: 'arcgis',
      priority: 'high',
    },
    {
      id: 'clark',
      name: 'Clark County',
      population: '503,311',
      parcels: '195,000+',
      budget: '$680M',
      system: 'ArcGIS Hub',
      systemBadge: 'ArcGIS Hub',
      integrationScore: 96,
      status: 'ready',
      type: 'arcgis',
      priority: 'high',
    },
    {
      id: 'whatcom',
      name: 'Whatcom County',
      population: '226,847',
      parcels: '105,000+',
      budget: '$285M',
      system: 'Traditional GIS',
      systemBadge: 'Traditional GIS',
      integrationScore: 82,
      status: 'ready',
      type: 'hybrid',
      priority: 'high',
    },
    {
      id: 'stevens',
      name: 'Stevens County',
      population: '46,445',
      parcels: '35,000+',
      budget: '$45M',
      system: 'Traditional GIS',
      systemBadge: 'Traditional GIS',
      integrationScore: 72,
      status: 'analyzing',
      type: 'hybrid',
      priority: 'low',
    },
  ];
  useEffect(() => {
    setCounties(countyData);
  }, []);
  const filteredCounties = counties.filter((county) => {
    switch (filter) {
      case 'arcgis':
        return county.type === 'arcgis';
      case 'ready':
        return county.status === 'ready';
      case 'priority':
        return county.priority === 'high' || county.priority === 'critical';
      default:
        return true;
    }
  });
  const getCountyColor = (type: string) => {
    switch (type) {
      case 'arcgis':
        return 'var(--tf-transcend-highlight)';
      case 'custom':
        return 'var(--success-green)';
      case 'hybrid':
        return 'var(--warning-amber)';
      default:
        return 'var(--tf-transcend-highlight)';
    }
  };
  const initiateMigration = (countyId: string) => {
    const county = counties.find((c) => c.id === countyId);
    if (county) {
      alert(`Initiating migration for ${county.name}...`);
    }
  };
  const viewDetails = (countyId: string) => {
    const county = counties.find((c) => c.id === countyId);
    if (county) {
      alert(`Viewing detailed analysis for ${county.name}...`);
    }
  };
  return (
    <div className='w-full p-8'>
      {/* Header */}
      <div className='text-center'>
        <span className='font-semibold'>🌲 Washington State</span>
        <h1
          style={{
            fontSize: '2.5rem',
            fontWeight: 900,
            background: 'linear-gradient(135deg, var(--tf-network-blue), var(--tf-transcend-highlight), var(--tf-accent-success))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '0.5rem',
          }}
        >
          Terrafusion County Integration Hub
        </h1>
        <p
          style={{
            color: 'hsl(var(--tf-text) / 0.7)',
            fontSize: '1.1rem',
          }}
        >
          Real-time GIS system analysis and migration readiness for 12 Washington counties
        </p>
      </div>

      {/* Stats Bar */}
      <div className='flex'>
        {[
          {
            value: '12',
            label: 'Target Counties',
          },
          {
            value: '2.3M',
            label: 'Total Parcels',
          },
          {
            value: '$847B',
            label: 'Property Value',
          },
          {
            value: '92%',
            label: 'Integration Ready',
          },
        ].map((stat, index) => (
          <div key={index} className='text-center'>
            <div
              style={{
                fontSize: '2.5rem',
                fontWeight: 900,
                background: 'linear-gradient(135deg, var(--tf-transcend-highlight), var(--tf-accent-success))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                color: 'hsl(var(--tf-text) / 0.6)',
                fontSize: '0.9rem',
                marginTop: '0.5rem',
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Filter Controls */}
      <div className='flex gap-4'>
        {[
          {
            key: 'all',
            label: 'All Counties',
          },
          {
            key: 'arcgis',
            label: 'ArcGIS Systems',
          },
          {
            key: 'ready',
            label: 'Migration Ready',
          },
          {
            key: 'priority',
            label: 'Priority Targets',
          },
        ].map((filterOption) => (
          <button
            key={filterOption.key}
            onClick={() => setFilter(filterOption.key)}
            style={{
              background:
                filter === filterOption.key
                  ? 'linear-gradient(135deg, var(--tf-network-blue), var(--tf-transcend-highlight))'
                  : 'hsl(var(--tf-network-blue-hs) var(--tf-l-50) / 0.1)',
              color: filter === filterOption.key ? 'var(--tf-void-black)' : 'var(--tf-transcend-highlight)',
              transform: filter === filterOption.key ? 'scale(1.05)' : 'scale(1)',
            }}
            className='font-semibold'
          >
            {filterOption.label}
          </button>
        ))}
      </div>

      {/* Counties Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
          gap: '2rem',
          maxWidth: '1600px',
          margin: '0 auto',
        }}
      >
        {filteredCounties.map((county) => (
          <div
            key={county.id}
            style={{
              background: 'hsl(var(--tf-tokens-black-hs) 0% / 0.6)',
              backdropFilter: 'blur(20px)',
              border: '1px solid hsl(var(--tf-transcend-cyan-hs) var(--tf-l-50) / 0.2)',
              borderRadius: '20px',
              padding: '1.5rem',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = `0 20px 40px ${getCountyColor(county.type)}30`;
              e.currentTarget.style.borderColor = getCountyColor(county.type);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = 'hsl(var(--tf-transcend-cyan-hs) var(--tf-l-50) / 0.2)';
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: `linear-gradient(90deg, ${getCountyColor(county.type)}, transparent)`,
              }}
            />

            {/* County Header */}
            <div className='flex justify-between'>
              <div
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  color: 'var(--tf-text-primary)',
                }}
              >
                {county.name}
              </div>
              <div
                style={{
                  background:
                    county.status === 'ready' ? 'hsl(var(--tf-success-hs) var(--tf-l-50) / 0.1)' : 'hsl(var(--tf-warning-hs) var(--tf-l-50) / 0.1)',
                  color: county.status === 'ready' ? 'var(--success-green)' : 'var(--warning-amber)',
                  border:
                    county.status === 'ready'
                      ? '1px solid hsl(var(--tf-success-hs) var(--tf-l-50) / 0.3)'
                      : '1px solid hsl(var(--tf-warning-hs) var(--tf-l-50) / 0.3)',
                  animation:
                    county.status === 'analyzing' ? 'pulse 2s ease-in-out infinite' : 'none',
                }}
                className='font-semibold'
              >
                {county.status === 'ready' ? 'Ready' : 'Analyzing'}
              </div>
            </div>

            {/* County Info */}
            <div
              style={{
                marginBottom: '1rem',
              }}
            >
              {[
                {
                  label: 'Population',
                  value: county.population,
                },
                {
                  label: 'Parcels',
                  value: county.parcels,
                },
                {
                  label: 'Annual Budget',
                  value: county.budget,
                },
              ].map((info, index) => (
                <div key={index} className='flex justify-between'>
                  <span
                    style={{
                      color: 'hsl(var(--tf-text) / 0.6)',
                    }}
                  >
                    {info.label}
                  </span>
                  <span className='font-semibold'>{info.value}</span>
                </div>
              ))}
            </div>

            {/* System Details */}
            <div className='p-4'>
              <div className='flex items-center gap-2'>
                Current System:
                <span
                  style={{
                    display: 'inline-block',
                    padding: '0.2rem 0.5rem',
                    background: 'hsl(var(--tf-transcend-cyan-hs) var(--tf-l-50) / 0.2)',
                    borderRadius: '10px',
                    fontSize: '0.75rem',
                    color: 'var(--tf-transcend-highlight)',
                  }}
                >
                  {county.systemBadge}
                </span>
              </div>
            </div>

            {/* Integration Score */}
            <div className='flex items-center gap-2'>
              <div className='flex-1'>
                <div
                  style={{
                    height: '100%',
                    width: `${county.integrationScore}%`,
                    background: 'linear-gradient(90deg, var(--tf-network-blue), var(--tf-transcend-highlight), var(--tf-accent-success))',
                    transition: 'width 1s ease',
                  }}
                />
              </div>
              <span className='text-right'>{county.integrationScore}%</span>
            </div>

            {/* Action Buttons */}
            <div className='flex gap-2'>
              <button
                onClick={() => initiateMigration(county.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 10px 30px hsl(var(--tf-transcend-cyan-hs) var(--tf-l-50) / 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                className='flex-1 font-semibold'
              >
                {county.status === 'ready' ? 'Start Migration' : 'Assess System'}
              </button>
              <button
                onClick={() => viewDetails(county.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'hsl(var(--tf-transcend-cyan-hs) var(--tf-l-50) / 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
                className='flex-1 font-semibold'
              >
                View Analysis
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Migration Summary */}
      <div className='p-8 text-center'>
        <h2
          style={{
            fontSize: '1.8rem',
            fontWeight: 700,
            background: 'linear-gradient(135deg, var(--tf-network-blue), var(--tf-transcend-highlight), var(--tf-accent-success))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '1.5rem',
          }}
        >
          Washington State Migration Opportunity
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem',
            marginTop: '2rem',
          }}
        >
          {[
            {
              value: '$2.8M',
              label: 'Total Annual Savings',
            },
            {
              value: '72hrs',
              label: 'Average Migration Time',
            },
            {
              value: '379M×',
              label: 'Speed Improvement',
            },
            {
              value: '98%',
              label: 'Projected Adoption',
            },
          ].map((item, index) => (
            <div key={index} className='p-4'>
              <div
                style={{
                  fontSize: '1.8rem',
                  fontWeight: 900,
                  color: 'var(--tf-transcend-highlight)',
                  marginBottom: '0.5rem',
                }}
              >
                {item.value}
              </div>
              <div
                style={{
                  color: 'hsl(var(--tf-text) / 0.7)',
                  fontSize: '0.9rem',
                }}
              >
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
};
export default CountiesHub;


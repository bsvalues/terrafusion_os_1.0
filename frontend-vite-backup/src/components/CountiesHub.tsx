import React, {useState, useEffect} from 'react';

interface County {id: string;
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
  endpoint?: string;}

const CountiesHub: React.FC = () => {const [filter, setFilter] = useState<string>('all');
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
        'https://services8.arcgis.com/COL6rRPkF9w28VGX/arcgis/rest/services/Tax_Parcels/FeatureServer/0',},
    {id: 'cowlitz',
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
      endpoint: 'https://cowlitzgis.net/ccserver/rest/services/Cadastral/Parcels/MapServer',},
    {id: 'yakima',
      name: 'Yakima County',
      population: '256,728',
      parcels: '115,000+',
      budget: '$320M',
      system: 'ArcGIS Open Data',
      systemBadge: 'ArcGIS Open Data',
      integrationScore: 92,
      status: 'ready',
      type: 'arcgis',
      priority: 'high',},
    {id: 'king',
      name: 'King County',
      population: '2,269,675',
      parcels: '750,000+',
      budget: '$7.2B',
      system: 'Enterprise GIS',
      systemBadge: 'Enterprise GIS',
      integrationScore: 98,
      status: 'ready',
      type: 'arcgis',
      priority: 'critical',},
    {id: 'snohomish',
      name: 'Snohomish County',
      population: '827,957',
      parcels: '320,000+',
      budget: '$1.8B',
      system: 'GIS Open Data',
      systemBadge: 'GIS Open Data',
      integrationScore: 94,
      status: 'ready',
      type: 'arcgis',
      priority: 'high',},
    {id: 'clark',
      name: 'Clark County',
      population: '503,311',
      parcels: '195,000+',
      budget: '$680M',
      system: 'ArcGIS Hub',
      systemBadge: 'ArcGIS Hub',
      integrationScore: 96,
      status: 'ready',
      type: 'arcgis',
      priority: 'high',},
    {id: 'whatcom',
      name: 'Whatcom County',
      population: '226,847',
      parcels: '105,000+',
      budget: '$285M',
      system: 'Traditional GIS',
      systemBadge: 'Traditional GIS',
      integrationScore: 82,
      status: 'ready',
      type: 'hybrid',
      priority: 'high',},
    {id: 'stevens',
      name: 'Stevens County',
      population: '46,445',
      parcels: '35,000+',
      budget: '$45M',
      system: 'Traditional GIS',
      systemBadge: 'Traditional GIS',
      integrationScore: 72,
      status: 'analyzing',
      type: 'hybrid',
      priority: 'low',},
  ];

  useEffect(() =>{setCounties(countyData);}, []);

  const filteredCounties = counties.filter((county) => {switch (filter) {
      case 'arcgis':
        return county.type === 'arcgis';
      case 'ready':
        return county.status === 'ready';
      case 'priority':
        return county.priority === 'high' || county.priority === 'critical';
      default:
        return true;}
  });

  const getCountyColor = (type: string) => {switch (type) {
      case 'arcgis':
        return '#00ffee';
      case 'custom':
        return '#00ff88';
      case 'hybrid':
        return '#ffaa00';
      default:
        return '#00ffee';}
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

  return (<div
      style={{
        width: '100%',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0f1c 0%, #1a2332 100%)',
        color: '#fff',
        padding: '2rem',}}
    >{/* Header */}<div style={{ textAlign: 'center', marginBottom: '3rem', position: 'relative'}}><span
          style={{
            position: 'absolute',
            top: '-10px',
            right: '20px',
            background: 'linear-gradient(135deg, #0099ff, #00ffee)',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            fontSize: '0.9rem',
            fontWeight: 600,
            color: '#000',}}
        >🌲 Washington State</span><h1
          style={{
            fontSize: '2.5rem',
            fontWeight: 900,
            background: 'linear-gradient(135deg, #0099ff, #00ffee, #00ffaa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '0.5rem',}}
        >Terrafusion County Integration Hub</h1><p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem'}}>Real-time GIS system analysis and migration readiness for 12 Washington counties</p></div>{/* Stats Bar */}<div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '2rem',
          marginBottom: '3rem',
          flexWrap: 'wrap',}}
      >{[
          {value: '12', label: 'Target Counties'},
          {value: '2.3M', label: 'Total Parcels'},
          {value: '$847B', label: 'Property Value'},
          {value: '92%', label: 'Integration Ready'},
        ].map((stat, index) => (<div
            key={index}
            style={{
              textAlign: 'center',
              padding: '1.5rem 2rem',
              background: 'rgba(0,153,255,0.1)',
              borderRadius: '15px',
              border: '1px solid rgba(0,255,238,0.2)',
              backdropFilter: 'blur(10px)',}}
          ><div
              style={{
                fontSize: '2.5rem',
                fontWeight: 900,
                background: 'linear-gradient(135deg, #00ffee, #00ffaa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',}}
            >{stat.value}</div><div
              style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: '0.9rem',
                marginTop: '0.5rem',}}
            >{stat.label}</div></div>))}</div>{/* Filter Controls */}<div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          marginBottom: '2rem',
          flexWrap: 'wrap',}}
      >{[
          {key: 'all', label: 'All Counties'},
          {key: 'arcgis', label: 'ArcGIS Systems'},
          {key: 'ready', label: 'Migration Ready'},
          {key: 'priority', label: 'Priority Targets'},
        ].map((filterOption) => (<button
            key={filterOption.key}
            onClick={() =>setFilter(filterOption.key)}
            style={{
              padding: '0.7rem 1.5rem',
              background:
                filter === filterOption.key
                  ? 'linear-gradient(135deg, #0099ff, #00ffee)'
                  : 'rgba(0,153,255,0.1)',
              border: '1px solid rgba(0,255,238,0.3)',
              borderRadius: '25px',
              color: filter === filterOption.key ? '#000' : '#00ffee',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontWeight: 600,
              transform: filter === filterOption.key ? 'scale(1.05)' : 'scale(1)',}}
          >
            {filterOption.label}</button>))}</div>{/* Counties Grid */}<div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
          gap: '2rem',
          maxWidth: '1600px',
          margin: '0 auto',}}
      >{filteredCounties.map((county) => (<div
            key={county.id}
            style={{
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0,255,238,0.2)',
              borderRadius: '20px',
              padding: '1.5rem',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',}}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = `0 20px 40px ${getCountyColor(county.type)}30`;
              e.currentTarget.style.borderColor = getCountyColor(county.type);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = 'rgba(0,255,238,0.2)';}}
          ><div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: `linear-gradient(90deg, ${getCountyColor(county.type)}, transparent)`,
              }} />{/* County Header */}<div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
                marginBottom: '1rem',}}
            ><div
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  color: '#fff',}}
              >{county.name}</div><div
                style={{
                  padding: '0.3rem 0.8rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  background:
                    county.status === 'ready' ? 'rgba(0,255,136,0.1)' : 'rgba(255,170,0,0.1)',
                  color: county.status === 'ready' ? '#00ff88' : '#ffaa00',
                  border:
                    county.status === 'ready'
                      ? '1px solid rgba(0,255,136,0.3)'
                      : '1px solid rgba(255,170,0,0.3)',
                  animation:
                    county.status === 'analyzing' ? 'pulse 2s ease-in-out infinite' : 'none',}}
              >{county.status === 'ready' ? 'Ready' : 'Analyzing'}</div></div>{/* County Info */}<div style={{ marginBottom: '1rem'}}>{[
                {label: 'Population', value: county.population},
                {label: 'Parcels', value: county.parcels},
                {label: 'Annual Budget', value: county.budget},
              ].map((info, index) => (<div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    fontSize: '0.9rem',}}
                ><span style={{ color: 'rgba(255,255,255,0.6)'}}>{info.label}</span><span style={{ color: '#00ffee', fontWeight: 600}}>{info.value}</span></div>))}</div>{/* System Details */}<div
              style={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '10px',
                padding: '1rem',
                marginBottom: '1rem',}}
            ><div
                style={{
                  fontSize: '0.85rem',
                  color: 'rgba(255,255,255,0.7)',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',}}
              >Current System:<span
                  style={{
                    display: 'inline-block',
                    padding: '0.2rem 0.5rem',
                    background: 'rgba(0,255,238,0.2)',
                    borderRadius: '10px',
                    fontSize: '0.75rem',
                    color: '#00ffee',}}
                >{county.systemBadge}</span></div></div>{/* Integration Score */}<div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem',}}
            ><div
                style={{
                  flex: 1,
                  height: '8px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '4px',
                  overflow: 'hidden',}}
              ><div
                  style={{
                    height: '100%',
                    width: `${county.integrationScore}%`,
                    background: 'linear-gradient(90deg, #0099ff, #00ffee, #00ffaa)',
                    transition: 'width 1s ease',
                  }} /></div><span
                style={{
                  fontWeight: 700,
                  color: '#00ffee',
                  minWidth: '45px',
                  textAlign: 'right',}}
              >{county.integrationScore}%</span></div>{/* Action Buttons */}<div style={{ display: 'flex', gap: '0.5rem'}}><button
                onClick={() =>initiateMigration(county.id)}
                style={{
                  flex: 1,
                  padding: '0.8rem',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontSize: '0.9rem',
                  background: 'linear-gradient(135deg, #0099ff, #00ffee)',
                  color: '#000',}}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,255,238,0.4)';}}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';}}
              >
                {county.status === 'ready' ? 'Start Migration' : 'Assess System'}</button><button
                onClick={() =>viewDetails(county.id)}
                style={{
                  flex: 1,
                  padding: '0.8rem',
                  background: 'transparent',
                  border: '1px solid rgba(0,255,238,0.3)',
                  borderRadius: '10px',
                  color: '#00ffee',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  fontSize: '0.9rem',}}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0,255,238,0.1)';}}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';}}
              >
                View Analysis</button></div></div>))}</div>{/* Migration Summary */}<div
        style={{
          marginTop: '3rem',
          padding: '2rem',
          background: 'rgba(0,0,0,0.4)',
          borderRadius: '20px',
          border: '1px solid rgba(0,255,238,0.2)',
          textAlign: 'center',}}
      ><h2
          style={{
            fontSize: '1.8rem',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #0099ff, #00ffee, #00ffaa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '1.5rem',}}
        >Washington State Migration Opportunity</h2><div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem',
            marginTop: '2rem',}}
        >{[
            {value: '$2.8M', label: 'Total Annual Savings'},
            {value: '72hrs', label: 'Average Migration Time'},
            {value: '379M×', label: 'Speed Improvement'},
            {value: '98%', label: 'Projected Adoption'},
          ].map((item, index) => (<div
              key={index}
              style={{
                padding: '1rem',
                background: 'rgba(0,153,255,0.05)',
                borderRadius: '15px',
                border: '1px solid rgba(0,255,238,0.2)',}}
            ><div
                style={{
                  fontSize: '1.8rem',
                  fontWeight: 900,
                  color: '#00ffee',
                  marginBottom: '0.5rem',}}
              >{item.value}</div><div
                style={{
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '0.9rem',}}
              >{item.label}</div></div>))}</div></div><style>{`
        @keyframes pulse {0%, 100% { opacity: 1;}
          50% {opacity: 0.6;}
        }
      `}</style></div>
  );
};

export default CountiesHub;

import React, { useState, useEffect } from 'react';
interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  price: string;
  rating: number;
  downloads: string;
  vendor: string;
  featured: boolean;
  tags: string[];
  screenshots: string[];
}
const Marketplace: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const categories = [
    {
      id: 'all',
      name: 'All Modules',
      icon: '🏪',
    },
    {
      id: 'assessment',
      name: 'Assessment Tools',
      icon: '📊',
    },
    {
      id: 'gis',
      name: 'GIS Integration',
      icon: '🗺️',
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: '📈',
    },
    {
      id: 'compliance',
      name: 'Compliance',
      icon: '🔒',
    },
    {
      id: 'workflow',
      name: 'Workflow',
      icon: '⚡',
    },
    {
      id: 'reporting',
      name: 'Reporting',
      icon: '📋',
    },
  ];
  const marketplaceItems: MarketplaceItem[] = [
    {
      id: 'costforge-pro',
      name: 'CostForge AI Pro',
      description: 'Advanced AI-powered property valuation with machine learning optimization',
      category: 'assessment',
      icon: '🤖',
      price: '$299/month',
      rating: 4.9,
      downloads: '2.3K',
      vendor: 'Terrafusion Labs',
      featured: true,
      tags: ['AI', 'Valuation', 'Machine Learning'],
      screenshots: [],
    },
    {
      id: 'gis-connector',
      name: 'Universal GIS Connector',
      description: 'Connect to any GIS system with pre-built integrations for major platforms',
      category: 'gis',
      icon: '🔗',
      price: '$149/month',
      rating: 4.7,
      downloads: '1.8K',
      vendor: 'GeoTech Solutions',
      featured: true,
      tags: ['GIS', 'Integration', 'API'],
      screenshots: [],
    },
    {
      id: 'compliance-suite',
      name: 'FISMA Compliance Suite',
      description: 'Complete federal compliance monitoring and reporting toolkit',
      category: 'compliance',
      icon: '🛡️',
      price: '$399/month',
      rating: 4.8,
      downloads: '956',
      vendor: 'SecureGov Inc',
      featured: false,
      tags: ['FISMA', 'Security', 'Compliance'],
      screenshots: [],
    },
    {
      id: 'analytics-engine',
      name: 'Advanced Analytics Engine',
      description: 'Predictive analytics and business intelligence for county operations',
      category: 'analytics',
      icon: '📊',
      price: '$199/month',
      rating: 4.6,
      downloads: '1.2K',
      vendor: 'DataFlow Systems',
      featured: false,
      tags: ['Analytics', 'BI', 'Predictions'],
      screenshots: [],
    },
    {
      id: 'workflow-automation',
      name: 'Smart Workflow Automation',
      description: 'Automate repetitive tasks and streamline approval processes',
      category: 'workflow',
      icon: '⚙️',
      price: '$89/month',
      rating: 4.5,
      downloads: '3.1K',
      vendor: 'AutoFlow Pro',
      featured: false,
      tags: ['Automation', 'Workflow', 'Efficiency'],
      screenshots: [],
    },
    {
      id: 'report-builder',
      name: 'Dynamic Report Builder',
      description: 'Create custom reports and dashboards with drag-and-drop interface',
      category: 'reporting',
      icon: '📈',
      price: '$129/month',
      rating: 4.4,
      downloads: '2.7K',
      vendor: 'ReportCraft',
      featured: false,
      tags: ['Reports', 'Dashboards', 'Visualization'],
      screenshots: [],
    },
    {
      id: 'mobile-inspector',
      name: 'Mobile Field Inspector',
      description: 'Mobile app for field inspections with offline capabilities',
      category: 'assessment',
      icon: '📱',
      price: '$79/month',
      rating: 4.3,
      downloads: '1.9K',
      vendor: 'FieldTech Mobile',
      featured: false,
      tags: ['Mobile', 'Inspection', 'Offline'],
      screenshots: [],
    },
    {
      id: 'citizen-portal',
      name: 'Citizen Self-Service Portal',
      description: 'Allow citizens to access property information and submit requests online',
      category: 'workflow',
      icon: '👥',
      price: '$159/month',
      rating: 4.7,
      downloads: '4.2K',
      vendor: 'CitizenConnect',
      featured: true,
      tags: ['Portal', 'Self-Service', 'Citizens'],
      screenshots: [],
    },
  ];
  useEffect(() => {
    setItems(marketplaceItems);
  }, []);
  const filteredItems = items.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      searchTerm === '' ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });
  const featuredItems = filteredItems.filter((item) => item.featured);
  const installModule = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (item) {
      alert(`Installing ${item.name}...`);
    }
  };
  const viewDetails = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (item) {
      alert(`Viewing details for ${item.name}...`);
    }
  };
  return (
    <div className='w-full p-8'>
      {/* Header */}
      <div className='text-center'>
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
          Terrafusion Marketplace
        </h1>
        <p
          style={{
            color: 'hsl(var(--tf-neutral-hs) 100% / 0.7)',
            fontSize: '1.1rem',
          }}
        >
          Enterprise modules and integrations for government operations
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className='flex gap-4 items-center'>
        <input
          type='text'
          placeholder='Search modules, vendors, or features...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: '1',
            minWidth: '300px',
            maxWidth: '500px',
            padding: '0.8rem 1rem',
            background: 'hsl(var(--tf-neutral-hs) 100% / 0.1)',
            border: '1px solid hsl(var(--tf-primary-hs) 50% / 0.3)',
            borderRadius: '25px',
            color: 'var(--tf-text-primary)',
            fontSize: '0.9rem',
            outline: 'none',
          }}
        />
      </div>

      {/* Category Filter */}
      <div className='flex gap-2'>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            style={{
              background:
                selectedCategory === category.id
                  ? 'linear-gradient(135deg, var(--tf-network-blue), var(--tf-transcend-highlight))'
                  : 'hsl(var(--tf-primary-hs) 50% / 0.1)',
              color: selectedCategory === category.id ? 'var(--tf-void-black)' : 'var(--tf-transcend-highlight)',
            }}
            className='font-semibold flex items-center gap-2'
          >
            <span>{category.icon}</span>
            {category.name}
          </button>
        ))}
      </div>

      {/* Featured Section */}
      {featuredItems.length > 0 && (
        <div
          style={{
            marginBottom: '3rem',
          }}
        >
          <h2 className='text-center'>⭐ Featured Modules</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '1.5rem',
              maxWidth: '1200px',
              margin: '0 auto',
            }}
          >
            {featuredItems.map((item) => (
              <div
                key={item.id}
                style={{
                  background: 'hsl(var(--tf-neutral-hs) 0% / 0.6)',
                  backdropFilter: 'blur(20px)',
                  border: '2px solid var(--tf-accent-success)',
                  borderRadius: '20px',
                  padding: '1.5rem',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 20px 40px hsl(var(--tf-success-hs) 45% / 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    background: 'linear-gradient(135deg, var(--tf-accent-success), var(--tf-transcend-highlight))',
                    color: 'var(--tf-void-black)',
                    padding: '0.3rem 0.8rem',
                    borderRadius: '15px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  FEATURED
                </div>

                <div className='flex items-center gap-4'>
                  <div className='flex items-center'>{item.icon}</div>
                  <div>
                    <h3
                      style={{
                        fontSize: '1.3rem',
                        fontWeight: 700,
                        color: 'var(--tf-text-primary)',
                        margin: '0 0 0.3rem 0',
                      }}
                    >
                      {item.name}
                    </h3>
                    <p
                      style={{
                        color: 'hsl(var(--tf-neutral-hs) 100% / 0.6)',
                        fontSize: '0.85rem',
                        margin: 0,
                      }}
                    >
                      by {item.vendor}
                    </p>
                  </div>
                </div>

                <p
                  style={{
                    color: 'hsl(var(--tf-neutral-hs) 100% / 0.8)',
                    fontSize: '0.9rem',
                    lineHeight: 1.4,
                    marginBottom: '1rem',
                  }}
                >
                  {item.description}
                </p>

                <div className='flex justify-between items-center'>
                  <div
                    style={{
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      color: 'var(--tf-accent-success)',
                    }}
                  >
                    {item.price}
                  </div>
                  <div className='flex items-center gap-4'>
                    <span>⭐ {item.rating}</span>
                    <span>📥 {item.downloads}</span>
                  </div>
                </div>

                <div className='flex gap-2'>
                  {item.tags.map((tag, index) => (
                    <span key={index} className='font-semibold'>
                      {tag}
                    </span>
                  ))}
                </div>

                <div className='flex gap-2'>
                  <button
                    onClick={() => installModule(item.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    className='flex-1'
                  >
                    Install Now
                  </button>
                  <button
                    onClick={() => viewDetails(item.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'hsl(var(--tf-primary-hs) 50% / 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                    className='font-semibold'
                  >
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Modules Grid */}
      <div
        style={{
          marginBottom: '2rem',
        }}
      >
        <h2 className='text-center'>All Modules ({filteredItems.length})</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem',
            maxWidth: '1400px',
            margin: '0 auto',
          }}
        >
          {filteredItems.map((item) => (
            <div
              key={item.id}
              style={{
                background: 'hsl(var(--tf-neutral-hs) 0% / 0.5)',
                backdropFilter: 'blur(20px)',
                border: '1px solid hsl(var(--tf-primary-hs) 50% / 0.2)',
                borderRadius: '15px',
                padding: '1.5rem',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 15px 30px hsl(var(--tf-primary-hs) 50% / 0.2)';
                e.currentTarget.style.borderColor = 'var(--tf-transcend-highlight)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'hsl(var(--tf-primary-hs) 50% / 0.2)';
              }}
            >
              {item.featured && (
                <div
                  style={{
                    position: 'absolute',
                    top: '0.8rem',
                    right: '0.8rem',
                    background: 'var(--tf-accent-success)',
                    color: 'var(--tf-void-black)',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '10px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                  }}
                >
                  FEATURED
                </div>
              )}

              <div className='flex items-center'>
                <div className='flex items-center'>{item.icon}</div>
                <div>
                  <h3
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      color: 'var(--tf-text-primary)',
                      margin: '0 0 0.2rem 0',
                    }}
                  >
                    {item.name}
                  </h3>
                  <p
                    style={{
                      color: 'hsl(var(--tf-neutral-hs) 100% / 0.6)',
                      fontSize: '0.8rem',
                      margin: 0,
                    }}
                  >
                    by {item.vendor}
                  </p>
                </div>
              </div>

              <p
                style={{
                  color: 'hsl(var(--tf-neutral-hs) 100% / 0.7)',
                  fontSize: '0.85rem',
                  lineHeight: 1.4,
                  marginBottom: '1rem',
                  height: '2.4em',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {item.description}
              </p>

              <div className='flex justify-between items-center'>
                <div
                  style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: 'var(--tf-transcend-highlight)',
                  }}
                >
                  {item.price}
                </div>
                <div className='flex items-center'>
                  <span>⭐ {item.rating}</span>
                  <span>📥 {item.downloads}</span>
                </div>
              </div>

              <div className='flex gap-2'>
                <button onClick={() => installModule(item.id)} className='flex-1 font-semibold'>
                  Install
                </button>
                <button onClick={() => viewDetails(item.id)} className='font-semibold'>
                  Info
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Footer */}
      <div className='p-8 text-center'>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {[
            {
              value: '47',
              label: 'Total Modules',
            },
            {
              value: '12K+',
              label: 'Downloads',
            },
            {
              value: '4.7',
              label: 'Avg Rating',
            },
            {
              value: '24/7',
              label: 'Support',
            },
          ].map((stat, index) => (
            <div key={index}>
              <div
                style={{
                  fontSize: '1.8rem',
                  fontWeight: 900,
                  color: 'var(--tf-transcend-highlight)',
                  marginBottom: '0.3rem',
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  color: 'hsl(var(--tf-neutral-hs) 100% / 0.7)',
                  fontSize: '0.9rem',
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default Marketplace;

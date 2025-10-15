// Terrafusion Data Marketplace
// Counties can sell anonymized/public data to commercial users
// Commercial users can purchase additional county data packages

import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { ShoppingCart, 
  Download, 
  Lock, 
  Unlock, 
  MapPin,
  Database,
  TrendingUp,
  DollarSign,
  Shield,
  Globe
 } from '@mui/icons-material';

interface CountyDataPackage {
  countyId: string;
  countyName: string;
  state: string;
  propertyCount: number;
  dataType: 'public' | 'anonymized' | 'aggregated';
  lastUpdated: string;
  price: {
    oneTime: number;
    monthly: number;
    annual: number;
  };
  features: string[];
  sampleData: boolean;
  rating: number;
  purchases: number;
}

interface UserLicense {
  type: 'government' | 'commercial';
  tier?: 'starter' | 'professional' | 'enterprise' | 'ultimate';
  ownedCounties: string[];
  dataCredits: number;
}

export const DataMarketplace: React.FC = () => {
  const [availablePackages, setAvailablePackages] = useState<CountyDataPackage[]>([]);
  const [userLicense, setUserLicense] = useState<UserLicense | null>(null);
  const [cart, setCart] = useState<CountyDataPackage[]>([]);
  const [selectedView, setSelectedView] = useState<'grid' | 'map'>('grid');
  const [filterState, setFilterState] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadMarketplaceData();
    loadUserLicense();
  }, []);

  const loadMarketplaceData = async () => {
    // Load available county data packages
    const packages: CountyDataPackage[] = [
      {
        countyId: 'wa-benton',
        countyName: 'Benton',
        state: 'WA',
        propertyCount: 94149,
        dataType: 'public',
        lastUpdated: '2025-01-10',
        price: {
          oneTime: 50000,
          monthly: 5000,
          annual: 48000
        },
        features: [
          'Property boundaries',
          'Public assessments',
          'Zoning data',
          'Sales history',
          'Tax records'
        ],
        sampleData: true,
        rating: 4.8,
        purchases: 127
      },
      {
        countyId: 'wa-franklin',
        countyName: 'Franklin',
        state: 'WA',
        propertyCount: 45000,
        dataType: 'public',
        lastUpdated: '2025-01-09',
        price: {
          oneTime: 35000,
          monthly: 3500,
          annual: 36000
        },
        features: [
          'Property boundaries',
          'Public assessments',
          'Agricultural data',
          'Irrigation districts',
          'Tax records'
        ],
        sampleData: true,
        rating: 4.7,
        purchases: 89
      },
      {
        countyId: 'wa-king',
        countyName: 'King',
        state: 'WA',
        propertyCount: 850000,
        dataType: 'aggregated',
        lastUpdated: '2025-01-11',
        price: {
          oneTime: 150000,
          monthly: 15000,
          annual: 144000
        },
        features: [
          'Seattle metro area',
          'Commercial properties',
          'Residential data',
          'Development permits',
          'Market trends'
        ],
        sampleData: true,
        rating: 4.9,
        purchases: 342
      },
      {
        countyId: 'ca-los-angeles',
        countyName: 'Los Angeles',
        state: 'CA',
        propertyCount: 2500000,
        dataType: 'aggregated',
        lastUpdated: '2025-01-08',
        price: {
          oneTime: 250000,
          monthly: 25000,
          annual: 240000
        },
        features: [
          'Largest US county dataset',
          'Commercial properties',
          'Residential data',
          'Entertainment properties',
          'Beach properties'
        ],
        sampleData: true,
        rating: 4.6,
        purchases: 218
      }
    ];
    
    setAvailablePackages(packages);
  };

  const loadUserLicense = async () => {
    try {
      const license = await invoke('get_user_license');
      setUserLicense(license as UserLicense);
    } catch (error) {
      // Default to commercial for demo
      setUserLicense({
        type: 'commercial',
        tier: 'professional',
        ownedCounties: ['wa-benton'],
        dataCredits: 100000
      });
    }
  };

  const addToCart = (pkg: CountyDataPackage) => {
    if (!cart.find(p => p.countyId === pkg.countyId)) {
      setCart([...cart, pkg]);
    }
  };

  const removeFromCart = (countyId: string) => {
    setCart(cart.filter(p => p.countyId !== countyId));
  };

  const calculateTotal = () => {
    return cart.reduce((total, pkg) => total + pkg.price.annual, 0);
  };

  const purchasePackages = async () => {
    try {
      const purchaseData = {
        packages: cart.map(p => p.countyId),
        licenseId: userLicense?.type,
        paymentMethod: 'credits',
        total: calculateTotal()
      };
      
      await invoke('purchase_county_data', { purchaseData });
      
      // Update owned counties
      if (userLicense) {
        setUserLicense({
          ...userLicense,
          ownedCounties: [...userLicense.ownedCounties, ...cart.map(p => p.countyId)],
          dataCredits: userLicense.dataCredits - calculateTotal()
        });
      }
      
      setCart([]);
      alert('Purchase successful! Data packages are now available.');
    } catch (error) {
      console.error('Purchase failed:', error);
    }
  };

  const isOwned = (countyId: string) => {
    return userLicense?.ownedCounties.includes(countyId) || false;
  };

  const filteredPackages = availablePackages.filter(pkg => {
    const matchesState = filterState === 'all' || pkg.state === filterState;
    const matchesSearch = pkg.countyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          pkg.state.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesState && matchesSearch;
  });

  return (
    <div className="data-marketplace">
      {/* Header */}
      <div className="marketplace-header"><>

        <h1>Terrafusion Data Marketplace</h1>
        <p
</>
</>>Expand your coverage with additional county data packages</p>
        
        <div className="license-info">
          <Shield className="icon" /><>

          <span>
            {userLicense?.type === 'government' ? 'Government License' : `Commercial ${userLicense?.tier} License`}
          </span>
          <span
</>
className="separator">|</span>
          <Database className="icon" /><>

          <span>{userLicense?.ownedCounties.length} Counties Owned</span>
          <span
</>
className="separator">|</span>
          <DollarSign className="icon" />
          <span>{userLicense?.dataCredits?.toLocaleString()} Credits</span>
        </div>
      </div>

      {/* Filters */}
      <div className="marketplace-filters">
        <input
          type="text"
          placeholder="Search counties..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        
        <select 
          value={filterState} 
          onChange={(e) => setFilterState(e.target.value)}
          className="state-filter"
        ><>

          <option value="all">All States</option>
          <option
</>
value="WA">Washington</option><>

          <option value="OR">Oregon</option>
          <option
</>
value="CA">California</option>
          <option value="ID">Idaho</option>
        </select>
        
        <div className="view-toggle"><>

          <button 
            className={selectedView === 'grid' ? 'active' : ''}
            onClick={() => setSelectedView('grid')}
          >
            Grid View
          </button>
          <button
</>

            className={selectedView === 'map' ? 'active' : ''}
            onClick={() => setSelectedView('map')}
          >
            Map View
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="marketplace-content">
        <div className="packages-grid">
          {filteredPackages.map(pkg => (
            <div key={pkg.countyId} className={`package-card ${isOwned(pkg.countyId) ? 'owned' : ''}`}>
              <div className="package-header">
                <h3>{pkg.countyName} County, {pkg.state}</h3>
                {isOwned(pkg.countyId) && (
                  <span className="owned-badge">
                    <Unlock className="icon" />
                    Owned
                  </span>
                )}
              </div>
              
              <div className="package-stats">
                <div className="stat">
                  <MapPin className="icon" />
                  <span>{pkg.propertyCount.toLocaleString()} properties</span>
                </div>
                <div className="stat">
                  <Database className="icon" />
                  <span>{pkg.dataType} data</span>
                </div>
                <div className="stat">
                  <TrendingUp className="icon" />
                  <span>{pkg.rating} ★ ({pkg.purchases} purchases)</span>
                </div>
              </div>
              
              <div className="package-features"><>

                <h4>Includes:</h4>
                <ul
</>
</>>
                  {pkg.features.map((feature, idx) => (
                    <li key={idx}>✓ {feature}</li>
                  ))}
                </ul>
              </div>
              
              <div className="package-pricing">
                <div className="price-option"><>

                  <span className="label">Annual</span>
                  <span
</>
className="price">${pkg.price.annual.toLocaleString()}</span>
                  <span className="period">/year</span>
                </div>
                <div className="price-option"><>

                  <span className="label">Monthly</span>
                  <span
</>
className="price">${pkg.price.monthly.toLocaleString()}</span>
                  <span className="period">/month</span>
                </div>
              </div>
              
              <div className="package-actions">
                {isOwned(pkg.countyId) ? (
                  <button className="btn-download">
                    <Download className="icon" />
                    Download Latest
                  </button>
                ) : (<>

                    <button 
                      className="btn-sample"
                      onClick={() => console.log('Download sample', pkg.countyId)}
                    >
                      Sample Data
                    </button>
                    <button
</>

                      className="btn-add-cart"
                      onClick={() => addToCart(pkg)}
                      disabled={cart.find(p => p.countyId === pkg.countyId) !== undefined}
                    >
                      <ShoppingCart className="icon" />
                      {cart.find(p => p.countyId === pkg.countyId) ? 'In Cart' : 'Add to Cart'}
                    </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Shopping Cart */}
        {cart.length > 0 && (
          <div className="shopping-cart">
            <h3><>

              <ShoppingCart className="icon" />
              Shopping Cart ({cart.length})
            </h3>
            
            <div
</>
className="cart-items">
              {cart.map(pkg => (
                <div key={pkg.countyId} className="cart-item"><>

                  <span>{pkg.countyName}, {pkg.state}</span>
                  <span
</>
</>>${pkg.price.annual.toLocaleString()}/year</span>
                  <button onClick={() => removeFromCart(pkg.countyId)}>×</button>
                </div>
              ))}
            </div>
            
            <div className="cart-total"><>

              <span>Total (Annual):</span>
              <span
</>
</>>${calculateTotal().toLocaleString()}</span>
            </div>
            
            <button 
              className="btn-purchase"
              onClick={purchasePackages}
              disabled={calculateTotal() > (userLicense?.dataCredits || 0)}
            >
              {calculateTotal() > (userLicense?.dataCredits || 0) 
                ? 'Insufficient Credits' 
                : 'Complete Purchase'}
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .data-marketplace {
          padding: 30px;
          background: linear-gradient(135deg, #0c1929 0%, #1a2332 100%);
          min-height: 100vh;
          color: #ffffff;
        }

        .marketplace-header {
          margin-bottom: 30px;
        }

        .marketplace-header h1 {
          font-size: 32px;
          margin-bottom: 10px;
          background: linear-gradient(135deg, #00e5ff 0%, #0099cc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .license-info {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 15px;
          background: rgba(0, 229, 255, 0.1);
          border: 1px solid rgba(0, 229, 255, 0.3);
          border-radius: 8px;
          margin-top: 20px;
        }

        .license-info .icon {
          width: 16px;
          height: 16px;
        }

        .separator {
          color: rgba(255, 255, 255, 0.3);
        }

        .marketplace-filters {
          display: flex;
          gap: 20px;
          margin-bottom: 30px;
        }

        .search-input {
          flex: 1;
          padding: 12px 20px;
          background: rgba(0, 42, 78, 0.5);
          border: 1px solid rgba(0, 229, 255, 0.3);
          border-radius: 8px;
          color: #ffffff;
        }

        .state-filter {
          padding: 12px 20px;
          background: rgba(0, 42, 78, 0.5);
          border: 1px solid rgba(0, 229, 255, 0.3);
          border-radius: 8px;
          color: #ffffff;
        }

        .view-toggle {
          display: flex;
          background: rgba(0, 42, 78, 0.5);
          border: 1px solid rgba(0, 229, 255, 0.3);
          border-radius: 8px;
          overflow: hidden;
        }

        .view-toggle button {
          padding: 12px 24px;
          background: transparent;
          border: none;
          color: #8fb3d5;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .view-toggle button.active {
          background: #00e5ff;
          color: #001528;
        }

        .marketplace-content {
          display: flex;
          gap: 30px;
        }

        .packages-grid {
          flex: 1;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }

        .package-card {
          background: rgba(26, 35, 50, 0.9);
          border: 1px solid rgba(0, 229, 255, 0.2);
          border-radius: 12px;
          padding: 20px;
          transition: all 0.3s ease;
        }

        .package-card:hover {
          border-color: rgba(0, 229, 255, 0.5);
          transform: translateY(-5px);
        }

        .package-card.owned {
          border-color: rgba(16, 185, 129, 0.5);
          background: rgba(16, 185, 129, 0.05);
        }

        .package-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .owned-badge {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 10px;
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
          border-radius: 20px;
          font-size: 12px;
        }

        .package-stats {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 20px;
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          color: #8fb3d5;
        }

        .stat .icon {
          width: 16px;
          height: 16px;
        }

        .package-features {
          margin-bottom: 20px;
        }

        .package-features h4 {
          font-size: 14px;
          margin-bottom: 10px;
          color: #8fb3d5;
        }

        .package-features ul {
          list-style: none;
          padding: 0;
        }

        .package-features li {
          padding: 5px 0;
          font-size: 13px;
          color: #8fb3d5;
        }

        .package-pricing {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 20px;
          padding: 15px;
          background: rgba(0, 42, 78, 0.3);
          border-radius: 8px;
        }

        .price-option {
          text-align: center;
        }

        .price-option .label {
          display: block;
          font-size: 12px;
          color: #8fb3d5;
          margin-bottom: 5px;
        }

        .price-option .price {
          display: block;
          font-size: 20px;
          font-weight: bold;
          color: #00e5ff;
        }

        .price-option .period {
          display: block;
          font-size: 11px;
          color: #8fb3d5;
        }

        .package-actions {
          display: flex;
          gap: 10px;
        }

        .package-actions button {
          flex: 1;
          padding: 10px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
        }

        .btn-sample {
          background: rgba(0, 42, 78, 0.5);
          color: #8fb3d5;
          border: 1px solid rgba(0, 229, 255, 0.3);
        }

        .btn-add-cart {
          background: linear-gradient(135deg, #00e5ff 0%, #0099cc 100%);
          color: #001528;
        }

        .btn-add-cart:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-download {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: #ffffff;
        }

        .shopping-cart {
          width: 300px;
          background: rgba(26, 35, 50, 0.9);
          border: 1px solid rgba(0, 229, 255, 0.2);
          border-radius: 12px;
          padding: 20px;
          height: fit-content;
          position: sticky;
          top: 20px;
        }

        .shopping-cart h3 {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
        }

        .cart-items {
          margin-bottom: 20px;
        }

        .cart-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          background: rgba(0, 42, 78, 0.3);
          border-radius: 6px;
          margin-bottom: 10px;
        }

        .cart-item button {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border: none;
          cursor: pointer;
        }

        .cart-total {
          display: flex;
          justify-content: space-between;
          padding: 15px;
          background: rgba(0, 42, 78, 0.5);
          border-radius: 6px;
          margin-bottom: 20px;
          font-weight: bold;
        }

        .btn-purchase {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #00e5ff 0%, #0099cc 100%);
          color: #001528;
          border: none;
          border-radius: 6px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-purchase:disabled {
          background: rgba(239, 68, 68, 0.5);
          color: #ffffff;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};
import React, { useState } from 'react';
const BrandKit: React.FC = () => {
  const [activeSection, setActiveSection] = useState('brand');
  const colorPalette = [{
    name: 'Trust Blue',
    hex: '#0099ff',
    label: 'PRIMARY'
  }, {
    name: 'Transcendence Cyan',
    hex: '#00ffee',
    label: 'TRANSCEND'
  }, {
    name: 'Success Green',
    hex: '#00ffaa',
    label: 'ACCENT'
  }, {
    name: 'Deep Space',
    hex: '#0b1020',
    label: 'DARK'
  }, {
    name: 'Midnight',
    hex: '#1a1f3a',
    label: 'SURFACE'
  }];
  const modules = [{
    icon: '🏢',
    name: 'Terra Agent',
    tagline: 'Property Intelligence. Transcended.'
  }, {
    icon: '💧',
    name: 'Terra Flow',
    tagline: 'Workflows. Transcended.'
  }, {
    icon: '📋',
    name: 'Web Audit Tracker',
    tagline: 'Compliance. Transcended.'
  }, {
    icon: '💰',
    name: 'Terra Levy',
    tagline: 'Tax Management. Transcended.'
  }, {
    icon: '🤖',
    name: 'CostForge AI',
    tagline: 'Valuation. Transcended.'
  }, {
    icon: '🏪',
    name: 'Marketplace',
    tagline: 'Transactions. Transcended.'
  }];
  return <div style={{
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    background: '#0b1020',
    color: '#ffffff',
    minHeight: '100vh',
    lineHeight: 1.6
  }}>
      {/* Navigation */}
      <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      background: 'rgba(11,16,32,0.95)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(0,255,238,0.1)',
      padding: '1rem 2rem'
    }}>
        <ul className="flex">
          {['brand', 'colors', 'typography', 'modules'].map(section => <li key={section}>
              <button onClick={() => setActiveSection(section)} style={{
            color: activeSection === section ? '#00ffee' : 'rgba(255,255,255,0.7)',
            transition: 'all 0.3s ease',
            padding: '0.5rem 1rem',
            borderRadius: '50px',
            fontWeight: 500,
            background: activeSection === section ? 'rgba(0,255,238,0.1)' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            textTransform: 'capitalize'
          }}>
                {section}
              </button>
            </li>)}
        </ul>
      </nav>

      {/* Hero Section */}
      <div style={{
      background: `
          radial-gradient(circle at 20% 50%, rgba(0,153,255,0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 50%, rgba(0,255,238,0.2) 0%, transparent 50%),
          linear-gradient(180deg, #0b1020 0%, #0a0f1c 100%)
        `
    }} className="flex items-center">
        <div className="text-center p-8">
          <div style={{
          marginBottom: '3rem'
        }}>
            <div className="flex items-center">
              TF
            </div>
          </div>


          <h1 style={{
          fontSize: 'clamp(3rem, 8vw, 5rem)',
          fontWeight: 100,
          letterSpacing: '-2px',
          marginBottom: '1rem',
          background: 'linear-gradient(135deg, #0099ff 0%, #00ffee 50%, #00ffaa 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          margin: '0 0 1rem 0'
        }}>
            Terrafusion OS
          </h1>
          
          <div style={{
          fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
          fontWeight: 200,
          color: '#00ffee',
          marginBottom: '0.5rem',
          letterSpacing: '2px'
        }}>
            Government. Transcended.
          </div>
          
          <div style={{
          fontSize: 'clamp(1rem, 2vw, 1.25rem)',
          color: 'rgba(255,255,255,0.7)',
          marginBottom: '3rem'
        }}>
            Turn Complexity into Clarity.
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div style={{
      padding: '5rem 2rem',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
        
        {/* Brand Identity Section */}
        {activeSection === 'brand' && <section>


            <h2 className="text-center">
              Brand Identity
            </h2>
            
            <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem'
        }}>
              <div className="p-8">


                <div style={{
              fontSize: '3rem',
              marginBottom: '1rem'
            }}>✨</div>
                <div style={{
              fontSize: '1.5rem',
              fontWeight: 300,
              color: '#00ffee',
              marginBottom: '1rem'
            }}>
                  Core Essence
                </div>
                <div style={{
              color: 'rgba(255,255,255,0.7)',
              lineHeight: 1.8
            }}>
                  Terrafusion transcends traditional government technology. We transform complexity into clarity, delivering 379 million times faster performance while maintaining 98% accuracy.
                </div>
              </div>

              <div className="p-8">


                <div style={{
              fontSize: '3rem',
              marginBottom: '1rem'
            }}>🎯</div>
                <div style={{
              fontSize: '1.5rem',
              fontWeight: 300,
              color: '#00ffee',
              marginBottom: '1rem'
            }}>
                  Mission
                </div>
                <div style={{
              color: 'rgba(255,255,255,0.7)',
              lineHeight: 1.8
            }}>
                  To revolutionize government operations through transcendent technology. We empower agencies to process property data and deliver citizen services at unprecedented speed.
                </div>
              </div>

              <div className="p-8">


                <div style={{
              fontSize: '3rem',
              marginBottom: '1rem'
            }}>💎</div>
                <div style={{
              fontSize: '1.5rem',
              fontWeight: 300,
              color: '#00ffee',
              marginBottom: '1rem'
            }}>
                  Values
                </div>
                <div style={{
              color: 'rgba(255,255,255,0.7)',
              lineHeight: 1.8
            }}>
                  <strong>Precision:</strong> We do it right the first time.<br />
                  <strong>Speed:</strong> 379 million times faster.<br />
                  <strong>Clarity:</strong> Complex made simple.<br />
                  <strong>Innovation:</strong> Always transcending.
                </div>
              </div>
            </div>
          </section>}

        {/* Colors Section */}
        {activeSection === 'colors' && <section>


            <h2 className="text-center">
              Color System
            </h2>
            
            <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '2rem'
        }}>
              {colorPalette.map((color, index) => <div key={index} className="text-center">


                  <div style={{
              background: color.hex
            }} className="flex items-center font-semibold">
                    {color.label}
                  </div>
                  <div className="mb-1">
                    {color.name}
                  </div>
                  <div style={{
              fontFamily: "'Courier New', monospace",
              color: 'rgba(255,255,255,0.7)',
              fontSize: '0.9rem'
            }}>
                    {color.hex}
                  </div>
                </div>)}
            </div>
          </section>}

        {/* Typography Section */}
        {activeSection === 'typography' && <section>


            <h2 className="text-center">
              Typography
            </h2>
            
            <div style={{
          background: 'rgba(0,0,0,0.4)',
          borderRadius: '20px',
          padding: '3rem'
        }}>
              <div style={{
            marginBottom: '2rem',
            paddingBottom: '2rem',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}>


                <div className="text-sm">
                  Display Large
                </div>
                <div style={{
              fontSize: '4rem',
              fontWeight: 100,
              letterSpacing: '-2px'
            }}>
                  Government. Transcended.
                </div>
              </div>

              <div style={{
            marginBottom: '2rem',
            paddingBottom: '2rem',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}>


                <div className="text-sm">
                  Display Medium
                </div>
                <div style={{
              fontSize: '3rem',
              fontWeight: 200,
              letterSpacing: '-1px'
            }}>
                  Turn Complexity into Clarity
                </div>
              </div>

              <div>


                <div className="text-sm">
                  Body Text
                </div>
                <div style={{
              fontSize: '1rem',
              lineHeight: 1.8,
              color: 'rgba(255,255,255,0.9)'
            }}>
                  Terrafusion represents the pinnacle of government technology innovation. Our platform processes property data 379 million times faster than traditional methods while maintaining 98% accuracy.
                </div>
              </div>
            </div>
          </section>}

        {/* Modules Section */}
        {activeSection === 'modules' && <section>


            <h2 className="text-center">
              Module Ecosystem
            </h2>
            
            <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '2rem'
        }}>
              {modules.map((module, index) => <div key={index} style={{
            background: 'linear-gradient(135deg, rgba(0,255,238,0.1) 0%, rgba(0,153,255,0.05) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0,255,238,0.2)',
            borderRadius: '16px',
            padding: '1.5rem',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer'
          }}>


                  <div style={{
              fontSize: '2rem',
              marginBottom: '1rem'
            }}>
                    {module.icon}
                  </div>
                  <div style={{
              fontSize: '1.25rem',
              fontWeight: 400,
              color: '#00ffee',
              marginBottom: '0.5rem'
            }}>
                    {module.name}
                  </div>
                  <div className="text-sm">
                    {module.tagline}
                  </div>
                </div>)}
            </div>
          </section>}
      </div>

      {/* Footer */}
      <footer className="text-center">


        <div style={{
        fontSize: '2rem',
        fontWeight: 100,
        background: 'linear-gradient(135deg, #0099ff 0%, #00ffee 50%, #00ffaa 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        marginBottom: '1rem'
      }}>
          Terrafusion OS
        </div>
        <div style={{
        color: '#00ffee',
        fontSize: '1.25rem',
        letterSpacing: '2px'
      }}>
          Government. Transcended.
        </div>
      </footer>
    </div>;
};
export default BrandKit;
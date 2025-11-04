/* eslint-disable react/no-inline-styles */
import React from 'react';

const TerraFusionIDE_MACHINE: React.FC = () => {
  // Add CSS animations directly in a style tag
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes terraRotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes terraPulse {
        0%, 100% { opacity: 0.8; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.05); }
      }
      @keyframes terraGlow {
        0%, 100% { box-shadow: 0 0 20px rgba(0, 255, 255, 0.3); }
        50% { box-shadow: 0 0 30px rgba(0, 255, 255, 0.6); }
      }
      .terra-sphere {
        animation: terraRotate 4s linear infinite, terraPulse 2s ease-in-out infinite;
      }
      .terra-glow {
        animation: terraGlow 3s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  console.log('🚀 TerraFusion AI Swarm Activated: Ultimate IDE Creation Mode');

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0A0E1A',
      color: '#00FFFF',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid rgba(0, 255, 255, 0.2)',
        padding: '1rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: '300',
              margin: 0,
              background: 'linear-gradient(135deg, #00FFFF 0%, #0080FF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 10px rgba(0, 255, 255, 0.5)'
            }}>
              🌍 TerraFusion OS
            </h1>
            <div style={{
              fontSize: '0.875rem',
              color: 'rgba(0, 255, 255, 0.7)',
              fontWeight: '300',
              textShadow: '0 0 5px rgba(0, 255, 255, 0.3)'
            }}>
              Government AI Platform v4.1
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button style={{
              backgroundColor: 'rgba(0, 255, 255, 0.1)',
              border: '1px solid rgba(0, 255, 255, 0.3)',
              color: '#00FFFF',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}>
              🤖 AI Assistant
            </button>
            <span style={{ color: '#00FFFF' }}>AI Swarm: 1,008 Agents Online</span>
          </div>
        </div>
      </header>

      <div style={{ display: 'flex', height: 'calc(100vh - 80px)' }}>
        {/* Sidebar */}
        <aside style={{
          width: '280px',
          backgroundColor: 'rgba(0, 255, 255, 0.02)',
          borderRight: '1px solid rgba(0, 255, 255, 0.1)'
        }}>
          <div style={{ padding: '1rem' }}>
            {['📁 Projects', '🔧 Tools', '📊 Analytics', '⚙️ Settings', '🚀 Deploy'].map((item) => (
              <div key={item} style={{
                padding: '0.75rem',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                marginBottom: '0.25rem'
              }}>
                <span style={{ fontSize: '0.875rem', color: '#00FFFF' }}>{item}</span>
              </div>
            ))}
          </div>
          
          <div style={{
            margin: '1rem',
            padding: '1rem',
            borderRadius: '8px',
            backgroundColor: 'rgba(0, 255, 255, 0.05)'
          }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '500',
              marginBottom: '0.75rem',
              color: '#00FFFF'
            }}>
              Quick Actions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                'Create New Project',
                'Import Repository', 
                'Deploy to Production',
                'Generate Documentation',
                'Run Tests',
                'Optimize Performance'
              ].map((action) => (
                <button key={action} style={{
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(0, 255, 255, 0.2)',
                  color: 'rgba(0, 255, 255, 0.8)',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s'
                }}>
                  {action}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Dashboard Header */}
            <div style={{
              background: 'linear-gradient(135deg, #0A0E1A 0%, #1A2332 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.5rem',
              borderBottom: '1px solid rgba(0, 255, 255, 0.2)'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '300',
                color: '#00FFFF',
                margin: 0
              }}>
                🏛️ Government Specialized Agents
              </h2>
              <button style={{
                backgroundColor: 'rgba(0, 255, 255, 0.1)',
                border: '1px solid rgba(0, 255, 255, 0.2)',
                color: '#00FFFF',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                ➕ Create Task
              </button>
            </div>

            {/* Dashboard Grid */}
            <div style={{
              padding: '1.5rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              {[
                { label: 'Overall Compliance', value: '92.9%', desc: 'Government-wide compliance score' },
                { label: 'Active Agents', value: '3', desc: 'Specialized agents online' },
                { label: 'Active Tasks', value: '0', desc: 'Compliance tasks in progress' },
                { label: 'Risk Level', value: '6', desc: 'High/Critical risk capabilities' }
              ].map((stat) => (
                <div key={stat.label} style={{
                  padding: '1rem',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(0, 255, 255, 0.1)',
                  border: '1px solid rgba(0, 255, 255, 0.2)'
                }}>
                  <div style={{
                    fontSize: '0.875rem',
                    color: 'rgba(0, 255, 255, 0.8)'
                  }}>{stat.label}</div>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: '300',
                    color: '#00FFFF'
                  }}>{stat.value}</div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'rgba(0, 255, 255, 0.6)'
                  }}>{stat.desc}</div>
                </div>
              ))}
            </div>

            {/* Agent Card */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.5rem'
            }}>
              <div style={{
                padding: '1.5rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(0, 255, 255, 0.08)',
                border: '1px solid rgba(0, 255, 255, 0.2)',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: 'conic-gradient(from 0deg, #00FFFF 0deg, transparent 90deg, #00FFFF 180deg, transparent 270deg, #00FFFF 360deg)',
                        marginRight: '1rem',
                        position: 'relative'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: '10%',
                          left: '10%',
                          width: '80%',
                          height: '80%',
                          borderRadius: '50%',
                          backgroundColor: '#0A0E1A'
                        }}></div>
                      </div>
                      <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: '500',
                        color: '#00FFFF',
                        margin: 0
                      }}>
                        FISMA Compliance Officer
                      </h3>
                    </div>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '1.5rem',
                      marginBottom: '1rem'
                    }}>
                      <div>
                        <div style={{
                          fontSize: '0.875rem',
                          marginBottom: '0.25rem',
                          color: 'rgba(0, 255, 255, 0.8)'
                        }}>Performance:</div>
                        <div style={{
                          fontSize: '1.5rem',
                          fontWeight: '300',
                          color: '#00FFFF'
                        }}>94%</div>
                      </div>
                      <div>
                        <div style={{
                          fontSize: '0.875rem',
                          marginBottom: '0.25rem',
                          color: 'rgba(0, 255, 255, 0.8)'
                        }}>Compliance:</div>
                        <div style={{
                          fontSize: '1.5rem',
                          fontWeight: '300',
                          color: '#00FFFF'
                        }}>98%</div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{
                        fontSize: '0.875rem',
                        marginBottom: '0.5rem',
                        color: 'rgba(0, 255, 255, 0.8)'
                      }}>Capabilities:</div>
                      <div>
                        {['FISMA Compliance Audit', 'NIST Framework Assessment', 'CISO/FISMA Certified'].map((cap) => (
                          <div key={cap} style={{
                            fontSize: '0.875rem',
                            color: '#FFFFFF',
                            marginBottom: '0.25rem'
                          }}>{cap}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* TerraSphere Visualization */}
              <div style={{
                background: 'linear-gradient(135deg, #0A0E1A 0%, #1A2332 100%)',
                border: '1px solid #00FFFF',
                borderRadius: '1rem',
                padding: '1.5rem'
              }} className="terra-glow">
                <h3 style={{
                  color: '#00FFFF',
                  marginBottom: '1rem',
                  fontSize: '1.125rem',
                  textShadow: '0 0 5px rgba(0, 255, 255, 0.3)'
                }}>
                  TerraSphere™ Global Visualization
                </h3>
                <div style={{
                  width: '100%',
                  height: '300px',
                  background: 'radial-gradient(circle at center, #001122 0%, #000611 100%)',
                  border: '1px solid #00FFFF33',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: '200px',
                    height: '200px',
                    borderRadius: '50%',
                    background: 'conic-gradient(from 0deg, #00FFFF22 0%, #00FFFF66 25%, #00FFFF22 50%, #00FFFF88 75%, #00FFFF22 100%)',
                    border: '2px solid #00FFFF',
                    position: 'relative'
                  }} className="terra-sphere">
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      color: '#00FFFF',
                      fontSize: '0.875rem',
                      textAlign: 'center',
                      textShadow: '0 0 8px rgba(0, 255, 255, 0.8)'
                    }}>
                      TERRA<br/>SPHERE<br/>ACTIVE
                    </div>
                    {/* Orbital rings */}
                    <div style={{
                      position: 'absolute',
                      top: '-10px',
                      left: '-10px',
                      width: '220px',
                      height: '220px',
                      borderRadius: '50%',
                      border: '1px solid #00FFFF33'
                    }} className="terra-sphere"></div>
                    <div style={{
                      position: 'absolute',
                      top: '-20px',
                      left: '-20px',
                      width: '240px',
                      height: '240px',
                      borderRadius: '50%',
                      border: '1px solid #00FFFF22'
                    }} className="terra-sphere"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(0, 255, 255, 0.2)',
        padding: '0.75rem',
        backgroundColor: '#0A0E1A'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.875rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <span style={{ color: '#00FFFF' }}>AI Swarm: 1,008 Agents Online</span>
            <span style={{ color: '#00FFFF' }}>Quantum Engine: Active</span>
            <span style={{ color: '#00FFFF' }}>Performance: 379M× Enhancement</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <span style={{ color: '#00FFFF' }}>FISMA: Compliant</span>
            <span style={{ color: '#00FFFF' }}>Security: 100%</span>
            <span style={{ color: '#00FFFF' }}>Confidence: 97%</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TerraFusionIDE_MACHINE;
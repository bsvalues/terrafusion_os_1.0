import React, { useState } from 'react';
interface Segment {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  messaging: {
    headline: string;
    tagline: string;
    keyPoints: string[];
    tone: string;
  };
  metrics: {
    reach: string;
    engagement: string;
    conversion: string;
  };
}
const StrategyDashboard: React.FC = () => {
  const [selectedSegment, setSelectedSegment] = useState<string>('small');
  const segments: Segment[] = [
    {
      id: 'small',
      name: 'Small Counties',
      icon: '🏘️',
      color: '#0099ff',
      description:
        'Rural counties with limited IT resources seeking efficient, cost-effective solutions',
      messaging: {
        headline: 'Simple. Powerful. Affordable.',
        tagline: 'Government technology that just works',
        keyPoints: [
          'No complex setup or training required',
          'Immediate cost savings from day one',
          'Dedicated support for small teams',
          "Scales with your county's growth",
        ],
        tone: 'Reassuring, straightforward, practical',
      },
      metrics: {
        reach: '2.3M',
        engagement: '87%',
        conversion: '34%',
      },
    },
    {
      id: 'large',
      name: 'Large Counties',
      icon: '🏙️',
      color: '#00ffaa',
      description:
        'Metropolitan counties with complex systems requiring enterprise-grade integration',
      messaging: {
        headline: 'Enterprise Power. Government Precision.',
        tagline: 'Transform complexity into competitive advantage',
        keyPoints: [
          'Seamless integration with existing systems',
          'Advanced analytics and reporting capabilities',
          'Enterprise-grade security and compliance',
          'Scalable architecture for millions of records',
        ],
        tone: 'Professional, sophisticated, results-driven',
      },
      metrics: {
        reach: '8.7M',
        engagement: '92%',
        conversion: '41%',
      },
    },
    {
      id: 'technical',
      name: 'Technical Decision Makers',
      icon: '⚙️',
      color: '#00ffee',
      description:
        'IT directors and technical staff evaluating system capabilities and integration',
      messaging: {
        headline: 'Built by Engineers. For Engineers.',
        tagline: 'Technical excellence meets government requirements',
        keyPoints: [
          'Open APIs and flexible integration options',
          'Comprehensive documentation and support',
          'Modern architecture with proven scalability',
          'FISMA compliance and security certifications',
        ],
        tone: 'Technical, detailed, credible',
      },
      metrics: {
        reach: '1.2M',
        engagement: '94%',
        conversion: '52%',
      },
    },
    {
      id: 'traditional',
      name: 'Traditional Government',
      icon: '🏛️',
      color: '#ff9900',
      description:
        'Established government officials focused on proven solutions and risk mitigation',
      messaging: {
        headline: 'Proven Results. Trusted Partnership.',
        tagline: 'Government solutions with a track record of success',
        keyPoints: [
          'Deployed successfully across multiple counties',
          'Comprehensive training and change management',
          'Proven ROI and measurable outcomes',
          'Long-term partnership and support commitment',
        ],
        tone: 'Trustworthy, established, risk-averse',
      },
      metrics: {
        reach: '4.1M',
        engagement: '78%',
        conversion: '28%',
      },
    },
  ];
  const selectedSegmentData = segments.find((s) => s.id === selectedSegment) || segments[0];
  return (
    <div className='w-full p-8'>
      {/* Header */}
      <div className='text-center'>
        <h1
          style={{
            fontSize: '2.5rem',
            fontWeight: 900,
            background: 'linear-gradient(135deg, #0099ff, #00ffee, #00ffaa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '0.5rem',
          }}
        >
          Terrafusion Strategic Messaging Dashboard
        </h1>
        <p
          style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: '1.1rem',
          }}
        >
          Targeted messaging strategies for government market segments
        </p>
      </div>

      {/* Segment Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          maxWidth: '1400px',
          margin: '0 auto 3rem auto',
        }}
      >
        {segments.map((segment) => (
          <div
            key={segment.id}
            onClick={() => setSelectedSegment(segment.id)}
            style={{
              border:
                selectedSegment === segment.id
                  ? `2px solid ${segment.color}`
                  : '1px solid rgba(0,255,238,0.2)',
              transform: selectedSegment === segment.id ? 'scale(1.02)' : 'scale(1)',
            }}
            onMouseEnter={(e) => {
              if (selectedSegment !== segment.id) {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = `0 20px 40px ${segment.color}20`;
                e.currentTarget.style.borderColor = segment.color;
              }
            }}
            onMouseLeave={(e) => {
              if (selectedSegment !== segment.id) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(0,255,238,0.2)';
              }
            }}
            className='p-8'
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: `linear-gradient(90deg, ${segment.color}, transparent)`,
              }}
            />

            <div className='flex items-center justify-between'>
              <div
                style={{
                  background: `linear-gradient(135deg, ${segment.color}, transparent)`,
                }}
                className='flex items-center'
              >
                {segment.icon}
              </div>
              <div
                style={{
                  background: `${segment.color}20`,
                  color: segment.color,
                }}
                className='font-semibold'
              >
                {selectedSegment === segment.id ? 'ACTIVE' : 'SELECT'}
              </div>
            </div>

            <h3
              style={{
                fontSize: '1.3rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: '0.5rem',
              }}
            >
              {segment.name}
            </h3>

            <p
              style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: '0.9rem',
                lineHeight: 1.5,
                marginBottom: '1rem',
              }}
            >
              {segment.description}
            </p>

            <div className='flex justify-between'>
              <div className='text-center'>
                <div
                  style={{
                    color: segment.color,
                    fontWeight: 700,
                  }}
                >
                  {segment.metrics.reach}
                </div>
                <div
                  style={{
                    color: 'rgba(255,255,255,0.5)',
                  }}
                >
                  Reach
                </div>
              </div>
              <div className='text-center'>
                <div
                  style={{
                    color: segment.color,
                    fontWeight: 700,
                  }}
                >
                  {segment.metrics.engagement}
                </div>
                <div
                  style={{
                    color: 'rgba(255,255,255,0.5)',
                  }}
                >
                  Engagement
                </div>
              </div>
              <div className='text-center'>
                <div
                  style={{
                    color: segment.color,
                    fontWeight: 700,
                  }}
                >
                  {segment.metrics.conversion}
                </div>
                <div
                  style={{
                    color: 'rgba(255,255,255,0.5)',
                  }}
                >
                  Conversion
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Messaging Panel */}
      <div
        style={{
          border: `2px solid ${selectedSegmentData.color}`,
        }}
        className='p-8'
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${selectedSegmentData.color}, transparent)`,
          }}
        />

        <div className='flex items-center gap-4'>
          <div
            style={{
              background: `linear-gradient(135deg, ${selectedSegmentData.color}, transparent)`,
            }}
            className='flex items-center'
          >
            {selectedSegmentData.icon}
          </div>
          <div>
            <h2
              style={{
                fontSize: '2rem',
                fontWeight: 700,
                color: '#fff',
                margin: '0 0 0.5rem 0',
              }}
            >
              {selectedSegmentData.name}
            </h2>
            <p
              style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: '1rem',
                margin: 0,
              }}
            >
              {selectedSegmentData.description}
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
          }}
        >
          {/* Messaging Strategy */}
          <div
            style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '15px',
              padding: '1.5rem',
            }}
          >
            <h3
              style={{
                color: selectedSegmentData.color,
              }}
              className='flex items-center gap-2'
            >
              📝 Messaging Strategy
            </h3>

            <div
              style={{
                marginBottom: '1rem',
              }}
            >
              <h4 className='font-semibold'>Primary Headline</h4>
              <p
                style={{
                  color: selectedSegmentData.color,
                }}
                className='font-semibold'
              >
                "{selectedSegmentData.messaging.headline}"
              </p>
            </div>

            <div
              style={{
                marginBottom: '1rem',
              }}
            >
              <h4 className='font-semibold'>Tagline</h4>
              <p
                style={{
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: '0.95rem',
                }}
              >
                {selectedSegmentData.messaging.tagline}
              </p>
            </div>

            <div>
              <h4 className='font-semibold'>Tone & Voice</h4>
              <p
                style={{
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '0.9rem',
                }}
              >
                {selectedSegmentData.messaging.tone}
              </p>
            </div>
          </div>

          {/* Key Points */}
          <div
            style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '15px',
              padding: '1.5rem',
            }}
          >
            <h3
              style={{
                color: selectedSegmentData.color,
              }}
              className='flex items-center gap-2'
            >
              🎯 Key Messaging Points
            </h3>

            <div className='flex'>
              {selectedSegmentData.messaging.keyPoints.map((point, index) => (
                <div
                  key={index}
                  style={{
                    border: `1px solid ${selectedSegmentData.color}20`,
                  }}
                  className='flex items-start'
                >
                  <div
                    style={{
                      background: selectedSegmentData.color,
                    }}
                    className='flex items-center'
                  >
                    {index + 1}
                  </div>
                  <p
                    style={{
                      color: 'rgba(255,255,255,0.9)',
                      fontSize: '0.9rem',
                      lineHeight: 1.4,
                      margin: 0,
                    }}
                  >
                    {point}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Metrics */}
          <div
            style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '15px',
              padding: '1.5rem',
              gridColumn: 'span 2',
            }}
          >
            <h3
              style={{
                color: selectedSegmentData.color,
              }}
              className='flex items-center gap-2'
            >
              📊 Performance Metrics
            </h3>

            <div className='gap-4'>
              {[
                {
                  label: 'Total Reach',
                  value: selectedSegmentData.metrics.reach,
                  desc: 'Potential audience size',
                },
                {
                  label: 'Engagement Rate',
                  value: selectedSegmentData.metrics.engagement,
                  desc: 'Message interaction rate',
                },
                {
                  label: 'Conversion Rate',
                  value: selectedSegmentData.metrics.conversion,
                  desc: 'Lead to opportunity rate',
                },
                {
                  label: 'Market Share',
                  value: '23%',
                  desc: 'Segment penetration',
                },
                {
                  label: 'Growth Rate',
                  value: '+47%',
                  desc: 'YoY segment growth',
                },
                {
                  label: 'Satisfaction',
                  value: '4.8/5',
                  desc: 'Customer satisfaction score',
                },
              ].map((metric, index) => (
                <div
                  key={index}
                  style={{
                    background: `${selectedSegmentData.color}10`,
                    border: `1px solid ${selectedSegmentData.color}30`,
                  }}
                  className='text-center p-4'
                >
                  <div
                    style={{
                      fontSize: '1.8rem',
                      fontWeight: 900,
                      color: selectedSegmentData.color,
                      marginBottom: '0.3rem',
                    }}
                  >
                    {metric.value}
                  </div>
                  <div className='font-semibold'>{metric.label}</div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'rgba(255,255,255,0.6)',
                    }}
                  >
                    {metric.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default StrategyDashboard;

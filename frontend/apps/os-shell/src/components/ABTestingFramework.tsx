import React, { useState, useEffect, useCallback } from 'react';
import logger from '../utils/logger';
interface CountyData {
  name: string;
  properties: string;
  population: string;
  savings: string;
  efficiency: string;
  testimonial: string;
  official: string;
}
interface Metrics {
  engagementRate: number;
  timeOnPage: number;
  ctaClicks: number;
  conversionRate: number;
}
const ABTestingFramework: React.FC = () => {
  const [currentCounty, setCurrentCounty] = useState('benton');
  const [currentVariant, setCurrentVariant] = useState('control');
  const [metrics, setMetrics] = useState<Metrics>({
    engagementRate: 0,
    timeOnPage: 0,
    ctaClicks: 0,
    conversionRate: 0,
  });
  const [startTime] = useState(Date.now());
  const [engagementEvents, setEngagementEvents] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [countdown, setCountdown] = useState({
    hours: 48,
    minutes: 0,
    seconds: 0,
  });
  const countyData: Record<string, CountyData> = {
    benton: {
      name: 'Benton County',
      properties: '94,149',
      population: '206,873',
      savings: '$477,816',
      efficiency: '379M×',
      testimonial: 'Terrafusion transformed our assessment process completely.',
      official: 'County Assessor',
    },
    clark: {
      name: 'Clark County',
      properties: '178,000',
      population: '503,311',
      savings: '$892,000',
      efficiency: '425M×',
      testimonial: "The clarity we've achieved is unprecedented.",
      official: 'IT Director',
    },
    king: {
      name: 'King County',
      properties: '542,000',
      population: '2,269,675',
      savings: '$2.8M',
      efficiency: '512M×',
      testimonial: 'This is what modern government should be.',
      official: 'County Executive',
    },
    snohomish: {
      name: 'Snohomish County',
      properties: '312,000',
      population: '827,957',
      savings: '$1.2M',
      efficiency: '398M×',
      testimonial: 'Our teams are more confident than ever.',
      official: 'Department Head',
    },
    pierce: {
      name: 'Pierce County',
      properties: '289,000',
      population: '921,130',
      savings: '$1.1M',
      efficiency: '405M×',
      testimonial: 'Citizens love the transparency.',
      official: 'Public Relations',
    },
  };
  const updateMetrics = useCallback(() => {
    const timeOnPage = Math.floor((Date.now() - startTime) / 1000);
    const engagementRate = Math.min(100, engagementEvents * 10);
    const conversionRate = metrics.ctaClicks > 0 ? Math.min(100, metrics.ctaClicks * 25) : 0;
    setMetrics((prev) => ({
      ...prev,
      timeOnPage,
      engagementRate,
      conversionRate,
    }));
  }, [startTime, engagementEvents, metrics.ctaClicks]);
  const trackEvent = (eventName: string, data?: any) => {
    // Analytics tracking for event: ${eventName}
    logger.debug('Analytics Event:', eventName, data);
    setEngagementEvents((prev) => prev + 1);
  };
  const trackCTA = (type: 'primary' | 'secondary') => {
    setMetrics((prev) => ({
      ...prev,
      ctaClicks: prev.ctaClicks + 1,
    }));
    showSuccessMessage(`${type === 'primary' ? 'Primary' : 'Secondary'} CTA clicked!`);
    trackEvent('cta_click', {
      county: currentCounty,
      variant: currentVariant,
      cta_type: type,
    });
  };
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };
  const switchCounty = (county: string) => {
    setCurrentCounty(county);
    showSuccessMessage(`County switched to ${countyData[county].name}`);
    trackEvent('county_switch', county);
  };
  const switchVariant = (variant: string) => {
    setCurrentVariant(variant);
    showSuccessMessage(`Variant switched to ${variant}`);
    trackEvent('variant_switch', variant);
  };
  const getCountyTheme = (county: string) => {
    const themes: Record<string, string> = {
      benton: 'linear-gradient(135deg, var(--tf-accent-indigo-dark) 0%, var(--tf-accent-blue-dark) 100%)',
      clark: 'linear-gradient(135deg, var(--tf-accent-teal-dark) 0%, var(--tf-accent-teal-dark) 100%)',
      king: 'linear-gradient(135deg, var(--tf-accent-purple-dark) 0%, var(--tf-accent-purple) 100%)',
      snohomish: 'linear-gradient(135deg, var(--tf-error-dark) 0%, var(--tf-error-red) 100%)',
      pierce: 'linear-gradient(135deg, var(--tf-warning-dark) 0%, var(--tf-warning-amber) 100%)',
    };
    return themes[county] || themes.benton;
  };
  const getCountyIcon = (county: string) => {
    const icons: Record<string, string> = {
      benton: '🌾',
      clark: '🌲',
      king: '👑',
      snohomish: '🏔️',
      pierce: '🌊',
    };
    return icons[county] || icons.benton;
  };
  const renderVariant = () => {
    const county = countyData[currentCounty];
    switch (currentVariant) {
      case 'emotional':
        return (
          <div className='text-center'>
            <div className='items-center font-semibold'>
              {getCountyIcon(currentCounty)} {county.name} Success Story
            </div>
            <h1
              style={{
                fontSize: 'clamp(48px, 8vw, 96px)',
                fontWeight: 300,
                marginBottom: '24px',
                lineHeight: 1.1,
                background: 'linear-gradient(135deg, var(--tf-accent-error) 0%, var(--tf-accent-yellow) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Your Team Deserves Better
            </h1>
            <p
              style={{
                fontSize: 'clamp(18px, 3vw, 24px)',
                fontWeight: 300,
                color: 'hsl(var(--tf-text-primary-hs) 100% / 0.9)',
                marginBottom: '24px',
                maxWidth: '800px',
                margin: '0 auto 24px',
                lineHeight: 1.6,
                fontStyle: 'italic',
              }}
            >
              "{county.testimonial}"<br />
              <small
                style={{
                  fontSize: '0.8em',
                }}
              >
                - {county.official}, {county.name}
              </small>
            </p>

            <p
              style={{
                fontSize: 'clamp(18px, 3vw, 24px)',
                fontWeight: 300,
                color: 'hsl(var(--tf-text-primary-hs) 100% / 0.9)',
                marginBottom: '48px',
                maxWidth: '800px',
                margin: '0 auto 48px',
                lineHeight: 1.6,
              }}
            >
              Join thousands of county employees who've transcended the old way of working.
            </p>
            <div className='flex'>
              <button onClick={() => trackCTA('primary')} className='font-semibold'>
                Transform Your County
              </button>
              <button onClick={() => trackCTA('secondary')} className='font-semibold'>
                Read Success Stories
              </button>
            </div>
          </div>
        );
      case 'data':
        return (
          <div className='text-center'>
            <div className='items-center font-semibold'>
              {getCountyIcon(currentCounty)} {county.name} Performance
            </div>
            <h1
              style={{
                fontSize: 'clamp(48px, 8vw, 96px)',
                fontWeight: 300,
                marginBottom: '40px',
                lineHeight: 1.1,
                color: 'white',
              }}
            >
              The Numbers Speak Volumes
            </h1>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
                margin: '40px 0',
                maxWidth: '800px',
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              {[
                {
                  number: county.efficiency,
                  label: 'Faster Processing',
                },
                {
                  number: county.savings,
                  label: 'Annual Savings',
                },
                {
                  number: county.properties,
                  label: 'Properties Managed',
                },
                {
                  number: '94%',
                  label: 'Accuracy Rate',
                },
              ].map((metric, index) => (
                <div
                  key={index}
                  style={{
                    background: 'hsl(var(--tf-transcend-cyan-hs) 50% / 0.1)',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid var(--tf-transcend-highlight)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '36px',
                      fontWeight: 'bold',
                      color: 'var(--tf-transcend-highlight)',
                    }}
                  >
                    {metric.number}
                  </div>
                  <div
                    style={{
                      fontSize: '14px',
                      color: 'hsl(var(--tf-text-primary-hs) 100% / 0.7)',
                      marginTop: '5px',
                    }}
                  >
                    {metric.label}
                  </div>
                </div>
              ))}
            </div>

            <p
              style={{
                fontSize: 'clamp(18px, 3vw, 24px)',
                fontWeight: 300,
                color: 'hsl(var(--tf-text-primary-hs) 100% / 0.9)',
                marginBottom: '48px',
                maxWidth: '800px',
                margin: '0 auto 48px',
                lineHeight: 1.6,
              }}
            >
              Real results from counties like yours. Verified. Documented. Repeatable.
            </p>
            <div className='flex'>
              <button onClick={() => trackCTA('primary')} className='font-semibold'>
                See Your Projections
              </button>
              <button onClick={() => trackCTA('secondary')} className='font-semibold'>
                Download Case Study
              </button>
            </div>
          </div>
        );
      case 'urgency':
        return (
          <div className='text-center'>
            <div className='items-center font-semibold'>⚡ Limited Availability</div>
            <h1
              style={{
                fontSize: 'clamp(48px, 8vw, 96px)',
                fontWeight: 300,
                marginBottom: '24px',
                lineHeight: 1.1,
                color: 'white',
              }}
            >
              Only 3 Pilot Slots Remaining
            </h1>

            <div
              style={{
                background: 'hsl(var(--tf-error-hs) 50% / 0.1)',
                border: '2px solid var(--tf-error-red)',
                padding: '15px 30px',
                borderRadius: '50px',
                display: 'inline-block',
                margin: '20px 0',
                fontSize: '20px',
                fontWeight: 'bold',
                color: 'var(--tf-error-light)',
              }}
            >
              Offer expires in: {String(countdown.hours).padStart(2, '0')}:
              {String(countdown.minutes).padStart(2, '0')}:
              {String(countdown.seconds).padStart(2, '0')}
            </div>
            <p
              style={{
                fontSize: 'clamp(18px, 3vw, 24px)',
                fontWeight: 300,
                color: 'hsl(var(--tf-text-primary-hs) 100% / 0.9)',
                marginBottom: '24px',
                maxWidth: '800px',
                margin: '0 auto 24px',
                lineHeight: 1.6,
              }}
            >
              {county.name} qualifies for our exclusive Pioneer Program. Lock in founding member
              pricing and priority support before it's too late.
            </p>
            <p
              style={{
                fontSize: 'clamp(18px, 3vw, 24px)',
                fontWeight: 300,
                color: 'var(--tf-error-light)',
                marginBottom: '48px',
                maxWidth: '800px',
                margin: '0 auto 48px',
                lineHeight: 1.6,
              }}
            >
              <strong>Special Offer:</strong> Save {county.savings} annually + 6 months free
              implementation support
            </p>
            <div className='flex'>
              <button onClick={() => trackCTA('primary')} className='font-semibold'>
                Claim Your Slot Now
              </button>
              <button onClick={() => trackCTA('secondary')} className='font-semibold'>
                Schedule Urgent Demo
              </button>
            </div>
          </div>
        );
      default:
        // control
        return (
          <div className='text-center'>
            <div className='items-center font-semibold'>
              {getCountyIcon(currentCounty)} {county.name} Ready
            </div>
            <h1
              style={{
                fontSize: 'clamp(48px, 8vw, 96px)',
                fontWeight: 300,
                marginBottom: '24px',
                lineHeight: 1.1,
                color: 'white',
              }}
            >
              Government. Transcended.
            </h1>

            <p
              style={{
                fontSize: 'clamp(18px, 3vw, 24px)',
                fontWeight: 300,
                color: 'hsl(var(--tf-text-primary-hs) 100% / 0.9)',
                marginBottom: '48px',
                maxWidth: '800px',
                margin: '0 auto 48px',
                lineHeight: 1.6,
              }}
            >
              Turn complexity into clarity across {county.properties} properties. Make better
              decisions faster. Serve {county.population} citizens with confidence.
            </p>
            <div className='flex'>
              <button onClick={() => trackCTA('primary')} className='font-semibold'>
                Begin Transcendence
              </button>
              <button onClick={() => trackCTA('secondary')} className='font-semibold'>
                Discover Clarity
              </button>
            </div>
          </div>
        );
    }
  };

  // Update metrics every second
  useEffect(() => {
    const interval = setInterval(updateMetrics, 1000);
    return () => clearInterval(interval);
  }, [updateMetrics]);

  // Countdown timer for urgency variant
  useEffect(() => {
    if (currentVariant === 'urgency') {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev.seconds > 0) {
            return {
              ...prev,
              seconds: prev.seconds - 1,
            };
          } else if (prev.minutes > 0) {
            return {
              ...prev,
              minutes: prev.minutes - 1,
              seconds: 59,
            };
          } else if (prev.hours > 0) {
            return {
              hours: prev.hours - 1,
              minutes: 59,
              seconds: 59,
            };
          }
          return prev;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentVariant]);
  return (
    <div
      style={{
        fontFamily: "'Segoe UI', -apple-system, system-ui, sans-serif",
        background: 'var(--tf-bg-surface)',
        color: 'white',
        minHeight: '100vh',
        overflowX: 'hidden',
      }}
    >
      {/* A/B Testing Control Panel */}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'hsl(var(--tf-surface-dark-hs) 17% / 0.95)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid var(--tf-transcend-highlight)',
          zIndex: 1000,
          backdropFilter: 'blur(10px)',
          minWidth: '300px',
        }}
      >
        <h3
          style={{
            color: 'var(--tf-transcend-highlight)',
            marginBottom: '15px',
            fontSize: '14px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            margin: '0 0 15px 0',
          }}
        >
          🧪 A/B Testing Control
        </h3>

        <div
          style={{
            marginBottom: '15px',
          }}
        >
          <label className='text-gray-400'>Select County:</label>
          <select
            value={currentCounty}
            onChange={(e) => switchCounty(e.target.value)}
            className='w-full'
          >
            <option value='benton'>Benton County, WA</option>
            <option value='clark'>Clark County, WA</option>

            <option value='king'>King County, WA</option>
            <option value='snohomish'>Snohomish County, WA</option>
            <option value='pierce'>Pierce County, WA</option>
          </select>
        </div>

        <div className='flex'>
          {['control', 'emotional', 'data', 'urgency'].map((variant) => (
            <button
              key={variant}
              onClick={() => switchVariant(variant)}
              style={{
                flex: '1',
                minWidth: '60px',
                padding: '8px',
                background: currentVariant === variant ? 'var(--tf-accent-success)' : 'var(--tf-bg-surface)',
                color: currentVariant === variant ? 'var(--tf-bg-surface)' : 'var(--tf-accent-success)',
                border: '1px solid var(--tf-accent-success)',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontSize: '12px',
                textTransform: 'capitalize',
              }}
            >
              {variant}
            </button>
          ))}
        </div>

        <div
          style={{
            background: 'hsl(var(--tf-text-primary-hs) 0% / 0.3)',
            padding: '10px',
            borderRadius: '6px',
            fontSize: '12px',
          }}
        >
          <div className='flex justify-between'>
            <span>Engagement Rate:</span>
            <span
              style={{
                color: 'var(--tf-transcend-highlight)',
                fontWeight: 'bold',
              }}
            >
              {metrics.engagementRate}%
            </span>
          </div>
          <div className='flex justify-between'>
            <span>Time on Page:</span>
            <span
              style={{
                color: 'var(--tf-transcend-highlight)',
                fontWeight: 'bold',
              }}
            >
              {metrics.timeOnPage}s
            </span>
          </div>
          <div className='flex justify-between'>
            <span>CTA Clicks:</span>
            <span
              style={{
                color: 'var(--tf-transcend-highlight)',
                fontWeight: 'bold',
              }}
            >
              {metrics.ctaClicks}
            </span>
          </div>
          <div className='flex justify-between'>
            <span>Conversion Rate:</span>
            <span
              style={{
                color: 'var(--tf-transcend-highlight)',
                fontWeight: 'bold',
              }}
            >
              {metrics.conversionRate}%
            </span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section
        style={{
          background: getCountyTheme(currentCounty),
        }}
        className='flex items-center'
      >
        <div
          style={{
            maxWidth: '1200px',
            padding: '60px 40px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {renderVariant()}
        </div>
      </section>

      {/* Success Indicator */}
      {showSuccess && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--tf-accent-success)',
            color: 'var(--tf-bg-surface)',
            padding: '15px 30px',
            borderRadius: '50px',
            fontWeight: 'bold',
            zIndex: 1000,
            transition: 'opacity 0.3s ease',
          }}
        >
          ✨ {successMessage}
        </div>
      )}
    </div>
  );
};
export default ABTestingFramework;

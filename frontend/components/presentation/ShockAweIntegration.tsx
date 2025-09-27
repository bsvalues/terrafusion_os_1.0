import React, {useState, useEffect} from 'react';
import {Zap, TrendingUp, Target, Users, DollarSign, Clock} from '@mui/icons-material';

interface ShockAweMetrics {speedImprovement: string;
  costReduction: string;
  timeToValue: string;
  userSatisfaction: string;
  roi: string;
  deploymentTime: string;}

interface ShockAweSlide {id: string;
  title: string;
  subtitle: string;
  metrics: ShockAweMetrics;
  visual: 'performance' | 'financial' | 'deployment' | 'impact';}

const shockAweSlides: ShockAweSlide[] = [
  {id: 'performance',
    title: 'QUANTUM PERFORMANCE BREAKTHROUGH',
    subtitle: 'Terrafusion OS delivers unprecedented government efficiency',
    metrics: {
      speedImprovement: '379,000,000×',
      costReduction: '71.2%',
      timeToValue: '3.1 seconds',
      userSatisfaction: '99.7%',
      roi: '247%',
      deploymentTime: '30 days',},
    visual: 'performance',
  },
  {id: 'financial',
    title: 'FINANCIAL TRANSFORMATION',
    subtitle: 'Immediate cost savings and revenue acceleration',
    metrics: {
      speedImprovement: '10× faster',
      costReduction: '$443,367',
      timeToValue: 'Day 1',
      userSatisfaction: '98.4%',
      roi: '312%',
      deploymentTime: '2 weeks',},
    visual: 'financial',
  },
  {id: 'deployment',
    title: 'RAPID DEPLOYMENT SUCCESS',
    subtitle: 'From chaos to championship in record time',
    metrics: {
      speedImprovement: '50× faster',
      costReduction: '85%',
      timeToValue: 'Immediate',
      userSatisfaction: '100%',
      roi: '500%',
      deploymentTime: '7 days',},
    visual: 'deployment',
  },
  {id: 'impact',
    title: 'TRANSFORMATIONAL IMPACT',
    subtitle: 'Revolutionizing government operations nationwide',
    metrics: {
      speedImprovement: '1000× faster',
      costReduction: '90%',
      timeToValue: 'Real-time',
      userSatisfaction: '99.9%',
      roi: '750%',
      deploymentTime: '3 days',},
    visual: 'impact',
  },
];

export const ShockAweIntegration: React.FC = () => {const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [presentationMode, setPresentationMode] = useState<'executive' | 'technical' | 'financial'>(
    'executive'
  );

  useEffect(() =>{
    if (isAutoPlaying) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % shockAweSlides.length);}, 5000);
      return () => clearInterval(interval);
    }
  }, [isAutoPlaying]);

  const slide = shockAweSlides[currentSlide];

  const renderMetricCard = (label: string, value: string, icon: React.ReactNode, color: string) => (<div
      className={`bg-gradient-to-br ${color} rounded-xl p-6 text-white transform hover:scale-105 transition-all duration-300`}
    ><div className='flex items-center gap-3 mb-3'>{icon}<h3 className='font-semibold text-lg'>{label}</h3></div><div className='text-3xl font-bold'>{value}</div></div>);

  const renderVisual = () => {
    switch (slide.visual) {
      case 'performance':
        return (<div className='grid grid-cols-2 gap-6'>{renderMetricCard(
              'Speed Boost',
              slide.metrics.speedImprovement,<Zap className='w-6 h-6' />,
              'from-purple-500 to-pink-600'
            )}
            {renderMetricCard(
              'Processing Time',
              slide.metrics.timeToValue,
              <Clock className='w-6 h-6' />,
              'from-blue-500 to-cyan-600'
            )}
            {renderMetricCard(
              'User Satisfaction',
              slide.metrics.userSatisfaction,
              <Users className='w-6 h-6' />,
              'from-green-500 to-emerald-600'
            )}
            {renderMetricCard(
              'ROI Achievement',
              slide.metrics.roi,
              <TrendingUp className='w-6 h-6' />,
              'from-orange-500 to-red-600'
            )}
          </div>);
      case 'financial':
        return (<div className='grid grid-cols-2 gap-6'>{renderMetricCard(
              'Annual Savings',
              slide.metrics.costReduction,<DollarSign className='w-6 h-6' />,
              'from-green-500 to-emerald-600'
            )}
            {renderMetricCard(
              'ROI Percentage',
              slide.metrics.roi,
              <TrendingUp className='w-6 h-6' />,
              'from-blue-500 to-indigo-600'
            )}
            {renderMetricCard(
              'Time to Value',
              slide.metrics.timeToValue,
              <Target className='w-6 h-6' />,
              'from-purple-500 to-pink-600'
            )}
            {renderMetricCard(
              'Efficiency Gain',
              slide.metrics.speedImprovement,
              <Zap className='w-6 h-6' />,
              'from-orange-500 to-red-600'
            )}
          </div>);
      case 'deployment':
        return (<div className='grid grid-cols-2 gap-6'>{renderMetricCard(
              'Deployment Time',
              slide.metrics.deploymentTime,<Clock className='w-6 h-6' />,
              'from-indigo-500 to-purple-600'
            )}
            {renderMetricCard(
              'Cost Reduction',
              slide.metrics.costReduction,
              <DollarSign className='w-6 h-6' />,
              'from-green-500 to-teal-600'
            )}
            {renderMetricCard(
              'Success Rate',
              slide.metrics.userSatisfaction,
              <Target className='w-6 h-6' />,
              'from-blue-500 to-cyan-600'
            )}
            {renderMetricCard(
              'Performance Boost',
              slide.metrics.speedImprovement,
              <Zap className='w-6 h-6' />,
              'from-orange-500 to-pink-600'
            )}
          </div>);
      default:
        return (<div className='grid grid-cols-3 gap-4'>{renderMetricCard(
              'Speed',
              slide.metrics.speedImprovement,<Zap className='w-5 h-5' />,
              'from-purple-500 to-pink-600'
            )}
            {renderMetricCard(
              'Savings',
              slide.metrics.costReduction,
              <DollarSign className='w-5 h-5' />,
              'from-green-500 to-emerald-600'
            )}
            {renderMetricCard(
              'ROI',
              slide.metrics.roi,
              <TrendingUp className='w-5 h-5' />,
              'from-blue-500 to-indigo-600'
            )}
            {renderMetricCard(
              'Time',
              slide.metrics.timeToValue,
              <Clock className='w-5 h-5' />,
              'from-orange-500 to-red-600'
            )}
            {renderMetricCard(
              'Users',
              slide.metrics.userSatisfaction,
              <Users className='w-5 h-5' />,
              'from-cyan-500 to-blue-600'
            )}
            {renderMetricCard(
              'Deploy',
              slide.metrics.deploymentTime,
              <Target className='w-5 h-5' />,
              'from-pink-500 to-purple-600'
            )}
          </div>);
    }
  };

  return (<div className='min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white'>{/* Header Controls */}<div className='flex justify-between items-center p-6 bg-black/20 backdrop-blur-sm'><div className='flex items-center gap-4'><Zap className='w-8 h-8 text-yellow-400' /><h1 className='text-2xl font-bold'>SHOCK & AWE Protocol</h1></div><div className='flex items-center gap-4'><select
            value={presentationMode}
            onChange={(e) => setPresentationMode(e.target.value as any)}
            className='bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white'
          ><option value='executive'>Executive Mode</option><option value='technical'>Technical Mode</option><option value='financial'>Financial Mode</option></select><button
            onClick={() =>setIsAutoPlaying(!isAutoPlaying)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isAutoPlaying
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'}`}
          >
            {isAutoPlaying ? 'Pause' : 'Play'}</button></div></div>{/* Main Presentation Area */}<div className='flex-1 p-8'><div className='max-w-7xl mx-auto'>{/* Slide Header */}<div className='text-center mb-12'><h2 className='text-6xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent'>{slide.title}</h2><p className='text-2xl text-gray-300 font-light'>{slide.subtitle}</p></div>{/* Metrics Visualization */}<div className='mb-12'>{renderVisual()}</div>{/* Slide Navigation */}<div className='flex justify-center items-center gap-4'><button
              onClick={() =>setCurrentSlide(
                  (prev) => (prev - 1 + shockAweSlides.length) % shockAweSlides.length
                )}
              className='px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-colors'
            >
              Previous</button><div className='flex gap-2'>{shockAweSlides.map((_ /* , index */) => (<button
                  key={index}
                  onClick={() =>setCurrentSlide(index)}
                  className={`w-4 h-4 rounded-full transition-colors ${
                    index === currentSlide ? 'bg-yellow-400' : 'bg-white/30'}`}
                />
              ))}</div><button
              onClick={() =>setCurrentSlide((prev) => (prev + 1) % shockAweSlides.length)}
              className='px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-colors'
            >
              Next</button></div></div></div>{/* Footer Status */}<div className='bg-black/20 backdrop-blur-sm p-4 text-center'><p className='text-gray-300'>Terrafusion OS 1.0 • Slide {currentSlide + 1} of {shockAweSlides.length} •<span className='text-yellow-400 font-medium ml-2'>{presentationMode.toUpperCase()} MODE</span></p></div></div>
  );
};

export default ShockAweIntegration;

/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION DEMO PAGE - QUANTUM GOVERNANCE PLATFORM
 * Comprehensive validation of design system components
 * ═══════════════════════════════════════════════════════════════
 */

import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Divider,
  Input,
  Progress,
  TerraSphere,
} from '@/components/terrafusion-design-system';
import * as React from 'react';
import { useState } from 'react';

export const TerraFusionDemo: React.FC = () => {
  const [progress, setProgress] = useState(65);
  const [inputValue, setInputValue] = useState('');

  return (
    <div className='min-h-screen bg-terra-midnight p-8'>
      {/* Header Section */}
      <div className='max-w-7xl mx-auto space-y-8'>
        <div className='text-center space-y-4'>
          <div className='flex justify-center'>
            <TerraSphere size='xl' variant='quantum' />
          </div>
          <h1 className='text-4xl font-bold text-cyan-400'>TerraFusion Quantum Governance</h1>
          <p className='text-lg text-gray-300 max-w-2xl mx-auto'>
            Advanced government administration platform featuring sophisticated design system with
            terra-cyan luminescence and quantum-themed interactions.
          </p>
        </div>

        {/* Design Tokens Showcase */}
        <Card variant='glass' glow className='p-6'>
          <CardHeader>
            <h2 className='text-2xl font-semibold text-cyan-400 flex items-center gap-3'>
              <TerraSphere size='md' variant='glow' />
              Design System Showcase
            </h2>
          </CardHeader>
          <CardBody className='space-y-6'>
            {/* Color Palette */}
            <div>
              <h3 className='text-lg font-medium text-cyan-400 mb-4'>Color Palette</h3>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                <div className='space-y-2'>
                  <div className='w-full h-16 bg-cyan-400 rounded-lg terra-glow'></div>
                  <div className='text-sm text-gray-300'>Terra Cyan</div>
                  <div className='text-xs text-gray-500'>var(--tf-transcend-cyan)</div>
                </div>
                <div className='space-y-2'>
                  <div className='w-full h-16 bg-blue-500 rounded-lg'></div>
                  <div className='text-sm text-gray-300'>Terra Blue</div>
                  <div className='text-xs text-gray-500'>var(--tf-network-blue)</div>
                </div>
                <div className='space-y-2'>
                  <div className='w-full h-16 bg-gray-800 rounded-lg'></div>
                  <div className='text-sm text-gray-300'>Terra Slate</div>
                  <div className='text-xs text-gray-500'>var(--terra-slate)</div>
                </div>
                <div className='space-y-2'>
                  <div className='w-full h-16 bg-gray-950 rounded-lg'></div>
                  <div className='text-sm text-gray-300'>Terra Midnight</div>
                  <div className='text-xs text-gray-500'>var(--tf-bg-void)</div>
                </div>
              </div>
            </div>

            <Divider variant='gradient' />

            {/* Typography Scale */}
            <div>
              <h3 className='text-lg font-medium text-cyan-400 mb-4'>
                Typography (Golden Ratio φ)
              </h3>
              <div className='space-y-2'>
                <div className='text-xs text-gray-400'>Extra Small (0.618rem)</div>
                <div className='text-sm text-gray-300'>Small (0.764rem)</div>
                <div className='text-base text-gray-200'>Base (1rem)</div>
                <div className='text-lg text-cyan-400'>Large (1.236rem)</div>
                <div className='text-xl text-cyan-300'>Extra Large (1.618rem)</div>
                <div className='text-2xl text-cyan-200'>2X Large (2rem)</div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Component Showcase */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {/* Buttons & Interactions */}
          <Card variant='glass' glow>
            <CardHeader>
              <h3 className='text-xl font-semibold text-cyan-400'>Interactive Components</h3>
            </CardHeader>
            <CardBody className='space-y-6'>
              {/* Buttons */}
              <div>
                <h4 className='text-sm font-medium text-gray-400 mb-3'>Button Variants</h4>
                <div className='space-y-3'>
                  <div className='flex gap-3 flex-wrap'>
                    <Button variant='primary'>Primary</Button>
                    <Button variant='secondary'>Secondary</Button>
                    <Button variant='ghost'>Ghost</Button>
                  </div>
                  <div className='flex gap-3 flex-wrap'>
                    <Button variant='quantum' pulse>
                      Quantum Pulse
                    </Button>
                    <Button variant='primary' glow>
                      Glow Effect
                    </Button>
                    <Button variant='danger'>Danger</Button>
                  </div>
                  <div className='flex gap-3 flex-wrap'>
                    <Button size='sm'>Small</Button>
                    <Button size='md'>Medium</Button>
                    <Button size='lg'>Large</Button>
                  </div>
                </div>
              </div>

              <Divider variant='solid' />

              {/* Input Components */}
              <div>
                <h4 className='text-sm font-medium text-gray-400 mb-3'>Input Components</h4>
                <div className='space-y-4'>
                  <Input
                    label='Standard Input'
                    placeholder='Enter text...'
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                  <Input label='Quantum Input with Glow' placeholder='Quantum parameters...' glow />
                  <Input
                    label='Error State'
                    placeholder='Invalid input...'
                    error='This field has an error'
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Progress & Feedback */}
          <Card variant='glass' glow>
            <CardHeader>
              <h3 className='text-xl font-semibold text-cyan-400'>Progress & Feedback</h3>
            </CardHeader>
            <CardBody className='space-y-6'>
              {/* Progress Bars */}
              <div>
                <h4 className='text-sm font-medium text-gray-400 mb-3'>Progress Indicators</h4>
                <div className='space-y-4'>
                  <Progress value={progress} showValue />
                  <Progress value={85} variant='quantum' showValue />
                  <div className='flex gap-2'>
                    <Button size='sm' onClick={() => setProgress(Math.max(0, progress - 10))}>
                      -10%
                    </Button>
                    <Button size='sm' onClick={() => setProgress(Math.min(100, progress + 10))}>
                      +10%
                    </Button>
                  </div>
                </div>
              </div>

              <Divider variant='gradient' />

              {/* Badges */}
              <div>
                <h4 className='text-sm font-medium text-gray-400 mb-3'>Status Badges</h4>
                <div className='flex gap-2 flex-wrap'>
                  <Badge variant='default'>Active</Badge>
                  <Badge variant='success'>Success</Badge>
                  <Badge variant='warning'>Warning</Badge>
                  <Badge variant='error'>Error</Badge>
                  <Badge variant='quantum' pulse>
                    Quantum
                  </Badge>
                </div>
              </div>

              {/* Avatars */}
              <div>
                <h4 className='text-sm font-medium text-gray-400 mb-3'>Avatar Components</h4>
                <div className='flex gap-3 items-center'>
                  <Avatar size='sm' fallback='SM' />
                  <Avatar size='md' fallback='MD' glow />
                  <Avatar size='lg' fallback='LG' />
                  <Avatar size='xl' fallback='XL' glow />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Advanced Effects Showcase */}
        <Card variant='quantum' glow>
          <CardHeader>
            <h3 className='text-xl font-semibold text-white flex items-center gap-3'>
              <TerraSphere size='md' variant='pulse' />
              Quantum Effects Gallery
            </h3>
          </CardHeader>
          <CardBody>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              {/* Glassmorphism */}
              <div className='terra-glass p-6 rounded-lg space-y-3'>
                <div className='flex items-center gap-2'>
                  <TerraSphere size='sm' variant='glow' />
                  <h4 className='text-cyan-400 font-medium'>Glassmorphism</h4>
                </div>
                <p className='text-gray-300 text-sm'>
                  Advanced backdrop-filter effects with terra-cyan luminescence
                </p>
              </div>

              {/* Quantum Pulse */}
              <div className='bg-gray-800/50 p-6 rounded-lg quantum-pulse space-y-3'>
                <div className='flex items-center gap-2'>
                  <TerraSphere size='sm' variant='quantum' />
                  <h4 className='text-cyan-400 font-medium'>Quantum Pulse</h4>
                </div>
                <p className='text-gray-300 text-sm'>
                  Rhythmic pulsing effects synchronized with quantum theme
                </p>
              </div>

              {/* Terra Glow */}
              <div className='bg-gray-800/50 p-6 rounded-lg terra-glow space-y-3'>
                <div className='flex items-center gap-2'>
                  <TerraSphere size='sm' variant='static' />
                  <h4 className='text-cyan-400 font-medium'>Terra Glow</h4>
                </div>
                <p className='text-gray-300 text-sm'>
                  Sophisticated luminescence effects for enhanced depth
                </p>
              </div>
            </div>
          </CardBody>
          <CardFooter>
            <div className='w-full text-center'>
              <p className='text-white/80 text-sm'>
                All effects are optimized for 60fps performance and government-grade accessibility
              </p>
            </div>
          </CardFooter>
        </Card>

        {/* System Information */}
        <Card variant='glass' className='p-6'>
          <div className='text-center space-y-4'>
            <h3 className='text-lg font-semibold text-cyan-400'>
              TerraFusion Design System v1.0.0
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4 text-sm'>
              <div className='space-y-1'>
                <div className='text-gray-400'>Primary Color</div>
                <div className='text-cyan-400'>Terra Cyan</div>
              </div>
              <div className='space-y-1'>
                <div className='text-gray-400'>Typography</div>
                <div className='text-cyan-400'>Golden Ratio</div>
              </div>
              <div className='space-y-1'>
                <div className='text-gray-400'>Spacing</div>
                <div className='text-cyan-400'>Base-8 System</div>
              </div>
              <div className='space-y-1'>
                <div className='text-gray-400'>Effects</div>
                <div className='text-cyan-400'>Quantum Theme</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TerraFusionDemo;

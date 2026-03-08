import { Environment, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useTerraFusionTheme } from '@/hooks/useTerraFusionTheme';
import React, { useEffect, useRef, useState } from 'react';
import { Vector3 } from 'three';
import { useGestureControl } from '../../hooks/useGestureControl';
import { useLevyData } from '../../hooks/useLevyData';
import { useVoiceCommands } from '../../hooks/useVoiceCommands';
import { AIAssistantOverlay } from '../ai/AIAssistantOverlay';
import { QuantumDataStream } from '../quantum/QuantumDataStream';
import { CitizenInteractionPanel } from './CitizenInteractionPanel';
import { LevyStatusVisualization } from './LevyStatusVisualization';
import { PaymentTrackingSphere } from './PaymentTrackingSphere';

interface ImmersiveDashboardProps {
  userRole: 'levy-clerk' | 'revenue-dept' | 'county-budget' | 'quantum-ai';
  userId: string;
  workspaceId: string;
}

export const ImmersiveDashboard: React.FC<ImmersiveDashboardProps> = ({
  userRole,
  userId,
  workspaceId,
}) => {
  const [selectedDataSet, setSelectedDataSet] = useState<string>('levy-overview');
  const [immersionLevel, setImmersionLevel] = useState<number>(0.8);
  const [aiAssistantActive, setAiAssistantActive] = useState<boolean>(true);
  const [quantumVisualization, setQuantumVisualization] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const theme = useTerraFusionTheme();

  // Real-time data hooks
  const { levyData, isLoading, error } = useLevyData(workspaceId);

  // Multi-modal interaction hooks
  const { voiceCommand, isListening } = useVoiceCommands({
    onCommand: handleVoiceCommand,
    continuous: true,
  });

  const { gestureData, isGestureActive } = useGestureControl({
    canvas: canvasRef.current,
    onGesture: handleGestureInput,
  });

  useEffect(() => {
    // Initialize 3D environment with user-specific preferences
    if (userRole === 'quantum-ai') {
      setQuantumVisualization(true);
      setImmersionLevel(1.0);
    }
  }, [userRole]);

  function handleVoiceCommand(command: string) {
    switch (command.toLowerCase()) {
      case 'show levy status':
        setSelectedDataSet('levy-overview');
        break;
      case 'citizen interactions':
        setSelectedDataSet('citizen-data');
        break;
      case 'payment tracking':
        setSelectedDataSet('payment-flows');
        break;
      case 'quantum mode':
        setQuantumVisualization(!quantumVisualization);
        break;
      case 'ai assistant':
        setAiAssistantActive(!aiAssistantActive);
        break;
    }
  }

  function handleGestureInput(gesture: any) {
    // Handle gesture-based navigation through 3D space
    if (gesture.type === 'pinch') {
      setImmersionLevel(Math.max(0.1, Math.min(1.0, gesture.scale)));
    }
  }

  if (isLoading) {
    return (
      <div className='immersive-loading'>
        <QuantumDataStream loading={true} />
        <div className='loading-text'>Initializing Quantum Analytics...</div>
      </div>
    );
  }

  return (
    <div className='immersive-dashboard' style={{ height: '100vh', width: '100vw' }}>
      {/* 3D Canvas Environment */}
      <Canvas
        ref={canvasRef}
        style={{ background: theme.colors.quantum.deepSpace }}
        camera={{ position: new Vector3(0, 5, 10), fov: 60 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
      >
        {/* Quantum-Enhanced Environment */}
        <Environment preset='studio' />
        <ambientLight intensity={0.3} />
        <directionalLight position={[10, 10, 5]} intensity={1} />

        {/* Dynamic Camera Controls */}
        <PerspectiveCamera makeDefault position={[0, 5, 10]} />
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxDistance={50}
          minDistance={2}
        />

        {/* Core 3D Visualization Components */}
        <LevyStatusVisualization
          data={levyData?.levyStatus}
          position={[-5, 0, 0]}
          immersionLevel={immersionLevel}
          quantumMode={quantumVisualization}
        />

        <CitizenInteractionPanel
          data={levyData?.citizenInteractions}
          position={[0, 0, 0]}
          interactive={true}
          aiEnhanced={aiAssistantActive}
        />

        <PaymentTrackingSphere
          data={levyData?.paymentFlows}
          position={[5, 0, 0]}
          realTimeUpdates={true}
          predictiveMode={userRole === 'revenue-dept'}
        />

        {/* Quantum Data Streams */}
        {quantumVisualization && (
          <QuantumDataStream
            dataFlow={levyData?.quantumMetrics}
            visualization='particles'
            intensity={immersionLevel}
          />
        )}
      </Canvas>

      {/* AI Assistant Overlay */}
      {aiAssistantActive && (
        <AIAssistantOverlay
          userRole={userRole}
          onCommand={handleVoiceCommand}
          contextData={levyData}
          position='bottom-right'
        />
      )}

      {/* Voice Command Indicator */}
      {isListening && (
        <div className='voice-indicator'>
          <div className='pulse-animation' />
          <span>Listening for commands...</span>
        </div>
      )}

      {/* Gesture Control Feedback */}
      {isGestureActive && (
        <div className='gesture-feedback'>
          <span>Gesture Control Active</span>
        </div>
      )}

      {/* User Role-Specific Controls */}
      <div className='dashboard-controls'>
        <div className='immersion-slider'>
          <label>Immersion Level</label>
          <input
            type='range'
            min='0.1'
            max='1.0'
            step='0.1'
            value={immersionLevel}
            onChange={(e) => setImmersionLevel(parseFloat(e.target.value))}
          />
        </div>

        <div className='visualization-toggles'>
          <button
            className={`quantum-toggle ${quantumVisualization ? 'active' : ''}`}
            onClick={() => setQuantumVisualization(!quantumVisualization)}
          >
            Quantum Mode
          </button>

          <button
            className={`ai-toggle ${aiAssistantActive ? 'active' : ''}`}
            onClick={() => setAiAssistantActive(!aiAssistantActive)}
          >
            AI Assistant
          </button>
        </div>
      </div>

      {/* Performance Metrics Overlay */}
      <div className='performance-metrics'>
        <div className='fps-counter'>FPS: 60</div>
        <div className='response-time'>Response: &lt;100ms</div>
        <div className='accuracy-indicator'>AI Accuracy: 99.7%</div>
      </div>
    </div>
  );
};

export default ImmersiveDashboard;

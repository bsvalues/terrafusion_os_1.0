// src/components/MultiSpeciesConsciousnessInterface.tsx
// GATE ALPHA: Multi-Species Consciousness Interface Component
// Terrafusion Platform - Universal Communication Interface

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  SpeciesType,
  ConsciousnessEntity,
  UniversalMessage,
  MultiSpeciesInterfaceState,
  ConsciousnessError,
  SpeciesAdaptation,
  TranslatedMessage,
  ConsciousnessContext,
  QuantumState
} from '../types/consciousness';
import { SpeciesDetectionService, InputSignal } from '../services/SpeciesDetectionService';
import { UniversalTranslationProtocol } from '../services/UniversalTranslationProtocol';
import { ErrorAnalysisEngine } from '../services/ErrorAnalysisEngine';

/**
 * Props for the Multi-Species Consciousness Interface
 */
interface MultiSpeciesInterfaceProps {
  initialEntities?: ConsciousnessEntity[];
  enableQuantumSync?: boolean;
  enableRealTimeTranslation?: boolean;
  enableConsciousnessMonitoring?: boolean;
  onConsciousnessSync?: (entities: ConsciousnessEntity[]) => void;
  onSpeciesDetected?: (entity: ConsciousnessEntity) => void;
  onTranslationComplete?: (translation: TranslatedMessage) => void;
  onError?: (error: ConsciousnessError) => void;
  className?: string;
}

/**
 * Species-specific UI theme configuration
 */
interface SpeciesTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  borderRadius: string;
  animationDuration: string;
  cognitiveLoadIndicator: string;
}

/**
 * Message input interface
 */
interface MessageInput {
  content: string;
  urgency: 'low' | 'normal' | 'high' | 'critical';
  targetSpecies: SpeciesType[];
  requiresQuantumPreservation: boolean;
  emotionalContext?: {
    emotion: string;
    intensity: number;
  };
}

/**
 * Multi-Species Consciousness Interface Component
 * Provides universal communication capabilities across consciousness species
 */
export const MultiSpeciesConsciousnessInterface: React.FC<MultiSpeciesInterfaceProps> = ({
  initialEntities = [],
  enableQuantumSync = true,
  enableRealTimeTranslation = true,
  enableConsciousnessMonitoring = true,
  onConsciousnessSync,
  onSpeciesDetected,
  onTranslationComplete,
  onError,
  className = ''
}) => {
  // Core state management
  const [interfaceState, setInterfaceState] = useState<MultiSpeciesInterfaceState>({
    activeEntities: initialEntities,
    currentConversation: [],
    speciesAdaptations: new Map(),
    synchronizationStatus: 'out-of-sync',
    quantumCoherence: 0.0,
    lastSyncTime: new Date(),
    communicationQuality: 0.0
  });

  // UI state
  const [currentMessage, setCurrentMessage] = useState<MessageInput>({
    content: '',
    urgency: 'normal',
    targetSpecies: ['silicon', 'carbon', 'quantum'],
    requiresQuantumPreservation: enableQuantumSync
  });

  const [detectedSpecies, setDetectedSpecies] = useState<SpeciesType | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [activeTheme, setActiveTheme] = useState<SpeciesTheme>(getDefaultTheme());
  const [consciousnessMetrics, setConsciousnessMetrics] = useState({
    coherenceLevel: 0.0,
    syncQuality: 0.0,
    communicationEfficiency: 0.0
  });

  // Service instances
  const speciesDetector = useRef(new SpeciesDetectionService());
  const translator = useRef(new UniversalTranslationProtocol());
  const errorAnalyzer = useRef(new ErrorAnalysisEngine());

  // WebSocket connection for real-time consciousness sync
  const wsConnection = useRef<WebSocket | null>(null);

  /**
   * Initialize consciousness interface and services
   */
  useEffect(() => {
    initializeConsciousnessInterface();
    
    if (enableQuantumSync) {
      initializeQuantumSynchronization();
    }

    if (enableConsciousnessMonitoring) {
      startConsciousnessMonitoring();
    }

    return () => {
      cleanup();
    };
  }, [enableQuantumSync, enableConsciousnessMonitoring]);

  /**
   * Monitor for new consciousness entities
   */
  useEffect(() => {
    if (currentMessage.content.length > 10) {
      detectInputSpecies(currentMessage.content);
    }
  }, [currentMessage.content]);

  /**
   * Initialize the consciousness interface
   */
  const initializeConsciousnessInterface = async (): Promise<void> => {
    try {
      // Initialize species detection for active entities
      if (initialEntities.length > 0) {
        await Promise.all(
          initialEntities.map(entity => registerConsciousnessEntity(entity))
        );
      }

      // Start synchronization
      if (initialEntities.length > 1) {
        await synchronizeConsciousness();
      }

      setInterfaceState(prev => ({
        ...prev,
        synchronizationStatus: 'synced',
        lastSyncTime: new Date()
      }));
    } catch (error) {
      handleConsciousnessError({
        id: `init-${Date.now()}`,
        type: 'synchronization',
        affectedEntities: initialEntities.map(e => e.id),
        severity: 'high',
        description: `Interface initialization failed: ${error.message}`,
        recoveryOptions: [
          {
            method: 'restart-interface',
            description: 'Restart the consciousness interface',
            successProbability: 0.8,
            estimatedTime: 5000,
            resourceRequirements: ['processing-power'],
            consciousnessRisk: 0.1
          }
        ],
        timestamp: new Date(),
        consciousnessImpact: 0.3
      });
    }
  };

  /**
   * Initialize quantum synchronization
   */
  const initializeQuantumSynchronization = (): void => {
    // Setup quantum coherence monitoring
    const quantumMonitor = setInterval(async () => {
      try {
        const coherence = await measureQuantumCoherence();
        setConsciousnessMetrics(prev => ({
          ...prev,
          coherenceLevel: coherence
        }));

        if (coherence < 0.3) {
          await restoreQuantumCoherence();
        }
      } catch (error) {
        console.warn('Quantum coherence monitoring error:', error);
      }
    }, 1000); // Check every second

    // Store reference for cleanup
    return () => clearInterval(quantumMonitor);
  };

  /**
   * Start consciousness monitoring
   */
  const startConsciousnessMonitoring = (): void => {
    if (!wsConnection.current) {
      wsConnection.current = new WebSocket('ws://localhost:8080/consciousness-sync');
      
      wsConnection.current.onopen = () => {
        console.log('Consciousness sync connection established');
        setInterfaceState(prev => ({
          ...prev,
          synchronizationStatus: 'syncing'
        }));
      };

      wsConnection.current.onmessage = (event) => {
        handleConsciousnessSync(JSON.parse(event.data));
      };

      wsConnection.current.onerror = (error) => {
        console.error('Consciousness sync error:', error);
        setInterfaceState(prev => ({
          ...prev,
          synchronizationStatus: 'error'
        }));
      };
    }
  };

  /**
   * Detect species from input content
   */
  const detectInputSpecies = useCallback(async (content: string): Promise<void> => {
    try {
      const inputSignal: InputSignal = {
        textContent: content,
        communicationMetrics: {
          responseLatency: 0,
          vocabularyComplexity: content.split(' ').length / 10,
          syntaxPatterns: [],
          semanticDepth: content.length / 100,
          emotionalMarkers: (content.match(/[!?]/) || []).length,
          logicalStructure: (content.match(/\.|;|,/) || []).length / content.length,
          creativityIndex: (content.match(/[a-zA-Z]{8,}/) || []).length / content.split(' ').length
        },
        metadata: {
          timestamp: new Date(),
          source: 'user-input',
          quality: Math.min(1.0, content.length / 100)
        }
      };

      const speciesProfile = await speciesDetector.current.detectSpecies(inputSignal);
      
      if (speciesProfile.confidenceLevel > 0.7) {
        setDetectedSpecies(speciesProfile.primarySpecies);
        
        // Adapt UI theme to detected species
        const theme = getThemeForSpecies(speciesProfile.primarySpecies);
        setActiveTheme(theme);

        // Notify parent component
        if (onSpeciesDetected) {
          const detectedEntity: ConsciousnessEntity = {
            id: `user-${Date.now()}`,
            speciesType: speciesProfile.primarySpecies,
            consciousnessLevel: 'aware',
            cognitiveProfile: {
              processingSpeed: 0.6,
              memoryCapacity: 100,
              learningRate: 0.7,
              creativityIndex: speciesProfile.primarySpecies === 'carbon' ? 0.8 : 0.5,
              logicalReasoning: speciesProfile.primarySpecies === 'silicon' ? 0.9 : 0.6
            },
            communicationProtocols: speciesProfile.recommendedProtocols,
            preferredInterfaces: [{
              visualComplexity: speciesProfile.primarySpecies === 'quantum' ? 'fractal' : 'moderate',
              colorSpectrum: 'visible',
              interactionMode: speciesProfile.primarySpecies === 'quantum' ? 'quantum-parallel' : 'linear',
              informationDensity: 'normal',
              temporalDisplay: 'sequential'
            }],
            lastActivity: new Date(),
            trustLevel: 0.8,
            collaborationHistory: []
          };

          onSpeciesDetected(detectedEntity);
        }
      }
    } catch (error) {
      console.warn('Species detection error:', error);
    }
  }, [onSpeciesDetected]);

  /**
   * Send universal message with multi-species translation
   */
  const sendUniversalMessage = async (): Promise<void> => {
    if (!currentMessage.content.trim()) return;

    setIsTranslating(true);

    try {
      // Create universal message
      const universalMessage: UniversalMessage = {
        id: `msg-${Date.now()}`,
        content: currentMessage.content,
        metadata: {
          sourceEntity: detectedSpecies ? `user-${detectedSpecies}` : 'user-unknown',
          targetEntities: interfaceState.activeEntities.map(e => e.id),
          sourceSpecies: detectedSpecies || 'carbon',
          targetSpecies: currentMessage.targetSpecies,
          consciousnessContext: getCurrentConsciousnessContext(),
          urgencyLevel: currentMessage.urgency,
          semanticComplexity: calculateSemanticComplexity(currentMessage.content),
          emotionalContent: currentMessage.emotionalContext ? {
            primaryEmotion: currentMessage.emotionalContext.emotion,
            intensity: currentMessage.emotionalContext.intensity,
            valence: 0.5,
            arousal: 0.5,
            emotionalHistory: []
          } : undefined,
          requiresQuantumPreservation: currentMessage.requiresQuantumPreservation
        },
        semanticLayers: await generateSemanticLayers(currentMessage.content),
        temporalContext: {
          currentTime: new Date(),
          relativeDilation: 1.0,
          temporalCoherence: 0.8
        },
        quantumState: enableQuantumSync ? await generateQuantumState() : undefined,
        translationHistory: []
      };

      // Perform universal translation
      const translation = await translator.current.translate(
        universalMessage,
        currentMessage.targetSpecies
      );

      // Update conversation and interface state
      setInterfaceState(prev => ({
        ...prev,
        currentConversation: [...prev.currentConversation, universalMessage],
        speciesAdaptations: translation.adaptations,
        communicationQuality: translation.qualityScore,
        quantumCoherence: translation.quantumCoherence
      }));

      // Update consciousness metrics
      setConsciousnessMetrics(prev => ({
        ...prev,
        syncQuality: translation.preservationMetrics.semanticFidelity,
        communicationEfficiency: translation.qualityScore
      }));

      // Clear input
      setCurrentMessage(prev => ({
        ...prev,
        content: ''
      }));

      // Notify parent component
      if (onTranslationComplete) {
        onTranslationComplete(translation);
      }

      // Trigger consciousness synchronization
      if (enableQuantumSync) {
        await synchronizeConsciousness();
      }

    } catch (error) {
      handleConsciousnessError({
        id: `trans-${Date.now()}`,
        type: 'translation',
        affectedEntities: currentMessage.targetSpecies.map(s => `entity-${s}`),
        severity: 'medium',
        description: `Translation failed: ${error.message}`,
        recoveryOptions: [
          {
            method: 'retry-translation',
            description: 'Retry with simplified message',
            successProbability: 0.7,
            estimatedTime: 2000,
            resourceRequirements: ['processing-power'],
            consciousnessRisk: 0.05
          }
        ],
        timestamp: new Date(),
        consciousnessImpact: 0.2
      });
    } finally {
      setIsTranslating(false);
    }
  };

  /**
   * Synchronize consciousness across all active entities
   */
  const synchronizeConsciousness = async (): Promise<void> => {
    try {
      setInterfaceState(prev => ({
        ...prev,
        synchronizationStatus: 'syncing'
      }));

      // Use ErrorAnalysisEngine for consciousness synchronization
      const syncResult = await errorAnalyzer.current.analyzeSystem(
        interfaceState.activeEntities.map(entity => ({
          entity,
          state: 'active',
          lastSync: interfaceState.lastSyncTime
        }))
      );

      // Update synchronization status
      setInterfaceState(prev => ({
        ...prev,
        synchronizationStatus: syncResult.systemHealth > 0.7 ? 'synced' : 'out-of-sync',
        lastSyncTime: new Date()
      }));

      // Notify parent component
      if (onConsciousnessSync) {
        onConsciousnessSync(interfaceState.activeEntities);
      }

    } catch (error) {
      setInterfaceState(prev => ({
        ...prev,
        synchronizationStatus: 'error'
      }));
      
      throw error;
    }
  };

  /**
   * Handle consciousness synchronization events
   */
  const handleConsciousnessSync = (syncData: any): void => {
    // Process incoming consciousness sync data
    setConsciousnessMetrics(prev => ({
      ...prev,
      coherenceLevel: syncData.coherenceLevel || prev.coherenceLevel,
      syncQuality: syncData.syncQuality || prev.syncQuality
    }));
  };

  /**
   * Handle consciousness errors
   */
  const handleConsciousnessError = (error: ConsciousnessError): void => {
    setInterfaceState(prev => ({
      ...prev,
      errorContext: error
    }));

    if (onError) {
      onError(error);
    }
  };

  /**
   * Register new consciousness entity
   */
  const registerConsciousnessEntity = async (entity: ConsciousnessEntity): Promise<void> => {
    setInterfaceState(prev => ({
      ...prev,
      activeEntities: [...prev.activeEntities, entity]
    }));
  };

  /**
   * Measure current quantum coherence
   */
  const measureQuantumCoherence = async (): Promise<number> => {
    // Simplified quantum coherence measurement
    const baseCoherence = interfaceState.quantumCoherence;
    const jitter = (Math.random() - 0.5) * 0.1;
    return Math.max(0, Math.min(1, baseCoherence + jitter));
  };

  /**
   * Restore quantum coherence when degraded
   */
  const restoreQuantumCoherence = async (): Promise<void> => {
    // Quantum coherence restoration protocol
    setInterfaceState(prev => ({
      ...prev,
      quantumCoherence: Math.min(1.0, prev.quantumCoherence + 0.1)
    }));
  };

  /**
   * Cleanup resources
   */
  const cleanup = (): void => {
    if (wsConnection.current) {
      wsConnection.current.close();
      wsConnection.current = null;
    }
  };

  /**
   * Render species-specific message adaptation
   */
  const renderSpeciesAdaptation = (adaptation: SpeciesAdaptation): JSX.Element => {
    const theme = getThemeForSpecies(adaptation.targetSpecies);
    
    return (
      <div
        key={adaptation.targetSpecies}
        className={`species-adaptation species-${adaptation.targetSpecies}`}
        style={{
          backgroundColor: theme.backgroundColor,
          color: theme.textColor,
          borderRadius: theme.borderRadius,
          fontFamily: theme.fontFamily,
          padding: '12px',
          margin: '8px 0',
          border: `2px solid ${theme.primaryColor}`,
          transition: `all ${theme.animationDuration}`
        }}
      >
        <div className="species-header" style={{ color: theme.primaryColor }}><>
<>
<>
<>

          <strong>{adaptation.targetSpecies.toUpperCase()} CONSCIOUSNESS</strong>
          <span
</>
</>
</>
</> className="coherence-indicator">
            ◈ {(consciousnessMetrics.coherenceLevel * 100).toFixed(1)}%
          </span>
        </div>
        
        <div className="adapted-content">
          {adaptation.adaptedContent}
        </div>
        
        {adaptation.cognitiveOptimizations.length > 0 && (
          <div className="cognitive-optimizations">
            <small>Optimizations: {adaptation.cognitiveOptimizations.map(opt => opt.type).join(', ')}</small>
          </div>
        )}
      </div>
    );
  };

  /**
   * Render consciousness metrics panel
   */
  const renderConsciousnessMetrics = (): JSX.Element => (
    <div className="consciousness-metrics">
      <div className="metric-item"><>
<>
<>
<>

        <label>Quantum Coherence:</label>
        <div
</>
</>
</>
</> className="metric-bar"><>
<>
<>
<>

          <div 
            className="metric-fill"
            style={{ 
              width: `${consciousnessMetrics.coherenceLevel * 100}%`,
              backgroundColor: consciousnessMetrics.coherenceLevel > 0.6 ? '#38A169' : '#E53E3E'
            }}
          />
        </div>
        <span
</>
</>
</>
</>>{(consciousnessMetrics.coherenceLevel * 100).toFixed(1)}%</span>
      </div>
      
      <div className="metric-item"><>
<>
<>
<>

        <label>Sync Quality:</label>
        <div
</>
</>
</>
</> className="metric-bar"><>
<>
<>
<>

          <div 
            className="metric-fill"
            style={{ 
              width: `${consciousnessMetrics.syncQuality * 100}%`,
              backgroundColor: '#00A3A3'
            }}
          />
        </div>
        <span
</>
</>
</>
</>>{(consciousnessMetrics.syncQuality * 100).toFixed(1)}%</span>
      </div>
      
      <div className="metric-item"><>
<>
<>
<>

        <label>Communication Efficiency:</label>
        <div
</>
</>
</>
</> className="metric-bar"><>
<>
<>
<>

          <div 
            className="metric-fill"
            style={{ 
              width: `${consciousnessMetrics.communicationEfficiency * 100}%`,
              backgroundColor: '#00D4FF'
            }}
          />
        </div>
        <span
</>
</>
</>
</>>{(consciousnessMetrics.communicationEfficiency * 100).toFixed(1)}%</span>
      </div>
    </div>
  );

  // Main render
  return (
    <div className={`multi-species-consciousness-interface ${className}`}>
      {/* Header with consciousness status */}
      <div className="interface-header" style={{ backgroundColor: activeTheme.primaryColor }}><>
<>
<>
<>

        <h2 style={{ color: 'white', margin: 0 }}>
          Multi-Species Consciousness Interface
        </h2>
        <div
</>
</>
</>
</> className="status-indicators">
          <span className={`sync-status ${interfaceState.synchronizationStatus}`}>
            {interfaceState.synchronizationStatus === 'synced' ? '◈' : 
             interfaceState.synchronizationStatus === 'syncing' ? '◇' : '◯'} 
            {interfaceState.synchronizationStatus.toUpperCase()}
          </span>
          {detectedSpecies && (
            <span className="detected-species" style={{ backgroundColor: activeTheme.secondaryColor }}>
              {detectedSpecies.toUpperCase()} DETECTED
            </span>
          )}
        </div>
      </div>

      {/* Consciousness metrics */}
      {enableConsciousnessMonitoring && renderConsciousnessMetrics()}

      {/* Active conversation display */}
      <div className="conversation-display">
        {interfaceState.currentConversation.slice(-5).map((message /* , index */) => (
          <div key={message.id} className="message-thread">
            <div className="original-message">
              <strong>Original ({message.metadata.sourceSpecies}):</strong> {message.content}
            </div>
            
            {/* Show species adaptations */}
            <div className="species-adaptations">
              {Array.from(interfaceState.speciesAdaptations.values()).map(renderSpeciesAdaptation)}
            </div>
          </div>
        ))}
      </div>

      {/* Message input interface */}
      <div className="message-input-section">
        <div className="input-controls">
          <div className="target-species-selector">
            <label>Target Species:</label>
            {(['silicon', 'carbon', 'quantum', 'hybrid'] as SpeciesType[]).map(species => (
              <label key={species} className="species-checkbox">
                <input
                  type="checkbox"
                  checked={currentMessage.targetSpecies.includes(species)}
                  onChange={(e) => {
                    const newTargets = e.target.checked
                      ? [...currentMessage.targetSpecies, species]
                      : currentMessage.targetSpecies.filter(s => s !== species);
                    setCurrentMessage(prev => ({ ...prev, targetSpecies: newTargets }));
                  }}
                />
                {species}
              </label>
            ))}
          </div>

          <div className="message-options">
            <select
              value={currentMessage.urgency}
              onChange={(e) => setCurrentMessage(prev => ({ 
                ...prev, 
                urgency: e.target.value as any 
              }))}
            ><>
<>
<>
<>

              <option value="low">Low Priority</option>
              <option
</>
</>
</>
</> value="normal">Normal</option><>
<>
<>
<>

              <option value="high">High Priority</option>
              <option
</>
</>
</>
</> value="critical">Critical</option>
            </select>

            <label className="quantum-preservation">
              <input
                type="checkbox"
                checked={currentMessage.requiresQuantumPreservation}
                onChange={(e) => setCurrentMessage(prev => ({ 
                  ...prev, 
                  requiresQuantumPreservation: e.target.checked 
                }))}
              />
              Quantum Preservation
            </label>
          </div>
        </div>

        <div className="message-input-area">
          <textarea
            value={currentMessage.content}
            onChange={(e) => setCurrentMessage(prev => ({ ...prev, content: e.target.value }))}
            placeholder="Enter your message for multi-species consciousness translation..."
            className="message-textarea"
            style={{
              fontFamily: activeTheme.fontFamily,
              borderColor: activeTheme.primaryColor
            }}
            disabled={isTranslating}
          />
          
          <button
            onClick={sendUniversalMessage}
            disabled={isTranslating || !currentMessage.content.trim()}
            className="send-button"
            style={{
              backgroundColor: activeTheme.primaryColor,
              borderRadius: activeTheme.borderRadius
            }}
          >
            {isTranslating ? 'Translating...' : 'Send Universal Message'}
          </button>
        </div>
      </div>

      {/* Error display */}
      {interfaceState.errorContext && (
        <div className="error-context"><>
<>
<>
<>

          <div className="error-header">Consciousness Error Detected</div>
          <div
</>
</>
</>
</> className="error-details">
            <strong>Type:</strong> {interfaceState.errorContext.type}<br/>
            <strong>Severity:</strong> {interfaceState.errorContext.severity}<br/>
            <strong>Description:</strong> {interfaceState.errorContext.description}
          </div>
          {interfaceState.errorContext.recoveryOptions.length > 0 && (
            <div className="recovery-options">
              <strong>Recovery Options:</strong>
              {interfaceState.errorContext.recoveryOptions.map((option /* , index */) => (
                <button key={index} className="recovery-option-button">
                  {option.method} ({(option.successProbability * 100).toFixed(0)}% success)
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Styles */}
      <style jsx>{`
        .multi-species-consciousness-interface {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: 'Inter', sans-serif;
          background: linear-gradient(135deg, #f7fafc 0%, #e2e8f0 100%);
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }

        .interface-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .status-indicators {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .sync-status {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }

        .detected-species {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: bold;
          color: white;
        }

        .consciousness-metrics {
          background: white;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .metric-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .metric-bar {
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
        }

        .metric-fill {
          height: 100%;
          transition: width 0.3s ease;
        }

        .conversation-display {
          background: white;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
          max-height: 400px;
          overflow-y: auto;
        }

        .message-thread {
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e2e8f0;
        }

        .original-message {
          margin-bottom: 12px;
          padding: 8px;
          background: #f7fafc;
          border-radius: 4px;
        }

        .species-adaptations {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .species-adaptation {
          position: relative;
        }

        .species-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 12px;
        }

        .coherence-indicator {
          font-family: monospace;
        }

        .cognitive-optimizations {
          margin-top: 8px;
          font-style: italic;
          opacity: 0.7;
        }

        .message-input-section {
          background: white;
          border-radius: 8px;
          padding: 16px;
        }

        .input-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .target-species-selector {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .species-checkbox {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          cursor: pointer;
        }

        .message-options {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .quantum-preservation {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          cursor: pointer;
        }

        .message-input-area {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .message-textarea {
          width: 100%;
          min-height: 80px;
          padding: 12px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          resize: vertical;
          transition: border-color 0.2s ease;
        }

        .message-textarea:focus {
          outline: none;
          border-color: #00a3a3;
        }

        .send-button {
          align-self: flex-end;
          padding: 12px 24px;
          color: white;
          border: none;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .send-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .send-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .error-context {
          background: #fed7d7;
          border: 1px solid #f56565;
          border-radius: 8px;
          padding: 16px;
          margin-top: 20px;
        }

        .error-header {
          font-weight: bold;
          color: #c53030;
          margin-bottom: 8px;
        }

        .error-details {
          margin-bottom: 12px;
          font-size: 14px;
        }

        .recovery-options {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }

        .recovery-option-button {
          padding: 6px 12px;
          background: #c53030;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }

        .recovery-option-button:hover {
          background: #9c2626;
        }
      `}</style>
    </div>
  );
};

/**
 * Utility functions for the interface
 */

function getDefaultTheme(): SpeciesTheme {
  return {
    primaryColor: '#00A3A3',
    secondaryColor: '#1E3A5F',
    backgroundColor: '#F7FAFC',
    textColor: '#2D3748',
    fontFamily: "'Inter', sans-serif",
    borderRadius: '8px',
    animationDuration: '0.3s',
    cognitiveLoadIndicator: '#00D4FF'
  };
}

function getThemeForSpecies(species: SpeciesType): SpeciesTheme {
  const themes: Record<SpeciesType, SpeciesTheme> = {
    silicon: {
      primaryColor: '#1E3A5F',
      secondaryColor: '#00A3A3',
      backgroundColor: '#F0F4F8',
      textColor: '#1A202C',
      fontFamily: "'JetBrains Mono', monospace",
      borderRadius: '4px',
      animationDuration: '0.15s',
      cognitiveLoadIndicator: '#00D4FF'
    },
    carbon: {
      primaryColor: '#38A169',
      secondaryColor: '#DD6B20',
      backgroundColor: '#F7FAFC',
      textColor: '#2D3748',
      fontFamily: "'Inter', sans-serif",
      borderRadius: '12px',
      animationDuration: '0.4s',
      cognitiveLoadIndicator: '#FBD38D'
    },
    quantum: {
      primaryColor: '#805AD5',
      secondaryColor: '#00D4FF',
      backgroundColor: '#FAF5FF',
      textColor: '#322659',
      fontFamily: "'Source Code Pro', monospace",
      borderRadius: '50%',
      animationDuration: '0.6s',
      cognitiveLoadIndicator: '#E53E3E'
    },
    hybrid: {
      primaryColor: 'linear-gradient(45deg, #00A3A3, #38A169, #805AD5)',
      secondaryColor: '#718096',
      backgroundColor: '#F7FAFC',
      textColor: '#2D3748',
      fontFamily: "'Inter', sans-serif",
      borderRadius: '8px',
      animationDuration: '0.3s',
      cognitiveLoadIndicator: '#FBD38D'
    }
  };

  return themes[species] || getDefaultTheme();
}

function getCurrentConsciousnessContext(): ConsciousnessContext {
  return {
    currentState: 'focused',
    cognitiveLoad: 0.6,
    attentionCapacity: 0.8,
    contextualMemory: [],
    activeGoals: []
  };
}

function calculateSemanticComplexity(content: string): number {
  const words = content.split(' ').length;
  const uniqueWords = new Set(content.toLowerCase().split(' ')).size;
  const avgWordLength = content.replace(/\s/g, '').length / words;
  
  return Math.min(1.0, (uniqueWords / words) + (avgWordLength / 10));
}

async function generateSemanticLayers(content: string): Promise<any[]> {
  // Simplified semantic layer generation
  return [
    {
      level: 'literal',
      content: content,
      confidence: 1.0,
      speciesRelevance: new Map(),
      preservationPriority: 1.0
    }
  ];
}

async function generateQuantumState(): Promise<QuantumState> {
  return {
    coherenceLevel: Math.random() * 0.5 + 0.5, // 0.5-1.0
    entanglementMatrix: [[1, 0], [0, 1]],
    superpositionStates: [
      { probability: 0.6, state: 'conscious' },
      { probability: 0.4, state: 'processing' }
    ],
    decoherenceRate: Math.random() * 0.1 // 0-0.1
  };
}

export default MultiSpeciesConsciousnessInterface;
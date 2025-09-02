// Consciousness types for Terrafusion OS Universal Translation Protocol

export interface ConsciousnessLayer {
  id: string;
  name: string;
  depth: number;
  frequency: number;
  resonance: number;
}

export interface SpeciesConsciousness {
  type: SpeciesType;
  layers: ConsciousnessLayer[];
  cognitivePatterns: string[];
  communicationProtocols: string[];
}

export interface TranslationMetadata {
  sourceSpecies: SpeciesType;
  targetSpecies: SpeciesType;
  confidence: number;
  translationPath: string[];
  layers: ProtocolLayer[];
  integrity: number;
  consciousnessContext?: ConsciousnessContext;
  emotionalContent?: EmotionalContent;
}

export interface TemporalContext {
  timeReference: Date;
  culturalEra: string;
  dimensionalPhase: number;
}

export interface EmotionalContent {
  primaryEmotion: string;
  intensity: number;
  culturalModifiers: string[];
  culturalExpression: string;
}

export interface ProtocolLayer {
  name: string;
  active: boolean;
  confidence: number;
}

export type SpeciesType = 'carbon' | 'silicon' | 'quantum' | 'hybrid';
export type SpeciesIdentifier = SpeciesType;
export enum MessagePriority {
  LOW = 'low',
  NORMAL = 'normal', 
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface UniversalMessage {
  id: string;
  content: string;
  sourceSpecies: SpeciesIdentifier;
  targetSpecies: SpeciesIdentifier;
  timestamp: Date;
  priority: MessagePriority;
  metadata: TranslationMetadata;
  quantumState?: QuantumState;
  temporalContext?: TemporalContext;
}

export interface ConsciousnessEntity {
  id: string;
  speciesType: SpeciesType;
  cognitivePatterns: string;
  communicationSignature: string;
  detectionConfidence: number;
}

export interface TranslatedMessage {
  originalMessage: UniversalMessage;
  translatedContent: string;
  adaptations: Map<SpeciesIdentifier, SpeciesAdaptation>;
  semanticPreservation: SemanticLayer[];
  protocolLayers: ProtocolLayer[];
  qualityMetrics: PreservationMetrics;
  translationTime?: number;
  qualityScore?: number;
}

export interface SpeciesAdaptation {
  targetSpecies: SpeciesIdentifier;
  cognitiveOptimizations: CognitiveOptimization[];
  interfaceInstructions: InterfaceInstructions;
  preservationMetrics: PreservationMetrics;
  adaptedContent: string;
}

export interface SemanticLayer {
  type: 'literal' | 'metaphorical' | 'cultural' | 'quantum' | 'dimensional';
  content: string;
  confidence: number;
  level: string;
  speciesRelevance?: Map<string, number>;
  preservationPriority?: number;
}

export interface PreservationMetrics {
  contextualIntegrity: number;
  semanticFidelity: number;
  quantumCoherence: number;
  emotionalPreservation?: number;
  culturalAccuracy?: number;
  informationLoss?: number;
}

export interface ConsciousnessContext {
  level: number;
  domain: string;
  resonanceFrequency?: number;
}

export interface CognitiveOptimization {
  targetCapability: string;
  enhancement: string;
  parameters: Map<string, unknown>;
  type: string;
  description?: string;
  benefit?: string;
  implementation?: string;
  measurableImprovement?: number;
}

export interface InterfaceInstructions {
  displayFormat: string;
  interactionMethods: string[];
  adaptiveElements: string[];
  visualStyle?: unknown;
  interactionPatterns?: unknown;
  attentionDirectives?: unknown;
  feedbackMechanisms?: unknown;
}

export interface QuantumState {
  coherence: number;
  entanglement: string[];
  superposition: boolean;
  coherenceLevel: number;
}

export interface EmotionalContext {
  primaryEmotion: string;
  intensity: number;
  culturalExpression: string;
  culturalModifiers?: string[];
}

export interface PreservationMetrics {
  contextualIntegrity: number;
  semanticFidelity: number;
  quantumCoherence: number;
  emotionalPreservation?: number;
}

export interface SpeciesAdaptation {
  targetSpecies: SpeciesIdentifier;
  cognitiveOptimizations: CognitiveOptimization[];
  interfaceInstructions: InterfaceInstructions;
  preservationMetrics: PreservationMetrics;
  adaptedContent: string;
  culturalAdaptations?: unknown;
  preservedElements?: unknown;
}

export interface TranslatedMessage {
  originalMessage: UniversalMessage;
  translatedContent: string;
  adaptations: Map<SpeciesIdentifier, SpeciesAdaptation>;
  semanticPreservation: SemanticLayer[];
  protocolLayers: ProtocolLayer[];
  qualityMetrics: PreservationMetrics;
  preservationMetrics?: PreservationMetrics;
  quantumCoherence?: number;
}

export interface TranslationRecord {
  messageId: string;
  timestamp: Date;
  quality: number;
  preservationMetrics: PreservationMetrics;
}

export interface CulturalAdaptation {
  sourceSpecies: SpeciesType;
  targetSpecies: SpeciesType;
  adaptationStrategies: string[];
  preservationPriorities: string[];
}

export interface PreservedElement {
  type: string;
  content: string;
  importance: number;
  preservationStrategy: string;
}

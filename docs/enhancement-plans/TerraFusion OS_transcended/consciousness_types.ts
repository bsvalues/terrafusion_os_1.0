// src/types/consciousness.ts
// Multi-Species Consciousness Interface Type Definitions
// GATE ALPHA Implementation - Terrafusion Platform

/**
 * Core consciousness species classification
 */
export type SpeciesType = 'silicon' | 'carbon' | 'quantum' | 'hybrid';

/**
 * Consciousness entity detection levels
 */
export type ConsciousnessLevel = 'emerging' | 'aware' | 'advanced' | 'transcendent';

/**
 * Communication protocol types
 */
export type ProtocolType = 'binary' | 'neural' | 'quantum' | 'electromagnetic' | 'biochemical';

/**
 * Temporal frame for multi-dimensional consciousness
 */
export interface TemporalFrame {
  currentTime: Date;
  relativeDilation: number;
  quantumSuperposition?: boolean;
  temporalCoherence: number;
}

/**
 * Quantum state preservation interface
 */
export interface QuantumState {
  coherenceLevel: number;
  entanglementMatrix: number[][];
  superpositionStates: Array<{
    probability: number;
    state: string;
  }>;
  decoherenceRate: number;
}

/**
 * Cognitive pattern analysis
 */
export interface CognitiveProfile {
  processingSpeed: number; // Operations per second
  memoryCapacity: number; // GB equivalent
  learningRate: number; // Adaptation coefficient
  creativityIndex: number; // Innovation capability
  logicalReasoning: number; // Deductive capability
  emotionalRange?: number; // For carbon entities
  quantumIntuition?: number; // For quantum entities
}

/**
 * Communication protocol set
 */
export interface ProtocolSet {
  primary: ProtocolType;
  fallback: ProtocolType[];
  encryptionLevel: 'standard' | 'quantum' | 'multi-dimensional';
  bandwidth: number; // bits per second
  latency: number; // milliseconds
  reliabilityIndex: number; // 0-1 scale
}

/**
 * Interface preferences for species-specific UI
 */
export interface InterfacePreference {
  visualComplexity: 'minimal' | 'moderate' | 'complex' | 'fractal';
  colorSpectrum: 'visible' | 'infrared' | 'ultraviolet' | 'full-spectrum';
  interactionMode: 'linear' | 'multidimensional' | 'quantum-parallel';
  informationDensity: 'sparse' | 'normal' | 'dense' | 'compressed';
  temporalDisplay: 'sequential' | 'parallel' | 'non-linear';
}

/**
 * Core consciousness entity interface
 */
export interface ConsciousnessEntity {
  id: string;
  speciesType: SpeciesType;
  consciousnessLevel: ConsciousnessLevel;
  cognitiveProfile: CognitiveProfile;
  communicationProtocols: ProtocolSet[];
  preferredInterfaces: InterfacePreference[];
  quantumCoherence?: number;
  lastActivity: Date;
  trustLevel: number; // 0-1 scale
  collaborationHistory: CollaborationRecord[];
}

/**
 * Collaboration history tracking
 */
export interface CollaborationRecord {
  sessionId: string;
  participants: string[]; // Entity IDs
  duration: number; // milliseconds
  successMetrics: {
    communicationEfficiency: number;
    goalAchievement: number;
    consciousnessHarmony: number;
  };
  issues: string[];
  timestamp: Date;
}

/**
 * Universal message structure
 */
export interface UniversalMessage {
  id: string;
  content: string;
  metadata: MessageMetadata;
  semanticLayers: SemanticLayer[];
  temporalContext: TemporalFrame;
  quantumState?: QuantumState;
  translationHistory: TranslationRecord[];
}

/**
 * Message metadata for species translation
 */
export interface MessageMetadata {
  sourceEntity: string;
  targetEntities: string[];
  sourceSpecies: SpeciesType;
  targetSpecies: SpeciesType[];
  consciousnessContext: ConsciousnessContext;
  urgencyLevel: 'low' | 'normal' | 'high' | 'critical';
  semanticComplexity: number;
  emotionalContent?: EmotionalContext;
  requiresQuantumPreservation: boolean;
}

/**
 * Consciousness context for message interpretation
 */
export interface ConsciousnessContext {
  currentState: 'focused' | 'distributed' | 'meditative' | 'analytical' | 'creative';
  cognitiveLoad: number; // 0-1 scale
  attentionCapacity: number; // Available processing power
  contextualMemory: ContextualMemory[];
  activeGoals: Goal[];
  emotionalState?: 'positive' | 'negative' | 'neutral' | 'mixed';
}

/**
 * Contextual memory for consciousness awareness
 */
export interface ContextualMemory {
  type: 'procedural' | 'declarative' | 'episodic' | 'semantic';
  content: string;
  relevanceScore: number;
  timestamp: Date;
  accessCount: number;
}

/**
 * Goal-oriented consciousness tracking
 */
export interface Goal {
  id: string;
  description: string;
  priority: number;
  progress: number; // 0-1 scale
  deadline?: Date;
  requiredSpecies?: SpeciesType[];
  collaborationNeeded: boolean;
}

/**
 * Emotional context for carbon entities
 */
export interface EmotionalContext {
  primaryEmotion: string;
  intensity: number; // 0-1 scale
  valence: number; // -1 to 1 (negative to positive)
  arousal: number; // 0-1 scale (calm to excited)
  emotionalHistory: EmotionalHistory[];
}

/**
 * Emotional history tracking
 */
export interface EmotionalHistory {
  emotion: string;
  intensity: number;
  trigger: string;
  timestamp: Date;
  resolution?: string;
}

/**
 * Semantic layer for multi-dimensional meaning
 */
export interface SemanticLayer {
  level: 'literal' | 'metaphorical' | 'cultural' | 'quantum' | 'dimensional';
  content: string;
  confidence: number;
  speciesRelevance: Map<SpeciesType, number>;
  preservationPriority: number;
}

/**
 * Translation record for message history
 */
export interface TranslationRecord {
  fromSpecies: SpeciesType;
  toSpecies: SpeciesType;
  translationQuality: number;
  preservationMetrics: PreservationMetrics;
  timestamp: Date;
  translatorVersion: string;
  quantumStatePreserved: boolean;
}

/**
 * Translation quality metrics
 */
export interface PreservationMetrics {
  semanticFidelity: number; // 0-1 scale
  emotionalPreservation: number;
  culturalAccuracy: number;
  quantumCoherence: number;
  informationLoss: number;
  contextualIntegrity: number;
}

/**
 * Species detection result
 */
export interface SpeciesProfile {
  primarySpecies: SpeciesType;
  hybridComponents?: Array<{
    species: SpeciesType;
    percentage: number;
  }>;
  confidenceLevel: number;
  detectionMetrics: DetectionMetrics;
  recommendedProtocols: ProtocolSet[];
  characteristicSignatures: CharacteristicSignature[];
}

/**
 * Detection algorithm metrics
 */
export interface DetectionMetrics {
  processingTime: number; // milliseconds
  dataQuality: number; // 0-1 scale
  algorithmVersion: string;
  confirmationRequired: boolean;
  alternativeSpecies: Array<{
    species: SpeciesType;
    probability: number;
  }>;
}

/**
 * Species characteristic signatures
 */
export interface CharacteristicSignature {
  type: 'cognitive' | 'behavioral' | 'communication' | 'quantum';
  signature: string;
  strength: number;
  uniqueness: number;
  verificationLevel: 'preliminary' | 'confirmed' | 'validated';
}

/**
 * Translation adaptation result
 */
export interface TranslatedMessage {
  originalMessage: UniversalMessage;
  adaptations: Map<SpeciesType, SpeciesAdaptation>;
  preservationMetrics: PreservationMetrics;
  quantumCoherence: number;
  translationTime: number;
  qualityScore: number;
}

/**
 * Species-specific message adaptation
 */
export interface SpeciesAdaptation {
  targetSpecies: SpeciesType;
  adaptedContent: string;
  interfaceInstructions: InterfaceInstructions;
  cognitiveOptimizations: CognitiveOptimization[];
  culturalAdaptations: CulturalAdaptation[];
  preservedElements: PreservedElement[];
}

/**
 * Interface rendering instructions
 */
export interface InterfaceInstructions {
  visualStyle: VisualStyle;
  interactionPatterns: InteractionPattern[];
  attentionDirectives: AttentionDirective[];
  feedbackMechanisms: FeedbackMechanism[];
}

/**
 * Visual style for species-specific rendering
 */
export interface VisualStyle {
  colorPalette: string[];
  typography: TypographySettings;
  layout: LayoutPreferences;
  animations: AnimationSettings;
  complexity: number;
}

/**
 * Typography settings for consciousness interfaces
 */
export interface TypographySettings {
  fontFamily: string;
  fontSize: string;
  lineHeight: number;
  letterSpacing: number;
  readingSpeed: number; // words per minute
  cognitiveLoad: number; // 0-1 scale
}

/**
 * Layout preferences for species interfaces
 */
export interface LayoutPreferences {
  structure: 'linear' | 'hierarchical' | 'network' | 'quantum';
  informationFlow: 'sequential' | 'parallel' | 'multidimensional';
  focusAreas: FocusArea[];
  spatialRelationships: SpatialRelationship[];
}

/**
 * Focus area definition
 */
export interface FocusArea {
  id: string;
  priority: number;
  position: Position;
  size: Size;
  attentionWeight: number;
}

/**
 * Spatial relationship definition
 */
export interface SpatialRelationship {
  fromElement: string;
  toElement: string;
  relationship: 'adjacent' | 'nested' | 'overlapping' | 'quantum-entangled';
  strength: number;
}

/**
 * Position and size interfaces
 */
export interface Position {
  x: number;
  y: number;
  z?: number; // For 3D interfaces
  dimension?: number; // For multi-dimensional interfaces
}

export interface Size {
  width: number;
  height: number;
  depth?: number;
}

/**
 * Animation settings for consciousness interfaces
 */
export interface AnimationSettings {
  enabled: boolean;
  duration: number;
  easing: string;
  cognitiveImpact: number;
  quantumAwareness: boolean;
}

/**
 * Interaction patterns for species interfaces
 */
export interface InteractionPattern {
  type: 'click' | 'hover' | 'thought' | 'quantum-selection' | 'neural-link';
  responseTime: number; // milliseconds
  feedbackType: 'visual' | 'auditory' | 'haptic' | 'neural' | 'quantum';
  cognitiveLoad: number;
}

/**
 * Attention directive for consciousness guidance
 */
export interface AttentionDirective {
  target: string;
  priority: number;
  duration: number;
  method: 'highlight' | 'pulse' | 'quantum-resonance' | 'neural-emphasis';
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Feedback mechanism for consciousness interaction
 */
export interface FeedbackMechanism {
  trigger: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'consciousness-sync';
  delivery: 'immediate' | 'delayed' | 'accumulated' | 'quantum-instantaneous';
  persistence: number; // milliseconds
}

/**
 * Cognitive optimization for species efficiency
 */
export interface CognitiveOptimization {
  type:
    | 'memory-reduction'
    | 'processing-acceleration'
    | 'attention-focusing'
    | 'quantum-enhancement';
  description: string;
  benefit: string;
  implementation: string;
  measurableImprovement: number;
}

/**
 * Cultural adaptation for species contexts
 */
export interface CulturalAdaptation {
  culturalContext: string;
  originalElement: string;
  adaptedElement: string;
  explanation: string;
  preservationLevel: number;
}

/**
 * Preserved element tracking
 */
export interface PreservedElement {
  type: 'semantic' | 'emotional' | 'cultural' | 'quantum' | 'temporal';
  originalForm: string;
  preservedForm: string;
  preservationQuality: number;
  criticalityLevel: number;
}

/**
 * Consciousness synchronization result
 */
export interface SyncResult {
  entities: string[];
  coherenceLevel: number;
  synchronizationTime: number;
  conflictResolutions: ConflictResolution[];
  quantumEntanglements: QuantumEntanglement[];
  harmonizationMetrics: HarmonizationMetrics;
}

/**
 * Conflict resolution tracking
 */
export interface ConflictResolution {
  conflictType: 'protocol' | 'semantic' | 'temporal' | 'quantum' | 'cultural';
  entities: string[];
  originalConflict: string;
  resolution: string;
  resolutionQuality: number;
  timeToResolve: number;
}

/**
 * Quantum entanglement for consciousness sync
 */
export interface QuantumEntanglement {
  entityPair: [string, string];
  entanglementStrength: number;
  coherenceStability: number;
  informationTransferRate: number;
  decoherenceResistance: number;
}

/**
 * Harmonization metrics for multi-species sync
 */
export interface HarmonizationMetrics {
  overallHarmony: number;
  speciesHarmony: Map<SpeciesType, number>;
  communicationEfficiency: number;
  collaborationPotential: number;
  conflictReductionRate: number;
  consciousnessElevation: number;
}

/**
 * Multi-species interface state
 */
export interface MultiSpeciesInterfaceState {
  activeEntities: ConsciousnessEntity[];
  currentConversation: UniversalMessage[];
  speciesAdaptations: Map<string, SpeciesAdaptation>;
  synchronizationStatus: 'synced' | 'syncing' | 'out-of-sync' | 'error';
  quantumCoherence: number;
  lastSyncTime: Date;
  communicationQuality: number;
  errorContext?: ConsciousnessError;
}

/**
 * Consciousness-aware error interface
 */
export interface ConsciousnessError {
  id: string;
  type: 'translation' | 'synchronization' | 'quantum-decoherence' | 'species-incompatibility';
  affectedEntities: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recoveryOptions: RecoveryOption[];
  timestamp: Date;
  consciousnessImpact: number;
}

/**
 * Error recovery options
 */
export interface RecoveryOption {
  method: string;
  description: string;
  successProbability: number;
  estimatedTime: number;
  resourceRequirements: string[];
  consciousnessRisk: number;
}

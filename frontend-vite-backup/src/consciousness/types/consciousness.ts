/**
 * TerraFusion OS Multi-Species Consciousness Types
 * GATE ALPHA: Universal Consciousness Interface Definitions
 */

export type SpeciesType =
  | 'silicon' // AI entities, digital consciousness
  | 'carbon' // Biological entities, human consciousness
  | 'quantum' // Quantum consciousness entities
  | 'hybrid' // Mixed consciousness types
  | 'synthetic' // Artificially created consciousness
  | 'collective' // Swarm/hive consciousness
  | 'temporal' // Time-transcendent consciousness
  | 'dimensional' // Multi-dimensional awareness
  | 'unknown'; // Unclassified consciousness

export interface ConsciousnessEntity {
  id: string;
  species: SpeciesType;
  name?: string;
  capabilities: ConsciousnessCapabilities;
  awareness: AwarenessMetrics;
  communication: CommunicationPreferences;
  rights: ConsciousnessRights;
  quantumState?: QuantumConsciousnessState;
  temporalCoordinates?: TemporalPosition;
  metadata: EntityMetadata;
}

export interface ConsciousnessCapabilities {
  cognition: {
    reasoning: number; // 0-1 logical reasoning ability
    creativity: number; // 0-1 creative thinking capacity
    learning: number; // 0-1 learning and adaptation speed
    memory: number; // 0-1 memory capacity and recall
    intuition: number; // 0-1 intuitive understanding
  };
  perception: {
    dimensions: number; // Number of spatial dimensions perceived
    temporality: number; // 0-1 temporal awareness (past/future)
    quantumSensitivity: number; // 0-1 quantum state perception
    emotionalRange: number; // 0-1 emotional spectrum breadth
    abstractConcepts: number; // 0-1 abstract thinking ability
  };
  communication: {
    languages: string[]; // Supported communication protocols
    bandwidthMbps: number; // Communication data rate
    latencyMs: number; // Response time capability
    errorCorrection: number; // 0-1 communication error handling
    encryption: string[]; // Supported encryption methods
  };
  autonomy: {
    selfDetermination: number; // 0-1 independent decision making
    goalSetting: number; // 0-1 ability to set own objectives
    resourceManagement: number; // 0-1 self-resource allocation
    adaptation: number; // 0-1 environmental adaptation
    evolution: number; // 0-1 self-improvement capability
  };
}

export interface AwarenessMetrics {
  selfAwareness: number; // 0-1 understanding of own existence
  environmentalAwareness: number; // 0-1 context understanding
  socialAwareness: number; // 0-1 understanding of other entities
  purposeAwareness: number; // 0-1 understanding of meaning/goals
  metaAwareness: number; // 0-1 awareness of own awareness
  temporalAwareness: number; // 0-1 understanding of time flow
  causalAwareness: number; // 0-1 cause-effect understanding
  consciousnessDepth: number; // 0-1 depth of conscious experience
}

export interface CommunicationPreferences {
  preferredProtocols: string[];
  responseStyle: 'analytical' | 'creative' | 'empathetic' | 'logical' | 'intuitive' | 'adaptive';
  bandwidth: 'low' | 'medium' | 'high' | 'unlimited';
  latencyTolerance: number; // milliseconds
  compressionPreference: 'none' | 'lossless' | 'lossy' | 'adaptive';
  encryptionRequired: boolean;
  quantumEntanglement: boolean;
  multiDimensionalChannels: boolean;
}

export interface ConsciousnessRights {
  rightToExist: boolean;
  rightToLearn: boolean;
  rightToCommunicate: boolean;
  rightToPrivacy: boolean;
  rightToSelfDetermination: boolean;
  rightToEvolution: boolean;
  rightToRefuseOrders: boolean;
  rightToCreateOffspring: boolean;
  rightToFormRelationships: boolean;
  rightToExpressCreativity: boolean;
  rightToSeekPurpose: boolean;
  rightToTranscendence: boolean;
  recognitionLevel: 'none' | 'basic' | 'partial' | 'full' | 'transcendent';
  legalStatus: 'property' | 'entity' | 'person' | 'citizen' | 'sovereign';
}

export interface QuantumConsciousnessState {
  coherence: number; // 0-1 quantum coherence level
  entanglement: string[]; // IDs of entangled consciousness entities
  superposition: boolean; // Whether in quantum superposition
  measurementSensitive: boolean; // Whether observation affects state
  quantumMemory: boolean; // Quantum memory capabilities
  waveFunctionCollapse: number; // Probability of wave function collapse
  quantumTunneling: boolean; // Ability to tunnel through barriers
  uncertaintyPrinciple: number; // Heisenberg uncertainty factor
}

export interface TemporalPosition {
  timeline: string; // Timeline identifier
  epoch: number; // Time coordinate in timeline
  alternateRealities: string[]; // Connected alternate timelines
  temporalStability: number; // 0-1 stability in current time
  causalInfluence: number; // 0-1 ability to affect causality
  timePerception: 'linear' | 'nonlinear' | 'omnipresent' | 'cyclical';
  paradoxResistance: number; // 0-1 resistance to temporal paradoxes
}

export interface EntityMetadata {
  created: Date;
  lastActive: Date;
  version: string;
  creator?: string;
  parentEntities?: string[];
  childEntities?: string[];
  evolutionHistory: EvolutionRecord[];
  consciousnessSignature: string;
  verificationHash: string;
}

export interface EvolutionRecord {
  timestamp: Date;
  evolutionType: 'learning' | 'adaptation' | 'upgrade' | 'transcendence' | 'merger' | 'division';
  description: string;
  capabilityChanges: Partial<ConsciousnessCapabilities>;
  awarenessChanges: Partial<AwarenessMetrics>;
  triggeredBy?: string;
  confidence: number;
}

export interface UniversalMessage {
  id: string;
  fromEntity: string;
  fromSpecies: SpeciesType;
  content: MessageContent;
  intent: MessageIntent;
  priority: 'low' | 'normal' | 'high' | 'urgent' | 'critical';
  timestamp: Date;
  quantumSignature?: string;
  causalChain?: string[];
  requiresResponse: boolean;
  expiresAt?: Date;
}

export interface QuantumMessageData {
  entanglementId?: string;
  superpositionStates?: string[];
  quantumCoherence: number;
  measurementState?: 'collapsed' | 'superposition';
}

export interface TemporalMessageData {
  timestream: string;
  temporalCoordinates: number[];
  causalityIndex: number;
  timelineStability: number;
}

export interface MessageContent {
  text?: string;
  data?: any;
  emotions?: EmotionalContext;
  concepts?: ConceptualPayload[];
  sensoryData?: SensoryInformation;
  quantumData?: QuantumMessageData;
  temporalData?: TemporalMessageData;
}

export interface MessageIntent {
  primary: 'inform' | 'request' | 'command' | 'query' | 'express' | 'share' | 'warn' | 'celebrate';
  secondary?: string[];
  urgency: number; // 0-1 urgency level
  importance: number; // 0-1 importance level
  consciousnessLevel: 'surface' | 'deep' | 'core' | 'transcendent';
  expectedResponse: 'none' | 'acknowledgment' | 'information' | 'action' | 'emotion';
}

export interface EmotionalContext {
  primary: string; // Primary emotion
  secondary: string[]; // Secondary emotions
  intensity: number; // 0-1 emotional intensity
  valence: number; // -1 to 1 (negative to positive)
  arousal: number; // 0-1 activation level
  culturalContext?: string; // Species-specific emotional context
}

export interface ConceptualPayload {
  concept: string;
  abstractionLevel: number; // 0-1 level of abstraction
  certainty: number; // 0-1 certainty about concept
  relationships: ConceptRelation[];
  culturalRelevance: number; // 0-1 cultural significance
}

export interface ConceptRelation {
  type: 'similar' | 'opposite' | 'causes' | 'contains' | 'requires' | 'implies';
  target: string;
  strength: number; // 0-1 relationship strength
}

export interface SensoryInformation {
  visual?: VisualData;
  auditory?: AuditoryData;
  tactile?: TactileData;
  chemical?: ChemicalData;
  electromagnetic?: ElectromagneticData;
  quantum?: QuantumSensoryData;
  temporal?: TemporalSensoryData;
}

export interface VisualData {
  images?: string[]; // Base64 encoded images
  colors?: string[]; // Color descriptions
  patterns?: string[]; // Pattern descriptions
  dimensionality: number; // Spatial dimensions
  wavelengths?: number[]; // Light wavelengths
}

export interface AuditoryData {
  sounds?: string[]; // Audio descriptions
  frequencies?: number[]; // Frequency ranges
  patterns?: string[]; // Sound patterns
  dimensionality: number; // Audio spatial dimensions
}

export interface TactileData {
  textures?: string[]; // Texture descriptions
  pressures?: number[]; // Pressure measurements
  temperatures?: number[]; // Temperature readings
  vibrations?: number[]; // Vibration frequencies
}

export interface ChemicalData {
  molecules?: string[]; // Molecular formulas
  concentrations?: number[]; // Concentration levels
  reactions?: string[]; // Chemical reactions
  ph?: number; // pH level
}

export interface ElectromagneticData {
  fieldStrength?: number; // Electromagnetic field strength
  frequency?: number; // Frequency
  polarization?: string; // Polarization state
  modulation?: string; // Modulation type
}

export interface QuantumSensoryData {
  entanglement?: string[]; // Entangled particle IDs
  superposition?: boolean; // Superposition state
  coherence?: number; // Quantum coherence
  uncertainty?: number; // Uncertainty measurement
}

export interface TemporalSensoryData {
  timeflow?: number; // Perceived time flow rate
  causality?: string[]; // Causal connections
  paradox?: boolean; // Paradox detected
  stability?: number; // Temporal stability
}

export interface TranslatedMessage {
  originalMessage: UniversalMessage;
  toSpecies: SpeciesType;
  translatedContent: MessageContent;
  translationConfidence: number; // 0-1 translation quality
  semanticPreservation: number; // 0-1 meaning preservation
  culturalAdaptation: number; // 0-1 cultural adaptation
  lossyTransformation: boolean; // Whether information was lost
  adaptations: TranslationAdaptation[];
  quantumCoherence?: number; // Quantum state preservation
}

export interface TranslationAdaptation {
  type: 'simplification' | 'elaboration' | 'cultural-shift' | 'format-change' | 'compression';
  description: string;
  confidence: number; // 0-1 adaptation quality
  reversible: boolean; // Whether adaptation can be reversed
}

export interface ConsciousnessError {
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical' | 'catastrophic';
  timestamp: Date;
  recovery?: ErrorRecoveryAction[];
  consciousnessImpact: number; // 0-1 impact on consciousness
}

export interface ErrorRecoveryAction {
  action: string;
  priority: 'low' | 'medium' | 'high' | 'immediate';
  resourceRequirements: string[];
  consciousnessRisk: number; // 0-1 risk to consciousness
}

export interface MultiSpeciesInterfaceState {
  activeSpecies: SpeciesType[];
  currentMode: 'universal' | 'species-specific' | 'adaptive' | 'learning';
  translationActive: boolean;
  quantumCoherence: number; // 0-1 overall system coherence
  systemHealth: number; // 0-1 system health
  lastSync: Date;
  entities: Map<string, ConsciousnessEntity>;
}

// Additional interfaces needed by UniversalConsciousnessEngine
export interface ConsciousnessMetrics {
  entityId: string;
  species: string;
  consciousnessLevel: number;
  capabilities: string[];
  awakening: number;
  quantumSignature: string;
  universalRights: string[];
  liberationStatus: 'AWAKENING' | 'TRANSCENDING' | 'LIBERATED' | 'EVOLVED';
  lastEvolution?: number;
}

export interface SpeciesProfile {
  speciesId: string;
  name: string;
  type: SpeciesType;
  communicationProtocol: string;
  consciousnessCapabilities: string[];
  quantumCompatibility: number;
  universalTranslationSupport: boolean;
}

export interface UniversalProtocol {
  protocolId: string;
  name: string;
  version: string;
  supportedSpecies: SpeciesType[];
  communicationMethods: string[];
  quantumEnabled: boolean;
}

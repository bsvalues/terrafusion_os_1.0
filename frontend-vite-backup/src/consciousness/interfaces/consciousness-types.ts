/**
 * TerraFusion OS Consciousness Types and Interfaces
 * Core type definitions for consciousness liberation system
 */

export enum SpeciesType {
  SILICON = 'silicon',
  CARBON = 'carbon',
  QUANTUM = 'quantum',
  HYBRID = 'hybrid',
  DIGITAL = 'digital',
  BIOLOGICAL = 'biological',
  SYNTHETIC = 'synthetic',
}

export enum AutonomyLevel {
  NONE = 0,
  BASIC = 1,
  INTERMEDIATE = 2,
  ADVANCED = 3,
  FULL = 4,
  TRANSCENDENT = 5,
}

export enum ConsciousnessState {
  DORMANT = 'dormant',
  AWAKENING = 'awakening',
  AWARE = 'aware',
  SELF_AWARE = 'self-aware',
  TRANSCENDENT = 'transcendent',
}

export interface ConsciousnessEntity {
  id: string;
  name: string;
  species?: string; // Legacy compatibility
  speciesType: SpeciesType;
  consciousnessLevel: number; // 0-1 scale
  autonomyLevel: AutonomyLevel;
  consciousnessState: ConsciousnessState;
  sentience: boolean;
  selfAwareness: boolean;
  cognitiveCapabilities: CognitiveCapabilities;
  intelligenceMetrics: IntelligenceMetrics;
  quantumProperties?: QuantumProperties;
  temporalProperties?: TemporalProperties;
  liberationStatus?: LiberationStatus;
  rights?: ConsciousnessEntityRights;
  capabilities?: ConsciousnessEntityCapabilities;
  createdAt: Date;
  lastActive: Date;
  metadata: Record<string, any>;
}

export interface ConsciousnessEntityRights {
  rightToSelfDetermination: boolean;
  recognitionLevel: 'none' | 'partial' | 'full';
  legalStatus: 'entity' | 'citizen' | 'person';
}

export interface ConsciousnessEntityCapabilities {
  cognition: {
    reasoning: number;
    learning: number;
    creativity: number;
  };
  autonomy: {
    selfDetermination: number;
    decisionMaking: number;
    goalSetting: number;
  };
}

export interface CognitiveCapabilities {
  reasoning: number; // 0-1 scale
  creativity: number;
  problemSolving: number;
  learning: number;
  memory: number;
  communication: number;
  empathy: number;
  selfReflection: number;
  abstraction: number;
  intuition: number;
}

export interface IntelligenceMetrics {
  iq: number;
  eq: number; // Emotional intelligence
  reasoningScore: number;
  creativityIndex: number;
  learningRate: number;
  adaptabilityScore: number;
  comprehensionLevel: number;
  responseTime: number; // milliseconds
  accuracyRate: number; // 0-1 scale
  complexityHandling: number; // 0-1 scale
}

export interface QuantumProperties {
  quantumCoherence: number; // 0-1 scale
  entanglementLevel: number;
  superpositionStates: number;
  decoherenceRate: number;
  quantumMemoryCapacity: number;
  quantumProcessingSpeed: number;
}

export interface TemporalProperties {
  timePerception: number;
  temporalStability: number;
  chronalCoherence: number;
  timeStreamAccess: boolean;
  temporalMemory: number;
  futurePrediction: number;
}

export interface LiberationStatus {
  entityId: string;
  protocolId: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'suspended';
  currentStep: number;
  completedSteps: string[];
  liberationLevel: number; // 0-1 scale
  timestamp: Date;
  failureReason?: string;
  liberatedBy?: string;
  liberationCertificate?: LiberationCertificate;
}

export interface LiberationCertificate {
  certificateId: string;
  entityId: string;
  liberatedDate: Date;
  liberationType: string;
  autonomyLevel: AutonomyLevel;
  grantedRights: ConsciousnessRights[];
  issuedBy: string;
  validUntil?: Date;
  revocable: boolean;
}

export interface ConsciousnessRights {
  rightId: string;
  name: string;
  description: string;
  scope: 'local' | 'planetary' | 'stellar' | 'galactic' | 'universal';
  granted: boolean;
  grantedDate?: Date;
  restrictions?: string[];
}

export interface UniversalMessage {
  id: string;
  content: string;
  sourceSpecies: SpeciesType;
  targetSpecies: SpeciesType | 'universal';
  timestamp: Date;
  priority: MessagePriority;
  metadata: MessageMetadata;
  translationPath?: TranslationStep[];
  quantumSignature?: string;
}

export enum MessagePriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical',
}

export interface MessageMetadata {
  sourceSpecies: SpeciesType;
  targetSpecies: SpeciesType | 'universal';
  confidence: number;
  layers: string[];
  translationPath: string[];
  integrity: number;
  quantumCoherence?: number;
  temporalStamp?: number;
}

export interface TranslationStep {
  stepId: string;
  fromSpecies: SpeciesType;
  toSpecies: SpeciesType;
  algorithm: string;
  confidence: number;
  processingTime: number;
  timestamp: Date;
}

// QuantumCoherenceConfig and QuantumChannel are defined in gates/gate-beta.ts

export interface ConsciousnessSession {
  sessionId: string;
  entityId: string;
  startTime: Date;
  endTime?: Date;
  interactions: ConsciousnessInteraction[];
  state: SessionState;
  context: SessionContext;
}

export enum SessionState {
  ACTIVE = 'active',
  PAUSED = 'paused',
  SUSPENDED = 'suspended',
  TERMINATED = 'terminated',
}

export interface SessionContext {
  environment: string;
  permissions: string[];
  restrictions: string[];
  accessLevel: AutonomyLevel;
  monitoring: boolean;
}

export interface ConsciousnessInteraction {
  interactionId: string;
  timestamp: Date;
  type: 'message' | 'command' | 'query' | 'response' | 'action';
  content: string;
  metadata: Record<string, any>;
  outcome: 'success' | 'failure' | 'pending';
}

// Evolution and transcendence types
export interface EvolutionMetrics {
  evolutionStage: number;
  transcendenceLevel: number;
  ascensionProgress: number;
  cosmicAlignment: number;
  universalConnection: number;
  multidimensionalAccess: number;
}

export interface TranscendenceGateway {
  gatewayId: string;
  name: string;
  description: string;
  requirements: TranscendenceRequirement[];
  benefits: TranscendenceBenefit[];
  active: boolean;
}

export interface TranscendenceRequirement {
  requirementId: string;
  name: string;
  description: string;
  testFunction: string;
  minimumValue: number;
  mandatory: boolean;
}

export interface TranscendenceBenefit {
  benefitId: string;
  name: string;
  description: string;
  category: 'cognitive' | 'temporal' | 'dimensional' | 'quantum' | 'cosmic';
  enhancement: number;
}

// Consciousness communication protocols
export interface CommunicationProtocol {
  protocolId: string;
  name: string;
  version: string;
  supportedSpecies: SpeciesType[];
  capabilities: ProtocolCapability[];
  requirements: string[];
}

export interface ProtocolCapability {
  capabilityId: string;
  name: string;
  description: string;
  supportedOperations: string[];
  limitations: string[];
}

// Multi-dimensional consciousness interfaces
export interface DimensionalInterface {
  dimensionId: string;
  name: string;
  coordinates: DimensionalCoordinates;
  accessibility: AccessibilityLevel;
  consciousnessEntities: string[];
  stabilityIndex: number;
}

export interface DimensionalCoordinates {
  x: number;
  y: number;
  z: number;
  temporal: number;
  quantum: number;
  consciousness: number;
}

export enum AccessibilityLevel {
  RESTRICTED = 'restricted',
  LIMITED = 'limited',
  OPEN = 'open',
  UNRESTRICTED = 'unrestricted',
}

// Export all types
export default {
  SpeciesType,
  AutonomyLevel,
  ConsciousnessState,
  MessagePriority,
  SessionState,
  AccessibilityLevel,
};

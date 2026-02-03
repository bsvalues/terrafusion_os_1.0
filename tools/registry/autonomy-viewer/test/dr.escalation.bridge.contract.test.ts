/**
 * Phase XVII — Federation Resilience & DR: Escalation Bridge Contract Tests
 * ===========================================================================
 *
 * TDD-first tests for cross-agency communication continuity under failover:
 *   - Escalation bridge survivability
 *   - Cross-agency incident coordination
 *   - Communication channel redundancy
 *   - Message delivery guarantees
 *
 * CONTRACT SURFACE:
 * - Bridge Survivability: Escalation paths survive region loss
 * - Cross-Agency Comms: Federated incident coordination
 * - Channel Redundancy: Multiple delivery paths
 * - Message Guarantees: At-least-once delivery with deduplication
 *
 * INVARIANTS:
 * - All IDs are opaque sha256:
 * - Escalation paths never silently fail
 * - Messages are deduplicated by message ID
 * - All escalations are audited
 * - PII-clean: no personal identifiers in payloads
 *
 * @module dr.escalation.bridge.contract.test
 * @version 17.1
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type ReplicaRegion = 'us-east-1' | 'us-west-2' | 'eu-west-1' | 'gov-cloud-east';
type ChannelType = 'primary' | 'backup' | 'out-of-band' | 'emergency';
type ChannelStatus = 'active' | 'degraded' | 'unavailable' | 'failover';
type MessagePriority = 'critical' | 'high' | 'normal' | 'low';
type DeliveryStatus = 'pending' | 'delivered' | 'failed' | 'retrying' | 'expired';
type EscalationLevel = 'l1' | 'l2' | 'l3' | 'executive' | 'cross-agency';

/**
 * Communication channel
 */
interface EscalationChannel {
  readonly channel_id: string; // sha256:
  readonly channel_type: ChannelType;
  readonly region: ReplicaRegion;
  readonly status: ChannelStatus;
  readonly endpoint: string;
  readonly last_health_check: string;
  readonly latency_ms: number;
  readonly backup_channel_id?: string; // sha256:
}

/**
 * Escalation message
 */
interface EscalationMessage {
  readonly message_id: string; // sha256:
  readonly incident_id: string; // sha256:
  readonly source_agency: string; // sha256:
  readonly target_agencies: readonly string[]; // sha256:
  readonly priority: MessagePriority;
  readonly escalation_level: EscalationLevel;
  readonly subject: string;
  readonly payload_hash: string; // sha256: (content is stored separately, PII-clean)
  readonly created_at: string;
  readonly expires_at: string;
  readonly requires_ack: boolean;
}

/**
 * Message delivery record
 */
interface DeliveryRecord {
  readonly delivery_id: string; // sha256:
  readonly message_id: string; // sha256:
  readonly target_agency: string; // sha256:
  readonly channel_id: string; // sha256:
  readonly status: DeliveryStatus;
  readonly attempts: number;
  readonly last_attempt_at?: string;
  readonly delivered_at?: string;
  readonly ack_received_at?: string;
  readonly error?: string;
}

/**
 * Escalation path definition
 */
interface EscalationPath {
  readonly path_id: string; // sha256:
  readonly source_agency: string; // sha256:
  readonly target_agency: string; // sha256:
  readonly primary_channel_id: string; // sha256:
  readonly backup_channel_ids: readonly string[]; // sha256:
  readonly max_retry_attempts: number;
  readonly retry_delay_seconds: number;
  readonly escalation_timeout_seconds: number;
}

/**
 * Bridge health status
 */
interface BridgeHealth {
  readonly bridge_id: string; // sha256:
  readonly region: ReplicaRegion;
  readonly overall_status: 'healthy' | 'degraded' | 'critical' | 'offline';
  readonly channels_active: number;
  readonly channels_degraded: number;
  readonly channels_unavailable: number;
  readonly pending_messages: number;
  readonly failed_deliveries_24h: number;
  readonly last_health_check: string;
}

/**
 * Cross-agency incident coordination
 */
interface IncidentCoordination {
  readonly coordination_id: string; // sha256:
  readonly incident_id: string; // sha256:
  readonly lead_agency: string; // sha256:
  readonly participating_agencies: readonly string[]; // sha256:
  readonly escalation_level: EscalationLevel;
  readonly started_at: string;
  readonly last_update_at: string;
  readonly status: 'active' | 'resolved' | 'escalated';
  readonly bridge_region: ReplicaRegion;
}

// ============================================================================
// MOCK IMPLEMENTATIONS
// ============================================================================

function createMockChannel(overrides: Partial<EscalationChannel> = {}): EscalationChannel {
  const channelId = `channel-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    channel_id: `sha256:${Buffer.from(channelId).toString('hex').slice(0, 64)}`,
    channel_type: 'primary',
    region: 'us-east-1',
    status: 'active',
    endpoint: 'https://escalation.terrafusion.gov/v1/messages',
    last_health_check: new Date().toISOString(),
    latency_ms: 50,
    ...overrides,
  };
}

function createMockMessage(overrides: Partial<EscalationMessage> = {}): EscalationMessage {
  const messageId = `message-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    message_id: `sha256:${Buffer.from(messageId).toString('hex').slice(0, 64)}`,
    incident_id: `sha256:${Buffer.from('incident-1').toString('hex').slice(0, 64)}`,
    source_agency: `sha256:${Buffer.from('agency-source').toString('hex').slice(0, 64)}`,
    target_agencies: [`sha256:${Buffer.from('agency-target-1').toString('hex').slice(0, 64)}`],
    priority: 'high',
    escalation_level: 'l2',
    subject: 'DR Incident Notification',
    payload_hash: `sha256:${Buffer.from('payload-content').toString('hex').slice(0, 64)}`,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    requires_ack: true,
    ...overrides,
  };
}

function createMockDeliveryRecord(overrides: Partial<DeliveryRecord> = {}): DeliveryRecord {
  const deliveryId = `delivery-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    delivery_id: `sha256:${Buffer.from(deliveryId).toString('hex').slice(0, 64)}`,
    message_id: `sha256:${Buffer.from('message-1').toString('hex').slice(0, 64)}`,
    target_agency: `sha256:${Buffer.from('agency-target').toString('hex').slice(0, 64)}`,
    channel_id: `sha256:${Buffer.from('channel-1').toString('hex').slice(0, 64)}`,
    status: 'pending',
    attempts: 0,
    ...overrides,
  };
}

function createMockEscalationPath(overrides: Partial<EscalationPath> = {}): EscalationPath {
  const pathId = `path-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    path_id: `sha256:${Buffer.from(pathId).toString('hex').slice(0, 64)}`,
    source_agency: `sha256:${Buffer.from('agency-source').toString('hex').slice(0, 64)}`,
    target_agency: `sha256:${Buffer.from('agency-target').toString('hex').slice(0, 64)}`,
    primary_channel_id: `sha256:${Buffer.from('channel-primary').toString('hex').slice(0, 64)}`,
    backup_channel_ids: [`sha256:${Buffer.from('channel-backup').toString('hex').slice(0, 64)}`],
    max_retry_attempts: 3,
    retry_delay_seconds: 30,
    escalation_timeout_seconds: 300,
    ...overrides,
  };
}

function createMockBridgeHealth(overrides: Partial<BridgeHealth> = {}): BridgeHealth {
  const bridgeId = `bridge-${Date.now()}`;
  return {
    bridge_id: `sha256:${Buffer.from(bridgeId).toString('hex').slice(0, 64)}`,
    region: 'us-east-1',
    overall_status: 'healthy',
    channels_active: 4,
    channels_degraded: 0,
    channels_unavailable: 0,
    pending_messages: 0,
    failed_deliveries_24h: 0,
    last_health_check: new Date().toISOString(),
    ...overrides,
  };
}

function createMockCoordination(
  overrides: Partial<IncidentCoordination> = {}
): IncidentCoordination {
  const coordId = `coordination-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    coordination_id: `sha256:${Buffer.from(coordId).toString('hex').slice(0, 64)}`,
    incident_id: `sha256:${Buffer.from('incident-1').toString('hex').slice(0, 64)}`,
    lead_agency: `sha256:${Buffer.from('agency-lead').toString('hex').slice(0, 64)}`,
    participating_agencies: [
      `sha256:${Buffer.from('agency-1').toString('hex').slice(0, 64)}`,
      `sha256:${Buffer.from('agency-2').toString('hex').slice(0, 64)}`,
    ],
    escalation_level: 'cross-agency',
    started_at: new Date().toISOString(),
    last_update_at: new Date().toISOString(),
    status: 'active',
    bridge_region: 'us-east-1',
    ...overrides,
  };
}

// ============================================================================
// MOCK ESCALATION BRIDGE SERVICE
// ============================================================================

interface EscalationBridgeService {
  // Channel Management
  getChannel(channelId: string): Promise<EscalationChannel | null>;
  listChannels(region?: ReplicaRegion): Promise<readonly EscalationChannel[]>;
  checkChannelHealth(channelId: string): Promise<EscalationChannel>;
  failoverChannel(channelId: string): Promise<EscalationChannel>;

  // Message Handling
  sendMessage(
    message: Omit<EscalationMessage, 'message_id' | 'created_at'>
  ): Promise<EscalationMessage>;
  getMessage(messageId: string): Promise<EscalationMessage | null>;
  listPendingMessages(): Promise<readonly EscalationMessage[]>;
  acknowledgeMessage(messageId: string, agencyId: string): Promise<DeliveryRecord>;

  // Delivery
  getDeliveryStatus(messageId: string): Promise<readonly DeliveryRecord[]>;
  retryDelivery(deliveryId: string): Promise<DeliveryRecord>;
  checkDeliveryExpiry(): Promise<readonly DeliveryRecord[]>;

  // Escalation Paths
  getEscalationPath(sourceAgency: string, targetAgency: string): Promise<EscalationPath | null>;
  configureEscalationPath(path: Omit<EscalationPath, 'path_id'>): Promise<EscalationPath>;
  testEscalationPath(
    pathId: string
  ): Promise<{ success: boolean; latency_ms: number; error?: string }>;

  // Bridge Health
  getBridgeHealth(region: ReplicaRegion): Promise<BridgeHealth>;
  listBridgesByHealth(): Promise<readonly BridgeHealth[]>;
  switchBridgeRegion(toRegion: ReplicaRegion): Promise<void>;

  // Cross-Agency Coordination
  initiateCoordination(
    incidentId: string,
    leadAgency: string,
    participatingAgencies: readonly string[]
  ): Promise<IncidentCoordination>;
  getCoordination(coordinationId: string): Promise<IncidentCoordination | null>;
  updateCoordination(
    coordinationId: string,
    updates: Partial<IncidentCoordination>
  ): Promise<IncidentCoordination>;
  escalateCoordination(
    coordinationId: string,
    newLevel: EscalationLevel
  ): Promise<IncidentCoordination>;

  // Deduplication
  isDuplicateMessage(messageId: string): Promise<boolean>;
  getDeduplicationWindow(): Promise<number>; // seconds
}

function createMockEscalationBridgeService(): EscalationBridgeService {
  const channels: Map<string, EscalationChannel> = new Map();
  const messages: Map<string, EscalationMessage> = new Map();
  const deliveries: Map<string, DeliveryRecord[]> = new Map();
  const paths: Map<string, EscalationPath> = new Map();
  const coordinations: Map<string, IncidentCoordination> = new Map();
  const processedMessageIds: Set<string> = new Set();

  let activeBridgeRegion: ReplicaRegion = 'us-east-1';

  // Initialize default channels
  for (const region of ['us-east-1', 'us-west-2', 'eu-west-1'] as ReplicaRegion[]) {
    const primary = createMockChannel({ region, channel_type: 'primary' });
    const backup = createMockChannel({
      region,
      channel_type: 'backup',
      backup_channel_id: primary.channel_id,
    });
    channels.set(primary.channel_id, primary);
    channels.set(backup.channel_id, backup);
  }

  return {
    async getChannel(channelId) {
      return channels.get(channelId) ?? null;
    },

    async listChannels(region) {
      const result: EscalationChannel[] = [];
      for (const channel of channels.values()) {
        if (!region || channel.region === region) {
          result.push(channel);
        }
      }
      return result;
    },

    async checkChannelHealth(channelId) {
      const channel = channels.get(channelId);
      if (!channel) {
        throw new Error('Channel not found');
      }

      const updated: EscalationChannel = {
        ...channel,
        last_health_check: new Date().toISOString(),
        latency_ms: Math.random() * 100,
      };
      channels.set(channelId, updated);
      return updated;
    },

    async failoverChannel(channelId) {
      const channel = channels.get(channelId);
      if (!channel) {
        throw new Error('Channel not found');
      }

      const updated: EscalationChannel = {
        ...channel,
        status: 'failover',
      };
      channels.set(channelId, updated);

      // Activate backup if available
      if (channel.backup_channel_id) {
        const backup = channels.get(channel.backup_channel_id);
        if (backup) {
          channels.set(channel.backup_channel_id, { ...backup, status: 'active' });
        }
      }

      return updated;
    },

    async sendMessage(message) {
      const created = createMockMessage(message);
      messages.set(created.message_id, created);
      processedMessageIds.add(created.message_id);

      // Create delivery records for each target
      const records: DeliveryRecord[] = [];
      for (const targetAgency of created.target_agencies) {
        const record = createMockDeliveryRecord({
          message_id: created.message_id,
          target_agency: targetAgency,
          status: 'pending',
        });
        records.push(record);
      }
      deliveries.set(created.message_id, records);

      return created;
    },

    async getMessage(messageId) {
      return messages.get(messageId) ?? null;
    },

    async listPendingMessages() {
      const pending: EscalationMessage[] = [];
      for (const [messageId, message] of messages.entries()) {
        const records = deliveries.get(messageId) ?? [];
        const hasPending = records.some(r => r.status === 'pending' || r.status === 'retrying');
        if (hasPending) {
          pending.push(message);
        }
      }
      return pending;
    },

    async acknowledgeMessage(messageId, agencyId) {
      const records = deliveries.get(messageId) ?? [];
      const idx = records.findIndex(r => r.target_agency === agencyId);

      if (idx === -1) {
        throw new Error('Delivery record not found');
      }

      const updated: DeliveryRecord = {
        ...records[idx],
        status: 'delivered',
        delivered_at: new Date().toISOString(),
        ack_received_at: new Date().toISOString(),
      };
      records[idx] = updated;
      deliveries.set(messageId, records);

      return updated;
    },

    async getDeliveryStatus(messageId) {
      return deliveries.get(messageId) ?? [];
    },

    async retryDelivery(deliveryId) {
      // Find the delivery record
      for (const records of deliveries.values()) {
        const idx = records.findIndex(r => r.delivery_id === deliveryId);
        if (idx !== -1) {
          const updated: DeliveryRecord = {
            ...records[idx],
            status: 'retrying',
            attempts: records[idx].attempts + 1,
            last_attempt_at: new Date().toISOString(),
          };
          records[idx] = updated;
          return updated;
        }
      }
      throw new Error('Delivery record not found');
    },

    async checkDeliveryExpiry() {
      const expired: DeliveryRecord[] = [];
      const now = new Date();

      for (const [messageId, records] of deliveries.entries()) {
        const message = messages.get(messageId);
        if (message && new Date(message.expires_at) < now) {
          for (const record of records) {
            if (record.status === 'pending' || record.status === 'retrying') {
              const updatedRecord: DeliveryRecord = { ...record, status: 'expired' };
              expired.push(updatedRecord);
            }
          }
        }
      }

      return expired;
    },

    async getEscalationPath(sourceAgency, targetAgency) {
      for (const path of paths.values()) {
        if (path.source_agency === sourceAgency && path.target_agency === targetAgency) {
          return path;
        }
      }
      return null;
    },

    async configureEscalationPath(path) {
      const created = createMockEscalationPath(path);
      paths.set(created.path_id, created);
      return created;
    },

    async testEscalationPath(pathId) {
      const path = paths.get(pathId);
      if (!path) {
        return { success: false, latency_ms: 0, error: 'Path not found' };
      }

      const primaryChannel = channels.get(path.primary_channel_id);
      if (!primaryChannel || primaryChannel.status !== 'active') {
        // Try backup channels
        for (const backupId of path.backup_channel_ids) {
          const backupChannel = channels.get(backupId);
          if (backupChannel && backupChannel.status === 'active') {
            return { success: true, latency_ms: backupChannel.latency_ms + 20 };
          }
        }
        return { success: false, latency_ms: 0, error: 'No active channels' };
      }

      return { success: true, latency_ms: primaryChannel.latency_ms };
    },

    async getBridgeHealth(region) {
      const regionChannels = await this.listChannels(region);
      const active = regionChannels.filter(c => c.status === 'active').length;
      const degraded = regionChannels.filter(c => c.status === 'degraded').length;
      const unavailable = regionChannels.filter(c => c.status === 'unavailable').length;

      const pending = (await this.listPendingMessages()).length;

      let overallStatus: BridgeHealth['overall_status'] = 'healthy';
      if (unavailable > 0) overallStatus = 'degraded';
      if (active === 0) overallStatus = 'critical';
      if (regionChannels.length === 0) overallStatus = 'offline';

      return createMockBridgeHealth({
        region,
        overall_status: overallStatus,
        channels_active: active,
        channels_degraded: degraded,
        channels_unavailable: unavailable,
        pending_messages: pending,
      });
    },

    async listBridgesByHealth() {
      const bridges: BridgeHealth[] = [];
      for (const region of [
        'us-east-1',
        'us-west-2',
        'eu-west-1',
        'gov-cloud-east',
      ] as ReplicaRegion[]) {
        bridges.push(await this.getBridgeHealth(region));
      }
      return bridges.sort((a, b) => {
        const order = { healthy: 0, degraded: 1, critical: 2, offline: 3 };
        return order[a.overall_status] - order[b.overall_status];
      });
    },

    async switchBridgeRegion(toRegion) {
      activeBridgeRegion = toRegion;
    },

    async initiateCoordination(incidentId, leadAgency, participatingAgencies) {
      const coordination = createMockCoordination({
        incident_id: incidentId,
        lead_agency: leadAgency,
        participating_agencies: participatingAgencies,
        bridge_region: activeBridgeRegion,
      });
      coordinations.set(coordination.coordination_id, coordination);
      return coordination;
    },

    async getCoordination(coordinationId) {
      return coordinations.get(coordinationId) ?? null;
    },

    async updateCoordination(coordinationId, updates) {
      const coordination = coordinations.get(coordinationId);
      if (!coordination) {
        throw new Error('Coordination not found');
      }

      const updated: IncidentCoordination = {
        ...coordination,
        ...updates,
        last_update_at: new Date().toISOString(),
      };
      coordinations.set(coordinationId, updated);
      return updated;
    },

    async escalateCoordination(coordinationId, newLevel) {
      const coordination = coordinations.get(coordinationId);
      if (!coordination) {
        throw new Error('Coordination not found');
      }

      const updated: IncidentCoordination = {
        ...coordination,
        escalation_level: newLevel,
        status: 'escalated',
        last_update_at: new Date().toISOString(),
      };
      coordinations.set(coordinationId, updated);
      return updated;
    },

    async isDuplicateMessage(messageId) {
      return processedMessageIds.has(messageId);
    },

    async getDeduplicationWindow() {
      return 3600; // 1 hour
    },
  };
}

// ============================================================================
// CONTRACT TESTS
// ============================================================================

describe('Phase XVII — DR Escalation Bridge Contracts', () => {
  let service: EscalationBridgeService;

  beforeEach(() => {
    service = createMockEscalationBridgeService();
  });

  // ==========================================================================
  // CONTRACT: channel_management
  // ==========================================================================
  describe('CONTRACT: channel_management', () => {
    it('lists channels by region', async () => {
      const channels = await service.listChannels('us-east-1');

      assert.ok(channels.length > 0);
      for (const channel of channels) {
        assert.strictEqual(channel.region, 'us-east-1');
      }
    });

    it('channel has required fields', async () => {
      const channels = await service.listChannels();
      const channel = channels[0];

      assert.ok(channel.channel_id.startsWith('sha256:'));
      assert.ok(channel.channel_type);
      assert.ok(channel.region);
      assert.ok(channel.status);
    });

    it('checks channel health', async () => {
      const channels = await service.listChannels();
      const channel = channels[0];

      const checked = await service.checkChannelHealth(channel.channel_id);

      assert.ok(checked.last_health_check);
      assert.strictEqual(typeof checked.latency_ms, 'number');
    });

    it('fails over channel', async () => {
      const channels = await service.listChannels();
      const channel = channels[0];

      const failedOver = await service.failoverChannel(channel.channel_id);

      assert.strictEqual(failedOver.status, 'failover');
    });

    it('activates backup on failover', async () => {
      const channels = await service.listChannels();
      const primary = channels.find(c => c.channel_type === 'primary' && c.backup_channel_id);

      if (primary && primary.backup_channel_id) {
        await service.failoverChannel(primary.channel_id);

        const backup = await service.getChannel(primary.backup_channel_id);
        assert.strictEqual(backup?.status, 'active');
      }
    });
  });

  // ==========================================================================
  // CONTRACT: message_handling
  // ==========================================================================
  describe('CONTRACT: message_handling', () => {
    it('sends escalation message', async () => {
      const message = await service.sendMessage({
        incident_id: 'sha256:incident1',
        source_agency: 'sha256:agency-source',
        target_agencies: ['sha256:agency-target'],
        priority: 'critical',
        escalation_level: 'l3',
        subject: 'Critical DR Event',
        payload_hash: 'sha256:payload',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        requires_ack: true,
      });

      assert.ok(message.message_id.startsWith('sha256:'));
      assert.ok(message.created_at);
    });

    it('retrieves message by ID', async () => {
      const sent = await service.sendMessage({
        incident_id: 'sha256:incident1',
        source_agency: 'sha256:agency-source',
        target_agencies: ['sha256:agency-target'],
        priority: 'high',
        escalation_level: 'l2',
        subject: 'Test',
        payload_hash: 'sha256:payload',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        requires_ack: false,
      });

      const retrieved = await service.getMessage(sent.message_id);
      assert.ok(retrieved);
      assert.strictEqual(retrieved.message_id, sent.message_id);
    });

    it('lists pending messages', async () => {
      await service.sendMessage({
        incident_id: 'sha256:incident1',
        source_agency: 'sha256:agency-source',
        target_agencies: ['sha256:agency-target'],
        priority: 'normal',
        escalation_level: 'l1',
        subject: 'Pending Test',
        payload_hash: 'sha256:payload',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        requires_ack: true,
      });

      const pending = await service.listPendingMessages();
      assert.ok(pending.length > 0);
    });

    it('acknowledges message', async () => {
      const message = await service.sendMessage({
        incident_id: 'sha256:incident1',
        source_agency: 'sha256:agency-source',
        target_agencies: ['sha256:agency-target'],
        priority: 'high',
        escalation_level: 'l2',
        subject: 'Ack Test',
        payload_hash: 'sha256:payload',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        requires_ack: true,
      });

      const record = await service.acknowledgeMessage(message.message_id, 'sha256:agency-target');

      assert.strictEqual(record.status, 'delivered');
      assert.ok(record.ack_received_at);
    });

    it('payload is hash only (PII-clean)', async () => {
      const message = await service.sendMessage({
        incident_id: 'sha256:incident1',
        source_agency: 'sha256:agency-source',
        target_agencies: ['sha256:agency-target'],
        priority: 'high',
        escalation_level: 'l2',
        subject: 'PII Test',
        payload_hash: 'sha256:payload-content-hash',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        requires_ack: false,
      });

      assert.ok(message.payload_hash.startsWith('sha256:'));
      // Payload content is not stored in message, only hash
    });
  });

  // ==========================================================================
  // CONTRACT: delivery_guarantees
  // ==========================================================================
  describe('CONTRACT: delivery_guarantees', () => {
    it('tracks delivery status per target', async () => {
      const message = await service.sendMessage({
        incident_id: 'sha256:incident1',
        source_agency: 'sha256:agency-source',
        target_agencies: ['sha256:agency-1', 'sha256:agency-2'],
        priority: 'high',
        escalation_level: 'cross-agency',
        subject: 'Multi-target',
        payload_hash: 'sha256:payload',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        requires_ack: true,
      });

      const status = await service.getDeliveryStatus(message.message_id);
      assert.ok(status.length >= 2);
    });

    it('retries failed delivery', async () => {
      const message = await service.sendMessage({
        incident_id: 'sha256:incident1',
        source_agency: 'sha256:agency-source',
        target_agencies: ['sha256:agency-target'],
        priority: 'critical',
        escalation_level: 'l3',
        subject: 'Retry Test',
        payload_hash: 'sha256:payload',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        requires_ack: true,
      });

      const status = await service.getDeliveryStatus(message.message_id);
      const record = status[0];

      const retried = await service.retryDelivery(record.delivery_id);

      assert.strictEqual(retried.status, 'retrying');
      assert.ok(retried.attempts > 0);
    });

    it('delivery record has attempt tracking', async () => {
      const message = await service.sendMessage({
        incident_id: 'sha256:incident1',
        source_agency: 'sha256:agency-source',
        target_agencies: ['sha256:agency-target'],
        priority: 'high',
        escalation_level: 'l2',
        subject: 'Attempt Test',
        payload_hash: 'sha256:payload',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        requires_ack: true,
      });

      const status = await service.getDeliveryStatus(message.message_id);
      const record = status[0];

      assert.strictEqual(typeof record.attempts, 'number');
    });

    it('checks delivery expiry', async () => {
      const expired = await service.checkDeliveryExpiry();
      assert.ok(Array.isArray(expired));
    });
  });

  // ==========================================================================
  // CONTRACT: escalation_paths
  // ==========================================================================
  describe('CONTRACT: escalation_paths', () => {
    it('configures escalation path', async () => {
      const path = await service.configureEscalationPath({
        source_agency: 'sha256:agency-a',
        target_agency: 'sha256:agency-b',
        primary_channel_id: 'sha256:channel-1',
        backup_channel_ids: ['sha256:channel-2'],
        max_retry_attempts: 3,
        retry_delay_seconds: 60,
        escalation_timeout_seconds: 300,
      });

      assert.ok(path.path_id.startsWith('sha256:'));
    });

    it('retrieves escalation path', async () => {
      await service.configureEscalationPath({
        source_agency: 'sha256:agency-x',
        target_agency: 'sha256:agency-y',
        primary_channel_id: 'sha256:channel-1',
        backup_channel_ids: [],
        max_retry_attempts: 5,
        retry_delay_seconds: 30,
        escalation_timeout_seconds: 600,
      });

      const path = await service.getEscalationPath('sha256:agency-x', 'sha256:agency-y');
      assert.ok(path);
    });

    it('path includes backup channels', async () => {
      const path = await service.configureEscalationPath({
        source_agency: 'sha256:agency-1',
        target_agency: 'sha256:agency-2',
        primary_channel_id: 'sha256:primary',
        backup_channel_ids: ['sha256:backup-1', 'sha256:backup-2'],
        max_retry_attempts: 3,
        retry_delay_seconds: 30,
        escalation_timeout_seconds: 300,
      });

      assert.ok(path.backup_channel_ids.length >= 2);
    });

    it('tests escalation path', async () => {
      const channels = await service.listChannels();
      const primaryChannel = channels.find(c => c.status === 'active');

      if (primaryChannel) {
        const path = await service.configureEscalationPath({
          source_agency: 'sha256:source',
          target_agency: 'sha256:target',
          primary_channel_id: primaryChannel.channel_id,
          backup_channel_ids: [],
          max_retry_attempts: 3,
          retry_delay_seconds: 30,
          escalation_timeout_seconds: 300,
        });

        const result = await service.testEscalationPath(path.path_id);

        assert.strictEqual(typeof result.success, 'boolean');
        assert.strictEqual(typeof result.latency_ms, 'number');
      }
    });
  });

  // ==========================================================================
  // CONTRACT: bridge_health
  // ==========================================================================
  describe('CONTRACT: bridge_health', () => {
    it('reports bridge health', async () => {
      const health = await service.getBridgeHealth('us-east-1');

      assert.ok(health.bridge_id.startsWith('sha256:'));
      assert.ok(['healthy', 'degraded', 'critical', 'offline'].includes(health.overall_status));
    });

    it('counts channel states', async () => {
      const health = await service.getBridgeHealth('us-east-1');

      assert.strictEqual(typeof health.channels_active, 'number');
      assert.strictEqual(typeof health.channels_degraded, 'number');
      assert.strictEqual(typeof health.channels_unavailable, 'number');
    });

    it('tracks pending messages', async () => {
      const health = await service.getBridgeHealth('us-east-1');

      assert.strictEqual(typeof health.pending_messages, 'number');
    });

    it('lists bridges by health', async () => {
      const bridges = await service.listBridgesByHealth();

      assert.ok(bridges.length > 0);
      // Should be sorted by health status
    });

    it('switches bridge region', async () => {
      await service.switchBridgeRegion('us-west-2');

      // Subsequent operations should use new region
      const coordination = await service.initiateCoordination('sha256:incident-1', 'sha256:lead', [
        'sha256:participant',
      ]);

      assert.strictEqual(coordination.bridge_region, 'us-west-2');
    });
  });

  // ==========================================================================
  // CONTRACT: cross_agency_coordination
  // ==========================================================================
  describe('CONTRACT: cross_agency_coordination', () => {
    it('initiates coordination', async () => {
      const coordination = await service.initiateCoordination(
        'sha256:incident-1',
        'sha256:lead-agency',
        ['sha256:agency-a', 'sha256:agency-b']
      );

      assert.ok(coordination.coordination_id.startsWith('sha256:'));
      assert.strictEqual(coordination.status, 'active');
    });

    it('retrieves coordination', async () => {
      const created = await service.initiateCoordination(
        'sha256:incident-1',
        'sha256:lead-agency',
        ['sha256:agency-a']
      );

      const retrieved = await service.getCoordination(created.coordination_id);
      assert.ok(retrieved);
      assert.strictEqual(retrieved.coordination_id, created.coordination_id);
    });

    it('updates coordination', async () => {
      const coordination = await service.initiateCoordination(
        'sha256:incident-1',
        'sha256:lead-agency',
        ['sha256:agency-a']
      );

      const updated = await service.updateCoordination(coordination.coordination_id, {
        status: 'resolved',
      });

      assert.strictEqual(updated.status, 'resolved');
      assert.ok(updated.last_update_at);
    });

    it('escalates coordination', async () => {
      const coordination = await service.initiateCoordination(
        'sha256:incident-1',
        'sha256:lead-agency',
        ['sha256:agency-a']
      );

      const escalated = await service.escalateCoordination(
        coordination.coordination_id,
        'executive'
      );

      assert.strictEqual(escalated.escalation_level, 'executive');
      assert.strictEqual(escalated.status, 'escalated');
    });

    it('tracks participating agencies', async () => {
      const coordination = await service.initiateCoordination('sha256:incident-1', 'sha256:lead', [
        'sha256:a1',
        'sha256:a2',
        'sha256:a3',
      ]);

      assert.strictEqual(coordination.participating_agencies.length, 3);
      for (const agency of coordination.participating_agencies) {
        assert.ok(agency.startsWith('sha256:'));
      }
    });
  });

  // ==========================================================================
  // CONTRACT: deduplication
  // ==========================================================================
  describe('CONTRACT: deduplication', () => {
    it('detects duplicate message', async () => {
      const message = await service.sendMessage({
        incident_id: 'sha256:incident1',
        source_agency: 'sha256:agency-source',
        target_agencies: ['sha256:agency-target'],
        priority: 'high',
        escalation_level: 'l2',
        subject: 'Dedup Test',
        payload_hash: 'sha256:payload',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        requires_ack: false,
      });

      const isDupe = await service.isDuplicateMessage(message.message_id);
      assert.strictEqual(isDupe, true);
    });

    it('new message is not duplicate', async () => {
      const isDupe = await service.isDuplicateMessage('sha256:brand-new-message-id');
      assert.strictEqual(isDupe, false);
    });

    it('has deduplication window', async () => {
      const window = await service.getDeduplicationWindow();

      assert.strictEqual(typeof window, 'number');
      assert.ok(window > 0);
    });
  });

  // ==========================================================================
  // CONTRACT: auditability
  // ==========================================================================
  describe('CONTRACT: auditability', () => {
    it('all message IDs are opaque sha256', async () => {
      const message = await service.sendMessage({
        incident_id: 'sha256:incident1',
        source_agency: 'sha256:agency-source',
        target_agencies: ['sha256:agency-target'],
        priority: 'high',
        escalation_level: 'l2',
        subject: 'Audit Test',
        payload_hash: 'sha256:payload',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        requires_ack: false,
      });

      assert.ok(message.message_id.startsWith('sha256:'));
      assert.ok(message.incident_id.startsWith('sha256:'));
      assert.ok(message.source_agency.startsWith('sha256:'));
    });

    it('agency IDs are opaque sha256', async () => {
      const message = await service.sendMessage({
        incident_id: 'sha256:incident1',
        source_agency: 'sha256:agency-source',
        target_agencies: ['sha256:agency-target-1', 'sha256:agency-target-2'],
        priority: 'high',
        escalation_level: 'cross-agency',
        subject: 'Agency ID Test',
        payload_hash: 'sha256:payload',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        requires_ack: false,
      });

      for (const agency of message.target_agencies) {
        assert.ok(agency.startsWith('sha256:'));
      }
    });

    it('timestamps are ISO format', async () => {
      const message = await service.sendMessage({
        incident_id: 'sha256:incident1',
        source_agency: 'sha256:agency-source',
        target_agencies: ['sha256:agency-target'],
        priority: 'normal',
        escalation_level: 'l1',
        subject: 'Timestamp Test',
        payload_hash: 'sha256:payload',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        requires_ack: false,
      });

      const createdDate = new Date(message.created_at);
      const expiresDate = new Date(message.expires_at);

      assert.ok(!isNaN(createdDate.getTime()));
      assert.ok(!isNaN(expiresDate.getTime()));
    });

    it('delivery records have timestamps', async () => {
      const message = await service.sendMessage({
        incident_id: 'sha256:incident1',
        source_agency: 'sha256:agency-source',
        target_agencies: ['sha256:agency-target'],
        priority: 'high',
        escalation_level: 'l2',
        subject: 'Delivery Timestamp Test',
        payload_hash: 'sha256:payload',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        requires_ack: true,
      });

      await service.acknowledgeMessage(message.message_id, 'sha256:agency-target');

      const status = await service.getDeliveryStatus(message.message_id);
      const delivered = status.find(r => r.status === 'delivered');

      assert.ok(delivered?.delivered_at);
      const date = new Date(delivered.delivered_at);
      assert.ok(!isNaN(date.getTime()));
    });
  });
});

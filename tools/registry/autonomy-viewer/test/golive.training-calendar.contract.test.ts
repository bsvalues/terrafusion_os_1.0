/**
 * Phase XXIII — Global Program Synthesis + Go-Live Playbook
 * ==========================================================
 * Contract: golive.training-calendar.contract.test.ts
 *
 * Tests training and drill calendar scheduling: cadence enforcement,
 * blackout windows, completion tracking, certification gating.
 *
 * Invariants:
 * - All IDs are opaque sha256: prefixed (PII-clean)
 * - SEV1/SEV2 drill requirements enforced
 * - Certifications gate go-live
 * - Blackout windows respected
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// Type Definitions
// ============================================================================

type CalendarId = `sha256:${string}`;
type EventId = `sha256:${string}`;
type CertificationId = `sha256:${string}`;
type AgencyId = `sha256:${string}`;
type RoleId = `sha256:${string}`;

type EventType =
  | 'training'
  | 'tabletop_drill'
  | 'technical_drill'
  | 'full_drill'
  | 'certification_exam';
type EventStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'missed';
type CertificationStatus = 'not_started' | 'in_progress' | 'passed' | 'failed' | 'expired';
type DrillSeverity = 'SEV1' | 'SEV2' | 'SEV3';

interface BlackoutWindow {
  readonly id: `sha256:${string}`;
  readonly name: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly reason: string;
}

interface TrainingEvent {
  readonly id: EventId;
  readonly calendarId: CalendarId;
  readonly type: EventType;
  readonly title: string;
  readonly description: string;
  readonly scheduledDate: string;
  readonly durationMinutes: number;
  readonly requiredRoles: readonly RoleId[];
  readonly participants: readonly { roleId: RoleId; attended: boolean }[];
  readonly status: EventStatus;
  readonly drillSeverity: DrillSeverity | null;
  readonly completedAt: string | null;
  readonly evidenceRef: `sha256:${string}` | null;
}

interface Certification {
  readonly id: CertificationId;
  readonly name: string;
  readonly description: string;
  readonly validityMonths: number;
  readonly requiredTrainingIds: readonly EventId[];
  readonly examRequired: boolean;
}

interface CertificationRecord {
  readonly certificationId: CertificationId;
  readonly roleId: RoleId;
  readonly agencyId: AgencyId;
  readonly status: CertificationStatus;
  readonly earnedAt: string | null;
  readonly expiresAt: string | null;
  readonly trainingCompleted: readonly EventId[];
  readonly examPassed: boolean;
}

interface DrillCadenceRequirement {
  readonly drillType: EventType;
  readonly severity: DrillSeverity;
  readonly cadenceDays: number;
  readonly description: string;
}

interface TrainingCalendar {
  readonly id: CalendarId;
  readonly agencyId: AgencyId;
  readonly name: string;
  readonly version: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly events: readonly TrainingEvent[];
  readonly blackoutWindows: readonly BlackoutWindow[];
  readonly certifications: readonly CertificationRecord[];
  readonly drillRequirements: readonly DrillCadenceRequirement[];
  readonly sev1Compliant: boolean;
  readonly sev2Compliant: boolean;
  readonly allCertificationsCurrent: boolean;
  readonly readyForGoLive: boolean;
}

// ============================================================================
// Mock Service Implementation
// ============================================================================

function createMockTrainingCalendarService() {
  const calendars = new Map<CalendarId, TrainingCalendar>();
  const certifications = new Map<CertificationId, Certification>();

  function generateId(prefix: string): `sha256:${string}` {
    const hash = Math.random().toString(36).slice(2) + Date.now().toString(36);
    return `sha256:${prefix}_${hash}`;
  }

  // Pre-populate certifications
  const defaultCerts: Certification[] = [
    {
      id: generateId('cert') as CertificationId,
      name: 'Incident Commander',
      description: 'Incident command certification',
      validityMonths: 12,
      requiredTrainingIds: [],
      examRequired: true,
    },
    {
      id: generateId('cert') as CertificationId,
      name: 'Security Operations',
      description: 'Security ops certification',
      validityMonths: 12,
      requiredTrainingIds: [],
      examRequired: true,
    },
    {
      id: generateId('cert') as CertificationId,
      name: 'DR Coordinator',
      description: 'Disaster recovery coordinator',
      validityMonths: 6,
      requiredTrainingIds: [],
      examRequired: false,
    },
  ];

  for (const cert of defaultCerts) {
    certifications.set(cert.id, cert);
  }

  // Default drill requirements
  const defaultDrillRequirements: DrillCadenceRequirement[] = [
    {
      drillType: 'full_drill',
      severity: 'SEV1',
      cadenceDays: 90,
      description: 'Quarterly SEV1 full-scale drill',
    },
    {
      drillType: 'technical_drill',
      severity: 'SEV2',
      cadenceDays: 30,
      description: 'Monthly SEV2 technical drill',
    },
    {
      drillType: 'tabletop_drill',
      severity: 'SEV3',
      cadenceDays: 14,
      description: 'Bi-weekly tabletop exercise',
    },
  ];

  function isDateInBlackout(date: string, blackouts: readonly BlackoutWindow[]): boolean {
    const d = new Date(date);
    return blackouts.some(b => d >= new Date(b.startDate) && d <= new Date(b.endDate));
  }

  function calculateDrillCompliance(calendar: TrainingCalendar, severity: DrillSeverity): boolean {
    const requirement = calendar.drillRequirements.find(r => r.severity === severity);
    if (!requirement) return true;

    const relevantEvents = calendar.events.filter(
      e => e.drillSeverity === severity && e.status === 'completed'
    );

    if (relevantEvents.length === 0) return false;

    // Check if latest drill is within cadence
    const sorted = [...relevantEvents].sort(
      (a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()
    );
    const latest = sorted[0];
    const daysAgo = Math.floor(
      (Date.now() - new Date(latest.completedAt!).getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysAgo <= requirement.cadenceDays;
  }

  return {
    // Calendar Management
    createCalendar(agencyId: AgencyId, name: string): TrainingCalendar {
      const calendar: TrainingCalendar = {
        id: generateId('calendar') as CalendarId,
        agencyId,
        name,
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        events: [],
        blackoutWindows: [],
        certifications: [],
        drillRequirements: defaultDrillRequirements,
        sev1Compliant: false,
        sev2Compliant: false,
        allCertificationsCurrent: true,
        readyForGoLive: false,
      };

      calendars.set(calendar.id, calendar);
      return calendar;
    },

    // Event Scheduling
    scheduleEvent(
      calendarId: CalendarId,
      type: EventType,
      title: string,
      description: string,
      scheduledDate: string,
      durationMinutes: number,
      requiredRoles: readonly RoleId[],
      drillSeverity: DrillSeverity | null = null
    ): TrainingEvent | null {
      const calendar = calendars.get(calendarId);
      if (!calendar) return null;

      // Check blackout windows
      if (isDateInBlackout(scheduledDate, calendar.blackoutWindows)) {
        return null; // Cannot schedule during blackout
      }

      const event: TrainingEvent = {
        id: generateId('event') as EventId,
        calendarId,
        type,
        title,
        description,
        scheduledDate,
        durationMinutes,
        requiredRoles,
        participants: requiredRoles.map(r => ({ roleId: r, attended: false })),
        status: 'scheduled',
        drillSeverity,
        completedAt: null,
        evidenceRef: null,
      };

      const updated = this.recalculateCalendar({
        ...calendar,
        events: [...calendar.events, event],
      });
      calendars.set(calendarId, updated);

      return event;
    },

    startEvent(calendarId: CalendarId, eventId: EventId): TrainingEvent | null {
      const calendar = calendars.get(calendarId);
      if (!calendar) return null;

      const index = calendar.events.findIndex(e => e.id === eventId);
      if (index === -1) return null;

      const event = calendar.events[index];
      if (event.status !== 'scheduled') return null;

      const updated: TrainingEvent = { ...event, status: 'in_progress' };
      const events = [...calendar.events];
      events[index] = updated;

      calendars.set(calendarId, { ...calendar, events });
      return updated;
    },

    completeEvent(
      calendarId: CalendarId,
      eventId: EventId,
      attendees: readonly RoleId[],
      evidenceRef: `sha256:${string}`
    ): TrainingEvent | null {
      const calendar = calendars.get(calendarId);
      if (!calendar) return null;

      const index = calendar.events.findIndex(e => e.id === eventId);
      if (index === -1) return null;

      const event = calendar.events[index];
      if (event.status !== 'in_progress') return null;

      const participants = event.participants.map(p => ({
        ...p,
        attended: attendees.includes(p.roleId),
      }));

      const completed: TrainingEvent = {
        ...event,
        status: 'completed',
        completedAt: new Date().toISOString(),
        participants,
        evidenceRef,
      };

      const events = [...calendar.events];
      events[index] = completed;

      const updated = this.recalculateCalendar({ ...calendar, events });
      calendars.set(calendarId, updated);

      return completed;
    },

    cancelEvent(calendarId: CalendarId, eventId: EventId): TrainingEvent | null {
      const calendar = calendars.get(calendarId);
      if (!calendar) return null;

      const index = calendar.events.findIndex(e => e.id === eventId);
      if (index === -1) return null;

      const cancelled: TrainingEvent = { ...calendar.events[index], status: 'cancelled' };
      const events = [...calendar.events];
      events[index] = cancelled;

      calendars.set(calendarId, { ...calendar, events });
      return cancelled;
    },

    markEventMissed(calendarId: CalendarId, eventId: EventId): TrainingEvent | null {
      const calendar = calendars.get(calendarId);
      if (!calendar) return null;

      const index = calendar.events.findIndex(e => e.id === eventId);
      if (index === -1) return null;

      const missed: TrainingEvent = { ...calendar.events[index], status: 'missed' };
      const events = [...calendar.events];
      events[index] = missed;

      const updated = this.recalculateCalendar({ ...calendar, events });
      calendars.set(calendarId, updated);

      return missed;
    },

    // Blackout Windows
    addBlackoutWindow(
      calendarId: CalendarId,
      name: string,
      startDate: string,
      endDate: string,
      reason: string
    ): BlackoutWindow | null {
      const calendar = calendars.get(calendarId);
      if (!calendar) return null;

      const window: BlackoutWindow = {
        id: generateId('blackout'),
        name,
        startDate,
        endDate,
        reason,
      };

      const updated: TrainingCalendar = {
        ...calendar,
        blackoutWindows: [...calendar.blackoutWindows, window],
        updatedAt: new Date().toISOString(),
      };
      calendars.set(calendarId, updated);

      return window;
    },

    isDateBlocked(calendarId: CalendarId, date: string): boolean {
      const calendar = calendars.get(calendarId);
      if (!calendar) return false;
      return isDateInBlackout(date, calendar.blackoutWindows);
    },

    // Certification Management
    initializeCertification(
      calendarId: CalendarId,
      certificationId: CertificationId,
      roleId: RoleId,
      agencyId: AgencyId
    ): CertificationRecord | null {
      const calendar = calendars.get(calendarId);
      const cert = certifications.get(certificationId);
      if (!calendar || !cert) return null;

      const record: CertificationRecord = {
        certificationId,
        roleId,
        agencyId,
        status: 'not_started',
        earnedAt: null,
        expiresAt: null,
        trainingCompleted: [],
        examPassed: false,
      };

      const updated = this.recalculateCalendar({
        ...calendar,
        certifications: [...calendar.certifications, record],
      });
      calendars.set(calendarId, updated);

      return record;
    },

    recordTrainingForCertification(
      calendarId: CalendarId,
      certificationId: CertificationId,
      roleId: RoleId,
      eventId: EventId
    ): CertificationRecord | null {
      const calendar = calendars.get(calendarId);
      if (!calendar) return null;

      const index = calendar.certifications.findIndex(
        c => c.certificationId === certificationId && c.roleId === roleId
      );
      if (index === -1) return null;

      const record = calendar.certifications[index];
      const updated: CertificationRecord = {
        ...record,
        status: 'in_progress',
        trainingCompleted: [...record.trainingCompleted, eventId],
      };

      const certs = [...calendar.certifications];
      certs[index] = updated;

      calendars.set(calendarId, this.recalculateCalendar({ ...calendar, certifications: certs }));
      return updated;
    },

    passExam(
      calendarId: CalendarId,
      certificationId: CertificationId,
      roleId: RoleId
    ): CertificationRecord | null {
      const calendar = calendars.get(calendarId);
      const cert = certifications.get(certificationId);
      if (!calendar || !cert) return null;

      const index = calendar.certifications.findIndex(
        c => c.certificationId === certificationId && c.roleId === roleId
      );
      if (index === -1) return null;

      const record = calendar.certifications[index];
      const now = new Date();
      const expires = new Date(now);
      expires.setMonth(expires.getMonth() + cert.validityMonths);

      const updated: CertificationRecord = {
        ...record,
        status: 'passed',
        examPassed: true,
        earnedAt: now.toISOString(),
        expiresAt: expires.toISOString(),
      };

      const certs = [...calendar.certifications];
      certs[index] = updated;

      calendars.set(calendarId, this.recalculateCalendar({ ...calendar, certifications: certs }));
      return updated;
    },

    failExam(
      calendarId: CalendarId,
      certificationId: CertificationId,
      roleId: RoleId
    ): CertificationRecord | null {
      const calendar = calendars.get(calendarId);
      if (!calendar) return null;

      const index = calendar.certifications.findIndex(
        c => c.certificationId === certificationId && c.roleId === roleId
      );
      if (index === -1) return null;

      const updated: CertificationRecord = {
        ...calendar.certifications[index],
        status: 'failed',
        examPassed: false,
      };

      const certs = [...calendar.certifications];
      certs[index] = updated;

      calendars.set(calendarId, this.recalculateCalendar({ ...calendar, certifications: certs }));
      return updated;
    },

    expireCertification(
      calendarId: CalendarId,
      certificationId: CertificationId,
      roleId: RoleId
    ): CertificationRecord | null {
      const calendar = calendars.get(calendarId);
      if (!calendar) return null;

      const index = calendar.certifications.findIndex(
        c => c.certificationId === certificationId && c.roleId === roleId
      );
      if (index === -1) return null;

      const updated: CertificationRecord = {
        ...calendar.certifications[index],
        status: 'expired',
      };

      const certs = [...calendar.certifications];
      certs[index] = updated;

      calendars.set(calendarId, this.recalculateCalendar({ ...calendar, certifications: certs }));
      return updated;
    },

    // Drill Cadence
    addDrillRequirement(
      calendarId: CalendarId,
      drillType: EventType,
      severity: DrillSeverity,
      cadenceDays: number,
      description: string
    ): DrillCadenceRequirement | null {
      const calendar = calendars.get(calendarId);
      if (!calendar) return null;

      const requirement: DrillCadenceRequirement = {
        drillType,
        severity,
        cadenceDays,
        description,
      };

      const updated = this.recalculateCalendar({
        ...calendar,
        drillRequirements: [...calendar.drillRequirements, requirement],
      });
      calendars.set(calendarId, updated);

      return requirement;
    },

    getNextRequiredDrillDate(calendarId: CalendarId, severity: DrillSeverity): string | null {
      const calendar = calendars.get(calendarId);
      if (!calendar) return null;

      const requirement = calendar.drillRequirements.find(r => r.severity === severity);
      if (!requirement) return null;

      const relevantEvents = calendar.events.filter(
        e => e.drillSeverity === severity && e.status === 'completed'
      );

      if (relevantEvents.length === 0) {
        return new Date().toISOString(); // Due now
      }

      const sorted = [...relevantEvents].sort(
        (a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()
      );
      const latest = sorted[0];
      const nextDue = new Date(latest.completedAt!);
      nextDue.setDate(nextDue.getDate() + requirement.cadenceDays);

      return nextDue.toISOString();
    },

    // Calendar Recalculation
    recalculateCalendar(calendar: TrainingCalendar): TrainingCalendar {
      const sev1Compliant = calculateDrillCompliance(calendar, 'SEV1');
      const sev2Compliant = calculateDrillCompliance(calendar, 'SEV2');

      const allCertificationsCurrent = calendar.certifications.every(c => {
        if (c.status === 'passed') {
          if (!c.expiresAt) return true;
          return new Date(c.expiresAt) > new Date();
        }
        return c.status === 'not_started'; // Not started is ok (no requirement triggered yet)
      });

      const readyForGoLive = sev1Compliant && sev2Compliant && allCertificationsCurrent;

      return {
        ...calendar,
        sev1Compliant,
        sev2Compliant,
        allCertificationsCurrent,
        readyForGoLive,
        updatedAt: new Date().toISOString(),
      };
    },

    // Retrieval
    getCalendar(id: CalendarId): TrainingCalendar | null {
      return calendars.get(id) ?? null;
    },

    getEvents(calendarId: CalendarId): readonly TrainingEvent[] {
      const calendar = calendars.get(calendarId);
      return calendar ? [...calendar.events] : [];
    },

    getEventsByType(calendarId: CalendarId, type: EventType): readonly TrainingEvent[] {
      const calendar = calendars.get(calendarId);
      if (!calendar) return [];
      return [...calendar.events.filter(e => e.type === type)];
    },

    getUpcomingEvents(calendarId: CalendarId, days: number): readonly TrainingEvent[] {
      const calendar = calendars.get(calendarId);
      if (!calendar) return [];

      const now = new Date();
      const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

      return [
        ...calendar.events.filter(e => {
          const d = new Date(e.scheduledDate);
          return e.status === 'scheduled' && d >= now && d <= cutoff;
        }),
      ];
    },

    getCompletedDrills(calendarId: CalendarId, severity: DrillSeverity): readonly TrainingEvent[] {
      const calendar = calendars.get(calendarId);
      if (!calendar) return [];
      return [
        ...calendar.events.filter(e => e.drillSeverity === severity && e.status === 'completed'),
      ];
    },

    getCertifications(calendarId: CalendarId): readonly CertificationRecord[] {
      const calendar = calendars.get(calendarId);
      return calendar ? [...calendar.certifications] : [];
    },

    getBlackoutWindows(calendarId: CalendarId): readonly BlackoutWindow[] {
      const calendar = calendars.get(calendarId);
      return calendar ? [...calendar.blackoutWindows] : [];
    },

    getCertification(id: CertificationId): Certification | null {
      return certifications.get(id) ?? null;
    },

    getAllCertifications(): readonly Certification[] {
      return [...certifications.values()];
    },
  };
}

// ============================================================================
// Contract Tests
// ============================================================================

describe('Phase XXIII: Training Calendar Contracts', () => {
  let calendarService: ReturnType<typeof createMockTrainingCalendarService>;
  const agencyA = 'sha256:agency_alpha' as AgencyId;
  const roleIncidentCommander = 'sha256:role_ic' as RoleId;
  const roleSecurityLead = 'sha256:role_sec_lead' as RoleId;
  const roleOpsLead = 'sha256:role_ops_lead' as RoleId;

  beforeEach(() => {
    calendarService = createMockTrainingCalendarService();
  });

  // ==========================================================================
  // ID Format Tests
  // ==========================================================================

  describe('ID Format Invariants', () => {
    it('should generate calendar IDs with sha256: prefix', () => {
      const calendar = calendarService.createCalendar(agencyA, 'Training Calendar');
      assert.ok(calendar.id.startsWith('sha256:'));
    });

    it('should generate event IDs with sha256: prefix', () => {
      const calendar = calendarService.createCalendar(agencyA, 'Training');
      const event = calendarService.scheduleEvent(
        calendar.id,
        'training',
        'Onboarding',
        'New employee training',
        '2026-03-15T09:00:00Z',
        120,
        [roleIncidentCommander]
      );
      assert.ok(event?.id.startsWith('sha256:'));
    });

    it('should generate blackout IDs with sha256: prefix', () => {
      const calendar = calendarService.createCalendar(agencyA, 'Training');
      const window = calendarService.addBlackoutWindow(
        calendar.id,
        'Holiday Freeze',
        '2026-12-20',
        '2027-01-05',
        'End of year freeze'
      );
      assert.ok(window?.id.startsWith('sha256:'));
    });
  });

  // ==========================================================================
  // Event Scheduling Tests
  // ==========================================================================

  describe('Event Scheduling', () => {
    it('should schedule training event', () => {
      const calendar = calendarService.createCalendar(agencyA, 'Training');
      const event = calendarService.scheduleEvent(
        calendar.id,
        'training',
        'Security Basics',
        'Security fundamentals training',
        '2026-03-15T09:00:00Z',
        60,
        [roleSecurityLead]
      );

      assert.ok(event);
      assert.strictEqual(event.status, 'scheduled');
      assert.strictEqual(event.type, 'training');
    });

    it('should schedule drill with severity', () => {
      const calendar = calendarService.createCalendar(agencyA, 'Training');
      const event = calendarService.scheduleEvent(
        calendar.id,
        'full_drill',
        'SEV1 Full Scale Drill',
        'Quarterly SEV1 drill',
        '2026-03-20T10:00:00Z',
        240,
        [roleIncidentCommander, roleSecurityLead, roleOpsLead],
        'SEV1'
      );

      assert.ok(event);
      assert.strictEqual(event.drillSeverity, 'SEV1');
    });

    it('should not schedule during blackout window', () => {
      const calendar = calendarService.createCalendar(agencyA, 'Training');
      calendarService.addBlackoutWindow(
        calendar.id,
        'Freeze',
        '2026-03-10',
        '2026-03-20',
        'Critical period'
      );

      const event = calendarService.scheduleEvent(
        calendar.id,
        'training',
        'Training',
        'Desc',
        '2026-03-15T09:00:00Z',
        60,
        [roleSecurityLead]
      );

      assert.strictEqual(event, null);
    });
  });

  // ==========================================================================
  // Event Lifecycle Tests
  // ==========================================================================

  describe('Event Lifecycle', () => {
    it('should start event', () => {
      const calendar = calendarService.createCalendar(agencyA, 'Training');
      const event = calendarService.scheduleEvent(
        calendar.id,
        'tabletop_drill',
        'Tabletop',
        'Tabletop exercise',
        '2026-03-15T09:00:00Z',
        90,
        [roleIncidentCommander]
      );

      const started = calendarService.startEvent(calendar.id, event!.id);
      assert.strictEqual(started?.status, 'in_progress');
    });

    it('should complete event with attendance', () => {
      const calendar = calendarService.createCalendar(agencyA, 'Training');
      const event = calendarService.scheduleEvent(
        calendar.id,
        'training',
        'Training',
        'Desc',
        '2026-03-15T09:00:00Z',
        60,
        [roleSecurityLead, roleOpsLead]
      );

      calendarService.startEvent(calendar.id, event!.id);
      const completed = calendarService.completeEvent(
        calendar.id,
        event!.id,
        [roleSecurityLead], // Only security lead attended
        'sha256:training_evidence'
      );

      assert.strictEqual(completed?.status, 'completed');
      assert.ok(completed?.evidenceRef?.startsWith('sha256:'));

      const secLead = completed?.participants.find(p => p.roleId === roleSecurityLead);
      const opsLead = completed?.participants.find(p => p.roleId === roleOpsLead);
      assert.strictEqual(secLead?.attended, true);
      assert.strictEqual(opsLead?.attended, false);
    });

    it('should cancel event', () => {
      const calendar = calendarService.createCalendar(agencyA, 'Training');
      const event = calendarService.scheduleEvent(
        calendar.id,
        'training',
        'Training',
        'Desc',
        '2026-03-15T09:00:00Z',
        60,
        [roleSecurityLead]
      );

      const cancelled = calendarService.cancelEvent(calendar.id, event!.id);
      assert.strictEqual(cancelled?.status, 'cancelled');
    });

    it('should mark event as missed', () => {
      const calendar = calendarService.createCalendar(agencyA, 'Training');
      const event = calendarService.scheduleEvent(
        calendar.id,
        'full_drill',
        'SEV1 Drill',
        'Required SEV1 drill',
        '2026-03-01T10:00:00Z',
        240,
        [roleIncidentCommander],
        'SEV1'
      );

      const missed = calendarService.markEventMissed(calendar.id, event!.id);
      assert.strictEqual(missed?.status, 'missed');
    });
  });

  // ==========================================================================
  // Drill Compliance Tests
  // ==========================================================================

  describe('SEV1/SEV2 Drill Compliance', () => {
    it('should track SEV1 compliance', () => {
      const calendar = calendarService.createCalendar(agencyA, 'Training');

      // Initially non-compliant (no drills)
      let current = calendarService.getCalendar(calendar.id);
      assert.strictEqual(current?.sev1Compliant, false);

      // Schedule and complete SEV1 drill
      const event = calendarService.scheduleEvent(
        calendar.id,
        'full_drill',
        'SEV1 Drill',
        'Full drill',
        new Date().toISOString(),
        240,
        [roleIncidentCommander],
        'SEV1'
      );
      calendarService.startEvent(calendar.id, event!.id);
      calendarService.completeEvent(
        calendar.id,
        event!.id,
        [roleIncidentCommander],
        'sha256:drill_report'
      );

      current = calendarService.getCalendar(calendar.id);
      assert.strictEqual(current?.sev1Compliant, true);
    });

    it('should track SEV2 compliance', () => {
      const calendar = calendarService.createCalendar(agencyA, 'Training');

      const event = calendarService.scheduleEvent(
        calendar.id,
        'technical_drill',
        'SEV2 Technical Drill',
        'Technical drill',
        new Date().toISOString(),
        120,
        [roleSecurityLead],
        'SEV2'
      );
      calendarService.startEvent(calendar.id, event!.id);
      calendarService.completeEvent(
        calendar.id,
        event!.id,
        [roleSecurityLead],
        'sha256:sev2_report'
      );

      const current = calendarService.getCalendar(calendar.id);
      assert.strictEqual(current?.sev2Compliant, true);
    });

    it('should calculate next required drill date', () => {
      const calendar = calendarService.createCalendar(agencyA, 'Training');

      const event = calendarService.scheduleEvent(
        calendar.id,
        'full_drill',
        'SEV1 Drill',
        'Drill',
        new Date().toISOString(),
        240,
        [roleIncidentCommander],
        'SEV1'
      );
      calendarService.startEvent(calendar.id, event!.id);
      calendarService.completeEvent(
        calendar.id,
        event!.id,
        [roleIncidentCommander],
        'sha256:report'
      );

      const nextDue = calendarService.getNextRequiredDrillDate(calendar.id, 'SEV1');
      assert.ok(nextDue);
      assert.ok(new Date(nextDue) > new Date()); // Should be in the future
    });
  });

  // ==========================================================================
  // Certification Tests
  // ==========================================================================

  describe('Certification Management', () => {
    it('should initialize certification', () => {
      const calendar = calendarService.createCalendar(agencyA, 'Training');
      const certs = calendarService.getAllCertifications();
      const cert = certs[0];

      const record = calendarService.initializeCertification(
        calendar.id,
        cert.id,
        roleIncidentCommander,
        agencyA
      );

      assert.ok(record);
      assert.strictEqual(record.status, 'not_started');
    });

    it('should record training completion', () => {
      const calendar = calendarService.createCalendar(agencyA, 'Training');
      const certs = calendarService.getAllCertifications();

      calendarService.initializeCertification(
        calendar.id,
        certs[0].id,
        roleIncidentCommander,
        agencyA
      );

      const event = calendarService.scheduleEvent(
        calendar.id,
        'training',
        'IC Training',
        'Incident commander training',
        new Date().toISOString(),
        240,
        [roleIncidentCommander]
      );
      calendarService.startEvent(calendar.id, event!.id);
      calendarService.completeEvent(
        calendar.id,
        event!.id,
        [roleIncidentCommander],
        'sha256:training_ev'
      );

      const record = calendarService.recordTrainingForCertification(
        calendar.id,
        certs[0].id,
        roleIncidentCommander,
        event!.id
      );

      assert.strictEqual(record?.status, 'in_progress');
      assert.ok(record?.trainingCompleted.includes(event!.id));
    });

    it('should pass exam and set expiry', () => {
      const calendar = calendarService.createCalendar(agencyA, 'Training');
      const certs = calendarService.getAllCertifications();

      calendarService.initializeCertification(
        calendar.id,
        certs[0].id,
        roleIncidentCommander,
        agencyA
      );

      const passed = calendarService.passExam(calendar.id, certs[0].id, roleIncidentCommander);

      assert.strictEqual(passed?.status, 'passed');
      assert.strictEqual(passed?.examPassed, true);
      assert.ok(passed?.earnedAt);
      assert.ok(passed?.expiresAt);
    });

    it('should track failed exam', () => {
      const calendar = calendarService.createCalendar(agencyA, 'Training');
      const certs = calendarService.getAllCertifications();

      calendarService.initializeCertification(calendar.id, certs[0].id, roleSecurityLead, agencyA);

      const failed = calendarService.failExam(calendar.id, certs[0].id, roleSecurityLead);

      assert.strictEqual(failed?.status, 'failed');
    });

    it('should track expired certifications', () => {
      const calendar = calendarService.createCalendar(agencyA, 'Training');
      const certs = calendarService.getAllCertifications();

      calendarService.initializeCertification(
        calendar.id,
        certs[0].id,
        roleIncidentCommander,
        agencyA
      );
      calendarService.passExam(calendar.id, certs[0].id, roleIncidentCommander);
      calendarService.expireCertification(calendar.id, certs[0].id, roleIncidentCommander);

      const current = calendarService.getCalendar(calendar.id);
      assert.strictEqual(current?.allCertificationsCurrent, false);
    });
  });

  // ==========================================================================
  // Go-Live Readiness Tests
  // ==========================================================================

  describe('Go-Live Readiness Gates', () => {
    it('should not be ready without SEV1 compliance', () => {
      const calendar = calendarService.createCalendar(agencyA, 'Training');

      // Complete SEV2 only
      const sev2 = calendarService.scheduleEvent(
        calendar.id,
        'technical_drill',
        'SEV2',
        'Drill',
        new Date().toISOString(),
        120,
        [roleSecurityLead],
        'SEV2'
      );
      calendarService.startEvent(calendar.id, sev2!.id);
      calendarService.completeEvent(calendar.id, sev2!.id, [roleSecurityLead], 'sha256:sev2');

      const current = calendarService.getCalendar(calendar.id);
      assert.strictEqual(current?.readyForGoLive, false);
    });

    it('should be ready with SEV1 + SEV2 + certifications current', () => {
      const calendar = calendarService.createCalendar(agencyA, 'Training');

      // Complete SEV1
      const sev1 = calendarService.scheduleEvent(
        calendar.id,
        'full_drill',
        'SEV1',
        'Full drill',
        new Date().toISOString(),
        240,
        [roleIncidentCommander],
        'SEV1'
      );
      calendarService.startEvent(calendar.id, sev1!.id);
      calendarService.completeEvent(calendar.id, sev1!.id, [roleIncidentCommander], 'sha256:sev1');

      // Complete SEV2
      const sev2 = calendarService.scheduleEvent(
        calendar.id,
        'technical_drill',
        'SEV2',
        'Technical drill',
        new Date().toISOString(),
        120,
        [roleSecurityLead],
        'SEV2'
      );
      calendarService.startEvent(calendar.id, sev2!.id);
      calendarService.completeEvent(calendar.id, sev2!.id, [roleSecurityLead], 'sha256:sev2');

      const current = calendarService.getCalendar(calendar.id);
      assert.strictEqual(current?.sev1Compliant, true);
      assert.strictEqual(current?.sev2Compliant, true);
      assert.strictEqual(current?.allCertificationsCurrent, true);
      assert.strictEqual(current?.readyForGoLive, true);
    });
  });

  // ==========================================================================
  // Query Tests
  // ==========================================================================

  describe('Calendar Queries', () => {
    it('should get events by type', () => {
      const calendar = calendarService.createCalendar(agencyA, 'Training');
      calendarService.scheduleEvent(
        calendar.id,
        'training',
        'T1',
        'Desc',
        '2026-03-15T09:00:00Z',
        60,
        []
      );
      calendarService.scheduleEvent(
        calendar.id,
        'training',
        'T2',
        'Desc',
        '2026-03-16T09:00:00Z',
        60,
        []
      );
      calendarService.scheduleEvent(
        calendar.id,
        'tabletop_drill',
        'D1',
        'Desc',
        '2026-03-17T09:00:00Z',
        90,
        []
      );

      const trainings = calendarService.getEventsByType(calendar.id, 'training');
      assert.strictEqual(trainings.length, 2);
    });

    it('should get upcoming events', () => {
      const calendar = calendarService.createCalendar(agencyA, 'Training');

      // Schedule events in the future
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      calendarService.scheduleEvent(
        calendar.id,
        'training',
        'Tomorrow',
        'Desc',
        tomorrow.toISOString(),
        60,
        []
      );
      calendarService.scheduleEvent(
        calendar.id,
        'training',
        'Next Week',
        'Desc',
        nextWeek.toISOString(),
        60,
        []
      );

      const upcoming = calendarService.getUpcomingEvents(calendar.id, 3);
      assert.ok(upcoming.length >= 1); // At least tomorrow's event
    });

    it('should get completed drills by severity', () => {
      const calendar = calendarService.createCalendar(agencyA, 'Training');

      // Complete a SEV1 drill
      const drill = calendarService.scheduleEvent(
        calendar.id,
        'full_drill',
        'SEV1 Drill',
        'Drill',
        new Date().toISOString(),
        240,
        [roleIncidentCommander],
        'SEV1'
      );
      calendarService.startEvent(calendar.id, drill!.id);
      calendarService.completeEvent(
        calendar.id,
        drill!.id,
        [roleIncidentCommander],
        'sha256:report'
      );

      const completedSev1 = calendarService.getCompletedDrills(calendar.id, 'SEV1');
      assert.strictEqual(completedSev1.length, 1);
    });
  });

  // ==========================================================================
  // Read-Only Invariants
  // ==========================================================================

  describe('Read-Only Invariants', () => {
    it('should return copies of events', () => {
      const calendar = calendarService.createCalendar(agencyA, 'Training');
      calendarService.scheduleEvent(
        calendar.id,
        'training',
        'T1',
        'Desc',
        '2026-03-15T09:00:00Z',
        60,
        []
      );

      const e1 = calendarService.getEvents(calendar.id);
      const e2 = calendarService.getEvents(calendar.id);
      assert.ok(e1 !== e2);
    });

    it('should return copies of certifications', () => {
      const calendar = calendarService.createCalendar(agencyA, 'Training');
      const certs = calendarService.getAllCertifications();
      calendarService.initializeCertification(
        calendar.id,
        certs[0].id,
        roleIncidentCommander,
        agencyA
      );

      const c1 = calendarService.getCertifications(calendar.id);
      const c2 = calendarService.getCertifications(calendar.id);
      assert.ok(c1 !== c2);
    });

    it('should return copies of blackout windows', () => {
      const calendar = calendarService.createCalendar(agencyA, 'Training');
      calendarService.addBlackoutWindow(
        calendar.id,
        'Freeze',
        '2026-12-20',
        '2027-01-05',
        'Holiday'
      );

      const b1 = calendarService.getBlackoutWindows(calendar.id);
      const b2 = calendarService.getBlackoutWindows(calendar.id);
      assert.ok(b1 !== b2);
    });
  });
});

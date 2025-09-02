# ADR-002: Event-Driven Architecture

## Status

Accepted

## Context

Terrafusion requires a scalable architecture that can:

- Handle asynchronous operations (AI processing, quantum computations)
- Enable loose coupling between services
- Support real-time updates and notifications
- Scale individual components independently
- Maintain audit trails for all operations

We need to choose between:

1. **Direct Service-to-Service Communication**: REST/gRPC calls between services
2. **Event-Driven Architecture**: Services communicate through events
3. **Hybrid Approach**: Synchronous for queries, asynchronous for commands

## Decision

We will implement an **Event-Driven Architecture** using:

- RabbitMQ as the primary message broker
- Event sourcing for critical business operations
- CQRS (Command Query Responsibility Segregation) pattern
- Saga pattern for distributed transactions

## Rationale

### Why Event-Driven?

1. **Scalability**: Services can scale independently based on load
2. **Resilience**: System continues functioning even if some services are down
3. **Flexibility**: Easy to add new services or modify existing ones
4. **Audit Trail**: Natural event log for compliance requirements
5. **Real-time**: Enables real-time updates and notifications

### Architecture Overview

```typescript
// Event structure
interface TerraFusionEvent {
  id: string;
  type: string;
  version: number;
  timestamp: Date;
  tenantId: string;
  userId: string;
  correlationId: string;
  causationId?: string;
  payload: Record<string, any>;
  metadata: {
    source: string;
    ipAddress?: string;
    userAgent?: string;
  };
}

// Example event types
enum EventTypes {
  // Tenant events
  TENANT_CREATED = "tenant.created",
  TENANT_UPDATED = "tenant.updated",
  TENANT_SUSPENDED = "tenant.suspended",

  // Workflow events
  WORKFLOW_STARTED = "workflow.started",
  WORKFLOW_COMPLETED = "workflow.completed",
  WORKFLOW_FAILED = "workflow.failed",

  // Quantum events
  QUANTUM_JOB_SUBMITTED = "quantum.job.submitted",
  QUANTUM_JOB_COMPLETED = "quantum.job.completed",
}
```

### Event Bus Implementation

```typescript
export class EventBus {
  private connection: amqp.Connection;
  private channel: amqp.Channel;

  async publish(event: TerraFusionEvent): Promise<void> {
    // Add to event store
    await this.eventStore.append(event);

    // Publish to RabbitMQ
    await this.channel.publish(
      "terrafusion.events",
      event.type,
      Buffer.from(JSON.stringify(event)),
      {
        persistent: true,
        headers: {
          "x-tenant-id": event.tenantId,
          "x-correlation-id": event.correlationId,
        },
      },
    );
  }

  async subscribe(
    eventType: string,
    handler: (event: TerraFusionEvent) => Promise<void>,
  ): Promise<void> {
    await this.channel.assertQueue(`${this.serviceName}.${eventType}`);
    await this.channel.bindQueue(
      `${this.serviceName}.${eventType}`,
      "terrafusion.events",
      eventType,
    );

    await this.channel.consume(
      `${this.serviceName}.${eventType}`,
      async (msg) => {
        const event = JSON.parse(msg.content.toString());
        try {
          await handler(event);
          await this.channel.ack(msg);
        } catch (error) {
          await this.handleError(error, event, msg);
        }
      },
    );
  }
}
```

### Saga Pattern for Distributed Transactions

```typescript
export class TenantProvisioningSaga {
  private steps = [
    this.createTenantSchema,
    this.provisionResources,
    this.setupAuthentication,
    this.configureMonitoring,
    this.sendWelcomeEmail,
  ];

  async execute(command: CreateTenantCommand): Promise<void> {
    const sagaId = uuid();
    const completedSteps: number[] = [];

    try {
      for (let i = 0; i < this.steps.length; i++) {
        await this.steps[i](command, sagaId);
        completedSteps.push(i);

        await this.eventBus.publish({
          type: "saga.step.completed",
          payload: { sagaId, step: i },
        });
      }
    } catch (error) {
      // Compensate in reverse order
      for (const step of completedSteps.reverse()) {
        await this.compensate(step, command, sagaId);
      }
      throw error;
    }
  }
}
```

## Consequences

### Positive

- **Scalability**: Each service can scale independently
- **Resilience**: Services are decoupled; failures are isolated
- **Flexibility**: Easy to add new event consumers
- **Audit Trail**: Complete history of all events
- **Real-time Updates**: WebSocket connections can subscribe to events
- **Testing**: Services can be tested in isolation

### Negative

- **Complexity**: More complex than synchronous communication
- **Debugging**: Distributed tracing required for debugging
- **Eventual Consistency**: Data may be temporarily inconsistent
- **Message Ordering**: Must handle out-of-order messages
- **Duplicate Messages**: Must implement idempotency

### Mitigation Strategies

1. **Distributed Tracing**: Implement OpenTelemetry for request tracing
2. **Monitoring**: Comprehensive monitoring of message queues and processing
3. **Dead Letter Queues**: Handle failed messages appropriately
4. **Idempotency**: Ensure all event handlers are idempotent
5. **Event Versioning**: Support multiple event versions during migration

## Implementation Guidelines

### Event Naming Convention

```
<entity>.<action>
Examples:
- tenant.created
- workflow.started
- quantum.job.completed
```

### Event Storage

- Store all events in PostgreSQL for durability
- Use time-series partitioning for performance
- Implement event replay capabilities
- Archive old events to object storage

### Error Handling

```typescript
class EventHandler {
  async handleWithRetry(event: TerraFusionEvent): Promise<void> {
    const maxRetries = 3;
    let lastError: Error;

    for (let i = 0; i < maxRetries; i++) {
      try {
        await this.process(event);
        return;
      } catch (error) {
        lastError = error;
        await this.delay(Math.pow(2, i) * 1000); // Exponential backoff
      }
    }

    // Send to dead letter queue
    await this.deadLetterQueue.send(event, lastError);
  }
}
```

## References

- [Enterprise Integration Patterns](https://www.enterpriseintegrationpatterns.com/)
- [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html)
- [CQRS Pattern](https://martinfowler.com/bliki/CQRS.html)
- [Saga Pattern](https://microservices.io/patterns/data/saga.html)

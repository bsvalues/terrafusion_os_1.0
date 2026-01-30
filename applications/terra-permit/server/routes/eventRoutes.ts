/**
 * Event System API Routes
 * 
 * This file defines the API routes for the Event-Driven Architecture (EDA)
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { 
  createEvent, 
  publishEvent, 
  getEventStore, 
  queryEvents, 
  EventType, 
  EventPriority 
} from '../../shared/eda/eventSystem';
import { Event, EventQueryOptions, EventCreateOptions } from '../../shared/eda/types';

// Convert enum values to string literals for Zod schema
const eventTypeValues = Object.values(EventType) as string[];
const eventPriorityValues = Object.values(EventPriority) as string[];

// Schema for create event request
const createEventSchema = z.object({
  type: z.enum(eventTypeValues as [string, ...string[]]),
  payload: z.any().default({}), // Default payload to empty object to satisfy required property
  priority: z.enum(eventPriorityValues as [string, ...string[]]).optional().default(EventPriority.NORMAL),
  metadata: z.record(z.string(), z.any()).optional(),
  correlationId: z.string().optional(),
});

// Schema for query events request
const queryEventsSchema = z.object({
  type: z.enum(eventTypeValues as [string, ...string[]]).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  correlationId: z.string().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
});

/**
 * Register the event routes on the Express application
 */
export function registerEventRoutes(app: any) {
  // Get all events (with optional filtering)
  app.get('/api/events', (req: Request, res: Response) => {
    try {
      // Parse query parameters
      const queryParams: EventQueryOptions = {
        type: req.query.type as EventType | undefined,
        startTime: req.query.startTime as string | undefined,
        endTime: req.query.endTime as string | undefined,
        correlationId: req.query.correlationId as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };
      
      // Validate query parameters
      const validatedParams = queryEventsSchema.safeParse(queryParams);
      if (!validatedParams.success) {
        return res.status(400).json({ 
          error: 'Invalid query parameters',
          details: validatedParams.error.errors 
        });
      }
      
      // Query events
      const events = queryEvents(queryParams);
      
      res.json({
        success: true,
        data: events,
        count: events.length
      });
    } catch (error) {
      console.error('Error querying events:', error);
      res.status(500).json({ 
        error: 'Failed to query events',
        message: (error as Error).message 
      });
    }
  });
  
  // Get a specific event by ID
  app.get('/api/events/:id', (req: Request, res: Response) => {
    try {
      const eventId = req.params.id;
      const event = getEventStore().get(eventId);
      
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      
      res.json({
        success: true,
        data: event
      });
    } catch (error) {
      console.error('Error getting event:', error);
      res.status(500).json({ 
        error: 'Failed to get event',
        message: (error as Error).message 
      });
    }
  });
  
  // Create and publish a new event
  app.post('/api/events', (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedBody = createEventSchema.safeParse(req.body);
      if (!validatedBody.success) {
        return res.status(400).json({ 
          error: 'Invalid event data',
          details: validatedBody.error.errors 
        });
      }
      
      // Create and publish the event
      // Explicitly define the event data with required properties
      const eventData = {
        type: validatedBody.data.type as EventType,
        payload: validatedBody.data.payload || {}, // Ensure payload is always provided
        priority: validatedBody.data.priority as EventPriority || EventPriority.NORMAL
      };
      
      // Add optional properties only if they exist
      if (validatedBody.data.metadata) {
        eventData.metadata = validatedBody.data.metadata;
      }
      
      if (validatedBody.data.correlationId) {
        eventData.correlationId = validatedBody.data.correlationId;
      }
      
      const event = createEvent(eventData);
      const published = publishEvent(event);
      
      if (!published) {
        return res.status(500).json({ error: 'Failed to publish event' });
      }
      
      res.status(201).json({
        success: true,
        data: event
      });
    } catch (error) {
      console.error('Error creating event:', error);
      res.status(500).json({ 
        error: 'Failed to create event',
        message: (error as Error).message 
      });
    }
  });
  
  // Get events by type
  app.get('/api/events/type/:type', (req: Request, res: Response) => {
    try {
      const eventType = req.params.type as EventType;
      
      // Validate event type
      if (!Object.values(EventType).includes(eventType)) {
        return res.status(400).json({ error: 'Invalid event type' });
      }
      
      // Query events by type
      const events = getEventStore().getByType(eventType);
      
      res.json({
        success: true,
        data: events,
        count: events.length
      });
    } catch (error) {
      console.error('Error getting events by type:', error);
      res.status(500).json({ 
        error: 'Failed to get events by type',
        message: (error as Error).message 
      });
    }
  });
  
  // Get events by correlation ID
  app.get('/api/events/correlation/:id', (req: Request, res: Response) => {
    try {
      const correlationId = req.params.id;
      
      // Query events by correlation ID
      const events = queryEvents({ correlationId });
      
      res.json({
        success: true,
        data: events,
        count: events.length
      });
    } catch (error) {
      console.error('Error getting events by correlation ID:', error);
      res.status(500).json({ 
        error: 'Failed to get events by correlation ID',
        message: (error as Error).message 
      });
    }
  });
  
  // Health check endpoint for event system
  app.get('/api/events/system/health', (_req: Request, res: Response) => {
    res.json({
      success: true,
      status: 'healthy',
      eventCount: getEventStore().size()
    });
  });
}
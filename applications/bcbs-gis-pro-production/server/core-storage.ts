import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { 
  users, parcels, documents, mapLayers, auditLogs, counties, workflows, gisLayers,
  type User, type Parcel, type Document, type MapLayer, type AuditLog, type County, type Workflow, type GisLayer,
  type InsertUser, type InsertParcel, type InsertDocument, type InsertMapLayer, type InsertCounty, type InsertWorkflow, type InsertGisLayer
} from '../shared/core-schema'
import { eq, desc, and, or, like } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'

const connectionString = process.env.DATABASE_URL!
const client = postgres(connectionString)
const db = drizzle(client)

export interface ICoreStorage {
  users: {
    create(data: InsertUser): Promise<User>
    getById(id: string): Promise<User | undefined>
    getByEmail(email: string): Promise<User | undefined>
    update(id: string, data: Partial<InsertUser>): Promise<User | undefined>
    list(): Promise<User[]>
  }
  counties: {
    create(data: InsertCounty): Promise<County>
    getById(id: string): Promise<County | undefined>
    getByFipsCode(fipsCode: string): Promise<County | undefined>
    update(id: string, data: Partial<InsertCounty>): Promise<County | undefined>
    list(): Promise<County[]>
    updateParcelCount(id: string, count: number): Promise<void>
  }
  parcels: {
    create(data: InsertParcel): Promise<Parcel>
    getById(id: string): Promise<Parcel | undefined>
    getByParcelNumber(parcelNumber: string): Promise<Parcel | undefined>
    getByCounty(countyId: string, limit?: number): Promise<Parcel[]>
    update(id: string, data: Partial<InsertParcel>): Promise<Parcel | undefined>
    search(query: string, countyId?: string): Promise<Parcel[]>
    list(limit?: number): Promise<Parcel[]>
    bulkImport(parcels: InsertParcel[]): Promise<Parcel[]>
  }
  documents: {
    create(data: InsertDocument): Promise<Document>
    getById(id: string): Promise<Document | undefined>
    getByParcelId(parcelId: string): Promise<Document[]>
    update(id: string, data: Partial<InsertDocument>): Promise<Document | undefined>
    list(limit?: number): Promise<Document[]>
    processAI(id: string): Promise<Document | undefined>
  }
  gisLayers: {
    create(data: InsertGisLayer): Promise<GisLayer>
    getById(id: string): Promise<GisLayer | undefined>
    getByCounty(countyId: string): Promise<GisLayer[]>
    update(id: string, data: Partial<InsertGisLayer>): Promise<GisLayer | undefined>
    list(): Promise<GisLayer[]>
    delete(id: string): Promise<boolean>
  }
  workflows: {
    create(data: InsertWorkflow): Promise<Workflow>
    getById(id: string): Promise<Workflow | undefined>
    update(id: string, data: Partial<InsertWorkflow>): Promise<Workflow | undefined>
    list(): Promise<Workflow[]>
    execute(id: string): Promise<any>
  }
  mapLayers: {
    create(data: InsertMapLayer): Promise<MapLayer>
    getById(id: string): Promise<MapLayer | undefined>
    update(id: string, data: Partial<InsertMapLayer>): Promise<MapLayer | undefined>
    list(): Promise<MapLayer[]>
    delete(id: string): Promise<boolean>
  }
  auditLogs: {
    log(action: string, entityType: string, entityId: string, userId: string, changes?: any, ipAddress?: string): Promise<void>
    getByEntity(entityType: string, entityId: string): Promise<AuditLog[]>
    getByUser(userId: string): Promise<AuditLog[]>
  }
}

export class PostgresStorage implements ICoreStorage {
  counties = {
    async create(data: InsertCounty): Promise<County> {
      const [county] = await db.insert(counties).values(data).returning()
      return county
    },

    async getById(id: string): Promise<County | undefined> {
      const idNum = parseInt(id)
      const [county] = await db.select().from(counties).where(eq(counties.id, idNum))
      return county
    },

    async getByFipsCode(fipsCode: string): Promise<County | undefined> {
      const [county] = await db.select().from(counties).where(eq(counties.fips, fipsCode))
      return county
    },

    async update(id: string, data: Partial<InsertCounty>): Promise<County | undefined> {
      const idNum = parseInt(id)
      const [county] = await db.update(counties).set(data).where(eq(counties.id, idNum)).returning()
      return county
    },

    async list(): Promise<County[]> {
      return await db.select().from(counties).where(eq(counties.isActive, true)).orderBy(counties.name)
    },

    async updateParcelCount(id: string, count: number): Promise<void> {
      const idNum = parseInt(id)
      const metadata = { totalParcels: count }
      await db.update(counties).set({ metadata }).where(eq(counties.id, idNum))
    }
  }

  users = {
    async create(data: InsertUser): Promise<User> {
      const id = uuidv4()
      const [user] = await db.insert(users).values({ ...data, id }).returning()
      return user
    },

    async getById(id: string): Promise<User | undefined> {
      const [user] = await db.select().from(users).where(eq(users.id, id))
      return user
    },

    async getByEmail(email: string): Promise<User | undefined> {
      const [user] = await db.select().from(users).where(eq(users.email, email))
      return user
    },

    async update(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
      const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning()
      return user
    },

    async list(): Promise<User[]> {
      return await db.select().from(users).where(eq(users.isActive, true))
    }
  }

  parcels = {
    async create(data: InsertParcel): Promise<Parcel> {
      const id = uuidv4()
      const [parcel] = await db.insert(parcels).values({ ...data, id }).returning()
      return parcel
    },

    async getById(id: string): Promise<Parcel | undefined> {
      const [parcel] = await db.select().from(parcels).where(eq(parcels.id, id))
      return parcel
    },

    async getByParcelNumber(parcelNumber: string): Promise<Parcel | undefined> {
      const [parcel] = await db.select().from(parcels).where(eq(parcels.parcelNumber, parcelNumber))
      return parcel
    },

    async update(id: string, data: Partial<InsertParcel>): Promise<Parcel | undefined> {
      const [parcel] = await db.update(parcels).set({ ...data, lastModified: new Date() }).where(eq(parcels.id, id)).returning()
      return parcel
    },

    async getByCounty(countyId: string, limit = 100): Promise<Parcel[]> {
      return await db.select().from(parcels)
        .where(eq(parcels.countyId, countyId))
        .limit(limit)
        .orderBy(desc(parcels.lastModified))
    },

    async search(query: string, countyId?: string): Promise<Parcel[]> {
      const conditions = or(
        like(parcels.parcelNumber, `%${query}%`),
        like(parcels.address, `%${query}%`),
        like(parcels.ownerName, `%${query}%`)
      )
      
      if (countyId) {
        return await db.select().from(parcels).where(
          and(eq(parcels.countyId, countyId), conditions)
        )
      }
      
      return await db.select().from(parcels).where(conditions)
    },

    async list(limit = 100): Promise<Parcel[]> {
      return await db.select().from(parcels).limit(limit).orderBy(desc(parcels.lastModified))
    },

    async bulkImport(parcelData: InsertParcel[]): Promise<Parcel[]> {
      const parcelsWithIds = parcelData.map(parcel => ({
        ...parcel,
        id: uuidv4()
      }))
      
      return await db.insert(parcels).values(parcelsWithIds).returning()
    }
  }

  documents = {
    async create(data: InsertDocument): Promise<Document> {
      const id = uuidv4()
      const [document] = await db.insert(documents).values({ ...data, id }).returning()
      return document
    },

    async getById(id: string): Promise<Document | undefined> {
      const [document] = await db.select().from(documents).where(eq(documents.id, id))
      return document
    },

    async getByParcelId(parcelId: string): Promise<Document[]> {
      return await db.select().from(documents).where(eq(documents.parcelId, parcelId))
    },

    async update(id: string, data: Partial<InsertDocument>): Promise<Document | undefined> {
      const [document] = await db.update(documents).set(data).where(eq(documents.id, id)).returning()
      return document
    },

    async list(limit = 50): Promise<Document[]> {
      return await db.select().from(documents).limit(limit).orderBy(desc(documents.uploadedAt))
    },

    async processAI(id: string): Promise<Document | undefined> {
      // AI processing will be implemented with actual service integration
      const [document] = await db.update(documents)
        .set({ 
          isProcessed: true,
          classification: 'processed',
          confidenceScore: '0.95'
        })
        .where(eq(documents.id, id))
        .returning()
      return document
    }
  }

  mapLayers = {
    async create(data: InsertMapLayer): Promise<MapLayer> {
      const id = uuidv4()
      const [layer] = await db.insert(mapLayers).values({ ...data, id }).returning()
      return layer
    },

    async getById(id: string): Promise<MapLayer | undefined> {
      const [layer] = await db.select().from(mapLayers).where(eq(mapLayers.id, id))
      return layer
    },

    async update(id: string, data: Partial<InsertMapLayer>): Promise<MapLayer | undefined> {
      const [layer] = await db.update(mapLayers).set(data).where(eq(mapLayers.id, id)).returning()
      return layer
    },

    async list(): Promise<MapLayer[]> {
      return await db.select().from(mapLayers).orderBy(mapLayers.ordering)
    },

    async delete(id: string): Promise<boolean> {
      try {
        await db.delete(mapLayers).where(eq(mapLayers.id, id))
        return true
      } catch {
        return false
      }
    }
  }

  auditLogs = {
    async log(action: string, entityType: string, entityId: string, userId: string, changes?: any, ipAddress?: string): Promise<void> {
      const id = uuidv4()
      await db.insert(auditLogs).values({
        id,
        action,
        entityType,
        entityId,
        userId,
        changes,
        ipAddress
      })
    },

    async getByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
      return await db.select().from(auditLogs)
        .where(and(eq(auditLogs.entityType, entityType), eq(auditLogs.entityId, entityId)))
        .orderBy(desc(auditLogs.timestamp))
    },

    async getByUser(userId: string): Promise<AuditLog[]> {
      return await db.select().from(auditLogs)
        .where(eq(auditLogs.userId, userId))
        .orderBy(desc(auditLogs.timestamp))
    }
  }

  gisLayers = {
    async create(data: InsertGisLayer): Promise<GisLayer> {
      const id = uuidv4()
      const [layer] = await db.insert(gisLayers).values({ ...data, id }).returning()
      return layer
    },

    async getById(id: string): Promise<GisLayer | undefined> {
      const [layer] = await db.select().from(gisLayers).where(eq(gisLayers.id, id))
      return layer
    },

    async getByCounty(countyId: string): Promise<GisLayer[]> {
      return await db.select().from(gisLayers)
        .where(eq(gisLayers.countyId, countyId))
        .orderBy(gisLayers.name)
    },

    async update(id: string, data: Partial<InsertGisLayer>): Promise<GisLayer | undefined> {
      const [layer] = await db.update(gisLayers)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(gisLayers.id, id))
        .returning()
      return layer
    },

    async list(): Promise<GisLayer[]> {
      return await db.select().from(gisLayers)
        .where(eq(gisLayers.isPublic, true))
        .orderBy(gisLayers.name)
    },

    async delete(id: string): Promise<boolean> {
      try {
        await db.delete(gisLayers).where(eq(gisLayers.id, id))
        return true
      } catch {
        return false
      }
    }
  }

  workflows = {
    async create(data: InsertWorkflow): Promise<Workflow> {
      const id = uuidv4()
      const [workflow] = await db.insert(workflows).values({ ...data, id }).returning()
      return workflow
    },

    async getById(id: string): Promise<Workflow | undefined> {
      const [workflow] = await db.select().from(workflows).where(eq(workflows.id, id))
      return workflow
    },

    async update(id: string, data: Partial<InsertWorkflow>): Promise<Workflow | undefined> {
      const [workflow] = await db.update(workflows)
        .set(data)
        .where(eq(workflows.id, id))
        .returning()
      return workflow
    },

    async list(): Promise<Workflow[]> {
      return await db.select().from(workflows)
        .where(eq(workflows.isActive, true))
        .orderBy(workflows.name)
    },

    async execute(id: string): Promise<any> {
      // Workflow execution logic will be implemented based on workflow type
      await db.update(workflows)
        .set({ lastRun: new Date() })
        .where(eq(workflows.id, id))
      
      return { status: 'executed', timestamp: new Date() }
    }
  }
}

export const storage = new PostgresStorage()
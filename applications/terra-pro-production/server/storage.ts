import {
  User,
  InsertUser,
  users,
  Organization,
  InsertOrganization,
  organizations,
  Property,
  InsertProperty,
  properties,
  PropertyImage,
  InsertPropertyImage,
  propertyImages,
  Valuation,
  InsertValuation,
  valuations,
  ComparableProperty,
  InsertComparableProperty,
  comparableProperties,
  Order,
  InsertOrder,
  orders,
  OrderStatusUpdate,
  InsertOrderStatusUpdate,
  orderStatusUpdates,
  Report,
  InsertReport,
  reports,
  ModelInference,
  InsertModelInference,
  modelInferences,
  RealEstateTerm,
  InsertRealEstateTerm,
  realEstateTerms,
  ReviewRequest,
  InsertReviewRequest,
  reviewRequests,
  Comment,
  InsertComment,
  comments,
  Annotation,
  InsertAnnotation,
  annotations,
  RevisionHistory,
  InsertRevisionHistory,
  revisionHistory,
  Photo,
  InsertPhoto,
  photos,
  Sketch,
  InsertSketch,
  sketches,
  AppraisalReport,
  InsertAppraisalReport,
  appraisalReports,
  ComplianceCheck,
  InsertComplianceCheck,
  complianceChecks,
  ComparableSale,
  InsertComparableSale,
  comparableSales,
  MlsSystem,
  InsertMlsSystem,
  mlsSystems,
  MlsFieldMapping,
  InsertMlsFieldMapping,
  mlsFieldMappings,
  MlsPropertyMapping,
  InsertMlsPropertyMapping,
  mlsPropertyMappings,
  MlsComparableMapping,
  InsertMlsComparableMapping,
  mlsComparableMappings,
  LegacyImportJob,
  InsertLegacyImportJob,
  legacyImportJobs,
  LegacyImportRecord,
  InsertLegacyImportRecord,
  legacyImportRecords,
  LegacySystemTemplate,
  InsertLegacySystemTemplate,
  legacySystemTemplates,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lte, sql, inArray, like } from "drizzle-orm";

// Define the Storage Interface
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;

  // Organization operations
  getOrganization(id: number): Promise<Organization | undefined>;
  getOrganizationByName(name: string): Promise<Organization | undefined>;
  createOrganization(insertOrg: InsertOrganization): Promise<Organization>;
  updateOrganization(
    id: number,
    org: Partial<InsertOrganization>
  ): Promise<Organization | undefined>;

  // Property operations
  getProperty(id: number): Promise<Property | undefined>;
  getPropertiesByCreator(userId: number, limit?: number): Promise<Property[]>;
  getPropertiesBySearch(searchText: string, limit?: number): Promise<Property[]>;
  createProperty(insertProperty: InsertProperty): Promise<Property>;
  updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property | undefined>;
  deleteProperty(id: number): Promise<boolean>;

  // Property Image operations
  getPropertyImage(id: number): Promise<PropertyImage | undefined>;
  getPropertyImagesByProperty(propertyId: number): Promise<PropertyImage[]>;
  createPropertyImage(insertImage: InsertPropertyImage): Promise<PropertyImage>;
  updatePropertyImage(
    id: number,
    image: Partial<InsertPropertyImage>
  ): Promise<PropertyImage | undefined>;
  deletePropertyImage(id: number): Promise<boolean>;

  // Valuation operations
  getValuation(id: number): Promise<Valuation | undefined>;
  getValuationsByProperty(propertyId: number): Promise<Valuation[]>;
  getValuationsByAppraiser(appraiserId: number, limit?: number): Promise<Valuation[]>;
  createValuation(insertValuation: InsertValuation): Promise<Valuation>;
  updateValuation(id: number, valuation: Partial<InsertValuation>): Promise<Valuation | undefined>;
  deleteValuation(id: number): Promise<boolean>;

  // Comparable Property operations
  getComparableProperty(id: number): Promise<ComparableProperty | undefined>;
  getComparablesByValuation(valuationId: number): Promise<ComparableProperty[]>;
  createComparableProperty(insertComparable: InsertComparableProperty): Promise<ComparableProperty>;
  updateComparableProperty(
    id: number,
    comparable: Partial<InsertComparableProperty>
  ): Promise<ComparableProperty | undefined>;
  deleteComparableProperty(id: number): Promise<boolean>;

  // Order operations
  getOrder(id: number): Promise<Order | undefined>;
  getOrderByOrderNumber(orderNumber: string): Promise<Order | undefined>;
  getOrdersByAssignee(assigneeId: number, limit?: number): Promise<Order[]>;
  getOrdersByStatus(status: string, limit?: number): Promise<Order[]>;
  createOrder(insertOrder: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined>;
  updateOrderStatus(
    id: number,
    status: string,
    updatedById: number,
    notes?: string
  ): Promise<Order | undefined>;

  // Order Status Update operations
  getOrderStatusUpdates(orderId: number): Promise<OrderStatusUpdate[]>;
  createOrderStatusUpdate(insertStatusUpdate: InsertOrderStatusUpdate): Promise<OrderStatusUpdate>;

  // Report operations
  getReport(id: number): Promise<Report | undefined>;
  getReportsByOrder(orderId: number): Promise<Report[]>;
  getReportsByGenerator(generatorId: number, limit?: number): Promise<Report[]>;
  createReport(insertReport: InsertReport): Promise<Report>;
  updateReport(id: number, report: Partial<InsertReport>): Promise<Report | undefined>;

  // Model Inference operations
  getModelInference(id: number): Promise<ModelInference | undefined>;
  getModelInferencesByEntity(entityType: string, entityId: number): Promise<ModelInference[]>;
  getModelInferencesByModel(modelName: string, limit?: number): Promise<ModelInference[]>;
  createModelInference(insertInference: InsertModelInference): Promise<ModelInference>;

  // Real Estate Term operations
  getRealEstateTerm(id: number): Promise<RealEstateTerm | undefined>;
  getRealEstateTermByName(term: string): Promise<RealEstateTerm | undefined>;
  getAllRealEstateTerms(): Promise<RealEstateTerm[]>;
  getRealEstateTermsByCategory(category: string): Promise<RealEstateTerm[]>;
  searchRealEstateTerms(query: string): Promise<RealEstateTerm[]>;
  createRealEstateTerm(insertTerm: InsertRealEstateTerm): Promise<RealEstateTerm>;
  updateRealEstateTerm(
    id: number,
    term: Partial<InsertRealEstateTerm>
  ): Promise<RealEstateTerm | undefined>;
  deleteRealEstateTerm(id: number): Promise<boolean>;
  getRelatedTerms(id: number): Promise<RealEstateTerm[]>;
  getTermExplanation(term: string, context?: string): Promise<any | undefined>;

  // Review Request operations
  getReviewRequest(id: number): Promise<ReviewRequest | undefined>;
  getPendingReviewRequests(limit?: number): Promise<ReviewRequest[]>;
  getReviewRequestsByRequester(requesterId: number, limit?: number): Promise<ReviewRequest[]>;
  getReviewRequestsByReviewer(reviewerId: number, limit?: number): Promise<ReviewRequest[]>;
  getReviewRequestsByObject(
    objectType: string,
    objectId: number,
    limit?: number
  ): Promise<ReviewRequest[]>;
  getReviewRequestsByStatus(status: string, limit?: number): Promise<ReviewRequest[]>;
  createReviewRequest(insertRequest: InsertReviewRequest): Promise<ReviewRequest>;
  updateReviewRequest(
    id: number,
    request: Partial<InsertReviewRequest>
  ): Promise<ReviewRequest | undefined>;
  completeReviewRequest(id: number, approved: boolean): Promise<ReviewRequest | undefined>;
  deleteReviewRequest(id: number): Promise<boolean>;

  // Comment operations
  getComment(id: number): Promise<Comment | undefined>;
  getCommentsByObject(objectType: string, objectId: number): Promise<Comment[]>;
  getCommentsByUser(userId: number, limit?: number): Promise<Comment[]>;
  getCommentsByThread(threadId: number): Promise<Comment[]>;
  createComment(insertComment: InsertComment): Promise<Comment>;
  updateComment(id: number, comment: Partial<InsertComment>): Promise<Comment | undefined>;
  deleteComment(id: number): Promise<boolean>;

  // Annotation operations
  getAnnotation(id: number): Promise<Annotation | undefined>;
  getAnnotationsByObject(objectType: string, objectId: number): Promise<Annotation[]>;
  getAnnotationsByUser(userId: number, limit?: number): Promise<Annotation[]>;
  createAnnotation(insertAnnotation: InsertAnnotation): Promise<Annotation>;
  updateAnnotation(
    id: number,
    annotation: Partial<InsertAnnotation>
  ): Promise<Annotation | undefined>;
  deleteAnnotation(id: number): Promise<boolean>;

  // Revision History operations
  getRevisionHistory(id: number): Promise<RevisionHistory | undefined>;
  getRevisionHistoryByObject(
    objectType: string,
    objectId: number,
    limit?: number
  ): Promise<RevisionHistory[]>;
  getRevisionHistoryByUser(userId: number, limit?: number): Promise<RevisionHistory[]>;
  createRevisionHistory(insertHistory: InsertRevisionHistory): Promise<RevisionHistory>;

  // Legacy Import Job operations
  getLegacyImportJob(id: number): Promise<LegacyImportJob | undefined>;
  getLegacyImportJobsByUser(userId: number, limit?: number): Promise<LegacyImportJob[]>;
  getLegacyImportJobsByStatus(status: string, limit?: number): Promise<LegacyImportJob[]>;
  createLegacyImportJob(insertJob: InsertLegacyImportJob): Promise<LegacyImportJob>;
  updateLegacyImportJob(
    id: number,
    job: Partial<InsertLegacyImportJob>
  ): Promise<LegacyImportJob | undefined>;
  deleteLegacyImportJob(id: number): Promise<boolean>;

  // Legacy Import Record operations
  getLegacyImportRecord(id: number): Promise<LegacyImportRecord | undefined>;
  getLegacyImportRecordsByJob(jobId: number): Promise<LegacyImportRecord[]>;
  getLegacyImportRecordsByStatus(status: string, limit?: number): Promise<LegacyImportRecord[]>;
  createLegacyImportRecord(insertRecord: InsertLegacyImportRecord): Promise<LegacyImportRecord>;
  updateLegacyImportRecord(
    id: number,
    record: Partial<InsertLegacyImportRecord>
  ): Promise<LegacyImportRecord | undefined>;
  deleteLegacyImportRecord(id: number): Promise<boolean>;

  // Legacy System Template operations
  getLegacySystemTemplate(id: number): Promise<LegacySystemTemplate | undefined>;
  getLegacySystemTemplatesByType(systemType: string): Promise<LegacySystemTemplate[]>;
  getLegacySystemTemplatesByOrganization(orgId: number): Promise<LegacySystemTemplate[]>;
  getAllActiveLegacySystemTemplates(): Promise<LegacySystemTemplate[]>;
  createLegacySystemTemplate(
    insertTemplate: InsertLegacySystemTemplate
  ): Promise<LegacySystemTemplate>;
  updateLegacySystemTemplate(
    id: number,
    template: Partial<InsertLegacySystemTemplate>
  ): Promise<LegacySystemTemplate | undefined>;
  deleteLegacySystemTemplate(id: number): Promise<boolean>;
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...user, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Organization operations
  async getOrganization(id: number): Promise<Organization | undefined> {
    const [organization] = await db.select().from(organizations).where(eq(organizations.id, id));
    return organization;
  }

  async getOrganizationByName(name: string): Promise<Organization | undefined> {
    const [organization] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.name, name));
    return organization;
  }

  async createOrganization(insertOrg: InsertOrganization): Promise<Organization> {
    const [organization] = await db.insert(organizations).values(insertOrg).returning();
    return organization;
  }

  async updateOrganization(
    id: number,
    org: Partial<InsertOrganization>
  ): Promise<Organization | undefined> {
    const [updatedOrg] = await db
      .update(organizations)
      .set({ ...org, updatedAt: new Date() })
      .where(eq(organizations.id, id))
      .returning();
    return updatedOrg;
  }

  // Property operations
  async getProperty(id: number): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property;
  }

  async getPropertiesByCreator(userId: number, limit = 50): Promise<Property[]> {
    return db
      .select()
      .from(properties)
      .where(eq(properties.createdById, userId))
      .orderBy(desc(properties.createdAt))
      .limit(limit);
  }

  async getPropertiesBySearch(searchText: string, limit = 50): Promise<Property[]> {
    // This is a simplified search that checks for matches in address, city, or state
    const searchPattern = `%${searchText}%`;
    return db
      .select()
      .from(properties)
      .where(
        sql`${properties.address} LIKE ${searchPattern} OR 
        ${properties.city} LIKE ${searchPattern} OR 
        ${properties.state} LIKE ${searchPattern}`
      )
      .limit(limit);
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const [property] = await db.insert(properties).values(insertProperty).returning();
    return property;
  }

  async updateProperty(
    id: number,
    property: Partial<InsertProperty>
  ): Promise<Property | undefined> {
    const [updatedProperty] = await db
      .update(properties)
      .set({ ...property, updatedAt: new Date() })
      .where(eq(properties.id, id))
      .returning();
    return updatedProperty;
  }

  async deleteProperty(id: number): Promise<boolean> {
    const [deletedProperty] = await db.delete(properties).where(eq(properties.id, id)).returning();
    return !!deletedProperty;
  }

  // Property Image operations
  async getPropertyImage(id: number): Promise<PropertyImage | undefined> {
    const [image] = await db.select().from(propertyImages).where(eq(propertyImages.id, id));
    return image;
  }

  async getPropertyImagesByProperty(propertyId: number): Promise<PropertyImage[]> {
    return db.select().from(propertyImages).where(eq(propertyImages.propertyId, propertyId));
  }

  async createPropertyImage(insertImage: InsertPropertyImage): Promise<PropertyImage> {
    const [image] = await db.insert(propertyImages).values(insertImage).returning();
    return image;
  }

  async updatePropertyImage(
    id: number,
    image: Partial<InsertPropertyImage>
  ): Promise<PropertyImage | undefined> {
    const [updatedImage] = await db
      .update(propertyImages)
      .set(image)
      .where(eq(propertyImages.id, id))
      .returning();
    return updatedImage;
  }

  async deletePropertyImage(id: number): Promise<boolean> {
    const [deletedImage] = await db
      .delete(propertyImages)
      .where(eq(propertyImages.id, id))
      .returning();
    return !!deletedImage;
  }

  // Valuation operations
  async getValuation(id: number): Promise<Valuation | undefined> {
    const [valuation] = await db.select().from(valuations).where(eq(valuations.id, id));
    return valuation;
  }

  async getValuationsByProperty(propertyId: number): Promise<Valuation[]> {
    return db
      .select()
      .from(valuations)
      .where(eq(valuations.propertyId, propertyId))
      .orderBy(desc(valuations.valuationDate));
  }

  async getValuationsByAppraiser(appraiserId: number, limit = 50): Promise<Valuation[]> {
    return db
      .select()
      .from(valuations)
      .where(eq(valuations.appraiserId, appraiserId))
      .orderBy(desc(valuations.valuationDate))
      .limit(limit);
  }

  async createValuation(insertValuation: InsertValuation): Promise<Valuation> {
    const [valuation] = await db.insert(valuations).values(insertValuation).returning();
    return valuation;
  }

  async updateValuation(
    id: number,
    valuation: Partial<InsertValuation>
  ): Promise<Valuation | undefined> {
    const [updatedValuation] = await db
      .update(valuations)
      .set({ ...valuation, updatedAt: new Date() })
      .where(eq(valuations.id, id))
      .returning();
    return updatedValuation;
  }

  async deleteValuation(id: number): Promise<boolean> {
    const [deletedValuation] = await db.delete(valuations).where(eq(valuations.id, id)).returning();
    return !!deletedValuation;
  }

  // Comparable Property operations
  async getComparableProperty(id: number): Promise<ComparableProperty | undefined> {
    const [comparable] = await db
      .select()
      .from(comparableProperties)
      .where(eq(comparableProperties.id, id));
    return comparable;
  }

  async getComparablesByValuation(valuationId: number): Promise<ComparableProperty[]> {
    return db
      .select()
      .from(comparableProperties)
      .where(eq(comparableProperties.valuationId, valuationId));
  }

  async createComparableProperty(
    insertComparable: InsertComparableProperty
  ): Promise<ComparableProperty> {
    const [comparable] = await db.insert(comparableProperties).values(insertComparable).returning();
    return comparable;
  }

  async updateComparableProperty(
    id: number,
    comparable: Partial<InsertComparableProperty>
  ): Promise<ComparableProperty | undefined> {
    const [updatedComparable] = await db
      .update(comparableProperties)
      .set(comparable)
      .where(eq(comparableProperties.id, id))
      .returning();
    return updatedComparable;
  }

  async deleteComparableProperty(id: number): Promise<boolean> {
    const [deletedComparable] = await db
      .delete(comparableProperties)
      .where(eq(comparableProperties.id, id))
      .returning();
    return !!deletedComparable;
  }

  // Order operations
  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrderByOrderNumber(orderNumber: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber));
    return order;
  }

  async getOrdersByAssignee(assigneeId: number, limit = 50): Promise<Order[]> {
    return db
      .select()
      .from(orders)
      .where(eq(orders.assignedToId, assigneeId))
      .orderBy(desc(orders.createdAt))
      .limit(limit);
  }

  async getOrdersByStatus(status: string, limit = 50): Promise<Order[]> {
    return db
      .select()
      .from(orders)
      .where(eq(orders.status, status))
      .orderBy(desc(orders.createdAt))
      .limit(limit);
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(insertOrder).returning();
    return order;
  }

  async updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ ...order, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  async updateOrderStatus(
    id: number,
    status: string,
    updatedById: number,
    notes?: string
  ): Promise<Order | undefined> {
    // Get existing order
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return undefined;

    // Begin a transaction to update both the order and create a status update
    try {
      // Update order status
      const [updatedOrder] = await db
        .update(orders)
        .set({ status, updatedAt: new Date() })
        .where(eq(orders.id, id))
        .returning();

      // Create status update record
      await db.insert(orderStatusUpdates).values({
        orderId: id,
        status,
        notes,
        updatedById,
      });

      return updatedOrder;
    } catch (error) {
      console.error("Error updating order status:", error);
      return undefined;
    }
  }

  // Order Status Update operations
  async getOrderStatusUpdates(orderId: number): Promise<OrderStatusUpdate[]> {
    return db
      .select()
      .from(orderStatusUpdates)
      .where(eq(orderStatusUpdates.orderId, orderId))
      .orderBy(desc(orderStatusUpdates.createdAt));
  }

  async createOrderStatusUpdate(
    insertStatusUpdate: InsertOrderStatusUpdate
  ): Promise<OrderStatusUpdate> {
    const [statusUpdate] = await db
      .insert(orderStatusUpdates)
      .values(insertStatusUpdate)
      .returning();
    return statusUpdate;
  }

  // Report operations
  async getReport(id: number): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report;
  }

  async getReportsByOrder(orderId: number): Promise<Report[]> {
    return db
      .select()
      .from(reports)
      .where(eq(reports.orderId, orderId))
      .orderBy(desc(reports.generatedAt));
  }

  async getReportsByGenerator(generatorId: number, limit = 50): Promise<Report[]> {
    return db
      .select()
      .from(reports)
      .where(eq(reports.generatedById, generatorId))
      .orderBy(desc(reports.generatedAt))
      .limit(limit);
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const [report] = await db.insert(reports).values(insertReport).returning();
    return report;
  }

  async updateReport(id: number, report: Partial<InsertReport>): Promise<Report | undefined> {
    const [updatedReport] = await db
      .update(reports)
      .set({ ...report, updatedAt: new Date() })
      .where(eq(reports.id, id))
      .returning();
    return updatedReport;
  }

  // Model Inference operations
  async getModelInference(id: number): Promise<ModelInference | undefined> {
    const [inference] = await db.select().from(modelInferences).where(eq(modelInferences.id, id));
    return inference;
  }

  async getModelInferencesByEntity(
    entityType: string,
    entityId: number
  ): Promise<ModelInference[]> {
    return db
      .select()
      .from(modelInferences)
      .where(
        and(eq(modelInferences.entityType, entityType), eq(modelInferences.entityId, entityId))
      )
      .orderBy(desc(modelInferences.createdAt));
  }

  async getModelInferencesByModel(modelName: string, limit = 50): Promise<ModelInference[]> {
    return db
      .select()
      .from(modelInferences)
      .where(eq(modelInferences.modelName, modelName))
      .orderBy(desc(modelInferences.createdAt))
      .limit(limit);
  }

  async createModelInference(insertInference: InsertModelInference): Promise<ModelInference> {
    const [inference] = await db.insert(modelInferences).values(insertInference).returning();
    return inference;
  }

  // Real Estate Term operations
  async getRealEstateTerm(id: number): Promise<RealEstateTerm | undefined> {
    const [term] = await db.select().from(realEstateTerms).where(eq(realEstateTerms.id, id));
    return term;
  }

  async getRealEstateTermByName(term: string): Promise<RealEstateTerm | undefined> {
    const [realEstateTerm] = await db
      .select()
      .from(realEstateTerms)
      .where(eq(realEstateTerms.term, term));
    return realEstateTerm;
  }

  async getAllRealEstateTerms(): Promise<RealEstateTerm[]> {
    return db.select().from(realEstateTerms).orderBy(realEstateTerms.term);
  }

  async getRealEstateTermsByCategory(category: string): Promise<RealEstateTerm[]> {
    return db
      .select()
      .from(realEstateTerms)
      .where(eq(realEstateTerms.category, category))
      .orderBy(realEstateTerms.term);
  }

  async searchRealEstateTerms(query: string): Promise<RealEstateTerm[]> {
    // Simple search using LIKE for terms, definitions, or category
    const searchPattern = `%${query}%`;
    return db
      .select()
      .from(realEstateTerms)
      .where(
        sql`${realEstateTerms.term} LIKE ${searchPattern} OR 
        ${realEstateTerms.definition} LIKE ${searchPattern} OR 
        ${realEstateTerms.category} LIKE ${searchPattern}`
      )
      .orderBy(realEstateTerms.term);
  }

  async createRealEstateTerm(insertTerm: InsertRealEstateTerm): Promise<RealEstateTerm> {
    const [term] = await db.insert(realEstateTerms).values(insertTerm).returning();
    return term;
  }

  async updateRealEstateTerm(
    id: number,
    term: Partial<InsertRealEstateTerm>
  ): Promise<RealEstateTerm | undefined> {
    const [updatedTerm] = await db
      .update(realEstateTerms)
      .set({ ...term, updatedAt: new Date() })
      .where(eq(realEstateTerms.id, id))
      .returning();
    return updatedTerm;
  }

  async deleteRealEstateTerm(id: number): Promise<boolean> {
    const [deletedTerm] = await db
      .delete(realEstateTerms)
      .where(eq(realEstateTerms.id, id))
      .returning();
    return !!deletedTerm;
  }

  async getRelatedTerms(id: number): Promise<RealEstateTerm[]> {
    // Get the term first
    const term = await this.getRealEstateTerm(id);
    if (!term || !term.relatedTerms || term.relatedTerms.length === 0) {
      return [];
    }

    // Get related terms one by one (less efficient but safer)
    const relatedTerms: RealEstateTerm[] = [];

    for (const relatedTermName of term.relatedTerms) {
      const relatedTerm = await this.getRealEstateTermByName(relatedTermName);
      if (relatedTerm) {
        relatedTerms.push(relatedTerm);
      }
    }

    return relatedTerms;
  }

  async getTermExplanation(term: string, context?: string): Promise<any | undefined> {
    // Get the term from database
    const realEstateTerm = await this.getRealEstateTermByName(term);

    if (!realEstateTerm) {
      return undefined;
    }

    // Return term explanation
    return {
      definition: realEstateTerm.definition,
      contextualExplanation: realEstateTerm.contextualExplanation || undefined,
      examples: realEstateTerm.examples || [],
      relatedTerms: realEstateTerm.relatedTerms || [],
    };
  }

  // ===== REVIEW REQUEST METHODS =====

  async getReviewRequest(id: number): Promise<ReviewRequest | undefined> {
    try {
      const [request] = await db.select().from(reviewRequests).where(eq(reviewRequests.id, id));
      return request;
    } catch (error) {
      console.error(`Error getting review request ${id}:`, error);
      return undefined;
    }
  }

  async getPendingReviewRequests(limit = 50): Promise<ReviewRequest[]> {
    try {
      return await db
        .select()
        .from(reviewRequests)
        .where(eq(reviewRequests.status, "pending"))
        .limit(limit);
    } catch (error) {
      console.error("Error getting pending review requests:", error);
      return [];
    }
  }

  async getReviewRequestsByRequester(requesterId: number, limit = 50): Promise<ReviewRequest[]> {
    try {
      return await db
        .select()
        .from(reviewRequests)
        .where(eq(reviewRequests.requesterId, requesterId))
        .limit(limit);
    } catch (error) {
      console.error(`Error getting review requests by requester ${requesterId}:`, error);
      return [];
    }
  }

  async getReviewRequestsByReviewer(reviewerId: number, limit = 50): Promise<ReviewRequest[]> {
    try {
      return await db
        .select()
        .from(reviewRequests)
        .where(eq(reviewRequests.reviewerId, reviewerId))
        .limit(limit);
    } catch (error) {
      console.error(`Error getting review requests by reviewer ${reviewerId}:`, error);
      return [];
    }
  }

  async getReviewRequestsByObject(
    objectType: string,
    objectId: number,
    limit = 50
  ): Promise<ReviewRequest[]> {
    try {
      return await db
        .select()
        .from(reviewRequests)
        .where(
          and(eq(reviewRequests.objectType, objectType), eq(reviewRequests.objectId, objectId))
        )
        .limit(limit);
    } catch (error) {
      console.error(`Error getting review requests for ${objectType} ${objectId}:`, error);
      return [];
    }
  }

  async getReviewRequestsByStatus(status: string, limit = 50): Promise<ReviewRequest[]> {
    try {
      return await db
        .select()
        .from(reviewRequests)
        .where(eq(reviewRequests.status, status))
        .limit(limit);
    } catch (error) {
      console.error(`Error getting review requests with status ${status}:`, error);
      return [];
    }
  }

  async createReviewRequest(insertRequest: InsertReviewRequest): Promise<ReviewRequest> {
    try {
      const [request] = await db.insert(reviewRequests).values(insertRequest).returning();
      return request;
    } catch (error) {
      console.error("Error creating review request:", error);
      throw new Error("Failed to create review request");
    }
  }

  async updateReviewRequest(
    id: number,
    request: Partial<InsertReviewRequest>
  ): Promise<ReviewRequest | undefined> {
    try {
      const [updatedRequest] = await db
        .update(reviewRequests)
        .set({
          ...request,
          updatedAt: new Date(),
        })
        .where(eq(reviewRequests.id, id))
        .returning();

      return updatedRequest;
    } catch (error) {
      console.error(`Error updating review request ${id}:`, error);
      return undefined;
    }
  }

  async completeReviewRequest(id: number, approved: boolean): Promise<ReviewRequest | undefined> {
    try {
      const now = new Date();
      const [completedRequest] = await db
        .update(reviewRequests)
        .set({
          status: "completed",
          approved,
          completedAt: now,
          updatedAt: now,
        })
        .where(eq(reviewRequests.id, id))
        .returning();

      return completedRequest;
    } catch (error) {
      console.error(`Error completing review request ${id}:`, error);
      return undefined;
    }
  }

  async deleteReviewRequest(id: number): Promise<boolean> {
    try {
      await db.delete(reviewRequests).where(eq(reviewRequests.id, id));

      return true;
    } catch (error) {
      console.error(`Error deleting review request ${id}:`, error);
      return false;
    }
  }

  // ===== COMMENT METHODS =====

  async getComment(id: number): Promise<Comment | undefined> {
    try {
      const [comment] = await db.select().from(comments).where(eq(comments.id, id));
      return comment;
    } catch (error) {
      console.error(`Error getting comment ${id}:`, error);
      return undefined;
    }
  }

  async getCommentsByObject(objectType: string, objectId: number): Promise<Comment[]> {
    try {
      return await db
        .select()
        .from(comments)
        .where(and(eq(comments.objectType, objectType), eq(comments.objectId, objectId)));
    } catch (error) {
      console.error(`Error getting comments for ${objectType} ${objectId}:`, error);
      return [];
    }
  }

  async getCommentsByUser(userId: number, limit = 50): Promise<Comment[]> {
    try {
      return await db.select().from(comments).where(eq(comments.userId, userId)).limit(limit);
    } catch (error) {
      console.error(`Error getting comments by user ${userId}:`, error);
      return [];
    }
  }

  async getCommentsByThread(threadId: number): Promise<Comment[]> {
    try {
      return await db.select().from(comments).where(eq(comments.threadId, threadId));
    } catch (error) {
      console.error(`Error getting comments for thread ${threadId}:`, error);
      return [];
    }
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    try {
      const [comment] = await db.insert(comments).values(insertComment).returning();
      return comment;
    } catch (error) {
      console.error("Error creating comment:", error);
      throw new Error("Failed to create comment");
    }
  }

  async updateComment(id: number, comment: Partial<InsertComment>): Promise<Comment | undefined> {
    try {
      const [updatedComment] = await db
        .update(comments)
        .set({
          ...comment,
          updatedAt: new Date(),
        })
        .where(eq(comments.id, id))
        .returning();

      return updatedComment;
    } catch (error) {
      console.error(`Error updating comment ${id}:`, error);
      return undefined;
    }
  }

  async deleteComment(id: number): Promise<boolean> {
    try {
      await db.delete(comments).where(eq(comments.id, id));
      return true;
    } catch (error) {
      console.error(`Error deleting comment ${id}:`, error);
      return false;
    }
  }

  // ===== ANNOTATION METHODS =====

  async getAnnotation(id: number): Promise<Annotation | undefined> {
    try {
      const [annotation] = await db.select().from(annotations).where(eq(annotations.id, id));
      return annotation;
    } catch (error) {
      console.error(`Error getting annotation ${id}:`, error);
      return undefined;
    }
  }

  async getAnnotationsByObject(objectType: string, objectId: number): Promise<Annotation[]> {
    try {
      return await db
        .select()
        .from(annotations)
        .where(and(eq(annotations.objectType, objectType), eq(annotations.objectId, objectId)));
    } catch (error) {
      console.error(`Error getting annotations for ${objectType} ${objectId}:`, error);
      return [];
    }
  }

  async getAnnotationsByUser(userId: number, limit = 50): Promise<Annotation[]> {
    try {
      return await db.select().from(annotations).where(eq(annotations.userId, userId)).limit(limit);
    } catch (error) {
      console.error(`Error getting annotations by user ${userId}:`, error);
      return [];
    }
  }

  async createAnnotation(insertAnnotation: InsertAnnotation): Promise<Annotation> {
    try {
      const [annotation] = await db.insert(annotations).values(insertAnnotation).returning();
      return annotation;
    } catch (error) {
      console.error("Error creating annotation:", error);
      throw new Error("Failed to create annotation");
    }
  }

  async updateAnnotation(
    id: number,
    annotation: Partial<InsertAnnotation>
  ): Promise<Annotation | undefined> {
    try {
      const [updatedAnnotation] = await db
        .update(annotations)
        .set({
          ...annotation,
          updatedAt: new Date(),
        })
        .where(eq(annotations.id, id))
        .returning();

      return updatedAnnotation;
    } catch (error) {
      console.error(`Error updating annotation ${id}:`, error);
      return undefined;
    }
  }

  async deleteAnnotation(id: number): Promise<boolean> {
    try {
      await db.delete(annotations).where(eq(annotations.id, id));
      return true;
    } catch (error) {
      console.error(`Error deleting annotation ${id}:`, error);
      return false;
    }
  }

  // ===== REVISION HISTORY METHODS =====

  async getRevisionHistory(id: number): Promise<RevisionHistory | undefined> {
    try {
      const [history] = await db.select().from(revisionHistory).where(eq(revisionHistory.id, id));
      return history;
    } catch (error) {
      console.error(`Error getting revision history ${id}:`, error);
      return undefined;
    }
  }

  async getRevisionHistoryByObject(
    objectType: string,
    objectId: number,
    limit = 100
  ): Promise<RevisionHistory[]> {
    try {
      return await db
        .select()
        .from(revisionHistory)
        .where(
          and(eq(revisionHistory.objectType, objectType), eq(revisionHistory.objectId, objectId))
        )
        .orderBy(desc(revisionHistory.createdAt))
        .limit(limit);
    } catch (error) {
      console.error(`Error getting revision history for ${objectType} ${objectId}:`, error);
      return [];
    }
  }

  async getRevisionHistoryByUser(userId: number, limit = 50): Promise<RevisionHistory[]> {
    try {
      return await db
        .select()
        .from(revisionHistory)
        .where(eq(revisionHistory.userId, userId))
        .orderBy(desc(revisionHistory.createdAt))
        .limit(limit);
    } catch (error) {
      console.error(`Error getting revision history by user ${userId}:`, error);
      return [];
    }
  }

  async createRevisionHistory(insertHistory: InsertRevisionHistory): Promise<RevisionHistory> {
    try {
      const [history] = await db.insert(revisionHistory).values(insertHistory).returning();
      return history;
    } catch (error) {
      console.error("Error creating revision history:", error);
      throw new Error("Failed to create revision history");
    }
  }

  // ===== LEGACY IMPORT JOB METHODS =====

  async getLegacyImportJob(id: number): Promise<LegacyImportJob | undefined> {
    try {
      const [job] = await db.select().from(legacyImportJobs).where(eq(legacyImportJobs.id, id));
      return job;
    } catch (error) {
      console.error(`Error getting legacy import job ${id}:`, error);
      return undefined;
    }
  }

  async getLegacyImportJobsByUser(userId: number, limit = 50): Promise<LegacyImportJob[]> {
    try {
      return await db
        .select()
        .from(legacyImportJobs)
        .where(eq(legacyImportJobs.createdById, userId))
        .orderBy(desc(legacyImportJobs.createdAt))
        .limit(limit);
    } catch (error) {
      console.error(`Error getting legacy import jobs by user ${userId}:`, error);
      return [];
    }
  }

  async getLegacyImportJobsByStatus(status: string, limit = 50): Promise<LegacyImportJob[]> {
    try {
      return await db
        .select()
        .from(legacyImportJobs)
        .where(eq(legacyImportJobs.status, status))
        .orderBy(desc(legacyImportJobs.createdAt))
        .limit(limit);
    } catch (error) {
      console.error(`Error getting legacy import jobs by status ${status}:`, error);
      return [];
    }
  }

  async createLegacyImportJob(insertJob: InsertLegacyImportJob): Promise<LegacyImportJob> {
    try {
      const [job] = await db.insert(legacyImportJobs).values(insertJob).returning();
      return job;
    } catch (error) {
      console.error("Error creating legacy import job:", error);
      throw new Error("Failed to create legacy import job");
    }
  }

  async updateLegacyImportJob(
    id: number,
    job: Partial<InsertLegacyImportJob>
  ): Promise<LegacyImportJob | undefined> {
    try {
      const [updatedJob] = await db
        .update(legacyImportJobs)
        .set({
          ...job,
          updatedAt: new Date(),
        })
        .where(eq(legacyImportJobs.id, id))
        .returning();

      return updatedJob;
    } catch (error) {
      console.error(`Error updating legacy import job ${id}:`, error);
      return undefined;
    }
  }

  async deleteLegacyImportJob(id: number): Promise<boolean> {
    try {
      await db.delete(legacyImportJobs).where(eq(legacyImportJobs.id, id));
      return true;
    } catch (error) {
      console.error(`Error deleting legacy import job ${id}:`, error);
      return false;
    }
  }

  // ===== LEGACY IMPORT RECORD METHODS =====

  async getLegacyImportRecord(id: number): Promise<LegacyImportRecord | undefined> {
    try {
      const [record] = await db
        .select()
        .from(legacyImportRecords)
        .where(eq(legacyImportRecords.id, id));
      return record;
    } catch (error) {
      console.error(`Error getting legacy import record ${id}:`, error);
      return undefined;
    }
  }

  async getLegacyImportRecordsByJob(jobId: number): Promise<LegacyImportRecord[]> {
    try {
      return await db
        .select()
        .from(legacyImportRecords)
        .where(eq(legacyImportRecords.jobId, jobId))
        .orderBy(desc(legacyImportRecords.createdAt));
    } catch (error) {
      console.error(`Error getting legacy import records by job ${jobId}:`, error);
      return [];
    }
  }

  async getLegacyImportRecordsByStatus(status: string, limit = 50): Promise<LegacyImportRecord[]> {
    try {
      return await db
        .select()
        .from(legacyImportRecords)
        .where(eq(legacyImportRecords.importStatus, status))
        .orderBy(desc(legacyImportRecords.createdAt))
        .limit(limit);
    } catch (error) {
      console.error(`Error getting legacy import records by status ${status}:`, error);
      return [];
    }
  }

  async createLegacyImportRecord(
    insertRecord: InsertLegacyImportRecord
  ): Promise<LegacyImportRecord> {
    try {
      const [record] = await db.insert(legacyImportRecords).values(insertRecord).returning();
      return record;
    } catch (error) {
      console.error("Error creating legacy import record:", error);
      throw new Error("Failed to create legacy import record");
    }
  }

  async updateLegacyImportRecord(
    id: number,
    record: Partial<InsertLegacyImportRecord>
  ): Promise<LegacyImportRecord | undefined> {
    try {
      const [updatedRecord] = await db
        .update(legacyImportRecords)
        .set(record)
        .where(eq(legacyImportRecords.id, id))
        .returning();

      return updatedRecord;
    } catch (error) {
      console.error(`Error updating legacy import record ${id}:`, error);
      return undefined;
    }
  }

  async deleteLegacyImportRecord(id: number): Promise<boolean> {
    try {
      await db.delete(legacyImportRecords).where(eq(legacyImportRecords.id, id));
      return true;
    } catch (error) {
      console.error(`Error deleting legacy import record ${id}:`, error);
      return false;
    }
  }

  // ===== LEGACY SYSTEM TEMPLATE METHODS =====

  async getLegacySystemTemplate(id: number): Promise<LegacySystemTemplate | undefined> {
    try {
      const [template] = await db
        .select()
        .from(legacySystemTemplates)
        .where(eq(legacySystemTemplates.id, id));
      return template;
    } catch (error) {
      console.error(`Error getting legacy system template ${id}:`, error);
      return undefined;
    }
  }

  async getLegacySystemTemplatesByType(systemType: string): Promise<LegacySystemTemplate[]> {
    try {
      return await db
        .select()
        .from(legacySystemTemplates)
        .where(
          and(
            eq(legacySystemTemplates.systemType, systemType),
            eq(legacySystemTemplates.isActive, true)
          )
        )
        .orderBy(desc(legacySystemTemplates.createdAt));
    } catch (error) {
      console.error(`Error getting legacy system templates by type ${systemType}:`, error);
      return [];
    }
  }

  async getLegacySystemTemplatesByOrganization(orgId: number): Promise<LegacySystemTemplate[]> {
    try {
      return await db
        .select()
        .from(legacySystemTemplates)
        .where(
          and(
            eq(legacySystemTemplates.organizationId, orgId),
            eq(legacySystemTemplates.isActive, true)
          )
        )
        .orderBy(desc(legacySystemTemplates.createdAt));
    } catch (error) {
      console.error(`Error getting legacy system templates by organization ${orgId}:`, error);
      return [];
    }
  }

  async getAllActiveLegacySystemTemplates(): Promise<LegacySystemTemplate[]> {
    try {
      return await db
        .select()
        .from(legacySystemTemplates)
        .where(eq(legacySystemTemplates.isActive, true))
        .orderBy(desc(legacySystemTemplates.createdAt));
    } catch (error) {
      console.error("Error getting all active legacy system templates:", error);
      return [];
    }
  }

  async createLegacySystemTemplate(
    insertTemplate: InsertLegacySystemTemplate
  ): Promise<LegacySystemTemplate> {
    try {
      const [template] = await db.insert(legacySystemTemplates).values(insertTemplate).returning();
      return template;
    } catch (error) {
      console.error("Error creating legacy system template:", error);
      throw new Error("Failed to create legacy system template");
    }
  }

  async updateLegacySystemTemplate(
    id: number,
    template: Partial<InsertLegacySystemTemplate>
  ): Promise<LegacySystemTemplate | undefined> {
    try {
      const [updatedTemplate] = await db
        .update(legacySystemTemplates)
        .set({
          ...template,
          updatedAt: new Date(),
        })
        .where(eq(legacySystemTemplates.id, id))
        .returning();

      return updatedTemplate;
    } catch (error) {
      console.error(`Error updating legacy system template ${id}:`, error);
      return undefined;
    }
  }

  async deleteLegacySystemTemplate(id: number): Promise<boolean> {
    try {
      await db.delete(legacySystemTemplates).where(eq(legacySystemTemplates.id, id));
      return true;
    } catch (error) {
      console.error(`Error deleting legacy system template ${id}:`, error);
      return false;
    }
  }
}

// Export an instance of the storage implementation
export const storage = new DatabaseStorage();

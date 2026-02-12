import {
  users,
  User,
  InsertUser,
  properties,
  Property,
  InsertProperty,
  appraisalReports,
  AppraisalReport,
  InsertAppraisalReport,
  comparables,
  Comparable,
  InsertComparable,
  adjustments,
  Adjustment,
  InsertAdjustment,
  photos,
  Photo,
  InsertPhoto,
  sketches,
  Sketch,
  InsertSketch,
  complianceChecks,
  ComplianceCheck,
  InsertComplianceCheck,
  adjustmentModels,
  AdjustmentModel,
  InsertAdjustmentModel,
  modelAdjustments,
  ModelAdjustment,
  InsertModelAdjustment,
  marketAnalysis,
  MarketAnalysis,
  InsertMarketAnalysis,
  userPreferences,
  UserPreference,
  InsertUserPreference,
  adjustmentTemplates,
  AdjustmentTemplate,
  InsertAdjustmentTemplate,
  adjustmentRules,
  AdjustmentRule,
  InsertAdjustmentRule,
  adjustmentHistory,
  AdjustmentHistory,
  InsertAdjustmentHistory,
  collaborationComments,
  CollaborationComment,
  InsertCollaborationComment,
  marketData,
  MarketData,
  InsertMarketData,
  // Order entities
  orders,
  Order,
  InsertOrder,
  // Terminology entities
  realEstateTerms,
  RealEstateTerm,
  InsertRealEstateTerm,
  // Field Notes entities
  fieldNotes,
  // Gamification system entities
  achievementDefinitions,
  AchievementDefinition,
  InsertAchievementDefinition,
  userAchievements,
  UserAchievement,
  InsertUserAchievement,
  levels,
  Level,
  InsertLevel,
  userProgress,
  UserProgress,
  InsertUserProgress,
  userChallenges,
  UserChallenge,
  InsertUserChallenge,
  userNotifications,
  UserNotification,
  InsertUserNotification,
  // File import system
  fileImportResults,
  FileImportResult,
  InsertFileImportResult,
} from "@shared/schema";

// Extend the storage interface to support all our models
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Property operations
  getProperty(id: number): Promise<Property | undefined>;
  getPropertiesByUser(userId: number): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property | undefined>;
  deleteProperty(id: number): Promise<boolean>;

  // Appraisal report operations
  getAppraisalReport(id: number): Promise<AppraisalReport | undefined>;
  getAppraisalReportsByUser(userId: number): Promise<AppraisalReport[]>;
  getAppraisalReportsByProperty(propertyId: number): Promise<AppraisalReport[]>;
  createAppraisalReport(report: InsertAppraisalReport): Promise<AppraisalReport>;
  updateAppraisalReport(
    id: number,
    report: Partial<InsertAppraisalReport>
  ): Promise<AppraisalReport | undefined>;
  deleteAppraisalReport(id: number): Promise<boolean>;

  // Comparable operations
  getComparable(id: number): Promise<Comparable | undefined>;
  getComparablesByReport(reportId: number): Promise<Comparable[]>;
  createComparable(comparable: InsertComparable): Promise<Comparable>;
  updateComparable(
    id: number,
    comparable: Partial<InsertComparable>
  ): Promise<Comparable | undefined>;
  deleteComparable(id: number): Promise<boolean>;

  // Adjustment operations
  getAdjustment(id: number): Promise<Adjustment | undefined>;
  getAdjustmentsByReport(reportId: number): Promise<Adjustment[]>;
  getAdjustmentsByComparable(comparableId: number): Promise<Adjustment[]>;
  createAdjustment(adjustment: InsertAdjustment): Promise<Adjustment>;
  updateAdjustment(
    id: number,
    adjustment: Partial<InsertAdjustment>
  ): Promise<Adjustment | undefined>;
  deleteAdjustment(id: number): Promise<boolean>;

  // Photo operations
  getPhoto(id: number): Promise<Photo | undefined>;
  getPhotosByReport(reportId: number): Promise<Photo[]>;
  createPhoto(photo: InsertPhoto): Promise<Photo>;
  updatePhoto(id: number, photo: Partial<InsertPhoto>): Promise<Photo | undefined>;
  deletePhoto(id: number): Promise<boolean>;

  // Sketch operations
  getSketch(id: number): Promise<Sketch | undefined>;
  getSketchesByReport(reportId: number): Promise<Sketch[]>;
  createSketch(sketch: InsertSketch): Promise<Sketch>;
  updateSketch(id: number, sketch: Partial<InsertSketch>): Promise<Sketch | undefined>;
  deleteSketch(id: number): Promise<boolean>;

  // Compliance operations
  getComplianceCheck(id: number): Promise<ComplianceCheck | undefined>;
  getComplianceChecksByReport(reportId: number): Promise<ComplianceCheck[]>;
  createComplianceCheck(check: InsertComplianceCheck): Promise<ComplianceCheck>;
  deleteComplianceCheck(id: number): Promise<boolean>;

  // File import operations
  createFileImportResult(result: InsertFileImportResult): Promise<FileImportResult>;
  getFileImportResult(id: string): Promise<FileImportResult | undefined>;
  getFileImportResults(limit?: number, offset?: number): Promise<FileImportResult[]>;

  // Adjustment Model operations
  getAdjustmentModel(id: number): Promise<AdjustmentModel | undefined>;
  getAdjustmentModelsByReport(reportId: number): Promise<AdjustmentModel[]>;
  createAdjustmentModel(model: InsertAdjustmentModel): Promise<AdjustmentModel>;
  updateAdjustmentModel(
    id: number,
    model: Partial<InsertAdjustmentModel>
  ): Promise<AdjustmentModel | undefined>;
  deleteAdjustmentModel(id: number): Promise<boolean>;

  // Model Adjustment operations
  getModelAdjustment(id: number): Promise<ModelAdjustment | undefined>;
  getModelAdjustmentsByModel(modelId: number): Promise<ModelAdjustment[]>;
  getModelAdjustmentsByComparable(
    comparableId: number,
    modelId?: number
  ): Promise<ModelAdjustment[]>;
  createModelAdjustment(adjustment: InsertModelAdjustment): Promise<ModelAdjustment>;
  updateModelAdjustment(
    id: number,
    adjustment: Partial<InsertModelAdjustment>
  ): Promise<ModelAdjustment | undefined>;
  deleteModelAdjustment(id: number): Promise<boolean>;

  // Market Analysis operations
  getMarketAnalysis(id: number): Promise<MarketAnalysis | undefined>;
  getMarketAnalysesByReport(reportId: number): Promise<MarketAnalysis[]>;
  getMarketAnalysisByType(
    reportId: number,
    analysisType: string
  ): Promise<MarketAnalysis | undefined>;
  createMarketAnalysis(analysis: InsertMarketAnalysis): Promise<MarketAnalysis>;
  updateMarketAnalysis(
    id: number,
    analysis: Partial<InsertMarketAnalysis>
  ): Promise<MarketAnalysis | undefined>;
  deleteMarketAnalysis(id: number): Promise<boolean>;

  // User Preference operations
  getUserPreference(id: number): Promise<UserPreference | undefined>;
  getUserPreferencesByUser(userId: number): Promise<UserPreference[]>;
  getUserPreferenceByName(
    userId: number,
    preferenceName: string
  ): Promise<UserPreference | undefined>;
  createUserPreference(preference: InsertUserPreference): Promise<UserPreference>;
  updateUserPreference(
    id: number,
    preference: Partial<InsertUserPreference>
  ): Promise<UserPreference | undefined>;
  deleteUserPreference(id: number): Promise<boolean>;

  // Adjustment Template operations
  getAdjustmentTemplate(id: number): Promise<AdjustmentTemplate | undefined>;
  getAdjustmentTemplatesByUser(userId: number): Promise<AdjustmentTemplate[]>;
  getPublicAdjustmentTemplates(): Promise<AdjustmentTemplate[]>;
  getAdjustmentTemplatesByPropertyType(propertyType: string): Promise<AdjustmentTemplate[]>;
  createAdjustmentTemplate(template: InsertAdjustmentTemplate): Promise<AdjustmentTemplate>;
  updateAdjustmentTemplate(
    id: number,
    template: Partial<InsertAdjustmentTemplate>
  ): Promise<AdjustmentTemplate | undefined>;
  deleteAdjustmentTemplate(id: number): Promise<boolean>;

  // Adjustment Rule operations
  getAdjustmentRule(id: number): Promise<AdjustmentRule | undefined>;
  getAdjustmentRulesByUser(userId: number): Promise<AdjustmentRule[]>;
  getAdjustmentRulesByModel(modelId: number): Promise<AdjustmentRule[]>;
  getActiveAdjustmentRules(userId: number): Promise<AdjustmentRule[]>;
  createAdjustmentRule(rule: InsertAdjustmentRule): Promise<AdjustmentRule>;
  updateAdjustmentRule(
    id: number,
    rule: Partial<InsertAdjustmentRule>
  ): Promise<AdjustmentRule | undefined>;
  deleteAdjustmentRule(id: number): Promise<boolean>;

  // Adjustment History operations
  getAdjustmentHistory(id: number): Promise<AdjustmentHistory | undefined>;
  getAdjustmentHistoryByUser(userId: number): Promise<AdjustmentHistory[]>;
  getAdjustmentHistoryByAdjustment(adjustmentId: number): Promise<AdjustmentHistory[]>;
  getAdjustmentHistoryByModelAdjustment(modelAdjustmentId: number): Promise<AdjustmentHistory[]>;
  createAdjustmentHistory(history: InsertAdjustmentHistory): Promise<AdjustmentHistory>;

  // Collaboration Comment operations
  getCollaborationComment(id: number): Promise<CollaborationComment | undefined>;
  getCollaborationCommentsByReport(reportId: number): Promise<CollaborationComment[]>;
  getCollaborationCommentsByComparable(comparableId: number): Promise<CollaborationComment[]>;
  getCollaborationCommentsByAdjustment(adjustmentId: number): Promise<CollaborationComment[]>;
  getCollaborationCommentsByModel(modelId: number): Promise<CollaborationComment[]>;
  getCollaborationCommentsByModelAdjustment(
    modelAdjustmentId: number
  ): Promise<CollaborationComment[]>;
  getCollaborationCommentsByStatus(status: string): Promise<CollaborationComment[]>;
  createCollaborationComment(comment: InsertCollaborationComment): Promise<CollaborationComment>;
  updateCollaborationComment(
    id: number,
    comment: Partial<InsertCollaborationComment>
  ): Promise<CollaborationComment | undefined>;
  deleteCollaborationComment(id: number): Promise<boolean>;

  // Market Data operations
  getMarketData(id: number): Promise<MarketData | undefined>;
  getMarketDataByRegion(region: string): Promise<MarketData[]>;
  getMarketDataByType(dataType: string): Promise<MarketData[]>;
  getMarketDataByRegionAndType(region: string, dataType: string): Promise<MarketData[]>;
  getMarketDataByDateRange(startDate: Date, endDate: Date): Promise<MarketData[]>;
  createMarketData(data: InsertMarketData): Promise<MarketData>;
  deleteMarketData(id: number): Promise<boolean>;

  // Order operations
  getOrder(id: number): Promise<Order | undefined>;
  getOrders(): Promise<Order[]>;
  getOrdersByUser(userId: number): Promise<Order[]>;
  getOrdersByProperty(propertyId: number): Promise<Order[]>;
  getOrdersByStatus(status: string): Promise<Order[]>;
  getOrdersByType(type: string): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined>;
  updateOrderStatus(id: number, status: string, notes?: string): Promise<Order | undefined>;
  deleteOrder(id: number): Promise<boolean>;

  // Achievement Definition operations
  getAchievementDefinition(id: number): Promise<AchievementDefinition | undefined>;
  getAchievementDefinitionsByCategory(category: string): Promise<AchievementDefinition[]>;
  getAchievementDefinitionsByType(type: string): Promise<AchievementDefinition[]>;
  getAllAchievementDefinitions(): Promise<AchievementDefinition[]>;
  createAchievementDefinition(
    definition: InsertAchievementDefinition
  ): Promise<AchievementDefinition>;
  updateAchievementDefinition(
    id: number,
    definition: Partial<InsertAchievementDefinition>
  ): Promise<AchievementDefinition | undefined>;
  deleteAchievementDefinition(id: number): Promise<boolean>;

  // User Achievement operations
  getUserAchievement(id: number): Promise<UserAchievement | undefined>;
  getUserAchievementsByUser(userId: number): Promise<UserAchievement[]>;
  getUserAchievementByAchievementAndUser(
    achievementId: number,
    userId: number
  ): Promise<UserAchievement | undefined>;
  getUserAchievementsByStatus(status: string, userId?: number): Promise<UserAchievement[]>;
  createUserAchievement(achievement: InsertUserAchievement): Promise<UserAchievement>;
  updateUserAchievement(
    id: number,
    achievement: Partial<InsertUserAchievement>
  ): Promise<UserAchievement | undefined>;
  deleteUserAchievement(id: number): Promise<boolean>;

  // Level operations
  getLevel(id: number): Promise<Level | undefined>;
  getLevelByPointThreshold(points: number): Promise<Level | undefined>;
  getNextLevel(currentLevelId: number): Promise<Level | undefined>;
  getAllLevels(): Promise<Level[]>;
  createLevel(level: InsertLevel): Promise<Level>;
  updateLevel(id: number, level: Partial<InsertLevel>): Promise<Level | undefined>;
  deleteLevel(id: number): Promise<boolean>;

  // User Progress operations
  getUserProgress(id: number): Promise<UserProgress | undefined>;
  getUserProgressByUser(userId: number): Promise<UserProgress | undefined>;
  createUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  updateUserProgress(
    id: number,
    progress: Partial<InsertUserProgress>
  ): Promise<UserProgress | undefined>;
  addPointsToUserProgress(userId: number, points: number): Promise<UserProgress | undefined>;
  updateStreakDays(userId: number): Promise<UserProgress | undefined>;
  incrementUserProgressStats(
    userId: number,
    field: "completedAchievements" | "completedReports" | "completedAdjustments",
    incrementBy?: number
  ): Promise<UserProgress | undefined>;

  // User Challenge operations
  getUserChallenge(id: number): Promise<UserChallenge | undefined>;
  getUserChallengesByUser(userId: number): Promise<UserChallenge[]>;
  getActiveChallengesByUser(userId: number): Promise<UserChallenge[]>;
  getUserChallengesByType(type: string, userId?: number): Promise<UserChallenge[]>;
  createUserChallenge(challenge: InsertUserChallenge): Promise<UserChallenge>;
  updateUserChallenge(
    id: number,
    challenge: Partial<InsertUserChallenge>
  ): Promise<UserChallenge | undefined>;
  incrementChallengeProgress(id: number, incrementBy?: number): Promise<UserChallenge | undefined>;
  deleteUserChallenge(id: number): Promise<boolean>;

  // User Notification operations
  getUserNotification(id: number): Promise<UserNotification | undefined>;
  getUserNotificationsByUser(userId: number): Promise<UserNotification[]>;
  getUnreadNotificationsByUser(userId: number): Promise<UserNotification[]>;
  getUserNotificationsByType(type: string, userId?: number): Promise<UserNotification[]>;
  createUserNotification(notification: InsertUserNotification): Promise<UserNotification>;
  markNotificationAsRead(id: number): Promise<UserNotification | undefined>;
  markAllUserNotificationsAsRead(userId: number): Promise<boolean>;
  deleteUserNotification(id: number): Promise<boolean>;

  // File Import operations
  getFileImportResult(id: string): Promise<FileImportResult | undefined>;
  getFileImportResults(): Promise<FileImportResult[]>;
  getFileImportResultsByStatus(status: string): Promise<FileImportResult[]>;
  createFileImportResult(result: InsertFileImportResult): Promise<FileImportResult>;
  updateFileImportResult(
    id: string,
    result: Partial<InsertFileImportResult>
  ): Promise<FileImportResult | undefined>;
  deleteFileImportResult(id: string): Promise<boolean>;

  // Property search operations for imports
  getPropertiesByAddress(address: string, city: string, state: string): Promise<Property[]>;
  saveImportResult(result: InsertFileImportResult): Promise<FileImportResult>;

  // Real Estate Term operations
  getRealEstateTerm(id: number): Promise<RealEstateTerm | undefined>;
  getRealEstateTermByName(term: string): Promise<RealEstateTerm | undefined>;
  getAllRealEstateTerms(): Promise<RealEstateTerm[]>;
  getRealEstateTermsByCategory(category: string): Promise<RealEstateTerm[]>;
  getTermsByNames(termNames: string[]): Promise<RealEstateTerm[]>;
  createRealEstateTerm(term: InsertRealEstateTerm): Promise<RealEstateTerm>;
  updateRealEstateTerm(
    id: number,
    term: Partial<InsertRealEstateTerm>
  ): Promise<RealEstateTerm | undefined>;
  deleteRealEstateTerm(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private properties: Map<number, Property>;
  private appraisalReports: Map<number, AppraisalReport>;
  private comparables: Map<number, Comparable>;
  private adjustments: Map<number, Adjustment>;
  private photos: Map<number, Photo>;
  private sketches: Map<number, Sketch>;
  private complianceChecks: Map<number, ComplianceCheck>;
  private realEstateTerms: Map<number, RealEstateTerm>;
  private orders: Map<number, Order>;

  private currentUserId: number;
  private currentPropertyId: number;
  private currentReportId: number;
  private currentComparableId: number;
  private currentAdjustmentId: number;
  private currentPhotoId: number;
  private currentSketchId: number;
  private currentComplianceCheckId: number;
  private currentRealEstateTermId: number;
  private currentOrderId: number;

  constructor() {
    this.users = new Map();
    this.properties = new Map();
    this.appraisalReports = new Map();
    this.comparables = new Map();
    this.adjustments = new Map();
    this.photos = new Map();
    this.sketches = new Map();
    this.complianceChecks = new Map();
    this.realEstateTerms = new Map();
    this.orders = new Map();

    this.currentUserId = 1;
    this.currentPropertyId = 1;
    this.currentReportId = 1;
    this.currentComparableId = 1;
    this.currentAdjustmentId = 1;
    this.currentPhotoId = 1;
    this.currentSketchId = 1;
    this.currentComplianceCheckId = 1;
    this.currentRealEstateTermId = 1;
    this.currentOrderId = 1;

    // Add demo user
    this.users.set(1, {
      id: 1,
      username: "demo",
      password: "password",
      fullName: "John Appraiser",
      company: "ABC Appraisal",
      licenseNumber: "AP12345",
      email: "john@abcappraisal.com",
      phoneNumber: "555-123-4567",
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Property methods
  async getProperty(id: number): Promise<Property | undefined> {
    return this.properties.get(id);
  }

  async getPropertiesByUser(userId: number): Promise<Property[]> {
    return Array.from(this.properties.values()).filter((property) => property.userId === userId);
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const id = this.currentPropertyId++;
    const now = new Date();
    const property: Property = {
      ...insertProperty,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.properties.set(id, property);
    return property;
  }

  async updateProperty(
    id: number,
    updateData: Partial<InsertProperty>
  ): Promise<Property | undefined> {
    const property = this.properties.get(id);
    if (!property) return undefined;

    const updatedProperty: Property = {
      ...property,
      ...updateData,
      updatedAt: new Date(),
    };

    this.properties.set(id, updatedProperty);
    return updatedProperty;
  }

  async deleteProperty(id: number): Promise<boolean> {
    return this.properties.delete(id);
  }

  // Appraisal report methods
  async getAppraisalReport(id: number): Promise<AppraisalReport | undefined> {
    return this.appraisalReports.get(id);
  }

  async getAppraisalReportsByUser(userId: number): Promise<AppraisalReport[]> {
    return Array.from(this.appraisalReports.values()).filter((report) => report.userId === userId);
  }

  async getAppraisalReportsByProperty(propertyId: number): Promise<AppraisalReport[]> {
    return Array.from(this.appraisalReports.values()).filter(
      (report) => report.propertyId === propertyId
    );
  }

  async createAppraisalReport(insertReport: InsertAppraisalReport): Promise<AppraisalReport> {
    const id = this.currentReportId++;
    const now = new Date();
    const report: AppraisalReport = {
      ...insertReport,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.appraisalReports.set(id, report);
    return report;
  }

  async updateAppraisalReport(
    id: number,
    updateData: Partial<InsertAppraisalReport>
  ): Promise<AppraisalReport | undefined> {
    const report = this.appraisalReports.get(id);
    if (!report) return undefined;

    const updatedReport: AppraisalReport = {
      ...report,
      ...updateData,
      updatedAt: new Date(),
    };

    this.appraisalReports.set(id, updatedReport);
    return updatedReport;
  }

  async deleteAppraisalReport(id: number): Promise<boolean> {
    return this.appraisalReports.delete(id);
  }

  // Comparable methods
  async getComparable(id: number): Promise<Comparable | undefined> {
    return this.comparables.get(id);
  }

  async getComparablesByReport(reportId: number): Promise<Comparable[]> {
    return Array.from(this.comparables.values()).filter(
      (comparable) => comparable.reportId === reportId
    );
  }

  async createComparable(insertComparable: InsertComparable): Promise<Comparable> {
    const id = this.currentComparableId++;
    const now = new Date();
    const comparable: Comparable = {
      ...insertComparable,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.comparables.set(id, comparable);
    return comparable;
  }

  async updateComparable(
    id: number,
    updateData: Partial<InsertComparable>
  ): Promise<Comparable | undefined> {
    const comparable = this.comparables.get(id);
    if (!comparable) return undefined;

    const updatedComparable: Comparable = {
      ...comparable,
      ...updateData,
      updatedAt: new Date(),
    };

    this.comparables.set(id, updatedComparable);
    return updatedComparable;
  }

  async deleteComparable(id: number): Promise<boolean> {
    return this.comparables.delete(id);
  }

  // Adjustment methods
  async getAdjustment(id: number): Promise<Adjustment | undefined> {
    return this.adjustments.get(id);
  }

  async getAdjustmentsByReport(reportId: number): Promise<Adjustment[]> {
    return Array.from(this.adjustments.values()).filter(
      (adjustment) => adjustment.reportId === reportId
    );
  }

  async getAdjustmentsByComparable(comparableId: number): Promise<Adjustment[]> {
    return Array.from(this.adjustments.values()).filter(
      (adjustment) => adjustment.comparableId === comparableId
    );
  }

  async createAdjustment(insertAdjustment: InsertAdjustment): Promise<Adjustment> {
    const id = this.currentAdjustmentId++;
    const now = new Date();
    const adjustment: Adjustment = {
      ...insertAdjustment,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.adjustments.set(id, adjustment);
    return adjustment;
  }

  async updateAdjustment(
    id: number,
    updateData: Partial<InsertAdjustment>
  ): Promise<Adjustment | undefined> {
    const adjustment = this.adjustments.get(id);
    if (!adjustment) return undefined;

    const updatedAdjustment: Adjustment = {
      ...adjustment,
      ...updateData,
      updatedAt: new Date(),
    };

    this.adjustments.set(id, updatedAdjustment);
    return updatedAdjustment;
  }

  async deleteAdjustment(id: number): Promise<boolean> {
    return this.adjustments.delete(id);
  }

  // Photo methods
  async getPhoto(id: number): Promise<Photo | undefined> {
    return this.photos.get(id);
  }

  async getPhotosByReport(reportId: number): Promise<Photo[]> {
    return Array.from(this.photos.values()).filter((photo) => photo.reportId === reportId);
  }

  async createPhoto(insertPhoto: InsertPhoto): Promise<Photo> {
    const id = this.currentPhotoId++;
    const now = new Date();
    const photo: Photo = {
      ...insertPhoto,
      id,
      createdAt: now,
    };
    this.photos.set(id, photo);
    return photo;
  }

  async updatePhoto(id: number, updateData: Partial<InsertPhoto>): Promise<Photo | undefined> {
    const photo = this.photos.get(id);
    if (!photo) return undefined;

    const updatedPhoto: Photo = {
      ...photo,
      ...updateData,
    };

    this.photos.set(id, updatedPhoto);
    return updatedPhoto;
  }

  async deletePhoto(id: number): Promise<boolean> {
    return this.photos.delete(id);
  }

  // Sketch methods
  async getSketch(id: number): Promise<Sketch | undefined> {
    return this.sketches.get(id);
  }

  async getSketchesByReport(reportId: number): Promise<Sketch[]> {
    return Array.from(this.sketches.values()).filter((sketch) => sketch.reportId === reportId);
  }

  async createSketch(insertSketch: InsertSketch): Promise<Sketch> {
    const id = this.currentSketchId++;
    const now = new Date();
    const sketch: Sketch = {
      ...insertSketch,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.sketches.set(id, sketch);
    return sketch;
  }

  async updateSketch(id: number, updateData: Partial<InsertSketch>): Promise<Sketch | undefined> {
    const sketch = this.sketches.get(id);
    if (!sketch) return undefined;

    const updatedSketch: Sketch = {
      ...sketch,
      ...updateData,
      updatedAt: new Date(),
    };

    this.sketches.set(id, updatedSketch);
    return updatedSketch;
  }

  async deleteSketch(id: number): Promise<boolean> {
    return this.sketches.delete(id);
  }

  // Compliance check methods
  async getComplianceCheck(id: number): Promise<ComplianceCheck | undefined> {
    return this.complianceChecks.get(id);
  }

  async getComplianceChecksByReport(reportId: number): Promise<ComplianceCheck[]> {
    return Array.from(this.complianceChecks.values()).filter(
      (check) => check.reportId === reportId
    );
  }

  async createComplianceCheck(insertCheck: InsertComplianceCheck): Promise<ComplianceCheck> {
    const id = this.currentComplianceCheckId++;
    const now = new Date();
    const check: ComplianceCheck = {
      ...insertCheck,
      id,
      createdAt: now,
    };
    this.complianceChecks.set(id, check);
    return check;
  }

  async deleteComplianceCheck(id: number): Promise<boolean> {
    return this.complianceChecks.delete(id);
  }

  // Real Estate Term methods
  async getRealEstateTerm(id: number): Promise<RealEstateTerm | undefined> {
    return this.realEstateTerms.get(id);
  }

  async getRealEstateTermByName(term: string): Promise<RealEstateTerm | undefined> {
    return Array.from(this.realEstateTerms.values()).find(
      (realEstateTerm) => realEstateTerm.term.toLowerCase() === term.toLowerCase()
    );
  }

  async getAllRealEstateTerms(): Promise<RealEstateTerm[]> {
    return Array.from(this.realEstateTerms.values());
  }

  async getRealEstateTermsByCategory(category: string): Promise<RealEstateTerm[]> {
    return Array.from(this.realEstateTerms.values()).filter(
      (term) => term.category.toLowerCase() === category.toLowerCase()
    );
  }

  async getTermsByNames(termNames: string[]): Promise<RealEstateTerm[]> {
    const lowerTermNames = termNames.map((name) => name.toLowerCase());
    return Array.from(this.realEstateTerms.values()).filter((term) =>
      lowerTermNames.includes(term.term.toLowerCase())
    );
  }

  async createRealEstateTerm(insertTerm: InsertRealEstateTerm): Promise<RealEstateTerm> {
    const id = this.currentRealEstateTermId++;
    const now = new Date();
    const term: RealEstateTerm = {
      ...insertTerm,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.realEstateTerms.set(id, term);
    return term;
  }

  async updateRealEstateTerm(
    id: number,
    updateData: Partial<InsertRealEstateTerm>
  ): Promise<RealEstateTerm | undefined> {
    const term = this.realEstateTerms.get(id);
    if (!term) return undefined;

    const updatedTerm: RealEstateTerm = {
      ...term,
      ...updateData,
      updatedAt: new Date(),
    };

    this.realEstateTerms.set(id, updatedTerm);
    return updatedTerm;
  }

  async deleteRealEstateTerm(id: number): Promise<boolean> {
    return this.realEstateTerms.delete(id);
  }

  // Order operations
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async getOrdersByUser(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter((order) => order.userId === userId);
  }

  async getOrdersByProperty(propertyId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter((order) => order.propertyId === propertyId);
  }

  async getOrdersByStatus(status: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      (order) => order.status.toLowerCase() === status.toLowerCase()
    );
  }

  async getOrdersByType(type: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      (order) => order.orderType.toLowerCase() === type.toLowerCase()
    );
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const id = this.currentOrderId++;
    const now = new Date();
    const newOrder: Order = {
      ...order,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.orders.set(id, newOrder);
    return newOrder;
  }

  async updateOrder(id: number, orderData: Partial<InsertOrder>): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;

    const updatedOrder: Order = {
      ...order,
      ...orderData,
      updatedAt: new Date(),
    };

    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async updateOrderStatus(id: number, status: string, notes?: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;

    const updatedOrder: Order = {
      ...order,
      status,
      updatedAt: new Date(),
    };

    if (notes) {
      updatedOrder.notes = notes;
    }

    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async deleteOrder(id: number): Promise<boolean> {
    return this.orders.delete(id);
  }
}

import { DatabaseStorage } from "./database-storage";

// Use DatabaseStorage instead of MemStorage
// Type for updating file import result
export interface FileImportResultUpdate {
  status?: "processing" | "completed" | "failed";
  entitiesExtracted?: number;
  errors?: string[];
  warnings?: string[];
}

// Import DatabaseStorage now that we've implemented the Order methods
import { DatabaseStorage } from "./database-storage";

// Use DatabaseStorage for production
export const storage = new DatabaseStorage();

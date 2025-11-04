import { ExtensionPoint, ExtensionPointType } from "./types";

/**
 * Base implementation of an extension point
 */
export class BaseExtensionPoint<T extends { id: string }> implements ExtensionPoint<T> {
  private extensions: Map<string, T> = new Map();

  /**
   * Constructor
   * @param id Extension point ID
   * @param type Extension point type
   * @param description Extension point description
   */
  constructor(
    public readonly id: string,
    public readonly type: ExtensionPointType,
    public readonly description: string
  ) {}

  /**
   * Register an extension with this extension point
   * @param extension The extension to register
   */
  public register(extension: T): void {
    if (this.extensions.has(extension.id)) {
      throw new Error(`Extension with ID ${extension.id} is already registered with ${this.id}`);
    }

    this.extensions.set(extension.id, extension);
    console.log(`Registered extension ${extension.id} with ${this.id}`);
  }

  /**
   * Get all registered extensions
   */
  public getExtensions(): T[] {
    return Array.from(this.extensions.values());
  }

  /**
   * Get an extension by ID
   * @param id The ID of the extension to get
   */
  public getExtension(id: string): T | undefined {
    return this.extensions.get(id);
  }

  /**
   * Remove an extension by ID
   * @param id The ID of the extension to remove
   */
  public removeExtension(id: string): boolean {
    const result = this.extensions.delete(id);

    if (result) {
      console.log(`Removed extension ${id} from ${this.id}`);
    }

    return result;
  }
}

/**
 * Extension Point Manager
 *
 * Manages the registration and discovery of extension points.
 */
export class ExtensionPointManager {
  private static instance: ExtensionPointManager;
  private extensionPoints: Map<string, ExtensionPoint<any>> = new Map();

  /**
   * Private constructor (singleton pattern)
   */
  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): ExtensionPointManager {
    if (!ExtensionPointManager.instance) {
      ExtensionPointManager.instance = new ExtensionPointManager();
    }
    return ExtensionPointManager.instance;
  }

  /**
   * Register an extension point
   * @param extensionPoint The extension point to register
   */
  public registerExtensionPoint<T extends { id: string }>(extensionPoint: ExtensionPoint<T>): void {
    if (this.extensionPoints.has(extensionPoint.id)) {
      throw new Error(`Extension point with ID ${extensionPoint.id} is already registered`);
    }

    this.extensionPoints.set(extensionPoint.id, extensionPoint);
    console.log(`Registered extension point: ${extensionPoint.id} (${extensionPoint.type})`);
  }

  /**
   * Get an extension point by ID
   * @param id The ID of the extension point
   */
  public getExtensionPoint<T extends { id: string }>(id: string): ExtensionPoint<T> | undefined {
    return this.extensionPoints.get(id) as ExtensionPoint<T> | undefined;
  }

  /**
   * Get all extension points of a specific type
   * @param type The type of extension points to get
   */
  public getExtensionPointsByType<T extends { id: string }>(
    type: ExtensionPointType
  ): ExtensionPoint<T>[] {
    return Array.from(this.extensionPoints.values()).filter(
      (ep) => ep.type === type
    ) as ExtensionPoint<T>[];
  }

  /**
   * Get all registered extension points
   */
  public getExtensionPoints(): ExtensionPoint<any>[] {
    return Array.from(this.extensionPoints.values());
  }

  /**
   * Remove an extension point
   * @param id The ID of the extension point to remove
   */
  public removeExtensionPoint(id: string): boolean {
    const result = this.extensionPoints.delete(id);

    if (result) {
      console.log(`Removed extension point: ${id}`);
    }

    return result;
  }

  /**
   * Register an extension with an extension point
   * @param extensionPointId The ID of the extension point
   * @param extension The extension to register
   */
  public registerExtension<T extends { id: string }>(extensionPointId: string, extension: T): void {
    const extensionPoint = this.getExtensionPoint<T>(extensionPointId);

    if (!extensionPoint) {
      throw new Error(`Extension point with ID ${extensionPointId} is not registered`);
    }

    extensionPoint.register(extension);
  }

  /**
   * Get all extensions registered with an extension point
   * @param extensionPointId The ID of the extension point
   */
  public getExtensions<T extends { id: string }>(extensionPointId: string): T[] {
    const extensionPoint = this.getExtensionPoint<T>(extensionPointId);

    if (!extensionPoint) {
      return [];
    }

    return extensionPoint.getExtensions();
  }

  /**
   * Get an extension from an extension point
   * @param extensionPointId The ID of the extension point
   * @param extensionId The ID of the extension
   */
  public getExtension<T extends { id: string }>(
    extensionPointId: string,
    extensionId: string
  ): T | undefined {
    const extensionPoint = this.getExtensionPoint<T>(extensionPointId);

    if (!extensionPoint) {
      return undefined;
    }

    return extensionPoint.getExtension(extensionId);
  }

  /**
   * Remove an extension from an extension point
   * @param extensionPointId The ID of the extension point
   * @param extensionId The ID of the extension
   */
  public removeExtension(extensionPointId: string, extensionId: string): boolean {
    const extensionPoint = this.getExtensionPoint(extensionPointId);

    if (!extensionPoint) {
      return false;
    }

    return extensionPoint.removeExtension(extensionId);
  }

  /**
   * Create a new extension point
   * @param id Extension point ID
   * @param type Extension point type
   * @param description Extension point description
   */
  public createExtensionPoint<T extends { id: string }>(
    id: string,
    type: ExtensionPointType,
    description: string
  ): ExtensionPoint<T> {
    const extensionPoint = new BaseExtensionPoint<T>(id, type, description);
    this.registerExtensionPoint(extensionPoint);
    return extensionPoint;
  }
}

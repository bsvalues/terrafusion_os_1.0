/**
 * Base Extension Class
 *
 * This abstract class serves as the foundation for all extensions in the platform.
 * It provides lifecycle methods and standardized ways to register functionality.
 */

export type ExtensionMetadata = {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  category: string;
  settings?: Array<{
    id: string;
    label: string;
    description: string;
    type: 'string' | 'number' | 'boolean' | 'select';
    default: any;
    options?: Array<{ value: string; label: string }>;
  }>;
  requiredPermissions?: string[];
};

export type WebviewPanel = {
  id: string;
  title: string;
  content: string;
  contentPreview?: string;
};

export type CommandRegistration = {
  id: string;
  label: string;
  command: string;
  icon?: string;
  parent?: string;
  position?: number;
  children?: CommandRegistration[];
};

export abstract class BaseExtension {
  private _isActive: boolean = false;
  private _webviews: Map<string, WebviewPanel> = new Map();
  private _commands: Map<string, CommandRegistration> = new Map();
  private _settings: Map<string, any> = new Map();

  constructor(protected metadata: ExtensionMetadata) {}

  /**
   * Returns the extension's metadata
   */
  public getMetadata(): ExtensionMetadata {
    return this.metadata;
  }

  /**
   * Returns whether the extension is active
   */
  public isActive(): boolean {
    return this._isActive;
  }

  /**
   * Called when the extension is activated
   */
  public abstract activate(): Promise<void>;

  /**
   * Called when the extension is deactivated
   */
  public abstract deactivate(): Promise<void>;

  /**
   * Internal method to mark the extension as active
   */
  public setActive(active: boolean): void {
    this._isActive = active;
  }

  /**
   * Register a webview panel
   * @param id Unique ID for the webview
   * @param title Title of the webview panel
   * @param content HTML content of the webview
   * @param contentPreview Optional preview text for the webview in listings
   */
  protected registerWebview(
    id: string,
    title: string,
    content: string,
    contentPreview?: string
  ): void {
    this._webviews.set(id, { id, title, content, contentPreview });
  }

  /**
   * Get all registered webviews
   */
  public getWebviews(): WebviewPanel[] {
    return Array.from(this._webviews.values());
  }

  /**
   * Get a specific webview by ID
   */
  public getWebview(id: string): WebviewPanel | undefined {
    return this._webviews.get(id);
  }

  /**
   * Register a command
   */
  protected registerCommand(
    id: string,
    label: string,
    command: string,
    options: {
      icon?: string;
      parent?: string;
      position?: number;
    } = {}
  ): void {
    const { icon, parent, position } = options;

    this._commands.set(id, {
      id,
      label,
      command,
      icon,
      parent,
      position: position || 0,
      children: [],
    });
  }

  /**
   * Get all registered commands
   */
  public getCommands(): CommandRegistration[] {
    return Array.from(this._commands.values());
  }

  /**
   * Get a specific command by ID
   */
  public getCommand(id: string): CommandRegistration | undefined {
    return this._commands.get(id);
  }

  /**
   * Set a setting value
   */
  public setSetting(key: string, value: any): void {
    this._settings.set(key, value);
  }

  /**
   * Get a setting value
   */
  public getSetting(key: string): any {
    const setting = this.metadata.settings?.find(s => s.id === key);

    // If the setting exists, return the value or default
    if (setting) {
      return this._settings.has(key) ? this._settings.get(key) : setting.default;
    }

    return undefined;
  }

  /**
   * Get all settings
   */
  public getSettings(): Record<string, any> {
    const settings: Record<string, any> = {};

    // First fill with defaults from metadata
    this.metadata.settings?.forEach(setting => {
      settings[setting.id] = setting.default;
    });

    // Then override with actual values
    this._settings.forEach((value, key) => {
      settings[key] = value;
    });

    return settings;
  }

  /**
   * Hook called before creating a property record
   */
  public async onBeforePropertyCreate(propertyData: any): Promise<any> {
    return propertyData;
  }

  /**
   * Hook called after creating a property record
   */
  public async onAfterPropertyCreate(property: any): Promise<void> {
    // Default implementation does nothing
  }

  /**
   * Hook called before updating a property record
   */
  public async onBeforePropertyUpdate(propertyId: string, propertyData: any): Promise<any> {
    return propertyData;
  }

  /**
   * Hook called after updating a property record
   */
  public async onAfterPropertyUpdate(propertyId: string, property: any): Promise<void> {
    // Default implementation does nothing
  }

  /**
   * Hook called when the extension receives a message from the frontend
   */
  public async onMessage(message: any): Promise<any> {
    // Default implementation returns empty object
    return {};
  }
}

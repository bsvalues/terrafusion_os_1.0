---
title: Plugin Loader
sidebar_position: 2
---

# Plugin Loader Package

The `plugin-loader` package is a core component of the Terrafusion platform that enables dynamic loading, registration, and execution of plugins. It supports both free and premium plugins with integrated payment processing.

## Package Structure

```
packages/plugin-loader/
├── src/
│   ├── index.ts                # Main export file
│   ├── plugin-loader.ts        # Core plugin loading functionality
│   ├── plugin-registry.ts      # Plugin registration and discovery
│   ├── plugin-payment.ts       # Payment integration for premium plugins
│   ├── interfaces/             # Type definitions
│   │   ├── plugin.ts           # Plugin interface definitions
│   │   └── payment.ts          # Payment interface definitions
│   └── utils/                  # Utility functions
│       ├── validation.ts       # Plugin validation utilities
│       └── sandbox.ts          # Plugin sandbox execution
├── tests/                      # Unit tests
├── package.json
└── tsconfig.json
```

## Core Concepts

### Plugin Interface

All plugins must implement the Plugin interface:

```typescript
// From interfaces/plugin.ts
export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  isPremium: boolean;
  price?: number;
  requiredPermissions: string[];

  initialize(context: PluginContext): Promise<void>;
  activate(): Promise<void>;
  deactivate(): Promise<void>;
  getCapabilities(): PluginCapability[];

  // Optional methods
  onSettingsChange?(settings: Record<string, any>): Promise<void>;
  onUserAction?(action: string, payload: any): Promise<any>;
}
```

### Plugin Loader

The PluginLoader class handles discovery, loading, and lifecycle management of plugins:

```typescript
// From plugin-loader.ts
export class PluginLoader {
  private plugins: Map<string, LoadedPlugin> = new Map();
  private registry: PluginRegistry;
  private paymentProcessor: PluginPaymentProcessor;

  constructor(registry: PluginRegistry, paymentProcessor: PluginPaymentProcessor) {
    this.registry = registry;
    this.paymentProcessor = paymentProcessor;
  }

  async discoverPlugins(): Promise<PluginMetadata[]> {
    return this.registry.discoverAvailablePlugins();
  }

  async loadPlugin(pluginId: string, context: PluginContext): Promise<LoadedPlugin> {
    const pluginMetadata = await this.registry.getPluginMetadata(pluginId);

    // Check if premium and validate license
    if (pluginMetadata.isPremium) {
      const hasValidLicense = await this.paymentProcessor.checkLicense(pluginId, context.userId);

      if (!hasValidLicense) {
        throw new Error(`No valid license for premium plugin: ${pluginId}`);
      }
    }

    // Load and initialize the plugin
    const pluginModule = await this.registry.loadPluginModule(pluginId);
    const plugin = new pluginModule.default() as Plugin;

    await plugin.initialize(context);

    const loadedPlugin = {
      instance: plugin,
      metadata: pluginMetadata,
      status: 'loaded',
    };

    this.plugins.set(pluginId, loadedPlugin);
    return loadedPlugin;
  }

  async activatePlugin(pluginId: string): Promise<void> {
    const loadedPlugin = this.plugins.get(pluginId);
    if (!loadedPlugin) {
      throw new Error(`Plugin not loaded: ${pluginId}`);
    }

    await loadedPlugin.instance.activate();
    loadedPlugin.status = 'active';
  }

  async deactivatePlugin(pluginId: string): Promise<void> {
    const loadedPlugin = this.plugins.get(pluginId);
    if (!loadedPlugin || loadedPlugin.status !== 'active') {
      throw new Error(`Plugin not active: ${pluginId}`);
    }

    await loadedPlugin.instance.deactivate();
    loadedPlugin.status = 'loaded';
  }

  // Additional methods...
}
```

### Payment Integration

Premium plugins use the payment processor for license validation:

```typescript
// From plugin-payment.ts
export class PluginPaymentProcessor {
  private stripeClient: Stripe;
  private licenseStore: LicenseStore;

  constructor(stripeApiKey: string, licenseStore: LicenseStore) {
    this.stripeClient = new Stripe(stripeApiKey);
    this.licenseStore = licenseStore;
  }

  async createSubscription(
    userId: string,
    pluginId: string,
    paymentMethodId: string
  ): Promise<string> {
    // Create Stripe subscription
    const subscription = await this.stripeClient.subscriptions.create({
      customer: await this.getOrCreateCustomer(userId),
      items: [{ price: await this.getPluginPriceId(pluginId) }],
      default_payment_method: paymentMethodId,
    });

    // Store license information
    await this.licenseStore.storeLicense({
      userId,
      pluginId,
      subscriptionId: subscription.id,
      status: 'active',
      expiresAt: new Date(subscription.current_period_end * 1000),
    });

    return subscription.id;
  }

  async checkLicense(pluginId: string, userId: string): Promise<boolean> {
    const license = await this.licenseStore.getLicense(userId, pluginId);

    if (!license) {
      return false;
    }

    // Check if license is active and not expired
    return license.status === 'active' && license.expiresAt > new Date();
  }

  // Additional methods for managing subscriptions, handling webhooks, etc.
}
```

## Usage

### Basic Plugin Loading

```typescript
import { PluginLoader, PluginRegistry, PluginPaymentProcessor } from '@terrafusion/plugin-loader';

// Create the necessary components
const registry = new PluginRegistry({
  pluginsDirectory: '/path/to/plugins',
  manifestFileName: 'plugin.json',
});

const paymentProcessor = new PluginPaymentProcessor(
  process.env.STRIPE_API_KEY,
  new DatabaseLicenseStore(dbConnection)
);

// Create the plugin loader
const pluginLoader = new PluginLoader(registry, paymentProcessor);

// Discover available plugins
const availablePlugins = await pluginLoader.discoverPlugins();
console.log('Available plugins:', availablePlugins);

// Load and activate a plugin
const pluginContext = {
  userId: 'user-123',
  permissionLevel: 'admin',
  settings: {
    /* plugin-specific settings */
  },
};

await pluginLoader.loadPlugin('my-awesome-plugin', pluginContext);
await pluginLoader.activatePlugin('my-awesome-plugin');

// Get plugin capabilities
const loadedPlugin = pluginLoader.getPlugin('my-awesome-plugin');
const capabilities = loadedPlugin.instance.getCapabilities();
```

### Managing Premium Plugins

```typescript
// Check if user has access to a premium plugin
const hasAccess = await paymentProcessor.checkLicense('premium-analysis-plugin', 'user-123');

if (!hasAccess) {
  // Show purchase UI
  const stripeElements = createStripeElements(paymentProcessor.getPublicKey());

  // When payment method is submitted
  const paymentMethodId = await collectPaymentMethod(stripeElements);

  // Create subscription
  await paymentProcessor.createSubscription('user-123', 'premium-analysis-plugin', paymentMethodId);

  // Now load the plugin
  await pluginLoader.loadPlugin('premium-analysis-plugin', pluginContext);
}
```

## Best Practices

1. **Plugin Isolation**: Always run plugins in a sandboxed environment
2. **Permission Checking**: Validate that plugins only access permitted resources
3. **Version Compatibility**: Check plugin compatibility with the platform version
4. **Error Handling**: Gracefully handle plugin failures to prevent system crashes
5. **License Validation**: Regularly validate licenses for premium plugins

/**
 * Plugin Payment Integration
 *
 * Handles plugin payment processing and premium status using Stripe.
 */

import Stripe from 'stripe';
import { PluginManifest } from './manifest-schema';

/**
 * Plugin product definition in Stripe
 */
export const PRODUCT_TERRAFUSION_PLUGIN = 'terrafusion-plugin';

/**
 * Plugin payment configuration
 */
export interface PluginPaymentConfig {
  /**
   * Stripe API key
   */
  stripeApiKey: string;

  /**
   * Stripe webhook secret
   */
  stripeWebhookSecret?: string;

  /**
   * Domain for success/cancel URLs
   */
  domain: string;

  /**
   * Success URL path
   */
  successPath?: string;

  /**
   * Cancel URL path
   */
  cancelPath?: string;
}

/**
 * Plugin purchase session
 */
export interface PluginPurchaseSession {
  /**
   * Session ID
   */
  id: string;

  /**
   * Plugin ID
   */
  pluginId: string;

  /**
   * User ID
   */
  userId: string;

  /**
   * Stripe checkout URL
   */
  url: string;

  /**
   * Session created timestamp
   */
  createdAt: string;

  /**
   * Session expiration timestamp
   */
  expiresAt: string;
}

/**
 * Purchase status result
 */
export interface PurchaseStatusResult {
  /**
   * Whether the plugin is purchased
   */
  purchased: boolean;

  /**
   * Purchase ID if purchased
   */
  purchaseId?: string;

  /**
   * Purchase timestamp if purchased
   */
  purchasedAt?: string;

  /**
   * Whether the purchase is active
   */
  active: boolean;

  /**
   * Subscription ID if applicable
   */
  subscriptionId?: string;

  /**
   * Subscription status if applicable
   */
  subscriptionStatus?: string;

  /**
   * License type (perpetual or subscription)
   */
  licenseType?: 'perpetual' | 'subscription';

  /**
   * Purchase expiration date if applicable
   */
  expiresAt?: string;
}

/**
 * Plugin payment service
 */
export class PluginPaymentService {
  private stripe: Stripe;
  private config: PluginPaymentConfig;

  constructor(config: PluginPaymentConfig) {
    this.config = config;
    this.stripe = new Stripe(config.stripeApiKey, {
      apiVersion: '2023-10-16',
    });
  }

  /**
   * Create a checkout session for a plugin
   */
  public async createCheckoutSession(
    plugin: PluginManifest,
    userId: string,
    options?: {
      successUrl?: string;
      cancelUrl?: string;
      priceId?: string;
      mode?: 'payment' | 'subscription';
    }
  ): Promise<PluginPurchaseSession> {
    // Set defaults
    const mode = options?.mode || 'subscription';
    const successUrl =
      options?.successUrl ||
      `${this.config.domain}${this.config.successPath || '/plugin/success'}?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl =
      options?.cancelUrl ||
      `${this.config.domain}${this.config.cancelPath || '/plugin/cancel'}?session_id={CHECKOUT_SESSION_ID}`;

    // Create or get a price for this plugin
    const priceId = options?.priceId || (await this.getOrCreatePrice(plugin));

    // Create checkout session
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode,
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId,
      metadata: {
        pluginId: plugin.id,
        userId,
      },
    });

    // Build response
    return {
      id: session.id,
      pluginId: plugin.id,
      userId,
      url: session.url || '',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    };
  }

  /**
   * Get or create a Stripe price for a plugin
   */
  private async getOrCreatePrice(plugin: PluginManifest): Promise<string> {
    // Try to find existing product for this plugin
    const products = await this.stripe.products.list({
      active: true,
      metadata: {
        pluginId: plugin.id,
      },
    });

    let product;

    if (products.data.length > 0) {
      // Use existing product
      product = products.data[0];
    } else {
      // Create new product
      product = await this.stripe.products.create({
        name: plugin.name,
        description: plugin.description,
        metadata: {
          pluginId: plugin.id,
          version: plugin.version,
          productType: PRODUCT_TERRAFUSION_PLUGIN,
        },
        images: plugin.screenshots?.map(s => s.url) || [],
      });
    }

    // Try to find existing price for this product
    const prices = await this.stripe.prices.list({
      product: product.id,
      active: true,
    });

    if (prices.data.length > 0) {
      // Use existing price
      return prices.data[0].id;
    }

    // Create new price (default to $9.99/month subscription)
    const price = await this.stripe.prices.create({
      product: product.id,
      unit_amount: 999, // $9.99
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      metadata: {
        pluginId: plugin.id,
      },
    });

    return price.id;
  }

  /**
   * Process a webhook event from Stripe
   */
  public async processWebhook(
    rawBody: string,
    signature: string
  ): Promise<{ pluginId: string; userId: string; event: string; success: boolean }> {
    // In a real implementation, verify the webhook signature

    // For this example, we'll use a placeholder
    const event = {
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: {
            pluginId: 'example-plugin',
            userId: 'example-user',
          },
        },
      },
    };

    // Process different event types
    switch (event.type) {
      case 'checkout.session.completed':
        // Handle successful checkout
        const session = event.data.object;
        const pluginId = session.metadata.pluginId;
        const userId = session.metadata.userId;

        // In a real implementation, update the plugin purchase status in the database

        return {
          pluginId,
          userId,
          event: event.type,
          success: true,
        };

      case 'customer.subscription.deleted':
        // Handle subscription cancellation
        // In a real implementation, update the plugin purchase status in the database
        return {
          pluginId: 'example-plugin',
          userId: 'example-user',
          event: event.type,
          success: true,
        };

      default:
        // Ignore other events
        return {
          pluginId: 'unknown',
          userId: 'unknown',
          event: event.type,
          success: false,
        };
    }
  }

  /**
   * Check if a user has purchased a plugin
   */
  public async checkPurchaseStatus(
    pluginId: string,
    userId: string
  ): Promise<PurchaseStatusResult> {
    // In a real implementation, check the database for purchase records

    // For this example, we'll return a placeholder result
    return {
      purchased: false,
      active: false,
    };
  }

  /**
   * List all plugins purchased by a user
   */
  public async listUserPurchases(
    userId: string
  ): Promise<{ pluginId: string; status: PurchaseStatusResult }[]> {
    // In a real implementation, query the database for user purchases

    // For this example, we'll return an empty array
    return [];
  }

  /**
   * Create a connect account for plugin developers
   */
  public async createConnectAccount(
    email: string,
    name: string,
    country: string
  ): Promise<{ accountId: string; onboardingUrl: string }> {
    // Create a connect account
    const account = await this.stripe.accounts.create({
      type: 'express',
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      business_profile: {
        name,
      },
      country,
    });

    // Create an account link for onboarding
    const accountLink = await this.stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${this.config.domain}/developer/connect/refresh`,
      return_url: `${this.config.domain}/developer/connect/complete`,
      type: 'account_onboarding',
    });

    return {
      accountId: account.id,
      onboardingUrl: accountLink.url,
    };
  }

  /**
   * Check if a plugin developer account is complete
   */
  public async isConnectAccountComplete(accountId: string): Promise<boolean> {
    const account = await this.stripe.accounts.retrieve(accountId);

    // Check if the account is complete and ready to process payments
    return account.charges_enabled && account.details_submitted;
  }
}

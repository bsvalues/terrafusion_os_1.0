/**
 * Extension Routes
 *
 * This module exports Express routes for extension management.
 */

import { Router } from 'express';
import { ExtensionRegistry } from './extension-registry';

// Create the router
const router = Router();

// Extension registry instance
const registry = ExtensionRegistry.getInstance();

// Route prefix constant
const routePrefix = '';

/**
 * GET /api/extensions - Get all extensions
 */
router.get('/', async (req, res) => {
  try {
    if (!registry) {
      console.error('Extension registry is not initialized');
      return res.status(500).json({ error: 'Extension registry is not initialized' });
    }

    const allExtensions = registry.getExtensions();
    const extensions = allExtensions.map(ext => {
      const metadata = ext.getMetadata();
      return {
        id: metadata.id,
        name: metadata.name,
        version: metadata.version,
        description: metadata.description,
        author: metadata.author,
        category: metadata.category,
        active: ext.isActive(),
      };
    });

    res.json(extensions);
  } catch (error) {
    console.error('Error getting extensions:', error);
    res.status(500).json({
      error: 'Failed to get extensions',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/extensions/webviews - Get all webviews from active extensions
 * Note: This route must be defined before the /:id route to prevent conflicts
 */
router.get('/webviews', async (req, res) => {
  try {
    // Log for debugging
    if (!registry) {
      console.error('Extension registry is not initialized');
      return res.status(500).json({ error: 'Extension registry is not initialized' });
    }

    const activeExtensions = registry.getExtensions().filter(ext => ext.isActive());
    .id)
    );

    const webviews = registry.getAllWebviews();
    // Add more details to each webview for better debugging
    const enhancedWebviews = webviews.map(webview => ({
      ...webview,
      extensionDetails: {
        name: registry.getExtension(webview.extensionId)?.getMetadata().name || 'Unknown',
        active: registry.getExtension(webview.extensionId)?.isActive() || false,
      },
    }));

    res.json(enhancedWebviews);
  } catch (error) {
    console.error('Error getting webviews:', error);
    res.status(500).json({
      error: 'Failed to get webviews',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/extensions/webviews/:id - Get a specific webview by ID
 * Note: This route must be defined before the /:id route to prevent conflicts
 */
router.get('/webviews/:id', async (req, res) => {
  try {
    if (!registry) {
      console.error('Extension registry is not initialized');
      return res.status(500).json({ error: 'Extension registry is not initialized' });
    }

    const { id } = req.params;
    const webview = registry.getWebview(id);

    if (!webview) {
      console.error(`Webview '${id}' not found`);
      return res.status(404).json({ error: `Webview '${id}' not found` });
    }

    res.json(webview);
  } catch (error) {
    console.error(`Error getting webview ${req.params.id}:`, error);
    res.status(500).json({
      error: 'Failed to get webview',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/extensions/menu-items - Get all menu items from active extensions
 * Note: This route must be defined before the /:id route to prevent conflicts
 */
router.get('/menu-items', async (req, res) => {
  try {
    const commands = registry.getAllCommands();

    // Build a tree of menu items
    const menuItems = commands
      .filter(item => !item.parent)
      .sort((a, b) => (a.position || 0) - (b.position || 0));

    // Helper function to build the menu tree
    const buildMenuTree = (items: any[], parentId: string): any[] => {
      return items
        .filter(item => item.parent === parentId)
        .map(item => {
          return {
            ...item,
            children: buildMenuTree(commands, item.id),
          };
        })
        .sort((a, b) => (a.position || 0) - (b.position || 0));
    };

    // Add children to root items
    menuItems.forEach(item => {
      item.children = buildMenuTree(commands, item.id);
    });

    res.json(menuItems);
  } catch (error) {
    console.error('Error getting menu items:', error);
    res.status(500).json({ error: 'Failed to get menu items' });
  }
});

/**
 * GET /api/extensions/:id - Get extension by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const extension = registry.getExtension(id);

    if (!extension) {
      return res.status(404).json({ error: `Extension '${id}' not found` });
    }

    const metadata = extension.getMetadata();
    const settings = extension.getSettings();

    res.json({
      id: metadata.id,
      name: metadata.name,
      version: metadata.version,
      description: metadata.description,
      author: metadata.author,
      category: metadata.category,
      active: extension.isActive(),
      metadata,
      settings,
    });
  } catch (error) {
    console.error(`Error getting extension ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to get extension details' });
  }
});

/**
 * POST /api/extensions/:id/activate - Activate an extension
 */
router.post('/:id/activate', async (req, res) => {
  try {
    const { id } = req.params;
    const extension = registry.getExtension(id);

    if (!extension) {
      return res.status(404).json({ error: `Extension '${id}' not found` });
    }

    if (extension.isActive()) {
      return res.json({ message: `Extension '${id}' is already active` });
    }

    await registry.activateExtension(id);

    res.json({
      success: true,
      message: `Extension '${extension.getMetadata().name}' activated successfully`,
    });
  } catch (error) {
    console.error(`Error activating extension ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to activate extension' });
  }
});

/**
 * POST /api/extensions/:id/deactivate - Deactivate an extension
 */
router.post('/:id/deactivate', async (req, res) => {
  try {
    const { id } = req.params;
    const extension = registry.getExtension(id);

    if (!extension) {
      return res.status(404).json({ error: `Extension '${id}' not found` });
    }

    if (!extension.isActive()) {
      return res.json({ message: `Extension '${id}' is already inactive` });
    }

    await registry.deactivateExtension(id);

    res.json({
      success: true,
      message: `Extension '${extension.getMetadata().name}' deactivated successfully`,
    });
  } catch (error) {
    console.error(`Error deactivating extension ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to deactivate extension' });
  }
});

/**
 * POST /api/extensions/:id/settings - Update extension settings
 */
router.post('/:id/settings', async (req, res) => {
  try {
    const { id } = req.params;
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Invalid settings object' });
    }

    const extension = registry.getExtension(id);

    if (!extension) {
      return res.status(404).json({ error: `Extension '${id}' not found` });
    }

    // Update each setting
    Object.entries(settings).forEach(([key, value]) => {
      const settingDef = extension.getMetadata().settings?.find(s => s.id === key);

      if (!settingDef) {
        return; // Skip unknown settings
      }

      // Validate setting type
      let typedValue = value;

      // Convert value based on the expected type
      if (settingDef.type === 'number' && typeof value === 'string') {
        const parsedValue = parseFloat(value);
        if (isNaN(parsedValue)) {
          return; // Skip invalid numbers
        }
        typedValue = parsedValue;
      } else if (settingDef.type === 'boolean' && typeof value === 'string') {
        typedValue = value.toLowerCase() === 'true';
      } else if (settingDef.type === 'select' && settingDef.options) {
        const isValid = settingDef.options.some(option => option.value === value);
        if (!isValid) {
          return; // Skip invalid options
        }
      }

      extension.setSetting(key, typedValue);
    });

    res.json({
      success: true,
      message: `Settings for extension '${extension.getMetadata().name}' updated successfully`,
      settings: extension.getSettings(),
    });
  } catch (error) {
    console.error(`Error updating settings for extension ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update extension settings' });
  }
});

/**
 * POST /api/extensions/:id/command/:command - Execute an extension command
 */
router.post('/:id/command/:command', async (req, res) => {
  try {
    const { id, command } = req.params;
    const extension = registry.getExtension(id);

    if (!extension) {
      return res.status(404).json({ error: `Extension '${id}' not found` });
    }

    if (!extension.isActive()) {
      return res.status(400).json({ error: `Extension '${id}' is not active` });
    }

    const result = await registry.sendMessageToExtension(id, {
      command,
      ...req.body,
    });

    res.json(result);
  } catch (error) {
    console.error(`Error executing command for extension ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to execute extension command' });
  }
});

/**
 * GET /api/extensions/:id/webviews/:webviewId - Get webview content
 */
router.get('/:id/webviews/:webviewId', async (req, res) => {
  try {
    const { id, webviewId } = req.params;
    const extension = registry.getExtension(id);

    if (!extension) {
      console.error(`Extension '${id}' not found`);
      return res.status(404).json({ error: `Extension '${id}' not found` });
    }

    if (!extension.isActive()) {
      console.error(`Extension '${id}' is not active`);
      return res.status(400).json({ error: `Extension '${id}' is not active` });
    }

    // Retrieve the webview info from registry
    const webview = registry.getWebview(webviewId);
    if (!webview) {
      console.error(`Webview '${webviewId}' not found`);
      return res.status(404).json({ error: `Webview '${webviewId}' not found` });
    }

    if (webview.extensionId !== id) {
      console.error(`Webview '${webviewId}' does not belong to extension '${id}'`);
      return res.status(400).json({
        error: `Webview '${webviewId}' does not belong to extension '${id}'`,
        actualExtensionId: webview.extensionId,
      });
    }

    // Get the webview content from the extension
    const contentTemplate = await registry.getWebviewContent(id, webviewId);
    if (!contentTemplate) {
      console.error(`Failed to get content for webview '${webviewId}'`);
      return res.status(500).json({ error: `Failed to get content for webview '${webviewId}'` });
    }

    // Return the content as HTML
    res.header('Content-Type', 'text/html');
    res.send(contentTemplate);
  } catch (error) {
    console.error(
      `Error getting webview content for extension ${req.params.id}, webview ${req.params.webviewId}:`,
      error
    );
    res.status(500).json({
      error: 'Failed to get webview content',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;


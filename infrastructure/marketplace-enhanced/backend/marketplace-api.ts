import express from 'express';
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

// Plugin schema
const PluginSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3).max(50),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  description: z.string().max(500),
  author: z.string(),
  category: z.enum(['visualization', 'analysis', 'integration', 'utility', 'ai']),
  tags: z.array(z.string()).max(10),
  icon: z.string().optional(),
  readme: z.string().optional(),
  homepage: z.string().url().optional(),
  repository: z.string().url().optional(),
  license: z.string(),
  compatibility: z.object({
    minVersion: z.string(),
    maxVersion: z.string().optional(),
    platforms: z.array(z.enum(['windows', 'macos', 'linux'])).optional(),
  }),
  dependencies: z
    .array(
      z.object({
        name: z.string(),
        version: z.string(),
      })
    )
    .optional(),
  manifest: z.object({
    main: z.string(),
    activationEvents: z.array(z.string()).optional(),
    contributes: z.any().optional(),
  }),
});

export type Plugin = z.infer<typeof PluginSchema>;

// In-memory storage (replace with database in production)
const plugins = new Map<string, Plugin>();
const downloads = new Map<string, number>();
const ratings = new Map<string, { total: number; count: number }>();

// File upload configuration
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'marketplace', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.zip', '.tar.gz', '.tgz'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only .zip, .tar.gz, and .tgz files are allowed.'));
    }
  },
});

export function createMarketplaceRouter(): Router {
  const router = Router();

  // Get all plugins
  router.get('/plugins', (req, res) => {
    const {
      category,
      search,
      sort = 'downloads',
      order = 'desc',
      page = '1',
      limit = '20',
    } = req.query;

    let pluginList = Array.from(plugins.values());

    // Filter by category
    if (category && typeof category === 'string') {
      pluginList = pluginList.filter(p => p.category === category);
    }

    // Search
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      pluginList = pluginList.filter(
        p =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Sort
    pluginList.sort((a, b) => {
      let compareValue = 0;

      switch (sort) {
        case 'downloads':
          compareValue = (downloads.get(b.id!) || 0) - (downloads.get(a.id!) || 0);
          break;
        case 'rating':
          const ratingA = ratings.get(a.id!);
          const ratingB = ratings.get(b.id!);
          const avgA = ratingA ? ratingA.total / ratingA.count : 0;
          const avgB = ratingB ? ratingB.total / ratingB.count : 0;
          compareValue = avgB - avgA;
          break;
        case 'name':
          compareValue = a.name.localeCompare(b.name);
          break;
        case 'updated':
          compareValue = b.version.localeCompare(a.version);
          break;
      }

      return order === 'asc' ? -compareValue : compareValue;
    });

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const start = (pageNum - 1) * limitNum;
    const paginatedPlugins = pluginList.slice(start, start + limitNum);

    // Add metadata
    const enrichedPlugins = paginatedPlugins.map(plugin => ({
      ...plugin,
      downloads: downloads.get(plugin.id!) || 0,
      rating: (() => {
        const rating = ratings.get(plugin.id!);
        return rating ? rating.total / rating.count : 0;
      })(),
      ratingCount: ratings.get(plugin.id!)?.count || 0,
    }));

    res.json({
      plugins: enrichedPlugins,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: pluginList.length,
        pages: Math.ceil(pluginList.length / limitNum),
      },
    });
  });

  // Get single plugin
  router.get('/plugins/:id', (req, res) => {
    const plugin = plugins.get(req.params.id);

    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }

    const rating = ratings.get(plugin.id!);

    res.json({
      ...plugin,
      downloads: downloads.get(plugin.id!) || 0,
      rating: rating ? rating.total / rating.count : 0,
      ratingCount: rating?.count || 0,
    });
  });

  // Publish new plugin
  router.post('/plugins', upload.single('package'), async (req, res) => {
    try {
      const pluginData = PluginSchema.parse(JSON.parse(req.body.metadata));

      // Generate unique ID
      const id = createHash('sha256')
        .update(`${pluginData.name}-${pluginData.version}`)
        .digest('hex')
        .substring(0, 16);

      // Check if version already exists
      if (plugins.has(id)) {
        return res.status(409).json({ error: 'Plugin version already exists' });
      }

      // Save plugin metadata
      const plugin: Plugin = {
        ...pluginData,
        id,
      };

      plugins.set(id, plugin);
      downloads.set(id, 0);

      // If file was uploaded, process it
      if (req.file) {
        // In production, would extract and validate the plugin package
        plugin.manifest = {
          main: 'index.js',
          ...plugin.manifest,
        };
      }

      res.status(201).json(plugin);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid plugin data', details: error.errors });
      }
      throw error;
    }
  });

  // Update plugin
  router.put('/plugins/:id', async (req, res) => {
    const plugin = plugins.get(req.params.id);

    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }

    try {
      const updates = PluginSchema.partial().parse(req.body);
      const updatedPlugin = { ...plugin, ...updates };
      plugins.set(req.params.id, updatedPlugin);

      res.json(updatedPlugin);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid update data', details: error.errors });
      }
      throw error;
    }
  });

  // Delete plugin
  router.delete('/plugins/:id', (req, res) => {
    if (!plugins.has(req.params.id)) {
      return res.status(404).json({ error: 'Plugin not found' });
    }

    plugins.delete(req.params.id);
    downloads.delete(req.params.id);
    ratings.delete(req.params.id);

    res.status(204).send();
  });

  // Download plugin
  router.post('/plugins/:id/download', async (req, res) => {
    const plugin = plugins.get(req.params.id);

    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }

    // Increment download counter
    downloads.set(plugin.id!, (downloads.get(plugin.id!) || 0) + 1);

    // In production, would serve the actual plugin file
    res.json({
      downloadUrl: `/marketplace/downloads/${plugin.id}/${plugin.name}-${plugin.version}.zip`,
      checksum: createHash('sha256').update(plugin.id!).digest('hex'),
    });
  });

  // Rate plugin
  router.post('/plugins/:id/rate', (req, res) => {
    const plugin = plugins.get(req.params.id);

    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }

    const { rating } = req.body;

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const currentRating = ratings.get(plugin.id!) || { total: 0, count: 0 };
    ratings.set(plugin.id!, {
      total: currentRating.total + rating,
      count: currentRating.count + 1,
    });

    res.json({ success: true });
  });

  // Get featured plugins
  router.get('/featured', (req, res) => {
    const featured = Array.from(plugins.values())
      .sort((a, b) => (downloads.get(b.id!) || 0) - (downloads.get(a.id!) || 0))
      .slice(0, 6)
      .map(plugin => ({
        ...plugin,
        downloads: downloads.get(plugin.id!) || 0,
        rating: (() => {
          const rating = ratings.get(plugin.id!);
          return rating ? rating.total / rating.count : 0;
        })(),
      }));

    res.json(featured);
  });

  // Get categories with counts
  router.get('/categories', (req, res) => {
    const categoryCounts = new Map<string, number>();

    for (const plugin of plugins.values()) {
      categoryCounts.set(plugin.category, (categoryCounts.get(plugin.category) || 0) + 1);
    }

    const categories = Array.from(categoryCounts.entries()).map(([name, count]) => ({
      name,
      count,
      icon: getCategoryIcon(name),
    }));

    res.json(categories);
  });

  // Search suggestions
  router.get('/search/suggestions', (req, res) => {
    const { q } = req.query;

    if (!q || typeof q !== 'string' || q.length < 2) {
      return res.json([]);
    }

    const searchLower = q.toLowerCase();
    const suggestions = new Set<string>();

    // Search in names and tags
    for (const plugin of plugins.values()) {
      if (plugin.name.toLowerCase().includes(searchLower)) {
        suggestions.add(plugin.name);
      }

      for (const tag of plugin.tags) {
        if (tag.toLowerCase().includes(searchLower)) {
          suggestions.add(tag);
        }
      }

      if (suggestions.size >= 10) break;
    }

    res.json(Array.from(suggestions).slice(0, 10));
  });

  return router;
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    visualization: '📊',
    analysis: '🔍',
    integration: '🔌',
    utility: '🛠️',
    ai: '🤖',
  };
  return icons[category] || '📦';
}

// Seed some example plugins
export function seedMarketplace() {
  const samplePlugins: Plugin[] = [
    {
      id: '1',
      name: 'Advanced Charts',
      version: '2.1.0',
      description: 'Beautiful and interactive charts for data visualization with D3.js',
      author: 'Terrafusion Team',
      category: 'visualization',
      tags: ['charts', 'd3', 'graphs', 'analytics'],
      license: 'MIT',
      compatibility: {
        minVersion: '2.0.0',
      },
      manifest: {
        main: 'index.js',
        contributes: {
          views: ['chart-view'],
          commands: ['charts.create'],
        },
      },
    },
    {
      id: '2',
      name: 'Property AI Assistant',
      version: '1.0.0',
      description: 'AI-powered property analysis and recommendations',
      author: 'AI Labs',
      category: 'ai',
      tags: ['ai', 'machine-learning', 'property', 'analysis'],
      license: 'Commercial',
      compatibility: {
        minVersion: '2.0.0',
      },
      manifest: {
        main: 'index.js',
      },
    },
    {
      id: '3',
      name: 'GIS Integration Pro',
      version: '3.2.1',
      description: 'Advanced GIS data integration with multiple format support',
      author: 'GeoTech Solutions',
      category: 'integration',
      tags: ['gis', 'maps', 'geospatial', 'integration'],
      license: 'Apache-2.0',
      compatibility: {
        minVersion: '1.5.0',
      },
      manifest: {
        main: 'index.js',
      },
    },
  ];

  samplePlugins.forEach(plugin => {
    plugins.set(plugin.id!, plugin);
    downloads.set(plugin.id!, Math.floor(Math.random() * 10000));
    ratings.set(plugin.id!, {
      total: Math.floor(Math.random() * 500) + 100,
      count: Math.floor(Math.random() * 100) + 20,
    });
  });
}

/**
 * Voice Command Routes Index
 *
 * This file consolidates all the voice command related routes into a single router.
 */

import { Router } from 'express';
import voiceCommandAnalyticsRoutes from './voice-command-analytics-routes';
import voiceCommandShortcutRoutes from './voice-command-shortcut-routes';
import voiceCommandHelpRoutes from './voice-command-help-routes';
import voiceCommandEnhancedRoutes from './voice-command-enhanced-routes';
import voiceCommandCodingAssistanceRoutes from './voice-command-coding-assistance-routes';

const router = Router();

// Register all voice command related routes
router.use('/analytics', voiceCommandAnalyticsRoutes);
router.use('/shortcuts', voiceCommandShortcutRoutes);
router.use('/help', voiceCommandHelpRoutes);
router.use('/enhanced', voiceCommandEnhancedRoutes);
router.use('/coding', voiceCommandCodingAssistanceRoutes);

export default router;

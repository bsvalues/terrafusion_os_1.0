/**
 * Health Module
 *
 * Provides health monitoring capabilities for the system.
 */

// Import declarations - for actual NestJS implementation use these
/*
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
*/

// For now, create mock types (will be replaced with actual imports)
const Module = (options: any) => (constructor: Function) => constructor;

// Import from project
import { HealthController } from './health.controller';
import { AgentHealthIndicator } from './agent-health.indicator';

/**
 * Health module implementation
 */
@Module({
  imports: [
    // TerminusModule would go here in actual NestJS implementation
    // HttpModule would go here in actual NestJS implementation
  ],
  controllers: [HealthController],
  providers: [AgentHealthIndicator],
  exports: [AgentHealthIndicator],
})
export class HealthModule {}

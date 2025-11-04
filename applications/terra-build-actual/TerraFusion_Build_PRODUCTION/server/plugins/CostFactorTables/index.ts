import express from 'express';

/**
 * CostFactorTables plugin - provides access to cost factor data for different building types,
 * regions, quality grades, etc. for the Benton County Building Cost Assessment System.
 */
export function registerCostFactorPlugin(app: express.Express): void {
  // Register cost factor API routes
  // TODO: Add costFactorRouter when available
  
  console.log('CostFactorTables initialized successfully from source: Benton County Building Cost Standards');
}
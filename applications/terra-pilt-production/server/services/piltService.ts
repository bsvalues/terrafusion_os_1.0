import { dbInitializer } from '../core/database-init';
import {
    BENTON_COUNTY_CONFIG,
    FederalProperty,
    PiltCalculation,
    PiltCalculationEngine,
    PiltReceipt,
    SchoolDistrict
} from '../models/pilt';
import { logger } from '../utils/logger';

export class PiltService {
    private calculationEngine: PiltCalculationEngine;

    constructor() {
        this.calculationEngine = new PiltCalculationEngine(BENTON_COUNTY_CONFIG);
    }

    async createPiltReceipt(receiptData: Omit<PiltReceipt, 'id'>): Promise<PiltReceipt> {
        const id = `pilt_${receiptData.year}_${Date.now()}`;

        try {
            const db = dbInitializer.getDatabase();
            const stmt = db.prepare(`
                INSERT INTO pilt_receipts (
                  id, year, county, state, total_amount, 
                  federal_fiscal_year, received_date, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);

            stmt.run(
                id,
                receiptData.year,
                receiptData.county,
                receiptData.state,
                receiptData.totalAmount,
                receiptData.federalFiscalYear,
                receiptData.receivedDate,
                receiptData.status
            );

            for (const property of receiptData.federalProperties) {
                await this.saveFederalProperty(id, property);
            }

            logger.info(`PILT receipt created: ${id} for year ${receiptData.year}`);

            return {
                id,
                ...receiptData
            };
        } catch (error) {
            logger.error('Error creating PILT receipt:', { error: error instanceof Error ? error.message : error });
            throw new Error('Failed to create PILT receipt');
        }
    }

    async getPiltReceipt(id: string): Promise<PiltReceipt | null> {
        try {
            const db = dbInitializer.getDatabase();
            const receipt = db.prepare('SELECT * FROM pilt_receipts WHERE id = ?').get(id) as any;

            if (!receipt) {
                return null;
            }

            const properties = await this.getFederalPropertiesByReceipt(id);

            return {
                id: receipt.id,
                year: receipt.year,
                county: receipt.county,
                state: receipt.state,
                totalAmount: receipt.total_amount,
                federalFiscalYear: receipt.federal_fiscal_year,
                receivedDate: new Date(receipt.received_date),
                status: receipt.status,
                federalProperties: properties
            };
        } catch (error) {
            logger.error('Error fetching PILT receipt:', { error: error instanceof Error ? error.message : error });
            throw new Error('Failed to fetch PILT receipt');
        }
    }

    async getSchoolDistricts(year: number): Promise<SchoolDistrict[]> {
        try {
            const db = dbInitializer.getDatabase();
            const stmt = db.prepare(`
                SELECT 
                  d.id, d.name, d.code, d.county,
                  COALESCE(av.total_value, 0) as total_assessed_value,
                  COALESCE(lr.rate, 0) as levy_rate
                FROM districts d
                LEFT JOIN assessed_values av ON d.id = av.district_id AND av.year = ?
                LEFT JOIN levy_rates lr ON d.id = lr.district_id AND lr.year = ?
                WHERE d.county = 'Benton County'
                ORDER BY d.name
            `);

            const results = stmt.all(year, year) as any[];

            return results.map((row: any) => ({
                id: row.id,
                name: row.name,
                code: row.code,
                county: row.county,
                totalAssessedValue: row.total_assessed_value,
                levyRate: row.levy_rate,
                year
            }));
        } catch (error) {
            logger.error('Error fetching school districts:', { error: error instanceof Error ? error.message : error });
            throw new Error('Failed to fetch school districts');
        }
    }

    async calculatePiltDistribution(receiptId: string): Promise<PiltCalculation> {
        try {
            const receipt = await this.getPiltReceipt(receiptId);
            if (!receipt) {
                throw new Error('PILT receipt not found');
            }

            const districts = await this.getSchoolDistricts(receipt.year);
            if (districts.length === 0) {
                throw new Error('No school districts found for calculation');
            }

            const calculation = this.calculationEngine.calculateDistribution(receipt, districts);
            const validation = this.calculationEngine.validateCalculation(calculation);

            if (!validation.isValid) {
                logger.error('PILT calculation validation failed:', { errors: validation.errors });
                throw new Error(`Calculation validation failed: ${validation.errors.join(', ')}`);
            }

            if (validation.warnings.length > 0) {
                logger.warn('PILT calculation warnings:', { warnings: validation.warnings });
            }

            await this.saveCalculation(calculation);

            logger.info(`PILT calculation completed for receipt ${receiptId}`);
            return calculation;
        } catch (error) {
            logger.error('Error calculating PILT distribution:', { error: error instanceof Error ? error.message : error });
            throw error;
        }
    }

    async approveDistribution(calculationId: string, approvedBy: string): Promise<void> {
        try {
            const db = dbInitializer.getDatabase();

            const updateCalc = db.prepare(`
                UPDATE pilt_calculations 
                SET approved_by = ?, approved_date = ?, status = 'approved'
                WHERE id = ?
            `);
            updateCalc.run(approvedBy, new Date().toISOString(), calculationId);

            const updateDist = db.prepare(`
                UPDATE distributions 
                SET status = 'approved'
                WHERE calculation_id = ?
            `);
            updateDist.run(calculationId);

            logger.info(`PILT distribution approved by ${approvedBy}: ${calculationId}`);
        } catch (error) {
            logger.error('Error approving distribution:', { error: error instanceof Error ? error.message : error });
            throw new Error('Failed to approve distribution');
        }
    }

    async generateFederalReport(year: number): Promise<{
        reportData: any;
        htmlContent: string;
    }> {
        try {
            const receipts = await this.getPiltReceiptsByYear(year);
            const calculations = await this.getCalculationsByYear(year);

            const reportData = {
                year,
                county: BENTON_COUNTY_CONFIG.countyName,
                state: BENTON_COUNTY_CONFIG.state,
                assessorOffice: BENTON_COUNTY_CONFIG.assessorOffice,
                receipts,
                calculations,
                totalPiltReceived: receipts.reduce((sum, r) => sum + r.totalAmount, 0),
                totalDistributed: calculations.reduce(
                    (sum, c) => sum + c.distributions.reduce((dSum, d) => dSum + d.calculatedAmount, 0),
                    0
                ),
                generatedDate: new Date(),
                generatedBy: 'TerraFusionPilt V2.0.0'
            };

            const htmlContent = this.generateReportHTML(reportData);

            return { reportData, htmlContent };
        } catch (error) {
            logger.error('Error generating federal report:', { error: error instanceof Error ? error.message : error });
            throw new Error('Failed to generate federal report');
        }
    }

    private async saveFederalProperty(receiptId: string, property: FederalProperty): Promise<void> {
        const db = dbInitializer.getDatabase();
        const stmt = db.prepare(`
            INSERT INTO federal_properties (
                id, receipt_id, name, acres, agency, land_type, 
                assessed_value, current_use_value, year, coordinates
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            property.id,
            receiptId,
            property.name,
            property.acres,
            property.agency,
            property.landType,
            property.assessedValue,
            property.currentUseValue,
            property.year,
            property.coordinates ? JSON.stringify(property.coordinates) : null
        );
    }

    private async getFederalPropertiesByReceipt(receiptId: string): Promise<FederalProperty[]> {
        const db = dbInitializer.getDatabase();
        const stmt = db.prepare('SELECT * FROM federal_properties WHERE receipt_id = ?');
        const results = stmt.all(receiptId) as any[];

        return results.map((row: any) => ({
            id: row.id,
            name: row.name,
            acres: row.acres,
            county: 'Benton County',
            state: 'Washington',
            agency: row.agency,
            landType: row.land_type,
            assessedValue: row.assessed_value,
            currentUseValue: row.current_use_value,
            year: row.year,
            coordinates: row.coordinates ? JSON.parse(row.coordinates) : undefined
        }));
    }

    private async saveCalculation(calculation: PiltCalculation): Promise<void> {
        const calculationId = `calc_${calculation.year}_${Date.now()}`;
        const db = dbInitializer.getDatabase();

        const calcStmt = db.prepare(`
            INSERT INTO pilt_calculations (
                id, year, county, total_federal_acres, total_assessed_value,
                total_levy_amount, calculation_date, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'calculated')
        `);

        calcStmt.run(
            calculationId,
            calculation.year,
            calculation.county,
            calculation.totalFederalAcres,
            calculation.totalAssessedValue,
            calculation.totalLevyAmount,
            calculation.calculationDate.toISOString()
        );

        const distStmt = db.prepare(`
            INSERT INTO distributions (
              id, calculation_id, district_id, district_name, calculated_amount,
              percentage, levy_rate, assessed_value, status, calculation_method
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const distribution of calculation.distributions) {
            distStmt.run(
                distribution.id,
                calculationId,
                distribution.districtId,
                distribution.districtName,
                distribution.calculatedAmount,
                distribution.percentage,
                distribution.levyRate,
                distribution.assessedValue,
                distribution.status,
                distribution.calculationMethod
            );
        }
    }

    async getPiltReceiptsByYear(year: number): Promise<PiltReceipt[]> {
        const db = dbInitializer.getDatabase();
        const stmt = db.prepare('SELECT * FROM pilt_receipts WHERE year = ? ORDER BY received_date DESC');
        const results = stmt.all(year) as any[];

        const receipts: PiltReceipt[] = [];
        for (const row of results) {
            const receipt = await this.getPiltReceipt(row.id);
            if (receipt) receipts.push(receipt);
        }

        return receipts;
    }

    private async getCalculationsByYear(year: number): Promise<PiltCalculation[]> {
        const db = dbInitializer.getDatabase();
        const stmt = db.prepare('SELECT * FROM pilt_calculations WHERE year = ? ORDER BY calculation_date DESC');
        const results = stmt.all(year) as any[];

        return results.map((row: any) => ({
            year: row.year,
            county: row.county,
            totalFederalAcres: row.total_federal_acres,
            totalAssessedValue: row.total_assessed_value,
            totalLevyAmount: row.total_levy_amount,
            distributions: [],
            calculationDate: new Date(row.calculation_date),
            approvedBy: row.approved_by,
            approvedDate: row.approved_date ? new Date(row.approved_date) : undefined
        }));
    }

    private generateReportHTML(reportData: any): string {
        return `
      <!DOCTYPE html>
      <html>
      <head><>

        <title>Benton County PILT Report ${reportData.year}</title>
        <style
</>>
          body { font-family: 'Times New Roman', serif; margin: 40px; }
          .header { text-align: center; border-bottom: 2px solid #0891b2; padding-bottom: 20px; }
          .content { margin: 30px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
          th { background-color: #0891b2; color: white; }
          .total { background-color: #e8f4f8; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header"><>

          <h1>BENTON COUNTY ASSESSOR'S OFFICE</h1>
          <h2
</>>Payment in Lieu of Taxes (PILT) Report - ${reportData.year}</h2>
          <p>${reportData.assessorOffice.address}</p>
        </div>
        
        <div class="content"><>

          <h3>Summary</h3>
          <p
</>><strong>Total PILT Received:</strong> $${reportData.totalPiltReceived.toLocaleString()}</p>
          <p><strong>Total Distributed:</strong> $${reportData.totalDistributed.toLocaleString()}</p>
          <p><strong>Report Generated:</strong> ${reportData.generatedDate.toLocaleDateString()}</p><>

          
          <h3>Federal Properties</h3>
          <p
</>>Primary Federal Land: Hanford Site (${BENTON_COUNTY_CONFIG.federalProperties.hanfordSite.acres.toLocaleString()} acres)</p><>

          <p>Managing Agency: ${BENTON_COUNTY_CONFIG.federalProperties.hanfordSite.primaryAgency}</p>
          
          <h3
</>>Distribution to School Districts</h3>
          <table>
            <thead>
              <tr><>

                <th>School District</th>
                <th
</>>Assessed Value</th><>

                <th>Levy Rate</th>
                <th
</>>Percentage</th>
                <th>PILT Distribution</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.calculations.map((calc: any) =>
            calc.distributions.map((dist: any) => `
                  <tr><>

                    <td>${dist.districtName}</td>
                    <td
</>>$${dist.assessedValue.toLocaleString()}</td><>

                    <td>${dist.levyRate.toFixed(7)}</td>
                    <td
</>>${dist.percentage.toFixed(2)}%</td>
                    <td>$${dist.calculatedAmount.toLocaleString()}</td>
                  </tr>
                `).join('')
        ).join('')}
              <tr class="total"><>

                <td>TOTAL</td>
                <td
</>></td><>

                <td></td>
                <td
</>>100.00%</td>
                <td>$${reportData.totalDistributed.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div style="margin-top: 50px;">
          <p>Generated by TerraFusionPilt V2.0.0 - Benton County Civil Infrastructure Brain</p>
        </div>
      </body>
      </html>
    `;
    }
}

export const piltService = new PiltService(); 
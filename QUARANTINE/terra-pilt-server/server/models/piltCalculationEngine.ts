import { logger } from '../utils/logger';

export interface PiltDistribution {
    id: string;
    piltReceiptId: string;
    districtId: string;
    districtName: string;
    calculatedAmount: number;
    percentage: number;
    levyRate: number;
    assessedValue: number;
    distributionDate?: Date;
    status: 'calculated' | 'approved' | 'distributed';
    calculationMethod: 'current_use' | 'market_value';
}

export interface PiltCalculation {
    year: number;
    county: string;
    totalFederalAcres: number;
    totalAssessedValue: number;
    totalLevyAmount: number;
    distributions: PiltDistribution[];
    calculationDate: Date;
    approvedBy?: string;
    approvedDate?: Date;
    validationResults: ValidationResults;
}

export interface ValidationResults {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    accuracy: {
        distributionTotal: number;
        percentageTotal: number;
        rounding: number;
    };
}

export interface SchoolDistrict {
    id: string;
    name: string;
    code: string;
    county: string;
    totalAssessedValue: number;
    levyRate: number;
    year: number;
    boundaries?: string;
}

export interface PiltReceipt {
    id: string;
    year: number;
    county: string;
    state: string;
    totalAmount: number;
    federalFiscalYear: number;
    receivedDate: Date;
    status: 'pending' | 'received' | 'distributed' | 'reported';
    federalProperties: Array<{
        id: string;
        name: string;
        acres: number;
        county: string;
        state: string;
        agency: string;
        landType: string;
        assessedValue: number;
        year: number;
    }>;
}

export class MathematicallyCorrectPiltEngine {
    
    calculateDistribution(
        piltReceipt: PiltReceipt,
        districts: SchoolDistrict[]
    ): PiltCalculation {
        logger.info(`🧮 Starting mathematically precise PILT calculation for ${piltReceipt.year}`);
        
        // Step 1: Calculate total assessed value with validation
        const totalAssessedValue = this.calculateTotalAssessedValue(districts);
        
        // Step 2: Calculate preliminary distributions
        const preliminaryDistributions = this.calculatePreliminaryDistributions(
            piltReceipt, districts, totalAssessedValue
        );
        
        // Step 3: Apply mathematical rounding correction to ensure exact total
        const correctedDistributions = this.applyCorrectedRounding(
            preliminaryDistributions, piltReceipt.totalAmount
        );
        
        // Step 4: Calculate precise percentages
        const finalDistributions = this.calculatePrecisePercentages(
            correctedDistributions, piltReceipt.totalAmount
        );
        
        // Step 5: Comprehensive validation
        const validationResults = this.performComprehensiveValidation(
            finalDistributions, piltReceipt.totalAmount
        );
        
        const calculation: PiltCalculation = {
            year: piltReceipt.year,
            county: piltReceipt.county,
            totalFederalAcres: piltReceipt.federalProperties.reduce(
                (sum, prop) => sum + prop.acres, 0
            ),
            totalAssessedValue,
            totalLevyAmount: piltReceipt.totalAmount,
            distributions: finalDistributions,
            calculationDate: new Date(),
            validationResults
        };
        
        logger.info(`✅ PILT calculation completed with ${validationResults.isValid ? 'VALID' : 'INVALID'} results`);
        
        return calculation;
    }
    
    private calculateTotalAssessedValue(districts: SchoolDistrict[]): number {
        const total = districts.reduce((sum, district) => {
            if (district.totalAssessedValue < 0) {
                logger.warn(`Negative assessed value for district ${district.name}: ${district.totalAssessedValue}`);
            }
            return sum + Math.max(0, district.totalAssessedValue);
        }, 0);
        
        if (total === 0) {
            throw new Error('Total assessed value cannot be zero');
        }
        
        logger.info(`📊 Total assessed value: $${total.toLocaleString()}`);
        return total;
    }
    
    private calculatePreliminaryDistributions(
        piltReceipt: PiltReceipt,
        districts: SchoolDistrict[],
        totalAssessedValue: number
    ): PiltDistribution[] {
        return districts.map(district => {
            // Calculate exact percentage (high precision)
            const exactPercentage = district.totalAssessedValue / totalAssessedValue;
            
            // Calculate exact amount (high precision)
            const exactAmount = piltReceipt.totalAmount * exactPercentage;
            
            return {
                id: `dist_${piltReceipt.id}_${district.id}`,
                piltReceiptId: piltReceipt.id,
                districtId: district.id,
                districtName: district.name,
                calculatedAmount: exactAmount, // Keep high precision for now
                percentage: exactPercentage * 100, // Keep high precision for now
                levyRate: district.levyRate,
                assessedValue: district.totalAssessedValue,
                status: 'calculated',
                calculationMethod: piltReceipt.year >= 2019 ? 'current_use' : 'market_value'
            };
        });
    }
    
    private applyCorrectedRounding(
        distributions: PiltDistribution[],
        totalAmount: number
    ): PiltDistribution[] {
        // Step 1: Round all amounts to 2 decimal places using banker's rounding
        const roundedDistributions = distributions.map(dist => ({
            ...dist,
            calculatedAmount: this.bankersRound(dist.calculatedAmount, 2)
        }));
        
        // Step 2: Calculate the rounding error
        const roundedTotal = roundedDistributions.reduce((sum, dist) => sum + dist.calculatedAmount, 0);
        const roundingError = this.bankersRound(totalAmount - roundedTotal, 2);
        
        // Step 3: Distribute the rounding error to the largest distribution(s)
        if (Math.abs(roundingError) >= 0.01) {
            logger.info(`🔧 Applying rounding correction: ${roundingError}`);
            
            // Sort by amount (descending) to apply correction to largest
            const sortedIndices = roundedDistributions
                .map((_ /* , index */) => index)
                .sort((a, b) => roundedDistributions[b].calculatedAmount - roundedDistributions[a].calculatedAmount);
            
            // Apply correction to largest distribution
            const largestIndex = sortedIndices[0];
            roundedDistributions[largestIndex].calculatedAmount = 
                this.bankersRound(roundedDistributions[largestIndex].calculatedAmount + roundingError, 2);
        }
        
        return roundedDistributions;
    }
    
    private calculatePrecisePercentages(
        distributions: PiltDistribution[],
        totalAmount: number
    ): PiltDistribution[] {
        return distributions.map(dist => ({
            ...dist,
            percentage: this.bankersRound((dist.calculatedAmount / totalAmount) * 100, 4)
        }));
    }
    
    private performComprehensiveValidation(
        distributions: PiltDistribution[],
        totalAmount: number
    ): ValidationResults {
        const errors: string[] = [];
        const warnings: string[] = [];
        
        // Validation 1: Distribution total must equal PILT amount exactly
        const distributionTotal = distributions.reduce((sum, dist) => sum + dist.calculatedAmount, 0);
        const distributionDifference = Math.abs(distributionTotal - totalAmount);
        
        if (distributionDifference > 0.005) { // Half cent tolerance
            errors.push(`Distribution total ($${distributionTotal}) differs from PILT amount ($${totalAmount}) by $${distributionDifference}`);
        } else if (distributionDifference > 0.001) {
            warnings.push(`Minor distribution variance: $${distributionDifference}`);
        }
        
        // Validation 2: Percentage total should equal 100%
        const percentageTotal = distributions.reduce((sum, dist) => sum + dist.percentage, 0);
        const percentageDifference = Math.abs(percentageTotal - 100);
        
        if (percentageDifference > 0.01) {
            warnings.push(`Percentage total (${percentageTotal}%) differs from 100% by ${percentageDifference}%`);
        }
        
        // Validation 3: No negative amounts
        distributions.forEach(dist => {
            if (dist.calculatedAmount < 0) {
                errors.push(`Negative distribution amount for ${dist.districtName}: $${dist.calculatedAmount}`);
            }
        });
        
        // Validation 4: Reasonable levy rates
        distributions.forEach(dist => {
            if (dist.levyRate <= 0) {
                warnings.push(`Zero or negative levy rate for ${dist.districtName}: ${dist.levyRate}`);
            }
            if (dist.levyRate > 10) {
                warnings.push(`Unusually high levy rate for ${dist.districtName}: ${dist.levyRate}`);
            }
        });
        
        // Validation 5: Mathematical consistency check
        const recalculatedTotal = distributions.reduce((sum, dist) => {
            const expectedAmount = (dist.percentage / 100) * totalAmount;
            const difference = Math.abs(dist.calculatedAmount - expectedAmount);
            if (difference > 0.01) {
                warnings.push(`Calculation inconsistency for ${dist.districtName}: expected $${expectedAmount}, got $${dist.calculatedAmount}`);
            }
            return sum + dist.calculatedAmount;
        }, 0);
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            accuracy: {
                distributionTotal: distributionTotal,
                percentageTotal: percentageTotal,
                rounding: distributionDifference
            }
        };
    }
    
    private bankersRound(value: number, decimals: number): number {
        const factor = Math.pow(10, decimals);
        const shifted = value * factor;
        const rounded = Math.round(shifted);
        
        // Handle banker's rounding for .5 cases
        if (Math.abs(shifted - Math.floor(shifted) - 0.5) < Number.EPSILON) {
            return Math.floor(shifted) % 2 === 0 ? Math.floor(shifted) / factor : Math.ceil(shifted) / factor;
        }
        
        return rounded / factor;
    }
    
    public generateValidationReport(calculation: PiltCalculation): string {
        const { validationResults } = calculation;
        
        let report = `# MATHEMATICAL VALIDATION REPORT\n\n`;
        report += `**Year:** ${calculation.year}\n`;
        report += `**County:** ${calculation.county}\n`;
        report += `**Status:** ${validationResults.isValid ? '✅ VALID' : '❌ INVALID'}\n\n`;
        
        report += `## Accuracy Metrics\n`;
        report += `- Distribution Total: $${validationResults.accuracy.distributionTotal.toLocaleString()}\n`;
        report += `- PILT Amount: $${calculation.totalLevyAmount.toLocaleString()}\n`;
        report += `- Difference: $${validationResults.accuracy.rounding.toFixed(4)}\n`;
        report += `- Percentage Total: ${validationResults.accuracy.percentageTotal.toFixed(4)}%\n\n`;
        
        if (validationResults.errors.length > 0) {
            report += `## ❌ ERRORS\n`;
            validationResults.errors.forEach(error => {
                report += `- ${error}\n`;
            });
            report += `\n`;
        }
        
        if (validationResults.warnings.length > 0) {
            report += `## ⚠️ WARNINGS\n`;
            validationResults.warnings.forEach(warning => {
                report += `- ${warning}\n`;
            });
            report += `\n`;
        }
        
        report += `## District Distributions\n`;
        calculation.distributions.forEach(dist => {
            report += `- **${dist.districtName}:** $${dist.calculatedAmount.toLocaleString()} (${dist.percentage.toFixed(2)}%)\n`;
        });
        
        return report;
    }
} 
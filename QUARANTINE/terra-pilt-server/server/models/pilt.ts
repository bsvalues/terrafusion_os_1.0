export interface FederalProperty {
    id: string;
    name: string;
    acres: number;
    county: string;
    state: string;
    agency: string;
    landType: 'National Forest' | 'BLM' | 'Military' | 'Other Federal';
    assessedValue: number;
    currentUseValue?: number;
    year: number;
    coordinates?: {
        latitude: number;
        longitude: number;
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
    federalProperties: FederalProperty[];
}

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
}

export interface BentonCountyConfig {
    countyName: 'Benton County';
    state: 'Washington';
    assessorOffice: {
        name: string;
        address: string;
        phone: string;
        contact: string;
    };
    federalProperties: {
        hanfordSite: {
            acres: number;
            primaryAgency: 'Department of Energy';
            assessmentMethod: 'current_use' | 'market_value';
        };
    };
    schoolDistricts: string[];
    reportingRequirements: {
        dueDate: string;
        recipientOffice: string;
        requiredForms: string[];
    };
}

export class PiltCalculationEngine {
    private bentonConfig: BentonCountyConfig;

    constructor(config: BentonCountyConfig) {
        this.bentonConfig = config;
    }

    calculateDistribution(
        piltReceipt: PiltReceipt,
        districts: SchoolDistrict[]
    ): PiltCalculation {
        const totalAssessedValue = districts.reduce(
            (sum, district) => sum + district.totalAssessedValue,
            0
        );

        const distributions: PiltDistribution[] = districts.map(district => {
            const percentage = district.totalAssessedValue / totalAssessedValue;
            const calculatedAmount = piltReceipt.totalAmount * percentage;

            return {
                id: `dist_${piltReceipt.id}_${district.id}`,
                piltReceiptId: piltReceipt.id,
                districtId: district.id,
                districtName: district.name,
                calculatedAmount: Math.round(calculatedAmount * 100) / 100,
                percentage: Math.round(percentage * 10000) / 100,
                levyRate: district.levyRate,
                assessedValue: district.totalAssessedValue,
                status: 'calculated',
                calculationMethod: piltReceipt.year >= 2019 ? 'current_use' : 'market_value'
            };
        });

        return {
            year: piltReceipt.year,
            county: piltReceipt.county,
            totalFederalAcres: piltReceipt.federalProperties.reduce(
                (sum, prop) => sum + prop.acres,
                0
            ),
            totalAssessedValue,
            totalLevyAmount: piltReceipt.totalAmount,
            distributions,
            calculationDate: new Date()
        };
    }

    validateCalculation(calculation: PiltCalculation): {
        isValid: boolean;
        errors: string[];
        warnings: string[];
    } {
        const errors: string[] = [];
        const warnings: string[] = [];

        const totalDistributed = calculation.distributions.reduce(
            (sum, dist) => sum + dist.calculatedAmount,
            0
        );

        if (Math.abs(totalDistributed - calculation.totalLevyAmount) > 0.01) {
            errors.push(
                `Distribution total (${totalDistributed}) does not match PILT amount (${calculation.totalLevyAmount})`
            );
        }

        const totalPercentage = calculation.distributions.reduce(
            (sum, dist) => sum + dist.percentage,
            0
        );

        if (Math.abs(totalPercentage - 100) > 0.01) {
            warnings.push(
                `Total percentage (${totalPercentage}%) does not equal 100%`
            );
        }

        calculation.distributions.forEach(dist => {
            if (dist.calculatedAmount < 0) {
                errors.push(`Negative distribution amount for ${dist.districtName}`);
            }
            if (dist.levyRate <= 0) {
                warnings.push(`Zero or negative levy rate for ${dist.districtName}`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
}

export const BENTON_COUNTY_CONFIG: BentonCountyConfig = {
    countyName: 'Benton County',
    state: 'Washington',
    assessorOffice: {
        name: 'Benton County Assessor\'s Office',
        address: '7122 W. Okanogan Place, Building A, Kennewick, WA 99336',
        phone: '(509) 736-3085',
        contact: 'Benton County Assessor'
    },
    federalProperties: {
        hanfordSite: {
            acres: 586000,
            primaryAgency: 'Department of Energy',
            assessmentMethod: 'current_use'
        }
    },
    schoolDistricts: [
        'Richland School District',
        'Kennewick School District',
        'Pasco School District',
        'Finley School District',
        'Kiona-Benton City School District'
    ],
    reportingRequirements: {
        dueDate: 'March 31',
        recipientOffice: 'Washington State Department of Education',
        requiredForms: ['PILT Distribution Report', 'Assessor Certification Letter']
    }
}; 
// Benton County PILT Calculator - Exact replication of Excel workbook logic
// Based on actual PILT calculation methodology from county documents

export interface PiltDistrict {
  name: string;
  assessed_value: number;
  levy_rate: number; // Per $1,000 of value
  pilt_due: number;
  less_81_874_deduction?: number;
}

export interface LandClassification {
  type: 'dryland' | 'irrigable' | 'lesser_riverfront' | 'prime_riverfront' | 'rural_residential' | 'town_plats';
  unit: 'acre' | 'linear_foot';
  acres_or_feet: number;
  rate_per_unit: number;
  total_value: number;
  district?: string;
}

export interface PiltCalculationResult {
  year: string;
  total_assessed_value: number;
  total_pilt_due: number;
  districts: PiltDistrict[];
  land_classifications: LandClassification[];
  certification_letter: {
    assessor_name: string;
    treasurer_name: string;
    date: string;
    total_assessed_value: number;
  };
}

export interface YearOverYearComparison {
  year: string;
  total_pilt: number;
  change_from_previous: number;
  change_percent: number;
}

export class BentonCountyPiltCalculator {
  
  // Standard levy rates based on historical data
  private static readonly STANDARD_LEVY_RATES = {
    'Current Expense': 0.9,
    'Health District': 0.025,
    'Indigent Soldier': 0.01125,
    'Road District': 1.2,
    'Port of Benton': 0.34,
    'Rural Library': 0.28,
    'Schools': 2.2,
    'Kiona-Benton SD #52': 2.1,
    'Prosser SD #116': 4.2,
    'Richland SD #400': 4.1,
    'Prosser Hospital': 0.32
  };

  // Standard land values based on recent assessments
  private static readonly LAND_VALUES = {
    dryland_per_acre: 224,
    irrigable_per_acre: 2636,
    lesser_riverfront_per_foot: 50,
    prime_riverfront_per_foot: 1965,
    rural_residential_per_acre: 35870,
    town_plats_per_acre: 122470
  };

  public calculatePilt(
    totalAssessedValue: number,
    customLevyRates?: Record<string, number>,
    year: string = new Date().getFullYear().toString()
  ): PiltCalculationResult {
    
    const levyRates = { ...BentonCountyPiltCalculator.STANDARD_LEVY_RATES, ...customLevyRates };
    const districts: PiltDistrict[] = [];

    // Calculate PILT for each district
    Object.entries(levyRates).forEach(([districtName, levyRate]) => {
      let assessedValue = totalAssessedValue;
      
      // Special handling for school districts (they have specific assessed values)
      if (districtName === 'Kiona-Benton SD #52') {
        assessedValue = this.calculateKionaBentonAssessedValue();
      } else if (districtName === 'Prosser SD #116') {
        assessedValue = this.calculateProsserSDAssessedValue();
      } else if (districtName === 'Richland SD #400') {
        assessedValue = this.calculateRichlandSDAssessedValue(totalAssessedValue);
      } else if (districtName === 'Prosser Hospital') {
        assessedValue = this.calculateProsserHospitalAssessedValue();
      }

      const piltDue = (assessedValue * levyRate) / 1000;
      
      districts.push({
        name: districtName,
        assessed_value: assessedValue,
        levy_rate: levyRate,
        pilt_due: piltDue
      });
    });

    const totalPiltDue = districts.reduce((sum, district) => sum + district.pilt_due, 0);

    return {
      year,
      total_assessed_value: totalAssessedValue,
      total_pilt_due: totalPiltDue,
      districts: districts.sort((a, b) => b.pilt_due - a.pilt_due), // Sort by PILT amount descending
      land_classifications: this.generateLandClassifications(),
      certification_letter: {
        assessor_name: 'Bill Spencer',
        treasurer_name: 'Ken Spencer',
        date: new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        total_assessed_value: totalAssessedValue
      }
    };
  }

  private calculateKionaBentonAssessedValue(): number {
    // Based on land classifications from historical data
    const dryland = 8547 * BentonCountyPiltCalculator.LAND_VALUES.dryland_per_acre;
    const irrigable = 642 * BentonCountyPiltCalculator.LAND_VALUES.irrigable_per_acre;
    return dryland + irrigable;
  }

  private calculateProsserSDAssessedValue(): number {
    const dryland = 15352 * BentonCountyPiltCalculator.LAND_VALUES.dryland_per_acre;
    const irrigable = 5132 * BentonCountyPiltCalculator.LAND_VALUES.irrigable_per_acre;
    return dryland + irrigable;
  }

  private calculateRichlandSDAssessedValue(totalAssessedValue: number): number {
    // Richland gets the majority of the assessed value minus specific district allocations
    const kionaBenton = this.calculateKionaBentonAssessedValue();
    const prosserSD = this.calculateProsserSDAssessedValue();
    const prosserHospital = this.calculateProsserHospitalAssessedValue();
    
    return totalAssessedValue - kionaBenton - prosserSD - prosserHospital;
  }

  private calculateProsserHospitalAssessedValue(): number {
    const dryland = 15455 * BentonCountyPiltCalculator.LAND_VALUES.dryland_per_acre;
    const irrigable = 2951 * BentonCountyPiltCalculator.LAND_VALUES.irrigable_per_acre;
    return dryland + irrigable;
  }

  private generateLandClassifications(): LandClassification[] {
    return [
      {
        type: 'dryland',
        unit: 'acre',
        acres_or_feet: 34322.64,
        rate_per_unit: BentonCountyPiltCalculator.LAND_VALUES.dryland_per_acre,
        total_value: 34322.64 * BentonCountyPiltCalculator.LAND_VALUES.dryland_per_acre
      },
      {
        type: 'irrigable',
        unit: 'acre',
        acres_or_feet: 92497.71,
        rate_per_unit: BentonCountyPiltCalculator.LAND_VALUES.irrigable_per_acre,
        total_value: 92497.71 * BentonCountyPiltCalculator.LAND_VALUES.irrigable_per_acre
      },
      {
        type: 'lesser_riverfront',
        unit: 'linear_foot',
        acres_or_feet: 128978,
        rate_per_unit: BentonCountyPiltCalculator.LAND_VALUES.lesser_riverfront_per_foot,
        total_value: 128978 * BentonCountyPiltCalculator.LAND_VALUES.lesser_riverfront_per_foot
      },
      {
        type: 'prime_riverfront',
        unit: 'linear_foot',
        acres_or_feet: 30672,
        rate_per_unit: BentonCountyPiltCalculator.LAND_VALUES.prime_riverfront_per_foot,
        total_value: 30672 * BentonCountyPiltCalculator.LAND_VALUES.prime_riverfront_per_foot
      },
      {
        type: 'rural_residential',
        unit: 'acre',
        acres_or_feet: 590.5,
        rate_per_unit: BentonCountyPiltCalculator.LAND_VALUES.rural_residential_per_acre,
        total_value: 590.5 * BentonCountyPiltCalculator.LAND_VALUES.rural_residential_per_acre
      },
      {
        type: 'town_plats',
        unit: 'acre',
        acres_or_feet: 644,
        rate_per_unit: BentonCountyPiltCalculator.LAND_VALUES.town_plats_per_acre,
        total_value: 644 * BentonCountyPiltCalculator.LAND_VALUES.town_plats_per_acre
      }
    ];
  }

  public generateYearOverYearComparison(results: PiltCalculationResult[]): YearOverYearComparison[] {
    const sorted = results.sort((a, b) => parseInt(a.year) - parseInt(b.year));
    
    return sorted.map((result /* , index */) => {
      const previousYear = index > 0 ? sorted[index - 1] : null;
      const changeFromPrevious = previousYear ? result.total_pilt_due - previousYear.total_pilt_due : 0;
      const changePercent = previousYear ? (changeFromPrevious / previousYear.total_pilt_due) * 100 : 0;

      return {
        year: result.year,
        total_pilt: result.total_pilt_due,
        change_from_previous: changeFromPrevious,
        change_percent: changePercent
      };
    });
  }

  public generateCertificationLetter(result: PiltCalculationResult): string {
    return `${result.certification_letter.date}

Benton County Treasurer
${result.certification_letter.treasurer_name}
PO Box 630
Prosser WA 99350

I, ${result.certification_letter.assessor_name}, Assessor of Benton County, State of Washington, do hereby certify that the foregoing is a correct assessed value, with the appropriate levies for the applicable taxing districts. These values and levies have been applied to the Hanford lands within Benton County.

The assessed value of land for calculation of Payment in Lieu of Tax is: $${result.total_assessed_value.toLocaleString()}

Sincerely,

${result.certification_letter.assessor_name}
Benton County Assessor

Enclosures: Benton County Total Assessed Value
           Payment in Lieu of Tax for Hanford Site`;
  }

  public generateDistrictTable(result: PiltCalculationResult): string {
    let table = 'District\t\t\t\t\tAssessed Value\tLevy Rate*\t\tLess 81-874\n';
    table += '\t\t\t\t\t\t\t\t\t\tdeduction **\tPILT Due\n';
    table += '================================================================================\n';

    result.districts.forEach(district => {
      const assessedValue = `$${district.assessed_value.toLocaleString()}`;
      const levyRate = district.levy_rate.toFixed(10);
      const piltDue = `$${district.pilt_due.toLocaleString()}`;
      
      table += `${district.name.padEnd(35)}\t${assessedValue.padStart(15)}\t${levyRate.padStart(12)}\t\tn/a\t\t${piltDue.padStart(15)}\n`;
    });

    table += '================================================================================\n';
    table += `Total PILT DUE\t\t\t\t\t\t\t\t\t\t\t\t$${result.total_pilt_due.toLocaleString()}\n\n`;
    table += '* Levy rate is per $1,000 of value\n';

    return table;
  }

  public generateLandClassificationTable(result: PiltCalculationResult): string {
    let table = 'Land Classification\t\t\tAcres/Feet\t$/Unit\t\tValue\n';
    table += '================================================================\n';

    result.land_classifications.forEach(land => {
      const typeDisplay = land.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      const unit = land.unit === 'acre' ? 'per acre' : 'per linear foot';
      const acresOrFeet = land.acres_or_feet.toLocaleString();
      const rate = `$${land.rate_per_unit.toLocaleString()}`;
      const value = `$${land.total_value.toLocaleString()}`;
      
      table += `${typeDisplay} (${unit})\t${acresOrFeet.padStart(12)}\t${rate.padStart(10)}\t${value.padStart(15)}\n`;
    });

    const totalValue = result.land_classifications.reduce((sum, land) => sum + land.total_value, 0);
    table += '================================================================\n';
    table += `Grand Total\t\t\t\t\t\t\t$${totalValue.toLocaleString()}\n`;

    return table;
  }
}
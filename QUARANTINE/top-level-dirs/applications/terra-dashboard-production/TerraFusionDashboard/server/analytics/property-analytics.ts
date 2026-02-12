import { db } from '../db';
import { properties } from '@shared/schema';
import { sql, desc, asc, count, avg, min, max, sum } from 'drizzle-orm';

export interface PropertyAnalytics {
  totalProperties: number;
  totalAssessedValue: number;
  averageAssessedValue: number;
  medianAssessedValue: number;
  propertyTypeDistribution: Array<{
    type: string;
    count: number;
    totalValue: number;
    avgValue: number;
  }>;
  cityDistribution: Array<{
    city: string;
    count: number;
    totalValue: number;
    avgValue: number;
  }>;
  valueBands: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  yearBuiltAnalysis: Array<{
    decade: string;
    count: number;
    avgValue: number;
  }>;
}

export class PropertyAnalyticsService {
  async getPropertyAnalytics(): Promise<PropertyAnalytics> {
    // Get basic statistics
    const basicStats = await db
      .select({
        count: count(),
        totalValue: sum(sql`CAST(${properties.assessedValue} AS DECIMAL)`),
        avgValue: avg(sql`CAST(${properties.assessedValue} AS DECIMAL)`),
        minValue: min(sql`CAST(${properties.assessedValue} AS DECIMAL)`),
        maxValue: max(sql`CAST(${properties.assessedValue} AS DECIMAL)`)
      })
      .from(properties)
      .where(sql`${properties.active} = true`);

    // Get median value
    const medianQuery = await db
      .select({ value: sql`CAST(${properties.assessedValue} AS DECIMAL)` })
      .from(properties)
      .where(sql`${properties.active} = true`)
      .orderBy(sql`CAST(${properties.assessedValue} AS DECIMAL)`)
      .limit(1)
      .offset(Math.floor(basicStats[0].count / 2));

    // Property type distribution
    const typeDistribution = await db
      .select({
        type: properties.propertyType,
        count: count(),
        totalValue: sum(sql`CAST(${properties.assessedValue} AS DECIMAL)`),
        avgValue: avg(sql`CAST(${properties.assessedValue} AS DECIMAL)`)
      })
      .from(properties)
      .where(sql`${properties.active} = true`)
      .groupBy(properties.propertyType)
      .orderBy(desc(count()));

    // City distribution
    const cityDistribution = await db
      .select({
        city: sql`CASE 
          WHEN ${properties.address} LIKE '%Kennewick%' THEN 'Kennewick'
          WHEN ${properties.address} LIKE '%Richland%' THEN 'Richland'
          WHEN ${properties.address} LIKE '%Prosser%' THEN 'Prosser'
          WHEN ${properties.address} LIKE '%Benton City%' THEN 'Benton City'
          WHEN ${properties.address} LIKE '%West Richland%' THEN 'West Richland'
          WHEN ${properties.address} LIKE '%Finley%' THEN 'Finley'
          ELSE 'Other Benton County'
        END`,
        count: count(),
        totalValue: sum(sql`CAST(${properties.assessedValue} AS DECIMAL)`),
        avgValue: avg(sql`CAST(${properties.assessedValue} AS DECIMAL)`)
      })
      .from(properties)
      .where(sql`${properties.active} = true`)
      .groupBy(sql`CASE 
        WHEN ${properties.address} LIKE '%Kennewick%' THEN 'Kennewick'
        WHEN ${properties.address} LIKE '%Richland%' THEN 'Richland'
        WHEN ${properties.address} LIKE '%Prosser%' THEN 'Prosser'
        WHEN ${properties.address} LIKE '%Benton City%' THEN 'Benton City'
        WHEN ${properties.address} LIKE '%West Richland%' THEN 'West Richland'
        WHEN ${properties.address} LIKE '%Finley%' THEN 'Finley'
        ELSE 'Other Benton County'
      END`)
      .orderBy(desc(count()));

    // Value bands
    const valueBands = await db
      .select({
        range: sql`CASE 
          WHEN CAST(${properties.assessedValue} AS DECIMAL) < 100000 THEN 'Under $100K'
          WHEN CAST(${properties.assessedValue} AS DECIMAL) < 250000 THEN '$100K - $250K'
          WHEN CAST(${properties.assessedValue} AS DECIMAL) < 500000 THEN '$250K - $500K'
          WHEN CAST(${properties.assessedValue} AS DECIMAL) < 1000000 THEN '$500K - $1M'
          WHEN CAST(${properties.assessedValue} AS DECIMAL) < 5000000 THEN '$1M - $5M'
          ELSE 'Over $5M'
        END`,
        count: count()
      })
      .from(properties)
      .where(sql`${properties.active} = true`)
      .groupBy(sql`CASE 
        WHEN CAST(${properties.assessedValue} AS DECIMAL) < 100000 THEN 'Under $100K'
        WHEN CAST(${properties.assessedValue} AS DECIMAL) < 250000 THEN '$100K - $250K'
        WHEN CAST(${properties.assessedValue} AS DECIMAL) < 500000 THEN '$250K - $500K'
        WHEN CAST(${properties.assessedValue} AS DECIMAL) < 1000000 THEN '$500K - $1M'
        WHEN CAST(${properties.assessedValue} AS DECIMAL) < 5000000 THEN '$1M - $5M'
        ELSE 'Over $5M'
      END`);

    // Year built analysis
    const yearBuiltAnalysis = await db
      .select({
        decade: sql`CASE 
          WHEN ${properties.yearBuilt} IS NULL THEN 'Unknown'
          WHEN ${properties.yearBuilt} < 1950 THEN 'Pre-1950'
          WHEN ${properties.yearBuilt} < 1960 THEN '1950s'
          WHEN ${properties.yearBuilt} < 1970 THEN '1960s'
          WHEN ${properties.yearBuilt} < 1980 THEN '1970s'
          WHEN ${properties.yearBuilt} < 1990 THEN '1980s'
          WHEN ${properties.yearBuilt} < 2000 THEN '1990s'
          WHEN ${properties.yearBuilt} < 2010 THEN '2000s'
          WHEN ${properties.yearBuilt} < 2020 THEN '2010s'
          ELSE '2020s'
        END`,
        count: count(),
        avgValue: avg(sql`CAST(${properties.assessedValue} AS DECIMAL)`)
      })
      .from(properties)
      .where(sql`${properties.active} = true`)
      .groupBy(sql`CASE 
        WHEN ${properties.yearBuilt} IS NULL THEN 'Unknown'
        WHEN ${properties.yearBuilt} < 1950 THEN 'Pre-1950'
        WHEN ${properties.yearBuilt} < 1960 THEN '1950s'
        WHEN ${properties.yearBuilt} < 1970 THEN '1960s'
        WHEN ${properties.yearBuilt} < 1980 THEN '1970s'
        WHEN ${properties.yearBuilt} < 1990 THEN '1980s'
        WHEN ${properties.yearBuilt} < 2000 THEN '1990s'
        WHEN ${properties.yearBuilt} < 2010 THEN '2000s'
        WHEN ${properties.yearBuilt} < 2020 THEN '2010s'
        ELSE '2020s'
      END`);

    // Calculate percentages for value bands
    const totalCount = basicStats[0].count;
    const valueBandsWithPercentage = valueBands.map(band => ({
      ...band,
      percentage: (band.count / totalCount) * 100
    }));

    return {
      totalProperties: basicStats[0].count,
      totalAssessedValue: Number(basicStats[0].totalValue) || 0,
      averageAssessedValue: Number(basicStats[0].avgValue) || 0,
      medianAssessedValue: Number(medianQuery[0]?.value) || 0,
      propertyTypeDistribution: typeDistribution.map(t => ({
        type: t.type || 'Unknown',
        count: t.count,
        totalValue: Number(t.totalValue) || 0,
        avgValue: Number(t.avgValue) || 0
      })),
      cityDistribution: cityDistribution.map(c => ({
        city: c.city as string,
        count: c.count,
        totalValue: Number(c.totalValue) || 0,
        avgValue: Number(c.avgValue) || 0
      })),
      valueBands: valueBandsWithPercentage.map(b => ({
        range: b.range as string,
        count: b.count,
        percentage: b.percentage
      })),
      yearBuiltAnalysis: yearBuiltAnalysis.map(y => ({
        decade: y.decade as string,
        count: y.count,
        avgValue: Number(y.avgValue) || 0
      }))
    };
  }

  async exportPropertiesCSV(filters?: any): Promise<string> {
    let query = db
      .select({
        parcelId: properties.parcelId,
        address: properties.address,
        ownerName: properties.ownerName,
        assessedValue: properties.assessedValue,
        marketValue: properties.marketValue,
        landValue: properties.landValue,
        improvementValue: properties.improvementValue,
        squareFootage: properties.squareFootage,
        yearBuilt: properties.yearBuilt,
        propertyType: properties.propertyType,
        countyName: properties.countyName
      })
      .from(properties)
      .where(sql`${properties.active} = true`);

    const results = await query;

    const headers = [
      'Parcel ID', 'Address', 'Owner Name', 'Assessed Value', 'Market Value',
      'Land Value', 'Improvement Value', 'Square Footage', 'Year Built',
      'Property Type', 'County Name'
    ];

    const csvRows = [
      headers.join(','),
      ...results.map(row => [
        `"${row.parcelId}"`,
        `"${row.address}"`,
        `"${row.ownerName || ''}"`,
        row.assessedValue,
        row.marketValue || '',
        row.landValue,
        row.improvementValue,
        row.squareFootage || '',
        row.yearBuilt || '',
        `"${row.propertyType || ''}"`,
        `"${row.countyName}"`
      ].join(','))
    ];

    return csvRows.join('\n');
  }
}

export const propertyAnalytics = new PropertyAnalyticsService();
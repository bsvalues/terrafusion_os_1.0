import { InsertPermit } from '@shared/schema';

export class PermitClassifier {
  /**
   * Classifies permits according to permit procedures
   * @param permits - Array of permits to classify
   * @returns Classified permits with enterPermit and reason fields populated
   */
  classifyPermits(permits: InsertPermit[]): InsertPermit[] {
    return permits.map(permit => this.classifyPermit(permit));
  }
  
  /**
   * Classify a single permit according to business rules
   * @param permit - The permit to classify
   * @returns Classified permit with enterPermit and reason fields populated
   */
  classifyPermit(permit: InsertPermit): InsertPermit {
    const { neighborhoodCode, permitDescription } = permit;
    const description = permitDescription?.toLowerCase() || '';
    
    // 1. Check for commercial properties (neighborhood code starting with 6)
    if (neighborhoodCode?.startsWith('6')) {
      return {
        ...permit,
        enterPermit: true,
        reason: 'Commercial must be entered'
      };
    }
    
    // 2. Check for residential properties that should be skipped
    const skipKeywords = [
      'hvac', 
      're-roof', 
      'reroof',
      'heat pump', 
      'fence', 
      'water heater', 
      'mini split', 
      'like for like',
      'maintenance',
      'repair',
      'replacement'
    ];
    
    for (const keyword of skipKeywords) {
      if (description.includes(keyword)) {
        return {
          ...permit,
          enterPermit: false,
          reason: `Skipped due to: ${keyword}`
        };
      }
    }
    
    // 3. Check for specific permits that must be entered
    if (description.includes('pool') && (description.includes('in-ground') || description.includes('inground'))) {
      return {
        ...permit,
        enterPermit: true,
        reason: 'In-ground pool permit'
      };
    }
    
    if (description.includes('addition') || description.includes('new construction')) {
      return {
        ...permit,
        enterPermit: true,
        reason: 'New construction or addition'
      };
    }
    
    // 4. Default rule: enter the permit if not matched by other rules
    return {
      ...permit,
      enterPermit: true,
      reason: 'Default: Enter permit'
    };
  }
  
  /**
   * Calculate the summary counts for a batch of permits
   * @param permits - Classified permits
   * @returns Summary with total, enter, and skip counts
   */
  getSummary(permits: InsertPermit[]) {
    const totalCount = permits.length;
    const enterCount = permits.filter(p => p.enterPermit).length;
    const skipCount = totalCount - enterCount;
    
    return {
      totalCount,
      enterCount,
      skipCount
    };
  }
}

export default new PermitClassifier();

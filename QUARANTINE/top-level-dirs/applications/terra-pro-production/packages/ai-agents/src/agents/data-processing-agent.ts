import { BaseAgent } from "../core/base-agent";
import { AgentTask } from "../interfaces/agent";
import { AIService } from "../core/ai-service";

/**
 * Data Processing Agent
 *
 * Specializes in extracting, transforming, and loading (ETL) data
 * from various sources into the Terrafusion platform format.
 */
export class DataProcessingAgent extends BaseAgent {
  private aiService: AIService;

  /**
   * Constructor
   */
  constructor() {
    super(
      "data-processing-agent",
      "Data Processing Agent",
      "Specializes in extracting, transforming, and loading data from various sources",
      [
        "extract-data",
        "transform-data",
        "validate-data",
        "normalize-addresses",
        "geocode-addresses",
        "identify-duplicates",
      ]
    );

    this.aiService = AIService.getInstance();
  }

  /**
   * Process a task
   * @param task The task to process
   */
  protected async processTask<T, R>(task: AgentTask<T>): Promise<R> {
    switch (task.type) {
      case "extract-data":
        return this.extractData(task) as unknown as R;
      case "transform-data":
        return this.transformData(task) as unknown as R;
      case "validate-data":
        return this.validateData(task) as unknown as R;
      case "normalize-addresses":
        return this.normalizeAddresses(task) as unknown as R;
      case "geocode-addresses":
        return this.geocodeAddresses(task) as unknown as R;
      case "identify-duplicates":
        return this.identifyDuplicates(task) as unknown as R;
      default:
        throw new Error(`Unsupported task type: ${task.type}`);
    }
  }

  /**
   * Extract data from a source
   * @param task The task containing extraction parameters
   */
  private async extractData(task: AgentTask<any>): Promise<any> {
    const { sourceType, sourceData, extractionRules } = task.data;

    console.log(`Extracting data from ${sourceType} source`);

    // For demonstration, we'll use AI to help with the extraction
    const prompt = `
      I need to extract property data from the following ${sourceType} source:
      
      ${JSON.stringify(sourceData, null, 2)}
      
      Extraction rules:
      ${JSON.stringify(extractionRules, null, 2)}
      
      Please extract the relevant property information and return it as a valid JSON array 
      with objects containing these fields where available:
      - parcelId
      - address
      - city
      - state
      - zipCode
      - county
      - legalDescription
      - propertyType
      - acreage
      - yearBuilt
      - squareFeet
      - bedrooms
      - bathrooms
      - lastSaleDate
      - lastSaleAmount
      
      Ensure all property types are one of: residential, commercial, industrial, agricultural, vacant, exempt
    `;

    const extractedData = await this.aiService.generateJson(
      prompt,
      task.context?.provider || "openai"
    );

    return {
      sourceType,
      extractedRecords: Array.isArray(extractedData) ? extractedData : [],
      extractionTimestamp: new Date().toISOString(),
    };
  }

  /**
   * Transform data to conform to the system's data model
   * @param task The task containing transformation parameters
   */
  private async transformData(task: AgentTask<any>): Promise<any> {
    const { records, transformationRules } = task.data;

    console.log(`Transforming ${records.length} records`);

    // Apply transformations
    const transformedRecords = records.map((record: any) => {
      // Create a deep copy of the record
      const transformedRecord = JSON.parse(JSON.stringify(record));

      // Apply transformation rules
      if (transformationRules) {
        for (const [field, rule] of Object.entries(transformationRules)) {
          if (typeof rule === "function") {
            // This would be handled differently in a real implementation
            // since functions can't be easily serialized
            transformedRecord[field] = record[field];
          } else if (typeof rule === "string") {
            // Handle string-based transformations
            if (rule.startsWith("map:")) {
              // Map values according to a mapping
              const mapping = JSON.parse(rule.substring(4));
              transformedRecord[field] = mapping[record[field]] || record[field];
            } else if (rule.startsWith("format:")) {
              // Format values according to a format string
              const format = rule.substring(7);
              // Implementation would depend on the format
              transformedRecord[field] = record[field];
            }
          }
        }
      }

      return transformedRecord;
    });

    return {
      transformedRecords,
      transformationTimestamp: new Date().toISOString(),
    };
  }

  /**
   * Validate data against the system's data model
   * @param task The task containing validation parameters
   */
  private async validateData(task: AgentTask<any>): Promise<any> {
    const { records, validationRules } = task.data;

    console.log(`Validating ${records.length} records`);

    // Validate each record
    const validationResults = records.map((record: any) => {
      const errors: string[] = [];

      // Apply validation rules
      if (validationRules) {
        for (const [field, rule] of Object.entries(validationRules)) {
          if (typeof rule === "function") {
            // This would be handled differently in a real implementation
            // since functions can't be easily serialized
            if (!record[field]) {
              errors.push(`Field ${field} is missing`);
            }
          } else if (typeof rule === "string") {
            // Handle string-based validations
            if (rule === "required" && !record[field]) {
              errors.push(`Field ${field} is required`);
            } else if (rule.startsWith("regex:")) {
              const regex = new RegExp(rule.substring(6));
              if (record[field] && !regex.test(record[field])) {
                errors.push(`Field ${field} does not match the required format`);
              }
            } else if (rule.startsWith("enum:")) {
              const allowedValues = JSON.parse(rule.substring(5));
              if (record[field] && !allowedValues.includes(record[field])) {
                errors.push(`Field ${field} must be one of: ${allowedValues.join(", ")}`);
              }
            }
          }
        }
      }

      return {
        record,
        valid: errors.length === 0,
        errors,
      };
    });

    // Separate valid and invalid records
    const validRecords = validationResults
      .filter((result) => result.valid)
      .map((result) => result.record);

    const invalidRecords = validationResults
      .filter((result) => !result.valid)
      .map((result) => ({
        record: result.record,
        errors: result.errors,
      }));

    return {
      valid: invalidRecords.length === 0,
      validRecords,
      invalidRecords,
      validationTimestamp: new Date().toISOString(),
    };
  }

  /**
   * Normalize addresses to a standard format
   * @param task The task containing normalization parameters
   */
  private async normalizeAddresses(task: AgentTask<any>): Promise<any> {
    const { records, normalizationRules } = task.data;

    console.log(`Normalizing addresses for ${records.length} records`);

    // Use AI to normalize addresses
    const addressPrompt = `
      I need to normalize the following property addresses to ensure consistency:
      
      ${JSON.stringify(
        records.map((r: any) => ({
          id: r.id,
          address: r.address,
          city: r.city,
          state: r.state,
          zipCode: r.zipCode,
        })),
        null,
        2
      )}
      
      Please normalize these addresses according to USPS standards and return a JSON array 
      with objects containing:
      - id (from the original record)
      - normalizedAddress
      - normalizedCity
      - normalizedState
      - normalizedZipCode
    `;

    const normalizedAddresses = await this.aiService.generateJson(
      addressPrompt,
      task.context?.provider || "openai"
    );

    // Merge normalized addresses back into records
    const normalizedRecords = records.map((record: any) => {
      const normalized = Array.isArray(normalizedAddresses)
        ? normalizedAddresses.find((a: any) => a.id === record.id)
        : null;

      if (normalized) {
        return {
          ...record,
          address: normalized.normalizedAddress,
          city: normalized.normalizedCity,
          state: normalized.normalizedState,
          zipCode: normalized.normalizedZipCode,
          addressNormalized: true,
        };
      }

      return {
        ...record,
        addressNormalized: false,
      };
    });

    return {
      normalizedRecords,
      normalizationTimestamp: new Date().toISOString(),
    };
  }

  /**
   * Geocode addresses to get latitude and longitude
   * @param task The task containing geocoding parameters
   */
  private async geocodeAddresses(task: AgentTask<any>): Promise<any> {
    const { records } = task.data;

    console.log(`Geocoding addresses for ${records.length} records`);

    // In a real implementation, we would use a geocoding service
    // For this example, we'll simulate geocoding with AI assistance

    const geocodingPrompt = `
      I need to geocode the following property addresses:
      
      ${JSON.stringify(
        records.map((r: any) => ({
          id: r.id,
          address: r.address,
          city: r.city,
          state: r.state,
          zipCode: r.zipCode,
        })),
        null,
        2
      )}
      
      Please provide plausible lat/long coordinates for these addresses and return a JSON array 
      with objects containing:
      - id (from the original record)
      - latitude (decimal)
      - longitude (decimal)
    `;

    const geocodedResults = await this.aiService.generateJson(
      geocodingPrompt,
      task.context?.provider || "openai"
    );

    // Merge geocoded information back into records
    const geocodedRecords = records.map((record: any) => {
      const geocoded = Array.isArray(geocodedResults)
        ? geocodedResults.find((g: any) => g.id === record.id)
        : null;

      if (geocoded) {
        return {
          ...record,
          latitude: geocoded.latitude,
          longitude: geocoded.longitude,
          geocoded: true,
        };
      }

      return {
        ...record,
        geocoded: false,
      };
    });

    return {
      geocodedRecords,
      geocodingTimestamp: new Date().toISOString(),
    };
  }

  /**
   * Identify potential duplicate records
   * @param task The task containing duplicate detection parameters
   */
  private async identifyDuplicates(task: AgentTask<any>): Promise<any> {
    const { records, threshold = 0.8 } = task.data;

    console.log(`Identifying duplicates among ${records.length} records`);

    // For a real implementation, we would use a more sophisticated algorithm
    // For this example, we'll use AI to help identify potential duplicates

    const duplicatePrompt = `
      I need to identify potential duplicate property records:
      
      ${JSON.stringify(
        records.map((r: any) => ({
          id: r.id,
          parcelId: r.parcelId,
          address: r.address,
          city: r.city,
          state: r.state,
          zipCode: r.zipCode,
        })),
        null,
        2
      )}
      
      Please identify sets of records that appear to be duplicates and return a JSON array
      with objects containing:
      - duplicateSetId (a unique identifier for each set of duplicates)
      - recordIds (an array of record IDs that appear to be duplicates)
      - similarityScore (a value between 0 and 1 indicating how similar the records are)
      - reason (a brief explanation of why these records are considered duplicates)
    `;

    const duplicateSets = await this.aiService.generateJson(
      duplicatePrompt,
      task.context?.provider || "openai"
    );

    // Filter duplicate sets by threshold
    const filteredDuplicateSets = Array.isArray(duplicateSets)
      ? duplicateSets.filter((set: any) => set.similarityScore >= threshold)
      : [];

    return {
      duplicateSets: filteredDuplicateSets,
      totalSets: filteredDuplicateSets.length,
      detectionTimestamp: new Date().toISOString(),
    };
  }
}

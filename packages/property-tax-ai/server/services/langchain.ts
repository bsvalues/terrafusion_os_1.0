import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { storage } from "../storage";
import { 
  Property, 
  LandRecord, 
  Improvement, 
  Field,
  PacsModule
} from "../../shared/schema";

// Initialize the OpenAI model with the API key
const model = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
  modelName: "gpt-3.5-turbo"
});

// Create a template for translating natural language to structured queries
const promptTemplateText = "You are an AI assistant for the Benton County, Washington property tax system. " +
"Based on the following schema and the user's question, return only a JSON object " +
"with the necessary query parameters to search for properties in the database.\n\n" +
"SCHEMAS:\n" +
"- Property: id, propertyId, address, parcelNumber, propertyType, acres, value, status, lastUpdated, createdAt\n" +
"- LandRecord: id, propertyId, landUseCode, zoning, topography, frontage, depth, shape, utilities, floodZone\n" +
"- Improvement: id, propertyId, improvementType, yearBuilt, squareFeet, bedrooms, bathrooms, quality, condition\n" +
"- Field: id, propertyId, fieldType, fieldValue\n\n" +
"SUPPORTED LOCATIONS (All in Benton County, Washington):\n" +
"- Kennewick\n" +
"- Richland\n" +
"- West Richland\n" +
"- Prosser\n" +
"- Benton City\n\n" +
"USER'S QUESTION: {question}\n\n" +
"Return ONLY a valid JSON object with the following format. Do not include any explanations.";

const promptTemplate = new PromptTemplate({
  template: promptTemplateText,
  inputVariables: ["question"]
});

// Create the query processor chain
const queryProcessorChain = RunnableSequence.from([
  promptTemplate,
  model,
  new StringOutputParser()
]);

// Function to execute natural language queries
export async function processNaturalLanguageQuery(query: string) {
  try {
    // Get structured query parameters from LLM
    const structuredQueryJSON = await queryProcessorChain.invoke({
      question: query
    });
    
    // Parse the JSON response
    const structuredQuery = JSON.parse(structuredQueryJSON);
    
    // Make sure the original query is stored in the structuredQuery
    if (!structuredQuery.query) {
      structuredQuery.query = query;
    }
    
    // Execute the query based on the structured parameters
    return await executeStructuredQuery(structuredQuery);
  } catch (error) {
    console.error("Error processing natural language query:", error);
    throw new Error("Failed to process the natural language query");
  }
}

// Helper function to execute structured queries against our storage
async function executeStructuredQuery(structuredQuery: any) {
  const { entity, filters, limit, sort } = structuredQuery;
  
  // Get all properties as the base for our query
  let properties = await storage.getAllProperties();
  
  // Apply property filters if they exist
  if (filters.property) {
    const { address, propertyType, acres, value, status, location } = filters.property;
    
    if (address) {
      properties = properties.filter(p => p.address.toLowerCase().includes(address.toLowerCase()));
    }
    
    if (propertyType) {
      properties = properties.filter(p => p.propertyType.toLowerCase() === propertyType.toLowerCase());
    }
    
    if (status) {
      properties = properties.filter(p => p.status.toLowerCase() === status.toLowerCase());
    }
    
    if (location) {
      properties = properties.filter(p => p.address.toLowerCase().includes(location.toLowerCase()));
    }
    
    if (acres) {
      if (acres.min !== null) {
        properties = properties.filter(p => p.acres >= acres.min);
      }
      if (acres.max !== null) {
        properties = properties.filter(p => p.acres <= acres.max);
      }
    }
    
    if (value) {
      if (value.min !== null) {
        properties = properties.filter(p => p.value !== null && p.value >= value.min);
      }
      if (value.max !== null) {
        properties = properties.filter(p => p.value !== null && p.value <= value.max);
      }
    }
  }
  
  // Apply entity-specific filters and fetch related data
  let results: any[] = [];
  
  switch (entity) {
    case 'property':
      results = properties;
      break;
      
    case 'landRecord':
      // For each property, get the land records and filter them
      for (const property of properties) {
        const landRecords = await storage.getLandRecordsByPropertyId(property.propertyId);
        
        let filteredLandRecords = landRecords;
        
        if (filters.landRecord) {
          const { landUseCode, zoning, floodZone } = filters.landRecord;
          
          if (landUseCode) {
            filteredLandRecords = filteredLandRecords.filter(r => 
              r.landUseCode.toLowerCase() === landUseCode.toLowerCase()
            );
          }
          
          if (zoning) {
            filteredLandRecords = filteredLandRecords.filter(r => 
              r.zoning.toLowerCase() === zoning.toLowerCase()
            );
          }
          
          if (floodZone) {
            filteredLandRecords = filteredLandRecords.filter(r => 
              r.floodZone && r.floodZone.toLowerCase() === floodZone.toLowerCase()
            );
          }
        }
        
        // Add property information to each land record
        filteredLandRecords.forEach(record => {
          results.push({
            ...record,
            property
          });
        });
      }
      break;
      
    case 'improvement':
      // For each property, get the improvements and filter them
      for (const property of properties) {
        const improvements = await storage.getImprovementsByPropertyId(property.propertyId);
        
        let filteredImprovements = improvements;
        
        if (filters.improvement) {
          const { improvementType, yearBuilt, squareFeet, bedrooms, bathrooms, quality, condition } = filters.improvement;
          
          if (improvementType) {
            filteredImprovements = filteredImprovements.filter(i => 
              i.improvementType.toLowerCase() === improvementType.toLowerCase()
            );
          }
          
          if (quality) {
            filteredImprovements = filteredImprovements.filter(i => 
              i.quality && i.quality.toLowerCase() === quality.toLowerCase()
            );
          }
          
          if (condition) {
            filteredImprovements = filteredImprovements.filter(i => 
              i.condition && i.condition.toLowerCase() === condition.toLowerCase()
            );
          }
          
          if (bedrooms !== null) {
            filteredImprovements = filteredImprovements.filter(i => 
              i.bedrooms === bedrooms
            );
          }
          
          if (bathrooms !== null) {
            filteredImprovements = filteredImprovements.filter(i => 
              i.bathrooms === bathrooms
            );
          }
          
          if (yearBuilt) {
            if (yearBuilt.min !== null) {
              filteredImprovements = filteredImprovements.filter(i => 
                i.yearBuilt !== null && i.yearBuilt >= yearBuilt.min
              );
            }
            if (yearBuilt.max !== null) {
              filteredImprovements = filteredImprovements.filter(i => 
                i.yearBuilt !== null && i.yearBuilt <= yearBuilt.max
              );
            }
          }
          
          if (squareFeet) {
            if (squareFeet.min !== null) {
              filteredImprovements = filteredImprovements.filter(i => 
                i.squareFeet !== null && i.squareFeet >= squareFeet.min
              );
            }
            if (squareFeet.max !== null) {
              filteredImprovements = filteredImprovements.filter(i => 
                i.squareFeet !== null && i.squareFeet <= squareFeet.max
              );
            }
          }
        }
        
        // Add property information to each improvement
        filteredImprovements.forEach(improvement => {
          results.push({
            ...improvement,
            property
          });
        });
      }
      break;
      
    case 'field':
      // For each property, get the fields and filter them
      for (const property of properties) {
        const fields = await storage.getFieldsByPropertyId(property.propertyId);
        
        // Add property information to each field
        fields.forEach(field => {
          results.push({
            ...field,
            property
          });
        });
      }
      break;
      
    default:
      results = properties;
  }
  
  // Apply sorting if specified
  if (sort) {
    results.sort((a, b) => {
      const aValue = a[sort.field];
      const bValue = b[sort.field];
      
      if (aValue === null) return 1;
      if (bValue === null) return -1;
      
      if (sort.direction === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }
  
  // Apply limit if specified
  if (limit !== null && limit > 0) {
    results = results.slice(0, limit);
  }
  
  return {
    query: structuredQuery.query || "Unknown query",
    results,
    count: results.length
  };
}

// Function to get a summary of properties from a natural language query
export async function getSummaryFromNaturalLanguage(query: string) {
  const result = await processNaturalLanguageQuery(query);
  
  // Create a summarization prompt
  const summaryPrompt = new PromptTemplate({
    template: "You are an AI assistant for Benton County, Washington's property tax system. " +
      "Based on the following property data, provide a 2-3 sentence summary of the results.\n\n" +
      "QUERY: {query}\n\n" +
      "DATA:\n{data}\n\n" +
      "Provide a concise, factual summary that focuses on the number of properties found and any notable " +
      "patterns or insights relevant to Benton County's property assessments. Be objective and only report " +
      "what is directly supported by the data.",
    inputVariables: ["query", "data"]
  });
  
  const summaryChain = RunnableSequence.from([
    summaryPrompt,
    model,
    new StringOutputParser()
  ]);
  
  const summary = await summaryChain.invoke({
    query,
    data: JSON.stringify(result.results, null, 2)
  });
  
  return {
    ...result,
    summary
  };
}
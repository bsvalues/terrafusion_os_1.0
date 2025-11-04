import { db } from "../server/db";
import { sql } from "drizzle-orm";

const sampleTerms = [
  {
    term: "Appraisal",
    shortDefinition: "An estimate of property market value by a licensed appraiser.",
    longDefinition:
      "An estimate of the market value of a property, performed by a licensed or certified appraiser using various valuation methods and market comparisons.",
    category: "Valuation",
    examples: ["Mortgage appraisal", "Tax assessment appraisal", "Insurance appraisal"],
    relatedTerms: ["Market Value", "Comparable Sales", "Assessment"],
    metadata: {
      isCommon: true,
      source: "The Appraisal Institute",
      contextualInfo:
        "Appraisals are typically required by lenders before issuing a mortgage loan to ensure the property value supports the loan amount.",
    },
  },
  {
    term: "Market Value",
    shortDefinition: "The likely selling price of a property in an open, competitive market.",
    longDefinition:
      "The most probable price a property would bring in an open and competitive market under fair sale conditions, assuming both buyer and seller are acting knowledgeably and in their own best interest.",
    category: "Valuation",
    examples: ["Fair market value", "Current market value", "Appraised market value"],
    relatedTerms: ["Appraisal", "Comparable Sales", "Fair Market Value"],
    metadata: {
      isCommon: true,
      source: "The Appraisal Institute",
      contextualInfo:
        "Market value assumes both buyer and seller are acting knowledgeably and in their own best interest, with reasonable time for exposure on the open market.",
    },
  },
  {
    term: "Millage Rate",
    shortDefinition: "Tax rate for property, expressed in mills ($0.001) per dollar.",
    longDefinition:
      "The tax rate applied to real estate or other property, expressed in mills per dollar of value. One mill equals one-tenth of one cent ($0.001).",
    category: "Taxation",
    examples: ["School district millage", "County millage rate", "Combined millage rate"],
    relatedTerms: ["Property Tax", "Assessment", "Tax Levy"],
    metadata: {
      isCommon: false,
      source: "International Association of Assessing Officers",
      contextualInfo:
        "Millage rates are used by local governments to calculate property taxes. For example, a millage rate of 10 mills means a tax of $10 for every $1,000 of assessed property value.",
    },
  },
  {
    term: "Comparable Sales",
    shortDefinition: "Similar properties recently sold, used to estimate subject property value.",
    longDefinition:
      "Properties similar to a subject property that have recently sold, used to estimate the value of the subject property by making adjustments for differences between properties.",
    category: "Valuation",
    examples: ["Recent neighborhood sales", "Similar property sales", "Adjusted comparable sales"],
    relatedTerms: ["Appraisal", "Market Value", "Adjustment"],
    metadata: {
      isCommon: true,
      source: "The Appraisal Institute",
      contextualInfo:
        "Appraisers typically use 3-6 comparable sales (comps) when determining a property's value, making adjustments for differences between the comps and the subject property.",
    },
  },
  {
    term: "Assessment",
    shortDefinition: "Official valuation of property for tax purposes by a government assessor.",
    longDefinition:
      "The official valuation of property for tax purposes, performed by a government assessor using mass appraisal techniques or individual property analysis.",
    category: "Taxation",
    examples: ["County tax assessment", "Municipal assessment", "Assessment ratio"],
    relatedTerms: ["Property Tax", "Assessed Value", "Millage Rate"],
    metadata: {
      isCommon: true,
      source: "International Association of Assessing Officers",
      contextualInfo:
        "Assessments are often performed on a mass scale for all properties in a jurisdiction, and may not reflect current market value depending on when the last assessment was conducted.",
    },
  },
];

async function addSampleRealEstateTerms() {
  try {
    console.log("Adding sample real estate terms...");

    // Check each term and add it if it doesn't exist
    for (const term of sampleTerms) {
      try {
        // Check if the term already exists
        const existingResult = await db.execute(sql`
          SELECT id FROM real_estate_terms WHERE term = ${term.term}
        `);

        if (existingResult.rows.length === 0) {
          // Term doesn't exist, add it
          await db.execute(sql`
            INSERT INTO real_estate_terms (
              term, 
              short_definition, 
              long_definition, 
              category, 
              examples, 
              related_terms, 
              metadata
            ) VALUES (
              ${term.term}, 
              ${term.shortDefinition}, 
              ${term.longDefinition}, 
              ${term.category}, 
              ${JSON.stringify(term.examples)}, 
              ${JSON.stringify(term.relatedTerms)}, 
              ${JSON.stringify(term.metadata)}
            )
          `);
          console.log(`Added term: ${term.term}`);
        } else {
          console.log(`Term already exists: ${term.term}`);
        }
      } catch (termError) {
        console.error(`Error processing term "${term.term}":`, termError);
      }
    }

    console.log("Sample terms process completed.");
  } catch (error) {
    console.error("Error adding sample terms:", error);
  } finally {
    process.exit(0);
  }
}

addSampleRealEstateTerms();

#!/usr/bin/env python3
"""
RAG (Retrieval-Augmented Generation) Setup for TerraFusion
Benton County, Washington GIS Workflow Assistant

This script initializes the vector database with Benton County-specific
GIS documents, procedures, and regulatory information.
"""

import os
import json
import logging
from pathlib import Path
from typing import List, Dict, Any

try:
    import chromadb
    from chromadb.config import Settings
except ImportError:
    print("ChromaDB not found. Installing...")
    os.system("pip install chromadb")
    import chromadb
    from chromadb.config import Settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BentonCountyRAGSetup:
    def __init__(self, db_path: str = "./chroma_db"):
        self.db_path = Path(db_path)
        self.db_path.mkdir(exist_ok=True)
        
        # Initialize ChromaDB client
        self.client = chromadb.PersistentClient(
            path=str(self.db_path),
            settings=Settings(anonymized_telemetry=False)
        )
        
        # Create collection for Benton County documents
        self.collection = self.client.get_or_create_collection(
            name="benton_county_gis",
            metadata={"description": "Benton County GIS workflow documents and procedures"}
        )
        
        logger.info(f"RAG database initialized at {self.db_path}")

    def load_benton_county_documents(self):
        """Load comprehensive Benton County GIS knowledge base"""
        
        documents = [
            {
                "id": "benton-county-overview",
                "title": "Benton County Assessment Overview",
                "content": """
                Benton County, Washington Assessment Overview
                
                Location: South-central Washington State
                County Seat: Prosser
                FIPS Code: 53005
                Population: 206,873 (2020 Census)
                Area: 1,703 square miles
                
                Assessment Districts:
                1. Richland District - Urban residential and commercial properties
                2. Kennewick District - Mixed urban development, largest city (83,920 population)
                3. West Richland District - Suburban residential (15,875 population)
                4. Prosser District - County seat, wine country, rural residential (6,062 population)
                5. Rural North District - Agricultural and rural residential properties
                6. Rural South District - Large agricultural operations
                
                Property Type Distribution:
                - Residential: 65% (Single family, condos, manufactured homes)
                - Agricultural: 20% (Farms, orchards, vineyards, ranches)
                - Commercial: 8% (Retail, office, hospitality)
                - Industrial: 4% (Manufacturing, processing, warehouses)
                - Vacant Land: 2% (Developable lots and acreage)
                - Utility/Government: 1% (Public facilities, Hanford Nuclear Reservation)
                
                Special Considerations:
                - Hanford Nuclear Reservation: 586 square miles of federal property
                - Wine Country: 200+ wineries, premium grape production
                - Agricultural Focus: Wheat, potatoes, onions, wine grapes
                - Columbia River: Recreational and irrigation impacts
                """,
                "category": "county_overview",
                "tags": ["assessment", "districts", "property_types", "benton_county"]
            },
            {
                "id": "sm00-procedures",
                "title": "SM00 Report Procedures",
                "content": """
                SM00 Report Generation Procedures for Benton County
                
                Legal Framework:
                - Washington State RCW 84.40 (Assessment of Property)
                - WAC 458-07 (Assessment Procedures)
                - Benton County Assessment Standards
                
                Required Elements:
                1. Parcel Identification
                   - Parcel Number: Format XXXXXXX-XXX-XXX
                   - Legal Description: Township/Range/Section format
                   - Situs Address: Physical property address
                
                2. Ownership Information
                   - Owner Name: From current county records
                   - Mailing Address: Current tax notice address
                   - Ownership Type: Individual, corporate, government, etc.
                
                3. Assessment Data
                   - Land Value: Current assessed land value
                   - Improvement Value: Building and structure values
                   - Total Assessed Value: Combined assessment
                   - Assessment Year: Current tax year (January 1st date)
                   - Assessment Method: Cost, market, or income approach
                
                4. Taxing Districts
                   - County: Benton County
                   - City: Kennewick, Richland, West Richland, Prosser, Benton City (if applicable)
                   - School District: Kennewick, Richland, Prosser, Kiona-Benton, Finley
                   - Special Districts: Fire, cemetery, hospital, library, parks
                
                5. Property Characteristics
                   - Zoning: Current zoning classification
                   - Land Use: Actual property use
                   - Acreage: Total property size
                   - Building Details: Square footage, year built, condition
                
                Compliance Requirements:
                - All information verified against county records
                - Legal descriptions match recorded documents
                - Assessment values current as of January 1st
                - Required signatures and certifications included
                - Format compliance with state standards
                """,
                "category": "procedures",
                "tags": ["sm00", "reports", "assessment", "procedures"]
            },
            {
                "id": "bla-procedures",
                "title": "Boundary Line Adjustment Procedures",
                "content": """
                Boundary Line Adjustment (BLA) Procedures for Benton County
                
                Legal Framework:
                - Washington State RCW 58.17.040 (Boundary Line Adjustments)
                - Benton County Code Title 19 (Subdivisions)
                - Benton County Code Title 20 (Zoning)
                
                Definition:
                A boundary line adjustment is the relocation of a common boundary line between two or more adjacent parcels, where the number of parcels is not increased.
                
                Requirements:
                1. Pre-Application
                   - Licensed surveyor boundary survey required
                   - Legal description verification
                   - Zoning compliance analysis
                   - Setback requirement review
                   - Utility easement identification
                
                2. Application Process
                   - Complete BLA application form
                   - Submit surveyed legal descriptions
                   - Pay application fees ($500 base fee)
                   - Provide site plan and vicinity map
                   - Environmental checklist (SEPA if required)
                
                3. Review Criteria
                   - No net increase in number of parcels
                   - Compliance with minimum lot size requirements:
                     * R-1 (Single Family): 0.25 acres minimum
                     * R-2 (Medium Density): 0.15 acres minimum
                     * RR (Rural Residential): 5.0 acres minimum
                     * AG (Agricultural): 20.0 acres minimum
                   - Setback requirements maintained:
                     * Front: 25 feet minimum
                     * Side: 10 feet minimum
                     * Rear: 20 feet minimum
                   - Access requirements satisfied
                   - Utility easements preserved or relocated
                
                4. Special Considerations
                   - Agricultural Land: Current use assessment implications
                   - Environmental: Critical areas, wetlands, shoreline
                   - Infrastructure: Road access, utilities, drainage
                   - Development: Future subdivision potential
                
                5. Recording Requirements
                   - Boundary line adjustment agreement
                   - Updated legal descriptions
                   - Recording fees and excise tax
                   - Deed amendments if necessary
                   - Assessment roll updates
                
                Processing Timeline:
                - Initial review: 14 days
                - Public notice period: 14 days (if required)
                - Final approval: 30 days from complete application
                - Recording: 10 days after approval
                
                Compliance Notes:
                - All resulting parcels must meet current zoning requirements
                - Environmental review may trigger SEPA process
                - Agricultural lands may affect current use assessment eligibility
                - Utility districts must approve easement modifications
                """,
                "category": "procedures",
                "tags": ["bla", "boundary", "adjustment", "subdivision", "zoning"]
            },
            {
                "id": "agricultural-assessment",
                "title": "Agricultural Current Use Assessment",
                "content": """
                Agricultural Current Use Assessment Program (RCW 84.34)
                
                Purpose:
                Reduce property tax burden on agricultural lands to preserve farming operations and prevent conversion to development.
                
                Eligibility Requirements:
                1. Minimum Acreage: 20 acres minimum in agricultural use
                2. Minimum Income: $1,500 gross income annually from agricultural use
                3. Active Farming: Demonstrated agricultural operation
                4. Farm Management Plan: Written plan on file with county
                5. Agricultural Purpose: Primary use must be farming/ranching
                
                Application Process:
                1. Initial Application
                   - Complete DOR Form 502-296 (Application for Current Use Assessment)
                   - Submit farm management plan
                   - Provide agricultural income documentation
                   - Pay $50 application fee
                
                2. Documentation Required
                   - Tax returns showing agricultural income
                   - Farm operation business license
                   - Crop production records
                   - Livestock inventory (if applicable)
                   - Soil and water conservation plan
                
                3. Annual Compliance
                   - File annual declaration by December 31st
                   - Maintain minimum income threshold
                   - Continue active farming operations
                   - Update farm management plan as needed
                
                Assessment Benefits:
                - Assessed at agricultural use value rather than highest and best use
                - Significant tax savings for qualified properties
                - Protection from development pressure taxation
                
                Withdrawal Penalties:
                If property is removed from current use assessment:
                - Additional tax equal to difference between current use assessment and market value assessment
                - Penalty applies to current year plus 7 prior years
                - Interest charged at 12% annually
                - Immediate payment required upon withdrawal
                
                Benton County Specific Considerations:
                1. Wine Grape Production
                   - Vineyard acreage qualifies for agricultural assessment
                   - Minimum 20-acre requirement applies
                   - Commercial wine production counts toward income requirement
                   - Tasting rooms and agritourism may affect eligibility
                
                2. Crop Types Common in Benton County
                   - Wheat (soft white winter wheat)
                   - Wine grapes (premium varieties)
                   - Potatoes (processing and fresh market)
                   - Onions, corn, alfalfa
                   - Tree fruits (limited areas)
                
                3. Irrigation Considerations
                   - Columbia River irrigation systems
                   - Water rights essential for agricultural value
                   - Irrigation district assessments
                   - Drought impact on production
                
                Monitoring and Compliance:
                - Annual field inspections by assessor staff
                - Review of income documentation
                - Verification of active farming operations
                - Coordination with conservation districts
                """,
                "category": "assessment",
                "tags": ["agricultural", "current_use", "rcw_84_34", "farming", "assessment"]
            },
            {
                "id": "wine-country-assessment",
                "title": "Wine Country Property Assessment",
                "content": """
                Wine Country Property Assessment Guidelines
                Benton County Wine Region
                
                Overview:
                Benton County is home to over 200 wineries and numerous vineyard operations, requiring specialized assessment approaches for wine country properties.
                
                Property Classifications:
                1. Vineyard Operations (Agricultural)
                   - Grape production for commercial wine making
                   - Qualifies for agricultural current use assessment
                   - Minimum 20 acres for current use eligibility
                   - Must demonstrate agricultural income
                
                2. Winery Facilities (Commercial/Industrial)
                   - Wine production facilities
                   - Commercial building assessment
                   - Equipment and infrastructure valuation
                   - Processing capability considerations
                
                3. Tasting Rooms (Commercial)
                   - Retail wine sales facilities
                   - Commercial property classification
                   - Tourism and hospitality considerations
                   - Parking and event facility impacts
                
                4. Agritourism Operations (Mixed Use)
                   - Event venues on agricultural property
                   - Wedding and special event facilities
                   - Mixed agricultural/commercial assessment
                   - Impact on current use assessment eligibility
                
                Assessment Methodology:
                1. Vineyard Land Valuation
                   - Agricultural use value for current use assessment
                   - Soil quality and microclimate factors
                   - Irrigation access and water rights
                   - AVA (American Viticultural Area) designation impact
                
                2. Grape Production Factors
                   - Varietal quality and market value
                   - Yield per acre considerations
                   - Established vine age and productivity
                   - Organic certification premiums
                
                3. Development Pressure
                   - Conversion potential to residential use
                   - Proximity to urban growth areas
                   - Market demand for vineyard properties
                   - View and recreational value
                
                Special Considerations:
                1. American Viticultural Areas (AVAs)
                   - Horse Heaven Hills AVA
                   - Red Mountain AVA (partial)
                   - Yakima Valley AVA (partial)
                   - Premium wine grape growing recognition
                
                2. Tourism Impact
                   - Wine tourism destination status
                   - Event hosting capabilities
                   - Agritourism revenue streams
                   - Impact on agricultural classification
                
                3. Water Rights
                   - Critical for vineyard operations
                   - Columbia River irrigation access
                   - Drought resilience factors
                   - Water cost considerations
                
                Current Use Assessment Compliance:
                - Vineyard operations must maintain agricultural focus
                - Commercial activities should be secondary to farming
                - Income requirements must be met from agricultural production
                - Event facilities may jeopardize current use eligibility
                
                Market Analysis Factors:
                - Premium wine grape market prices
                - Tourism destination property values
                - Agricultural land conversion pressure
                - Regional wine industry growth trends
                """,
                "category": "assessment",
                "tags": ["wine_country", "vineyard", "agritourism", "ava", "agricultural"]
            }
        ]
        
        # Add documents to vector database
        for doc in documents:
            try:
                self.collection.add(
                    documents=[doc["content"]],
                    metadatas=[{
                        "title": doc["title"],
                        "category": doc["category"],
                        "tags": ",".join(doc["tags"])
                    }],
                    ids=[doc["id"]]
                )
                logger.info(f"Added document: {doc['title']}")
            except Exception as e:
                logger.error(f"Failed to add document {doc['id']}: {e}")
        
        logger.info(f"Loaded {len(documents)} Benton County documents into RAG system")

    def test_rag_queries(self):
        """Test RAG system with sample queries"""
        test_queries = [
            "How do I generate an SM00 report?",
            "What are the requirements for boundary line adjustment?",
            "Agricultural current use assessment eligibility",
            "Wine country property assessment guidelines"
        ]
        
        logger.info("Testing RAG queries...")
        for query in test_queries:
            try:
                results = self.collection.query(
                    query_texts=[query],
                    n_results=2
                )
                logger.info(f"Query: {query}")
                logger.info(f"Results: {len(results['documents'][0])} documents found")
            except Exception as e:
                logger.error(f"Query failed: {e}")

    def get_collection_stats(self):
        """Get statistics about the document collection"""
        try:
            count = self.collection.count()
            logger.info(f"Total documents in collection: {count}")
            return count
        except Exception as e:
            logger.error(f"Failed to get collection stats: {e}")
            return 0

def main():
    """Initialize Benton County RAG system"""
    logger.info("Initializing TerraFusion RAG system for Benton County")
    
    rag_setup = BentonCountyRAGSetup()
    
    # Load Benton County documents
    rag_setup.load_benton_county_documents()
    
    # Test the system
    rag_setup.test_rag_queries()
    
    # Display statistics
    rag_setup.get_collection_stats()
    
    logger.info("RAG system initialization complete")
    logger.info("TerraFusion is ready for local LLM + RAG operations")

if __name__ == "__main__":
    main()
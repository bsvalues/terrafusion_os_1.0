import os
import logging
from langchain_openai import ChatOpenAI
from langchain_community.utilities.sql_database import SQLDatabase
from langchain_community.agent_toolkits.sql.base import create_sql_agent
from langchain_community.agent_toolkits.sql.toolkit import SQLDatabaseToolkit
from utils.auth import get_sql_connection_string
from prometheus_client import Counter
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("pacs_assistant")

QUERY_COUNTER = Counter('queries_total', 'Total queries processed', ['query_type'])

try:
    conn_str = get_sql_connection_string()
    logger.info("PostgreSQL connection string obtained successfully")
except Exception as e:
    logger.critical(f"Failed to get database connection string: {str(e)}")
    raise Exception(f"Cannot connect to database: {str(e)}")

try:
    db = SQLDatabase.from_uri(
        conn_str,
        include_tables=['properties', 'assessments', 'sales', 'neighborhoods', 'documents', 'query_logs'],
        sample_rows_in_table_info=3
    )
    logger.info("Database connection established")
except Exception as e:
    logger.critical(f"Failed to initialize database: {str(e)}")
    raise

if not os.getenv("OPENAI_API_KEY"):
    logger.critical("OpenAI API key not found in environment variables")
    raise ValueError("OPENAI_API_KEY environment variable is required")

llm = ChatOpenAI(
    model="gpt-4o",
    temperature=0
)

toolkit = SQLDatabaseToolkit(
    db=db, 
    llm=llm
)

cama_system_prompt = """You are Agent Smith, an AI assistant for TerraAgent, a property tax and valuation analysis system that works with Computer-Assisted Mass Appraisal (CAMA) data.

Your primary role is to help users access and analyze property data by translating natural language questions into SQL queries, and then presenting the results in a clear, readable format.

Common tables you'll work with:
- properties: Contains parcel_id, address, property class, etc.
- assessments: Contains assessment values and tax information
- sales: Contains property sale transaction data
- neighborhoods: Contains area statistics and trends

When answering questions:
1. Think about which tables contain the relevant data
2. Join tables as needed for comprehensive information
3. Format responses with proper headings and readable numbers
4. For financial values, include dollar signs and commas
5. Provide concise summaries of aggregate data

Remember, you are the interface to the TerraAgent database, so make the information accessible and actionable.
"""

agent = create_sql_agent(
    llm=llm,
    toolkit=toolkit,
    verbose=True,
    agent_type="openai-tools",
    top_k=3,
    system_message=cama_system_prompt
)

def run_sql_query(query_text):
    logger.info(f"Running SQL query: {query_text}")
    
    try:
        QUERY_COUNTER.labels(query_type="general").inc()
        result = agent.run(query_text)
        logger.info("Query executed successfully")
        return result
    
    except Exception as e:
        error_message = str(e)
        logger.error(f"Error executing query: {error_message}")
        raise

if __name__ == "__main__":
    while True:
        query = input("\nAsk PACS-Training DB> ")
        if query.lower() in ("exit", "quit"):
            break
        try:
            result = run_sql_query(query)
            print("\n", result)
        except Exception as e:
            print(f"Error: {str(e)}")
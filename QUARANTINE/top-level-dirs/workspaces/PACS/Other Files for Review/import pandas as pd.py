import pandas as pd
import sqlite3

# Path to your SQLite database
db_path = 'C:/path/to/your/Spectrum.s3db'

# Create a connection to the database
conn = sqlite3.connect(db_path)

# Query to select data from a table (replace 'your_table' with your actual table name)
query = "SELECT * FROM your_table"

# Read the data into a pandas DataFrame
df = pd.read_sql_query(query, conn)

# Close the connection
conn.close()

# Display the DataFrame
print(df)
def load_field_mappings():
    # Connect to the SQLite database and load mappings from the PropertyFieldMapping table
    conn = sqlite3.connect(db_path)
    query = "SELECT SourceFieldName, SpectrumFieldName FROM PropertyFieldMapping"
    mappings = pd.read_sql(query, conn)
    conn.close()
    # Convert the mappings to a dictionary
    field_mapping_dict = dict(zip(mappings['SourceFieldName'], mappings['SpectrumFieldName']))
    return field_mapping_dict
def load_custom_field_mappings():
    if os.path.exists("custom_mappings.json"):
        with open("custom_mappings.json", "r") as f:
            custom_mappings = json.load(f)
        return custom_mappings
mls_file = filedialog.askopenfilename(filetypes=[("CSV files", "*.csv")])
def load_mls_data(file_path):
    mls_data = pd.read_csv(file_path)
    mls_data['Price'] = mls_data['Price'].replace({'$': '', ',': ''}, regex=True).astype(float)
    mls_data['Total SQFT'] = mls_data['Total SQFT'].replace({',': ''}, regex=True).astype(float)
    return mls_data
def map_fields(mls_data, field_mappings):
    mapped_data = mls_data.rename(columns=field_mappings)
    return mapped_data
def export_cleaned_data(mls_data, export_path):
    mls_data.to_csv(export_path, index=False)
export_file = filedialog.asksaveasfilename(defaultextension=".csv", filetypes=[("CSV files", "*.csv")])
def export_cleaned_data(mls_data, export_path):
    mls_data.to_csv(export_path, index=False)
export_file = filedialog.asksaveasfilename(defaultextension=".csv", filetypes=[("CSV files", "*.csv")])
synced_folder = r"C:\Users\Public\Documents\a la mode\Reports"
shutil.copy(file_path, synced_folder)

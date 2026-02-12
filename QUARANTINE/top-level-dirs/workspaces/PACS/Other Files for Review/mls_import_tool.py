import pandas as pd
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import json
import os
import logging
import shutil
import sqlite3

# Path to the SQLite database for field mappings
db_path = 'C:/path/to/your/Spectrum.s3db'  # Update this to the correct path where your database is stored

# Set up logging
logging.basicConfig(filename='mls_import_tool.log', level=logging.INFO, 
                    format='%(asctime)s:%(levelname)s:%(message)s')

# Function to load and clean MLS data
def load_mls_data(file_path):
    try:
        mls_data = pd.read_csv(file_path)
        # Clean the 'Price' column by removing the dollar sign and commas
        mls_data['Price'] = mls_data['Price'].replace({'$': '', ',': ''}, regex=True).astype(float)
        mls_data['Total SQFT'] = mls_data['Total SQFT'].replace({',': ''}, regex=True).astype(float)
        logging.info(f"MLS data loaded from {file_path}")
        return mls_data
    except Exception as e:
        logging.error(f"Error loading MLS data: {e}")
        raise e

# Function to load field mappings from the Spectrum.s3db database
def load_field_mappings():
    try:
        conn = sqlite3.connect(db_path)
        query = "SELECT SourceFieldName, SpectrumFieldName FROM PropertyFieldMapping"
        mappings = pd.read_sql(query, conn)
        conn.close()

        # Convert the mappings to a dictionary
        field_mapping_dict = dict(zip(mappings['SourceFieldName'], mappings['SpectrumFieldName']))
        logging.info("Field mappings loaded from database.")
        return field_mapping_dict

    except Exception as e:
        logging.error(f"Error loading field mappings: {e}")
        messagebox.showerror("Error", f"Failed to load field mappings: {e}")
        raise e

# Function to map fields from MLS data to Spectrum field names
def map_fields(mls_data, field_mappings):
    try:
        mapped_data = mls_data.rename(columns=field_mappings)
        logging.info("Field mapping applied.")
        return mapped_data
    except Exception as e:
        logging.error(f"Error during field mapping: {e}")
        raise e

# Function to validate data
def validate_data(mls_data, required_fields):
    missing_fields = []
    invalid_data = []

    for field in required_fields:
        if field not in mls_data.columns or mls_data[field].isnull().any():
            missing_fields.append(field)

    for field in ['ClosedPrice', 'SquareFootage', 'Bedrooms', 'Bathrooms']:
        if field in mls_data.columns:
            if not pd.api.types.is_numeric_dtype(mls_data[field]):
                invalid_data.append(f"{field} contains non-numeric data")

    if missing_fields or invalid_data:
        error_message = "Validation Failed:\n"
        if missing_fields:
            error_message += f"Missing fields: {', '.join(missing_fields)}\n"
        if invalid_data:
            error_message += f"Invalid data types: {', '.join(invalid_data)}"
        logging.warning(error_message)
        messagebox.showerror("Validation Error", error_message)
        return False
    else:
        logging.info("Data validation passed.")
        messagebox.showinfo("Validation Success", "Data validation passed.")
        return True

# Function to export cleaned data (CSV)
def export_cleaned_data(mls_data, export_path):
    try:
        mls_data.to_csv(export_path, index=False)
        logging.info(f"Data exported successfully to {export_path}")
        messagebox.showinfo("Success", f"Data exported to {export_path}")
    except Exception as e:
        logging.error(f"Error exporting data: {e}")
        raise e

# Function to automatically save to synced folder
def save_to_synced_folder(file_path):
    # Path to the synced folder (you can customize this to match your setup)
    synced_folder = r"C:\Users\Public\Documents\a la mode\Reports"
    
    try:
        # Copy the file to the synced folder
        shutil.copy(file_path, synced_folder)
        logging.info(f"File copied to synced folder: {synced_folder}")
        messagebox.showinfo("Success", f"File successfully saved to the synced folder!")
    except Exception as e:
        logging.error(f"Error copying file to synced folder: {e}")
        messagebox.showerror("Error", f"Failed to save file to synced folder: {e}")

# Main function to run the import tool
def run_import_tool():
    mls_file = filedialog.askopenfilename(filetypes=[("CSV files", "*.csv")])

    if not mls_file:
        logging.warning("Input Missing: MLS file not selected.")
        messagebox.showwarning("Input Missing", "Please select the MLS CSV file.")
        return

    try:
        # Load the field mappings from the database
        field_mappings = load_field_mappings()

        # Load and clean the MLS data
        mls_data = load_mls_data(mls_file)

        # Apply field mappings
        mapped_data = map_fields(mls_data, field_mappings)

        # Validate the mapped data
        required_fields = list(field_mappings.values())
        if validate_data(mapped_data, required_fields):
            export_file = filedialog.asksaveasfilename(defaultextension=".csv", filetypes=[("CSV files", "*.csv")])
            export_cleaned_data(mapped_data, export_file)

            # Ask if the user wants to sync with Total for Alamode
            sync_choice = messagebox.askyesno("Sync with Total for Alamode", "Would you like to sync this file with Total for Alamode now?")
            if sync_choice:
                save_to_synced_folder(export_file)

    except Exception as e:
        logging.error(f"Error during import process: {e}")
        messagebox.showerror("Error", str(e))

# Set up the main UI
window = tk.Tk()
window.title("MLS Import Tool for Total for Alamode")

frame = tk.Frame(window, padx=20, pady=20)
frame.pack()

label = tk.Label(frame, text="Import MLS Data into Total for Alamode")
label.pack(pady=10)

ttk.Button(frame, text="Run Import Tool", command=run_import_tool).pack(pady=10)

window.mainloop()

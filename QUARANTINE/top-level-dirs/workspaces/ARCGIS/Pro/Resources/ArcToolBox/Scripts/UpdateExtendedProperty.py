"""
COPYRIGHT 2019 ESRI

TRADE SECRETS: ESRI PROPRIETARY AND CONFIDENTIAL
Unpublished material - all rights reserved under the
Copyright Laws of the United States.

For additional information, contact:
Environmental Systems Research Institute, Inc.
Attn: Contracts Dept
380 New York Street
Redlands, California, USA 92373

email: contracts@esri.com

---------------------------------------------------------------------------
Source Name:   UpdateExtendedProperty.py
Version:       ArcGIS 2.5
Author:        Environmental Systems Research Institute Inc.
Description:   Increases job attempt count each time a tool is executed.
---------------------------------------------------------------------------
"""


# Import required modules
import arcpy
import os
import sys
import TopoWorkflowUtilities as utils
import DefenseUtilities


def isfloat(value):
    try:
        fl = float(value)
        return True
    except:
        return False


# Check out licenses
if DefenseUtilities.licenselevel() == 'Basic' or DefenseUtilities.licenselevel() == 'None':
    raise DefenseUtilities.LicenseException()

if 'Available' == arcpy.CheckExtension('defense'):
    DefenseUtilities.checkoutextensions(['defense', 'JTX'])
elif 'Available' == arcpy.CheckExtension('Foundation'):
    DefenseUtilities.checkoutextensions(['Foundation', 'JTX'])
else:
    raise DefenseUtilities.LicenseException('Tool requires either defense or Foundation extension to run.')

# Set variables
job_id = int(arcpy.GetParameterAsText(0))
properties_table = arcpy.GetParameterAsText(1)
property_field = arcpy.GetParameterAsText(2)
value = arcpy.GetParameter(3)
increment = arcpy.GetParameter(4)
database_path = arcpy.GetParameterAsText(5)

# Set temp workspace
temp_workspace = utils.ScratchWorkspace()

# Get wmx connection
connection = None
try:
    if database_path not in ('#', ' ', '') and database_path is not None:
        connection = utils.WmxConnection(arcpy.wmx.Connect(database_path), temp_workspace)
    else:
        connection = utils.WmxConnection(arcpy.wmx.Connect(), temp_workspace)
except Exception as e:
    arcpy.AddError(e)
    sys.exit(1)

# Get job
try:
    job = utils.Job(connection, job_id)
except Exception as e:
    arcpy.AddIDMessage("ERROR", 90286, job_id) # Unable to get WMX job with id %1.
    sys.exit(1)

# Get unqualified table name
table_name = os.path.basename(properties_table)
if '.' in table_name:
    table_name = table_name.split('.')
    table_name = table_name[len(table_name) - 1]

if table_name not in job.property_tables:
    arcpy.AddIDMessage("ERROR", 110, table_name) # <value> does not exist.
    sys.exit(1)

# Update Extended Properties
job_properties = job.get_properties(table_name)

if len(job_properties) == 0:
    arcpy.AddIDMessage("ERROR", 11, table_name) # Required fields missing.
    sys.exit(1)

if property_field not in job_properties[0]:
    arcpy.AddIDMessage("ERROR", 417, table_name) # Field does not exist
    sys.exit(1)

# Updating
prop_value = job_properties[0][property_field]
if increment and prop_value is not None:
    if value.isdigit():
        prop_value += int(value)
    elif isfloat(value):
        prop_value += float(value)
    else:
        prop_value += value
else:
    files = [".mapx", ".pagx", ".mxd", ".gdb", ".sde", ".pdf", ".xml", ".xlsm", ".zip"]
    if value.isdigit():
        prop_value = int(value)
    elif isfloat(value):
        prop_value = float(value) 
    elif any(x in value for x in files):
        if not os.path.exists(value):
            arcpy.AddWarning("The path specified for Value does not exist on disk.") # File does not exist
        else:
            prop_value = value
    else:
        prop_value = value

# Updating property
job.update_property(table_name, {property_field: prop_value})

arcpy.SetParameter(6, job_id)

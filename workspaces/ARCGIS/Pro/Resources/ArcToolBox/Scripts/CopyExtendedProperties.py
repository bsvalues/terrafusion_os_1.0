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
Source Name:   CopyExtendedProperties.py
Version:       ArcGIS 2.5
Author:        Environmental Systems Research Institute Inc.
Description:   Sets the data workspace for the chosen job.
---------------------------------------------------------------------------
"""


# Import required modules
import arcpy
import TopoWorkflowUtilities as utils
import DefenseUtilities
import sys

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
source_job_id = int(arcpy.GetParameterAsText(0))
target_job_id = int(arcpy.GetParameterAsText(1))
table_name = arcpy.GetParameterAsText(2)
property_fields = arcpy.GetParameterAsText(3)
database_path = arcpy.GetParameterAsText(4)

# Unqualifying table name
table_name = table_name.split('.')[-1]

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

try:
    # Get job
    source_job = utils.Job(connection, source_job_id)
    target_job = utils.Job(connection, target_job_id)
except Exception as e:
    arcpy.AddIDMessage("ERROR", 90286, source_job_id) # Unable to get WMX job with id %1.
    sys.exit(1)

# Checking job assignment
try:
    utils.checkuser(connection, source_job_id)
except Exception as e:
    arcpy.AddError(e)
    sys.exit(1)

# Copy Extended Properties
# Getting extended properties from source_job and target_job
source_props = source_job.get_properties(table_name)
target_props = target_job.get_properties(table_name)

# Creating a list of fields to update based on property_fields
prop_field_list = property_fields.split(';')

# Comparing list to dictionaries for validity
target_keys = list(target_props[0].keys())

# Iterating through fields to update properties
update_dict = {}
for prop_field in prop_field_list:
    if prop_field in target_keys:
        update_dict[prop_field] = source_props[0][prop_field]

# Updating target_job
target_job.update_property(table_name, update_dict)

# Setting output parameter
arcpy.SetParameter(5, source_job_id)

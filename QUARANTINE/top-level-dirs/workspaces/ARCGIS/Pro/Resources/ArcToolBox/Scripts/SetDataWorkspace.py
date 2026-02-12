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
Source Name:   SetDataWorkspace.py
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
import os
import shutil

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
database_path = arcpy.GetParameterAsText(1)

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
    job = utils.Job(connection, job_id)
except Exception as e:
    arcpy.AddIDMessage("ERROR", 90286, job_id) # Unable to get WMX job with id %1.
    sys.exit(1)

# Checking job assignment
try:
    utils.checkuser(connection, job_id)
except Exception as e:
    arcpy.AddError(e)
    sys.exit(1)

# Set data workspace
# get the data source name from the production properties
properties = job.get_properties('TOPO_PRODUCTION_PROPERTIES')
job_name = job.job.name

if len(properties) > 0 and 'data_source_name' in properties[0]:
    db_name = properties[0]['data_source_name']
    if db_name not in ('', ' ', 'None', 'NULL') and db_name is not None:
        job.set_data_workspace(db_name)

        # Create version (Parent) JOB_ID; check for parent if not use job_id; read from properties for version name
        connection_file = arcpy.wmx.GetJobDataWorkspace(job_id, database_path)
        with arcpy.da.SearchCursor(os.path.join(connection.sde_connection, f'{connection.table_name_prepender}JTX_JOBS'), ['PARENT_VERSION'], f"job_id = '{job_id}'") as cur:
            for row in cur:
                parent_version = row[0]

        alt_version = properties[0]['alternate_version']
        if alt_version is not None and alt_version != '':
            db_versions = arcpy.ListVersions(connection_file)
            if alt_version in db_versions:
                arcpy.AddMessage("Setting job version to existing version {}".format(alt_version))
                version_name = alt_version
            else:
                raise Exception ("Alternate Version {} specified but version does not exist in job data workspace.".format(alt_version))
        else:

            arcpy.management.CreateVersion(connection_file, parent_version, f'{job_name}')
            version_name = f'{job_name}'
            arcpy.AddMessage("Creating new job version {}".format(version_name))



        job.job.versionName = version_name
        job.job.save()

        # Create SDE connection file (wmx tool to do this); create in root\JOB_ID
        sde_source = arcpy.wmx.GetJobDataWorkspace(job_id, database_path)
        new_sde_file = os.path.join(properties[0]['current_job_path'], 'Geodatabases', f'{job_name}.sde')
        shutil.copy2(str(sde_source), new_sde_file)

        try:
            desc = arcpy.Describe(new_sde_file)
            cp = desc.connectionProperties

            job.job.versionName = cp.version
            job.job.save()
        except:
            pass

        # Update SDE extended property
        job.update_property('TOPO_PRODUCTION_PROPERTIES', {'current_job_data_path': new_sde_file, 'current_job_data_type': 1})
    else:
        arcpy.AddError(f'Unable to set input data source, Data Source Name is {db_name}')
        sys.exit(1)

# Setting output parameter
arcpy.SetParameter(2, job_id)

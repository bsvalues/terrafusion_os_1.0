"""
COPYRIGHT 2022 ESRI

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
Source Name:   CancelRemainingTask.py
Version:       ArcGIS 3.0
Author:        Environmental Systems Research Institute Inc.
Description:   Sets all remaining task in a task group job to Abort status so
                child jobs will not be created.
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
    raise DefenseUtilities.LicenseException('Tool requires either Defense or Foundation extension to run.')

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

# Get job
job = None
try:
    job = utils.Job(connection, job_id)
except Exception as e:
    arcpy.AddIDMessage("ERROR", 90286, job_id) #Unable to get WMX job with id %1.
    sys.exit(1)




# get a list of all the tasks
task_properties = job.get_properties('TOPO_TASK_PROPERTIES')
i = 0
task_id = 0

# loop through tasks
for task in task_properties:
    # if task hasn't been started, set status to 20 (aborted)
    if task['task_status'] == 1:
        task['task_status'] = 20
        job.update_property('TOPO_TASK_PROPERTIES', task, index=i)
    i += 1


arcpy.SetParameter(2, job_id)

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
Source Name:   SetNextTask.py
Version:       ArcGIS 2.5
Author:        Environmental Systems Research Institute Inc.
Description:   Sets the next task in a workflow from the task list.
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

# Checking job assignment
try:
    utils.checkuser(connection, job_id)
except Exception as e:
    arcpy.AddError(e)
    sys.exit(1)

# get the task group ID associated with the job and create a task group object
try:
    task_group = utils.TaskGroup(connection, job.job_id, job.get_property('TOPO_TASK_GROUP_PROPERTIES', 'task_group_id'))
except Exception as e:
    arcpy.AddError(f'Invalid Job Type. Cannot access extended property table\n{e}')
    sys.exit(1)

if len(task_group.task_list) < 1:
    arcpy.AddIDMessage("ERROR", 90287) #Unable to set the next task in the group
    sys.exit(1)

# get the next task in the list
next_task = task_group.get_next_task()

# set next task
if -1 == next_task["current_task"]:
    #no more tasks, clear fields so loop for child jobs in parent workflow will exit
    next_task["current_task"] = 0
    next_task["current_task_job_type_name"] = ''
    job.update_property('TOPO_TASK_GROUP_PROPERTIES', next_task)
else:
    job.update_property('TOPO_TASK_GROUP_PROPERTIES', next_task)

arcpy.SetParameter(2, job_id)

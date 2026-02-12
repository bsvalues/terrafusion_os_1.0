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
Source Name:   InsertTaskGroup.py
Version:       ArcGIS 2.5
Author:        Environmental Systems Research Institute Inc.
Description:   Adds tasks from the chosen task group to a job.
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
''' Will users know task group id, should this be task group name? '''
task_group_id = int(arcpy.GetParameterAsText(1))
database_path = arcpy.GetParameterAsText(2)

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

# Checking for proper task_group_id
curr_wksp = arcpy.env.workspace
arcpy.env.workspace = connection.sde_connection
tasks = []
with arcpy.da.SearchCursor(f'{connection.table_name_prepender}TASK_GROUP', ['task_group_id']) as cur:
    for row in cur:
        tasks.append(row[0])
arcpy.env.workspace = curr_wksp
if task_group_id not in tasks:
    arcpy.AddError(f'Task Group ID {task_group_id} is not a valid Task Group ID')
    sys.exit(1)


# ---- Insert task group  ---
try:
    # get the task group object for the current job
    task_group = utils.TaskGroup(connection, job.job_id,
                                             job.get_property('TOPO_TASK_GROUP_PROPERTIES', 'task_group_id'))

    # insert a new task group
    updated_tasks, new_tasks = task_group.insert_task_group(job.get_property('TOPO_TASK_GROUP_PROPERTIES', 'current_task'),
                                                            task_group_id)

    # Add a record to the Topo Task Properties table for each new task
    if len(new_tasks) > 0:
        job.create_property('TOPO_TASK_PROPERTIES', new_tasks)


    # if tasks were updated, update the info in the extended properties
    # dates will change if tasks inserted before last task
    if len(updated_tasks) > 0:
        job.update_properties('TOPO_TASK_PROPERTIES', updated_tasks)

    # calculate total loe for the task group
    total_loe = job.get_property('TOPO_TASK_GROUP_PROPERTIES', 'task_group_loe')
    for task in new_tasks:
        task_loe = task['default_loe']
        total_loe += task_loe

    task_cnt = job.get_property('TOPO_TASK_GROUP_PROPERTIES', 'task_count')

    if task_cnt is None:
        task_cnt = len(new_tasks)
    else:
        task_cnt += len(new_tasks)
    # + len(new_tasks)

    # update the task count property to the topo_task_group_properties table
    update_group_props = {}
    update_group_props['task_count'] = task_cnt
    update_group_props['task_group_loe'] = float(total_loe)
    job.update_property('TOPO_TASK_GROUP_PROPERTIES', update_group_props)

    completed_loe = job.get_property('TOPO_TASK_GROUP_PROPERTIES', 'completed_task_loe')
    total_loe = job.get_property('TOPO_TASK_GROUP_PROPERTIES', 'task_group_loe')

    if completed_loe is not None and total_loe is not None and total_loe > 0:
        percent_complete = (completed_loe / total_loe) * 100
        job.set_percent_complete(percent_complete)
except Exception as e:
    arcpy.AddMessage(e)
    sys.exit(1)

''' Do we need to update the due date for the task group (parent) job? '''
arcpy.SetParameter(3, job_id)

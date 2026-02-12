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
Source Name:   SetTaskList.py
Version:       ArcGIS 2.5
Author:        Environmental Systems Research Institute Inc.
Description:   Populates the list of expected tasks for a job.
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

# Checking to see if tasks already exist
cur_wksp = arcpy.env.workspace
arcpy.env.workspace = connection.sde_connection
task_count = 0
with arcpy.da.SearchCursor(f'{connection.table_name_prepender}TOPO_TASK_PROPERTIES', ['objectid'], f'job_id = {job_id}') as cur:
    for row in cur:
        task_count += 1


arcpy.env.workspace = cur_wksp

if task_count > 0:
    arcpy.AddError(f'Job {job_id} already has tasks created. Not adding any tasks.')
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

# Get the task group id for the job from the extended properties and create a task group object
task_group_id = job.get_property('TOPO_TASK_GROUP_PROPERTIES', 'task_group_id')
if task_group_id in ('', ' ', 'NULL', 'None', 'NONE') or task_group_id is None:
    arcpy.AddError(f'The task group does not have a valid Task Group ID.')
    sys.exit(1)

task_group = utils.TaskGroup(connection, job.job_id, task_group_id)

# get the default properties for the task group
task_properties = task_group.get_default_task_properties()

# Creates new records in the Topo_Task_Properties table
# one record for each task in the task properties
job.create_property('TOPO_TASK_PROPERTIES', task_properties)

# calculate total loe for the task group
total_loe = 0

task_properties = None
task_group = None

# Refresh the TaskGroup now that we've added additional tasks
task_group = utils.TaskGroup(connection, job.job_id, task_group_id)

# Get the tasks for this group and calculate the loe & task count
task_properties = task_group.get_task_properties()

# task properties is a list of task objects
for task in task_properties:
    task_loe = task['default_loe']
    total_loe += task_loe



# determine if rework task id
arcpy.env.workspace = connection.sde_connection
rework_task_id = None
with arcpy.da.SearchCursor(f'{connection.table_name_prepender}TASK_GROUP', ['task_group_id', 'rework_task_id'], f'task_group_id = {task_group_id}') as cur:
    for row in cur:
        rework_task_id = row[1]


arcpy.env.workspace = cur_wksp

# add the task count property to the topo_task_group_properties table
task_cnt = len(task_properties)

update_group_props = {}
update_group_props['task_count'] = task_cnt
update_group_props['task_group_loe'] = float(total_loe)
update_group_props['rework_task_id'] = rework_task_id
job.update_property('TOPO_TASK_GROUP_PROPERTIES', update_group_props)

# Set initial start and due dates
job.set_dates(task_properties[0]['start_date'], task_properties[len(task_properties) - 1]['end_date'])

# check default production type
prod_type = job.get_property('TOPO_PRODUCTION_PROPERTIES', 'production_type_name')

# if the production type is not set, get the default production type from the task group
prod_props = {}
if not prod_type or prod_type in ['', 'NULL', 'None']:
    with arcpy.da.SearchCursor(r'{}\{}TASK_GROUP'.format(connection.sde_connection, connection.table_name_prepender),
                               ['default_production_type'], 'task_group_id = {}'.format(task_group_id)) as cur:
        for row in cur:
            prod_type = row[0]
            prod_props['production_type_name'] = prod_type

    job.update_property('TOPO_PRODUCTION_PROPERTIES', prod_props)

arcpy.SetParameter(2, job_id)
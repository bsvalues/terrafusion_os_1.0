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
Source Name:   CreateJobForTask.py
Version:       ArcGIS 2.5
Author:        Environmental Systems Research Institute Inc.
Description:   Automatically creates a Workflow Manager job for a task.
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

# Get parent job
parent_job = None
try:
    parent_job = utils.Job(connection, job_id)
except Exception as e:
    arcpy.AddIDMessage("ERROR", 90286, job_id) #Unable to get WMX job with id %1.
    sys.exit(1)

# Checking job assignment
try:
    utils.checkuser(connection, job_id)
except Exception as e:
    arcpy.AddError(e)
    sys.exit(1)

# Create child job
new_job = None
try:
    property = parent_job.get_property('TOPO_TASK_GROUP_PROPERTIES', 'current_task_job_type_name')
    new_job = connection.create_child_job(parent_job, property, True)
except Exception as e:
    arcpy.AddError('Unable to create child job with for job id {}. {}'.format(job_id, e))
    sys.exit(1)

child_job = None
try:
    child_job = utils.Job(connection, new_job.ID)
    if child_job is None:
        raise Exception('')
except Exception as e:
    arcpy.AddIDMessage("ERROR", 90286, new_job.ID) #Unable to get WMX job with id %1.
    sys.exit(1)

# --- Set child job properties ----
child_job.job.description = parent_job.job.description
child_job.job.priority = parent_job.job.priority
child_job.job.ownwer = parent_job.job.owner
child_job.job.save()

#  --- Set child job extended properties ----
desc = connection.wmx_connection.config.getJobTypeDescription(child_job.job.jobTypeID)
prop_tables_list = list(desc.extendedProperties.keys())
extended_property_tables = []
for table in prop_tables_list:
    table = table.upper()
    table = table.replace(connection.table_name_prepender.upper(), '')
    extended_property_tables.append(table)

arcpy.AddMessage(extended_property_tables)
##extended_property_tables = ['TOPO_PRODUCTION_PROPERTIES', 'TOPO_QC_PROPERTIES', 'TOPO_CARTO_PROPERTIES', 'TOPO_TASK_GROUP_PROPERTIES']
for prop_table in extended_property_tables:
    # get the current values from property table for the parent and child jobs
    parent_production_properties = parent_job.get_properties(prop_table)
    child_production_properties = child_job.get_properties(prop_table)

    # update matching child properties with values from parent
    if len(parent_production_properties) > 0 and len(child_production_properties) > 0:
        for key, value in parent_production_properties[0].items():
            if key in child_production_properties[0]:
                # make sure jtx_path is blank for child jobs.  jtx_path is only used by background process
                # and background process will set the value
                if key.upper() != 'JTC_PATH':
                    child_production_properties[0][key] = parent_production_properties[0][key]

        child_job.update_property(prop_table, child_production_properties[0])

# ---- Update Task Job Name ---
job_production_properties = child_job.get_properties('TOPO_PRODUCTION_PROPERTIES')
production_type = job_production_properties[0]['production_type_name']
product_name = job_production_properties[0]['product_name']
job_name = str(child_job.job.name)

if job_name in ('', ' ') or job_name is None:
    job_name = f'JOB_{job_id}'

if product_name and product_name.replace(' ', '_') not in job_name:
    job_name = f'{product_name}_{job_name}'.replace(' ', '_')

if production_type.replace(' ', '_') not in job_name:
    job_name = f'{production_type}_{job_name}'.replace(' ', '_')

child_job.job.name = job_name
child_job.job.save()

# get the current values from TOPO_TASK_GROUP_PROPERTIES for the parent and child jobs
current_task_id = parent_job.get_property('TOPO_TASK_GROUP_PROPERTIES', 'current_task')

#   --- Set child job start and due dates ---
# create task group object from parent job
''' Do we need to create the task group?  Can't we just create a single task ?'''
task_group = utils.TaskGroup(connection, parent_job.job_id,
                                         parent_job.get_property('TOPO_TASK_GROUP_PROPERTIES', 'task_group_id'))

# task_group is the list of task objects assoicated with the parent job

# create a list of tasks for the task group
task_properties = task_group.get_task_properties()

# task_properties is list of dictionaries with properties for each task
# get the dates for the task that is the current task
# default start and due dates were set when task list created.
''' Should we verify that the task dates are still valid?
what if today is before the task start date [task group running early]
what if today is past end date [task group running late]?'''
start_date = None
end_date = None

try:
    for task in task_properties:
        if task['objectid'] == current_task_id:
            start_date = task['start_date']
            end_date = task['end_date']
            task['task_job_id'] = new_job.ID
            task['task_status'] = 2
            parent_job.update_properties('TOPO_TASK_PROPERTIES', [task])
            break
except Exception as e:
    arcpy.AddError(e)
    sys.exit(1)
# set the job dates to match the task dates
child_job.set_dates(start_date, end_date)

task_properties = parent_job.get_properties('TOPO_TASK_PROPERTIES')

for task in task_properties:
    if task['task_job_id'] == new_job.ID:
        child_job.set_assignment(task['task_id'])
        break

# get the current step
current_step = parent_job.job.currentSteps[0]

# use the workflow to determine the next step(s)
workflow = parent_job.job.getWorkflow()
for step in workflow.steps:
    if step.ID == current_step:
        next_steps = step.nextSteps # list of links to the next steps
        # for each next step, add a dependency
        for next_step in next_steps:
            step_id = next_step.toStep # Actual next step
            parent_job.job.addDependency(new_job.ID, 'STEP', step_id, 'STATUS', 'DONEWORKING')

arcpy.SetParameter(2, new_job.ID)


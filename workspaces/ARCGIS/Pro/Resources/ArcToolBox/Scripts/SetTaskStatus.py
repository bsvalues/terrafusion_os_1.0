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
Source Name:   SetTaskStatus.py
Version:       ArcGIS 2.5
Author:        Environmental Systems Research Institute Inc.
Description:   Updates the status of a task.
---------------------------------------------------------------------------
"""


# Import required modules
import arcpy
import TopoWorkflowUtilities as utils
from datetime import datetime
from math import ceil
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

# AB - changed from task id to parent job id
parent_job_id = int(arcpy.GetParameterAsText(1))
status = arcpy.GetParameterAsText(2).upper()
database_path = arcpy.GetParameterAsText(3)

# Set temp workspace
temp_workspace = utils.ScratchWorkspace()

# Get wmx connection
connection = None
try:
    if database_path not in ('#', ' ', '') and database_path is not None:
        conn = arcpy.wmx.Connect(database_path)
        connection = utils.WmxConnection(conn, temp_workspace)
    else:
        conn = arcpy.wmx.Connect()
        connection = utils.WmxConnection(conn, temp_workspace)
except Exception as e:
    arcpy.AddError(e)
    sys.exit(1)

# Get job
job = None
child = None
child_job = None

try:
    child = utils.Job(connection, job_id)
except Exception as e:
    arcpy.AddIDMessage("ERROR", 90286, job_id) #Unable to get WMX job with id %1.
    sys.exit(1)

try:
    job = utils.Job(connection, parent_job_id)
except Exception as e:
    arcpy.AddIDMessage("ERROR", 90286, parent_job_id) #Unable to get WMX job with id %1.
    sys.exit(1)

try:
    child_job = conn.getJob(job_id)
except Exception as e:
    arcpy.AddIDMessage("ERROR", 90286, job_id) #Unable to get WMX job with id %1.
    sys.exit(1)

try:
    utils.checkuser(connection, job_id)
except Exception as e:
    arcpy.AddError(e)
    sys.exit(1)

# Set status and dates
now = datetime.now()

task_properties = job.get_properties('TOPO_TASK_PROPERTIES')
i = 0
task_id = 0
for task in task_properties:
    if 'task_job_id' in task and task['task_job_id'] == job_id:
        task_id = task['objectid']
        if status == 'WORKING':
            if not task['date_started']:
                task['date_started'] = now
            task['task_status'] = 5
            task['task_assign_to'] = child_job.assignedTo
        elif status == 'RESTART':
            task['date_started'] = None
            task['task_status'] = 1
            task['task_assign_to'] = None
            task['task_job_id'] = None
        elif status == 'COMPLETE':
            total_duration = 0
            try:
                task['task_status'] = 10
                start = task['date_started']
                task['date_ended'] = now

                if start is not None:
                    duration = now - start
                    days = duration.days
                    hours = (duration.seconds) / 86400 #seconds in a day
                    total = days + hours
                    total_duration = float(ceil(total))
                    task['task_duration'] = total_duration
            except Exception as e:
                task['task_duration'] = total_duration
                arcpy.AddIDMessage("WARNING", 90288) #Unable to calculate duration. Status for task was never set to 'WORKING'

        elif status != 'WAITING':
            arcpy.AddIDMessage("WARNING", 90289) #Status %1 is unknown and no updates will occur to job %2 status.
            sys.exit(1)
        job.update_property('TOPO_TASK_PROPERTIES', task, index=i)
        break
    i += 1

# if task is complete add the task duration to the task group duration
if status == 'COMPLETE' and task_id != 0:

    # create a task group object
    task_group = utils.TaskGroup(connection, job.job_id,
                                             job.get_property('TOPO_TASK_GROUP_PROPERTIES', 'task_group_id'))
    # get the default loe for the current task
    task_properties = task_group.get_task_properties()
    for task in task_properties:
        if task['objectid'] == task_id:
            task_loe = task['default_loe']
            break
    # get the completed loe for the task group and add the task loe
    completed_loe = job.get_property('TOPO_TASK_GROUP_PROPERTIES', 'completed_task_loe')
    if not completed_loe or completed_loe == 'None':
        completed_loe = 0
    completed_loe += task_loe

    # get the current duration of the task group and add the duration of this task
    grp_duration = job.get_property('TOPO_TASK_GROUP_PROPERTIES', 'task_group_duration')
    if not grp_duration or grp_duration == 'None':
        grp_duration = 0
    grp_duration += total_duration

    # update the task group record
    record = {}
    record['task_group_duration'] = int(grp_duration)
    record['completed_task_loe'] = float(completed_loe)
    job.update_property('TOPO_TASK_GROUP_PROPERTIES', record)

    total_loe = job.get_property('TOPO_TASK_GROUP_PROPERTIES', 'task_group_loe')
    percent_complete = int((completed_loe / total_loe) * 100)
    job.set_percent_complete(percent_complete)

arcpy.SetParameter(4, job_id)

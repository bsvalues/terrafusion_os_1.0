"""
COPYRIGHT 2021 ESRI

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
Source Name:   SetTaskGroupDependencies.py
Version:       ArcGIS 2.9
Author:        Environmental Systems Research Institute Inc.
Description:   Creates dependencies between the current job and any existing job
                based on the Task Group properties.
---------------------------------------------------------------------------
"""
import arcpy
import TopoWorkflowUtilities as utils
import DefenseUtilities
import os

def get_next_step(current_job):
    """ Gets the next step in the workflow.  Dependencies are created for the
    next step.  Job will progress to the next step and then stop until dependency
    is released. """
    step_id = None
    current_step = current_job.job.currentSteps[0]
    # use the workflow to determine the next step(s)
    workflow = current_job.job.getWorkflow()
    for step in workflow.steps:
        if step.ID == current_step:
            next_steps = step.nextSteps # list of links to the next steps
            # for each next step, add a dependency
            for next_step in next_steps:
                step_id = next_step.toStep # Actual next step

    return step_id

def get_existing_dependencies(connection, job_id, step_id):
    """ Returns a list of jobs the specified job_id has dependencies on."""

    dep_jobs = []
    with arcpy.da.SearchCursor(r'{}\{}JTX_JOB_DEPENDENCIES'.format(connection.sde_connection, connection.table_name_prepender),
                               ['job_step', 'dep_job_id'],
                               "JOB_ID = {}".format(job_id)) as cur:
        for row in cur:
            if row[0] == step_id:
                dep_jobs.append(row[1])

    return dep_jobs


def get_job_type(connection, task_group_job_id):
    """ Returns the job type id for the Execute Task Group job type.
    If Execute Task Group job type does not exist or is not active, use
    job type id for the task group job."""

    job_type_id = None
    job_type_name = None
    job_type_dict = {}

    with arcpy.da.SearchCursor(r'{}\{}JTX_JOB_TYPES'.format(connection.sde_connection, connection.table_name_prepender),
                               ['job_type_id', 'job_type_name'],
                               "state = 1") as cur:
        for row in cur:
            if row[1].upper() == 'EXECUTE TASK GROUP':
                job_type_id = row[0]
                job_type_name = row[1]
                job_type_dict[row[0]] = row[1]

    if not job_type_id:
        # if Execute Task Group has been deleted or is not active, get the job type
        # for the task group job
        status_ids = []
        with arcpy.da.SearchCursor(r'{}JTX_JOBS'.format(connection.table_name_prepender),
                                   ['job_type_id'], 'job_id = {}'.format(task_group_job_id)) as cur:
            for row in cur:
                job_type_id = row[0]

        if job_type_id and job_type_id in job_type_dict:
            job_type_name = job_type_dict[job_type_id]


    return job_type_id, job_type_name


def main():
    """ Main function"""
    job_id = int(arcpy.GetParameterAsText(0))
    database_path = arcpy.GetParameterAsText(1)

    new_job_ids = []

    # Set temp workspace
    temp_workspace = utils.ScratchWorkspace()

    # Check out licenses
    if DefenseUtilities.licenselevel() == 'Basic' or DefenseUtilities.licenselevel() == 'None':
        raise DefenseUtilities.LicenseException()

    if 'Available' == arcpy.CheckExtension('defense'):
        DefenseUtilities.checkoutextensions(['defense', 'JTX'])
    elif 'Available' == arcpy.CheckExtension('Foundation'):
        DefenseUtilities.checkoutextensions(['Foundation', 'JTX'])
    else:
        raise DefenseUtilities.LicenseException('Tool requires either defense or Foundation extension to run.')


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
    current_job = None
    try:
        current_job = utils.Job(connection, job_id)
    except Exception as e:
        arcpy.AddIDMessage("ERROR", 90286, job_id) #Unable to get WMX job with id %1.
        sys.exit(1)

    # Checking job assignment
    try:
        utils.checkuser(connection, job_id)
    except Exception as e:
        arcpy.AddError(e)
        sys.exit(1)

    # determine task group for job
    # if child job, may need to get from parent

    dep_job_ids = []

    try:
        arcpy.env.workspace = connection.sde_connection


        current_aoi = current_job.get_loi()
        task_group_id, task_group_job_id = current_job.get_task_group_id()

        #arcpy.AddMessage("Task group id for current job {}".format(task_group_id))



        if task_group_id:

            # deteremine job type id for Execute Task Group Jobs
            job_type_id, job_type_name = get_job_type(connection, task_group_job_id)

            # determine dependencies
            task_group = utils.TaskGroup(connection, current_job.job_id, task_group_id)
            create_list, dep_dict = task_group.get_task_group_relationships()

            #arcpy.AddMessage("Types of job dependencies: {}".format(dep_dict))

            # get closed and completed status ids
            statustypes = connection.wmx_connection.config.getStatusTypes()
            exclude_status = []

            for statustype in statustypes:
                 if(statustype.name.upper() in ['CLOSED', 'DONEWORKING']):
                     exclude_status.append(statustype.ID)

            # loop through dependency types
            for dep_task_group, deps in dep_dict.items():
                dep_rel, dep_status = deps


                # determine if any jobs exist of the type
                with arcpy.da.SearchCursor(r'{}\{}TOPO_TASK_GROUP_PROPERTIES'.format(connection.sde_connection, connection.table_name_prepender),
                                           ['job_id'], 'task_group_id = {}'.format(dep_task_group)) as cur:
                    for row in cur:
                        if row[0] != job_id:
                            dep_job_ids.append(row[0])

                # remove any closed or completed jobs
                with arcpy.da.SearchCursor(r'{}\{}JTX_JOBS'.format(connection.sde_connection, connection.table_name_prepender),
                                           ['job_id', 'status']) as cur:
                    for row in cur:
                        if row[0] in dep_job_ids and row[1] in exclude_status:
                            dep_job_ids.remove(row[0])

                #arcpy.AddMessage("Jobs of type {}".format(dep_job_ids))

                # determine if any AOIs have chosen relationship
                # ['ANY_RELATION_TO', 'INTERSECT INTERIORS', 'INTERSECT', 'CONTAINS', 'WITHIN', 'ARE_IDENTICAL_TO']
                if len(dep_job_ids) >= 1 and dep_status.upper() != "ANY_RELATION_TO":
                    with arcpy.da.SearchCursor(r'{}\{}JTX_JOBS_AOI'.format(connection.sde_connection, connection.table_name_prepender),
                                               ['job_id', 'SHAPE@']) as cur:
                        for row in cur:
                            if row[0] in dep_job_ids:
                                geo = row[1]
                                if not geo.disjoint(current_aoi):
                                    if dep_rel.upper() == 'INTERSECT INTERIORS' and geo.touches(current_aoi):
                                        # if interset interiors is operation and the geo
                                        # touches but does not go inside the AOI, remove it
                                        dep_job_ids.remove(row[0])
                                    elif dep_rel.upper() == 'WITHIN' and not geo.within(current_aoi):
                                        # if within is operation and the geo is not within the AOI, remove it
                                        dep_job_ids.remove(row[0])
                                    elif dep_rel.upper() == 'CONTAINS' and not geo.contains(current_aoi):
                                        # if within is operation and the geo is not within the AOI, remove it
                                        dep_job_ids.remove(row[0])

                                    elif dep_rel.upper() == 'ARE_IDENTICAL_TO' and not geo.equals(current_aoi):
                                        # if within is operation and the geo is not within the AOI, remove it
                                        dep_job_ids.remove(row[0])

                                else:
                                    # if it doesn't intersect at all remove - will not meet any rel
                                    dep_job_ids.remove(row[0])

                #arcpy.AddMessage("Jobs of relation {}".format(dep_job_ids))

                if len(dep_job_ids) >= 1:
                    step_id = get_next_step(current_job)
                    existing_deps = get_existing_dependencies(connection, job_id, step_id)

                    for dep_job_id in dep_job_ids:
                        if dep_job_id not in existing_deps:
                            #arcpy.AddMessage("Adding dependency to job {}".format(dep_job_id))
                            current_job.job.addDependency(dep_job_id, 'STEP', step_id, 'STATUS', dep_status.upper())


    except Exception as e:
        arcpy.AddError('{}'.format(e))
        tb = sys.exc_info()[2]
        arcpy.AddError("Failed at Line %i" % tb.tb_lineno)
    finally:
        dep_job_ids = sorted(dep_job_ids)
        arcpy.SetParameter(2, dep_job_ids)

if __name__ == '__main__':
    main()

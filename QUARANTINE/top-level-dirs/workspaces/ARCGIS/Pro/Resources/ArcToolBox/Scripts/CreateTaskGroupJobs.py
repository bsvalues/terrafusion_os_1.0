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
Source Name:   CreateTaskGroupJobs.py
Version:       ArcGIS 2.9
Author:        Environmental Systems Research Institute Inc.
Description:   Creates new task group jobs based on the properities defined
                for the current job's task group.
---------------------------------------------------------------------------
"""
import arcpy
import TopoWorkflowUtilities as utils
import DefenseUtilities
import os
import sys

def get_existing_job_aois(existing_task_group_id, connection, aoi):
    """ Finds all jobs of the existing task group type that are in Created or
    Ready to Work status.  Returns a dictionary of job_ids that intersect the aoi
    and their aoi"""
    existing_jobs = []
    existing_aois = {}  # job id = geometry
    try:

        # get a list of all jobs for the specified task group
        with arcpy.da.SearchCursor(r'{}\{}TOPO_TASK_GROUP_PROPERTIES'.format(connection.sde_connection, connection.table_name_prepender),
                                   ['job_id', 'task_group_id']) as cur:
            for row in cur:
                if row[1] == int(existing_task_group_id):
                    existing_jobs.append(row[0])

##        arcpy.AddMessage("all existing {}".format(existing_jobs))


        if len(existing_jobs) >= 1:
            # get the status id values for ready to work and created statuses
            status_ids = []
            with arcpy.da.SearchCursor(r'{}\{}JTX_STATUS'.format(connection.sde_connection, connection.table_name_prepender),
                                       ['name', 'id']) as cur:
                for row in cur:
                    if row[0].upper() in ['READYTOWORK', 'CREATED']:
                        status_ids.append(row[1])

            # remove ids from existing jobs list if the job is in progress
            with arcpy.da.SearchCursor(r'{}\{}JTX_JOBS'.format(connection.sde_connection, connection.table_name_prepender),
                                       ['job_id', 'status']) as cur:
                for row in cur:
                    if row[0] in existing_jobs:
                        if row[1] not in status_ids:
                            existing_jobs.remove(row[0])

##            arcpy.AddMessage("existing with status {}".format(existing_jobs))

            if len(existing_jobs) >= 1:
                # keep jobs that have aois that touch the aoi

                with arcpy.da.SearchCursor(r'{}\{}JTX_JOBS_AOI'.format(connection.sde_connection, connection.table_name_prepender),
                                           ['job_id', 'SHAPE@']) as cur:
                    for row in cur:
                        if row[0] in existing_jobs:
                            if not row[1].disjoint(aoi):
                                if not row[1].touches(aoi):
                                    existing_aois[row[0]] = row[1]

    except Exception as e:
        arcpy.AddError('{}'.format(e))
        tb = sys.exc_info()[2]
        arcpy.AddError("Failed at Line %i" % tb.tb_lineno)
        sys.exit(1)
    finally:
        return existing_aois

def get_job_type(connection, task_group_job_id):
    """ Returns the job type id for the Execute Task Group job type.
    If Execute Task Group job type does not exist or is not active, use
    job type id for the task group job."""
    job_type_id = None
    job_type_name = None
    try:
        job_type_dict = {}
        # Get the job type id for Execute Task Group Jobs
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
            with arcpy.da.SearchCursor(r'{}\{}JTX_JOBS'.format(connection.sde_connection, connection.table_name_prepender),
                                       ['job_type_id'], 'job_id = {}'.format(task_group_job_id)) as cur:
                for row in cur:
                    job_type_id = row[0]

            if job_type_id and job_type_id in job_type_dict:
                job_type_name = job_type_dict[job_type_id]

    except Exception as e:
        arcpy.AddError('{}'.format(e))
        tb = sys.exc_info()[2]
        arcpy.AddError("Failed at Line %i" % tb.tb_lineno)
        sys.exit(1)
    finally:
        return job_type_id, job_type_name


def main():
    """ Main function"""
    job_id = int(arcpy.GetParameterAsText(0))
    database_path = arcpy.GetParameterAsText(1)

    new_jobs = []

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
        arcpy.AddError('{}'.format(e))
        tb = sys.exc_info()[2]
        arcpy.AddError("Failed at Line %i" % tb.tb_lineno)
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
        arcpy.AddError('{}'.format(e))
        tb = sys.exc_info()[2]
        arcpy.AddError("Failed at Line %i" % tb.tb_lineno)
        sys.exit(1)



    try:
        # determine task group for job
        # if child job, may need to get from parent


        current_aoi = current_job.get_loi()
        task_group_id, task_group_job_id = current_job.get_task_group_id()

    ##    arcpy.AddMessage("Task group id for current job {}".format(task_group_id))

        # determine what types of task group jobs need to be created

        if task_group_id:

            # deteremine job type id for Execute Task Group Jobs
            job_type_id, job_type_name = get_job_type(connection, task_group_job_id)

            task_group = utils.TaskGroup(connection, current_job.job_id, task_group_id)
            create_list, dep_dict = task_group.get_task_group_relationships()

    ##        arcpy.AddMessage("Types of jobs to create: {}".format(create_list))


            for create_task_group_id in create_list:

                arcpy.AddMessage("Determining aois to create for task group {}".format(create_task_group_id))

                # determine geometry for each job to be created
                create_task_group = utils.TaskGroup(connection, job_id, create_task_group_id)
                create_aoi_fc = create_task_group.aoi_fc
                #arcpy.AddMessage("aoi fc {}".format(create_aoi_fc))
                create_aois = []

                if create_aoi_fc and create_aoi_fc != '':
                    aoi_path = os.path.join(r'{}\{}{}'.format(connection.sde_connection, connection.table_name_prepender, create_aoi_fc))


                    if arcpy.Exists(aoi_path):
                        #arcpy.AddMessage("AOI layer exists")
                        aoi_lyr = arcpy.SelectLayerByLocation_management(aoi_path, 'INTERSECT', current_aoi,  "", "NEW_SELECTION")
                        with arcpy.da.SearchCursor(aoi_lyr, ['SHAPE@', 'oid@']) as cur:
                            for row in cur:
                                #arcpy.AddMessage(row)
                                if not row[0].disjoint(current_aoi):
                                    if not row[0].touches(current_aoi):
                                        create_aois.append(row[0])

                    else:
                        arcpy.AddWarning("Cannot determine AOI feature class for Task Group {}.".format(create_task_group.name))
                        create_aois.append(current_aoi)
                else:
                    arcpy.AddWarning("Cannot determine AOI feature class for Task Group {}.".format(create_task_group.name))
                    create_aois.append(current_aoi)

    ##            arcpy.AddMessage("Determining if any jobs currently exist")
                existing_aois = get_existing_job_aois(create_task_group_id, connection, current_aoi)
                existing_geos = list(existing_aois.values())
    ##            arcpy.AddMessage('Existing aois {}'.format(existing_aois.keys()))

                new_jobs = list(existing_aois.keys())

                # create new job and set Task Group
                for create_aoi in create_aois:
                    # check that no job already exists
                    if create_aoi not in existing_geos:
                        # create the job
                        ex_prop = {}
    ##                    job_type_desc =  connection.wmx_connection.config.getJobTypeDescription(job_type_id=job_type_id)
    ##
    ##                    ex_prop = job_type_desc.extendedProperties
                        table_name = '{}TOPO_TASK_GROUP_PROPERTIES'.format(connection.table_name_prepender)
    ##                    tg_props = ex_prop[table_name]
    ##                    tg_props['task_group_id'] = task_group_id
                        ex_prop[table_name] = {'task_group_id':create_task_group_id}

                        new_job_desc = {}
                        new_job_desc['extendedProperties'] = ex_prop

                        new_job_desc['LOI'] = create_aoi
                        new_job_desc['jobTypeName'] = job_type_name

                        new_job = connection.wmx_connection.createJob(job_type_description=new_job_desc)

                        # ensure task group Id property was set when job was created
                        prop_table = new_job.getExtendedPropertyTable(table_name)
                        prop_table['task_group_id'].data=create_task_group_id
                        new_job.save()

    ##                    arcpy.AddMessage("Created Job {}".format(new_job.ID))
                        new_jobs.append(new_job.ID)

    ##                else:
    ##                    arcpy.AddMessage("AOI matches existing job aoi.  New job will not be created")
    except Exception as e:
        arcpy.AddError('{}'.format(e))
        tb = sys.exc_info()[2]
        arcpy.AddError("Failed at Line %i" % tb.tb_lineno)

    finally:
        new_jobs = sorted(new_jobs)
        arcpy.SetParameter(2, new_jobs)


if __name__ == '__main__':
    main()

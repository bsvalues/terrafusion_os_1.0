"""
COPYRIGHT 2020 ESRI

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
Source Name:   UpdateTaskGroupMetrics.py
Version:       ArcGIS 2.6
Author:        Environmental Systems Research Institute Inc.
Description:   Populates the metrics for an task group once it completes execution.
---------------------------------------------------------------------------
"""


# Import required modules
import arcpy, os, sys
import TopoWorkflowUtilities as utils
import DefenseUtilities
from datetime import datetime
from TopoWorkflowUtilities import WorkspaceLock

# Check out licenses
if DefenseUtilities.licenselevel() == 'Basic' or DefenseUtilities.licenselevel() == 'None':
    raise DefenseUtilities.LicenseException()

if 'Available' == arcpy.CheckExtension('defense'):
    DefenseUtilities.checkoutextensions(['defense', 'JTX'])
elif 'Available' == arcpy.CheckExtension('Foundation'):
    DefenseUtilities.checkoutextensions(['Foundation', 'JTX'])
else:
    raise DefenseUtilities.LicenseException('Tool requires either defense or Foundation extension to run.')


# Define metrics utility methods
class JobMetrics:
    """
    Populates all metric properties and child tasks required to calculate metrics
    """
    def __init__(self, parent_job, status_table, last_mod_field_name, wmx_database_path):
        if not parent_job:
            raise Exception('Parent job is invalid.')

        self.job = parent_job
        self.job_id = self.job.job_id
        self.connection = self.job.connection
        self.status_table_path = status_table
        self.status_date_field = last_mod_field_name
        self.database_path = wmx_database_path
        self.last_mod_date = datetime.now()

        self.job_aoi = None
        self.priority = None
        self.task_group = None
        self.task_group_id = None
        self.complexity = None
        self.complexity_id = None
        self.production_type_id = None
        self.rework_count = 0
        self.rework_task_count = 0
        self.total_duration = 0;
        self.rework_duration = 0;
        self.is_custom_table = True
        self.tasks = []

        if utils.is_value_empty(self.status_table_path):
            self.init_status_table_from_job()

        self.load_properties()
        self.load_tasks()

        self.calculate_task_metrics()

    def init_status_table_from_job(self):
        # Use topo status table if not set by user
        table_path =''
        date_field =''

        if utils.is_value_empty(self.status_table_path):
            results = utils.get_query_results(self.connection, 'TOPO_PRODUCTION_PROPERTIES', ['status_fc_path','status_date_field'], f'job_id={self.job_id}')
            if not results:
                arcpy.AddIDMessage("ERROR", 90286, self.job_id) # Unable to get WMX job with id %1.
                sys.exit(1)
            props = results[0]
            table_path = props['status_fc_path']
            date_field = props['status_date_field']

        # If just table name is given, set full catalog path
        if not utils.is_value_empty(table_path) and not arcpy.Exists(table_path):
            if arcpy.Exists(f'{self.connection.sde_connection}\\{self.connection.table_name_prepender}{table_path}'):
                table_path = f'{self.connection.sde_connection}\\{self.connection.table_name_prepender}{table_path}'
            elif arcpy.Exists(f'{self.connection.sde_connection}\\{table_path}'):
                table_path = f'{self.connection.sde_connection}\\{table_path}'
            else:
                arcpy.AddIDMessage("WARNING", 414, table_path) # %s not found
                table_path = ''

        # check if status field exists
        if not utils.is_value_empty(date_field) and not utils.is_value_empty(table_path):
            if date_field not in [f.name for f in arcpy.ListFields(table_path)]:
                arcpy.AddIDMessage("WARNING", 11) # Required field is missing
                arcpy.AddIDMessage("ERROR", 413, date_field, table_path) # %1 not found in %2
                sys.exit(1)
            else:
                self.status_table_path = table_path
                self.status_date_field = date_field
                self.is_custom_table = False;

    def load_properties(self):
        try:
            self.priority = self.job.job.priority
            self.job_aoi = self.job.get_loi()

            props = utils.get_query_results(self.connection,'TOPO_TASK_GROUP_PROPERTIES', ['task_group_id','complexity','complexity_id'], f'job_id={self.job_id}')[0]
            self.task_group_id = props['task_group_id']
            self.complexity_id = props['complexity_id']

            self.complexity = 0
            if not utils.is_value_empty(self.complexity_id):
                props = utils.get_query_results(self.connection,'TOPO_COMPLEXITY', ['complexity_id', 'complexity_value'], f'complexity_id={self.complexity_id}')
                if props:
                    self.complexity = int(props[0]['complexity_value'] or 0)

            props = utils.get_query_results(self.connection,'TOPO_PRODUCTION_PROPERTIES', ['rework_count','production_type_id'], f'job_id={self.job_id}')[0]
            self.rework_count = int(props['rework_count'] or 0)
            self.production_type_id = props['production_type_id']

            self.task_group = utils.TaskGroup(self.connection, self.job.job_id, self.job.get_property('TOPO_TASK_GROUP_PROPERTIES', 'task_group_id'))
            #self.task_group.name = utils.get_query_results(self.connection,'TASK_GROUP','name',f'task_group_id={self.task_group.task_group_id}')[0]

        except Exception as e:
            raise Exception(f'Unable to load job properties. {e}')

    def load_tasks(self):
        try:
            self.tasks = []
            # Populate tasks while ensuring there are no incomplete jobs
            results = utils.get_query_results(self.connection, 'TOPO_TASK_PROPERTIES', ['objectid', 'task_id', 'task_order','task_status'], f'job_id = {self.job_id}')
            for row in results:

                task_status = int(row['task_status'] or 0)
                if task_status == 10:
                    # gather information for completed tasks (status = 10)

                    task = utils.Task(self.connection, row['objectid'], row['task_id'], row['task_order'])
                    self.tasks.append(task)
                elif task_status == 20:
                    # ignore cancelled tasks (status = 20)
                    pass
                else:
                    # if there are incomplete tasks (that were not cancelled) do not record metrics
                    self.tasks = []  # clear all tasks, it will be checked later on.
                    return

            self.tasks.sort(key=lambda task: task.task_order)
        except Exception as e:
            raise Exception(f'Unable to load task list for job. {e}')

    def calculate_task_metrics(self):

        # load valid used names
        users = utils.CaseDict()
        try:
            results = utils.get_query_results(self.connection, 'JTX_USERS', ['username', 'full_name'], None)
            for row in results:
                users[row['username']] = row['full_name']
        except Exception as ex:
            raise Exception(f'Unable to load users. {ex}')

        # update task metrics
        self.rework_task_count = 0
        for index,task in enumerate(self.tasks):
            task.rework_duration = 0
            task.rework_count = 0
            task.assignee_full_name = users.get(task.task_assign_to)

            # calculate rework metrics
            if task.inserted_task == 1:
                self.rework_task_count += 1
                # find original task using task_id and job_type_name
                task_by_id = None
                task_by_type = None
                for origIndex, origTask in enumerate(self.tasks):
                    if origIndex >= index:
                        break
                    if origTask.inserted_task == 1:
                        continue
                    if origTask.task_id == task.task_id:
                        task_by_id = origTask
                        break
                    if origTask.job_type_name == task.job_type_name:
                        task_by_type = origTask
                if task_by_id:
                    task_by_id.rework_duration += task.task_duration
                    task_by_id.rework_count += 1
                elif task_by_type:
                    task_by_type.rework_duration += task.task_duration
                    task_by_type.rework_count += 1
                else:
                    task.inserted_task = 2 # Inserted yet no matching task_id or job_type_name
                    task.rework_duration = task.task_duration
                    task.rework_count += 1

        self.job_duration = sum([t.task_duration for t in self.tasks])
        self.rework_duration = sum([t.task_duration for t in self.tasks if t.inserted_task != 0])

        ###################################
        # Print metrics for debug purposes
        #
        #print(f'{vars(self)}')
        #for index,task in enumerate(self.tasks):
        #    print(f'{index},{vars(task)}')

def find_status_feature_id(metrics):
    '''
    TODO:
    - Check status table path: layer, feature_class or just table name in wmx

    '''
    matching_status_id = None
    try:
        job_id = metrics.job_id
        status_table_path = metrics.status_table_path
        last_mod_field = metrics.status_date_field
        database_path = metrics.database_path

        job_aoi_layer = arcpy.GetJobAOI_wmx(job_id, r'in_memory/job_aoi_layer', database_path)
        status_features_layer = arcpy.management.MakeFeatureLayer(status_table_path, r'in_memory/status_features_layer')

        matching_features_layer, out_layer, count = arcpy.management.SelectLayerByLocation(status_features_layer, 'ARE_IDENTICAL_TO', job_aoi_layer, "", 'NEW_SELECTION')
        if int(count) == 1:
            matching_status_id = [row[0] for row in arcpy.da.SearchCursor(matching_features_layer, ['OBJECTID'])][0]
        else:
            #try using intersection to find near-match geometry
            intersect_table = arcpy.analysis.TabulateIntersection(job_aoi_layer, "OBJECTID", status_features_layer, r"in_memory/job_aoi_tabulateintersection", ['OBJECTID'], None, None, "UNKNOWN")
            highest_percent = 95
            with arcpy.da.SearchCursor(intersect_table, ['OBJECTID_12', 'PERCENTAGE']) as cursor:
                for row in cursor:
                    status_link_id, percentage = row[0], row[1]
                    if percentage > highest_percent:
                        matching_status_id = status_link_id
                        highest_percent = percentage

    except Exception as e:
        raise Exception(f'Unable to find matching status polygon. {e}')

    # No matching feature, create new status feature
    try:
        if not matching_status_id:
            with arcpy.da.InsertCursor(status_table_path, ['SHAPE@']) as insertCursor:
                matching_status_id = insertCursor.insertRow([metrics.job_aoi])

            if not metrics.is_custom_table:
                fields = ['OID@','priority','complexity_id','last_mod_date']
            else:
                fields = ['OID@', last_mod_field]

            with arcpy.da.UpdateCursor(status_table_path, fields, f'OBJECTID={matching_status_id}') as updateCursor:
                for row in updateCursor:
                    if len(fields) == 2:
                        row[1] = metrics.last_mod_date
                    else:
                        row[1] = metrics.priority
                        row[2] = metrics.complexity_id
                        row[3] = metrics.last_mod_date
                    updateCursor.updateRow(row)

    except Exception as e:
        raise Exception(f'Unable to create status polygon. {e}')

    return matching_status_id

def update_status_table(metrics):
    if utils.is_value_empty(metrics.status_table_path):
        arcpy.AddIDMessage("WARNING", 192, 'Status_Feature_Class') # Invalid value for %s
        return

    if utils.is_value_empty(metrics.status_date_field):
        arcpy.AddIDMessage("WARNING", 192, 'status_date_field') # Invalid value for %s
        return

    if not arcpy.Exists(metrics.status_table_path):
        arcpy.AddIDMessage("WARNING", 414, metrics.status_table_path) # %s not found.
        return

    # Find status feature id
    # NOTE: If an associated feature does not exists, it will create one and return a valid status link id
    lock = WorkspaceLock(metrics.connection.sde_connection)
    try:
        status_link_id = find_status_feature_id(metrics)

        # update only last_mod_date field in status feature class
        status_table_path = metrics.status_table_path
        status_date_field = metrics.status_date_field

        if not utils.is_value_empty(status_date_field):
            with arcpy.da.UpdateCursor(status_table_path, ['OID@', status_date_field], f'OBJECTID={status_link_id}') as updateCursor:
                for row in updateCursor:
                    row[1] = metrics.last_mod_date
                    updateCursor.updateRow(row)

        # Update metrics table only if it was created by topo workflow tools
        if metrics.is_custom_table:
            return

        # update status metrics table
        status_metrics_table_path = f'{status_table_path}_Metrics'
        if arcpy.Exists(status_metrics_table_path):
            fields = ['OID@', 'status_link_id', 'task_group_id', 'last_mod_date', 'completed_job_count', # 0-4
                      'ave_dur', 'total_dur', 'last_dur','ave_rework', 'total_rework', 'last_rework']    # 5-10
            where_clause = f'status_link_id={status_link_id} and task_group_id={metrics.task_group_id}'

            rowExists = False
            with arcpy.da.UpdateCursor(status_metrics_table_path, fields, where_clause) as updateCursor:
                for row in updateCursor:
                    rowExists = True
                    total_job_count = int(row[4] or 0) + 1
                    total_job_dur = int(row[6] or 0) + metrics.job_duration
                    total_rework_dur = int(row[9] or 0) + metrics.rework_duration

                    ave_job_dur = total_job_dur / total_job_count if total_job_count > 0 else 0.0
                    ave_rework_dur = total_rework_dur / total_job_count if total_job_count > 0 else 0.0

                    row[3] = metrics.last_mod_date
                    row[4] = total_job_count
                    row[5] = ave_job_dur
                    row[6] = total_job_dur
                    row[7] = metrics.job_duration
                    row[8] = ave_rework_dur
                    row[9] = total_rework_dur
                    row[10] = metrics.rework_duration
                    updateCursor.updateRow(row)

            if not rowExists:
                with arcpy.da.InsertCursor(status_metrics_table_path, fields[1:]) as insertCursor:
                    insertCursor.insertRow([status_link_id, metrics.task_group_id, metrics.last_mod_date, 1,
                                            metrics.job_duration, metrics.job_duration, metrics.job_duration,
                                            metrics.rework_duration, metrics.rework_duration, metrics.rework_duration])
    except Exception as ex:
        raise ex
    finally:
        lock.release()

def update_complexity_metrics(metrics):
    if utils.is_value_empty(metrics.complexity_id):
        arcpy.AddIDMessage('WARNING', 2926, 'complexity_id', str(metrics.complexity_id)) # Invalid value for parameter %1: %2.
        arcpy.AddIDMessage('WARNING', 1091, 'TOPO_COMPLEXITY metrics') # Skipping %s, not supported
        return

    lock = WorkspaceLock(metrics.connection.sde_connection)
    try:
        complexity_table = f'{metrics.connection.table_name_prepender}TOPO_COMPLEXITY'

        fields = ['OID@', 'complexity_id', 'completed_job_count', 'ave_dur', 'ave_rework', # 0-4
                  'rework_job_count', 'rework_percent', 'total_dur', 'total_rework']       # 5-8
        where_clause = f'complexity_id={metrics.complexity_id}'

        with arcpy.da.UpdateCursor(complexity_table, fields, where_clause) as updateCursor:
            for row in updateCursor:
                rowExists = True
                total_job_count = int(row[2] or 0) + 1
                rework_job_count = int(row[5] or 0) + metrics.rework_count
                total_duration = int(row[7] or 0) + metrics.job_duration
                total_rework = int(row[8] or 0) + metrics.rework_duration

                ave_duration = total_duration / total_job_count if total_job_count > 0 else 0.0
                ave_rework = total_rework / rework_job_count if rework_job_count > 0 else 0.0
                rework_percent = rework_job_count / total_job_count if total_job_count > 0 else 0.0

                row[2] = total_job_count
                row[3] = ave_duration
                row[4] = ave_rework
                row[5] = rework_job_count
                row[6] = rework_percent
                row[7] = total_duration
                row[8] = total_rework

                updateCursor.updateRow(row)
    except Exception as ex:
        raise Exception(f'Unable to update complexity metrics. {ex}')
    finally:
        lock.release()

def update_task_metrics(metrics):

    if not metrics.task_group_id:
        arcpy.AddIDMessage('WARNING', 2926, 'task_group_id', str(metrics.task_group_id)) # Invalid value for parameter %1: %2.
        arcpy.AddIDMessage('WARNING', 1091, 'TOPO_METRICS_BY_TASK metrics') # Skipping %s, not supported
        return # required values missing

    if not metrics.production_type_id:
        arcpy.AddIDMessage('WARNING', 2926, 'production_type_id', str(metrics.production_type_id)) # Invalid value for parameter %1: %2.
        arcpy.AddIDMessage('WARNING', 1091, 'TOPO_METRICS_BY_TASK metrics') # Skipping %s, not supported
        return # required values missing

    # index tasks by id
    taskList = [t for t in metrics.tasks if t.inserted_task in (0,2)]

    tasks = {}
    for task in taskList:
        tasks[task.task_id] = task

    lock = WorkspaceLock(metrics.connection.sde_connection)
    try:
        metrics_table = f'{metrics.connection.table_name_prepender}TOPO_METRICS_BY_TASK'

        fields = ['OID@', 'task_group_id', 'task_id', 'production_type_id', 'completed_task_count',           # 0-4
                  'ave_dur', 'total_dur', 'last_dur', 'ave_rework', 'total_rework',                           # 5-9
                  'last_rework', 'rework_task_count', 'rework_percent', 'ave_complexity', 'total_complexity', # 10-14
                  'last_complexity']                                                                          # 15

        # update task metrics for existing one
        updatedKeys = set()

        where_clause = f'task_group_id={metrics.task_group_id} and production_type_id={metrics.production_type_id}'
        with arcpy.da.UpdateCursor(metrics_table, fields, where_clause) as updateCursor:
            for row in updateCursor:
                task_id = row[2]
                if task_id not in tasks:
                    continue

                task = tasks[task_id]
                updatedKeys.add(task_id)

                total_task_count = int(row[4] or 0) + 1
                total_duration = int(row[6] or 0) + task.task_duration
                total_rework_duration = int(row[9] or 0) + task.rework_duration
                rework_task_count = int(row[11] or 0) + (1 if task.rework_duration > 0 else 0)
                total_complexity = int(row[14] or 0) + metrics.complexity

                ave_duration = total_duration / total_task_count if total_task_count > 0 else 0.0
                ave_rework_duration = total_rework_duration / rework_task_count if rework_task_count > 0 else 0.0
                rework_percent = rework_task_count / total_task_count if total_task_count > 0 else 0.0
                ave_complexity = total_complexity / total_task_count if total_task_count > 0 else 0.0

                row[4] = total_task_count
                row[5] = ave_duration
                row[6] = total_duration
                row[7] = task.task_duration
                row[8] = ave_rework_duration
                row[9] = total_rework_duration
                row[10] = task.rework_duration
                row[11] = rework_task_count
                row[12] = rework_percent
                row[13] = ave_complexity
                row[14] = total_complexity
                row[15] = metrics.complexity

                updateCursor.updateRow(row)

        # create task metrics for missing ones
        if len(updatedKeys) < len(tasks):
            with arcpy.da.InsertCursor(metrics_table, fields[1:]) as insertCursor:
                for task in taskList:
                    if task.task_id in updatedKeys:
                        continue

                    total_task_count = 1
                    total_duration = task.task_duration
                    total_rework_duration = task.rework_duration
                    rework_task_count = 1 if task.rework_duration > 0 else 0
                    total_complexity = metrics.complexity

                    ave_duration = total_duration / total_task_count if total_task_count > 0 else 0.0
                    ave_rework_duration = total_rework_duration / rework_task_count if rework_task_count > 0 else 0.0
                    rework_percent = rework_task_count / total_task_count if total_task_count > 0 else 0.0
                    ave_complexity = total_complexity / total_task_count if total_task_count > 0 else 0.0

                    row = (metrics.task_group_id, task.task_id, metrics.production_type_id, total_task_count,
                           ave_duration, total_duration, task.task_duration, ave_rework_duration,
                           total_rework_duration, task.rework_duration, rework_task_count, rework_percent,
                           ave_complexity, total_complexity, metrics.complexity )

                    insertCursor.insertRow(row)

    except Exception as ex:
        raise Exception(f'Unable to update task metrics. {ex}')
    finally:
        lock.release()
    pass

def update_resource_metrics(metrics):

    if not metrics.task_group_id:
        arcpy.AddIDMessage('WARNING', 2926, 'task_group_id', str(metrics.task_group_id)) # Invalid value for parameter %1: %2.
        arcpy.AddIDMessage('WARNING', 1091, 'TOPO_METRICS_BY_TASK metrics') # Skipping %s, not supported
        return # required values missing

    if not metrics.production_type_id:
        arcpy.AddIDMessage('WARNING', 2926, 'production_type_id', str(metrics.production_type_id)) # Invalid value for parameter %1: %2.
        arcpy.AddIDMessage('WARNING', 1091, 'TOPO_METRICS_BY_TASK metrics') # Skipping %s, not supported
        return # required values missing

    # Populate resource metrics
    taskList = [t for t in metrics.tasks if t.inserted_task in (0,2)]

    resources = {}
    for task in taskList:
        searchkey = f'{task.task_assign_to.lower()}_{task.task_id}'
        task.key = searchkey
        resources[searchkey] = task


    lock = WorkspaceLock(metrics.connection.sde_connection)
    try:
        metrics_table = f'{metrics.connection.table_name_prepender}TOPO_METRICS_BY_RESOURCE'

        fields = ['OID@', 'username', 'task_group_id', 'task_id', 'production_type_id',                    # 0-4
                  'completed_task_count', 'ave_dur', 'total_dur', 'last_dur', 'ave_rework',                # 5-9
                  'total_rework', 'last_rework', 'rework_task_count', 'rework_percent', 'ave_complexity',  #10-14
                  'total_complexity', 'last_complexity']                                                   #15-16

        # update task metrics for existing one
        updatedKeys = set()

        where_clause = f'task_group_id={metrics.task_group_id} and production_type_id={metrics.production_type_id}'
        with arcpy.da.UpdateCursor(metrics_table, fields, where_clause) as updateCursor:
            for row in updateCursor:
                searchkey = f"{(str(row[1])).lower()}_{row[3]}"
                if searchkey not in resources:
                    continue

                task = resources[searchkey]
                updatedKeys.add(searchkey)

                total_task_count = int(row[5] or 0) + 1
                total_duration = int(row[7] or 0) + task.task_duration
                total_rework_duration = int(row[10] or 0) + task.rework_duration
                rework_task_count = int(row[12] or 0) + (1 if task.rework_duration > 0 else 0)
                total_complexity = int(row[15] or 0) + metrics.complexity

                ave_duration = total_duration / total_task_count if total_task_count > 0 else 0.0
                ave_rework_duration = total_rework_duration / rework_task_count if rework_task_count > 0 else 0.0
                rework_percent = rework_task_count / total_task_count if total_task_count > 0 else 0.0
                ave_complexity = total_complexity / total_task_count if total_task_count > 0 else 0.0

                row[5] = total_task_count
                row[6] = ave_duration
                row[7] = total_duration
                row[8] = task.task_duration
                row[9] = ave_rework_duration
                row[10] = total_rework_duration
                row[11] = task.rework_duration
                row[12] = rework_task_count
                row[13] = rework_percent
                row[14] = ave_complexity
                row[15] = total_complexity
                row[16] = metrics.complexity

                updateCursor.updateRow(row)

        # create task metrics for missing ones
        if len(updatedKeys) < len(taskList):
            with arcpy.da.InsertCursor(metrics_table, fields[1:]) as insertCursor:
               for task in taskList:
                   if task.key in updatedKeys:
                       continue #already updated

                   total_task_count = 1
                   total_duration = task.task_duration
                   total_rework_duration = task.rework_duration
                   rework_task_count = 1 if task.rework_duration > 0 else 0
                   total_complexity = metrics.complexity

                   ave_duration = total_duration / total_task_count if total_task_count > 0 else 0.0
                   ave_rework_duration = total_rework_duration / rework_task_count if rework_task_count > 0 else 0.0
                   rework_percent = rework_task_count / total_task_count if total_task_count > 0 else 0.0
                   ave_complexity = total_complexity / total_task_count if total_task_count > 0 else 0.0

                   row = (task.task_assign_to, metrics.task_group_id, task.task_id, metrics.production_type_id,
                          total_task_count, ave_duration, total_duration, task.task_duration,
                          ave_rework_duration, total_rework_duration, task.rework_duration, rework_task_count,
                          rework_percent, ave_complexity, total_complexity, metrics.complexity )

                   insertCursor.insertRow(row)

    except Exception as ex:
        raise Exception(f'Unable to update resource metrics. {ex}')
    finally:
        lock.release()
    pass

def set_metrics_as_calculated(metrics):
    lock = WorkspaceLock(metrics.connection.sde_connection)
    try:
        task_group_table = f'{metrics.connection.table_name_prepender}TOPO_TASK_GROUP_PROPERTIES'
        with arcpy.da.UpdateCursor(task_group_table, ['OID@', 'metrics_calculated'], f'job_id={metrics.job_id}') as updateCursor:
            for row in updateCursor:
                row[1] = 1
                updateCursor.updateRow(row)
    finally:
        lock.release()

def is_metrics_calculated(connection, job_id):
    results = utils.get_query_results(connection,'TOPO_TASK_GROUP_PROPERTIES',['metrics_calculated'], f'job_id={job_id}')
    if not results:
        arcpy.AddIDMessage("ERROR", 413, f"job_id={job_id}", 'TOPO_TASK_GROUP_PROPERTIES') # %1 not found in %2
        sys.exit(1)
    is_calculated = int(results[0]['metrics_calculated'] or 0)
    return False if is_calculated == 0 else True


def main():

    # Initialize tool parameters
    job_id = int(arcpy.GetParameterAsText(0) or 0)
    status_table_path = arcpy.GetParameterAsText(1)
    status_date_field = arcpy.GetParameterAsText(2)
    database_path = arcpy.GetParameterAsText(3)

    if not utils.is_value_empty(status_table_path) and utils.is_value_empty(status_date_field):
        arcpy.AddIDMessage("ERROR", 606,'status_field') # Required parameter %s is missing.
        sys.exit(1)


    # Set temp workspace
    temp_workspace = utils.ScratchWorkspace()

    # Get wmx connection
    connection = None
    try:
        if not utils.is_value_empty(database_path):
            connection = utils.WmxConnection(arcpy.wmx.Connect(database_path), temp_workspace)
        else:
            connection = utils.WmxConnection(arcpy.wmx.Connect(), temp_workspace)
    except Exception as e:
        arcpy.AddError(e)
        sys.exit(1)

    # Get job
    try:
        parent_job = utils.Job(connection, job_id)
    except Exception as e:
        arcpy.AddIDMessage("ERROR", 90286, job_id) # Unable to get WMX job with id %1.
        sys.exit(1)

    #Check if job exists in the task group table
    task_group_jobs = utils.get_query_results(connection,'TOPO_TASK_GROUP_PROPERTIES', ['task_group_id'], f'job_id={job_id}')
    if not task_group_jobs:
        arcpy.AddIDMessage("ERROR", 90298, job_id) # Job %1 has the incorrect job type.
        sys.exit(1)

    # Check if metrics were already calculated
    if is_metrics_calculated(connection, job_id):
        arcpy.AddIDMessage('WARNING', 90300, job_id ) # The metrics for job %1 have already been calculated.
        sys.exit(0)

    # Initialize job metrics
    metrics = JobMetrics(parent_job, status_table_path, status_date_field, database_path)

    if not metrics.tasks:
        arcpy.AddIDMessage('WARNING', 90299, job_id ) # No completed tasks were found for job %1.
##        sys.exit(1)
    else:

        # Update metrics
        update_status_table(metrics)
        update_complexity_metrics(metrics)
        update_task_metrics(metrics)
        update_resource_metrics(metrics)

        set_metrics_as_calculated(metrics)

    arcpy.SetParameter(4, job_id)
    arcpy.SetParameter(5, metrics.status_table_path)


if __name__ == '__main__':
    main()

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
Source Name:   TopoWorkflowUtilities.py
Version:       ArcGIS 2.5
Author:        Environmental Systems Research Institute Inc.
Description:   Contains functions commonly used for topographic workflows.
---------------------------------------------------------------------------
"""


import arcpy
from os import environ, mkdir, path
from shutil import copyfile, rmtree
from uuid import uuid4
from datetime import datetime, timedelta
from random import randint
from pandas.tseries.offsets import *
import sys
import getpass



class WorkspaceLock:
    def __init__(self, workspace):
        self.original_workspace = arcpy.env.workspace
        arcpy.env.workspace = workspace
    def release(self):
        arcpy.env.workspace = self.original_workspace

def is_value_empty(value):
    return value in ('#', ' ', '') or not value

def get_query_results(wmx_connection, table_name, field_list, where_clause):
    """
    Retrieves the matching rows in data table format where values are indexed by field names.

    :param wmx_connection: Workflow database connection
    :param table_name:     Unqualified table name
    :param field_list:     List of fields in list or comma separated string format. use '*' for all fields.
    :param where_clause:   Query expression
    :return:               List of matching rows
    """
    if not wmx_connection or not table_name:
        return None

    fields = None
    if isinstance(field_list, list):
        fields = field_list
    elif isinstance(field_list, str):
        fields = field_list.split(',')
        fields = [fieldName.strip() for fieldName in fields]

    if not fields:
        return None

    results = []
    lock = WorkspaceLock(wmx_connection.sde_connection)
    try:
        if len(fields) == 1 and fields[0] == '*':
            tableFields = arcpy.ListFields(f'{wmx_connection.table_name_prepender}{table_name}')
            if not tableFields:
                return None
            fields = [field.name for field in tableFields]

        with arcpy.da.SearchCursor(f'{wmx_connection.table_name_prepender}{table_name}', fields, where_clause) as searchCursor:
            for row in searchCursor:
                rowValues = CaseDict()
                for i in range(len(fields)):
                    rowValues[fields[i]] = row[i]
                results.append(rowValues)
    except Exception as e:
        raise Exception('Cannot retrieve query results {}'.format(e))
    finally:
        lock.release()
    return results

class Job:
    def __init__(self, connection, job_id):
        """Passes in a wmx job connection (from arcpy.wmx) and a job ID # """
        self.connection = connection
        self.job = self.connection.wmx_connection.getJob(job_id)

        if self.job is None:
            raise Exception('Unable to get job from job id. {}'.format(job_id))

        self.job_id = job_id
        self.job_type_category = self.get_job_type_category()

        self.property_tables = CaseDict()
        self.configure_property_tables()

    def __del__(self):
        pass

    def get_task_group_id(self):
        task_group_id = None
        original_workspace = arcpy.env.workspace
        try:
            # get the SDE connection information to the workflow manager database
            arcpy.env.workspace = self.connection.sde_connection

            query_id = self.job.ID

            # search the Topo Task Group table for the task group id
            with arcpy.da.SearchCursor(r'{}TOPO_TASK_GROUP_PROPERTIES'.format(self.connection.table_name_prepender),
                                       ['task_group_id'],
                                       "job_id = {}".format(query_id)) as cur:
                for row in cur:
                    task_group_id = row[0]

            # if no task group id, then likely a child job.  Try id of parent
            if not task_group_id:
                query_id = self.job.parent

                with arcpy.da.SearchCursor(r'{}TOPO_TASK_GROUP_PROPERTIES'.format(self.connection.table_name_prepender),
                                           ['task_group_id'],
                                           "job_id = {}".format(query_id)) as cur:
                    for row in cur:
                        task_group_id = row[0]
        except Exception as e:
            raise Exception('Unable to determine job type category. {}'.formate(e))
        finally:
            arcpy.env.workspace = original_workspace
            return task_group_id, query_id

    def get_job_type_category(self):
        job_type_category = None
        original_workspace = arcpy.env.workspace
        try:
            # get the SDE connection information to the workflow manager database
            arcpy.env.workspace = self.connection.sde_connection

            # search the job type for the category value
            ''' need to query the tables directly because JobTypeDescription from arcpy.wmx
            does not expose the job type cateogry'''
            with arcpy.da.SearchCursor(r'{}JTX_JOB_TYPES'.format(self.connection.table_name_prepender),
                                       ['category'],
                                       "job_type_id = '{}'".format(str(self.job.jobTypeID))) as cur:
                for row in cur:
                    job_type_category = row[0]
        except Exception as e:
            raise Exception('Unable to determine job type category. {}'.formate(e))
        finally:
            arcpy.env.workspace = original_workspace
            return job_type_category

    def configure_property_tables(self):
        """ Populates the property_tables dictionary.  The key is the unqualified
        property table name and the value is the arcpy.wmx ExtendedProperty object"""
        for table in self.job.listExtendedProperties():
            if table is not None:
                table_name = table.split('.')
                table_name = table_name[len(table_name) - 1]
                try:
                    # returns the extended property table records for the
                    # specified job
                    self.property_tables[table_name] = self.job.getExtendedPropertyTable(table)
                except Exception as e:
                    raise Exception('Unable to get properties for table: {0}. {1}'.format(table, e))
            else:
                raise Exception('Unable to set property tables for job. No property tables configured.')

    def get_property(self, table_name, property_name):
        """ determines that the extended property table uses a one for one relationship
        with the job and then returns the value for the property_name field
        from the chosen extended property table name """
        # used in multiple steps (set task list, Set production properties)
        if table_name in self.property_tables:
            if self.property_tables[table_name].cardinality == 'one_to_one':
                return self.property_tables[table_name][property_name].data
            else:
                raise Exception('Unable to get property. Only tables with one_to_one cardinality may be queried by property.')
        else:
            raise Exception('Unable to get property {} table {} not found.'.format(property_name, table_name))

    def get_properties(self, table_name):
        """ returns a list of records from the extended property table.
        Each item in the list is a dictionary.  The dictionary contains the a
        record where the key is the property name and the value is the
        property value. """

        #Used by Update Property Count, Set Task Status
        records = []
        if table_name in self.property_tables:
            if self.property_tables[table_name].cardinality == 'one_to_one':
                new_dict = CaseDict()
                new_dict['objectid'] = self.property_tables[table_name][0].ID
                for i in range(0, len(self.property_tables[table_name])):
                    new_dict[self.property_tables[table_name][i].propName] = self.property_tables[table_name][i].data
                records.append(new_dict)
            else:
                for row in self.property_tables[table_name]:
                    new_dict = CaseDict()
                    new_dict['objectid'] = row[0].ID
                    for (name, value) in (sorted(row, key=lambda x: x[1].displayOrder)):
                        new_dict[name] = value.data
                    records.append(new_dict)
        return records

    def update_property(self, table_name, record, **keywords):
        """ updates the values in an extended property table based on a
        dictionary of values.  The dictionary has the key as the property name
        to update and the value as the value that should be assigned to the
        extened property.  The keywords parameter is option and use when the
        extened property table is a 1 to many."""
        """ I think this updates one record even if 1 to M relationship"""
        #used by Set Next Task, Create Job For task, Set task status, Update Property Count
        record_updated = False
        record_index = None
        if 'index' in keywords:
            record_index = keywords['index']
        for key in record:
            if key != 'objectid':
                if self.property_tables[table_name].cardinality == 'one_to_one':
                    if self.property_tables[table_name][key].canUpdate:
                        if self.property_tables[table_name][key].data != record[key]:
                            self.property_tables[table_name][key].data = record[key]
                            record_updated = True
                else:
                    if record_index is not None:
                        if self.property_tables[table_name][record_index][key].canUpdate:
                            if self.property_tables[table_name][record_index][key].data != record[key]:
                                self.property_tables[table_name][record_index][key].data = record[key]
                                record_updated = True
                    else:
                        raise Exception('Unable to update record. Record index not provided.')
        if record_updated:
            self.job.save()
            return self.property_tables[table_name]

    def update_properties(self, table_name, records):
        """ updates the values in an extended property table based on a
        dictionary of values.  The dictionary has the key as the property name
        to update and the value as the value that should be assigned to the
        extened property.  Function only works for 1 to M extended property tables
        not 1 to 1."""
        """Looks like can update many records in 1 to M relationship"""
        ''' is this necessary since the update_property works for both 1to1 and 1toM?'''
        # used by Insert Task Group
        record_updated = False
        object_ids = []
        if self.property_tables[table_name].cardinality == 'one_to_one':
            raise Exception('Unable to update property. Table cardinality must be one_to_many to update multiple ' +
                            'records.')
        '''AB - added check for fields in extended property table.
        When running set task list, some keys in the task record do not
        have fields in extended property table that match.  added
        check to make sure key has matching field before adding value
        to the extended property table'''
        table_fields = []
        for row in self.property_tables[table_name]:
            object_ids.append(row[0].ID)
            for (name, value) in row:
                table_fields.append(name)

        table_fields = list(set(table_fields))
        for record in records:
            object_id = object_ids.index(record['objectid'])
            for key in record:
                if key != 'objectid':
                    if key in table_fields:
                        if self.property_tables[table_name][object_id][key].canUpdate:
                            if self.property_tables[table_name][object_id][key].data != record[key]:
                                self.property_tables[table_name][object_id][key].data = record[key]
                                record_updated = True
            if record_updated:
                self.job.save()
                record_updated = False
        return self.property_tables[table_name]

    def create_property(self, table_name, records):
        """ Creates a new record in a 1 to m extened property table.  The values
        populated for the record come from the records dictionary """
        # Used by Insert Task Group
        if self.property_tables[table_name].cardinality == 'one_to_one':
            raise Exception(
                'Unable to create new property record. Table cardinality must be one_to_many to add new records.')

        for record in records:
            new_record = self.property_tables[table_name].createRecord()
            '''AB - added check for fields in extended property table.
            When running set task list, some keys in the task record do not
            have fields in extended property table that match.  added
            check to make sure key has matching field before adding value
            to the extended property table'''
            table_fields = []
            for (name, value) in new_record:
                table_fields.append(str(name))
            for key in record:
                if key != 'objectid':
                    if key in table_fields:
                        if new_record[key].canUpdate:
                            new_record[key].data = record[key]
            self.job.save()
        return self.property_tables[table_name]

    def set_dates(self, start_date, end_date):
        # used by Set task list, Create Job For Task
        try:
            self.job.startDate = start_date
            self.job.dueDate = end_date
            self.job.save()
        except Exception as e:
            raise Exception('Unable to configure job start and due dates. {}'.format(e))

    def set_data_workspace(self, db_name):
        """ reads the JTX_Databases table to identify the db_id for the chosen
        database.  Set the job data workspace to the specific db_id """
        # used by Set Data Workspace step
        db_id = None
        dbNameField = "db_name"
        original_workspace = arcpy.env.workspace
        try:
            arcpy.env.workspace = self.connection.sde_connection
            with arcpy.da.SearchCursor(r'{}JTX_DATABASES'.format(self.connection.table_name_prepender),
                                       ['db_id'],
                                       "LOWER({0}) = LOWER('{1}')".format(dbNameField, db_name)) as cur:
                for row in cur:
                    db_id = row[0]
            if db_id is not None:
                self.job.setDataWorkspace(db_id)
                self.job.save()
            else:
                raise Exception('Unable to determine database id.')
        except Exception as e:
            raise Exception('Unable to set db_id for input data source: {0}. {1}'.format(db_name, e))
        finally:
            arcpy.env.workspace = original_workspace

    def get_data_workspace(self):
        """ determines the ID for the data workspace current set for the
        chosen job.  """
        ''' why isn't this a property of the Job object in arcpy.wmx?'''
        db_id = None
        original_workspace = arcpy.env.workspace
        try:
            arcpy.env.workspace = self.connection.sde_connection
            with arcpy.da.SearchCursor(r'{}JTX_JOBS'.format(self.connection.table_name_prepender),
                                       ['active_db'],
                                       "job_id = {}".format(self.job_id)) as cur:
                for row in cur:
                    db_id = row[0]
            if db_id is None:
                raise Exception('Unable to determine database id.')
        except Exception as e:
            raise Exception('Unable to get active_db for job. {}'.format(e))
        finally:
            arcpy.env.workspace = original_workspace
            return db_id

    def set_job_hold(self, hold_type):
        """ Get hold type id and add a hold of that type to the job. """
        # Use by create Job for task - adds hold if no resource available
        # Used by set Job hold
        hold_id = None
        original_workspace = arcpy.env.workspace
        try:
            hold_types = self.connection.wmx_connection.config.getHoldTypes()
            for hold in hold_types:
                if hold.name.lower() == hold_type.lower():
                    hold_id = hold.ID
                    break

            if hold_id is not None:
                ''' Child job ID is not stored in Topographic Task Properties would be
                nice to includ information about the child job that is causing the
                hold'''
                self.job.addHold(hold_id, arcpy.GetIDMessage(90290, "This hold was added automatically by the Topographic Mapping Production Workflow System."))
                self.job.save()
            else:
                raise Exception('Unable to determine hold type id.')
        except Exception as e:
            raise Exception('Unable to add hold type for job. {}'.format(e))
        finally:
            arcpy.env.workspace = original_workspace

    def remove_job_hold(self, hold_type):
        """ determines if a hold of a specific type exists on the job
        and releases it. """
        # used by remove job hold
        try:
            holds = self.job.getHolds()
            for hold in holds:
                if hold.active is True and hold.type == hold_type:
                    self.job.releaseHold(hold, comment='This hold was released automatically by the Topographic ' +
                                                       'Mapping Production Workflow System.')
        except Exception as e:
            raise Exception('Unable to remove job hold for job. {}'.format(e))

    def get_loi(self):
        """ returns the Job AOI as a polygon geometry"""
        loi_geometry = None
        original_workspace = arcpy.env.workspace
        try:
            arcpy.env.workspace = self.connection.sde_connection
            ''' arcpy.wmx has a setLOI function why not get LOI?'''
            with arcpy.da.SearchCursor(r'{}JTX_JOBS_AOI'.format(self.connection.table_name_prepender),
                                       ['SHAPE@'],
                                       "job_id = {}".format(self.job_id)) as cur:
                for row in cur:
                    loi_geometry = row[0]
            ''' Could use job.hasLOI()'''
            if loi_geometry is None:
                raise Exception('Unable to determine job LOI.')
        except Exception as e:
            raise Exception('Unable to get LOI for job. {}'.format(e))
        finally:
            arcpy.env.workspace = original_workspace
            return loi_geometry

    def set_percent_complete(self, percent_complete):
        """Sets the job percent complete value to the specific percent """
        '''Percent complete is a job property but is read only so have to update
        the job table manually'''
        original_workspace = arcpy.env.workspace
        try:
            arcpy.env.workspace = self.connection.sde_connection
            with arcpy.da.UpdateCursor(r'{}JTX_JOBS'.format(self.connection.table_name_prepender),
                                       ['perc_complete'],
                                       "job_id = {}".format(self.job_id)) as cur:
                for row in cur:
                    row[0] = percent_complete
                    cur.updateRow(row)
        except Exception as e:
            raise Exception('Unable to set percent complete for job. {}'.format(e))
        finally:
            arcpy.env.workspace = original_workspace

    def set_assignment(self, task_id):
        """ Automatically assign job to a user based on schedule availability """
        # used by Create Job For Task
        job_updated = False
        original_workspace = arcpy.env.workspace
        try:
            arcpy.env.workspace = self.connection.sde_connection

            nameField = "task_job_type_name"
            with arcpy.da.SearchCursor(r'{}TASK'.format(self.connection.table_name_prepender),
                                       ['default_assignment', 'PREVIOUS_TASK_ASSIGNMENT'],
                                       "job_type_id = {0} AND task_id = {1}".format(str(self.job.jobTypeID), str(task_id))) as cur1:
                for row1 in cur1:
                    if row1[1] != 'None':
                        with arcpy.da.SearchCursor(r'{}TOPO_TASK_PROPERTIES'.format(self.connection.table_name_prepender),
                                                   ['task_assign_to', 'task_order'],
                                                   "LOWER({0}) = LOWER('{1}') AND job_id = {2} AND task_id <> {3}".format(nameField, str(row1[1]), str(self.job.parent), str(task_id)),
                                                   sql_clause=(None, 'ORDER BY task_order DESC')) as cur2:
                            userAssigned = False
                            for row2 in cur2:
                                self.job.assignedTo = str(row2[0])
                                self.job.assignedType = 'User'
                                self.job.save()
                                job_updated = True

                                userAssigned = True

                            if not userAssigned:
                                self.job.assignedTo = str(row1[0])
                                self.job.assignedType = 'Group'
                                self.job.save()
                                job_updated = True

                    else:
                        self.job.assignedTo = str(row1[0])
                        self.job.assignedType = 'Group'
                        self.job.save()
                        job_updated = True
        except Exception as e:
            raise Exception('Unable to set assignment for job. {}'.format(e))
        finally:
            arcpy.env.workspace = original_workspace
            return job_updated

    def get_property_return_value(self, table_name, property_name):
        ''' is this necessary?  Could be passed from steps or use ReturnValue custom step'''
        return_value = None
        value = None
        original_workspace = arcpy.env.workspace
        try:
            value = self.get_property(table_name, property_name)
            arcpy.env.workspace = self.connection.sde_connection
            with arcpy.da.SearchCursor(r'{}TOPO_RETURN_VALUE'.format(self.connection.table_name_prepender),
                                       ['return_value'],
                                       "table_name = '{0}' AND field_name = '{1}' ".format(table_name, property_name) +
                                       "AND value = '{}'".format(value)) as cur:
                for row in cur:
                    return_value = row[0]
        except Exception as e:
            raise Exception('Unable to determine return value for input property value: {0}. {1}'.format(value, e))
        finally:
            arcpy.env.workspace = original_workspace
            return return_value


class ProductionProperties:

    def __init__(self, connection, production_type):
        self.connection = connection
        self.production_type = production_type
        self.prod_properties = CaseDict()

        self.configure_production_properties()

    def __del__(self):
        pass

    def configure_production_properties(self):
        """ Get properties from TOPO_PRODUCTION_TYPE table """
        original_workspace = arcpy.env.workspace
        try:
            arcpy.env.workspace = self.connection.sde_connection

            fields = arcpy.ListFields(r'{}TOPO_PRODUCTION_TYPE'.format(self.connection.table_name_prepender))
            ''' get actual field name  to avoid case problems in query'''
            nameField = "name"
            for field in fields:
                tmpName = field.name
                if tmpName.lower() == 'name':
                    nameField = field.name
                    break

            cursor = arcpy.SearchCursor(r'{}TOPO_PRODUCTION_TYPE'.format(self.connection.table_name_prepender),
                                       where_clause = "LOWER({}) = LOWER('{}')".format(nameField, self.production_type))
            for row in cursor:
                for field in fields:
                    if field.type != "OID":
                        self.prod_properties[field.name] = row.getValue(field.name)
        except Exception as e:
            raise Exception('Unable to configure production properties. {}'.format(e))
        finally:
            arcpy.env.workspace = original_workspace


class TaskGroup:
    def __init__(self, connection, job_id, task_group_id):
        self.connection = connection
        self.job_id = job_id
        self.task_group_id = task_group_id
        self.task_list = []
        self.status_values_list = []
        self.aoi_fc = None
        self.name = None
        self.prod_type = None
        self.rework_id = None

        # get the list of tasks for the task group from the job
        self.get_task_group_properties()
        self.configure_task_list_from_job()

    def get_task_group_properties(self):
        """ Gets name and aoi_fc for task group """
        original_workspace = arcpy.env.workspace
        try:
            arcpy.env.workspace = self.connection.sde_connection
            with arcpy.da.SearchCursor(r'{}TASK_GROUP'.format(self.connection.table_name_prepender),
                                       ['name', 'default_production_type', 'rework_task_id', 'aoi_fc'],
                                       'task_group_id={}'.format(self.task_group_id)) as cur:
                for row in cur:
                    self.name = row[0]
                    self.prod_type = row[1]
                    self.rework_id = row[2]
                    self.aoi_fc = row[3]

        except Exception as e:
            raise Exception('Unable to retrieve task group properties. {}'.format(e))
        finally:
            arcpy.env.workspace = original_workspace


    def configure_task_list_from_job(self):
        """ populates the task_list with a list of Task objects for a job.
        Gets the list and order of each task associated with a job from the
        Topo_Task_Properties table.  Creates a task object from the properties. """
        # used to initialize a task group
        original_workspace = arcpy.env.workspace
        try:
            arcpy.env.workspace = self.connection.sde_connection
            with arcpy.da.SearchCursor(r'{}TOPO_TASK_PROPERTIES'.format(self.connection.table_name_prepender),
                                       ['objectid', 'task_id', 'task_order'],
                                       'job_id = {}'.format(str(self.job_id))) as cur:
                for row in cur:
                    task = Task(self.connection, row[0], row[1], row[2])
                    self.task_list.append(task)
            self.task_list.sort(key=lambda x: x.task_order)
        except Exception as e:
            raise Exception('Unable to configure task list from job. {}'.format(e))
        finally:
            arcpy.env.workspace = original_workspace

    def get_task_group_relationships(self):
        """ Creates a list of types of jobs to be created and a dictionary of
        dependencies """
        original_workspace = arcpy.env.workspace
        dependency_dict = {} # related task group id = [spatial operation, status]
        create_list = [] # [related task group id ]
        try:
            arcpy.env.workspace = self.connection.sde_connection
            with arcpy.da.SearchCursor(r'{}TASK_GROUP_RELATIONSHIPS'.format(self.connection.table_name_prepender),
                                       ['relate_type', 'related_id', 'relate_operation', 'relate_status'],
                                       'task_group_id = {}'.format(str(self.task_group_id))) as cur:
                for row in cur:
                    if row[0].upper() == 'DEPENDENCY':
                        dependency_dict[row[1]] = [row[2], row[3]]
                    else:
                        create_list.append(row[1])
        except Exception as e:
            raise Exception('Unable to determine task group relationships. {}'.format(e))
        finally:
            arcpy.env.workspace = original_workspace
            return create_list, dependency_dict

    def get_initial_task_list(self, groupid = None, startDate = None):
        """ For setting an intial set of tasks before a job exists based on the task group id.
        Reads the Task_Group_Dependency table to determine the order tasks
        should be run in.  Create a task object for task in the group.
        Set the intial start and due dates based on today and the LOE for each
        task. """
        initial_tasks = []
        # used to initialize a task group
        original_workspace = arcpy.env.workspace
        try:

            pjob = self.connection.wmx_connection.getJob(self.job_id)

            if startDate is None:
                start = pjob.startDate
                if not start or start < datetime.now():
                    start = datetime.now()
            else:
                start = startDate

            if groupid is None:
                group_id = self.task_group_id
            else:
                group_id = groupid

            arcpy.env.workspace = self.connection.sde_connection
            # get the list of default tasks and task orders for the task group
            with arcpy.da.SearchCursor(r'{}TASK_GROUP_DEPENDENCY'.format(self.connection.table_name_prepender),
                                       ['task_id', 'task_order'],
                                    'task_group_id = {}'.format(str(group_id)),
                                    sql_clause=(None, 'ORDER BY task_order')) as cur:
                ''' Ordered by task_order so we set correct start/end dates '''
                for row in cur:
                    # create a task object for each task in the group
                    task = Task(self.connection, None, row[0], row[1])
                    if len(initial_tasks) < 1:
                        # for the first task, set the default dates (i.e. start today)
                        ''' Should we be using the start date from the task group (parent job)
                        otherwise task start day could be before task group start date'''
                        task.set_planned_dates(start)

                    else:
                        # for other tasks, set dates starting at day previous tasks ends
                        task.set_planned_dates(initial_tasks[len(initial_tasks) - 1].end_date)

                    # if default assignment does not exist for task, determine assignment
                    if task.task_assign_to == 'None' or not task.task_assign_to:
                        task.get_default_assignment()
                    # add task to task list
                    initial_tasks.append(task)

            # sort task list by task order
            initial_tasks.sort(key=lambda x: x.task_order)
        except Exception as e:
            raise Exception('Unable to configure initial task list. {}'.format(e))
        finally:
            arcpy.env.workspace = original_workspace

        return initial_tasks

    def get_task_properties(self):
        """ Returns a list of task properties for all tasks in this task group"""
        # used by Set Test List, Create Job for Task
        records = []
        for task in self.task_list:
            records.append(task.get_properties())
        return records

    def get_default_task_properties(self):
        """ Returns a list of task properties for all default tasks in this task group"""
        # used by Set Test List, Create Job for Task
        records = []
        for task in self.get_initial_task_list():
            records.append(task.get_properties())
        return records

    def get_next_task(self):
        """ Determines the next task as the task with status == 1.  Returns the
        ID and name of the task as a dictionary. self.task_list is ordered by task order"""
        # used by Set Next Task
        next_task = CaseDict({'current_task': -1, 'current_task_job_type_name': ''})
        for task in self.task_list:
            if task.task_status == 1:
                next_task['current_task'] = task.object_id
                next_task['current_task_job_type_name'] = task.job_type_name
                break
        return next_task

    def get_task_status_value(self, description):
        """ Reads the status_values_list and returns the status value
        based on the choense description"""
        # Used by Set Task Status
        '''What is returned if the description does not exist in the list?'''
        for value in self.status_values_list:
            if value['description'] == description:
                return value['value']

    def get_percent_complete(self):
        """ Determines the percent complete for the task group based on how much
        of the work for the tasks in the group is complete compared to the total
        amount of work"""
        total_loe = 0
        completed_loe = 0
        for task in self.task_list:
            # determines how many days the task should take
            task_loe = (task.end_date - task.start_date).days
            # add the task loe to the total loe
            total_loe += task_loe

            # determine how much of the task is completed based on the
            # task percent complete
            percent_complete = task.get_percent_complete()
            if percent_complete == 100:
                completed_loe += task_loe
            else:
                completed_loe += task_loe * (percent_complete / 100)

        # return the loe as the work complete / the total work
        return (completed_loe / total_loe) * 100

    def insert_task_group(self, task_id, task_group_id):
        """ Adds a task group after the sepcified task ID"""
        # used by Insert Task Group
        new_task_records = []
        updated_task_records = []
        original_workspace = arcpy.env.workspace
        try:
            arcpy.env.workspace = self.connection.sde_connection
            starting_order = 0
            start_date = None
            # get the task order and end data from the chosen task
            if task_id is not None:
                for task in self.task_list:
                    if task.object_id == task_id:
                        starting_order = task.task_order
                        start_date = task.end_date
                        break
            else:
                self.task_list.sort(key=lambda x: x.task_order)
                for task in self.task_list:
                    if task.task_status == 1:
                        starting_order = task.task_order
                        start_date = task.start_date
                        break


            new_tasks = self.get_initial_task_list(task_group_id, start_date)
            i = 1
            # set the task order for the new tasks to occur in sequence after the
            # chosen task id
            for task in new_tasks:
                ''' if task ID was not found in task_list, starting order is None,
                None + 1 should fail'''
                task.task_order = starting_order + i
                i += 1
                task.inserted_task = 1

            # set the start_date to be the end date of the last inserted task
            start_date = new_tasks[len(new_tasks) - 1].end_date

            # update the dates and task order of all the tasks that were originally
            # in the task list before adding the new tasks
            for task in self.task_list:
                if task.task_order > starting_order:
                    task.task_order = task.task_order + (i - 1)
                    task.set_planned_dates(start_date)
                    start_date = task.end_date
                updated_task_records.append(task.get_properties())

            # add all the new tasks to the task list
            for task in new_tasks:
                new_task_records.append(task.get_properties())
                self.task_list.append(task)
            # sort the task list by task order
            self.task_list.sort(key=lambda x: x.task_order)

        except Exception as e:
            raise Exception('Unable to configure initial task list. {}'.format(e))
        finally:
            arcpy.env.workspace = original_workspace
            return updated_task_records, new_task_records


class Task:
    def __init__(self, connection, object_id, task_id, task_order):
        """ defines the properties of a newly created task"""
        self.connection = connection
        self.object_id = object_id
        self.task_id = task_id
        self.task_name = None
        self.job_id = None
        self.job_type_id = None
        self.job_type_name = None
        self.task_order = task_order
        self.task_status = 1
        self.start_date = None
        self.date_started = None
        self.end_date = None
        self.date_ended = None
        self.default_loe = None
        self.percent_complete = None
        self.task_assign_to = None
        self.task_duration = None
        '''AB - added property to track how many tasks are be inserted in
        middle of task group - 0 - planned, 1 - inserted'''
        self.inserted_task = 0
        self.task_group_id = 0
        self.automation_assignment = None

        # upated default task properties based on stored information
        self.configure_task()

    def __del__(self):
        pass

    def configure_task(self):
        """ Update the default task properties based on information from
        wmx and extended property tables """
        original_workspace = arcpy.env.workspace
        try:
            arcpy.env.workspace = self.connection.sde_connection
            # get the task name, job type id, and default level of effort from
            # the task table
            ''' Should we be using the OID for the task id?  could get out of
            sync between databases '''
            with arcpy.da.SearchCursor(r'{}TASK'.format(self.connection.table_name_prepender),
                                       ['name', 'job_type_id', 'default_loe', 'task_group_id'],
                                       'objectid = {}'.format(str(self.task_id))) as cur:
                for row in cur:
                    self.task_name = row[0]
                    self.job_type_id = row[1]
                    self.default_loe = row[2]
                    self.task_group_id = row[3]

            # get the job type name from the job type id using the job types table
            ''' can be retrieved using arcpy.wmx conn.config.getJobTypes() '''
            with arcpy.da.SearchCursor(r'{}JTX_JOB_TYPES'.format(self.connection.table_name_prepender),
                                       ['job_type_name'],
                                       'job_type_id = {}'.format(str(self.job_type_id))) as cur:
                for row in cur:
                    self.job_type_name = row[0]

            # if the task has an object id
            if self.object_id is not None:
                ''' Should we be using the OID for the task id?  could get out of
                sync between databases '''
                # get the status and date properties from the topo task properties table
                with arcpy.da.SearchCursor(r'{}TOPO_TASK_PROPERTIES'.format(self.connection.table_name_prepender),
                                           ['task_status',
                                            'start_date',
                                            'date_started',
                                            'end_date',
                                            'date_ended', 'task_assign_to',
                                            'task_duration', 'inserted_task', 'automation_assignment'],
                                           'objectid = {}'.format(str(self.object_id))) as cur:
                    for row in cur:
                        self.task_status = row[0]
                        self.start_date = row[1]
                        self.date_started = row[2]
                        self.end_date = row[3]
                        self.date_ended = row[4]
                        self.task_assign_to = row[5]
                        self.task_duration = row[6] or 0.0
                        self.inserted_task = row[7]
                        self.automation_assignment = row[8]

                # get the current job id from the topo task group properties
                with arcpy.da.SearchCursor(r'{}TOPO_TASK_GROUP_PROPERTIES'.format(self.connection.table_name_prepender),
                                           ['job_id'],
                                           'current_task = {}'.format(str(self.object_id))) as cur:
                    for row in cur:
                        ''' why are we querying the jobs table.  The query passes row[0]
                        as the 'job_id' value  and the search is returning the 'job_id'
                        value so why query the jobs table? '''
                        with arcpy.da.SearchCursor(r'{}JTX_JOBS'.format(self.connection.table_name_prepender),
                                                   ['job_id'],
                                                   'job_id = {0} AND job_type_id = {1}'.format(str(row[0]),
                                                                                               str(self.job_type_id))) as cur2:
                            for row2 in cur2:
                                self.job_id = row2[0]
        except Exception as e:
            raise Exception('Unable to configure task list. {}'.format(e))
        finally:
            arcpy.env.workspace = original_workspace

    def get_properties(self):
        """ return the task properties as a dictionary """
        record = CaseDict({'objectid': self.object_id,
                  'task_id': self.task_id,
                  'task_order': self.task_order,
                  'task_job_type_name': self.job_type_name,
                  'task_status': self.task_status,
                  'start_date': self.start_date,
                  'date_started': self.date_started,
                  'end_date': self.end_date,
                  'date_ended': self.date_ended,
                  'default_loe': self.default_loe,
                  'inserted_task': self.inserted_task,
                  'task_assign_to': self.task_assign_to,
                  'automation_assignment': self.automation_assignment})
        return record

    def get_default_assignment(self):
        task_id = self.task_id
        parent_job_id = self.object_id
        order = self.task_order
        # get the assignment info for the task type from the task table
        with arcpy.da.SearchCursor(r'{}TASK'.format(self.connection.table_name_prepender),
                                   ['default_assignment', 'previous_task_assignment', 'automation_assignment'],
                                   'task_id = {}'.format(str(self.task_id))) as cur:
            for row in cur:
                task_assign = row[1]
                default_assign = row[0]
                auto_assign = row[2]
                if auto_assign == 'None':
                    auto_assign = None

        assign_user = None
        if task_assign != "" and task_assign is not None and parent_job_id is not None:
            with arcpy.da.SearchCursor(r'{}TOPO_TASK_PROPERTIES'.format(self.connection.table_name_prepender),
                                       ['task_job_type_name','task_order','task_assign_to', 'job_id'],
                                       'objectid = {}'.format(parent_job_id)) as cur:
                for row in cur:
                    if row[0] == task_assign and row[1] < order:
                        assign_user = row[2]

        if not assign_user:
            assign_user = default_assign

        self.task_assign_to = assign_user
        self.automation_assignment = auto_assign

        return

    def set_planned_dates(self, start_date):
        """ set the start and end dates for the task """
        workday = 'Mon Tue Wed Thu Fri'
        with arcpy.da.SearchCursor(r'{}TASK_GROUP'.format(self.connection.table_name_prepender),
                       ['Workdays'],
                       'task_group_id = {}'.format(self.task_group_id)) as cur:

            for row in cur:

                workday = row[0]
        workdays = CustomBusinessDay(weekmask=workday)

        if start_date is None:
            start_date = datetime.now()
        self.start_date = start_date + 0*workdays
        ''' will this fail if default_loe is None?'''
##        self.end_date = self.start_date + timedelta(days=self.default_loe)

        if self.default_loe is None:
            self.end_date = self.start_date
        else:
            self.end_date = self.start_date + (int(self.default_loe) * workdays) + timedelta(hours=(self.default_loe-int(self.default_loe))*8)

    def get_percent_complete(self):
        """ determine the task percent complete value"""
        original_workspace = arcpy.env.workspace
        try:
            arcpy.env.workspace = self.connection.sde_connection
            ''' what is task_status of 10 and 1 and why do we have them?'''
            if self.task_status == 10:
                self.percent_complete = 100
            elif self.task_status == 1:
                self.percent_complete = 0
            else:
                # get the job percent complete
                job = Job(self.connection, self.job_id)
                percent_complete = job.job.percentComplete
                default_percent_complete = -1
                step_percent_complete = 0
                ''' do we need to get the step percent complete?  doesn't updating
                the step percent complete update the overall job percent complete?'''
                for step_id in job.job.currentSteps:
                    with arcpy.da.SearchCursor(r'{}JTX_JOB_STEP'.format(self.connection.table_name_prepender),
                                               ['default_perc_complete',
                                                'step_perc_complete'],
                                               'step_id = {}'.format(str(step_id))) as cur:
                        for row in cur:
                            default_percent_complete = row[0]
                            step_percent_complete = row[1]
                if default_percent_complete > percent_complete:
                    if step_percent_complete > 0:
                        self.percent_complete = ((default_percent_complete - percent_complete) *
                                                 (step_percent_complete / 100)) + percent_complete
        except Exception as e:
            raise Exception('Unable to calculate percent complete for task. {}'.format(e))
        finally:
            arcpy.env.workspace = original_workspace
            return self.percent_complete


class WmxConnection:
    def __init__(self, connection, scratch_workspace):
        self.wmx_connection = connection
        '''Creates a new scratch folder for each step that runs that requires
        a connection to the WMX resository. Is there a way we can do this
        that will not create so much throw away data?'''
        self.scratch_workspace = scratch_workspace

        self.sde_connection = self.sde_from_jtc()
        self.table_name_prepender = self.configure_fully_qualified_table_prepender()

    def __del__(self):
        pass

    def sde_from_jtc(self):
        """ Copy the jtc file to an sde file on disk """
        # SDE file is needed for some functions that read the tables directly rather
        # than using the arcpy.wmx classes
        if self.wmx_connection is not None:
            if path.exists(self.wmx_connection.jtcPath):
                sde_path = r'{0}\{1}.sde'.format(self.scratch_workspace.temp_folder, str(uuid4()))
                try:
                    copyfile(self.wmx_connection.jtcPath, sde_path)
                    return sde_path
                except Exception as e:
                    raise Exception('Unable to create sde connection for wmx workspace. {}'.format(e))
            else:
                raise Exception('Unable to create sde connection for wmx workspace. ' +
                                'Jtc connection file does not exist.')
        else:
            raise Exception('Unable to create sde connection for wmx workspace. Wmx workspace connection does not ' +
                            'exist in the current project.')

    def configure_fully_qualified_table_prepender(self):
        """ determine the qualifier for the wmx tables """
        if self.sde_connection is not None:
            original_workspace = arcpy.env.workspace
            # get a list of tables from the wmx database
            table_list = None
            try:
                arcpy.env.workspace = self.sde_connection
                table_list = arcpy.ListTables()
            except Exception as e:
                raise Exception('Unable to determine fully qualified table prepender. ' +
                                'Unable to get table list. {}'.format(e))
            finally:
                arcpy.env.workspace = original_workspace

            # get the first table in the list, split on the '.' and return the
            # beginning portion of the table name

            '''Is this the best way.  What if the sde has connections to multiple schemas?
            edit.RoadL and wmx.JTX_JOBS will it return the wrong qualifier?'''
            fully_qualified_table_prepender = ''
            if table_list is not None:
                for table in table_list:
                    if table.endswith('JTX_JOBS'):
                        fully_qualified_table_prepender = table[:table.rfind('.')+1]
                        break
                    # s = table.split('.')
                    # for i in range(0, len(s) - 1):
                        # fully_qualified_table_prepender = fully_qualified_table_prepender + s[i] + "."

                return fully_qualified_table_prepender
            else:
                raise Exception('Unable to determine fully qualified table prepender. ' +
                                'No tables returned from wmx workspace.')
        else:
            raise Exception('Unable to determine fully qualified table prepender. Wmx workspace is not configured.')

    def get_job_type_id(self, job_type_name):
        """ return the job type id based on a job type name """
        job_type_id = 0
        job_types = self.wmx_connection.getJobTypes()
        for job_type in job_types:
            if job_type.name == job_type_name:
                job_type_id = job_type.ID
        return job_type_id

    def create_child_job(self, parent_job, child_job_type_name, use_parent_info):
        """ create a new child job based with same proerties as parent """

        # get the information about the job type
        desc = self.wmx_connection.config.getJobTypeDescription(job_type_name=child_job_type_name)
        desc.autoCommitWorkflow = True
        desc.autoExecuteOnCreate = False
        desc.createdBy = parent_job.job.assignedTo
        desc.ownedBy = parent_job.job.owner
        desc.parentJobID = parent_job.job_id
        desc.parentJobName = parent_job.job.name
        if use_parent_info:
            desc.LOI = parent_job.get_loi()
            desc.dataWorkspaceID = parent_job.get_data_workspace()
            desc.parentVersionName = parent_job.job.parentVersion
            desc.versionName = parent_job.job.versionName
        child_job = None
        try:
            child_job = self.wmx_connection.createJob(job_type_description=desc)
            return child_job
        except Exception as e:
            raise Exception('Unable to create child job. {}'.format(e))
            sys.exit(1)


class ScratchWorkspace:
    def __init__(self):
        self.temp_folder = self.create_temp_folder()

    def __del__(self):
        if path.exists(self.temp_folder):
            try:
                rmtree(self.temp_folder)
            except Exception as e:
                raise Exception('Unable to remove temporary folder created for scratch workspace. {}'.format(e))

    @staticmethod
    def create_temp_folder():
        """ create a temporary folder for data """
        # get the temp path
        temp_path = environ.get('TEMP')
        if temp_path is None:
            raise Exception("Environment variable 'TEMP' not defined. Unable to determine temporary folder for " +
                            "scratch workspace")
        else:
            # create a new folder with a unique guid for the folder name
            temp_path = r'{0}\{1}'.format(temp_path, str(uuid4()))
            if path.exists(temp_path):
                raise Exception('Temporary folder exists. Unable to create temporary folder for scratch workspace.')
            else:
                try:
                    mkdir(temp_path)
                    return temp_path
                except Exception as e:
                    raise Exception('Unable to create temporary folder for scratch workspace. Exception: {}'.format(e))


# Dictionary with case insensitive keys
class CaseDict(dict):
    class Key(str):
        def __init__(self, key):
            str.__init__(key)

        def __hash__(self):
            return hash(self.lower())

        def __eq__(self, other):
            return self.lower() == other.lower()

    def __init__(self, data=None):
        super(CaseDict, self).__init__()
        if data is None:
            data = {}
        for key, val in data.items():
            self[key] = val

    def __contains__(self, key):
        key = self.Key(key)
        return super(CaseDict, self).__contains__(key)

    def __setitem__(self, key, value):
        key = self.Key(key)
        super(CaseDict, self).__setitem__(key, value)

    def __getitem__(self, key):
        key = self.Key(key)
        return super(CaseDict, self).__getitem__(key)


# Checking the user running the tool against the user assigned ot the job
def checkuser(conn, job_id):
    cur_wksp = arcpy.env.workspace
    arcpy.env.workspace = conn.sde_connection
    auth_type = ''
    with arcpy.da.SearchCursor(f'{conn.table_name_prepender}JTX_PROPERTIES', ['VALUE'], "PROP_NAME = 'USER_STORE'") as cur:
        for row in cur:
            auth_type = row[0]
    job_user = ''
    with arcpy.da.SearchCursor(f'{conn.table_name_prepender}JTX_JOBS', ['ASSIGNED_TO'], f"job_id = {job_id}") as cur:
        for row in cur:
            job_user = row[0]
    user = ''
    arcpy.env.workspace = cur_wksp
    try:
        if auth_type == 'PORTAL':
            portal_desc = arcpy.GetPortalDescription()
            user = portal_desc['user']['username']
        elif auth_type == 'TRADITIONAL':
            user = getpass.getuser()
    except Exception as e:
        raise Exception(f'Cannot determine current user.\n{e}')
    if str(user.lower()) == str(job_user.lower()) and (str(user) != '' or user is not None):
        pass
    else:
        raise Exception(f'Job {job_id} assigned to {job_user} not {user}.')
    return

from arcpy.arcobjects._base import _ObjectWithoutInitCall, passthrough_attr
from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject, arcobject_to_python_class_mapping
from arcpy.geoprocessing._base import gp_fixargs
from arcpy_wmx import WorkflowExecutionError, WorkflowExecutionStepError
import xml.etree.ElementTree as ET
import datetime
from dateutil import tz

# Python wrappers for PODOs
class ConfigItem():
    def __init__(self, data):
        self.name, self.ID = data
    def __eq__(self, other):
        if isinstance(other, self.__class__):
            return self.ID == other.ID and self.name == other.name
        return NotImplemented
    def __ne__(self, other):
        if isinstance(other, self.__class__):
            return not self.__eq__(other)
        return NotImplemented
    def __hash__(self):
        return hash((self.name, self.ID))

class ActivityType(ConfigItem):
    """The ActivityType object provides access to the  activity type
       configuration element in the Workflow Manager database."""
    def __repr__(self):
        return "Activity Type %i: %s" % (self.ID, self.name)

class HoldType(ConfigItem):
    """The HoldType object
       provides access to the hold types configuration element in the Workflow
       Manager database."""
    def __repr__(self):
        return "Hold Type %i: %s" % (self.ID, self.name)

class JobType(ConfigItem):
    """The JobType object provides access to the job types in the Workflow
       Manager database."""
    def __repr__(self):
        return "Job Type %i: %s" % (self.ID, self.name)

class JobTypeDescription():
    """The JobTypeDescription provides access to
       job type properties that can be customized before creating a job."""
    def __init__(self, data={}):
        self.data = data
        for (k,v) in list(data.items()):
            object.__setattr__(self, k, v)
    def __setattr__(self, name, value):
        if name != "data":
            self.data[name] = value
        object.__setattr__(self, name, value)
    def __repr__(self):
        return "Job Type Description: {" + ", ".join(["%s: %s" % (x, getattr(self, x)) for x in sorted(vars(self), key=lambda pair: pair[0]) if x != 'data']) + "}"
    def __eq__(self, other):
        if isinstance(other, self.__class__):
            return self.data == other.data
        return NotImplemented
    def __ne__(self, other):
        if isinstance(other, self.__class__):
            return not self.__eq__(other)
        return NotImplemented
    def __hash__(self):
        return hash(self.data)

class Priority():
    """The Priority object provides access to a priority configuration element
       in the Workflow Manager database."""
    def __init__(self, data):
        self.value, self.name, self.description = data
    def __repr__(self):
        return "Priority %i: %s" % (self.value, self.name)
    def __eq__(self, other):
        if isinstance(other, self.__class__):
            return self.name == other.name and self.value == other.value and self.description == other.description
        return NotImplemented
    def __ne__(self, other):
        if isinstance(other, self.__class__):
            return not self.__eq__(other)
        return NotImplemented
    def __hash__(self):
        return hash((self.value, self.name, self.description))

class StatusType():
    """The StatusType object provides access to the status type configuration
       elements in the Workflow Manager database."""
    def __init__(self, data):
        self.ID, self.name, self.caption, self.description = data
    def __repr__(self):
        return "Status Type %i: %s" % (self.ID, self.name)
    def __eq__(self, other):
        if isinstance(other, self.__class__):
            return self.name == other.name and self.ID == other.ID and self.caption == other.caption and self.description == other.description
        return NotImplemented
    def __ne__(self, other):
        if isinstance(other, self.__class__):
            return not self.__eq__(other)
        return NotImplemented
    def __hash__(self):
        return hash((self.ID, self.name, self.caption, self.description))

class Attachment():
    """The Attachment object provides access to the attachments associated with
       the job."""
    def __init__(self, data):
        self.ID, self.type, self.name = data
    def __repr__(self):
        return "Attachment %i: %s, %s" % (self.ID, self.type, self.name)
    def __eq__(self, other):
        if isinstance(other, self.__class__):
            return self.ID == other.ID and self.name == other.name and self.type == other.type
        return NotImplemented
    def __ne__(self, other):
        if isinstance(other, self.__class__):
            return not self.__eq__(other)
        return NotImplemented
    def __hash__(self):
        return hash((self.ID, self.type, self.name))

class QueryResult():
    """The QueryResult object provides access to the job query results returned
       by  the queryJobs method."""
    def __init__(self, xml):
        tree = ET.fromstring(xml)

        fields = [QueryField(x) for x in tree.find("COLUMNS").findall("COLUMN")]
        rows = [QueryRow(x, fields) for x in tree.findall("ROW")]

        self.fields = fields
        self.rows = rows

    def __repr__(self):
        return "Query Result with %i rows" % len(self.rows)

    def __eq__(self, other):
        if isinstance(other, self.__class__):
            return self.fields == other.fields and self.rows == other.rows
        return NotImplemented
    def __ne__(self, other):
        if isinstance(other, self.__class__):
            return not self.__eq__(other)
        return NotImplemented
    def __hash__(self):
        return hash((self.fields, self.rows))

class QueryField():
    """The QueryField object exposes properties detailing a field returned by
       the queryJobs method."""
    def __init__(self, fieldInfo):
        self.name = fieldInfo.get('fieldName')
        self._type = int(fieldInfo.get('esriFieldType'))
        self.alias = fieldInfo.text

    def __repr__(self):
        return "Query Field - %s" % self.alias

    def __eq__(self, other):
        if isinstance(other, self.__class__):
            return self.alias == other.alias and self.name == other.name and self._type == other._type
        return NotImplemented
    def __ne__(self, other):
        if isinstance(other, self.__class__):
            return not self.__eq__(other)
        return NotImplemented
    def __hash__(self):
        return hash((self.name, self.alias, self._type))

class QueryRow():
    """The QueryRow object provides access to all the values in a row from the
       result of  the queryJobs method."""
    def __init__(self, rowInfo, fields):
        def convertDateTime(x):
            dt = datetime.datetime.strptime(x,"%x %X")
            return dt.replace(tzinfo=tz.tzutc())
        def fieldTransform(fieldType, x):
            if not(x): # If it is falsy, just return None (presumably None)
                return None
            elif fieldType == 5: # Date
                return convertDateTime(x)
            elif fieldType in [0, 1, 2, 3, 6]: # Integers
                return int(x)
            else: # String no-op
                return x
        self._fieldIdx = {x.name.casefold():idx for idx, x in enumerate(fields)}

        self._values = [fieldTransform(fields[idx]._type, col.text) for idx, col in enumerate(rowInfo.iter("VALUE"))]

    def __repr__(self):
        return repr(self._values)

    def __iter__(self):
        for x in self._values:
          yield x

    def __len__(self):
        return len(self._values)

    def __getitem__(self, item):
        if isinstance(item, int):
            return self._values[item]
        elif isinstance(item, str):
            item = item.casefold()
            return self._values[self._fieldIdx[item]]
        else:
            raise TypeError()

    def __contains__(self, item):
        item = item.casefold()
        return item in self._fieldIdx and 0 <= self._fieldIdx[item] < len(self._values)

    def __eq__(self, other):
        if isinstance(other, self.__class__):
            return self._fieldIdx == other._fieldIdx and self._values == other._values
        return NotImplemented
    def __ne__(self, other):
        if isinstance(other, self.__class__):
            return not self.__eq__(other)
        return NotImplemented
    def __hash__(self):
        return hash((self._values, self._fieldIdx))

class Workflow():
    """The Workflow object provides access to properties to interact with the
       Workflow Manager workflow of a job."""
    def __init__(self, workflowDict):
        self.steps = convertArcObjectToPythonObject(workflowDict["steps"])
        self.name = convertArcObjectToPythonObject(workflowDict["name"])

    def __repr__(self):
        return "%s Workflow" % self.name

# End of wrappers

def Connect(jtc_path=None):
    """Connect({jtc_path})

       Establishes a connection to a Workflow Manager database.

         jtc_path{String}:
       The path to the Workflow Manager  .jtc connection file. If no file is
       specified, the current Workflow Manager connection in the Project will be
       used."""
    import arcpy_wmx
    import arcgisscripting
    return convertArcObjectToPythonObject(arcpy_wmx.Connect(*gp_fixargs([jtc_path], True)))

class ExtendedProperty(_ObjectWithoutInitCall):
    """The ExtendedProperty object provides access to properties of the extended
       property row associated with the job."""
    name = passthrough_attr('name')
    alias = passthrough_attr('alias')
    cardinality = passthrough_attr('cardinality')
    jobID = passthrough_attr('jobID')
    def __getitem__(self, *args):
        return convertArcObjectToPythonObject(self._arc_object.__getitem__(*gp_fixargs((args), True)))

    def __len__(self, *args):
        return convertArcObjectToPythonObject(self._arc_object.__len__(*gp_fixargs((args), True)))

    def __iter__(self):
        for x in self._arc_object:
            yield convertArcObjectToPythonObject(x)


class ExtendedPropertyValue(_ObjectWithoutInitCall):
    """ArcPy class that provides access to the individual cell for extended and
       linked properties associated with the job."""
    data = passthrough_attr('data')
    canUpdate = passthrough_attr('canUpdate')
    displayOrder = passthrough_attr('displayOrder')
    displayType = passthrough_attr('displayType')
    domain = passthrough_attr('domain')
    filter = passthrough_attr('filter')
    ID = passthrough_attr('ID')
    length = passthrough_attr('length')
    propAlias = passthrough_attr('propAlias')
    propName = passthrough_attr('propName')
    required = passthrough_attr('required')
    tableListClass = passthrough_attr('tableListClass')
    tableListDisplayField = passthrough_attr('tableListDisplayField')
    tableListStoreField = passthrough_attr('tableListStoreField')
    userVisible = passthrough_attr('userVisible')

class Job(_ObjectWithoutInitCall):
    """The Job object provides access to properties and methods to interact with
       a Workflow Manager job."""
    name = passthrough_attr('name')
    ID = passthrough_attr('ID')
    assignedTo = passthrough_attr('assignedTo')
    assignedType = passthrough_attr('assignedType')
    createdBy = passthrough_attr('createdBy')
    createdDate = passthrough_attr('createdDate')
    status = passthrough_attr('status')
    percentComplete = passthrough_attr('percentComplete')
    jobTypeID = passthrough_attr('jobTypeID')
    owner = passthrough_attr('owner')
    parent = passthrough_attr('parent')
    startDate = passthrough_attr('startDate')
    dueDate = passthrough_attr('dueDate')
    startedDate = passthrough_attr('startedDate')
    endDate = passthrough_attr('endDate')
    versionName = passthrough_attr('versionName')
    parentVersion = passthrough_attr('parentVersion')
    description = passthrough_attr('description')
    priority = passthrough_attr('priority')
    versionExists = passthrough_attr('versionExists')
    currentSteps = passthrough_attr('currentSteps')
    hasAOI = passthrough_attr('hasAOI')
    notes = passthrough_attr('notes')
    hasLOI = passthrough_attr('hasLOI')

    def save(self):
        """Job.save()

           Saves any changes made to the job back to the Workflow Manager
           database."""
        return convertArcObjectToPythonObject(self._arc_object.save(*gp_fixargs((), True)))

    def getPendingDays(self, consider_holds):
        """Job.getPendingDays(consider_hold)

           Returns the number of days that the job has been pending. This can
           also optionally consider the holds and subtract them from the number
           of days the job was pending.

             consider_hold(Boolean):
           Flag to determine whether to consider the holds when calculating the
           number of pending days."""
        return convertArcObjectToPythonObject(self._arc_object.getPendingDays(*gp_fixargs((consider_holds,), True)))

    def setDataWorkspace(self, data_workspace_id):
        """Job.setDataWorkspace(data_workspace_id)

           Sets the data workspace for the job.

             data_workspace_id(String):
           The GUID of the data workspace to be made active for the job."""
        return convertArcObjectToPythonObject(self._arc_object.setDataWorkspace(*gp_fixargs((data_workspace_id,), False)))

    def setAOI(self, aoi):
        """Job.setAOI(aoi)

           Sets the area of interest (AOI) polygon for the job.

           This method has been deprecated. Use setLOI instead.

             aoi(Geometry):
           The AOI polygon to be assigned to the job."""
        return convertArcObjectToPythonObject(self._arc_object.setAOI(*gp_fixargs((aoi,), False)))

    def setLOI(self, loi):
        """Job.setLOI(loi)

           Sets the location of interest (LOI) for the job. The LOI can be
           either a point (POI) or polygon (AOI).

             loi(Geometry):
           The point or polygon to be assigned as the location of interest for
           the job."""
        return convertArcObjectToPythonObject(self._arc_object.setLOI(*gp_fixargs((loi,), False)))

    def listExtendedProperties(self):
        """Job.listExtendedProperties()

           Lists the fully qualified name of all extended property and linked
           property tables associated with the job."""
        return convertArcObjectToPythonObject(self._arc_object.listExtendedProperties(*gp_fixargs((), True)))

    def getExtendedPropertyTable(self, tableName):
        """Job.getExtendedPropertyTable(tableName)

           Returns a single extended property table based on its fully qualified
           table name.

             tableName(String):
           The fully qualified table
           name of the extended property table to be returned."""
        return convertArcObjectToPythonObject(self._arc_object.getExtendedPropertyTable(*gp_fixargs((tableName,), True)))

    def __repr__(self):
        return convertArcObjectToPythonObject(self._arc_object.__repr__(*gp_fixargs((), True)))

    def executeStep(self, step_id=0, callback=None):
        """Job.executeStep({step_id}, {callback})

           Executes a step in the workflow.

             step_id{Integer}:
           The ID of the step to be executed. The step ID is optional; if a step
           ID is not provided, the current step will be executed.

             callback{Function}:
           The callback argument passes a function that prompts the user for a
           response based on input from the step type. When executing a question
           step, for example, the callback takes the possible step response
           options and allows the user to choose the next step. It is also used
           when the next step in the workflow cannot be determined so a user can
           select the path to follow."""
        return convertArcObjectToPythonObject(self._arc_object.executeStep(*gp_fixargs((step_id, callback), True)))

    def markStepAsComplete(self, step_id=0, callback=None):
        """Job.markStepAsComplete({step_id}, {callback})

           Marks a step in the workflow as complete.

             step_id{Integer}:
           The ID of the step to be marked as complete.
           The step ID is optional; if a step ID is not provided, the current
           step will be executed.

             callback{Function}:
           The callback argument passes a function that prompts the user for a
           response based on input from the step type. When marking a question
           step complete, for example, the callback takes the possible step
           response options and allows the user to choose the next step. It is
           also used when the next step in the workflow cannot be determined so
           a user can select the path to follow."""
        return convertArcObjectToPythonObject(self._arc_object.markStepAsComplete(*gp_fixargs((step_id,callback), True)))

    def setStepAsCurrent(self, step_id):
        """Job.setStepAsCurrent(step_id)

           Sets a step in the workflow as the current active step.

             step_id(Integer):
           The ID of the step to be set as the current step."""
        return convertArcObjectToPythonObject(self._arc_object.setStepAsCurrent(*gp_fixargs((step_id,), True)))

    def getWorkflow(self):
        """Job.getWorkflow(jobID)

           Returns a job's Workflow using the job ID.

             jobID(Integer):
           The ID of the job."""
        workflowDict = self._arc_object.getWorkflow(*gp_fixargs((), True))
        if not(workflowDict):
            return None
        return Workflow(workflowDict)

    def getAttachments(self):
        """Job.getAttachments()

           Returns all attachments associated with the job as  a list of
           Attachment objects."""
        return [Attachment(x) for x in self._arc_object.getAttachments(*gp_fixargs((), True))]

    def addAttachment(self, storage_type, source_location):
        """Job.addAttachment(storage_type, source_location)

           Adds an attachment to the job.

             storage_type(String):
           The type of attachment to be added.

            * EMBEDDED: The file is stored in the Workflow Manager database.

            * LINKED: The link to the file path is stored in the Workflow
            Manager database.

            * URL: The URL link is stored in the database.

             source_location(String):
           The file path or URL for the attachment to be added."""
        return convertArcObjectToPythonObject(self._arc_object.addAttachment(*gp_fixargs((storage_type, source_location), True)))

    def deleteAttachment(self, attachment_id):
        """Job.deleteAttachment(attachment_id)

           Deletes an attachment associated with the job.

             attachment_id(Integer):
           The ID of the attachment to be deleted."""
        return convertArcObjectToPythonObject(self._arc_object.deleteAttachment(*gp_fixargs((attachment_id,), True)))

    def retrieveAttachment(self, attachment_id, destination_location):
        """Job.retrieveAttachment(attachment_id, destination_location)

           Retrieves the file attachments
           associated with the job to a location on disk.

             attachment_id(Integer):
           The ID of the attachment to be retrieved.

             destination_location(String):
           The folder location where the attachment will be stored. A name for
           the file to be saved with or without the file extension can also be
           provided. If no name is provided, the attachment is saved with the
           default name stored with the job."""
        return convertArcObjectToPythonObject(self._arc_object.retrieveAttachment(*gp_fixargs((attachment_id, destination_location), True)))

    def getHolds(self):
        """Job.getHolds()

           Returns the holds associated with the job as a  list of Hold objects."""
        return convertArcObjectToPythonObject(self._arc_object.getHolds(*gp_fixargs((), True)))

    def releaseHold(self, hold, comment=None):
        """Job.releaseHold(hold, {comment})

           Releases the hold associated with a job and marks it as an inactive
           hold.

             hold(Hold):
           The hold to be released provided as a Hold object.

             comment{String}:
           The comment to be stored as a reason for releasing the hold."""
        return convertArcObjectToPythonObject(self._arc_object.releaseHold(*gp_fixargs((hold, comment), True)))

    def addHold(self, hold_type_id, comment=None):
        """Job.addHold(hold_type_id, {comment})

           Adds a hold to
           a job to suspend job activity.

             hold_type_id(Integer):
           The ID of the hold type template to be used to create the job hold.

             comment{String}:
           The comment to be stored as a reason for adding the hold."""
        return convertArcObjectToPythonObject(self._arc_object.addHold(*gp_fixargs((hold_type_id, comment), True)))

    def addDependency(self, depends_on_job_id, held_on_type="STEP", held_on_value=0, dependent_on_type="STATUS", dependent_on_value="CLOSED"):
        """Job.addDependency(depends_on_job_id, {held_on_type}, {held_on_value},
           {dependent_on_type}, {dependent_on_value})

           Adds a dependency to
           a job to restrict progression of the job past a certain point until
           another job has progressed past a given point.

             depends_on_job_id(Integer):
           ID of the job on which the current job will depend.

             held_on_type{String}:
           Indicates whether the current job (to which the dependency is being
           added) will be held at a step or status.
           When the job is held at a step, the step cannot be executed until the
           dependency is released. When the job is held at a status, the job's
           status cannot change until the dependency is released. The dependency
           is released when the other job reaches the step or status as defined
           in the dependency criteria.

             held_on_value{Variant}:
           The value of the step or status at which the current job will be
           held. This value can be the  ID of a step as an integer or job status
           as a string.

             dependent_on_type{String}:
           Indicates whether the current job (to which the dependency is being
           added) will be dependent on a step or status of the other job.

           When the dependent job is held at a step or status of the other job,
           the dependent job cannot progress until the other job reaches the
           step or status defined in the dependency. Once the other job reaches
           step or status as defined in the dependency criteria the dependency
           is released and the dependent job can progress.

             dependent_on_value{Variant}:
           The value of the step or status of the other job on which the current
           job will be dependent. This value can be the  ID of a step as an
           integer or job status as a string."""
        return convertArcObjectToPythonObject(self._arc_object.addDependency(*gp_fixargs((depends_on_job_id, held_on_type, held_on_value, dependent_on_type, dependent_on_value), True)))

    def logActivity(self, activity_type, message=None):
        """Job.logActivity(activity_type, {message})

           Logs an activity in the job history to describe an action on the job.

             activity_type(String):
           The
           ID or the name of an ActivityType .

             message{String}:
           The custom message to be appended to the existing message in the
           ActivityType ."""
        return convertArcObjectToPythonObject(self._arc_object.logActivity(*gp_fixargs((activity_type, message), True)))

    def sendNotification(self, notification_type):
        """Job.sendNotification(notification_type)

           Sends a notification based on an event in the job life cycle.

             notification_type(String):
           The name of the notification type template to be used to send the
           email notification associated with the job."""
        return convertArcObjectToPythonObject(self._arc_object.sendNotification(*gp_fixargs((notification_type,), True)))

    def retrieveJobMap(self, destination_location):
        """Job.retrieveJobMap(destination_location)

           Retrieves the job map to a location on disk.

             destination_location(String):
           The folder location where the job map will be stored. A name for the
           map to be saved can also be provided. If no name is provided the job
           map is saved with the default naming scheme defined for the job map."""
        return convertArcObjectToPythonObject(self._arc_object.retrieveJobMap(*gp_fixargs((destination_location,), True)))

    def storeJobMap(self, source_location):
        """Job.storeJobMap(source_location)

           Saves a map in the Workflow Manager database and associates it to the
           job as the job map to be used for editing.

             source_location(String):
           The file path that has the map to be stored in the Workflow Manager
           database."""
        return convertArcObjectToPythonObject(self._arc_object.storeJobMap(*gp_fixargs((source_location,), True)))

    def deleteJobMap(self):
        """Job.deleteJobMap()

           Deletes the job map associated with the job."""
        return convertArcObjectToPythonObject(self._arc_object.deleteJobMap(*gp_fixargs((), True)))

class LinkedProperty(ExtendedProperty):
    """ArcPy class that provides access to the group of linked property rows
       associated with the job. It is comprised of 0 or more ExtendedProperty
       objects."""
    def createRecord(self):
        """LinkedProperty.createRecord()

           Creates a new linked property record associated with the job, as an
           ExtendedProperty object."""
        return convertArcObjectToPythonObject(self._arc_object.createRecord(*gp_fixargs((), True)))

    def deleteRecord(self, record):
        """LinkedProperty.deleteRecord(record)

           Deletes one linked property record associated with the job.

             record(ExtendedProperty):
           The linked property record as an ExtendedProperty object."""
        return convertArcObjectToPythonObject(self._arc_object.deleteRecord(*gp_fixargs((record,), True)))

    def __getitem__(self, *args):
        return convertArcObjectToPythonObject(self._arc_object.__getitem__(*gp_fixargs((args), True)))

    def __len__(self, *args):
        return convertArcObjectToPythonObject(self._arc_object.__len__(*gp_fixargs((args), True)))

    def __iter__(self):
        for x in self._arc_object:
            yield convertArcObjectToPythonObject(x)

class Hold(_ObjectWithoutInitCall):
    """The Hold object provides access to the
       hold associated with the job."""
    ID = passthrough_attr('ID')
    type = passthrough_attr('type')
    typeID = passthrough_attr('typeID')
    comment = passthrough_attr('comment')
    active = passthrough_attr('active')
    holdDate = passthrough_attr('holdDate')
    releasedBy = passthrough_attr('releasedBy')
    releaseDate = passthrough_attr('releaseDate')

class WorkflowStep(_ObjectWithoutInitCall):
    """The WorkflowStep object provides access to the attributes of a step
       contained within a
       job Workflow ."""
    ID = passthrough_attr('ID')
    name = passthrough_attr('name')
    nextSteps = passthrough_attr('nextSteps')

    def __repr__(self):
        return "Workflow Step %i (%s)" % (self.ID, self.name)

class WorkflowPath(_ObjectWithoutInitCall):
    """The WorkflowPath object provides access to the attributes of a  path
       contained within a
       job Workflow ."""
    fromStep = passthrough_attr('fromStep')
    toStep = passthrough_attr('toStep')
    description = passthrough_attr('description')

    def __repr__(self):
        return "Workflow Path %i -> %i" % (self.fromStep, self.toStep)

class WorkflowConnection(_ObjectWithoutInitCall):
    """The WorkflowConnection object provides access to methods for creating or
       getting a Workflow Manager job."""
    def getJob(self, jobID):
        """WorkflowConnection.getJob(jobID)

           Return a single job using its job ID.

             jobID(Integer):
           The ID of the job to return."""
        return convertArcObjectToPythonObject(self._arc_object.getJob(*gp_fixargs((jobID,), True)))

    def createJob(self, job_type_id=-1, job_type_name=None, job_type_description=None, callback=None):
        """WorkflowConnection.createJob({job_type_id}, {job_type_name},
           {job_type_description}, {callback})

           Creates a new job based on a job type.

             job_type_id{Integer}:
           The ID of the job type from which to create a new job.

             job_type_name{String}:
           The name of the job type from which to create a new job.

             job_type_description{JobTypeDescription}:
           The properties of the job type that can be customized and assigned to
           a new job being
           created, provided as the JobTypeDescription object.

             callback{Function}:
           The callback argument is used when the job is set to automatically
           execute after being created. It passes a function that prompts the
           user for a response based on input from the step type. When executing
           a question step, for example, the callback takes the possible step
           response options and allows the user to choose the next step. It is
           also used when the next step in the workflow cannot be determined so
           a user can select the path to follow."""
        if type(job_type_description) == JobTypeDescription:
            # Unwrapped the wrapped class back to it's underlying dictionary
            job_type_description = job_type_description.data
        return convertArcObjectToPythonObject(self._arc_object.createJob(**{'job_type_id': job_type_id, 'job_type_name': job_type_name, 'job_type_description' : job_type_description, 'callback':callback}))

    def createSD(self, output_directory, service_name, connection_file_path = None, folder_name = None, description = None, mininstances = 1, maxinstances = 2, maxusagetime = 600, maxwaittime = 60, maxidletime = 1800):
        """WorkflowConnection.createSD(output_directory, service_name,
           {connection_file_path}, {folder_name}, {description}, {mininstances},
           {maxinstances}, {maxusagetime}, {maxwaittime}, {maxidletime})

           Creates a Service Definition ( .sd ) file of the Workflow Manager
           service type that can be published to a specified GIS server.

             output_directory(String):
           The folder path for the  the output ( .sd ) file.

             service_name(String):
           The name of the service. The name can only contain alphanumeric
           characters and underscores. The name cannot be more than 120
           characters in length.

             connection_file_path{String}:
           The path and file name of the ArcGIS Server connection file ( .ags ).

             folder_name{String}:
           The folder name to which to publish the service definition. If the
           folder does not currently exist, it will be created. The default
           folder is the server root level.

             description{String}:
           The description summary.

             mininstances{Integer}:
           The minimum number of instances a service will start and make
           available for use.

             maxinstances{Integer}:
           The maximum number of instances a service can start and make
           available for use.

             maxusagetime{Integer}:
           The maximum time, in seconds, that a service can be used. For
           expected  long running tasks increase the default time.

             maxwaittime{Integer}:
           The maximum time, in seconds, that a client will wait to connect with
           an instance before timing out. When all instances are busy processing
           requests, subsequent requests are queued. If this time-out elapses
           before an instance becomes available the task will fail.

             maxidletime{Integer}:
           The maximum time, in seconds, that an instance will continue to be
           active before pool shrinking occurs. Any instances above the minimum
           number of instances that have not been used will be shut down once
           the idle maximum time value has elapsed."""
        return convertArcObjectToPythonObject(self._arc_object.createSD(*gp_fixargs((output_directory, service_name, connection_file_path, folder_name, description, mininstances, maxinstances, maxusagetime, maxwaittime, maxidletime), True)))

    def queryJobs(self, fields, tables, aliases=None, where=None, order_by=None):
        """WorkflowConnection.queryJobs(fields, tables, {aliases}, {where},
           {order_by})

           Queries jobs based on criteria and returns a QueryResult object then
           allows access to a list of jobs and job properties  that meet the
           criteria.

             fields(String):
           Fields from  the query table(s) to be returned
           for the jobs that meet the criteria.

             tables(String):
           Tables in the Workflow Manager database used to query jobs.

             aliases{String}:
           Alias names defined by the user for the returned fields. The alias
           names are listed in the same order as the corresponding fields.

             where{String}:
           A where clause used to query jobs.

             order_by{String}:
           The fields used to order the query results."""
        return QueryResult(self._arc_object.queryJobs(*gp_fixargs((fields, tables, aliases, where, order_by), True)))

    def getQualifiedTableName(self, table_name):
        return convertArcObjectToPythonObject(self._arc_object.getQualifiedTableName(*gp_fixargs((table_name,), True)))

    config = passthrough_attr('config')

    jtcPath = passthrough_attr('jtcPath')


class Configuration(_ObjectWithoutInitCall):
    """The Configuration object provides access to
       the configuration elements in the Workflow Manager database."""
    def getUsers(self):
        """Configuration.getUsers()

           Returns a list of user names of all the users in the Workflow Manager
           database."""
        return convertArcObjectToPythonObject(self._arc_object.getUsers(*gp_fixargs((), True)))

    def getUserGroups(self, username=None):
        """Configuration.getUserGroups({username})

           Returns a list of the name of user groups a user belongs to in the
           Workflow Manager database.
            If no argument is given, the user groups the current user belongs to
            are returned.

             username{String}:
           The username of the user whose user groups will be returned."""
        return convertArcObjectToPythonObject(self._arc_object.getUserGroups(*gp_fixargs((username,), True)))

    def getJobTypes(self):
        """Configuration.getJobTypes()

           Returns a list of all job types  in the Workflow Manager database
           filtered by applied job filters."""
        return [JobType(x) for x in self._arc_object.getJobTypes(*gp_fixargs((), True))]

    def getPrivileges(self, username=None):
        """Configuration.getPrivileges({username})

           Returns a list of privileges assigned to a user. If no argument is
           given, the privileges for the current user are returned.

             username{String}:
           The username of the user whose privileges will be returned."""
        return convertArcObjectToPythonObject(self._arc_object.getPrivileges(*gp_fixargs((username,), True)))

    def getPriorities(self):
        """Configuration.getPriorities()

           Returns a list of priorities in the Workflow Manager database."""
        return [Priority(x) for x in self._arc_object.getPriorities(*gp_fixargs((), True))]

    def getStatusTypes(self):
        """Configuration.getStatusTypes()

           Returns all status types in the Workflow Manager database as a list
           of StatusType objects."""
        return [StatusType(x) for x in self._arc_object.getStatusTypes(*gp_fixargs((), True))]

    def getMaps(self):
        """Configuration.getMaps()

           Returns a list of the names of maps in the Workflow Manager database."""
        return convertArcObjectToPythonObject(self._arc_object.getMaps(*gp_fixargs((), True)))

    def retrieveMap(self, map_name, destination_location):
        """Configuration.retrieveMap(map_name, destination_location)

           Retrieves
           a map from the Workflow Manager database to a specified folder.

             map_name(String):
           The name of the  map to be retrieved
           from the Workflow Manager database.

             destination_location(String):
           The folder location where the retrieved map will be saved and the
           name to be used."""
        return convertArcObjectToPythonObject(self._arc_object.retrieveMap(*gp_fixargs((map_name, destination_location), True)))

    def storeMap(self, map_name, source_location, storage_type=None, overwrite=None):
        """Configuration.storeMap(map_name, source_location, {storage_type},
           {overwrite})

           Stores a map in the Workflow Manager database. Only .mxd can be
           stored in the Workflow Manager database.

             map_name(String):
           The name used to store the map in the Workflow Manager database.

             source_location(String):
           The folder location where the map exists, with the name of the map.

             storage_type{String}:
           The storage type of the map. If no value is given, the map is stored
           in the Workflow Manager database by default.

            * EMBEDDED: The map is stored in the Workflow Manager database.

            * LINKED: The link to the map location is stored in the Workflow
            Manager database.

             overwrite{String}:
           Overwrite the map if it exists in the Workflow Manager database. If
           no value is provided, the existing map is not overwritten.

            * True: The map is stored in the Workflow Manager database.

            * False: The link to the map is stored in the Workflow Manager
            database."""
        return convertArcObjectToPythonObject(self._arc_object.storeMap(*gp_fixargs((map_name, source_location, storage_type, overwrite), True)))

    def getJobTypeDescription(self, job_type_id=-1, job_type_name=None):
        """Configuration.getJobTypeDescription({job_type_id}, {job_type_name})

           Returns the
           job type properties that can be customized before creating a job,
           using either the job type id or job type name.

             job_type_id{Integer}:
           The ID of the job type whose properties will be returned.

             job_type_name{String}:
           The name of the job type whose properties will be returned."""
        desc = self._arc_object.getJobTypeDescription(**{'job_type_id': job_type_id, 'job_type_name': job_type_name})
        if desc:
            return JobTypeDescription(desc)

    def getHoldTypes(self):
        """Configuration.getHoldTypes()

           Returns all the hold types in the Workflow Manager database, as a
           list of HoldType objects."""
        return [HoldType(x) for x in self._arc_object.getHoldTypes(*gp_fixargs((), True))]

    def getActivityTypes(self):
        """Configuration.getActivityTypes()

           Returns all activity types in the Workflow Manager database as a list
           of ActivityType objects."""
        return [ActivityType(x) for x in self._arc_object.getActivityTypes(*gp_fixargs((), True))]

    def getNotificationTypes(self):
        """Configuration.getNotificationTypes()

           Returns a list of all the notification types in the Workflow Manager
           database."""
        return convertArcObjectToPythonObject(self._arc_object.getNotificationTypes(*gp_fixargs((), True)))

class WorkflowExecutionResult(_ObjectWithoutInitCall):
    """The WorkflowExecutionResult object provides the  result of executing a
       step in the workflow."""
    returnCode = passthrough_attr('returnCode')
    #finished = passthrough_attr('finished')
    #def finishStep(self, callback=None):
    #    return convertArcObjectToPythonObject(self._arc_object.finishStep(callback))

__all__ = ['Connect','WorkflowExecutionError', 'WorkflowExecutionStepError']

for (k, v) in [("ExtendedProperty object", ExtendedProperty),
               ("ExtendedPropertyValue object", ExtendedPropertyValue),
               ("Configuration object", Configuration),
               ("Job object", Job),
               ("LinkedProperty object", LinkedProperty),
               ("Hold object", Hold),
               ("WorkflowStep object", WorkflowStep),
               ("WorkflowPath object", WorkflowPath),
               ("WorkflowConnection object", WorkflowConnection),
               ("WorkflowExecutionResult object", WorkflowExecutionResult)]:
    arcobject_to_python_class_mapping[k] = v

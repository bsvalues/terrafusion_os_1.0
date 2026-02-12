import sys
import os
import math
import arcpy
import json
import time
import locale
import requests
from dateutil.relativedelta import relativedelta as rd
from datetime import datetime as dt
from datetime import date as dy
from datetime import timedelta as td
from datetime import time as tm
from datetime import timezone
locale.setlocale(locale.LC_ALL, '')

#region Common Functions for Tool Dialog and Parameter Messaging

class MsgType:
    INF = "INFORMATIVE"
    WRN = "WARNING"
    ERR = "ERROR"

class Message:
    def __init__(self, msgID, msgType):
        self.msgID = msgID
        self.msgType = msgType


def printMessage(msgObj, messageVar1=None, messageVar2=None):
    '''
    Takes a message object and attempts to print translated string from messages.xml
    based on a message ID to the tool dialog menu.

    :param Message msgObj: Message Object using the Message Class
    :param str messageVar1: 1st Optional variable word that will be substituted in the string
    :param str messageVar2: 2nd Optional variable word that will be substituted in the string
    '''
    arcpy.AddIDMessage(msgObj.msgType, msgObj.msgID, messageVar1, messageVar2)
    return

def validationMessage(msgObj,paramObj, messageVar1=None, messageVar2=None):
    '''
    Takes a message object and attempts to print translated string from messages.xml
    based on a message ID to the parameter tooltip of a parameter.

    :param Message msgObj: Message Object using the Message Class
    :param arcpy.Parameter() paramObj: ArcPy Parameter object
    :param str messageVar1: 1st Optional variable word that will be substituted in the string
    :param str messageVar2: 2nd Optional variable word that will be substituted in the string
    '''
    paramObj.setIDMessage(msgObj.msgType,msgObj.msgID,messageVar1, messageVar2)
    return

def retrieveMessage(msgObj, messageVar1=None, messageVar2=None):
    '''
    Takes a message object and attempts to retrieve the translated string from messages.xml
    based on a message ID to be used at developers discretion to display in tool's Progressor
    label or as part of larger strings.

    :param Message msgObj: Message Object using the Message Class
    :param str messageVar1: 1st Optional variable word that will be substituted in the string
    :param str messageVar2: 2nd Optional variable word that will be substituted in the string
    :return: the message
    :rtype: str
    '''
    message = arcpy.GetIDMessage(msgObj.msgID)
    message = message.replace("%1","{0}")
    message = message.replace("%2","{1}")
    message = message.format(messageVar1, messageVar2)
    return message

def requireParameter(param):
    '''
    Takes a parameter with a parameterType == "Optional" and forces it to be required
    
    :param arcpy.Parameter() param: ArcPy Parameter object
    '''
    crm = Message(735, MsgType.ERR)
    validationMessage(crm,param,param.name)

def setInformativeMessage(param, message):
    param.setIDMessage(MsgType.WRN, 230001, message)

#endregion Common Functions for Tool Dialog and Parameter Messaging

#region Setting Output names for tools
def set_output_name(inFeaturesParam, outNameExt):
    '''
    Based on name of an input parameter will provide back a unique name for an output feature

    :param arcpy.Parameter() inFeaturesParam: input parameter object
    :param str outNameText: portion of name to add to the end of the input feature parameter that
    helps describe which tool it is (Example: IncidentSequence)
    :return: Valid output name
    :rtype: str
    '''
    try:
        desc = arcpy.Describe(inFeaturesParam.value)
        originTableName = desc.name
        if hasattr (desc, 'nameString'):
            originTableName = desc.nameString
        validName = arcpy.ValidateTableName(originTableName + "_" + outNameExt)
        uniqueName = arcpy.CreateUniqueName(validName)
        return uniqueName
    except:
        pass


def validate_output_name(outFeaturesParam):
    '''
    Validates output name for a feature class

    :param arcpy.Parameter() outFeaturesParam: input parameter object
    :return: Valid output path and name
    :rtype: str
    '''
    try:
        fcName = os.path.basename(outFeaturesParam.valueAsText)
        workspace = os.path.dirname(outFeaturesParam.valueAsText)
        if fcName[-4:] == ".shp":
            fcName = fcName[:-4]
        validfcName = arcpy.ValidateTableName(fcName, workspace)
        return os.path.join(workspace, validfcName)
    except:
        pass
#endregion

#region Functions shared by multiple tools
def generateUniqueFieldName(fieldList, candidateName):
    if candidateName not in fieldList:
        return candidateName
    else:
        for x in range(1,1000):
            newname = candidateName + "_{}".format(x)
            if newname not in fieldList:
                return newname

def matchField(fieldName, fieldList):
    compareList = {fld.lower(): fld for fld in fieldList}
    if fieldName.lower() in compareList:
        return compareList[fieldName.lower()]
    else:
        return None

def convert_to_seconds(val, unit):
    if unit.lower() == 'minutes':
        return val * 60
    elif unit.lower() == 'hours':
        return val * 60 * 60
    elif unit.lower() == 'days':
        return val * 60 * 60 * 24
    elif unit.lower() == 'weeks':
        return val * 60 * 60 * 24 * 7
    else:
        return val

def _handleIDs(fields_desc, inputDict, row):
    
    id_values = []

    #Other ID Types in order of priority
    comboIDVals = [row[inputDict[idType]] for idType in fields_desc.keys() if idType in inputDict]

    #Clean off '.0' for ID fields in original table formatted as doubles
    comboIDVals = [str(val).replace('.0','') if str(val)[-2:] == '.0' else str(val) for val in comboIDVals]

    if 'UNIQUE_ID' in inputDict:
        uniqueid_val = row[inputDict['UNIQUE_ID']]
        if comboIDVals:
            id_values.extend([uniqueid_val] + comboIDVals)
        else:
            id_values.append(uniqueid_val)
    else:
        #Generate a Unique ID based on other identifiers
        uniqueid_val = "".join([val for val in comboIDVals if val not in ['None', None, '',""]])
        id_values.extend([uniqueid_val] + comboIDVals)

    return id_values

def get_field_object_by_name(field_name, feature_class):
    if not field_name or not feature_class:
        return None
    fields = arcpy.ListFields(feature_class, field_name)
    field_list = [field for field in fields if field.name.lower() == field_name.lower()]
    if field_list:
        return field_list[0]
    else:
        return None

def _default_field(fields, candidates, secondary_candidates):
    # best default names
    for i in candidates:
        for f in fields:
            if i == f.name.lower() or i == f.aliasName.lower():
                return f.name

    # second best default
    for i in candidates + secondary_candidates:
        for f in fields:
            if f.name.lower().startswith(
                    i) or f.aliasName.lower().startswith(i):
                return f.name
            elif f.name.lower().endswith(i) or f.aliasName.lower().endswith(
                    i):
                return f.name

def _default_x_field(fields):
    """
    pick a field as default for x
    @fields: a set of fields
    return: field name
    """
    return _default_field(fields, ["longitude", "lon", "x"],
                                ["x_", "_x"])

def _default_y_field(fields):
    """
    pick a field as default for y
    @fields: a set of fields
    return: field name
    """
    return _default_field(fields, ["latitude", "lat", "y"],
                                ["y_", "_y"])

def set_auto_xy_fields(fc_param, lon_param, lat_param):
    """
    picks default xy fields in fc if available
    @fc: feature class
    """
    if (fc_param.value and
            not lon_param.altered and
            not lat_param.altered):
        valid_fieldtypes = ['Integer', 'SmallInteger', 'Double', 'Single']
        fields = [f for f in arcpy.ListFields(fc_param.value) if f.type in valid_fieldtypes]

        if not lon_param.value:
            lon_param.value = _default_x_field(fields)

        if not lat_param.value:
            lat_param.value = _default_y_field(fields)

def setup_output_field_map(fms, fs, out_name, out_type, merge_rule):
    fm = arcpy.FieldMap()
    fm.addInputField(fs, out_name)
    fm.mergeRule = merge_rule
    out_field = fm.outputField
    out_field.name = out_name
    out_field.type = out_type
    fm.outputField = out_field
    fms.addFieldMap(fm)

def _isNumeric(val):
    try:
        val + 1
        return True
    except TypeError:
        return False

def convert_locale_str_to_float(val:str):
    """Robust Methodology to Convert to and From Alternative Locale Decimals.
    INPUT:
    val (str): numeric rep of a float
    RETURN:
    value (float): resulting float
    """
    try:
        if _isNumeric(val):
            return float(val)
        else:
            sep = locale.localeconv()['decimal_point']
            sepTypes = [",", "."]
            sepTypes.remove(sep)
            if sep in val:
                return locale.atof(val)
            else:
                if sepTypes[0] in val:
                    newStr = val.replace(sepTypes[0], sep)
                    return locale.atof(newStr)
                else:
                    return float(val)
    except:
        return None


TEMPLATES_PATH = os.path.join(arcpy.GetInstallInfo()["InstallDir"], "Resources", "ArcToolbox", "Templates", "Layers")

#endregion
class Toolbox(object):
    def __init__(self):
        self.label = 'Crime Analysis and Safety Tools'
        self.alias = 'ca'
        self.helpContext = 75
        self.tools = [
            AddDateAttributes,
            SelectLayerByDateAndTime,
            JoinAttributesFromPolygon,
            SummarizeIncidentCount,
            EightyTwentyAnalysis,
            SummarizePercentChange,
            CellSiteRecordsToFeatureClass,
            CellPhoneRecordsToFeatureClass,
            GenerateCallLinks,
            FindSpaceTimeMatches,
            FeatureTo3DByTime,
            GenerateSectorLines,
            UpdateFeaturesWithIncidentRecords
        ]

#region Tool implementation code

class AddDateAttributes(object):
    def __init__(self):
        self.label = 'Add Date Attributes'
        self.canRunInBackground = False
        self.helpContext = 75000002
        self.field_name_dict = {
            "DAY_FULL_NAME": "_DW",
            "DAY_OF_WEEK": "_WD",
            "HOUR": "_HR",
            "MONTH": "_MO",
            "DAY_OF_MONTH": "_DM",
            "YEAR": "_YR"
        }
    def _get_updated_field_name_dict(self,fc,date_field_name,user_dict=None):
        if user_dict:
            field_name_dict = user_dict.copy()
        else:
            field_name_dict = self.field_name_dict.copy()
        try:
            date_field_obj = get_field_object_by_name(date_field_name,fc)
            if date_field_obj.type.upper() == "DATEONLY":
                del_list = ["HOUR"]
            if date_field_obj.type.upper() == "TIMEONLY":
                del_list = ["DAY_FULL_NAME", "DAY_OF_WEEK", "DAY_OF_MONTH", "MONTH", "YEAR"]
            for invalid_calc in del_list:
                if invalid_calc in field_name_dict:
                    del field_name_dict[invalid_calc]

        except:
            # _get_field_object_by_name() will fail if:
            # - the date_field_name selected in the UI does not yet exist
            # - the input feature class selected in the UI does not yet exist
            # This is possible when filling out a model in model builder
            # In this case we just return the standard field dict option and let
            # runtime execution logic handle any invalid options later
            pass
        return field_name_dict

    def getParameterInfo(self):
        # Input_Features
        param_1 = arcpy.Parameter()
        param_1.name = 'in_table'
        param_1.displayName = 'Input Table'
        param_1.parameterType = 'Required'
        param_1.direction = 'Input'
        param_1.datatype = 'GPTableView'

        # Date_Field
        param_2 = arcpy.Parameter()
        param_2.name = 'date_field'
        param_2.displayName = 'Date Field'
        param_2.parameterType = 'Required'
        param_2.direction = 'Input'
        param_2.datatype = 'Field'
        param_2.filter.list = ['DATE', 'DATEONLY', 'TIMEONLY', 'TIMESTAMPOFFSET']
        param_2.parameterDependencies = [param_1.name]

        param_3 = arcpy.Parameter(
            name= "date_attributes",
            displayName= "Date Attributes",
            parameterType= "Optional",
            direction= "Input",
            datatype= "GPValueTable"
        )
        param_3.columns= [['GPString','Output Time Format'],['GPString', 'Output Field Name']]
        param_3.filters[0].type = "ValueList"
        param_3.filters[0].list = ["DAY_FULL_NAME", "DAY_OF_WEEK", "HOUR", "MONTH", "DAY_OF_MONTH", "YEAR"]

        param_4 = arcpy.Parameter()
        param_4.name = 'out_table'
        param_4.displayName = 'Updated Input Table'
        param_4.parameterType = 'Derived'
        param_4.direction = 'Output'
        param_4.datatype = 'GPTableView'
        param_4.parameterDependencies = [param_1.name]

        return [param_1, param_2, param_3, param_4]
    def isLicensed(self):
        return True
    def updateParameters(self, parameters):
        input_table = parameters[0]
        date_field = parameters[1]
        date_attributes = parameters[2]

        if input_table.valueAsText and date_field.valueAsText and not date_field.hasBeenValidated and not date_attributes.values:
            field_names = self._get_updated_field_name_dict(input_table.valueAsText,date_field.valueAsText)
            workspace = arcpy.Describe(input_table.valueAsText).path
            values = []
            for k,v in field_names.items():
                candidate_name = arcpy.ValidateFieldName(date_field.valueAsText + v, workspace)
                if candidate_name != date_field.valueAsText + v:
                    candidate_name = arcpy.ValidateFieldName(date_field.valueAsText[:-3] + v, workspace)
                values.append([k, candidate_name])

            date_attributes.values = values

        return
    def updateMessages(self, parameters):
        input_table = parameters[0]
        date_field = parameters[1]
        date_attributes = parameters[2]

        e1 = Message(210048,MsgType.ERR)

        if date_field.valueAsText and input_table.valueAsText and date_attributes.values and not date_attributes.hasBeenValidated:
            allowed_attributes = list(self._get_updated_field_name_dict(input_table.valueAsText,date_field.valueAsText).keys())
            current_attributes = [val[0] for val in date_attributes.values]
            list_diff = list(set(current_attributes) - set(allowed_attributes))

            if len(list_diff) > 0:
                validationMessage(e1, date_attributes, ",".join(allowed_attributes))
            else:
                date_attributes.clearMessage()

        return
    def execute(self, parameters, messages):
        input_table = parameters[0].valueAsText
        date_field = parameters[1].valueAsText
        date_attributes = parameters[2]

        workspace = arcpy.Describe(input_table).path

        #MESSAGES
        m1 = Message(210002, MsgType.INF)
        m2 = Message(210001, MsgType.INF)

        w1 = Message(1097, MsgType.WRN)
        w2 = Message(304, MsgType.WRN)

        if date_attributes.values:
            # User supplied own output field names
            input_user_dict = {val[0]:val[1] for val in date_attributes.values}
            outDict = self._get_updated_field_name_dict(input_table,date_field,user_dict=input_user_dict)
            for k,v in outDict.items():
                candidate_name = arcpy.ValidateFieldName(v, workspace)
                if candidate_name != v:
                    printMessage(w2, v, candidate_name)
                    outDict[k] = candidate_name

        else:
            # Provide default names
            outDict = {}
            field_names = self._get_updated_field_name_dict(input_table,date_field)
            for k,v in field_names.items():
                candidate_name = arcpy.ValidateFieldName(date_field + v, workspace)
                if candidate_name != date_field + v:
                    candidate_name = arcpy.ValidateFieldName(date_field[:-3] + v, workspace)
                outDict.update({k: candidate_name})

        fcDesc = arcpy.Describe(input_table)

        currentFields = [field.name for field in fcDesc.fields]

        process_date_type = [field.type for field in fcDesc.fields if field.name == date_field][0].upper()

        def setup_field_processing(current_fields,output_dict, date_field, date_type):
            field_descriptions = []
            field_calcs = []
            field_overwrites = []
            weekday_field_length = max([len(dt(year=2018,month=6,day=x).strftime('%A')) for x in range(23,30)])

            if date_type == "DATE":
                field_part = "!{}!" # original date field come in as date format so no preprocessing needed
            elif date_type == "TIMESTAMPOFFSET":
                field_part = "datetime.datetime.fromisoformat(!{}!)" # all other date field types come in as isostring format so we do a conversion
            elif date_type == "DATEONLY":
                field_part = "datetime.date.fromisoformat(!{}!)"
            else: # TIMEONLY field
                field_part = "datetime.time.fromisoformat(!{}!)"

            field_infos = {
                'DAY_FULL_NAME' : {"field_description":["TEXT", "", weekday_field_length],"field_calc": f"{field_part}.strftime('%A')"},
                'DAY_OF_WEEK' : {"field_description":["LONG"],"field_calc": f"int({field_part}.strftime('%w')) + 1"},
                'HOUR' : {"field_description":["LONG"],"field_calc": f"int({field_part}.strftime('%H'))"},
                'MONTH': {"field_description":["LONG"],"field_calc": f"int({field_part}.strftime('%m'))"},
                'DAY_OF_MONTH': {"field_description":["LONG"],"field_calc": f"int({field_part}.strftime('%d'))"},
                'YEAR': {"field_description":["LONG"],"field_calc": f"int({field_part}.strftime('%Y'))"}
            }

            for key in output_dict:
                field_name = output_dict[key]
                field_calc = [field_name] + [field_infos[key]['field_calc'].format(date_field)]
                field_calcs.append(field_calc)
                if field_name not in current_fields:
                    field_description = [field_name] + field_infos[key]["field_description"]
                    field_descriptions.append(field_description)
                else:
                    field_overwrites.append(field_name)

            return field_descriptions, field_calcs, field_overwrites

        field_descriptions, field_calcs, field_overwrites = setup_field_processing(currentFields, outDict, date_field, process_date_type)
        
        for field_name in field_overwrites:
            printMessage(w1, messageVar1=field_name)

        # If any fields need to be added, add them before calculating values
        if field_descriptions:
            for field_description in field_descriptions:
                field_name = field_description[0]
                printMessage(m1, messageVar1=field_name)
            arcpy.management.AddFields(input_table, field_descriptions)

        for field_calc in field_calcs:
            field_name = field_calc[0]
            printMessage(m2, field_name)

        arcpy.management.CalculateFields(input_table, "PYTHON3", field_calcs)

class SelectLayerByDateAndTime(object):
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""
    def __init__(self):
        self.label = u'Select Layer By Date and Time'
        self.helpContext = 75000006
        self.canRunInBackground = False
    def getParameterInfo(self):

        DATE_CATEGORY = "Select by Date (Options)"
        TIME_CATEGORY = "Select by Time of Day (Options)"
        DOW_CATEGORY = "Select by Day of the Week (Options)"
        MONTH_CATEGORY = "Select by Month (Options)"
        YEAR_CATEGORY = "Select by Year (Options)" 

        # Input_Layer
        param_0 = arcpy.Parameter(
            name = 'in_layer_or_view',
            displayName = 'Input Rows',
            parameterType = 'Required',
            direction = 'Input',
            datatype = ['GPTableView', 'GPFeatureLayer']
        )
        
        # Selection_type
        param_1 = arcpy.Parameter(
            name = 'selection_type',
            displayName = 'Selection Type',
            parameterType = 'Required',
            direction = 'Input',
            datatype = 'GPString'
        )
        param_1.value = 'NEW_SELECTION'
        param_1.filter.list = ['NEW_SELECTION', 'ADD_TO_SELECTION', 'REMOVE_FROM_SELECTION', 'SUBSET_SELECTION']

        # Selection_type
        param_2 = arcpy.Parameter(
            name = 'time_type',
            displayName = 'Time Type',
            parameterType = 'Required',
            direction = 'Input',
            datatype = 'GPString'
        )
        param_2.value = 'SINGLE_TIME_FIELD'
        param_2.filter.list = ['SINGLE_TIME_FIELD', 'TIME_RANGE_FIELDS']

        # Date_Field
        param_3 = arcpy.Parameter(
            name = 'date_field',
            displayName = 'Date Field',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'Field'
        )
        param_3.filter.list = ['DATE', 'DATEONLY', 'TIMEONLY', 'TIMESTAMPOFFSET']
        param_3.parameterDependencies = [param_0.name]

        # Start Date_Field
        param_4 = arcpy.Parameter(
            name = 'start_date_field',
            displayName = 'Start Date Field',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'Field'
        )
        param_4.filter.list = ['DATE', 'DATEONLY', 'TIMEONLY', 'TIMESTAMPOFFSET']
        param_4.parameterDependencies = [param_0.name]

        # End_Date_Field
        param_5 = arcpy.Parameter(
            name = 'end_date_field',
            displayName = 'End Date Field',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'Field'
        )
        param_5.filter.list = ['DATE', 'DATEONLY','TIMEONLY', 'TIMESTAMPOFFSET']
        param_5.parameterDependencies = [param_0.name]

        param_6 = arcpy.Parameter(
            name = "selection_options",
            displayName = "Selection Options",
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'GPString',
            multiValue = True
        )
        param_6.filter.list = ["DATE", "TIME", "DAY_OF_WEEK", "MONTH", "YEAR"]
        param_6.controlCLSID = "{172840BF-D385-4F83-80E8-2AC3B79EB0E0}"

        # Date_Selection_Type
        param_7 = arcpy.Parameter(
            name = 'date_selection_type',
            displayName = 'Date Selection Type',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'GPString',
            category = DATE_CATEGORY
        )
        param_7.filter.list = ['DATE_RANGE', 'SINGLE_DATE', 'RECENCY', 'COMPARATIVE']

        # single_date
        param_8 = arcpy.Parameter(
            name = 'single_date',
            displayName = 'Date',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'GPDate',
            category = DATE_CATEGORY
        )

        # Start_Date
        param_9 = arcpy.Parameter(
            name = 'start_date',
            displayName = 'Start Date',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'GPDate',
            category = DATE_CATEGORY
        )

        # End_Date
        param_10 = arcpy.Parameter(
            name = 'end_date',
            displayName = 'End Date',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'GPDate',
            category = DATE_CATEGORY
        )

        # Use Current System Time as End Time
        param_11 = arcpy.Parameter(
            name = 'use_system_time',
            displayName = 'Use Current System Time as End Time',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'GPBoolean',
            category = DATE_CATEGORY
        )
        param_11.filter.list = ["SYSTEM_TIME", "NO_SYSTEM_TIME"]
        param_11.value = "NO_SYSTEM_TIME"

        # Time_Slice
        param_12 = arcpy.Parameter(
            name = 'time_slice',
            displayName = 'Time Slice',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'GPTimeUnit',
            category = DATE_CATEGORY
        )
        param_12.filter.list = ['Minutes', 'Hours', 'Days', 'Weeks', 'Months', 'Years']

        # Start_Time
        param_13 = arcpy.Parameter(
            name = 'start_time',
            displayName = 'Start Time',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'GPDate',
            category = TIME_CATEGORY
        )

        # End_Time
        param_14 = arcpy.Parameter(
            name = 'end_time',
            displayName = 'End Time',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'GPDate',
            category = TIME_CATEGORY
        )

        # Day_of_Week_Selection_Type
        param_15 = arcpy.Parameter(
            name = 'days_of_week',
            displayName = 'Days of Week',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'GPString',
            multiValue = True,
            category = DOW_CATEGORY
        )
        param_15.filter.list = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
        param_15.controlCLSID = "{172840BF-D385-4F83-80E8-2AC3B79EB0E0}"

        # Month selection type
        param_16 = arcpy.Parameter(
            name = 'months',
            displayName = 'Months',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'GPString',
            multiValue = True,
            category = MONTH_CATEGORY
        )
        param_16.filter.list = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER']
        param_16.controlCLSID = "{172840BF-D385-4F83-80E8-2AC3B79EB0E0}"

        param_17 = arcpy.Parameter(
            name= "years",
            displayName= "Years",
            direction="Input",
            datatype = "GPLong",
            parameterType="Optional",
            multiValue= True,
            category= YEAR_CATEGORY
        )
        param_17.filter.type = "Range"
        param_17.filter.list = [1, 9999]

        # Output_Layer_View
        param_18 = arcpy.Parameter(
            name = 'out_layer_or_view',
            displayName = 'Updated Layer or Table View',
            parameterType = 'Derived',
            direction = 'Output',
            datatype = ['GPTableView', 'GPFeatureLayer']
        )
        param_18.parameterDependencies = [param_0.name]

        # Output_Layer_View
        param_19 = arcpy.Parameter(
            name = 'count',
            displayName = 'Row Count',
            parameterType = 'Derived',
            direction = 'Output',
            datatype = 'GPLong'
        )

        return [param_0, param_1, param_2, param_3, param_4, param_5, param_6, param_7, param_8, param_9, param_10, param_11, param_12, param_13, param_14, param_15, param_16, param_17, param_18, param_19]
    def isLicensed(self):
        return True
    def updateParameters(self, parameters):
        """Modify the values and properties of parameters before internal
        validation is performed. This method is called whenever a parameter
        has been changed."""
        in_features = parameters[0]
        selection_type = parameters[1]
        time_type = parameters[2]
        date_field = parameters[3]
        start_date_field = parameters[4]
        end_date_field = parameters[5]
        selection_options = parameters[6]
        date_selection_type = parameters[7]
        single_date = parameters[8]
        start_date = parameters[9]
        end_date = parameters[10]
        use_system_time = parameters[11]
        time_slice = parameters[12]
        start_time = parameters[13]
        end_time = parameters[14]
        days_of_week = parameters[15]
        months = parameters[16]
        years = parameters[17]
        out_layer_or_view = parameters[18]
        count = parameters[19]

        date_field_display_name = Message(210033, MsgType.INF)
        start_date_field_display_name = Message(210034, MsgType.INF)
        date_display_name = Message(210035, MsgType.INF)
        start_date_display_name = Message(210036, MsgType.INF)

        date_selection_type_dict = {
            "DATE_RANGE": [start_date, end_date],
            "SINGLE_DATE": [single_date],
            "RECENCY": [time_slice, use_system_time],
            "COMPARATIVE": [time_slice, use_system_time]
        }

        selection_options_dict = {
            "DATE": [date_selection_type],
            "TIME": [start_time, end_time],
            "DAY_OF_WEEK": [days_of_week],
            "MONTH": [months],
            "YEAR": [years]
        }

        if time_type.valueAsText == "SINGLE_TIME_FIELD":
            start_date_field.enabled = False
            end_date_field.enabled = False
            date_field.enabled = True
        elif time_type.valueAsText == "TIME_RANGE_FIELDS":
            start_date_field.enabled = True
            end_date_field.enabled = True
            date_field.enabled = False
        else:
            start_date_field.enabled = False
            end_date_field.enabled = False
            date_field.enabled = True

        def _clear_date_selection_type_parameters():
            for params in date_selection_type_dict.values():
                for param in params:
                    param.enabled = False

        def control_date_selection_type_parameters():
            _clear_date_selection_type_parameters()
            try:
                if "DATE" in selection_options.values:
                    for param in date_selection_type_dict[date_selection_type.value]:
                        param.enabled = True
                else:
                    raise Exception
            except:
                _clear_date_selection_type_parameters()

        def setup_time_fields():
            if (not in_features.hasBeenValidated or not time_type.hasBeenValidated) and in_features.value:
                desc = arcpy.Describe(in_features.value)
                if hasattr(desc, 'startTimeField'):
                    if time_type.valueAsText == "SINGLE_TIME_FIELD":
                        if desc.startTimeField and not date_field.altered:
                            date_field.value = desc.startTimeField
                    elif time_type.valueAsText == "TIME_RANGE_FIELDS":
                        if desc.startTimeField and not start_date_field.altered:
                            start_date_field.value = desc.startTimeField
                        if desc.endTimeField and not end_date_field.altered:
                            end_date_field.value = desc.endTimeField
                    else:
                        if desc.startTimeField and not date_field.altered:
                            date_field.value = desc.startTimeField
                
        def setup_selection_options():
            for selection_option, params in selection_options_dict.items():
                for param in params:
                    if selection_options.values:
                        if selection_option in selection_options.values:
                            param.enabled = True
                            if selection_option == "DATE":
                                control_date_selection_type_parameters()
                        else:
                            param.enabled = False
                    else:
                        param.enabled = False

        setup_time_fields()
        control_date_selection_type_parameters()
        setup_selection_options()

        # Hide selection options when input field(s) are TIMEONLY, since only time based queries are possible
        process_date_type = None
        if time_type.valueAsText == "TIME_RANGE_FIELDS" \
            and start_date_field.valueAsText \
            and end_date_field.valueAsText \
            and in_features.valueAsText:
            start_date_type = get_field_object_by_name(start_date_field.valueAsText,in_features.valueAsText).type
            end_date_type = get_field_object_by_name(end_date_field.valueAsText,in_features.valueAsText).type
            if start_date_type == end_date_type:
                process_date_type = start_date_type

        if time_type.valueAsText == "SINGLE_TIME_FIELD" \
            and date_field.valueAsText \
            and in_features.valueAsText:
            process_date_type = get_field_object_by_name(date_field.valueAsText,in_features.valueAsText).type

        if process_date_type and process_date_type.upper() == "TIMEONLY":
            selection_options.values = ["TIME"]
            setup_selection_options()
            _clear_date_selection_type_parameters()
            selection_options.enabled = False
        else:
            if selection_options.enabled == False:
                selection_options.values = []
                setup_selection_options()
            selection_options.enabled = True

        if selection_options.values:
            if 'TIME' in selection_options.values:
                if start_time.value:
                    start_time.value = start_time.value.replace(year=1899,month=12,day=30)
                else:
                    start_time.value = '12:00:00 AM'
                if end_time.value:
                    end_time.value = end_time.value.replace(year=1899,month=12,day=30)
                else:
                    end_time.value = '12:00:00 PM'

        if single_date.value and date_selection_type.value == "SINGLE_DATE":
            single_date.value = single_date.value.replace(hour=0,minute=0,second=0,microsecond=0)

        return
        
    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        in_features = parameters[0]
        selection_type = parameters[1]
        time_type = parameters[2]
        date_field = parameters[3]
        start_date_field = parameters[4]
        end_date_field = parameters[5]
        selection_options = parameters[6]
        date_selection_type = parameters[7]
        single_date = parameters[8]
        start_date = parameters[9]
        end_date = parameters[10]
        use_system_time = parameters[11]
        time_slice = parameters[12]
        start_time = parameters[13]
        end_time = parameters[14]
        days_of_week = parameters[15]
        months = parameters[16]
        years = parameters[17]
        out_layer_or_view = parameters[18]
        count = parameters[19]

        e1 = Message(210032, MsgType.ERR)
        e2 = Message(210044, MsgType.ERR)
        e3 = Message(210047, MsgType.ERR)
        w1 = Message(210045, MsgType.WRN)
        w2 = Message(210046, MsgType.WRN)

        date_selection_type_dict = {
            "DATE_RANGE": [start_date, end_date],
            "SINGLE_DATE": [single_date],
            "RECENCY": [time_slice],
            "COMPARATIVE": [time_slice]
        }

        selection_options_dict = {
            "DATE": [date_selection_type],
            "TIME": [start_time, end_time],
            "DAY_OF_WEEK": [days_of_week],
            "MONTH": [months],
            "YEAR": [years]
        }

        if time_type.valueAsText == "SINGLE_TIME_FIELD":
            start_date_field.clearMessage()
            end_date_field.clearMessage()
            if not date_field.value:
                requireParameter(date_field)
        elif time_type.valueAsText == "TIME_RANGE_FIELDS":
            if not start_date_field.value:
                requireParameter(start_date_field)
            if not end_date_field.value:
                requireParameter(end_date_field)
            date_field.clearMessage()
        else:
            start_date_field.clearMessage()
            end_date_field.clearMessage()
            if not date_field.value:
                requireParameter(date_field)

        def _clear_date_selection_type_parameters():
            for params in date_selection_type_dict.values():
                for param in params:
                    param.clearMessage()

        def control_date_selection_type_parameters():
            _clear_date_selection_type_parameters()
            try:
                if "DATE" in selection_options.values:
                    for param in date_selection_type_dict[date_selection_type.value]:
                        if not param.value:
                            requireParameter(param)
                else:
                    raise Exception
            except:
                _clear_date_selection_type_parameters()

        control_date_selection_type_parameters()

        for selection_option, params in selection_options_dict.items():
            for param in params:
                if selection_options.values:
                    if selection_option in selection_options.values:
                        if not param.value:
                            requireParameter(param)
                        if selection_option == "DATE":
                            control_date_selection_type_parameters()
                    else:
                        param.clearMessage()
                else:
                    param.clearMessage()

        if start_date.value and end_date.value:
            if start_date.value.date() == end_date.value.date():
                validationMessage(e1,start_date)
                validationMessage(e1,end_date)

        process_date_type = None
        if time_type.valueAsText == "TIME_RANGE_FIELDS" \
            and start_date_field.valueAsText \
            and end_date_field.valueAsText \
            and in_features.valueAsText:
            start_date_type = get_field_object_by_name(start_date_field.valueAsText,in_features.valueAsText).type
            end_date_type = get_field_object_by_name(end_date_field.valueAsText,in_features.valueAsText).type
            if start_date_type != end_date_type:
                validationMessage(e2,start_date_field,start_date_type,end_date_type)
                validationMessage(e2,end_date_field,start_date_type,end_date_type)
            else:
                start_date_field.clearMessage()
                end_date_field.clearMessage()
                process_date_type = start_date_type

        if time_type.valueAsText == "SINGLE_TIME_FIELD" \
            and date_field.valueAsText \
            and in_features.valueAsText:
            process_date_type = get_field_object_by_name(date_field.valueAsText,in_features.valueAsText).type

        if process_date_type and selection_options.values:
            if process_date_type.upper() == "TIMEONLY":
                invalid_selection_options = ["DAY_OF_WEEK", "DATE", "MONTH", "YEAR"]
                if any(x in invalid_selection_options for x in selection_options.values):
                    validationMessage(w1,selection_options)
                else:
                    selection_options.clearMessage()
            elif process_date_type.upper() == "DATEONLY":
                if "TIME" in selection_options.values:
                    validationMessage(w2,selection_options)
                else:
                    selection_options.clearMessage()
                if "DATE" in selection_options.values:
                    if date_selection_type.valueAsText in ['RECENCY','COMPARATIVE']:
                        if time_slice.valueAsText and time_slice.valueAsText.split(" ")[1].upper() in ["MINUTES","HOURS"]:
                            validationMessage(e3,time_slice)
                        else:
                            time_slice.clearMessage()
                    else:
                        time_slice.clearMessage()
            else:
                selection_options.clearMessage()

    def execute(self, parameters, messages):
        # -------------------------------------------------------------------------------
        # Purpose:     Select features based on date and time ranges (ex. Last 14 days) or
        #              parts (weekdays, 8-10PM). Requires date and time values to be in date
        #              field.
        #
        # Author:      Ryan Cosby
        #
        # Created:     1/17/2018
        # Copyright:   (c) Esri 2018
        # updated:     3/29/2018
        # -------------------------------------------------------------------------------

        in_features = parameters[0].value
        selection_type = parameters[1].valueAsText
        time_type = parameters[2].valueAsText
        date_field = parameters[3].valueAsText
        start_date_field = parameters[4].valueAsText
        end_date_field = parameters[5].valueAsText
        selection_options = parameters[6].values
        date_selection_type = parameters[7].valueAsText
        single_date_val = parameters[8].value
        start_date = parameters[9].value
        end_date = parameters[10].value
        use_system_time = parameters[11].value
        time_slice = parameters[12].valueAsText
        start_time = parameters[13].value
        end_time = parameters[14].value
        days_of_week = parameters[15].values
        months = parameters[16].values
        years = parameters[17].values
        out_layer_or_view = parameters[18]
        count = parameters[19]

        #Messages
        w1 = Message(2540, MsgType.WRN)

        def subtract_relative_time(inp_time, t_slice, t_unit):
            if t_unit == 'Minutes':
                inp_time -= rd(minutes=t_slice)
            if t_unit == 'Hours':
                inp_time -= rd(hours=t_slice)
            if t_unit == 'Days':
                inp_time -= rd(days=t_slice)
            if t_unit == 'Weeks':
                inp_time -= rd(weeks=t_slice)
            if t_unit == 'Months':
                inp_time -= rd(months=t_slice)
            if t_unit == 'Years':
                inp_time -= rd(years=t_slice)
            return inp_time

        def select_features_by_id(id_list,fLayer,selectionType):
            desc = arcpy.Describe(fLayer)
            d_type = desc.dataType
            try:
                activeMap = arcpy.mp.ArcGISProject("CURRENT").activeMap
                if selectionType == "NEW_SELECTION":
                    fLayer.setSelectionSet(id_list, "NEW")
                if selectionType == "REMOVE_FROM_SELECTION":
                    newIdList = [idNum for idNum in fLayer.getSelectionSet() if idNum not in id_list]
                    fLayer.setSelectionSet(newIdList, "NEW")
                if selectionType == "ADD_TO_SELECTION":
                    fLayer.setSelectionSet(id_list, "UNION")
                if selectionType == "SUBSET_SELECTION":
                    fLayer.setSelectionSet(id_list, "INTERSECT")
                
            except (IndexError, AttributeError, OSError):
                oidFieldName = desc.OIDFieldName
                out_layer_name = desc.baseName
                #Only derive a new layer or table view if inputs are on disk
                if d_type == "Table":
                    fLayer = arcpy.management.MakeTableView(fLayer, out_layer_name)
                if d_type == "FeatureClass":
                    fLayer = arcpy.management.MakeFeatureLayer(fLayer, out_layer_name)
                id_ListChunks = [id_list[i:i + 1000] for i in range(0,len(id_list),1000)]
                if selectionType == "NEW_SELECTION":
                    for index, chunk in enumerate(id_ListChunks):
                        stringList = ','.join(str(idNum) for idNum in chunk)
                        sel_clause = """{} IN ({})""".format(oidFieldName, stringList)
                        if index == 0:
                            arcpy.SelectLayerByAttribute_management(fLayer, "NEW_SELECTION", where_clause=sel_clause)
                        else:
                            arcpy.SelectLayerByAttribute_management(fLayer, "ADD_TO_SELECTION", where_clause=sel_clause)
                if selectionType == "ADD_TO_SELECTION":
                    for chunk in id_ListChunks:
                        stringList = ','.join(str(idNum) for idNum in chunk)
                        sel_clause = """{} IN ({})""".format(oidFieldName, stringList)
                        arcpy.SelectLayerByAttribute_management(fLayer, "ADD_TO_SELECTION", where_clause=sel_clause)
                if selectionType == "REMOVE_FROM_SELECTION":
                    for chunk in id_ListChunks:
                        stringList = ','.join(str(idNum) for idNum in chunk)
                        sel_clause = """{} IN ({})""".format(oidFieldName, stringList)
                        arcpy.SelectLayerByAttribute_management(fLayer, "REMOVE_FROM_SELECTION", where_clause=sel_clause)
                if selectionType == "SUBSET_SELECTION":
                    currentSelection = arcpy.da.Describe(fLayer)['FIDSet']
                    subsetList = list(set(currentSelection) & set(id_list))
                    subsetListChunks = [subsetList[i:i + 10000] for i in range(0,len(subsetList),10000)]
                    for index, chunk in enumerate(subsetListChunks):
                        stringList = ','.join(str(idNum) for idNum in chunk)
                        sel_clause = """{} IN ({})""".format(oidFieldName, stringList)
                        if index == 0:
                            arcpy.SelectLayerByAttribute_management(fLayer, "NEW_SELECTION", where_clause=sel_clause)
                        else:
                            arcpy.SelectLayerByAttribute_management(fLayer, "ADD_TO_SELECTION", where_clause=sel_clause)
            return fLayer

        desc = arcpy.Describe(in_features)

        exit_state = False
        if not selection_options:
            lyr, count = arcpy.management.SelectLayerByAttribute(in_features, selection_type)
            arcpy.SetParameter(19, count)
            exit_state = True
        
        elif hasattr(desc, 'FIDSet'):
            selection_set = desc.FIDSet
            if selection_type == "REMOVE_FROM_SELECTION":
                if not selection_set:
                    printMessage(w1)
                    arcpy.SetParameter(19, 0)

        if not exit_state:
            if time_type == "SINGLE_TIME_FIELD":
                date_fields = [date_field]
            elif time_type == "TIME_RANGE_FIELDS":
                date_fields = [start_date_field, end_date_field]
            else:
                date_fields = [date_field]
            
            # Get the date type of the fields to be processed
            process_date_type = get_field_object_by_name(date_fields[0],in_features).type.upper()

            if process_date_type == "TIMEONLY":
                # Remove any other selection types when the input date field(s) are TIMEONLY fields
                selection_options = ["TIME"]

            if process_date_type == "DATEONLY":
                # Remove the TIME selection option when input field(s) are DATEONLY
                selection_options = [option for option in selection_options if option != "TIME"]

            #Make sure current definition query is honored later on in the search cursor
            where_clause = None
            if hasattr(desc, 'whereClause'):
                where_clause = desc.whereClause

            select_date_id_set = []
            select_time_id_set = []
            select_day_of_week_id_set = []
            select_month_id_set = []
            select_year_id_set = []

            # selection_options ["DATE", "TIME", "DAY_OF_WEEK", "MONTH", "YEAR"]
            # QUERY PARAMETER PREPARATION **********************************************
            if "DATE" in selection_options:
                if date_selection_type in ["RECENCY", "COMPARATIVE"]:
                    time_slice_val = int(time_slice.split(" ")[0])
                    time_unit = time_slice.split(" ")[1]
                if date_selection_type == "DATE_RANGE":
                    if end_date and str(end_date.time()) == "00:00:00":
                        end_date = dt.combine(end_date.date(),tm(23,59,59,999999))
                    start_date = start_date.replace(microsecond=0)
                    if end_date:
                        end_date = end_date.replace(microsecond=0)
                    else:
                        end_date = dt.now().replace(microsecond=0)

                    # Change query parameters depending on input date type
                    if process_date_type == "DATEONLY":
                        start_date = start_date.date()
                        end_date = end_date.date()
                    if process_date_type == "TIMESTAMPOFFSET":
                        start_date = start_date.astimezone()
                        end_date = end_date.astimezone()

            if "TIME" in selection_options:
                start_time = start_time.time().replace(microsecond=0)
                end_time = end_time.time().replace(microsecond=0)
                end_day = tm(23,59,59,0)
                begin_day = tm(0,0,0,0)

            if "DAY_OF_WEEK" in selection_options:
                query_days = []
                if "SUNDAY" in days_of_week:
                    query_days.append(0)
                if "MONDAY" in days_of_week:
                    query_days.append(1)
                if "TUESDAY" in days_of_week:
                    query_days.append(2)
                if "WEDNESDAY" in days_of_week:
                    query_days.append(3)
                if "THURSDAY" in days_of_week:
                    query_days.append(4)
                if "FRIDAY" in days_of_week:
                    query_days.append(5)
                if "SATURDAY" in days_of_week:
                    query_days.append(6)

            if "MONTH" in selection_options:
                query_months = []
                if "JANUARY" in months:
                    query_months.append(1)
                if "FEBRUARY" in months:
                    query_months.append(2)
                if "MARCH" in months:
                    query_months.append(3)
                if "APRIL" in months:
                    query_months.append(4)
                if "MAY" in months:
                    query_months.append(5)
                if "JUNE" in months:
                    query_months.append(6)
                if "JULY" in months:
                    query_months.append(7)
                if "AUGUST" in months:
                    query_months.append(8)
                if "SEPTEMBER" in months:
                    query_months.append(9)
                if "OCTOBER" in months:
                    query_months.append(10)
                if "NOVEMBER" in months:
                    query_months.append(11)
                if "DECEMBER" in months:
                    query_months.append(12)

            if "YEAR" in selection_options:
                query_years = years

            # Sets the end date of the date range when using "By Recency" option
            recency_end = None
            if use_system_time:
                #Current Time
                recency_end = dt.now().replace(microsecond=0)
            else:
                #This Morning
                recency_end = dt.now().replace(hour=0, minute=0, second=0, microsecond=0)

            #Subtract the time unit from the current time stamp if using comparative time stamp
            if "DATE" in selection_options and date_selection_type == "COMPARATIVE":
                recency_end = subtract_relative_time(recency_end, time_slice_val, time_unit)

            if recency_end:
                if process_date_type == "DATEONLY":
                    recency_end = recency_end.date()
                if process_date_type == "TIMESTAMPOFFSET":
                    recency_end = recency_end.astimezone() # Make the datetime aware

            #Get Path to Original Source so Search Cursor Ignores Existing Selection
            layer_path = desc.catalogPath

            with arcpy.da.SearchCursor(layer_path, ["OID@"] + date_fields, where_clause) as date_rows:
                for row in date_rows:
                    if process_date_type in ["DATE", "TIMESTAMPOFFSET"]:
                        rec_dates = [row[x].replace(microsecond=0) for x in range(1,len(date_fields) + 1) if row[x]]
                    else:
                        rec_dates = [row[x] for x in range(1,len(date_fields) + 1) if row[x]]
                    objectID = row[0]
                    
                    #If there are two dates then the input values are a Time Range (begin and end date)
                    if len(rec_dates) == 2:
                        if process_date_type != "TIMEONLY":
                            rec_delta = rec_dates[1] - rec_dates[0]
                        else:
                            # If TIMEONLY inputs then we temporarily add date values so that a datetime.timedelta can be generated
                            # datetime.timedelta can't be generated between two datetime.time objects
                            rec_delta = dt.combine(dt(1984,4,16).date(),rec_dates[1]) - dt.combine(dt(1984,4,16).date(),rec_dates[0])
                        #See here for details: https://stackoverflow.com/questions/325933/determine-whether-two-date-ranges-overlap
                        if "DATE" in selection_options:
                            if date_selection_type in ["DATE_RANGE", "COMPARATIVE", "RECENCY"]:
                                if date_selection_type in ["COMPARATIVE", "RECENCY"]:
                                    start_date = subtract_relative_time(recency_end,time_slice_val,time_unit)
                                    end_date = recency_end
                                if rec_dates[0] <= end_date and rec_dates[1] >= start_date:
                                    select_date_id_set.append(objectID)

                            if date_selection_type == "SINGLE_DATE":
                                if process_date_type == "DATEONLY":
                                    single_date = single_date_val.date()
                                elif process_date_type == "TIMESTAMPOFFSET":
                                    single_date = single_date_val.astimezone()
                                else:
                                    single_date = single_date_val.replace(hour=0,minute=0,second=0,microsecond=0)
                                if rec_dates[0] <= single_date and rec_dates[1] >= single_date:
                                    select_date_id_set.append(objectID)
                                
                                if process_date_type == "DATEONLY":
                                    if rec_dates[0] == single_date or rec_dates[1] == single_date:
                                        select_date_id_set.append(objectID)
                                else:
                                    if rec_dates[0].date() == single_date.date() or rec_dates[1].date() == single_date.date():
                                        select_date_id_set.append(objectID)
                        if "TIME" in selection_options:
                            #If the input start and end date range is greater than 1 days all time slices are covered
                            if rec_delta.days >= 1:
                                select_time_id_set.append(objectID)
                            else:
                                if process_date_type == "TIMEONLY":
                                    rec_time_start = rec_dates[0]
                                    rec_time_end = rec_dates[1]
                                else:
                                    rec_time_start = rec_dates[0].time()
                                    rec_time_end = rec_dates[1].time()
                                if end_time >= start_time:
                                    if rec_time_start <= end_time and rec_time_end >= start_time:
                                        select_time_id_set.append(objectID)
                                    if process_date_type == "TIMEONLY":
                                        if rec_time_end <= rec_time_start:
                                            if start_time <= end_day and end_time >= rec_time_start:
                                                select_time_id_set.append(objectID)
                                            if start_time <= rec_time_end and end_time >= begin_day:
                                                select_time_id_set.append(objectID)

                                else:
                                    if rec_time_end <= end_day and rec_time_start >= start_time:
                                        select_time_id_set.append(objectID)
                                    if rec_time_end <= end_time and rec_time_start >= begin_day:
                                        select_time_id_set.append(objectID)
                                    if rec_time_start <= end_day and rec_time_end >= start_time:
                                        select_time_id_set.append(objectID)
                                    if rec_time_start <= end_time and rec_time_end >= begin_day:
                                        select_time_id_set.append(objectID)
                                    if process_date_type != "TIMEONLY":
                                        if rec_dates[1].date() > rec_dates[0].date():
                                            if rec_time_start <= start_time and rec_time_end >= end_time:
                                                select_time_id_set.append(objectID)
                                    else:
                                        # For Time Only Fields when the Record Start Date is greater than the Record End Date,
                                        # We make an assumption similar to the case above where we'll assume the the end date
                                        # is referring to the next day.
                                        # For example if the record start time in a time only field is 5:06 PM and the record end
                                        # time is 11:27 AM, we'll assume its talking about the period going from one day to next from
                                        # 5:06 PM to 11:27 AM.
                                        if rec_time_end <= rec_time_start:
                                            if rec_time_start <= start_time and rec_time_end >= end_time:
                                                select_time_id_set.append(objectID)
                        if "DAY_OF_WEEK" in selection_options:
                            possible_weekdays = []
                            
                            begin_weekday = int(rec_dates[0].strftime('%w'))
                            end_weekday = int(rec_dates[1].strftime('%w'))
                            possible_weekdays.append(begin_weekday)
                            
                            if end_weekday != begin_weekday:
                                possible_weekdays.append(end_weekday)

                            for x in range(rec_delta.days + 1):
                                possible_weekday = int((rec_dates[0] + td(days=x)).strftime('%w'))
                                if possible_weekday not in possible_weekdays:
                                    possible_weekdays.append(possible_weekday)
                                if len(possible_weekdays) >= 7:
                                    break
                            if any(i in query_days for i in possible_weekdays):
                                select_day_of_week_id_set.append(objectID)
                        if "MONTH" in selection_options:
                            num_months = (rec_dates[1].year - rec_dates[0].year) * 12 + (rec_dates[1].month - rec_dates[0].month)
                            possible_months = []
                            
                            begin_month = int(rec_dates[0].strftime('%m'))
                            end_month = int(rec_dates[1].strftime('%m'))
                            possible_months.append(begin_month)
                            
                            if end_month != begin_month:
                                possible_months.append(end_month)

                            for x in range(num_months + 1):
                                possible_month = int((rec_dates[0] + rd(months=x)).strftime('%m'))
                                if possible_month not in possible_months:
                                    possible_months.append(possible_month)
                                if len(possible_months) >= 12:
                                    break

                            if any(i in query_months for i in possible_months):
                                select_month_id_set.append(objectID)
                        if "YEAR" in selection_options:
                            possible_years = []

                            begin_year = rec_dates[0].year
                            end_year = rec_dates[1].year

                            if begin_year == end_year:
                                possible_years.append(end_year)
                            else:
                                possible_years = [x for x in range(begin_year, end_year + 1)]
                            
                            if any(i in query_years for i in possible_years):
                                select_year_id_set.append(objectID)
                            
                    else:
                        #Not a time window, just a single date
                        for rec_date in rec_dates:
                            if "DATE" in selection_options:               
                                if date_selection_type in ["DATE_RANGE", "COMPARATIVE", "RECENCY"]:
                                    if date_selection_type in ["COMPARATIVE", "RECENCY"]:
                                        start_date = subtract_relative_time(recency_end,time_slice_val,time_unit)
                                        end_date = recency_end

                                    if end_date > start_date:
                                        if rec_date >= start_date and rec_date <= end_date:
                                            select_date_id_set.append(objectID)
                                    elif end_date == start_date:
                                        if process_date_type == "DATEONLY":
                                            if rec_date == start_date:
                                                select_date_id_set.append(objectID)
                                        else:
                                            if rec_date.date() == start_date.date():
                                                select_date_id_set.append(objectID)
                                    else:
                                        if rec_date >= end_date and rec_date < start_date:
                                            select_date_id_set.append(objectID)
                                    
                                if date_selection_type == "SINGLE_DATE":
                                    single_date = single_date_val.replace(hour=0,minute=0,second=0,microsecond=0)
                                    if process_date_type == "DATEONLY":
                                        if rec_date == single_date.date():
                                            select_date_id_set.append(objectID)
                                    else:
                                        if process_date_type == "TIMESTAMPOFFSET":
                                            single_date = single_date.astimezone()
                                        if rec_date.date() == single_date.date():
                                            select_date_id_set.append(objectID)

                            if "TIME" in selection_options:
                                if process_date_type == "TIMEONLY":           
                                    rec_time = rec_date
                                else:
                                    rec_time = rec_date.time()
                                if end_time > start_time:
                                    if rec_time >= start_time and rec_time < end_time:
                                        select_time_id_set.append(objectID)
                                elif end_time == start_time:
                                    if rec_time == start_time:
                                        select_time_id_set.append(objectID)
                                else:
                                    if rec_time >= start_time and rec_time <= end_day:
                                        select_time_id_set.append(objectID)
                                    if rec_time >= begin_day and rec_time <= end_time:
                                        select_time_id_set.append(objectID)

                            if "DAY_OF_WEEK" in selection_options:
                                rec_weekday = int(rec_date.strftime('%w'))
                                if rec_weekday in query_days:
                                    select_day_of_week_id_set.append(objectID)

                            if "MONTH" in selection_options:
                                rec_month= int(rec_date.strftime('%m'))
                                if rec_month in query_months:
                                    select_month_id_set.append(objectID)

                            if "YEAR" in selection_options:
                                rec_year = rec_date.year
                                if rec_year in query_years:
                                    select_year_id_set.append(objectID)

            id_sets_group = []
            sel_group_count = 0
            if "DATE" in selection_options: 
                id_sets_group.append(set(select_date_id_set))
                sel_group_count += 1
            if "TIME" in selection_options: 
                id_sets_group.append(set(select_time_id_set))
                sel_group_count += 1
            if "DAY_OF_WEEK" in selection_options: 
                id_sets_group.append(set(select_day_of_week_id_set))
                sel_group_count += 1
            if "MONTH" in selection_options: 
                id_sets_group.append(set(select_month_id_set))
                sel_group_count += 1
            if "YEAR" in selection_options: 
                id_sets_group.append(set(select_year_id_set))
                sel_group_count += 1

            #Intersect selection sets to find overlap between selection types
            common_ids = []
            if id_sets_group:
                if len(id_sets_group) == 5:
                    common_ids = id_sets_group[0] & id_sets_group[1] & id_sets_group[2] & id_sets_group[3] & id_sets_group[4]
                elif len(id_sets_group) == 4:
                    common_ids = id_sets_group[0] & id_sets_group[1] & id_sets_group[2] & id_sets_group[3]
                elif len(id_sets_group) == 3:
                    common_ids = id_sets_group[0] & id_sets_group[1] & id_sets_group[2]
                elif len(id_sets_group) == 2:
                    common_ids = id_sets_group[0] & id_sets_group[1]
                elif len(id_sets_group) == 1:
                    common_ids = id_sets_group[0]

            recs_found = len(common_ids)

            if recs_found:
                lyr = select_features_by_id(list(common_ids), in_features, selection_type)
                arcpy.SetParameter(19, recs_found)
                arcpy.SetParameter(18, lyr)
            else:
                if selection_type == "NEW_SELECTION":
                    arcpy.SelectLayerByAttribute_management(in_features,"CLEAR_SELECTION")
                    arcpy.SetParameter(19, 0)
 
class JoinAttributesFromPolygon(object):
    def __init__(self):
        self.label = 'Join Attributes From Polygon'
        self.helpContext = 75000005
        self.canRunInBackground = False
    def getParameterInfo(self):

        # Point_Layer
        param_1 = arcpy.Parameter()
        param_1.name = 'target_features'
        param_1.displayName = 'Target Point Features'
        param_1.parameterType = 'Required'
        param_1.direction = 'Input'
        param_1.datatype = 'GPFeatureLayer'
        param_1.filter.list = ['Point']

        # Polygon_Layer
        param_2 = arcpy.Parameter()
        param_2.name = 'in_features'
        param_2.displayName = 'Input Polygon Features'
        param_2.parameterType = 'Required'
        param_2.direction = 'Input'
        param_2.datatype = 'GPFeatureLayer'
        param_2.filter.list = ['Polygon']

        # Transfer_Fields
        param_3 = arcpy.Parameter()
        param_3.name = 'fields'
        param_3.displayName = 'Join Fields'
        param_3.parameterType = 'Optional'
        param_3.direction = 'Input'
        param_3.datatype = 'Field'
        param_3.multiValue = True
        param_3.filter.list = ['Text', 'Float', 'Double', 'Short', 'Long', 'Date', 'BIGINTEGER', 'TIMESTAMPOFFSET','DATEONLY', 'TIMEONLY']
        param_3.parameterDependencies = [param_2.name]

        # Point_Layer
        param_4 = arcpy.Parameter()
        param_4.name = 'out_features'
        param_4.displayName = 'Updated Point Features'
        param_4.parameterType = 'Derived'
        param_4.direction = 'Output'
        param_4.datatype = 'GPFeatureLayer'
        param_4.parameterDependencies = [param_1.name]

        # Overwrite Existing Fields
        param_5 = arcpy.Parameter()
        param_5.name = 'overwrite_option'
        param_5.displayName = 'Overwrite matching fields in target point features'
        param_5.parameterType = 'Optional'
        param_5.direction = 'Input'
        param_5.datatype = 'GPBoolean'
        param_5.filter.list = ["OVERWRITE", "NO_OVERWRITE"]
        param_5.value = "NO_OVERWRITE"

        return [param_1, param_2, param_3, param_4, param_5]
    def isLicensed(self):
        return True
    def updateParameters(self, parameters):
        return
    def updateMessages(self, parameters):
        return
    def execute(self, parameters, messages):
        # -------------------------------------------------------------------------------
        # Purpose:     Appends fields from a polygon layer to point layer features (ex. 
        #              adding to the crime layer the name of the precinct in which each 
        #              crime occurred).
        #
        # Author:      Ryan Cosby
        #
        # Created:     1/11/2018
        # Copyright:   (c) Esri 2018
        # updated:     3/29/2018
        # -------------------------------------------------------------------------------
        
        fcPoints = parameters[0].valueAsText      
        fcPolygons = parameters[1].valueAsText
        tFieldList = parameters[2].values
        overwrite = parameters[4].value
        tempSpatialJoin = "memory/temp_join"

        #MESSAGES
        m1 = Message(210002, MsgType.INF)
        m2 = Message(210003, MsgType.INF)

        #Create List of Fields Names in the Fields to Append Parameter
        if not tFieldList:
            valid_types = ['String', 'Single', 'Double', 'SmallInteger', 'Integer', 'Date', 'BigInteger', 'TimeOnly', 'DateOnly', 'TimestampOffset']
            polyFieldList = [field.name for field in arcpy.ListFields(fcPolygons) if field.type in valid_types]
        else:
            polyFieldList = [field.value for field in tFieldList]

        #Create a Field Object List of Needed Polygon Fields (this approach preserves the correct order)
        polytFields = [field for fieldname in polyFieldList for field in arcpy.ListFields(fcPolygons) if fieldname == field.name]

        #List of existing fields in Target Point Features
        pointFields = [field.name.lower() for field in arcpy.ListFields(fcPoints)]

        pointsOIDField = arcpy.Describe(fcPoints).OIDFieldName

        fms = arcpy.FieldMappings()
        
        for field in polytFields:
            fm = arcpy.FieldMap()
            fm.addInputField(fcPolygons, field.name)
            fm.mergeRule = "Last"
            fm.outputField = field
            fms.addFieldMap(fm)

        arcpy.analysis.SpatialJoin(fcPoints,fcPolygons, tempSpatialJoin, field_mapping = fms)

        fields_to_transfer = [field.name for field in arcpy.ListFields(tempSpatialJoin)]
        shape_field = arcpy.Describe(tempSpatialJoin).shapeFieldName
        oid_field = arcpy.Describe(tempSpatialJoin).OIDFieldName
        fields_to_remove = [shape_field,oid_field,"Join_Count","TARGET_FID"]
        fields_to_transfer = [f for f in fields_to_transfer if f not in fields_to_remove]

        # Find any fields that already exist in the target point layer and remove them from the list of fields to transfer
        fields_to_overwrite = [field for field in fields_to_transfer if field.lower() in pointFields]

        # If overwriting iterate through spatial join layer and find matching values in the target point layer
        if overwrite and fields_to_overwrite:
            overwrite_dict = {}
            fields_to_transfer = [field for field in fields_to_transfer if field.lower() not in pointFields]
            with arcpy.da.SearchCursor(tempSpatialJoin, ["TARGET_FID"] + fields_to_overwrite) as cursor:
                for row in cursor:
                    row_dict = {key:value for key,value in zip(cursor.fields,row) if key != "TARGET_FID"}
                    for field_name, field_value in row_dict.items():
                        overwrite_dict[(row[0],field_name)] = field_value
            with arcpy.da.UpdateCursor(fcPoints, ["OID@"] + fields_to_overwrite) as cursor:
                for row in cursor:
                    for i,field in enumerate(fields_to_overwrite):
                        row[i + 1] = overwrite_dict[(row[0],field)]
                    cursor.updateRow(row)

        if fields_to_transfer:
            arcpy.management.JoinField(fcPoints, pointsOIDField, tempSpatialJoin, "TARGET_FID", fields_to_transfer)
        
        arcpy.management.Delete(tempSpatialJoin)

class SummarizeIncidentCount(object):
    toolname = 'IncidentCount'
    def __init__(self):
        self.label = 'Summarize Incident Count'
        self.helpContext = 75000007
        self.canRunInBackground = False
    def getParameterInfo(self):

        # Input Features
        param_1 = arcpy.Parameter()
        param_1.name = 'in_features'
        param_1.displayName = 'Input Features'
        param_1.parameterType = 'Required'
        param_1.direction = 'Input'
        param_1.datatype = 'GPFeatureLayer'
        param_1.filter.list = ['Point', 'Polyline', 'Polygon']

        # Summary Features
        param_2 = arcpy.Parameter()
        param_2.name = 'in_sum_features'
        param_2.displayName = 'Input Summary Features'
        param_2.parameterType = 'Required'
        param_2.direction = 'Input'
        param_2.datatype = 'GPFeatureLayer'
        param_2.filter.list = ['Point']

        # Output_Count_Layer
        param_3 = arcpy.Parameter()
        param_3.name = 'out_feature_class'
        param_3.displayName = 'Output Feature Class'
        param_3.parameterType = 'Required'
        param_3.direction = 'Output'
        param_3.datatype = 'DEFeatureClass'

        # Search_Radius
        param_4 = arcpy.Parameter()
        param_4.name = 'search_radius'
        param_4.displayName = 'Search Radius'
        param_4.parameterType = 'Optional'
        param_4.direction = 'Input'
        param_4.datatype = 'GPLinearUnit'
        param_4.filter.list = ['Meters', 'Millimeters', 'Centimeters','Inches', 'InchesInt', 'Points', 'Feet', 'FeetInt', 'Yards', 'YardsInt']

        # Category_Field
        param_5 = arcpy.Parameter()
        param_5.name = 'group_field'
        param_5.displayName = 'Group Field'
        param_5.parameterType = 'Optional'
        param_5.direction = 'Input'
        param_5.datatype = 'Field'
        param_5.filter.list = ['Text', 'Long', 'Short', 'BigInteger']
        param_5.parameterDependencies = [param_2.name]

        return [param_1, param_2, param_3, param_4, param_5]
    def isLicensed(self):
        return True
    def updateParameters(self, parameters):
        target = parameters[0]
        output = parameters[2]
        searchRadius = parameters[3]
        category = parameters[4]
        searchRadius.enabled = False

        if target.value:
            desc = arcpy.Describe(target)
            if desc.shapeType == "Polyline":
                searchRadius.enabled = True
                output.symbology = os.path.join(TEMPLATES_PATH, "incidentCountLine.lyrx")
            elif desc.shapeType == "Point":
                searchRadius.enabled = True
                output.symbology = os.path.join(TEMPLATES_PATH, "incidentCountPoint.lyrx")                
            else:
                searchRadius.enabled = False
                output.symbology = os.path.join(TEMPLATES_PATH, "incidentCountPoly.lyrx")
            if not target.hasBeenValidated:
                outName = set_output_name(target,self.toolname)
                if outName and not output.altered:
                    output.value = outName
        if not output.hasBeenValidated:
            output.value = validate_output_name(output)
        return
    def updateMessages(self, parameters):
        target = parameters[0]
        searchRadius = parameters[3]

        if target.value:
            desc = arcpy.Describe(target)
            if desc.shapeType == "Polyline" or desc.shapeType == "Point":
                if not searchRadius.value:
                    requireParameter(searchRadius)

        return
    def execute(self, parameters, messages):
        # -------------------------------------------------------------------------------
        # Purpose:     Creates a polygon or polyline chloropleth layer with the 
        #              corresponding coincident point counts.
        #
        # Author:      Ryan Cosby
        #
        # Created:     2/6/2018
        # Copyright:   (c) Esri 2018
        # updated:     3/29/2018
        # -------------------------------------------------------------------------------

        inLayer = parameters[0].valueAsText
        sumLayer = parameters[1].valueAsText
        outLayer = parameters[2].valueAsText
        searchRadius = parameters[3].valueAsText
        crimeType = parameters[4].valueAsText

        #MESSAGES

        m1 = Message(210025, MsgType.INF)


        TEMPOID_FIELD_NAME = "AGGID"
        TEMP_OUT_NAME = "in_memory/CNT"

        arcpy.management.CopyFeatures(inLayer, TEMP_OUT_NAME)
        arcpy.management.AddField(TEMP_OUT_NAME, TEMPOID_FIELD_NAME,"LONG")

        inDesc = arcpy.Describe(TEMP_OUT_NAME)
        inOID = inDesc.OIDFieldName
        inType = inDesc.shapeType
        inSR = inDesc.spatialReference

        arcpy.management.CalculateField(TEMP_OUT_NAME,TEMPOID_FIELD_NAME, "!{}!".format(inOID), "PYTHON3")

        fms = arcpy.FieldMappings()
        OIDfm = arcpy.FieldMap()
        
        OIDfm.addInputField(TEMP_OUT_NAME,TEMPOID_FIELD_NAME)
        OIDfm.mergeRule = "First"
        outOID = OIDfm.outputField
        outOID.name = TEMPOID_FIELD_NAME
        outOID.type = "Integer"
        OIDfm.outputField = outOID
        fms.addFieldMap(OIDfm)

        if crimeType:
            CATfm = arcpy.FieldMap()
            CATfm.addInputField(sumLayer,crimeType)
            CATfm.mergeRule = "First"

            outCAT = CATfm.outputField
            outCAT.name = "CATEGORY"
            outCAT.type = "String"
            outCAT.length = 255

            CATfm.outputField = outCAT
            fms.addFieldMap(CATfm)

        if inType == "Polyline" or inType == "Point":
            outSJ = arcpy.analysis.SpatialJoin(sumLayer, TEMP_OUT_NAME,
                                                        out_feature_class="in_memory/SJ",
                                                        field_mapping=fms,
                                                        join_type="KEEP_COMMON",
                                                        match_option="CLOSEST",
                                                        search_radius=searchRadius)
        else:
            outSJ = arcpy.analysis.SpatialJoin(sumLayer,TEMP_OUT_NAME,
                                                out_feature_class="in_memory/SJ",
                                                field_mapping=fms,
                                                join_type="KEEP_COMMON")

        countDict = {}
        totalCounts = {}

        if crimeType:
            categoryList = [str(row[0]) for row in arcpy.da.SearchCursor(sumLayer, crimeType)]

        if crimeType:
            searchFields = [TEMPOID_FIELD_NAME, "CATEGORY"]
        else:
            searchFields = TEMPOID_FIELD_NAME
        
        with arcpy.da.SearchCursor(outSJ, searchFields) as cursor:
            for row in cursor:
                if crimeType:
                    if type(row[1]) == "str":
                        key = "{}-{}".format(str(row[0]), row[1])
                    else:
                        key = "{}-{}".format(str(row[0]), str(row[1]))
                    try:
                        countDict[key] += 1
                    except:
                        countDict[key] = 1

                try:
                    totalCounts[str(row[0])] += 1
                except:
                    totalCounts[str(row[0])] = 1

        arcpy.management.Delete(outSJ)

        arcpy.SetProgressorLabel(retrieveMessage(m1))
        if crimeType:        
            categoryUniqList = sorted(list(set(categoryList)))
            categoryToFieldsList = []
            for category in categoryUniqList:
                fieldName = arcpy.ValidateFieldName(category, "in_memory") + "_CNT"
                categoryToFieldsList.append(fieldName)
                arcpy.management.AddField(TEMP_OUT_NAME, fieldName, field_type="LONG",field_alias=category)

        arcpy.ResetProgressor()

        arcpy.management.AddField(TEMP_OUT_NAME, "TOTAL_CNT", field_type="LONG",field_alias="Total Count")

        if crimeType:
            updateFields = categoryToFieldsList + ['TOTAL_CNT', TEMPOID_FIELD_NAME]  
        else:
            updateFields = ["TOTAL_CNT", TEMPOID_FIELD_NAME]
            
        with arcpy.da.UpdateCursor(TEMP_OUT_NAME, updateFields) as cursor:
            for row in cursor:
                for x in range(len(cursor.fields)):
                    if x < (len(cursor.fields) - 2):
                        key = "{}-{}".format(str(row[-1]),categoryUniqList[x])
                        try:
                            row[x] = countDict[key]
                        except:
                            row[x] = 0
                    if x == len(cursor.fields) - 2:
                        try:
                            row[x] = totalCounts[str(row[-1])]
                        except:
                            row[x] = 0
                cursor.updateRow(row)
                
        arcpy.management.DeleteField(TEMP_OUT_NAME,TEMPOID_FIELD_NAME)
        arcpy.management.CopyFeatures(TEMP_OUT_NAME, outLayer)
        arcpy.management.Delete(TEMP_OUT_NAME)

class EightyTwentyAnalysis(object):
    toolname = '8020Analysis'
    def __init__(self):
        self.label = '80-20 Analysis'
        self.helpContext = 75000001
        self.canRunInBackground = False
    def getParameterInfo(self):
        # Input_Points
        param_1 = arcpy.Parameter(
            name = 'in_features',
            displayName = 'Input Point Features',
            parameterType = 'Required',
            direction = 'Input',
            datatype = 'GPFeatureLayer'
        )
        param_1.filter.list = ['Point']
        param_1.displayOrder = 0

        # Output_Clusters
        param_2 = arcpy.Parameter(
            name = 'out_feature_class',
            displayName = 'Output Feature Class',
            parameterType = 'Required',
            direction = 'Output',
            datatype = 'DEFeatureClass'
        )
        param_2.displayOrder = 1

        # Cluster_Tolerance
        param_3 = arcpy.Parameter(
            name = 'cluster_tolerance',
            displayName = 'Cluster Tolerance',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'GPLinearUnit'
        )
        param_3.filter.list = ['Meters','Kilometers','MilesInt', 'Miles', 'Feet', 'FeetInt']
        param_3.displayOrder = 4

        # Output Address Field
        param_4 = arcpy.Parameter(
            name = 'out_fields',
            displayName = 'Output Fields',
            parameterType = 'Optional',
            multiValue = True,
            direction = 'Input',
            datatype = 'Field'
        )
        param_4.filter.list = ['Text', 'Float', 'Double', 'Short', 'Long', 'Date']
        param_4.parameterDependencies = [param_1.name]
        param_4.displayOrder = 5

        param_5 = arcpy.Parameter(
            name = "aggregation_method",
            displayName = "Aggregation Method",
            parameterType = "Optional",
            datatype = "GPString",
            direction = 'Input'
        )
        param_5.filter.list = ["POINT_CLUSTER", "CLOSEST_FEATURE"]
        param_5.value = "POINT_CLUSTER"
        param_5.displayOrder = 2
        param_5.enabled = True

        param_6 = arcpy.Parameter(
            name = 'in_comparison_features',
            displayName = 'Input Comparison Features',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'GPFeatureLayer'
        )
        param_6.filter.list = ['Polyline', 'Polygon']
        param_6.displayOrder = 3
        param_6.enabled = False

        return [param_1, param_2, param_3, param_4, param_5, param_6]
    def isLicensed(self):
        return True
    def updateParameters(self, parameters):
        originLayer = parameters[0]
        outLayer = parameters[1]
        cluster_tolerance = parameters[2]
        output_fields = parameters[3]
        aggregation_type = parameters[4]
        comparison_features = parameters[5]
        if aggregation_type.value == "POINT_CLUSTER":
            outLayer.symbology = os.path.join(TEMPLATES_PATH, "eightytwentypoints.lyrx")
        else:
            if comparison_features.value:
                geom_type = arcpy.Describe(comparison_features.value).shapeType
                if geom_type == "Polyline":
                    outLayer.symbology = os.path.join(TEMPLATES_PATH, "eightytwentylines.lyrx")
                else:
                    outLayer.symbology = os.path.join(TEMPLATES_PATH, "eightytwentypolygons.lyrx")

        if not originLayer.hasBeenValidated:
            outName = set_output_name(originLayer,self.toolname)
            if outName and not outLayer.altered:
                outLayer.value = outName
        if not outLayer.hasBeenValidated:
            outLayer.value = validate_output_name(outLayer)

        if aggregation_type.value == "POINT_CLUSTER":
            comparison_features.enabled = False
            cluster_tolerance.enabled = True
            output_fields.parameterDependencies = [originLayer.name]

        else:
            comparison_features.enabled = True
            cluster_tolerance.enabled = False
            output_fields.parameterDependencies = [comparison_features.name]

        return



    def updateMessages(self, parameters):
        originLayer = parameters[0]
        outLayer = parameters[1]
        cluster_tolerance = parameters[2]
        output_fields = parameters[3]
        aggregation_type = parameters[4]
        comparison_features = parameters[5]

        if aggregation_type.value == "POINT_CLUSTER":
            comparison_features.clearMessage()
        else:
            if not comparison_features.value:
                requireParameter(comparison_features)
             
        return
    def execute(self, parameters, messages):
        # -------------------------------------------------------------------------------
        # Purpose:     Creates a graduated symbol layer for points with multiple incidents 
        #              occurring at the same location. Tool also calculates cumulative 
        #              percentage for 80/20 analysis of problem locations.
        #
        # Author:      Ryan Cosby
        #
        # Created:     2/13/2018
        # Copyright:   (c) Esri 2018
        # updated:     3/29/2018
        # -------------------------------------------------------------------------------

        def setup_output_fields(tFields, temp_fs, outLayer, norm_fields = []):
            #Setup output fields
            fms = arcpy.FieldMappings()

            setup_output_field_map(fms, temp_fs, "ICOUNT","Integer","First")

            percentage_fields = ["PERC", "CUMU_PERC", "CUMU_LPERC"]

            double_fields = percentage_fields + norm_fields

            for f in double_fields:
                setup_output_field_map(fms, temp_fs, f,"Double","First")

            for f in tFields:
                setup_output_field_map(fms, temp_fs, f.name, f.type,"First")

            arcpy.conversion.ExportFeatures(temp_fs, outLayer,field_mapping=fms)


        def aggregate_by_clusters(inpLayer, tFieldNames, tFields, toleranceValue, outLayer):
            def cluster_points(inpLayer, toleranceOption):
                # To prevent double counting XY tolerance needs to be set to 0 temporarily
                cacheTolerance = arcpy.env.XYTolerance
                arcpy.env.XYTolerance = 0
                
                arcpy.analysis.PairwiseDissolve(inpLayer, "in_memory/tempLayerDissolve", multi_part="SINGLE_PART")
                arcpy.analysis.SpatialJoin("in_memory/tempLayerDissolve", "in_memory/tempLayer", "in_memory/tempLayerDissolveSJ")
                arcpy.Delete_management("in_memory/tempLayerDissolve")
                arcpy.env.XYTolerance = cacheTolerance

                if toleranceOption:
                    printMessage(m1)
                    arcpy.stats.DensityBasedClustering("in_memory/tempLayerDissolveSJ", "in_memory/tempLayerSJDensity", cluster_method="DBSCAN", min_features_cluster=2, search_distance=tolerance)
                    densPointsCount = int(arcpy.GetCount_management("in_memory/tempLayerSJDensity").getOutput(0))

                    arcpy.management.AddField("in_memory/tempLayerSJDensity", field_name="clid_new", field_type="TEXT", field_length=50)
                    
                    with arcpy.da.UpdateCursor("in_memory/tempLayerSJDensity", ["clid_new", "OID@", "CLUSTER_ID"]) as cursor:
                        for row in cursor:
                            OID = row[1]
                            clusterID = row[2]
                            if clusterID == -1:
                                row[0] = "S" + str(OID)
                            else:
                                row[0] = clusterID
                            
                            cursor.updateRow(row)
                    
                    printMessage(m2)
                    sjOID = arcpy.Describe("in_memory/tempLayerDissolveSJ").OIDFieldName
                    arcpy.management.JoinField("in_memory/tempLayerSJDensity", "SOURCE_ID", "in_memory/tempLayerDissolveSJ", sjOID, "Join_Count")
                    arcpy.analysis.Statistics("in_memory/tempLayerSJDensity", "in_memory/SJDensSumm", statistics_fields="Join_Count SUM", case_field="clid_new")
                    densPointsSummCount = int(arcpy.GetCount_management("in_memory/SJDensSumm").getOutput(0))
                    
                    # If the number of summarized records is the same as the count, that means there doesn't need to be any additional clustering
                    # with the Mean Center tool and that you can exit the function now. No points were found within the cluster tolerance of other
                    # points
                    if densPointsSummCount == densPointsCount:
                        arcpy.Delete_management("in_memory/SJDensSumm")
                        arcpy.Delete_management("in_memory/tempLayerSJDensity")
                        return "in_memory/tempLayerDissolveSJ"
                    
                    arcpy.Delete_management("in_memory/tempLayerDissolveSJ")

                    #Select only features that are part of a cluster
                    toBeClustered = arcpy.management.SelectLayerByAttribute("in_memory/tempLayerSJDensity", "NEW_SELECTION", "clid_new NOT LIKE '%S%'", None)
                    #Calculate the central points of each cluster
                    arcpy.stats.MeanCenter(toBeClustered, "in_memory/tempLayerMeanCenter",Case_Field="clid_new")
                    #Add the Join Count calculation to the table
                    arcpy.management.JoinField("in_memory/tempLayerMeanCenter", "clid_new", "in_memory/SJDensSumm", "clid_new", "SUM_Join_Count")
                    arcpy.AlterField_management("in_memory/tempLayerMeanCenter", field="SUM_Join_Count", new_field_name="Join_Count", new_field_alias="Incident Count")
                    
                    #Select the features that do not need to be clustered and append them to the final dataset
                    notCluster = arcpy.management.SelectLayerByAttribute("in_memory/tempLayerSJDensity", "NEW_SELECTION", "clid_new LIKE '%S%'", None)
                    arcpy.management.DeleteField("in_memory/tempLayerMeanCenter", ["clid_new", "YCoord", "XCoord"])
                    arcpy.management.Append(notCluster, "in_memory/tempLayerMeanCenter", schema_type="NO_TEST")
                    arcpy.Delete_management("in_memory/tempLayerSJDensity")
                    arcpy.Delete_management("in_memory/SJDensSumm")
                    return "in_memory/tempLayerMeanCenter"
                else:
                    return "in_memory/tempLayerDissolveSJ"

            tFieldList = tFieldNames + ["ICOUNT", "CUMU_PERC", "PERC"]

            arcpy.CopyFeatures_management(inpLayer,"in_memory/tempLayer")

            derivedLayer = cluster_points("in_memory/tempLayer", toleranceValue)

            arcpy.AlterField_management(derivedLayer, field="Join_Count", new_field_name="ICOUNT", new_field_alias="Incident Count")

            arcpy.Sort_management(derivedLayer,"in_memory/sortedClusters",[["ICOUNT", "DESCENDING"]])

            arcpy.Delete_management(derivedLayer)

            field_infos = [
                ['PERC', 'DOUBLE', 'Incident Percentage'],
                ['CUMU_PERC', 'DOUBLE', 'Cumulative Incident Percentage'],
                ['CUMU_LPERC', 'DOUBLE', 'Cumulative Location Percentage']
            ]
            arcpy.AddFields_management("in_memory/sortedClusters",field_infos)

            #Getting count of all the original input points
            clusterCount = 0
            location_count = 0
            with arcpy.da.SearchCursor("in_memory/sortedClusters",['ICOUNT']) as cursor:
                for row in cursor:
                    location_count += 1
                    clusterCount += row[0]
            del cursor

            arcpy.SetProgressorLabel(retrieveMessage(m3))
            printMessage(m3)
            #Using code from this thread: https://community.esri.com/thread/174343
            with arcpy.da.UpdateCursor("in_memory/sortedClusters", ['ICOUNT','PERC','CUMU_PERC', 'CUMU_LPERC']) as cursor:
                cumuSum = 0
                record_count = 0
                for row in cursor:
                    cumuSum += row[0]
                    record_count += 1
                    row[1] = (row[0]/ clusterCount) * 100
                    row[2] = (cumuSum / clusterCount) * 100
                    row[3] = (record_count / location_count) * 100
                    cursor.updateRow(row)
            del cursor
            
            if tolerance:
                arcpy.SpatialJoin_analysis("in_memory/sortedClusters","in_memory/tempLayer","in_memory/tempLayerJoin", match_option="CLOSEST")
            else:
                arcpy.management.CopyFeatures("in_memory/sortedClusters", "in_memory/tempLayerJoin")

            setup_output_fields(tFields,"in_memory/tempLayerJoin", outLayer)
                
            arcpy.Delete_management("in_memory/sortedClusters")
            arcpy.Delete_management("in_memory/tempLayer")
            arcpy.Delete_management("in_memory/tempLayerJoin")
            arcpy.Delete_management("in_memory/sortedClusters")

        def aggregate_by_features(in_layer, in_comp_layer, tFieldNames, tFields, outLayer):
            TEMPOID_FIELD_NAME = "AGGID"
            TEMP_OUT_NAME = "in_memory/CNT"
            TEMP_SJ_NAME = "in_memory/SJ"
            TEMP_SORT_NAME = "in_memory/SORTED"

            comp_desc = arcpy.Describe(in_comp_layer)
            arcpy.management.CopyFeatures(in_comp_layer, TEMP_OUT_NAME)
            arcpy.management.AddField(TEMP_OUT_NAME, TEMPOID_FIELD_NAME,"LONG")

            inDesc = arcpy.Describe(TEMP_OUT_NAME)
            inOID = inDesc.OIDFieldName
            inType = inDesc.shapeType
            inSR = inDesc.spatialReference

            arcpy.management.CalculateField(TEMP_OUT_NAME,TEMPOID_FIELD_NAME, "!{}!".format(inOID), "PYTHON3")

            fms = arcpy.FieldMappings()
            setup_output_field_map(fms, TEMP_OUT_NAME, TEMPOID_FIELD_NAME, "Integer","First")

            arcpy.analysis.SpatialJoin(in_layer, TEMP_OUT_NAME,
                                                        out_feature_class=TEMP_SJ_NAME,
                                                        field_mapping=fms,
                                                        join_type="KEEP_COMMON",
                                                        match_option="CLOSEST")

            total_counts = {}
            total_count = 0

            with arcpy.da.SearchCursor(TEMP_SJ_NAME, TEMPOID_FIELD_NAME) as cursor:
                for row in cursor:
                    total_count += 1
                    try:
                        total_counts[str(row[0])] += 1
                    except:
                        total_counts[str(row[0])] = 1

            field_infos = [
                ['ICOUNT', 'LONG', 'Incident Count'],
                ['PERC', 'DOUBLE', 'Incident Percentage'],
                ['CUMU_PERC', 'DOUBLE', 'Cumulative Incident Percentage'],
                ['CUMU_LPERC', 'DOUBLE', 'Cumulative Location Percentage']
            ]

            arcpy.management.AddFields(TEMP_OUT_NAME,field_infos)
            
            # Add Normalization Fields
            length_calc = "LENGTH_GEODESIC"
            area_calc = "AREA_GEODESIC"
            if inType == "Polyline":
                arcpy.management.AddField(TEMP_OUT_NAME, "INC_MI", field_type="DOUBLE", field_alias="Incidents Per Mile")
                arcpy.management.AddField(TEMP_OUT_NAME, "INC_KM", field_type="DOUBLE", field_alias="Incidents Per Kilometer")
                arcpy.management.CalculateGeometryAttributes(TEMP_OUT_NAME, [["INC_MI", length_calc]],length_unit="MILES_US")
                arcpy.management.CalculateGeometryAttributes(TEMP_OUT_NAME, [["INC_KM", length_calc]],length_unit="KILOMETERS")
                norm_fields = ["INC_MI", "INC_KM"]
            else:
                arcpy.management.AddField(TEMP_OUT_NAME, "INC_SQMI", field_type="FLOAT", field_alias="Incidents Per Square Mile")
                arcpy.management.AddField(TEMP_OUT_NAME, "INC_SQKM", field_type="FLOAT", field_alias="Incidents Per Square Kilometer")
                arcpy.management.CalculateGeometryAttributes(TEMP_OUT_NAME, [["INC_SQMI", area_calc]],area_unit="SQUARE_MILES_US")
                arcpy.management.CalculateGeometryAttributes(TEMP_OUT_NAME, [["INC_SQKM", area_calc]],area_unit="SQUARE_KILOMETERS")
                norm_fields = ["INC_SQMI", "INC_SQKM"]                

            location_count = 0
            with arcpy.da.UpdateCursor(TEMP_OUT_NAME, ["ICOUNT",TEMPOID_FIELD_NAME]) as cursor:
                for row in cursor:
                    location_count += 1
                    try:
                        row[0] = total_counts[str(row[1])]
                    except:
                        row[0] =  0
                    cursor.updateRow(row)

            arcpy.management.Sort(TEMP_OUT_NAME, TEMP_SORT_NAME, [["ICOUNT", "DESCENDING"]])

            arcpy.management.Delete(TEMP_OUT_NAME)
            arcpy.management.Delete(TEMP_SJ_NAME)

            with arcpy.da.UpdateCursor(TEMP_SORT_NAME, ["ICOUNT", "PERC", "CUMU_PERC", "CUMU_LPERC"] + norm_fields) as cursor:
                cumuSum = 0
                record_count = 0
                for row in cursor:
                    cumuSum += row[0]
                    record_count += 1
                    row[1] = (row[0]/ total_count) * 100
                    row[2] = (cumuSum / total_count) * 100
                    row[3] = (record_count / location_count) * 100
                    try:
                        row[4] = (row[0]/row[4])
                        row[5] = (row[0]/row[5])
                    except ZeroDivisionError:
                        row[4] = 0
                        row[5] = 0
                    cursor.updateRow(row)

            setup_output_fields(tFields,TEMP_SORT_NAME, outLayer, norm_fields)
        
        inpLayer = parameters[0].valueAsText
        outLayer = parameters[1].valueAsText
        tolerance = parameters[2].valueAsText
        tFieldValues = parameters[3].values
        aggregation_type = parameters[4].valueAsText
        in_comparison_features = parameters[5].valueAsText
        
        #MESSAGES
        m1 = Message(210029, MsgType.INF)
        m2 = Message(210030, MsgType.INF)
        m3 = Message(210031, MsgType.INF)    

        tFieldNames = []
        tFields = []

        if tFieldValues:
            tFieldNames = [field.value for field in parameters[3].values]
            if aggregation_type == "CLOSEST_FEATURE":
                lyr = in_comparison_features
            else:
                lyr = inpLayer
            
            tFields = [field for field in arcpy.ListFields(lyr) if field.name in tFieldNames]


        if aggregation_type == "CLOSEST_FEATURE":
            aggregate_by_features(inpLayer, in_comparison_features, tFieldNames, tFields, outLayer)
        else:
            aggregate_by_clusters(inpLayer,tFieldNames, tFields,tolerance, outLayer)

class SummarizePercentChange(object):
    toolname = 'PercentChange'
    def __init__(self):
        self.label = 'Summarize Percent Change'
        self.helpContext = 75000008
        self.canRunInBackground = False
    def getParameterInfo(self):

        # Comparison_Areas
        param_1 = arcpy.Parameter()
        param_1.name = 'in_features'
        param_1.displayName = 'Input Features'
        param_1.parameterType = 'Required'
        param_1.direction = 'Input'
        param_1.datatype = 'GPFeatureLayer'
        param_1.filter.list = ['Polygon', 'Polyline', 'Point']
        
        # Current_Period
        param_2 = arcpy.Parameter()
        param_2.name = 'in_current_features'
        param_2.displayName = 'Input Current Period Point Features'
        param_2.parameterType = 'Required'
        param_2.direction = 'Input'
        param_2.datatype = 'GPFeatureLayer'
        param_2.filter.list = ['Point']

        # Previous_Period
        param_3 = arcpy.Parameter()
        param_3.name = 'in_previous_features'
        param_3.displayName = 'Input Previous Period Point Features'
        param_3.parameterType = 'Required'
        param_3.direction = 'Input'
        param_3.datatype = 'GPFeatureLayer'
        param_3.filter.list = ['Point']

        # Output_Statistics_Layer
        param_4 = arcpy.Parameter()
        param_4.name = 'out_feature_class'
        param_4.displayName = 'Output Feature Class'
        param_4.parameterType = 'Required'
        param_4.direction = 'Output'
        param_4.datatype = 'DEFeatureClass'

        # Search_Radius
        param_5 = arcpy.Parameter()
        param_5.name = 'search_radius'
        param_5.displayName = 'Search Radius'
        param_5.parameterType = 'Optional'
        param_5.direction = 'Input'
        param_5.datatype = 'GPLinearUnit'
        param_5.filter.list = ['Meters', 'Inches', 'InchesInt', 'Points', 'Feet', 'FeetInt', 'Yards','YardsInt', 'Millimeters', 'Centimeters']

        return [param_1, param_2, param_3, param_4, param_5]
    def isLicensed(self):
        return True
    def updateParameters(self, parameters):
        target = parameters[0]
        output = parameters[3]
        searchRadius = parameters[4]
        searchRadius.enabled = False
        if target.value:
            desc = arcpy.Describe(target)
            if desc.shapeType == "Polyline":
                searchRadius.enabled = True
                output.symbology = os.path.join(TEMPLATES_PATH, "percentChangeLine.lyrx")
            elif desc.shapeType == "Point":
                searchRadius.enabled = True
                output.symbology = os.path.join(TEMPLATES_PATH, "percentChangePoint.lyrx")
            else:
                searchRadius.enabled = False
                output.symbology = os.path.join(TEMPLATES_PATH, "percentChangePoly.lyrx")
        
        if not target.hasBeenValidated:
            outName = set_output_name(target, self.toolname)
            if outName and not output.altered:
                output.value = outName
        if not output.hasBeenValidated:
            output.value = validate_output_name(output)
        return
    def updateMessages(self, parameters):
        target = parameters[0]
        searchRadius = parameters[4]

        if target.value:
            desc = arcpy.Describe(target)
            if desc.shapeType == "Polyline" or desc.shapeType == "Point":
                if not searchRadius.value:
                    requireParameter(searchRadius)
        return

    def execute(self, parameters, messages):
        # -------------------------------------------------------------------------------
        # Purpose:     Calculates percent change for each feature in a layer 
        #              from input point layers representing two comparison time periods.
        #
        # Author:      Ryan Cosby
        #
        # Created:     2/14/2018
        # Copyright:   (c) Esri 2018
        # updated:     3/29/2018
        # -------------------------------------------------------------------------------
        compFeatures = parameters[0].valueAsText
        recentSlice = parameters[1].valueAsText
        previousSlice = parameters[2].valueAsText
        outLayer = parameters[3].valueAsText
        searchRadius = parameters[4].valueAsText

        #MESSAGES
        m1 = Message(210026, MsgType.INF)
        m2 = Message(210027, MsgType.INF)

        def get_join_coints(in_join_features):
            total_counts = {}

            with arcpy.da.SearchCursor(in_join_features, TEMPOID_FIELD_NAME) as cursor:
                for row in cursor:
                    try:
                        total_counts[str(row[0])] += 1
                    except:
                        total_counts[str(row[0])] = 1

            return total_counts


        TEMPOID_FIELD_NAME = "AGGID"
        TEMP_OUT_NAME = "in_memory/PERC"

        arcpy.management.CopyFeatures(compFeatures, TEMP_OUT_NAME)
        arcpy.management.AddField(TEMP_OUT_NAME, TEMPOID_FIELD_NAME,"LONG")

        compDesc = arcpy.Describe(TEMP_OUT_NAME)
        compOID = compDesc.OIDFieldName
        compType = compDesc.shapeType
        compSR = compDesc.spatialReference

        arcpy.management.CalculateField(TEMP_OUT_NAME,TEMPOID_FIELD_NAME, "!{}!".format(compOID), "PYTHON3")

        fms = arcpy.FieldMappings()
        OIDfm = arcpy.FieldMap()
        
        OIDfm.addInputField(TEMP_OUT_NAME,TEMPOID_FIELD_NAME)
        OIDfm.mergeRule = "First"
        outOID = OIDfm.outputField
        outOID.name = TEMPOID_FIELD_NAME
        outOID.type = "Integer"
        OIDfm.outputField = outOID
        fms.addFieldMap(OIDfm)

        if compType == "Polyline" or compType == "Point":
            outSJ_recent = arcpy.analysis.SpatialJoin(recentSlice, TEMP_OUT_NAME,
                                                        out_feature_class="in_memory/recent",
                                                        field_mapping=fms,
                                                        join_type="KEEP_COMMON",
                                                        match_option="CLOSEST",
                                                        search_radius=searchRadius)
            outSJ_previous = arcpy.analysis.SpatialJoin(previousSlice, TEMP_OUT_NAME,
                                                        out_feature_class="in_memory/previous",
                                                        field_mapping=fms,
                                                        join_type="KEEP_COMMON",
                                                        match_option="CLOSEST",
                                                        search_radius=searchRadius)
        else:
            outSJ_recent = arcpy.analysis.SpatialJoin(recentSlice,TEMP_OUT_NAME,
                                                        out_feature_class="in_memory/recent",
                                                        field_mapping=fms,
                                                        join_type="KEEP_COMMON")
            outSJ_previous = arcpy.analysis.SpatialJoin(previousSlice,TEMP_OUT_NAME,
                                                        out_feature_class="in_memory/previous",
                                                        field_mapping=fms,
                                                        join_type="KEEP_COMMON")

        arcpy.SetProgressorLabel(retrieveMessage(m1))
        total_counts_recent = get_join_coints(outSJ_recent)
        arcpy.management.Delete(outSJ_recent)

        total_counts_previous = get_join_coints(outSJ_previous)
        arcpy.management.Delete(outSJ_previous)

        arcpy.ResetProgressor()

        arcpy.management.AddField(TEMP_OUT_NAME, field_name="CUR_CNT", field_alias="Current Count", field_type="LONG")
        arcpy.management.AddField(TEMP_OUT_NAME, field_name="PREV_CNT", field_alias="Previous Count", field_type="LONG")
        arcpy.management.AddField(TEMP_OUT_NAME, field_name="DIFF_CNT", field_alias="Difference", field_type="LONG")
        arcpy.management.AddField(TEMP_OUT_NAME, field_name="PERC", field_alias="Percent Change", field_type="DOUBLE")


        arcpy.SetProgressorLabel(retrieveMessage(m2))
        with arcpy.da.UpdateCursor(TEMP_OUT_NAME, ["CUR_CNT", "PREV_CNT", "DIFF_CNT", "PERC", TEMPOID_FIELD_NAME]) as cursor:
            for row in cursor:
                    OID_key = str(row[4])
                    
                    try:
                        current_count = total_counts_recent[OID_key]
                    except:
                        current_count = 0

                    try:
                        previous_count = total_counts_previous[OID_key]
                    except:
                        previous_count = 0

                    try:
                        diff_count = current_count - previous_count
                    except:
                        diff_count = 0

                    try:
                        percent_change = (diff_count / previous_count) * 100
                    except:
                        percent_change = None

                    row[0] = current_count
                    row[1] = previous_count
                    row[2] = diff_count
                    row[3] = percent_change
                    
                    cursor.updateRow(row)

        arcpy.ResetProgressor()

        arcpy.management.DeleteField(TEMP_OUT_NAME, TEMPOID_FIELD_NAME)
        arcpy.management.CopyFeatures(TEMP_OUT_NAME, outLayer)
        arcpy.management.Delete(TEMP_OUT_NAME)

class CellSiteRecordsToFeatureClass(object):
    toolname = "CellSiteRecords"
    def __init__(self):
        self.label = 'Cell Site Records To Feature Class'
        self.helpContext = 75010002
        self.canRunInBackground = False
        self.category = 'Cell Phone Analysis'
    def getParameterInfo(self):

        param_0 = arcpy.Parameter(
            name = 'in_table',
            displayName = 'Input Cell Site Table',
            parameterType = 'Required',
            direction = 'Input',
            datatype = 'GPTableView'
        )

        param_1 = arcpy.Parameter(
            name = 'out_site_feature_class',
            displayName = 'Output Cell Site Points',
            parameterType = 'Required',
            direction = 'Output',
            datatype = 'DEFeatureClass'
        )
        param_1.symbology = os.path.join(TEMPLATES_PATH, "cellSites.lyrx")

        param_2 = arcpy.Parameter(
            name = 'out_sector_feature_class',
            displayName = 'Output Cell Site Sectors',
            parameterType = 'Required',
            direction = 'Output',
            datatype = 'DEFeatureClass'
        )
        param_2.symbology = os.path.join(TEMPLATES_PATH, "cellSectors.lyrx")

        param_3 = arcpy.Parameter(
            name= 'id_fields',
            displayName = 'Cell Sector ID Fields',
            parameterType = 'Required',
            direction = 'Input',
            datatype = 'GPValueTable'
        )

        param_3.parameterDependencies = [param_0.name]
        param_3.columns= [['GPString','ID Type'],['Field', 'Field']]
        param_3.filters[0].type = 'ValueList'
        param_3.filters[0].list =  ['UNIQUE_ID', 'SITE_ID', 'SECTOR_ID', 'SWITCH_ID', 'LAC_ID', 'CASCADE_ID', 'CELL_ID']
        param_3.filters[1].list = ['Short', 'Long', 'Single', 'Double', 'Text', 'BigInteger']


        param_4 = arcpy.Parameter(
            name= 'x_field',
            displayName = 'X Field',
            parameterType = 'Required',
            direction = 'Input',
            datatype = 'Field'
        )

        param_5 = arcpy.Parameter(
            name= 'y_field',
            displayName = 'Y Field',
            parameterType = 'Required',
            direction = 'Input',
            datatype = 'Field'
        )

        param_6 = arcpy.Parameter(
            name= 'in_coordinate_system',
            displayName = 'Input Coordinate System',
            parameterType = 'Required',
            direction = 'Input',
            datatype = 'GPCoordinateSystem'
        )
        param_6.value = arcpy.SpatialReference(4326)

        param_7 = arcpy.Parameter(
            name= 'out_coordinate_system',
            displayName = 'Output Projected Coordinate System',
            parameterType = 'Required',
            direction = 'Input',
            datatype = 'GPCoordinateSystem'
        )

        param_8 = arcpy.Parameter(
            name= 'azimuth_field',
            displayName = 'Azimuth Field',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'Field'
        )

        param_8.filter.list = ["Short", "Long", "Text", "Single", "Double", "BigInteger"]

        param_9 = arcpy.Parameter(
            name= 'default_azimuth',
            displayName = 'Default Start Azimuth',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'GPDouble'
        )

        param_9.filter.type = 'Range'
        param_9.filter.list = [0, 360]
        param_9.value = 0

        param_10 = arcpy.Parameter(
            name= 'beamwidth_field',
            displayName = 'Beamwidth Field',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'Field'
        )
        param_10.filter.list = ["Short", "Long", "Text", "Single", "Double", "BigInteger"]

        param_11 = arcpy.Parameter(
            name= 'beamwidth_type',
            displayName = 'Beamwidth Type',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'GPString'
        )
        param_11.filter.list = ["FULL_BEAMWIDTH", "HALF_BEAMWIDTH"]
        param_11.value = "FULL_BEAMWIDTH"

        param_12 = arcpy.Parameter(
            name= 'default_beamwidth',
            displayName = 'Default Beamwidth (degrees)',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'GPDouble'
        )

        param_12.filter.type = 'Range'
        param_12.filter.list = [0, 360]
        param_12.value = 90

        param_13 = arcpy.Parameter(
            name= 'radius_field',
            displayName = 'Radius Field',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'Field'
        )
        param_13.filter.list = ["Short", "Long", "Text", "Single", "Double", "BigInteger"]

        param_14 = arcpy.Parameter(
            name= 'radius_unit',
            displayName = 'Radius Unit',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'GPString'
        )
        param_14.filter.list = ["KILOMETERS", "METERS", "MILESINT", "YARDSINT", "FEETINT", "MILES", "YARDS", "FEET"]
        param_14.value = 'MILES'


        param_15 = arcpy.Parameter(
            name= 'default_radius_length',
            displayName = 'Default Radius Length',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'GPDouble'
        )
        param_15.value = 2

        param_3.parameterDependencies= [param_0.name]
        param_4.parameterDependencies= [param_0.name]
        param_5.parameterDependencies= [param_0.name]
        param_8.parameterDependencies= [param_0.name]
        param_10.parameterDependencies= [param_0.name]
        param_13.parameterDependencies= [param_0.name]

        return [param_0, param_1, param_2, param_3, param_4, param_5, param_6, param_7, param_8, param_9, param_10, param_11, param_12, param_13, param_14, param_15]
    def isLicensed(self):
        return True
    def updateParameters(self, parameters):
        inputTable = parameters[0]
        outSites = parameters[1]
        outSectors = parameters[2]
        x_field = parameters[4]
        y_field = parameters[5]
        if not inputTable.hasBeenValidated:
            outSiteName = set_output_name(inputTable,"Sites")
            if outSiteName and not outSites.altered:
                outSites.value = outSiteName
            outSectorName = set_output_name(inputTable,"Sectors")
            if outSectorName and not outSectors.altered:
                outSectors.value = outSectorName
        if not outSites.hasBeenValidated:
            outSites.value = validate_output_name(outSites)
        if not outSectors.hasBeenValidated:
            outSectors.value = validate_output_name(outSectors)

        set_auto_xy_fields(inputTable, x_field, y_field)
        return
    def updateMessages(self, parameters):
        inputTable = parameters[0]
        outputPoints = parameters[1]
        outputSectors = parameters[2]
        identifiers = parameters[3]
        lon = parameters[4]
        lat = parameters[5]
        sr = parameters[7]
        azimuth = parameters[8]

        #MESSAGES
        e1 = Message(210004, MsgType.ERR)
        e2 = Message(210005, MsgType.ERR)
        e3 = Message(210006, MsgType.ERR)
        e4 = Message(210007, MsgType.ERR)
        e5 = Message(210008, MsgType.ERR)

        if identifiers.values and inputTable.value:
            # Check to see if the user has put more than 6 entries, there can only be a maximum of 7 entries for this parameter
            if len(identifiers.values) > 7:
                validationMessage(e1, identifiers)

            for valuePair in identifiers.values:
                if valuePair[0] and not valuePair[1].value:
                    validationMessage(e2, identifiers)
                if not valuePair[0] and valuePair[1].value:
                    validationMessage(e3, identifiers)

            idFieldNames = [value[1].value for value in identifiers.values if value[1].value]
            
            if  len(idFieldNames) > len(set(idFieldNames)):
                validationMessage(e4, identifiers)
            
        if sr.value:
            srObj = arcpy.SpatialReference()
            srObj.loadFromString(sr.value)
            if not srObj.type == 'Projected':
                validationMessage(e5, sr)

        return
    def execute(self, parameters, messages):
        to_meters = {'METERS': 1, 'KILOMETERS': 1000, 'YARDS': 0.9144018288, 'YARDSINT': 0.9144,
                    'MILES': 1609.3472186944, 'MILESINT': 1609.344,'FEET': 0.3048006096, 'FEETINT': 0.3048}

        #MESSAGES
        e1 = Message(210009, MsgType.ERR)
        e2 = Message(210008, MsgType.ERR)

        w1 = Message(210010, MsgType.WRN)
        w2 = Message(210011, MsgType.WRN)
        w3 = Message(210012, MsgType.WRN)

        m1 = Message(210013, MsgType.INF)
        m2 = Message(210014, MsgType.INF)

        def generate_azimuth(azimuth_num, azimuth_def, total_azimuths):
            if azimuth_num == 0:
                azimuth = azimuth_def
            else:
                addition_factor = int(360/total_azimuths)
                azimuth = azimuth_def + (azimuth_num * addition_factor)
            if azimuth >= 360:
                azimuth = azimuth - 360
            return azimuth

        def create_sector(center: arcpy.PointGeometry, radius: float, beamwidth: float,
                        rotation: float = 0) -> arcpy.Polygon:
            """ Creates a circular segment "pie slice"
                Args:
                    center: the center of the circle
                    radius: the radius of the circle
                    beamwidth: the "width" of the segment (theta)
                    rotation: clockwise rotation from positive y-axis
            """

            left_side_azimuth = rotation - (beamwidth / 2.0)
            
            beamwidth = math.radians(beamwidth % 360)
            rotation = math.radians(left_side_azimuth % 360)
            
            # Ensure degrees and azimuth are 0 <= x < 360
            # When 0, beamwidth is omnidirectional so just do a buffer
            if beamwidth == 0:
                return center.buffer(distance=radius)

            point: dict = json.loads(center.JSON)
            x = point['x']
            y = point['y']
            z = point.get('z', None)
            m = point.get('m', None)

            a = [x, y]
            b = [x + math.sin(rotation) * radius, y + math.cos(rotation) * radius]
            c = [x + math.sin(rotation + beamwidth / 2) * radius, y + math.cos(rotation + beamwidth / 2) * radius]
            d = [x + math.sin(rotation + beamwidth) * radius, y + math.cos(rotation + beamwidth) * radius]

            payload = dict(spatialReference=point['spatialReference'],
                        hasZ=z is not None,
                        hasM=m is not None,
                        curveRings=[[
                            a,
                            b,
                            {"c": [d, c]},
                            a
                        ]])
            return arcpy.AsShape(payload, esri_json=True)

        def format_sites(tower_info, identifiers, latfield, lonfield, azimuth, azimuth_default, beamwidth, beamwidth_type, default_beamwidth, radius, default_radius_val, radius_unit):
            '''Creates new properly formatted table for cell site and sector creation using input parameters'''

            recCount = int(arcpy.GetCount_management(tower_info).getOutput(0))

            #value[0] is the identifier type, value[1].value is the name of the field in the input table
            identifier_fields_dict = {value[0]:value[1].value for value in identifiers}
            
            #Field descriptions for id fields to add to formatted table
            uniqueid_FO = ['UNIQUEID', 'TEXT', 'Unique ID', '100']

            #Order of keys important, do not change the order
            otherid_fields_description = {
                'SWITCH_ID': ['SWITCHID', 'TEXT', 'Switch ID', '50'],
                'SITE_ID' : ['SITEID', 'TEXT', 'Site ID', '50'],
                'SECTOR_ID' : ['SECTORID', 'TEXT', 'Sector ID', '50'],
                'LAC_ID' : ['LACID', 'TEXT', 'LAC ID', '50'],
                'CASCADE_ID' : ['CASCADEID', 'TEXT', 'Cascade ID', '50'],
                'CELL_ID' : ['CELLID', 'TEXT', 'Cell ID', '50']
            }

            #All formatted tables will have a least the unique identifier field
            format_id_fields_to_add = []
            format_id_fields_to_add.append(uniqueid_FO)

            #Add additional id field descriptions if the original table has them
            for idType, idFieldDesc in otherid_fields_description.items():
                if idType in identifier_fields_dict:
                    format_id_fields_to_add.append(idFieldDesc)            

            standard_fields_description = [
                ['SITEX', 'DOUBLE', 'Site X'],
                ['SITEY', 'DOUBLE', 'Site Y'],
                ['AZIMUTH', 'DOUBLE', 'Azimuth'],
                ['AZIMSRC', 'TEXT', 'Azimuth Source', '10'],
                ['BEAMWIDTH', 'DOUBLE', 'Beamwidth'],
                ['BEAMSRC', 'TEXT', 'Beamwidth Source', '10'],
                ['RADIUS', 'DOUBLE', 'Radius'],
                ['RADIUSUNIT', 'TEXT', 'Radius Unit', '20'],
                ['RADIUSSRC', 'TEXT', 'Radius Source', '10']
            ]
            
            #All the standard fields to be added to the formatted table are determined by this point
            ft = arcpy.CreateTable_management("in_memory", "formatted_table")
            arcpy.AddFields_management(ft, format_id_fields_to_add  +  standard_fields_description)

            # Generate a list of all of the original fields from the input table that contain data that will be mapped to the standard fields
            important_fieldnames = list(identifier_fields_dict.values()) + [latfield, lonfield, azimuth, beamwidth, radius]
            important_fieldnames = [fieldname for fieldname in important_fieldnames if fieldname]
            important_fieldnames_match = [fieldname.lower() for fieldname in important_fieldnames if fieldname]
            
            # Generate a list of all of the original fields (that will not be mapped) from the 
            # input table that contain data that will be preserved in the formatted table
            invalid_auxiliary_field_types = ['Geometry', 'Blob', 'GlobalID', 'Guid', 'OID', 'Raster']
            auxiliary_fields = [field for field in arcpy.ListFields(tower_info) if field.name.lower() not in important_fieldnames_match and field.type not in invalid_auxiliary_field_types]
            auxiliary_fields_names = [field.name for field in auxiliary_fields]

            #List of all of the standard field names after they have been added to the formatted table
            standard_field_names = [field.name.lower() for field in arcpy.ListFields("in_memory/formatted_table") if field.type != 'OID']
            standard_field_names_for_compare = [field.name.lower() for field in arcpy.ListFields("in_memory/formatted_table")]
            
            #Add original fields from input table to the formatted table
            auxFieldArgs = {}
            auxFieldArgs["in_table"] = "in_memory/formatted_table"

            formatted_auxiliary_fields = []
            for field in auxiliary_fields:
                auxFieldArgs["field_type"] = field.type
                auxFieldArgs["field_length"] = field.length
                auxFieldArgs["field_precision"] = field.precision
                auxFieldArgs["field_scale"] = field.scale
                fname = generateUniqueFieldName(standard_field_names_for_compare, field.name.lower())
                fname = arcpy.ValidateFieldName(fname, "in_memory")
                auxFieldArgs["field_name"] = fname
                auxFieldArgs["field_alias"] = field.aliasName
                arcpy.AddField_management(**auxFieldArgs)
                formatted_auxiliary_fields.append(auxFieldArgs["field_name"])

            #Generate the list of fields that cannot have nulls
            if azimuth:
                required_fields = [latfield, lonfield, azimuth]
            else:
                required_fields = [latfield, lonfield]

            #Generate SQL Clause
            no_null_clause = " AND ".join(['"{}" IS NOT NULL'.format(field) for field in required_fields])

            cleanInput = arcpy.MakeTableView_management(tower_info,"clean_input", no_null_clause)

            validCount = int(arcpy.GetCount_management(cleanInput).getOutput(0))
            invalidCount = recCount - validCount

            if validCount == 0:
                printMessage(e1)

            #Check to see if any records were removed because of null values
            if invalidCount:
                printMessage(w1,str(invalidCount))

            #Formatted table is now ready to receive data
            format_cursor = arcpy.da.InsertCursor("in_memory/formatted_table", standard_field_names + formatted_auxiliary_fields)
                 
            id_set = set()
            dupCount = 0
            invalidTypeCount = 0 
            with arcpy.da.SearchCursor(cleanInput, important_fieldnames + auxiliary_fields_names) as input_cursor:
                for row in input_cursor:
                    
                    row_values = []

                    #Convert each to to dict to make it easier to find important fieldnames
                    row = {key:value for key,value in zip(input_cursor.fields,row)}
                    
                    #Handle Identifier Fields
                    id_values = _handleIDs(otherid_fields_description,identifier_fields_dict, row)
                    row_values.extend(id_values)
                    
                    # Continue processing only if the id is unique (prevent duplicate ids) id_values[0] is the unique id value
                    if id_values[0] not in id_set:
                        id_set.add(id_values[0])
                    else:
                        dupCount += 1
                        continue

                    # Handle Latitude and Longitude Fields
                    latitude_val = row[latfield]
                    longitude_val = row[lonfield]

                    row_values.extend([longitude_val, latitude_val])

                    # Handle Azimuth Field
                    if azimuth:
                        row_values.extend([row[azimuth], "INPUT"])
                    else:
                        row_values.extend([None, "DEFAULT"])

                    # Handle Beamwidth Fields
                    if beamwidth:
                        beamwidth_val = row[beamwidth]

                        # If user specified half beamwidth then double the value
                        if beamwidth_type == "HALF_BEAMWIDTH":
                            beamwidth_val = float(row[beamwidth]) * 2

                        if beamwidth_val:
                            row_values.extend([beamwidth_val, "INPUT"])
                        else:
                            row_values.extend([default_beamwidth, "DEFAULT"])
                    else:
                        row_values.extend([default_beamwidth, "DEFAULT"])

                    # Handle Radius Fields
                    if radius:
                        radius_val = row[radius]
                        if radius_val:
                            row_values.extend([radius_val, radius_unit, "INPUT"])
                        else:
                            row_values.extend([default_radius_val, radius_unit, "DEFAULT"])
                    else:
                        row_values.extend([default_radius_val, radius_unit, "DEFAULT"])

                    # Handle Auxiliary Fields
                    row_values.extend([row[fieldname] for fieldname in auxiliary_fields_names])

                    #Save values to new formatted table
                    try:
                        format_cursor.insertRow(row_values)
                    except RuntimeError:
                        invalidTypeCount += 1

                #Check to see if any records were removed because of duplicate id
                if dupCount:
                    printMessage(w2,str(dupCount))
                if invalidTypeCount:
                    printMessage(w3,str(invalidTypeCount))

                del format_cursor
                del id_set
                arcpy.Delete_management(cleanInput)

            

            if not azimuth:
                xy_id_set = {} 
                with arcpy.da.SearchCursor("in_memory/formatted_table", ["UNIQUEID","SITEX", "SITEY"]) as cursor:
                    for row in cursor:
                        xy_id = str(row[1]) + "-" + str(row[2])
                        try:
                            xy_id_set[xy_id].append(row[0])
                        except KeyError:
                            xy_id_set[xy_id] = []
                            xy_id_set[xy_id].append(row[0])
                
                azimuth_list = []
                for id_group in xy_id_set.values():
                    total_azimuths = len(id_group)
                    for i, idval in enumerate(id_group):
                        azimuth_list.append(generate_azimuth(i, int(azimuth_default), total_azimuths))

                with arcpy.da.UpdateCursor("in_memory/formatted_table", "AZIMUTH") as cursor:
                    for i,row in enumerate(cursor):
                        row[0] = azimuth_list[i]
                        cursor.updateRow(row)

            return "in_memory/formatted_table", standard_field_names + formatted_auxiliary_fields
        #End format table function

        tower_info = parameters[0].valueAsText
        output_points = parameters[1].valueAsText
        output_sectors = parameters[2].valueAsText
        identifiers = parameters[3].value
        lonfield = parameters[4].valueAsText
        latfield = parameters[5].valueAsText
        inSR = parameters[6].valueAsText
        outSR = parameters[7].valueAsText
        azimuth = parameters[8].valueAsText
        azimuth_default = parameters[9].valueAsText
        beamwidth = parameters[10].valueAsText
        beamwidth_type = parameters[11].valueAsText
        default_beamwidth = parameters[12].valueAsText
        radius = parameters[13].valueAsText
        radius_unit = parameters[14].valueAsText
        default_radius_val = parameters[15].valueAsText

        srObj = arcpy.SpatialReference()
        srObj.loadFromString(outSR)
        if not srObj.type == 'Projected':
            printMessage(e2)
            return

        insrObj = arcpy.SpatialReference()
        insrObj.loadFromString(inSR)

        arcpy.env.overwriteOutput = True

        if not default_beamwidth:
            default_beamwidth = 90
        if not beamwidth_type:
            beamwidth_type = "FULL_BEAMWIDTH"
        if not radius_unit:
            radius_unit = 'MILES'
        if not default_radius_val:
            default_radius_val = 2

        
        arcpy.SetProgressorLabel(retrieveMessage(m2))
        #Format Input Table
        ft, ft_fields = format_sites(tower_info, identifiers, latfield, lonfield, azimuth, azimuth_default, beamwidth, beamwidth_type, default_beamwidth, radius, default_radius_val, radius_unit)

        #Create Site Points
        towers_gcs = arcpy.XYTableToPoint_management(ft, 'in_memory/sitesgcs','SITEX','SITEY',coordinate_system=insrObj)

        arcpy.Delete_management('in_memory/formatted_table')

        projected_towers = arcpy.env.scratchGDB + "\\sitesgcs_projected"

        cell_towers = arcpy.Project_management(towers_gcs, projected_towers, srObj)
        arcpy.Delete_management('in_memory/sitesgcs')

        sector_polys = arcpy.management.CreateFeatureclass(arcpy.env.scratchGDB,
                                                        'cell_sectors',
                                                        'POLYGON',
                                                        cell_towers[0],
                                                        spatial_reference=srObj)

        # For each tower, create sectors within the radius.
        cnt = arcpy.management.GetCount(cell_towers)
        increment = int(int(cnt[0]) / 10.0)
        if increment == 0:
            increment = 1
        arcpy.SetProgressor("Step", retrieveMessage(m1),  0, int(cnt[0]), increment)

        with arcpy.da.InsertCursor(sector_polys, ['SHAPE@'] + ft_fields) as poly_cursor, \
            arcpy.da.SearchCursor(cell_towers, ['SHAPE@'] + ft_fields) as scur:
            unit_multiplier = float(to_meters[radius_unit.upper()] / srObj.metersPerUnit)
            for i, row in enumerate(scur):
                pointGeom = row[0]
                row = dict(zip(scur.fields,row))
                if (i % increment) == 0:
                    arcpy.SetProgressorPosition(i + 1)

                antena_azimuth = row['azimuth']
                beamwidth = row['beamwidth']

                radius = row['radius']
                radial_dist = float(radius) * unit_multiplier

                sector_poly = create_sector(pointGeom, radial_dist, beamwidth, antena_azimuth)

                poly_cursor.insertRow([sector_poly] + [row[fieldname] for fieldname in ft_fields])

            arcpy.SetProgressorPosition(100)

        arcpy.CopyFeatures_management(projected_towers, output_points)
        arcpy.CopyFeatures_management(sector_polys,output_sectors)
        arcpy.Delete_management(sector_polys)
        arcpy.Delete_management(projected_towers)
            
        return      

class CellPhoneRecordsToFeatureClass(object):
    toolname = "CellPhoneRecords"
    def __init__(self):
        self.label = 'Cell Phone Records To Feature Class'
        self.helpContext = 75010001
        self.canRunInBackground = False
        self.category = 'Cell Phone Analysis'
    def getParameterInfo(self):

        param_0 = arcpy.Parameter(
            name = 'in_table',
            displayName = 'Input Phone Records Table',
            parameterType = 'Required',
            direction = 'Input',
            datatype = 'GPTableView'
        )

        param_1 = arcpy.Parameter(
            name = 'in_site_features',
            displayName = 'Input Cell Site Points',
            parameterType = 'Required',
            direction = 'Input',
            datatype = 'GPFeatureLayer'
        )

        param_1.filter.list = ['Point']

        param_2 = arcpy.Parameter(
            name = 'in_sector_features',
            displayName = 'Input Cell Site Sectors',
            parameterType = 'Required',
            direction = 'Input',
            datatype = 'GPFeatureLayer'
        )

        param_2.filter.list = ['Polygon']

        param_3 = arcpy.Parameter(
            name = 'out_site_feature_class',
            displayName = 'Output Phone Record Site Points',
            parameterType = 'Required',
            direction = 'Output',
            datatype = 'DEFeatureClass'
        )
        param_3.symbology = os.path.join(TEMPLATES_PATH, "cellSites.lyrx")

        param_4 = arcpy.Parameter(
            name = 'out_sector_feature_class',
            displayName = 'Output Phone Record Sectors',
            parameterType = 'Required',
            direction = 'Output',
            datatype = 'DEFeatureClass'
        )
        param_4.symbology = os.path.join(TEMPLATES_PATH, "callSectors.lyrx")

        param_5 = arcpy.Parameter(
            name= 'id_fields',
            displayName = 'Cell Sector ID Fields',
            parameterType = 'Required',
            direction = 'Input',
            datatype = 'GPValueTable'
        )

        param_5.parameterDependencies = [param_0.name]
        param_5.columns= [['GPString','ID Type'],['Field', 'Field']]
        param_5.filters[0].type = 'ValueList'
        param_5.filters[0].list =  ['UNIQUE_ID', 'SITE_ID', 'SECTOR_ID', 'SWITCH_ID', 'LAC_ID', 'CASCADE_ID', 'CELL_ID']
        param_5.filters[1].list = ['Short', 'Long', 'Single', 'Double', 'Text', "BIGINTEGER"]

        param_6 = arcpy.Parameter(
            name= 'subscriber_field',
            displayName = 'Subscriber ID Field',
            parameterType = 'Required',
            direction = 'Input',
            datatype = 'Field'
        )
        param_6.filter.list = ["Short", "Long", "Single", "Double", "Text", "BIGINTEGER"]

        param_7 = arcpy.Parameter(
            name= 'destination_field',
            displayName = 'Destination Phone Number Field',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'Field'
        )
        param_7.filter.list = ["Short", "Long", "Single", "Double", "Text", "BIGINTEGER"]

        param_8 = arcpy.Parameter(
            name= 'additional_id_fields',
            displayName = 'Additional Cell Sector ID Fields',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'GPValueTable'
        )

        param_8.parameterDependencies = [param_0.name]
        param_8.columns= [['GPString','ID Type'],['Field', 'Field']]
        param_8.filters[0].type = 'ValueList'
        param_8.filters[0].list =  ['UNIQUE_ID', 'SITE_ID', 'SECTOR_ID', 'SWITCH_ID', 'LAC_ID', 'CASCADE_ID', 'CELL_ID']
        param_8.filters[1].list = ['Short', 'Long', 'Single', 'Double', 'Text', "BIGINTEGER"]

        param_9 = arcpy.Parameter(
            name= 'start_time_field',
            displayName = 'Start Date and Time Field',
            parameterType = 'Optional',
            direction = 'Input',
            category = 'Call Duration Information',
            datatype = 'Field'
        )
        param_9.filter.list = ["Date", "TIMESTAMPOFFSET"]

        param_10 = arcpy.Parameter(
            name= 'duration_field',
            displayName = 'Duration Field',
            parameterType = 'Optional',
            direction = 'Input',
            category = 'Call Duration Information',
            datatype = 'Field'
        )
        param_10.filter.list = ["Short", "Long", "Single", "Double", "Text", "BIGINTEGER"]

        param_11 = arcpy.Parameter(
            name= 'end_time_field',
            displayName = 'End Date and Time Field',
            parameterType = 'Optional',
            direction = 'Input',
            category = 'Call Duration Information',
            datatype = 'Field'
        )
        param_11.filter.list = ["Date", "TIMESTAMPOFFSET"]


        param_12 = arcpy.Parameter(
            name= 'convert_utc',
            displayName = 'Convert UTC Dates to Local Time Zone',
            parameterType = 'Optional',
            direction = 'Input',
            category = 'Call Duration Information',
            datatype = 'GPBoolean'
        )
        param_12.filter.list = ["CONVERT", "NO_CONVERT"]
        param_12.value = "NO_CONVERT"

        param_13 = arcpy.Parameter(
            name= 'location_x_field',
            displayName = 'Estimated Phone Location X Field',
            parameterType = 'Optional',
            direction = 'Input',
            category = 'Estimated Phone Location Output Options',
            datatype = 'Field'
        )
        param_13.filter.list = ["Short", "Long", "Single", "Double", "Text", "BIGINTEGER"]

        param_14 = arcpy.Parameter(
            name= 'location_y_field',
            displayName = 'Estimated Phone Location Y Field',
            parameterType = 'Optional',
            direction = 'Input',
            category = 'Estimated Phone Location Output Options',
            datatype = 'Field'
        )
        param_14.filter.list = ["Short", "Long", "Single", "Double", "Text", "BIGINTEGER"]

        param_15 = arcpy.Parameter(
            name= 'location_coordinate_system',
            displayName = 'Estimated Phone Location Coordinate System',
            parameterType = 'Optional',
            direction = 'Input',
            category = 'Estimated Phone Location Output Options',
            datatype = 'GPCoordinateSystem'
        )
        param_15.value = arcpy.SpatialReference(4326)

        param_16 = arcpy.Parameter(
            name = 'out_call_points',
            displayName = 'Output Estimated Call Points',
            parameterType = 'Optional',
            direction = 'Output',
            category = 'Estimated Phone Location Output Options',
            datatype = 'DEFeatureClass'
        )
        param_16.symbology = os.path.join(TEMPLATES_PATH, "callEstXY.lyrx")

        param_17 = arcpy.Parameter(
            name= 'start_timing_distance_field',
            displayName = 'Start Timing Advance Distance Field',
            parameterType = 'Optional',
            direction = 'Input',
            category = 'Timing Advance Band Output Options',
            datatype = 'Field'
        )
        param_17.filter.list = ["Short", "Long", "Single", "Double", "Text", "BIGINTEGER"]

        param_18 = arcpy.Parameter(
            name= 'end_timing_distance_field',
            displayName = 'End Timing Advance Distance Field',
            parameterType = 'Optional',
            direction = 'Input',
            category = 'Timing Advance Band Output Options',
            datatype = 'Field'
        )
        param_18.filter.list = ["Short", "Long", "Single", "Double", "Text", "BIGINTEGER"]

        param_19 = arcpy.Parameter(
            name= 'timing_advance_unit',
            displayName = 'Timing Advance Distance Unit',
            parameterType = 'Optional',
            direction = 'Input',
            category = 'Timing Advance Band Output Options',
            datatype = 'GPString'
        )
        param_19.filter.list = ["KILOMETERS", "METERS", "MILESINT", "YARDSINT", "FEETINT", "MILES", "YARDS", "FEET"]
        param_19.value = 'MILES'

        param_20 = arcpy.Parameter(
            name= 'timing_band_width',
            displayName = 'Timing Advance Band Total Width',
            parameterType = 'Optional',
            direction = 'Input',
            category = 'Timing Advance Band Output Options',
            datatype = 'GPLinearUnit'
        )
        param_20.filter.list = ["Kilometers", "Meters", "MilesInt", "YardsInt", "FeetInt", "Miles", "Yards", "Feet"]
        param_20.value = '78.07 Meters'

        param_21 = arcpy.Parameter(
            name = 'out_timing_advance_bands',
            displayName = 'Output Timing Advance Bands',
            parameterType = 'Optional',
            direction = 'Output',
            category = 'Timing Advance Band Output Options',
            datatype = 'DEFeatureClass'
        )
        
        param_6.parameterDependencies= [param_0.name]
        param_7.parameterDependencies= [param_0.name]
        param_9.parameterDependencies= [param_0.name]
        param_10.parameterDependencies= [param_0.name]
        param_11.parameterDependencies= [param_0.name]
        param_13.parameterDependencies= [param_0.name]
        param_14.parameterDependencies= [param_0.name]
        param_17.parameterDependencies= [param_0.name]
        param_18.parameterDependencies= [param_0.name]

        return [param_0, param_1, param_2, param_3, param_4, param_5, param_6, param_7, param_8, param_9, param_10, param_11, param_12, param_13, param_14, param_15, param_16, param_17, param_18, param_19, param_20, param_21]
    def isLicensed(self):
        return True
    def updateParameters(self, parameters):
        inputCDR = parameters[0]
        outSites = parameters[3]
        outSectors = parameters[4]
        start_time_field = parameters[9]
        convert_utc_option = parameters[12]

        if not inputCDR.hasBeenValidated:
            outSiteName = set_output_name(inputCDR,"PhoneSites")
            if outSiteName and not outSites.altered: 
                outSites.value = outSiteName
            outSectorName = set_output_name(inputCDR,"PhoneSectors")
            if outSectorName and not outSectors.altered:
                outSectors.value = outSectorName
        if not outSites.hasBeenValidated:
            outSites.value = validate_output_name(outSites)
        if not outSectors.hasBeenValidated:
            outSectors.value = validate_output_name(outSectors)

        # Don't allow conversion if input date type is Timestamp Offset
        # We assume the user wants to use the offset values within the field
        if inputCDR.valueAsText and start_time_field.valueAsText:
            process_date_type = get_field_object_by_name(start_time_field.valueAsText,inputCDR.valueAsText).type.upper()
            if process_date_type == "TIMESTAMPOFFSET":
                convert_utc_option.enabled = False
            else:
                convert_utc_option.enabled = True
        else:
            convert_utc_option.enabled = True
        
        return
    def updateMessages(self, parameters):
        inputTable = parameters[0]
        identifiersList = [parameters[5], parameters[8]]
        start_time_field = parameters[9]
        end_time_field = parameters[11]


        #MESSAGES
        e1 = Message(210004, MsgType.ERR)
        e2 = Message(210005, MsgType.ERR)
        e3 = Message(210006, MsgType.ERR)
        e4 = Message(210007, MsgType.ERR)
        e5 = Message(210016, MsgType.ERR)
        e6 = Message(210033, MsgType.ERR)
        e7 = Message(210044, MsgType.ERR)

        primeIdentifiers = parameters[5]
        addIdentifiers = parameters[8]

        if addIdentifiers.values and primeIdentifiers.values and inputTable.value:
            primeIDTypes = [value[0] for value in primeIdentifiers.values if value[0]]
            addIDTypes = [value[0] for value in addIdentifiers.values if value[0]]

            if len(addIDTypes) == len(primeIDTypes):
                if not all(idType in addIDTypes for idType in primeIDTypes):
                    validationMessage(e5,addIdentifiers)
            else:
                validationMessage(e5,addIdentifiers)

            primeFieldValues = [value[1].value for value in primeIdentifiers.values if value[1]]
            addFieldValues = [value[1].value for value in addIdentifiers.values if value[1]]

            if set(primeFieldValues) == set(addFieldValues):
                validationMessage(e6, addIdentifiers)
        
        for identifiers in identifiersList:
            if identifiers.values and inputTable.value:
                # Check to see if the user has put more than 6 entries, there can only be a maximum of 7 entries for this parameter
                if len(identifiers.values) > 7:
                    validationMessage(e1,identifiers)

                for valuePair in identifiers.values:
                    if valuePair[0] and not valuePair[1].value:
                        validationMessage(e2,identifiers)
                    if not valuePair[0] and valuePair[1].value:
                        validationMessage(e3,identifiers)

                idFieldNames = [value[1].value for value in identifiers.values if value[1].value]
                
                if  len(idFieldNames) > len(set(idFieldNames)):
                    validationMessage(e4,identifiers)

        # If both start and end time field types are used make sure they are of the same type
        if inputTable.valueAsText \
            and start_time_field.valueAsText \
            and end_time_field.valueAsText:
            start_time_type = get_field_object_by_name(start_time_field.valueAsText,inputTable.valueAsText).type
            end_time_type = get_field_object_by_name(end_time_field.valueAsText,inputTable.valueAsText).type
            if start_time_type != end_time_type:
                validationMessage(e7,start_time_field,start_time_type,end_time_type)
                validationMessage(e7,end_time_field,start_time_type,end_time_type)
            else:
                start_time_field.clearMessage()
                end_time_field.clearMessage()

        return
    def execute(self, parameters, messages):
        #MESSAGES
        e1 = Message(210015, MsgType.ERR)

        w1 = Message(210017, MsgType.WRN)
        w2 = Message(210018, MsgType.WRN)

        w3 = Message(210019, MsgType.WRN)
        
        m1 = Message(210020, MsgType.INF)
        m2 = Message(210021, MsgType.INF)

        to_meters = {'METERS': 1, 'KILOMETERS': 1000, 'YARDS': 0.9144018288, 'YARDSINT': 0.9144,
                    'MILES': 1609.3472186944, 'MILESINT': 1609.344,'FEET': 0.3048006096, 'FEETINT': 0.3048}

        def create_ta_band(center: arcpy.PointGeometry, radius: float, beamwidth: float,
                        rotation: float = 0) -> arcpy.Polygon:
            """ Creates a arc at a specified distance and beamwidth
                Args:
                    center: the center of the circle
                    radius: the radius of the circle
                    beamwidth: the "width" of the segment (theta)
                    rotation: clockwise rotation from positive y-axis
            """

            left_side_azimuth = rotation - (beamwidth / 2.0)
            
            beamwidth = math.radians(beamwidth % 360)
            rotation = math.radians(left_side_azimuth % 360)

            point: dict = json.loads(center.JSON)
            x = point['x']
            y = point['y']
            z = point.get('z', None)
            m = point.get('m', None)

            left_start_point = [x + math.sin(rotation) * radius, y + math.cos(rotation) * radius]
            right_end_point = [x + math.sin(rotation + beamwidth) * radius, y + math.cos(rotation + beamwidth) * radius]

            # Ensure degrees and azimuth are 0 <= x < 360
            # When 0, beamwidth is omnidirectional so create a circle
            if beamwidth == 0:
                center_pair = [x,y]
                payload = dict(spatialReference=point['spatialReference'],
                            hasZ=z is not None,
                            hasM=m is not None,
                            curvePaths= [
                                [
                                    left_start_point,
                                    {"a":[right_end_point, center_pair,0,1]}
                                ]
                            ]
                            )
            else: # More likely scenario
                curve_midpoint = [x + math.sin(rotation + beamwidth / 2) * radius, y + math.cos(rotation + beamwidth / 2) * radius]
                payload = dict(spatialReference=point['spatialReference'],
                            hasZ=z is not None,
                            hasM=m is not None,
                            curvePaths= [
                                [
                                    left_start_point,
                                    {"c":[right_end_point, curve_midpoint]}
                                ]
                            ]
                            )
            
            return arcpy.AsShape(payload, esri_json=True)

        def create_band_feature_class(template_fc,ta_dist_unit,ta_band_total_width, output_sectors):
            sr_obj = arcpy.Describe(template_fc).spatialReference
            temp_bands = arcpy.management.CreateFeatureclass("memory", "out_bands",template=template_fc,geometry_type="POLYLINE",spatial_reference=sr_obj)
            
            # Generate a list of all of the original fields (that will not be mapped) from the 
            # input table that contain data that will be preserved in the formatted table
            invalid_field_types = ['Geometry', 'Blob', 'GlobalID', 'Guid', 'OID', 'Raster']
            other_fields = [field for field in arcpy.ListFields(template_fc) if field.type not in invalid_field_types]
            other_fields_names = [field.name.upper() for field in other_fields]
            calc_fields = ['SHAPE@']
            if 'TATYPE' in other_fields_names:
                other_fields_names.remove('TATYPE')
                calc_fields.append('TATYPE')

            ta_half_band_width_val = convert_locale_str_to_float(ta_band_total_width.split()[0]) / 2
            
            with arcpy.da.InsertCursor(temp_bands, calc_fields + other_fields_names) as poly_cursor, \
                arcpy.da.SearchCursor(template_fc, ['SHAPE@'] + other_fields_names) as scur:
                unit_multiplier = float(to_meters[ta_dist_unit.upper()] / sr_obj.metersPerUnit)
                buff_multiplier = float(to_meters[ta_band_total_width.split()[1].upper()] / sr_obj.metersPerUnit)
                for row in scur:
                    pointGeom = row[0]
                    row = dict(zip([f.upper() for f in scur.fields],row))

                    antena_azimuth = row['AZIMUTH']
                    beamwidth = row['BEAMWIDTH']
                    if antena_azimuth and beamwidth:
                        for timing_distance_type in ['TASTART', 'TAEND']:
                            if timing_distance_type in row:
                                timing_distance = row[timing_distance_type]
                                if timing_distance:
                                    timing_distance_converted = float(timing_distance) * unit_multiplier
                                    timing_distance_converted += (buff_multiplier * ta_half_band_width_val)
                                    sector_band = create_ta_band(pointGeom, timing_distance_converted, beamwidth, antena_azimuth)
                                    calc_values = [sector_band]
                                    if 'TATYPE' in calc_fields:
                                        td_type_value = 'START' if timing_distance_type == 'TASTART' else "END"
                                        calc_values.append(td_type_value)
                                    poly_cursor.insertRow(calc_values + [row[val] for val in other_fields_names])
            
            ta_half_band_width = f"{str(ta_half_band_width_val)} {ta_band_total_width.split()[1]}"
            buffered_bands = arcpy.analysis.PairwiseBuffer(
                                in_features=temp_bands,
                                out_feature_class="memory/out_band_buffers",
                                buffer_distance_or_field=ta_half_band_width,  # Total Width of 78.125 is default
                                dissolve_option="NONE",
                                dissolve_field=None,
                                method="PLANAR"
                            )
            
            arcpy.management.Delete(temp_bands)

            arcpy.management.DeleteField(buffered_bands,['BUFF_DIST', 'ORIG_FID'])

            return buffered_bands

        def format_calls(cdr,prime_identifiers,subscriber,add_identifiers, dest_phone, call_start, call_duration, call_end, phonelat, phonelon, ta_start_dist, ta_end_dist, utc_option):
            # To take a duration string formatted as HH:MM:SS and convert it to seconds
            def get_duration(durationString):
                if ',' in durationString:
                    durationString = durationString.replace(',','')
                # for HH:MM:SS formatted duration strings
                #Clean out all non-numeric characters
                durationString = "".join([c.replace(c,' ') if not c.isdigit() else c for c in durationString])
                durElements = durationString.split()
                if len(durElements) >= 3:
                    return int(durElements[0]) * 3600 + int(durElements[1]) * 60 + int(durElements[2])
                elif len(durElements) == 2:
                    return int(durElements[0]) * 60 + int(durElements[1])
                elif len(durElements) == 1:
                    return int(durElements[0])
                else:
                    return 0
            
            process_date_type = "DATE"
            if call_start:
                process_date_type = get_field_object_by_name(call_start,cdr).type.upper()

            recCount = int(arcpy.GetCount_management(cdr).getOutput(0))

            #value[0] is the identifier type, value[1].value is the name of the field in the input table
            prime_identifier_fields_dict = {value[0]:value[1].value for value in prime_identifiers}

            #Field descriptions for id fields to add to formatted table
            uniqueid_FO = ['UNIQUEID', 'TEXT', 'Unique ID', '100']

            #Order of keys important, do not change the order
            prime_id_fields_description = {
                'SWITCH_ID': ['SWITCHID', 'TEXT', 'Switch ID', '50'],
                'SITE_ID' : ['SITEID', 'TEXT', 'Site ID', '50'],
                'SECTOR_ID' : ['SECTORID', 'TEXT', 'Sector ID', '50'],
                'LAC_ID' : ['LACID', 'TEXT', 'LAC ID', '50'],
                'CASCADE_ID' : ['CASCADEID', 'TEXT', 'Cascade ID', '50'],
                'CELL_ID' : ['CELLID', 'TEXT', 'Cell ID', '50']
            }

            #All formatted tables will have a least the unique identifier field
            format_id_fields_to_add = []
            format_id_fields_to_add.append(uniqueid_FO)

            #Add additional id field descriptions if the original table has them
            for idType, idFieldDesc in prime_id_fields_description.items():
                if idType in prime_identifier_fields_dict:
                    format_id_fields_to_add.append(idFieldDesc)

            #If user has specified additional combination of ID values map them to the formatted table
            add_identifier_fields_dict = {}
            if add_identifiers:
                add_identifier_fields_dict = {value[0]:value[1].value for value in add_identifiers}

                #ID Type Field
                format_id_fields_to_add.append(["IDTYPE","TEXT", "ID Type", "10"])

            standard_fields_description = []

            #All tables must have a subscriber ID (likely phone number)
            subscriberid_FO = ['SUBSCRIBER', 'TEXT', 'Subscriber', '20']
            standard_fields_description.append(subscriberid_FO)

            if dest_phone:
                destphone_FO = ['DESTPHONE', 'TEXT', 'Destination', '20']
                standard_fields_description.append(destphone_FO)

            if call_start:
                callstart_FO = ['STARTTIME', process_date_type, 'Start Time']
                standard_fields_description.append(callstart_FO)

            if call_end or call_duration:
                call_duration_FO = ['DURATION', 'LONG', 'Duration (seconds)']
                callend_FO = ['ENDTIME', process_date_type, 'End Time']
                standard_fields_description.extend([call_duration_FO,callend_FO])

            location_timestamp = call_start and add_identifiers and (call_end or call_duration)
            # Add a location timestamp for beginning or end of calls
            if location_timestamp:
                call_loc_time_FO = ['LOCTIME', process_date_type, 'Location Timestamp']
                standard_fields_description.append(call_loc_time_FO)

            if phonelon:
                phonelon_FO = ['PHONEX', 'DOUBLE', 'Estimated Phone X']
                standard_fields_description.append(phonelon_FO)

            if phonelat:
                phonelat_FO = ['PHONEY', 'DOUBLE', 'Estimated Phone Y']
                standard_fields_description.append(phonelat_FO)

            if ta_start_dist:
                ta_start_dist_FO = ['TASTART', 'DOUBLE', 'Timing Advance Start Distance']
                standard_fields_description.append(ta_start_dist_FO)

            if ta_end_dist:
                ta_end_dist_FO = ['TAEND', 'DOUBLE', 'Timing Advance End Distance']
                standard_fields_description.append(ta_end_dist_FO)

            if ta_start_dist and ta_end_dist:
                ta_type_FO = ['TATYPE', 'TEXT', 'Timing Advance Band Type', "10"]
                standard_fields_description.append(ta_type_FO)

            #All the standard fields to be added to the formatted table are determined by this point
            ft = arcpy.CreateTable_management("in_memory", "formatted_table")
            arcpy.AddFields_management(ft, format_id_fields_to_add  +  standard_fields_description)

            # Generate a list of all of the original fields from the input table that contain data that will be mapped to the standard fields
            idFieldnames = []
            if add_identifier_fields_dict:
                idFieldnames = list(prime_identifier_fields_dict.values()) + list(add_identifier_fields_dict.values())
            else:
                idFieldnames = list(prime_identifier_fields_dict.values())

            important_fieldnames = idFieldnames + [subscriber, dest_phone, call_start]
            if call_end or call_duration:
                important_fieldnames.extend([call_duration, call_end, phonelat, phonelon,ta_start_dist,ta_end_dist])
            else:
                important_fieldnames.extend([phonelat, phonelon, ta_start_dist, ta_end_dist])
            
            important_fieldnames = [fieldname for fieldname in important_fieldnames if fieldname]
            important_fieldnames_match = [fieldname.lower() for fieldname in important_fieldnames if fieldname]
            
            # Generate a list of all of the original fields (that will not be mapped) from the 
            # input table that contain data that will be preserved in the formatted table
            invalid_auxiliary_field_types = ['Geometry', 'Blob', 'GlobalID', 'Guid', 'OID', 'Raster']
            auxiliary_fields = [field for field in arcpy.ListFields(cdr) if field.name.lower() not in important_fieldnames_match and field.type not in invalid_auxiliary_field_types]

            # Remove any 'beamwidth' fields in the call record data to prevent conflicts with
            # the beamdwith fields that already in exist in the input sites/sectors
            # This causes any beamwidth fields in the call record data to be ignored            
            auxiliary_fields = [field for field in auxiliary_fields if field.name.lower() != "beamwidth"]
            auxiliary_fields_names = [field.name for field in auxiliary_fields]

            #List of all of the standard field names after they have been added to the formatted table
            standard_field_names = [field.name.lower() for field in arcpy.ListFields("in_memory/formatted_table") if field.type != 'OID']
            
            #Add original fields from input table to the formatted table
            auxFieldArgs = {}
            auxFieldArgs["in_table"] = "in_memory/formatted_table"

            formatted_auxiliary_fields = []
            for field in auxiliary_fields:
                auxFieldArgs["field_type"] = field.type
                auxFieldArgs["field_length"] = field.length
                auxFieldArgs["field_precision"] = field.precision
                auxFieldArgs["field_scale"] = field.scale
                fname = generateUniqueFieldName(standard_field_names, field.name.lower())
                fname = arcpy.ValidateFieldName(fname, "in_memory")
                auxFieldArgs["field_name"] = fname
                auxFieldArgs["field_alias"] = field.aliasName
                arcpy.AddField_management(**auxFieldArgs)
                formatted_auxiliary_fields.append(auxFieldArgs["field_name"])

            #Generate the list of fields that cannot have nulls

            #Generate SQL Clause
            no_null_clause = '"{}" IS NOT NULL'.format(subscriber)

            cleanInput = arcpy.MakeTableView_management(cdr,"clean_input", no_null_clause)

            validCount = int(arcpy.GetCount_management(cleanInput).getOutput(0))
            invalidCount = recCount - validCount

            if validCount == 0:
                printMessage(e1)
                sys.exit()

            #Check to see if any records were removed because of null values
            if invalidCount:
                printMessage(w1,str(invalidCount))

            #Formatted table is now ready to receive data
            format_cursor = arcpy.da.InsertCursor("in_memory/formatted_table", standard_field_names + formatted_auxiliary_fields)

            id_set = set()
            invalidTypeCount = 0 
            with arcpy.da.SearchCursor(cleanInput, important_fieldnames + auxiliary_fields_names) as input_cursor:
                for row in input_cursor:
                    
                    row_values = []

                    #Convert each to to dict to make it easier to find important fieldnames
                    row = {key:value for key,value in zip(input_cursor.fields,row)}
                    
                    #Handle Subscriber IDs (includes standardizing to remove all non-numeric characters)
                    subscriber_val = str(row[subscriber]).strip()
                    subscriber_val = subscriber_val[:-2] if subscriber_val[-2:] == '.0' else subscriber_val
                    subscriber_val = "".join([c for c in subscriber_val if c.isdigit()])
                    row_values.append(subscriber_val)

                    #Handle Destination IDs
                    if dest_phone:
                        destphone_val = str(row[dest_phone]).strip()
                        destphone_val = destphone_val[:-2] if destphone_val[-2:] == '.0' else destphone_val
                        destphone_val = "".join([c for c in destphone_val if c.isdigit()])
                        row_values.append(destphone_val)

                    #Handle Call Start Date
                    call_start_date_val = None
                    if call_start:
                        call_start_date_val = row[call_start]
                        #Convert from UTC to Local if user specified and if field type is not TIMESTAMPOFFSET
                        if process_date_type == "DATE" and utc_option and call_start_date_val:
                            call_start_date_val = call_start_date_val.replace(tzinfo=timezone.utc).astimezone(tz=None)
                        row_values.append(call_start_date_val)

                    #Handle Call End Date and Call Duration Values
                    call_end_date_val = None
                    call_duration_val = None
                    if call_end or call_duration:
                        #If user specified a call end field calculate value as is
                        if call_end:
                            call_end_date_val = row[call_end]

                            #Convert from UTC to Local if user specified and if field type is not TIMESTAMPOFFSET
                            if process_date_type == "DATE" and utc_option and call_end_date_val:
                                call_end_date_val = call_end_date_val.replace(tzinfo=timezone.utc).astimezone(tz=None)    

                        #Add values as is to the table
                        if call_duration:
                            try:
                                call_duration_val = int(row[call_duration])
                            except ValueError:
                                call_duration_val = get_duration(row[call_duration])
                            except TypeError:
                                call_duration_val = None
                        
                        #Calculate the end time dynamically by adding call duration to the start date
                        if not call_end_date_val:

                            if call_start_date_val:
                                if call_duration_val is None:
                                    call_duration_val = 0
                                call_end_date_val = call_start_date_val + td(seconds=call_duration_val)
                            else:
                                call_end_date_val = None

                        #Calculate the call duration time automatically by finding difference between start and end times
                        if not call_duration_val:

                            if call_end_date_val is not None and call_start_date_val is not None:
                                call_duration_val = int((call_end_date_val - call_start_date_val).total_seconds())
                            else:
                                call_duration_val = None                           

                        row_values.extend([call_duration_val,call_end_date_val])
                    
                    if location_timestamp:
                        location_timestamp_index = len(row_values)
                        row_values.append(None)

                    # Handle Latitude and Longitude Fields
                    if phonelon:
                        row_values.append(row[phonelon])
                    if phonelat:
                        row_values.append(row[phonelat])

                    if ta_start_dist:
                        row_values.append(row[ta_start_dist])
                    if ta_end_dist:
                        row_values.append(row[ta_end_dist])

                    if ta_start_dist and ta_end_dist:
                        # Populate TA Type as empty when initially setup, these values get populated later
                        row_values.append(None)

                    # Handle Auxiliary Fields
                    row_values.extend([row[fieldname] for fieldname in auxiliary_fields_names])

                    #Handle Prime Identifier Fields
                    id_values = []
                    prime_id_values = _handleIDs(prime_id_fields_description, prime_identifier_fields_dict, row)

                    #Handle Additional Identifier Field if present
                    if add_identifier_fields_dict:
                        id_values = prime_id_values + ["PRIMARY"]
                        
                        #Save primary id values to new formatted table
                        try:
                            if location_timestamp:
                                row_values[location_timestamp_index] = call_start_date_val
                            format_cursor.insertRow(id_values + row_values)
                        except RuntimeError:
                            invalidTypeCount += 1
                        
                        
                        add_id_values = _handleIDs(prime_id_fields_description, add_identifier_fields_dict, row)
                        if add_id_values[0] and (add_id_values[0] != prime_id_values[0]):
                            id_values = add_id_values + ["ADDITIONAL"]
                            # Save additional id values to new formatted table (creates an additional record)
                            try:
                                if location_timestamp:
                                    row_values[location_timestamp_index] = call_end_date_val
                                format_cursor.insertRow(id_values + row_values)
                            except RuntimeError:
                                invalidTypeCount += 1
                    else:
                        #Save primary id values to new formatted table (no field value like PRIMARY or ADDITIONAL needed because there are only primary id fields)
                        try:
                            format_cursor.insertRow(prime_id_values + row_values)
                        except RuntimeError:
                            invalidTypeCount += 1


            if invalidTypeCount:
                printMessage(w3,str(invalidTypeCount))

            del format_cursor
            arcpy.Delete_management(cleanInput)

            return 'in_memory/formatted_table', standard_field_names + formatted_auxiliary_fields

        call_records = parameters[0].valueAsText
        input_sites = parameters[1].valueAsText
        input_sectors = parameters[2].valueAsText
        output_sites = parameters[3].valueAsText
        output_sectors = parameters[4].valueAsText
        prim_identifiers = parameters[5].value
        subscriber_field = parameters[6].valueAsText
        dest_phone = parameters[7].valueAsText
        add_identifiers = parameters[8].value
        call_start = parameters[9].valueAsText
        call_duration = parameters[10].valueAsText
        call_end = parameters[11].valueAsText
        UTCoption = parameters[12].value
        phonelon = parameters[13].valueAsText
        phonelat = parameters[14].valueAsText
        phoneSR = parameters[15].valueAsText
        outputXYEst = parameters[16].valueAsText
        start_ta_dist = parameters[17].valueAsText
        end_ta_dist = parameters[18].valueAsText
        ta_dist_unit = parameters[19].valueAsText
        ta_band_width = parameters[20].valueAsText
        out_ta_bands = parameters[21].valueAsText

        if phoneSR:
            phoneSRObj = arcpy.SpatialReference()
            phoneSRObj.loadFromString(phoneSR)
        
        arcpy.SetProgressorLabel(retrieveMessage(m1))
        ft, ft_fields = format_calls(call_records,prim_identifiers,subscriber_field,add_identifiers, dest_phone, call_start, call_duration, call_end, phonelat, phonelon,start_ta_dist,end_ta_dist,UTCoption)

        arcpy.SetProgressorLabel(retrieveMessage(m2))
        sitePoints = arcpy.CopyFeatures_management(input_sites,arcpy.env.scratchGDB + "//sitePoints")
        siteSectors = arcpy.CopyFeatures_management(input_sectors,arcpy.env.scratchGDB + "//siteSectors")
        recs = arcpy.CopyRows_management(ft,arcpy.env.scratchGDB + "//calls")

        sp = arcpy.MakeTableView_management(sitePoints, "SitePoints")
        ss = arcpy.MakeTableView_management(siteSectors, "SiteSectors")
        pr = arcpy.MakeTableView_management(recs, "PhoneRecords")

        qtp = arcpy.MakeQueryTable_management(
                                [pr, sp],
                                "callsitedetailqt",
                                where_clause="calls.uniqueid = sitePoints.uniqueid")

        qts = arcpy.MakeQueryTable_management(
                                [pr, ss],
                                "callsectordetailqt",
                                where_clause="calls.uniqueid = siteSectors.uniqueid")

        outp = arcpy.CopyFeatures_management(qtp, "in_memory/outPoints")
        outp_ta = arcpy.CopyFeatures_management(qtp, "in_memory/outPointsTA")
        outs = arcpy.CopyFeatures_management(qts, "in_memory/outSectors")

        arcpy.DeleteField_management(outp,"UNIQUEID_1")
        arcpy.DeleteField_management(outs,"UNIQUEID_1")
        arcpy.DeleteField_management(outp,"TATYPE")
        arcpy.DeleteField_management(outs,"TATYPE")

        outPointsCount = int(arcpy.GetCount_management(outp).getOutput(0))
        outSectorsCount = int(arcpy.GetCount_management(outs).getOutput(0))
        if outPointsCount == 0 or outSectorsCount == 0:
            printMessage(w2)
        else:
            if phonelon and phonelat:
                #Remove any features that don't have an x or y
                arcpy.MakeFeatureLayer_management(outp,'cleanEst',where_clause="PHONEX IS NOT NULL AND PHONEY IS NOT NULL")
                arcpy.CopyFeatures_management('cleanEst',"in_memory/cleanLatLon")
                arcpy.XYTableToPoint_management("in_memory/cleanLatLon", outputXYEst, 'PHONEX','PHONEY',coordinate_system=phoneSRObj)
                arcpy.Delete_management("in_memory/cleanLatLon")
            if start_ta_dist or end_ta_dist:
                ta_bands_fc = create_band_feature_class(outp_ta,ta_dist_unit,ta_band_width, outs)
                arcpy.management.CopyFeatures(ta_bands_fc,out_ta_bands)
                arcpy.management.Delete(ta_bands_fc)

        #Create Final Output Feature Class
        arcpy.CopyFeatures_management(outp, output_sites)
        arcpy.CopyFeatures_management(outs, output_sectors)

        #Clean Up Memory and Scratch GDB
        arcpy.Delete_management(sp)
        arcpy.Delete_management(ss)
        arcpy.Delete_management(pr)
        arcpy.Delete_management(outp)
        arcpy.Delete_management(outp_ta)
        arcpy.Delete_management(outs)
        arcpy.Delete_management(sitePoints)
        arcpy.Delete_management(siteSectors)
        arcpy.Delete_management(recs)

        return

class GenerateCallLinks(object):
    def __init__(self):
        self.label = u'Generate Call Links'
        self.helpContext = 75010003
        self.canRunInBackground = False
        self.category = "Cell Phone Analysis"
    def getParameterInfo(self):
        param_0 = arcpy.Parameter(
            name = 'in_primary_features',
            displayName = 'Input Primary Phone Record Site Points or Sectors',
            parameterType = 'Required',
            direction = 'Input',
            datatype = 'GPFeatureLayer'
        )
        param_0.filter.list = ['Point','Polygon']

        param_1 = arcpy.Parameter(
            name = 'in_secondary_features',
            displayName = 'Input Secondary Phone Record Site Points or Sectors',
            parameterType = 'Required',
            direction = 'Input',
            datatype = 'GPFeatureLayer'
        )
        param_1.filter.list = ['Point','Polygon']

        param_2 = arcpy.Parameter(
            name = 'out_feature_class',
            displayName = 'Output Call Link Lines',
            parameterType = 'Required',
            direction = 'Output',
            datatype = 'DEFeatureClass'
        )

        param_3 = arcpy.Parameter(
            name = 'output_type',
            displayName = 'Output Type',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'GPString'
        )
        param_3.filter.list = ["SUMMARY", "DETAIL"]
        param_3.value = "SUMMARY"

        param_4 = arcpy.Parameter(
            name = 'primary_subscriber_field',
            displayName = 'Primary Phone Subscriber ID Field',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'Field'
        )
        param_4.filter.list = ['Text']

        param_5 = arcpy.Parameter(
            name = 'primary_destination_field',
            displayName = 'Primary Phone Call Destination Field',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'Field'
        )
        param_5.filter.list = ['Text']

        param_6 = arcpy.Parameter(
            name = 'primary_start_time_field',
            displayName = 'Primary Phone Call Start Date and Time Field',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'Field'
        )
        param_6.filter.list = ['Date', 'TIMESTAMPOFFSET']

        param_7 = arcpy.Parameter(
            name = 'secondary_subscriber_field',
            displayName = 'Secondary Phone Subscriber ID Field',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'Field'
        )
        param_7.filter.list = ['Text']

        param_8 = arcpy.Parameter(
            name = 'secondary_destination_field',
            displayName = 'Secondary Phone Destination Field',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'Field'
        )
        param_8.filter.list = ['Text']

        param_9 = arcpy.Parameter(
            name = 'secondary_start_time_field',
            displayName = 'Secondary Phone Call Start Date and Time Field',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'Field'
        )
        param_9.filter.list = ['Date', 'TIMESTAMPOFFSET']

        param_4.parameterDependencies = [param_0.name]
        param_5.parameterDependencies = [param_0.name]
        param_6.parameterDependencies = [param_0.name]

        param_7.parameterDependencies = [param_1.name]
        param_8.parameterDependencies = [param_1.name]
        param_9.parameterDependencies = [param_1.name]

        return [param_0, param_1, param_2, param_3, param_4, param_5, param_6, param_7, param_8, param_9]
    def isLicensed(self):
        return True
    def updateParameters(self, parameters):   
        inputCDR1 = parameters[0]
        inputCDR2 = parameters[1]
        out_lines = parameters[2]

        out_type = parameters[3]

        sub1 = parameters[4]
        dest1 = parameters[5]
        starttime1 = parameters[6]

        sub2 = parameters[7]
        dest2 = parameters[8]
        starttime2 = parameters[9]

        suspect1 = {
            'subscriber': sub1,
            'destphone': dest1,
            'starttime': starttime1
        }

        suspect2 = {
            'subscriber': sub2,
            'destphone': dest2,
            'starttime': starttime2
        }

        if not inputCDR1.hasBeenValidated:
            if inputCDR1.value:
                outLineName = set_output_name(inputCDR1, "CallLinks")
                if outLineName and not out_lines.altered:
                    out_lines.value = outLineName
                fieldDict = {field.name.lower():field.name for field in arcpy.ListFields(inputCDR1.value) if field.type in ['String', 'Date']}
                for k,v in suspect1.items():
                    if k in fieldDict:
                        if not v.value:
                            v.value = fieldDict[k]
                    else:
                        v.value = ''

        if not inputCDR2.hasBeenValidated:
            if inputCDR2.value:
                fieldDict = {field.name.lower():field.name for field in arcpy.ListFields(inputCDR2.value) if field.type in ['String', 'Date']}
                for k,v in suspect2.items():
                    if k in fieldDict:
                        if not v.value:
                            v.value = fieldDict[k]
                    else:
                        v.value = ''

        if not out_lines.hasBeenValidated:
            out_lines.value = validate_output_name(out_lines)

        return
    def updateMessages(self, parameters):
        inputCDR1 = parameters[0]
        inputCDR2 = parameters[1]
        out_lines = parameters[2]

        sub1 = parameters[4]
        dest1 = parameters[5]
        starttime1 = parameters[6]

        sub2 = parameters[7]
        dest2 = parameters[8]
        starttime2 = parameters[9]

        e1 = Message(210044, MsgType.ERR)

        suspect1 = {
            'input' : inputCDR1,
            'subscriber': sub1,
            'destphone': dest1,
            'starttime': starttime1
        }

        suspect2 = {
            'input' : inputCDR2,
            'subscriber': sub2,
            'destphone': dest2,
            'starttime': starttime2
        }
        for parameterGroup in [suspect1, suspect2]:
            if parameterGroup['input'].value:
                for key in ['subscriber', 'destphone', 'starttime']:
                    if not parameterGroup[key].value:
                        requireParameter(parameterGroup[key])

        # If both primary and secondary start time field types are used make sure they are of the same type
        if inputCDR1.valueAsText \
            and inputCDR2.valueAsText \
            and starttime1.valueAsText \
            and starttime2.valueAsText:
            prim_start_time_type = get_field_object_by_name(starttime1.valueAsText,inputCDR1.valueAsText).type
            sec_start_time_type = get_field_object_by_name(starttime2.valueAsText,inputCDR2.valueAsText).type
            if prim_start_time_type != sec_start_time_type:
                validationMessage(e1,starttime1,prim_start_time_type,sec_start_time_type)
                validationMessage(e1,starttime2,prim_start_time_type,sec_start_time_type)
            else:
                starttime1.clearMessage()
                starttime2.clearMessage()
        return
    def execute(self, parameters, messages):

        #MESSAGES
        m1 = Message(210022, MsgType.INF)

        def define_matching_calls(susp1,susp2):

            arcpy.AddField_management(susp1['fc'],"secmatchid","LONG")
            arcpy.AddField_management(susp2['fc'],"primmatchid","LONG")

            # Get the date type of the fields to be processed
            process_date_type = get_field_object_by_name(susp1['calltime'],susp1['fc']).type.upper()

            susp2OIDName = arcpy.Describe(susp2['fc']).OIDFieldName
            
            matchid = 0

            #Find most common subscriber ID in suspect 2 table
            where = '{} IS NOT NULL'.format(susp2['ID'])
            cursor = arcpy.da.SearchCursor(susp2['fc'], susp2['ID'], where_clause=where)
            id_list = [row[0] for row in cursor]
            susp2ID = max(set(id_list), key=id_list.count)
            del cursor

            susp1Query = "{} = '{}' And {} IS NOT NULL".format(susp1['dest'],susp2ID, susp1['calltime'])
            arcpy.MakeFeatureLayer_management(susp1['fc'], 'inpLayer', where_clause=susp1Query)
            with arcpy.da.UpdateCursor('inpLayer', [susp1['ID'], susp1['dest'], susp1['calltime'], "secmatchid"]) as susp1Cursor:
                susp2Layer = arcpy.MakeFeatureLayer_management(susp2['fc'],'selLayer')
                for origrow in susp1Cursor:
                    if origrow[2]:

                        #Setup query of susp2 calls using start date of susp1
                        susp1ID = origrow[0]
                        susp1Dest = origrow[1]
                        susp1Date = origrow[2]
                        beginDate = susp1Date - td(seconds=15)
                        endDate = susp1Date + td(seconds=15)
                        beginDateSQL = beginDate.strftime("%Y-%m-%d %H:%M:%S")
                        endDateSQL = endDate.strftime("%Y-%m-%d %H:%M:%S")

                        if process_date_type == "TIMESTAMPOFFSET":
                            begin_offset = beginDate.strftime("%z")
                            end_offset = endDate.strftime("%z")
                            begin_offset_sql_format = f"{begin_offset[0:3]}:{begin_offset[3:6]}" # Expected SQL timestamp offset format is ±HH:MM
                            end_offset_sql_format = f"{end_offset[0:3]}:{end_offset[3:6]}"
                            beginDateSQL = f"{beginDateSQL} {begin_offset_sql_format}"
                            endDateSQL = f"{endDateSQL} {end_offset_sql_format}"

                        timeQuery = "{} >= timestamp '{}' And {} <= timestamp '{}'".format(susp2['calltime'],beginDateSQL,susp2['calltime'],endDateSQL)
                        callQuery = " And {} = '{}'".format(susp2['dest'], susp1ID)

                        #Execute query
                        lyr = arcpy.SelectLayerByAttribute_management('selLayer',"NEW_SELECTION",timeQuery + callQuery)
                        count = int(arcpy.GetCount_management(lyr).getOutput(0))
                        if int(count) == 0:
                            #Match is not found
                            continue
                        else:
                            #Find nearest match based on time
                            cursor = arcpy.da.SearchCursor('selLayer', ['OID@', susp2['calltime']])
                            valueDict = {row[0]:abs((susp1Date - row[1]).total_seconds()) for row in cursor}
                            closestMatchPair = sorted(valueDict, key=valueDict.get)[:2]
                            #If both of the nearest calls started at the same time then its the same call from two different sectors
                            if len(closestMatchPair) == 2:
                                if not valueDict[closestMatchPair[0]] == valueDict[closestMatchPair[1]]:
                                    del closestMatchPair[-1]
                            del cursor

                            #Match is found
                            matchid += 1
                            
                            #Create a Match ID in Susp2 table
                            for closestMatch in closestMatchPair:
                                with arcpy.da.UpdateCursor('selLayer', "primmatchid", where_clause='{} = {}'.format(susp2OIDName, closestMatch)) as susp2cursor:
                                    for destrow in susp2cursor:
                                        destrow[0] = matchid
                                        susp2cursor.updateRow(destrow)


                            #Create a Match ID in Susp1 table
                            origrow[3] = matchid
                            susp1Cursor.updateRow(origrow)

        inputCDR1 = parameters[0].valueAsText
        inputCDR2 = parameters[1].valueAsText
        out_lines = parameters[2].valueAsText
        out_lines_param = parameters[2]

        out_type = parameters[3].valueAsText

        sub1 = parameters[4].valueAsText
        dest1 = parameters[5].valueAsText
        starttime1 = parameters[6].valueAsText

        sub2 = parameters[7].valueAsText
        dest2 = parameters[8].valueAsText
        starttime2 = parameters[9].valueAsText

        susp1 = {
            'fc': "memory/cdr1",
            'ID': sub1,
            'dest': dest1,
            'calltime': starttime1
        }

        susp2 = {
            'fc': "memory/cdr2",
            'ID': sub2,
            'dest': dest2,
            'calltime': starttime2
        }

        arcpy.CopyFeatures_management(inputCDR1, susp1['fc'])
        arcpy.CopyFeatures_management(inputCDR2, susp2['fc'])

        arcpy.SetProgressorLabel(retrieveMessage(m1))
        define_matching_calls(susp1, susp2)
        arcpy.ResetProgressor()

        if out_type == 'DETAIL':
            #Generate Unique Call Paths
            arcpy.analysis.GenerateOriginDestinationLinks(susp1['fc'], susp2['fc'], 'memory/outUniqLines', 
                                                            origin_group_field = 'secmatchid',
                                                            destination_group_field = 'primmatchid',
                                                            line_type = "PLANAR",
                                                            aggregate_links="NO_AGGREGATE")
            arcpy.DeleteField_management('memory/outUniqLines','COLOR_ID')
            arcpy.JoinField_management('memory/outUniqLines',"GROUP_ID",susp1['fc'], 'secmatchid')
            arcpy.CopyFeatures_management('memory/outUniqLines', out_lines)
            out_lines_param.symbology = os.path.join(TEMPLATES_PATH, "callDetail.lyrx")

        else:
            #Generate Summary Paths
            arcpy.analysis.GenerateOriginDestinationLinks(susp1['fc'], susp2['fc'], out_lines,
                                                            origin_group_field = 'secmatchid',
                                                            destination_group_field = 'primmatchid',
                                                            line_type = "PLANAR",
                                                            aggregate_links="AGGREGATE_OVERLAPPING",
                                                            sum_fields="primmatchid COUNT")

            # Remove undesired fields from output
            arcpy.DeleteField_management(out_lines,['COLOR_ID','COUNT_primmatchid'])
            out_lines_param.symbology = os.path.join(TEMPLATES_PATH, "callSummaryLines.lyrx")

        return

class FindSpaceTimeMatches(object):
    def __init__(self):
        self.label = u'Find Space Time Matches'
        self.helpContext = 75000004
        self.canRunInBackground = False
    def getParameterInfo(self):
        param_0 = arcpy.Parameter(
            name = 'in_primary_features',
            displayName = 'Input Primary Features',
            parameterType = 'Required',
            direction = 'Input',
            datatype = 'GPFeatureLayer'
        )

        param_1 = arcpy.Parameter(
            name = 'in_comparison_features',
            displayName = 'Input Comparison Features',
            parameterType = 'Required',
            direction = 'Input',
            datatype = 'GPFeatureLayer'
        )

        param_2 = arcpy.Parameter(
            name = 'out_primary_feature_class',
            displayName = 'Output Matched Primary Features',
            parameterType = 'Required',
            direction = 'Output',
            datatype = 'DEFeatureClass'
        )

        param_3 = arcpy.Parameter(
            name = 'out_comparison_feature_class',
            displayName = 'Output Matched Comparison Features',
            parameterType = 'Required',
            direction = 'Output',
            datatype = 'DEFeatureClass'
        )

        param_4 = arcpy.Parameter(
            name = 'match_types',
            displayName = 'Output Match Types',
            parameterType = 'Required',
            direction = 'Input',
            datatype = 'GPString',
            multiValue = True
        )

        param_4.filter.list = ["SPACE_AND_TIME", "SPACE_ONLY", "TIME_ONLY"]
        param_4.controlCLSID = "{172840BF-D385-4F83-80E8-2AC3B79EB0E0}"

        param_5 = arcpy.Parameter(
            name = 'search_radius',
            displayName = 'Search Radius',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'GPLinearUnit'
        )
        param_5.filter.list = ['Meters', 'Feet', 'FeetInt', 'Kilometers', 'Miles', 'MilesInt', 'Yards', 'YardsInt']
        param_5.value = 'Meters'

        param_6 = arcpy.Parameter(
            name = 'temporal_search_radius',
            displayName = 'Temporal Search Radius',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'GPTimeUnit'
        )
        param_6.filter.list = ['Seconds', 'Minutes', 'Hours', 'Days', 'Weeks']
        param_6.value = 'Minutes'

        param_7 = arcpy.Parameter(
            name = 'primary_start_date_field',
            displayName = 'Primary Features Start Date Field',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'Field'
        )
        param_7.filter.list = ['Date','TimestampOffset']

        param_8 = arcpy.Parameter(
            name = 'comparison_start_date_field',
            displayName = 'Comparison Features Start Date Field',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'Field'
        )
        param_8.filter.list = ['Date','TimestampOffset']

        param_9 = arcpy.Parameter(
            name = 'primary_end_date_field',
            displayName = 'Primary Features End Date Field',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'Field'
        )
        param_9.filter.list = ['Date','TimestampOffset']

        param_10 = arcpy.Parameter(
            name = 'comparison_end_date_field',
            displayName = 'Comparison Features End Date Field',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'Field'
        )
        param_10.filter.list = ['Date','TimestampOffset']

        param_7.parameterDependencies = [param_0.name]
        param_8.parameterDependencies = [param_1.name]

        param_9.parameterDependencies = [param_0.name]
        param_10.parameterDependencies = [param_1.name]

        return [param_0, param_1, param_2, param_3, param_4, param_5, param_6, param_7, param_8, param_9, param_10]
    def isLicensed(self):
        return True
    def updateParameters(self, parameters):
        fc1 = parameters[0]
        fc2 = parameters[1]
        outPrimFeatures = parameters[2]
        outCompFeatures = parameters[3]
        matchType = parameters[4]
        searchRadius = parameters[5]
        temporalRadius = parameters[6]
        starttime1 = parameters[7]
        starttime2 = parameters[8]
        endtime1 = parameters[9]
        endtime2 = parameters[10]

        paramGroups = {
            "SPACE_AND_TIME" : [searchRadius, temporalRadius, starttime1, starttime2, endtime1, endtime2],
            "SPACE_ONLY" : [searchRadius],
            "TIME_ONLY" : [temporalRadius, starttime1, starttime2, endtime1, endtime2]
        }

        fc1Times = {
            'starttime': starttime1,
            'endtime' : endtime1
        }

        fc2Times = {
            'starttime': starttime2,
            'endtime' : endtime2
        }

        from_python = not fc1.hasBeenValidated and fc1.altered and \
                      not fc2.hasBeenValidated and fc2.altered

        if fc1.value:
            if not fc1.hasBeenValidated:
                fieldDict = {field.name.lower():field.name for field in arcpy.ListFields(fc1.value) if field.type in ['String', 'Date']}
                shapeType = arcpy.Describe(fc1.value).shapeType
                if shapeType == "Polygon":
                    outPrimFeatures.symbology = os.path.join(TEMPLATES_PATH, "stMatchPolygon.lyrx")
                elif shapeType == "Point":
                    outPrimFeatures.symbology = os.path.join(TEMPLATES_PATH, "stMatchPoint.lyrx")
                else:
                    outPrimFeatures.symbology = os.path.join(TEMPLATES_PATH, "stMatchLine.lyrx")
                if not from_python:
                    # auto set field parameters if running tool in Pro
                    for k,v in fc1Times.items():
                        if k in fieldDict:
                            if not v.value:
                                v.value = fieldDict[k]
                        else:
                            v.value = ''

        if fc2.value:
            if not fc2.hasBeenValidated:
                shapeType = arcpy.Describe(fc2.value).shapeType
                fieldDict = {field.name.lower():field.name for field in arcpy.ListFields(fc2.value) if field.type in ['String', 'Date']}
                if shapeType == "Polygon":
                    outCompFeatures.symbology = os.path.join(TEMPLATES_PATH, "stMatchPolygon.lyrx")
                elif shapeType == "Point":
                    outCompFeatures.symbology = os.path.join(TEMPLATES_PATH, "stMatchPoint.lyrx")
                else:
                    outCompFeatures.symbology = os.path.join(TEMPLATES_PATH, "stMatchLine.lyrx")
                if not from_python:
                    # auto set field parameters if running tool in Pro
                    for k,v in fc2Times.items():
                        if k in fieldDict:
                            if not v.value:
                                v.value = fieldDict[k]
                        else:
                            v.value = ''

        if not fc1.hasBeenValidated:
            outPrimName = set_output_name(fc1,"PrimeMatch")
            if outPrimName and not outPrimFeatures.altered:
                outPrimFeatures.value = outPrimName
        if not fc2.hasBeenValidated:
            outCompName = set_output_name(fc2,"CompMatch")
            if outCompName and not outCompFeatures.altered:
                outCompFeatures.value = outCompName
        if not outPrimFeatures.hasBeenValidated:
            outPrimFeatures.value = validate_output_name(outPrimFeatures)
        if not outCompFeatures.hasBeenValidated:
            outCompFeatures.value = validate_output_name(outCompFeatures)

        if matchType.values:
            for match_type, params in paramGroups.items():
                if match_type not in matchType.values:
                    for param in params:
                        param.enabled = False
            for value in matchType.values:
                for param in paramGroups[value]:
                    param.enabled = True
        else:
            for paramGroup in paramGroups.values():
                for param in paramGroup:
                    param.enabled = False

        return
    def updateMessages(self, parameters):
        fc1 = parameters[0]
        fc2 = parameters[1]
        outPrimFeatures = parameters[2]
        outCompFeatures = parameters[3]
        matchType = parameters[4]
        searchRadius = parameters[5]
        temporalRadius = parameters[6]
        starttime1 = parameters[7]
        starttime2 = parameters[8]
        endtime1 = parameters[9]
        endtime2 = parameters[10]

        e1 = Message(210044, MsgType.ERR)

        paramGroups = {
            "SPACE_AND_TIME" : [searchRadius, temporalRadius, starttime1, starttime2],
            "SPACE_ONLY" : [searchRadius],
            "TIME_ONLY" : [temporalRadius, starttime1, starttime2]
        }

        if matchType.values:
            for match_type, params in paramGroups.items():
                if match_type not in matchType.values:
                    for param in params:
                        param.clearMessage()
            for value in matchType.values:
                for param in paramGroups[value]:
                    if not param.value:
                        requireParameter(param)
                    else:
                        param.clearMessage()
        else:
            for paramGroup in paramGroups.values():
                for param in paramGroup:
                    param.clearMessage()

        # Check if the start and end date fields are of the same type
        if starttime1.enabled and starttime1.valueAsText and starttime2.valueAsText:
            prim_start_time_type = get_field_object_by_name(starttime1.valueAsText,fc1.valueAsText).type.upper()
            comp_start_time_type = get_field_object_by_name(starttime2.valueAsText,fc1.valueAsText).type.upper()
            if prim_start_time_type != comp_start_time_type:
                validationMessage(e1,starttime1,prim_start_time_type,comp_start_time_type)
                validationMessage(e1,starttime2,prim_start_time_type,comp_start_time_type)
            else:
                starttime1.clearMessage()
                starttime2.clearMessage()
                
            if endtime1.valueAsText and endtime2.valueAsText:
                prim_end_time_type = get_field_object_by_name(endtime1.valueAsText,fc1.valueAsText).type.upper()
                comp_end_time_type = get_field_object_by_name(endtime2.valueAsText,fc1.valueAsText).type.upper()
                if prim_end_time_type != comp_end_time_type:
                    validationMessage(e1,endtime1,prim_end_time_type,comp_end_time_type)
                    validationMessage(e1,endtime2,prim_end_time_type,comp_end_time_type)
                else:
                    endtime1.clearMessage()
                    endtime2.clearMessage()

                    # Check to see if all the start and end date fields are of the same type
                    if len(set([prim_start_time_type, comp_start_time_type, prim_end_time_type, comp_end_time_type])) != 1:
                        field_type_list = [prim_start_time_type, comp_start_time_type, prim_end_time_type, comp_end_time_type]
                        validationMessage(e1,starttime1,",".join(field_type_list[:-1]),field_type_list[-1])
                        validationMessage(e1,starttime2,",".join(field_type_list[:-1]),field_type_list[-1])
                        validationMessage(e1,endtime1,",".join(field_type_list[:-1]),field_type_list[-1])
                        validationMessage(e1,endtime2,",".join(field_type_list[:-1]),field_type_list[-1])
                    else:
                        starttime1.clearMessage()
                        starttime2.clearMessage()
                        endtime1.clearMessage()
                        endtime2.clearMessage()
        else:
            starttime1.clearMessage()
            starttime2.clearMessage()
            endtime1.clearMessage()
            endtime2.clearMessage()
                

        return
    def execute(self, parameters, messages):

        def populate_match_table(inTable, valueDict, matchTag, idKey):
            inCursor = arcpy.da.InsertCursor(inTable, ["MATCHID", "MATCHTYPE", "linkid"])
            for k,v in valueDict.items():
                inCursor.insertRow([v['id'],matchTag, v[idKey]])
            del inCursor

        #MESSAGES
        w1 = Message(210028, MsgType.WRN)

        #Parameter Handling
        fc1 = parameters[0].valueAsText
        fc2 = parameters[1].valueAsText

        outPrimLayer = parameters[2].valueAsText
        outCompLayer = parameters[3].valueAsText
        matchType = parameters[4].values
        sRadius = parameters[5].valueAsText
        tRadius = parameters[6].valueAsText

        spaceTimeOption = False
        spaceOnlyOption = False
        timeOnlyOption = False

        if "SPACE_AND_TIME" in matchType:
            spaceTimeOption = True
        if "SPACE_ONLY" in matchType:
            spaceOnlyOption = True
        if "TIME_ONLY" in matchType:
            timeOnlyOption = True

        do_space_comparison = spaceTimeOption or spaceOnlyOption
        do_time_comparison = spaceTimeOption or timeOnlyOption

        prime = {
            'fc': arcpy.env.scratchGDB + "\\prime",
            'starttime': parameters[7].valueAsText,
            'endtime': parameters[9].valueAsText
        }

        comp = {
            'fc': arcpy.env.scratchGDB + "\\comp",
            'starttime': parameters[8].valueAsText,
            'endtime': parameters[10].valueAsText
        }

        #Convert Time Radius to Seconds:
        if do_time_comparison:
            time_radius_val = int(tRadius.split()[0])
            time_radius_unit = tRadius.split()[1]

            time_radius_val = convert_to_seconds(time_radius_val,time_radius_unit)

            time_delta_buffer = td(seconds=time_radius_val)


        arcpy.CopyFeatures_management(fc1, prime['fc'])
        arcpy.CopyFeatures_management(fc2, comp['fc'])

        prime_desc = arcpy.Describe(prime['fc'])
        comp_desc = arcpy.Describe(comp['fc'])

        primeOID = prime_desc.OIDFieldName
        compOID = comp_desc.OIDFieldName

        prime_sr_type = prime_desc.spatialReference.type
        comp_sr_type = prime_desc.spatialReference.type

        p1 = arcpy.MakeTableView_management(prime['fc'],"p1")
        p2 = arcpy.MakeTableView_management(comp['fc'],"p2")
        
        #region Space Match
        if do_space_comparison:
            space_match_option = "WITHIN_A_DISTANCE"
            if prime_sr_type == "Geographic" or comp_sr_type == "Geographic":
                space_match_option = "WITHIN_A_DISTANCE_GEODESIC"

            arcpy.analysis.SpatialJoin(comp['fc'],prime['fc'],"in_memory/link",
                                       join_operation="JOIN_ONE_TO_MANY",
                                       join_type="KEEP_COMMON",
                                       match_option=space_match_option,
                                       search_radius=sRadius)

            spaceDict = {}
            fieldsToSearch = ['TARGET_FID', 'JOIN_FID']
            with arcpy.da.SearchCursor("in_memory/link", fieldsToSearch) as spaceCursor:
                for row in spaceCursor:
                    tempID = '{0:015d}'.format(row[0]) + '{0:015d}'.format(row[1])
                    spaceDict[tempID] = {
                        'compID': row[0],
                        'primID': row[1]
                    }
            arcpy.Delete_management("in_memory/link")
        #endregion Space Match

        #region Time Match
        if do_time_comparison:
            fieldList = [
                ["prime." + primeOID, "Primary ObjectID"],
                ["comp." + compOID, "Comparison ObjectID"],
                ["prime." + prime['starttime'], "Primary Start Time"],
                ["comp." + comp['starttime'], "Comparison Start Time"]
            ]
            if prime['endtime']:
                fieldList.append(["prime." + prime['endtime'], "Primary End Time"])
            if comp['endtime']:
                fieldList.append(["comp." + comp['endtime'], "Comparison End Time"])
            qt = arcpy.MakeQueryTable_management([p1,p2],'qt',"USE_KEY_FIELDS", in_field=fieldList)

            timeDict = {}
            usedFields = [fieldInfo[0] for fieldInfo in fieldList]
            with arcpy.da.SearchCursor(qt, usedFields) as timeCursor:
                for row in timeCursor:
                    matchType = None
                    starttimep = row[2]
                    starttimec = row[3]
                    if prime['endtime']:
                        endtimep = row[4]
                        if comp['endtime']:
                            endtimec = row[5]
                        else:
                            endtimec = None
                    else:
                        endtimep = None
                        if comp['endtime']:
                            endtimec = row[4]
                        else:
                            endtimec = None

                    if starttimep and starttimec:
                        startBuffBegin = starttimep - time_delta_buffer
                        startBuffEnd = starttimep + time_delta_buffer
                    
                        #If primary layer has an end time calculate buffer values using temporal search buffer parameter
                        if endtimep:
                            endBuffBegin = endtimep - time_delta_buffer
                            endBuffEnd = endtimep + time_delta_buffer                 
                        #If both primary and secondary layers have time ranges
                        if endtimep and endtimec:
                            if starttimec <= endBuffEnd and endtimec >= startBuffBegin:
                                matchType = "T"
                        #If primary layer is a time range and the secondary layer is a point in time
                        elif endtimep and not endtimec:
                            if starttimec >= startBuffBegin and starttimec <= endBuffEnd:
                                matchType = "T"
                        #If primary layer is a point in time and secondary layer is a time range
                        elif not endtimep and endtimec:
                            if starttimec <= startBuffEnd and endtimec >= startBuffBegin:
                                matchType = "T"
                        #If both primary and secondary layers are a point in time
                        else:
                            if starttimec >= startBuffBegin and starttimec <= startBuffEnd:
                                matchType = "T"
                    if matchType == "T":
                        tempID = '{0:015d}'.format(row[1]) + '{0:015d}'.format(row[0])
                        timeDict[tempID] = {
                            'compID': row[1],
                            'primID': row[0]
                        }
            arcpy.Delete_management(qt)
        #endregion Time Match            

        #Intersect Id Dictionaries to find where both IDs exist in the Space and Time Searches
        if spaceTimeOption:
            mergedDict = {**spaceDict, **timeDict}
            spaceTimeKeyList = set(spaceDict.keys() & timeDict.keys())
            spaceTimeDict = {k:v for k,v in mergedDict.items() if k in spaceTimeKeyList}
            del mergedDict
            del spaceTimeKeyList
        
        if do_space_comparison and do_time_comparison:
            #Find only unique space matches
            spaceOnlyDict = {k:v for k,v in spaceDict.items() if k not in timeDict}
            #Only time matches
            timeOnlyDict = {k:v for k,v in timeDict.items() if k not in spaceDict}
    
            del spaceDict
            del timeDict
        else:
            if spaceOnlyOption:
                spaceOnlyDict = {k:v for k,v in spaceDict.items()}
            if timeOnlyOption:
                timeOnlyDict = {k:v for k,v in timeDict.items()}
        
        #Create Clean IDs
        counter = 1
        if spaceTimeOption:
            for k,v in spaceTimeDict.items():
                v['id'] = counter
                counter += 1

        if spaceOnlyOption:
            for k,v in spaceOnlyDict.items():
                v['id'] = counter
                counter += 1
        
        if timeOnlyOption:
            for k,v in timeOnlyDict.items():
                v['id'] = counter
                counter += 1
        
        #If all of the dicts are empty that means no matches were found. Exit the script.
        if counter == 1:
            printMessage(w1)
        else:
            #Create Tables to hold IDs and match type for primary and match features
            arcpy.CreateTable_management(arcpy.env.scratchGDB, "primMatchTable")
            arcpy.CreateTable_management(arcpy.env.scratchGDB, "compMatchTable")

            fieldsToAdd = [
                ["MATCHID", 'LONG', 'Match ID'],
                ["MATCHTYPE", 'TEXT', 'Match Type', 2],
                ["linkid", 'LONG', 'Link ID']
            ]
            primTable = arcpy.env.scratchGDB + "\\primMatchTable"
            compTable = arcpy.env.scratchGDB + "\\compMatchTable"
            arcpy.AddFields_management(primTable,fieldsToAdd)
            arcpy.AddFields_management(compTable,fieldsToAdd)

            if spaceTimeOption and spaceTimeDict:
                populate_match_table(primTable,spaceTimeDict,"B","primID")
                populate_match_table(compTable,spaceTimeDict,"B","compID")
                del spaceTimeDict
            
            if spaceOnlyOption and spaceOnlyDict:
                populate_match_table(primTable,spaceOnlyDict,"S","primID")
                populate_match_table(compTable,spaceOnlyDict,"S","compID")
                del spaceOnlyDict

            if timeOnlyOption and timeOnlyDict:
                populate_match_table(primTable,timeOnlyDict,"T","primID")
                populate_match_table(compTable,timeOnlyDict,"T","compID")
                del timeOnlyDict

            #Join original input tables to ID tables to create flat one to many output match feature classes
            pT = arcpy.MakeTableView_management(primTable, "primTable")
            cT = arcpy.MakeTableView_management(compTable, "compTable")

            primMatches = arcpy.MakeQueryTable_management([pT, p1],'primMatches', where_clause="primMatchTable.linkid = prime." + primeOID)
            compMatches = arcpy.MakeQueryTable_management([cT, p2],'compMatches', where_clause="compMatchTable.linkid = comp." + compOID)

            arcpy.CopyFeatures_management(primMatches,outPrimLayer)
            arcpy.CopyFeatures_management(compMatches,outCompLayer)

            #Get rid of extra fields
            primextraOIDFields = [field.name for field in arcpy.ListFields(outPrimLayer) if 'OBJECTID' in field.name and field.type != 'OID']
            compextraOIDFields = [field.name for field in arcpy.ListFields(outCompLayer) if 'OBJECTID' in field.name and field.type != 'OID']

            arcpy.DeleteField_management(outPrimLayer,['linkid'] + primextraOIDFields)
            arcpy.DeleteField_management(outCompLayer,['linkid'] + compextraOIDFields)

            #Clean up memory and Scratch GDB
            try:
                arcpy.Delete_management(prime['fc'])
                arcpy.Delete_management(comp['fc'])
                arcpy.Delete_management(primTable)
                arcpy.Delete_management(compTable)
                arcpy.Delete_management(primMatches)
                arcpy.Delete_management(compMatches)
                arcpy.Delete_management(p1)
                arcpy.Delete_management(p2)
                arcpy.Delete_management(pT)
                arcpy.Delete_management(cT)
            except:
                pass


        return

class FeatureTo3DByTime(object):
    def __init__(self):
        self.label = u'Feature To 3D By Time'
        self.helpContext = 75000003
        self.canRunInBackground = False
    def getParameterInfo(self):
        param_0 = arcpy.Parameter(
            name = 'in_features',
            displayName = 'Input Features',
            parameterType = 'Required',
            direction = 'Input',
            datatype = 'GPFeatureLayer'
        )
        param_0.filter.list = ["Point", "Polygon", "Polyline"]
        
        param_1 = arcpy.Parameter(
            name = 'out_feature_class',
            displayName = 'Output Feature Class',
            parameterType = 'Required',
            direction = 'Output',
            datatype = 'DEFeatureClass'
        )

        param_2 = arcpy.Parameter(
            name = 'date_field',
            displayName = 'Date Field',
            parameterType = 'Required',
            direction = 'Input',
            datatype = 'Field'
        )
        param_2.filter.list = ['Date', 'DATEONLY','TIMESTAMPOFFSET']
        param_2.parameterDependencies = [param_0.name]

        param_3 = arcpy.Parameter(
            name = 'time_z_unit',
            displayName = 'Time Z Interval and Unit',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'GPTimeUnit',
        )
        param_3.filter.list = ['Seconds', 'Minutes', 'Hours', 'Days', 'Weeks']
        param_3.value = "1 Seconds"

        param_4 = arcpy.Parameter(
            name = 'base_z',
            displayName = 'Base z-value',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'GPLong',
        )
        param_4.value = 0

        param_5 = arcpy.Parameter(
            name = 'base_date',
            displayName = 'Base Date and Time',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'GPDate',
        )
        return [param_0, param_1, param_2, param_3, param_4, param_5]
    def isLicensed(self):
        return True
    def updateParameters(self, parameters):
        inputFeatures = parameters[0]
        outFeatures = parameters[1]
        if not inputFeatures.hasBeenValidated:
            outName = set_output_name(inputFeatures,"ZTime")
            if outName and not outFeatures.altered:
                outFeatures.value = outName
        if not outFeatures.hasBeenValidated:
            outFeatures.value = validate_output_name(outFeatures)
        return
    def updateMessages(self, parameters):
        return
    def execute(self, parameters, messages):
        inputFeatures = parameters[0].valueAsText
        output3DFeatures = parameters[1].valueAsText
        inputTimeField = parameters[2].valueAsText
        zUnitandInterval = parameters[3].valueAsText
        baseZ = parameters[4].value
        baseDate = parameters[5].value

        # Get the date type of the fields to be processed
        process_date_type = get_field_object_by_name(inputTimeField,inputFeatures).type.upper()

        e1 = Message(210023, MsgType.ERR)

        tempFeatures = "memory/tempFeatures"
        arcpy.CopyFeatures_management(inputFeatures,tempFeatures)

        desc = arcpy.Describe(inputFeatures)

        if not baseZ:
            baseZ = 0

        if not zUnitandInterval:
            zUnitandInterval = '1 Seconds'

        zInterval = int(zUnitandInterval.split()[0])
        zUnit = zUnitandInterval.split()[1]           

        zUnitFactor = convert_to_seconds(zInterval,zUnit)

        #Generate a unique name for the output zField if needed
        existingFields = [field.name for field in arcpy.ListFields(tempFeatures)]
        matchTimeField = matchField("ZVALUE",existingFields)
        
        if matchTimeField is None:
            candidateFieldName = 'ZVALUE'
        else:
            candidateFieldName = matchTimeField
        
        outputZField = generateUniqueFieldName(existingFields, candidateFieldName)

        #Add Z time Field
        arcpy.AddField_management(tempFeatures, outputZField, "DOUBLE", field_alias="Z Value ({} {} Interval)".format(zInterval,zUnit))
        
        #If no base date is provided use the minimum date value in the input dataset
        if not baseDate:
            dateList = [row[0] for row in arcpy.da.SearchCursor(tempFeatures, inputTimeField) if row[0]]
            try:
                minTime = min(dateList)
            except Exception:
                 printMessage(e1)
                 sys.exit()
        else:
            minTime = baseDate

        if process_date_type == "TIMESTAMPOFFSET":
            minTime = minTime.astimezone()            

        #Load Z-Scores into feature class
        with arcpy.da.UpdateCursor(tempFeatures, [inputTimeField, outputZField]) as cursor:
            for row in cursor:
                inputTime = row[0]
                
                if inputTime:
                    # Convert Datetime Date values to Datetime objects if the field type is date only, this makes it possible
                    # to generate a time delta from which "total seconds are extracted below"
                    if process_date_type == "DATEONLY":
                        inputTime = dt.combine(inputTime,tm(hour=0,minute=0,second=0))
                    row[1] = (float((inputTime - minTime).total_seconds() / zUnitFactor)) + baseZ
                    cursor.updateRow(row)

        arcpy.management.CreateFeatureclass("memory",
                                            "temp3D",
                                            desc.shapeType.upper(),
                                            tempFeatures,
                                            has_z="ENABLED",
                                            spatial_reference=desc.spatialReference)

        invalid_auxiliary_field_types = ['Geometry', 'Blob', 'GlobalID', 'Guid', 'OID', 'Raster']
        reqFields = [field.name for field in arcpy.ListFields(tempFeatures) if field.type not in invalid_auxiliary_field_types]


        insCursor = arcpy.da.InsertCursor("memory/temp3D", ["SHAPE@"] + reqFields)

        reqFields.remove(outputZField)

        with arcpy.da.SearchCursor(tempFeatures, ["SHAPE@"] + reqFields + [outputZField]) as cursor:
            for row in cursor:
                shape = row[0]
                z_value = row[-1]
                if desc.shapeType.upper() == "POINT":
                    point = arcpy.Point(shape.centroid.X, shape.centroid.Y, z_value)
                    pointGeom = arcpy.PointGeometry(point, desc.spatialReference,True)
                    insCursor.insertRow([pointGeom] + list(row[1:]))
                else:
                    main_array = arcpy.Array()
                    for part in shape:
                        array = arcpy.Array()
                        for pnt in part:
                            if pnt:
                                pnt_z = arcpy.Point(pnt.X, pnt.Y, z_value)
                                array.add(pnt_z)
                        main_array.add(array)
                    if desc.shapeType.upper() == "POLYGON":
                        geom = arcpy.Polygon(main_array, desc.spatialReference,True)
                    else:
                        geom = arcpy.Polyline(main_array, desc.spatialReference,True)
                    insCursor.insertRow([geom] + list(row[1:]))
        del insCursor

        arcpy.CopyFeatures_management("memory/temp3D", output3DFeatures)

        #Delete Memory
        arcpy.Delete_management(tempFeatures)

        return

class GenerateSectorLines(object):
    def __init__(self):
        self.label = u'Generate Sector Lines'
        self.helpContext = 75010004
        self.category = 'Cell Phone Analysis'
        self.canRunInBackground = False
    def getParameterInfo(self):
        param_0 = arcpy.Parameter(
            name = 'in_site_features',
            displayName = 'Input Cell Site Points',
            parameterType = 'Required',
            direction = 'Input',
            datatype = 'GPFeatureLayer'
        )
        param_0.filter.list = ['Point']
        param_1 = arcpy.Parameter(
            name = 'out_feature_class',
            displayName = 'Output Sector Lines',
            parameterType = 'Required',
            direction = 'Output',
            datatype = 'DEFeatureClass'
        )
        param_1.symbology = os.path.join(TEMPLATES_PATH, "cellSectorLines.lyrx")
        return [param_0, param_1]
    def isLicensed(self):
        return True
    def updateParameters(self, parameters):
        inputFeatures = parameters[0]
        outFeatures = parameters[1]
        if not inputFeatures.hasBeenValidated:
            outName = set_output_name(inputFeatures,"Lines")
            if outName and not outFeatures.altered:
                outFeatures.value = outName
        if not outFeatures.hasBeenValidated:
            outFeatures.value = validate_output_name(outFeatures)
    def updateMessages(self, parameters):
        inputFeatures = parameters[0]
        reqFields = ['azimuth', 'radius','radiusunit','beamwidth']

        e1 = Message(210024, MsgType.ERR)

        if inputFeatures.value and not inputFeatures.hasBeenValidated:
            inFields = [field.name.lower() for field in arcpy.ListFields(inputFeatures.value)]
            #check to see if all of the required fields are in the input feature class
            if not set(reqFields) < set(inFields):
                validationMessage(e1,inputFeatures)

        return
    def execute(self, parameters, messages):
        inputFeatures = parameters[0].valueAsText
        outLines = parameters[1].valueAsText

        inSR = arcpy.Describe(inputFeatures).spatialReference

        to_meters = {'METERS': 1, 'KILOMETERS': 1000, 'YARDS': 0.9144018288, 'YARDSINT': 0.9144,
                    'MILES': 1609.3472186944, 'MILESINT': 1609.344,'FEET': 0.3048006096, 'FEETINT': 0.3048}
        reqFields = ['azimuth', 'radius','radiusunit','beamwidth']

        invalid_auxiliary_field_types = ['Geometry', 'Blob', 'GlobalID', 'Guid', 'OID', 'Raster']
        reqFields = [field.name for field in arcpy.ListFields(inputFeatures) if field.type not in invalid_auxiliary_field_types]

        sector_lines = arcpy.management.CreateFeatureclass("in_memory",
                                                'sector_lines',
                                                'POLYLINE',
                                                inputFeatures,
                                                spatial_reference=inSR)


        def calc_offset(x, y, distance, angle):
            '''Calculate the new point location from an existing point location
            using an offset distance.
            '''
            (offx, offy) = (distance * math.sin(math.radians(angle)), distance * math.cos(math.radians(angle)))
            return (x + offx, y + offy)

        def create_line(x, y, distance, angle, sr):
            '''Creates a line feature from two points.'''
            xoff, yoff = calc_offset(x, y, distance, angle)
            line = arcpy.Polyline(arcpy.Array([arcpy.Point(x, y), arcpy.Point(xoff, yoff)]), sr)
            return line

        with arcpy.da.SearchCursor(inputFeatures, ['SHAPE@XY'] + reqFields) as scur:
            for i, row in enumerate(scur):
                
                x1, y1 = row[0]
                
                row = {key.lower():value for key,value in zip(scur.fields,row)}

                antena_azimuth = row['azimuth']
                beamwidth = row['beamwidth'] / 2
                radius_unit = row['radiusunit']
                radius = row['radius']
                dist = (float(radius) * to_meters[radius_unit.upper()]) / inSR.metersPerUnit

                field_vals = [row[fieldname.lower()] for fieldname in reqFields]

                # Create the cell sector lines.
                with arcpy.da.InsertCursor(sector_lines, ['SHAPE@'] + reqFields) as lines_cursor:
                    
                    #Don't create sector lines if its an omnidirectional antenna
                    if beamwidth == 180:
                        continue

                    #lrow = {key.lower():value for key,value in zip(lines_cursor.fields,lrow)}
                    if antena_azimuth - beamwidth < 0:
                        azimuth1 = 360 - abs(antena_azimuth - beamwidth)
                    else:
                        azimuth1 = antena_azimuth - beamwidth

                    lines_cursor.insertRow([create_line(x1, y1, dist, azimuth1, inSR)] + field_vals)

                    if (antena_azimuth + beamwidth) > 360:
                        azimuth2 = (antena_azimuth + beamwidth) - 360
                    else:
                        azimuth2 = antena_azimuth + beamwidth

                    lines_cursor.insertRow([create_line(x1, y1, dist, azimuth2, inSR)] + field_vals)

        arcpy.CopyFeatures_management(sector_lines,outLines)

        return

class UpdateFeaturesWithIncidentRecords(object):
    def __init__(self):
        self.label = u'Update Features With Incident Records'
        self.helpContext = 75000009
        self.canRunInBackground = False
    def getParameterInfo(self):
        UPDATE_CATEGORY = "Define Record Update Matching"
        FIELD_PROCESSING_CATEGORY = "Fields"

        in_table = arcpy.Parameter(
            name = 'in_table',
            displayName = 'Input Table',
            parameterType = 'Required',
            direction = 'Input',
            datatype = 'GPTableView'
        )
        in_table.displayOrder = 0

        target_features = arcpy.Parameter(
            name = 'target_features',
            displayName = 'Target Features',
            parameterType = 'Required',
            direction = 'Input',
            datatype = ['GPFeatureLayer', 'GPTableView']
        )
        target_features.displayOrder = 2

        location_type = arcpy.Parameter(
            name = 'location_type',
            displayName = 'Location Type',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'GPString'
            
        )
        location_type.filter.list = ["COORDINATES", "ADDRESSES"]
        location_type.value = "COORDINATES"
        location_type.displayOrder = 4

        x_field = arcpy.Parameter(
            name = 'x_field',
            displayName = 'X Field (Longitude)',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'Field'
        )
        x_field.parameterDependencies = [in_table.name]
        x_field.filter.list = ["Short", "Long", "Float", "Double"]
        x_field.displayOrder = 5

        y_field = arcpy.Parameter(
            name = 'y_field',
            displayName = 'Y Field (Latitude)',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'Field'
        )
        y_field.parameterDependencies = [in_table.name]
        y_field.filter.list = ["Short", "Long", "Float", "Double"]
        y_field.displayOrder = 6

        coordinate_system = arcpy.Parameter(
            name= 'coordinate_system',
            displayName = 'Coordinate System',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'GPCoordinateSystem',
        )
        coordinate_system.value = arcpy.SpatialReference(4326)
        coordinate_system.displayOrder = 7

        address_type = arcpy.Parameter(
            name = 'address_type',
            displayName = 'Address Type',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'GPString'
        )
        address_type.filter.list = ["SINGLE_FIELD_ADDRESS", "MULTI_FIELD_ADDRESS"]
        address_type.value = "MULTI_FIELD_ADDRESS"
        address_type.enabled = False
        address_type.displayOrder = 8

        address_locator = arcpy.Parameter(
            name = 'address_locator',
            displayName = 'Address Locator',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'DEAddressLocator'
        )
        address_locator.enabled = False
        address_locator.displayOrder = 9

        address_fields = arcpy.Parameter(
            name = 'address_fields',
            displayName = 'Address Fields',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'GPValueTable'
        )
        address_fields.enabled = False
        address_fields.displayOrder = 10
        address_fields.parameterDependencies = [in_table.name]
        address_fields.columns= [['GPString','Locator Address Field'],['Field','Input Address Field']]
        address_fields.filters[1].list = ['Short', 'Long', 'Float', 'Double', 'Text']

        invalid_records_table = arcpy.Parameter(
            name = 'invalid_records_table',
            displayName = 'Invalid Records Table',
            parameterType = 'Optional',
            direction = 'Output',
            datatype = 'DETable'
        )
        invalid_records_table.displayOrder = 11

        where_clause = arcpy.Parameter(
            name = 'where_clause',
            displayName = 'Expression',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'GPSQLExpression'
        )
        where_clause.parameterDependencies = [in_table.name]
        where_clause.displayOrder = 1

        update_target = arcpy.Parameter(
            name = 'update_target',
            displayName = 'Update Existing Target Features',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'GPBoolean'
        )
        update_target.filter.list = ["UPDATE", "APPEND"]
        update_target.value = "APPEND"
        update_target.displayOrder = 12

        match_id_fields = arcpy.Parameter(
            name = 'match_fields',
            displayName = 'Match Fields',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'GPValueTable',
            category = UPDATE_CATEGORY
        )

        match_id_fields.parameterDependencies = [in_table.name, target_features.name]
        match_id_fields.columns= [['GPString','Input ID Field'],['GPString','Target ID Field']]
        match_id_fields.displayOrder = 13

        in_date_field = arcpy.Parameter(
            name = 'in_date_field',
            displayName = 'Input Table Last Modified Date Field',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'Field',
            category = UPDATE_CATEGORY
        )
        in_date_field.parameterDependencies = [in_table.name]
        in_date_field.filter.list = ["Date", "Text", "Short", "Long", "Float", "Double", "BigInteger"]
        in_date_field.enabled = False
        in_date_field.displayOrder = 14

        target_date_field = arcpy.Parameter(
            name = 'target_date_field',
            displayName = 'Target Features Last Modified Date Field',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'Field',
            category = UPDATE_CATEGORY
        )
        target_date_field.parameterDependencies = [target_features.name]
        target_date_field.filter.list = ["Date"]
        target_date_field.enabled = False
        target_date_field.displayOrder = 16

        update_matching = arcpy.Parameter(
            name = 'update_matching',
            displayName = 'Update Only Matching Features',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'GPBoolean',
            category = UPDATE_CATEGORY
        )
        update_matching.filter.list = ["UPDATE_MATCHING_ONLY", "UPSERT"]
        update_matching.value = "UPSERT"
        update_matching.enabled = False
        update_matching.displayOrder = 17

        update_geometry = arcpy.Parameter(
            name = 'update_geometry',
            displayName = 'Update Geometry for Existing Features',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'GPBoolean',
            category = UPDATE_CATEGORY
        )
        update_geometry.filter.list = ["UPDATE_GEOMETRY", "KEEP_GEOMETRY"]
        update_geometry.value = "UPDATE_GEOMETRY"
        update_geometry.enabled = False
        update_geometry.displayOrder = 18

        field_matching_type = arcpy.Parameter(
            name = 'field_matching_type',
            displayName = 'Field Matching Type',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'GPString',
            category = FIELD_PROCESSING_CATEGORY
        )
        field_matching_type.filter.list = ["AUTOMATIC", "FIELD_MAP"]
        field_matching_type.value = "AUTOMATIC"
        field_matching_type.displayOrder = 19

        field_mapping = arcpy.Parameter(
            name = 'field_mapping',
            displayName = 'Field Map',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'GPFieldMapping',
            category = FIELD_PROCESSING_CATEGORY
        )
        field_mapping.parameterDependencies = [in_table.name]
        field_mapping.enabled = False
        field_mapping.displayOrder = 20

        time_format = arcpy.Parameter(
            name = 'time_format',
            displayName = 'Time Format',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'GPString',
            category = UPDATE_CATEGORY
        )
        time_format.controlCLSID = "{7C78B948-8231-40C1-9CF2-BA9FA6DBAF83}"
        time_format.enabled = False
        time_format.displayOrder = 15

        updated_target_features = arcpy.Parameter(
            name = 'updated_target_features',
            displayName = 'Updated Target Features',
            parameterType = 'Derived',
            direction = 'Output',
            datatype = ['GPFeatureLayer', 'GPTableView']
        )
        updated_target_features.parameterDependencies = [target_features.name]

        convert_local_time = arcpy.Parameter(
            name= 'convert_local_time',
            displayName = 'Convert Dates to UTC Time Zone',
            parameterType = 'Optional',
            direction = 'Input',
            datatype = 'GPBoolean'
        )
        convert_local_time.filter.list = ["CONVERT", "NO_CONVERT"]
        convert_local_time.value = "CONVERT"
        convert_local_time.displayOrder = 3
        convert_local_time.enabled = False

        return [in_table, target_features, location_type, x_field, y_field, coordinate_system, address_locator, address_type, address_fields, invalid_records_table, where_clause, update_target, match_id_fields, in_date_field, target_date_field, update_matching, update_geometry, field_matching_type, field_mapping, time_format, updated_target_features, convert_local_time]
    def isLicensed(self):
        return True
    def updateParameters(self, parameters):
        in_table = parameters[0]
        target_features = parameters[1]
        location_type = parameters[2]
        x_field = parameters[3]
        y_field = parameters[4]
        coordinate_system = parameters[5]
        address_locator = parameters[6]
        address_type = parameters[7]
        address_fields = parameters[8]
        invalid_records_table = parameters[9]
        where_clause = parameters[10]
        update_target = parameters[11]
        match_id_fields = parameters[12]
        in_date_field = parameters[13]
        target_date_field = parameters[14]
        update_matching = parameters[15]
        update_geometry = parameters[16]
        field_matching_type = parameters[17]
        field_mapping = parameters[18]
        time_format = parameters[19]
        updated_target_features = parameters[20]
        convert_local_time = parameters[21]

        location_parameters = {
            "COORDINATES" : [x_field, y_field, coordinate_system],
            "ADDRESSES": [address_locator, address_type, address_fields]
        }

        all_loc_parameters = [location_type] + location_parameters['COORDINATES'] + location_parameters['ADDRESSES']

        upsert_parameters = {
            "REQUIRED" : [match_id_fields],
            "OPTIONAL" : [update_matching, update_geometry, in_date_field, target_date_field]
        }

        from_python = not in_table.hasBeenValidated and in_table.altered and \
                      not target_features.hasBeenValidated and target_features.altered

        def _get_full_path(incident_table):
            desc = arcpy.Describe(incident_table)
            url = desc.path

            if url.startswith('http'):
                try:
                    layer_id = int(desc.name)
                except:
                    name = desc.name[1:]
                    layer_id = ''
                    for c in name:
                        if c in ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']:
                            layer_id += c
                        else:
                            break
                    layer_id = int(layer_id)
                return url + "/{}".format(str(layer_id))
            else:
                return desc.catalogPath

        def resolve_field_mapping(input_table_param, target_table_param, current_fms):
            valid_field_types = ['SmallInteger', 'Integer', 'Single', 'Double', 'String', 'Guid', 'GlobalID', 'Date','DateOnly', 'TimeOnly', 'TimestampOffset', 'BigInteger']
            input_table_name = input_table_param.valueAsText
            input_table_field_names = {field.name.lower() : field.name for field in arcpy.ListFields(input_table_name) if field.type in valid_field_types}
            
            target_table_name = target_table_param.valueAsText
            target_table_fields = [field for field in arcpy.ListFields(target_table_name) if field.type in valid_field_types]

            current_fms_dict = {}

            for fm in current_fms.fieldMappings:
                if fm.inputFieldCount > 0:
                    input_field_name = fm.getInputFieldName(0)
                    input_table_name_from_fm = fm.getInputTableName(0)
                    if input_table_name_from_fm == input_table_name:
                        current_fms_dict[fm.outputField.name.lower()] = input_field_name


            upsert_field_names = []
            if update_target.value == True: #UPDATE existing target features is true
                if target_date_field.valueAsText:
                    upsert_field_names.append(target_date_field.valueAsText.lower())

                if match_id_fields.value:
                    upsert_field_names.extend([field[1].lower() for field in match_id_fields.values])

            target_table_fields = [field for field in target_table_fields if field.name.lower() not in upsert_field_names]

            fms = arcpy.FieldMappings()

            for field in target_table_fields:
                fm = arcpy.FieldMap()
                fm.outputField = field
                in_field_name = ""
                if field.name.lower() in current_fms_dict:
                    in_field_name = current_fms_dict[field.name.lower()]
                elif field.name.lower() in input_table_field_names:
                    in_field_name = input_table_field_names[field.name.lower()]
                if in_field_name:
                    fm.addInputField(input_table_name, in_field_name)

                fms.addFieldMap(fm)

            return fms

        def resolve_address_fields_param(param):
            try:
                locator_object = arcpy.geocoding.Locator(address_locator.valueAsText)
            except:
                # Don't execute the rest of the function because locator is invalid
                # Error will be raised in the updateMessages() validation routine
                return
            current_locator_fields = []
            if param.values:
                current_locator_fields = [field_pair[0] for field_pair in param.values]
            if address_type.value == "MULTI_FIELD_ADDRESS":
                if current_locator_fields != [field.name for field in locator_object.multilineInputFields]:
                    param.value = [[field.name,None] for field in locator_object.multilineInputFields]
            else:
                if current_locator_fields != [locator_object.singlelineInputField.name]: 
                    param.value = [[locator_object.singlelineInputField.name,None]]
            return

        valid_id_types = ['SmallInteger', 'Integer', 'String', 'Single', 'Double', 'Guid', 'GlobalID', 'BigInteger']

        if not in_table.hasBeenValidated and in_table.valueAsText:
            fields = [field.name for field in arcpy.ListFields(in_table.valueAsText) if field.type in valid_id_types]
            match_id_fields.filters[0].list = fields

        if not target_features.hasBeenValidated and target_features.valueAsText:
            target_type = arcpy.Describe(target_features.valueAsText).datasetType
            target_features.value = _get_full_path(target_features.valueAsText)
            fields = [field.name for field in arcpy.ListFields(target_features.value) if field.type in valid_id_types]
            match_id_fields.filters[1].list = fields
            if target_type == "FeatureClass":
                location_type.enabled = True
            else:
                # Target dataset is a table so remove all geometry related parameters
                for param in all_loc_parameters:
                    param.enabled = False

            # Option to convert to UTC only for hosted feature services
            convert_local_time.enabled = target_features.valueAsText.startswith('http')

        if not address_locator.hasBeenValidated and address_locator.valueAsText and not from_python:
            resolve_address_fields_param(address_fields)

        if not address_type.hasBeenValidated and address_locator.valueAsText and not from_python:
            resolve_address_fields_param(address_fields)

        if not address_locator.valueAsText:
            address_fields.value = None

        if location_type.enabled and location_type.value:
            for key, params in location_parameters.items():
                for param in params:
                    param.enabled = key == location_type.value
        else:
            for key, params in location_parameters.items():
                for param in params:
                    param.enabled = False

        for key, params in upsert_parameters.items():
            for param in params:
                param.enabled = update_target.value == True #UPDATE existing target features is true
        
        if location_type.enabled and update_target.value == True:
            update_geometry.enabled = True
        else:
            update_geometry.enabled = False

        field_mapping.enabled = field_matching_type.value == "FIELD_MAP"

        field_mapping_reset_button_clicked = not field_mapping.hasBeenValidated and not field_mapping.altered

        if field_mapping_reset_button_clicked or \
            not field_matching_type.hasBeenValidated or \
            not in_table.hasBeenValidated or \
            not target_features.hasBeenValidated or \
            not match_id_fields.hasBeenValidated or \
            not target_date_field.hasBeenValidated or \
            not update_target.hasBeenValidated:
                if field_matching_type.value == "FIELD_MAP" and \
                    in_table.value and \
                    target_features.value and not from_python:
                    field_mapping.value = resolve_field_mapping(in_table,target_features, field_mapping.value)
        
        upsert_time_format_cond = False
        if in_date_field.value:
            in_date_field_object = get_field_object_by_name(in_date_field.valueAsText,
                                                            in_table.value)
            if in_date_field_object:
                if in_date_field_object.type != "Date":
                    upsert_time_format_cond = True
                else:
                    upsert_time_format_cond = False
            else:
                upsert_time_format_cond = False
        else:
            upsert_time_format_cond = False

        fm_time_format_cond = False
        if field_matching_type.value == "FIELD_MAP" and field_mapping.value:
            fms = field_mapping.value
            for fm in fms.fieldMappings:
                if fm.inputFieldCount > 0:
                    input_field_name = fm.getInputFieldName(0)
                    input_field_object = get_field_object_by_name(input_field_name,
                                        in_table.valueAsText)
                    if input_field_object:
                        if fm.outputField.type == "Date" and \
                            input_field_object.type != "Date":
                            fm_time_format_cond = True
                            break
        else:
            fm_time_format_cond = False

        time_format.enabled = upsert_time_format_cond or fm_time_format_cond

        if location_type.value == "COORDINATES":
            set_auto_xy_fields(in_table, x_field, y_field)

        return
    def updateMessages(self, parameters):
        in_table = parameters[0]
        target_features = parameters[1]
        location_type = parameters[2]
        x_field = parameters[3]
        y_field = parameters[4]
        coordinate_system = parameters[5]
        address_locator = parameters[6]
        address_type = parameters[7]
        address_fields = parameters[8]
        invalid_records_table = parameters[9]
        where_clause = parameters[10]
        update_target = parameters[11]
        match_id_fields = parameters[12]
        in_date_field = parameters[13]
        target_date_field = parameters[14]
        update_matching = parameters[15]
        update_geometry = parameters[16]
        field_matching_type = parameters[17]
        field_mapping = parameters[18]
        time_format = parameters[19]
        updated_target_features = parameters[20]
        convert_local_time = parameters[21]
        
        e1 = Message(210034, MsgType.ERR)
        e2 = Message(210040, MsgType.ERR)
        e3 = Message(2618, MsgType.ERR)

        i1 = Message(210049, MsgType.INF)

        location_parameters = {
            "COORDINATES" : [x_field, y_field, coordinate_system],
            "ADDRESSES": [address_locator, address_type, address_fields]
        }

        upsert_parameters = {
            "REQUIRED" : [match_id_fields],
            "OPTIONAL" : [update_matching, update_geometry, in_date_field, target_date_field]
        }

        def get_required_input_fields():
            required_fields = []

            # Check to see if location type is enabled, if its not then no geometry fields are required
            # and empty list will be returned
            if location_type.enabled: 
                if location_type.value == "COORDINATES":
                    required_fields.extend([x_field.valueAsText, y_field.valueAsText])
                if location_type.value == "ADDRESSES" and address_fields.values:
                    in_address_fields = [field[1].value for field in address_fields.values]
                    required_fields.extend(in_address_fields)

            required_fields = [field for field in required_fields if field]

            return required_fields


        if target_features.valueAsText:
            desc = arcpy.Describe(target_features.valueAsText)
            if desc.dataType == "FeatureClass":
                if desc.shapeType != "Point":
                    validationMessage(e2, target_features)
                else:
                    target_features.clearMessage()
        # Location Type Parameter will be enabled if the target dataset is a feature class
        # If enabled.... make it a required parameter.
        if location_type.enabled:
            if not location_type.value:
                requireParameter(location_type)
        else:
            location_type.clearMessage()

        if location_type.enabled and location_type.value:
            for key, params in location_parameters.items():
                if key == location_type.value:
                    for param in params:
                        if not param.value:
                            requireParameter(param)
                else:
                    for param in params:
                        param.clearMessage()
            # Check to see that locator is valid and accessible
            if address_locator.valueAsText:
                try:
                    locator_object = arcpy.geocoding.Locator(address_locator.valueAsText)
                    address_locator.clearMessage()
                except:
                    validationMessage(e3,address_locator)
        else:
            for key, params in location_parameters.items():
                for param in params:
                    param.clearMessage()

        if update_target.value == True: #UPDATE existing target features is true
            for param in upsert_parameters['REQUIRED']:
                if not param.value:
                    requireParameter(param)

            if not target_date_field.valueAsText and in_date_field.valueAsText:
                requireParameter(target_date_field)
            else:
                target_date_field.clearMessage()

            if not in_date_field.valueAsText and target_date_field.valueAsText:
                requireParameter(in_date_field)
            else:
                in_date_field.clearMessage() 
        else:
            for param in upsert_parameters['REQUIRED']:
                param.clearMessage()

        if time_format.enabled and not time_format.value:
            requireParameter(time_format)
        else:
            time_format.clearMessage()

        if field_matching_type.value == "FIELD_MAP" and field_mapping.value:
            fms = field_mapping.value
            required_input_fields = get_required_input_fields()
            current_input_fields = []
            for fm in fms.fieldMappings:
                if fm.inputFieldCount >= 1:
                    input_field_name = fm.getInputFieldName(0)
                    current_input_fields.append(input_field_name)

            if required_input_fields:
                req_diff = list(set(required_input_fields) - set(current_input_fields))
                if req_diff:
                    req_diff_text = ", ".join(req_diff)
                    validationMessage(e1,field_mapping,messageVar1=req_diff_text)
                else:
                    field_mapping.clearMessage()

        if convert_local_time.enabled:
            try:
                token = arcpy.GetSigninToken()["token"]
                url = f"{target_features.valueAsText}?f=json&token={token}"
                fl_properties = requests.get(url).json()
                if "preferredTimeReference" in fl_properties:
                    if not fl_properties['preferredTimeReference']:
                        time_zone = fl_properties["dateFieldsTimeReference"]["timeZone"]
                    else:
                        time_zone = fl_properties["preferredTimeReference"]["timeZone"]

                    msg = retrieveMessage(i1, time_zone)
                    setInformativeMessage(target_features, msg)
                else:
                    convert_local_time.clearMessage()
            except:
                convert_local_time.clearMessage()
        
                
        return
    def execute(self, parameters, messages):
        import uuid

        #Tool parameters
        in_table = parameters[0].valueAsText
        target_features = parameters[1].valueAsText
        location_type = parameters[2].valueAsText
        x_field = parameters[3].valueAsText
        y_field = parameters[4].valueAsText
        coordinate_system = parameters[5].valueAsText
        address_locator = parameters[6].valueAsText
        address_type = parameters[7].valueAsText
        address_fields = parameters[8].values
        invalid_records_table = parameters[9].valueAsText
        where_clause = parameters[10].value
        update_target = parameters[11].value
        match_id_fields = parameters[12].values
        in_date_field = parameters[13].valueAsText
        target_date_field = parameters[14].valueAsText
        update_matching = parameters[15].value
        update_geometry = parameters[16].value
        field_matching_type = parameters[17].valueAsText
        field_mapping = parameters[18].value
        time_format = parameters[19].valueAsText
        convert_local_time = parameters[21].value

        e1 = Message(210035, MsgType.ERR)
        w1 = Message(210036, MsgType.WRN)
        w2 = Message(595, MsgType.WRN)
        w3 = Message(210043, MsgType.WRN)
        m1 = Message(210037, MsgType.INF)
        m2 = Message(210038, MsgType.INF)
        m3 = Message(210039, MsgType.INF)
        m4 = Message(210041, MsgType.INF)
        m5 = Message(210042, MsgType.INF)

        def add_source_oid_field(fms, source_table, output_field_name, in_table_oid_field):
            #Add Source ID field to track source objectid for invalid records table
            fm = arcpy.FieldMap()
            output_oid_field = arcpy.Field()
            output_oid_field.aliasName = "Source OID"
            output_oid_field.name = output_field_name
            output_oid_field.type = "Integer"
            fm.outputField = output_oid_field
            fm.addInputField(source_table, in_table_oid_field)
            fms.addFieldMap(fm)
            return fms

        def get_required_input_fields():
            required_fields = []

            if location_type == "COORDINATES":
                required_fields.extend([x_field, y_field])
            if location_type == "ADDRESSES":
                in_address_fields = [field[1].value for field in address_fields]
                required_fields.extend(in_address_fields)

            required_fields = [field for field in required_fields if field]

            return required_fields

        def check_required_fields(fms, required_input_fields):
            current_input_fields = []
            for fm in fms.fieldMappings:
                input_field_name = fm.getInputFieldName(0)
                current_input_fields.append(input_field_name)

            req_diff = list(set(required_input_fields) - set(current_input_fields))
            if req_diff:
                # TODO Setup error message id
                req_diff_text = ", ".join(req_diff)
                printMessage(e1,req_diff_text)

        def get_time_conversion_fields(fms: arcpy.FieldMappings, in_table):
            field_list = []
            for fm in fms.fieldMappings:
                input_field_name = fm.getInputFieldName(0)
                input_field_object = get_field_object_by_name(input_field_name,
                                    in_table)
                if input_field_object:
                    if fm.outputField.type == "Date" and \
                        input_field_object.type != "Date":
                        field_list.append(fm.outputField.name)
            return field_list

        def revert_time_fields_to_text(fms: arcpy.FieldMappings, time_fields):
            string_fms = fms.exportToString().split(";")
            new_fms = []
            for fm in string_fms:
                fm_parts = fm.split(",")
                output_field_info = fm_parts[0]
                out_field_name = output_field_info.split()[0]
                if out_field_name in time_fields:
                    field_parts = output_field_info.split()
                    field_parts[-4] = "255" #Count from right because field alias at position 2 can have spaces
                    field_parts[-3] = "Text"
                    new_input_field_info = " ".join(field_parts)
                    fm_parts[0] = new_input_field_info
                    new_field_map = ",".join(fm_parts)
                    new_fms.append(new_field_map)
                else:
                    new_fms.append(fm)

            new_fms_string = ";".join(new_fms)
            
            return new_fms_string

        def convert_to_time_fields(time_format, conversion_fields, temp_table):
            for field in conversion_fields:
                out_field_name = "time_" + uuid.uuid4().hex[:10]
                arcpy.management.ConvertTimeField(in_table=temp_table,
                                                input_time_field=field,
                                                input_time_format=time_format,
                                                output_time_field=out_field_name,
                                                output_time_type="DATE")

                arcpy.management.DeleteField(temp_table, field)
                arcpy.management.AlterField(temp_table,out_field_name,field)

            return

        def remove_empty_source_field_maps(fms):
            new_fms = arcpy.FieldMappings()
            empty_field_maps_indexes = []
            for fm in fms.fieldMappings:
                if fm.inputFieldCount > 0:
                    new_fms.addFieldMap(fm)

            return new_fms
        
        def get_field_map_error_id_list(rslt: arcpy.Result):
            error_list = []
            error_595 = "000595"
            if rslt.maxSeverity == 1:
                warning_msg_list = rslt.getMessages(1).splitlines()
                warning_595_msg_list = [msg for msg in warning_msg_list if error_595 in msg]
                if warning_595_msg_list:
                    warning_595_msg = warning_595_msg_list[0]

                    msg_parts = warning_595_msg.split()
                    error_file = ""
                    part_sep_max_count = 0
                    for part in msg_parts:
                        part_sep_count = part.strip().count(os.path.sep)
                        if part_sep_count > part_sep_max_count:
                            part_sep_max_count = part_sep_count
                            error_file = part

                    if os.path.isfile(error_file):
                        error_list = []
                        with open(error_file, 'r') as f:
                            for line in f:
                                error_list.append(int(line.strip()))
                        error_list = list(set(error_list))
            
            return error_list
        
        def preliminary_incident_record_screening(tbl, source_id, invalid_records_dict, address_fields, lat_field, lon_field, mod_date_field, targ_id_fields, fm_errors):
            targ_id_dict = {}
            date_fields = [field.name for field in arcpy.ListFields(tbl) if field.type == 'Date']
            fields_to_scan = [source_id]
            if address_fields:
                fields_to_scan.extend(address_fields)
            if lat_field:
                fields_to_scan.append(lat_field)
            if lon_field:
                fields_to_scan.append(lon_field)
            if mod_date_field:
                date_fields = [date_field for date_field in date_fields if date_field != mod_date_field]
                fields_to_scan.append(mod_date_field)
            if date_fields:
                fields_to_scan.extend(date_fields)
            if targ_id_fields:
                fields_to_scan.extend(targ_id_fields)
            table_to_scan = tbl
            if mod_date_field:
                table_to_scan = arcpy.management.Sort(tbl, "in_memory/incident_by_date", [[mod_date_field,"DESCENDING"]])
                arcpy.management.Delete(tbl)

            with arcpy.da.UpdateCursor(table_to_scan,fields_to_scan) as cursor:
                for row in cursor:
                    row_dict = {key:value for key,value in zip(cursor.fields,row)}

                    source_id_val = row_dict[source_id]

                    if fm_errors:
                        if source_id_val in fm_errors:
                            invalid_records_dict['BAD_FM'].append(source_id_val)
                            cursor.deleteRow()
                            continue

                    if address_fields:
                        address_field_vals = [row_dict[field_name] for field_name in address_fields]
                        # check to see if all the input address field vals are empty/null
                        if not any(address_field_vals):
                            invalid_records_dict['NULL_ADDR'].append(source_id_val)
                            cursor.deleteRow()
                            continue

                    if lat_field:
                        lat_field_val = row_dict[lat_field]
                        if not lat_field_val:
                            invalid_records_dict['NULL_XY'].append(source_id_val)
                            cursor.deleteRow()
                            continue

                    if lon_field:
                        lon_field_val = row_dict[lon_field]
                        if not lon_field_val:
                            invalid_records_dict['NULL_XY'].append(source_id_val)
                            cursor.deleteRow()
                            continue

                    if mod_date_field:
                        mod_date_field_val = row_dict[mod_date_field]
                        if not mod_date_field_val or \
                            str(mod_date_field_val) == "1899-12-30 00:00:00" or \
                            str(mod_date_field_val) == "2001-01-01 00:00:00":
                            invalid_records_dict['BAD_DATE'].append(source_id_val)
                            cursor.deleteRow()
                            continue
                    
                    if date_fields:
                        date_field_vals = [row_dict[field_name] for field_name in date_fields]
                        invalid_date_found = False
                        for val in date_field_vals:
                            if str(val) == "1899-12-30 00:00:00" or \
                                str(val) == "2001-01-01 00:00:00":
                                invalid_date_found = True
                                invalid_records_dict['BAD_DATE'].append(source_id_val)
                                cursor.deleteRow()
                                break
                        if invalid_date_found:
                            continue

                    if targ_id_fields:
                        id_field_vals = [row_dict[field_name] for field_name in targ_id_fields]
                        row_key_parts = []
                        invalid_id_found = False
                        for val in id_field_vals:
                            if isinstance(val, str):
                                val = val.strip()
                                if not val:
                                    invalid_id_found = True
                                    invalid_records_dict['NULL_ID'].append(source_id_val)
                                    cursor.deleteRow()
                                    break
                                else:
                                    row_key_parts.append(val)

                            else:
                                if not val:
                                    invalid_id_found = True
                                    invalid_records_dict['NULL_ID'].append(source_id_val)
                                    cursor.deleteRow()
                                    break
                                else:
                                    row_key_parts.append(val)
                            # Check for an remove duplicate records based on id
                            if len(row_key_parts) == len(id_field_vals):
                                row_key = "_".join([str(val) for val in row_key_parts])
                                if row_key in targ_id_dict:
                                    invalid_id_found = True
                                    invalid_records_dict['DUP_ID'].append(source_id_val)
                                    cursor.deleteRow()
                                    break
                                else:
                                    targ_id_dict[row_key] = row_key
                            if invalid_id_found:
                                continue


            return table_to_scan

        def create_address_geometry(tbl, locator, address_fields, address_type, target_sr, source_oid_field):
            
            # Convert Address Fields to expected format
            address_field_infos = ""
            if address_type == "SINGLE_FIELD_ADDRESS":
                single_line_field = address_fields[0][1]
                address_field_infos = "'Single Line Input' {} VISIBLE NONE".format(single_line_field)
            else:
                address_template = "{} {} VISIBLE NONE;"
                for field_pair in address_fields:
                    locator_field = field_pair[0]
                    in_field = field_pair[1]
                    address_field_infos += address_template.format(locator_field, in_field)

            out_features = "in_memory/" + "geo_" + uuid.uuid4().hex[:10]

            arcpy.env.outputCoordinateSystem = target_sr

            arcpy.geocoding.GeocodeAddresses(in_table=tbl,
                                            address_locator = locator,
                                            in_address_fields = address_field_infos,
                                            out_feature_class = out_features,
                                            out_relationship_type="STATIC")

            invalid_geocodes_lyr = arcpy.management.SelectLayerByAttribute(out_features,
                                                                        "NEW_SELECTION",
                                                                        "Status = 'U'")

            temp_source_oid_field = "USER_" + source_oid_field

            invalid_geocode_ids = [record[0] for record in arcpy.da.SearchCursor(invalid_geocodes_lyr, temp_source_oid_field)]

            clean_features_name = "geoclean_" + uuid.uuid4().hex[:10]
            user_fields = [field for field in arcpy.ListFields(out_features) if field.name[:5] == "USER_"]
            user_fields_no_oid = [field for field in user_fields if source_oid_field not in field.name]

            clean_fms = arcpy.FieldMappings()
            for field in user_fields_no_oid:
                fm = arcpy.FieldMap()
                old_field_name = field.name
                field.name = field.name[5:] # Remove 'USER_' from name
                fm.outputField = field
                fm.addInputField(out_features,old_field_name)
                clean_fms.addFieldMap(fm)

            # Remove unmatched geocodes, clean up field names
            out_features_cleaned = arcpy.conversion.ExportFeatures(out_features,
                                                    f"in_memory/{clean_features_name}",
                                                    where_clause="Status <> 'U'",
                                                    field_mapping=clean_fms)

            arcpy.management.Delete(out_features)
            arcpy.management.Delete(tbl)

            count = int(arcpy.GetCount_management(out_features_cleaned).getOutput(0))
            if count:
                return out_features_cleaned, invalid_geocode_ids
            else:
                return None, invalid_geocode_ids

        def create_xy_geometry(tbl, lat_field, lon_field, coord_sys, target_sr, source_oid_field):
            in_sr_obj = arcpy.SpatialReference()
            in_sr_obj.loadFromString(coord_sys)
            out_features = "in_memory/" + "xy_" + uuid.uuid4().hex[:10]

            arcpy.management.XYTableToPoint(tbl,
                                            out_features,
                                            x_field=lon_field,
                                            y_field=lat_field,
                                            coordinate_system=in_sr_obj)

            created_features = out_features

            if coord_sys != target_sr.exportToString():
                arcpy.env.outputCoordinateSystem = target_sr
                output_fc_proj = "in_memory/" + "xyproj_" + uuid.uuid4().hex[:10]
                arcpy.management.CopyFeatures(out_features, output_fc_proj)
                arcpy.management.Delete(out_features)
                created_features = output_fc_proj


            arcpy.management.DeleteField(created_features, source_oid_field)
            arcpy.management.Delete(tbl)

            count = int(arcpy.GetCount_management(created_features).getOutput(0))
            if count:
                return created_features
            else:
                return None

        def convert_records_to_id_dict(tbl, id_fields):
            id_dict = {}

            is_point = arcpy.Describe(tbl).dataType == "FeatureClass"
            fields_to_scan = [field.name for field in arcpy.ListFields(tbl)]
            
            if is_point:
                fields_to_scan.append("SHAPE@XY")
                
            with arcpy.da.SearchCursor(tbl, fields_to_scan) as cursor:
                for row in cursor:
                    row_dict = {key:value for key,value in zip(cursor.fields,row)}
                    row_key = "_".join([str(row_dict[field]) for field in id_fields])
                    id_dict[row_key] = row_dict

            return id_dict

        def is_location_same(source_record, target_record, fields_to_check):
            is_same = True
            for field in fields_to_check:
                
                source_val = source_record[field]
                target_val = target_record[field]

                if isinstance(source_val, str):
                    source_val = source_val.strip()

                if isinstance(target_val, str):
                    target_val = target_val.strip()

                # if both values evaluate to falsy then they are the same
                if not any ([source_val, target_val]):
                    continue # jump back to top to evaluate other fields

                # Cast value to str for equal comparison if not string
                if not isinstance(source_val, str):
                    source_val = str(source_val).strip()

                if not isinstance(target_val, str):
                    target_val = str(target_val).strip()

                if source_val != target_val:
                    is_same = False
                    break
            return is_same

        def identify_records_to_add_or_update(target_features, source_dict, id_fields, date_field, lat_field, lon_field, address_fields, is_portal, is_table):
            fields_to_scan = []
            fields_to_scan.extend(id_fields)
            records_to_update_att_only = {}
            records_to_update = {}
            records_to_add = {}
            location_fields = []
            if date_field:
                fields_to_scan.append(date_field)
            if not is_table:
                if lat_field and lon_field:
                    location_fields.extend([lat_field, lon_field])
                if address_fields:
                    location_fields.extend(address_fields)
                fields_to_scan.extend(location_fields)
            with arcpy.da.SearchCursor(target_features, ["OID@"] + fields_to_scan) as cursor:
                target_keys = {}
                for row in cursor:
                    row_dict = {key:value for key,value in zip(cursor.fields,row)}
                    target_oid = row[0]
                    row_key = "_".join([str(row_dict[field]) for field in id_fields])
                    target_keys[row_key] = row_key
                    if row_key in source_dict:
                        if date_field:
                            input_mod_date = source_dict[row_key][date_field].replace(microsecond=0)
                            target_mod_date = row_dict[date_field]
                            if target_mod_date:
                                target_mod_date = target_mod_date.replace(microsecond=0)
                                if is_portal:
                                    try:
                                        # Convert from Naive UTC dateime to aware local time then back to naive local time
                                        # Allows for comparison with Naive source input date
                                        target_mod_date = target_mod_date.replace(tzinfo=timezone.utc).astimezone(tz=None).replace(tzinfo=None)
                                    except (OverflowError, OSError):
                                        # Handle dates before 1970-1-1
                                        diff = int((dt(1970,1,1,0) - target_mod_date).total_seconds())
                                        target_mod_date = dt(1970,1,1,0) - td(seconds = diff + time.altzone)
                                    
                            if (input_mod_date and not target_mod_date) or \
                                input_mod_date > target_mod_date:
                                if is_table or \
                                    is_location_same(source_dict[row_key],row_dict, location_fields):
                                    records_to_update_att_only[row_key] = target_oid
                                else:
                                    records_to_update[row_key] = target_oid
                        else:
                            if is_table or \
                                is_location_same(source_dict[row_key],row_dict, location_fields):
                                records_to_update_att_only[row_key] = target_oid
                            else:
                                records_to_update[row_key] = target_oid
            
            # Any source records that were not in the target features are adds
            records_to_add = {key:key for key,value in source_dict.items() if key not in target_keys}

            return records_to_update_att_only, records_to_update, records_to_add

        def copy_records_to_new_table_by_id(tbl, id_fields, recs):
            if recs:
                temp_table_name = "tbl_" + uuid.uuid4().hex[:10]
                new_table = arcpy.management.CreateTable("in_memory", temp_table_name, tbl)
                fields_to_insert = [field.name for field in arcpy.ListFields(tbl)]

                with arcpy.da.InsertCursor(new_table, fields_to_insert) as ins_cursor, \
                    arcpy.da.SearchCursor(tbl, fields_to_insert) as search_cursor:
                    for row in search_cursor:
                        row_dict = {key:value for key,value in zip(search_cursor.fields,row)}
                        row_key = "_".join([str(row_dict[field]) for field in id_fields])
                        if row_key in recs:
                            ins_cursor.insertRow(row)

                return new_table
            else:
                return None

        def get_tables_from_input(tbl, id_fields, att_recs, geom_recs, add_recs, update_geom, update_matching):
            if update_matching:  # Only records that are matching will be sent to target to update, no inserts
                adds_table = None
            else:
                adds_table = copy_records_to_new_table_by_id(tbl, id_fields, add_recs)

            if update_geom:
                upd_geom_table = copy_records_to_new_table_by_id(tbl, id_fields, geom_recs)
                upd_att_table = copy_records_to_new_table_by_id(tbl, id_fields, att_recs)
                upd_att_rec_id_idx = att_recs
            else: # records that were candidates for a geometry update are now merged with candidates for attribute update
                upd_geom_table = None
                only_att_recs_merged = {**att_recs, **geom_recs}
                upd_att_table = copy_records_to_new_table_by_id(tbl, id_fields, only_att_recs_merged)
                upd_att_rec_id_idx = only_att_recs_merged

            return upd_att_table, upd_geom_table, adds_table, upd_att_rec_id_idx
            
        def convert_local_datetime_to_utc(time_value):
            if time_value:
                try:
                    # First astimezone() assigns the local system timezone
                    # to the time_value Second astimezone() converts the local 
                    # time to UTC astimezone() takes into account historical
                    # Daylight Savings Time changes back to 1970
                    utc_time = time_value.astimezone().astimezone(timezone.utc)
                except (OverflowError,OSError):
                    # If the date is on or before 1970-1-1, we need to handle
                    # the conversion differently Since Daylight Savings Time was
                    # not consistent before 1970, we use the standard time
                    # seconds offset from UTC to adjust the time to UTC.
                    utc_time = time_value + td(seconds=time.timezone)
                return utc_time
            else:
                return None


        def send_edits_to_service(feature_set, feature_layer, mode):
            num_features = len(feature_set)
            
            if num_features > 100:
                chunk = 100
            else:
                chunk = num_features
                
            processed_features = 0
            while processed_features < num_features:
                next = processed_features + chunk
                features_chunk = feature_set[processed_features:next]

                if mode == 'add':
                    feature_layer.edit_features(adds=features_chunk)
                else:
                    feature_layer.edit_features(updates=features_chunk)
                
                processed_features += chunk
                # print("{} of {} features processed".format(str(processed_features),str(num_features)))

        def _update_fc_dates_to_utc(fc):
            date_fields = [field.name for field in arcpy.ListFields(fc) if field.type == 'Date']
            if date_fields:
                with arcpy.da.UpdateCursor(fc,date_fields) as cursor:
                    for row in cursor:
                        new_values = [convert_local_datetime_to_utc(row[x]) for x in range(len(date_fields))]
                        cursor.updateRow(new_values)

        def _update_features_in_portal_target(update_features, target_feature_layer, oid_dict, id_fields, convert_time=False):
            temp_oid_field_name = arcpy.Describe(update_features).OIDFieldName
            target_oid_field_name = target_feature_layer.properties['objectIdField']

            is_point = arcpy.Describe(update_features).dataType == "FeatureClass"

            # arcpy.FeatureSet() has  a nasty habit of converting date values to UTC so in the case where users have
            # elected not to convert local time to UTC, we need to do it before the FeatureSet() conversion to double
            # adjust the time backwards to get things to match up
            if not convert_time:
                _update_fc_dates_to_utc(update_features)
            
            if is_point:
                fset = json.loads(arcpy.FeatureSet(update_features).JSON)["features"]
            else:
                fset = json.loads(arcpy.RecordSet(update_features).JSON)["features"]

            #Clear out OID, not needed for Adds
            for feature in fset:
                feature["attributes"].pop(temp_oid_field_name, None)
                
                try:
                    #Add OID field of target to feature with original OID field value
                    row_key = "_".join([str(feature["attributes"][field]) for field in id_fields])
                    feature['attributes'][target_oid_field_name] = oid_dict[row_key]
                except KeyError:
                    # arcpy.FeatureSet().JSON above converts whole number floats to an int
                    # Example: 1.0 becomes 1, and this causes problems when looking up the OID value
                    # which has been set to the float value earlier in processing.
                    # We lookup the feature by the float ID here
                    row_key = "_".join([str(float(feature["attributes"][field])) for field in id_fields])
                    feature['attributes'][target_oid_field_name] = oid_dict[row_key]

            send_edits_to_service(fset, target_feature_layer, 'update')

            return len(fset)
        
        def _update_features_in_local_target(update_features, target_features, id_fields):

            update_dict = convert_records_to_id_dict(update_features, id_fields)
            target_fields = [field.name for field in arcpy.ListFields(target_features)]

            skip_types = ["Geometry", "OID"]
            fields_to_update = [field.name for field in arcpy.ListFields(update_features) if field.type not in skip_types]

            #Incoming Records without geometry still have temp source oid field at this point so we check for it here
            fields_to_update = [field for field in fields_to_update if field in target_fields]
            
            is_point = arcpy.Describe(update_features).dataType == "FeatureClass"
            if is_point:
                fields_to_update.append("SHAPE@XY")

            desc = arcpy.Describe(target_features)
            if desc.isVersioned:
                editor = arcpy.da.Editor(desc.path)
                editor.startEditing()
                editor.startOperation()

            update_count = 0
            with arcpy.da.UpdateCursor(target_features, fields_to_update) as upd_cursor:
                for row in upd_cursor:
                    row_dict = {key:value for key,value in zip(upd_cursor.fields,row)}
                    row_key = "_".join([str(row_dict[field]) for field in id_fields])
                    if row_key in update_dict:
                        new_values = [update_dict[row_key][field] for field in fields_to_update]
                        upd_cursor.updateRow(new_values)
                        update_count += 1

            if desc.isVersioned:
                editor.stopOperation()
                editor.stopEditing(True)
                del editor

            del update_dict

            return update_count
        

        def upsert_target(features,target_features,target_feature_layer=None, is_portal=False, match_fields=None, update_geom=False, id_index=None, convert_time=False):
            if is_portal and convert_time:
                _update_fc_dates_to_utc(features)
            
            if match_fields:
                # Send UPDATES via old approach
                # TODO remove this logic at 3.3 when upsert API has been implemented and simply
                # funnel all edits through arcpy.Append(). 
                # Remove the id_index parameter on this function
                if is_portal:
                    _update_features_in_portal_target(features,target_feature_layer,id_index,match_fields, convert_time)
                else:
                    _update_features_in_local_target(features,target_features,match_fields)
            else:
                # if its ADDS (for local or web feature classes) use Append
                arcpy.management.Append(inputs=features,
                                        target=target_features,
                                        schema_type="NO_TEST")

            process_count = int(arcpy.GetCount_management(features).getOutput(0))

            return process_count

        def write_invalid_records_to_table(invalid_records, inv_recs_table, source_table, fm_error_dict):
            out_path = os.path.dirname(inv_recs_table)
            out_name = os.path.basename(inv_recs_table)
            arcpy.management.CreateTable(out_path, out_name, source_table)

            reason_field_list = ["INV_REASON"]
            arcpy.management.AddField(inv_recs_table, "INV_REASON", "TEXT", field_length = 10, field_alias="Reason")
            if fm_error_dict:
                arcpy.management.AddField(inv_recs_table, "INV_FLD", "TEXT", field_length = 254, field_alias="Exception Fields")
                reason_field_list.append("INV_FLD")

            modified_invalid_records = {}
            for error_type, id_list in invalid_records.items():
                for id_val in id_list:
                    modified_invalid_records[id_val] = error_type

            field_list = [field.name for field in arcpy.ListFields(source_table) if field.type != 'OID']

            with arcpy.da.InsertCursor(inv_recs_table, ["OID@"] + field_list + reason_field_list) as ins_cursor, \
                arcpy.da.SearchCursor(source_table, ["OID@"] + field_list) as search_cursor:
                    for row in search_cursor:
                        if row[0] in modified_invalid_records:
                            # row_dict = {key:value for key,value in zip(search_cursor.fields,row)}
                            row_vals = [row[x] for x in range(len(search_cursor.fields))]
                            if fm_error_dict:
                                if row[0] in fm_error_dict and modified_invalid_records[row[0]] == "BAD_FM":
                                    error_fields = ",".join([field for field in fm_error_dict[row[0]].keys()])
                                else:
                                    error_fields = None
                                ins_cursor.insertRow(row_vals + [modified_invalid_records[row[0]]] + [error_fields])
                            else:
                                ins_cursor.insertRow(row_vals + [modified_invalid_records[row[0]]])

            return inv_recs_table

        def write_invalid_records_to_txt(invalid_records, file_path):
            record_ids = []
            for id_list in invalid_records.values():
                record_ids += id_list

            record_ids = sorted(list(set(record_ids)))

            with open(file_path, 'w') as f:
                for rec_id in record_ids:
                    f.write(str(rec_id) + '\n')

            return file_path

        def is_val_equal(o,t):
            # Cast to a float to check for things like "5" == 5.0
            # which for the purposes of this tool should be considered equal
            # if you can't compare as numbers then compare as strings (with white space trimmed off)
            try:
                return float(o) == float(t)
            except:
                return str(o).strip() == str(t).strip()
            
        def replace_fms_input_table(orig_fms, new_in_mem_table):
            # Modify the original field map to point to the new in_memory table
            new_field_mapping = arcpy.FieldMappings()
            for fm in orig_fms.fieldMappings:
                try:
                    f_name = fm.getInputFieldName(0)
                    f_name = arcpy.ValidateFieldName(f_name, "in_memory")
                except RuntimeError:
                    # if there is a runtime error that means there wasn't an input field provided to the field map
                    continue
                fm.removeInputField(0)
                fm.addInputField(new_in_mem_table,f_name)
                new_field_mapping.addFieldMap(fm)
            return new_field_mapping

        def find_fm_differences(original_table, mapped_table, error_ids, reverse_fms_dict):
            """
            Returns a dictionary containing info about records with field map errors formatted as follows:
            {
                OID: {
                    input_field_name: invalid value
                }
                n...
            }
            """
            orig_id_name = arcpy.Describe(original_table).OIDFieldName
            mapped_id_name = arcpy.Describe(mapped_table).OIDFieldName
            reverse_fms_dict.update({mapped_id_name:orig_id_name})
            original_table_fields = [field.name for field in arcpy.ListFields(original_table)]
            mapped_table_fields_dict = {field.name:field for field in arcpy.ListFields(mapped_table)}

            orig_dict = {}
            mapped_dict = {}
            
            with arcpy.da.SearchCursor(original_table, original_table_fields) as cursor:
                for row in cursor:
                    oid_val = row[0]
                    if oid_val in error_ids:
                        row_dict = {k:v for k,v in zip(cursor.fields, row)}
                        orig_dict[oid_val] = row_dict

            with arcpy.da.SearchCursor(mapped_table, list(mapped_table_fields_dict.keys())) as cursor:
                for row in cursor: 
                    oid_val = row[0]
                    if oid_val in error_ids:
                        # row_dict = {reverse_fms_dict[k]:v for k,v in zip(cursor.fields, row)}
                        row_dict = {}
                        # For some reason sometimes a value that exceeds the length of the target field
                        # is possible when field mapping and Export Table is used to write to a field in memory
                        # even though that field can only hold a certain number of characters
                        # for this reason we trim these values based on the expected field length in
                        # the target
                        for k,v in zip(cursor.fields,row):
                            if v and mapped_table_fields_dict[k].type.upper() == "STRING":
                                val = v[:mapped_table_fields_dict[k].length]
                            else:
                                val = v
                            row_dict[reverse_fms_dict[k]] = val

                        mapped_dict[oid_val] = row_dict

            bad_fm_dict = {}
            for oid, rec_dict in mapped_dict.items():
                for field, field_val in rec_dict.items():
                    if field in orig_dict[oid]:
                        # If the mapped dict and orig_dict values are different that means there was a problem
                        # with that value during field mapping
                        if orig_dict[oid][field] is not None and not is_val_equal(orig_dict[oid][field], field_val):
                            if oid not in bad_fm_dict:
                                bad_fm_dict[oid] = {}
                            bad_fm_dict[oid][field] = orig_dict[oid][field]
            return bad_fm_dict

        target_desc = arcpy.Describe(target_features)
        # Runtime Parameters
        is_target_table = target_desc.datasetType == "Table"
        is_portal_target = target_features.startswith('http')
        is_portal_locator = address_locator and address_locator.startswith('http')
        time_format_needed = parameters[19].enabled

        target_feature_layer = None
        if is_portal_target:
            from arcgis.gis import GIS
            from arcgis.features import FeatureLayer
            portal = GIS("pro")
            target_feature_layer = FeatureLayer(target_features, portal)
            do_time_conversion = convert_local_time
        else:
            do_time_conversion = False

        if not is_target_table:
            required_input_fields = get_required_input_fields()
        try:
            in_table_oid_field_name = arcpy.Describe(in_table).OIDFieldName
        except:
            # Table is from a flat file source like a CSV or XLS convert it to to another type to get FIDs
            in_table = arcpy.management.CopyRows(in_table, 'in_memory/table_converted')
            in_table_oid_field_name = arcpy.Describe(in_table).OIDFieldName
            
            # Create new field mapping object based on the original field map to point to the new in_memory table
            field_mapping = replace_fms_input_table(field_mapping, in_table)

        output_oid_field_name = "source_" + uuid.uuid4().hex[:10]
        
        if not is_target_table:
            output_sr = target_desc.spatialReference

        runtime_fms = arcpy.FieldMappings()
        invalid_records = {
            "NULL_ADDR": [], # All of address fields in the input table are null
            "NULL_ID": [], # One or more input ID fields is null
            "DUP_ID": [], # If Updating Existing Features the record with a duplicate ID
            "NULL_XY": [], # Either the Latitude or Longitude Field in the input table are null
            "BAD_DATE": [], # The input date is null or the converted date is 12/30/1899 12:00:00 AM (bad conversion)
            "BAD_ADDR": [], # The address candidate is not matched
            "BAD_FM": [] # The field mapping was unsuccessful
        }
        
        if field_matching_type == "FIELD_MAP":
            runtime_fms = field_mapping

        # Process Parameters
        # Field Mapping
        upsert_fields = []
        if update_target == True: #UPDATE existing target features is true
            #ID Matching Fields
            for match_pair in match_id_fields:
                in_id_field = match_pair[0]
                target_id_field = match_pair[1]
                fm = arcpy.FieldMap()
                fm.outputField = get_field_object_by_name(target_id_field,target_features)
                fm.addInputField(in_table, in_id_field)
                runtime_fms.addFieldMap(fm)
                upsert_fields.append(target_id_field.lower())
            #Date Matching Fields
            if target_date_field:
                fm = arcpy.FieldMap()
                fm.outputField = get_field_object_by_name(target_date_field,target_features)
                fm.addInputField(in_table, in_date_field)
                runtime_fms.addFieldMap(fm)
                upsert_fields.append(target_date_field.lower())

        if field_matching_type == "AUTOMATIC":
            valid_field_types = ['SmallInteger', 'Integer', 'Single', 'Double', 'String', 'Guid', 'GlobalID', 'Date', 'DateOnly', 'TimeOnly', 'TimestampOffset', 'BigInteger']
            input_table_field_names = {field.name.lower() : field.name for field in arcpy.ListFields(in_table) if field.type in valid_field_types}
            
            target_table_fields = [field for field in arcpy.ListFields(target_features) if field.type in valid_field_types]
            target_table_fields = [field for field in target_table_fields if field.name.lower() not in upsert_fields]
            
            for field in target_table_fields:
                if field.name.lower() in input_table_field_names:
                    fm = arcpy.FieldMap()
                    fm.outputField = field
                    fm.addInputField(in_table, input_table_field_names[field.name.lower()])
                    runtime_fms.addFieldMap(fm)

            runtime_fms = add_source_oid_field(runtime_fms, in_table, output_oid_field_name, in_table_oid_field_name)
            if not is_target_table:
                check_required_fields(runtime_fms, required_input_fields)
        else:
            runtime_fms = add_source_oid_field(runtime_fms, in_table, output_oid_field_name, in_table_oid_field_name)
            runtime_fms = remove_empty_source_field_maps(runtime_fms)

        fms_dict = {fm.getInputFieldName(0):fm.outputField.name for fm in runtime_fms.fieldMappings}
        reverse_fms_dict = {fm.outputField.name:fm.getInputFieldName(0) for fm in runtime_fms.fieldMappings}
        
        if time_format_needed:
            time_conversion_fields = get_time_conversion_fields(runtime_fms, in_table)
            runtime_fms = revert_time_fields_to_text(runtime_fms, time_conversion_fields)
        
        mapped_in_table = arcpy.conversion.ExportTable(in_table,"in_memory/in_table",
                                                        where_clause=where_clause,
                                                        field_mapping=runtime_fms)

        field_map_error_ids = get_field_map_error_id_list(mapped_in_table)
        
        # We only get field map error specifics when the invalid records table parameter is used
        fm_error_dict = {}
        if field_map_error_ids and invalid_records_table:
            try:
                fm_error_dict = find_fm_differences(in_table,mapped_in_table, field_map_error_ids,reverse_fms_dict)
            except (KeyError, ValueError, TypeError):
                # Give user a warning message in the event of an exception, but still allow processing.
                # We don't penalize the user for not being able to show exception fields to them in the 
                # invalid records table because of an error.
                printMessage(w3)
                pass                                   

        if time_format_needed:
            convert_to_time_fields(time_format,time_conversion_fields,mapped_in_table)

        # REMAPPED PARAMETERS
        mapped_x_field = None
        mapped_y_field = None
        mapped_address_fields = []
        mapped_address_field_maps = []
        if not is_target_table:
            if location_type == "COORDINATES":
                mapped_x_field = fms_dict[x_field]
                mapped_y_field = fms_dict[y_field]
            else:
                for field_info in address_fields:
                    locator_field = field_info[0]
                    if field_info[1]:
                        if not isinstance(field_info[1], str):
                            if field_info[1].value:
                                mapped_in_field = fms_dict[field_info[1].value]
                                if mapped_in_field:
                                    mapped_address_fields.append(mapped_in_field)
                                    mapped_address_field_maps.append([locator_field, mapped_in_field])
                                else:
                                    mapped_address_field_maps.append([locator_field, "<None>"])
                            else:
                                mapped_address_field_maps.append([locator_field, "<None>"])
                        else:
                            mapped_address_field_maps.append([locator_field, "<None>"])
                    else:
                        mapped_address_field_maps.append([locator_field, "<None>"])

        updated_target_date_field = None
        updated_target_id_fields = []
        if update_target == True: # Update existing target features is True
            updated_target_date_field = target_date_field
            updated_target_id_fields = [field_pair[1] for field_pair in match_id_fields]

        cleaned_in_table = preliminary_incident_record_screening(mapped_in_table,
                                                                output_oid_field_name,
                                                                invalid_records,
                                                                mapped_address_fields,
                                                                mapped_y_field,
                                                                mapped_x_field,
                                                                updated_target_date_field,
                                                                updated_target_id_fields,
                                                                field_map_error_ids)

        features_to_add = None
        features_to_update = None
        features_to_update_attributes = None

        if update_target == False: # Update Existing Features is False (Append Only)
            if is_target_table:
                features_to_add = cleaned_in_table
            else:
                if location_type == "ADDRESSES":
                    features_to_add, invalid_geocodes = create_address_geometry(cleaned_in_table,
                                                                                address_locator,
                                                                                mapped_address_field_maps,
                                                                                address_type,
                                                                                output_sr,
                                                                                output_oid_field_name)

                    invalid_records['BAD_ADDR'] += invalid_geocodes
                if location_type == "COORDINATES":
                    features_to_add = create_xy_geometry(cleaned_in_table,
                                                        mapped_y_field,
                                                        mapped_x_field,
                                                        coordinate_system,
                                                        output_sr,
                                                        output_oid_field_name)

        else: #Update Existing Features is True (Update Records and/or append new records)
            mapped_table_dict = convert_records_to_id_dict(cleaned_in_table, updated_target_id_fields)

            up_records_att, up_records_geom, add_records = identify_records_to_add_or_update(target_features,
                                                                                            mapped_table_dict,
                                                                                            updated_target_id_fields,
                                                                                            updated_target_date_field,
                                                                                            mapped_y_field,
                                                                                            mapped_x_field,
                                                                                            mapped_address_fields,
                                                                                            is_portal_target,
                                                                                            is_target_table)

            del mapped_table_dict

            features_to_update_attributes, updates_geom_table, adds_table, updates_att_only_id_idx = get_tables_from_input(cleaned_in_table,
                                                                                                    updated_target_id_fields,
                                                                                                    up_records_att,
                                                                                                    up_records_geom,
                                                                                                    add_records,
                                                                                                    update_geometry,
                                                                                                    update_matching)

            if updates_geom_table: # This will be empty if the target is a table
                if location_type == "COORDINATES":
                    features_to_update = create_xy_geometry(updates_geom_table,
                                                                mapped_y_field,
                                                                mapped_x_field,
                                                                coordinate_system,
                                                                output_sr,
                                                                output_oid_field_name)
                if location_type == "ADDRESSES":
                    features_to_update, invalid_geocodes = create_address_geometry(updates_geom_table,
                                                                                    address_locator,
                                                                                    mapped_address_field_maps,
                                                                                    address_type,
                                                                                    output_sr,
                                                                                    output_oid_field_name)

                    invalid_records['BAD_ADDR'] += invalid_geocodes

            if adds_table:
                if is_target_table:
                    features_to_add = adds_table
                else:
                    if location_type == "COORDINATES":
                        features_to_add = create_xy_geometry(adds_table,
                                                                    mapped_y_field,
                                                                    mapped_x_field,
                                                                    coordinate_system,
                                                                    output_sr,
                                                                    output_oid_field_name)
                    if location_type == "ADDRESSES":
                        features_to_add, invalid_geocodes = create_address_geometry(adds_table,
                                                                                    address_locator,
                                                                                    mapped_address_field_maps,
                                                                                    address_type,
                                                                                    output_sr,
                                                                                    output_oid_field_name)

                        invalid_records['BAD_ADDR'] += invalid_geocodes

        if features_to_add:
            # Add Features
            add_count = upsert_target(features_to_add,
                                      target_features,
                                      target_feature_layer,
                                      is_portal_target,
                                      convert_time=do_time_conversion)
            if is_target_table:
                printMessage(m4,str(add_count))
            else:
                printMessage(m1,str(add_count))
        if features_to_update:
            # Features to update with geometry and attributes
            update_count = upsert_target(features_to_update,
                                         target_features,
                                         target_feature_layer,
                                         is_portal_target,
                                         updated_target_id_fields,
                                         update_geom=True,
                                         id_index=up_records_geom,
                                         convert_time=do_time_conversion)
            printMessage(m2,str(update_count))
        if features_to_update_attributes:
            # Features to update attributes only
            update_att_count = upsert_target(features_to_update_attributes,
                                             target_features,
                                             target_feature_layer,
                                             is_portal_target,
                                             updated_target_id_fields,
                                             update_geom=False,
                                             id_index=updates_att_only_id_idx,
                                             convert_time=do_time_conversion)
            if is_target_table:
                printMessage(m5,str(update_att_count))
            else:
                printMessage(m3,str(update_att_count))

        invalid_count = 0
        for id_list in invalid_records.values():
            invalid_count += len(id_list)

        if invalid_count:
            if invalid_records_table:
                write_invalid_records_to_table(invalid_records, invalid_records_table, in_table, fm_error_dict)
                printMessage(w1, invalid_records_table)
            else:
                output_table_name = "invalid_records_" + dt.now().strftime("%Y_%m_%d_%H_%M_%S") + ".fid"
                output_dir = arcpy.env.scratchFolder
                output_path = output_dir + os.path.sep + output_table_name
                write_invalid_records_to_txt(invalid_records, output_path)
                printMessage(w2, output_path)

        # TODO Resolve parameter value overwriting in UI interactions

        return   
#endregion

# -*- coding: utf-8 -*-
"""
Source Name:   SAS_Utilities.py
Version:       ArcGIS PRO 2.8
Author:        Environmental Systems Research Institute Inc.
Description:   Helper Functions for SAS2Table and Table2SAS
"""


import arcpy as ARCPY
import arcgisscripting as ARC
import SSDataObject as SSDO
import SSUtilities as UTILS
import ErrorUtils as ERROR
import pandas as PANDAS
import numpy as NUM
import os as OS
import sys as SYS
import winreg as WINREG
import saspy as SASPY
from saspy import autocfg
import swat as SWAT
import traceback as TRACEBACK

SWAT.options.cas.print_messages = True
SAS_SUBMIT_STR = 'data {0}; run;'
SAS_REG_KEY = r'SOFTWARE\SAS Institute Inc.\The SAS System\CurrentVersion'

def getSASDatasetInfo(sasDataset):
    validName = True
    try:
        #### Assure libref.table ####
        libref, table = sasDataset.split(".")
        validName = len(table) > 0 and len(libref) > 0

    except:
        validName = False
        pass
                    
    if not validName:
        ARCPY.AddIDMessage("ERROR", 110392)
        raise SystemExit()

    return libref, table

def raiseSWAT_Authinfo_Error():
    msg = TRACEBACK.format_exc().splitlines()[-1]
    if msg == "AttributeError: 'REST_CASConnection' object has no attribute '_req_sess'":
        ARCPY.AddIDMessage("ERROR", 110489)
        raise SystemExit()

def raiseSWAT_Error(casConnection):
    msg = TRACEBACK.format_exc().splitlines()[-1]
    msg = msg.split('swat.exceptions.SWATError: ')[-1]
    ARCPY.AddIDMessage("ERROR", 110394, msg)
    try:
        casConnection.close()
    except:
        pass
    raise SystemExit()

def raiseSAS_Error():
    msg = TRACEBACK.format_exc().splitlines()[-1]
    msg = msg.split('Error: ')[-1]
    ARCPY.AddIDMessage("ERROR", 110394, msg)
    raise SystemExit()

def getSASSessionInfo(configFile = None):
    """ Add SAS Java Runtime to Path """
    reg = WINREG.ConnectRegistry(None, WINREG.HKEY_LOCAL_MACHINE)
    try:
        with WINREG.OpenKey(reg, SAS_REG_KEY) as key:
            currentVersion = WINREG.QueryValueEx(key, "CurrentVersion")[0]
            sasKey = r'SOFTWARE\\SAS Institute Inc.\\The SAS System\\' + currentVersion
    except:
        #### No Local SAS Detected in Reg ####
        ARCPY.AddIDMessage("ERROR", 110395)
        raise SystemExit()

    with WINREG.OpenKey(reg, sasKey) as key:
        defaultRoot = WINREG.QueryValueEx(key, "DefaultRoot")[0]

    sasDir = OS.path.split(defaultRoot)[0]
    sasDir = OS.path.split(sasDir)[0]
    jrePath = OS.path.join(sasDir, 'SASPrivateJavaRuntimeEnvironment',
                           currentVersion, 'jre', 'bin', 'java')

    #### Create Temp Config File ####
    if configFile is None:
        scratchCFG = ARCPY.CreateUniqueName('sasConfig', ARCPY.env.scratchFolder)
        scratchCFG += ".txt"

        #### Overwrite if Exists ####
        deleteCFG(scratchCFG)

        #### Recreate CFG File ####
        autocfg.main(cfgfile = scratchCFG, java = jrePath, SASHome = sasDir)

        ##### Create SAS Session ####
        sas = SASPY.SASsession(results='TEXT', cfgfile = scratchCFG)

        return sas, scratchCFG

    else:

        try:
            sas = SASPY.SASsession(results='TEXT', cfgfile = configFile)
        except (SASPY.SASConfigNotValidError, SASPY.SASIONotSupportedError, 
                SASPY.SASConfigNotValidError, KeyError) as e:
            raiseSAS_Error()

        return sas, None

def deleteCFG(scratchCFG):
    #### Overwrite if Exists ####
    if OS.path.exists(scratchCFG):
        try:
            OS.remove(scratchCFG)
        except:
            pass

def endSASSession(sas, scratchCFG = None):
    try:
        sas.endsas()
    except:
        pass

    if scratchCFG is not None:
        try:
            deleteCFG(scratchCFG)
        except:
            pass

def createOutputTable(outputTable, df, sasNames, outNames, aliases = None):
    #### Set Alias to Input SAS Variable Names if None ####
    if aliases is None:
        aliases = sasNames

    #### Check Whether to Honor Int 64 or Convert to Double ####
    newFieldFlags = UTILS.outputSupportsNewFieldTypes(outputTable)
    supportsBigInt = newFieldFlags["SUPPORTSBIGINTEGER"]
    
    #### Create Candidate Fields ####
    candidateFields = []
    n = len(df)
    for ind, sasName in enumerate(sasNames):
        outName = outNames[ind]
        data = df[sasName].values.ravel()
        arrayType = data.dtype
        if arrayType == 'O':
            #### Convert Objects to Unicode Strings ####
            arrayType = f'{data.astype(str).dtype}'
            length = int(arrayType.split('<U')[-1])
            data[PANDAS.isnull(data)] = ""
            cand = SSDO.CandidateField(outName, "TEXT", data, 
                                       alias = aliases[ind],
                                       length = length,
                                       checkNullValues = True)
        elif 'M8' in arrayType.str:
            timeData = NUM.empty(n, dtype = 'O')
            for i, value, in enumerate(data):
                timeValue = PANDAS.Timestamp(value).to_pydatetime()
                if str(timeValue) != 'NaT':
                    timeData[i] = timeValue
            cand = SSDO.CandidateField(outName, "DATE", timeData, alias = aliases[ind], precision = 1,
                                       checkNullValues = True)
        else:
            outType = UTILS.numpyDtypeConvert[arrayType]
            if outType == "BIGINTEGER":
                if not supportsBigInt:
                    #### Convert Int64 to Double for SHP ####
                    data = NUM.asarray(data, dtype = float)
                    outType = "DOUBLE"

            cand = SSDO.CandidateField(outName, outType, data, 
                                       alias = aliases[ind],
                                       checkNullValues = True)

        candidateFields.append(cand)

    #### Get Number of Records ####
    n = len(df)

    #### Write Output ####
    ARC._ss.output_table_from_candidate_fields(outputTable, n, candidateFields)

    #### Report Number of Records Written ####
    ARCPY.AddMessage(ARCPY.GetIDMessage(220168).format(n, outputTable))

def saspy2OutputTable(sas, outputTable, libref, table):
    #### Create Path for Output FC ####
    outPath, outName = OS.path.split(outputTable)

    #### Create SAS Data Object ####
    ARCPY.SetProgressorLabel(ARCPY.GetIDMessage(220167))

    sasDataDF = SASPY.sasdata.SASdata(sas, libref, table, results = 'PANDAS')  

    #### Get PANDAS Data Frame and Column (Field) Names ####
    df = sasDataDF.to_df()
    sasNames = df.columns

    #### Map Name to Alias ####
    colInfo = sasDataDF.columnInfo()
    try:
        aliasValues = colInfo['Label']
    except:
        aliasValues = colInfo['Variable']

    varNames = colInfo['Variable']
    aliasDict = {}
    for ind, varName in enumerate(varNames):
        alias = aliasValues[ind]
        if alias is NUM.nan:
            alias = varName
        aliasDict[varName] = alias 

    aliases = []
    for varName in sasNames:
        if varName in aliasDict:
            aliases.append(aliasDict[varName])
        else:
            aliases.append(varNames)

    #### Adjust/Truncate/Number when Field Name Limits ####
    outNames = UTILS.createAppendFieldNames(sasNames, outPath)

    #### Create Output ####
    createOutputTable(outputTable, df, sasNames, outNames, aliases = aliases)

def swat2OutputTable(casConnection, outputTable, libref, table):
    #### Create Path for Output FC ####
    outPath, outName = OS.path.split(outputTable)

    #### Create SAS Data Object ####
    ARCPY.SetProgressorLabel(ARCPY.GetIDMessage(220167))

    #### Get PANDAS Data Frame and Column (Field) Names ####
    try:
        df = casConnection.CASTable(name=table, caslib=libref)
    except SWAT.SWATError:
        raiseSWAT_Error(casConnection)

    #### Increase Row Count ####
    try:
        numRecords = len(df)
    except SWAT.SWATError:
        raiseSWAT_Error(casConnection)

    if numRecords > 10000:
        SWAT.options.cas.dataset.max_rows_fetched = numRecords
    sasNames = df.columns

    #### Adjust/Truncate/Number when Field Name Limits ####
    outNames = UTILS.createAppendFieldNames(sasNames, outPath)

    #### Create Output ####
    createOutputTable(outputTable, df, sasNames, outNames)

class clsField(object):
    """ Class to hold properties and behavior of the output fields """

    @property
    def alias(self):
        return self._field.aliasName

    @property
    def name(self):
        return self._field.name

    @property
    def domain(self):
        return self._field.domain

    @property
    def type(self):
        return self._field.type

    @property
    def length(self):
        return self._field.length

    def __init__(self, f, i, subtypes, cvdomains):
        """ Create the object from a describe field object """
        self._field = f
        self.subtype_field = ''
        self.domain_desc = {}
        self.subtype_desc = {}
        self.index = i

        # Get coded value domain info from field
        if f.domain:
            for cvd in cvdomains:
                if cvd.name == f.domain:
                    self.domain_desc = {0: cvd.codedValues}

        # Get coded value domain info from subtype
        for st_key in subtypes.keys():
            st_val = subtypes[st_key]
            if st_val['SubtypeField'] == f.name:
                self.subtype_desc[st_key] = st_val['Name']
                self.subtype_field = f.name
            for k in st_val['FieldValues'].keys():
                v = st_val['FieldValues'][k]
                if k == f.name:
                    if len(v) == 2:
                        if v[1]:
                            self.domain_desc[st_key] = v[1].codedValues
                            self.subtype_field = st_val['SubtypeField']
    def __repr__(self):
        """ Nice representation for debugging  """
        return '<clsfield object name={}, alias={}, domain_desc={}>'.format(
            self.name, self.alias, self.domain_desc)

    def updateValue(self, row, fields):
        """ Update value based on domain description """
        value = row[self.index]
        if self.subtype_field:
            subtype_val = row[fields.index(self.subtype_field)]
        else:
            subtype_val = 0

        if self.subtype_desc:
            value = self.subtype_desc[row[self.index]]

        if self.domain_desc:
            try:
                value = self.domain_desc[subtype_val][row[self.index]]
            except:
                pass  # not all subtypes will have domain

        # Return the validated value
        return value

def table_to_data_frame(in_table, use_domains_subtypes=True):
    """Function will convert an arcgis table into a pandas dataframe with an
       object ID index, and the selected
       input fields using an ARCPY.da.SearchCursor."""

    d = ARCPY.Describe(in_table)
    fields = get_field_defs(in_table, use_domains_subtypes)
    field_names = [i._field.name for i in fields]

    #### Set Output SAS Field Names ####
    append_names = UTILS.createAppendFieldNames(field_names, "in_memory", explicitMaxLength = 32)

    #### Warn if Larger than 32 Chars ####
    max_len = max([len(i) for i in field_names])
    if max_len > 32:
        ARCPY.AddIDMessage("WARNING", 110393)

    field_aliases = [i._field.aliasName for i in fields]
    field_types = [i._field.type for i in fields]
    OIDFieldName = d.OIDFieldName

    data = []
    labels = {}
    for ind, f in enumerate(append_names):
        labels[f] = field_aliases[ind]

    # Loop through input rows
    with ARCPY.da.SearchCursor(in_table, field_names) as cursor:
        for row in cursor:
            # convert to list which allows item assignment
            rowUpdated = list(row)
            if use_domains_subtypes:
                for col_index, value in enumerate(row):
                    if fields[col_index].domain_desc or fields[
                        col_index].subtype_desc:
                        value = fields[col_index].updateValue(row, field_names)
                        rowUpdated[col_index] = value
            data.append(rowUpdated)

    fc_dataframe = PANDAS.DataFrame(data, columns=append_names)
    fc_dataframe = fc_dataframe.set_index(OIDFieldName, drop=True)

    #### Replace All None Object Fields w/ Nulls ####
    if len(fc_dataframe):
        for ind, f in enumerate(append_names):
            if f != OIDFieldName:
                if fc_dataframe[f].iloc[0] is None:
                    fType = field_types[ind]
                    if fType.upper() in UTILS.numericTypes:
                        fc_dataframe.replace({f: {None: NUM.nan}}, inplace=True)

    return fc_dataframe, labels

def get_field_defs(in_table, use_domain_desc):
        """ returns nice field definition """
        desc = ARCPY.Describe(in_table)

        subtypes = {}
        cvdomains = {}
        if use_domain_desc:
            subtypes = ARCPY.da.ListSubtypes(in_table)
            ws = OS.path.dirname(ARCPY.Describe(in_table).catalogPath)
            if ARCPY.Describe(ws).dataType == 'FeatureDataset':
                ws = OS.path.dirname(ws)
            try:
                domains = ARCPY.da.ListDomains(ws)
                cvdomains = [i for i in domains if (i.domainType == 'CodedValue')]
            except:
                pass

        fields = []
        for i, field in enumerate([f for f in desc.fields
                                   if f.type in ["Date", "Double", "Guid",
                                                 "Integer", "OID", "Single",
                                                 "SmallInteger", "String",
                                                 "GlobalID", "BigInteger",
                                                 "TimestampOffset", "TimeOnly",
                                                 "DateOnly"]]):
            fields.append(clsField(field, i, subtypes, cvdomains))

        return fields

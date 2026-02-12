# coding: utf-8
"""
Source Name:   ErrorUtils.py
Version:       ArcGIS 10.1
Author:        Environmental Systems Research Institute Inc.
Description:   Error Handling Functions for ESRI Script Tools.
"""

################### Imports ########################

import arcpy as ARCPY
import os as OS
import logging

from loggerutils import init_ss_logger

########## Error Dictionary Structures ###############

data2Type = { 'SmallInteger': 0, 'Integer': 1,
              'Single': 2, 'Double': 3,
              'String': 4, 'OID': 5,
              'Date': 6, 'Geometry': 7,
              'BigInteger': 8,
              'DateOnly': 9, 'TimestampOffset': 10}

type2Data = { 0: 'SmallInteger', 1: 'Integer',
              2: 'Single', 3: 'Double',
              4: 'String', 5: 'OID',
              6: 'Date', 7: 'Geometry',
              8: 'BigInteger',
              9: 'DateOnly', 10: 'TimestampOffset'}

LOGGER = init_ss_logger(__name__, logging.DEBUG)

################## Classes ##########################

class ScriptError(Exception):
    """Send an error message to the application history window.  
    Inherits from the Python Exception Class.  
    See: www.python.org/doc/current/tut/node10.html for more
    information about custom exceptions.

    INPUTS:
    value {str, None}: error message to be delivered

    METHODS:
    __str__: returns error message for printing
    """

    def __init__(self, value = None):
        if value is None:
            value = ARCPY.GetIDMessage(84004)
        self.value = value

    def __str__(self):
        return self.value
        
################# Methods ########################

def reportBadRecords(numObs, numBadObs, badIDs, label = "OID", 
                     allowNULLs = False, explicitBadRecordID = None):
    """Formats a string that notifies the user of the records it had
    trouble reading.  It only reports the first 30 bad records. 

    INPUTS: 
    numObs (int): total number of records
    numBadObs (int): number of bad records
    badIDs (list): list of all bad record IDs
    label {str, OID}: the master field that corresponds to badIds
    allowNULLs {bool, False}: allow NULL values in analysis?
    """

    firstID = 642
    secondID = 848
    if allowNULLs:
        secondID = 1158
    else:
        if explicitBadRecordID is not None:
            if type(explicitBadRecordID) in (list, tuple):
                firstID, secondID = explicitBadRecordID
            else:
                secondID = explicitBadRecordID

    LOGGER.warning(firstID, extra={"message_ID": firstID,
                                   "add_argument1": numBadObs,
                                   "add_argument2": numObs})
    badIDs = badIDs[0:30]
    badIDs = ", ".join(badIDs)
    LOGGER.warning(secondID, extra={"message_ID": secondID,
                                    "add_argument1": label,
                                    "add_argument2": badIDs})

def reportBadCases(numCases, numBadCases, badCases, label = "CASE"):
    """Formats a string that notifies the user of the cases with not
    enough observations to be included.  It only reports the first 
    30 bad cases. 

    INPUTS: 
    numCases (int): total number of cases
    numBadCases (int): number of bad cases
    badCases (list): list of all bad cases
    label {str, CASE}: the case field that corresponds to badCases
    """

    #### Fail If No Valid Cases ####
    if numCases == numBadCases:
        LOGGER.error(978, extra={"message_ID": 978})
        raise SystemExit()

    LOGGER.warning(910, extra={"message_ID": 910, "add_argument1": numBadCases,
                               "add_argument2": numCases})

    if len(badCases) > 30:
        badCases = badCases[0:30]
    badCases = ", ".join(badCases)
    LOGGER.warning(947, extra={"message_ID": 947, "add_argument1": label,
                               "add_argument2": badCases})

def reportDoubleAngleCases(numCases, numDoubleAngleCases, doubleAngleCases,
                           label = "CASE"):
    """Fortmat a string that notifies the use of the cases with diametrically 
    bimodal correction using angle doubling.  It only reports the first 
    30 bad cases. 

    INPUTS: 
    numCases (int): total number of cases
    numdoubleAngleCases (int): number of cases with diametrically bimodal
    doubleAngleCases (list): list of all cases with diametrically bimodal
    label {str, CASE}: the case field that corresponds to badCases
    """

    #### Fail If No Valid Cases ####
    if numCases == numDoubleAngleCases:
        LOGGER.warning(110070, extra={"message_ID": 110070})
    else:
        LOGGER.warning(110071, extra={"message_ID": 110071,
                                      "add_argument1": numDoubleAngleCases,
                                      "add_argument2": doubleAngleCases})
        if len(doubleAngleCases) > 30:
            doubleAngleCases = doubleAngleCases[0:30]
        doubleAngleCases = ", ".join(doubleAngleCases)
        LOGGER.warning(947, extra={"message_ID": 947,
                                   "add_argument1": label,
                                   "add_argument2": doubleAngleCases})


def reportBadCasesForTestUniformity(numCases, numBadCases, badCases, label = "CASE",
                                    numCases2D=2 , numCases3D=3):
    """Formats a string that notifies the user of the cases with not
    enough observations to be included.  It only reports the first 
    30 bad cases. 

    INPUTS: 
    numCases (int): total number of cases
    numBadCases (int): number of bad cases
    badCases (list): list of all bad cases
    label {str, CASE}: the case field that corresponds to badCases
    """

    if numCases == numBadCases:
        LOGGER.warning(110068, extra={"message_ID": 110068,
                                      "add_argument1": numCases2D,
                                      "add_argument2": numCases3D})
    else:
        LOGGER.warning(110069, extra={"message_ID": 110069,
                                      "add_argument1": numBadCases,
                                      "add_argument2": numCases})

        if len(badCases) > 30:
            badCases = badCases[0:30]
        badCases = ", ".join(badCases)
        LOGGER.warning(947, extra={"message_ID": 947,
                                   "add_argument1": label,
                                   "add_argument2": badCases})



def reportBadLengths(numObs, numBadObs, badLengths, label = "OID"):
    """Formats a string that notifies the user of the line records with
    the same start and end points.  It only reports the first 30 bad records. 

    INPUTS: 
    numObs (int): total number of records
    numBadObs (int): number of line records with no length
    badLengths (list): list of all line record IDs with no length
    label {str, OID}: the master field that corresponds to badLengths
    """
    LOGGER.warning(911, extra={"message_ID": 911,
                               "add_argument1": numBadObs,
                               "add_argument2": numObs})
    if len(badLengths) > 30:
        badLengths = badLengths[0:30]
    badLengths = ", ".join(badLengths)
    LOGGER.warning(912, extra={"message_ID": 912,
                               "add_argument1": label,
                               "add_argument2": badLengths})

def errorNumberOfObs(numObs, minNumObs = 3):
    """Returns an error if the number of observations is less than a specified
    integer.

    INPUTS: 
    numObs (int): number of observations
    minNumObs {int, 3}: minimum number of observations
    """

    if numObs < minNumObs:
        LOGGER.error(641, extra={"message_ID": 641,
                                 "add_argument1": minNumObs})
        raise SystemExit()

    if numObs == 0 and minNumObs == 0:
        LOGGER.error(401, extra={"message_ID": 401})
        raise SystemExit()


def checkNumberOfObs(numObs, minNumObs = 3, warnNumObs = 30, 
                     silentWarnings = False):
    """Returns a error/warning if the number of observations is less than a 
    specified integer.

    INPUTS: 
    numObs (int): number of observations
    minNumObs {int, 3}: minimum number of observations for error
    warnNumObs {int, 30}: minimum number of observations for warning
    """

    errorNumberOfObs(numObs, minNumObs = minNumObs)
    if numObs < warnNumObs and not silentWarnings:
        LOGGER.warning(845, extra={"message_ID": 845,
                                   "add_argument1": warnNumObs})

def warningNoNeighbors(numObs, numObsNoNeighs, idsNoNeighs, 
                       masterField, forceNeighbor = False,
                       contiguity = False, silentStats = True):
    """Returns warning messages for observations with no neighbors.

    INPUTS:
    numObs (int): total number of observations
    numObsNoNeighs (int): number of observations with no neighbors
    idsNoNeighs (list): ids with no neighbors
    masterField (str): name of the unique ID field
    forceNeighbor {boolean, False}: method used assured at least one neighbor?
    contiguity {boolean, False}: input feature class comprised of polygons?
    """

    idsNoNeighs = [ str(i) for i in idsNoNeighs ]
    idsNoNeighs = ", ".join(idsNoNeighs)
    if forceNeighbor:
        if contiguity:
            LOGGER.warning(718, extra={"message_ID": 718,
                                       "add_argument1": str(numObsNoNeighs)})
        else:
            LOGGER.warning(715, extra={"message_ID": 715,
                                       "add_argument1": str(numObsNoNeighs)})
        LOGGER.warning(716, extra={"message_ID": 716,
                                   "add_argument1": masterField,
                                   "add_argument2": idsNoNeighs})
    else:
        if silentStats:
            LOGGER.warning(846, extra={"message_ID": 846,
                                       "add_argument1": str(numObsNoNeighs)})
        LOGGER.warning(847, extra={"message_ID": 847,
                                   "add_argument1": masterField,
                                   "add_argument2": idsNoNeighs})

def returnFieldTypes(fieldTypes):
    """Returns a string of field types to be printed in an error statement.

    INPUTS: 
    fieldTypes (list): list of integers which are keys in type2Data

    OUTPUT:
    stringTypes (str): string of data types to be printed in error
    """

    stringTypes = [ type2Data[i] for i in fieldTypes ]
    stringTypes = ", ".join(stringTypes)
    stringTypes = "{" + stringTypes + "}"
    return stringTypes 

def checkFC(inputFC):
    """Assesses whether a feature class exists and returns an appropriate
    error message if it does not.

    INPUTS:
    inputFC (str): catalogue path to the input feature class.
    """

    if not ARCPY.Exists(inputFC):
        LOGGER.error(110, extra={"message_ID": 110,
                                 "add_argument1": inputFC})
        raise SystemExit()

def checkOutputPath(fullOutputPath):
    """Assesses whether a workspace exists for the given path and returns 
    an appropriate error message if it does not.

    INPUTS:
    fullOutputPath (str): catalogue path to the output data element.
    """

    outPath, outName = OS.path.split(fullOutputPath)
    if not ARCPY.Exists(outPath):
        LOGGER.error(210, extra={"message_ID": 210,
                                 "add_argument1": fullOutputPath})
        raise SystemExit()
        
def checkField(allFields, fieldName, types = []):
    """Checks whether a field exists and whether it conforms to the specified
    type(s).

    INPUTS:
    allFields (dict): field name = field type
    fieldName (str): name of the field to check
    types {list, []}: list of allowed data types for the field in question.
    """
    
    #### Upper Case the FieldName ####
    fieldNameUp = fieldName.upper()

    #### Make Sure Field Exists ####
    try:
        type = allFields[fieldNameUp].type
    except:
        LOGGER.error(728, extra={"message_ID": 728,
                                 "add_argument1": fieldName})
        raise SystemExit()

    #### Make Sure Data Type Exists ####
    try:
        dataType = data2Type[type]
    except:
        LOGGER.error(308, extra={"message_ID": 308})
        raise SystemExit()

    #### Make Sure Data Type is Appropriate ####
    if dataType not in types:
        typeString = returnFieldTypes(types)
        LOGGER.error(640, extra={"message_ID": 640,
                                 "add_argument1": fieldName,
                                 "add_argument2": typeString})
        raise SystemExit()

    return type



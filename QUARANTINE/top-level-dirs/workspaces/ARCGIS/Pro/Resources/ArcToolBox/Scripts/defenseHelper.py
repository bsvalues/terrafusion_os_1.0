'''
 ==================================================
 defenseHelper.py
 --------------------------------------------------
 requirements: ArcGIS Pro
 author: ArcGIS Solutions
 contact: support@esri.com
 company: Esri
 ==================================================
 description:
 Military Tools general/shared utilities
 ==================================================
'''

import math
import os
import sys
import traceback

import arcpy

DEBUG = False

def staceTrace(tb):
    ''' Log Traceback to arcpy AddError '''
    try:
        tbinfo = traceback.format_tb(tb)[0]
        pymsg = '{}\n{}\n{}'.format(tbinfo,
                str(sys.exc_info()[1]),
                arcpy.GetMessages(2))
        arcpy.AddError(pymsg)
    except:
        pass # Don't let this throw exceptions

def removeDatasetList(datasetNameList):
    ''' Remove datasets from a list of path names provided, Used to cleanup intermediate datasets '''
    try:
        if (datasetNameList is not None) and (len(datasetNameList) > 0):
            if DEBUG == True: arcpy.AddMessage(arcpy.GetIDMessage(201001)) # Removing intermediate datasets...
            for dataset in datasetNameList:
                if arcpy.Exists(dataset):
                    if DEBUG == True: arcpy.AddMessage(arcpy.GetIDMessage(201002).format(str(dataset)))
                    arcpy.Delete_management(dataset)

        datasetNameList.clear()
    except:
        pass # Don't let this throw exceptions

def convertFromUnitNameToMeters(unit, unitName):
    '''
    ' Convert unit to linear meters
    ' Supported Units:
    ' METERS, KILOMETERS, MILES, NAUTICAL_MILES, FEET, YARDS, US_SURVEY_FEET
    '''
    convertedUnit = None

    if (unitName == "METERS"):
        convertedUnit = float(unit)
    if (unitName == "FEET"):
        convertedUnit = float(unit) / 3.2808
    if (unitName == "US_SURVEY_FEET"):
        convertedUnit = float(unit) / 3.2808333
    elif (unitName == "YARDS"):
        convertedUnit = float(unit) * 0.9144
    elif (unitName == "KILOMETERS"):
        convertedUnit = float(unit) * 1000.0
    elif (unitName == "MILES"):
        convertedUnit = float(unit) * 1609.344
    elif (unitName == "NAUTICAL_MILES"):
        convertedUnit = float(unit) * 1852.0

    if convertedUnit is None:
        raise Exception('Unsupported Unit in ConvertFromUnitNameToMeters')

    return convertedUnit

def convertFromUnitNameToDegrees(unit, unitName):
    '''
    ' Convert unit to angular degrees
    ' Supported Units:
    ' DEGREES, MILS, RADS, GRADS
    '''
    if unit is None:
        return 0

    convertedUnit = None

    if (unitName == "DEGREES"):
        convertedUnit = float(unit)
    elif (unitName == "RADS"):
        convertedUnit = float(unit) * 180.0 / math.radians(180)
    elif (unitName == "MILS"):
        convertedUnit = float(unit)  * 180.0 / (1000.0 * math.radians(180))
    elif (unitName == "GRADS"):
        convertedUnit = float(unit) * 90.0 / 100.0

    if convertedUnit is None:
        raise Exception('Unsupported Unit in ConvertFromUnitNameToDegrees')

    return convertedUnit

def requiresEditOp(fc):
    ''' check if a feature class needs to edited in an Editor Operation - 
        usually if it has attachments or is Versioned '''
    try:
        # given feature class should be in a local database
        fcDescription = arcpy.Describe(fc)
        fcSourcePath = os.path.dirname(fcDescription.catalogPath)
        relationshipClasses = fcDescription.relationshipClassNames
        if len(relationshipClasses) > 0:
            for relationshipClass in relationshipClasses:
                relationDescribe = arcpy.Describe(
                    os.path.join(fcSourcePath, relationshipClass))
                if relationDescribe.isAttachmentRelationship:
                    return True

        if fcDescription.isVersioned:
            return True
    except:
        pass

    return False

def getWorkspace(fc):
    workspace = arcpy.Describe(fc).path
    workspaceDesc = arcpy.Describe(workspace)
    if workspace.startswith("http"):
        return "featureservice"
    elif workspaceDesc.datatype.lower() == "featuredataset":
        return workspaceDesc.path
    else:
        return workspace

def addUniqueID(dataset, fieldName, fieldType="LONG", startingNumber=1, incrementBy=1):
    ''' adding unique ID field '''
    try:
        # Check if Field Exists
        fieldNames = [f.name for f in arcpy.ListFields(dataset)]
        if not fieldName in fieldNames:
            # If not, add the field
            if DEBUG == True: arcpy.AddMessage(arcpy.GetIDMessage(200001).format(fieldName)) 
            arcpy.AddField_management(dataset, fieldName, fieldType)
        else:
            # Determine the datatype of the existing field if it already exists
            fieldDataType = [field for field in arcpy.ListFields(dataset, fieldName)][0].type
            if fieldDataType == 'String': 
                fieldType = 'TEXT'
            else:
                fieldType = 'LONG'

        editOp = requiresEditOp(dataset)
        if editOp:
            wkspc = getWorkspace(dataset)
            edit = arcpy.da.Editor(wkspc)
            edit.startEditing()
            edit.startOperation()

        # add unique numbers to each row
        counter = int(startingNumber)
        increment = int(incrementBy)
        fields = [str(fieldName)]
        if DEBUG == True: arcpy.AddMessage(arcpy.GetIDMessage(200002)) # Adding unique row IDs...
        with arcpy.da.UpdateCursor(dataset, fields) as rows:
            for row in rows:
                if fieldType == 'TEXT':   # Note: field must be string or int
                    row[0] = str(counter)
                else:
                    row[0] = counter
                rows.updateRow(row)
                counter += increment

        if editOp:
            edit.stopOperation()
            edit.stopEditing(True)
            del edit

        return dataset
    except:    
        tb = sys.exc_info()[2] # Get the traceback object
        staceTrace(tb)
        return None

def createUniqueFieldName(input_layer, field_name, field_alias=None, fieldList=None):
    """Return unique field name and field alias name.
       (Note: reused from analysisutils)"""
  
    if not field_alias:
        field_alias = field_name

    if fieldList:
        fieldNames = [f.name.lower() for f in fieldList]
    else:
        fieldNames = [f.name.lower() for f in arcpy.ListFields(input_layer, field_name)]
    i = 1
    while (field_name.lower() in fieldNames):
        field_name = "{0}_{1}".format(field_name, i)
        field_alias = "{0}_{1}".format(field_alias, i)
        i += 1
    return field_name, field_alias

def renameFields(input_layer, replace_info):
    """Renames a field. 
    Pass in a list tuples to rename multiple fields.
    e.g. [(fieldName, newFieldName, newFieldAlias)]
    (Note: reused from analysisutils)
    """

    listOfFieldNames = []

    for field_name, newFieldName, newFieldAlias in replace_info:
        arcpy.AlterField_management(input_layer, field_name,
                                    newFieldName, newFieldAlias)
    return

def checkForDuplicateFields(outputTable, fieldsToCheck):
    try:
        fieldsToCheckLower = [x.lower() for x in fieldsToCheck] # make list lowercase
        fieldList = arcpy.ListFields(outputTable)
        fieldNames = [x.name for x in fieldList]

        toBeRenamedFields = []
        for fieldName in fieldNames:
            if fieldName.lower() in fieldsToCheckLower:
                newFieldName, newAlias = \
                    createUniqueFieldName(outputTable,
                                            fieldName,
                                            fieldName,
                                            fieldList)
                toBeRenamedFields.append((fieldName, newFieldName, newAlias))
                arcpy.AddIDMessage("INFORMATIVE", 304, fieldName, newFieldName)

        if (len(toBeRenamedFields) > 0):
            renameFields(outputTable, toBeRenamedFields)

        return toBeRenamedFields

    except:
        arcpy.AddIDMessage("ERROR", 1600)

class NumbersToLetters(object):
    '''
    Performs conversion between numbers and Excel-style/grid-style values
    '''
    LetteringFormatExcel   = 'A_B_C'
    LetteringFormatGrid    = 'AA_AB_AC'
    LetteringFormatAltGrid = 'AA_BB_CC'
    SupportedLetteringFormats = [LetteringFormatExcel, LetteringFormatGrid, LetteringFormatAltGrid]

    def __init__(self, letterFormat = LetteringFormatExcel, omitLettersList = []) :

        self.omitLetters = None
        if omitLettersList is not None and len(omitLettersList) > 0:
            # TODO: maybe error check list for bad char values
            self.omitLetters = omitLettersList

        self.letteringFormat = letterFormat
        self.numberToLetterDict = {}
        self.letterToNumberDict = {}

        import string

        index = 0
        for char in string.ascii_uppercase:

            if self.omitLetters is not None:
                if char in self.omitLetters:
                    continue

            # Bidirectional Maps
            self.numberToLetterDict[index] = char
            self.letterToNumberDict[char] = index
            index += 1

        self.numberToLetterDictLength = index

    def printLetterDictionary(self):
        # For Debug
        for key, value in self.numberToLetterDict.items():
            print(str(key) + ' : ' + value + ' <--> ' + str(self.letterToNumberDict[value]))

    def numberToLetter(self, numberIn):
        ''' Converts an index into a letter, labeled like excel columns, A to Z, AA to ZZ, etc.'''

        if isinstance(numberIn, str):
            numberIn = int(numberIn)

        lenDictionary = self.numberToLetterDictLength

        if self.letteringFormat == NumbersToLetters.LetteringFormatGrid:
            numberIn += lenDictionary
        elif self.letteringFormat == NumbersToLetters.LetteringFormatAltGrid:
            numberIn *= (lenDictionary + 1)

        outString = ""
        index = numberIn
        while index > 0:
            index, rem = divmod(index - 1, lenDictionary)
            mappedChar = self.numberToLetterDict[rem]
            outString = mappedChar + outString
        return outString

    def letterToNumber(self, stringIn):

        lenDictionary = self.numberToLetterDictLength
        n = 0
        for char in stringIn:
            if self.omitLetters is None:
                # Simpler case
                letterPosition = ord(char) - ord('A')
            else:
                # Omitting letters, so figure out position from this reduced subset
                if char in self.omitLetters:
                    arcpy.AddIDMessage("WARNING", 200826, str(char)) # Not a valid ASCII letter, or could not convert letter(s) to value:
                    # Character: {char} in omitted letters {self.omitLetters}
                    return -1
                letterPosition = self.letterToNumberDict[char]

            n = n * lenDictionary + 1 + letterPosition

        # Adjust result based on alternate formats
        if self.letteringFormat == NumbersToLetters.LetteringFormatGrid:
            n = n - lenDictionary
        elif self.letteringFormat == NumbersToLetters.LetteringFormatAltGrid:
            n = int(n / (lenDictionary + 1))

        return n

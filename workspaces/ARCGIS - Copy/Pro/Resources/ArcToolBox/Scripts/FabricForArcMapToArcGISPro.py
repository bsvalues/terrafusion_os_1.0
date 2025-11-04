"""----------------------------------------------------------------------------
Name:         Migrate ArcGIS Desktop Parcel Fabric to the Parcel Fabric
                for ArcGIS Pro
Purpose:      This script will migrate the data from a Parcel Fabric created
              in ArcGIS Desktop to the new Parcel Fabric in ArcGIS Pro.
Author:       Esri
Created:      11-30-2016
---------------------------------------------------------------------------"""

import arcpy
import os
import re
import sys
import time
import math


def main(inputFabricLayer, proDatasetPath, inputNewFabricName):
    """
    Inputs
        inputFabricLayer: ArcGIS Desktop Fabric Layer
        proDatasetPath: path to Pro Dataset
        inputNewFabricName: Name to be given to ProFabric
    """
    #arcpy.AddMessage("TESTING WITH TIME STAMPS.  Total Time = {}".format(time.time() - START_TIME))
    startDirNames = sys.modules[__name__].__dict__.keys()

    inputFabricPath = arcpy.Describe(inputFabricLayer).catalogPath #Path of ArcGIS Desktop Fabric
    proFabricPath = os.path.join(proDatasetPath, inputNewFabricName) #Dataset of Pro Fabric
    proFabricWorkspace = os.path.dirname(os.path.dirname(proFabricPath)) # Determining workspace

    checkDatasetsSR(os.path.split(inputFabricPath)[0], proDatasetPath)

    # Get Parcel Types and total number of parcels
    parcelTypes, parcelCount = getParcelTypes(inputFabricPath,
                                              proFabricWorkspace)  # Returns a dictionary of Types and parcel total

    # Create the Fabric and each Parcel Type
    parcelTypesList = [parcelTypes[eachKey][0] for eachKey in parcelTypes.keys()]  # Gets a list for output
    arcpy.AddIDMessage(ID_INFO, 2873) #Creating parcel fabric and adding parcel types:
    arcpy.AddMessage("\n".join(parcelTypesList))

    #Create a dictionary of the source editor tracking field names
    arcMapFabricEditorTrackingFields = getEditorTrackingFields(inputFabricPath)

    createProFabricSchema(inputFabricLayer, proDatasetPath, inputNewFabricName, parcelTypes, arcMapFabricEditorTrackingFields)

    """
    #Used for testing
    # Update parcel types to attach the Polygon and Line feature class names
    parcelTypes = updateParcelTypes(proFabricPath, parcelTypes)
    """

    #Verify that destination dataset is not versioned
    checkVersioned(os.path.dirname(proFabricPath))

    #Disable Parcel Topology prior to load
    arcpy.parcel.DisableParcelTopology(proFabricPath)

    #Remove all the spatial indexes to allow possible out of index polygons/lines to be loaded.  Re-calc later
    removeSpatialIndexes(proFabricPath)

    #Disable editor tracking on all Pro Parcel Fabric classes to prepare for data transfer
    editorTrackingOnTargetFabric(proFabricPath, arcpy.DisableEditorTracking_management,
                                 "DISABLE_CREATOR",
                                 "DISABLE_CREATION_DATE",
                                 "DISABLE_LAST_EDITOR",
                                 "DISABLE_LAST_EDIT_DATE")


    #arcpy.AddMessage("Finished schema creation.  Total Time = {}".format(time.time() - START_TIME))

    #Create polygons of all the Plan Areas from the ArcMap parcel fabric
    recordAreaUnits = {}
    recordPolys = str(dissolvePolygons(inputFabricPath + "_Parcels", proFabricPath, "PlanID"))
    transferRecords(inputFabricPath, proFabricPath, recordPolys, recordAreaUnits, arcMapFabricEditorTrackingFields)
    arcpy.Delete_management(recordPolys)

    #arcpy.AddMessage("Finished loading Records.  Total Time = {}".format(time.time() - START_TIME))

    parcelLookUp = {}

    edit = arcpy.da.Editor(proFabricWorkspace)
    edit.startEditing(False, False)
    edit.startOperation()

    polygonNameDict = {key: eachValue[1] for key, eachValue in parcelTypes.items()}
    transferParcels(inputFabricPath, proDatasetPath, polygonNameDict, proFabricWorkspace,
                    parcelCount, proFabricPath, parcelLookUp, recordAreaUnits, arcMapFabricEditorTrackingFields)

    #Returns a dictionary of each of the Pro Parcels {originalOID: GUID, Type, ParcelRecord}
    getParcelOIDGuidAndType(proDatasetPath, polygonNameDict, parcelLookUp)

    lineNameDict = {key: eachValue[2] for key, eachValue in parcelTypes.items()}
    transferLines(inputFabricPath, proDatasetPath, lineNameDict, proFabricWorkspace,
                  proFabricPath, parcelLookUp, arcMapFabricEditorTrackingFields)

    transferPoints(inputFabricPath, proDatasetPath, proFabricWorkspace, proFabricPath, arcMapFabricEditorTrackingFields)

    #arcpy.AddMessage("Saving Edits.  Total Time = {}".format(time.time() - START_TIME))
    arcpy.AddIDMessage(ID_INFO, 2884)
    edit.stopOperation()
    edit.stopEditing(True)

    #arcpy.AddMessage("Calcing Spatial Indexes.  Total Time = {}".format(time.time() - START_TIME))
    #Recalc the spatial indexes based on loaded data
    calculateDefaultSpatialIndexes(proFabricPath)

    #arcpy.AddMessage("Re-enabling Editor Tracking.  Total Time = {}".format(time.time() - START_TIME))
    #Enable Editor Tracking after data is loaded
    editorTrackingOnTargetFabric(proFabricPath, arcpy.EnableEditorTracking_management,
                                 CREATED_USER,
                                 CREATED_DATE,
                                 LAST_EDITED_USER,
                                 LAST_EDITED_DATE)

    #arcpy.AddMessage("Enabling Parcel Topology.  Total Time = {}".format(time.time() - START_TIME))

    #Enable the Parcel Topology once data load is complete
    arcpy.parcel.EnableParcelTopology(proFabricPath)

    # Delete Identical Lines
    if DELETE_IDENTICAL:
        deleteIdenticalLines(proFabricPath)

    del parcelLookUp

    arcpy.SetParameter(3, proFabricPath) #Set path of output parameter

    #Garbage collection
    endDirNames = sys.modules[__name__].__dict__.keys()
    for each in endDirNames:
        if each not in startDirNames:
            del sys.modules[__name__].__dict__[each]

    #arcpy.AddMessage("Finished.  Total Time = {}".format(time.time() - START_TIME))

def checkDatasetsSR(inputDataset, targetDataset):
    inputSR = arcpy.Describe(inputDataset).spatialReference
    targetSR = arcpy.Describe(targetDataset).spatialReference

    if inputSR.type.lower() == "projected" and targetSR.type.lower() == "projected":
        sr_Attributes = ['PCSCode',  'azimuth', 'centralMeridian', 'centralMeridianInDegrees', 'centralParallel',
                         'factoryCode', 'falseEasting', 'falseNorthing', 'latitudeOf1st', 'latitudeOf2nd',
                         'latitudeOfOrigin', 'linearUnitCode', 'linearUnitName', 'longitude', 'longitudeOf1st',
                         'longitudeOf2nd', 'longitudeOfOrigin', 'metersPerUnit', 'name', 'projectionCode',
                         'scaleFactor',  'standardParallel1', 'standardParallel2']

    elif inputSR.type.lower() == "geographic" and targetSR.type.lower() == "geographic":
        sr_Attributes = ['GCSCode', 'angularUnitCode', 'angularUnitName', 'datumCode', 'factoryCode', 'flattening',
                         'longitude', 'name', 'primeMeridianCode', 'radiansPerUnit',  'semiMajorAxis', 'semiMinorAxis',
                         'spheroidCode']

    else:
        arcpy.AddIDMessage(ID_ERROR, 130022, inputDataset, targetDataset)  # Spatial references of %1 and %2 datasets are different
        quit()

    for eachAttr in sr_Attributes: #compare all the attributes listed above between source and target
        if getattr(inputSR, eachAttr) != getattr(targetSR, eachAttr):
            arcpy.AddIDMessage(ID_ERROR, 130022, inputDataset, targetDataset) #Spatial references of %1 and %2 datasets are different
            quit()
            

def checkVersioned(dataset):
    """Checks if dataset is versioned"""
    if arcpy.Describe(dataset).isVersioned:
        arcpy.AddIDMessage(ID_ERROR, 133) #The dataset cannot be versioned
        quit()


def getEditorTrackingFields(inputFabricPath):
    """Returns a dictionary of each of the parcel feature classes and their associated editor tracking fields"""
    fabricFC = ["Control", "Lines", "Parcels", "Plans", "Points"]
    arcMapFabricEditorTrackingFields = {}

    for eachFC in fabricFC:
        descFC = arcpy.Describe(inputFabricPath + "_" + eachFC)
        if descFC.editorTrackingEnabled:
            arcMapFabricEditorTrackingFields.update({eachFC.lower(): [descFC.creatorFieldName.lower(),
                                                              descFC.createdAtFieldName.lower(),
                                                              descFC.editorFieldName.lower(),
                                                              descFC.editedAtFieldName.lower()]})
    return arcMapFabricEditorTrackingFields


def editorTrackingOnTargetFabric(proFabricPath, et_Function, createdUser, createdDate, lastEditUser, lastEditDate):
    """Cycles through the new Pro Fabric and either enables or disables editor tracking on all the features"""
    descProFabric = arcpy.Describe(proFabricPath)

    #for each of the Parcel Types enable/disable Editor Tracking for Polys and Lines
    for eachType in descProFabric.parcelTypes:
        #enable/disable on Polys
        et_Function(os.path.join(descProFabric.path, eachType[1]), createdUser, createdDate, lastEditUser, lastEditDate)
        #enable/disable on Lines
        et_Function(os.path.join(descProFabric.path, eachType[2]), createdUser, createdDate, lastEditUser, lastEditDate)

    #enable/disable Editor Tracking for Records
    et_Function(descProFabric.recordsFeatureClass.catalogPath, createdUser, createdDate, lastEditUser, lastEditDate)

    #enable/disable Editor Tracking for Points
    et_Function(descProFabric.pointsFeatureClass.catalogPath, createdUser, createdDate, lastEditUser, lastEditDate)

    #enable/disable Editor Tracking for Connection Lines
    et_Function(descProFabric.connectionsFeatureClass.catalogPath, createdUser, createdDate, lastEditUser, lastEditDate)


def getParcelTypesDictionary(fabricPath, proFabricPath):
    """Returns a dictionary {TypeNumber: Type] of all the unique values in the Type Field.  Up to 100 values will be returned.
    Will also return to total number of parcels that will be loaded"""
    #Get parcels FC from fabric and workspace
    parcelPath = fabricPath + "_Parcels"
    workspace = os.path.dirname(os.path.dirname(fabricPath))
    #Get Type Field object this will allow to get domain and correct case of field Name and return the [0] value
    typeField = arcpy.ListFields(parcelPath, "type")[0]

    #SEARCH CURSOR: Gather all the unique Type Values and count total number of parcels
    typeValues = []
    parcelCount = 0
    for eachValue in arcpy.da.SearchCursor(parcelPath, [typeField.name, "joined"]):
        if eachValue[0] not in typeValues:
            if eachValue[1] == 1:
                typeValues.append(eachValue[0])
        parcelCount += 1

    parcelTypes = {} #Will store text names of all parcel types

    #If there is a domain on the field, get the coded values
    if typeField.domain:
        #Find the domain that matches the domain name of the Type Field
        typeCodedValues = [eachDomain for eachDomain in arcpy.da.ListDomains(workspace) if eachDomain.name == typeField.domain]
        #Get all the coded values of that domain
        typeCodedValues = typeCodedValues[0].codedValues
        #Use the set of TypeValues to get all the domains used in the input fabric.
        for eachTypeValue in typeValues:
            try:
                parcelTypes[eachTypeValue] = typeCodedValues[eachTypeValue]
            except: #If typeValue doesn't exist in the list of CodedValues give it a default name with Type Value appended
                if eachTypeValue is None:
                    parcelTypes[eachTypeValue] = "Parcel"
                else:
                    parcelTypes[eachTypeValue] = "Parcel_" + str(eachTypeValue)

    else: #If there is no domain just create parcel types based on the typeValue.  If typeValue is NONE set parcelType = Parcel
        for eachTypeValue in typeValues:
            if eachTypeValue is None:
                parcelTypes[eachTypeValue] = "Parcel"
            else:
                #Checks to see if Type value is negative and replaces the - with a "n" to allow correct naming characters
                if eachTypeValue < 0:
                    eachTypeValue *= -1
                    parcelTypes[eachTypeValue] = "Parcel_n" + str(eachTypeValue)
                else:
                    parcelTypes[eachTypeValue] = "Parcel_" + str(eachTypeValue)

    #Remove spaces in values and replace with "_"
    for eachKey in parcelTypes.keys():
        parcelTypes[eachKey] = parcelTypes[eachKey].replace(" ", "_")

    #ParcelTypes is a dictionary of Domain names but need to be replaced with the actual fabric names if necessary
    proFabricParcelTypeNames = arcpy.Describe(proFabricPath).parcelTypeNames
    parcelTypes = dict([(key, name) for key,value in parcelTypes.items()
                        for name in proFabricParcelTypeNames if name.startswith(value)])

    return parcelTypes, parcelCount


def dissolvePolygons(inputPolygons, outputPath, dissolveBy):
    """Creates and returns dissolved feature class of polygons based on a passed in field"""
    outputFC = outputPath + "_dPolys" + str(int(time.time()*100))
    with arcpy.EnvManager(maintainCurveSegments=True):
        result = arcpy.PairwiseDissolve_analysis(inputPolygons, outputFC, dissolveBy, "OBJECTID COUNT", "MULTI_PART")
    return result


def transferRecords(inputFabricPath, proFabricPath, recordPolys, recordAreaUnits, arcMapFabricEditorTrackingFields):
    """Will take the Fabric Records and transfer them to Pro appending the Polygon shape from the dissolve"""

    descFabric = arcpy.Describe(proFabricPath)

    #Grab editor tracking fields if available
    try:
        et_Fields = arcMapFabricEditorTrackingFields["plans"]
    except KeyError:
        et_Fields = None


    #Open a cursor on record Polygon feature class and create a hash table of the {PlanID: Geometry}
    recordPolyCur = arcpy.da.SearchCursor(recordPolys, ["planid", "shape@", "count_objectid"])
    recordsPolyTable = {eachRecord[0]: [eachRecord[1], eachRecord[2]] for eachRecord in recordPolyCur}
    del recordPolyCur

    sourceFieldNames = [each.name.lower() for each in arcpy.ListFields(inputFabricPath + "_Plans") if each.type.lower() != "blob"
                        and each.name.lower() != "shape"]
    sourceOID = arcpy.Describe(inputFabricPath + "_Plans").OIDFieldName
    sourcePlanCur = arcpy.da.SearchCursor(inputFabricPath + "_Plans", sourceFieldNames, sql_clause = (None, "ORDER BY " + sourceOID))

    targetFieldNames = [each.name.lower() for each in arcpy.ListFields(descFabric.RecordsFeatureClass.catalogPath) if each.name.lower() != "shape"]
    targetFieldNames.append("Shape@")

    arcpy.AddIDMessage(ID_INFO, 2874) #Loading ArcMap plans into parcel fabric records

    targetRecordCur = arcpy.da.InsertCursor(descFabric.RecordsFeatureClass.catalogPath, targetFieldNames)

    count = 0
    for eachRow in sourcePlanCur:
        #Get a row ready for record insert
        insertRow = []
        try:
            recordShape = recordsPolyTable[eachRow[sourceFieldNames.index(sourceOID.lower())]][0]
            recordParcelCount = recordsPolyTable[eachRow[sourceFieldNames.index(sourceOID.lower())]][1]
        except:
            recordShape = None
            recordParcelCount = 0

        #Update RecordAreaUnit[planOID] = statedAreaUnit
        recordAreaUnits[eachRow[sourceFieldNames.index(sourceOID.lower())]] = eachRow[sourceFieldNames.index("areaunits")]

        for eachTargetField in targetFieldNames:
            if eachTargetField == "Shape@":
                if recordParcelCount <= MAX_RECORD_PARCEL_COUNT:
                    insertRow.append(recordShape)
                else:
                    insertRow.append(None)
            elif eachTargetField == "originalfeatureoid":
                insertRow.append(eachRow[sourceFieldNames.index(sourceOID.lower())])    #eachRow[sourceFieldNames.index(sourceOIDName)]
            elif eachTargetField.lower() == 'originalglobalid':
                insertRow.append(eachRow[sourceFieldNames.index('globalid')])
            elif eachTargetField == "cogoaccuracy":
                insertRow.append(eachRow[sourceFieldNames.index("accuracy")])
            elif eachTargetField == "recordeddate":
                insertRow.append(eachRow[sourceFieldNames.index("legaldate")])
            elif eachTargetField == "parcelcount":
                insertRow.append(recordParcelCount)
            elif eachTargetField == CREATED_USER and et_Fields:
                insertRow.append(assignEditorTrackingField(eachRow, sourceFieldNames, et_Fields, 0))
            elif eachTargetField == CREATED_DATE and et_Fields:
                insertRow.append(assignEditorTrackingField(eachRow, sourceFieldNames, et_Fields, 1))
            elif eachTargetField == LAST_EDITED_USER and et_Fields:
                insertRow.append(assignEditorTrackingField(eachRow, sourceFieldNames, et_Fields, 2))
            elif eachTargetField == LAST_EDITED_DATE and et_Fields:
                insertRow.append(assignEditorTrackingField(eachRow, sourceFieldNames, et_Fields, 3))
            elif eachTargetField in sourceFieldNames:
                insertRow.append(eachRow[sourceFieldNames.index(eachTargetField)])
            else:
                insertRow.append(None)

        targetRecordCur.insertRow(insertRow)
        count += 1

    #arcpy.AddMessage("Plan data loaded, now deleting cursors.  Total Time = {}".format(time.time() - START_TIME))
    del recordsPolyTable
    del sourcePlanCur
    del targetRecordCur


def transferParcels(inputFabricPath, proFabricDataset, parcelTypes, proFabricWorkspace,
                    parcelCount, proFabricPath, parcelLookUp, recordAreaUnits, arcMapFabricEditorTrackingFields):
    """Opens a search cursor on the Desktop Fabric Parcels and transfers them one by one to the correct Parcel Type"""

    descTargetFabric = arcpy.Describe(proFabricPath)

    # Grab editor tracking fields if available
    try:
        et_Fields = arcMapFabricEditorTrackingFields["parcels"]
    except KeyError:
        et_Fields = None

    sourceFieldNames, targetFieldNames = getSourceAndTargetFieldNames(inputFabricPath + "_Parcels",
                                                                      os.path.join(descTargetFabric.path,
                                                                                   descTargetFabric.parcelTypes[0][1]))

    sourceParcelCur = arcpy.da.SearchCursor(inputFabricPath + "_Parcels", sourceFieldNames)
    # Create a dictionary of Insert Cursors {Key = Parcel Type Integer: Item = Cursor of that Parcel Type, ...}
    targetCursors = {key: arcpy.da.InsertCursor(os.path.join(proFabricDataset, eachType),
                                                targetFieldNames) for key, eachType in parcelTypes.items()}

    #Create an in memory dictionary of Record GUID and OriginalPlanID and Accuracy
    recordsPlanID = {eachRecord[0]: eachRecord for eachRecord in
                     arcpy.da.SearchCursor(descTargetFabric.RecordsFeatureClass.catalogPath,
                                           ["originalfeatureoid", "globalid", "cogoaccuracy"])}

    #Get area unit values and append them to the RecordsPlanID dictionary
    for eachRecord in recordsPlanID:
        recordsPlanID[eachRecord] += (recordAreaUnits[eachRecord],)

    arcpy.AddIDMessage(ID_INFO, 2875) #Loading parcel polygons...
    #arcpy.AddMessage("Total time = {}".format(time.time() - START_TIME))
    warning = [] #Will be used if any warnings are found
    counter = 0
    percentage = 10 #used to output during loading
    sourceOIDName = arcpy.Describe(inputFabricPath + "_Parcels").oidFieldName.lower()

    for eachRow in sourceParcelCur:
        #Create a dictionary of all the values in a row with the Field Name as the Key
        rowValueDict = {eachField: eachRow[index] for index, eachField in enumerate(sourceFieldNames)}
        insertRow = [] #Empty list created.  This will be used as the insert row.

        for eachTargetField in targetFieldNames:
            if eachTargetField.lower() == "statedarea":
                #This will find a single numerical value in the statedarea string and convert it to a float
                if (eachRow[sourceFieldNames.index("statedarea")] is not None and
                    eachRow[sourceFieldNames.index("statedarea")] != ''):
                    try: #This logic catches cases of Number followed by a string of letters
                        insertRow.append(float(re.findall(r"[-+]?\d*\.\d+|\d+", eachRow[sourceFieldNames.index(eachTargetField)])[0]))
                    except: #If it fails append None
                        insertRow.append(None)
                else:
                    insertRow.append(None)
            elif eachTargetField.lower() == "statedareaunit":
                #TODO compare against SHAPE AREA find the unit of the fabric
                if (eachRow[sourceFieldNames.index("statedarea")] is not None and
                    eachRow[sourceFieldNames.index("statedarea")] != ''):
                    #Calculate the stated area Code
                    try:
                        areaUnit = convertStatedAreaUnit(eachRow[sourceFieldNames.index("statedarea")],
                                                         recordsPlanID[eachRow[sourceFieldNames.index("planid")]][3])
                        insertRow.append(areaUnit)
                    except:
                        insertRow.append(None)
                else:
                    insertRow.append(None)
            elif eachTargetField.lower() == "originalstatedarea":
                try:
                    insertRow.append(eachRow[sourceFieldNames.index("statedarea")])
                except IndexError:
                    insertRow.append(None)
            elif eachTargetField.lower() == "createdbyrecord":
                #This gets the GUID of the record that is associated to this parcel based on PlanID
                try:
                    insertRow.append(recordsPlanID[eachRow[sourceFieldNames.index("planid")]][1])
                except KeyError:
                    insertRow.append(None)
            elif eachTargetField == "retiredbyrecord":
                #Check to see if the source parcel is historic. If so put GUID {DDDDDDDD-DDDD-DDDD-DDDD-DDDDDDDDDDDD}
                if eachRow[sourceFieldNames.index("historical")] == 1:
                    insertRow.append(RETIRED_REC_ID)
                else:
                    insertRow.append(None)
            elif eachTargetField.lower() == "accuracy":
                if eachRow[sourceFieldNames.index("accuracy")] is None or eachRow[sourceFieldNames.index("accuracy")] == 0:
                    if eachRow[sourceFieldNames.index("planid")] in recordsPlanID:
                        #Need to check if planID value is in Plan Table. If it is set that value
                        insertRow.append(recordsPlanID[eachRow[sourceFieldNames.index("planid")]][2])
                    else:
                        insertRow.append(None)
                else:
                    insertRow.append(eachRow[sourceFieldNames.index("accuracy")])
            elif eachTargetField == CREATED_USER and et_Fields:
                insertRow.append(assignEditorTrackingField(eachRow, sourceFieldNames, et_Fields, 0))
            elif eachTargetField == CREATED_DATE and et_Fields:
                insertRow.append(assignEditorTrackingField(eachRow, sourceFieldNames, et_Fields, 1))
            elif eachTargetField == LAST_EDITED_USER and et_Fields:
                insertRow.append(assignEditorTrackingField(eachRow, sourceFieldNames, et_Fields, 2))
            elif eachTargetField == LAST_EDITED_DATE and et_Fields:
                insertRow.append(assignEditorTrackingField(eachRow, sourceFieldNames, et_Fields, 3))
            elif eachTargetField.lower() == "shape":
                insertRow.append(eachRow[sourceFieldNames.index("shape@")])
            elif eachTargetField.lower() == "originalfeatureoid":
                insertRow.append(eachRow[sourceFieldNames.index(sourceOIDName)])
            elif eachTargetField.lower() == 'originalglobalid':
                insertRow.append(eachRow[sourceFieldNames.index('globalid')])
            elif eachTargetField in sourceFieldNames:
                insertRow.append(eachRow[sourceFieldNames.index(eachTargetField)])
            else:
                insertRow.append(None)

        if (eachRow[sourceFieldNames.index("unclosed")] == 0 and
            eachRow[sourceFieldNames.index("shape@")] is not None):
            #Verify that parcel is Closed and has a shape other wise do not load
            targetCursors[eachRow[sourceFieldNames.index("type")]].insertRow(insertRow)
        elif eachRow[sourceFieldNames.index("unclosed")] == 1:
            #For unclosed parcels set the parcelLookUp {originalParcelID: No Pro Parcel, No Type, CreatedByRecordGUID}
            try:
                recordGUID = recordsPlanID[eachRow[sourceFieldNames.index("planid")]][1]
                unclosedAccuracy = insertRow[targetFieldNames.index("accuracy")]
            except KeyError:
                recordGUID = None
                unclosedAccuracy = insertRow[targetFieldNames.index("accuracy")]
            parcelLookUp.update({insertRow[targetFieldNames.index("originalfeatureoid")]:
                                     [None, None, recordGUID, unclosedAccuracy]}) #no GUID, Type. Set RecordGUID and Accuracy for lines

        counter += 1
        if counter == int(parcelCount * (percentage/100)):
            arcpy.AddIDMessage(ID_INFO, 2876, percentage, counter) #%1%% complete.  Loaded %2 features
            percentage += 10
            #arcpy.AddMessage("Total Time = {}".format(time.time() - START_TIME))

    #arcpy.AddMessage("Parcel data loaded, now deleting cursors.  Total Time = {}".format(time.time() - START_TIME))

    del sourceParcelCur
    del targetCursors
    del recordsPlanID


def convertStatedAreaUnit(statedArea, recordStatedAreaCode):
    """Function passes in the polygon stated area string and the unit code for the Record Stated Area Code"""
    try:
        statedAreaNumber = re.findall(r"[-+]?\d*\.\d+|\d+", statedArea)[0]
        unit = statedArea.replace(statedAreaNumber, "")
        unit = unit.replace(" ", "")
        unit = unit.lower()
        if unit == "a" or unit == "ac." or unit == "ac" or unit == "acre" or unit == "acres":
            return 109402
        elif unit == "ha" or unit == "hectare" or unit == "hectares":
            return 109401
        elif unit == "sq.ft" or unit == "sqft" or unit == "sq ft" or unit == "square feet":
            if recordStatedAreaCode == 8: #Square Feet
                return 109405
            elif recordStatedAreaCode == 9: #US Square Feet
                return 109406
            else:
                return 109405
        elif unit == "sq.rd" or unit == "sqrd" or unit == "sq rd" or \
                unit == "square rod" or unit == "square rods":
            return 109455
        elif unit == "sq.km" or unit == "sqkm" or unit == "sq km" or \
                unit == "square kilometer" or unit == "square kilometers":
            return 109414
        elif unit == "sq.mi" or unit == "sqmi" or unit == "sq mi" or \
                unit == "square mile" or unit == "square miles":
            return 109413
        elif unit == "sq.m" or unit == "sqm" or unit == "sq m" or \
                unit == "square meter" or unit == "square meters":
            return 109404
        elif not unit:
            if recordStatedAreaCode == 2: #Square Meters
                return 109404
            elif recordStatedAreaCode == 3: #Hectare
                return 109401
            elif recordStatedAreaCode == 4: #Acres
                return 109402
            elif recordStatedAreaCode == 5: #Square Rods
                return 109455
            elif recordStatedAreaCode == 8: #Square Foot
                return 109405
            elif recordStatedAreaCode == 9: #Square US Foot
                return 109406
            else:
                return None
        else:
            return None
    except:
        return None


def getParcelOIDGuidAndType(proDatasetPath, parcelTypes, parcelLookUp):
    """Returns a dictionary of each of the Pro Parcels {originalOID: [GUID, Type, RecordGUID, Accuracy]}"""

    for eachType in parcelTypes.values():
        for eachValue in arcpy.da.SearchCursor(os.path.join(proDatasetPath, eachType),
                                               ["originalfeatureoid", "globalid", "createdbyrecord", "accuracy"]):
            parcelLookUp.update({eachValue[0]: [eachValue[1], eachType, eachValue[2], eachValue[3]]})

    return parcelLookUp


def transferLines(inputFabricPath, proFabricDataset, parcelTypes, proFabricWorkspace, proFabricPath,
                  parcelLookUp, arcMapFabricEditorTrackingFields):
    """Opens a search cursor on the Desktop Fabric Lines and transfers them one by one to the correct Parcel Line Type"""

    # Grab editor tracking fields if available
    try:
        et_Fields = arcMapFabricEditorTrackingFields["lines"]
    except KeyError:
        et_Fields = None

    #Get fabric describe objects
    descInputFabricLines = arcpy.Describe(inputFabricPath + "_Lines")
    descTargetFabric = arcpy.Describe(proFabricPath)
    connectionsCatalogPath = descTargetFabric.connectionsFeatureClass.catalogPath

    # Get a list of the sourceFieldNames and targetFieldNames to use index values, omit BLOB fields
    sourceFieldNames, targetFieldNames = getSourceAndTargetFieldNames(inputFabricPath + "_Lines",
                                                                      os.path.join(descTargetFabric.path,
                                                                                   descTargetFabric.parcelTypes[0][2]))
    #TODO: Temporary fix.  I need to figure out why parcelID is being returned here in targetFieldNames
    targetFieldNames.remove("parcelid")

    connectionFieldNames = getSourceAndTargetFieldNames(connectionsCatalogPath)

    #Creating a search cursor on the source and a dict of Target Cursors {ParcelType: LinesCursor, ...}
    sourceLinesCur = arcpy.da.SearchCursor(inputFabricPath + "_Lines", sourceFieldNames)
    targetCursors = {eachType[1]: arcpy.da.InsertCursor(os.path.join(descTargetFabric.path, eachType[2]), targetFieldNames)
                     for eachType in descTargetFabric.parcelTypes}

    connectionCursor = arcpy.da.InsertCursor(connectionsCatalogPath, connectionFieldNames)

    arcpy.AddIDMessage(ID_INFO, 2877) #Loading parcel lines...
    #arcpy.AddMessage("Total Time = {}".format(time.time() - START_TIME))
    counter = 0
    lineFeatureLayer = arcpy.MakeFeatureLayer_management(inputFabricPath + "_Lines", "linesFeatureLayer",
                                                         descInputFabricLines.lengthFieldName + " > 0")
    lineCount = int(str(arcpy.GetCount_management(lineFeatureLayer)))
    del lineFeatureLayer
    percentage = 10  # used to output during loading
    sourceLineOIDField = arcpy.Describe(inputFabricPath + "_Lines").OIDFieldName

    for eachLine in sourceLinesCur:

        # Category Values: 0 = Boundary, 1 = Dependant Line, 2 = Precise Connection, 3 = Connection, 4 = Radial (omit)
        # 5 = Road Frontage, 6 = Origin Connection, 7 = Part Connector (omit)
        boundaryLineCategory = [0, 5]
        connectionLineCategory = [1, 2, 3, 6]

        # Get the sourceParcelID to properly get the parcel info to place on the Lines
        sourceLineParcelID = eachLine[sourceFieldNames.index("parcelid")]

        try: #This checks if the Line parcel Type exists in the loaded parcels.  If not put None (unclosed parcels)
            thisParcelType = parcelLookUp[sourceLineParcelID][1]
        except KeyError:
            thisParcelType = None

        #TODO: Need to calculate Arc Length if it's NULL but their is a Radius
        if eachLine[sourceFieldNames.index("shape@")] is not None: #Removes Radial lines that have null geometries

            if thisParcelType: #Check if there is a parcel Type then get category otherwise it's a connection line
                lineCategory = eachLine[sourceFieldNames.index("category")]  # Get category value
            else:
                lineCategory = 1

            if lineCategory in boundaryLineCategory:
                insertRow = \
                    createLinesInsertRow(eachLine, sourceLineParcelID, targetFieldNames,
                                         parcelLookUp, sourceFieldNames, sourceLineOIDField, et_Fields)
            elif lineCategory in connectionLineCategory:
                insertRow = \
                    createLinesInsertRow(eachLine, sourceLineParcelID, connectionFieldNames,
                                         parcelLookUp, sourceFieldNames, sourceLineOIDField, et_Fields)

            if lineCategory in connectionLineCategory:
                connectionCursor.insertRow(insertRow)
            elif lineCategory in boundaryLineCategory:
                targetCursors[thisParcelType].insertRow(insertRow)

            counter += 1
            if counter == int(lineCount * (percentage / 100)):
                arcpy.AddIDMessage(ID_INFO, 2876, percentage, counter) #%1%% complete.  Loaded %2 features
                percentage += 10
                #arcpy.AddMessage("Total Time = {}".format(time.time() - START_TIME))

    #arcpy.AddMessage("Line data loaded, now deleting cursors.  Total Time = {}".format(time.time() - START_TIME))
    del connectionCursor
    del sourceLinesCur
    del targetCursors


def createLinesInsertRow(eachLine, sourceLineParcelID, targetFieldNames, parcelLookUp, sourceFieldNames, oidFieldName, et_Fields):
    """This function is required to handle both lines and connection lines because the target field schema differs.
    This function loops through all the target fields and assigns values and returns back a list that can be used
    by an insert cursor to properly add rows to the correct schema table"""

    insertRow = []
    try: #If a line does not have an associated parcel, enter NONE for ParcelGUID
        parcelGUID = parcelLookUp[sourceLineParcelID][0]
        parcelRecordID = parcelLookUp[sourceLineParcelID][2]
        parcelAccuracy = parcelLookUp[sourceLineParcelID][3]
    except KeyError:
        parcelGUID = None
        parcelRecordID = None
        parcelAccuracy = None

    for eachTargetField in targetFieldNames:
        # Loop through all the target fields and assign them appropriately
        if eachTargetField == "parcelid":  # Populated GUID for parcel ID (Boundary Lines Only)
            insertRow.append(parcelGUID)
        elif eachTargetField == "createdbyrecord":  # Put record ID into the Created By Record Field
            insertRow.append(parcelRecordID)
        elif eachTargetField == "retiredbyrecord": #Populate Retired by record with {DDDD-DDD} GUID if historic
            if eachLine[sourceFieldNames.index("historical")] == 1:
                insertRow.append(RETIRED_REC_ID)
            else:
                insertRow.append(None)
        elif eachTargetField == "cogoaccuracy":
            if eachLine[sourceFieldNames.index("accuracy")] is None or eachLine[sourceFieldNames.index("accuracy")] == 0:
                insertRow.append(parcelAccuracy)
            else:
                insertRow.append(eachLine[sourceFieldNames.index("accuracy")])
        elif eachTargetField == "direction":
            insertRow.append(eachLine[sourceFieldNames.index("bearing")])
        elif eachTargetField == "distance":  # Null the Distance if there is a curve
            if eachLine[sourceFieldNames.index("radius")] is not None:
                insertRow.append(None)
            else:
                insertRow.append(eachLine[sourceFieldNames.index("distance")])
        elif eachTargetField == "arclength":
            if eachLine[sourceFieldNames.index("radius")] is not None: #if a curve
                c = eachLine[sourceFieldNames.index("distance")] #Chord
                r = eachLine[sourceFieldNames.index("radius")]   #Radius
                try: #Attempt to calculate ArcLength.  If equation fails, append None
                    arcLength = 2 * abs(r) * math.asin(abs(c) / (2 * abs(r)))
                    if eachLine[sourceFieldNames.index("ismajor")] == 1: #check isMajor flag to see if curve is major
                        arcLength = (2 * math.pi * abs(r)) - arcLength
                    insertRow.append(arcLength)
                except:
                    insertRow.append(eachLine[sourceFieldNames.index("arclength")])
                    #In this case ArcLength failed to be calculated need to re-add Distance value
                    insertRow[targetFieldNames.index("distance")] = eachLine[sourceFieldNames.index("distance")]
            else:
                insertRow.append(None)
        elif eachTargetField == "upgradedistancerounded":
            #add rounded distance value to this field
            roundedDistance = round(eachLine[sourceFieldNames.index("distance")], IDENTICAL_ROUND_VALUE)
            insertRow.append(roundedDistance)
        elif eachTargetField == "upgradedirectionminus180":
            #Subtracts 180 from bearings that are greater than 180 and store it
            direction = eachLine[sourceFieldNames.index("bearing")]
            if direction > 180:
                insertRow.append(round((direction - 180), 6))
            else:
                insertRow.append(round(direction, 6))
        elif eachTargetField == CREATED_USER and et_Fields:
            insertRow.append(assignEditorTrackingField(eachLine, sourceFieldNames, et_Fields, 0))
        elif eachTargetField == CREATED_DATE and et_Fields:
            insertRow.append(assignEditorTrackingField(eachLine, sourceFieldNames, et_Fields, 1))
        elif eachTargetField == LAST_EDITED_USER and et_Fields:
            insertRow.append(assignEditorTrackingField(eachLine, sourceFieldNames, et_Fields, 2))
        elif eachTargetField == LAST_EDITED_DATE and et_Fields:
            insertRow.append(assignEditorTrackingField(eachLine, sourceFieldNames, et_Fields, 3))
        elif eachTargetField == "originalfeatureoid":
            insertRow.append(eachLine[sourceFieldNames.index(oidFieldName.lower())])
        elif eachTargetField.lower() == 'originalglobalid':
            insertRow.append(eachLine[sourceFieldNames.index('globalid')])
        elif eachTargetField in sourceFieldNames:
            insertRow.append(eachLine[sourceFieldNames.index(eachTargetField)])
        else:
            insertRow.append(None)

    return insertRow


def getSourceAndTargetFieldNames(inputPath, targetPath = None):
    """Will return a list of both source and target field names no Blob Fields and places correct Shape field"""

    descSource = arcpy.Describe(inputPath)
    sourceFieldNames = [each.name.lower() for each in arcpy.ListFields(inputPath) if
                        each.type.lower() != "blob"
                        and each.name.lower() != descSource.shapeFieldName.lower()
                        and each.name.lower() != descSource.areaFieldName.lower()
                        and each.name.lower() != descSource.lengthFieldName.lower()]
    sourceFieldNames.append("shape@")  # Adding the "Shape@" field to get the shape object

    if targetPath is not None:
        descTarget = arcpy.Describe(targetPath)
        targetFieldNames = [each.name.lower() for each in arcpy.ListFields(targetPath) if
                            each.type.lower() != "blob"
                            and each.name.lower() != descTarget.shapeFieldName.lower()
                            and each.name.lower() != descTarget.areaFieldName.lower()
                            and each.name.lower() != descTarget.lengthFieldName.lower()]
        targetFieldNames.append("shape@")  # Adding the "Shape@" field to get the shape object

        return sourceFieldNames, targetFieldNames

    return sourceFieldNames


def transferPoints(inputFabricPath, proFabricDataset, proFabricWorkspace, proFabricPath, arcMapFabricEditorTrackingFields):
    """Transfer Points from desktop fabric to Pro"""

    # Grab editor tracking fields if available
    try:
        et_Fields = arcMapFabricEditorTrackingFields["points"]
    except KeyError:
        et_Fields = None

    # Grab editor tracking fields if available for Control
    try:
        et_Fields_control = arcMapFabricEditorTrackingFields["control"]
    except KeyError:
        et_Fields_control = None

    descTargetFabric = arcpy.Describe(proFabricPath)
    pointsCatalogPath = descTargetFabric.pointsFeatureClass.catalogPath

    xyTolerance = math.sqrt(2) * arcpy.Describe(inputFabricPath + "_Points").spatialReference.xyTolerance

    sourcePointFieldNames, targetFieldNames = getSourceAndTargetFieldNames(inputFabricPath + "_Points",
                                                                           pointsCatalogPath)
    sourcePointFieldNames.append("shape@xy")  #for points get XY shape for later testing
    sourceControlFieldNames = getSourceAndTargetFieldNames(inputFabricPath + "_Control")
    sourceControlFieldNames.append("shape@xy") #for control points get XY shape for later testing

    sourcePointOIDName = arcpy.Describe(inputFabricPath + "_Points").OIDFieldName
    sourceControlOIDName = arcpy.Describe(inputFabricPath + "_Control").OIDFieldName

    controlPointCursor = arcpy.da.SearchCursor(inputFabricPath + "_Control", sourceControlFieldNames)
    pointsCursor = arcpy.da.SearchCursor(inputFabricPath + "_Points", sourcePointFieldNames)

    #Make list of pointID's for all Control points
    controlPointIDs = [eachPointID[0] for eachPointID in arcpy.da.SearchCursor(inputFabricPath + "_Control", ["pointid"])]

    targetPointsCursor = arcpy.da.InsertCursor(pointsCatalogPath, targetFieldNames)

    counter = 0
    pointsFeatureLayer = arcpy.MakeFeatureLayer_management(inputFabricPath + "_Points", "pointsFeatureLayer",
                                                           "CENTERPOINT IS NULL OR CENTERPOINT <> 1")
    controlFeatureLayer = arcpy.MakeFeatureLayer_management(inputFabricPath + "_Control", "controlFeatureLayer",
                                                            "POINTID >= 0")
    pointsCount = int(str(arcpy.GetCount_management(pointsFeatureLayer)))
    pointsCount -= int(str(arcpy.GetCount_management(controlFeatureLayer)))
    del pointsFeatureLayer
    del controlFeatureLayer #delete feature layers

    pointShape_forControl = {}  #Used to store the {pointID: shape, shapeXY} to apply to associated Control Point

    percentage = 10  # used to output during loading
    arcpy.AddIDMessage(ID_INFO, 2878) #Loading parcel points...
    #arcpy.AddMessage("Total Time = {}".format(time.time() - START_TIME))

    for eachRow in pointsCursor:

        if eachRow[sourcePointFieldNames.index("shape@")] is None:
            #Skip points with empty geometry
            continue
        if eachRow[sourcePointFieldNames.index("name")] and (eachRow[sourcePointFieldNames.index(sourcePointOIDName.lower())] in controlPointIDs):
            #Check if arcmap point has a name and that the OID is in list of PointID value on all Control Points. Omit point if both true
            pointShape_forControl.update({eachRow[sourcePointFieldNames.index(sourcePointOIDName.lower())]:
                                              [eachRow[sourcePointFieldNames.index("shape@")],
                                              eachRow[sourcePointFieldNames.index("shape@xy")]]})
            continue #If point is associated to a control skip
        insertRow = []

        if eachRow[sourcePointFieldNames.index("centerpoint")] != 1:
            #Load all points except center points
            for eachTargetField in targetFieldNames:
                if eachTargetField == "isfixed":
                    insertRow.append(0)
                elif eachTargetField == "retiredbyrecord":
                    if eachRow[sourcePointFieldNames.index("historical")] == 1: #Insert {DDDDD...-DDDD} GUID for historic points
                        insertRow.append(RETIRED_REC_ID)
                    else:
                        insertRow.append(None)
                elif eachTargetField == "x":
                    insertRow.append(None)
                elif eachTargetField == "y":
                    insertRow.append(None)
                elif eachTargetField == "z":
                    insertRow.append(None)
                elif eachTargetField == "adjustmentconstraint":
                    insertRow.append(1)
                elif eachTargetField == CREATED_USER and et_Fields:
                    insertRow.append(assignEditorTrackingField(eachRow, sourcePointFieldNames, et_Fields, 0))
                elif eachTargetField == CREATED_DATE and et_Fields:
                    insertRow.append(assignEditorTrackingField(eachRow, sourcePointFieldNames, et_Fields, 1))
                elif eachTargetField == LAST_EDITED_USER and et_Fields:
                    insertRow.append(assignEditorTrackingField(eachRow, sourcePointFieldNames, et_Fields, 2))
                elif eachTargetField == LAST_EDITED_DATE and et_Fields:
                    insertRow.append(assignEditorTrackingField(eachRow, sourcePointFieldNames, et_Fields, 3))
                elif eachTargetField == "originalfeatureoid":
                    insertRow.append(eachRow[sourcePointFieldNames.index(sourcePointOIDName.lower())])
                elif eachTargetField.lower() == 'originalglobalid':
                    insertRow.append(eachRow[sourcePointFieldNames.index('globalid')])
                elif eachTargetField in sourcePointFieldNames:
                    insertRow.append(eachRow[sourcePointFieldNames.index(eachTargetField)])
                else:
                    insertRow.append(None)
            #TODO: Determine why a point with no geometry would be loaded...
            try:
                targetPointsCursor.insertRow(insertRow)
            except:
                pass
            counter += 1
            if counter == int(pointsCount * (percentage / 100)):
                arcpy.AddIDMessage(ID_INFO, 2876, percentage, counter) #%1%% complete.  Loaded %2 features
                percentage += 10
                #arcpy.AddMessage("Total Time = {}".format(time.time() - START_TIME))

    #Transfer all Control Points first
    for eachRow in controlPointCursor:

        insertRow = []

        for eachTargetField in targetFieldNames:

            if eachTargetField == "isfixed":
                if eachRow[sourceControlFieldNames.index("pointid")] in pointShape_forControl:
                    #Compare control point X and associated point X
                    cpX = eachRow[sourceControlFieldNames.index("shape@xy")][0]
                    pointX =  pointShape_forControl[eachRow[sourceControlFieldNames.index("pointid")]][1][0]
                    compareX = compareControlValueToPointValue(cpX, pointX, xyTolerance)

                    #Compare control point Y and associated point Y
                    cpY = eachRow[sourceControlFieldNames.index("shape@xy")][1]
                    pointY = pointShape_forControl[eachRow[sourceControlFieldNames.index("pointid")]][1][1]
                    compareY = compareControlValueToPointValue(cpY, pointY, xyTolerance)

                    if compareX and compareY:
                        insertRow.append(1)
                    else:
                        insertRow.append(0)
                else:
                    insertRow.append(1)
            elif eachTargetField == "xyaccuracy":
                insertRow.append(eachRow[sourceControlFieldNames.index("accuracyxy")])
            elif eachTargetField == "zaccuracy":
                insertRow.append(eachRow[sourceControlFieldNames.index("accuracyz")])
            elif eachTargetField == "adjustmentconstraint":
                insertRow.append(2)
            elif eachTargetField == "shape@" and (eachRow[sourceControlFieldNames.index("pointid")] in pointShape_forControl):
                #Get shape of original associated Point and apply to Control
                insertRow.append(pointShape_forControl[eachRow[sourceControlFieldNames.index("pointid")]][0])
            elif eachTargetField == CREATED_USER and et_Fields_control:
                insertRow.append(assignEditorTrackingField(eachRow, sourceControlFieldNames, et_Fields_control, 0))
            elif eachTargetField == CREATED_DATE and et_Fields_control:
                insertRow.append(assignEditorTrackingField(eachRow, sourceControlFieldNames, et_Fields_control, 1))
            elif eachTargetField == LAST_EDITED_USER and et_Fields_control:
                insertRow.append(assignEditorTrackingField(eachRow, sourceControlFieldNames, et_Fields_control, 2))
            elif eachTargetField == LAST_EDITED_DATE and et_Fields_control:
                insertRow.append(assignEditorTrackingField(eachRow, sourceControlFieldNames, et_Fields_control, 3))
            elif eachTargetField == "originalfeatureoid":
                insertRow.append(eachRow[sourceControlFieldNames.index(sourceControlOIDName.lower())])
            elif eachTargetField.lower() == 'originalglobalid':
                insertRow.append(eachRow[sourceControlFieldNames.index('globalid')])
            elif eachTargetField in sourceControlFieldNames:
                insertRow.append(eachRow[sourceControlFieldNames.index(eachTargetField)])
            else:
                insertRow.append(None)

        try:
            targetPointsCursor.insertRow(insertRow)
        except:
            pass
        counter += 1
        if counter == int(pointsCount * (percentage / 100)):
            arcpy.AddIDMessage(ID_INFO, 2876, percentage, counter) #%1%% complete.  Loaded %2 features
            percentage += 10
            #arcpy.AddMessage("Total Time = {}".format(time.time() - START_TIME))

    #arcpy.AddMessage("Point data loaded, now deleting cursors.  Total Time = {}".format(time.time() - START_TIME))
    del controlPointCursor
    del pointsCursor
    del targetPointsCursor

def compareControlValueToPointValue(cpValue, pointValue, xyTolerance):
    """This will return true if controlValue == pointValue."""

    #Check for Null values. If both are null return that they match. If one is null and the other isn't return False match
    if cpValue is None and pointValue is None:
        return True
    elif cpValue is None or pointValue is None:
        return False

    #If difference in point geometry value is less than xyTolerance then they match.
    return abs(cpValue - pointValue) < xyTolerance


def assignEditorTrackingField(dataRow, sourceFieldNames, et_Fields, et_index):
    """Will return the value of the editor tracking field based on the index."""
    if et_Fields[et_index]:
        return dataRow[sourceFieldNames.index(et_Fields[et_index])]
    else:
        return None


def deleteIdenticalLines(proFabricPath):
    """Will loop through each parcel type and run delete identical for each line feature class"""
    descFabric = arcpy.Describe(proFabricPath)
    for eachParcelType in descFabric.parcelTypes:
        arcpy.AddIDMessage(ID_INFO, 2886, eachParcelType[2]) #Deleting identical overlapping lines for %1
        parcelTypeLineFC = os.path.join(descFabric.path, eachParcelType[2]) #Path of lines feature class
        shapeFieldName = arcpy.Describe(parcelTypeLineFC).shapeFieldName #Gather name of features shape field
        fields = [shapeFieldName, "createdbyrecord", "retiredbyrecord", "upgradedirectionminus180", "upgradedistancerounded"]
        arcpy.DeleteIdentical_management(parcelTypeLineFC, fields)
        arcpy.DeleteField_management(parcelTypeLineFC, "upgradedirectionminus180") #delete added direction -180 field
        arcpy.DeleteField_management(parcelTypeLineFC, "upgradedistancerounded")   #delete added distance rounded field

"""
Below is the Fabric Creation Code
"""

def createProFabricSchema(inputFabricLayer, inputDatasetPath, inputNewFabricName, parcelTypes, et_Fields):

    inputFabricPath = arcpy.Describe(inputFabricLayer).catalogPath  # Path of ArcGIS Desktop Fabric
    proFabricPath = os.path.join(inputDatasetPath, inputNewFabricName)  # Path of soon to be created fabric

    parcelTypesList = [parcelTypes[eachKey][0] for eachKey in parcelTypes.keys()]  # Gets a list for Type creation

    createParcelFabricAndParcelTypes(inputDatasetPath, inputNewFabricName, parcelTypesList)

    descProFabric = arcpy.Describe(proFabricPath)

    #Update parcel types to attach the Polygon and Line feature class names
    parcelTypes = updateParcelTypes(proFabricPath, parcelTypes)

    # Copy used domains from source to target
    addDomainsFromSource(inputFabricPath, inputDatasetPath)

    # Add fields to Pro Fabric Types
    addProFabricFields(inputDatasetPath, inputNewFabricName, parcelTypes, inputFabricPath, descProFabric, et_Fields)


def updateParcelTypes(proFabricPath, parcelTypes):
    """Because Polygon and Line Feature class names could be different because of name conflicts, parcelTypes needs updating
    Update Parcel Type {Key: Parcel Type} ->  {Key: [Parcel Type, Polygon Class, Line Class]}"""

    descProFabric = arcpy.Describe(proFabricPath)
    proFabricWorkspace = os.path.dirname(os.path.dirname(proFabricPath))  # Determining workspace

    ptTable = {eachType[0]: eachType for eachType in descProFabric.parcelTypes}
    #ptTable is a hash table of all the parcel types ex: {ParcelTypeName: (describeParcelTypeValues), ...}

    for key, eachParcelType in parcelTypes.items():
        ptName = eachParcelType[0] #gets string value of the Parcel Type name
        eachParcelType.extend([ptTable[ptName][1], ptTable[ptName][2]]) #Extends parcelType items with Poly and Line names

    return parcelTypes


def getParcelTypes(fabricPath, proFabricWorkspace):
    """Returns a dictionary {TypeNumber: Type] of all the unique values in the Type Field.  Up to 100 values will be returned.
    Will also return to total number of parcels that will be loaded"""
    #Get parcels FC from fabric and workspace
    parcelPath = fabricPath + "_Parcels"
    workspace = os.path.dirname(os.path.dirname(fabricPath))
    #Get Type Field object this will allow to get domain and correct case of field Name and return the [0] value
    typeField = arcpy.ListFields(parcelPath, "type")[0]
    parcelSubtypes = arcpy.da.ListSubtypes(parcelPath)

    #SEARCH CURSOR: Gather all the unique Type Values and count total number of parcels
    typeValues = []
    parcelCount = 0
    for eachValue in arcpy.da.SearchCursor(parcelPath, [typeField.name, "joined"]):
        if eachValue[0] not in typeValues:
            if eachValue[1] == 1:
                typeValues.append(eachValue[0])
        parcelCount += 1

    typeHasSubtypes = 0
    for stcode, stdict in parcelSubtypes.items():
        #Check to see if Subtype Field is Type.  If it is set the flag and break out
        if stdict["SubtypeField"].lower() == "type":
            typeHasSubtypes = 1
            break

    parcelTypes = {} #Will store text names of all parcel types

    #If there is a domain on the field, get the coded values
    if typeField.domain:
        #Find the domain that matches the domain name of the Type Field
        typeCodedValues = [eachDomain for eachDomain in arcpy.da.ListDomains(workspace) if eachDomain.name == typeField.domain]
        #Get all the coded values of that domain
        typeCodedValues = typeCodedValues[0].codedValues
        #Use the set of TypeValues to get all the domains used in the input fabric.
        for eachTypeValue in typeValues:
            try:
                parcelTypes[eachTypeValue] = typeCodedValues[eachTypeValue]
            except: #If typeValue doesn't exist in the list of CodedValues give it a default name with Type Value appended
                if eachTypeValue is None:
                    parcelTypes[eachTypeValue] = NULL_PARCEL_TYPE
                else:
                    if eachTypeValue < 0:
                        parcelTypes[eachTypeValue] = "Parcel_negative_" + str(abs(eachTypeValue))
                    else:
                        parcelTypes[eachTypeValue] = "Parcel_" + str(eachTypeValue)
    elif typeHasSubtypes:
        #Go through all the subtypes and match them to the typeValues found in the data
        subTypeCodes = [stcode for stcode in parcelSubtypes] #gather all the codes of all the subtypes
        for eachTypeValue in typeValues:
            if eachTypeValue in subTypeCodes:
                #If given type value exists in list of subtype codes. Set parcelType to the name of that subtype
                parcelTypes[eachTypeValue] = parcelSubtypes[eachTypeValue]["Name"]
            else:
                if eachTypeValue is None:
                    parcelTypes[eachTypeValue] = NULL_PARCEL_TYPE
                else:
                    if eachTypeValue < 0:
                        parcelTypes[eachTypeValue] = "Parcel_negative_" + str(abs(eachTypeValue))
                    else:
                        parcelTypes[eachTypeValue] = "Parcel_" + str(eachTypeValue)

    else: #If there is no domain just create parcel types based on the typeValue.  If typeValue is NONE set parcelType = Parcel
        for eachTypeValue in typeValues:
            if eachTypeValue is None:
                parcelTypes[eachTypeValue] = NULL_PARCEL_TYPE
            else:
                #Checks to see if Type value is negitive and replaces the - with a "n" to allow correct naming characters
                if eachTypeValue < 0:
                    parcelTypes[eachTypeValue] = "Parcel_negative_" + str(abs(eachTypeValue))
                else:
                    parcelTypes[eachTypeValue] = "Parcel_" + str(eachTypeValue)

    #In the rare case of a Fabric with more than 100 unique Type Values, exit the application and inform user
    if len(parcelTypes) > 99:
        arcpy.AddIDMessage(ID_ERROR, 2882)
        #The source parcel fabric has over 100 unique values in the Type field. This will result in more than 100 parcel
        #types being created. Reduce the amount of unique values in the Type field.
        quit()

    #Convert all values to Lists
    for key in parcelTypes:
        parcelTypes[key] = [parcelTypes[key]]

    if not parcelTypes:
        arcpy.AddIDMessage(ID_WARN, 80365) #input features have no data
        arcpy.AddIDMessage(ID_WARN, 84004) #exiting
        quit()

    return parcelTypes, parcelCount


def createParcelFabricAndParcelTypes(featureDataSet, fabricName, parcelTypes):
    """Creates the parcel fabric and adds each of the different Parcel Types"""

    try: #Try to create the parcel fabric if it fails quit the script
        arcpy.parcel.CreateParcelFabric(featureDataSet, fabricName)
    except:
        e = sys.exc_info()[1]
        arcpy.AddError(e.args[0])
        quit()

    for eachParcelType in parcelTypes: #Create each parcel type
        arcpy.parcel.AddParcelType(os.path.join(featureDataSet, fabricName), eachParcelType)


def addDomainsFromSource(inputFabricPath, inputDatasetPath):
    """This function will find all the domains in the source fabric and add them to new fabrics database"""
    #This will go through and grab all the domains used in the source fabric and create a unique list
    sourceDomainNames = [eachField.domain for eachField in arcpy.ListFields(inputFabricPath + "_Parcels")]
    sourceDomainNames.extend([eachField.domain for eachField in arcpy.ListFields(inputFabricPath + "_Lines")])
    sourceDomainNames.extend([eachField.domain for eachField in arcpy.ListFields(inputFabricPath + "_Points")])
    sourceDomainNames.extend([eachField.domain for eachField in arcpy.ListFields(inputFabricPath + "_Plans")])
    sourceDomainNames.extend([eachField.domain for eachField in arcpy.ListFields(inputFabricPath + "_Control")])
    sourceDomainNames.extend([eachField.domain for eachField in arcpy.ListFields(inputFabricPath + "_LinePoints")])
    sourceDomainNames = list(filter(None, (set(sourceDomainNames)))) #Omits null character that results after set()

    arcpy.AddIDMessage(ID_INFO, 2879) #Creating the following domains:
    arcpy.AddMessage("\n".join(sourceDomainNames))

    #If GP Overwrite is False turn it True
    if arcpy.env.overwriteOutput == False:
        arcpy.env.overwriteOutput = True

    #Get workspaces of input and target fabric
    inputFabricWorkspace = os.path.dirname(os.path.dirname(inputFabricPath))
    proFabricWorkspace = os.path.dirname(inputDatasetPath)

    #Get names of domains that already exist on source
    targetExistingDomains = [eachDomain.name for eachDomain in arcpy.da.ListDomains(proFabricWorkspace)]

    # Create the domains
    for eachDomain in arcpy.da.ListDomains(inputFabricWorkspace):
        if eachDomain.name in sourceDomainNames:
            if eachDomain.name not in targetExistingDomains:
                splitPolicy = "DEFAULT" # Set text for domainType, split and merge policy (they differ from what domain object returns)
                if eachDomain.splitPolicy.lower() == "geometryratio":
                    splitPolicy = "GEOMETRY_RATIO"
                elif eachDomain.splitPolicy.lower() == "duplicate":
                    splitPolicy = "DUPLICATE"

                mergePolicy = "DEFAULT"
                if eachDomain.mergePolicy.lower() == "areaweighted":
                    mergePolicy = "AREA_WEIGHTED"
                elif eachDomain.mergePolicy.lower() == "sumvalues":
                    mergePolicy = "SUM_VALUES"

                domainType = "CODED"
                if eachDomain.domainType.lower() == "range":
                    domainType = "RANGE"

                arcpy.management.CreateDomain(proFabricWorkspace, eachDomain.name, eachDomain.description,
                                              eachDomain.type, domainType, splitPolicy, mergePolicy)
                if eachDomain.codedValues:
                    for codedValue in eachDomain.codedValues:
                        arcpy.management.AddCodedValueToDomain(proFabricWorkspace, eachDomain.name,
                                                               codedValue, eachDomain.codedValues[codedValue])
                elif eachDomain.range:
                    arcpy.management.SetValueForRangeDomain(proFabricWorkspace, eachDomain.name,
                                                            eachDomain.range[0], eachDomain.range[1])

            else:
                arcpy.AddIDMessage(ID_WARN, 2881, eachDomain.name)
                #The domain %s already exists. The source domain was not copied. Make sure domain values are correct on the target database


def addProFabricFields(inputDatasetPath, inputNewFabricName, parcelTypes, inputFabricPath, descProFabric, et_Fields):
    """This is a setup function setting up the different paths and the list of fields to be omitted"""
    parcelPath = inputFabricPath + "_Parcels"
    parcelFields = arcpy.ListFields(parcelPath) #Get all field objects of the Parcels in the Fabric
    linePath = inputFabricPath + "_Lines"
    lineFields = arcpy.ListFields(linePath) #Get all field objects of the Lines in the Fabric
    pointPath = inputFabricPath + "_Points"
    pointFields = arcpy.ListFields(pointPath)
    controlPath = inputFabricPath + "_Control"
    controlFields = arcpy.ListFields(controlPath)
    planPath = inputFabricPath + "_Plans"
    planFields = arcpy.ListFields(planPath)

    # List of all the fields that will not be added to the new Parcel feature classes
    omitParcelFieldsFromFabric = ["rotation", "scale", "joined", "compiled", "historical", "groupid", "construction",
                                "shapestderrore", "shapestderrorn", "backsitebearing",
                                  "constructiondata", "planid", "systemstartdate", "systemenddate"]
    if "parcels" in et_Fields:
        omitParcelFieldsFromFabric.extend(et_Fields["parcels"]) #Don't add source editor tracking field names
    omitParcelFieldsFromFabric.extend(getBlobFieldNames(parcelFields))

    omitLineFieldsFromFabric = ["frompointid", "topointid", "centerpointid", "calculated", "lineparameters",
                                "computedminusobserved", "internalangle", "referenceobject", "ismajor", "densifytype",
                                "bearing", "systemstartdate", "systemenddate", "sequence"]
    if "lines" in et_Fields:
        omitParcelFieldsFromFabric.extend(et_Fields["lines"]) #Don't add source editor tracking field names
    omitLineFieldsFromFabric.extend(getBlobFieldNames(lineFields))

    omitConnectionLineFieldsFromFabric = omitLineFieldsFromFabric[:] #Copy of the Lines list
    omitConnectionLineFieldsFromFabric.extend(["parcelid"]) #Adding parcelID since Pro connections lines aren't associated

    omitPointFieldsFromFabric = ["systemstartdate", "systemenddate", "accuracyxy", "accuracyz"]
    if "points" in et_Fields:
        omitParcelFieldsFromFabric.extend(et_Fields["points"]) #Don't add source editor tracking field names
    omitPointFieldsFromFabric.extend(getBlobFieldNames(pointFields))
    omitPointFieldsFromFabric.extend(getBlobFieldNames(controlFields)) #Check Control for Blob Fields

    omitPlanFieldsFromFabric = ["angleunits", "areaunits", "distanceunits", "directionformat",
                                "lineparameters", "distanceatground", "combinedgridfactor", "truemidbearing",
                                "internalangles", "systemstartdate", "systemenddate", "accuracy", "legaldate"]
    if "plans" in et_Fields:
        omitParcelFieldsFromFabric.extend(et_Fields["plans"]) #Don't add source editor tracking field names
    omitPlanFieldsFromFabric.extend(getBlobFieldNames(planFields))

    polygonNameDict = {key: eachValue[1] for key, eachValue in parcelTypes.items()}
    lineNameDict = {key: eachValue[2] for key, eachValue in parcelTypes.items()}


    #Call Add Fields method to each part of the Pro fabric.  Points called twice for source points and source control

    addFieldsToFabricType(inputDatasetPath, polygonNameDict,
                          "parcels", parcelFields, omitParcelFieldsFromFabric, parcelPath)
    addFieldsToFabricType(inputDatasetPath, lineNameDict,
                          "lines", lineFields, omitLineFieldsFromFabric, linePath)
    addFieldsToFabricType(inputDatasetPath, descProFabric.ConnectionsFeatureClass.name,
                          "connections", lineFields, omitConnectionLineFieldsFromFabric, linePath)
    addFieldsToFabricType(inputDatasetPath, descProFabric.PointsFeatureClass.name,
                          "points", pointFields, omitPointFieldsFromFabric, pointPath)
    addFieldsToFabricType(inputDatasetPath, descProFabric.PointsFeatureClass.name,
                          "control", controlFields, omitPointFieldsFromFabric, pointPath) #controlPoints
    addFieldsToFabricType(inputDatasetPath, descProFabric.RecordsFeatureClass.name,
                          "plans", planFields, omitPlanFieldsFromFabric, planPath)


def getBlobFieldNames(fields):
    """Find and omit all BLOB fields from the sourceFabric these need to be omitted during migration"""
    blobFieldNames = []
    for eachField in fields:
        if eachField.type.lower() == "blob":
            blobFieldNames.append(eachField.name.lower())
    return blobFieldNames


def addFieldsToFabricType(inputDatasetPath, types, feature, listOfFields, omittedFields, featurePath):
    """This function will add fields to each Fabric Type and each related class"""

    descFeature = arcpy.Describe(featurePath)

    #Get Shape, Shape_Length, Shape_Area and OID field names from the passed in feature class
    for attr in ["shapeFieldName", "areaFieldName", "lengthFieldName", "oidFieldName"]:
        try:
            value = getattr(descFeature, attr)
            omittedFields.append(value.lower())
        except:
            pass

    fabricTypeHasGlobalID = False
    for eachField in listOfFields:
        if eachField.type.lower() == "globalid":
            fabricTypeHasGlobalID = True
            break

    if feature == "parcels" or feature == "lines":
        for key, eachType in types.items():
            path = os.path.join(inputDatasetPath, eachType) #get path of each Type

            #Get all the fields that already exist on the Type and append the Omit Fields to the list
            typeFields = [eachType_Field.name.lower() for eachType_Field in arcpy.ListFields(path)]
            typeFields.extend(omittedFields)

            #Print all the fields being added
            #listOfFieldsAdding = [eachField.name for eachField in listOfFields if eachField.name.lower() not in typeFields]

            arcpy.AddIDMessage(ID_INFO, 2880, eachType) #Adding fields to %s
            addFields(path, listOfFields, typeFields)
            arcpy.AddField_management(path, "OriginalFeatureOID", "LONG")
            if fabricTypeHasGlobalID:
                arcpy.AddField_management(path, "OriginalGlobalID", "GUID")

            if feature == "parcels":
                arcpy.AddField_management(path, "OriginalStatedArea", "TEXT")

            if feature == "lines":
                arcpy.AddField_management(path, "COGOAccuracy", "LONG")
                if DELETE_IDENTICAL: #add two fields for delete identical computations
                    arcpy.AddField_management(path, "upgradeDirectionMinus180", "DOUBLE")
                    arcpy.AddField_management(path, "upgradeDistanceRounded", "DOUBLE")

    else:
        path = os.path.join(inputDatasetPath, types)

        existingFields = [eachField.name.lower() for eachField in arcpy.ListFields(path)]
        existingFields.extend(omittedFields)
        arcpy.AddIDMessage(ID_INFO, 2880, types) #Adding fields to %s

        addFields(path, listOfFields, existingFields)
        arcpy.AddField_management(path, "OriginalFeatureOID", "LONG")
        if fabricTypeHasGlobalID:
            arcpy.AddField_management(path, "OriginalGlobalID", "GUID")

        if feature == "connections" or feature == "plans":
            arcpy.AddField_management(path, "COGOAccuracy", "LONG")


def addFields(path, listOfFields, ommitedFields = ""):
    """Adds fields.  Pass a path, list of fields and optional list of fields to omit"""

    #Create a readable list that can be used for arcpy.AddFields
    newListOfFields = []

    for eachField in listOfFields:
        if eachField.name.lower() not in ommitedFields:
            if eachField.type.lower() == "integer":
                fieldType = "LONG"
            elif eachField.type.lower() == "string":
                fieldType = "TEXT"
            elif eachField.type.lower() == "smallinteger":
                fieldType = "SHORT"
            elif eachField.type.lower() == "single":
                fieldType = "FLOAT"
            else:
                fieldType = eachField.type
            newListOfFields.append([eachField.name, fieldType, eachField.aliasName, eachField.length,
                                    eachField.defaultValue, eachField.domain])


    #Cycles through fields with domains and assigns them properly
    arcpy.AddFields_management(path, newListOfFields)


def removeSpatialIndexes(proFabricPath):
    """This function will remove the spatial indexes from all the feature classes.  This allows large out of index
    geometry to be loaded properly.  Spatial indexes will be recalculated when the data is loaded"""

    descFabric = arcpy.Describe(proFabricPath)

    for eachType in descFabric.parcelTypes:
        #Grab each parcel type and remove spatial index from polygon and line feature classes
        try:
            arcpy.RemoveSpatialIndex_management(os.path.join(descFabric.path, eachType[1])) #poly
        except:
            pass
        arcpy.RemoveSpatialIndex_management(os.path.join(descFabric.path, eachType[2])) #line

    #Remove spatial index of records
    arcpy.RemoveSpatialIndex_management(descFabric.RecordsFeatureClass.catalogPath)

    #Remove spatial index of connection lines
    arcpy.RemoveSpatialIndex_management(descFabric.ConnectionsFeatureClass.catalogPath)

    #Remove spatial index of points
    arcpy.RemoveSpatialIndex_management(descFabric.PointsFeatureClass.catalogPath)


def calculateDefaultSpatialIndexes(proFabricPath):
    """This function recalculates the spatial indexes now that the data has been loaded"""

    descFabric = arcpy.Describe(proFabricPath)

    for eachType in descFabric.parcelTypes:
        #Grab each parcel type and remove spatial index from polygon and line feature classes
        arcpy.AddSpatialIndex_management(os.path.join(descFabric.path, eachType[1]), 0, 0, 0) #poly
        arcpy.AddSpatialIndex_management(os.path.join(descFabric.path, eachType[2]), 0, 0, 0) #line

    #Remove spatial index of records
    arcpy.AddSpatialIndex_management(descFabric.RecordsFeatureClass.catalogPath, 0, 0, 0)

    #Remove spatial index of connection lines
    arcpy.AddSpatialIndex_management(descFabric.ConnectionsFeatureClass.catalogPath, 0, 0, 0)

    #Remove spatial index of points
    arcpy.AddSpatialIndex_management(descFabric.PointsFeatureClass.catalogPath, 0, 0, 0)



if __name__ == "__main__":

    #global
    ID_INFO = "INFORMATIVE"
    ID_WARN = "WARNING"
    ID_ERROR = "ERROR"

    #Editor Tracking Field Names
    CREATED_USER = "created_user"
    CREATED_DATE = "created_date"
    LAST_EDITED_USER = "last_edited_user"
    LAST_EDITED_DATE = "last_edited_date"

    NULL_PARCEL_TYPE = "Unassigned_ParcelType"

    START_TIME = time.time()

    RETIRED_REC_ID = '{DDDDDDDD-DDDD-DDDD-DDDD-DDDDDDDDDDDD}'

    #Boolean to determine if user wants to delete identical lines
    DELETE_IDENTICAL = arcpy.GetParameter(4)
    IDENTICAL_ROUND_VALUE = 4

    #TODO: Once API is available, determine max parcel count dynamically
    MAX_RECORD_PARCEL_COUNT = 2000

    main(arcpy.GetParameterAsText(0),
         arcpy.GetParameterAsText(1),
         arcpy.GetParameterAsText(2))

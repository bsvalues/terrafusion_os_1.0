import arcpy as ARCPY
import SSCube as CUBE
import SSPanel as PANEL
import SSCubeUtilities as CUTILS
import sys as SYS
import SSDataObject as SSDO
import numpy as NUM
import sys as SYS
import locale as LOCALE

inputCube = SYS.argv[1]
outputFC =  SYS.argv[2]
pluginType = SYS.argv[3]

if len(SYS.argv) == 4:
    centroids =  SYS.argv[4]
else:
    centroids = True

ARCPY.env.overwriteOutput = True

textFieldKeysCube = ["cell_size", "cell_units", "grid_type", 
                 "num_rows", "num_cols", 
                 "left_start_time", "right_start_time", 
                 "left_end_time", "right_end_time",
                 "time_step", "time_units", "num_time", 
                 "time_step_alignment", 
                 "vertical_separation", "display_type"]

textFieldKeysPanel = [
                 "num_obs", "num_loc", "is_polygon",
                 "left_start_time", "right_start_time", 
                 "left_end_time", "right_end_time",
                 "time_step", "time_units", "num_time", 
                 "time_step_alignment", 
                 "vertical_separation", "display_type"]

def isPanel(dataset):
    """Returns a boolean for whether the input netcdf file is a cube.

    INPUTS:
    netcdfFile (str): path to the netcdf file
    """

    validStr = 'Space-Time Pattern Mining Panel Cube'
    try:
        if validStr in dataset.description:
            return True
        else:
            return False
    except:
        return False

def isPanelCube(netcdfFile):
    import netCDF4 as NET

    try:
        dataset = NET.Dataset(netcdfFile, keepweakref = True)
        isPanelCube = isPanel(dataset) 
        dataset.close()
    except:
        isPanelCube = False

    return isPanelCube 


def createOutput(inputCube, pluginType = "EHS"):
    isPanel = isPanelCube(inputCube) 
    cube = None
    if not isPanel:
        cube = CUBE.SSCube(inputCube)
    else:
        cube = PANEL.SSPanel(inputCube)


    baseFieldNames = cube.obtainVariableListByType(pluginType = pluginType)

    #### Create / Prefix / Suffix ####
    if pluginType == "EHS":
        prefix = "EMERGING_" 
        suffix = ['_HS_ZSCORE', '_HS_PVALUE', '_HS_BIN']
    else:
        prefix = "OUTLIER_" 
        suffix = ['_INDEX', '_PVALUE', '_TYPE']

    candidateFieldList = []
    maskList = []
    k = len(baseFieldNames)
    if not isPanel:

    #### Get Masks, Combined Mask ####
        allMasks = NUM.zeros((cube.sizeSlice, k), dtype = bool)
        for varInd, varName in enumerate(baseFieldNames):
            fullName = prefix + varName
            varMask = cube.obtainVariableMask(fullName)
            allMasks[:,varInd] = varMask
            maskList.append(varMask)
        mask = allMasks.any(1)
        tiledMask = NUM.tile(mask, cube.numTime)
        numOutRows = tiledMask.sum()

        elementField, locationField = cube.getElementFields(tiledMask)
        candidateFieldList.append(elementField)
        candidateFieldList.append(locationField)
        cube.setOutputLocationIDs(locationField, threeD = True)

        #### Row / Column Fields ####
        baseIDs = NUM.arange(cube.sizeSlice, dtype = NUM.int32)
        baseRows = baseIDs // cube.numCols
        baseCols = baseIDs % cube.numCols
        rowData = NUM.tile(baseRows[mask], cube.numTime)
        colData = NUM.tile(baseCols[mask], cube.numTime)

        rowField = SSDO.CandidateField("ROW", "LONG",
                                        data = rowData,
                                        alias = "Row")
        candidateFieldList.append(rowField)

        colField = SSDO.CandidateField("COL", "LONG",
                                       data = colData,
                                       alias = "Column")
        candidateFieldList.append(colField)

        #### Add Base / Estimated / Results Variables ####
        for varInd, varName in enumerate(baseFieldNames):
            #### Var ID ####
            varID = varInd + 1

            #### Get Reverse Mask to Move -9999 to NAN ####
            varMask = maskList[varInd]
            reverseMask = mask != varMask
            reverseMask = NUM.tile(reverseMask, cube.numTime)

            #### Base ####
            varData = cube.obtainValues(varName)
            varData[reverseMask] = NUM.nan
            varData = varData[tiledMask]

            #### Set Output Type ####
            if varData.dtype == float:
                outType = "DOUBLE"
            else:
                outType = "LONG"

            #### Create Variable Candidate Field ####
            outName = "VALUE{0}".format(varID)
            baseVar = SSDO.CandidateField(outName, outType,
                                          data = varData,
                                          alias = varName)
            candidateFieldList.append(baseVar)

            #### Results ####
            varNames = [prefix + varName + suff for suff in suffix]
            iData = cube.obtainValues(varNames[0])
            iData[reverseMask] = NUM.nan
            iData = iData[tiledMask]
            pvData = cube.obtainValues(varNames[1])
            pvData[reverseMask] = NUM.nan
            pvData = pvData[tiledMask]
            binData = cube.obtainValues(varNames[2]) * 1.0
            binData[reverseMask] = NUM.nan
            binData = binData[tiledMask]
            #### Create Candidate Fields ####
            if pluginType == "EHS":
                candidateFieldList += CUTILS.createHotSpot3DFields(varName, iData, 
                                                                 pvData, binData,
                                                                 varID = varID)
            else:
                candidateFieldList += CUTILS.createLocalOutlier3DFields(varName, iData, 
                                                                      pvData, binData,
                                                                      varID = varID)
        #### Create Text Info ####
        iter = range(len(textFieldKeysCube))
        textInfo = [textFieldKeysCube[i] + " = {" + str(i) + "}" for i in iter]
        textInfo = ";".join(textInfo)
        if cube.aggShapeType == 'FISHNET_GRID':
            gridType = 'fishnet'
        else:
            gridType = 'hexagon'

        timeSize, timeUnit = cube.dataset.time_step_label.lower().split(" ")
        exaggration = LOCALE.format_string("%0.6f", cube.exagDecision())
        textVals = [cube.userCellSize, cube.userCellUnit,
                    gridType, str(cube.numRows), str(cube.numCols),
                    cube.dataset.first_start_time, cube.dataset.first_end_time,
                    cube.dataset.last_start_time, cube.dataset.last_end_time,
                    timeSize, timeUnit, str(cube.numTime), cube.alignment, 
                    exaggration, pluginType]
        textResult = textInfo.format(*textVals)

        #### Add Var Names ####
        varVal = ["VAR{0} = {1}".format(i + 1, baseFieldNames[i]) for i in range(k)]
        varVal = ", ".join(varVal)
        varVal = ";Variable List = (" + varVal + ")"
        textResult += varVal
        textResult += ";SSCube"
        textLength = len(textResult)
        textDType = "<U{0}".format(textLength)
        textData = NUM.zeros((cube.numObs,), dtype = textDType)
        textData[0] = textResult

        textField = SSDO.CandidateField("ST_CUBEDESCRIPTION", "TEXT",
                                        data = textData,
                                        alias = "Space Time Cube Description",
                                        length = textLength)
        candidateFieldList.append(textField)

        cube.exportFeatures3D(outputFC, candidateFieldList)
    else:
        elementInfo = cube.getElementFields(tiledMask = None)
        elementField, locationField, locationLabel = elementInfo
        candidateFieldList.append(elementField)
        candidateFieldList.append(locationField)
        candidateFieldList.append(locationLabel)

        #### Add Base / Estimated / Results Variables ####
        for varInd, varName in enumerate(baseFieldNames):
            #### Create Mask Name / Prefix ####
            prefixN = prefix + varName

            #### Set Up Analysis Mask and Output Name ####
            varMask = cube.obtainVariableMask(prefixN)
            useMask = varMask is not None
            if not useMask:
                tiledMask = NUM.ones((cube.numObs,), dtype = bool)
            else:
                tiledMask = NUM.tile(varMask, cube.numTime)

            #### Var ID ####
            varID = varInd + 1
            #### Get Variable Data ####
            data = cube.obtainValues(varName)
            #### Assure 3-D Variable ####
            if len(data.shape) != 2:
                ARCPY.AddIDMessage("ERROR", 110027)
                cube.close()
                raise SystemExit()

            varNames = [prefix + varName + suff for suff in suffix]
            iData = cube.obtainValues(varNames[0], flatten = True)[tiledMask]
            pvData = cube.obtainValues(varNames[1], flatten = True)[tiledMask]
            binData = cube.obtainValues(varNames[2], flatten = True)[tiledMask]
       
            #### Create Candidate Fields ####
            if pluginType == "EHS":
                candidateFieldList += CUTILS.createHotSpot3DFields(varName, iData, 
                                                                 pvData, binData,
                                                                 varID)
            else:
                candidateFieldList += CUTILS.createLocalOutlier3DFields(varName, iData, 
                                                                      pvData, binData,
                                                                      varID)

        #### Create Text Info ####
        iter = range(len(textFieldKeysPanel))
        textInfo = [textFieldKeysPanel[i] + " = {" + str(i) + "}" for i in iter]
        textInfo = ";".join(textInfo)

        timeSize, timeUnit = cube.dataset.time_step_label.lower().split(" ")
        exaggration = LOCALE.format_string("%0.6f", cube.exagDecision())
        textVals = [str(cube.numObs), str(cube.numLocations),str(cube.isPolygon),
                    cube.dataset.first_start_time, cube.dataset.first_end_time,
                    cube.dataset.last_start_time, cube.dataset.last_end_time,
                    timeSize, timeUnit, str(cube.numTime), cube.alignment, 
                    exaggration, pluginType]
        textResult = textInfo.format(*textVals)
        varVal = ["VAR{0} = {1}".format(i + 1, baseFieldNames[i]) for i in range(k)]
        varVal = ", ".join(varVal)
        varVal = ";Variable List = (" + varVal + ")"
        textResult += varVal
        textResult += ";SSPanel"
        textLength = len(textResult)
        textDType = "<U{0}".format(textLength)
        textData = NUM.zeros((cube.numObs,), dtype = textDType)
        textData[0] = textResult
        textField = SSDO.CandidateField("ST_CUBEDESCRIPTION", "TEXT",
                                        data = textData,
                                        alias = "Space Time Cube Description",
                                        length = textLength)
        candidateFieldList.append(textField)

        if centroids == True:
            cube.exportFeatures3D(outputFC, candidateFieldList, 
                                  useCentroids = True)
        else:
            if cube.isPolygon:
                cube.exportFeatures3D(outputFC, candidateFieldList, 
                                        useCentroids = False)
            else:
                cube.exportFeatures3D(outputFC, candidateFieldList, 
                                      useCentroids = True)
    cube.close()
createOutput(inputCube, pluginType)
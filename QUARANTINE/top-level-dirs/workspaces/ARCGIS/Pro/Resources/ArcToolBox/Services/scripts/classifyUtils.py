from __future__ import unicode_literals
import arcpy
import json
import copy
import conversionUtils
import rendererUtils
import analysisutils
import os

layerName = "classlayer"
classField = "class"
classFieldAlias = "Class"
minField = "Value_Min"
minFieldAlias = "Minimum Value"
maxField = "Value_Max"
maxFieldAlias = "Maximum Value"

#blue = [0,0,255,255]
blue = [69,117,180,255]
#red = [255,0,0,255]
red = [215,48,39,255]
black = [0,0,0,255]
gray = [125,125,125,255]
fromColor = [247,251,255,255]
toColor = [8,48,107,255]

defaultColor = gray
defaultOutlineColor = black
defaultOutlineSymbol = {
"type": "esriSLS",
"style": "esriSLSSolid",
"color": defaultOutlineColor,
"width": 0.2
}

defaultColorRamp = {
"type": "algorithmic",
"fromColor": blue,
"toColor": red,
"algorithm": "esriHSVAlgorithm"
}

purpleColorRamp = {
    "type": "algorithmic",
    "fromColor": [252, 251, 253, 125],
    "toColor": [63, 0, 125, 255],
    "algorithm": "esriCIELabAlgorithm"
}

#yellowToBrownColorRamp = {
    #"type": "algorithmic",
    #"fromColor": [255,255,229,255],
    #"toColor": [102,37,6,255],
    #"algorithm": "esriCIELabAlgorithm"
#}

yellowToBrownColorRamp = {
  "type": "multipart",
  "colorRamps": [
    {
      "type": "algorithmic",
      "fromColor": [255,255,229,255],
      "toColor": [254,153,41,255],
      "algorithm": "esriHSVAlgorithm"
    },
    {
      "type": "algorithmic",      
      "fromColor": [254,153,41,255],
      "toColor": [102,37,6,255],
      "algorithm": "esriHSVAlgorithm"
    }
  ]
}

whiteToRedColorRamp = {
    "type": "algorithmic",
    "fromColor": [255,235,214,125],
    "toColor": [196,10,10,255],
    "algorithm": "esriHSVAlgorithm"
}

#whiteToRedColorRamp = {
  #"type": "multipart",
  #"colorRamps": [
    #{
      #"type": "algorithmic",
      #"fromColor": [255,245,240,125],
      ##"toColor": [251,106,74,255],
      #"toColor":  [203,24,29,255],
      #"algorithm": "esriHSVAlgorithm"
    #},
    ##{
      ##"type": "algorithmic",
      ##"fromColor": [252,146,114,255],
      ##"toColor": [239,59,44,255],
      ##"algorithm": "esriHSVAlgorithm"
    ##},
    #{
      #"type": "algorithmic",      
      #"fromColor": [203,24,29,255],
      ##"fromColor": [251,106,74,255],
      #"toColor": [103,0,13,255],
      #"algorithm": "esriHSVAlgorithm"
    #}
  #]
#}


defaultColorRamps = {"redToBlue":
[
[49,54,149,255],
[69,117,180,255],
[116,173,209,255],
[171,217,233,255],
[224,243,248,255],
[254,224,144,255],
[253,174,97,255],
[244,109,67,255],
[215,48,39,255],
[165,0,38,255]
]
,
"yellowToBrown":
[
[255,255,229,255],
[255,250,200,255],
[255,247,188,255],
[254,227,145,255],
[254,196,79,255],
[254,153,41,255],
[236,112,20,255],
[204,76,2,255],
[153,52,4,255],
[102,37,6,255]
],
"whiteToRed":
[
[255,245,240,255],
[255,235,225,255],
[254,224,210,255],
[252,187,161,255],
[252,146,114,255],
[251,106,74,255],
[239,59,44,255],
[203,24,29,255],
[165,15,21,255],
[103,0,13,255]
]    


}                     
                     

defaultMarkerSymbol = {
"type": "esriSMS",
"style": "esriSMSCircle",
"color": defaultColor,
"size": 10,
"angle": 0,
"xoffset": 0,
"yoffset": 0,
"outline": defaultOutlineSymbol
}

defaultLineSymbol = {
"type": "esriSLS",
"style": "esriSLSSolid",
"color": defaultColor,
"width": 1
}



defaultFillSymbol = {
"type": "esriSFS",
"style": "esriSFSSolid",
"color": defaultColor,
"outline": defaultOutlineSymbol
}

getClassCodeBlock = """
def getClass(value, breakValues):
  index = 0
  for breakValue in breakValues:
    if value < breakValue:
      return index
    index = index + 1
  return index
"""

getMinMaxCodeBlock = """
def getMinMax(value, breakValues, offset, conversionFactor):
  if value > 0:
    return breakValues[value - offset] * conversionFactor
  else:
    return breakValues[value]* conversionFactor
"""

def getColors(numClasses, colorRampName):
    #arcpy.AddMessage(str(defaultColorRamps.get(numClasses)))
    colorRamp = defaultColorRamps.get(colorRampName)
    return colorRamp


def getDefaultSymbol(shapeType):

    #arcpy.AddMessage(shapeType)

    if shapeType == "Point":
        symbol = defaultMarkerSymbol
    elif shapeType == "Polyline":
        symbol = defaultLineSymbol
    elif shapeType == "Polygon":
        symbol = defaultFillSymbol

    #arcpy.AddMessage(str(symbol))
    return symbol


def getUniqueValueDef(shapeType, field, colorRamp=None):

    symbol = getDefaultSymbol(shapeType)
    
    if colorRamp == None:
        uniqueColorRamp = defaultColorRamp
    else:
        uniqueColorRamp = colorRamp

    symbologyDef = {
        "type": "uniqueValueDef",
        "uniqueValueFields": [field],
        "baseSymbol": symbol,
        "colorRamp": uniqueColorRamp
    }

    #arcpy.AddMessage(str(symbologyDef))
    return symbologyDef

    

def getClassificationCode(classificationType):

    #arcpy.AddMessage(classificationType)
    
    classificationType = classificationType.upper().replace("_", "")
    classificationCode = 1
    if classificationType == "EQUALINTERVAL":
        classificationCode = 2
    elif classificationType == "QUANTILE" or \
         classificationType == "EQUALAREA":
        classificationCode = 3
    elif classificationType == "STANDARDDEVIATION":
        classificationCode = 4
    elif classificationType == "GEOMETRICALINTERVAL" or \
         classificationType == "GEOMETRICINTERVAL":
        classificationCode = 5
    elif classificationType == "DEFINEDINTERVAL":
        classificationCode = 6

    #arcpy.AddMessage(classificationCode)

    return classificationCode


def getClassificationMethod(classificationType):

    #arcpy.AddMessage(classificationType)
    classificationType = classificationType.upper().replace("_","")
    classificationMethod = "esriClassifyEqualInterval"
    if classificationType == "EQUALINTERVAL":
        classificationMethod = "esriClassifyEqualInterval"
    elif classificationType == "QUANTILE" or \
         classificationType == "EQUALAREA":
        classificationMethod = "esriClassifyQuantile"
    elif classificationType == "STANDARDDEVIATION":
        classificationMethod = "esriClassifyStandardDeviation"
    elif classificationType == "GEOMETRICALINTERVAL" or \
         classificationType == "GEOMETRICINTERVAL":
        classificationMethod = "esriClassifyGeometricalInterval"
    elif classificationType == "DEFINEDINTERVAL":
        classificationMethod = "esriClassifyDefinedInterval"
    elif classificationType == "NATURALBREAKS":
        classificationMethod = "esriClassifyNaturalBreaks"

    #arcpy.AddMessage(classificationMethod)

    return classificationMethod


def getClassBreaksDef(shapeType, field, classificationType, numClasses, normField=None):

    symbol = getDefaultSymbol(shapeType)
    classificationMethod = getClassificationMethod(classificationType)

    symbologyDef = {
        "type": "classBreaksDef",
        "classificationField": field,
        "classificationMethod": classificationMethod,
        "colorRamp": defaultColorRamp,
        "baseSymbol": symbol
    }
   

    if classificationType == "STANDARD_DEVIATION":
        symbologyDef["standardDeviationInterval"] = float(numClasses)
    elif classificationType == "DEFINED_INTERVAL":
        symbologyDef["definedInterval"] = float(numClasses)
    else:
        symbologyDef["breakCount"] = int(numClasses)
        
    if normField:
        symbologyDef["normalizationType"] = "esriNormalizeByField",
        symbologyDef["normalizationField"] = normField

    #arcpy.AddMessage(str(symbologyDef))

    return symbologyDef

def getSymbologyClasses(symbology):
    renderer=symbology['renderer']
    uniqValueInfos=renderer.get('uniqueValueInfos', None)
    classValues=[]
    if uniqValueInfos:
        for item in uniqValueInfos:
            classValues.append(item['value'])
    
    return classValues

def setSymbology(layer, symbologyDef):
    #Convert layer to featureset
    if layer.isFeatureLayer:
        fs=arcpy.FeatureSet(layer)

    fs._arc_object.setsymbology(symbologyDef)

    symbology=json.loads(fs._arc_object.getsymbology())

    # sort uniquevalues
    if symbologyDef.get("type") == "uniqueValueDef":
        classValues = rendererUtils.sortClassValues(getSymbologyClasses(symbology))
        symbology['classValues'] = classValues

    # hide other values    
    #layer.symbology.showOtherValues = False
    symbology['showOtherValues']=False
    

    symbology['transparency']=25

    return symbology


def convertClassBreaksToUniqueValue(classBreaksRenderer, field):

    uniqueValueRenderer = {"type": "uniqueValue", "field1": field}
    #defaultSymbol = classBreaksRenderer.get("defaultSymbol")
    #defaultSymbol = defaultFillSymbol
    #if defaultSymbol:
        #uniqueValueRenderer["defaultSymbol"] = defaultSymbol
    #defaultLabel = classBreaksRenderer.get("defaultLabel")
    #if defaultLabel is not None:
        #uniqueValueRenderer["defaultLabel"] = defaultLabel

    if classBreaksRenderer:
        classBreakInfos = classBreaksRenderer.get("classBreakInfos")
        if classBreakInfos:
            uniqueValueInfos = []
            value = 0
            for classBreakInfo in classBreakInfos:
                value = value + 1
                label = classBreakInfo.get("label")
                symbol = classBreakInfo.get("symbol")
                uniqueValueInfo = {"value": str(value), "label": label, "symbol": symbol}
                uniqueValueInfos.append(uniqueValueInfo)
            uniqueValueRenderer["uniqueValueInfos"] = uniqueValueInfos

    #arcpy.AddMessage(str(uniqueValueRenderer))
    return uniqueValueRenderer

def getRangeValuesFromClassBreaksRenderer(classBreaksRenderer):

    ranges = {}
    if classBreaksRenderer:
        classBreakInfos = classBreaksRenderer.get("classBreakInfos")
        if classBreakInfos:
            value = 0
            for classBreakInfo in classBreakInfos:
                value = value + 1
                ranges[value] = classBreakInfo

    #arcpy.AddMessage(str(ranges))
    return ranges


def roundClassBreaksRenderer(classBreaksRenderer):

    if classBreaksRenderer:
        classBreakInfos = classBreaksRenderer.get("classBreakInfos")
        size = len(classBreakInfos)
        if size > 1:
            minValue = classBreakInfos[0].get("classMinValue")
            maxValue = classBreakInfos[size - 1].get("classMaxValue")
            delta = maxValue - minValue

        #arcpy.AddMessage(str(classBreaksRenderer))

def updateLabelsWithRanges(drawingInfo, rangeValues, conversionFactor=1.0):

    renderer = drawingInfo.get("renderer")
    if renderer:
        uniqueValueInfos = renderer.get("uniqueValueInfos")
        if uniqueValueInfos:
            #arcpy.AddMessage(str(uniqueValueInfos))
            for uniqueValueInfo in uniqueValueInfos:
                value = int(uniqueValueInfo.get("value"))
                valueRange = rangeValues.get(value)
                if valueRange:
                    classMinValue = valueRange.get("classMinValue")*conversionFactor
                    classMaxValue = valueRange.get("classMaxValue")* conversionFactor
                    label = "{} - {}".format(classMinValue, classMaxValue)
                    uniqueValueInfo["label"] = label
            #arcpy.AddMessage(str(uniqueValueInfos))

def updateLabelsWithClassBreaks(drawingInfo, classBreakValues, conversionFactor=1.0):
    renderer = drawingInfo.get("renderer")
    breakValuesList=[float(x) for x in classBreakValues.split(',')]
    if renderer:
        uniqueValueInfos = renderer.get("uniqueValueInfos")
        if uniqueValueInfos:
            #arcpy.AddMessage(str(uniqueValueInfos))
            for uniqueValueInfo in uniqueValueInfos:
                value = int(uniqueValueInfo.get("value"))
                classMinValue = breakValuesList[value-1]*conversionFactor
                classMaxValue = breakValuesList[value]*conversionFactor
                #label = "{} - {}".format(classMinValue, classMaxValue)
                label = "%.15F - %.15F"%(classMinValue, classMaxValue)
                uniqueValueInfo["label"] = label
            
def updateOutline(drawingInfo, outLineWidth=None, outLineColor=None):
    '''updates the outline width and color of UniqueValueRenderers'''

    renderer = drawingInfo.get("renderer")
    if renderer:
        uniqueValueInfos = renderer.get("uniqueValueInfos")
        if uniqueValueInfos:
            #arcpy.AddMessage(str(uniqueValueInfos))
            for uniqueValueInfo in uniqueValueInfos:  
                symbol = uniqueValueInfo.get("symbol")
                if symbol:
                    if outLineColor:
                        symbol["color"] = outLineColor
                    if outLineWidth >= 0:
                        symbol["outline"]["width"] = outLineWidth
    #arcpy.AddMessage(str(renderer))
        
    
def updateColors(outFeatures, errorDrawingInfo, colorRamp):
    '''converts the colors of one uniquevalue renderer to another,
    the number of unique values should be same in template renderer'''

    drawingInfo = uniqueFeatures(outFeatures, "classes", colorRamp)
    colorRenderer = drawingInfo.get("renderer")
    renderer = errorDrawingInfo.get("renderer")
    
    if colorRenderer and renderer:
        uniqueValueInfos = renderer.get("uniqueValueInfos")
        colorUniqueValueInfos = colorRenderer.get("uniqueValueInfos")        
        if uniqueValueInfos and colorUniqueValueInfos:
                for uniqueValueInfo, colorUniqueValueInfo in zip(uniqueValueInfos, colorUniqueValueInfos):
                    symbol = colorUniqueValueInfo.get("symbol")
                    color = symbol.get("color")
                    uniqueValueInfo["symbol"]["color"] = copy.deepcopy(color)
                       
    

def getRangeValuesFromLayer(layer, classField, minField, maxField):

    rangeValues = {}
    incursor = arcpy.da.SearchCursor(layer, [classField, minField, maxField])
    for row in incursor:
        rangeValues[row[0]] = {"classMinValue":row[1],"classMaxValue":row[2]}

    del incursor

    #arcpy.AddMessage(len(rangeValues))
    
    return rangeValues


def getBreakValues(classBreaksRenderer, inRaster):

    breakValues = ""

    ras = arcpy.Raster(inRaster)
    minRas = ras.minimum
    maxRas = ras.maximum

    if classBreaksRenderer:
        classBreakInfos = classBreaksRenderer.get("classBreakInfos")
        if classBreakInfos:
            index = 0
            count = len(classBreakInfos)
            for classBreakInfo in classBreakInfos:
                if index == 0:
                    minValue = classBreakInfo.get("classMinValue")
                    if minValue > minRas:
                        arcpy.AddMessage("GetBreakValues correct min value: {} {}".format(minValue, minRas))
                        minValue = minRas
                    #maxValue = classBreakInfo.get("classMaxValue")
                    #delta = (maxValue - minValue) / 100
                    #minValue = minValue - delta
                    breakValues = "{}".format(minValue)

                if index == count - 1:
                    minValue = classBreakInfo.get("classMinValue")
                    maxValue = classBreakInfo.get("classMaxValue")
                    if maxValue < maxRas:
                        arcpy.AddMessage("GetBreakValues correct max value: {} {}".format(maxValue, maxRas))
                        maxValue = maxRas
                    delta = (maxValue - minValue) / 100
                    value = maxValue + delta
                else:
                    value = classBreakInfo.get("classMaxValue")

                breakValues += ",{}".format(value)
                index = index + 1

    #arcpy.AddMessage(breakValues)
    return breakValues


def calcMinMax(layerName, field, breakValues, fieldName, fieldAlias, offset, conversionFactor):

    arcpy.AddMessage("{} {} {}".format(layerName, fieldName, fieldAlias))
    
    arcpy.AddField_management(layerName, fieldName, "DOUBLE", "", "", "", fieldAlias)
    expression = "getMinMax(!{}!,[{}],{},{})".format(field, breakValues, offset, conversionFactor)
    #arcpy.AddMessage(expression)
    arcpy.CalculateField_management(layerName, fieldName, expression, "PYTHON_9.3", getMinMaxCodeBlock)
    arcpy.AddMessage(fieldName)
    
    
# used by classifyFeatures
# def reclassFeatures(layerName, field, breakValues):

#     arcpy.AddField_management(layerName, classField, "LONG", "", "", "", classFieldAlias)
#     expression = "getClass(!{}!,[{}])".format(field, breakValues)
#     arcpy.AddMessage(expression)
#     arcpy.CalculateField_management(layerName, classField, expression, "PYTHON_9.3", getClassCodeBlock)
#     arcpy.AddMessage(classfield)
#     calcMinMax(layerName, field, breakValues, minField, minFieldAlias, 1)
#     calcMinMax(layerName, field, breakValues, maxField, maxFieldAlias, 0)


# unused method
# def classifyFeatures(inFeatures, field, classificationType, numClasses, normField):

#     layer = arcpy.MakeFeatureLayer_management(inFeatures, layerName).getOutput(0)
#     #arcpy.AddMessage(layerName)

#     dFeatureClass = arcpy.Describe(layerName);
#     shapeType = dFeatureClass.shapeType

#     symbologyDef = getClassBreaksDef(shapeType, field, classificationType, numClasses, normField)
#     symbology = setSymbology(layer, symbologyDef)
#     if symbology:
#         classBreaksRenderer = symbology.get("renderer")
#         #arcpy.AddMessage(str(classBreaksRenderer))
#         breakValues = getClassBreaks(classBreaksRenderer)

#     symbology = None
#     if breakValues:
#         reclassFeatures(layerName, field, breakValues)
#         uniqueValueRenderer = convertClassBreaksToUniqueValue(classBreaksRenderer, classField)
#         symbology = {"renderer": uniqueValueRenderer, "transparency": 50}
#         #arcpy.AddMessage(str(symbology))

#     return symbology


def uniqueFeatures(inFeatures, field, colorRamp=None):

    layer = arcpy.MakeFeatureLayer_management(inFeatures, layerName).getOutput(0)

    dFeatureClass = arcpy.Describe(layerName)
    shapeType = dFeatureClass.shapeType

    symbologyDef = getUniqueValueDef(shapeType, field, colorRamp)
    symbology = setSymbology(layer, symbologyDef)

    return symbology



def getRanges(breakValues):
    values = breakValues.split(",")
    ranges = ""
    prev = None
    index = 0
    for value in values:
        #workaround to avoid e values
        value = conversionUtils.convertEValuetoDecimalRep(value)
        if index > 0:
            if index > 1:
                ranges += ";"
            ranges += "{} {} {}".format(prev, value, index)
        prev = value
        index = index + 1

    #arcpy.AddMessage(ranges)
    return ranges


def reclassRaster(startTime, inRaster, outRaster, outFeatures,
                  field, breakValues, conversionFactor,areaUnits):
    #arcpy.AddMessage("getRanges")
    ranges = getRanges(breakValues)
    arcpy.AddMessage("Reclassify raster parameters")
    #arcpy.AddMessage("{},{},{}".format(inRaster, field, outRaster))
    #arcpy.AddMessage(ranges)
    #arcpy.AddMessage(ranges)
    arcpy.gp.Reclassify_sa(inRaster, field, ranges, outRaster, "NODATA")
    startTime = analysisutils.AddTimerMessage(startTime, "reclassify")
    #arcpy.AddMessage("Reclassified Raster : {}".format(outRaster))
    #arcpy.RasterToPolygon_conversion(outRaster, outFeatures, "NO_SIMPLIFY", "Value")
    arcpy.RasterToPolygon_conversion(outRaster, outFeatures, "SIMPLIFY", "Value")
    #debugUtils.debugFeatureClass(outFeatures)
    startTime = analysisutils.AddTimerMessage(startTime, "Raster to Polygon")
    fieldName = "Gridcode"
    arcpy.AlterField_management(outFeatures, fieldName, classField, classFieldAlias)
    #analysisutils.renameFields(outFeatures,[(fieldName, classField, classFieldAlias)])
    startTime = analysisutils.AddTimerMessage(startTime, "rename field gridcode to class")
    arcpy.DeleteField_management(outFeatures,"Id")
    startTime = analysisutils.AddTimerMessage(startTime, "delete Id field")
    
    global maxField
    global minField
    global maxFieldAlias
    global minFieldAlias
    if areaUnits:
        areaUnits = areaUnits.rstrip("s")
        tmpmaxField = "{}_per_{}".format(maxField, areaUnits)
        tmpminField = "{}_per_{}".format(minField, areaUnits)
        areaUnits = areaUnits.replace("Square", "Square ")
        tmpmaxFieldAlias = "{} per {}".format(maxFieldAlias, areaUnits)
        tmpminFieldAlias = "{} per {}".format(minFieldAlias, areaUnits)
    else:
        tmpmaxField = maxField
        tmpminField = minField
        tmpmaxFieldAlias = maxFieldAlias
        tmpminFieldAlias = minFieldAlias
        
    calcMinMax(outFeatures, classField, breakValues, tmpminField, tmpminFieldAlias, 1, conversionFactor)
    startTime = analysisutils.AddTimerMessage(startTime, "Add Min field")
    calcMinMax(outFeatures, classField, breakValues, tmpmaxField, tmpmaxFieldAlias, 0, conversionFactor)
    startTime = analysisutils.AddTimerMessage(startTime, "Add Max field")
    return startTime


def getRasterClassBreaks(inRaster, field, classificationType, numClasses):
    '''To get the class breaks value from a raster surface
    '''
    raster = arcpy.Raster(inRaster)
    clsBrks = [raster.minimum]
    try:
        rasClsBrks=arcpy.gp.listrasterclassbreaks(raster, field, classificationType, numClasses)
        if isinstance(rasClsBrks, list):
            clsBrks += rasClsBrks
        else:
            raise Exception("invalid class break values!")
    except Exception as e:
        arcpy.AddMessage("Unable to calculate the class breaks for {} because {}".format(\
                                                                        inRaster, str(e)))
        raise Exception
    
    return ",".join([str(x) for x in clsBrks])

def classifyRaster(startTime, inRaster, field, classificationType, 
                   numClasses, outRaster, outFeatures, conversionFactor, areaUnits):
    startTime = analysisutils.AddTimerMessage(startTime, "Make Raster Layer and mapping Layer")

    breakValues = getRasterClassBreaks(inRaster, field, classificationType, numClasses)
    #arcpy.AddMessage('breakValues: {}'.format(breakValues))
    if breakValues:
        startTime = reclassRaster(startTime, inRaster, outRaster, outFeatures, 
                                field, breakValues, conversionFactor,areaUnits)              
        symbology = uniqueFeatures(outFeatures, classField, purpleColorRamp)
        startTime = analysisutils.AddTimerMessage(startTime, "UniqueValue renderer")
        #rangeValues = getRangeValuesFromClassBreaksRenderer(breakValues)
        #updates label to ranges
        #updateLabelsWithRanges(symbology, rangeValues, conversionFactor)       
        updateLabelsWithClassBreaks(symbology, breakValues, conversionFactor) 
        #sets outline to 0
        updateOutline(symbology, 0)
        #removes default labels and symbol
        removeDefaults(symbology)
        #arcpy.AddMessage(str(symbology))        
        startTime = analysisutils.AddTimerMessage(startTime, "update labels, outline etc in symbology")

    return symbology


def classifyLayer(layerName, shapeType, field, classificationType, numClasses, normField):

    layer = arcpy.MakeFeatureLayer_management(layerName, layerName).getOutput(0)
    symbologyDef = getClassBreaksDef(shapeType, field, classificationType, numClasses, normField)
    layer._arc_object.setsymbology(symbologyDef)

# Not used
def updateShape(drawingInfo, shapeType="point"):
    '''updates the symbol shape of uniquevalueinfo'''

    renderer = drawingInfo.get("renderer")
    if renderer:
        uniqueValueInfos = renderer.get("uniqueValueInfos")
        if uniqueValueInfos:
            if "point" in shapeType.lower():
                shapeSymbol = defaultMarkerSymbol
            elif "line" in shapeType.lower():
                shapeSymbol = defaultMarkerSymbol
            else:
                return drawingInfo   
            for uniqueValueInfo in uniqueValueInfos:
                    symbol = uniqueValueInfo.get("symbol")
                    color = symbol["color"]
                    shapeSymbol["color"] = color
                    uniqueValueInfo["symbol"] = shapeSymbol                    
    return drawingInfo              


def getClassBreaksRenderer(outFeatures, fieldName, colorRampName="yellowToBrown"):
    '''create class breaks drawingInfo'''
    arcpy.AddMessage("in classbreaks renderer")
    renderer = {}
    renderer["type"] = "classBreaks"
    renderer["field"]= fieldName
    renderer["backgroundFillSymbol"] = defaultFillSymbol
    #renderer["defaultSymbol"] = defaultMarkerSymbol
    #renderer["defaultLabel"] = ""
    
    # create classbreakInfos    
    # get range values for each classes
    rangeValues = getRangeValuesFromLayer(outFeatures, "classes", "value_min", "value_max")
    #arcpy.AddMessage(str(rangeValues))
    colorVals = defaultColorRamps[colorRampName]
    #arcpy.AddMessage(str(colorVals))
    classBreaksInfo = []    
    for i in range(0, len(rangeValues)):
        classBreakInfo = {}       
        rangeval = rangeValues[i]
        classBreakInfo["classMinValue"] = rangeval["classMinValue"]
        classBreakInfo["classMaxValue"] = rangeval["classMaxValue"]
        lbl = "{} - {}".format(rangeval["classMinValue"], rangeval["classMaxValue"])
        classBreakInfo["label"] = lbl
        classBreakInfo["symbol"]= copy.deepcopy(defaultMarkerSymbol)      
        classBreakInfo["symbol"]["color"] = colorVals[i]        
        #arcpy.AddMessage(str(classBreakInfo))
        classBreaksInfo.append(classBreakInfo)
    #arcpy.AddMessage(str(classBreaksInfo))
    renderer["classBreaksInfo"] = classBreaksInfo
    renderer["minValue"] = rangeValues[0]["classMinValue"]
    #arcpy.AddMessage(str(classBreaksInfo))
    drawingInfo = {"renderer":renderer, "transparency":0}
    
    return drawingInfo
    
def getGAContourDrawingInfo(outFeatures, isErrorSurface=False):
    '''creates drawingInfo based on fields from GALayer to Contour output''' 
    # creates unique value renderer json for interpolate surface and error surface when needed
    if isErrorSurface:
        colorRamp = whiteToRedColorRamp
    else:
        colorRamp = yellowToBrownColorRamp
    
    drawingInfo = uniqueFeatures(outFeatures, "classes", colorRamp)
    # get range values for each classes
    rangeValues = getRangeValuesFromLayer(outFeatures, "classes", "value_min", "value_max")
    #update labels
    updateLabelsWithRanges(drawingInfo, rangeValues)
    # update outlineWidth
    updateOutline(drawingInfo, 0)    
    # remove default labels
    removeDefaults(drawingInfo)
    #arcpy.AddMessage(str(drawingInfo))
    return drawingInfo

def getGAPointsDrawingInfo(predictedPoints, surfacedrawingInfo, fieldName="Predicted"):
    '''drawing info for predicted points'''
    drawingInfo =convertUniqueValueToClassBreaks(surfacedrawingInfo, fieldName)
    renderer = drawingInfo.get("renderer")
    classBreakInfos = renderer.get("classBreakInfos")
    
    
    # check for min/max value and extend first and last class break
    xDrawingInfo = rendererUtils.getGraduatedColorsInfo(predictedPoints, fieldName,
                                                        shapeType="point")
    xRenderer = xDrawingInfo.get("renderer")
    xClassBreakInfos = xRenderer.get("classBreakInfos")
    
    def getMinValue(_renderer):        
        return _renderer.get("minValue")
    
    def getMaxValue(_classBreaksInfo):         
        return _classBreaksInfo[-1]["classMaxValue"]    
    
    xMinValue = getMinValue(xRenderer)
    minValue = getMinValue(renderer)    
    if xMinValue < minValue:
        renderer["minValue"] = xMinValue
        classBreakInfos[0]["classMinValue"] = xMinValue
        lbl = classBreakInfos[0]["label"].split(" - ")
        classBreakInfos[0]["label"] = "{} - {}".format(xMinValue, lbl[1])
    
    maxValue = getMaxValue(classBreakInfos)
    xMaxValue = getMaxValue(xClassBreakInfos)
    if xMaxValue > maxValue:
        classBreakInfos[-1]["classMaxValue"] = xMaxValue
        lbl = classBreakInfos[-1]["label"].split(" - ")
        classBreakInfos[-1]["label"] = "{} - {}".format(lbl[0], xMaxValue)   
       
    return drawingInfo
     
        
def convertUniqueValueToClassBreaks(drawingInfo, fieldName="Predicted"):
    '''create class breaks drawingInfo for point shapetype
    from polygon uniquevalueinfo'''
    #arcpy.AddMessage("in convertUniqueValueToClassBreaks")
    drawingInfoClassBreaks = copy.deepcopy(drawingInfo) 
    rendererCB = drawingInfoClassBreaks.get("renderer")
    uniqueValueInfos = rendererCB.get("uniqueValueInfos")
    rendererCB["type"] = "classBreaks"
    rendererCB["field"]= fieldName
    # for saftey cloning default symbols as well    
    #rendererCB["backgroundFillSymbol"] = copy.deepcopy(defaultFillSymbol)
    #rendererCB["defaultSymbol"] = copy.deepcopy(defaultMarkerSymbol)
    #rendererCB["defaultLabel"] = ""
    if uniqueValueInfos:
        for i,uniqueValues in enumerate(uniqueValueInfos):
            # find min max from label          
            label = uniqueValues.get("label")
            minmax = label.split(" - ")
            minVal = float(minmax[0])
            maxVal = float(minmax[1]) 
            # round min max value to 8 decimals: workaround for SQL Server
            if "." in str(minVal):
                minVal = round(minVal,8)
            if "." in str(maxVal):
                maxVal = round(maxVal,8)            
            uniqueValues["classMinValue"] = minVal
            uniqueValues["classMaxValue"] = maxVal         
            uniqueValues.pop('value')
            # update symbol to point but retain color
            symbol = uniqueValues.get("symbol")
            defSymbol = copy.deepcopy(defaultMarkerSymbol)
            defSymbol['color'] = symbol.get('color')
            defSymbol['outline']['width'] = 1
            uniqueValues['symbol'] = defSymbol
            if i==0:
                rendererCB["minValue"] = uniqueValues["classMinValue"]
                
        rendererCB["classBreakInfos"] = uniqueValueInfos
        rendererCB.pop("uniqueValueInfos")
        drawingInfoClassBreaks["transparency"] = 0
    else:
        arcpy.AddMessage("Unable to find uniqueValueInfos to create renderer for predicted points")
        raise Exception
    return drawingInfoClassBreaks
        
        
def removeDefaults(drawingInfo):
    '''removes default values and symbols'''
    renderer = drawingInfo.get("renderer")
    if 'defaultLabel' in renderer:
        renderer.pop("defaultLabel")
    if 'defaultSymbol' in renderer:
        renderer.pop("defaultSymbol")
# coding: utf-8
"""
Source Name:   SSSymbology.py
Version:       ArcGIS  PRO 3.1
Author:        Environmental Systems Research Institute Inc.
Description:   Utility module to handle CIM Symbology
"""

import arcpy as ARCPY
import SSUtilities as UTILS
import numpy as NUM
import os as OS
import json
from arcpy.cim.cimloader import GetJSONTypeOBJ
from arcpy.cim.cimloader import  CimJsonEncoder
import locale as LOCALE
LOCALE.setlocale(LOCALE.LC_ALL, '')

class CF():
    def __init__(self, name, alias, data, type):
        self.name =  name
        self.alias= alias
        self.data = data
        self.type = type

def checkNull(v, toStr = False, null= "<Null>"):
    if type(v) == NUM.int32:
        if v == NUM.iinfo(NUM.int32).min:
            return null
    if type(v) in [NUM.str_, str]:
        if v == '':
            return null
    if type(v) in [float, NUM.float64]:
        if NUM.isnan(v):
            return null
    return v if not toStr else str(v)

def getLayer(symbBase, outPath, candidateField, values, labelOrder = None, isShp = False):
    nullID = "<Null>"
    providedClasses= None

    if type(values) == list :
        clss = NUM.unique(candidateField.data)
        foundNullShp = False
        ### Found Null ####
        if isShp:
            try:
                vl = clss.tolist()
                if vl.count(''):
                    foundNullShp = True
            except:
                pass

        clssCol = clss
        if labelOrder is not None:
            addNull = []
            for v in clss:
                if "<Null>" ==  str(checkNull(v)):
                    addNull.append(v)
                    break

            clsN = []
            labelOrder = [str(v) for v in labelOrder]
            #labelOrder.reverse()
            clsL = [ str(v) for v in clss]
            for e in labelOrder:
                if e in clsL:
                    index = clsL.index(e)
                    clsN.append(clss[index])
            clssCol = clsN.copy()
            clss = clsN
            if len(addNull):
                clss.append(addNull[0])
        #UTILS.dbg(clss, clssCol)
        cols = []
        if len(values) == 3:
            cols = symbBase.linearGradient(values[1], values[2],len(clssCol))["hex"]
        if len(values) == 4:
            if len(clssCol) == 2:
                cols = [values[1], values[2]]
            elif len(clssCol) == 3:
                cols = [values[1], values[2], values[3]]
            else:
                mid = int(len(clssCol)/2)
                col1 = symbBase.linearGradient(values[1], values[2],mid)["hex"]
                col2 = symbBase.linearGradient(values[2], values[3],len(clssCol) - mid+1)["hex"]
                cols = col1 + col2[1:]
        labs = {}
        if values[0]:
            for v in clss:
                labs[v]=ARCPY.GetIDMessage(220632) + fr" {v}"
        else:
            for v in clss:
                if str(checkNull(v, True)) == nullID:
                    labs[v] = ARCPY.GetIDMessage(220633)
                else:
                    labs[v] = str(v)

        providedClasses = {}
        colId = 0

        for v in clss:
            v1 = str(checkNull(v))
            if v1 != nullID:
                c = cols[colId]
                colId += 1
            else:
                c= "#A0A0A0"
            if foundNullShp and v1 == nullID:
                v1 = " "
            providedClasses[v1]=[labs[v],c]

    if type(values) == dict:
        providedClasses = values

    if type(values) == int:
        minValues = candidateField.data.min()
        maxValues = candidateField.data.max()

    if providedClasses is not None:

        symbBase.SetField(candidateField.name, candidateField.alias)
        symbBase.AddClasses(providedClasses)
        #symbBase.UpdateChartInfo(candidateField.name, chartName, xAxis, count= "Count")

    else:
        symbBase.SetField(candidateField.name, candidateField.alias)
        symbBase.SetLimitsUnClass(minValues, maxValues)

    width = 0.1
    if symbBase.geometry == "POLYLINE":
        width = 1.5
    size = 6
    if symbBase.geometry == "POINT":
        width = 0.3
        colorObjStroke = ARCPY.cim.CreateCIMObjectFromClassName('CIMRGBColor', 'V3')
        colorObjStroke.values = symbBase.HexToRGB("#000000")+[100]
        symbBase.SetGlobalProperties({"size":size, 
                                      "StrokeColor": colorObjStroke,
                                      "scaleSymbolsProportionally":False})

    symbBase.SetGlobalProperties({"width":width})
    symbBase.getFile(outPath)
    return outPath

def editUnClass(symbBase, outPath, candidateField,):
    symbBase.SetField(candidateField.name, candidateField.alias)
    #symbBase.UpdateChartInfo(candidateField.name, chartName, xAxis, count= "Count")
    symbBase.getFile(outPath)
    return outPath

def editUnClassHeading(symbBase, outPath, heading):
    symbBase.renderer.heading = heading
    symbBase.getFile(outPath)
    return outPath

class SymbologyBase():

    def __init__(self, typeSymb, geometry= None, refFile = None, cimInfo = None):
        self.typeSymb = typeSymb
        self.cls = None
        self.cimLayer = None
        
        if cimInfo is not None:
            self.layerDef = cimInfo
            self.renderer = self.layerDef.renderer
            return
        
        polygonReference = OS.path.join(UTILS.pathLayers,"index_unique_polygon.lyrx")
        lineReference = OS.path.join(UTILS.pathLayers,"index_unique_line.lyrx")
        pointReference = OS.path.join(UTILS.pathLayers,"index_unique_point.lyrx")


        self.geometry = geometry
        self.cls = None
        self.pathTemplate = polygonReference

        if geometry in ["POLYGON","POLYLINE","POINT"]:
            if geometry == "POLYGON":
                self.pathTemplate = polygonReference
            if geometry == "POLYLINE":
                self.pathTemplate = lineReference
            if geometry == "POINT":
                self.pathTemplate = pointReference

        ### UnClass path ####
        if refFile is not None:
            self.pathTemplate = refFile

        f = open(self.pathTemplate, 'r')
        content = f.read()
        f.close()

        self.cimLayer = GetJSONTypeOBJ(json.loads(content))
        self.layerDef = self.cimLayer.layerDefinitions[0]
        self.renderer = self.layerDef.renderer

        if typeSymb == "UNIQUE":
            self.renderer.useDefaultSymbol = False
            self.cls = self.layerDef.renderer.groups[0].classes[0]

    def reOrderClasses(self, orderList):
        classes = {}
        for cls in self.layerDef.renderer.groups[0].classes:
            classes[cls.label] = cls
        newList = []
        for v in orderList:
            if str(v) in classes and str(v) != "<Null>":
                newList.append(classes[str(v)])
        if "<Null>" in classes:
            cls = classes["<Null>"]
            cls.label = "Out Range"
            newList.append(cls)
        #UTILS.dbg(classes, "classes")
        #UTILS.dbg(orderList, "orderList")
        self.renderer.groups[0].classes = newList
        
    def getLayerDefinition(self):
        return self.layerDef

    def getFile(self, outPath):
        self.layerDef.renderer = self.renderer
        self.cimLayer.layerDefinitions[0] = self.layerDef
        jsonData = json.dumps(self.cimLayer, cls=CimJsonEncoder, sort_keys=False)
        f = open(outPath, 'w')
        f.write(jsonData)
        f.close()

    def getJSON(self):
        self.layerDef.renderer = self.renderer
        #self.cimLayer.layerDefinitions[0] = self.layerDef
        jsonData = json.dumps(self.layerDef, cls=CimJsonEncoder, sort_keys=False)
        return jsonData

    def UpdateChartInfo(self, field, title, xAxis, count= "Count"):
        chart = self.layerDef.charts[0]
        chart.series[0].fields = [field]
        chart.generalProperties.title = title
        chart.axes[0].title = xAxis
        chart.axes[1].title = count

    def SetField(self, field, heading = None):
        if self.typeSymb == "UNIQUE":
            self.renderer.fields = [field]
            if heading is not None:
                self.renderer.groups[0].heading = heading
        if self.typeSymb == "UNCLASS":
            self.renderer.field = field
            if heading is not None:
                self.renderer.heading = heading
        if self.typeSymb == "GRADUATED":
            self.renderer.field = field
            if heading is not None:
                self.renderer.heading = heading

    def SetLimitsUnClass(self, minimumBreak, maxBreak, strForm = "%0.1f"):

        if minimumBreak == NUM.finfo('d').max:
            minimumBreakLabel = "1e+308"
        else:
            minimumBreakLabel = LOCALE.format_string(strForm, minimumBreak)
        if maxBreak == NUM.finfo('d').max:
            maxBreakLabel = "1e+308"
        else:
            maxBreakLabel = LOCALE.format_string(strForm, maxBreak)
        minimumBreak = float(minimumBreak)
        maxBreak = float(maxBreak)

        self.renderer.minimumLabel = maxBreakLabel
        self.renderer.breaks[0].label = minimumBreakLabel
        self.renderer.breaks[0].upperBound = maxBreak
        self.renderer.minimumBreak = minimumBreak
        self.renderer.visualVariables[0].minValue = minimumBreak
        self.renderer.visualVariables[0].maxValue = maxBreak
        self.renderer.numberFormat.roundingValue = 2

    def changeLabelsBreaks(self, dictValues):
        for id in NUM.arange(len(self.renderer.breaks)):
            value = self.renderer.breaks[id].label
            if value in dictValues:
                self.renderer.breaks[id].label = dictValues[value]

    def AddClasses(self, dictValues=None):
        listClasses = []
        for v in dictValues:
            value = v
            color = dictValues[v][1]
            label = dictValues[v][0]
            jsonCls = json.dumps(self.cls, cls=CimJsonEncoder)
            nCls = GetJSONTypeOBJ(json.loads(jsonCls))
            colorObj = ARCPY.cim.CreateCIMObjectFromClassName('CIMRGBColor', 'V3')
            colorObj.values = self.HexToRGB(color)+[100]
            self.changeSymbol(nCls.symbol.symbol, "color", colorObj)
            nCls.values[0].fieldValues=[value]
            nCls.label = label
            listClasses.append(nCls)
        self.renderer.groups[0].classes = listClasses

    def SetGlobalProperties(self, dictProp):
        if self.typeSymb == "UNIQUE":
            classes = self.renderer.groups[0].classes
            for prop in dictProp:
                for id in NUM.arange(len(classes)):
                    cls = classes[id]
                    self.changeSymbol(cls.symbol.symbol, prop, dictProp[prop])
        if self.typeSymb == "UNCLASS":
            for prop in dictProp:
                self.changeSymbol(self.renderer.defaultSymbol.symbol, prop, dictProp[prop])

    def HexToRGB(self,hex):
        return [int(hex[i:i+2], 16) for i in range(1,6,2)]

    def RGBToHex(self,RGB):
        RGB = [int(x) for x in RGB]
        return "#"+"".join(["0{0:x}".format(v) if v < 16 else "{0:x}".format(v) for v in RGB])

    def colorDict(self,gradient,extr= 100):
      return  {"hex":[self.RGBToHex(RGB) for RGB in gradient], 
               "rgb":[RGB+[extr] for RGB in gradient]}

    def linearGradient(self,start_hex, finish_hex="#FFFFFF", n=10):
        s = self.HexToRGB(start_hex)
        f = self.HexToRGB(finish_hex)
        RGBList = [s]
        for t in range(1, n):
            currVector = [
              int(s[j] + (float(t)/(n-1))*(f[j]-s[j]))
              for j in range(3)
            ]
            RGBList.append(currVector)
        return self.colorDict(RGBList)

    def changeSymbol(self, sym, propertyName=None, value=None):

        index = 0
        if propertyName == "color":
            index = 1
        
        if type(sym) == ARCPY.cim.CIMSymbols.CIMPolygonSymbol:
            if hasattr(sym.symbolLayers[index],propertyName):
                setattr(sym.symbolLayers[index], propertyName, value)
        if type(sym) == ARCPY.cim.CIMSymbols.CIMLineSymbol:
            if hasattr(sym.symbolLayers[0],propertyName):
                setattr(sym.symbolLayers[0], propertyName, value)
        if type(sym) == ARCPY.cim.CIMSymbols.CIMPointSymbol:
            if propertyName in ["scaleSymbolsProportionally","size","respectFrame"] :
                if hasattr(sym.symbolLayers[0],propertyName):
                    setattr(sym.symbolLayers[0], propertyName, value)
            else:
                if hasattr(sym.symbolLayers[0].markerGraphics[0].symbol.symbolLayers[index], propertyName):
                    setattr(sym.symbolLayers[0].markerGraphics[0].symbol.symbolLayers[index], propertyName, value)







# -*- #################
"""
Tool name: Import Business Analyst Report Template
Source: ImportBusinessAnalystReportTemplate.py
Author: ESRI

"""

import arcpy
import os
import re
import shutil
import os.path
import json
import time
import tempfile
import arcpy._ba

from arcgis.gis import GIS
from arcpy.cim.cimloader.cimtojson import CimJsonEncoder
import xml.etree.ElementTree as ET
from lxml import etree

xslt_map = {
    "online_var" : "local_var", #
}

def online_to_local(ctx, onlineVar):
    return xslt_map.get(onlineVar[0], "dummy: " + onlineVar[0])

# %s is loading...
def add_is_loading_msg(arg):
    arcpy.SetProgressorLabel("Loading {0}...".format(arg))

def add_message(msg):
    print(msg)

def strip_field_name(fieldName):
    return fieldName.upper().removesuffix("_I").removesuffix("_P").removesuffix("_A").removesuffix("_B")

def get_default_base_type(datasetId):
  dataset = next((ds for ds in arcpy._ba.getLocalDatasets() if ds["id"] == datasetId), None)
  if dataset is None:
    arcpy.AddIDMessage("error", 3050, datasetId)
    raise ValueError

  installDir = dataset["installDirectory"]
  defHierarchyPath = ""

  if datasetId.lower() == "usa_esri_2021":
    defHierarchyPath = os.path.join(installDir, "Data\\Demographic Data\\US_defaultHierarchy_esri.xml")

  if not os.path.exists(defHierarchyPath):
    datasetDescriptionPath = os.path.join(installDir, "dataset_description.xml")
    if os.path.exists(datasetDescriptionPath):
      try:
        datasetDescription = etree.parse(datasetDescriptionPath)
        defHierarchyText = datasetDescription.find("./default_hierarchy").text
        defHierarchyPath = os.path.join(installDir, defHierarchyText)
      except:
        arcpy.AddIDMessage("error", 2651, datasetDescriptionPath)
        raise ValueError

  if not os.path.exists(defHierarchyPath):
    arcpy.AddIDMessage("error", 414, defHierarchyPath)
    raise ValueError

  try:
    defHierarchy = etree.parse(defHierarchyPath)
    baseType = defHierarchy.find("./BaseTypes/BaseType/[@name]")
    return baseType.attrib["name"]
  except:
    arcpy.AddIDMessage("error", 2651, defHierarchyPath)
    raise ValueError

  return "GEOM"


def save_sdcx(dcMetadataXmlPath, sdcxDbPath, datasetId, fileName):
    XSum2CSum = {
        "SUM"    : arcpy.cim.StatisticalDataCollectionSummaryType.Sum,
        "AVG"    : arcpy.cim.StatisticalDataCollectionSummaryType.Avg,
        "MIN"    : arcpy.cim.StatisticalDataCollectionSummaryType.Min,
        "MAX"    : arcpy.cim.StatisticalDataCollectionSummaryType.Max,
        "SCRIPT" : arcpy.cim.StatisticalDataCollectionSummaryType.Script,
    }

    XFmt2CFmt = {
        "COUNT"    : arcpy.cim.StatisticalReportFieldFormat.Count,
        "PERCENT"  : arcpy.cim.StatisticalReportFieldFormat.Percent,
        "CURRENCY" : arcpy.cim.StatisticalReportFieldFormat.Currency,
    }
    try:
        xmetadata = ET.parse(dcMetadataXmlPath)
    except:
        arcpy.AddIDMessage("error", 80489)
        raise ValueError
    xfs = xmetadata.find("./Calculators/FeatureService")

    fsName = xfs.attrib["Name"]
    fsUrl = xfs.attrib["url"]

    if sdcxDbPath == "":
        sdcxDbPath = os.path.join(os.path.dirname(dcMetadataXmlPath), "data.gdb")

    outPath = os.path.join(os.path.dirname(sdcxDbPath), fileName)

    if not arcpy.Exists(sdcxDbPath):
        dbPathNoExt = os.path.splitext(sdcxDbPath)[0]
        gdbName = os.path.basename(dbPathNoExt)
        arcpy.management.CreateFileGDB(os.path.dirname(sdcxDbPath), gdbName)

    localFcName = arcpy.ValidateTableName(fsName, sdcxDbPath)
    localFcPath = (sdcxDbPath + "/" + localFcName)
    if not arcpy.Exists(localFcPath):
        add_is_loading_msg(localFcName)
        arcpy.conversion.FeatureClassToFeatureClass(fsUrl, sdcxDbPath, localFcName)

    fcFields = [f.name.upper() for f in arcpy.ListFields(localFcPath)]

    fields = []

    xfields = xfs.find("Fields")
    for xfield in xfields:
        field = arcpy.cim.CreateCIMObjectFromClassName("CIMStatisticalDataCollectionField", "V2")

        fieldName = xfield.attrib["Name"]
        _fieldName = strip_field_name(fieldName)
        if (_fieldName not in fcFields):
            arcpy.AddIDMessage("error", 1000, fsName, fieldName)
            raise ValueError

        field.name = fieldName
        field.alias = xfield.attrib.get("Alias")
        field.category = xfield.attrib.get("fieldCategory")
        field.summaryType = XSum2CSum.get(xfield.attrib.get("summaryType"), arcpy.cim.StatisticalDataCollectionSummaryType.Sum)
        field.weightFieldName = xfield.attrib.get("weightField")
        if (field.weightFieldName is None) or len(field.weightFieldName) == 0:
            field.weightFieldName = "NONE"
        field.fieldFormat = XFmt2CFmt.get(xfield.attrib.get("Units"), arcpy.cim.StatisticalReportFieldFormat.Count)
        baseType = xfield.attrib.get("baseType", "").lower()
        field.apportionmentMethod = get_default_base_type(datasetId) if baseType == "pop" else "NONE" if baseType == "none" else "GEOM"
        field.usedFields = ""
        field.precision = ""

        fields.append(field)

    dataConnection = arcpy.cim.CreateCIMObjectFromClassName("CIMStandardDataConnection", "V2")
    dataConnection.workspaceConnectionString = "DATABASE=" + os.path.relpath(sdcxDbPath, os.path.dirname(outPath))
    dataConnection.workspaceFactory = "FileGDB"
    dataConnection.dataset = fsName
    dataConnection.datasetType = "esriDTFeatureClass"
    dataConnection.customParameters = ""

    calc = arcpy.cim.CreateCIMObjectFromClassName("CIMStatisticalDataCollectionFeatureLayerCalculator", "V2")
    calc.name = fsName
    calc.datasetID = datasetId
    calc.dataConnection = dataConnection
    calc.fields = fields
    calc.apportionmentDatasetConnection = ""

    calc2 = arcpy.cim.CreateCIMObjectFromClassName("CIMStatisticalDataCollectionStandardDataCalculator", "V2")
    calc2.name = fsName + ".sdcx"
    calc2.variables = ""

    calc3 = arcpy.cim.CreateCIMObjectFromClassName("CIMStatisticalDataCollectionScriptCalculator", "V2")
    calc3.name = fsName + ".sdcx"
    calc3.scripts = ""

    timeInstant = arcpy.cim.CreateCIMObjectFromClassName("TimeInstant", "V2")
    timeInstant.start = int(time.time())

    sdcx = arcpy.cim.CreateCIMObjectFromClassName("CIMStatisticalDataCollection", "V2")
    sdcx.creationDate = sdcx.lastRevisionDate = timeInstant
    sdcx.calculators = [calc, calc2, calc3]
    sdcx.icon = "pack://application:,,,/ArcGIS.Desktop.Resources;component/images/Folder32.png"
    sdcx.keywords = [""]
    sdcx.countries = ""
    sdcx.categories = ""

    sdcxDoc = arcpy.cim.CreateCIMObjectFromClassName("CIMStatisticalDataCollectionDocument", "V2")
    sdcxDoc.statisticalDataCollection = sdcx
    sdcxDoc.version = arcpy.GetInstallInfo()['Version']
    sdcxDoc.build = arcpy.GetInstallInfo()['BuildNumber']

    outJSON = json.dumps(sdcxDoc, cls=CimJsonEncoder, indent=2)
    try:
        with open(outPath, "w") as outSdcxFile:
            outSdcxFile.write(outJSON)
    except:
        arcpy.AddIDMessage("error", 80491)
        raise

    return outPath

def transform_template_metadata(rtMetadataPath):
    xslt = etree.XSLT(etree.XML('''
    <xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:ba="http://bao.arcgis.com/esriBAO">
        <xsl:output indent="yes" method="xml" omit-xml-declaration="yes"/>

        <xsl:template match="node() | @*">
            <xsl:copy>
                <xsl:apply-templates select="node() | @*"/>
            </xsl:copy>
        </xsl:template>

        <xsl:template match="/DataCollection/Calculators/DataCollections/Fields/PortalField">
            <Field>
                <xsl:copy-of select="@*[local-name()!='MapTo']"/>
                <xsl:attribute name="MapTo">
                    <xsl:value-of select="ba:online_to_local(@MapTo[1])" />
                </xsl:attribute>
            </Field>
        </xsl:template>

    </xsl:stylesheet>
    '''))

    ns = etree.FunctionNamespace("http://bao.arcgis.com/esriBAO")
    ns.prefix = "ba"
    ns["online_to_local"] = online_to_local

    origPath = rtMetadataPath + ".orig"
    shutil.move(rtMetadataPath, origPath)
    
    try:
        dom = etree.parse(origPath)
    except:
        arcpy.AddIDMessage("error", 80489)
        raise ValueError
    newdom = xslt(dom)
    try:
        with open(rtMetadataPath, "w") as out:
            out.write(etree.tostring(newdom, pretty_print=True, encoding='unicode', method='xml'))
    except:
        arcpy.AddIDMessage("error", 80491)
        raise
    return

def check_metadata_fields(rtMetadata, datasetId):
  calcNames = set()
  calcUsedFieldNames = set()
  reportScripts = rtMetadata.findall("./Calculators/DataCollections/CalculatedFields/Script")
  for reportScript in reportScripts:
    usedFields = reportScript.get("usedFields", "")
    if len(usedFields) > 0:
      calcUsedFieldNames.update([fieldName for fieldName in usedFields.split(',')])
    calcNames.add(reportScript.attrib["Name"])

  calcUsedFieldNames.difference_update(calcNames)

  reportStdFields = rtMetadata.findall("./Calculators/DataCollections/Fields/Field[@MapTo]")

  reportFieldNames = set(f.attrib["Name"] for f in reportStdFields)
  calcUsedFieldNames.difference_update(reportFieldNames)

  calcUsedFieldNames = set(strip_field_name(f) for f in calcUsedFieldNames)

  stdFields = set(f.attrib["MapTo"].upper() for f in reportStdFields)
  stdFields.update(calcUsedFieldNames)

  datasetStdFields = set(strip_field_name(v.FullName) for v in arcpy._ba.ListVariables(datasetId))
  stdFields.difference_update(datasetStdFields)

  stdFields = set([strip_field_name(fieldName) for fieldName in stdFields])
  stdFields.difference_update(datasetStdFields)

  if len(stdFields) > 0:
    for name in stdFields:
        arcpy.AddIDMessage("error", 1000, datasetId, name)
    raise ValueError

  pass

# need for mocking in tests
def get_item(gis, itemId):
    return gis.content.get(itemId)

def check_metadata_locators(rtMetadata, datasetId):
  locatorLayerIds = set(locator.attrib["Points"].removeprefix("std:") for locator in rtMetadata.findall("./Calculators/Locator[@Points]"))

  if len(locatorLayerIds) == 0:
    return

  dataset = next((ds for ds in arcpy._ba.getLocalDatasets() if ds["id"] == datasetId), None)
  if dataset is None:
    arcpy.AddIDMessage("error", 3050, datasetId)
    raise ValueError

  installDir = dataset["installDirectory"]

  datasetXmlPath = os.path.join(installDir, datasetId + ".xml")
  
  if datasetId.lower() == "usa_esri_2021":
    datasetXmlPath = os.path.join(installDir, "Datasets\\USA_ESRI_2021.xml")

  if not os.path.exists(datasetXmlPath):
    datasetDescriptionPath = os.path.join(installDir, "dataset_description.xml")
    if os.path.exists(datasetDescriptionPath):
      try:
          datasetDescription = etree.parse(datasetDescriptionPath)
          dstext = datasetDescription.find("./dataset_xml/dataset").text
          _datasetXmlPath = os.path.join(installDir, dstext)
          if os.path.exists(_datasetXmlPath):
            datasetXmlPath = _datasetXmlPath
      except:
          arcpy.AddIDMessage("error", 2651, datasetDescriptionPath)
          raise ValueError

  if not os.path.exists(datasetXmlPath):
    arcpy.AddIDMessage("error", 414, datasetId + ".xml")
    raise ValueError

  try:
    datasetXml = etree.parse(datasetXmlPath)
  except:
    arcpy.AddIDMessage("error", 2651, datasetXmlPath)
    raise ValueError

  layerIds = set(layer.attrib["id"] for layer in datasetXml.findall("./LAYERS/LAYER[@id]"))

  locatorLayerIds.difference_update(layerIds)
  if len(locatorLayerIds) > 0:
    for id in locatorLayerIds:
      arcpy.AddIDMessage("error", 3050, id)
    raise ValueError

  pass

def download_report_template(rtItemId, outDir, datasetId, configStr):
    try:
        gis = GIS("pro")
    except:
        arcpy.AddIDMessage("error", 120380)
        raise

    rawConfig = {}
    try:
        rawConfig = json.loads(configStr) if any(configStr) else {}
    except ValueError as e:
        arcpy.AddIDMessage("Error", 80493)
        raise

    downloadConfig = {}
    if "downloadConfig" in rawConfig:
        for entry in rawConfig["downloadConfig"]:
            if (entry.get("id") == None):
                arcpy.AddIDMessage("Error", 80492)
                raise
            downloadConfig[entry["id"]] = entry

    metadataOnly = ("metadataOnly" in rawConfig) and (rawConfig["metadataOnly"]) and (len(downloadConfig) == 0)

    add_is_loading_msg(rtItemId)
    rtItem = get_item(gis, rtItemId)
    if not rtItem:
        arcpy.AddIDMessage("error", 80480, rtItemId)
        raise ValueError

    resourcesZip = rtItem.title + ".zip"
    resourcesZipPath = os.path.join(outDir, resourcesZip)
    if not os.path.exists(resourcesZipPath):
        add_is_loading_msg(resourcesZip)
        try:
            resourcesZipPath = rtItem.resources.export(outDir, resourcesZip)
        except Exception as ex:
            arcpy.AddError(f"{ex}")
            arcpy.AddIDMessage("error", 80481)
            raise ValueError

    global rtRootDir
    rtRootDir = os.path.join(outDir, rtItem.title)
    shutil.unpack_archive(resourcesZipPath, rtRootDir)
    os.remove(resourcesZipPath)

    rtMetadataPath = os.path.join(rtRootDir, "metadata.xml")
    if not os.path.exists(rtMetadataPath):
        arcpy.AddIDMessage("error", 80482)
        raise ValueError
    
    try:
        rtMetadata = etree.parse(rtMetadataPath)
    except:
        arcpy.AddIDMessage("error", 80489)
        raise ValueError

    check_metadata_fields(rtMetadata, datasetId)
    check_metadata_locators(rtMetadata, datasetId)
    portalFields = rtMetadata.findall("./Calculators/DataCollections/Fields/PortalField")
    if len(portalFields) == 0:
        # ok, the template does not reference online SDCX
        pass

    onlineSdcxes = {}
    for portalField in portalFields:
        mapTo = portalField.attrib["MapTo"]
        match = re.search("([\da-fA-F]{32})\.(.*)", mapTo)
        if match:
            (sdcxItemId, sdcxVarName) = match.group(1, 2)
            if sdcxItemId not in onlineSdcxes:
                sdcxItem = get_item(gis, sdcxItemId)
                if not sdcxItem:
                    arcpy.AddIDMessage("error", 80483, sdcxItemId)
                    raise ValueError

                sdcxMetadataPath = os.path.join(rtRootDir, sdcxItemId + ".xml")
                if not os.path.exists(sdcxMetadataPath):
                    add_is_loading_msg(sdcxItemId)
                    try:
                        sdcxItem.resources.get("metadata.xml", out_folder = rtRootDir, out_file_name = sdcxItemId + ".xml")
                    except Exception as ex:
                        arcpy.AddError(f"{ex}")
                        arcpy.AddIDMessage("error", 80484, sdcxItemId)
                        raise

                localSdcxMetadataPath = sdcxMetadataPath

                if not metadataOnly:
                    entry = downloadConfig.get(sdcxItemId, {
                        "download" : True,
                        "path" : "",
                    })
                    
                    downloadValue = entry.get("download")
                    sdcxPath = entry.get("path")
                    if (downloadValue == None or sdcxPath == None):
                        arcpy.AddIDMessage("Error", 80492)
                        raise

                    if downloadValue:
                        sdcxFileName = entry["name"] if "name" in entry else sdcxItemId
                        try:
                            localSdcxMetadataPath = save_sdcx(sdcxMetadataPath, sdcxPath, datasetId, sdcxFileName)
                        except Exception as ex:
                            if sdcxPath:
                                try:
                                    arcpy.Delete_management(sdcxPath)
                                except:
                                    pass
                            if len(ex.args) > 0:
                                arcpy.AddError(f"{ex}")
                            arcpy.AddIDMessage("error", 80485, sdcxItemId)
                            raise
                    else:
                        localSdcxMetadataPath = sdcxPath
                onlineSdcx = {
                    "id": sdcxItemId,
                    "name" : sdcxItem.name,
                    "title" : sdcxItem.title,
                    "metadataPath": localSdcxMetadataPath,
                    "variables": []
                }

                onlineSdcxes[sdcxItemId] = onlineSdcx

            baseDir = os.path.dirname(rtMetadataPath)
            sdcxPath = onlineSdcxes[sdcxItemId]["metadataPath"]
            xslt_map[mapTo] = (os.path.relpath(sdcxPath, baseDir) if sdcxPath.startswith(baseDir + os.sep) else sdcxPath) + "/" + sdcxVarName

            onlineSdcxes[sdcxItemId]["variables"].append(sdcxVarName)

    for sdcxItemId in onlineSdcxes:
        onlineSdcx = onlineSdcxes[sdcxItemId]
        metadataPath = onlineSdcx["metadataPath"]
        reportFields = onlineSdcx["variables"]

        fields = []

        try:# json
            with open(metadataPath) as sdcxFile:
                sdcxContent = json.load(sdcxFile)
                for calcs in sdcxContent['statisticalDataCollection']['calculators']:
                    if (calcs["type"] != "CIMStatisticalDataCollectionFeatureLayerCalculator"):
                        continue
                    xfields = calcs["fields"]
                    for xfield in xfields:
                        fields.append(xfield["name"])
        except:
            try: # xml
                xmetadata = ET.parse(metadataPath)
                fields = [f.attrib["Name"] for f in xmetadata.find("./Calculators/FeatureService/Fields")]
            except:
                pass

        if len(fields) == 0:
            arcpy.AddIDMessage("error", 80495)
            raise ValueError

        missedFields = list([f for f in reportFields if f not in fields])

        if len(missedFields) > 0:
            arcpy.AddIDMessage("error", 80494)
            raise ValueError

    if not metadataOnly:
        try:
            transform_template_metadata(rtMetadataPath)
        except Exception as ex:
            arcpy.AddError(f"{ex}")
            arcpy.AddIDMessage("error", 80486)
            raise

    if metadataOnly:
        result = {
            "templateMetadataPath" : rtMetadataPath,
            "templateFolderName": rtItem.title,
            "onlineDataCollections" : list(onlineSdcxes.values())
        }

        resultPath = os.path.join(outDir, "ImportReportTemplate-" + rtItemId + ".json")
        try:
            with open(resultPath, "w") as outPipe:
                outPipe.write(json.dumps(result))
        except:
            arcpy.AddIDMessage("error", 80491)
            raise
    return

if __name__ == "__main__":
    rtItemId = arcpy.GetParameterAsText(0)

    outDir = arcpy.GetParameterAsText(1)
    outDir = outDir if any(outDir) else tempfile.gettempdir()

    datasetId = arcpy.GetParameterAsText(2)
    configStr = arcpy.GetParameterAsText(3)

    try:
        download_report_template(rtItemId, outDir, datasetId, configStr)
        arcpy.SetParameterAsText(4, outDir)
        print(outDir)
    except Exception as ex:
        shutil.rmtree(rtRootDir, ignore_errors=True)
        if len(ex.args) > 0:
          arcpy.AddError(f"{ex}")
        arcpy.AddIDMessage("error", 80487)


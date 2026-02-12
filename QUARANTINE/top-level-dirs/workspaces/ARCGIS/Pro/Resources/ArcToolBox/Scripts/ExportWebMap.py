"""-------------------------------------------------------------------------
    Tool:               Export Web Map (Server Tools)
    Source Name:        ExportWebMap.py
    Version Added:      ArcGIS Pro 2.1
    Author:             Esri, Inc.
    Description:        Export Web Map.
                        This script takes the state of a web map in a web application (for example, included services, layer visibility settings, and client-side graphics) 
                        and returns a printable page layout or basic map of the specified area of interest in vector (such as pdf, svg etc.) or image (e.g. png, jpeg etc.)
    Last Updated Ver:   ArcGIS Pro 3.2
------------------------------------------------------------------------"""

# Import required modules
#
import sys
import os
import arcpy
import uuid
import json
from arcgis.gis import GIS

# constants
#
SERVER_PROD_NAME = 'Server'
PRO_PROD_NAME = 'ArcGISPro'
PAGX_FILE_EXT = "pagx"
RPTX_FILE_EXT = "rptx"
RPTT_FILE_EXT = "rptt"
MAP_ONLY = 'map_only'

# default location and current product name
#
_defTmpltFolder = os.path.join(arcpy.GetInstallInfo()['InstallDir'], r"Resources\ArcToolBox\Templates\ExportWebMapTemplates")
_prodName = arcpy.GetInstallInfo()['ProductName']
_isMapOnly = False
_isReportOnly = False

# export only map without any layout elements
#
def exportMap(result, outfile, outFormat):
    mapView = result.ArcGISProject.listMaps()[0].defaultView

    w = result.outputSizeWidth
    h = result.outputSizeHeight
    dpi = int(result.DPI) #a workaround for now for a bug

    try:
        if outFormat == "png8" or outFormat == "png32":
            if (outFormat == "png8"):
                colorMode = "8-BIT_ADAPTIVE_PALETTE"
            else:
                colorMode = "32-BIT_WITH_ALPHA"
            mapView.exportToPNG(outfile, w, h, dpi, None, colorMode)
        elif outFormat == "pdf":
            mapView.exportToPDF(outfile, w, h, dpi)
        elif outFormat == "jpg":
            mapView.exportToJPEG(outfile, w, h, dpi, None, '24-BIT_TRUE_COLOR', 100)
        elif outFormat == "gif":
            mapView.exportToGIF(outfile, w, h, dpi)
        elif outFormat == "eps":
            mapView.exportToEPS(outfile, w, h, dpi)
        elif outFormat == "svg":
            mapView.exportToSVG(outfile, w, h, dpi, False)
        elif outFormat == "svgz":
            mapView.exportToSVG(outfile, w, h, dpi, True)
        elif outFormat == "aix":
            mapView.exportToAIX(outfile, w, h, dpi)
        elif outFormat == "tiff":
            mapView.exportToTIFF(outfile, w, h, dpi, False, "32-BIT_WITH_ALPHA", "DEFLATE", True) #return geoTIFF_tags
    except Exception as err:
        arcpy.AddError("error raised..." + str(err))
        raise

# export layout
#
def exportLayout(result, outfile, outFormat):
    layout = result.ArcGISProject.listLayouts()[0]

    dpi = result.DPI

    try:
        if outFormat == "png8" or outFormat == "png32":
            if (outFormat == "png8"):
                colorMode = "8-BIT_ADAPTIVE_PALETTE"
            else:
                colorMode = "32-BIT_WITH_ALPHA"
            layout.exportToPNG(outfile, dpi, colorMode)
        elif outFormat == "pdf":
            layout.exportToPDF(outfile, dpi)
        elif outFormat == "jpg":
            layout.exportToJPEG(outfile, dpi)
        elif outFormat == "gif":
            layout.exportToGIF(outfile, dpi)
        elif outFormat == "eps":
            layout.exportToEPS(outfile, dpi)
        elif outFormat == "svg":
            layout.exportToSVG(outfile, dpi, False)
        elif outFormat == "svgz":
            layout.exportToSVG(outfile, dpi, True)
        elif outFormat == "aix":
            layout.exportToAIX(outfile, dpi)
        elif outFormat == "tiff":
            layout.exportToTIFF(outfile, dpi, "32-BIT_WITH_ALPHA", "DEFLATE")
    except Exception as err:
        arcpy.AddError("error raised..." + str(err))
        raise


# export report
#
def exportReport(result, outfile, reportOnly):
    report = result.ArcGISProject.listReports()[0]
    
    if reportOnly:
        report.exportToPDF(outfile) # not getting appeneded to existing pdf with layout
    else:
        outReportFileName = generateUniqueFileName('pdf') # creating a temp file
        report.exportToPDF(outReportFileName)
        pdf = arcpy.mp.PDFDocumentOpen(outfile) # opening the existing pdf that got created from a previous call to exportLayout()
        pdf.appendPages(outReportFileName)      # appending report section after layout section in the pdf filed
        pdf.saveAndClose()
        os.remove(outReportFileName)


# generating a unique name for each output file
#
def generateUniqueFileName(outFormat):
    guid = str(uuid.uuid1())
    fileName = ""
    fileExt = outFormat

    #changing the file extension for few instances
    if outFormat == "png8" or outFormat == "png32":
        fileExt = "png"
    elif outFormat == "tiff":
        fileExt = "tif"

    fileName = '{}.{}'.format(guid, fileExt)
    fullFileName = os.path.join(arcpy.env.scratchFolder, fileName)
    return fullFileName


# Main module
#
def main():
    # Get the value of the input parameter
    #
    WebMap_as_JSON = arcpy.GetParameterAsText(0)
    outfilename = arcpy.GetParameterAsText(1)
    format = arcpy.GetParameterAsText(2).lower()
    layoutTemplatesFolder = arcpy.GetParameterAsText(3).strip()
    layoutTemplate = arcpy.GetParameterAsText(4).lower()
    layoutItemID = arcpy.GetParameterAsText(5).strip()
    reportTemplate = arcpy.GetParameterAsText(6).lower()
    reportItemID = arcpy.GetParameterAsText(7).strip()
    
    ## dealing with layout template
    _isMapOnly = False
    # portal item takes precedence
    if layoutItemID:
        layoutTemplate = layoutItemID
    elif (layoutTemplate.lower() == MAP_ONLY):
        _isMapOnly = True
        layoutTemplate = None

    ## dealing with report template
    # portal item takes precedence
    if reportItemID:
        reportTemplate = reportItemID
        
    # reports are only supported for PDF output format
    if reportTemplate and format != 'pdf':
        arcpy.AddIDMessage("ERROR", 3840)
    
    # not generate map when layoutTemplate == 'MAP_ONLY' and reportTemplate is not None
    _isReportOnly = reportTemplate and _isMapOnly
    
    # Special logic while being executed in ArcGIS Pro 
    # - so that a Geoprocessing result can be acquired without needing any json to begin to feed in
    # - this is to make the publishing experience easier
    if (WebMap_as_JSON.replace(' ', '') == '#'):
        WebMap_as_JSON = '#'
        if (_prodName == PRO_PROD_NAME):
            return
        elif (_prodName == SERVER_PROD_NAME):
            arcpy.AddIDMessage('ERROR', 590, 'WebMap_as_JSON')
        else:
            arcpy.AddIDMessage('ERROR', 120004, _prodName)

    # generate a new output filename when the output_filename parameter is empty or the script is running on server
    if outfilename.isspace() or _prodName == SERVER_PROD_NAME:
        outfilename = generateUniqueFileName(format)


    # use the default location when Layout_Templates_Folder parameter is not set
    tmpltFolder = _defTmpltFolder if not layoutTemplatesFolder else layoutTemplatesFolder

    # constructing the full path for the layout file (.pagx)
    if not layoutItemID and not _isMapOnly:
        # resetting layoutTemplate to full path
        layoutTemplate = os.path.join(tmpltFolder, '{}.{}'.format(layoutTemplate, PAGX_FILE_EXT))

    # constructing the full path for the report file (.rptx or .rptt)
    if reportTemplate and not reportItemID:  #when a portal item ID is provided for a report template, no need to construct the full path
        # resetting reportTemplate to full path
        reportTemplate = os.path.join(tmpltFolder, '{}.{}'.format(reportTemplate, RPTX_FILE_EXT))
        if not os.path.exists(reportTemplate): #if .rptx not found, look for .rptt
            reportTemplate = '{}.{}'.format(os.path.splitext(reportTemplate)[0], RPTT_FILE_EXT)
        
    
    
    #Convert the webmap to a map document and optionally report document
    try:
        result = arcpy.mp.ConvertWebMapToArcGISProject(WebMap_as_JSON, layoutTemplate, None, None, reportTemplate)
        
        # Export report
        if (_isReportOnly):
            exportReport(result, outfilename, True)
        else:        
            #Export... map only or layout optionally with report
            if (_isMapOnly):
                if (result.outputSizeWidth == 0) or (result.outputSizeHeight == 0):
                    arcpy.AddIDMessage('ERROR', 1305)
                exportMap(result, outfilename, format)
            else: # ... layout
                exportLayout(result, outfilename, format)
                # ... report -- appeneded after the layout. Only valid for PDF
                if reportTemplate:
                    exportReport(result, outfilename, False)

    except Exception as err:
        arcpy.AddError(str(err))


    
    # Set output parameter
    #
    arcpy.SetParameterAsText(1, outfilename)


if __name__ == "__main__":
    main()
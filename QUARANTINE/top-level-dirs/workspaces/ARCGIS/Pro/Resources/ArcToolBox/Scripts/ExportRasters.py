"""********************************************************************************************************************
TOOL NAME: RasterToOtherFormat
SOURCE NAME: ExportRasters.py
AUTHOR: Environmental Systems Research Institute Inc.
REQUIRED ARGUMENTS: Input rasters
                    Output geodatabase
OPTIONAL ARGUMENTS: Raster format

TOOL DESCRIPTION: Converts or copies one or more Rasters to a workspace, the input Rasters can be file Rasters, or Geodatabase Rasters, the output parameter will be a workspace.
The optional raster format controls the outpur raster datset format, by default, the format is GRID

The name of the output Raster will be based on the name of the input name, but will be unique for
the destination workspace.

Date Created: 11/20/2003
Update: 5/26/2005
Updated: 4/27/2007 add progressor
Updated: 9/18/2007
                 - use arcgisscripting.create(9.3)
                 - add progress bar to indicate percent of work done
                 - centralize error messages with error number
                 
Usage: RasterToOtherFormat <Input_rasters;Input_rasters...> <Output_workspace> {GRID | IMAGINE Image | TIFF | }

*********************************************************************************************************************"""
from __future__ import print_function, unicode_literals, absolute_import
import time

import ConversionUtils

msgWorkspace = ConversionUtils.gp.GetIDMessage(86127)  # "Output location does not exist: "
msgSuccess = ConversionUtils.gp.GetIDMessage(86128)  # "Successfully converted: "
msgFail = ConversionUtils.gp.GetIDMessage(86129)  # "Failed to convert: "
msgConverting = ConversionUtils.gp.GetIDMessage(86130)  # "Converting "

def execute():
    # Argument 1 is the list of Rasters to be converted
    inRasters = ConversionUtils.gp.GetParameterAsText(0)

    # The list is split by semicolons ";"
    inRasters = ConversionUtils.SplitMultiInputs(inRasters)

    # The output workspace where the shapefiles are created
    outWorkspace = ConversionUtils.gp.GetParameterAsText(1)

    # Set the destination workspace parameter (which is the same value as the output workspace)
    # the purpose of this parameter is to allow connectivity in Model Builder.
    # ConversionUtils.gp.SetParameterAsText(2,outWorkspace)
    f = ConversionUtils.gp.GetParameterAsText(2)

    # Get proper extension based on the format string
    if f == "IMAGINE Image":
        ext = ".img"
    elif f == "TIFF":
        ext = ".tif"
    elif f == "BMP":
        ext = ".bmp"
    elif f == "PNG":
        ext = ".png"
    elif f == "JPEG":
        ext = ".jpg"
    elif f == "JP2000":
        ext = ".jp2"
        f = "JPEG2000"
    elif f == "GIF":
        ext = ".gif"
    elif f == "GRID":
        ext = ""
        f = "Esri Grid"
    elif f == "BIL":
        ext = ".bil"
        f = "Esri BIL"
    elif f == "BIP":
        ext = ".bip"
        f = "Esri BIP"
    elif f == "BSQ":
        ext = ".bsq"
        f = "Esri BSQ"
    elif f == "ENVI DAT":
        ext = ".dat"
        f = "ENVI"
    elif f == "MRF":
        ext = ".mrf"
        f = "MRF"
    elif f == "CRF":
        ext = ".crf"

    # Add progressor
    rastercnt = len(inRasters)
    ConversionUtils.gp.SetProgressor("step", msgConverting, 0, rastercnt, 1)
    currentloc = 1

    # Loop through the list of input Rasters and convert/copy each to the output geodatabase or folder
    for raster in inRasters:
        try:
            ConversionUtils.gp.SetProgressorLabel(msgConverting + "%s (%d/%d)" % (raster, currentloc, rastercnt))
            raster = ConversionUtils.ValidateInputRaster(raster)

            outRaster = ConversionUtils.GenerateRasterName(raster, outWorkspace, ext)

            # Copy/Convert the inRaster to the outRaster
            ConversionUtils.CopyRasters(raster, outRaster, "", f)

            # If the Copy/Convert was successfull add a message stating this
            ConversionUtils.gp.AddMessage(msgSuccess + "%s To %s" % (raster, outRaster))

            currentloc += 1

        except Exception as ErrorDesc:
            # Except block for the loop. If the tool fails to convert one of the Rasters, it will come into this block
            #  and add warnings to the messages, then proceed to attempt to convert the next input Raster.
            msgWarning = msgFail + "%s" % input
            msgStr = ConversionUtils.gp.GetMessages(2)
            ConversionUtils.gp.AddWarning(ConversionUtils.ExceptionMessages(msgWarning, msgStr, ErrorDesc))

        ConversionUtils.gp.SetProgressorPosition()

    time.sleep(0.5)


if __name__ == '__main__':
    execute()

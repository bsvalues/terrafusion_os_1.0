"""********************************************************************************************************************
TableConversion.py
Version: ArcGIS 2.9
 
Description: Converts or copies one or more tables to a GeoDatabase or folder.
The input tables can be dBase, INFO tables, or Geodatabase tables. Depending on which tool is
calling this script, the output parameter will be a SDE or a personal Geodatabase which means
the output will be geodatabase feature classes, the output parameter will be a folder, which means
the output will be DBase.

The name of the output table will be based on the name of the input name, but will be unique for
the destination workspace or folder.

Author: ESRI, Redlands
                 
Usage: TableToGeodatabase <in_table;in_table...> <out_workspace>
Usage: TableToDBase <in_table;in_table...> <out_folder>
*********************************************************************************************************************"""
from __future__ import print_function, unicode_literals, absolute_import
import ConversionUtils
import time
import os
import arcpy


def execute():
    # Define message constants so they may be translated easily
    msgFail = ConversionUtils.gp.GetIDMessage(86153)  # "Failed to convert "
    msgConverting = ConversionUtils.gp.GetIDMessage(86130)  # "Converting "

    # Argument 1 is the list of tables to be converted
    inTables = ConversionUtils.gp.GetParameterAsText(0)

    # The list is split by semicolons ";"
    inTables = ConversionUtils.SplitMultiInputs(inTables)

    # The output workspace where the shapefiles are created
    outWorkspace = ConversionUtils.gp.GetParameterAsText(1)

    # Set the destination workspace parameter (which is the same value as the output workspace)
    # the purpose of this parameter is to allow connectivity in Model Builder.
    ConversionUtils.gp.SetParameterAsText(2, outWorkspace)
    # message "Converting multiple tables ..."
    ConversionUtils.gp.SetProgressor("step", ConversionUtils.gp.GetIDMessage(86175), 0, len(inTables))

    # Check if any of the input tables have duplicate names
    output_list = []
    for inTable in inTables:
        output_list.append(ConversionUtils.GenerateOutputName(inTable, outWorkspace, uniqueName=False))
        set_list = set(output_list)
        if len(output_list) == len(set_list):
            duplicate_names = False
        else:
            duplicate_names = True

    # Loop through the list of input tables and convert/copy each to the output geodatabase or folder
    for inTable in inTables:

        try:
            # Generate a valid output output name. If duplicate names are found in input tables,
            # output will be appended by _1, _n,
            if duplicate_names:
                outTable = ConversionUtils.GenerateOutputName(inTable, outWorkspace, uniqueName=True)
            else:
                if arcpy.env.overwriteOutput:
                    outTable = ConversionUtils.GenerateOutputName(inTable, outWorkspace, uniqueName=False)
                else:
                    outTable = ConversionUtils.GenerateOutputName(inTable, outWorkspace, uniqueName=True)

            # Set the progressor label
            ConversionUtils.gp.SetProgressorLabel(msgConverting + inTable)

            # Copy/Convert the inTable to the outTable
            if arcpy.env.transferDomains or arcpy.env.transferGDBAttributeProperties:
                arcpy.ExportTable_conversion(
                    inTable, os.path.join(outWorkspace, os.path.basename(outTable)))

            else:
                ConversionUtils.CopyRows(inTable, outTable)
            
            # Message "Converted %s to %s successfully."
            ConversionUtils.gp.AddIDMessage("Informative", 86176, inTable, outTable)

        except Exception as ErrorDesc:
            # Except block for the loop. If the tool fails to convert one of the tables, it will come into this block
            #  and add warnings to the messages, then proceed to attempt to convert the next input table.
            msgWarning = msgFail + "%s" % inTable
            msgStr = ConversionUtils.gp.GetMessages(2)
            ConversionUtils.gp.AddWarning(ConversionUtils.ExceptionMessages(msgWarning, msgStr, ErrorDesc))

        ConversionUtils.gp.SetProgressorPosition()

    time.sleep(0.5)


if __name__ == '__main__':
    execute()

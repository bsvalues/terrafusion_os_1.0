"""-----------------------------------------------------------------------------
Name:              Generate orthomapping adjustment report.py
Purpose:           Generate orthomapping adjustment report
Author:            Esri Inc.
Created:           8/1/2017
Copyright:   (c)   Esri, Inc. 2017
ArcGIS Version:    10.6
-----------------------------------------------------------------------------"""
# core libraries
import os
from datetime import datetime
import shutil

# internal libraries
import arcpy
import rasterutils

TASK_NAME = 'GenerateOrthoReport'


class LicenseError(Exception):
    pass


if __name__ == '__main__':

    inic = arcpy.GetParameterAsText(0)
    rformat = arcpy.GetParameterAsText(1)

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # 1. Get the input image collection
        inic = rasterutils.getInDataPath(inic)

        # Get image collection catalog path
        icpath = rasterutils.getImageServiceDatasource(inic)
        if icpath.startswith("/enterpriseDatabases"):
            icpath = rasterutils._lookupdatastorepath(icpath)
            # arcpy.AddMessage("Temporary EGDB mosaic dataset path: {}".format(icpath))

        if icpath:
            # 2. Get temporary orthomapping report file location
            scratchFolder = arcpy.env.scratchFolder
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            reportname = "orthoreport_" + timestamp
            if rformat.upper() == "PDF":
                reportpath = os.path.join(scratchFolder, reportname) + ".pdf"
            elif rformat.upper() == "HTML":
                reportpath = os.path.join(scratchFolder, reportname) + ".html"
            else:
                reportpath = os.path.join(scratchFolder, reportname) + ".pdf"

            # 3. Get tie point path and solution point path
            # Locate geodatabase
            dbpath = os.path.dirname(icpath)

            # Get adjustment index
            adjind = rasterutils._getAdjustIndex(icpath)

            if adjind:
                solutionpnt = icpath + "_z"
                solutiontbl = icpath + "_s"
                tiepnt = icpath + "_p"

                arcpy.GenerateBlockAdjustmentReport_management(
                    input_mosaic_dataset=icpath, input_solution_table=solutiontbl,
                    input_solution_point=solutionpnt, output_report=reportpath,
                    input_control_point_for_adjustment=tiepnt, report_format=rformat
                )

                if os.path.exists(reportpath):
                    # reporthtml = os.path.join(scratchFolder, reportname.replace(".rpt", ".html"))
                    # shutil.copy2(os.path.join(reportpath, "index.html"), reporthtml)
                    arcpy.SetParameter(2, reportpath)
                else:
                    arcpy.AddError("Cannot generate orthomapping adjustment report.")

            else:
                arcpy.AddError("Image collection was not adjusted, cannot generate report.")
        else:
            arcpy.AddError("Cannot get the image collection path.")

    except arcpy.ExecuteError as err:
        arcpy.AddError(arcpy.GetMessages(2))

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, "Unexpected Error occured during service Execution. " + str(err))

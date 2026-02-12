"""--------------------------------------------------------------------------
 Tool Name:  CompressFileGeodatabaseData
 Source Name: CompressFileGeodatabaseData.py
 Version: ArcGIS 9.2
 Author: ESRI

 This tool performs the default method of compressing a feature class.
 This approach involves running the following tools, with all parameters
 set to default, on the input dataset:
 (1) BlockByProximity
 (2) CompressFileGeodatabaseDataAdvanced
-------------------------------------------------------------------------"""

# Import system modules
from __future__ import print_function, unicode_literals, absolute_import
import arcgisscripting

# Error message text vars...
msgNotFileGDB = "Only FileGDB data can be compressed..."
msgCompressingFileGDBFeatureClass = "Compressing the FeatureClass: "
msgCompressingWorksace = "Compressing the Workspace: "
msgCompressingFeatureDataset = "Compressing the FeatureDataset: "
msgNotSupported = "Datatype not Supported"

# Create the Geoprocessor object and set the environment...
gp = arcgisscripting.create()
gp.OverWriteOutput = 1

# Local variables...
# if the scratch workspace environment is not set, then set it to the "TEMP" system environment
if not gp.ScratchWorkspace:
    gp.ScratchWorkspace = gp.GetSystemEnvironment("TEMP")

temp_blk = gp.ScratchWorkspace + "/temp"
n = 0


def CompressFileGDB_FC(FeatureClass):
    try:
        if gp.Describe(FeatureClass).DatasetType == "FeatureClass":
            global n
            gp.AddMessage(msgCompressingFileGDBFeatureClass + "%s" % FeatureClass)
            # Process: Block By Proximity...
            while gp.exists(temp_blk + str(n) + ".blk"):
                n += 1
            gp.BlockByProximity_management(FeatureClass, temp_blk + str(n) + ".blk", "", "")
            # Process: Compress Dataset...
            gp.CompressFileGeodatabaseDataAdvanced_management(FeatureClass, temp_blk + str(n) + ".blk", "")
            n += 1

    except Exception as ErrDesc:
        # Add error messages to Geoprocessing window
        gp.AddError(str(ErrDesc))


# --------------------------------------------------------------------------

# --------------------------------------------------------------------------
def execute():
    # MAIN


    # Script arguments...
    MyWorkspace = gp.GetParameterAsText(0)
    FeatureData = gp.GetParameterAsText(1)

    try:
        if (len(MyWorkspace) > 0) and (len(FeatureData) == 0):

            if MyWorkspace.find('.gdb') <= 0:
                raise Exception(msgNotFileGDB)

            # Compress the stand alone FeatureClasses
            gp.AddMessage(msgCompressingWorksace)
            gp.Workspace = MyWorkspace
            fcs = gp.ListFeatureClasses()
            fc = fcs.Next()
            while fc:
                CompressFileGDB_FC(fc)
                fc = fcs.Next()
            # Compress the FeatureDatasets
            fds = gp.ListDatasets()
            fd = fds.Next()
            while fd:
                gp.Workspace = MyWorkspace + "/" + fd
                fcs = gp.ListFeatureClasses()
                gp.Workspace = " "
                myFC = fcs.Next()
                while myFC:
                    CompressFileGDB_FC(myFC)
                    myFC = fcs.Next()
                fd = fds.Next()
        else:
            if FeatureData.find('.gdb') <= 0:
                raise Exception(msgNotFileGDB)
            desc = gp.describe(FeatureData)
            if desc.DatasetType == "FeatureClass":
                CompressFileGDB_FC(FeatureData)
            elif desc.DatasetType == "FeatureDataset":
                gp.AddMessage(msgCompressingFeatureDataset)
                gp.Workspace = FeatureData
                fcs = gp.ListFeatureClasses()
                fc = fcs.Next()
                while fc:
                    print(FeatureData + "/" + fc)
                    CompressFileGDB_FC(FeatureData + "/" + fc)
                    fc = fcs.Next()
            else:
                gp.AddMessage(msgNotSupported)
    except Exception as ErrDesc:
        # Add error messages to Geoprocessing window
        gp.AddError(str(ErrDesc))

    gp = None
    # --------------------------------------------------------------------------


if __name__ == '__main__':

    execute()

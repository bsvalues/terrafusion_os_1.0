import arcpy
import os
import sys
import zipfile
import re
import shutil


class LicenseError(Exception):
    pass


def setUpCoordSystemEnvironment(coordinateSystem, customCoordSystemFolder):
    # get the correct spatial reference and set it into the environment
    # so that the data will get projected when clip runs
    # if it is a number, assume we have a WKID and set it directly in
    # else, find the file in the Coordinate System directory
    if coordinateSystem.lower() == "same as input" or coordinateSystem == "":
        return "same as input"

    if coordinateSystem.strip().isalnum() and customCoordSystemFolder == "":
        try:
            arcpy.env.outputCoordinateSystem = coordinateSystem.strip()
        except:
            # Message "Coordinate System WKID %s is not valid.
            # Output Coordinate System will be the same as the input layer's Coordinate System"
            arcpy.AddWarning(get_ID_message(86131) % coordinateSystem)
            coordinateSystem = "same as input"
            arcpy.env.outputCoordinateSystem = None

        return coordinateSystem

    found = False
    # Search custom folder if specified
    if customCoordSystemFolder != "":
        found, coordinateSystemPath = getPRJFile(coordinateSystem, customCoordSystemFolder)

    # Search to see if we can find the spatial reference
    coordinateSystemPath = None
    if not found:
        srList = arcpy.ListSpatialReferences("*/%s" % coordinateSystem)
        if srList:
            coordinateSystemPath = os.path.join(
                os.path.join(arcpy.GetInstallInfo()["InstallDir"], "Coordinate Systems"),
                srList[0]) + ".prj"
            found = True

    if found:
        arcpy.env.outputCoordinateSystem = arcpy.SpatialReference(coordinateSystemPath).factoryCode
        return coordinateSystemPath
    else:
        # Message "Couldn't find the specified projection file %s.
        # Output Coordinate System will be the same as the input layer's Coordinate System."
        arcpy.AddWarning(get_ID_message(86132) % coordinateSystem)
        return "same as input"


def getPRJFile(inputCoordSysString, prjDir):
    inputCoordSysString += ".prj"
    # walk through the dirs to find the prj file
    if os.path.exists(prjDir):
        for root, dirs, files in os.walk(prjDir):
            if inputCoordSysString in files:
                return True, os.path.join(root, inputCoordSysString)
    else:
        return False, ""

    # if we got to here then it didn't find the prj file
    return False, ""


def zipUpFolder(folder, outZipFile):
    # zip the data
    try:
        zip = zipfile.ZipFile(outZipFile, 'w', zipfile.ZIP_DEFLATED)
        zipws(str(folder), zip, "CONTENTS_ONLY")
        zip.close()
    except RuntimeError:
        # Delete zip file if exists
        if os.path.exists(outZipFile):
            os.unlink(outZipFile)
        zip = zipfile.ZipFile(outZipFile, 'w', zipfile.ZIP_STORED)
        zipws(str(folder), zip, "CONTENTS_ONLY")
        zip.close()
        # Message"  Unable to compress zip file contents."
        arcpy.AddWarning(get_ID_message(86133))


def zipws(path, zip, keep):
    path = os.path.normpath(path)
    # os.walk visits every subdirectory, returning a 3-tuple
    #  of directory name, subdirectories in it, and filenames
    #  in it.
    for dirpath, dirnames, filenames in os.walk(path):
        # Iterate over every filename
        for file in filenames:
            # Ignore .lock files
            if not file.endswith('.lock'):

                try:
                    if keep:
                        zip.write(os.path.join(dirpath, file),
                                  os.path.join(os.path.basename(path),
                                               os.path.join(dirpath, file)[len(path) + len(os.sep):]))
                    else:
                        zip.write(os.path.join(dirpath, file),
                                  os.path.join(dirpath[len(path):], file))

                except Exception as e:
                    # Message "    Error adding %s: %s"
                    arcpy.AddWarning(get_ID_message(86134) % (file, e.args[0]))
    return None


def createFolderInScratch(folderName):
    """Create the folders necessary for the job"""

    folderPath = arcpy.CreateUniqueName(folderName, arcpy.env.scratchWorkspace)
    arcpy.CreateFolder_management(arcpy.env.scratchWorkspace, os.path.basename(folderPath))
    return folderPath


def getTempLocationPath(folderPath, format):
    """Make sure there is a location to write to for gdb and mdb"""

    if format == "mdb":
        MDBPath = os.path.join(folderPath, "data.mdb")
        if not arcpy.Exists(MDBPath):
            arcpy.CreatePersonalGDB_management(folderPath, "data")
        return MDBPath
    elif format == "gdb":
        GDBPath = os.path.join(folderPath, "data.gdb")
        if not arcpy.Exists(GDBPath):
            arcpy.CreateFileGDB_management(folderPath, "data")
        return GDBPath
    else:
        return folderPath


def makeOutputPath(raster, inLayerName, convert, formatList, zipFolderPath, scratchFolderPath):
    tmpName = inLayerName
    outFormat = formatList[1].lower()

    # if we are going to convert to an esri format on the clip, put the output in the zipfolder
    # else put it in the scratch folder in a gdb
    if convert:
        outwkspc = getTempLocationPath(zipFolderPath, outFormat)
    else:
        outwkspc = getTempLocationPath(scratchFolderPath, "gdb")

    if tmpName.find("\\"):
        tmpName = tmpName.split("\\")[-1]

    # make sure there are no spaces in the out raster name and make sure its less than 13 chars
    if outFormat == "grid":
        if len(tmpName) > 12:
            tmpName = tmpName[:12]
        if tmpName.find(" ") > -1:
            tmpName = tmpName.replace(" ", "_")

    # make the output path
    tmpName = arcpy.CreateUniqueName(
        arcpy.ValidateTableName(tmpName, outwkspc), outwkspc)

    if os.path.basename(tmpName) != inLayerName:
        arcpy.AddMessage(u"{0} {1}{2}".format(inLayerName,
                                              arcpy.GetIDMessage(86128),
                                              os.path.basename(tmpName)))

    # Raster formats and shp always need to put the extension at the end
    if raster or outFormat == "shp":
        if outFormat != "gdb" and outFormat != "mdb" and outFormat != "grid":
            tmpName += formatList[2].lower()

    outputpath = os.path.join(outwkspc, tmpName)

    return tmpName, outputpath


def clipRaster(lyr, aoi, rasterFormat, zipFolderPath, scratchFolderPath):
    # get the path and a validated name for the output
    layerName, outputpath = makeOutputPath(True, lyr, True, rasterFormat, zipFolderPath, scratchFolderPath)
    # do the clip
    try:
        if int(arcpy.GetCount_management(aoi)[0]):
            arcpy.Clip_management(lyr, '#', outputpath, aoi, arcpy.env.nodata,
                                  'ClippingGeometry')
        else:
            arcpy.CopyRaster_management(lyr, outputpath)
        # Message "  clipped %s..."
        arcpy.AddIDMessage("INFORMATIVE", 86135, lyr)
    except arcpy.ExecuteError:
        errmsg = arcpy.GetMessages(2)
        # Message "  failed to clip layer %s..."
        arcpy.AddWarning(get_ID_message(86136) % lyr)
        if re.findall('ERROR 000446', errmsg, re.I):
            # Message"  Output file format with specified pixel type or number of bands or colormap is not supported.
            # Refer to the 'Technical specifications for raster dataset formats' help section in Desktop Help.
            # http://webhelp.esri.com/arcgisdesktop/9.3/index.cfm?TopicName=Technical_specifications_for_raster_dataset_formats"
            # Shorted as "Output file format with specified pixel type or number of bands or colormap is not supported"
            arcpy.AddWarning(get_ID_message(86137))

        elif re.findall('ERROR 000445', errmsg, re.I):
            # Message "  Extension is invalid for the output raster format.
            # Please verify that the format you have specified is valid."
            arcpy.AddWarning(get_ID_message(86138))
        else:
            arcpy.AddWarning(arcpy.GetMessages(2))


def clipFeatures(lyr, aoi, featureFormat, zipFolderPath, scratchFolderPath, convertFeaturesDuringClip):
    global haveDataInterop
    try:
        # get the path and a validated name for the output
        layerName, outputpath = makeOutputPath(False, lyr, convertFeaturesDuringClip, featureFormat, zipFolderPath,
                                               scratchFolderPath)

        # do the clip
        arcpy.Clip_analysis(lyr, aoi, outputpath)
        # Message "  clipped %s..."
        arcpy.AddIDMessage("INFORMATIVE", 86135, lyr)

        # if format needs data interop, convert with data interop
        if not convertFeaturesDuringClip:
            # get path to zip
            outputinzip = os.path.join(
                zipFolderPath,
                os.path.basename(layerName) + featureFormat[2])

            if featureFormat[2].lower() in [".dxf", ".dwg", ".dgn"]:
                # Message "..using export to cad.."
                arcpy.AddWarning(get_ID_message(86139))
                arcpy.ExportCAD_conversion(outputpath, featureFormat[1], outputinzip)
            else:
                if not haveDataInterop:
                    raise LicenseError

                if featureFormat[1].upper() == 'CSV':
                    outputinzip += \
                        ',"RUNTIME_MACROS,""APPEND,No,FIELD_NAMES,yes,SEPARATOR,"""","""",EXTENSION,csv""' \
                        ',META_MACROS,""DestAPPEND,No,DestFIELD_NAMES,yes,DestSEPARATOR,"""","""",DestEXTENSION,csv""' \
                        ',METAFILE,CSV,COORDSYS,,__FME_DATASET_IS_SOURCE__,false"'

                diFormatString = "%s,%s" % (featureFormat[1], outputinzip)
                # run quick export
                try:
                    arcpy.QuickExport_interop(outputpath, diFormatString)
                except AttributeError:
                    e = sys.exc_info()[1]
                    raise e


    except LicenseError:
        # Message "  failed to export to %s.  The requested formats require the Data Interoperability extension.
        # This extension is currently unavailable."
        arcpy.AddWarning(get_ID_message(86140) % featureFormat[1])

    except arcpy.ExecuteError:
        errorstring = arcpy.GetMessages(2)
        if re.findall('failed to execute (quickexport)', errorstring, re.I):

            # Message "  failed to export layer %s with Quick Export.
            # Please verify that the format you have specified is valid."
            arcpy.AddWarning(get_ID_message(86141) % lyr)

        elif re.findall('failed to execute (clip)', errorstring, re.I):
            # Message "  failed to clip layer %s...
            arcpy.AddWarning(get_ID_message(86142) % lyr)
        else:
            arcpy.AddWarning(get_ID_message(86142) % lyr)
            arcpy.AddWarning(arcpy.GetMessages(2))


def clipAndConvert(lyrs, aoi, featureFormat, rasterFormat, coordinateSystem):
    try:
        zipFolderPath, scratchFolderPath = None, None

        # for certain output formats we don't need to use Data Interop to do the conversion
        convertFeaturesDuringClip = False
        if featureFormat[1].lower() in ["gdb", "mdb", "shp"]:
            convertFeaturesDuringClip = True

        # get a scratch folder for temp data and a zip folder to hold
        # the final data we want to zip and send
        zipFolderPath = createFolderInScratch("zipfolder")
        scratchFolderPath = createFolderInScratch("scratchfolder")

        # temporary stop gap measure to counteract issue
        lyrs = [lyr.replace("'", "") if lyr.find(" ") > -1 else lyr for lyr in lyrs]

        convertToCAD = False
        clipped_data = []

        # loop through the list of layers received
        for lyr in lyrs:
            describe = arcpy.Describe(lyr)
            dataType = describe.dataType.lower()

            # make sure we are dealing with features or raster and not some other layer type (group, tin, etc)
            if dataType in ["featurelayer", "rasterlayer"]:
                # if the coordinate system is the same as the input
                # set the environment to the coord sys of the layer being clipped
                # may not be necessary, but is a fail safe.
                if coordinateSystem.lower() == "same as input":
                    sr = describe.spatialReference
                    if sr is not None:
                        arcpy.env.outputCoordinateSystem = sr

                # raster branch
                if dataType == "rasterlayer":
                    clipRaster(lyr, aoi, rasterFormat, zipFolderPath, scratchFolderPath)

                # feature branch
                else:
                    if featureFormat[2].lower() in [".dxf", ".dwg", ".dgn"]:
                        convertToCAD = True

                        basename = os.path.basename(lyr)
                        desc = arcpy.Describe(lyr)
                        if desc.featureType == "Annotation":
                            gdbname = basename + '.gdb'
                            fgdbpath = os.path.join(scratchFolderPath, gdbname)
                            if os.path.exists(fgdbpath):
                                arcpy.Delete_management(fgdbpath)
                            arcpy.CreateFileGDB_management(scratchFolderPath, gdbname)

                            out_data = arcpy.CreateUniqueName(
                                u'{}'.format(arcpy.ValidateTableName(basename, fgdbpath)),
                                fgdbpath)
                        else:
                            out_data = arcpy.CreateUniqueName(
                                u'{}.shp'.format(arcpy.ValidateTableName(basename, scratchFolderPath)),
                                scratchFolderPath)

                        clipped_data.append(arcpy.Clip_analysis(lyr, aoi, out_data)[0])


                    else:
                        clipFeatures(lyr, aoi, featureFormat, zipFolderPath, scratchFolderPath,
                                     convertFeaturesDuringClip)
            else:
                # Message "  Cannot clip layer: %s.  This tool does not clip layers of type: %s..."
                arcpy.AddWarning(get_ID_message(86143) % (lyr, dataType))

        if convertToCAD:
            # Message "..using export to cad.."
            arcpy.AddWarning(get_ID_message(86139))
            outputinzip = os.path.join(zipFolderPath, 'cad{}'.format(featureFormat[2]))
            arcpy.ExportCAD_conversion(clipped_data, featureFormat[1], outputinzip)

        return zipFolderPath, scratchFolderPath

    except:
        if zipFolderPath:
            shutil.rmtree(zipFolderPath, ignore_errors=True)
        if scratchFolderPath:
            shutil.rmtree(scratchFolderPath, ignore_errors=True)

        e = sys.exc_info()[1]
        raise Exception(e.args[0])



def get_ID_message(ID):
    return re.sub("%1|%2", "%s", arcpy.GetIDMessage(ID))


if __name__ == '__main__':
    try:
        zipFolder, scratchFolder = None, None

        # Get the Parameters
        layers = arcpy.GetParameterAsText(0).split(";")
        areaOfInterest = arcpy.GetParameter(1)
        inputFeatureFormat = arcpy.GetParameterAsText(2)
        inputRasterFormat = arcpy.GetParameterAsText(3)
        coordinateSystem = arcpy.GetParameterAsText(4)
        customCoordSystemFolder = arcpy.GetParameterAsText(5)
        outputZipFile = arcpy.GetParameterAsText(6).replace("\\", os.sep)

        if arcpy.CheckExtension("DataInteroperability") == "Available":
            arcpy.CheckOutExtension("DataInteroperability")
            haveDataInterop = True
        else:
            haveDataInterop = False
        # Do a little internal validation.
        # Expecting "long name - short name - extension
        # If no format is specified, send features to GDB.
        if inputFeatureFormat == "":
            featureFormat = ["File Geodatabase", "GDB", ".gdb"]
        else:
            # featureFormat = inputFeatureFormat.split(" - ")
            featureFormat = list(map(lambda x: x.strip(), inputFeatureFormat.split("-")))
            if len(featureFormat) < 3:
                featureFormat.append("")

        # If no format is specified, send rasters to GRID.
        # Expecting "long name - short name - extension
        if inputRasterFormat == "":
            rasterFormat = ["ESRI GRID", "GRID", ""]
        else:
            # rasterFormat = inputRasterFormat.split(" - ")
            rasterFormat = list(map(lambda x: x.strip(), inputRasterFormat.split("-")))
            if len(rasterFormat) < 3:
                rasterFormat.append("")

        coordinateSystem = setUpCoordSystemEnvironment(coordinateSystem, customCoordSystemFolder)

        # Do this so the tool works even when the scratch isn't set or if it is set to gdb/mdb/sde
        if arcpy.env.scratchWorkspace is None or os.path.exists(str(arcpy.env.scratchWorkspace)) is False:
            arcpy.env.scratchWorkspace = arcpy.GetSystemEnvironment("TEMP")
        else:
            swd = arcpy.Describe(arcpy.env.scratchWorkspace)
            wsid = swd.workspacefactoryprogid
            gdb_wsids = ['FileGDBWorkspaceFactory', 'AccessWorkspaceFactory',
                         'SdeWorkspaceFactory']
            if any(i in wsid for i in gdb_wsids):
                arcpy.env.scratchWorkspace = arcpy.GetSystemEnvironment("TEMP")

        # clip and convert the layers and get the path to the folder we want to zip
        zipFolder, scratchFolder = clipAndConvert(layers, areaOfInterest, featureFormat, rasterFormat, coordinateSystem)

        # zip the folder
        zipUpFolder(zipFolder, outputZipFile)

    except Exception:
        e = sys.exc_info()[1]
        arcpy.AddError(e.args[0])
        sys.exit(1)
    finally:
        if zipFolder:
            shutil.rmtree(zipFolder, ignore_errors=True)
        if scratchFolder:
            shutil.rmtree(scratchFolder, ignore_errors=True)

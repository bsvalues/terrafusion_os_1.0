"""-----------------------------------------------------------------------------
Name:              QueryExifInfo.py
Purpose:           This Raster Analysis tool returns Exif properties from the
                   input imagery files.
Author:            Esri Inc.
Created:           8/2/2019
Copyright:   (c)   Esri, Inc. 2019
ArcGIS Version:    10.8
-----------------------------------------------------------------------------"""
# core libraries
import json
import os
import datetime
import tempfile
import shutil

# internal libraries
import arcpy
import rasterutils

TASK_NAME = 'QueryExifInfo'

## Preload digital camera database
hasCdb = False
tempcdb = "in_memory/camdb"


def preloadCameras():
    """
    Pre-load digital camera database to save time
    :return: temporary in memory table for query
    """
    global hasCdb
    cameracsv = "cdb_" + str(datetime.datetime.now().strftime("%Y%m%d%H%M%S")) + ".csv"
    temp_dir = tempfile.gettempdir()
    cameracsv = os.path.join(temp_dir, cameracsv)
    try:
        installdir = arcpy.GetInstallInfo()["InstallDir"]
        camerafile = os.path.join(installdir, "bin/DigitalCameras.dat")

        # Convert to a temporary csv file for the arcpy cursor support
        # arcpy.AddMessage(cameracsv)
        shutil.copy2(camerafile, cameracsv)

        # Had to do this because SQL query doesn't work on csv without OID
        arcpy.TableToTable_conversion(cameracsv, "in_memory", "camdb")
        # arcpy.AddMessage("Convert to temporary table.")
        hasCdb = True
    except Exception:
        hasCdb = False
    finally:
        # Remember to remove temp file
        if os.path.exists(cameracsv):
            os.remove(cameracsv)


def evalstr(expr):
    """
    Check if the string expression is a list, if expression is list, return as is.
    Otherwise return as string.
    :param expr: string expression
    :return: evaluated string
    """
    try:
        evalstr = eval(expr)
        if isinstance(evalstr, list):
            return evalstr
        else:
            return str(evalstr)
    except Exception as err:
        return expr


def getExif(image):
    """
    Wrapper to capture ValueError
    :param image: image file path
    :return: exif metadata dictionary
    """
    try:
        arcpy.AddMessage("Query image file: {0}".format(image))
        exif = arcpy.GetImageEXIFProperties(image)
        # arcpy.AddMessage(exif)
        return exif
    except ValueError as err:
        arcpy.AddMessage(err)
        return None
    except Exception as err:
        return None


def readExifList(imglist, exifout):
    """
    Read Exif from a list of images
    :param imglist: image list
    :param exifout: Input Exif dictionary
    :return: Output Exif dictionary
    """
    try:
        for img in imglist:
            # Note: Exif return will always be list
            exif = getExif(img)
            if exif and isinstance(exif, list):
                if len(exif) > 3:
                    exifout[img] = filterExif(exif[3])
                    exifout[img]["long"] = exif[0]
                    exifout[img]["lat"] = exif[1]
                    exifout[img]["alt"] = exif[2]
                    exifout[img]["spatialReference"] = arcpy.GetUTMFromLocation(exif[0], exif[1]).factoryCode
                    # exifout[img] = searchPixelSize(exifout[img])
                else:
                    exifout[img] = filterExif(exif[0])
        # arcpy.AddMessage("exifout {}".format(exifout))
        return exifout
    except Exception as err:
        return exifout


def filterExif(exifdict):
    """
    Filter the Exif properties based on client specs
    **format**
    {
        cols:,
        rows:,
        planes:,
        cameraInfo:{
        model:,
        make:,
        focalLength:,
        acquisitionDate:,
        pixelSize:
        }
        exif: {},
        gps: {},
        xmp: {},
        long:,
        lat:,
        alt:,
        spatialReference:,
    }
    **details**
    {
        --- general info from corresponding JPEG or TIFF header
        width,
        height,
        bandCount,

        --- from Exif Tag
        DateTimeOriginal
        FocalLength
        PixelXDimension
        PixelYDimension
        FocalPlaneResolutionUnit
        FocalPlaneXResolution

        --- from GPS Tag
        GPSLongitudeRef
        GPSLatitudeRef
        GPSAltitudeRef
        GPSLongitude
        GPSLatitude
        GPSAltitude
        GPSMapDatum

        --- from XMP Tag
        --xml attribute values
        drone-dji:AbsoluteAltitude
        drone-dji:RelativeAltitude
        -- xml element values
        Camera:BandName
        Camera:CentralWavelength
    }
    :param exifdict: Exif properties dictironary
    :return: filtered dictionary
    """
    exifout = {}
    try:
        # arcpy.AddMessage("Enter filter function.")
        # Only filter if input is dictionary
        if isinstance(exifdict, dict):
            # arcpy.AddMessage("Input is dictionary.")
            camerainfo = {}
            exiftag = {}
            gpstag = {}
            xmptag = {}
            for i in exifdict:
                if i in ("width", "height", "bandCount"):
                    if i == "bandCount":
                        exifout["planes"] = exifdict[i]
                    elif i == "width":
                        camerainfo["cols"] = exifdict[i]
                    elif i == "height":
                        camerainfo["rows"] = exifdict[i]
                if "make" in i.lower():
                    camerainfo["make"] = exifdict[i]
                if "model" in i.lower():
                    camerainfo["model"] = exifdict[i]
                if "createdate" in i.lower():
                    exifout["acquisitionDate"] = exifdict[i]

                if i in ("EXIF_DateTimeOriginal", "EXIF_FocalLength", "EXIF_PixelXDimension", "EXIF_PixelYDimension", "EXIF_FocalPlaneResolutionUnit", "EXIF_FocalPlaneXResolution"):
                    exiftag[i.replace("EXIF_", "", 1)] = exifdict[i]
                if i in ("EXIF_GPSLongitudeRef", "EXIF_GPSLatitudeRef", "EXIF_GPSAltitudeRef", "EXIF_GPSLongitude", "EXIF_GPSLatitude", "EXIF_GPSAltitude", "EXIF_GPSMapDatum"):
                    gpstag[i.replace("EXIF_", "", 1)] = exifdict[i]
                if i in ("XMP:drone-dji:AbsoluteAltitude", "XMP:drone-dji:RelativeAltitude", "XMP:Camera:BandName", "XMP:Camera:CentralWavelength"):
                    xmptag[i.replace("XMP:", "", 1)] = exifdict[i]
            exifout["cameraInfo"] = camerainfo
            exifout["exif"] = exiftag
            exifout["gps"] = gpstag
            exifout["xmp"] = xmptag
            return exifout
        else:
            return exifout
    except Exception as err:
        return exifout


def searchPixelSize(exifout):
    """
    Search digital camera database for pixel size if model and make is available.
    Note: this is the same method used in the Query Digital CameraInfo tool.
    :param exifout: the exif metadata dictionary
    :return: exif metadata dictionry with or without the pixel size
    """
    global hasCdb
    global tempcdb
    try:
        # arcpy.AddMessage("Looking up camera pixel size from database.")
        if "cameraInfo" in exifout:
            camerainfo = exifout["cameraInfo"]
            # arcpy.AddMessage(camerainfo)
            if "make" in camerainfo.keys() and "model" in camerainfo.keys() and hasCdb:
                # filter out make name in model
                exifmake = camerainfo["make"].upper()
                exifmodel = camerainfo["model"].upper()
                if exifmake in exifmodel:
                    exifmodel = exifmodel.replace(exifmake, "").strip()

                inquery = "upper(Make) = '" + exifmake + "' AND upper(Model) = '" + exifmodel + "'"
                # arcpy.AddMessage(inquery)
                # arcpy.AddMessage(tempcdb)

                with arcpy.da.SearchCursor(tempcdb, ["PixelSize", "FocalLength"], inquery) as cur:
                    for row in cur:
                        pixelsize = rasterutils.safe_cast(row[0], float)
                        focallength = rasterutils.safe_cast(row[1], float)
                        if pixelsize:
                            exifout["cameraInfo"]["pixelSize"] = pixelsize
                            exifout["cameraInfo"]["focalLength"] = focallength
                        break

        return exifout
    except Exception:
        # arcpy.AddMessage("Exception in search Pixel Size.")
        return exifout


if __name__ == '__main__':
    # Input images limited to:
    # single datastore path
    # single image path
    # list of image paths or data store paths [<single rd unc path>, <single rd unc path>]
    inimgs = arcpy.GetParameterAsText(0)  # list of images

    try:
        # Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # Preload digital camera database
        preloadCameras()
        # arcpy.AddMessage(str(hasCdb))

        exifout = {}
        # Evaluate if string is a list
        # arcpy.AddMessage(inimgs)
        items = evalstr(inimgs)
        # arcpy.AddMessage(str(items))
        if isinstance(items, list):
            # Get information for each items in the list
            for i in items:
                if isinstance(i, str):
                    # Check if it is data store first
                    dsimgs = arcpy.gp.command("ListDatastore '" + i + "' *.jpg;*.jpeg;*.tif;*.tiff")
                    # arcpy.AddMessage(dsimgs)
                    imglist = evalstr(dsimgs)
                    # arcpy.AddMessage(imglist)
                    # Not data store, treat as images
                    if not imglist or not isinstance(imglist, list):
                        if os.path.splitext(i)[1].lower() in (".jpg", ".jpeg", ".tiff", ".tif"):
                            exif = getExif(i)
                            if exif and isinstance(exif, list):
                                if len(exif) > 3:
                                    exifout[i] = filterExif(exif[3])
                                    exifout[i]["long"] = exif[0]
                                    exifout[i]["lat"] = exif[1]
                                    exifout[i]["alt"] = exif[2]
                                    exifout[i]["spatialReference"] = arcpy.GetUTMFromLocation(exif[0], exif[1]).factoryCode
                                    # exifout[i] = searchPixelSize(exifout[i])
                                else:
                                    exifout[i] = filterExif(exif[0])
                    else:
                        exifout = readExifList(imglist, exifout)

        elif isinstance(items, str):
            # Check if it is data store path first
            dsimgs = arcpy.gp.command("ListDatastore '" + items + "' *.jpg;*.jpeg;*.tif;*.tiff")
            # arcpy.AddMessage(dsimgs)
            imglist = evalstr(dsimgs)
            # arcpy.AddMessage(imglist)
            # Not data store, treat as images
            if not imglist or not isinstance(imglist, list):
                if os.path.splitext(items)[1].lower() in (".jpg", ".jpeg", ".tiff", ".tif"):
                    # arcpy.AddMessage(items)
                    exif = getExif(items)
                    if exif and isinstance(exif, list):
                        if len(exif) > 3:
                            exifout[items] = filterExif(exif[3])
                            exifout[items]["long"] = exif[0]
                            exifout[items]["lat"] = exif[1]
                            exifout[items]["alt"] = exif[2]
                            exifout[items]["spatialReference"] = arcpy.GetUTMFromLocation(exif[0], exif[1]).factoryCode
                            # exifout[items] = searchPixelSize(exifout[items])
                        else:
                            exifout[items] = filterExif(exif[0])
            else:
                exifout = readExifList(imglist, exifout)
        else:
            arcpy.AddError(
                "Invalid input images. The input can either be a data store path, a image path, a list of data store paths, "
                "or a list of image paths)")

        # arcpy.AddMessage(str(exifout))
        if exifout:
            arcpy.SetParameterAsText(1, json.dumps(exifout))
        else:
            arcpy.SetParameterAsText(1, json.dumps("no Exif Info found."))

    except rasterutils.LicenseError as err:
        rasterutils.AddExceptionError(
            TASK_NAME, rasterutils.errorMsgs.get(120302))
    except ValueError as err:
        rasterutils.AddExceptionError(
            TASK_NAME, "Unexpected input image value. " + str(err))
    except SyntaxError as err:
        rasterutils.AddExceptionError(
            TASK_NAME, "Unexpected character after line continuation character. " + str(err))
    except Exception as err:
        rasterutils.AddExceptionError(
            TASK_NAME, "Unexpected Error occured during service Execution. " + str(err))

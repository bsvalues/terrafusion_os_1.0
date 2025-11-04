'''--------------------------------------------------------------------------------------------
Tool:               GeoTagged Photos To Points
Source Name:        phototopoint.py
Author:             Esri, Inc.
Usage:              arcpy.GeoTaggedPhotosToPoints_management(Input_Folder, Output_Feature_Class, {Invalid_Photos_Table}, {Include_Non_GeoTagged_Photos}, {Add_Photos_As_Attachments})
Required Arguments: Input Folder
                    Output Feature Class
Optional Arguments: Invalid Photos Table
                    Include Non-GeoTagged Photos (ALLPHOTOS | ONLY_GEOTAGGED)
                    Add Photos As Attachments (ADD_ATTACHMENTS | NO_ATTACHMENTS)
Description:        Creates points from the X, Y, and Z coordinate information stored in geotagged photo files.
                    Optionally adds photo files to features in the Output Feature Class as geodatabase attachments.
------------------------------------------------------------------------------------------------'''
import arcpy
import ExifUtils
import os
from datetime import datetime

# Create point features from Geotagged photos
def GeoPhotoToPoint(folder, fc, badphotostable="", addnongps="", attachphotos=""):

    # Convert text from boolean parameters to Python True | False
    addnongps = True if addnongps.lower() in ["true", "all_photos", ""] else False
    attachphotos = True if attachphotos.lower() in ["true", "add_attachments", ""] else False

    # Get all photo files from Input Folder
    photolist = ExifUtils.ListPhotos(folder)

    # Create outputs
    dropZ = arcpy.env.outputZFlag == "Disabled"
    workspace = os.path.dirname(fc)
    datetimeField = arcpy.ValidateFieldName("DateTime", workspace)
    CreateOutputs(fc, badphotostable, photolist, dropZ, datetimeField)

    foundone = 0
    incur = incurbad = None
    null = -999999 if fc.lower().endswith(".shp") else None 

    # Set progress bar
    arcpy.SetProgressor("step", "", 0, len(photolist), 1)

    # Open an InsertCursor to write point locations to a new feature class
    fields = ["Path", "Name", datetimeField, "SHAPE@X", "SHAPE@Y", "SHAPE@Z",
              "Direction", "X", "Y", "Z"]
    if dropZ:
        fields.remove("SHAPE@Z")
        fields.remove("Z")

    badlist = []
    with arcpy.da.InsertCursor(fc, fields) as incur:
        # Get GPS information from each photo
        for file in photolist:
            try:
                exifProps = arcpy.GetImageEXIFProperties(file)
            except ValueError:
                # skip apple metadata files
                filepth, filename = os.path.split(file)
                if filename.startswith("._") and os.path.isfile(os.path.join(filepth, filename[2:])):
                    exifProps = ["err"]
                else:
                    raise

            timestampTag = 'EXIF_DateTimeOriginal' 
            direcTag = 'EXIF_GPSImgDirection'
            if len(exifProps) == 1: #exifProps only has one item if no GPS coordinates or XMP metadata
                x, y, z = None, None, None
                extraPropsIndex = 0
                if 'XMP:exif:GPSLatitude' in exifProps[0]: # Try to get  GPS coordinates from xmp metadata             
                    try:
                        point = arcpy.FromCoordString(" ".join([exifProps[0]['XMP:exif:GPSLatitude'].replace(",", " "), 
                                                                exifProps[0]['XMP:exif:GPSLongitude'].replace(",", " ")]), 
                                                                "DDM")
                        x = point.firstPoint.X
                        y = point.firstPoint.Y
                        z = eval(exifProps[0]['XMP:exif:GPSAltitude']) if 'XMP:exif:GPSAltitude' in exifProps[0] else None
                    except:
                        pass                    
                    direcTag = 'XMP:exif:GPSImgDirection'
                    timestampTag = 'XMP:exif:GPSTimeStamp'
            else:
                x = exifProps[0]
                y = exifProps[1]
                z = exifProps[2]
                extraPropsIndex = 3
            direc = exifProps[extraPropsIndex][direcTag] if direcTag in exifProps[extraPropsIndex] else None
            timestamp = exifProps[extraPropsIndex][timestampTag] if timestampTag in exifProps[extraPropsIndex] else None
            
            if (x and y) or addnongps:
                row = MakeRow(null, file, timestamp, x, y, z, direc)
                if dropZ:
                    row.pop(9)
                    row.pop(5)
                try:
                    incur.insertRow(row)
                except:
                    if badphotostable:
                        badlist.append(file)
                    if addnongps:
                        row[3] = None
                        row[4] = None
                        row[5] = None
                        incur.insertRow(row)
                foundone = 1
            if (not x or not y) and badphotostable:
                badlist.append(file)

            arcpy.SetProgressorPosition()

    if badphotostable and badlist:
        # Open an InsertCursor to write a list of photos with no GPS coordinates
        with arcpy.da.InsertCursor(badphotostable, ["Photo"]) as incurbad:
            for file in badlist:
                incurbad.insertRow([file])

    # If none of the photos were geotagged, give the standard empty output warning
    if not foundone:
        arcpy.AddIDMessage("WARNING", 117)

    # Attach photos if option specified
    if attachphotos:
        if foundone or addnongps:
            oidfield = arcpy.Describe(fc).OIDFieldName
            arcpy.EnableAttachments_management(fc)
            arcpy.AddAttachments_management(fc, oidfield, fc, oidfield, "Path", "")

def MakeRow(nullValue, file, timestamp, x, y, z, direc):
    values = [file, os.path.basename(file)]
    newx = None if x == 0 else x
    newy = None if y == 0 else y
    if nullValue:
        for val in [timestamp, newx, newy, z, direc, x, y, z]:
            if val:
                values.append(val)
            else:
                values.append(nullValue)
    else:
        if timestamp:
            try:
                if "T" in timestamp: # sometimes the timestamps are isoformat
                    timestamp = datetime.fromisoformat(timestamp)
                else:
                    timestamp = datetime.strptime(timestamp, '%Y:%m:%d %H:%M:%S')
            except:
                pass
        values = values + [timestamp, newx, newy, z, direc, x, y, z]

    return values

def CreateOutputs(fc, badphotostable, photoslist, dropZ, datetimeField):
    # Create the Output Feature Class
    arcpy.CreateFeatureclass_management(os.path.dirname(fc),
                                        os.path.basename(fc),
                                        "POINT", "", "",
                                        "DISABLED" if dropZ else "ENABLED",
                                        arcpy.SpatialReference(4326, 115700))

    longestpath = 5000
    longestname = 5000
    
    datetimeFieldType = "DATE" if not fc.lower().endswith(".shp") else "TEXT"
        
    # Add Path, Name, and DateTime fields
    fields = [["Path", "TEXT", "", longestpath],
              ["Name", "TEXT", "", longestname],
              [datetimeField, datetimeFieldType],
              ["Direction", "DOUBLE"],
              ["X", "DOUBLE"],
              ["Y", "DOUBLE"]]
    if not dropZ:
        fields.append(["Z", "DOUBLE"])
    arcpy.AddFields_management(fc, fields)

    # Delete unecessary ID field in shapefile
    if fc.lower().endswith(".shp"):
        arcpy.DeleteField_management(fc, "ID")

    # Create the Invalid Photos Table
    if badphotostable:
        ExifUtils.CreateBadPhotosTable(badphotostable, longestpath)

if __name__ == '__main__':
    # Get Parameters from tool
    folder = arcpy.GetParameterAsText(0)
    fc = arcpy.GetParameterAsText(1)
    badphotostable = arcpy.GetParameterAsText(2)
    addnongps = arcpy.GetParameterAsText(3)
    attachphotos = arcpy.GetParameterAsText(4)

    # Run the main script
    GeoPhotoToPoint(folder, fc, badphotostable, addnongps, attachphotos)
    layer_path = os.path.join(arcpy.GetInstallInfo()["InstallDir"], 
                                                "Resources", 
                                                "ArcToolbox", 
                                                "Templates", 
                                                "Layers",
                                                "GeoTaggedPhotos.lyrx")
    arcpy.SetParameterSymbology(1, layer_path)

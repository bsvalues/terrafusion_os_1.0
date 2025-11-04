"""
COPYRIGHT 2019 ESRI

TRADE SECRETS: ESRI PROPRIETARY AND CONFIDENTIAL
Unpublished material - all rights reserved under the
Copyright Laws of the United States.

For additional information, contact:
Environmental Systems Research Institute, Inc.
Attn: Contracts Dept
380 New York Street
Redlands, California, USA 92373

email: contracts@esri.com

---------------------------------------------------------------------------
Source Name:   UnzipCellAndImport.py
Version:       ArcGIS 2.4
Author:        Environmental Systems Research Institute Inc.
Description:   This script recursively searches a root folder for zipped 
               archives of MGCP shapefiles and metadata, unzips them and 
               ingests the data into a target geodatabase.
---------------------------------------------------------------------------
"""


"""
Tool Name:   Unzip MGCP Cell And Import
Usage notes: UnzipCellAndImport_topographic(Root_Folder, Target_Geodatabase)

Parameters:

    INDEX, NAME, DISPLAY NAME, PARAMETER TYPE, MULTIVALUE, DATA TYPE, DIRECTION, DEPENDENCIES, VALUE
    -------------------------------------------------------------------------------
    {0}, Root_Folder, Root Folder, Required, False, Folder, Input, [], None
    {1}, Target_Geodatabase, Target Geodatabase, Required, False, Workspace, Input, [], None
    {2}, Output_Geodatabase, Output Geodatabase, Derived, False, Workspace, Output, [], None

Error codes:
    - 0x90050001 : Unable to parse xml version
    - 0x90050002 : Unable to parse geodatabase version
    - 0x90050003 : Unable to determine shapefile TRD version
    - 0x90050004 : Unable to import features
    - 0x90050005 : Target geodatabase is not valid.

"""

import arcpy, os, zipfile, re, glob, DefenseUtilities


# Unzips an archive to a target location
def unzip(zip_path, target):
    if not os.path.isdir(target):
        os.makedirs(target)

    baseDir = ""
    archive = zipfile.ZipFile(zip_path, 'r')

    try:
        for name in archive.namelist():
            if not name.endswith('/'):
                root, fname = os.path.split(name)
                directory = os.path.normpath(os.path.join(target, root))
                if not os.path.isdir(directory):
                    os.makedirs(directory)
                if len(baseDir) == 0:
                    baseDir = directory
                archive.extract(name, directory)
    finally:
        if archive:
            archive.close()


# Adds external tool messages to the messages of this tool
def addMessages():
    i = 0
    count = arcpy.GetMessageCount()
    while i < count:
        message = "    " + arcpy.GetMessage(i)
        severity = arcpy.GetSeverity(i)
        if severity == 1:
            arcpy.AddWarning(message)
        elif severity == 2:
            arcpy.AddError(message)
        else:
            arcpy.AddMessage(message)
        i += 1


def cleanUp(extractFolder):
    # Clean up extracted shapefiles
    arcpy.AddIDMessage("INFORMATIVE", 84013) # "Cleaning up extracted shapefiles in %s", extractFolder
    arcpy.env.workspace = extractFolder
    shapefiles = arcpy.ListFeatureClasses()
    for s in shapefiles:
        try:
            arcpy.Delete_management(s)
        except arcpy.ExecuteError:
            arcpy.AddIDMessage("WARNING", 317, s)

    # Clean up any other files
    files = arcpy.ListFiles()
    for f in files:
        try:
            arcpy.Delete_management(f)
        except arcpy.ExecuteError:
            arcpy.AddIDMessage("WARNING", 317, f)


def validateTargetGdb(gdbPath):
    if not arcpy.Exists(gdbPath):
        arcpy.AddIDMessage("ERROR", 110, gdbPath) # '{0} does not exist.', gdbPath
        return False, ''
    desc = arcpy.Describe(gdbPath)
    if desc.dataType != 'Workspace':
        arcpy.AddIDMessage("ERROR", 434) # "{0} is not a workspace.", gdbPath
        return False, ''
    del desc
    arcpy.env.workspace = gdbPath
    mgcpMetadataFeatureDataset = gdbPath
    featureDatasetList = arcpy.ListDatasets('*MGCP_Metadata', 'Feature')
    if len(featureDatasetList) > 0:
        mgcpMetadataFeatureDataset = os.path.join(mgcpMetadataFeatureDataset, featureDatasetList[0])
    else:
        arcpy.AddIDMessage("ERROR", 110, "MGCP_Metadata") # MGCP_Metadata feature dataset not found.
        return False, ''
    subregionFC = mgcpMetadataFeatureDataset
    subregionSearch = arcpy.ListFeatureClasses(wild_card='*Subregion', feature_dataset=featureDatasetList[0])
    if len(subregionSearch) > 0:
        subregionFC = os.path.join(subregionFC, subregionSearch[0])
    else:
        arcpy.AddIDMessage("ERROR", 294, "Subregion") # Subregion feature class not found.
        return False, ''
    if len(arcpy.ListFields(subregionFC, 'SVNAME')) > 0:
        if len(arcpy.ListFields(subregionFC, 'STIERN')) > 0:
            if len(arcpy.ListFields(subregionFC, 'SSVCTY')) > 0:
                # 4.1 and 4.2 are nearly identical, look at default value of SVSPCN
                specVal = ''
                try:
                    from future.utils import iteritems
                    subtypes = arcpy.da.ListSubtypes(subregionFC)
                    for scode, dictInfo in iteritems(subtypes):
                        if scode == 0:
                            fields = dictInfo['FieldValues']
                            for field, fieldInfo in iteritems(fields):
                                if field.lower() == 'svspcn':
                                    specVal = fieldInfo[0]
                                    break
                            break
                    del subtypes
                except:
                    specVal = '4.1'
                if specVal.find('4.6') >=0:
                    return True, '4.6'
                elif specVal.find('4.5.1') >=0:
                    return True, '4.5.1'
                elif specVal.find('4.5') >= 0:
                    return True, '4.5'
                elif specVal.find('4.4') >= 0:
                    return True, '4.4'
                elif specVal.find('4.3') >= 0:
                    return True, '4.3'
                elif specVal.find('4.2') >= 0:
                    return True, '4.2'
                else:
                    return True, '4.1'
            else:
                return True, '4.0'
        else:
            return True, '3.0'
    else:
        cellFC = mgcpMetadataFeatureDataset
        cellSearch = arcpy.ListFeatureClasses(wild_card='*Cell', feature_dataset=featureDatasetList[0])
        if len(cellSearch) > 0:
            cellFC = os.path.join(cellFC, cellSearch[0])
            if len(arcpy.ListFields(cellFC, 'CVNAME')) > 0:
                return True, '2.0'
        arcpy.AddIDMessage("ERROR", 90280) # Unable to identify a valid TRD geodatabase schema
        return False, ''


def parseXmlVersion(metadataFilePath):
    # Using a simple character search for now
    stm = open(metadataFilePath, encoding='UTF-8')
    content = stm.read()
    stm.close()
    del stm
    # Find first <gmd:codeSpace> open tag
    codeSpaceOpenTag = '<gmd:codeSpace>'
    b = content.find(codeSpaceOpenTag)
    if b < 0:
        return ''
    # Find close tag
    e = content.find('</gmd:codeSpace>', b)
    if e < b:
        return ''
    charStringTag = content[b+len(codeSpaceOpenTag):e]
    b = charStringTag.find('>')
    if b < 0:
        return ''
    e = charStringTag.rfind('<')
    if e < b:
        return ''
    versionStr = charStringTag[b+1:e]

    if versionStr and len(versionStr) > 0:
        versionStr = versionStr.lower().strip()
        if versionStr == 'mgcp_v4_r6':
            return '4.6'
        elif versionStr == 'mgcp_v4_r5.1':
            return '4.5.1'
        elif versionStr == 'mgcp_v4_r5':
            return '4.5'
        elif versionStr == 'mgcp_v4_r4':
            return '4.4'
        elif versionStr == 'mgcp_v4_r3':
            return '4.3'
        elif versionStr == 'mgcp_v4_r2':
            return '4.2'
        elif versionStr == 'mgcp_v4_r1':
            return '4.1'
        elif versionStr == 'mgcp_v4_r0':
            return '4.0'
        elif versionStr == 'mgcp_v3_r0':
            return '3.0'
        elif versionStr == 'mgcp_v2_r0' or versionStr == 'mgcp_v1_r1':
            return '2.0'
    return ''


def parseVersionString(versionStr):
    i = versionStr.find('.')
    major = int(versionStr[0:i])
    try:
        minor = int(versionStr[i+1:])
    except:
        minor = float(versionStr[i+1:])
    return major, minor


def versionsAreCompatible(xmlVersion, gdbVersion):
    xmlMajor = 0
    xmlMinor = 0
    gdbMajor = 0
    gdbMinor = 0

    try:
        xmlMajor, xmlMinor = parseVersionString(xmlVersion)
    except Exception as e:
        arcpy.AddIDMessage("ERROR", 896) # "Unable to parse xml version."
        return False
    try:
        gdbMajor, gdbMinor = parseVersionString(gdbVersion)
    except Exception as e:
        arcpy.AddIDMessage("ERROR", 896) # "Unable to parse geodatabase version."
        return False

    if xmlMajor < gdbMajor or (xmlMajor == gdbMajor and xmlMinor <= gdbMinor):
            return True

    return False


def main():
    try:
        # Checking license level
        if DefenseUtilities.licenselevel() == 'Basic' or DefenseUtilities.licenselevel() == 'None':
            raise DefenseUtilities.LicenseException()
        DefenseUtilities.checkoutextensions(['defense'])

        # This is the folder that will be recursively searched
        root_folder = arcpy.GetParameterAsText(0)

        # The target MGCP geodatabase to ingest the data to
        target_gdb = arcpy.GetParameterAsText(1)

        # Derive the Cell feature class path from target geodatabase
        target_cell = os.path.join(target_gdb, "MGCP_Metadata\\Cell")

        # Get scratch folder to unzip the data to
        scratchFolder = arcpy.env.scratchFolder

        # Regex for matching xml metadata file names
        pattern = "[eEwW](0\d\d|1[0-7]\d|180)[nNsS]([0-8]\d|90).xml"
        regEx = re.compile(pattern)

        defHome = DefenseUtilities.getproductpath()
        if len(defHome) <= 0:
            arcpy.AddIDMessage("ERROR", 90306) # product files not installed
            return

        # Validate target geodatabase
        gdbIsValid, gdbVersion = validateTargetGdb(target_gdb)
                 
        if not gdbIsValid:
            arcpy.AddIDMessage("ERROR", 90110) # workspace is not valid
            return

        # Recursively walk the root folder
        for loc, dirs, files in os.walk(root_folder):
            for f in files:
                if f.lower().endswith(".zip"):
                    # Unzip the archive
                    fpath = os.path.join(loc, f)
                    arcpy.AddIDMessage( "INFORMATIVE", 86071, f) # <file.zip> is loading...
                    unzip(fpath, scratchFolder)

                    xmlFiles = glob.glob(os.path.join(scratchFolder, '*.xml'))

                    metadataFile = ""
                    for x in xmlFiles:
                        m = regEx.match(os.path.basename(x))
                        if m:
                            metadataFile = x
                            break

                    xmlVersion = ""
                    if metadataFile and len(metadataFile) > 0:
                        xmlVersion = parseXmlVersion(metadataFile)

                    if not xmlVersion or len(xmlVersion) == 0:
                        arcpy.AddIDMessage("WARNING", 90281, f, "0x90050003") # Unable to process {0} due to {1}
                        cleanUp(scratchFolder)
                        continue

                    if not versionsAreCompatible(xmlVersion, gdbVersion):
                        arcpy.AddIDMessage("WARNING", 90282, xmlVersion, gdbVersion) #Shape file ({0}) and geodatabase ({1}) TRD versions are not compatible.
                        cleanUp(scratchFolder)
                        continue

                    
                    crossRefDir = os.path.join(defHome, "Mgcp\\DataConversion")
                    crossRefName = "MGCP_TRD_{0}_SHP_to_MGCP_TRD_{1}_GDB.gdb".format(xmlVersion.replace(".", "_"), gdbVersion.replace(".", "_"))
                    if xmlVersion == "2.0" and gdbVersion == "3.0":
                        crossRefName = "MGCP_TRD_3_0_SHP_to_MGCP_TRD_3_0_GDB.gdb"
                    crossRefPath = os.path.join(crossRefDir, crossRefName)
                    baseCrossRefPath = crossRefPath;

                    if not arcpy.Exists(crossRefPath):
                        # Look for .mdb instead
                        crossRefName = os.path.splitext(crossRefName)[0] + '.mdb'
                        crossRefPath = os.path.join(crossRefDir, crossRefName)
                        if not arcpy.Exists(crossRefPath):
                            arcpy.AddIDMessage("WARNING", 110, baseCrossRefPath ) # Unable to find cross-reference database {0} at {1}", os.path.splitext(crossRefName)[0], crossRefDir
                            cleanUp(scratchFolder)
                            continue

                    # Load the shapefiles
                    try:
                        arcpy.topographic.LoadData(crossRefPath, scratchFolder, target_gdb)
                        addMessages()
                    except arcpy.ExecuteError:
                        arcpy.AddIDMessage("WARNING", 551, arcpy.GetMessages(2)) # "Failed to load shapefiles.\r\n{0}", arcpy.GetMessages(2)
                        cleanUp(scratchFolder)
                        continue

                    # Import metdata
                    arcpy.AddIDMessage("INFORMATIVE", 86103, metadataFile, target_cell) # "Importing %s", os.path.basename(metadataFile)
                    try:
                        arcpy.topographic.ImportMetadata(metadataFile, target_cell)
                        addMessages()
                    except arcpy.ExecuteError:
                        arcpy.AddWarning(arcpy.GetMessages(2)) # "Failed to import {0}.\r\n{1}", os.path.basename(metadataFile), arcpy.GetMessages(2)

                    for x in xmlFiles:
                        try:
                            arcpy.Delete_management(x)
                        except arcpy.ExecuteError:
                            arcpy.AddIDMessage("WARNING", 317, x) # "Failed to delete {0}.\r\n{1}", x, arcpy.GetMessages(2)

                    # Clean up extracted files
                    cleanUp(scratchFolder)

        # Set the output parameter
        arcpy.SetParameter(2, target_gdb)
    except DefenseUtilities.LicenseException:
        arcpy.AddIDMessage("ERROR", 824)
    except Exception as e:
        arcpy.AddIDMessage("ERROR", 999998)
        arcpy.AddError("{0}".format(e))


if __name__ == "__main__":
    main()

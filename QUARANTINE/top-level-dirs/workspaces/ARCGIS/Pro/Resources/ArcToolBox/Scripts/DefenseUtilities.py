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
Source Name:   DefenseUtilities.py
Version:       ArcGIS 2.5
Author:        Environmental Systems Research Institute Inc.
Description:   Contains utilities functions for Defense workflows.
---------------------------------------------------------------------------
"""

# Importing necessary modules
from arcpy import GetMessages, AddMessage, AddWarning, AddError, management, Exists, ListFields, GetInstallInfo, \
     env, CheckExtension, CheckOutExtension, ListFeatureClasses, ListDatasets, Describe, da, ProductInfo
from winreg import OpenKeyEx, HKEY_LOCAL_MACHINE, HKEY_CURRENT_USER, QueryValueEx, CloseKey
from os import path, makedirs, walk, environ, getenv
from traceback import format_tb, format_exc
from sys import exc_info
from uuid import uuid4
from getpass import getuser
from locale import atof


# Classes
class LicenseException(Exception):
    """Exception raised when an ArcGIS Desktop Standard or Advanced license is unavailable"""
    pass


# Gets the VST database and specification name
class GetSpecification(object):
    def __init__(self, producttype, version):
        if producttype in ['MTM50', 'MTM100']:
            self.dataset = 'MGCP'
            if version in ['TRD_4_2']:
                self.vstDatabase = 'MGCP_TRD_4_2_MTM_Visual_Specification.gdb'
            elif version in ['TRD_4_3']:
                self.vstDatabase = 'MGCP_TRD_4_3_MTM_Visual_Specification.gdb'
            if producttype in ['MTM50'] and version in ['TRD_4_2']:
                self.vstSpec = 'MGCP_50K :: MGCP TRD 4.2 Visual Specification for MGCP Topographic Map (MTM)'
                self.productfile = 'MTM50_TRD_4_2_BuildingOffsets.xml'
            elif producttype in ['MTM100'] and version in ['TRD_4_2']:
                self.vstSpec = 'MGCP_100K :: MGCP TRD 4.2 Visual Specification for MGCP Topographic Map (MTM)'
                self.productfile = 'MTM100_TRD_4_2_BuildingOffsets.xml'
            elif producttype in ['MTM50'] and version in ['TRD_4_3']:
                self.vstSpec = 'MGCP_50K :: MGCP TRD 4.3 Visual Specification for MGCP Topographic Map (MTM)'
                self.productfile = 'MTM50_TRD_4_3_BuildingOffsets.xml'
            elif producttype in ['MTM100'] and version in ['TRD_4_3']:
                self.vstSpec = 'MGCP_100K :: MGCP TRD 4.3 Visual Specification for MGCP Topographic Map (MTM)'
                self.productfile = 'MTM100_TRD_4_3_BuildingOffsets.xml'
        elif producttype in ['TM25', 'TM50', 'TM100']:
            self.dataset = 'TDS'
            if version in ['TDS_6_1']:
                self.vstDatabase = 'TDS_6_1_TM_Visual_Specification.gdb'
            if producttype in ['TM25'] and version in ['TDS_6_1']:
                self.vstSpec = 'TDS_25K :: 25K TM Visual Specification for TDS 6.1'
                self.productfile = 'TM25_TDS_6_1_BuildingOffsets.xml'
            elif producttype in ['TM50'] and version in ['TDS_6_1']:
                self.vstSpec = 'TDS_50K :: 50K TM Visual Specification for TDS 6.1'
                self.productfile = 'TM50_TDS_6_1_BuildingOffsets.xml'
            elif producttype in ['TM100'] and version in ['TDS_6_1']:
                self.vstSpec = 'TDS_100K :: 100K TM Visual Specification for TDS 6.1'
                self.productfile = 'TM100_TDS_6_1_BuildingOffsets.xml'
        elif producttype in ['JOG_A']:
                self.dataset = 'VMap1JOG'
                self.vstDatabase = 'Vmap1JOGA_Visual_Specification.gdb'
                self.vstSpec = 'Vmap1JOGA :: Visual Specification for Vmap1JOGA'
                self.productfile = ''


# Get properties of the rasters
class GetRasterProperties(object):
    def __init__(self, rasterlist):
        pixels = 14
        self.bands = 1
        self.pixelType = ''
        for raster in rasterlist:
            raster = r'{0}'.format(raster.strip("'"))
            band = management.GetRasterProperties(raster, 'BANDCOUNT').getOutput(0)
            if int(band) > self.bands:
                self.bands = band
            pixel = int(management.GetRasterProperties(raster, 'VALUETYPE').getOutput(0))
            if pixel < pixels:
                pixels = pixel
            if pixels == 0:
                self.pixelType = '1_BIT'
            elif pixels == 1:
                self.pixelType = '2_BIT'
            elif pixels == 2:
                self.pixelType = '4_BIT'
            elif pixels == 3:
                self.pixelType = '8_BIT_UNSIGNED'
            elif pixels == 4:
                self.pixelType = '8_BIT_SIGNED'
            elif pixels == 5:
                self.pixelType = '16_BIT_UNSIGNED'
            elif pixels == 6:
                self.pixelType = '16_BIT_SIGNED'
            elif pixels == 7:
                self.pixelType = '32_BIT_UNSIGNED'
            elif pixels == 8:
                self.pixelType = '32_BIT_SIGNED'
            elif pixels == 9:
                self.pixelType = '32_BIT_FLOAT'
            elif pixels == 10:
                self.pixelType = '64_BIT'
            elif pixels == 11:
                self.pixelType = '8_BIT_SIGNED'
            elif pixels == 12:
                self.pixelType = '64_BIT'
            elif pixels == 13:
                self.pixelType = '16_BIT_SIGNED'
            elif pixels == 14:
                self.pixelType = '32_BIT_SIGNED'


# This class gets different tolerances for the create contour tool
class GetContourTolerances(object):
    def __init__(self, scale):
        self.minimumLength = atof('0.00')
        self.tolerance = ''
        if scale == '1:5000':
            self.minimumLength = atof('.0004')
            self.tolerance = '.11 Meters'
        elif scale == '1:7500':
            self.minimumLength = atof('.0005')
            self.tolerance = '.12 Meters'
        elif scale == '1:12500':
            self.minimumLength = atof('.0006')
            self.tolerance = '.13 Meters'
        elif scale == '1:25000':
            self.minimumLength = atof('.0007')
            self.tolerance = '.14 Meters'
        elif scale == '1:50000':
            self.minimumLength = atof('.002')
            self.tolerance = '.15 Meters'
        elif scale == '1:100000':
            self.minimumLength = atof('.003')
            self.tolerance = '.16 Meters'
        elif scale == '1:250000':
            self.minimumLength = atof('.009')
            self.tolerance = '.17 Meters'
        elif scale == '1:500000':
            self.minimumLength = atof('.015')
            self.tolerance = '.18 Meters'
        elif scale == '1:1000000':
            self.minimumLength = atof('.03')
            self.tolerance = '.19 Meters'


# Gets the datasets and feature classes in the production database
class GetFeatureClasses(object):
    def __init__(self, productiondatabase, wildcard):
        self.featureClasses = []
        env.workspace = productiondatabase
        self.featureDatasets = ListDatasets(wildcard, "Feature")
        for dataset in self.featureDatasets:
            fcs = ListFeatureClasses("*", "", dataset)
            for fclass in fcs:
                self.featureClasses.append(path.join(productiondatabase, dataset, fclass))


# This gets a list of features that are selected
class GetSelectedFeatures(object):
    def __init__(self, inputfeatures, scratchworkspace):
        self.featureCount = 0
        self.featureList = []
        temp = path.split(scratchworkspace)[0]
        templ = path.join(scratchworkspace, "Temp")
        templ2 = path.join(temp, "Temp.lyr")
        selection = Describe(inputfeatures)
        selstring = str(selection.fidSet.split(";"))
        if selstring == "[u'']":
            AddError("No features are selected. At least one feature must be selected.")
        else:
            count = len(selection.fidSet.split(";"))
            if count >= 1:
                management.CopyFeatures(inputfeatures, templ)
                management.MakeFeatureLayer(templ, templ2)
                management.SelectLayerByAttribute(templ2, "NEW_SELECTION")
                with da.SearchCursor(templ2, "NRN") as cur:
                    for row in cur:
                        self.featureCount += 1
                        self.featureList.append(row[0])


# Functions
# Trace function gets errors and exceptions that occur during execution
def trace(thisfilename):
    tbinfo = format_tb(exc_info()[2])[0]
    line = tbinfo.split(', ')[1]
    synerror = format_exc().splitlines()[-1]
    return line, thisfilename, synerror


# Gets product path from the Defense Mapping registry key
def getproductpath():
    insinfo = GetInstallInfo()
    if insinfo['ProductName'] == 'Desktop':
        prodkey = 'SOFTWARE\\EsriProduction\\Desktop{}\\ESRIDefenseMapping\\Settings'.format(insinfo['Version'][:4])
        inskey = 'Software\\ESRIProduction\\Desktop{}\\ESRIDefenseMapping'.format(insinfo['Version'][:4])
    elif insinfo['ProductName'] == 'Server':
        prodkey1 = 'SOFTWARE\\EsriProduction\\Server{}\\ESRIDefenseMapping\\Settings'.format(insinfo['Version'][:4])
        inskey1 = 'Software\\EsriProduction\\Server{}\\EsriDefenseMapping'.format(insinfo['Version'][:4])
        prodkey2 = 'SOFTWARE\\ESRI\\DefenseMappingEnterprise'
        inskey2 = 'SOFTWARE\ESRI\ProductionMappingEnterprise'
    elif insinfo['ProductName'] == 'ArcGISPro':
        prodkey = 'SOFTWARE\\ESRI\\DefenseMappingPro'
        inskey = 'SOFTWARE\\EsriProduction\\Desktop{}\\ESRIDefenseMapping\\Settings'.format(insinfo['Version'][:4])
    if insinfo['ProductName'] == 'ArcGISPro':
        hasKey = True
        try:
            hkey = OpenKeyEx(HKEY_LOCAL_MACHINE, prodkey)
            regval, typ = QueryValueEx(hkey, 'ProductFiles')
        except:
            hasKey = False
           
        if not hasKey:
            try:
                hkey = OpenKeyEx(HKEY_CURRENT_USER, inskey)
                regval, typ = QueryValueEx(hkey, 'ProductFilePath')
            except:                
                return ""
    elif insinfo['ProductName'] == 'Server':
        hasKey = True
        try:
            hkey = OpenKeyEx(HKEY_LOCAL_MACHINE, prodkey1)
            regval, typ = QueryValueEx(hkey, 'ProductFiles')
        except:
            hasKey = False

        hasKey = True
        try:
            hkey = OpenKeyEx(HKEY_LOCAL_MACHINE, prodkey2)
            regval, typ = QueryValueEx(hkey, 'ProductFiles')
        except:
            hasKey = False

        hasKey = True
        if not hasKey:
            try:
                hkey = OpenKeyEx(HKEY_CURRENT_USER, inskey1)
                regval, typ = QueryValueEx(hkey, 'ProductFilePath')
            except:                
                hasKey = False

        hasKey = True
        if not hasKey:
            try:
                hkey = OpenKeyEx(HKEY_CURRENT_USER, inskey2)
                regval, typ = QueryValueEx(hkey, 'ProductFilePath')
            except:                
                return ""
    else:
        hasKey = False
        try:
            hkey = OpenKeyEx(HKEY_CURRENT_USER, prodkey)
            regval, typ = QueryValueEx(hkey, 'ProductFilePath')
        except:
            hasKey = False
        
        if not hasKey:
            try:
                hkey = OpenKeyEx(HKEY_LOCAL_MACHINE, inskey)
                regval, typ = QueryValueEx(hkey, 'InstallDir')
            except:
                return ""
    CloseKey(hkey)
    return path.abspath(regval)


# Checks out necessary extensions
def checkoutextensions(extlist):
    try:
        for ext in extlist:
            if licenselevel() == 'Server':
                if CheckExtension(ext) != 'Available':
                    raise LicenseException('The {} extension is not available'.format(ext))
            else:
                check = CheckExtension(ext)
                if check == 'Available':
                    checkout = CheckOutExtension(ext)
                    if checkout != 'CheckedOut':
                        raise LicenseException('The {} extension is {}'.format(ext, checkout))
                else:
                    raise LicenseException('The {} extension is {}'.format(ext, check))
        return
    except Exception as e:
        raise LicenseException('Check licenses for availability.')


# Setting up the environment for the tool run
def setenvironment():
    state = env.overwriteOutput
    if not state:
        env.overwriteOutput = 1
    scratch, temp = defaultpath()
    env.scratchWorkspace = scratch
    templist = []
    return scratch, temp, templist


# Gets the registry key for the current version installed
def getregkey():
    insinfo = GetInstallInfo()
    regkey = ''
    if insinfo['ProductName'] == 'Desktop':
        regkey = 'Software\\ESRIProduction\\Desktop{}\\ESRIDefenseMapping'.format(insinfo['Version'][:4])
    elif insinfo['ProductName'] == 'Server':
        regkey = 'Software\\EsriProduction\\Server{}\\EsriDefenseMapping'.format(insinfo['Version'][:4])
    return regkey


# Gets the install root for ArcGIS
def installroot():
    try:
        regkey = getregkey()
        hkey = OpenKeyEx(HKEY_LOCAL_MACHINE, regkey)
        reg_val, typ = QueryValueEx(hkey, 'InstallDir')
        CloseKey(hkey)
        installsplit = str(reg_val).split('\\')
        installsplit.remove('')
        return '\\'.join(installsplit)
    except Exception as e:
        AddError('Unable to obtain install root.\n{}\n'.format(e))


# Gets the registry entry for TEMP system environment variable
def getsystemp():
    tempFolder = None
    user = getuser()
    try:
        if 'TEMP' in environ:
            tempFolder = getenv('TEMP')
        else:
            tempFolder = path.join(path.expanduser('~'), r'Documents\ArcGIS')
    except Exception as e:
        AddWarning('Unable to retrieve TEMP environment variable from user variable\n')
    return tempFolder, user


# Gets the path to the Default.gdb
def defaultpath():
    templocat, user = getsystemp()
    guid = '{}'.format(uuid4())
    gdbpath = ''
    if (templocat is not None) or templocat != '':
        if Exists(path.join(templocat, user)):
            gdbpath = path.join(templocat, user)
        else:
            makedirs(path.join(templocat, user))
            gdbpath = path.join(templocat, user)
    elif Exists(path.join(path.expanduser('~'), r'AppData\Local\Temp')):
        gdbpath = path.join(path.expanduser('~'), r'AppData\Local\Temp')
    elif Exists(path.join(path.expanduser('~'), r'Local Settings\Temp')):
        gdbpath = path.join(path.expanduser('~'), r'Local Settings\Temp')
    else:
        try:
            makedirs(path.join(path.expanduser('~'), r'AppData\Local\Temp'))
            gdbpath = path.join(path.expanduser('~'), r'AppData\Local\Temp')
        except Exception as e:
            makedirs(path.join(path.expanduser('~'), r'Local Settings\Temp'))
            gdbpath = path.join(path.expanduser('~'), r'Local Settings\Temp')
    newpath = path.join(gdbpath, guid)
    makedirs(newpath)
    if not Exists(path.join(newpath, 'Temp.gdb')):
        management.CreateFileGDB(newpath, 'Temp.gdb')
    gdb = path.join(newpath, 'Temp.gdb')
    folder = path.split(gdb)[0]
    return gdb, folder


# This function checks the existence of a specified field in a feature class
def fieldexists(fcname, field):
    if not Exists(fcname):
        return False
    else:
        fieldslist = []
        for lfield in ListFields(fcname):
            fieldslist.append(lfield.name)
        if field in fieldslist:
            return True
        else:
            return False


# Gets messages from the ArcGIS tools ran and sends messages to dialog
def writeresults():
    messages = GetMessages(0)
    warnings = GetMessages(1)
    errors = GetMessages(2)
    AddMessage(messages)
    if len(warnings) > 0:
        AddWarning(warnings)
    if len(errors) > 0:
        AddError(errors)
    return


# Removes temporary files that were created while running the tool
def cleanup(templist):
    for temp in templist:
        try:
            management.Delete(temp)
            writeresults()
        except Exception as e:
            AddWarning('Unable to delete {} from temporary memory!\n{}'.format(temp, e))
    return


# Determines the scale based on product type
def getscale(producttype):
    if producttype in ['TM25']:
        scale = '1:25000'
        interval = '20'
        index = '100'
    elif producttype in ['MTM50', 'TM50']:
        scale = '1:50000'
        interval = '20'
        index = '100'
    elif producttype in ['MTM100', 'TM100']:
        scale = '1:100000'
        interval = '40'
        index = '200'
    elif producttype in ['JOG_A']:
        scale = '1:250000'
        interval = '100'
        index = '500'
    else:
        AddError('Unable to determine scale.')
    return scale, interval, index


# Determines properties for contours
def getcontinfo(producttype, version):
    if producttype in ['MTM50', 'MTM100']:
        contdset = 'MGCP_Delta'
        contfc = 'ContourL'
        contfld = 'ZVH'
        contsub = 'CA010_Elevation_Contour_Line'
    elif producttype in ['TM25', 'TM50', 'TM100']:
        contdset = 'TDS'
        contfc = 'HypsographyCrv'
        contfld = 'ZVH'
        contsub = 'ELEVATION_CONTOUR_C'
    elif producttype in ['JOG_A']:
        if version in ['VMap1JOGA']:
            contdset = 'VMap1JOG'
            contfc = 'ContourL'
            contfld = 'zv2'
            contsub = 'ContourLine(Land)'
        elif version in ['TDS_6_1']:
            contdset = 'TDS'
            contfc = 'HypsographyCrv'
            contfld = 'ZVH'
            contsub = 'ELEVATION_CONTOUR_C'
    else:
        AddError('Unable to determine contour information')
    return contdset, contfc, contfld, contsub


# Determines properties for spots
def getspotinfo(producttype, version):
    if producttype in ['MTM50', 'MTM100']:
        spotdset = 'MGCP_Delta'
        spotfc = 'ElevP'
        spotfld = 'ZVH'
        spotsub = 'CA030_Spot_Elevation_Point'
    elif producttype in ['TM25', 'TM50', 'TM100']:
        spotdset = 'TDS'
        spotfc = 'HypsographyPnt'
        spotfld = 'ZVH'
        spotsub = 'SPOT_ELEVATION_P'
    elif producttype in ['JOG_A']:
        if version in ['VMap1JOGA']:
            spotdset = 'VMap1JOG'
            spotfc = 'ElevP'
            spotfld = 'zv2'
            spotsub = 'SpotElevationPoint'
        elif version in ['TDS_6_1']:
            spotdset = 'TDS'
            spotfc = 'HypsographyPnt'
            spotfld = 'ZVH'
            spotsub = 'SPOT_ELEVATION_P'
    else:
        AddError('Unable to determine spot height information')
    return spotdset, spotfc, spotfld, spotsub


# Walks given path to find given file
def walkpath(inpath, infile):
    fpath = ''
    for root, dirs, files in walk(inpath):
        for d in dirs:
            if d == infile:
                fpath = path.join(root, d)
        if fpath == '':
            for f in files:
                if f == infile:
                    fpath = path.join(root, f)
    return fpath


# Checks to see if the tool is licensed
def licenselevel():
    level = 'None'
    if ProductInfo() == 'ArcServer':
        level = 'Server'
    elif ProductInfo() == 'ArcInfo':
        level = 'Advanced'
    elif ProductInfo() == 'ArcEditor':
        level = 'Standard'
    elif ProductInfo() == 'ArcView':
        level = 'Basic'
    return level
    
def isLicensed(product_codes, extension_codes):
    product_code = licenselevel().lower();
    if( product_code not in map(str.lower, product_codes)):
        return False
    if ( any([(CheckExtension(extension).lower() == 'available') for extension in extension_codes])):
        return True        
    else:
        return False
     
     
    
    

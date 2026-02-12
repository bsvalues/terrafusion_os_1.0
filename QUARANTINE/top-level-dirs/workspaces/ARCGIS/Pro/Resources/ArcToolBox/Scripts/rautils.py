"""-----------------------------------------------------------------------------
Name:              rautils.py
Purpose:           Helper methods for raster analysis Pro GP tool scripts
Author:            Esri Inc.
Created:           10/21/2016
Copyright:   (c)   Esri, Inc. 2016
ArcGIS Version:    10.5
-----------------------------------------------------------------------------"""
import os
import arcpy
import json
from gautils import get_message
import requests
from requests.packages.urllib3.exceptions import InsecureRequestWarning

dict_field_types = {'OID':'esriFieldTypeOID','Single':'esriFieldTypeSingle', 'Double':'esriFieldTypeDouble',
                    'Integer':'esriFieldTypeInteger', 'SmallInteger':'esriFieldTypeSmallInteger',
                    'String':'esriFieldTypeString'}

def setContext(environmentsList):
    environmentsSupported = ["outputCoordinateSystem", "extent", "snapRaster", "cellSize", "mask",
                             "parallelProcessingFactor", "processorType", "pyramid"]

    context = {}
    if environmentsList:
        envInvalidUnsupported = list(set(environmentsList) - set(environmentsSupported))
        if envInvalidUnsupported:
            msg = get_message(120004, envInvalidUnsupported) # Invalid or unsupported environment(s): %s
            arcpy.AddWarning(msg)
        # output coordinate system
        if "outputCoordinateSystem" in environmentsList:
            sr = arcpy.env.outputCoordinateSystem
            if sr:
                context["outSR"] = {}
                context["outSR"]["wkid"] = sr.factoryCode

        # extent
        if "extent" in environmentsList:
            ext = arcpy.env.extent
            if type(ext) is str:
                context["extent"] = ext
            elif type(ext) == type(arcpy.Extent()):
                context["extent"] = {}
                context["extent"]["type"] = "extent"
                context["extent"]["xmin"] = ext.XMin
                context["extent"]["ymin"] = ext.YMin
                context["extent"]["xmax"] = ext.XMax
                context["extent"]["ymax"] = ext.YMax
                context["extent"]["spatialReference"] = {}
                context["extent"]["spatialReference"]["wkid"] = ext.spatialReference.factoryCode

        # snapRaster
        if "snapRaster" in environmentsList:
            snapras = arcpy.env.snapRaster
            if snapras:
                urlsnapras = snapras

                datatype = None
                try:
                    datatype = arcpy.Describe(snapras).dataType
                except:
                    pass

                # get url for an image service layer
                if datatype == 'RasterLayer':
                    urlsnapras = arcpy.Raster(snapras).catalogPath

                context["snapRaster"] = {}
                context["snapRaster"]["url"] = urlsnapras


        # cellSize
        if "cellSize" in environmentsList:
            cellsz = arcpy.env.cellSize
            if cellsz:
                context["cellSize"] = cellsz

                datatype = None
                try:
                    datatype = arcpy.Describe(cellsz).dataType
                except:
                    pass

                # get url for an image service layer
                if datatype == 'RasterLayer':
                    czras = arcpy.Raster(cellsz).catalogPath
                    context["cellSize"] = {}
                    context["cellSize"]["url"] = czras


        # mask
        if "mask" in environmentsList:
            msk = arcpy.env.mask
            if msk:
                urlmask = msk

                datatype = None
                try:
                    datatype = arcpy.Describe(msk).dataType
                except:
                    pass

                # get url for an image server layer
                if datatype == 'RasterLayer':
                    urlmask = arcpy.Raster(msk).catalogPath

                # get url from a feature server layer
                if datatype == 'FeatureLayer':
                    urlmask = arcpy.Describe(msk).catalogPath
                    # If input a feature service layer, url would be, for example,
                    # "GIS Servers\\https://DEV002835.esri.com/server/rest/services/Hosted/ca_ozone_polygonmask/FeatureServer\\L0ca_ozone_mask"
                    # And "GIS Servers" would be localized
                    if "\\" in urlmask:
                        index = urlmask.find("\\") + 1
                        urlmask = urlmask[index:]

                context['mask']={}
                context['mask']['url'] = urlmask

        # parallelProcessingFactor
        if "parallelProcessingFactor" in environmentsList:
            ppf = arcpy.env.parallelProcessingFactor
            if ppf:
                context["parallelProcessingFactor"] = ppf

        # processorType
        if "processorType" in environmentsList:
            processortype = arcpy.env.processorType
            if processortype:
                context["processorType"] = processortype

        # pyramid
        if "pyramid" in environmentsList:
            prmdstr = arcpy.env.pyramid
            if prmdstr != "NONE":
                list_args = prmdstr.split()
                context["pyramid"] = {}
                try:
                    context["pyramid"]["pyramid_option"] = list_args[0]
                    context["pyramid"]["levels"] = list_args[1]
                    context["pyramid"]["interpolation_type"] = list_args[2]
                    context["pyramid"]["pyramid_compression"] = list_args[3]
                    context["pyramid"]["compression_quality"] = list_args[4]
                    if list_args[5] == "NO_SKIP":
                        list_args[5] = "NONE"
                    context["pyramid"]["skip_first"] = list_args[5]
                    context["pyramid"]["sips"] = list_args[6]
                except:
                    pass
            
    return json.dumps(context)

def getServiceType(in_url):
    '''This util function returns the type of the service represented by an input URL'''
    if '/MapServer' in in_url or '/FeatureServer' in in_url:
        return 0
    elif '/ImageServer' in in_url:
        return 1

def getServiceInfo(in_url):
    '''returns service properties for given url.'''
    tokendict = arcpy.GetSigninToken()
    token1 = tokendict["token"]
    referer1 = tokendict['referer']

    try:
        data = {"f": "json", "token": token1, "referer": referer1}
        # No need to check certificate
        # requests.packages.urllib3.disable_warnings(InsecureRequestWarning) # ?
        r = requests.post(in_url, params=data, verify=False)
        sinfo = r.json()
        return sinfo
    except:
        return None

def getServiceFields(in_url, field_types=None):
    '''returns fields from image or feature service url.'''
    if '/ImageServer' in in_url:
        url2 = in_url + "/rasterAttributeTable"
    elif '/MapServer' in in_url or '/FeatureServer' in in_url:
        url2 = in_url

    fnames = []
    try:
        sinfo = getServiceInfo(url2)
        all_fields = sinfo["fields"]
        if not (field_types is None):
            for fd in all_fields:
                if fd["type"] in field_types:
                    fnames.append(fd["name"])
        else:
            for fd in all_fields:
                fnames.append(fd["name"])
    except:
        pass
    return fnames

def listFields(in_data, in_types):
    result = []
    json_ftypes = [dict_field_types[t1] for t1 in in_types]
    if "://" in in_data: # url case
        result = getServiceFields(in_data, json_ftypes)
    else: # layer names
        try:
            listF = arcpy.ListFields(in_data, in_types)
            for f in listF:
                if f.type in in_types:
                    result.append(f.name)
        except:
            pass
    return result

def getFeatureOrRasterURL(in_data):
    url = in_data
    try:
        desc = arcpy.Describe(in_data)
        if desc.datasetType == "FeatureClass":  # Feature layer
            url = desc.catalogPath
            url = url.replace("\\", "/")

        if desc.datasetType == "RasterDataset":  # Raster Layer
            url = arcpy.sa.Raster(in_data).catalogPath
    except:  # Assume raster Image URL
        url = in_data
    return url

def getRasterURL(in_data):
    url = ""
    if in_data == "" or in_data == "#" or in_data is None:
        url = ""
    else:
        try:
            desc = arcpy.Describe(in_data)
            if desc.datasetType == "RasterDataset":  # Raster Layer
                url = arcpy.sa.Raster(in_data).catalogPath
        except:
            url = in_data
    return url

def makeJSONParameter(in_url):
    param = ""
    if in_url == "" or in_url == "#" or in_url is None:
        param = ""
    else:
        param = json.dumps({"url": in_url})
    return param

def integerTest(in_url):
    try:
        sinfo = getServiceInfo(in_url)
        ptype = sinfo["pixelType"]
        if ptype[0].upper() == "F":
            return False
        else:
            return True
    except:
        return True

def makeJSONOptionalOutput(in_param_text):
    optOutputJS = ""
    if in_param_text == "" or in_param_text == "#" or in_param_text == None:
        optOutputJS = ""
    else:
        optOutputJS = json.dumps({"serviceProperties": {"name": in_param_text}})
    return optOutputJS

def appendTokenToURL(in_url):
    out_url = in_url
    #try:
    #    tokendict = arcpy.GetSigninToken()
    #    token1 = tokendict["token"]
    #    out_url = in_url + "?token=" + token1
    #except:
    #    out_url = in_url
    return out_url

def validateIntegerRaster(inputZoneLayerParam):
    if (not (inputZoneLayerParam.value in ["", "#", None])):
            try: 
                rasobj = arcpy.sa.Raster(inputZoneLayerParam.valueAsText)
                if not rasobj.isInteger:
                    inputZoneLayerParam.setErrorMessage("The input raster pixel type is not integer.")
            except:
                pass

def validateNonLocalRaster(inputZoneLayerParam):
    #if (not (inputZoneLayerParam.value in ["", "#", None])):
    #        try:
    #            rasobj = arcpy.sa.Raster(inputZoneLayerParam.valueAsText)
    #            catPath = rasobj.catalogPath
    #            driveLtr = os.path.splitdrive(catPath)[0]
    #            if len(driveLtr) == 2 and driveLtr[0].isalpha() and driveLtr[1] == ":":
    #                inputZoneLayerParam.setErrorMessage("Local raster dataset is not supported in this parameter. Please specify a portal item or image service url.")
    #        except:
    #            pass
    pass

def convertURLToRest(url):
    url_fixed = url
    if not "/rest/" in url.lower():
        indx = url.lower().find("/services/")
        url_fixed = url[:indx] + "/rest" + url[indx:]
    return url_fixed

def isMultidimensional(in_url):
    val = True
    if "://" in in_url: # url case
        try:
            sinfo = getServiceInfo(in_url)
            val = sinfo['hasMultidimensions']
        except:
            pass
    else: # layer case
        try:
            r = arcpy.sa.Raster(in_url)
            catPath = r.catalogPath
            if "://" in in_url: # image server layer
                url = convertURLToRest(catPath)
                sinfo = getServiceInfo(url)
                val = sinfo['hasMultidimensions']
            else: # dataset layer
                val = r.isMultidimensional
        except:
            pass
    return val

def isMultidimensional2(in_data):
    res = True
    in_url = in_data
    if not ("://" in in_data): # layer case
        in_soap_url = getRasterURL(in_data)
        in_url = convertURLToRest(in_soap_url)
    try:
        sinfo = getServiceInfo(in_url + "/multiDimensionalInfo")
        if sinfo is None:
            res = False
        else:
            if "multidimensionalInfo" in sinfo.keys():
                res = True
            elif "error" in sinfo.keys():
                res = False
            else:
                res = False
    except:
        res = False
    return res

def validateUnitName(inUnit):
    in_unit = inUnit.lower()
    out_unit = "unknown"
    if 'meter' in in_unit:
        out_unit = 'meters'
    elif ('foot' in in_unit) or ('feet' in in_unit):
        out_unit = 'feet'
    elif 'yard' in in_unit:
        out_unit = 'yards'
    elif 'inch' in in_unit:
        out_unit = 'inches'
    elif 'kilometer' in in_unit:
        out_unit = 'kilometers'
    else:
        out_unit = in_unit
    return out_unit
        

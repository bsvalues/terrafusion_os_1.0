import arcpy
from arcgisscripting import _hgp
import json
import sys


class GPCloudExec(Exception):
    def __init__(self, func, errmsg):
        self.func = func
        self.errmsg = errmsg
        if errmsg is not None and len(errmsg) > 0:
            super(GPCloudExec, self).__init__(func + ". Error: " + errmsg)
        else:
            self.errmsg = ""
            super(GPCloudExec, self).__init__(func + ".")


class OutputName(object):
    def __init__(self):
        self.createService = False
        self.serviceName = ""
        self.json = ""


class InputFeatureLayer(object):
    def __init__(self):
        self.name = ""  # internal gp name
        self.layername = ""  # name on layer
        self.count = 0
        self.shapeType = ""
        self.changedFieldNames = ""
        self.esriLayerCatalogPath = ""
        self._ptr = None


class OutputFeatureDataset(object):
    def __init__(self):
        self.path = ""
        self._ptr = None


class ImageServiceDataSource(object):
    def __init__(self):
        self.path = ""
        self._ptr = None


class HostedGP(object):
    def __init__(self, context=None, outputName=None, tenantCheck=True):
        try:
            self._hostedgp = _hgp._hostedgp()
            if tenantCheck:
                self._hostedgp.Check()
        except Exception as err:
            raise GPCloudExec("HostedGP initialization failed", str(err))
        # data properties
        self._self = None
        self._selfJson = None
        self.extent = u""
        self.outSR = u""
        self.contextJson = u""
        self.outputName = OutputName()
        self._setEnvironment(context)
        self._getOutputName(outputName)

    def Cleanup(self):
        return

    def GetHostedLayersForExtract(self, index):
        try:
            retval = self._hostedgp.GetLayersForExtract(index)
            # convert to json dictionary
            retobj = json.loads(retval)
        except Exception as err:
            raise GPCloudExec(
                "GetHostedLayersForExtract for parameter %d failed" % (index),
                str(err))
        return retobj

    def GetHostedLayers(self, index, forExtract=False):
        if forExtract is True:
            prop = "{'extractData' : true}"
        else:
            prop = "{}"

        try:
            return self._hostedgp.GetLayers(index, str(prop), InputFeatureLayer)
        except Exception as err:
            raise GPCloudExec(
                "GetHostedLayers for parameter %d failed" % (index), str(err))

    def GetHostedLayer(self, index, forExtract=False):
        if forExtract is True:
            prop = "{'extractData' : true}"
        else:
            prop = "{}"
        try:
            return self._hostedgp.GetLayers(index, str(prop), InputFeatureLayer)
        except Exception as err:
            raise GPCloudExec("GetLayers for parameter %d failed" % (index),
                              str(err))

    def _getOutputName(self, index):
        obj = OutputName()
        if index is not None:
            param = arcpy.GetParameter(index)
            obj.json = param
        else:
            param = ""

        try:
            self._hostedgp.GetOutputName(str(param), obj)
        except Exception as err:
            raise GPCloudExec("GetOutputName failed", str(err))
        self.outputName = obj

    def GetOutputName(self, index):
        return self.outputName

    def ProcessFeatureOutput(self, metadata):
        try:
            output = self._hostedgp.ProcessFeatureOutput(
                str(self.outputName.json), str(metadata), str(self.outSR))
        except Exception as err:
            raise GPCloudExec("ProcessFeatureOutput failed", str(err))

    def GetOutputCatalogPath(self, service):
        x = OutputFeatureDataset()
        try:
            self._hostedgp.GetOutputCatalogPath(str(service.json), x)
        except Exception as err:
            raise GPCloudExec("OutputCatalogPath failed", str(err))
        return x

    def GetImageServiceDataPath(self, serviceurl):
        x = ImageServiceDataSource()
        try:
            self._hostedgp.GetImageServiceDataPath(str(serviceurl), x)
        except Exception as err:
            raise GPCloudExec(
                "ImageServiceDataPath for service %s failed" % (serviceurl),
                str(err))
        return x

    def CreateService(self, parameters, folderId=None):
        # parameters is dictionary for createService GeoWarehouse api
        paramStr = json.dumps(parameters, skipkeys=False, ensure_ascii=False)
        try:
            if folderId is None:
                folderId = ""
            retval = self._hostedgp.CreateService(str(paramStr), str(folderId))
            if retval is not None:
                retval = json.loads(retval)
            return retval
        except Exception as err:
            raise GPCloudExec("CreateService failed", str(err))

    def SetEnvironment(self, contextJson):
        return

    def _setEnvironment(self, contextparam):
        if contextparam is not None:
            self.contextJson = arcpy.GetParameter(contextparam)
        if len(self.contextJson) == 0:
            return
        contextobj = json.loads(self.contextJson)

        xmin = None
        ymin = None
        xmax = None
        ymax = None
        latestWkid = None
        wkid = None
        wkt = None
        if "extent" in contextobj:
            extentobj = contextobj["extent"]
            if extentobj is not None and isinstance(extentobj, dict):
                if "xmin" in extentobj:
                    xmin = extentobj["xmin"]
                if "ymin" in extentobj:
                    ymin = extentobj["ymin"]
                if "xmax" in extentobj:
                    xmax = extentobj["xmax"]
                if "ymax" in extentobj:
                    ymax = extentobj["ymax"]
                if "spatialReference" in extentobj:
                    extentsr = extentobj["spatialReference"]
                    if extentsr is not None and isinstance(extentsr, dict):
                        if "latestWkid" in extentsr:
                            latestWkid = extentsr["latestWkid"]
                        if "wkid" in extentsr:
                            wkid = extentsr["wkid"]
                        if "wkt" in extentsr:
                            wkt = extentsr["wkt"]
                # check all the values
                if xmin is None or ymin is None or xmax is None or ymax is None:
                    raise GPCloudExec("SetEnvironment", "invalid extent object")
                if latestWkid is None and wkid is None and wkt is None:
                    raise GPCloudExec("SetEnvironment",
                                      "spatial reference missing on extent")

                newExtent = arcpy.Extent(xmin, ymin, xmax, ymax)

                if wkt is not None:
                    newSR = arcpy.SpatialReference()
                    newSR.loadFromString(wkt)
                    newExtent.spatialReference = newSR
                elif latestWkid is not None:
                    newExtent.spatialReference = arcpy.SpatialReference(
                        latestWkid)
                elif wkid is not None:
                    newExtent.spatialReference = arcpy.SpatialReference(wkid)

                arcpy.env.extent = newExtent
                self.extent = json.dumps(extentobj, ensure_ascii=False)
        # handle processSR
        latestWkid = None
        wkid = None
        wkt = None
        if "processSR" in contextobj:
            processsrobj = contextobj["processSR"]
            if processsrobj is not None and isinstance(processsrobj, dict):
                if "latestWkid" in processsrobj:
                    latestWkid = processsrobj["latestWkid"]
                if "wkid" in processsrobj:
                    wkid = processsrobj["wkid"]
                if "wkt" in processsrobj:
                    wkt = processsrobj["wkt"]

                if latestWkid is None and wkid is None and wkt is None:
                    raise GPCloudExec("SetEnvironment failed",
                                      "Invalid process spatial reference")

                if wkt is not None:
                    newSR = arcpy.SpatialReference()
                    newSR.loadFromString(wkt)
                    arcpy.env.outputCoordinateSystem = newSR
                elif latestWkid is not None:
                    arcpy.env.outputCoordinateSystem = arcpy.SpatialReference(
                        latestWkid)
                elif wkid is not None:
                    arcpy.env.outputCoordinateSystem = arcpy.SpatialReference(
                        wkid)

        # handle outSR
        if "outSR" in contextobj:
            outsrobj = contextobj["outSR"]
            if outsrobj is not None and isinstance(outsrobj, dict):
                # save the json
                self.outSR = json.dumps(outsrobj, ensure_ascii=False)

    def GetServerToken(self, serverurl, expiration):
        try:
            s = self._hostedgp.GetServerToken(str(serverurl), expiration)
        except Exception as err:
            raise GPCloudExec("GetServerToken for %s failed" % (serverurl),
                              str(err))
        return s

    def GetOwningSystem(self):
        try:
            o = self._hostedgp.GetOwningSystem()
        except Exception as err:
            raise GPCloudExec("GetOwningSystem failed", str(err))
        return o

    def GetPrivateOwningSystem(self):
        try:
            o = self._hostedgp.GetPrivateOwningSystem()
        except Exception as err:
            raise GPCloudExec("GetPrivateOwningSystem failed", str(err))
        return o

    def GetSelf(self):
        if self._self is None:
            try:
                self._self = self._hostedgp.GetSelf()
                self._selfJson = json.loads(self._self)
            except Exception as err:
                raise GPCloudExec("GetSelf failed", str(err))
        return self._self

    def GetHelperServices(self):
        if self._self is None:
            try:
                self._self = self._hostedgp.GetSelf()
                self._selfJson = json.loads(self._self)
            except Exception as err:
                raise GPCloudExec("GetHelperServices failed", str(err))
            # parse the self for helper services
        return json.dumps(self._selfJson["helperServices"], skipkeys=False, ensure_ascii=False)

    def CheckPrivilege(self, privilege):
        if self._self is None:
            try:
                self._self = self._hostedgp.GetSelf()
                self._selfJson = json.loads(self._self)
            except Exception as err:
                raise GPCloudExec("CheckPrivilege failed", str(err))
            # find it in list
        if "user" in self._selfJson:
            if "privileges" in self._selfJson["user"]:
                if privilege in self._selfJson["user"]["privileges"]:
                    return True

        if "appInfo" in self._selfJson:
            if "privileges" in self._selfJson["appInfo"]:
                if privilege in self._selfJson["appInfo"]["privileges"]:
                    return True
        return False

    def ReportCost(self, toolname, params):
        params["Context"] = self.contextJson
        paramjson = json.dumps(params, skipkeys=False, ensure_ascii=False)
        try:
            self._hostedgp.GetOperationCostScript(str(toolname), str(paramjson))
        except Exception as err:
            raise GPCloudExec("ReportCost failed", str(err))
        return

    def ProcessFileOutput(self, itemtype, filename):
        try:
            output = self._hostedgp.ProcessFileOutput(str(itemtype),
                                                      str(filename),
                                                      str(self.extent),
                                                      str(self.outputName.json))
        except Exception as err:
            raise GPCloudExec("ProcessFileOutput failed", str(err))
        return output

    def AddItem(self, parameters, properties=None):
        try:
            # check for type keyword parameter
            if properties is None:
                properties = {}
            return self._hostedgp.AddUpdateItem(str(""),
                                                str(json.dumps(parameters)),
                                                str(json.dumps(properties)))
        except Exception as err:
            raise GPCloudExec("AddItem failed", str(err))

    def UpdateItem(self, itemId, parameters, properties=None):
        try:
            if properties is None:
                properties = {}
            self._hostedgp.AddUpdateItem(str(itemId),
                                         str(json.dumps(parameters)),
                                         str(json.dumps(properties)))
        except Exception as err:
            raise GPCloudExec("UpdateItem for item %s failed" % (itemId),
                              str(err))

    def GetItem(self, itemId):
        try:
            x = self._hostedgp.GetItem(str(itemId))
            return json.loads(x)
        except Exception as err:
            y = str(err)
            raise GPCloudExec("GetItem for item %s failed" % (itemId), str(err))

    def GetItemDataAsFile(self, itemId, fileName):
        try:
            self._hostedgp.GetItemDataAsFile(str(itemId), str(fileName))
        except Exception as err:
            raise GPCloudExec("GetItemDataAsFile for item %s failed" % (itemId),
                              str(err))

    def GetItemDataAsJSON(self, itemId):
        try:
            jsonstr = self._hostedgp.GetItemDataAsJSON(str(itemId))
            return json.loads(jsonstr)
        except Exception as err:
            raise GPCloudExec("GetItemDataAsJSON for item %s failed" % (itemId),
                              str(err))

    def GetResourceAsFile(self, resourceKey, fileName, itemId=None):
        try:
            if itemId is None:
                itemId = ""
            self._hostedgp.GetResourceAsFile(str(resourceKey), str(fileName),
                                             str(itemId))
        except Exception as err:
            raise GPCloudExec(
                "GetResourceAsFile for key %s failed" % (resourceKey), str(err))

    def AddResource(self, parameters, props, itemId = None):
        try:
            if itemId is None:
                itemId = ""
            self._hostedgp.AddUpdateResource(str(itemId), str(json.dumps(parameters)), str(json.dumps(props)), 0)
        except Exception as err:
            raise GPCloudExec("AddResource failed", str(err))

    def UpdateResource(self, parameters, props, itemId = None):
        try:
            if itemId is None:
                itemId = ""
            self._hostedgp.AddUpdateResource(str(itemId), str(json.dumps(parameters)), str(json.dumps(props)), 1)
        except Exception as err:
            raise GPCloudExec("UpdateResource failed", str(err))


    def DeleteResource(self, resourcekey, deleteAll = False, itemId = None, props = None):
        try:
            deleteAllStr = "false"
            if itemId is None:
                itemId = ""
            if props is None:
                props = {}
            if deleteAll:
                deleteAllStr = "true"
            x = self._hostedgp.DeleteResource(str(resourcekey),str(deleteAllStr),itemId,str(json.dumps(props)))
            return json.loads(x)
        except Exception as err:
            raise GPCloudExec("DeleteResource failed", str(err))

    def GetResources(self, itemId, parameters):
        try:
            if parameters is None:
                parameters = {}
            if 'f' not in parameters:
                parameters['f'] = 'json'
            urlpath = "content/items/"
            urlpath = urlpath + itemId + "/resources"

            return self.GenericSharingRequest(urlpath, parameters)
        except Exception as err:
            raise GPCloudExec("GetResources failed",str(err))

    def GetPrivateUrl(self, url):
        try:
            return self._hostedgp.GetPrivateUrl(str(url))
        except Exception as err:
            raise GPCloudExec("GetPrivateUrl for url %s failed" % (url),
                              str(err))

    def GetItemStatus(self, itemId, properties=None):
        try:
            if properties is None:
                properties = {}
            x = self._hostedgp.GetItemStatus(str(itemId),
                                             str(json.dumps(properties)))
            return json.loads(x)
        except Exception as err:
            raise GPCloudExec("GetItemStatus for item %s failed" % (itemId),
                              str(err))

    def DeleteItem(self, itemId, properties=None):
        try:
            if properties is None:
                properties = {}
            x = self._hostedgp.DeleteItem(str(itemId),
                    str(json.dumps(properties)))
            return json.loads(x)
        except Exception as err:
            raise GPCloudExec("DeleteItem for item %s" % (itemId), str(err))

    def RefreshItem(self, itemId):
        try:
            self._hostedgp.RefreshItem(str(itemId))
        except Exception as err:
            raise GPCloudExec("RefreshItem for item %s" % (itemId), str(err))

    def GetFolderContent(self, folderId=None):
        try:
            if folderId is None:
                folderId = ""
            x = self._hostedgp.GetFolderContent(str(folderId))
            return json.loads(x)
        except Exception as err:
            raise GPCloudExec("GetFolderContent failed", str(err))

    def GenericSharingRequest(self, path, parameters=None):
        try:
            if parameters is None:
                parameters = {}
            x = self._hostedgp.GenericSharingRequest(str(path), str(
                json.dumps(parameters)))
            return json.loads(x)
        except Exception as err:
            raise GPCloudExec("GenericSharingRequest to %s failed" % (path),
                              str(err))

    def ImportDelta(self, replicaFile, deltaFile):
        try:
            self._hostedgp.ImportDelta(str(replicaFile), str(deltaFile))
        except Exception as err:
            raise GPCloudExec("ImportDelta failed", str(err))

    def EstimateExportTileLevels(self, service, options):
        try:
            return self._hostedgp.EstimateExportTileLevels(json.dumps(service),
                                                           json.dumps(options))
        except Exception as err:
            raise GPCloudExec("EstimateExportTileLevels failed", str(err))

import urllib.request, urllib.error
from urllib.parse import urlparse
import json
import arcpy

DISTANCE_UNITS = ["MILES", "YARDS", "FEET", "KILOMETERS", "METERS"]
TIME_UNITS = ["HOURS", "MINUTES", "SECONDS"]
POINT_BUFFER_TYPES = ["STRAIGHT_LINE", "DRIVING_DISTANCE",
                      "DRIVE_TIME", "TRUCKING_DISTANCE",
                      "TRUCKING_TIME", "WALKING_DISTANCE",
                      "WALKING_TIME"]
geoenrichURL = "https://geoenrich.arcgis.com/arcgis/rest/services/World/GeoenrichmentServer/Geoenrichment"
baseDataCollections = "{}/DataCollections".format(geoenrichURL)
countryService = "{}/Countries".format(geoenrichURL)


class ToolValidator(object):
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()

    def initializeParameters(self):
        """Refine the properties of a tool's parameters.  This method is
        called when the tool is opened."""
        try:
            self.params[1].parameterDependencies = [0]
            self.params[1].schema.clone = True
            self.params[8].enabled = False
            if not self.params[2].hasBeenValidated:
                token = arcpy.GetSigninToken()
                self.params[2].filter.list = getCountries(token)
        except:
            return

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""

        inlayer = self.params[0]
        outlayer = self.params[1]
        country = self.params[2]
        collection = self.params[3]
        variables = self.params[4]
        buffertype = self.params[5]
        distance = self.params[6]
        unit = self.params[7]
        shpType = ""

        if not inlayer.hasBeenValidated:
            try:
                desc = arcpy.Describe(inlayer)
                shpType = desc.shapeType.lower()
            except:
                return
            if shpType == "polygon":
                buffertype.enabled = False
                distance.enabled = False
                distance.value = ""
                unit.enabled = False
            else:
                buffertype.enabled = True
                distance.enabled = True
                unit.enabled = True
                if shpType == "polyline":
                    buffertype.value = "STRAIGHT_LINE"
                    buffertype.filter.list = ["STRAIGHT_LINE"]
                else:
                    buffertype.filter.list = POINT_BUFFER_TYPES
                    if buffertype.value and buffertype.value in POINT_BUFFER_TYPES:
                        pass
                    else:
                        buffertype.value = "STRAIGHT_LINE"

        if not buffertype.hasBeenValidated:
            if buffertype.value == "STRAIGHT_LINE" or "DISTANCE" in buffertype.value:
                unit.filter.list = DISTANCE_UNITS
                if not unit.value or unit.value not in DISTANCE_UNITS:
                    unit.value = "KILOMETERS"
            else:
                unit.filter.list = TIME_UNITS
                if not unit.value or unit.value not in TIME_UNITS:
                    unit.value = "MINUTES"

        if not country.hasBeenValidated and \
                (
                        not collection.hasBeenValidated or not variables.hasBeenValidated):
            # remove comment on return after debug
            return
            # pass

        # update datacollections based on country and store values in collectionstore
        if country.value and not country.hasBeenValidated:
            token = arcpy.GetSigninToken()
            if not token:
                return
            sortedDC = getDataCollections(country, token, self.params[8])
            collection.filter.list = sortedDC
            collection.value = sortedDC[0]

        # update variables based on datacollections stored in collection store
        collectionStore = self.params[8].value
        if collectionStore and not collection.hasBeenValidated:
            dataCollectionDict = json.loads(collectionStore)
            variableslist = dataCollectionDict[collection.value]
            variableslist.sort()
            variables.filter.list = variableslist

        # output schema
        if inlayer.value and outlayer.value:
            if not shpType:
                try:
                    shpType = arcpy.Describe(inlayer).shapeType.lower()
                except:
                    return
            self.params[1].schema.additionalFields = updateOutSchema(shpType,
                                                                     variables)

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        try:
            self.params[2].clearMessage()
            self.params[3].clearMessage()
            self.params[4].clearMessage()
            invalidOrgs = ["devext.arcgis.com", "qaext.arcgis.com"]
            activeUrl = urlparse(arcpy.GetActivePortalURL())
            activeUrlHostName = activeUrl.hostname.lower()
            if not activeUrl or ("arcgis.com" not in activeUrlHostName) or (
                    activeUrlHostName in invalidOrgs):
                self.params[0].setIDMessage("ERROR", 1738)
            else:
                self.params[0].clearMessage()

        except:
            return


########## Helper Methods ############

def getCountries(token):
    """ gets all the countries"""

    countryURL = "{}?f=pjson&token={}".format(countryService, token["token"])
    headers = {"referer": token["referer"]}
    countryRequest = urllib.request.Request(countryURL, headers=headers)
    countryJson = getResponse(countryRequest, "Get countries")
    countries = ["{} ({})".format(country["name"], country["id"]) for country in
                 countryJson]
    countries.sort()
    countries.insert(0, "Global")
    countries.insert(1, "United States (US)")
    return countries


def getDataCollections(country, token, dcStore):
    """gets all the datacollections for the given country"""

    if country.value.lower() != "global":
        dataCollectionsUrl = "{}/{}".format(baseDataCollections,
                                            country.value[-3:-1])
    else:
        dataCollectionsUrl = baseDataCollections
    params = {"token": token["token"], "outFields": ["id", "alias"],
              "f": "json"}
    headers = {"referer": token["referer"]}
    req = urllib.request.Request(dataCollectionsUrl, headers=headers)
    dataCollections = getResponse(req, "DataCollections", params)
    if not dataCollections:
        return None
    dataCollectionDict = {}
    for dataCollection in dataCollections["DataCollections"]:
        dcID = dataCollection["dataCollectionID"]
        dcKey = "{} ({})".format(dataCollection["metadata"]["title"], dcID)
        aliases = []
        for var in dataCollection["data"]:
            var["alias"] = var["alias"].replace("\'", "")
            aliases.append("{} ({}.{})".format(var["alias"], dcID, var["id"]))
        dataCollectionDict[dcKey] = aliases
        dcStore.value = json.dumps(dataCollectionDict)
    dcs = list(dataCollectionDict.keys())
    dcsorted = sorted(dcs)
    keyFactsPos = [i for i, dc in enumerate(dcsorted) if dc.startswith("Key")]
    if keyFactsPos:
        keyFactsPos.reverse()
        keyFactsDC = [dcsorted.pop(i) for i in keyFactsPos]
        if dcsorted:
            dcsorted = keyFactsDC + dcsorted
        else:
            dcsorted = keyFactsDC
    return dcsorted


def updateOutSchema(shpType, variables):
    """ update output schema """

    outfcList = []
    if "point" in shpType or shpType == "polyline":
        newField = arcpy.Field()
        newField.type, newField.name, newField.aliasName = "TEXT", "areaType", "areaType"
        outfcList.append(newField)
        newField = arcpy.Field()
        newField.type, newField.name, newField.aliasName = "DOUBLE", "bufferRadii", "bufferRadii"
        outfcList.append(newField)
        newField = arcpy.Field()
        newField.type, newField.name, newField.aliasName = "TEXT", "bufferUnits", "bufferUnits"
        outfcList.append(newField)
        newField = arcpy.Field()
        newField.type, newField.name, newField.aliasName = "TEXT", "bufferUnitsAlias", "bufferUnitsAlias"
        outfcList.append(newField)
    newField = arcpy.Field()
    newField.type, newField.name, newField.aliasName = "TEXT", "ID", "ID"
    outfcList.append(newField)
    newField = arcpy.Field()
    newField.type, newField.name, newField.aliasName = "LONG", "ORIG_ID", "ORIG_ID"
    outfcList.append(newField)
    newField = arcpy.Field()
    newField.type, newField.name, newField.aliasName = "TEXT", "sourceCountry", "sourceCountry"
    outfcList.append(newField)
    newField = arcpy.Field()
    newField.type, newField.name, newField.aliasName = "LONG", "HasData", "HasData"
    outfcList.append(newField)

    # variables
    if variables.values:
        for variable in variables.values:
            newField = arcpy.Field()
            newField.type, newField.name, newField.aliasName = "DOUBLE", variable[
                                                                         variable.rfind(
                                                                             ".") + 1:-1], variable[
                                                                                           :variable.rfind(
                                                                                               "(") - 1]
            outfcList.append(newField)

    return outfcList


def getResponse(req, reqName, reqParams=None):
    """ get response for given request,
    reqName is simple string to represent request failure
    reqParams dictionary of params and values optional"""

    if reqParams:
        queryParams = urllib.parse.urlencode(reqParams).encode('utf-8')
        resp = urllib.request.urlopen(req, queryParams)
    else:
        resp = urllib.request.urlopen(req)
    respContent = resp.read().decode('utf-8')
    if respContent:
        if "error" in respContent:
            msg = "{} request failure. {}".format(reqName, respContent)
            raise Exception(msg)
        else:
            return json.loads(respContent)
    return None

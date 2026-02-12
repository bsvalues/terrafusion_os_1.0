import os
import sys
import winreg
import datetime
import IndoorsUtilsModule

class LicenseError(Exception):
    pass

class overwriteError(Exception):
    pass
class CreateIndoorsDatabase(object):

    def __init__(self):
        self.AIIM = "AIIM"
        self.INDOORS = "Indoors"
        self.NETWORK = "Network"
        self.PRELIMNETWORK = "PrelimNetwork"

        self.AREA_POLYGONS_FCNAME = "AreaPolygons"
        self.DETAILS_FCNAME = "Details"
        self.EVENTS_FCNAME = "Events"
        self.FACILITIES_FCNAME = "Facilities"
        self.LEVELS_FCNAME = "Levels"
        self.OCCUPANTS_FCNAME = "Occupants"
        self.RESERVATIONS_FCNAME = "Reservations"
        self.SECTIONS_FCNAME = "Sections"
        self.SITES_FCNAME = "Sites"
        self.TRACKING_ZONES_FCNAME = "TrackingZones"
        self.UNITS_FCNAME = "Units"
        self.ZONES_FCNAME = "Zones"

        self.POINT_ERRORS_FCNAME = "GDB_ValidationPointErrors"
        self.LINE_ERRORS_FCNAME = "GDB_ValidationLineErrors"
        self.POLYGON_ERRORS_FCNAME = "GDB_ValidationPolygonErrors"
        self.VALIDATION_OBJECT_TABLENAME = "GDB_ValidationObjectErrors"
        self.LEVEL_ID = "LEVEL_ID"
        self.LEVEL_ID_ALIAS = "Level ID"

        self.CREATED_USER = "CREATED_USER"
        self.CREATED_USER_ALIAS = "Created User"
        self.CREATED_DATE = "CREATED_DATE"
        self.CREATED_DATE_ALIAS = "Created Date"
        self.LAST_EDITED_USER = "LAST_EDITED_USER"
        self.LAST_EDITED_USER_ALIAS = "Last Edited User"
        self.LAST_EDITED_DATE = "LAST_EDITED_DATE"
        self.LAST_EDITED_DATE_ALIAS = "Last Edited Date"

        # locale comes from registry, but may not be set.
        # fallback to using values from GetLocaleInfo()
        # although that function isn't reliable running standalone
        self._proLocale = ""
        self._languageCode = ""
        self._countryCode = ""

        self.execute()

    def ERROR(self):
        pass

    def FUNCTIONERROR(self, msg_prefix, e = None):
        try:
            arcpy.AddError(msg_prefix)
        except arcpy.ExecuteError:
            s = arcpy.GetMessages()
            arcpy.AddError(s)
        except Exception as e:
            pass
        finally:
            sys.exit(0)

    def isIndoorsGdbEmpty(self, inWorkspace):
            fcAllIndoors = ["details", "events","facilities","reservations", "levels", "sections", "sites", "trackingzones", "units", "zones"]
            #suport for 2.8
            fcAllIndoorsNoReservation = ["details", "events","facilities", "levels", "sections", "sites", "trackingzones", "units", "zones"]
            fcAllIndoorsNetwork = ["transitions", "landmarks", "pathways", "prelimpathways", "prelimtransitions"]
            # fcAllNetwork = ["landmarks", "transitions", "pathways"]
            # fcAllPrelimNetwork = [ "prelimtransitions", "prelimpathways"]
            indoorsDataStatus = {"aiim" : False, "indoors" : False, "indoorsPartial" : False,  "prelimNetwork" : False, "network" : False, "area" : False, "config" : False, "partialNetwork": False, "areaRoles" : False}
            tempWorkspace = arcpy.env.workspace

            try:
                arcpy.env.workspace = inWorkspace
                sdeQualifier = IndoorsUtilsModule.getSDEQualifier(inWorkspace)
                descWorkspace = arcpy.Describe(inWorkspace)
                if descWorkspace.workspaceType =='RemoteDatabase' and sdeQualifier is None:
                    return indoorsDataStatus #sdequalifier is None if no dataset was found in remote database
                if not sdeQualifier or len(sdeQualifier) == 0:
                    sdeQualifier = ""
                aiimDataset = os.path.join(inWorkspace, sdeQualifier + self.AIIM)
                indoorsDataset = os.path.join(inWorkspace, sdeQualifier + self.INDOORS)
                networkDataset = os.path.join(inWorkspace, sdeQualifier + self.NETWORK)
                prelimNetworkDataset = os.path.join(inWorkspace, sdeQualifier + self.PRELIMNETWORK)
                areaTable = os.path.join(inWorkspace, sdeQualifier + "Areas")
                configTable  = os.path.join(inWorkspace, sdeQualifier + "IndoorsConfig")
                areaRolesTable = os.path.join(inWorkspace, sdeQualifier + "AreaRoles")
                if arcpy.Exists(aiimDataset):
                    indoorsDataStatus["aiim"] = True
                if arcpy.Exists(indoorsDataset):
                    indoorsDataStatus["indoors"] = True
                if arcpy.Exists(networkDataset):
                    indoorsDataStatus["network"] = True
                if arcpy.Exists(prelimNetworkDataset):
                    indoorsDataStatus["prelimNetwork"] = True
                if arcpy.Exists(areaTable):
                    indoorsDataStatus["area"] = True
                if arcpy.Exists(configTable):
                    indoorsDataStatus["config"] = True
                if arcpy.Exists(areaRolesTable):
                    indoorsDataStatus["areaRoles"] = True
                fcsIndoors = []
                fcsIndoorsNetwork = []
                for fds in arcpy.ListDatasets('', 'feature'):
                    for fc in arcpy.ListFeatureClasses('', 'All', fds):
                        fcNameArr = fc.split('.')
                        fcName = fcNameArr[-1]
                        if fcName.lower() in fcAllIndoors:
                            fcsIndoors.append(fc)
                        if fcName.lower() in fcAllIndoorsNetwork:
                            fcsIndoorsNetwork.append(fc)

                #check if fc's exist outside of the fds
                if len(fcsIndoors) == 0 or len(fcsIndoorsNetwork):
                    featureclasses = arcpy.ListFeatureClasses()
                    for fc in featureclasses:
                        fcNameArr = fc.split('.')
                        fcName = fcNameArr[-1]
                        if fcName.lower() in fcAllIndoors:
                            fcsIndoors.append(fc)
                        if fcName.lower() in fcAllIndoorsNetwork:
                            fcsIndoorsNetwork.append(fc)
                if len(fcsIndoors) > 0 and len(fcsIndoors) != len(fcAllIndoors) and len(fcsIndoors) != len(fcAllIndoorsNoReservation):
                    indoorsDataStatus["indoorsPartial"] = True

                if len(fcsIndoorsNetwork) > 0 and len(fcsIndoorsNetwork) != len(fcAllIndoorsNetwork):
                    indoorsDataStatus["partialNetwork"] = True

            except Exception as e:
                arcpy.AddIDMessage("ERROR", 999998)
                arcpy.AddError("{0}".format(e))
            finally:
                arcpy.env.workspace = tempWorkspace
                return indoorsDataStatus
            return

    def execute(self):
        try:
            # license check
            minimum_standard_license = ["ArcEditor", "ArcInfo", "ArcServer"]
            if arcpy.ProductInfo() not in minimum_standard_license:
                raise LicenseError
            
            AIIMGDB = arcpy.GetParameterAsText(0)
            addCampusNetwork = arcpy.GetParameter(2)
            addAttributeRules = arcpy.GetParameter(4)
            coordinate_sys = arcpy.GetParameterAsText(3)
            if coordinate_sys:
                output_cs = arcpy.SpatialReference()
                output_cs.loadFromString(coordinate_sys)
                coordinate_sys = output_cs

            indoorsDataStatus = self.isIndoorsGdbEmpty(AIIMGDB)
            if indoorsDataStatus["aiim"]:
                if addCampusNetwork:
                    arcpy.AddIDMessage("ERROR", 180032)
                    return
                else:
                    arcpy.AddIDMessage("ERROR", 180031)
                    return
            if indoorsDataStatus["indoors"] and indoorsDataStatus["network"]:
                #If both indoors and network dataset exists, return
                arcpy.AddIDMessage("ERROR", 180031)
                return

            if indoorsDataStatus["indoorsPartial"] or indoorsDataStatus["partialNetwork"]:
                arcpy.AddIDMessage("ERROR", 180031)
                return

            if indoorsDataStatus["indoors"] and indoorsDataStatus["indoorsPartial"] == False and indoorsDataStatus["network"] == True:
                arcpy.AddIDMessage("ERROR", 12, "Indoors")
                return

            if addCampusNetwork and indoorsDataStatus["partialNetwork"]:
                arcpy.AddIDMessage("ERROR", 180031)
                return

            # if database is EGDB, it has to be branch versioned to add calculation and validation attribute rules
            if addAttributeRules and AIIMGDB.lower().endswith(".sde"):
                descWorkspace = arcpy.Describe(AIIMGDB)
                if descWorkspace.workspaceType =='RemoteDatabase':

                    # should only have the branch property if the database is branch versioned
                    # https://pro.arcgis.com/en/pro-app/latest/arcpy/functions/workspace-properties.htm
                    #   Only one of historical_name, historical_timestamp, version, or branch exists for any given workspace.
                    if hasattr(descWorkspace.connectionProperties,'branch') == False:
                        # 180040 = Enterprise Geodatabase must use branch versioning in order to add Attribute Rules.
                        arcpy.AddIDMessage("ERROR", 180040)
                        return
                
            if coordinate_sys:
                today = datetime.date.today()
                today_stamp = '{:%Y_%m_%d}'.format(today)
                now = datetime.datetime.now()
                now_stamp = '{:%Y_%m_%d_%H%M%S}'.format(now)
                templateGDBName = "Indoors_Template_" + now_stamp
                templateGDB = os.path.join(arcpy.env.scratchFolder, templateGDBName + ".gdb")
                arcpy.CreateFileGDB_management(arcpy.env.scratchFolder, templateGDBName, "CURRENT")
                AIIMGDB = templateGDB

            scriptdir_path = os.path.realpath(os.path.join(os.getcwd(), os.path.dirname(__file__)))
            arctoolbox_path = os.path.abspath(os.path.join(scriptdir_path, os.pardir))
            resources_path = os.path.abspath(os.path.join(arctoolbox_path, os.pardir))
            location = os.path.join(resources_path,"Indoors")
            aiimXml = os.path.join(os.path.join(location, 'Schema'), 'INDOORS.xml')
            networkXml = os.path.join(os.path.join(location, 'Schema'), 'NETWORK.xml')
            prelimNetworkXml = os.path.join(os.path.join(location, 'Schema'), 'PRELIMNETWORK.xml')
            areasXml = os.path.join(os.path.join(location, 'Schema'), 'AREAS.xml')
            indoorsConfigXml = os.path.join(os.path.join(location, 'Schema'), 'INDOORSCONFIG.xml')
            areaRolesXml = os.path.join(os.path.join(location, 'Schema'), 'AREAROLES.xml')
            sdeQualifier = IndoorsUtilsModule.getSDEQualifier(AIIMGDB)
            if sdeQualifier is None:
                sdeQualifier = ""

            targetIndoorGDB = os.path.join(arcpy.GetParameterAsText(0), sdeQualifier + "Indoors")
            targetNetworkGDB = os.path.join(arcpy.GetParameterAsText(0), sdeQualifier + "Network")
            targetPrelimGDB = os.path.join(arcpy.GetParameterAsText(0), sdeQualifier + "PrelimNetwork")

            if (arcpy.Exists(aiimXml) == False or arcpy.Exists(indoorsConfigXml) == False or
                arcpy.Exists(networkXml) == False or arcpy.Exists(prelimNetworkXml) == False or
                arcpy.Exists(areasXml) == False or arcpy.Exists(areaRolesXml) == False):
                arcpy.AddIDMessage("ERROR", 180026)
                return

            # before starting the real work, get locale information needed for getting correct
            # paths for importing attribute rules

            # using GetLocaleInfo() functions isn't working for standalone scripts.
            # so we'll go directly to the Windows registry to get the locale setting.
            # note that the registry setting may not be there, so put in try/except
            # and use default en-US if not there
            self._proLocale = ""
            try:
                with winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"SOFTWARE\ESRI") as key:
                    self._proLocale = winreg.QueryValueEx(key, "ARCGISPRO_UILANGID")[0] 
            except:
                self._proLocale = ""

            self._languageCode = arcpy.gp._gp.GetLocaleInfo()['languagecode']
            self._countryCode = arcpy.gp._gp.GetLocaleInfo()['countrycode']

            #Backward compatibility where user created AIIM dataset without network
            if not indoorsDataStatus['indoors'] and not indoorsDataStatus['network']:
                if coordinate_sys == "" or coordinate_sys is None:
                    arcpy.AddIDMessage("INFORMATIVE", 180027)
                arcpy.ImportXMLWorkspaceDocument_management(AIIMGDB, aiimXml, "DATA", None)
                if addAttributeRules and (coordinate_sys == "" or coordinate_sys is None):
                    self.addEditorTrackingAndGlobalIdFields();
                    self.importAttributeRules(resources_path)
                    self.addLevelIDFieldToErrorTables()
                if addCampusNetwork:
                    if coordinate_sys == "" or coordinate_sys is None:
                        arcpy.AddIDMessage("INFORMATIVE", 180028)
                    arcpy.ImportXMLWorkspaceDocument_management(AIIMGDB, networkXml, "DATA", None)
                    arcpy.ImportXMLWorkspaceDocument_management(AIIMGDB, prelimNetworkXml, "DATA", None)
            elif indoorsDataStatus['indoors'] and not indoorsDataStatus['network']:
                #The indoors GDB has feature classes. Check if the user checked Create Network option.
                # If yes, and the network dataset does not exist, create it.
                if addCampusNetwork:
                    sr = arcpy.Describe(targetIndoorGDB).spatialReference
                    if coordinate_sys == "" or coordinate_sys is None:
                        if sr.name != "WGS_1984_Web_Mercator_Auxiliary_Sphere":
                            arcpy.AddIDMessage("ERROR", 180034)
                            return
                        arcpy.AddIDMessage("INFORMATIVE", 180028)
                    else:
                        if sr.name.lower() == "unknown" or sr.name != coordinate_sys.name or sr.VCS.name != coordinate_sys.VCS.name:
                            arcpy.AddIDMessage("ERROR", 180033)
                            return
                    arcpy.ImportXMLWorkspaceDocument_management(AIIMGDB, networkXml, "DATA", None)
                    arcpy.ImportXMLWorkspaceDocument_management(AIIMGDB, prelimNetworkXml, "DATA", None)
                else:
                    arcpy.AddIDMessage("ERROR", 180035)
                    return
            elif not indoorsDataStatus['indoors'] and indoorsDataStatus['network']:
                sr = arcpy.Describe(targetNetworkGDB).spatialReference
                if coordinate_sys == "" or coordinate_sys is None:
                    if sr.name != "WGS_1984_Web_Mercator_Auxiliary_Sphere":
                        arcpy.AddIDMessage("ERROR", 180034)
                        return
                    arcpy.AddIDMessage("INFORMATIVE", 180027)
                else:
                    if sr.name.lower() == "unknown" or sr.name != coordinate_sys.name or sr.VCS.name != coordinate_sys.VCS.name:
                        arcpy.AddIDMessage("ERROR", 180033)
                        return

                arcpy.ImportXMLWorkspaceDocument_management(AIIMGDB, aiimXml, "DATA", None)
                if addAttributeRules and (coordinate_sys == "" or coordinate_sys is None):
                    self.addEditorTrackingAndGlobalIdFields();
                    self.importAttributeRules(resources_path)
                    self.addLevelIDFieldToErrorTables()
            #we have the scratch template created.
            if coordinate_sys:
                if not indoorsDataStatus['indoors']:
                    if indoorsDataStatus['network']:
                        sr = arcpy.Describe(targetNetworkGDB).spatialReference
                        if sr.name.lower() == "unknown" or sr.name != coordinate_sys.name or sr.VCS.name != coordinate_sys.VCS.name:
                            arcpy.AddIDMessage("ERROR", 180033)
                            return

                    arcpy.AddIDMessage("INFORMATIVE", 180027)
                    indoorDataset = os.path.join(templateGDB, "Indoors")
                    #outputDataset = os.path.join(templateGDB, "IndoorsProjected")
                    arcpy.Project_management(indoorDataset, targetIndoorGDB, coordinate_sys)
                    if addAttributeRules:
                        self.addEditorTrackingAndGlobalIdFields();
                        self.importAttributeRules(resources_path)
                        self.addLevelIDFieldToErrorTables()
                if not indoorsDataStatus['network'] and addCampusNetwork == True:
                    if arcpy.Exists(targetIndoorGDB):
                        sr = arcpy.Describe(targetIndoorGDB).spatialReference
                        if sr.name.lower() == "unknown" or sr.name != coordinate_sys.name or sr.VCS.name != coordinate_sys.VCS.name:
                            arcpy.AddIDMessage("ERROR", 180033)
                            return

                    arcpy.AddIDMessage("INFORMATIVE", 180028)
                    indoorNetworkDataset = os.path.join(templateGDB, "Network")
                    indoorPrelimNetworkDataset = os.path.join(templateGDB, "PrelimNetwork")
                    arcpy.Project_management(indoorNetworkDataset, targetNetworkGDB, coordinate_sys)
                    arcpy.Project_management(indoorPrelimNetworkDataset, targetPrelimGDB, coordinate_sys)
                
                #clean up template
                arcpy.Delete_management(AIIMGDB)

            targetGDB = arcpy.GetParameterAsText(0)

            if not indoorsDataStatus['area']:
                arcpy.AddIDMessage("INFORMATIVE", 180029)
                arcpy.ImportXMLWorkspaceDocument_management(targetGDB, areasXml, "DATA", None)
            if not indoorsDataStatus['areaRoles']:
                arcpy.AddIDMessage("INFORMATIVE", 180036)
                arcpy.ImportXMLWorkspaceDocument_management(targetGDB, areaRolesXml, "DATA", None)
            if not indoorsDataStatus['config']:
                arcpy.AddIDMessage("INFORMATIVE", 180030)
                arcpy.ImportXMLWorkspaceDocument_management(targetGDB, indoorsConfigXml, "DATA", None)

            # add domains needed for adding equipment fields
            if not indoorsDataStatus['indoors']:
                desc = arcpy.Describe(targetGDB)
                self.importRequiredAttributeRules(resources_path)
                if "DOM_EQUIPMENT" not in desc.domains:
                    arcpy.management.CreateDomain(targetGDB, "DOM_EQUIPMENT", "Equipment applicable to an office hotel or meeting room", "LONG", "CODED", "DEFAULT", "DEFAULT")
                    arcpy.AddCodedValueToDomain_management(targetGDB, "DOM_EQUIPMENT", 0, "No")
                    arcpy.AddCodedValueToDomain_management(targetGDB, "DOM_EQUIPMENT", 1, "Yes")

                if "DOM_EQUIPMENT_HOTEL" not in desc.domains:
                    arcpy.management.CreateDomain(targetGDB, "DOM_EQUIPMENT_HOTEL", "Equipment applicable only to an office hotel", "LONG", "CODED", "DEFAULT", "DEFAULT")
                    arcpy.AddCodedValueToDomain_management(targetGDB, "DOM_EQUIPMENT_HOTEL", 0, "No")
                    arcpy.AddCodedValueToDomain_management(targetGDB, "DOM_EQUIPMENT_HOTEL", 1, "Yes")

                if "DOM_EQUIPMENT_MEETING" not in desc.domains:
                    arcpy.management.CreateDomain(targetGDB, "DOM_EQUIPMENT_MEETING", "Equipment applicable only to a meeting room", "LONG", "CODED", "DEFAULT", "DEFAULT")
                    arcpy.AddCodedValueToDomain_management(targetGDB, "DOM_EQUIPMENT_MEETING", 0, "No")
                    arcpy.AddCodedValueToDomain_management(targetGDB, "DOM_EQUIPMENT_MEETING", 1, "Yes")

        except LicenseError:
            # You must have at least the Standard License to run this tool.
            arcpy.AddIDMessage("ERROR", 180001)
        except Exception as e:
            arcpy.AddIDMessage("ERROR", 999998)
            arcpy.AddError("{0}".format(e))
        finally:
            arcpy.CheckInExtension("Indoors")
        return

    def importAttributeRules(self, resourcesPath):
        try:
            targetGDB = arcpy.GetParameterAsText(0)
            sdeQualifier = IndoorsUtilsModule.getSDEQualifier(targetGDB)
            if sdeQualifier is None:
                sdeQualifier = ""

            targetIndoorsDataset = os.path.join(targetGDB, sdeQualifier + "Indoors")            

            sitesPath = os.path.join(targetIndoorsDataset, sdeQualifier + self.SITES_FCNAME)
            facilitiesPath = os.path.join(targetIndoorsDataset, sdeQualifier + self.FACILITIES_FCNAME)
            levelsPath = os.path.join(targetIndoorsDataset, sdeQualifier + self.LEVELS_FCNAME)
            unitsPath = os.path.join(targetIndoorsDataset, sdeQualifier + self.UNITS_FCNAME)
            detailsPath = os.path.join(targetIndoorsDataset, sdeQualifier + self.DETAILS_FCNAME)

            baseIndoorAttributeRulePath = os.path.join(resourcesPath,"AttributeRules\Indoors")

            arcpy.AddIDMessage("INFORMATIVE", 180037)
            arcpy.SetProgressorLabel(arcpy.GetIDMessage(180037))            

            self.doImportAttributeRules(sitesPath, baseIndoorAttributeRulePath, (self.SITES_FCNAME + ".csv"))
            self.doImportAttributeRules(facilitiesPath, baseIndoorAttributeRulePath, (self.FACILITIES_FCNAME+ ".csv"))
            self.doImportAttributeRules(levelsPath, baseIndoorAttributeRulePath, (self.LEVELS_FCNAME+ ".csv"))
            self.doImportAttributeRules(unitsPath, baseIndoorAttributeRulePath, (self.UNITS_FCNAME+ ".csv"))
            self.doImportAttributeRules(detailsPath, baseIndoorAttributeRulePath, (self.DETAILS_FCNAME+ ".csv"))
        except Exception as e:
            arcpy.AddMessage(str(e))
            return None

    def doImportAttributeRules(self, featureClassPath, baseIndoorAttributeRulePath, csvFilename):
        try:
            # if able to get locale information from registry, use that
            useRegistryValue = False
            if self._proLocale != "":
                localeIndoorAttributeRulePath = os.path.join(baseIndoorAttributeRulePath, self._proLocale)
                localizedFile = os.path.join(localeIndoorAttributeRulePath, csvFilename)
                if os.path.isfile(localizedFile):
                    arcpy.management.ImportAttributeRules(featureClassPath, localizedFile)
                    useRegistryValue = True

            if useRegistryValue == False:

                # if no registry entry, see if we can get match for values from languagecode-countrycode.
                # try most specific first - language plus the country
                languageAndCountry = self._languageCode + "-" + self._countryCode
                localeIndoorAttributeRulePath = os.path.join(baseIndoorAttributeRulePath, languageAndCountry)
                localizedFile = os.path.join(localeIndoorAttributeRulePath, csvFilename)
                if os.path.isfile(localizedFile):
                    arcpy.management.ImportAttributeRules(featureClassPath, localizedFile)

                else:

                    # don't have country-specific file.  try for just the language...
                    localeIndoorAttributeRulePath = os.path.join(baseIndoorAttributeRulePath, self._languageCode)
                    localizedFile = os.path.join(localeIndoorAttributeRulePath, csvFilename)
                    if os.path.isfile(localizedFile):
                        arcpy.management.ImportAttributeRules(featureClassPath, localizedFile)

                    # no matching localized file - try for Pro default of American English 
                    elif self._languageCode.lower() != "en" and self._countryCode.lower() != "us":
                        localeIndoorAttributeRulePath = os.path.join(baseIndoorAttributeRulePath,"en-US")
                        localizedFile = os.path.join(localeIndoorAttributeRulePath, csvFilename)
                        if os.path.isfile(localizedFile):
                            arcpy.management.ImportAttributeRules(featureClassPath, localizedFile)

        except Exception as e:
            arcpy.AddMessage(str(e))
            return None

    def importRequiredAttributeRules(self, resourcesPath):
        try:

            targetGDB = arcpy.GetParameterAsText(0)
            sdeQualifier = IndoorsUtilsModule.getSDEQualifier(targetGDB)
            if sdeQualifier is None:
                sdeQualifier = ""

            targetIndoorsDataset = os.path.join(targetGDB, sdeQualifier + "Indoors")            

            reservationsPath = os.path.join(targetIndoorsDataset, sdeQualifier + self.RESERVATIONS_FCNAME)
            if (not arcpy.Exists(reservationsPath)):
              return;

            # check if the rule already exists
            desc = arcpy.Describe(reservationsPath)
            if hasattr(desc, "attributeRules"):
                attributeRules = arcpy.Describe(reservationsPath).attributeRules
                for attributeRule in attributeRules:
                    if "Constraint" in attributeRule.type:
                        if (attributeRule.name.lower() == "reservation editing access control"):
                            return

            # "Creating security constraint rule for %s..."
            msg = arcpy.GetIDMessage(180041).replace("%s", self.RESERVATIONS_FCNAME)
            arcpy.AddMessage(msg)
            arcpy.SetProgressorLabel(msg)

            # add global id if not already there
            allFields = arcpy.ListFields(reservationsPath)

            hasGlobalIdFields = [f.name for f in allFields
                                 if f.type.lower() == "globalid"]
            if (hasGlobalIdFields == "" or len(hasGlobalIdFields) == 0):
                arcpy.management.AddGlobalIDs(reservationsPath)

            # add editor tracking fields if not already there
            editorTrackingFieldNamesLower = [self.CREATED_USER.lower(), self.CREATED_DATE.lower(), 
                                             self.LAST_EDITED_USER.lower(), self.LAST_EDITED_DATE.lower()]
            hasEditorTrackingFields = [f.name for f in allFields
                                       if f.name.lower() in editorTrackingFieldNamesLower]
            if (hasEditorTrackingFields == "" or len(hasEditorTrackingFields) == 0):

                # because we want to use custom names and aliases, creating fields manually, then enable editor tracking with those fields
                arcpy.AddField_management(reservationsPath, self.CREATED_USER, "TEXT", None, None, None, self.CREATED_USER_ALIAS, "NULLABLE", "NON_REQUIRED", None)
                arcpy.AddField_management(reservationsPath, self.CREATED_DATE, "DATE", None, None, None, self.CREATED_DATE_ALIAS, "NULLABLE", "NON_REQUIRED", None)
                arcpy.AddField_management(reservationsPath, self.LAST_EDITED_USER, "TEXT", None, None, None, self.LAST_EDITED_USER_ALIAS, "NULLABLE", "NON_REQUIRED", None)
                arcpy.AddField_management(reservationsPath, self.LAST_EDITED_DATE, "DATE", None, None, None, self.LAST_EDITED_DATE_ALIAS, "NULLABLE", "NON_REQUIRED", None)
                arcpy.EnableEditorTracking_management(reservationsPath, self.CREATED_USER, self.CREATED_DATE, self.LAST_EDITED_USER, self.LAST_EDITED_DATE)


            # final step will be to import the constraint attribute rules for reservations
            baseIndoorAttributeRulePath = os.path.join(resourcesPath,"AttributeRules\Indoors")

            self.doImportAttributeRules(reservationsPath, baseIndoorAttributeRulePath, (self.RESERVATIONS_FCNAME + ".csv"))
        except Exception as e:
            arcpy.AddError(str(e))
            return None

    def addLevelIDFieldToErrorTables(self):
        try:
            # Adding Level ID field to GDB Validation Error tables...
            arcpy.AddIDMessage("INFORMATIVE", 180038)

            targetGDB = arcpy.GetParameterAsText(0)
            sdeQualifier = IndoorsUtilsModule.getSDEQualifier(targetGDB)
            if sdeQualifier is None:
                sdeQualifier = ""

            pointErrorsPath = os.path.join(targetGDB, sdeQualifier + self.POINT_ERRORS_FCNAME)
            lineErrorsPath = os.path.join(targetGDB, sdeQualifier + self.LINE_ERRORS_FCNAME)
            polygonErrorsPath = os.path.join(targetGDB, sdeQualifier + self.POLYGON_ERRORS_FCNAME)
            objectErrorsPath = os.path.join(targetGDB, sdeQualifier + self.VALIDATION_OBJECT_TABLENAME)

            arcpy.AddField_management(pointErrorsPath, self.LEVEL_ID, "TEXT", None, None, None, self.LEVEL_ID_ALIAS, "NULLABLE", "NON_REQUIRED", None)
            arcpy.AddField_management(lineErrorsPath, self.LEVEL_ID, "TEXT", None, None, None, self.LEVEL_ID_ALIAS, "NULLABLE", "NON_REQUIRED", None)
            arcpy.AddField_management(polygonErrorsPath, self.LEVEL_ID, "TEXT", None, None, None, self.LEVEL_ID_ALIAS, "NULLABLE", "NON_REQUIRED", None)
            arcpy.AddField_management(objectErrorsPath, self.LEVEL_ID, "TEXT", None, None, None, self.LEVEL_ID_ALIAS, "NULLABLE", "NON_REQUIRED", None)

        except Exception as e:
            # Unable to add Level ID field to GDB Validation Error tables.
            arcpy.AddIDMessage("ERROR", 180039)
            arcpy.AddMessage(str(e))
            return None

    def addEditorTrackingAndGlobalIdFields(self):
        try:
            targetGDB = arcpy.GetParameterAsText(0)
            sdeQualifier = IndoorsUtilsModule.getSDEQualifier(targetGDB)
            if sdeQualifier is None:
                sdeQualifier = ""

            targetIndoorsDataset = os.path.join(targetGDB, sdeQualifier + "Indoors")            

            # Creating editor tracking fields...
            arcpy.AddIDMessage("INFORMATIVE", 180042)

            # not adding for Reservations here as that FC will always get editor tracking, globalid, and attribute rules
            # added via call to importRequiredAttributeRules()
            featureClassNames = [self.DETAILS_FCNAME, self.EVENTS_FCNAME, self.FACILITIES_FCNAME, self.LEVELS_FCNAME, self.OCCUPANTS_FCNAME, self.SECTIONS_FCNAME, self.SITES_FCNAME, self.TRACKING_ZONES_FCNAME, self.UNITS_FCNAME, self.ZONES_FCNAME]
            for fcName in featureClassNames:
                fcPath = os.path.join(targetIndoorsDataset, sdeQualifier + fcName)

                # Creating editor tracking fields for %s...
                msg = arcpy.GetIDMessage(180043).replace("%s", fcName)
                arcpy.SetProgressorLabel(msg)

                # because we want to use custom names *and* aliases, creating fields manually, then enable editor tracking with those fields
                trackingFields = [[self.CREATED_USER, "TEXT", self.CREATED_USER_ALIAS],
                                  [self.CREATED_DATE, "DATE", self.CREATED_DATE_ALIAS],
                                  [self.LAST_EDITED_USER, "TEXT", self.LAST_EDITED_USER_ALIAS],
                                  [self.LAST_EDITED_DATE, "DATE", self.LAST_EDITED_DATE_ALIAS]]
                arcpy.AddFields_management(fcPath, trackingFields)

                arcpy.EnableEditorTracking_management(fcPath, self.CREATED_USER, self.CREATED_DATE, self.LAST_EDITED_USER, self.LAST_EDITED_DATE)
                
                arcpy.AddGlobalIDs_management(fcPath)

        except Exception as e:
            arcpy.AddMessage(str(e))
            return None


if __name__ == '__main__':
    CreateIndoorsDatabase()

import os
import arcpy

class ToolValidator:
    def __init__(self):
        self.params = arcpy.GetParameterInfo()

    def initializeParameters(self):
        """Refine the properties of a tool's parameters.  This method is
        called when the tool is opened."""
        return

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        # analysis type validation
        if not self.params[4].valueAsText:
            self.params[4].value = "AREA_VOLUME"

        if not self.params[7].valueAsText:
            self.params[7].value = "NUMBER_OF_INCREMENTS"

        if self.params[7].value == "NUMBER_OF_INCREMENTS":
            if self.params[8].valueAsText:
                try:
                    if "." in self.params[8].valueAsText: #truncate
                        self.params[8].value = int(float(self.params[8].valueAsText))
                except:
                    pass

        in_dem = self.params[0].valueAsText
        if in_dem:
            inDemZUnit = None
            try:
                sr = arcpy.sa.Raster(in_dem).spatialReference
                if sr.vcs:
                    inDemZUnit = sr.vcs.linearUnitName
                else:
                    inDemZUnit = None
            except:
                pass
            if not self.params[9].altered:
                if inDemZUnit:
                    self.params[9].value = inDemZUnit
                else:
                    self.params[9].value = "METER"

        if not self.params[2].hasBeenValidated:
            in_zonedata = self.params[2].valueAsText
            if in_zonedata:
                try:
                    desc1 = arcpy.Describe(in_zonedata)
                    if desc1.datatype in ['FeatureClass', 'FeatureLayer']:
                        self.params[3].filter.list = ["OID", "Short", "Long", "Text"]
                        if not self.params[3].altered:
                            self.params[3].value = desc1.OIDFieldName
                    elif desc1.datatype in ['RasterDataset', 'RasterLayer']:
                        self.params[3].filter.list = ["Short", "Long", "Text"]
                        if not self.params[3].altered:
                            self.params[3].value = "Value"
                except:
                    pass

        try:
            fldZoneText = self.params[3].valueAsText
            inZoneData = self.params[2].valueAsText
            anaType = self.params[4].valueAsText
            outPathName = self.params[1].valueAsText
            fldZone = None
            adtFields = []
            # oid field
            if outPathName:
                oidFName = ""
                outPath = os.path.dirname(outPathName)
                outName = os.path.basename(outPathName)
                if (outPath[-4:].lower() in [".gdb",".sde",".mdb"]) or (outPath.lower() in ["in_memory", "memory"]):
                    oidFName = "OBJECTID"
                else:
                    if outName[-4:].lower() == ".dbf":
                        oidFName = "OID"
                    else:
                        oidFName = "Rowid"
                adtFields.append(CreateField(oidFName,"OID"))
            # get zone field
            if fldZoneText and inZoneData:
                fldZone = arcpy.ListFields(inZoneData, fldZoneText)[0]
                if fldZone.name.lower() in ["objectid", "elevation", "area", "volume"]:
                    fldZone.name = fldZone.name + "_1"
                if fldZone.type == "OID":
                    fldZone.type = "Long"
                adtFields.append(CreateField(fldZone.name, fldZone.type))
                if (fldZone.type == "String"): # additional field
                    adtFields.append(CreateField("ZONE_CODE", "Long"))
            elif (not fldZoneText) and (not inZoneData):
                adtFields.append(CreateField("ZONE_CODE", "Long"))
            # get elevation field
            adtFields.append(CreateField("ELEVATION", "Double"))
            # get area field
            if anaType.upper() in ["AREA", "AREA_VOLUME"]:
                adtFields.append(CreateField("AREA", "Double"))
            # get volume field
            if anaType.upper() in ["VOLUME", "AREA_VOLUME"]:
                adtFields.append(CreateField("VOLUME", "Double"))
            self.params[1].schema.additionalFields = adtFields
        except:
            pass
        return

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        try:
            spRef = arcpy.sa.Raster(self.params[0].valueAsText).spatialReference
            if spRef is None:
                if not self.params[0].hasError():
                    self.params[0].setIDMessage("WARNING", 200828, "Unknown")
            else:
                if spRef.type == "Projected":
                    pass
                else:
                    if not self.params[0].hasError():
                        self.params[0].setIDMessage("WARNING", 200828, spRef.name)                        
        except:
            pass

        try:
            desc1 = arcpy.Describe(self.params[2].valueAsText)
            if desc1.datatype in ['RasterDataset', 'RasterLayer']:
                if not desc1.isInteger:
                    if not self.params[2].hasError():
                        self.params[2].setIDMessage("ERROR", 969)
        except:
            pass

        if not (self.params[8].value is None):
            if self.params[8].value <= 0:
                self.params[8].setIDMessage("ERROR", 892)
        if not (self.params[5].value is None) and not (self.params[6].value is None):
            if self.params[6].value <= self.params[5].value:
                self.params[5].setIDMessage("ERROR", 10433, "Minimum elevation", "maximum elevation")
                self.params[6].setIDMessage("ERROR", 10433, "Minimum elevation", "maximum elevation")

        try:
            sr = arcpy.sa.Raster(self.params[0].valueAsText).spatialReference
            if sr.vcs:
                inDemZUnit = sr.vcs.linearUnitName
                if (self.params[9].valueAsText.lower() != inDemZUnit.lower()):
                    self.params[9].setIDMessage("WARNING", 10515)
        except:
            pass

def CreateField(field_name, field_type):
    new_field = arcpy.Field()
    new_field.name = field_name
    new_field.type = field_type
    if field_type == "OID":
        new_field.editable = False
        new_field.isNullable = False
    else:
        new_field.editable = True
        new_field.isNullable = True
    return new_field

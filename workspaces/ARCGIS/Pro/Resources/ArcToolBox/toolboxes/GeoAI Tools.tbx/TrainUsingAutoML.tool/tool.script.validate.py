class ToolValidator:
    # Class to add custom behavior and properties to the tool and tool parameters.

    def __init__(self):
        # set self.params for use in other function
        self.params = arcpy.GetParameterInfo()

    def initializeParameters(self):
        # Customize parameter properties. 
        # This gets called when the tool is opened.
        return

    def updateParameters(self):
        # Modify parameter values and properties.
        # This gets called each time a parameter is modified, before 
        # standard validation.
        values = self.params[9].values
        if values:
            for i in range(len(values)):
                if values[i].upper() == 'RANDOM FOREST':
                    values[i] = 'RANDOM TREES'
            self.params[9].values = values

        if arcpy.CheckExtension("Spatial") != "Available":
            self.params[6].enabled = False

        if self.params[2].value:
            dep_var = self.params[2].valueAsText
            data_obj = arcpy.Describe(self.params[0].value)
            data_type = data_obj.dataType
            if data_type in ["ShapeFile", "FeatureLayer", "FeatureClass", "TableView", "TextFile"]:
                try:
                    datasource = data_obj.catalogPath
                except:
                    datasource = self.params[0].value
                try:
                    fields = []
                    desc = arcpy.Describe(self.params[0].value)
                    import SSUtilities as UTILS
                    field_obj = UTILS.SSFieldsInfo(desc)
                    fields_dict = field_obj.dFields
                    for key, value in fields_dict.items():
                        fields.append((key, value[1]))
                except:
                    fields = []

            if not fields:
                fields = []
            col_type = [v[1] for i, v in enumerate(fields) if v[0] == dep_var]
            if col_type:
                if col_type[0] == 'String':
                    self.params[3].value = 1

        if self.params[4].value:
            try:
                if self.params[0].value:
                    data_type = arcpy.Describe(self.params[0].value).dataType
                    if data_type in ["ShapeFile", "FeatureLayer", "FeatureClass", "TableView", "TextFile"]:
                        data_obj = arcpy.Describe(self.params[0].value)
                        try:
                            datasource = data_obj.catalogPath
                        except:
                            datasource = self.params[0].value
                        try:
                            fields = [(f.name, f.type) for f in arcpy.ListFields(datasource)]
                        except:
                            fields = []
                vals = []
                for cnt, par in enumerate(self.params[4].value):
                    col = par[0]
                    col_name = col.value
                    ckbox = par[1]
                    if not fields:
                        fields = []
                    col_type = [v[1] for i, v in enumerate(fields) if v[0] == col_name]
                    if str(col_name).lower() in ["oid", "fid", "shape", "objectid", "shape_leng", "shape_area"]:
                        continue
                    if (col_type and col_type[0] in ['String', 'text']):
                        vals.append([col_name, 1])
                    elif ckbox == 1 and col.isEmpty:
                        pass
                    else:
                        vals.append([col_name, ckbox])
                self.params[4].value = vals
            except:
                pass

        if self.params[6].value:
            try:
                vals = []
                for cnt, par in enumerate(self.params[6].value):
                    col = par[0]
                    ckbox = par[1]
                    if ckbox == True and str(col) == '':
                        pass
                    else:
                        vals.append([str(par[0]),par[1]])
                self.params[6].value = vals
            except:
                pass
        return

    def updateMessages(self):
        import os
        from pathlib import Path
        # Customize messages for the parameters.
        # This gets called after standard validation.
        # Feature class validation
        if self.params[0].value:
            self.params[0].clearMessage()
            try:
                data_type = arcpy.Describe(self.params[0].value).dataType

            except:
                self.params[0].setIDMessage("ERROR", 260126)

            datasource = self.params[0].value

            try:
                desc = arcpy.Describe(self.params[0].value)
                fields = []
                import SSUtilities as UTILS
                field_obj = UTILS.SSFieldsInfo(desc)
                fields_dict = field_obj.dFields
                for key, value in fields_dict.items():
                    fields.append((key, value[1]))
            except:
                self.params[0].setIDMessage("ERROR", 152)

            if not data_type in ["ShapeFile", "FeatureLayer", "FeatureClass", "Table", "TableView", "TextFile"]:
                self.params[0].setIDMessage("ERROR", 152)

        if self.params[4].value:
            if self.params[0].value:
                if data_type in ["ShapeFile", "FeatureLayer", "FeatureClass", "TableView", "TextFile"]:
                    try:
                        datasource = self.params[0].value
                    except:
                        data_obj = arcpy.Describe(self.params[0].value)
                        datasource = data_obj.catalogPath
                    try:
                        fields = []
                        desc = arcpy.Describe(self.params[0].value)
                        import SSUtilities as UTILS
                        field_obj = UTILS.SSFieldsInfo(desc)
                        fields_dict = field_obj.dFields
                        for key, value in fields_dict.items():
                            fields.append((key, value[1]))

                    except:
                        self.params[0].setIDMessage("ERROR", 260013)

            warn_cols = []
            err_col = None
            for cnt, par in enumerate(self.params[4].value):
                col = par[0]
                col_name = col.value
                if self.params[2].value:
                    if col_name == self.params[2].valueAsText:
                        err_col = col_name
                ckbox = par[1]
                if not fields:
                    fields = []
                col_type = [v[1] for i, v in enumerate(fields) if v[0] == col_name]

                if (col_type and col_type[0] == 'String' and ckbox != 1):
                    warn_cols.append(col_name)
            if warn_cols:
                self.params[4].setIDMessage("WARNING", 260015, str(warn_cols))
            if err_col:
                self.params[4].setIDMessage("ERROR", 110182, str(err_col))

        if self.params[5].value:
            if self.params[0].value:
                if str(self.params[0].value) == str(self.params[5].value):
                    self.params[5].setIDMessage("ERROR", 260148)
                if ('data_type' in locals() and data_type in ["Table", "TableView", "TextFile"]):
                    self.params[5].setIDMessage("ERROR", 260148)

        if self.params[6].value:
            if self.params[0].value:
                if ('data_type' in locals() and data_type in ["Table", "TableView"]):
                    self.params[6].setIDMessage("ERROR", 260123)

        if self.params[6].value:
            noSupportSAFormats = ['Image Service', "Cache/LERC2D", "AFR"]
            imageServerStr = ["https://", "ImageServer"]
            jpgstrings = [".jpg", ".jpeg", ".img"]
            noSupport = False
            fileFormatUnsupported = False
            info = self.params[6].value
            try:
                if info is not None and len(info) > 0:
                    for rOpt in info:
                        e = rOpt[0]
                        if isinstance(e, str):
                            desc = arcpy.Describe(e)
                            try:
                                if desc.spatialReference.type.upper() == "UNKNOWN":
                                    arcpy.AddIDMessage("ERROR", 2132)
                            except:
                                pass
                            if desc.format in noSupportSAFormats:
                                noSupport = True
                            del desc
                        elif all([v in str(e) for v in imageServerStr]):
                            noSupport = True
                        elif any([v in str(e) for v in jpgstrings]):
                            fileFormatUnsupported = True
                        else:
                            if hasattr(e, 'name'):
                                val = e.name
                            else:
                                self.params[1].setIDMessage("WARNING", 260016)
                                val = e
                            desc = arcpy.Describe(val)
                            try:
                                if desc.spatialReference.type.upper() == "UNKNOWN":
                                    arcpy.AddIDMessage("ERROR", 2132)
                            except:
                                pass
                            if desc.format in noSupportSAFormats:
                                noSupport = True
                            del desc
            except:
                pass
            if noSupport:
                self.params[6].setIDMessage("ERROR", 110213)
            if fileFormatUnsupported:
                self.params[6].setIDMessage("ERROR", 260014)

            # Time to run the tool validation
        if self.params[7].altered:
            if self.params[7].value < 0:
                self.params[7].clearMessage()
                self.params[7].setIDMessage("ERROR", 260017)
            elif ((self.params[7].value >= 0) and (self.params[7].value < 5)):
                self.params[7].clearMessage()
                self.params[7].setIDMessage("ERROR", 260017)
            else:
                self.params[7].clearMessage()

        if self.params[10].altered:
            if (self.params[10].value < 10 or self.params[10].value > 50):
                self.params[10].setIDMessage("ERROR", 260124)
            else:
                self.params[10].clearMessage()

        if self.params[13].value:
            if str(self.params[13].value).endswith('.shp'):
                if self.params[4].value:
                    import re
                    fields = []
                    for cnt, par in enumerate(self.params[4].value):
                        col = par[0]
                        fields.append(col.value)
                    for col in fields:
                        m = re.search(r'\d+$', col)
                        if m is not None:
                            self.params[13].setIDMessage("ERROR", 260018)
                else:
                    self.params[13].setIDMessage("WARNING", 260018)

            else:
                self.params[13].clearMessage()
        else:
            self.params[13].clearMessage()

        if self.params[12].value:
            if str(self.params[8].value) != 'BASIC':
                self.params[12].setIDMessage("ERROR", 260034)
            else:
                self.params[12].clearMessage()

        if self.params[14].value:
            if self.params[0].value:
                self.params[14].clearMessage()
                desc = arcpy.Describe(self.params[0].value)
                data_type = desc.dataType
                try:
                    data_source = desc.catalogPath
                except:
                    data_source = self.params[0].value
                if ((data_source.find('https') == 0) and (data_type != 'TableView')):
                    try:
                        from arcgis.features import FeatureLayer
                        featureLayer = FeatureLayer(data_source)
                        if not featureLayer.properties.hasAttachments:
                            self.params[14].setIDMessage("ERROR", 260277)
                        else:
                            self.params[14].clearMessage()
                    except:
                        self.params[0].setIDMessage("ERROR", 260278)
                elif data_type in ["ShapeFile", "FeatureLayer", "FeatureClass"]:
                    inTable = desc.name + '__ATTACH'
                    try:
                        from arcpy import da
                        with da.SearchCursor(inTable, ['DATA', 'ATT_NAME', 'ATTACHMENTID']) as cursor:
                            pass
                        self.params[14].clearMessage()
                    except:
                        self.params[14].setIDMessage("ERROR", 260277)
                else:
                    self.params[14].clearMessage()
            else:
                self.params[14].clearMessage()

        if self.params[15].value:
            if self.params[4].value:
                exp_vars = []
                for cnt, par in enumerate(self.params[4].value):
                    col = par[0]
                    exp_vars.append(col.value)

                sen_vars = []
                for cnt, par in enumerate(self.params[15].value):
                    col = par[0]
                    sen_vars.append(col.value)

                diff_list = list(set(sen_vars) - set(exp_vars))
                if diff_list:
                    self.params[15].setIDMessage("ERROR", 260279)

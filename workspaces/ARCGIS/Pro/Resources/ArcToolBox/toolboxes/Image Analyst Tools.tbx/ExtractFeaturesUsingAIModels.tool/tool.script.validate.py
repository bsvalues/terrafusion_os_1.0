# cv0
import os
import urllib.request
import zipfile

import arcpy

from GeoAIExtractFeaturesUtils import pretrained_model_store, post_op_list, band_list


class ToolValidator:
    # cv1
    def __init__(self):
        self.params = arcpy.GetParameterInfo()

    # cv2
    def initializeParameters(self):
        # cv99
        self.toggle_params_visible_by_indexes([0, 2, 3, 4, 5])
        self.toggle_params_visible_by_indexes([6, 7, 8, 9, 24])
        self.toggle_params_visible_by_indexes([17, 18, 23], False)
        # cv3
        try:
            self.params[2].value = arcpy.mp.ArcGISProject("CURRENT").defaultGeodatabase
        except:
            pass
        # cv4
        suffx = "1"
        self.params[3].value = "extracted_features" + "_" + suffx

        return

    # cv5
    def download_dlpk(self, _item):
        # cv6
        from arcgis.gis import GIS
        import tempfile

        # cv7
        try:
            gis = GIS(set_active=False)
            dlpk_path = tempfile.TemporaryDirectory().name
            item = gis.content.get(_item)
            filepath = item.download(dlpk_path)
        except:
            # cv8
            try:
                gis = GIS(url="home", set_active=False)
                dlpk_path = tempfile.TemporaryDirectory().name
                item = gis.content.get(_item)
                filepath = item.download(dlpk_path)
            except:
                return "download_error"

        return filepath

    # cv9
    def net_val_check(self):
        n_status = False
        try:
            urllib.request.urlopen("https://livingatlas.arcgis.com/", timeout=3)
        except:
            n_status = True

        return n_status

    # cv10
    def swap_char(self, input_name, swap_char_value):
        last_char_index = len(input_name) - 1
        return input_name[:last_char_index] + swap_char_value

    # cv11
    def zip_check(self, path):
        try:
            with zipfile.ZipFile(path) as zip1:
                if zip1.testzip() is None:
                    return False
                else:
                    return True
        except:
            return True

    # cv12
    def updateParameters(self):
        # cv13
        pretrained_live_list = self.params[5].values

        # cv14
        self.toggle_all_po(False)

        # cv100
        if not self.params[1].hasBeenValidated:
            # cv24
            if self.params[1].value == "Only Postprocess":
                # cv101
                self.toggle_params_visible_by_indexes([0, 17, 18, 23])
                self.toggle_params_visible_by_indexes([2, 3, 4, 5], False)
                self.toggle_params_visible_by_indexes([6, 7, 8, 9, 24], False)

                list_flush = [2, 3, 4, 5, 6, 7, 8, 9, 24]
                self.flush_param(list_flush)

                # cv102
                if self.params[17].value == "Polygon Regularization":
                    self.params[0].enabled = False
                    self.params[23].enabled = True

                if self.params[17].value == "Parcel Regularization":
                    self.params[0].enabled = True
                    self.params[23].enabled = False

            # cv104
            if self.params[1].value == "Infer and Postprocess":
                self.toggle_params_visible_by_indexes([0, 2, 3, 4, 5])
                self.toggle_params_visible_by_indexes([6, 7, 8, 9, 24])
                self.toggle_params_visible_by_indexes([17, 18, 23], False)

                list_flush = [18, 23]
                self.flush_param(list_flush)

        # cv109
        if self.params[1].hasBeenValidated:
            if (
                self.params[1].value == "Only Postprocess"
                and not self.params[17].hasBeenValidated
            ):
                if self.params[17].value == "Line Regularization":
                    self.params[0].value = None
                    self.params[23].value = None
                    self.params[0].enabled = True
                    self.params[23].enabled = True

                if self.params[17].value == "Polygon Regularization":
                    self.params[0].value = None
                    self.params[23].value = None
                    self.params[0].enabled = False
                    self.params[23].enabled = True

                if self.params[17].value == "Parcel Regularization":
                    self.params[23].value = None
                    self.params[0].value = None
                    self.params[0].enabled = True
                    self.params[23].enabled = False

            # cv110
            if (
                self.params[1].value == "Only Postprocess"
                and self.params[17].hasBeenValidated
            ):
                if self.params[17].value == "Line Regularization":
                    if self.params[0].value and (
                        self.params[0].enabled and self.params[23].enabled
                    ):
                        self.params[23].enabled = False

                    if self.params[23].value and (
                        self.params[0].enabled and self.params[23].enabled
                    ):
                        self.params[0].enabled = False

                    if self.params[0].value is None and (
                        self.params[0].enabled and not self.params[23].enabled
                    ):
                        self.params[0].value = None
                        self.params[23].value = None
                        self.params[0].enabled = True
                        self.params[23].enabled = True

                    if self.params[23].value is None and (
                        self.params[23].enabled and not self.params[0].enabled
                    ):
                        self.params[0].value = None
                        self.params[23].value = None
                        self.params[0].enabled = True
                        self.params[23].enabled = True

        # cv116
        if self.params[1].value == "Only Postprocess":
            # cv112
            if self.params[17].value in [
                "Line Regularization",
                "Parcel Regularization",
                "Polygon Regularization",
            ]:
                self.toggle_params_visible_by_indexes(
                    self._po_indexes[self.params[17].value.lower()], True
                )

            # cv30
            if self.params[18].value is None:
                suffx = "1"
                output_name = "extracted_features" + "_" + suffx
                try:
                    layer_list = []
                    aprx = arcpy.mp.ArcGISProject("CURRENT")
                    for m in aprx.listMaps():
                        for lyr in m.listLayers():
                            layer_list.append(lyr.name)
                        for tbl in m.listTables():
                            layer_list.append(tbl.name)

                    while output_name in layer_list:
                        add_suff = output_name[-1]
                        suff_num = int(add_suff) + 1
                        if suff_num != 10:
                            output_name = self.swap_char(output_name, str(suff_num))
                            new_ft_name = output_name
                        else:
                            output_name = self.swap_char(output_name, "1")
                            output_name = output_name + "0"
                            new_ft_name = output_name

                    new_ft_name = output_name
                    self.params[18].value = new_ft_name
                except:
                    pass

        # cv117
        if self.params[1].value == "Infer and Postprocess":
            # cv15
            filtered_pretrained_models = []
            if self.params[0].value is not None:
                if arcpy.Exists(self.params[0].value):
                    # cv16
                    try:
                        r = arcpy.ia.Raster(str(self.params[0].value))
                        PCS_WKT_sr = arcpy.SpatialReference(
                            text='PROJCS["WGS_1984_Web_Mercator_Auxiliary_Sphere",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Mercator_Auxiliary_Sphere"],PARAMETER["False_Easting",0.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",0.0],PARAMETER["Standard_Parallel_1",0.0],PARAMETER["Auxiliary_Sphere_Type",0.0],UNIT["Meter",1.0]]'
                        )
                        try:
                            ras_cs = str(arcpy.Describe(r).spatialReference.type)
                        except:
                            ras_cs = "error"

                        if ras_cs == "Unknown":
                            self.params[5].filter.list = []
                            self.params[5].values = list([])
                        # cv18
                        else:
                            r_proj = arcpy.ia.Reproject(r, PCS_WKT_sr)
                            cell_size_cm = (
                                (r_proj.meanCellHeight + r_proj.meanCellWidth) / 2
                            ) * 100
                            if arcpy.Describe(r).dataType == "RasterBand":
                                band_count = 1
                            else:
                                band_count = arcpy.Describe(
                                    self.params[0].value
                                ).bandCount

                            for k in self._pretrained_model_store:
                                cell_logic_condt = self._pretrained_model_store[k][
                                    "RecommendedCellSize"
                                ]
                                model_band_count = len(
                                    self._pretrained_model_store[k]["emd"][
                                        "ExtractBands"
                                    ]
                                )
                                # cv19
                                if cell_logic_condt is None:
                                    if model_band_count == band_count:
                                        filtered_pretrained_models.append(k)
                                    else:
                                        pass
                                # cv20
                                else:
                                    min_cell_size_x = self._pretrained_model_store[k][
                                        "emd"
                                    ]["MinCellSize"]["x"]
                                    min_cell_size_y = self._pretrained_model_store[k][
                                        "emd"
                                    ]["MinCellSize"]["y"]
                                    max_cell_size_x = self._pretrained_model_store[k][
                                        "emd"
                                    ]["MaxCellSize"]["x"]
                                    max_cell_size_y = self._pretrained_model_store[k][
                                        "emd"
                                    ]["MaxCellSize"]["y"]
                                    max_cell = (max_cell_size_x + max_cell_size_y) / 2
                                    min_cell = (min_cell_size_x + min_cell_size_y) / 2
                                    if model_band_count == band_count:
                                        if cell_size_cm <= max_cell:
                                            filtered_pretrained_models.append(k)
                                        else:
                                            pass
                                    else:
                                        pass
                        del r
                    # cv21
                    except:
                        filtered_pretrained_models = list(
                            self._pretrained_model_store.keys()
                        )
                        pass
            else:
                filtered_pretrained_models = list(self._pretrained_model_store.keys())
            self.params[5].filter.list = list(dict.fromkeys(filtered_pretrained_models))

            # cv22
            pretrained_selection = []
            if self.params[5].value is not None:
                for model_name in pretrained_live_list:
                    if model_name in list(self._pretrained_model_store.keys()):
                        pretrained_selection.append(model_name)
                    else:
                        pass
                self.params[5].values = list(dict.fromkeys(pretrained_selection))

            # cv23
            net_bool = False
            net_bool = self.net_val_check()
            if net_bool is True:
                self.params[5].filter.list = []
                self.params[5].values = list([])

            # cv113
            po_to_toggle_on = []
            if self.params[5].value is not None:
                for model_name in pretrained_live_list:
                    if model_name in list(self._pretrained_model_store.keys()):
                        if model_name in post_op_list(self._pretrained_model_store):
                            po_to_toggle_on.append(
                                self._pretrained_model_store[model_name][
                                    "postprocessing_workflow"
                                ]
                            )

                            if (
                                self._pretrained_model_store[model_name][
                                    "SAM_segmentation"
                                ]
                                == "True"
                            ):
                                po_to_toggle_on.append("Polygon Segmentation")

                        else:
                            pass
                    else:
                        pass
            # cv34
            if self.params[6].value is not None:
                custom_models = []
                for modelpath, po in self.params[6].value:
                    po_to_toggle_on.append(po)
                    modelpath = str(modelpath)
                    if modelpath.strip() == "":
                        continue
                    if modelpath.startswith("http"):
                        item_id = modelpath.rsplit("/", 1)[-1]
                        ex_modelpath = self.download_dlpk(item_id)
                        if ex_modelpath != "download_error":
                            modelpath = ex_modelpath
                        else:
                            pass
                    custom_models.append([modelpath, "None" if po == "" else po])
                self.params[6].value = custom_models
            # cv35
            for po in po_to_toggle_on:
                if po.strip() != "" and po.strip() != "None":
                    if po.lower() in self._post_p_name_list:
                        self.toggle_params_visible_by_indexes(
                            self._po_indexes[po.lower()]
                        )
            # cv36
            output_prefix = self.params[3].value
            if output_prefix is not None:
                try:
                    layer_list = []
                    aprx = arcpy.mp.ArcGISProject("CURRENT")
                    for m in aprx.listMaps():
                        for lyr in m.listLayers():
                            layer_list.append(lyr.name)
                        for tbl in m.listTables():
                            layer_list.append(tbl.name)

                    while output_prefix in layer_list:
                        if output_prefix[-1].isdigit():
                            add_suff = output_prefix[-1]
                            suff_num = int(add_suff) + 1
                            if suff_num != 10:
                                output_prefix = self.swap_char(
                                    output_prefix, str(suff_num)
                                )
                                self.params[3].value = output_prefix
                            else:
                                output_prefix = self.swap_char(output_prefix, "1")
                                output_prefix = output_prefix + "0"
                                self.params[3].value = output_prefix

                        else:
                            suffx = "1"
                            output_prefix = output_prefix + "_" + suffx
                            self.params[3].value = output_prefix

                    self.params[3].value = output_prefix
                except:
                    pass

            # cv113
            if self.params[24].value is not None:
                output_val_tb = self.params[24].value
                output_tab = os.path.basename(str(output_val_tb))
                tab_db = os.path.dirname(str(output_val_tb))
                if output_tab is not None:
                    try:
                        layer_list = []
                        aprx = arcpy.mp.ArcGISProject("CURRENT")
                        for m in aprx.listMaps():
                            for lyr in m.listLayers():
                                layer_list.append(lyr.name)
                            for tbl in m.listTables():
                                layer_list.append(tbl.name)

                        while output_tab in layer_list:
                            if output_tab[-1].isdigit():
                                add_suff = output_tab[-1]
                                suff_num = int(add_suff) + 1
                                if suff_num != 10:
                                    output_tab = self.swap_char(
                                        output_tab, str(suff_num)
                                    )
                                    self.params[24].value = output_tab
                                else:
                                    output_tab = self.swap_char(output_tab, "1")
                                    output_tab = output_tab + "0"
                                    self.params[24].value = output_tab

                            else:
                                suffx = "1"
                                output_tab = output_tab + "_" + suffx
                                self.params[24].value = output_tab

                        self.params[24].value = output_tab
                    except:
                        pass

                self.params[24].value = os.path.join(str(tab_db), str(output_tab))

                if self.params[2].value is None:
                    self.params[24].value = None

        # cv37
        if self.params[14].value is not None:
            if arcpy.Exists(self.params[14].value) and self.params[17].hasBeenValidated:
                if not self.params[14].hasBeenValidated or not self.params[15].value:
                    try:
                        desc = arcpy.Describe(self.params[14].value)
                        if desc.shapeType in ["Polygon"]:
                            self.params[15].value = "0 Meters"
                        if desc.shapeType in ["Polyline"]:
                            self.params[15].value = "5 Meters"
                    except:
                        pass

        return

    # cv38
    def updateMessages(self):
        # cv134
        if self.params[1].value == "Only Postprocess":
            for idx in [2, 3]:
                self.params[idx].clearMessage()

            if self.params[17].value in [
                "Polygon Regularization",
                "Line Regularization",
            ]:
                if self.params[23].value and self.params[0].value is None:
                    self.params[0].clearMessage()

        # cv40
        if self.params[1].value == "Infer and Postprocess":
            if self.params[0].value is not None:
                if arcpy.Exists(self.params[0].value):
                    try:
                        if arcpy.Describe(self.params[0].value).dataType in [
                            "RasterBand",
                            "RasterLayer",
                            "RasterDataset",
                            "MosaicLayer",
                        ]:
                            # cv66
                            if len(str(self.params[0].value)) > 127:
                                self.params[0].setIDMessage("WARNING", 260268)
                            else:
                                check_char1 = str(
                                    arcpy.Describe(self.params[0].value).catalogPath
                                )
                                # cv41
                                chars1 = self._fail_chr_list
                                if any((c in chars1) for c in check_char1):
                                    self.params[0].setIDMessage("WARNING", 260245)
                        else:
                            self.params[0].setIDMessage("ERROR", 260239)
                    except:
                        pass
                else:
                    self.params[0].setIDMessage("ERROR", 260244)

            # cv42
            if self.params[2].value is not None:
                if arcpy.Exists(self.params[2].value):
                    try:
                        if arcpy.Describe(self.params[2].value).dataType == "Workspace":
                            if (
                                arcpy.Describe(self.params[2].value).workspaceType
                                == "FileSystem"
                            ):
                                self.params[2].setIDMessage("ERROR", 260210)
                            else:
                                check_char2 = str(
                                    arcpy.Describe(self.params[2].value).catalogPath
                                )
                                chars2 = self._fail_chr_list
                                if any((c in chars2) for c in check_char2):
                                    self.params[2].setIDMessage("WARNING", 260245)
                        else:
                            self.params[2].setIDMessage("ERROR", 260210)
                    except:
                        pass
                else:
                    self.params[2].setIDMessage("ERROR", 260211)

            # cv43
            if self.params[3].value is not None:
                if self.params[3].value[0].isdigit():
                    suggest_dg = arcpy.ValidateTableName(str(self.params[3].value))
                    self.params[3].setIDMessage("ERROR", 260231, str(suggest_dg))
                else:
                    suggest_char = arcpy.ValidateTableName(str(self.params[3].value))
                    if suggest_char != str(self.params[3].value):
                        self.params[3].setIDMessage("ERROR", 260243, str(suggest_char))

            # cv44
            if self.params[2].value and self.params[3].value:
                if len(str(self.params[2].value) + str(self.params[3].value)) > 250:
                    self.params[2].setIDMessage("WARNING", 260268)
                    self.params[3].setIDMessage("WARNING", 260268)
                if len(str(self.params[3].value)) > 100:
                    self.params[3].setIDMessage("WARNING", 260268)
                else:
                    pass

            # cv45
            if self.params[4].value is not None:
                if arcpy.Exists(self.params[4].value):
                    try:
                        check_char4 = str(
                            arcpy.Describe(self.params[4].value).catalogPath
                        )
                        chars4 = self._fail_chr_list
                        if any((c in chars4) for c in check_char4):
                            self.params[4].setIDMessage("WARNING", 260245)
                    except:
                        pass
                else:
                    self.params[4].setIDMessage("ERROR", 260214)

            # cv46
            if self.params[5].filter.list == []:
                net_msg = False
                net_msg = self.net_val_check()
                if net_msg:
                    self.params[5].setIDMessage("WARNING", 260265)
                else:
                    if self.params[0].value is not None:
                        if arcpy.Exists(self.params[0].value):
                            try:
                                try:
                                    g = arcpy.ia.Raster(str(self.params[0].value))
                                    arcpy.Describe(g).dataType
                                    arcpy.Describe(g).spatialReference.type
                                    ras_cs_msg = str(
                                        arcpy.Describe(g).spatialReference.type
                                    )
                                    del g
                                except:
                                    ras_cs_msg = "error"
                                    pass
                                if ras_cs_msg == "Unknown":
                                    self.params[5].setIDMessage("WARNING", 260293)
                                else:
                                    if (
                                        arcpy.Describe(self.params[0].value).dataType
                                        == "RasterBand"
                                    ):
                                        band_count_msg = 1
                                    else:
                                        band_count_msg = arcpy.Describe(
                                            self.params[0].value
                                        ).bandCount

                                    if band_count_msg == 0 or ras_cs_msg == "error":
                                        self.params[5].setIDMessage("WARNING", 260294)
                                    else:
                                        if band_count_msg not in band_list(
                                            pretrained_model_store
                                        ):
                                            self.params[5].setIDMessage(
                                                "WARNING", 260275, str(band_count_msg)
                                            )
                            except:
                                pass

            # cv47
            if self.params[6].value is not None:
                add_models_path_list = []
                add_model_name_list = []
                for modelpath, po in self.params[6].value:
                    modelpath = str(modelpath)
                    if modelpath.strip() == "":
                        continue
                    add_models_path_list.append(modelpath)
                    add_model_name_list.append(os.path.basename(modelpath))
                # cv48
                if len(add_models_path_list) != len(list(set(add_models_path_list))):
                    self.params[6].setIDMessage("ERROR", 260264)
                else:
                    if len(add_model_name_list) != len(list(set(add_model_name_list))):
                        self.params[6].setIDMessage("ERROR", 260264)
                for zipck in list(set(add_models_path_list)):
                    # cv49
                    if zipck.startswith("http"):
                        ad_id = zipck.rsplit("/", 1)[-1]
                        self.params[6].setIDMessage("ERROR", 260259, str(ad_id))
                        break

                    else:
                        # cv50
                        if arcpy.Exists(zipck) is False:
                            self.params[6].setIDMessage(
                                "ERROR",
                                260270,
                                str(os.path.basename(zipck)),
                                str(zipck),
                            )
                            break
                        else:
                            if zipck.endswith(".emd"):
                                continue

                            if zipck.endswith(".dlpk"):
                                # cv51
                                if self.zip_check(zipck):
                                    self.params[6].setIDMessage(
                                        "ERROR", 260262, str(os.path.basename(zipck))
                                    )
                                    break
                            else:
                                self.params[6].setIDMessage(
                                    "ERROR", 260271, str(os.path.basename(zipck))
                                )
                                break
            # cv123
            if self.params[14].value is not None:
                if arcpy.Exists(self.params[14].value):
                    try:
                        check_char14 = str(
                            arcpy.Describe(self.params[14].value).catalogPath
                        )
                        chars14 = self._fail_chr_list
                        if any((c in chars14) for c in check_char14):
                            self.params[14].setIDMessage("WARNING", 260245)
                        desc = arcpy.Describe(self.params[14].value)
                        if desc.shapeType not in ["Polygon", "Polyline"]:
                            self.params[14].setIDMessage("ERROR", 260232)
                    except:
                        pass
                else:
                    self.params[14].setIDMessage("ERROR", 260215)

            # cv114
            if self.params[24].value is not None:
                output_val_tb = self.params[24].value
                output_tab = os.path.basename(str(output_val_tb))
                tab_db = os.path.dirname(str(output_val_tb))

                if str(output_val_tb).strip() != "":
                    if arcpy.Exists(tab_db):
                        try:
                            if arcpy.Describe(tab_db).dataType == "Workspace":
                                if arcpy.Describe(tab_db).workspaceType == "FileSystem":
                                    self.params[24].setIDMessage("ERROR", 260216)
                                else:
                                    check_char2 = str(
                                        arcpy.Describe(output_val_tb).catalogPath
                                    )
                                    chars2 = self._fail_chr_list
                                    if any((c in chars2) for c in check_char2):
                                        self.params[24].setIDMessage("WARNING", 260245)

                                    if output_tab[0].isdigit():
                                        suggest_dg = arcpy.ValidateTableName(
                                            str(output_tab)
                                        )
                                        self.params[24].setIDMessage(
                                            "ERROR", 260231, str(suggest_dg)
                                        )
                                    else:
                                        suggest_char = arcpy.ValidateTableName(
                                            str(output_tab)
                                        )
                                        if suggest_char != str(output_tab):
                                            self.params[24].setIDMessage(
                                                "ERROR", 260243, str(suggest_char)
                                            )
                            else:
                                self.params[24].setIDMessage("ERROR", 260216)
                        except:
                            pass
                    else:
                        self.params[24].setIDMessage("ERROR", 260218)

        # cv126
        if self.params[1].value == "Only Postprocess":
            # cv55
            if self.params[17].value not in [
                "Line Regularization",
                "Parcel Regularization",
                "Polygon Regularization",
            ]:
                self.params[17].setIDMessage("ERROR", 260253)
            # cv56
            if self.params[17].value and not self.params[18].value:
                self.params[18].setIDMessage("ERROR", 260254)
            # cv56
            if self.params[17].value and self.params[18].value:
                if len(os.path.basename(str(self.params[18].value))) > 150:
                    self.params[18].setIDMessage("WARNING", 260268)
                if len(str(self.params[18].value)) > 250:
                    self.params[18].setIDMessage("WARNING", 260268)

        # cv126
        if self.params[1].value == "Only Postprocess":
            if self.params[17].value in [
                "Line Regularization",
                "Parcel Regularization",
            ]:
                if self.params[0].value is not None:
                    if arcpy.Exists(self.params[0].value):
                        try:
                            # cv54
                            if (
                                arcpy.Describe(self.params[0].value).dataType
                                == "RasterBand"
                            ):
                                band_count = 1
                            if arcpy.Describe(self.params[0].value).dataType in [
                                "RasterLayer",
                                "RasterDataset",
                                "MosaicLayer",
                            ]:
                                band_count = arcpy.Describe(
                                    self.params[0].value
                                ).bandCount
                            if band_count != 1:
                                self.params[0].setIDMessage("ERROR", 260241)
                        except:
                            pass
                    else:
                        self.params[0].setIDMessage("ERROR", 260244)

            # cv133
            if self.params[17].value in [
                "Line Regularization",
                "Polygon Regularization",
            ]:
                if self.params[23].value is not None:
                    if arcpy.Exists(self.params[23].value):
                        try:
                            check_char14 = str(
                                arcpy.Describe(self.params[23].value).catalogPath
                            )
                            chars14 = self._fail_chr_list
                            if any((c in chars14) for c in check_char14):
                                self.params[23].setIDMessage("WARNING", 260245)
                            desc = arcpy.Describe(self.params[23].value)
                            if self.params[
                                17
                            ].value == "Line Regularization" and desc.shapeType not in [
                                "Polyline"
                            ]:
                                self.params[23].setIDMessage("ERROR", 260301)
                            if self.params[17].value in [
                                "Polygon Regularization"
                            ] and desc.shapeType not in ["Polygon"]:
                                self.params[23].setIDMessage("ERROR", 260127)
                        except:
                            pass
                    else:
                        self.params[23].setIDMessage("ERROR", 260217)

            # cv135
            if self.params[14].value is not None:
                if arcpy.Exists(self.params[14].value):
                    try:
                        check_char14 = str(
                            arcpy.Describe(self.params[14].value).catalogPath
                        )
                        chars14 = self._fail_chr_list
                        if any((c in chars14) for c in check_char14):
                            self.params[14].setIDMessage("WARNING", 260245)
                        desc = arcpy.Describe(self.params[14].value)
                        if desc.shapeType not in ["Polygon", "Polyline"]:
                            self.params[14].setIDMessage("ERROR", 260232)
                    except:
                        pass
                else:
                    self.params[14].setIDMessage("ERROR", 260215)

        return

    # cv58
    def isLicensed(self):
        if (arcpy.ProductInfo() != "ArcInfo") or (
            arcpy.CheckExtension("ImageAnalyst") != "Available"
        ):
            arcpy.AddIDMessage("ERROR", 180002)
            return False
        else:
            return True

    # cv59
    def postExecute(self):
        return

    # cv60
    _po_indexes = {
        "line regularization": [10, 11, 12, 13],
        "parcel regularization": [14, 15, 16, 19],
        "polygon regularization": [20, 21],
        "polygon segmentation": [22],
    }

    # cv61
    _post_p_name_list = [
        "line regularization",
        "parcel regularization",
        "polygon regularization",
        "polygon segmentation",
    ]

    # cv62
    _pretrained_model_store = pretrained_model_store

    # cv63
    _fail_chr_list = list(set("# $-`"))

    # cv137
    def toggle_params_visible_by_indexes(self, indexes, visible=True):
        assert visible in [True, False]
        for idx in indexes:
            if (self.params[idx].enabled) is not (visible):
                self.params[idx].enabled = visible

    # cv64
    def toggle_all_po(self, visible=True):
        for po in self._po_indexes:
            self.toggle_params_visible_by_indexes(self._po_indexes[po], visible)

    # cv146
    def flush_param(self, index_list):
        for idy in index_list:
            if idy in [8, 9]:
                self.params[idy].value = False
            else:
                self.params[idy].value = None

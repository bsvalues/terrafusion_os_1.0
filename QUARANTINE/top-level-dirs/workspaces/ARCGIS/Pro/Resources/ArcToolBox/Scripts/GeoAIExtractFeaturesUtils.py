# cu0
import glob
import json
import math
import os
import tempfile
import zipfile
import urllib.request
import arcpy
import pathlib


# cu1
imageClassification_comp_1 = ["line regularization", "parcel regularization"]

objectDetection_comp_2 = [
    "polygon regularization",
    "line regularization",
    "polygon segmentation",
]

instanceDetection_comp_3 = [
    "polygon regularization",
    "line regularization",
    "polygon segmentation",
]

depth_map = {
    "0": "1_BIT",
    "1": "2_BIT",
    "2": "4_BIT",
    "3": "8_BIT_UNSIGNED",
    "4": "8_BIT_SIGNED",
    "5": "16_BIT_UNSIGNED",
    "6": "16_BIT_SIGNED",
    "7": "32_BIT_UNSIGNED",
    "8": "32_BIT_SIGNED",
    "9": "32_BIT_FLOAT",
    "10": "64_BIT",
}


# cu133
def net_inactive():
    n_status = False
    try:
        urllib.request.urlopen("https://livingatlas.arcgis.com/", timeout=3)
    except:
        n_status = True

    return n_status


# cu139
def band_list(model_store):
    band_list_live = []
    for key in model_store:
        ct = len(model_store[key]["emd"]["ExtractBands"])
        band_list_live.append(ct)
    set_list = set(band_list_live)
    return set_list


# cu134
def offline_sam_path():
    base_usr_pth = os.getenv("LOCALAPPDATA")
    filepath = os.path.join(
        base_usr_pth, "ESRI", "DeepLearning", "PolygonSegmentation.dlpk"
    )
    return filepath


# cu140
def model_cache_available(model_name):
    cache_flag = "legacy"
    base_pth = os.getenv("LOCALAPPDATA")
    cache_loc = os.path.join(base_pth, "ESRI", "DeepLearning")
    model_folder_name = pretrained_model_store[model_name]["name"]
    model_folder_cache = os.path.join(
        base_pth, "ESRI", "DeepLearning", model_folder_name
    )
    model_file_dlpk = os.path.join(model_folder_cache, model_folder_name)

    if not arcpy.Exists(cache_loc):
        cache_flag = "n_cache"
        return cache_flag
    else:
        if not arcpy.Exists(model_folder_cache):
            cache_flag = "n_cache"
            return cache_flag
        else:
            if not arcpy.Exists(model_file_dlpk):
                cache_flag = "n_cache"
                return cache_flag
            else:
                try:
                    emd_data = extract_emd(model_file_dlpk, model_folder_cache)
                    if "Version" not in emd_data:
                        cache_flag = "legacy"
                        return cache_flag
                    else:
                        pass
                except:
                    cache_flag = "legacy"
                    return cache_flag

                from arcgis.gis import GIS

                model_id = pretrained_model_store[model_name]["id"]
                gis = GIS(set_active=False)
                data_item = gis.content.get(model_id)
                try:
                    web_emd = data_item.resources.get("emd.json")
                    web_version = web_emd["Version"]
                except:
                    cache_flag = "legacy"
                    return cache_flag
                cache_version = emd_data["Version"]

                cache_lt = cache_version.split(".")
                web_lt = web_version.split(".")
                check_level = min(len(web_lt), len(cache_lt))

                if check_level == 0 or check_level == 1:
                    cache_flag = "legacy"
                    return cache_flag

                if len(web_lt) != len(cache_lt):
                    cache_flag = "legacy"
                    return cache_flag

                two_deg_cache = str(cache_lt[0]) + "." + str(cache_lt[1])
                two_deg_web = str(web_lt[0]) + "." + str(web_lt[1])

                if check_level == 2:
                    if float(two_deg_web) > float(two_deg_cache):
                        cache_flag = "n_cache"
                        return cache_flag
                    else:
                        cache_flag = "y_cache"
                        return cache_flag
                if check_level == 3:
                    if float(two_deg_web) > float(two_deg_cache):
                        cache_flag = "n_cache"
                        return cache_flag
                    else:
                        if float(web_lt[2]) > float(cache_lt[2]):
                            cache_flag = "n_cache"
                            return cache_flag
                        else:
                            cache_flag = "y_cache"
                            return cache_flag


# cu2
def extract_emd(zip_loc, extract_loc):
    json_data = {}
    try:
        if zip_loc.endswith(".emd"):
            loc1 = str(zip_loc)
            with open(loc1, "r") as file:
                json_data = json.load(file)
        else:
            with zipfile.ZipFile(zip_loc, "r") as zip_ref:
                zip_ref.extractall(extract_loc)
            emd_path = glob.glob(extract_loc + "/*.emd")
            loc = str(emd_path[0])
            with open(loc, "r") as file:
                json_data = json.load(file)
    except:
        pass
    return json_data


# cu3
def post_op_list(model_store):
    p_mod_list = []
    for k in model_store:
        if model_store[k]["postprocessing_workflow"] != "None":
            p_mod_list.append(k)
    return p_mod_list


# cu4
def est_batch_sz_support(local_list):
    unsupported_list = []
    try:
        from arcgis.learn._utils.evaluate_batchsize import unsupported_models

        unsupported_list = unsupported_models
    except:
        pass
    lslt = list(set(local_list + unsupported_list))
    return lslt


# cu5
def qualitative_batch_size(_is_pretrained_model, mod):
    # cu6
    try:
        import torch

        total_mem = torch.cuda.get_device_properties(0).total_memory
        allocated_mem = torch.cuda.memory_allocated(0)
        free_mem = total_mem - allocated_mem
        available_gpu_mem = free_mem / 1000000000
        # cu7
        if _is_pretrained_model:
            if "batch_size" not in pretrained_model_store[str(mod)]:
                return 1
            else:
                optim_batch = int(pretrained_model_store[mod]["batch_size"])
            optim_batch = math.floor((optim_batch / 8) * available_gpu_mem)
            if optim_batch < 2:
                optim_batch = 1
            elif optim_batch > 2 and optim_batch < 4:
                optim_batch = 2
            elif optim_batch > 4 and optim_batch < 8:
                optim_batch = 4
            elif optim_batch > 8 and optim_batch < 16:
                optim_batch = 8
            elif optim_batch > 16 and optim_batch < 32:
                optim_batch = 16
            else:
                optim_batch = 16
            return int(optim_batch)
        else:
            return 1
    except:
        return 1


# cu8
def api_batch_size(ar, loct, mod1, _is_pretrained_model):
    # cu6
    import arcgis, gc, torch

    est_bt_fail = False
    try:
        loaded_model = eval(f"arcgis.learn.{ar}.from_model(loct)")

        api_model_bt_size = arcgis.learn.estimate_batch_size(
            loaded_model, mode="eval", verbose=False
        )

        return int(api_model_bt_size[0])
    except:
        est_bt_fail = True
        try:
            torch.cuda.empty_cache()
            gc.collect()
        except:
            pass
        pass
    # cu9
    if est_bt_fail:
        if _is_pretrained_model:
            bt_p = qualitative_batch_size(True, mod1)
        else:
            bt_p = qualitative_batch_size(False, "")
        return int(bt_p)


# cu10
def down_dlpk_batch_size(
    is_pretrained_model, model1, third_p_list, model_path, no_support_list
):
    try:
        # cu6
        from arcgis.gis import GIS

        # cu11
        if is_pretrained_model:
            # cu13
            arch = ""
            dlpk_loc = ""
            emd_loc = ""
            temp_emd = {}
            skip_dl = False

            cache_fl = model_cache_available(model1)

            if cache_fl == "y_cache":
                skip_dl = True
                local_cache = os.getenv("LOCALAPPDATA")
                model_folder_name = pretrained_model_store[model1]["name"]
                out_folder = os.path.join(
                    local_cache, "ESRI", "DeepLearning", model_folder_name
                )

            if cache_fl == "legacy":
                out_folder = tempfile.TemporaryDirectory().name

            if cache_fl == "n_cache":
                local_cache = os.getenv("LOCALAPPDATA")
                model_folder_name = pretrained_model_store[model1]["name"]
                out_folder = os.path.join(
                    local_cache, "ESRI", "DeepLearning", model_folder_name
                )
                pathlib.Path(out_folder).mkdir(parents=True, exist_ok=True)

            # cu19
            if skip_dl:
                msg3 = arcpy.GetIDMessage(260274)
                msg4 = msg3 + model1
                arcpy.SetProgressorLabel(msg4)
                pass
            else:
                try:
                    msg1 = arcpy.GetIDMessage(260257)
                    msg = msg1 + model1
                    arcpy.SetProgressorLabel(msg)
                    model_id = model_path.split("/")[-1]
                    gis = GIS(set_active=False)
                    data_item = gis.content.get(model_id)
                    data_item.download(save_path=out_folder)
                except Exception as e:
                    arcpy.AddIDMessage("WARNING", 260258, str(model1))
                    if "Failed to establish a new connection" in e:
                        pass
                    else:
                        arcpy.AddIDMessage("WARNING", 260269, str(e))
                    return 1, dlpk_loc

            dlpk_path = glob.glob(out_folder + "/*.dlpk")

            if len(dlpk_path) == 0:
                if not skip_dl:
                    arcpy.AddIDMessage("WARNING", 260258, str(model1))
                return 1, dlpk_loc
            else:
                temp_emd = extract_emd(zip_loc=dlpk_path[0], extract_loc=out_folder)

            emd_loc = glob.glob(out_folder + "/*.emd")

            if len(emd_loc) == 0:
                arcpy.AddIDMessage("WARNING", 260260, str(model1))
                return 1, dlpk_loc
            else:
                dlpk_loc = emd_loc[0]

            # cu12
            msg1 = arcpy.GetIDMessage(260256)
            msg = msg1 + model1
            arcpy.SetProgressorLabel(msg)
            # cu14
            if len(temp_emd) == 0:
                dlpk_loc = ""
                arcpy.AddIDMessage("WARNING", 260260, str(model1))
                return 1, dlpk_loc

            # cu15
            if "ModelName" not in temp_emd:
                return 1, dlpk_loc
            else:
                arch = str(temp_emd["ModelName"])
            # cu16
            if arch in third_p_list:
                return 1, dlpk_loc
            # cu20
            if arch in est_batch_sz_support(no_support_list):
                bt_p = qualitative_batch_size(True, model1)
                return int(bt_p), dlpk_loc
            # cu17
            else:
                bt_p = api_batch_size(arch, dlpk_loc, model1, is_pretrained_model)
                return int(bt_p), dlpk_loc
        # cu18
        else:
            arch = ""
            dlpk_loc = ""
            emd_loc = ""
            temp_emd = {}
            out_folder = tempfile.TemporaryDirectory().name
            temp_emd = extract_emd(zip_loc=model1, extract_loc=out_folder)

            if model1.endswith(".dlpk"):
                emd_loc = glob.glob(out_folder + "/*.emd")

                if len(emd_loc) == 0:
                    arcpy.AddIDMessage("WARNING", 260260, str(model1))
                    return 1, dlpk_loc
                else:
                    dlpk_loc = emd_loc[0]

            # cu14
            if len(temp_emd) == 0:
                dlpk_loc = ""
                arcpy.AddIDMessage("WARNING", 260260, str(model1))
                return 1, dlpk_loc
            # cu15
            if "ModelName" not in temp_emd:
                return 1, dlpk_loc
            else:
                arch = str(temp_emd["ModelName"])
            # cu16
            if arch in third_p_list:
                return 1, dlpk_loc
            # cu20
            if arch in est_batch_sz_support(no_support_list):
                bt_p = qualitative_batch_size(False, "")
                return int(bt_p), dlpk_loc
            # cu17
            else:
                bt_p = api_batch_size(arch, dlpk_loc, "", is_pretrained_model)
                return int(bt_p), dlpk_loc
    except:
        return 1, dlpk_loc


# cu21
def incomp_add_mod_postP_check(add_mod, add_mod_postP):
    mod_cat = ""
    with tempfile.TemporaryDirectory() as out_folder:
        temp_emd = extract_emd(zip_loc=add_mod, extract_loc=out_folder)
        add_mod_postP = add_mod_postP.lower()
        # cu22
        if len(temp_emd) == 0:
            return False
        if "ModelType" not in temp_emd:
            if (add_mod_postP == "none") or (add_mod_postP == ""):
                pass
            else:
                arcpy.AddIDMessage("WARNING", 260263, str(add_mod), str(add_mod_postP))
            return True
        else:
            mod_cat = str(temp_emd["ModelType"])
    if (add_mod_postP == "none") or (add_mod_postP == ""):
        return False
    # cu23
    if mod_cat == "ImageClassification":
        if add_mod_postP in imageClassification_comp_1:
            return False
        else:
            arcpy.AddIDMessage("WARNING", 260263, str(add_mod), str(add_mod_postP))
            return True
    # cu23
    if mod_cat == "ObjectDetection":
        if add_mod_postP in objectDetection_comp_2:
            return False
        else:
            arcpy.AddIDMessage("WARNING", 260263, str(add_mod), str(add_mod_postP))
            return True
    # cu23
    if mod_cat == "InstanceDetection":
        if add_mod_postP in instanceDetection_comp_3:
            return False
        else:
            arcpy.AddIDMessage("WARNING", 260263, str(add_mod), str(add_mod_postP))
            return True
    else:
        arcpy.AddIDMessage("WARNING", 260263, str(add_mod), str(add_mod_postP))
        return True


# c24
def incomp_mod_and_band(ras, ext_emd):
    mod_band = 0
    band_count = 0
    ex_band_count = 0
    try:
        if "ExtractBands" not in ext_emd.keys():
            ex_band_count = arcpy.Describe(ras).bandCount
            return False, False, ex_band_count, band_count
        else:
            mod_band = len(list(ext_emd["ExtractBands"]))
            band_count = arcpy.Describe(ras).bandCount
            if mod_band != band_count:
                return True, True, band_count, mod_band
            else:
                return False, True, band_count, mod_band
    except:
        pass

    return False, True, band_count, mod_band


# cu45
def sentinel_one_preprocessing(model_name, sar_in, sar_out, sar_aoi):
    # cu46
    if not arcpy.Exists(sar_in):
        return "no_input_data"

    # cu47
    arcpy.CheckOutExtension("ImageAnalyst")

    # cu48
    user_sett_addout_post_sar = arcpy.env.addOutputsToMap
    arcpy.env.addOutputsToMap = False
    user_env_overwrite_post_sar = arcpy.env.overwriteOutput
    arcpy.env.overwriteOutput = True

    # cu49
    interm_gdb_post_p_name = os.path.basename(tempfile.TemporaryDirectory().name)
    gdb_path = os.path.join(tempfile.gettempdir(), (interm_gdb_post_p_name + ".gdb"))
    arcpy.management.CreateFileGDB(
        tempfile.gettempdir(), arcpy.ValidateTableName(interm_gdb_post_p_name)
    )
    workspace_path = os.path.join(tempfile.gettempdir(), interm_gdb_post_p_name)

    # cu44
    PCS_WKT_sr = arcpy.SpatialReference(
        text='PROJCS["WGS_1984_Web_Mercator_Auxiliary_Sphere",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Mercator_Auxiliary_Sphere"],PARAMETER["False_Easting",0.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",0.0],PARAMETER["Standard_Parallel_1",0.0],PARAMETER["Auxiliary_Sphere_Type",0.0],UNIT["Meter",1.0]]'
    )

    # cu53
    if model_name == "WATER BODY EXTRACTION (SAR) - USA":
        out_bands_raster = arcpy.ia.ExtractBand(sar_in, [2, 2, 2])

        with arcpy.EnvManager(extent=sar_aoi, outputCoordinateSystem=PCS_WKT_sr):
            arcpy.CopyRaster_management(
                in_raster=out_bands_raster,
                out_rasterdataset=sar_out,
                pixel_type="8_BIT_UNSIGNED",
            )

    # cu54
    if model_name == "SHIP DETECTION (SAR)":
        out_bands_raster = arcpy.ia.ExtractBand(sar_in, [1, 1, 1])

        with arcpy.EnvManager(extent=sar_aoi, outputCoordinateSystem=PCS_WKT_sr):
            arcpy.CopyRaster_management(
                in_raster=out_bands_raster,
                out_rasterdataset=sar_out,
                pixel_type="8_BIT_UNSIGNED",
            )

    # cu55
    if model_name == "OIL SPILL DETECTION (SAR)":
        out_radar_data = arcpy.ia.Despeckle(
            in_radar_data=sar_in, filter_type="REFINED_LEE"
        )

        outlog_raster = arcpy.ia.Log10(out_radar_data)

        out_bands_raster = arcpy.ia.ExtractBand(outlog_raster, [1, 1, 1])

        with arcpy.EnvManager(extent=sar_aoi, outputCoordinateSystem=PCS_WKT_sr):
            arcpy.CopyRaster_management(
                in_raster=out_bands_raster,
                out_rasterdataset=sar_out,
                pixel_type="8_BIT_UNSIGNED",
            )

    else:
        pass

    arcpy.Delete_management(gdb_path)

    # cu51
    arcpy.CheckInExtension("ImageAnalyst")

    # cu52
    arcpy.env.addOutputsToMap = user_sett_addout_post_sar
    arcpy.env.overwriteOutput = user_env_overwrite_post_sar

    return


# cu25
def lines_postprocessing(interm_output_path, output_path, def_val_msg, model_name):
    # cu26
    arcpy.SetProgressorLabel(arcpy.GetIDMessage(260234))

    # cu27
    buffer_distance = arcpy.GetParameterAsText(10)
    extend_length = arcpy.GetParameterAsText(11)
    smoothing_tolerance = arcpy.GetParameterAsText(12)
    dangle_length = arcpy.GetParameterAsText(13)
    out_feature_class = output_path
    raster_mode = False
    # cu28
    if def_val_msg is True:
        if (
            str(buffer_distance) == "15 Meters"
            and str(extend_length) == "25 Meters"
            and str(smoothing_tolerance) == "30 Meters"
            and str(dangle_length) == "5 Meters"
        ):
            arcpy.AddIDMessage("INFORMATIVE", 260246)

    # cu29
    if not arcpy.Exists(interm_output_path):
        return "no_input_data"

    # cu30
    arcpy.CheckOutExtension("ImageAnalyst")
    arcpy.CheckOutExtension("3D")
    arcpy.CheckOutExtension("Foundation")

    user_sett_addout_post = arcpy.env.addOutputsToMap
    arcpy.env.addOutputsToMap = False
    user_env_overwrite_post = arcpy.env.overwriteOutput
    arcpy.env.overwriteOutput = True

    # cu31
    interm_gdb_post_p_name = os.path.basename(tempfile.TemporaryDirectory().name)
    gdb_path = os.path.join(tempfile.gettempdir(), (interm_gdb_post_p_name + ".gdb"))
    arcpy.management.CreateFileGDB(
        tempfile.gettempdir(), arcpy.ValidateTableName(interm_gdb_post_p_name)
    )
    workspace_path = os.path.join(tempfile.gettempdir(), interm_gdb_post_p_name)

    # cu32
    line_desc = arcpy.Describe(interm_output_path)
    line_vec_list = ["FeatureClass", "FeatureDataset", "ShapeFile", "FeatureLayer"]

    if str(line_desc.dataType) not in line_vec_list:
        raster_mode = True
        # cu33
        # Process: CopyRaster_management (license level: Standard) (Data management tools)
        user_CS_typ = ""
        user_CS_WKT = ""
        user_CS_sr = arcpy.SpatialReference()
        user_CS_typ = str(arcpy.Describe(interm_output_path).spatialReference.type)
        user_CS_WKT = str(
            arcpy.Describe(interm_output_path).spatialReference.exportToString()
        )
        user_CS_sr = arcpy.SpatialReference(text=user_CS_WKT)
        PCS_WKT_sr = arcpy.SpatialReference(
            text='PROJCS["WGS_1984_Web_Mercator_Auxiliary_Sphere",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Mercator_Auxiliary_Sphere"],PARAMETER["False_Easting",0.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",0.0],PARAMETER["Standard_Parallel_1",0.0],PARAMETER["Auxiliary_Sphere_Type",0.0],UNIT["Meter",1.0]]'
        )

        # cu114
        dd_rs = arcpy.ia.Raster(interm_output_path)

        bit_type_dscr = str(arcpy.GetRasterProperties_management(dd_rs, "VALUETYPE"))

        if bit_type_dscr not in ["1", "2", "3", "4", "5", "6", "7", "8"]:
            if model_name == "":
                arcpy.AddIDMessage("ERROR", 260296)
            else:
                arcpy.AddIDMessage("WARNING", 260297, str(model_name))
            del dd_rs
            return "known_exit"

        copy_rs_mem_a = os.path.join(gdb_path, "interim_data_1a")

        # cu33
        try:
            with arcpy.EnvManager(outputCoordinateSystem=PCS_WKT_sr):
                arcpy.CopyRaster_management(
                    in_raster=interm_output_path, out_rasterdataset=copy_rs_mem_a
                )
        except:
            copy_rs_mem_a = interm_output_path
            pass

        dd_rs = arcpy.ia.Raster(copy_rs_mem_a)

        # cu112
        arcpy.BuildRasterAttributeTable_management(dd_rs, "Overwrite")
        val_1 = arcpy.GetRasterProperties_management(dd_rs, "MINIMUM")
        val_2 = arcpy.GetRasterProperties_management(dd_rs, "MAXIMUM")
        unq_ct = arcpy.GetRasterProperties_management(dd_rs, "UNIQUEVALUECOUNT")

        val_1a = int(val_1.getOutput(0))
        val_2a = int(val_2.getOutput(0))
        unq_ct_val = str(unq_ct.getOutput(0))

        bg_key = min(val_1a, val_2a)
        foi = max(val_1a, val_2a)

        if unq_ct_val != "2":
            if model_name == "":
                arcpy.AddIDMessage("ERROR", 260296)
            else:
                arcpy.AddIDMessage("WARNING", 260297, str(model_name))
            del dd_rs
            return "known_exit"
        else:
            pass

        remap_key = str(bg_key) + " NODATA;" + str(foi) + " 1"

        # Process: Reclassify (extension license: 3D)
        Reclassify1 = os.path.join(gdb_path, "interim_data_2a")
        arcpy.ddd.Reclassify(
            in_raster=copy_rs_mem_a,
            reclass_field="Value",
            remap=remap_key,
            out_raster=Reclassify1,
        )

        # Process: Raster to Polygon (license level: Basic) (Conversion tools)
        Road_polygon = os.path.join(gdb_path, "interim_data_3a")
        arcpy.conversion.RasterToPolygon(
            in_raster=Reclassify1,
            out_polygon_features=Road_polygon,
            simplify="NO_SIMPLIFY",
            raster_field="Value",
            create_multipart_features="SINGLE_OUTER_PART",
            max_vertices_per_feature=200,
        )

        # Process: PairwiseDissolve (license level: Basic) (Analysis tools)
        Buffer_dissolve = os.path.join(gdb_path, "interim_data_4a")
        arcpy.analysis.PairwiseDissolve(
            in_features=Road_polygon,
            out_feature_class=Buffer_dissolve,
            dissolve_field=None,
            statistics_fields=None,
            multi_part="SINGLE_PART",
        )

    else:
        # cu33
        # Process: CopyFeatures (license level: Standard) (Data management tools)
        user_CS_typ = ""
        user_CS_WKT = ""
        user_CS_sr = arcpy.SpatialReference()
        user_CS_typ = str(arcpy.Describe(interm_output_path).spatialReference.type)
        user_CS_WKT = str(
            arcpy.Describe(interm_output_path).spatialReference.exportToString()
        )
        user_CS_sr = arcpy.SpatialReference(text=user_CS_WKT)
        PCS_WKT_sr = arcpy.SpatialReference(
            text='PROJCS["WGS_1984_Web_Mercator_Auxiliary_Sphere",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Mercator_Auxiliary_Sphere"],PARAMETER["False_Easting",0.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",0.0],PARAMETER["Standard_Parallel_1",0.0],PARAMETER["Auxiliary_Sphere_Type",0.0],UNIT["Meter",1.0]]'
        )

        copy_ft_mem_a = os.path.join(gdb_path, "interim_data_5a")

        # cu33
        try:
            with arcpy.EnvManager(outputCoordinateSystem=PCS_WKT_sr):
                arcpy.management.CopyFeatures(
                    in_features=interm_output_path, out_feature_class=copy_ft_mem_a
                )
        except:
            copy_ft_mem_a = interm_output_path
            pass
        try:
            arcpy.management.RepairGeometry(copy_ft_mem_a)
        except:
            pass

        Buffer_dissolve = copy_ft_mem_a

        data_check = arcpy.GetCount_management(Buffer_dissolve)
        count = int(data_check.getOutput(0))
        if count == 0:
            if model_name != "":
                arcpy.AddIDMessage("WARNING", 260272, str(model_name))
            arcpy.Delete_management(gdb_path)
            return "blank_input_data"

    # Process: PairwiseBuffer (license level: Basic) (Analysis tools)
    Buffer_Polygon = os.path.join(gdb_path, "interim_data_6a")
    arcpy.analysis.PairwiseBuffer(
        in_features=Buffer_dissolve,
        out_feature_class=Buffer_Polygon,
        buffer_distance_or_field=buffer_distance,
        dissolve_option=None,
        dissolve_field=None,
        method=None,
        max_deviation=None,
    )

    # Process: PairwiseDissolve (license level: Basic) (Analysis tools)
    Buffer_dissolve_ = os.path.join(gdb_path, "interim_data_7a")
    arcpy.analysis.PairwiseDissolve(
        in_features=Buffer_Polygon,
        out_feature_class=Buffer_dissolve_,
        dissolve_field=None,
        statistics_fields=None,
        multi_part="SINGLE_PART",
    )

    # Process: PolygonToCenterline (extension license: Foundation)
    Centerline = os.path.join(gdb_path, "interim_data_8a")
    arcpy.topographic.PolygonToCenterline(
        in_features=Buffer_dissolve_,
        out_feature_class=Centerline,
        connecting_features=None,
    )

    # Process: Extend Line (license level: Standard) (Editing tools)
    arcpy.edit.ExtendLine(
        in_features=Centerline, length=extend_length, extend_to="EXTENSION"
    )[0]

    # Process: SmoothLine (license level: Standard) (Cartography tools)
    Smooth_line1 = os.path.join(gdb_path, "interim_data_9a")
    arcpy.cartography.SmoothLine(
        in_features=Centerline,
        out_feature_class=Smooth_line1,
        algorithm="PAEK",
        tolerance=smoothing_tolerance,
        endpoint_option="FIXED_CLOSED_ENDPOINT",
        error_option="NO_CHECK",
    )

    # Process: PairwiseBuffer (license level: Basic) (Analysis tools)
    Buffer_Polygon1 = os.path.join(gdb_path, "interim_data_1b")
    arcpy.analysis.PairwiseBuffer(
        in_features=Smooth_line1,
        out_feature_class=Buffer_Polygon1,
        buffer_distance_or_field=buffer_distance,
        dissolve_option=None,
        dissolve_field=None,
        method=None,
        max_deviation=None,
    )

    # Process: PairwiseDissolve (license level: Basic) (Analysis tools)
    Buffer_dissolve1 = os.path.join(gdb_path, "interim_data_2b")
    arcpy.analysis.PairwiseDissolve(
        in_features=Buffer_Polygon1,
        out_feature_class=Buffer_dissolve1,
        dissolve_field=None,
        statistics_fields=None,
        multi_part="SINGLE_PART",
    )

    # Process: PolygonToCenterline (extension license: Foundation)
    Centerline1 = os.path.join(gdb_path, "interim_data_3b")
    arcpy.topographic.PolygonToCenterline(
        in_features=Buffer_dissolve1,
        out_feature_class=Centerline1,
        connecting_features=None,
    )

    # Process: SmoothLine (license level: Standard) (Cartography tools)
    copy_out_a = os.path.join(gdb_path, "interim_data_4b")
    with arcpy.EnvManager(transferGDBAttributeProperties=False):
        arcpy.cartography.SmoothLine(
            in_features=Centerline1,
            out_feature_class=copy_out_a,
            algorithm="PAEK",
            tolerance=smoothing_tolerance,
            endpoint_option="FIXED_CLOSED_ENDPOINT",
            error_option="NO_CHECK",
        )

    # Process: Trim Line (license level: Standard) (Editing tools)
    arcpy.edit.TrimLine(
        in_features=copy_out_a,
        dangle_length=dangle_length,
        delete_shorts="DELETE_SHORT",
    )

    # cu33
    # Process: CopyFeatures (license level: Standard) (Data management tools)
    try:
        arcpy.management.RepairGeometry(copy_out_a)
    except:
        pass
    with arcpy.EnvManager(outputCoordinateSystem=user_CS_sr):
        arcpy.management.CopyFeatures(
            in_features=copy_out_a, out_feature_class=out_feature_class
        )

    # cu34
    if raster_mode == True:
        del dd_rs
    arcpy.Delete_management(gdb_path)

    # cu30
    arcpy.CheckInExtension("ImageAnalyst")
    arcpy.CheckInExtension("3D")
    arcpy.CheckInExtension("Foundation")

    arcpy.env.addOutputsToMap = user_sett_addout_post
    arcpy.env.overwriteOutput = user_env_overwrite_post

    return "full_run"


# cu35
def parcels_postprocessing(interm_output_path, output_path, def_val_msg, model_name):
    # cu26
    arcpy.SetProgressorLabel(arcpy.GetIDMessage(260235))

    # cu27
    roads_polyline = arcpy.GetParameterAsText(14)
    if roads_polyline == "#":
        roads_polyline = ""
    road_width = arcpy.GetParameterAsText(15)
    tolerance = arcpy.GetParameterAsText(19)
    out_feature_class = output_path
    Sharpe_Edges = arcpy.GetParameterAsText(16)

    # cu28
    if def_val_msg is True:
        if (
            str(road_width) == "5 Meters"
            and str(tolerance) == "3 Meters"
            and str(Sharpe_Edges) == "true"
            and str(roads_polyline) == ""
        ):
            arcpy.AddIDMessage("INFORMATIVE", 260247)

    # cu29
    if not arcpy.Exists(interm_output_path):
        return "no_input_data"

    # cu30
    arcpy.CheckOutExtension("ImageAnalyst")
    arcpy.CheckOutExtension("Foundation")
    arcpy.CheckOutExtension("Spatial")
    arcpy.CheckOutExtension("3D")

    user_sett_addout_post = arcpy.env.addOutputsToMap
    arcpy.env.addOutputsToMap = False
    user_env_overwrite_post = arcpy.env.overwriteOutput
    arcpy.env.overwriteOutput = True

    # cu31
    interm_gdb_post_p_name = os.path.basename(tempfile.TemporaryDirectory().name)
    gdb_path = os.path.join(tempfile.gettempdir(), (interm_gdb_post_p_name + ".gdb"))
    arcpy.management.CreateFileGDB(
        tempfile.gettempdir(), arcpy.ValidateTableName(interm_gdb_post_p_name)
    )
    workspace_path = os.path.join(tempfile.gettempdir(), interm_gdb_post_p_name)

    # cu33
    # Process: CopyFeatures (license level: Standard) (Data management tools)
    if str(roads_polyline) != "":
        user_CS_typ = ""
        user_CS_WKT = ""
        user_CS_sr = arcpy.SpatialReference()
        user_CS_typ = str(arcpy.Describe(interm_output_path).spatialReference.type)
        user_CS_WKT = str(
            arcpy.Describe(interm_output_path).spatialReference.exportToString()
        )
        user_CS_sr = arcpy.SpatialReference(text=user_CS_WKT)
        PCS_WKT_sr = arcpy.SpatialReference(
            text='PROJCS["WGS_1984_Web_Mercator_Auxiliary_Sphere",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Mercator_Auxiliary_Sphere"],PARAMETER["False_Easting",0.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",0.0],PARAMETER["Standard_Parallel_1",0.0],PARAMETER["Auxiliary_Sphere_Type",0.0],UNIT["Meter",1.0]]'
        )

        road_copy = os.path.join(gdb_path, "interim_data_5b")

        # cu33
        try:
            with arcpy.EnvManager(outputCoordinateSystem=PCS_WKT_sr):
                arcpy.management.CopyFeatures(
                    in_features=roads_polyline, out_feature_class=road_copy
                )
        except:
            road_copy = roads_polyline
            pass
        try:
            arcpy.management.RepairGeometry(road_copy)
        except:
            pass

    # cu33
    # Process: CopyRaster_management (license level: Standard) (Data management tools)
    user_CS_typ = ""
    user_CS_WKT = ""
    user_CS_sr = arcpy.SpatialReference()
    user_CS_typ = str(arcpy.Describe(interm_output_path).spatialReference.type)
    user_CS_WKT = str(
        arcpy.Describe(interm_output_path).spatialReference.exportToString()
    )
    user_CS_sr = arcpy.SpatialReference(text=user_CS_WKT)
    PCS_WKT_sr = arcpy.SpatialReference(
        text='PROJCS["WGS_1984_Web_Mercator_Auxiliary_Sphere",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Mercator_Auxiliary_Sphere"],PARAMETER["False_Easting",0.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",0.0],PARAMETER["Standard_Parallel_1",0.0],PARAMETER["Auxiliary_Sphere_Type",0.0],UNIT["Meter",1.0]]'
    )

    # cu114
    dd_rs = arcpy.ia.Raster(interm_output_path)

    bit_type_dscr = str(arcpy.GetRasterProperties_management(dd_rs, "VALUETYPE"))

    if bit_type_dscr not in ["1", "2", "3", "4", "5", "6", "7", "8"]:
        if model_name == "":
            arcpy.AddIDMessage("ERROR", 260296)
        else:
            arcpy.AddIDMessage("WARNING", 260297, str(model_name))
        del dd_rs
        return "known_exit"

    copy_rs_mem_b = os.path.join(gdb_path, "interim_data_6b")

    # cu33
    try:
        with arcpy.EnvManager(outputCoordinateSystem=PCS_WKT_sr):
            arcpy.CopyRaster_management(
                in_raster=interm_output_path, out_rasterdataset=copy_rs_mem_b
            )
    except:
        copy_rs_mem_b = interm_output_path
        pass

    # cu114
    dd_rs = arcpy.ia.Raster(copy_rs_mem_b)

    # cu119
    arcpy.BuildRasterAttributeTable_management(dd_rs, "Overwrite")

    val_1 = arcpy.GetRasterProperties_management(dd_rs, "MINIMUM")
    val_2 = arcpy.GetRasterProperties_management(dd_rs, "MAXIMUM")
    unq_ct = arcpy.GetRasterProperties_management(dd_rs, "UNIQUEVALUECOUNT")

    val_1a = int(val_1.getOutput(0))
    val_2a = int(val_2.getOutput(0))
    unq_ct_val = str(unq_ct.getOutput(0))

    bg_key = min(val_1a, val_2a)
    foi = max(val_1a, val_2a)

    if unq_ct_val != "2":
        if model_name == "":
            arcpy.AddIDMessage("ERROR", 260296)
        else:
            arcpy.AddIDMessage("WARNING", 260297, str(model_name))
        del dd_rs
        return "known_exit"
    else:
        pass

    remap_key_prcl = str(bg_key) + " NODATA;" + str(foi) + " 255"

    # Process: Reclassify (extension license: 3D)
    Reclassify2 = os.path.join(gdb_path, "interim_data_7b")
    arcpy.ddd.Reclassify(
        in_raster=copy_rs_mem_b,
        reclass_field="Value",
        remap=remap_key_prcl,
        missing_values="DATA",
        out_raster=Reclassify2,
    )

    # Process: Expand (extension license: Spatial)
    arcpy.sa.Expand(
        in_raster=Reclassify2,
        number_cells=3,
        zone_values=[255],
        expand_method="MORPHOLOGICAL",
    )

    # Process: Raster to Polygon (license level: Basic) (Conversion tools)
    Raster_To_polygon = os.path.join(gdb_path, "interim_data_8b")
    with arcpy.EnvManager(outputMFlag="Disabled", outputZFlag="Disabled"):
        arcpy.conversion.RasterToPolygon(
            in_raster=Reclassify2,
            out_polygon_features=Raster_To_polygon,
            simplify="SIMPLIFY",
            raster_field="VALUE",
            create_multipart_features="SINGLE_OUTER_PART",
            max_vertices_per_feature=None,
        )

    # Process: Eliminate Polygon Part (license level: Standard) (Data management tools)
    eliminate_polyparts = os.path.join(gdb_path, "interim_data_9b")
    arcpy.management.EliminatePolygonPart(
        in_features=Raster_To_polygon,
        out_feature_class=eliminate_polyparts,
        condition="AREA",
        part_area="20 SquareMeters",
        part_area_percent=0,
        part_option="CONTAINED_ONLY",
    )

    # Process: RepairGeometry (license level: Standard) (Data management tools)
    try:
        arcpy.management.RepairGeometry(eliminate_polyparts)
    except:
        pass

    # Process: Dice (license level: Standard) (Data management tools)
    Dice = os.path.join(gdb_path, "interim_data_1c")
    arcpy.management.Dice(
        in_features=eliminate_polyparts, out_feature_class=Dice, vertex_limit=10000
    )

    # Process: PolygonToCenterline (extension license: Foundation)
    centerline = os.path.join(gdb_path, "interim_data_2c")
    arcpy.topographic.PolygonToCenterline(
        in_features=Dice, out_feature_class=centerline, connecting_features=[]
    )

    # Process: Trim Line (license level: Standard) (Editing tools)
    arcpy.edit.TrimLine(
        in_features=centerline, dangle_length="100 Meters", delete_shorts=True
    )[0]

    if str(Sharpe_Edges) == "true":
        # Process: Feature To Polygon (license level: Standard) (Data management tools)
        polygons_from_feature = os.path.join(gdb_path, "interim_data_3c")
        arcpy.management.FeatureToPolygon(
            in_features=centerline,
            out_feature_class=polygons_from_feature,
            cluster_tolerance="",
            attributes="ATTRIBUTES",
            label_features="",
        )

        # Process: Regularize Building Footprint (extension license: 3D)
        Output_polygons = os.path.join(gdb_path, "interim_data_4c")
        # cu39
        GPU_fail = False
        try:
            with arcpy.EnvManager(processorType="GPU"):
                arcpy.ddd.RegularizeBuildingFootprint(
                    in_features=polygons_from_feature,
                    out_feature_class=Output_polygons,
                    method="RIGHT_ANGLES_AND_DIAGONALS",
                    tolerance=2,
                    densification=1,
                    precision=0.1,
                    diagonal_penalty=0,
                    min_radius=0.1,
                    max_radius=1000000,
                )
        except:
            GPU_fail = True
            pass

        if GPU_fail:
            with arcpy.EnvManager(processorType="CPU"):
                arcpy.ddd.RegularizeBuildingFootprint(
                    in_features=polygons_from_feature,
                    out_feature_class=Output_polygons,
                    method="RIGHT_ANGLES_AND_DIAGONALS",
                    tolerance=2,
                    densification=1,
                    precision=0.1,
                    diagonal_penalty=0,
                    min_radius=0.1,
                    max_radius=1000000,
                )

        if str(roads_polyline) != "":
            # Process: Remove Overlap (license level: Basic) (Analysis tools)
            common_build_outfeatures = os.path.join(gdb_path, "interim_data_5c")
            arcpy.analysis.RemoveOverlapMultiple(
                in_features=Output_polygons,
                out_feature_class=common_build_outfeatures,
                method="THIESSEN",
                join_attributes="ALL",
            )

            # Process: Pairwise Integrate (license level: Basic) (Analysis tools)
            with arcpy.EnvManager(XYTolerance=tolerance):
                arcpy.analysis.PairwiseIntegrate(common_build_outfeatures, None)

            # Process: Pairwise Buffer (license level: Basic) (Analysis tools)
            buffer = os.path.join(gdb_path, "interim_data_6c")
            arcpy.analysis.PairwiseBuffer(
                in_features=road_copy,
                out_feature_class=buffer,
                buffer_distance_or_field=road_width,
                dissolve_option=None,
                dissolve_field=None,
                method="PLANAR",
                max_deviation=None,
            )

            # Process: Pairwise Erase (license level: Basic) (Analysis tools)
            copy_ft_mem_f = os.path.join(gdb_path, "interim_data_7c")
            arcpy.analysis.PairwiseErase(
                common_build_outfeatures, buffer, copy_ft_mem_f, None
            )

            # cu33
            # Process: CopyFeatures (license level: Standard) (Data management tools)
            try:
                arcpy.management.RepairGeometry(copy_ft_mem_f)
            except:
                pass
            with arcpy.EnvManager(outputCoordinateSystem=user_CS_sr):
                arcpy.management.CopyFeatures(
                    in_features=copy_ft_mem_f, out_feature_class=out_feature_class
                )

        else:
            # Process: Remove Overlap (license level: Basic) (Analysis tools)
            copy_ft_mem_e = os.path.join(gdb_path, "interim_data_8c")
            arcpy.analysis.RemoveOverlapMultiple(
                in_features=Output_polygons,
                out_feature_class=copy_ft_mem_e,
                method="THIESSEN",
                join_attributes="ALL",
            )

            # Process: Pairwise Integrate (license level: Basic) (Analysis tools)
            with arcpy.EnvManager(XYTolerance=tolerance):
                arcpy.analysis.PairwiseIntegrate(copy_ft_mem_e, None)

            # cu33
            # Process: CopyFeatures (license level: Standard) (Data management tools)
            try:
                arcpy.management.RepairGeometry(copy_ft_mem_e)
            except:
                pass
            with arcpy.EnvManager(outputCoordinateSystem=user_CS_sr):
                arcpy.management.CopyFeatures(
                    in_features=copy_ft_mem_e, out_feature_class=out_feature_class
                )

    else:
        # Process: Feature To Polygon (license level: Standard) (Data management tools)
        polygons_from_feature = os.path.join(gdb_path, "interim_data_9c")
        arcpy.management.FeatureToPolygon(
            in_features=centerline,
            out_feature_class=polygons_from_feature,
            cluster_tolerance="",
            attributes="ATTRIBUTES",
            label_features="",
        )

        if str(roads_polyline) != "":
            # Process: SimplifyPolygon (license level: Standard) (Cartography tools)
            common_build_outfeatures = os.path.join(gdb_path, "interim_data_1d")
            with arcpy.EnvManager(transferGDBAttributeProperties=False):
                arcpy.cartography.SimplifyPolygon(
                    in_features=polygons_from_feature,
                    out_feature_class=common_build_outfeatures,
                    algorithm="POINT_REMOVE",
                    tolerance="3 Meters",
                    minimum_area="5 SquareMeters",
                    error_option="RESOLVE_ERRORS",
                    collapsed_point_option="NO_KEEP",
                    in_barriers=[],
                )[0]

            # Process: Pairwise Buffer (license level: Basic) (Analysis tools)
            buffer = os.path.join(gdb_path, "interim_data_2d")
            arcpy.analysis.PairwiseBuffer(
                in_features=road_copy,
                out_feature_class=buffer,
                buffer_distance_or_field=road_width,
                dissolve_option=None,
                dissolve_field=None,
                method="PLANAR",
                max_deviation=None,
            )

            # Process: Pairwise Erase (license level: Basic) (Analysis tools)
            copy_ft_mem_d = os.path.join(gdb_path, "interim_data_3d")
            arcpy.analysis.PairwiseErase(
                common_build_outfeatures, buffer, copy_ft_mem_d, None
            )

            # cu33
            # Process: CopyFeatures (license level: Standard) (Data management tools)
            try:
                arcpy.management.RepairGeometry(copy_ft_mem_d)
            except:
                pass
            with arcpy.EnvManager(outputCoordinateSystem=user_CS_sr):
                arcpy.management.CopyFeatures(
                    in_features=copy_ft_mem_d, out_feature_class=out_feature_class
                )

        else:
            # Process: SimplifyPolygon (license level: Standard) (Cartography tools)
            copy_ft_mem_c = os.path.join(gdb_path, "interim_data_4d")
            with arcpy.EnvManager(transferGDBAttributeProperties=False):
                arcpy.cartography.SimplifyPolygon(
                    in_features=polygons_from_feature,
                    out_feature_class=copy_ft_mem_c,
                    algorithm="POINT_REMOVE",
                    tolerance="3 Meters",
                    minimum_area="5 SquareMeters",
                    error_option="RESOLVE_ERRORS",
                    collapsed_point_option="NO_KEEP",
                    in_barriers=[],
                )[0]

            # cu33
            # Process: CopyFeatures (license level: Standard) (Data management tools)
            try:
                arcpy.management.RepairGeometry(copy_ft_mem_c)
            except:
                pass
            with arcpy.EnvManager(outputCoordinateSystem=user_CS_sr):
                arcpy.management.CopyFeatures(
                    in_features=copy_ft_mem_c, out_feature_class=out_feature_class
                )

    # cu34
    del dd_rs
    arcpy.Delete_management(gdb_path)

    # cu30
    arcpy.CheckInExtension("ImageAnalyst")
    arcpy.CheckInExtension("Foundation")
    arcpy.CheckInExtension("Spatial")
    arcpy.CheckInExtension("3D")

    arcpy.env.addOutputsToMap = user_sett_addout_post
    arcpy.env.overwriteOutput = user_env_overwrite_post

    return "full_run"


# cu36
def polygon_postprocessing(interm_output_path, output_path, def_val_msg, model_name):
    # cu26
    arcpy.SetProgressorLabel(arcpy.GetIDMessage(260236))

    # cu27
    ex_regularize_method = arcpy.GetParameterAsText(20)
    regularize_tolerance = arcpy.GetParameterAsText(21)
    out_feature_class = output_path

    # cu37
    if ex_regularize_method in [
        "Right Angles",
        "right angles",
        "right_angles",
        "Right_Angles",
        "RIGHT ANGLES",
        "RIGHT_ANGLES",
    ]:
        regularize_method = "Right Angles"
    if ex_regularize_method in [
        "Right Angles and Diagonals",
        "right angles and diagonals",
        "right_angles_and_diagonals",
        "Right_Angles_and_Diagonals",
        "RIGHT ANGLES AND DIAGONALS",
        "RIGHT_ANGLES_AND_DIAGONALS",
    ]:
        regularize_method = "Right Angles and Diagonals"
    if ex_regularize_method in [
        "Any Angles",
        "any angles",
        "any_angles",
        "Any_Angles",
        "ANY ANGLES",
        "ANY_ANGLES",
    ]:
        regularize_method = "Any Angles"
    if ex_regularize_method in ["Circle", "circle", "CIRCLE"]:
        regularize_method = "Circle"

    # cu28
    if def_val_msg is True:
        if (
            str(regularize_method) == "Right Angles"
            and str(regularize_tolerance) == "1 Meters"
        ):
            arcpy.AddIDMessage("INFORMATIVE", 260248)

    # cu29
    if not arcpy.Exists(interm_output_path):
        return "no_input_data"

    # cu180
    desc = arcpy.Describe(interm_output_path)
    if desc.shapeType not in ["Polygon"]:
        if model_name != "":
            arcpy.AddIDMessage("WARNING", 260237, str(model_name))
            arcpy.AddIDMessage("WARNING", 260127)
        return "known_exit"

    # cu149
    data_check = arcpy.GetCount_management(interm_output_path)
    count = int(data_check.getOutput(0))
    if count == 0:
        if model_name != "":
            arcpy.AddIDMessage("WARNING", 260272, str(model_name))
        return "blank_input_data"

    # cu38
    regularize_method = regularize_method.replace(" ", "_")
    regularize_method = regularize_method.upper()
    if regularize_method == "ANY_ANGLES":
        regularize_method = "ANY_ANGLE"

    # cu30
    arcpy.CheckOutExtension("ImageAnalyst")
    arcpy.CheckOutExtension("3D")

    user_sett_addout_post = arcpy.env.addOutputsToMap
    arcpy.env.addOutputsToMap = False
    user_env_overwrite_post = arcpy.env.overwriteOutput
    arcpy.env.overwriteOutput = True

    # cu31
    interm_gdb_post_p_name = os.path.basename(tempfile.TemporaryDirectory().name)
    gdb_path = os.path.join(tempfile.gettempdir(), (interm_gdb_post_p_name + ".gdb"))
    arcpy.management.CreateFileGDB(
        tempfile.gettempdir(), arcpy.ValidateTableName(interm_gdb_post_p_name)
    )
    workspace_path = os.path.join(tempfile.gettempdir(), interm_gdb_post_p_name)

    # cu33
    # Process: CopyFeatures (license level: Standard) (Data management tools)
    user_CS_typ = ""
    user_CS_WKT = ""
    user_CS_sr = arcpy.SpatialReference()
    user_CS_typ = str(arcpy.Describe(interm_output_path).spatialReference.type)
    user_CS_WKT = str(
        arcpy.Describe(interm_output_path).spatialReference.exportToString()
    )
    user_CS_sr = arcpy.SpatialReference(text=user_CS_WKT)
    PCS_WKT_sr = arcpy.SpatialReference(
        text='PROJCS["WGS_1984_Web_Mercator_Auxiliary_Sphere",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Mercator_Auxiliary_Sphere"],PARAMETER["False_Easting",0.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",0.0],PARAMETER["Standard_Parallel_1",0.0],PARAMETER["Auxiliary_Sphere_Type",0.0],UNIT["Meter",1.0]]'
    )

    copy_ft_mem_j = os.path.join(gdb_path, "interim_data_5d")

    # cu33
    try:
        with arcpy.EnvManager(outputCoordinateSystem=PCS_WKT_sr):
            arcpy.management.CopyFeatures(
                in_features=interm_output_path, out_feature_class=copy_ft_mem_j
            )
    except:
        copy_ft_mem_j = interm_output_path
        pass

    try:
        arcpy.management.RepairGeometry(copy_ft_mem_j)
    except:
        pass

    # cu144
    try:
        values = [row[0] for row in arcpy.da.SearchCursor(copy_ft_mem_j, "Class")]
        class_name_poly = str(values[0])
    except:
        pass

    # Process: Regularize Building Footprint (extension license: 3D)
    reg_building_path = os.path.join(gdb_path, "interim_data_6d")
    # cu39
    GPU_fail = False
    try:
        with arcpy.EnvManager(processorType="GPU"):
            arcpy.ddd.RegularizeBuildingFootprint(
                in_features=copy_ft_mem_j,
                out_feature_class=reg_building_path,
                method=regularize_method,
                tolerance=regularize_tolerance,
            )
    except:
        GPU_fail = True
        pass

    if GPU_fail:
        with arcpy.EnvManager(processorType="CPU"):
            arcpy.ddd.RegularizeBuildingFootprint(
                in_features=copy_ft_mem_j,
                out_feature_class=reg_building_path,
                method=regularize_method,
                tolerance=regularize_tolerance,
            )

    # Process: PairwiseDissolve (license level: Basic) (Analysis tools)
    copy_ft_mem_k = os.path.join(gdb_path, "interim_data_7d")
    arcpy.analysis.PairwiseDissolve(
        in_features=reg_building_path,
        out_feature_class=copy_ft_mem_k,
        dissolve_field=None,
        statistics_fields=None,
        multi_part="SINGLE_PART",
    )

    # cu145
    try:
        arcpy.management.AddField(copy_ft_mem_k, "Class", "TEXT", field_length=1024)
        arcpy.management.CalculateField(
            in_table=copy_ft_mem_k,
            field="Class",
            expression=f"'{class_name_poly}'",
            expression_type="PYTHON3",
            code_block="",
            field_type="TEXT",
            enforce_domains="NO_ENFORCE_DOMAINS",
        )
    except:
        pass
    # cu33
    # Process: CopyFeatures (license level: Standard) (Data management tools)
    try:
        arcpy.management.RepairGeometry(copy_ft_mem_k)
    except:
        pass
    with arcpy.EnvManager(outputCoordinateSystem=user_CS_sr):
        arcpy.management.CopyFeatures(
            in_features=copy_ft_mem_k, out_feature_class=out_feature_class
        )

    # cu34
    arcpy.Delete_management(gdb_path)

    # cu30
    arcpy.CheckInExtension("ImageAnalyst")
    arcpy.CheckInExtension("3D")

    arcpy.env.addOutputsToMap = user_sett_addout_post
    arcpy.env.overwriteOutput = user_env_overwrite_post

    return "full_run"


def polygon_segmentation(interm_output_path, output_path, def_val_msg, model_name):
    arcpy.SetProgressorLabel(arcpy.GetIDMessage(260371))

    sam_in_image = arcpy.GetParameterAsText(0)
    sam_aoi = arcpy.GetParameterAsText(4)
    if sam_aoi == "#":
        sam_aoi = ""
    sam_prompt = arcpy.GetParameterAsText(22)
    out_feature_class = output_path

    # cu150
    if def_val_msg is True:
        if str(sam_prompt) == "None":
            arcpy.AddIDMessage("INFORMATIVE", 260305)

    # cu151
    if str(sam_prompt) == "None":
        return "SAM_none_exit"

    # cu152
    if not arcpy.Exists(interm_output_path):
        return "no_input_data"

    # cu153
    data_check = arcpy.GetCount_management(interm_output_path)
    count = int(data_check.getOutput(0))
    if count == 0:
        if model_name != "":
            arcpy.AddIDMessage("WARNING", 260272, str(model_name))
        return "blank_input_data"

    # cu154
    desc = arcpy.Describe(interm_output_path)
    if desc.shapeType not in ["Polygon"]:
        arcpy.AddIDMessage("WARNING", 260222, str(model_name))
        return "known_exit"

    arcpy.CheckOutExtension("ImageAnalyst")

    user_sett_addout_post = arcpy.env.addOutputsToMap
    arcpy.env.addOutputsToMap = False
    user_env_overwrite_post = arcpy.env.overwriteOutput
    arcpy.env.overwriteOutput = True

    # cu155
    sam_emd_loc = ""
    sam_offline = str(offline_sam_path())
    net_inactive_flag = net_inactive()
    local_copy_exist = False
    base_pth = os.getenv("LOCALAPPDATA")
    cache_loc = os.path.join(base_pth, "ESRI", "DeepLearning")
    sam_dlpk_file = os.path.join(sam_offline, "PolygonSegmentation.dlpk")
    pathlib.Path(sam_offline).mkdir(parents=True, exist_ok=True)
    if arcpy.Exists(sam_dlpk_file):
        local_copy_exist = True
        msg2 = arcpy.GetIDMessage(260274)
        sam_name2 = arcpy.GetIDMessage(260304)
        prog2 = msg2 + sam_name2
        arcpy.SetProgressorLabel(prog2)

    if net_inactive_flag is True:
        if local_copy_exist is True:
            sam_emd_loc = sam_dlpk_file
            offline_model_folder = sam_offline
            temp_emd = extract_emd(sam_emd_loc, offline_model_folder)
        else:
            arcpy.AddIDMessage("WARNING", 260021, str(model_name))
            return "known_exit"
    else:
        if local_copy_exist is True:
            sam_emd_loc = sam_dlpk_file
            offline_model_folder = sam_offline
            temp_emd = extract_emd(sam_emd_loc, offline_model_folder)

        else:
            try:
                # cu156
                out_model_folder = sam_offline
                msg1 = arcpy.GetIDMessage(260257)
                sam_name = arcpy.GetIDMessage(260304)
                msg = msg1 + sam_name
                arcpy.SetProgressorLabel(msg)

                from arcgis.gis import GIS

                model_id = "7e1485437b7b424597ea920271dab502"
                gis = GIS(set_active=False)
                data_item = gis.content.get(model_id)
                data_item.download(save_path=out_model_folder)
                dlpk_path = glob.glob(out_model_folder + "/*.dlpk")

                temp_emd = extract_emd(
                    zip_loc=dlpk_path[0], extract_loc=out_model_folder
                )
                sam_emd_loc = dlpk_path[0]
            except Exception as e:
                arcpy.AddIDMessage("WARNING", 260023, str(model_name))
                arcpy.AddIDMessage("WARNING", 260269, str(e))
                return "known_exit"

    arcpy.SetProgressorLabel(arcpy.GetIDMessage(260371))

    # cu158
    interm_gdb_name = os.path.basename(tempfile.TemporaryDirectory().name)
    gdb_path = os.path.join(tempfile.gettempdir(), (interm_gdb_name + ".gdb"))
    arcpy.management.CreateFileGDB(
        tempfile.gettempdir(), arcpy.ValidateTableName(interm_gdb_name)
    )
    workspace_path = os.path.join(tempfile.gettempdir(), interm_gdb_name)

    # Process: CopyFeatures (license level: Standard) (Data management tools)
    user_CS_typ = ""
    user_CS_WKT = ""
    user_CS_sr = arcpy.SpatialReference()
    user_CS_typ = str(arcpy.Describe(interm_output_path).spatialReference.type)
    user_CS_WKT = str(
        arcpy.Describe(interm_output_path).spatialReference.exportToString()
    )
    user_CS_sr = arcpy.SpatialReference(text=user_CS_WKT)
    PCS_WKT_sr = arcpy.SpatialReference(
        text='PROJCS["WGS_1984_Web_Mercator_Auxiliary_Sphere",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Mercator_Auxiliary_Sphere"],PARAMETER["False_Easting",0.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",0.0],PARAMETER["Standard_Parallel_1",0.0],PARAMETER["Auxiliary_Sphere_Type",0.0],UNIT["Meter",1.0]]'
    )

    copy_ft_mem_r = os.path.join(gdb_path, "interim_data_8d")

    try:
        with arcpy.EnvManager(outputCoordinateSystem=PCS_WKT_sr):
            arcpy.management.CopyFeatures(
                in_features=interm_output_path, out_feature_class=copy_ft_mem_r
            )
    except:
        copy_ft_mem_r = interm_output_path
        pass
    try:
        arcpy.management.RepairGeometry(copy_ft_mem_r)
    except:
        pass

    arcpy.SetProgressorLabel(arcpy.GetIDMessage(260371))

    # Process: CopyRaster_management (license level: Standard) (Data management tools)
    user_CS_typ = ""
    user_CS_WKT = ""
    user_CS_sr = arcpy.SpatialReference()
    user_CS_typ = str(arcpy.Describe(sam_in_image).spatialReference.type)
    user_CS_WKT = str(arcpy.Describe(sam_in_image).spatialReference.exportToString())
    user_CS_sr = arcpy.SpatialReference(text=user_CS_WKT)
    PCS_WKT_sr = arcpy.SpatialReference(
        text='PROJCS["WGS_1984_Web_Mercator_Auxiliary_Sphere",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Mercator_Auxiliary_Sphere"],PARAMETER["False_Easting",0.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",0.0],PARAMETER["Standard_Parallel_1",0.0],PARAMETER["Auxiliary_Sphere_Type",0.0],UNIT["Meter",1.0]]'
    )

    copy_rs_mem_s = os.path.join(gdb_path, "interim_data_9d")

    try:
        with arcpy.EnvManager(outputCoordinateSystem=PCS_WKT_sr):
            arcpy.CopyRaster_management(
                in_raster=sam_in_image,
                out_rasterdataset=copy_rs_mem_s,
                pixel_type="8_BIT_UNSIGNED",
                scale_pixel_value="ScalePixelValue",
            )
    except:
        copy_rs_mem_s = sam_in_image
        pass

    arcpy.SetProgressorLabel(arcpy.GetIDMessage(260371))

    if model_name in sentinel_one_model_list:
        sar_sam_s = os.path.join(gdb_path, "interim_data_1e")
        sentinel_one_preprocessing(model_name, sam_in_image, sar_sam_s, sam_aoi)
        copy_rs_mem_s = sar_sam_s

    # cu159
    in_raster_sam_check = str(
        arcpy.GetRasterProperties_management(copy_rs_mem_s, "BANDCOUNT")
    )

    # cu160
    if in_raster_sam_check not in ["3"]:
        arcpy.AddIDMessage("WARNING", 260020, str(model_name))
        arcpy.Delete_management(gdb_path)
        return "known_exit"

    # cu161
    fields_ft = arcpy.ListFields(copy_ft_mem_r)
    val_fd = []
    for fd in fields_ft:
        val_fd.append(str(fd.name))

    # cu162
    if "Class" not in val_fd:
        arcpy.AddIDMessage("WARNING", 260273, str(model_name))
        arcpy.Delete_management(gdb_path)
        return "known_exit"

    sam_class_gdb_name = os.path.basename(tempfile.TemporaryDirectory().name)
    sam_class_gdb_path = os.path.join(
        tempfile.gettempdir(), (sam_class_gdb_name + ".gdb")
    )
    arcpy.management.CreateFileGDB(
        tempfile.gettempdir(), arcpy.ValidateTableName(sam_class_gdb_name)
    )
    workspace_path = os.path.join(tempfile.gettempdir(), sam_class_gdb_name)

    sam_result_gdb_name = os.path.basename(tempfile.TemporaryDirectory().name)
    sam_result_gdb_path = os.path.join(
        tempfile.gettempdir(), (sam_result_gdb_name + ".gdb")
    )
    arcpy.management.CreateFileGDB(
        tempfile.gettempdir(), arcpy.ValidateTableName(sam_result_gdb_name)
    )
    workspace_path = os.path.join(tempfile.gettempdir(), sam_result_gdb_name)

    arcpy.SetProgressorLabel(arcpy.GetIDMessage(260371))

    # cu161
    arcpy.analysis.SplitByAttributes(copy_ft_mem_r, sam_class_gdb_path, "Class")

    # cu162
    f_path_list = []
    walk = arcpy.da.Walk(sam_class_gdb_path, topdown=True, datatype="FeatureClass")

    # cu163
    for dirpath, dirnames, filenames in walk:
        for filename in filenames:
            f_path_list.append(os.path.join(dirpath, filename))

    output_list_sam = []

    # cu163
    for suffix, sam_object_path in enumerate(f_path_list):
        loop_feature_class = sam_object_path

        sam_interim_gdb_name = os.path.basename(tempfile.TemporaryDirectory().name)
        sam_interim_gdb_path = os.path.join(
            tempfile.gettempdir(), (sam_interim_gdb_name + ".gdb")
        )
        arcpy.management.CreateFileGDB(
            tempfile.gettempdir(), arcpy.ValidateTableName(sam_interim_gdb_name)
        )
        workspace_path = os.path.join(tempfile.gettempdir(), sam_interim_gdb_name)

        # cu166
        values = [row[0] for row in arcpy.da.SearchCursor(loop_feature_class, "Class")]
        class_name_sam_loop = str(values[0])

        sam_obj_name = "sam_obj_class_file" + "_" + str(suffix)
        sam_perclass_output = os.path.join(sam_result_gdb_path, sam_obj_name)

        # cu169
        copy_ft_mem_r1 = os.path.join(sam_interim_gdb_path, "interim_data_2e")
        arcpy.analysis.PairwiseDissolve(
            in_features=loop_feature_class, out_feature_class=copy_ft_mem_r1
        )

        fields_fr_tl = arcpy.ListFields(copy_ft_mem_r1)
        val_tt = []
        for fd in fields_fr_tl:
            val_tt.append(str(fd.name))

        # cu172
        copy_ft_mem_t = os.path.join(sam_interim_gdb_path, "interim_data_3e")
        with arcpy.EnvManager(
            outputCoordinateSystem=PCS_WKT_sr,
            snapRaster=copy_rs_mem_s,
            cellSize=copy_rs_mem_s,
            extent=sam_aoi,
        ):
            arcpy.conversion.PolygonToRaster(
                in_features=copy_ft_mem_r1,
                value_field=val_tt[0],
                out_rasterdataset=copy_ft_mem_t,
                cell_assignment="CELL_CENTER",
                priority_field="NONE",
                cellsize=copy_rs_mem_s,
                build_rat="BUILD",
            )

        in_raster_depth_code = str(
            arcpy.GetRasterProperties_management(copy_rs_mem_s, "VALUETYPE")
        )

        copy_ft_mem_u = os.path.join(sam_interim_gdb_path, "interim_data_4e")
        with arcpy.EnvManager(outputCoordinateSystem=PCS_WKT_sr):
            arcpy.CopyRaster_management(
                in_raster=copy_ft_mem_t,
                out_rasterdataset=copy_ft_mem_u,
                pixel_type=depth_map[in_raster_depth_code],
            )

        # cu177
        in_raster_band_names = arcpy.Raster(copy_rs_mem_s).bandNames

        copy_ft_mem_w = os.path.join(sam_interim_gdb_path, "interim_data_5e")
        band1 = os.path.join(copy_rs_mem_s, (str(in_raster_band_names[0])))
        band2 = os.path.join(copy_rs_mem_s, (str(in_raster_band_names[1])))
        band3 = os.path.join(copy_rs_mem_s, (str(in_raster_band_names[2])))
        ext_raster = str(band1) + ";" + str(band2) + ";" + str(band3)
        arcpy.management.CompositeBands(in_rasters=ext_raster, out_raster=copy_ft_mem_w)

        copy_ft_mem_v = os.path.join(sam_interim_gdb_path, "interim_data_6e")
        comp_raster = str(copy_ft_mem_w) + ";" + str(copy_ft_mem_u)
        arcpy.management.CompositeBands(
            in_rasters=comp_raster, out_raster=copy_ft_mem_v
        )

        arcpy.management.CreateRasterDataset(
            out_path=sam_interim_gdb_path,
            out_name="interim_data_7e",
            pixel_type=depth_map[in_raster_depth_code],
            raster_spatial_reference=PCS_WKT_sr,
            number_of_bands=4,
        )

        arcpy.SetProgressorLabel(arcpy.GetIDMessage(260371))

        trg_ras = os.path.join(sam_interim_gdb_path, "interim_data_7e")
        arcpy.management.Mosaic(inputs=copy_ft_mem_v, target=trg_ras)

        arcpy.SetProgressorLabel(arcpy.GetIDMessage(260371))

        copy_ft_mem_x = os.path.join(sam_interim_gdb_path, "interim_data_8e")

        sam_raster_fl = arcpy.ia.Raster(trg_ras)
        sam_raster_fl.renameBand("Band_4", "sam_band")

        with arcpy.EnvManager(outputCoordinateSystem=PCS_WKT_sr):
            arcpy.CopyRaster_management(
                in_raster=sam_raster_fl,
                out_rasterdataset=copy_ft_mem_x,
                pixel_type=depth_map[in_raster_depth_code],
            )

        # cu180
        sam_arg = ""
        if str(sam_prompt) == "Centroid":
            sam_arg = "center"
        if str(sam_prompt) == "Bounding Box":
            sam_arg = "box"

        arcpy.SetProgressorLabel(arcpy.GetIDMessage(260371))
        copy_ft_mem_y = os.path.join(sam_interim_gdb_path, "interim_data_9e")

        # cu181
        try:
            if temp_emd["ModelType"] in ["ObjectDetection", "InstanceDetection"]:
                with arcpy.EnvManager(
                    addOutputsToMap=False,
                    processorType="GPU",
                    cellSize=copy_rs_mem_s,
                    extent=sam_aoi,
                ):
                    arcpy.ia.DetectObjectsUsingDeepLearning(
                        in_raster=copy_ft_mem_x,
                        out_detected_objects=copy_ft_mem_y,
                        in_model_definition=sam_emd_loc,
                        arguments=f"prompt {sam_arg}",
                    )

                    # ce33
                    with arcpy.EnvManager(outputCoordinateSystem=user_CS_sr):
                        arcpy.management.CopyFeatures(
                            in_features=copy_ft_mem_y,
                            out_feature_class=sam_perclass_output,
                        )
                    # ce34
                    try:
                        arcpy.management.RepairGeometry(sam_perclass_output)
                    except:
                        pass

                    # cu183
                    copy_ft_data = os.path.join(sam_interim_gdb_path, "interim_data_1f")
                    arcpy.analysis.PairwiseDissolve(
                        in_features=sam_perclass_output,
                        out_feature_class=copy_ft_data,
                        dissolve_field=None,
                        statistics_fields=None,
                        multi_part="SINGLE_PART",
                    )

                    # cu186
                    try:
                        arcpy.management.AddField(
                            copy_ft_data, "Class", "TEXT", field_length=1024
                        )
                        arcpy.management.CalculateField(
                            in_table=copy_ft_data,
                            field="Class",
                            expression=f"'{class_name_sam_loop}'",
                            expression_type="PYTHON3",
                            code_block="",
                            field_type="TEXT",
                            enforce_domains="NO_ENFORCE_DOMAINS",
                        )
                    except:
                        pass

        except Exception as e:
            if "CUDA out of memory" in str(e):
                arcpy.AddIDMessage("WARNING", 260007)
            else:
                arcpy.AddIDMessage("WARNING", 260037)
                arcpy.AddIDMessage("WARNING", 260269, str(e))

            del in_raster_band_names
            del sam_raster_fl
            arcpy.Delete_management(gdb_path)
            arcpy.Delete_management(sam_result_gdb_path)
            arcpy.Delete_management(sam_interim_gdb_path)
            arcpy.Delete_management(sam_class_gdb_path)
            return "known_exit"

        output_list_sam.append(str(copy_ft_data))

    # cu190
    arcpy.management.Merge(output_list_sam, out_feature_class)

    try:
        arcpy.management.RepairGeometry(out_feature_class)
    except:
        pass
    del in_raster_band_names
    del sam_raster_fl
    arcpy.Delete_management(gdb_path)
    arcpy.Delete_management(sam_result_gdb_path)
    arcpy.Delete_management(sam_interim_gdb_path)
    arcpy.Delete_management(sam_class_gdb_path)

    arcpy.CheckInExtension("ImageAnalyst")

    arcpy.env.addOutputsToMap = user_sett_addout_post
    arcpy.env.overwriteOutput = user_env_overwrite_post

    return "full_run"


# cu40
third_party_list = ["sam_roads", "DeepForest", "SAM"]

# cu43
sentinel_one_model_list = [
    "SHIP DETECTION (SAR)",
    "WATER BODY EXTRACTION (SAR) - USA",
    "OIL SPILL DETECTION (SAR)",
]

# cu146
sentinel_two_model_list = [
    "AGRICULTURAL FIELD DELINEATION",
    "CLOUD MASK GENERATION (SENTINEL-2)",
    "LAND COVER CLASSIFICATION (SENTINEL-2)",
    "SOLAR PHOTOVOLTAIC PARK CLASSIFICATION - GLOBAL",
    "WELL PAD DETECTION - PERMIAN BASIN",
    "HUMAN SETTLEMENTS CLASSIFICATION (SENTINEL-2)",
]

# cu147
model_list_16_bit = [
    "AGRICULTURAL FIELD DELINEATION",
    "CLOUD MASK GENERATION (SENTINEL-2)",
    "LAND COVER CLASSIFICATION (SENTINEL-2)",
    "SOLAR PHOTOVOLTAIC PARK CLASSIFICATION - GLOBAL",
    "WELL PAD DETECTION - PERMIAN BASIN",
    "HUMAN SETTLEMENTS CLASSIFICATION (SENTINEL-2)",
    "HUMAN SETTLEMENTS CLASSIFICATION (LANDSAT 8)",
    "LAND COVER CLASSIFICATION (LANDSAT 8)",
    "MANGROVE CLASSIFICATION (LANDSAT 8)",
]

# cu148
prithvi_list = [
    "PRITHVI - CROP CLASSIFICATION",
    "PRITHVI - FLOOD SEGMENTATION",
    "PRITHVI - BURN SCARS SEGMENTATION",
]

# cu41
auto_bt_sp_list = [
    "FullyConnectedNetwork",
    "MLModel",
    "TimeSeriesModel",
    "SiamMask",
    "Track",
    "Embeddings",
    "AutoML",
    "AutoDL",
    "ImageryModel",
    "EfficientDet",
    "PSETAE",
    "EntityRecognizer",
    "SequenceToSequence",
    "QuestionAnswering",
    "FillMask",
    "TextSummarizer",
    "TextGenerator",
    "TextTranslator",
    "ZeroShotClassifier",
    "_SpacyEntityRecognizer",
    "_TransformerEntityRecognizer",
    "TextClassifier",
    "MMDetection3D",
    "PointCNN",
    "SQNSeg",
    "RandLANet",
]

# cu42
pretrained_model_store = {
    "ARCTIC SEAL DETECTION": {
        "id": "bb05ab8f3b7c4ec79eca613c9273ef6f",
        "RecommendedCellSize": "5",
        "owner": "esri_analytics",
        "batch_size": "1",
        "modified": 1661376406000,
        "name": "ArcticSealDetection.dlpk",
        "title": "Arctic Seal Detection",
        "emd": {
            "ModelType": "ObjectDetection",
            "InferenceFunction": "ArcGISObjectDetector.py",
            "ExtractBands": [0, 1, 2],
            "Classes": [{"Value": 1, "Name": "1", "Color": [131, 119, 109]}],
            "MinCellSize": {"x": 3, "y": 3, "spatialReference": {"wkid": None}},
            "MaxCellSize": {"x": 10, "y": 10, "spatialReference": {"wkid": None}},
            "ModelFile": "ArcticSealDetection.pth",
            "ImageHeight": 256,
            "ImageWidth": 256,
            "ImageSpaceUsed": "MAP_SPACE",
            "ModelName": "FasterRCNN",
        },
        "properties": "None",
        "postprocessing_workflow": "Polygon Segmentation",
        "thresh": 0.5,
        "nms_ratio": 0.15,
        "SAM_segmentation": "False",
    },
    "BUILDING FOOTPRINT EXTRACTION - AFRICA": {
        "id": "979cb0cf938946bfb8bb2f41cf9f9795",
        "RecommendedCellSize": "40",
        "owner": "esri_analytics",
        "batch_size": "1",
        "modified": 1661375530000,
        "name": "BuildingFootprintExtraction_Africa.dlpk",
        "title": "Building Footprint Extraction - Africa",
        "emd": {
            "ModelType": "InstanceDetection",
            "InferenceFunction": "ArcGISInstanceDetector.py",
            "ExtractBands": [0, 1, 2],
            "Classes": [{"Value": 1, "Name": "1", "Color": [137, 102, 55]}],
            "MinCellSize": {"x": 10, "y": 10, "spatialReference": {"wkid": None}},
            "MaxCellSize": {"x": 45, "y": 45, "spatialReference": {"wkid": None}},
            "ModelFile": "BuildingFootprintExtraction_Africa.pth",
            "ImageHeight": 400,
            "ImageWidth": 400,
            "ImageSpaceUsed": "MAP_SPACE",
            "ModelName": "MaskRCNN",
        },
        "properties": "None",
        "postprocessing_workflow": "Polygon Regularization",
        "thresh": 0.5,
        "nms_ratio": None,
        "SAM_segmentation": "True",
    },
    "BUILDING FOOTPRINT EXTRACTION - AUSTRALIA": {
        "id": "4e38dec1577b4b7da5365294d8a66534",
        "RecommendedCellSize": "30",
        "owner": "esri_analytics",
        "batch_size": "1",
        "modified": 1661376212000,
        "name": "BuildingFootprintExtraction_Australia.dlpk",
        "title": "Building Footprint Extraction - Australia",
        "emd": {
            "ModelType": "InstanceDetection",
            "InferenceFunction": "ArcGISInstanceDetector.py",
            "ExtractBands": [0, 1, 2],
            "Classes": [{"Value": 1, "Name": "Undefined", "Color": [3, 134, 176]}],
            "MinCellSize": {"x": 10, "y": 10, "spatialReference": {"wkid": None}},
            "MaxCellSize": {"x": 45, "y": 45, "spatialReference": {"wkid": None}},
            "ModelFile": "BuildingFootprintExtraction_Australia.pth",
            "ImageHeight": 512,
            "ImageWidth": 512,
            "ImageSpaceUsed": "MAP_SPACE",
            "ModelName": "MaskRCNN",
        },
        "properties": "None",
        "postprocessing_workflow": "Polygon Regularization",
        "thresh": 0.5,
        "nms_ratio": None,
        "SAM_segmentation": "True",
    },
    "BUILDING FOOTPRINT EXTRACTION - CHINA": {
        "id": "fdfc8a925af740a5a4b01061a2d01d09",
        "RecommendedCellSize": "25",
        "owner": "esri_analytics",
        "batch_size": "1",
        "modified": 1663564210000,
        "name": "BuildingFootprintExtraction_China.dlpk",
        "title": "Building Footprint Extraction - China",
        "emd": {
            "ModelType": "InstanceDetection",
            "InferenceFunction": "ArcGISInstanceDetector.py",
            "ExtractBands": [0, 1, 2],
            "Classes": [{"Value": 1, "Name": "Building", "Color": [155, 139, 198]}],
            "MinCellSize": {"x": 15, "y": 15, "spatialReference": {"wkid": None}},
            "MaxCellSize": {"x": 30, "y": 30, "spatialReference": {"wkid": None}},
            "ModelFile": "BuildingFootprintExtraction_China.pth",
            "ImageHeight": 1024,
            "ImageWidth": 1024,
            "ImageSpaceUsed": "MAP_SPACE",
            "ModelName": "MaskRCNN",
        },
        "properties": "None",
        "postprocessing_workflow": "Polygon Regularization",
        "thresh": 0.2,
        "nms_ratio": None,
        "SAM_segmentation": "True",
    },
    "BUILDING FOOTPRINT EXTRACTION - USA": {
        "id": "a6857359a1cd44839781a4f113cd5934",
        "RecommendedCellSize": "30",
        "owner": "esri_analytics",
        "batch_size": "1",
        "modified": 1661374928000,
        "name": "usa_building_footprints.dlpk",
        "title": "Building Footprint Extraction - USA",
        "emd": {
            "ModelType": "InstanceDetection",
            "InferenceFunction": "ArcGISInstanceDetector.py",
            "ExtractBands": [0, 1, 2],
            "Classes": [{"Value": 1, "Name": "1", "Color": [187, 194, 137]}],
            "ModelFile": "usa_building_footprints.pth",
            "MinCellSize": {"x": 10, "y": 10, "spatialReference": {"wkid": None}},
            "MaxCellSize": {"x": 45, "y": 45, "spatialReference": {"wkid": None}},
            "ImageHeight": 512,
            "ImageWidth": 512,
            "ImageSpaceUsed": "MAP_SPACE",
            "ModelName": "MaskRCNN",
        },
        "properties": "None",
        "postprocessing_workflow": "Polygon Regularization",
        "thresh": 0.7,
        "nms_ratio": 0.3,
        "SAM_segmentation": "True",
    },
    "CAR DETECTION - USA": {
        "id": "cfc57b507f914d1593f5871bf0d52999",
        "RecommendedCellSize": "15",
        "owner": "esri_analytics",
        "batch_size": "8",
        "modified": 1661375239000,
        "name": "CarDetection_USA.dlpk",
        "title": "Car Detection - USA",
        "emd": {
            "ModelType": "InstanceDetection",
            "InferenceFunction": "ArcGISInstanceDetector.py",
            "ExtractBands": [0, 1, 2],
            "Classes": [{"Value": 2, "Name": "2", "Color": [12, 62, 153]}],
            "ModelFile": "CarDetection_USA.pth",
            "ImageHeight": 400,
            "ImageWidth": 400,
            "MinCellSize": {"x": 5, "y": 5, "spatialReference": {"wkid": None}},
            "MaxCellSize": {"x": 25, "y": 25, "spatialReference": {"wkid": None}},
            "ImageSpaceUsed": "MAP_SPACE",
            "ModelName": "MaskRCNN",
        },
        "properties": "None",
        "postprocessing_workflow": "Polygon Segmentation",
        "thresh": 0.3,
        "nms_ratio": None,
        "SAM_segmentation": "False",
    },
    "CLOUD MASK GENERATION (SENTINEL-2)": {
        "id": "1e1ec9602f4743108708ccdf362e3c48",
        "RecommendedCellSize": "1000",
        "owner": "esri_analytics",
        "batch_size": "4",
        "modified": 1661376502000,
        "name": "cloud_mask.dlpk",
        "title": "Cloud Mask Generation (Sentinel-2)",
        "emd": {
            "ModelType": "ImageClassification",
            "InferenceFunction": "ArcGISImageClassifier.py",
            "ExtractBands": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
            "Classes": [
                {"Value": 1, "Name": "Low Density", "Color": [14, 197, 70]},
                {"Value": 2, "Name": "Medium Density", "Color": [249, 221, 7]},
                {"Value": 3, "Name": "High Density", "Color": [194, 82, 60]},
            ],
            "MinCellSize": {"x": 800, "y": 800, "spatialReference": {"wkid": None}},
            "MaxCellSize": {"x": 2000, "y": 2000, "spatialReference": {"wkid": None}},
            "ModelFile": "cloud_mask.pth",
            "ImageHeight": 256,
            "ImageWidth": 256,
            "ImageSpaceUsed": "MAP_SPACE",
            "ModelName": "UnetClassifier",
        },
        "properties": "None",
        "postprocessing_workflow": "None",
        "thresh": None,
        "nms_ratio": None,
        "SAM_segmentation": "False",
    },
    "ELEPHANT DETECTION": {
        "id": "4976292298c440e686aa339e52da2dbb",
        "RecommendedCellSize": "13",
        "owner": "esri_analytics",
        "batch_size": "1",
        "modified": 1663222972000,
        "name": "ElephantDetection.dlpk",
        "title": "Elephant Detection",
        "emd": {
            "ModelType": "ObjectDetection",
            "InferenceFunction": "ArcGISObjectDetector.py",
            "ExtractBands": [0, 1, 2],
            "Classes": [{"Value": 1, "Name": "1", "Color": [195, 216, 204]}],
            "MinCellSize": {"x": 3, "y": 3, "spatialReference": {"wkid": None}},
            "MaxCellSize": {"x": 18, "y": 18, "spatialReference": {"wkid": None}},
            "ModelFile": "ElephantDetection.pth",
            "ImageHeight": 512,
            "ImageWidth": 512,
            "ImageSpaceUsed": "MAP_SPACE",
            "ModelName": "FasterRCNN",
        },
        "properties": "None",
        "postprocessing_workflow": "Polygon Segmentation",
        "thresh": 0.5,
        "nms_ratio": 0.5,
        "SAM_segmentation": "False",
    },
    "HIGH RESOLUTION LAND COVER CLASSIFICATION - USA": {
        "id": "a10f46a8071a4318bcc085dae26d7ee4",
        "RecommendedCellSize": "100",
        "owner": "esri_analytics",
        "batch_size": "1",
        "modified": 1661375389000,
        "name": "HighResolutionLandCoverClassification_USA.dlpk",
        "title": "High Resolution Land Cover Classification - USA",
        "emd": {
            "ModelType": "ImageClassification",
            "InferenceFunction": "HighResolutionLandCoverClassification_USA_ArcGISImageClassifier.py",
            "ExtractBands": [0, 1, 2],
            "Classes": [
                {"Value": 1, "Name": "Water", "Color": [0, 197, 255]},
                {"Value": 2, "Name": "Wetlands", "Color": [0, 168, 132]},
                {"Value": 3, "Name": "Tree Canopy", "Color": [38, 115, 0]},
                {"Value": 4, "Name": "Shrubland", "Color": [76, 230, 0]},
                {"Value": 5, "Name": "Low Vegetation ", "Color": [163, 255, 115]},
                {"Value": 6, "Name": "Barren", "Color": [255, 170, 0]},
                {"Value": 7, "Name": "Structures", "Color": [255, 0, 0]},
                {"Value": 8, "Name": "Impervious Surfaces", "Color": [156, 156, 156]},
                {"Value": 9, "Name": "Impervious Roads", "Color": [0, 0, 0]},
            ],
            "ModelFile": "HighResolutionLandCoverClassification_USA.pth",
            "ImageHeight": 512,
            "ImageWidth": 512,
            "ImageSpaceUsed": "MAP_SPACE",
            "MinCellSize": {"x": 80, "y": 80, "spatialReference": {"wkid": None}},
            "MaxCellSize": {"x": 105, "y": 105, "spatialReference": {"wkid": None}},
            "ModelName": "UnetClassifier",
        },
        "properties": "None",
        "postprocessing_workflow": "None",
        "thresh": None,
        "nms_ratio": None,
        "SAM_segmentation": "False",
    },
    "HUMAN SETTLEMENTS CLASSIFICATION (LANDSAT 8)": {
        "id": "f7754e9617b84356845e5f877d3c36c6",
        "RecommendedCellSize": "3000",
        "owner": "esri_analytics",
        "batch_size": "1",
        "modified": 1661376172000,
        "name": "HumanSettlementsClassificationL8.dlpk",
        "title": "Human Settlements Classification (Landsat 8)",
        "emd": {
            "ModelType": "ImageClassification",
            "InferenceFunction": "ArcGISImageClassifier.py",
            "ExtractBands": [0, 1, 2, 3, 4, 5, 6, 7],
            "Classes": [{"Value": 1, "Name": "Settlement", "Color": [171, 0, 0]}],
            "ModelFile": "HumanSettlementsClassificationL8.pth",
            "ImageHeight": 400,
            "ImageWidth": 400,
            "ImageSpaceUsed": "MAP_SPACE",
            "ModelName": "UnetClassifier",
            "MinCellSize": {"x": 2000, "y": 2000, "spatialReference": {"wkid": None}},
            "MaxCellSize": {"x": 4000, "y": 4000, "spatialReference": {"wkid": None}},
        },
        "properties": "None",
        "postprocessing_workflow": "None",
        "thresh": None,
        "nms_ratio": None,
        "SAM_segmentation": "False",
    },
    "HUMAN SETTLEMENTS CLASSIFICATION (SENTINEL-2)": {
        "id": "eafdf746e14b4eda8887bab8e59fd27c",
        "RecommendedCellSize": "1000",
        "owner": "esri_analytics",
        "batch_size": "1",
        "modified": 1661375577000,
        "name": "HumanSettlementsClassificationS2.dlpk",
        "title": "Human Settlements Classification (Sentinel-2)",
        "emd": {
            "ModelType": "ImageClassification",
            "InferenceFunction": "ArcGISImageClassifier.py",
            "ExtractBands": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
            "Classes": [{"Value": 1, "Name": "Settlement", "Color": [240, 30, 40]}],
            "ModelFile": "HumanSettlementsClassificationS2.pth",
            "ImageHeight": 400,
            "ImageWidth": 400,
            "ImageSpaceUsed": "MAP_SPACE",
            "MinCellSize": {"x": 800, "y": 800, "spatialReference": {"wkid": None}},
            "MaxCellSize": {"x": 2000, "y": 2000, "spatialReference": {"wkid": None}},
            "ModelName": "UnetClassifier",
        },
        "properties": "None",
        "postprocessing_workflow": "None",
        "thresh": None,
        "nms_ratio": None,
        "SAM_segmentation": "False",
    },
    "LAND COVER CLASSIFICATION (AERIAL IMAGERY)": {
        "id": "c1bca075efb145d9a26394b866cd05eb",
        "RecommendedCellSize": "10",
        "owner": "esri_analytics",
        "batch_size": "1",
        "modified": 1691495099000,
        "name": "LandCoverClassification_Aerial.dlpk",
        "title": "Land Cover Classification (Aerial Imagery)",
        "emd": {
            "ModelType": "ImageClassification",
            "InferenceFunction": "ArcGISImageClassifier.py",
            "ExtractBands": [0, 1, 2],
            "Classes": [
                {"Value": 1, "Name": "Tree Canopy", "Color": [0, 100, 0]},
                {"Value": 2, "Name": "Grass/Shrubs", "Color": [192, 255, 160]},
                {"Value": 3, "Name": "Bare Soil", "Color": [128, 82, 0]},
                {"Value": 4, "Name": "Water", "Color": [0, 0, 255]},
                {"Value": 5, "Name": "Buildings", "Color": [255, 0, 0]},
                {"Value": 6, "Name": "Roads/Railroads", "Color": [0, 0, 0]},
                {"Value": 7, "Name": "Other Paved", "Color": [160, 160, 164]},
                {"Value": 8, "Name": "Tall Shrubs", "Color": [255, 255, 0]},
            ],
            "MinCellSize": {"x": 5, "y": 5, "spatialReference": {"wkid": None}},
            "MaxCellSize": {"x": 20, "y": 20, "spatialReference": {"wkid": None}},
            "ModelFile": "LandCoverClassification_Aerial.pth",
            "ImageHeight": 400,
            "ImageWidth": 400,
            "ImageSpaceUsed": "MAP_SPACE",
            "ModelName": "UnetClassifier",
        },
        "properties": "None",
        "postprocessing_workflow": "None",
        "thresh": None,
        "nms_ratio": None,
        "SAM_segmentation": "False",
    },
    "LAND COVER CLASSIFICATION (LANDSAT 8)": {
        "id": "e732ee81a9c14c238a14df554a8e3225",
        "RecommendedCellSize": "3000",
        "owner": "esri_analytics",
        "batch_size": "1",
        "modified": 1661375034000,
        "name": "LandCoverClassification.dlpk",
        "title": "Land Cover Classification (Landsat 8)",
        "emd": {
            "ModelType": "ImageClassification",
            "InferenceFunction": "ArcGISImageClassifier.py",
            "ExtractBands": [0, 1, 2, 3, 4, 5, 6],
            "Classes": [
                {"Value": 11, "Name": "Open Water", "Color": [70, 107, 159]},
                {"Value": 12, "Name": "Perennial Snow/Ice", "Color": [209, 222, 248]},
                {
                    "Value": 21,
                    "Name": "Developed, Open Space",
                    "Color": [222, 197, 197],
                },
                {
                    "Value": 22,
                    "Name": "Developed, Low Intensity",
                    "Color": [217, 146, 130],
                },
                {
                    "Value": 23,
                    "Name": "Developed, Medium Intensity",
                    "Color": [235, 0, 0],
                },
                {
                    "Value": 24,
                    "Name": "Developed, High Intensity",
                    "Color": [171, 0, 0],
                },
                {"Value": 31, "Name": "Barren Land", "Color": [179, 172, 159]},
                {"Value": 41, "Name": "Deciduous Forest", "Color": [104, 171, 95]},
                {"Value": 42, "Name": "Evergreen Forest", "Color": [28, 95, 44]},
                {"Value": 43, "Name": "Mixed Forest", "Color": [181, 197, 143]},
                {"Value": 52, "Name": "Shrub/Scrub", "Color": [204, 184, 121]},
                {"Value": 71, "Name": "Herbaceuous", "Color": [223, 223, 194]},
                {"Value": 81, "Name": "Hay/Pasture", "Color": [220, 217, 57]},
                {"Value": 82, "Name": "Cultivated Crops", "Color": [171, 108, 40]},
                {"Value": 90, "Name": "Woody Wetlands", "Color": [184, 217, 235]},
                {
                    "Value": 95,
                    "Name": "Emergent Herbaceuous Wetlands",
                    "Color": [108, 159, 184],
                },
            ],
            "MinCellSize": {"x": 2000, "y": 2000, "spatialReference": {"wkid": None}},
            "MaxCellSize": {"x": 4000, "y": 4000, "spatialReference": {"wkid": None}},
            "ModelFile": "LandCoverClassification.pth",
            "ImageHeight": 512,
            "ImageWidth": 512,
            "ImageSpaceUsed": "MAP_SPACE",
            "ModelName": "UnetClassifier",
        },
        "properties": "None",
        "postprocessing_workflow": "None",
        "thresh": None,
        "nms_ratio": None,
        "SAM_segmentation": "False",
    },
    "LAND COVER CLASSIFICATION (SENTINEL-2)": {
        "id": "afd124844ba84da69c2c533d4af10a58",
        "RecommendedCellSize": "1000",
        "owner": "esri_analytics",
        "batch_size": "4",
        "modified": 1661374983000,
        "name": "corine_landcover.dlpk",
        "title": "Land Cover Classification (Sentinel-2)",
        "emd": {
            "ModelType": "ImageClassification",
            "InferenceFunction": "corine_landcover_ArcGISImageClassifier.py",
            "ExtractBands": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
            "Classes": [
                {"Value": 11, "Name": "Urban fabric", "Color": [230, 0, 77]},
                {
                    "Value": 12,
                    "Name": "Industrial, commercial and transport units",
                    "Color": [204, 77, 242],
                },
                {
                    "Value": 13,
                    "Name": "Mine, dump and construction sites",
                    "Color": [166, 0, 204],
                },
                {
                    "Value": 14,
                    "Name": "Artificial, non-agricultural vegetated areas",
                    "Color": [255, 166, 255],
                },
                {"Value": 21, "Name": "Arable land", "Color": [255, 255, 168]},
                {"Value": 22, "Name": "Permanent crops", "Color": [230, 128, 0]},
                {"Value": 23, "Name": "Pastures", "Color": [230, 230, 77]},
                {
                    "Value": 24,
                    "Name": "Heterogeneous agricultural areas",
                    "Color": [255, 230, 166],
                },
                {"Value": 31, "Name": "Forests", "Color": [128, 255, 0]},
                {
                    "Value": 32,
                    "Name": "Scrub and/or herbaceous vegetation associations",
                    "Color": [204, 242, 77],
                },
                {
                    "Value": 33,
                    "Name": "Open spaces with little or no vegetation",
                    "Color": [230, 230, 230],
                },
                {"Value": 41, "Name": "Inland wetlands", "Color": [166, 166, 255]},
                {"Value": 42, "Name": "Maritime wetlands", "Color": [204, 204, 255]},
                {"Value": 51, "Name": "Inland waters", "Color": [0, 204, 242]},
                {"Value": 52, "Name": "Marine waters", "Color": [0, 255, 166]},
                {"Value": 99, "Name": "NODATA", "Color": [0, 0, 0]},
            ],
            "ModelFile": "corine_landcover.pth",
            "ImageHeight": 512,
            "ImageWidth": 512,
            "ImageSpaceUsed": "MAP_SPACE",
            "MinCellSize": {"x": 800, "y": 800, "spatialReference": {"wkid": None}},
            "MaxCellSize": {"x": 2000, "y": 2000, "spatialReference": {"wkid": None}},
            "ModelName": "UnetClassifier",
        },
        "properties": "None",
        "postprocessing_workflow": "None",
        "thresh": None,
        "nms_ratio": None,
        "SAM_segmentation": "False",
    },
    "MANGROVE CLASSIFICATION (LANDSAT 8)": {
        "id": "741a56ae6a5340058b9704a8f68f1b9a",
        "RecommendedCellSize": "3000",
        "owner": "esri_analytics",
        "batch_size": "4",
        "modified": 1646798818000,
        "name": "MangroveClassificationL8.dlpk",
        "title": "Mangrove Classification (Landsat 8)",
        "emd": {
            "ModelType": "ImageClassification",
            "InferenceFunction": "ArcGISImageClassifier.py",
            "ExtractBands": [0, 1, 2, 3, 4, 5, 6],
            "Classes": [{"Value": 1, "Name": "Mangroove", "Color": [33, 125, 147]}],
            "ModelFile": "MangroveClassificationL8.pth",
            "ImageHeight": 256,
            "ImageWidth": 256,
            "ImageSpaceUsed": "MAP_SPACE",
            "MinCellSize": {"x": 2000, "y": 2000, "spatialReference": {"wkid": None}},
            "MaxCellSize": {"x": 4000, "y": 4000, "spatialReference": {"wkid": None}},
            "ModelName": "UnetClassifier",
        },
        "properties": "None",
        "postprocessing_workflow": "None",
        "thresh": None,
        "nms_ratio": None,
        "SAM_segmentation": "False",
    },
    "PALM TREE DETECTION": {
        "id": "916e02960d9e495baeb4d1d2ff4055d0",
        "RecommendedCellSize": "15",
        "owner": "esri_analytics",
        "batch_size": "8",
        "modified": 1661376352000,
        "name": "PalmTreeDetection.dlpk",
        "title": "Palm Tree Detection",
        "emd": {
            "ModelType": "ObjectDetection",
            "InferenceFunction": "ArcGISObjectDetector.py",
            "ExtractBands": [0, 1, 2],
            "Classes": [{"Value": 1, "Name": "1", "Color": [186, 199, 208]}],
            "MinCellSize": {"x": 5, "y": 5, "spatialReference": {"wkid": None}},
            "MaxCellSize": {"x": 20, "y": 20, "spatialReference": {"wkid": None}},
            "ModelFile": "PalmTreeDetection.pth",
            "ImageHeight": 224,
            "ImageWidth": 224,
            "ImageSpaceUsed": "MAP_SPACE",
            "ModelName": "FasterRCNN",
        },
        "properties": "None",
        "postprocessing_workflow": "Polygon Segmentation",
        "thresh": 0.5,
        "nms_ratio": 0.1,
        "SAM_segmentation": "False",
    },
    "PARCEL EXTRACTION - USA": {
        "id": "ee7a5cf6ea4242f7a33014c6d16096ce",
        "RecommendedCellSize": "50",
        "owner": "esri_analytics",
        "batch_size": "8",
        "modified": 1661375415000,
        "name": "ParcelExtraction_USA.dlpk",
        "title": "Parcel Extraction - USA",
        "emd": {
            "ModelType": "ImageClassification",
            "InferenceFunction": "ArcGISImageClassifier.py",
            "ExtractBands": [0, 1, 2],
            "Classes": [
                {
                    "Value": 1,
                    "Name": "City of Abilene, Taylor County",
                    "Color": [5, 83, 38],
                }
            ],
            "MinCellSize": {"x": 40, "y": 40, "spatialReference": {"wkid": None}},
            "MaxCellSize": {"x": 55, "y": 55, "spatialReference": {"wkid": None}},
            "ModelFile": "ParcelExtraction_USA.pth",
            "ImageHeight": 224,
            "ImageWidth": 224,
            "ImageSpaceUsed": "MAP_SPACE",
            "ModelName": "BDCNEdgeDetector",
        },
        "properties": "None",
        "postprocessing_workflow": "Parcel Regularization",
        "thresh": 0.5,
        "nms_ratio": None,
        "SAM_segmentation": "False",
    },
    "POOL DETECTION - USA": {
        "id": "0e7dffe605c24bdfadf3c376bdf2d413",
        "RecommendedCellSize": "30",
        "owner": "esri_analytics",
        "batch_size": "8",
        "modified": 1661375899000,
        "name": "PoolDetection_USA.dlpk",
        "title": "Pool Detection - USA",
        "emd": {
            "ModelType": "ObjectDetection",
            "InferenceFunction": "ArcGISObjectDetector.py",
            "ExtractBands": [0, 1, 2],
            "Classes": [{"Value": 1, "Name": "swimming pool", "Color": [154, 1, 122]}],
            "ModelFile": "PoolDetection_USA.pth",
            "ImageHeight": 224,
            "ImageWidth": 224,
            "ImageSpaceUsed": "MAP_SPACE",
            "MinCellSize": {"x": 5, "y": 5, "spatialReference": {"wkid": None}},
            "MaxCellSize": {"x": 35, "y": 35, "spatialReference": {"wkid": None}},
            "ModelName": "FasterRCNN",
        },
        "properties": "None",
        "postprocessing_workflow": "Polygon Segmentation",
        "thresh": 0.5,
        "nms_ratio": 0.1,
        "SAM_segmentation": "False",
    },
    "ROAD EXTRACTION - GLOBAL": {
        "id": "ad41220d176a4777bcc3e950c46e5ea0",
        "RecommendedCellSize": 100,
        "owner": "esri_analytics",
        "batch_size": "2",
        "modified": 1724910284000,
        "name": "RoadExtraction_Global.dlpk",
        "title": "Road Extraction - Global",
        "emd": {
            "ModelType": "ObjectDetection",
            "InferenceFunction": "ArcGISObjectDetector.py",
            "ExtractBands": [0, 1, 2],
            "Classes": [{"Value": 0, "Name": "0", "Color": [55, 224, 69]}],
            "MinCellSize": {"x": 0.1, "y": 0.1, "spatialReference": {"wkid": None}},
            "MaxCellSize": {"x": 150, "y": 150, "spatialReference": {"wkid": None}},
            "ModelFile": "model399000",
            "ImageHeight": 2048,
            "ImageWidth": 2048,
            "ImageSpaceUsed": "MAP_SPACE",
            "ModelName": "sam_roads",
        },
        "properties": "None",
        "postprocessing_workflow": "Line Regularization",
        "thresh": 0.2,
        "nms_ratio": None,
        "SAM_segmentation": "False",
    },
    "ROAD EXTRACTION - NORTH AMERICA": {
        "id": "0c00be3c7e4042ebadd3ae1404190a5b",
        "RecommendedCellSize": "50",
        "owner": "esri_analytics",
        "batch_size": "8",
        "modified": 1661375484000,
        "name": "RoadsExtraction_NorthAmerica.dlpk",
        "title": "Road Extraction - North America",
        "emd": {
            "ModelType": "ImageClassification",
            "InferenceFunction": "ArcGISImageClassifier.py",
            "ExtractBands": [0, 1, 2],
            "Classes": [{"Value": 1, "Name": 1, "Color": [57, 243, 218]}],
            "ModelFile": "RoadsExtraction_NorthAmerica.pth",
            "ImageHeight": 224,
            "ImageWidth": 224,
            "ImageSpaceUsed": "MAP_SPACE",
            "MinCellSize": {"x": 30, "y": 30, "spatialReference": {"wkid": None}},
            "MaxCellSize": {"x": 55, "y": 55, "spatialReference": {"wkid": None}},
            "ModelName": "MultiTaskRoadExtractor",
        },
        "properties": "None",
        "postprocessing_workflow": "Line Regularization",
        "thresh": None,
        "nms_ratio": None,
        "SAM_segmentation": "False",
    },
    "SEABIRD (TERN) DETECTION - AFRICA": {
        "id": "4019a53c914947aea9621ba226ec8861",
        "RecommendedCellSize": "1",
        "owner": "esri_analytics",
        "batch_size": "8",
        "modified": 1663564185000,
        "name": "Seabird_Detection.dlpk",
        "title": "Seabird (Tern) Detection - Africa",
        "emd": {
            "ModelType": "InstanceDetection",
            "InferenceFunction": "ArcGISInstanceDetector.py",
            "ExtractBands": [0, 1, 2],
            "Classes": [{"Value": 1, "Name": "1", "Color": [219, 60, 135]}],
            "MinCellSize": {"x": 0.5, "y": 0.5, "spatialReference": {"wkid": None}},
            "MaxCellSize": {"x": 10, "y": 10, "spatialReference": {"wkid": None}},
            "ModelFile": "Seabird_Detection.pth",
            "ImageHeight": 256,
            "ImageWidth": 256,
            "ImageSpaceUsed": "MAP_SPACE",
            "ModelName": "MaskRCNN",
        },
        "properties": "None",
        "postprocessing_workflow": "Polygon Segmentation",
        "thresh": 0.2,
        "nms_ratio": 0.1,
        "SAM_segmentation": "False",
    },
    "SHIP DETECTION (SAR)": {
        "id": "705f4c04ac3043be806529047b79abfd",
        "RecommendedCellSize": "1000",
        "owner": "esri_analytics",
        "batch_size": "4",
        "modified": 1661375607000,
        "name": "SARShipDetection.dlpk",
        "title": "Ship Detection (SAR)",
        "emd": {
            "ModelType": "ObjectDetection",
            "InferenceFunction": "ArcGISObjectDetector.py",
            "ExtractBands": [0, 1],
            "Classes": [{"Value": 1, "Name": "ship", "Color": [32, 62, 179]}],
            "ModelFile": "SARShipDetection.pth",
            "MinCellSize": {"x": 800, "y": 800, "spatialReference": {"wkid": None}},
            "MaxCellSize": {"x": 2000, "y": 2000, "spatialReference": {"wkid": None}},
            "ImageHeight": 224,
            "ImageWidth": 224,
            "ImageSpaceUsed": "MAP_SPACE",
            "ModelName": "FasterRCNN",
        },
        "properties": "None",
        "postprocessing_workflow": "Polygon Segmentation",
        "thresh": 0.4,
        "nms_ratio": 0.2,
        "SAM_segmentation": "False",
    },
    "SOLAR PANEL DETECTION - USA": {
        "id": "c2508d72f2614104bfcfd5ccf1429284",
        "RecommendedCellSize": "5",
        "owner": "esri_analytics",
        "batch_size": "8",
        "modified": 1661375341000,
        "name": "SolarPanelDetection_USA.dlpk",
        "title": "Solar Panel Detection - USA",
        "emd": {
            "ModelType": "InstanceDetection",
            "InferenceFunction": "ArcGISInstanceDetector.py",
            "ExtractBands": [0, 1, 2],
            "Classes": [{"Value": 3, "Name": "3", "Color": [36, 94, 13]}],
            "MinCellSize": {"x": 5, "y": 5, "spatialReference": {"wkid": None}},
            "MaxCellSize": {"x": 25, "y": 25, "spatialReference": {"wkid": None}},
            "ModelFile": "SolarPanelDetection_USA.pth",
            "ImageHeight": 400,
            "ImageWidth": 400,
            "ImageSpaceUsed": "MAP_SPACE",
            "ModelName": "MaskRCNN",
        },
        "properties": "None",
        "postprocessing_workflow": "Polygon Regularization",
        "thresh": 0.8,
        "nms_ratio": None,
        "SAM_segmentation": "True",
    },
    "SOLAR PHOTOVOLTAIC PARK CLASSIFICATION - GLOBAL": {
        "id": "55600a3a452c4b208d3c54026c3f7cd1",
        "RecommendedCellSize": "1000",
        "batch_size": "1",
        "owner": "esri_analytics",
        "modified": 1661376454000,
        "name": "SolarPhotovoltaicParkClassification_Global.dlpk",
        "title": "Solar Photovoltaic Park Classification - Global",
        "emd": {
            "ModelType": "ImageClassification",
            "InferenceFunction": "ArcGISImageClassifier.py",
            "ExtractBands": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
            "Classes": [
                {"Value": 1, "Name": "Solar Photovoltaic Park", "Color": [255, 25, 25]}
            ],
            "MinCellSize": {"x": 800, "y": 800, "spatialReference": {"wkid": None}},
            "MaxCellSize": {"x": 2000, "y": 2000, "spatialReference": {"wkid": None}},
            "ModelFile": "SolarPhotovoltaicParkClassification_Global.pth",
            "ImageHeight": 512,
            "ImageWidth": 512,
            "ImageSpaceUsed": "MAP_SPACE",
            "ModelName": "UnetClassifier",
        },
        "properties": "None",
        "postprocessing_workflow": "None",
        "thresh": None,
        "nms_ratio": None,
        "SAM_segmentation": "False",
    },
    "TREE DETECTION": {
        "id": "4af356858b1044908d9204f8b79ced99",
        "RecommendedCellSize": "20",
        "owner": "esri_analytics",
        "batch_size": "8",
        "modified": 1661375725000,
        "name": "TreeDetection.dlpk",
        "title": "Tree Detection",
        "emd": {
            "ModelType": "ObjectDetection",
            "InferenceFunction": "TreeDetector.py",
            "ExtractBands": [0, 1, 2],
            "Classes": [{"Value": 1, "Name": "Tree", "Color": [186, 199, 208]}],
            "ModelFile": "NEON.pt",
            "ImageHeight": 400,
            "ImageWidth": 400,
            "ImageSpaceUsed": "MAP_SPACE",
            "MinCellSize": {"x": 10, "y": 10, "spatialReference": {"wkid": None}},
            "MaxCellSize": {"x": 30, "y": 30, "spatialReference": {"wkid": None}},
            "ModelName": "DeepForest",
        },
        "properties": "None",
        "postprocessing_workflow": "Polygon Segmentation",
        "thresh": 0.1,
        "nms_ratio": None,
        "SAM_segmentation": "False",
    },
    "WATER BODY EXTRACTION (SAR) - USA": {
        "id": "6247b5485d9549b6a335d3060c503488",
        "RecommendedCellSize": "1000",
        "owner": "esri_analytics",
        "batch_size": "4",
        "modified": 1663564215000,
        "name": "WaterbodyExtractionSAR_USA.dlpk",
        "title": "Water Body Extraction (SAR) - USA",
        "emd": {
            "ModelType": "ImageClassification",
            "InferenceFunction": "ArcGISImageClassifier.py",
            "ExtractBands": [0, 1],
            "Classes": [{"Value": 1, "Name": "1", "Color": [144, 73, 241]}],
            "MinCellSize": {"x": 800, "y": 800, "spatialReference": {"wkid": None}},
            "MaxCellSize": {"x": 2000, "y": 2000, "spatialReference": {"wkid": None}},
            "ModelFile": "WaterbodyExtractionSAR_USA.pth",
            "ImageHeight": 512,
            "ImageWidth": 512,
            "ImageSpaceUsed": "MAP_SPACE",
            "ModelName": "DeepLab",
        },
        "properties": "None",
        "postprocessing_workflow": "None",
        "thresh": None,
        "nms_ratio": None,
        "SAM_segmentation": "False",
    },
    "WELL PAD DETECTION - PERMIAN BASIN": {
        "id": "fab4f3a85abd41ce886338ed85246146",
        "RecommendedCellSize": "500",
        "owner": "esri_analytics",
        "batch_size": "1",
        "modified": 1661375856000,
        "name": "WellPadDetection_PermianBasin.dlpk",
        "title": "Well Pad Detection - Permian Basin",
        "emd": {
            "ModelType": "ObjectDetection",
            "InferenceFunction": "ArcGISObjectDetector.py",
            "ExtractBands": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
            "Classes": [{"Value": 1, "Name": "OillWellPad", "Color": [190, 220, 47]}],
            "MinCellSize": {"x": 800, "y": 800, "spatialReference": {"wkid": None}},
            "MaxCellSize": {"x": 2000, "y": 2000, "spatialReference": {"wkid": None}},
            "ModelFile": "WellPadDetection_PermianBasin.pth",
            "ImageHeight": 400,
            "ImageWidth": 400,
            "ImageSpaceUsed": "MAP_SPACE",
            "ModelName": "FasterRCNN",
        },
        "properties": "None",
        "postprocessing_workflow": "Polygon Segmentation",
        "thresh": 0.5,
        "nms_ratio": None,
        "SAM_segmentation": "False",
    },
    "WIND TURBINE DETECTION": {
        "id": "0e3f954bffc549429340dde22eb03152",
        "RecommendedCellSize": "60",
        "owner": "esri_analytics",
        "batch_size": "8",
        "modified": 1661376316000,
        "name": "WindTurbineDetection.dlpk",
        "title": "Wind Turbine Detection",
        "emd": {
            "ModelType": "ObjectDetection",
            "InferenceFunction": "ArcGISObjectDetector.py",
            "ExtractBands": [0, 1, 2],
            "Classes": [{"Value": 1, "Name": "WindTurbines", "Color": [178, 141, 87]}],
            "MinCellSize": {"x": 50, "y": 50, "spatialReference": {"wkid": None}},
            "MaxCellSize": {"x": 75, "y": 75, "spatialReference": {"wkid": None}},
            "ModelFile": "WindTurbineDetection.pth",
            "ImageHeight": 512,
            "ImageWidth": 512,
            "ImageSpaceUsed": "MAP_SPACE",
            "ModelName": "FasterRCNN",
        },
        "properties": "None",
        "postprocessing_workflow": "Polygon Segmentation",
        "thresh": 0.5,
        "nms_ratio": None,
        "SAM_segmentation": "False",
    },
    "OIL SPILL DETECTION (SAR)": {
        "id": "4dd65af881f64236ac9bbaa407e046ba",
        "RecommendedCellSize": "1000",
        "batch_size": "1",
        "owner": "esri_analytics",
        "modified": 1691495912000,
        "name": "OilSpillDetection_SAR.dlpk",
        "title": "Oil Spill Detection (SAR)",
        "emd": {
            "ModelType": "InstanceDetection",
            "InferenceFunction": "ArcGISInstanceDetector.py",
            "ExtractBands": [0, 1],
            "Classes": [{"Value": 1, "Name": "1", "Color": [66, 206, 144]}],
            "MinCellSize": {"x": 800, "y": 800, "spatialReference": {"wkid": None}},
            "MaxCellSize": {"x": 2000, "y": 2000, "spatialReference": {"wkid": None}},
            "ModelFile": "OilSpillDetection_SAR.pth",
            "ImageHeight": 400,
            "ImageWidth": 400,
            "ImageSpaceUsed": "MAP_SPACE",
            "ModelName": "MaskRCNN",
        },
        "properties": "None",
        "postprocessing_workflow": "None",
        "thresh": 0.6,
        "nms_ratio": None,
        "SAM_segmentation": "False",
    },
    "HUMAN DETECTION (DRONE IMAGERY)": {
        "id": "42bfd5392d834c83aa21193450888a9e",
        "RecommendedCellSize": "5",
        "batch_size": "1",
        "owner": "esri_analytics",
        "modified": 1691494606000,
        "name": "Human_Detection_DroneImagery.dlpk",
        "title": "Human Detection (Drone Imagery)",
        "emd": {
            "ModelType": "ObjectDetection",
            "InferenceFunction": "ArcGISObjectDetector.py",
            "ExtractBands": [0, 1, 2],
            "Classes": [{"Value": 1, "Name": "human", "Color": [77, 185, 225]}],
            "MinCellSize": {"x": 0.5, "y": 0.5, "spatialReference": {"wkid": None}},
            "MaxCellSize": {"x": 10, "y": 10, "spatialReference": {"wkid": None}},
            "ModelFile": "Human_Detection_DroneImagery.pth",
            "ImageHeight": 224,
            "ImageWidth": 224,
            "ImageSpaceUsed": "PIXEL_SPACE",
            "ModelName": "FasterRCNN",
        },
        "properties": "None",
        "postprocessing_workflow": "Polygon Segmentation",
        "thresh": 0.8,
        "nms_ratio": None,
        "SAM_segmentation": "False",
    },
    "PARKING LOT CLASSIFICATION - USA": {
        "id": "2618363f856044348029c6868a02753c",
        "RecommendedCellSize": "50",
        "batch_size": "1",
        "owner": "esri_analytics",
        "modified": 1691376338000,
        "name": "ParkingLotClassification_USA.dlpk",
        "title": "Parking Lot Classification - USA",
        "emd": {
            "ModelType": "ImageClassification",
            "InferenceFunction": "ArcGISImageClassifier.py",
            "ExtractBands": [0, 1, 2],
            "Classes": [{"Value": 1, "Name": "1", "Color": [196, 116, 212]}],
            "MinCellSize": {"x": 30, "y": 30, "spatialReference": {"wkid": None}},
            "MaxCellSize": {"x": 125, "y": 125, "spatialReference": {"wkid": None}},
            "ModelFile": "ParkingLotClassification_USA.pth",
            "ImageHeight": 400,
            "ImageWidth": 400,
            "ImageSpaceUsed": "MAP_SPACE",
            "ModelName": "MMSegmentation",
        },
        "properties": "None",
        "postprocessing_workflow": "None",
        "thresh": None,
        "nms_ratio": None,
        "SAM_segmentation": "False",
    },
    "PARKING SPOT DETECTION - USA": {
        "id": "5b8e047f11324775832550c6bab19d2b",
        "RecommendedCellSize": "10",
        "batch_size": "1",
        "owner": "esri_analytics",
        "modified": 1691496702000,
        "name": "ParkingSpotDetection_USA.dlpk",
        "title": "Parking Spot Detection - USA",
        "emd": {
            "ModelType": "InstanceDetection",
            "InferenceFunction": "ArcGISInstanceDetector.py",
            "ExtractBands": [0, 1, 2],
            "Classes": [
                {"Value": 1, "Name": "Vacant", "Color": [132, 225, 108]},
                {"Value": 2, "Name": "Occupied", "Color": [41, 35, 190]},
            ],
            "MinCellSize": {"x": 5, "y": 5, "spatialReference": {"wkid": None}},
            "MaxCellSize": {"x": 20, "y": 20, "spatialReference": {"wkid": None}},
            "ModelFile": "ParkingSpotDetection_USA.pth",
            "ImageHeight": 224,
            "ImageWidth": 224,
            "ImageSpaceUsed": "MAP_SPACE",
            "ModelName": "MaskRCNN",
        },
        "properties": "None",
        "postprocessing_workflow": "Polygon Segmentation",
        "thresh": 0.5,
        "nms_ratio": None,
        "SAM_segmentation": "False",
    },
    "SEGMENT ANYTHING MODEL (SAM)": {
        "id": "9b67b441f29f4ce6810979f5f0667ebe",
        "RecommendedCellSize": None,
        "batch_size": "1",
        "owner": "esri_analytics",
        "modified": 1691497648000,
        "name": "SAM.dlpk",
        "title": "Segment Anything Model (SAM)",
        "emd": {
            "ModelType": "ObjectDetection",
            "InferenceFunction": "SAM.py",
            "ExtractBands": [0, 1, 2],
            "Classes": [{"Value": 1, "Name": "Object", "Color": [186, 199, 208]}],
            "ImageHeight": 1024,
            "ImageWidth": 1024,
            "ImageSpaceUsed": "MAP_SPACE",
            "ModelFile": "sam_vit_h_4b8939.pth",
            "MinCellSize": {"x": None, "y": None, "spatialReference": {"wkid": None}},
            "MaxCellSize": {"x": None, "y": None, "spatialReference": {"wkid": None}},
            "ModelName": "SAM",
        },
        "properties": "None",
        "postprocessing_workflow": "None",
        "thresh": 0.7,
        "nms_ratio": None,
        "SAM_segmentation": "False",
    },
    "TREE SEGMENTATION": {
        "id": "6d910b29ff38406986da0abf1ce50836",
        "RecommendedCellSize": "20",
        "batch_size": "1",
        "owner": "esri_analytics",
        "modified": 1691498153000,
        "name": "TreeSegmentation.dlpk",
        "title": "Tree Segmentation",
        "emd": {
            "ModelType": "ObjectDetection",
            "InferenceFunction": "TreeDetector.py",
            "ExtractBands": [0, 1, 2],
            "Classes": [{"Value": 1, "Name": "Tree", "Color": [186, 199, 208]}],
            "ModelFile": "NEON.pt",
            "ImageHeight": 400,
            "ImageWidth": 400,
            "ImageSpaceUsed": "MAP_SPACE",
            "MinCellSize": {"x": 10, "y": 10, "spatialReference": {"wkid": None}},
            "MaxCellSize": {"x": 30, "y": 30, "spatialReference": {"wkid": None}},
            "ModelName": "DeepForest",
        },
        "properties": "None",
        "postprocessing_workflow": "None",
        "thresh": 0.1,
        "nms_ratio": None,
        "SAM_segmentation": "False",
    },
    "POOL SEGMENTATION - USA": {
        "id": "0d4b8ab238b74da8819df21834338c0d",
        "RecommendedCellSize": "30",
        "batch_size": "1",
        "owner": "esri_analytics",
        "modified": 1691496998000,
        "name": "PoolSegmentation_USA.dlpk",
        "title": "Pool Segmentation - USA",
        "emd": {
            "ModelType": "ObjectDetection",
            "InferenceFunction": "ArcGISObjectDetector.py",
            "ExtractBands": [0, 1, 2],
            "Classes": [{"Value": 1, "Name": "swimming pool", "Color": [154, 1, 122]}],
            "ModelFile": "PoolDetection_USA.pth",
            "ImageHeight": 224,
            "ImageWidth": 224,
            "ImageSpaceUsed": "MAP_SPACE",
            "MinCellSize": {"x": 5, "y": 5, "spatialReference": {"wkid": None}},
            "MaxCellSize": {"x": 35, "y": 35, "spatialReference": {"wkid": None}},
            "ModelName": "FasterRCNN",
        },
        "properties": "None",
        "postprocessing_workflow": "None",
        "thresh": 0.5,
        "nms_ratio": None,
        "SAM_segmentation": "False",
    },
    "PYLON DETECTION - USA": {
        "id": "171bbede7b034a96b3fde85786abc0f7",
        "RecommendedCellSize": "60",
        "batch_size": "1",
        "owner": "esri_analytics",
        "modified": 1701320593000,
        "name": "PylonDetection_USA.dlpk",
        "title": "Pylon Detection - USA",
        "emd": {
            "ModelType": "ObjectDetection",
            "InferenceFunction": "ArcGISObjectDetector.py",
            "ExtractBands": [0, 1, 2],
            "Classes": [{"Value": 1, "Name": "1", "Color": [237, 33, 24]}],
            "MinCellSize": {"x": 5, "y": 5, "spatialReference": {"wkid": None}},
            "MaxCellSize": {"x": 65, "y": 65, "spatialReference": {"wkid": None}},
            "ImageHeight": 256,
            "ImageWidth": 256,
            "ImageSpaceUsed": "MAP_SPACE",
            "ModelFile": "PylonDetection_USA.pth",
            "ModelName": "MMDetection",
        },
        "properties": "None",
        "postprocessing_workflow": "None",
        "thresh": 0.5,
        "nms_ratio": None,
        "SAM_segmentation": "False",
    },
    "SHIP DETECTION (RGB)": {
        "id": "2fd653cd9de446ccbab34f69e9e70d81",
        "RecommendedCellSize": "30",
        "batch_size": "1",
        "owner": "esri_analytics",
        "modified": 1701320548000,
        "name": "Ship Detection (RGB)",
        "title": "Ship_Detection_RGB.dlpk",
        "emd": {
            "ModelType": "InstanceDetection",
            "InferenceFunction": "ArcGISObjectDetector.py",
            "ExtractBands": [0, 1, 2],
            "Classes": [{"Value": 1, "Name": "1", "Color": [136, 121, 254]}],
            "MinCellSize": {"x": 5, "y": 5, "spatialReference": {"wkid": None}},
            "MaxCellSize": {"x": 35, "y": 35, "spatialReference": {"wkid": None}},
            "ModelFile": "ship_detection_RGB.pth",
            "ImageHeight": 256,
            "ImageWidth": 256,
            "ImageSpaceUsed": "MAP_SPACE",
            "ModelName": "MaskRCNN",
        },
        "properties": "None",
        "postprocessing_workflow": "None",
        "thresh": 0.6,
        "nms_ratio": 0.1,
        "SAM_segmentation": "False",
    },
    "OIL TANK DETECTION": {
        "id": "c7996c42f2b94a1baafddf518fca3dcd",
        "RecommendedCellSize": "30",
        "batch_size": "1",
        "owner": "esri_analytics",
        "modified": 1701320548000,
        "name": "OilTankDetection.dlpk",
        "title": "Oil Tank Detection",
        "emd": {
            "ModelType": "ObjectDetection",
            "InferenceFunction": "ArcGISObjectDetector.py",
            "ExtractBands": [0, 1, 2],
            "Classes": [{"Value": 1, "Name": "1", "Color": [52, 54, 194]}],
            "MinCellSize": {"x": 5, "y": 5, "spatialReference": {"wkid": None}},
            "MaxCellSize": {"x": 35, "y": 35, "spatialReference": {"wkid": None}},
            "ModelFile": "OilTankDetection.pth",
            "ImageHeight": 400,
            "ImageWidth": 400,
            "ImageSpaceUsed": "MAP_SPACE",
            "ModelName": "MMDetection",
        },
        "properties": "None",
        "postprocessing_workflow": "Polygon Segmentation",
        "thresh": 0.7,
        "nms_ratio": 0.1,
        "SAM_segmentation": "False",
    },
    "COOLING TOWER DETECTION - USA": {
        "id": "b76483d136e543b38e8a275250887d8d",
        "RecommendedCellSize": "15",
        "batch_size": "1",
        "owner": "esri_analytics",
        "modified": 1701320548000,
        "name": "OilTankDetection.dlpk",
        "title": "Oil Tank Detection",
        "emd": {
            "ModelType": "InstanceDetection",
            "InferenceFunction": "ArcGISObjectDetector.py",
            "ExtractBands": [0, 1, 2],
            "Classes": [{"Value": 1, "Name": "cooling_tower", "Color": [219, 60, 135]}],
            "ModelFile": "CoolingTowerDetection_USA.pth",
            "ImageHeight": 400,
            "ImageWidth": 400,
            "ImageSpaceUsed": "MAP_SPACE",
            "MinCellSize": {"x": 5, "y": 5, "spatialReference": {"wkid": None}},
            "MaxCellSize": {"x": 20, "y": 20, "spatialReference": {"wkid": None}},
            "ModelName": "MaskRCNN",
        },
        "properties": "None",
        "postprocessing_workflow": "None",
        "thresh": 0.5,
        "nms_ratio": None,
        "SAM_segmentation": "False",
    },
    "PRITHVI - CROP CLASSIFICATION": {
        "id": "39e598cb9eed4f1eac28f8484c5f3679",
        "RecommendedCellSize": 1000,
        "owner": "esri_analytics",
        "batch_size": "1",
        "modified": 1705606206000,
        "name": "Prithvi_CropClassification.dlpk",
        "title": "Prithvi - Crop Classification",
        "emd": {
            "ModelType": "ImageClassification",
            "InferenceFunction": "ArcGISCropImageClassifier.py",
            "ExtractBands": [
                0,
                1,
                2,
                3,
                4,
                5,
                6,
                7,
                8,
                9,
                10,
                11,
                12,
                13,
                14,
                15,
                16,
                17,
            ],
            "Classes": [
                {"Value": 1, "Name": "Forest", "Color": [84, 207, 125]},
                {"Value": 2, "Name": "Corn", "Color": [13, 218, 31]},
                {"Value": 3, "Name": "Soybeans", "Color": [147, 190, 176]},
                {"Value": 4, "Name": "Wetlands", "Color": [245, 84, 178]},
                {"Value": 5, "Name": "Developed/Barren", "Color": [127, 143, 88]},
                {"Value": 6, "Name": "Open Water", "Color": [43, 67, 131]},
                {"Value": 7, "Name": "Winter Wheat", "Color": [235, 138, 93]},
                {"Value": 8, "Name": "Natural Vegetation", "Color": [151, 0, 59]},
                {"Value": 9, "Name": "Fallow/Idle Cropland", "Color": [71, 14, 250]},
                {"Value": 10, "Name": "Cotton", "Color": [143, 72, 98]},
                {"Value": 11, "Name": "Sorghum", "Color": [168, 73, 167]},
                {"Value": 12, "Name": "Alfalfa", "Color": [223, 194, 104]},
            ],
            "MinCellSize": {"x": 1000, "y": 1000, "spatialReference": {"wkid": None}},
            "MaxCellSize": {"x": 3005, "y": 3005, "spatialReference": {"wkid": None}},
            "ModelFile": "prithivi100M_crop_classification.pth",
            "ImageHeight": 224,
            "ImageWidth": 224,
            "ImageSpaceUsed": "MAP_SPACE",
            "ModelName": "MMSegmentation",
        },
        "properties": "None",
        "postprocessing_workflow": "None",
        "thresh": None,
        "nms_ratio": None,
        "SAM_segmentation": "False",
    },
    "PRITHVI - FLOOD SEGMENTATION": {
        "id": "29dc90c33daf402caa9293c2088d1057",
        "RecommendedCellSize": 1000,
        "owner": "esri_analytics",
        "batch_size": "1",
        "modified": 1705606285000,
        "name": "Prithvi_FloodSegmentation.dlpk",
        "title": "Prithvi - Flood Segmentation",
        "emd": {
            "ModelType": "ImageClassification",
            "InferenceFunction": "ArcGISFloodImageClassifier.py",
            "ExtractBands": [0, 1, 2, 3, 4, 5],
            "Classes": [{"Value": 1, "Name": "Water", "Color": [218, 14, 14]}],
            "MinCellSize": {"x": 1000, "y": 1000, "spatialReference": {"wkid": None}},
            "MaxCellSize": {"x": 3005, "y": 3005, "spatialReference": {"wkid": None}},
            "ModelFile": "prithivi100M_sen1floods.pth",
            "ImageHeight": 224,
            "ImageWidth": 224,
            "ImageSpaceUsed": "MAP_SPACE",
            "ModelName": "MMSegmentation",
        },
        "properties": "None",
        "postprocessing_workflow": "None",
        "thresh": None,
        "nms_ratio": None,
        "SAM_segmentation": "False",
    },
    "PRITHVI - BURN SCARS SEGMENTATION": {
        "id": "9af7af28dd91473bbc8ad40942e74563",
        "RecommendedCellSize": 1000,
        "owner": "esri_analytics",
        "batch_size": "1",
        "modified": 1705606155000,
        "name": "Prithvi_BurnScarsSegmentation.dlpk",
        "title": "Prithvi - Burn Scars Segmentation",
        "emd": {
            "ModelType": "ImageClassification",
            "InferenceFunction": "ArcGISBurnScarImageClassifier.py",
            "ExtractBands": [0, 1, 2, 3, 4, 5],
            "Classes": [{"Value": 1, "Name": "Burn scar", "Color": [116, 184, 9]}],
            "MinCellSize": {"x": 1000, "y": 1000, "spatialReference": {"wkid": None}},
            "MaxCellSize": {"x": 3005, "y": 3005, "spatialReference": {"wkid": None}},
            "ModelFile": "prithivi100M_burn_scars.pth",
            "ImageHeight": 224,
            "ImageWidth": 224,
            "ImageSpaceUsed": "MAP_SPACE",
            "ModelName": "MMSegmentation",
        },
        "properties": "None",
        "postprocessing_workflow": "None",
        "thresh": None,
        "nms_ratio": None,
        "SAM_segmentation": "False",
    },
    "AGRICULTURAL FIELD DELINEATION": {
        "id": "eb5f896bf88b46af8252e17fa404a73d",
        "RecommendedCellSize": 1000,
        "owner": "esri_analytics",
        "batch_size": "1",
        "modified": 1706039167000,
        "name": "AgriculturalFieldDelineation.dlpk",
        "title": "Agricultural Field Delineation",
        "emd": {
            "ModelType": "InstanceDetection",
            "InferenceFunction": "ArcGISInstanceDetector.py",
            "ExtractBands": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
            "Classes": [{"Value": 1, "Name": "field", "Color": [61, 224, 213]}],
            "MinCellSize": {"x": 200, "y": 200, "spatialReference": {"wkid": None}},
            "MaxCellSize": {"x": 1005, "y": 1005, "spatialReference": {"wkid": None}},
            "ModelFile": "AgricultureFieldDelination.pth",
            "ImageHeight": 224,
            "ImageWidth": 224,
            "ImageSpaceUsed": "MAP_SPACE",
            "ModelName": "MaskRCNN",
        },
        "properties": "None",
        "postprocessing_workflow": "None",
        "thresh": 0.5,
        "nms_ratio": 0.1,
        "SAM_segmentation": "False",
    },
}

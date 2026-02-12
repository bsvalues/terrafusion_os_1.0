"""-------------------------------------------------------------------------
    Tool:               Extract Features Using AI Models (GeoAI Tools)
    Source Name:        ExtractFeaturesUsingAIModels.py
    Version:            ArcGIS Pro 3.3
    Author:             Esri, Inc.
    Usage:
    Required Arguments: Input Raster
                        Mode
                        Output Location
                        Output Prefix
    Optional Arguments: Area Of Interest
                        Pretrained Models
                        Additional Models
                        Confidence Threshold
                        Save Intermediate Output
                        Test Time Augmentation
                        Buffer Distance
                        Extend Length
                        Smoothing Tolerance
                        Dangle Length
                        Input Road Features
                        Road Buffer Width
                        Regularize Parcels
                        Post Processing Workflow
                        Output Features
                        Tolerance Between Adjacent Parcels
                        Regularization Method
                        Tolerance
                        Prompt
                        Input Features
                        Output Summary
    Description:        The tool extracts different geographical features
                        from the input imagery using set of pretrained models
                        from ArcGIS living atlas of the world or from custom models
                        saved locally.
    Updated:            09-01-2024
------------------------------------------------------------------------"""
import gc
import os
import tempfile
import time
import urllib.request
import warnings
import zipfile

# ce0
import arcpy
import ujson as json

# ce60
warnings.filterwarnings("ignore")

# ce1
try:
    import torch
    import arcgis

    HAS_DEPS = True
except:
    HAS_DEPS = False


# ce2
def _raise_conda_import_error():
    arcpy.AddIDMessage("ERROR", 260005)
    exit(260005)


# ce3
def check_gpu_available():
    if torch.cuda.is_available() and (
        not arcpy.env.processorType or arcpy.env.processorType == "GPU"
    ):
        arcpy.env.processorType = "GPU"
        arcgis.env._processorType = arcpy.env.processorType
        os.environ["CUDA_DEVICE_ORDER"] = "PCI_BUS_ID"
        if not arcpy.env.gpuId:
            arcpy.env.gpuId = 0
        os.environ["CUDA_VISIBLE_DEVICES"] = str(arcpy.env.gpuId)
        arcgis.env._gpuid = arcpy.env.gpuId
        torch.cuda.set_device(arcpy.env.gpuId)
    else:
        arcpy.AddIDMessage("ERROR", 260325)
        exit()


# ce2
if not HAS_DEPS:
    _raise_conda_import_error()

# ce4
from GeoAIExtractFeaturesUtils import (
    lines_postprocessing,
    down_dlpk_batch_size,
    parcels_postprocessing,
    pretrained_model_store,
    polygon_postprocessing,
    polygon_segmentation,
    post_op_list,
    third_party_list,
    incomp_add_mod_postP_check,
    auto_bt_sp_list,
    incomp_mod_and_band,
    sentinel_one_model_list,
    sentinel_one_preprocessing,
    sentinel_two_model_list,
    model_list_16_bit,
    prithvi_list,
)

# ce3
check_gpu_available()

# ce5
postp_workflow_lib = {
    "line regularization": lines_postprocessing,
    "parcel regularization": parcels_postprocessing,
    "polygon regularization": polygon_postprocessing,
    "polygon segmentation": polygon_segmentation,
}


# ce6
def post_infer_cleanup(env_var6):
    try:
        gc.collect()
    except:
        pass
    try:
        torch.cuda.empty_cache()
    except:
        pass
    # ce51
    arcpy.env.overwriteOutput = env_var6
    arcpy.CheckInExtension("ImageAnalyst")

    return


# ce7
def net_check():
    n_status = False
    try:
        urllib.request.urlopen("https://livingatlas.arcgis.com/", timeout=3)
    except:
        n_status = True

    return n_status


# ce234
def out_table_gen(path_list):
    table_name_path = arcpy.GetParameterAsText(24).strip()
    output_table_loc = os.path.dirname(str(table_name_path))
    output_table_name = os.path.basename(str(table_name_path))
    if table_name_path == "#":
        table_name_path = ""
    if output_table_loc == "#":
        output_table_loc = ""
    if output_table_name == "#":
        output_table_name = ""

    # ce100
    if str(output_table_loc) == "":
        return

    # ce101
    if len(path_list) == 0:
        arcpy.AddIDMessage("WARNING", 260220)
        return

    user_sett_addout2 = arcpy.env.addOutputsToMap
    arcpy.env.addOutputsToMap = False
    user_env_overwrite2 = arcpy.env.overwriteOutput
    arcpy.env.overwriteOutput = True

    try:
        out_table = arcpy.CreateTable_management(output_table_loc, output_table_name)

        fld = ["output_name", "output_path"]
        arcpy.management.AddField(out_table, fld[0], "TEXT")
        arcpy.management.AddField(out_table, fld[1], "TEXT")

        with arcpy.da.InsertCursor(out_table, fld) as cursor:
            for x in range(len(path_list)):
                cursor.insertRow((os.path.basename(path_list[x]), path_list[x]))

    except:
        arcpy.AddIDMessage("WARNING", 260219)
        pass
    arcpy.env.addOutputsToMap = user_sett_addout2
    arcpy.env.overwriteOutput = user_env_overwrite2

    return


# ce8
def check_extension_licenses(model_name, model_info):
    postp_workflow = ""

    if isinstance(model_info, bool):
        if arcpy.CheckExtension("ImageAnalyst") != "Available":
            arcpy.AddIDMessage("WARNING", 260289, str(model_name))
            return False
        else:
            return True
    else:
        # ce9
        if not isinstance(model_info, dict):
            postp_workflow = model_info
        # ce10
        else:
            emd = model_info[model_name]
            postp_workflow = emd["postprocessing_workflow"]
        if postp_workflow == "Polygon Regularization":
            if arcpy.CheckExtension("3D") != "Available":
                if model_name != "":
                    arcpy.AddIDMessage("WARNING", 260250, model_name)
                else:
                    arcpy.AddIDMessage("ERROR", 260324)
                return False
            else:
                return True
        elif postp_workflow == "Polygon Segmentation":
            if arcpy.CheckExtension("ImageAnalyst") != "Available":
                arcpy.AddIDMessage("WARNING", 260313)
                return False
            else:
                return True

        elif postp_workflow == "Line Regularization":
            if (arcpy.CheckExtension("3D") != "Available") or (
                arcpy.CheckExtension("Foundation") != "Available"
            ):
                if model_name != "":
                    arcpy.AddIDMessage("WARNING", 260242, model_name)
                # ce11
                else:
                    arcpy.AddIDMessage("ERROR", 260251)
                return False
            else:
                return True
        else:
            if (
                (arcpy.CheckExtension("3D") != "Available")
                or (arcpy.CheckExtension("Foundation") != "Available")
                or (arcpy.CheckExtension("Spatial") != "Available")
            ):
                if model_name != "":
                    arcpy.AddIDMessage("WARNING", 260249, model_name)
                # ce11
                else:
                    arcpy.AddIDMessage("ERROR", 260252)
                return False
            else:
                return True


# ce72
def bit_depth_msg(input_rst, pretrained_list):
    if len(pretrained_list) != 0:
        bit_check_all = str(
            arcpy.GetRasterProperties_management(input_rst, "VALUETYPE")
        )

        if bit_check_all not in ["3", "4"]:
            arcpy.AddIDMessage("INFORMATIVE", 260292)

        # ce71
        for md in pretrained_list:
            if md in sentinel_two_model_list:
                arcpy.AddIDMessage("INFORMATIVE", 260295)
                break


# ce12
def infer_tool_helper(model, in_raster, out_path, is_pretrained_model, output_label):
    # ce51
    user_env_overwrite6 = arcpy.env.overwriteOutput
    arcpy.env.overwriteOutput = True
    # ce14
    aoi = arcpy.GetParameterAsText(4)
    output_loc = arcpy.GetParameterAsText(2)
    conf_thresh = arcpy.GetParameterAsText(7).strip()
    tta = arcpy.GetParameterAsText(9).strip()
    if tta == "#":
        tta = ""
    if aoi == "#":
        aoi = ""
    if conf_thresh == "#":
        conf_thresh = ""
    nms_key = "NO_NMS"
    nms_ratio = 0
    # ce15
    msg1 = arcpy.GetIDMessage(260256)
    msg = msg1 + model
    arcpy.SetProgressorLabel(msg)
    # ce16
    arcpy.CheckOutExtension("ImageAnalyst")
    # ce17
    if tta == "":
        tta = "False"
    # ce18
    emd = {}
    if is_pretrained_model:
        model_params = pretrained_model_store[model]
        emd = pretrained_model_store[model]["emd"]
    else:
        try:
            if model.endswith(".dlpk"):
                with zipfile.ZipFile(model) as z:
                    for f in z.filelist:
                        if (
                            f.filename.endswith(".emd")
                            and os.path.dirname(f.filename) == ""
                        ):
                            emd = json.load(z.open(f))
                            break
            else:
                with open(model) as f:
                    emd = json.load(f)
        except:
            pass

    # ce19
    if len(emd) == 0:
        arcpy.AddIDMessage("WARNING", 260260, str(model))
        post_infer_cleanup(user_env_overwrite6)
        return out_path
    # ce20
    model_path = model
    if is_pretrained_model:
        model_path = f"https://www.arcgis.com/sharing/rest/content/items/{pretrained_model_store[model]['id']}"
        # ce61
        mod_band_ck, cxx_emd, ras_bnd, mod_bnd = incomp_mod_and_band(in_raster, emd)
        band_str = str(mod_bnd) + ", " + str(ras_bnd)
        if not cxx_emd:
            arcpy.AddIDMessage("WARNING", 260221, str(model))
            post_infer_cleanup(user_env_overwrite6)
            return out_path

        if mod_band_ck and cxx_emd:
            arcpy.AddIDMessage("WARNING", 260267, str(model), str(band_str))
            post_infer_cleanup(user_env_overwrite6)
            return out_path
    # ce21
    else:
        mod_band_ck, cxx_emd, ras_bnd, mod_bnd = incomp_mod_and_band(in_raster, emd)
        band_str = str(mod_bnd) + ", " + str(ras_bnd)
        if not cxx_emd:
            arcpy.AddIDMessage("WARNING", 260221, str(model_path))
            post_infer_cleanup(user_env_overwrite6)
            return out_path

        if mod_band_ck and cxx_emd:
            arcpy.AddIDMessage("WARNING", 260267, str(model_path), str(band_str))
            post_infer_cleanup(user_env_overwrite6)
            return out_path

        if "ModelType" not in emd:
            arcpy.AddIDMessage("WARNING", 260230, str(model_path))
            post_infer_cleanup(user_env_overwrite6)
            return out_path

        if emd["ModelType"] not in [
            "ImageClassification",
            "ObjectDetection",
            "InstanceDetection",
        ]:
            arcpy.AddIDMessage("WARNING", 260230, str(model_path))
            post_infer_cleanup(user_env_overwrite6)
            return out_path
    # ce22
    batch_size, pretr_dwn_dlpk_path = down_dlpk_batch_size(
        is_pretrained_model, model, third_party_list, model_path, auto_bt_sp_list
    )

    # ce23
    model_path = pretr_dwn_dlpk_path
    # ce24
    if len(model_path) == 0:
        post_infer_cleanup(user_env_overwrite6)
        return out_path
    # ce25
    infer_CS_typ = ""
    infer_CS_WKT = ""
    infer_CS_sr = arcpy.SpatialReference()
    infer_CS_typ = str(arcpy.Describe(in_raster).spatialReference.type)
    infer_CS_WKT = str(arcpy.Describe(in_raster).spatialReference.exportToString())
    infer_CS_sr = arcpy.SpatialReference(text=infer_CS_WKT)
    PCS_WKT_sr = arcpy.SpatialReference(
        text='PROJCS["WGS_1984_Web_Mercator_Auxiliary_Sphere",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Mercator_Auxiliary_Sphere"],PARAMETER["False_Easting",0.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",0.0],PARAMETER["Standard_Parallel_1",0.0],PARAMETER["Auxiliary_Sphere_Type",0.0],UNIT["Meter",1.0]]'
    )
    # ce26
    if is_pretrained_model:
        CS_to_use = PCS_WKT_sr
        if model in sentinel_one_model_list:
            CS_to_use = infer_CS_sr
    else:
        if infer_CS_typ == "Unknown":
            CS_to_use = infer_CS_sr
        else:
            CS_to_use = PCS_WKT_sr

    # ce27
    infer_gdb_name = os.path.basename(tempfile.TemporaryDirectory().name)
    gdb_path = os.path.join(tempfile.gettempdir(), (infer_gdb_name + ".gdb"))
    arcpy.management.CreateFileGDB(
        tempfile.gettempdir(), arcpy.ValidateTableName(infer_gdb_name)
    )
    workspace_path = os.path.join(tempfile.gettempdir(), infer_gdb_name)
    # ce29
    if arcpy.Exists(aoi):
        infer_aoi = os.path.join(gdb_path, "interim_data_2f")
        with arcpy.EnvManager(outputCoordinateSystem=CS_to_use):
            arcpy.management.CopyFeatures(in_features=aoi, out_feature_class=infer_aoi)
        aoi = infer_aoi
    # ce28
    infer_raster = os.path.join(gdb_path, "interim_data_3f")
    sar_raster = in_raster
    if model in prithvi_list:
        with arcpy.EnvManager(outputCoordinateSystem=CS_to_use, extent=aoi):
            arcpy.CopyRaster_management(
                in_raster=in_raster, out_rasterdataset=infer_raster
            )
    else:
        if model in model_list_16_bit:
            with arcpy.EnvManager(outputCoordinateSystem=CS_to_use, extent=aoi):
                arcpy.CopyRaster_management(
                    in_raster=in_raster,
                    out_rasterdataset=infer_raster,
                    pixel_type="16_BIT_UNSIGNED",
                    scale_pixel_value="NONE",
                )
        else:
            with arcpy.EnvManager(outputCoordinateSystem=CS_to_use, extent=aoi):
                arcpy.CopyRaster_management(
                    in_raster=in_raster,
                    out_rasterdataset=infer_raster,
                    pixel_type="8_BIT_UNSIGNED",
                    scale_pixel_value="ScalePixelValue",
                )
    in_raster = infer_raster
    proc_out_raster = os.path.join(gdb_path, "interim_data_4f")
    proc_out_vec = os.path.join(gdb_path, "interim_data_5f")

    # ce30
    cell_size = None
    if is_pretrained_model:
        model_cell_size_in_cm = model_params["RecommendedCellSize"]
        if model_cell_size_in_cm is None:
            cell_size = None
        else:
            cell_size = int(model_cell_size_in_cm) / 100
    else:
        r = arcpy.ia.Raster(in_raster)
        cell_size_of_raster = (r.meanCellHeight + r.meanCellHeight) / 2
        cell_size = cell_size_of_raster
        del r
    # ce62
    if is_pretrained_model:
        if conf_thresh == "":
            thr = model_params["thresh"]
            if thr is not None:
                conf_thresh = thr

    # ce64
    if is_pretrained_model:
        if model in sentinel_one_model_list:
            sar_pre_proc_lic = True
            lic_sar = check_extension_licenses(model, sar_pre_proc_lic)
            if not lic_sar:
                arcpy.Delete_management(gdb_path)
                post_infer_cleanup(user_env_overwrite6)
                return

            # ce98
            arcpy.CheckInExtension("ImageAnalyst")

            msg4 = arcpy.GetIDMessage(260291)
            arcpy.SetProgressorLabel(msg4)

            pre_proc_sar = os.path.join(gdb_path, "interim_data_6f")
            try:
                sar_ret = sentinel_one_preprocessing(
                    model, sar_raster, pre_proc_sar, aoi
                )
            except Exception as e:
                arcpy.AddIDMessage("WARNING", 260290, str(model))
                arcpy.AddIDMessage("WARNING", 260269, str(e))
                arcpy.Delete_management(gdb_path)
                return
            # ce99
            arcpy.CheckOutExtension("ImageAnalyst")

            in_raster = pre_proc_sar
        else:
            pass

    # ce31
    msg1 = arcpy.GetIDMessage(260229)
    msg = msg1 + model
    arcpy.SetProgressorLabel(msg)

    # ce32
    try:
        if emd["ModelType"] in ["ObjectDetection", "InstanceDetection"]:
            if is_pretrained_model and "nms_ratio" in pretrained_model_store[model]:
                nms_ratio = pretrained_model_store[model]["nms_ratio"]
                if nms_ratio is not None:
                    nms_key = "NMS"

            with arcpy.EnvManager(
                addOutputsToMap=False,
                processorType="GPU",
                cellSize=cell_size,
                extent=aoi,
                scratchWorkspace=output_loc,
            ):
                arcpy.ia.DetectObjectsUsingDeepLearning(
                    in_raster=in_raster,
                    out_detected_objects=proc_out_vec,
                    in_model_definition=model_path,
                    arguments=f"batch_size {batch_size};test_time_augmentation {tta};threshold {conf_thresh};radiometric_offset_correction True",
                    run_nms=nms_key,
                    max_overlap_ratio=nms_ratio,
                )

                # ce33
                with arcpy.EnvManager(outputCoordinateSystem=infer_CS_sr):
                    arcpy.management.CopyFeatures(
                        in_features=proc_out_vec, out_feature_class=out_path
                    )
                # ce34
                try:
                    arcpy.management.RepairGeometry(out_path)
                except:
                    pass
                # ce35
                post_infer_cleanup(user_env_overwrite6)
                arcpy.Delete_management(gdb_path)
                return out_path
    # ce36
    except Exception as e:
        if "CUDA out of memory" in str(e):
            if is_pretrained_model:
                arcpy.AddIDMessage("WARNING", 260261, str(model))
            else:
                arcpy.AddIDMessage("WARNING", 260261, str(model_path))
        else:
            if is_pretrained_model:
                arcpy.AddIDMessage("WARNING", 260238, str(model))
            else:
                arcpy.AddIDMessage("WARNING", 260238, str(model_path))
            arcpy.AddIDMessage("WARNING", 260269, str(e))
        pass

    try:
        with arcpy.EnvManager(
            addOutputsToMap=False,
            processorType="GPU",
            cellSize=cell_size,
            extent=aoi,
            scratchWorkspace=output_loc,
        ):
            # ce103
            if emd["ModelType"] in ["ImageClassification"]:
                out_classified_raster = arcpy.ia.ClassifyPixelsUsingDeepLearning(
                    in_raster=in_raster,
                    in_model_definition=model_path,
                    arguments=f"batch_size {batch_size};test_time_augmentation {tta};output_label_level {output_label};radiometric_offset_correction True",
                    processing_mode="PROCESS_AS_MOSAICKED_IMAGE",
                )
                out_classified_raster.save(proc_out_raster)
                # ce33
                with arcpy.EnvManager(outputCoordinateSystem=infer_CS_sr):
                    arcpy.CopyRaster_management(
                        in_raster=proc_out_raster, out_rasterdataset=out_path
                    )
                # ce35
                del out_classified_raster
                post_infer_cleanup(user_env_overwrite6)
                arcpy.Delete_management(gdb_path)
                return out_path
    # ce36
    except Exception as e:
        if "CUDA out of memory" in str(e):
            if is_pretrained_model:
                arcpy.AddIDMessage("WARNING", 260261, str(model))
            else:
                arcpy.AddIDMessage("WARNING", 260261, str(model_path))
        else:
            if is_pretrained_model:
                arcpy.AddIDMessage("WARNING", 260238, str(model))
            else:
                arcpy.AddIDMessage("WARNING", 260238, str(model_path))
            arcpy.AddIDMessage("WARNING", 260269, str(e))
        pass
    # ce35
    post_infer_cleanup(user_env_overwrite6)
    arcpy.Delete_management(gdb_path)
    return out_path


# ce38
def infer_and_postprocess():
    # ce39
    in_raster = arcpy.GetParameterAsText(0)
    pretrained_models = arcpy.GetParameter(5)
    additional_models = arcpy.GetParameter(6)
    output_prefix = arcpy.GetParameterAsText(3)
    output_location = arcpy.GetParameterAsText(2)
    save_interm_output = arcpy.GetParameterAsText(8)
    sam_flag = arcpy.GetParameterAsText(22)

    # ce40
    NO_MOD = True
    if (pretrained_models == []) and (additional_models.exportToString() == ""):
        arcpy.AddIDMessage("WARNING", 260266)
        NO_MOD = False
        net = net_check()
        if net is True:
            arcpy.AddIDMessage("WARNING", 260265)
        return

    # ce65
    bit_depth_msg(in_raster, pretrained_models)

    # ce66
    infer_CS_typ = ""
    infer_CS_WKT = ""
    infer_CS_sr = arcpy.SpatialReference()
    infer_CS_typ = str(arcpy.Describe(in_raster).spatialReference.type)
    infer_CS_WKT = str(arcpy.Describe(in_raster).spatialReference.exportToString())
    infer_CS_sr = arcpy.SpatialReference(text=infer_CS_WKT)
    PCS_WKT_sr = arcpy.SpatialReference(
        text='PROJCS["WGS_1984_Web_Mercator_Auxiliary_Sphere",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Mercator_Auxiliary_Sphere"],PARAMETER["False_Easting",0.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",0.0],PARAMETER["Standard_Parallel_1",0.0],PARAMETER["Auxiliary_Sphere_Type",0.0],UNIT["Meter",1.0]]'
    )

    # ce41
    arg_store = []
    for model_name in pretrained_models:
        do_postp = "false"
        # ce42
        if model_name in post_op_list(
            pretrained_model_store
        ) and check_extension_licenses(model_name, pretrained_model_store):
            do_postp = "true"
        postp_workflow = ""
        if do_postp == "true":
            emd = pretrained_model_store[model_name]
            postp_workflow = emd["postprocessing_workflow"]
        arg_store.append((str(model_name), True, postp_workflow))
    for i in range(additional_models.rowCount):
        model_path, postp_workflow = additional_models.getTrueRow(i)
        postp_workflow = postp_workflow.strip()
        # ce42
        addn_model_license = check_extension_licenses(
            str(model_path), str(postp_workflow)
        )
        if not addn_model_license:
            postp_workflow = ""
        # ce43
        ad_mod_post_check = incomp_add_mod_postP_check(
            str(model_path), str(postp_workflow)
        )
        if ad_mod_post_check:
            postp_workflow = ""
        arg_store.append((str(model_path), False, str(postp_workflow)))

    # ce44
    interm_store = []
    for i, (model, is_pretrained_model, postp_workflow) in enumerate(arg_store):
        # ce45
        if is_pretrained_model:
            out_name = model
        else:
            out_name = os.path.basename(str(model)).split(".")[0]
        out_name = "".join([(a if a.isalnum() else "_") for a in out_name.lower()])
        out_name = output_prefix + "_" + out_name
        _out_path = out_path = os.path.join(output_location, out_name)
        interm_path = _out_path + "interim"
        if postp_workflow != "" or postp_workflow == "true":
            _out_path = interm_path
        # ce46
        msg1 = arcpy.GetIDMessage(260229)
        msg = msg1 + model
        arcpy.SetProgressorLabel(msg)
        # ce47
        output_label_level = 1
        if is_pretrained_model and model == "Land Cover Classification (Sentinel-2)":
            output_label_level = 2

        for label_level in range(output_label_level):
            out_level = label_level + 1
            if out_level == 2:
                _out_path = os.path.join(
                    output_location, "Land_Cover_Classification_out_label_2"
                )

            # ce48
            output = infer_tool_helper(
                model=model,
                in_raster=in_raster,
                out_path=_out_path,
                is_pretrained_model=is_pretrained_model,
                output_label=out_level,
            )
            if postp_workflow not in ["", "None"] or postp_workflow == "true":
                interm_store.append(
                    (postp_workflow, interm_path, out_path, output, model)
                )
            else:
                interm_store.append(
                    (postp_workflow, interm_path, _out_path, output, model)
                )
        time.sleep(1)

    # ce49
    output_store = []
    # ce50
    info_msg_i_p = True
    local_list_postp = []
    # ce51
    user_env_overwrite3 = arcpy.env.overwriteOutput
    arcpy.env.overwriteOutput = True
    user_sett_addout3 = arcpy.env.addOutputsToMap
    arcpy.env.addOutputsToMap = False
    # ce52
    for postp_workflow, interm_path, out_path, output, model in interm_store:
        if postp_workflow != "" and postp_workflow != "None":
            pretrained_first_post_p_worked = True
            sam_post_p_worked = True
            try:
                # ce37
                if postp_workflow in local_list_postp:
                    info_msg_i_p = False
                else:
                    info_msg_i_p = True
                local_list_postp.append(postp_workflow)
                # ce121
                return_kind = postp_workflow_lib[postp_workflow.lower()](
                    interm_path, out_path, info_msg_i_p, model
                )
                # ce122
                if return_kind in ["known_exit", "SAM_none_exit", "blank_input_data"]:
                    if arcpy.Exists(interm_path):
                        data_desc = arcpy.Describe(interm_path)
                        vec_list = [
                            "FeatureClass",
                            "FeatureDataset",
                            "ShapeFile",
                            "FeatureLayer",
                        ]
                        if str(data_desc.dataType) not in vec_list:
                            with arcpy.EnvManager(outputCoordinateSystem=infer_CS_sr):
                                arcpy.CopyRaster_management(
                                    in_raster=interm_path, out_rasterdataset=out_path
                                )
                        else:
                            with arcpy.EnvManager(outputCoordinateSystem=infer_CS_sr):
                                arcpy.management.CopyFeatures(
                                    in_features=interm_path, out_feature_class=out_path
                                )

            except Exception as e:
                arcpy.AddIDMessage("WARNING", 260237, str(model))
                arcpy.AddIDMessage("WARNING", 260269, str(e))
                pretrained_first_post_p_worked = False
                if arcpy.Exists(interm_path):
                    data_desc = arcpy.Describe(interm_path)
                    vec_list = [
                        "FeatureClass",
                        "FeatureDataset",
                        "ShapeFile",
                        "FeatureLayer",
                    ]
                    if str(data_desc.dataType) not in vec_list:
                        with arcpy.EnvManager(outputCoordinateSystem=infer_CS_sr):
                            arcpy.CopyRaster_management(
                                in_raster=interm_path, out_rasterdataset=out_path
                            )
                    else:
                        with arcpy.EnvManager(outputCoordinateSystem=infer_CS_sr):
                            arcpy.management.CopyFeatures(
                                in_features=interm_path, out_feature_class=out_path
                            )
                pass

            try:
                # ce132
                if (postp_workflow.lower()) != "polygon segmentation":
                    if model in list(pretrained_model_store.keys()):
                        second_postp_sam = pretrained_model_store[model][
                            "SAM_segmentation"
                        ]
                        local_list_postp.append("Polygon Segmentation")
                        # ce132
                        if second_postp_sam == "True":
                            return_kind = polygon_segmentation(
                                out_path, out_path, info_msg_i_p, model
                            )

            except Exception as e:
                arcpy.AddIDMessage("WARNING", 260201, str(model))
                arcpy.AddIDMessage("WARNING", 260269, str(e))
                sam_post_p_worked = False
                pass

            # ce53
            if save_interm_output.lower() != "true":
                arcpy.management.Delete(interm_path)
            # ce54
            output_store.append(out_path)
        else:
            output_store.append(out_path)
    # ce51
    arcpy.env.overwriteOutput = user_env_overwrite3
    arcpy.env.addOutputsToMap = user_sett_addout3

    table_list = []
    # ce55
    try:
        if NO_MOD:
            aprx = arcpy.mp.ArcGISProject("CURRENT")
            m = aprx.activeMap
            if len(output_store) != 0:
                proceed = False
                for output in output_store:
                    if arcpy.Exists(output):
                        proceed = True
                    else:
                        continue
                if proceed:
                    glayer = m.createGroupLayer(output_prefix)

                for output in output_store:
                    try:
                        if arcpy.Exists(output):
                            out_lyr = m.addDataFromPath(output)
                            m.addLayerToGroup(glayer, out_lyr, "BOTTOM")
                            m.removeLayer(out_lyr)
                            table_list.append(output)

                    except:
                        continue
            else:
                pass
    except:
        arcpy.AddIDMessage("WARNING", 260233)

    # ce146
    out_table_gen(table_list)

    return


# ce56
def only_postprocess():
    # ce57
    in_raster = arcpy.GetParameterAsText(0)
    in_vector = arcpy.GetParameterAsText(23)
    postp_workflow = arcpy.GetParameterAsText(17)
    out_features = arcpy.GetParameterAsText(18)
    license_available = check_extension_licenses("", postp_workflow)

    # ce147
    if postp_workflow in ["Polygon Regularization"]:
        in_raster = in_vector
    if postp_workflow in ["Line Regularization"]:
        if str(in_raster) == "":
            in_raster = in_vector

    # ce50
    info_msg_only_p = True
    dummy_model_name = ""

    # ce42
    if license_available:
        # ce51
        user_sett_addout1 = arcpy.env.addOutputsToMap
        arcpy.env.addOutputsToMap = False
        user_env_overwrite1 = arcpy.env.overwriteOutput
        arcpy.env.overwriteOutput = True
        try:
            return_kind = postp_workflow_lib[postp_workflow.lower()](
                in_raster, out_features, info_msg_only_p, dummy_model_name
            )

        except Exception as e:
            arcpy.AddIDMessage("WARNING", 260255)
            arcpy.AddIDMessage("WARNING", 260269, str(e))
            pass

        # ce51
        arcpy.env.addOutputsToMap = user_sett_addout1
        arcpy.env.overwriteOutput = user_env_overwrite1

    return


# ce13
def main():
    # ce58
    ex_mode = arcpy.GetParameterAsText(1)
    if ex_mode in [
        "Infer and Postprocess",
        "infer and postprocess",
        "infer_and_postprocess",
        "Infer_and_Postprocess",
        "INFER AND POSTPROCESS",
        "INFER_AND_POSTPROCESS",
    ]:
        infer_and_postprocess()
    if ex_mode in [
        "Only Postprocess",
        "only_postprocess",
        "only postprocess",
        "Only_Postprocess",
        "ONLY POSTPROCESS",
        "ONLY_POSTPROCESS",
    ]:
        only_postprocess()

    return


# ce59
if __name__ == "__main__":
    main()

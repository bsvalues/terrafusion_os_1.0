"""-----------------------------------------------------------------------------
Name:              ReconstructSurface.py
Purpose:           Perform Reality mapping production generation using nFrames
                   SURE engine.
Author:            Esri Inc.
Created:           5/20/2021
Copyright:   (c)   Esri, Inc. 2015
ArcGIS Version:    10.9.1
-----------------------------------------------------------------------------"""
# core libraries
import os
import json
import sys
import shutil

# internal libraries
import arcpy
import hostedgp as hgp
import rasterutils
import aolutils
import realityutils

TASK_NAME = 'ReconstructSurface'


# Define supported product list
products_list = ["dtm", "dsm", "true_ortho", "dsm_mesh", "point_cloud", "mesh"]
# products_list = ["DTM", "DSM", "True_Ortho", "DSM_Mesh", "DSM_Mesh_Texturing", "Point_Cloud", "Mesh"]

def _getproductlist(out_products):
    """
    Generate output products parameter value from the service tool input
    for the core GP tool.
    :param out_products: input JSON for the service tool to define list of products to generate.
    e.g. {"DSM": {"serviceProperties": {"name":"droneflight1_2ddsm"}},
    "True_Ortho": {"serviceProperties":{"name":"droneflight1_trueortho"}},
    "DSM_Mesh": {"name":"droneflight1_2dmesh"}}
    :return: dictionary of products parameter value for core GP tool and the service to be created
    """
    products = {}
    # products = {"products_list": "",
    #             "items_list": {
    #                 "DTM": "",
    #                 "DSM": "",
    #                 "True_Ortho": "",
    #                 "DSM_Mesh": "",
    #                 "Point_Cloud": "",
    #                 "Mesh": ""
    #             }
    #             }
    try:
        productslist = ""
        itemslist = {}

        if isinstance(out_products, str):
            out_products = out_products.replace("\\n","")
            out_products = list(rasterutils.getJSON(out_products))
            if out_products == []:
                raise Exception
            else:
                out_products = out_products[0]
 
        if isinstance(out_products, dict):
            # transform all product keys to lower case for case-insensitive match
            out_products = rasterutils.lower_dict_key(out_products)
            prodkeys = out_products.keys()
            productslist = list(set(prodkeys) & set(products_list))
        arcpy.AddMessage(str(productslist))

        if productslist:
            for product in productslist:
                itemslist[product] = out_products[product]

            products["products_list"] = (";".join(productslist))
            products["items_list"] = itemslist

        return products
    except Exception as err:
        arcpy.AddError("Invalid Output Products parameter value.")
        sys.exit(0) 


if __name__ == '__main__':
    """
    Main function for Reconstruct Surface service tool
    """
    inic = arcpy.GetParameterAsText(0)
    outprod = arcpy.GetParameterAsText(1)
    scenario = arcpy.GetParameterAsText(2)
    fwd_ovrlap = arcpy.GetParameterAsText(3)
    swd_ovrlap = arcpy.GetParameterAsText(4)
    quality = arcpy.GetParameterAsText(5)
    aoi = arcpy.GetParameterAsText(6)
    waterbody = arcpy.GetParameterAsText(7)
    correction = arcpy.GetParameterAsText(8)
    options = arcpy.GetParameterAsText(9)
    context = arcpy.GetParameterAsText(10) #Including cell size and other settings

    try:
        loggingEnabled = rasterutils.GPMessagesLogger(context)
    except:
        arcpy.AddMessage("Logging is not enabled")
        pass

    try:
        # 0. Check Image Server extension license
        if arcpy.CheckExtension("Image") != "Available":
            raise rasterutils.LicenseError

        # 0. Set up environment
        moreags = rasterutils._parsecontext(context)
        arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags, "om")
        arcpy.env.overwriteOutput = 1

        # 1. Get input image collection input
        isurl = rasterutils.getInDataPath(inic)
        aisurl = rasterutils.getISAdminUrl(isurl)
        # Get image collection catalog path
        # arcpy.AddMessage("Getting image collection catalog path from URL: {}".format(inic))
        icpath = rasterutils.getImageServiceDatasource(isurl)
        # Need to save the mosaic dataset data store path for tiled mode output
        ic_datastore = ""
        if icpath.startswith("/enterpriseDatabases"):
            ic_datastore = os.path.dirname(icpath)
            icpath = rasterutils._lookupdatastorepath(icpath)
            # arcpy.AddMessage("Temporary EGDB mosaic dataset path: {}".format(icpath))
        # Halt the tool when the image collection source path cannot be found.
        if not icpath:
            arcpy.AddError("Failed to get image collection path.")
            sys.exit(0)

        # 2. Parse output product list.
        prod_json = _getproductlist(outprod)
        if not prod_json:
            arcpy.AddError("Invalid Output Products parameter value.")
            sys.exit(0)

        prod = prod_json["products_list"]
        item_list = prod_json["items_list"]

        # arcpy.AddMessage(str(prod_json))
        # arcpy.AddMessage(str(prod))
        # arcpy.AddMessage(str(item_list))

        # 3. Parse additional parameter values
        # Cell size
        cellsize = rasterutils.getCellsize(context)

        # AOI feature
        aoi_feat = rasterutils.parse_feature_input(aoi, "areaOfInterest", 6)
        # waterbody feature
        waterbody_feat = rasterutils.parse_feature_input(waterbody, "waterBody", 7)
        # correction feature
        correction_feat = rasterutils.parse_feature_input(correction, "correctionFeature", 8)

        # 4. Prepare output raster store location
        # For Enterprise, we will start to priotize on itemId if available, it not, we fall back to mosaic dataset name       
        mdws = os.path.dirname(icpath)
        mdname = os.path.basename(icpath)
        iid = rasterutils.getItemID(aisurl)
        token, referer = rasterutils.getToken(isurl, 5)

        # Define reconstruct folder and product folder
        reconfolder = ""
        prodfolder = ""

        # Note in 11.3, Reality project will be saved in "recon" folder of the workspace if workspace is given, otherwise
        # it follows the old logic of going into image collection's folder.
        reality_ws = realityutils.get_reality_workspace(context)
        # Need make sure the reconstruct folder is in the same workspace as image collection
        if reality_ws:
            ic_flder = realityutils.get_store_property(icpath)
            if ic_flder and ic_flder.find(reality_ws) > -1:
                reconfolder = ic_flder[0:ic_flder.find(reality_ws)+len(reality_ws)] + "/recon"
            else:
                fld_name = reality_ws + "/recon"
                reconfolder = rasterutils.getHostedDataFolder(aisurl, fld_name, token)
            prodfolder = os.path.dirname(reconfolder) + "/products"
        elif iid:
            ws_folder = rasterutils.getHostedDataFolder(aisurl, iid, token)
            reconfolder = ws_folder + "/recon"
            prodfolder = ws_folder + "/products"
        else:
            ws_folder = rasterutils.getHostedDataFolder(aisurl, mdname, token) 
            reconfolder = ws_folder + "/recon"
            prodfolder = ws_folder + "/products"

        # Make sure reconfolder is generated if in file
        if reconfolder:
            reconfolder = rasterutils.generate_directory(reconfolder)
        # Make sure product folder is generated if in file share
        if prodfolder:
            prodfolder = rasterutils.generate_directory(prodfolder)

        # 5. Create product services
        # Hosted imagery layer will be created first
        # Hosted scene layer and point cloud layer will be created when the product file (*.slpk) is available
        # The output product datasets will also be moved into the "products" folder of the workspace if given.
        # Prepare DSM output service
        prod_path_func = lambda prodfolder, prod, prod_path: prodfolder + "/" + prod + ".crf" if prodfolder else prod_path     

        out_dtm = ""
        dtm_iid = ""
        dtm_isurl = ""
        dtm_aisurl = ""
        if "dtm" in item_list:
            dtm = item_list["dtm"]
            dtm_iid, dtm_isurl, dtm_aisurl, out_dtm = rasterutils.getOutRasterPath(dtm)
            out_dtm = prod_path_func(prodfolder, "dtm", out_dtm)
            out_dtm = rasterutils.appendcrf(out_dtm)

        out_dsm = ""
        dsm_mode = "mosaic"
        dsm_iid = ""
        dsm_isurl = ""
        dsm_aisurl = ""
        if "dsm" in item_list:
            dsm = item_list["dsm"]
            if isinstance(dsm, dict):
                if "outputType" in dsm and isinstance(dsm["outputType"], str):
                    dsm_mode = dsm["outputType"].lower()
            dsm_iid, dsm_isurl, dsm_aisurl, out_dsm = rasterutils.getOutRasterPath(dsm)
            out_dsm = prod_path_func(prodfolder, "dsm", out_dsm)
        
        # Prepare True Ortho output service
        out_ortho = ""
        ortho_mode = "mosaic"
        ortho_iid = ""
        ortho_isurl = ""
        ortho_aisurl = ""
        if "true_ortho" in item_list:
            true_ortho = item_list["true_ortho"]
            if isinstance(true_ortho, dict):
                if "outputType" in true_ortho and isinstance(true_ortho["outputType"], str):
                    ortho_mode = true_ortho["outputType"].lower()
            ortho_iid, ortho_isurl, ortho_aisurl, out_ortho = rasterutils.getOutRasterPath(true_ortho)
            out_ortho = prod_path_func(prodfolder, "true_ortho", out_ortho)

        # Prepare DSM Mesh, Mesh and Point cloud item names
        dsm_mesh = {}
        dsm_mesh_name = ""
        if "dsm_mesh" in item_list:
            dsm_mesh = item_list["dsm_mesh"]
            if isinstance(dsm_mesh, dict):
                if "itemProperties" in dsm_mesh:
                    itemprop = dsm_mesh["itemProperties"]
                    if "name" in itemprop and itemprop["name"]:
                        dsm_mesh_name = itemprop["name"]

        mesh = {}
        mesh_name = ""
        if "mesh" in item_list:
            mesh = item_list["mesh"]
            if isinstance(mesh, dict):
                if "itemProperties" in mesh:
                    itemprop = mesh["itemProperties"]
                    if "name" in itemprop and itemprop["name"]:
                        mesh_name = itemprop["name"]
        
        point_cloud = {}
        point_cloud_name = ""
        if "point_cloud" in item_list:
            point_cloud = item_list["point_cloud"]
            if isinstance(point_cloud, dict):
                if "itemProperties" in point_cloud:
                    itemprop = point_cloud["itemProperties"]
                    if "name" in itemprop and itemprop["name"]:
                        point_cloud_name = itemprop["name"]

        # Note: if DTM is specified, we have to set DSM in the product list otherwise SURE cannot generate point cloud
        if "dtm" in prod:
            if "dsm" in prod:
                prod = prod.replace("dtm", "")
            else:
                prod = prod.replace("dtm", "dsm")

        # 6. Invoke the core Reconstruct Surface GP tool
        paramlog = [icpath, reconfolder, options, scenario, quality, prod, cellsize, aoi_feat, waterbody_feat, correction_feat]
        arcpy.AddMessage(str(paramlog))

        arcpy.rm.ReconstructSurface(
            icpath, reconfolder, recon_options=options, scenario=scenario, fwd_overlap=fwd_ovrlap,
            swd_overlap=swd_ovrlap, quality=quality, products=prod, cell_size=cellsize, 
            aoi=aoi_feat, waterbody_features=waterbody_feat, correction_features=correction_feat
        )
        msg = arcpy.GetMessages()
        # arcpy.AddMessage(msg)


        # 7. Check output dataset paths and publish as item
        outval = {}
        if "dtm" in item_list:
            pc_folder = reconfolder + "/Results/DSM/las"
            # Determine cell size of DTM
            cellsize = rasterutils.getCellsize(context)
            if not cellsize:
                # Default to use the DSM's cell size if cell size wasn't set in the environment
                dsm_vrt = reconfolder + "/Results/DSM/tif/DSM.vrt"
                try:
                    dsmdesc = arcpy.Describe(dsm_vrt)
                    cellsize = dsmdesc.children[0].meanCellHeight
                except Exception:
                    pass
                # If couldn't find the DSM cell size, revert to mosaic dataset cell size
                if not cellsize:
                    try:
                        icdesc = arcpy.Describe(icpath)
                        cellsize = icdesc.children[0].meanCellHeight
                        arcpy.AddMessage("Mosaic dataset cell size: {}".format(str(cellsize)))
                    except Exception:
                        pass

            # Parse other interpolate parameters
            dtmparams = realityutils.parse_DEM_params(context)
            classify_gnd_opts = realityutils.parse_Classify_Ground_Opts(context)
            # Set area of interest to mask environment setting
            arcpy.env.mask = rasterutils.JSON_to_feature(aoi_feat)

            arcpy.AddMessage("DTM cell size: {}".format(str(cellsize)))
            arcpy.InterpolateFromPointCloud_management(
                pc_folder, out_raster=out_dtm, cell_size=cellsize,
                interpolation_method=dtmparams["method"],
                smooth_method=dtmparams["smoothingMethod"], surface_type="DTM",
                fill_dem=dtmparams["fillDEM"], options=classify_gnd_opts
            )
            arcpy.AddMessage("DTM generated.")

            uri = rasterutils.getURI(arcpy.GetMessages(), out_dtm)
            if uri:
                arcpy.AddMessage("Updating service with DTM dataset...")
                # Get federated token to update image service
                token, referer = rasterutils.getToken(dtm_isurl)
                # Read and update image service info
                sinfo = rasterutils.getServiceInfo(dtm_aisurl, token, referer)
                if sinfo != {}:
                    msg = rasterutils.updateSource(dtm_aisurl, sinfo, out_dtm, token, referer)
                    # arcpy.AddMessage(msg)
                    rasterutils.refreshPortalItem(dtm_iid)
                    outval["DTM"] = {"itemId": dtm_iid, "url": dtm_isurl}

        if "dsm" in item_list:
            dsm_vrt = reconfolder + "/Results/DSM/tif/DSM.vrt"
            # support "Tile" mode, but single image mosaic is still default
            if dsm_mode == "tiled":
                # Support tiled mode by creating mosaic dataset
                try:
                    # Read the spatial reference from vrt then
                    srs = arcpy.Raster(dsm_vrt).spatialReference.factoryCode
                    # Create mosaic dataset in GDB
                    dsm_md_name = mdname + "_dsm"
                    out_dsm = rasterutils.createMD(mdws, dsm_md_name, srs, overwrite=1)
                    # Add image tiles to the mosaic dataset
                    result = arcpy.AddRastersToMosaicDataset_management(
                        out_dsm,
                        raster_type="Raster Dataset",
                        input_path=os.path.dirname(dsm_vrt),
                        filter="*.tif",
                        estimate_statistics="ESTIMATE_STATISTICS"
                    )
                    # Restore the mosaic dataset data store path
                    if ic_datastore:
                        out_dsm = ic_datastore + "/" + dsm_md_name
                except:
                    arcpy.AddError("Cannot create tiled ortho mosaic collection.")
            else:
                out_dsm = rasterutils.saveas(dsm_vrt, out_dsm, item_list["dsm"])

            if out_dsm:
                arcpy.AddMessage("Updating service with DSM dataset...")
                # Get federated token to update image service
                token, referer = rasterutils.getToken(dsm_isurl)
                # Read and update image service info
                sinfo = rasterutils.getServiceInfo(dsm_aisurl, token, referer)
                if sinfo != {}:
                    if dsm_mode == "tiled":
                        sinfo["capabilities"] = "Image,Catalog,Mensuration,Metadata"
                    msg = rasterutils.updateSource(dsm_aisurl, sinfo, out_dsm, token, referer)
                    # arcpy.AddMessage(msg)
                    rasterutils.refreshPortalItem(dsm_iid)
                    outval["DSM"] = {"itemId": dsm_iid, "url": dsm_isurl}

        if "true_ortho" in item_list:
            true_ortho_vrt = reconfolder + "/Results/True_Ortho/True_Ortho.vrt"
            # support "Tile" mode, but single image mosaic is still default
            if ortho_mode == "tiled":
                # Support tiled mode by creating mosaic dataset               
                try:
                    # Read the spatial reference from vrt then
                    srs = arcpy.Raster(true_ortho_vrt).spatialReference.factoryCode
                    # Create mosaic dataset in GDB
                    ortho_md_name = mdname + "_true_ortho"
                    out_ortho = rasterutils.createMD(mdws, ortho_md_name, srs, overwrite=1)
                    # Add image tiles to the mosaic dataset
                    result = arcpy.management.AddRastersToMosaicDataset(
                        out_ortho,
                        raster_type="Raster Dataset",
                        input_path=os.path.dirname(true_ortho_vrt),
                        filter="*.tif",
                        estimate_statistics="ESTIMATE_STATISTICS"
                    )
                    # Restore the mosaic dataset data store path
                    if ic_datastore:
                        out_ortho = ic_datastore + "/" + ortho_md_name                                            
                except:
                    arcpy.AddError("Cannot create tiled true ortho collection.")
            else:
                out_ortho = rasterutils.saveas(true_ortho_vrt, out_ortho, item_list["true_ortho"])

            if out_ortho:
                arcpy.AddMessage("Updating service with true ortho dataset...")
                # Get federated token to update image service
                token, referer = rasterutils.getToken(ortho_isurl)
                # Read and update image service info
                sinfo = rasterutils.getServiceInfo(ortho_aisurl, token, referer)
                if sinfo != {}:
                    if ortho_mode == "tiled":
                        sinfo["capabilities"] = "Image,Catalog,Mensuration,Metadata"
                    msg = rasterutils.updateSource(ortho_aisurl, sinfo, out_ortho, token, referer)
                    # arcpy.AddMessage(msg)
                    rasterutils.refreshPortalItem(ortho_iid)
                    outval["True_Ortho"] = {"itemId": ortho_iid, "url": ortho_isurl}

        if "dsm_mesh" in item_list:
            # Default name of DSM mesh 
            dsm_mesh_slpk = reconfolder + "/Results/DSM_Mesh/slpk/DSM_Mesh.slpk"
            
            try:
                if not dsm_mesh_name:
                    arcpy.AddError("Cannot publish DSM Mesh Scene Layer Package, missing name.")
                else:
                    arcpy.AddMessage("Creating DSM Mesh Scene Layer Package item...")
                    # Check data in the cloud store first
                    if dsm_mesh_slpk.startswith("/cloudStores") or dsm_mesh_slpk.startswith("/rasterStores"):
                        # need to transfer the slpk file from data store to local folder then upload
                        temp_folder = arcpy.env.scratchFolder
                        temp_slpk = os.path.join(temp_folder, os.path.basename(dsm_mesh_slpk))
                        arcpy.gp.command("TransferFiles '" + dsm_mesh_slpk + "' '" + temp_folder + "' -threads 0 -overwrite 1")
                        if os.path.exists(temp_slpk):
                            os.rename(temp_slpk, os.path.join(temp_folder, dsm_mesh_name+".slpk"))
                            dsm_mesh_slpk = os.path.join(temp_folder, dsm_mesh_name+".slpk")

                    # Need to rename the slpk to ensure uniqueness of uploaded file (Better enhancement in SURE)
                    elif os.path.exists(dsm_mesh_slpk):
                        temp_folder = arcpy.env.scratchFolder
                        temp_slpk = os.path.join(temp_folder, dsm_mesh_name+".slpk")
                        shutil.copyfile(dsm_mesh_slpk, temp_slpk)
                        dsm_mesh_slpk = temp_slpk

                    # The slpk could be renamed already from previous run
                    else:
                        dsm_mesh_slpk = os.path.join(os.path.dirname(dsm_mesh_slpk), dsm_mesh_name+".slpk")    
                    
                    # arcpy.AddMessage("expected path " + dsm_mesh_slpk)
                    dsm_mesh_url, dsm_mesh_item = realityutils.publish_slpk(dsm_mesh_slpk, dsm_mesh, "Mesh")
                    outval["DSM_Mesh"] = {"itemId": dsm_mesh_item, "url": dsm_mesh_url}
            except Exception as err:
                arcpy.AddError("Faile to publish DSM mesh scene layer package item.")

        if "mesh" in item_list:
            # Default name of Mesh 
            mesh_slpk = reconfolder + "/Results/Mesh/slpk/Mesh.slpk"

            try:
                if not mesh_name:
                    arcpy.AddError("Cannot publish Mesh Scene Layer Package, missing name.")
                else:
                    arcpy.AddMessage("Creating Mesh Scene Layer Package item...")
                    # Check data in the cloud store first
                    if mesh_slpk.startswith("/cloudStores") or mesh_slpk.startswith("/rasterStores"):
                        # need to transfer the slpk file from data store to local folder then upload
                        temp_folder = arcpy.env.scratchFolder
                        temp_slpk = os.path.join(temp_folder, os.path.basename(mesh_slpk))
                        arcpy.gp.command("TransferFiles '" + mesh_slpk + "' '" + temp_folder + "' -threads 0 -overwrite 1")
                        if os.path.exists(temp_slpk):
                            os.rename(temp_slpk, os.path.join(temp_folder, mesh_name+".slpk"))
                            mesh_slpk = os.path.join(temp_folder, mesh_name+".slpk")

                    # Need to rename the slpk to ensure uniqueness of uploaded file (Better enhancement in SURE)
                    elif os.path.exists(mesh_slpk):
                        temp_folder = arcpy.env.scratchFolder
                        temp_slpk = os.path.join(temp_folder, mesh_name+".slpk")
                        shutil.copyfile(mesh_slpk, temp_slpk)
                        mesh_slpk = temp_slpk
                    
                    # The slpk could be renamed already from previous run
                    else:
                        mesh_slpk = os.path.join(os.path.dirname(mesh_slpk), mesh_name+".slpk")

                    mesh_url, mesh_item = realityutils.publish_slpk(mesh_slpk, mesh, "Mesh")
                    outval["Mesh"] = {"itemId": mesh_item, "url": mesh_url}
            except Exception as err:
                arcpy.AddError("Faile to publish Mesh Scene Layer Package item.")

        if "point_cloud" in item_list:
            pc_folder = reconfolder + "/Results/Point_Cloud"
            pc_lasd = reconfolder + "/Results/Point_Cloud/Point_Cloud.lasd"
            point_cloud_slpk = reconfolder + "/Results/Point_Cloud/" + point_cloud_name + ".slpk"

            # arcpy.AddMessage(pc_folder)
            # arcpy.AddMessage(pc_lasd)
            # arcpy.AddMessage(point_cloud_slpk)

            try:
                if not point_cloud_name:
                    arcpy.AddError("Cannot publish Point Cloud Scene Layer Package, missing name.")
                else:
                    arcpy.AddMessage("Creating Point Cloud Scene Layer Package item...")
                    # For point cloud folder in the cloud, download to server first
                    if os.path.exists(pc_folder):
                        # Need to make sure slpk has unique name
                        point_cloud_slpk = realityutils.generate_slpk(pc_folder, point_cloud_slpk, context)
                    elif pc_folder.startswith("/cloudStores") or pc_folder.startswith("/rasterStores"):
                        # need to transfer the slpk file from data store to local folder then upload
                        temp_folder = arcpy.env.scratchFolder
                        temp_pc_folder = os.path.join(temp_folder, os.path.basename(pc_folder))
                        # Create point cloud folder if not existed
                        if not os.path.exists(temp_pc_folder):
                            os.makedirs(temp_pc_folder)
                        temp_pc_slpk = os.path.join(temp_pc_folder, point_cloud_name+".slpk")
                        # arcpy.AddMessage(temp_pc_folder)
                        # arcpy.AddMessage(temp_pc_slpk)
                        arcpy.gp.command("TransferFiles '" + pc_folder + "' '" + temp_pc_folder + "' -threads 0 -overwrite 1")
                        if os.path.exists(temp_pc_folder) and len(os.listdir(temp_pc_folder)) != 0:
                            point_cloud_slpk = realityutils.generate_slpk(temp_pc_folder, temp_pc_slpk, context)
                    
                    pc_url, pc_item = realityutils.publish_slpk(point_cloud_slpk, point_cloud, "Point_Cloud")
                    outval["Point_Cloud"] = {"itemId": pc_item, "url": pc_url}
            except Exception as err:
                arcpy.AddError("Faile to publish Point Cloud scene layer package item.")
            
        # Output response is service or item URLs for all output products
        arcpy.SetParameterAsText(11, json.dumps(outval))

    except rasterutils.LicenseError:
        rasterutils.AddExceptionError(TASK_NAME, rasterutils.errorMsgs.get(120302))

    except arcpy.ExecuteError:
        arcpy.AddError(arcpy.GetMessages(2))

    except Exception as err:
        arcpy.AddError(err)

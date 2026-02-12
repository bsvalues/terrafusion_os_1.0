#!/usr/bin/env python
# -*- coding: utf-8 -*-
'''---------------------------------------------------------------------------
Name:              extractdata.py
Purpose:           Extracts data within a user specified user extent.
Author:            Esri, Inc.
Created:           02/14/2013
Copyright:   (c)   Esri, Inc. 2013
ArcGIS Version:    10.1
Python Version:    2.7.2 (default, Jun 12 2011, 15:08:59)
---------------------------------------------------------------------------'''
from __future__ import unicode_literals
import os
from os.path import basename, join
import csv
import zipfile
import arcpy
import analysisutils
from rendererUtils import getSimpleRendererInfo, applySimpleRenderer

import time

#Deal with the basestring, unicode NameError
try:
    unicode=unicode
except NameError:
    str = str
    unicode = str
    bytes = bytes
    basestring = (str, bytes)
else:
    str = str
    unicode = unicode
    bytes = str
    basestring = basestring

def calculate_count(layer):
    ''' calculate the number of features'''
    try:
        result = arcpy.GetCount_management(layer)
        return result.getOutput(0)
    except:
        return "0"
    
def fix_row(row, encoding="utf-8"):
    return [value.encode(encoding) if isinstance(value, unicode)
                                   else value
            for value in row]

def filebasename(layer):
    """Generate file name from layer name"""
    filename1 = basename(layer)
    filename2 = filename1.replace('\\','')
    filename = arcpy.ValidateTableName(filename2, arcpy.env.scratchGDB)
    return filename
# End filebasename function

def selectlayers(in_layers, extract_extent):
    """Select features based on extent"""
    count_features = []    
    for layer in in_layers:
        if extract_extent:
            arcpy.management.SelectLayerByLocation(layer, "intersect", extract_extent)
            count_features.append(calculate_count(layer))
        else:
            analysisutils.selectFeaturesbyExtent(layer)
    return count_features

# End selectlayers function


def generate_kml_output(layer, clip, extract_extent, output_file_name):
    """This function applies as a workaround method for generating KML output. This workaround is designed to avoid
    issue at https://devtopia.esri.com/ArcGISPro/geoprocessing/issues/2924 which was noticed in 10.7.1.

    Args:
        layer: a string represents the name of a layer instance that will be exported to KML format.
        clip: a bool indicates whether to clip the layer or not.
        extract_extent: extent used to either clip (clip = True) or select features (clip = False) from layer.
        output_file_name: name of the output .KMZ file.
    Returns:
        A two item tuple where the first item is the output of LayerToKML and the second item is the total # of features
        in the clip layer if extract_extent is not None. If extract_extent is None, then 0 is returned since it has
        already been calculated outside of this function.

    """
    feature_count = 0
    if clip:
        # save data to scratchGDB instead of in_memory since LayerToKML has issues in creating KMZ from data in memory.
        kml_data_path = arcpy.CreateUniqueName(filebasename(layer), arcpy.env.scratchGDB)
        clip_layer = arcpy.analysis.Clip(layer, extract_extent, kml_data_path)
        # get count of features
        feature_count = calculate_count(clip_layer)
        feat_layer = arcpy.management.MakeFeatureLayer(clip_layer, '{}_layer'.format(basename(layer)))
    else:
        desc = arcpy.Describe(layer)
        arcpy.AddMessage("layer's catalogpath: {}".format(desc.catalogPath))
        # If layer was created from in_memory data, dump it out to scratchGDB.
        if desc.catalogPath.startswith("in_memory"):
            fc_path = arcpy.CreateUniqueName(layer, arcpy.env.scratchGDB)
            arcpy.management.CopyFeatures(layer, fc_path)
            feat_layer = arcpy.management.MakeFeatureLayer(fc_path, f"tmp_{layer}").getOutput(0).name
        else:
            feat_layer = layer

    kml_layer = kml_renderer(feat_layer)
    if clip:
        kmz = arcpy.conversion.LayerToKML(kml_layer, output_file_name)
    else:
        kmz = arcpy.conversion.LayerToKML(kml_layer, output_file_name, boundary_box_extent=extract_extent)
    return (kmz[0], feature_count)


def kml_renderer(layer):
    """ Set symbology renderer for KML file output."""
    shape_type = arcpy.Describe(layer).shapeType
    drawing_info = getSimpleRendererInfo(shape_type)
    if "renderer" in drawing_info:
        renderer = drawing_info.get("renderer")
        if "type" in renderer:
            renderer["type"] = "simple"
    kml_layer = arcpy.MakeFeatureLayer_management(layer, 'kmllayer')
    applySimpleRenderer(kml_layer)
    return kml_layer
# End kml_renderer function

def zipdir(base_dir, output_folder, outfilename=None):
    """Creates a compressed zip file for the
    geodatabase or shapefile directory.
    """
    if not outfilename:
        outfilename = extractfilename

    zip_file = join(output_folder, '{}.zip'.format(outfilename))
    with zipfile.ZipFile(zip_file, 'w', zipfile.ZIP_DEFLATED) as z:
        for root, dirs, files in os.walk(base_dir):
            for fn in files:
                if not fn.endswith('zip') and not fn.endswith('.lock'):
                    absfn = join(root, fn)
                    zfn = absfn[len(base_dir) + len(os.sep):]
                    z.write(absfn, join(basename(base_dir), zfn))

    arcpy.SetParameterAsText(5, zip_file)
# End zipdir function

def create_csv(feat_layer, out_csv_file):
    """Create a csv file from the input points."""
    if hasattr(feat_layer, "name"):
        dsc = arcpy.Describe(feat_layer.name)
    else:
        dsc = arcpy.Describe(feat_layer)

    try:
        omit_fields = [dsc.shapeFieldName, dsc.oidFieldName]
    except AttributeError:
        #Update the logic to deal with TableView data
        omit_fields = [dsc.oidFieldName]

    fields = [f.name for f in arcpy.ListFields(feat_layer) if not f.name in omit_fields]
    sr = arcpy.SpatialReference(4326)

    csv_file = open(out_csv_file, 'w', newline='', encoding='utf8')
    csv_writer=csv.writer(csv_file)

    # Point feature type handling for CSV output
    try:
        if dsc.shapeType == 'Point':
            csv_writer.writerow(['Long', 'Lat'] + fields)
            with arcpy.da.SearchCursor(feat_layer, ['SHAPE@XY'] + fields, spatial_reference=sr) as rows:
                for row in rows:
                    vals = [row[0][0], row[0][1]] + list(row[1:])
                    csv_writer.writerow(vals)

        # Multipoint feature type handling for CSV output
        elif dsc.shapeType == 'Multipoint':
            csv_writer.writerow(['Long', 'Lat'] + fields)
            with arcpy.da.SearchCursor(feat_layer, ['SHAPE@XY'] + fields, spatial_reference=sr, explode_to_points=True) as rows:
                for row in rows:
                    vals = [row[0][0], row[0][1]] + list(row[1:])
                    csv_writer.writerow(vals)

        # All other feature type handling for CSV output
        else:
            csv_writer.writerow(fields)
            with arcpy.da.SearchCursor(feat_layer, fields) as rows:
                for row in rows:
                    vals = list(row[0:])
                    csv_writer.writerow(vals)

    except AttributeError:
        csv_writer.writerow(fields)
        with arcpy.da.SearchCursor(feat_layer, fields) as rows:
            for row in rows:
                vals = list(row[0:])
                csv_writer.writerow(vals)
        
    del csv_writer

    return out_csv_file
# End create_csv function

def extract_data(in_layers,
                output_folder,
                extract_extent='',
                clip_data=False,
                data_format='',
                *args):
    """Extracts data intersecting with the extent
    or clips the data against the extent.
    The extracted data is added to a zip file or layer package.
    A single output kml or csv file is not zipped.

    Required arguments:
        input_layers: string
            The input layers as a semi-comma delimited string.
        output_folder: string
            The output folder where the zip file or layer package is created.

    Optional argumemts:
        extract_extent: object
            The processing extent as a feature set.

        clip_data: Boolean
            False - extract data intersecting the extent. Default.
            True -  clip data within the extent.

        data_format: string
            The output format of the extracted data. Default is FILEGEODATABASE.
            Options: FILEGEODATABASE | SHAPEFILE | LAYERPACKAGE | KML

    """
    # Required: A feature set always comes in as "in_memory/{some guid}".
    if len(extract_extent) == 0:
        clip_data = False
    else:
        if int(arcpy.management.GetCount(extract_extent)[0]) == 0:
            extract_extent = ''
            clip_data = False
    arcpy.AddMessage("clip_data:{}".format(clip_data))
    #to recalculate count of features
    layer_count = []

    # Extact data that intersects the extent.
    if clip_data == False:
        layer_count = selectlayers(in_layers, extract_extent)

        if data_format.upper() == 'FILEGEODATABASE':
            fgdb = arcpy.management.CreateFileGDB(output_folder,
                                                    filebasename(in_layers[0]))
            arcpy.env.workspace = fgdb[0]
            for layer in in_layers:
                arcpy.management.CopyFeatures(layer, filebasename(layer))
            zipdir(arcpy.env.workspace, output_folder)

        elif data_format.upper() == 'SHAPEFILE':
            shp_folder = arcpy.management.CreateFolder(output_folder,
                                                        filebasename(in_layers[0]))
            arcpy.env.workspace = shp_folder[0]
            for layer in in_layers:
                arcpy.management.CopyFeatures(layer, filebasename(layer))
            zipdir(arcpy.env.workspace, output_folder)

        elif data_format.upper() == 'LAYERPACKAGE':
            arcpy.env.workspace = output_folder
            package = arcpy.management.PackageLayer(in_layers,
                                    '{}.lpk'.format(extractfilename),
                                    extent=extract_extent)
            arcpy.SetParameterAsText(5, package[0])

        elif data_format.upper() == 'KML':
            kml_folder = arcpy.management.CreateFolder(output_folder,
                                                        filebasename(in_layers[0]))
            arcpy.env.workspace = kml_folder[0]
            if len(in_layers) > 1:
                for layer in in_layers:
                    (_, _) = generate_kml_output(layer, clip_data, extract_extent,
                                                 '{}.kmz'.format(filebasename(layer)))
                zipdir(arcpy.env.workspace, output_folder)
            else:
                (kmz, _) = generate_kml_output(in_layers[0], clip_data, extract_extent,
                                               '{}.kmz'.format(extractfilename))
                arcpy.SetParameterAsText(5, kmz)

        elif data_format.upper() == 'CSV':
            csv_folder = arcpy.management.CreateFolder(output_folder,
                                                        filebasename(in_layers[0]))
            arcpy.env.workspace = csv_folder[0]
            if len(in_layers) > 1:
                for layer in in_layers:
                    create_csv(layer, join(csv_folder[0], '{}.csv'.format(filebasename(layer))))
                zipdir(arcpy.env.workspace, output_folder)
            else:
                layer = in_layers[0]
                csv_file = create_csv(layer, join(csv_folder[0], '{}.csv'.format(extractfilename)))
                arcpy.SetParameterAsText(5, csv_file)

    # Clip data within extent.
    elif clip_data == True:
        if data_format.upper() == 'FILEGEODATABASE':
            fgdb = arcpy.management.CreateFileGDB(output_folder,
                                                    filebasename(in_layers[0]))
            arcpy.env.workspace = fgdb[0]
            for layer in in_layers:
                clip_layer = arcpy.analysis.Clip(layer, extract_extent, filebasename(layer))
                # add count of features
                layer_count.append(calculate_count(clip_layer))
            zipdir(arcpy.env.workspace, output_folder)

        elif data_format.upper() == 'SHAPEFILE':
            arcpy.env.workspace = output_folder
            for layer in in_layers:                
                clip_layer = arcpy.analysis.Clip(layer, extract_extent, filebasename(layer))
                # add count of features
                layer_count.append(calculate_count(clip_layer))
            zipdir(arcpy.env.workspace, output_folder)

        elif data_format.upper() == 'LAYERPACKAGE':
            clipped_layers = []
            arcpy.env.workspace = arcpy.env.scratchGDB
            for lyr in in_layers:                
                clip_layer = arcpy.analysis.Clip(layer, extract_extent, filebasename(layer))
                # add count of features
                layer_count.append(calculate_count(clip_layer))
                clip_layer = arcpy.management.MakeFeatureLayer(clip_layer,
                                        '{}_layer'.format(basename(lyr)))
                clipped_layers.append(clip_layer[0])
            arcpy.env.workspace = output_folder
            package = arcpy.management.PackageLayer(clipped_layers,
                                            '{}.lpk'.format(extractfilename),
                                            extent=extract_extent)
            arcpy.SetParameterAsText(5, package[0])

        elif data_format.upper() == 'KML':
            arcpy.env.workspace = output_folder
            if len(in_layers) > 1:
                for layer in in_layers:
                    (_, feat_count) = generate_kml_output(layer, clip_data, extract_extent,
                                                          '{}.kmz'.format(filebasename(layer)))
                    layer_count.append(feat_count)
                zipdir(arcpy.env.workspace, output_folder)
            else:
                (kmz, feat_count) = generate_kml_output(in_layers[0], clip_data, extract_extent,
                                                        '{}.kmz'.format(extractfilename))
                layer_count.append(feat_count)
                arcpy.SetParameterAsText(5, kmz)

        elif data_format.upper() == 'CSV':
            arcpy.env.workspace = output_folder
            if len(in_layers) > 1:
                for layer in in_layers:
                    clip_layer = arcpy.analysis.Clip(layer, extract_extent, r'in_memory\{}'.format(filebasename(layer)))
                    # add count of features
                    layer_count.append(calculate_count(clip_layer))
                    feat_layer = arcpy.management.MakeFeatureLayer(clip_layer, '{}_layer'.format(basename(layer)))
                    create_csv(feat_layer, join(arcpy.env.workspace, '{}.csv'.format(filebasename(layer))))
                zipdir(arcpy.env.workspace, output_folder)
            else:
                layer = in_layers[0]
                clip_layer = arcpy.analysis.Clip(layer, extract_extent, r'in_memory\{}'.format(filebasename(layer)))
                # add count of features
                layer_count.append(calculate_count(clip_layer))
                feat_layer = arcpy.management.MakeFeatureLayer(clip_layer, '{}_layer'.format(basename(layer)))
                csv_file = create_csv(feat_layer, join(arcpy.env.workspace, '{}.csv').format(extractfilename))
                arcpy.SetParameterAsText(5, csv_file)
    # Set count of features    
    arcpy.SetParameter(6, layer_count)

# End extract_data function

if __name__ == '__main__':
    layers = [l.strip("'") for l in arcpy.GetParameterAsText(0).split(';')]
    outfolder = arcpy.GetParameterAsText(1)
    extent = arcpy.GetParameterAsText(2)
    clip = arcpy.GetParameter(3)
    dataformat = arcpy.GetParameterAsText(4)
    timestamp = time.strftime("%Y%m%d%H%M%S", time.localtime())
    extractfilename = "{}{}".format(filebasename(layers[0]), timestamp)
    arcpy.AddMessage(extractfilename)

    extract_data(layers, outfolder, extent, clip, dataformat)
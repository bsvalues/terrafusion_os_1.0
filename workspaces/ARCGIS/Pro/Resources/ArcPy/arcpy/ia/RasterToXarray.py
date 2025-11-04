# COPYRIGHT 2019 ESRI
#
# TRADE SECRETS: ESRI PROPRIETARY AND CONFIDENTIAL
# Unpublished material - all rights reserved under the
# Copyright Laws of the United States.
#
# For additional information, contact:
# Environmental Systems Research Institute, Inc.
# Attn: Contracts Dept
# 380 New York Street
# Redlands, California, USA 92373
#
# email: contracts@esri.com

import arcpy
import json
import numpy as np



def RasterToXarray(path):

    '''
    if not arcpy.Raster(path, is_multidimensional = True):
        raise ValueError("not a valid multidimensional data")
    else:
        my_raster = arcpy.Raster(path, is_multidimensional = True)
        raise ValueError("open multidimensional data")
    '''
    import xarray as xr

    try:
        my_raster = arcpy.Raster(path, is_multidimensional = True)
    except Exception as e:
        raise e

    raster_info = json.loads(my_raster.mdinfo)

    # Read x and y coodinate value
    x_coords = []
    y_coords = []

    for i in range(0, my_raster.width):
        x_coords.append(my_raster.extent.XMin + i*my_raster.meanCellWidth)
    for j in range(0, my_raster.height):
        y_coords.append(my_raster.extent.YMin + j*my_raster.meanCellHeight)

    assert len(x_coords) >= 1 and len(y_coords) >= 1

    # reformat md info, and add the x and y
    var_dims = {}
    for var in raster_info['variables']:

        var_name = var['name']

        _dims = var['dimensions']
        if my_raster.spatialReference.type == 'Projected':
            dims = {'y': np.array(y_coords), 'x': np.array(x_coords)}
        else:
            dims = {'lat': np.array(y_coords), 'lon': np.array(x_coords)}

        for dim in _dims:
            if 'time' in dim['name'].lower() or 'stdt' in dim['name']:
                time_range = np.array(dim['values'], dtype = np.datetime64)
                if time_range.ndim > 1:
                    time_range = time_range[: , 0]
                dims[dim['name']] = time_range
            else:
                dims[dim['name']]=np.array(dim['values'], dtype = np.float32)

        var_dims[var_name] = dims

    # create xarray Dataset
    ds = xr.Dataset()
    # get numpy array for each variable
    shape_multi_vars = []
    for var in var_dims:
        shape_multi_dims = []
        for dim in var_dims[var]:
            shape_multi_dims.append(var_dims[var][dim].shape[0])
        data_multi_dims = np.zeros(shape_multi_dims, dtype = np.float32)
        varRaster = arcpy.ia.Subset(my_raster, variables = var)
        # block size (number of rows, number of columns)

        pixelblock_size = (min(512, varRaster.height), min(512, varRaster.width))

        blockCollection = arcpy.ia.PixelBlockCollection(varRaster, pixel_block_size = pixelblock_size, nodata_to_values = -1)

        # Check the number of pixelblocks along x and y direction
        number_blocks_y, number_blocks_x = blockCollection.size

        # rastertonumpyarray returns [rows, cols, slice_count]
        # getData return: numpy.ndarray, a copy of the pixel block data with shape ({slices}, rows, cols, bands)
        for y in range(number_blocks_y):
            for x in range(number_blocks_x):

                xstart = x * pixelblock_size[1]
                ystart = y * pixelblock_size[0]

                xend = min( (x + 1) * pixelblock_size[1], varRaster.width )
                yend = min( (y + 1) * pixelblock_size[0], varRaster.height )
                #print("Current processing block extend ", xstart, xend, ystart, yend )
                np_array = varRaster.read(upper_left_corner = (xstart, ystart),
                                        origin_coordinate = arcpy.Point(my_raster.extent.XMin, my_raster.extent.YMin),
                                        ncols=pixelblock_size[1],
                                        nrows=pixelblock_size[0])
                block_data = np.squeeze(np.transpose(np_array,(3,1,2,0)), axis=0)

                if len(shape_multi_dims) > 3:
                    shape = shape_multi_dims

                    # replace the shape along y and x to the current pixel block size
                    shape[0] = block_data.shape[0]
                    shape[1] = block_data.shape[1]

                    block_data = block_data.reshape(*shape)

                data_multi_dims[ystart: yend, xstart: xend] = block_data[: yend - ystart, : xend - xstart]



        data_array = xr.DataArray(data_multi_dims, dims =list(var_dims[var].keys()), coords = var_dims[var])
        ds[var] = data_array


    # Add spatial reference info
    ref = my_raster.spatialReference
    srs_real = True
    if ref.type == 'Projected':
        ref_da = xr.DataArray(-32767)
        ref_da.name = ref.name
        srs_att = {'grid_mapping_name': ref.name,
                'longitude_of_central_meridian': ref.centralMeridian,
                'latitude_of_projection_origin': ref.latitudeOfOrigin,
                'false_easting': ref.falseEasting,
                'false_northing': ref.falseNorthing,
                'longitude_of_prime_meridian': ref.longitude,
        }
        if ref.factoryCode:
            srs_att['factory_code'] = ref.factoryCode
        ref_da.attrs = srs_att
        ds[ref_da.name] = ref_da
    elif ref.type == 'Geographic' :
        # ref.exportToString() != "GEOGCS['GCS_WGS_1984',DATUM['D_WGS_1984',SPHEROID['WGS_1984',6378137.0,298.257223563]],PRIMEM['Greenwich',0.0],UNIT['Degree',0.0174532925199433]];-400 -400 11258999068426.2;-100000 10000;-100000 10000;8.98315284119521E-09;0.001;0.001;IsHighPrecision"
        ref_da = xr.DataArray(-32767)
        ref_da.name = 'latitude_longitude'
        srs_att = {'grid_mapping_name': ref.name,
                'longitude_of_prime_meridian': ref.longitude,
                'semi_major_axis': ref.semiMajorAxis,
                'inverse_flattening': ref.flattening,
        }
        if ref.factoryCode:
            srs_att['factory_code'] = ref.factoryCode
        ref_da.attrs = srs_att
        ds[ref_da.name] = ref_da
    else:
        srs_real = False




    # Add grid_mapping attribute and coordinate attribute
    for var in raster_info['variables']:
        if srs_real:
            info_dict = {'grid_mapping': my_raster.spatialReference.name}
        else:
            info_dict = {}
        if 'description' in var:
            info_dict['description'] = var['description']
        if 'unit' in var:
            info_dict['unit'] = var['unit']
        if my_raster.spatialReference.type != '' and srs_real:
            ds[var['name']].attrs = info_dict

            if my_raster.spatialReference.type == 'Projected':
                ds[var['name']].attrs['coordinate'] = "y x"
            elif my_raster.spatialReference.type == 'Geographic':
                ds[var['name']].attrs['coordinate'] = "lat lon"

    # Add attr info for x and y, lat and lon
    for coord in list(ds.coords.keys()):
        if coord == 'lat':
            ds.coords[coord].attrs = {"long_name": "Latitude", "units": "degrees_north", "standard_name": "latitude"}
        elif coord == 'lon':
            ds.coords[coord].attrs = {"long_name": "Longitude", "units": "degrees_east", "standard_name": "latitude"}
        elif coord == 'x':
            ds.coords[coord].attrs = {"units": my_raster.spatialReference.linearUnitName, "long_name": "x coordinate of projection", "standard_name": "projection_x_coordinate"}
        elif coord == 'y':
            ds.coords[coord].attrs = {"units": my_raster.spatialReference.linearUnitName, "long_name": "y coordinate of projection", "standard_name": "projection_y_coordinate"}

    # Add other attributes get from mdinfo
    for coord in list(ds.coords.keys()):
        for var in raster_info['variables']:
            for dim in var['dimensions']:
                if dim['name'] == coord:

                    dim_attr = my_raster.getDimensionAttributes(var['name'], dim['name'])
                    if 'HasRanges' in dim_attr:

                        dim_attr['HasRanges'] = str(dim_attr['HasRanges'])
                    if 'HasRegularIntervals' in dim_attr:

                        dim_attr['HasRegularIntervals'] = str(dim_attr['HasRegularIntervals'])



                    ds.coords[coord].attrs = dim_attr

    return ds





def XarrayToRaster(ds):

    import xarray as xr

    try:
        variables = list(ds.data_vars.keys())
    except Exception as e:
        raise e
    '''
    # Read spatial reference
    srs = {}
    for var in ds.data_vars.keys():
        if 'grid_mapping_name' in ds[var].attrs:
            srs = ds[var].attrs
    #            print(srs)
    if srs != {}:
        srs_object = arcpy.ia.utils.ConstructSpatialReferenceFromParameters(srs)
    '''


    # Extract all variables and deminsions
    # Result formart   {variable: {'latitude': 'lat', 'longitude': 'lon',  'time_dim': 'time', 'depth_dim': 'depth'}}}
    vari_dim = {}

    for variable in list(ds.data_vars.keys()):

        vari_dim[variable] = {}
        dims = list(ds[variable].dims)
        for dim in dims:
            if 'units' in list(ds[dim].attrs.keys()) and ds[dim].attrs['units'] in ['degrees_north', 'degree_north', 'degree_N', 'degrees_N', 'degreeN', 'degreesN']:
                vari_dim[variable]['latitude'] = dim
                dims.remove(dim)
        for dim in dims:
            if 'units' in list(ds[dim].attrs.keys()) and ds[dim].attrs['units'] in ['degrees_east', 'degree_east', 'degree_E', 'degrees_E', 'degreeE', 'degreesE']:
                vari_dim[variable]['longitude'] = dim
                dims.remove(dim)
        for dim in dims:
            if 'standard_name' in list(ds[dim].attrs.keys()) and ds[dim].attrs['standard_name'] =='projection_y_coordinate':
                vari_dim[variable]['y_axis'] = dim
                dims.remove(dim)
        for dim in dims:
            if 'standard_name' in list(ds[dim].attrs.keys()) and ds[dim].attrs['standard_name'] =='projection_x_coordinate':
                vari_dim[variable]['x_axis'] = dim
                dims.remove(dim)

        # Put time in front of all other deminsions for future transpose
        for dim in dims:
            if 'time_origin' in list(ds[dim].attrs.keys()):
                vari_dim[variable]['time_dim'] = dim
                dims.remove(dim)

        for dim in dims:
            vari_dim[variable][str(dim + '_dim')] = dim


# find the variable with data


    var_with_data = []
    for var in list(vari_dim.keys()):
        if 'longitude' in vari_dim[var] and 'latitude' in vari_dim[var] or 'x_axis' in vari_dim[var] and 'y_axis' in vari_dim[var]:
            var_with_data.append(var)

    # get rows, cols and cell size

    rows = cols = cell_x = cell_y = llc_x = llc_y = 0

    if len(var_with_data) == 0:
        raise ValueError ("no variable found")

    var0 = var_with_data[0]
    if 'x_axis' in list(vari_dim[var0].keys()) and 'y_axis' in list(vari_dim[var0].keys()):
        rows = ds.coords['y'].values.shape[0]
        cols = ds.coords['x'].values.shape[0]
        llc_y = min(ds.coords['y'].values)
        llc_x = min(ds.coords['x'].values)
        cell_y = (max(ds.coords['y'].values) - min(ds.coords['y'].values))/(rows - 1)
        cell_x = (max(ds.coords['x'].values) - min(ds.coords['x'].values))/(cols - 1)

    elif 'longitude' in list(vari_dim[var0].keys()) and 'latitude' in list(vari_dim[var0].keys()):
        lat = vari_dim[var0]['latitude']
        lon = vari_dim[var0]['longitude']
        rows = ds.coords[lat].values.shape[0]
        cols = ds.coords[lon].values.shape[0]
        llc_y = min(ds.coords[lat].values)
        llc_x = min(ds.coords[lon].values)
        cell_y = (max(ds.coords[lat].values) - min(ds.coords[lat].values))/(rows - 1)
        cell_x = (max(ds.coords[lon].values) - min(ds.coords[lon].values))/(cols - 1)

    else:
        raise ValueError ("no spatial dimensions identified")


    # Transpose data
    new_dim_order = list(vari_dim[var0].values())

    da_trans=ds[var0].transpose(*new_dim_order, transpose_coords=True)

    # Reorganise data
    data_all_vars = np.array([])
    for var in var_with_data:
        data_var = da_trans.values

        if len(data_var.shape)>3:
            data_var = data_var.reshape(rows, cols, -1)
        if data_all_vars.size == 0:
            data_all_vars = data_var.reshape(rows, cols, -1)
        else:
            data_all_vars = np.concatenate([data_all_vars, data_var.reshape(rows, cols, -1)], axis = -1)

    # Construct mdinfo
    mdinfo = {'variables': [], 'layout': 1}
    vari_dict_list = []
    for variable in var_with_data:
        vari_dict = {}
        vari_dict['name'] = variable

        original_attrs = ds[variable].attrs
        for key, value in list(original_attrs.items()):
            original_attrs[key] = str(value)
        vari_dict['attributes'] = original_attrs
        # mdinfo doesn't keep lat lon and x y

        dims_not_axis = []
        for key in list(vari_dim[variable].keys()):
            if key not in ['longitude', 'latitude', 'x_axis', "y_axis"]:
                dims_not_axis.append(vari_dim[variable][key])

        dim_dict_list = []
        for dim in dims_not_axis:
            dim_dict = {}
            dim_dict['name'] = dim
            dim_dict['field'] = dim
            # StandardizeMultidimensionalInfo doesn't work without 'units'
            if 'units' in ds[dim].attrs:
                dim_dict['unit'] = ds[dim].attrs['units']
            else:
                # time doesn't have unit, just hard code
                dim_dict['unit'] = 'ISO8601'
            dim_dict['extent'] = [str(ds.coords[dim].values.min()), str(ds.coords[dim].values.max())]
            dim_dict['values'] = [str(x) for  x in ds.coords[dim].values]
            dim_dict_list.append(dim_dict)
        vari_dict['dimensions'] = dim_dict_list

        vari_dict_list.append(vari_dict)

    mdinfo['variables'] = vari_dict_list




    mdinfo_stand= arcpy.ia.utils.StandardizeMultidimensionalInfo(mdinfo)
    myraster = arcpy.NumPyArrayToRaster(data_all_vars, arcpy.Point(llc_x.item(), llc_y.item()), cell_x.item(), cell_y.item(), mdinfo=mdinfo_stand)

     # Build spatial reference
    srs = {}
    for var in list(ds.data_vars.keys()):
        if 'grid_mapping_name' in ds[var].attrs:
            srs = ds[var].attrs
#            print(srs)
    if srs != {}:
        if 'factory_code' in srs:
            srs_stand = arcpy.SpatialReference(srs['factory_code'])
        else:
            srs_stand = arcpy.ia.utils.ConstructSpatialReferenceFromParameters(srs)
        arcpy.DefineProjection_management(myraster, srs_stand)



    return myraster

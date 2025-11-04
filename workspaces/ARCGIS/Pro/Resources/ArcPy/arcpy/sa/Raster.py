#COPYRIGHT 2018 ESRI
#
#TRADE SECRETS: ESRI PROPRIETARY AND CONFIDENTIAL
#Unpublished material - all rights reserved under the
#Copyright Laws of the United States.
#
#For additional information, contact:
#Environmental Systems Research Institute, Inc.
#Attn: Contracts Dept
#380 New York Street
#Redlands, California, USA 92373
#
#email: contracts@esri.com



import os.path
import types

import arcgisscripting
from arcpy import env, gp

from . import Utils


useLocalFunctions = True


def SetUseLocalFunctions(value):
    global useLocalFunctions
    useLocalFunctions = value


def tryLocalFunction(*args):
    """If it returns None, no local function implementation is avail,
    otherwise it returns a Raster object
    """
    assert isinstance(args, tuple)
    assert len(args) >= 1

    canUse = True  # env.outputCoordinateSystem is None
    canUse = canUse and env.mask is None

    if useLocalFunctions and canUse:
        if arcgisscripting._hasLocalFunctionRasterImplementation(args[0]):
            # 0: the operation name
            # 1: a scratch name already reserved to use later in save
            flatList = [args[0], Utils.scratchName()]

            for arg in args[1:]:
                # Flatten lists. Argument can be repeatable, provided as a list.
                if isinstance(arg, list):
                    flatList += arg
                else:
                    flatList.append(arg)

            return Raster(flatList), True

    return None, False


import numpy as np
import math
import numbers
import arcpy


class Raster(arcgisscripting.Raster):
    def __init__(self, in_raster, is_multidimensional=False):
        """Raster(in_raster, {is_multidimensional})\

    Create a Raster object.

    Arguments:
      in_raster -- Name of raster
      is_multidimensional -- Determines whether the input raster is multidimensional or not
    "
    """
        super().__init__()

    def __new__(cls, in_raster, is_multidimensional=False):
        return super().__new__(cls, in_raster, is_multidimensional)

    @property
    def bandNames(self):
        """
        return a list of band names
        """
        return super().bandNames

    def getRasterBands(self, band_ids_or_names=None):
        """return a list of raster objects, one per band

        Parameters:
          band_ids_or_names(list):a list of band IDs, e.g., [1, 2, 3] or band names ['blue', 'green', 'red']. Default: None, meaning that all bands would be extracted.

        Returns:
          out_raster_lsit(list): a list of raster objects
        """
        if not band_ids_or_names:
            band_count = super().bandCount
            band_ids_or_names = [i + 1 for i in range(band_count)]

        bands = super().bands(band_ids_or_names)
        return bands[0] if len(bands) == 1 else bands

    def getBandProperty(self, band_id_or_name, property_name):
        """getBandProperty(self, band_id_or_name, property_name)

        Returns the attribute information of specified band property at band index
          Parameters:
             band_id_or_name(String or integer): the name or (1-based) index of the band
             property_name(String): the name of the band property
          Returns:
             value(Object): value associated with property_name at band_id_or_name.

        """
        return super().getBandProperty(band_id_or_name, property_name)

    def setBandProperty(self, band_id_or_name, property_name, property_value):
        """setBandProperty(self, band_id_or_name, property_name, property_value)

        Sets the attribute information of specified band property at band index
          Parameters:
             band_id_or_name(String or integer): the name or (1-based) index of the band
             property_name(String): the name of the band property
             property_value(Object): value associated with property_name at band_id_or_name.
          Returns:
             None

        """
        return super().setBandProperty(band_id_or_name, property_name, property_value)

    def exportImage(
        self,
        width=0,
        height=0,
        format="PNG32",
        extent=None,
        spatial_reference=None,
        mosaic_rule=None,
    ):
        """export an image

        Parameters:
                   width (int): the number that defines the width of the image in pixels.
                   height (int): the number that defines the height of the image in pixels
                   format (string): the format of the exported image. Values: JPGPNG,PNG,PNG8,PNG24,PNG32,JPG,BMP,GIF,TIFF,BIP,BSQ,LERC
                   extent (Extent): the extent (bounding box) of the exported image. If this parameter is not specified, the extent of the raster would be used
                   spatial_reference (SpatialReference): the spatial reference of the exported image. Acceptable values are: None, SpatialReference Data Type, 'ICS', or 'ICS:<object_id>'. If a value is not specified, the spatial reference of the raster dataset is used
                   mosaic_rule (Dict): specifies the mosaic rule when defining how individual images should be mosaicked. If this parameter is not specified, default mosaic rule would be used

        Returns:
               out_image(IPython.display.Image): the bytes of the exported image

        Example:
          image = inRas.exportImage(format = 'JPEG')
        """
        from IPython.display import Image

        return Image(
            super().exportImage(
                w=width,
                h=height,
                f=format,
                bbox=extent,
                sr=spatial_reference,
                mr=mosaic_rule,
                rr=None,
            )
        )

    def getVariableAttributes(self, variable_name):
        """variableAttributes(self, variable_name)

        Returns the attribute information of a variable, e.g., description, unit, etc.
          Parameters:
             variable_name(String): the name of the variable
          Returns:
             out_variable_attributes(Dict) :the attribute information of the given variable.

        """

        return super().getVariableAttributes(variable_name)

    def getDimensionNames(self, variable_name):
        """dimensionNames(self, variable_name)

        Returns a list of the dimension names that the variable contains.
           Parameters:
             variable_name(String): the name of the variable
           Returns:
              out_dimension_names(List) :the dimension names that the given variable contains

        """

        return super().getDimensionNames(variable_name)

    def getDimensionAttributes(self, variable_name, dimension_name):
        """dimensionAttributes(self, variable_name, dimension_name)

        Returns the attribute information of a dimension within a variable, e.g., min value, max value, unit, etc.
          Parameters:
             variable_name(String): the name of the variable
             dimension_name(String): the name of the dimension
          Returns:
             out_dimension_attributes(Dict):the attribute information of the given dimension within the given variable.

        """

        return super().getDimensionAttributes(variable_name, dimension_name)

    def getDimensionValues(self, variable_name, dimension_name):
        """dimensionValues(self, variable_name, dimension_name)

        Returns the dimension values of a dimension within a variable.
          Parameters:
             variable_name(String): the name of the variable
             dimension_name(String): the name of the dimension
          Returns:
             out_dimension_values(List): a list of all dimension values along the given dimension within the given variable.

        """

        return super().getDimensionValues(variable_name, dimension_name)

    def renameVariable(self, current_variable_name, new_variable_name):
        """renameVariable(self, current_variable_name, new_variable_name)

        Rename the given variable name.
          Parameters:
             current_variable_name(String): the name of the variable to be renamed
             new_variable_name(String): the new variable name
          Returns:
             out_dimension_values(List): a list of all dimension values along the given dimension within the given variable.

        """

        return super().renameVariable(current_variable_name, new_variable_name, None)

    def renameBand(self, current_band_name_or_index, new_band_name):
        """renameBand(self, current_band_name_or_index, new_band_name)

        Rename a band.
          Parameters:
             current_band_name_or_index(String or integer): the name or index if the band to be renamed
             new_band_name(String): the new band name
          Returns:
             band_names(List): a list of all band names.

        """

        return super().renameBand(current_band_name_or_index, new_band_name)

    def removeVariables(self, variable_names):
        """removeVariables(self, variable_names)

        Removes the given variables.
          Parameters:
             variable_names(List): the list of variables to be removed
          Returns:
             out_variable_names(List): a list of all variables.

        """

        return super().removeVariables(variable_names)

    def addDimension(
        self, variable, new_dimension_name, dimension_value, dimension_attributes=None
    ):
        """addDimension(self, variable, new_dimension_name, dimension_value, dimension_attributes = None)

        Adds a new dimension to a given variable.
          Parameters:
             variable(String): variable to which the new dimesnion is to be added
             new_dimension_name(String): name of the new dimesnion to be added
             dimension_value(float): dimension value
             dimension_attributes(dict): optional attributes of the new dimension like Description, Unit etc.
          Returns:
             variables(String): The variable names and their dimensions in the multidimensional raster dataset.

        """

        return super().addDimension(
            variable, new_dimension_name, dimension_value, dimension_attributes
        )

    def appendSlices(self, mdRaster):
        """appendSlices(self, mdRaster)

        Adds a new dimension to a given variable.
          Parameters:
             mdRaster(raster): multidimensional raster from which the new slices will be read
          Returns:
             variables(String): The variable names and their dimensions in the multidimensional raster dataset.

        """

        return super().appendSlices(mdRaster)

    def setVariableAttributes(self, variable_name, variable_attributes):
        """variableAttributes(self, variable_name, variable_attributes)

        Sets the attribute information of a variable, e.g., description, unit, etc.
          Parameters:
             variable_name(String): the name of the variable
             variable_attributes(dict): the attributes to be set for the given variable
          Returns:
             out_variable_attributes(Dict) :the attribute information of the given variable.

        """

        return super().setVariableAttributes(variable_name, variable_attributes)

    def read(
        self,
        upper_left_corner=(0, 0),
        origin_coordinate=None,
        ncols=0,
        nrows=0,
        nodata_to_value=None,
        cell_size=None,
    ):
        """
        read a numpy array from the calling raster

        :param upper_left_corner: 2-D tuple. a tuple with 2 values representing the number of pixels along x and y
        direction relative to the origin_coordinate. E.g., (2, 0), means that the real origin to extract the array
        is 2 pixels away in x direction from the origin_coordinate

        :param origin_coordinate: arcpy.Point or 2-d tuple (X, Y). The x and y values are in map units.
        If no value is specified, the top left corner of the calling raster, i.e., arcpy.Point(XMin, YMax) will be used

        :param ncols: integer. the number of columns from the real origin in the calling raster to convert to the NumPy array.
        If no value is specified, the number of columns of the calling raster will be used. Default: None

        :param nrows: integer. the number of rows from the real origin in the calling raster to convert to the NumPy array.
        If no value is specified, the number of rows of the calling raster will be used. Default: None

        :param nodata_to_value: numeric. pixels with nodata values in the raster would be assigned with the given value in
        the NumPy array. If no value is specified, the NoData value of the calling raster will be used. Default: None

        :param cell_size: 2-D tuple. a tuple with 2 values shows the x_cell_size and y_cell_size, e.g., cell_size = (2, 2).
        if no value is specified, the original cell size of the calling raster will be used. Otherwise, pixels would be
        resampled to the requested cell_size

        :return: numpy.ndarray. If self is a multidimensional raster, the array has shape (slices, height, width, bands)
        """
        # validate inputs
        if not isinstance(upper_left_corner, tuple):
            raise TypeError("upper_left_corner must be 2-d tuple")
        if len(upper_left_corner) != 2:
            raise ValueError("upper_left_corner must be 2-d tuple")
        for n in upper_left_corner:
            if not isinstance(n, numbers.Number):
                raise ValueError(
                    "upper_left_corner must be 2-d tuple and each element must be numeric"
                )

        if not isinstance(ncols, numbers.Number) or ncols < 0:
            raise ValueError("ncols must be non-negative numeric")
        if not isinstance(nrows, numbers.Number) or nrows < 0:
            raise ValueError("nrows must be non-negative numeric")

        data = super().read(
            upper_left_corner=upper_left_corner,
            ncols=ncols,
            nrows=nrows,
            nodata_to_value=nodata_to_value,
            origin=origin_coordinate,
            cellsize=cell_size,
        )

        if self.bandCount == 1:
            data = np.expand_dims(data, axis=0)

        if self.isMultidimensional:
            slices = len(self.slices)
            if slices <= 1:
                data = np.expand_dims(data, axis=-1)
            data = np.transpose(data, axes=[3, 1, 2, 0])
        else:
            data = np.transpose(data, axes=[1, 2, 0])

        return data

    def write(
        self,
        array,
        upper_left_corner=(0, 0),
        origin_coordinate=None,
        value_to_nodata=None,
    ):
        """
        write a numpy array to the calling raster

        :param array: numpy.ndarray. the array must be in the shape of (slices, height, width, bands) for writing a
        multidimensional raster and (height, width bands) for writing a normal raster

        :param upper_left_corner: 2-D tuple.a tuple with 2 values representing the number of pixels along x and y direction
        that shows the position relative to the origin_coordinate. E.g., (2, 0), means that the position from which the
        numpy array will be written into the calling Raster is 2 pixels away in x direction from the origin_coordinate.
        Default value is (0, 0)

        :param origin_coordinate: arcpy.Point or 2-d tuple (X, Y) from where the numpy array will be written
        into the calling Raster. The x- and y-values are in map units. If no value is specified, the top left corner of the
        calling raster, i.e., arcpy.Point(XMin, YMax) will be used

        :param value_to_nodata: numeric. The value in the numpy array assigned to be the NoData values in the calling Raster.
        If no value is specified, the NoData value of the calling Raster will be used. Default None

        :return: None
        """
        # validate inputs
        if not isinstance(upper_left_corner, tuple):
            raise TypeError("upper_left_corner must be 2-d tuple")
        if len(upper_left_corner) != 2:
            raise ValueError("upper_left_corner must be 2-d tuple")
        for n in upper_left_corner:
            if not isinstance(n, numbers.Number):
                raise ValueError(
                    "upper_left_corner must be 2-d tuple and each element must be numeric"
                )

        if not isinstance(array, np.ndarray):
            raise TypeError("array must be numpy.ndarray type")

        if self.isMultidimensional:
            if len(array.shape) != 4:
                raise ValueError(
                    "array should have shape (slices, height, width, bands) for writing multidimensional raster"
                )
            if array.shape[0] != len(self.slices):
                raise ValueError(
                    "the first dimension must equal to the number of slices of the calling raster"
                )
            if array.shape[-1] != self.bandCount:
                raise ValueError(
                    "the last dimension must equal the number of bands of the calling raster"
                )
            height, width = array.shape[1], array.shape[2]
        else:
            if len(array.shape) != 3:
                raise ValueError(
                    "array should have shape (height, width, bands) for writing normal raster"
                )
            if array.shape[-1] != self.bandCount:
                raise ValueError(
                    "the last dimension must equal the number of bands of the calling raster"
                )
            height, width = array.shape[0], array.shape[1]

        if self.format is not None:
            is_crf = (
                self.format.lower().startswith("cache") or self.format.lower() == "crf"
            )
            if is_crf:
                if origin_coordinate is not None:
                    origin_x = origin_coordinate.X
                    origin_y = origin_coordinate.Y

                    x_min = self.extent.XMin
                    y_max = self.extent.YMax

                    upper_left_corner = (
                        upper_left_corner[0]
                        + int((origin_x - x_min) // self.meanCellWidth),
                        upper_left_corner[1]
                        + int((y_max - origin_y) // self.meanCellHeight),
                    )

                    origin_coordinate = None

                if (
                    upper_left_corner[0] % self.blockSize[0]
                    or upper_left_corner[1] % self.blockSize[1]
                    or height % self.blockSize[0]
                    or width % self.blockSize[1]
                ):
                    ulc = (
                        math.floor(upper_left_corner[0] / self.blockSize[0])
                        * self.blockSize[0],
                        math.floor(upper_left_corner[1] / self.blockSize[1])
                        * self.blockSize[1],
                    )
                    lrc = (
                        math.ceil((upper_left_corner[0] + width) / self.blockSize[0])
                        * self.blockSize[0],
                        math.ceil((upper_left_corner[1] + height) / self.blockSize[1])
                        * self.blockSize[1],
                    )
                    pb = self.read(
                        upper_left_corner=ulc,
                        ncols=lrc[0] - ulc[0],
                        nrows=lrc[1] - ulc[1],
                        nodata_to_value=value_to_nodata,
                    )
                    if self.isMultidimensional:
                        pb[
                            :,
                            upper_left_corner[1]
                            - ulc[1] : upper_left_corner[1]
                            - ulc[1]
                            + height,
                            upper_left_corner[0]
                            - ulc[0] : upper_left_corner[0]
                            - ulc[0]
                            + width,
                            :,
                        ] = array
                    else:
                        pb[
                            upper_left_corner[1]
                            - ulc[1] : upper_left_corner[1]
                            - ulc[1]
                            + height,
                            upper_left_corner[0]
                            - ulc[0] : upper_left_corner[0]
                            - ulc[0]
                            + width,
                            :,
                        ] = array

                    array = pb
                    upper_left_corner = ulc

        if self.isMultidimensional:
            array = np.transpose(array, [3, 1, 2, 0])
            slices = len(self.slices)
            if slices <= 1:
                array = np.squeeze(array, axis=-1)
        else:
            array = np.transpose(array, [2, 0, 1])

        if self.bandCount == 1:
            array = np.squeeze(array, axis=0)
        return super().write(
            data=array,
            upper_left_corner=upper_left_corner,
            value_to_nodata=value_to_nodata,
            origin=origin_coordinate,
        )

    @property
    def hasTranspose(self):
        """
        Identifies if there is a transposed version of data associated with the multidimensional CRF: True if the transpose
        exists, or False if no transpose exists.
        Learn more about Transpose,
        go to https://pro.arcgis.com/en/pro-app/tool-reference/data-management/build-multidimensional-transpose.htm
        """
        return super().hasTranspose

    @property
    def RAT(self):
        """
        Return the attribute table as a Diction if the table exists
        """
        return super().RAT

    def getColormap(self, variable_name=""):
        """
        get the colormap of the raster or a given variable if the raster is multidimensional.

        :param variable_name (string): optional. Specify it when the raster is a multidimensional.
        :return: dict, return the colormap of the raster or the given variable.
        """
        if not isinstance(variable_name, str):
            raise TypeError("variable_name must be string type")

        if self.isMultidimensional:
            if variable_name and variable_name not in self.variableNames:
                raise ValueError(variable_name + " is not existed.")
        else:
            if variable_name:
                raise ValueError("use empty string for non-multidimensional dataset")

        return super().getColormap(variable_name)

    def setColormap(self, color_map, variable_name=""):
        """
        set the colormap for the raster or a given variable if the raster is multidimensional

        :param color_map(string, dict): it could be:
                colormap name, e.g., “NDVI”
                customized colormap object, e.g., {'values': [0, 1, 2, 3, 4, 5, 6], 'colors': ['#000000', '#DCFFDF', '#B8FFBE', '#85FF90', '#50FF60','#00AB10', '#006B0A']}
                colorramp name, e.g., “Yellow To Red”
                customized colorramp object, e.g., {"type": "algorithmic", "fromColor": [115, 76, 0, 255],"toColor": [255, 25, 86, 255], "algorithm": "esriHSVAlgorithm"}
        :param variable_name(string): optional. Set the colormap for a given variable when the raster is a multidimensional
        :return: None.
        """
        if not isinstance(color_map, str) and not isinstance(color_map, dict):
            raise TypeError("color_map must be string or dict type")

        if self.isMultidimensional:
            if variable_name and variable_name not in self.variableNames:
                raise ValueError(variable_name + " is not existed.")
        else:
            if variable_name:
                raise ValueError("use empty string for non-multidimensional dataset")

        return super().setColormap(color_map, variable_name)

    def getStatistics(self, variable_name=""):
        """
        Get the statistics of the raster or a given variable if the raster is multidimensional

        :param variable_name(string): optinal. Specify it when the raster is a multidimensional

        :return: dict. Return the statistics of the raster or the given variable.
        """
        if not isinstance(variable_name, str):
            raise TypeError("variable_name must be string type")

        if self.isMultidimensional:
            if variable_name and variable_name not in self.variableNames:
                raise ValueError(variable_name + " is not existed.")
        else:
            if variable_name:
                raise ValueError("use empty string for non-multidimensional dataset")

        return super().getStatistics(variable_name)

    def setStatistics(self, statistics_obj, variable_name=""):
        """
        Set the statistics for the raster or a given variable if the raster is multidimensional

        :param statistics_obj(list): a list of statistics objects , e.g.,
        [{'min': val, 'max': val, 'mean': val, 'standardDeviation': val, 'median': val, 'mode': val, 'count': val}, …]

        :param variable_name(string): optional. Set the statistics for a given variable when the raster is a multidimensional
        :return: None. This is done in place.
        """
        if not isinstance(statistics_obj, list):
            raise TypeError("color_map must be list type")

        if self.isMultidimensional:
            if variable_name and variable_name not in self.variableNames:
                raise ValueError(variable_name + " is not existed.")
        else:
            if variable_name:
                raise ValueError("use empty string for non-multidimensional dataset")

        return super().setStatistics(statistics_obj, variable_name)

    def getHistograms(self, variable_name=""):
        """
        Get the statistics of the raster or a given variable if the raster is multidimensional

        :param variable_name(string): optional. Specify it when the raster is a multidimensional.

        :return(list of dict): return the statistics of the raster or the given variable.
        """
        if not isinstance(variable_name, str):
            raise TypeError("variable_name must be string type")

        if self.isMultidimensional:
            if variable_name and variable_name not in self.variableNames:
                raise ValueError(variable_name + " is not existed.")
        else:
            if variable_name:
                raise ValueError("use empty string for non-multidimensional dataset")

        return super().getHistograms(variable_name)

    def setHistograms(self, histogram_obj, variable_name=""):
        """
        Set the histogram for the raster or a given variable if the raster is multidimensional.

        :param histogram_obj(list): a list of histogram objects,
        e.g., [{'size': number_of_bins, 'min': min_val, 'max': max_val, 'counts': [pixel_count_at_each_bin, ...]}, ...]

        :param variable_name(string): optional. Set the histogram for a given variable when the raster is a multidimensional

        :return: None. This is done in place.
        """
        if not isinstance(histogram_obj, list):
            raise TypeError("histogram_obj must be list type")

        if self.isMultidimensional:
            if variable_name and variable_name not in self.variableNames:
                raise ValueError(variable_name + " is not existed.")
        else:
            if variable_name:
                raise ValueError("use empty string for non-multidimensional dataset")

        return super().setHistograms(histogram_obj, variable_name)

    def computeGSD(self, locations, spatial_reference=None, dem=None):
        """
        Computes the ground sampling distance for the given locations
        :param locations (list): a list of list containing x,y coordinates.
            e.g., [[x1,y1], [x2,y2],...]

        :param spatial_reference (SpatialReference): the spatial reference of the input locations

        :param dem: the DEM to be used in the computation of GSD
        :return(list of list): return the ground sampling distances as a list of [x,y] values
        """
        if not isinstance(locations, list):
            raise TypeError("locations must be of list type")
        return super().computeGSD(locs=locations, sr=spatial_reference, dem=dem)

    def getProperty(self, property_name):
        """getProperty(self, property_name)

        Returns the value of the given property.
          Parameters:
             property_name(String): the name of the property
          Returns:
             value(Object): value associated with property_name.

        """
        return super().getProperty(property_name)

    def setProperty(self, property_name, property_value):
        """setProperty(self, property_name, property_value)

        Add a customized property to the raster dataset. If the property name exists,
        the existing property value will be overwritten.
          Parameters:
             property_name(String): the name of the property
             property_value(Object): value associated with property_name
          Returns:
             None

        """
        if property_name == "DataType" and property_value == "Date":
            property_value = "StdTime"
        return super().setProperty(property_name, property_value)

    def computeStatistics(self, variable=None, aoi=None, cellsize=None):
        """
        Returns the statistics of the raster. If the raster is multidimensional, it returns the statistics of a variable.

        :param variable(string): The variable name for the multidimensional dataset.
                                  If a variable is not specified and the raster is multidimensional,
                                  the statistics of all variables will be calculated.
        :param aoi(Polygon): The area of interest to calculate statistics for.
                              This can be provided as Polygon object or a list of coordinates in the raster's
                              spatial reference system in the form of [min_x, min_y, max_x, max_y].
        :param cellsize(float): The cell size to calculate statistics from.
                         The raster will be resampled to the specified cell size before statistics are calculated.

                         If no value is specified, the cell size of the raster will be used.
        :return(list of dictionaries): return a list of dictionaries containing the statistics of the raster or variable.
        """
        return super().computeStatistics(variable=variable, aoi=aoi, cellsize=cellsize)

    def computeHistograms(self, variable=None, aoi=None, cellsize=None):
        """
        Returns the histogram  of the raster. If the raster is multidimensional, it returns the histogram  of a variable.

        :param variable(string): The variable name for the multidimensional dataset.
                                  If a variable is not specified and the raster is multidimensional,
                                  the histogram of all variables will be calculated.
        :param aoi(Polygon): The area of interest to calculate histogram  for.
                              This can be provided as Polygon object or a list of coordinates in the raster's
                              spatial reference system in the form of [min_x, min_y, max_x, max_y].
        :param cellsize(float): The cell size to calculate histogram from.
                         The raster will be resampled to the specified cell size before statistics are calculated.

                         If no value is specified, the cell size of the raster will be used.
        :return(list of dictionaries): return a list of dictionaries containing the histogram  of the raster or variable.
        """
        return super().computeHistograms(variable=variable, aoi=aoi, cellsize=cellsize)

    def isConstant(self, value):
        """
        Identifies whether a raster only contains a constant value.

        :param value(float): The value to evaluate for in the raster.

        :return(boolean): return a Boolean that indicates whether the raster only contains the constant value.
        """
        return super().isConstant(value=value)

    def isEmpty(self):
        """
        check if a raster is all NoData

        :return(boolean): return a Boolean that indicates whether the raster contains all NoData.
        """
        return super().isEmpty()

    @staticmethod
    def fromSTACItem(stac_item, request_params=None, context=None):
        """
        The fromSTACItem method creates a Raster object from a SpatioTemporal Asset Catalog (STAC) Item.

        :param stac_item: Required string or pystac.Item object.
                          If string, then it should be the URL of the STAC item.
                          It can be a Static STAC item URL or a STAC API Item URL.
                          Example: "https://planetarycomputer.microsoft.com/api/stac/v1/collections/naip/items/tx_m_2609719_se_14_060_20201217"
        
        :param request_params: Optional dictionary.
                               This parameter can be used to set the properties for making the STAC Item request.
                               These are the requests.get() method parameters and values will be specified in dictionary format.
                               Example: {"verify":False}
        
        :param context: Optional dictionary. Additional properties to control the creation of the Raster object.

                        Possible options:
                            - ``assetManagement``: Specifies how to manage and select assets for your Raster object.
                                If multiple assets are selected, the raster will be composed of multiband rasters
                                from those selected asset types.

                                Type: List, String or Dictionary

                                Format:
                                When working with individual assets, the asset key can be specified directly (Eg: "B02", {"key": "B02"})
                                Else it could be a list. Each item in the list represents an asset key or identifier. Items inside the list
                                can either be strings representing the asset key directly, or dictionaries providing
                                additional details for locating the asset.

                                The following keys could be used to provide the additional information of the assets (through individual dictionaries):

                                    - ``key``: A string representing the unique identifier for an asset. For example: "red".

                                    - ``path``: A dictionary representing the hierarchy of keys to navigate to the asset. \
                                        For example: ["alternate", "s3"]

                                    - ``hrefKey``: A string representing the key to access the asset URL. If different from the default "href" key, \
                                        it should be specified here. For example: "msft:https-url".

                                Usage examples:
                                    - "red"
                                    - ["red", "green", "blue"]
                                    - {"key": "tasmin", "hrefKey": "msft:https-url"}
                                    - [{"key": "TRAD", "path": ["alternate", "s3"]}, {"key": "DRAD", "path": ["alternate", "s3"]}]

                                Example:

                                .. code-block:: python

                                    {
                                        "assetManagement": [
                                            "red",
                                            "blue"
                                        ]
                                    }

                            - ``processingTemplate``: Specifies the processing template to be applied to the raster.
                                Supported for selected collections and raster types. Read more about this in the
                                `Satellite sensor raster types <https://pro.arcgis.com/en/pro-app/latest/help/data/imagery/satellite-sensor-raster-types.htm>`__ documentation.

                                Type: String

                                Default: "Multiband" (for supported raster types only else None)

                                Example:

                                .. code-block:: python

                                    {
                                        "processingTemplate": "Surface Reflectance"
                                    }

        :return(Raster object): Returns a Raster object

        .. code-block:: python

            # Usage Example: Creating a Raster object from a STAC Item.

            ras = Raster.fromSTACItem(stac_item=stac_item_url)
        """

        import requests

        is_pystac_item = False
        if isinstance(stac_item, str):
            if request_params is None:
                request_params = {}
            if not isinstance(request_params, dict):
                raise RuntimeError("request_params should be of type dictionary")
            if any(key in request_params for key in ["url", "params", "data", "json"]):
                raise RuntimeError(
                    "request_params cannot contain these keys : url, params, data or json"
                )

            data = requests.get(stac_item, **request_params)
            if data.status_code != 200 or data.headers.get("content-type") not in [
                "application/json",
                "application/json; charset=utf-8",
                "application/geo+json",
                "application/json;charset=utf-8",
                "application/geo+json; charset=utf-8",
                "text/plain; charset=utf-8",
                "text/plain",
                "binary/octet-stream",
            ]:
                raise RuntimeError(
                    f"Invalid Response: Please verify that the stac_item URL is correct-\n{data.text}"
                )

            json_data = data.json()
        else:
            try:
                import pystac

                json_data = stac_item.to_dict()
                is_pystac_item = True
            except ImportError:
                raise ImportError(
                    "pystac not found, parameter stac_item accepts either a STAC Item URL or a pystac.Item object"
                )
            except Exception:
                raise RuntimeError(f"Invalid/Unsupported STAC Item-\n{stac_item}")

        zarr_datasets = [
            "daymet-annual-pr",
            "daymet-daily-hi",
            "gridmet",
            "daymet-annual-na",
            "daymet-monthly-na",
            "daymet-annual-hi",
            "daymet-monthly-hi",
            "daymet-monthly-pr",
            "terraclimate",
            "daymet-daily-pr",
            "daymet-daily-na",
        ]

        if "type" not in json_data or (
            json_data["type"] not in ["Feature", "Collection"]
            or (
                json_data["type"] == "Collection"
                and json_data["id"] not in zarr_datasets
            )
        ):
            raise RuntimeError(f"Invalid STAC Item-\n{json_data}")
        item = json_data
        item_href = stac_item.self_href if is_pystac_item else stac_item

        from ..ia.util import (
            _get_stac_metadata_file,
            _get_static_catalog_item_resources,
        )
        from ..ia import CompositeBand

        metadata_file = _get_stac_metadata_file(item, context)
        if not metadata_file:
            item, metadata_file = _get_static_catalog_item_resources(
                (item_href, item), request_params, context
            )
            if not metadata_file:
                raise RuntimeError("STAC Item not supported")

        ras = (
            CompositeBand(metadata_file)
            if isinstance(metadata_file, list)
            else arcpy.Raster(
                metadata_file,
                is_multidimensional=(
                    True
                    if metadata_file.endswith((".zarr", ".nc", ".grib2"))
                    else False
                ),
            )
        )

        return ras

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

from arcpy.ia import Apply

__all__ = [
    'ApparentReflectance',
    'Apply',
    'ArgStatistics',
    'Arithmetic',
    'Aspect',
    'AspectSlope',
    'BandArithmetic',
    'BAI',
    'Buffered',
    'CIg',
    'CIre',
    'Classify',
    'ClayMinerals',
    'Colormap',
    'ColormapToRGB',
    'ColorspaceConversion',
    'Complex',
    'CompositeBand',
    'ComputeChange',
    'Contour',
    'ContrastBrightness',
    'Convolution',
    'Curvature',
    'DetectChangeUsingChangeAnalysis',
    'EVI',
    'ElevationVoidFill',
    'EqualToFrequency',
    'ExtractBand',
    'FerrousMinerals',
    'GEMI',
    'GenerateTrend',
    'Geometric',
    'GeometricMedian',
    'GNDVI',
    'GVITM',
    'Gradient',
    'Grayscale',
    'GreaterThanFrequency',
    'HeatIndex',
    'HighestPosition',
    'Hillshade',
    'InterpolateRasterByDimension',
    'IronOxide',
    'LessThanFrequency',
    'LinearUnmixing',
    'Lookup',
    'LowestPosition',
    'MLClassify',
    'MNDWI',
    'MSAVI',
    'MTVI2',
    'Mask',
    'Majority',
    'Max',
    'Mean',
    'Median',
    'Min',
    'Minority',
    'NBR',
    'NDBI',
    'NDMI',
    'NDSI',
    'NDVI',
    'NDVIre',
    'NDWI',
    'PVI',
    'Pansharpen',
    'Percentile',
    'Popularity',
    'PredictUsingTrend',
    'RTVICore',
    'RadarCalibration',
    'Range',
    'Rank',
    'RasterCalculator',
    'RasterizeFeatures',
    'RegionGrow',
    'RegionPixelCount',
    'Remap',
    'Reproject',
    'Resample',
    'S1RadiometricCalibration',
    'S1ThermalNoiseRemoval',
    'SAVI',
    'SR',
    'SRre',
    'SegMeanShift',
    'ShadedRelief',
    'Slope',
    'Speckle',
    'SpectralConversion',
    'Statistics',
    'StatisticsHistogram',
    'StdDev',
    'Stretch',
    'SubsetBands',
    'Sultan',
    'Sum',
    'TSAVI',
    'TasseledCap',
    'Threshold',
    'TransposeBits',
    'TrendToRGB',
    'UnitConversion',
    'VARI',
    'Variety',
    'VectorField',
    'VectorFieldRenderer',
    'WindChill',
    'ZonalRemap',
]


def Grayscale(raster, conversion_parameters=None):
    """
    The Grayscale function converts a multi-band image into a single-band Grayscale
    image. Specified weights are applied to each of the input bands, and a
    normalization is applied for output.

    Parameters:
      raster(Raster): the input raster
      conversion_parameters(List): array of double (A length of N array representing weights for each band, where N=band count.)

    Returns:
      output_raster(Raster): The output raster with this function applied to it
    """
    template_dict = {
        "rasterFunction": "Grayscale",
        "rasterFunctionArguments": {}
    }

    if conversion_parameters is not None and isinstance(conversion_parameters, list):
        template_dict["rasterFunctionArguments"]['ConversionParameters'] = conversion_parameters
    return Apply(in_raster=raster, raster_function=template_dict["rasterFunction"],
                 raster_function_arguments=template_dict["rasterFunctionArguments"])


def Arithmetic(raster1, raster2, operation_type="Plus", extent_type="FirstOf", cellsize_type="FirstOf"):
    """
    The Arithmetic function performs an Arithmetic operation between two rasters or a raster and a scalar, and vice versa.

    Parameters:
      raster1(Raster): the first raster (can be scalar)
      raster2(Raster): the 2nd raster (can be scalar)
      operation_type(string): one of "Plus", "Minus", "Multiply", "Divide", "Power", "Mode"
      extent_type(string): one of "FirstOf", "IntersectionOf" "UnionOf", "LastOf"
      cellsize_type(string): one of "FirstOf", "MinOf", "MaxOf "MeanOf", "LastOf"

    Returns:
      output_raster(Raster): The output raster with the function applied to it
    """
    extent_types = {
        "FirstOf": 0,
        "IntersectionOf": 1,
        "UnionOf": 2,
        "LastOf": 3
    }

    cellsize_types = {
        "FirstOf": 0,
        "MinOf": 1,
        "MaxOf": 2,
        "MeanOf": 3,
        "LastOf": 4
    }

    operation_types = {
        "Plus": 1,
        "Minus": 2,
        "Multiply": 3,
        "Divide": 4,
        "Power": 5,
        "Mode": 6
    }

    if extent_type not in list(extent_types.keys()):
        raise ValueError(
            "Invalid extent_type value. Note that operation type should be one of 'FirstOf', 'IntersectionOf', 'UnionOf', 'LastOf'")
    in_extent_type = extent_types[extent_type]

    if cellsize_type not in list(cellsize_types.keys()):
        raise ValueError(
            "Invalid cellsize_type value. Note that operation type should be one of 'FirstOf', 'MinOf', 'MaxOf', 'MeanOf', 'LastOf'")
    in_cellsize_type = cellsize_types[cellsize_type]

    if operation_type not in list(operation_types.keys()):
        raise ValueError(
            "Invalid operation_type value. Note that operation type should be one of 'Plus', 'Minus', 'Multiply', 'Divide', 'Power', 'Mode'")
    in_operation_type = operation_types[operation_type]

    template_dict = {
        "rasterFunction": "Arithmetic",
        "rasterFunctionArguments": {
            "Operation": in_operation_type
        }
    }

    if in_extent_type is not None:
        template_dict["rasterFunctionArguments"]['ExtentType'] = in_extent_type
    if in_cellsize_type is not None:
        template_dict["rasterFunctionArguments"]['CellsizeType'] = in_cellsize_type
    return Apply(in_raster=(raster1, raster2),
                 raster_function=template_dict["rasterFunction"],
                 raster_function_arguments=template_dict["rasterFunctionArguments"])


def ArgStatistics(rasters, stat_type=None, min_value=None, max_value=None, multiple_occurrence_value=100,
                  ignore_nodata=True, extent_type="FirstOf", cellsize_type="FirstOf"):
    """
    The ArgStatistics function produces an output with a pixel value that represents a statistical metric from all
    bands of input rasters. The statistics can be the band index (or the slice index for multidimensional raster) of the maximum, minimum, or median value, or the
    duration (number of bands) between a minimum and maximum value



    Parameters:
      rasters(list of Rasters): Input rasters
      stat_type(string): one of "max", "min", "median", "duration"
      min_value(double): required if the type is duration
      max_value(double): required if the type is duration
      multiple_occurrence_value(int): the value will be returned when the max or min value occurred at multiple bands or slices. required if stat_ype is max or min
      ignore_nodata(bool): default is True, in this case, only cells that have data values will be used in determining the output value. False: the output value will be nodata value if one of the cells have a value of NoData
      extent_type(string): one of "FirstOf", "IntersectionOf" "UnionOf", "LastOf"
      cellsize_type(string): one of "FirstOf", "MinOf", "MaxOf "MeanOf", "LastOf"



    Returns:
      output_raster(Raster): The output raster
    """
    stat_types = {
        'max': 0,
        'min': 1,
        'median': 2,
        'duration': 3
    }

    template_dict = {
        "rasterFunction": "ArgStatistics",
        "rasterFunctionArguments": {}
    }

    extent_types = {
        "FIRSTOF": 0,
        "INTERSECTIONOF": 1,
        "UNIONOF": 2,
        "LASTOF": 3
    }

    cellsize_types = {
        "FIRSTOF": 0,
        "MINOF": 1,
        "MAXOF": 2,
        "MEANOF": 3,
        "LASTOF": 4
    }

    if stat_type.lower() not in list(stat_types.keys()):
        raise ValueError("Invalid stat_type error. stat_type should be one of 'min', 'max', 'median', 'duration'")

    if stat_type is not None:
        template_dict["rasterFunctionArguments"]['ArgStatisticsType'] = stat_types[stat_type.lower()]

    if stat_type.lower() == 'duration':
        if min_value is None or max_value is None:
            raise ValueError("Missing min_value or max_value")
        else:
            template_dict["rasterFunctionArguments"]['MinValue'] = min_value
            template_dict["rasterFunctionArguments"]['MaxValue'] = max_value
    else:
        template_dict["rasterFunctionArguments"]['UndefinedClass'] = multiple_occurrence_value

    template_dict["rasterFunctionArguments"]["IgnoreNoData"] = ignore_nodata

    if extent_type.upper() not in list(extent_types.keys()):
        raise ValueError(
            "Invalid extent_type value. Note that operation type should be one of 'FirstOf', 'IntersectionOf', 'UnionOf', 'LastOf'")
    in_extent_type = extent_types[extent_type.upper()]
    if in_extent_type is not None:
        template_dict["rasterFunctionArguments"]['ExtentType'] = in_extent_type

    if cellsize_type.upper() not in list(cellsize_types.keys()):
        raise ValueError(
            "Invalid cellsize_type value. Note that operation type should be one of 'FirstOf', 'MinOf', 'MaxOf', 'MeanOf', 'LastOf'")
    in_cellsize_type = cellsize_types[cellsize_type.upper()]
    if in_cellsize_type is not None:
        template_dict["rasterFunctionArguments"]['CellsizeType'] = in_cellsize_type

    return Apply(in_raster=rasters,
                 raster_function=template_dict["rasterFunction"],
                 raster_function_arguments=template_dict["rasterFunctionArguments"])


def Aspect(raster):
    """
    Aspect identifies the downslope direction of the maximum rate of change in value from each cell to its neighbors.
    Aspect can be thought of as the slope direction. The values of the output raster will be the compass direction of
    the Aspect.

    Parameters:
      raster(Raster): Input raster

    Returns:
      output_raster(Raster): The output raster with this function applied to it
    """

    template_dict = {
        "rasterFunction": "Aspect"
    }

    return Apply(in_raster=raster,
                 raster_function=template_dict["rasterFunction"])


def BandArithmetic(raster, band_ids, method=1):
    """

    The BandArithmetic function performs an arithmetic operation on the bands of a raster.

    Parameters:
      raster(Raster): Input raster
      band_ids(String): band ids (one-based) seperated by space
      method(int): Default 1. The type of band arithmetic algorithm you want to deploy.
                   You can define your custom algorithm, or choose a predefined index.
                   0 = UserDefined,
                   1 = NDVI,
                   2 = SAVI,
                   3 = TSAVI,
                   4 = MSAVI,
                   5 = GEMI,
                   6 = PVI,
                   7 = GVITM,
                   8 = Sultan,
                   9 = VARI,
                   10 = GNDVI,
                   11 = SR,
                   12 = NDVIre,
                   13 = SRre,
                   14 = MTVI2,
                   15 = RTVICore,
                   16 = CIre,
                   17 = CIg,
                   18 = NDWI,
                   19 = EVI,
                   20 = IronOxide,
                   21 = FerrousMinerals,
                   22 = ClayMinerals
                   23 = WNDWI

    Returns:
      output_raster(Raster): The output raster with this function applied to it
    """

    template_dict = {
        "rasterFunction": "BandArithmetic",
        "rasterFunctionArguments": {
            "Method": method,
            "BandIndexes": band_ids
        }
    }

    return Apply(in_raster=raster,
                 raster_function=template_dict["rasterFunction"],
                 raster_function_arguments=template_dict["rasterFunctionArguments"])


def BAI(raster, red_band_id=3, nir_band_id=4):
    """
    Burn Area Index (BAI)
    The Burn Area Index (BAI) uses the reflectance values in the red and NIR portion of the spectrum to identify
    the areas of the terrain affected by fire.

    BAI = 1/((0.1 -RED)^2 + (0.06 - NIR)^2)

    :param raster: the input raster / imagery layer
    :param red_band_id: the band ID of the red band, e.g.,6. Note that band ID uses one-based indexing.
    :param nir_band_id: the band ID of the nir band, e.g.,5. Note that band ID uses one-based indexing.
    :return: Burn Area Index raster
    """
    band_id_list = [red_band_id, nir_band_id]
    for band_id in band_id_list:
        if not isinstance(band_id, int) or band_id <= 0:
            raise ValueError("band id should be positive integer value")
    band_algo = "1.0/((0.1-B" + str(red_band_id) + ")*(0.1-B" + str(red_band_id) + ")+(0.06-B" + str(nir_band_id) + \
                ")*(0.06-B" + str(nir_band_id) + "))"
    return BandArithmetic(raster, band_algo, 0)


def CIg(raster, nir_band_id=7, green_band_id=3):
    """
    The Chlorophyll Index - Green (CIg) is a vegetation index for estimating
    the chlorophyll content in leaves using the ratio of reflectivity in
    the near-infrared (NIR) and green bands.

    CIg = [(NIR / Green)-1]

    Parameters:
      raster(Raster): Input raster
      nir_band_id(int): NIR band ID, e.g., 7. Note that band ID uses one-based indexing.
      green_band_id(int): green band ID, e.g., 3. Note that band ID uses one-based indexing.

    Returns:
      output_raster(Raster): The output raster with this function applied to it
    """
    # type check
    band_id_list = [nir_band_id, green_band_id]
    for band_id in band_id_list:
        if not isinstance(band_id, int):
            raise ValueError("band id should be positive integer value")
        if band_id <= 0:
            raise ValueError("Invalid band id value(s). Note that band id value starts from 1 instead of 0")

    band_ids = str(str(nir_band_id) + " " + str(green_band_id))
    return BandArithmetic(raster, band_ids, 17)


def CIre(raster, nir_band_id=7, redEdge_band_id=6):
    """
    The Chlorophyll Index - Red-Edge (CIre) is a vegetation index for estimating
    the chlorophyll content in leaves using the ratio of reflectivity in the
    near-infrared (NIR) and red-edge bands.

    CIre = [(NIR / RedEdge)-1]

    Parameters:
      raster(Raster): Input raster
      nir_band_id(int): NIR band ID, e.g., 7. Note that band ID uses one-based indexing.
      redEdge_band_id(int): red-edge band ID, e.g., 6. Note that band ID uses one-based indexing.

    Returns:
      output_raster(Raster): The output raster with this function applied to it
    """
    # type check
    band_id_list = [nir_band_id, redEdge_band_id]
    for band_id in band_id_list:
        if not isinstance(band_id, int) or band_id <= 0:
            raise ValueError("band id should be positive integer value")
    band_ids = str(str(nir_band_id) + " " + str(redEdge_band_id))
    return BandArithmetic(raster, band_ids, 16)


def ClayMinerals(raster, swir1_band_id=6, swir2_band_id=7):
    """
    The Clay Minerals (CM) ratio is a geological index for identifying
    mineral features containing clay and alunite using two shortwave
    infrared (SWIR) bands. CM is used in mineral composite mapping.

    CM = SWIR1 / SWIR2

    Parameters:
      raster(Raster): Input raster
      swir1_band_id(int): SWIR1 band ID, e.g., 6. Note that band ID uses one-based indexing.
      swir2_band_id(int): SWIR2 band ID, e.g., 7. Note that band ID uses one-based indexing.

    Returns:
      output_raster(Raster): The output raster with this function applied to it
    """
    band_id_list = [swir1_band_id, swir2_band_id]
    for band_id in band_id_list:
        if not isinstance(band_id, int) or band_id <= 0:
            raise ValueError("band id should be positive integer value")
    band_ids = str(str(swir1_band_id) + " " + str(swir2_band_id))
    return BandArithmetic(raster, band_ids, 22)


def ColorspaceConversion(raster, conversion_type="rgb_to_hsv"):
    """
    The ColorspaceConversion function converts the color model of a three-band
    unsigned 8-bit image from either the hue, saturation, and value (HSV)
    to red, green, and blue (RGB) or vice versa. An ExtractBand function and/or
    a Stretch function are sometimes used for converting the imagery into valid
    input of ColorspaceConversion function.

    Parameters:
      raster(Raster): Input raster. The pixeltype should be unsigned 8-bit
      conversion_type(string):  one of "rgb_to_hsv" or "hsv_to_rgb". Default is "rgb_to_hsv"

    Returns:
      output_raster(Raster): The output raster with this function applied to it
    """

    conversion_types = {
        "rgb_to_hsv": 0,
        "hsv_to_rgb": 1
    }

    if conversion_type not in list(conversion_types.keys()):
        raise ValueError("conversion_type value is invalid. It should be either rgb_to_hsv or hsv_to_rgb")

    template_dict = {
        "rasterFunction": "ColorspaceConversion",
        "rasterFunctionArguments": {}
    }

    template_dict["rasterFunctionArguments"]['ConversionType'] = conversion_types[conversion_type]

    return Apply(in_raster=raster,
                 raster_function=template_dict["rasterFunction"],
                 raster_function_arguments=template_dict["rasterFunctionArguments"])


def ColormapToRGB(raster):
    """
    The function is designed to work with single band image service that has
    internal colormap. It will convert the image into a three-band 8-bit RGB
    raster. This function takes no arguments except an input raster.

    Parameters:
      raster(Raster): Input raster

    Returns:
      output_raster(Raster): The output raster with this function applied to it
    """

    template_dict = {
        "rasterFunction": "ColormapToRGB"
    }

    return Apply(in_raster=raster,
                 raster_function=template_dict["rasterFunction"])


def Colormap(raster, colormap=None, colorramp=None):
    """
    Transforms the pixel values to display the raster data as a color (RGB) image, based on specific colors in
    a color map.

    Parameters:
      raster(Raster): Input raster
      colormap(string or list or dict): Default value is None.
                        Could be a string specifying the color map name, One of Random | NDVI | Elevation | Gray
                        Could be a list in the form of
                            [
                               [value1, red1, green1, blue1], //[int, int, int, int]
                               [value2, red2, green2, blue2],
                               ...
                            ]
                        Could be a dict in the form of:
                            {"values":[value_1, value_2,...], "colors":[color_1, color_2,...], "labels":[label_1, label_2,...]}
                            here, labels are optional

      colorramp(string or dict): Default value is None.
                        Can be a string specifying color ramp name like "Black To White", "Yellow To Red", "Slope", or other colorramp names supported in ArcGIS Pro
                        Can be a dict. For more information about colorramp object, see color ramp object https://developers.arcgis.com/documentation/common-data-types/color-ramp-objects.htm
    Returns:
      output_raster(Raster): The output raster with this function applied to it
    """



    template_dict = {
        "rasterFunction": "Colormap",
        "rasterFunctionArguments": {}
    }

    if colormap is not None and isinstance(colormap, str):
        template_dict["rasterFunctionArguments"]['ColormapName'] = colormap
    if colormap is not None and (isinstance(colormap, list) or isinstance(colormap, dict)):
        template_dict["rasterFunctionArguments"]['Colormap'] = colormap
    if colorramp is not None and isinstance(colorramp, str):
        template_dict["rasterFunctionArguments"]['ColorrampName'] = colorramp
    if colorramp is not None and isinstance(colorramp, dict):
        template_dict["rasterFunctionArguments"]['Colorramp'] = colorramp
    return Apply(in_raster=raster,
                 raster_function=template_dict["rasterFunction"],
                 raster_function_arguments=template_dict["rasterFunctionArguments"])


def Complex(raster):
    """
    Complex function computes magnitude from complex values. It is used when
    input raster has complex pixel type. It computes magnitude from complex
    value to convert the pixel type to floating point for each pixel. It takes
    no argument but an input raster.

    Parameters:
      raster(Raster): Input raster

    Returns:
      output_raster(Raster): The output raster with this function applied to it
    """

    template_dict = {
        "rasterFunction": "Complex"
    }

    return Apply(in_raster=raster,
                 raster_function=template_dict["rasterFunction"])


def CompositeBand(rasters):
    """
    Combines multiple images to form a multiband image.

    Parameters:
      raster(list of Rasters): Input rasters

    Returns:
      output_raster(Raster): The output multiband raster.
    """

    template_dict = {
        "rasterFunction": "CompositeBand"
    }

    return Apply(in_raster=rasters,
                 raster_function=template_dict["rasterFunction"])


def ContrastBrightness(raster, contrast_offset=0, brightness_offset=0):
    """
    The ContrastBrightness function enhances the appearance of raster data (imagery) by modifying the brightness or
    contrast within the image. This function works on 8-bit input raster only.

    Parameters:
      raster(Raster): Input raster. The pixel type of the input raster must be 8-bit .
      contrast_offset(float): contrast offset value. Value can be in range -100 to 100
      brightness_offset(float): brightness offset value. Value can be in range -100 to 100

    Returns:
      output_raster(Raster): The output raster with this function applied to it
    """
    from numbers import Number
    # type check
    if not isinstance(contrast_offset, Number) or contrast_offset < -100 or contrast_offset > 100:
        raise ValueError("contrast_offset should be a number within [-100, 100]")
    if not isinstance(brightness_offset, Number) or brightness_offset < -100 or brightness_offset > 100:
        raise ValueError("brightness_offset should be a number within [-100, 100]")

    template_dict = {
        "rasterFunction": "ContrastBrightness",
        "rasterFunctionArguments": {
            "ContrastOffset": contrast_offset,
            "BrightnessOffset": brightness_offset
        }
    }

    return Apply(in_raster=raster,
                 raster_function=template_dict["rasterFunction"],
                 raster_function_arguments=template_dict["rasterFunctionArguments"])


def Convolution(raster, kernel=None):
    """
    The Convolution function performs filtering on the pixel values in an image, which can be used for sharpening an
    image, blurring an image, detecting edges within an image, or other kernel-based enhancements.

    Parameters:
      raster(Raster): Input raster
      kernel(int, list of list): well known kernel or user defined kernel passed as a list of list.
                                 well known kernels:
                                 LINE_DETECTION_HORIZONTAL = 0
                                 LINE_DETECTION_VERTICAL = 1
                                 LINE_DETECTION_LEFT_DIAGONAL = 2
                                 LINE_DETECTION_RIGHT_DIAGONAL = 3
                                 GRADIENT_NORTH = 4
                                 GRADIENT_WEST = 5
                                 GRADIENT_EAST = 6
                                 GRADIENT_SOUTH = 7
                                 GRADIENT_NORTH_EAST = 8
                                 GRADIENT_NORTH_WEST = 9
                                 SMOOTH_ARITHMETIC_MEAN = 10
                                 SMOOTHING_3X3 = 11
                                 SMOOTHING_5X5 = 12
                                 SHARPENING_3X3 = 13
                                 SHARPENING_5X5 = 14
                                 LAPLACIAN_3X3 = 15
                                 LAPLACIAN_5X5 = 16
                                 SOBEL_HORIZONTAL = 17
                                 SOBEL_VERTICAL = 18
                                 SHARPEN = 19
                                 SHARPEN2 = 20
                                 POINT_SPREAD = 21

    Returns:
      output_raster(Raster): The output raster with this function applied to it
    """

    template_dict = {
        "rasterFunction": "Convolution",
        "rasterFunctionArguments": {}
    }

    if (isinstance(kernel, int)):
        template_dict["rasterFunctionArguments"]['Type'] = kernel
    elif (isinstance(kernel, list)):
        numrows = len(kernel)
        numcols = len(kernel[0])
        flattened = [item for sublist in kernel for item in sublist]
        template_dict["rasterFunctionArguments"]['Columns'] = numcols
        template_dict["rasterFunctionArguments"]['Rows'] = numrows
        template_dict["rasterFunctionArguments"]['Kernel'] = flattened
        template_dict["rasterFunctionArguments"]['Type'] = -1
    else:
        raise ValueError('Invalid kernel type - pass int or list of list: [[][][]...]')

    return Apply(in_raster=raster,
                 raster_function=template_dict["rasterFunction"],
                 raster_function_arguments=template_dict["rasterFunctionArguments"])


def Curvature(raster, curvature_type='standard', z_factor=1):
    """
    The Curvature function displays the shape or curvature of the slope. A part of a surface can be concave or convex;
    you can tell that by looking at the curvature value. The curvature is calculated by computing the second derivative
    of the surface.

    Parameters:
      raster(Raster): Input raster
      curvature_type(string): default value is 'standard'. The curvature type accentuates different aspects of the slope.
                              One of 'standard', 'planform', 'profile'
                              standard - Combines both the Profile and Planform curvatures.

                              planform - Is parallel to the slope and indicates the direction of maximum slope.
                              It affects the acceleration and deceleration of flow across the surface.

                              profile - Is perpendicular to the direction of the maximum slope.
                              It affects the convergence and divergence of flow across a surface.

      z_factor(double): The z-factor adjusts the units of measure for the z units when they are
                        different from the x,y units of the input surface. If the x,y units and
                        z units are in the same units of measure, the z-factor should be set to 1.
                        The z-values of the input surface are multiplied by the z-factor when
                        calculating the final output surface. For example, if your z units are
                        feet and your x,y units are meters, you would use a z-factor of 0.3048

    Returns:
      output_raster(Raster): The output raster with this function applied to it
    """

    curv_types = {
        'standard': 0,
        'profile': 1,
        'planform': 2
    }
    # value check
    if curvature_type.lower() not in list(curv_types.keys()):
        raise ValueError(
            "Invalid curvature_type value. Note that curvature_type should be one of 'standard', 'planform', 'profile'")

    in_curv_type = curv_types[curvature_type.lower()]

    template_dict = {
        "rasterFunction": "Curvature",
        "rasterFunctionArguments": {
            "Type": in_curv_type,
            "ZFactor": z_factor
        }
    }

    return Apply(in_raster=raster,
                 raster_function=template_dict["rasterFunction"],
                 raster_function_arguments=template_dict["rasterFunctionArguments"])


def ElevationVoidFill(raster, max_void_width=0):
    """
    The elevation_void_fill function is used to create pixels where holes exist in your elevation.

    Parameters:
      raster(Raster): Input raster
      max_void_width(int): Default is 0. The maximum void width value is used to specify the largest size of a void
                            that you want to fill. If the width or height of the bounding box around the
                            void is larger than the maximum void width value, the void is not filled.
                            The units of this parameter is the same as the units used in your data's
                            spatial reference system

    Returns:
      output_raster(Raster): The output raster with this function applied to it
    """

    template_dict = {
        "rasterFunction": "ElevationVoidFill",
        "rasterFunctionArguments": {}
    }

    if max_void_width is not None:
        template_dict["rasterFunctionArguments"]["MaxVoidWidth"] = max_void_width

    return Apply(in_raster=raster,
                 raster_function=template_dict["rasterFunction"],
                 raster_function_arguments=template_dict["rasterFunctionArguments"])


def ExtractBand(raster, band_ids=None, band_names=None, band_wavelengths=None, missing_band_action="BestMatch",
                wavelength_match_tolerance=None):
    """
    The ExtractBand function allows you to extract one or more bands from a raster, or it can reorder the bands in a
    multiband image.

    Parameters:
      raster(Raster): Input raster
      band_ids(int or list of int): single band ID or list of band IDs. Note band ID (one-based indexing)
      band_names(string or list of string): single band name or list of Band names
      band_wavelengths(list of double): Band wavelengths
      missing_band_action(int): 0 = BestMatch, 1 = Fail
      wavelength_match_tolerance(double): wavelength match tolerance

    Returns:
      output_raster(Raster): The output raster with this function applied to it
    """
    # value check
    missing_band_actions = {"BestMatch": 0, "Fail": 1}

    if missing_band_action not in list(missing_band_actions.keys()):
        raise ValueError(
            "missing_band_action value is invalid. Note that missing_band_action should be either 'BestMatch' or 'Fail'")

    template_dict = {
        "rasterFunction": "ExtractBand",
        "rasterFunctionArguments": {}
    }

    if band_ids is not None:
        if isinstance(band_ids, list):
            for item in band_ids:
                if not isinstance(item, int) or item <= 0:
                    raise ValueError("band id should be positive integer value")
            template_dict["rasterFunctionArguments"]["BandIDs"] = band_ids
        elif isinstance(band_ids, int):
            if band_ids <= 0:
                raise ValueError("band id should be positive integer value")
            template_dict["rasterFunctionArguments"]["BandIDs"] = [band_ids]
        else:
            raise TypeError("band_ids should be a single integer or a list of interger values")
        template_dict["rasterFunctionArguments"]['Method'] = 2

    if band_names is not None:
        if isinstance(band_names, list):
            for item in band_names:
                if not isinstance(item, str):
                    raise ValueError("band name should be string")
            template_dict["rasterFunctionArguments"]["BandNames"] = band_names
        elif isinstance(band_names, str):
            template_dict["rasterFunctionArguments"]["BandNames"] = [band_names]
        else:
            raise TypeError("band_names should be either a single string or a list of string")

    if band_wavelengths is not None:
        template_dict["rasterFunctionArguments"]["BandWavelengths"] = band_wavelengths

    if missing_band_action is not None:
        template_dict["rasterFunctionArguments"]["MissingBandAction"] = missing_band_actions[missing_band_action]
    if wavelength_match_tolerance is not None:
        template_dict["rasterFunctionArguments"]["WavelengthMatchTolerance"] = wavelength_match_tolerance

    return Apply(in_raster=raster,
                 raster_function=template_dict["rasterFunction"],
                 raster_function_arguments=template_dict["rasterFunctionArguments"])


def EVI(raster, nir_band_id=5, red_band_id=4, blue_band_id=2):
    """
    The Enhanced Vegetation Index (EVI) is an optimized vegetation index that accounts
    for atmospheric influences and vegetation background signal. It's similar to NDVI,
    but is less sensitive to background and atmospheric noise, and it does not become
    saturated NDVI when viewing areas with very dense green vegetation.

    EVI =  2.5 * [(NIR - Red)/(NIR + (6*Red) - (7.5*Blue) + 1)]

    Parameters:
      raster(Raster): Input raster
      nir_band_id(int): NIR band ID, e.g., 5. Note that band ID uses one-based indexing.
      red_band_id(int): red band ID, e.g., 4. Note that band ID uses one-based indexing.
      blue_band_id(int): blue band ID , e.g., 2. Note that band ID uses one-based indexing.

    Returns:
      output_raster(Raster): The output raster with this function applied to it
    """
    # type check
    band_id_list = [nir_band_id, red_band_id, blue_band_id]
    for band_id in band_id_list:
        if not isinstance(band_id, int) or band_id <= 0:
            raise ValueError("band id should be positive integer value")

    band_ids = str(nir_band_id) + " " + str(red_band_id) + " " + str(blue_band_id)
    return BandArithmetic(raster, band_ids, 19)


def FerrousMinerals(raster, swir_band_id=6, nir_band_id=5):
    """
    The Ferrous Minerals (FM) ratio is a geological index for identifying
    rock features containing some quantity of iron-bearing minerals using
    the shortwave infrared (SWIR) and near-infrared (NIR) bands. FM is used
    in mineral composite mapping.

    FM = SWIR / NIR

    Parameters:
      raster(Raster): Input raster
      swir_band_id(int): SWIR band ID, e.g., 6. Note that band ID uses one-based indexing.
      nir_band_id(int): NIR band ID, e.g., 5. Note that band ID uses one-based indexing.

    Returns:
      output_raster(Raster): The output raster with this function applied to it
    """
    # type check
    band_id_list = [swir_band_id, nir_band_id]
    for band_id in band_id_list:
        if not isinstance(band_id, int) or band_id <= 0:
            raise ValueError("band id should be positive integer value")
    band_ids = str(str(swir_band_id) + " " + str(nir_band_id))
    return BandArithmetic(raster, band_ids, 21)


def Statistics(raster, kernel_columns=3, kernel_rows=3, stat_type=None, fill_no_data_only=False):
    """
    Function calculates focal statistics for each pixel of an image based on a defined focal neighborhood.

    Parameters:
      raster(Raster): Input raster
      kernel_columns(int): The number of pixel columns to use in your focal neighborhood dimension.
      kernel_rows(int): The number of pixel rows to use in your focal neighborhood dimension
      stat_type(string): There are seven types of focal statistical functions:
                       Min, Max, Mean, StandardDeviation, Median, Majority, Minority
                          -Min-Calculates the minimum value of the pixels within the neighborhood
                          -Max-Calculates the maximum value of the pixels within the neighborhood
                          -Mean-Calculates the average value of the pixels within the neighborhood. This is the default.
                          -StandardDeviation-Calculates the standard deviation value of the pixels within the neighborhood
                          -Median-Calculates the median value of pixels within the neighborhood.
                          -Majority-Calculates the majority value, or the value that occurs most frequently, of the pixels within the neighborhood.
                          -Minority-Calculates the minority value, or the value that occurs least frequently, of the pixels within the neighborhood.
      fill_no_data_only(bool): Set to True, to fill no data pixels only.

    Returns:
      output_raster(Raster): The output raster with this function applied to it
    """

    statistics_types = {"min": 1, "max": 2, "mean": 3, "standarddeviation": 4, "median": 5, "majority": 6, "minority": 7}

    template_dict = {
        "rasterFunction": "Statistics",
        "rasterFunctionArguments": {}
    }

    if stat_type is not None:
        if isinstance(stat_type, str) and stat_type.lower() in statistics_types:
            template_dict["rasterFunctionArguments"]['Type'] = statistics_types[stat_type.lower()]
        else:
            raise ValueError(
                "Invalid stat_type value. Note that stat_type must be one of min, max, mean, standarddeviation, median, majority, minority")

    if kernel_columns is not None:
        template_dict["rasterFunctionArguments"]["Columns"] = kernel_columns
    if kernel_rows is not None:
        template_dict["rasterFunctionArguments"]["Rows"] = kernel_rows
    if fill_no_data_only is not None:
        template_dict["rasterFunctionArguments"]["FillNoDataOnly"] = fill_no_data_only

    return Apply(in_raster=raster,
                 raster_function=template_dict["rasterFunction"],
                 raster_function_arguments=template_dict["rasterFunctionArguments"])


def Hillshade(dem, azimuth=315.0, altitude=45.0, z_factor=1, slope_type=1, ps_power=0.664, psz_factor=0.024,
              remove_edge_effect=False, hillshade_type=0):
    """
    A hillshade is a grayscale 3D model of the surface taking the sun's relative position into account to shade the image.

    Parameters:
      dem(Raster): Input DEM raster
      azimuth(double): default 315.0 Azimuth is the sun's relative position along the horizon (in degrees).
                       This position is indicated by the angle of the sun measured clockwise from due north.
                       An azimuth of 0 degrees indicates north, east is 90 degrees, south is 180 degrees,
                       and west is 270 degrees.
      altitude(double): default 45.0 Altitude is the sun's angle of elevation above the horizon and ranges from 0 to 90 degrees.
                        A value of 0 degrees indicates that the sun is on the horizon, that is, on the same horizontal
                        plane as the frame of reference. A value of 90 degrees indicates that the sun is directly overhead.
      z_factor(double): default 1. The z-factor is a scaling factor used to convert the elevation values for two purposes:

                        - Convert the elevation units (such as meters or feet) to the horizontal coordinate units of the dataset,
                          which may be feet, meters, or degrees.

                        - Add vertical exaggeration for visual effect.

      slope_type(int): default is 1. 1=DEGREE, 2=PERCENTRISE, 3=SCALED.
      ps_power(double):  default value is 0.664. used together with SCALED slope type. Pixel Size Power accounts for the altitude changes (or scale)
                        as the viewer zooms in and out on the map display. It is the exponent applied to the pixel size term
                        in the equation that controls the rate at which the Z Factor changes to avoid significant loss of
                        relief.
      psz_factor(double):  default value is 0.024. used together with SCALED slope type. Pixel Size Factor accounts for changes in scale as the viewer
                         zooms in and out on the map display. It controls the rate at which the Z Factor changes.
      remove_edge_effect(bool): Set to True to remove edge effect
      hillshade_type(int): Default is 0, 0 = traditional, 1 = multi - directional

                           Traditional - Calculates hillshade from a single illumination direction.
                           You can set the Azimuth and Altitude to control the location of the light source.

                           Multidirectional - Combines light from multiple sources to represent an enhanced
                           visualization of the terrain.

    Returns:
      output_raster(Raster): The output raster with this function applied to it
    """

    template_dict = {
        "rasterFunction": "Hillshade",
        "rasterFunctionArguments": {}
    }

    if azimuth is not None:
        template_dict["rasterFunctionArguments"]["Azimuth"] = azimuth
    if altitude is not None:
        template_dict["rasterFunctionArguments"]["Altitude"] = altitude
    if z_factor is not None:
        template_dict["rasterFunctionArguments"]["ZFactor"] = z_factor
    if slope_type is not None:
        template_dict["rasterFunctionArguments"]["SlopeType"] = slope_type
    if ps_power is not None:
        template_dict["rasterFunctionArguments"]["PSPower"] = ps_power
    if psz_factor is not None:
        template_dict["rasterFunctionArguments"]["PSZFactor"] = psz_factor
    if remove_edge_effect is not None:
        template_dict["rasterFunctionArguments"]["RemoveEdgeEffect"] = remove_edge_effect
    if hillshade_type is not None:
        template_dict["rasterFunctionArguments"]["HillshadeType"] = hillshade_type

    return Apply(in_raster=dem,
                 raster_function=template_dict["rasterFunction"],
                 raster_function_arguments=template_dict["rasterFunctionArguments"])


def GEMI(raster, nir_band_id=4, red_band_id=3):
    """
    Global Environmental Monitoring Index
    GEMI = eta*(1-0.25*eta)-((Red-0.125)/(1-Red))
    where eta = (2*(NIR^2-Red^2)+1.5*NIR+0.5*Red)/(NIR+Red+0.5)

    Parameters:
      raster(Raster): Input raster
      nir_band_id(int): NIR band ID, e.g., 4. Note that band ID uses one-based indexing.
      red_band_id(int): red band ID, e.g., 3. Note that band ID uses one-based indexing.

    Returns:
      output_raster(Raster): The output raster with this function applied to it
    """
    # type check
    band_id_list = [nir_band_id, red_band_id]
    for band_id in band_id_list:
        if not isinstance(band_id, int) or band_id <= 0:
            raise ValueError("band id should be positive integer value")
    band_ids = str(str(nir_band_id) + " " + str(red_band_id))
    return BandArithmetic(raster, band_ids, 5)


def GNDVI(raster, nir_band_id=4, green_band_id=2):
    """
    Green Normalized Difference Vegetation Index

    GNDVI = (NIR-Green)/(NIR+Green)

    Parameters:
      raster(Raster): Input raster
      nir_band_id(int): NIR band ID, e.g., 4. Note that band ID uses one-based indexing.
      green_band_id(int): green band ID, e.g., 2. Note that band ID uses one-based indexing.

    Returns:
      output_raster(Raster): The output raster with this function applied to it
    """
    # type check
    band_id_list = [nir_band_id, green_band_id]
    for band_id in band_id_list:
        if not isinstance(band_id, int) or band_id <= 0:
            raise ValueError("band id should be positive integer value")
    band_ids = str(str(nir_band_id) + " " + str(green_band_id))
    return BandArithmetic(raster, band_ids, 10)


def GVITM(raster, band1_id=1, band2_id=2, band3_id=3, band4_id=4, band5_id=5, band7_id=7):
    """
    Green Vegetation Index - Landsat TM
    GVITM = -0.2848*Band1-0.2435*Band2-0.5436*Band3+0.7243*Band4+0.0840*Band5-0.1800*Band7

    Parameters:
      :param raster(Raster): Input raster
      :param band1_id(int): the band ID of band1, e.g., 1. Note that band ID uses one-based indexing.
      :param band2_id(int): the band ID of band2, e.g., 2. Note that band ID uses one-based indexing.
      :param band3_id(int): the band ID of band3, e.g., 3. Note that band ID uses one-based indexing.
      :param band4_id(int): the band ID of band4, e.g., 4. Note that band ID uses one-based indexing.
      :param band5_id(int): the band ID of band5, e.g., 5. Note that band ID uses one-based indexing.
      :param band7_id(int): the band ID of band6, e.g., 7. Note that band ID uses one-based indexing.

    Returns:
      output_raster(Raster): The output raster with this function applied to it
    """
    # type check
    band_id_list = [band1_id, band2_id, band3_id, band4_id, band5_id, band7_id]
    for band_id in band_id_list:
        if not isinstance(band_id, int) or band_id <= 0:
            raise ValueError("band id should be positive integer value")
    band_ids = str(
        str(band1_id) + " " + str(band2_id) + " " + str(band3_id) + " " + str(band4_id) + " " + str(
            band5_id) + " " + str(band7_id))
    return BandArithmetic(raster, band_ids, 7)


def IronOxide(raster, red_band_id=4, blue_band_id=2):
    """
    The Iron Oxide (IO) ratio is a geological index for identifying rock
    features that have experienced oxidation of iron-bearing sulfides
    using the red and blue bands. IO is useful in identifying iron oxide
    features below vegetation canopies, and is used in mineral composite mapping.

    IronOxide = Red / Blue

    :param raster: the input raster / imagery layer
    :param red_band_id: the band ID of the red band, e.g.,4. Note that band ID uses one-based indexing.
    :param blue_band_id: the band ID of the blue band, e.g.,2. Note that band ID uses one-based indexing.
    :return: output raster
    """
    band_id_list = [red_band_id, blue_band_id]
    for band_id in band_id_list:
        if not isinstance(band_id, int) or band_id <= 0:
            raise ValueError("band id should be positive integer value")
    band_ids = str(red_band_id) + " " + str(blue_band_id)
    return BandArithmetic(raster, band_ids, 20)


def Lookup(raster, field=None):
    """
    Creates a new raster by looking up values found in another field in the table of the input raster.
    For more information see, https://pro.arcgis.com/en/pro-app/help/data/imagery/lookup-function.htm

    :param raster: The input raster that contains a field from which to create a new raster.
    :param field: Field containing the desired values for the new raster.

    :return: the output raster with this function applied to it
    """

    template_dict = {
        "rasterFunction": "Lookup",
        "rasterFunctionArguments": {
        }
    }

    if field is not None:
        template_dict["rasterFunctionArguments"]['Field'] = field

    return Apply(raster, template_dict['rasterFunction'], template_dict['rasterFunctionArguments'])


def Mask(raster, no_data_values=None, included_ranges=None, no_data_interpretation=None):
    """
    The mask function changes the image by specifying a certain pixel value or a range of pixel values as no data.
    The arguments for the mask function are as follows:

    :param raster: input raster
    :param no_data_values: array of numbers [band0_val,band1_val,...]
    :param included_ranges: array of double [band0_lowerbound,band0_upperbound,band1...],
    :param no_data_interpretation: int 0=MatchAny, 1=MatchAll
    :return: the output raster with this function applied to it

    """

    template_dict = {
        "rasterFunction": "Mask",
        "rasterFunctionArguments": {
        }
    }

    if no_data_values is not None:
        template_dict["rasterFunctionArguments"]["NoDataValues"] = no_data_values
    if included_ranges is not None:
        template_dict["rasterFunctionArguments"]["IncludedRanges"] = included_ranges
    if no_data_interpretation is not None:
        template_dict["rasterFunctionArguments"]["NoDataInterpretation"] = no_data_interpretation

    return Apply(raster, template_dict['rasterFunction'], template_dict['rasterFunctionArguments'])


def MLClassify(raster, signature):
    """
    The ml_classify function allows you to perform a supervised classification using the maximum likelihood classification
     algorithm. For more information, see https://pro.arcgis.com/en/pro-app/help/data/imagery/ml-classify-function.htm
     The arguments for the ml_classify function are as follows:

    :param raster: input raster
    :param signature: string. a signature string returned from computeClassStatistics (GSG)
    :return: the output raster

    """

    template_dict = {
        "rasterFunction": "MLClassify",
        "rasterFunctionArguments": {
            "SignatureFile": signature
        }
    }

    return Apply(raster, template_dict['rasterFunction'], template_dict['rasterFunctionArguments'])


def MNDWI(raster, green_band_id=3, swir_band_id=6):
    """
    The Modified Normalized Difference Water Index (MNDWI) uses green and SWIR bands for the enhancement
    of open water features. It also diminishes built-up area features that are often correlated with open
    water in other indices.

    MNDWI = (Green - SWIR) / (Green + SWIR)

    :param raster: the input raster / imagery layer
    :param green_band_id: the band ID of the nir band, e.g.,3. Note that band ID uses one-based indexing. .
    :param swir_band_id: the band ID of the red band, e.g.,6. Note that band ID uses one-based indexing. .
    :return: Modified Normalized Difference Water Index
    """
    band_id_list = [green_band_id, swir_band_id]
    for band_id in band_id_list:
        if not isinstance(band_id, int) or band_id <= 0:
            raise ValueError("band id should be positive integer value")
    band_algo = "(B" + str(green_band_id) + "-B" + str(swir_band_id) + ")/(B" + str(green_band_id) + \
                "+B" + str(swir_band_id) + ")"
    return BandArithmetic(raster, band_algo, 0)


def MSAVI(raster, nir_band_id=4, red_band_id=3):
    """
    Modified Soil Adjusted Vegetation Index
    MSAVI2 = (1/2)*(2(NIR+1)-sqrt((2*NIR+1)^2-8(NIR-Red)))

    :param raster: the input raster / imagery layer
    :param nir_band_id: the band ID of the nir band, e.g.,4. Note that band ID uses one-based indexing.
    :param red_band_id: the band ID of the red band, e.g.,3. Note that band ID uses one-based indexing.
    :return: output raster
    """
    band_id_list = [nir_band_id, red_band_id]
    for band_id in band_id_list:
        if not isinstance(band_id, int) or band_id <= 0:
            raise ValueError("band id should be positive integer value")
    band_ids = str(nir_band_id) + " " + str(red_band_id)
    return BandArithmetic(raster, band_ids, 4)


def MTVI2(raster, nir_band_id=7, red_band_id=5, green_band_id=3):
    """
    The Modified Triangular Vegetation Index (MTVI2) is a vegetation index
    for detecting leaf chlorophyll content at the canopy scale while being
    relatively insensitive to leaf area index. It uses reflectance in the green,
    red, and near-infrared (NIR) bands

    MTVI2 = (1.5*(1.2*(NIR-Green)-2.5*(Red-Green))/sqrt((2*NIR+1)^2-(6*NIR-5*sqrt(Red))-0.5))

    :param raster: the input raster / imagery layer
    :param nir_band_id: the band ID of the nir band, e.g.,7. Note that band ID uses one-based indexing.
    :param red_band_id: the band ID of the red band, e.g.,5. Note that band ID uses one-based indexing.
    :param green_band_id: the band ID of the green band, e.g.,3. Note that band ID uses one-based indexing.
    :return: output raster
    """
    band_id_list = [nir_band_id, red_band_id, green_band_id]
    for band_id in band_id_list:
        if not isinstance(band_id, int) or band_id <= 0:
            raise ValueError("band id should be positive integer value")
    band_ids = str(nir_band_id) + " " + str(red_band_id) + " " + str(green_band_id)
    return BandArithmetic(raster, band_ids, 14)

def NBR(raster, swir_band_id=7, nir_band_id=5):
    """
    Normalized Burn Ratio Index (NBR)
    The Normalized Burn Ratio Index (NBR) uses the NIR and SWIR bands to emphasize burned areas,
    while mitigating illumination and atmospheric effects. Your images should be corrected to reflectance values
    before using this index.

    NBR = (NIR - SWIR) / (NIR+ SWIR)

    :param raster: the input raster / imagery layer
    :param swir_band_id: the band ID of the swir band, e.g.,7. Note that band ID uses one-based indexing.
    :param nir_band_id: the band ID of the nir band, e.g.,5. Note that band ID uses one-based indexing.
    :return: Normalized Burn Ratio Index raster
    """
    band_id_list = [swir_band_id, nir_band_id]
    for band_id in band_id_list:
        if not isinstance(band_id, int) or band_id <= 0:
            raise ValueError("band id should be positive integer value")
    band_algo = "(B" + str(nir_band_id) + "-B" + str(swir_band_id) + ")/(B" + str(nir_band_id) + \
                "+B" + str(swir_band_id) + ")"
    return BandArithmetic(raster, band_algo, 0)


def NDBI(raster, swir_band_id=6, nir_band_id=5):
    """
    Normalized Difference Built-up Index (NDBI)
    The Normalized Difference Built-up Index (NDBI) uses the NIR and SWIR bands to emphasize man-made built-up areas.
    It is ratio based to mitigate the effects of terrain illumination differences as well as atmospheric effects.

    NDBI = (SWIR - NIR) / (SWIR + NIR)

    :param raster: the input raster / imagery layer
    :param swir_band_id: the band ID of the swir band, e.g.,6. Note that band ID uses one-based indexing.
    :param nir_band_id: the band ID of the nir band, e.g.,5. Note that band ID uses one-based indexing.
    :return: Normalized Difference Built-up Index raster
    """
    band_id_list = [swir_band_id, nir_band_id]
    for band_id in band_id_list:
        if not isinstance(band_id, int) or band_id <= 0:
            raise ValueError("band id should be positive integer value")
    band_algo = "(B" + str(swir_band_id) + "-B" + str(nir_band_id) + ")/(B" + str(swir_band_id) + \
                "+B" + str(nir_band_id) + ")"
    return BandArithmetic(raster, band_algo, 0)


def NDMI(raster, nir_band_id=5, swir1_band_id=6):
    """
    Normalized Difference Moisture Index (NDMI)
    The Normalized Difference Moisture Index (NDMI) is sensitive to the moisture levels in vegetation.
    It is used to monitor droughts as well as monitor fuel levels in fire-prone areas. It uses NIR and SWIR bands to
    create a ratio designed to mitigate illumination and atmospheric effects.

    NDMI = (NIR - SWIR1)/(NIR + SWIR1)

    :param raster: the input raster / imagery layer
    :param nir_band_id: the band ID of the nir band, e.g.,5. Note that band ID uses one-based indexing.
    :param swir1_band_id: the band ID of the swir1 band, e.g.,6. Note that band ID uses one-based indexing.
    :return: Normalized Difference Moisture Index
    """
    band_id_list = [nir_band_id, swir1_band_id]
    for band_id in band_id_list:
        if not isinstance(band_id, int) or band_id <= 0:
            raise ValueError("band id should be positive integer value")
    band_algo = "(B" + str(nir_band_id) + "-B" + str(swir1_band_id) + ")/(B" + str(nir_band_id) + \
                "+B" + str(swir1_band_id) + ")"
    return BandArithmetic(raster, band_algo, 0)



def NDSI(raster, green_band_id=4, swir_band_id=6):
    """
    Normalized Difference Snow Index (NDSI)
    The Normalized Difference Snow Index (NDSI) is designed to use MODIS (band 4 and band 6) and
    Landsat TM (band 2 and band 5) for identification of snow cover while ignoring cloud cover. Since it is ratio based,
    it also mitigates atmospheric effects.

    NDSI = (Green - SWIR) / (Green + SWIR)

    :param raster: the input raster / imagery layer
    :param green_band_id: the band ID of the green band, e.g.,6. Note that band ID uses one-based indexing.
    :param swir_band_id: the band ID of the swir band, e.g.,5. Note that band ID uses one-based indexing.
    :return: Normalized Difference Snow Index
    """
    band_id_list = [green_band_id, swir_band_id]
    for band_id in band_id_list:
        if not isinstance(band_id, int) or band_id <= 0:
            raise ValueError("band id should be positive integer value")
    band_algo = "(B" + str(green_band_id) + "-B" + str(swir_band_id) + ")/(B" + str(green_band_id) + \
                "+B" + str(swir_band_id) + ")"
    return BandArithmetic(raster, band_algo, 0)


def NDVI(raster, nir_band_id=4, red_band_id=3):
    """
    Normalized Difference Vegetation Index
    NDVI = ((NIR - Red)/(NIR + Red))

    :param raster: the input raster / imagery layer
    :param nir_band_id: the band ID of the nir band, e.g.,4. Note that band ID uses one-based indexing. .
    :param red_band_id: the band ID of the red band, e.g.,3. Note that band ID uses one-based indexing. .
    :return: Normalized Difference Vegetation Index raster
    """
    band_id_list = [nir_band_id, red_band_id]
    for band_id in band_id_list:
        if not isinstance(band_id, int) or band_id <= 0:
            raise ValueError("band id should be positive integer value")
    band_ids = str(nir_band_id) + " " + str(red_band_id)
    return BandArithmetic(raster, band_ids, 1)


def NDVIre(raster, nir_band_id=7, redEdge_band_id=6):
    """
    Red-Edge NDVI (NDVIre)
    The Red-Edge NDVI (NDVIre) is a vegetation index for estimating
    vegetation health using the red-edge band. It is especially useful
    for estimating crop health in the mid to late stages of growth where
    the chlorophyll concentration is relatively higher. Also, NDVIre can
    be used to map the within-field variability of nitrogen foliage to
    understand the fertilizer requirements of crops.

    NDVIre = (NIR-RedEdge)/(NIR+RedEdge)

    :param raster: the input raster / imagery layer
    :param nir_band_id: the band ID of the nir band, e.g.,7. Note that band ID uses one-based indexing.
    :param rededge_band_id: the band ID of the redEdge band, e.g.,6. Note that band ID uses one-based indexing.
    :return: output raster
    """
    band_id_list = [nir_band_id, redEdge_band_id]
    for band_id in band_id_list:
        if not isinstance(band_id, int) or band_id <= 0:
            raise ValueError("band id should be positive integer value")
    band_ids = str(nir_band_id) + " " + str(redEdge_band_id)
    return BandArithmetic(raster, band_ids, 12)


def NDWI(raster, nir_band_id=5, green_band_id=3):
    """
    The Normalized Difference Water Index (NDWI) is an index for delineating and
    monitoring content changes in surface water. It is computed with the near-infrared
    (NIR) and green bands.

    NDWI = (Green - NIR)/(Green +NIR)

    :param raster: the input raster / imagery layer
    :param nir_band_id: the band ID of the nir band, e.g.,5. Note that band ID uses one-based indexing.
    :param green_band_id: the band ID of the green band, e.g.,3. Note that band ID uses one-based indexing.
    :return: output raster
    """
    band_id_list = [nir_band_id, green_band_id]
    for band_id in band_id_list:
        if not isinstance(band_id, int) or band_id <= 0:
            raise ValueError("band id should be positive integer value")
    band_ids = str(nir_band_id) + " " + str(green_band_id)
    return BandArithmetic(raster, band_ids, 18)


def Pansharpen(pan_raster, ms_raster, ir_raster=None, fourth_band_of_ms_is_ir=True, weights=[0.166, 0.167, 0.167, 0.5],
               type="ESRI", sensor=None):
    """
    The Pansharpening function uses a higher-resolution panchromatic raster to
    fuse with a lower-resolution, multiband raster. It can generate colorized
    multispectral image with higher resolution. For more information, see
    https://pro.arcgis.com/en/pro-app/help/data/imagery/pansharpening-function.htm

    :param pan_raster: raster, which is panchromatic
    :param ms_raster: raster, which is multispectral
    :param ir_raster: Optional, if fourth_band_of_ms_is_ir is true or selected pansharpening method doesn't require near-infrared image
    :param fourth_band_of_ms_is_ir: Boolean, "true" if "ms_raster" has near-infrared image on fourth band
    :param weights: Weights applied for Red, Green, Blue, Near-Infrared bands. 4-elements array, Sum of values is 1
    :param type: string, describes the Pansharpening method one of "IHS", "Brovey" "ESRI", "SimpleMean", "Gram-Schmidt". Default is "ESRI"
    :param sensor: string, it is an optional parameter to specify the sensor name
    :return: output raster with function applied
    """

    pansharpening_types = {
        "IHS": 0,
        "Brovey": 1,
        "ESRI": 2,
        "SimpleMean": 3,
        "Gram-Schmidt": 4
    }

    template_dict = {
        "rasterFunction": "Pansharpening",
        "rasterFunctionArguments": {
            "Weights": weights
        }
    }

    if type is not None:
        template_dict["rasterFunctionArguments"]['PansharpeningType'] = pansharpening_types[type]

    if isinstance(fourth_band_of_ms_is_ir, bool):
        template_dict["rasterFunctionArguments"]['UseFourthBandOfMSAsIR'] = fourth_band_of_ms_is_ir

    if sensor is not None:
        template_dict["rasterFunctionArguments"]['Sensor'] = sensor

    if ir_raster is not None:
        return Apply({"PanImage": pan_raster, "MSImage": ms_raster, "InfraredImage": ir_raster},
                     template_dict['rasterFunction'], template_dict['rasterFunctionArguments'])
    else:
        return Apply({"PanImage": pan_raster, "MSImage": ms_raster}, template_dict['rasterFunction'],
                     template_dict['rasterFunctionArguments'])


def PVI(raster, nir_band_id=4, red_band_id=3, a=0.3, b=0.5):
    """
    Perpendicular Vegetation Index
    PVI = (NIR-a*Red-b)/(sqrt(1+a^2))

    :param raster: the input raster
    :param nir_band_id: the band ID of the nir band, e.g.,4. Note that band ID uses one-based indexing.
    :param red_band_id: the band ID of the red band, e.g.,3. Note that band ID uses one-based indexing.
    :param a: the slope
    :param b: the gradient

    :return: output raster
    """
    band_id_list = [nir_band_id, red_band_id]
    for band_id in band_id_list:
        if not isinstance(band_id, int) or band_id <= 0:
            raise ValueError("band id should be positive integer value")
    band_ids = str(nir_band_id) + " " + str(red_band_id) + " " + str(a) + " " + str(b)
    return BandArithmetic(raster, band_ids, 6)


def RasterCalculator(rasters, input_names, expression, extent_type="FirstOf", cellsize_type="FirstOf"):
    """
    The RasterCalculator function provides access to all existing math functions
    so you can make calls to them when building your expressions. The calculator
    function requires single-band inputs. If you need to perform expressions on
    bands in a multispectral image as part of a function chain, you can use
    the Extract Bands Function before the RasterCalculator function.
    For more info including operators supported, see Calculator function
    http://pro.arcgis.com/en/pro-app/help/data/imagery/calculator-function.htm

    :param rasters: array of rasters
    :param input_names: array of strings for arbitrary raster names.
    :param expression: string, expression to calculate output raster from input rasters
    :param extent_type: string, one of "FirstOf", "IntersectionOf" "UnionOf", "LastOf". Default is "FirstOf".
    :param cellsize_type: one of "FirstOf", "MinOf", "MaxOf "MeanOf", "LastOf". Default is "FirstOf".
    :return: output raster with function applied
    """

    extent_types = {
        "FirstOf": 0,
        "IntersectionOf": 1,
        "UnionOf": 2,
        "LastOf": 3
    }

    cellsize_types = {
        "FirstOf": 0,
        "MinOf": 1,
        "MaxOf": 2,
        "MeanOf": 3,
        "LastOf": 4
    }

    template_dict = {
        "rasterFunction": "RasterCalculator",
        "rasterFunctionArguments": {
            "InputNames": input_names,
            "Expression": expression
        },
        "variableName": "Rasters"
    }

    template_dict["rasterFunctionArguments"]['ExtentType'] = extent_types[extent_type]
    template_dict["rasterFunctionArguments"]['CellsizeType'] = cellsize_types[cellsize_type]

    return Apply(rasters, template_dict['rasterFunction'], template_dict['rasterFunctionArguments'])


def Remap(raster, input_ranges=None, output_values=None, no_data_ranges=None, allow_unmatched=False, replacement_value=None):
    """
    The remap function allows you to change or reclassify the pixel values of the raster data.
    For more information, see https://pro.arcgis.com/en/pro-app/help/data/imagery/remap-function.htm

    The arguments for the remap function are as follows:

    :param raster: input raster
    :param input_ranges: [range1_from, range1_to, …], input ranges are specified in pairs: from (inclusive) and to (exclusive). Default: None
    :param output_values: [new_value1, ...], output values of corresponding input ranges. Default: None
    :param no_data_ranges: [nodatavalue1_from,  nodatavalue1_to, …],//[double, double, …], nodata ranges are specified in pairs: from (inclusive) and to (exclusive). Default: None
    :param allow_unmatched: Boolean, specify whether to keep the unmatched values or turn into nodata. Default: False
    :param replacement_value: The value that will replace missing or unmatched values in the output when allow_unmatched is False.
    :return: the remapped raster

    """

    template_dict = {
        "rasterFunction": "Remap",
        "rasterFunctionArguments": {
        },
        "variableName": "Raster"
    }

    if input_ranges is None and output_values is None and no_data_ranges is None:
        raise ValueError("input_ranges, output_values and no_data_ranges should not be None at the same time")

    if input_ranges is not None:
        template_dict["rasterFunctionArguments"]["InputRanges"] = input_ranges
        if output_values is not None:
            template_dict["rasterFunctionArguments"]["OutputValues"] = output_values
        else:
            raise ValueError("output_values should be provided.")
    if no_data_ranges is not None:
        template_dict["rasterFunctionArguments"]["NoDataRanges"] = no_data_ranges
    if allow_unmatched is not None:
        template_dict["rasterFunctionArguments"]["AllowUnmatched"] = allow_unmatched
    if replacement_value is not None:
        template_dict["rasterFunctionArguments"]["ReplacementValue"] = replacement_value

    return Apply(raster, template_dict['rasterFunction'], template_dict['rasterFunctionArguments'])


def Resample(raster, resampling_type=None, input_cellsize=None, output_cellsize=None):
    """
    The resample function resamples pixel values from a given resolution.The arguments for the resample function are as follows:

    :param raster: input raster
    :param resampling_type: one of NearestNeighbor,Bilinear,Cubic,Majority,BilinearInterpolationPlus,BilinearGaussBlur,
            BilinearGaussBlurPlus, Average, Minimum, Maximum,VectorAverage(require two bands)
    :param input_cellsize: point that defines cellsize in source spatial reference
    :param output_cellsize: point that defines output cellsize
    :return: the output raster

    """

    resample_types = {
        'NearestNeighbor': 0,
        'Bilinear': 1,
        'Cubic': 2,
        'Majority': 3,
        'BilinearInterpolationPlus': 4,
        'BilinearGaussBlur': 5,
        'BilinearGaussBlurPlus': 6,
        'Average': 7,
        'Minimum': 8,
        'Maximum': 9,
        'VectorAverage': 10
    }

    if isinstance(resampling_type, str):
        resampling_type = resample_types[resampling_type]

    template_dict = {
        "rasterFunction": "Resample",
        "rasterFunctionArguments": {
        },
        "variableName": "Raster"
    }
    if resampling_type is not None:
        template_dict["rasterFunctionArguments"]["ResamplingType"] = resampling_type
    if input_cellsize is not None:
        template_dict["rasterFunctionArguments"]["InputCellsize"] = input_cellsize
    if output_cellsize is not None:
        template_dict["rasterFunctionArguments"]["OutputCellsize"] = output_cellsize

    return Apply(raster, template_dict['rasterFunction'], template_dict['rasterFunctionArguments'])


def RTVICore(raster, nir_band_id=7, redEdge_band_id=6, green_band_id=3):
    """
    The Red-Edge Triangulated Vegetation Index (RTVICore) is a vegetation index
    for estimating leaf area index and biomass. This index uses reflectance
    in the NIR, red-edge, and green spectral bands

    RTVICore = [100(NIR-RedEdge)-10(NIR-Green)]

    :param raster: the input raster / imagery layer
    :param nir_band_id: the band ID of the nir band, e.g.,7. Note that band ID uses one-based indexing.
    :param redEdge_band_id: the band ID of the redEdge band, e.g.,6. Note that band ID uses one-based indexing.
    :param green_band_id: the band ID of the green band, e.g.,3. Note that band ID uses one-based indexing.
    :return: output raster
    """
    band_id_list = [nir_band_id, redEdge_band_id, green_band_id]
    for band_id in band_id_list:
        if not isinstance(band_id, int) or band_id <= 0:
            raise ValueError("band id should be positive integer value")
    band_ids = str(nir_band_id) + " " + str(redEdge_band_id) + " " + str(green_band_id)
    return BandArithmetic(raster, band_ids, 15)


def SAVI(raster, nir_band_id=4, red_band_id=3, l=0.33):
    """
    Soil-Adjusted Vegetation Index
    SAVI = ((NIR - Red) / (NIR + Red + L)) x (1 + L)
    where L represents amount of green vegetative cover, e.g., 0.5

    :param raster: the input raster / imagery layer
    :param nir_band_id: the band ID of the nir band, e.g.,4. Note that band ID uses one-based indexing.
    :param red_band_id: the band ID of the red band, e.g.,3. Note that band ID uses one-based indexing.
    :param L: the amount of green vegetative cover, e.g., 0.33
    :return: output raster
    """
    band_id_list = [nir_band_id, red_band_id]
    for band_id in band_id_list:
        if not isinstance(band_id, int) or band_id <= 0:
            raise ValueError("band id should be positive integer value")
    band_ids = str(nir_band_id) + " " + str(red_band_id) + " " + str(l)
    return BandArithmetic(raster, band_ids, 2)


def ShadedRelief(raster, azimuth=315, altitude=45, z_factor=1, colormap=None, colorramp="Elevation #1", slope_type="DEGREE",
                 ps_power=0.664, psz_factor=0.024, remove_edge_effect=False):
    """
    Shaded relief is a color 3D model of the terrain, created by merging the images from the Elevation-coded and
    Hillshade methods. For more information, see https://pro.arcgis.com/en/pro-app/help/data/imagery/shaded-relief-function.htm

    The arguments for the shaded_relief function are as follows:
        :param raster: input raster
        :param azimuth (double): default 315
        :param altitude (double): default 45
        :param z_factor (double): default 1
        :param colormap(list or dict): default is None.
                                    Could be a list in the form of
                                        [
                                            [value1, red1, green1, blue1], //[int, int, int, int]
                                           [value2, red2, green2, blue2],
                                           ...
                                        ]
                                    Could be a dict in the form of:
                                        {"values":[value_1, value_2,...], "colors":[color_1, color_2,...], "labels":[label_1, label_2,...]}
                                    here, labels are optional
        :param colorramp(string or dict): default is "Elevation #1".
                                    Could be a string specifying colorramp name like "Black To White", "Yellow To Red", "Slope", or other colorramp names supported in ArcGIS Pro
                                    Could be a dict. For more information about colorramp object, see color ramp object https://developers.arcgis.com/documentation/common-data-types/color-ramp-objects.htm
        :param slope_type(string): one of the following "DEGREE", "PERCENTRISE", or "SCALED". Default is "DEGREE"
        :param ps_power(double): used when slope_type is SCALED. default 0.664
        :param psz_factor(double): used when slope_type is SCALED. default 0.024
        :param remove_edge_effect(boolean): True or False. default False
    :return: the output raster
    """
    slope_types = {
        "degree": 1,
        "percentrise": 2,
        "scaled": 3,
    }

    if slope_type.lower() not in slope_types:
        raise ValueError(
            "Invalid slope_type value. Note that slope_type should be one of 'DEGREE', 'PERCENTRISE', or 'SCALED'")

    template_dict = {
        "rasterFunction": "ShadedRelief",
        "rasterFunctionArguments": {},
        "variableName": "Raster"
    }

    if azimuth is not None:
        template_dict["rasterFunctionArguments"]["Azimuth"] = azimuth
    if altitude is not None:
        template_dict["rasterFunctionArguments"]["Altitude"] = altitude
    if z_factor is not None:
        template_dict["rasterFunctionArguments"]["ZFactor"] = z_factor
    if colormap is not None:
        template_dict["rasterFunctionArguments"]["ColorSchemeType"] = 0
        template_dict["rasterFunctionArguments"]["Colormap"] = colormap
    elif colorramp is not None:
        template_dict["rasterFunctionArguments"]["ColorSchemeType"] = 1
        template_dict["rasterFunctionArguments"]["ColorRamp"] = colorramp
    else:
        raise ValueError("Both colormap and colorramp values are None. Please provide one.")
    if slope_type is not None:
        template_dict["rasterFunctionArguments"]["SlopeType"] = slope_types[slope_type.lower()]
    if slope_type.lower() == "scaled" and ps_power is not None:
        template_dict["rasterFunctionArguments"]["PSPower"] = ps_power
    if slope_type.lower() == "scaled" and psz_factor is not None:
        template_dict["rasterFunctionArguments"]["PSZFactor"] = psz_factor
    if remove_edge_effect is not None:
        template_dict["rasterFunctionArguments"]["RemoveEdgeEffect"] = remove_edge_effect

    return Apply(raster, template_dict['rasterFunction'], template_dict['rasterFunctionArguments'])


def Slope(dem, z_factor=1, slope_type="DEGREE", ps_power=0.664, psz_factor=0.024, remove_edge_effect=False):
    """
    slope represents the rate of change of elevation for each pixel. For more information, see
    https://pro.arcgis.com/en/pro-app/help/data/imagery/slope-function.htm
    The arguments for the slope function are as follows:

    :param dem: input DEM
    :param z_factor: double, default is 1
    :param slope_type: one of the following values: DEGREE, PERCENTRISE, SCALED. default is "DEGREE".
    :param ps_power: double, used together with SCALED slope type, default is 0.664
    :param psz_factor: double, used together with SCALED slope type, default is 0.024
    :param remove_edge_effect: boolean, True or False, default is False
    :return: the output raster

    """

    template_dict = {
        "rasterFunction": "Slope",
        "rasterFunctionArguments": {
        },
        "variableName": "Raster"
    }

    slope_types = {
        "degree": 1,
        "percentrise": 2,
        "scaled": 3,
    }

    if slope_type.lower() not in slope_types:
        raise ValueError(
            "Invalid slope_type value. Note that slope_type should be one of 'DEGREE', 'PERCENTRISE', or 'SCALED'")

    if z_factor is not None:
        template_dict["rasterFunctionArguments"]["ZFactor"] = z_factor
    if slope_type is not None:
        template_dict["rasterFunctionArguments"]["SlopeType"] = slope_types[slope_type.lower()]
    if ps_power is not None:
        template_dict["rasterFunctionArguments"]["PSPower"] = ps_power
    if psz_factor is not None:
        template_dict["rasterFunctionArguments"]["PSZFactor"] = psz_factor
    if remove_edge_effect is not None:
        template_dict["rasterFunctionArguments"]["RemoveEdgeEffect"] = remove_edge_effect
    # if dem is not None:
    #     template_dict["rasterFunctionArguments"]["DEM"] = raster

    return Apply(dem, template_dict['rasterFunction'], template_dict['rasterFunctionArguments'])


def Speckle(raster,
            filter_type="Lee",
            filter_size="3x3",
            noise_model="Multiplicative",
            noise_var=None,
            additive_noise_mean=None,
            multiplicative_noise_mean=1,
            nlooks=1,
            damp_factor=None,
            ):
    """
    The Speckle function filters the speckled radar dataset to smooth out the
    noise while retaining the edges or sharp features in the image. Four speckle
    reduction filtering algorithms are provided through this function. For more
    information including required and optional parameters for each filter and
    the default parameter values, see Speckle function
    https://pro.arcgis.com/en/pro-app/help/data/imagery/speckle-function.htm

    :param raster: input raster type
    :param filter_type: string, one of "Lee", "EnhancedLee", "Frost", "Kaun", "GammaMAP", "RefinedLee". Default is "Lee".
    :param filter_size: string, kernel size. One of "3x3", "5x5", "7x7", "9x9", "11x11". Default is "3x3".
    :param noise_model: string, For Lee filter only. One of "Multiplicative", "Additive", "AdditiveAndMultiplicative"
    :param noise_var: double, for Lee filter with noise_model "Additive" or "AdditiveAndMultiplicative"
    :param additive_noise_mean: double, for Lee filter witth noise_model "AdditiveAndMultiplicative" only
    :param multiplicative_noise_mean: double, For Lee filter with noise_model "Additive" or "AdditiveAndMultiplicative"
    :param nlooks: int, for Lee, EnhancedLee and Kuan Filters
    :param damp_factor: double, for EnhancedLee and Frost filters
    :return: output raster with function applied
    """
    filter_types = {
        "Lee": 0,
        "EnhancedLee": 1,
        "Frost": 2,
        "Kuan": 3,
        "GammaMAP": 4,
        "RefinedLee": 5
    }

    filter_sizes = {
        "3x3": 0,
        "5x5": 1,
        "7x7": 2,
        "9x9": 3,
        "11x11": 4
    }

    noise_models = {
        "Multiplicative": 0,
        "Additive": 1,
        "AdditiveAndMultiplicative": 2
    }

    template_dict = {
        "rasterFunction": "Speckle",
        "rasterFunctionArguments": {
        }
    }

    # value check
    if filter_type not in list(filter_types.keys()):
        raise ValueError(
            "Invalid filter_type value. Note that filter_type should be 'Lee', 'EnhancedLee', 'Frost', 'Kuan', 'GammaMAP' or 'RefinedLee'")
    if filter_size not in list(filter_sizes.keys()):
        raise ValueError(
            "Invalid filter_size value. Note that filter_size should be '3x3', '5x5', '7x7', '9x9' or '11x11'")
    if noise_model not in list(noise_models.keys()):
        raise ValueError(
            "Invalid noise_model value. Note that noise_model should be 'Multiplicative', 'Additive', or 'AdditiveAndMultiplicative'")

    template_dict["rasterFunctionArguments"]['FilterType'] = filter_types[filter_type]
    template_dict["rasterFunctionArguments"]['FilterSize'] = filter_sizes[filter_size]
    template_dict["rasterFunctionArguments"]['NoiseModel'] = noise_models[noise_model]

    if noise_var is not None:
        template_dict["rasterFunctionArguments"]['NoiseVar'] = noise_var
    if additive_noise_mean is not None:
        template_dict["rasterFunctionArguments"]['AdditiveNoiseMean'] = additive_noise_mean
    if multiplicative_noise_mean is not None:
        template_dict["rasterFunctionArguments"]['MultiplicativeNoiseMean'] = multiplicative_noise_mean
    if nlooks is not None:
        template_dict["rasterFunctionArguments"]['NLooks'] = nlooks
    if damp_factor is not None:
        template_dict["rasterFunctionArguments"]['DampFactor'] = damp_factor

    return Apply(raster,
                 raster_function=template_dict['rasterFunction'],
                 raster_function_arguments=template_dict['rasterFunctionArguments'])


def SpectralConversion(raster, conversion_matrix):
    """
    The SpectralConversion function applies a matrix to a multi-band image to
    affect the spectral values of the output. In the matrix, different weights
    can be assigned to all the input bands to calculate each of the output
    bands. The column/row size of the matrix equals to the band count of input
    raster. For more information, see Spectral Conversion function
    https://pro.arcgis.com/en/pro-app/help/data/imagery/spectral-conversion-function.htm

    :param raster: the input raster
    :param conversion_matrix: array of double (A NxN length one-dimension matrix, where N=band count.)
    :return: the output raster with this function applied to it

    Example
    if conversion_matrix = [0.3,0.2,0.5,0,1], then, it means,
        Output band_1 = 0.3 * Input_band_1 + 0.2 * Input_band_2;
        Output band_2 = 0.5 * Input_band_1 + 0.1 * Input_band_2;
    """
    template_dict = {
        "rasterFunction": "SpectralConversion",
        "rasterFunctionArguments": {
            "ConversionMatrix": conversion_matrix
        }
    }

    return Apply(raster, template_dict['rasterFunction'], template_dict['rasterFunctionArguments'])


def SR(raster, nir_band_id=5, red_band_id=4):
    """
    The Simple Ratio (SR) is a common vegetation index for estimating the amount of vegetation.
    It is the ratio of light scattered in the NIR and absorbed in red bands, which reduces the effects
    of atmosphere and topography.

    Values are high for vegetation with a large leaf area index, or high canopy closure,
    and low for soil, water, and nonvegetated features. The range of values is from 0 to about 30,
    where healthy vegetation generally falls between values of 2 to 8.

    SR = NIR / Red

    :param raster: the input raster / imagery layer
    :param nir_band_id: the band ID of the nir band, e.g.,5. Note that band ID uses one-based indexing. .
    :param red_band_id: the band ID of the red band, e.g.,4. Note that band ID uses one-based indexing. .
    :return: Simple Ratio raster
    """
    band_id_list = [nir_band_id, red_band_id]
    for band_id in band_id_list:
        if not isinstance(band_id, int) or band_id <= 0:
            raise ValueError("band id should be positive integer value")
    band_ids = str(nir_band_id) + " " + str(red_band_id)
    return BandArithmetic(raster, band_ids, 11)


def SRre(raster, nir_band_id=7, redEdge_band_id=6):
    """
    The Red-Edge Simple Ratio (SRre) is a vegetation index for estimating the
    amount of healthy and stressed vegetation. It is the ratio of light scattered
    in the NIR and red-edge bands, which reduces the effects of atmosphere and topography.

    Values are high for vegetation with high canopy closure and healthy vegetation,
    lower for high canopy closure and stressed vegetation, and low for soil, water,
    and nonvegetated features. The range of values is from 0 to about 30, where healthy
    vegetation generally falls between values of 1 to 10.

    SRre = NIR / RedEdge

    :param raster: the input raster / imagery layer
    :param nir_band_id: the band ID of the nir band, e.g.,7. Note that band ID uses one-based indexing.
    :param redEdge_band_id: the band ID of the redEdge band, e.g.,6. Note that band ID uses one-based indexing.
    :return: output raster
    """
    band_id_list = [nir_band_id, redEdge_band_id]
    for band_id in band_id_list:
        if not isinstance(band_id, int) or band_id <= 0:
            raise ValueError("band id should be positive integer value")

    band_ids = str(nir_band_id) + " " + str(redEdge_band_id)
    return BandArithmetic(raster, band_ids, 13)


def StatisticsHistogram(raster, statistics=None, histograms=None):
    """"
    The function is used to define the statistics and histogram of a raster.
    It is normally used for control the default display of exported image.
    For more information, see Statistics and Histogram function,
    https://pro.arcgis.com/en/pro-app/help/data/imagery/statistics-and-histogram-function.htm

    :param raster: the input raster / imagery layer
    :param statistics: array of statistics objects. (Predefined statistics for each band)
    :param histograms: array of histogram objects. (Predefined histograms for each band)
    :return: Statistics and Histogram defined raster
    """
    template_dict = {
        "rasterFunction": "StatisticsHistogram",
        "rasterFunctionArguments": {}
    }

    if statistics is not None:
        template_dict["rasterFunctionArguments"]['Statistics'] = statistics
    if histograms is not None:
        template_dict["rasterFunctionArguments"]['Histograms'] = histograms

    return Apply(raster, template_dict['rasterFunction'], template_dict['rasterFunctionArguments'])


def Stretch(raster, stretch_type="None", min=0, max=255, num_stddev=2, statistics=None,
            dra=False, min_percent=0.25, max_percent=0.5, gamma=None, compute_gamma=False, sigmoid_strength_level=2):
    """
    The stretch function enhances an image through multiple stretch types.
    For more information, see https://pro.arcgis.com/en/pro-app/help/data/imagery/stretch-function.htm.
    Gamma stretch works with all stretch types.
    Min and Max can be used to define output minimum and maximum.
    DRA is used to get statistics from the extent in the export_image request.
    ComputeGamma will automatically calculate best gamma value to render exported image based on empirical model.
    Stretch type None does not require other parameters.
    Stretch type StdDev requires NumberOfStandardDeviations, Statistics, or DRA (true).
    Stretch type Histogram (Histogram Equalization) requires the source dataset to have histograms or additional DRA (true).
    Stretch type MinMax requires Statistics or DRA (true).
    Stretch type PercentClip requires MinPercent, MaxPercent, and DRA (true), or histograms from the source dataset.
    Stretch type Sigmoid does not require other parameters.
    Optionally, set the SigmoidStrengthLevel (1 to 6) to adjust the curvature of Sigmoid curve used in color stretch.

    The arguments for the stretch function are as follows:
    :param raster: input raster
    :param stretch_type: str, one of None, StdDev, Histogram, MinMax, PercentClip, Sigmoid
    :param min: double
    :param max: double
    :param num_stddev: double (e.g. 2)
    :param statistics: array of doubles, [[min1, max1, mean1, standardDeviation1], [min2, max2, mean2, standardDeviation2], ...]
    :param dra: True or False. Default is False. Statistics parameter is ignored when DRA is true
    :param min_percent: double (e.g. 0.25), applicable to PercentClip
    :param max_percent: double (e.g. 0.5), applicable to PercentClip
    :param gamma: array of doubles, e.g., [gamma1, gamma2, gamma3], one for each band
    :param compute_gamma: Trur or False. Default is False. applicable to any stretch type
    :param sigmoid_strength_level: int (1~6), applicable to Sigmoid
    :return: the output raster
    """
    str_types = {
        'none': 0,
        'stddev': 3,
        'histogram': 4,
        'minmax': 5,
        'percentclip': 6,
        'sigmoid': 9
    }

    if isinstance(stretch_type, str) and stretch_type.lower() in str_types:
        in_str_type = str_types[stretch_type.lower()]
    else:
        raise ValueError("Invalid stretch_type. stretch type should be one of None, StdDev, Histogram, MinMax, PercentClip")

    template_dict = {
        "rasterFunction": "Stretch",
        "rasterFunctionArguments": {},
    }

    if stretch_type is not None:
        template_dict["rasterFunctionArguments"]["StretchType"] = in_str_type
    if min is not None:
        template_dict["rasterFunctionArguments"]["Min"] = min
    if max is not None:
        template_dict["rasterFunctionArguments"]["Max"] = max
    if num_stddev is not None:
        template_dict["rasterFunctionArguments"]["NumberOfStandardDeviations"] = num_stddev
    if statistics is not None:
        template_dict["rasterFunctionArguments"]["Statistics"] = statistics
    if dra is not None:
        template_dict["rasterFunctionArguments"]["DRA"] = dra
    if min_percent is not None:
        template_dict["rasterFunctionArguments"]["MinPercent"] = min_percent
    if max_percent is not None:
        template_dict["rasterFunctionArguments"]["MaxPercent"] = max_percent
    if gamma is not None:
        template_dict["rasterFunctionArguments"]["Gamma"] = gamma
    if compute_gamma is not None:
        template_dict["rasterFunctionArguments"]["ComputeGamma"] = compute_gamma
    if sigmoid_strength_level is not None:
        template_dict["rasterFunctionArguments"]["SigmoidStrengthLevel"] = sigmoid_strength_level
    if compute_gamma is not None or gamma is not None:
        template_dict["rasterFunctionArguments"]["UseGamma"] = True

    return Apply(raster, template_dict['rasterFunction'], template_dict['rasterFunctionArguments'])


def Sultan(raster, band1_id=1, band3_id=3, band4_id=4, band5_id=5, band6_id=6):
    """
    Sultan's Formula (transform to 3 band 8 bit image)
        Band 1 = (Band5 / Band6) x 100
        Band 2 = (Band5 / Band1) x 100
        Band 3 = (Band3 / Band4) x (Band5 / Band4) x 100

    :param raster: the input raster
    :param band1_id(int): the band ID of band1, e.g., 1. Note that band ID uses one-based indexing.
    :param band3_id(int): the band ID of band3, e.g., 3. Note that band ID uses one-based indexing.
    :param band4_id(int): the band ID of band4, e.g., 4. Note that band ID uses one-based indexing.
    :param band5_id(int): the band ID of band5, e.g., 5. Note that band ID uses one-based indexing.
    :param band6_id(int): the band ID of band6, e.g., 6. Note that band ID uses one-based indexing.
    :return: output raster
    """
    band_id_list = [band1_id, band3_id, band4_id, band5_id, band6_id]
    for band_id in band_id_list:
        if not isinstance(band_id, int) or band_id <= 0:
            raise ValueError("band id should be positive integer value")

    band_ids = str(band1_id) + ' ' + str(band3_id) + ' ' + str(band4_id) + ' ' + str(band5_id) + ' ' + str(band6_id)
    return BandArithmetic(raster, band_ids, 8)


def TasseledCap(raster):
    """"
    The function is designed to analyze and map vegetation and urban development
    changes detected by various satellite sensor systems. It is known as the
    Tasseled Cap transformation due to the shape of the graphical distribution
    of data. This function takes no arguments except a raster. The input for
    this function is the source raster of image service. There are no other
    parameters for this function because all the information is derived from
    the input's properties and key metadata (bands, data type, and sensor name).
    Only imagery from the Landsat MSS, Landsat TM, Landsat ETM+, IKONOS,
    QuickBird, WorldView-2 and RapidEye sensors are supported. Prior to applying
    this function, there should not be any functions that would alter the pixel
    values in the function chain, such as the Stretch, Apparent Reflectance or
    Pansharpening function. The only exception is for Landsat ETM+; when using
    Landsat ETM+, the Apparent Reflectance function must precede the Tasseled
    Cap function. For more information, see
    https://pro.arcgis.com/en/pro-app/help/data/imagery/tasseled-cap-function.htm

    :param raster: the input raster / imagery layer
    :return: the output raster with TasseledCap function applied to it
    """

    template_dict = {
        "rasterFunction": "TasseledCap",
        "rasterFunctionArguments": {}
    }

    return Apply(raster, template_dict['rasterFunction'], template_dict['rasterFunctionArguments'])


def Threshold(raster):
    """
    The binary threshold function produces the binary image. It uses the Otsu method and assumes the input image to have
     a bi-modal histogram. The arguments for the threshold function are as follows:

    :param raster: input raster
    :return: the output raster

    """
    threshold_type = 1

    template_dict = {
        "rasterFunction": "Threshold",
        "rasterFunctionArguments": {
        },
        "variableName": "Raster"
    }

    if threshold_type is not None:
        template_dict["rasterFunctionArguments"]["ThresholdType"] = threshold_type

    return Apply(raster, template_dict['rasterFunction'], template_dict['rasterFunctionArguments'])


def TransposeBits(raster, input_bit_positions=[12, 13], output_bit_positions=[0, 1], constant_fill_value=0,
                  fill_raster=None):
    """
    The transpose_bits function performs a bit operation. It extracts bit values from the source data and assigns them
    to new bits in the output data.The arguments for the transpose_bits function are as follows:

    Either providing a fill_value or a fill_raster to initialize pixel values of the output raster.
    Landsat 8 has a quality assessment band. The following are the example input and output bit positions to extract
    confidence levels by mapping them to 0-3:
    * Landsat 8 Water: {"input_bit_positions":[4,5],"output_bit_positions":[0,1]}
    * Landsat 8 Cloud Shadow: {"input_bit_positions":[6,7],"output_bit_positions":[0,1]}
    * Landsat 8 Vegetation: {"input_bit_positions":[8,9],"output_bit_positions":[0,1]}
    * Landsat 8 Snow/Ice: {"input_bit_positions":[10,11],"output_bit_positions":[0,1]}
    * Landsat 8 Cirrus: {"input_bit_positions":[12,13],"output_bit_positions":[0,1]}
    * Landsat 8 Cloud: {"input_bit_positions":[14,15],"output_bit_positions":[0,1]}
    * Landsat 8 Designated Fill: {"input_bit_positions":[0],"output_bit_positions":[0]}
    * Landsat 8 Dropped Frame: {"input_bit_positions":[1],"output_bit_positions":[0]}
    * Landsat 8 Terrain Occlusion: {"input_bit_positions":[2],"output_bit_positions":[0]}

    :param raster: input raster
    :param input_bit_positions: array of long, required
    :param output_bit_positions: array of long, required
    :param constant_fill_value: int, required
    :param fill_raster: optional, the fill raster
    :return: the output raster

    """

    template_dict = {
        "rasterFunction": "TransposeBits",
        "rasterFunctionArguments": {},
    }

    template_dict["rasterFunctionArguments"]["InputBitPositions"] = input_bit_positions
    template_dict["rasterFunctionArguments"]["OutputBitPositions"] = output_bit_positions

    if fill_raster is not None:
        template_dict["rasterFunctionArguments"]["FillRaster"] = fill_raster
        template_dict["rasterFunctionArguments"]["ConstantFillCheck"] = False
    else:
        if not isinstance(constant_fill_value, int):
            raise TypeError("constant_fill_value must be an integer")
        template_dict["rasterFunctionArguments"]["ConstantFillValue"] = constant_fill_value
    return Apply(raster, template_dict['rasterFunction'], template_dict['rasterFunctionArguments'])


def TSAVI(raster, nir_band_id=4, red_band_id=3, s=0.33, a=0.5, X=1.5):
    """
    Transformed Soil Adjusted Vegetation Index
    TSAVI = (s(NIR-s*Red-a))/(a*NIR+Red-a*s+X*(1+s^2))

    :param raster: the input raster / imagery layer
    :param nir_band_id: the band ID of the nir band, e.g.,4. Note that band ID uses one-based indexing.
    :param red_band_id: the band ID of the red band, e.g.,3. Note that band ID uses one-based indexing.
    :param s: the soil line slope, e.g.,0.33
    :param a: the soil line intercept, e.g.,0.5
    :param X: an adjustment factor that is set to minimize soil noise, e.g.,1.5
    :return: output raster
    """
    band_id_list = [nir_band_id, red_band_id]
    for band_id in band_id_list:
        if not isinstance(band_id, int) or band_id <= 0:
            raise ValueError("band id should be positive integer value")
    band_ids = str(nir_band_id) + ' ' + str(red_band_id) + ' ' + str(s) + ' ' + str(a) + ' ' + str(X)
    return BandArithmetic(raster, band_ids, 3)


def UnitConversion(raster, from_unit=None, to_unit=None):
    """
    The unit_conversion function performs unit conversions.The arguments for the unit_conversion function are as follows:
    from_unit and to_unit take the following str values:
    Speed Units: MetersPerSecond, KilometersPerHour, Knots, FeetPerSecond, MilesPerHour
    Temperature Units: Celsius,Fahrenheit,Kelvin
    Distance Units: str, one of Inches, Feet, Yards, Miles, NauticalMiles, Millimeters, Centimeters, Meters

    :param raster: input raster
    :param from_unit(string): value could be one of [MetersPerSecond, KilometersPerHour, Knots, FeetPerSecond, MilesPerHour,Celsius,Fahrenheit,Kelvin, Inches, Feet, Yards, Miles, NauticalMiles, Millimeters, Centimeters, Meters]
    :param to_unit(string): value could be one of [MetersPerSecond, KilometersPerHour, Knots, FeetPerSecond, MilesPerHour,Celsius,Fahrenheit,Kelvin, Inches, Feet, Yards, Miles, NauticalMiles, Millimeters, Centimeters, Meters]
    :return: the output raster

    """
    unit_types = {
        'inches': 1,
        'feet': 3,
        'yards': 4,
        'miles': 5,
        'nauticalmiles': 6,
        'millimeters': 7,
        'centimeters': 8,
        'meters': 9,
        'celsius': 200,
        'fahrenheit': 201,
        'kelvin': 202,
        'meterspersecond': 100,
        'kilometersperhour': 101,
        'knots': 102,
        'feetpersecond': 103,
        'milesperhour': 104
    }

    if isinstance(from_unit, str) and from_unit.lower() in list(unit_types.keys()):
        from_unit = unit_types[from_unit.lower()]
    else:
        raise ValueError("Invalid from_unit value")

    if isinstance(to_unit, str) and to_unit.lower() in list(unit_types.keys()):
        to_unit = unit_types[to_unit.lower()]
    else:
        raise ValueError("Invalid to_unit value")

    template_dict = {
        "rasterFunction": "UnitConversion",
        "rasterFunctionArguments": {}
    }

    if from_unit is not None:
        template_dict["rasterFunctionArguments"]["FromUnit"] = from_unit
    if to_unit is not None:
        template_dict["rasterFunctionArguments"]["ToUnit"] = to_unit

    return Apply(raster, template_dict['rasterFunction'], template_dict['rasterFunctionArguments'])


def VARI(raster, red_band_id=3, green_band_id=2, blue_band_id=1):
    """
    Visible Atmospherically Resistant Index

    VARI = (Green - Red)/(Green + Red - Blue)

    :param raster: the input raster / imagery layer
    :param red_band_id:  the band ID of the red band, e.g.,3. Note that band ID uses one-based indexing.
    :param green_band_id: the band ID of the green band, e.g.,2. Note that band ID uses one-based indexing.
    :param blue_band_id: the band ID of the blue band, e.g.,1. Note that band ID uses one-based indexing.
    :return: output raster
    """
    band_id_list = [red_band_id, green_band_id, blue_band_id]
    for band_id in band_id_list:
        if not isinstance(band_id, int) or band_id <= 0:
            raise ValueError("band id should be positive integer value")

    band_ids = str(red_band_id) + ' ' + str(green_band_id) + ' ' + str(blue_band_id)
    return BandArithmetic(raster, band_ids, 9)


def VectorField(raster_u_mag, raster_v_dir, input_data_type='Vector-UV', angle_reference_system='Geographic',
                output_data_type='Vector-UV'):
    """
    The VectorField function is used to composite two single-band rasters (each raster represents U/V or Magnitude/Direction)
    into a two-band raster (each band represents U/V or Magnitude/Direction). Data combination type (U-V or Magnitude-Direction)
    can also be converted interchangeably with this function.
    For more information, see https://pro.arcgis.com/en/pro-app/help/data/imagery/vector-field-function.htm

    :param raster_u_mag: raster item representing 'U' or 'Magnitude' - imagery layers filtered by where clause, spatial and temporal filters
    :param raster_v_dir: raster item representing 'V' or 'Direction' - imagery layers filtered by where clause, spatial and temporal filters
    :param input_data_type: string, 'Vector-UV' or 'Vector-MagDir' per input used in 'raster_u_mag' and 'raster_v_dir'
    :param angle_reference_system: string, optional when 'input_data_type' is 'Vector-UV', one of "Geographic", "Arithmetic"
    :param output_data_type: string, 'Vector-UV' or 'Vector-MagDir'
    :return: the output raster with this function applied to it
    """
    angle_reference_system_types = {
        "Geographic": 0,
        "Arithmetic": 1
    }
    # value check
    if angle_reference_system not in list(angle_reference_system_types.keys()):
        raise ValueError(
            "Invalid angle_reference_system value. Note that angle_reference_system should be either 'Geographic' or 'Arithmetic'")
    in_angle_reference_system = angle_reference_system_types[angle_reference_system]

    if input_data_type not in ["Vector-UV", "Vector-MagDir"]:
        raise ValueError(
            "Invalid input_data_type value. Note that input_data_type should be either 'Vector-UV' or 'Vector-MagDir'.")
    if output_data_type not in ["Vector-UV", "Vector-MagDir"]:
        raise ValueError(
            "Invalid output_data_type value. Note that output_data_type should be either 'Vector-UV' or 'Vector-MagDir'.")

    template_dict = {
        "rasterFunction": "VectorField",
        "rasterFunctionArguments": {}
    }

    template_dict["rasterFunctionArguments"]["AngleReferenceSystem"] = in_angle_reference_system
    template_dict["rasterFunctionArguments"]['InputDataType'] = input_data_type
    template_dict["rasterFunctionArguments"]['OutputDataType'] = output_data_type

    return Apply(in_raster=(raster_u_mag, raster_v_dir),
                 raster_function=template_dict['rasterFunction'],
                 raster_function_arguments=template_dict['rasterFunctionArguments'])


def VectorFieldRenderer(raster, is_uv_components=None, reference_system='Geographic',
                        mass_flow_angle_representation='From',
                        calculation_method="Vector Average", symbology_name="Single Arrow"):
    """
    The vector_field_renderer function symbolizes a U-V or Magnitude-Direction raster.The arguments for the vector_field_renderer function are as follows:

    :param raster: input raster
    :param is_uv_components: bool
    :param reference_system: int 1=Arithmetic, 2=Geographic
    :param mass_flow_angle_representation: int 0=from 1=to
    :param calculation_method: string, one of "Vector Average", 'Nearest neighbor', 'Bilinear', 'Cubic', 'Minimum', 'Maximum
    :param symbology_name: string, one of "Single Arrow" , "Wind Barb", "Ocean Current"
    :return: the output raster

    """
    mass_flow_angle_representations = {"from": 0, "to": 1}
    reference_systems = {"Arithmetic": 2, "Geographic": 1}

    if reference_system not in list(reference_systems.keys()):
        raise ValueError(
            "Invalid reference_system. Note that reference_system should be either 'Geographic' or 'Arithmetic'")
    if mass_flow_angle_representation not in list(mass_flow_angle_representations.keys()):
        raise ValueError(
            "Invalid mass_flow_angle_representation. Note that reference_system should be either'from' or 'to'")

    template_dict = {
        "rasterFunction": "VectorFieldRenderer",
        "rasterFunctionArguments": {}
    }

    if is_uv_components is not None:
        template_dict["rasterFunctionArguments"]["IsUVComponents"] = is_uv_components
    if reference_system is not None:
        template_dict["rasterFunctionArguments"]["ReferenceSystem"] = reference_systems[reference_system]
    if mass_flow_angle_representation is not None:
        template_dict["rasterFunctionArguments"]["MassFlowAngleRepresentation"] = \
            mass_flow_angle_representations[mass_flow_angle_representation]
    if calculation_method is not None:
        template_dict["rasterFunctionArguments"]["CalculationMethod"] = calculation_method
    if symbology_name is not None:
        template_dict["rasterFunctionArguments"]["SymbologyName"] = symbology_name

    return Apply(raster, template_dict['rasterFunction'], template_dict['rasterFunctionArguments'])


def AspectSlope(raster, z_factor=1):
    """
    Creates a raster layer that simultaneously displays the aspect and slope of a surface.
    :param raster: input raster
    :param z_factor: A multiplication factor that converts the vertical (elevation) values to the linear units of the horizontal (x,y) coordinate system. "Use larger values to add vertical exaggeration.
    :return: the output raster
    """
    template_dict = {
        "rasterFunction": "AspectSlope",
        "rasterFunctionArguments": {}
    }

    template_dict['rasterFunctionArguments']['zf'] = z_factor
    template_dict['rasterFunctionArguments']['ClassName'] = "AspectSlope"

    return Apply(raster, template_dict['rasterFunction'], template_dict['rasterFunctionArguments'])


def HeatIndex(temperature_raster, relative_humidity_raster, temperature_unit="Fahrenheit",
              heat_index_unit="Fahrenheit"):
    """
    Calculates apparent temperature based on ambient temperature and relative humidity. The apparent temperature is often described as how hot it feels to the human body.
    :param temperature_raster: the raster that represent temperature
    :param relative_humidity_raster: the raster that represent relative humidity
    :param temperature_unit: Available input units are Celsius,Fahrenheit or Kelvin
    :param heat_index_unit: Available input units are Celsius,Fahrenheit or Kelvin
    :return: the output raster
    """
    template_dict = {
        "rasterFunction": "HeatIndex",
        "rasterFunctionArguments": {}
    }
    if temperature_unit is not None:
        template_dict["rasterFunctionArguments"]["units"] = temperature_unit
    if heat_index_unit is not None:
        template_dict["rasterFunctionArguments"]["outUnits"] = heat_index_unit
    template_dict["rasterFunctionArguments"]["MatchVariable"] = False

    return Apply({"temperature": temperature_raster, "rh": relative_humidity_raster}, template_dict['rasterFunction'],
                 template_dict['rasterFunctionArguments'])


def WindChill(temperature_raster, wind_speed_raster, temperature_units="Fahrenheit", wind_speed_units="mph",
              wind_chill_units="Fahrenheit"):
    """
    The Wind Chill function is useful for identifying dangerous winter conditions that, depending on exposure times to
    the elements, can result in frostbite or even hypothermia. Wind chill is a way to measure how cold an individual
    feels when wind is taken into account with already cold temperatures. The faster the wind speed, the more quickly the body will lose heat and the colder they will feel.

    :param temperature_raster:A single-band raster where pixel values represent ambient air temperature.
    :param wind_speed_raster:A single-band raster where pixel values represent wind speed.
    :param temperature_units:The unit of measurement associated with the input temperature raster. Available input units are Celsius, Fahrenheit, and Kelvin.
    :param wind_speed_units: Defines the unit of measurement for the wind-speed raster. Available input units are mph, km/h, ft/s and kn. Each represents

                        Miles Per Hour (mph)
                        Kilometers Per Hour (km/h)
                        Meters Per Second (m/s)
                        Feet Per Second (ft/s)
                        Knots (kn)
    :param wind_chill_units:The unit of measurement associated with the output raster. Available output units are Celsius, Fahrenheit, and Kelvin.
    :return: the output raster
    """
    template_dict = {
        "rasterFunction": "Windchill",
        "rasterFunctionArguments": {}
    }

    if temperature_units is not None:
        template_dict["rasterFunctionArguments"]["tunits"] = temperature_units
    if wind_speed_units is not None:
        template_dict["rasterFunctionArguments"]["wunits"] = wind_speed_units
    if wind_chill_units is not None:
        template_dict["rasterFunctionArguments"]["ounits"] = wind_chill_units
    template_dict["rasterFunctionArguments"]["MatchVariable"] = False
    return Apply({"temperature": temperature_raster, "ws": wind_speed_raster}, template_dict['rasterFunction'],
                 template_dict['rasterFunctionArguments'])


def Contour(raster, adaptive_smoothing=2.5, contour_type="contour lines", z_base=0, number_of_contours=0,
            contour_interval=100, nth_contour_line_in_bold=5, z_factor=1):
    """
    Creates contour lines.

    :param raster: the raster from which the contour is created
    :param adaptive_smoothing(double): adaptive smooting value, e.g., 2.5
    :param contour_type(string): contour type. Available values could be "contour lines", "contour fill" or "smooth surface only"
    :param z_base(double): the z-base value, e.g., 0
    :param number_of_contours(int): the number of contours, e.g., 0
    :param contour_interval(double): the contour interval, e.g., 100
    :param nth_contour_line_in_bold(int): the nth contour line that would be rendered in bold, e.g., 5
    :param z_factor(double): the z-factor, e.g., 1
    :return:
    """
    template_dict = {
        "rasterFunction": "Contour",
        "rasterFunctionArguments": {}
    }

    contour_types = {
        'contour lines': 0,
        'contour fill': 1,
        'smooth surface only': 2,
    }

    if adaptive_smoothing is not None:
        template_dict['rasterFunctionArguments']['SigmaGaussian'] = adaptive_smoothing
    if contour_type is not None:
        template_dict['rasterFunctionArguments']['ContourType'] = contour_types[contour_type.lower()]
    if z_base is not None:
        template_dict['rasterFunctionArguments']['ZBase'] = z_base
    if number_of_contours is not None:
        template_dict['rasterFunctionArguments']['NumberOfContours'] = number_of_contours
    if contour_interval is not None:
        template_dict['rasterFunctionArguments']['ContourInterval'] = contour_interval
    if nth_contour_line_in_bold is not None:
        template_dict['rasterFunctionArguments']['NthContourLineInBold'] = nth_contour_line_in_bold
    if z_factor is not None:
        template_dict['rasterFunctionArguments']['ZFactor'] = z_factor

    return Apply(raster, template_dict['rasterFunction'], template_dict['rasterFunctionArguments'])

def PredictUsingTrend(raster, dimension_definition_type="BY_VALUE", dimension_values=None, start=None, end=None, interval_value=1, interval_unit='HOURS'):

    """
    Computes a forecasted multidimensional raster layer using the output trend raster from the generate_trend function.

    PredictUsingTrend performs on the fly processing and does not generate temporary output dataset.

    :param raster: The input raster.
    :param dimension_definition_type: Optional String. Specifies the method used to provide prediction dimension values.

                                      - BY_VALUE : The prediction will be calculated for a single dimension value.
                                                       For example, you want to predict yearly precipitation for the years
                                                       2050, 2100, and 2150. This is the default.
                                      - BY_INTERVAL : The prediction will be calculated for an interval of the
                                                          dimension defined by a start and an end value. For example,
                                                          you want to predict yearly precipitation for every year
                                                          between 2050 and 2150.

    :param dimension_values: Optional List. The dimension value or values to be used in the prediction. The format of the time,
                             depth, and height values must match the format of the dimension values used to
                             generate the trend raster. If the trend raster was generated for the StdTime dimension,
                             the format should be YYYY-MM-DDTHH:MM:SS,
                             for example, 2050-01-01T00:00:00.

    :param start: Optional String or Integer. The start date, height, or depth of the dimension interval to be used in the prediction.
                            This parameter is required when the dimension_definition_type parameter is set to 1 (By Interval).

    :param end: Optional String or Integer. The end date, height, or depth of the dimension interval to be used in the prediction.
                          This parameter is required when the dimension_definition_type parameter is set to 1 (By Interval).
    :param interval_value: Optional Integer. The number of steps between two dimension values to be included in the prediction. The default value is 1.
                                This parameter is required when the dimension_definition_type parameter is set to 1 (By Interval).
    :param interval_unit: Optional String. The unit that will be used for the value interval. This parameter only applies when the dimension of analysis is a time dimension.

                            - HOURS - The prediction will be calculated for each hour in the range of time described by the start, end, and interval_value parameters.

                            - DAYS - The prediction will be calculated for each day in the range of time described by the start, end, and interval_value parameters.

                            - WEEKS - The prediction will be calculated for each week in the range of time described by the start, end, and interval_value parameters.

                            - MONTHS - The prediction will be calculated for each month in the range of time described by the start, end, and interval_value parameters.

                            - YEARS - The prediction will be calculated for each year in the range of time described by the start, end, and interval_value parameters.

    :return: output raster
    """

    template_dict = {
        "rasterFunction" : "Trend",
        "rasterFunctionArguments": {}
    }

    dimension_definition_type_dict = {"BY_VALUE":0, "BY_INTERVAL":1}
    if dimension_definition_type is not None:
        if isinstance(dimension_definition_type, str):
            dimension_definition_type= dimension_definition_type_dict[dimension_definition_type.upper()]
            template_dict["rasterFunctionArguments"]['DimensionDefinitionType'] = dimension_definition_type
        else:
            template_dict["rasterFunctionArguments"]['DimensionDefinitionType'] = dimension_definition_type


    if dimension_values is not None:
        if isinstance(dimension_values, list):
            values = ";".join(str(ele) for ele in dimension_values)
            template_dict["rasterFunctionArguments"]['DimensionValues'] = values
        else:
            template_dict["rasterFunctionArguments"]['DimensionValues'] = dimension_values

    if start is not None:
        template_dict["rasterFunctionArguments"]['DimensionStart'] = start

    if end is not None:
        template_dict["rasterFunctionArguments"]['DimensionEnd'] = end

    if interval_value is not None:
        template_dict["rasterFunctionArguments"]['DimensionInterval'] = interval_value

    if interval_unit is not None:
        template_dict["rasterFunctionArguments"]['DimensionUnit'] = interval_unit

    return Apply(raster, template_dict['rasterFunction'], template_dict['rasterFunctionArguments'])

def GenerateTrend(raster, dimension_name, regression_type="LINEAR", cycle_length = 1, cycle_unit = "YEARS",
                  harmonic_frequency=1, polynomial_order=2, ignore_nodata=True, rmse=True, r2=False, slope_p_value=False, seasonal_period="DAYS"):

    """
    Estimates the trend for each pixel along a dimension for one or more variables in a multidimensional raster.

    GenerateTrend performs on the fly processing and does not generate temporary output dataset.

    :param raster: The input multidimensional raster.
    :param dimension_name: Required String. The dimension along which a trend will be extracted for the
                           variable or variables selected in the analysis.
    :param regression_type: Optional String. Specifies the type of line to be used to fit to the pixel values along a dimension.

                            - LINEAR : Fits the pixel values for a variable along a linear trend line. This is the default.
                            - HARMONIC : Fits the pixel values for a variable along a harmonic trend line.
                            - POLYNOMIAL : Fits the pixel values for a variable along a second-order polynomial trend line.
                            - MANN-KENDALL : Variable pixel values will be evaluated using the Mann-Kendall trend test.
                            - SEASONAL-KENDALL : Variable pixel values will be evaluated using the Seasonal-Kendall trend test.

    :param cycle_length: Optional Integer. The length of periodic variation to model. This parameter is required when Trend Line Type is
                         set to Harmonic. For example, leaf greenness often has one strong cycle of variation in a single year, so the
                         cycle length is 1 year. Hourly temperature data has one strong cycle of variation throughout a single day,
                         so the cycle length is 1 day. Default is 1.
    :param cycle_unit: Optional String. Specifies the time unit to be used for the length of harmonic cycle. Options: "DAYS", "YEARS" (This is the default).

    :param harmonic_frequency: Optional Integer. The frequency number to use in the trend fitting. This parameter specifies the
                               frequency of cycles in a year. The default value is 1, or one harmonic cycle per year.
                               This parameter is only included in the trend analysis for a harmonic regression (regression_type=1).
    :param polynomial_order: Optional Integer. The polynomial order number to use in the trend fitting. This parameter specifies the
                             polynomial order. The default value is 2, or second-order polynomial. This parameter
                             is only included in the trend analysis for a polynomial regression (regression_type=2).
    :param ignore_nodata: Optional Boolean. Specifies whether NoData values are ignored in the analysis.

                          - True : The analysis will include all valid pixels along a given dimension and ignore any NoData pixels. This is the default.
                          - False : The analysis will result in NoData if there are any NoData values for the pixels along the given dimension.

    :param rmse: Optional Boolean. Specifies whether to generate the root mean square error (RMSE) of the trend fit line.

                 - True : The RMSE will be calculated and displayed when the tool is finished running. This is the default.
                 - False : The RMSE will not be calculated.

    :param r2: Optional Boolean. Specifies whether to calculate the R-squared goodness-of-fit statistic for the trend fit line.

               - True : The R-squared will be calculated and displayed when the tool is finished running.
               - False : The R-squared will not be calculated. This is the default.

    :param slope_p_value: Optional Boolean. Specifies whether to calculate the p-value statistic for the slope coefficient of the trend line.

                          - True : The p-value will be calculated and displayed when the tool is finished running.
                          - False : The p-value will not be calculated. This is the default.

    :param seasonal_period: Optional String. Specifies the seasonal period. Default - "DAYS"
                            Possible Options - "DAYS", "MONTHS"

    :return: output raster
    """
    template_dict = {
        "rasterFunction" : "TrendAnalysis",
        "rasterFunctionArguments": {}
    }

    if dimension_name is not None:
        template_dict["rasterFunctionArguments"]['DimensionName'] = dimension_name

    regression_type_dict = {"LINEAR":0, "HARMONIC":1, "POLYNOMIAL":2, "MANN-KENDALL":3, "SEASONAL-KENDALL":4}
    if regression_type is not None and regression_type!="":
        if isinstance(regression_type, str):
            regression_type= regression_type_dict[regression_type.upper()]
            template_dict["rasterFunctionArguments"]['RegressionType'] = regression_type
        else:
            template_dict["rasterFunctionArguments"]['RegressionType'] = regression_type
    else:
        template_dict["rasterFunctionArguments"]['RegressionType'] = "LINEAR"

    if cycle_length is not None and cycle_length!="":
        template_dict["rasterFunctionArguments"]['CycleLength'] = cycle_length
    else:
        template_dict["rasterFunctionArguments"]['CycleLength'] = 1

    if cycle_unit is not None and cycle_unit!="":
        template_dict["rasterFunctionArguments"]['CycleUnit'] = cycle_unit
    else:
        template_dict["rasterFunctionArguments"]['CycleUnit'] = "YEARS"

    if harmonic_frequency is not None and harmonic_frequency!="":
        template_dict["rasterFunctionArguments"]['Frequency'] = harmonic_frequency
    else:
        template_dict["rasterFunctionArguments"]['Frequency'] = 1

    if polynomial_order is not None and polynomial_order!="":
        template_dict["rasterFunctionArguments"]['Order'] = polynomial_order
    else:
        template_dict["rasterFunctionArguments"]['Order'] = 2

    if ignore_nodata is not None and ignore_nodata!="":
        template_dict["rasterFunctionArguments"]['IgnoreNoData'] = ignore_nodata
    else:
        template_dict["rasterFunctionArguments"]['IgnoreNoData'] = True

    if rmse is not None and rmse!="":
        template_dict["rasterFunctionArguments"]['RMSE'] = rmse
    else:
        template_dict["rasterFunctionArguments"]['RMSE'] = True

    if r2 is not None and r2 !="":
        template_dict["rasterFunctionArguments"]['R2'] = r2
    else:
        template_dict["rasterFunctionArguments"]['R2'] = False

    if slope_p_value is not None and slope_p_value !="":
        template_dict["rasterFunctionArguments"]['SlopePValue'] = slope_p_value
    else:
        template_dict["rasterFunctionArguments"]['SlopePValue'] = False

    if seasonal_period is not None and seasonal_period!="":
        seasonal_period_allowed_values = ["DAYS", "MONTHS"]
        if [element.lower() for element in seasonal_period_allowed_values].count(seasonal_period.lower()) <= 0 :
            raise ValueError('seasonal_period can only be one of the following:  '+str(seasonal_period_allowed_values))
        for element in seasonal_period_allowed_values:
            if seasonal_period.lower() == element.lower():
                seasonal_period = element
        template_dict["rasterFunctionArguments"]['SeasonalPeriod'] = seasonal_period
    else:
        template_dict["rasterFunctionArguments"]['SeasonalPeriod'] = "DAYS"

    return Apply(raster, template_dict['rasterFunction'], template_dict['rasterFunctionArguments'])

def TrendToRGB(raster, model_type="LINEAR"):

    """
    Display the generate trend raster.
    :param raster: The input raster.
    :param model_type: Optional String. Specifies the model type.
                       - "LINEAR", "HARMONIC"

    :return: output raster
    """
    template_dict = {
        "rasterFunction" : "TrendToRGB",
        "rasterFunctionArguments": {
            "Raster" : raster,
        },
        "variableName": "Raster"
    }


    if model_type is not None:
        model_types = {
            'linear': 0,
            'harmonic': 1
        }

        if isinstance(model_type, str):
            in_model_type = model_types[model_type.lower()]
        else:
            in_model_type = model_type

        template_dict["rasterFunctionArguments"]['ModelType'] = in_model_type

    return Apply(raster, template_dict['rasterFunction'], template_dict['rasterFunctionArguments'])

def Classify(raster1, raster2=None, classifier_definition=None):
    """
    classifies a segmented raster to a categorical raster.

    Classify performs on the fly processing and does not generate temporary output dataset.

    :param raster1: the first raster - imagery layers filtered by where clause, spatial and temporal filters
    :param raster2: Optional segmentation raster -  If provided, pixels in each segment will get same class assignments.
                    imagery layers filtered by where clause, spatial and temporal filters
    :param classifier_definition: the classifier parameters as a Python dictionary / json format

    :return: the output raster with this function applied to it
    """

    template_dict = {
        "rasterFunction": "Classify",
        "rasterFunctionArguments": {}
    }
    if classifier_definition is None:
        raise ValueError("classifier_definition cannot be empty")
    template_dict["rasterFunctionArguments"]["ClassifierDefinition"] = classifier_definition

    if raster2 is not None:
        template_dict["rasterFunctionArguments"]["Raster2"] = raster_2

    return Apply(raster1, template_dict['rasterFunction'], template_dict['rasterFunctionArguments'])


def SegMeanShift(raster, spectral_detail=None, spatial_detail=None, spectral_radius=None, spatial_radius=None,
                     min_num_pixels_per_segment=None):
    """
    The SegMeanShift function produces a segmented output. Pixel values in the output image represent the
    converged RGB colors of the segment. The input raster needs to be a 3-band 8-bit image. If the raster is not
    a 3-band 8-bit unsigned image, you can use the Stretch function before the SegMeanShift function.

    When specifying arguments for SegMeanShift, use either spectral_detail, spatial_detail as a pair, or use
    spectral_radius, spatial_radius. They have an inverse relationship. spectral_radius = 22 - spectral_detail,
    spatial_radius = 22 - spatial_detail.

    SegMeanShift performs on the fly processing and does not generate temporary output dataset.

    The arguments for the SegMeanShift function are as follows:

    :param raster: input raster
    :param spectral_detail: double 0-21. Bigger value is faster and has more segments.
    :param spatial_detail: int 0-21. Bigger value is faster and has more segments.
    :param spectral_radius: double. Bigger value is slower and has less segments.
    :param spatial_radius: int. Bigger value is slower and has less segments.
    :param min_num_pixels_per_segment: int
    :param astype: output pixel type
    :return: the output raster

    """
    template_dict = {
        "rasterFunction": "SegmentMeanShift",
        "rasterFunctionArguments": {},
        "variableName": "Raster"
    }

    if spectral_detail is not None:
        template_dict["rasterFunctionArguments"]["SpectralDetail"] = spectral_detail
    if spatial_detail is not None:
        template_dict["rasterFunctionArguments"]["SpatialDetail"] = spatial_detail
    if spectral_radius is not None:
        template_dict["rasterFunctionArguments"]["SpectralRadius"] = spectral_radius
    if spatial_radius is not None:
        template_dict["rasterFunctionArguments"]["SpatialRadius"] = spatial_radius
    if min_num_pixels_per_segment is not None:
        template_dict["rasterFunctionArguments"]["MinNumPixelsPerSegment"] = min_num_pixels_per_segment

    return Apply(raster, template_dict['rasterFunction'], template_dict['rasterFunctionArguments'])

def S1RadiometricCalibration(raster, calibration_type=None):

    """
    Performs different types of radiometric calibration on Sentinel-1 data.

    :param raster: The input raster.
                   The Sentinel-1 Level-1 GRD or SLC input raster you want to process.

                   The function will use the LUT file either to apply the thermal correction or to
                   remove the correction, depending on the contents of the LUT.
    :param calibration_type: Optional string or int. one of four calibration types:
                             "beta_nought" (0) - produces an output containing the radar brightness coefficient.
                             "sigma_nought" (1) - the backscatter returned to the antenna from a unit area on the ground, related to ground range.
                             "gamma" (2) - measurement of emitted and returned energy useful for determining antenna patterns.
                              None - Specify None to not apply a correction. This is the default.

    :return: output raster
    """
    template_dict = {
        "rasterFunction" : "S1RadiometricCalibration",
        "rasterFunctionArguments": {}
    }

    calibration_type_dict = {"beta_nought":0, "sigma_nought":1, "gamma":2}
    if calibration_type is not None:
        if isinstance(calibration_type, str):
            calibration_type= calibration_type_dict[calibration_type.upper()]
            template_dict["rasterFunctionArguments"]['CalibrationType'] = calibration_type
        else:
            template_dict["rasterFunctionArguments"]['CalibrationType'] = calibration_type
    else:
        template_dict["rasterFunctionArguments"]['CalibrationType'] = 3

    return Apply(raster, template_dict['rasterFunction'], template_dict['rasterFunctionArguments'])


def S1ThermalNoiseRemoval(raster, calibration_type=None):

    """
    Removes thermal noise from Sentinel-1 data.

    :param raster: The input raster.
                   The Sentinel-1 Level-1 GRD or SLC input raster you want to process.

                   The function will use the LUT file either to apply the thermal correction or to
                   remove the correction, depending on the contents of the LUT.

    :return: output raster
    """

    template_dict = {
        "rasterFunction" : "S1ThermalNoiseRemoval",
        "rasterFunctionArguments": {}
    }

    return Apply(raster, template_dict['rasterFunction'], template_dict['rasterFunctionArguments'])

def RadarCalibration(raster, calibration_type=None):

    """
    The Radar Calibration function is used to calibrate RADARSAT-2 imagery in a
    mosaic dataset or as a raster product. Calibration is performed on radar
    imagery so that the pixel values are a true representation of the radar backscatter.

    :param raster: The input raster.

    :param calibration_type: Optional string or int. one of four calibration types:
                             "beta_nought" (0) - The function returns the radar reflectivity per unit area in slant range.
                             "sigma_nought" (1) - The function returns the radar reflectivity per unit area in ground range.
                                                  Results are 32-bit floating-point values commonly in the range of 0.0 to
                                                  1.0. No data clipping is performed if this option is selected.
                             "gamma" (2) - The function returns the radar reflectivity per unit area in the
                                           plane perpendicular to the direction of measurement.
                              None - Specify None to not apply any calibration. This is the default.

    :return: output raster
    """
    template_dict = {
        "rasterFunction" : "RadarCalibration",
        "rasterFunctionArguments": {
            "Raster" : raster,
        }
    }

    calibration_type_dict = {"beta_nought":0, "sigma_nought":1, "gamma":2}
    if calibration_type is not None:
        if isinstance(calibration_type, str):
            calibration_type= calibration_type_dict[calibration_type.upper()]
            template_dict["rasterFunctionArguments"]['CalibrationType'] = calibration_type
        else:
            template_dict["rasterFunctionArguments"]['CalibrationType'] = calibration_type
    else:
        template_dict["rasterFunctionArguments"]['CalibrationType'] = 3

    return Apply(raster, template_dict['rasterFunction'], template_dict['rasterFunctionArguments'])

def ApparentReflectance(raster, radiance_gain_values = None, radiance_bias_values=None,
                         reflectance_gain_values=None, reflectance_bias_values=None,
                         sun_elevation=None, albedo=False, scale_factor=None, offset=None):

    """
    Function calibrates the digital number (DN) values of imagery from some satellite
    sensors. The calibration uses sun elevation, acquisition date, sensor gain and
    bias for each band to derive Top of Atmosphere reflectance, plus sun angle correction.

    :param raster: Required raster
    :param radiance_gain_values: Optional list. The radiance gain values
    :param radiance_bias_values: Optional list. The radiance bias values
    :param reflectance_gain_values: Optional list. The reflectance gain values
    :param reflectance_bias_values: Optional list. The reflectance bias values
    :param sun_elevation: This is sun elevation value, expressed in degrees.
    :param albedo: Optional bool The results of the Apparent Reflectance function can also
                   be expressed as albedo, which is the percentage of the available
                   energy reflected by the planetary surface. Albedo data is used
                   by scientific users for complex modeling and technical
                   remote-sensing applications.

                   False - The function returns apparent reflectance values.
                           This is the default.
                   True - The function returns 32-bit floating-point values,
                          which most commonly are in the range of 0.0 to 1.0.
                          No data clipping is performed if this option is selected.
    :param scale_factor: Optional int. Your apparent reflectance output value can be expressed
                     as an integer. The scaling factor is multiplied by the albedo to
                     convert all floating-point values into integer values.

                     If the scale factor is either 0 or not specified, default scaling
                     will be applied depending on the pixel type of the input data:

                     For 16-bit unsigned data types, the default scale factor is 50,000.

                     or 8-bit unsigned data types, default scale factor is 255.

                     The scaling factor is always applied when the output is apparent reflectance.
                     No scaling is applied when the output is albedo.
    :param offset: Optional int. Your scaled albedo value can optionally have an offset value:
                    For 16-bit unsigned data types, the default scale offset is 5,000.

                    For 8-bit unsigned data types, the default scale offset is 0.
                    No scaling is applied when the output is albedo.

    :return: Imagery layer

    """

    template_dict = {
        "rasterFunction" : "Reflectance",
        "rasterFunctionArguments": {},
        "variableName": "Raster"
    }

    if radiance_gain_values is not None:
        template_dict["rasterFunctionArguments"]['RadianceGainValues'] = radiance_gain_values

    if radiance_bias_values is not None:
        template_dict["rasterFunctionArguments"]['RadianceBiasValues'] = radiance_bias_values

    if reflectance_gain_values is not None:
        template_dict["rasterFunctionArguments"]['ReflectanceGainValues'] = reflectance_gain_values

    if reflectance_bias_values is not None:
        template_dict["rasterFunctionArguments"]['ReflectanceBiasValues'] = reflectance_bias_values

    if sun_elevation is not None:
        template_dict["rasterFunctionArguments"]['SunElevation'] = sun_elevation

    if albedo is not None:
        template_dict["rasterFunctionArguments"]['Albedo'] = albedo

    if scale_factor is not None:
        template_dict["rasterFunctionArguments"]['ScaleFactor'] = scale_factor

    if offset is not None:
        template_dict["rasterFunctionArguments"]['Offset'] = offset

    return Apply(raster, template_dict['rasterFunction'], template_dict['rasterFunctionArguments'])

def Geometric(raster, geodata_transforms=None, append_geodata_xform=False, z_factor=None, z_offset=None, constant_z=None,
              correct_geoid=False, tolerance=None, dem= None):
    """
    The geometric function transforms the image (for example, orthorectification) based on a sensor definition and a
    terrain model. The arguments for the geometric function are as follows:

    :param raster: The input raster.
    :param geodata_transforms: Please refer to the Geodata Transformations documentation for more details.
    :param append_geodata_xform: Optional boolean. Indicates whether the geodata transformation is appended to the existing one from the input raster. Default is False.
    :param z_factor: Optional double. Satellite rational polynomial coefficients (RPCs) are scaled for
                     elevation datasets with vertical units in meters. If your elevation uses other
                     vertical units, enter a Z Factor to rescale to meters. For example, if your
                     elevation units are in feet, you would use a value of 0.3048 to convert your
                     elevation units from feet to meters.
    :param z_offset: Optional double. The base value to be added to the elevation value in the DEM.
                     This could be used to offset elevation values that do not start at sea level.
    :param constant_z: Optional double. Specify a constant elevation to use for the Geometric function.
    :param correct_geoid: Optional boolean. Set it to True to apply the geoid (EGM96) correction to the z-values,
                          unless your DEM is already referenced to ellipsoidal heights. Default is False.
    :param tolerance: Optional double. Specify the maximum tolerable error in the geometric function, given in number of pixels.
    :param dem: Optional Raster. Specify the DEM to use for the Geometric function
    :return: the output raster

    """
    template_dict = {
        "rasterFunction": "Geometric",
        "rasterFunctionArguments": {},
        "variableName": "Raster"
    }

    if geodata_transforms is not None:
        template_dict["rasterFunctionArguments"]["GeodataTransforms"] = geodata_transforms
    if append_geodata_xform is not None:
        template_dict["rasterFunctionArguments"]["AppendGeodataXform"] = append_geodata_xform
    if z_factor is not None:
        template_dict["rasterFunctionArguments"]["ZFactor"] = z_factor
    if z_offset is not None:
        template_dict["rasterFunctionArguments"]["ZOffset"] = z_offset
    if constant_z is not None:
        template_dict["rasterFunctionArguments"]["ConstantZ"] = constant_z
    if correct_geoid is not None:
        template_dict["rasterFunctionArguments"]["CorrectGeoid"] = correct_geoid
    if tolerance is not None:
        template_dict["rasterFunctionArguments"]["Tolerance"] = tolerance

    if dem is None:
        return Apply(raster, template_dict['rasterFunction'], template_dict['rasterFunctionArguments'])
    else:
        return Apply({"Raster": raster, "DEM":dem}, template_dict['rasterFunction'], template_dict['rasterFunctionArguments'])

def Buffered(raster):
    """
    The Buffered function is used to optimize the performance of complex function chains.
    It stores the output from the part of the function chain that comes before it in memory.

    :param raster: The input raster.

    :return: output raster
    """
    template_dict = {
        "rasterFunction" : "BufferedRaster",
        "rasterFunctionArguments": {}
    }

    return Apply(raster, template_dict['rasterFunction'], template_dict['rasterFunctionArguments'])

def Reproject(raster, spatial_reference=None, x_cell_size=0, y_cell_size=0, x_registration_point=0, y_registration_point=0):
    """
    Modifies the projection of a raster dataset, mosaic dataset, or raster item in a
    mosaic dataset. It can also resample the data to a new cell size and define an origin.

    :param raster: Required Raster. The raster dataset to be reprojected or resampled.
    :param spatial_reference: Optional dict. The coordinate system used to reproject the data.
                                Example:
                                {
                                "wkid" : 4176,
                                "latestWkid" : 4176
                                }
    :param x_cell_size: Optional float.The x-dimension to which the data should be resampled.
                        This is optional. If the value is 0 or less, the output envelope
                        (extent and cell sizes) is calculated from the input raster.
    :param y_cell_size: Optional float. The y-dimension to which the data should be resampled.
                        This is optional. If the value is 0 or less, the output envelope
                        (extent and cell sizes) is calculated from the input raster.
    :param x_registration_point: Optional float. The x-coordinate used to define the upper left corner
                                 of the dataset. This coordinate must be defined in the units of
                                 the new spatial reference. If both the x_cell_size and y_cell_size
                                 parameters are greater than 0,  they are used along with the
                                 x_registration_point and y_registration_point
                                 parameters to define the output envelope.
    :param y_registration_point: Optional float. The y-coordinate used to define the upper left corner of the dataset.
                                 This coordinate must be defined in the units of the new spatial reference.
                                 If both the x_cell_size and y_cell_size parameters are greater than 0,
                                 they are used along with the x_registration_point and y_registration_point
                                 parameters to define the output envelope.

    :returns: output raster with function applied
    """

    template_dict = {
        "rasterFunction" : "Reproject",
        "rasterFunctionArguments": {}
    }


    if spatial_reference is not None:
        template_dict["rasterFunctionArguments"]['SpatialReference'] = spatial_reference

    if x_cell_size is not None:
        template_dict["rasterFunctionArguments"]['XCellsize'] = x_cell_size

    if y_cell_size is not None:
        template_dict["rasterFunctionArguments"]['YCellsize'] = y_cell_size

    if x_registration_point is not None:
        template_dict["rasterFunctionArguments"]['XOrigin'] = x_registration_point

    if y_registration_point is not None:
        template_dict["rasterFunctionArguments"]['YOrigin'] = y_registration_point


    return Apply(raster, template_dict['rasterFunction'], template_dict['rasterFunctionArguments'])

def RasterizeFeatures(raster, feature_class,  class_index_field=None, resolve_overlap_method = "FIRST"):
    """
    Converts features to raster. Features are assigned pixel values based on the feature's OBJECTID (default).
    Optionally, the pixel values can be based on a user defined value field in the input feature's attribute table.

    :param raster: Required raster. Input raster to define the cell size and extent for the feature conversion.
    :param feature_class: Required. The input point feature class
    :param class_index_field: Optional string.Select the field to use to identify each feature.
    :param resolve_overlap_method: Optional string. Determine how to manage features that overlap:
                                    FIRST - The overlapping areas will be assigned a value from the first
                                            dataset listed. This is the default option.
                                    LAST - The overlapping areas will be assigned a value from the last
                                            dataset listed.
                                    SMALLEST - The overlapping areas will be assigned a value from the
                                                smaller of the features.
                                    LARGEST - The overlapping areas will be assigned a value from the
                                                larger of the features.

    :returns: output raster with function applied
    """

    template_dict = {
        "rasterFunction" : "RasterizeFeatureClass",
        "rasterFunctionArguments": {}
    }

    if feature_class is not None:
        template_dict["rasterFunctionArguments"]['FeatureClass'] = feature_class

    if class_index_field is not None:
        template_dict["rasterFunctionArguments"]['ClassIndexField'] = class_index_field

    resolve_overlap_method_dict = {"first":0, "last":1, "smallest":2, 'largest':3}
    if resolve_overlap_method is not None:
        if isinstance(resolve_overlap_method, str):
            resolve_overlap_method= resolve_overlap_method_dict[resolve_overlap_method.lower()]
            template_dict["rasterFunctionArguments"]['ResolveOverlapMethod'] = resolve_overlap_method
        else:
            template_dict["rasterFunctionArguments"]['ResolveOverlapMethod'] = resolve_overlap_method


    return Apply(raster, template_dict['rasterFunction'], template_dict['rasterFunctionArguments'])


def RegionGrow(raster, seed_points,  max_growth_radius_field, similarity_threshold_field, fill_value_field=None):
    """
    The Region Grow function groups neighboring pixels into groups depending on the
    specified radius from the seed point. The group of pixels or object is assigned a
    specified fill value.

    :param raster: Required raster. The input Imagery Layer object.
    :param seed_points: Required. A point feature class, serving as the initial seeds for the algorithm.
                          Each seed point corresponds to one entry in the attribute table, which carries
                          the maximum growth radius, similarity threshold, and fill value information.
    :param max_growth_radius_field: Optional string. The field in the attribute table that defines the maximum growth radius,
                              in the image's spatial reference units.
    :param similarity_threshold_field: Optional string. The field in the attribute
                                   table that defines the similarity threshold, as
                                   Euclidean distance in spectral space.

    :param fill_value_field: Optional string.The field in the attribute table that defines the fill value for the group of pixels. In a multiband image, all bands will be assigned this value.

    :returns: output raster with function applied
    """

    template_dict = {
        "rasterFunction" : "RegionGrow",
        "rasterFunctionArguments": {}
    }

    if seed_points is not None:
        template_dict["rasterFunctionArguments"]['PointFeatureClass'] = seed_points

    if max_growth_radius_field is not None:
        template_dict["rasterFunctionArguments"]['MaxGrowthRadiusField'] = max_growth_radius_field

    if similarity_threshold_field is not None:
        template_dict["rasterFunctionArguments"]['SimilarityThresholdField'] = similarity_threshold_field

    if fill_value_field is not None:
        template_dict["rasterFunctionArguments"]['FillValueField'] = fill_value_field

    return Apply(raster, template_dict['rasterFunction'], template_dict['rasterFunctionArguments'])

def ZonalRemap(raster, zonal_attribute_table, zone_raster=None, zone_field="ZoneID",
               min_value_field_name="ZoneMin", max_value_field_name="ZoneMax", output_value_field_name="ZoneValue",
               background_value=0, default_output_value=255, where_clause=None):
    """
    Creates a raster layer that simultaneously displays the aspect and slope of a surface.
    :param raster: input raster
    :param zonal_attribute_table: Required path to feature class. A table containing at least three
                                  fields. It must have a minimum threshold value, maximum threshold
                                  value, and target value. The target value is the field that will
                                  contain the remapped value.
    :param zone_raster: Optional input raster. A single-band raster, where each pixel defines zones
                        associated with a particular location. A zone is defined as all areas in
                        the input that have the same value. The areas do not have to be contiguous.
    :param zone_field: Optional string. The field name in the zonal_attribute_table that contains
                       the zone ID values.
                       The zone ID values are directly tied to the zone IDs in your zonal raster.
                       They provide another level of filtering while remapping. If there is no
                       zone ID associated with a particular record in the table, it will not
                       participate in the remapping.
    :param min_value_field_name: Optional string. The field name containing the minimum value
                                 above which an input pixel is remapped.
                                 If not specified, pixel values are not tested for minimum.
    :param max_value_field_name: Optional string. Optional string. The field name containing the maximum value
                                 above which an input pixel is remapped.
                                 If not specified, pixel values are not tested for maximum.
    :param output_value_field_name: Optional string.
    :param background_value: Optional int. The initial pixel value of the output raster, before input
                             pixels are remapped.
    :param default_output_value: Optional int. The field name containing the target value to which an
                                 input pixel is remapped.
                                 If not specified, remapped pixel values are set to Default Output Value.
    :param where_clause: Optional string. An optional query applied on the zonal_attribute_table.
                         If you were using the table above as an example, the query would be
                         "Variable1 = 'bare earth' AND Variable2 = 'California'"
    :return: the output raster
    """
    template_dict = {
        "rasterFunction": "ZonalRemap",
        "rasterFunctionArguments": {}
    }

    template_dict['rasterFunctionArguments']['ClassName'] = "ZonalRemap"
    template_dict['rasterFunctionArguments']["ztable"] = zonal_attribute_table

    if zone_field is not None:
        template_dict["rasterFunctionArguments"]["zid"] = zone_field

    if min_value_field_name is not None:
        template_dict["rasterFunctionArguments"]["zmin"] = min_value_field_name

    if max_value_field_name is not None:
        template_dict["rasterFunctionArguments"]["zmax"] = max_value_field_name

    if output_value_field_name is not None:
        template_dict["rasterFunctionArguments"]["zval"] = output_value_field_name

    if background_value is not None:
        template_dict["rasterFunctionArguments"]["background"] = background_value

    if default_output_value is not None:
        template_dict["rasterFunctionArguments"]["defzval"] = default_output_value

    if where_clause is not None:
        template_dict["rasterFunctionArguments"]["where"] = where_clause

    if zone_raster is None:
        return Apply({"vraster": raster}, template_dict['rasterFunction'], template_dict['rasterFunctionArguments'])
    else:
        return Apply({"vraster": raster, "zraster":zone_raster}, template_dict['rasterFunction'], template_dict['rasterFunctionArguments'])



def LinearUnmixing(raster, spectral_profile_file=None, spectral_profile_def=None, training_feature=None, non_negative=False, sum_to_one=False):

    """
    Performs subpixel classification and calculates the fractional abundance of different land cover types for individual pixels.
    spectral profile can either be specified
        - as spectral profile file (*.eed, *.ecd, *.json) using spectral_profile_file parameter
        - as spectral profile information dictionary using  spectral_profile_def parameter.
        - as training feature using training_feature parameter.

    LinearUnmixing performs on the fly processing and does not generate temporary output dataset.

    :param raster: The input raster.
    :param spectral_profile_file: Optional string. A classifier definition file (.ecd), generated from the Train Maximum
                                                    Likelihood Classifier tool, or a JavaScript Object Notation file (.json)
                                                    that contains the class spectral profiles.
    :param spectral_profile_def: Optional dict. The class spectral profile information.
    :param training_feature: Polygon features or a training sample feature class, generated from the Training Samples Manager.

    :param non_negative: Optional bool. Specifies the options to define the output pixel values.

                         - True : There will be no negative output values.
                         - False : There can be negative values of fractional land cover. This is the default.

    :param sum_to_one: Optional bool. Specifies the options to define the output pixel values.

                        - True : Class values for each pixel are provided in decimal format with the sum of all classes equal to 1.

                          Example:
                            Class1 = 0.16; Class2 = 0.24; Class3 = 0.60.

                        - False : The sum of all classes in a pixel can exceed 1. This is the default.

    :return: output raster
    """
    template_dict = {
        "rasterFunction" : "SpectralUnmixing",
        "rasterFunctionArguments": {}
    }
    if spectral_profile_file is not None:
        template_dict["rasterFunctionArguments"]['SpectralProfileFile'] = spectral_profile_file

    if spectral_profile_def is not None:
        template_dict["rasterFunctionArguments"]['SpectralProfileDefinition'] = spectral_profile_def

    if training_feature is not None:
        template_dict["rasterFunctionArguments"]['TrainingFeature'] = training_feature

    if non_negative is not None:
        template_dict["rasterFunctionArguments"]['NonNegative'] = non_negative

    if sum_to_one is not None:
        template_dict["rasterFunctionArguments"]['SumToOne'] = sum_to_one


    return Apply(raster, template_dict['rasterFunction'], template_dict['rasterFunctionArguments'])


def ComputeChange(raster1,
                  raster2,
                  method="DIFFERENCE",
                  from_class_values=[],
                  to_class_values=[],
                  filter_method="CHANGED_PIXELS_ONLY",
                  define_transition_colors="AVERAGE",
                  extent_type="IntersectionOf",
                  cellsize_type="MaxOf",
                  from_class_name_field_name=None,
                  to_class_name_field_name=None):

    """
    Produce raster outputs representing of various changes.

    ComputeChange performs on the fly processing and does not generate temporary output dataset.

    :param raster1: Required Raster. The first raster for compute change function.
    :param raster2: Required Raster. The second raster for compute change function.
    :param method: Optional String. Specifies the method to be used. Possible options are:

                    - "DIFFERENCE" - The mathematical difference, or subtraction, between the pixel
                                     values in the raster1 parameter and the pixel values in the
                                     raster2 parameter.

                    - "RELATIVE_DIFFERENCE" - The difference in pixel values accounting for the
                                              quantities of the values being compared.

                    - "CATEGORICAL_DIFFERENCE" - The difference between two categorical or thematic rasters
                                                 in which the output shows every class transition that
                                                 occurred between the two rasters.

                    - "SPECTRAL_EUCLIDEAN_DISTANCE" - The Euclidean distance between two multiband rasters,
                                                      where each pixel is treated as a vector. Larger values
                                                      indicate more change between the images.

                    - "SPECTRAL_ANGLE_DIFFERENCE" - The spectral angle between two multiband rasters, where
                                                    each pixel is treated as a vector. Larger angles indicate
                                                    more change between the images.

                    - "BAND_WITH_MOST_CHANGE" - The band that accounts for the most change in each pixel between
                                                two multiband rasters.

                    Example:
                        "DIFFERENCE"

                        Defines the method used to assign color for the output classes
    :param from_class_values: Optional list. The class values that define the from classes. It can be one or multiple value.
    :param to_class_values: Optional list. The class values that define the to classes. It can be one or multiple value.
    :param filter_method: Optional string. Default value is "CHANGED_PIXELS_ONLY".
                          Possible options are:
                              - "ALL"
                              - "CHANGED_PIXELS_ONLY"
                              - "UNCHANGED_PIXELS_ONLY"

    :param define_transition_colors: Optional string. Defines the method used to assign color for the output classes
                                        - "AVERAGE" - use an average of the colors of the from class and
                                                      to class for the output classes. This is the default.
                                        - "FROM_COLOR" - use colors of the from classes for the output
                                        - "TO_COLOR" - use the colors of the to classes for the output

     :param extent_type: Optional string. One of "FirstOf", "IntersectionOf" "UnionOf", "LastOf"
     :param cellsize_type: Optional String. One of "FirstOf", "MinOf", "MaxOf "MeanOf", "LastOf"
     :param from_class_name_field_name: Optional string. A field that stores class names in the raster1.
                                        The function automatically searches for CLASSNAME field or CLASS_NAME field to use.
                                        Use this parameter if the input does not contain these standard field names

                                        Example: "CLASSES"
     :param to_class_name_field_name: Optional string. A field that stores class names in the raster2.
                                      The function automatically searches for CLASSNAME field or CLASS_NAME field to use.
                                      Use this parameter if the input does not contain these standard field names

                                      Example: "CLASSES"

    :return: output raster

    """

    template_dict = {
        "rasterFunction": "ComputeChange",
        "rasterFunctionArguments": {}
    }

    method_types = {
            'DIFFERENCE': 0,
            'RELATIVE_DIFFERENCE': 1,
            'CATEGORICAL_DIFFERENCE' : 2,
            'SPECTRAL_EUCLIDEAN_DISTANCE' : 3,
            'SPECTRAL_ANGLE_DIFFERENCE' :4,
            'BAND_WITH_MOST_CHANGE' : 5
        }

    if isinstance(method, str):
        in_method = method_types[method.upper()]
    else:
        in_method = method

    template_dict["rasterFunctionArguments"]['Method'] = in_method

    if from_class_values is not None:
        template_dict["rasterFunctionArguments"]['FromClassValues'] = from_class_values

    if to_class_values is not None:
        template_dict["rasterFunctionArguments"]['ToClassValues'] = to_class_values

    filter_method_types = {
            'ALL': 0,
            'CHANGED_PIXELS_ONLY': 1,
            'UNCHANGED_PIXELS_ONLY' : 2
        }

    if isinstance(filter_method, str):
        in_filter_method = filter_method_types[filter_method.upper()]
    else:
        in_filter_method = filter_method

    template_dict["rasterFunctionArguments"]['KeepMethod'] = in_filter_method


    if define_transition_colors is not None:
        define_transition_colors_types = {
        'AVERAGE': 0,
        'FROM_COLOR': 1,
        'TO_COLOR' : 2
    }

        if isinstance(define_transition_colors, str):
            define_transition_colors = define_transition_colors_types[define_transition_colors.upper()]
        else:
            define_transition_colors = define_transition_colors
        template_dict["rasterFunctionArguments"]['UseColorMethod'] = define_transition_colors

    extent_types = {
        "FIRSTOF": 0,
        "INTERSECTIONOF": 1,
        "UNIONOF": 2,
        "LASTOF": 3
    }

    cellsize_types = {
        "FIRSTOF": 0,
        "MINOF": 1,
        "MAXOF": 2,
        "MEANOF": 3,
        "LASTOF": 4
    }

    if extent_type.upper() not in list(extent_types.keys()):
        raise ValueError(
            "Invalid extent_type value. Note that operation type should be one fo 'FirstOf', 'IntersectionOf', 'UnionOf', 'LastOf'")
    in_extent_type = extent_types[extent_type.upper()]

    if cellsize_type.upper() not in list(cellsize_types.keys()):
        raise ValueError(
            "Invalid extent_type value. Note that operation type should be one fo 'FirstOf', 'MinOf', 'MaxOf', 'MeanOf', 'LastOf'")
    in_cellsize_type = cellsize_types[cellsize_type.upper()]

    if in_extent_type is not None:
        template_dict["rasterFunctionArguments"]['ExtentType'] = in_extent_type
    if in_cellsize_type is not None:
        template_dict["rasterFunctionArguments"]['CellsizeType'] = in_cellsize_type

    if from_class_name_field_name is not None:
        template_dict["rasterFunctionArguments"]['FromClassNameFieldName'] = from_class_name_field_name
    if to_class_name_field_name is not None:
        template_dict["rasterFunctionArguments"]['ToClassNameFieldName'] = to_class_name_field_name

    return Apply((raster1, raster2), template_dict['rasterFunction'], template_dict['rasterFunctionArguments'])


def DetectChangeUsingChangeAnalysis(raster,
                                    change_type="TIME_OF_LATEST_CHANGE",
                                    max_number_of_changes=1,
                                    segment_date="BEGINNING_OF_SEGMENT",
                                    change_direction="ALL",
                                    filter_by_year=False,
                                    min_year=1970,
                                    max_year=2020,
                                    filter_by_duration=False,
                                    min_duration=0,
                                    max_duration=50,
                                    filter_by_magnitude=False,
                                    min_magnitude=-50,
                                    max_magnitude=50,
                                    filter_by_start_value=False,
                                    min_start_value=None,
                                    max_start_value=None,
                                    filter_by_end_value=False,
                                    min_end_value=None,
                                    max_end_value=None):

    """
    Function generates a raster containing pixel change information using the
    output change analysis raster from the AnalyzeChangesUsingCCDC or AnalyzeChangesUsingLandTrendr function.

    DetectChangeUsingChangeAnalysis performs on the fly processing and does not generate temporary output dataset.

    :param raster: Required raster object. The raster generated from the AnalyzeChangesUsingCCDC or AnalyzeChangesUsingLandTrendr function.
    :param change_type: Optional String. Specifies the change information to calculate.

                        - TIME_OF_LATEST_CHANGE - Each pixel will contain the date of the most recent change for that pixel in the time series. This is the default.
                        - TIME_OF_EARLIEST_CHANGE - Each pixel will contain the date of the earliest change for that pixel in the time series.
                        - TIME_OF_LARGEST_CHANGE - Each pixel will contain the date of the most significant change for that pixel in the time series.
                        - NUM_OF_CHANGES - Each pixel will contain the total number of times the pixel changed in the time series.
                        - TIME_OF_LONGEST_CHANGE -Each pixel will contain the date of change at the end of the longest transition segment in the time series.
                        - TIME_OF_SHORTEST_CHANGE -Each pixel will contain the date of change at the end of the shortest transition segment in the time series.
                        - TIME_OF_FASTEST_CHANGE -Each pixel will contain the date of change at the end of the transition that occurred most quickly.
                        - TIME_OF_SLOWEST_CHANGE -Each pixel will contain the date of change at the end of the transition that occurred most slowly.
                          Example:
                            "TIME_OF_LATEST_CHANGE"
    :param max_number_of_changes: Optional Integer. The maximum number of changes per pixel that will
                                    be calculated when the change_type parameter is set to
                                    TIME_OF_LATEST_CHANGE, TIME_OF_EARLIEST_CHANGE, or TIME_OF_LARGEST_CHANGE.
                                    This number corresponds to the number of bands in the output raster.
                                    The default is 1, meaning only one change date will be calculated,
                                    and the output raster will contain only one band.

                                    Example:
                                    3
    :param segment_date:Optional string. Specifies whether to extract the date at the beginning of a change segment, or the end.

                        This parameter is honoured only when the input change analysis raster is the output from the
                        Analyze Changes Using LandTrendr tool.

                        - BEGINNING_OF_SEGMENT - Extract the date at the beginning of a change segment. This is the default.
                        - END_OF_SEGMENT - Extract the date at the end of a change segment.
    :param change_direction:Optional string. The direction of change to be included in the analysis. For example, choose INCREASE to
                            only extract date of change information for periods where the change is in the positive or
                            increasing direction.

                            This parameter is honoured only when the input change analysis raster is the output from the Analyze Changes Using LandTrendr tool.

                            - ALL - All change directions will be included in the output. This is the default.
                            - INCREASE - Only change in the positive or increasing direction will be included in the output.
                            - DECREASE - Only change in the negative or decreasing direction will be included in the output.
    :param filter_by_year: Optional boolean. Specifies whether to filter by a range of years.
                           - True - Filter results such that only changes that occurred within a specific range of years is
                                    included in the output.
                           - False - Do not filter results by year. This is the default.
    :param min_year: Optional double. The earliest year to use to filter results. This parameter is required if the filter_by_year parameter is set to True.
    :param max_year: Optional double. The latest year to use to filter results. This parameter is required if the filter_by_year parameter is set to True.
    :param filter_by_duration: Optional boolean. Specifies whether to filter by the change duration. This parameter is honoured only when the input change
                               analysis raster is the output from the Analyze Changes Using LandTrendr tool.

                               - True - Filter results by duration such that only the changes that lasted a given amount of time will be included in the output.
                               - False - Do not filter results by duration. This is the default.
    :param min_duration: Optional double. The minimum number of consecutive years to include in the results. This parameter is required if the filter_by_duration parameter is set to True.
    :param max_duration:Optional double. The maximum number of consecutive years to include in the results. This parameter is required if the filter_by_duration parameter is set to True.
    :param filter_by_magnitude:Specifies whether to filter by change magnitude.
                               - True - Filter results by magnitude such that only the changes of a given magnitude will be included in the output.
                               - False - Do not filter results by magnitude. This is the default.
    :param min_magnitude:Optional double. The minimum magnitude to include in the results. This parameter is required if the filter_by_duration parameter is set to True.
    :param max_magnitude: Optional double. The maximum magnitude to include in the results. This parameter is required if the filter_by_duration parameter is set to True.
    :param filter_by_start_value: Specifies whether to filter by start value. This parameter is available only when the input change analysis raster is the output from the AnalyzeChangesUsingLandTrendr function.
                                  - True - Filter results by start value so that only the change that starts with value defined by a range.
                                  - False - Do not filter by start value. This is the default.
    :param min_start_value: The minimum value that defines the range of start value. This parameter is required if the filter_by_start_value parameter is set to True.
    :param max_start_value: The maximum value that defines the range of start value. This parameter is required if the filter_by_start_value parameter is set to True.
    :param filter_by_end_value: Specifies whether to filter by end value. This parameter is available only when the input change analysis raster is the output from the AnalyzeChangesUsingLandTrendr function.
                                - True - Filter results by end value so that only the change that ends with value defined by a range.
                                - False - Do not filter by end value. This is the default.
    :param min_end_value: The minimum value that defines the range of end value. This parameter is required if the filter_by_end_value parameter is set to True.
    :param max_end_value: The maximum value that defines the range of end value. This parameter is required if the filter_by_end_value parameter is set to True.
    :return: the output raster

    """

    template_dict = {
        "rasterFunction" : "DetectChange",
        "rasterFunctionArguments": {},
        "variableName": "Raster"
    }


    if change_type is not None:
        change_types = {
            'TIME_OF_LATEST_CHANGE': 0,
            'TIME_OF_EARLIEST_CHANGE': 1,
            'TIME_OF_LARGEST_CHANGE' : 2,
            'NUM_OF_CHANGES' : 3,
            'TIME_OF_LONGEST_CHANGE' : 4,
            'TIME_OF_SHORTEST_CHANGE' : 5,
            'TIME_OF_FASTEST_CHANGE' : 6,
            'TIME_OF_SLOWEST_CHANGE' : 7
        }

        if isinstance(change_type, str):
            in_change_type = change_types[change_type.upper()]
        else:
            in_change_type = change_type

        template_dict["rasterFunctionArguments"]['ChangeType'] = in_change_type

    if max_number_of_changes is not None:
        template_dict["rasterFunctionArguments"]['MaxNumberChanges'] = max_number_of_changes

    if segment_date is not None:
        segment_date_types = {
            'BEGINNING_OF_SEGMENT': 0,
            'END_OF_SEGMENT': 1
        }

        if isinstance(segment_date, str):
            in_segment_date = segment_date_types[segment_date.upper()]
        else:
            in_segment_date = segment_date

        template_dict["rasterFunctionArguments"]['SegmentDate'] = in_segment_date

    if change_direction is not None:
        change_direction_types = {
            'ALL': 0,
            'INCREASE': 1,
            'DECREASE':2
        }

        if isinstance(change_direction, str):
            in_change_direction = change_direction_types[change_direction.upper()]
        else:
            in_change_direction = change_direction

        template_dict["rasterFunctionArguments"]['ChangeDirection'] = in_change_direction

    if filter_by_year is not None:
        template_dict["rasterFunctionArguments"]['FilterByYear'] = filter_by_year

    if min_year is not None:
        template_dict["rasterFunctionArguments"]['MinimumYear'] = min_year

    if max_year is not None:
        template_dict["rasterFunctionArguments"]['MaximumYear'] = max_year

    if filter_by_duration is not None:
        template_dict["rasterFunctionArguments"]['FilterByDuration'] = filter_by_duration

    if min_duration is not None:
        template_dict["rasterFunctionArguments"]['MinimumDuration'] = min_duration

    if max_duration is not None:
        template_dict["rasterFunctionArguments"]['MaximumDuration'] = max_duration

    if filter_by_magnitude is not None:
        template_dict["rasterFunctionArguments"]['FilterByMagnitude'] = filter_by_magnitude

    if min_magnitude is not None:
        template_dict["rasterFunctionArguments"]['MinimumMagnitude'] = min_magnitude

    if max_magnitude is not None:
        template_dict["rasterFunctionArguments"]['MaximumMagnitude'] = max_magnitude

    if isinstance(filter_by_start_value, bool):
        template_dict["rasterFunctionArguments"]['FilterByStartValue'] = filter_by_start_value

        if filter_by_start_value:
            if min_start_value is not None:
                template_dict["rasterFunctionArguments"]['MinimumStartValue'] = min_start_value

            if max_start_value is not None:
                template_dict["rasterFunctionArguments"]['MaximumStartValue'] = max_start_value

    if isinstance(filter_by_end_value, bool):
        template_dict["rasterFunctionArguments"]['FilterByEndValue'] = filter_by_end_value

        if filter_by_end_value:
            if min_end_value is not None:
                template_dict["rasterFunctionArguments"]['MinimumEndValue'] = min_end_value

            if max_end_value is not None:
                template_dict["rasterFunctionArguments"]['MaximumEndValue'] = max_end_value


    return Apply(raster, template_dict['rasterFunction'], template_dict['rasterFunctionArguments'])


def InterpolateRasterByDimension(raster,
                                 interpolation_method="LINEAR",
                                 variables=None,
                                 dimension_definition=None,
                                 dimension_values=None,
                                 dimension=None,
                                 start_value=None,
                                 end_value=None,
                                 interval_value=None,
                                 interval_unit=None,
                                 target_raster=None,
                                 ignore_nodata=True):

    """
    Interpolates a multidimensional raster at a specified dimension value using adjacent values.

    :param raster: The input raster.
    :param interpolation_method: Optional string. Specifies the interpolation method. Possible values are - LINEAR, NEARESTNEIGHBOR
                                 Default is LINEAR
    :param variables: Optional List. The list of variables that will be included in the interpolation. If not specified the function will take all variables by default.
    :param dimension_definition: Optional String. Specifies the dimension definition. It can be one of the following:

                                    - BY_VALUES

                                    - BY_INTERVAL

                                    - BY_TARGET_RASTER

    :param dimension_values: Optional List of Dicts. This slices the data based on the dimension name and the value specified.
                             This parameter is required when the dimension_definition is set to BY_VALUES.

                             If dimension is StdTime, then the value must be specified in
                             human readable time format (YYYY-MM-DDTHH:MM:SS). The input should be specified as:
                             [{"dimension":"dimension_name", "value":"dimension_value"},{"dimension":"dimension_name", "value":"dimension_value"}]

                             Example:
                                 [{"dimension":"StdTime", "value":"2012-01-15T03:00:00"}]

    :param dimension: Optional String. The dimension along which the variables will be interpolated.
                      This parameter is required when the dimension_definition is set to BY_INTERVAL.

    :param start_value: Optional String. The beginning of the interval.
                        This parameter is required when the dimension_definition is set to BY_INTERVAL
    :param end_value: Optional String. The end of the interval.
                      This parameter is required when the dimension_definition is set to BY_INTERVAL
    :param interval_value: Optional Float. The frequency with which the data will be sliced.
                           This parameter is required when the dimension_definition is set to BY_INTERVAL
    :param interval_unit: Optional String. Specifies the interval unit.
                           This parameter is required when the dimension_definition is set to BY_INTERVAL
                           and the dimension parameter is set to StdTime.

                            - HOURS - Uses hours as the specified unit of time.

                            - DAYS - Uses days as the specified unit of time.

                            - WEEKS - Uses weeks as the specified unit of time.

                            - MONTHS - Uses months as the specified unit of time.

                            - YEARS -Uses years as the specified unit of time.
    :param target_raster: Optional String. Parameter used to specify the target raster from which the dimension definition would be taken.
                          Required when dimension_definition is set to BY_TARGET_RASTER
    :param ignore_nodata: Optional Boolean. Specifies whether NoData values are ignored in the interpolation.

                          - True : Only the cells that are have noData values will be used in interpolation. This is the default.
                          - False : The cells that have noData values will be used in interpolation.

    :return: output raster
    """
    template_dict = {
        "rasterFunction" : "InterpolateRasterByDimension",
        "rasterFunctionArguments": {}
    }

    dimension_definition_val = dimension_definition
    if dimension_definition is not None:
        dimension_definition_allowed_values = [
            "BY_VALUES",
            "BY_TARGET_RASTER",
            "BY_INTERVAL",
        ]
        if [element.lower() for element in dimension_definition_allowed_values].count(
            dimension_definition.lower()
        ) <= 0:
            raise RuntimeError(
                "dimension_definition can only be one of the following: "
                + str(dimension_definition_allowed_values)
            )

        for element in dimension_definition_allowed_values:
            if dimension_definition.upper() == element:
                dimension_definition_val = element

    interval_unit_val = interval_unit
    if interval_unit is not None:
        interval_unit_allowed_values = [
            "HOURS",
            "DAYS",
            "DAILY",
            "WEEKS",
            "MONTHS",
            "YEARS",
        ]
        if [element.lower() for element in interval_unit_allowed_values].count(
            interval_unit.lower()
        ) <= 0:
            raise RuntimeError(
                "interval_unit can only be one of the following: "
                + str(interval_unit_allowed_values)
            )

        for element in interval_unit_allowed_values:
            if interval_unit.upper() == element:
                interval_unit_val = element

    dimension_definition_dict = {}
    dimension_definition_dict.update({"definitionType": dimension_definition_val})

    if variables is not None:
        if isinstance(variables, list):
            dimension_definition_dict.update({"variables": variables})
        else:
            dimension_definition_dict.update({"variables": [variables]})

    if dimension_definition == "BY_INTERVAL":
        dimension_definition_dict.update(
            {
                "dimension": dimension,
                "startValue": start_value,
                "endValue": end_value,
                "stepValue": interval_value,
            }
        )
        if interval_unit is not None:
            dimension_definition_dict.update({"units": interval_unit})

    elif dimension_definition == "BY_VALUES":
        dimensions_list = []
        values_list = []
        if not isinstance(dimension_values, list):
            dimension_values = [dimension_values]
        if isinstance(dimension_values, list):
            for ele in dimension_values:
                if isinstance(ele, dict):
                    values_list.append(ele["value"])
                    dimensions_list.append(ele["dimension"])
        dimension_definition_dict.update({"dimensions": dimensions_list, "values": values_list})

    elif dimension_definition == "BY_TARGET_RASTER":
        dimension_definition_dict.update(
            {
                "target": target_raster
            }
        )

    if dimension_definition is not None:
        template_dict["rasterFunctionArguments"]['DimensionDefinition'] = dimension_definition_dict

    if interpolation_method is not None:
        template_dict["rasterFunctionArguments"]['InterpolationMethod'] = interpolation_method

    if interpolation_method is not None:
        interpolation_method_types = {
            'LINEAR': 0,
            'NEARESTNEIGHBOR': 1
        }

        if isinstance(interpolation_method, str):
            in_interpolation_method = interpolation_method_types[interpolation_method.upper()]
        else:
            in_interpolation_method = interpolation_method

        template_dict["rasterFunctionArguments"]['InterpolationMethod'] = in_interpolation_method

    if ignore_nodata is not None:
        template_dict["rasterFunctionArguments"]['IgnoreNoData'] = ignore_nodata

    return Apply(raster, template_dict['rasterFunction'], template_dict['rasterFunctionArguments'])


def _Local(
    rasters,
    operation,
    extent_type="FirstOf",
    cellsize_type="FirstOf",
    process_as_multiband=None,
    percentile_value=90,
    percentile_interpolation_type="AUTO_DETECT"):

    extent_types = {"FirstOf": 0, "IntersectionOf": 1, "UnionOf": 2, "LastOf": 3}

    cellsize_types = {"FirstOf": 0, "MinOf": 1, "MaxOf": 2, "MeanOf": 3, "LastOf": 4}

    if extent_type not in list(extent_types.keys()):
        raise ValueError(
            "Invalid extent_type value. Note that operation type should be one of 'FirstOf', 'IntersectionOf', 'UnionOf', 'LastOf'")
    in_extent_type = extent_types[extent_type]

    if cellsize_type not in list(cellsize_types.keys()):
        raise ValueError(
            "Invalid cellsize_type value. Note that operation type should be one of 'FirstOf', 'MinOf', 'MaxOf', 'MeanOf', 'LastOf'")
    in_cellsize_type = cellsize_types[cellsize_type]

    template_dict = {
        "rasterFunction": "Local",
        "rasterFunctionArguments": {
            "Operation": operation
        },
        "variableName": "Rasters",
    }

    if in_extent_type is not None:
        template_dict["rasterFunctionArguments"]['ExtentType'] = in_extent_type
    if in_cellsize_type is not None:
        template_dict["rasterFunctionArguments"]['CellsizeType'] = in_cellsize_type

    if process_as_multiband is not None:
        if isinstance(process_as_multiband, bool):
            template_dict["rasterFunctionArguments"][
                "ProcessAsMultiband"
            ] = process_as_multiband
        else:
            raise ValueError("process_as_multiband should be an instance of bool")

    if operation == 94 or operation == 93:
        if percentile_value is not None:
            template_dict["rasterFunctionArguments"][
                "PercentileValue"
            ] = percentile_value
    if operation == 94 or operation == 93 or operation == 41 or operation == 69:
        if percentile_interpolation_type is not None:
            percentile_interpolation_type_list = [
                "AUTO_DETECT",
                "NEAREST",
                "LINEAR",
            ]
            if (
                percentile_interpolation_type.upper()
                not in percentile_interpolation_type_list
            ):
                raise ValueError(
                    "percentile_interpolation_type should be one of the following "
                    + str(percentile_interpolation_type_list)
                )
            template_dict["rasterFunctionArguments"][
                "PercentileInterpolationType"
            ] = percentile_interpolation_type

    return Apply(rasters, template_dict['rasterFunction'], template_dict['rasterFunctionArguments'])


def Max(
    rasters,
    extent_type="FirstOf",
    cellsize_type="FirstOf",
    ignore_nodata=False,
    process_as_multiband=None):
    """
    The Max function determines the maximum value from multiple rasters, on a pixel-by-pixel basis. 

    :param rasters: Required list of Rasters. If a scalar is needed for the operation, the scalar can be a float.
    :param extent_type: Optional string. Specifies the extent to be used for the function.

                        - "FirstOf" - Use the extent of the first input raster to determine the processing extent. This is the default.

                        - "IntersectionOf" - Use the extent of the overlapping pixels to determine the processing extent.

                        - "UnionOf" - Use the extent of all the rasters to determine the processing extent.

                        - "LastOf" - Use the extent of the last input raster to determine the processing extent.
    :param cellsize_type: Optional string. Specifies the cell size to be used for the function.
                          - "FirstOf" - Use the first cell size of the input rasters. This is the default.

                          - "MinOf" - Use the smallest cell size of all the input rasters.

                          - "MaxOf" - Use the largest cell size of all the input rasters.

                          - "MeanOf" - Use the mean cell size of all the input rasters.

                          - "LastOf" - Use the last cell size of the input rasters.
    :param ignore_nodata: Optional Boolean. Specifies whether NoData values are ignored in the interpolation.

                          - True : Only the cells that are have noData values will be used in calculation. This is the default.
                          - False : The cells that have noData values will be used in calculation.

    :param process_as_multiband: Optional boolean. Set to True to process as multiband.

    :return: output raster
    """
    opnum = 67 if ignore_nodata else 39
    return _Local(
        rasters,
        opnum,
        extent_type=extent_type,
        cellsize_type=cellsize_type,
        process_as_multiband=process_as_multiband,
    )

def Mean(
    rasters,
    extent_type="FirstOf",
    cellsize_type="FirstOf",
    ignore_nodata=False,
    process_as_multiband=None):
    """
    The Mean function determines the average value from multiple rasters, on a pixel-by-pixel basis.

    :param rasters: Required list of Rasters. If a scalar is needed for the operation, the scalar can be a float.
    :param extent_type: Optional string. Specifies the extent to be used for the function.

                        - "FirstOf" - Use the extent of the first input raster to determine the processing extent. This is the default.

                        - "IntersectionOf" - Use the extent of the overlapping pixels to determine the processing extent.

                        - "UnionOf" - Use the extent of all the rasters to determine the processing extent.

                        - "LastOf" - Use the extent of the last input raster to determine the processing extent.
    :param cellsize_type: Optional string. Specifies the cell size to be used for the function.
                          - "FirstOf" - Use the first cell size of the input rasters. This is the default.

                          - "MinOf" - Use the smallest cell size of all the input rasters.

                          - "MaxOf" - Use the largest cell size of all the input rasters.

                          - "MeanOf" - Use the mean cell size of all the input rasters.

                          - "LastOf" - Use the last cell size of the input rasters.
    :param ignore_nodata: Optional Boolean. Specifies whether NoData values are ignored in the interpolation.

                          - True : Only the cells that are have noData values will be used in calculation. This is the default.
                          - False : The cells that have noData values will be used in calculation.

    :param process_as_multiband: Optional boolean. Set to True to process as multiband.

    :return: output raster
    """
    opnum = 68 if ignore_nodata else 40
    return _Local(
        rasters,
        opnum,
        extent_type=extent_type,
        cellsize_type=cellsize_type,
        process_as_multiband=process_as_multiband,
    )

def Median(
    rasters,
    percentile_interpolation_type="AUTO_DETECT",
    extent_type="FirstOf",
    cellsize_type="FirstOf",
    ignore_nodata=False,
    process_as_multiband=None):
    """
    The Median function calculates the middle value of the pixels from multiple rasters, on a pixel-by-pixel basis.

    :param rasters: Required list of Rasters. If a scalar is needed for the operation, the scalar can be a float.
    :param percentile_interpolation_type: Optional string. Specifies the method of interpolation to be used when
                                          the median lies between two input cell values.

                                             - AUTO_DETECT-If the input rasters are of integer pixel type, the NEAREST
                                               method is used. If the input rasters are of floating point pixel type,
                                               the LINEAR method is used. This is the default.

                                             - NEAREST-The nearest available value to the desired percentile is used.
                                               In this case, the output pixel type is the same as that of the input rasters.

                                             - LINEAR-The weighted average of the two surrounding values from the desired
                                               percentile is used. In this case, the output pixel type is floating point.
    :param extent_type: Optional string. Specifies the extent to be used for the function.

                        - "FirstOf" - Use the extent of the first input raster to determine the processing extent. This is the default.

                        - "IntersectionOf" - Use the extent of the overlapping pixels to determine the processing extent.

                        - "UnionOf" - Use the extent of all the rasters to determine the processing extent.

                        - "LastOf" - Use the extent of the last input raster to determine the processing extent.
    :param cellsize_type: Optional string. Specifies the cell size to be used for the function.
                          - "FirstOf" - Use the first cell size of the input rasters. This is the default.

                          - "MinOf" - Use the smallest cell size of all the input rasters.

                          - "MaxOf" - Use the largest cell size of all the input rasters.

                          - "MeanOf" - Use the mean cell size of all the input rasters.

                          - "LastOf" - Use the last cell size of the input rasters.
    :param ignore_nodata: Optional Boolean. Specifies whether NoData values are ignored in the interpolation.

                          - True : Only the cells that are have noData values will be used in calculation. This is the default.
                          - False : The cells that have noData values will be used in calculation.

    :param process_as_multiband: Optional boolean. Set to True to process as multiband.

    :return: output raster
    """
    opnum = 69 if ignore_nodata else 41
    return _Local(
        rasters,
        opnum,
        extent_type=extent_type,
        cellsize_type=cellsize_type,
        process_as_multiband=process_as_multiband,
        percentile_interpolation_type=percentile_interpolation_type
    )

def Min(
    rasters,
    extent_type="FirstOf",
    cellsize_type="FirstOf",
    ignore_nodata=False,
    process_as_multiband=None):
    """
    The Min function determines the smallest value from multiple rasters, on a pixel-by-pixel basis.

    :param rasters: Required list of Rasters. If a scalar is needed for the operation, the scalar can be a float.
    :param extent_type: Optional string. Specifies the extent to be used for the function.

                        - "FirstOf" - Use the extent of the first input raster to determine the processing extent. This is the default.

                        - "IntersectionOf" - Use the extent of the overlapping pixels to determine the processing extent.

                        - "UnionOf" - Use the extent of all the rasters to determine the processing extent.

                        - "LastOf" - Use the extent of the last input raster to determine the processing extent.
    :param cellsize_type: Optional string. Specifies the cell size to be used for the function.
                          - "FirstOf" - Use the first cell size of the input rasters. This is the default.

                          - "MinOf" - Use the smallest cell size of all the input rasters.

                          - "MaxOf" - Use the largest cell size of all the input rasters.

                          - "MeanOf" - Use the mean cell size of all the input rasters.

                          - "LastOf" - Use the last cell size of the input rasters.
    :param ignore_nodata: Optional Boolean. Specifies whether NoData values are ignored in the interpolation.

                          - True : Only the cells that are have noData values will be used in calculation. This is the default.
                          - False : The cells that have noData values will be used in calculation.

    :param process_as_multiband: Optional boolean. Set to True to process as multiband.

    :return: output raster
    """
    opnum = 70 if ignore_nodata else 42
    return _Local(
        rasters,
        opnum,
        extent_type=extent_type,
        cellsize_type=cellsize_type,
        process_as_multiband=process_as_multiband,
    )

def Minority(
    rasters,
    extent_type="FirstOf",
    cellsize_type="FirstOf",
    ignore_nodata=False,
    process_as_multiband=None):
    """
    The Minority function determines the value that occurs least often from multiple rasters, on a pixel-by-pixel basis.

    :param rasters: Required list of Rasters. If a scalar is needed for the operation, the scalar can be a float.
    :param extent_type: Optional string. Specifies the extent to be used for the function.

                        - "FirstOf" - Use the extent of the first input raster to determine the processing extent. This is the default.

                        - "IntersectionOf" - Use the extent of the overlapping pixels to determine the processing extent.

                        - "UnionOf" - Use the extent of all the rasters to determine the processing extent.

                        - "LastOf" - Use the extent of the last input raster to determine the processing extent.
    :param cellsize_type: Optional string. Specifies the cell size to be used for the function.
                          - "FirstOf" - Use the first cell size of the input rasters. This is the default.

                          - "MinOf" - Use the smallest cell size of all the input rasters.

                          - "MaxOf" - Use the largest cell size of all the input rasters.

                          - "MeanOf" - Use the mean cell size of all the input rasters.

                          - "LastOf" - Use the last cell size of the input rasters.
    :param ignore_nodata: Optional Boolean. Specifies whether NoData values are ignored in the interpolation.

                          - True : Only the cells that are have noData values will be used in calculation. This is the default.
                          - False : The cells that have noData values will be used in calculation.

    :param process_as_multiband: Optional boolean. Set to True to process as multiband.

    :return: output raster
    """
    opnum = 71 if ignore_nodata else 43
    return _Local(
        rasters,
        opnum,
        extent_type=extent_type,
        cellsize_type=cellsize_type,
        process_as_multiband=process_as_multiband,
    )

def Majority(
    rasters,
    extent_type="FirstOf",
    cellsize_type="FirstOf",
    ignore_nodata=False,
    process_as_multiband=None):
    """
    The Majority function determines the value that occurs most often from multiple rasters, on a pixel-by-pixel basis.

    :param rasters: Required list of Rasters. If a scalar is needed for the operation, the scalar can be a float.
    :param extent_type: Optional string. Specifies the extent to be used for the function.

                        - "FirstOf" - Use the extent of the first input raster to determine the processing extent. This is the default.

                        - "IntersectionOf" - Use the extent of the overlapping pixels to determine the processing extent.

                        - "UnionOf" - Use the extent of all the rasters to determine the processing extent.

                        - "LastOf" - Use the extent of the last input raster to determine the processing extent.
    :param cellsize_type: Optional string. Specifies the cell size to be used for the function.
                          - "FirstOf" - Use the first cell size of the input rasters. This is the default.

                          - "MinOf" - Use the smallest cell size of all the input rasters.

                          - "MaxOf" - Use the largest cell size of all the input rasters.

                          - "MeanOf" - Use the mean cell size of all the input rasters.

                          - "LastOf" - Use the last cell size of the input rasters.
    :param ignore_nodata: Optional Boolean. Specifies whether NoData values are ignored in the interpolation.

                          - True : Only the cells that are have noData values will be used in calculation. This is the default.
                          - False : The cells that have noData values will be used in calculation.

    :param process_as_multiband: Optional boolean. Set to True to process as multiband.

    :return: output raster
    """
    opnum = 66 if ignore_nodata else 38
    return _Local(
        rasters,
        opnum,
        extent_type=extent_type,
        cellsize_type=cellsize_type,
        process_as_multiband=process_as_multiband,
    )

def Range(
    rasters,
    extent_type="FirstOf",
    cellsize_type="FirstOf",
    ignore_nodata=False,
    process_as_multiband=None):
    """
    The CellStatsRange function calculates the difference between the largest and the smallest values of a raster on a pixel-by-pixel basis.

    :param rasters: Required list of Rasters. If a scalar is needed for the operation, the scalar can be a float.
    :param extent_type: Optional string. Specifies the extent to be used for the function.

                        - "FirstOf" - Use the extent of the first input raster to determine the processing extent. This is the default.

                        - "IntersectionOf" - Use the extent of the overlapping pixels to determine the processing extent.

                        - "UnionOf" - Use the extent of all the rasters to determine the processing extent.

                        - "LastOf" - Use the extent of the last input raster to determine the processing extent.
    :param cellsize_type: Optional string. Specifies the cell size to be used for the function.
                          - "FirstOf" - Use the first cell size of the input rasters. This is the default.

                          - "MinOf" - Use the smallest cell size of all the input rasters.

                          - "MaxOf" - Use the largest cell size of all the input rasters.

                          - "MeanOf" - Use the mean cell size of all the input rasters.

                          - "LastOf" - Use the last cell size of the input rasters.
    :param ignore_nodata: Optional Boolean. Specifies whether NoData values are ignored in the interpolation.

                          - True : Only the cells that are have noData values will be used in calculation. This is the default.
                          - False : The cells that have noData values will be used in calculation.

    :param process_as_multiband: Optional boolean. Set to True to process as multiband.

    :return: output raster
    """
    opnum = 72 if ignore_nodata else 47
    return _Local(
        rasters,
        opnum,
        extent_type=extent_type,
        cellsize_type=cellsize_type,
        process_as_multiband=process_as_multiband,
    )


def StdDev(
    rasters,
    extent_type="FirstOf",
    cellsize_type="FirstOf",
    ignore_nodata=False,
    process_as_multiband=None):
    """
    The StdDev function calculates the standard deviation of the pixels of a raster on a pixel-by-pixel basis.

    :param rasters: Required list of Rasters. If a scalar is needed for the operation, the scalar can be a float.
    :param extent_type: Optional string. Specifies the extent to be used for the function.

                        - "FirstOf" - Use the extent of the first input raster to determine the processing extent. This is the default.

                        - "IntersectionOf" - Use the extent of the overlapping pixels to determine the processing extent.

                        - "UnionOf" - Use the extent of all the rasters to determine the processing extent.

                        - "LastOf" - Use the extent of the last input raster to determine the processing extent.
    :param cellsize_type: Optional string. Specifies the cell size to be used for the function.
                          - "FirstOf" - Use the first cell size of the input rasters. This is the default.

                          - "MinOf" - Use the smallest cell size of all the input rasters.

                          - "MaxOf" - Use the largest cell size of all the input rasters.

                          - "MeanOf" - Use the mean cell size of all the input rasters.

                          - "LastOf" - Use the last cell size of the input rasters.
    :param ignore_nodata: Optional Boolean. Specifies whether NoData values are ignored in the interpolation.

                          - True : Only the cells that are have noData values will be used in calculation. This is the default.
                          - False : The cells that have noData values will be used in calculation.

    :param process_as_multiband: Optional boolean. Set to True to process as multiband.

    :return: output raster
    """
    opnum = 73 if ignore_nodata else 54
    return _Local(
        rasters,
        opnum,
        extent_type=extent_type,
        cellsize_type=cellsize_type,
        process_as_multiband=process_as_multiband,
    )

def Sum(
    rasters,
    extent_type="FirstOf",
    cellsize_type="FirstOf",
    ignore_nodata=False,
    process_as_multiband=None):
    """
    The Sum function adds the values of the rasters on a pixel-by-pixel basis.

    :param rasters: Required list of Rasters. If a scalar is needed for the operation, the scalar can be a float.
    :param extent_type: Optional string. Specifies the extent to be used for the function.

                        - "FirstOf" - Use the extent of the first input raster to determine the processing extent. This is the default.

                        - "IntersectionOf" - Use the extent of the overlapping pixels to determine the processing extent.

                        - "UnionOf" - Use the extent of all the rasters to determine the processing extent.

                        - "LastOf" - Use the extent of the last input raster to determine the processing extent.
    :param cellsize_type: Optional string. Specifies the cell size to be used for the function.
                          - "FirstOf" - Use the first cell size of the input rasters. This is the default.

                          - "MinOf" - Use the smallest cell size of all the input rasters.

                          - "MaxOf" - Use the largest cell size of all the input rasters.

                          - "MeanOf" - Use the mean cell size of all the input rasters.

                          - "LastOf" - Use the last cell size of the input rasters.
    :param ignore_nodata: Optional Boolean. Specifies whether NoData values are ignored in the interpolation.

                          - True : Only the cells that are have noData values will be used in calculation. This is the default.
                          - False : The cells that have noData values will be used in calculation.

    :param process_as_multiband: Optional boolean. Set to True to process as multiband.

    :return: output raster
    """
    opnum = 74 if ignore_nodata else 55
    return _Local(
        rasters,
        opnum,
        extent_type=extent_type,
        cellsize_type=cellsize_type,
        process_as_multiband=process_as_multiband,
    )

def Variety(
    rasters,
    extent_type="FirstOf",
    cellsize_type="FirstOf",
    ignore_nodata=False,
    process_as_multiband=None):
    """
    The Variety function calculates the number of unique values of a raster on a pixel-by-pixel basis.

    :param rasters: Required list of Rasters. If a scalar is needed for the operation, the scalar can be a float.
    :param extent_type: Optional string. Specifies the extent to be used for the function.

                        - "FirstOf" - Use the extent of the first input raster to determine the processing extent. This is the default.

                        - "IntersectionOf" - Use the extent of the overlapping pixels to determine the processing extent.

                        - "UnionOf" - Use the extent of all the rasters to determine the processing extent.

                        - "LastOf" - Use the extent of the last input raster to determine the processing extent.
    :param cellsize_type: Optional string. Specifies the cell size to be used for the function.
                          - "FirstOf" - Use the first cell size of the input rasters. This is the default.

                          - "MinOf" - Use the smallest cell size of all the input rasters.

                          - "MaxOf" - Use the largest cell size of all the input rasters.

                          - "MeanOf" - Use the mean cell size of all the input rasters.

                          - "LastOf" - Use the last cell size of the input rasters.
    :param ignore_nodata: Optional Boolean. Specifies whether NoData values are ignored in the interpolation.

                          - True : Only the cells that are have noData values will be used in calculation. This is the default.
                          - False : The cells that have noData values will be used in calculation.

    :param process_as_multiband: Optional boolean. Set to True to process as multiband.

    :return: output raster
    """
    opnum = 75 if ignore_nodata else 58
    return _Local(
        rasters,
        opnum,
        extent_type=extent_type,
        cellsize_type=cellsize_type,
        process_as_multiband=process_as_multiband,
    )

def Percentile(
    rasters,
    percentile_value=90,
    percentile_interpolation_type="AUTO_DETECT",
    extent_type="FirstOf",
    cellsize_type="FirstOf",
    ignore_nodata=False,
    process_as_multiband=None):
    """
    The Percentile function calculates the percentile of the inputs.

    :param rasters: Required list of Rasters. If a scalar is needed for the operation, the scalar can be a float.
    :param percentile_value: Optional float. The percentile to calculate. The default is 90, indicating the 90th percentile.
                             The values can range from 0 to 100. The 0th percentile is essentially equivalent to the minimum
                             statistic, and the 100th percentile is equivalent to maximum. A value of 50 will produce
                             essentially the same result as the median statistic.
    :param percentile_interpolation_type: Optional string. Specifies the method of interpolation to be used when
                                          the median lies between two input cell values.

                                             - AUTO_DETECT-If the input rasters are of integer pixel type, the NEAREST
                                               method is used. If the input rasters are of floating point pixel type,
                                               the LINEAR method is used. This is the default.

                                             - NEAREST-The nearest available value to the desired percentile is used.
                                               In this case, the output pixel type is the same as that of the input rasters.

                                             - LINEAR-The weighted average of the two surrounding values from the desired
                                               percentile is used. In this case, the output pixel type is floating point.
    :param extent_type: Optional string. Specifies the extent to be used for the function.

                        - "FirstOf" - Use the extent of the first input raster to determine the processing extent. This is the default.

                        - "IntersectionOf" - Use the extent of the overlapping pixels to determine the processing extent.

                        - "UnionOf" - Use the extent of all the rasters to determine the processing extent.

                        - "LastOf" - Use the extent of the last input raster to determine the processing extent.
    :param cellsize_type: Optional string. Specifies the cell size to be used for the function.
                          - "FirstOf" - Use the first cell size of the input rasters. This is the default.

                          - "MinOf" - Use the smallest cell size of all the input rasters.

                          - "MaxOf" - Use the largest cell size of all the input rasters.

                          - "MeanOf" - Use the mean cell size of all the input rasters.

                          - "LastOf" - Use the last cell size of the input rasters.
    :param ignore_nodata: Optional Boolean. Specifies whether NoData values are ignored in the interpolation.

                          - True : Only the cells that are have noData values will be used in calculation. This is the default.
                          - False : The cells that have noData values will be used in calculation.

    :param process_as_multiband: Optional boolean. Set to True to process as multiband.

    :return: output raster
    """
    opnum = 94 if ignore_nodata else 93
    return _Local(
        rasters,
        opnum,
        extent_type=extent_type,
        cellsize_type=cellsize_type,
        process_as_multiband=process_as_multiband,
        percentile_value=percentile_value,
        percentile_interpolation_type=percentile_interpolation_type)


def GeometricMedian(
    rasters,
    epsilon=0.001,
    max_iteration=10,
    extent_type="FirstOf",
    cellsize_type="FirstOf"):
    """
    Calculates the geometric median across pixels in a time series of multiband imagery.

    :param rasters: Required list of Rasters. The input multiband rasters.
    :param epsilon: Optional float. Specifies the convergence value between two
                    consecutive iterations. When epsilon is less than or equal to the
                    specified value, the iteration will stop, and the result of the
                    last iteration will be used.
    :param max_iteration: Optional int. Specifies the maximum number of iterations to complete.
                          The computation will end once this value is reached, regardless of the
                          epsilon setting.
    :param extent_type: Optional string. Specifies the extent to be used for the function.

                        - "FirstOf" - Use the extent of the first input raster to determine the processing extent. This is the default.

                        - "IntersectionOf" - Use the extent of the overlapping pixels to determine the processing extent.

                        - "UnionOf" - Use the extent of all the rasters to determine the processing extent.

                        - "LastOf" - Use the extent of the last input raster to determine the processing extent.
    :param cellsize_type: Optional string. Specifies the cell size to be used for the function.
                          - "FirstOf" - Use the first cell size of the input rasters. This is the default.

                          - "MinOf" - Use the smallest cell size of all the input rasters.

                          - "MaxOf" - Use the largest cell size of all the input rasters.

                          - "MeanOf" - Use the mean cell size of all the input rasters.

                          - "LastOf" - Use the last cell size of the input rasters.

    :return: output raster
    """

    extent_types = {"FirstOf": 0, "IntersectionOf": 1, "UnionOf": 2, "LastOf": 3}

    cellsize_types = {"FirstOf": 0, "MinOf": 1, "MaxOf": 2, "MeanOf": 3, "LastOf": 4}

    if extent_type not in list(extent_types.keys()):
        raise ValueError(
            "Invalid extent_type value. Note that operation type should be one of 'FirstOf', 'IntersectionOf', 'UnionOf', 'LastOf'")
    in_extent_type = extent_types[extent_type]

    if cellsize_type not in list(cellsize_types.keys()):
        raise ValueError(
            "Invalid cellsize_type value. Note that operation type should be one of 'FirstOf', 'MinOf', 'MaxOf', 'MeanOf', 'LastOf'")
    in_cellsize_type = cellsize_types[cellsize_type]

    template_dict = {
        "rasterFunction": "GeometricMedian",
        "rasterFunctionArguments": {},
        "variableName": "Rasters",
    }

    if in_extent_type is not None:
        template_dict["rasterFunctionArguments"]['ExtentType'] = in_extent_type
    if in_cellsize_type is not None:
        template_dict["rasterFunctionArguments"]['CellsizeType'] = in_cellsize_type

    if epsilon is not None:
        template_dict["rasterFunctionArguments"]["Epsilon"] = epsilon

    if max_iteration is not None:
        template_dict["rasterFunctionArguments"]["MaxIteration"] = max_iteration

    return Apply(rasters, template_dict['rasterFunction'], template_dict['rasterFunctionArguments'])

def EqualToFrequency(
    value_raster,
    rasters,
    extent_type="FirstOf",
    cellsize_type="FirstOf",
    process_as_multiband=None):
    """
    Evaluates on a cell-by-cell basis the number of times the values in a set of rasters are equal to another raster.

    :param value_raster: Required value raster. For each cell location in the input value raster, the number of occurrences (frequency)
                         where a raster in the input list has an equal value is counted.
    :param rasters: Required list of Rasters. The list of rasters that will be compared to the value raster.
    :param extent_type: Optional string. Specifies the extent to be used for the function.

                        - "FirstOf" - Use the extent of the first input raster to determine the processing extent. This is the default.

                        - "IntersectionOf" - Use the extent of the overlapping pixels to determine the processing extent.

                        - "UnionOf" - Use the extent of all the rasters to determine the processing extent.

                        - "LastOf" - Use the extent of the last input raster to determine the processing extent.
    :param cellsize_type: Optional string. Specifies the cell size to be used for the function.
                          - "FirstOf" - Use the first cell size of the input rasters. This is the default.

                          - "MinOf" - Use the smallest cell size of all the input rasters.

                          - "MaxOf" - Use the largest cell size of all the input rasters.

                          - "MeanOf" - Use the mean cell size of all the input rasters.

                          - "LastOf" - Use the last cell size of the input rasters.
    :param process_as_multiband: Optional boolean. Set to True to process as multiband.

    :return: output raster
    """
    opnum = 85

    if not isinstance(value_raster, list):
        value_raster = [value_raster]
    if not isinstance(rasters, list):
        rasters = [rasters]

    rasters = value_raster + rasters

    return _Local(
        rasters,
        opnum,
        extent_type=extent_type,
        cellsize_type=cellsize_type,
        process_as_multiband=process_as_multiband,
    )

def GreaterThanFrequency(
    value_raster,
    rasters,
    extent_type="FirstOf",
    cellsize_type="FirstOf",
    process_as_multiband=None):
    """
    Evaluates on a cell-by-cell basis the number of times a set of rasters is greater than another raster.

    :param value_raster: Required value raster. For each cell location in the input value raster, the number of occurrences (frequency)
                         where a raster in the input list has a greater value is counted.
    :param rasters: Required list of Rasters. The list of rasters that will be compared to the value raster.
    :param extent_type: Optional string. Specifies the extent to be used for the function.

                        - "FirstOf" - Use the extent of the first input raster to determine the processing extent. This is the default.

                        - "IntersectionOf" - Use the extent of the overlapping pixels to determine the processing extent.

                        - "UnionOf" - Use the extent of all the rasters to determine the processing extent.

                        - "LastOf" - Use the extent of the last input raster to determine the processing extent.
    :param cellsize_type: Optional string. Specifies the cell size to be used for the function.
                          - "FirstOf" - Use the first cell size of the input rasters. This is the default.

                          - "MinOf" - Use the smallest cell size of all the input rasters.

                          - "MaxOf" - Use the largest cell size of all the input rasters.

                          - "MeanOf" - Use the mean cell size of all the input rasters.

                          - "LastOf" - Use the last cell size of the input rasters.
    :param process_as_multiband: Optional boolean. Set to True to process as multiband.

    :return: output raster
    """
    opnum = 86

    if not isinstance(value_raster, list):
        value_raster = [value_raster]
    if not isinstance(rasters, list):
        rasters = [rasters]

    rasters = value_raster + rasters

    return _Local(
        rasters,
        opnum,
        extent_type=extent_type,
        cellsize_type=cellsize_type,
        process_as_multiband=process_as_multiband,
    )

def LessThanFrequency(
    value_raster,
    rasters,
    extent_type="FirstOf",
    cellsize_type="FirstOf",
    process_as_multiband=None):
    """
    Evaluates on a cell-by-cell basis the number of times a set of rasters is less than another raster.

    :param value_raster: Required value raster. For each cell location in the input value raster, the number of occurrences (frequency)
                         where a raster in the input list has a lesser value is counted.
    :param rasters: Required list of Rasters. The list of rasters that will be compared to the value raster.
    :param extent_type: Optional string. Specifies the extent to be used for the function.

                        - "FirstOf" - Use the extent of the first input raster to determine the processing extent. This is the default.

                        - "IntersectionOf" - Use the extent of the overlapping pixels to determine the processing extent.

                        - "UnionOf" - Use the extent of all the rasters to determine the processing extent.

                        - "LastOf" - Use the extent of the last input raster to determine the processing extent.
    :param cellsize_type: Optional string. Specifies the cell size to be used for the function.
                          - "FirstOf" - Use the first cell size of the input rasters. This is the default.

                          - "MinOf" - Use the smallest cell size of all the input rasters.

                          - "MaxOf" - Use the largest cell size of all the input rasters.

                          - "MeanOf" - Use the mean cell size of all the input rasters.

                          - "LastOf" - Use the last cell size of the input rasters.
    :param process_as_multiband: Optional boolean. Set to True to process as multiband.

    :return: output raster
    """
    opnum = 87

    if not isinstance(value_raster, list):
        value_raster = [value_raster]
    if not isinstance(rasters, list):
        rasters = [rasters]

    rasters = value_raster + rasters

    return _Local(
        rasters,
        opnum,
        extent_type=extent_type,
        cellsize_type=cellsize_type,
        process_as_multiband=process_as_multiband,
    )

def HighestPosition(
    rasters,
    extent_type="FirstOf",
    cellsize_type="FirstOf"):
    """
    Determines on a cell-by-cell basis the position of the raster with the maximum value in a set of rasters.

    :param rasters: Required list of Rasters. The list of input rasters for which the position of the input with the highest value will be determined.
    :param extent_type: Optional string. Specifies the extent to be used for the function.

                        - "FirstOf" - Use the extent of the first input raster to determine the processing extent. This is the default.

                        - "IntersectionOf" - Use the extent of the overlapping pixels to determine the processing extent.

                        - "UnionOf" - Use the extent of all the rasters to determine the processing extent.

                        - "LastOf" - Use the extent of the last input raster to determine the processing extent.
    :param cellsize_type: Optional string. Specifies the cell size to be used for the function.
                          - "FirstOf" - Use the first cell size of the input rasters. This is the default.

                          - "MinOf" - Use the smallest cell size of all the input rasters.

                          - "MaxOf" - Use the largest cell size of all the input rasters.

                          - "MeanOf" - Use the mean cell size of all the input rasters.

                          - "LastOf" - Use the last cell size of the input rasters.

    :return: output raster
    """
    opnum = 88

    return _Local(
        rasters,
        opnum,
        extent_type=extent_type,
        cellsize_type=cellsize_type
    )

def LowestPosition(
    rasters,
    extent_type="FirstOf",
    cellsize_type="FirstOf"):
    """
    Determines on a cell-by-cell basis the position of the raster with the minimum value in a set of rasters.

    :param rasters: Required list of Rasters. The list of input rasters for which the position of the input with the lowest value will be determined.
    :param extent_type: Optional string. Specifies the extent to be used for the function.

                        - "FirstOf" - Use the extent of the first input raster to determine the processing extent. This is the default.

                        - "IntersectionOf" - Use the extent of the overlapping pixels to determine the processing extent.

                        - "UnionOf" - Use the extent of all the rasters to determine the processing extent.

                        - "LastOf" - Use the extent of the last input raster to determine the processing extent.
    :param cellsize_type: Optional string. Specifies the cell size to be used for the function.
                          - "FirstOf" - Use the first cell size of the input rasters. This is the default.

                          - "MinOf" - Use the smallest cell size of all the input rasters.

                          - "MaxOf" - Use the largest cell size of all the input rasters.

                          - "MeanOf" - Use the mean cell size of all the input rasters.

                          - "LastOf" - Use the last cell size of the input rasters.

    :return: output raster
    """
    opnum = 89

    return _Local(
        rasters,
        opnum,
        extent_type=extent_type,
        cellsize_type=cellsize_type
    )

def Popularity(
    popularity_raster,
    rasters,
    extent_type="FirstOf",
    cellsize_type="FirstOf",
    process_as_multiband=None):
    """
    Determines the value in an argument list that is at a certain level of popularity on a cell-by-cell basis.
    The particular level of popularity (the number of occurrences of each value) is specified by the first argument.

    :param popularity_raster: Required popularity raster. The input raster that defines the popularity position to be returned.
    :param rasters: Required list of Rasters. The list of input rasters used to evaluate the popularity of the values for each cell location.
    :param extent_type: Optional string. Specifies the extent to be used for the function.

                        - "FirstOf" - Use the extent of the first input raster to determine the processing extent. This is the default.

                        - "IntersectionOf" - Use the extent of the overlapping pixels to determine the processing extent.

                        - "UnionOf" - Use the extent of all the rasters to determine the processing extent.

                        - "LastOf" - Use the extent of the last input raster to determine the processing extent.
    :param cellsize_type: Optional string. Specifies the cell size to be used for the function.
                          - "FirstOf" - Use the first cell size of the input rasters. This is the default.

                          - "MinOf" - Use the smallest cell size of all the input rasters.

                          - "MaxOf" - Use the largest cell size of all the input rasters.

                          - "MeanOf" - Use the mean cell size of all the input rasters.

                          - "LastOf" - Use the last cell size of the input rasters.
    :param process_as_multiband: Optional boolean. Set to True to process as multiband.

    :return: output raster
    """
    opnum = 90

    if not isinstance(popularity_raster, list):
        popularity_raster = [popularity_raster]
    if not isinstance(rasters, list):
        rasters = [rasters]

    rasters = popularity_raster + rasters

    return _Local(
        rasters,
        opnum,
        extent_type=extent_type,
        cellsize_type=cellsize_type,
        process_as_multiband=process_as_multiband,
    )

def Rank(
    rank_raster,
    rasters,
    extent_type="FirstOf",
    cellsize_type="FirstOf",
    process_as_multiband=None):
    """
    Ranks on a cell-by-cell basis the values from a set of input rasters and determines which values are returned based on the value of the rank input raster..

    :param rank_raster: Required rank raster. The input raster that defines the rank position to be returned.
    :param rasters: Required list of Rasters. The list of input rasters from which the cell value of the raster at the specified rank position will be obtained.
    :param extent_type: Optional string. Specifies the extent to be used for the function.

                        - "FirstOf" - Use the extent of the first input raster to determine the processing extent. This is the default.

                        - "IntersectionOf" - Use the extent of the overlapping pixels to determine the processing extent.

                        - "UnionOf" - Use the extent of all the rasters to determine the processing extent.

                        - "LastOf" - Use the extent of the last input raster to determine the processing extent.
    :param cellsize_type: Optional string. Specifies the cell size to be used for the function.
                          - "FirstOf" - Use the first cell size of the input rasters. This is the default.

                          - "MinOf" - Use the smallest cell size of all the input rasters.

                          - "MaxOf" - Use the largest cell size of all the input rasters.

                          - "MeanOf" - Use the mean cell size of all the input rasters.

                          - "LastOf" - Use the last cell size of the input rasters.
    :param process_as_multiband: Optional boolean. Set to True to process as multiband.

    :return: output raster
    """
    opnum = 91

    if not isinstance(rank_raster, list):
        rank_raster = [rank_raster]
    if not isinstance(rasters, list):
        rasters = [rasters]

    rasters = rank_raster + rasters

    return _Local(
        rasters,
        opnum,
        extent_type=extent_type,
        cellsize_type=cellsize_type,
        process_as_multiband=process_as_multiband,
    )

def RegionPixelCount(raster, max_region_size=100, pixel_neighborhood=4):
    """
    The RegionPixelCount function returns an image where each pixel contains the number of pixels within a connected region.

    :param raster: Required input raster.
    :param max_region_size: Optional int. The maximum number of pixels a region can contain. The default is 100.
    :param pixel_neighborhood: Optional int. The number of neighborhoods to be used (4 or 8) when assessing pixel connectivity. The default is 4.

    :return: output raster
    """
    template_dict = {
        "rasterFunction": "RegionPixelCount",
        "rasterFunctionArguments": {}
    }

    pixel_neighborhood_types = {
        4: 0,
        8: 1
    }

    if isinstance(pixel_neighborhood, int) and pixel_neighborhood in pixel_neighborhood_types:
        in_pixel_neighborhood = pixel_neighborhood_types[pixel_neighborhood]
    else:
        raise ValueError("Invalid pixel_neighborhood. pixel_neighborhood should be 4 or 8")


    if max_region_size is not None:
        template_dict["rasterFunctionArguments"]['MaxRegionSize'] = max_region_size

    if pixel_neighborhood is not None:
        template_dict["rasterFunctionArguments"]['PixelNeighborhood'] = in_pixel_neighborhood

    return Apply(in_raster=raster, raster_function=template_dict["rasterFunction"],
                 raster_function_arguments=template_dict["rasterFunctionArguments"])

def Gradient(raster, gradient_dimension="X", denominator_unit="DEFAULT"):
    """

    Compute gradient along a specified dimension

    :param raster: Required input raster.
    :param gradient_dimension: Optional string.
                               The dimensions that are available to calculate gradient on.

                               For non-multidimensional input, X, Y and XY are available.

                               For multidimensional input, X, Y and XY and all dimensions in the data are available.
                               If there are two or more dimensions, gradient will be calculated on the gradient dimension
                               for all slices in other dimensions.

                               XY option outputs a 3-band raster where band 1 represents the gradient along X dimension
                               and bands 2 and 3 represents the gradient along Y dimension.
    :param denominator_unit: Optional string. The default is "DEFAULT".
                             The unit of the denominator. Depends on the selected Gradient Dimension.

                             For X, Y, XY, the options are:
                                - DEFAULT - Output is the difference between adjacent cells. This is the default.
                                - CELLSIZE - Output is the difference between adjacent cells divided by the cellsize
                                             of the input. The output unit is the same as the unit of the X/Y coordinates
                                             of the input. If the data is in a geographic coordinate system,
                                             it will be converted to meters.
                             For StdTime, the options are:
                                - DEFAULT - Output is the difference between adjacent slices. This is the default.
                                - PER_HOUR - Output is the difference between adjacent slices divided by the difference
                                             between their time values and converted to per hour rate.
                                - PER_DAY - Output is the difference between adjacent slices divided by the difference
                                            between their time values and converted to per day rate.
                                - PER_MONTH - Output is the difference between adjacent slices divided by the
                                              difference between their time values and converted to per month rate.
                                - PER_YEAR - Output is the difference between adjacent slices divided by the
                                             difference between their time values and converted to per year rate.
                                - PER_DECADE - Output is the difference between adjacent slices divided by the difference
                                               between their time values and converted to per decade rate.
                            For non-time dimension, the options are:
                                - DEFAULT - Output is the difference between adjacent slices. This is the default.
                                - DIMENSION_INTERVAL - Output is the difference between adjacent slices divided by
                                                       the difference between their dimension values.

    :return: output raster
    """
    template_dict = {
        "rasterFunction": "Gradient",
        "rasterFunctionArguments": {}
    }

    if gradient_dimension is not None:
        template_dict["rasterFunctionArguments"]['GradientDimension'] = gradient_dimension


    denominator_unit_list = [
        "DEFAULT",
        "CELLSIZE",
        "PER_HOUR",
        "PER_DAY",
        "PER_MONTH",
        "PER_YEAR",
        "PER_DECADE",
        "DIMENSION_INTERVAL",
    ]
    if denominator_unit is not None:
        if denominator_unit.upper() not in denominator_unit_list:
            raise RuntimeError(
                "denominator_unit should be one of the following "
                + str(denominator_unit_list)
            )
        template_dict["rasterFunctionArguments"]["DenominatorUnit"] = denominator_unit.upper()

    return Apply(in_raster=raster, raster_function=template_dict["rasterFunction"],
                 raster_function_arguments=template_dict["rasterFunctionArguments"])


def SubsetBands(raster, method="BY_IDS", bands=None, missing_band_action="BestMatch"):
    """
    The SubsetBands function allows you to extract bands from a raster by individual values or by ranges (extraction by range is not supported for band name), 
    and it can reorder the bands in a multiband image.

    Parameters:
      raster(Raster): Input raster
      method(string): Method to use for extracting and subsetting bands. Default is BY_IDS
                      - BY_NAMES - Use band names to identify and subset bands for extraction.
                      - BY_WAVELENGTHS - Use band wavelengths on the electromagnetic spectrum to identify and subset bands for extraction.
                      - BY_IDS - Use the band designation or sequence number to identify and subset bands for extraction.
      bands(string, range):  The bands to extract based on the method parameter option used. For example,
                            -  If BY_NAMES, bands can be  'band_15 band_13 band_14'.
                            -  If BY_WAVELENGTHS, bands can be '400-700 900'
                            -  If BY_IDS, bands can be '100 105 110 120-130'. Values will be minus by 1 for 0-based index.
      missing_band_action(int): Specify the action that will occur when a band within the extract band list is not available.
                                - BestMatch - Finds the best available band to use in place of the missing band based on wavelength.
                                - Fail - If the input dataset is missing any band specified in the Combination parameter, the function will fail.

    Returns:
      output_raster(Raster): The output raster with this function applied to it
    """
    
    # check method valid or not
    method_types = {
            'BY_IDS': 0,
            'BY_WAVELENGTHS': 1,
            'BY_NAMES':2
        }       
    if (not isinstance(method, str)) \
        or isinstance(method, str) and method.upper() not in list(method_types.keys()):
        raise ValueError("method value is invalid. Note that method should be one of 'BY_IDS', 'BY_WAVELENGTHS' or 'BY_NAMES'")
            
    # check missing_band_action valid or not
    missing_band_actions = {"BESTMATCH": 0, "FAIL": 1}
    if (not isinstance(missing_band_action, str)) \
        or isinstance(missing_band_action, str) \
        and missing_band_action.upper() not in list(missing_band_actions.keys()):
        raise ValueError("missing_band_action value is invalid. Note that missing_band_action should be either 'BestMatch' or 'Fail'")

    template_dict = {
        "rasterFunction": "SubsetBands",
        "rasterFunctionArguments": {}
    }

    if bands is not None:          
        if isinstance(bands, str):
            if ',' in bands:
                raise ValueError("Invalid separator. Only space and ';' are allowed.")
                
            if method.upper() == "BY_IDS":
                separator = ';' if ';' in bands else ' '
                parts = bands.split(separator)
                
                new_parts = []
                for part in parts:
                    if '-' in part:
                        start, end = map(int, part.split('-'))
                        new_parts.append(f"{start-1}-{end-1}")
                    else:
                        new_parts.append(str(int(part)-1))
                        
                bands = separator.join(new_parts).replace(' ;', ';')
        else:
            raise TypeError("bands should be a single string that includes individual band IDs or band wavelengths, or band names. Band IDs and band wavelengths can be in ranges too.")
            
        template_dict["rasterFunctionArguments"]["Bands"] = bands    

    if method is not None: 
        template_dict["rasterFunctionArguments"]['Method'] = method_types[method.upper()]      

    if missing_band_action is not None:
        template_dict["rasterFunctionArguments"]["MissingBandAction"] = missing_band_actions[missing_band_action.upper()]

    return Apply(in_raster=raster,
                 raster_function=template_dict["rasterFunction"],
                 raster_function_arguments=template_dict["rasterFunctionArguments"])

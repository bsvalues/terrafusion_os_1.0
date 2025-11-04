"""Contains helper functions for correctly handling input and output in different spatial references, particularly when
dealing with feature datasets. This is a shared module designed to be used by any script-based tools that need it.
"""

from typing import Optional, Union

import arcpy
from arcpy._mp import Layer as mp_layer  # noqa. pylint: disable=import-error


def determine_output_spatial_ref(
    output_workspace_or_fc: str, default_sr: arcpy.SpatialReference
) -> arcpy.SpatialReference:
    """Determine what the output's spatial reference should be.

    If the output location is a feature dataset, or the user has passed an existing feature class whose spatial
    reference we need to match, use the spatial reference of the feature dataset or feature class. Otherwise, check if
    the outputCoordinateSystem environment is set and use that, or, finally, fall back to the caller's default spatial
    reference.

    Args:
        output_workspace_or_fc (str): Location where the output will be put (gdb, folder, feature dataset, etc.) OR the
            full path of the an existing feature class with a spatial reference we want to match.
        default_sr (arcpy.SpatialReference): Default spatial reference to use if no other constraints are required.

    Returns:
        arcpy.SpatialReference: Spatial reference to use for the output.
    """
    # If the output location is a feature dataset, or the input to this function is an existing feature class whose
    # spatial reference we need to match, we have to match the coordinate system of the feature dataset.
    desc_output = arcpy.Describe(output_workspace_or_fc)
    if hasattr(desc_output, "spatialReference"):
        return desc_output.spatialReference
    # Otherwise, if the environment is set, use that.
    if arcpy.env.outputCoordinateSystem:  # pylint: disable=no-member
        return arcpy.env.outputCoordinateSystem  # pylint: disable=no-member
    # Otherwise, use the user's desired default spatial reference
    return default_sr


def get_datum_transformation(in_sr: arcpy.SpatialReference, out_sr: arcpy.SpatialReference,
                             extent: Union[arcpy.Extent, str, mp_layer, None] = None) -> Union[str, None]:
    """Determine the correct transformation to use between the input and output spatial references.

    Args:
        in_sr (arcpy.SpatialReference): The spatial reference of the input data that will be transformed.
        out_sr (arcpy.SpatialReference): The spatial reference desired for the output data.
        extent (Union[arcpy.Extent, str, mp_layer], optional): [description]. Defaults to None. Extent object, feature
        class catalog path, or layer object defining the extent to use when determining the best transformation.

    Returns:
        str: The transformation to use in the Project tool or cursors.
    """
    # ListTransformations lists, in order of best accuracy, the datum transformations that should be used when
    # projecting one coordinate system to another.  Return the first one (the best one), if any are recommended.
    transformations = arcpy.ListTransformations(in_sr, out_sr, extent)
    if transformations:
        return transformations[0]
    return None

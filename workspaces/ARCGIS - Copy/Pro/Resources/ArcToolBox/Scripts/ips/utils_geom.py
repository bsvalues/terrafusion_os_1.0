from itertools import chain
from typing import Tuple, List, Iterable, Union

import arcgis.geometry
import arcpy
import ips.const as c
import numpy as np
import pandas as pd


def xy2point_geometry(
        x: float, y: float,
        spatial_reference: arcpy.SpatialReference) -> arcpy.PointGeometry:
    """Converts a 2D point into a Point Geometry object

    Args:
        x: x-coordinate
        y: y-coordinate
        spatial_reference: coordinate reference system

    Returns: an arcpy.PointGeometry object representation of the given coordinates

    """
    return arcpy.PointGeometry(arcpy.Point(X=x, Y=y),
                               spatial_reference=spatial_reference)


def legacy_df2wgs84_sdf(
        legacy_df: pd.DataFrame,
        origin: arcpy.PointGeometry,
        azimuth_x_axis: float = 90.,
        x_col: str = 'x',
        y_col: str = 'y') -> pd.DataFrame:
    """Converts a legacy dataframe using the legacy xy coordinates to a dataframe using WGS84 coordinates.

    Args:
        legacy_df: the dataframe containing the legacy xy coordinates
        origin: origin of the legacy CRS (in WGS84 coordinates)
        azimuth_x_axis: azimuth of the legacy CRS in degrees
        x_col: the dataframe column containing the x coordinate
        y_col: the dataframe column containing the y coordinate

    Returns:
        Spatial dataframe using WGS84 coordinates

    """

    # work on a copy of the df to fix #674
    legacy_df_copy = legacy_df.copy(deep=True)
    if legacy_df_copy.spatial.name:
        legacy_df_copy.drop(columns=[legacy_df_copy.spatial.name], inplace=True)
    geom_sr = legacy_df.apply(lambda point: arcgis.geometry.Geometry(legacy2wgs84_point(
        xy=(point[x_col], point[y_col]), origin=origin, azimuth_x_axis=azimuth_x_axis)), axis=1)

    # set the SHAPE column of the spatial dataframe
    legacy_df_copy.spatial.set_geometry(geom_sr, sr=4326)

    return legacy_df_copy


def legacy2wgs84_point(xy: Tuple[float, float],
                       origin: arcpy.PointGeometry,
                       azimuth_x_axis: float = 90.) -> arcpy.Point:
    """Converts a legacy point to WGS84

    Args:
        xy: legacy point coordinates, shape (nx2)
        origin: the origin of the legacy CRS expressed in WGS84
        azimuth_x_axis: the azimuth (angle from the north direction)
            of the x-axis of the legacy CRS

    Returns: converted point

    """
    return origin.pointFromAngleAndDistance(
        angle=np.degrees(np.arctan2(xy[1], xy[0])) + azimuth_x_axis,
        distance=np.sqrt(xy[0] ** 2 + xy[1] ** 2),
        method='GEODESIC')


def lonlat2legacy_xy(lonlat_array: np.ndarray,
                     origin_wgs84: arcpy.PointGeometry,
                     azimuth_x_axis: float = 90):
    """converts wgs84 coordinates to legacy coordinates

    Args:
        lonlat_array: (nx2) array of wgs84 coordinates, lon and lat
        origin_wgs84: the origin of the legacy CRS expressed in WGS84
        azimuth_x_axis: the azimuth in degrees (angle from the north direction)
            of the x-axis of the legacy CRS

    Returns:
        (nx2) array of xy coordinates expressed in the legacy CRS

    """

    azimuths = []
    distances = []
    for lon, lat in lonlat_array:
        pt_destin = arcpy.PointGeometry(arcpy.Point(lon, lat), c.WGS84_SR)
        azimuth, distance = origin_wgs84.angleAndDistanceTo(pt_destin)
        azimuths.append(azimuth)
        distances.append(distance)
    alpha = np.deg2rad(azimuths) - np.deg2rad(azimuth_x_axis)
    legacy_x = np.cos(alpha) * distances
    legacy_y = np.sin(alpha) * distances

    return np.vstack((legacy_x, legacy_y)).T


def legacy_xy2lonlat(xy: np.ndarray,
                     origin_wgs84: arcpy.PointGeometry,
                     azimuth_x_axis: float = 90) -> np.ndarray:
    """Converts legacy xy coordinates array to WGS84 longitude, latitude array.

    Args:
        xy: (nx2) array of legacy coordinates
        origin_wgs84: the origin of the legacy CRS expressed in WGS84
        azimuth_x_axis: the azimuth in degrees (angle from the north direction)
            of the x-axis of the legacy CRS

    Returns:
        (nx2) array of lon lat coordinates expressed in WGS84

    """
    lonlat_array = []
    for xy_point in xy:
        point = legacy2wgs84_point(xy=xy_point, origin=origin_wgs84, azimuth_x_axis=azimuth_x_axis)
        lonlat_array.append([point.firstPoint.X, point.firstPoint.Y])
    return np.array(lonlat_array)


def poly_geoms2vertex_array(
        poly_geoms: Iterable[Union[arcgis.geometry.Polygon, arcgis.geometry.Polyline]],
        geom_type: str) -> Tuple[np.ndarray, List[List[Tuple[int, int]]]]:
    """Transform an polygon or polyline arcgis.Geometry into a vertex_array.
    It also returns a list of lists of pairs of integers representing the indices of
    the vertex array where each geometry part starts and ends.

    Returns (feature) list of (feature part) lists of (part vertices) from the given list of vertex-sequence features.
    Vertex-sequence features are either polylines or polygons

    Args:
        poly_geoms (list): a list of features
        geom_type (str): the type of the feature geometry (either 'polyline' or 'polygon')

    Returns:
        - vertex_array (nx2) numpy of vertex coordinates
        - geom_part_idxs:
                    [ # all geometries
                        [ # geom1
                            (start_idx, stop_idx),  # part1
                            (start_idx, stop_idx),  # part2
                            ...
                        ],
                        [ # geom2
                            (start_idx, stop_idx),  # part1
                            (start_idx, stop_idx),  # part2
                            ...
                        ],
                        ...
                    ]
    """

    geom_type = geom_type.lower()
    if geom_type not in ('polyline', 'polygon'):
        raise ValueError('Only accepts polygons or polylines')

    # in arcgis geometries a geometry part is called either "ring" (if we are handling polygons)
    # or a "path" (if handling polylines)
    # map the geom type to corresponding part name
    part_name = 'paths' if geom_type == 'polyline' else 'rings'

    xy = []
    geom_part_idxs = []
    start_idx = 0
    for geom in poly_geoms:
        # list of start/end indices for the parts of this geometry
        geom_idx = []
        for part in getattr(geom, part_name, []):
            # compute the start and end indices of this geometry part
            part_start_idx = start_idx
            part_end_idx = start_idx + len(part)
            geom_idx.append((part_start_idx, part_end_idx))
            # advanced the start index for the next part
            start_idx = part_end_idx
            for vertex in part:
                # extract x, y
                # NOTE: some geoms may have also z and m coords,
                # so we need to retrieve only the first 2 elements of the vertex
                xy.append(vertex[:2])

        # append the list of start/end indices to the parent list
        geom_part_idxs.append(geom_idx)

    return np.array(xy), geom_part_idxs


def side_direction(segment: np.ndarray,
                   side: int) -> np.ndarray:
    """Given a segment and a side, returns a direction vector.
    That is a unit vector orthogonal to the segment and pointing on the given side of the segment

    Args:
        segment: [x0, y0, x1, y1]
        side: the side of the segment; can be either ips.const.LEFT or ips.const.RIGHT

    Returns: direction vector

    """
    segment_start = segment[:2]
    segment_end = segment[2:]

    segment_vector = segment_end - segment_start
    segment_direction = segment_vector / np.linalg.norm(segment_vector)

    perpendicular_vector = np.array([-segment_direction[1], segment_direction[0]])

    return perpendicular_vector * side


# TODO: this function needs to be renamed to something easier to understand.
#  Eg. legacy_project_poly_sdf (same as legacy_project_point_df) and we flip the behavior of the reverse param.
def transform_poly_df(sdf: pd.DataFrame,
                      origin: arcpy.PointGeometry,
                      azimuth_x_axis=90,
                      reverse=False):
    """performs a fake web mercator projection. In reality, the input WGS84 geometries are
    projected to the legacy CRS, but those are stored back into the dataframe and we pretend
    that they are expressed in web mercator. In this way we can continue using the spatial dataframe
    functionalities.

    During the projection process a vertex_array for each geometry part is computed.
    Those are also stored in the dataframe for later use.

    Args:
        sdf: a spatial DataFrame in WGS84
        origin: the origin of the legacy CRS in WGS84
        azimuth_x_axis: the azimuth in degrees (angle from the north direction)
            of the x-axis of the legacy CRS
        reverse: False for transformation WGS84 -> Legacy CRS
                 True for transformation Legacy CRS -> WGS84

    Returns: legacy-projected spatial dataframe enriched with a vertex_array column

    """
    if not getattr(sdf, 'spatial', False):
        raise ValueError('Only accepts spatial dataframes')

    if reverse:
        if sdf.spatial.sr['latestWkid'] != 3857:
            raise ValueError('Only accepts Web Mercator (Fake) spatial dataframes')
    else:
        if sdf.spatial.sr['wkid'] != 4326:
            raise ValueError('Only accepts WGS84 spatial dataframes')

    geom_type = sdf.spatial.geometry_type[0]
    if geom_type not in ('polyline', 'polygon'):
        raise ValueError('Only accepts polygons or polylines')

    # In arcgis, a geometry part is called
    # either "ring" (if we are handling polygons)
    # or a "path" (if handling polylines).
    # Map the geom type to corresponding part name and geometry class
    geom_class, part_name = (arcgis.geometry.Polygon, 'rings') if geom_type == 'polygon' \
        else (arcgis.geometry.Polyline, 'paths')

    # get a latlon vertex array and the geometry indices
    # necessary to reconstruct the geometries later on
    lonlat_or_xy_array, geom_part_idxs = poly_geoms2vertex_array(
        poly_geoms=sdf.SHAPE,
        geom_type=geom_type)

    if reverse:
        target_spatial_reference = {'wkid': 4326, 'latestWkid': 4326}
        # xy_or_lonlat_array = arcgis.geometry.Geometry(legacy2wgs84_point(
        # xy=(point[x_col], point[y_col]), origin=origin, azimuth_x_axis=azimuth_x_axis)), axis=1)
        xy_or_lonlat_array = legacy_xy2lonlat(xy=lonlat_or_xy_array,
                                              origin_wgs84=origin,
                                              azimuth_x_axis=azimuth_x_axis)

    else:
        target_spatial_reference = {'wkid': 3857, 'latestWkid': 3857}
        # project wgs84 coords to legacy coords
        xy_or_lonlat_array = lonlat2legacy_xy(lonlat_array=lonlat_or_xy_array,
                                              origin_wgs84=origin,
                                              azimuth_x_axis=azimuth_x_axis)

    geom_vertex_arrays = []
    geoms = []
    for geom in geom_part_idxs:

        vertex_arrays = []
        parts = []
        for part_idxs in geom:
            part_vertex_array = xy_or_lonlat_array[part_idxs[0]:part_idxs[1], :]

            # save the raw vertex_array, so we won't have to recompute it later
            vertex_arrays.append(part_vertex_array)

            # append the part vertices to the list of parts of this geom
            parts.append(part_vertex_array.tolist())

        # append the geom vertex arrays to the parent list
        geom_vertex_arrays.append(vertex_arrays)

        # create a geometry object of the appropriate type and
        # append it to the geometry list
        geoms.append(geom_class({
            'hasZ': False,
            f'{part_name}': parts,
            'spatialReference': target_spatial_reference
        }))

    # work on a copy to avoid #674
    sdf_copy = sdf.copy(deep=True)
    if sdf_copy.spatial.name:
        sdf_copy.drop(columns=[sdf_copy.spatial.name], inplace=True)
    sdf_copy[c.SDF_VERTEX_ARRAY_COLUMN] = geom_vertex_arrays

    # transform the geometry list into a series
    geom_sr = pd.Series(geoms)

    # set the SHAPE column of the spatial dataframe
    sdf_copy.spatial.set_geometry(geom_sr, target_spatial_reference['latestWkid'])
    return sdf_copy


def extract_z_values(geometry: Union[arcgis.geometry.Polygon, arcgis.geometry.Polyline]) -> float:
    """
    Extracts the coordinates from the Polygon or Polyline as numpy array and then find the most frequently occurring
    z-value
    Args:
        geometry: Polygon or Polyline geometry

    Returns:
        most frequently occurring z-value
    """

    # Dynamic size requirement using Python lists
    try:
        if geometry.has_z:
            return most_frequent_element(get_geometry_coordinates(geometry)[:, -1])
        else:
            return 0
    except Exception:
        return 0



def most_frequent_element(array) -> float:
    # Get the unique elements and their counts
    unique_elements, counts = np.unique(array, return_counts=True)

    # Get the index of the element with the highest count
    most_frequent_index = np.argmax(counts)

    # Return the element with the highest count
    return unique_elements[most_frequent_index]


def get_geometry_coordinates(geometry: Union[arcgis.geometry.Polygon, arcgis.geometry.Polygon]) -> np.array:
    """
    Extract the coordinates from the rings of polygon or from the paths of polyline

    Args:
        geometry: arcgis Polygon or arcgis Polyline
    Returns:
        Numpy array of coordinates

    """
    if "rings" in geometry.JSON:
        return np.array(list(chain.from_iterable(geometry.rings)))
    if "paths" in geometry.JSON:
        return np.array(list(chain.from_iterable(geometry.paths)))

    return np.array([])

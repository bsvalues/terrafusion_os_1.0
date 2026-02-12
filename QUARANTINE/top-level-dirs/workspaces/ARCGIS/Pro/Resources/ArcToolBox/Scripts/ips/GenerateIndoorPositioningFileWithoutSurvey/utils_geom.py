from enum import Enum
from typing import Tuple, Iterable

import arcpy
import indoorsdatapy.algorithms.hexgrid as indoor_h
import ips.const as c
import ips.utils_geom as u_geom
import ips.validation as v
import numpy as np
import pandas as pd
from arcgis.geometry import Point

DEFAULT_CELL_DIST: float = 1.5
DEFAULT_CELL_SIZE: float = DEFAULT_CELL_DIST / indoor_h.HexCell.SQRT3


class HexCellOrientation(Enum):
    POINTY = 'pointy'  # pointy topped hex cells
    FLAT = 'flat'  # flat topped hex cells


def make_hex_grid(
        bbox: Tuple[float, float, float, float],
        cell_dist: float = DEFAULT_CELL_DIST,
        cell_orientation: HexCellOrientation = HexCellOrientation.FLAT
) -> np.ndarray:
    """
    Returns the centers of the cells of a hexagonal grid covering the given
    bounding box

    Args:
        bbox: coordinates of bounding box: [x_min, y_min, x_max, y_max]
        cell_dist: distance between centers of neighbouring cells
        cell_orientation: either 'flat' or 'pointy' as explained here:
                          https://www.redblobgames.com/grids/hexagons/

    Returns:
        An array of xy grid-points, shape (n, 2)

    """
    x_min, y_min, x_max, y_max = bbox
    hor_step, ver_step = get_hex_grid_steps(cell_dist=cell_dist,
                                            orientation=cell_orientation)

    # how many columns fit in the bbox?
    n_cols = int(np.floor((x_max - x_min) / hor_step) + 2)
    # how many rows fit in the bbox?
    n_rows = int(np.floor(y_max - y_min) / ver_step + 2)

    row_idx_array, col_idx_array = np.indices((n_rows, n_cols))
    x_array = col_idx_array * hor_step + x_min
    y_array = row_idx_array * ver_step + y_min
    # we need to raise every other column by half of the vertical step
    y_array[:, 1::2] += ver_step / 2.
    return np.vstack((x_array.ravel(), y_array.ravel())).T


def get_hex_grid_steps(
        cell_dist: float = DEFAULT_CELL_DIST,
        orientation: HexCellOrientation = HexCellOrientation.FLAT
) -> Tuple[float, float]:
    """
    Returns the horizontal and vertical distances (steps) between columns and
    rows of a hex grid

    Args:
        cell_dist: distance between centers of neighbouring cells
        orientation: either 'flat' or 'pointy' as explained here:
                    https://www.redblobgames.com/grids/hexagons/

    Returns:
        A tuple of (hor_step, ver_step).

    """
    if orientation == HexCellOrientation.FLAT:
        hor_step = cell_dist * np.sqrt(3) / 2.
        ver_step = cell_dist
    else:  # pointy type
        hor_step = cell_dist / 2.
        ver_step = cell_dist * np.sqrt(3)

    return hor_step, ver_step


def point2seg_squared_dist(p_x: np.array, p_y: np.array, s0_x: np.array,
                           s0_y: np.array, s1_x: np.array,
                           s1_y: np.array) -> np.array:
    """
    Vectorized function returning point-to-segment squared distance

    Args:
        p_x: array of point x-coordinates
        p_y: array of point y-coordinates
        s0_x: array of segment first extreme x-coordinates
        s0_y: array of segment first extreme y-coordinates
        s1_x: array of segment second extreme x-coordinates
        s1_y: array of segment second extreme y-coordinates

    Returns:
        Point-to-segment squared distances.

    """
    l2 = (s1_x - s0_x) ** 2 + (s1_y - s0_y) ** 2
    t = ((p_x - s0_x) * (s1_x - s0_x) + (p_y - s0_y) * (s1_y - s0_y)) / l2
    t = np.clip(t, 0., 1.)
    proj_point_x = s0_x + t * (s1_x - s0_x)
    proj_point_y = s0_y + t * (s1_y - s0_y)

    return (proj_point_x - p_x) ** 2 + (proj_point_y - p_y) ** 2


def calculate_legacy_origin(
        feature_df: pd.DataFrame,
        boundary_buffer_scale=5e-3) -> Tuple[float, float]:
    """
    Calculates the origin latitude and longitude (including a small buffer).
    The coordinate system should be in WGS84 (4326)

    Args:
        feature_df: a dataframe with a shape column for geometry
        boundary_buffer_scale: default value is 5e-3

    Returns:
        A tuple with the most northern latitude and most western longitude

    """
    full_extent = feature_df.spatial.full_extent
    most_northern_lat = max(full_extent[1], full_extent[3])
    most_western_lon = min(full_extent[0], full_extent[2])
    most_eastern_lon = max(full_extent[0], full_extent[2])

    # scale boundary buffer with lat, because this determines
    # ratio meter to degree
    buffer = 1. / abs(most_northern_lat) * boundary_buffer_scale if abs(
        most_eastern_lon) > 1 else boundary_buffer_scale

    return most_northern_lat + buffer, most_western_lon - buffer


def vertex_array2segment_array(
        vertex_array: np.ndarray,
        close: bool = False) -> np.ndarray:
    """
    Converts a vertex array (nx2) to a segment array (nx4).

    Args:
        vertex_array: the vertex array to be converted
        close: if True, enforce closure -> make sure there is a segment
               connecting last and first vertex

    Returns:
        The segment array as numpy array with shape (nx4).

    """
    if vertex_array.shape[1] != 2:
        raise v.ArrayShapeMismatchError(expected_shape='(nx2)')

    segment_array = np.hstack([vertex_array[:-1], vertex_array[1:]])

    if close and not all(vertex_array[0, :] == vertex_array[-1, :]):
        segment_array = np.vstack(
            [segment_array,
             np.hstack([vertex_array[-1], vertex_array[0]])])

    return segment_array


def legacy_project_point_df(sdf: pd.DataFrame,
                            origin: arcpy.PointGeometry,
                            azimuth_x_axis=90):
    """performs a fake web mercator projection. In reality, the input WGS84 geometries are
    projected to the legacy CRS, but those are stored back into the dataframe and we pretend
    that they are expressed in web mercator. In this way we can continue using the spatial dataframe
    functionalities.

    Args:
        sdf: a spatial DataFrame in WGS84
        origin: the origin of the legacy CRS in WGS84
        azimuth_x_axis: the azimuth in degrees (angle from the north direction)
            of the x-axis of the legacy CRS

    Returns: legacy-projected spatial dataframe

    """

    if not getattr(sdf, 'spatial', False):
        raise ValueError('Only accepts spatial dataframes')

    if sdf.spatial.sr['wkid'] != 4326:
        raise ValueError('Only accepts WGS84 spatial dataframes')

    if sdf.spatial.geometry_type[0] != 'point':
        raise ValueError('Only accepts points')

    # get a latlon vertex array and the geometry indices
    # necessary to reconstruct the geometries later on
    lonlat_array = np.array([[point.x, point.y] for point in sdf.SHAPE])

    # project wgs84 coords to legacy coords
    xy_array = u_geom.lonlat2legacy_xy(lonlat_array=lonlat_array,
                                       origin_wgs84=origin,
                                       azimuth_x_axis=azimuth_x_axis)
    geom_sr = pd.Series([Point({
        'hasZ': False,
        'x': xy[0],
        'y': xy[1],
        'spatialReference': {'wkid': 3857,
                             'latestWkid': 3857}
    }) for xy in xy_array])

    # work on a copy to avoid #674
    sdf_copy = sdf.copy(deep=True)
    if sdf_copy.spatial.name:
        sdf_copy.drop(columns=[sdf_copy.spatial.name], inplace=True)

    # set the SHAPE column of the spatial dataframe
    sdf_copy.spatial.set_geometry(geom_sr)
    return sdf_copy


def legacy_project_poly_df(sdf: pd.DataFrame,
                           origin: arcpy.PointGeometry,
                           azimuth_x_axis=90):
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

    Returns: legacy-projected spatial dataframe enriched with a vertex_array column

    """
    return u_geom.transform_poly_df(sdf=sdf,
                                    origin=origin,
                                    azimuth_x_axis=azimuth_x_axis,
                                    reverse=False)


def push_beacons_from_walls(beacon2wall_oids: Iterable[Tuple[int, int]],
                            beacons_df: pd.DataFrame,
                            walls_df: pd.DataFrame,
                            distance: float):
    """Moves the beacons located on a wall away from the wall by the given distance. The moved beacon is
    guaranteed to be outside the wall polygon

    Args:
        beacon2wall_oids: iterable of beacon, wall object ids to be treated
        beacons_df: dataframe containing the beacon data
        walls_df: dataframe containing the wall data
        distance: the distance the beacons will be moved

    Returns:

    """
    for beacon_oid, wall_oid in beacon2wall_oids:
        # retrieve the actual wall and beacon from the full dataframes
        wall = walls_df[walls_df[c.OBJECT_ID_FIELD_NAME] == wall_oid].iloc[0]
        beacon = beacons_df[beacons_df[c.OBJECT_ID_FIELD_NAME] == beacon_oid].iloc[0]

        # the geometry of a wall is either a polygon or a multipolygon.
        # In either case it consists of a list of linear rings,
        # which we stored in the sdf as a list of vertex_arrays.
        wall_rings = wall[c.SDF_VERTEX_ARRAY_COLUMN]

        # the geometry of a beacon is a single point, create an array object from it
        beacon_vertex = np.array([beacon.SHAPE['x'], beacon.SHAPE['y']])

        # create a list to store the segment of each wall part (ring) that is
        # closest to the beacon. This is a list of pairs (segment_index, squared_distance)
        closest_segment_idxs = []
        closest_dists = []
        for ring in wall_rings:
            # transform the vertex array (nx2) in a segment array (nx4)
            ring_segments = vertex_array2segment_array(ring)

            # compute the squared distance between the beacon and the ring segments
            dist2 = point2seg_squared_dist(
                p_x=beacon_vertex[0], p_y=beacon_vertex[1],
                s0_x=ring_segments[:, 0], s0_y=ring_segments[:, 1],
                s1_x=ring_segments[:, 2], s1_y=ring_segments[:, 3])

            # save the index of the segment of this ring that is closest to the beacon
            closest_segment_idx = np.argmin(dist2)
            closest_segment_idxs.append(closest_segment_idx)
            # also save its distance
            closest_dists.append(dist2[closest_segment_idx])

        # find the index of the ring that is closest to the be beacon
        closest_idx = np.argmin(closest_dists)

        # get the ring that is closest to the beacon
        closest_ring = wall_rings[closest_idx]  # (nx2) array

        # get the segment is closest to the beacon
        closest_segment_idx = closest_segment_idxs[closest_idx]
        sa = vertex_array2segment_array(closest_ring)
        closest_segment = sa[closest_segment_idx]  # [x0, y0, x1, y1]

        # push the beacon away from the segment on the left side of the segment.
        # in arcgis the vertices of (multi)polygon boundaries are sorted CW and holes CCW,
        # so moving to the left means moving in the exterior if the polygon
        # HOWEVER, at this point of the code we are dealing with coordinates expressed in the legacy CRS,
        # which is a left-handed CRS. So, the boundaries are sorted CCW in this CRS, meaning that
        # we need to move the beacon to the right side of the segment
        move_direction = u_geom.side_direction(segment=closest_segment, side=c.RIGHT)
        moved_beacon_vertex = beacon_vertex + distance * move_direction

        # modify the beacon SHAPE with the new coords
        beacon.SHAPE['x'] = moved_beacon_vertex[0]
        beacon.SHAPE['y'] = moved_beacon_vertex[1]

    return beacons_df


def dissolve_by_level(sdf: pd.DataFrame, level_col=None):
    """Dissolve the geometries in the spatial dataframe level by level.

    Args:
        sdf: spatial dataframe
        level_col: the dissolve will be down group-wise based on this col

    Returns:
        a dataframe with the same columns and geometries dissolved by LEVEL_ID

    """

    # default value for the level col
    if level_col is None:
        level_col = c.LEVEL_ID_FIELD_NAME

    dissolved_sdf = pd.DataFrame(columns=sdf.columns)
    for _, level_sdf in sdf.groupby(level_col):
        union_geom = level_sdf.SHAPE.iloc[0]
        for geom in level_sdf.SHAPE.iloc[1:]:
            union_geom = union_geom.union(geom)

        # work on a copy to avoid #674
        level_sdf_copy = level_sdf.copy(deep=True)
        if level_sdf_copy.spatial.name:
            level_sdf_copy.drop(columns=[level_sdf_copy.spatial.name], inplace=True)

        level_sdf_copy.spatial.set_geometry([union_geom] * len(level_sdf_copy))
        dissolved_sdf = pd.concat([dissolved_sdf, level_sdf_copy.iloc[[0]]])

    if c.SDF_VERTEX_ARRAY_COLUMN in dissolved_sdf.columns:
        # the dataframe contains a vertex_array representation of the geometry,
        # we need to update this to fit the dissolved geoms
        xy_array, geom_part_idxs = u_geom.poly_geoms2vertex_array(
            poly_geoms=dissolved_sdf.SHAPE,
            geom_type=dissolved_sdf.spatial.geometry_type[0])

        geom_vertex_arrays = []
        for geom in geom_part_idxs:
            vertex_arrays = []
            for part_idxs in geom:
                # save the raw vertex_array so we won't have to recompute it later
                vertex_arrays.append(xy_array[part_idxs[0]:part_idxs[1], :])

            # append the geom vertex arrays to the parent list
            geom_vertex_arrays.append(vertex_arrays)

        dissolved_sdf[c.SDF_VERTEX_ARRAY_COLUMN] = geom_vertex_arrays

    return dissolved_sdf.reset_index(drop=True)


def corner_hex_cells(bbox: Tuple[float, float, float, float] or np.ndarray,
                     cell_size: float = DEFAULT_CELL_SIZE) -> Tuple[indoor_h.HexCell,
indoor_h.HexCell, indoor_h.HexCell, indoor_h.HexCell]:
    """
    Returns the HexCells containing the corners of the given bounding box.
    The cells belong to a hex grid "rooted" at (0, 0), meaning that the center of the
    cell with axial coordinates (q, r) = (0, 0) has cartesian coordinates (x, y) = (0., 0.).

    Args:
        bbox: x_min, y_min, x_max, y_max
        cell_size: cell_size as per flat top hexagons (https://www.redblobgames.com/grids/hexagons/)

    Returns:
        - bottom-left cell
        - top-left cell
        - bottom-right cell
        - top-right cell

    """
    return (indoor_h.HexCell.from_xy((bbox[0], bbox[1]), cell_size),  # bottom-left cell
            indoor_h.HexCell.from_xy((bbox[0], bbox[3]), cell_size),  # top-left cell
            indoor_h.HexCell.from_xy((bbox[2], bbox[1]), cell_size),  # bottom-right cell
            indoor_h.HexCell.from_xy((bbox[2], bbox[3]), cell_size))  # top-right cell


def contained_hex_cells(bbox: Tuple[float, float, float, float] or np.ndarray,
                        cell_size: float = DEFAULT_CELL_SIZE) -> np.ndarray:
    """
    Generates all the (flat top) hex cells whose centers fall within the given bounding box.
    The cells belong to a hex grid "rooted" at (0, 0), meaning that the center of the
    cell with axial coordinates (q, r) = (0, 0) has cartesian coordinates (x, y) = (0., 0.).

    Args:
        bbox: x_min, y_min, x_max, y_max
        cell_size: cell_size as per flat top hexagons (https://www.redblobgames.com/grids/hexagons/)

    Returns: (nx2) array of (x, y) coordinates

    """

    # get the extreme hex cells covering the corners of the bbox
    cell_bl, cell_tl, cell_br, cell_tr = corner_hex_cells(bbox=bbox, cell_size=cell_size)

    min_col = cell_bl.index_q
    max_col = cell_tr.index_q
    min_row = cell_bl.index_r
    max_row = cell_tl.index_r
    col_num = max_col - min_col
    row_num = max_row - min_row

    # compute the cell ranges in axial coordinates
    q_range = np.arange(min_col, min_col + col_num + 1)
    r_range = np.arange(min_row, min_row + row_num + 1)

    # create a mesh grid of axial coordinates
    q_mesh, r_mesh = np.meshgrid(q_range, r_range)

    # "straighten" the cells to form a rectangle instead of a trapezoid
    subtractions = (q_mesh - np.min(q_mesh, axis=1, keepdims=True)) // 2
    r_mesh = r_mesh - subtractions

    xs, ys = indoor_h.HexCell.xy_from_qr(q_mesh.flatten(), r_mesh.flatten(), cell_size)

    # stack the x and y in a (2xn) array and shift back
    return np.column_stack((xs, ys))


def covering_hex_cells(bbox: Tuple[float, float, float, float] or np.ndarray,
                       cell_size: float = DEFAULT_CELL_SIZE) -> np.ndarray:
    """
    Generates all the (flat top) hex cells necessary to completely cover the given bounding box.
    The cells belong to a hex grid "rooted" at (0, 0), meaning that the center of the
    cell with axial coordinates (q, r) = (0, 0) has cartesian coordinates (x, y) = (0., 0.).

    Note: to simplify the logic, this function returns a small super set of the minimum amount
    of cells necessary to cover the box. But, the box is assured to be fully covered.

    Args:
        bbox: x_min, y_min, x_max, y_max
        cell_size: cell_size as per flat top hexagons (https://www.redblobgames.com/grids/hexagons/)

    Returns: (nx2) array of (x, y) coordinates

    """
    # to make sure the generated cells completely cover the given bbox,
    # let's enlarge it as much as necessary to cover all edge cases
    hor_buffer = indoor_h.HexCell.horiz(cell_size) * 2
    ver_buffer = indoor_h.HexCell.vert(cell_size) * 2
    bbox = (bbox[0] - hor_buffer,
            bbox[1] - ver_buffer,
            bbox[2] + hor_buffer,
            bbox[3] + ver_buffer)

    return contained_hex_cells(bbox=bbox, cell_size=cell_size)

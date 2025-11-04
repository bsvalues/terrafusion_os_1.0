from typing import List, Tuple, Sequence

import arcpy
import numpy as np
import pandas as pd

import ips.const as c
import ips.utils_geom as u_geom


def interpolate_polyline(ts: Sequence[float],
                         ps: Sequence[arcpy.PointGeometry],
                         interp_times: Sequence[float]) -> Tuple[
    List[float], List[arcpy.PointGeometry]]:
    """interpolates locations at the given interpolation time stamps along a polyline.
    Each vertex (p) of the polyline is associated a timestamp (t)

    Args:
        ts: timestamps of input locations
        ps: vertices of the polyline
        interp_times: timestamps where to perform the interpolation

    Returns:

    """
    # TODO check that the lengths of ts and ps are equal else raise a specific error (to be handled internally)

    # assure we work with numpy arrays (this is efficient: if the input is already an array, do nothing)
    interp_times = np.asarray(interp_times)

    interp_point_geometries = []
    interp_ts = []
    for i in range(len(ps) - 1):
        segment_interp_ts, segment_interp_point_geometries = interpolate_segment_point_geometries(
            t1=ts[i], t2=ts[i + 1],
            p1=ps[i], p2=ps[i + 1],
            interp_times=interp_times,
            include_end=i == len(ps) - 2)
        interp_point_geometries.extend(segment_interp_point_geometries)
        interp_ts.extend(segment_interp_ts)
    return interp_ts, interp_point_geometries


def interpolate_segment_point_geometries(t1: float, t2: float,
                                         p1: arcpy.PointGeometry,
                                         p2: arcpy.PointGeometry,
                                         interp_times: Sequence[float],
                                         include_end: bool = False) -> Tuple[
    List[float], List[arcpy.PointGeometry]]:
    """interpolates locations of one segment at the given interp_times. The extremes
    of the segment are expressed as arcpy.PointGeometry objects. The interpolation times
    are filtered based on the given t1 and t2

    Args:
        t1: time associated to first segment extreme
        t2: time associated to second segment extreme
        p1: first segment extreme
        p2: second segment extreme
        interp_times: interpolation times
        include_end: if True t2 is included in the interpolation times

    Returns: interpolation times and interpolated locations along the segment

    """
    # assure we work with arrays (this is efficient: if the input is already an array, do nothing)
    interp_times = np.asarray(interp_times)

    distance_type = "PLANAR" if p1.spatialReference.type == "Projected" else "GEODESIC"
    # if we are working with projected points, this is a planar distance, else is geodetic

    if include_end:
        ts = interp_times[(interp_times >= t1) &
                          (interp_times <= t2)]
    else:
        ts = interp_times[(interp_times >= t1) &
                          (interp_times < t2)]

    angle, distance = p1.angleAndDistanceTo(p2, distance_type)
    interp_dist = np.interp(ts,
                            [t1, t2],
                            [0, distance])
    return ts.tolist(), [
        p1.pointFromAngleAndDistance(angle, d, distance_type) for d in
        interp_dist
    ]


def make_quality_points_3d(reference_position_df: pd.DataFrame,
                           computed_position_df: pd.DataFrame,
                           ips_recordings_df: pd.DataFrame) -> (pd.DataFrame, pd.DataFrame):
    """Update the point geometries of the Computed and Reference Positions dataframes based on the Z value of the
    equivalent Quality Recording (though the RECORDING_GUID field)

    Args:
        reference_position_df: IPS Quality dataset's Reference Positions dataframe
        computed_position_df: IPS Quality dataset's Computed Positions dataframe
        ips_recordings_df: IPS Quality Recordings dataframe

    Returns:
        reference_position_df, computed_position_df: the same dataframes as the inputs but the Point Geometries have
         Z values

    """
    guid_to_z_map = dict()
    for _, row in ips_recordings_df.iterrows():
        guid_to_z_map[row[c.GLOBAL_ID_FIELD_NAME]] = u_geom.extract_z_values(row[c.SHAPE_FIELD_NAME])

    reference_position_df[c.SHAPE_FIELD_NAME] = reference_position_df.apply(
        lambda row: arcpy.PointGeometry(
            arcpy.Point(X=row[c.SHAPE_FIELD_NAME].firstPoint.X, Y=row[c.SHAPE_FIELD_NAME].firstPoint.Y,
                        Z=guid_to_z_map[row[c.RECORDING_GUID_FIELD_NAME]]),
            spatial_reference=row[c.SHAPE_FIELD_NAME].spatialReference, has_z=True), axis=1)

    computed_position_df[c.SHAPE_FIELD_NAME] = computed_position_df.apply(
        lambda row: arcpy.PointGeometry(
            arcpy.Point(X=row[c.SHAPE_FIELD_NAME].firstPoint.X, Y=row[c.SHAPE_FIELD_NAME].firstPoint.Y,
                        Z=guid_to_z_map[row[c.RECORDING_GUID_FIELD_NAME]]),
            spatial_reference=row[c.SHAPE_FIELD_NAME].spatialReference, has_z=True), axis=1)

    return reference_position_df, computed_position_df

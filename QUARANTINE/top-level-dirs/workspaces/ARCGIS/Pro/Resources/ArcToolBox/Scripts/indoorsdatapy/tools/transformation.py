import logging
import os

import geopandas as gpd
from indoorsdatapy.algorithms.transformations import HelmertHelper

logger = logging.getLogger(__name__)
logging.basicConfig()
logger.setLevel(logging.DEBUG)


def get_coefs(origin, destination, origin_coords, report_dir):
    """
    Estimation of transformation coefficients using mean least square optimization
    between two sets of points
    :param origin: string
        geojson file
    :param destination: string
        geojson file
    :param origin_coords: string
        geojson file
    :param report_dir:string
        output directory
    :return: coefs
    """
    gdf_orig = gpd.read_file(origin)
    gdf_dest = gpd.read_file(destination)
    gdf_origin_coords = gpd.read_file(origin_coords)

    # Not sure about this. It might be also one of the corners ob bounds
    origin_x = gdf_origin_coords['geometry'].iloc[0].x
    origin_y = gdf_origin_coords['geometry'].iloc[0].y

    gdf_orig['x'] = gdf_orig['geometry'].apply(lambda g: float(g.x) - origin_x)
    gdf_orig['y'] = gdf_orig['geometry'].apply(
        lambda g: (float(g.y) - origin_y) * -1.)

    gdf_dest['x'] = gdf_dest['geometry'].apply(lambda g: float(g.x) - origin_x)
    gdf_dest['y'] = gdf_dest['geometry'].apply(
        lambda g: (float(g.y) - origin_y) * -1.)

    coefs, keys = HelmertHelper.make_similarity_transform(
        gdf_orig[['x', 'y']].values, gdf_dest[['x', 'y']].values, True)

    out_path_report = os.path.join(report_dir, 'report.txt')
    with open(out_path_report, 'w') as out:
        logger.info('saving report to %s' % out_path_report)
        out.writelines('\na0,a1,b0,b1 = ' + str(coefs))
        out.writelines('\ntrans_X,trans_y,scale,rot = ' + str(keys))
        out.writelines(
            '\ndifferences: ' + str(gdf_orig.distance(gdf_dest).values) + '\n')

    r = HelmertHelper.similarity_transform(gdf_orig[['x', 'y']].values,
                                           coefs)
    logger.info('Control: Origin points difference BEFORE transformation \n%s' %
                (gdf_dest[['x', 'y']] - gdf_orig[['x', 'y']]).head(20))

    logger.info('Control: origin points difference AFTER transformation \n%s' %
                (gdf_dest[['x', 'y']] - r).head(20))

    return coefs, out_path_report

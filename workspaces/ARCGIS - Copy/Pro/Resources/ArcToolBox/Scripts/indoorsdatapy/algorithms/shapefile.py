import geopandas
from shapely.geometry import Point


def points2shapefile(df, out_file):
    """

    :param df:
    :param out_file:
    :return:
    """
    df['geometry'] = df.apply(lambda x: Point((float(x), float(x))), axis=1)

    df = geopandas.GeoDataFrame(df, geometry='geometry')

    df.to_file(out_file, driver='ESRI Shapefile')

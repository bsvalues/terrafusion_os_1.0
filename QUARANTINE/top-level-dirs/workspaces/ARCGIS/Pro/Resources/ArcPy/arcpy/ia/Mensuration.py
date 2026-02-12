#COPYRIGHT 2021 ESRI
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

import arcgisscripting
from typing import NamedTuple


class Mensuration(arcgisscripting.Mensuration):
    """Mensuration(in_raster)\

    The Mensuration class is used to compute multiple types of measurements
    on an image. These measurements are performed in image space and
    utilize the defined sensor model to compute a result in
    real world values.
    Please note that although Map based points are supported as input,
    these points can result in significant error for certain image types.

    Arguments:
      in_raster -- Path to raster file or an arcpy.Raster object
    """

    """ Class Variables """
    base_to_top = 1
    base_to_shadow = 2
    top_to_shadow = 3


    class PointMeasurement(NamedTuple):
        """
        Result class for Mensuration point function.

        Attributes:
            lon: computed longitude in decimal degrees
            lat: computed latitude in decimal degrees
            elev: computed elevation in meters (HAE)
            sensor_name: sensor model name
        """
        lon: float
        lat: float
        elev: float
        sensor_name: str


    class LinearMeasurement(NamedTuple):
        """
        Result class for Mensuration distance function.

        Attributes:
            distance: computed distance between two points in meters
            azimuth: computed azimuth angle between two points in decimal degrees
            sensor_name: sensor model name
        """
        distance: float
        azimuth: float
        sensor_name: str


    class AreaMeasurement(NamedTuple):
        """
        Result class for Mensuration area function.

        Attributes:
            area: computer area of polygon in square meters
            perimeter: computed perimeter of polygon in meters
            sensor_name: sensor model name
        """
        area: float
        perimeter: float
        sensor_name: str


    class HeightMeasurement(NamedTuple):
        """
        Result class for Mensuration height function.

        Attributes:
            height: computed height between two points in meters
            sensor_name: sensor model name
        """
        height: float
        sensor_name: str


    def __init__(self, in_raster):
      """
      Mensuration(in_raster)

      Create a Mensuration object.

      Arguments:
        in_raster -- Name of raster
      """
      super().__init__()


    def __new__(cls, in_raster):
      return super().__new__(cls, in_raster)


    def point(self, point):
      """
      Calculate geographic coordinate based on sensor model.

      :param point: arcpy.PointGeometry, arcpy.Point or 2-d tuple (X, Y).
          The X and Y values default to the Image Coordinate System (ICS).
          Other spatial reference systems are supported by creating
          an appropriate geometry object that includes the spatial reference.

      :return: PointMeasurement object
      """
      (lon, lat, elev, sensor) = super().point(point)
      return Mensuration.PointMeasurement(lon, lat, elev, sensor)


    def distance(self, from_point, to_point):
      """
      Calculate the distance between two points.

      :param from_point: arcpy.PointGeometry, arcpy.Point or 2-d tuple (X, Y).
          The X and Y values default to the Image Coordinate System (ICS).
          Other spatial reference systems are supported by creating
          an appropriate geometry object that includes the spatial reference.

      :param to_point: arcpy.PointGeometry, arcpy.Point or 2-d tuple (X, Y).
          The X and Y values default to the Image Coordinate System (ICS).
          Other spatial reference systems are supported by creating
          an appropriate geometry object that includes the spatial reference.

      :return: LinearMeasurement object
      """
      (distance, azimuth, sensor) = super().distance(from_point, to_point)
      return Mensuration.LinearMeasurement(distance, azimuth, sensor)


    def area(self, polygon):
      """
      Calculate the area of the polygon.

      :param polygon: arcpy.Polygon, list of arcpy.Point or list
          of 2-d tuples (X, Y).
          The X and Y values default to the Image Coordinate System (ICS).
          Other spatial reference systems are supported by creating
          an appropriate geometry object that includes the spatial reference.

      :return: AreaMeasurement object
      """
      (area, perimeter, sensor) = super().area(polygon)
      return Mensuration.AreaMeasurement(area, perimeter, sensor)


    def height(self, base_point, top_point, height_type):
      """
      Calculate the vertical height of an object.

      :param base_point: arcpy.PointGeometry, arcpy.Point or 2-d tuple (X, Y).
          The X and Y values default to the Image Coordinate System (ICS).
          Other spatial reference systems are supported by creating
          an appropriate geometry object that includes the spatial reference.

      :param top_point: arcpy.PointGeometry, arcpy.Point or 2-d tuple (X, Y).
          The X and Y values default to the Image Coordinate System (ICS).
          Other spatial reference systems are supported by creating
          an appropriate geometry object that includes the spatial reference.

      :param height_type: base_to_top, base_to_shadow, or top_to_shadow
          base_to_top: Calculates the height of a ground feature by measuring
              from the base of the object to the top of the object
          base_to_shadow: Calculates the height of a feature by measuring
              from the base of the object to the top of the object's shadow on the ground
          top_to_shadow: Calculates the height of a feature by measuring
              from the top of the object to the top of the objects's shadow on the ground

      :return: HeightMeasurement object
      """
      (height, sensor) = super().height(base_point, top_point, height_type)
      return Mensuration.HeightMeasurement(height, sensor)

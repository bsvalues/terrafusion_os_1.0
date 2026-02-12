import math
from pyspark.sql.types import UserDefinedType, StructField, StructType, ArrayType, DoubleType, \
    IntegerType, ByteType, BooleanType, LongType

# TODO module name will probably change based on product name decision
MODULE_NAME = "ga_spark.sql"
SCALA_UDT_PACKAGE = "org.apache.spark.sql.contrib.arcgis"

class GenericGeometryUDT(UserDefinedType):

    @classmethod
    def sqlType(cls):
        return StructType([
            StructField("type", ByteType(), nullable=False),
            StructField("xy", ArrayType(DoubleType(), containsNull=False), nullable=False),
            StructField("z", ArrayType(DoubleType(), containsNull=False), nullable=True),
            StructField("m", ArrayType(DoubleType(), containsNull=False), nullable=True),
            StructField("offsets", ArrayType(IntegerType(), containsNull=False), nullable=True)
        ])

    @classmethod
    def module(cls):
        return MODULE_NAME

    @classmethod
    def scalaUDT(cls):
        return f"{SCALA_UDT_PACKAGE}.GenericGeometryUDT"

    def serialize(self, datum):
        return datum

    def deserialize(self, datum):
        geometry_type = datum[0]
        if geometry_type == 1:  # Point
            return self._deserializePoint(datum)
        elif geometry_type == 2:  # MultiPoint
            return self._deserializeMultiPoint(datum)
        elif geometry_type == 3:  # Polyline
            return self._deserializePolyline(datum)
        elif geometry_type == 4:  # Polygon
            return self._deserializePolygon(datum)
        else:
            raise TypeError("Unrecognized geometry type: " + str(geometry_type))

    def simpleString(self):
        return "geometry"

    def _deserializePoint(self, datum):
        xy = datum[1]
        z = datum[2]
        m = datum[3]
        return Point(xy[0], xy[1], z[0] if z else math.nan, m[0] if m else math.nan)

    def _deserializeMultiPoint(self, datum):
        return MultiPoint.from_raw_values(datum[1], datum[2], datum[3], datum[4][0])

    def _deserializePolyline(self, datum):
        return MultiPath.from_raw_values(datum[1], datum[2], datum[3], datum[4], False)

    def _deserializePolygon(self, datum):
        return MultiPath.from_raw_values(datum[1], datum[2], datum[3], datum[4], True)


class PointUDT(UserDefinedType):

    @classmethod
    def sqlType(cls):
        return StructType([
            StructField("x", DoubleType(), nullable=False),
            StructField("y", DoubleType(), nullable=False),
            StructField("z", DoubleType(), nullable=False),
            StructField("m", DoubleType(), nullable=False)
        ])

    @classmethod
    def module(cls):
        return MODULE_NAME

    @classmethod
    def scalaUDT(cls):
        return f"{SCALA_UDT_PACKAGE}.PointUDT"

    def serialize(self, datum):
        if isinstance(datum, Point):
            return datum.x, datum.y, datum.z, datum.m
        else:
            raise TypeError("Not a point geometry type")

    def deserialize(self, datum):
        return Point(datum[0], datum[1], datum[2], datum[3])

    def simpleString(self):
        return "point"


class MultiPointUDT(UserDefinedType):

    @classmethod
    def sqlType(cls):
        return StructType([
            StructField("xy", ArrayType(DoubleType(), containsNull=False), nullable=False),
            StructField("z", ArrayType(DoubleType(), containsNull=False), nullable=True),
            StructField("m", ArrayType(DoubleType(), containsNull=False), nullable=True),
            StructField("count", IntegerType(), nullable=False)
        ])

    @classmethod
    def module(cls):
        return MODULE_NAME

    @classmethod
    def scalaUDT(cls):
        return f"{SCALA_UDT_PACKAGE}.MultiPointUDT"

    def serialize(self, datum):
        if isinstance(datum, MultiPoint):
            return datum._xy_array, datum._z_array, datum._m_array, datum._count
        else:
            raise TypeError("Not a point geometry type")

    def deserialize(self, datum):
        return MultiPoint.from_raw_values(datum[0], datum[1], datum[2], datum[3])

    def simpleString(self):
        return "multipoint"


class LinestringUDT(UserDefinedType):

    @classmethod
    def sqlType(cls):
        return StructType([
            StructField("xy", ArrayType(DoubleType(), containsNull=False), nullable=False),
            StructField("z", ArrayType(DoubleType(), containsNull=False), nullable=True),
            StructField("m", ArrayType(DoubleType(), containsNull=False), nullable=True),
            StructField("paths", ArrayType(IntegerType(), containsNull=False), nullable=False)
        ])

    @classmethod
    def module(cls):
        return MODULE_NAME

    @classmethod
    def scalaUDT(cls):
        return f"{SCALA_UDT_PACKAGE}.LinestringUDT"

    def serialize(self, datum):
        return datum._xy_array, datum._z_array, datum._m_array, datum._paths_array

    def deserialize(self, datum):
        return MultiPath.from_raw_values(datum[0], datum[1], datum[2], datum[3], False)

    def simpleString(self):
        return "linestring"


class PolygonUDT(UserDefinedType):

    @classmethod
    def sqlType(cls):
        return StructType([
            StructField("xy", ArrayType(DoubleType(), containsNull=False), nullable=False),
            StructField("z", ArrayType(DoubleType(), containsNull=False), nullable=True),
            StructField("m", ArrayType(DoubleType(), containsNull=False), nullable=True),
            StructField("rings", ArrayType(IntegerType(), containsNull=False), nullable=False)
        ])

    @classmethod
    def module(cls):
        return MODULE_NAME

    @classmethod
    def scalaUDT(cls):
        return f"{SCALA_UDT_PACKAGE}.PolygonUDT"

    def serialize(self, datum):
        return datum._xy_array, datum._z_array, datum._m_array, datum._paths_array

    def deserialize(self, datum):
        return MultiPath.from_raw_values(datum[0], datum[1], datum[2], datum[3], True)

    def simpleString(self):
        return "polygon"


class SpatialBinUDT(UserDefinedType):

    @classmethod
    def sqlType(cls):
        return LongType()

    @classmethod
    def module(cls):
        return MODULE_NAME

    @classmethod
    def scalaUDT(cls):
        return f"{SCALA_UDT_PACKAGE}.SpatialBinUDT"

    def serialize(self, datum):
        return datum

    def deserialize(self, datum):
        return datum

    def simpleString(self):
        return "bin2d"


class Geometry:

    def __init__(self):
        pass


class Point(Geometry):

    __UDT__ = PointUDT()

    def __init__(self, x, y, z=math.nan, m=math.nan):
        super().__init__()
        self._x = float(x)
        self._y = float(y)
        self._z = float(z)
        self._m = float(m)

    def __str__(self):
        return f"point({self._x},{self._y},{self._z},{self._m})"

    def __repr__(self):
        return self.__str__()

    @property
    def has_z(self):
        return not math.isnan(self._z)

    @property
    def has_m(self):
        return not math.isnan(self._m)

    @property
    def x(self):
        return self._x

    @property
    def y(self):
        return self._y

    @property
    def z(self):
        return self._z

    @property
    def m(self):
        return self._m

    def json(self):
        dict = {"x": self._x, "y": self._y}
        if self._z is not math.nan:
            dict['z'] = self._z
        if self._m is not math.nan:
            dict['m'] = self._m
        return dict


class MultiPoint(Geometry):

    __UDT__ = MultiPointUDT()

    def __init__(self, points):
        super().__init__()
        if points:
            self._set_from_points(points)

    def __str__(self):
        return f"multipoint({self.json()})"

    def __repr__(self):
        return self.__str__()

    def _set_to(self, xy_array, z_array, m_array, count):
        self._xy_array = xy_array
        self._z_array = z_array
        self._m_array = m_array
        self._count = count

    def _set_from_points(self, points):

        self._xy_array = []
        self._paths_array = []
        self._z_array = None
        self._m_array = None

        first_coords = True
        has_z = False
        has_m = False

        for coords in points:
            self._xy_array.append(float(coords[0]))
            self._xy_array.append(float(coords[1]))

            coords_length = len(coords)

            if first_coords:
                first_coords = False
                if coords_length >= 3:
                    self._z_array = []
                    has_z = True
                if coords_length == 4:
                    self._m_array = []
                    has_m = True

            if has_z:
                self._z_array.append(float(coords[2]) if coords_length >= 3 else math.nan)

            if has_m:
                self._m_array.append(float(coords[3]) if coords_length == 4 else math.nan)

        self._count = int(len(self._xy_array) / 2)

    @property
    def has_z(self):
        return bool(self._z_array)

    @property
    def has_m(self):
        return bool(self._m_array)

    @property
    def path_count(self):
        return self._count

    def point_x(self, point_index):
        return self._xy_array[point_index * 2]

    def point_y(self, point_index):
        return self._xy_array[point_index * 2 + 1]

    def point_z(self, point_index):
        return self._z_array[point_index] if self.has_z else math.nan

    def point_m(self, point_index):
        return self._m_array[point_index] if self.has_m else math.nan

    def point(self, point_index):
        return Point(self.point_x(point_index),
                     self.point_y(point_index),
                     self.point_z(point_index),
                     self.point_m(point_index))

    def json(self):
        json = {}
        if self.has_z:
            json["hasZ"] = True
        if self.has_m:
            json["hasM"] = True
        json["points"] = [self._point_coords(point_index) for point_index in range(self._count)]
        return json

    def _point_coords(self, point_index):
        coords = [self.point_x(point_index), self.point_y(point_index)]
        if self.has_z:
            coords.append(self.point_z(point_index))
        if self.has_m:
            coords.append(self.point_m(point_index))
        return coords

    @staticmethod
    def from_raw_values(xy_array, z_array, m_array, count):
        multipath = MultiPoint(None)
        multipath._set_to(xy_array, z_array, m_array, count)
        return multipath


class MultiPath(Geometry):

    def __init__(self, paths, closed):
        super().__init__()
        if paths:
            self._set_from_paths(paths, closed)

    def _set_to(self, xy_array, z_array, m_array, paths_array, closed):
        self._xy_array = xy_array
        self._z_array = z_array
        self._m_array = m_array
        self._paths_array = paths_array
        self._closed = closed

    def _set_from_paths(self, paths, closed):

        self._xy_array = []
        self._paths_array = []
        self._z_array = None
        self._m_array = None

        first_coords = True
        has_z = False
        has_m = False

        for path in paths:
            # length of _xy_array is always even
            self._paths_array.append(len(self._xy_array) // 2)
            for coords in path:
                self._xy_array.append(float(coords[0]))
                self._xy_array.append(float(coords[1]))

                coords_length = len(coords)

                if first_coords:
                    first_coords = False
                    if coords_length >= 3:
                        self._z_array = []
                        has_z = True
                    if coords_length == 4:
                        self._m_array = []
                        has_m = True

                if has_z:
                    self._z_array.append(float(coords[2]) if coords_length >= 3 else math.nan)

                if has_m:
                    self._m_array.append(float(coords[3]) if coords_length == 4 else math.nan)

        self._paths_array.append(int(len(self._xy_array) / 2))
        self._closed = closed

    @property
    def has_z(self):
        return bool(self._z_array)

    @property
    def has_m(self):
        return bool(self._m_array)

    @property
    def path_count(self):
        return len(self._paths_array) - 1

    @property
    def point_count(self):
        return self._paths_array[-1]

    def path_start(self, path_index):
        return self._paths_array[path_index]

    def path_end(self, path_index):
        return self._paths_array[path_index + 1]

    def path_length(self, path_index):
        return self.path_end(path_index) - self.path_start(path_index)

    def path_points(self, path_index):
        return [self.point(point_index) for point_index in self._path_range(path_index)]

    def point_x(self, point_index):
        return self._xy_array[point_index * 2]

    def point_y(self, point_index):
        return self._xy_array[point_index * 2 + 1]

    def point_z(self, point_index):
        return self._z_array[point_index] if self.has_z else math.nan

    def point_m(self, point_index):
        return self._m_array[point_index] if self.has_m else math.nan

    def point(self, point_index):
        return Point(self.point_x(point_index),
                     self.point_y(point_index),
                     self.point_z(point_index),
                     self.point_m(point_index))

    def json(self):
        json = {}
        if self.has_z:
            json["hasZ"] = True
        if self.has_m:
            json["hasM"] = True
        paths = []
        for path_index in range(self.path_count):
            point_coords = [self._point_coords(point_index) for point_index in self._path_range(path_index)]
            # add the closing point for every ring
            if self._closed and self._xy_array:
                point_coords.append(self._point_coords(self.path_start(path_index)))
            paths.append(point_coords)
        paths_or_rings = "rings" if self._closed else "paths"
        json[paths_or_rings] = paths
        return json

    def _path_range(self, path_index):
        return range(self.path_start(path_index), self.path_end(path_index))

    def _point_coords(self, point_index):
        coords = [self.point_x(point_index), self.point_y(point_index)]
        if self.has_z:
            coords.append(self.point_z(point_index))
        if self.has_m:
            coords.append(self.point_m(point_index))
        return coords

    @staticmethod
    def from_raw_values(xy_array, z_array, m_array, paths_array, closed):
        multipath = Polygon(None) if closed else Linestring(None)
        multipath._set_to(xy_array, z_array, m_array, paths_array, closed)
        return multipath


class Linestring(MultiPath):

    __UDT__ = LinestringUDT()

    def __init__(self, paths):
        super().__init__(paths, False)

    def __str__(self):
        return f"linestring({self.json()})"

    def __repr__(self):
        return self.__str__()


class Polygon(MultiPath):

    __UDT__ = PolygonUDT()

    def __init__(self, rings):
        super().__init__(rings, True)

    def __str__(self):
        return f"polygon({self.json()})"

    def __repr__(self):
        return self.__str__()

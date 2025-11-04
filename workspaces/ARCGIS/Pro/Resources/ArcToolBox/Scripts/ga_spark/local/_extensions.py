from ga_spark.extensions import _accessors
from . import dynamic_tools

@_accessors.register_sparksession_accessor('ga')
class GASparkSessionAccessor:

    def __init__(self, spark):
        self._spark = spark
        self.tools = dynamic_tools.GeoAnalytics(spark._sc._gateway.jvm.com.esri.geoanalytics.internal.core.python.PythonJavaContext.get(), self._spark)

    def _gc(self):
        self._spark._sc._gateway.jvm.java.lang.System.gc()


@_accessors.register_dataframe_reader_method
def layer(self, layer, inferGeometry=False, inferTime=False):
    """def layer(layer, {inferGeometry}, {inferTime}).
    :param layer: mapping layer object or path
    :param inferGeometry: infer geometry format from fields
    :param inferTime: infer time format from fields
    :return: a Spark DataFrame
    """
    import json
    layer_desc = _describe_layer(layer)
    return self.format("layer")\
        .option("arcpy.layer.description", json.dumps(layer_desc))\
        .option("inferGeometry", str(inferGeometry).lower())\
        .option("inferTime", str(inferTime).lower())\
        .load()


@_accessors.register_dataframe_writer_method
def layer(writer, path):
    return writer.format("layer").save(path)


@_accessors.register_sparksession_builder_method
def getOrCreate(builder):
    # This method overrides SparkSession.builder.getOrCreate() and delegates to our implementation
    import ga_spark
    import arcpy
    if builder._options:
        arcpy.AddWarning("Spark configuration is managed by the system. User configuration will have no effect.")
    return ga_spark.get_or_create()


def _describe_layer(layer):
    try:
        import gautils
        return gautils.utilities.get_layer_description(layer)
    except:
        if isinstance(layer, str):
            return {'path': layer}
        else:
            return None

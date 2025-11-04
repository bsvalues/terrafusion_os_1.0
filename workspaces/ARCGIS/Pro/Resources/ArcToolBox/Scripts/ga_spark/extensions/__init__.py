
from . import _accessors
from .._plotting import plot_dataframe


@_accessors.register_dataframe_accessor('st')
class STDataFrameAccessor:

    def __init__(self, df):
        self._df = df

    def set_geometry_field(self, geometry_field):
        self._require_field(geometry_field)
        from pyspark.sql import DataFrame
        jdf = self._python_utils().withGeometryFieldSet(self._df._jdf, geometry_field)
        return DataFrame(jdf, self._df.sql_ctx)

    def set_time_fields(self, start_time_field, end_time_field=None):
        from pyspark.sql import DataFrame
        if end_time_field:
            self._require_field(start_time_field)
            self._require_field(end_time_field)
            jdf = self._python_utils().withTimeFieldsSet(self._df._jdf, start_time_field, end_time_field)
        else:
            self._require_field(start_time_field)
            jdf = self._python_utils().withTimeFieldSet(self._df._jdf, start_time_field)
        return DataFrame(jdf, self._df.sql_ctx)

    def _require_field(self, field):
        if not self._has_column(field):
            raise ValueError("Field '{}' does not exist".format(field))

    def _has_column(self, col):
        from pyspark.sql.utils import AnalysisException
        try:
            self._df[col]
            return True
        except AnalysisException:
            return False

    def _python_utils(self):
        return self._df._sc._gateway.jvm.com.esri.arcgis.st.spark.sql.PythonUtils

    def to_pandas_sdf(self, geometry_field=None):
        """
        Converts Spark dataframe to a Pandas spatially enabled dataframe.

        :param geometry_field: field to set as geometry on spatial dataframe. If not specified, the first
                               valid geometry field seen will be used.
        :return: a spatially enabled pandas dataframe
        """
        from arcgis.geometry import Geometry
        from ga_spark.sql import functions as ST

        if not geometry_field:
            candidates = [field.name for field in self._df.schema.fields if field.dataType.simpleString() in ["geometry", "point", "linestring", "polygon", "multipoint"]]
            geometry_field = candidates[0]
        sdf = self._df.withColumn("__shape_import__", ST.as_esri_json(geometry_field)).drop(geometry_field).toPandas()
        sdf[geometry_field] = sdf.__shape_import__.apply(Geometry)
        sdf.spatial.set_geometry(geometry_field)
        sdf = sdf.drop(columns=["__shape_import__"])
        return sdf

    def plot(
            self,
            geom_col=None,
            val_col=None,
            is_categorical=False,
            ax=None,
            cmap=None,
            figsize=None,
            aspect="auto",
            max_geoms=3000,
            legend=False,
            legend_kwds=None,
            **style_kwds
    ):
        return plot_dataframe(
            self._df,
            geom_col=geom_col,
            val_col=val_col,
            is_categorical=is_categorical,
            ax=ax,
            cmap=cmap,
            figsize=figsize,
            aspect=aspect,
            max_geoms=max_geoms,
            legend=legend,
            legend_kwds=legend_kwds,
            **style_kwds
        )


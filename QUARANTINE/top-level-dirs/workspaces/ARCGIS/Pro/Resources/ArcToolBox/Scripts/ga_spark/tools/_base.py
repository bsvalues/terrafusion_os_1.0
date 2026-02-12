
class BaseTool:

    def __init__(self, tool_name):
        self._tool_name = tool_name
        self._builder_args = {}
        self._ensure_initialized()

    def _ensure_initialized(self):
        from pyspark.sql import SparkSession
        self._spark = SparkSession.builder.getOrCreate()
        try:
            self._jctx = self._spark._sc._gateway.jvm.com.esri.geoanalytics.internal.core.python.PythonJavaContext.get()
        except:
            raise RuntimeError("Engine is not initialized")

    def _set_builder_args(self, param, args):
        self._builder_args[param] = args

    def _exec_tool(self, output_params):
        jtool = self._new_tool_runner()
        for arg in self._builder_args:
            java_args = [self._get_value_for_java(python_arg) for python_arg in self._builder_args[arg]]
            try:
                jtool.setParameter(arg, java_args)
            except:
                raise ValueError(f"Invalid values given for parameter '{arg}'")

        jtool.run()

        result = {}
        for output_param in output_params:
            result_value = self._get_result_for_python(jtool.getParameter(output_param))
            if result_value:
                result[output_param] = result_value

        return result

    def _new_tool_runner(self):
        return self._jctx.newToolRunner(self._tool_name)

    def _get_result_for_python(self, value):
        import py4j
        from pyspark.sql import DataFrame

        if isinstance(value, py4j.java_gateway.JavaObject):
            """"
                In Spark 3.3.0, changes were made to PySpark to use SparkSession instead of the deprecated SQLContext.
                To maintain backwards compatability we check to see if the the PySpark Dataframe API  uses SQLContext
                or SparkSession. If attribute _wrapped is present , than the API uses SQLContext and if not then 
                it uses SparkSession.
                See Spark jira issue SPARK-38121 (https://issues.apache.org/jira/browse/SPARK-38121) for further info.
            """
            if hasattr(self._spark, "_wrapped"):
                return DataFrame(value, self._spark._wrapped)
            else:
                return DataFrame(value, self._spark)

        return value

    def _get_value_for_java(self, value):
        import pyspark

        if not value:
            return None
        elif isinstance(value, pyspark.sql.DataFrame):
            return value._jdf
        elif isinstance(value, list):
            return map(self._get_value_for_java, value)
        else:
            return value

def none_set(*args):
    return not any(args)

def check_duration(duration, unit, prefix):
    if none_set(duration, unit):
        return

    if not duration:
        raise ValueError("Missing duration scalar value for '{}' argument".format(prefix))

    if not unit:
        raise ValueError("Missing unit for '{}' argument".format(prefix))

    # TODO check duration and unit values

def check_size(size, unit, prefix):
    check_distance(size, unit, prefix, "size")

def check_distance(distance, unit, prefix, scalar_type="distance"):
    if none_set(distance, unit):
        return

    if not distance:
        raise ValueError("Missing {} scalar value for '{}' argument".format(scalar_type, prefix))

    if not unit:
        raise ValueError("Missing unit for '{}' argument".format(prefix))

    # TODO check distance and unit values
    
def mk_stat_dict(field, statistic, alias=None):
    dict = {}
    dict["onStatisticField"] = field
    dict["statisticType"] = statistic
    if alias:
        dict["outStatisticFieldName"] = alias
    return dict

def mk_stats_from_list(stats):
    dicts=[]
    for stat in stats:
        dict = None
        
        if isinstance(stat, tuple):
            if len(stat) == 2:
                (field, statistic) = stat
                dict = mk_stat_dict(field, statistic)
            elif len(stat) == 3:
                (field, statistic, alias) = stat
                dict = mk_stat_dict(field, statistic, alias)
        
        if dict:
            dicts.append(dict)
        else:
            raise ValueError("Invalid summary field: {}".format(stat))

    return dicts
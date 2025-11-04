import json
from pyspark.sql import SparkSession, DataFrame


class GeoAnalytics:
    """
    Tool wrappers for GA tools that can accept and process Spark dataframes.
    """

    def __init__(self, jctx, spark):
        self._jctx = jctx
        self._spark = spark
        self._tools = json.loads(jctx.describeToolbox())
        for fn in self._tools:
            function = self._dynamic_fn(fn)
            setattr(self, fn["pythonName"], function)

    def _dynamic_fn(self, fn):
        def run(*args, **kwargs):
            tool_args = self._collect_varargs(fn, args, kwargs)
            return self._execute(fn, tool_args)

        # The Pro python console is able to use the first line of the function doc as a hint to
        # intellisense/autocomplete when using dynamic args
        run.__doc__ = self._make_signature(fn)
        return run

    def _execute(self, fn, args):
        jtool = self._jctx.newToolRunner(fn["name"])
        for tool_input in fn["inputParams"]:
            arg_values = []
            for pythonInput in tool_input["pythonInputs"]:
                if pythonInput["name"] in args:
                    arg_values.append(self._get_value_for_java(args[pythonInput["name"]]))
                else:
                    arg_values.append(None)
            jtool.setParameter(tool_input["name"], arg_values)

        jtool.run()

        tool_outputs = fn["outputParams"]

        if tool_outputs:
            if len(tool_outputs) == 1:
                # tool has one output (most common scenario)
                return self._get_result_for_python(jtool.getParameter(tool_outputs[0]["name"]))
            else:
                tool_result = {}
                for tool_output in tool_outputs:
                    result_name = tool_output["name"]
                    result_value = self._get_result_for_python(jtool.getParameter(result_name))
                    if result_value:
                        tool_result[result_name] = result_value

                return tool_result

    def _get_result_for_python(self, value):
        import py4j

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

    def _make_signature(self, fn):
        python_inputs = self._collect_python_input_params(fn)

        params = []
        for param in python_inputs:
            if "defaultValue" in param:
                params.append(param["name"]+"="+repr(param["defaultValue"]))
            elif not param["required"]:
                params.append("{" + param["name"] + "}")
            else:
                params.append(param["name"])

        return "{}({})".format(fn["pythonName"], ", ".join(params))

    def _collect_python_input_params(self, fn):
        params = []
        for tool_param in fn["inputParams"]:
            for python_param in tool_param["pythonInputs"]:
                params.append(python_param)
        return params

    def _collect_varargs(self, fn, args, kwargs):
        tool_args = {}

        python_inputs = self._collect_python_input_params(fn)

        params = [x["name"] for x in python_inputs]

        # process position parameters
        for idx, value in enumerate(args):
            tool_args[params[idx]] = value

        # process named parameters
        for key, value in kwargs.items():
            if not key in params:
                raise TypeError("{}() got an unexpected keyword argument '{}'".format(fn["name"], key))

            if key in tool_args:
                raise TypeError("{}() got multiple values for argument '{}'".format(fn["name"], key))

            tool_args[key] = value

        # process defaults
        for param in python_inputs:
            param_name = param["name"]
            if param_name in tool_args:
                continue  # don't override user values

            if "defaultValue" in param:
                tool_args[param_name] = param["defaultValue"]

        return tool_args

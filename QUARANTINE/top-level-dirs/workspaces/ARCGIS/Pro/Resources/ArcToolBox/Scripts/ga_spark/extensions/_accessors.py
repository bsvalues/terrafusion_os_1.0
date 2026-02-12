from functools import wraps


class CachedAccessor:
    """
    Custom property-like object (descriptor) for caching accessors.

    Parameters
    ----------
    name : str
        The namespace this will be accessed under, e.g. ``df.foo``
    accessor : cls
        The class with the extension methods.

    NOTE
    ----
    Modified based on pandas.core.accessor.
    """

    def __init__(self, name, accessor):
        self._name = name
        self._accessor = accessor

    def __get__(self, obj, cls):
        if obj is None:
            # we're accessing the attribute of the class, i.e., Dataset.geo
            return self._accessor
        accessor_obj = self._accessor(obj)
        # Replace the property with the accessor object. Inspired by:
        # http://www.pydanny.com/cached-property.html
        setattr(obj, self._name, accessor_obj)
        return accessor_obj


def _register_accessor(name, cls):
    """
    NOTE
    ----
    Modified based on pandas.core.accessor.
    """

    def decorator(accessor):
        setattr(cls, name, CachedAccessor(name, accessor))
        return accessor

    return decorator


def _register_method(method, cls):
    """Register a function as a method attached to cls

    NOTE
    ----
    Modified based on pandas_flavor.register.
    """

    def inner(*args, **kwargs):
        class AccessorMethod:
            def __init__(self, pyspark_obj):
                self._obj = pyspark_obj

            @wraps(method)
            def __call__(self, *args, **kwargs):
                return method(self._obj, *args, **kwargs)

        _register_accessor(method.__name__, cls)(AccessorMethod)

        return method

    return inner()


def register_sparksession_accessor(name):
    from pyspark.sql import SparkSession
    return _register_accessor(name, SparkSession)


def register_dataframe_accessor(name):
    from pyspark.sql import DataFrame
    return _register_accessor(name, DataFrame)


def register_dataframe_method(method):
    from pyspark.sql import DataFrame
    return _register_method(method, DataFrame)


def register_dataframe_reader_accessor(name):
    from pyspark.sql import DataFrameReader
    return _register_accessor(name, DataFrameReader)


def register_dataframe_reader_method(method):
    from pyspark.sql import DataFrameReader
    return _register_method(method, DataFrameReader)


def register_dataframe_writer_accessor(name):
    from pyspark.sql import DataFrameReader
    return _register_accessor(name, DataFrameReader)


def register_dataframe_writer_method(method):
    from pyspark.sql import DataFrameWriter
    return _register_method(method, DataFrameWriter)


def register_sparksession_builder_method(method):
    from pyspark.sql import SparkSession
    return _register_method(method, SparkSession.Builder)
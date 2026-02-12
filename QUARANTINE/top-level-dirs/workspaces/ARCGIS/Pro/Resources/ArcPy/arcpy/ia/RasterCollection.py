#COPYRIGHT 2018 ESRI
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
from .util import get_geometry, convert_string_to_date_time, _get_logger
import numbers
import arcpy
from arcpy.ia import Apply, Merge, CompositeBand
from collections import defaultdict
import warnings
from datetime import datetime
from .util import ArcpyHandler
import requests

THRESHOLD = 10


class _RasterCollectionCursor:
    def __init__(self, data_frame):
        self._data_frame = data_frame
        self._index = 0

    def __len__(self):
        return self._data_frame.shape[0]

    def __iter__(self):
        return self

    def __next__(self):
        if self._index >= len(self):
            raise StopIteration

        row = self._data_frame.iloc[self._index]
        self._index += 1

        # convert pandas Series to native python dictionary^M
        return row.to_dict()


class RasterCollection:
    def __init__(self, rasters, attribute_dict=None, where_clause=None, query_geometry=None):
        self._is_mosaic = True
        self._df = None
        self._raster_collection = None
        import pandas as pd
        logger = None
        log_file = None

        if isinstance(rasters, arcgisscripting._ia.RasterCollection):
            self._raster_collection = rasters
        elif isinstance(rasters, str):
            if attribute_dict is not None:
                raise ValueError('attribute_dict must be None for mosaic/multidimensional raster input')
            self._raster_collection = arcgisscripting._ia.RasterCollection(rasters, where_clause, query_geometry)
        elif isinstance(rasters, pd.DataFrame):
            self._is_mosaic = False
            self._df = rasters.copy()
        elif isinstance(rasters, list):
            bad_dataset_indices = []
            has_crossed_threshold = False
            original_len = len(rasters)
            for i, raster in enumerate(rasters):
                if not isinstance(raster, arcpy.Raster):
                    try:
                        rasters[i] = arcpy.Raster(raster)
                    except Exception as e:
                        bad_dataset_indices.append(i)
                        if logger is None:
                            logger, log_file = _get_logger(logger_name="rastercollection_logger")
                        if not has_crossed_threshold and len(bad_dataset_indices) > THRESHOLD:
                            print("...\nStopping printing")
                            _remove_arcpy_handler(logger)
                            has_crossed_threshold = True
                        logger.warning(e)

            number_bad_datasets = len(bad_dataset_indices)
            if number_bad_datasets > 0:
                if number_bad_datasets > THRESHOLD:
                    warning_msg = f"Warning: Failed to open over {THRESHOLD} raster datasets."
                else:
                    warning_msg = "Warning: Failed to open above raster dataset(s)."
                print(f"\n{warning_msg} Failed raster dataset(s) logged to: {log_file}")
                print(f"Warning: Added {original_len - number_bad_datasets}/{original_len} raster dataset(s) to the raster collection.")

            for index in bad_dataset_indices[::-1]:
                del rasters[index]

            in_raster_collection = {'Raster': rasters}
            self._is_mosaic = False

            if attribute_dict is not None and isinstance(attribute_dict, dict):
                if 'Raster' in attribute_dict:
                    raise ValueError('attribute_dict should not use "Raster" as the key')
                if number_bad_datasets > 0:
                    for val in list(attribute_dict.values()):
                        for index in bad_dataset_indices[::-1]:
                            del val[index]
                in_raster_collection.update(attribute_dict)
            self._df = pd.DataFrame(in_raster_collection)

        # Clear the handlers to that the next time a RasterCollection is created,
        # logging is done to a new file and only one ArcPy handler exists.
        if logger is not None and len(logger.handlers) > 0:
            logger.handlers.clear()

        if self._raster_collection is None:
            df_copy = self._df
            df_rasters = {'rasters': df_copy['Raster'].to_list()}
            attribute_table = df_copy.to_dict(orient='list')
            df_rasters.update(attribute_table)
            self._raster_collection = arcgisscripting._ia.RasterCollection(df_rasters)

    def _export_data_frame(self):
        import pandas as pd
        if self._df is not None:
            return self._df

        data = {}
        for field in self.fields:
            try:
                data[field] = self.getFieldValues(field)
            except Exception as e:
                continue
        return pd.DataFrame(data=data)

    def _build_query_string(self, field_name, operator, field_values):
        operator_map = {
            "equals": "=",
            "less_than": "<",
            "greater_than": ">",
            "not_equals": "<>",
            "not_less_than": ">=",
            "not_greater_than": "<=",
        }

        if operator in operator_map:
            if isinstance(field_values, numbers.Number):
                return field_name + ' ' + operator_map[operator] + ' ' + str(field_values)
            elif isinstance(field_values, str):
                return field_name + ' ' + operator_map[operator] + ' \'' + field_values + '\''
            else:
                raise TypeError('field_value must be numeric or string')

        elif operator in ['starts_with', 'ends_with', 'not_starts_with', 'not_ends_with', 'contains', 'not_contains']:
            if not isinstance(field_values, str):
                raise TypeError('field_value must be string')
            if operator == 'starts_with':
                return field_name + ' LIKE ' + '\'' + field_values + '%\''
            elif operator == 'ends_with':
                return field_name + ' LIKE' + '\'%' + field_values + '\''
            elif operator == 'not_starts_with':
                return field_name + ' NOT LIKE ' + '\'' + field_values + '%\''
            elif operator == 'not_ends_with':
                return field_name + ' NOT LIKE ' + '\'%' + field_values + '\''
            elif operator == 'contains':
                return field_name + ' LIKE ' + '\'%' + field_values + '%\''
            elif operator == 'not_contains':
                return field_name + ' NOT LIKE ' + '\'%' + field_values + '%\''
        elif operator == 'in':
            if not isinstance(field_values, list):
                raise TypeError('field_values must be type list for operator "in"')
            values = '('
            for item in field_values:
                if not (isinstance(item, numbers.Number) or isinstance(item, str)):
                    raise TypeError('item in field_values must be numeric or string')
                if values == '(':
                    values += '\'' + item + '\'' if isinstance(item, str) else str(item)
                else:
                    values += ',\'' + item + '\'' if isinstance(item, str) else ',' + str(item)
            values += ')'
            return field_name + ' IN ' + values
        elif operator == 'not_in':
            values = '('
            for item in field_values:
                if not (isinstance(item, numbers.Number) or isinstance(item, str)):
                    raise TypeError('item in field_values must be numeric or string')
                if values == '(':
                    values += '\'' + item + '\'' if isinstance(item, str) else str(item)
                else:
                    values += ',\'' + item + '\'' if isinstance(item, str) else ',' + str(item)
            values += ')'
            return field_name + ' NOT IN ' + values
        else:
            raise ValueError('invalid operator value')

    def _aggregate_function(self, fn_name, extent_type=None, cellsize_type=None):
        if 'Raster' in self.fields:
            field_value = 'Raster'
        elif 'Path' in self.fields:
            field_value = 'Path'
        else:
            raise RuntimeError('invalid raster collection')

        extent_types = {
            "FIRSTOF": 0,
            "INTERSECTIONOF": 1,
            "UNIONOF": 2,
            "LASTOF": 3
        }

        cellsize_types = {
            "FIRSTOF": 0,
            "MINOF": 1,
            "MAXOF": 2,
            "MEANOF": 3,
            "LASTOF": 4
        }
        fn_args_dict = {}

        if extent_type is not None:
            in_extent_type = extent_types[extent_type.upper()]
            if in_extent_type is not None:
                fn_args_dict['ExtentType'] = in_extent_type

        if cellsize_type is not None:
            in_cellsize_type = cellsize_types[cellsize_type.upper()]
            if in_cellsize_type is not None:
                fn_args_dict['CellsizeType'] = in_cellsize_type

        return Apply(self, fn_name, fn_args_dict)

    def filter(self, where_clause='', query_geometry_or_extent=None, raster_query=''):
        """
        filter a raster collection based on attribute and/or spatial queries

        :param where_clause (SQL Expression): An SQL expression used to select a subset of rasters
        :param query_geometry_or_extent (feature, feature layer, raster dataset, raster layer, extent, geometry): items in the collection that fails to intersect the given geometry will be excluded
        :param raster_query (SQL Expression): An SQL expression used to select a subset of rasters by the raster's key properties
        :return(RaterCollection): a raster collection that only contains items sastisfying the queries
        """
        if not isinstance(where_clause, str):
            raise TypeError("where_clause must be string type")

        if self._is_mosaic:
            return RasterCollection(self._raster_collection.filter(None if not where_clause else where_clause,
                                                                   get_geometry(query_geometry_or_extent),
                                                                   None if not raster_query else raster_query))
        else:
            if "LIKE" in where_clause or "NOT LIKE" in where_clause:
                raise RuntimeError("Local RasterCollection does not support LIKE or NOT LIKE in where_clause.")
            new_raster_collection = RasterCollection(self._df)
            if query_geometry_or_extent is not None:
                new_raster_collection = new_raster_collection.filterByGeometry(query_geometry_or_extent)
            if where_clause:
                new_raster_collection._df.query(where_clause, inplace=True)
            return new_raster_collection
    
    def _querySTACItems(self, query=''):
        """
        Method to convert raster collection to STAC items
        """
        # if not isinstance(query, str):
        #     raise TypeError("where_clause must be string type")
        return self._raster_collection._querySTACItems(query)
    
    @property
    def fields(self):
        if not self._is_mosaic:
            return self._df.columns.to_list()
        return list(self._raster_collection.fields) # otherwise it is tuple

    @property
    def count(self):
        if not self._is_mosaic:
            return self._df.shape[0]
        return self._raster_collection.count

    def __iter__(self):
        if not self._is_mosaic:
            return _RasterCollectionCursor(self._df)
        return iter(self._raster_collection)

    def __len__(self):
        return self.count

    def __getitem__(self, item):
        if not self._is_mosaic:
            return self._df.iloc[item].to_dict()
        return self._raster_collection[item]

    def _repr_html_(self):
        df = self._export_data_frame()
        str_frmt = lambda x: str(x)
        frmt = {col:str_frmt for col in df.columns}
        return df.to_html(formatters=frmt, notebook=True)

    def filterByTime(self, start_time="", end_time="", time_field_name="StdTime", date_time_format=None):
        """
        Shortcut to filter a collection by time

        :param start_time(String): a string representation of the start time, format must be '%m/%d/%Y', i.e., '10/03/2019'
        :param end_time(String): a string representation of the end time. format must be '%m/%d/%Y', i.e., '10/03/2019'.
                                This is optional. If not provided, only items that have exactly same time value as the start_time would be inlucded in the output
        :param time_field_name(String): the name of the field containing the time information for each item. Default: "StdTime"
        :param date_time_field(String): default is None which uses the default string representation of arcgis date field type
                                        if default is used, the date_time_format means '%Y-%m-%dT%H:%M:%S'
        :param date_time_format(String): the time format that is used to format the time field values. Please ref the python
                                date time standard for this argument. https://docs.python.org/3/library/datetime.html#strftime-and-strptime-behavior
                                Default is None and this means using the Pro standard time format '%Y-%m-%dT%H:%M:%S'
                                and ignoring the following sub-second.

        :return(RaterCollection): a filtered raster collection.
        """
        # type checking
        if not start_time and not end_time:
            return self

        if not isinstance(start_time, str):
            raise TypeError("start_time should be string or None.")
        if not isinstance(end_time, str):
            raise TypeError("end_time should be string or None.")

        if time_field_name not in self.fields:
            raise ValueError('the time_field_name does not exist. Please input a valid name for time field.')

        if start_time:
            start_time = convert_string_to_date_time(start_time, date_time_format)
        if end_time:
            end_time = convert_string_to_date_time(end_time, date_time_format)

        if self._is_mosaic:

            # the time format used in SQL is month/day/year hour:min:seconds
            if start_time:
                start_time_stamp = str(start_time.month)+"/"+str(start_time.day)+"/" + str(start_time.year) + " "+str(start_time.hour)+":"+str(start_time.minute)+":"+str(start_time.second)
                sql_query1 = time_field_name + ' >= timestamp \'' + start_time_stamp + '\''
            else:
                sql_query1 = ''
            if end_time:
                end_time_stamp = str(end_time.month)+"/"+str(end_time.day)+"/" + str(end_time.year) + " "+str(end_time.hour)+":"+str(end_time.minute)+":"+str(end_time.second)
                sql_query2 = time_field_name + ' <= timestamp \'' + end_time_stamp + '\''
            else:
                sql_query2 = ''

            if sql_query1 and sql_query2:
                sql_query = sql_query1 + ' AND ' + sql_query2
            else:
                sql_query = sql_query1 if sql_query1 else sql_query2

            return self.filter(sql_query)
        else:
            # RasterCollection is created from a list of rasters


            filtered_rasters = []
            attribute_dict = defaultdict(list)

            drop_tzinfo=True
            if start_time and start_time.tzinfo:
                drop_tzinfo=False

            if end_time and end_time.tzinfo:
                drop_tzinfo=False

            for item in iter(self):
                raster = self._get_raster_from_item(item)

                date_time = convert_string_to_date_time(item[time_field_name], date_time_format, drop_tzinfo)

                if start_time and date_time < start_time:
                    continue
                elif end_time and date_time > end_time:
                    continue
                else:
                    filtered_rasters.append(raster)
                    for key, value in list(item.items()):
                        if key not in ['Raster', 'Path']:
                            attribute_dict[key].append(value)

            if not filtered_rasters:
                warnings.warn(
                    "Warning: the output is None because no items have raster properties satisfying the query")

            return RasterCollection(filtered_rasters, attribute_dict) if filtered_rasters else None

    def filterByGeometry(self, query_geometry_or_extent=None):
        """
        Shortcut to filter a collection by geometries. Only those items that have intersection with the given geometry would be kept in the output

        :param query_geometry_or_extent (feature, feature layer, raster dataset, raster layer, extent, geometry): items in the collection that fails to intersect the given geometry will be excluded
        :return(RaterCollection): a filtered raster collection
        """
        if not self._is_mosaic:
            filter_geometry = get_geometry(query_geometry_or_extent)
            filtered_rasters = []
            attribute_dict = defaultdict(list)

            for item in iter(self):
                raster = self._get_raster_from_item(item)
                if not filter_geometry.disjoint(raster.extent):
                    filtered_rasters.append(raster)
                    for key, value in list(item.items()):
                        if key not in ['Raster', 'Path']:
                            attribute_dict[key].append(value)

            if not filtered_rasters:
                warnings.warn(
                    "Warning: the output is None because no items have raster properties satisfying the query")
            return RasterCollection(filtered_rasters, attribute_dict) if filtered_rasters else None

        return self.filter(query_geometry_or_extent=query_geometry_or_extent)

    def filterByAttribute(self, field_name, operator, field_values):
        """
        Shortcut to filter a collection by attribute

        :param field_name(String): the name of the field to filter
        :param operator(String): one of "EQUALS", "LESS_THAN", "GREATER_THAN", "NOT_EQUALS", "NOT_LESS_THAN", "NOT_GREATER_THAN",
                        "STARTS_WITH", "ENDS_WITH", "NOT_STARTS_WITH", "NOT_ENDS_WITH", "CONTAINS", "NOT_CONTAINS",
                        "IN" and "NOT_IN"
        :param field_values (String, Numeric, List): the values to compare against.
        :return(RaterCollection): a filtered raster collection
        """
        if not isinstance(field_name, str):
            raise TypeError("field_name should be string")

        if field_name not in self.fields:
            raise ValueError('field_name does not exist')

        def filter_by_attribute_for_list_rasters(field_name, operator, field_values):
            filtered_rasters = []
            attribute_dict = defaultdict(list)

            for item in iter(self):
                raster = self._get_raster_from_item(item)

                field_value = item[field_name]

                selected = False
                if operator == 'equals':
                    selected = (field_value == field_values)
                elif operator == 'less_than':
                    selected = (field_value < field_values)
                elif operator == 'greater_than':
                    selected = (field_value > field_values)
                elif operator == 'not_equals':
                    selected = (field_value != field_values)
                elif operator == 'not_less_than':
                    selected = (field_value >= field_values)
                elif operator == 'not_greater_than':
                    selected = (field_value <= field_values)
                elif operator == 'starts_with':
                    selected = (field_value.startswith(field_values))
                elif operator == 'ends_with':
                    selected = (field_value.endswith(field_values))
                elif operator == 'not_starts_with':
                    selected = (not field_value.startswith(field_values))
                elif operator == 'not_ends_with':
                    selected = (not field_value.endswith(field_values))
                elif operator == 'contains':
                    selected = (field_values in field_value)
                elif operator == 'not_contains':
                    selected = (field_values not in field_value)
                elif operator == 'in':
                    if not isinstance(field_values, list):
                        raise TypeError(
                            "Invalid field_values. Notet that field_values must be a list when operator is 'in'")
                    selected = (field_value in field_values)
                elif operator == 'not_in':
                    if not isinstance(field_values, list):
                        raise TypeError(
                            "Invalid field_values. Notet that field_values must be a list when operator is 'not_in'")
                    selected = (field_value not in field_values)
                else:
                    raise ValueError('invalid operator')

                if selected:
                    filtered_rasters.append(raster)
                    for key, value in list(item.items()):
                        if key not in ['Raster', 'Path']:
                            attribute_dict[key].append(value)

            if not filtered_rasters:
                warnings.warn(
                    "Warning: the output is None because no items have raster properties satisfying the query")
            return RasterCollection(filtered_rasters, attribute_dict) if filtered_rasters else None

        if self._is_mosaic:
            query_string = self._build_query_string(field_name, operator.lower(), field_values)
            return self.filter(query_string)
        else:
            return filter_by_attribute_for_list_rasters(field_name, operator.lower(), field_values)

    def sort(self, field_name, ascending=True):
        """
        sort a raster collection by the specified field name

        :param field_name (String): the field to sort by
        :param ascending (Bool): Whether to sort in ascending or descending order. Default: true (ascending)
        :return(RaterCollection): a sorted raster collection
        """
        if not isinstance(field_name, str):
            raise TypeError('invalid field_name type')

        if field_name not in self.fields:
            raise ValueError('field_name does not exist')

        if ascending not in [True, False]:
            raise ValueError('invalid ascending parameter')

        if self._is_mosaic:
            return RasterCollection(self._raster_collection.sort(field_name, ascending))
        else:
            # raise RuntimeError("Sort operation is not supported for raster collection created from a list of rasters")
            sorted_data_frame = self._export_data_frame().sort_values(by=field_name, ascending=ascending)
            # rasters = sorted_data_frame.pop('Raster').to_list()
            return RasterCollection(sorted_data_frame)

    def getFieldValues(self, field_name, max_count=0):
        """
        get values of a given field
        :param field_name (String): the field name to extract values from
        :param max_count (Int): the number to limit the collection to.
        :return(RaterCollection): a list of values at the given field
        """
        if not isinstance(max_count, int):
            raise TypeError("max_count must be positive integer")
        if max_count < 0:
            raise ValueError("max_count must be positive integer")

        if not isinstance(field_name, str):
            raise TypeError("field_name must be string type")
        if field_name not in self.fields:
            raise ValueError('field_name does not exist')

        if max_count == 0:
            max_count = self.count

        if not self._is_mosaic:
            return self._df[field_name].tolist()[:max_count]

        return self._raster_collection.values(field_name, max_count)

    def toMultidimensionalRaster(self, variable_field_name='', dimension_field_names=''):
        """
        convert the raster collection to a multidimensional raster

        :param variable_field_name (String): the name of the field that contains the variable names
        :param dimension_field_names (String, List of String): the name(s) of the fields that contains the dimension names
        :return(Raster): a multidimensional raster. Each item in the source raster collection becomes a slice in the multidimensional raster
        """
        if not isinstance(variable_field_name, str):
            raise TypeError('variable_field_name must be string type')
        if not (isinstance(dimension_field_names, list) or isinstance(dimension_field_names, str)):
            raise TypeError('dimension_field_names must be a single string or a list of string')

        if variable_field_name == '' and dimension_field_names == '':
            return self._raster_collection.raster()

        if variable_field_name not in self.fields:
            raise ValueError('variable_field_name does not exist')

        if isinstance(dimension_field_names, list):
            for dimension_field_name in dimension_field_names:
                if dimension_field_name not in self.fields:
                    raise ValueError('the given dimension_field_name does not exist')
            dimension_field_names = ','.join(dimension_field_names)
        else:
            if dimension_field_names not in self.fields:
                raise ValueError('the given dimension_field_name does not exist')

        return self._raster_collection.raster(True, variable_field_name, dimension_field_names)

    def max(self, ignore_nodata=True, extent_type="FirstOf", cellsize_type="FirstOf"):
        """
        For each band, calculate the maximum value of each pixel across the the stack of rasters. Bands are matched by band index

        :param ignore_nodata (Bool): Specifies whether NoData values are ignored.

                                    - True : The method will include all valid pixels and ignore any NoData pixels.
                                                This is the default.
                                    - False : The method will result in NoData if there are any NoData values.
        :param extent_type(string): one of "FirstOf", "IntersectionOf" "UnionOf", "LastOf"
        :param cellsize_type(string): one of "FirstOf", "MinOf", "MaxOf "MeanOf", "LastOf"
        :return(Raster): a raster that contains the maximum value of each pixel at each band
        """
        fn = "MaxContinueOnNoData" if ignore_nodata else "Max"
        return self._aggregate_function(fn_name=fn, extent_type=extent_type, cellsize_type=cellsize_type)

    def min(self, ignore_nodata=True, extent_type="FirstOf", cellsize_type="FirstOf"):
        """
        For each band, calculate the minimum value of each pixel across the the stack of rasters. Bands are matched by band index
        :param ignore_nodata (Bool): Specifies whether NoData values are ignored.

                                    - True : The method will include all valid pixels and ignore any NoData pixels.
                                                This is the default.
                                    - False : The method will result in NoData if there are any NoData values.
        :param extent_type(string): one of "FirstOf", "IntersectionOf" "UnionOf", "LastOf"
        :param cellsize_type(string): one of "FirstOf", "MinOf", "MaxOf "MeanOf", "LastOf"
        :return(Raster): a raster that contains the minimum value of each pixel at each band
        """
        fn = "MinContinueOnNoData" if ignore_nodata else "Min"
        return self._aggregate_function(fn_name=fn, extent_type=extent_type, cellsize_type=cellsize_type)


    def median(self, ignore_nodata=True, extent_type="FirstOf", cellsize_type="FirstOf"):
        """
        For each band, calculate the median value of each pixel across the the stack of rasters. Bands are matched by band index

        :param ignore_nodata (Bool): Specifies whether NoData values are ignored.

                                    - True : The method will include all valid pixels and ignore any NoData pixels.
                                                This is the default.
                                    - False : The method will result in NoData if there are any NoData values.
        :param extent_type(string): one of "FirstOf", "IntersectionOf" "UnionOf", "LastOf"
        :param cellsize_type(string): one of "FirstOf", "MinOf", "MaxOf "MeanOf", "LastOf"
        :return(Raster): a raster that contains the median value of each pixel at each band
        """
        fn = "MedContinueOnNoData" if ignore_nodata else "Med"
        return self._aggregate_function(fn_name=fn, extent_type=extent_type, cellsize_type=cellsize_type)

    def mean(self, ignore_nodata=True, extent_type="FirstOf", cellsize_type="FirstOf" ):
        """
        For each band, calculate the mean value of each pixel across the the stack of rasters. Bands are matched by band index

        :param ignore_nodata (Bool): Specifies whether NoData values are ignored.

                                    - True : The method will include all valid pixels and ignore any NoData pixels.
                                                This is the default.
                                    - False : The method will result in NoData if there are any NoData values.
        :param extent_type(string): one of "FirstOf", "IntersectionOf" "UnionOf", "LastOf"
        :param cellsize_type(string): one of "FirstOf", "MinOf", "MaxOf "MeanOf", "LastOf"
        :return(Raster): a raster that contains the mean value of each pixel at each band
        """
        fn = "MeanContinueOnNoData" if ignore_nodata else "Mean"
        return self._aggregate_function(fn_name=fn, extent_type=extent_type, cellsize_type=cellsize_type)

    def majority(self, ignore_nodata=True, extent_type="FirstOf", cellsize_type="FirstOf"):
        """
        For each band, calculate the majority value of each pixel across the the stack of rasters. Bands are matched by band index

        :param ignore_nodata (Bool): Specifies whether NoData values are ignored.

                                    - True : The method will include all valid pixels and ignore any NoData pixels.
                                                This is the default.
                                    - False : The method will result in NoData if there are any NoData values.
        :param extent_type(string): one of "FirstOf", "IntersectionOf" "UnionOf", "LastOf"
        :param cellsize_type(string): one of "FirstOf", "MinOf", "MaxOf "MeanOf", "LastOf"
        :return(Raster): a raster that contains the majority value of each pixel at each band
        """
        fn = "MajorityContinueOnNoData" if ignore_nodata else "Majority"
        return self._aggregate_function(fn_name=fn, extent_type=extent_type, cellsize_type=cellsize_type)

    def sum(self, ignore_nodata=True, extent_type="FirstOf", cellsize_type="FirstOf"):
        """
        For each band, calculate the sum value of each pixel across the the stack of rasters. Bands are matched by band index

        :param ignore_nodata (Bool): Specifies whether NoData values are ignored.

                                    - True : The method will include all valid pixels and ignore any NoData pixels.
                                                This is the default.
                                    - False : The method will result in NoData if there are any NoData values.
        :param extent_type(string): one of "FirstOf", "IntersectionOf" "UnionOf", "LastOf"
        :param cellsize_type(string): one of "FirstOf", "MinOf", "MaxOf "MeanOf", "LastOf"
        :return(Raster): a raster that contains the sum value of each pixel at each band
        """
        fn = "SumContinueOnNoData" if ignore_nodata else "Sum"
        return self._aggregate_function(fn_name=fn, extent_type=extent_type, cellsize_type=cellsize_type)

    def std(self, ignore_nodata=True, extent_type="FirstOf", cellsize_type="FirstOf"):
        """
        For each band, calculate standard deviation of each pixel across the the stack of rasters. Bands are matched by band index

        :param ignore_nodata (Bool): Specifies whether NoData values are ignored.

                                    - True : The method will include all valid pixels and ignore any NoData pixels.
                                                This is the default.
                                    - False : The method will result in NoData if there are any NoData values.
        :param extent_type(string): one of "FirstOf", "IntersectionOf" "UnionOf", "LastOf"
        :param cellsize_type(string): one of "FirstOf", "MinOf", "MaxOf "MeanOf", "LastOf"
        :return(Raster): a raster that contains the sum value of each pixel at each band
        """
        fn = "StdContinueOnNoData" if ignore_nodata else "Std"
        return self._aggregate_function(fn_name=fn, extent_type=extent_type, cellsize_type=cellsize_type)

    def mosaic(self, mosaic_method="FIRST"):
        """
        Composites all the rasters in a collection to a single raster

        :param mosaic_method (String): the method used to handle overlapping areas, including FIRST(default),'LAST', 'MIN', 'MAX', 'MEAN', 'MEDIAN', 'SUM'
        :return(Raster): a raster after mosaicing all the rasters in the collection
        """
        if not isinstance(mosaic_method, str) or mosaic_method.upper() not in ['FIRST', 'LAST', 'MIN', 'MAX', 'MEAN',
                                                                               'MEDIAN', 'SUM']:
            raise ValueError("invalid mosic method")

        mosaic_method = mosaic_method.upper()
        if mosaic_method in ['FIRST', 'LAST']:
            if 'Raster' in self.fields:
                return Merge(self.getFieldValues('Raster'), resolve_overlap=mosaic_method)
            elif 'Path' in self.fields:
                rasters = [arcpy.Raster(path) for path in self.getFieldValues('Path')]
                return Merge(rasters, resolve_overlap=mosaic_method)
            else:
                raise ValueError('invalid raster collection')
        else:
            function_map = {"MIN":"MinContinueOnNoData",
                            "MAX":"MaxContinueOnNoData",
                            "MEAN":"MeanContinueOnNoData",
                            "MEDIAN":"MedContinueOnNoData",
                            "SUM":"SumContinueOnNoData"}

            if mosaic_method.upper() in list(function_map.keys()):
                return self._aggregate_function(fn_name=function_map[mosaic_method.upper()], extent_type='UnionOf') #ExtentType 2 - Union of extents
            else:
                raise RuntimeError('invalid mosaic method ' + str(mosaic_method))

    def qualityMosaic(self, quality_rc_or_list, statistic_type="MAX"):
        """
        Composites all the rasters in a collection based on a quality input. By default, each pixel in the output is based on which image in the collection has the same index with the image in the quality_rc_or_list that has the maximum value (default)

        :param quality_rc_or_list(RasterCollection or List): the raster colltion or a list of Raster to be used as quality. It must have same number of items with the collection to be mosaiced.
        :param statistic_type(String): the statistic method used to get the index from the quality rc. Its value could be MAX(default),MIN, MEDIAN
        :return(Raster): a raster after mosaicing all the rasters in the collection
        """
        if isinstance(quality_rc_or_list, list):
            for item in quality_rc_or_list:
                if not isinstance(item, arcpy.Raster):
                    raise TypeError('quality_rc must be a RasterCollection or a list of Raster objects')
        elif not isinstance(quality_rc_or_list, arcpy.ia.RasterCollection):
            raise TypeError('quality_rc must be a RasterCollection or a list of Raster objects')

        if not isinstance(statistic_type, str) or statistic_type.upper() not in ['MAX', 'MIN', 'MEDIAN']:
            raise ValueError('invalid statistic_type value')

        statistic_type = statistic_type.upper()

        statistics_type_code = {'MAX': 0, 'MIN': 1, 'MEDIAN': 2}

        if isinstance(quality_rc_or_list, arcpy.ia.RasterCollection):
            if quality_rc_or_list.count != self.count:
                raise ValueError('the quality collection must have same number of items as the calling collection')

            if 'Raster' in quality_rc_or_list.fields:
                rasters = quality_rc_or_list.getFieldValues('Raster')
            elif 'Path' in quality_rc_or_list.fields:
                rasters = [arcpy.Raster(path) for path in quality_rc_or_list.getFieldValues('Path')]
        elif isinstance(quality_rc_or_list, list):
            if len(quality_rc_or_list) != self.count:
                raise ValueError('the quality raster list must have same number of items as the calling collection')
            rasters = quality_rc_or_list
        else:
            raise ValueError('invalid quality_rc parameter')

        arg_statistics_result = Apply(rasters, 'ArgStatistics',
                                      {'ArgStatisticsType': statistics_type_code[statistic_type], 'IgnoreNoData': True, "ExtentType":2})

        arg_statistics_result = arg_statistics_result + 1  # the index in argstatistics output counts from 0, but Pick counts from 1

        if 'Raster' in self.fields:
            rasters = self.getFieldValues('Raster')
        elif 'Path' in self.fields:
            rasters = self.getFieldValues('Path')
        else:
            raise ValueError('invalid raster collection')

        return Apply([arg_statistics_result, rasters], 'Pick', {"ExtentType":2})

    def selectBands(self, band_ids_or_names):
        """
        Return a new raster collection that only contains the selected bands in each raster

        :param band_ids_or_names (List): a list of Band ID or Band Names. Band ID uses one-based indexing
        :return(RasterCollection): a raster collection with only the selected bands
        """

        # type checking
        by_bandID_or_bandName = 0  # 1: by band id; 2: by band name
        if not (isinstance(band_ids_or_names, list) or isinstance(band_ids_or_names, str) or isinstance(
                band_ids_or_names, int)):
            raise TypeError('bands must be either a list, a single band ID or a single band Name')
        if isinstance(band_ids_or_names, list):
            for band in band_ids_or_names:
                if not (isinstance(band, int) or isinstance(band, str)):
                    raise TypeError('elements in band_ids_or_names must be integer or string type')
                if isinstance(band, int) and by_bandID_or_bandName == 0:
                    by_bandID_or_bandName = 1
                elif isinstance(band, int) and by_bandID_or_bandName == 2:
                    raise TypeError('elements in band_ids_or_names should either all be integer or string type')
                if isinstance(band, str) and by_bandID_or_bandName == 0:
                    by_bandID_or_bandName = 2
                elif isinstance(band, str) and by_bandID_or_bandName == 1:
                    raise TypeError('elements in band_ids_or_names should either all be integer or string type')

        elif isinstance(band_ids_or_names, str):
            by_bandID_or_bandName = 2
        else:
            by_bandID_or_bandName = 1

        if 'Raster' in self.fields:
            rasters = self.getFieldValues('Raster')
        elif 'Path' in self.fields:
            rasters = [arcpy.Raster(path) for path in self.getFieldValues('Raster')]
        else:
            raise ValueError('invalid raster collection')

        assert by_bandID_or_bandName == 1 or by_bandID_or_bandName == 2

        new_rasters = []
        if by_bandID_or_bandName == 1:
            new_rasters = [Apply(raster, 'ExtractBand', {'BandIDs': band_ids_or_names}) for raster in rasters]
        elif by_bandID_or_bandName == 2:
            new_rasters = [Apply(raster, 'ExtractBand', {'BandNames': band_ids_or_names}) for raster in rasters]

        in_raster_collection = {}
        for field_name in self.fields:
            if field_name == 'Raster' or field_name == 'Path':
                continue
            try:
                # we could not getFieldValues from the field URI in mosaic dataset
                in_raster_collection[field_name] = self.getFieldValues(field_name)
            except Exception as e:
                if self._is_mosaic and field_name == "Uri":
                    continue
                else:
                    raise RuntimeError('invalid field values in ' + str(field_name))

        return RasterCollection(new_rasters, in_raster_collection)

    def map(self, func):
        """
        apply a function to each item in the raster collection
        :param func: follows the signature:
                    Args: item, an item in the raster collection
                    Returns: dict, {'raster': arcpy.Raster, fieldName:fieldValue ...}
        :return:
            a new raster collection object that has applied the func to each item
        """
        res = list(map(func, iter(self)))

        rasters = []
        attribute_dict = defaultdict(list)
        for item in res:
            rasters.append(item['raster'])
            for key, value in list(item.items()):
                if key != 'raster':
                    attribute_dict[key].append(value)

        return RasterCollection(rasters, attribute_dict)

    def filterByRasterProperty(self, property_name, operator, property_values):
        """
        filter the raster collection by property of each raster

        :param property_name: str, the property name to operate on
        :param operator: "EQUALS", "LESS_THAN", "GREATER_THAN","NOT_EQUALS", "NOT_LESS_THAN", "NOT_GREATER_THAN",
                        "STARTS_WITH", "ENDS_WITH", "NOT_STARTS_WITH", "NOT_ENDS_WITH", "CONTAINS", "NOT_CONTAINS",
                        "IN" and "NOT_IN"
        :param property_values: String or List of String
        :return: filtered RasterCollection or None if no raster is selected
        """
        if self._is_mosaic:
            raster_query = self._build_query_string(property_name, operator.lower(), property_values)
            return self.filter(raster_query=raster_query)

        values = property_values
        if not isinstance(values, numbers.Number) and not isinstance(values, str) and not isinstance(values, list):
            raise TypeError('property_values must be number, string or list')

        if isinstance(values, list):
            for v in values:
                if not isinstance(values, numbers.Number) and not isinstance(v, str):
                    raise TypeError('property_values must be a list of number or a list of string')

        filtered_rasters = []
        attribute_dict = defaultdict(list)

        for item in iter(self):
            raster = self._get_raster_from_item(item)

            raster_properties = raster.properties
            if property_name not in raster_properties:
                continue
            property_value = raster.getProperty(property_name)
            operator = operator.lower()
            selected = False
            if operator == 'equals':
                selected = (property_value == values)
            elif operator == 'less_than':
                selected = (property_value < values)
            elif operator == 'greater_than':
                selected = (property_value > values)
            elif operator == 'not_equals':
                selected = (property_value != values)
            elif operator == 'not_less_than':
                selected = (property_value >= values)
            elif operator == 'not_greater_than':
                selected = (property_value <= values)
            elif operator == 'starts_with':
                selected = (property_value.startswith(values))
            elif operator == 'ends_with':
                selected = (property_value.endswith(values))
            elif operator == 'not_starts_with':
                selected = (not property_value.startswith(values))
            elif operator == 'not_ends_with':
                selected = (not property_value.endswith(values))
            elif operator == 'contains':
                selected = (values in property_value)
            elif operator == 'not_contains':
                selected = (values not in property_value)
            elif operator == 'in':
                if not isinstance(values, list):
                    raise TypeError("Invalid values. Note that values must be a list when operator is 'in'")
                selected = (property_value in values)
            elif operator == 'not_in':
                if not isinstance(values, list):
                    raise TypeError("Invalid values. Note that values must be a list when operator is 'not_in'")
                selected = (property_value not in values)
            else:
                raise ValueError('invalid operator')

            if selected:
                filtered_rasters.append(raster)
                for key, value in list(item.items()):
                    if key not in ['Raster', 'Path']:
                        attribute_dict[key].append(value)

        if not filtered_rasters:
            warnings.warn("Warning: the output is None because no items have raster properties satisfying the query")
        return RasterCollection(filtered_rasters, attribute_dict) if filtered_rasters else None

    def filterByCalendarRange(self, calendar_field, start, end=None, time_field_name='StdTime', date_time_format=None):
        """
        filter the raster collection by a calindar_field and its start and end value (inclusive). i.e. if you would like
        to select all the rasters that have the time stamp on Monday, specify calendar_field as 'DAY_OF_WEEK' and put start and
        end to 1.

        :param calendar_field: string, one of 'YEAR', 'MONTH', 'QUARTER', 'WEEK_OF_YEAR', 'DAY_OF_YEAR', 'DAY_OF_MONTH',
         'DAY_OF_WEEK', 'HOUR'
        :param start: integer, the start time. inclusive.
        :param end: integer, default is None, if default is used, the end is set equal to start. inclusive.
        :param time_field_name: string, the time field anme, default is 'StdTime'.
        :param date_time_format: the time format that is used to format the time field values. Please ref the python
                                date time standard for this argument. https://docs.python.org/3/library/datetime.html#strftime-and-strptime-behavior
                                Default is None and this means using the Pro standard time format '%Y-%m-%dT%H:%M:%S'
                                and ignoring the following sub-second.

        :return: a filtered raster collection.
        """
        # validation
        calendar_field_types = ['YEAR', 'MONTH', 'QUARTER', 'WEEK_OF_YEAR', 'DAY_OF_YEAR', 'DAY_OF_MONTH',
                                'DAY_OF_WEEK', 'HOUR']
        if not isinstance(calendar_field, str):
            raise TypeError('calender_field must be string type')

        if calendar_field not in calendar_field_types:
            raise ValueError('invalid calender_field, must be one of ' + ', '.join(calendar_field_types))

        if time_field_name not in self.fields:
            raise ValueError('the time_field_name does not exist. Please input a valid name for time field.')

        if end is None:
            end = start
        # validate start and end type
        if not isinstance(start, int) or not isinstance(end, int):
            raise TypeError('start and end must be numeric.')
        if end < start:
            raise ValueError('end must be equal or larger than start.')
        # validate start and end value
        if calendar_field == 'MONTH':
            if start < 1 or start > 12 or end < 1 or end > 12:
                raise ValueError('start and end must be between [1, 12] for MONTH filter.')
        elif calendar_field == 'QUARTER':
            if start < 1 or start > 4 or end < 1 or end > 4:
                raise ValueError('start and end must be between [1, 4] for QUARTER filter.')
        elif calendar_field == 'WEEK_OF_YEAR':
            if start < 1 or start > 53 or end < 1 or end > 53:
                raise ValueError('start and end must be between [1, 53] for WEEK_OF_YEAR filter.')
        elif calendar_field == 'DAY_OF_YEAR':
            if start < 1 or start > 366 or end < 1 or end > 366:
                raise ValueError('start and end must be between [1, 366] for DAY_OF_YEAR filter.')
        elif calendar_field == 'DAY_OF_MONTH':
            if start < 1 or start > 31 or end < 1 or end > 31:
                raise ValueError('start and end must be between [1, 31] for DAY_OF_MONTH filter.')
        elif calendar_field == 'DAY_OF_WEEK':
            if start < 1 or start > 7 or end < 1 or end > 7:
                raise ValueError('start and end must be between [1, 7] for DAY_OF_WEEK filter.')
        elif calendar_field == 'HOUR':
            if start < 1 or start > 24 or end < 1 or end > 24:
                raise ValueError('start and end must be between [1, 24] for HOUR filter.')

        filtered_rasters = []
        attribute_dict = defaultdict(list)
        for item in iter(self):
            raster = self._get_raster_from_item(item)

            date_time = convert_string_to_date_time(item[time_field_name], date_time_format)

            selected = False
            if calendar_field == 'YEAR':
                if start <= date_time.year <= end:
                    selected = True
            elif calendar_field == 'MONTH':
                if start <= date_time.month <= end:
                    selected = True
            elif calendar_field == 'QUARTER':
                if start - 1 <= (date_time.month - 1) // 3 <= end - 1:
                    selected = True
            elif calendar_field == 'WEEK_OF_YEAR':
                week_number = int(date_time.strftime('%U'))
                if start <= week_number + 1 <= end:
                    selected = True
            elif calendar_field == 'DAY_OF_YEAR':
                yday = date_time.timetuple().tm_yday
                if start <= yday <= end:
                    selected = True
            elif calendar_field == 'DAY_OF_MONTH':
                mday = date_time.timetuple().tm_mday
                if start <= mday <= end:
                    selected = True
            elif calendar_field == 'DAY_OF_WEEK':
                wday = date_time.isoweekday()
                if start <= wday % 7 + 1 <= end:
                    selected = True
            elif calendar_field == 'HOUR':
                hour = date_time.timetuple().tm_hour
                if start <= hour <= end:
                    selected = True

            if selected is True:
                filtered_rasters.append(raster)
                for key, value in list(item.items()):
                    if key not in ['Raster', 'Path']:
                        attribute_dict[key].append(value)

        if not filtered_rasters:
            warnings.warn(
                "Warning: the output is None because no items have raster properties satisfying the query")

        return RasterCollection(filtered_rasters, attribute_dict) if filtered_rasters else None

    def summarizeField(self, field_name, summary_type="ALL"):
        """
        Summarizes a numeric field of the RasterCollection based on the specified summary_type
        :param field_name: str, the field name to be summarized
        :param summary_type: str or list of str representing the summary type."COUNT", "COUNT_DISTINCT", "FIRST", "HISTOGRAM", "MAX", "MEAN", "MIN",
                        "PRODUCT", "SAMPLE_SD", "SAMPLE_VAR", "SUM", "TOTAL_SD", "TOTAL_VAR", "ALL".
        :return: a dictionary with key being the summary type and the value being the summary value.
        """
        property_values = self.getFieldValues(field_name)
        summary_dict = {}
        import numpy as np
        import numbers

        if not isinstance(summary_type, list):
            summary_type = [summary_type]

        if "ALL" in list(map(str.upper, summary_type)):
            summary_type = ["COUNT", "COUNT_DISTINCT", "FIRST", "HISTOGRAM", "MAX", "MEAN", "MIN",
                        "PRODUCT", "SAMPLE_SD", "SAMPLE_VAR", "SUM", "TOTAL_SD", "TOTAL_VAR"]

        from operator import is_not
        from functools import partial
        property_values_not_none = list(filter(partial(is_not, None), property_values))

        all_num = all(isinstance(x, numbers.Number) for x in property_values_not_none)
        if not all_num:
            raise RuntimeError("Only numeric fields can be summarized")
        try:
            for summary in summary_type:
                val = None
                summary = summary.lower()
                if summary == 'count':
                    val = len(property_values_not_none)

                elif summary == 'count_distinct':
                    val = len(np.unique(property_values_not_none))

                elif summary == 'first':
                    val = property_values_not_none[0]

                elif summary == 'histogram':
                    unique, counts = np.unique(property_values_not_none, return_counts=True)
                    val = dict(list(zip(unique, counts)))

                elif summary == 'max':
                    val = np.max(property_values_not_none)

                elif summary == 'mean':
                    val = np.mean(property_values_not_none)

                elif summary == 'min':
                    val = np.min(property_values_not_none)

                elif summary == 'product':
                    val = np.prod(property_values_not_none)

                elif summary == 'sample_sd':
                    val = np.std(property_values_not_none, ddof=1)

                elif summary == 'sample_var':
                    val = np.var(property_values_not_none, ddof=1)

                elif summary == 'sum':
                    val = np.sum(property_values_not_none)

                elif summary == 'total_sd':
                    val = np.std(property_values_not_none)

                elif summary == 'total_var':
                    val = np.var(property_values_not_none)

                else:
                    raise ValueError('invalid summary_type value')

                summary_dict.update({summary:val})
        except Exception as e:
            raise RuntimeError("Failed to summarize the property")

        return summary_dict

    def merge(self, collection2):
        """
         merge method merges two image collections into one. The output has all the items that were in either collection.
        :param collection2: RasterCollection object. The second collection to merge.
        :return: Collection that has all the items that were in either collection.
        """
        import pandas as pd

        rc1=self._export_data_frame()
        rc2=collection2._export_data_frame()

        merged_collection = pd.concat([rc1, rc2], axis=0)
        merged_collection.reset_index(drop=True, inplace=True)

        return RasterCollection(merged_collection)

    def reduce(self, func, func_args={}):
        """
        The ``reduce`` method composite all the images in the collection to a single image based on a reducer function.

        :param func: The Python function to reduce the raster collection.
                     The function should accept a list of rasters as first parameter and return a single raster
        :param func_args: Optional dictionary. Additional paramters to be passed the reducer function.
        :return: Returns what the the function specified in the func arg returns

        .. code-block:: python

            # Usage Example 1: This snippet reduces a raster collection based on a reducer function from arcpy.ia module that can accept a list of rasters

            rc = RasterCollection("<data path>")
            from arcpy.ia import Max
            max_raster = rc.reduce(func=Max, func_args={"extent_type":"UnionOf"})


            # Usage Example 2: This snippet reduces a raster collection based on a custom reducer function.

            rc = RasterCollection("<data path>")

            def skewness(ras_list):
                from arcpy.ia import CellStatistics, Power, Plus
                cs_mean = CellStatistics(ras_list, "MEAN", process_as_multiband="MULTI_BAND")
                cs_stddev  = CellStatistics(ras_list, "STD", process_as_multiband="MULTI_BAND")
                cs_median = CellStatistics(ras_list, "MEDIAN", process_as_multiband="MULTI_BAND")
                out_skewness = 3*(cs_mean - cs_median)/cs_stddev
                return out_skewness

            skewness = rc.reduce(func=skewness)

        """

        reduced_raster = func(self, **func_args)
        return reduced_raster


    def addField(self, field_name, field_values):
        """
         Adds a new field to the raster collection and populate it with values.
        :param field_name: Required string. The name of the field to be added.
        :param field_values: Required list. The list of values associated with the field name.
                             The length of the list should match the number of items in the raster collection
                             Providing only one value will set the same value for all rows.
        :return: Collection that has the new field added.
        """

        if field_name in self.fields:
            raise RuntimeError('Cannot add the field. The field name already exists.')

        df=self._export_data_frame()
        new_df = df.copy()

        if not isinstance(field_values, list):
            field_values = [field_values]

        if self.count != len(field_values):
            if len(field_values) == 1:
                field_values = field_values*self.count
            else:
                raise RuntimeError('Length of field_values does not match the raster collection count')

        try:
            new_df[field_name] = field_values
        except Exception as e:
            raise RuntimeError('Failed to add the field to the raster collection')

        return RasterCollection(new_df)

    def groupBy(self, field_name):
        """
         groupBy method can be used to group the raster collection based on a field.
        :param field_name: Required string.The name of the field that is used to group the raster collection. Items with the same field values will be grouped together.
        :return: Dictionary.The dictionary that contains the grouped raster collections. The key of the dictionary is a field value of the field name that the grouping is based on.
                 The value of the dictionary is a raster collection whose field name contains the same field value.
        """

        df = self._export_data_frame()
        try:
            group_by_obj = df.groupby(field_name)
            groups={}

            for key, val in list(group_by_obj.groups.items()):
                groups.update({key:RasterCollection(group_by_obj.get_group(key))})
            return groups
        except Exception as e:
            raise RuntimeError('groupBy failed with the field_name - '+field_name)

    def findImages(self,
                   from_geometry=None,
                   to_geometry=None,
                   object_ids= None,
                   where_clause = None,
                   query_geometry_or_extent=None,
                   raster_query=None,
                   max_count = None):

        """
        The function will find all images that can see the view point, and are ordered based on the distance
        from the view point to the center of each image.

        :param from_geometry (Point Geometry): Required Point geometry object. It is the scene camera position in the air.
        :param to_geometry (Point Geometry): Required Point geometry object.
        :param object_ids (list): Optional list. The object IDs of the raster catalog to be queried.
        :param where_clause (string): Optional string. An SQL expression used to select a subset of rasters
        :param query_geometry_or_extent (feature, feature layer, raster dataset, raster layer, extent, geometry): Optional Geometry or Extent object. The geometry or extent to be used to query the raster catalog.
        :param raster_query (SQL Expression): An SQL expression used to select a subset of rasters by the raster's key properties.
        :param max_count: Optional int. The maximum number of results to be returned.

        :return: Dictionary. A dictionary containing the information of all images that satisfy the query conditions.
        """

        if not self._is_mosaic:
            raise RuntimeError('findImages is only supported for raster catalog mosaic dataset')
        else:
            if from_geometry:
                from_geometry = get_geometry(from_geometry)
            if to_geometry:
                to_geometry = get_geometry(to_geometry)

            if query_geometry_or_extent:
                query_geometry_or_extent = get_geometry(query_geometry_or_extent)

            if object_ids is not None:
                if not isinstance(object_ids, list):
                    raise RuntimeError('object_ids should be a list of object IDs')

            if max_count is None:
                max_count = -1


            res = self._raster_collection.find(from_geometry, to_geometry, max_count, where_clause,
                                               query_geometry_or_extent, raster_query, object_ids)
            return res

    def imageToMap(self,
                   geometry,
                   raster_id,
                   options=None):

        """
        The function converts a geometry in image space to map space.

        :param geometry (Geometry): Required geometry object. The Geometry object that needs to be converted from image space to map space.
        :param raster_id (int): Required integer. The raster_id value identifies which raster of the mosaic dataset will be used.
        :param options (dict): Optional dict.  Optional dict. It has DOff and Adjust keys.
                                - DOff is the depth offset value.
                                - Adjust is a boolean value. If Adjust is set to True, the "background" vertices will be adjusted to the foreground.

                                Syntax: {"DOff":<depth offset value>, "Adjust": True/False}

        :return: Geometry object.
        """

        if not self._is_mosaic:
            raise RuntimeError('imageToMap is only supported for raster catalog mosaic dataset')
        else:
            if geometry:
                geometry = get_geometry(geometry)


            if options is not None:
                if not isinstance(options, dict):
                    raise RuntimeError('options should be of type dict')

            res = self._raster_collection.imageToMap(geometry, raster_id, options)
            return res


    def mapToImage(self,
                   geometry,
                   raster_id,
                   options=None):

        """
        The function converts a geometry from map space to image space.

        :param geometry (Geometry): Required geometry object. The Geometry object that needs to be converted from map space to image space.
        :param raster_id (int): Required integer. The raster_id value identifies which raster of the mosaic dataset will be used.
        :param options (dict): Optional dict.  Optional dict. It has VisibleOnly key.

                                - VisibleOnly is a boolean value. If it's true, method will return an empty geometry if vertices are behind the depths

                                Syntax: {"VisibleOnly": True/False}

        :return: Geometry object.
        """

        if not self._is_mosaic:
            raise RuntimeError('mapToImage is only supported for raster catalog mosaic dataset')
        else:
            if geometry:
                geometry = get_geometry(geometry)


            if options is not None:
                if not isinstance(options, dict):
                    raise RuntimeError('options should be of type dict')

            res = self._raster_collection.mapToImage(geometry, raster_id, options)
            return res

    def getImageURL(self,
                   image_uri):

        """
        Returns an accessible url to the image.

        :param image_uri (string): Required string. URI of the image to be accessed.

        :return: string. The accessible url to the image.
        """

        if not self._is_mosaic:
            raise RuntimeError('getImageURL is only supported for raster catalog mosaic dataset')
        else:

            res = self._raster_collection.getImageURL(image_uri)
            return res

    def measure(self,
                from_geometry=None,
                to_geometry=None,
                raster_id= None):

        """
        The function measure distance, length, area etc between the from and to geometry.

        :param from_geometry (Point Geometry): Required from geometry object.
        :param to_geometry (Point Geometry): Required to geometry object.
        :param raster_id (int): Required integer. The raster_id value identifies which raster of the mosaic dataset will be used.

        :return: Dictionary. A dictionary containing information such as Shape, Length, Center, Area
        """

        if not self._is_mosaic:
            raise RuntimeError('measure is only supported for raster catalog mosaic dataset')
        else:
            if from_geometry:
                from_geometry = get_geometry(from_geometry)
            if to_geometry:
                to_geometry = get_geometry(to_geometry)

            res = self._raster_collection.measure(from_geometry, to_geometry, raster_id)
            return res

    def imageToMapMultiray(self,
                           geometries,
                           raster_ids):

        """
        The function computes a geometry in map space from multiple views of the geometry in image space on multiple images.

        :param geometries (list): Required list of geometry objects.
        :param raster_ids (list): Required list of raster ids. The raster_id value identifies which raster of the mosaic dataset will be used.

        :return: Dictionary
        """

        if not self._is_mosaic:
            raise RuntimeError('measure is only supported for raster catalog mosaic dataset')
        else:
            if not isinstance(geometries, list):
                raise RuntimeError('geometries should be of type list')
            if not isinstance(raster_ids, list):
                raise RuntimeError('raster_ids should be of type list')

            new_geometry_list = []
            for geometry in geometries:
                new_geometry = get_geometry(geometry)
                new_geometry_list.append(new_geometry)

            res = self._raster_collection.imageToMapMultiray(new_geometry_list, raster_ids)
            return res

    def _get_raster_from_item(self, item):
        if 'Raster' in item:
            raster = item['Raster']
        elif 'Path' in item:
            raster = arcpy.Raster(item['Path'], is_multidimensional=True)
        else:
            raise RuntimeError('invalid raster collection')
        return raster

    @staticmethod
    def fromSTACAPI(
        stac_api,
        query=None,
        attribute_dict=None,
        request_method="POST",
        request_params=None,
        context=None,
    ):
        """
        The fromSTACAPI method creates a RasterCollection object from a SpatioTemporal Asset Catalog (STAC) API search query.

        :param stac_api: Required string. URL of the STAC API root endpoint. The STAC API where the search needs to be performed.
                         Example: "https://planetarycomputer.microsoft.com/api/stac/v1"

        :param query: Optional dictionary. The GET/POST request query dictionary that can be used to query a STAC API's search endpoint.
                      (keys/values would depend on the specification of the STAC API in use and the request_method parameter value).

                      For the bbox query parameter, Extent and Polygon objects are also accepted (in any spatial reference).

                      Example:
                            {
                            "collections": ["sentinel-2-l2a"],
                            "bbox": [-110, 39.5, -105, 40.5],
                            "query": {"eo:cloud_cover": {"lt": 0.5}},
                            "datetime": "2020-10-05T00:00:00Z/2020-10-10T12:31:12Z",
                            "limit": 100
                            }

        :param attribute_dict: Optional dictionary. The attribute information to be added to each (STAC Item) raster returned from the query.
                               For each key-value pair, the key is the attribute name, and the value is a list of values that represent the attribute value for each raster.

                               Attribute values can also be collected from the STAC Items automatically using the STAC Item metadata information.
                               It can be done by specifying the STAC Item property name for the Attribute of interest in this format:
                                        key : value -> Attribute display name : STAC item property name

                                Example:
                                 {
                                   "Name":"id",
                                   "Sensor":"platform",
                                   "StdTime":"datetime",
                                   "Cloud Cover":"eo:cloud_cover",
                                   "Extent":"bbox"
                                 }

        :param request_method: Optional string. The HTTP request method used with the STAC API for making the search.
                               Acceptable methods: GET, POST (This is the default).
                               Example: "POST"

        :param request_params: Optional dictionary. This parameter can be used to set the properties for making the STAC API search request.
                               These are the requests.post() or requests.get() method parameters and values will be specified in dictionary format.
                               Example:
                                    {
                                    "verify":True,
                                    "headers":{"Authorization": "Bearer access_token_string"}
                                    }

        :param context: Optional dictionary. Additional properties to control the creation of RasterCollection.

                        Possible options:
                            - ``assetManagement``: Specifies how to manage and select assets for your RasterCollection.
                                If multiple assets are selected, the collection will be composed of multiband rasters
                                from those selected asset types.

                                Type: List, String or Dictionary

                                Format:
                                When working with individual assets, the asset key can be specified directly (Eg: "B02", {"key": "B02"})
                                else it could be a list. Each item in the list represents an asset key or identifier. Items inside the list
                                can either be strings representing the asset key directly, or dictionaries providing
                                additional details for locating the asset.

                                The following keys could be used to provide the additional information of the assets (through individual dictionaries):

                                    - ``key``: A string representing the unique identifier for an asset. For example: "red".

                                    - ``path``: A dictionary representing the hierarchy of keys to navigate to the asset. \
                                        For example: ["alternate", "s3"]

                                    - ``hrefKey``: A string representing the key to access the asset URL. If different from the default "href" key, \
                                        it should be specified here. For example: "msft:https-url".

                                Usage examples:
                                    - "red"
                                    - ["red", "green", "blue"]
                                    - {"key": "tasmin", "hrefKey": "msft:https-url"}
                                    - [{"key": "TRAD", "path": ["alternate", "s3"]}, {"key": "DRAD", "path": ["alternate", "s3"]}]

                                Example:

                                .. code-block:: python

                                    {
                                        "assetManagement": [
                                            "red",
                                            "blue"
                                        ]
                                    }

                            - ``processingTemplate``: Specifies the processing template to be applied to the individual rasters in the collection.
                                Supported for selected collections and raster types. Read more about this in the
                                `Satellite sensor raster types <https://pro.arcgis.com/en/pro-app/latest/help/data/imagery/satellite-sensor-raster-types.htm>`__ documentation.

                                Type: String

                                Default: "Multiband" (for supported raster types only else None)

                                Example:

                                .. code-block:: python

                                    {
                                        "processingTemplate": "Surface Reflectance"
                                    }

        :return: Returns a RasterCollection object

        .. code-block:: python

            # Usage Example: Creating a RasterCollection object from a STAC API query.

            rc = RasterCollection.fromSTACAPI(stac_api=stac_api_url,
                                              query={
                                                      "collections": ["sentinel-2-l2a"],
                                                      "bbox": [-110, 39.5, -105, 40.5],
                                                      "query": {"eo:cloud_cover": {"lt": 0.5}},
                                                      "datetime": "2020-10-05T00:00:00Z/2020-10-10T12:31:12Z",
                                                      "limit": 100
                                                  },
                                              attribute_dict={
                                                              "Name":"id",
                                                              "Sensor":"platform",
                                                              "StdTime":"datetime",
                                                              "Cloud Cover":"eo:cloud_cover",
                                                              "Spatial Reference":"proj:epsg",
                                                              "Extent":"bbox"
                                                          }
                                             )

        """

        if not isinstance(stac_api, str):
            raise RuntimeError(f"Invalid STAC API URL-\n{stac_api}")
        api_search_endpoint = (
            stac_api + "search" if stac_api.endswith("/") else stac_api + "/search"
        )

        if request_params is None:
            request_params = {}
        if not isinstance(request_params, dict):
            raise RuntimeError("request_params should be of type dictionary")
        if any(key in request_params for key in ["url", "params", "data", "json"]):
            raise RuntimeError(
                "request_params cannot contain these keys : url, params, data or json"
            )

        if not isinstance(request_method, str) or request_method.upper() not in [
            "GET",
            "POST",
        ]:
            raise RuntimeError(
                "request_method can only be one of the following: GET or POST"
            )

        new_query = None
        if query is not None:
            if not isinstance(query, dict):
                raise RuntimeError("parameter query should be of type dictionary")
            new_query = query.copy()
            if "bbox" in new_query:
                query_extent = new_query["bbox"]
                from arcpy import Extent, Polygon

                if isinstance(query_extent, (Extent, Polygon)):
                    original_extent = (
                        query_extent.extent
                        if isinstance(query_extent, Polygon)
                        else query_extent
                    )
                    projected_extent = None
                    original_sr = original_extent.spatialReference
                    projection_sr = arcpy.SpatialReference(4326)
                    if original_sr is None or not original_sr.name:
                        raise RuntimeError(
                            "Invalid bbox: Polygon/Extent object should contain spatialReference"
                        )
                    try:
                        projected_extent = (
                            original_extent.projectAs(projection_sr)
                            if original_sr != projection_sr
                            else original_extent
                        )
                    except Exception:
                        raise RuntimeError(
                            "Unsupported bbox: project operation failed for the given Polygon/Extent object"
                        )
                    bbox_list = [
                        projected_extent.XMin,
                        projected_extent.YMin,
                        projected_extent.XMax,
                        projected_extent.YMax,
                    ]

                    if request_method.upper() == "GET":
                        bbox_str = ",".join(str(e) for e in bbox_list)
                        new_query["bbox"] = bbox_str
                    else:
                        new_query["bbox"] = bbox_list

        if request_method.upper() == "GET":
            data = requests.get(api_search_endpoint, params=new_query, **request_params)
        else:
            data = requests.post(api_search_endpoint, json=new_query, **request_params)

        if data.status_code != 200 or data.headers.get("content-type") not in [
            "application/json",
            "application/geo+json",
            "application/json;charset=utf-8",
            "application/geo+json; charset=utf-8",
        ]:
            raise RuntimeError(
                f"Invalid Response: Please verify that the STAC API URL and the specified query are correct-\n{data.text}"
            )

        json_data = data.json()
        if "type" not in json_data or json_data["type"] != "FeatureCollection":
            raise RuntimeError(
                f"Invalid JSON Response from the STAC API: Please verify that the STAC API URL and the specified query are correct-\n{json_data}"
            )
        items = json_data["features"]

        if len(items) < 1:
            raise RuntimeError(f"No STAC items found. Please specify a better query")

        rc_attribute_dict = {}
        attribute_dict = {} if attribute_dict is None else attribute_dict
        for key in attribute_dict:
            if isinstance(attribute_dict[key], list):
                rc_attribute_dict[key] = attribute_dict[key]
            else:
                rc_attribute_dict[key] = [
                    (
                        item[attribute_dict[key]]
                        if attribute_dict[key] in item
                        else (
                            item["properties"][attribute_dict[key]]
                            if attribute_dict[key] in item["properties"]
                            else key
                        )
                    )
                    for item in items
                ]

        from .util import _get_stac_metadata_file

        raster_list = []
        bad_dataset_indices = []
        has_crossed_threshold = False
        original_len = len(items)
        logger = None
        log_file = None

        for i, item in enumerate(items):

            try:
                metadata_file = _get_stac_metadata_file(item, context)
                if not metadata_file:
                    self_link = next(
                        (
                            link["href"]
                            for link in item["links"]
                            if link["rel"] == "self"
                        ),
                        None,
                    )
                    msg = item if self_link is None else self_link
                    raise RuntimeError(f"STAC Item not supported-\n{msg}")
                ras = (
                    CompositeBand(metadata_file)
                    if isinstance(metadata_file, list)
                    else arcpy.Raster(
                        metadata_file,
                        is_multidimensional=(
                            True
                            if metadata_file.endswith((".zarr", ".nc", ".grib2"))
                            else False
                        ),
                    )
                )
                raster_list.append(ras)
            except Exception as e:
                bad_dataset_indices.append(i)
                if logger is None:
                    logger, log_file = _get_logger(
                        logger_name="rastercollection_logger"
                    )
                if not has_crossed_threshold and len(bad_dataset_indices) > THRESHOLD:
                    print("...\nStopping printing")
                    _remove_arcpy_handler(logger)
                    has_crossed_threshold = True
                logger.warning(e)

        number_bad_datasets = len(bad_dataset_indices)
        if number_bad_datasets > 0:
            if number_bad_datasets > THRESHOLD:
                warning_msg = (
                    f"Warning: Failed to open over {THRESHOLD} raster datasets."
                )
            else:
                warning_msg = "Warning: Failed to open above raster dataset(s)."
            print(f"\n{warning_msg} Failed raster dataset(s) logged to: {log_file}")
            print(
                f"Warning: Added {original_len - number_bad_datasets}/{original_len} raster dataset(s) to the raster collection."
            )

        if "Geometry" not in rc_attribute_dict:
            geometry_list = []
            for item in items:
                geo_json = item["geometry"]
                polygon_geometry = arcpy.AsShape(geo_json)
                geometry_list.append(polygon_geometry)
            rc_attribute_dict["Geometry"] = geometry_list

        if number_bad_datasets > 0:
            for val in list(rc_attribute_dict.values()):
                for index in bad_dataset_indices[::-1]:
                    del val[index]

        if logger is not None and len(logger.handlers) > 0:
            logger.handlers.clear()

        rc = RasterCollection(
            raster_list,
            rc_attribute_dict,
        )
        return rc

    @staticmethod
    def fromSTACCatalog(
        stac_catalog, attribute_dict=None, request_params=None, context=None
    ):
        """
        The fromSTACCatalog method creates a RasterCollection object from a Static SpatioTemporal Asset Catalog (STAC).

        =================     ====================================================================
        **Parameter**         **Description**
        -----------------     --------------------------------------------------------------------
        :param stac_catalog: Required string or pystac.Catalog/pystac.Collection object. If string, then it should be the URL of the Static STAC (Catalog).
                             Example: "https://maxar-opendata.s3.amazonaws.com/events/India-Floods-Oct-2023/collection.json"

        :param attribute_dict: Optional dictionary. The attribute information to be added to each (STAC Item) raster returned from the query.
                               For each key-value pair, the key is the attribute name, and the value is a list of values that represent the attribute value for each raster.

                               Attribute values can also be collected from the STAC Items automatically using the STAC Item metadata information.
                               It can be done by specifying the STAC Item property name for the Attribute of interest in this format:
                                        key : value -> Attribute display name : STAC item property name
                               Example:
                                    {
                                        "Name":"id",
                                        "Sensor":"platform",
                                        "StdTime":"datetime",
                                        "Cloud Cover":"eo:cloud_cover",
                                        "Extent":"bbox"
                                    }

        :param request_params: Optional dictionary. This parameter can be used to set the properties for making the STAC API search request.
                               These are the requests.post() or requests.get() method parameters and values will be specified in dictionary format.
                               Example:
                                    {
                                    "verify":True,
                                    "headers":{"Authorization": "Bearer access_token_string"}
                                    }

        :param context: Optional dictionary. Additional properties to control the creation of RasterCollection.

                        Possible options:
                            - ``assetManagement``: Specifies how to manage and select assets for your RasterCollection.
                                If multiple assets are selected, the collection will be composed of multiband rasters
                                from those selected asset types.

                                Type: List, String or Dictionary

                                Format:
                                When working with individual assets, the asset key can be specified directly (Eg: "B02", {"key": "B02"})
                                else it could be a list. Each item in the list represents an asset key or identifier. Items inside the list
                                can either be strings representing the asset key directly, or dictionaries providing
                                additional details for locating the asset.

                                The following keys could be used to provide the additional information of the assets (through individual dictionaries):

                                    - ``key``: A string representing the unique identifier for an asset. For example: "red".

                                    - ``path``: A dictionary representing the hierarchy of keys to navigate to the asset. \
                                        For example: ["alternate", "s3"]

                                    - ``hrefKey``: A string representing the key to access the asset URL. If different from the default "href" key, \
                                        it should be specified here. For example: "msft:https-url".

                                Usage examples:
                                    - "red"
                                    - ["red", "green", "blue"]
                                    - {"key": "tasmin", "hrefKey": "msft:https-url"}
                                    - [{"key": "TRAD", "path": ["alternate", "s3"]}, {"key": "DRAD", "path": ["alternate", "s3"]}]

                                Example:

                                .. code-block:: python

                                    {
                                        "assetManagement": [
                                            "red",
                                            "blue"
                                        ]
                                    }

                            - ``processingTemplate``: Specifies the processing template to be applied to the individual rasters in the collection.
                                Supported for selected collections and raster types. Read more about this in the
                                `Satellite sensor raster types <https://pro.arcgis.com/en/pro-app/latest/help/data/imagery/satellite-sensor-raster-types.htm>`__ documentation.

                                Type: String

                                Default: "Multiband" (for supported raster types only else None)

                                Example:

                                .. code-block:: python

                                    {
                                        "processingTemplate": "Surface Reflectance"
                                    }

        .. code-block:: python

            # Usage Example: Creating a RasterCollection object from a Static STAC.

            rc = RasterCollection.fromSTACCatatalog(stac_catalog=stac_catalog_url,
                                                    attribute_dict={
                                                                    "Name":"id",
                                                                    "Sensor":"collection",
                                                                    "StdTime":"datetime",
                                                                    "Cloud Cover":"eo:cloud_cover",
                                                                    "Extent":"bbox"
                                                                   }
                                                    )

        """
        from .util import (
            _get_stac_links,
            _get_all_stac_catalog_items,
            _get_static_catalog_item_resources,
        )

        is_pystac_cat = False
        if isinstance(stac_catalog, str):
            if request_params is None:
                request_params = {}
            if not isinstance(request_params, dict):
                raise RuntimeError("request_params should be of type dictionary")
            if any(key in request_params for key in ["url", "params", "data", "json"]):
                raise RuntimeError(
                    "request_params cannot contain these keys : url, params, data or json"
                )

            data = requests.get(stac_catalog, **request_params)
            if data.status_code != 200 or data.headers.get("content-type") not in [
                "application/json",
                "application/geo+json",
                "application/json;charset=utf-8",
                "application/geo+json; charset=utf-8",
                "application/json; charset=utf-8",
                "binary/octet-stream",
                "application/octet-stream",
                "text/plain; charset=utf-8",
                "text/plain",
            ]:
                raise RuntimeError(
                    f"Invalid Response: Please verify that the stac_catalog URL is correct-\n{data.text}"
                )

            json_data = data.json()

            if not _get_stac_links(
                json_data, stac_catalog, "item"
            ) and not _get_stac_links(json_data, stac_catalog, "child"):
                raise RuntimeError(f"Invalid STAC catalog-\n{stac_catalog}")

            items = _get_all_stac_catalog_items(
                json_data, stac_catalog, request_params, context
            )
        else:
            try:
                import pystac

                items = stac_catalog.get_all_items()
                is_pystac_cat = True
            except ImportError:
                raise ImportError(
                    "pystac not found, parameter stac_catalog accepts either a Static STAC URL or a pystac.Catalog object"
                )
            except Exception:
                raise RuntimeError(f"Invalid/Unsupported STAC Catalog-\n{stac_catalog}")

        rc_attribute_dict = {}
        attribute_dict = {} if attribute_dict is None else attribute_dict
        for key in attribute_dict:
            if isinstance(attribute_dict[key], list):
                rc_attribute_dict[key] = attribute_dict[key]
            else:
                rc_attribute_dict[key] = []
        if "Geometry" not in rc_attribute_dict:
            rc_attribute_dict["Geometry"] = []

        raster_list = []
        geometry_list = []
        for item_resources in items:
            if is_pystac_cat:
                item_dict = item_resources.to_dict()
                item_dict, item_product = _get_static_catalog_item_resources(
                    (item_resources.self_href, item_dict), context=context
                )
            else:
                item_dict, item_product = item_resources

            for key in attribute_dict:
                if isinstance(attribute_dict[key], list):
                    pass
                else:
                    if attribute_dict[key] in item_dict:
                        rc_attribute_dict[key].append(item_dict[attribute_dict[key]])
                    elif attribute_dict[key] in item_dict["properties"]:
                        rc_attribute_dict[key].append(
                            item_dict["properties"][attribute_dict[key]]
                        )
                    else:
                        rc_attribute_dict[key].append(key)

            if not item_product:
                raise RuntimeError(f"STAC Item not supported-\n{item_dict}")

            ras = (
                CompositeBand(item_product)
                if isinstance(item_product, list)
                else arcpy.Raster(
                    item_product,
                    is_multidimensional=(
                        True
                        if item_product.endswith((".zarr", ".nc", ".grib2"))
                        else False
                    ),
                )
            )
            raster_list.append(ras)

            if "Geometry" not in attribute_dict:
                geo_json = item_dict["geometry"]
                polygon_geometry = arcpy.AsShape(geo_json)
                geometry_list.append(polygon_geometry)
                rc_attribute_dict["Geometry"] = geometry_list

        rc = RasterCollection(
            raster_list,
            rc_attribute_dict,
        )
        return rc


def _remove_arcpy_handler(logger):
    # Remove ArcpyHandler to stop printing but continue logging to file.
    try:
        arcpy_handler_index = -1
        handler_list = logger.handlers
        for idx, handler in enumerate(handler_list):
            if isinstance(handler, ArcpyHandler):
                arcpy_handler_index = idx
                break
        logger.removeHandler(logger.handlers[arcpy_handler_index])
    except Exception as e:
        print(f"Could not remove ArcpyHandler: {e}")

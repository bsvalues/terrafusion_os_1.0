"""
  ga_desktop_updatebdcdatasetproperties.py

 Front end of 'Update Big Data Connection Dataset Properties' GeoAnalytics Desktop tool.

"""

import arcpy
import ntpath
import os

from gautils import get_value, param_cleanup
from gautils import BigDataConnectionFile
from gautils.utilities import format_field_updates_bdc, format_geometry_updates_bdc, format_time_updates_bdc, \
    format_del_property_updates_bdc, valuetable_to_list
from gautils import dicts as d
from gautils.validation import json_validator, validate_input_bdc_dataset

protobdc_field_type_map = d.bdc_fields
bdctopro_field_type_map = d.pro_fields

if __name__ == '__main__':

    # Get tool parameter values
    bdc_dataset = get_value(0)

    # Get BDC dataset definition
    bdc, dataset = ntpath.split(bdc_dataset)
    big_data_connection = BigDataConnectionFile(bdc)
    dataset_definition = big_data_connection.get_dataset_definition(dataset)

    # Get dataset definition query
    filter_str = get_value(1, as_value=True)
    if filter_str:
        dataset_definition["filter"] = {"where": filter_str}
    else:
        dataset_definition.pop("filter", None)

    # Get input field updates
    field_properties = valuetable_to_list(get_value(2, as_value=True))

    # Format field JSON
    field_updates = format_field_updates_bdc(field_properties)
    for i, f in enumerate(dataset_definition["fields"]):
        # Copy sourceName from old BDC dataset definition since it is not handled by tool parameters
        if "sourceName" in f.keys():
            field_updates[i]["sourceName"] = f["sourceName"]
        # Map datatype from pro to BDC
        if "type" in f.keys():
            if bdctopro_field_type_map.get(f["type"], None) == field_properties[i][1]:
                field_updates[i]["type"] = f["type"]
            else:
                field_updates[i]["type"] = protobdc_field_type_map.get(field_updates[i]["type"], None)
        # Add sourceName if field name is changed for shp, orc, and parquet
        if dataset_definition["properties"]["fileformat"] in ["shapefile", "orc", "parquet"]:
            if field_updates[i]["name"] != f["name"] and "sourceName" not in f.keys():
                field_updates[i]["sourceName"] = f["name"]

    # Apply field updates to BDC dataset definition
    dataset_definition["fields"] = field_updates

    # Get input geometry updates
    geometryType = get_value(3, dict=d.bdc_geometry)
    sref = get_value(4, as_value=True)
    geom_format = get_value(5, as_value=True)
    field = get_value(6, as_value=True)
    xField = get_value(7, as_value=True)
    yField = get_value(8, as_value=True)
    zField = get_value(9, as_value=True)
    # Apply geometry updates to BDC dataset definition
    if geometryType in ["esriGeometryPoint", "esriGeometryPolyline", "esriGeometryPolygon"]:
        try:
            hasZ = dataset_definition["geometry"].get("hasZ", False)
            hasM = dataset_definition["geometry"].get("hasM", False)
        except KeyError:
            hasZ = False
            hasM = False
        if zField:
            hasZ = True
        else:
            if dataset_definition["properties"]["fileformat"] not in ["shapefile"]:
                hasZ = False
        geometry_updates = format_geometry_updates_bdc(geometryType, sref, geom_format, xField, yField, field, zField,
                                                       hasZ, hasM)

        # Replace geometry field names with sourceName which is expected by GP but not exposed in UI
        if "fields" in geometry_updates.keys():
            for i, gf in enumerate(geometry_updates["fields"]):
                for f in dataset_definition["fields"]:
                    if "sourceName" in f.keys():
                        if gf["name"] == f["name"]:
                            geometry_updates["fields"][i]["name"] = f["sourceName"]
        dataset_definition["geometry"] = geometry_updates
    else:
        try:
            dataset_definition.pop("geometry")
        except KeyError:
            pass

    # Get input time updates
    timeType = get_value(10, as_value=True, dict=d.bdc_time)
    timeZone = get_value(11, as_value=True)
    startTime = get_value(12, as_value=True)
    endTime = get_value(13, as_value=True)
    # Apply time updates to BDC dataset definition
    if timeType.lower() in ["instant", "interval"]:
        time_updates = format_time_updates_bdc(timeType, timeZone, startTime, endTime)

        # Replace time field names with sourceName which is expected by GP but not exposed in UI
        if "fields" in time_updates.keys():
            for i, tf in enumerate(time_updates["fields"]):
                for f in dataset_definition["fields"]:
                    if "sourceName" in f.keys():
                        if tf["name"] == f["name"]:
                            time_updates["fields"][i]["name"] = f["sourceName"]
        dataset_definition["time"] = time_updates
    else:
        try:
            dataset_definition.pop("time")
        except KeyError:
            pass

    # Get file property updates
    if dataset_definition["properties"]["fileformat"] == "delimited":
        extension = get_value(14, as_value=True)
        fieldDelimiter = get_value(15, as_value=True)
        recordTerminator = get_value(16, as_value=True).encode("utf-8").decode("unicode_escape")
        quoteChar = get_value(17, as_value=True)
        hasHeaderRow = get_value(18, dict=d.has_header_row)
        encoding = get_value(19, as_value=True)
        escapeChar = dataset_definition["properties"]["delimited.escapeChar"]

        prop_update = format_del_property_updates_bdc(quoteChar, extension, encoding, recordTerminator, fieldDelimiter,
                                                      hasHeaderRow, escapeChar)
        dataset_definition["properties"] = prop_update

    try:
        big_data_connection.update_dataset_by_name(dataset_name=dataset, new_dataset_definition=dataset_definition)
        update_status = big_data_connection.update_connection_file()
        if not update_status:
            arcpy.AddIDMessage("ERROR", 120304)
        else:
            pass
    except Exception as e:
        arcpy.AddIDMessage("ERROR", 120304)


class ToolValidator(object):
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()

    def initializeParameters(self):
        """Refine the properties of a tool's parameters.
        This method is called when the tool is opened."""

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed. This method is called whenever a parameter
        has been changed."""
        # Used for converting between BDC datatype names and Pro UI datatype names
        geometry_type_map = {
            "esriGeometryPoint": "POINT",
            "esriGeometryPolyline": "LINE",
            "esriGeometryPolygon": "POLYGON",
            "NONE": "NONE"
        }
        # Only populate params if an input layer is given and is BDC and exists
        if self.params[0].valueAsText:
            bdc, dataset, validation_errors = validate_input_bdc_dataset(self.params[0])
            if len(validation_errors) == 0:

                # Set output as BDC dataset path
                self.params[20].value = self.params[0].valueAsText

                # Get input BDC dataset definition
                try:
                    big_data_connection = BigDataConnectionFile(bdc)
                    bdc_dataset_definition = big_data_connection.get_dataset_definition(dataset)
                except:
                    bdc_dataset_definition = ""
                if bdc_dataset_definition:
                    bdc_dataset_properties = bdc_dataset_definition["properties"]

                    # Everything within this if statement only happens when the input layer is changed
                    if not self.params[0].hasBeenValidated:
                        # Populate definition query parameter
                        if "filter" in bdc_dataset_definition.keys():
                            if not self.params[1].value:
                                try:
                                    self.params[1].value = bdc_dataset_definition["filter"]["where"]
                                except (KeyError, TypeError):
                                    pass

                        if bdc_dataset_properties["fileformat"] in ["parquet", "orc"]:
                            self.params[2].filters[1].list = ["SHORT", "LONG", "BIG_INTEGER", "DOUBLE", "FLOAT", "STRING", "DATE",
                                                              "BLOB"]
                        else:
                            self.params[2].filters[1].list = ["SHORT", "LONG", "BIG_INTEGER", "DOUBLE", "FLOAT", "STRING", "DATE"]

                        # Disable geometry parameters for Shapefiles
                        if bdc_dataset_properties["fileformat"] == "shapefile":
                            self.params[5].enabled = False
                            self.params[6].enabled = False
                            self.params[7].enabled = False
                            self.params[8].enabled = False
                            self.params[9].enabled = False
                        else:
                            self.params[5].enabled = True
                            self.params[6].enabled = True
                            self.params[7].enabled = True
                            self.params[8].enabled = True
                            self.params[9].enabled = True

                        # Populate delimited file properties if input is delimited, otherwise disabled those parameters
                        if bdc_dataset_properties["fileformat"] == "delimited":
                            self.params[14].enabled = True
                            self.params[15].enabled = True
                            self.params[16].enabled = True
                            self.params[17].enabled = True
                            self.params[18].enabled = True
                            self.params[19].enabled = True
                            if not self.params[14].value:
                                self.params[14].value = bdc_dataset_properties.get("delimited.extension", None)
                            if not self.params[15].value:
                                self.params[15].value = bdc_dataset_properties.get("delimited.fieldDelimiter", None)
                            if not self.params[16].value:
                                self.params[16].value = bdc_dataset_properties.get("delimited.recordTerminator",
                                                                               None).encode(
                                "unicode_escape").decode("utf-8")
                            if not self.params[17].value:
                                self.params[17].value = bdc_dataset_properties.get("delimited.quoteChar", None)
                            if not self.params[18].altered:
                                self.params[18].value = bdc_dataset_properties.get("delimited.hasHeaderRow", None)
                            if not self.params[19].value:
                                self.params[19].value = bdc_dataset_properties.get("delimited.encoding", None)
                        else:
                            self.params[14].enabled = False
                            self.params[15].enabled = False
                            self.params[16].enabled = False
                            self.params[17].enabled = False
                            self.params[18].enabled = False
                            self.params[19].enabled = False

                        # Get input BDC dataset field properties
                        bdc_dataset_fields = big_data_connection.get_fields(dataset)
                        fields = [f.get("name", None) for f in bdc_dataset_fields]
                        if fields:

                            # Show dataset fields in geometry field dropdowns
                            self.params[6].filter.list = fields
                            self.params[7].filter.list = fields
                            self.params[8].filter.list = fields
                            self.params[9].filter.list = fields

                            # Populate BDC dataset field properties
                            if not self.params[2].value:
                                fields_vtable_value = [(f.get("name", "#"),
                                                        bdctopro_field_type_map.get(f["type"], "#"),
                                                        f.get("visible", "true"))
                                                       for f in bdc_dataset_fields]
                                self.params[2].value = fields_vtable_value

                        # Get input BDC dataset geometry properties
                        bdc_dataset_geometry = big_data_connection.get_geometry(dataset)
                        if bdc_dataset_geometry:

                            # Populate geometry type parameter
                            geometry_type = bdc_dataset_geometry.get("geometryType", "NONE")
                            geometry_type_map = {
                                "esriGeometryPoint": "POINT",
                                "esriGeometryPolyline": "LINE",
                                "esriGeometryPolygon": "POLYGON",
                                "NONE": "NONE"
                            }
                            if not self.params[3].value:
                                self.params[3].value = geometry_type_map[geometry_type]

                            # Populate spatial reference parameter
                            if self.params[3].value:
                                if self.params[3].value != "NONE":
                                    if not self.params[4].value:
                                        self.params[4].enabled = True
                                        sr = bdc_dataset_geometry.get("spatialReference", None)
                                        for sr_type in ["wkid", "wkt"]:
                                            if sr_type in str(sr):
                                                self.params[4].value = sr[sr_type]
                                        if not self.params[4].value:
                                            self.params[4].value = sr
                                else:
                                    self.params[4].enabled = False
                            else:
                                self.params[4].enabled = False

                            # Limit geometry type dropdown to input layer geometry type if dataset is shapefile
                            if bdc_dataset_properties["fileformat"] == "shapefile":
                                self.params[3].filter.list = [geometry_type_map[geometry_type]]
                            else:
                                self.params[3].filter.list = ["POINT", "LINE", "POLYGON", "NONE"]

                                # Replace sourceName with name in geometry fields for UI validation
                                geometry_fields = bdc_dataset_geometry.get("fields", None)
                                for i, gf in enumerate(geometry_fields):
                                    for bdcf in bdc_dataset_fields:
                                        if "sourceName" in bdcf.keys():
                                            if gf.get("name", None) == bdcf["sourceName"]:
                                                geometry_fields[i]["name"] = bdcf["name"]

                                # Organize geometry fields by format type
                                x_fields = [f.get("name", None) for f in geometry_fields if "x" in f["formats"]]
                                y_fields = [f.get("name", None) for f in geometry_fields if "y" in f["formats"]]
                                z_fields = [f.get("name", None) for f in geometry_fields if "z" in f["formats"]]
                                wkt_fields = [f.get("name", None) for f in geometry_fields if "WKT" in f["formats"]]
                                wkb_fields = [f.get("name", None) for f in geometry_fields if "WKB" in f["formats"]]
                                geojson_fields = [f.get("name", None) for f in geometry_fields if
                                                  "GeoJSON" in f["formats"]]
                                esrijson_fields = [f.get("name", None) for f in geometry_fields if
                                                   "EsriJSON" in f["formats"]]
                                esrishape_fields = [f.get("name", None) for f in geometry_fields if
                                                   "EsriShape" in f["formats"]]

                                # Populate geometry format type and geometry field parameters
                                if x_fields and y_fields:
                                    if not self.params[5].value:
                                        self.params[5].value = "XYZ"
                                    if not self.params[7].value:
                                        self.params[7].value = next(iter(x_fields), None)
                                    if not self.params[8].value:
                                        self.params[8].value = next(iter(y_fields), None)
                                    if not self.params[9].value:
                                        self.params[9].value = next(iter(z_fields), None)
                                elif wkt_fields:
                                    if not self.params[5].value:
                                        self.params[5].value = "WKT"
                                    if not self.params[6].value:
                                        self.params[6].value = next(iter(wkt_fields), None)
                                elif geojson_fields:
                                    if not self.params[5].value:
                                        self.params[5].value = "GEOJSON"
                                    if not self.params[6].value:
                                        self.params[6].value = next(iter(geojson_fields), None)
                                elif esrijson_fields:
                                    if not self.params[5].value:
                                        self.params[5].value = "ESRIJSON"
                                    if not self.params[6].value:
                                        self.params[6].value = next(iter(esrijson_fields), None)
                                elif wkb_fields:
                                    if not self.params[5].value:
                                        self.params[5].value = "WKB"
                                    if not self.params[6].value:
                                        self.params[6].value = next(iter(wkb_fields), None)
                                elif esrishape_fields:
                                    if not self.params[5].value:
                                        self.params[5].value = "ESRISHAPE"
                                    if not self.params[6].value:
                                        self.params[6].value = next(iter(esrishape_fields), None)
                        else:
                            if not self.params[3].value:
                                self.params[3].value = "NONE"

                        # Get input BDC dataset time properties
                        bdc_dataset_time = big_data_connection.get_time(dataset)
                        if bdc_dataset_time:

                            # Replace sourceName with name in time fields for UI validation
                            time_fields = bdc_dataset_time.get("fields", None)
                            for i, tf in enumerate(time_fields):
                                for bdcf in bdc_dataset_fields:
                                    if "sourceName" in bdcf.keys():
                                        if tf.get("name", None) == bdcf["sourceName"]:
                                            time_fields[i]["name"] = bdcf["name"]

                            # Populate time type and time zone parameter
                            time_type = bdc_dataset_time.get("timeType", "NONE").upper()
                            if not self.params[10].value:
                                self.params[10].value = time_type
                            if not self.params[11].value:
                                self.params[11].value = str(
                                    bdc_dataset_time.get("timeReference", {}).get("timeZone", None))

                            # Populate start and end time field and field format parameters
                            if time_type == "INSTANT" or time_type == "INTERVAL":
                                try:
                                    start_time_vt_value = [(f.get("name", ""), f_format) for f in
                                                           bdc_dataset_time["fields"]
                                                           if f.get("role", None) != "end" for f_format in f["formats"]]
                                except KeyError:
                                    start_time_vt_value = [(f.get("name", ""), "") for f in bdc_dataset_time["fields"]
                                                           if f.get("role", None) != "end"]
                                if not self.params[12].value:
                                    self.params[12].value = start_time_vt_value
                            if time_type == "INTERVAL":
                                try:
                                    end_time_vt_value = [(f.get("name", ""), f_format) for f in
                                                         bdc_dataset_time["fields"]
                                                         if f.get("role", None) == "end" for f_format in f["formats"]]
                                except KeyError:
                                    end_time_vt_value = [(f.get("name", ""), "") for f in bdc_dataset_time["fields"]
                                                         if f.get("role", None) == "end"]
                                if not self.params[13].value:
                                    self.params[13].value = end_time_vt_value
                        else:
                            if not self.params[10].value:
                                self.params[10].value = "NONE"

                    # ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                    # Everything below this line happens every time ANY parameter is changed

                    bdc_dataset_fields = big_data_connection.get_fields(dataset)
                    current_field_params = self.params[2].value

                    # Do not allow users to change field type for shapefiles, orc, and parquet
                    if bdc_dataset_properties["fileformat"] in ["shapefile", "parquet", "orc"]:

                        # The logic below works as expected in the backend but the value is not updated in the UI.
                        # It will look to the user like they are editing fields but only edits to visibility will be applied.
                        # See https://devtopia.esri.com/ArcGISPro/geoprocessing/issues/4030

                        # This should preserve any changes to field visibility but override any changes to to field name or type
                        try:
                            fields_vtable_value = [(current_field_params[ind][0],
                                                    bdctopro_field_type_map.get(fo["type"], ""),
                                                    current_field_params[ind][2])
                                                   for ind, fo in enumerate(bdc_dataset_fields)]
                        except:
                            fields_vtable_value = [
                                (current_field_params[ind][0], bdctopro_field_type_map.get(fo["type"], ""), "")
                                for ind, fo in enumerate(bdc_dataset_fields)]
                        self.params[2].value = fields_vtable_value

                    if bdc_dataset_properties["fileformat"] in ["shapefile"]:
                        # Populate geometry type parameter and spatial reference from file to override user edits
                        bdc_dataset_geometry = big_data_connection.get_geometry(dataset)

                        if bdc_dataset_geometry:
                            geometry_type = bdc_dataset_geometry.get("geometryType", "NONE")
                            self.params[3].value = geometry_type_map[geometry_type]
                            if self.params[3].valueAsText.lower() != "none":
                                self.params[4].enabled = True
                                sr = bdc_dataset_geometry.get("spatialReference", None)
                                for sr_type in ["wkid", "wkt"]:
                                    if sr_type in str(sr):
                                        self.params[4].value = sr[sr_type]
                                if not self.params[4].valueAsText:
                                    self.params[4].value = sr
                    # Update geometry and time field lists based on user edits
                    current_fields = [fo[0] for fo in current_field_params]
                    string_fields = [fo[0] for fo in current_field_params if fo[1].lower() == "string"]
                    binary_fields = [fo[0] for fo in current_field_params if fo[1].lower() == 'blob']
                    def update_geometry_lists(blob = False):
                        try:
                            self.params[6].filter.list = []
                            if blob:
                                self.params[6].filter.list = binary_fields
                            else:
                                self.params[6].filter.list = string_fields
                            self.params[7].filter.list = current_fields
                            self.params[8].filter.list = current_fields
                            self.params[9].filter.list = current_fields
                            self.params[12].filters[0].list = current_fields
                            self.params[13].filters[0].list = current_fields
                        except ValueError:
                            pass
                    update_geometry_lists()

                    # Hide SR if there is no geometry
                    geometry_type = self.params[3].valueAsText
                    if geometry_type:
                        if geometry_type.lower() != "none":
                            self.params[4].enabled = True
                        else:
                            self.params[4].enabled = False
                    else:
                        self.params[4].enabled = False

                    # Do not allow XYZ format type for polygon or line if input dataset is not shapefile
                    if bdc_dataset_properties["fileformat"] != "shapefile":
                        # Populate spatial reference parameter
                        if geometry_type in ["POLYGON", "LINE"]:
                            self.params[5].enabled = True
                            self.params[5].filter.list = ["WKT", "GEOJSON", "ESRIJSON", "WKB", "ESRISHAPE"]
                        elif geometry_type in ["POINT"]:
                            self.params[5].enabled = True
                            self.params[5].filter.list = ["XYZ", "WKT", "GEOJSON", "ESRIJSON", "WKB", "ESRISHAPE"]
                        # Disable all geometry fields if geometry type is None or invalid
                        else:
                            self.params[5].enabled = False
                            self.params[6].enabled = False
                            self.params[7].enabled = False
                            self.params[8].enabled = False
                            self.params[9].enabled = False

                            # IMPORTANT: This logic prevents a validation error that keeps the tool from being run
                            #   * Fixes: https://devtopia.esri.com/ArcGISPro/geoanalytics/issues/573
                            #
                            # This is needed when using `None` (no geometry) to remove any values that were set when
                            # the tool was opened. An example of this is when switching from a valid geometry type to
                            # no geometry, since the initial geometry values get loaded and need to be cleared out.
                            self.params[4].value = None  # spatial_reference
                            self.params[5].value = None  # geometry_format_type
                            self.params[6].value = None  # geometry_field
                            self.params[7].value = None  # X Field
                            self.params[8].value = None  # Y Field
                            self.params[9].value = None  # Z Field

                    # Show xyz fields if geometry format type is XYZ, else show single geometry field and disable xyz fields
                    if self.params[5].enabled:
                        geometry_format_type = self.params[5].valueAsText
                        if bdc_dataset_properties["fileformat"] != "shapefile":
                            if geometry_format_type in ["XYZ"]:
                                self.params[6].enabled = False
                                self.params[7].enabled = True
                                self.params[8].enabled = True
                                self.params[9].enabled = True
                            elif geometry_format_type in ["WKT", "GEOJSON", "ESRIJSON"]:
                                update_geometry_lists()
                                self.params[6].enabled = True
                                self.params[7].enabled = False
                                self.params[8].enabled = False
                                self.params[9].enabled = False
                            elif geometry_format_type in ["WKB", "ESRISHAPE"]:
                                update_geometry_lists(blob=True)
                                self.params[6].enabled = True
                                self.params[7].enabled = False
                                self.params[8].enabled = False
                                self.params[9].enabled = False

                    # Show time zone and start time for INSTANT, enabled end time for INTERVAL, and disable all for None or invalid type
                    time_type = self.params[10].value
                    if time_type == "INSTANT":
                        self.params[11].enabled = True
                        self.params[12].enabled = True
                        self.params[13].enabled = False
                    elif time_type == "INTERVAL":
                        self.params[11].enabled = True
                        self.params[12].enabled = True
                        self.params[13].enabled = True
                    else:
                        self.params[11].enabled = False
                        self.params[12].enabled = False
                        self.params[13].enabled = False

                    # Prevent file extension from being edited
                    if bdc_dataset_properties["fileformat"] == "delimited":
                        self.params[14].value = bdc_dataset_properties.get("delimited.extension", None)


    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        fileformat = None
        bdc_dataset_definition = None
        # Check that input is BDC and if BDC dataset exists
        if self.params[0].altered and self.params[0].valueAsText:
            bdc, dataset, validation_errors = validate_input_bdc_dataset(self.params[0])

            if len(validation_errors) == 0:
                try:
                    big_data_connection = BigDataConnectionFile(bdc)
                    bdc_dataset_definition = big_data_connection.get_dataset_definition(dataset)
                except:
                    bdc_dataset_definition = ""
                if not bdc_dataset_definition:
                    self.params[0].setIDMessage("ERROR", 120292, dataset)
                    validation_errors = (120292, dataset)
                else:
                    # Require file properties if dataset file format is delimited
                    bdc_dataset_properties = bdc_dataset_definition["properties"]
                    fileformat = bdc_dataset_properties["fileformat"]
                    if fileformat == "delimited":
                        if not self.params[15].valueAsText:
                            self.params[15].setIDMessage("ERROR", 530)
                        if not self.params[16].valueAsText:
                            self.params[16].setIDMessage("ERROR", 530)
                        if not self.params[17].valueAsText:
                            self.params[17].setIDMessage("ERROR", 530)
                        if not self.params[18].valueAsText:
                            self.params[18].setIDMessage("ERROR", 530)
                        if not self.params[19].valueAsText:
                            self.params[19].setIDMessage("ERROR", 530)
            else:
                if len(validation_errors) == 2:
                    self.params[0].setIDMessage("ERROR", validation_errors[0], validation_errors[1])
                else:
                    self.params[0].setIDMessage("ERROR", validation_errors[0])

            if len(validation_errors) == 0:
                # Require field properties
                if not self.params[2].valueAsText:
                    self.params[2].setIDMessage("ERROR", 530)
                else:
                    fields = self.params[2].value
                    empty_flag = False
                    for fr in fields:
                        for i, p in enumerate(fr):
                            if not p and i != 2:
                                empty_flag = True
                    if empty_flag:
                        self.params[2].setIDMessage("ERROR", 530)

                # Require spatial reference and geometry format type when geometry is not none
                if fileformat and fileformat != "shapefile":
                    if self.params[3].valueAsText in ["POINT", "POLYGON", "LINE"]:
                        if not self.params[4].valueAsText:
                            self.params[4].setIDMessage("ERROR", 530)
                        if not self.params[5].valueAsText:
                            self.params[5].setIDMessage("ERROR", 530)
                        else:
                            # Require geometry field or x/y fields if geometry type is not none
                            if self.params[5].valueAsText in ["WKT", "GEOJSON", "ESRIJSON", "WKB", "ESRISHAPE"]:
                                if not self.params[6].valueAsText:
                                    self.params[6].setIDMessage("ERROR", 530)

                            elif self.params[5].valueAsText in ["XYZ"]:
                                if not self.params[7].valueAsText:
                                    self.params[7].setIDMessage("ERROR", 530)
                                if not self.params[8].valueAsText:
                                    self.params[8].setIDMessage("ERROR", 530)

                # Require time zone and start time if time type is not none
                if self.params[10].valueAsText in ["INSTANT", "INTERVAL"]:
                    if not self.params[11].valueAsText:
                        self.params[11].setIDMessage("ERROR", 530)
                    if bdc_dataset_definition:
                        if not self.params[12].value:
                            self.params[12].setIDMessage("ERROR", 530)
                        else:
                            for gf_row in self.params[12].value:
                                if not gf_row[0]:
                                    self.params[12].setIDMessage("ERROR", 530)
                                # Only require start time format string if the field type is not Date
                                elif not gf_row[1]:
                                    for fields_vt_row in self.params[2].value:
                                        if fields_vt_row[0] == gf_row[0]:
                                            if fields_vt_row[1] != "DATE":
                                                self.params[12].setIDMessage("ERROR", 530)
                # Require end time if time type is interval
                if self.params[10].valueAsText == "INTERVAL":
                    if bdc_dataset_definition:
                        if not self.params[13].value:
                            self.params[13].setIDMessage("ERROR", 530)
                        else:
                            for gf_row in self.params[13].value:
                                if not gf_row[0]:
                                    self.params[13].setIDMessage("ERROR", 530)
                                # Only require end time format string if the field type is not Date
                                elif not gf_row[1]:
                                    for fields_vt_row in self.params[2].value:
                                        if fields_vt_row[0] == gf_row[0]:
                                            if fields_vt_row[1] != "DATE":
                                                self.params[13].setIDMessage("ERROR", 530)


    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True

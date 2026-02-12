"""Execution of the Copy Network Analysis Layer tool."""  # Use tool name. pylint:disable=invalid-name

import os
import json
import uuid
import arcpy
import nat


# NAClass keys (localization safe) used to grab NA layer sublayers
# See https://pro.arcgis.com/en/pro-app/latest/arcpy/network-analyst/getnasublayer.htm
BARRIER_SUBLAYERS = ["Barriers", "PolylineBarriers", "PolygonBarriers"]
ALL_SUBLAYERS = {
    "Closest Facility Solver": ["Facilities", "Incidents", "CFRoutes"] + BARRIER_SUBLAYERS,
    "Location-Allocation Solver": ["Facilities", "DemandPoints", "LALines"] + BARRIER_SUBLAYERS,
    "OD Cost Matrix Solver": ["Origins", "Destinations", "ODLines"] + BARRIER_SUBLAYERS,
    "Route Solver": ["Stops", "Routes"] + BARRIER_SUBLAYERS,
    "Service Area Solver": ["Facilities", "SAPolygons", "SALines"] + BARRIER_SUBLAYERS,
    "Vehicle Routing Problem Solver": [
        "Orders", "Depots", "Routes", "Breaks", "RouteZones", "RouteRenewals", "OrderSpecialties", "RouteSpecialties",
        "OrderPairs", "DepotVisits"] + BARRIER_SUBLAYERS,
    "Last Mile Delivery Solver": [
            "Orders", "Depots", "Routes", "Zones", "OrderSpecialties", "RouteSpecialties", "DepotVisits"
        ] + BARRIER_SUBLAYERS
}
TABLE_SUBLAYERS = {
    "Vehicle Routing Problem Solver": ["OrderPairs", "OrderSpecialties", "RouteRenewals", "RouteSpecialties"],
    "Last Mile Delivery Solver": ["OrderSpecialties", "RouteSpecialties"]
}
DIRECTIONS_FC_SUFFIXES = ["_DirectionPoints", "_DirectionLines"]


class NALayerCopier:
    """Class to duplicate a network analysis layer."""

    def __init__(self, in_na_layer, new_layer_name):
        """Initialize the copier."""
        self.in_na_layer = in_na_layer
        self.new_layer_name = new_layer_name

        try:
            self.solver_type = arcpy.Describe(self.in_na_layer).solverName
        except Exception:  # pylint:disable=broad-except
            # Parameter is not a network analysis layer or is a disconnected layer.
            arcpy.AddIDMessage("ERROR", 30001)
            raise nat.ToolExit()
        self.in_fd = os.path.dirname(self.in_na_layer.listLayers()[0].dataSource)
        self.in_gdb = os.path.dirname(self.in_fd)
        self.out_gdb, self.out_fd = self._determine_output_paths()

        self.guid = uuid.uuid4().hex
        self.template_lyrx = None
        self.sublayer_name_converter = {}
        self.subtable_name_converter = {}
        self.directions_name_converter = {}

    def _determine_output_paths(self):
        """Determine the output geodatabase and feature dataset for the copied layer."""
        # The output gdb is the arcpy.env.workspace gdb if set; otherwise, use the gdb of the input layer.
        wkspc = arcpy.env.workspace
        if wkspc and wkspc.endswith(".gdb"):
            out_gdb = wkspc
        else:
            out_gdb = self.in_gdb
        out_fd = arcpy.CreateUniqueName(os.path.basename(self.in_fd), out_gdb)
        return out_gdb, out_fd

    def _create_sublayer_name_converter(self):
        """Create dictionaries to convert the existing sublayer feature class names to new unique names."""
        # Loop through the sublayers and generate new names for the copies.
        for sublayer_key in ALL_SUBLAYERS[self.solver_type]:
            orig_sublayer = arcpy.na.GetNASublayer(self.in_na_layer, sublayer_key)
            orig_sublayer_name = os.path.basename(orig_sublayer.dataSource)
            new_sublayer_name = os.path.basename(arcpy.CreateUniqueName(orig_sublayer_name, self.out_gdb))
            if sublayer_key in TABLE_SUBLAYERS.get(self.solver_type, []):
                self.subtable_name_converter[orig_sublayer_name] = new_sublayer_name
            else:
                self.sublayer_name_converter[orig_sublayer_name] = new_sublayer_name

        # Store proper name conversions for the directions feature classes, which don't behave like normal sublayers
        if self.solver_type in [
            "Route Solver",
            "Closest Facility Solver",
            "Vehicle Routing Problem Solver",
            "Last Mile Delivery Solver"
        ]:
            in_fd_name = os.path.basename(self.in_fd)
            out_fd_name = os.path.basename(self.out_fd)
            for suffix in DIRECTIONS_FC_SUFFIXES:
                orig_directions_fc_name = f"{in_fd_name}{suffix}"
                # Note: In order for the directions feature classes to work properly, they MUST follow the naming
                # convention of [feature dataset name]_DirectionPoints and [feature dataset name]_DirectionLines.
                # It is conceivably, although extremely unlikely, that there could already be feature classes with
                # these names in the target geodatabase. In that case, the Copy tool will delete the existing feature
                # class and replace it, in the target feature dataset, with the newly-copied one. Currently, we are
                # doing nothing to prevent this behavior because this is extremely unlikely to happen, and if it does,
                # the user was probably doing something wrong anyway.
                new_directions_fc_name = f"{out_fd_name}{suffix}"
                self.directions_name_converter[orig_directions_fc_name] = new_directions_fc_name

    def _copy_data(self):
        """Copy the input NA layer's data."""
        # Copy the source feature dataset
        # Create a value table of associated data to properly map the desired feature class name updates when copying
        # the parent feature dataset. Note: Any data in this feature dataset unaffiliated with the NA layer will also
        # get copied, but this is a very unusual edge case, so we don't care.
        associated_data = [
            [subl, "FeatureClass", self.sublayer_name_converter[subl], "#"] for subl in self.sublayer_name_converter]
        associated_data += [
            [subl, "FeatureClass",
             self.directions_name_converter[subl], "#"] for subl in self.directions_name_converter]
        try:
            arcpy.management.Copy(self.in_fd, self.out_fd, "FeatureDataset", associated_data)
        except arcpy.ExecuteError:
            raise nat.GPError()

        # Copy associated tables
        for table in self.subtable_name_converter:
            try:
                arcpy.management.Copy(
                    os.path.join(self.in_gdb, table),
                    os.path.join(self.out_gdb, self.subtable_name_converter[table])
                )
            except arcpy.ExecuteError:
                raise nat.GPError()

    def _create_temp_lyrx(self):
        """Save the input layer to disk as a temporary .lyrx file to use as a template."""
        self.template_lyrx = os.path.join(arcpy.env.scratchFolder, f"CopyNALayerTemplate_{self.guid}.lyrx")
        self.in_na_layer.saveACopy(self.template_lyrx)

    def _update_template(self):
        """Update the CIM JSON in the .lyrx template with the paths to the newly-copied data."""
        # Read the CIM json from the lyrx file
        with open(self.template_lyrx, "r", encoding="utf-8") as f:
            lyrx_txt = f.read()

        # Replace references to the original feature dataset name with the new feature dataset name
        lyrx_txt = lyrx_txt.replace(os.path.basename(self.in_fd), os.path.basename(self.out_fd))
        # Replace references to the original sublayer feature class and table names with the new names
        for orig_sublayer_name in self.sublayer_name_converter:
            lyrx_txt = lyrx_txt.replace(orig_sublayer_name, self.sublayer_name_converter[orig_sublayer_name])
        for orig_subtable_name in self.subtable_name_converter:
            lyrx_txt = lyrx_txt.replace(orig_subtable_name, self.subtable_name_converter[orig_subtable_name])

        # In the CIM json, replace CIM paths and layer name properties so the new layer, when added to the map, will
        # be unique from the old one
        lyrx_json = json.loads(lyrx_txt)
        # Replace CIM paths of global parent layer(s)
        # Support both json-style and xml-style CIM definitions
        lyrx_json["layers"] = [lyr.replace(".json", f"{self.guid}.json") for lyr in lyrx_json["layers"]]
        lyrx_json["layers"] = [lyr.replace(".xml", f"{self.guid}.xml") for lyr in lyrx_json["layers"]]
        # Replace CIM paths of child layers
        layer_definitions = []
        for lyr_def in lyrx_json["layerDefinitions"]:
            lyr_def["uRI"] = lyr_def["uRI"].replace(".json", f"{self.guid}.json")
            lyr_def["uRI"] = lyr_def["uRI"].replace(".xml", f"{self.guid}.xml")
            if lyr_def["type"] == "CIMNALayer":
                # For the NA layer, update the name, metadata, and sublayers
                lyr_def["name"] = self.new_layer_name
                lyr_def["metadataURI"] = lyr_def["metadataURI"].replace(".xml", f"{self.guid}.xml")
                lyr_def["layers"] = [lyr.replace(".json", f"{self.guid}.json") for lyr in lyr_def["layers"]]
                lyr_def["layers"] = [lyr.replace(".xml", f"{self.guid}.xml") for lyr in lyr_def["layers"]]
                if self.out_gdb != self.in_gdb:
                    # Update analysis gdb path if needed
                    lyr_def["nAWorkspace"]["workspaceConnectionString"] = f"DATABASE={self.out_gdb}"
            elif lyr_def["type"] == "CIMFeatureLayer" and self.out_gdb != self.in_gdb:
                # Update analysis gdb path if needed for sublayers
                lyr_def["featureTable"]["dataConnection"]["workspaceConnectionString"] = f"DATABASE={self.out_gdb}"
            layer_definitions.append(lyr_def)
        lyrx_json["layerDefinitions"] = layer_definitions
        # Replace CIM paths of child tables, if relevant
        if self.solver_type in TABLE_SUBLAYERS.keys():
            table_definitions = []
            for lyr_def in lyrx_json["tableDefinitions"]:
                # Do not replace CIM uRIs for subtables. This breaks the VRP layer for some reason.
                # lyr_def["uRI"] = lyr_def["uRI"].replace(".xml", f"{self.guid}.xml")
                if self.out_gdb != self.in_gdb:
                    # Update analysis gdb path if needed
                    lyr_def["dataConnection"]["workspaceConnectionString"] = f"DATABASE={self.out_gdb}"
                table_definitions.append(lyr_def)
            lyrx_json["tableDefinitions"] = table_definitions

        # Write the modified CIM json back to the lyrx file
        lyrx_txt = json.dumps(lyrx_json, indent=2, ensure_ascii=False)
        with open(self.template_lyrx, "w", encoding="utf-8") as f:
            f.write(lyrx_txt)

    def copy_na_layer(self):
        """Copy the layer.

        The procedure works as follows:
          1. Copy the sublayer data to a fresh feature dataset.
          2. Create a .lyrx file from the original NA layer to use as a template.
          3. Modify the .lyrx CIM JSON to update paths to the new feature dataset.
          4. Create a fresh layer from the updated .lyrx file.
        """
        self._determine_output_paths()
        self._create_sublayer_name_converter()
        self._copy_data()
        self._create_temp_lyrx()
        self._update_template()
        # Create a new layer object from the modified template lyrx
        lyr_obj = arcpy.mp.LayerFile(self.template_lyrx).listLayers()[0]
        # Write out the analysis data source of the new layer
        # New analysis data source feature dataset: %s.
        msg = arcpy.GetIDMessage(30191) % self.out_fd
        arcpy.AddMessage(msg)
        # Delete temporary template lyrx file
        os.remove(self.template_lyrx)
        return lyr_obj


class ToolValidator(nat.NAToolValidator):
    """Copy Network Analysis Layer tool validation logic."""

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        in_na_layer_param = self.params[0]
        out_name_param = self.params[1]
        out_layer_param = self.params[2]

        # Default the output layer name to something unique from the input.
        if in_na_layer_param.valueAsText and not out_name_param.valueAsText:
            # Just append "2" to the input layer's name.
            # This works fine, even if there is already a layer with this name in the map.
            # Use basename in case the layer is in a group layer. This way the output layer won't have the group layer's
            # name and a bunch of slashes in it.
            in_layer_name = os.path.basename(in_na_layer_param.valueAsText)
            out_name_param.value = in_layer_name + " 2"

        # Set the derived output parameter's value equal to the input layer parameter's value. This fixes Model
        # Builder workflows where otherwise the output bubble would not be seen as a valid NA layer when connected to
        # other tools. This seems to work even when the input NA layer does not yet have a value.  Ultimately it just
        # serves to inform the derived output of what data type it is.
        out_layer_param.value = in_na_layer_param.value

        return

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool parameter.

        This method is called after internal validation.
        """
        # Make sure the analysis data source isn't in an edit session because the Copy tool will fail later on
        in_na_layer_param = self.params[0]
        if not in_na_layer_param.isInputValueDerived() and in_na_layer_param.valueAsText:
            try:
                na_layer = in_na_layer_param.value
                sublayer = na_layer.listLayers()[0].dataSource
                if arcpy.IsBeingEdited(sublayer):
                    # Cannot copy layer "%s" because sublayer data is being edited.
                    in_na_layer_param.setIDMessage("Error", 30335, na_layer.name)
            except Exception:  # pylint: disable=broad-except
                # The check didn't work. Just eat any errors.
                pass

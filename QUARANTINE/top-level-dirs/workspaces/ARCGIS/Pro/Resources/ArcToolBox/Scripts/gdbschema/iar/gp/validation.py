import arcpy

from . import AAValidator


class GenerateSymbolRotationAttributeRule(AAValidator):
    def __init__(self):
        super().__init__()
        self.classes = self._get_param("line_classes")
        self.options = self._get_param("rotation_options")

    def updateParameters(self):
        super().updateParameters()

        self.set_value_table_defaults(self.classes, {1: "ObjectID"})
        self.set_value_table_defaults(
            self.options,
            {
                1: "ARITHMETIC",
                2: "MIN",
                3: 0,
            },
        )


class GenerateSpatialJoinAttributeRule(AAValidator):
    def __init__(self):
        super().__init__()
        self.join_classes = self._get_param("join_classes")
        self.field_map = self._get_param("field_map")
        self.options = self._get_param("search_options")

    def updateParameters(self):
        super().updateParameters()

        self.load_field_map()
        try:
            self.update_filter()
        except OSError:
            pass

        if not self.join_classes.hasBeenValidated and self.join_classes.valueAsText:
            existing = {x[0]: x for x in self.value_table_to_list(self.options, as_true_value=False)}
            default = ("GEOMETRY", "INTERSECTS", None)
            self.options.values = [existing.get(fc, [fc, *default]) for fc in self.join_classes.valueAsText.split(";")]

    def updateMessages(self):
        super().updateMessages()

        # Need at least 1 mapped field.
        fms: arcpy.FieldMappings
        if fms := self.field_map.value:
            if not any(f.inputFieldCount for f in fms.fieldMappings):
                self.field_map.setIDMessage("ERROR", 87173)  # FieldMap: Input value is not valid

    def load_field_map(self):
        if self.is_tool_open() and not self.is_design_view():  # Opening tool from GP history.
            return

        # Load the field map with fields from the source table. Parameter dependencies add the join_classes
        # as table inputs automatically.
        source_changed = not self.table.hasBeenValidated
        field_map_reset = not self.field_map.hasBeenValidated and not self.field_map.altered
        source_valid = bool(self.table.valueAsText) and not self.table.hasError()
        if not (source_valid and (source_changed or field_map_reset)):
            return

        fms = arcpy.FieldMappings()

        try:
            fms.addTable(self.table.valueAsText)
        except RuntimeError:
            return
        remove = []
        for i, fm in enumerate(fms.fieldMappings):
            if fm.outputField.editable:
                fm.removeInputField(0)  # Remove the field mapping to itself.
                fms.replaceFieldMap(i, fm)
            else:
                remove.append(i)  # Can't load into non-editable fields.

        for j in reversed(remove):
            fms.removeFieldMap(j)

        self.field_map.value = fms

    def update_filter(self):
        """Changes geometry type filter based on input shape type"""
        if self.table.hasError() or not self.table.valueAsText or self.table.hasBeenValidated:
            return

        match getattr(arcpy.Describe(self.table.valueAsText, "FeatureClass"), "shapeType", None):
            case "Point":
                valid = ["GEOMETRY"]
            case "Polyline":
                valid = ["GEOMETRY", "START", "END", "CENTROID"]
            case "Polygon":
                valid = ["GEOMETRY", "CENTROID"]
            case _:
                valid = None

        if valid:
            self.options.filters[1].list = valid


class GenerateIDAttributeRule(AAValidator):
    def __init__(self):
        super().__init__()

        self.definition_method = self._get_param("definition_method")
        self.id_options = self._get_param("id_builder")
        self.id_table = self._get_param("id_table")
        self.create_seq = self._get_param("create_seq")
        self.coded_value_fields = self._get_param("id_coded_value")

    def updateParameters(self):
        super().updateParameters()

        if self.definition_method.valueAsText == "TABLE":
            self.id_table.enabled = True
            self.coded_value_fields.enabled = self.id_options.enabled = False
        elif self.definition_method.valueAsText == "CODED_VALUES":
            self.coded_value_fields.enabled = True
            self.id_table.enabled = self.id_options.enabled = False
        else:
            self.id_options.enabled = True
            self.coded_value_fields.enabled = self.id_table.enabled = False

    def updateMessages(self):
        super().updateMessages()

        if self.id_table.enabled:
            self.make_parameter_required(self.id_table)
        if self.coded_value_fields.enabled:
            self.make_parameter_required(self.coded_value_fields)
        self.make_value_table_parameter_required(
            self.id_options,
            required_columns=(),
            duplicate_columns=[(0,), (2,)],
            min_rows=0,
        )
        if self.id_options.valueAsText and self.id_options.enabled:
            vtab = arcpy.ValueTable(10)
            vtab.loadFromString(self.id_options.valueAsText)
            all_ids = []
            display_preview = True
            for i in range(vtab.rowCount):
                name = vtab.getValue(i, 2) or ""
                prefix = vtab.getValue(i, 5) or ""
                suffix = vtab.getValue(i, 6) or ""
                padding = vtab.getValue(i, 7) or 0
                sep = vtab.getValue(i, 8) or ""
                id_val = "1".zfill(int(padding))
                preview = sep.join([prefix, id_val, suffix])
                all_ids.append(f"{name}: {preview}" if name else preview)
                if name != "" and name[0].isdigit():
                    self.id_options.setIDMessage("ERROR", 447)
                    display_preview = False
            if display_preview:
                self.id_options.setIDMessage("WARNING", 230001, "\n".join(all_ids))

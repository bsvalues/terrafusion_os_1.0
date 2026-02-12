import os

import arcpy


class ToolValidator:
    def __init__(self):
        self.params: tuple[arcpy.Parameter, ...] = arcpy.GetParameterInfo()
        (
            self.table,
            self.fg,
            self.cav,
            self.mode,
            self.field_groups,
            *_,
        ) = self.params

    def populate_csv_paths(self):
        """Populates the field group / contingent values output if blank"""
        if self.fg.altered and self.cav.altered:
            return

        try:
            folder = arcpy.mp.ArcGISProject("CURRENT").homeFolder
        except OSError:
            return

        base = os.path.basename(self.table.valueAsText).split(".")[-1]

        if not self.fg.altered:
            self.fg.value = os.path.join(folder, f"{base}_FieldGroups.csv")
        if not self.cav.altered:
            self.cav.value = os.path.join(folder, f"{base}_ContingentValues.csv")

    def updateParameters(self):
        if self.table.hasError() or not self.table.valueAsText:
            return

        describe = arcpy.Describe(self.table.valueAsText)
        if field_groups := getattr(describe, "fieldGroups", []):
            # Only show field groups with valid fields.
            field_names = {f.name.casefold() for f in getattr(describe, "fields", [])}
            self.field_groups.filter.list = [
                fg.name for fg in field_groups if {f.casefold() for f in fg.fieldNames}.issubset(field_names)
            ]
            self.populate_csv_paths()
        else:
            self.field_groups.filter.list = []

    def updateMessages(self):
        if self.table.hasError() or not self.table.valueAsText:
            return

        if not self.field_groups.filter.list:
            self.table.setIDMessage("ERROR", 2742)  # "Field Group not found."

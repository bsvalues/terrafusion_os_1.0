import arcpy


class ToolValidator(object):
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()
        self.wgs84 = arcpy.SpatialReference(4326)
        self.wgs84_vcs = arcpy.SpatialReference(4326, 115700)

    def default_field(self, fields, candidates, secondary_candidates):
        # best default names
        for i in candidates:
            for f in fields:
                if i == f.name.lower() or i == f.aliasName.lower():
                    return f.name

        # second best default
        for i in candidates + secondary_candidates:
            for f in fields:
                if f.name.lower().startswith(
                        i) or f.aliasName.lower().startswith(i):
                    return f.name
                elif f.name.lower().endswith(i) or f.aliasName.lower().endswith(
                        i):
                    return f.name

    def default_x_field(self, fields):
        """
        pick a field as default for x
        @fields: a set of fields
        return: field name
        """
        return self.default_field(fields, ["longitude", "lon", "x"],
                                  ["x_", "_x", ])

    def default_y_field(self, fields):
        """
        pick a field as default for y
        @fields: a set of fields
        return: field name
        """
        return self.default_field(fields, ["latitude", "lat", "y"],
                                  ["y_", "_y", ])

    def has_vcs(self, cs):
        """
        check if input cs has VCS defined.
        @cs: input coordinate system
        return: Boolean
        """
        try:
            return True if cs.VCS else False
        except AttributeError:  # if cs is None or cs.VCS is None
            return False

    def initializeParameters(self):
        """
        Refine the properties of a tool's parameters. This method is
        called when the tool is opened.

        Parameter Order
        self.params[0]: input_table
        self.params[1]: output_feature_class
        self.params[2]: x_field
        self.params[3]: y_field
        self.params[4]: z_field
        self.params[5]: spatial_reference
        """
        self.params[1].parameterDependencies = [0]
        self.params[1].schema.clone = True
        return

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed. This method is called whenever a parameter
        has been changed."""
        # update output geometryType to point
        self.params[1].schema.geometryType = "Point"

        # set default spatial reference
        cs = self.params[5]
        if not cs.altered:  # if cs is empty
            cs.value = self.wgs84_vcs if self.params[4].value else self.wgs84

        # update spatial reference based on z_field value and existing sr
        if self.params[4].value and cs.value == self.wgs84:
            cs.value = self.wgs84_vcs
        elif not self.params[4].value and cs.value == self.wgs84_vcs:
            cs.value = self.wgs84

        # set default x_field and y_field
        if (self.params[0].value and
                not self.params[2].altered and
                not self.params[3].altered):
            valid_fieldtypes = ['Integer', 'SmallInteger', 'Double', 'Single']
            fields = [f for f in arcpy.Describe(self.params[0]).fields
                      if f.type in valid_fieldtypes]

            if not self.params[2].value:
                self.params[2].value = self.default_x_field(fields)

            if not self.params[3].value:
                self.params[3].value = self.default_y_field(fields)

        return

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        # if z_field has value, but output cooridnate system doesn't have
        # vertical cs, set warning 90111
        if self.params[4].value and not self.has_vcs(self.params[5].value):
            self.params[5].setIDMessage('WARNING', 90111)
        # if no z_field but has vertical cs, set warning 650
        elif not self.params[4].value and self.has_vcs(self.params[5].value):
            self.params[5].setIDMessage('WARNING', 650)

        return

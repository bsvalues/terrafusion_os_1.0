import math
import arcpy


class ToolValidator(object):
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()

    def initializeParameters(self):
        """Refine the properties of a tool's parameters.  This method is
        called when the tool is opened."""
        grid_id_field = arcpy.Field()
        grid_id_field.name = "GRID_ID"
        grid_id_field.type = "TEXT"
        grid_id_field.length = 12
        self.params[0].schema.additionalFields = [grid_id_field]
        self.params[0].schema.geometryType = "Polygon"
        return

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""

        # get of value is expensive, do it once
        ex = self.params[1].value
        sr = getattr(ex, 'spatialReference', None)

        if self.params[1].altered and ex:
            if sr and not self.params[4].altered:
                self.params[4].value = sr.exportToString()

        if ex:
            if not self.params[3].altered:
                try:
                    width = ex.XMax - ex.XMin
                    self.params[3].value = round(width / 10, 2) ** 2
                except:
                    pass
        
        # get shape type value
        shape_type = self.params[2].value

        # enable H3 Hexagon parameter if shape type is  H3
        if shape_type == 'H3_HEXAGON':
            self.params[5].enabled = True
            # disable size parameter
            self.params[3].enabled = False
        # disable H3 Hexagon parameter if shape type is notH3
        else:
            self.params[5].enabled = False
            # enable size parameter
            self.params[3].enabled = True
        return

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""

        if self.params[3].altered:
            ex = self.params[1].value
            if ex:
                try:
                    from convert_spatial_units import standardize_units
                    cell_area_string = str(self.params[3].value).split(' ')
                    cell_area = float(cell_area_string[0])
                    if (cell_area <= 0) and (self.params[2].value != "H3_HEXAGON"):
                        self.params[3].setIDMessage('ERROR', 323)
                        return
                    cell_unit = cell_area_string[1]
                    ex_unit = 'square' + standardize_units(
                        ex.spatialReference.linearUnitName)
                    width = ex.XMax - ex.XMin
                    height = ex.YMax - ex.YMin
                    ex_area = width * height
                    if ex_unit is not cell_unit:
                        from convert_spatial_units import convert_areal_units
                        cell_area = convert_areal_units(cell_area, ex_unit,
                                                        cell_unit)
                    approx_bins = math.floor(ex_area / cell_area)
                    if approx_bins > 10 ** 6:
                        self.params[3].setIDMessage('WARNING', 2518,
                                                    approx_bins)

                except Exception as e:
                    self.params[3].setWarningMessage(e)
        return

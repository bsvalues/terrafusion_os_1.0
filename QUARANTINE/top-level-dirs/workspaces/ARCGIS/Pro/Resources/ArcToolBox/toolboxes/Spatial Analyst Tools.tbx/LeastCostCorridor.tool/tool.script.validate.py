class ToolValidator:
    # Class to add custom behavior and properties to the tool and tool parameters.
    def __init__(self):
        # set self.params for use in other function
        self.params = arcpy.GetParameterInfo()

    def initializeParameters(self):
        # Customize parameter properties.
        # This gets called when the tool is opened.
        return

    def updateParameters(self):
        # If a method other than 'No threshold' is selected (Percent of least cost or Accumulative cost),
        # enable the Threshold parameter. If 'No threshold' is specified, disable the Threshold parameter.
        threshold_method = self.params[5].value
        if type(threshold_method) is str:
            check_vals = [threshold_method.upper() == 'PERCENT_OF_LEAST_COST',
                          threshold_method.upper() == 'ACCUMULATIVE_COST']
            if any(check_vals):
                self.params[6].enabled = True
            else:
                self.params[6].enabled = False
        else:
            self.params[6].enabled = False
        return

    def updateMessages(self):
        # Customize messages for the parameters.
        # This gets called after standard validation.

        # If a method other than 'No threshold' is selected (Percent of least cost or Accumulative cost),
        # the user must enter a value for the Threshold parameter.
        threshold_method = self.params[5].value
        if type(threshold_method) is str:

            check_vals = [threshold_method.upper() == 'PERCENT_OF_LEAST_COST',
                          threshold_method.upper() == 'ACCUMULATIVE_COST']
            if any(check_vals):
                if self.params[6].value == None or self.params[6].value < 0:
                    self.params[6].setIDMessage("ERROR", 10685)

        # Check that all inputs are of float type
        in_rasters = [self.params[0],  self.params[1], self.params[2], self.params[3]]
        for raster in in_rasters:
            if not (raster.value in ['', None, "#"]):
                is_ras_int = arcpy.sa.Raster(raster.valueAsText).isInteger
                if is_ras_int:
                    raster.setIDMessage("ERROR", 10063, arcpy.sa.Raster(raster.valueAsText).name)

        # All four inputs must have the same spatial reference, cell size, and extent.
        # Check that all inputs have the same cell size, extent, and spatial reference
        # Check to see which inputs have been altered
        is_raster = [(not (x.value in ['', None, "#"])) for x in in_rasters]
        if all(is_raster):
            # All rasters are altered. Check to see if extents, cell sizes, and spatial references match.
            rasters = [arcpy.sa.Raster(x.valueAsText) for x in in_rasters]
            rasters_are_similar = [all(x.meanCellHeight == rasters[0].meanCellHeight for x in rasters),
                                   all(x.meanCellWidth == rasters[0].meanCellWidth for x in rasters),
                                   all(x.extent == rasters[0].extent for x in rasters),
                                   all(x.spatialReference.exportToString() == rasters[
                                       0].spatialReference.exportToString() for x in rasters)]

            if not all(rasters_are_similar):
                # One or more of the rasters does not match the others - Error all four to inform the user.
                for param in in_rasters:
                    param.setIDMessage("ERROR", 10734, str(arcpy.sa.Raster(param.valueAsText).name))

        return

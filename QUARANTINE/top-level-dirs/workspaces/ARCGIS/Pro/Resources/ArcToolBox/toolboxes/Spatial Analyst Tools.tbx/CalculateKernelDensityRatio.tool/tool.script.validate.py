import os
import arcpy


class ToolValidator:
    def __init__(self):
        self.params = arcpy.GetParameterInfo()

    def initializeParameters(self):
        """Refine the properties of a tool's parameters.  This method is
        called when the tool is opened."""
        return

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        # analysis type validation

        if self.params[0].valueAsText:
            desc1 = arcpy.Describe(self.params[0].valueAsText)           
            if desc1.shapeType == "Polyline":
                self.params[10].enabled = False
            else:
                self.params[10].enabled = True
            if not self.params[2].valueAsText:
                self.params[2].value = desc1.OIDFieldName
                       
        if self.params[1].valueAsText:   
            desc2 = arcpy.Describe(self.params[1].valueAsText)
            if desc2.shapeType == "Polyline":
                self.params[11].enabled = False
            else:
                self.params[11].enabled = True
            if not self.params[3].valueAsText:
                self.params[3].value = desc2.OIDFieldName


        if self.params[0].hasBeenValidated == False or self.params[1].hasBeenValidated == False:
            if self.params[0].valueAsText and self.params[1].valueAsText:
                first_extent = desc1.extent
                second_extent = desc2.extent
                second_extent_new = second_extent.projectAs(first_extent.spatialReference)
                common = first_extent.polygon.disjoint(second_extent_new.polygon)
                if common == False:
                    if arcpy.env.outputCoordinateSystem == None:
                        intersect_area = first_extent.polygon.intersect(second_extent_new.polygon, 4)
                    else:
                        first_extent_new = first_extent.projectAs(arcpy.env.outputCoordinateSystem)
                        second_extent_new = second_extent.projectAs(arcpy.env.outputCoordinateSystem)
                        intersect_area = first_extent_new.polygon.intersect(second_extent_new.polygon, 4)

                    XMin=intersect_area.extent.XMin
                    XMax=intersect_area.extent.XMax
                    YMin=intersect_area.extent.YMin
                    YMax=intersect_area.extent.YMax
                    cellSize_default=min(abs(XMax-XMin),abs(YMax-YMin))/250.0
                    self.params[5].value = cellSize_default
                else:
                    self.params[5].value = None


        if not self.params[8].valueAsText:
            self.params[8].value = "DENSITIES"

        if not self.params[9].valueAsText:
            self.params[9].value = "PLANAR"

        return

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""

        if self.params[0].valueAsText:
            desc1 = arcpy.Describe(self.params[0].valueAsText)
            if desc1.shapeType == "Polyline" and self.params[10].valueAsText == "GEODESIC":
                self.params[9].setIDMessage("ERROR", 10473)

        if self.params[1].valueAsText:
            desc2 = arcpy.Describe(self.params[1].valueAsText)
            if desc2.shapeType == "Polyline" and self.params[10].valueAsText == "GEODESIC":
                self.params[9].setIDMessage("ERROR", 10473)

        if self.params[0].valueAsText and self.params[1].valueAsText:
            first_extent = desc1.extent
            second_extent = desc2.extent
            second_extent_new = second_extent.projectAs(first_extent.spatialReference)
            common = first_extent.polygon.disjoint(second_extent_new.polygon)
            if common == True:
                self.params[0].setIDMessage("ERROR", 10568)


        return


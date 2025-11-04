import arcpy
import os


class ToolValidator(object):
    """ Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """ Setup arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()

    def initializeParameters(self):
        """ Refine the properties of a tool's parameters.  This method is
        called when the tool is opened."""
        return

    def updateParameters(self):
        """ Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        
        def _generateOutputName(in_tables):

            intable = in_tables.getTrueRow(0)[0]
            if isinstance(intable, str):
                intablevalue = intable
            elif hasattr(intable, 'name'):  # layer
                intablevalue = intable.name
            elif hasattr(intable, 'value'):
                intablevalue = u'{0}'.format(intable.value)
            else:
                intablevalue = "tableToExcel"

            # Seperate the name and path
            name = os.path.basename(intablevalue).split(".")[0]
            pth = os.path.dirname(intablevalue)

            # If input is a layer, use the layer's datasource's as the path
            if intablevalue:
                try:
                    d = arcpy.Describe(intablevalue)

                    if "layer" in d.dataType.lower() or \
                            "tableview" in d.dataType.lower():
                        pth = os.path.dirname(d.catalogPath)

                except Exception as e:
                    pass
           
            try:
                d = arcpy.Describe(pth)
                if hasattr(d, 'workspaceType'):
                    workspace_type = d.workspaceType
                else:
                    workspace_type = None
            except Exception as e:
                pass

            if arcpy.env.workspace:
                pth = arcpy.env.workspace
            elif workspace_type == 'RemoteDatabase':
                pth = arcpy.env.scratchFolder

            d = arcpy.Describe(pth)
            if hasattr(d, 'workspaceType'):
                workspace_type = d.workspaceType
            else:
                pth = os.path.dirname(pth)
                workspace_type = arcpy.Describe(pth).workspaceType

            if workspace_type == 'LocalDatabase':
                pth = os.path.dirname(pth)
                workspace_type = arcpy.Describe(pth).workspaceType

            outfile = u'{0}_TableToExcel'.format(os.path.join(pth, name))

            # add extension (xls)
            ext = u'.xlsx'

            # if the file exists, name it _1, or _2, or _3...
            if os.path.isfile(outfile + ext):
                i = 1
                while os.path.isfile(outfile + "_" + str(i) + ext):
                    i += 1
                outfile = outfile + "_" + str(i) + ext
            else:
                outfile = outfile + ext

            return outfile

        # If the output xls has not been changed at all, set it to default
        if not self.params[1].altered:
            if self.params[0]:
                if self.params[0].value:
                    self.params[1].value = _generateOutputName(self.params[0].value)

        return

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        return

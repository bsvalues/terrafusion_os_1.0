## GenerateCartoLimits.py
## ArcGIS Maritime
## Esri
##
## Converts polygon boundaries to polyline features, excluding
##    segments that overlap the coastline or neatline.

import arcpy, os, sys, traceback

class ex(Exception):
    def __init__(self, value):
        self.parameter = value
    def __str__(self):
        return repr(self.parameter)

def tool_execute():
	# User-defined parameters
	source_feat = arcpy.GetParameterAsText(0)
	erase_list = arcpy.GetParameter(1)
	target_feat = arcpy.GetParameterAsText(2)
	
	# Join Field
	JOIN_FLD = "NOID"
	
	# In memory layers
	lines = "memory\\feat_to_line"
	split_lines = "memory\\split_lines"
	erase = "memory\\erase"
	erase_copy = "memory\\erase_copy"
	dissolve = "memory\\dissolve"
	
	# Overwrite output
	arcpy.env.overwriteOutput = 1
	
	try:
		# Check for Nautical extension
		if arcpy.CheckExtension("Nautical") == "Available":
			arcpy.CheckOutExtension("Nautical")
		else:
			raise ex("ArcGIS Maritime license is unavailable.")
					
		# Convert input polygon features to polyline features
		arcpy.AddMessage("Feature To Line...")
		arcpy.management.FeatureToLine(source_feat, lines)
		# Split polyline features at vertices
		arcpy.AddMessage("Split Line At Vertices...")
		arcpy.management.SplitLine(lines, split_lines)
		# Erase line features coincident with the erase features
		arcpy.AddMessage("Erase...")
		arcpy.analysis.Erase(split_lines, erase_list[0], erase)
		count = 1
		while count < len(erase_list):
			# Copy erase features to new in memory location so output is not same as input
			arcpy.management.CopyFeatures(erase, erase_copy)
			arcpy.analysis.Erase(erase_copy, erase_list[count], erase)
			count += 1
		# Erase can leave behind empty geometries which will fail in dissolve. Repair geometries to remove these
		arcpy.AddMessage("Repair Geometry...")
		arcpy.management.RepairGeometry(erase)
		# Dissolve split, erased line features
		arcpy.AddMessage("Dissolve...")
		arcpy.management.Dissolve(erase, dissolve, JOIN_FLD, multi_part="SINGLE_PART")
		# Join source features to dissolved features on NOID field
		arcpy.AddMessage("Join source features to dissolve layer...")
		arcpy.management.JoinField(dissolve, JOIN_FLD, source_feat, JOIN_FLD)
		# Make feature layer of output layer
		arcpy.AddMessage("Delete duplicate features from target layer...")
		arcpy.management.MakeFeatureLayer(target_feat, "target_lyr")
		# Join the dissolved features to the output layer on NOID field
		arcpy.management.AddJoin("target_lyr", JOIN_FLD, dissolve, JOIN_FLD, "KEEP_COMMON")
		# Delete duplicate features that already exist in the output layer before they are appended
		arcpy.management.SelectLayerByAttribute("target_lyr")
		arcpy.management.DeleteRows("target_lyr")
		# Remove the join from the output layer
		arcpy.management.RemoveJoin("target_lyr")
		# Append all dissolved features to the output feature class
		arcpy.AddMessage("Append dissolved features to target layer...")
		arcpy.management.Append(dissolve, target_feat, "NO_TEST")
	
		# Set output fc as output
		arcpy.SetParameterAsText(3, target_feat)
	
	except ex as instance:
		arcpy.AddError(instance.parameter)
	
	except arcpy.ExecuteError:
		# Get the geoprocessing error messages
		msgs = arcpy.GetMessage(0)
		msgs += arcpy.GetMessages(2)
	
		# Return gp error messages for use with a script tool
		arcpy.AddError(msgs)
	
	except:
		pymsg = traceback.format_exc()
		# Return python error messages for use with a script tool
		arcpy.AddError(pymsg)
	finally:
		arcpy.CheckInExtension("Nautical")

if __name__ == '__main__':
	tool_execute()

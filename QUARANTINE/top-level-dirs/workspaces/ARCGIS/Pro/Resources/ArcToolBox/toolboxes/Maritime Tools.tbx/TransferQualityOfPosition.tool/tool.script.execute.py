## TransferQualityOfPosition.py
## ArcGIS Maritime
## Esri
##
## Transfers S-57 primitive attributes to the features to aid in symbolization affected by this attribution.
## Features are split where the primitive attribution changes and the values are copied into the affected 
## portion of the feature.

import arcpy, datetime, os, sys, traceback

class ex(Exception):
    def __init__(self, value):
        self.parameter = value
    def __str__(self):
        return repr(self.parameter)
		
def GetFieldList(in_fc, list_all=False, plus_oid=False, return_shape=False, other_geom=False, return_object=False, exclude_fields=[]):
	type_list = ['OID','Geometry', 'GlobalID']
	Exclude = ['shape_area','shape_length']
	if list_all:
		other_geom=True
		plus_oid=True
		return_shape=True
	if plus_oid:
		type_list.remove('OID')
	if return_shape:
		type_list.remove('Geometry')		
	if other_geom:
		Exclude = []
	if len(exclude_fields) > 0:
		for ex_f in exclude_fields:
			Exclude.append(ex_f.lower())
	# return either field names or field objects
	if return_object:
		field_list = [f for f in arcpy.ListFields(in_fc) if f.type not in type_list and f.name.lower() not in Exclude]
	else:
		field_list = [f.name for f in arcpy.ListFields(in_fc) if f.type not in type_list and f.name.lower() not in Exclude]
	return field_list  

def fieldExists(fc, field):
	return field in [f.name for f in arcpy.ListFields(fc)]

def tool_execute():
	# User-defined parameters
	parameters = arcpy.GetParameterInfo()
	workspace = arcpy.GetParameterAsText(0)
	unverifiedFeaturesOnly = parameters[1].value
	sal = workspace + '/Nautical/PLTS_SpatialAttributeL'
	cutList = ['CoastlineL', 'NaturalFeaturesL', 'DepthsL']
	
	try:
		# Check for Nautical extension
		if arcpy.CheckExtension("Nautical") == "Available":
			arcpy.CheckOutExtension("Nautical")
		else:
			raise ex("ArcGIS Maritime license is unavailable.")
					
		# First add ParentLNAM field, if necessary
		for itrCutFC in cutList:
			cutFC = workspace + '/Nautical/' + itrCutFC
			if not fieldExists(cutFC, 'ParentLNAM'):
				arcpy.AddMessage("Adding ParentLNAM field to " + itrCutFC + "...")
				arcpy.management.AddField(cutFC, 'ParentLNAM', 'TEXT', field_length = 20)
				
		with arcpy.da.Editor(workspace) as edit:
			currentTime = datetime.datetime.now().strftime('%Y-%m-%d %I:%M:%S %p')
	
			# Find any unverified SpatialAttributesL and propagate that to coincident cutList features
			if unverifiedFeaturesOnly:
				arcpy.AddMessage("Propogating unverified state from coincident SpatialAttributesL features...")
				where_clause = "VERIFIED = 0"
				for salRow in arcpy.da.SearchCursor(sal, ['VERIFIED', 'SHAPE@'], where_clause):
					for itrCutFC in cutList:
						cutFC = workspace + '/Nautical/' + itrCutFC
						# Find verified features to mark unverified (that are coincident)
						with arcpy.da.UpdateCursor(cutFC, ['VERIFIED', 'SHAPE@', 'VERIFIER', 'VERIFIED_DATE'], "VERIFIED = 1") as updateCursor:
							for row in updateCursor:
								if not salRow[1].extent.disjoint(row[1].extent):
									if salRow[1].equals(row[1]) or salRow[1].within(row[1]):
										row[0] = 0 # Set unverified
										row[2] = None # Update Verifier
										row[3] = None # Update Verified_Date
										updateCursor.updateRow(row)

			transferCount = 0
			for itrCutFC in cutList:
				cutFC = workspace + '/Nautical/' + itrCutFC
				otherFields = GetFieldList(cutFC, False, False, False, False, False, ['LNAM', 'P_QUAPOS', 'ParentLNAM', 'LAST_MOD', 'VERIFIED', 'VERIFIER', 'VERIFIED_DATE'])
				cursorFieldList = ['LNAM', 'SHAPE@', 'P_QUAPOS', 'LAST_MOD', 'VERIFIED', 'VERIFIER', 'VERIFIED_DATE'] # We know the index position for these fields in the returned rows
				cursorFieldList.extend(otherFields) # Don't care about the position of these fields, just copy them over to any new features
					
				# First remove any existing cut features
				if not unverifiedFeaturesOnly:
					arcpy.AddMessage("Deleting all existing cut features in " + itrCutFC + "...")
					where_clause = "ParentLNAM IS NOT NULL AND ParentLNAM <> ''"
					with arcpy.da.UpdateCursor(cutFC, "ParentLNAM", where_clause) as deleteCursor:
						for row in deleteCursor:
							deleteCursor.deleteRow()
				else:
					arcpy.AddMessage("Deleting cut features corresponding to unverified features in " + itrCutFC + "...")
					where_clause = "VERIFIED = 0 OR VERIFIED IS NULL"
					unverifiedFeatureLNAMs = []
					for row in arcpy.da.SearchCursor(cutFC, ['LNAM'], where_clause):
						unverifiedFeatureLNAMs.append(row[0])
						
					where_clause = "ParentLNAM IS NOT NULL AND ParentLNAM <> ''"
					with arcpy.da.UpdateCursor(cutFC, ['ParentLNAM'], where_clause) as deleteCursor:
						for row in deleteCursor:
							if row[0] in unverifiedFeatureLNAMs:
								deleteCursor.deleteRow()

				# Now cut the features
				arcpy.AddMessage("Searching for features to cut and transfer quality of position in " + itrCutFC + "...")
				
				where_clause = ""
				if unverifiedFeaturesOnly:
					where_clause = "VERIFIED = 0 OR VERIFIED IS NULL"
					
				with arcpy.da.UpdateCursor(cutFC, cursorFieldList, where_clause) as cutFCCursor:
					for row in cutFCCursor:
						cutDone = False
						
						# Important this order matches how we inserted above in newFeatureRows
						newFeatureFieldList = ['ParentLNAM', 'SHAPE@', 'P_QUAPOS', 'LAST_MOD', 'VERIFIED', 'VERIFIER', 'VERIFIED_DATE']
						newFeatureFieldList.extend(otherFields)
						
						# Initialize to match the feature we're cutting, then cut out overlapping SAL
						diffGeom = row[1]
						
						with arcpy.da.InsertCursor(cutFC, newFeatureFieldList) as outCursor:
							with arcpy.da.SearchCursor(sal, ['P_QUAPOS', 'SHAPE@'], "P_QUAPOS IS NOT NULL") as salCursor:
								for salRow in salCursor:
									if not salRow[1].extent.disjoint(row[1].extent):
										if salRow[1].equals(row[1]): # SpatialAttributeL has same geometry
											row[2] = salRow[0] # Transfer P_QUAPOS
											row[3] = currentTime # Update LAST_MOD
											row[4] = 0 # Update Verified
											row[5] = None # Update Verifier
											row[6] = None # Update Verified Date
											cutFCCursor.updateRow(row)
											transferCount += 1
											break # Not expecting any more coincident SpatialAttributeL with P_QUAPOS populated
										elif salRow[1].within(row[1]):
											cutDone = True
											# Cut out the SpatialAttributeL 
											diffGeom = diffGeom.difference(salRow[1])
											# Build list of field values to copy from the source feature to the new feature we're inserting due to a cut.
											# ParentLNAM, Shape@, P_QUAPOS, LAST_MOD, VERIFIED, VERIFIER, VERIFIED_DATE
											salGeometry = salRow[1]
											newRowFieldVals = [row[0],salGeometry,salRow[0], currentTime, 0, None, None]
											indexedFieldCount = len(newRowFieldVals)
											for i in range(0, len(otherFields)):
													newRowFieldVals.append(row[i+indexedFieldCount]) # Skip 7 positions for fields we already put in list
											outCursor.insertRow(newRowFieldVals)
											transferCount += 1

								if cutDone:
									originalLNAM = row[0]
									arcpy.AddMessage("Cut " + originalLNAM)

									# Whatever remains in diffGeom is what's left of the original feature that doesn't have QUAPOS
									row[1] = diffGeom
									row[3] = currentTime # Update LAST_MOD
									row[4] = 0 # Update Verified
									row[5] = None # Update Verifier
									row[6] = None # Update Verified Date
									cutFCCursor.updateRow(row)

			if transferCount == 1:
				arcpy.AddMessage("Transferred quality of position to 1 feature.")
			elif transferCount > 1:
				arcpy.AddMessage("Transferred quality of position to " + str(transferCount) + " features.")
			else:
				arcpy.AddMessage("No features updated.")
	
		# Set output fc as output
		arcpy.SetParameterAsText(2, workspace)
	
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

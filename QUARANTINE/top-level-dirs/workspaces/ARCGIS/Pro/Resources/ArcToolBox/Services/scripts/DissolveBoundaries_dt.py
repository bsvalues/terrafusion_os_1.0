"""---------------------------------------------------------------------------
Name:              DissolveBoundaries_dt.py
Purpose:           Dissolve boundaries
Author:            Esri Inc.
Created:           5/1/2013
Copyright:   (c)   Esri, Inc. 2013
ArcGIS Version:    10.2
---------------------------------------------------------------------------"""
import arcpy
import os
#from analysisutils import createShapeAreaField, createShapeLengthField

arcpy.env.overwriteOutput = True

statkey_dict = {
    'SUM': 'SUM',
    'MEAN': 'MEAN',
    'MIN': 'MIN',
    'MAX': 'MAX',
    'STDDEV': 'STD',
    'STD': 'STD'  # just in case
    }


def setupDissolveBoundaries():
    """Acquire inputs and send to dissolveBoundaries function."""

    try:
        in_polygons = arcpy.GetParameterAsText(0)
        dissolve_fields = arcpy.GetParameter(1)

        summary_fields = u';'.join(
            [correct_stat_type(s) for s in arcpy.GetParameter(2)])

        if arcpy.GetParameter(3):
            part_features = "MULTI_PART"
        else:
            part_features = "SINGLE_PART"
        out_features = arcpy.GetParameterAsText(4)

        dissolveBoundaries(
            in_polygons, dissolve_fields, summary_fields, part_features, out_features)

    except arcpy.ExecuteError:
        for msg in arcpy.gp.GetAllMessages():
            # Messages that are:
            # position 0: 100,102 (error or geodatabase error messages)
            #
            # position 1: 0, -2147467259 (no id message)
            if msg[0] in [100, 102] and \
               msg[1] not in [0, -2147467259]:
                arcpy.gp.AddError(msg[2], msg[1])
    except Exception as err:
        arcpy.AddError(err)

# End setupDissolveBoundaries

def dissolveBoundaries(in_polygons, dissolve_fields, summary_fields,
                       part_features, out_features):
    """Dissolve features and provide statistics as needed"""

    # Always include count
    describe = arcpy.Describe(in_polygons)
    count_stat = u'{} COUNT'.format(describe.OIDFieldName)

    # Currently unable to calculate meaningful statistics for this scenario. Only calculate the count.
    if part_features == "SINGLE_PART" and not dissolve_fields:
        temp_out_features = os.path.join(os.path.dirname(out_features), "temp_diss_output")
        arcpy.Dissolve_management(in_polygons, temp_out_features, dissolve_fields,
                                  count_stat, part_features)

        # only keep the field in temp_out_features. Two new fields, Join_Count and TARGET_FID are added automatically.
        fieldmappings = arcpy.FieldMappings()
        fieldmappings.addTable(temp_out_features)

        try:
            arcpy.analysis.SpatialJoin(temp_out_features, in_polygons, out_features, "#", "#", fieldmappings, "CONTAINS")
            # Delete the Count_* field and TARGET_FID
            fields_to_remove = [field.name for field in arcpy.ListFields(out_features)
                                if field.name.lower().startswith("count_") or field.name.upper() == "TARGET_FID"]
            arcpy.DeleteField_management(out_features, fields_to_remove)
            sj_output = True
        except arcpy.ExecuteError:
            # Use the output from dissolve if spatial join failed.
            arcpy.AddMessage("Unable to calculate count using spatial join.")
            out_features = temp_out_features
            sj_output = False
    else:
        arcpy.Dissolve_management(in_polygons, out_features, dissolve_fields,
                                  u';'.join([count_stat, summary_fields]), part_features)
        sj_output = False

    alterField(out_features, sj_output)


# End dissolveBoundaries

def alterField(feature_class, spatial_join_output=False):
    """Update the count field to be readable"""
    try:
        wild_card = 'COUNT_*' if not spatial_join_output else "Join_Count"
        count_field = arcpy.ListFields(feature_class, wild_card)[0].name
        arcpy.AddMessage("count_field identified as {}".format(count_field))
        arcpy.AlterField_management(
            feature_class, count_field, "Count", "Count")
    except IndexError:
        # No fields that start with COUNT_, proceed
        pass
    except AttributeError:
        # Just in case, tool is used with a release without AlterField
        arcpy.AddMessage("tool is used with a relase without AlterField method.")
        pass
    except arcpy.ExecuteError:
        # AlterField fails, proceed without making changes
        arcpy.AddWarning(arcpy.GetMessages())
        pass

# End updateFieldAlias

def getLinearUnits(linear_unit_code):
    """Return a linear unit from a GCS Code"""

    # keys are GCS code, values are linear units
    units_dict = {
        9002: 'feet',
        9003: 'yards',
        9035: 'miles',
        9030: 'nauticalmiles',
        9036: 'kilometers'
        }

    try:
        return units_dict[linear_unit_code]
    except KeyError:
        # If code is not in the dict, calculate in meters
        return 'meters'

# End getLinearUnits

def correct_stat_type(s):
    """Routine to prep Dissolve's stats argument. Swap in appropriate keywords
    as needed and reforms each field/stats pair"""

    split_str = s.split(' ')
    return u'{} {}'.format(split_str[0],
                           statkey_dict[split_str[1].upper()])
# End correct_stat_type


if __name__ == "__main__":
    setupDissolveBoundaries()

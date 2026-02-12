"""---------------------------------------------------------------------------
Name:              MergeLayers_dt.py
Purpose:           Merge layers
Author:            Esri Inc.
Created:           5/7/2013
Copyright:   (c)   Esri, Inc. 2013
ArcGIS Version:    10.2
---------------------------------------------------------------------------"""
import arcpy

arcpy.env.overwriteOutput = True


def setupMergeLayers():
    """Acquire inputs and send to mergeLayers function."""

    try:
        in_features = arcpy.GetParameterAsText(0)
        merge_features = arcpy.GetParameterAsText(1)
        merging_attributes = arcpy.GetParameter(2)
        if merging_attributes:
            merging_attributes = [v.split(" ")
                                  for v in merging_attributes]

        out_features = arcpy.GetParameterAsText(3)

        mergeLayers(
            in_features, merge_features, merging_attributes, out_features)

    # Errors of note:
    #   ERROR 001156: (incompatible field types/values)
    #     Failed on input OID {}, could not write value '{}' to output field {}
    #   ERROR 000468: (different geometry)
    #     Input shape types are not equal
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

# End setupMergeLayers

def mergeLayers(in_features, merge_features, merging_attributes,
                out_features):
    """Merge two datasources together given (optional) merge attributes"""

    if merging_attributes:
        ignore_field_types = ['Guid', 'Geometry', 'OID']
        in_fc_fields = get_field_names(in_features, ignore_field_types)
        merge_fc_fields = get_field_names(merge_features, ignore_field_types)

        remove_fields = []
        match_fields = {}
        rename_fields = {}
        for att in merging_attributes:
            merge_type = att[1].lower()
            if merge_type == 'remove':
                remove_fields.append(
                    correct_field(att[0], merge_fc_fields))
            elif merge_type == 'match':
                match_fields[correct_field(att[2], in_fc_fields)] = \
                             correct_field(att[0], merge_fc_fields)
            elif merge_type == 'rename':
                rename_fields[correct_field(att[0], merge_fc_fields)] = att[2]

        fms = arcpy.FieldMappings()

        # add fields from in_features
        for f_name in in_fc_fields:
            field_map = arcpy.FieldMap()
            field_map.addInputField(in_features, f_name)

            if f_name in match_fields:
                field_map.addInputField(merge_features, match_fields[f_name])
                merge_fc_fields.remove(match_fields[f_name])

            # if any field_names match, then combine
            elif f_name in merge_fc_fields:
                field_map.addInputField(merge_features, f_name)

                # rename field (if field present in both input/merge layers)
                if f_name in rename_fields:
                    out_field = field_map.outputField
                    out_field.name = rename_fields[f_name]
                    out_field.aliasName = rename_fields[f_name]
                    field_map.outputField = out_field

                try:
                    merge_fc_fields.remove(f_name)
                except:
                    pass

            fms.addFieldMap(field_map)

        # any left over fields from merge features get added
        for f_name in merge_fc_fields:
            if f_name not in remove_fields:  # don't add 'remove' fields
                field_map = arcpy.FieldMap()
                field_map.addInputField(merge_features, f_name)

                # rename field
                if f_name in rename_fields:
                    out_field = field_map.outputField
                    out_field.name = rename_fields[f_name]
                    out_field.aliasName = rename_fields[f_name]
                    field_map.outputField = out_field

                fms.addFieldMap(field_map)

        arcpy.Merge_management([in_features, merge_features],
                               out_features,
                               fms)

    else:
        # If no merging attributes specified, use Merge tool's default behavior
        arcpy.Merge_management([in_features, merge_features], out_features)
# End mergeLayers

def get_field_names(in_table, exclude_types):
    """Return a list of field names for a datasource minus inappropriate
    types"""
    return [f.name for f in arcpy.ListFields(in_table)
            if f.type not in exclude_types]
# End get_field_names

def correct_field(field_name, datasource_fields):
    """Correct field name case to match field name in datasource"""
    field_name_lowered = field_name.lower()
    for i, f in enumerate([f.lower() for f in datasource_fields]):
        if field_name_lowered == f:
            return datasource_fields[i]

    return field_name  # If we get here return original field name
# End correct_field

if __name__ == "__main__":
    setupMergeLayers()

"""
 Tool Name:   Multiple Ring Buffer
 Source Name: MultiRingBuffer.py
 Author:      Environmental Systems Research Institute Inc.
 Required Arguments:
              An input feature class or feature layer
              An output feature class
              A set of distances (multiple set of double values)
 Optional Arguments:
              The name of the field to contain the distance values
              (default="distance")
              Option to have the output dissolved (default="ALL")
 Description: Creates a set of buffers for the set of input features. The
              buffers are defined using a set of variable distances. The
              resulting feature class has the merged buffer polygons with or
              without overlapping polygons maintained as separate features.
"""

import arcpy
import os
import sys


def check_field_name(field_name, workspace):
    """ Validate field name on the workspace as needed """
    if field_name in ['#', '']:
        return "distance"
    else:
        out_name = arcpy.ValidateFieldName(field_name, workspace)
        out_name = out_name.replace(' ', '_')
        if out_name != field_name:
            arcpy.AddIDMessage('WARNING', 648, out_name)
        return out_name


def get_parameter_values():
    """ Gather arguments and set up for create_multi_buffers """

    # Get the input argument values
    in_features = arcpy.GetParameterAsText(0)
    output = arcpy.GetParameterAsText(1)
    distances = arcpy.GetParameter(2)

    unit = arcpy.GetParameterAsText(3).upper()
    field_name = arcpy.GetParameterAsText(4)
    dissolve_type = arcpy.GetParameterAsText(5)
    outside_polygons = arcpy.GetParameterAsText(6)
    if outside_polygons.lower() == 'true':
        side_type = 'OUTSIDE_ONLY'
    else:
        side_type = ''
    buffer_method = arcpy.GetParameterAsText(7)

    return in_features, output, distances, unit, field_name, dissolve_type, side_type, buffer_method


def create_multi_buffers(in_features, output, distances, units, field_name, dissolve_type, side_type, buffer_method):
    """ Main processing of Multiple Ring Buffer tool """

    try:
        geometry = 'SHAPE@'

        distances.sort()

        describe_input = arcpy.Describe(in_features)

        if units == 'DEFAULT':
            units = ''

        dd = dict()
        for i in distances:
            dd[i] = f'{i} {units}'.rstrip()

        if dissolve_type == 'NONE':
            distances.sort(reverse=True)
            buffers = []

            for i, dist in enumerate(distances):
                intermediate_fc = 'in_memory//buf{}'.format(i)

                if dist != 0:
                    if side_type == 'OUTSIDE_ONLY':
                        arcpy.Buffer_analysis(
                            in_features, intermediate_fc, dd[dist],
                            line_side=side_type, method=buffer_method)
                    else:
                        arcpy.PairwiseBuffer_analysis(
                            in_features, intermediate_fc, dd[dist],
                            method=buffer_method)

                else:
                    # Buffer fails with a distance of 0, so move feature across
                    # as is, and assemble attributes as expected. But only when
                    # the input is polygon
                    dist_fm = arcpy.FieldMap()

                    dist_field = arcpy.Field()
                    dist_field.name = 'BUFF_DIST'
                    dist_field.type = 'Double'
                    dist_fm.outputField = dist_field

                    oid_fm = arcpy.FieldMap()
                    oid_fm.addInputField(in_features,
                                         describe_input.OIDFieldName)
                    oid_field = arcpy.Field()
                    oid_field.name = 'ORIG_FID'
                    oid_field.type = 'Integer'
                    oid_fm.outputField = oid_field

                    add_fields = arcpy.FieldMappings()
                    add_fields.addFieldMap(dist_fm)
                    add_fields.addFieldMap(oid_fm)

                    arcpy.FeatureClassToFeatureClass_conversion(
                        in_features,
                        os.path.dirname(intermediate_fc),
                        os.path.basename(intermediate_fc),
                        field_mapping=add_fields)

                    arcpy.CalculateField_management(intermediate_fc,
                                                    'BUFF_DIST', 0,
                                                    'ARCADE')

                if units:
                    arcpy.CalculateField_management(
                        intermediate_fc, 'BUFF_DIST', str(dist), 'ARCADE')

                buffers.append(intermediate_fc)

            arcpy.Merge_management(buffers, output)

            field_name = check_field_name(field_name, os.path.dirname(output))

            if output[-4:].lower() != '.shp' and not output.startswith('memory'):
                arcpy.AlterField_management(output, 'BUFF_DIST', field_name,
                                            field_name)
            else:
                arcpy.AddField_management(output, field_name)
                arcpy.CalculateField_management(output, field_name,
                                                '$feature.BUFF_DIST', 'ARCADE')
                arcpy.DeleteField_management(output, 'BUFF_DIST')

        else:
            arcpy.CreateFeatureclass_management(
                    os.path.dirname(output), os.path.basename(output), 'POLYGON',
                    spatial_reference=describe_input.spatialReference)

            field_name = check_field_name(field_name, os.path.dirname(output))
            tmp_fc = arcpy.PairwiseDissolve_analysis(
                    in_features, 'memory\\diss_fc')[0]

            arcpy.AddField_management(output, field_name, 'DOUBLE')

            # Delete default id field on shapefile creation
            if output[-4:].lower() == '.shp':
                arcpy.DeleteField_management(output, 'id')

            single_feature = None
            with arcpy.da.SearchCursor(tmp_fc, geometry) as in_rows:
                for row in in_rows:
                    single_feature = row[0]
                    break

            if single_feature:
                if side_type == 'OUTSIDE_ONLY':
                    buffers = [arcpy.Buffer_analysis(
                                   single_feature, arcpy.Geometry(), dd[d],
                                   line_side=side_type, dissolve_option='ALL',
                                   method=buffer_method)[0]
                               for i, d
                               in enumerate(distances)]

                else:
                    buffers = [arcpy.PairwiseBuffer_analysis(
                                   single_feature, arcpy.Geometry(), dd[d],
                                   dissolve_option='ALL',
                                   method=buffer_method)[0]
                               for i, d
                               in enumerate(distances)]

                with arcpy.da.InsertCursor(output, [geometry, field_name]) as out_rows:
                    for i, buff in enumerate(buffers):
                        if not i:
                            if side_type == 'OUTSIDE_ONLY':
                                out_feature = buff.difference(single_feature)
                            else:
                                out_feature = buff
                        else:
                            out_feature = buff.difference(buffers[i-1])

                        out_rows.insertRow([out_feature, distances[i]])

    except Exception as err:
        arcpy.AddError(err)
        sys.exit(1)


if __name__ == '__main__':
    parameter_values = get_parameter_values()
    create_multi_buffers(*parameter_values)
    arcpy.SetParameterSymbology(1, os.path.join(os.path.dirname(sys.path[0]),
                                                "Templates", "Layers",
                                                "buffer_output.lyrx"))

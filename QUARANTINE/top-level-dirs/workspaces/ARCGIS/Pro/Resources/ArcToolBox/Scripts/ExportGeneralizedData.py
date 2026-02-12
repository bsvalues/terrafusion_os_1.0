"""
COPYRIGHT 2018 ESRI

TRADE SECRETS: ESRI PROPRIETARY AND CONFIDENTIAL
Unpublished material - all rights reserved under the
Copyright Laws of the United States.

For additional information, contact:
Environmental Systems Research Institute, Inc.
Attn: Contracts Dept
380 New York Street
Redlands, California, USA 92373

email: contracts@esri.com

---------------------------------------------------------------------------
Source Name:   ExportGeneralizedData.py
Version:       ArcGIS 2.3
Author:        Environmental Systems Research Institute Inc.
Description:   Exports generalized data to a generalization geodatabase.
---------------------------------------------------------------------------
"""

import arcpy
import os
import sys
import TopographicGeneralizationUtilities as gen
import DefenseUtilities as defense
from TopographicGeneralizationUtilities import ToolException

def check_license():
    # Check out licenses
    if defense.licenselevel() == 'Basic' or defense.licenselevel() == 'None':
        raise defense.LicenseException("You must have at least the Standard License to run this tool.")
    if defense.licenselevel == 'Server':
        if arcpy.CheckExtension('defense') != 'Available' or arcpy.CheckExtension('foundation') != 'Available':
            defense.LicenseException('Tool requires either Defense or Foundation extension to run.')
    else:
        if 'Available' == arcpy.CheckExtension('defense'):
            defense.checkoutextensions(['defense'])
        elif 'Available' == arcpy.CheckExtension('Foundation'):
            defense.checkoutextensions(['Foundation'])
        else:
            raise defense.LicenseException('Tool requires either Defense or Foundation extension to run.')

def delete_existing_features(theme_workspace, target_workspace, rule_book, theme, theme_update_dict):
    """
    Determines which features are included in the generalization process and deletes
    all these features from the production geodatabase. This ensures that the production
    geodatabase does not contain multiple versions of the same feature.
    """


    # get feature classes from input workspace
    target_fc_dict = gen.GetFeatureClasses(target_workspace)

    # Get sheet from workbook
    rule_sheet = gen.CheckSheets(rule_book, 'Rules', 1)

    # get the required column IDs from the spreadsheet
    common_columns = ['OBJECTCLASS', 'SUBTYPENUMBER', 'SUBTYPEFIELD', 'SUBSET QUERY', 'THEMES', "GEOMETRY TYPE"]
    column_indices = gen.CheckColumns(rule_sheet, common_columns)

    theme_fc_field = theme + ': ObjectClass'
    theme_col_indices, theme_fields = gen.GetColumns(rule_sheet, theme)

    if theme_fc_field not in theme_col_indices:
        arcpy.AddIDMessage('ERROR', 413, theme_fc_field, 'Rules')  # %1 not found in %2
        sys.exit(1)

    # Delete features for each row
    for row_index in range(2, rule_sheet.max_row + 1):
        target_fc_name = rule_sheet.cell(row_index, column_indices['OBJECTCLASS']).value
        if target_fc_name is not None:
            target_fc_name = target_fc_name.strip()
            # issue 2998 - cast to upper to match foreign characters
            target_fc_name = target_fc_name.upper()
        geometry_type  = rule_sheet.cell(row_index, column_indices['GEOMETRY TYPE']).value
        theme_fc_name  = rule_sheet.cell(row_index, theme_col_indices[theme_fc_field]).value

        # Check whether the row belongs to the specified theme
        if theme_fc_name != "" and theme_fc_name is not None and geometry_type is not None:

            # Check if the feature class exists in both input and target databases. Otherwise, keep existing features.
            theme_fc_path = gen.GetThemeFeatureClassPath(theme_workspace, theme, theme_fc_name, geometry_type)
            theme_fc_name = os.path.basename(theme_fc_path)

            update = 'YES'
            if theme_fc_name.upper() in theme_update_dict:
                update = theme_update_dict[theme_fc_name.upper()]

            if update.upper() == 'YES':
                everything_exists = True
                if not arcpy.Exists(theme_fc_path):
                    arcpy.AddIDMessage('WARNING', 413, os.path.basename(theme_fc_path), theme_workspace)  # %1 not found in %2
                    everything_exists = False
##                    sys.exit(1)

                if target_fc_name not in target_fc_dict:
                    arcpy.AddIDMessage('WARNING', 413, target_fc_name, target_workspace)  # %1 not found in %2
                    everything_exists = False
##                    sys.exit(1)

                if everything_exists:

                    target_fc_path = target_fc_dict[target_fc_name]

                    # determine the subset of features to apply the theme rule
                    subtype_field = rule_sheet.cell(row_index, column_indices['SUBTYPEFIELD']).value
                    subtype_value = (rule_sheet.cell(row_index, column_indices['SUBTYPENUMBER']).value)
                    subset_query  = rule_sheet.cell(row_index, column_indices['SUBSET QUERY']).value

                    # Combine subtype and subset queries. If no subtypes, use only the subset query.
                    query = ''
                    if subtype_field and subtype_value is not None:
                        subtype_value = int(subtype_value)
                        query = gen.MakeWhereClause(target_fc_path, subtype_field, subtype_value, '=')
                    if subset_query:
                        query = '{} AND ({})'.format(query,subset_query) if query else subset_query

                    target_fc_info = os.path.basename(target_fc_name) + ('' if not query else " ({})".format(query))


                    # delete theme features
                    update_count = 0
                    with arcpy.da.UpdateCursor(target_fc_path, ['OID@'], query) as cursor:
                        for row in cursor:
                            cursor.deleteRow()
                            update_count += 1
                    if update_count >= 1:
                        arcpy.AddMessage(target_fc_info)  # Validating %1.
                        arcpy.AddIDMessage('INFORMATIVE', 86193, arcpy.GetIDMessage(1141).replace('%lld', '{}').format(update_count))

    return everything_exists

def delete_theme_feature_classes(theme_workspace, rule_book, theme):
    """Deletes the feature classes for the chosen theme from the theme workspace.
    reads the Theme Object Classes tab to deteremine if any feature classes should
    be kept because they are used by other themes."""

##    arcpy.AddMessage("Deleting theme feature classes")
    keep_fcs = []
    try:
        theme_class_names = gen.CaseSet()

        # Get sheet from workbook

        theme_sheet = gen.CheckSheets(rule_book, 'ThemeObjectClasses', 1)

        common_columns = ['THEME', 'OBJECTCLASS', 'FEATURE TYPE', "KEEP THEME FC"]
        column_indices = gen.CheckColumns(theme_sheet, common_columns)

        theme_col_dict, theme_fields = gen.GetColumns(theme_sheet, theme)

        # deteremine fcs to keep

        for row_index in range(1, theme_sheet.max_row + 1):
            keep = theme_sheet.cell(row_index, column_indices['KEEP THEME FC']).value
            theme_name = theme_sheet.cell(row_index, column_indices['THEME']).value

            if theme_name is not None and theme_name.upper() == theme.upper():
                if keep is not None and keep.upper() == 'YES':
                    obj_class = theme_sheet.cell(row_index, column_indices['OBJECTCLASS']).value
                    geo_type = theme_sheet.cell(row_index, column_indices['FEATURE TYPE']).value
                    if obj_class and geo_type:
                        theme_fc_name = gen.GetThemeFeatureClassPath('', theme, obj_class, geo_type)
                        keep_fcs.append(theme_fc_name.upper())

    except Exception as e:
        arcpy.AddWarning('{}'.format(e))
        pass
##        tb = sys.exc_info()[2]
##        arcpy.AddError("Failed at Line %i" % tb.tb_lineno)
##        arcpy.AddMessage("Fcs to keep: {}".format(keep_fcs))
    try:
        # loop through all feature classes and tables in the theme workspace

        arcpy.AddMessage("Deleting feature classes from {}".format(theme_workspace))
        walk =  arcpy.da.Walk(theme_workspace)
        for dirpath, dirnames, filenames in walk:
            for filename in filenames:
                # if feature class name starts with theme
                if filename.upper().startswith('{}_'.format(theme.upper())):
                    # and feature class is not in the keep list
                    if filename.upper() not in keep_fcs:
                        theme_fc_path = os.path.join(dirpath, filename)
                        try:
                            arcpy.Delete_management(theme_fc_path)
                            arcpy.AddMessage("... {}".format(filename))
                        except:
                            arcpy.AddIDMessage('WARNING', 601, theme_fc_path)
                            continue


    except Exception as e:
        arcpy.AddError('{}'.format(e))
        tb = sys.exc_info()[2]
        arcpy.AddError("Failed at Line %i" % tb.tb_lineno)

    finally:
        return

def export_theme_features(theme_workspace, target_workspace, rule_book, theme, invisibility_field_name, theme_update_dict):

    # Get theme classes from the workbook
##    theme_classes = get_theme_class_names(rule_book, theme)
    theme_classes = get_theme_fcs(theme_workspace, theme)
##    arcpy.AddMessage(theme_classes)
    if not theme_classes:
        arcpy.AddIDMessage('ERROR', 414, theme)
        sys.exit(1)

    fc_name_field = theme.upper() + '_FCNAME'

    # get feature classes from target workspace
    theme_fc_dict  = gen.GetFeatureClasses(theme_workspace)
    target_fc_dict = gen.GetFeatureClasses(target_workspace)

    arcpy.AddIDMessage('INFORMATIVE', 86043)


    for theme_class_name in theme_classes:
        update = 'YES'
        if theme_class_name.upper() in theme_update_dict:
            update = theme_update_dict[theme_class_name.upper()]

        if update.upper() == 'YES':
    ##        arcpy.AddMessage(theme_class_name)
            # The tool may need to explicitly check if theme feature class exists
            # due to a corruption issue in file geodatabase
            if theme_class_name not in theme_fc_dict:
                arcpy.AddIDMessage('WARNING', 413, theme_class_name, theme_workspace)
                continue

            theme_class = os.path.join(theme_workspace, theme_class_name)
            input_count = int(arcpy.GetCount_management(theme_class)[0])
            if input_count <= 0:
                arcpy.AddIDMessage('WARNING', 10245, theme_class_name)
                continue

            arcpy.AddIDMessage('INFORMATIVE', 86283, theme_class_name, ' ')

            output_count = 0
            copy_fc = ''
            try:
                # check input feature class for FCNAME field that identifies the target feature class
                target_fc_field = next((field.name for field in arcpy.ListFields(theme_class) if field.name.upper() == fc_name_field.upper()), '')
                if not target_fc_field:
                    arcpy.AddIDMessage('ERROR', 413, fc_name_field, theme_class)
                    sys.exit(1)

                # check input feature class has visibility filter
                invisibility_field = ''
                if invisibility_field_name:
                    invisibility_field = next((field.name for field in arcpy.ListFields(theme_class) if field.name.upper() == invisibility_field_name.upper()), '')
                    if not invisibility_field:
                        arcpy.AddIDMessage('ERROR', 413, invisibility_field_name, theme_class)
                        sys.exit(1)

                # get a list of the input feature classes that make up the theme layer
                target_fc_set = gen.CaseSet()
                with arcpy.da.SearchCursor(theme_class, target_fc_field) as cursor:
                    for row in cursor:
                        if row[0]:
                            target_fc_set.add(row[0].upper())
    ##            arcpy.AddMessage("target fcs {}".format(target_fc_set))
                for target_fc_name in target_fc_set:
                    # if the feature class exists in the output database
                    if target_fc_name in target_fc_dict:

                        # make sure geometry types match
                        input_shape_type = arcpy.Describe(theme_class).shapeType
                        target_fc_path = target_fc_dict[target_fc_name]
                        target_shape_type = arcpy.Describe(target_fc_path).shapeType
                        if target_shape_type == 'Multipoint':
                            input_shape_type = 'Multipoint'
                        if input_shape_type == target_shape_type:
                            copy_fc = arcpy.CopyFeatures_management(theme_class, 'in_memory\\layer_' + target_fc_name)

                            sub_fields = [target_fc_field, invisibility_field] if invisibility_field else [target_fc_field]
                            copy_count = 0
                            with arcpy.da.UpdateCursor(copy_fc, sub_fields) as cursor:
                                for row in cursor:
                                    if str(row[0]).upper() != target_fc_name.upper():
                                        cursor.deleteRow()
                                    elif invisibility_field and row[1]:
                                        if int(row[1]) == 1:
                                            cursor.deleteRow()
                                    else:
                                        copy_count += 1

                            arcpy.AddMessage('{} feature to copy for {}'.format(copy_count, target_fc_name))
##                            copy_count = int(arcpy.GetCount_management(copy_fc)[0])
                            if copy_count >= 1:
                                if target_shape_type == 'Multipoint':
    ##                                arcpy.AddMessage(target_fc_path)
                                    #issue 2182 - added so features dissolve back to multipart
                                    d_fields = getNonSys(target_fc_path)
                                    copy_fc = arcpy.Dissolve_management(copy_fc, 'in_memory\\dissolve_{}'.format(target_fc_name), d_fields)
                                    copy_count = int(arcpy.GetCount_management(copy_fc)[0])

                                arcpy.AddIDMessage('INFORMATIVE', 86087, '{} ({})'.format(target_fc_name, copy_count))
                                arcpy.Append_management(copy_fc, target_fc_path, 'NO_TEST')
    ##                            arcpy.AddMessage(arcpy.GetMessages())
                                writeResults()
                                output_count += copy_count

                            if arcpy.Exists(copy_fc):
                                arcpy.Delete_management(copy_fc)
                        else:
                            arcpy.AddIDMessage('WARNING', 86283, target_fc_name, arcpy.GetIDMessage(469, 'Mismatch between geometry types'))
                    else:
                        arcpy.AddIDMessage('WARNING', 413, target_fc_name, target_workspace)


            finally:
                if arcpy.Exists(copy_fc):
                    arcpy.Delete_management(copy_fc)
        else:
            arcpy.AddMessage('Skipping {}, source features were not modified during generalization'.format(theme_class_name))
    return target_fc_dict

def get_invisibility_field(rule_book):
    # Get sheet from workbook
    try:
        fields_sheet = gen.CheckSheets(rule_book, 'Fields', 4)
    except Exception as e:
        return ''

    # get the required column IDs from the spreadsheet
    common_columns = ['THEME', 'FIELD USE', "FIELD"]
    try:
        column_indices = gen.CheckColumns(fields_sheet, common_columns)
    except Exception as e:
        return ''

    invisibility_field = ''
    for row_index in range(1, fields_sheet.max_row + 1):
        theme_name = fields_sheet.cell(row_index, column_indices['THEME']).value
        field_use  = fields_sheet.cell(row_index, column_indices['FIELD USE']).value
        field_name = fields_sheet.cell(row_index, column_indices['FIELD']).value
        if theme_name and field_use and theme_name:
            if theme_name.upper() == 'ALL' and field_use.upper() == 'INVISIBILITY':
                invisibility_field = field_name
                break

    return invisibility_field

def getNonSys(in_fc):
    #issue 2182 - added so features dissolve back to multipart
    non_sys_fields = []

    for field in arcpy.ListFields(in_fc):
        if not field.required:
            field_type = field.type
            if field_type not in ('Blob', 'Raster', 'GlobalID'):
                non_sys_fields.append(field.name)

    desc = arcpy.Describe(in_fc)
    if desc.editorTrackingEnabled:
        if desc.creatorFieldName in join_fields:
            non_sys_fields.remove(desc.creatorFieldName)
        if desc.createdAtFieldName in join_fields:
            non_sys_fields.remove(desc.createdAtFieldName)
        if desc.editorFieldName in join_fields:
            non_sys_fields.remove(desc.editorFieldName)
        if desc.editedAtFieldName in join_fields:
            non_sys_fields.remove(desc.editedAtFieldName)
##    arcpy.AddMessage(non_sys_fields)
    return non_sys_fields

def get_theme_fcs(workspace, theme):
    fc_list = gen.CaseSet()

    walk = arcpy.da.Walk(workspace, datatype="FeatureClass")
    for dirpath, dirnames, filenames in walk:
        for filename in filenames:
            if filename.upper().startswith(theme.upper()):
                if filename.upper().endswith('_A') or filename.upper().endswith('_P') or filename.upper().endswith('_L'):
                    fc_class_path = os.path.join(dirpath, filename)
                    fc_list.add(filename)

    theme_list = list(fc_list)
    theme_list.sort()
    return theme_list


def get_theme_class_names(rule_book, theme):

    theme_class_names = gen.CaseSet()

    # Get sheet from workbook
    try:
        rule_sheet = gen.CheckSheets(rule_book, 'Rules', 1)
    except Exception as e:
        return gen.CaseSet()  # empty list

    # get the required column IDs from the spreadsheet
    try:
        common_columns = ['OBJECTCLASS', 'THEMES', "GEOMETRY TYPE"]
        column_indices = gen.CheckColumns(rule_sheet, common_columns)
    except Exception as e:
        return gen.CaseSet()  # empty list

    theme_fc_field = theme + ': ObjectClass'
    theme_col_dict, theme_fields = gen.GetColumns(rule_sheet, theme)

    # Delete features for each row
    for row_index in range(2, rule_sheet.max_row + 1):
        geometry_type = rule_sheet.cell(row_index, column_indices['GEOMETRY TYPE']).value
        theme_fc_name = rule_sheet.cell(row_index, theme_col_dict[theme_fc_field]).value
        # Check whether the row belongs to the specified theme
        if theme_fc_name != "" and theme_fc_name is not None and geometry_type is not None:
            theme_fc_name = theme_fc_name.strip()
            target_fc_path = gen.GetThemeFeatureClassPath('', theme, theme_fc_name, geometry_type)
            theme_class_names.add(target_fc_path)

    theme_list = list(theme_class_names)
    theme_list.sort()
    return theme_list

def writeResults():
    warnings = arcpy.GetMessages(1)
    errors = arcpy.GetMessages(2)
    if len(warnings) > 0:
        arcpy.AddWarning(warnings)
    if len(errors) > 0:
        arcpy.AddError(errors)
    return


def create_updated_dict(rule_file, theme):

    theme_info_dict = {}

##    try:
##        common_columns = ['THEME', 'OBJECTCLASS', 'FEATURE TYPE',  'UPDATED BY THEME']
##        themeObjectClasses = gen.query_excel_rows(rule_file, 'ThemeObjectClasses', common_columns)
##
##    except:
##        common_columns = ['THEME', 'OBJECTCLASS', 'FEATURE TYPE']
##        themeObjectClasses = gen.query_excel_rows(rule_file, 'ThemeObjectClasses', common_columns)


    common_columns = ['THEME', 'OBJECTCLASS', 'FEATURE TYPE', 'SCHEMA CLASSES', 'UPDATED BY THEME']
    try:
        themeObjectClasses = gen.query_excel_rows(rule_file, 'ThemeObjectClasses', common_columns)
    except:
        try:
            # if column doesn't exist, get the rest of the info and assumen value is yes
            common_columns = ['THEME', 'OBJECTCLASS', 'FEATURE TYPE', 'SCHEMA CLASSES']
            themeObjectClasses = gen.query_excel_rows(rule_file, 'ThemeObjectClasses', common_columns)

        except ToolException as e:
            arcpy.AddIDMessage("ERROR", e.id, e.args[1], e.args[2])
            tb = sys.exc_info()[2]
            arcpy.AddError("Failed at Line %i" % tb.tb_lineno)
            sys.exit(1)
        except Exception as e:
            arcpy.AddIDMessage("ERROR", 10158, rule_file)  # Unable to open file %1.

            tb = sys.exc_info()[2]
            arcpy.AddError("Failed at Line %i" % tb.tb_lineno)
            sys.exit(1)


    try:

        for themeClass in themeObjectClasses:
            fc_theme = themeClass['THEME']

            # Check if object class belongs to this theme
            if fc_theme.upper() != theme.upper():
                continue

            fc_name = themeClass['OBJECTCLASS']
            fc_name = fc_name.strip()
            geometry_type = themeClass['FEATURE TYPE']

            out_fc_name = None
            create_type = None

            # determine the output feature class name for the row
            if geometry_type.upper() == 'POLYGON' or geometry_type.upper() == 'POLY':
                out_fc_name = f"{theme}_{fc_name}_A"
            elif geometry_type.upper() == 'LINE' or geometry_type.upper() == 'POLYLINE':
                out_fc_name = f"{theme}_{fc_name}_L"
            elif geometry_type.upper() == 'POINT' or geometry_type.upper() == 'PT':
                out_fc_name = f"{theme}_{fc_name}_P"

            if out_fc_name:
                if 'UPDATED BY THEME' in themeClass:
                    theme_info_dict[out_fc_name.upper()] = themeClass['UPDATED BY THEME'].upper()
                else:
                    theme_info_dict[out_fc_name.upper()] = 'YES'

##    except ToolException as e:
##        arcpy.AddIDMessage("ERROR", e.id, e.args[1], e.args[2])
##        sys.exit(1)
##    except Exception as e:
##        rule_file_name = os.path.splitext(os.path.basename(rule_file))[0]
##        arcpy.AddIDMessage("ERROR", 10158, rule_file_name)  # Unable to open file %1.
##        arcpy.AddError(e)
##        sys.exit(1)

    except Exception as e:
        arcpy.AddError('{}'.format(e))
        tb = sys.exc_info()[2]
        arcpy.AddError("Failed at Line %i" % tb.tb_lineno)

    return theme_info_dict


def main():

    theme_workspace  = arcpy.GetParameterAsText(0)
    target_workspace = arcpy.GetParameterAsText(1)
    rule_file        = arcpy.GetParameterAsText(2)
    theme            = arcpy.GetParameterAsText(3)
    export_visible   = arcpy.GetParameterAsText(4).lower() == 'true'

    rule_file_name = os.path.splitext(os.path.basename(rule_file))[0]
##    arcpy.AddIDMessage('INFORMATIVE', 86071, rule_file_name)  # %s is loading...

    # Get sheet from workbook
    rule_book = gen.OpenWorkbook(rule_file)

    # Get visibility field
    invisibility_field = ''
    if export_visible:
        invisibility_field = get_invisibility_field(rule_book)
        if not invisibility_field:
            arcpy.AddIDMessage('ERROR', 413, "<invisibility_field>", os.path.basename(rule_file))
            sys.exit(1)

    try:
        check_license()

        update_dict = create_updated_dict(rule_file, theme)

        # Delete theme features from production geodatabase to avoid duplicates
        everything_exists = delete_existing_features(theme_workspace, target_workspace, rule_book, theme, update_dict)

        if everything_exists:

            # Export theme features to production geodatabase
            target_fc_dict = export_theme_features(theme_workspace, target_workspace, rule_book, theme, invisibility_field, update_dict)

            # Clean up theme database by delete them feature classes
            delete_theme_feature_classes(theme_workspace, rule_book, theme)

        else:
            arcpy.AddError(f"Unable to find and delete all expected features in {target_workspace}.")

    except Exception as e:
        arcpy.AddError('{}'.format(e))
        tb = sys.exc_info()[2]
        arcpy.AddError("Failed at Line %i" % tb.tb_lineno)


if __name__ == '__main__':
    main()

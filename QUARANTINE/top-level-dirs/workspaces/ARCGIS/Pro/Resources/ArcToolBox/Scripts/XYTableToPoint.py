"""-------------------------------------------------------------------------
    Tool:               XY Table To Point (Data Management Tools)
    Source Name:        XYTableToPoint.py
    Version:            ArcGIS Pro 2.1
    Author:             Esri, Inc.
    Usage:              arcpy.XYTableToPoint_management(in_table,
                                                        out_feature_class,
                                                        x_field,
                                                        y_field,
                                                        {z_field},
                                                        {coordinate_system})
    Required Arguments: Input Table
                        Output Feature Class
                        X Field
                        Y Field
    Optional Arguments: Z Field
                        Coordinate System
    Description:        Create a point feature class using coordinates from
                        input xy table.
    Updated:            ArcGIS Pro 3.2
------------------------------------------------------------------------"""

import arcpy
import os

def valid_coordinate_system(cs, vertical=False):
    """
    test if sr is value, i.e., not in [None, '', '#'] and has a name.
    @cs: coordinate system
    @vertical: Boolean. If True, test if input cs has a valid vertical cs.
               Default is False.
    return: Boolean
    """
    try:
        if vertical:
            cs = cs.VCS
        return True if (cs not in [None, '', '#'] and cs.name) else False
    except AttributeError:  # if cs.VCS/cs.name doesn't exist or is None
        return False


def get_valid_coordinate_system(coordinate_system, z_field):
    """
    return valid coordinate system based on z_field.
    @coordinate_system: input spatial reference parameter
    @z-field: input z_field parameter
    return: validated output spatial reference
    """

    # choices of default coordinate system
    wgs84 = arcpy.SpatialReference(4326)
    wgs84_vcs = arcpy.SpatialReference(4326, 115700)

    # use coordinate_system if it's set, else use WGS1984
    if valid_coordinate_system(coordinate_system):
        input_sr = coordinate_system
    else:
        input_sr = wgs84 if not z_field else wgs84_vcs

    # set warnings
    # if z_field is not empty but no vcs, set warning 90111
    if z_field and not valid_coordinate_system(input_sr, vertical=True):
        arcpy.AddIDMessage('WARNING', 90111)
    # if z_field is empty but has vertical cs, set warning 650
    elif not z_field and valid_coordinate_system(input_sr, vertical=True):
        arcpy.AddIDMessage('WARNING', 650)

    # return validated output spatial reference
    return input_sr


def xy_table_to_points(in_table, output_fc, x_field, y_field, z_field, coordinate_system):
    """
    Create point feature class using XY table
    """
    # Check basic info of input
    txtfile = False
    joined = False

    out_shp = str(output_fc).endswith('.shp')
    resolved_output_fc = "in_memory/table_merged_intermediate" if out_shp else output_fc

    # check if output is to feature dataset, which hardcodes input_sr
    out_fd = False
    try:
        dsc_out_wkspc = arcpy.Describe(os.path.dirname(output_fc))
        if hasattr(dsc_out_wkspc, "dataType"):
            out_fd = True if dsc_out_wkspc.dataType.lower() == "featuredataset" else False
        del dsc_out_wkspc
    except:
        pass

    try:
        dsc_in = arcpy.Describe(in_table)
        if dsc_in.dataType.lower() == "textfile":
            txtfile = True
        # Error if data has a join, not supported with da cursors
        joined = True if dsc_in.OIDFieldName.lower().split(".")[0] == dsc_in.baseName.lower() else False
        del dsc_in
    except:       
        pass
    if joined: # quits have to be outside try except
        arcpy.AddIDMessage("ERROR", 1486)  
        raise quit()

    # Progress bar
    count = 0
    i = 0
    if txtfile: # Different logic for txt files, which are slow with GetCount
        try:
            with open(str(in_table)) as f:
                count = sum(1 for line in f)
        except UnicodeDecodeError:
            try:
                with open(str(in_table), encoding="utf8") as f:
                    count = sum(1 for line in f)
            except:
                pass
    else:
        count = int(arcpy.GetCount_management(in_table).getOutput(0))
    if count:
        arcpy.SetProgressor('step', "", 0, count, 5000)

    # Get the right spatial reference
    input_sr = get_valid_coordinate_system(coordinate_system, z_field)

    # check input and output coordinate systems to see if transformation is necessary
    transformation = None
    ouputCS_env_name = input_sr.name
    createfc_sr = input_sr
    if arcpy.env.outputCoordinateSystem and not out_fd:
        createfc_sr = arcpy.env.outputCoordinateSystem
        outputCS_env_name = arcpy.env.outputCoordinateSystem.name
        if outputCS_env_name != input_sr.name:
            transformation = arcpy.ListTransformations(input_sr, arcpy.env.outputCoordinateSystem)
            transformation = transformation[0] if transformation else None
    if out_fd:
        createfc_sr = arcpy.Describe(os.path.dirname(output_fc)).spatialReference
        if createfc_sr.name != input_sr.name:
            transformation = arcpy.ListTransformations(input_sr, createfc_sr)
            transformation = transformation[0] if transformation else None
            not_input_sr = input_sr if not arcpy.env.outputCoordinateSystem else arcpy.env.outputCoordinateSystem
            # raise warning that the feature dataset controls the coordinate system
            if createfc_sr.name != not_input_sr.name:
                arcpy.AddIDMessage("WARNING", 130006, not_input_sr.name)
                arcpy.AddIDMessage("WARNING", 86114, str(output_fc), createfc_sr.name)

    # Create a feature class with the same schema as the input table
    template = in_table
    zs = "ENABLED" if z_field else "DISABLED"
    if txtfile: # workaround for problem creating a feature class with csv/txt template
        with arcpy.EnvManager(overwriteOutput=True):
            template = arcpy.management.CreateTable("in_memory", "intermediate_csvtable", in_table)

    arcpy.management.CreateFeatureclass(os.path.dirname(resolved_output_fc), 
                                        os.path.basename(resolved_output_fc),
                                        "POINT", 
                                        template, 
                                        "DISABLED", 
                                        zs, 
                                        createfc_sr)
    zs = True if zs == "ENABLED" else False

    ## Get a set of all fields minus OID + Shape
    dsc = arcpy.da.Describe(in_table)
    dsc_out = arcpy.da.Describe(resolved_output_fc)
    req_gdb_fields = ["OIDFieldName", "lengthFieldName", "areaFieldName", "shapeFieldName"]
    ignore_fields = []
    ignore_fields_out = []
    
    # We want to retain xyz fields whose fieldnames start with the string 'shape'
    if not str(z_field):
       xyz_list = [x_field, y_field]
    else:
       xyz_list = [x_field, y_field, z_field]

    for f in req_gdb_fields:
        if f in dsc.keys():
            if dsc[f]:
                ignore_fields.append(dsc[f].lower())
        if f in dsc_out.keys():
            if dsc_out[f]:
                ignore_fields_out.append(dsc_out[f].lower())
    # Parse the input field lists to find fields that will be in the output
    in_fields = []
    in_unsupported_fields = []
    for field in dsc["fields"]:
        if field.name.lower() not in ignore_fields:
            if field.name.lower().startswith("shape") and field.name in xyz_list:
                in_fields.append(field.name)
            elif not field.name.lower().startswith("shape"):
                in_fields.append(field.name)
            else:
                in_unsupported_fields.append(field.name)
    # Parse the output field lists to find fields matching the input
    out_fields = []
    out_unsupported_fields = []
    for field in dsc_out["fields"]:
        if field.name.lower() not in ignore_fields_out:
            if field.name.lower().startswith("shape") and field.name in xyz_list:
                out_fields.append(field.name)
            elif not field.name.lower().startswith("shape"):
                out_fields.append(field.name)
            else:
                out_unsupported_fields.append(field.name)
    # Raise warnings and errors about unsupported fields and mismatched schema
    if in_unsupported_fields:
        arcpy.AddIDMessage("WARNING", 120251, ", ".join(in_unsupported_fields))
        if out_unsupported_fields:
            arcpy.DeleteField_management(resolved_output_fc, out_unsupported_fields)
    if len(in_fields) != len(out_fields):
        arcpy.AddIDMessage("ERROR", 50005)
        raise quit()

    # logic for inserting x,y or x,y,z
    usegeometry = False
    if not str(z_field):
        in_xyz_fields = (str(x_field).upper(), str(y_field).upper())
        out_xyz_fields = "SHAPE@XY"
    else:
        in_xyz_fields = (str(x_field).upper(), str(y_field).upper(), str(z_field).upper())
        out_xyz_fields = "SHAPE@XYZ"
    if (transformation) or (createfc_sr.name != input_sr.name):
        out_xyz_fields = "SHAPE@"
        usegeometry = True

    # Project the extent if it is set
    extent = None
    if arcpy.env.extent:
        extent = arcpy.env.extent.projectAs(input_sr, transformation)
        
    # cursor time
    empty_out_bounds = []
    nulls = []
    coord_indexes = []
    runtime = []
    with arcpy.da.SearchCursor(in_table, in_fields) as scur:
        with arcpy.da.InsertCursor(resolved_output_fc, [out_xyz_fields] + out_fields, transformation) as icur:
            for val in in_xyz_fields: # Get the index of XYZ fiels in the cursor
                    coord_indexes.append(tuple(fname.upper() for fname in scur.fields).index(val.upper()))  
            for row in scur:
                i += 1
                coord_values = [row[index] for index in coord_indexes]
                # check for coordinates outside the extent
                if extent:
                    if not(extent.XMin <= coord_values[0] <= extent.XMax) or not(extent.YMin <= coord_values[1] <= extent.YMax):
                        continue
                # Keep records with when null geometries but raise warning in 3.1
                # geoprocessing/issues/6202
                if not coord_values[0] or \
                    not coord_values[1]:
                    nulls.append(str(i))
                # check for coordinates valid to GCS
                if input_sr.type.lower() == "geographic":
                    if coord_values[0] and coord_values[1]:
                        if not -400 < coord_values[0] < 400 or \
                           not -400 < coord_values[1] < 400:
                           empty_out_bounds.append(str(i))
                           continue
                # insert the row
                getrow = list(row)
                if not usegeometry:
                    getrow.insert(0,tuple(coord_values))
                else:
                    # use PointGeometry to handle projection/transformation
                    getrow.insert(0,arcpy.PointGeometry(arcpy.Point(*coord_values),input_sr, zs))
                try:
                    icur.insertRow(tuple(getrow))
                except Exception as e:
                    if str(e).find("nullable")>-1:
                        arcpy.AddIDMessage("WARNING", 1086, str(e).split("[")[1][:-1])
                    elif type(e) is RuntimeError:
                        runtime.append(str(e))
                        empty_out_bounds.append(str(i))
                    else:
                        empty_out_bounds.append(str(i))

                # Don't increment the progressor each row, for better performance
                if i % 2000 == 0:
                    arcpy.SetProgressorPosition()

    if empty_out_bounds:
        arcpy.AddIDMessage("WARNING", 100160)
        arcpy.AddIDMessage("WARNING", 192, "{}: {}".format(str(arcpy.GetIDMessage(84526)).lower(), 
                                           ", ".join(empty_out_bounds)))
    
    if nulls:
        arcpy.AddIDMessage("WARNING", 40401, "{}".format(", ".join(nulls)))

    if runtime:
        for error in set(runtime):
            arcpy.AddWarning(error)
    
    # Copy features from in_memory and recalc shapefile spatial index
    if out_shp:
        arcpy.CopyFeatures_management(resolved_output_fc, output_fc)
        arcpy.AddSpatialIndex_management(output_fc)
        try:
            arcpy.Delete_management(resolved_output_fc)
        except:
            pass

if __name__ == '__main__':
    in_table = arcpy.GetParameter(0)
    output_fc = arcpy.GetParameterAsText(1)
    x_field = arcpy.GetParameterAsText(2)
    y_field = arcpy.GetParameterAsText(3)
    z_field = arcpy.GetParameterAsText(4) 
    coordinate_system = arcpy.GetParameter(5)
    
    xy_table_to_points(in_table, output_fc, x_field, y_field, z_field, coordinate_system)

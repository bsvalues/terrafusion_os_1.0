import arcpy

def generateTessellation(out_fc, in_extent, in_shape_type, in_shape_size, in_coord_sys, shape_dict):
    import os
    from math import sqrt
    from tessellate.tessellations import TessellationFactory
    from convert_spatial_units import convert_areal_units, convert_linear_units, dd_to_km_ratio

    area, areal_unit = in_shape_size.value.split(" ")
    area = float(area.replace(",", "."))

    if area <= 0.0:
        arcpy.AddIDMessage("ERROR", 323)
        return

    if not in_extent:
        arcpy.AddIDMessage("ERROR", 735, "Extent")
        return

    try:
        ucs = arcpy.SpatialReference()
        ucs.loadFromString(
            u'{B286C06B-0879-11D2-AACA-00C04FA33C20};-450359962737.05 -450359962737.05 10000;#;#;0.001;#;#;IsHighPrecision')

        # Area of regular polygon to radius formula
        area_sq_m = convert_areal_units(area, 'squaremeters', areal_unit)
        s = shape_dict[in_shape_type.upper()].shape.sides
        d = sqrt(3) if s % 3 == 0 else 2
        radius_m = sqrt((4 * (area_sq_m / s)) / d)

        # output SR is that of SR param, else extent.SR, else Unknown
        if in_coord_sys not in [None, "", "#"] and in_coord_sys.name:
            project_to = in_coord_sys
        elif (in_extent.spatialReference is not None and
            in_extent.spatialReference.name != ""):
            project_to = in_extent.spatialReference
        else:
            project_to = ucs

        # extent's SR
        if (in_extent.spatialReference is not None and
                in_extent.spatialReference.name != ""):
            project_from = in_extent.spatialReference
        else:
            project_from = ucs

        # unit conversion
        if (project_from.linearUnitName == project_to.linearUnitName and
            project_from.linearUnitName in ["Meter", ""]) or (areal_unit == "Unknown"):
            # No conversion needed
            size = radius_m
        elif project_from.type == "Geographic":
            # Convert from Decimal Degrees
            ratio = dd_to_km_ratio(in_extent)
            size = convert_linear_units(radius_m * 1000 * ratio,
                                        'kilometers',
                                        project_to.linearUnitName)
        else:
            # Regular conversion of units
            size = convert_linear_units(radius_m,
                                        'meters',
                                        project_to.linearUnitName)

        if ((project_to.type == "Geographic") and
            (areal_unit not in ["Unknown", ""])):
            # Convert to Decimal Degrees
            ratio = 1 / dd_to_km_ratio(in_extent)
            size = radius_m / 1000 * ratio

        sr = project_to if project_to.name != "Unknown" else ""

        # Create the output feature class and pour tessellation features into it
        output = arcpy.management.CreateFeatureclass(os.path.split(out_fc.value)[0],
                                                    os.path.split(out_fc.value)[1],
                                                    spatial_reference=sr)[0]

        arcpy.AddField_management(output, "GRID_ID", "TEXT", field_length=12)

        tessellation = TessellationFactory.make_tessellation(shape_dict[in_shape_type.upper()],
                                                            float(size),
                                                            in_extent)

        tile_count = tessellation.rows * tessellation.columns

        if tile_count <= 100:
            prog_val = 1
            arcpy.SetProgressor("step", arcpy.GetIDMessage(86174), 0,
                                tile_count, 1)
        else:
            prog_val = int(tile_count/100)
            arcpy.SetProgressor("step", arcpy.GetIDMessage(86174), 0, 100, 1)

        with arcpy.da.InsertCursor(output,
                                field_names=["SHAPE@", "GRID_ID"]) as cursor:
            cursor._enable_simplify = False
            for count, tile in enumerate(tessellation.tiles):
                try:
                    if (project_from.name != project_to.name) and \
                        "Unknown" not in [project_from.name, project_to.name]:
                        # to get InsertCursor to project on the fly need an actual Polygon with a SR
                        polygon = arcpy.Polygon(arcpy.Array([arcpy.Point(*xy) for xy in tile.vertices]), project_from)
                        cursor.insertRow([polygon, tile.oid])
                    else:
                        cursor.insertRow([[xy for xy in tile.vertices], tile.oid])
                except RuntimeError as e:
                    if "out of bounds" in str(e):
                        # drop features that failed to insert due to
                        #  out of CS's valid extent
                        pass
                    else:
                        raise

                if count % prog_val == 0:
                    arcpy.SetProgressorPosition(int(count/prog_val))

        return output

    except (ValueError, RuntimeError, KeyError) as e:
        arcpy.AddError(e)

    except SystemError as e:
        # ambiguous numpy exception, add more information for debugging
        if e.args and "error return without exception set" in e.args[0]:
            arcpy.AddIDMessage("ERROR", 375)
        else:
            arcpy.AddError(e)

def execute(parameters):
    from tessellate.tessellations import SquareTessellation, TriangleTessellation, \
        HexagonTessellation, TransverseHexagonTessellation, DiamondTessellation

    shape_dict = {'SQUARE': SquareTessellation,
                  'TRIANGLE': TriangleTessellation,
                  'HEXAGON': HexagonTessellation,
                  'TRANSVERSE_HEXAGON': TransverseHexagonTessellation,
                  'DIAMOND': DiamondTessellation}

    out_fc, in_extent, in_shape_type, in_shape_size, in_coord_sys, h3_resolution = parameters

    if in_shape_type.upper() == 'H3_HEXAGON':
        if in_extent.spatialReference is None:
            if in_coord_sys:
                in_extent.spatialReference = in_coord_sys
            else:
                # possibly use a more specific error message in the future
                raise arcpy.ExecuteError(arcpy.GetIDMessage(248))
        elif in_coord_sys.exportToString() and (in_extent.spatialReference != in_coord_sys):
            in_extent = in_extent.projectAs(in_coord_sys)

        arcpy.gp.GenerateGridsAndHexagonsInternal_analysis(in_extent.polygon, out_fc, in_shape_type, "", h3_resolution)
    else:
        generateTessellation(out_fc, in_extent, in_shape_type, in_shape_size, in_coord_sys, shape_dict)      

if __name__ == '__main__':
    execute([arcpy.GetParameter(i) for i in range(arcpy.GetArgumentCount())])

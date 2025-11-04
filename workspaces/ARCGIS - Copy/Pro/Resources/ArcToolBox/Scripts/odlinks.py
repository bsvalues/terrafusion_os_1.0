"""-------------------------------------------------------------------------
    Tool:               Generate Origin-Destination Links (Analysis Tools)
    Source Name:        odlinks.py
    Version:            ArcGIS Pro 2.6
    Author:             Esri, Inc.
    Usage:              GenerateOriginDestinationLinks(origin_features,
                                                       destination_features,
                                                       out_feature_class,
                                                       {origin_group_field},
                                                       {destination_group_field},
                                                       {line_type},                                                       
                                                       {num_nearest},
                                                       {search_distance}
                                                       {distance_unit},
                                                       {aggregate_links},
                                                       {sum_fields})
    Required Arguments: Origin Features
                        Destination Features
                        Output Feature Class
    Optional Arguments: Origin Group Field
                        Destination Group Field
                        Line Type
                        Number of Nearest Destinations   
                        Search Distance
                        Distance Unit
                        Aggregate Overlapping Links
                        Summary Fields
    Description:        Create link lines between origins and destinations.
    Updated:            4/11/2023
------------------------------------------------------------------------"""

import arcpy
import os
import sys

def MakeODLinksBasic(origins,
                     destinations,
                     outfc,
                     origin_group_field,
                     dest_group_field,
                     line_type,
                     num_nearest,
                     search_distance,
                     distance_unit,
                     aggregate,
                     sum_fields):

    # Reading data
    arcpy.SetProgressor("default", arcpy.GetIDMessage(84001))
    
    # Support the extent environment if specified by user 
    if arcpy.env.extent:
        polygon = arcpy.env.extent.polygon
    else:
        polygon = None
     
    # describe the origins and destinations
    desc_origins = arcpy.da.Describe(origins)
    desc_destinations = arcpy.da.Describe(destinations)

    samedata = True if desc_origins["catalogPath"] == desc_destinations["catalogPath"] else False

    # get coordinate systems
    origins_coord_sys = desc_origins["spatialReference"]
    destinations_coord_sys = desc_destinations["spatialReference"]
    if line_type.lower() != "geodesic":
        if origins_coord_sys.type.lower() == "geographic" \
        or destinations_coord_sys.type.lower() == "geographic":
            line_type = "GEODESIC"
            arcpy.AddIDMessage("WARNING", 120051)

    origins_where_clause = ""

    # are the group fields string or numeric
    if origin_group_field:
        orig_group_field_type = [f.type for f in desc_origins["fields"] 
                                    if f.name == origin_group_field][0]
        if orig_group_field_type == "String":
            orig_group_field_type = "TEXT"
        elif orig_group_field_type == "Integer":
            orig_group_field_type = "LONG"
        elif orig_group_field_type == "SmallInteger":
            orig_group_field_type = "SHORT"
        dest_group_field_type = [f.type for f in desc_destinations["fields"]
                                    if f.name == dest_group_field][0]

    # create the output feature class   
    if isinstance(aggregate, str):
        if aggregate.lower() == "aggregate_overlapping":
            aggregate = True
        else:
            aggregate = False
    if aggregate:
        orig_outfc = str(outfc)
        # NOT in_memory, which doesn't support SQL in aggregate cursor below
        outfc = "memory/temp_links_arcgispro_intermediate"

    arcpy.management.CreateFeatureclass(os.path.dirname(outfc), 
                                        os.path.basename(outfc), 
                                        "POLYLINE", 
                                        spatial_reference=origins_coord_sys)

    # set up the output and cursor fields
    add_fields = [["ORIG_FID", "LONG"], 
                  ["ORIG_X", "DOUBLE"],
                  ["ORIG_Y", "DOUBLE"],
                  ["DEST_FID", "LONG"],
                  ["DEST_X", "DOUBLE"],
                  ["DEST_Y", "DOUBLE"],
                  ["LINK_DIST", "DOUBLE"]]
    scur_fields = ['OID@', 'SHAPE@XY']

    # set up group fields if parameter is specified
    orig_nulls = 0
    dest_nulls = 0
    if origin_group_field:
        add_fields.append(["GROUP_ID", orig_group_field_type, "", "5000"])
        scur_fields.append(origin_group_field)
        # get unique group values
        with arcpy.da.SearchCursor(origins, [origin_group_field], spatial_filter=polygon) as scur:
            origin_groups = set()
            for row in scur:
                if row[0]:
                    if isinstance(row[0], str):
                        origin_groups.add(row[0].replace("'", "''"))
                    else:
                        origin_groups.add(str(row[0]))
                else:
                    orig_nulls += 1
        with arcpy.da.SearchCursor(destinations, [dest_group_field], spatial_filter=polygon) as scur:
            destination_groups = set()
            for row in scur:
                if row[0]:
                    if isinstance(row[0], str):
                        destination_groups.add(row[0].replace("'", "''"))
                    else:
                        destination_groups.add(str(row[0]))
                else:
                    dest_nulls += 1
        # get common values between the two group fields
        origin_groups = origin_groups.intersection(destination_groups)
        if len(origin_groups):       
            # build the origin where clause to make processing faster
            if orig_group_field_type == 'TEXT':
                values_string = ", ".join(["'" + group + "'" for group in origin_groups])
            else:
                values_string = ", ".join([str(dr) for dr in origin_groups])
            origins_where_clause = f"{origin_group_field} IN ({values_string})"
        else:
            arcpy.AddIDMessage("WARNING", 3453)
            arcpy.AddIDMessage("WARNING", 117)
            raise quit()
        if orig_nulls > 0:
            arcpy.AddIDMessage("WARNING", 1086, origin_group_field)
        if dest_nulls > 0:
            arcpy.AddIDMessage("WARNING", 1086, dest_group_field)

    # add fields
    arcpy.management.AddFields(outfc, add_fields)
    out_fields = [field[0] for field in add_fields]

    # Start progressor
    count = int(arcpy.GetCount_management(origins).getOutput(0))
    arcpy.SetProgressor('step', "", 0, count, 1)

    # set up cursors
    foundone = False
    with arcpy.da.SearchCursor(origins, 
                               scur_fields, 
                               where_clause=origins_where_clause,
                               spatial_filter=polygon
                               ) as origin_scur:
        with arcpy.da.InsertCursor(outfc, ["SHAPE@"] + out_fields) as out_icur:
            # go through each row in origins
            for origin_row in origin_scur:
                origin_id = origin_row[0]
                origin_pt = origin_row[1]
                if origin_pt[0] is None or origin_pt[1] is None:
                    continue
                origin_point = arcpy.Point(origin_pt[0], origin_pt[1])

                # make where-clause for grouping
                if not origin_group_field:
                    where_clause = ""
                else:
                    origin_group_value = origin_row[2]
                    if origin_group_value is None:
                        continue
                    if dest_group_field_type == 'String':
                        str_value = origin_group_value.replace("'", "''") \
                            if isinstance(origin_group_value, str) else origin_group_value
                        where_clause = f"{dest_group_field} = '{str_value}'"
                    else:
                        where_clause = f"{dest_group_field} = {origin_group_value}"
                # destinations search cursor
                with arcpy.da.SearchCursor(destinations, 
                                           ['OID@', 'SHAPE@XY'],
                                           where_clause=where_clause,
                                           spatial_reference=origins_coord_sys,
                                           spatial_filter=polygon
                                           ) as destinations_scur:
                    # go through each row in destinations (may be filtered by group)
                    for destinations_row in destinations_scur:
                        destination_id = destinations_row[0]
                        dest_pt=destinations_row[1]
                        if dest_pt[0] is None or dest_pt[1] is None:
                            continue
                        if samedata and destination_id == origin_id:
                            continue
                        destinations_point = arcpy.Point(dest_pt[0], dest_pt[1])
                        out_line = arcpy.Polyline(arcpy.Array([origin_point,
                                                               destinations_point]),
                                                               origins_coord_sys)
                        if line_type == "GEODESIC":
                            out_line = out_line.densify("GEODESIC", 50000)
                        out_line_length = out_line.getLength(line_type, distance_unit)
                        # don't write the line if longer than search distance
                        if search_distance:
                            if out_line_length > search_distance:
                                continue
                        out_row = [out_line,
                                   origin_id,
                                   origin_point.X,
                                   origin_point.Y,
                                   destination_id,
                                   destinations_point.X,
                                   destinations_point.Y,
                                   out_line_length]
                        if origin_group_field:
                            out_row = out_row + [origin_group_value]    
                        out_icur.insertRow(out_row)
                        foundone = True
                
                # Update progress bar for each origin
                arcpy.SetProgressorPosition()

    # Keep x number of nearest features
    if num_nearest:
        arcpy.SetProgressorLabel(arcpy.GetIDMessage(84130))
        # Sort by ORIG_FID and LINK_DISTANCE ascending
        with arcpy.da.UpdateCursor(outfc, 
                                   ["ORIG_FID"], 
                                   sql_clause=(None, 'ORDER BY ORIG_FID, LINK_DIST')
                                   ) as ucur:
            i = 1
            last_id = -1
            current_counter = 1
            # continue over the nearest x, and delete the rest
            for row in ucur:
                current_id = row[0]
                if current_id > last_id:
                    current_counter = 1
                    last_id = current_id
                    if current_counter <= num_nearest:
                        current_counter += 1
                    else:
                        current_counter = 1
                    continue
                elif current_id == last_id:
                    last_id = current_id
                    if current_counter <= num_nearest:
                        current_counter += 1
                        continue
                    else:
                        ucur.deleteRow()
 
    # aggregate the output
    if aggregate:
        arcpy.SetProgressor("default", arcpy.GetIDMessage(86026))
        if sum_fields:
            try:
                sum_field_names, stats = zip(*sum_fields)
            except:
                sum_field_names = None
                sum_fields = None
            if sum_field_names:
                sum_field_names = set(sum_field_names)
                arcpy.management.JoinField(outfc, 
                                       "DEST_FID", 
                                       destinations, 
                                       desc_destinations["OIDFieldName"],
                                       list(sum_field_names))
        arcpy.analysis.PairwiseDissolve(outfc, 
                                        orig_outfc, 
                                        ["ORIG_X", "ORIG_Y", "DEST_X", "DEST_Y", "LINK_DIST"],
                                        sum_fields)
        agg_ucur_fields = ["ORIG_FID", "ORIG_X", "ORIG_Y", "DEST_FID", "DEST_X", "DEST_Y"]
        agg_newfields = [["ORIG_FID", "TEXT", "", 5000], 
                         ["DEST_FID", "TEXT", "", 5000],
                         ["LINK_COUNT", "LONG"]]
        if origin_group_field:
            agg_newfields.append(["GROUP_ID", "TEXT", "", 5000])
            agg_ucur_fields.append("GROUP_ID")
        arcpy.AddFields_management(orig_outfc, agg_newfields)
        mfl = arcpy.management.MakeFeatureLayer(outfc, "mfl")

        arcpy.SetProgressor("step", arcpy.GetIDMessage(86026), 0, 
                        int(arcpy.GetCount_management(orig_outfc).getOutput(0)), 1)
        with arcpy.da.UpdateCursor(orig_outfc, agg_ucur_fields + ["LINK_COUNT"]) as agg_ucur:
            for row in agg_ucur:
                query = """ORIG_X = {} 
                       And ORIG_Y = {} 
                       AND DEST_X = {} 
                       AND DEST_Y = {}""".format(row[1], row[2], row[4], row[5])
                origs = []
                dests = []
                groups = []
                count = 0
                with arcpy.da.SearchCursor(mfl, agg_ucur_fields, query) as agg_scur:
                    for srow in agg_scur:
                        origs.append(srow[0])
                        dests.append(srow[3])
                        if origin_group_field:
                            groups.append(srow[6])
                        count += 1
                row[0] = ", ".join(str(x) for x in set(origs))
                row[3] = ", ".join(str(x) for x in set(dests))
                row[-1] = count
                if origin_group_field:
                    row[6] = ", ".join(str(x) for x in set(groups))
                agg_ucur.updateRow(row)
                arcpy.SetProgressorPosition()

        arcpy.management.Delete(outfc)
        outfc = orig_outfc
    
    # Calculate color id for symbology
    groupfield = "ORIG_FID" if not origin_group_field else "GROUP_ID"
    codeblock = """
i = 1
groupdict = {}
def SetColorID(group):
    global i
    global groupdict
    if group not in groupdict.keys():
        groupdict[group] = i
        if i == 8:
            i = 1
        else:
            i += 1
    return groupdict[group]"""
    arcpy.management.CalculateField(outfc, "COLOR_ID", 
                                           f"SetColorID(!{groupfield}!)", 
                                           "PYTHON3", 
                                           codeblock, 
                                           "LONG")

    if not foundone:
        arcpy.AddIDMessage("WARNING", 117)

if __name__ == '__main__':
    # parameters
    origins = arcpy.GetParameterAsText(0)
    destinations = arcpy.GetParameterAsText(1)
    outfc = arcpy.GetParameterAsText(2)
    origin_group_field = arcpy.GetParameterAsText(3)
    dest_group_field = arcpy.GetParameterAsText(4)
    line_type = arcpy.GetParameterAsText(5) or "PLANAR"
    num_nearest = arcpy.GetParameter(6)
    search_distance = arcpy.GetParameter(7)
    distance_unit = arcpy.GetParameterAsText(8)    
    aggregate = arcpy.GetParameter(9)
    sum_fields = [p.split(" ") for p in arcpy.GetParameterAsText(10).split(";")]

    MakeODLinksBasic(origins,
                     destinations,
                     outfc,
                     origin_group_field,
                     dest_group_field,
                     line_type,
                     num_nearest,
                     search_distance,
                     distance_unit,                
                     aggregate,
                     sum_fields)
    layergrouped = "_grouped" if origin_group_field else ""
    layer_path = os.path.join(arcpy.GetInstallInfo()["InstallDir"], 
                                                "Resources", 
                                                "ArcToolbox", 
                                                "Templates", 
                                                "Layers",
                                                f"links{layergrouped}.lyrx")
    arcpy.SetParameterSymbology(2, layer_path)

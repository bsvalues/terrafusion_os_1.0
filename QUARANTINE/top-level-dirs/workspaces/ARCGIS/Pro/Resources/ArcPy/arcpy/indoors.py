# COPYRIGHT 2013-2024 ESRI
#
# TRADE SECRETS: ESRI PROPRIETARY AND CONFIDENTIAL
# Unpublished material - all rights reserved under the
# Copyright Laws of the United States.
#
# For additional information, contact:
# Environmental Systems Research Institute, Inc.
# Attn: Contracts Dept
# 380 New York Street
# Redlands, California, USA 92373
#
# email: contracts@esri.com
r"""The ArcGIS Indoors toolbox contains tools for adding datasets, feature
classes, tables, and configurations to host ArcGIS Indoors data in a
geodatabase."""
from __future__ import annotations

__all__ = [
    "ClassifyIndoorPathways",
    "ConfigureIndoorPositioning",
    "CreateIndoor3DDataset",
    "CreateIndoorDataset",
    "CreateIndoorNetworkDataset",
    "CreateIndoorsDatabase",
    "GenerateFacilityEntryways",
    "GenerateFloorPlanFromPointCloud",
    "GenerateFloorTransitions",
    "GenerateIndoorNetworkFeatures",
    "GenerateIndoorPathways",
    "GenerateOccupantFeatures",
    "GenerateUnitOpenings",
    "ImportBIMToIndoorDataset",
    "ImportCADToIndoorDataset",
    "ImportFeaturesToIndoorDataset",
    "ImportFloorplansToIndoorsGDB",
    "ImportIFCToIndoorDataset",
    "ImportIndoorImages",
    "ThinIndoorPathways",
    "UpdateOccupantFeatures",
    "UpgradeIndoorsDatabase",
]
__alias__ = "indoors"
from arcpy.geoprocessing._base import gptooldoc, gp, gp_fixargs
from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing import Literal
    from arcpy import RecordSet, FeatureSet
    from arcpy._mp import Layer, Table
    from arcpy.typing.gp import Result, Result1, Result2, Result3


# Tools
@gptooldoc("ConfigureIndoorPositioning_indoors", None)
def ConfigureIndoorPositioning(
    in_geodatabase=None,
    encryption_key=None,
    api_key=None,
    building_id=None,
) -> Result1[str]:
    """ConfigureIndoorPositioning_indoors(in_geodatabase, encryption_key, api_key, building_id)

       Writes indoor positioning system configuration information to an
       ArcGIS Indoors geodatabase. The values are used by ArcGIS Indoors for
       iOS and ArcGIS Indoors for Android.

    INPUTS:
     in_geodatabase (Workspace):
         The Indoors file or enterprise geodatabase for which IPS configuration
         information will be generated.
     encryption_key (String):
         The key used by the tool and Indoors mobile apps to encrypt or
         unencrypt theparameter (api_key in Python) value. API Key
     api_key (String):
         A unique value in the form of a GUID used by Indoors mobile apps to
         enable Indoo.rs indoor positioning. The API key is provided by
         Indoo.rs.
     building_id (String):
         A unique alphanumerical value used by Indoors mobile apps to link the
         site in the mobile map package to the Indoo.rs indoor positioning
         survey. The building ID is provided by Indoo.rs."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ConfigureIndoorPositioning_indoors(
                *gp_fixargs((in_geodatabase, encryption_key, api_key, building_id), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CreateIndoor3DDataset_indoors", None)
def CreateIndoor3DDataset(
    target_gdb=None,
    indoor_dataset_name=None,
    spatial_reference=None,
) -> Result1[str]:
    """CreateIndoor3DDataset_indoors(target_gdb, indoor_dataset_name, spatial_reference)

       Creates an indoor 3D dataset containing the necessary multipatch
       feature classes to maintain floor plan data using a streamlined schema
       that conforms to the ArcGIS Indoors Information Model. You can use
       these feature classes when preparing 3D scenes of floor plans and
       share them across your organization.

    INPUTS:
     target_gdb (Workspace):
         The target file or enterprise geodatabase that will contain the indoor
         3D dataset.
     indoor_dataset_name (String):
         The unique name assigned to the output indoor dataset. The default is
         Indoor3D. If a dataset with this name exists in the target
         geodatabase, the indoor 3D feature classes will be created in that
         dataset.
     spatial_reference (Spatial Reference):
         The horizontal and vertical coordinate system of the output indoor 3D
         dataset.You can specify the spatial reference in several ways
         including the
         following:Reference a feature class or feature dataset with the
         spatial
         reference you want to apply, such as
         C:/workspace/myproject.gdb/indoors/details. Define a
         SpatialReference object. You can define the spatial
         reference object using either of the following:         Factory codes,
         for example: sr = arcpy.SpatialReference(3857,
         115700)Names, for example: sr = arcpy.SpatialReference("WGS 1984 Web
         Mercator
         (auxiliary sphere)", "WGS 1984")Use the well-known text (WKT) string
         of a spatial reference. One way
         to determine the WKT for a spatial reference is to export the spatial
         reference as a string, for example, arcpy.SpatialReference(3857,
         115700).exportToString()."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CreateIndoor3DDataset_indoors(*gp_fixargs((target_gdb, indoor_dataset_name, spatial_reference), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CreateIndoorDataset_indoors", None)
def CreateIndoorDataset(
    target_gdb=None,
    indoor_dataset_name=None,
    spatial_reference=None,
    create_attribute_rules: Literal["CREATE_RULES", "NO_CREATE_RULES"] | None = None,
) -> Result1[str]:
    """CreateIndoorDataset_indoors(target_gdb, indoor_dataset_name, spatial_reference, {create_attribute_rules})

       Creates an indoor dataset containing the necessary feature classes to
       maintain floor plan data using a streamlined schema that conforms to
       the ArcGIS Indoors Information Model.

    INPUTS:
     target_gdb (Workspace):
         The target file or enterprise geodatabase that will contain the output
         indoor dataset.
     indoor_dataset_name (String):
         The unique name of the output indoor dataset. The default is Indoor.
     spatial_reference (Spatial Reference):
         The horizontal and vertical coordinate system of the output
         indoor dataset. You can specify the spatial reference in several ways,
         including the following:        Reference a feature class or feature
         dataset with the spatial
         reference you want to apply, such as
         C:/workspace/myproject.gdb/indoors/details. Define a
         SpatialReference object. You can define the spatial
         reference object using either of the following:          Factory
         codes, for example: sr = arcpy.SpatialReference(3857,
         115700)Names, for example: sr = arcpy.SpatialReference("WGS 1984 Web
         Mercator
         (auxiliary sphere)", "WGS 1984")Use the well-known text (WKT) string
         of a spatial reference. One way
         to determine the WKT for a spatial reference is to export the spatial
         reference as a string, for example, arcpy.SpatialReference(3857,
         115700).exportToString().
     create_attribute_rules {Boolean}:
         Specifies whether attribute rules and the associated fields and error
         datasets will be created in the Indoors database. These attribute
         rules include validation checks to use in quality control workflows
         for floor plan data. The target geodatabase must be a file geodatabase
         or an enterprise geodatabase configured for branch
         versioning.CREATE_RULES-Attribute rules and error layers will be
         created. This
         is the default.NO_CREATE_RULES-Attribute rules and error layers will
         not be created."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CreateIndoorDataset_indoors(
                *gp_fixargs((target_gdb, indoor_dataset_name, spatial_reference, create_attribute_rules), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CreateIndoorsDatabase_indoors", None)
def CreateIndoorsDatabase(
    target_gdb=None,
    create_network: Literal["CREATE_NETWORK", "NO_CREATE_NETWORK"] | None = None,
    spatial_reference=None,
    create_attribute_rules: Literal["CREATE_RULES", "NO_CREATE_RULES"] | None = None,
) -> Result1[str]:
    """CreateIndoorsDatabase_indoors(target_gdb, {create_network}, {spatial_reference}, {create_attribute_rules})

       Creates an Indoors geodatabase that conforms to the ArcGIS Indoors
       Information Model and contains the feature classes, fields, and tables
       required for maintaining indoor data for floor plan mapping, routing,
       space planning, and workspace reservations.

    INPUTS:
     target_gdb (Workspace):
         The geodatabase that will contain the ArcGIS Indoors Information Model
         to manage indoor GIS information for use with Indoors apps.
     create_network {Boolean}:
         Specifies whether a network dataset containing the indoor
         transportation network feature classes-Landmarks, Pathways, and Floor
         Transitions-will be created in the Indoors database.CREATE_NETWORK-A
         network dataset and feature classes will be created.
         This is the default.NO_CREATE_NETWORK-A network dataset and feature
         classes will not be
         created.
     spatial_reference {Spatial Reference}:
         The spatial reference of the output Indoors database. If no
         spatial reference is set, the output Indoors database will use WGS84
         Web Mercator (auxiliary sphere) as the horizontal coordinate system
         and WGS84 as the vertical coordinate system. You can specify the
         spatial reference in several ways, including the following:
         Reference a feature class or feature dataset with the spatial
         reference you want to apply, such as
         C:/workspace/myproject.gdb/indoors/details. Define a
         SpatialReference object. You can define the spatial
         reference object using either of the following:          Factory
         codes, for example: sr = arcpy.SpatialReference(3857,
         115700)Names, for example: sr = arcpy.SpatialReference("WGS 1984 Web
         Mercator
         (auxiliary sphere)", "WGS 1984")Use the well-known text (WKT) string
         of a spatial reference. One way
         to determine the WKT for a spatial reference is to export the spatial
         reference as a string, for example, arcpy.SpatialReference(3857,
         115700).exportToString().
     create_attribute_rules {Boolean}:
         Specifies whether attribute rules and the associated fields and error
         datasets will be created in the Indoors database. These attribute
         rules include validation checks to use in quality control workflows
         for floor plan data. The target geodatabase must be a file geodatabase
         or an enterprise geodatabase configured for branch
         versioning.CREATE_RULES-Attribute rules and error layers will be
         created. This
         is the default.NO_CREATE_RULES-Attribute rules and error layers will
         not be created."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CreateIndoorsDatabase_indoors(
                *gp_fixargs((target_gdb, create_network, spatial_reference, create_attribute_rules), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateFloorPlanFromPointCloud_indoors", None)
def GenerateFloorPlanFromPointCloud(
    in_point_cloud=None,
    out_line_features=None,
    coordinate_system=None,
    output_z_value=None,
    simplify: Literal["SIMPLIFY", "NO_SIMPLIFY"] | None = None,
    short_feature_tolerance=None,
    z_ranges=None,
    extent=None,
) -> Result1[str]:
    """GenerateFloorPlanFromPointCloud_indoors(in_point_cloud, out_line_features, {coordinate_system}, {output_z_value}, {simplify}, {short_feature_tolerance}, {z_ranges;z_ranges...}, {extent})

       Creates a polyline feature class containing 2D polyline features
       generated from input point cloud data. The output of this tool can be
       refined and used as an input when populating an Indoors workspace with
       data to assist with creating floor-aware maps and scenes.

    INPUTS:
     in_point_cloud (LAS Dataset Layer):
         The input LAS file or dataset containing point cloud data from which
         polyline features will be generated.
     coordinate_system {Spatial Reference}:
         The coordinate system of the input LAS data and the output polyline
         feature class. By default, the coordinate system that is defined in
         the LAS data for both horizontal and vertical coordinate systems will
         be used.
     output_z_value {Linear Unit}:
         The z-value that will be assigned to the generated polyline features.
         The default is 0.You can specify a value in meters or feet. The tool
         will automatically
         convert the value to use the unit of measure of the vertical
         coordinate system of the data.
     simplify {Boolean}:
         Specifies whether output polylines will be simplified during
         processing using a polyline compression algorithm to normalize
         generated polylines before removing extra vertices that are not
         necessary for retaining effective areas.SIMPLIFY-Lines will be
         simplified. This is the
         default.NO_SIMPLIFY-Lines will not be simplified.
     short_feature_tolerance {Linear Unit}:
         The tolerance in meters or international feet by which short features
         will be deleted. The default is 1 meter.Use a value of 0 to bypass
         preserving short features.
     z_ranges {Value Table}:
         One or more z-ranges of the input point cloud. Points in the specified
         z-ranges will be analyzed when generating the output polyline
         features.If no value is specified, the full range of z-values present
         in the
         input point cloud data will be used.
     extent {Extent}:
         The extent of the data that will be evaluated.MAXOF-The maximum extent
         of all inputs will be used.MINOF-The minimum
         area common to all inputs will be used.DISPLAY-The extent is equal to
         the visible display.Layer name-The extent of the specified layer will
         be used.Extent object-The extent of the specified object will be
         used.Space delimited string of coordinates-The extent of the specified
         string will be used. Coordinates are expressed in the order of x-min,
         y-min, x-max, y-max.

    OUTPUTS:
     out_line_features (Feature Class):
         The polyline feature class that will be created to store features
         generated from LAS data.If no workspace is specified, the scratch
         workspace will be used."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateFloorPlanFromPointCloud_indoors(
                *gp_fixargs(
                    (
                        in_point_cloud,
                        out_line_features,
                        coordinate_system,
                        output_z_value,
                        simplify,
                        short_feature_tolerance,
                        z_ranges,
                        extent,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateOccupantFeatures_indoors", None)
def GenerateOccupantFeatures(
    in_unit_features=None,
    unit_id_field=None,
    in_occupant_table=None,
    occupant_id_field=None,
    out_occupant_feature_class=None,
) -> Result2[str, str]:
    """GenerateOccupantFeatures_indoors(in_unit_features, unit_id_field, in_occupant_table, occupant_id_field, out_occupant_feature_class)

       Creates or updates employee or occupant point data that conforms to
       the ArcGIS Indoors Information Model.

    INPUTS:
     in_unit_features (Feature Layer):
         The input polygon features representing building spaces that may be
         occupied. In the ArcGIS Indoors Information Model, this is the Units
         layer. The centroid of each space will be used as the point location
         of the occupant or occupants.
     unit_id_field (Field):
         The field in the in_unit_features parameter values that will be used
         as the primary key to associate building spaces with records in the
         in_occupant_table parameter value.
     in_occupant_table (Table View):
         The input table that contains information about building occupants.The
         information can be stored in a geodatabase table, a sheet in an
         Excel workbook (.xls or .xlsx file), or a .csv file.
     occupant_id_field (Field):
         The field in the in_occupant_table parameter value that will be used
         as the primary key to associate occupants with in_unit_features
         parameter values.

    OUTPUTS:
     out_occupant_feature_class (Feature Class):
         The output feature class created from joining the in_unit_features and
         in_occupant_table parameter values."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateOccupantFeatures_indoors(
                *gp_fixargs(
                    (in_unit_features, unit_id_field, in_occupant_table, occupant_id_field, out_occupant_feature_class),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateUnitOpenings_indoors", None)
def GenerateUnitOpenings(
    in_unit_features=None,
    in_detail_features=None,
    door_detail_expression=None,
    wall_detail_expression=None,
    target_openings=None,
    wall_thickness_tolerance=None,
    delete_existing_openings: Literal["KEEP_EXISTING", "DELETE_EXISTING"] | None = None,
) -> Result1[str | Layer]:
    """GenerateUnitOpenings_indoors(in_unit_features, in_detail_features, door_detail_expression, wall_detail_expression, target_openings, {wall_thickness_tolerance}, {delete_existing_openings})

       Creates unit openings as line features that model the location and
       physical extent of an entrance.

    INPUTS:
     in_unit_features (Feature Layer):
         The input polygon features representing unit footprints for one or
         more facilities. In the Indoors model, this is the Units layer. The
         tool only processes the levels that contain the selected features.
     in_detail_features (Feature Layer):
         The input polyline features representing the architectural detail
         polylines.
     door_detail_expression (SQL Expression):
         An SQL expression used to identify which detail polylines represent
         doors.
     wall_detail_expression (SQL Expression):
         An SQL expression used to identify which detail polylines represent
         walls.
     target_openings (Feature Layer):
         The existing polyline feature class or feature layer to which
         generated polylines will be written. In the Indoors model this is the
         Details layer.
     wall_thickness_tolerance {Linear Unit}:
         The distance that will be searched inward and outward from the edge of
         a unit feature to find a door feature. The default unit of measurement
         is feet. The default value is 2 feet but can range from 0 to 6 feet.
     delete_existing_openings {Boolean}:
         Specifies whether existing opening features with afield value
         of Opening will be deleted before creating new opening features. If
         deleted, existing openings will be replaced with new openings if they
         are at the same location. USE_TYPEDELETE_EXISTING-Existing
         openings will be
         deleted.KEEP_EXISTING-Existing openings will not be deleted. This is
         the
         default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateUnitOpenings_indoors(
                *gp_fixargs(
                    (
                        in_unit_features,
                        in_detail_features,
                        door_detail_expression,
                        wall_detail_expression,
                        target_openings,
                        wall_thickness_tolerance,
                        delete_existing_openings,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ImportBIMToIndoorDataset_indoors", None)
def ImportBIMToIndoorDataset(
    in_bim_floorplan_layer=None,
    target_unit_features=None,
    target_detail_features=None,
    target_level_features=None,
    target_facility_features=None,
    facility_id=None,
    facility_name=None,
    ground_floor_name=None,
    floorplan_polygon_use_type_field=None,
    floors_to_import=None,
    area_unit_of_measure: Literal["SQUARE_METERS", "SQUARE_FEET"] | None = None,
    in_bim_rooms_layer=None,
    room_properties_mapping=None,
    allow_insert_new_facility: Literal["NO_ALLOW_INSERT_NEW_FACILITY", "ALLOW_INSERT_NEW_FACILITY"] | None = None,
    design_options=None,
    target_unit3d_features=None,
    target_detail3d_features=None,
    target_facility3d_features=None,
    linked_files=None,
    ground_elevation_zero: Literal["SET_GROUND_ELEVATION_ZERO", "NO_SET_GROUND_ELEVATION_ZERO"] | None = None,
) -> Result1[str | Layer]:
    """ImportBIMToIndoorDataset_indoors(in_bim_floorplan_layer, target_unit_features, target_detail_features, target_level_features, target_facility_features, facility_id, facility_name, ground_floor_name, {floorplan_polygon_use_type_field}, {floors_to_import;floors_to_import...}, {area_unit_of_measure}, {in_bim_rooms_layer;in_bim_rooms_layer...}, {room_properties_mapping}, {allow_insert_new_facility}, {design_options;design_options...}, {target_unit3d_features}, {target_detail3d_features}, {target_facility3d_features}, {linked_files;linked_files...}, {ground_elevation_zero})

       Imports features from a Revit file (.rvt) to an Indoors workspace that
       conforms to the ArcGIS Indoors Information Model. The output of this
       tool can be used to create floor-aware maps and scenes, as well as to
       generate an indoor network for routing.

    INPUTS:
     in_bim_floorplan_layer (Feature Layer / BIM File Workspace):
         The source .rvt file or Floorplan_Polygon feature layer from the
         source .rvt file that has been added to the current map.
     target_unit_features (Feature Layer):
         The target Units feature layer, feature class, or feature service that
         conforms to the Indoors model and resides in the same workspace as the
         target Facilities, Levels, and Details features.
     target_detail_features (Feature Layer):
         The target Details feature layer, feature class, or feature service
         that conforms to the Indoors model and resides in the same workspace
         as the target Facilities, Levels, and Units features.
     target_level_features (Feature Layer):
         The target Levels feature layer, feature class, or feature service
         that conforms to the Indoors model and resides in the same workspace
         as the target Facilities, Units, and Details features.
     target_facility_features (Feature Layer):
         The target Facilities feature layer, feature class, or feature service
         that conforms to the Indoors model and resides in the same workspace
         as the target Levels, Units, and Details features.
     facility_id (String):
         The unique facility ID that will be assigned to the output Indoors
         features. The facility ID cannot contain spaces.
     facility_name (String):
         The common name of the building.
     ground_floor_name (String):
         The ground floor of the building. The vertical order of the levels is
         derived from this value. Any levels with an elevation that is less
         than the specified ground floor will be assigned a negative vertical
         order.
     floorplan_polygon_use_type_field {String}:
         The field from the Rooms feature layer that will be used to
         populate thefield for the target unit features. If no field is
         provided, thefield value will be used. USE_TYPERoomName
     floors_to_import {String}:
         The floors in the input .rvt file that will be imported to the target
         features. If no floors are provided, all floors except roof elements
         will be imported.
     area_unit_of_measure {String}:
         Specifies the unit of measure that will be used for the area fields in
         the Levels and Units feature classes.SQUARE_METERS-The area unit will
         be square meters.SQUARE_FEET-The area
         unit will be square feet. This is the default.
     in_bim_rooms_layer {Feature Layer}:
         The Rooms layer from the Architectural dataset in the input
         .rvt file. This layer will be used to obtain extended field values
         that can be mapped to existing fields in the Units feature class using
         theparameter. Room Properties Mapping
     room_properties_mapping {Field Mappings}:
         Controls which attribute fields in the Units feature class will be
         populated with field values from the input .rvt Rooms layer. The
         fields must exist before running the tool. It is recommended that you
         map fields from the input .rvt Rooms layer to fields from the Units
         feature class that have the same field type.
     allow_insert_new_facility {Boolean}:
         Specifies whether a building from the input .rvt file will be imported
         if an intersection is detected between that building's floor plan and
         an existing Facilities feature in the target facility features.
         NO_ALLOW_INSERT_NEW_FACILITY-The tool checks whether the
         input BIM floor plan polygon intersects any existing facility polygon
         in the target facility features. If an intersection is detected, the
         tool checks whether the specified facility_id and facility_name
         parameter values match theandfield values of the intersecting
         Facilities feature. If the values match, the tool updates the existing
         facility. If the values do not match, the tool issues a warning
         message and stops running. This is the default.
         FACILITY_IDNAMEALLOW_INSERT_NEW_FACILITY-The tool does not check
         whether the input
         BIM floor plan polygon intersects any existing facility polygon in the
         target facility features. You can use this option to import a building
         that overlaps or touches an existing facility.
     design_options {String}:
         The Revit design options in the input .rvt file that will be included
         when importing features. If no value is specified, only the main model
         will be imported. This parameter is enabled when the input .rvt file
         includes Revit design options.
     target_unit3d_features {Feature Layer}:
         The target 3D Units feature layer, feature class, or feature service
         that conforms to the Indoors model. Multipatch unit features will be
         created in the target 3D units layer that represent the base of each
         room in the input .rvt file.
     target_detail3d_features {Feature Layer}:
         The target 3D Details feature layer, feature class, or feature service
         that conforms to the Indoors model. Multipatch detail features will be
         created in the target 3D details layer from the following categories
         in the input .rvt file: Doors, Ramps, Stairs, Stair supports, Stair
         Landings, Columns, Structural Columns, Walls, Windows, Cornices, and
         Curtain Wall Panels.
     target_facility3d_features {Feature Layer}:
         The target 3D Facilities feature layer, feature class, or feature
         service that conforms to the Indoors model. A multipatch facility
         feature will be created in the target 3Dfacilities layer from the
         ExteriorShell category in the input .rvt file.
     linked_files {String}:
         The linked Revit files that are associated with the input .rvt file of
         the same building. Selected linked files will be imported to the
         Indoors model along with the main model. If no value is specified,
         only the main model will be imported. This parameter is only enabled
         when the input .rvt file includes linked Revit files.
     ground_elevation_zero {Boolean}:
         Specifies whether the elevation of the ground floor will be set to 0
         or the elevation of the floors features in the georeferenced BIM
         model.SET_GROUND_ELEVATION_ZERO-The ground floor elevation will be set
         to 0
         and the z-values of other levels will be defined based on their
         relationship to the ground floor. This is the
         default.NO_SET_GROUND_ELEVATION_ZERO-The elevation of level features
         will
         match the elevation of the floors in the georeferenced BIM model."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ImportBIMToIndoorDataset_indoors(
                *gp_fixargs(
                    (
                        in_bim_floorplan_layer,
                        target_unit_features,
                        target_detail_features,
                        target_level_features,
                        target_facility_features,
                        facility_id,
                        facility_name,
                        ground_floor_name,
                        floorplan_polygon_use_type_field,
                        floors_to_import,
                        area_unit_of_measure,
                        in_bim_rooms_layer,
                        room_properties_mapping,
                        allow_insert_new_facility,
                        design_options,
                        target_unit3d_features,
                        target_detail3d_features,
                        target_facility3d_features,
                        linked_files,
                        ground_elevation_zero,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ImportCADToIndoorDataset_indoors", None)
def ImportCADToIndoorDataset(
    input_cad_datasets=None,
    target_level_features=None,
    level_name=None,
    vertical_order=None,
    level_elevation=None,
    target_facility_features=None,
    facility_name=None,
    target_unit_features=None,
    target_detail_features=None,
    allow_layers_from_cad: Literal["ALLOW_LAYERS_FROM_CAD", "NO_ALLOW_LAYERS_FROM_CAD"] | None = None,
    input_unit_layers_cad=None,
    input_unit_feature_layers=None,
    input_level_layers_cad=None,
    input_level_feature_layers=None,
    input_door_layers_cad=None,
    input_door_feature_layers=None,
    input_detail_layers_cad=None,
    input_detail_feature_layers=None,
    input_facility_layers_cad=None,
    input_facility_feature_layers=None,
    cad_annotation_mapping=None,
    door_close_buffer=None,
    input_unit_minimum_width=None,
    input_unit_minimum_area=None,
    floor_plan_config_file=None,
    input_gap_tolerance=None,
) -> Result1[str | Layer]:
    """ImportCADToIndoorDataset_indoors(input_cad_datasets;input_cad_datasets..., target_level_features, level_name, vertical_order, level_elevation, target_facility_features, facility_name, target_unit_features, target_detail_features, {allow_layers_from_cad}, {input_unit_layers_cad;input_unit_layers_cad...}, {input_unit_feature_layers;input_unit_feature_layers...}, {input_level_layers_cad;input_level_layers_cad...}, {input_level_feature_layers;input_level_feature_layers...}, {input_door_layers_cad;input_door_layers_cad...}, {input_door_feature_layers;input_door_feature_layers...}, {input_detail_layers_cad;input_detail_layers_cad...}, {input_detail_feature_layers;input_detail_feature_layers...}, {input_facility_layers_cad;input_facility_layers_cad...}, {input_facility_feature_layers;input_facility_feature_layers...}, {cad_annotation_mapping;cad_annotation_mapping...}, {door_close_buffer}, {input_unit_minimum_width}, {input_unit_minimum_area}, {floor_plan_config_file}, {input_gap_tolerance})

       Imports features from CAD files to an indoor dataset that conforms to
       the ArcGIS Indoors Information Model. The output of this tool can be
       used to create floor-aware maps and scenes, as well as to generate an
       indoor network for routing.

    INPUTS:
     input_cad_datasets (CAD Drawing Dataset):
         The .dwg or .dgn files that contain floor plan information that will
         be imported to the Indoors model.
     target_level_features (Feature Layer):
         The target Levels feature layer, feature class, or feature service
         that conforms to the Indoors model and resides in the same workspace
         as the target Facilities, Units, and Details features.
     level_name (String):
         The unique level name of the level on which the source CAD data is
         located.
     vertical_order (Long):
         An ordinal integer representing the vertical order of each floor. The
         vertical order of the ground floor is zero (0). Floors above the
         ground floor have positive vertical order values, and floors below the
         ground floor have negative values.
     level_elevation (Linear Unit):
         The elevation of the level relative to a flat terrain. This value will
         be used to populate the z-value for levels, units, and details.
     target_facility_features (Feature Layer):
         The target Facilities feature layer, feature class, or feature service
         that conforms to the Indoors model and resides in the same workspace
         as the target Levels, Units, and Details features.
     facility_name (String):
         The unique facility name of the building where the source CAD data is
         located.
     target_unit_features (Feature Layer):
         The target Units feature layer, feature class, or feature service that
         conforms to the Indoors model and resides in the same workspace as the
         target Facilities, Levels, and Details features.
     target_detail_features (Feature Layer):
         The target Details feature layer, feature class, or feature service
         that conforms to the Indoors model and resides in the same workspace
         as the target Facilities, Levels, and Units features.
     allow_layers_from_cad {Boolean}:
         Specifies whether polylines that represent unit boundaries will be
         sourced from CAD files or from map feature layers. If you specify to
         source from map feature layers, you can make a selection on the layer
         to import a subset of features.ALLOW_LAYERS_FROM_CAD-Polylines that
         represent unit boundaries will be
         sourced directly from the CAD files. This is the
         default.NO_ALLOW_LAYERS_FROM_CAD-Polylines that represent unit
         boundaries will
         be sourced from map feature layers.
     input_unit_layers_cad {String}:
         The CAD layers that contain polyline entities that define the edges
         and extent of the usable spaces within a facility. These polylines
         will be used to create unit polygon features in the target Units
         layer.
     input_unit_feature_layers {Feature Layer}:
         The feature layers that contain polyline entities that define the
         edges and extent of the usable spaces within a facility. These
         polylines will be used to create unit polygon features in the target
         Units layer.
     input_level_layers_cad {String}:
         The CAD layers that contain polyline entities that define the edges
         and extent of the level. These polylines will be used to create unit
         polygon features in the target Levels layer.
     input_level_feature_layers {Feature Layer}:
         The feature layers that contain polyline entities that define the
         edges and extent of the level. These polylines will be used to create
         unit polygon features in the target Levels layer.
     input_door_layers_cad {String}:
         The CAD layers that contain polyline entities that define the doors
         that are part of a unit boundary. These polylines will be closed to
         create unit polygon features in the target Units layer.
     input_door_feature_layers {Feature Layer}:
         The feature layers that contain polyline entities that define the
         doors that are part of a unit boundary. These polylines will be closed
         to create unit polygon features in the target Units layer.
     input_detail_layers_cad {String}:
         The CAD layers that contain polyline entities that represent floor-
         plan details-such as walls, windows, and doors-that will be included
         as polyline features in the target Details layer.
     input_detail_feature_layers {Feature Layer}:
         The feature layers that contain polyline entities that represent
         floor-plan details-such as walls, windows, and doors-that will be
         included as polyline features in the target Details layer.
     input_facility_layers_cad {String}:
         The CAD layers that contain polyline entities that define the edges
         and extent of the facility footprint. If no value is provided, the
         facility footprint will be created or updated based on the extent of
         all levels within the facility.
     input_facility_feature_layers {Feature Layer}:
         The feature layers that contain polyline entities that define the
         edges and extent of the facility footprint. If no value is provided,
         the facility footprint will be created or updated based on the extent
         of all levels within the facility.
     cad_annotation_mapping {Value Table}:
         Specifies the field mapping for CAD annotation features to
         populate a field of a layer in the Indoors workspace. Target
         Indoor Layer-The layer in the Indoors workspace to which you
         want to map annotation. The tool supports mapping to the layer
         provided for the Target Facilities, Target Levels, and Target Units
         parameters.Target Field-The field in the target layer to which you
         want to map
         annotation. The field must already exist.Type-The type of the
         annotation you want to map. Text, Block, and
         Handle types are supported.Source CAD Layer-The CAD layer that
         contains the annotation that will
         be mapped.Block Attribute-For annotation that has the block type,
         provide the
         block attribute that contains the information to map.Delimiter-For
         annotation stored in a delimited string, provide the
         delimiting character.Position-For annotation stored in a delimited
         string, provide the
         position of the value to map.
     door_close_buffer {Linear Unit}:
         The distance the tool will search from a door feature for a unit
         boundary in international inches or millimeters. The parameter value
         must include a numeric value and a unit of measure. The default is 0.3
         international inches.
     input_unit_minimum_width {Linear Unit}:
         The minimum width in international feet or meters that a space must be
         to be considered a unit feature. Features with a width that falls
         below this threshold will be written to a nonunit polygons feature
         class and will not be included in the target Units layer. The
         parameter value must include a numeric value and a unit of measure.
         The default is 3 international feet.
     input_unit_minimum_area {Areal Unit}:
         The minimum area in square international feet or square meters a space
         must be to be considered a unit feature. Features with an area that
         falls below this threshold will be written to a nonunit polygons
         feature class and will not be included in the target Units layer. The
         parameter value must include a numeric value and a unit of measure.
         The default is 9 square international feet.
     floor_plan_config_file {File}:
         A JSON configuration file containing preset parameter values. Provide
         the configuration file from a previous tool run to populate parameters
         in the tool for CAD files with the same or similar CAD layers and
         mappings.When a configuration file is provided, changes can be made to
         the
         other parameter values before running the tool. If other parameter
         changes are made, a new output configuration file will be created.This
         parameter is only available when the allow_layers_from_cad
         parameter is checked.
     input_gap_tolerance {Linear Unit}:
         The proximity tolerance for dangling endpoints of input features that
         will be snapped together when generating units. Values can be provided
         in millimeters or international inches. The default is 0.039
         international inches (1 millimeter)."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ImportCADToIndoorDataset_indoors(
                *gp_fixargs(
                    (
                        input_cad_datasets,
                        target_level_features,
                        level_name,
                        vertical_order,
                        level_elevation,
                        target_facility_features,
                        facility_name,
                        target_unit_features,
                        target_detail_features,
                        allow_layers_from_cad,
                        input_unit_layers_cad,
                        input_unit_feature_layers,
                        input_level_layers_cad,
                        input_level_feature_layers,
                        input_door_layers_cad,
                        input_door_feature_layers,
                        input_detail_layers_cad,
                        input_detail_feature_layers,
                        input_facility_layers_cad,
                        input_facility_feature_layers,
                        cad_annotation_mapping,
                        door_close_buffer,
                        input_unit_minimum_width,
                        input_unit_minimum_area,
                        floor_plan_config_file,
                        input_gap_tolerance,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ImportFeaturesToIndoorDataset_indoors", None)
def ImportFeaturesToIndoorDataset(
    in_features=None,
    target_facility_features=None,
    target_level_features=None,
    target_unit_features=None,
    facility_name=None,
    level_name=None,
    vertical_order=None,
    target_detail_features=None,
    input_gap_tolerance=None,
    input_unit_minimum_width=None,
    input_unit_minimum_area=None,
) -> Result:
    """ImportFeaturesToIndoorDataset_indoors(in_features, target_facility_features, target_level_features, target_unit_features, facility_name, level_name, vertical_order, {target_detail_features}, {input_gap_tolerance}, {input_unit_minimum_width}, {input_unit_minimum_area})

       Accepts polyline features representing floor plan elements (such as
       walls, doors, and windows) as input and uses them to generate features
       in an Indoors workspace that conforms to the ArcGIS Indoors
       Information Model. The output of this tool can be used to create
       floor-aware maps.

    INPUTS:
     in_features (Feature Layer):
         The input polyline feature layer or feature class containing unit
         boundary data that will be imported into the Indoors workspace.
     target_facility_features (Feature Layer):
         The Facilities feature layer or feature class in the Indoors workspace
         that will be updated with imported features.
     target_level_features (Feature Layer):
         The Levels feature layer or feature class in the Indoors workspace
         that will be updated with imported features.
     target_unit_features (Feature Layer):
         The Units feature layer or feature class in the Indoors workspace that
         will be updated with imported features.
     facility_name (String):
         The name of the facility to which features will be imported.An
         existing facility name can be selected from the target Facilities
         layer, or a new facility name can be provided.
     level_name (String):
         The name of the level feature that will be created.An existing value
         can be selected from the target Levels layer, or a
         new value can be provided.
     vertical_order (Long):
         An ordinal integer representing the vertical order of each floor. The
         vertical order of the ground floor is zero (0). Floors above the
         ground floor have positive vertical order values, and floors below the
         ground floor have negative values.
     target_detail_features {Feature Layer}:
         The Details feature layer or feature class in the Indoors workspace to
         which features will be imported.
     input_gap_tolerance {Linear Unit}:
         The proximity tolerance for dangling endpoints of input features that
         will be snapped together. Values can be provided in millimeters or
         international inches. The default is 0.039 international inches.
     input_unit_minimum_width {Linear Unit}:
         The minimum width a polygon must be to be created as a unit in the
         target Units layer. Values can be provided in square meters or square
         international feet. The default is 3 international feet.
     input_unit_minimum_area {Areal Unit}:
         The minimum area a polygon must be to be created as a unit in the
         target Units layer. Values can be provided in square meters or square
         international feet. The default is 9 square feet."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ImportFeaturesToIndoorDataset_indoors(
                *gp_fixargs(
                    (
                        in_features,
                        target_facility_features,
                        target_level_features,
                        target_unit_features,
                        facility_name,
                        level_name,
                        vertical_order,
                        target_detail_features,
                        input_gap_tolerance,
                        input_unit_minimum_width,
                        input_unit_minimum_area,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ImportFloorplansToIndoorsGDB_indoors", None)
def ImportFloorplansToIndoorsGDB(
    target_unit_features=None,
    target_detail_features=None,
    target_level_features=None,
    target_facility_features=None,
    in_excel_template=None,
    uniqueid_delimiter: Literal["PERIOD", "HYPHEN", "UNDERSCORE"] | None = None,
    sliver_threshold: Literal["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] | None = None,
    door_close_buffer: Literal["0", "0.5", "1", "1.5", "2", "2.5", "3", "3.5", "4", "4.5", "5", "5.5", "6"]
    | None = None,
    area_unit_of_measure: Literal["SQUARE_FEET", "SQUARE_METERS"] | None = None,
    measurement_mode: Literal["GEODESIC", "PLANAR"] | None = None,
    target_section_features=None,
    target_zone_features=None,
) -> Result1[str | Layer]:
    """ImportFloorplansToIndoorsGDB_indoors(target_unit_features, target_detail_features, target_level_features, target_facility_features, in_excel_template, uniqueid_delimiter, {sliver_threshold}, {door_close_buffer}, {area_unit_of_measure}, {measurement_mode}, {target_section_features}, {target_zone_features})

       Imports floor plans from CAD files into an Indoors workspace that
       conforms to the ArcGIS Indoors Information Model. The output of this
       tool can be used to create floor-aware maps and scenes for use in
       floor-aware apps, as well as to generate an indoor network for
       routing.

    INPUTS:
     target_unit_features (Feature Layer):
         The target Units feature layer, feature class, or feature service that
         conforms to the ArcGIS Indoors Information Model and resides in the
         same workspace as the target Facilities, Levels, and Details features.
     target_detail_features (Feature Layer):
         The target Details feature layer, feature class, or feature service
         that conforms to the ArcGIS Indoors Information Model and resides in
         the same workspace as the target Facilities, Levels, and Units
         features.
     target_level_features (Feature Layer):
         The target Levels feature layer, feature class, or feature service
         that conforms to the ArcGIS Indoors Information Model and resides in
         the same workspace as the target Facilities, Units, and Details
         features.
     target_facility_features (Feature Layer):
         The target Facilities feature layer, feature class, or feature service
         that conforms to the ArcGIS Indoors Information Model and resides in
         the same workspace as the target Levels, Units, and Details features.
     in_excel_template (File):
         An Excel spreadsheet (.xls or .xlsx file) that contains input and
         configuration parameters.
     uniqueid_delimiter (String):
         Specifies the delimiter that will separate key values in the Indoors
         model hierarchy.PERIOD-The ID will include key values separated by
         periods. This is
         default.HYPHEN-The ID will include key values separated by
         hyphens.UNDERSCORE-The ID will include key values separated by
         underscores.
     sliver_threshold {Long}:
         The ratio of perimeter to area that defines a sliver polygon. It is
         used when importing Unit polygons to improve the quality of the
         imported data. Unit polygons that are determined to be slivers are
         placed in a review geodatabase located in the scratch folder of the
         ArcGIS Pro project. The default is 2.
     door_close_buffer {Double}:
         The distance, in inches, that will be searched from a door to find and
         snap to the nearest wall. This parameter is used when the CLOSE_DOORS
         column is set to Y in the input Excel template file. The default is 0.
     area_unit_of_measure {String}:
         Specifies the unit of measure that will be used to calculate area for
         the area fields when importing floor plans.SQUARE_FEET-Area will be
         defined in square feet. This is
         default.SQUARE_METERS-Area will be defined in square meters.
     measurement_mode {String}:
         Specifies the measurement mode that will be used to calculate the area
         fields when importing floor plans.GEODESIC-Area will be calculated
         using geodesic distance. Geodesic
         distance is calculated in a 3D spherical space as the distance across
         the curved surface of the world. This is default.PLANAR-Area will be
         calculated using planar distance. Planar distance
         is straight-line Euclidean distance calculated in a 2D Cartesian
         coordinate system.
     target_section_features {Feature Layer}:
         The target Sections feature layer, feature class, or feature service
         that conforms to the ArcGIS Indoors Information Model and resides in
         the same workspace as the target Facilities, Levels, Units, and
         Details features.
     target_zone_features {Feature Layer}:
         The target Zones feature layer, feature class, or feature service that
         conforms to the ArcGIS Indoors Information Model and resides in the
         same workspace as the target Facilities, Levels, Units, and Details
         features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ImportFloorplansToIndoorsGDB_indoors(
                *gp_fixargs(
                    (
                        target_unit_features,
                        target_detail_features,
                        target_level_features,
                        target_facility_features,
                        in_excel_template,
                        uniqueid_delimiter,
                        sliver_threshold,
                        door_close_buffer,
                        area_unit_of_measure,
                        measurement_mode,
                        target_section_features,
                        target_zone_features,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ImportIFCToIndoorDataset_indoors", None)
def ImportIFCToIndoorDataset(
    in_bim_file_workspace=None,
    target_facility_features=None,
    facility_name=None,
    target_level_features=None,
    target_unit_features=None,
    target_detail_features=None,
    ground_floor_name=None,
    unit_properties_mapping=None,
    load_floorplan_layers: Literal["NO_LOAD_FROM_FLOORPLAN_LAYERS", "LOAD_FROM_FLOORPLAN_LAYERS"] | None = None,
    in_floorplan_footprint=None,
    in_floorplan_polygon=None,
    in_floorplan_polyline=None,
    target_unit3d_features=None,
    target_detail3d_features=None,
    target_facility3d_features=None,
    load_roofs: Literal["NO_LOAD_ROOFS", "LOAD_ROOFS"] | None = None,
    ground_elevation_zero: Literal["SET_GROUND_ELEVATION_ZERO", "NO_SET_GROUND_ELEVATION_ZERO"] | None = None,
) -> Result:
    """ImportIFCToIndoorDataset_indoors(in_bim_file_workspace, target_facility_features, facility_name, target_level_features, target_unit_features, target_detail_features, ground_floor_name, {unit_properties_mapping}, {load_floorplan_layers}, {in_floorplan_footprint}, {in_floorplan_polygon}, {in_floorplan_polyline}, {target_unit3d_features}, {target_detail3d_features}, {target_facility3d_features}, {load_roofs}, {ground_elevation_zero})

       Imports features from an .ifc file to an indoor dataset that conforms
       to the ArcGIS Indoors Information Model. The output of this tool can
       be used to create floor-aware maps and scenes, as well as to generate
       an indoor network for routing.

    INPUTS:
     in_bim_file_workspace (BIM File Workspace):
         The input IFC workspace.
     target_facility_features (Feature Layer):
         The target Facilities feature layer, feature class, or feature service
         that conforms to the Indoors model and resides in the same workspace
         as the target Levels, Units, and Details features.
     facility_name (String):
         The common name of the building. If a feature with the same name
         exists in the target Facilities layer, it will be updated, along with
         all of the associated Levels, Units, and Details features.
     target_level_features (Feature Layer):
         The target Levels feature layer, feature class, or feature service
         that conforms to the Indoors model and resides in the same workspace
         as the target Facilities, Units, and Details features.
     target_unit_features (Feature Layer):
         The target Units feature layer, feature class, or feature service that
         conforms to the Indoors model and resides in the same workspace as the
         target Facilities, Levels, and Details features.
     target_detail_features (Feature Layer):
         The target Details feature layer, feature class, or feature service
         that conforms to the Indoors model and resides in the same workspace
         as the target Facilities, Levels, and Units features.
     ground_floor_name (String):
         The ground floor of the building. The vertical order of the levels is
         derived from this value. Any levels with an elevation that is less
         than the specified ground floor will be assigned a negative vertical
         order.
     unit_properties_mapping {Field Mappings}:
         Controls which attribute fields in the Units layer will be populated
         with field values from the input IFC Spaces layer. The fields must
         exist before running the tool. It is recommended that you map fields
         from the input IFC Spaces layer to fields from the Units layer that
         have the same field type.
     load_floorplan_layers {Boolean}:
         Specifies whether features will be loaded from input floor plan layers
         created by the Extract BIM File Floorplan
         tool.LOAD_FROM_FLOORPLAN_LAYERS-Features will be loaded from the input
         floor plan layers created by the Extract BIM File Floorplan tool. Any
         selections set on the input layers will be
         honored.NO_LOAD_FROM_FLOORPLAN_LAYERS-Features will be loaded from the
         .ifc
         file. All levels will be loaded and no selections will be honored.
         This is the default.
     in_floorplan_footprint {Feature Layer}:
         The Floorplan Footprint feature layer created using the Extract BIM
         File Floorplan tool. Features in this layer will be used to create
         features in the target Facilities layer.
     in_floorplan_polygon {Feature Layer}:
         The Floorplan Polygon feature layer created using the Extract BIM File
         Floorplan tool. Features in this layer will be used to create features
         in the target Levels and Units layers.
     in_floorplan_polyline {Feature Layer}:
         The Floorplan Polyline feature layer created using the Extract BIM
         File Floorplan tool. Features in this layer will be used to create
         features in the target Details layer.
     target_unit3d_features {Feature Layer}:
         The target Units3D feature layer, feature class, or feature service
         that conforms to the Indoors model. Multipatch unit features will be
         created in the target Units3D layer from the Spaces category of the
         input .ifc file.
     target_detail3d_features {Feature Layer}:
         The target Details3D feature layer, feature class, or feature service
         that conforms to the Indoors model. Multipatch detail features will be
         created in the target Details3D layer from the following categories in
         the input .ifc file: Doors, Columns, Walls, Ramps, Stairs, Windows,
         Curtain Walls, and Structural Columns.
     target_facility3d_features {Feature Layer}:
         The target 3D Facilities feature layer, feature class, or feature
         service that conforms to the Indoors model. A multipatch facility
         feature will be created in the target Facilities3D layer from the
         ExteriorShell category in the input .ifc file.
     load_roofs {Boolean}:
         Specifies whether roof features will be imported as levels
         features.LOAD_ROOFS-Roof elements will be imported from the input .ifc
         file and
         used along with floors features to create levels features in the
         Indoors workspace.NO_LOAD_ROOFS-Roof features will not be imported
         from the input .ifc
         file. This is the default.
     ground_elevation_zero {Boolean}:
         Specifies whether the elevation of the ground floor will be set to 0
         or the elevation of the floors features in the georeferenced BIM model
         will be used.SET_GROUND_ELEVATION_ZERO-The ground floor elevation will
         be set to 0
         and the z-values of other levels will be defined based on their
         relationship to the ground floor. This is the
         default.NO_SET_GROUND_ELEVATION_ZERO-The elevation of level features
         will
         match the elevation of the floors in the georeferenced BIM model."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ImportIFCToIndoorDataset_indoors(
                *gp_fixargs(
                    (
                        in_bim_file_workspace,
                        target_facility_features,
                        facility_name,
                        target_level_features,
                        target_unit_features,
                        target_detail_features,
                        ground_floor_name,
                        unit_properties_mapping,
                        load_floorplan_layers,
                        in_floorplan_footprint,
                        in_floorplan_polygon,
                        in_floorplan_polyline,
                        target_unit3d_features,
                        target_detail3d_features,
                        target_facility3d_features,
                        load_roofs,
                        ground_elevation_zero,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ImportIndoorImages_indoors", None)
def ImportIndoorImages(
    in_data=None,
    in_level_features=None,
    target_image_folder=None,
    target_oriented_imagery=None,
    in_coordinate_system=None,
    elevation_adjustment=None,
    horizontal_field_of_view=None,
    vertical_field_of_view=None,
) -> Result1[str | Layer]:
    """ImportIndoorImages_indoors(in_data, in_level_features, target_image_folder, target_oriented_imagery, {in_coordinate_system}, {elevation_adjustment}, {horizontal_field_of_view}, {vertical_field_of_view})

       Imports 360-degree and panoramic images from an .e57 file to an
       oriented imagery dataset. The output of this tool can be added to
       floor-aware maps and scenes in ArcGIS Pro.

    INPUTS:
     in_data (File):
         The .e57 file containing the target oriented imagery file that will be
         imported.
     in_level_features (Feature Layer):
         The associated Levels layer from the ArcGIS Indoors Information Model
         that resides in the same workspace as the target images layer.
     target_image_folder (Folder):
         The existing folder where the imagery files will be written.
     target_oriented_imagery (Oriented Imagery Layer):
         The target oriented imagery layer to which features will be added.
     in_coordinate_system {Spatial Reference}:
         The spatial reference of the input image file. A coordinate system can
         be selected if none are specified in the input data file.
     elevation_adjustment {Linear Unit}:
         The value by which the z-values of imported images will be adjusted.
         If the imported images are reprojected, the adjustment will be applied
         after projection. The default value is 0 meters.A value of -300 feet
         reduces the z-value of imported images by 300
         feet.A value of 250 meters increases the z-value of imported images by
         250
         meters.
     horizontal_field_of_view {Double}:
         The effective width of the field of view of imported images, in
         degrees. Valid values range from 0 to 360. The default value is 360.
     vertical_field_of_view {Double}:
         The effective height of the field of view of imported images, in
         degrees. Valid values range from 0 to 180. The default value is 180."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ImportIndoorImages_indoors(
                *gp_fixargs(
                    (
                        in_data,
                        in_level_features,
                        target_image_folder,
                        target_oriented_imagery,
                        in_coordinate_system,
                        elevation_adjustment,
                        horizontal_field_of_view,
                        vertical_field_of_view,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("UpdateOccupantFeatures_indoors", None)
def UpdateOccupantFeatures(
    target_occupant_features=None,
    in_unit_features=None,
    in_occupant_table=None,
    occupant_id_from_target_occupant_features=None,
    occupant_id_from_input_table=None,
    unit_id_from_units_features=None,
    unit_id_from_input_table=None,
    occupant_attributes_mapping=None,
    allow_insert: Literal["INSERT_OCCUPANTS", "NO_INSERT_OCCUPANTS"] | None = None,
    allow_delete: Literal["DELETE_OCCUPANTS", "NO_DELETE_OCCUPANTS"] | None = None,
    home_office_identifier=None,
) -> Result1[str | Layer]:
    """UpdateOccupantFeatures_indoors(target_occupant_features, {in_unit_features}, {in_occupant_table}, {occupant_id_from_target_occupant_features}, {occupant_id_from_input_table}, {unit_id_from_units_features}, {unit_id_from_input_table;unit_id_from_input_table...}, {occupant_attributes_mapping}, {allow_insert}, {allow_delete}, {home_office_identifier})

       Updates the Occupants feature class that conforms to the ArcGIS
       Indoors Information Model.

    INPUTS:
     target_occupant_features (Feature Layer):
         The target feature layer, feature class, or feature service to which
         occupant records will be added, updated, or deleted. The input must
         contain unique values that identify each occupant and must conform to
         the Occupants feature class in the Indoors model.
     in_unit_features {Feature Layer}:
         The input polygon features representing building spaces that may be
         occupied. The input must be a feature layer, feature class, or feature
         service that conforms to the Units feature class in the Indoors model.
         The centroid of each space will be used as the point location of the
         occupant or occupants.
     in_occupant_table {Table View}:
         The input table that contains information about building occupants.The
         input table must be a geodatabase table, a sheet in a Microsoft
         Excel workbook (.xls or .xlsx file), a comma-delimited text file
         (.csv), or an OLE DB table.
     occupant_id_from_target_occupant_features {Field}:
         The field in the target_occupant_features parameter value that will be
         used as the primary key to associate occupants with the
         in_occupant_table parameter values. The field values must be unique.
     occupant_id_from_input_table {Field}:
         The field in the in_occupant_table parameter value that will be used
         as the primary key to associate occupants with the
         target_occupant_features parameter values. The field values must be
         unique.
     unit_id_from_units_features {Field}:
         The field in the in_unit_features parameter value that stores the
         unique space identification information that will match the unit
         identifier from the in_occupant_table parameter value. The field
         values must be unique.
     unit_id_from_input_table {Field}:
         The field or fields in the in_occupant_table parameter value that will
         be used as the primary key to associate occupant space assignment with
         the in_unit_features parameter value. If a field value is empty, the
         occupant will be loaded as unassigned.This parameter supports multiple
         fields from an input occupant table
         that stores more than one space assignment of an occupant. Only the
         fields provided will be used to update the Occupants feature class.If
         no parameter value is provided, the occupant's seating assignments
         will not be updated in the Occupants feature class. Instead, the
         records in the Occupants feature class will be matched to records in
         the input occupant table, and attributes mapped in the
         occupant_attributes_mapping parameter will be updated.
     occupant_attributes_mapping {Field Mappings}:
         The attribute fields in the target_occupant_features parameter value
         that will be populated with field values from the in_occupant_table
         parameter value. The fields must exist in the target_occupant_features
         parameter value before running the tool. It is recommended that you
         map fields from the in_occupant_table parameter value to fields from
         the target_occupant_features parameter value that have the same field
         type.
     allow_insert {Boolean}:
         Specifies whether unmatched occupant records for the in_occupant_table
         parameter value will be added to the target occupant features
         layer.INSERT_OCCUPANTS-Unmatched occupant records will be added to the
         target occupant features layer. This is the
         default.NO_INSERT_OCCUPANTS-Unmatched occupant records will not be
         added to
         the target occupant features layer.
     allow_delete {Boolean}:
         Specifies whether unmatched occupant records for the in_occupant_table
         parameter value will be deleted from the target occupant features
         layer.DELETE_OCCUPANTS-Unmatched occupant records will be deleted from
         the
         target occupant features layer. This is the
         default.NO_DELETE_OCCUPANTS-Unmatched occupant records will not be
         deleted
         from the target occupant features layer.
     home_office_identifier {SQL Expression}:
         A SQL query that defines the field and field value from the input
         occupant table that indicates an occupant is assigned to a home
         office."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.UpdateOccupantFeatures_indoors(
                *gp_fixargs(
                    (
                        target_occupant_features,
                        in_unit_features,
                        in_occupant_table,
                        occupant_id_from_target_occupant_features,
                        occupant_id_from_input_table,
                        unit_id_from_units_features,
                        unit_id_from_input_table,
                        occupant_attributes_mapping,
                        allow_insert,
                        allow_delete,
                        home_office_identifier,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("UpgradeIndoorsDatabase_indoors", None)
def UpgradeIndoorsDatabase(
    in_workspace=None,
    upgrade_attribute_rules: Literal["UPGRADE_ATTRIBUTE_RULES", "NO_UPGRADE_ATTRIBUTE_RULES"] | None = None,
    upgrade_indoors_database: Literal["UPGRADE_DATABASE", "GENERATE_REPORT"] | None = None,
) -> Result1[str]:
    """UpgradeIndoorsDatabase_indoors(in_workspace, {upgrade_attribute_rules}, {upgrade_indoors_database})

       Upgrades an existing Indoors workspace by creating or updating schema
       items to conform to the latest ArcGIS Indoors Information Model
       schema.

    INPUTS:
     in_workspace (Workspace):
         The existing geodatabase that contains Indoors model schema items
         created by the Create Indoors Database or Create Indoors Dataset
         tools. This parameter accepts a file geodatabase or an enterprise
         geodatabase.
     upgrade_attribute_rules {Boolean}:
         Specifies whether validation attribute rules will be created or
         updated for use in Indoors quality control workflows. If the input
         Indoors database is an enterprise geodatabase, branch versioning must
         be enabled.UPGRADE_ATTRIBUTE_RULES-Validation attribute rules will be
         created or
         updated if there are existing Indoors attribute rules in the input
         database. This is the default.NO_UPGRADE_ATTRIBUTE_RULES-Validation
         attribute rules will not be
         created or updated.
     upgrade_indoors_database {String}:
         Specifies whether the input Indoors database will be upgraded with
         schema changes or a report will be generated with potential schema
         changes that will be made to the input Indoors
         database.UPGRADE_DATABASE-The input Indoors database will be upgraded.
         This is
         the default.GENERATE_REPORT-A text file report will be generated with
         a list of
         schema changes that will be made to the input Indoors database during
         the upgrade process and any issues that would result in the schema not
         being updated. The input Indoors database will not be upgraded."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.UpgradeIndoorsDatabase_indoors(
                *gp_fixargs((in_workspace, upgrade_attribute_rules, upgrade_indoors_database), True)
            )
        )
        return retval
    except Exception as e:
        raise e


# Indoors Network toolset
@gptooldoc("ClassifyIndoorPathways_indoors", None)
def ClassifyIndoorPathways(
    in_unit_features=None,
    target_pathways=None,
) -> Result1[str]:
    """ClassifyIndoorPathways_indoors(in_unit_features, target_pathways)

       Classifies pathways that pass through selected unit spaces, such as
       conference rooms or service areas, as lower priority.

    INPUTS:
     in_unit_features (Feature Layer):
         The input polygon features representing spaces in a building
         for which theparameter values will be classified. In the ArcGIS
         Indoors Information Model, this is the Units layer. Select features in
         the units layer before running the tool. Target Pathways
     target_pathways (Feature Layer):
         The existing feature class or feature layer in which pathways will be
         updated. In the Indoors model, this is the Pathways layer."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ClassifyIndoorPathways_indoors(*gp_fixargs((in_unit_features, target_pathways), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CreateIndoorNetworkDataset_indoors", None)
def CreateIndoorNetworkDataset(
    target_gdb=None,
    indoor_network_dataset_name=None,
    spatial_reference=None,
) -> Result1[str]:
    """CreateIndoorNetworkDataset_indoors(target_gdb, indoor_network_dataset_name, spatial_reference)

       Creates an indoor network dataset containing the necessary feature
       classes to maintain indoor network data using a streamlined schema
       that conforms to the ArcGIS Indoors Information Model. The indoor
       network dataset can be used to support indoor routable networks.

    INPUTS:
     target_gdb (Workspace):
         The target file or enterprise geodatabase that will contain the output
         indoor network dataset.
     indoor_network_dataset_name (String):
         The unique name of the output indoor network dataset. This name is
         also used for the preliminary indoor network dataset. The default name
         for the indoor network dataset is IndoorNetwork. The default name for
         the preliminary indoor network dataset is PrelimIndoorNetwork.
     spatial_reference (Spatial Reference):
         The spatial reference of the output indoor network dataset.
         You can specify the spatial reference in several ways, including the
         following:        Reference a feature class or feature dataset with
         the spatial
         reference you want to apply, such as
         C:/workspace/myproject.gdb/indoors/details. Define a
         SpatialReference object. You can define the spatial
         reference object using either of the following:          Factory
         codes, for example: sr = arcpy.SpatialReference(3857,
         115700)Names, for example: sr = arcpy.SpatialReference("WGS 1984 Web
         Mercator
         (auxiliary sphere)", "WGS 1984")Use the well-known text (WKT) string
         of a spatial reference. One way
         to determine the WKT for a spatial reference is to export the spatial
         reference as a string, for example, arcpy.SpatialReference(3857,
         115700).exportToString()."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CreateIndoorNetworkDataset_indoors(
                *gp_fixargs((target_gdb, indoor_network_dataset_name, spatial_reference), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateFacilityEntryways_indoors", None)
def GenerateFacilityEntryways(
    in_level_features=None,
    in_unit_features=None,
    in_door_features=None,
    target_entryways=None,
    buffer_size=None,
    entryway_use_type=None,
    exterior_unit_exp=None,
    delete_existing_entryways: Literal["DELETE_FEATURES", "NO_DELETE_FEATURES"] | None = None,
    level_id_field=None,
    use_type_field=None,
) -> Result1[str]:
    """GenerateFacilityEntryways_indoors(in_level_features, in_unit_features, in_door_features, target_entryways, {buffer_size}, {entryway_use_type}, {exterior_unit_exp}, {delete_existing_entryways}, {level_id_field}, {use_type_field})

       Creates or updates points representing a facility's entry or exit
       locations.

    INPUTS:
     in_level_features (Feature Layer):
         The input polygon features representing a level or levels in one or
         more facilities. In the Indoors model, this is the Levels layer. Only
         the levels represented by these features will be processed.
     in_unit_features (Feature Layer):
         The input polygon features representing building spaces. In the
         Indoors model, this is the Units layer. The tool will use these
         features when identifying exterior edges of a facility.
     in_door_features (Feature Layer):
         The input polyline features representing doors. In the Indoors
         model, this is a subset of features from the Details layer. The tool
         will use these features when identifying entryways along the exterior
         of a facility. The layer must have one or more door features
         selected for the tool to
         run. Use the Select Layer By Attribute tool to make a selection.
     target_entryways (Feature Layer):
         The feature class or feature layer to which generated entryway points
         will be written.
     buffer_size {Double}:
         The distance, in meters, the tool will search inward and outward from
         a facility's exterior edge to identify potential entryways. The value
         must be greater than 0 and less than 10. The default value is 0.5.
     entryway_use_type {String}:
         The value that will be used to calculate thefield for new
         entryway points. The default value is Entry. USE_TYPE
     exterior_unit_exp {SQL Expression}:
         An SQL expression used to define whichvalues represent a
         facility's exterior spaces, such as patios or fire escapes. Spaces
         matching this expression will be treated as exterior features during
         entryway generation. Input Unit Features
     delete_existing_entryways {Boolean}:
         Specifies whether existing entryway features with afield value
         matching the entryway_use_type parameter value will be deleted before
         creating new entryway points. When deleting existing entryways, the
         tool only identifies entryways on levels included in the
         in_level_features parameter. USE_TYPEDELETE_FEATURES-Existing
         features will be
         deleted.NO_DELETE_FEATURES-Existing features will not be deleted. This
         is the
         default.
     level_id_field {Field}:
         The field that will be updated with the associated level ID
         for the new entryway features. If the in_level_features parameter
         value is a floor-aware layer, this parameter will default to the
         layer's configuredvalue. Otherwise, the parameter will default to
         thefield. If the defined field does not exist in the target_entryways
         feature layer, a field with the supplied name will be created and
         populated with the level ID field values. Floor FieldLEVEL_ID
     use_type_field {Field}:
         The field that will be updated with the entryway_use_type
         value for the new entryway features. The default is thefield. If the
         defined field does not exist in the target_entryways feature layer, a
         field with the supplied name will be created and populated with the
         entryway_use_type value. USE_TYPE"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateFacilityEntryways_indoors(
                *gp_fixargs(
                    (
                        in_level_features,
                        in_unit_features,
                        in_door_features,
                        target_entryways,
                        buffer_size,
                        entryway_use_type,
                        exterior_unit_exp,
                        delete_existing_entryways,
                        level_id_field,
                        use_type_field,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateFloorTransitions_indoors", None)
def GenerateFloorTransitions(
    facility_features=None,
    transition_unit_features=None,
    pathway_features=None,
    target_transitions=None,
    elevator_delay=None,
    delete_existing_transitions: Literal["DELETE_FEATURES", "NO_DELETE_FEATURES"] | None = None,
    stairway_unit_exp=None,
    elevator_unit_exp=None,
) -> Result1[str]:
    """GenerateFloorTransitions_indoors(facility_features, transition_unit_features, pathway_features, target_transitions, {elevator_delay}, {delete_existing_transitions}, {stairway_unit_exp}, {elevator_unit_exp})

       Creates or updates transition line features that connect floors
       vertically.

    INPUTS:
     facility_features (Feature Layer):
         The input polygon features representing a facility or facilities. In
         the Indoors model, this is the Facilities layer. Only the facilities
         represented by these features will be processed.
     transition_unit_features (Feature Layer):
         The input polygon features representing the transition spaces in a
         facility. In the Indoors model, this is the Units layer.
     pathway_features (Feature Layer):
         The input polyline features representing preliminary pathways. The new
         transition features will snap to these polyline features. In the
         Indoors model, this is the PrelimPathways layer.
     target_transitions (Feature Layer):
         An existing feature class or layer that will be updated with the new
         transitions. In the Indoors model, this is the PrelimTransitions
         layer.
     elevator_delay {Long}:
         The average elevator transit time. It is one-half the time in seconds
         that an elevator passenger can expect to spend waiting to enter and
         exit the elevator. Using this parameter can improve routing and
         transit time calculations. The value must be equal to or greater than
         zero.
     delete_existing_transitions {Boolean}:
         Specifies whether existing transition features in selected transition
         spaces will be deleted before creating new transition features. If
         this parameter is not used, the updated_transitions value will include
         both existing and newly created transition
         features.DELETE_FEATURES-Existing transition features will be deleted.
         This is
         the default.NO_DELETE_FEATURES-Existing transition features will not
         be deleted.
     stairway_unit_exp {SQL Expression}:
         An SQL expression used to define whichvalues represent step-
         based transitions, such as stairs and escalators. Transition
         Unit Features
     elevator_unit_exp {SQL Expression}:
         An SQL expression used to define whichvalues represent lift-
         based transitions, such as elevators. Transition Unit Features"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateFloorTransitions_indoors(
                *gp_fixargs(
                    (
                        facility_features,
                        transition_unit_features,
                        pathway_features,
                        target_transitions,
                        elevator_delay,
                        delete_existing_transitions,
                        stairway_unit_exp,
                        elevator_unit_exp,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateIndoorNetworkFeatures_indoors", None)
def GenerateIndoorNetworkFeatures(
    in_level_features=None,
    in_unit_features=None,
    in_obstacle_features=None,
    target_indoor_pathways=None,
    target_floor_transitions=None,
    obstacle_expression=None,
    routable_locations=None,
    generation_method: Literal["UCN", "TRANSITIONS_ONLY"] | None = None,
    stairway_unit_exp=None,
    elevator_unit_exp=None,
    elevator_delay=None,
    obstacle_buffer=None,
    search_radius=None,
) -> Result2[str | Layer, str | Layer]:
    """GenerateIndoorNetworkFeatures_indoors(in_level_features, in_unit_features, in_obstacle_features, target_indoor_pathways, {target_floor_transitions}, {obstacle_expression}, {routable_locations;routable_locations...}, {generation_method}, {stairway_unit_exp}, {elevator_unit_exp}, {elevator_delay}, {obstacle_buffer}, {search_radius})

       Generates indoor pathways and floor transitions on selected levels in
       one or more facilities. This tool can generate horizontal pathways and
       vertical floor transitions for the indoor routable network in a single
       tool run.

    INPUTS:
     in_level_features (Feature Layer):
         The feature class or layer that contains level features. In the
         Indoors model, this is the Levels layer. The tool honors selections
         and definition queries applied to the layer.
     in_unit_features (Feature Layer):
         The feature class or layer that contains unit features. In the Indoors
         model, this is the Units layer.
     in_obstacle_features (Feature Layer):
         The feature class or layer that contains polyline features
         representing nontraversable features, such as walls, windows, and
         columns. The obstacle features layer must contain afield or be defined
         as floor aware in the map. LEVEL_ID
     target_indoor_pathways (Feature Layer):
         The feature class or feature layer where generated pathway features
         will be created. In the Indoors model, this is the Pathways layer.
     target_floor_transitions {Feature Layer}:
         The feature class or feature layer where generated transition
         features, representing the vertical transitions between floors such as
         stairs and elevators, will be created. In the Indoors model, this is
         the Transitions layer.
     obstacle_expression {SQL Expression}:
         An SQL expression that defines which subset of features from the
         in_obstacle_features parameter are barriers through which pathways
         should not traverse. This includes features such as walls, windows,
         and columns.
     routable_locations {Feature Layer}:
         Additional locations to which pathways should be generated. This
         parameter accepts point feature layers as input.
     generation_method {String}:
         Specifies the method that will be used to generate indoor
         pathways.UCN-Horizontal pathways will be created using the universal
         circulation network algorithm, which more closely resembles walking
         patterns. This method is well suited for buildings that are not
         composed of primarily 90 degree angles or at a consistent rotation.
         Transition features will also be created if input transitions are
         provided.TRANSITIONS_ONLY-If you have existing pathways, this option
         will
         create the vertical transitions between floors and will snap them to
         the existing pathways.
     stairway_unit_exp {SQL Expression}:
         An SQL expression that will define the features from the input Units
         layer that represent step-based transitions, such as stairs and
         escalators.
     elevator_unit_exp {SQL Expression}:
         An SQL expression that will define the features from the input Units
         layer that represent lift-based transitions, such as elevators.
     elevator_delay {Double}:
         The average elevator transit time in seconds that an elevator
         passenger can expect to spend waiting to enter and exit the elevator.
         Using this parameter can improve routing and transit time
         calculations.The value must be equal to or greater than zero.
     obstacle_buffer {Linear Unit}:
         The buffer distance that will be applied to obstacle features defined
         as barriers.
     search_radius {Linear Unit}:
         The distance that will be searched for routable locations from any
         given point. Providing a larger radius will result in more pathways
         generated. Large spaces and long hallways require a larger search
         radius for pathway generation."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateIndoorNetworkFeatures_indoors(
                *gp_fixargs(
                    (
                        in_level_features,
                        in_unit_features,
                        in_obstacle_features,
                        target_indoor_pathways,
                        target_floor_transitions,
                        obstacle_expression,
                        routable_locations,
                        generation_method,
                        stairway_unit_exp,
                        elevator_unit_exp,
                        elevator_delay,
                        obstacle_buffer,
                        search_radius,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateIndoorPathways_indoors", None)
def GenerateIndoorPathways(
    in_level_features=None,
    in_detail_features=None,
    target_pathways=None,
    lattice_rotation=None,
    lattice_density=None,
    restricted_unit_features=None,
    restricted_unit_exp=None,
    detail_exp=None,
) -> Result1[str]:
    """GenerateIndoorPathways_indoors(in_level_features, in_detail_features, target_pathways, {lattice_rotation}, {lattice_density}, {restricted_unit_features}, {restricted_unit_exp}, {detail_exp})

       Generates preliminary pathways that are cut according to obstructions,
       such as walls or columns, on selected levels in one or more
       facilities.

    INPUTS:
     in_level_features (Feature Layer):
         The input polygon features representing levels in facilities. In the
         Indoors model, this is the Levels layer. The tool honors selections
         and definition queries applied to the layer.
     in_detail_features (Feature Layer):
         The input polyline features representing architectural details that
         can serve as barriers to travel within a facility. In the Indoors
         model, this is the Details layer.If the input polyline layer contains
         feature representing both
         barriers (such as walls and windows) and nonbarriers (such as stairs
         and doorways), use the detail_exp parameter to identify which features
         represent barriers.
     target_pathways (Feature Layer):
         The feature class or feature layer to which generated pathway
         polylines will be written. In the Indoors model, this is the
         PrelimPathways layer.
     lattice_rotation {Double}:
         The number of degrees by which the input floors' primary travel
         direction is rotated clockwise from due west. If left blank, the tool
         will calculate a value based on the minimum bounding rectangle of each
         floor.The value must be between 0.0 and 180.0.
     lattice_density {Double}:
         The longest distance allowed between nodes in the generated lattice of
         pathways. The tool uses the unit of measure from the coordinate system
         of the Indoors dataset. The default value is 0.6.The value must be
         between 0.25 and 2.9.
     restricted_unit_features {Feature Layer}:
         The input polygon features representing restricted and unrestricted
         spaces within a facility. In the Indoors model, this is the Units
         layer.
     restricted_unit_exp {SQL Expression}:
         An SQL expression that will be used to select the
         restricted_unit_features parameter values where the tool will not
         generate pathways.
     detail_exp {SQL Expression}:
         An SQL expression used to select the in_detail_features parameter
         values across which the tool will not generate pathways."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateIndoorPathways_indoors(
                *gp_fixargs(
                    (
                        in_level_features,
                        in_detail_features,
                        target_pathways,
                        lattice_rotation,
                        lattice_density,
                        restricted_unit_features,
                        restricted_unit_exp,
                        detail_exp,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ThinIndoorPathways_indoors", None)
def ThinIndoorPathways(
    in_level_features=None,
    in_pathway_features=None,
    in_transition_features=None,
    routable_locations=None,
    target_pathways=None,
    target_transitions=None,
    search_tolerance=None,
    neighbor_solve_count=None,
) -> Result2[str, str]:
    """ThinIndoorPathways_indoors(in_level_features, in_pathway_features, in_transition_features, routable_locations;routable_locations..., target_pathways, target_transitions, {search_tolerance}, {neighbor_solve_count})

       Removes preliminary network pathways that are not needed for routing
       between selected locations on each level, reducing the network dataset
       size and improving its route-solving performance.

    INPUTS:
     in_level_features (Feature Layer):
         The input polygon features representing a level or levels in one or
         more facilities. In the ArcGIS Indoors Information Model, this is the
         Levels layer. Only the levels represented by these features will be
         processed.
     in_pathway_features (Feature Layer):
         The input polyline features representing the preliminary pathways to
         be thinned. In the Indoors model, this is the PrelimPathways layer.
     in_transition_features (Feature Layer):
         The input polyline features representing the preliminary transitions
         to be thinned. In the Indoors model, this is the PrelimTransitions
         layer.
     routable_locations (Feature Layer):
         The input point or polygon features representing the locations used to
         calculate routes. This can be any point or polygon features that
         conform to the Indoors model or are configured as floor aware.
     target_pathways (Feature Layer):
         The existing feature class or feature layer to which the thinned
         pathways will be added. In the Indoors model, this is the Pathways
         layer.
     target_transitions (Feature Layer):
         The existing feature class or feature to which thinned transitions
         will be added. In the Indoors model, this is the Transitions layer.
     search_tolerance {Long}:
         The distance, in meters, the tool will search forfeatures near
         the input pathways. Thefeatures that are farther away than this value
         will not be used for thinning. The default value is 5. Routable
         LocationsRoutable LocationsThe value must be 0 or greater.
     neighbor_solve_count {Long}:
         The number of closest neighboring locations that will be
         solved when calculating routes between a specified location and other
         routable locations in the facility. The default value is 50.
         The value must be 1 or greater."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ThinIndoorPathways_indoors(
                *gp_fixargs(
                    (
                        in_level_features,
                        in_pathway_features,
                        in_transition_features,
                        routable_locations,
                        target_pathways,
                        target_transitions,
                        search_tolerance,
                        neighbor_solve_count,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# End of generated toolbox code
del gptooldoc, gp, gp_fixargs, convertArcObjectToPythonObject, annotations, TYPE_CHECKING

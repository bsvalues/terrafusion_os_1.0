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
r"""Geocoding is the process of assigning a location, usually in the form
of coordinate values, to an address by comparing the descriptive
location elements in the address to those present in the reference
material. Addresses come in many forms, ranging from the common
address format of house number followed by the street name and
succeeding information to other location descriptions such as postal
zone or census tract. In essence, an address includes any type of
information that distinguishes a place."""
from __future__ import annotations

__all__ = [
    "AddPolygonFieldsToLocator",
    "AssignStreetsToPoints",
    "AssignZonesToStreets",
    "ClipLocator",
    "ConsolidateLocator",
    "CreateCompositeAddressLocator",
    "CreateFeatureLocator",
    "CreateLocator",
    "DeletePolygonFieldsFromLocator",
    "GeocodeAddresses",
    "GeocodeFile",
    "GeocodeLocationsFromTable",
    "PackageLocator",
    "RebuildAddressLocator",
    "RematchAddresses",
    "ReverseGeocode",
    "SplitAddressIntoComponents",
]
__alias__ = "geocoding"
from arcpy.geoprocessing._base import gptooldoc, gp, gp_fixargs
from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing import Literal
    from arcpy import RecordSet, FeatureSet
    from arcpy._mp import Layer, Table
    from arcpy.typing.gp import Result, Result1, Result2, Result3
from arcpy import _geocoding
from arcpy._geocoding import *

__all__ += _geocoding.__all__


# Tools
@gptooldoc("AddPolygonFieldsToLocator_geocoding", None)
def AddPolygonFieldsToLocator(
    in_locator=None,
    polygon_features=None,
    polygon_output_fields=None,
) -> Result1[str]:
    """AddPolygonFieldsToLocator_geocoding(in_locator, polygon_features, polygon_output_fields;polygon_output_fields...)

       Adds custom output fields from a polygon layer to an existing locator
       stored locally.

    INPUTS:
     in_locator (Address Locator):
         The locator (.loc file) where the fields will be added.The locator
         cannot be a composite locator or a geocode service,
         including services from ArcGIS Enterprise or ArcGIS Online. You must
         add the polygon fields to the participating locators of a composite
         locator before publishing the locator as a geocode service.
     polygon_features (Feature Layer):
         The feature class containing the fields that will be added to the
         in_locator parameter value (fields will be appended to all geocoding
         output).
     polygon_output_fields (Value Table):
         The fields from the polygon feature class that will be appended to the
         locator.Provide the field or field alias from the polygon_features
         parameter
         value, and the default field name will be used as the field name that
         is added to the locator. The default field name can be overwritten.
         The fields or name values provided for this parameter will define the
         names of the output fields from the polygon_features parameter value
         that will be returned in the geocode result. If the fields from the
         polygon features have aliases, the field alias will be used as the
         Name value.Polygon Field(s)-The fields from the polygon_features
         parameter value
         that will be added to the locator.Name-The name of the custom output
         field that will appear in the
         geocode results and locator properties."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AddPolygonFieldsToLocator_geocoding(
                *gp_fixargs((in_locator, polygon_features, polygon_output_fields), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ClipLocator_geocoding", None)
def ClipLocator(
    in_locator=None,
    out_locator=None,
    area_of_interest=None,
    extent=None,
) -> Result1[str]:
    """ClipLocator_geocoding(in_locator, out_locator, {area_of_interest}, {extent})

       Clips a locator based on an area of interest or extent and creates a
       locator with a smaller extent and size.

    INPUTS:
     in_locator (Address Locator):
         The locator (.loc file) that will be clipped.Geocode services or
         composite locators that contain geocode services,
         including services from ArcGIS Enterprise or ArcGIS Online, as
         participating locators are not supported. If the service is a
         participating locator in a composite locator it will not be clipped.
     area_of_interest {Feature Layer}:
         The polygon layer that defines an area of interest that will be used
         to clip the locator.This parameter overrides the extent parameter.
     extent {Extent}:
         Specifies the extent that will be used to clip the locator.DISPLAY-The
         extent will be equal to the visible display.Layer name-The
         extent of the specified layer will be used.Extent object-The extent of
         the specified object will be used.Space delimited string of
         coordinates-The extent of the specified
         string will be used. Coordinates are expressed in the order of x-min,
         y-min, x-max, y-max.

    OUTPUTS:
     out_locator (Address Locator):
         The clipped output locator (.loc file)."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ClipLocator_geocoding(*gp_fixargs((in_locator, out_locator, area_of_interest, extent), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ConsolidateLocator_geocoding", None)
def ConsolidateLocator(
    in_locator=None,
    output_folder=None,
    copy_arcsde_locator: Literal["COPY_ARCSDE", "PRESERVE_ARCSDE"] | None = None,
) -> Result1[str]:
    """ConsolidateLocator_geocoding(in_locator, output_folder, {copy_arcsde_locator})

       Consolidate Locator

    INPUTS:
     in_locator (Address Locator):
         Input Locator
     copy_arcsde_locator {Boolean}:
         Composite locator only: copy participating locators in ArcSDE database instead of referencing them

    OUTPUTS:
     output_folder (Folder):
         Output Folder"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ConsolidateLocator_geocoding(*gp_fixargs((in_locator, output_folder, copy_arcsde_locator), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CreateCompositeAddressLocator_geocoding", None)
def CreateCompositeAddressLocator(
    in_address_locators=None,
    in_field_map=None,
    in_selection_criteria=None,
    out_composite_address_locator=None,
    in_result_ordering=None,
) -> Result1[str]:
    """CreateCompositeAddressLocator_geocoding(in_address_locators;in_address_locators..., in_field_map, {in_selection_criteria;in_selection_criteria...}, out_composite_address_locator, {in_result_ordering})

       Creates a composite locator. A composite locator consists of two or
       more individual locators that allow addresses and places to be matched
       using multiple locators.

    INPUTS:
     in_address_locators (Value Table):
         The locators that will be used to create the composite locator. The
         order of the participating locators determines how candidates are
         searched and a place or address is matched. When you geocode a single
         place or address, the place or address will be matched using all
         participating locators unless the locator is specified with a
         selection criterion. All the found candidates will be displayed based
         on the order of the listed participating locators. If you geocode a
         table of addresses or places, addresses or places will be matched
         automatically to the first best candidate found from the first
         participating locators. If the address or place fails to match, it
         will fall back to the subsequent locator in the list.A reference name
         for each participating locator is required. This is
         the name of the locator referred to by the composite locator. Do not
         use spaces or special symbols in the name. The maximum length of the
         name is 14 characters.
     in_field_map (Field Mappings):
         The mapping of input fields used by each participating locator to the
         input fields of the composite address locator.For each locator input
         field, format the field information as in this
         sample string: "Address 'Address or Intersection' true true false 4
         Text 0 0 ,First,'#',Street". The information in this string is
         composed of the following:         New field name (Address)-The new
         locator field name for the
         composite locator. One locator in the composite may have an
         Address field and the other
         locator may have a Street Address field. You can designate the new
         composite locator field as Address, which references both original
         locator fields. Alias for the new field name ('Address or
         Intersection')-The
         new locator field name alias for the composite locator. For a
         composite locator with the new field name Address, you can
         designate an alias of 'Address or Intersection' for the
         field.isEditable (true)-Specifies whether the new composite locator
         field is
         editable. The options are true or false.Allow NULL Values
         (true)-Specifies whether the new composite locator
         field allows null values. The options are true or false.Required
         (false)-Specifies whether the new composite locator field is
         a required field. The options are true or false.Length (4)-The length
         of the new composite locator field.Type (Text)-The data type of the
         new composite locator field. This
         value should always be Text for a locator.Scale (0)-The scale of the
         new composite locator field. Any value
         between 1 and 100 can be used. This value does not apply to locators,
         but a valid value must be used.Precision (0)-The precision of the new
         composite locator field. Any
         value between 1 and 100 can be used. This value does not apply to
         locators, but a valid value must be used.Merge rule (First)-The merge
         rule for the new composite locator field.
         Any merge rule value can be used. This value does not apply to
         locators, but a valid value must be used.Delimiter ('#')-The delimiter
         for the new composite locator field. Any
         supported delimiter can be used.Original locator field name
         (Street)-The locator field name in the
         original participating locator.
     in_selection_criteria {Value Table}:
         The selection criteria for each participating locator. Only one
         selection criterion is supported for each participating locator.Using
         selection criteria will disqualify participating locators that
         do not meet the criteria for a particular address or place so that the
         geocoding process will be more efficient. See Fundamentals of
         combining multiple locators into a composite locator to learn more
         about the use of selection criteria in the geocoding process.
     in_result_ordering {String}:
         Specifies the fallback order of the participating locators to which
         addresses can be matched to increase the probability of finding the
         best match when geocoding. Use locator order-Participating
         locators will be in the order
         they were added and adhere to the fallback order described in Combine
         multiple locators into a composite locator. This is the default.
         Syntax is a comma delimited string of locator names.For a composite
         locator containing two locators (Atlanta.loc and
         Memphis.loc, for example), the syntax should be "Atlanta, Memphis".
         Order by role and score-Individual roles of participating
         locators will be grouped and ordered from most to least precise.
         Results will be returned for more precise roles first followed by less
         precise roles, and for results that are returned for different
         locators with the same role, results will be returned based on score.
         It is recommended that you use this option if you have a multirole
         locator and several single role locators or if you have more than one
         multirole locator. This automatically orders the locators and roles
         into a recommended, optimal fallback order. Syntax is a comma
         delimited string of role groupings structured as
         [LocatorRole1](LocatorName1.LocatorRole1,
         LocatorName2.LocatorRole1).For a composite locator containing two
         multirole locators (Atlanta.loc
         and Memphis.loc, for example) each containing a PointAddress role and
         a StreetAddress role, the syntax should be
         "[PointAddress](Atlanta.PointAddress, Memphis.PointAddress),[StreetAdd
         ress](Memphis.StreetAddress,Atlanta.StreetAddress)".Roles must be
         ordered from most precise to least precise. Custom order-A
         customizable fallback order for participating
         locators will be used that allows you to insert locators between the
         roles of a multirole locator. Syntax is a comma delimited
         string of locator names and roles
         structured as LocatorName.LocatorRole.For a composite locator
         containing two multirole locators (Atlanta.loc
         and Memphis.loc, for example) each containing a PointAddress role and
         a StreetAddress role, the syntax should be "Atlanta.StreetAddress,Memp
         his.PointAddress,Memphis.StreetAddres,Atlanta.PointAddress".Locators
         and roles can be placed in any order, but placing less
         precise roles before more precise roles may result in unexpected
         behavior. To generate the correct Python syntax, first run the
         tool from
         thepane. Then, open themenu and select. GeoprocessingRunCopy
         Python Command

    OUTPUTS:
     out_composite_address_locator (Address Locator):
         The composite address locator that will be created. ArcGIS Pro only
         supports saving locators in a file folder."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CreateCompositeAddressLocator_geocoding(
                *gp_fixargs(
                    (
                        in_address_locators,
                        in_field_map,
                        in_selection_criteria,
                        out_composite_address_locator,
                        in_result_ordering,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CreateFeatureLocator_geocoding", None)
def CreateFeatureLocator(
    in_features=None,
    search_fields=None,
    output_locator=None,
    locator_fields=None,
    custom_output_fields=None,
) -> Result1[str]:
    """CreateFeatureLocator_geocoding(in_features, search_fields, output_locator, {locator_fields}, {custom_output_fields;custom_output_fields...})

       Creates a locator using reference data that contains a unique name or
       value for every feature stored in a single field. A locator created
       with this tool has broad applications. It can be used to search for
       names or unique attributes of features, such as water meters, short
       place names, cell towers, or alphanumeric strings used to identify
       locations (for example, N1N115).

    INPUTS:
     in_features (Feature Layer):
         The reference data feature class or feature layer that will be used to
         create the locator.Feature classes represented as services are
         supported data types for
         use as reference data.When a definition query is defined for the
         reference data or there are
         selected features, only the queried and selected features are included
         when the locator is created.When creating a locator with reference
         data that contains millions of
         features, you must have at least three to four times the size of the
         data in free disk space on the drive containing your temp directory,
         as files used to build the locator are written to this location before
         the locator is copied to the output location. If you do not have
         enough disk space, the tool will fail when it runs out of space. Also,
         when creating large locators, your machine must have enough RAM to
         handle large memory-intensive processes.
     search_fields (Field Info):
         Maps the reference data field to the field used for search in
         the in_features parameter value. The search_fields mapping is done in
         the following format in whichis the name of the field supported by the
         locator role, andis the name of the field used for search in the
         in_features parameter. <locator field name><data field name>#
         <locator field name> <data field name> # This shows an example:
         reference_data_field_map = ''' "'Name' AssetName" '''The selected
         field will be indexed and used for search. Map the
         relevant field for the reference data in the in_features parameter.
     locator_fields {Field Info}:
         Maps additional fields for extent and rank if they exist in
         the data. Thefield is used to sort results for ambiguous queries or
         candidates with the same name and score. The extent fields help set
         the map extent for displaying geocoded results. The locator_fields
         mapping is done in the following format:        Rank# <additional
         locator field name> <additional data field name> # This
         shows an example: additional_fields_map = ''' "'Rank' RANK;'Min X'
         Xmin; 'Max X' Xmax;'Min Y' Ymin; 'Max Y' Ymax" '''        Thefield is
         the name of the additional fields supported by the
         locator, and thefield is the name of the field in the in_features
         parameter. Map the relevant fields for the reference data in the
         in_features parameter. <additional locator field
         name><additional data field name>
     custom_output_fields {String}:
         Adds user-defined output fields to the locator. The values specified
         for this parameter will define the names of the custom output fields
         that will be returned in the geocode result; however, each new field
         must be mapped to a field in the reference data. The maximum number of
         fields supported in the locator is 50.You must first include the
         custom output field names in the
         field_mapping parameter; then list the names in the
         custom_output_fields parameter.

    OUTPUTS:
     output_locator (Address Locator):
         The output locator file to be created in a file folder. Once the
         locator is created, additional properties and options can be modified
         in the locator's settings."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CreateFeatureLocator_geocoding(
                *gp_fixargs((in_features, search_fields, output_locator, locator_fields, custom_output_fields), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CreateLocator_geocoding", None)
def CreateLocator(
    country_code: Literal[
        "AS_DEFINED_IN_DATA",
        "ASM",
        "AUT",
        "AUS",
        "BEL",
        "CAN",
        "CHE",
        "CZE",
        "DEU",
        "ESP",
        "EST",
        "FRA",
        "GBR",
        "GUM",
        "IND",
        "ISR",
        "ITA",
        "JPN",
        "KOR",
        "LTU",
        "LVA",
        "MNP",
        "NLD",
        "NOR",
        "PRI",
        "SWE",
        "UMI",
        "USA",
        "VIR",
        "ZAF",
    ]
    | None = None,
    primary_reference_data=None,
    field_mapping=None,
    out_locator=None,
    language_code: Literal[
        "AS_DEFINED_IN_DATA",
        "BAQ",
        "CAT",
        "CZE",
        "DUT",
        "ENG",
        "EST",
        "FRE",
        "GER",
        "GLG",
        "HEB",
        "ITA",
        "JPN",
        "KOR",
        "LAV",
        "LIT",
        "NOR",
        "SPA",
        "SWE",
    ]
    | None = None,
    alternatename_tables=None,
    alternate_field_mapping=None,
    custom_output_fields=None,
    precision_type: Literal["GLOBAL_HIGH", "GLOBAL_EXTRA_HIGH", "LOCAL_EXTRA_HIGH"] | None = None,
    version_compatibility: Literal["CURRENT_VERSION", "V3_0_TO_3_3"] | None = None,
) -> Result1[str]:
    """CreateLocator_geocoding(country_code, primary_reference_data;primary_reference_data..., field_mapping;field_mapping..., out_locator, language_code, {alternatename_tables;alternatename_tables...}, {alternate_field_mapping;alternate_field_mapping...}, {custom_output_fields;custom_output_fields...}, {precision_type}, {version_compatibility})

        Creates a locator that can find the location of an address or a place,
        convert a table of addresses or places to a collection of point
        features, or identify the address of a point location.

     INPUTS:
      country_code (String):
          Specifies where country-specific geocoding logic will be applied to
          the reference data for the locator.It can be specified using
          AS_DEFINED_IN_DATA and a value can be mapped
          from primary_reference_data in field_mapping, or it can be applied to
          the entire dataset by specifying the three-character country code
          name-for example, USA for the United States of America, CAN for
          Canada, or PRI for Puerto Rico.It provides a country template
          containing the expected field names
          that are available for use by the field_mapping parameter for the
          specified country of the locator to be created.AS_DEFINED_IN_DATA-The
          three-character country code value defined in
          the reference data for each feature will be used.ASM-American
          SamoaAUS-AustraliaAUT-AustriaBEL-BelgiumCAN-CanadaCHE-SwitzerlandCZE-
          CzechiaDEU-GermanyESP-SpainEST-EstoniaFRA-FranceGBR-Great
          BritainGUM-GuamIND-IndiaISR-IsraelITA-ItalyJPN-JapanKOR-South
          KoreaLTU-LithuaniaLVA-LatviaMNP-Northern Mariana
          IslandsNLD-NetherlandsNOR-NorwayPRI-Puerto RicoSWE-SwedenVIR-U.S.
          Virgin IslandsUSA-United StatesUMI-Minor Outlying Islands of the
          United StatesZAF-South Africa
      primary_reference_data (Value Table):
          The reference data feature classes and their roles that will be used
          to create the locator. Only one primary table can be used per
          role.Feature classes represented as services are supported data types
          for
          use as primary reference data.When a definition query is defined for
          the primary reference data or
          there are selected features, only the queried and selected features
          will be included when the locator is created.When creating a locator
          with reference data that contains millions of
          features, you must have at least three to four times the size of the
          data in free disk space on the drive containing your temp directory,
          as files used to build the locator are written to this location before
          the locator is copied to the output location. If you do not have
          enough disk space, the tool will fail when it runs out of space. Also,
          when creating large locators, your machine must have enough RAM to
          handle large memory-intensive processes.
      field_mapping (String):
          The mapping of primary reference dataset fields to the fields
          supported by the locator role. Each field mapping in this parameter is
          in the following format in which <role name> is the locator role
          name,is the name of the field supported by the locator role, <primary
          data> is the name of the data used in the primary_reference_data
          parameter, andis the name of the field in the primary reference
          dataset:        <locator role field name><primary data field name>#
          <role name>.<locator role field name> <primary data>.<primary data
          field name> # This shows an example: primary_reference_data_field_map
          = ["StreetAddress.HOUSE_NUMBER_FROM_LEFT 'streets'.L_F_ADD",\\
          "StreetAddress.HOUSE_NUMBER_TO_LEFT 'streets'.L_T_ADD",\\
          "StreetAddress.HOUSE_NUMBER_FROM_RIGHT 'streets'.R_F_ADD",\\
          "StreetAddress.HOUSE_NUMBER_TO_RIGHT 'streets'.R_T_ADD",\\
          "StreetAddress.STREET_PREFIX_DIR 'streets'.PREFIX",\\
          "StreetAddress.STREET_PREFIX_TYPE 'streets'.PRE_TYPE",\\
          "StreetAddress.STREET_NAME 'streets'.NAME",\\
          "StreetAddress.STREET_SUFFIX_TYPE 'streets'.TYPE",\\
          "StreetAddress.STREET_SUFFIX_DIR 'streets'.SUFFIX",\\
          "StreetAddress.CITY_LEFT 'streets'.CITYL",\\ "StreetAddress.CITY_RIGHT
          'streets'.CITYR",\\ "StreetAddress.REGION_LEFT 'streets'.STATE_ABBR",\\
          "StreetAddress.REGION_RIGHT 'streets'.STATE_ABBR",\\
          "StreetAddress.POSTAL_LEFT 'streets'.ZIPL",\\
          "StreetAddress.POSTAL_RIGHT 'streets'.ZIPR"]Map the relevant fields
          for each table from the primary_reference_data
          parameter. If you do not map an optional reference data field used by
          the locator role to a field in a reference dataset, it is not
          necessary to specify that there is no mapping using <None> in place of
          a field name. To determine thevalue for a reference data field
          used by a
          locator role, open the Create Locator tool in ArcGIS Pro and choose
          the locator role. The name that appears in thecolumn of theparameter
          is the field's role field name. <locator role field name>Field
          NameField MappingIf you are using an alternate name table, map Join ID
          in the
          primary_reference_data parameter value. To add custom output
          fields, the names of the fields must be
          defined in the custom_output_fields parameter as well as the
          field_mapping parameter. The field_mapping parameter will use the
          format '<locator role field name> <primary data field name>' in
          whichis defined as 'RoleName.CustomFieldName', andis the name of the
          field in the primary reference dataset as shown in the mapped fields
          in the example above. If a custom field is added to a Street Address
          role, you will need to map 'StreetAddress.CustomFieldName_Left' and
          'StreetAddress.CustomFieldName_Right' for each side of the street.
          <locator role field name><primary data field name>
      language_code (String):
          Specifies where language-specific geocoding logic will be applied to
          the reference data for the locator.If a language code field exists in
          the primary reference data,
          providing a language code can improve the results of the geocoding.It
          can be specified by setting AS_DEFINED_IN_DATA as the language_code
          value and mapping a value from primary_reference_data in
          field_mapping, or it can be applied to the entire dataset by
          specifying a language using the three-character language code
          representing the language of the address, such as ENG for
          English.AS_DEFINED_IN_DATA-The three-character language code value
          defined in
          the reference data for each feature will be
          used.BAQ-BasqueCAT-CatalanCZE-CzechDUT-DutchENG-EnglishEST-EstonianFR
          E-FrenchGER-GermanGLG-GalicianHEB-HebrewITA-ItalianJPN-JapaneseKOR-
          KoreanLIT-LithuanianLAV-LatvianNOR-NorwegianSPA-SpanishSWE-Swedish
      alternatename_tables {Value Table}:
          The tables that contain alternate names for the features in the
          primary role tables.Tables represented as services are supported data
          types for use as
          alternate name tables.When a definition query is defined for the
          alternate name table or
          there are selected records, only the queried and selected records will
          be included when the locator is created.
      alternate_field_mapping {String}:
          Maps alternate name table fields to the alternate data fields
          supported by the locator role. Each field mapping must use the
          following format in which <alternate name table role> is the name of
          the alternate name table role,is the name of the alternate data field
          supported by the alternate name table locator role, <alternate data
          table> is the name of the alternate name table, andis the name of the
          field in the alternate name table. Map the relevant fields for each
          table in alternatename_tables. <locator role alternate field
          name><alternate data table field name># <alternate name table
          role>.<locator role alternate field name>
          <alternate data table>.<alternate data table field name> # This shows
          an example: alternate_data__table_field_map =
          ["AlternateStreetName.STREET_NAME_JOIN_ID 'altname'.JOINID",\\
          "AlternateStreetName.STREET_PREFIX_DIR 'altname'.PRE_DIR",\\
          "AlternateStreetName.STREET_PREFIX_TYPE 'altname'.PRE_TYPE",\\
          "AlternateStreetName.STREET_NAME 'altname'.ST_NAME",\\
          "AlternateStreetName.STREET_SUFFIX_TYPE 'altname'.ST_TYPE",\\
          "AlternateStreetName.STREET_SUFFIX_DIR 'altname'.SUF_DIR"]        If
          the data is normalized and the primary table does not
          contain city name values but the alternate name table does, thefield
          can be mapped to a field in the alternate name table that contains a
          value that indicates whether the record is the primary field (for
          example, true/false or Yes/No). If this field is not mapped, the first
          record in the alternate name table will be used as the primary value.
          Primary Name Indicator
      custom_output_fields {String}:
          Adds user-defined output fields to the locator. The values specified
          for this parameter will define the names of the custom output fields
          that will be returned in the geocode result; however, each new field
          must be mapped to a field in the reference data. This new output field
          will apply for all roles that were used in the locator. If the locator
          role has a left and right side, _left and _right will be appended to
          the end of the field name. The maximum number of fields supported in
          the locator is 50.You must first include the custom output field names
          in the
          field_mapping parameter; then list the names in the
          custom_output_fields parameter.
      precision_type {String}:
          Specifies the precision of the locator.Locators created with the
          GLOBAL_EXTRA_HIGH or LOCAL_EXTRA_HIGH option
          can be used in ArcGIS Pro 2.6 or later and Enterprise 10.8.1 or
          later.GLOBAL_EXTRA_HIGH-The precision is approximately 1 centimeter,
          which
          is consistent globally.GLOBAL_HIGH-The precision is approximately 0.5
          meter, which is
          consistent globally. This is the default.LOCAL_EXTRA_HIGH-Increased
          precision is used for local areas.
      version_compatibility {String}:
          Specifies the version of the locator that will be created. Specifying
          a version allows locators to be used with earlier versions of ArcGIS
          and supports backward compatibility.CURRENT_VERSION-The locator will
          be compatible with the version of the
          current ArcGIS Pro release.V3_0_TO_3_3-The locator will be compatible
          with ArcGIS Pro versions
          3.0 to 3.3.

     OUTPUTS:
      out_locator (Address Locator):
          The output address locator file."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CreateLocator_geocoding(
                *gp_fixargs(
                    (
                        country_code,
                        primary_reference_data,
                        field_mapping,
                        out_locator,
                        language_code,
                        alternatename_tables,
                        alternate_field_mapping,
                        custom_output_fields,
                        precision_type,
                        version_compatibility,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("DeletePolygonFieldsFromLocator_geocoding", None)
def DeletePolygonFieldsFromLocator(
    in_locator=None,
) -> Result1[str]:
    """DeletePolygonFieldsFromLocator_geocoding(in_locator)

       Deletes all polygon fields from a locator that were added using the
       Add Polygon Fields To Locator tool.

    INPUTS:
     in_locator (Address Locator):
         The locator (.loc file) containing the fields to be deleted.Composite
         locators, locators published as a geocode service, and
         locators that do not contain a polygon layer are not supported."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.DeletePolygonFieldsFromLocator_geocoding(*gp_fixargs((in_locator,), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GeocodeAddresses_geocoding", None)
def GeocodeAddresses(
    in_table=None,
    address_locator=None,
    in_address_fields=None,
    out_feature_class=None,
    out_relationship_type: Literal["DYNAMIC", "STATIC"] | None = None,
    country=None,
    location_type: Literal["ROUTING_LOCATION", "ADDRESS_LOCATION"] | None = None,
    category=None,
    output_fields: Literal["ALL", "MINIMAL", "MINIMAL_AND_USER", "LOCATION_ONLY"] | None = None,
) -> Result1[str]:
    """GeocodeAddresses_geocoding(in_table, address_locator, in_address_fields, out_feature_class, {out_relationship_type}, {country;country...}, {location_type}, {category;category...}, {output_fields})

       Geocodes a table of addresses. This process requires a table that
       stores the addresses you want to geocode and an address locator or a
       composite address locator. This tool matches the stored addresses to
       the locator and saves the result for each input record in a new point
       feature class. When using the ArcGIS World Geocoding Service, this
       operation may consume credits.

    INPUTS:
     in_table (Table View):
         The table of addresses that will be geocoded.
     address_locator (Address Locator):
         The address locator that will be used to geocode the table of
         addresses. Including the .loc extension after the locator name
         at the end of the
         locator path is optional.
     in_address_fields (Field Info):
         Each field mapping in this parameter is in the format
         input_address_field, table_field_name in whichis the name of the input
         address field specified by the address locator, andis the name of the
         corresponding field in the table of addresses you want to geocode.
         input_address_fieldtable_field_name        You can specify a single
         input field that stores the complete
         address, for example, 303 Peachtree St NE, Atlanta, GA 30308.
         Alternatively, you can specify multiple fields if the input addresses
         are divided into multiple fields such as,,, andfor a general United
         States address. You can also specify a single input field that stores
         the complete address, for example, 303 Peachtree St NE, Atlanta, GA
         30308, and a field that stores the country associated with the
         address, for example, USA. AddressCityStateZIP        Some
         locators support multiple input address fields, such as,,
         and. In this case, the address component can be separated into
         multiple fields, and the address fields will be concatenated at the
         time of geocoding. For example, 100, Main st, and Apt 140 across three
         fields, or 100 Main st and Apt 140 across two fields, both become 100
         Main st Apt 140 when geocoding. AddressAddress2Address3If you
         do not map an optional input address field used by the address
         locator to a field in the input table of addresses, specify that there
         is no mapping using <None> in place of the field name.
     out_relationship_type {Boolean}:
         This parameter has no effect in ArcGIS Pro. It remains to support
         backward compatibility with ArcGIS Desktop.In ArcGIS Pro, the only
         permissible value is STATIC.STATIC-A static copy of the fields input
         address table will be created
         in the output feature class. This is the only permissible
         value.DYNAMIC-This option is not applicable in ArcGIS Pro. See the
         ArcGIS
         Desktop help for this tool.
     country {String}:
         The country or countries that will be searched for the geocoded
         addresses. This parameter is available for locators that
         support a
         country parameter and will limit geocoding to the selected countries.
         Specifying a country will improve the accuracy of geocoding in most
         cases. If a field representing countries in the in_table parameter is
         mapped to thefield in the in_address_fields parameter value, the
         country value from the in_table parameter will override this
         parameter. CountryThis is limited to the specified country or
         countries. When no country
         is specified, geocoding is performed using all supported countries of
         the locator.Specify the value as either two-character or three-
         character country
         codes in a comma-separated list. See the Supported Country Codes
         column for the input value to use.This parameter is not supported for
         all locators.
     location_type {String}:
         Specifies the preferred output geometry for POINT_ADDRESS matches. The
         options for this parameter are ROUTING_LOCATION, which is the side of
         street location that can be used for routing and ADDRESS_LOCATION,
         which is the location that represents the rooftop, parcel centroid for
         the address, or front door. If the preferred location does not exist
         in the data, the default location of ROUTING_LOCATION will be
         returned. For geocode results with Addr_type=PointAddress, the x,y
         attribute values describe the coordinates of the address along the
         street, and the DisplayX and DisplayY values describe the rooftop or
         building centroid coordinates. See the ArcGIS REST API web help for
         details about the locationType parameter for geocodeAddresses.This
         parameter is not supported for all locators.ADDRESS_LOCATION-Geometry
         for geocode results that represent an
         address location such as rooftop location, parcel centroid, or front
         door will be returned.ROUTING_LOCATION-Geometry for geocode results
         that represent a
         location close to the side of the street that can be used for vehicle
         routing will be returned. This is the default.
     category {String}:
         Limits the types of places the locator searches, eliminating
         false positive matches and potentially speeding up the search process.
         When no category is used, geocoding is performed using all supported
         categories. Not all category values are supported for all locations
         and countries. In general, this parameter can be used for the
         following:        Limit matches to specific place types or address
         levelsAvoid fallback
         matches to unwanted address levelsDisambiguate coordinate searchesThis
         parameter is not supported for all locators.See the ArcGIS REST API
         web help for details about category filtering.
     output_fields {String}:
         Specifies the locator output fields that will be returned in the
         geocode results.This parameter can be used with input locators created
         with the Create
         Locator or Create Feature Locator tool stored on disk or published to
         Enterprise 10.9 or later. Composite locators that contain at least one
         locator created with the Create Address Locator tool do not support
         this parameter.ALL-Includes all available locator output fields in
         the geocode
         results. This is the default. LOCATION_ONLY-Stores thefield in
         the geocode results. The
         original field names from the in_table parameter value will be
         maintained with their original field names. Shape
         MINIMAL-Adds the following fields that describe the location
         and how well it matches information in the locator in the geocode
         results:,,,,, and. The original field names from the in_table
         parameter value will be maintained.
         ShapeStatusScoreMatch_typeMatch_addrAddr_type
         MINIMAL_AND_USER-Adds the following fields that describe the
         location and how well it matches information in the locator in the
         geocode results, as well as any user-defined custom output
         fields:,,,,, and. The original field names from the in_table parameter
         value will be maintained.
         ShapeStatusScoreMatch_typeMatch_addrAddr_type

    OUTPUTS:
     out_feature_class (Feature Class):
         The output geocoded feature class.Saving the output to shapefile
         format is not supported due to
         shapefile limitations."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GeocodeAddresses_geocoding(
                *gp_fixargs(
                    (
                        in_table,
                        address_locator,
                        in_address_fields,
                        out_feature_class,
                        out_relationship_type,
                        country,
                        location_type,
                        category,
                        output_fields,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("PackageLocator_geocoding", None)
def PackageLocator(
    in_locator=None,
    output_file=None,
    copy_arcsde_locator: Literal["COPY_ARCSDE", "PRESERVE_ARCSDE"] | None = None,
    additional_files=None,
    summary=None,
    tags=None,
) -> Result1[str]:
    """PackageLocator_geocoding(in_locator, output_file, {copy_arcsde_locator}, {additional_files;additional_files...}, {summary}, {tags})

       Package Locator

    INPUTS:
     in_locator (Address Locator):
         Input Locator
     copy_arcsde_locator {Boolean}:
         Composite locator only: copy participating locators in ArcSDE database instead of referencing them
     additional_files {File}:
         Additional Files
     summary {String}:
         Summary
     tags {String}:
         Tags

    OUTPUTS:
     output_file (File):
         Output File"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.PackageLocator_geocoding(
                *gp_fixargs((in_locator, output_file, copy_arcsde_locator, additional_files, summary, tags), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("RebuildAddressLocator_geocoding", None)
def RebuildAddressLocator(
    in_address_locator=None,
) -> Result1[str]:
    """RebuildAddressLocator_geocoding(in_address_locator)

       Rebuilds an address locator to update the locator with the current
       reference data. Because a locator contains a snapshot of the reference
       data when it was created, it will not geocode addresses with the
       updated data when the geometry and attributes of the reference data
       are changed. To geocode addresses with the current version of the
       reference data, the locator must be rebuilt to update the changes in
       the locator.

    INPUTS:
     in_address_locator (Address Locator):
         The address locator that will be rebuilt."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.RebuildAddressLocator_geocoding(*gp_fixargs((in_address_locator,), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("RematchAddresses_geocoding", None)
def RematchAddresses(
    in_geocoded_feature_class=None,
    in_where_clause=None,
) -> Result1[str]:
    """RematchAddresses_geocoding(in_geocoded_feature_class, {in_where_clause})

       Rematches addresses in a geocoded feature class.

    INPUTS:
     in_geocoded_feature_class (Feature Class):
         The geocoded feature class to be rematched.
     in_where_clause {SQL Expression}:
         An SQL expression used to select a subset of features. For more
         information on SQL syntax see the help topic SQL reference for query
         expressions used in ArcGIS."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.RematchAddresses_geocoding(*gp_fixargs((in_geocoded_feature_class, in_where_clause), True))
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("ReverseGeocode_geocoding", None)
def ReverseGeocode(
    in_features=None,
    in_address_locator=None,
    out_feature_class=None,
    address_type: Literal["ADDRESS", "INTERSECTION"] | None = None,
    search_distance=None,
    feature_type: list[
        Literal[
            "POINT_ADDRESS",
            "STREET_ADDRESS",
            "STREET_INTERSECTION",
            "STREET_NAME",
            "LOCALITY",
            "POSTAL",
            "POINT_OF_INTEREST",
            "DISTANCE_MARKER",
            "PARCEL",
            "SUBADDRESS",
        ]
    ]
    | Literal[
        "POINT_ADDRESS",
        "STREET_ADDRESS",
        "STREET_INTERSECTION",
        "STREET_NAME",
        "LOCALITY",
        "POSTAL",
        "POINT_OF_INTEREST",
        "DISTANCE_MARKER",
        "PARCEL",
        "SUBADDRESS",
    ]
    | str
    | None = None,
    location_type: Literal["ROUTING_LOCATION", "ADDRESS_LOCATION"] | None = None,
) -> Result1[str]:
    """ReverseGeocode_geocoding(in_features, in_address_locator, out_feature_class, {address_type}, {search_distance}, {feature_type;feature_type...}, {location_type})

       Creates addresses from point locations in a feature class. The reverse
       geocoding process searches for the nearest address, place, or
       intersection for the point location based on optimized distance values
       for locators created with the Create Locator tool.

    INPUTS:
     in_features (Feature Layer):
         A point feature class or layer from which matching places or addresses
         will be returned based on the features' point location.
     in_address_locator (Address Locator):
         The locator that will be used to reverse geocode the input feature
         class or layer.
     address_type {String}:
         This parameter is deprecated and maintained only for backward
         compatibility. By default, the feature types supported by the locator
         will be used.
     search_distance {Linear Unit}:
         This parameter is deprecated and maintained only for backward
         compatibility. By default, optimized hierarchical distance values will
         be used based on the roles supported by the locator and cannot be
         overridden.
     feature_type {String}:
         Specifies the possible match types that will be returned. A single
         value or multiple values can be selected. If a single value is
         selected, the search tolerance for the input feature type is 500
         meters. If multiple values are included, the default search distances
         specified in the feature type hierarchy table will be applied. See
         Feature types for details about the feature_type parameter for reverse
         geocoding.This parameter is not supported for all
         locators.SUBADDRESS-The match will be limited to a street address
         based on
         points that represent house and building subaddress locations. This
         option requires a locator created in ArcGIS Pro 2.8 or later and
         ArcGIS Enterprise 10.9 or later if published as a
         service.POINT_ADDRESS-The match will be limited to a street address
         based on
         points that represent house and building locations.PARCEL-The match
         will be limited to a plot of land that is considered
         real property and can include one or more homes or other structures.
         This match type typically has an address and a parcel identification
         number assigned to it.STREET_ADDRESS-The match will be limited to a
         street address that
         differs from POINT_ADDRESS because the house number is interpolated
         from a range of numbers. STREET_ADDRESS matches include the house
         number range for the matching street segment rather than the
         interpolated house number value.STREET_INTERSECTION-The match will be
         limited to a street address
         consisting of a street intersection along with city and optional state
         and postal code information. This is derived from STREET_ADDRESS
         reference data, for example, Redlands Blvd & New York St, Redlands,
         CA, 92373.STREET_NAME-The match will be limited to a street address
         similar to
         STREET_ADDRESS but without house numbers along with administrative
         divisions and optional postal code, for example, W Olive Ave,
         Redlands, CA, 92373.LOCALITY-The match will be limited to a place-name
         representing a
         populated place.POSTAL-The match will be limited to a postal code.
         Reference data is
         postal code points, for example, 90210 USA.POINT_OF_INTEREST-The match
         will be limited to a point of interest.
         Reference data consists of administrative division place-names,
         businesses, landmarks, and geographic features, for example,
         Starbucks.DISTANCE_MARKER-The match will be limited to a street
         address that
         represents the linear distance along a street, typically in kilometers
         or miles, from a designated origin location, for example, Mile 25 I-5
         N, San Diego, CA.
     location_type {String}:
         Specifies the preferred output geometry that will be returned for
         POINT_ADDRESS matches. The options for this parameter are
         ROUTING_LOCATION, which is the side of street location that can be
         used for routing and ADDRESS_LOCATION, which is the location that
         represents the rooftop, parcel centroid for the address, or front
         door. If the preferred location does not exist in the data, the
         default location of ROUTING_LOCATION will be returned. For geocode
         results with Addr_type=PointAddress, the x,y attribute values describe
         the coordinates of the address along the street, and the DisplayX and
         DisplayY values describe the rooftop or building centroid coordinates.
         See the REST API web help for details about the locationType parameter
         for reverseGeocode.This parameter is not supported for all
         locators.ADDRESS_LOCATION-Geometry for geocode results that represent
         an
         address location such as a rooftop, building centroid, or front door
         will be returned.ROUTING_LOCATION-Geometry for geocode results that
         represent a
         location close to the side of the street that can be used for vehicle
         routing, will be returned. This is the default.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output feature class.Saving the output to shapefile format is not
         supported due to
         shapefile limitations."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.ReverseGeocode_geocoding(
                *gp_fixargs(
                    (
                        in_features,
                        in_address_locator,
                        out_feature_class,
                        address_type,
                        search_distance,
                        feature_type,
                        location_type,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Data Preparation toolset
@gptooldoc("AssignStreetsToPoints_geocoding", None)
def AssignStreetsToPoints(
    in_point_features=None,
    point_field_mapping=None,
    in_street_features=None,
    street_field_mapping=None,
    out_points=None,
    street_fields=None,
    distance=None,
    output_geometry: Literal["INPUT_POINT_GEOMETRY", "STREET_POINT_GEOMETRY"] | None = None,
    country_code: Literal[
        "AS_DEFINED_IN_DATA",
        "ASM",
        "AUT",
        "AUS",
        "BEL",
        "CAN",
        "CHE",
        "CZE",
        "DEU",
        "ESP",
        "EST",
        "FRA",
        "GBR",
        "GUM",
        "IND",
        "ISR",
        "ITA",
        "JPN",
        "KOR",
        "LTU",
        "LVA",
        "MNP",
        "NLD",
        "NOR",
        "PRI",
        "SWE",
        "UMI",
        "USA",
        "VIR",
        "ZAF",
    ]
    | None = None,
    language_code: Literal[
        "AS_DEFINED_IN_DATA",
        "BAQ",
        "CAT",
        "CZE",
        "DUT",
        "ENG",
        "EST",
        "FRE",
        "GER",
        "GLG",
        "HEB",
        "ITA",
        "JPN",
        "KOR",
        "LAV",
        "LIT",
        "NOR",
        "SPA",
        "SWE",
    ]
    | None = None,
) -> Result1[str]:
    """AssignStreetsToPoints_geocoding(in_point_features, point_field_mapping;point_field_mapping..., in_street_features, street_field_mapping;street_field_mapping..., out_points, {street_fields;street_fields...}, {distance}, {output_geometry}, {country_code}, {language_code})

       Finds the best street feature candidate for a point using address
       information, such as house numbers and street names, as well as
       distance. Address information is prioritized over distance.

    INPUTS:
     in_point_features (Feature Layer):
         The input point feature class or layer.
     point_field_mapping (Value Table):
         The mapping of street address component fields from the point features
         that will be used to compare the full street name to the full street
         name in the in_street_features parameter value to calculate the street
         segment that the point is linked to. Provide the street address
         component field names and data
         field names from the in_point_features parameter value using the
         available address components as follows:        STREET_PREFIX_DIR-A
         direction that precedes the street name, such as
         the W in W. Redlands Blvd.STREET_PREFIX_TYPE-A street type that
         precedes the street name, such
         as Avenue in Avenue B.STREET_NAME-The name of the street, such as
         Cherry in Cherry Rd.STREET_SUFFIX_TYPE-A street type that follows the
         street name, such as
         St. in New York St.STREET_SUFFIX_DIR-A direction that follows the
         street name, such as NW
         in Bridge St. NW.STREET_FULL_NAME-The full street name of the address,
         such as S.
         Orange St.HOUSE_NUMBER-The house number associated with an address,
         such as 380
         in 380 New York St.CITY-The city associated with an address, such as
         Redlands in 380 New
         York St., Redlands, Ca.STATE-The state associated with an address,
         such as Ca in 380 New York
         St., Redlands, Ca.COUNTRY_CODE-The three-character code for country,
         such as CAN for
         Canada.LANGUAGE_CODE-The three-character language code representing
         the
         language of the address, such as ENG for English.
     in_street_features (Feature Layer):
         The input street feature class or layer from which attributes will be
         assigned to the in_point_features parameter value.
     street_field_mapping (Value Table):
         The mapping of street address component fields from the street
         features that will be used to compare the full street name to the full
         street name in the in_point_features parameter value to calculate the
         street segment that point is linked to.Provide the street address
         component field names and data field names
         from the in_street_features parameter value using the available
         address components as follows:STREET_PREFIX_DIR-A direction that
         precedes the street name, such as
         the W in W. Redlands Blvd.STREET_PREFIX_TYPE-A street type that
         precedes the street name, such
         as Avenue in Avenue B.STREET_NAME-The name of the street, such as
         Cherry in Cherry Rd.STREET_SUFFIX_TYPE-A street type that follows the
         street name, such as
         St. in New York St.STREET_SUFFIX_DIR-A direction that follows the
         street name, such as NW
         in Bridge St. NW.STREET_FULL_NAME-The full street name of the address,
         such as S.
         Orange St.HOUSE_NUMBER_FROM_LEFT-A value representing the beginning
         number of a
         house number range on the left side of the
         street.HOUSE_NUMBER_TO_LEFT-A value representing the ending number of
         a house
         number range on the left side of the street.HOUSE_NUMBER_FROM_RIGHT-A
         value representing the beginning number of a
         house number range on the right side of the
         street.HOUSE_NUMBER_TO_RIGHT-A value representing the ending number of
         a
         house number range on the right side of the street.LEFT_CITY-A value
         representing the city associated with the address on
         the left side of the street.RIGHT_CITY-A value representing the city
         associated with the address
         on the right side of the street.LEFT_STATE-A value representing the
         state associated with the address
         on the left side of the street.RIGHT_STATE-A value representing the
         state associated with the address
         on the right side of the street.COUNTRY_CODE-A value representing the
         three-character code for
         country, such as CAN for Canada.LANGUAGE_CODE-A value representing the
         three-character language code
         of the address, such as ENG for English.
     street_fields {Field}:
         The fields from the in_street_features parameter value that will be
         assigned to the out_points parameter value. Specify fields from the
         input street features that contain attributes to assign to the linked
         point features, for example, a field that contains a street ID value.
         The fields will be added to the out_points parameter value.
     distance {Double}:
         The distance that will be used to find the nearest street feature to
         the point feature. The higher the distance limit, the more time it
         will take the tool to run, but the quality of the matches improves.
         The default value is 100 meters.
     output_geometry {String}:
         Specifies the geometry that will be included in the output point
         feature class.INPUT_POINT_GEOMETRY-Geometry for the original input
         point feature
         class will be included in the output point feature
         class.STREET_POINT_GEOMETRY-Geometry for the street location of the
         linked
         point will be included in the output point feature class.
     country_code {String}:
         Specifies where country-specific logic will be applied to the input
         data for assigning street segment attributes to point features.It can
         be specified using the AS_DEFINED_IN_DATA option and mapping a
         value from in_point_features and in_street_features parameters in both
         point_field_mapping and street_field_mapping parameters, or it can be
         applied to the entire dataset by specifying the three-character
         country code name.AS_DEFINED_IN_DATA-The three-character country code
         value defined in
         the reference data for each feature will be used.ASM-American
         SamoaAUS-AustraliaAUT-AustriaBEL-BelgiumCAN-CanadaCHE-SwitzerlandCZE-
         CzechiaDEU-GermanyESP-SpainEST-EstoniaFRA-FranceGBR-Great
         BritainGUM-GuamIND-IndiaISR-IsraelITA-ItalyJPN-JapanKOR-South
         KoreaLTU-LithuaniaLVA-LatviaMNP-Northern Mariana
         IslandsNLD-NetherlandsNOR-NorwayPRI-Puerto RicoSWE-SwedenVIR-U.S.
         Virgin IslandsUSA-United StatesUMI-Minor Outlying Islands of the
         United StatesZAF-South Africa
     language_code {String}:
         Specifies where language-specific logic will be applied to the input
         data for assigning street segment attributes to point features.It can
         be specified using the AS_DEFINED_IN_DATA option and mapping a
         value from in_point_features and in_street_features parameters in both
         the point_field_mapping and street_field_mapping parameters, or it can
         be applied to the entire dataset by specifying a language using the
         three-character language code.AS_DEFINED_IN_DATA-The three-character
         language code value defined in
         the reference data for each feature will be
         used.BAQ-BasqueCAT-CatalanCZE-CzechDUT-DutchENG-EnglishEST-EstonianFR
         E-FrenchGER-GermanGLG-GalicianHEB-HebrewITA-ItalianJPN-JapaneseKOR-
         KoreanLIT-LithuanianLAV-LatvianNOR-NorwegianSPA-SpanishSWE-Swedish

    OUTPUTS:
     out_points (Feature Class):
         The output point feature class containing the street fields assigned
         to the point."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AssignStreetsToPoints_geocoding(
                *gp_fixargs(
                    (
                        in_point_features,
                        point_field_mapping,
                        in_street_features,
                        street_field_mapping,
                        out_points,
                        street_fields,
                        distance,
                        output_geometry,
                        country_code,
                        language_code,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("AssignZonesToStreets_geocoding", None)
def AssignZonesToStreets(
    in_street_features=None,
    zone_features=None,
    zone_fields=None,
    out_streets=None,
    tolerance=None,
) -> Result1[str]:
    """AssignZonesToStreets_geocoding(in_street_features, zone_features, zone_fields;zone_fields..., out_streets, {tolerance})

       Assigns left and right administrative zone values-such as
       neighborhood, city, metro, or postal code-to street line segments for
       street addresses.

    INPUTS:
     in_street_features (Feature Layer):
         The input street feature class or layer.
     zone_features (Feature Layer):
         The input administrative zone feature class or layer.
     zone_fields (Field):
         The fields from the zone_features parameter value that will be
         assigned to the in_street_features parameter value.
     tolerance {Double}:
         The tolerance of the in_street_features parameter value that increases
         the width of the line feature on both sides to determine which
         zone_features values will be on the left and the right to account for
         data and digitization quality issues.The default value is 10 meters.

    OUTPUTS:
     out_streets (Dataset):
         The output street feature class or layer that contains the
         administrative zone assigned to the left and right sides of the street
         segment based on the direction the line was digitized."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.AssignZonesToStreets_geocoding(
                *gp_fixargs((in_street_features, zone_features, zone_fields, out_streets, tolerance), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SplitAddressIntoComponents_geocoding", None)
def SplitAddressIntoComponents(
    country_code: Literal[
        "AUS",
        "AUT",
        "BEL",
        "CAN",
        "CHE",
        "CZE",
        "DEU",
        "ESP",
        "EST",
        "FRA",
        "GBR",
        "ISR",
        "ITA",
        "LTU",
        "LVA",
        "NLD",
        "PRI",
        "SWE",
        "USA",
        "ZAF",
    ]
    | None = None,
    in_address_data=None,
    in_address_fields=None,
    out_address_data=None,
    in_exceptions=None,
) -> Result1[str]:
    """SplitAddressIntoComponents_geocoding(country_code, in_address_data, in_address_fields;in_address_fields..., out_address_data, {in_exceptions})

       Splits street address information into address components and creates
       a table or feature class with the additional components added as
       unique fields.

    INPUTS:
     country_code (String):
         Specifies the country addressing structure that will be used to split
         addresses into components.The default is the regional setting of the
         operating system.AUS-The address structure of Australia will be
         used.AUT-The address
         structure of Austria will be used.BEL-The address structure of Belgium
         will be used.CAN-The address structure of Canada will be used.CHE-The
         address structure of Switzerland will be used.CZE-The address
         structure of Czechia will be used.DEU-The address structure of Germany
         will be used.ESP-The address structure of Spain will be used.EST-The
         address structure of Estonia will be used.FRA-The address structure of
         France will be used.GBR-The address structure of Great Britain will be
         used.ISR-The address structure of Israel will be used.ITA-The address
         structure of Italy will be used.LTU-The address structure of Lithuania
         will be used.LVA-The address structure of Latvia will be used.NLD-The
         address structure of Netherlands will be used.PRI-The address
         structure of Puerto Rico will be used.SWE-The address structure of
         Sweden will be used.USA-The address structure of United States will
         be used.ZAF-The address structure of South Africa will be used.
     in_address_data (Table View):
         The table or feature class containing street address information that
         will be split into individual address components.Zone information,
         such as city, neighborhood, subregion, and postal
         code, is not supported.
     in_address_fields (String):
         The field or fields in the input table or feature class that, when
         concatenated, will form the street address to be split. Zone
         information, such as city, neighborhood, subregion, and postal code,
         is not supported.The order in which the fields are selected is the
         order the fields
         will be concatenated.
     in_exceptions {Table View}:
         The table that contains street parsing exceptions.The table can be in
         any supported table format.

    OUTPUTS:
     out_address_data (Dataset):
         The output feature class or table that will contain the split street
         address data."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SplitAddressIntoComponents_geocoding(
                *gp_fixargs((country_code, in_address_data, in_address_fields, out_address_data, in_exceptions), True)
            )
        )
        return retval
    except Exception as e:
        raise e


# Portal toolset
@gptooldoc("GeocodeFile_geocoding", None)
def GeocodeFile(
    in_table=None,
    locator=None,
    address_fields=None,
    output_type: Literal["CSV", "FEATURE_CLASS", "XLS"] | None = None,
    output_location=None,
    output_name=None,
    country=None,
    location_type: Literal["ROUTING_LOCATION", "ADDRESS_LOCATION"] | None = None,
    category=None,
    output_fields: Literal["ALL", "MINIMAL", "MINIMAL_AND_USER", "LOCATION_ONLY"] | None = None,
) -> Result2[str, str]:
    """GeocodeFile_geocoding(in_table, locator, address_fields, output_type, output_location, output_name, {country;country...}, {location_type}, {category;category...}, {output_fields})

       Converts large local tables of addresses or places into points in a
       feature class or as a CSV or XLS table. This tool uses locators hosted
       on an ArcGIS Enterprise portal.

    INPUTS:
     in_table (Record Set):
         The input table that contains addresses or places to geocode in CSV,
         XLS, or XLSX format or in a file geodatabase table.
     locator (Address Locator):
         The portal locator that will be used to geocode the table.You can
         choose a locator from the populated list of locators on the
         active portal or browse the active portal for other available
         locators. Locators that have been set as utility services on the
         active portal will be available by default.The ArcGIS World Geocoding
         Service is disabled for this tool. Use the
         Geocode Addresses tool if you want to use the ArcGIS World Geocoding
         Service.
     address_fields (Field Info):
         Each field mapping in this parameter is in the format
         input_locator_field, table_field_name in whichis the name of the input
         address field specified by the locator, andis the name of the
         corresponding field in the table of addresses you want to geocode.
         input_locator_fieldtable_field_name        You can specify a single
         input field that stores the complete
         address, for example, 303 Peachtree St NE, Atlanta, GA 30308.
         Alternatively, you can specify multiple fields if the input addresses
         are divided into multiple fields such as,,, andfor a general United
         States address. You can also specify a single input field that stores
         the complete address, for example, 303 Peachtree St NE, Atlanta, GA
         30308, and a field that stores the country associated with the
         address, for example, USA. AddressCityStateZIP        Some
         locators support multiple input addresses fields such
         as,, and. In this case, the address component can be separated into
         multiple fields and the address fields will be concatenated at the
         time of geocoding. For example, 100, Main st, and Apt 140 across three
         fields or 100 Main st and Apt 140 across two fields, both become 100
         Main st Apt 140 when geocoding. AddressAddress2Address3If you
         do not map an optional input address field used by the locator
         to a field in the input table of addresses, specify that there is no
         mapping using <None> in place of a field name.
     output_type (String):
         Specifies the file type to which the geocode results will be
         written.CSV-A .csv file will be returned.FEATURE_CLASS-A feature class
         in a
         file geodatabase will be returned.XLS-An .xls file will be returned.
     output_location (Workspace):
         The folder where the output geocoding results will be written.If the
         output is a .csv or .xls file, an output file will be placed in
         the specified folder.If the output is a feature class, an output file
         geodatabase will be
         created and placed in the specified folder, and the new file
         geodatabase will contain the geocoded feature class. The output file
         geodatabase and feature class in the file geodatabase will have the
         same name.
     output_name (String):
         The name of the output geocoded results.
     country {String}:
         The country or countries that will be searched for the geocoded
         addresses. This parameter is available for locators that
         support a
         country parameter and will limit geocoding to the specified countries.
         Specifying a country will improve the accuracy of geocoding in most
         cases. If a field representing countries in the in_table parameter is
         mapped to thefield in address_fields, the country value from the
         in_table parameter will override the country parameter.
         CountryThis is limited to the specified country or countries. If no
         country
         is specified, geocoding is performed on all supported countries of the
         locator.Specify the value as either two-character or three-character
         country
         codes in a comma-separated list. See the Supported Country Codes
         column for the input value to use.The country parameter is not
         supported for all locators.
     location_type {String}:
         Specifies the preferred output geometry that will be returned for
         POINT_ADDRESS matches. The options for this parameter are
         ROUTING_LOCATION, which is the side of street location that can be
         used for routing and ADDRESS_LOCATION, which is the location that
         represents the rooftop, parcel centroid for the address, or front
         door. If the preferred location does not exist in the data, the
         default location of ROUTING_LOCATION will be returned. For geocode
         results with Addr_type=PointAddress, the x,y attribute values describe
         the coordinates of the address along the street, and the DisplayX and
         DisplayY values describe the rooftop or building centroid coordinates.
         See the ArcGIS REST API web help for details about the locationType
         parameter for geocodeAddresses.This parameter is not supported for all
         locators.ADDRESS_LOCATION-Geometry for geocode results that represent
         an
         address location such as a rooftop location, parcel centroid, or front
         door will be returned.ROUTING_LOCATION-Geometry for geocode results
         that represent a
         location close to the side of the street that can be used for vehicle
         routing will be returned. This is the default.
     category {String}:
         Limits the types of places the locator searches, eliminating
         false positive matches and potentially speeding up the search process.
         When no category is used, geocoding is performed using all supported
         categories. Not all category values are supported for all locations
         and countries. In general, this parameter can be used for the
         following:        Limit matches to specific place types or address
         levelsAvoid fallback
         matches to unwanted address levelsDisambiguate coordinate searchesThis
         parameter is not supported for all locators.See the ArcGIS REST API
         web help for details about category filtering.
     output_fields {String}:
         Specifies the locator output fields that will be returned in the
         geocode results.This parameter can be used with input locators created
         with the Create
         Locator or Create Feature Locator tool published to Enterprise 10.9 or
         later. Composite locators that contain at least one locator created
         with the Create Address Locator tool do not support this
         parameter.ALL-Includes all available locator output fields in the
         geocode
         results. This is the default. LOCATION_ONLY-Thefield will be
         stored if the geocode result
         is a feature class. Theandfields will be stored if the result is
         either a .csv or .xls file. The original field names from the in_table
         parameter will be maintained with their original field names.
         ShapeShape XShape Y         MINIMAL-Adds the following fields that
         describe the location
         and how well it matches information in the locator in the geocode
         results:,,,,, and. The original field names from the in_table
         parameter value will be maintained.
         ShapeStatusScoreMatch_typeMatch_addrAddr_type
         MINIMAL_AND_USER-Adds the following fields that describe the
         location and how well it matches information in the locator in the
         geocode results, as well as any user-defined custom output
         fields:,,,,, and. The original field names from the in_table parameter
         value will be maintained.
         ShapeStatusScoreMatch_typeMatch_addrAddr_type"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GeocodeFile_geocoding(
                *gp_fixargs(
                    (
                        in_table,
                        locator,
                        address_fields,
                        output_type,
                        output_location,
                        output_name,
                        country,
                        location_type,
                        category,
                        output_fields,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GeocodeLocationsFromTable_geocoding", None)
def GeocodeLocationsFromTable(
    in_table=None,
    in_address_locator=None,
    address_fields=None,
    output_name=None,
    country=None,
    location_type: Literal["ROUTING_LOCATION", "ADDRESS_LOCATION"] | None = None,
    category=None,
    output_fields: Literal["ALL", "MINIMAL", "MINIMAL_AND_USER", "LOCATION_ONLY"] | None = None,
) -> Result1[str | FeatureSet]:
    """GeocodeLocationsFromTable_geocoding(in_table, in_address_locator, address_fields, output_name, {country;country...}, {location_type}, {category;category...}, {output_fields})

       Geocodes hosted tables using locators hosted on an ArcGIS Enterprise
       portal, which creates a hosted feature layer containing the geocoded
       results.

    INPUTS:
     in_table (Record Set):
         The table on the portal that contains the addresses or places that
         will be geocoded.
     in_address_locator (Address Locator):
         The portal locator that will be used to geocode the input table from
         the portal.You can choose a locator from the populated list of
         locators on the
         active portal or browse the active portal for other available
         locators. Locators that have been set as utility services on the
         active portal will be available by default. If the portal locator you
         want to use is not in the populated list, ask your portal
         administrator to add the locator as a portal utility service, and
         configure the locator for batch geocoding.The ArcGIS World Geocoding
         Service is disabled for this tool. Use the
         Geocode Addresses tool if you want to use the ArcGIS World Geocoding
         Service.
     address_fields (Field Info):
         Each field mapping in this parameter is in the formatin
         whichis the name of the input address field specified by the locator,
         andis the name of the corresponding field in the table of addresses
         you want to geocode. input_locator_field,
         table_field_nameinput_locator_fieldtable_field_name        You can
         specify a single input field that stores the complete
         address, for example, 303 Peachtree St NE, Atlanta, GA 30308.
         Alternatively, you can specify multiple fields if the input addresses
         are divided into multiple fields such as,,, andfor a general United
         States address. You can also specify a single input field that stores
         the complete address, for example, 303 Peachtree St NE, Atlanta, GA
         30308, and a field that stores the country associated with the
         address, for example, USA. AddressCityStateZIP        Some
         locators support multiple input address fields, such as,,
         and. In this case, the address component can be separated into
         multiple fields, and the address fields will be concatenated at the
         time of geocoding. For example, 100, Main St, and Apt 140 across three
         fields or 100 Main St and Apt 140 across two fields, both become 100
         Main St Apt 140 when geocoding. AddressAddress2Address3If you
         do not map an optional input address field used by the locator
         to a field in the input table of addresses, specify that there is no
         mapping using <None> in place of a field name.
     output_name (String):
         The name of the output geocoded feature layer that will be created on
         the portal.
     country {String}:
         The country or countries that will be searched for the geocoded
         addresses. This parameter is available for locators that
         support a
         country parameter and will limit geocoding to the specified countries.
         Specifying a country will improve the accuracy of geocoding in most
         cases. If a field representing countries in the in_table parameter is
         mapped to thefield for the address_fields parameter, the country value
         from the in_table parameter will override this parameter.
         CountryThis is limited to the specified country or countries. If no
         country
         is specified, geocoding is performed on all supported countries of the
         locator.Specify the value as either two-character or three-character
         country
         codes in a comma-separated list. See the Supported Country Codes
         column for the input value to use.This parameter is not supported for
         all locators.
     location_type {String}:
         Specifies the preferred output geometry that will be returned for
         POINT_ADDRESS matches. The options for this parameter are
         ROUTING_LOCATION, which is the side of street location that can be
         used for routing and ADDRESS_LOCATION, which is the location that
         represents the rooftop, parcel centroid for the address, or front
         door. If the preferred location does not exist in the data, the
         default location of ROUTING_LOCATION will be returned. For geocode
         results with Addr_type=PointAddress, the x,y attribute values describe
         the coordinates of the address along the street, and the DisplayX and
         DisplayY values describe the rooftop or building centroid coordinates.
         See the ArcGIS REST API web help for details about the locationType
         parameter for geocodeAddresses.This parameter is not supported for all
         locators.ADDRESS_LOCATION-Geometry for geocode results that represent
         an
         address location such as a rooftop location, parcel centroid, or front
         door will be returned.ROUTING_LOCATION-Geometry for geocode results
         that represent a
         location close to the side of the street that can be used for vehicle
         routing will be returned. This is the default.
     category {String}:
         Limits the types of places the locator searches, eliminating
         false positive matches and potentially speeding up the search process.
         When no category is used, geocoding is performed using all supported
         categories. Not all category values are supported for all locations
         and countries. In general, this parameter can be used for the
         following:        Limit matches to specific place types or address
         levelsAvoid fallback
         matches to unwanted address levelsDisambiguate coordinate searchesThis
         parameter is not supported for all locators.See the ArcGIS REST API
         web help for details about category filtering.
     output_fields {String}:
         Specifies the locator output fields that will be returned in the
         geocode results.This parameter can be used with input locators created
         with the Create
         Locator or Create Feature Locator tool published to Enterprise 10.9 or
         later. Composite locators that contain at least one locator created
         with the Create Address Locator tool do not support this
         parameter.ALL-Includes all available locator output fields in the
         geocode
         results. This is the default. LOCATION_ONLY-Stores thefield in
         the geocode results. The
         original field names from the in_table parameter value will be
         maintained with their original field names. Shape
         MINIMAL-Adds the following fields that describe the location
         and how well it matches information in the locator in the geocode
         results:,,,,, and. The original field names from the in_table
         parameter value will be maintained.
         ShapeStatusScoreMatch_typeMatch_addrAddr_type
         MINIMAL_AND_USER-Adds the following fields that describe the
         location and how well it matches information in the locator in the
         geocode results, as well as any user-defined custom output
         fields:,,,,, and. The original field names from the in_table parameter
         value will be maintained.
         ShapeStatusScoreMatch_typeMatch_addrAddr_type"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GeocodeLocationsFromTable_geocoding(
                *gp_fixargs(
                    (
                        in_table,
                        in_address_locator,
                        address_fields,
                        output_name,
                        country,
                        location_type,
                        category,
                        output_fields,
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

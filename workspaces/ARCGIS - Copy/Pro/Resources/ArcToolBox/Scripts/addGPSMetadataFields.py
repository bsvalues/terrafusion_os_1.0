"""
   Copyright 2020 Esri
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.​
    This sample adds and updates GNSS metadata fields in a feature class.
"""
import arcpy
import argparse


def check_and_create_domains(geodatabase, is_point_layer):
    """
    Checks if the domains already exist, if they do
    then it checks the values and ranges

    If the domains do not exist, they are created

    :param geodatabase: (string) the path to the geodatabase to check
    :return:
    """
    domains = arcpy.da.ListDomains(geodatabase)
    domain_names = [domain.name for domain in domains]
    if "ESRI_FIX_TYPE_DOMAIN" in domain_names:
        for domain in domains:
            if domain.name == "ESRI_FIX_TYPE_DOMAIN":
                # check if cvs 0,1,2,4,5 are in the codedValues
                values = [cv for cv in domain.codedValues]
                if not set(set([0, 1, 2, 4, 5])).issubset(values):
                    arcpy.AddIDMessage("ERROR", 355)
                    return
    else:
        # Add the domain and values
        domain_name = "ESRI_FIX_TYPE_DOMAIN"
        arcpy.CreateDomain_management(
            in_workspace=geodatabase,
            domain_name=domain_name,
            domain_description="Fix Type",
            field_type="SHORT",
            domain_type="CODED",
            split_policy="DEFAULT",
            merge_policy="DEFAULT",
        )

        for code, code_description in [
            ("0", "Fix not valid"),
            ("1", "GPS"),
            ("2", "Differential GPS"),
            ("4", "RTK Fixed"),
            ("5", "RTK Float"),
        ]:
            arcpy.AddCodedValueToDomain_management(
                in_workspace=geodatabase,
                domain_name=domain_name,
                code=code,
                code_description=code_description,
            )

    if not is_point_layer:
        return

    # Check if 'NumSats" is a domain, if so check the range
    if "ESRI_NUM_SATS_DOMAIN" in domain_names:
        if domain.name == "ESRI_NUM_SATS_DOMAIN":
            if domain.range[0] != 0 or domain.range[1] != 99:
                arcpy.AddIDMessage("ERROR", 355)
                return
    else:
        # Add the domain and set the range
        arcpy.CreateDomain_management(
            in_workspace=geodatabase,
            domain_name="ESRI_NUM_SATS_DOMAIN",
            domain_description="Number of Satellites",
            field_type="SHORT",
            domain_type="RANGE",
            split_policy="DEFAULT",
            merge_policy="DEFAULT",
        )
        arcpy.SetValueForRangeDomain_management(
            geodatabase, "ESRI_NUM_SATS_DOMAIN", 0, 99
        )

    # Check if 'StationID" is a domain, if so check the range
    if "ESRI_STATION_ID_DOMAIN" in domain_names:
        if domain.name == "ESRI_STATION_ID_DOMAIN":
            if domain.range[0] != 0 or domain.range[1] != 1023:
                arcpy.AddIDMessage("ERROR", 355)
                return
    else:
        # Add the domain and set the range
        arcpy.CreateDomain_management(
            in_workspace=geodatabase,
            domain_name="ESRI_STATION_ID_DOMAIN",
            domain_description="Station ID",
            field_type="SHORT",
            domain_type="RANGE",
            split_policy="DEFAULT",
            merge_policy="DEFAULT",
        )
        arcpy.SetValueForRangeDomain_management(
            geodatabase, "ESRI_STATION_ID_DOMAIN", 0, 1023
        )

    if "ESRI_POSITIONSOURCETYPE_DOMAIN" in domain_names:
        for domain in domains:
            if domain.name == "ESRI_POSITIONSOURCETYPE_DOMAIN":
                # check if cvs 0,1,2,3,4,5 are in the codedValues
                values = [cv for cv in domain.codedValues]
                code_descs = [
                    "Unknown",
                    "User defined",
                    "Integrated (System) Location Provider",
                    "External GNSS Receiver",
                    "Network Location Provider",
                    "Snapped",
                ]
                for cv in range(6):
                    if cv not in values:
                        arcpy.AddCodedValueToDomain_management(
                            in_workspace=geodatabase,
                            domain_name=domain.name,
                            code=cv,
                            code_description=code_descs[cv],
                        )
                return
    else:
        # Add the domain and values
        domain_name = "ESRI_POSITIONSOURCETYPE_DOMAIN"
        arcpy.CreateDomain_management(
            in_workspace=geodatabase,
            domain_name=domain_name,
            domain_description="Position Source Type",
            field_type="SHORT",
            domain_type="CODED",
            split_policy="DEFAULT",
            merge_policy="DEFAULT",
        )
        for code, code_description in [
            ("0", "Unknown"),
            ("1", "User defined"),
            ("2", "Integrated (System) Location Provider"),
            ("3", "External GNSS Receiver"),
            ("4", "Network Location Provider"),
            ("5", "Snapped"),
        ]:
            arcpy.AddCodedValueToDomain_management(
                in_workspace=geodatabase,
                domain_name=domain_name,
                code=code,
                code_description=code_description,
            )


def add_gnss_fields(feature_layer):
    """
    This adds specific fields required for GPS units to
        auto-populate in collector application

        This will report errors if:
            1) Any of the fields already exist
            2) The layer is not found
            3) The layer is a shapefile

    Example: add_gps_fields(r"C:/temp/test.shp")

    :param feature_layer: (string) The feature layer (shapefile, feature class, etc) to add the fields to
    :return:
    """

    try:
        # need to know dataType of input
        desc = arcpy.Describe(feature_layer)
        dataType = desc.dataType.lower()
        shapeType = desc.shapeType.lower()
        if dataType == "featurelayer":
            dataType = desc.dataElement.dataType.lower()
        # catch invalid inputs
        if dataType == "shapefile":
            arcpy.AddIDMessage("ERROR", 656)
            return

        if dataType != "featureclass":
            arcpy.AddIDMessage("ERROR", 347)
            return

        # check if it's a service or feature class in db
        # Check the domains to see if they exist and are valid
        # will update if necessary

        if "/rest/services" in desc.catalogPath.casefold():
            is_service = True
        else:
            is_service = False
            geodatabase = desc.workspace.catalogPath
            is_point_layer = shapeType == "point"
            check_and_create_domains(geodatabase, is_point_layer)

        # Add the fields
        if shapeType == "point":
            field_names = gnss_fields_pt
        else:
            field_names = gnss_fields_non_pt

            # Enabling attachments is required for management of GPS metadata information for line and polygon layers
            if not is_service:
                arcpy.management.EnableAttachments(feature_layer)

        existing_fields: dict[str, arcpy.Field] = {
            field.name.casefold(): field for field in arcpy.ListFields(feature_layer)
        }
        fields_to_add = []
        domains_to_assign = []
        for field_name in field_names:
            field_def = gnss_field_defs[field_name]
            if field := existing_fields.get(
                field_name.casefold()
            ):  # Field exists, check if there is domain.
                if is_service:  # Can't currently assign domains to feature services.
                    continue
                if domain := field_def.get("field_domain") and not field.domain:
                    domains_to_assign.append([feature_layer, field_name, domain])
            else:
                fields_to_add.append(
                    [
                        field_name,
                        field_def["field_type"],
                        field_def["field_alias"],
                        field_def.get("field_length"),
                        None,
                        field_def.get("field_domain"),
                    ]
                )

        if fields_to_add:
            arcpy.AddFields_management(feature_layer, fields_to_add)
        for domain_to_assign in domains_to_assign:
            arcpy.AssignDomainToField_management(*domain_to_assign)

    except Exception as e:
        arcpy.AddError("{}\n".format(e))
        return


# fields to add to point fc
gnss_fields_pt = [
    "ESRIGNSS_POSITIONSOURCETYPE",
    "ESRIGNSS_RECEIVER",
    "ESRIGNSS_LATITUDE",
    "ESRIGNSS_LONGITUDE",
    "ESRIGNSS_ALTITUDE",
    "ESRIGNSS_H_RMS",
    "ESRIGNSS_V_RMS",
    "ESRIGNSS_FIXDATETIME",
    "ESRIGNSS_FIXTYPE",
    "ESRIGNSS_CORRECTIONAGE",
    "ESRIGNSS_STATIONID",
    "ESRIGNSS_NUMSATS",
    "ESRIGNSS_PDOP",
    "ESRIGNSS_HDOP",
    "ESRIGNSS_VDOP",
    "ESRIGNSS_DIRECTION",
    "ESRIGNSS_SPEED",
    "ESRISNSR_AZIMUTH",
    "ESRIGNSS_AVG_H_RMS",
    "ESRIGNSS_AVG_V_RMS",
    "ESRIGNSS_AVG_POSITIONS",
    "ESRIGNSS_H_STDDEV",
]

# fields to add to non point fc
gnss_fields_non_pt = [
    "ESRIGNSS_AVG_H_RMS",
    "ESRIGNSS_AVG_V_RMS",
    "ESRIGNSS_WORST_H_RMS",
    "ESRIGNSS_WORST_V_RMS",
    "ESRIGNSS_WORST_FIXTYPE",
    "ESRIGNSS_MANUAL_LOCATIONS",
]

# gnss field definitions
gnss_field_defs = {
    "ESRIGNSS_POSITIONSOURCETYPE": {
        "field_type": "SHORT",
        "field_alias": "Position source type",
        "field_is_nullable": "NULLABLE",
        "field_domain": "ESRI_POSITIONSOURCETYPE_DOMAIN",
    },
    "ESRIGNSS_RECEIVER": {
        "field_type": "STRING",
        "field_length": 50,
        "field_alias": "Receiver Name",
        "field_is_nullable": "NULLABLE",
    },
    "ESRIGNSS_LATITUDE": {
        "field_type": "DOUBLE",
        "field_alias": "Latitude",
        "field_is_nullable": "NULLABLE",
    },
    "ESRIGNSS_LONGITUDE": {
        "field_type": "DOUBLE",
        "field_alias": "Longitude",
        "field_is_nullable": "NULLABLE",
    },
    "ESRIGNSS_ALTITUDE": {
        "field_type": "DOUBLE",
        "field_alias": "Altitude",
        "field_is_nullable": "NULLABLE",
    },
    "ESRIGNSS_H_RMS": {
        "field_type": "DOUBLE",
        "field_alias": "Horizontal Accuracy (m)",
        "field_is_nullable": "NULLABLE",
    },
    "ESRIGNSS_V_RMS": {
        "field_type": "DOUBLE",
        "field_alias": "Vertical Accuracy (m)",
        "field_is_nullable": "NULLABLE",
    },
    "ESRIGNSS_FIXDATETIME": {
        "field_type": "Date",
        "field_alias": "Fix Time",
        "field_is_nullable": "NULLABLE",
    },
    "ESRIGNSS_FIXTYPE": {
        "field_type": "SHORT",
        "field_alias": "Fix Type",
        "field_is_nullable": "NULLABLE",
        "field_domain": "ESRI_FIX_TYPE_DOMAIN",
    },
    "ESRIGNSS_CORRECTIONAGE": {
        "field_type": "DOUBLE",
        "field_alias": "Correction Age",
        "field_is_nullable": "NULLABLE",
    },
    "ESRIGNSS_STATIONID": {
        "field_type": "SHORT",
        "field_alias": "Station ID",
        "field_is_nullable": "NULLABLE",
        "field_domain": "ESRI_STATION_ID_DOMAIN",
    },
    "ESRIGNSS_NUMSATS": {
        "field_type": "SHORT",
        "field_alias": "Number of Satellites",
        "field_is_nullable": "NULLABLE",
        "field_domain": "ESRI_NUM_SATS_DOMAIN",
    },
    "ESRIGNSS_PDOP": {
        "field_type": "DOUBLE",
        "field_alias": "PDOP",
        "field_is_nullable": "NULLABLE",
    },
    "ESRIGNSS_HDOP": {
        "field_type": "DOUBLE",
        "field_alias": "HDOP",
        "field_is_nullable": "NULLABLE",
    },
    "ESRIGNSS_VDOP": {
        "field_type": "DOUBLE",
        "field_alias": "VDOP",
        "field_is_nullable": "NULLABLE",
    },
    "ESRIGNSS_DIRECTION": {
        "field_type": "DOUBLE",
        "field_alias": "Direction of travel (°)",
        "field_is_nullable": "NULLABLE",
    },
    "ESRIGNSS_SPEED": {
        "field_type": "DOUBLE",
        "field_alias": "Speed (km/h)",
        "field_is_nullable": "NULLABLE",
    },
    "ESRISNSR_AZIMUTH": {
        "field_type": "DOUBLE",
        "field_alias": "Compass reading (°)",
        "field_is_nullable": "NULLABLE",
    },
    "ESRIGNSS_AVG_H_RMS": {
        "field_type": "DOUBLE",
        "field_alias": "Average Horizontal Accuracy (m)",
        "field_is_nullable": "NULLABLE",
    },
    "ESRIGNSS_AVG_V_RMS": {
        "field_type": "DOUBLE",
        "field_alias": "Average Vertical Accuracy (m)",
        "field_is_nullable": "NULLABLE",
    },
    "ESRIGNSS_AVG_POSITIONS": {
        "field_type": "SHORT",
        "field_alias": "Averaged Positions",
        "field_is_nullable": "NULLABLE",
    },
    "ESRIGNSS_H_STDDEV": {
        "field_type": "DOUBLE",
        "field_alias": "Standard Deviation (m)",
        "field_is_nullable": "NULLABLE",
    },
    "ESRIGNSS_WORST_H_RMS": {
        "field_type": "DOUBLE",
        "field_alias": "Worst Horizontal Accuracy (m)",
        "field_is_nullable": "NULLABLE",
    },
    "ESRIGNSS_WORST_V_RMS": {
        "field_type": "DOUBLE",
        "field_alias": "Worst Vertical Accuracy (m)",
        "field_is_nullable": "NULLABLE",
    },
    "ESRIGNSS_WORST_FIXTYPE": {
        "field_type": "SHORT",
        "field_alias": "Worst Fix Type",
        "field_is_nullable": "NULLABLE",
        "field_domain": "ESRI_FIX_TYPE_DOMAIN",
    },
    "ESRIGNSS_MANUAL_LOCATIONS": {
        "field_type": "LONG",
        "field_alias": "Number of Manual Locations",
        "field_is_nullable": "NULLABLE",
    },
}

if __name__ == "__main__":
    """
    Commandline use to add fields to a layer

    Input: layer names (fully qualified paths)

    Example: python add_gps_fields "C:/temp/test.gdb/test" "C:/temp/test.gdb/test2"
    """
    parser = argparse.ArgumentParser("Add GPS Fields to Feature Layers")
    parser.add_argument("layers", nargs="+", help="The layers to add fields to")
    args = parser.parse_args()
    for layer in args.layers:
        add_gnss_fields(layer)

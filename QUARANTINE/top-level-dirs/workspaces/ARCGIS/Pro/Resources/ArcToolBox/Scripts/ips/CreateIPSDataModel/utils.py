import copy
import os
import re
import tempfile
from typing import Union, List

import arcpy
import ips.const as c
import ips.utils as u
import ips.validation as v


def create_indoors_classes_for_ips(workspace: str,
                                   coordinate_system: str,
                                   feature_classes: Union[List[str], str],
                                   xml_schema_path: str,
                                   tmp_dir: str) -> List[str]:
    """Creates the feature classes in the workspace, using the coordinate system defined.

    Notes: Also, it imports only the necessary domains used by the feature classes.

    Args:
        workspace: path to the target workspace
        coordinate_system: the coordinate system
        feature_classes: names of the feature classes to create, based on the xml schema definition
        xml_schema_path: path to the xml schema defining the feature classes
        tmp_dir: a temporary dictionary to write the edited xml schema before importing it


    Returns:
        The names of the new feature classes created.

    """
    if not feature_classes:
        # if no feature classes are to be created, return an empty list
        return []

    # create missing IPS-enabled Indoors Core Model
    tree = u.read_xml_schema(xml_schema_path=xml_schema_path)
    tree = u.remove_data_elements_in_xml_schema(xml_schema=tree,
                                                data_elements=feature_classes,
                                                is_in_dataset=True)
    tree = u.set_crs_in_xml_schema(xml_schema=tree, coordinate_system=coordinate_system)

    edited_indoors_xml_schema = os.path.join(tmp_dir, "edited_xml_schema.xml")
    u.write_xml_schema(tree=tree, xml_schema_path=edited_indoors_xml_schema)

    # list all the initial feature classes
    arcpy.env.workspace = workspace
    fcs_start = arcpy.ListFeatureClasses()
    for feature_dataset in arcpy.ListDatasets():
        fcs_start.extend(arcpy.ListFeatureClasses(feature_dataset=feature_dataset))

    current_overwrite_option = copy.deepcopy(arcpy.env.overwriteOutput)
    arcpy.env.overwriteOutput = False
    arcpy.ImportXMLWorkspaceDocument_management(
        target_geodatabase=workspace,
        in_file=edited_indoors_xml_schema,
        import_type='SCHEMA_ONLY')
    arcpy.env.overwriteOutput = current_overwrite_option

    # list all the eventual feature classes
    fcs_end = arcpy.ListFeatureClasses()
    for feature_dataset in arcpy.ListDatasets():
        fcs_end.extend(arcpy.ListFeatureClasses(feature_dataset=feature_dataset))

    return list(set(fcs_end) - set(fcs_start))


def ips_enable_pathways(pathways: str) -> None:
    """Adds the "IPS" field and assigns the DOM_BOOLEAN to it in the Pathways Feature Class, if necessary.

    Args:
        pathways: path to the Pathways Feature Class

    Returns:
        None

    """
    ips_field = [f for f in arcpy.ListFields(pathways) if f.name.upper() == "IPS"]

    if not ips_field:
        # IPS field is missing in Pathways, add the field with the domain boolean
        arcpy.management.AddField(in_table=pathways,
                                  field_name="IPS",
                                  field_type="Long",
                                  field_is_nullable=True,
                                  field_domain=c.DOM_BOOLEAN)
    else:
        ips_field = ips_field[0]
        if ips_field.type.upper() == "INTEGER" and ips_field.domain == "":
            # IPS field exists, it's long, but it doesn't have the dom boolean. Just add the domain
            arcpy.management.AssignDomainToField(in_table=pathways,
                                                 field_name="IPS",
                                                 domain_name=c.DOM_BOOLEAN)

    return None


def ips_enable_transitions(transitions: str,
                           workspace: str) -> None:
    """Adds the coded value 1000 : "Entrance / Exit" to the domain used by the Transition Type field of the Transitions
    Feature Class, if necessary.

    Args:
        transitions: the path to the Transitions Feature Class
        workspace: the workspace of the Transitions

    Returns:
        None

    """
    # wild card matches the transition type field case insensitively
    transition_type_field = arcpy.ListFields(transitions, wild_card=c.TRANSITION_TYPE_FIELD_NAME)[0]
    # get the actual domain object
    transition_type_domain = [f for f in arcpy.da.ListDomains(workspace) if f.name.upper() ==
                              transition_type_field.domain.upper()][0]

    if 1000 not in transition_type_domain.codedValues.keys():
        # the domain doesn't have a type 1000, so we can add "Entrance / Exit" it freely!
        arcpy.management.AddCodedValueToDomain(in_workspace=workspace,
                                               domain_name=transition_type_field.domain,
                                               code=1000,
                                               code_description="Entrance / Exit")
    return None


def create_ips_data_model(workspace: str,
                          coordinate_system: str,
                          setup_indoors_model_for_ips: bool = False) -> str:
    """Creates the IPS Data Model.

    This function honors the overwrite option:
    - If the overwrite option is true it deletes any existing dataset of the
    model and creates the whole data model
    - If the overwrite option is false it raises an error if any of the datasets
    of the model exist already in the target workspace

    Args:
        workspace: path to the target workspace
        coordinate_system: the coordinate system
        setup_indoors_model_for_ips: boolean to create/complete/configure IPS Indoors Model:
            - Creates Sites, Facilities, Levels, Units, Details
            - Creates Pathways and adds the IPS field (DOM_BOOLEAN)
            - Creates Transitions and adds type 1000 (entrance/exit) for DOM_TRANSITION_TYPE

    Notes:
        If setup_indoors_model is True, it creates only the missing feature classes and domains, all of which are
        IPS-enabled.

    Returns:
        workspace: path to the target workspace (updated)

    """
    arcpy.env.workspace = workspace
    overwrite_option = arcpy.env.overwriteOutput

    # Feature classes / tables created by the new IPS model
    dataset_names = [c.MODEL_LATEST.IPS_POSITIONING_DATASETS.NAME,
                     c.MODEL_LATEST.IPS_POSITIONING_POINTS.NAME,
                     c.MODEL_LATEST.IPS_POSITIONING_SIGNALS.NAME,
                     c.MODEL_LATEST.IPS_RECORDINGS.NAME,
                     c.MODEL_LATEST.IPS_BEACONS.NAME]

    datasets = [os.path.join(workspace, dataset_name) for dataset_name in dataset_names]

    if not overwrite_option:
        for dataset, dataset_name in zip(datasets, dataset_names):
            # Overwrite is False and part of the IPS Model exists, throw error!
            if arcpy.Exists(dataset):
                arcpy.AddIDMessage('ERROR', 605, dataset_name, workspace)
    else:
        for dataset in datasets:
            # Overwrite is True and part of the IPS Model exists, delete it!
            if arcpy.Exists(dataset):
                arcpy.Delete_management(dataset)

    with tempfile.TemporaryDirectory() as tmp_dir:
        # create IPS data model
        edited_xml_schema_path = u.edit_dataset_xml_schema(
            in_xml_schema_path=c.MODEL_LATEST.XML_PATH,
            data_dir=tmp_dir,
            coordinate_system=coordinate_system)
        arcpy.ImportXMLWorkspaceDocument_management(
            target_geodatabase=workspace,
            in_file=edited_xml_schema_path,
            import_type='SCHEMA_ONLY')

        if setup_indoors_model_for_ips:
            # setup IPS-enabled Indoors Model

            # determine which feature classes are missing from Sites, Facilities, Levels, Units, Details
            # based on the INDOORS MODEL DEFINITION and the IPS required fields
            indoors_fcs_to_create = []
            fcs = [c.SITES_NAME, c.FACILITIES_NAME, c.LEVELS_NAME, c.UNITS_NAME, c.DETAILS_NAME]
            fields = [[c.SITE_ID_FIELD_NAME], [c.FACILITY_ID_FIELD_NAME, c.SITE_ID_FIELD_NAME],
                      [c.LEVEL_ID_FIELD_NAME, c.FACILITY_ID_FIELD_NAME, c.VERTICAL_ORDER, c.LEVELS_NAME],
                      [c.LEVEL_ID_FIELD_NAME, c.USE_TYPE_FIELD_NAME, c.UNIT_ID_FIELD_NAME],
                      [c.LEVEL_ID_FIELD_NAME, c.USE_TYPE_FIELD_NAME, c.DETAIL_ID_FIELD_NAME]]

            for fc_name, fields_to_check in zip(fcs, fields):
                fc_path = os.path.join(workspace, fc_name)
                if not (arcpy.Exists(fc_path) and v.check_schema(data_element=fc_path,
                                                                 xml_schema_path=c.INDOORS_MODEL_XML_SCHEMA_PATH,
                                                                 xml_element_name=fc_name,
                                                                 fields_to_check=fields_to_check,
                                                                 field_attr_filter=["name", "type"],
                                                                 is_in_dataset=True)):
                    indoors_fcs_to_create.append(fc_name)

            # create missing IPS-enabled Indoors Core Model
            create_indoors_classes_for_ips(workspace=workspace,
                                           coordinate_system=coordinate_system,
                                           feature_classes=indoors_fcs_to_create,
                                           xml_schema_path=c.INDOORS_MODEL_XML_SCHEMA_PATH,
                                           tmp_dir=tmp_dir)

            # determine which feature classes are missing from Pathways, Transitions
            # based on the NETWORK MODEL DEFINITION and the IPS required fields
            network_fcs_to_create = []
            fcs = [c.TRANSITIONS_NAME, c.PATHWAYS_NAME]
            fc_fields = [[c.TRANSITION_TYPE_FIELD_NAME, c.VERTICAL_ORDER_FROM_FIELD_NAME,
                          c.VERTICAL_ORDER_TO_FIELD_NAME, c.FACILITY_ID_FIELD_NAME],
                         [c.FACILITY_ID_FIELD_NAME, c.VERTICAL_ORDER]]

            for fc_name, fields_to_check in zip(fcs, fc_fields):
                fc_path = os.path.join(workspace, fc_name)
                if not (arcpy.Exists(fc_path) and v.check_schema(data_element=fc_path,
                                                                 xml_schema_path=c.TRANSITIONS_XML_SCHEMA_PATH,
                                                                 xml_element_name=fc_name,
                                                                 fields_to_check=fields_to_check,
                                                                 field_attr_filter=["name", "type"],
                                                                 is_in_dataset=True)):
                    network_fcs_to_create.append(fc_name)

            if c.PATHWAYS_NAME not in network_fcs_to_create:
                # we need to create new Pathways if:
                # - they have "IPS" but it's not of type Long (Python: Integer) or
                # - they have "IPS", it is of type Long but the domain is not DOM_BOOLEAN
                ips_field = [f for f in arcpy.ListFields(os.path.join(workspace, c.PATHWAYS_NAME)) if
                             f.name.upper() == "IPS"]

                if ips_field and (ips_field[0].type.upper() != "INTEGER" or
                                  not re.match(rf"{c.DOM_BOOLEAN}*", ips_field[0].domain, re.IGNORECASE)):
                    network_fcs_to_create.append(c.PATHWAYS_NAME)

            if c.TRANSITIONS_NAME not in network_fcs_to_create:
                # we need to create new Transitions if:
                # - the domain type used in transition_type has a type 1000, but it's not "Entrance / Exit"
                transition_type_field = arcpy.ListFields(c.TRANSITIONS_NAME, wild_card=c.TRANSITION_TYPE_FIELD_NAME)[0]
                transition_type_domain = [f for f in arcpy.da.ListDomains(workspace) if
                                          f.name.upper() == transition_type_field.domain.upper()][0]

                if 1000 in transition_type_domain.codedValues.keys() and not re.match(r"Entrance */ *Exit",
                                                                                   transition_type_domain.codedValues[
                                                                                       1000], re.IGNORECASE):
                    network_fcs_to_create.append(c.TRANSITIONS_NAME)

            # create missing Indoors Network Model: Pathways, Transitions (not IPS-enabled yet)
            new_network_fcs = create_indoors_classes_for_ips(workspace=workspace,
                                                             coordinate_system=coordinate_system,
                                                             feature_classes=network_fcs_to_create,
                                                             xml_schema_path=c.TRANSITIONS_XML_SCHEMA_PATH,
                                                             tmp_dir=tmp_dir)

            # get the names of the Pathways and Transitions that need to be IPS-enabled
            pathways = c.PATHWAYS_NAME
            transitions = c.TRANSITIONS_NAME
            for new_fc in new_network_fcs:
                if c.PATHWAYS_NAME in new_fc:
                    pathways = new_fc
                if c.TRANSITIONS_NAME in new_fc:
                    transitions = new_fc

            ips_enable_pathways(pathways=pathways)
            ips_enable_transitions(transitions=transitions, workspace=workspace)

    if arcpy.Describe(workspace).workspaceType == 'LocalDatabase':
        arcpy.Compact_management(workspace)

    return workspace

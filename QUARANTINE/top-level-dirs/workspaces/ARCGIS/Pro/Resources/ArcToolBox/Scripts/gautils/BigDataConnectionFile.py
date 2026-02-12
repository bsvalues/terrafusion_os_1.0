import json
import arcpy
import copy

from .BigDataConnectionUtil import valid_json


class BigDataConnectionFile(object):
    def __init__(self, big_data_connection_path):
        self.big_data_connection = None
        self.big_data_connection_path = big_data_connection_path
        self.big_data_connection_name = big_data_connection_path.split("\\")[-1]
        self.load_connection_file()
        self.format_type_names = \
            {"delimited": "delimited", "parquet": "parquet", "orc": "orc", "shapefile": "shapefile"}

    """
        I/O
    """
    def load_connection_file(self):
        """
        Used to read in a BDC file and set appropriate values
        :return: Boolean if it was able to successfully load the bdc file
        """
        try:
            with open(self.big_data_connection_path, 'rb') as json_file:
                self.big_data_connection = json.load(json_file)
        except TypeError as e:
            arcpy.AddIDMessage("ERROR", 120291, self.big_data_connection_name)
            return False
        except ValueError as e:
            arcpy.AddIDMessage("ERROR", 120291, self.big_data_connection_name)
            return False
        return True

    def update_connection_file(self):
        """
        Write out / update the BDC file
        :return: Boolean that determines it writing out / updating the BDC file was successful
        """
        try:
            with open(self.big_data_connection_path, 'w', encoding='utf-8') as outfile:
                json.dump(self.big_data_connection, outfile, indent=2, ensure_ascii=False)
        except Exception as e:
            arcpy.AddIDMessage("ERROR", 120290, self.big_data_connection_name)
            return False
        return True

    """
        Getters / Setters
    """
    def update_definition(self, new_definition):
        """
        Overrides the existing BDC definition with the passed in one
        :param new_definition:
        :return:
        """
        self.big_data_connection = new_definition

    def update_dataset_by_definition(self, new_dataset_definition):
        """
        Update a single dataset in BDC file based off the dataset name within the passed in definition
        :param new_dataset_definition: dataset definition to replace the existing one with
        :return:
        """
        if new_dataset_definition:
            name = new_dataset_definition['name']
            self.update_dataset_by_name(dataset_name=name, new_dataset_definition=new_dataset_definition)

    def update_dataset_by_name(self, dataset_name, new_dataset_definition):
        """
        Update a single dataset in BDC file
        :param dataset_name:  Name of dataset to update
        :param new_dataset_definition: dataset definition to replace the existing one with
        :return:
        """
        # check that the definition is defined
        if new_dataset_definition:
            dataset_index = self.get_dataset_index(dataset_name)
            # check that the dataset exists
            if dataset_index:
                new_definition = copy.deepcopy(self.big_data_connection)
                new_definition['datasets'][dataset_index] = new_dataset_definition

                self.big_data_connection = new_definition

    """
        BDC queries
    """
    # dataset name
    def get_dataset_name_in_big_data_connection(self, dataset_name: str, definition):
        """
        Search passed in definition for the dataset with the same name as the passed in one.
        Search is case insensitive.
        :param dataset_name: dataset name
        :param definition: definition to search for dataset name
        :return:
        """
        dataset_definition_name = None

        if self.does_dataset_exist_in_definition(dataset_name, definition):
            does_name_exist = self.does_dataset_exist_in_definitionn(dataset_name, definition)
            if does_name_exist:
                for dataset_definition in definition['datasets']:
                    if dataset_name.casefold() == str(dataset_definition['name']).casefold():
                        dataset_definition_name = str(dataset_definition['name'])

        return dataset_definition_name

    def get_dataset_definition_name(self, dataset_name: str):
        """
        Get the dataset name that should be from the BDC's definition
        :param dataset_name: dataset name to find
        :return:
        """
        return self.get_dataset_name_in_big_data_connection(dataset_name, self.big_data_connection)

    # source name
    def get_source_name_from_dataset_definition(self, dataset_definition):
        """
        Get the source name from datset definition. If there is no key for source name then use the dataset name instead
        :param dataset_definition:  dataset definition to search
        :return: source name
        """
        source_name = None
        if dataset_definition:
            if 'sourceName' in dataset_definition:
                source_name = dataset_definition['sourceName']
            else:
                source_name = dataset_definition['name']

        return source_name

    def get_dataset_definition_source_name(self, dataset_name: str):
        """
        Get source name from dataset from this BDC's definition
        :param dataset_name: dataset to search
        :return: source name
        """
        definition = self.get_dataset_definition(dataset_name)
        return self.get_source_name_from_dataset_definition(definition)

    #  Index
    def get_dataset_index_from_big_data_connection(self, dataset_name: str, definition):
        """
           Get the index of dataset name from with the based in definition
           :param dataset_name: name of dataset to get the index for
           :param definition: definition to search
           :return: index of dataset
       """
        dataset_name_index = None

        for dataset_definition_index in range(0, len(definition['datasets'])):
            if dataset_name.casefold() == str(definition['datasets'][dataset_definition_index]['name']).casefold():
                dataset_name_index = dataset_definition_index

        return dataset_name_index

    def get_dataset_index(self, dataset_name: str):
        """
           Get the index of dataset name from this BDC's definition
           :param dataset_name: name of dataset to get the index for
           :return: index of dataset
       """
        return self.get_dataset_index_from_big_data_connection(dataset_name, self.big_data_connection)

    def get_dataset_names_from_definition(self, definition):
        """
        Get all dataset names from passed in definition
        :param definition: BDC definition to get names from
        :return: datset names
        """
        dataset_names = []
        for dataset_definition in definition['datasets']:
            dataset_names.append(str(dataset_definition['name']))
        return dataset_names


    def get_dataset_names(self):
        """
        Get all dataset names from this BDS's definition
        :return: dataset names
        """
        return self.get_dataset_names_from_definition(self.big_data_connection)

    # Existence
    def does_dataset_exist_in_definition(self, dataset_name: str, definition):
        """
        Checks the definition to see first if there is a dataset with the dataset name that matches  the
        passed in name.
        :param dataset_name: Name of dataset to check
        :param definition: definition to check
        :return: Boolean if there exists a dataset with name of the value passed in
        """
        def does_dataset_name_exists_in_big_data_connection(dataset_name: str, definition):
            for dataset_definition in definition['datasets']:
                if dataset_name.casefold() == str(dataset_definition['name']).casefold():
                    return True
            return False

        does_name_exist = does_dataset_name_exists_in_big_data_connection(dataset_name, definition)
        return does_name_exist

    def does_dataset_exist(self, dataset_name: str):
        """
        Checks to see if dataset exists within this BDC's definition with the passed in name.
        :param dataset_name: name of dataset to check for
        :return:
        """
        return self.does_dataset_exist_in_definition(dataset_name, self.big_data_connection)

    # definition
    def get_dataset_definition_from_big_data_connection(self, dataset_name, big_data_connection):
        definition = None
        for dataset_definition in big_data_connection['datasets']:
            if dataset_name.casefold() == str(dataset_definition['name']).casefold():
                definition = dataset_definition
        return definition

    def get_dataset_definition(self, dataset_name: str):
        return self.get_dataset_definition_from_big_data_connection(dataset_name, self.big_data_connection)

    #   Fields
    def get_fields(self, dataset_name: str):
        """
        Get fields from a specific dataset
        :param dataset_name: Name of the dataset to get fields from
        :return: Field definition if dataset exists. Would be a list
        """
        fields_definition = None
        if self.does_dataset_exist(dataset_name):
            dataset_definition = self.get_dataset_definition(dataset_name)
            if 'fields' in dataset_definition:
                fields_definition = dataset_definition['fields']

        return fields_definition

    #   Geometry
    def get_geometry(self, dataset_name: str):
        """
        Get geometry from a specific dataset
        :param dataset_name: Name of the dataset to get geometry from
        :return: Geometry definition if dataset exists. Would be a list
        """
        geometry_definition = None
        if self.does_dataset_exist(dataset_name):
            dataset_definition = self.get_dataset_definition(dataset_name)
            if 'geometry' in dataset_definition:
                geometry_definition = dataset_definition['geometry']

        return geometry_definition

    # Time
    def get_time(self, dataset_name: str):
        """
        Get time from a specific dataset
        :param dataset_name: Name of the dataset to get time from
        :return: Time definition if dataset exists. Would be a list
        """
        time_definition = None
        if self.does_dataset_exist(dataset_name):
            dataset_definition = self.get_dataset_definition(dataset_name)
            if 'time' in dataset_definition:
                time_definition = dataset_definition['time']

        return time_definition

    """
        BDC Python Tools
    """

    def duplicate_dataset(self, dataset_to_copy, new_name):
        """
        Helper function for duplicate datasets
        :param dataset_to_copy: dataset to duplicate
        :param new_name: name to give new dataset
        :return:
        """
        # get source dataset definition
        source_dataset_definition = self.get_dataset_definition(dataset_to_copy)
        # create a copy that will be starting point for the duplication
        dataset_to_copy_definition = copy.deepcopy(source_dataset_definition)

        # Check if dataset to copy exists in BDC
        if dataset_to_copy_definition is None:
            arcpy.AddIDMessage("ERROR", 120276, dataset_to_copy, self.big_data_connection_path)
            return None

        # check to see if proposed new dataset name already exists
        dataset_name_already_exists = self.does_dataset_exist(new_name)

        if dataset_name_already_exists:
            arcpy.AddIDMessage("ERROR", 120294, new_name)
            return None

        # edit copy with sourceName, alias and name
        source_name = self.get_source_name_from_dataset_definition(source_dataset_definition)
        dataset_to_copy_definition['sourceName'] = source_name

        # alias and name keys by default will have the same value
        dataset_to_copy_definition['alias'] = new_name
        dataset_to_copy_definition['name'] = new_name

        return dataset_to_copy_definition

    def duplicate_datasets(self, duplicate_dataset_definitions):
        """

        :param duplicate_dataset_definitions:
        Json format of {'duplicate_datasets': [{"dataset_to_copy": "Cities", "name": "dfgdfg"}]}
        :return:
        """

        new_definition = copy.deepcopy(self.big_data_connection)

        datasets = duplicate_dataset_definitions['duplicate_datasets']
        for dataset in datasets:
            dataset_to_copy = dataset['dataset_to_copy']
            new_name = dataset['name']
            new_dataset = self.duplicate_dataset(dataset_to_copy=dataset_to_copy, new_name=new_name)
            if new_dataset is None:
                arcpy.AddIDMessage("ERROR", 120293, dataset['dataset_to_copy'])
                continue
            new_definition['datasets'].append(new_dataset)

        self.big_data_connection = new_definition

    def remove_dataset(self, definition, dataset_name: str):
        """
        Helper function for remove datasets
        :param definition:
        :param dataset_name:
        :return:
        """

        # check if dataset to remove is currently in the definition
        dataset_name_already_exists = self.does_dataset_exist_in_definition(dataset_name, definition)

        # only remove if dataset exists
        if dataset_name_already_exists:
            # get definition
            remove_dataset_definition = self.get_dataset_definition_from_big_data_connection(dataset_name, definition)
            definition['datasets'].remove(remove_dataset_definition)
            arcpy.AddIDMessage("INFORMATIVE", 120289, dataset_name, self.big_data_connection_name)
        else:
            # Throw error stating dataset does not exist in big data connection file
            arcpy.AddIDMessage("WARNING", 120288, dataset_name, self.big_data_connection_name)

    def remove_datasets(self, remove_dataset_names):
        new_definition = copy.deepcopy(self.big_data_connection)

        for dataset in remove_dataset_names:
            self.remove_dataset(new_definition, dataset)

        self.big_data_connection = new_definition

    # TODO: Implement
    def validate(self):
        """
        Does variation validation to make sure that BDC file is correct.
        Examples:
            - Valid JSON
            - Geometry is valid
            - Time is valid
            - etc
        :return:
        """
        valid_big_data_connection = valid_json(self.big_data_connection)
        if not valid_big_data_connection:
            # big data connection format is not valid json - change message
            arcpy.AddIDMessage("ERROR", 2153, "Connection file is not valid JSON.")

        # check if there is version info
        # if 'version' not in

        return None

    
    def validate_input_bdc_sourcepath(self):
        import os
        source_path_validation = {
            "source_path_validates": False,
            "source_folder_path": ""}
        try:
            source_path_validation["source_folder_path"] = self.big_data_connection['connection']['properties']['path']
            if source_path_validation["source_folder_path"] != "":
                if os.path.isdir(source_path_validation["source_folder_path"]):
                    source_path_validation["source_path_validates"] = True
        except:
            pass

        return source_path_validation
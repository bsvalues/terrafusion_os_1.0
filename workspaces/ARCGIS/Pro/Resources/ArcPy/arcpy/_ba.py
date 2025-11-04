#COPYRIGHT 2020 ESRI
#
#TRADE SECRETS: ESRI PROPRIETARY AND CONFIDENTIAL
#Unpublished material - all rights reserved under the
#Copyright Laws of the United States.
#
#For additional information, contact:
#Environmental Systems Research Institute, Inc.
#Attn: Contracts Dept
#380 New York Street
#Redlands, California, USA 92373
#
#email: contracts@esri.com

"""
Contains the implementation of the Business Analyst dataset discovery methods
"""

__all__ = ["ListDatasets", "ListVariables", "ListGeographyLevels"]

import os, platform, sys, unittest, time, re

try:
    from bapy import *
except ModuleNotFoundError as e:
    # bapy is intentionally excluded on certain deployments
    pass

def get_out_field_name(ge_field_name):
    out_field_name = ge_field_name.replace(".", "_")
    out_field_name = re.sub(r"(^\d+)", r"F\1", out_field_name) # if string starts with a set of digits, replace them with Fdigits
    return out_field_name

class CountryInfo:
    def __init__(self, name = None, iso2 = None, iso3 = None):
        self.ISO2 = iso2
        self.ISO3 = iso3
        self.Name = name

class Dataset:
    def __init__(self, id, countryName, countryIso2, countryIso3, vintage, directory=None,
                 installDirectory=None, networkDatasetPath=None, hasMoe=None):
        self.ID = id
        self.DataSourceID = "LOCAL;;{0}".format(id)

        if countryName:
            self.CountryInfo = CountryInfo(name = countryName, iso2 = countryIso2, iso3 = countryIso3)
            self.Version = vintage
        else:
            self.CountryInfo = CountryInfo(name = "Canada", iso2 = "CA", iso3 = "CAN")
            self.Version = "2020"

class Variable:
    def __init__(self, data_collection, name, alias, units, vintage, percentbase, averagebase):
        self.Name = name
        self.FullName = data_collection + "." + name
        self.Alias = alias
        self.DataCollectionID = data_collection
        self.OutputFieldName = get_out_field_name(self.FullName)
        self.Units = units
        self.Vintage = vintage
        self.PercentBase = percentbase
        self.AverageBase = averagebase

class GeographyLevel:
    def __init__(self, levelID, levelName, isWholeCountry, layerID, idField, nameField,
                 stateNameField, stateAbbrevField, displayName, singularName, pluralName, adminLevel):
        self.LevelID = levelID
        self.LevelName = levelName
        self.IsWholeCountry = isWholeCountry
        self.LayerID = layerID
        self.IDField = idField
        self.NameField = nameField
        self.StateNameField = stateNameField
        self.StateAbbrevField = stateAbbrevField
        self.DisplayName = displayName
        self.SingularName = singularName
        self.PluralName = pluralName
        self.AdminLevel = adminLevel

    def __str__(self):
        return "{0} ({1})".format(self.LevelName, self.LevelID)

class StandardGeography:
    def __init__(self, id, name):
        self.Name = name
        self.ID = id

    def __str__(self):
        return "{0} ({1})".format(self.Name, self.ID)

def ListDatasets():
    datasets = getLocalDatasets()

    for dataset in datasets:
        yield Dataset(dataset["id"], dataset["countryName"], dataset["countryIso2"],
                      dataset["countryIso3"], dataset["vintage"])

def ListVariables(dataset, include_derivatives=False):
    if isinstance(dataset, Dataset):
        dataset_id = dataset.ID
    else:
        dataset_id = dataset

    dataCollections = getDataCollections(dataset_id)

    for dataCollection in dataCollections:
        fields = dataCollection["fields"]
        for field in fields:
            yield Variable(dataCollection["id"], field["name"], field["alias"],
                           field["units"], field["vintage"], field["percentbase"],
                           field["averagebase"])

def ListGeographyLevels(dataset):
    geographyLevels = getGeographyLevels(dataset)

    for geoLevel in geographyLevels:
        yield GeographyLevel(geoLevel["levelID"], geoLevel["levelName"], geoLevel["isWholeCountry"],
                             geoLevel["layerID"], geoLevel["idField"], geoLevel["nameField"],
                             geoLevel["stateNameField"], geoLevel["stateAbbrevField"], geoLevel["displayName"],
                             geoLevel["singularName"], geoLevel["pluralName"], geoLevel["adminLevel"])

def ListStandardGeographies(dataset, level = None, query = None, sublevel = None, subquery = None):
    searchResults = []
    if (level != None and query != None and sublevel != None and subquery != None):
        searchResults = getStandardGeographies(dataset, level, query, sublevel, subquery)
    elif (level != None and query != None and sublevel != None):
        searchResults = getStandardGeographies(dataset, level, query, sublevel)
    elif (level != None and query != None):
        searchResults = getStandardGeographies(dataset, level, query)
    elif (level != None):
        searchResults = getStandardGeographies(dataset, level)
    else:
        searchResults = getStandardGeographies(dataset)

    for stdGeo in searchResults:
        yield StandardGeography(stdGeo["id"], stdGeo["name"])

def BuildDemocalcIndex(params):
    buildDemocalcIndex(params)

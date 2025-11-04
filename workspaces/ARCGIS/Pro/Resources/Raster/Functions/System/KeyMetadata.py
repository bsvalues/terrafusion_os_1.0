#------------------------------------------------------------------------------
# Copyright 2016 Esri
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#------------------------------------------------------------------------------

from utils import loadJSON


class KeyMetadata():

    def __init__(self):
        self.name = "Key Metadata Function"
        self.description = "Override or insert key-metadata of a raster in a function chain."
        self.datasetProps = {}
        self.bandProps = []

    def getParameterInfo(self):
        return [
            {
                'name': 'raster',
                'dataType': 'raster',
                'value': None,
                'displayName': "Raster",
                'required': True,
                'description': "The primary raster input."
            },
            {
                'name': 'property',
                'dataType': 'string',
                'value': '',
                'displayName': "Property Name",
                'required': False,
                'description': "The name of the optional dataset-level key property to override."
            },
            {
                'name': 'value',
                'dataType': 'string',
                'value': None,
                'displayName': "Property Value",
                'required': False,
                'description': "The overriding new value of the dataset-level key property."
            },
            {
                'name': 'bands',
                'dataType': 'string',
                'value': '',
                'displayName': "Band Names",
                'required': False,
                'description': "A comma-separated string representing updated band names."
            },
            {
                'name': 'json',
                'dataType': 'string',
                'value': '',
                'displayName': "Metadata JSON",
                'required': False,
                'description': ("Key metadata to be injected into the outgoing raster described as a "
                                "JSON string representing a collection of key-value pairs. "
                                "Learn more by searching for 'Raster Key Properties' at http://resources.arcgis.com.")
            },
    ]

    def getConfiguration(self, **scalars):
        return {
            'invalidateProperties': 8,          # reset any key properties held by the parent function raster dataset
        }

    def updateRasterInfo(self, **kwargs):
        try:
            jsonInput = kwargs.get('json', "{}")
            if jsonInput:
                jsonInput = jsonInput.strip()
            allProps = loadJSON(jsonInput) if jsonInput else {}
        except ValueError as e:
            raise Exception(str(e))

        #convert all key names to lower case
        allProps = { k.lower(): v for k, v in allProps.items()}

        self.datasetProps = { k : v for k, v in allProps.items() if k != 'bandproperties' }

        # inject name-value pair into bag of properties
        p = kwargs.get('property', "")
        if p:
            p = p.lower() 
            self.datasetProps[p] = kwargs.get('value', None)

        # get bandproperties array from original JSON as a list of dictionaries...
        self.bandProps = []
        for d in allProps.get('bandproperties', []):
            self.bandProps.append(
                { k.lower(): v for k, v in d.items() } if isinstance(d, dict) else None)

        # ensure size of bandProps matches input band count
        bandCount = kwargs['raster_info']['bandCount']
        self.bandProps.extend([{} for k in range(0, bandCount-len(self.bandProps))])

        # inject band names into the bandProps dictionary
        bands = kwargs.get('bands', "")
        if bands:
            bands = bands.strip()
            bandNames = bands.split(',')
            for k in range(0, min(len(self.bandProps), len(bandNames))):
                b = bandNames[k].strip()
                if b: self.bandProps[k]['bandname'] = b

        return kwargs

    def updateKeyMetadata(self, names, bandIndex, **keyMetadata):
        # return keyMetadata dictionary with updated values for entries in [names]...
        properties = self.datasetProps if bandIndex == -1  else self.bandProps[bandIndex]
        if not properties:
            return keyMetadata

        skipCheck = not bool(names)             # => key names are internally generated, not user-specified
        for k in (names or properties):         # iterate over either of those containers
            if skipCheck or k in properties:    # spend time checking for existence only if necessary
                v = properties[k]
                keyMetadata[str(k)] = str(v) if isinstance(v, str) else v

        return keyMetadata

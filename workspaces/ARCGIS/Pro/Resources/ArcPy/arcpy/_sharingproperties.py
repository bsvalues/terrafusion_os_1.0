import arcpy
import functools

def rsetattr(object, attr_name, val):
    prefix, _, suffix = attr_name.rpartition('.')
    return setattr(rgetattr(object, prefix) if prefix else object, suffix, val)

def rgetattr(object, attr_name, *args):
    def _getattr(object, attr_name):
        return getattr(object, attr_name, *args)
    return functools.reduce(_getattr, [object] + attr_name.split('.'))

def _passthrough_attr(attr_name, doc=None):
    """Returns a property for an attribute present down the attribute chain."""
    def _get(self):
        return rgetattr(self, attr_name, None)
    
    def _set(self, value):
        return rsetattr(self, attr_name, value)

    return property(_get, _set, None, doc)

def _passthrough_attr_intpos(attr_name, doc=None):
    """Returns a managed attribute for a positive integer."""
    def _get(self):
        return getattr(self, attr_name, None)
    
    def _set(self, value):
        if not isinstance(value, int) or value < 0:
            raise TypeError(arcpy.GetIDMessage(89449).replace('%1', '%s') % attr_name[1:])
        setattr(self, attr_name, value)

    return property(_get, _set, None, doc)

def _passthrough_attr_decimal(attr_name, doc=None):
    """Returns a managed attribute for a float."""
    def _get(self):
        return getattr(self, attr_name, None)
    
    def _set(self, value):
        if not isinstance(value, (float, int)):
            raise TypeError(arcpy.GetIDMessage(89449).replace('%1', '%s') % attr_name[1:])
        setattr(self, attr_name, value)

    return property(_get, _set, None, doc)

class _ParameterChecker:
    """Class to check sddraft parameters"""

    def __init__(self):
        self._allowed_parameters = {} # list of allowed parameters for this type

    def _isPrimitiveType(self, parameter):
        return isinstance(getattr(self, parameter, None), (int, float, bool, str, type(None)))

    def _validateParameters(self):
        """Recursively validates the names of the parameters set on the object against the list of approved parameter names. Methods and private attributes are skipped."""           
        self_vars = [var for var in dir(self) if not var.startswith('_') and not callable(getattr(self, var))]
        incorrect_parameters = []
        ignore_list = {"draftValue", "cachedAttributes", "analysis"}
        for parameter in self_vars:
            if parameter in ignore_list: continue
            if parameter is not None:
                if not self._isPrimitiveType(parameter):
                    getattr(self, parameter, None)._validateParameters()
                elif parameter not in set(self._allowed_parameters) and not parameter.startswith('_'):
                    incorrect_parameters.append(parameter)
        if len(incorrect_parameters) != 0:
            raise TypeError(arcpy.GetIDMessage(89449).replace('%1', '%r') % (";".join(incorrect_parameters)))

class _PackageSharing(_ParameterChecker):
    """Class to represent sddraft sharing visibility setting"""

    def __init__(self, sharingLevel = "", groups = ""):
        self._allowed_parameters = {"sharingLevel", "groups"}
        self.sharingLevel = sharingLevel
        self.groups = groups

class _ZDefault(_ParameterChecker):
    """Class to represent sddraft ZDefault setting"""

    value = _passthrough_attr_decimal("_value")

    def __init__(self, enable = True, value = 0):
        self._allowed_parameters = {"enable", "value"}
        self.enable = enable
        self._value = value

class _Timezone(_ParameterChecker):
    """Class to represent sddraft timezone setting"""

    def __init__(self, ID = None, DaylightSavingTime = None, preferredTimezoneID = None, preferredTimezoneIDDaylightSavingTime = None):
        self._allowed_parameters = {"ID", "DaylightSavingTime", "preferredTimezoneID", "preferredTimezoneIDDaylightSavingTime"}
        if ID is not None:
            self.ID = ID
        if DaylightSavingTime is not None:
            self.DaylightSavingTime = DaylightSavingTime
        if preferredTimezoneID is not None:
            self.preferredTimezoneID = preferredTimezoneID
        if preferredTimezoneIDDaylightSavingTime is not None:
            self.preferredTimezoneIDDaylightSavingTime = preferredTimezoneIDDaylightSavingTime

class _Cache(_ParameterChecker):
    """Class to represent sddraft cache setting"""

    exportTilesCount = _passthrough_attr_intpos("_exportTilesCount")

    def __init__(self, configuration = "", exportTiles = False, exportTilesCount = 100000, cacheOnDemand=None, useExistingCache=None):
        self._allowed_parameters = {"configuration", "exportTiles", "exportTilesCount", "cacheOnDemand", "useExistingCache"}
        self.configuration = configuration
        self.exportTiles = exportTiles
        self._exportTilesCount = exportTilesCount
        if cacheOnDemand is not None:
            self.cacheOnDemand = cacheOnDemand
        if useExistingCache is not None:
            self.useExistingCache = useExistingCache

class _ExtensionProperties(_ParameterChecker):
    """ Class to represent common extension properties for sddraft setting"""

    def __init__(self, isEnabled = False):
        self._allowed_parameters = {"isEnabled"}
        self.isEnabled = isEnabled

class _ExtensionFeatureServer(_ExtensionProperties):
    """Class to represent FeatureServer extension sddraft setting"""

    def __init__(self, featureCapabilities = "", allowTrueCurvesUpdates = True, onlyAllowTrueCurveUpdatesByTrueCurveClients = True, allowUpdateWithoutMValues = False, 
                 zDefaultEnable = False, zDefaultValue = 0):
        super().__init__()
        self._allowed_parameters.update(["featureCapabilities", "allowTrueCurvesUpdates", "onlyAllowTrueCurveUpdatesByTrueCurveClients", 
                                    "allowUpdateWithoutMValues", "zDefault"])
        self.featureCapabilities = featureCapabilities
        self.allowTrueCurvesUpdates = allowTrueCurvesUpdates
        self.onlyAllowTrueCurveUpdatesByTrueCurveClients = onlyAllowTrueCurveUpdatesByTrueCurveClients
        self.allowUpdateWithoutMValues = allowUpdateWithoutMValues
        self.zDefault = _ZDefault(zDefaultEnable, zDefaultValue)

class _Extension(_ParameterChecker):
    """Class to represent sddraft Extensions setting"""

    def __init__(self, sharingDraftType):
        if sharingDraftType == "MAP_IMAGE":
            self._allowed_parameters ={"feature", "wms", "wfs", "ogcFeature", "wcs", "kml", "topographicProduction", "versionManagement", "linearReferencing", "validation", "networkAnalysis"}
        elif sharingDraftType == "MAP_SERVICE":
            self._allowed_parameters = {"feature", "wms", "wfs", "wcs", "kml"}
        self.feature = _ExtensionFeatureServer()
        for param in self._allowed_parameters: # feature is already considered
            if param == "feature": continue
            setattr(self, param, _ExtensionProperties())

class _Pooling(_ParameterChecker):
    """Class to represent pooling sddraft setting"""

    minInstances = _passthrough_attr_intpos("_minInstances")
    maxInstances = _passthrough_attr_intpos("_maxInstances")

    def __init__(self, poolingType = "", minInstances = 1, maxInstances = 2):
        self._allowed_parameters = {"type", "minInstances", "maxInstances"}
        self.type = poolingType
        self._minInstances = minInstances
        self._maxInstances = maxInstances
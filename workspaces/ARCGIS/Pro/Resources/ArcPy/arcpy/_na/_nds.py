"""Module for working with Network Dataset."""

from arcgisscripting import na as cna  # pylint:disable=no-name-in-module
from arcpy import gp

# List of names exported from this module
__all__ = ["NetworkDataset"]


class NetworkDataset(cna.NetworkDataset):
    """Provides access to properties and methods of a network dataset.

    Examples:
        Iterate through all the turns in the network and get the junctions that participate
        >>> import arcpy._na as nax
        >>> # Your path to the network dataset might be different.
        >>> nd = nax.NetworkDataset("C:\\ArcTutor\\NetworkAnalyst\\Tutorial\\SanDiego.gdb\\Transportation\\Streets_ND")
        >>> nd.isBuilt
        >>> turns = nd.turns(["SOURCEOID", "EDGEEIDS"])
        >>> for turn in turns:
                # For the edges in the turn, get the from and to junctions
                edges = nd.edges(["SOURCEOID", "FROMJUNCTION", "TOJUNCTION"], eids=turn[1])
                for edge in edges:
                    # For the from and to junction, get the SOURCEOID
                    junctions = nd.junctions("SOURCEOID", eids=[edge[1], edge[2]])
                junctionslist = [j for j in junctions]
                print(junctionslist)

    """

    # Prevent adding unsupported attributes to class instances
    __slots__ = ("_nds", )

    def __init__(self, in_network):
        """Returns a NetworkDataset object that provides read-only access to some properties of a network dataset,
           including iterators over network edge, junction, and turn elements.

           Args:
               in_network: A network dataset catalog path or network dataset layer object or a string representing
                           the name of the network dataset layer.

        """
        super().__init__(in_network)
        self._nds = in_network

    def checkIntersectingFeatures(self, feature_layer, cutoff=5000):
        """Returns a Boolean indicating whether the number of edge source features from the specified network dataset
           that are intersected by the features within the specified feature layer is less than or equal to the
           specified cutoff.

           Args:
               feature_layer: A variable that references the Layer object containing the features that are intersected
                              with the edge sources. Any selection set or definition query present on the Layer object
                              is honored and can be used to specify only a subset of features.
               cutoff: An integer value used as a cutoff while performing the check.

           Returns:
                True if the number of intersecting features is less than or equal to the allowed limit. Returns False
                if the number of intersecting features exceeds the allowed limit.

        """
        return cna.CheckIntersectingFeatures(self._nds, feature_layer, cutoff)

    def describe(self):
        """Returns a describe object which contains additional properties for the network dataset."""
        return gp.Describe(self._nds)

    def edges(self, edge_properties=None, attribute_names=None, time_of_day=None, eids=None, travel_mode=None, area_of_interest=None):
        """Returns an iterator of network dataset edge elements including the value of specific edge properties and
           network attributes at the time of day specified.

        Args:
            edge_properties: A list of strings representing the network edge properties to retrieve. For a single
                             property, you can use a string instead of a list of strings. The available properties
                             include:
                                 EID: The EID of the edge
                                 SOURCEID: The ID of the source feature class of the edge.
                                 SOURCEOID: The ObjectID of the feature within the source feature class from which this
                                            network edge is derived.
                                 FROMPOSITION: The distance along the source feature where this network edge starts.
                                               A network edge may not represent a complete feature in the source feature
                                               class.
                                 TOPOSITION: The distance along the source feature where this network edge ends.
                                 DIRECTION: A Boolean indicating whether the edge’s direction is along the direction of
                                            digitization.
                                 FROMJUNCTION: The EID of the junction feature at the beginning of the edge.
                                 TOJUNCTION: The EID of the junction feature at the end of the edge.
                                 ISRESTRICTED: The network element is not traversable for the travel_mode.
                                 COST: The value for the impedance network attribute for the travel_mode.
                                 TIME: The value for the time network attribute for the travel_mode.
                                 DISTANCE: The value for the distance network attribute for the travel_mode.

            attribute_names: The list of network dataset attribute names (such as costs or restrictions) for which to
                             retrieve the value for each network element. If the value is time dependent, you can
                             specify the time of day using the time_of_day parameter.  For a single attribute, you can
                             use a string instead of a list of strings.

            time_of_day: A datetime representing time of day for which to retrieve time-dependent attribute values for
                         this network element.  When no time_of_day value is passed, the time-neutral value will be
                         returned.

            eids: A list of EID values to include in the cursor.  This allows you to return only a subset of all
                  network elements. If no value is passed for this parameter, all network elements are returned.

            travel_mode: A travel_mode object to use for attribute paramters, ISRESTRICTED, COST, TIME, and DISTANCE
                         properties.

            area_of_interest: Polygon or Envelope filter for elements to include in the cursor.

        Returns:
             A NetworkDatasetEdgeCursor which can be used to iterate over the returned edges.  Each row is a tuple with
             the values of the items specified in the edge_properties and attribute_names parameters for that edge.

        """
        return super().edges(edge_properties, attribute_names, time_of_day, eids, travel_mode, area_of_interest)

    def junctions(self, junction_properties=None, attribute_names=None, time_of_day=None, eids=None, travel_mode=None, area_of_interest=None):
        """Returns an iterator of network dataset junction elements including the value of specific junction properties
           and network attributes at the time of day specified.

           Args:
               junction_properties: A list of strings representing the network junction properties to retrieve. For a
                                    single property, you can use a string instead of a list of strings. The available
                                    properties include:
                                        EID: The EID of the junction.
                                        SOURCEID: The ID of the source feature class of the junction.
                                        SOURCEOID: The ObjectID of the feature within the source feature class from
                                                   which this network junction is derived.
                                        ISRESTRICTED: The network element is not traversable for the travel_mode.
                                        COST: The value for the impedance network attribute for the travel_mode.
                                        TIME: The value for the time network attribute for the travel_mode.
                                        DISTANCE: The value for the distance network attribute for the travel_mode.

               attribute_names: The list of network dataset attribute names (such as costs or restrictions) for which
                                to retrieve the value for each network element. If the value is time dependent, you can
                                specify the time of day using the time_of_day parameter. For a single attribute, you
                                can use a string instead of a list of strings.

               time_of_day: A datetime representing time of day for which for which to retrieve time-dependent attribute
                            values for this network element. When no time_of_day value is passed, the time-neutral
                            value will be returned.

               eids: A list of EID values to include in the cursor. This allows you to return only a subset of all
                     network elements. If no value is passed for this parameter, all network elements are returned.

               travel_mode: A travel_mode object to use for attribute paramters, ISRESTRICTED, COST, TIME, and DISTANCE
                            properties.

               area_of_interest: Polygon or Envelope filter for elements to include in the cursor.

           Returns:
               A NetworkDatasetJunctionCursor which can be used to iterate over the returned junctions. Each row is a
               tuple with the values of the items specified in the junction_properties and attribute_names parameters
               for that junction.
        """
        return super().junctions(junction_properties, attribute_names, time_of_day, eids, travel_mode, area_of_interest)

    def turns(self, turn_properties=None, attribute_names=None, eids=None, travel_mode=None, area_of_interest=None):
        """Returns an iterator of network dataset turn elements including the value of specific turn properties and
           network attributes.

            Args:
                turn_properties: A list of strings representing the network turn properties to retrieve. For a single
                property, you can use a string instead of a list of strings. The available properties include:
                    EID: The EID of the turn.
                    SOURCEID: The ID of the source feature class of the turn.
                    SOURCEOID: The ObjectID of the feature within the source feature class from which this network
                               turn is derived.
                    EDGEEIDS: An ordered list of network edge EIDs that participate in this turn.
                    ISRESTRICTED: The network element is not traversable for the travel_mode.
                    COST: The value for the impedance network attribute for the travel_mode.
                    TIME: The value for the time network attribute for the travel_mode.
                    DISTANCE: The value for the distance network attribute for the travel_mode.

                attribute_names: The list of network dataset attribute names (such as costs or restrictions) for which
                                 to retrieve the value for each network element. For a single attribute, you can use a
                                 string instead of a list of strings.

                eids: A list of EID values to include in the cursor. This allows you to return only a subset of all
                      network elements. If no value is passed for this parameter, all network elements are returned.

                travel_mode: A travel_mode object to use for attribute paramters, ISRESTRICTED, COST, TIME, and DISTANCE
                             properties.

                area_of_interest: Polygon or Envelope filter for elements to include in the cursor.

            Returns:
                A NetworkDatasetTurnCursor which can be used to iterate over the returned turns.  Each row is a tuple
                with the values of the items specified in the turn_properties and attribute_names parameters for that
                turn.

        """
        return super().turns(turn_properties, attribute_names, eids, travel_mode, area_of_interest)

    def getDataSourceFromSourceID(self, source_id):
        """Returns the catalog path of the network dataset source feature class identified by the given source ID.

            Args:
                source_id: The network source ID for which to retrieve the corresponding source feature class’s
                           catalog path.

            Returns:
                A string representing the catalog path of the network dataset source feature class.

        """
        return super().getDataSourceFromSourceID(source_id)

    @property
    def travelModes(self):
        """Returns a dictionary of travel mode objects that are available with the network dataset. The keys of this
           dictionary are the travel mode names."""
        return cna.GetTravelModes(self._nds)

    @property
    def isBuilt(self):
        """Boolean indicating whether or not the network dataset is built. A value of False indicates that the network
           dataset needs to be rebuilt in order to incorporate changes."""
        return super().isBuilt

    @property
    def buildTimestamp(self):
        """Returns the timestamp of the most recent network build as a datetime object."""
        return super().buildTimestamp
        
    @property
    def edgeCount(self):
        """Returns the count of network dataset edge elements."""
        return super().edgeCount
    @property
    def junctionCount(self):
        """Returns the count of network dataset junction elements."""
        return super().junctionCount
        
    @property
    def turnCount(self):
        """Returns the count of network dataset turn elements."""
        return super().turnCount

    # @property
    # def directionsLanguages(self):
    #     """Return a list of the languages in which you can generate directions for the routes you create during network analysis."""
    #     return cna.ListDirectionsLanguages(self._nds)

    # @property
    # def directionsStyleNames(self):
    #     """Return a list of the available styles for generating directions from a route created during network analysis."""
    #     return cna.ListDirectionsStyleNames(self._nds)

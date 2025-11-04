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
r"""Ready To Use tools are ArcGIS Online geoprocessing services that use
the hosted data and analysis capabilities of ArcGIS Online. All you
need to provide are input features; all the other data necessary for
the analysis and the computation is hosted in ArcGIS Online."""
from __future__ import annotations

__all__ = [
    "FindClosestFacilities",
    "FindRoutes",
    "GenerateOriginDestinationCostMatrix",
    "GenerateServiceAreas",
    "Profile",
    "SolveLocationAllocation",
    "SolveVehicleRoutingProblem",
    "SummarizeElevation",
    "TraceDownstream",
    "Viewshed",
    "Watershed",
]
__alias__ = "agolservices"
from arcpy.geoprocessing._base import gptooldoc, gp, gp_fixargs
from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing import Literal
    from arcpy import RecordSet, FeatureSet
    from arcpy._mp import Layer, Table
    from arcpy.typing.gp import Result, Result1, Result2, Result3


# Tools
@gptooldoc("FindClosestFacilities_agolservices", None)
def FindClosestFacilities(
    Incidents=None,
    Facilities=None,
    Measurement_Units: Literal[
        "Meters", "Kilometers", "Feet", "Yards", "Miles", "NauticalMiles", "Seconds", "Minutes", "Hours", "Days"
    ]
    | None = None,
    Analysis_Region: Literal[
        "Europe", "Japan", "Korea", "MiddleEastAndAfrica", "NorthAmerica", "SouthAmerica", "SouthAsia", "Thailand"
    ]
    | None = None,
    Number_of_Facilities_to_Find=None,
    Cutoff=None,
    Travel_Direction: Literal["Incident to Facility", "Facility to Incident"] | None = None,
    Use_Hierarchy=None,
    Time_of_Day=None,
    Time_of_Day_Usage: Literal["Start Time", "End Time"] | None = None,
    UTurn_at_Junctions: Literal[
        "Allowed", "Not Allowed", "Allowed Only at Dead Ends", "Allowed Only at Intersections and Dead Ends"
    ]
    | None = None,
    Point_Barriers=None,
    Line_Barriers=None,
    Polygon_Barriers=None,
    Restrictions: list[
        Literal[
            "Any Hazmat Prohibited",
            "Avoid Carpool Roads",
            "Avoid Express Lanes",
            "Avoid Ferries",
            "Avoid Gates",
            "Avoid Limited Access Roads",
            "Avoid Private Roads",
            "Avoid Roads Unsuitable for Pedestrians",
            "Avoid Stairways",
            "Avoid Toll Roads",
            "Avoid Toll Roads for Trucks",
            "Avoid Truck Restricted Roads",
            "Avoid Unpaved Roads",
            "Axle Count Restriction",
            "Driving a Bus",
            "Driving a Taxi",
            "Driving a Truck",
            "Driving an Automobile",
            "Driving an Emergency Vehicle",
            "Height Restriction",
            "High Speed Roads Restriction",
            "Kingpin to Rear Axle Length Restriction",
            "Length Restriction",
            "Preferred for Pedestrians",
            "Riding a Motorcycle",
            "Roads Under Construction Prohibited",
            "Semi or Tractor with One or More Trailers Prohibited",
            "Single Axle Vehicles Prohibited",
            "Tandem Axle Vehicles Prohibited",
            "Through Traffic Prohibited",
            "Truck with Trailers Restriction",
            "Use Preferred Hazmat Routes",
            "Use Preferred Truck Routes",
            "Walking",
            "Weight Restriction",
            "Weight per Axle Restriction",
            "Width Restriction",
        ]
    ]
    | Literal[
        "Any Hazmat Prohibited",
        "Avoid Carpool Roads",
        "Avoid Express Lanes",
        "Avoid Ferries",
        "Avoid Gates",
        "Avoid Limited Access Roads",
        "Avoid Private Roads",
        "Avoid Roads Unsuitable for Pedestrians",
        "Avoid Stairways",
        "Avoid Toll Roads",
        "Avoid Toll Roads for Trucks",
        "Avoid Truck Restricted Roads",
        "Avoid Unpaved Roads",
        "Axle Count Restriction",
        "Driving a Bus",
        "Driving a Taxi",
        "Driving a Truck",
        "Driving an Automobile",
        "Driving an Emergency Vehicle",
        "Height Restriction",
        "High Speed Roads Restriction",
        "Kingpin to Rear Axle Length Restriction",
        "Length Restriction",
        "Preferred for Pedestrians",
        "Riding a Motorcycle",
        "Roads Under Construction Prohibited",
        "Semi or Tractor with One or More Trailers Prohibited",
        "Single Axle Vehicles Prohibited",
        "Tandem Axle Vehicles Prohibited",
        "Through Traffic Prohibited",
        "Truck with Trailers Restriction",
        "Use Preferred Hazmat Routes",
        "Use Preferred Truck Routes",
        "Walking",
        "Weight Restriction",
        "Weight per Axle Restriction",
        "Width Restriction",
    ]
    | str
    | None = None,
    Attribute_Parameter_Values=None,
    Route_Shape: Literal["True Shape", "True Shape with Measures", "Straight Line", "None"] | None = None,
    Route_Line_Simplification_Tolerance=None,
    Populate_Directions=None,
    Directions_Language=None,
    Directions_Distance_Units: Literal["Meters", "Kilometers", "Feet", "Yards", "Miles", "NauticalMiles"] | None = None,
    Directions_Style_Name: Literal["NA Desktop", "NA Navigation"] | None = None,
    Time_Zone_for_Time_of_Day: Literal["Geographically Local", "UTC"] | None = None,
    Travel_Mode=None,
    Impedance: Literal[
        "Drive Time",
        "Truck Time",
        "Walk Time",
        "Travel Distance",
        "Minutes",
        "TimeAt1KPH",
        "TravelTime",
        "TruckMinutes",
        "TruckTravelTime",
        "WalkTime",
        "Kilometers",
        "Miles",
    ]
    | None = None,
    Save_Output_Network_Analysis_Layer=None,
    Overrides=None,
    Save_Route_Data=None,
    Time_Impedance: Literal["Minutes", "TimeAt1KPH", "TravelTime", "TruckMinutes", "TruckTravelTime", "WalkTime"]
    | None = None,
    Distance_Impedance: Literal["Kilometers", "Miles"] | None = None,
    Output_Format: Literal["Feature Set", "JSON File", "GeoJSON File"] | None = None,
    Ignore_Invalid_Locations=None,
    Locate_Settings=None,
) -> Result:
    """FindClosestFacilities_agolservices(Incidents, Facilities, Measurement_Units, {Analysis_Region}, {Number_of_Facilities_to_Find}, {Cutoff}, {Travel_Direction}, {Use_Hierarchy}, {Time_of_Day}, {Time_of_Day_Usage}, {UTurn_at_Junctions}, {Point_Barriers}, {Line_Barriers}, {Polygon_Barriers}, {Restrictions;Restrictions...}, {Attribute_Parameter_Values}, {Route_Shape}, {Route_Line_Simplification_Tolerance}, {Populate_Directions}, {Directions_Language}, {Directions_Distance_Units}, {Directions_Style_Name}, {Time_Zone_for_Time_of_Day}, {Travel_Mode}, {Impedance}, {Save_Output_Network_Analysis_Layer}, {Overrides}, {Save_Route_Data}, {Time_Impedance}, {Distance_Impedance}, {Output_Format}, {Ignore_Invalid_Locations}, {Locate_Settings})

       Finds one or more facilities that are closest from an incident based
       on travel time or travel distance and outputs the best routes, driving
       directions between the incidents and the chosen facilities, and a copy
       of the chosen facilities. You can use the tool, for example, to find
       the closest hospital to an accident, the closest police cars to a
       crime scene, or the closest store to a customer's address.

    INPUTS:
     Incidents (Feature Set):
         The locations that will be used as starting or ending points in a
         closest facility analysis.You can specify one or more incidents (up to
         5,000). These are the
         locations from which the tool searches for the nearby locations.When
         specifying the incidents, you can set properties for each-such as
         its name or service time-using the following attributes:NameThe name
         of the incident. The name is used in the driving directions.
         If the name is not specified, a unique name prefixed with Location is
         automatically generated in the output routes and directions.ID
         A unique identifier for the incident. The identifier is
         included in the output routes (as thefield) and can help join
         additional information from the output routes, such as the total
         travel time or total distance, to attributes from your incidents or
         vice versa. If theisn't specified, the service automatically generates
         a unique identifier for each incident.
         IncidentIDIDAdditionalTimeThe amount of time spent at the incident,
         which is added to the total
         time of the route. The default value is 0. The units for this
         attribute value are specified by
         theparameter. The attribute value is included in the analysis only
         when the measurement units are time based. Measurement Units
         If you are finding the closest fire stations to fire incidents
         to estimate response times, for example, theattribute can store the
         amount of time it takes firefighters to hook up their equipment at the
         location of the incident before they can begin fighting the fire.
         AdditionalTimeAdditionalDistanceThe extra distance traveled at the
         incident, which is added to the
         total distance of the route. The default value is 0. The units
         for this attribute value are specified by
         theparameter. The attribute value is included in the analysis only
         when the measurement units are distance based. Measurement
         UnitsGenerally, the location of an incident, such as a home, isn't
         exactly
         on the street; it is set back somewhat from the road. This attribute
         value can be used to model the distance between the incident location
         and its location on the street if it is important to include that
         distance in the total travel distance.AdditionalCostThe extra cost
         spent at the incident, which is added to the total cost
         of the route. The default value is 0.This attribute value should be
         used when the travel mode for the
         analysis uses an impedance attribute that is neither time based nor
         distance based The units for the attribute values are interpreted to
         be in unknown units.TargetFacilityCountThe number of facilities that
         need to be found for the given incident.
         This field allows you to specify a different number of facilities to
         find for each incident. For example, using this field you can find the
         three closest facilities from one incident and the two closest
         facilities from another incident.CutoffThe impedance value at which to
         stop searching for facilities from a
         given incident. This attribute allows you to specify a different
         cutoff value for each incident. For example, using this attribute you
         can search for facilities within five minutes travel time from one
         incident and search for facilities within eight minutes travel time
         from another incident.CurbApproachSpecifies the direction a vehicle
         may arrive at and depart from the
         incident. The field value is specified as one of the following
         integers (use the numeric code, not the name in parentheses):0 (Either
         side of vehicle)-The vehicle can approach and depart the
         incident in either direction, so a U-turn is allowed at the incident.
         This setting can be chosen if it is possible and practical for a
         vehicle to turn around at the incident. This decision may depend on
         the width of the road and the amount of traffic or whether the
         incident has a parking lot where vehicles can pull in and turn
         around.1 (Right side of vehicle)-When the vehicle approaches and
         departs the
         incident, the curb must be on the right side of the vehicle. A U-turn
         is prohibited. This is typically used for vehicles such as buses that
         must arrive with the bus stop on the right-hand side.2 (Left side of
         vehicle)-When the vehicle approaches and departs the
         incident, the curb must be on the left side of the vehicle. A U-turn
         is prohibited. This is typically used for vehicles such as buses that
         must arrive with the bus stop on the left-hand side.3 (No U-Turn)-When
         the vehicle approaches the incident, the curb can
         be on either side of the vehicle; however, the vehicle must depart
         without turning around. Theattribute is designed to work with
         both types of national
         driving standards: right-hand traffic (United States) and left-hand
         traffic (United Kingdom). First, consider an incident on the left side
         of a vehicle. It is always on the left side regardless of whether the
         vehicle travels on the left or right half of the road. What may change
         with national driving standards is your decision to approach an
         incident from one of two directions, that is, so it ends up on the
         right or left side of the vehicle. For example, if you want to arrive
         at an incident and not have a lane of traffic between the vehicle and
         the incident, choose 1 (Right side of vehicle) in the United States
         and 2 (Left side of vehicle) in the United Kingdom.
         CurbApproachBearing        The direction in which a point is moving.
         The units are
         degrees and are measured clockwise from true north. This field is used
         in conjunction with thefield. BearingTolBearing data is usually
         sent automatically from a mobile device
         equipped with a GPS receiver. Try to include bearing data if you are
         loading an input location that is moving, such as a pedestrian or a
         vehicle.Using this field tends to prevent adding locations to the
         wrong edges,
         which can occur when a vehicle is near an intersection or an overpass,
         for example. Bearing also helps the tool determine on which side of
         the street the point is.BearingTol        The bearing tolerance value
         creates a range of acceptable
         bearing values when locating moving points on an edge using thefield.
         If thefield value is within the range of acceptable values that are
         generated from the bearing tolerance on an edge, the point can be
         added as a network location there; otherwise, the closest point on the
         next-nearest edge is evaluated. BearingBearingThe units are in
         degrees, and the default value is 30. Values must be
         greater than 0 and less than 180. A value of 30 means that when
         Network Analyst attempts to add a network location on an edge, a range
         of acceptable bearing values is generated 15 degrees to either side of
         the edge (left and right) and in both digitized directions of the
         edge.NavLatency        This field is only used in the solve process if
         theandfields
         also have values; however, entering afield value is optional, even
         when values are present inand.indicates how much cost is expected to
         elapse from the moment GPS information is sent from a moving vehicle
         to a server and the moment the processed route is received by the
         vehicle's navigation device.
         BearingBearingTolNavLatencyBearingBearingTolNavLatencyThe units of
         NavLatency are the same as the units of the impedance
         attribute.
     Facilities (Feature Set):
         The locations that will be used as starting or ending points in a
         closest facility analysis.You can specify one or more facilities (up
         to 5,000). These are the
         locations that are searched for when finding the closest location.When
         specifying the facilities, you can set properties for each-such
         as its name or service time-using the following attributes:NameThe
         name of the facility. The name is used in the driving directions.
         If the name is not specified, a unique name prefixed with Location is
         automatically generated in the output routes and directions.ID
         A unique identifier for the facility. The identifier is
         included in the output routes and the output closest facilities
         asfields. Thefield can be used to join additional information from the
         output routes, such as the total travel time or total distance, to
         attributes from your facilities. If theisn't specified, the service
         automatically generates a unique identifier for each facility.
         FacilityIDFacilityIDIDAdditionalTimeThe amount of time spent at the
         facility, which is added to the total
         time of the route. The default value is 0. The units for this
         attribute value are specified by
         theparameter. The attribute value is included in the analysis only
         when the measurement units are time based. Measurement Units
         If you are finding the closest fire stations to fire
         incidents, for example,can store the time it takes a crew to don the
         appropriate protective equipment and exit the fire station.
         AdditionalTimeAdditionalDistanceThe extra distance traveled at the
         facility, which is added to the
         total distance of the route. The default value is 0. The units
         for this attribute value are specified by
         theparameter. The attribute value is included in the analysis only
         when the measurement units are distance based. Measurement
         Units        Generally, the location of a facility, such as a fire
         station,
         isn't exactly on the street; it is set back somewhat from the road.can
         model the distance between the facility location and its location on
         the street if it is important to include that distance in the total
         travel distance. AdditionalDistanceAdditionalCostThe extra cost
         spent at the facility, which is added to the total cost
         of the route. The default value is 0.This attribute value should be
         used when the travel mode for the
         analysis uses an impedance attribute that is neither time based nor
         distance based The units for the attribute values are interpreted to
         be in unknown units.CutoffThe impedance value at which to stop
         searching for incidents from a
         given facility. This attribute allows you to specify a different
         cutoff value for each facility. For example, using this attribute you
         can search for incidents within five minutes of travel time from one
         facility and search for incidents within eight minutes of travel time
         from another facility.CurbApproachSpecifies the direction a vehicle
         may arrive at and depart from the
         facility.0 (Either side of vehicle)-The vehicle can approach and
         depart the
         facility in either direction, so a U-turn is allowed at the facility.
         This setting can be chosen if it is possible and practical for a
         vehicle to turn around at the facility. This decision may depend on
         the width of the road and the amount of traffic or whether the
         facility has a parking lot where vehicles can pull in and turn
         around.1 (Right side of vehicle)-When the vehicle approaches and
         departs the
         facility, the facility must be on the right side of the vehicle. A
         U-turn is prohibited. This is typically used for vehicles such as
         buses that must arrive with the bus stop on the right-hand side.2
         (Left side of vehicle)-When the vehicle approaches and departs the
         facility, the curb must be on the left side of the vehicle. A U-turn
         is prohibited. This is typically used for vehicles such as buses that
         must arrive with the bus stop on the left-hand side.3 (No U-Turn)-When
         the vehicle approaches the facility, the curb can
         be on either side of the vehicle; however, the vehicle must depart
         without turning around. Theattribute is designed to work with
         both types of national
         driving standards: right-hand traffic (United States) and left-hand
         traffic (United Kingdom). First, consider a facility on the left side
         of a vehicle. It is always on the left side regardless of whether the
         vehicle travels on the left or right half of the road. What may change
         with national driving standards is your decision to approach a
         facility from one of two directions, that is, so it ends up on the
         right or left side of the vehicle. For example, if you want to arrive
         at a facility and not have a lane of traffic between the vehicle and
         the facility, choose 1 (Right side of vehicle) in the United States
         and 2 (Left side of vehicle) in the United Kingdom.
         CurbApproachBearing        The direction in which a point is moving.
         The units are
         degrees and are measured clockwise from true north. This field is used
         in conjunction with thefield. BearingTolBearing data is usually
         sent automatically from a mobile device
         equipped with a GPS receiver. Try to include bearing data if you are
         loading an input location that is moving, such as a pedestrian or a
         vehicle.Using this field tends to prevent adding locations to the
         wrong edges,
         which can occur when a vehicle is near an intersection or an overpass,
         for example. Bearing also helps the tool determine on which side of
         the street the point is.BearingTol        The bearing tolerance value
         creates a range of acceptable
         bearing values when locating moving points on an edge using thefield.
         If thefield value is within the range of acceptable values that are
         generated from the bearing tolerance on an edge, the point can be
         added as a network location there; otherwise, the closest point on the
         next-nearest edge is evaluated. BearingBearingThe units are in
         degrees, and the default value is 30. Values must be
         greater than 0 and less than 180. A value of 30 means that when
         Network Analyst attempts to add a network location on an edge, a range
         of acceptable bearing values is generated 15 degrees to either side of
         the edge (left and right) and in both digitized directions of the
         edge.NavLatency        This field is only used in the solve process if
         theandfields
         also have values; however, entering afield value is optional, even
         when values are present inand.indicates how much cost is expected to
         elapse from the moment GPS information is sent from a moving vehicle
         to a server and the moment the processed route is received by the
         vehicle's navigation device.
         BearingBearingTolNavLatencyBearingBearingTolNavLatencyThe units of
         NavLatency are the same as the units of the impedance
         attribute.
     Measurement_Units (String):
         Specifies the units that will be used to measure and report the total
         travel time or travel distance for the output routes. The tool finds
         the closest facility by measuring the travel time or the travel
         distance along the streets.The units specified for this parameter
         determine whether the tool will
         measure driving distance or driving time to find what is closest.
         Choose a time unit to measure driving time. To measure driving
         distance, choose a distance unit. Your choice also determines the
         units in which the tool will report total driving time or distance in
         the results.Meters-The linear unit will be meters.Kilometers-The
         linear unit will
         be kilometers.Feet-The linear unit will be feet.Yards-The linear unit
         will be yards.Miles-The linear unit will be miles.NauticalMiles-The
         linear unit will be nautical miles.Seconds-The time unit will be
         seconds.Minutes-The time unit will be minutes.Hours-The time unit will
         be hours.Days-The time unit will be days.
     Analysis_Region {String}:
         The region in which the analysis will be performed. If a value is not
         specified for this parameter, the tool will automatically calculate
         the region name based on the location of the input points. Setting the
         name of the region is required only if the automatic detection of the
         region name is not accurate for the inputs.To specify a region, use
         one of the following values:Europe-The analysis region will be
         Europe.Japan-The analysis region
         will be Japan.Korea-The analysis region will be
         Korea.MiddleEastAndAfrica-The analysis region will be Middle East and
         Africa.NorthAmerica-The analysis region will be North
         America.SouthAmerica-The analysis region will be South
         America.SouthAsia-The analysis region will be South Asia.Thailand-The
         analysis region will be Thailand. The following region names
         are no longer supported and will be
         removed in future releases. If you specify one of the deprecated
         region names, the tool automatically assigns a supported region name
         for the region. Greece redirects to EuropeIndia redirects to
         SouthAsiaOceania
         redirects to SouthAsiaSouthEastAsia redirects to SouthAsiaTaiwan
         redirects to SouthAsia
     Number_of_Facilities_to_Find {Long}:
         The number of closest facilities to find per incident. This is useful
         in situations in which multiple fire engines may be required from
         different fire stations, such as a fire. You can specify, for example,
         to find the three nearest fire stations to a fire. The value
         set in this parameter can be overridden on a per-
         incident basis using thefield in the input incidents.
         TargetFacilityCountThe tool can find up to 100 facilities from each
         incident.
     Cutoff {Double}:
         The travel time or travel distance value at which to stop searching
         for facilities for a given incident. For example, while finding the
         closest hospitals from the site of an accident, a cutoff value of 15
         minutes means that the tool will search for the closest hospital
         within 15 minutes from the incident. If the closest hospital is 17
         minutes away, no routes will be returned in the output routes. A
         cutoff value is especially useful when searching for multiple
         facilities. When theparameter is set to, the cutoff can be
         overridden on a
         per-facility basis using thefield in the input facilities. When
         theparameter is set to, the cutoff can be overridden on a per-incident
         basis using thefield in the input incidents. Travel
         DirectionFacility to IncidentCutoffTravel DirectionIncident To
         FacilityCutoff        The units for this parameter are specified by
         theparameter.
         Measurement Units
     Travel_Direction {String}:
         Specifies how the travel direction for the closest facility search
         will be measured.Facility to Incident-The direction of travel is from
         facilities to
         incidents.Incident to Facility-The direction of travel is from
         incidents to
         facilities.Each option may find different facilities, as the travel
         time along
         some streets may vary based on the travel direction and one-way
         restrictions. For instance, a facility may be a 10-minute drive from
         the incident while traveling from the incident to the facility, but
         while traveling from the facility to the incident, it may be a
         15-minute drive because of different travel time in that direction.
         If you are also setting a value for theparameter, traffic may
         also cause theandoptions to return different results. Time of
         DayFacility to IncidentIncident to Facility        Fire departments
         commonly use thevalue for the parameter,
         since they are concerned with the time it takes to travel from the
         fire station (facility) to the location of the emergency (incident).
         Management at a retail store (facility) is more concerned with the
         time it takes shoppers (incidents) to reach the store (facility);
         therefore, store management commonly chooses. Facility to
         IncidentIncident to Facility
     Use_Hierarchy {Boolean}:
         Specifies whether hierarchy will be used when finding the best route
         between the facility and the incident.Checked (True in
         Python)-Hierarchy will be used when finding routes.
         When hierarchy is used, the tool identifies higher-order streets (such
         as freeways) before lower-order streets (such as local roads) and can
         be used to simulate the driver preference of traveling on freeways
         instead of local roads even if that means a longer trip. This is
         especially useful when finding routes to faraway facilities, because
         drivers on long-distance trips tend to prefer traveling on freeways,
         where stops, intersections, and turns can be avoided. Using hierarchy
         is computationally faster, especially for long-distance routes, as the
         tool identifies the best route from a relatively smaller subset of
         streets.Unchecked (False in Python)-Hierarchy will not be used when
         finding
         routes. If hierarchy is not used, the tool considers all the streets
         and doesn't necessarily identify higher-order streets when finding the
         route. This is often used for finding short-distance routes within a
         city. The tool automatically reverts to using hierarchy if the
         straight-line distance between facilities and incidents is greater
         than 50 miles, even if this parameter is(set to False in Python).
         Unchecked
     Time_of_Day {Date}:
         The time and date the route will begin or end. The value is
         used as the start time or end time for the route depending on the
         value for theparameter. If you specify the current date and time as
         the value for this parameter, the tool will use live traffic
         conditions to find the closest facility, and the total travel time
         will be based on traffic conditions. Time of Day
         UsageSpecifying a time of day results in a more accurate estimation of
         travel time between the incident and facility because the travel time
         accounts for the traffic conditions that are applicable for that date
         and time. Theparameter specifies whether this time and date
         refer to UTC
         or the time zone in which the facility or incident is located.
         Time Zone for Time of Day
     Time_of_Day_Usage {String}:
         Specifies whether theparameter value represents the arrival or
         departure time for the route. Time of Day         Start
         Time-The tool considers theparameter value as the
         departure time from the facility or incident to find the best route.
         Time of Day         End Time-The tool considers theparameter value as
         the arrival
         time at the facility or incident to find the best route. This option
         is useful if you want to know the time to depart from a location so
         you arrive at the destination at the time specified in. Time
         of DayTime of Day
     UTurn_at_Junctions {String}:
         Specifies the U-turn policy at junctions. Allowing U-turns implies the
         solver can turn around at a junction and double back on the same
         street. Given that junctions represent street intersections and dead
         ends, different vehicles may be able to turn around at some junctions
         but not at others-it depends on whether the junction represents an
         intersection or dead end. To accommodate this, the U-turn policy
         parameter is implicitly specified by the number of edges that connect
         to the junction, which is known as junction valency. The acceptable
         values for this parameter are listed below; each is followed by a
         description of its meaning in terms of junction
         valency.Allowed-U-turns are permitted at junctions with any number of
         connected edges. This is the default value. Not
         Allowed-U-turns are prohibited at all junctions,
         regardless of junction valency. However, U-turns are still permitted
         at network locations even when this option is chosen, but you can set
         the individual network locations'attribute to prohibit U-turns there
         as well. CurbApproachAllowed Only at Dead Ends-U-turns are
         prohibited at all junctions
         except those that have only one adjacent edge (a dead end).Allowed
         Only at Intersections and Dead Ends-U-turns are prohibited at
         junctions where exactly two adjacent edges meet but are permitted at
         intersections (junctions with three or more adjacent edges) and dead
         ends (junctions with exactly one adjacent edge). Often, networks have
         extraneous junctions in the middle of road segments. This option
         prevents vehicles from making U-turns at these locations. This
         parameter is ignored unlessis set to. Travel
         ModeCustom
     Point_Barriers {Feature Set}:
         Use this parameter to specify one or more points that will act as
         temporary restrictions or represent additional time or distance that
         may be required to travel on the underlying streets. For example, a
         point barrier can be used to represent a fallen tree along a street or
         a time delay spent at a railroad crossing.The tool imposes a limit of
         250 points that can be added as barriers.When specifying point
         barriers, you can set properties for each, such
         as its name or barrier type, using the following attributes:NameThe
         name of the barrier.BarrierTypeSpecifies whether the point barrier
         restricts travel completely or
         adds time or distance when it is crossed. The value for this attribute
         is specified as one of the following integers (use the numeric code,
         not the name in parentheses):0 (Restriction)-Prohibits travel through
         the barrier. The barrier is
         referred to as a restriction point barrier since it acts as a
         restriction. 2 (Added Cost)-Traveling through the barrier
         increases the
         travel time or distance by the amount specified in the,, orfield. This
         barrier type is referred to as an added cost point barrier.
         Additional_TimeAdditional_DistanceAdditionalCostAdditional_Time
         The added travel time when the barrier is traversed. This
         field is applicable only for added-cost barriers and when theparameter
         value is time based. Measurement Units        This field value
         must be greater than or equal to zero, and
         its units must be the same as those specified in theparameter.
         Measurement UnitsAdditional_Distance        The added distance when
         the barrier is traversed. This field
         is applicable only for added-cost barriers and when theparameter value
         is distance based. Measurement Units        The field value
         must be greater than or equal to zero, and its
         units must be the same as those specified in theparameter.
         Measurement UnitsAdditionalCost        The added cost when the barrier
         is traversed. This field is
         applicable only for added-cost barriers when theparameter value is
         neither time based nor distance based. Measurement
         UnitsFullEdgeSpecifies how the restriction point barriers are applied
         to the edge
         elements during the analysis. The field value is specified as one of
         the following integers (use the numeric code, not the name in
         parentheses):0 (False)-Permits travel on the edge up to the barrier
         but not through
         it. This is the default value.1 (True)-Restricts travel anywhere on
         the associated edge.CurbApproachSpecifies the direction of traffic
         that is affected by the barrier.
         The field value is specified as one of the following integers (use the
         numeric code, not the name in parentheses):0 (Either side of
         vehicle)-The barrier affects travel over the edge in
         both directions.1 (Right side of vehicle)-Vehicles are only affected
         if the barrier is
         on their right side during the approach. Vehicles that traverse the
         same edge but approach the barrier on their left side are not affected
         by the barrier.2 (Left side of vehicle)-Vehicles are only affected if
         the barrier is
         on their left side during the approach. Vehicles that traverse the
         same edge but approach the barrier on their right side are not
         affected by the barrier.Because junctions are points and don't have a
         side, barriers on
         junctions affect all vehicles regardless of the curb approach.
         Theattribute works with both types of national driving
         standards: right-hand traffic (United States) and left-hand traffic
         (United Kingdom). First, consider a facility on the left side of a
         vehicle. It is always on the left side regardless of whether the
         vehicle travels on the left or right half of the road. What may change
         with national driving standards is your decision to approach a
         facility from one of two directions, that is, so it ends up on the
         right or left side of the vehicle. For example, to arrive at a
         facility and not have a lane of traffic between the vehicle and the
         facility, choose 1 (Right side of vehicle) in the United States and 2
         (Left side of vehicle) in the United Kingdom.
         CurbApproachBearing        The direction in which a point is moving.
         The units are
         degrees and are measured clockwise from true north. This field is used
         in conjunction with thefield. BearingTolBearing data is usually
         sent automatically from a mobile device
         equipped with a GPS receiver. Try to include bearing data if you are
         loading an input location that is moving, such as a pedestrian or a
         vehicle.Using this field tends to prevent adding locations to the
         wrong edges,
         which can occur when a vehicle is near an intersection or an overpass,
         for example. Bearing also helps the tool determine on which side of
         the street the point is.BearingTol        The bearing tolerance value
         creates a range of acceptable
         bearing values when locating moving points on an edge using thefield.
         If thefield value is within the range of acceptable values that are
         generated from the bearing tolerance on an edge, the point can be
         added as a network location there; otherwise, the closest point on the
         next-nearest edge is evaluated. BearingBearingThe units are in
         degrees, and the default value is 30. Values must be
         greater than 0 and less than 180. A value of 30 means that when
         Network Analyst attempts to add a network location on an edge, a range
         of acceptable bearing values is generated 15 degrees to either side of
         the edge (left and right) and in both digitized directions of the
         edge.NavLatency        This field is only used in the solve process if
         theandfields
         also have values; however, entering afield value is optional, even
         when values are present inand.indicates how much cost is expected to
         elapse from the moment GPS information is sent from a moving vehicle
         to a server and the moment the processed route is received by the
         vehicle's navigation device.
         BearingBearingTolNavLatencyBearingBearingTolNavLatencyThe units of
         NavLatency are the same as the units of the impedance
         attribute.
     Line_Barriers {Feature Set}:
         Use this parameter to specify one or more lines that prohibit travel
         anywhere the lines intersect the streets. For example, a parade or
         protest that blocks traffic across several street segments can be
         modeled with a line barrier. A line barrier can also quickly fence off
         several roads from being traversed, thereby channeling possible routes
         away from undesirable parts of the street network. The tool
         imposes a limit on the number of streets you can
         restrict using theparameter. While there is no limit to the number of
         lines you can specify as line barriers, the combined number of streets
         intersected by all the lines cannot exceed 500. Line
         BarriersWhen specifying the line barriers, you can set name and
         barrier type
         properties for each using the following attributes:NameThe name of the
         barrier.
     Polygon_Barriers {Feature Set}:
         Use this parameter to specify polygons that either completely restrict
         travel or proportionately scale the time or distance required to
         travel on the streets intersected by the polygons. The service
         imposes a limit on the number of streets you can
         restrict using theparameter. While there is no limit to the number of
         polygons you can specify as polygon barriers, the combined number of
         streets intersected by all the polygons cannot exceed 2,000.
         Polygon BarriersWhen specifying the polygon barriers, you can set
         properties for each,
         such as its name or barrier type, using the following
         attributes:NameThe name of the barrier.BarrierTypeSpecifies whether
         the barrier restricts travel completely or scales
         the cost (such as time or distance) for traveling through it. The
         field value is specified as one of the following integers (use the
         numeric code, not the name in parentheses):0 (Restriction)-Prohibits
         traveling through any part of the barrier.
         The barrier is referred to as a restriction polygon barrier since it
         prohibits traveling on streets intersected by the barrier. One use of
         this type of barrier is to model floods covering areas of the street
         that make traveling on those streets impossible. 1 (Scaled
         Cost)-Scales the cost (such as travel time or
         distance) required to travel the underlying streets by a factor
         specified using theorfield. If the streets are partially covered by
         the barrier, the travel time or distance is apportioned and then
         scaled. For example, a factor of 0.25 means that travel on underlying
         streets is expected to be four times faster than normal. A factor of
         3.0 means it is expected to take three times longer than normal to
         travel on underlying streets. This barrier type is referred to as a
         scaled-cost polygon barrier. It can be used to model storms that
         reduce travel speeds in specific regions, for example.
         ScaledTimeFactorScaledDistanceFactorScaledTimeFactorThis is the factor
         by which the travel time of the streets intersected
         by the barrier is multiplied. The field value must be greater than
         zero. This field is applicable only for scaled-cost barriers
         and
         when theparameter is time-based. Measurement
         UnitsScaledDistanceFactorThis is the factor by which the distance of
         the streets intersected by
         the barrier is multiplied. The field value must be greater than zero.
         This field is applicable only for scaled-cost barriers and
         when theparameter is distance-based. Measurement
         UnitsScaledCostFactorThis is the factor by which the cost of the
         streets intersected by the
         barrier is multiplied. The field value must be greater than zero.
         This field is applicable only for scaled-cost barriers when
         theparameter is neither time-based nor distance-based.
         Measurement Units
     Restrictions {String}:
         The restrictions that will be honored by the tool when finding the
         best routes.A restriction represents a driving preference or
         requirement. In most
         cases, restrictions cause roads to be prohibited. For instance, using
         the Avoid Toll Roads restriction will result in a route that will
         include toll roads only when it is required to travel on toll roads to
         visit an incident or a facility. Height Restriction makes it possible
         to route around any clearances that are lower than the height of the
         vehicle. If you are carrying corrosive materials on the vehicle, using
         the Any Hazmat Prohibited restriction prevents hauling the materials
         along roads where it is marked illegal to do so. The values you
         provide for this parameter are ignored unlessis
         set to. Travel ModeCustom         Some restrictions require an
         additional value to be specified
         for their use. This value must be associated with the restriction name
         and a specific parameter intended to work with the restriction. You
         can identify such restrictions if their names appear in the
         AttributeName column of theparameter. Specify thefield for
         theparameter for the restriction to be correctly used when finding
         traversable roads. Attribute Parameter
         ValuesParameterValueAttribute Parameter Values         Some
         restrictions are supported only in certain countries;
         their availability is stated by region in the list below. Of the
         restrictions that have limited availability within a region, you can
         determine whether the restriction is available in a particular country
         by reviewing the table in the Country list section of Network analysis
         coverage. If a country has a value ofin the Logistics Attribute
         column, the restriction with select availability in the region is
         supported in that country. If you specify restriction names that are
         not available in the country where your incidents are located, the
         service ignores the invalid restrictions. The service also ignores
         restrictions when theattribute parameter value is between 0 and 1 (see
         theparameter). It prohibits all restrictions when theparameter value
         is greater than 0. YesRestriction UsageAttribute Parameter
         ValueRestriction UsageThe tool supports the following restrictions:
         Any Hazmat Prohibited-The results will not include roads
         where transporting any kind of hazardous material is prohibited.
         Availability: Select countries in North America and Europe
         Avoid Carpool Roads-The results will avoid roads that are
         designated exclusively for car pool (high-occupancy) vehicles.
         Availability: All countries         Avoid Express Lanes-The results
         will avoid roads designated
         as express lanes. Availability: All countries         Avoid
         Ferries-The results will avoid ferries.
         Availability: All countries         Avoid Gates-The results will avoid
         roads where there are
         gates, such as keyed access or guard-controlled entryways.
         Availability: All countries         Avoid Limited Access Roads-The
         results will avoid roads that
         are limited-access highways. Availability: All countries
         Avoid Private Roads-The results will avoid roads that are not
         publicly owned and maintained. Availability: All countries
         Avoid Roads Unsuitable for Pedestrians-The results will avoid
         roads that are unsuitable for pedestrians. Availability: All
         countries         Avoid Stairways-The results will avoid all stairways
         on a
         pedestrian-suitable route. Availability: All countries
         Avoid Toll Roads-The results will avoid all toll roads for
         automobiles. Availability: All countries         Avoid Toll
         Roads for Trucks-The results will avoid all toll
         roads for trucks. Availability: All countries         Avoid
         Truck Restricted Roads-The results will avoid roads
         where trucks are not allowed, except when making deliveries.
         Availability: All countries         Avoid Unpaved Roads-The results
         will avoid roads that are not
         paved (for example, dirt, gravel, and so on). Availability:
         All countries         Axle Count Restriction-The results will not
         include roads
         where trucks with the specified number of axles are prohibited. The
         number of axles can be specified using the Number of Axles restriction
         parameter. Availability: Select countries in North America and
         Europe         Driving a Bus-The results will not include roads where
         buses
         are prohibited. Using this restriction will also ensure that the
         results will honor one-way streets. Availability: All
         countries         Driving a Taxi-The results will not include roads
         where taxis
         are prohibited. Using this restriction will also ensure that the
         results will honor one-way streets. Availability: All
         countries         Driving a Truck-The results will not include roads
         where
         trucks are prohibited. Using this restriction will also ensure that
         the results will honor one-way streets. Availability: All
         countries         Driving an Automobile-The results will not include
         roads
         where automobiles are prohibited. Using this restriction will also
         ensure that the results will honor one-way streets.
         Availability: All countries         Driving an Emergency Vehicle-The
         results will not include
         roads where emergency vehicles are prohibited. Using this restriction
         will also ensure that the results will honor one-way streets.
         Availability: All countries         Height Restriction-The results
         will not include roads where
         the vehicle height exceeds the maximum allowed height for the road.
         The vehicle height can be specified using the Vehicle Height (meters)
         restriction parameter. Availability: Select countries in North
         America and Europe         Kingpin to Rear Axle Length Restriction-The
         results will not
         include roads where the vehicle length exceeds the maximum allowed
         kingpin to rear axle for all trucks on the road. The length between
         the vehicle kingpin and the rear axle can be specified using the
         Vehicle Kingpin to Rear Axle Length (meters) restriction parameter.
         Availability: Select countries in North America and Europe
         Length Restriction-The results will not include roads where
         the vehicle length exceeds the maximum allowed length for the road.
         The vehicle length can be specified using the Vehicle Length (meters)
         restriction parameter. Availability: Select countries in North
         America and Europe         Preferred for Pedestrians-The results will
         use preferred
         routes suitable for pedestrian navigation. Availability:
         Select countries in North America and Europe         Riding a
         Motorcycle-The results will not include roads where
         motorcycles are prohibited. Using this restriction will also ensure
         that the results will honor one-way streets. Availability: All
         countries         Roads Under Construction Prohibited-The results will
         not
         include roads that are under construction. Availability: All
         countries         Semi or Tractor with One or More Trailers
         Prohibited-The
         results will not include roads where semis or tractors with one or
         more trailers are prohibited. Availability: Select countries
         in North America and Europe         Single Axle Vehicles
         Prohibited-The results will not include
         roads where vehicles with single axles are prohibited.
         Availability: Select countries in North America and Europe
         Tandem Axle Vehicles Prohibited-The results will not include
         roads where vehicles with tandem axles are prohibited.
         Availability: Select countries in North America and Europe
         Through Traffic Prohibited-The results will not include roads
         where through traffic (nonlocal) is prohibited. Availability:
         All countries         Truck with Trailers Restriction-The results will
         not include
         roads where trucks with the specified number of trailers on the truck
         are prohibited. The number of trailers on the truck can be specified
         using the Number of Trailers on Truck restriction parameter.
         Availability: Select countries in North America and Europe         Use
         Preferred Hazmat Routes-The results will prefer roads
         that are designated for transporting any kind of hazardous materials.
         Availability: Select countries in North America and Europe         Use
         Preferred Truck Routes-The results will prefer roads that
         are designated as truck routes, such as the roads that are part of the
         national network as specified by the National Surface Transportation
         Assistance Act in the United States, or roads that are designated as
         truck routes by the state or province, or roads that are preferred by
         truckers when driving in an area. Availability: Select
         countries in North America and Europe         Walking-The results will
         not include roads where pedestrians
         are prohibited. Availability: All countries         Weight
         Restriction-The results will not include roads where
         the vehicle weight exceeds the maximum allowed weight for the road.
         The vehicle weight can be specified using the Vehicle Weight
         (kilograms) restriction parameter. Availability: Select
         countries in North America and Europe         Weight per Axle
         Restriction-The results will not include
         roads where the vehicle weight per axle exceeds the maximum allowed
         weight per axle for the road. The vehicle weight per axle can be
         specified using the Vehicle Weight per Axle (kilograms) restriction
         parameter. Availability: Select countries in North America and
         Europe         Width Restriction-The results will not include roads
         where
         the vehicle width exceeds the maximum allowed width for the road. The
         vehicle width can be specified using the Vehicle Width (meters)
         restriction parameter. Availability: Select countries in North
         America and Europe
     Attribute_Parameter_Values {Record Set}:
         Use this parameter to specify additional values required by an
         attribute or restriction, such as to specify whether the restriction
         prohibits, avoids, or prefers travel on restricted roads. If the
         restriction is meant to avoid or prefer roads, you can further specify
         the degree to which they are avoided or preferred using this
         parameter. For example, you can choose to never use toll roads, avoid
         them as much as possible, or prefer them. The values you
         provide for this parameter are ignored unlessis
         set to. Travel ModeCustom        If you specify theparameter
         from a feature class, the field
         names on the feature class must match the fields as follows:
         Attribute Parameter ValuesAttributeName-The name of the restriction.
         ParameterName-The
         name of the parameter associated with the
         restriction. A restriction can have one or morefield values based on
         its intended use. ParameterName          ParameterValue-The
         value forused by the tool when evaluating
         the restriction. ParameterName        Theparameter is
         dependent on theparameter. Thefield is
         applicable only if the restriction name is specified as the value for
         theparameter. Attribute Parameter
         ValuesRestrictionsParameterValueRestrictions        In, each
         restriction (listed as) has afield value, Restriction
         Usage, that specifies whether the restriction prohibits, avoids, or
         prefers travel on the roads associated with the restriction as well as
         the degree to which the roads are avoided or preferred. The
         Restriction Usagecan be assigned any of the following string values or
         their equivalent numeric values listed in the parentheses:
         Attribute Parameter
         ValuesAttributeNameParameterNameParameterNamePROHIBITED (-1)-Travel on
         the roads using the restriction is
         completely prohibited.AVOID_HIGH (5)-It is highly unlikely the tool
         will include in the
         route the roads that are associated with the restriction.AVOID_MEDIUM
         (2)-It is unlikely the tool will include in the route the
         roads that are associated with the restriction.AVOID_LOW (1.3)-It is
         somewhat unlikely the tool will include in the
         route the roads that are associated with the restriction.PREFER_LOW
         (0.8)-It is somewhat likely the tool will include in the
         route the roads that are associated with the restriction.PREFER_MEDIUM
         (0.5)-It is likely the tool will include in the route
         the roads that are associated with the restriction.PREFER_HIGH
         (0.2)-It is highly likely the tool will include in the
         route the roads that are associated with the restriction.In most
         cases, you can use the default value, PROHIBITED, as the
         Restriction Usage value if the restriction is dependent on a vehicle
         characteristic such as vehicle height. However, in some cases, the
         Restriction Usage value depends on your routing preferences. For
         example, the Avoid Toll Roads restriction has the default value of
         AVOID_MEDIUM for the Restriction Usage attribute. This means that when
         the restriction is used, the tool will route around toll roads when it
         can. AVOID_MEDIUM also indicates how important it is to avoid toll
         roads when finding the best route; it has a medium priority. Choosing
         AVOID_LOW puts lower importance on avoiding tolls; choosing AVOID_HIGH
         instead gives it a higher importance and makes it more acceptable for
         the service to generate longer routes to avoid tolls. Choosing
         PROHIBITED entirely disallows travel on toll roads, making it
         impossible for a route to travel on any portion of a toll road. Keep
         in mind that avoiding or prohibiting toll roads, and avoiding toll
         payments, is the objective for some. In contrast, others prefer to
         drive on toll roads, because avoiding traffic is more valuable to them
         than the money spent on tolls. In the latter case, choose PREFER_LOW,
         PREFER_MEDIUM, or PREFER_HIGH as the value for Restriction Usage. The
         higher the preference, the farther the tool will go to travel on the
         roads associated with the restriction.
     Route_Shape {String}:
         Specifies the type of route features that will be output by the
         tool.True Shape-The exact shape of the resulting route that is based
         on the
         underlying streets will be returned. True Shape with
         Measures-The exact shape of the resulting
         route that is based on the underlying streets will be returned.
         Additionally, construct measures so the shape can be used in linear
         referencing. The measurements increase from the first stop and record
         the cumulative travel time or travel distance in the units specified
         by theparameter. Measurement UnitsStraight Line-A straight
         line between two stops will be returned.None-No shapes for the routes
         will be returned. This value can be
         useful, and return results quickly, when you are only interested in
         determining the total travel time or travel distance of a route.
         When theparameter is set toor, the generalization of the route
         shape can be further controlled using the appropriate value for
         theparameter. Route ShapeTrue ShapeTrue Shape with
         MeasuresRoute Line Simplification Tolerance        No matter which
         value you choose for theparameter, the best
         route is always determined by minimizing the travel time or the travel
         distance, never using the straight-line distance between stops. This
         means that only the route shapes are different, not the underlying
         streets that are searched when finding the route. Route Shape
     Route_Line_Simplification_Tolerance {Linear Unit}:
         The distance that will be used to simplify the geometry of the output
         lines for routes and directions. The tool ignores this
         parameter if theparameter isn't set to.
         Route ShapeTrue ShapeSimplification maintains critical points on a
         route, such as turns at
         intersections, to define the essential shape of the route and removes
         other points. The simplification distance you specify is the maximum
         allowable offset that the simplified line can deviate from the
         original line. Simplifying a line reduces the number of vertices that
         are part of the route geometry. This improves the tool processing
         time.
     Populate_Directions {Boolean}:
         Specifies whether the tool will generate driving directions for each
         route. Checked (True in Python)-Directions will be generated
         and
         configured based on the values of the,, andparameters.
         Directions LanguageDirections Style NameDirections Distance
         UnitsUnchecked (False in Python)-Directions will not be generated, and
         the
         tool will return an empty Directions layer.
     Directions_Language {String}:
         The language that will be used when generating travel directions.
         This parameter is used only when theparameter is checked (True
         in Python). Populate Directions        The parameter value can
         be specified using one of the
         following two- or five-character language codes:
         ar-Arabicbg-Bulgarianbs-Bosnianca-Catalancs-Czechda-Danishde-Germanel-
         Greeken-Englishes-Spanishet-Estonianfi-Finnishfr-Frenchhe-Hebrewhr-Cro
         atianhu-Hungarianid-Indonesianit-Italianja-Japaneseko-Koreanlt-Lithuan
         ianlv-Latviannb-Norwegiannl-Dutchpl-Polishpt-BR-Portuguese (Brazil)pt-
         PT-Portuguese (Portugal)ro-Romanianru-Russiansk-Slovaksl-Sloveniansr-S
         erbiansv-Swedishth-Thaitr-Turkishuk-Ukrainianvi-Vietnamesezh-
         CN-Chinese (China)zh-HK-Chinese (Hong Kong)zh-TW-Chinese (Taiwan)The
         tool first searches for an exact match for the specified language
         including any language localization. If an exact match is not found,
         it tries to match the language family. If a match is still not found,
         the tool returns the directions using the default language, English.
         For example, if the directions language is specified as es-MX (Mexican
         Spanish), the tool will return the directions in Spanish, as it
         supports the es language code but not es-MX.If a language supports
         localization, such as Brazilian Portuguese (pt-
         BR) and European Portuguese (pt-PT), specify the language family and
         the localization. If you only specify the language family, the tool
         will not match the language family and instead return directions in
         the default language, English. For example, if the directions language
         specified is pt, the tool will return the directions in English since
         it cannot determine whether the directions should be returned in pt-BR
         or pt-PT.
     Directions_Distance_Units {String}:
         Specifies the units that will display travel distance in the
         driving directions. This parameter is used only when theparameter is
         checked (True in Python). Populate DirectionsMiles-The linear
         unit will be miles.Kilometers-The linear unit will be
         kilometers.Meters-The linear unit will be meters.Feet-The linear unit
         will be feet.Yards-The linear unit will be yards.NauticalMiles-The
         linear unit will be nautical miles.
     Directions_Style_Name {String}:
         Specifies the name of the formatting style for the directions.
         This parameter is used only when theparameter is checked (True in
         Python). Populate DirectionsNA Desktop-The style will be turn-
         by-turn directions suitable for
         printing.NA Navigation-The style will be turn-by-turn directions
         designed for
         an in-vehicle navigation device.
     Time_Zone_for_Time_of_Day {String}:
         Specifies the time zone of theparameter. Time of Day
         Geographically Local-Theparameter refers to the time zone in
         which the facilities or incidents are located. Time of Day
         Ifis set toandis, this is the time zone of the facilities.
         Time of Day UsageStart TimeTravel DirectionFacility to Incident
         Ifis set toandis, this is the time zone of the incidents.
         Time of Day UsageStart TimeTravel DirectionIncident to Facility
         Ifis set toandis, this is the time zone of the incidents.
         Time of Day UsageEnd TimeTravel DirectionFacility to Incident
         Ifis set toandis, this is the time zone of the facilities.
         Time of Day UsageEnd TimeTravel DirectionIncident to Facility
         UTC-Theparameter refers to coordinated universal time (UTC).
         Choose this option if you want to find what's nearest for a specific
         time, such as now, but aren't certain in which time zone the
         facilities or incidents will be located. Time of Day
         Regardless of thesetting, if your facilities and incidents are
         in multiple time zones, the following rules are enforced by the tool.
         All incidents and facilities must be in the same time zone for the
         following:        Time Zone for Time of DaySpecifying a start time and
         traveling from incident to
         facilitySpecifying an end time and traveling from facility to
         incidentSpecifying a start time and traveling from facility to
         incidentSpecifying an end time and traveling from incident to facility
     Travel_Mode {String}:
         The mode of transportation to model in the analysis. Travel modes are
         managed in ArcGIS Online and can be configured by the administrator of
         your organization to reflect the organization's workflows. Specify the
         name of a travel mode that is supported by your organization.
         To get a list of supported travel mode names, run the Get
         Travel Modes tool from the Utilities toolbox under the same GIS server
         connection you used to access the tool. The Get Travel Modes tool adds
         the Supported Travel Modes table to the application. Any value in
         thefield from the Supported Travel Modes table can be specified as
         input. You can also specify the value from thefield as input. This
         speeds up tool operation, as the tool does not have to find the
         settings based on the travel mode name. Travel Mode NameTravel
         Mode Settings        The default value,, allows you to configure a
         custom travel
         mode using the custom travel mode parameters (,,,, and). The default
         values of the custom travel mode parameters model traveling by car.
         You can also chooseand set the custom travel mode parameters listed
         above to model a pedestrian with a fast walking speed or a truck with
         a given height, weight, and cargo of certain hazardous materials. You
         can try different settings to get the analysis results you want. Once
         you have identified the analysis settings, work with your
         organization's administrator and save these settings as part of a new
         or existing travel mode so that everyone in your organization can run
         the analysis with the same settings. CustomUTurn at
         JunctionsUse HierarchyRestrictionsAttribute Parameter
         ValuesImpedanceCustom        When you choose, the values you set for
         the custom travel mode
         parameters are included in the analysis. Specifying another travel
         mode, as defined by your organization, causes any values you set for
         the custom travel mode parameters to be ignored; the tool overrides
         them with values from the specified travel mode. Custom
     Impedance {String}:
         Specifies the impedance, which is a value that represents the effort
         or cost of traveling along road segments or on other parts of the
         transportation network.Travel time is an impedance: a car may take 1
         minute to travel a mile
         along an empty road. Travel times can vary by travel mode-a pedestrian
         may take more than 20 minutes to walk the same mile, so it is
         important to choose the right impedance for the travel mode you are
         modeling.Travel distance can also be an impedance; the length of a
         road in
         kilometers can be thought of as impedance. Travel distance in this
         sense is the same for all modes-a kilometer for a pedestrian is also a
         kilometer for a car. (What may change is the pathways on which the
         different modes are allowed to travel, which affects distance between
         points, and this is modeled by travel mode settings.)        The value
         you provide for this parameter is ignored unlessis
         set to, which is the default value. Travel ModeCustom
         TravelTime-Historical and live traffic data is used. This
         option is good for modeling the time it takes automobiles to travel
         along roads at a specific time of day using live traffic speed data
         where available. When using, you can optionally set the
         TravelTime::Vehicle Maximum Speed (km/h) attribute parameter to
         specify the physical limitation of the speed the vehicle is capable of
         traveling. TravelTimeMinutes-Live traffic data is not used,
         but historical average speeds
         for automobiles data is used. TruckTravelTime-Historical and
         live traffic data is used, but
         the speed is capped at the posted truck speed limit. This is good for
         modeling the time it takes for the trucks to travel along roads at a
         specific time. When using, you can optionally set the
         TruckTravelTime::Vehicle Maximum Speed (km/h) attribute parameter to
         specify the physical limitation of the speed the truck is capable of
         traveling. TruckTravelTimeTruckMinutes-Live traffic data is
         not used, but the smaller of the
         historical average speeds for automobiles and the posted speed limits
         for trucks is used.WalkTime-The default is a speed of 5 km/hr on all
         roads and paths, but
         this can be configured through the WalkTime::Walking Speed (km/h)
         attribute parameter.Miles-Length measurements along roads are stored
         in miles and can be
         used for performing analysis based on shortest
         distance.Kilometers-Length measurements along roads are stored in
         kilometers
         and can be used for performing analysis based on shortest
         distance.TimeAt1KPH-The default is a speed of 1 km/hr on all roads and
         paths.
         The speed cannot be changed using any attribute parameter.Drive
         Time-Travel times for a car are modeled. These travel times are
         dynamic and fluctuate according to traffic flows in areas where
         traffic data is available. This is the default value.Truck Time-Travel
         times for a truck are modeled. These travel times
         are static for each road and don't fluctuate with traffic.Walk
         Time-Travel times for a pedestrian are modeled. Travel
         Distance-Length measurements along roads and paths are
         stored. To model walk distance, choose this option and ensure thatis
         set for theparameter. Similarly, to model drive or truck distance,
         choosehere and set the appropriate restrictions so the vehicle travels
         only on roads where it is permitted to do so.
         WalkingRestrictionTravel Distance        If you choose a time-based
         impedance, such as,,,, or,
         theparameter must be set to a time-based value; if you choose a
         distance-based impedance such asor,must be a distance-based value.
         TravelTimeTruckTravelTimeMinutesTruckMinutesWalkTimeBreak
         UnitsMilesKilometersBreak Units        ,,, andimpedance values are no
         longer supported and will be
         removed in a future release. If you use one of these values, the tool
         uses the value of theparameter for time-based values and theparameter
         for distance-based values. Drive TimeTruck TimeWalk TimeTravel
         DistanceTime ImpedanceDistance Impedance
     Save_Output_Network_Analysis_Layer {Boolean}:
         Specifies whether the analysis settings will be saved as a network
         analysis layer file. You cannot directly work with this file even when
         you open the file in an ArcGIS Desktop application such as ArcMap. It
         is meant to be sent to Esri Technical Support to diagnose the quality
         of results returned from the tool. Checked (True in
         Python)-The output will be saved as a
         network analysis layer file. The file will be downloaded to a
         temporary directory on your machine. In ArcGIS Pro, the location of
         the downloaded file can be determined by viewing the value for
         theparameter in the entry corresponding to the tool service in the
         geoprocessing history of the project. In ArcMap, the location of the
         file can be determined by accessing theoption in the shortcut menu of
         theparameter in the entry corresponding to the tool service in
         thewindow. Output Network Analysis LayerCopy LocationOutput
         Network Analysis LayerGeoprocessing ResultsUnchecked (False in
         Python)-The output will not be saved as a network
         analysis layer file. This is the default.
     Overrides {String}:
         This parameter is for internal use only.
     Save_Route_Data {Boolean}:
         Specifies whether the output will include a .zip file that contains a
         file geodatabase with the inputs and outputs of the analysis in a
         format that can be used to share route layers with ArcGIS Online or
         Portal for ArcGIS. Checked (True in Python)-The route data
         will be saved as a
         .zip file. The file is downloaded to a temporary directory on your
         machine. In ArcGIS Pro, the location of the downloaded file can be
         determined by viewing the value for theparameter in the entry
         corresponding to the tool operation in the geoprocessing history of
         the project. In ArcMap, the location of the file can be determined by
         accessing theoption in the shortcut menu of theparameter in the entry
         corresponding to the tool operation in thewindow. Output
         Route DataCopy LocationOutput Route DataGeoprocessing ResultsUnchecked
         (False in Python)-The route data will not be saved as a .zip
         file. This is the default.
     Time_Impedance {String}:
         If the impedance for the travel mode, as specified using
         theparameter, is time based, the values for theandparameters must be
         identical. Otherwise, the service will return an error. The
         time-based impedance value represents the travel time along road
         segments or on other parts of the transportation network.ImpedanceTime
         ImpedanceImpedanceMinutes-Time impedance will be
         minutes.TravelTime-Time impedance will
         be travel time.TimeAt1KPH-Time impedance will be time at one kilometer
         per hour.WalkTime-Time impedance will be walk time.TruckMinutes-Time
         impedance will be truck minutes.TruckTravelTime-Time impedance will be
         truck travel time.
     Distance_Impedance {String}:
         If the impedance for the travel mode, as specified using
         theparameter, is distance based, the values for theandparameters must
         be identical. Otherwise, the service will return an error. The
         distance-based impedance value represents the travel distance
         along road segments or on other parts of the transportation
         network.ImpedanceDistance ImpedanceImpedanceMiles-Distance impedance
         will be miles.Kilometers-Distance impedance
         will be kilometers.
     Output_Format {String}:
         Specifies the format in which the output features will be
         returned.Feature Set-The output features will be returned as feature
         classes
         and tables. This is the default.JSON File-The output features will be
         returned as a compressed file
         containing the JSON representation of the outputs. When this option is
         specified, the output is a single file (with a .zip extension) that
         contains one or more JSON files (with a .json extension) for each of
         the outputs created by the service.GeoJSON File-The output features
         will be returned as a compressed file
         containing the GeoJSON representation of the outputs. When this option
         is specified, the output is a single file (with a .zip extension) that
         contains one or more GeoJSON files (with a .geojson extension) for
         each of the outputs created by the service. When a file-based
         output format, such asor, is specified, no
         outputs will be added to the display because the application, such as
         ArcMap or ArcGIS Pro, cannot draw the contents of the result file.
         Instead, the result file is downloaded to a temporary directory on
         your machine. In ArcGIS Pro, the location of the downloaded file can
         be determined by viewing the value for theparameter in the entry
         corresponding to the tool operation in the geoprocessing history of
         the project. In ArcMap, the location of the file can be determined by
         accessing theoption in the shortcut menu of theparameter in the entry
         corresponding to the tool operation in thewindow. JSON
         FileGeoJSON FileOutput Result FileCopy LocationOutput Result
         FileGeoprocessing Results
     Ignore_Invalid_Locations {Boolean}:
         Specifies whether invalid input locations will be ignored.SKIP-Network
         locations that are unlocated will be ignored and the
         analysis will run using valid network locations only. The analysis
         will also continue if locations are on nontraversable elements or have
         other errors. This is useful if you know the network locations are not
         all correct, but you want to run the analysis with the network
         locations that are valid. This is the default.HALT-Invalid locations
         will not be ignored. Do not run the analysis if
         there are invalid locations. Correct the invalid locations and rerun
         the analysis.
     Locate_Settings {String}:
         Use this parameter to specify settings that affect how inputs are
         located, such as the maximum search distance to use when locating the
         inputs on the network or the network sources being used for locating.
         The locator JSON object has following properties:Currently,
         you can't specify different source names for the sources array. Also,
         allowAutoRelocate is always set to true since the service does not
         support location fields. tolerance and
         toleranceUnits-Allows you to control the
         maximum search distance when locating inputs. If no valid network
         location is found within this distance, the input features will be
         considered unlocated. A small search tolerance decreases the
         likelihood of locating on the wrong street but increases the
         likelihood of not finding any valid network location. The
         toleranceUnits parameter value can be specified as one of the
         following values:
         esriCentimetersesriDecimalDegreesesriDecimetersesriFeetesriInchesesriI
         ntFeetesriIntInchesesriIntMilesesriIntNauticalMilesesriIntYardsesriKil
         ometersesriMetersesriMilesesriMillimetersesriNauticalMilesesriYards
         sources-Allows you to control which network source can be
         used for locating. For example, you can configure the analysis to
         locate inputs on streets but not on sidewalks. The list of possible
         sources on which to locate is specific to the network dataset this
         service references. Only the sources that are present in the sources
         array are used for locating. Sources is specified as an array of
         objects each having the following property:          name-The name of
         the network source feature class that can be used for
         locating inputsallowAutoRelocate-Allows you to control whether inputs
         with existing
         network location fields can be automatically relocated when solving to
         ensure valid, routable location fields for the analysis. If the value
         is true, points located on restricted network elements and points
         affected by barriers will be relocated to the closest routable
         location. If the value is false, network location fields will be used
         as is even if the points are unreachable, and this may cause the solve
         to fail. Even if the value is false, inputs with no location fields or
         incomplete location fields will be located during the solve
         operation.The parameter value is specified as a JSON object. The JSON
         object
         allows you to specify a locator JSON for all input feature in the
         analysis, or you can specify an override for a particular input. The
         override allows you to have different settings for each analysis
         input. For example, you can disallow stops to locate on highway ramps
         and allow point barriers to locate on highway ramps. When specifying
         the Locate_Settings JSON, you must provide the tolerance,
         toleranceUnits, and allowAutoRelocate properties. If you need to
         provide a different locator JSON for a particular input class, you
         must include the overrides property for that input. The property name
         must match the input parameter name. The locator JSON for a particular
         input doesn't need to include all the properties; you only need to
         include the properties that are different from the default locator
         JSON properties."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.FindClosestFacilities_agolservices(
                *gp_fixargs(
                    (
                        Incidents,
                        Facilities,
                        Measurement_Units,
                        Analysis_Region,
                        Number_of_Facilities_to_Find,
                        Cutoff,
                        Travel_Direction,
                        Use_Hierarchy,
                        Time_of_Day,
                        Time_of_Day_Usage,
                        UTurn_at_Junctions,
                        Point_Barriers,
                        Line_Barriers,
                        Polygon_Barriers,
                        Restrictions,
                        Attribute_Parameter_Values,
                        Route_Shape,
                        Route_Line_Simplification_Tolerance,
                        Populate_Directions,
                        Directions_Language,
                        Directions_Distance_Units,
                        Directions_Style_Name,
                        Time_Zone_for_Time_of_Day,
                        Travel_Mode,
                        Impedance,
                        Save_Output_Network_Analysis_Layer,
                        Overrides,
                        Save_Route_Data,
                        Time_Impedance,
                        Distance_Impedance,
                        Output_Format,
                        Ignore_Invalid_Locations,
                        Locate_Settings,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("FindRoutes_agolservices", None)
def FindRoutes(
    Stops=None,
    Measurement_Units: Literal[
        "Meters", "Kilometers", "Feet", "Yards", "Miles", "NauticalMiles", "Seconds", "Minutes", "Hours", "Days"
    ]
    | None = None,
    Analysis_Region: Literal[
        "Europe", "Japan", "Korea", "MiddleEastAndAfrica", "NorthAmerica", "SouthAmerica", "SouthAsia", "Thailand"
    ]
    | None = None,
    Reorder_Stops_to_Find_Optimal_Routes=None,
    Preserve_Terminal_Stops: Literal["Preserve First", "Preserve Last", "Preserve First and Last", "Preserve None"]
    | None = None,
    Return_to_Start=None,
    Use_Time_Windows=None,
    Time_of_Day=None,
    Time_Zone_for_Time_of_Day: Literal["Geographically Local", "UTC"] | None = None,
    UTurn_at_Junctions: Literal[
        "Allowed", "Not Allowed", "Allowed Only at Dead Ends", "Allowed Only at Intersections and Dead Ends"
    ]
    | None = None,
    Point_Barriers=None,
    Line_Barriers=None,
    Polygon_Barriers=None,
    Use_Hierarchy=None,
    Restrictions: list[
        Literal[
            "Any Hazmat Prohibited",
            "Avoid Carpool Roads",
            "Avoid Express Lanes",
            "Avoid Ferries",
            "Avoid Gates",
            "Avoid Limited Access Roads",
            "Avoid Private Roads",
            "Avoid Roads Unsuitable for Pedestrians",
            "Avoid Stairways",
            "Avoid Toll Roads",
            "Avoid Toll Roads for Trucks",
            "Avoid Truck Restricted Roads",
            "Avoid Unpaved Roads",
            "Axle Count Restriction",
            "Driving a Bus",
            "Driving a Taxi",
            "Driving a Truck",
            "Driving an Automobile",
            "Driving an Emergency Vehicle",
            "Height Restriction",
            "High Speed Roads Restriction",
            "Kingpin to Rear Axle Length Restriction",
            "Length Restriction",
            "Preferred for Pedestrians",
            "Riding a Motorcycle",
            "Roads Under Construction Prohibited",
            "Semi or Tractor with One or More Trailers Prohibited",
            "Single Axle Vehicles Prohibited",
            "Tandem Axle Vehicles Prohibited",
            "Through Traffic Prohibited",
            "Truck with Trailers Restriction",
            "Use Preferred Hazmat Routes",
            "Use Preferred Truck Routes",
            "Walking",
            "Weight Restriction",
            "Weight per Axle Restriction",
            "Width Restriction",
        ]
    ]
    | Literal[
        "Any Hazmat Prohibited",
        "Avoid Carpool Roads",
        "Avoid Express Lanes",
        "Avoid Ferries",
        "Avoid Gates",
        "Avoid Limited Access Roads",
        "Avoid Private Roads",
        "Avoid Roads Unsuitable for Pedestrians",
        "Avoid Stairways",
        "Avoid Toll Roads",
        "Avoid Toll Roads for Trucks",
        "Avoid Truck Restricted Roads",
        "Avoid Unpaved Roads",
        "Axle Count Restriction",
        "Driving a Bus",
        "Driving a Taxi",
        "Driving a Truck",
        "Driving an Automobile",
        "Driving an Emergency Vehicle",
        "Height Restriction",
        "High Speed Roads Restriction",
        "Kingpin to Rear Axle Length Restriction",
        "Length Restriction",
        "Preferred for Pedestrians",
        "Riding a Motorcycle",
        "Roads Under Construction Prohibited",
        "Semi or Tractor with One or More Trailers Prohibited",
        "Single Axle Vehicles Prohibited",
        "Tandem Axle Vehicles Prohibited",
        "Through Traffic Prohibited",
        "Truck with Trailers Restriction",
        "Use Preferred Hazmat Routes",
        "Use Preferred Truck Routes",
        "Walking",
        "Weight Restriction",
        "Weight per Axle Restriction",
        "Width Restriction",
    ]
    | str
    | None = None,
    Attribute_Parameter_Values=None,
    Route_Shape: Literal["True Shape", "True Shape with Measures", "Straight Line", "None"] | None = None,
    Route_Line_Simplification_Tolerance=None,
    Populate_Route_Edges=None,
    Populate_Directions=None,
    Directions_Language=None,
    Directions_Distance_Units: Literal["Meters", "Kilometers", "Feet", "Yards", "Miles", "NauticalMiles"] | None = None,
    Directions_Style_Name: Literal["NA Desktop", "NA Navigation"] | None = None,
    Travel_Mode=None,
    Impedance: Literal[
        "Drive Time",
        "Truck Time",
        "Walk Time",
        "Travel Distance",
        "Minutes",
        "TimeAt1KPH",
        "TravelTime",
        "TruckMinutes",
        "TruckTravelTime",
        "WalkTime",
        "Kilometers",
        "Miles",
    ]
    | None = None,
    Time_Zone_for_Time_Windows: Literal["Geographically Local", "UTC"] | None = None,
    Save_Output_Network_Analysis_Layer=None,
    Overrides=None,
    Save_Route_Data=None,
    Time_Impedance: Literal["Minutes", "TimeAt1KPH", "TravelTime", "TruckMinutes", "TruckTravelTime", "WalkTime"]
    | None = None,
    Distance_Impedance: Literal["Kilometers", "Miles"] | None = None,
    Output_Format: Literal["Feature Set", "JSON File", "GeoJSON File"] | None = None,
    Ignore_Invalid_Locations=None,
    Locate_Settings=None,
) -> Result:
    """FindRoutes_agolservices(Stops, Measurement_Units, {Analysis_Region}, {Reorder_Stops_to_Find_Optimal_Routes}, {Preserve_Terminal_Stops}, {Return_to_Start}, {Use_Time_Windows}, {Time_of_Day}, {Time_Zone_for_Time_of_Day}, {UTurn_at_Junctions}, {Point_Barriers}, {Line_Barriers}, {Polygon_Barriers}, {Use_Hierarchy}, {Restrictions;Restrictions...}, {Attribute_Parameter_Values}, {Route_Shape}, {Route_Line_Simplification_Tolerance}, {Populate_Route_Edges}, {Populate_Directions}, {Directions_Language}, {Directions_Distance_Units}, {Directions_Style_Name}, {Travel_Mode}, {Impedance}, {Time_Zone_for_Time_Windows}, {Save_Output_Network_Analysis_Layer}, {Overrides}, {Save_Route_Data}, {Time_Impedance}, {Distance_Impedance}, {Output_Format}, {Ignore_Invalid_Locations}, {Locate_Settings})

       Determines the shortest paths to visit the input stops and returns the
       driving directions, information about the visited stops, and the route
       paths, including travel time and distance.

    INPUTS:
     Stops (Feature Set):
         Specifies the locations the output route or routes will visit.
         You can add up to 10,000 stops and assign up to 150 stops to a
         single route. (Assign stops to routes using theattribute.)
         RouteNameWhen specifying the stops, you can set properties for
         each-such as its
         name or service time-using the following attributes:NameThe name of
         the stop. The name is used in the driving directions. If
         no name is provided, a unique name prefixed with Location is
         automatically generated in the output stops, routes, and
         directions.RouteName        The name of the route to which the stop
         belongs. Stops with
         the samevalue are grouped together. RouteNameYou can group up
         to 150 stops into one route.Sequence        The output routes will
         visit the stops in the order you
         specify with this attribute. In a group of stops that have the
         samevalue, the sequence number should be greater than 0 but not
         greater than the total number of stops. Also, the sequence number
         should not be duplicated. RouteName        Ifis checked (True),
         all but possibly the first and last
         sequence values for each route name are ignored so the tool can find
         the sequence that minimizes overall travel for each route. (The
         settings foranddetermine whether the first or last sequence values for
         each route are ignored.)        Reorder Stops To Find Optimal
         RoutesPreserve Ordering of StopsReturn to StartAdditionalTimeThe
         amount of time spent at the stop, which is added to the total time
         of the route. The default value is 0. The units for this
         attribute value are specified by
         theparameter. The attribute value is included in the analysis only
         when the measurement units are time based. Measurement UnitsYou
         can account for the extra time it takes at the stop to complete a
         task, such as to repair an appliance, deliver a package, or inspect
         the premises.AdditionalDistanceThe extra distance traveled at the
         stops, which is added to the total
         distance of the route. The default value is 0. The units for
         this attribute value are specified by
         theparameter. The attribute value is included in the analysis only
         when the measurement units are distance based. Measurement
         UnitsGenerally, the location of a stop, such as a home, isn't exactly
         on
         the street; it is set back somewhat from the road. This attribute
         value can be used to model the distance between the actual stop
         location and its location on the street if it is important to include
         that distance in the total travel distance.AdditionalCostThe extra
         cost spent at the stop, which is added to the total cost of
         the route. The default value is 0.This attribute value should be used
         when the travel mode for the
         analysis uses an impedance attribute that is neither time based nor
         distance based. The units for the attribute values are interpreted to
         be in unknown units.TimeWindowStartThe earliest time the stop can be
         visited. By specifying a start and
         end time for a stop's time window, you are defining when a route will
         visit the stop. When the travel mode for the analysis uses an
         impedance attribute that is time based, specifying time-window values
         will cause the analysis to find a solution that minimizes overall
         travel and reaches the stop within the prescribed time window.Ensure
         that you specify the value as a date and time value, such as
         8/12/2015 12:15 PM.When solving a problem that spans multiple time
         zones, time-window
         values refer to the time zone in which the stop is located.
         This field can contain a null value; a null value indicates
         that a route can arrive at any time before the time indicated in
         theattribute. If a null value is also present in, a route can visit
         the stop at any time.
         TimeWindowEndTimeWindowEndTimeWindowEndThe latest time the stop can be
         visited. By specifying a start and end
         time for a stop's time window, you are defining when a route will
         visit the stop. When the travel mode for the analysis uses an
         impedance attribute that is time based, specifying time-window values
         will cause the analysis to find a solution that minimizes overall
         travel and reaches the stop within the prescribed time window.Ensure
         that you specify the value as a date and time value, such as
         8/12/2015 12:15 PM.When solving a problem that spans multiple time
         zones, time-window
         values refer to the time zone in which the stop is located.
         This field can contain a null value; a null value indicates
         that a route can arrive at any time after the time indicated in
         theattribute. If a null value is also present in, a route can visit
         the stop at any time.
         TimeWindowStartTimeWindowStartCurbApproachSpecifies the direction a
         vehicle can arrive at and depart from the
         stop. The field value is specified as one of the following integers
         (use the numeric code, not the name in parentheses):0 (Either side of
         vehicle)-The vehicle can approach and depart the
         stop in either direction, so a U-turn is allowed at the stop. This
         setting can be used if it is possible and practical for a vehicle to
         turn around at the stop. This decision may depend on the width of the
         road and the amount of traffic or whether the stop has a parking lot
         where vehicles can enter and turn around.1 (Right side of
         vehicle)-When the vehicle approaches and departs the
         stop, the curb must be on the right side of the vehicle. A U-turn is
         prohibited. This is typically used for vehicles such as buses that
         must arrive with the bus stop on the right-hand side.2 (Left side of
         vehicle)-When the vehicle approaches and departs the
         stop, the curb must be on the left side of the vehicle. A U-turn is
         prohibited. This is typically used for vehicles such as buses that
         must arrive with the bus stop on the left-hand side.3 (No U-Turn)-When
         the vehicle approaches the stop, the curb can be on
         either side of the vehicle; however, the vehicle must depart without
         turning around. Theattribute works with both national driving
         standards:
         right-hand traffic (United States) and left-hand traffic (United
         Kingdom). First, consider a stop on the left side of a vehicle. It is
         always on the left side regardless of whether the vehicle travels on
         the left or right half of the road. What may change with national
         driving standards is your decision to approach a stop from one of two
         directions, that is, so it ends up on the right or left side of the
         vehicle. For example, to arrive at a stop and not have a lane of
         traffic between the vehicle and the stop, choose 1 (Right side of
         vehicle) in the United States and 2 (Left side of vehicle) in the
         United Kingdom. CurbApproachLocationTypeSpecifies the stop
         type. The field value is specified as one of the
         following integers (use the numeric code, not the name in
         parentheses):0 (Stop)-A location that the route will visit. This is
         the default.1
         (Waypoint)-A location that the route will travel through without
         making a stop. Waypoints can be used to force the route to take a
         specific path (to go through the waypoint) without being considered an
         actual stop. Waypoints do not appear in directions.Bearing        The
         direction in which a point is moving. The units are
         degrees and are measured clockwise from true north. This field is used
         in conjunction with thefield. BearingTolBearing data is usually
         sent automatically from a mobile device
         equipped with a GPS receiver. Try to include bearing data if you are
         loading an input location that is moving, such as a pedestrian or a
         vehicle.Using this field tends to prevent adding locations to the
         wrong edges,
         which can occur when a vehicle is near an intersection or an overpass,
         for example. Bearing also helps the tool determine on which side of
         the street the point is.BearingTol        The bearing tolerance value
         creates a range of acceptable
         bearing values when locating moving points on an edge using thefield.
         If thefield value is within the range of acceptable values that are
         generated from the bearing tolerance on an edge, the point can be
         added as a network location there; otherwise, the closest point on the
         next-nearest edge is evaluated. BearingBearingThe units are in
         degrees, and the default value is 30. Values must be
         greater than 0 and less than 180. A value of 30 means that when
         Network Analyst attempts to add a network location on an edge, a range
         of acceptable bearing values is generated 15 degrees to either side of
         the edge (left and right) and in both digitized directions of the
         edge.NavLatency        This field is only used in the solve process if
         theandfields
         also have values; however, entering afield value is optional, even
         when values are present inand.indicates how much cost is expected to
         elapse from the moment GPS information is sent from a moving vehicle
         to a server and the moment the processed route is received by the
         vehicle's navigation device.
         BearingBearingTolNavLatencyBearingBearingTolNavLatencyThe units of
         NavLatency are the same as the units of the impedance
         attribute.
     Measurement_Units (String):
         Specifies the units that will be used to measure and report the total
         travel time or travel distance for the output routes.This parameter
         value determines whether distance or time will be
         measured to find the best routes. To minimize travel time for the
         travel mode (driving or walking time, for instance), specify a time
         unit. To minimize travel distance for the travel mode, specify a
         distance unit. This value also determines the units that will be used
         for total time or distance in the results.Meters-The linear unit will
         be meters.Kilometers-The linear unit will
         be kilometers.Feet-The linear unit will be feet.Yards-The linear unit
         will be yards.Miles-The linear unit will be miles.NauticalMiles-The
         linear unit will be nautical miles.Seconds-The time unit will be
         seconds.Minutes-The time unit will be minutes.Hours-The time unit will
         be hours.Days-The time unit will be days.
     Analysis_Region {String}:
         The region in which the analysis will be performed. If a value is not
         specified for this parameter, the tool will automatically calculate
         the region name based on the location of the input points. Setting the
         name of the region is required only if the automatic detection of the
         region name is not accurate for the inputs.To specify a region, use
         one of the following values:Europe-The analysis region will be
         Europe.Japan-The analysis region
         will be Japan.Korea-The analysis region will be
         Korea.MiddleEastAndAfrica-The analysis region will be Middle East and
         Africa.NorthAmerica-The analysis region will be North
         America.SouthAmerica-The analysis region will be South
         America.SouthAsia-The analysis region will be South Asia.Thailand-The
         analysis region will be Thailand. The following region names
         are no longer supported and will be
         removed in future releases. If you specify one of the deprecated
         region names, the tool automatically assigns a supported region name
         for the region. Greece redirects to EuropeIndia redirects to
         SouthAsiaOceania
         redirects to SouthAsiaSouthEastAsia redirects to SouthAsiaTaiwan
         redirects to SouthAsia
     Reorder_Stops_to_Find_Optimal_Routes {Boolean}:
         Specifies whether stops will be visited in the order you define or the
         order the tool determines will minimize overall travel.Checked
         (True)-Stops will be visited in the order determined by the
         tool to minimize overall travel distance or time. It can reorder stops
         and account for time windows at stops. Additional parameters allow you
         to preserve the first or last stops while allowing the tool to reorder
         the intermediary stops. Unchecked (False)-Stops are visited
         in the order you define.
         You can set the order of stops using aattribute in the input stops
         features or using thevalue of the stops. This is the default.
         SequenceObject IDFinding the optimal stop order and the best routes is
         commonly known
         as solving the traveling salesperson problem (TSP).
     Preserve_Terminal_Stops {String}:
         Specifies how terminal stops will be preserved. Whenis checked
         (or True), you can preserve the starting or ending stops, and the tool
         will reorder the rest. Reorder Stops to Find Optimal Routes
         The first and last stops are determined by theirattribute
         values or, if thevalues are null, by theirvalues.
         SequenceSequenceObject IDPreserve First-The first stop won't be
         reordered. Choose this option
         if you are starting from a known location, such as your home,
         headquarters, or current location.Preserve Last-The last stop won't ve
         reordered. The output routes can
         start from any stop feature but must end at the predetermined last
         stop.Preserve First and Last-The first and last stops won't be
         reordered.Preserve None-Any stop can be reordered, including the first
         and last
         stops. The route can start or end at any of the stop features.
         is ignored whenis unchecked (or False). Preserve
         Terminal StopsReorder Stops to Find Optimal Routes
     Return_to_Start {Boolean}:
         Specifies whether routes will start and end at the same location. With
         this parameter, you can avoid duplicating the first stop feature and
         sequencing the duplicate stop at the end. The starting location
         of the route is the stop feature with
         the lowest value in theattribute. If thevalues are null, it is the
         stop feature with the lowestvalue. SequenceSequenceObject ID
         Checked (True)-The route will start and end at the first stop
         feature. Whenandare both checked (True),must be set to. This is the
         default value. Reorder Stops to Find Optimal RoutesReturn to
         StartPreserve Terminal StopsPreserve FirstUnchecked (False)-The route
         will not start and end at the first stop
         feature.
     Use_Time_Windows {Boolean}:
         Specifies whether time windows will be honored. Check this
         parameter (set to True) if any input stops have time windows that
         specify when the route will reach the stop. You can add time windows
         to input stops by entering time values in theandattributes.
         TimeWindowStartTimeWindowEndChecked (True)-Time windows for the input
         stops, if they exist, will
         be honored.Unchecked (False)-Time windows for the input stops, if they
         exist,
         will not be honored. This is the default value. The tool will
         take slightly longer to run whenis checked (or
         True), even if no input stops have time windows, so it is recommended
         that you uncheck this option (set to False) if possible. Use
         Time Windows
     Time_of_Day {Date}:
         The time and date the routes will begin.If you are modeling the
         driving travel mode and specify the current
         date and time as the value for this parameter, the tool will use live
         traffic conditions to find the best routes, and the total travel time
         will be based on traffic conditions.Specifying a time of day results
         in more accurate routes and
         estimations of travel times because the travel times account for the
         traffic conditions that are applicable for that date and time.
         Theparameter specifies whether this time and date refer to UTC
         or the time zone in which the stop is located. Time Zone for
         Time of Day        The tool ignores this parameter whenisn't set to a
         time-based
         unit. Measurement Units
     Time_Zone_for_Time_of_Day {String}:
         Specifies the time zone of theparameter. Time of Day
         Geographically Local-Theparameter refers to the time zone in
         which the first stop of a route is located. If you are generating many
         routes that start in multiple time zones, the start times are
         staggered in coordinated universal time (UTC). For example, avalue of
         10:00 a.m., 2 January, means a start time of 10:00 a.m. eastern
         standard time (UTC-3:00) for routes beginning in the eastern time zone
         and 10:00 a.m. central standard time (UTC-4:00) for routes beginning
         in the central time zone. The start times are offset by one hour in
         UTC. The arrive and depart times and dates recorded in the output
         Stops feature class will refer to the local time zone of the first
         stop for each route. Time of DayTime of Day
         UTC-Theparameter refers to UTC. Choose this option if you
         want to generate a route for a specific time, such as now, but aren't
         certain in which time zone the first stop will be located. If you are
         generating many routes spanning multiple time zones, the start times
         in UTC are simultaneous. For example, avalue of 10:00 a.m., 2 January,
         means a start time of 5:00 a.m. eastern standard time (UTC-5:00) for
         routes beginning in the eastern time zone and 4:00 a.m. central
         standard time (UTC-6:00) for routes beginning in the central time
         zone. Both routes start at 10:00 a.m. UTC. The arrive and depart times
         and dates recorded in the output Stops feature class will refer to
         UTC. Time of DayTime of Day
     UTurn_at_Junctions {String}:
         Specifies the U-turn policy at junctions. Allowing U-turns implies the
         solver can turn around at a junction and double back on the same
         street. Given that junctions represent street intersections and dead
         ends, different vehicles may be able to turn around at some junctions
         but not at others-it depends on whether the junction represents an
         intersection or dead end. To accommodate this, the U-turn policy
         parameter is implicitly specified by the number of edges that connect
         to the junction, which is known as junction valency. The acceptable
         values for this parameter are listed below; each is followed by a
         description of its meaning in terms of junction
         valency.Allowed-U-turns are permitted at junctions with any number of
         connected edges. This is the default value. Not
         Allowed-U-turns are prohibited at all junctions,
         regardless of junction valency. However, U-turns are still permitted
         at network locations even when this option is chosen, but you can set
         the individual network locations'attribute to prohibit U-turns there
         as well. CurbApproachAllowed Only at Dead Ends-U-turns are
         prohibited at all junctions
         except those that have only one adjacent edge (a dead end).Allowed
         Only at Intersections and Dead Ends-U-turns are prohibited at
         junctions where exactly two adjacent edges meet but are permitted at
         intersections (junctions with three or more adjacent edges) and dead
         ends (junctions with exactly one adjacent edge). Often, networks have
         extraneous junctions in the middle of road segments. This option
         prevents vehicles from making U-turns at these locations. This
         parameter is ignored unlessis set to. Travel
         ModeCustom
     Point_Barriers {Feature Set}:
         Use this parameter to specify one or more points that will act as
         temporary restrictions or represent additional time or distance that
         may be required to travel on the underlying streets. For example, a
         point barrier can be used to represent a fallen tree along a street or
         a time delay spent at a railroad crossing.The tool imposes a limit of
         250 points that can be added as barriers.When specifying point
         barriers, you can set properties for each, such
         as its name or barrier type, using the following attributes:NameThe
         name of the barrier.BarrierTypeSpecifies whether the point barrier
         restricts travel completely or
         adds time or distance when it is crossed. The value for this attribute
         is specified as one of the following integers (use the numeric code,
         not the name in parentheses):0 (Restriction)-Prohibits travel through
         the barrier. The barrier is
         referred to as a restriction point barrier since it acts as a
         restriction. 2 (Added Cost)-Traveling through the barrier
         increases the
         travel time or distance by the amount specified in the,, orfield. This
         barrier type is referred to as an added cost point barrier.
         Additional_TimeAdditional_DistanceAdditionalCostAdditional_Time
         The added travel time when the barrier is traversed. This
         field is applicable only for added-cost barriers and when theparameter
         value is time based. Measurement Units        This field value
         must be greater than or equal to zero, and
         its units must be the same as those specified in theparameter.
         Measurement UnitsAdditional_Distance        The added distance when
         the barrier is traversed. This field
         is applicable only for added-cost barriers and when theparameter value
         is distance based. Measurement Units        The field value
         must be greater than or equal to zero, and its
         units must be the same as those specified in theparameter.
         Measurement UnitsAdditionalCost        The added cost when the barrier
         is traversed. This field is
         applicable only for added-cost barriers when theparameter value is
         neither time based nor distance based. Measurement
         UnitsFullEdgeSpecifies how the restriction point barriers are applied
         to the edge
         elements during the analysis. The field value is specified as one of
         the following integers (use the numeric code, not the name in
         parentheses):0 (False)-Permits travel on the edge up to the barrier
         but not through
         it. This is the default value.1 (True)-Restricts travel anywhere on
         the associated edge.CurbApproachSpecifies the direction of traffic
         that is affected by the barrier.
         The field value is specified as one of the following integers (use the
         numeric code, not the name in parentheses):0 (Either side of
         vehicle)-The barrier affects travel over the edge in
         both directions.1 (Right side of vehicle)-Vehicles are only affected
         if the barrier is
         on their right side during the approach. Vehicles that traverse the
         same edge but approach the barrier on their left side are not affected
         by the barrier.2 (Left side of vehicle)-Vehicles are only affected if
         the barrier is
         on their left side during the approach. Vehicles that traverse the
         same edge but approach the barrier on their right side are not
         affected by the barrier.Because junctions are points and don't have a
         side, barriers on
         junctions affect all vehicles regardless of the curb approach.
         Theattribute works with both types of national driving
         standards: right-hand traffic (United States) and left-hand traffic
         (United Kingdom). First, consider a facility on the left side of a
         vehicle. It is always on the left side regardless of whether the
         vehicle travels on the left or right half of the road. What may change
         with national driving standards is your decision to approach a
         facility from one of two directions, that is, so it ends up on the
         right or left side of the vehicle. For example, to arrive at a
         facility and not have a lane of traffic between the vehicle and the
         facility, choose 1 (Right side of vehicle) in the United States and 2
         (Left side of vehicle) in the United Kingdom.
         CurbApproachBearing        The direction in which a point is moving.
         The units are
         degrees and are measured clockwise from true north. This field is used
         in conjunction with thefield. BearingTolBearing data is usually
         sent automatically from a mobile device
         equipped with a GPS receiver. Try to include bearing data if you are
         loading an input location that is moving, such as a pedestrian or a
         vehicle.Using this field tends to prevent adding locations to the
         wrong edges,
         which can occur when a vehicle is near an intersection or an overpass,
         for example. Bearing also helps the tool determine on which side of
         the street the point is.BearingTol        The bearing tolerance value
         creates a range of acceptable
         bearing values when locating moving points on an edge using thefield.
         If thefield value is within the range of acceptable values that are
         generated from the bearing tolerance on an edge, the point can be
         added as a network location there; otherwise, the closest point on the
         next-nearest edge is evaluated. BearingBearingThe units are in
         degrees, and the default value is 30. Values must be
         greater than 0 and less than 180. A value of 30 means that when
         Network Analyst attempts to add a network location on an edge, a range
         of acceptable bearing values is generated 15 degrees to either side of
         the edge (left and right) and in both digitized directions of the
         edge.NavLatency        This field is only used in the solve process if
         theandfields
         also have values; however, entering afield value is optional, even
         when values are present inand.indicates how much cost is expected to
         elapse from the moment GPS information is sent from a moving vehicle
         to a server and the moment the processed route is received by the
         vehicle's navigation device.
         BearingBearingTolNavLatencyBearingBearingTolNavLatencyThe units of
         NavLatency are the same as the units of the impedance
         attribute.
     Line_Barriers {Feature Set}:
         Use this parameter to specify one or more lines that prohibit travel
         anywhere the lines intersect the streets. For example, a parade or
         protest that blocks traffic across several street segments can be
         modeled with a line barrier. A line barrier can also quickly fence off
         several roads from being traversed, thereby channeling possible routes
         away from undesirable parts of the street network. The tool
         imposes a limit on the number of streets you can
         restrict using theparameter. While there is no limit to the number of
         lines you can specify as line barriers, the combined number of streets
         intersected by all the lines cannot exceed 500. Line
         BarriersWhen specifying the line barriers, you can set name and
         barrier type
         properties for each using the following attributes:NameThe name of the
         barrier.
     Polygon_Barriers {Feature Set}:
         Use this parameter to specify polygons that either completely restrict
         travel or proportionately scale the time or distance required to
         travel on the streets intersected by the polygons. The service
         imposes a limit on the number of streets you can
         restrict using theparameter. While there is no limit to the number of
         polygons you can specify as polygon barriers, the combined number of
         streets intersected by all the polygons cannot exceed 2,000.
         Polygon BarriersWhen specifying the polygon barriers, you can set
         properties for each,
         such as its name or barrier type, using the following
         attributes:NameThe name of the barrier.BarrierTypeSpecifies whether
         the barrier restricts travel completely or scales
         the cost (such as time or distance) for traveling through it. The
         field value is specified as one of the following integers (use the
         numeric code, not the name in parentheses):0 (Restriction)-Prohibits
         traveling through any part of the barrier.
         The barrier is referred to as a restriction polygon barrier since it
         prohibits traveling on streets intersected by the barrier. One use of
         this type of barrier is to model floods covering areas of the street
         that make traveling on those streets impossible. 1 (Scaled
         Cost)-Scales the cost (such as travel time or
         distance) required to travel the underlying streets by a factor
         specified using theorfield. If the streets are partially covered by
         the barrier, the travel time or distance is apportioned and then
         scaled. For example, a factor of 0.25 means that travel on underlying
         streets is expected to be four times faster than normal. A factor of
         3.0 means it is expected to take three times longer than normal to
         travel on underlying streets. This barrier type is referred to as a
         scaled-cost polygon barrier. It can be used to model storms that
         reduce travel speeds in specific regions, for example.
         ScaledTimeFactorScaledDistanceFactorScaledTimeFactorThis is the factor
         by which the travel time of the streets intersected
         by the barrier is multiplied. The field value must be greater than
         zero. This field is applicable only for scaled-cost barriers
         and
         when theparameter is time-based. Measurement
         UnitsScaledDistanceFactorThis is the factor by which the distance of
         the streets intersected by
         the barrier is multiplied. The field value must be greater than zero.
         This field is applicable only for scaled-cost barriers and
         when theparameter is distance-based. Measurement
         UnitsScaledCostFactorThis is the factor by which the cost of the
         streets intersected by the
         barrier is multiplied. The field value must be greater than zero.
         This field is applicable only for scaled-cost barriers when
         theparameter is neither time-based nor distance-based.
         Measurement Units
     Use_Hierarchy {Boolean}:
         Specifies whether hierarchy will be used when finding the shortest
         paths between stops.Checked (True in Python)-Hierarchy will be used
         when finding routes.
         When hierarchy is used, the tool identifies higher-order streets (such
         as freeways) before lower-order streets (such as local roads) and can
         be used to simulate the driver preference of traveling on freeways
         instead of local roads even if that means a longer trip. This is
         especially useful when finding routes to faraway locations, because
         drivers on long-distance trips tend to prefer traveling on freeways,
         where stops, intersections, and turns can be avoided. Using hierarchy
         is computationally faster, especially for long-distance routes, as the
         tool identifies the best route from a relatively smaller subset of
         streets.Unchecked (False in Python)-Hierarchy will not be used when
         finding
         routes. If hierarchy is not used, the tool considers all the streets
         and doesn't necessarily identify higher-order streets when finding the
         route. This is often used when finding short routes in a city.The tool
         automatically reverts to using hierarchy if the straight-line
         distance between facilities and demand points is greater than 50 miles
         (80.46 kilometers), even if this parameter is unchecked (set to False
         in Python). This parameter is ignored unlessis set to. When
         modeling a
         custom walking mode, it is recommended that you turn off hierarchy
         since hierarchy is designed for motorized vehicles. Travel
         ModeCustom
     Restrictions {String}:
         The restrictions that will be honored by the tool when finding the
         best routes.A restriction represents a driving preference or
         requirement. In most
         cases, restrictions cause roads to be prohibited. For instance, using
         the Avoid Toll Roads restriction will result in a route that will
         include toll roads only when it is required to travel on toll roads to
         visit an incident or a facility. Height Restriction makes it possible
         to route around any clearances that are lower than the height of the
         vehicle. If you are carrying corrosive materials on the vehicle, using
         the Any Hazmat Prohibited restriction prevents hauling the materials
         along roads where it is marked illegal to do so. The values you
         provide for this parameter are ignored unlessis
         set to. Travel ModeCustom         Some restrictions require an
         additional value to be specified
         for their use. This value must be associated with the restriction name
         and a specific parameter intended to work with the restriction. You
         can identify such restrictions if their names appear in the
         AttributeName column of theparameter. Specify thefield for
         theparameter for the restriction to be correctly used when finding
         traversable roads. Attribute Parameter
         ValuesParameterValueAttribute Parameter Values         Some
         restrictions are supported only in certain countries;
         their availability is stated by region in the list below. Of the
         restrictions that have limited availability within a region, you can
         determine whether the restriction is available in a particular country
         by reviewing the table in the Country list section of Network analysis
         coverage. If a country has a value ofin the Logistics Attribute
         column, the restriction with select availability in the region is
         supported in that country. If you specify restriction names that are
         not available in the country where the incidents are located, the
         service ignores the invalid restrictions. The service also ignores
         restrictions when theattribute parameter value is between 0 and 1 (see
         theparameter). It prohibits all restrictions when theparameter value
         is greater than 0. YesRestriction UsageAttribute Parameter
         ValueRestriction UsageThe service supports the following restrictions:
         Any Hazmat Prohibited-The results will not include roads
         where transporting any kind of hazardous material is prohibited.
         Availability: Select countries in North America and Europe
         Avoid Carpool Roads-The results will avoid roads that are
         designated exclusively for car pool (high-occupancy) vehicles.
         Availability: All countries         Avoid Express Lanes-The results
         will avoid roads designated
         as express lanes. Availability: All countries         Avoid
         Ferries-The results will avoid ferries.
         Availability: All countries         Avoid Gates-The results will avoid
         roads where there are
         gates, such as keyed access or guard-controlled entryways.
         Availability: All countries         Avoid Limited Access Roads-The
         results will avoid roads that
         are limited-access highways. Availability: All countries
         Avoid Private Roads-The results will avoid roads that are not
         publicly owned and maintained. Availability: All countries
         Avoid Roads Unsuitable for Pedestrians-The results will avoid
         roads that are unsuitable for pedestrians. Availability: All
         countries         Avoid Stairways-The results will avoid all stairways
         on a
         pedestrian-suitable route. Availability: All countries
         Avoid Toll Roads-The results will avoid all toll roads for
         automobiles. Availability: All countries         Avoid Toll
         Roads for Trucks-The results will avoid all toll
         roads for trucks. Availability: All countries         Avoid
         Truck Restricted Roads-The results will avoid roads
         where trucks are not allowed, except when making deliveries.
         Availability: All countries         Avoid Unpaved Roads-The results
         will avoid roads that are not
         paved (for example, dirt, gravel, and so on). Availability:
         All countries         Axle Count Restriction-The results will not
         include roads
         where trucks with the specified number of axles are prohibited. The
         number of axles can be specified using the Number of Axles restriction
         parameter. Availability: Select countries in North America and
         Europe         Driving a Bus-The results will not include roads where
         buses
         are prohibited. Using this restriction will also ensure that the
         results will honor one-way streets. Availability: All
         countries         Driving a Taxi-The results will not include roads
         where taxis
         are prohibited. Using this restriction will also ensure that the
         results will honor one-way streets. Availability: All
         countries         Driving a Truck-The results will not include roads
         where
         trucks are prohibited. Using this restriction will also ensure that
         the results will honor one-way streets. Availability: All
         countries         Driving an Automobile-The results will not include
         roads
         where automobiles are prohibited. Using this restriction will also
         ensure that the results will honor one-way streets.
         Availability: All countries         Driving an Emergency Vehicle-The
         results will not include
         roads where emergency vehicles are prohibited. Using this restriction
         will also ensure that the results will honor one-way streets.
         Availability: All countries         Height Restriction-The results
         will not include roads where
         the vehicle height exceeds the maximum allowed height for the road.
         The vehicle height can be specified using the Vehicle Height (meters)
         restriction parameter. Availability: Select countries in North
         America and Europe         Kingpin to Rear Axle Length Restriction-The
         results will not
         include roads where the vehicle length exceeds the maximum allowed
         kingpin to rear axle for all trucks on the road. The length between
         the vehicle kingpin and the rear axle can be specified using the
         Vehicle Kingpin to Rear Axle Length (meters) restriction parameter.
         Availability: Select countries in North America and Europe
         Length Restriction-The results will not include roads where
         the vehicle length exceeds the maximum allowed length for the road.
         The vehicle length can be specified using the Vehicle Length (meters)
         restriction parameter. Availability: Select countries in North
         America and Europe         Preferred for Pedestrians-The results will
         use preferred
         routes suitable for pedestrian navigation. Availability:
         Select countries in North America and Europe         Riding a
         Motorcycle-The results will not include roads where
         motorcycles are prohibited. Using this restriction will also ensure
         that the results will honor one-way streets. Availability: All
         countries         Roads Under Construction Prohibited-The results will
         not
         include roads that are under construction. Availability: All
         countries         Semi or Tractor with One or More Trailers
         Prohibited-The
         results will not include roads where semis or tractors with one or
         more trailers are prohibited. Availability: Select countries
         in North America and Europe         Single Axle Vehicles
         Prohibited-The results will not include
         roads where vehicles with single axles are prohibited.
         Availability: Select countries in North America and Europe
         Tandem Axle Vehicles Prohibited-The results will not include
         roads where vehicles with tandem axles are prohibited.
         Availability: Select countries in North America and Europe
         Through Traffic Prohibited-The results will not include roads
         where through traffic (nonlocal) is prohibited. Availability:
         All countries         Truck with Trailers Restriction-The results will
         not include
         roads where trucks with the specified number of trailers on the truck
         are prohibited. The number of trailers on the truck can be specified
         using the Number of Trailers on Truck restriction parameter.
         Availability: Select countries in North America and Europe         Use
         Preferred Hazmat Routes-The results will prefer roads
         that are designated for transporting any kind of hazardous materials.
         Availability: Select countries in North America and Europe         Use
         Preferred Truck Routes-The results will prefer roads that
         are designated as truck routes, such as the roads that are part of the
         national network as specified by the National Surface Transportation
         Assistance Act in the United States, or roads that are designated as
         truck routes by the state or province, or roads that are preferred by
         truckers when driving in an area. Availability: Select
         countries in North America and Europe         Walking-The results will
         not include roads where pedestrians
         are prohibited. Availability: All countries         Weight
         Restriction-The results will not include roads where
         the vehicle weight exceeds the maximum allowed weight for the road.
         The vehicle weight can be specified using the Vehicle Weight
         (kilograms) restriction parameter. Availability: Select
         countries in North America and Europe         Weight per Axle
         Restriction-The results will not include
         roads where the vehicle weight per axle exceeds the maximum allowed
         weight per axle for the road. The vehicle weight per axle can be
         specified using the Vehicle Weight per Axle (kilograms) restriction
         parameter. Availability: Select countries in North America and
         Europe         Width Restriction-The results will not include roads
         where
         the vehicle width exceeds the maximum allowed width for the road. The
         vehicle width can be specified using the Vehicle Width (meters)
         restriction parameter. Availability: Select countries in North
         America and Europe
     Attribute_Parameter_Values {Record Set}:
         Use this parameter to specify additional values required by an
         attribute or restriction, such as to specify whether the restriction
         prohibits, avoids, or prefers travel on restricted roads. If the
         restriction is meant to avoid or prefer roads, you can further specify
         the degree to which they are avoided or preferred using this
         parameter. For example, you can choose to never use toll roads, avoid
         them as much as possible, or prefer them. The values you
         provide for this parameter are ignored unlessis
         set to. Travel ModeCustom        If you specify theparameter
         from a feature class, the field
         names on the feature class must match the fields as follows:
         Attribute Parameter ValuesAttributeName-The name of the restriction.
         ParameterName-The
         name of the parameter associated with the
         restriction. A restriction can have one or morefield values based on
         its intended use. ParameterName          ParameterValue-The
         value forused by the tool when evaluating
         the restriction. ParameterName        Theparameter is
         dependent on theparameter. Thefield is
         applicable only if the restriction name is specified as the value for
         theparameter. Attribute Parameter
         ValuesRestrictionsParameterValueRestrictions        In, each
         restriction (listed as) has afield value, Restriction
         Usage, that specifies whether the restriction prohibits, avoids, or
         prefers travel on the roads associated with the restriction as well as
         the degree to which the roads are avoided or preferred. The
         Restriction Usagecan be assigned any of the following string values or
         their equivalent numeric values listed in the parentheses:
         Attribute Parameter
         ValuesAttributeNameParameterNameParameterNamePROHIBITED (-1)-Travel on
         the roads using the restriction is
         completely prohibited.AVOID_HIGH (5)-It is highly unlikely the tool
         will include in the
         route the roads that are associated with the restriction.AVOID_MEDIUM
         (2)-It is unlikely the tool will include in the route the
         roads that are associated with the restriction.AVOID_LOW (1.3)-It is
         somewhat unlikely the tool will include in the
         route the roads that are associated with the restriction.PREFER_LOW
         (0.8)-It is somewhat likely the tool will include in the
         route the roads that are associated with the restriction.PREFER_MEDIUM
         (0.5)-It is likely the tool will include in the route
         the roads that are associated with the restriction.PREFER_HIGH
         (0.2)-It is highly likely the tool will include in the
         route the roads that are associated with the restriction.In most
         cases, you can use the default value, PROHIBITED, as the
         Restriction Usage value if the restriction is dependent on a vehicle
         characteristic such as vehicle height. However, in some cases, the
         Restriction Usage value depends on your routing preferences. For
         example, the Avoid Toll Roads restriction has the default value of
         AVOID_MEDIUM for the Restriction Usage attribute. This means that when
         the restriction is used, the tool will route around toll roads when it
         can. AVOID_MEDIUM also indicates how important it is to avoid toll
         roads when finding the best route; it has a medium priority. Choosing
         AVOID_LOW puts lower importance on avoiding tolls; choosing AVOID_HIGH
         instead gives it a higher importance and makes it more acceptable for
         the service to generate longer routes to avoid tolls. Choosing
         PROHIBITED entirely disallows travel on toll roads, making it
         impossible for a route to travel on any portion of a toll road. Keep
         in mind that avoiding or prohibiting toll roads, and avoiding toll
         payments, is the objective for some. In contrast, others prefer to
         drive on toll roads, because avoiding traffic is more valuable to them
         than the money spent on tolls. In the latter case, choose PREFER_LOW,
         PREFER_MEDIUM, or PREFER_HIGH as the value for Restriction Usage. The
         higher the preference, the farther the tool will go to travel on the
         roads associated with the restriction.
     Route_Shape {String}:
         Specifies the type of route features that will be output by the
         tool.True Shape-The exact shape of the resulting route that is based
         on the
         underlying streets will be returned. True Shape with
         Measures-The exact shape of the resulting
         route that is based on the underlying streets will be returned.
         Additionally, construct measures so the shape can be used in linear
         referencing. The measurements increase from the first stop and record
         the cumulative travel time or travel distance in the units specified
         by theparameter. Measurement UnitsStraight Line-A straight
         line between two stops will be returned.None-No shapes for the routes
         will be returned. This value can be
         useful, and return results quickly, when you are only interested in
         determining the total travel time or travel distance of a route.
         When theparameter is set toor, the generalization of the route
         shape can be further controlled using the appropriate value for
         theparameter. Route ShapeTrue ShapeTrue Shape with
         MeasuresRoute Line Simplification Tolerance        No matter which
         value you choose for theparameter, the best
         route is always determined by minimizing the travel time or the travel
         distance, never using the straight-line distance between stops. This
         means that only the route shapes are different, not the underlying
         streets that are searched when finding the route. Route Shape
     Route_Line_Simplification_Tolerance {Linear Unit}:
         The amount by which the geometry of the output lines will be
         simplified for routes, directions, and route edges. The tool
         ignores this parameter if theparameter isn't set to.
         Route ShapeTrue ShapeSimplification maintains critical points on a
         route, such as turns at
         intersections, to define the essential shape of the route and removes
         other points. The simplification distance you specify is the maximum
         allowable offset that the simplified line can deviate from the
         original line. Simplifying a line reduces the number of vertices that
         are part of the route geometry. This improves the tool processing
         time.
     Populate_Route_Edges {Boolean}:
         Specifies whether edges for each route will be generated. Route edges
         represent the individual street features or other similar features
         that are traversed by a route. The output Route Edges layer is
         commonly used to determine which streets or paths are traveled on the
         most or least by the resultant routes.Checked (True)-Route edges will
         be generated, and the output Route
         Edges layer will be populated with line features.Unchecked
         (False)-Route edges will not be generated, and an empty
         output Route Edges layer will be returned.
     Populate_Directions {Boolean}:
         Specifies whether the tool will generate driving directions for each
         route. Checked (True in Python)-Directions will be generated
         and
         configured based on the values of the,, andparameters.
         Directions LanguageDirections Style NameDirections Distance
         UnitsUnchecked (False in Python)-Directions will not be generated, and
         the
         tool will return an empty Directions layer.
     Directions_Language {String}:
         The language that will be used when generating travel directions.
         This parameter is used only when theparameter is checked (True
         in Python). Populate Directions        The parameter value can
         be specified using one of the
         following two- or five-character language codes:
         ar-Arabicbg-Bulgarianbs-Bosnianca-Catalancs-Czechda-Danishde-Germanel-
         Greeken-Englishes-Spanishet-Estonianfi-Finnishfr-Frenchhe-Hebrewhr-Cro
         atianhu-Hungarianid-Indonesianit-Italianja-Japaneseko-Koreanlt-Lithuan
         ianlv-Latviannb-Norwegiannl-Dutchpl-Polishpt-BR-Portuguese (Brazil)pt-
         PT-Portuguese (Portugal)ro-Romanianru-Russiansk-Slovaksl-Sloveniansr-S
         erbiansv-Swedishth-Thaitr-Turkishuk-Ukrainianvi-Vietnamesezh-
         CN-Chinese (China)zh-HK-Chinese (Hong Kong)zh-TW-Chinese (Taiwan)The
         tool first searches for an exact match for the specified language
         including any language localization. If an exact match is not found,
         it tries to match the language family. If a match is still not found,
         the tool returns the directions using the default language, English.
         For example, if the directions language is specified as es-MX (Mexican
         Spanish), the tool will return the directions in Spanish, as it
         supports the es language code but not es-MX.If a language supports
         localization, such as Brazilian Portuguese (pt-
         BR) and European Portuguese (pt-PT), specify the language family and
         the localization. If you only specify the language family, the tool
         will not match the language family and instead return directions in
         the default language, English. For example, if the directions language
         specified is pt, the tool will return the directions in English since
         it cannot determine whether the directions should be returned in pt-BR
         or pt-PT.
     Directions_Distance_Units {String}:
         Specifies the units that will display travel distance in the
         driving directions. This parameter is used only when theparameter is
         checked (True in Python). Populate DirectionsMiles-The linear
         unit will be miles.Kilometers-The linear unit will be
         kilometers.Meters-The linear unit will be meters.Feet-The linear unit
         will be feet.Yards-The linear unit will be yards.NauticalMiles-The
         linear unit will be nautical miles.
     Directions_Style_Name {String}:
         Specifies the name of the formatting style for the directions.
         This parameter is used only when theparameter is checked (True in
         Python). Populate DirectionsNA Desktop-The style will be turn-
         by-turn directions suitable for
         printing.NA Navigation-The style will be turn-by-turn directions
         designed for
         an in-vehicle navigation device.
     Travel_Mode {String}:
         The mode of transportation that will be modeled in the analysis.
         Travel modes are managed in ArcGIS Online and can be configured by the
         administrator of your organization to reflect the organization's
         workflows. Specify the name of a travel mode that is supported by your
         organization. To get a list of supported travel mode names, run
         the Get
         Travel Modes tool from the Utilities toolbox under the same GIS server
         connection you used to access the tool. The Get Travel Modes tool adds
         the Supported Travel Modes table to the application. Any value in
         thefield from the Supported Travel Modes table can be specified as
         input. You can also specify the value from thefield as input. This
         speeds up tool operation, as the tool does not have to find the
         settings based on the travel mode name. Travel Mode NameTravel
         Mode Settings        The default value,, allows you to configure a
         custom travel
         mode using the custom travel mode parameters (,,,, and). The default
         values of the custom travel mode parameters model traveling by car.
         You can also chooseand set the custom travel mode parameters listed
         above to model a pedestrian with a fast walking speed or a truck with
         a given height, weight, and cargo of certain hazardous materials. You
         can try different settings to get the analysis results you want. Once
         you have identified the analysis settings, work with your
         organization's administrator and save these settings as part of a new
         or existing travel mode so that everyone in your organization can run
         the analysis with the same settings. CustomUTurn at
         JunctionsUse HierarchyRestrictionsAttribute Parameter
         ValuesImpedanceCustom        When you choose, the values you set for
         the custom travel mode
         parameters are included in the analysis. Specifying another travel
         mode, as defined by your organization, causes any values you set for
         the custom travel mode parameters to be ignored; the tool overrides
         them with values from the specified travel mode. Custom
     Impedance {String}:
         Specifies the impedance, which is a value that represents the effort
         or cost of traveling along road segments or on other parts of the
         transportation network.Travel time is an impedance: a car may take 1
         minute to travel a mile
         along an empty road. Travel times can vary by travel mode-a pedestrian
         may take more than 20 minutes to walk the same mile, so it is
         important to choose the right impedance for the travel mode you are
         modeling.Travel distance can also be an impedance; the length of a
         road in
         kilometers can be thought of as impedance. Travel distance in this
         sense is the same for all modes-a kilometer for a pedestrian is also a
         kilometer for a car. (What may change is the pathways on which the
         different modes are allowed to travel, which affects distance between
         points, and this is modeled by travel mode settings.)        The value
         you provide for this parameter is ignored unlessis
         set to, which is the default value. Travel ModeCustomChoose
         from the following impedance values:         TravelTime-Historical and
         live traffic data is used. This
         option is good for modeling the time it takes automobiles to travel
         along roads at a specific time of day using live traffic speed data
         where available. When using, you can optionally set the
         TravelTime::Vehicle Maximum Speed (km/h) attribute parameter to
         specify the physical limitation of the speed the vehicle is capable of
         traveling. TravelTimeMinutes-Live traffic data is not used,
         but historical average speeds
         for automobiles data is used. TruckTravelTime-Historical and
         live traffic data is used, but
         the speed is capped at the posted truck speed limit. This is good for
         modeling the time it takes for the trucks to travel along roads at a
         specific time. When using, you can optionally set the
         TruckTravelTime::Vehicle Maximum Speed (km/h) attribute parameter to
         specify the physical limitation of the speed the truck is capable of
         traveling. TruckTravelTimeTruckMinutes-Live traffic data is
         not used, but the smaller of the
         historical average speeds for automobiles and the posted speed limits
         for trucks is used.WalkTime-The default is a speed of 5 km/hr on all
         roads and paths, but
         this can be configured through the WalkTime::Walking Speed (km/h)
         attribute parameter.Miles-Length measurements along roads are stored
         in miles and can be
         used for performing analysis based on shortest
         distance.Kilometers-Length measurements along roads are stored in
         kilometers
         and can be used for performing analysis based on shortest
         distance.TimeAt1KPH-The default is a speed of 1 km/hr on all roads and
         paths.
         The speed cannot be changed using any attribute parameter.Drive
         Time-Travel times for a car are modeled. These travel times are
         dynamic and fluctuate according to traffic flows in areas where
         traffic data is available. This is the default value.Truck Time-Travel
         times for a truck are modeled. These travel times
         are static for each road and don't fluctuate with traffic.Walk
         Time-Travel times for a pedestrian are modeled. Travel
         Distance-Length measurements along roads and paths are
         stored. To model walk distance, choose this option and ensure thatis
         set for theparameter. Similarly, to model drive or truck distance,
         choosehere and set the appropriate restrictions so the vehicle travels
         only on roads where it is permitted to do so.
         WalkingRestrictionTravel Distance        If you choose a time-based
         impedance, such as,,,, or,
         theparameter must be set to a time-based value. If you choose a
         distance-based impedance, such asor,must be distance based.
         TravelTimeTruckTravelTimeMinutesTruckMinutesWalkTimeMeasurement
         UnitsMilesKilometersMeasurement Units        ,,, andimpedance values
         are no longer supported and will be
         removed in a future release. If you use one of these values, the tool
         uses the value of theparameter for time-based values and theparameter
         for distance-based values. Drive TimeTruck TimeWalk TimeTravel
         DistanceTime ImpedanceDistance Impedance
     Time_Zone_for_Time_Windows {String}:
         Specifies the time zone that will be used for the time window
         values on stops. The time windows are specified as part ofandfields on
         stops. This parameter is applicable only when theparameter is checked
         (set to True). TimeWindowStartTimeWindowEndUse Time
         WindowsGeographically Local-The time window values associated with the
         stops
         are in the time zone in which the stops are located. For example, if
         the stop is located in an area that follows eastern standard time and
         has time window values of 8 AM and 10 AM, the time window values will
         be treated as 8 a.m. and 10 a.m eastern standard time. This is the
         default.UTC-The time window values associated with the stops are in
         coordinated universal time (UTC). For example, if the stop is located
         in an area that follows eastern standard time and has time window
         values of 8 AM and 10 AM, the time window values will be treated as 12
         p.m and 2 p.m eastern standard time, assuming eastern standard time is
         obeying daylight saving time. Specifying the time window values in UTC
         is useful if you do not know the time zone in which the stops are
         located or if you have stops in multiple time zones and you want all
         the time windows to start simultaneously.
     Save_Output_Network_Analysis_Layer {Boolean}:
         Specifies whether the analysis settings will be saved as a network
         analysis layer file. You cannot directly work with this file even when
         you open the file in an ArcGIS Desktop application such as ArcMap. It
         is meant to be sent to Esri Technical Support to diagnose the quality
         of results returned from the tool. Checked (True in
         Python)-The output will be saved as a
         network analysis layer file. The file will be downloaded to a
         temporary directory on your machine. In ArcGIS Pro, the location of
         the downloaded file can be determined by viewing the value for
         theparameter in the entry corresponding to the tool service in the
         geoprocessing history of the project. In ArcMap, the location of the
         file can be determined by accessing theoption in the shortcut menu of
         theparameter in the entry corresponding to the tool service in
         thewindow. Output Network Analysis LayerCopy LocationOutput
         Network Analysis LayerGeoprocessing ResultsUnchecked (False in
         Python)-The output will not be saved as a network
         analysis layer file. This is the default.
     Overrides {String}:
         This parameter is for internal use only.
     Save_Route_Data {Boolean}:
         Specifies whether the output will include a .zip file that contains a
         file geodatabase with the inputs and outputs of the analysis in a
         format that can be used to share route layers with ArcGIS Online or
         Portal for ArcGIS. Checked (True in Python)-The route data
         will be saved as a
         .zip file. The file is downloaded to a temporary directory on your
         machine. In ArcGIS Pro, the location of the downloaded file can be
         determined by viewing the value for theparameter in the entry
         corresponding to the tool operation in the geoprocessing history of
         the project. In ArcMap, the location of the file can be determined by
         accessing theoption in the shortcut menu of theparameter in the entry
         corresponding to the tool operation in thewindow. Output
         Route DataCopy LocationOutput Route DataGeoprocessing ResultsUnchecked
         (False in Python)-The route data will not be saved as a .zip
         file. This is the default.
     Time_Impedance {String}:
         If the impedance for the travel mode, as specified using
         theparameter, is time based, the values for theandparameters must be
         identical. Otherwise, the service will return an error. The
         time-based impedance value represents the travel time along road
         segments or on other parts of the transportation network.ImpedanceTime
         ImpedanceImpedanceMinutes-Time impedance will be
         minutes.TravelTime-Time impedance will
         be travel time.TimeAt1KPH-Time impedance will be time at one kilometer
         per hour.WalkTime-Time impedance will be walk time.TruckMinutes-Time
         impedance will be truck minutes.TruckTravelTime-Time impedance will be
         truck travel time.
     Distance_Impedance {String}:
         If the impedance for the travel mode, as specified using
         theparameter, is distance based, the values for theandparameters must
         be identical. Otherwise, the service will return an error. The
         distance-based impedance value represents the travel distance
         along road segments or on other parts of the transportation
         network.ImpedanceDistance ImpedanceImpedanceMiles-Distance impedance
         will be miles.Kilometers-Distance impedance
         will be kilometers.
     Output_Format {String}:
         Specifies the format in which the output features will be
         returned.Feature Set-The output features will be returned as feature
         classes
         and tables. This is the default.JSON File-The output features will be
         returned as a compressed file
         containing the JSON representation of the outputs. When this option is
         specified, the output is a single file (with a .zip extension) that
         contains one or more JSON files (with a .json extension) for each of
         the outputs created by the service.GeoJSON File-The output features
         will be returned as a compressed file
         containing the GeoJSON representation of the outputs. When this option
         is specified, the output is a single file (with a .zip extension) that
         contains one or more GeoJSON files (with a .geojson extension) for
         each of the outputs created by the service. When a file-based
         output format, such asor, is specified, no
         outputs will be added to the display because the application, such as
         ArcMap or ArcGIS Pro, cannot draw the contents of the result file.
         Instead, the result file is downloaded to a temporary directory on
         your machine. In ArcGIS Pro, the location of the downloaded file can
         be determined by viewing the value for theparameter in the entry
         corresponding to the tool operation in the geoprocessing history of
         the project. In ArcMap, the location of the file can be determined by
         accessing theoption in the shortcut menu of theparameter in the entry
         corresponding to the tool operation in thewindow. JSON
         FileGeoJSON FileOutput Result FileCopy LocationOutput Result
         FileGeoprocessing Results
     Ignore_Invalid_Locations {Boolean}:
         Specifies whether invalid input locations will be ignored.SKIP-Network
         locations that are unlocated will be ignored and the
         analysis will run using valid network locations only. The analysis
         will also continue if locations are on nontraversable elements or have
         other errors. This is useful if you know the network locations are not
         all correct, but you want to run the analysis with the network
         locations that are valid. This is the default.HALT-Invalid locations
         will not be ignored. Do not run the analysis if
         there are invalid locations. Correct the invalid locations and rerun
         the analysis.
     Locate_Settings {String}:
         Use this parameter to specify settings that affect how inputs are
         located, such as the maximum search distance to use when locating the
         inputs on the network or the network sources being used for locating.
         The locator JSON object has the following
         properties:Currently, you can't specify different source names for the
         sources array. Also, allowAutoRelocate is always set to true since the
         service does not support location fields. tolerance
         and toleranceUnits-Allows you to control the
         maximum search distance when locating inputs. If no valid network
         location is found within this distance, the input features will be
         considered unlocated. A small search tolerance decreases the
         likelihood of locating on the wrong street but increases the
         likelihood of not finding any valid network location. The
         toleranceUnits parameter value can be specified as one of the
         following values:
         esriCentimetersesriDecimalDegreesesriDecimetersesriFeetesriInchesesriI
         ntFeetesriIntInchesesriIntMilesesriIntNauticalMilesesriIntYardsesriKil
         ometersesriMetersesriMilesesriMillimetersesriNauticalMilesesriYards
         sources-Allows you to control which network source can be
         used for locating. For example, you can configure the analysis to
         locate inputs on streets but not on sidewalks. The list of possible
         sources on which to locate is specific to the network dataset this
         service references. Only the sources that are present in the sources
         array are used for locating. Sources is specified as an array of
         objects each having the following property:          name-The name of
         the network source feature class that can be used for
         locating inputsallowAutoRelocate-Allows you to control whether inputs
         with existing
         network location fields can be automatically relocated when solving to
         ensure valid, routable location fields for the analysis. If the value
         is true, points located on restricted network elements and points
         affected by barriers will be relocated to the closest routable
         location. If the value is false, network location fields will be used
         as is even if the points are unreachable, and this may cause the solve
         to fail. Even if the value is false, inputs with no location fields or
         incomplete location fields will be located during the solve
         operation.The parameter value is specified as a JSON object. The JSON
         object
         allows you to specify a locator JSON for all input feature in the
         analysis, or you can specify an override for a particular input. The
         override allows you to have different settings for each analysis
         input. For example, you can disallow stops to locate on highway ramps
         and allow point barriers to locate on highway ramps. When specifying
         the Locate_Settings JSON, you must provide the tolerance,
         toleranceUnits, and allowAutoRelocate properties. If you need to
         provide a different locator JSON for a particular input class, you
         must include the overrides property for that input. The property name
         must match the input parameter name. The locator JSON for a particular
         input doesn't need to include all the properties; you only need to
         include the properties that are different from the default locator
         JSON properties."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.FindRoutes_agolservices(
                *gp_fixargs(
                    (
                        Stops,
                        Measurement_Units,
                        Analysis_Region,
                        Reorder_Stops_to_Find_Optimal_Routes,
                        Preserve_Terminal_Stops,
                        Return_to_Start,
                        Use_Time_Windows,
                        Time_of_Day,
                        Time_Zone_for_Time_of_Day,
                        UTurn_at_Junctions,
                        Point_Barriers,
                        Line_Barriers,
                        Polygon_Barriers,
                        Use_Hierarchy,
                        Restrictions,
                        Attribute_Parameter_Values,
                        Route_Shape,
                        Route_Line_Simplification_Tolerance,
                        Populate_Route_Edges,
                        Populate_Directions,
                        Directions_Language,
                        Directions_Distance_Units,
                        Directions_Style_Name,
                        Travel_Mode,
                        Impedance,
                        Time_Zone_for_Time_Windows,
                        Save_Output_Network_Analysis_Layer,
                        Overrides,
                        Save_Route_Data,
                        Time_Impedance,
                        Distance_Impedance,
                        Output_Format,
                        Ignore_Invalid_Locations,
                        Locate_Settings,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateOriginDestinationCostMatrix_agolservices", None)
def GenerateOriginDestinationCostMatrix(
    Origins=None,
    Destinations=None,
    Travel_Mode=None,
    Time_Units: Literal["Seconds", "Minutes", "Hours", "Days"] | None = None,
    Distance_Units: Literal["Meters", "Kilometers", "Feet", "Yards", "Miles", "NauticalMiles"] | None = None,
    Analysis_Region: Literal[
        "Europe", "Japan", "Korea", "MiddleEastAndAfrica", "NorthAmerica", "SouthAmerica", "SouthAsia", "Thailand"
    ]
    | None = None,
    Number_of_Destinations_to_Find=None,
    Cutoff=None,
    Time_of_Day=None,
    Time_Zone_for_Time_of_Day: Literal["Geographically Local", "UTC"] | None = None,
    Point_Barriers=None,
    Line_Barriers=None,
    Polygon_Barriers=None,
    UTurn_at_Junctions: Literal[
        "Allowed", "Not Allowed", "Allowed Only at Dead Ends", "Allowed Only at Intersections and Dead Ends"
    ]
    | None = None,
    Use_Hierarchy=None,
    Restrictions: list[
        Literal[
            "Any Hazmat Prohibited",
            "Avoid Carpool Roads",
            "Avoid Express Lanes",
            "Avoid Ferries",
            "Avoid Gates",
            "Avoid Limited Access Roads",
            "Avoid Private Roads",
            "Avoid Roads Unsuitable for Pedestrians",
            "Avoid Stairways",
            "Avoid Toll Roads",
            "Avoid Toll Roads for Trucks",
            "Avoid Truck Restricted Roads",
            "Avoid Unpaved Roads",
            "Axle Count Restriction",
            "Driving a Bus",
            "Driving a Taxi",
            "Driving a Truck",
            "Driving an Automobile",
            "Driving an Emergency Vehicle",
            "Height Restriction",
            "High Speed Roads Restriction",
            "Kingpin to Rear Axle Length Restriction",
            "Length Restriction",
            "Preferred for Pedestrians",
            "Riding a Motorcycle",
            "Roads Under Construction Prohibited",
            "Semi or Tractor with One or More Trailers Prohibited",
            "Single Axle Vehicles Prohibited",
            "Tandem Axle Vehicles Prohibited",
            "Through Traffic Prohibited",
            "Truck with Trailers Restriction",
            "Use Preferred Hazmat Routes",
            "Use Preferred Truck Routes",
            "Walking",
            "Weight Restriction",
            "Weight per Axle Restriction",
            "Width Restriction",
        ]
    ]
    | Literal[
        "Any Hazmat Prohibited",
        "Avoid Carpool Roads",
        "Avoid Express Lanes",
        "Avoid Ferries",
        "Avoid Gates",
        "Avoid Limited Access Roads",
        "Avoid Private Roads",
        "Avoid Roads Unsuitable for Pedestrians",
        "Avoid Stairways",
        "Avoid Toll Roads",
        "Avoid Toll Roads for Trucks",
        "Avoid Truck Restricted Roads",
        "Avoid Unpaved Roads",
        "Axle Count Restriction",
        "Driving a Bus",
        "Driving a Taxi",
        "Driving a Truck",
        "Driving an Automobile",
        "Driving an Emergency Vehicle",
        "Height Restriction",
        "High Speed Roads Restriction",
        "Kingpin to Rear Axle Length Restriction",
        "Length Restriction",
        "Preferred for Pedestrians",
        "Riding a Motorcycle",
        "Roads Under Construction Prohibited",
        "Semi or Tractor with One or More Trailers Prohibited",
        "Single Axle Vehicles Prohibited",
        "Tandem Axle Vehicles Prohibited",
        "Through Traffic Prohibited",
        "Truck with Trailers Restriction",
        "Use Preferred Hazmat Routes",
        "Use Preferred Truck Routes",
        "Walking",
        "Weight Restriction",
        "Weight per Axle Restriction",
        "Width Restriction",
    ]
    | str
    | None = None,
    Attribute_Parameter_Values=None,
    Impedance: Literal[
        "Drive Time",
        "Truck Time",
        "Walk Time",
        "Travel Distance",
        "Minutes",
        "TimeAt1KPH",
        "TravelTime",
        "TruckMinutes",
        "TruckTravelTime",
        "WalkTime",
        "Kilometers",
        "Miles",
    ]
    | None = None,
    Origin_Destination_Line_Shape: Literal["None", "Straight Line"] | None = None,
    Save_Output_Network_Analysis_Layer=None,
    Overrides=None,
    Time_Impedance: Literal["Minutes", "TimeAt1KPH", "TravelTime", "TruckMinutes", "TruckTravelTime", "WalkTime"]
    | None = None,
    Distance_Impedance: Literal["Kilometers", "Miles"] | None = None,
    Output_Format: Literal["Feature Set", "CSV File", "JSON File", "GeoJSON File"] | None = None,
    Ignore_Invalid_Locations=None,
    Locate_Settings=None,
) -> Result:
    """GenerateOriginDestinationCostMatrix_agolservices(Origins, Destinations, {Travel_Mode}, {Time_Units}, {Distance_Units}, {Analysis_Region}, {Number_of_Destinations_to_Find}, {Cutoff}, {Time_of_Day}, {Time_Zone_for_Time_of_Day}, {Point_Barriers}, {Line_Barriers}, {Polygon_Barriers}, {UTurn_at_Junctions}, {Use_Hierarchy}, {Restrictions;Restrictions...}, {Attribute_Parameter_Values}, {Impedance}, {Origin_Destination_Line_Shape}, {Save_Output_Network_Analysis_Layer}, {Overrides}, {Time_Impedance}, {Distance_Impedance}, {Output_Format}, {Ignore_Invalid_Locations}, {Locate_Settings})

       Creates an origin-destination (OD) cost matrix from multiple origins
       to multiple destinations. An OD cost matrix is a table that contains
       the travel time and travel distance from each origin to each
       destination. Additionally, it ranks the destinations that each origin
       connects to in ascending order based on the minimum time or distance
       required to travel from that origin to each destination. The best path
       on the street network is discovered for each origin-destination pair,
       and the travel times and travel distances are stored as attributes of
       the output lines. Even though the lines are straight for performance
       reasons, they store the travel time and travel distance along the
       street network, not straight-line distance.

    INPUTS:
     Origins (Feature Set):
         Specifies the starting points from which to travel to the
         destinations.You can add up to 1000 origins.When specifying the
         origins, you can set properties for each-such as
         its name or the number of destinations to find from the origin-using
         the following attributes:Name        The name of the origin. The name
         can be a unique identifier
         for the origin. The name is included in the output lines (as thefield)
         and in the output origins (as thefield) and can be used to join
         additional information from the tool outputs to the attributes of your
         origins. OriginNameNameIf the name is not specified, a unique
         name prefixed with Location is
         automatically generated.TargetDestinationCountThe maximum number of
         destinations to find for the origin. If a value is not
         specified, the value from theparameter is
         used. Number of Destinations to FindThis field allows you to
         specify a different number of destinations to
         find for each origin. For example, using this field, you can find the
         three closest destinations from one origin and the two closest
         destinations from another origin.CutoffThe impedance value at which to
         stop searching for destinations from a
         given origin. This attribute allows you to specify a different cutoff
         value for each destination. For example, using this attribute, you can
         specify to search for destinations within five minutes of travel time
         from one origin and to search for destinations within eight minutes of
         travel time from another origin. The units of the cutoff are
         the same as the units of your
         impedance attribute. If a value is not specified, the value from
         theparameter is used. CutoffCurbApproachSpecifies the direction
         a vehicle may depart from the origin. The
         field value is specified as one of the following integers (use the
         numeric code, not the name in parentheses):0 (Either side of
         vehicle)-The vehicle can depart the origin in either
         direction, so a U-turn is allowed at the origin. This setting can be
         chosen if it is possible and practical for a vehicle to turn around at
         the origin. This decision may depend on the width of the road and the
         amount of traffic or whether the origin has a parking lot where
         vehicles can enter and turn around.1 (Right side of vehicle)-When the
         vehicle departs the origin, the
         origin must be on the right side of the vehicle. A U-turn is
         prohibited. This is typically used for vehicles such as buses that
         must depart from the bus stop on the right-hand side.2 (Left side of
         vehicle)-When the vehicle departs the origin, the curb
         must be on the left side of the vehicle. A U-turn is prohibited. This
         is typically used for vehicles such as buses that must depart from the
         bus stop on the left-hand side.3 (No U-Turn)-For this tool, this value
         functions the same as 0
         (Either side of vehicle). Theattribute is designed to work with
         both kinds of national
         driving standards: right-hand traffic (United States) and left-hand
         traffic (United Kingdom). First, consider an origin on the left side
         of a vehicle. It is always on the left side regardless of whether the
         vehicle travels on the left or right half of the road. What may change
         with national driving standards is your decision to depart the origin
         from one of two directions, that is, so it ends up on the right or
         left side of the vehicle. For example, if you want to depart from an
         origin and not have a lane of traffic between the vehicle and the
         origin, choose 1 (Right side of vehicle) in the United States and 2
         (Left side of vehicle) in the United Kingdom.
         CurbApproachBearing        The direction in which a point is moving.
         The units are
         degrees and are measured clockwise from true north. This field is used
         in conjunction with thefield. BearingTolBearing data is usually
         sent automatically from a mobile device
         equipped with a GPS receiver. Try to include bearing data if you are
         loading an input location that is moving, such as a pedestrian or a
         vehicle.Using this field tends to prevent adding locations to the
         wrong edges,
         which can occur when a vehicle is near an intersection or an overpass,
         for example. Bearing also helps the tool determine on which side of
         the street the point is.BearingTol        The bearing tolerance value
         creates a range of acceptable
         bearing values when locating moving points on an edge using thefield.
         If thefield value is within the range of acceptable values that are
         generated from the bearing tolerance on an edge, the point can be
         added as a network location there; otherwise, the closest point on the
         next-nearest edge is evaluated. BearingBearingThe units are in
         degrees, and the default value is 30. Values must be
         greater than 0 and less than 180. A value of 30 means that when
         Network Analyst attempts to add a network location on an edge, a range
         of acceptable bearing values is generated 15 degrees to either side of
         the edge (left and right) and in both digitized directions of the
         edge.NavLatency        This field is only used in the solve process if
         theandfields
         also have values; however, entering afield value is optional, even
         when values are present inand.indicates how much cost is expected to
         elapse from the moment GPS information is sent from a moving vehicle
         to a server and the moment the processed route is received by the
         vehicle's navigation device.
         BearingBearingTolNavLatencyBearingBearingTolNavLatencyThe units of
         NavLatency are the same as the units of the impedance
         attribute.
     Destinations (Feature Set):
         Specifies the ending point locations to travel to from the origins.You
         can add up to 1000 destinations.When specifying the destinations, you
         can set properties for each-such
         as its name-using the following attributes:Name        The name of the
         destination. The name can be a unique
         identifier for the destination. The name is included in the output
         lines (as thefield) and in the output destinations (as thefield) and
         can be used to join additional information from the tool outputs to
         the attributes of your destinations. DestinationNameNameIf the
         name is not specified, a unique name prefixed with Location is
         automatically generated.CurbApproachSpecifies the direction a vehicle
         may arrive at a destination. The
         field value is specified as one of the following integers (use the
         numeric code, not the name in parentheses):0 (Either side of
         vehicle)-The vehicle can arrive at the destination
         in either direction, so a U-turn is allowed at the origin. This
         setting can be chosen if it is possible and practical for a vehicle to
         turn around at the destination. This decision may depend on the width
         of the road and the amount of traffic or whether the destination has a
         parking lot where vehicles can enter and turn around.1 ( Right side of
         vehicle)-When the vehicle arrive at the destination,
         the destination must be on the right side of the vehicle. A U-turn is
         prohibited. This is typically used for vehicles such as buses that
         must depart from the bus stop on the right-hand side.2 (Left side of
         vehicle)-When the vehicle arrives at the destination,
         the curb must be on the left side of the vehicle. A U-turn is
         prohibited. This is typically used for vehicles such as buses that
         must depart from the bus stop on the left-hand side.3 (No U-Turn)-For
         this tool, this value functions the same as 0
         (Either side of vehicle). Theattribute is designed to work with
         both kinds of national
         driving standards: right-hand traffic (United States) and left-hand
         traffic (United Kingdom). First, consider an origin on the left side
         of a vehicle. It is always on the left side regardless of whether the
         vehicle travels on the left or right half of the road. What may change
         with national driving standards is your decision to depart the origin
         from one of two directions, that is, so it ends up on the right or
         left side of the vehicle. For example, if you want to depart from an
         origin and not have a lane of traffic between the vehicle and the
         origin, choose 1 (Right side of vehicle) in the United States and 2
         (Left side of vehicle) in the United Kingdom.
         CurbApproachBearing        The direction in which a point is moving.
         The units are
         degrees and are measured clockwise from true north. This field is used
         in conjunction with thefield. BearingTolBearing data is usually
         sent automatically from a mobile device
         equipped with a GPS receiver. Try to include bearing data if you are
         loading an input location that is moving, such as a pedestrian or a
         vehicle.Using this field tends to prevent adding locations to the
         wrong edges,
         which can occur when a vehicle is near an intersection or an overpass,
         for example. Bearing also helps the tool determine on which side of
         the street the point is.BearingTol        The bearing tolerance value
         creates a range of acceptable
         bearing values when locating moving points on an edge using thefield.
         If thefield value is within the range of acceptable values that are
         generated from the bearing tolerance on an edge, the point can be
         added as a network location there; otherwise, the closest point on the
         next-nearest edge is evaluated. BearingBearingThe units are in
         degrees, and the default value is 30. Values must be
         greater than 0 and less than 180. A value of 30 means that when
         Network Analyst attempts to add a network location on an edge, a range
         of acceptable bearing values is generated 15 degrees to either side of
         the edge (left and right) and in both digitized directions of the
         edge.NavLatency        This field is only used in the solve process if
         theandfields
         also have values; however, entering afield value is optional, even
         when values are present inand.indicates how much cost is expected to
         elapse from the moment GPS information is sent from a moving vehicle
         to a server and the moment the processed route is received by the
         vehicle's navigation device.
         BearingBearingTolNavLatencyBearingBearingTolNavLatencyThe units of
         NavLatency are the same as the units of the impedance
         attribute.
     Travel_Mode {String}:
         The mode of transportation to model in the analysis. Travel modes are
         managed in ArcGIS Online and can be configured by the administrator of
         your organization to reflect the organization's workflows. Specify the
         name of a travel mode that is supported by your organization.
         To get a list of supported travel mode names, run the Get
         Travel Modes tool from the Utilities toolbox under the same GIS server
         connection you used to access the tool. The Get Travel Modes tool adds
         the Supported Travel Modes table to the application. Any value in
         thefield from the Supported Travel Modes table can be specified as
         input. You can also specify the value from thefield as input. This
         speeds up tool operation, as the tool does not have to find the
         settings based on the travel mode name. Travel Mode NameTravel
         Mode Settings        The default value,, allows you to configure a
         custom travel
         mode using the custom travel mode parameters (,,,, and). The default
         values of the custom travel mode parameters model traveling by car.
         You can also chooseand set the custom travel mode parameters listed
         above to model a pedestrian with a fast walking speed or a truck with
         a given height, weight, and cargo of certain hazardous materials. You
         can try different settings to get the analysis results you want. Once
         you have identified the analysis settings, work with your
         organization's administrator and save these settings as part of a new
         or existing travel mode so that everyone in your organization can run
         the analysis with the same settings. CustomUTurn at
         JunctionsUse HierarchyRestrictionsAttribute Parameter
         ValuesImpedanceCustom        When you choose, the values you set for
         the custom travel mode
         parameters are included in the analysis. Specifying another travel
         mode, as defined by your organization, causes any values you set for
         the custom travel mode parameters to be ignored; the tool overrides
         them with values from the specified travel mode. Custom
     Time_Units {String}:
         Specifies the units that will be used to measure and report the total
         travel time between each origin-destination pair.Seconds-The time unit
         is seconds.Minutes-The time unit is
         minutes.Hours-The time unit is hours.Days-The time unit is days.
     Distance_Units {String}:
         Specifies the units that will be used to measure and report the total
         travel distance between each origin-destination pair.Meters-The linear
         unit is meters.Kilometers-The linear unit is
         kilometers.Feet-The linear unit is feet.Yards-The linear unit is
         yards.Miles-The linear unit is miles.NauticalMiles-The linear unit is
         nautical miles.
     Analysis_Region {String}:
         The region in which the analysis will be performed. If a value is not
         specified for this parameter, the tool will automatically calculate
         the region name based on the location of the input points. Setting the
         name of the region is required only if the automatic detection of the
         region name is not accurate for the inputs.To specify a region, use
         one of the following values:Europe-The analysis region will be
         Europe.Japan-The analysis region
         will be Japan.Korea-The analysis region will be
         Korea.MiddleEastAndAfrica-The analysis region will be Middle East and
         Africa.NorthAmerica-The analysis region will be North
         America.SouthAmerica-The analysis region will be South
         America.SouthAsia-The analysis region will be South Asia.Thailand-The
         analysis region will be Thailand. The following region names
         are no longer supported and will be
         removed in future releases. If you specify one of the deprecated
         region names, the tool automatically assigns a supported region name
         for the region. Greece redirects to EuropeIndia redirects to
         SouthAsiaOceania
         redirects to SouthAsiaSouthEastAsia redirects to SouthAsiaTaiwan
         redirects to SouthAsia
     Number_of_Destinations_to_Find {Long}:
         The maximum number of destinations to find per origin. If a
         value for this parameter is not specified, the output matrix includes
         travel costs from each origin to every destination. Individual origins
         can have their own values (specified as thefield) that override
         theparameter value. TargetDestinationCountNumber of
         Destinations to Find
     Cutoff {Double}:
         The travel time or travel distance value at which to stop
         searching for destinations from a given origin. Any destination beyond
         the cutoff value will not be considered. Individual origins can have
         their own values (specified as thefield) that override theparameter
         value. CutoffCutoff        The value must be in the units
         specified by theparameter if
         the impedance attribute of your travel mode is time based or in the
         units specified by theparameter if the impedance attribute of your
         travel mode is distance based. If a value is not specified, the tool
         will not enforce any travel time or travel distance limit when
         searching for destinations. Time UnitsDistance Units
     Time_of_Day {Date}:
         The time and date the routes will begin.If you are modeling the
         driving travel mode and specify the current
         date and time as the value for this parameter, the tool will use live
         traffic conditions to find the best routes, and the total travel time
         will be based on traffic conditions.Specifying a time of day results
         in more accurate routes and
         estimations of travel times because the travel times account for the
         traffic conditions that are applicable for that date and time.
         Theparameter specifies whether this time and date refer to UTC
         or the time zone in which the stop is located. Time Zone for
         Time of Day        The tool ignores this parameter whenisn't set to a
         time-based
         unit. Measurement Units
     Time_Zone_for_Time_of_Day {String}:
         Specifies the time zone of theparameter. Time of Day
         Geographically Local-Theparameter refers to the time zone in
         which the first stop of a route is located. If you are generating many
         routes that start in multiple time zones, the start times are
         staggered in coordinated universal time (UTC). For example, avalue of
         10:00 a.m., 2 January, means a start time of 10:00 a.m. eastern
         standard time (UTC-3:00) for routes beginning in the eastern time zone
         and 10:00 a.m. central standard time (UTC-4:00) for routes beginning
         in the central time zone. The start times are offset by one hour in
         UTC. The arrive and depart times and dates recorded in the output
         Stops feature class will refer to the local time zone of the first
         stop for each route. Time of DayTime of Day
         UTC-Theparameter refers to UTC. Choose this option if you
         want to generate a route for a specific time, such as now, but aren't
         certain in which time zone the first stop will be located. If you are
         generating many routes spanning multiple time zones, the start times
         in UTC are simultaneous. For example, avalue of 10:00 a.m., 2 January,
         means a start time of 5:00 a.m. eastern standard time (UTC-5:00) for
         routes beginning in the eastern time zone and 4:00 a.m. central
         standard time (UTC-6:00) for routes beginning in the central time
         zone. Both routes start at 10:00 a.m. UTC. The arrive and depart times
         and dates recorded in the output Stops feature class will refer to
         UTC. Time of DayTime of Day
     Point_Barriers {Feature Set}:
         Use this parameter to specify one or more points that will act as
         temporary restrictions or represent additional time or distance that
         may be required to travel on the underlying streets. For example, a
         point barrier can be used to represent a fallen tree along a street or
         a time delay spent at a railroad crossing.The tool imposes a limit of
         250 points that can be added as barriers.When specifying point
         barriers, you can set properties for each, such
         as its name or barrier type, using the following attributes:NameThe
         name of the barrier.BarrierTypeSpecifies whether the point barrier
         restricts travel completely or
         adds time or distance when it is crossed. The value for this attribute
         is specified as one of the following integers (use the numeric code,
         not the name in parentheses):0 (Restriction)-Prohibits travel through
         the barrier. The barrier is
         referred to as a restriction point barrier since it acts as a
         restriction. 2 (Added Cost)-Traveling through the barrier
         increases the
         travel time or distance by the amount specified in the,, orfield. This
         barrier type is referred to as an added cost point barrier.
         Additional_TimeAdditional_DistanceAdditionalCostAdditional_Time
         The added travel time when the barrier is traversed. This
         field is applicable only for added-cost barriers and when theparameter
         value is time based. Measurement Units        This field value
         must be greater than or equal to zero, and
         its units must be the same as those specified in theparameter.
         Measurement UnitsAdditional_Distance        The added distance when
         the barrier is traversed. This field
         is applicable only for added-cost barriers and when theparameter value
         is distance based. Measurement Units        The field value
         must be greater than or equal to zero, and its
         units must be the same as those specified in theparameter.
         Measurement UnitsAdditionalCost        The added cost when the barrier
         is traversed. This field is
         applicable only for added-cost barriers when theparameter value is
         neither time based nor distance based. Measurement
         UnitsFullEdgeSpecifies how the restriction point barriers are applied
         to the edge
         elements during the analysis. The field value is specified as one of
         the following integers (use the numeric code, not the name in
         parentheses):0 (False)-Permits travel on the edge up to the barrier
         but not through
         it. This is the default value.1 (True)-Restricts travel anywhere on
         the associated edge.CurbApproachSpecifies the direction of traffic
         that is affected by the barrier.
         The field value is specified as one of the following integers (use the
         numeric code, not the name in parentheses):0 (Either side of
         vehicle)-The barrier affects travel over the edge in
         both directions.1 (Right side of vehicle)-Vehicles are only affected
         if the barrier is
         on their right side during the approach. Vehicles that traverse the
         same edge but approach the barrier on their left side are not affected
         by the barrier.2 (Left side of vehicle)-Vehicles are only affected if
         the barrier is
         on their left side during the approach. Vehicles that traverse the
         same edge but approach the barrier on their right side are not
         affected by the barrier.Because junctions are points and don't have a
         side, barriers on
         junctions affect all vehicles regardless of the curb approach.
         Theattribute works with both types of national driving
         standards: right-hand traffic (United States) and left-hand traffic
         (United Kingdom). First, consider a facility on the left side of a
         vehicle. It is always on the left side regardless of whether the
         vehicle travels on the left or right half of the road. What may change
         with national driving standards is your decision to approach a
         facility from one of two directions, that is, so it ends up on the
         right or left side of the vehicle. For example, to arrive at a
         facility and not have a lane of traffic between the vehicle and the
         facility, choose 1 (Right side of vehicle) in the United States and 2
         (Left side of vehicle) in the United Kingdom.
         CurbApproachBearing        The direction in which a point is moving.
         The units are
         degrees and are measured clockwise from true north. This field is used
         in conjunction with thefield. BearingTolBearing data is usually
         sent automatically from a mobile device
         equipped with a GPS receiver. Try to include bearing data if you are
         loading an input location that is moving, such as a pedestrian or a
         vehicle.Using this field tends to prevent adding locations to the
         wrong edges,
         which can occur when a vehicle is near an intersection or an overpass,
         for example. Bearing also helps the tool determine on which side of
         the street the point is.BearingTol        The bearing tolerance value
         creates a range of acceptable
         bearing values when locating moving points on an edge using thefield.
         If thefield value is within the range of acceptable values that are
         generated from the bearing tolerance on an edge, the point can be
         added as a network location there; otherwise, the closest point on the
         next-nearest edge is evaluated. BearingBearingThe units are in
         degrees, and the default value is 30. Values must be
         greater than 0 and less than 180. A value of 30 means that when
         Network Analyst attempts to add a network location on an edge, a range
         of acceptable bearing values is generated 15 degrees to either side of
         the edge (left and right) and in both digitized directions of the
         edge.NavLatency        This field is only used in the solve process if
         theandfields
         also have values; however, entering afield value is optional, even
         when values are present inand.indicates how much cost is expected to
         elapse from the moment GPS information is sent from a moving vehicle
         to a server and the moment the processed route is received by the
         vehicle's navigation device.
         BearingBearingTolNavLatencyBearingBearingTolNavLatencyThe units of
         NavLatency are the same as the units of the impedance
         attribute.
     Line_Barriers {Feature Set}:
         Use this parameter to specify one or more lines that prohibit travel
         anywhere the lines intersect the streets. For example, a parade or
         protest that blocks traffic across several street segments can be
         modeled with a line barrier. A line barrier can also quickly fence off
         several roads from being traversed, thereby channeling possible routes
         away from undesirable parts of the street network. The tool
         imposes a limit on the number of streets you can
         restrict using theparameter. While there is no limit to the number of
         lines you can specify as line barriers, the combined number of streets
         intersected by all the lines cannot exceed 500. Line
         BarriersWhen specifying the line barriers, you can set name and
         barrier type
         properties for each using the following attributes:NameThe name of the
         barrier.
     Polygon_Barriers {Feature Set}:
         Use this parameter to specify polygons that either completely restrict
         travel or proportionately scale the time or distance required to
         travel on the streets intersected by the polygons. The service
         imposes a limit on the number of streets you can
         restrict using theparameter. While there is no limit to the number of
         polygons you can specify as polygon barriers, the combined number of
         streets intersected by all the polygons cannot exceed 2,000.
         Polygon BarriersWhen specifying the polygon barriers, you can set
         properties for each,
         such as its name or barrier type, using the following
         attributes:NameThe name of the barrier.BarrierTypeSpecifies whether
         the barrier restricts travel completely or scales
         the cost (such as time or distance) for traveling through it. The
         field value is specified as one of the following integers (use the
         numeric code, not the name in parentheses):0 (Restriction)-Prohibits
         traveling through any part of the barrier.
         The barrier is referred to as a restriction polygon barrier since it
         prohibits traveling on streets intersected by the barrier. One use of
         this type of barrier is to model floods covering areas of the street
         that make traveling on those streets impossible. 1 (Scaled
         Cost)-Scales the cost (such as travel time or
         distance) required to travel the underlying streets by a factor
         specified using theorfield. If the streets are partially covered by
         the barrier, the travel time or distance is apportioned and then
         scaled. For example, a factor of 0.25 means that travel on underlying
         streets is expected to be four times faster than normal. A factor of
         3.0 means it is expected to take three times longer than normal to
         travel on underlying streets. This barrier type is referred to as a
         scaled-cost polygon barrier. It can be used to model storms that
         reduce travel speeds in specific regions, for example.
         ScaledTimeFactorScaledDistanceFactorScaledTimeFactorThis is the factor
         by which the travel time of the streets intersected
         by the barrier is multiplied. The field value must be greater than
         zero. This field is applicable only for scaled-cost barriers
         and
         when theparameter is time-based. Measurement
         UnitsScaledDistanceFactorThis is the factor by which the distance of
         the streets intersected by
         the barrier is multiplied. The field value must be greater than zero.
         This field is applicable only for scaled-cost barriers and
         when theparameter is distance-based. Measurement
         UnitsScaledCostFactorThis is the factor by which the cost of the
         streets intersected by the
         barrier is multiplied. The field value must be greater than zero.
         This field is applicable only for scaled-cost barriers when
         theparameter is neither time-based nor distance-based.
         Measurement Units
     UTurn_at_Junctions {String}:
         Specifies the U-turn policy at junctions. Allowing U-turns implies the
         solver can turn around at a junction and double back on the same
         street. Given that junctions represent street intersections and dead
         ends, different vehicles may be able to turn around at some junctions
         but not at others-it depends on whether the junction represents an
         intersection or dead end. To accommodate this, the U-turn policy
         parameter is implicitly specified by the number of edges that connect
         to the junction, which is known as junction valency. The acceptable
         values for this parameter are listed below; each is followed by a
         description of its meaning in terms of junction
         valency.Allowed-U-turns are permitted at junctions with any number of
         connected edges. This is the default value. Not
         Allowed-U-turns are prohibited at all junctions,
         regardless of junction valency. However, U-turns are still permitted
         at network locations even when this option is chosen, but you can set
         the individual network locations'attribute to prohibit U-turns there
         as well. CurbApproachAllowed Only at Dead Ends-U-turns are
         prohibited at all junctions
         except those that have only one adjacent edge (a dead end).Allowed
         Only at Intersections and Dead Ends-U-turns are prohibited at
         junctions where exactly two adjacent edges meet but are permitted at
         intersections (junctions with three or more adjacent edges) and dead
         ends (junctions with exactly one adjacent edge). Often, networks have
         extraneous junctions in the middle of road segments. This option
         prevents vehicles from making U-turns at these locations. This
         parameter is ignored unlessis set to. Travel
         ModeCustom
     Use_Hierarchy {Boolean}:
         Specifies whether hierarchy will be used when finding the shortest
         paths between stops.Checked (True in Python)-Hierarchy will be used
         when finding routes.
         When hierarchy is used, the tool identifies higher-order streets (such
         as freeways) before lower-order streets (such as local roads) and can
         be used to simulate the driver preference of traveling on freeways
         instead of local roads even if that means a longer trip. This is
         especially useful when finding routes to faraway locations, because
         drivers on long-distance trips tend to prefer traveling on freeways,
         where stops, intersections, and turns can be avoided. Using hierarchy
         is computationally faster, especially for long-distance routes, as the
         tool identifies the best route from a relatively smaller subset of
         streets.Unchecked (False in Python)-Hierarchy will not be used when
         finding
         routes. If hierarchy is not used, the tool considers all the streets
         and doesn't necessarily identify higher-order streets when finding the
         route. This is often used when finding short routes in a city.The tool
         automatically reverts to using hierarchy if the straight-line
         distance between facilities and demand points is greater than 50 miles
         (80.46 kilometers), even if this parameter is unchecked (set to False
         in Python). This parameter is ignored unlessis set to. When
         modeling a
         custom walking mode, it is recommended that you turn off hierarchy
         since hierarchy is designed for motorized vehicles. Travel
         ModeCustom
     Restrictions {String}:
         The restrictions that will be honored by the tool when finding the
         best routes.A restriction represents a driving preference or
         requirement. In most
         cases, restrictions cause roads to be prohibited. For instance, using
         the Avoid Toll Roads restriction will result in a route that will
         include toll roads only when it is required to travel on toll roads to
         visit an incident or a facility. Height Restriction makes it possible
         to route around any clearances that are lower than the height of the
         vehicle. If you are carrying corrosive materials on the vehicle, using
         the Any Hazmat Prohibited restriction prevents hauling the materials
         along roads where it is marked illegal to do so. The values you
         provide for this parameter are ignored unlessis
         set to. Travel ModeCustom         Some restrictions require an
         additional value to be specified
         for their use. This value must be associated with the restriction name
         and a specific parameter intended to work with the restriction. You
         can identify such restrictions if their names appear in the
         AttributeName column of theparameter. Specify thefield for
         theparameter for the restriction to be correctly used when finding
         traversable roads. Attribute Parameter
         ValuesParameterValueAttribute Parameter Values         Some
         restrictions are supported only in certain countries;
         their availability is stated by region in the list below. Of the
         restrictions that have limited availability within a region, you can
         determine whether the restriction is available in a particular country
         by reviewing the table in the Country list section of Network analysis
         coverage. If a country has a value ofin the Logistics Attribute
         column, the restriction with select availability in the region is
         supported in that country. If you specify restriction names that are
         not available in the country where your incidents are located, the
         service ignores the invalid restrictions. The service also ignores
         restrictions when theattribute parameter value is between 0 and 1 (see
         theparameter). It prohibits all restrictions when theparameter value
         is greater than 0. YesRestriction UsageAttribute Parameter
         ValueRestriction UsageThe tool supports the following restrictions:
         Any Hazmat Prohibited-The results will not include roads
         where transporting any kind of hazardous material is prohibited.
         Availability: Select countries in North America and Europe
         Avoid Carpool Roads-The results will avoid roads that are
         designated exclusively for car pool (high-occupancy) vehicles.
         Availability: All countries         Avoid Express Lanes-The results
         will avoid roads designated
         as express lanes. Availability: All countries         Avoid
         Ferries-The results will avoid ferries.
         Availability: All countries         Avoid Gates-The results will avoid
         roads where there are
         gates, such as keyed access or guard-controlled entryways.
         Availability: All countries         Avoid Limited Access Roads-The
         results will avoid roads that
         are limited-access highways. Availability: All countries
         Avoid Private Roads-The results will avoid roads that are not
         publicly owned and maintained. Availability: All countries
         Avoid Roads Unsuitable for Pedestrians-The results will avoid
         roads that are unsuitable for pedestrians. Availability: All
         countries         Avoid Stairways-The results will avoid all stairways
         on a
         pedestrian-suitable route. Availability: All countries
         Avoid Toll Roads-The results will avoid all toll roads for
         automobiles. Availability: All countries         Avoid Toll
         Roads for Trucks-The results will avoid all toll
         roads for trucks. Availability: All countries         Avoid
         Truck Restricted Roads-The results will avoid roads
         where trucks are not allowed, except when making deliveries.
         Availability: All countries         Avoid Unpaved Roads-The results
         will avoid roads that are not
         paved (for example, dirt, gravel, and so on). Availability:
         All countries         Axle Count Restriction-The results will not
         include roads
         where trucks with the specified number of axles are prohibited. The
         number of axles can be specified using the Number of Axles restriction
         parameter. Availability: Select countries in North America and
         Europe         Driving a Bus-The results will not include roads where
         buses
         are prohibited. Using this restriction will also ensure that the
         results will honor one-way streets. Availability: All
         countries         Driving a Taxi-The results will not include roads
         where taxis
         are prohibited. Using this restriction will also ensure that the
         results will honor one-way streets. Availability: All
         countries         Driving a Truck-The results will not include roads
         where
         trucks are prohibited. Using this restriction will also ensure that
         the results will honor one-way streets. Availability: All
         countries         Driving an Automobile-The results will not include
         roads
         where automobiles are prohibited. Using this restriction will also
         ensure that the results will honor one-way streets.
         Availability: All countries         Driving an Emergency Vehicle-The
         results will not include
         roads where emergency vehicles are prohibited. Using this restriction
         will also ensure that the results will honor one-way streets.
         Availability: All countries         Height Restriction-The results
         will not include roads where
         the vehicle height exceeds the maximum allowed height for the road.
         The vehicle height can be specified using the Vehicle Height (meters)
         restriction parameter. Availability: Select countries in North
         America and Europe         Kingpin to Rear Axle Length Restriction-The
         results will not
         include roads where the vehicle length exceeds the maximum allowed
         kingpin to rear axle for all trucks on the road. The length between
         the vehicle kingpin and the rear axle can be specified using the
         Vehicle Kingpin to Rear Axle Length (meters) restriction parameter.
         Availability: Select countries in North America and Europe
         Length Restriction-The results will not include roads where
         the vehicle length exceeds the maximum allowed length for the road.
         The vehicle length can be specified using the Vehicle Length (meters)
         restriction parameter. Availability: Select countries in North
         America and Europe         Preferred for Pedestrians-The results will
         use preferred
         routes suitable for pedestrian navigation. Availability:
         Select countries in North America and Europe         Riding a
         Motorcycle-The results will not include roads where
         motorcycles are prohibited. Using this restriction will also ensure
         that the results will honor one-way streets. Availability: All
         countries         Roads Under Construction Prohibited-The results will
         not
         include roads that are under construction. Availability: All
         countries         Semi or Tractor with One or More Trailers
         Prohibited-The
         results will not include roads where semis or tractors with one or
         more trailers are prohibited. Availability: Select countries
         in North America and Europe         Single Axle Vehicles
         Prohibited-The results will not include
         roads where vehicles with single axles are prohibited.
         Availability: Select countries in North America and Europe
         Tandem Axle Vehicles Prohibited-The results will not include
         roads where vehicles with tandem axles are prohibited.
         Availability: Select countries in North America and Europe
         Through Traffic Prohibited-The results will not include roads
         where through traffic (nonlocal) is prohibited. Availability:
         All countries         Truck with Trailers Restriction-The results will
         not include
         roads where trucks with the specified number of trailers on the truck
         are prohibited. The number of trailers on the truck can be specified
         using the Number of Trailers on Truck restriction parameter.
         Availability: Select countries in North America and Europe         Use
         Preferred Hazmat Routes-The results will prefer roads
         that are designated for transporting any kind of hazardous materials.
         Availability: Select countries in North America and Europe         Use
         Preferred Truck Routes-The results will prefer roads that
         are designated as truck routes, such as the roads that are part of the
         national network as specified by the National Surface Transportation
         Assistance Act in the United States, or roads that are designated as
         truck routes by the state or province, or roads that are preferred by
         truckers when driving in an area. Availability: Select
         countries in North America and Europe         Walking-The results will
         not include roads where pedestrians
         are prohibited. Availability: All countries         Weight
         Restriction-The results will not include roads where
         the vehicle weight exceeds the maximum allowed weight for the road.
         The vehicle weight can be specified using the Vehicle Weight
         (kilograms) restriction parameter. Availability: Select
         countries in North America and Europe         Weight per Axle
         Restriction-The results will not include
         roads where the vehicle weight per axle exceeds the maximum allowed
         weight per axle for the road. The vehicle weight per axle can be
         specified using the Vehicle Weight per Axle (kilograms) restriction
         parameter. Availability: Select countries in North America and
         Europe         Width Restriction-The results will not include roads
         where
         the vehicle width exceeds the maximum allowed width for the road. The
         vehicle width can be specified using the Vehicle Width (meters)
         restriction parameter. Availability: Select countries in North
         America and Europe
     Attribute_Parameter_Values {Record Set}:
         Use this parameter to specify additional values required by an
         attribute or restriction, such as to specify whether the restriction
         prohibits, avoids, or prefers travel on restricted roads. If the
         restriction is meant to avoid or prefer roads, you can further specify
         the degree to which they are avoided or preferred using this
         parameter. For example, you can choose to never use toll roads, avoid
         them as much as possible, or prefer them. The values you
         provide for this parameter are ignored unlessis
         set to. Travel ModeCustom        If you specify theparameter
         from a feature class, the field
         names on the feature class must match the fields as follows:
         Attribute Parameter ValuesAttributeName-The name of the restriction.
         ParameterName-The
         name of the parameter associated with the
         restriction. A restriction can have one or morefield values based on
         its intended use. ParameterName          ParameterValue-The
         value forused by the tool when evaluating
         the restriction. ParameterName        Theparameter is
         dependent on theparameter. Thefield is
         applicable only if the restriction name is specified as the value for
         theparameter. Attribute Parameter
         ValuesRestrictionsParameterValueRestrictions        In, each
         restriction (listed as) has afield value, Restriction
         Usage, that specifies whether the restriction prohibits, avoids, or
         prefers travel on the roads associated with the restriction as well as
         the degree to which the roads are avoided or preferred. The
         Restriction Usagecan be assigned any of the following string values or
         their equivalent numeric values listed in the parentheses:
         Attribute Parameter
         ValuesAttributeNameParameterNameParameterNamePROHIBITED (-1)-Travel on
         the roads using the restriction is
         completely prohibited.AVOID_HIGH (5)-It is highly unlikely the tool
         will include in the
         route the roads that are associated with the restriction.AVOID_MEDIUM
         (2)-It is unlikely the tool will include in the route the
         roads that are associated with the restriction.AVOID_LOW (1.3)-It is
         somewhat unlikely the tool will include in the
         route the roads that are associated with the restriction.PREFER_LOW
         (0.8)-It is somewhat likely the tool will include in the
         route the roads that are associated with the restriction.PREFER_MEDIUM
         (0.5)-It is likely the tool will include in the route
         the roads that are associated with the restriction.PREFER_HIGH
         (0.2)-It is highly likely the tool will include in the
         route the roads that are associated with the restriction.In most
         cases, you can use the default value, PROHIBITED, as the
         Restriction Usage value if the restriction is dependent on a vehicle
         characteristic such as vehicle height. However, in some cases, the
         Restriction Usage value depends on your routing preferences. For
         example, the Avoid Toll Roads restriction has the default value of
         AVOID_MEDIUM for the Restriction Usage attribute. This means that when
         the restriction is used, the tool will route around toll roads when it
         can. AVOID_MEDIUM also indicates how important it is to avoid toll
         roads when finding the best route; it has a medium priority. Choosing
         AVOID_LOW puts lower importance on avoiding tolls; choosing AVOID_HIGH
         instead gives it a higher importance and makes it more acceptable for
         the service to generate longer routes to avoid tolls. Choosing
         PROHIBITED entirely disallows travel on toll roads, making it
         impossible for a route to travel on any portion of a toll road. Keep
         in mind that avoiding or prohibiting toll roads, and avoiding toll
         payments, is the objective for some. In contrast, others prefer to
         drive on toll roads, because avoiding traffic is more valuable to them
         than the money spent on tolls. In the latter case, choose PREFER_LOW,
         PREFER_MEDIUM, or PREFER_HIGH as the value for Restriction Usage. The
         higher the preference, the farther the tool will go to travel on the
         roads associated with the restriction.
     Impedance {String}:
         Specifies the impedance, which is a value that represents the effort
         or cost of traveling along road segments or on other parts of the
         transportation network.Travel time is an impedance: a car may take 1
         minute to travel a mile
         along an empty road. Travel times can vary by travel mode-a pedestrian
         may take more than 20 minutes to walk the same mile, so it is
         important to choose the right impedance for the travel mode you are
         modeling.Travel distance can also be an impedance; the length of a
         road in
         kilometers can be thought of as impedance. Travel distance in this
         sense is the same for all modes-a kilometer for a pedestrian is also a
         kilometer for a car. (What may change is the pathways on which the
         different modes are allowed to travel, which affects distance between
         points, and this is modeled by travel mode settings.)        The value
         you provide for this parameter is ignored unlessis
         set to, which is the default value. Travel ModeCustom
         TravelTime-Historical and live traffic data is used. This
         option is good for modeling the time it takes automobiles to travel
         along roads at a specific time of day using live traffic speed data
         where available. When using, you can optionally set the
         TravelTime::Vehicle Maximum Speed (km/h) attribute parameter to
         specify the physical limitation of the speed the vehicle is capable of
         traveling. TravelTimeMinutes-Live traffic data is not used,
         but historical average speeds
         for automobiles data is used. TruckTravelTime-Historical and
         live traffic data is used, but
         the speed is capped at the posted truck speed limit. This is good for
         modeling the time it takes for the trucks to travel along roads at a
         specific time. When using, you can optionally set the
         TruckTravelTime::Vehicle Maximum Speed (km/h) attribute parameter to
         specify the physical limitation of the speed the truck is capable of
         traveling. TruckTravelTimeTruckMinutes-Live traffic data is
         not used, but the smaller of the
         historical average speeds for automobiles and the posted speed limits
         for trucks is used.WalkTime-The default is a speed of 5 km/hr on all
         roads and paths, but
         this can be configured through the WalkTime::Walking Speed (km/h)
         attribute parameter.Miles-Length measurements along roads are stored
         in miles and can be
         used for performing analysis based on shortest
         distance.Kilometers-Length measurements along roads are stored in
         kilometers
         and can be used for performing analysis based on shortest
         distance.TimeAt1KPH-The default is a speed of 1 km/hr on all roads and
         paths.
         The speed cannot be changed using any attribute parameter.Drive
         Time-Travel times for a car are modeled. These travel times are
         dynamic and fluctuate according to traffic flows in areas where
         traffic data is available. This is the default value.Truck Time-Travel
         times for a truck are modeled. These travel times
         are static for each road and don't fluctuate with traffic.Walk
         Time-Travel times for a pedestrian are modeled. Travel
         Distance-Length measurements along roads and paths are
         stored. To model walk distance, choose this option and ensure thatis
         set for theparameter. Similarly, to model drive or truck distance,
         choosehere and set the appropriate restrictions so the vehicle travels
         only on roads where it is permitted to do so.
         WalkingRestrictionTravel Distance        If you choose a time-based
         impedance, such as,,,, or,
         theparameter must be set to a time-based value. If you choose a
         distance-based impedance, such asor,must be distance based.
         TravelTimeTruckTravelTimeMinutesTruckMinutesWalkTimeMeasurement
         UnitsMilesKilometersMeasurement Units        ,,, andimpedance values
         are no longer supported and will be
         removed in a future release. If you use one of these values, the tool
         uses the value of theparameter for time-based values and theparameter
         for distance-based values. Drive TimeTruck TimeWalk TimeTravel
         DistanceTime ImpedanceDistance Impedance
     Origin_Destination_Line_Shape {String}:
         The resulting lines of an OD cost matrix can be represented with
         either straight-line geometry or no geometry at all. In both cases,
         the route is always computed along the street network by minimizing
         the travel time or the travel distance, never using the straight-line
         distance between origins and destinations.Straight Line-Straight lines
         connect origins and destinations.None-Do
         not return any shapes for the lines that connect origins and
         destinations. This is useful when you have a large number of origins
         and destinations and are interested only in the OD cost matrix table
         (and not the output line shapes).
     Save_Output_Network_Analysis_Layer {Boolean}:
         Specifies whether the analysis settings will be saved as a network
         analysis layer file. You cannot directly work with this file even when
         you open the file in an ArcGIS Desktop application such as ArcMap. It
         is meant to be sent to Esri Technical Support to diagnose the quality
         of results returned from the tool. Checked (True in
         Python)-The output will be saved as a
         network analysis layer file. The file will be downloaded to a
         temporary directory on your machine. In ArcGIS Pro, the location of
         the downloaded file can be determined by viewing the value for
         theparameter in the entry corresponding to the tool service in the
         geoprocessing history of the project. In ArcMap, the location of the
         file can be determined by accessing theoption in the shortcut menu of
         theparameter in the entry corresponding to the tool service in
         thewindow. Output Network Analysis LayerCopy LocationOutput
         Network Analysis LayerGeoprocessing ResultsUnchecked (False in
         Python)-The output will not be saved as a network
         analysis layer file. This is the default.
     Overrides {String}:
         This parameter is for internal use only.
     Time_Impedance {String}:
         If the impedance for the travel mode, as specified using
         theparameter, is time based, the values for theandparameters must be
         identical. Otherwise, the service will return an error. The
         time-based impedance value represents the travel time along road
         segments or on other parts of the transportation network.ImpedanceTime
         ImpedanceImpedanceMinutes-Time impedance will be
         minutes.TravelTime-Time impedance will
         be travel time.TimeAt1KPH-Time impedance will be time at one kilometer
         per hour.WalkTime-Time impedance will be walk time.TruckMinutes-Time
         impedance will be truck minutes.TruckTravelTime-Time impedance will be
         truck travel time.
     Distance_Impedance {String}:
         If the impedance for the travel mode, as specified using
         theparameter, is distance based, the values for theandparameters must
         be identical. Otherwise, the service will return an error. The
         distance-based impedance value represents the travel distance
         along road segments or on other parts of the transportation
         network.ImpedanceDistance ImpedanceImpedanceMiles-Distance impedance
         will be miles.Kilometers-Distance impedance
         will be kilometers.
     Output_Format {String}:
         Specifies the format in which the output features will be
         returned.Feature Set-The output features will be returned as feature
         classes
         and tables. This is the default.JSON File-The output features will be
         returned as a compressed file
         containing the JSON representation of the outputs. When this option is
         specified, the output is a single file (with a .zip extension) that
         contains one or more JSON files (with a .json extension) for each of
         the outputs created by the service.GeoJSON File-The output features
         will be returned as a compressed file
         containing the GeoJSON representation of the outputs. When this option
         is specified, the output is a single file (with a .zip extension) that
         contains one or more GeoJSON files (with a .geojson extension) for
         each of the outputs created by the service.CSV File-The output
         features will be returned as a compressed file
         containing a comma-separated values (CSV) representation of the
         outputs. When this option is specified, the output is a single file
         (with a .zip extension) that contains one or more CSV files (with a
         .csv extension) for each of the outputs created by the service.
         When a file-based output format, such asor, is specified, no
         outputs will be added to the display because the application, such as
         ArcMap or ArcGIS Pro, cannot draw the contents of the result file.
         Instead, the result file is downloaded to a temporary directory on
         your machine. In ArcGIS Pro, the location of the downloaded file can
         be determined by viewing the value for theparameter in the entry
         corresponding to the tool operation in the geoprocessing history of
         the project. In ArcMap, the location of the file can be determined by
         accessing theoption in the shortcut menu of theparameter in the entry
         corresponding to the tool operation in thewindow. JSON
         FileGeoJSON FileOutput Result FileCopy LocationOutput Result
         FileGeoprocessing Results
     Ignore_Invalid_Locations {Boolean}:
         Specifies whether invalid input locations will be ignored.SKIP-Network
         locations that are unlocated will be ignored and the
         analysis will run using valid network locations only. The analysis
         will also continue if locations are on nontraversable elements or have
         other errors. This is useful if you know the network locations are not
         all correct, but you want to run the analysis with the network
         locations that are valid. This is the default.HALT-Invalid locations
         will not be ignored. Do not run the analysis if
         there are invalid locations. Correct the invalid locations and rerun
         the analysis.
     Locate_Settings {String}:
         Use this parameter to specify settings that affect how inputs are
         located, such as the maximum search distance to use when locating the
         inputs on the network or the network sources being used for locating.
         The locator JSON object has following properties:Currently,
         you can't specify different source names for the sources array. Also,
         allowAutoRelocate is always set to true since the service does not
         support location fields. tolerance and
         toleranceUnits-Allows you to control the
         maximum search distance when locating inputs. If no valid network
         location is found within this distance, the input features will be
         considered unlocated. A small search tolerance decreases the
         likelihood of locating on the wrong street but increases the
         likelihood of not finding any valid network location. The
         toleranceUnits parameter value can be specified as one of the
         following values:
         esriCentimetersesriDecimalDegreesesriDecimetersesriFeetesriInchesesriI
         ntFeetesriIntInchesesriIntMilesesriIntNauticalMilesesriIntYardsesriKil
         ometersesriMetersesriMilesesriMillimetersesriNauticalMilesesriYards
         sources-Allows you to control which network source can be
         used for locating. For example, you can configure the analysis to
         locate inputs on streets but not on sidewalks. The list of possible
         sources on which to locate is specific to the network dataset this
         service references. Only the sources that are present in the sources
         array are used for locating. Sources is specified as an array of
         objects each having the following property:          name-The name of
         the network source feature class that can be used for
         locating inputsallowAutoRelocate-Allows you to control whether inputs
         with existing
         network location fields can be automatically relocated when solving to
         ensure valid, routable location fields for the analysis. If the value
         is true, points located on restricted network elements and points
         affected by barriers will be relocated to the closest routable
         location. If the value is false, network location fields will be used
         as is even if the points are unreachable, and this may cause the solve
         to fail. Even if the value is false, inputs with no location fields or
         incomplete location fields will be located during the solve
         operation.The parameter value is specified as a JSON object. The JSON
         object
         allows you to specify a locator JSON for all input feature in the
         analysis, or you can specify an override for a particular input. The
         override allows you to have different settings for each analysis
         input. For example, you can disallow stops to locate on highway ramps
         and allow point barriers to locate on highway ramps. When specifying
         the Locate_Settings JSON, you must provide the tolerance,
         toleranceUnits, and allowAutoRelocate properties. If you need to
         provide a different locator JSON for a particular input class, you
         must include the overrides property for that input. The property name
         must match the input parameter name. The locator JSON for a particular
         input doesn't need to include all the properties; you only need to
         include the properties that are different from the default locator
         JSON properties."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateOriginDestinationCostMatrix_agolservices(
                *gp_fixargs(
                    (
                        Origins,
                        Destinations,
                        Travel_Mode,
                        Time_Units,
                        Distance_Units,
                        Analysis_Region,
                        Number_of_Destinations_to_Find,
                        Cutoff,
                        Time_of_Day,
                        Time_Zone_for_Time_of_Day,
                        Point_Barriers,
                        Line_Barriers,
                        Polygon_Barriers,
                        UTurn_at_Junctions,
                        Use_Hierarchy,
                        Restrictions,
                        Attribute_Parameter_Values,
                        Impedance,
                        Origin_Destination_Line_Shape,
                        Save_Output_Network_Analysis_Layer,
                        Overrides,
                        Time_Impedance,
                        Distance_Impedance,
                        Output_Format,
                        Ignore_Invalid_Locations,
                        Locate_Settings,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateServiceAreas_agolservices", None)
def GenerateServiceAreas(
    Facilities=None,
    Break_Values=None,
    Break_Units: Literal[
        "Meters", "Kilometers", "Feet", "Yards", "Miles", "NauticalMiles", "Seconds", "Minutes", "Hours", "Days"
    ]
    | None = None,
    Analysis_Region: Literal[
        "Europe", "Japan", "Korea", "MiddleEastAndAfrica", "NorthAmerica", "SouthAmerica", "SouthAsia", "Thailand"
    ]
    | None = None,
    Travel_Direction: Literal["Away From Facility", "Towards Facility"] | None = None,
    Time_of_Day=None,
    Use_Hierarchy=None,
    UTurn_at_Junctions: Literal[
        "Allowed", "Not Allowed", "Allowed Only at Dead Ends", "Allowed Only at Intersections and Dead Ends"
    ]
    | None = None,
    Polygons_for_Multiple_Facilities: Literal["Overlapping", "Not Overlapping", "Merge by Break Value"] | None = None,
    Polygon_Overlap_Type: Literal["Rings", "Disks"] | None = None,
    Detailed_Polygons=None,
    Polygon_Trim_Distance=None,
    Polygon_Simplification_Tolerance=None,
    Point_Barriers=None,
    Line_Barriers=None,
    Polygon_Barriers=None,
    Restrictions: list[
        Literal[
            "Any Hazmat Prohibited",
            "Avoid Carpool Roads",
            "Avoid Express Lanes",
            "Avoid Ferries",
            "Avoid Gates",
            "Avoid Limited Access Roads",
            "Avoid Private Roads",
            "Avoid Roads Unsuitable for Pedestrians",
            "Avoid Stairways",
            "Avoid Toll Roads",
            "Avoid Toll Roads for Trucks",
            "Avoid Truck Restricted Roads",
            "Avoid Unpaved Roads",
            "Axle Count Restriction",
            "Driving a Bus",
            "Driving a Taxi",
            "Driving a Truck",
            "Driving an Automobile",
            "Driving an Emergency Vehicle",
            "Height Restriction",
            "High Speed Roads Restriction",
            "Kingpin to Rear Axle Length Restriction",
            "Length Restriction",
            "Preferred for Pedestrians",
            "Riding a Motorcycle",
            "Roads Under Construction Prohibited",
            "Semi or Tractor with One or More Trailers Prohibited",
            "Single Axle Vehicles Prohibited",
            "Tandem Axle Vehicles Prohibited",
            "Through Traffic Prohibited",
            "Truck with Trailers Restriction",
            "Use Preferred Hazmat Routes",
            "Use Preferred Truck Routes",
            "Walking",
            "Weight Restriction",
            "Weight per Axle Restriction",
            "Width Restriction",
        ]
    ]
    | Literal[
        "Any Hazmat Prohibited",
        "Avoid Carpool Roads",
        "Avoid Express Lanes",
        "Avoid Ferries",
        "Avoid Gates",
        "Avoid Limited Access Roads",
        "Avoid Private Roads",
        "Avoid Roads Unsuitable for Pedestrians",
        "Avoid Stairways",
        "Avoid Toll Roads",
        "Avoid Toll Roads for Trucks",
        "Avoid Truck Restricted Roads",
        "Avoid Unpaved Roads",
        "Axle Count Restriction",
        "Driving a Bus",
        "Driving a Taxi",
        "Driving a Truck",
        "Driving an Automobile",
        "Driving an Emergency Vehicle",
        "Height Restriction",
        "High Speed Roads Restriction",
        "Kingpin to Rear Axle Length Restriction",
        "Length Restriction",
        "Preferred for Pedestrians",
        "Riding a Motorcycle",
        "Roads Under Construction Prohibited",
        "Semi or Tractor with One or More Trailers Prohibited",
        "Single Axle Vehicles Prohibited",
        "Tandem Axle Vehicles Prohibited",
        "Through Traffic Prohibited",
        "Truck with Trailers Restriction",
        "Use Preferred Hazmat Routes",
        "Use Preferred Truck Routes",
        "Walking",
        "Weight Restriction",
        "Weight per Axle Restriction",
        "Width Restriction",
    ]
    | str
    | None = None,
    Attribute_Parameter_Values=None,
    Time_Zone_for_Time_of_Day: Literal["Geographically Local", "UTC"] | None = None,
    Travel_Mode=None,
    Impedance: Literal[
        "Drive Time",
        "Truck Time",
        "Walk Time",
        "Travel Distance",
        "Minutes",
        "TimeAt1KPH",
        "TravelTime",
        "TruckMinutes",
        "TruckTravelTime",
        "WalkTime",
        "Kilometers",
        "Miles",
    ]
    | None = None,
    Save_Output_Network_Analysis_Layer=None,
    Overrides=None,
    Time_Impedance: Literal["Minutes", "TimeAt1KPH", "TravelTime", "TruckMinutes", "TruckTravelTime", "WalkTime"]
    | None = None,
    Distance_Impedance: Literal["Kilometers", "Miles"] | None = None,
    Polygon_Detail: Literal["Generalized", "Standard", "High"] | None = None,
    Output_Type: Literal["Polygons", "Lines", "Polygons and lines"] | None = None,
    Output_Format: Literal["Feature Set", "JSON File", "GeoJSON File"] | None = None,
    Ignore_Invalid_Locations=None,
    Locate_Settings=None,
) -> Result:
    """GenerateServiceAreas_agolservices(Facilities, Break_Values, Break_Units, {Analysis_Region}, {Travel_Direction}, {Time_of_Day}, {Use_Hierarchy}, {UTurn_at_Junctions}, {Polygons_for_Multiple_Facilities}, {Polygon_Overlap_Type}, {Detailed_Polygons}, {Polygon_Trim_Distance}, {Polygon_Simplification_Tolerance}, {Point_Barriers}, {Line_Barriers}, {Polygon_Barriers}, {Restrictions;Restrictions...}, {Attribute_Parameter_Values}, {Time_Zone_for_Time_of_Day}, {Travel_Mode}, {Impedance}, {Save_Output_Network_Analysis_Layer}, {Overrides}, {Time_Impedance}, {Distance_Impedance}, {Polygon_Detail}, {Output_Type}, {Output_Format}, {Ignore_Invalid_Locations}, {Locate_Settings})

       Determines network service areas around facilities. A network service
       area is a region that encompasses all streets that can be accessed
       within a given distance or travel time from one or more facilities.
       For instance, the 10-minute service area for a facility includes all
       the streets that can be reached within 10 minutes from that facility.

    INPUTS:
     Facilities (Feature Set):
         The input locations around which service areas are generated.You can
         load up to 1,000 facilities.The facilities feature set has an
         associated attribute table. The
         fields in the attribute table are described below.ObjectIDThe system-
         managed ID field.NameThe name of the facility. If the name is not
         specified, a name is
         automatically generated at solve time. All fields from the
         input facilities are included in the
         output polygons when the Polygons for Multiple Facilities parameter is
         set to Overlapping or Not Overlapping. Thefield on the input
         facilities is transferred to the FacilityOID field on the output
         polygons. ObjectIDBreaksSpecify the extent of the service area
         to be calculated on a per
         facility basis.This attribute allows you to specify a different
         service area break
         value for each facility. For example, with two facilities, you can
         generate 5- and 10-minute service area polygons for one facility and
         6-, 9-, and 12-minute polygons for the other facility.Separate
         multiple break values with a space, and specify the numeric
         values using the dot character as your decimal separator, even if the
         locale of your computer defines a different decimal separator. For
         example, the value 5.5 10 15.5 specifies three break values around a
         facility.AdditionalTimeThe amount of time spent at the facility, which
         reduces the extent of
         the service area calculated for the given facility. The default value
         is 0. For example, when calculating service areas that
         represent
         fire station response times,can store the turnout time, which is the
         time it takes a crew to put on the appropriate protective equipment
         and exit the fire station, for each fire station. Assume Fire Station
         1 has a turnout time of 1 minute and Fire Station 2 has a turnout time
         of 3 minutes. If a 5-minute service area is calculated for both fire
         stations, the actual service area for Fire Station 1 is 4 minutes
         (since 1 of the 5 minutes is required as turnout time). Similarly,
         Fire Station 2 has a service area of only 2 minutes from the fire
         station. AdditionalTimeAdditionalDistanceThe extra distance
         traveled to reach the facility before the service
         is calculated. This attribute reduces the extent of the service area
         calculated for the given facility. The default value is 0.Generally,
         the location of a facility, such as a store location, isn't
         exactly on the street; it is set back somewhat from the road. This
         attribute value can be used to model the distance between the actual
         facility location and its location on the street if it is important to
         include that distance when calculating the service areas for the
         facility.AdditionalCostThe extra cost spent at the facility, which
         reduces the extent of the
         service area calculated for the given facility. The default value is
         0.Use this attribute value when the travel mode for the analysis uses
         an
         impedance attribute that is neither time based nor distance based The
         units for the attribute values are interpreted to be in unknown
         units.CurbApproachSpecifies the direction a vehicle may arrive at and
         depart from the
         facility. The field value is specified as one of the following
         integers (use the numeric code, not the name in parentheses):0 (Either
         side of vehicle)-The vehicle can approach and depart the
         facility in either direction, so a U-turn is allowed at the facility.
         This setting can be chosen if it is possible and practical for a
         vehicle to turn around at the facility. This decision may depend on
         the width of the road and the amount of traffic or whether the
         facility has a parking lot where vehicles can enter and turn around.1
         (Right side of vehicle)-When the vehicle approaches and departs the
         facility, the curb must be on the right side of the vehicle. A U-turn
         is prohibited. This is typically used for vehicles such as buses that
         must arrive with the bus stop on the right-hand side.2 (Left side of
         vehicle)-When the vehicle approaches and departs the
         facility, the curb must be on the left side of the vehicle. A U-turn
         is prohibited. This is typically used for vehicles such as buses that
         must arrive with the bus stop on the left-hand side.3 (No U-Turn)-When
         the vehicle approaches the facility, the curb can
         be on either side of the vehicle, however, the vehicle must depart
         without turning around. Theattribute is designed to work with
         both types of national
         driving standards: right-hand traffic (United States) and left-hand
         traffic (United Kingdom). First, consider a facility on the left side
         of a vehicle. It is always on the left side regardless of whether the
         vehicle travels on the left or right half of the road. What may change
         with national driving standards is your decision to approach a
         facility from one of two directions; that is, so it ends up on the
         right or left side of the vehicle. For example, if you want to arrive
         at a facility and not have a lane of traffic between the vehicle and
         the facility, choose 1 (Right side of vehicle) in the United States
         and 2 (Left side of vehicle) in the United Kingdom.
         CurbApproachBearing        The direction in which a point is moving.
         The units are
         degrees and are measured clockwise from true north. This field is used
         in conjunction with thefield. BearingTolBearing data is usually
         sent automatically from a mobile device
         equipped with a GPS receiver. Try to include bearing data if you are
         loading an input location that is moving, such as a pedestrian or a
         vehicle.Using this field tends to prevent adding locations to the
         wrong edges,
         which can occur when a vehicle is near an intersection or an overpass,
         for example. Bearing also helps the tool determine on which side of
         the street the point is.BearingTol        The bearing tolerance value
         creates a range of acceptable
         bearing values when locating moving points on an edge using thefield.
         If thefield value is within the range of acceptable values that are
         generated from the bearing tolerance on an edge, the point can be
         added as a network location there; otherwise, the closest point on the
         next-nearest edge is evaluated. BearingBearingThe units are in
         degrees, and the default value is 30. Values must be
         greater than 0 and less than 180. A value of 30 means that when
         Network Analyst attempts to add a network location on an edge, a range
         of acceptable bearing values is generated 15 degrees to either side of
         the edge (left and right) and in both digitized directions of the
         edge.NavLatency        This field is only used in the solve process if
         theandfields
         also have values; however, entering afield value is optional, even
         when values are present inand.indicates how much cost is expected to
         elapse from the moment GPS information is sent from a moving vehicle
         to a server and the moment the processed route is received by the
         vehicle's navigation device.
         BearingBearingTolNavLatencyBearingBearingTolNavLatencyThe units of
         NavLatency are the same as the units of the impedance
         attribute.
     Break_Values (String):
         Specifies the size and number of service area polygons that
         will be generated for each facility. The units are determined by
         thevalue. Break Units        Multiple polygon breaks can be set
         to create concentric
         service areas per facility. For instance, to find 2-, 3-, and 5-mile
         service areas for each facility, type 2 3 5, separating the values
         with a space, and setto. There is no limit to the number of break
         values you can specify. Break UnitsMilesThe size of the maximum
         break value can't exceed the equivalent of 300
         minutes or 300 miles (482.80 kilometers). When generating detailed
         polygons, the maximum service-area size is limited to 15 minutes and
         15 miles (24.14 kilometers).
     Break_Units (String):
         Specifies the units for theparameter. Break ValuesThe
         units you choose for this parameter determine whether the service
         will create service areas by measuring driving distance or driving
         time. Choose a time unit to measure driving time. To measure driving
         distance, choose a distance unit. The specified value also determines
         the units that will be used to report total driving time or distance
         in the results.The choices are as follows:Meters-The linear unit will
         be meters.Kilometers-The linear unit will
         be kilometers.Feet-The linear unit will be feet.Yards-The linear unit
         will be yards.Miles-The linear unit will be miles.NauticalMiles-The
         linear unit will be nautical miles.Seconds-The time unit will be
         seconds.Minutes-The time unit will be minutes.Hours-The time unit will
         be hours.Days-The time unit will be days.
     Analysis_Region {String}:
         The region in which the analysis will be performed. If a value is not
         specified for this parameter, the tool will automatically calculate
         the region name based on the location of the input points. Setting the
         name of the region is required only if the automatic detection of the
         region name is not accurate for the inputs.To specify a region, use
         one of the following values:Europe-The analysis region will be
         Europe.Japan-The analysis region
         will be Japan.Korea-The analysis region will be
         Korea.MiddleEastAndAfrica-The analysis region will be Middle East and
         Africa.NorthAmerica-The analysis region will be North
         America.SouthAmerica-The analysis region will be South
         America.SouthAsia-The analysis region will be South Asia.Thailand-The
         analysis region will be Thailand. The following region names
         are no longer supported and will be
         removed in future releases. If you specify one of the deprecated
         region names, the tool automatically assigns a supported region name
         for the region. Greece redirects to EuropeIndia redirects to
         SouthAsiaOceania
         redirects to SouthAsiaSouthEastAsia redirects to SouthAsiaTaiwan
         redirects to SouthAsia
     Travel_Direction {String}:
         Specifies whether the direction of travel used to generate the service
         area polygons is toward or away from the facilities.Away From
         Facility-The service area will be generated in the direction
         away from the facilities.Towards Facility-The service area will be
         generated in the direction
         toward the facilities.The direction of travel may change the shape of
         the polygons because
         impedances on opposite sides of streets may differ or one-way
         restrictions may exist, such as one-way streets. The direction you
         should choose depends on the nature of your service area analysis. The
         service area for a pizza delivery store, for example, should be
         created away from the facility, whereas the service area of a hospital
         should be created toward the facility.
     Time_of_Day {Date}:
         The time to depart from or arrive at the facilities. The
         interpretation of this value depends on whether travel is toward or
         away from the facilities. It represents the departure time
         ifis set to.
         Travel DirectionAway from facilities          It represents the
         arrival time ifis set to. Travel
         DirectionToward facilities        You can use theparameter to specify
         whether this time and date
         refers to UTC or the time zone in which the facility is located.
         Time Zone for Time of Day        Repeatedly solving the same analysis,
         but using
         differentvalues, allows you to see how a facility's reach changes over
         time. For instance, the five-minute service area around a fire station
         may start out large in the early morning, diminish during the morning
         rush hour, grow in the late morning, and so on, throughout the day.
         Time of Day
     Use_Hierarchy {Boolean}:
         Specifies whether hierarchy will be used when finding the best route
         between the facility and the incident.Checked (True)-Hierarchy will be
         used for the analysis. Using a
         hierarchy results in the solver preferring higher-order edges to
         lower-order edges. Hierarchical solves are faster, and they can be
         used to simulate the preference of a driver who chooses to travel on
         freeways over local roads when possible-even if that means a longer
         trip.Unchecked (False)-Hierarchy will not be used for the analysis.
         Not
         using a hierarchy yields an accurate service area measured along all
         edges of the network dataset regardless of hierarchy level.
         Regardless of whether theparameter is checked (True),
         hierarchy is always used when the largest break value exceeds 240
         minutes or 240 miles (386.24 kilometers). Use Hierarchy
     UTurn_at_Junctions {String}:
         Specifies whether to restrict or permit the service area to make
         U-turns at junctions. To understand the parameter values, consider the
         following terminology: a junction is a point where a street segment
         ends and potentially connects to one or more other segments; a
         pseudojunction is a point where exactly two streets connect to one
         another; an intersection is a point where three or more streets
         connect; and a dead end is where one street segment ends without
         connecting to another.Allowed-U-turns are permitted at junctions with
         any number of
         connected edges. This is the default value. Not
         Allowed-U-turns are prohibited at all junctions,
         regardless of junction valency. However, U-turns are still permitted
         at network locations even when this option is chosen, but you can set
         the individual network locations'attribute to prohibit U-turns there
         as well. CurbApproachAllowed Only at Dead Ends-U-turns are
         prohibited at all junctions
         except those that have only one adjacent edge (a dead end).Allowed
         Only at Intersections and Dead Ends-U-turns are prohibited at
         junctions where exactly two adjacent edges meet but are permitted at
         intersections (junctions with three or more adjacent edges) and dead
         ends (junctions with exactly one adjacent edge). Often, networks have
         extraneous junctions in the middle of road segments. This option
         prevents vehicles from making U-turns at these locations.
     Polygons_for_Multiple_Facilities {String}:
         Specifies how service area polygons will be generated when multiple
         facilities are present in the analysis.Overlapping-Individual polygons
         will be created for each facility. The
         polygons can overlap each other. This is the default.Not
         Overlapping-Individual polygons will be created so that a polygon
         from one facility cannot overlap polygons from other facilities. Any
         portion of the network can only be covered by the service area of the
         nearest facility.Merge by Break Value-Polygons of different facilities
         with the same
         break value will be created and joined. When using Overlapping
         or Not Overlapping, all fields from the
         input facilities are included in the output polygons, with the
         exception that values from the inputfield are transferred to thefield
         of the output polygons. Thefield is null when merging by break value,
         and the input fields are not included in the output.
         ObjectIDFacilityOIDFacilityOID
     Polygon_Overlap_Type {String}:
         Specifies whether concentric service area polygons will be created as
         disks or rings. This parameter is applicable only when multiple break
         values are specified for the facilities.Rings-The polygons
         representing larger breaks will exclude the
         polygons of smaller breaks. This creates polygons between consecutive
         breaks. Use this option to find the area from one break to another.
         For instance, if you create 5- and 10-minute service areas, the
         10-minute service area polygon will exclude the area under the
         5-minute service area polygon. This is the default.Disks-Polygons will
         be created from the facility to the break. For
         instance, if you create 5- and 10-minute service areas, the 10-minute
         service area polygon will include the area under the 5-minute service
         area polygon.
     Detailed_Polygons {Boolean}:
         Use of this parameter is no longer recommended. To generate
         detailed polygons, set theparameter value to. Polygon
         DetailHighSpecifies the option to create detailed or generalized
         polygons.Unchecked (False)-Generalized polygons are created, which are
         generated quickly and are fairly accurate. This is the default.Checked
         (True)-Detailed polygons are created, which accurately model
         the service area lines and may contain islands of unreached areas.
         This option is much slower than generating generalized polygons. This
         option isn't supported when using hierarchy. The tool supports
         generating detailed polygons only if the
         largest value specified in theparameter is less than or equal to 15
         minutes or 15 miles (24.14 kilometers). Break Values
     Polygon_Trim_Distance {Linear Unit}:
         The distance within which the service area polygons will be trimmed.
         This is useful when finding service areas in places that have a sparse
         street network and you don't want the service area to cover large
         areas where there are no street features.The default value is 100
         meters. No value or a value of 0 specifies
         that the service area polygons will not be trimmed. This parameter
         value is ignored when using hierarchy.
     Polygon_Simplification_Tolerance {Linear Unit}:
         The amount by which the polygon geometry will be
         simplified.Simplification maintains critical vertices of a polygon to
         define its
         essential shape and removes other vertices. The simplification
         distance you specify is the maximum offset the simplified polygon
         boundaries can deviate from the original polygon boundaries.
         Simplifying a polygon reduces the number of vertices and tends to
         reduce drawing times.
     Point_Barriers {Feature Set}:
         Use this parameter to specify one or more points that will act as
         temporary restrictions or represent additional time or distance that
         may be required to travel on the underlying streets. For example, a
         point barrier can be used to represent a fallen tree along a street or
         a time delay spent at a railroad crossing.The tool imposes a limit of
         250 points that can be added as barriers.When specifying point
         barriers, you can set properties for each, such
         as its name or barrier type, using the following attributes:NameThe
         name of the barrier.BarrierTypeSpecifies whether the point barrier
         restricts travel completely or
         adds time or distance when it is crossed. The value for this attribute
         is specified as one of the following integers (use the numeric code,
         not the name in parentheses):0 (Restriction)-Prohibits travel through
         the barrier. The barrier is
         referred to as a restriction point barrier since it acts as a
         restriction. 2 (Added Cost)-Traveling through the barrier
         increases the
         travel time or distance by the amount specified in the,, orfield. This
         barrier type is referred to as an added cost point barrier.
         Additional_TimeAdditional_DistanceAdditionalCostAdditional_Time
         The added travel time when the barrier is traversed. This
         field is applicable only for added-cost barriers and when theparameter
         value is time based. Measurement Units        This field value
         must be greater than or equal to zero, and
         its units must be the same as those specified in theparameter.
         Measurement UnitsAdditional_Distance        The added distance when
         the barrier is traversed. This field
         is applicable only for added-cost barriers and when theparameter value
         is distance based. Measurement Units        The field value
         must be greater than or equal to zero, and its
         units must be the same as those specified in theparameter.
         Measurement UnitsAdditionalCost        The added cost when the barrier
         is traversed. This field is
         applicable only for added-cost barriers when theparameter value is
         neither time based nor distance based. Measurement
         UnitsFullEdgeSpecifies how the restriction point barriers are applied
         to the edge
         elements during the analysis. The field value is specified as one of
         the following integers (use the numeric code, not the name in
         parentheses):0 (False)-Permits travel on the edge up to the barrier
         but not through
         it. This is the default value.1 (True)-Restricts travel anywhere on
         the associated edge.CurbApproachSpecifies the direction of traffic
         that is affected by the barrier.
         The field value is specified as one of the following integers (use the
         numeric code, not the name in parentheses):0 (Either side of
         vehicle)-The barrier affects travel over the edge in
         both directions.1 (Right side of vehicle)-Vehicles are only affected
         if the barrier is
         on their right side during the approach. Vehicles that traverse the
         same edge but approach the barrier on their left side are not affected
         by the barrier.2 (Left side of vehicle)-Vehicles are only affected if
         the barrier is
         on their left side during the approach. Vehicles that traverse the
         same edge but approach the barrier on their right side are not
         affected by the barrier.Because junctions are points and don't have a
         side, barriers on
         junctions affect all vehicles regardless of the curb approach.
         Theattribute works with both types of national driving
         standards: right-hand traffic (United States) and left-hand traffic
         (United Kingdom). First, consider a facility on the left side of a
         vehicle. It is always on the left side regardless of whether the
         vehicle travels on the left or right half of the road. What may change
         with national driving standards is your decision to approach a
         facility from one of two directions, that is, so it ends up on the
         right or left side of the vehicle. For example, to arrive at a
         facility and not have a lane of traffic between the vehicle and the
         facility, choose 1 (Right side of vehicle) in the United States and 2
         (Left side of vehicle) in the United Kingdom.
         CurbApproachBearing        The direction in which a point is moving.
         The units are
         degrees and are measured clockwise from true north. This field is used
         in conjunction with thefield. BearingTolBearing data is usually
         sent automatically from a mobile device
         equipped with a GPS receiver. Try to include bearing data if you are
         loading an input location that is moving, such as a pedestrian or a
         vehicle.Using this field tends to prevent adding locations to the
         wrong edges,
         which can occur when a vehicle is near an intersection or an overpass,
         for example. Bearing also helps the tool determine on which side of
         the street the point is.BearingTol        The bearing tolerance value
         creates a range of acceptable
         bearing values when locating moving points on an edge using thefield.
         If thefield value is within the range of acceptable values that are
         generated from the bearing tolerance on an edge, the point can be
         added as a network location there; otherwise, the closest point on the
         next-nearest edge is evaluated. BearingBearingThe units are in
         degrees, and the default value is 30. Values must be
         greater than 0 and less than 180. A value of 30 means that when
         Network Analyst attempts to add a network location on an edge, a range
         of acceptable bearing values is generated 15 degrees to either side of
         the edge (left and right) and in both digitized directions of the
         edge.NavLatency        This field is only used in the solve process if
         theandfields
         also have values; however, entering afield value is optional, even
         when values are present inand.indicates how much cost is expected to
         elapse from the moment GPS information is sent from a moving vehicle
         to a server and the moment the processed route is received by the
         vehicle's navigation device.
         BearingBearingTolNavLatencyBearingBearingTolNavLatencyThe units of
         NavLatency are the same as the units of the impedance
         attribute.
     Line_Barriers {Feature Set}:
         Use this parameter to specify one or more lines that prohibit travel
         anywhere the lines intersect the streets. For example, a parade or
         protest that blocks traffic across several street segments can be
         modeled with a line barrier. A line barrier can also quickly fence off
         several roads from being traversed, thereby channeling possible routes
         away from undesirable parts of the street network. The tool
         imposes a limit on the number of streets you can
         restrict using theparameter. While there is no limit to the number of
         lines you can specify as line barriers, the combined number of streets
         intersected by all the lines cannot exceed 500. Line
         BarriersWhen specifying the line barriers, you can set name and
         barrier type
         properties for each using the following attributes:NameThe name of the
         barrier.
     Polygon_Barriers {Feature Set}:
         Use this parameter to specify polygons that either completely restrict
         travel or proportionately scale the time or distance required to
         travel on the streets intersected by the polygons. The service
         imposes a limit on the number of streets you can
         restrict using theparameter. While there is no limit to the number of
         polygons you can specify as polygon barriers, the combined number of
         streets intersected by all the polygons cannot exceed 2,000.
         Polygon BarriersWhen specifying the polygon barriers, you can set
         properties for each,
         such as its name or barrier type, using the following
         attributes:NameThe name of the barrier.BarrierTypeSpecifies whether
         the barrier restricts travel completely or scales
         the cost (such as time or distance) for traveling through it. The
         field value is specified as one of the following integers (use the
         numeric code, not the name in parentheses):0 (Restriction)-Prohibits
         traveling through any part of the barrier.
         The barrier is referred to as a restriction polygon barrier since it
         prohibits traveling on streets intersected by the barrier. One use of
         this type of barrier is to model floods covering areas of the street
         that make traveling on those streets impossible. 1 (Scaled
         Cost)-Scales the cost (such as travel time or
         distance) required to travel the underlying streets by a factor
         specified using theorfield. If the streets are partially covered by
         the barrier, the travel time or distance is apportioned and then
         scaled. For example, a factor of 0.25 means that travel on underlying
         streets is expected to be four times faster than normal. A factor of
         3.0 means it is expected to take three times longer than normal to
         travel on underlying streets. This barrier type is referred to as a
         scaled-cost polygon barrier. It can be used to model storms that
         reduce travel speeds in specific regions, for example.
         ScaledTimeFactorScaledDistanceFactorScaledTimeFactorThis is the factor
         by which the travel time of the streets intersected
         by the barrier is multiplied. The field value must be greater than
         zero. This field is applicable only for scaled-cost barriers
         and
         when theparameter is time-based. Measurement
         UnitsScaledDistanceFactorThis is the factor by which the distance of
         the streets intersected by
         the barrier is multiplied. The field value must be greater than zero.
         This field is applicable only for scaled-cost barriers and
         when theparameter is distance-based. Measurement
         UnitsScaledCostFactorThis is the factor by which the cost of the
         streets intersected by the
         barrier is multiplied. The field value must be greater than zero.
         This field is applicable only for scaled-cost barriers when
         theparameter is neither time-based nor distance-based.
         Measurement Units
     Restrictions {String}:
         The travel restrictions that will be honored by the tool when
         determining the service areas.A restriction represents a driving
         preference or requirement. In most
         cases, restrictions cause roads to be prohibited. For instance, using
         the Avoid Toll Roads restriction will result in a route that will
         include toll roads only when it is required to travel on toll roads to
         visit an incident or a facility. Height Restriction makes it possible
         to route around any clearances that are lower than the height of the
         vehicle. If you are carrying corrosive materials on the vehicle, using
         the Any Hazmat Prohibited restriction prevents hauling the materials
         along roads where it is marked illegal to do so. The values you
         provide for this parameter are ignored unlessis
         set to. Travel ModeCustom         Some restrictions require an
         additional value to be specified
         for their use. This value must be associated with the restriction name
         and a specific parameter intended to work with the restriction. You
         can identify such restrictions if their names appear in the
         AttributeName column of theparameter. Specify thefield for
         theparameter for the restriction to be correctly used when finding
         traversable roads. Attribute Parameter
         ValuesParameterValueAttribute Parameter Values         Some
         restrictions are supported only in certain countries;
         their availability is stated by region in the list below. Of the
         restrictions that have limited availability within a region, you can
         determine whether the restriction is available in a particular country
         by reviewing the table in the Country list section of Network analysis
         coverage. If a country has a value ofin the Logistics Attribute
         column, the restriction with select availability in the region is
         supported in that country. If you specify restriction names that are
         not available in the country where the incidents are located, the
         service ignores the invalid restrictions. The service also ignores
         restrictions when theattribute parameter value is between 0 and 1 (see
         theparameter). It prohibits all restrictions when theparameter value
         is greater than 0. YesRestriction UsageAttribute Parameter
         ValueRestriction UsageThe service supports the following restrictions:
         Any Hazmat Prohibited-The results will not include roads
         where transporting any kind of hazardous material is prohibited.
         Availability: Select countries in North America and Europe
         Avoid Carpool Roads-The results will avoid roads that are
         designated exclusively for car pool (high-occupancy) vehicles.
         Availability: All countries         Avoid Express Lanes-The results
         will avoid roads designated
         as express lanes. Availability: All countries         Avoid
         Ferries-The results will avoid ferries.
         Availability: All countries         Avoid Gates-The results will avoid
         roads where there are
         gates, such as keyed access or guard-controlled entryways.
         Availability: All countries         Avoid Limited Access Roads-The
         results will avoid roads that
         are limited-access highways. Availability: All countries
         Avoid Private Roads-The results will avoid roads that are not
         publicly owned and maintained. Availability: All countries
         Avoid Roads Unsuitable for Pedestrians-The results will avoid
         roads that are unsuitable for pedestrians. Availability: All
         countries         Avoid Stairways-The results will avoid all stairways
         on a
         pedestrian-suitable route. Availability: All countries
         Avoid Toll Roads-The results will avoid all toll roads for
         automobiles. Availability: All countries         Avoid Toll
         Roads for Trucks-The results will avoid all toll
         roads for trucks. Availability: All countries         Avoid
         Truck Restricted Roads-The results will avoid roads
         where trucks are not allowed, except when making deliveries.
         Availability: All countries         Avoid Unpaved Roads-The results
         will avoid roads that are not
         paved (for example, dirt, gravel, and so on). Availability:
         All countries         Axle Count Restriction-The results will not
         include roads
         where trucks with the specified number of axles are prohibited. The
         number of axles can be specified using the Number of Axles restriction
         parameter. Availability: Select countries in North America and
         Europe         Driving a Bus-The results will not include roads where
         buses
         are prohibited. Using this restriction will also ensure that the
         results will honor one-way streets. Availability: All
         countries         Driving a Taxi-The results will not include roads
         where taxis
         are prohibited. Using this restriction will also ensure that the
         results will honor one-way streets. Availability: All
         countries         Driving a Truck-The results will not include roads
         where
         trucks are prohibited. Using this restriction will also ensure that
         the results will honor one-way streets. Availability: All
         countries         Driving an Automobile-The results will not include
         roads
         where automobiles are prohibited. Using this restriction will also
         ensure that the results will honor one-way streets.
         Availability: All countries         Driving an Emergency Vehicle-The
         results will not include
         roads where emergency vehicles are prohibited. Using this restriction
         will also ensure that the results will honor one-way streets.
         Availability: All countries         Height Restriction-The results
         will not include roads where
         the vehicle height exceeds the maximum allowed height for the road.
         The vehicle height can be specified using the Vehicle Height (meters)
         restriction parameter. Availability: Select countries in North
         America and Europe         Kingpin to Rear Axle Length Restriction-The
         results will not
         include roads where the vehicle length exceeds the maximum allowed
         kingpin to rear axle for all trucks on the road. The length between
         the vehicle kingpin and the rear axle can be specified using the
         Vehicle Kingpin to Rear Axle Length (meters) restriction parameter.
         Availability: Select countries in North America and Europe
         Length Restriction-The results will not include roads where
         the vehicle length exceeds the maximum allowed length for the road.
         The vehicle length can be specified using the Vehicle Length (meters)
         restriction parameter. Availability: Select countries in North
         America and Europe         Preferred for Pedestrians-The results will
         use preferred
         routes suitable for pedestrian navigation. Availability:
         Select countries in North America and Europe         Riding a
         Motorcycle-The results will not include roads where
         motorcycles are prohibited. Using this restriction will also ensure
         that the results will honor one-way streets. Availability: All
         countries         Roads Under Construction Prohibited-The results will
         not
         include roads that are under construction. Availability: All
         countries         Semi or Tractor with One or More Trailers
         Prohibited-The
         results will not include roads where semis or tractors with one or
         more trailers are prohibited. Availability: Select countries
         in North America and Europe         Single Axle Vehicles
         Prohibited-The results will not include
         roads where vehicles with single axles are prohibited.
         Availability: Select countries in North America and Europe
         Tandem Axle Vehicles Prohibited-The results will not include
         roads where vehicles with tandem axles are prohibited.
         Availability: Select countries in North America and Europe
         Through Traffic Prohibited-The results will not include roads
         where through traffic (nonlocal) is prohibited. Availability:
         All countries         Truck with Trailers Restriction-The results will
         not include
         roads where trucks with the specified number of trailers on the truck
         are prohibited. The number of trailers on the truck can be specified
         using the Number of Trailers on Truck restriction parameter.
         Availability: Select countries in North America and Europe         Use
         Preferred Hazmat Routes-The results will prefer roads
         that are designated for transporting any kind of hazardous materials.
         Availability: Select countries in North America and Europe         Use
         Preferred Truck Routes-The results will prefer roads that
         are designated as truck routes, such as the roads that are part of the
         national network as specified by the National Surface Transportation
         Assistance Act in the United States, or roads that are designated as
         truck routes by the state or province, or roads that are preferred by
         truckers when driving in an area. Availability: Select
         countries in North America and Europe         Walking-The results will
         not include roads where pedestrians
         are prohibited. Availability: All countries         Weight
         Restriction-The results will not include roads where
         the vehicle weight exceeds the maximum allowed weight for the road.
         The vehicle weight can be specified using the Vehicle Weight
         (kilograms) restriction parameter. Availability: Select
         countries in North America and Europe         Weight per Axle
         Restriction-The results will not include
         roads where the vehicle weight per axle exceeds the maximum allowed
         weight per axle for the road. The vehicle weight per axle can be
         specified using the Vehicle Weight per Axle (kilograms) restriction
         parameter. Availability: Select countries in North America and
         Europe         Width Restriction-The results will not include roads
         where
         the vehicle width exceeds the maximum allowed width for the road. The
         vehicle width can be specified using the Vehicle Width (meters)
         restriction parameter. Availability: Select countries in North
         America and Europe
     Attribute_Parameter_Values {Record Set}:
         Use this parameter to specify additional values required by an
         attribute or restriction, such as to specify whether the restriction
         prohibits, avoids, or prefers travel on restricted roads. If the
         restriction is meant to avoid or prefer roads, you can further specify
         the degree to which they are avoided or preferred using this
         parameter. For example, you can choose to never use toll roads, avoid
         them as much as possible, or prefer them. The values you
         provide for this parameter are ignored unlessis
         set to. Travel ModeCustom        If you specify theparameter
         from a feature class, the field
         names on the feature class must match the fields as follows:
         Attribute Parameter ValuesAttributeName-The name of the restriction.
         ParameterName-The
         name of the parameter associated with the
         restriction. A restriction can have one or morefield values based on
         its intended use. ParameterName          ParameterValue-The
         value forused by the tool when evaluating
         the restriction. ParameterName        Theparameter is
         dependent on theparameter. Thefield is
         applicable only if the restriction name is specified as the value for
         theparameter. Attribute Parameter
         ValuesRestrictionsParameterValueRestrictions        In, each
         restriction (listed as) has afield value, Restriction
         Usage, that specifies whether the restriction prohibits, avoids, or
         prefers travel on the roads associated with the restriction as well as
         the degree to which the roads are avoided or preferred. The
         Restriction Usagecan be assigned any of the following string values or
         their equivalent numeric values listed in the parentheses:
         Attribute Parameter
         ValuesAttributeNameParameterNameParameterNamePROHIBITED (-1)-Travel on
         the roads using the restriction is
         completely prohibited.AVOID_HIGH (5)-It is highly unlikely the tool
         will include in the
         route the roads that are associated with the restriction.AVOID_MEDIUM
         (2)-It is unlikely the tool will include in the route the
         roads that are associated with the restriction.AVOID_LOW (1.3)-It is
         somewhat unlikely the tool will include in the
         route the roads that are associated with the restriction.PREFER_LOW
         (0.8)-It is somewhat likely the tool will include in the
         route the roads that are associated with the restriction.PREFER_MEDIUM
         (0.5)-It is likely the tool will include in the route
         the roads that are associated with the restriction.PREFER_HIGH
         (0.2)-It is highly likely the tool will include in the
         route the roads that are associated with the restriction.In most
         cases, you can use the default value, PROHIBITED, as the
         Restriction Usage value if the restriction is dependent on a vehicle
         characteristic such as vehicle height. However, in some cases, the
         Restriction Usage value depends on your routing preferences. For
         example, the Avoid Toll Roads restriction has the default value of
         AVOID_MEDIUM for the Restriction Usage attribute. This means that when
         the restriction is used, the tool will route around toll roads when it
         can. AVOID_MEDIUM also indicates how important it is to avoid toll
         roads when finding the best route; it has a medium priority. Choosing
         AVOID_LOW puts lower importance on avoiding tolls; choosing AVOID_HIGH
         instead gives it a higher importance and makes it more acceptable for
         the service to generate longer routes to avoid tolls. Choosing
         PROHIBITED entirely disallows travel on toll roads, making it
         impossible for a route to travel on any portion of a toll road. Keep
         in mind that avoiding or prohibiting toll roads, and avoiding toll
         payments, is the objective for some. In contrast, others prefer to
         drive on toll roads, because avoiding traffic is more valuable to them
         than the money spent on tolls. In the latter case, choose PREFER_LOW,
         PREFER_MEDIUM, or PREFER_HIGH as the value for Restriction Usage. The
         higher the preference, the farther the tool will go to travel on the
         roads associated with the restriction.
     Time_Zone_for_Time_of_Day {String}:
         Specifies the time zone or zones of theparameter. Time
         of Day         Geographically Local-Theparameter refers to the time
         zone or
         zones in which the facilities are located. The start or end times of
         the service areas are staggered by time zone. Settingto 9:00 AM,
         choosing this option for, and solving causes service areas to be
         generated for 9:00 a.m. eastern time for any facilities in the eastern
         time zone, 9:00 a.m. central time for facilities in the central time
         zone, 9:00 a.m. mountain time for facilities in the mountain time
         zone, and so on, for facilities in different time zones. Time
         of DayTime of DayTime Zone for Time of DayIf stores in a chain that
         span the U.S. open at 9:00 a.m. local time,
         this parameter value can be chosen to find market territories at
         opening time for all stores in one solve. First, the stores in the
         eastern time zone open and a polygon is generated, then an hour later
         stores open in central time, and so on. Nine o'clock is always in
         local time but staggered in real time. UTC-Theparameter refers
         to coordinated universal time (UTC).
         All facilities are reached or departed from simultaneously, regardless
         of the time zone each is in. Time of Day          Settingto
         2:00 PM, choosing this option, and solving causes
         service areas to be generated for 9:00 a.m. eastern standard time for
         any facilities in the eastern time zone, 8:00 a.m. central standard
         time for facilities in the central time zone, 7:00 a.m. mountain
         standard time for facilities in the mountain time zone, and so on, for
         facilities in different time zones. Time of Day          The
         scenario above assumes standard time. During daylight
         saving time, the eastern, central, and mountain times will each be one
         hour ahead (that is, 10:00, 9:00, and 8:00 a.m., respectively).
         One of the cases in which this option is useful is to
         visualize emergency response coverage for a jurisdiction that is split
         into two time zones. The emergency vehicles are loaded as facilities.
         Theparameter is set to now in UTC. (You need to determine the current
         time and date in terms of UTC to correctly use this option.) Other
         properties are set and the analysis is solved. Even though a time zone
         boundary divides the vehicles, the results show areas that can be
         reached given current traffic conditions. This same process can be
         used for other times as well, not just for now. Time of Day
         Regardless of thesetting, all facilities must be in the same
         time zone whenhas a nonnull value andis set to create merged or
         nonoverlapping polygons. Time Zone for Time of DayTime of
         DayPolygons for Multiple Facilities
     Travel_Mode {String}:
         The mode of transportation that will be modeled in the analysis.
         Travel modes are managed in ArcGIS Online and can be configured by the
         administrator of your organization to reflect the organization's
         workflows. Specify the name of a travel mode that is supported by your
         organization. To get a list of supported travel mode names, run
         the Get
         Travel Modes tool from the Utilities toolbox under the same GIS server
         connection you used to access the tool. The Get Travel Modes tool adds
         the Supported Travel Modes table to the application. Any value in
         thefield from the Supported Travel Modes table can be specified as
         input. You can also specify the value from thefield as input. This
         speeds up tool operation, as the tool does not have to find the
         settings based on the travel mode name. Travel Mode NameTravel
         Mode Settings        The default value,, allows you to configure a
         custom travel
         mode using the custom travel mode parameters (,,,, and). The default
         values of the custom travel mode parameters model traveling by car.
         You can also chooseand set the custom travel mode parameters listed
         above to model a pedestrian with a fast walking speed or a truck with
         a given height, weight, and cargo of certain hazardous materials. You
         can try different settings to get the analysis results you want. Once
         you have identified the analysis settings, work with your
         organization's administrator and save these settings as part of a new
         or existing travel mode so that everyone in your organization can run
         the analysis with the same settings. CustomUTurn at
         JunctionsUse HierarchyRestrictionsAttribute Parameter
         ValuesImpedanceCustom        When you choose, the values you set for
         the custom travel mode
         parameters are included in the analysis. Specifying another travel
         mode, as defined by your organization, causes any values you set for
         the custom travel mode parameters to be ignored; the tool overrides
         them with values from the specified travel mode. Custom
     Impedance {String}:
         Specifies the impedance, which is a value that represents the effort
         or cost of traveling along road segments or on other parts of the
         transportation network.Travel time is an impedance: a car may take 1
         minute to travel a mile
         along an empty road. Travel times can vary by travel mode-a pedestrian
         may take more than 20 minutes to walk the same mile, so it is
         important to choose the right impedance for the travel mode you are
         modeling.Travel distance can also be an impedance; the length of a
         road in
         kilometers can be thought of as impedance. Travel distance in this
         sense is the same for all modes-a kilometer for a pedestrian is also a
         kilometer for a car. (What may change is the pathways on which the
         different modes are allowed to travel, which affects distance between
         points, and this is modeled by travel mode settings.)        The value
         you provide for this parameter is ignored unlessis
         set to, which is the default value. Travel ModeCustom
         TravelTime-Historical and live traffic data is used. This
         option is good for modeling the time it takes automobiles to travel
         along roads at a specific time of day using live traffic speed data
         where available. When using, you can optionally set the
         TravelTime::Vehicle Maximum Speed (km/h) attribute parameter to
         specify the physical limitation of the speed the vehicle is capable of
         traveling. TravelTimeMinutes-Live traffic data is not used,
         but historical average speeds
         for automobiles data is used. TruckTravelTime-Historical and
         live traffic data is used, but
         the speed is capped at the posted truck speed limit. This is good for
         modeling the time it takes for the trucks to travel along roads at a
         specific time. When using, you can optionally set the
         TruckTravelTime::Vehicle Maximum Speed (km/h) attribute parameter to
         specify the physical limitation of the speed the truck is capable of
         traveling. TruckTravelTimeTruckMinutes-Live traffic data is
         not used, but the smaller of the
         historical average speeds for automobiles and the posted speed limits
         for trucks is used.WalkTime-The default is a speed of 5 km/hr on all
         roads and paths, but
         this can be configured through the WalkTime::Walking Speed (km/h)
         attribute parameter.Miles-Length measurements along roads are stored
         in miles and can be
         used for performing analysis based on shortest
         distance.Kilometers-Length measurements along roads are stored in
         kilometers
         and can be used for performing analysis based on shortest
         distance.TimeAt1KPH-The default is a speed of 1 km/hr on all roads and
         paths.
         The speed cannot be changed using any attribute parameter.Drive
         Time-Travel times for a car are modeled. These travel times are
         dynamic and fluctuate according to traffic flows in areas where
         traffic data is available. This is the default value.Truck Time-Travel
         times for a truck are modeled. These travel times
         are static for each road and don't fluctuate with traffic.Walk
         Time-Travel times for a pedestrian are modeled. Travel
         Distance-Length measurements along roads and paths are
         stored. To model walk distance, choose this option and ensure thatis
         set for theparameter. Similarly, to model drive or truck distance,
         choosehere and set the appropriate restrictions so the vehicle travels
         only on roads where it is permitted to do so.
         WalkingRestrictionTravel Distance        If you choose a time-based
         impedance, such as,,,, or,
         theparameter must be set to a time-based value; if you choose a
         distance-based impedance such asor,must be a distance-based value.
         TravelTimeTruckTravelTimeMinutesTruckMinutesWalkTimeBreak
         UnitsMilesKilometersBreak Units        ,,, andimpedance values are no
         longer supported and will be
         removed in a future release. If you use one of these values, the tool
         uses the value of theparameter for time-based values and theparameter
         for distance-based values. Drive TimeTruck TimeWalk TimeTravel
         DistanceTime ImpedanceDistance Impedance
     Save_Output_Network_Analysis_Layer {Boolean}:
         Specifies whether the analysis settings will be saved as a network
         analysis layer file. You cannot directly work with this file even when
         you open the file in an ArcGIS Desktop application such as ArcMap. It
         is meant to be sent to Esri Technical Support to diagnose the quality
         of results returned from the tool. Checked (True in
         Python)-The output will be saved as a
         network analysis layer file. The file will be downloaded to a
         temporary directory on your machine. In ArcGIS Pro, the location of
         the downloaded file can be determined by viewing the value for
         theparameter in the entry corresponding to the tool service in the
         geoprocessing history of the project. In ArcMap, the location of the
         file can be determined by accessing theoption in the shortcut menu of
         theparameter in the entry corresponding to the tool service in
         thewindow. Output Network Analysis LayerCopy LocationOutput
         Network Analysis LayerGeoprocessing ResultsUnchecked (False in
         Python)-The output will not be saved as a network
         analysis layer file. This is the default.
     Overrides {String}:
         This parameter is for internal use only.
     Time_Impedance {String}:
         If the impedance for the travel mode, as specified using
         theparameter, is time based, the values for theandparameters must be
         identical. Otherwise, the service will return an error. The
         time-based impedance value represents the travel time along road
         segments or on other parts of the transportation network.ImpedanceTime
         ImpedanceImpedanceMinutes-Time impedance will be
         minutes.TravelTime-Time impedance will
         be travel time.TimeAt1KPH-Time impedance will be time at one kilometer
         per hour.WalkTime-Time impedance will be walk time.TruckMinutes-Time
         impedance will be truck minutes.TruckTravelTime-Time impedance will be
         truck travel time.
     Distance_Impedance {String}:
         If the impedance for the travel mode, as specified using
         theparameter, is distance based, the values for theandparameters must
         be identical. Otherwise, the service will return an error. The
         distance-based impedance value represents the travel distance
         along road segments or on other parts of the transportation
         network.ImpedanceDistance ImpedanceImpedanceMiles-Distance impedance
         will be miles.Kilometers-Distance impedance
         will be kilometers.
     Polygon_Detail {String}:
         Specifies the level of detail for the output
         polygons.Standard-Polygons will be created with a standard level of
         detail.
         Standard polygons are generated quickly and are fairly accurate, but
         quality deteriorates as you move toward the borders of the service
         area polygons. This is the default.Generalized-Generalized polygons
         will be created using the hierarchy
         present in the network data source to produce results quickly.
         Generalized polygons are inferior in quality compared to standard or
         high-precision polygons.High-Polygons will be created with the highest
         level of detail. Holes
         in the polygon may exist; they represent islands of network elements,
         such as streets, that couldn't be reached without exceeding the cutoff
         impedance or due to travel restrictions Use this option for
         applications in which precise results are important.If your analysis
         covers an urban area with a grid-like street network,
         the difference between generalized and standard polygons will be
         minimal. However, for mountain and rural roads, the standard and
         detailed polygons may present significantly more accurate results than
         generalized polygons. The tool supports generating high-
         precision polygons only if
         the largest value specified in theparameter is less than or equal to
         15 minutes or 15 miles (24.14 kilometers). Break Values
     Output_Type {String}:
         Specifies the type of output that will be generated. Service area
         output can be line features representing the roads reachable before
         the cutoffs are exceeded or the polygon features encompassing these
         lines (representing the reachable area).Polygons-The service area
         output will contain polygons only. This is
         the default.Lines-The service area output will contain lines
         only.Polygons and lines-The service area output will contain both
         polygons
         and lines.
     Output_Format {String}:
         Specifies the format in which the output features will be
         returned.Feature Set-The output features will be returned as feature
         classes
         and tables. This is the default.JSON File-The output features will be
         returned as a compressed file
         containing the JSON representation of the outputs. When this option is
         specified, the output is a single file (with a .zip extension) that
         contains one or more JSON files (with a .json extension) for each of
         the outputs created by the service.GeoJSON File-The output features
         will be returned as a compressed file
         containing the GeoJSON representation of the outputs. When this option
         is specified, the output is a single file (with a .zip extension) that
         contains one or more GeoJSON files (with a .geojson extension) for
         each of the outputs created by the service. When a file-based
         output format, such asor, is specified, no
         outputs will be added to the display because the application, such as
         ArcMap or ArcGIS Pro, cannot draw the contents of the result file.
         Instead, the result file is downloaded to a temporary directory on
         your machine. In ArcGIS Pro, the location of the downloaded file can
         be determined by viewing the value for theparameter in the entry
         corresponding to the tool operation in the geoprocessing history of
         the project. In ArcMap, the location of the file can be determined by
         accessing theoption in the shortcut menu of theparameter in the entry
         corresponding to the tool operation in thewindow. JSON
         FileGeoJSON FileOutput Result FileCopy LocationOutput Result
         FileGeoprocessing Results
     Ignore_Invalid_Locations {Boolean}:
         Specifies whether invalid input locations will be ignored.SKIP-Network
         locations that are unlocated will be ignored and the
         analysis will run using valid network locations only. The analysis
         will also continue if locations are on nontraversable elements or have
         other errors. This is useful if you know the network locations are not
         all correct, but you want to run the analysis with the network
         locations that are valid. This is the default.HALT-Invalid locations
         will not be ignored. Do not run the analysis if
         there are invalid locations. Correct the invalid locations and rerun
         the analysis.
     Locate_Settings {String}:
         Use this parameter to specify settings that affect how inputs are
         located, such as the maximum search distance to use when locating the
         inputs on the network or the network sources being used for locating.
         The locator JSON object has the following
         properties:Currently, you can't specify different source names for the
         sources array. Also, allowAutoRelocate is always set to true since the
         service does not support location fields. tolerance
         and toleranceUnits-Allows you to control the
         maximum search distance when locating inputs. If no valid network
         location is found within this distance, the input features will be
         considered unlocated. A small search tolerance decreases the
         likelihood of locating on the wrong street but increases the
         likelihood of not finding any valid network location. The
         toleranceUnits parameter value can be specified as one of the
         following values:
         esriCentimetersesriDecimalDegreesesriDecimetersesriFeetesriInchesesriI
         ntFeetesriIntInchesesriIntMilesesriIntNauticalMilesesriIntYardsesriKil
         ometersesriMetersesriMilesesriMillimetersesriNauticalMilesesriYards
         sources-Allows you to control which network source can be
         used for locating. For example, you can configure the analysis to
         locate inputs on streets but not on sidewalks. The list of possible
         sources on which to locate is specific to the network dataset this
         service references. Only the sources that are present in the sources
         array are used for locating. Sources is specified as an array of
         objects each having the following property:          name-The name of
         the network source feature class that can be used for
         locating inputsallowAutoRelocate-Allows you to control whether inputs
         with existing
         network location fields can be automatically relocated when solving to
         ensure valid, routable location fields for the analysis. If the value
         is true, points located on restricted network elements and points
         affected by barriers will be relocated to the closest routable
         location. If the value is false, network location fields will be used
         as is even if the points are unreachable, and this may cause the solve
         to fail. Even if the value is false, inputs with no location fields or
         incomplete location fields will be located during the solve
         operation.The parameter value is specified as a JSON object. The JSON
         object
         allows you to specify a locator JSON for all input feature in the
         analysis, or you can specify an override for a particular input. The
         override allows you to have different settings for each analysis
         input. For example, you can disallow stops to locate on highway ramps
         and allow point barriers to locate on highway ramps. When specifying
         the Locate_Settings JSON, you must provide the tolerance,
         toleranceUnits, and allowAutoRelocate properties. If you need to
         provide a different locator JSON for a particular input class, you
         must include the overrides property for that input. The property name
         must match the input parameter name. The locator JSON for a particular
         input doesn't need to include all the properties; you only need to
         include the properties that are different from the default locator
         JSON properties."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateServiceAreas_agolservices(
                *gp_fixargs(
                    (
                        Facilities,
                        Break_Values,
                        Break_Units,
                        Analysis_Region,
                        Travel_Direction,
                        Time_of_Day,
                        Use_Hierarchy,
                        UTurn_at_Junctions,
                        Polygons_for_Multiple_Facilities,
                        Polygon_Overlap_Type,
                        Detailed_Polygons,
                        Polygon_Trim_Distance,
                        Polygon_Simplification_Tolerance,
                        Point_Barriers,
                        Line_Barriers,
                        Polygon_Barriers,
                        Restrictions,
                        Attribute_Parameter_Values,
                        Time_Zone_for_Time_of_Day,
                        Travel_Mode,
                        Impedance,
                        Save_Output_Network_Analysis_Layer,
                        Overrides,
                        Time_Impedance,
                        Distance_Impedance,
                        Polygon_Detail,
                        Output_Type,
                        Output_Format,
                        Ignore_Invalid_Locations,
                        Locate_Settings,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SolveLocationAllocation_agolservices", None)
def SolveLocationAllocation(
    Facilities=None,
    Demand_Points=None,
    Measurement_Units: Literal[
        "Meters", "Kilometers", "Feet", "Yards", "Miles", "NauticalMiles", "Seconds", "Minutes", "Hours", "Days"
    ]
    | None = None,
    Analysis_Region: Literal[
        "Europe", "Japan", "Korea", "MiddleEastAndAfrica", "NorthAmerica", "SouthAmerica", "SouthAsia", "Thailand"
    ]
    | None = None,
    Problem_Type: Literal[
        "Maximize Attendance",
        "Maximize Capacitated Coverage",
        "Maximize Coverage",
        "Maximize Market Share",
        "Minimize Facilities",
        "Minimize Impedance",
        "Target Market Share",
    ]
    | None = None,
    Number_of_Facilities_to_Find=None,
    Default_Measurement_Cutoff=None,
    Default_Capacity=None,
    Target_Market_Share=None,
    Measurement_Transformation_Model: Literal["Linear", "Power", "Exponential"] | None = None,
    Measurement_Transformation_Factor=None,
    Travel_Direction: Literal["Demand to Facility", "Facility to Demand"] | None = None,
    Time_of_Day=None,
    Time_Zone_for_Time_of_Day: Literal["Geographically Local", "UTC"] | None = None,
    UTurn_at_Junctions: Literal[
        "Allowed", "Not Allowed", "Allowed Only at Dead Ends", "Allowed Only at Intersections and Dead Ends"
    ]
    | None = None,
    Point_Barriers=None,
    Line_Barriers=None,
    Polygon_Barriers=None,
    Use_Hierarchy=None,
    Restrictions: list[
        Literal[
            "Any Hazmat Prohibited",
            "Avoid Carpool Roads",
            "Avoid Express Lanes",
            "Avoid Ferries",
            "Avoid Gates",
            "Avoid Limited Access Roads",
            "Avoid Private Roads",
            "Avoid Roads Unsuitable for Pedestrians",
            "Avoid Stairways",
            "Avoid Toll Roads",
            "Avoid Toll Roads for Trucks",
            "Avoid Truck Restricted Roads",
            "Avoid Unpaved Roads",
            "Axle Count Restriction",
            "Driving a Bus",
            "Driving a Taxi",
            "Driving a Truck",
            "Driving an Automobile",
            "Driving an Emergency Vehicle",
            "Height Restriction",
            "High Speed Roads Restriction",
            "Kingpin to Rear Axle Length Restriction",
            "Length Restriction",
            "Preferred for Pedestrians",
            "Riding a Motorcycle",
            "Roads Under Construction Prohibited",
            "Semi or Tractor with One or More Trailers Prohibited",
            "Single Axle Vehicles Prohibited",
            "Tandem Axle Vehicles Prohibited",
            "Through Traffic Prohibited",
            "Truck with Trailers Restriction",
            "Use Preferred Hazmat Routes",
            "Use Preferred Truck Routes",
            "Walking",
            "Weight Restriction",
            "Weight per Axle Restriction",
            "Width Restriction",
        ]
    ]
    | Literal[
        "Any Hazmat Prohibited",
        "Avoid Carpool Roads",
        "Avoid Express Lanes",
        "Avoid Ferries",
        "Avoid Gates",
        "Avoid Limited Access Roads",
        "Avoid Private Roads",
        "Avoid Roads Unsuitable for Pedestrians",
        "Avoid Stairways",
        "Avoid Toll Roads",
        "Avoid Toll Roads for Trucks",
        "Avoid Truck Restricted Roads",
        "Avoid Unpaved Roads",
        "Axle Count Restriction",
        "Driving a Bus",
        "Driving a Taxi",
        "Driving a Truck",
        "Driving an Automobile",
        "Driving an Emergency Vehicle",
        "Height Restriction",
        "High Speed Roads Restriction",
        "Kingpin to Rear Axle Length Restriction",
        "Length Restriction",
        "Preferred for Pedestrians",
        "Riding a Motorcycle",
        "Roads Under Construction Prohibited",
        "Semi or Tractor with One or More Trailers Prohibited",
        "Single Axle Vehicles Prohibited",
        "Tandem Axle Vehicles Prohibited",
        "Through Traffic Prohibited",
        "Truck with Trailers Restriction",
        "Use Preferred Hazmat Routes",
        "Use Preferred Truck Routes",
        "Walking",
        "Weight Restriction",
        "Weight per Axle Restriction",
        "Width Restriction",
    ]
    | str
    | None = None,
    Attribute_Parameter_Values=None,
    Allocation_Line_Shape: Literal["None", "Straight Line"] | None = None,
    Travel_Mode=None,
    Impedance: Literal[
        "Drive Time",
        "Truck Time",
        "Walk Time",
        "Travel Distance",
        "Minutes",
        "TimeAt1KPH",
        "TravelTime",
        "TruckMinutes",
        "TruckTravelTime",
        "WalkTime",
        "Kilometers",
        "Miles",
    ]
    | None = None,
    Save_Output_Network_Analysis_Layer=None,
    Overrides=None,
    Time_Impedance: Literal["Minutes", "TimeAt1KPH", "TravelTime", "TruckMinutes", "TruckTravelTime", "WalkTime"]
    | None = None,
    Distance_Impedance: Literal["Kilometers", "Miles"] | None = None,
    Output_Format: Literal["Feature Set", "JSON File", "GeoJSON File"] | None = None,
    Ignore_Invalid_Locations=None,
    Locate_Settings=None,
) -> Result:
    """SolveLocationAllocation_agolservices(Facilities, Demand_Points, Measurement_Units, {Analysis_Region}, {Problem_Type}, {Number_of_Facilities_to_Find}, {Default_Measurement_Cutoff}, {Default_Capacity}, {Target_Market_Share}, {Measurement_Transformation_Model}, {Measurement_Transformation_Factor}, {Travel_Direction}, {Time_of_Day}, {Time_Zone_for_Time_of_Day}, {UTurn_at_Junctions}, {Point_Barriers}, {Line_Barriers}, {Polygon_Barriers}, {Use_Hierarchy}, {Restrictions;Restrictions...}, {Attribute_Parameter_Values}, {Allocation_Line_Shape}, {Travel_Mode}, {Impedance}, {Save_Output_Network_Analysis_Layer}, {Overrides}, {Time_Impedance}, {Distance_Impedance}, {Output_Format}, {Ignore_Invalid_Locations}, {Locate_Settings})

       Identifies the best location or locations from a set of input
       locations by assigning demand points to input facilities in a way that
       allocates the most demand to facilities and minimizes overall travel.

    INPUTS:
     Facilities (Feature Set):
         Specify one or more facilities that the solver will choose from during
         the analysis. The solver identifies the best facilities to allocate
         demand in the most efficient way according to the problem type and
         criteria you specify.In a competitive analysis in which you try to
         find the best locations
         in the face of competition, the facilities of the competitors are
         specified here as well.When defining the facilities, you can set
         properties for each-such as
         its name or type-using the following attributes:NameThe name of the
         facility. The name is included in the name of output
         allocation lines if the facility is part of the solution.FacilityType
         Specifies whether the facility is a candidate, required, or a
         competitor facility. The field value is specified as one of the
         following integers (use the numeric code, not the name in
         parentheses):        0 (Candidate)-A facility that may be part of the
         solution.1
         (Required)-A facility that must be part of the solution.2
         (Competitor)-A rival facility that potentially removes demand from
         your facilities. Competitor facilities are specific to the maximize
         market share and target market share problem types; they are ignored
         in other problem types.WeightThe relative weighting of the facility,
         which is used to rate the
         attractiveness, desirability, or bias of one facility compared to
         another.For example, a value of 2.0 may capture the preference of
         customers
         who prefer, at a ratio of 2 to 1, shopping in one facility over
         another facility. Factors that potentially affect facility weight
         include square footage, neighborhood, and age of the building. Weight
         values other than one are only honored by the maximize market share
         and target market share problem types; they are ignored in other
         problem types.CutoffThe impedance value at which to stop searching for
         demand points from
         a given facility. The demand point can't be allocated to a facility
         that is beyond the value indicated here. This attribute allows
         you to specify a different cutoff value
         for each demand point. For example, you may find that people in rural
         areas are willing to travel up to 10 miles to reach a facility, while
         urbanites are only willing to travel up to 2 miles. You can model this
         behavior by setting thevalue for all demand points that are in rural
         areas to 10 and setting thevalue of the demand points in urban areas
         to 2. CutoffCutoffCapacity        Thefield is specific to the
         maximize capacitated coverage
         problem type; the other problem types ignore this field.
         CapacityCapacity specifies how much weighted demand the facility is
         capable of
         supplying. Excess demand won't be allocated to a facility even if that
         demand is within the facility's default measurement cutoff. Any
         value assigned to thefield overrides theparameter
         (Default_Capacity in Python) for the given facility.
         CapacityDefault CapacityCurbApproachSpecifies the direction a vehicle
         may arrive at or depart from the
         facility. The field value is specified as one of the following
         integers (use the numeric code, not the name in parentheses):0 (Either
         side of vehicle)-The facility can be visited from either the
         right or left side of the vehicle.1 (Right side of vehicle)-Arrive at
         or depart the facility so it is on
         the right side of the vehicle. This is typically used for vehicles
         such as buses that must arrive with the bus stop on the right-hand
         side so passengers can disembark at the curb.2 (Left side of
         vehicle)-Arrive at or depart the facility so it is on
         the left side of the vehicle. When the vehicle approaches and departs
         the facility, the curb must be on the left side of the vehicle. This
         is typically used for vehicles such as buses that must arrive with the
         bus stop on the left-hand side so passengers can disembark at the
         curb. Theattribute is designed to work with both types of
         national
         driving standards: right-hand traffic (United States) and left-hand
         traffic (United Kingdom). First, consider a facility on the left side
         of a vehicle. It is always on the left side regardless of whether the
         vehicle travels on the left or right half of the road. What may change
         with national driving standards is your decision to approach a
         facility from one of two directions, that is, so it ends up on the
         right or left side of the vehicle. For example, if you want to arrive
         at a facility and not have a lane of traffic between the vehicle and
         the incident, choose 1 (Right side of vehicle) in the United States
         and 2 (Left side of vehicle) in the United Kingdom.
         CurbApproachBearing        The direction in which a point is moving.
         The units are
         degrees and are measured clockwise from true north. This field is used
         in conjunction with thefield. BearingTolBearing data is usually
         sent automatically from a mobile device
         equipped with a GPS receiver. Try to include bearing data if you are
         loading an input location that is moving, such as a pedestrian or a
         vehicle.Using this field tends to prevent adding locations to the
         wrong edges,
         which can occur when a vehicle is near an intersection or an overpass,
         for example. Bearing also helps the tool determine on which side of
         the street the point is.BearingTol        The bearing tolerance value
         creates a range of acceptable
         bearing values when locating moving points on an edge using thefield.
         If thefield value is within the range of acceptable values that are
         generated from the bearing tolerance on an edge, the point can be
         added as a network location there; otherwise, the closest point on the
         next-nearest edge is evaluated. BearingBearingThe units are in
         degrees, and the default value is 30. Values must be
         greater than 0 and less than 180. A value of 30 means that when
         Network Analyst attempts to add a network location on an edge, a range
         of acceptable bearing values is generated 15 degrees to either side of
         the edge (left and right) and in both digitized directions of the
         edge.NavLatency        This field is only used in the solve process if
         theandfields
         also have values; however, entering afield value is optional, even
         when values are present inand.indicates how much cost is expected to
         elapse from the moment GPS information is sent from a moving vehicle
         to a server and the moment the processed route is received by the
         vehicle's navigation device.
         BearingBearingTolNavLatencyBearingBearingTolNavLatencyThe units of
         NavLatency are the same as the units of the impedance
         attribute.
     Demand_Points (Feature Set):
         Specify one or more demand points. The solver identifies the best
         facilities based in large part on how they serve the demand points
         specified here.A demand point is typically a location that represents
         the people or
         things requiring the goods and services your facilities provide. A
         demand point may be a ZIP Code centroid weighted by the number of
         people residing within it or by the expected consumption generated by
         those people. Demand points can also represent business customers. If
         you supply businesses with a high turnover of inventory, they will be
         weighted more heavily than those with a low turnover rate.When
         specifying the demand points, you can set properties for
         each-such as its name or weight-using the following attributes:NameThe
         name of the demand point. The name is included in the name of the
         output allocation line or lines if the demand point is part of the
         solution.GroupNameThe name of the group to which the demand point
         belongs. This field is
         ignored for the Maximize Capacitated Coverage, Target Market Share,
         and Maximize Market Share problem types.If demand points share a group
         name, the solver allocates all members
         of the group to the same facility. (If constraints, such as a cutoff
         distance, prevent any of the demand points in the group from reaching
         the same facility, none of the demand points are allocated.)WeightThe
         relative weighting of the demand point. A value of 2.0 means the
         demand point is twice as important as one with a weight of 1.0. If
         demand points represent households, for example, weight can indicate
         the number of people in each household.CutoffThe impedance value at
         which to stop searching for demand points from
         a given facility. The demand point can't be allocated to a facility
         that is beyond the value indicated here. This attribute allows
         you to specify a cutoff value for each
         demand point. For example, you may find that people in rural areas are
         willing to travel up to 10 miles to reach a facility, while those in
         urban areas are only willing to travel up to 2 miles. You can model
         this behavior by setting thevalue for all demand points that are in
         rural areas to 10 and setting thevalue of the demand points in urban
         areas to 2. CutoffCutoff        The units for this attribute
         value are specified by
         theparameter. Measurement Units        A value for this
         attribute overrides the default set for the
         analysis using theparameter. The default value is Null, which results
         in using the default value set by theparameter for all the demand
         points. Default Measurement CutoffDefault Measurement
         CutoffImpedanceTransformation        A value for this attribute
         overrides the default set for the
         analysis by theparameter. Measurement Transformation
         ModelImpedanceParameter        A value for this attribute overrides
         the default set for the
         analysis by theparameter. Measurement Transformation
         FactorCurbApproachSpecifies the direction a vehicle may arrive at or
         depart from the
         demand point. The field value is specified as one of the following
         integers (use the numeric code, not the name in parentheses):0 (Either
         side of vehicle)-The demand point can be visited from either
         the right or left side of the vehicle.1 (Right side of vehicle)-Arrive
         at or depart the demand point so it
         is on the right side of the vehicle. When the vehicle approaches and
         departs the demand point, the curb must be on the right side of the
         vehicle. This is typically used for vehicles such as buses that must
         arrive with the bus stop on the right-hand side so passengers can
         disembark at the curb.2 (Left side of vehicle)-Arrive at or depart the
         demand point so it is
         on the left side of the vehicle. When the vehicle approaches and
         departs the demand point, the curb must be on the left side of the
         vehicle. This is typically used for vehicles such as buses that must
         arrive with the bus stop on the left-hand side so passengers can
         disembark at the curb. Theattribute is designed to work with
         both types of national
         driving standards: right-hand traffic (United States) and left-hand
         traffic (United Kingdom). First, consider a demand point on the left
         side of a vehicle. It is always on the left side regardless of whether
         the vehicle travels on the left or right half of the road. What may
         change with national driving standards is your decision to approach a
         demand point from one of two directions, that is, so it ends up on the
         right or left side of the vehicle. For example, if you want to arrive
         at a demand point and not have a lane of traffic between the vehicle
         and the demand point, choose 1 (Right side of vehicle) in the United
         States and 2 (Left side of vehicle) in the United Kingdom.
         CurbApproachBearing        The direction in which a point is moving.
         The units are
         degrees and are measured clockwise from true north. This field is used
         in conjunction with thefield. BearingTolBearing data is usually
         sent automatically from a mobile device
         equipped with a GPS receiver. Try to include bearing data if you are
         loading an input location that is moving, such as a pedestrian or a
         vehicle.Using this field tends to prevent adding locations to the
         wrong edges,
         which can occur when a vehicle is near an intersection or an overpass,
         for example. Bearing also helps the tool determine on which side of
         the street the point is.BearingTol        The bearing tolerance value
         creates a range of acceptable
         bearing values when locating moving points on an edge using thefield.
         If thefield value is within the range of acceptable values that are
         generated from the bearing tolerance on an edge, the point can be
         added as a network location there; otherwise, the closest point on the
         next-nearest edge is evaluated. BearingBearingThe units are in
         degrees, and the default value is 30. Values must be
         greater than 0 and less than 180. A value of 30 means that when
         Network Analyst attempts to add a network location on an edge, a range
         of acceptable bearing values is generated 15 degrees to either side of
         the edge (left and right) and in both digitized directions of the
         edge.NavLatency        This field is only used in the solve process if
         theandfields
         also have values; however, entering afield value is optional, even
         when values are present inand.indicates how much cost is expected to
         elapse from the moment GPS information is sent from a moving vehicle
         to a server and the moment the processed route is received by the
         vehicle's navigation device.
         BearingBearingTolNavLatencyBearingBearingTolNavLatencyThe units of
         NavLatency are the same as the units of the impedance
         attribute.
     Measurement_Units (String):
         Specify the units that will be used to measure the travel times or
         travel distances between demand points and facilities. The tool finds
         the best facilities based on those that can reach, or be reached by,
         the most amount of weighted demand with the least amount travel.The
         output allocation lines report travel distance or travel time in
         different units, including the units you specify for this
         parameter.Meters-The linear unit will be meters.Kilometers-The linear
         unit will
         be kilometers.Feet-The linear unit will be feet.Yards-The linear unit
         will be yards.Miles-The linear unit will be miles.NauticalMiles-The
         linear unit will be nautical miles.Seconds-The time unit will be
         seconds.Minutes-The time unit will be minutes.Hours-The time unit will
         be hours.Days-The time unit will be days.
     Analysis_Region {String}:
         The region in which the analysis will be performed. If a value is not
         specified for this parameter, the tool will automatically calculate
         the region name based on the location of the input points. Setting the
         name of the region is required only if the automatic detection of the
         region name is not accurate for the inputs.To specify a region, use
         one of the following values:Europe-The analysis region will be
         Europe.Japan-The analysis region
         will be Japan.Korea-The analysis region will be
         Korea.MiddleEastAndAfrica-The analysis region will be Middle East and
         Africa.NorthAmerica-The analysis region will be North
         America.SouthAmerica-The analysis region will be South
         America.SouthAsia-The analysis region will be South Asia.Thailand-The
         analysis region will be Thailand. The following region names
         are no longer supported and will be
         removed in future releases. If you specify one of the deprecated
         region names, the tool automatically assigns a supported region name
         for the region. Greece redirects to EuropeIndia redirects to
         SouthAsiaOceania
         redirects to SouthAsiaSouthEastAsia redirects to SouthAsiaTaiwan
         redirects to SouthAsia
     Problem_Type {String}:
         Specifies the objective of the location-allocation analysis. The
         default objective is to minimize impedance. Minimize
         Impedance-This is also known as the P-Median problem
         type. Facilities are located so that the sum of all weighted travel
         time or distance between demand points and solution facilities is
         minimized. (Weighted travel is the amount of demand allocated to a
         facility multiplied by the travel distance or time to the facility.)
         This problem type is traditionally used to locate warehouses, because
         it can reduce the overall transportation costs of delivering goods to
         outlets. Since minimizing impedance reduces the overall distance the
         public must travel to reach the chosen facilities, the minimize
         impedance problem without an impedance cutoff is typically regarded as
         more equitable than other problem types for locating public sector
         facilities such as libraries, regional airports, museums, department
         of motor vehicles offices, and health clinics. The following
         list describes how the minimize impedance
         problem type handles demand:          A demand point that cannot reach
         any facilities due to setting a
         cutoff distance or time is not allocated.A demand point that can only
         reach one facility has all its demand
         weight allocated to that facility.A demand point that can reach two or
         more facilities has all its
         demand weight allocated to the nearest facility only. Maximize
         Coverage-Facilities are located so that as much
         demand as possible is allocated to solution facilities within the
         impedance cutoff. Maximize coverage is frequently used to
         locate fire stations, police
         stations, and emergency response system centers, because emergency
         services are often required to arrive at all demand points within a
         specified response time. It is important for all organizations, and
         critical for emergency services, to have accurate and precise data so
         analysis results correctly model real-world results.Pizza delivery
         businesses, as opposed to eat-in pizzerias, try to
         locate stores where they can cover the most people within a certain
         drive time. People who order pizzas for delivery don't typically worry
         about how far away the pizzeria is; they are mainly concerned with the
         pizza arriving within an advertised time window. A pizza delivery
         business would subtract pizza preparation time from their advertised
         delivery time and solve a maximize coverage problem to choose the
         candidate facility that will capture the most potential customers in
         the coverage area. (Potential customers of eat-in pizzerias are more
         affected by distance, since they must travel to the restaurant; thus,
         the attendance maximizing and market share problem types are better
         suited to eat-in restaurants.)          The following list describes
         how the maximize coverage
         problem type handles demand:          A demand point that cannot reach
         any facilities due to cutoff distance
         or time is not allocated.A demand point that can only reach one
         facility has all its demand
         weight allocated to that facility.A demand point that can reach two or
         more facilities has all its
         demand weight allocated to the nearest facility only. Maximize
         Capacitated Coverage-Facilities are located so that
         all or the greatest amount of demand can be served without exceeding
         the capacity of any facility. Maximize capacitated
         coverage behaves similarly to the
         minimize impedance and maximize coverage problem types but with the
         added constraint of capacity. You can specify a capacity for an
         individual facility by assigning a numeric value to its
         correspondingfield on the input facilities. If thefield value is null,
         the facility is assigned a capacity from theproperty.
         CapacityCapacityDefault CapacityUse cases for the maximize capacitated
         coverage problem type include
         creating territories that encompass a given number of people or
         businesses, locating hospitals or other medical facilities with a
         limited number of beds or patients who can be treated, and locating
         warehouses whose inventory isn't assumed to be unlimited. The
         following list describes how the maximize capacitated
         coverage problem type handles demand:                      Unlike
         maximize coverage, maximize capacitated coverage
         doesn't require a value for theparameter; however, when a cutoff is
         specified, any demand point outside the cutoff time or distance of all
         facilities is not allocated. Default Measurement CutoffAn
         allocated demand point has all or none of its demand weight
         assigned to a facility; that is, demand isn't apportioned with this
         problem type. If the total demand that can reach a facility
         is greater
         than the capacity of the facility, only the demand points that
         maximize total captured demand and minimize total weighted travel are
         allocated. You may notice an apparent inefficiency when a
         demand point is
         allocated to a facility that isn't the nearest solution facility. This
         may occur when demand points have varying weights and when the demand
         point in question can reach more than one facility. This kind of
         result indicates the nearest solution facility didn't have adequate
         capacity for the weighted demand, or the most efficient solution for
         the entire problem required one or more local inefficiencies. In
         either case, the solution is correct. Minimize
         Facilities-Facilities are chosen so that as much
         weighted demand as possible is allocated to solution facilities within
         the travel time or distance cutoff; additionally, the number of
         facilities required to cover demand is minimized. Minimize
         facilities is the same as maximize coverage but with the
         exception of the number of facilities to locate, which is determined
         by the solver. When the cost of building facilities is not a limiting
         factor, the same types of organizations that use maximize coverage
         (emergency response, for instance) use minimize facilities so all
         possible demand points will be covered. The following list
         describes how the minimize facilities
         problem type handles demand:          A demand point that cannot reach
         any facilities due to a cutoff
         distance or time is not allocated.A demand point that can only reach
         one facility has all its demand
         weight allocated to that facility.A demand point that can reach two or
         more facilities has all its
         demand weight allocated to the nearest facility only. Maximize
         Attendance-Facilities are chosen so that as much
         demand weight as possible is allocated to facilities while assuming
         the demand weight decreases in relation to the distance between the
         facility and the demand point. Specialty stores that have
         little or no competition benefit from this
         problem type, but it may also be beneficial to general retailers and
         restaurants that don't have the data on competitors necessary to
         perform market share problem types. Some businesses that may benefit
         from this problem type include coffee shops, fitness centers, dental
         and medical offices, and electronics stores. Public transit bus stops
         are often chosen with the help of maximize attendance. Maximize
         attendance assumes that the farther people must travel to reach your
         facility, the less likely they are to use it. This is reflected in how
         the amount of demand allocated to facilities diminishes with distance.
         The following list describes how the maximize attendance
         problem type handles demand:          A demand point that cannot reach
         any facilities due to a cutoff
         distance or time is not allocated.When a demand point can reach a
         facility, its demand weight is only
         partially allocated to the facility. The amount allocated decreases as
         a function of the maximum cutoff distance (or time) and the travel
         distance (or time) between the facility and the demand point.The
         weight of a demand point that can reach more than one facility is
         proportionately allocated to the nearest facility only.
         Maximize Market Share-A specific number of facilities are
         chosen so that the allocated demand is maximized in the presence of
         competitors. The goal is to capture as much of the total market share
         as possible with a given number of facilities, which you specify. The
         total market share is the sum of all demand weight for valid demand
         points. The market share problem types require the most data
         because, along
         with knowing your facilities' weight, you also need to know that of
         your competitors' facilities. The same types of facilities that use
         the maximize attendance problem type can also use market share problem
         types given that they have comprehensive information that includes
         competitor data. Large discount stores typically use maximize market
         share to locate a finite set of new stores. The market share problem
         types use a Huff model, which is also known as a gravity model or
         spatial interaction. The following list describes how the
         maximize market share
         problem type handles demand:          A demand point that cannot reach
         any facilities due to a cutoff
         distance or time is not allocated.A demand point that can only reach
         one facility has all its demand
         weight allocated to that facility.A demand point that can reach two or
         more facilities has all its
         demand weight allocated to them; furthermore, the weight is split
         among the facilities proportionally to the facilities' attractiveness
         (facility weight) and inversely proportionally to the distance between
         the facility and demand point. Given equal facility weights, this
         means more demand weight is assigned to near facilities than
         facilities farther away.The total market share, which can be used to
         calculate the captured
         market share, is the sum of the weight of all valid demand points.
         Target Market Share-The minimum number of facilities
         necessary to capture a specific percentage of the total market share
         in the presence of competitors is chosen. The total market share is
         the sum of all demand weight for valid demand points. You set the
         percent of the market share you want to reach and the solver
         identifies the fewest number of facilities necessary to meet that
         threshold. The market share problem types require the most
         data because, along
         with knowing your facilities' weight, you also need to know that of
         your competitors' facilities. The same types of facilities that use
         the maximize attendance problem type can also use market share problem
         types given that they have comprehensive information that includes
         competitor data.Large discount stores typically use the target market
         share problem
         type when they want to know how much expansion would be required to
         reach a certain level of the market share or determine the strategy
         needed to maintain their current market share given the introduction
         of new competing facilities. The results often represent what stores
         would do if budgets weren't a concern. In cases in which budget is a
         concern, stores revert to the maximize market share problem type and
         capture as much of the market share as possible with a limited number
         of facilities. The following list describes how the target
         market share
         problem type handles demand:          The total market share, which is
         used in calculating the captured
         market share, is the sum of the weight of all valid demand points.A
         demand point that cannot reach any facilities due to a cutoff
         distance or time is not allocated.A demand point that can only reach
         one facility has all its demand
         weight allocated to that facility.A demand point that can reach two or
         more facilities has all its
         demand weight allocated to them, and the weight is split among the
         facilities proportionally to the facilities' attractiveness (facility
         weight) and inversely proportionally to the distance between the
         facility and demand point. Given equal facility weights, this means
         more demand weight is assigned to near facilities than facilities
         farther away.
     Number_of_Facilities_to_Find {Long}:
         The number of facilities to find. The default value is 1. The
         facilities with afield value of 1 (Required) are always
         chosen first. Any excess facilities are chosen from candidate
         facilities with afield value of 2. FacilityTypeFacilityType
         Any facilities that have avalue of 3 (Chosen) before solving
         are treated as candidate facilities at solve time.
         FacilityTypeIf the number of facilities to find is less than the
         number of
         required facilities, an error occurs. is disabled for the
         minimize facilities and target market
         share problem types since the solver determines the minimum number of
         facilities needed to meet the objectives. Number of Facilities
         to Find
     Default_Measurement_Cutoff {Double}:
         The maximum travel time or distance allowed between a demand point and
         the facility it is allocated to. If a demand point is outside the
         cutoff of a facility, it cannot be allocated to that facility.The
         default value is none, which means the cutoff limit doesn't apply.
         The units for this parameter are the same as those specified
         by theparameter. Measurement UnitsThe travel time or distance
         cutoff is measured by the shortest path
         along roads.This parameter can be used to model the maximum distance
         that people
         are willing to travel to visit stores or the maximum time permitted
         for a fire department to reach anyone in the community. Note
         thatincludes thefield, which, if set accordingly,
         overrides theparameter. You may find that people in rural areas are
         willing to travel up to 10 miles to reach a facility while urbanites
         are only willing to travel up to two miles. Assumingis set to, you can
         model this behavior by setting the default measurement cutoff to 10
         and thefield value of the demand points in urban areas to 2.
         Demand PointsCutoffDefault Measurement CutoffMeasurement
         UnitsMilesCutoff
     Default_Capacity {Double}:
         This parameter is specific to the maximize capacitated
         coverage problem type. It is the default capacity assigned to all
         facilities in the analysis. You can override the default capacity for
         a facility by specifying a value in the facility'sfield.
         CapacityThe default value is 1.
     Target_Market_Share {Double}:
         This parameter is specific to the target market share problem type. It
         is the percentage of the total demand weight that you want the chosen
         and required facilities to capture. The solver identifies the minimum
         number of facilities needed to capture the target market share
         specified here.The default value is 10 percent.
     Measurement_Transformation_Model {String}:
         This sets the equation for transforming the network cost
         between facilities and demand points. This parameter, along with,
         specifies how severely the network impedance between facilities and
         demand points influences the solver's choice of facilities.
         Impedance Parameter        In the following list of transformation
         options, d refers to
         demand points and f refers to facilities. Impedance refers to the
         shortest travel distance or time between two locations. So impedanceis
         the shortest-path (time or distance) between demand point d and
         facility f, and costis the transformed travel time or distance between
         the facility and demand point. Lambda (λ) denotes the impedance
         parameter. Theparameter determines whether travel time or distance is
         analyzed. dfdfMeasurement Units         Linear-cost= λ *
         impedance         dfdfThe transformed travel
         time or distance between the facility and the
         demand point is the same as the time or distance of the shortest path
         between the two locations. With this option, the impedance parameter
         (λ) is always set to one. This is the default. Power-cost=
         impedance         dfdfλThe transformed travel
         time or distance between the facility and the
         demand point is equal to the time or distance of the shortest path
         raised to the power specified by the impedance parameter (λ). Use this
         option with a positive impedance parameter to specify higher weight to
         nearby facilities. Exponential-cost= e         df          (λ
         * impedance)
         dfThe transformed travel time or distance between the facility and the
         demand point is equal to the mathematical constant e raised to the
         power specified by the shortest-path network impedance multiplied with
         the impedance parameter (λ). Use this option with a positive impedance
         parameter to specify a high weight to nearby facilities. The
         value set for this parameter can be overridden on a per-
         demand-point basis using thefield in the input demand points.
         ImpedanceTransformation
     Measurement_Transformation_Factor {Double}:
         Provides a parameter value to the equations specified in
         theparameter. The parameter value is ignored when the impedance
         transformation is of type linear. For power and exponential impedance
         transformations, the value should be nonzero. Measurement
         Transformation ModelThe default value is 1. The value set for
         this parameter can be overridden on a per-
         demand-point basis using thefield in the input demand points.
         ImpedanceParameter
     Travel_Direction {String}:
         Specifies whether travel times or distances will be measured from
         facilities to demand points or from demand points to
         facilities.Facility to Demand-The direction of travel will be from
         facilities to
         demand points. This is the default.Demand to Facility-The direction of
         travel will be from demand points
         to facilities.Travel times and distances may change based on direction
         of travel. If
         traveling from point A to point B, you may encounter less traffic or
         have a shorter path, due to one-way streets and turn restrictions,
         than if you were traveling in the opposite direction. For instance,
         traveling from point A to point B may take 10 minutes, but traveling
         the other direction may take 15 minutes. These differing measurements
         may affect whether demand points can be assigned to certain facilities
         because of cutoffs or, for problem types in which demand is
         apportioned, affect how much demand is captured.Fire departments
         commonly measure from facilities to demand points
         since they are concerned with the time it takes to travel from the
         fire station (facility) to the location of the emergency (demand
         point). Management at a retail store is more concerned with the time
         it takes shoppers (demand points) to reach the store (facility);
         therefore, store management commonly measure from demand points to
         facilities. also determines the meaning of any start time that
         is
         provided. See theparameter for more information. Travel
         DirectionTime of Day
     Time_of_Day {Date}:
         The time at which travel begins. This parameter is ignored
         unlessis time based. The default is no time or date. Whenisn't
         specified, the solver uses generic speeds-typically those from posted
         speed limits. Measurement UnitsTime of DayTraffic constantly
         changes in reality, and as it changes, travel times
         between facilities and demand points fluctuate. Therefore, indicating
         different time and date values over several analyses may affect how
         demand is allocated to facilities and which facilities are chosen in
         the results. The time of day always indicates a start time.
         However, travel
         may start from facilities or demand points; it depends on what you
         choose for theparameter. Travel Direction        Theparameter
         specifies whether this time and date refer to UTC
         or the time zone in which the facility or demand point is located.
         Time Zone for Time of Day
     Time_Zone_for_Time_of_Day {String}:
         Specifies the time zone of theparameter. The default is
         geographically local. Time of Day         Geographically
         Local-Theparameter refers to the time zone in
         which the facilities or demand points are located. Ifis facilities to
         demand points, this is the time zone of the facilities. Ifis demand
         points to facilities, this is the time zone of the demand points.
         Time of DayTravel DirectionTravel Direction         UTC-Theparameter
         refers to coordinated universal time (UTC).
         Choose this option if you want to find the best location for a
         specific time, such as now, but aren't certain in which time zone the
         facilities or demand points will be located. Time of Day
         Regardless of theparameter value, the following rules are
         enforced by the tool if your facilities and demand points are in
         multiple time zones:        Time Zone for Time of DayAll facilities
         must be in the same time zone when specifying a time of
         day and travel is from facility to demand.All demand points must be in
         the same time zone when specifying a time
         of day and travel is from demand to facility.
     UTurn_at_Junctions {String}:
         Specifies the U-turn policy at junctions. Allowing U-turns implies the
         solver can turn around at a junction and double back on the same
         street. Given that junctions represent street intersections and dead
         ends, different vehicles may be able to turn around at some junctions
         but not at others-it depends on whether the junction represents an
         intersection or dead end. To accommodate this, the U-turn policy
         parameter is implicitly specified by the number of edges that connect
         to the junction, which is known as junction valency. The acceptable
         values for this parameter are listed below; each is followed by a
         description of its meaning in terms of junction
         valency.Allowed-U-turns are permitted at junctions with any number of
         connected edges. This is the default value. Not
         Allowed-U-turns are prohibited at all junctions,
         regardless of junction valency. However, U-turns are still permitted
         at network locations even when this option is chosen, but you can set
         the individual network locations'attribute to prohibit U-turns there
         as well. CurbApproachAllowed Only at Dead Ends-U-turns are
         prohibited at all junctions
         except those that have only one adjacent edge (a dead end).Allowed
         Only at Intersections and Dead Ends-U-turns are prohibited at
         junctions where exactly two adjacent edges meet but are permitted at
         intersections (junctions with three or more adjacent edges) and dead
         ends (junctions with exactly one adjacent edge). Often, networks have
         extraneous junctions in the middle of road segments. This option
         prevents vehicles from making U-turns at these locations. This
         parameter is ignored unlessis set to. Travel
         ModeCustom
     Point_Barriers {Feature Set}:
         Use this parameter to specify one or more points that will act as
         temporary restrictions or represent additional time or distance that
         may be required to travel on the underlying streets. For example, a
         point barrier can be used to represent a fallen tree along a street or
         a time delay spent at a railroad crossing.The tool imposes a limit of
         250 points that can be added as barriers.When specifying point
         barriers, you can set properties for each, such
         as its name or barrier type, using the following attributes:NameThe
         name of the barrier.BarrierTypeSpecifies whether the point barrier
         restricts travel completely or
         adds time or distance when it is crossed. The value for this attribute
         is specified as one of the following integers (use the numeric code,
         not the name in parentheses):0 (Restriction)-Prohibits travel through
         the barrier. The barrier is
         referred to as a restriction point barrier since it acts as a
         restriction. 2 (Added Cost)-Traveling through the barrier
         increases the
         travel time or distance by the amount specified in the,, orfield. This
         barrier type is referred to as an added cost point barrier.
         Additional_TimeAdditional_DistanceAdditionalCostAdditional_Time
         The added travel time when the barrier is traversed. This
         field is applicable only for added-cost barriers and when theparameter
         value is time based. Measurement Units        This field value
         must be greater than or equal to zero, and
         its units must be the same as those specified in theparameter.
         Measurement UnitsAdditional_Distance        The added distance when
         the barrier is traversed. This field
         is applicable only for added-cost barriers and when theparameter value
         is distance based. Measurement Units        The field value
         must be greater than or equal to zero, and its
         units must be the same as those specified in theparameter.
         Measurement UnitsAdditionalCost        The added cost when the barrier
         is traversed. This field is
         applicable only for added-cost barriers when theparameter value is
         neither time based nor distance based. Measurement
         UnitsFullEdgeSpecifies how the restriction point barriers are applied
         to the edge
         elements during the analysis. The field value is specified as one of
         the following integers (use the numeric code, not the name in
         parentheses):0 (False)-Permits travel on the edge up to the barrier
         but not through
         it. This is the default value.1 (True)-Restricts travel anywhere on
         the associated edge.CurbApproachSpecifies the direction of traffic
         that is affected by the barrier.
         The field value is specified as one of the following integers (use the
         numeric code, not the name in parentheses):0 (Either side of
         vehicle)-The barrier affects travel over the edge in
         both directions.1 (Right side of vehicle)-Vehicles are only affected
         if the barrier is
         on their right side during the approach. Vehicles that traverse the
         same edge but approach the barrier on their left side are not affected
         by the barrier.2 (Left side of vehicle)-Vehicles are only affected if
         the barrier is
         on their left side during the approach. Vehicles that traverse the
         same edge but approach the barrier on their right side are not
         affected by the barrier.Because junctions are points and don't have a
         side, barriers on
         junctions affect all vehicles regardless of the curb approach.
         Theattribute works with both types of national driving
         standards: right-hand traffic (United States) and left-hand traffic
         (United Kingdom). First, consider a facility on the left side of a
         vehicle. It is always on the left side regardless of whether the
         vehicle travels on the left or right half of the road. What may change
         with national driving standards is your decision to approach a
         facility from one of two directions, that is, so it ends up on the
         right or left side of the vehicle. For example, to arrive at a
         facility and not have a lane of traffic between the vehicle and the
         facility, choose 1 (Right side of vehicle) in the United States and 2
         (Left side of vehicle) in the United Kingdom.
         CurbApproachBearing        The direction in which a point is moving.
         The units are
         degrees and are measured clockwise from true north. This field is used
         in conjunction with thefield. BearingTolBearing data is usually
         sent automatically from a mobile device
         equipped with a GPS receiver. Try to include bearing data if you are
         loading an input location that is moving, such as a pedestrian or a
         vehicle.Using this field tends to prevent adding locations to the
         wrong edges,
         which can occur when a vehicle is near an intersection or an overpass,
         for example. Bearing also helps the tool determine on which side of
         the street the point is.BearingTol        The bearing tolerance value
         creates a range of acceptable
         bearing values when locating moving points on an edge using thefield.
         If thefield value is within the range of acceptable values that are
         generated from the bearing tolerance on an edge, the point can be
         added as a network location there; otherwise, the closest point on the
         next-nearest edge is evaluated. BearingBearingThe units are in
         degrees, and the default value is 30. Values must be
         greater than 0 and less than 180. A value of 30 means that when
         Network Analyst attempts to add a network location on an edge, a range
         of acceptable bearing values is generated 15 degrees to either side of
         the edge (left and right) and in both digitized directions of the
         edge.NavLatency        This field is only used in the solve process if
         theandfields
         also have values; however, entering afield value is optional, even
         when values are present inand.indicates how much cost is expected to
         elapse from the moment GPS information is sent from a moving vehicle
         to a server and the moment the processed route is received by the
         vehicle's navigation device.
         BearingBearingTolNavLatencyBearingBearingTolNavLatencyThe units of
         NavLatency are the same as the units of the impedance
         attribute.
     Line_Barriers {Feature Set}:
         Use this parameter to specify one or more lines that prohibit travel
         anywhere the lines intersect the streets. For example, a parade or
         protest that blocks traffic across several street segments can be
         modeled with a line barrier. A line barrier can also quickly fence off
         several roads from being traversed, thereby channeling possible routes
         away from undesirable parts of the street network. The tool
         imposes a limit on the number of streets you can
         restrict using theparameter. While there is no limit to the number of
         lines you can specify as line barriers, the combined number of streets
         intersected by all the lines cannot exceed 500. Line
         BarriersWhen specifying the line barriers, you can set name and
         barrier type
         properties for each using the following attributes:NameThe name of the
         barrier.
     Polygon_Barriers {Feature Set}:
         Use this parameter to specify polygons that either completely restrict
         travel or proportionately scale the time or distance required to
         travel on the streets intersected by the polygons. The service
         imposes a limit on the number of streets you can
         restrict using theparameter. While there is no limit to the number of
         polygons you can specify as polygon barriers, the combined number of
         streets intersected by all the polygons cannot exceed 2,000.
         Polygon BarriersWhen specifying the polygon barriers, you can set
         properties for each,
         such as its name or barrier type, using the following
         attributes:NameThe name of the barrier.BarrierTypeSpecifies whether
         the barrier restricts travel completely or scales
         the cost (such as time or distance) for traveling through it. The
         field value is specified as one of the following integers (use the
         numeric code, not the name in parentheses):0 (Restriction)-Prohibits
         traveling through any part of the barrier.
         The barrier is referred to as a restriction polygon barrier since it
         prohibits traveling on streets intersected by the barrier. One use of
         this type of barrier is to model floods covering areas of the street
         that make traveling on those streets impossible. 1 (Scaled
         Cost)-Scales the cost (such as travel time or
         distance) required to travel the underlying streets by a factor
         specified using theorfield. If the streets are partially covered by
         the barrier, the travel time or distance is apportioned and then
         scaled. For example, a factor of 0.25 means that travel on underlying
         streets is expected to be four times faster than normal. A factor of
         3.0 means it is expected to take three times longer than normal to
         travel on underlying streets. This barrier type is referred to as a
         scaled-cost polygon barrier. It can be used to model storms that
         reduce travel speeds in specific regions, for example.
         ScaledTimeFactorScaledDistanceFactorScaledTimeFactorThis is the factor
         by which the travel time of the streets intersected
         by the barrier is multiplied. The field value must be greater than
         zero. This field is applicable only for scaled-cost barriers
         and
         when theparameter is time-based. Measurement
         UnitsScaledDistanceFactorThis is the factor by which the distance of
         the streets intersected by
         the barrier is multiplied. The field value must be greater than zero.
         This field is applicable only for scaled-cost barriers and
         when theparameter is distance-based. Measurement
         UnitsScaledCostFactorThis is the factor by which the cost of the
         streets intersected by the
         barrier is multiplied. The field value must be greater than zero.
         This field is applicable only for scaled-cost barriers when
         theparameter is neither time-based nor distance-based.
         Measurement Units
     Use_Hierarchy {Boolean}:
         Specifies whether hierarchy will be used when finding the shortest
         path between facilities and demand points.Checked (True)-Hierarchy
         will be used when measuring between
         facilities and demand points. When hierarchy is used, the tool prefers
         higher-order streets (such as freeways) to lower-order streets (such
         as local roads) and can be used to simulate the driver preference of
         traveling on freeways instead of local roads even if that means a
         longer trip. This is especially true when finding routes to faraway
         locations, because drivers on long-distance trips tend to prefer
         traveling on freeways where stops, intersections, and turns can be
         avoided. Using hierarchy is computationally faster, especially for
         long-distance routes, since the tool can determine the best route from
         a relatively smaller subset of streets.Unchecked (False)-Hierarchy
         will not be used when measuring between
         facilities and demand points. If hierarchy is not used, the tool
         considers all streets and doesn't prefer higher-order streets when
         finding the route. This is often used when finding short-distance
         routes within a city.The tool automatically reverts to using hierarchy
         if the straight-line
         distance between facilities and demand points is greater than 50
         miles, even if you set this parameter to not use hierarchy.
     Restrictions {String}:
         Specifies which restrictions will be honored by the tool when finding
         the best routes between facilities and demand points.A restriction
         represents a driving preference or requirement. In most
         cases, restrictions cause roads to be prohibited. For instance, using
         the Avoid Toll Roads restriction will result in a route that will
         include toll roads only when it is required to travel on toll roads to
         visit an incident or a facility. Height Restriction makes it possible
         to route around any clearances that are lower than the height of the
         vehicle. If you are carrying corrosive materials on the vehicle, using
         the Any Hazmat Prohibited restriction prevents hauling the materials
         along roads where it is marked illegal to do so. Some
         restrictions require an additional value to be specified
         for their use. This value must be associated with the restriction name
         and a specific parameter intended to work with the restriction. You
         can identify such restrictions if their names appear in the
         AttributeName column of theparameter. Specify thefield for
         theparameter for the restriction to be correctly used when finding
         traversable roads. Attribute Parameter
         ValuesParameterValueAttribute Parameter Values         Some
         restrictions are supported only in certain countries;
         their availability is stated by region in the list below. Of the
         restrictions that have limited availability within a region, you can
         determine whether the restriction is available in a particular country
         by reviewing the table in the Country list section of Network analysis
         coverage. If a country has a value ofin the Logistics Attribute
         column, the restriction with select availability in the region is
         supported in that country. If you specify restriction names that are
         not available in the country where the incidents are located, the
         service ignores the invalid restrictions. The service also ignores
         restrictions when theattribute parameter value is between 0 and 1 (see
         theparameter). It prohibits all restrictions when theparameter value
         is greater than 0. YesRestriction UsageAttribute Parameter
         ValueRestriction Usage        The values you provide for this
         parameter are ignored unlessis
         set to. Travel ModeCustomThe service supports the following
         restrictions:         Any Hazmat Prohibited-The results will not
         include roads
         where transporting any kind of hazardous material is prohibited.
         Availability: Select countries in North America and Europe
         Avoid Carpool Roads-The results will avoid roads that are
         designated exclusively for car pool (high-occupancy) vehicles.
         Availability: All countries         Avoid Express Lanes-The results
         will avoid roads designated
         as express lanes. Availability: All countries         Avoid
         Ferries-The results will avoid ferries.
         Availability: All countries         Avoid Gates-The results will avoid
         roads where there are
         gates, such as keyed access or guard-controlled entryways.
         Availability: All countries         Avoid Limited Access Roads-The
         results will avoid roads that
         are limited-access highways. Availability: All countries
         Avoid Private Roads-The results will avoid roads that are not
         publicly owned and maintained. Availability: All countries
         Avoid Roads Unsuitable for Pedestrians-The results will avoid
         roads that are unsuitable for pedestrians. Availability: All
         countries         Avoid Stairways-The results will avoid all stairways
         on a
         pedestrian-suitable route. Availability: All countries
         Avoid Toll Roads-The results will avoid all toll roads for
         automobiles. Availability: All countries         Avoid Toll
         Roads for Trucks-The results will avoid all toll
         roads for trucks. Availability: All countries         Avoid
         Truck Restricted Roads-The results will avoid roads
         where trucks are not allowed, except when making deliveries.
         Availability: All countries         Avoid Unpaved Roads-The results
         will avoid roads that are not
         paved (for example, dirt, gravel, and so on). Availability:
         All countries         Axle Count Restriction-The results will not
         include roads
         where trucks with the specified number of axles are prohibited. The
         number of axles can be specified using the Number of Axles restriction
         parameter. Availability: Select countries in North America and
         Europe         Driving a Bus-The results will not include roads where
         buses
         are prohibited. Using this restriction will also ensure that the
         results will honor one-way streets. Availability: All
         countries         Driving a Taxi-The results will not include roads
         where taxis
         are prohibited. Using this restriction will also ensure that the
         results will honor one-way streets. Availability: All
         countries         Driving a Truck-The results will not include roads
         where
         trucks are prohibited. Using this restriction will also ensure that
         the results will honor one-way streets. Availability: All
         countries         Driving an Automobile-The results will not include
         roads
         where automobiles are prohibited. Using this restriction will also
         ensure that the results will honor one-way streets.
         Availability: All countries         Driving an Emergency Vehicle-The
         results will not include
         roads where emergency vehicles are prohibited. Using this restriction
         will also ensure that the results will honor one-way streets.
         Availability: All countries         Height Restriction-The results
         will not include roads where
         the vehicle height exceeds the maximum allowed height for the road.
         The vehicle height can be specified using the Vehicle Height (meters)
         restriction parameter. Availability: Select countries in North
         America and Europe         Kingpin to Rear Axle Length Restriction-The
         results will not
         include roads where the vehicle length exceeds the maximum allowed
         kingpin to rear axle for all trucks on the road. The length between
         the vehicle kingpin and the rear axle can be specified using the
         Vehicle Kingpin to Rear Axle Length (meters) restriction parameter.
         Availability: Select countries in North America and Europe
         Length Restriction-The results will not include roads where
         the vehicle length exceeds the maximum allowed length for the road.
         The vehicle length can be specified using the Vehicle Length (meters)
         restriction parameter. Availability: Select countries in North
         America and Europe         Preferred for Pedestrians-The results will
         use preferred
         routes suitable for pedestrian navigation. Availability:
         Select countries in North America and Europe         Riding a
         Motorcycle-The results will not include roads where
         motorcycles are prohibited. Using this restriction will also ensure
         that the results will honor one-way streets. Availability: All
         countries         Roads Under Construction Prohibited-The results will
         not
         include roads that are under construction. Availability: All
         countries         Semi or Tractor with One or More Trailers
         Prohibited-The
         results will not include roads where semis or tractors with one or
         more trailers are prohibited. Availability: Select countries
         in North America and Europe         Single Axle Vehicles
         Prohibited-The results will not include
         roads where vehicles with single axles are prohibited.
         Availability: Select countries in North America and Europe
         Tandem Axle Vehicles Prohibited-The results will not include
         roads where vehicles with tandem axles are prohibited.
         Availability: Select countries in North America and Europe
         Through Traffic Prohibited-The results will not include roads
         where through traffic (nonlocal) is prohibited. Availability:
         All countries         Truck with Trailers Restriction-The results will
         not include
         roads where trucks with the specified number of trailers on the truck
         are prohibited. The number of trailers on the truck can be specified
         using the Number of Trailers on Truck restriction parameter.
         Availability: Select countries in North America and Europe         Use
         Preferred Hazmat Routes-The results will prefer roads
         that are designated for transporting any kind of hazardous materials.
         Availability: Select countries in North America and Europe         Use
         Preferred Truck Routes-The results will prefer roads that
         are designated as truck routes, such as the roads that are part of the
         national network as specified by the National Surface Transportation
         Assistance Act in the United States, or roads that are designated as
         truck routes by the state or province, or roads that are preferred by
         truckers when driving in an area. Availability: Select
         countries in North America and Europe         Walking-The results will
         not include roads where pedestrians
         are prohibited. Availability: All countries         Weight
         Restriction-The results will not include roads where
         the vehicle weight exceeds the maximum allowed weight for the road.
         The vehicle weight can be specified using the Vehicle Weight
         (kilograms) restriction parameter. Availability: Select
         countries in North America and Europe         Weight per Axle
         Restriction-The results will not include
         roads where the vehicle weight per axle exceeds the maximum allowed
         weight per axle for the road. The vehicle weight per axle can be
         specified using the Vehicle Weight per Axle (kilograms) restriction
         parameter. Availability: Select countries in North America and
         Europe         Width Restriction-The results will not include roads
         where
         the vehicle width exceeds the maximum allowed width for the road. The
         vehicle width can be specified using the Vehicle Width (meters)
         restriction parameter. Availability: Select countries in North
         America and Europe
     Attribute_Parameter_Values {Record Set}:
         Use this parameter to specify additional values required by an
         attribute or restriction, such as to specify whether the restriction
         prohibits, avoids, or prefers travel on restricted roads. If the
         restriction is meant to avoid or prefer roads, you can further specify
         the degree to which they are avoided or preferred using this
         parameter. For example, you can choose to never use toll roads, avoid
         them as much as possible, or prefer them. The values you
         provide for this parameter are ignored unlessis
         set to. Travel ModeCustom        If you specify theparameter
         from a feature class, the field
         names on the feature class must match the fields as follows:
         Attribute Parameter ValuesAttributeName-The name of the restriction.
         ParameterName-The
         name of the parameter associated with the
         restriction. A restriction can have one or morefield values based on
         its intended use. ParameterName          ParameterValue-The
         value forused by the tool when evaluating
         the restriction. ParameterName        Theparameter is
         dependent on theparameter. Thefield is
         applicable only if the restriction name is specified as the value for
         theparameter. Attribute Parameter
         ValuesRestrictionsParameterValueRestrictions        In, each
         restriction (listed as) has afield value, Restriction
         Usage, that specifies whether the restriction prohibits, avoids, or
         prefers travel on the roads associated with the restriction as well as
         the degree to which the roads are avoided or preferred. The
         Restriction Usagecan be assigned any of the following string values or
         their equivalent numeric values listed in the parentheses:
         Attribute Parameter
         ValuesAttributeNameParameterNameParameterNamePROHIBITED (-1)-Travel on
         the roads using the restriction is
         completely prohibited.AVOID_HIGH (5)-It is highly unlikely the tool
         will include in the
         route the roads that are associated with the restriction.AVOID_MEDIUM
         (2)-It is unlikely the tool will include in the route the
         roads that are associated with the restriction.AVOID_LOW (1.3)-It is
         somewhat unlikely the tool will include in the
         route the roads that are associated with the restriction.PREFER_LOW
         (0.8)-It is somewhat likely the tool will include in the
         route the roads that are associated with the restriction.PREFER_MEDIUM
         (0.5)-It is likely the tool will include in the route
         the roads that are associated with the restriction.PREFER_HIGH
         (0.2)-It is highly likely the tool will include in the
         route the roads that are associated with the restriction.In most
         cases, you can use the default value, PROHIBITED, as the
         Restriction Usage value if the restriction is dependent on a vehicle
         characteristic such as vehicle height. However, in some cases, the
         Restriction Usage value depends on your routing preferences. For
         example, the Avoid Toll Roads restriction has the default value of
         AVOID_MEDIUM for the Restriction Usage attribute. This means that when
         the restriction is used, the tool will route around toll roads when it
         can. AVOID_MEDIUM also indicates how important it is to avoid toll
         roads when finding the best route; it has a medium priority. Choosing
         AVOID_LOW puts lower importance on avoiding tolls; choosing AVOID_HIGH
         instead gives it a higher importance and makes it more acceptable for
         the service to generate longer routes to avoid tolls. Choosing
         PROHIBITED entirely disallows travel on toll roads, making it
         impossible for a route to travel on any portion of a toll road. Keep
         in mind that avoiding or prohibiting toll roads, and avoiding toll
         payments, is the objective for some. In contrast, others prefer to
         drive on toll roads, because avoiding traffic is more valuable to them
         than the money spent on tolls. In the latter case, choose PREFER_LOW,
         PREFER_MEDIUM, or PREFER_HIGH as the value for Restriction Usage. The
         higher the preference, the farther the tool will go to travel on the
         roads associated with the restriction.
     Allocation_Line_Shape {String}:
         Specifies the type of line features that are output by the tool. The
         parameter accepts one of the following values:Straight Line-Straight
         lines between solution facilities and the
         demand points allocated to them will be returned. This is the default.
         Drawing straight lines on a map helps you visualize how demand is
         allocated.None-A table containing data about the shortest paths
         between solution
         facilities and the demand points allocated to them will be returned
         but lines will not. No matter which value you choose for
         theparameter, the
         shortest route is always determined by minimizing the travel time or
         the travel distance, never using the straight-line distance between
         demand points and facilities. That is, this parameter only changes the
         output line shapes; it doesn't change the measurement method.
         Allocation Line Shape
     Travel_Mode {String}:
         The mode of transportation to model in the analysis. Travel modes are
         managed in ArcGIS Online and can be configured by the administrator of
         your organization to reflect The organization's workflows. Specify the
         name of a travel mode that is supported by your organization.
         To get a list of supported travel mode names, run the Get
         Travel Modes tool from the Utilities toolbox under the same GIS server
         connection you used to access the tool. The Get Travel Modes tool adds
         the Supported Travel Modes table to the application. Any value in
         thefield from the Supported Travel Modes table can be specified as
         input. You can also specify the value from thefield as input. This
         speeds up tool operation, as the tool does not have to find the
         settings based on the travel mode name. Travel Mode NameTravel
         Mode Settings        The default value,, allows you to configure a
         custom travel
         mode using the custom travel mode parameters (,,,, and). The default
         values of the custom travel mode parameters model traveling by car.
         You can also chooseand set the custom travel mode parameters listed
         above to model a pedestrian with a fast walking speed or a truck with
         a given height, weight, and cargo of certain hazardous materials. You
         can try different settings to get the analysis results you want. Once
         you have identified the analysis settings, work with your
         organization's administrator and save these settings as part of a new
         or existing travel mode so that everyone in your organization can run
         the analysis with the same settings. CustomUTurn at
         JunctionsUse HierarchyRestrictionsAttribute Parameter
         ValuesImpedanceCustom        When you choose, the values you set for
         the custom travel mode
         parameters are included in the analysis. Specifying another travel
         mode, as defined by your organization, causes any values you set for
         the custom travel mode parameters to be ignored; the tool overrides
         them with values from the specified travel mode. Custom
     Impedance {String}:
         Specifies the impedance, which is a value that represents the effort
         or cost of traveling along road segments or on other parts of the
         transportation network.Travel time is an impedance: a car may take 1
         minute to travel a mile
         along an empty road. Travel times can vary by travel mode-a pedestrian
         may take more than 20 minutes to walk the same mile, so it is
         important to choose the right impedance for the travel mode you are
         modeling.Travel distance can also be an impedance; the length of a
         road in
         kilometers can be thought of as impedance. Travel distance in this
         sense is the same for all modes-a kilometer for a pedestrian is also a
         kilometer for a car. (What may change is the pathways on which the
         different modes are allowed to travel, which affects distance between
         points, and this is modeled by travel mode settings.)        The value
         you provide for this parameter is ignored unlessis
         set to, which is the default value. Travel ModeCustom
         TravelTime-Historical and live traffic data is used. This
         option is good for modeling the time it takes automobiles to travel
         along roads at a specific time of day using live traffic speed data
         where available. When using, you can optionally set the
         TravelTime::Vehicle Maximum Speed (km/h) attribute parameter to
         specify the physical limitation of the speed the vehicle is capable of
         traveling. TravelTimeMinutes-Live traffic data is not used,
         but historical average speeds
         for automobiles data is used. TruckTravelTime-Historical and
         live traffic data is used, but
         the speed is capped at the posted truck speed limit. This is good for
         modeling the time it takes for the trucks to travel along roads at a
         specific time. When using, you can optionally set the
         TruckTravelTime::Vehicle Maximum Speed (km/h) attribute parameter to
         specify the physical limitation of the speed the truck is capable of
         traveling. TruckTravelTimeTruckMinutes-Live traffic data is
         not used, but the smaller of the
         historical average speeds for automobiles and the posted speed limits
         for trucks is used.WalkTime-The default is a speed of 5 km/hr on all
         roads and paths, but
         this can be configured through the WalkTime::Walking Speed (km/h)
         attribute parameter.Miles-Length measurements along roads are stored
         in miles and can be
         used for performing analysis based on shortest
         distance.Kilometers-Length measurements along roads are stored in
         kilometers
         and can be used for performing analysis based on shortest
         distance.TimeAt1KPH-The default is a speed of 1 km/hr on all roads and
         paths.
         The speed cannot be changed using any attribute parameter.Drive
         Time-Travel times for a car are modeled. These travel times are
         dynamic and fluctuate according to traffic flows in areas where
         traffic data is available. This is the default value.Truck Time-Travel
         times for a truck are modeled. These travel times
         are static for each road and don't fluctuate with traffic.Walk
         Time-Travel times for a pedestrian are modeled. Travel
         Distance-Length measurements along roads and paths are
         stored. To model walk distance, choose this option and ensure thatis
         set for theparameter. Similarly, to model drive or truck distance,
         choosehere and set the appropriate restrictions so the vehicle travels
         only on roads where it is permitted to do so.
         WalkingRestrictionTravel Distance        If you choose a time-based
         impedance, such as,,,, or,
         theparameter must be set to a time-based value. If you choose a
         distance-based impedance, such asor,must be distance based.
         TravelTimeTruckTravelTimeMinutesTruckMinutesWalkTimeMeasurement
         UnitsMilesKilometersMeasurement Units        ,,, andimpedance values
         are no longer supported and will be
         removed in a future release. If you use one of these values, the tool
         uses the value of theparameter for time-based values and theparameter
         for distance-based values. Drive TimeTruck TimeWalk TimeTravel
         DistanceTime ImpedanceDistance Impedance
     Save_Output_Network_Analysis_Layer {Boolean}:
         Specifies whether the analysis settings will be saved as a network
         analysis layer file. You cannot directly work with this file even when
         you open the file in an ArcGIS Desktop application such as ArcMap. It
         is meant to be sent to Esri Technical Support to diagnose the quality
         of results returned from the tool. Checked (True in
         Python)-The output will be saved as a
         network analysis layer file. The file will be downloaded to a
         temporary directory on your machine. In ArcGIS Pro, the location of
         the downloaded file can be determined by viewing the value for
         theparameter in the entry corresponding to the tool service in the
         geoprocessing history of the project. In ArcMap, the location of the
         file can be determined by accessing theoption in the shortcut menu of
         theparameter in the entry corresponding to the tool service in
         thewindow. Output Network Analysis LayerCopy LocationOutput
         Network Analysis LayerGeoprocessing ResultsUnchecked (False in
         Python)-The output will not be saved as a network
         analysis layer file. This is the default.
     Overrides {String}:
         This parameter is for internal use only.
     Time_Impedance {String}:
         If the impedance for the travel mode, as specified using
         theparameter, is time based, the values for theandparameters must be
         identical. Otherwise, the service will return an error. The
         time-based impedance value represents the travel time along road
         segments or on other parts of the transportation network.ImpedanceTime
         ImpedanceImpedanceMinutes-Time impedance will be
         minutes.TravelTime-Time impedance will
         be travel time.TimeAt1KPH-Time impedance will be time at one kilometer
         per hour.WalkTime-Time impedance will be walk time.TruckMinutes-Time
         impedance will be truck minutes.TruckTravelTime-Time impedance will be
         truck travel time.
     Distance_Impedance {String}:
         If the impedance for the travel mode, as specified using
         theparameter, is distance based, the values for theandparameters must
         be identical. Otherwise, the service will return an error. The
         distance-based impedance value represents the travel distance
         along road segments or on other parts of the transportation
         network.ImpedanceDistance ImpedanceImpedanceMiles-Distance impedance
         will be miles.Kilometers-Distance impedance
         will be kilometers.
     Output_Format {String}:
         Specifies the format in which the output features will be
         returned.Feature Set-The output features will be returned as feature
         classes
         and tables. This is the default.JSON File-The output features will be
         returned as a compressed file
         containing the JSON representation of the outputs. When this option is
         specified, the output is a single file (with a .zip extension) that
         contains one or more JSON files (with a .json extension) for each of
         the outputs created by the service.GeoJSON File-The output features
         will be returned as a compressed file
         containing the GeoJSON representation of the outputs. When this option
         is specified, the output is a single file (with a .zip extension) that
         contains one or more GeoJSON files (with a .geojson extension) for
         each of the outputs created by the service. When a file-based
         output format, such asor, is specified, no
         outputs will be added to the display because the application, such as
         ArcMap or ArcGIS Pro, cannot draw the contents of the result file.
         Instead, the result file is downloaded to a temporary directory on
         your machine. In ArcGIS Pro, the location of the downloaded file can
         be determined by viewing the value for theparameter in the entry
         corresponding to the tool operation in the geoprocessing history of
         the project. In ArcMap, the location of the file can be determined by
         accessing theoption in the shortcut menu of theparameter in the entry
         corresponding to the tool operation in thewindow. JSON
         FileGeoJSON FileOutput Result FileCopy LocationOutput Result
         FileGeoprocessing Results
     Ignore_Invalid_Locations {Boolean}:
         Specifies whether invalid input locations will be ignored.SKIP-Network
         locations that are unlocated will be ignored and the
         analysis will run using valid network locations only. The analysis
         will also continue if locations are on nontraversable elements or have
         other errors. This is useful if you know the network locations are not
         all correct, but you want to run the analysis with the network
         locations that are valid. This is the default.HALT-Invalid locations
         will not be ignored. Do not run the analysis if
         there are invalid locations. Correct the invalid locations and rerun
         the analysis.
     Locate_Settings {String}:
         Use this parameter to specify settings that affect how inputs are
         located, such as the maximum search distance to use when locating the
         inputs on the network or the network sources being used for locating.
         The locator JSON object has the following
         properties:Currently, you can't specify different source names for the
         sources array. Also, allowAutoRelocate is always set to true since the
         service does not support location fields. tolerance
         and toleranceUnits-Allows you to control the
         maximum search distance when locating inputs. If no valid network
         location is found within this distance, the input features will be
         considered unlocated. A small search tolerance decreases the
         likelihood of locating on the wrong street but increases the
         likelihood of not finding any valid network location. The
         toleranceUnits parameter value can be specified as one of the
         following values:
         esriCentimetersesriDecimalDegreesesriDecimetersesriFeetesriInchesesriI
         ntFeetesriIntInchesesriIntMilesesriIntNauticalMilesesriIntYardsesriKil
         ometersesriMetersesriMilesesriMillimetersesriNauticalMilesesriYards
         sources-Allows you to control which network source can be
         used for locating. For example, you can configure the analysis to
         locate inputs on streets but not on sidewalks. The list of possible
         sources on which to locate is specific to the network dataset this
         service references. Only the sources that are present in the sources
         array are used for locating. Sources is specified as an array of
         objects each having the following property:          name-The name of
         the network source feature class that can be used for
         locating inputsallowAutoRelocate-Allows you to control whether inputs
         with existing
         network location fields can be automatically relocated when solving to
         ensure valid, routable location fields for the analysis. If the value
         is true, points located on restricted network elements and points
         affected by barriers will be relocated to the closest routable
         location. If the value is false, network location fields will be used
         as is even if the points are unreachable, and this may cause the solve
         to fail. Even if the value is false, inputs with no location fields or
         incomplete location fields will be located during the solve
         operation.The parameter value is specified as a JSON object. The JSON
         object
         allows you to specify a locator JSON for all input feature in the
         analysis, or you can specify an override for a particular input. The
         override allows you to have different settings for each analysis
         input. For example, you can disallow stops to locate on highway ramps
         and allow point barriers to locate on highway ramps. When specifying
         the Locate_Settings JSON, you must provide the tolerance,
         toleranceUnits, and allowAutoRelocate properties. If you need to
         provide a different locator JSON for a particular input class, you
         must include the overrides property for that input. The property name
         must match the input parameter name. The locator JSON for a particular
         input doesn't need to include all the properties; you only need to
         include the properties that are different from the default locator
         JSON properties."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SolveLocationAllocation_agolservices(
                *gp_fixargs(
                    (
                        Facilities,
                        Demand_Points,
                        Measurement_Units,
                        Analysis_Region,
                        Problem_Type,
                        Number_of_Facilities_to_Find,
                        Default_Measurement_Cutoff,
                        Default_Capacity,
                        Target_Market_Share,
                        Measurement_Transformation_Model,
                        Measurement_Transformation_Factor,
                        Travel_Direction,
                        Time_of_Day,
                        Time_Zone_for_Time_of_Day,
                        UTurn_at_Junctions,
                        Point_Barriers,
                        Line_Barriers,
                        Polygon_Barriers,
                        Use_Hierarchy,
                        Restrictions,
                        Attribute_Parameter_Values,
                        Allocation_Line_Shape,
                        Travel_Mode,
                        Impedance,
                        Save_Output_Network_Analysis_Layer,
                        Overrides,
                        Time_Impedance,
                        Distance_Impedance,
                        Output_Format,
                        Ignore_Invalid_Locations,
                        Locate_Settings,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SolveVehicleRoutingProblem_agolservices", None)
def SolveVehicleRoutingProblem(
    orders=None,
    depots=None,
    routes=None,
    breaks=None,
    time_units: Literal["Seconds", "Minutes", "Hours", "Days"] | None = None,
    distance_units: Literal["Meters", "Kilometers", "Feet", "Yards", "Miles", "NauticalMiles"] | None = None,
    analysis_region: Literal[
        "Europe", "Japan", "Korea", "MiddleEastAndAfrica", "NorthAmerica", "SouthAmerica", "SouthAsia", "Thailand"
    ]
    | None = None,
    default_date=None,
    uturn_policy: Literal["ALLOW_UTURNS", "NO_UTURNS", "ALLOW_DEAD_ENDS_ONLY", "ALLOW_DEAD_ENDS_AND_INTERSECTIONS_ONLY"]
    | None = None,
    time_window_factor: Literal["High", "Medium", "Low"] | None = None,
    spatially_cluster_routes=None,
    route_zones=None,
    route_renewals=None,
    order_pairs=None,
    excess_transit_factor: Literal["High", "Medium", "Low"] | None = None,
    point_barriers=None,
    line_barriers=None,
    polygon_barriers=None,
    use_hierarchy_in_analysis=None,
    restrictions: list[
        Literal[
            "Any Hazmat Prohibited",
            "Avoid Carpool Roads",
            "Avoid Express Lanes",
            "Avoid Ferries",
            "Avoid Gates",
            "Avoid Limited Access Roads",
            "Avoid Private Roads",
            "Avoid Roads Unsuitable for Pedestrians",
            "Avoid Stairways",
            "Avoid Toll Roads",
            "Avoid Toll Roads for Trucks",
            "Avoid Truck Restricted Roads",
            "Avoid Unpaved Roads",
            "Axle Count Restriction",
            "Driving a Bus",
            "Driving a Taxi",
            "Driving a Truck",
            "Driving an Automobile",
            "Driving an Emergency Vehicle",
            "Height Restriction",
            "High Speed Roads Restriction",
            "Kingpin to Rear Axle Length Restriction",
            "Length Restriction",
            "Preferred for Pedestrians",
            "Riding a Motorcycle",
            "Roads Under Construction Prohibited",
            "Semi or Tractor with One or More Trailers Prohibited",
            "Single Axle Vehicles Prohibited",
            "Tandem Axle Vehicles Prohibited",
            "Through Traffic Prohibited",
            "Truck with Trailers Restriction",
            "Use Preferred Hazmat Routes",
            "Use Preferred Truck Routes",
            "Walking",
            "Weight Restriction",
            "Weight per Axle Restriction",
            "Width Restriction",
        ]
    ]
    | Literal[
        "Any Hazmat Prohibited",
        "Avoid Carpool Roads",
        "Avoid Express Lanes",
        "Avoid Ferries",
        "Avoid Gates",
        "Avoid Limited Access Roads",
        "Avoid Private Roads",
        "Avoid Roads Unsuitable for Pedestrians",
        "Avoid Stairways",
        "Avoid Toll Roads",
        "Avoid Toll Roads for Trucks",
        "Avoid Truck Restricted Roads",
        "Avoid Unpaved Roads",
        "Axle Count Restriction",
        "Driving a Bus",
        "Driving a Taxi",
        "Driving a Truck",
        "Driving an Automobile",
        "Driving an Emergency Vehicle",
        "Height Restriction",
        "High Speed Roads Restriction",
        "Kingpin to Rear Axle Length Restriction",
        "Length Restriction",
        "Preferred for Pedestrians",
        "Riding a Motorcycle",
        "Roads Under Construction Prohibited",
        "Semi or Tractor with One or More Trailers Prohibited",
        "Single Axle Vehicles Prohibited",
        "Tandem Axle Vehicles Prohibited",
        "Through Traffic Prohibited",
        "Truck with Trailers Restriction",
        "Use Preferred Hazmat Routes",
        "Use Preferred Truck Routes",
        "Walking",
        "Weight Restriction",
        "Weight per Axle Restriction",
        "Width Restriction",
    ]
    | str
    | None = None,
    attribute_parameter_values=None,
    populate_route_lines=None,
    route_line_simplification_tolerance=None,
    populate_directions=None,
    directions_language=None,
    directions_style_name: Literal["NA Desktop", "NA Navigation"] | None = None,
    travel_mode=None,
    impedance: Literal[
        "Drive Time",
        "Truck Time",
        "Walk Time",
        "Minutes",
        "TimeAt1KPH",
        "TravelTime",
        "TruckMinutes",
        "TruckTravelTime",
        "WalkTime",
    ]
    | None = None,
    time_zone_usage_for_time_fields: Literal["GEO_LOCAL", "UTC"] | None = None,
    save_output_layer=None,
    overrides=None,
    save_route_data=None,
    time_impedance: Literal["Minutes", "TimeAt1KPH", "TravelTime", "TruckMinutes", "TruckTravelTime", "WalkTime"]
    | None = None,
    distance_impedance: Literal["Kilometers", "Miles"] | None = None,
    populate_stop_shapes=None,
    output_format: Literal["Feature Set", "JSON File", "GeoJSON File"] | None = None,
    ignore_invalid_order_locations=None,
    locate_settings=None,
) -> Result:
    """SolveVehicleRoutingProblem_agolservices(orders, depots, routes, {breaks}, {time_units}, {distance_units}, {analysis_region}, {default_date}, {uturn_policy}, {time_window_factor}, {spatially_cluster_routes}, {route_zones}, {route_renewals}, {order_pairs}, {excess_transit_factor}, {point_barriers}, {line_barriers}, {polygon_barriers}, {use_hierarchy_in_analysis}, {restrictions;restrictions...}, {attribute_parameter_values}, {populate_route_lines}, {route_line_simplification_tolerance}, {populate_directions}, {directions_language}, {directions_style_name}, {travel_mode}, {impedance}, {time_zone_usage_for_time_fields}, {save_output_layer}, {overrides}, {save_route_data}, {time_impedance}, {distance_impedance}, {populate_stop_shapes}, {output_format}, {ignore_invalid_order_locations}, {locate_settings})

       Solves a vehicle routing problem (VRP) to find the best routes for a
       fleet of vehicles.

    INPUTS:
     orders (Feature Set):
         One or more locations that the routes of the VRP analysis will visit.
         An order can represent a delivery (for example, furniture delivery), a
         pickup (such as an airport shuttle bus picking up a passenger), or
         some type of service or inspection (a tree trimming job or building
         inspection, for example).When specifying the orders, you can set
         properties for each-such as
         its name or service time-using the following attributes:ObjectIDThe
         system-managed ID field.NameThe name of the order. The name must be
         unique. If the name is left
         null, a name is automatically generated at solve time.Description
         The descriptive information about the order. This can contain
         any textual information for the order and has no restrictions for
         uniqueness. You can store a client's ID number in thefield and the
         client's name or address in thefield.
         NameDescriptionServiceTimeThe amount of time that will be spent at the
         network location when the
         route visits it; that is, the impedance value for the network
         location. A zero or null value indicates that the network location
         requires no service time.The unit for this field value is specified by
         the time_units
         parameter.TimeWindowStart1The beginning time of the first time window
         for the network location.
         This field can contain a null value; a null value indicates no
         beginning time. A time window only states when a vehicle can
         arrive at an
         order; it doesn't state when the service time must be completed. To
         account for service time and departure before the time window ends,
         subtract thevalue from thevalue. ServiceTimeTimeWindowEnd1
         The time window fields (,,, and) can contain a time-only value
         or a date and time value in a date field and cannot be integers
         representing milliseconds since epoch. The time zone for time window
         fields is specified using theparameter. If a time field such ashas a
         time-only value (for example, 8:00 a.m.), the date is assumed to be
         the default date set for the analysis. Using date and time values (for
         example, 7/11/2010 8:00 a.m.) allows you to set time windows that span
         multiple days.
         TimeWindowStart1TimeWindowEnd1TimeWindowStart2TimeWindowEnd2Time Zone
         Usage for Time FieldsTimeWindowStart1When solving a problem that spans
         multiple time zones, each order's
         time-window values refer to the time zone in which the order is
         located.TimeWindowEnd1The end time of the first window for the network
         location. This field
         can contain a null value; a null value indicates no end
         time.TimeWindowStart2The beginning time of the second time window for
         the network location.
         This field can contain a null value; a null value indicates that there
         is no second time window. If the first time window is null as
         specified by theandfields,
         the second time window must also be null.
         TimeWindowStart1TimeWindowEnd1If both time windows are not null, they
         can't overlap. Also, the
         second time window must occur after the first.TimeWindowEnd2The end
         time of the second time window for the network location. This
         field can contain a null value. Whenandare both null, there is
         no second time window.
         TimeWindowStart2TimeWindowEnd2        Whenis not null butis null,
         there is a second time window that
         has a start time but no end time. This is valid.
         TimeWindowStart2TimeWindowEnd2MaxViolationTime1A time window is
         considered violated if the arrival time occurs after
         the time window has ended. This field specifies the maximum allowable
         violation time for the first time window of the order. It can contain
         a zero value but can't contain negative values. A zero value indicates
         that a time window violation at the first time window of the order is
         unacceptable; that is, the first time window is hard. Conversely, a
         null value indicates that there is no limit on the allowable violation
         time. A nonzero value specifies the maximum amount of lateness; for
         example, a route can arrive at an order up to 30 minutes beyond the
         end of its first time window. The unit for this field value is
         specified by theparameter
         Time Field UnitsTime window violations can be tracked and weighted by
         the solver.
         Consequently, you can direct the VRP solver to do one of the
         following:Minimize the overall violation time regardless of the
         increase in
         travel cost for the fleet.Find a solution that balances overall
         violation time and travel cost.Ignore the overall violation time and
         minimize the travel cost for the
         fleet. By assigning an importance level for theparameter, you
         are
         essentially choosing one of these options. In any case, however, the
         solver will return an error if the value set foris surpassed.
         Time Window Violation ImportanceMaxViolationTime1MaxViolationTime2
         The maximum allowable violation time for the second time
         window of the order. This field is analogous to thefield.
         MaxViolationTime1InboundArriveTimeDefines when the item to be
         delivered to the order will be ready at
         the starting depot.The order can be assigned to a route only if the
         inbound arrive time
         precedes the route's latest start time value; this way, the route
         cannot leave the depot before the item is ready to be loaded onto
         it.This field can help model scenarios involving inbound-wave
         transshipments. For example, a job at an order requires special
         materials that are not currently available at the depot. The materials
         are being shipped from another location and will arrive at the depot
         at 11:00 a.m. To ensure a route that leaves before the shipment
         arrives isn't assigned to the order, the order's inbound arrive time
         is set to 11:00 a.m. The special materials arrive at 11:00 a.m., they
         are loaded onto the vehicle, and the vehicle departs from the depot to
         visit its assigned orders. Notes:        The route's start
         time, which includes service
         times, must occur after
         the inbound arrive time. If a route begins before an order's inbound
         arrive time, the order cannot be assigned to the route. The assignment
         is invalid even if the route has a start-depot service time that lasts
         until after the inbound arrive time.This time field can contain a
         time-only value or a date and time
         value. If a time-only value is set (for example, 11:00 AM), the date
         is assumed to be the default date set for the analysis. The default
         date is ignored, however, when any time field in Depots, Routes,
         Orders, or Breaks includes a date with the time. In that case, specify
         all such fields with a date and time (for example, 7/11/2015 11:00
         AM). The VRP solver honorsregardless of thevalue.
         InboundArriveTimeDeliveryQuantitiesIf an outbound depart time is also
         specified, its time value must
         occur after the inbound arrive time.OutboundDepartTimeDefines when the
         item to be picked up at the order must arrive at the
         ending depot.The order can be assigned to a route only if the route
         can visit the
         order and reach its end depot before the specified outbound depart
         time.This field can help model scenarios involving outbound-wave
         transshipments. For instance, a shipping company sends out delivery
         trucks to pick up packages from orders and bring them into a depot
         where they are forwarded on to other facilities, en route to their
         final destination. At 3:00 p.m. every day, a semitrailer stops at the
         depot to pick up the high-priority packages and take them directly to
         a central processing station. To avoid delaying the high-priority
         packages until the next day's 3:00 p.m. trip, the shipping company
         tries to have delivery trucks pick up the high-priority packages from
         orders and bring them to the depot before the 3:00 p.m. deadline. This
         is done by setting the outbound depart time to 3:00 p.m. Notes:
         The route's end time, including service times,
         must occur before the
         outbound depart time. If a route reaches a depot but doesn't complete
         its end-depot service time prior to the order's outbound depart time,
         the order cannot be assigned to the route.This time field can contain
         a time-only value or a date and time
         value. If a time-only value is set (for example, 11:00 AM), the date
         is assumed to be the default date set for the analysis. The default
         date is ignored, however, when any time field in Depots, Routes,
         Orders, or Breaks includes a date with the time. In that case, specify
         all such fields with a date and time (for example, 7/11/2015 11:00
         AM). The VRP solver honorsregardless of thevalue.
         OutboundDepartTimePickupQuantitiesIf an inbound arrive time is also
         specified, its time value must occur
         before the outbound depart time.DeliveryQuantitiesThe size of the
         delivery. You can specify size in any dimension, such
         as weight, volume, or quantity. You can also specify multiple
         dimensions, for example, weight and volume.Enter delivery quantities
         without indicating units. For example, if a
         300-pound object needs to be delivered to an order, enter 300. You
         will need to remember that the value is in pounds.If you are tracking
         multiple dimensions, separate the numeric values
         with a space. For example, if you are recording the weight and volume
         of a delivery that weighs 2,000 pounds and has a volume of 100 cubic
         feet, enter 2000 100. Again, you need to remember the units-in this
         case, pounds and cubic feet. You also need to remember the sequence in
         which the values and their corresponding units are entered.
         Ensure that the values forfor Routes andandfor Orders are
         specified in the same manner; that is, the values must be in the same
         units. If you are using multiple dimensions, the dimensions must be
         listed in the same sequence for all parameters. For example, if you
         specify weight in pounds, followed by volume in cubic feet for, the
         capacity of the routes and the pickup quantities of the orders must be
         specified the same way: weight in pounds, then volume in cubic feet.
         If you combine units or change the sequence, unwanted results will
         occur with no warning messages.
         CapacitiesDeliveryQuantitiesPickupQuantitiesDeliveryQuantitiesAn empty
         string or null value is equivalent to all dimensions being
         infinity. If the string has an insufficient number of values in
         relation to the capacity count or dimensions being tracked, the
         remaining values are treated as infinity. Delivery quantities can't be
         negative.PickupQuantities        The size of the pickup. You can
         specify size in any dimension,
         such as weight, volume, or quantity. You can also specify multiple
         dimensions, for example, weight and volume. You cannot, however, use
         negative values. This field is analogous to thefield of Orders.
         DeliveryQuantitiesIn the case of an exchange visit, an order can have
         both delivery and
         pickup quantities.RevenueThe income generated if the order is included
         in a solution. This
         field can contain a null value-a null value indicates zero revenue-but
         it can't have a negative value. Revenue is included in
         optimizing the objective function value
         but is not part of the solution's operating cost; that is, thefield in
         the routes never includes revenue in its output. However, revenue
         weights the relative importance of servicing orders. TotalCost
         Revenue is included in optimizing the objective function value
         but is not part of the solution's operating cost; that is, thefield in
         the route class never includes revenue in its output. However, revenue
         weights the relative importance of servicing orders.
         TotalCostSpecialtyNamesA space-separated string containing the names
         of the specialties
         required by the order. A null value indicates that the order doesn't
         require specialties.The spelling of any specialties listed in the
         Orders and Routes
         classes must match exactly so that the VRP solver can link them
         together. To illustrate what specialties are and how they work,
         a lawn
         care and tree trimming company has a portion of its orders that
         requires a bucket truck to trim tall trees. The company enters
         BucketTruck in thefield for these orders to indicate their special
         need.is left null for the other orders. Similarly, the company also
         enters BucketTruck in thefield of routes that are driven by trucks
         with hydraulic booms. It leaves the field null for the other routes.
         At solve time, the VRP solver assigns orders without special needs to
         any route, but it only assigns orders that need bucket trucks to
         routes that have them.
         SpecialtyNamesSpecialtyNamesSpecialtyNamesAssignmentRuleSpecifies the
         rule for assigning the order to a route. The field value
         is specified as one of the following integers (use the numeric code,
         not the name in parentheses):0 (Exclude)-The order will be excluded
         from the subsequent solve
         operation. 1 (Preserve route and relative sequence)-The
         solver must
         always assign the order to the preassigned route at the preassigned
         relative sequence during the solve operation. If this assignment rule
         can't be followed, it results in an order violation. With this
         setting, only the relative sequence is maintained, not the absolute
         sequence. To illustrate what this means, imagine there are two orders:
         A and B. They have sequence values of 2 and 3, respectively. If you
         set theirfield values to Preserve route and relative sequence, the
         sequence values for A and B may change after solving because other
         orders, breaks, and depot visits can be sequenced before, between, or
         after A and B. However, B cannot be sequenced before A.
         AssignmentRule2 (Preserve route)-The solver must always assign the
         order to the
         preassigned route during the solve operation. A valid sequence must
         also be set even though the sequence may not be preserved. If the
         order can't be assigned to the specified route, it results in an order
         violation.3 (Override)-The solver tries to preserve the route and
         sequence
         preassignment for the order during the solve operation. However, a new
         route or sequence for the order may be assigned if it helps minimize
         the overall value of the objective function. This is the default
         value.4 (Anchor first)-The solver ignores the route and sequence
         preassignment (if any) for the order during the solve operation. It
         assigns a route to the order and makes it the first order on that
         route to minimize the overall value of the objective function.5
         (Anchor last)-The solver ignores the route and sequence
         preassignment (if any) for the order during the solve operation. It
         assigns a route to the order and makes it the last order on that route
         to minimize the overall value of the objective function.This field
         can't contain a null value.CurbApproachSpecifies the direction a
         vehicle may arrive at and depart from the
         order. The field value is specified as one of the following integers
         (use the numeric code, not the name in parentheses):0 (Either side of
         vehicle)-The vehicle can approach and depart the
         order in either direction, so a U-turn is allowed at the order. This
         setting can be chosen if it is possible and practical for a vehicle to
         turn around at the order. This decision may depend on the width of the
         road and the amount of traffic or whether the order has a parking lot
         where vehicles can enter and turn around.1 (Right side of
         vehicle)-When the vehicle approaches and departs the
         order, the order must be on the right side of the vehicle. A U-turn is
         prohibited. This is typically used for vehicles such as buses that
         must arrive with the bus stop on the right-hand side.2 (Left side of
         vehicle)-When the vehicle approaches and departs the
         order, the curb must be on the left side of the vehicle. A U-turn is
         prohibited. This is typically used for vehicles such as buses that
         must arrive with the bus stop on the left-hand side.3 (No U-Turn)-When
         the vehicle approaches the order, the curb can be
         on either side of the vehicle; however, the vehicle must depart
         without turning around. Theattribute is designed to work with
         both national driving
         standards: right-hand traffic (United States) and left-hand traffic
         (United Kingdom). First, consider an order on the left side of a
         vehicle. It is always on the left side regardless of whether the
         vehicle travels on the left or right half of the road. What may change
         with national driving standards is your decision to approach an order
         from one of two directions, that is, so it ends up on the right or
         left side of the vehicle. For example, to arrive at an order and not
         have a lane of traffic between the vehicle and the order, choose 1
         (Right side of vehicle) in the United States and 2 (Left side of
         vehicle) in the United Kingdom. CurbApproachRouteNameThe name
         of the route to which the order is assigned. This field is used
         to preassign an order to a specific route.
         It can contain a null value, indicating that the order is not
         preassigned to any route, and the solver identifies the best possible
         route assignment for the order. If this is set to null, thefield must
         also be set to null. Sequence        After a solve operation,
         if the order is routed, thefield
         contains the name of the route to which the order is assigned.
         RouteNameSequenceThis indicates the sequence of the order on its
         assigned route.This field is used to specify the relative sequence of
         an order on the
         route. This field can contain a null value specifying that the order
         can be placed anywhere along the route.The input sequence values are
         positive and unique for each route
         (shared across renewal depot visits, orders, and breaks) but do not
         need to start from 1 or be contiguous. After a solve operation,
         thefield contains the sequence value
         of the order on its assigned route. Output sequence values for a route
         are shared across depot visits, orders, and breaks; start from 1 (at
         the starting depot); and are consecutive. The smallest possible output
         sequence value for a routed order is 2, since a route always begins at
         a depot. SequenceBearing        The direction in which a point
         is moving. The units are
         degrees and are measured clockwise from true north. This field is used
         in conjunction with thefield. BearingTolBearing data is usually
         sent automatically from a mobile device
         equipped with a GPS receiver. Try to include bearing data if you are
         loading an input location that is moving, such as a pedestrian or a
         vehicle.Using this field tends to prevent adding locations to the
         wrong edges,
         which can occur when a vehicle is near an intersection or an overpass,
         for example. Bearing also helps the tool determine on which side of
         the street the point is.BearingTol        The bearing tolerance value
         creates a range of acceptable
         bearing values when locating moving points on an edge using thefield.
         If thefield value is within the range of acceptable values that are
         generated from the bearing tolerance on an edge, the point can be
         added as a network location there; otherwise, the closest point on the
         next-nearest edge is evaluated. BearingBearingThe units are in
         degrees, and the default value is 30. Values must be
         greater than 0 and less than 180. A value of 30 means that when
         Network Analyst attempts to add a network location on an edge, a range
         of acceptable bearing values is generated 15 degrees to either side of
         the edge (left and right) and in both digitized directions of the
         edge.NavLatency        This field is only used in the solve process if
         theandfields
         also have values; however, entering afield value is optional, even
         when values are present inand.indicates how much cost is expected to
         elapse from the moment GPS information is sent from a moving vehicle
         to a server and the moment the processed route is received by the
         vehicle's navigation device.
         BearingBearingTolNavLatencyBearingBearingTolNavLatencyThe units of
         NavLatency are the same as the units of the impedance
         attribute.
     depots (Feature Set):
         Specifies one or more depots for the given vehicle routing problem. A
         depot is a location that a vehicle departs from at the beginning of
         its workday and returns to at the end of the workday. Vehicles are
         loaded (for deliveries) or unloaded (for pickups) at depots. In some
         cases, a depot can also act as a renewal location where the vehicle
         can unload or reload and continue performing deliveries and pickups. A
         depot has open and close times, as specified by a hard time window.
         Vehicles can't arrive at a depot outside of this time window.When
         specifying the depots, you can set properties for each-such as
         its name or service time-using the following attributes:ObjectIDThe
         system-managed ID field.Name        The name of the depot.
         Theandfields on routes reference the
         names you specify here. It is also referenced by the route renewals,
         when used. StartDepotNameEndDepotNameDepot names are not case
         sensitive but must be unique and not empty.DescriptionThe descriptive
         information about the depot location. This can contain
         any textual information and has no restrictions for uniqueness.
         For example, to note the region a depot is in or the depot's
         address and telephone number, you can enter the information here
         rather than in thefield. NameTimeWindowStart1The beginning time
         of the first time window for the network location.
         This field can contain a null value; a null value indicates no
         beginning time. The time window fields (,,, and) can contain a
         time-only value
         or a date and time value in a date field and cannot be integers
         representing milliseconds since epoch. The time zone for time window
         fields is specified using theparameter. If a time field such ashas a
         time-only value (for example, 8:00 a.m.), the date is assumed to be
         the default date set for the analysis. Using date and time values (for
         example, 7/11/2010 8:00 a.m.) allows you to set time windows that span
         multiple days.
         TimeWindowStart1TimeWindowEnd1TimeWindowStart2TimeWindowEnd2Time Zone
         Usage for Time FieldsTimeWindowStart1When solving a problem that spans
         multiple time zones, each depot's
         time-window values refer to the time zone in which the depot is
         located.TimeWindowEnd1The end time of the first window for the network
         location. This field
         can contain a null value; a null value indicates no end
         time.TimeWindowStart2The beginning time of the second time window for
         the network location.
         This field can contain a null value; a null value indicates that there
         is no second time window. If the first time window is null, as
         specified by
         theandfields, the second time window must also be null.
         TimeWindowStart1TimeWindowEnd1If both time windows are not null, they
         can't overlap. Also, the
         second time window must occur after the first.TimeWindowEnd2The end
         time of the second time window for the network location. This
         field can contain a null value. Whenandare both null, there is
         no second time window.
         TimeWindowStart2TimeWindowEnd2        Whenis not null butis null,
         there is a second time window that
         has a start time but no end time. This is valid.
         TimeWindowStart2TimeWindowEnd2CurbApproach0 (Either side of
         vehicle)-The vehicle can approach and depart the
         depot in either direction, so a U-turn is allowed at the incident.
         This setting can be chosen if it is possible and practical for a
         vehicle to turn around at the depot. This decision may depend on the
         width of the road and the amount of traffic or whether the depot has a
         parking lot where vehicles can enter and turn around.1 (Right side of
         vehicle)-When the vehicle approaches and departs the
         depot, the depot must be on the right side of the vehicle. A U-turn is
         prohibited. This is typically used for vehicles such as buses that
         must arrive with the bus stop on the right-hand side.2 (Left side of
         vehicle)-When the vehicle approaches and departs the
         depot, the curb must be on the left side of the vehicle. A U-turn is
         prohibited. This is typically used for vehicles such as buses that
         must arrive with the bus stop on the left-hand side.3 (No U-Turn)-When
         the vehicle approaches the depot, the curb can be
         on either side of the vehicle; however, the vehicle must depart
         without turning around. Theattribute is designed to work with
         both national driving
         standards: right-hand traffic (United States) and left-hand traffic
         (United Kingdom). First, consider a depot on the left side of a
         vehicle. It is always on the left side regardless of whether the
         vehicle travels on the left or right half of the road. What may change
         with national driving standards is your decision to approach a depot
         from one of two directions, that is, so it ends up on the right or
         left side of the vehicle. For example, to arrive at a depot and not
         have a lane of traffic between the vehicle and the depot, choose 1
         (Right side of vehicle) in the United States and 2 (Left side of
         vehicle) in the United Kingdom. CurbApproachBearing        The
         direction in which a point is moving. The units are
         degrees and are measured clockwise from true north. This field is used
         in conjunction with thefield. BearingTolBearing data is usually
         sent automatically from a mobile device
         equipped with a GPS receiver. Try to include bearing data if you are
         loading an input location that is moving, such as a pedestrian or a
         vehicle.Using this field tends to prevent adding locations to the
         wrong edges,
         which can occur when a vehicle is near an intersection or an overpass,
         for example. Bearing also helps the tool determine on which side of
         the street the point is.BearingTol        The bearing tolerance value
         creates a range of acceptable
         bearing values when locating moving points on an edge using thefield.
         If thefield value is within the range of acceptable values that are
         generated from the bearing tolerance on an edge, the point can be
         added as a network location there; otherwise, the closest point on the
         next-nearest edge is evaluated. BearingBearingThe units are in
         degrees, and the default value is 30. Values must be
         greater than 0 and less than 180. A value of 30 means that when
         Network Analyst attempts to add a network location on an edge, a range
         of acceptable bearing values is generated 15 degrees to either side of
         the edge (left and right) and in both digitized directions of the
         edge.NavLatency        This field is only used in the solve process if
         theandfields
         also have values; however, entering afield value is optional, even
         when values are present inand.indicates how much cost is expected to
         elapse from the moment GPS information is sent from a moving vehicle
         to a server and the moment the processed route is received by the
         vehicle's navigation device.
         BearingBearingTolNavLatencyBearingBearingTolNavLatencyThe units of
         NavLatency are the same as the units of the impedance
         attribute.
     routes (Record Set):
         Specifies one or more routes that describe vehicle and driver
         characteristics. A route can have start and end depot service times, a
         fixed or flexible start time, time-based operating costs, distance-
         based operating costs, multiple capacities, various constraints on a
         driver's workday, and so on.The routes can be specified with the
         following attributes:NameThe name of the route. The name must be
         unique.The tool generates a unique name at solve time if the field
         value is
         null; entering a value is optional in most cases. However, you must
         enter a name if the analysis includes breaks, route renewals, route
         zones, or orders that are preassigned to a route because the route
         name is used as a foreign key in these cases. Route names are not case
         sensitive.StartDepotName        The name of the starting depot for the
         route. This field is a
         foreign key to thefield in Depots. Name        If thevalue is
         null, the route will begin from the first order
         assigned. Omitting the start depot is useful when the vehicle's
         starting location is unknown or irrelevant to the routing problem.
         However, whenis null,cannot also be null.
         StartDepotNameStartDepotNameEndDepotNameVirtual start depots are not
         allowed if orders or depots are in
         multiple time zones. If the route is making deliveries andis
         null, it is assumed
         that the cargo is loaded on the vehicle at a virtual depot before the
         route begins. For a route that has no renewal visits, its delivery
         orders (those with nonzerovalues in Orders) are loaded at the start
         depot or virtual depot. For a route that has renewal visits, only the
         delivery orders before the first renewal visit are loaded at the start
         depot or virtual depot.
         StartDepotNameDeliveryQuantitiesEndDepotName        The name of the
         ending depot for the route. This field is a
         foreign key to thefield in Depots. NameStartDepotServiceTimeThe
         service time at the starting depot. This can be used to model the
         time spent loading the vehicle. This field can contain a null value; a
         null value indicates zero service time. The unit for this field
         value is specified by theparameter.
         Time Field Units        The service times at the start and end depots
         are fixed values
         (theandfield values) and do not take into account the actual load for
         a route. For example, the time taken to load a vehicle at the starting
         depot may depend on the size of the orders. The depot service times
         can be assigned values corresponding to a full truckload or an average
         truckload, or you can make a time estimate.
         StartDepotServiceTimeEndDepotServiceTimeEndDepotServiceTimeThe service
         time at the ending depot. This can be used to model the
         time spent unloading the vehicle. This field can contain a null value;
         a null value indicates zero service time. The unit for this
         field value is specified by theparameter.
         Time Field Units        The service times at the start and end depots
         are fixed values
         (theandfield values) and do not take into account the actual load for
         a route. For example, the time taken to load a vehicle at the starting
         depot may depend on the size of the orders. The depot service times
         can be assigned values corresponding to a full truckload or an average
         truckload, or you can make a time estimate.
         StartDepotServiceTimeEndDepotServiceTimeEarliestStartTimeThe earliest
         allowable start time for the route. This is used by the
         solver in conjunction with the time window of the starting depot for
         determining feasible route start times.This field can't contain null
         values and has a default time-only value
         of 8:00 AM. The default value is interpreted as 8:00 a.m. on the
         default date set for the analysis. When solving a problem that
         spans multiple time zones, the
         time zone foris the same as the time zone in which the starting depot
         is located. EarliestStartTimeLatestStartTimeThe latest
         allowable start time for the route.This field can't contain null
         values and has a default time-only value
         of 10:00 AM. The default value is interpreted as 10:00 a.m. on the
         default date set for the analysis. When solving a problem that
         spans multiple time zones, the
         time zone foris the same as the time zone in which the starting depot
         is located. LatestStartTimeArriveDepartDelay        This field
         stores the amount of travel time needed to
         accelerate the vehicle to normal travel speeds, decelerate it to a
         stop, and move it off and on the network (for example, in and out of
         parking). By including anvalue, the VRP solver is deterred from
         sending many routes to service physically coincident orders.
         ArriveDepartDelay        The cost for this property is incurred
         between visits to
         noncoincident orders, depots, and route renewals. For example, when a
         route starts from a depot and visits the first order, the total
         arrive/depart delay is added to the travel time. The same is true when
         traveling from the first order to the second order. If the second and
         third orders are coincident, thevalue is not added between them since
         the vehicle doesn't need to move. If the route travels to a route
         renewal, the value is added to the travel time again.
         ArriveDepartDelay        Although a vehicle must slow down and stop
         for a break and
         accelerate afterward, the VRP solver cannot add thevalue for breaks.
         This means that if a route leaves an order, stops for a break, and
         continues to the next order, the arrive/depart delay is added only
         once, not twice. ArriveDepartDelayFor example, there are five
         coincident orders in a high-rise building,
         and they are serviced by three different routes. This means three
         arrive/depart delays are incurred; that is, three drivers need to
         separately find parking places and enter the same building. However,
         if the orders can be serviced by one route instead, only one driver
         needs to park and enter the building, and only one arrive/depart delay
         is incurred. Since the VRP solver tries to minimize cost, it attempts
         to limit the arrive/depart delays and identify the single-route
         option. (Multiple routes may need to be sent when other
         constraints-such as specialties, time windows, or capacities-require
         it.)The unit for this field value is specified by the time_units
         parameter.CapacitiesThe maximum capacity of the vehicle. You can
         specify capacity in any
         dimension, such as weight, volume, or quantity. You can also specify
         multiple dimensions, for example, weight and volume.Enter capacities
         without indicating units. For example, if the vehicle
         can carry a maximum of 40,000 pounds, enter 40000. You need to
         remember that the value is in pounds.If you are tracking multiple
         dimensions, separate the numeric values
         with a space. For example, if you are recording the weight and volume
         of a delivery that weighs 2,000 pounds and has a volume of 100 cubic
         feet, enter 2000 100. Again, you need to remember the units-in this
         case, pounds and cubic feet. You also need to remember the sequence in
         which the values and their corresponding units are entered.
         Remembering the units and the unit sequence is important for a
         couple of reasons: first, so you can reinterpret the information
         later; second, so you can properly enter values for theandfields for
         the orders. The VRP solver simultaneously refers to,, andto verify
         that a route doesn't become overloaded. Units can't be entered in the
         field and the VRP tool can't make unit conversions. You must enter the
         values for the three fields using the same units and the same unit
         sequence to ensure that the values are correctly interpreted. If you
         combine units or change the sequence in any of the three fields,
         unwanted results occur with no warning messages. It is recommended
         that you set up a unit and unit-sequence standard beforehand and refer
         to it when you enter values for these three fields. DeliveryQua
         ntitiesPickupQuantitiesCapacitiesDeliveryQuantitiesPickupQuantitiesAn
         empty string or null value is equivalent to infinity. Capacity
         values can't be negative. If thefield has an insufficient
         number of values in relation
         to theorfield for orders, the remaining values are treated as
         infinity. CapacitiesDeliveryQuantitiesPickupQuantitiesThe VRP
         solver only performs a simple Boolean test to determine
         whether capacities are exceeded. If a route's capacity value is
         greater than or equal to the total quantity being carried, it is
         assumed that the cargo fits in the vehicle. This may be incorrect,
         depending on the actual shape of the cargo and the vehicle. For
         example, the VRP solver allows you to fit a 1,000-cubic-foot sphere
         into a 1,000-cubic-foot truck that is 8 feet wide. In reality,
         however, since the sphere is 12.6 feet in diameter, it won't fit in
         the 8-foot wide truck.FixedCostA fixed monetary cost that is incurred
         only if the route is used in a
         solution (that is, it has orders assigned to it). This field can
         contain null values; a null value indicates zero fixed cost. This cost
         is part of the total route operating cost.CostPerUnitTimeThe monetary
         cost incurred-per unit of work time-for the total route
         duration, including travel times as well as service times and wait
         times at orders, depots, and breaks. This field can't contain a null
         value and has a default value of 1.0.The unit for this field value is
         specified by the time_units
         parameter.CostPerUnitDistanceThe monetary cost incurred-per unit of
         distance traveled-for the route
         length (total travel distance). This field can contain null values; a
         null value indicates zero cost.The unit for this field value is
         specified by the distance_units
         parameter.OvertimeStartTimeThe duration of regular work time before
         overtime computation begins.
         This field can contain null values; a null value indicates that
         overtime does not apply.The unit for this field value is specified by
         the time_units
         parameter. For example, if the driver is to be paid overtime
         when the
         total route duration extends beyond eight hours,is specified as 480 (8
         hours * 60 minutes/hour), given the time units are minutes.
         OvertimeStartTimeCostPerUnitOvertime        The monetary cost incurred
         per time unit of overtime work.
         This field can contain null values; a null value indicates that
         thevalue is the same as thevalue.
         CostPerUnitOvertimeCostPerUnitTimeMaxOrderCountThe maximum allowable
         number of orders on the route. This field can't
         contain null values and has a default value of 30.MaxTotalTimeThe
         maximum allowable route duration. The route duration includes
         travel times as well as service and wait times at orders, depots, and
         breaks. This field can contain null values; a null value indicates
         that there is no constraint on the route duration.The unit for this
         field value is specified by the time_units
         parameter.MaxTotalTravelTimeThe maximum allowable travel time for the
         route. The travel time
         includes only the time spent driving on the network and does not
         include service or wait times. This field can contain null
         values; a null value indicates
         that there is no constraint on the maximum allowable travel time. This
         field value can't be larger than thefield value.
         MaxTotalTimeThe unit for this field value is specified by the
         time_units
         parameter.MaxTotalDistanceThe maximum allowable travel distance for
         the route.The unit for this field value is specified by the
         distance_units
         parameter.This field can contain null values; a null value indicates
         that there
         is no constraint on the maximum allowable travel
         distance.SpecialtyNamesA space-separated string containing the names
         of the specialties
         required by the order. A null value indicates that the order doesn't
         require specialties.The spelling of any specialties listed in the
         Orders and Routes
         classes must match exactly so that the VRP solver can link them
         together. To illustrate what specialties are and how they work,
         a lawn
         care and tree trimming company has a portion of its orders that
         requires a bucket truck to trim tall trees. The company enters
         BucketTruck in thefield for these orders to indicate their special
         need.is left null for the other orders. Similarly, the company also
         enters BucketTruck in thefield of routes that are driven by trucks
         with hydraulic booms. It leaves the field null for the other routes.
         At solve time, the VRP solver assigns orders without special needs to
         any route, but it only assigns orders that need bucket trucks to
         routes that have them.
         SpecialtyNamesSpecialtyNamesSpecialtyNamesAssignmentRuleSpecifies the
         rule for assigning the order to a route. The field value
         is specified as one of the following integers (use the numeric code,
         not the name in parentheses):This field can't contain a null value.1
         (Include)-The route is included in the solve operation. This is the
         default value.2 (Exclude)-The route is excluded from the solve
         operation.
     breaks {Record Set}:
         The rest periods, or breaks, for the routes in a given vehicle routing
         problem. A break is associated with exactly one route and can be taken
         after completing an order, while en route to an order, or prior to
         servicing an order. It has a start time and a duration for which the
         driver may or may not be paid. There are three options for
         establishing when a break begins: a time window, a maximum travel
         time, or a maximum work time.Time-window breaks are not allowed if
         orders or depots are in multiple
         time zones unless times are in UTC.When specifying the breaks, you can
         set properties for each-such as
         its name or service time-using the following attributes:ObjectIDThe
         system-managed ID field.RouteNameThe name of the route to which the
         break applies. Although a break is
         assigned to exactly one route, many breaks can be assigned to the same
         route. This field is a foreign key to thefield in the routes,
         so it
         can't have a null value. NamePrecedencePrecedence values
         sequence the breaks of a given route. Breaks with a
         precedence value of 1 occur before those with a value of 2, and so
         on.All breaks must have a precedence value, regardless of whether they
         are time-window, maximum-travel-time, or maximum-work-time
         breaks.ServiceTimeThe duration of the break. This field can't contain
         null values. The
         default value is 60.The unit for this field value is specified by the
         time_units
         parameter.TimeWindowStartThe start time of the break's time window.
         Both a start time and an
         end time must be specified. If this field has a value,
         theandfield values must be null,
         and all other breaks in the analysis must have null values forand.
         MaxTravelTimeBetweenBreaksMaxCumulWorkTimeMaxTravelTimeBetweenBreaksMa
         xCumulWorkTimeAn error will occur at solve time if a route has
         multiple breaks with
         overlapping time windows. The time window fields in breaks can
         contain a time-only value
         or a date and time value in a date field and not as integers
         representing milliseconds since epoch. The time zone for time window
         fields is specified using theparameter. If a time field, such as, has
         a time-only value (for example, 12:00 p.m.), the date is assumed to be
         the date specified by theparameter (default_date in Python). Using
         date and time values (for example, 7/11/2012, 12:00 p.m.) allows you
         to specify time windows that span two or more days. This is beneficial
         when a break should be taken sometime before and after midnight.
         Time Zone Usage for Time FieldsTimeWindowStartDefault
         DateTimeWindowEndThe end time of the break's time window. Both a start
         time and an end
         time must be specified. If this field has a value,andmust be
         null, and all other
         breaks in the analysis must have null values forand. MaxTravelT
         imeBetweenBreaksMaxCumulWorkTimeMaxTravelTimeBetweenBreaksMaxCumulWork
         TimeMaxViolationTimeThis field specifies the maximum allowable
         violation time for a time-
         window break. A time window is considered violated if the arrival time
         falls outside the time range. A zero value indicates that the
         time window cannot be
         violated; that is, the time window is hard. A nonzero value specifies
         the maximum amount of lateness. For example, the break can begin up to
         30 minutes beyond the end of its time window, but the lateness is
         penalized pursuant to theparameter. Time Window Violation
         Importance        This property can be null. A null value
         withandvalues
         indicates that there is no limit on the allowable violation time.
         Iforhas a value,must be null. TimeWindowStartTimeWindowEndMaxTr
         avelTimeBetweenBreaksMaxCumulWorkTimeMaxViolationTimeThe unit for this
         field value is specified by the time_units
         parameter.MaxTravelTimeBetweenBreaksThe maximum amount of travel time
         that can be accumulated before the
         break is taken. The travel time is accumulated either from the end of
         the previous break or, if a break has not yet been taken, from the
         start of the route. If this is the route's final break,also
         indicates the maximum
         travel time that can be accumulated from the final break to the end
         depot. MaxTravelTimeBetweenBreaks        This field limits how
         long a person can drive until a break is
         required. For example, if the time unit for the analysis is set to
         minutes, andhas a value of 120, the driver will get a break after two
         hours of driving. To assign a second break after two more hours of
         driving, the second break'sproperty must be 120.
         MaxTravelTimeBetweenBreaksMaxTravelTimeBetweenBreaks        If this
         field has a value,,,, andmust be null for an analysis
         to solve successfully.
         TimeWindowStartTimeWindowEndMaxViolationTimeMaxCumulWorkTimeThe unit
         for this field value is specified by the time_units
         parameter.MaxCumulWorkTimeThe maximum amount of work time that can be
         accumulated before the
         break is taken. Work time is always accumulated from the beginning of
         the route.Work time is the sum of travel time and service times at
         orders,
         depots, and breaks. However, this excludes wait time, which is the
         time a route (or driver) spends waiting at an order or depot for a
         time window to begin. This field limits how long a person can
         work until a break is
         required. For example, if the time unit for the analysis is set to
         minutes,has a value of 120, andhas a value of 15, the driver will get
         a 15-minute break after two hours of work.
         MaxCumulWorkTimeServiceTime        Continuing with the last example, a
         second break is needed
         after three more hours of work. To specify this break, enter 315 (five
         hours and 15 minutes) as the second break'svalue. This number includes
         theandvalues of the preceding break, along with the three additional
         hours of work time before granting the second break. To avoid taking
         maximum-work-time breaks prematurely, remember that they accumulate
         work time from the beginning of the route and that work time includes
         the service time at previously visited depots, orders, and breaks.
         MaxCumulWorkTimeMaxCumulWorkTimeServiceTime        If this field has a
         value,,,, andmust be null for an analysis
         to solve successfully.
         TimeWindowStartTimeWindowEndMaxViolationTimeMaxTravelTimeBetweenBreaks
         The unit for this field value is specified by the time_units
         parameter.IsPaidA Boolean value indicating whether the break is paid
         or unpaid.
         Setting this field value to 1 indicates that the time spent at the
         break is included in the route cost computation and overtime
         determination. A value of 0 indicates otherwise. The default value is
         1.SequenceIndicates the sequence of the break on its route. This field
         can
         contain null values; a null value causes the solver to assign the
         break sequence. If sequence values are specified, they should be
         positive and unique for each route (shared across renewal depot
         visits, orders, and breaks) but do not need to start from 1 or be
         contiguous.
     time_units {String}:
         The time units for all time-based field values in the
         analysis. Many features and records in a VRP analysis have fields for
         storing time values, such asfor orders andfor routes. To minimize data
         entry requirements, these field values don't include units. Instead,
         all time-based field values must be entered in the same units, and
         this parameter is used to specify the units of those values.
         ServiceTimeCostPerUnitTimeSeconds-The time unit is seconds.Minutes-The
         time unit is
         minutes.Hours-The time unit is hours.Days-The time unit is days.Output
         time-based fields use the same units specified by this
         parameter.
     distance_units {String}:
         The distance units for all distance-based field values in the
         analysis. Many features and records in a VRP analysis have fields for
         storing distance values, such asandfor routes. To minimize data entry
         requirements, these field values don't include units. Instead, all
         distance-based field values must be entered in the same units, and
         this parameter is used to specify the units of those values.
         MaxTotalDistanceCostPerUnitDistanceMeters-The linear unit is
         meters.Kilometers-The linear unit is
         kilometers.Feet-The linear unit is feet.Yards-The linear unit is
         yards.Miles-The linear unit is miles.NauticalMiles-The linear unit is
         nautical miles.Output distance-based fields use the same units
         specified by this
         parameter.
     analysis_region {String}:
         The region in which the analysis will be performed. If a value is not
         specified for this parameter, the tool will automatically calculate
         the region name based on the location of the input points. Setting the
         name of the region is required only if the automatic detection of the
         region name is not accurate for the inputs.To specify a region, use
         one of the following values:Europe-The analysis region will be
         Europe.Japan-The analysis region
         will be Japan.Korea-The analysis region will be
         Korea.MiddleEastAndAfrica-The analysis region will be Middle East and
         Africa.NorthAmerica-The analysis region will be North
         America.SouthAmerica-The analysis region will be South
         America.SouthAsia-The analysis region will be South Asia.Thailand-The
         analysis region will be Thailand. The following region names
         are no longer supported and will be
         removed in future releases. If you specify one of the deprecated
         region names, the tool automatically assigns a supported region name
         for the region. Greece redirects to EuropeIndia redirects to
         SouthAsiaOceania
         redirects to SouthAsiaSouthEastAsia redirects to SouthAsiaTaiwan
         redirects to SouthAsia
     default_date {Date}:
         The default date for time field values that specify a time of
         day without including a date. You can find these time fields in
         various input parameters, such as theattributes in the orders and
         breaks parameters. ServiceTime
     uturn_policy {String}:
         Specifies the U-turn policy at junctions. To understand the parameter
         values, consider the following terminology: a junction is a point
         where a street segment ends and potentially connects to one or more
         other segments; a pseudojunction is a point where exactly two streets
         connect to one another; an intersection is a point where three or more
         streets connect; and a dead end is where one street segment ends
         without connecting to another.ALLOW_UTURNS-U-turns are permitted
         everywhere. Allowing U-turns
         implies that the vehicle can turn around at any junction and double
         back on the same street. This is the default value.
         NO_UTURNS-U-turns are prohibited at all junctions, including
         pseudojunctions, intersections, and dead ends. However, U-turns may be
         possible even when this option is chosen. To prevent U-turns at
         incidents and facilities, set thefield value to prohibit U-turns.
         CurbApproachALLOW_DEAD_ENDS_ONLY-U-turns are prohibited at all
         junctions, except
         those that have only one connected street feature (a dead
         end).ALLOW_DEAD_ENDS_AND_INTERSECTIONS_ONLY-U-turns are prohibited at
         pseudojunctions where exactly two adjacent streets meet, but U-turns
         are permitted at intersections and dead ends. This prevents turning
         around in the middle of the road where one length of road happens to
         be digitized as two street features. The value you specify for
         this parameter is ignored unlessis
         set to, which is the default value. Travel ModeCustom
     time_window_factor {String}:
         Specifies the importance of honoring time windows.High-Importance is
         placed on arriving at stops on time rather than
         minimizing drive times. For example, organizations that make time-
         critical deliveries or that are concerned with customer service use
         this option.Medium-Importance is balanced between minimizing drive
         times and
         arriving within time windows. This is the default value.Low-Importance
         is placed on minimizing drive times rather than
         arriving at stops on time. You may want to use this setting if you
         have a growing backlog of service requests. For the purpose of
         servicing more orders in a day and reducing the backlog, you can use
         this option even though customers may be inconvenienced with late
         arrival times.
     spatially_cluster_routes {Boolean}:
         Specifies whether routes will be spatially clustered.CLUSTER
         (True)-Dynamic seed points are automatically created for all
         routes, and the orders assigned to an individual route are spatially
         clustered. Clustering orders tends to keep routes in smaller areas and
         reduce how often different route lines intersect one another; yet,
         clustering also tends to increase overall travel times.NO_CLUSTER
         (False)-Dynamic seed points aren't created. Choose this
         option if route zones are specified.
     route_zones {Feature Set}:
         Delineates work territories for given routes. A route zone is
         a polygon feature used to constrain routes to servicing only those
         orders that fall within or near the specified area. The following are
         examples of when route zones may be useful:        Some of your
         employees don't have the required permits to perform work
         in certain states or communities. You can create a hard route zone so
         they only visit orders in areas where they meet the requirements.One
         of your vehicles breaks down frequently and you want to minimize
         response time by having it only visit orders that are close to your
         maintenance garage. You can create a soft or hard route zone to keep
         the vehicle nearby.When specifying the route zones, you must set
         properties for each-such
         as its associated route-using the following attributes:ObjectIDThe
         system-managed ID field.RouteName        The name of the route to
         which this zone applies. A route zone
         can have a maximum of one associated route. This field can't contain
         null values, and it is a foreign key to thefield in routes.
         NameIsHardZoneA Boolean value indicating a hard or soft route zone. A
         True value
         indicates that the route zone is hard; that is, an order that falls
         outside the route zone polygon can't be assigned to the route. The
         default value is 1 (True). A False value (0) indicates that such
         orders can still be assigned, but the cost of servicing the order is
         weighted by a function based on the Euclidean distance from the route
         zone. Basically, this means that as the straight-line distance from
         the soft zone to the order increases, the likelihood of the order
         being assigned to the route decreases.
     route_renewals {Record Set}:
         The intermediate depots that routes can visit to reload or unload the
         cargo they are delivering or picking up. Specifically, a route renewal
         links a route to a depot. The relationship indicates the route can
         renew (reload or unload while en route) at the associated depot.Route
         renewals can be used to model scenarios in which a vehicle picks
         up a full load of deliveries at the starting depot, services the
         orders, returns to the depot to renew its load of deliveries, and
         continues servicing more orders. For example, in propane gas delivery,
         the vehicle may make several deliveries until its tank is nearly or
         completely depleted, visit a refueling point, and make more
         deliveries. Keep the following in mid when using route
         renewals:
         The reload/unload point, or renewal location, can be different from
         the start or end depot.Each route can have one or many predetermined
         renewal locations.A renewal location can be used more than once by a
         single route.In cases where there may be several potential renewal
         locations for a
         route, the closest available renewal location is identified by the
         solver.When specifying the route renewals, you must set properties for
         each-such as the name of the depot where the route renewal can
         occur-using the following attributes:ObjectIDThe system-managed ID
         field.DepotName        The name of the depot where this renewal takes
         place. This
         field can't contain a null value and is a foreign key to thefield in
         depots. NameRouteName        The name of the route to which
         this renewal applies. This
         field can't contain a null value and is a foreign key to thefield in
         routes. NameServiceTimeThe service time for the renewal. This
         field can contain a null value;
         a null value indicates zero service time.The unit for this field value
         is specified by the time_units
         parameter.The time taken to load a vehicle at a renewal depot may
         depend on the
         size of the vehicle and how full or empty the vehicle is. However, the
         service time for a route renewal is a fixed value and does not take
         into account the actual load. The renewal service time should be given
         a value corresponding to a full truckload, an average truckload, or
         another time estimate of your choice.
     order_pairs {Record Set}:
         Pairs pick up and deliver orders so they are serviced by the same
         route. Specifying order pairs prevents the analysis from assigning
         only one of the orders to a route: either both orders are assigned to
         the same route, or neither order is assigned.Sometimes it is necessary
         for the pick up and delivery of orders to be
         paired. For example, a courier company may need to have a route pick
         up a high-priority package from one order and deliver it to another
         without returning to a depot, or sorting station, to minimize delivery
         time. These related orders can be assigned to the same route with the
         appropriate sequence using order pairs. Restrictions on how long the
         package can stay in the vehicle can also be assigned; for example, the
         package might be a blood sample that must be transported from the
         doctor's office to the lab within two hours.Some situations may
         require two pairs of orders. For example, you want
         to transport a senior citizen from her home to the doctor and then
         back home. The ride from her home to the doctor is one pair of orders
         with a desired arrival time at the doctor, and the ride from the
         doctor to her home is another pair with a desired pickup time.When
         specifying the order pairs, you must set properties for each-such
         as the names of the two orders-using the following
         attributes:ObjectIDThe system-managed ID field.FirstOrderName
         The name of the first order of the pair. This field is a
         foreign key to thefield in orders. NameSecondOrderName
         The name of the second order of the pair. This field is a
         foreign key to thefield in orders. Name        The first order
         in the pair must be a pickup order; that is,
         the value for itsfield is null. The second order in the pair must be a
         delivery order; that is, the value for itsfield is null. The quantity
         picked up at the first order must agree with the quantity delivered at
         the second order. As a special case, both orders may have zero
         quantities for scenarios where capacities are not used.
         DeliveryQuantitiesPickupQuantitiesThe order quantities are not loaded
         or unloaded at depots.MaxTransitTimeThe maximum transit time for the
         pair. The transit time is the
         duration from the departure time of the first order to the arrival
         time at the second order. This constraint limits the time-on-vehicle,
         or ride time, between the two orders. When a vehicle is carrying
         people or perishable goods, the ride time is typically shorter than
         that of a vehicle carrying packages or nonperishable goods. This field
         can contain null values; a null value indicates that there is no
         constraint on the ride time.The unit for this field value is specified
         by the timeUnits property
         of the analysis object. Excess transit time (measured with
         respect to the direct
         travel time between order pairs) can be tracked and weighted by the
         solver. Because of this, you can direct the VRP solver to take one of
         the following approaches:        Minimize the overall excess transit
         time, regardless of the increase
         in travel cost for the fleet.Find a solution that balances overall
         violation time and travel cost.Ignore the overall excess transit time
         and, instead, minimize the
         travel cost for the fleet. By assigning an importance level for
         the excess_transit_factor
         parameter, you are, in effect, choosing one of these approaches.
         Regardless of the importance level, the solver will always return an
         error if thevalue is surpassed. MaxTransitTime
     excess_transit_factor {String}:
         Specifies the importance of reducing excess transit time of order
         pairs. Excess transit time is the amount of time exceeding the time
         required to travel directly between the paired orders. Excess time can
         be caused by driver breaks or travel to intermediate orders and
         depots.High-Importance is placed on the least excess transit time
         between
         paired orders at the expense of increasing the overall travel costs.
         This option is typically used when transporting people between paired
         orders and you want to shorten their ride time. This is characteristic
         of taxi services.Medium-Importance is balanced between reducing excess
         transit time and
         reducing the overall solution cost. This is the default
         value.Low-Importance is placed on minimizing overall solution cost,
         regardless of excess transit time. This setting is commonly used with
         courier services. Since couriers transport packages as opposed to
         people, they don't worry about ride time. This option allows the
         couriers to service paired orders in the proper sequence and minimize
         the overall solution cost.
     point_barriers {Feature Set}:
         Use this parameter to specify one or more points that will act as
         temporary restrictions or represent additional time or distance that
         may be required to travel on the underlying streets. For example, a
         point barrier can be used to represent a fallen tree along a street or
         a time delay spent at a railroad crossing.The tool imposes a limit of
         250 points that can be added as barriers.When specifying point
         barriers, you can set properties for each, such
         as its name or barrier type, using the following attributes:NameThe
         name of the barrier.BarrierTypeSpecifies whether the point barrier
         restricts travel completely or
         adds time or distance when it is crossed. The value for this attribute
         is specified as one of the following integers (use the numeric code,
         not the name in parentheses):0 (Restriction)-Prohibits travel through
         the barrier. The barrier is
         referred to as a restriction point barrier since it acts as a
         restriction. 2 (Added Cost)-Traveling through the barrier
         increases the
         travel time or distance by the amount specified in the,, orfield. This
         barrier type is referred to as an added cost point barrier.
         Additional_TimeAdditional_DistanceAdditionalCostAdditional_Time
         The added travel time when the barrier is traversed. This
         field is applicable only for added-cost barriers and when theparameter
         value is time based. Measurement Units        This field value
         must be greater than or equal to zero, and
         its units must be the same as those specified in theparameter.
         Measurement UnitsAdditional_Distance        The added distance when
         the barrier is traversed. This field
         is applicable only for added-cost barriers and when theparameter value
         is distance based. Measurement Units        The field value
         must be greater than or equal to zero, and its
         units must be the same as those specified in theparameter.
         Measurement UnitsAdditionalCost        The added cost when the barrier
         is traversed. This field is
         applicable only for added-cost barriers when theparameter value is
         neither time based nor distance based. Measurement
         UnitsFullEdgeSpecifies how the restriction point barriers are applied
         to the edge
         elements during the analysis. The field value is specified as one of
         the following integers (use the numeric code, not the name in
         parentheses):0 (False)-Permits travel on the edge up to the barrier
         but not through
         it. This is the default value.1 (True)-Restricts travel anywhere on
         the associated edge.CurbApproachSpecifies the direction of traffic
         that is affected by the barrier.
         The field value is specified as one of the following integers (use the
         numeric code, not the name in parentheses):0 (Either side of
         vehicle)-The barrier affects travel over the edge in
         both directions.1 (Right side of vehicle)-Vehicles are only affected
         if the barrier is
         on their right side during the approach. Vehicles that traverse the
         same edge but approach the barrier on their left side are not affected
         by the barrier.2 (Left side of vehicle)-Vehicles are only affected if
         the barrier is
         on their left side during the approach. Vehicles that traverse the
         same edge but approach the barrier on their right side are not
         affected by the barrier.Because junctions are points and don't have a
         side, barriers on
         junctions affect all vehicles regardless of the curb approach.
         Theattribute works with both types of national driving
         standards: right-hand traffic (United States) and left-hand traffic
         (United Kingdom). First, consider a facility on the left side of a
         vehicle. It is always on the left side regardless of whether the
         vehicle travels on the left or right half of the road. What may change
         with national driving standards is your decision to approach a
         facility from one of two directions, that is, so it ends up on the
         right or left side of the vehicle. For example, to arrive at a
         facility and not have a lane of traffic between the vehicle and the
         facility, choose 1 (Right side of vehicle) in the United States and 2
         (Left side of vehicle) in the United Kingdom.
         CurbApproachBearing        The direction in which a point is moving.
         The units are
         degrees and are measured clockwise from true north. This field is used
         in conjunction with thefield. BearingTolBearing data is usually
         sent automatically from a mobile device
         equipped with a GPS receiver. Try to include bearing data if you are
         loading an input location that is moving, such as a pedestrian or a
         vehicle.Using this field tends to prevent adding locations to the
         wrong edges,
         which can occur when a vehicle is near an intersection or an overpass,
         for example. Bearing also helps the tool determine on which side of
         the street the point is.BearingTol        The bearing tolerance value
         creates a range of acceptable
         bearing values when locating moving points on an edge using thefield.
         If thefield value is within the range of acceptable values that are
         generated from the bearing tolerance on an edge, the point can be
         added as a network location there; otherwise, the closest point on the
         next-nearest edge is evaluated. BearingBearingThe units are in
         degrees, and the default value is 30. Values must be
         greater than 0 and less than 180. A value of 30 means that when
         Network Analyst attempts to add a network location on an edge, a range
         of acceptable bearing values is generated 15 degrees to either side of
         the edge (left and right) and in both digitized directions of the
         edge.NavLatency        This field is only used in the solve process if
         theandfields
         also have values; however, entering afield value is optional, even
         when values are present inand.indicates how much cost is expected to
         elapse from the moment GPS information is sent from a moving vehicle
         to a server and the moment the processed route is received by the
         vehicle's navigation device.
         BearingBearingTolNavLatencyBearingBearingTolNavLatencyThe units of
         NavLatency are the same as the units of the impedance
         attribute.
     line_barriers {Feature Set}:
         Use this parameter to specify one or more lines that prohibit travel
         anywhere the lines intersect the streets. For example, a parade or
         protest that blocks traffic across several street segments can be
         modeled with a line barrier. A line barrier can also quickly fence off
         several roads from being traversed, thereby channeling possible routes
         away from undesirable parts of the street network. The tool
         imposes a limit on the number of streets you can
         restrict using theparameter. While there is no limit to the number of
         lines you can specify as line barriers, the combined number of streets
         intersected by all the lines cannot exceed 500. Line
         BarriersWhen specifying the line barriers, you can set name and
         barrier type
         properties for each using the following attributes:NameThe name of the
         barrier.
     polygon_barriers {Feature Set}:
         Use this parameter to specify polygons that either completely restrict
         travel or proportionately scale the time or distance required to
         travel on the streets intersected by the polygons. The service
         imposes a limit on the number of streets you can
         restrict using theparameter. While there is no limit to the number of
         polygons you can specify as polygon barriers, the combined number of
         streets intersected by all the polygons cannot exceed 2,000.
         Polygon BarriersWhen specifying the polygon barriers, you can set
         properties for each,
         such as its name or barrier type, using the following
         attributes:NameThe name of the barrier.BarrierTypeSpecifies whether
         the barrier restricts travel completely or scales
         the cost (such as time or distance) for traveling through it. The
         field value is specified as one of the following integers (use the
         numeric code, not the name in parentheses):0 (Restriction)-Prohibits
         traveling through any part of the barrier.
         The barrier is referred to as a restriction polygon barrier since it
         prohibits traveling on streets intersected by the barrier. One use of
         this type of barrier is to model floods covering areas of the street
         that make traveling on those streets impossible. 1 (Scaled
         Cost)-Scales the cost (such as travel time or
         distance) required to travel the underlying streets by a factor
         specified using theorfield. If the streets are partially covered by
         the barrier, the travel time or distance is apportioned and then
         scaled. For example, a factor of 0.25 means that travel on underlying
         streets is expected to be four times faster than normal. A factor of
         3.0 means it is expected to take three times longer than normal to
         travel on underlying streets. This barrier type is referred to as a
         scaled-cost polygon barrier. It can be used to model storms that
         reduce travel speeds in specific regions, for example.
         ScaledTimeFactorScaledDistanceFactorScaledTimeFactorThis is the factor
         by which the travel time of the streets intersected
         by the barrier is multiplied. The field value must be greater than
         zero. This field is applicable only for scaled-cost barriers
         and
         when theparameter is time-based. Measurement
         UnitsScaledDistanceFactorThis is the factor by which the distance of
         the streets intersected by
         the barrier is multiplied. The field value must be greater than zero.
         This field is applicable only for scaled-cost barriers and
         when theparameter is distance-based. Measurement
         UnitsScaledCostFactorThis is the factor by which the cost of the
         streets intersected by the
         barrier is multiplied. The field value must be greater than zero.
         This field is applicable only for scaled-cost barriers when
         theparameter is neither time-based nor distance-based.
         Measurement Units
     use_hierarchy_in_analysis {Boolean}:
         Specifies whether hierarchy will be used when finding the best
         routes. Checked (True)-Hierarchy will be used when finding
         routes. When
         hierarchy is used, higher-order streets, such as freeways, are
         identified before lower-order streets, such as local roads. Hierarchy
         can be used to simulate the driver preference of traveling on freeways
         instead of local roads even if that means a longer trip. This is
         especially true when finding routes to faraway locations, because
         drivers on long-distance trips tend to prefer traveling on freeways,
         where stops, intersections, and turns can be avoided. Using hierarchy
         is computationally faster, especially for long-distance routes, since
         the best route is identified from a relatively smaller subset of
         streets.Unchecked (False)-Hierarchy will not be used when finding
         routes. If
         hierarchy is not used, all the streets are considered and higher-order
         streets are not necessarily identified when finding the route. This is
         often used when finding short-distance routes within a city.If the
         straight-line distance between orders, depots, or orders and
         depots is greater than 50 miles, hierarchy is automatically used even
         if this parameter is unchecked (False). This parameter is
         ignored unlessis set to, which is the
         default value. Travel ModeCustom
     restrictions {String}:
         The restrictions that will be honored by the tool when finding the
         best routes.A restriction represents a driving preference or
         requirement. In most
         cases, restrictions cause roads to be prohibited. For instance, using
         the Avoid Toll Roads restriction will result in a route that will
         include toll roads only when it is required to travel on toll roads to
         visit an incident or a facility. Height Restriction makes it possible
         to route around any clearances that are lower than the height of the
         vehicle. If you are carrying corrosive materials on the vehicle, using
         the Any Hazmat Prohibited restriction prevents hauling the materials
         along roads where it is marked illegal to do so. The values you
         provide for this parameter are ignored unlessis
         set to. Travel ModeCustom         Some restrictions require an
         additional value to be specified
         for their use. This value must be associated with the restriction name
         and a specific parameter intended to work with the restriction. You
         can identify such restrictions if their names appear in the
         AttributeName column of theparameter. Specify thefield for
         theparameter for the restriction to be correctly used when finding
         traversable roads. Attribute Parameter
         ValuesParameterValueAttribute Parameter Values         Some
         restrictions are supported only in certain countries;
         their availability is stated by region in the list below. Of the
         restrictions that have limited availability within a region, you can
         determine whether the restriction is available in a particular country
         by reviewing the table in the Country list section of Network analysis
         coverage. If a country has a value ofin the Logistics Attribute
         column, the restriction with select availability in the region is
         supported in that country. If you specify restriction names that are
         not available in the country where the incidents are located, the
         service ignores the invalid restrictions. The service also ignores
         restrictions when theattribute parameter value is between 0 and 1 (see
         theparameter). It prohibits all restrictions when theparameter value
         is greater than 0. YesRestriction UsageAttribute Parameter
         ValueRestriction UsageThe service supports the following restrictions:
         Any Hazmat Prohibited-The results will not include roads
         where transporting any kind of hazardous material is prohibited.
         Availability: Select countries in North America and Europe
         Avoid Carpool Roads-The results will avoid roads that are
         designated exclusively for car pool (high-occupancy) vehicles.
         Availability: All countries         Avoid Express Lanes-The results
         will avoid roads designated
         as express lanes. Availability: All countries         Avoid
         Ferries-The results will avoid ferries.
         Availability: All countries         Avoid Gates-The results will avoid
         roads where there are
         gates, such as keyed access or guard-controlled entryways.
         Availability: All countries         Avoid Limited Access Roads-The
         results will avoid roads that
         are limited-access highways. Availability: All countries
         Avoid Private Roads-The results will avoid roads that are not
         publicly owned and maintained. Availability: All countries
         Avoid Roads Unsuitable for Pedestrians-The results will avoid
         roads that are unsuitable for pedestrians. Availability: All
         countries         Avoid Stairways-The results will avoid all stairways
         on a
         pedestrian-suitable route. Availability: All countries
         Avoid Toll Roads-The results will avoid all toll roads for
         automobiles. Availability: All countries         Avoid Toll
         Roads for Trucks-The results will avoid all toll
         roads for trucks. Availability: All countries         Avoid
         Truck Restricted Roads-The results will avoid roads
         where trucks are not allowed, except when making deliveries.
         Availability: All countries         Avoid Unpaved Roads-The results
         will avoid roads that are not
         paved (for example, dirt, gravel, and so on). Availability:
         All countries         Axle Count Restriction-The results will not
         include roads
         where trucks with the specified number of axles are prohibited. The
         number of axles can be specified using the Number of Axles restriction
         parameter. Availability: Select countries in North America and
         Europe         Driving a Bus-The results will not include roads where
         buses
         are prohibited. Using this restriction will also ensure that the
         results will honor one-way streets. Availability: All
         countries         Driving a Taxi-The results will not include roads
         where taxis
         are prohibited. Using this restriction will also ensure that the
         results will honor one-way streets. Availability: All
         countries         Driving a Truck-The results will not include roads
         where
         trucks are prohibited. Using this restriction will also ensure that
         the results will honor one-way streets. Availability: All
         countries         Driving an Automobile-The results will not include
         roads
         where automobiles are prohibited. Using this restriction will also
         ensure that the results will honor one-way streets.
         Availability: All countries         Driving an Emergency Vehicle-The
         results will not include
         roads where emergency vehicles are prohibited. Using this restriction
         will also ensure that the results will honor one-way streets.
         Availability: All countries         Height Restriction-The results
         will not include roads where
         the vehicle height exceeds the maximum allowed height for the road.
         The vehicle height can be specified using the Vehicle Height (meters)
         restriction parameter. Availability: Select countries in North
         America and Europe         Kingpin to Rear Axle Length Restriction-The
         results will not
         include roads where the vehicle length exceeds the maximum allowed
         kingpin to rear axle for all trucks on the road. The length between
         the vehicle kingpin and the rear axle can be specified using the
         Vehicle Kingpin to Rear Axle Length (meters) restriction parameter.
         Availability: Select countries in North America and Europe
         Length Restriction-The results will not include roads where
         the vehicle length exceeds the maximum allowed length for the road.
         The vehicle length can be specified using the Vehicle Length (meters)
         restriction parameter. Availability: Select countries in North
         America and Europe         Preferred for Pedestrians-The results will
         use preferred
         routes suitable for pedestrian navigation. Availability:
         Select countries in North America and Europe         Riding a
         Motorcycle-The results will not include roads where
         motorcycles are prohibited. Using this restriction will also ensure
         that the results will honor one-way streets. Availability: All
         countries         Roads Under Construction Prohibited-The results will
         not
         include roads that are under construction. Availability: All
         countries         Semi or Tractor with One or More Trailers
         Prohibited-The
         results will not include roads where semis or tractors with one or
         more trailers are prohibited. Availability: Select countries
         in North America and Europe         Single Axle Vehicles
         Prohibited-The results will not include
         roads where vehicles with single axles are prohibited.
         Availability: Select countries in North America and Europe
         Tandem Axle Vehicles Prohibited-The results will not include
         roads where vehicles with tandem axles are prohibited.
         Availability: Select countries in North America and Europe
         Through Traffic Prohibited-The results will not include roads
         where through traffic (nonlocal) is prohibited. Availability:
         All countries         Truck with Trailers Restriction-The results will
         not include
         roads where trucks with the specified number of trailers on the truck
         are prohibited. The number of trailers on the truck can be specified
         using the Number of Trailers on Truck restriction parameter.
         Availability: Select countries in North America and Europe         Use
         Preferred Hazmat Routes-The results will prefer roads
         that are designated for transporting any kind of hazardous materials.
         Availability: Select countries in North America and Europe         Use
         Preferred Truck Routes-The results will prefer roads that
         are designated as truck routes, such as the roads that are part of the
         national network as specified by the National Surface Transportation
         Assistance Act in the United States, or roads that are designated as
         truck routes by the state or province, or roads that are preferred by
         truckers when driving in an area. Availability: Select
         countries in North America and Europe         Walking-The results will
         not include roads where pedestrians
         are prohibited. Availability: All countries         Weight
         Restriction-The results will not include roads where
         the vehicle weight exceeds the maximum allowed weight for the road.
         The vehicle weight can be specified using the Vehicle Weight
         (kilograms) restriction parameter. Availability: Select
         countries in North America and Europe         Weight per Axle
         Restriction-The results will not include
         roads where the vehicle weight per axle exceeds the maximum allowed
         weight per axle for the road. The vehicle weight per axle can be
         specified using the Vehicle Weight per Axle (kilograms) restriction
         parameter. Availability: Select countries in North America and
         Europe         Width Restriction-The results will not include roads
         where
         the vehicle width exceeds the maximum allowed width for the road. The
         vehicle width can be specified using the Vehicle Width (meters)
         restriction parameter. Availability: Select countries in North
         America and Europe
     attribute_parameter_values {Record Set}:
         Use this parameter to specify additional values required by an
         attribute or restriction, such as to specify whether the restriction
         prohibits, avoids, or prefers travel on restricted roads. If the
         restriction is meant to avoid or prefer roads, you can further specify
         the degree to which they are avoided or preferred using this
         parameter. For example, you can choose to never use toll roads, avoid
         them as much as possible, or prefer them. The values you
         provide for this parameter are ignored unlessis
         set to. Travel ModeCustom        If you specify theparameter
         from a feature class, the field
         names on the feature class must match the fields as follows:
         Attribute Parameter ValuesAttributeName-The name of the restriction.
         ParameterName-The
         name of the parameter associated with the
         restriction. A restriction can have one or morefield values based on
         its intended use. ParameterName          ParameterValue-The
         value forused by the tool when evaluating
         the restriction. ParameterName        Theparameter is
         dependent on theparameter. Thefield is
         applicable only if the restriction name is specified as the value for
         theparameter. Attribute Parameter
         ValuesRestrictionsParameterValueRestrictions        In, each
         restriction (listed as) has afield value, Restriction
         Usage, that specifies whether the restriction prohibits, avoids, or
         prefers travel on the roads associated with the restriction as well as
         the degree to which the roads are avoided or preferred. The
         Restriction Usagecan be assigned any of the following string values or
         their equivalent numeric values listed in the parentheses:
         Attribute Parameter
         ValuesAttributeNameParameterNameParameterNamePROHIBITED (-1)-Travel on
         the roads using the restriction is
         completely prohibited.AVOID_HIGH (5)-It is highly unlikely the tool
         will include in the
         route the roads that are associated with the restriction.AVOID_MEDIUM
         (2)-It is unlikely the tool will include in the route the
         roads that are associated with the restriction.AVOID_LOW (1.3)-It is
         somewhat unlikely the tool will include in the
         route the roads that are associated with the restriction.PREFER_LOW
         (0.8)-It is somewhat likely the tool will include in the
         route the roads that are associated with the restriction.PREFER_MEDIUM
         (0.5)-It is likely the tool will include in the route
         the roads that are associated with the restriction.PREFER_HIGH
         (0.2)-It is highly likely the tool will include in the
         route the roads that are associated with the restriction.In most
         cases, you can use the default value, PROHIBITED, as the
         Restriction Usage value if the restriction is dependent on a vehicle
         characteristic such as vehicle height. However, in some cases, the
         Restriction Usage value depends on your routing preferences. For
         example, the Avoid Toll Roads restriction has the default value of
         AVOID_MEDIUM for the Restriction Usage attribute. This means that when
         the restriction is used, the tool will route around toll roads when it
         can. AVOID_MEDIUM also indicates how important it is to avoid toll
         roads when finding the best route; it has a medium priority. Choosing
         AVOID_LOW puts lower importance on avoiding tolls; choosing AVOID_HIGH
         instead gives it a higher importance and makes it more acceptable for
         the service to generate longer routes to avoid tolls. Choosing
         PROHIBITED entirely disallows travel on toll roads, making it
         impossible for a route to travel on any portion of a toll road. Keep
         in mind that avoiding or prohibiting toll roads, and avoiding toll
         payments, is the objective for some. In contrast, others prefer to
         drive on toll roads, because avoiding traffic is more valuable to them
         than the money spent on tolls. In the latter case, choose PREFER_LOW,
         PREFER_MEDIUM, or PREFER_HIGH as the value for Restriction Usage. The
         higher the preference, the farther the tool will go to travel on the
         roads associated with the restriction.
     populate_route_lines {Boolean}:
         Specifies whether the output route line will be generated.Checked
         (True)-The output routes will have the exact shape of the
         underlying streets.Unchecked (False)-No shape is generated for the
         output routes, but the
         routes will contain tabular information about the solution. You can't
         generate driving directions if no route lines are created. When
         theparameter is set to, the generalization of the route
         shape can be further controlled using the appropriate values for
         theparameter. Route ShapeTrue ShapeRoute Line Simplification
         Tolerance        Regardless of the value you specify for theparameter,
         the best
         routes are determined by minimizing the travel along the streets, not
         by using the straight-line distance. This means that only the route
         shapes are different, not the underlying streets that are searched
         when finding the route. Route Shape
     route_line_simplification_tolerance {Linear Unit}:
         The amount by which the geometry of the output lines will be
         simplified for routes and directions. The value provided for
         this parameter is ignored unlessis set
         to, which is the default value. Travel ModeCustomThis parameter
         is ignored if the populate_route_lines parameter is
         unchecked (False).Simplification maintains critical points on a route,
         such as turns at
         intersections, to define the essential shape of the route and removes
         other points. The simplification distance you specify is the maximum
         allowable offset that the simplified line can deviate from the
         original line. Simplifying a line reduces the number of vertices that
         are part of the route geometry. This improves the tool processing
         time.
     populate_directions {Boolean}:
         Specifies whether the tool will generate driving directions for each
         route. Checked (True in Python)-Directions will be generated
         and
         configured based on the values of the,, andparameters.
         Directions LanguageDirections Style NameDirections Distance
         UnitsUnchecked (False in Python)-Directions will not be generated, and
         the
         tool will return an empty Directions layer.
     directions_language {String}:
         The language that will be used when generating travel directions.
         This parameter is used only when theparameter is checked (True
         in Python). Populate Directions        The parameter value can
         be specified using one of the
         following two- or five-character language codes:
         ar-Arabicbg-Bulgarianbs-Bosnianca-Catalancs-Czechda-Danishde-Germanel-
         Greeken-Englishes-Spanishet-Estonianfi-Finnishfr-Frenchhe-Hebrewhr-Cro
         atianhu-Hungarianid-Indonesianit-Italianja-Japaneseko-Koreanlt-Lithuan
         ianlv-Latviannb-Norwegiannl-Dutchpl-Polishpt-BR-Portuguese (Brazil)pt-
         PT-Portuguese (Portugal)ro-Romanianru-Russiansk-Slovaksl-Sloveniansr-S
         erbiansv-Swedishth-Thaitr-Turkishuk-Ukrainianvi-Vietnamesezh-
         CN-Chinese (China)zh-HK-Chinese (Hong Kong)zh-TW-Chinese (Taiwan)The
         tool first searches for an exact match for the specified language
         including any language localization. If an exact match is not found,
         it tries to match the language family. If a match is still not found,
         the tool returns the directions using the default language, English.
         For example, if the directions language is specified as es-MX (Mexican
         Spanish), the tool will return the directions in Spanish, as it
         supports the es language code but not es-MX.If a language supports
         localization, such as Brazilian Portuguese (pt-
         BR) and European Portuguese (pt-PT), specify the language family and
         the localization. If you only specify the language family, the tool
         will not match the language family and instead return directions in
         the default language, English. For example, if the directions language
         specified is pt, the tool will return the directions in English since
         it cannot determine whether the directions should be returned in pt-BR
         or pt-PT.
     directions_style_name {String}:
         Specifies the name of the formatting style for the directions.
         This parameter is used only when theparameter is checked (True in
         Python). Populate DirectionsNA Desktop-The style will be turn-
         by-turn directions suitable for
         printing.NA Navigation-The style will be turn-by-turn directions
         designed for
         an in-vehicle navigation device.
     travel_mode {String}:
         The mode of transportation that will be modeled in the analysis.
         Travel modes are managed in ArcGIS Online and can be configured by the
         administrator of your organization to reflect the organization's
         workflows. Specify the name of a travel mode that is supported by your
         organization. To get a list of supported travel mode names, run
         the Get
         Travel Modes tool from the Utilities toolbox under the same GIS server
         connection you used to access the tool. The Get Travel Modes tool adds
         the Supported Travel Modes table to the application. Any value in
         thefield from the Supported Travel Modes table can be specified as
         input. You can also specify the value from thefield as input. This
         speeds up tool operation, as the tool does not have to find the
         settings based on the travel mode name. Travel Mode NameTravel
         Mode Settings        The default value,, allows you to configure a
         custom travel
         mode using the custom travel mode parameters (,,,, and). The default
         values of the custom travel mode parameters model traveling by car.
         You can also chooseand set the custom travel mode parameters listed
         above to model a pedestrian with a fast walking speed or a truck with
         a given height, weight, and cargo of certain hazardous materials. You
         can try different settings to get the analysis results you want. Once
         you have identified the analysis settings, work with your
         organization's administrator and save these settings as part of a new
         or existing travel mode so that everyone in your organization can run
         the analysis with the same settings. CustomUTurn at
         JunctionsUse HierarchyRestrictionsAttribute Parameter
         ValuesImpedanceCustom        When you choose, the values you set for
         the custom travel mode
         parameters are included in the analysis. Specifying another travel
         mode, as defined by your organization, causes any values you set for
         the custom travel mode parameters to be ignored; the tool overrides
         them with values from the specified travel mode. Custom
     impedance {String}:
         Specifies the impedance, which is a value that represents the effort
         or cost of traveling along road segments or on other parts of the
         transportation network.Travel time is an impedance: a car may take 1
         minute to travel a mile
         along an empty road. Travel times can vary by travel mode-a pedestrian
         may take more than 20 minutes to walk the same mile, so it is
         important to choose the right impedance for the travel mode you are
         modeling.Travel distance can also be an impedance; the length of a
         road in
         kilometers can be thought of as impedance. Travel distance in this
         sense is the same for all modes-a kilometer for a pedestrian is also a
         kilometer for a car. (What may change is the pathways on which the
         different modes are allowed to travel, which affects distance between
         points, and this is modeled by travel mode settings.)        The value
         you provide for this parameter is ignored unlessis
         set to, which is the default value. Travel
         ModeCustomTravelTime-Historical and live traffic data is used. This
         option is
         good for modeling the time it takes automobiles to travel along roads
         at a specific time of day using live traffic speed data where
         available. When using this option, you can optionally set the
         TravelTime::Vehicle Maximum Speed (km/h) attribute parameter to
         specify the physical limitation of the speed the vehicle is capable of
         traveling.Minutes-Live traffic data is not used, but historical
         average speeds
         for automobile data is used.TruckTravelTime-Historical and live
         traffic data is used, but the
         speed is capped at the posted truck speed limit. This is good for
         modeling the time it takes for the trucks to travel along roads at a
         specific time. When using this option, you can optionally set the
         TruckTravelTime::Vehicle Maximum Speed (km/h) attribute parameter to
         specify the physical limitation of the speed the truck is capable of
         traveling.TruckMinutes-Live traffic data is not used, but the smaller
         of the
         historical average speeds for automobiles and the posted speed limits
         for trucks are used.WalkTime-The default is a speed of 5 km/hr on all
         roads and paths, but
         this can be configured through the WalkTime::Walking Speed (km/h)
         attribute parameter.TimeAt1KPH-The default is a speed of 1 km/hr on
         all roads and paths.
         The speed cannot be changed using any attribute parameter.Drive
         Time-Travel times for a car are modeled. These travel times are
         dynamic and fluctuate according to traffic flows in areas where
         traffic data is available. This is the default value.Truck Time-Travel
         times for a truck are modeled. These travel times
         are static for each road and don't fluctuate with traffic.Walk
         Time-Travel times for a pedestrian are modeled. If you choose a
         time-based impedance, such as,,,, or,
         theparameter must be set to a time-based value; if you choose a
         distance-based impedance such asor, thevalue must be distance based.
         TravelTimeTruckTravelTimeMinutesTruckMinutesWalkTimeBreak
         UnitsMilesKilometersBreak Units        ,,, andimpedance values are no
         longer supported and will be
         removed in a future release. If you use one of these values, the tool
         uses the value of theparameter for time-based values and theparameter
         for distance-based values. Drive TimeTruck TimeWalk TimeTravel
         DistanceTime ImpedanceDistance Impedance
     time_zone_usage_for_time_fields {String}:
         Specifies the time zone for the input date-time fields
         supported by the tool. This parameter specifies the time zone for the
         following fields:,,,,, andon orders;,,, andon depots;andon routes;
         andandon breaks. TimeWindowStart1TimeWindowEnd1TimeWindowStart2
         TimeWindowEnd2InboundArriveTimeOutboundDepartTimeTimeWindowStart1TimeW
         indowEnd1TimeWindowStart2TimeWindowEnd2EarliestStartTimeLatestStartTim
         eTimeWindowStartTimeWindowEnd         GEO_LOCAL-The date-time values
         associated with the orders or
         depots are in the time zone in which the orders and depots are
         located. For routes, the date-time values are based on the time zone
         in which the starting depot for the route is located. If a route does
         not have a starting depot, all orders and depots across all the routes
         must be in a single time zone. For breaks, the date-time values are
         based on the time zone of the routes. For example, if the depot is
         located in an area that follows eastern standard time and has the
         first time window values (specified asand) of 8 AM and 5 PM, the time
         window values will be treated as 8:00 a.m. and 5:00 p.m. eastern
         standard time. TimeWindowStart1TimeWindowEnd1         UTC-The
         date-time values associated with the orders or depots
         are in coordinated universal time (UTC) and are not based on the time
         zone in which the orders or depots are located. For example, if the
         depot is located in an area that follows eastern standard time and has
         the first time window values (specified asand) of 8 AM and 5 PM, the
         time window values will be treated as 12:00 p.m. and 9:00 p.m. eastern
         standard time, assuming eastern standard time is obeying daylight
         saving time. TimeWindowStart1TimeWindowEnd1Specifying the
         date-time values in UTC is useful if you do not know
         the time zone where the orders or depots are located or if you have
         orders and depots in multiple time zones, and you want all the date-
         time values to start simultaneously. The UTC option is applicable only
         when your network dataset defines a time zone attribute. Otherwise,
         all the date-time values are treated as GEO_LOCAL.
     save_output_layer {Boolean}:
         Specifies whether the analysis settings will be saved as a network
         analysis layer file. You cannot directly work with this file even when
         you open the file in an ArcGIS Desktop application such as ArcMap. It
         is meant to be sent to Esri Technical Support to diagnose the quality
         of results returned from the tool. Checked (True)-The network
         analysis layer file will be
         saved. The file is downloaded in a temporary directory on your
         machine. In ArcGIS Pro, the location of the downloaded file can be
         determined by viewing the value for theparameter in the entry
         corresponding to the tool operation in the geoprocessing history of
         the project. In ArcMap, the location of the file can be determined by
         accessing theoption in the shortcut menu for theparameter in the entry
         corresponding to the tool operation in thewindow. Output
         Network Analysis LayerCopy LocationOutput Network Analysis
         LayerGeoprocessing ResultsUnchecked (False)-The network analysis layer
         file will not be saved.
         This is the default.
     overrides {String}:
         This parameter is for internal use only.
     save_route_data {Boolean}:
         Specifies whether the output includes a .zip file that contains a file
         geodatabase with the inputs and outputs of the analysis in a format
         that can be used to share route layers with ArcGIS Online or Portal
         for ArcGIS. Checked (True)-The route data will be saved as a
         .zip file.
         The file is downloaded to a temporary directory on your machine. In
         ArcGIS Pro, the location of the downloaded file can be determined by
         viewing the value for theparameter in the entry corresponding to the
         tool operation in the geoprocessing history of the project. In ArcMap,
         the location of the file can be determined by accessing theoption in
         the shortcut menu for theparameter in the entry corresponding to the
         tool operation in thewindow. Output Route DataCopy
         LocationOutput Route DataGeoprocessing ResultsUnchecked (False)-The
         route data will not be saved. This is the
         default.
     time_impedance {String}:
         If the impedance for the travel mode, as specified using
         theparameter, is time based, the values for theandparameters must be
         identical. Otherwise, the service will return an error. The
         time-based impedance value represents the travel time along road
         segments or on other parts of the transportation network.ImpedanceTime
         ImpedanceImpedanceMinutes-Time impedance will be
         minutes.TravelTime-Time impedance will
         be travel time.TimeAt1KPH-Time impedance will be time at one kilometer
         per hour.WalkTime-Time impedance will be walk time.TruckMinutes-Time
         impedance will be truck minutes.TruckTravelTime-Time impedance will be
         truck travel time.
     distance_impedance {String}:
         If the impedance for the travel mode, as specified using
         theparameter, is distance based, the values for theandparameters must
         be identical. Otherwise, the service will return an error. The
         distance-based impedance value represents the travel distance
         along road segments or on other parts of the transportation
         network.ImpedanceDistance ImpedanceImpedanceMiles-Distance impedance
         will be miles.Kilometers-Distance impedance
         will be kilometers.
     populate_stop_shapes {Boolean}:
         Specifies whether the tool will create the shapes for the output
         assigned and unassigned stops.Checked (True)-The output assigned and
         unassigned stops will be
         created as point features. This can be useful to visualize the stops
         that assigned to routes, as well as the stops that could not be
         assigned to any route.Unchecked (False)-The output assigned and
         unassigned stops will be
         created as tables and will not have shapes. This is the default. Use
         this option only if you don't need the application to visualize the
         output stops and can work with only the attributes of the stops.
     output_format {String}:
         Specifies the format in which the output features will be
         returned.Feature Set-The output features will be returned as feature
         classes
         and tables. This is the default.JSON File-The output features will be
         returned as a compressed file
         containing the JSON representation of the outputs. When this option is
         specified, the output is a single file (with a .zip extension) that
         contains one or more JSON files (with a .json extension) for each of
         the outputs created by the service.GeoJSON File-The output features
         will be returned as a compressed file
         containing the GeoJSON representation of the outputs. When this option
         is specified, the output is a single file (with a .zip extension) that
         contains one or more GeoJSON files (with a .geojson extension) for
         each of the outputs created by the service. When a file-based
         output format, such asor, is specified, no
         outputs will be added to the display because the application, such as
         ArcMap or ArcGIS Pro, cannot draw the contents of the result file.
         Instead, the result file is downloaded to a temporary directory on
         your machine. In ArcGIS Pro, the location of the downloaded file can
         be determined by viewing the value for theparameter in the entry
         corresponding to the tool operation in the geoprocessing history of
         the project. In ArcMap, the location of the file can be determined by
         accessing theoption in the shortcut menu of theparameter in the entry
         corresponding to the tool operation in thewindow. JSON
         FileGeoJSON FileOutput Result FileCopy LocationOutput Result
         FileGeoprocessing Results
     ignore_invalid_order_locations {Boolean}:
         Specifies whether invalid orders will be ignored when solving the
         vehicle routing problem.Checked (True)-The solve operation will ignore
         any invalid orders and
         return a solution as long as no other errors were encountered. If you
         need to generate routes and deliver them to drivers immediately, you
         may be able to ignore invalid orders, and solve and distribute the
         routes to your drivers. Then resolve any invalid orders from the last
         solve and include them in the VRP analysis for the next workday or
         work shift.Unchecked (False)-The solve operation will fail when any
         invalid
         orders are encountered. An invalid order is an order that the VRP
         solver can't reach. An order may be unreachable for a variety of
         reasons, including when the order is located on a prohibited network
         element, isn't on the network at all, or is on a disconnected part of
         the network.
     locate_settings {String}:
         Use this parameter to specify settings that affect how inputs are
         located, such as the maximum search distance to use when locating the
         inputs on the network or the network sources being used for locating.
         The locator JSON object has the following
         properties:Currently, you can't specify different source names for the
         sources array. Also, allowAutoRelocate is always set to true since the
         service does not support location fields. tolerance
         and toleranceUnits-Allows you to control the
         maximum search distance when locating inputs. If no valid network
         location is found within this distance, the input features will be
         considered unlocated. A small search tolerance decreases the
         likelihood of locating on the wrong street but increases the
         likelihood of not finding any valid network location. The
         toleranceUnits parameter value can be specified as one of the
         following values:
         esriCentimetersesriDecimalDegreesesriDecimetersesriFeetesriInchesesriI
         ntFeetesriIntInchesesriIntMilesesriIntNauticalMilesesriIntYardsesriKil
         ometersesriMetersesriMilesesriMillimetersesriNauticalMilesesriYards
         sources-Allows you to control which network source can be
         used for locating. For example, you can configure the analysis to
         locate inputs on streets but not on sidewalks. The list of possible
         sources on which to locate is specific to the network dataset this
         service references. Only the sources that are present in the sources
         array are used for locating. Sources is specified as an array of
         objects each having the following property:          name-The name of
         the network source feature class that can be used for
         locating inputsallowAutoRelocate-Allows you to control whether inputs
         with existing
         network location fields can be automatically relocated when solving to
         ensure valid, routable location fields for the analysis. If the value
         is true, points located on restricted network elements and points
         affected by barriers will be relocated to the closest routable
         location. If the value is false, network location fields will be used
         as is even if the points are unreachable, and this may cause the solve
         to fail. Even if the value is false, inputs with no location fields or
         incomplete location fields will be located during the solve
         operation.The parameter value is specified as a JSON object. The JSON
         object
         allows you to specify a locator JSON for all input feature in the
         analysis, or you can specify an override for a particular input. The
         override allows you to have different settings for each analysis
         input. For example, you can disallow stops to locate on highway ramps
         and allow point barriers to locate on highway ramps. When specifying
         the Locate_Settings JSON, you must provide the tolerance,
         toleranceUnits, and allowAutoRelocate properties. If you need to
         provide a different locator JSON for a particular input class, you
         must include the overrides property for that input. The property name
         must match the input parameter name. The locator JSON for a particular
         input doesn't need to include all the properties; you only need to
         include the properties that are different from the default locator
         JSON properties."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SolveVehicleRoutingProblem_agolservices(
                *gp_fixargs(
                    (
                        orders,
                        depots,
                        routes,
                        breaks,
                        time_units,
                        distance_units,
                        analysis_region,
                        default_date,
                        uturn_policy,
                        time_window_factor,
                        spatially_cluster_routes,
                        route_zones,
                        route_renewals,
                        order_pairs,
                        excess_transit_factor,
                        point_barriers,
                        line_barriers,
                        polygon_barriers,
                        use_hierarchy_in_analysis,
                        restrictions,
                        attribute_parameter_values,
                        populate_route_lines,
                        route_line_simplification_tolerance,
                        populate_directions,
                        directions_language,
                        directions_style_name,
                        travel_mode,
                        impedance,
                        time_zone_usage_for_time_fields,
                        save_output_layer,
                        overrides,
                        save_route_data,
                        time_impedance,
                        distance_impedance,
                        populate_stop_shapes,
                        output_format,
                        ignore_invalid_order_locations,
                        locate_settings,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Elevation toolset
@gptooldoc("Profile_agolservices", None)
def Profile(
    InputLineFeatures=None,
    ProfileIDField=None,
    DEMResolution: Literal["FINEST", "10m", "24m", "30m", "90m", "500m", "1000m"] | None = None,
    MaximumSampleDistance=None,
    MaximumSampleDistanceUnits: Literal["Meters", "Kilometers", "Feet", "Yards", "Miles"] | None = None,
) -> Result1[str | FeatureSet]:
    """Profile_agolservices(InputLineFeatures, {ProfileIDField}, {DEMResolution}, {MaximumSampleDistance}, {MaximumSampleDistanceUnits})

       Returns elevation profiles for the input line features.

    INPUTS:
     InputLineFeatures (Feature Set):
         The line features that will be profiled over the surface inputs.
     ProfileIDField {String}:
         A unique identifier to associate profiles with their corresponding
         input line features.
     DEMResolution {String}:
         Specifies the approximate spatial resolution (cell size) of the source
         elevation data used for the calculation.The resolution keyword is an
         approximation of the spatial resolution
         of the digital elevation model. Many elevation sources are distributed
         in units of arc seconds; the keyword is an approximation in meters for
         easier understanding.FINEST-The finest units available for the extent
         are used.10m-The
         elevation source resolution is 1/3 arc second or approximately
         10 meters.24m-The elevation source is the Airbus WorldDEM4Ortho
         dataset at 24
         meters resolution.30m-The elevation source resolution is 1 arc second
         or approximately
         30 meters.90m-The elevation source resolution is 3 arc seconds or
         approximately
         90 meters. This is the default.500m-The elevation source resolution is
         15 arc seconds or
         approximately 500 meters.1000m-The elevation source resolution is 30
         arc seconds or
         approximately 1000 meters.
     MaximumSampleDistance {Double}:
         The maximum sample distance along the line used to sample elevation
         values.
     MaximumSampleDistanceUnits {String}:
         Specifies the units for theparameter. Maximum Sample
         DistanceMeters-The units are meters. This is the
         default.Kilometers-The units
         are kilometers.Feet-The units are feet.Yards-The units are
         yards.Miles-The units are miles."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.Profile_agolservices(
                *gp_fixargs(
                    (
                        InputLineFeatures,
                        ProfileIDField,
                        DEMResolution,
                        MaximumSampleDistance,
                        MaximumSampleDistanceUnits,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("SummarizeElevation_agolservices", None)
def SummarizeElevation(
    InputFeatures=None,
    FeatureIDField=None,
    DEMResolution: Literal["FINEST", "10m", "24m", "30m", "90m"] | None = None,
    IncludeSlopeAspect: Literal["SLOPE_ASPECT", "NO_SLOPE_ASPECT"] | None = None,
) -> Result1[str | FeatureSet]:
    """SummarizeElevation_agolservices(InputFeatures, {FeatureIDField}, {DEMResolution}, {IncludeSlopeAspect})

       Calculates summary statistics of elevation for each input feature.

    INPUTS:
     InputFeatures (Feature Set):
         The input point, line, or area features for which the elevation will
         be summarized.
     FeatureIDField {String}:
         The unique ID field to use for the input features.
     DEMResolution {String}:
         Specifies the approximate spatial resolution (cell size) of the source
         elevation data used for the calculation.The resolution keyword is an
         approximation of the spatial resolution
         of the digital elevation model. Many elevation sources are distributed
         in units of arc seconds; the keyword is an approximation in meters for
         easier understanding.FINEST-The finest units available for the extent
         are used.10m-The
         elevation source resolution is 1/3 arc second or approximately
         10 meters.24m-The elevation source is the Airbus WorldDEM4Ortho
         dataset at 24
         meters resolution.30m-The elevation source resolution is 1 arc second
         or approximately
         30 meters.90m-The elevation source resolution is 3 arc seconds or
         approximately
         90 meters. This is the default.
     IncludeSlopeAspect {Boolean}:
         Specifies whether slope and aspect values for the input features will
         be included in the output in addition to the elevation
         values.SLOPE_ASPECT-Slope and aspect values will be included in the
         output.NO_SLOPE_ASPECT-Slope and aspect values will not be included in
         the
         output. This is the default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.SummarizeElevation_agolservices(
                *gp_fixargs((InputFeatures, FeatureIDField, DEMResolution, IncludeSlopeAspect), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("Viewshed_agolservices", None)
def Viewshed(
    InputPoints=None,
    MaximumDistance=None,
    MaximumDistanceUnits: Literal["Meters", "Kilometers", "Feet", "Yards", "Miles"] | None = None,
    DEMResolution: Literal["FINEST", "10m", "24m", "30m", "90m"] | None = None,
    ObserverHeight=None,
    ObserverHeightUnits: Literal["Meters", "Kilometers", "Feet", "Yards", "Miles"] | None = None,
    SurfaceOffset=None,
    SurfaceOffsetUnits: Literal["Meters", "Kilometers", "Feet", "Yards", "Miles"] | None = None,
    GeneralizeViewshedPolygons: Literal["GENERALIZE", "NO_GENERALIZE"] | None = None,
) -> Result1[str | FeatureSet]:
    """Viewshed_agolservices(InputPoints, {MaximumDistance}, {MaximumDistanceUnits}, {DEMResolution}, {ObserverHeight}, {ObserverHeightUnits}, {SurfaceOffset}, {SurfaceOffsetUnits}, {GeneralizeViewshedPolygons})

       Returns polygons of visible areas for a given set of input observation
       points.

    INPUTS:
     InputPoints (Feature Set):
         The point features to use as the observer locations.
     MaximumDistance {Double}:
         The maximum distance to calculate the viewshed.
     MaximumDistanceUnits {String}:
         Specifies the units for theparameter. Maximum
         DistanceMeters-The units are meters. This is the
         default.Kilometers-The units
         are kilometers.Feet-The units are feet.Yards-The units are
         yards.Miles-The units are miles.
     DEMResolution {String}:
         Specifies the approximate spatial resolution (cell size) of the source
         elevation data used for the calculation.The resolution keyword is an
         approximation of the spatial resolution
         of the digital elevation model. Many elevation sources are distributed
         in units of arc seconds; the keyword is an approximation in meters for
         easier understanding.FINEST-The finest units available for the extent
         are used.10m-The
         elevation source resolution is 1/3 arc second or approximately
         10 meters.24m-The elevation source is the Airbus WorldDEM4Ortho
         dataset at 24
         meters resolution.30m-The elevation source resolution is 1 arc second
         or approximately
         30 meters.90m-The elevation source resolution is 3 arc seconds or
         approximately
         90 meters. This is the default.
     ObserverHeight {Double}:
         The height above the surface of the observer. The default value of
         1.75 meters is an average height of a person. If you are looking from
         an elevated location such as an observation tower or a tall building,
         use that height instead.
     ObserverHeightUnits {String}:
         Specifies the units for theparameter. Observer
         HeightMeters-The units are meters. This is the default.Kilometers-The
         units
         are kilometers.Feet-The units are feet.Yards-The units are
         yards.Miles-The units are miles.
     SurfaceOffset {Double}:
         The height above the surface of the object you are viewing. The
         default value is 0. If you are viewing buildings or wind turbines, use
         their height.
     SurfaceOffsetUnits {String}:
         Specifies the units for theparameter. Surface
         OffsetMeters-The units are meters. This is the default.Kilometers-The
         units
         are kilometers.Feet-The units are feet.Yards-The units are
         yards.Miles-The units are miles.
     GeneralizeViewshedPolygons {Boolean}:
         Specifies whether the viewshed polygons will be generalized.The
         viewshed calculation is based on a raster elevation model that
         creates a result with stair-stepped edges. To create a more pleasing
         appearance and improve performance, the default behavior generalizes
         the polygons. This generalization will not change the accuracy of the
         result for any location more than one half of the DEM
         resolution.GENERALIZE-The viewshed polygons will be generalized. This
         is the
         default.NO_GENERALIZE-The viewshed polygons will not be generalized."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.Viewshed_agolservices(
                *gp_fixargs(
                    (
                        InputPoints,
                        MaximumDistance,
                        MaximumDistanceUnits,
                        DEMResolution,
                        ObserverHeight,
                        ObserverHeightUnits,
                        SurfaceOffset,
                        SurfaceOffsetUnits,
                        GeneralizeViewshedPolygons,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Hydrology toolset
@gptooldoc("TraceDownstream_agolservices", None)
def TraceDownstream(
    InputPoints=None,
    PointIDField=None,
    DataSourceResolution: Literal[" ", "FINEST", "10m", "30m", "90m"] | None = None,
    Generalize=None,
) -> Result1[str | FeatureSet]:
    """TraceDownstream_agolservices(InputPoints, {PointIDField}, {DataSourceResolution}, {Generalize})

       Determines the path water will take from a particular location to its
       furthest downhill path.

    INPUTS:
     InputPoints (Feature Set):
         The point features used for calculating downstream trace.
     PointIDField {Field}:
         An integer or string field used to identify the input points.The
         default is to use the unique ID field.
     DataSourceResolution {String}:
         Specifies the source data resolution that will be used in the
         analysis. The values are an approximation of the spatial resolution of
         the digital elevation model used to build the foundation hydrologic
         database. Since many elevation sources are distributed in units of arc
         seconds, an approximation is provided in meters for easier
         understanding.Blank-The hydrologic source, built from a 3-arc second
         data source,
         which is approximately 90-meter resolution elevation data, will be
         used.FINEST-The finest resolution available at each location from all
         possible data sources will be used. This is the default.10m-The
         hydrologic source, built from a 1/3 arc second data source,
         which is approximately 10-meter resolution elevation data, will be
         used.30m-The hydrologic source, built from a 1-arc second data source,
         which is approximately 30-meter resolution elevation data, will be
         used.90m-The hydrologic source, built from a 3-arc second data source,
         which is approximately 90-meter resolution elevation data, will be
         used.
     Generalize {Boolean}:
         Specifies whether the output downstream trace lines will be smoothed
         into simpler lines or conform to the cell centers of the original
         DEM.True-The lines will be smoothed into simpler lines.False-The lines
         will not be smoothed. Each trace line of output
         downstream trace have more vertices since they conform to the original
         DEM cell centers. This is the default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.TraceDownstream_agolservices(
                *gp_fixargs((InputPoints, PointIDField, DataSourceResolution, Generalize), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("Watershed_agolservices", None)
def Watershed(
    InputPoints=None,
    PointIDField=None,
    SnapDistance=None,
    SnapDistanceUnits: Literal["Meters", "Kilometers", "Feet", "Yards", "Miles"] | None = None,
    DataSourceResolution: Literal[" ", "FINEST", "10m", "30m", "90m"] | None = None,
    Generalize=None,
    ReturnSnappedPoints=None,
) -> Result2[str | FeatureSet, str | FeatureSet]:
    """Watershed_agolservices(InputPoints, {PointIDField}, {SnapDistance}, {SnapDistanceUnits}, {DataSourceResolution}, {Generalize}, {ReturnSnappedPoints})

       Determines the contributing area above each input point. A watershed
       is the upslope area that contributes flow.

    INPUTS:
     InputPoints (Feature Set):
         The point features used for calculating watersheds. These are referred
         to as pour points, because it is the location at which water pours out
         of the watershed.
     PointIDField {Field}:
         An integer or string field used to identify to the input points.The
         default is to use the unique ID field.
     SnapDistance {String}:
         The maximum distance to move the location of an input
         point.Interactive input points and documented gage locations may not
         exactly
         align with the stream location in the DEM. This parameter allows the
         service to move the point to a nearby location with the largest
         contributing area.By default, the snapping distance is calculated as
         the resolution of
         the source data multiplied by 5.
     SnapDistanceUnits {String}:
         The linear units specified for the snap distance.Meters-The units are
         meters. This is the default.Kilometers-The units
         are kilometers.Feet-The units are feet.Yards-The units are
         yards.Miles-The units are miles.
     DataSourceResolution {String}:
         Specifies the source data resolution that will be used in the
         analysis. The values are an approximation of the spatial resolution of
         the digital elevation model used to build the foundation hydrologic
         database. Since many elevation sources are distributed in units of arc
         seconds, an approximation is provided in meters for easier
         understanding.Blank-The hydrologic source, built from a 3-arc second
         data source,
         which is approximately 90-meter resolution elevation data, will be
         used.FINEST-The finest resolution available at each location from all
         possible data sources will be used. This is the default.10m-The
         hydrologic source, built from a 1/3 arc second data source,
         which is approximately 10-meter resolution elevation data, will be
         used.30m-The hydrologic source, built from a 1-arc second data source,
         which is approximately 30-meter resolution elevation data, will be
         used.90m-The hydrologic source, built from a 3-arc second data source,
         which is approximately 90-meter resolution elevation data, will be
         used.
     Generalize {Boolean}:
         Specifies whether the output watersheds will be smoothed into simpler
         shapes or conform to the cell edges of the original DEM.True-The
         polygon boundaries will be smoothed into simpler
         shapes.False-The edges of the polygons will conform to the cell edges
         of the
         original DEM. This is the default.
     ReturnSnappedPoints {Boolean}:
         Determines if a point feature at the watershed's pour point will be
         returned. If snapping is enabled, this might not be the same as the
         input point.True-A point feature will be returned.False-No point
         features will be
         returned. This is the default."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.Watershed_agolservices(
                *gp_fixargs(
                    (
                        InputPoints,
                        PointIDField,
                        SnapDistance,
                        SnapDistanceUnits,
                        DataSourceResolution,
                        Generalize,
                        ReturnSnappedPoints,
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

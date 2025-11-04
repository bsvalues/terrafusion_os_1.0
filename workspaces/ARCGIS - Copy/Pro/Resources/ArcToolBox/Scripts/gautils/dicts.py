"""
 Dictionaries for conversion of GP keywords to service keywords
 
 Some keys and values are the same.
"""

bdc_fields = {'SHORT': 'Int16',
              'LONG' : 'Int32',
              'FLOAT': 'Float32',
              'DOUBLE': 'Float64',
              'DATE': 'Date',
              'STRING': 'String',
              'BLOB': 'Binary',
              'BIG_INTEGER': 'Int64'}

pro_fields = {'Int8': 'SHORT',
              'Int16': 'SHORT',
              'Int32': 'LONG',
              'Int64': 'BIG_INTEGER',
              'Float32': 'FLOAT',
              'Float64': 'DOUBLE',
              'String': 'STRING',
              'Date': 'DATE',
              'Binary': 'BLOB'}

bdc_geometry = {'POINT': 'esriGeometryPoint',
                'LINE': 'esriGeometryPolyline',
                'POLYGON': 'esriGeometryPolygon',
                'NONE': 'NONE'}

bdc_time = {'INTERVAL': 'interval',
            'INSTANT': 'instant',
            'NONE': 'NONE'}

datastore = {'RELATIONAL_DATA_STORE': 'relational',
             'SPATIOTEMPORAL_DATA_STORE': 'spatiotemporal'}

datatype = {'DATE': 'DATE',
            'DOUBLE': 'DOUBLE',
            'INTEGER': 'INTEGER',
            'STRING': 'STRING'}
            
dissolve = {'ALL': 'ALL',
            'LIST': 'LIST',
            'NONE': 'NONE'}

dissolve_fields = {'DISSOLVE_FIELDS': 'TRUE',
                   'true': 'TRUE',
                   'NO_DISSOLVE_FIELDS': 'FALSE',
                   'false': 'FALSE'}

dwell_type = {'DWELL_FEATURES': 'DwellFeatures',
              'DWELL_MEAN_CENTERS': 'DwellMeanCenters',
              'DWELL_CONVEX_HULLS': 'DwellConvexHulls',
              'ALL_FEATURES': 'AllFeatures'}

enrich_type = {"DistNearest": "DistanceToNearest",
               "AttNearest": "AttributeOfNearest",
               "SumNearby": "AttributeSummaryOfRelated",
               "SumInt": "AttributeSummaryOfRelated"}

fill_type = {'ZEROS': 'ZEROS',
             'SPATIAL_NEIGHBORS': 'SPATIAL_NEIGHBORS',
             'SPACE_TIME_NEIGHBORS': 'SPACE_TIME_NEIGHBORS',
             'TEMPORAL_TREND': 'TEMPORAL_TREND'}

geodesic = {'GEODESIC': 'GEODESIC',
            'PLANAR': 'PLANAR'}

distance_method = {'GEODESIC': 'Geodesic',
                   'PLANAR': 'Planar'}

join = {'JOIN_ONE_TO_ONE': 'JoinOneToOne',
        'JOIN_ONE_TO_MANY': 'JoinOneToMany'}

join_keep_target = {'KEEP_ALL': 'True',
                    'true': 'True',
                    'KEEP_COMMON': 'False',
                    'false': 'False'}

join_include_distance = {'INCLUDE_DISTANCE': 'True',
                         'true': 'True',
                         'NO_INCLUDE_DISTANCE': 'False',
                         'false': 'False'}

linear_units = {'METERS': 'Meters',
                'KILOMETERS': 'Kilometers',
                'FEET': 'Feet',
                'YARDS': 'Yards',
                'MILES': 'Miles',
                'NAUTICAL_MILES': 'NauticalMiles',
                'FEET_INT': 'FeetInt',
                'YARDS_INT': 'YardsInt',
                'MILES_INT': 'MilesInt',
                'NAUTICAL_MILES_INT': 'NauticalMilesInt'}

linear_units_elevation = {'METERS': 'Meters',
                          'KILOMETERS': 'Kilometers',
                          'FEET': 'Feet',
                          'YARDS': 'Yards',
                          'MILES': 'Miles',
                          'FEET_INT': 'FeetInt',
                          'YARDS_INT': 'YardsInt',
                          'MILES_INT': 'MilesInt'}

area_units = {'SQUARE_METERS': 'SquareMeters',
              'SQUARE_KILOMETERS': 'SquareKilometers',
              'HECTARES': 'Hectares',
              'SQUARE_FEET': 'SquareFeet',
              'SQUARE_MILES': 'SquareMiles',
              'SQUARE_YARDS': 'SquareYards',
              'ACRES': 'Acres',
              'ACRES_US': 'AcresUS',
              'SQUARE_FEET_US': 'SquareFeetUS',
              'SQUARE_MILES_US': 'SquareMilesUS',
              'SQUARE_YARDS_US': 'SquareYardsUS'}

linear_units_old = {'METERS': 'Meters',
                    'KILOMETERS': 'Kilometers',
                    'FEET': 'Feet',
                    'YARDS': 'Yards',
                    'MILES': 'Miles',
                    'NAUTICAL_MILES': 'NauticalMiles'}

linear_units_elevation_old = {'METERS': 'Meters',
                              'KILOMETERS': 'Kilometers',
                              'FEET': 'Feet',
                              'YARDS': 'Yards',
                              'MILES': 'Miles'}

area_units_old = {'SQUARE_METERS': 'SquareMeters',
                  'SQUARE_KILOMETERS': 'SquareKilometers',
                  'HECTARES': 'Hectares',
                  'SQUARE_FEET': 'SquareFeet',
                  'SQUARE_MILES': 'SquareMiles',
                  'SQUARE_YARDS': 'SquareYards',
                  'ACRES': 'Acres'}


match = {'ATTRIBUTE_VALUES': 'AttributeValues',
         'ATTRIBUTE_PROFILES': 'AttributeProfiles'}

multipart = {'MULTI_PART': 'TRUE',
             'true': 'TRUE',
             'SINGLE_PART': 'FALSE',
             'false': 'FALSE'}

neighborhood_selection_method = {'USER_DEFINED': 'UserDefined'}

neighborhood_type = {'DISTANCE_BAND': 'DistanceBand',
                     'NUMBER_OF_NEIGHBORS': 'NumberOfNeighbors'}

output_mode = {'ALL_FEATURES': 'AllFeatures',
               'INCIDENTS': 'Incidents'}

snap_output_mode = {'ALL_FEATURES': 'AllFeatures',
                    'MATCHED_FEATURES': 'MatchedFeatures'}

overlay_method = {'INTERSECT': 'Intersect',
                  'ERASE': 'Erase',
                  'IDENTITY': 'Identity',
                  'UNION': 'Union',
                  'SYMMETRICAL_DIFFERENCE': 'SymmetricalDifference'}

prediction_type = {'TRAIN': 'Train',
                   'TRAIN_AND_PREDICT': 'TrainAndPredict'}

ellipse_size = {'1_STANDARD_DEVIATION': 1,
                '2_STANDARD_DEVIATIONS': 2,
                '3_STANDARD_DEVIATIONS': 3}

scad_summary_types = {'RETURN_CENTRAL_FEATURE': 'True',
                      'NO_CENTRAL_FEATURE': 'False',
                      'RETURN_MEAN_CENTER': 'True',
                      'NO_MEAN_CENTER': 'False',
                      'RETURN_MEDIAN_CENTER': 'True',
                      'NO_MEDIAN_CENTER': 'False',
                      'RETURN_ELLIPSE': 'True',
                      'NO_ELLIPSE': 'False',
                      'false': 'False',
                      'true' :'True',
                      }

similar = {'MOST_SIMILAR': 'MostSimilar',
           'LEAST_SIMILAR': 'LeastSimilar',
           'BOTH': 'Both'}

spatial = {'EQUALS': 'Equals',
           'INTERSECTS': 'Intersects',
           'NEAR': 'Near',
           'NEAR_PLANAR': 'NearPlanar',
           'NEAR_GEODESIC': 'NearGeodesic',
           'CONTAINS': 'Contains',
           'WITHIN': 'Within',
           'TOUCHES': 'Touches',
           'CROSSES': 'Crosses',
           'OVERLAPS': 'Overlaps'}

stat = {'COUNT': 'COUNT',
        'SUM': 'SUM',
        'MEAN': 'MEAN',
        'MIN': 'MIN',
        'MAX': 'MAX',
        'STDDEV': 'STDDEV',
        'VAR': 'VAR',
        'RANGE': 'RANGE',
        'ANY': 'ANY',
        'FIRST': 'FIRST',
        'LAST': 'LAST'}

swstat = {'COUNT': 'COUNT',
        'SUM': 'SUM',
        'MEAN': 'MEAN',
        'MIN': 'MIN',
        'MAX': 'MAX',
        'STDDEV': 'STDDEV',
        'VAR': 'VAR',
        'RANGE': 'RANGE',
        'ANY': 'ANY'}

swstat_weighted = {
        'MEAN': 'MEAN',
        'STDDEV': 'STDDEV',
        'VAR': 'VAR'}

# Same as 'stat' with change for STDDEV -- needed for
# Create Space Time Cube
stat_st = {'COUNT': 'COUNT',
           'SUM': 'SUM',
           'MEAN': 'MEAN',
           'MIN': 'MIN',
           'MAX': 'MAX',
           'STDDEV': 'STD',
           'VAR': 'VAR',
           'RANGE': 'RANGE',
           'ANY': 'ANY'}

temporal = {'MEETS': 'Meets',
            'MET_BY': 'MetBy',
            'OVERLAPS': 'Overlaps',
            'OVERLAPPED_BY': 'OverlappedBy',
            'DURING': 'During',
            'CONTAINS': 'Contains',
            'EQUALS': 'Equals',
            'FINISHES': 'Finishes',
            'FINISHED_BY': 'FinishedBy',
            'STARTS': 'Starts',
            'STARTED_BY': 'StartedBy',
            'INTERSECTS': 'Intersects',
            'NEAR': 'Near',
            'NEAR_BEFORE': 'NearBefore',
            'NEAR_AFTER': 'NearAfter',
            'NONE': ''}

time_alignment = {'START_TIME': 'StartTime',
                  'END_TIME': 'EndTime',
                  'REFERENCE_TIME': 'ReferenceTime'}

merge_type = {'REMOVE': 'Remove',
              'RENAME': 'Rename',
              'MATCH': 'Match'}

use_time = {'TIME': 'TRUE',
            'true': 'TRUE',
            'NO_TIME': 'FALSE',
            'false': 'FALSE'}

visible_geometry = {'GEOMETRY_VISIBLE': True,
                    'true': True,
                    'GEOMETRY_NOT_VISIBLE': False,
                    'false': False}

visible_time = {'TIME_VISIBLE': True,
                'true': True,
                'TIME_NOT_VISIBLE': False,
                'false': False}

has_header_row = {'HAS_HEADER': True,
                'true': True,
                'NO_HEADER': False,
                'false': False}

split_type = {'GAP': 'Gap',
              'FINISH_LAST': 'FinishLast',
              'START_NEXT': 'StartNext'}

motion_stats_units= {'YEARS':'Years',
                     'MONTHS':'Months',
                     'WEEKS':'Weeks',
                     'DAYS':'Days',
                     'HOURS':'Hours',
                     'MINUTES':'Minutes',
                     'SECONDS':'Seconds',
                     'MILLISECONDS':'Milliseconds',
                     'METERS_PER_SECOND':'MetersPerSecond',
                     'MILES_PER_HOUR':'MilesPerHour',
                     'KILOMETERS_PER_HOUR':'KilometersPerHour',
                     'FEET_PER_SECOND':'FeetPerSecond',
                     'NAUTICAL_MILES_PER_HOUR':'NauticalMilesPerHour',
                     'METERS_PER_SECOND_SQUARED':'MetersPerSecondSquared',
                     'FEET_PER_SECOND_SQUARED':'FeetPerSecondSquared'}

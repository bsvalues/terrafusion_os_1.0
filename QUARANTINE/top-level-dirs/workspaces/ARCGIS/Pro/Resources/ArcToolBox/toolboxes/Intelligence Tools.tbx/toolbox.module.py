# -*- coding: utf-8 -*-

'''
------------------------------------------------------------------------------
Intelligence Tools.pyt
------------------------------------------------------------------------------
requirements: ArcGIS 2.5, Python 3.6
author: ArcGIS Solutions for Intelligence
contact: intelsolutions@esri.com
company: Esri
------------------------------------------------------------------------------
* 11/21/2017 - phill - original writeup
* 10/09/2018 - mfunk - Added Least Cost Path
* 1/3/2019 - phill - Added Blind Spot tools
* 4/8/2019 - phill - Added tracks from point tools
* 2019-04-18 - mfunk - rename Create Blindspot to Blind Spot, create Blindspot Buffers to Blind Spot Buffers
* 2019-05-07 - mfunk - Product name change
* 2019-08-14 - mfunk - Add HLZ Suitability tools
* 2019-08-21 - mfunk - Move Alerts tools into Intelligence tools
* 2019-08-29 - phill - rename TracksFromPoints to PointsToTrackSegments, create Tracks From Points to Points To Track Segments
* 2019-08-29 - phill - rename modules CreateTracksToolClasses to PointsToTrackSegmentsToolClasses and createtrackinglayer to pointsToTrackSegments
* 2019-09-06 - mfunk - update lib references for Pro integration
* 2019-10-14 - mfunk - move imports into class init
* 2020-01-14 - mfunk - module rename for 'intel'
* 2020-03-06 - jjones - added PointClustering import
* 2020-03-20 - mfunk - un-updated conditon names (within distance of line/boundary)
* 2020-04-13 - jjones - add Movement Tools
* 2020-04-21 - mfunk - move for utb
* 2020-09-19 - jjones - added Classify Movement Events tool
* 2021-03-10 - jjones - added Create Location File From Text File tool
* 2021-07-12 - jjones - added Find Frequented Locations tool
* 2024-06-10 - mfunk - add Military Rasters to Mosaic Dataset
------------------------------------------------------------------------------
'''

from intel.analysis import GenerateCoverageAreas
from intel.analysis import GenerateBlindSpotAreas
from intel.movement import PointsToTrackSegments
from intel.mobility import DropZones
from intel.analysis import FindOverlaps
from intel.mobility import LeastCostPath
from intel.conversion import BatchImportData
from intel.mobility import DOFToObstacleFeatures
from intel.mobility import GenerateObstacleFeatures
from intel.mobility import GenerateHLZSuitability
from intel.movement import FindCotravelers
from intel.movement import FindMeetingLocations
from intel.movement import CompareAreas
from intel.movement import ClassifyMovementEvents
from intel.conversion import CreateLocationFileFromTextFile
from intel.movement import SelectMovementTracks
from intel.movement import FindFrequentedLocations
from intel.conversion import MilitaryRasterToMosaicDataset


class Toolbox(object):
    '''
    Intelligence Tools.pyt
    '''

    def __init__(self):
        '''
        Toolbox constructor
        initiallize toolbox and list tools participating
        '''

        self.label = "Intelligence Tools"
        self.alias = "intelligence"
        self.tools = [DropZones,
                      FindOverlaps,
                      GenerateBlindSpotAreas,
                      LeastCostPath,
                      GenerateCoverageAreas,
                      PointsToTrackSegments,
                      BatchImportData,
                      DOFToObstacleFeatures,
                      GenerateObstacleFeatures,
                      GenerateHLZSuitability,
                      FindCotravelers,
                      FindMeetingLocations,
                      CompareAreas,
                      ClassifyMovementEvents,
                      CreateLocationFileFromTextFile,
                      SelectMovementTracks,
                      FindFrequentedLocations,
                      MilitaryRasterToMosaicDataset,
                      ]

from MapAreaFeatureServiceHandler import FeatureServiceTask
from MapAreaTilesServiceHandler import TilesServiceTask
from MapAreaVTilesServiceHandler import VTilesServiceTask
from MapAreaServiceTaskBase import OfflineException
from MapAreaServiceTaskBase import RESTHandler
import MapAreaUtil
import json
import hostedgp as agolgp
import arcpy
#import sys, traceback

# refresh map area package.
#   Parameter
#        Packages
#        Options
#         Result (array of packages, status)

try:
    hgp = agolgp.HostedGP(None, None, False)
    packagesJson = arcpy.GetParameterAsText(0)
    packages = json.loads(packagesJson.replace('\\n', ''))
    result = []
    updateList = []

    for package in packages:
        # package ItemId
        itemId = None
        if 'itemId' in package:
            itemId = package['itemId']
        if itemId is None:
            try:
                raise OfflineException('MissingProperty', {'name': 'itemId'})
            except Exception as err:
                package['error'] = str(err)
                package['status'] = 'failed'
                package['state'] = 'unchanged'
                result.append(package)
            continue
        try:
            # look for token
            userInfo = None
            if 'userInfo' in package and 'token' in package['userInfo']:
                # use this token, if user present
                userInfo = package['userInfo']

            gwconn = RESTHandler(hgp, userInfo)

            item = gwconn.GetItem(itemId)

            itemType = item['type']

            itemInfo = {'item': item}

            if 'token' in package:
                # for service
                itemInfo['token'] = package['token']
                if 'referer' in package:
                    itemInfo['referer'] = package['referer']

            if itemType == 'Tile Package':
                ms = TilesServiceTask(hgp, None, itemInfo, userInfo)
                # set update flag
                updateList.append(ms)
            elif itemType == 'SQLite Geodatabase':
                fs = FeatureServiceTask(hgp, None, itemInfo, userInfo)
                updateList.append(fs)
            elif itemType == 'Vector Tile Package':
                vs = VTilesServiceTask(hgp, None, itemInfo, userInfo)
                updateList.append(vs)
        except Exception as err:
            # add error and put it in result list
            package['error'] = str(err)
            # package['status'] = 'failed'
            package['state'] = 'unchanged'
            result.append(package)

    outList = MapAreaUtil.CreateUpdatePackages(updateList)
    # outList = []
    result.extend(outList)
    arcpy.SetParameterAsText(1, json.dumps(result, ensure_ascii=False))
except Exception as err:
    arcpy.AddError(str(err))
    #exc_type, exc_value, exc_traceback = sys.exc_info()
    #stackTrace = traceback.extract_tb(exc_traceback,3)
    #arcpy.AddMessage(str(stackTrace))
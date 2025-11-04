# -*- #################
"""
Tool name: Create SQLite Database
Source: CreateSQLiteDatabase.py
Author: ESRI

Create a SQLite database of the selected flavor: ST_Geometry, SpatiaLite, GeoPackage.
"""

import arcpy
import os
import sys

def create_sqlite_database(in_sqlite_location, geometry_storage):
    """ create a new SQLite database. """

    # Strip the file extension from the location.
    in_sqlite_database = os.path.splitext(in_sqlite_location)[0] 

    # Verify that the target folder exists.
    if not(arcpy.Exists(os.path.dirname(in_sqlite_database))):
        arcpy.AddIDMessage("ERROR", 695)
        sys.exit (1)

    if arcpy.Exists(in_sqlite_location):
        if arcpy.env.overwriteOutput == False:
            arcpy.AddIDMessage("ERROR", 159, in_sqlite_location)
            if __name__ == '__main__':
                print (u'ERROR ' + arcpy.GetIDMessage(159))
                sys.exit(1)
            else:
                raise arcpy.ExecuteError (arcpy.GetIDMessage(159))

    # Create the SQLite dataset
    arcpy.gp.CreateSQLiteDB(in_sqlite_location ,geometry_storage)

if __name__ == "__main__":
    # Get the parameters from the script tool
    create_sqlite_database(arcpy.GetParameterAsText(0),
                   arcpy.GetParameterAsText(1))


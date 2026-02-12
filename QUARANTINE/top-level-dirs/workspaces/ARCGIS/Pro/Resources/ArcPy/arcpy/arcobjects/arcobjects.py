#COPYRIGHT 2018 ESRI
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

from arcpy.arcobjects import mixins
from arcpy.arcobjects._base import _BaseArcObject, passthrough_attr
from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

'This is an automatically generated file. Do not edit directly.'

class Annotation(_BaseArcObject):
    """Annotation Object doc"""

    from arcpy._mp import constants as _constants
    @_constants.maskargs
    def getGraphic(self, cim_version):
        """Annotation.getGraphic(cim_version)

           Return an Annotation object's CIM definition

             cim_version(String):
           A string that represents the major version of the CIM that will be used.

           * V2: The 2.x version of the CIM will be used.

           * V3: The 3.x version of the CIM will be used."""
        from arcpy.geoprocessing._base import gp_fixargs
        from arcpy.cim.cimloader import GetJSONTypeOBJ
        import json
        internalGraphic = self._arc_object.getGraphic(cim_version)
        if internalGraphic is not None:
           return GetJSONTypeOBJ(json.loads(convertArcObjectToPythonObject(internalGraphic)))
        else:
           return None

    def setGraphic(self, definition_object):
        """Annotation.setGraphic(definition_object)

           Sets an Annotation object's CIM definition.

             definition_object(String):"""
        from arcpy.geoprocessing._base import gp_fixargs
        from arcpy.cim.cimloader import  CimJsonEncoder
        import json
        if definition_object is not None:
            json_data = json.dumps(definition_object, cls=CimJsonEncoder)
        else:
            json_data = None
        return convertArcObjectToPythonObject(self._arc_object.setGraphic(json_data))

class ArcSDESQLExecute(mixins.ArcSDESQLExecuteMixin, _BaseArcObject):
    """The ArcSDESQLExecute class provides a means of executing SQL statements
       via an enterprise geodatabase connection."""
    transactionAutoCommit = passthrough_attr('transactionAutoCommit')
    def execute(self, *args):
        """ArcSDESQLExecute.execute(sql_statement)

           Sends the SQL statement to the database via an ArcSDE connection. If
           execute is run outside of a transaction, a commit will automatically
           take place once the SQL DML (INSERT, UPDATE, DELETE . . .) statement
           has been executed.

             sql_statement(Variant):
           The SQL statement.

           The execute method returns a list of lists in the case where the
           statement returns rows from a table; for statements that do not
           return rows, it will return an indication of the success or failure
           of the statement ( True for success; None for failure).  Statements
           that return a single value from a single row will return the value in
           an appropriate type (string, float, float)."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Execute(*gp_fixargs(args)))

    def startTransaction(self, *args):
        """ArcSDESQLExecute.startTransaction()

           To control when your changes are committed to the database, call the
           startTransaction method before calling execute. This starts a
           transaction and no DML statements will be committed until the
           commitTransaction method is called."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.StartTransaction(*gp_fixargs(args)))

    def rollbackTransaction(self, *args):
        """ArcSDESQLExecute.rollbackTransaction()

           Rollback any DML operations to the previous commit."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.RollbackTransaction(*gp_fixargs(args)))

    def commitTransaction(self, *args):
        """ArcSDESQLExecute.commitTransaction()

           No DML statements will be committed until the CommitTransaction
           method is called.

           A commit may also occur when the connection to ArcSDE it terminated
           (check specific DBMS documentation to see how each DBMS deals with a
           disconnect while in a transaction)."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.CommitTransaction(*gp_fixargs(args)))


class Array(mixins.ArrayMixin, _BaseArcObject):
    """The array object can contain points and arrays and is used to construct
       geometry objects."""
    count = passthrough_attr('count')

    def __next__(self, *args):
        """Array.__next__()

           Returns the next object at the current index."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Next(*gp_fixargs(args)))

    def add(self, *args):
        """Array.add(value)

           Adds a point or array object to the end of the array

             value(Object):
           Either a point or array object can be appended to the array."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Add(*gp_fixargs(args)))

    def getObject(self, *args):
        """Array.getObject(index)

           Returns the object at the given index position in the array.

             index(Integer):
           The index position of the array."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetObject(*gp_fixargs(args)))

    def reset(self, *args):
        """Array.reset()

           Sets the current enumeration index (used by the next method) back to
           the first element."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Reset(*gp_fixargs(args)))

    def next(self, *args):
        """Array.next()

           Returns the next object at the current index."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Next(*gp_fixargs(args)))

    def remove(self, *args):
        """Array.remove(index)

           Removes the object at the specified index position from the array.

             index(Integer):
           The index position that will be removed."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Remove(*gp_fixargs(args)))

    def removeAll(self, *args):
        """Array.removeAll()

           Removes all values and creates an empty object."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.RemoveAll(*gp_fixargs(args)))

    def insert(self, *args):
        """Array.insert(index, value)

           Adds an object to the array at the specified index.

             index(Integer):
           The index position of the array.

             value(Object):
           Either a point or array object can be inserted into the array."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Insert(*gp_fixargs(args)))

    def replace(self, *args):
        """Array.replace(index, value)

           Replaces the object at the specified index position in the array.

             index(Integer):
           The index position that will be replaced.

             value(Object):
           The new point or array object to be added to the array."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Replace(*gp_fixargs(args)))

    def clone(self, *args):
        """Array.clone(point_object)

           Clone the point object.

             point_object(Point):
           A point object."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Clone(*gp_fixargs(args)))


class Cursor(mixins.CursorMixin, _BaseArcObject):
    """A cursor is a data access object that can be used either to iterate
       through the set of rows in a table or to insert new rows into a table.
       Cursors have three forms: search, insert, or update. Cursors are
       commonly used to read and update attributes."""

    def __next__(self, *args):
        """Cursor.__next__()

           Returns the next object at the current index."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Next(*gp_fixargs(args)))

    def reset(self, *args):
        """Cursor.reset()

           Sets the current enumeration index (used by the next method) back to
           the first element."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Reset(*gp_fixargs(args)))

    def next(self, *args):
        """Cursor.next()

           Returns the next object at the current index."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Next(*gp_fixargs(args)))

    def newRow(self, *args):
        """Cursor.newRow()

           Creates an empty row object."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.NewRow(*gp_fixargs(args)))

    def updateRow(self, *args):
        """Cursor.updateRow(row)

           The updateRow method can be used to update the row at the current
           position of an update cursor.

             row(Row):
           The row used to update the current position of the cursor."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.UpdateRow(*gp_fixargs(args)))

    def insertRow(self, *args):
        """Cursor.insertRow(row)

           Inserts a new row into the database.

             row(Row):
           The row to be inserted."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.InsertRow(*gp_fixargs(args)))

    def deleteRow(self, *args):
        """Cursor.deleteRow(row)

           Deletes a row in the database. The row corresponding to the current
           position of the cursor will be deleted.

             row(Row):
           The row to be deleted."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.DeleteRow(*gp_fixargs(args)))


class Extent(mixins.ExtentMixin, _BaseArcObject):
    """An extent is a rectangle specified by providing the coordinate of the
       lower left corner and the coordinate of the upper right corner in map
       units."""
    XMin = passthrough_attr('XMin')
    YMin = passthrough_attr('YMin')
    XMax = passthrough_attr('XMax')
    YMax = passthrough_attr('YMax')
    MMin = passthrough_attr('MMin')
    MMax = passthrough_attr('MMax')
    ZMin = passthrough_attr('ZMin')
    ZMax = passthrough_attr('ZMax')
    width = passthrough_attr('width')
    height = passthrough_attr('height')
    depth = passthrough_attr('depth')
    lowerLeft = passthrough_attr('lowerLeft')
    lowerRight = passthrough_attr('lowerRight')
    upperLeft = passthrough_attr('upperLeft')
    upperRight = passthrough_attr('upperRight')
    spatialReference = passthrough_attr('spatialReference')
    geohash = passthrough_attr('geohash')
    geohashNeighbors = passthrough_attr('geohashNeighbors')
    geohashCovers = passthrough_attr('geohashCovers')
    polygon = passthrough_attr('polygon')
    JSON = passthrough_attr('JSON')
    def contains(self, second_geometry, relation=None):
        """Extent.contains(second_geometry)

           Indicates if the base geometry contains the comparison geometry.

           contains is the opposite of within .

           Only True relationships are shown in this illustration.  Possible
           contains relationships

             second_geometry(Object):
           A second geometry."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Contains(*gp_fixargs((second_geometry, relation))))

    def crosses(self, second_geometry):
        """Extent.crosses(second_geometry)

           Indicates if the two geometries intersect in a geometry of a lesser
           shape type.

           Two polylines cross if they share only points in common, at least
           one of which is not an endpoint. A polyline and an polygon cross if
           they share a polyline or a point (for vertical line) in common on
           the interior of the polygon which is not equivalent to the entire
           polyline.

           Only True relationships are shown in this illustration.  Possible
           crosses relationships

             second_geometry(Object):
           A second geometry."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Crosses(*gp_fixargs([second_geometry])))

    def disjoint(self, second_geometry):
        """Extent.disjoint(second_geometry)

           Indicates if the base and comparison geometries share no points in
           common.

           Two
           geometries intersect if disjoint returns False .

           Only True relationships are shown in this illustration.  Possible
           disjoint relationships

             second_geometry(Object):
           A second geometry."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Disjoint(*gp_fixargs([second_geometry])))

    def equals(self, second_geometry):
        """Extent.equals(second_geometry)

           Indicates if the base and comparison geometries are of the same shape
           type and define the
           same set of points in the plane.  This is a 2D comparison  only; M
           and Z values are ignored.

           Only True relationships are shown in this illustration.  Possible
           equals relationships

             second_geometry(Object):
           A second geometry."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Equals(*gp_fixargs([second_geometry])))

    def overlaps(self, second_geometry):
        """Extent.overlaps(second_geometry)

           Indicates if the intersection of the two geometries has the same
           shape type as one of the input geometries and is not equivalent to
           either of the input geometries.

           Only True relationships are shown in this illustration.  Possible
           overlaps relationships

             second_geometry(Object):
           A second geometry."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Overlaps(*gp_fixargs([second_geometry])))

    def touches(self, second_geometry):
        """Extent.touches(second_geometry)

           Indicates if the boundaries of the geometries intersect.

           Two geometries touch when the intersection of the
           geometries is not empty, but the intersection of their interiors is
           empty. For example, a point touches a polyline only if the point is
           coincident with one of the polyline end points.

           Only True relationships are shown in this illustration.  Possible
           touches relationships

             second_geometry(Object):
           A second geometry."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Touches(*gp_fixargs([second_geometry])))

    def within(self, second_geometry, relation=None):
        """Extent.within(second_geometry)

           Indicates if the base geometry is within the comparison geometry.

           within is the opposite operator of contains .

           Only True relationships are shown in this illustration.

             Possible within relationships

             second_geometry(Object):
           A second geometry."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Within(*gp_fixargs((second_geometry, relation))))

    def projectAs(self, spatial_reference, transformation_name=None):
        """Extent.projectAs(spatial_reference, {transformation_name})

           Projects a geometry and optionally applies a geotransformation.

           To project, the geometry needs to have a spatial reference, and not
           have an UnknownCoordinateSystem . The new spatial reference system
           passed to the method defines the output coordinate system. If either
           spatial reference is unknown the coordinates will not be changed. The
           Z- and measure values are not changed by the ProjectAs method.

             spatial_reference(SpatialReference):
           The new spatial reference.
           This can be a SpatialReference object or the coordinate system name.

             transformation_name{String}:
           The geotransformation name."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.ProjectAs(*gp_fixargs((spatial_reference, transformation_name))))

    def _repr_html_(self, *args):
        """Extent.exportToString()
           Exports the object to its string representation."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object._repr_html_(*gp_fixargs(args)))

class FeatureSet(mixins.FeatureSetMixin, _BaseArcObject):
    """FeatureSet objects are a lightweight representation of a feature class.
       They are a special data element that contains not only schema, but also
       the data. The FeatureSet object is also how feature data is sent and
       received from the server."""
    JSON = passthrough_attr('JSON')
    GeoJSON = passthrough_attr("GEOJSON")
    def load(self, *args, **kwargs):
        """FeatureSet.load(table_path)

           Import from a table.

             table_path(String):
           The table to be imported.
             where_clause(String):
           An SQL expression used to select a subset of records.
             time_filter(String):
           The time instant or the time extent to query.
             renderer(String):
           Renderer of the FeatureSet.
             is_renderer(Bool):
           Specifies the type of the value used with the renderer.
             geojson_geometry_type(String):
           Specifieds the type of geometry to load from geojson."""
        from arcpy.geoprocessing._base import gp_fixargs, gp_fixkwargs
        return convertArcObjectToPythonObject(self._arc_object.Load(*gp_fixargs(args),
                                                                    **gp_fixkwargs(kwargs)))

    def save(self, *args):
        """FeatureSet.save(table_path)

           Export to a table.

             table_path(String):
           The output table to be created."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Save(*gp_fixargs(args)))


class Field(mixins.FieldMixin, _BaseArcObject):
    """The field object represents a column in a table. A field has many
       properties, the most obvious ones being its name and its type."""
    name = passthrough_attr('name')
    aliasName = passthrough_attr('aliasName')
    baseName = passthrough_attr('baseName')
    domain = passthrough_attr('domain')
    type = passthrough_attr('type')
    length = passthrough_attr('length')
    precision = passthrough_attr('precision')
    scale = passthrough_attr('scale')
    editable = passthrough_attr('editable')
    isNullable = passthrough_attr('isNullable')
    required = passthrough_attr('required')
    defaultValue = passthrough_attr('defaultValue')


class FieldInfo(mixins.FieldInfoMixin, _BaseArcObject):
    """Provides field info methods and properties for layer and table views."""
    count = passthrough_attr('count')
    def addField(self, *args):
        """FieldInfo.addField(field_name, new_field_name, visible, split_rule)

           Adds a field info entry

             field_name(String):
           The field name from the input feature class or table.

             new_field_name(String):
           Sets the field name for the new layer or table view.

             visible(String):
           Sets whether the field is visible or hidden.

            * VISIBLE:   Field is visible.

            * HIDDEN:   Field is hidden.

             split_rule(String):
           Sets the behavior of an attribute's values when a feature is split.

            * NONE:   The attributes of the two resulting features take on a
            copy of the original value.

            * RATIO:   The attributes of resulting features are a ratio of the
            original feature's value. The ratio is based on the division of the
            original geometry. If the geometry is divided equally, each new
            feature's attribute gets one-half of the value of the original
            object's attribute."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.AddField(*gp_fixargs(args)))

    def getFieldName(self, *args):
        """FieldInfo.getFieldName(index)

           Gets the field name from the table by index position.

             index(Integer):
           The index position."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetFieldName(*gp_fixargs(args)))

    def getNewName(self, *args):
        """FieldInfo.getNewName(index)

           Gets the new field name from the table by index position.

             index(Integer):
           The index position."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetNewName(*gp_fixargs(args)))

    def getSplitRule(self, *args):
        """FieldInfo.getSplitRule(index)

           Gets the split rule from the table by index position.

             index(String):
           The index position."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetSplitRule(*gp_fixargs(args)))

    def getVisible(self, *args):
        """FieldInfo.getVisible(index)

           Gets the visible flag from the table by index position.

             index(String):
           The index position."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetVisible(*gp_fixargs(args)))

    def setFieldName(self, *args):
        """FieldInfo.setFieldName(index, field_name)

           Sets the field name into the table.

             index(Integer):
           The index position.

             field_name(String):
           The field name to set into the table."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.SetFieldName(*gp_fixargs(args)))

    def setNewName(self, *args):
        """FieldInfo.setNewName(index, new_field_name)

           Sets the new field name into the table.

             index(None):
           The index position.

             new_field_name(String):
           The new field name to set into the table."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.SetNewName(*gp_fixargs(args)))

    def setSplitRule(self, *args):
        """FieldInfo.setSplitRule(index, rule)

           Sets the split rule into the table.

             index(Integer):
           The index position.

             rule(String):
           The split rule to set into the table.

            * NONE:   The attributes of the two resulting features take on a
            copy of the original value.

            * RATIO:   The attributes of resulting features are a ratio of the
            original feature's value. The ratio is based on the division of the
            original geometry. If the geometry is divided equally, each new
            feature's attribute gets one-half of the value of the original
            object's attribute."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.SetSplitRule(*gp_fixargs(args)))

    def setVisible(self, *args):
        """FieldInfo.setVisible(index, visible)

           Set the visible flag of a field on the table.

             index(Integer):
           The index position.

             visible(String):
           The visible policy to set into the table.

            * VISIBLE:   Field is visible.

            * HIDDEN:   Field is hidden."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.SetVisible(*gp_fixargs(args)))

    def removeField(self, *args):
        """FieldInfo.removeField(index)

           Removes the field info entry from a table.

             index(Integer):
           The index position of the field info object."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.RemoveField(*gp_fixargs(args)))

    def findFieldByName(self, *args):
        """FieldInfo.findFieldByName(field_name)

           Finds the field index by field name

             field_name(String):
           The field name used to find its index position"""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.FindFieldByName(*gp_fixargs(args)))

    def findFieldByNewName(self, *args):
        """FieldInfo.findFieldByNewName(field_name)

           Finds the field index by new field name.

             field_name(String):
           The new field name used to find its index position."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.FindFieldByNewName(*gp_fixargs(args)))

    def loadFromString(self, *args):
        """FieldInfo.loadFromString(string)

           Restore the object using its string representation.     The
           exportToString method can be used to create a string representation.

             string(String):
           The string representation of the object."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.LoadFromString(*gp_fixargs(args)))

    def exportToString(self, *args):
        """FieldInfo.exportToString()

           Exports the object to its string representation."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.ExportToString(*gp_fixargs(args)))


class FieldMap(mixins.FieldMapMixin, _BaseArcObject):
    """The FieldMap object provides a field definition and a list of input
       fields taken from a set of tables or feature classes."""
    mergeRule = passthrough_attr('mergeRule')
    outputField = passthrough_attr('outputField')
    joinDelimiter = passthrough_attr('joinDelimiter')
    inputFieldCount = passthrough_attr('inputFieldCount')
    def addInputField(self, *args):
        """FieldMap.addInputField(table_dataset, field_name, {start_position},
           {end_position})

           Adds input field to the field map.

             table_dataset(String):
           The table added to the field map.

             field_name(String):
           The input field name.

             start_position{Integer}:
           The start position of an input text value.

             end_position{Integer}:
           The end position of an input text value."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.AddInputField(*gp_fixargs(args)))

    def getInputTableName(self, *args):
        """FieldMap.getInputTableName(index)

           Gets the name of an input table from the field map, based on the
           table's index.

             index(Integer):
           The index position."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetInputTableName(*gp_fixargs(args)))

    def getInputFieldName(self, *args):
        """FieldMap.getInputFieldName(index)

           Gets the name of an input field from the field map, based on the
           field's index.

             index(Integer):
           The index position."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetInputFieldName(*gp_fixargs(args)))

    def getStartTextPosition(self, *args):
        """FieldMap.getStartTextPosition(index)

           Gets start text position from the field map.

             index(Integer):
           The index position."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetStartTextPosition(*gp_fixargs(args)))

    def getEndTextPosition(self, *args):
        """FieldMap.getEndTextPosition(index)

           Gets end text position from the field map.

             index(Integer):
           The index position."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetEndTextPosition(*gp_fixargs(args)))

    def removeAll(self, *args):
        """FieldMap.removeAll()

           Removes all values and creates an empty object."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.RemoveAll(*gp_fixargs(args)))

    def removeInputField(self, *args):
        """FieldMap.removeInputField(index)

           Removes an input field from the field map.

             index(Integer):
           The index position."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.RemoveInputField(*gp_fixargs(args)))

    def findInputFieldIndex(self, *args):
        """FieldMap.findInputFieldIndex(table_dataset, field_name)

           Finds an input field from the field map.

             table_dataset(String):
           The table added to the field map.

             field_name(String):
           The field name."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.FindInputFieldIndex(*gp_fixargs(args)))

    def setStartTextPosition(self, *args):
        """FieldMap.setStartTextPosition(index, start_position)

           Sets the start text position from the field map.

             index(Integer):
           The index position.

             start_position(Integer):
           The start position of an input text value."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.SetStartTextPosition(*gp_fixargs(args)))

    def setEndTextPosition(self, *args):
        """FieldMap.setEndTextPosition(index, end_position)

           Sets end text position for the field map.

             index(Integer):
           The index position.

             end_position(Integer):
           The end position of an input text value."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.SetEndTextPosition(*gp_fixargs(args)))


class FieldMappings(mixins.FieldMappingsMixin, _BaseArcObject):
    """The FieldMappings object is a collection of FieldMap objects and it is
       used as the parameter value for tools that perform field mapping, such as
       Merge."""
    fieldValidationWorkspace = passthrough_attr('fieldValidationWorkspace')
    fieldCount = passthrough_attr('fieldCount')
    fields = passthrough_attr('fields')
    fieldMappings = passthrough_attr('fieldMappings')
    def addTable(self, *args):
        """FieldMappings.addTable(table_dataset)

           Adds a table to the field mappings object.

             table_dataset(String):
           The table to add to the field mappings object."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.AddTable(*gp_fixargs(args)))

    def removeAll(self, *args):
        """FieldMappings.removeAll()

           Removes all values and creates an empty object."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.RemoveAll(*gp_fixargs(args)))

    def addFieldMap(self, *args):
        """FieldMappings.addFieldMap(field_map)

           Add a field map to the field mappings.

             field_map(FieldMap):
           The field map to add to the field mappings"""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.AddFieldMap(*gp_fixargs(args)))

    def getFieldMap(self, *args):
        """FieldMappings.getFieldMap(index)

           Gets a field map from the field mappings.

             index(Integer):
           The index position of the field map."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetFieldMap(*gp_fixargs(args)))

    def replaceFieldMap(self, *args):
        """FieldMappings.replaceFieldMap(index, value)

           Replace a field map within the field mappings.

             index(Integer):
           The index position of the field map to be replaced.

             value(FieldMap):
           The replacement field map."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.ReplaceFieldMap(*gp_fixargs(args)))

    def removeFieldMap(self, *args):
        """FieldMappings.removeFieldMap(index)

           Removes a field map from the field mappings.

             index(Integer):
           The index position of the field map."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.RemoveFieldMap(*gp_fixargs(args)))

    def findFieldMapIndex(self, *args):
        """FieldMappings.findFieldMapIndex(field_map_name)

           Find a field map within the field mappings by name.

             field_map_name(String):
           Find the field map by name."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.FindFieldMapIndex(*gp_fixargs(args)))

    def loadFromString(self, *args):
        """FieldMappings.loadFromString(string)

           Restore the object using its string representation.     The
           exportToString method can be used to create a string representation.

             string(String):
           The string representation of the object."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.LoadFromString(*gp_fixargs(args)))

    def exportToString(self, *args):
        """FieldMappings.exportToString()

           Exports the object to its string representation."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.ExportToString(*gp_fixargs(args)))


class Filter(_BaseArcObject):
    """The filter object allows you to specify the choices available for a
       parameter."""
    type = passthrough_attr('type')
    list = passthrough_attr('list')


class GeoProcessor(_BaseArcObject):
    messageCount = passthrough_attr('messageCount')
    maxSeverity = passthrough_attr('maxSeverity')
    parameterCount = passthrough_attr('parameterCount')
    toolbox = passthrough_attr('toolbox')
    overwriteOutput = passthrough_attr('overwriteOutput')
    useCompatibleFieldTypes = passthrough_attr('useCompatibleFieldTypes')
    logHistory = passthrough_attr('logHistory')
    logLineage = passthrough_attr('logLineage')
    scriptVersion = passthrough_attr('scriptVersion')
    severityLevel = passthrough_attr('severityLevel')
    def getInstallInfo(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetInstallInfo(*gp_fixargs(args)))

    def listInstallations(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.ListInstallations(*gp_fixargs(args)))

    def setProgressor(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.SetProgressor(*gp_fixargs(args)))

    def resetProgressor(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.ResetProgressor(*gp_fixargs(args)))

    def setProgressorLabel(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.SetProgressorLabel(*gp_fixargs(args)))

    def setProgressorPosition(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.SetProgressorPosition(*gp_fixargs(args)))

    def resetEnvironments(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.ResetEnvironments(*gp_fixargs(args)))

    def clearEnvironment(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.ClearEnvironment(*gp_fixargs(args)))

    def getMessage(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetMessage(*gp_fixargs(args)))

    def getSeverity(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetSeverity(*gp_fixargs(args)))

    def getReturnCode(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetReturnCode(*gp_fixargs(args)))

    def getMessages(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetMessages(*gp_fixargs(args)))

    def getAllMessages(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetAllMessages(*gp_fixargs(args)))

    def addMessage(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.AddMessage(*gp_fixargs(args)))

    def addIDMessage(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.AddIDMessage(*gp_fixargs(args)))

    def getIDMessage(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetIDMessage(*gp_fixargs(args)))

    def addError(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.AddError(*gp_fixargs(args)))

    def addWarning(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.AddWarning(*gp_fixargs(args)))

    def addReturnMessage(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.AddReturnMessage(*gp_fixargs(args)))

    def productInfo(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.ProductInfo(*gp_fixargs(args)))

    def setProduct(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.SetProduct(*gp_fixargs(args)))

    def checkProduct(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.CheckProduct(*gp_fixargs(args)))

    def checkOutExtension(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.CheckOutExtension(*gp_fixargs(args)))

    def checkInExtension(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.CheckInExtension(*gp_fixargs(args)))

    def checkExtension(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.CheckExtension(*gp_fixargs(args)))

    def getParameterAsText(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetParameterAsText(*gp_fixargs(args)))

    def setParameterAsText(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.SetParameterAsText(*gp_fixargs(args)))

    def getParameter(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetParameter(*gp_fixargs(args)))

    def setParameter(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.SetParameter(*gp_fixargs(args)))

    def copyParameter(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.CopyParameter(*gp_fixargs(args)))

    def setParameterSymbology(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.SetParameterSymbology(*gp_fixargs(args)))

    def listFiles(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.ListFiles(*gp_fixargs(args)))

    def listTools(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.ListTools(*gp_fixargs(args)))

    def listEnvironments(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.ListEnvironments(*gp_fixargs(args)))

    def listToolboxes(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.ListToolboxes(*gp_fixargs(args)))

    def addToolbox(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.AddToolbox(*gp_fixargs(args)))

    def removeToolbox(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.RemoveToolbox(*gp_fixargs(args)))

    def getSystemEnvironment(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetSystemEnvironment(*gp_fixargs(args)))

    def command(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Command(*gp_fixargs(args)))

    def usage(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Usage(*gp_fixargs(args)))

    def exists(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Exists(*gp_fixargs(args)))

    def listFeatureClasses(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.ListFeatureClasses(*gp_fixargs(args)))

    def listDatasets(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.ListDatasets(*gp_fixargs(args)))

    def listTables(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.ListTables(*gp_fixargs(args)))

    def listRasters(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.ListRasters(*gp_fixargs(args)))

    def listRasterProducts(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.ListRasterProducts(*gp_fixargs(args)))

    def listWorkspaces(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.ListWorkspaces(*gp_fixargs(args)))

    def listVersions(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.ListVersions(*gp_fixargs(args)))

    def listUsers(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.ListUsers(*gp_fixargs(args)))

    def disconnectUser(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.DisconnectUser(*gp_fixargs(args)))

    def listFields(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.ListFields(*gp_fixargs(args)))

    def listIndexes(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.ListIndexes(*gp_fixargs(args)))

    def searchCursor(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.SearchCursor(*gp_fixargs(args)))

    def updateCursor(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.UpdateCursor(*gp_fixargs(args)))

    def insertCursor(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.InsertCursor(*gp_fixargs(args)))

    def describe(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Describe(*gp_fixargs(args)))

    def createObject(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.CreateObject(*gp_fixargs(args)))

    def validateFieldName(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.ValidateFieldName(*gp_fixargs(args)))

    def validateTableName(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.ValidateTableName(*gp_fixargs(args)))

    def parseFieldName(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.ParseFieldName(*gp_fixargs(args)))

    def parseTableName(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.ParseTableName(*gp_fixargs(args)))

    def createScratchName(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.CreateScratchName(*gp_fixargs(args)))

    def createUniqueName(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.CreateUniqueName(*gp_fixargs(args)))

    def testSchemaLock(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.TestSchemaLock(*gp_fixargs(args)))

    def createRandomValueGenerator(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.CreateRandomValueGenerator(*gp_fixargs(args)))

    def isSynchronous(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.IsSynchronous(*gp_fixargs(args)))

    def getParameterCount(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetParameterCount(*gp_fixargs(args)))

    def getParameterValue(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetParameterValue(*gp_fixargs(args)))

    def getParameterInfo(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetParameterInfo(*gp_fixargs(args)))

    def addFieldDelimiters(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.AddFieldDelimiters(*gp_fixargs(args)))

    def listPrinterNames(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.ListPrinterNames(*gp_fixargs(args)))

    def wildcardMatch(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.WildcardMatch(*gp_fixargs(args)))

    def alterAliasName(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.AlterAliasName(*gp_fixargs(args)))

    def listSpatialReferences(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.ListSpatialReferences(*gp_fixargs(args)))

    def listTransformations(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.ListTransformations(*gp_fixargs(args)))

    def acceptConnections(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.AcceptConnections(*gp_fixargs(args)))

    def logUsageMetering(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.LogUsageMetering(*gp_fixargs(args)))

    def createGPSDDraft(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.CreateGPSDDraft(*gp_fixargs(args)))

    def fromEsriJson(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.FromEsriJson(*gp_fixargs(args)))

    def listDataStoreItems(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.ListDataStoreItems(*gp_fixargs(args)))

    def validateDataStoreItem(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.ValidateDataStoreItem(*gp_fixargs(args)))

    def removeDataStoreItem(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.RemoveDataStoreItem(*gp_fixargs(args)))

    def addDataStoreItem(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.AddDataStoreItem(*gp_fixargs(args)))

    def getSigninToken(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetSigninToken(*gp_fixargs(args)))

    def getActivePortalURL(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetActivePortalURL(*gp_fixargs(args)))

    def listPortalURLs(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.ListPortalURLs(*gp_fixargs(args)))

    def getPortalDescription(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetPortalDescription(*gp_fixargs(args)))

    def getPortalInfo(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetPortalInfo(*gp_fixargs(args)))

    def decryptPYT(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.DecryptPYT(*gp_fixargs(args)))

    def encryptPYT(self, *args):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.EncryptPYT(*gp_fixargs(args)))


class Geometry(mixins.GeometrySpecializationMixin, _BaseArcObject):
    """Geometry objects define a spatial location and an associated geometric
       shape."""
    labelPoint = passthrough_attr('labelPoint')
    type = passthrough_attr('type')
    extent = passthrough_attr('extent')
    trueCentroid = passthrough_attr('trueCentroid')
    firstPoint = passthrough_attr('firstPoint')
    lastPoint = passthrough_attr('lastPoint')
    isMultipart = passthrough_attr('isMultipart')
    hullRectangle = passthrough_attr('hullRectangle')
    area = passthrough_attr('area')
    length = passthrough_attr('length')
    length3D = passthrough_attr('length3D')
    partCount = passthrough_attr('partCount')
    pointCount = passthrough_attr('pointCount')
    centroid = passthrough_attr('centroid')
    WKB = passthrough_attr('WKB')
    WKT = passthrough_attr('WKT')
    spatialReference = passthrough_attr('spatialReference')
    JSON = passthrough_attr('JSON')
    hasCurves = passthrough_attr("hasCurves")

    def _repr_svg_(self):
        """SVG representation"""
        svg_top = '<svg xmlns="http://www.w3.org/2000/svg" ' \
            'xmlns:xlink="http://www.w3.org/1999/xlink" '

        # Establish SVG canvas that will fit all the data + small space
        xmin = self.extent.XMin
        ymin = self.extent.YMin
        xmax = self.extent.XMax
        ymax = self.extent.YMax
        if xmin == xmax and ymin == ymax:
            # This is a point; buffer using an arbitrary size
            buffer_extent = self.buffer(1).extent
            xmin = buffer_extent.XMin
            ymin = buffer_extent.YMin
            xmax = buffer_extent.XMax
            ymax = buffer_extent.YMax
        else:
            # Expand bounds by a fraction of the data ranges
            expand = 0.04  # or 4%, same as R plots
            widest_part = max([xmax - xmin, ymax - ymin])
            expand_amount = widest_part * expand
            xmin -= expand_amount
            ymin -= expand_amount
            xmax += expand_amount
            ymax += expand_amount
        dx = xmax - xmin
        dy = ymax - ymin
        width = min([max([100., dx]), 300])
        height = min([max([100., dy]), 300])
        try:
            scale_factor = max([dx, dy]) / max([width, height])
        except ZeroDivisionError:
            scale_factor = 1.
        view_box = "{0} {1} {2} {3}".format(xmin, ymin, dx, dy)
        transform = "matrix(1,0,0,-1,0,{0})".format(ymax + ymin)
        return svg_top + (
            'width="{1}" height="{2}" viewBox="{0}" '
            'preserveAspectRatio="xMinYMin meet">'
            '<g transform="{3}">{4}</g></svg>'
            ).format(view_box, width, height, transform,
                     self.__getSVG__(scale_factor))

    def __getSVG__(self, scale_factor=1., color=None):
      """Returns SVG element for geometry.

            Parameters
            ==========
            scale_factor : float, optional
                Multiplication factor for the SVG circle diameter or stroke width. Default is 1.
            color : str, optional
                Hex string for fill or stroke color. Default is to use "#66cc99"
      """
            
      import json
      
      def _get_SVG_point(geom, scale_factor, fill_color):
        if fill_color is None:
            fill_color = "#66cc99"
        return (
            '<circle cx="{0.X}" cy="{0.Y}" r="{1}" '
            'stroke="#555555" stroke-width="{2}" fill="{3}" opacity="0.6" />'
            ).format(geom.getPart(), 3 * scale_factor, 1 * scale_factor, fill_color)
      
      def _get_SVG_multipoint(geom, scale_factor, fill_color):
        if fill_color is None:
            fill_color = "#66cc99"
        return '<g>' + \
              ''.join(('<circle cx="{0}" cy="{1}" r="{2}" '
                        'stroke="#555555" stroke-width="{3}" fill="{4}" opacity="0.6" />'
                        ).format(p[0], p[1], 3 * scale_factor, 1 * scale_factor, fill_color) \
                      for p in json.loads(geom.JSON)['points']) + \
              '</g>'

      def _get_SVG_polyline(geom, scale_factor, stroke_color):
        if stroke_color is None:
            stroke_color = "#66cc99"
        paths = []

        geom_json = json.loads(geom.JSON)

        if 'paths' not in geom_json:
            densify_geom = geom.densify('DISTANCE', 1.0, 0.1)
            geom_json = json.loads(densify_geom.JSON)

        if not geom_json['paths']:  # empty paths
            return '<g />'

        for path in geom_json['paths']:
            pnt_format = " ".join(["{0},{1}".format(*c) for c in path])
            s = ('<polyline fill="none" stroke="{2}" stroke-width="{1}" '
                'points="{0}" opacity="0.8" />').format(pnt_format, 2. * scale_factor, stroke_color)
            paths.append(s)
        return "<g>" + "".join(paths) + "</g>"
      
      def _get_SVG_polygon(geom, scale_factor, fill_color):
        if fill_color is None:
            fill_color = "#66cc99"

        geom_json = json.loads(geom.JSON)

        if 'rings' not in geom_json:
            densify_geom = geom.densify('ANGLE', -1, 0.1)
            geom_json = json.loads(densify_geom.JSON)

        if not geom_json['rings']:  # empty rings
            return '<g />'

        path = ''

        for ring in geom_json['rings']:
            path += ' M {},{}'.format(*ring[0])
            for x, y, *_ in ring[1:]:
                path += ' L {},{}'.format(x, y)

        path += ' z'

        return (
            '<path fill-rule="evenodd" fill="{2}" stroke="#555555" '
            'stroke-width="{0}" opacity="0.6" d="{1}" />'
            ).format(2. * scale_factor, path, fill_color)
      
      mapping = {
          "point": _get_SVG_point,
          "multipoint": _get_SVG_multipoint,
          "polyline": _get_SVG_polyline,
          "polygon": _get_SVG_polygon
      }

      return mapping[self.__type_string__](self, scale_factor, color)

    def getPart(self, *args):
        """Geometry.getPart({index})

           Returns an array of point objects for a particular part of geometry
           or an array containing a number of arrays, one for each part.

             index{Integer}:
           The index position of the geometry."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetPart(*gp_fixargs(args)))

    def contains(self, second_geometry, relation=None):
        """Geometry.contains(second_geometry)

           Indicates if the base geometry contains the comparison geometry.

           contains is the opposite of within .

           Only True relationships are shown in this illustration.  Possible
           contains relationships

             second_geometry(Object):
           A second geometry."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Contains(*gp_fixargs((second_geometry, relation))))

    def crosses(self, second_geometry):
        """Geometry.crosses(second_geometry)

           Indicates if the two geometries intersect in a geometry of a lesser
           shape type.

           Two polylines cross if they share only points in common, at least
           one of which is not an endpoint. A polyline and an polygon cross if
           they share a polyline or a point (for vertical line) in common on
           the interior of the polygon which is not equivalent to the entire
           polyline.

           Only True relationships are shown in this illustration.  Possible
           crosses relationships

             second_geometry(Object):
           A second geometry."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Crosses(*gp_fixargs([second_geometry])))

    def disjoint(self, second_geometry):
        """Geometry.disjoint(second_geometry)

           Indicates if the base and comparison geometries share no points in
           common.

           Two
           geometries intersect if disjoint returns False .

           Only True relationships are shown in this illustration.  Possible
           disjoint relationships

             second_geometry(Object):
           A second geometry."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Disjoint(*gp_fixargs([second_geometry])))

    def equals(self, second_geometry):
        """Geometry.equals(second_geometry)

           Indicates if the base and comparison geometries are of the same shape
           type and define the
           same set of points in the plane.  This is a 2D comparison  only; M
           and Z values are ignored.

           Only True relationships are shown in this illustration.  Possible
           equals relationships

             second_geometry(Object):
           A second geometry."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Equals(*gp_fixargs([second_geometry])))

    def overlaps(self, second_geometry):
        """Geometry.overlaps(second_geometry)

           Indicates if the intersection of the two geometries has the same
           shape type as one of the input geometries and is not equivalent to
           either of the input geometries.

           Only True relationships are shown in this illustration.  Possible
           overlaps relationships

             second_geometry(Object):
           A second geometry."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Overlaps(*gp_fixargs([second_geometry])))

    def touches(self, second_geometry):
        """Geometry.touches(second_geometry)

           Indicates if the boundaries of the geometries intersect.

           Two geometries touch when the intersection of the
           geometries is not empty, but the intersection of their interiors is
           empty. For example, a point touches a polyline only if the point is
           coincident with one of the polyline end points.

           Only True relationships are shown in this illustration.  Possible
           touches relationships

             second_geometry(Object):
           A second geometry."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Touches(*gp_fixargs([second_geometry])))

    def within(self, second_geometry, relation=None):
        """Geometry.within(second_geometry)

           Indicates if the base geometry is within the comparison geometry.

           within is the opposite operator of contains .

           Only True relationships are shown in this illustration.

             Possible within relationships

             second_geometry(Object):
           A second geometry."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Within(*gp_fixargs((second_geometry, relation))))

    def projectAs(self, spatial_reference, transformation_name=None):
        """Geometry.projectAs(spatial_reference, {transformation_name})

           Projects a geometry and optionally applies a geotransformation.

           To project, the geometry needs to have a spatial reference, and not
           have an UnknownCoordinateSystem . The new spatial reference system
           passed to the method defines the output coordinate system. If either
           spatial reference is unknown the coordinates will not be changed. The
           Z- and measure values are not changed by the ProjectAs method.

             spatial_reference(SpatialReference):
           The new spatial reference.
           This can be a SpatialReference object or the coordinate system name.

             transformation_name{String}:
           The geotransformation name."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.ProjectAs(*gp_fixargs((spatial_reference, transformation_name))))

    def positionAlongLine(self, value, use_percentage=False, geodesic=False):
        """Geometry.positionAlongLine(value, {use_percentage})

           Returns a point on a line at a specified distance from
           the beginning of the line.

             value(Double):
           The distance along the line.

           If the distance is less than zero, then the starting point of the
           line will be returned; if the distance is greater than the length of
           the line, then the end point of the line will be returned.

             use_percentage{Boolean}:
           The distance may be specified as a fixed unit of measure or a ratio
           of the length of the line.

           If True, value is used as a percentage; if False, value is used as a
           distance.  For percentages, the value should be expressed as a double
           from 0.0 (0%) to 1.0 (100%).

             geodesic{Boolean}:
           Indication of whether the distance measure is geodesic based or not.

           If True, the distance measure is treated as geodesic; if False, the
           distance measure is treated as planar.
           """
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.PositionAlongLine(*gp_fixargs((value, use_percentage, geodesic))))

    def queryPointAndDistance(self, in_point, use_percentage=False):
        """Geometry.queryPointAndDistance(in_point, {as_percentage})

           Finds the point on the polyline nearest to the in_point and the
           distance between those points.  Also returns information about the
           side of the line the in_point is on as well as the distance along the
           line where the nearest point occurs.

             in_point(PointGeometry):
           The input point ( PointGeometry or Point ).

             as_percentage{Boolean}:
           If False , the measure will be returned as a distance; if True , the
           measure will be returned as a percentage."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.QueryPointAndDistance(*gp_fixargs((in_point, use_percentage))))

    def snapToLine(self, in_point):
        """Geometry.snapToLine(in_point)

           Returns a new point based on in_point snapped to this geometry.

             in_point(PointGeometry):
           A point ( PointGeometry or Point ) to be snapped to the line."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.SnapToLine(*gp_fixargs((in_point,))))

    def measureOnLine(self, in_point, use_percentage=False):
        """Geometry.measureOnLine(in_point, {use_percentage})

           Returns a measure from the start point of this line to the in_point .

             in_point(PointGeometry):
           A point ( PointGeometry or Point ) that is used to measure from the
           start point of the polyline.

             use_percentage{Boolean}:
           If False , the measure will be returned as a distance; if True , the
           measure will be returned as a percentage."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.MeasureOnLine(*gp_fixargs((in_point, use_percentage))))

    def generalize(self, distance):
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Generalize(*gp_fixargs((distance,))))

    def getLength(self, method="GEODESIC", units=None):
        """Geometry.getLength({method}, {units})

           Returns the length of the feature using a measurement type.

             method{String}:
           PLANAR measurements reflect the projection of geographic data onto
           the 2D surface (in other words, they will not take into account the
           curvature of the earth). GEODESIC , GREAT_ELLIPTIC , LOXODROME ,  and
           PRESERVE_SHAPE measurement types may be chosen as an alternative, if
           desired.

            * GEODESIC: The shortest line between any two points on the earth's
            surface on a spheroid (ellipsoid). One use for a geodesic line is
            when you want to determine the shortest distance between two cities
            for an airplane's flight path. This is also known as a great circle
            line if based on a sphere rather than an ellipsoid.

            * GREAT_ELLIPTIC: The line on a spheroid (ellipsoid) defined by the
            intersection at the surface by a plane that passes through the
            center of the spheroid and the start and endpoints of a segment.
            This is also known as a great circle when a sphere is used.

            * LOXODROME: A loxodrome is not the shortest distance between two
            points but instead defines the line of constant bearing, or azimuth.
            Great circle routes are often broken into a series of loxodromes,
            which simplifies navigation. This is also known as a rhumb line.

            * PLANAR: Planar measurements use 2D Cartesian mathematics to
            calculate lengths and areas. This option is only available when
            measuring in a projected coordinate system and the 2D plane of that
            coordinate system will be used as the basis for the measurements.

            * PRESERVE_SHAPE: This type calculates the area or length of the
            geometry on the surface of the earth ellipsoid, for geometry defined
            in a projected or geographic coordinate system. This option
            preserves the shape of the geometry in its coordinate system.

             units{String}:
           The units in which the length will be calculated.

           Linear unit of measure keywords: CENTIMETERS | DECIMETERS | FEET |
           INCHES | KILOMETERS | METERS | MILES | MILLIMETERS | NAUTICALMILES |
           YARDS"""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetLength(*gp_fixargs((method, units))))

    def getArea(self, method="GEODESIC", units=None):
        """Geometry.getArea({method}, {units})

           Returns the area of the feature using a measurement type.

             method{String}:
           PLANAR measurements reflect the projection of geographic data onto
           the 2D surface (in other words, they will not take into account the
           curvature of the earth). GEODESIC , GREAT_ELLIPTIC , LOXODROME ,  and
           PRESERVE_SHAPE measurement types may be chosen as an alternative, if
           desired.

            * GEODESIC: The shortest line between any two points on the earth's
            surface on a spheroid (ellipsoid). One use for a geodesic line is
            when you want to determine the shortest distance between two cities
            for an airplane's flight path. This is also known as a great circle
            line if based on a sphere rather than an ellipsoid.

            * GREAT_ELLIPTIC: The line on a spheroid (ellipsoid) defined by the
            intersection at the surface by a plane that passes through the
            center of the spheroid and the start and endpoints of a segment.
            This is also known as a great circle when a sphere is used.

            * LOXODROME: A loxodrome is not the shortest distance between two
            points but instead defines the line of constant bearing, or azimuth.
            Great circle routes are often broken into a series of loxodromes,
            which simplifies navigation. This is also known as a rhumb line.

            * PLANAR: Planar measurements use 2D Cartesian mathematics to
            calculate lengths and areas. This option is only available when
            measuring in a projected coordinate system and the 2D plane of that
            coordinate system will be used as the basis for the measurements.

            * PRESERVE_SHAPE: This type calculates the area or length of the
            geometry on the surface of the earth ellipsoid, for geometry defined
            in a projected or geographic coordinate system. This option
            preserves the shape of the geometry in its coordinate system.

             units{String}:
           The units in which the area will be calculated.

           Areal unit of measure keywords: ACRES | ARES | HECTARES |
           SQUARECENTIMETERS | SQUAREDECIMETERS | SQUAREINCHES | SQUAREFEET |
           SQUAREKILOMETERS | SQUAREMETERS | SQUAREMILES | SQUAREMILLIMETERS |
           SQUAREYARDS"""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetArea(*gp_fixargs((method, units))))

    def getGeohash(self, precision=8):
        """getGeohash(precision)

           Converts a PointGeometry in geographic coordinate system coordinates
           of latitude and longitude to a geohash string that is accurate to an
           arbitrary precision within a bounding box in the geohash grid.

             precision(Integer):
           The precision length of the hash string to return for the
           PointGeometry . The minimum length is 1 and the maximum length is 20.
           The default length is 8."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetGeohash(*gp_fixargs((precision,))))

    def segmentAlongLine(self, start_measure, end_measure, use_percentage=False):
        """Geometry.segmentAlongLine(start_measure, end_measure,
           {use_percentage})

           Returns a Polyline between start and end measures. Similar to
           Polyline.positionAlongLine but will return a polyline segment between
           two points on the polyline instead of a single point.

             start_measure(Double):
           The starting distance from the beginning of the line.

             end_measure(Double):
           The ending distance from the beginning of the line.

             use_percentage{Boolean}:
           The start and end measures may be specified as fixed units or as a
           ratio.

           If True, start_measure and end_measure are used as a percentage; if
           False, start_measure and end_measure are used as a distance.  For
           percentages, the measures should be expressed as a double from 0.0 (0
           percent) to 1.0 (100 percent)."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.SegmentAlongLine(*gp_fixargs((start_measure, end_measure, use_percentage))))

    def angleAndDistanceTo(self, other_geometry, method='GEODESIC'):
        """Geometry.angleAndDistanceTo(other, {method})

           Returns a tuple of angle and distance to another point using a
           measurement type.

             other(PointGeometry):
           The second geometry.

             method{String}:
           PLANAR measurements reflect the projection of geographic data onto
           the 2D surface (in other words, they will not take into account the
           curvature of the earth). GEODESIC , GREAT_ELLIPTIC , LOXODROME ,  and
           PRESERVE_SHAPE measurement types may be chosen as an alternative, if
           desired.

            * GEODESIC: The shortest line between any two points on the earth's
            surface on a spheroid (ellipsoid). One use for a geodesic line is
            when you want to determine the shortest distance between two cities
            for an airplane's flight path. This is also known as a great circle
            line if based on a sphere rather than an ellipsoid.

            * GREAT_ELLIPTIC: The line on a spheroid (ellipsoid) defined by the
            intersection at the surface by a plane that passes through the
            center of the spheroid and the start and endpoints of a segment.
            This is also known as a great circle when a sphere is used.

            * LOXODROME: A loxodrome is not the shortest distance between two
            points but instead defines the line of constant bearing, or azimuth.
            Great circle routes are often broken into a series of loxodromes,
            which simplifies navigation. This is also known as a rhumb line.

            * PLANAR: Planar measurements use 2D Cartesian mathematics to
            calculate lengths and areas. This option is only available when
            measuring in a projected coordinate system and the 2D plane of that
            coordinate system will be used as the basis for the measurements.

            * PRESERVE_SHAPE: This type calculates the area or length of the
            geometry on the surface of the earth ellipsoid, for geometry defined
            in a projected or geographic coordinate system. This option
            preserves the shape of the geometry in its coordinate system."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.AngleAndDistanceTo(*gp_fixargs((other_geometry, method))))

    def pointFromAngleAndDistance(self, angle, distance, method='GEODESIC'):
        """Geometry.pointFromAngleAndDistance(angle, distance, {method})

           Returns a point at a given angle and distance in degrees and meters
           using the specified measurement type.

             angle(Double):
           The angle in degrees to the returned point.

             distance(Double):
           The distance in meters to the returned point.

             method{String}:
           PLANAR measurements reflect the projection of geographic data onto
           the 2D surface (in other words, they will not take into account the
           curvature of the earth). GEODESIC , GREAT_ELLIPTIC , LOXODROME ,  and
           PRESERVE_SHAPE measurement types may be chosen as an alternative, if
           desired.

            * GEODESIC: The shortest line between any two points on the earth's
            surface on a spheroid (ellipsoid). One use for a geodesic line is
            when you want to determine the shortest distance between two cities
            for an airplane's flight path. This is also known as a great circle
            line if based on a sphere rather than an ellipsoid.

            * GREAT_ELLIPTIC: The line on a spheroid (ellipsoid) defined by the
            intersection at the surface by a plane that passes through the
            center of the spheroid and the start and endpoints of a segment.
            This is also known as a great circle when a sphere is used.

            * LOXODROME: A loxodrome is not the shortest distance between two
            points but instead defines the line of constant bearing, or azimuth.
            Great circle routes are often broken into a series of loxodromes,
            which simplifies navigation. This is also known as a rhumb line.

            * PLANAR: Planar measurements use 2D Cartesian mathematics to
            calculate lengths and areas. This option is only available when
            measuring in a projected coordinate system and the 2D plane of that
            coordinate system will be used as the basis for the measurements.

            * PRESERVE_SHAPE: This type calculates the area or length of the
            geometry on the surface of the earth ellipsoid, for geometry defined
            in a projected or geographic coordinate system. This option
            preserves the shape of the geometry in its coordinate system."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.PointFromAngleAndDistance(*gp_fixargs((angle, distance, method))))

    def boundary(self):
        """Geometry.boundary()

           Constructs the boundary of the geometry.   Boundary operator"""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Boundary())

    def buffer(self, distance):
        """Geometry.buffer(distance)

           Constructs a polygon at a specified distance from the geometry.
           Buffer operator

             distance(Double):
           The buffer distance.

           The buffer distance is in the same units as the geometry that
           is being buffered.

           A negative distance can only be specified against a polygon geometry."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Buffer(*gp_fixargs((distance,))))

    def clip(self, envelope):
        """Geometry.clip(envelope)

           Constructs the intersection of the geometry and the specified extent.
           Clip operator

             envelope(Extent):
           An extent object used to define the clip extent."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Clip(*gp_fixargs((envelope,))))

    def convexHull(self):
        """Geometry.convexHull()

           Constructs the geometry that is the minimal bounding polygon such
           that all outer
           angles are convex.   ConvexHull operator"""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.ConvexHull())

    def difference(self, other):
        """Geometry.difference(other)

           Constructs the geometry that is composed only of the region unique to
           the
           base geometry but not part of the other geometry. The following
           illustration shows the results when the red polygon is the source
           geometry.   Difference operator

             other(Object):
           A second geometry."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Difference(*gp_fixargs((other,))))

    def intersect(self, other, dimension):
        """Geometry.intersect(other, dimension)

           Constructs a geometry that is the geometric intersection of
           the two input geometries. Different dimension values can be used to
           create different shape types.

           The intersection of two geometries of the same shape type is a
           geometry containing only the regions of overlap between the
           original geometries.  Intersect operator

           For faster results, test if the two geometries are disjoint before
           calling intersect .

             other(Object):
           The second geometry.

             dimension(Integer):
           The topological dimension (shape type) of the resulting geometry.

            * 1: A zero-dimensional geometry (point or multipoint).

            * 2: A one-dimensional geometry (polyline).

            * 4: A two-dimensional geometry (polygon)."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Intersect(*gp_fixargs((other, dimension))))

    def symmetricDifference(self, other):
        """Geometry.symmetricDifference(other)

           Constructs
           the geometry that is the union of two geometries minus the
           instersection of those geometries.

           The two input geometries must be the same shape type.
           symmetricDifference operator

             other(Object):
           A second geometry."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.SymmetricDifference(*gp_fixargs((other,))))

    def union(self, other):
        """Geometry.union(other)

           Constructs the geometry that is the set-theoretic union of the input
           geometries.

           The two geometries being unioned must be the same shape type.  Union
           operator

             other(Object):
           A second geometry."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Union(*gp_fixargs((other,))))

    def distanceTo(self, other):
        """Geometry.distanceTo(other)

           Returns the minimum distance between two geometries. If the
           geometries intersect, the minimum distance is 0.

           Both geometries must have the same projection.

             other(Object):
           A second geometry."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.DistanceTo(*gp_fixargs((other,))))

    def cut(self, other):
        """Geometry.cut(cutter)

           Splits this geometry into a part left of the cutting polyline, and a
           part right of it.

           When a polyline or polygon is cut, it is split where it intersects
           the cutter polyline. Each piece is classified as left of or right of
           the cutter. This classification is based on the orientation of the
           cutter line. Parts of the target polyline that do not intersect the
           cutting polyline are returned as part of the right of result for that
           input polyline. If a geometry is not cut, the left geometry will be
           empty ( None ).  Cut operator

             cutter(PolyLine):
           The cutting polyline geometry."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Cut(*gp_fixargs((other,))))

    def densify(self, method, distance=0, deviation=None):
        """Geometry.densify(method, distance, deviation)

           Creates a new geometry with

           added vertices.

             method(String):
           The method of densification, DISTANCE , ANGLE , or GEODESIC .

            * DISTANCE: Creates a new  feature that is a piecewise linear
            approximation of the input.

            * ANGLE: Creates a new  feature that is a piecewise linear
            approximation of the input. Vertices are introduced at points where
            the angle between tangents at those points is the provided angle .

            * GEODESIC: Densifies and reshapes segments between input vertices
            so that the output segments follow the shortest ground path
            connecting input vertices.

             distance(Double):
           The maximum distance between vertices.  The actual distance between
           vertices will usually be less than the maximum distance as new
           vertices will be evenly distributed along the original segment.

           If using a type of DISTANCE or ANGLE , the distance is measured in
           the units of the geometry's spatial reference. If using a type of
           GEODESIC , the distance is measured in meters.

             deviation(Double):
           Densify uses straight lines to approximate curves. You use deviation
           to control the accuracy of this approximation. The deviation is the
           maximum distance between the new segment and the original curve. The
           smaller its value, the more segments will be required to approximate
           the curve.

           If using a type of DISTANCE , the deviation is measured in the units
           of the geometry's spatial reference. If using a type of ANGLE , the
           deviation is measured in radians. If using a type of GEODESIC , the
           deviation is not used."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Densify(*gp_fixargs((method, distance, deviation))))

    def move(self, dx=0.0, dy=0.0, dz=None):
        """Geometry.move(dx, dy, dz)

           Moves the exsiting geometry by adding x units in the X direction,
           y units in the Y direction, and z unitds in z direction.

             dx{double}:
           Shifts in the x direction.
             dy{double}:
           Shifts in the y direction.
             dz{double}:
           Shifts in the z direction."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.move(*gp_fixargs((dx, dy, dz))))
  
    def scale(self, origin=None, sx=1.0, sy=1.0, sz=None):
        """Geometry.scale(origin, sx, sy, sz)
        
           Scales the existing geometry.
             
             origin{arcpy.Point | arcpy.PointGeometry}:
           The origin around which the geometry will be scaled.
             sx{double}:
           The scale factor along the X-axis.
             sy{double}:
           The scale factor along the Y-axis.
             sz{double}:
           The scale factor along the Z-axis.
        """
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.scale(*gp_fixargs((origin, sx, sy, sz))))
    
    def rotate(self, origin=None, rotation_angle=0.0):
        """Geometry.rotate(rotation_angle, origin)
        
           Rotates the existing geometry.
           
             origin{arcpy.Point | arcpy.PointGeometry}:
           The origin around which the geometry will be rotated. Default value
           is (0, 0).
             rotation_angle{double}:
           The angle of rotation in the units of radians. Default is 0.
        """
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.rotate(*gp_fixargs((origin, rotation_angle))))

    def reverseOrientation(self):
      """Geometry.reverseOrientation()
        
         Reverse the orientation of a polyline.
      """
      return convertArcObjectToPythonObject(self._arc_object.reverseorientation())


class Index(_BaseArcObject):
    """The Index object contains information about an index on a table. There
       are two types of indexes: spatial and attribute. Spatial indexes exist on
       the shape field of a feature class."""
    name = passthrough_attr('name')
    isAscending = passthrough_attr('isAscending')
    isUnique = passthrough_attr('isUnique')
    fields = passthrough_attr('fields')


class NetCDFFileProperties(mixins.NetCDFFilePropertiesMixin, _BaseArcObject):
    """The Network Common Data Form (netCDF) is a binary, self-describing,
       machine-independent file format for storing scientific data.

       Learn more about netCDF"""
    def getAttributeNames(self, *args):
        """NetCDFFileProperties.getAttributeNames({variable_name})

           Gets the attribute names of a variable in a NetCDF file.

             variable_name{String}:
           Variable name of the NetCDF file."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetAttributeNames(*gp_fixargs(args)))

    def getAttributeValue(self, *args):
        """NetCDFFileProperties.getAttributeValue(variable_name, attribute_name)

           Get the value of an attribute.

             variable_name(String):
           Variable name of the netCDF file.

             attribute_name(String):
           Attribute name of the netCDF file."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetAttributeValue(*gp_fixargs(args)))

    def getDimensionIndex(self, *args):
        """NetCDFFileProperties.getDimensionIndex(dimension_name, value)

           Gets the dimension index.

             dimension_name(String):
           Dimension name of the NetCDF file.

             value(Integer):
           The dimension value."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetDimensionIndex(*gp_fixargs(args)))

    def getDimensions(self, *args):
        """NetCDFFileProperties.getDimensions()

           Gets the dimensions."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetDimensions(*gp_fixargs(args)))

    def getDimensionsByVariable(self, *args):
        """NetCDFFileProperties.getDimensionsByVariable(variable_name)

           Gets the dimensions by variable.

             variable_name(String):
           Variable name of the NetCDF file."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetDimensionsByVariable(*gp_fixargs(args)))

    def getDimensionSize(self, *args):
        """NetCDFFileProperties.getDimensionSize(dimension_name)

           Gets the dimension size.

             dimension_name(String):
           Dimension name of the NetCDF file."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetDimensionSize(*gp_fixargs(args)))

    def getDimensionValue(self, *args):
        """NetCDFFileProperties.getDimensionValue(dimension_name, index)

           Gets the dimension value.

             dimension_name(String):
           Dimension name of the NetCDF file.

             index(Integer):
           The index position."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetDimensionValue(*gp_fixargs(args)))

    def getFieldType(self, *args):
        """NetCDFFileProperties.getFieldType(name)

           Gets the field type of a variable or dimension.

             name(String):
           Variable or dimension name of the NetCDF file."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetFieldType(*gp_fixargs(args)))

    def getSpatialReference(self, *args):
        """NetCDFFileProperties.getSpatialReference(variable_name, x_dimension,
           y_dimension)

           Gets the spatial reference of a variable.

             variable_name(String):
           Variable name of the NetCDF file.

             x_dimension(Integer):
           The x-dimension.

             y_dimension(Integer):
           The y-dimension."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetSpatialReference(*gp_fixargs(args)))

    def getVariables(self, *args):
        """NetCDFFileProperties.getVariables()

           Gets the variables."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetVariables(*gp_fixargs(args)))

    def getVariablesByDimension(self, *args):
        """NetCDFFileProperties.getVariablesByDimension(dimension_name)

           Get the variables by dimension.

             dimension_name(String):
           Variable name of the netCDF file"""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetVariablesByDimension(*gp_fixargs(args)))


class Parameter(mixins.ParameterMixin, _BaseArcObject):
    """Every tool parameter has an associated parameter object with properties
       and methods that are useful in tool validation. Parameters are contained
       in a Python list."""
    name = passthrough_attr('name')
    displayName = passthrough_attr('displayName')
    displayOrder = passthrough_attr('displayOrder')
    direction = passthrough_attr('direction')
    datatype = passthrough_attr('datatype')
    charts = passthrough_attr('charts')
    parameterType = passthrough_attr('parameterType')
    parameterDependencies = passthrough_attr('parameterDependencies')
    enabled = passthrough_attr('enabled')
    value = passthrough_attr('value')
    defaultEnvironmentName = passthrough_attr('defaultEnvironmentName')
    altered = passthrough_attr('altered')
    hasBeenValidated = passthrough_attr('hasBeenValidated')
    category = passthrough_attr('category')
    schema = passthrough_attr('schema')
    filter = passthrough_attr('filter')
    filters = passthrough_attr('filters')
    symbology = passthrough_attr('symbology')
    message = passthrough_attr('message')
    multiValue = passthrough_attr('multiValue')
    columns = passthrough_attr('columns')
    valueAsText = passthrough_attr('valueAsText')
    values = passthrough_attr('values')
    controlCLSID = passthrough_attr('ControlCLSID')
    def setErrorMessage(self, *args):
        """Parameter.setErrorMessage(message)

           Marks the parameter as having an error with the supplied message.
           Tools do not execute if any of the parameters have an error.

             message(String):
           The string to be added as an error message to the geoprocessing tool
           messages."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.SetErrorMessage(*gp_fixargs(args)))

    def setWarningMessage(self, *args):
        """Parameter.setWarningMessage(message)

           Marks the parameter as having a warning with the supplied message.
           Unlike errors, tools will execute with warning messages.

             message(String):
           The string to be added as a warning message to the geoprocessing tool
           messages."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.SetWarningMessage(*gp_fixargs(args)))

    def setIDMessage(self, *args):
        """Parameter.setIDMessage(message_type, message_ID, {add_argument1},
           {add_argument2})

           Allows you to set a system message.

             message_type(String):
           Defines whether the message will be an error or a warning.

            * ERROR:   The message will be an error message.

            * WARNING:   The message will be a warning message.

             message_ID(Integer):
           The message ID allows you to reference existing system messages.

             add_argument1{Object}:
           Depending on which message ID is used, an argument may be necessary
           to complete the message. Common examples include dataset or field
           names. The datatype is variable depending on the message.

             add_argument2{Object}:
           Depending on which message ID is used, an argument may be necessary
           to complete the message. Common examples include dataset or field
           names. The datatype is variable depending on the message."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.SetIDMessage(*gp_fixargs(args)))

    def clearMessage(self, *args):
        """Parameter.clearMessage()

           Clears out any message text and sets the status to informative (no
           error or warning)."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.ClearMessage(*gp_fixargs(args)))

    def hasError(self, *args):
        """Parameter.hasError()

           Returns true if the parameter contains an error."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.HasError(*gp_fixargs(args)))

    def hasWarning(self, *args):
        """Parameter.hasWarning()

           Returns True if the parameter contains a warning."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.HasWarning(*gp_fixargs(args)))

    def isInputValueDerived(self, *args):
        """Parameter.isInputValueDerived()

           Returns True if the tool is being validated inside a Model and the
           input value is the output of another tool in the model."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.IsInputValueDerived(*gp_fixargs(args)))


class Point(mixins.PointMixin, _BaseArcObject):
    """The point object is used frequently with cursors. Point features return a
       single point object instead of an array of point objects. All other
       feature types—polygon, polyline, and multipoint—return an array of point
       objects or an array containing multiple arrays of point objects if the feature has multiple parts."""
    X = passthrough_attr('X')
    Y = passthrough_attr('Y')
    M = passthrough_attr('M')
    Z = passthrough_attr('Z')
    ID = passthrough_attr('ID')
    def clone(self, *args):
        """Point.clone(point_object)

           Clone the point object.

             point_object(Point):
           A point object."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Clone(*gp_fixargs(args)))

    def contains(self, second_geometry, relation=None):
        """Point.contains(second_geometry)

           Indicates if the base geometry contains the comparison geometry.

           contains is the opposite of within .

           Only True relationships are shown in this illustration.  Possible
           contains relationships

             second_geometry(Object):
           A second geometry."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Contains(*gp_fixargs((second_geometry, relation))))

    def crosses(self, second_geometry):
        """Point.crosses(second_geometry)

           Indicates if the two geometries intersect in a geometry of a lesser
           shape type.

           Two polylines cross if they share only points in common, at least
           one of which is not an endpoint. A polyline and an polygon cross if
           they share a polyline or a point (for vertical line) in common on
           the interior of the polygon which is not equivalent to the entire
           polyline.

           Only True relationships are shown in this illustration.  Possible
           crosses relationships

             second_geometry(Object):
           A second geometry."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Crosses(*gp_fixargs([second_geometry])))

    def disjoint(self, second_geometry):
        """Point.disjoint(second_geometry)

           Indicates if the base and comparison geometries share no points in
           common.

           Two
           geometries intersect if disjoint returns False .

           Only True relationships are shown in this illustration.  Possible
           disjoint relationships

             second_geometry(Object):
           A second geometry."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Disjoint(*gp_fixargs([second_geometry])))

    def equals(self, second_geometry):
        """Point.equals(second_geometry)

           Indicates if the base and comparison geometries are of the same shape
           type and define the
           same set of points in the plane.  This is a 2D comparison  only; M
           and Z values are ignored.

           Only True relationships are shown in this illustration.  Possible
           equals relationships

             second_geometry(Object):
           A second geometry."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Equals(*gp_fixargs([second_geometry])))

    def overlaps(self, second_geometry):
        """Point.overlaps(second_geometry)

           Indicates if the intersection of the two geometries has the same
           shape type as one of the input geometries and is not equivalent to
           either of the input geometries.

           Only True relationships are shown in this illustration.  Possible
           overlaps relationships

             second_geometry(Object):
           A second geometry."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Overlaps(*gp_fixargs([second_geometry])))

    def touches(self, second_geometry):
        """Point.touches(second_geometry)

           Indicates if the boundaries of the geometries intersect.

           Two geometries touch when the intersection of the
           geometries is not empty, but the intersection of their interiors is
           empty. For example, a point touches a polyline only if the point is
           coincident with one of the polyline end points.

           Only True relationships are shown in this illustration.  Possible
           touches relationships

             second_geometry(Object):
           A second geometry."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Touches(*gp_fixargs([second_geometry])))

    def within(self, second_geometry, relation=None):
        """Point.within(second_geometry)

           Indicates if the base geometry is within the comparison geometry.

           within is the opposite operator of contains .

           Only True relationships are shown in this illustration.

             Possible within relationships

             second_geometry(Object):
           A second geometry."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Within(*gp_fixargs((second_geometry, relation))))


class RandomNumberGenerator(_BaseArcObject):
    """Determines the type and seed that will be used to create random numbers
       between 0 and 1 for all tools that utilize random numbers, for example,
       CreateRandomRaster, CreateRandomPoints, and the ArcGIS.Rand() function.

       Returned from the randomGenerator environment."""
    def loadFromString(self, *args):
        """RandomNumberGenerator.loadFromString(string)

           Restore the object using its string representation.     The
           exportToString method can be used to create a string representation.

             string(String):
           The string representation of the object."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.LoadFromString(*gp_fixargs(args)))

    def exportToString(self, *args):
        """RandomNumberGenerator.exportToString()

           Exports the object to its string representation."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.ExportToString(*gp_fixargs(args)))


class RecordSet(mixins.RecordSetMixin, _BaseArcObject):
    """RecordSet objects are a lightweight representation of a table. They are a
       special data element that contains not only schema but also the data. The
       RecordSet object is also how tables are sent and received from the
       server."""
    JSON = passthrough_attr('JSON')
    def load(self, *args, **kwargs):
        """RecordSet.load(table_path)

           Import from a table.

             table_path(String):
           The table to be imported.
             where_clause(String):
           An SQL expression used to select a subset of records."""
        from arcpy.geoprocessing._base import gp_fixargs, gp_fixkwargs
        return convertArcObjectToPythonObject(self._arc_object.Load(*gp_fixargs(args),
                                                                    **gp_fixkwargs(kwargs)))

    def save(self, *args):
        """RecordSet.save(table_path)

           Export to a table.

             table_path(String):
           The output table to be created."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Save(*gp_fixargs(args)))


class Result(mixins.ResultMixin, _BaseArcObject):
    """A Result object is returned by geoprocessing tools."""
    status = passthrough_attr('status')
    resultID = passthrough_attr('resultID')
    messageCount = passthrough_attr('messageCount')
    maxSeverity = passthrough_attr('maxSeverity')
    outputCount = passthrough_attr('outputCount')
    inputCount = passthrough_attr('inputCount')
    def getMessage(self, *args):
        """Result.getMessage(index)

           Returns a specific message.

             index(Integer):
           The index position of the message."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetMessage(*gp_fixargs(args)))

    def getMessages(self, *args):
        """Result.getMessages({severity})

           Returns messages.

             severity{Integer}:
           The type of messages to be returned: 0=message, 1=warning, 2=error.
           Not specifying a value returns all message types.

            * 0:   informational message

            * 1:   warning message

            * 2:   error message"""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetMessages(*gp_fixargs(args)))

    def getAllMessages(self, *args):
        """Result.getAllMessages()

           Returns all messages as a list of lists."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetAllMessages(*gp_fixargs(args)))

    def getSeverity(self, *args):
        """Result.getSeverity(index)

           Returns the severity of a specific message.

             index(Integer):
           The message index position."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetSeverity(*gp_fixargs(args)))

    def getOutput(self, *args):
        """Result.getOutput(index)

           Returns a given output, either as a recordset or a string.

           If the output of the tool, such as MakeFeatureLayer is a layer,
           getOutput will return a Layer object.

             index(Integer):
           The index position of the outputs."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetOutput(*gp_fixargs(args)))

    def getInput(self, *args):
        """Result.getInput(index)

           Returns a given input, either as a recordset or string.

             index(Integer):
           The index position of the input."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetInput(*gp_fixargs(args)))

    def getMapImageURL(self, *args):
        """Result.getMapImageURL({parameter_list}, {height}, {width},
           {resolution})

           Gets a map service image for a given output, if one exists.

             parameter_list{Integer}:
           Parameter(s) on which the map service image will be based.

             height{Double}:
           The height of the image.

             width{Double}:
           The width of the image.

             resolution{Double}:
           The resolution of the image."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetMapImageURL(*gp_fixargs(args)))

    def cancel(self, *args):
        """Result.cancel()

           Cancels an associated job"""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Cancel(*gp_fixargs(args)))

    def saveToFile(self, *args):
        """Result.saveToFile(rlt_file)

           Saves the result to a result file (.rlt) .

             rlt_file(String):
           Full path to the output
           result file (.rlt) ."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.SaveToFile(*gp_fixargs(args)))

    def _repr_html_(self, *args):
        """Result._repr_html_()
            html representation of the result object."""

        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object._repr_html_(*gp_fixargs(args)))

class Row(_BaseArcObject):
    """The Row object represents the row of a table. The Row object is returned
       from InsertCursor , SearchCursor , and UpdateCursor."""
    __passthrough_to_ao__ = True

    def setValue(self, *args):
        """Row.setValue(field_name, object)

           Sets the field value.

             field_name(String):
           The field that will be set to the new value.

             object(Object):
           The value used to set the field value."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.SetValue(*gp_fixargs(args)))

    def getValue(self, *args):
        """Row.getValue(field_name)

           Gets the field value.

             field_name(String):
           The field from which the value will be accessed."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetValue(*gp_fixargs(args)))

    def setNull(self, *args):
        """Row.setNull(field_name)

           Sets the field value to null.

             field_name(String):
           The field that will be set to null."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.SetNull(*gp_fixargs(args)))

    def isNull(self, *args):
        """Row.isNull(field_name)

           Is the field value null.

             field_name(None):
           The field to be queried."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.IsNull(*gp_fixargs(args)))


class Schema(_BaseArcObject):
    """The schema of a dataset."""
    type = passthrough_attr('type')
    clone = passthrough_attr('clone')
    featureTypeRule = passthrough_attr('featureTypeRule')
    featureType = passthrough_attr('featureType')
    geometryTypeRule = passthrough_attr('geometryTypeRule')
    geometryType = passthrough_attr('geometryType')
    extentRule = passthrough_attr('extentRule')
    extent = passthrough_attr('extent')
    fieldsRule = passthrough_attr('fieldsRule')
    additionalFields = passthrough_attr('additionalFields')
    cellSizeRule = passthrough_attr('cellSizeRule')
    cellSize = passthrough_attr('cellSize')
    rasterRule = passthrough_attr('rasterRule')
    rasterFormatRule = passthrough_attr('rasterFormatRule')
    additionalChildren = passthrough_attr('additionalChildren')


class SpatialReference(mixins.SpatialReferenceMixin, _BaseArcObject):
    """Each part of the spatial reference has a number of properties (especially
       the coordinate system) that defines what map projection options are used
       to define horizontal coordinates."""
    type = passthrough_attr('type')
    name = passthrough_attr('name')
    alias = passthrough_attr('alias')
    abbreviation = passthrough_attr('abbreviation')
    remarks = passthrough_attr('remarks')
    factoryCode = passthrough_attr('factoryCode')
    PCSName = passthrough_attr('PCSName')
    PCSCode = passthrough_attr('PCSCode')
    GCSName = passthrough_attr('GCSName')
    GCSCode = passthrough_attr('GCSCode')
    spheroidName = passthrough_attr('spheroidName')
    spheroidCode = passthrough_attr('spheroidCode')
    projectionName = passthrough_attr('projectionName')
    projectionCode = passthrough_attr('projectionCode')
    datumName = passthrough_attr('datumName')
    datumCode = passthrough_attr('datumCode')
    primeMeridianName = passthrough_attr('primeMeridianName')
    primeMeridianCode = passthrough_attr('primeMeridianCode')
    angularUnitName = passthrough_attr('angularUnitName')
    angularUnitCode = passthrough_attr('angularUnitCode')
    linearUnitName = passthrough_attr('linearUnitName')
    linearUnitCode = passthrough_attr('linearUnitCode')
    hasXYPrecision = passthrough_attr('hasXYPrecision')
    hasZPrecision = passthrough_attr('hasZPrecision')
    hasMPrecision = passthrough_attr('hasMPrecision')
    falseOriginAndUnits = passthrough_attr('falseOriginAndUnits')
    ZFalseOriginAndUnits = passthrough_attr('ZFalseOriginAndUnits')
    MFalseOriginAndUnits = passthrough_attr('MFalseOriginAndUnits')
    domain = passthrough_attr('domain')
    ZDomain = passthrough_attr('ZDomain')
    MDomain = passthrough_attr('MDomain')
    usage = passthrough_attr('usage')
    centralMeridian = passthrough_attr('centralMeridian')
    centralMeridianInDegrees = passthrough_attr('centralMeridianInDegrees')
    longitudeOfOrigin = passthrough_attr('longitudeOfOrigin')
    latitudeOfOrigin = passthrough_attr('latitudeOfOrigin')
    latitudeOf1st = passthrough_attr('latitudeOf1st')
    latitudeOf2nd = passthrough_attr('latitudeOf2nd')
    falseEasting = passthrough_attr('falseEasting')
    falseNorthing = passthrough_attr('falseNorthing')
    centralParallel = passthrough_attr('centralParallel')
    standardParallel1 = passthrough_attr('standardParallel1')
    standardParallel2 = passthrough_attr('standardParallel2')
    longitudeOf1st = passthrough_attr('longitudeOf1st')
    longitudeOf2nd = passthrough_attr('longitudeOf2nd')
    scaleFactor = passthrough_attr('scaleFactor')
    azimuth = passthrough_attr('azimuth')
    semiMajorAxis = passthrough_attr('semiMajorAxis')
    semiMinorAxis = passthrough_attr('semiMinorAxis')
    flattening = passthrough_attr('flattening')
    longitude = passthrough_attr('longitude')
    radiansPerUnit = passthrough_attr('radiansPerUnit')
    metersPerUnit = passthrough_attr('metersPerUnit')
    GCS = passthrough_attr('GCS')
    isHighPrecision = passthrough_attr('isHighPrecision')
    XYTolerance = passthrough_attr('XYTolerance')
    MTolerance = passthrough_attr('MTolerance')
    ZTolerance = passthrough_attr('ZTolerance')
    XYResolution = passthrough_attr('XYResolution')
    MResolution = passthrough_attr('MResolution')
    ZResolution = passthrough_attr('ZResolution')
    classification = passthrough_attr('classification')
    VCS = passthrough_attr('VCS')
    def setFalseOriginAndUnits(self, *args):
        """SpatialReference.setFalseOriginAndUnits(false_x, false_y, xy_units)

           Sets the XY false origin and units.

             false_x(Double):
           The false x value.

             false_y(Double):
           The false y value.

             xy_units(String):
           The xy units."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.SetFalseOriginAndUnits(*gp_fixargs(args)))

    def setZFalseOriginAndUnits(self, *args):
        """SpatialReference.setZFalseOriginAndUnits(false_z, z_units)

           Sets the Z false origin and units.

             false_z(Double):
           The false z-value.

             z_units(Double):
           The false z units."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.SetZFalseOriginAndUnits(*gp_fixargs(args)))

    def setMFalseOriginAndUnits(self, *args):
        """SpatialReference.setMFalseOriginAndUnits(false_m, m_units)

           Sets the M false origin and units.

             false_m(Double):
           The false m-value.

             m_units(Double):
           The m units."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.SetMFalseOriginAndUnits(*gp_fixargs(args)))

    def setDomain(self, *args):
        """SpatialReference.setDomain(x_min, x_max, y_min, y_max)

           Sets the XY domain.

             x_min(Double):
           The minimum x-value.

             x_max(Double):
           The maximum x-value.

             y_min(Double):
           The minimum y-value.

             y_max(Double):
           The maximum y-value."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.SetDomain(*gp_fixargs(args)))

    def setZDomain(self, *args):
        """SpatialReference.setZDomain(z_min, z_max)

           Sets the Z domain.

             z_min(Double):
           The minimum z-value.

             z_max(Double):
           The maximum z-value."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.SetZDomain(*gp_fixargs(args)))

    def setMDomain(self, *args):
        """SpatialReference.setMDomain(m_min, m_max)

           Sets the M domain.

             m_min(Double):
           The minimum m-value.

             m_max(Double):
           The maximum m-value."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.SetMDomain(*gp_fixargs(args)))

    def createFromFile(self, *args):
        """SpatialReference.createFromFile(prj_file)

           Creates the spatial reference object from a projection file.

             prj_file(String):
           The projection file used to populate the spatial reference object."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.CreateFromFile(*gp_fixargs(args)))

    def create(self, *args):
        """SpatialReference.create()

           Creates the spatial reference object using properties."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.Create(*gp_fixargs(args)))

    def loadFromString(self, *args):
        """SpatialReference.loadFromString(string)

           Restore the object using its string representation.     The
           exportToString method can be used to create a string representation.

             string(String):
           The string representation of the object."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.LoadFromString(*gp_fixargs(args)))

    def exportToString(self, *args, **kwargs):
        """SpatialReference.exportToString()

           Exports the object to its string representation."""
        from arcpy.geoprocessing._base import gp_fixargs, gp_fixkwargs
        return convertArcObjectToPythonObject(self._arc_object.ExportToString(*gp_fixargs(args),
                                                                    **gp_fixkwargs(kwargs)))

    def _repr_html_(self, *args):
        """SpatialReference.exportToString()
           Exports the object to its string representation."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object._repr_html_(*gp_fixargs(args)))

class Value(_BaseArcObject):
    """The value object is returned from GetParameterInfo when used in a script
       tool's ToolValidator class."""
    value = passthrough_attr('value')
    isEmpty = passthrough_attr('isEmpty')


class ValueTable(mixins.ValueTableMixin, _BaseArcObject):
    """A value table is a flexible object that can be used as input for a
       multivalue parameter. It exists only during the lifetime of the
       geoprocessing object that created it."""
    rowCount = passthrough_attr('rowCount')
    columnCount = passthrough_attr('columnCount')
    def setColumns(self, *args):
        """ValueTable.setColumns(number_of_columns)

           Sets the number of columns for the value table.

             number_of_columns(Integer):
           The number of columns for the value table."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.SetColumns(*gp_fixargs(args)))

    def addColumns(self, *args):
        """ValueTable.addColumns(number_of_columns)

           Adds the number of columns for the value table.

             number_of_columns(Integer):
           The number of columns for the value table."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.AddColumns(*gp_fixargs(args)))

    def addRow(self, *args):
        """ValueTable.addRow(value)

           Adds a row to the value table.

             addRow's value argument is space-delimited. Any value used in the
             value argument that contains spaces must be enclosed in quotations.
             In the following example, a value table with two columns has a
             feature class and an index value added:
             vtab.addRow("'c:/temp/land use.shp' 2")

             value(Object):
           The row to be added."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.AddRow(*gp_fixargs(args)))

    def getRow(self, *args):
        """ValueTable.getRow(row)

           Gets a row from the value table.

             row(Integer):
           The row index position."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetRow(*gp_fixargs(args)))

    def getTrueRow(self, *args):
        """ValueTable.getTrueRow(row)

           Gets a row from the value table.

             row(Integer):
           The row index position."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetTrueRow(*gp_fixargs(args)))

    def getValue(self, *args):
        """ValueTable.getValue(row, column)

           Gets value from a given column and row.

             row(Integer):
           The row index position.

             column(Integer):
           The column index position."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetValue(*gp_fixargs(args)))

    def getTrueValue(self, *args):
        """ValueTable.getTrueValue(row, column)

           Gets value from a given column and row.

             row(Integer):
           The row index position.

             column(Integer):
           The column index position."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.GetTrueValue(*gp_fixargs(args)))

    def loadFromString(self, *args):
        """ValueTable.loadFromString(string)

           Restore the object using its string representation.     The
           exportToString method can be used to create a string representation.

             string(String):
           The string representation of the object."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.LoadFromString(*gp_fixargs(args)))

    def exportToString(self, *args):
        """ValueTable.exportToString()

           Exports the object to its string representation."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.ExportToString(*gp_fixargs(args)))

    def removeRow(self, *args):
        """ValueTable.removeRow(row)

           Deletes a row from the value table.

             row(Integer):
           The index position of the row to remove."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.RemoveRow(*gp_fixargs(args)))

    def setRow(self, *args):
        """ValueTable.setRow(row, value)

           Updates a given row within the value table.

           setRow's value argument is space-delimited. Any value used in the
           value argument that contains spaces must be enclosed in quotations.
           In the following example, a value table with two columns has a
           feature class and an index value added:   vtab.setRow(0,
           "'c:/temp/land use.shp' 2")

             row(Integer):
           The index position of the row to update.

             value(Object):
           The value to update the given row."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.SetRow(*gp_fixargs(args)))

    def setValue(self, *args):
        """ValueTable.setValue(row, column, value)

           Updates the value of a given row and column.

             row(Integer):
           The row index.

             column(Integer):
           The column index

             value(Object):
           The value to update the given row and column."""
        from arcpy.geoprocessing._base import gp_fixargs
        return convertArcObjectToPythonObject(self._arc_object.SetValue(*gp_fixargs(args)))

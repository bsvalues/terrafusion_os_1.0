import datetime
from distutils.version import LooseVersion
from sqlite3 import sqlite_version

IMAGE_TYPES = '.png', '.jpeg', '.jpg'

from indoorssql.utils.tiles2gpkg_parallel import Geopackage, GeodeticNSG, \
    connect, PRAGMA_MINIMUM_SQLITE_VERSION, attrgetter


class NsgGeopackage(Geopackage):
    """
    Extension of the Geopackage class, resticts SRS, updated wkt for epsg 4326, additional metadata tables, as well as
    some changes to what goes into gpkg contents. kept separate for now, as the goal is to eventually roll the profile
    into the geopackage spec, and remove the need for an advanced profile.
    """

    def __init__(self, file_path, srs):
        super(NsgGeopackage, self).__init__(file_path, srs)
        """Constructor."""
        self.__file_path = file_path
        self.__srs = srs
        # nsg profile only supported for 4326 for now in this script
        if self.__srs == 4326:
            self.__projection = GeodeticNSG()
        else:
            raise ValueError("SRS for NSG GeoPackages must be 4326")
        self.__db_con = connect(self.__file_path)

    def __enter__(self):
        """With-statement caller"""
        return self

    def __exit__(self, type, value, traceback):
        """Resource cleanup on destruction."""
        super(NsgGeopackage, self).__exit__(type, value, traceback)
        self.__db_con.close()

    def initialize(self):
        self.__create_schema()

    def __create_schema(self):
        """Create default geopackage schema on the database."""
        with self.__db_con as db_con:
            cursor = db_con.cursor()
            stmts = [
                """
                CREATE TABLE IF NOT EXISTS gpkg_contents
                (table_name  TEXT     NOT NULL PRIMARY KEY,                                    -- The name of the tiles, or feature table
                 data_type   TEXT     NOT NULL,                                                -- Type of data stored in the table: "features" per clause Features (http://www.geopackage.org/spec/#features), "tiles" per clause Tiles (http://www.geopackage.org/spec/#tiles), or an implementer-defined value for other data tables per clause in an Extended GeoPackage
                 identifier  TEXT     UNIQUE,                                                  -- A human-readable identifier (e.g. short name) for the table_name content
                 description TEXT     DEFAULT '',                                              -- A human-readable description for the table_name content
                 last_change DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')), -- Timestamp value in ISO 8601 format as defined by the strftime function %Y-%m-%dT%H:%M:%fZ format string applied to the current time
                 min_x       DOUBLE,                                                           -- Bounding box minimum easting or longitude for all content in table_name
                 min_y       DOUBLE,                                                           -- Bounding box minimum northing or latitude for all content in table_name
                 max_x       DOUBLE,                                                           -- Bounding box maximum easting or longitude for all content in table_name
                 max_y       DOUBLE,                                                           -- Bounding box maximum northing or latitude for all content in table_name
                 srs_id      INTEGER,                                                          -- Spatial Reference System ID: gpkg_spatial_ref_sys.srs_id; when data_type is features, SHALL also match gpkg_geometry_columns.srs_id; When data_type is tiles, SHALL also match gpkg_tile_matrix_set.srs.id
                 CONSTRAINT fk_gc_r_srs_id FOREIGN KEY (srs_id) REFERENCES gpkg_spatial_ref_sys(srs_id))
              """, """
                       CREATE TABLE IF NOT EXISTS gpkg_spatial_ref_sys
                       (srs_name                 TEXT    NOT NULL,             -- Human readable name of this SRS (Spatial Reference System)
                        srs_id                   INTEGER NOT NULL PRIMARY KEY, -- Unique identifier for each Spatial Reference System within a GeoPackage
                        organization             TEXT    NOT NULL,             -- Case-insensitive name of the defining organization e.g. EPSG or epsg
                        organization_coordsys_id INTEGER NOT NULL,             -- Numeric ID of the Spatial Reference System assigned by the organization
                        definition               TEXT    NOT NULL,             -- Well-known Text representation of the Spatial Reference System
                        description              TEXT)
                     """, """
                       CREATE TABLE IF NOT EXISTS gpkg_tile_matrix
                       (table_name    TEXT    NOT NULL, -- Tile Pyramid User Data Table Name
                        zoom_level    INTEGER NOT NULL, -- 0 <= zoom_level <= max_level for table_name
                        matrix_width  INTEGER NOT NULL, -- Number of columns (>= 1) in tile matrix at this zoom level
                        matrix_height INTEGER NOT NULL, -- Number of rows (>= 1) in tile matrix at this zoom level
                        tile_width    INTEGER NOT NULL, -- Tile width in pixels (>= 1) for this zoom level
                        tile_height   INTEGER NOT NULL, -- Tile height in pixels (>= 1) for this zoom level
                        pixel_x_size  DOUBLE  NOT NULL, -- In t_table_name srid units or default meters for srid 0 (>0)
                        pixel_y_size  DOUBLE  NOT NULL, -- In t_table_name srid units or default meters for srid 0 (>0)
                        CONSTRAINT pk_ttm PRIMARY KEY (table_name, zoom_level), CONSTRAINT fk_tmm_table_name FOREIGN KEY (table_name) REFERENCES gpkg_contents(table_name))
                     """, """
                       CREATE TABLE IF NOT EXISTS gpkg_tile_matrix_set
                       (table_name TEXT    NOT NULL PRIMARY KEY, -- Tile Pyramid User Data Table Name
                        srs_id     INTEGER NOT NULL,             -- Spatial Reference System ID: gpkg_spatial_ref_sys.srs_id
                        min_x      DOUBLE  NOT NULL,             -- Bounding box minimum easting or longitude for all content in table_name
                        min_y      DOUBLE  NOT NULL,             -- Bounding box minimum northing or latitude for all content in table_name
                        max_x      DOUBLE  NOT NULL,             -- Bounding box maximum easting or longitude for all content in table_name
                        max_y      DOUBLE  NOT NULL,             -- Bounding box maximum northing or latitude for all content in table_name
                        CONSTRAINT fk_gtms_table_name FOREIGN KEY (table_name) REFERENCES gpkg_contents(table_name), CONSTRAINT fk_gtms_srs FOREIGN KEY (srs_id) REFERENCES gpkg_spatial_ref_sys (srs_id))
                     """,
                """
                       CREATE TABLE IF NOT EXISTS %s
                        (id          INTEGER PRIMARY KEY AUTOINCREMENT, -- Autoincrement primary key
                         zoom_level  INTEGER NOT NULL,                  -- min(zoom_level) <= zoom_level <= max(zoom_level) for t_table_name
                         tile_column INTEGER NOT NULL,                  -- 0 to tile_matrix matrix_width - 1
                         tile_row    INTEGER NOT NULL,                  -- 0 to tile_matrix matrix_height - 1
                         tile_data   BLOB    NOT NULL,                  -- Of an image MIME type specified in clauses Tile Encoding PNG, Tile Encoding JPEG, Tile Encoding WEBP
                         UNIQUE (zoom_level, tile_column, tile_row))
                     """ % self.tile_table_name, """
                       CREATE TABLE IF NOT EXISTS gpkg_extensions
                       (table_name     TEXT,          -- Name of the table that requires the extension. When NULL, the extension is required for the entire GeoPackage. SHALL NOT be NULL when the column_name is not NULL
                        column_name    TEXT,          -- Name of the column that requires the extension. When NULL, the extension is required for the entire table
                        extension_name TEXT NOT NULL, -- The case sensitive name of the extension that is required, in the form <author>_<extension_name>
                        definition     TEXT NOT NULL, -- Definition of the extension in the form specified by the template in GeoPackage Extension Template (Normative) or reference thereto
                        scope          TEXT NOT NULL, -- Indicates scope of extension effects on readers / writers: read-write or write-only in lowercase
                        CONSTRAINT ge_tce UNIQUE (table_name, column_name, extension_name))
                     """, """
                       CREATE TABLE IF NOT EXISTS gpkg_metadata
                       (id              INTEGER CONSTRAINT m_pk PRIMARY KEY ASC NOT NULL UNIQUE,             -- Metadata primary key
                        md_scope        TEXT                                    NOT NULL DEFAULT 'dataset',  -- Case sensitive name of the data scope to which this metadata applies; see Metadata Scopes
                        md_standard_uri TEXT                                    NOT NULL,                    -- URI reference to the metadata structure definition authority
                        mime_type       TEXT                                    NOT NULL DEFAULT 'text/xml', -- MIME encoding of metadata
                        metadata        TEXT                                    NOT NULL DEFAULT ''          -- metadata
                       );
                     """, """
                       CREATE TABLE IF NOT EXISTS gpkg_metadata_reference
                       (reference_scope TEXT     NOT NULL,                                                -- Lowercase metadata reference scope; one of 'geopackage', 'table','column', 'row', 'row/col'
                        table_name      TEXT,                                                             -- Name of the table to which this metadata reference applies, or NULL for reference_scope of 'geopackage'
                        column_name     TEXT,                                                             -- Name of the column to which this metadata reference applies; NULL for reference_scope of 'geopackage','table' or 'row', or the name of a column in the table_name table for reference_scope of 'column' or 'row/col'
                        row_id_value    INTEGER,                                                          -- NULL for reference_scope of 'geopackage', 'table' or 'column', or the rowed of a row record in the table_name table for reference_scope of 'row' or 'row/col'
                        timestamp       DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')), -- timestamp value in ISO 8601 format as defined by the strftime function '%Y-%m-%dT%H:%M:%fZ' format string applied to the current time
                        md_file_id      INTEGER  NOT NULL,                                                -- gpkg_metadata table id column value for the metadata to which this gpkg_metadata_reference applies
                        md_parent_id    INTEGER,                                                          -- gpkg_metadata table id column value for the hierarchical parent gpkg_metadata for the gpkg_metadata to which this gpkg_metadata_reference applies, or NULL if md_file_id forms the root of a metadata hierarchy
                        CONSTRAINT crmr_mfi_fk FOREIGN KEY (md_file_id) REFERENCES gpkg_metadata(id),
                        CONSTRAINT crmr_mpi_fk FOREIGN KEY (md_parent_id) REFERENCES gpkg_metadata(id));
                     """
            ]
            for stmt in stmts:
                cursor.execute(stmt)
            cursor.execute("pragma foreign_keys = 1;")
            # Insert EPSG values for tiles table
            wkt = """GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137, 298.257223563,AUTHORITY["EPSG","7030"]], AUTHORITY["EPSG", "6326"]], PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]], UNIT["degree",0.0174532925199433, AUTHORITY["EPSG","9122"]], AUTHORITY["EPSG","4326"]]"""

            description = "Horizontal component of 3D system. Used by the GPS satellite navigation system and for NATO military geodetic surveying."
            cursor.execute(
                """
                    INSERT INTO gpkg_spatial_ref_sys (
                        srs_id,
                        organization,
                        organization_coordsys_id,
                        srs_name,
                        definition,
                        description)
                    VALUES (4326, ?, 4326, ?, ?, ?)
                """, ("epsg", "WGS 84 Geographic 2D", wkt, description))
            wkt = """undefined"""
            cursor.execute(
                """
                    INSERT INTO gpkg_spatial_ref_sys (
                        srs_id,
                        organization,
                        organization_coordsys_id,
                        srs_name,
                        definition)
                    VALUES (-1, ?, -1, ?, ?)
                """, ("NONE", " ", wkt))
            cursor.execute(
                """
                INSERT INTO gpkg_spatial_ref_sys (
                    srs_id,
                    organization,
                    organization_coordsys_id,
                    srs_name,
                    definition)
                VALUES (0, ?, 0, ?, ?)
            """, ("NONE", " ", wkt))
            cursor.execute(
                """
                    INSERT INTO gpkg_contents (
                        table_name,
                        data_type,
                        identifier,
                        description,
                        min_x,
                        max_x,
                        min_y,
                        max_y,
                        srs_id)
                    VALUES (?, ?, ?, ?, 0, 0, 0, 0, ?);
                """,
                (self.tile_table_name, "tiles", "Raster Tiles",
                 "Created by tiles2gpkg_parallel.py, written by Reinventing Geospatial, Inc.",
                 self.__srs))
            # Add GP10 to the Sqlite header
            if LooseVersion(sqlite_version) >= LooseVersion(
                    PRAGMA_MINIMUM_SQLITE_VERSION):
                cursor.execute("pragma application_id = 1196437808;")

    def update_metadata(self, metadata):
        """Update the metadata of the geopackage database after tile merge."""
        # initialize a new projection
        with self.__db_con as db_con:
            cursor = db_con.cursor()
            tile_matrix_stmt = """
                    INSERT OR REPLACE INTO gpkg_tile_matrix (
                        table_name,
                        zoom_level,
                        matrix_width,
                        matrix_height,
                        tile_width,
                        tile_height,
                        pixel_x_size,
                        pixel_y_size)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?);
            """
            # iterate through each zoom level object and assign
            # matrix data to table
            for level in metadata:
                cursor.execute(
                    tile_matrix_stmt,
                    (self.tile_table_name, level.zoom, level.matrix_width,
                     level.matrix_height, self.__projection.tile_size,
                     self.__projection.tile_size,
                     self.__projection.pixel_x_size(level.zoom),
                     self.__projection.pixel_x_size(level.zoom)))
            contents_stmt = """
                UPDATE gpkg_contents SET
                    min_x = ?,
                    min_y = ?,
                    max_x = ?,
                    max_y = ?
                WHERE table_name = '%s';
            """ % self.tile_table_name
            tile_matrix_set_stmt = """
                INSERT OR REPLACE INTO gpkg_tile_matrix_set (
                    table_name,
                    srs_id,
                    min_x,
                    min_y,
                    max_x,
                    max_y)
                VALUES (?, ?, ?, ?, ?, ?);
            """
            metadata_stmt = """
            INSERT INTO gpkg_metadata (
                md_scope,
                md_standard_uri,
                mime_type,
                metadata)
            VALUES (
                'series',
                'http://metadata.ces.mil/dse/ns/GSIP/nmis/2.2.0/doc',
                'text/xml',
                ?);
            """
            cursor.execute("""
                INSERT INTO gpkg_extensions
                (table_name,
                 column_name,
                 extension_name,
                 definition,
                 scope)
                VALUES
                (NULL,
                 NULL,
                 "gpkg_metadata",
                 "http://www.geopackage.org/spec/#extension_metadata",
                 "read-write");
              """)
            # get bounding box info based on
            top_level = max(metadata, key=attrgetter('zoom'))
            top_level.min_x = self.__projection.truncate(top_level.min_x)
            top_level.min_y = self.__projection.truncate(top_level.min_y)
            top_level.max_x = self.__projection.truncate(top_level.max_x)
            top_level.max_y = self.__projection.truncate(top_level.max_y)
            # write bounds and matrix set info to table
            cursor.execute(contents_stmt, (top_level.min_x, top_level.min_y,
                                           top_level.max_x, top_level.max_y))
            bounds = self.__projection.bounds
            cursor.execute(tile_matrix_set_stmt,
                           (self.tile_table_name, self.__srs, bounds[0],
                            bounds[1], bounds[2], bounds[3]))
            metadata_xml = self.__create_nmis_metadata(top_level)
            cursor.execute(metadata_stmt, (metadata_xml,))
            cursor.execute("INSERT INTO gpkg_metadata_reference (\
                reference_scope,\
                table_name,\
                column_name,\
                row_id_value,\
                timestamp,\
                md_file_id,\
                md_parent_id)\
             VALUES (\
                'geopackage',\
                NULL,\
                NULL,\
                NULL,\
                strftime('%Y-%m-%dT%H:%M:%fZ','now'),\
                1,\
                null);")

    def __create_nmis_metadata(self, top_level):
        return """<?xml version=\"1.0\" encoding=\"UTF-8\"?>
                <nas:MD_Metadata xmlns:nas="http://metadata.ces.mil/dse/ns/GSIP/5.0/nas"
                 xmlns:gmd="http://www.isotc211.org/2005/gmd"
                 xmlns:gco="http://www.isotc211.org/2005/gco"
                 xmlns:ism="urn:us:gov:ic:ism"
                 xmlns:ntk="urn:us:gov:ic:ntk"
                 ism:DESVersion="9"
                 ism:resourceElement="true"
                 ism:createDate="2017-05-11"
                 ism:classification="U"
                 ism:ownerProducer="USA"
                 ntk:DESVersion="7">

                    <gmd:hierarchyLevel>
                        <gmd:MD_ScopeCode codeList="http://api.nsgreg.nga.mil/codelist/ScopeCode" codeListValue="series" />
                    </gmd:hierarchyLevel>

                    <gmd:hierarchyLevelName>
                        <nas:ScopeAmplificationCode codeList="http://api.nsgreg.nga.mil/codelist/ScopeAmplificationCode" codeListValue="collection" />
                    </gmd:hierarchyLevelName>

                    <gmd:contact>
                        <gmd:CI_ResponsibleParty>
                            <gmd:organisationName>
                                <gco:CharacterString>GPEP</gco:CharacterString>
                            </gmd:organisationName>
                            <gmd:role>
                                <gmd:CI_RoleCode codeList="http://api.nsgreg.nga.mil/codelist/RoleCode" codeListValue="publisher" />
                            </gmd:role>
                        </gmd:CI_ResponsibleParty>
                    </gmd:contact>

                    <gmd:dateStamp>
                        <gco:Date>{create_date}</gco:Date>
                    </gmd:dateStamp>

                    <gmd:metadataStandardName>
                        <nas:MetadataStandardNameCode codeList="http://api.nsgreg.nga.mil/codelist/MetadataStandardNameCode" codeListValue="nsgMetadataFoundation" />
                    </gmd:metadataStandardName>

                    <gmd:metadataStandardVersion>
                        <nas:MetadataStandardVersion>2.2.0</nas:MetadataStandardVersion>
                    </gmd:metadataStandardVersion>

                    <gmd:referenceSystemInfo>
                        <gmd:MD_ReferenceSystem>
                            <gmd:referenceSystemIdentifier>
                                <gmd:RS_Identifier>
                                    <gmd:code>
                                        <gco:CharacterString>{srs_id}</gco:CharacterString>
                                    </gmd:code>
                                    <gmd:codeSpace>
                                        <gco:CharacterString>{srs_organization}</gco:CharacterString>
                                    </gmd:codeSpace>
                                </gmd:RS_Identifier>
                            </gmd:referenceSystemIdentifier>
                        </gmd:MD_ReferenceSystem>
                    </gmd:referenceSystemInfo>

                    <gmd:dataQualityInfo>
                        <gmd:DQ_DataQuality>
                            <gmd:scope>
                                <gmd:DQ_Scope>
                                    <gmd:level>
                                        <gmd:MD_ScopeCode codeList="http://api.nsgreg.nga.mil/codelist/ScopeCode" codeListValue="series" />
                                    </gmd:level>
                                </gmd:DQ_Scope>
                            </gmd:scope>
                            <gmd:lineage>
                                <gmd:LI_Lineage>
                                    <gmd:statement>
                                        <gco:CharacterString>Unknown Lineage</gco:CharacterString>
                                    </gmd:statement>
                                </gmd:LI_Lineage>
                            </gmd:lineage>
                        </gmd:DQ_DataQuality>
                    </gmd:dataQualityInfo>

                    <gmd:identificationInfo>
                        <nas:MD_DataIdentification>
                            <gmd:citation>
                                <gmd:CI_Citation>
                                     <gmd:title>
                                        <gco:CharacterString>{table_name}</gco:CharacterString>
                                    </gmd:title>
                                    <gmd:date>
                                        <gmd:CI_Date>
                                            <gmd:date>
                                                <gco:DateTime>{indentification_info_datetime}</gco:DateTime>
                                            </gmd:date>
                                            <gmd:dateType>
                                                <gmd:CI_DateTypeCode codeList="http://www.isotc211.org/2005/resources/Codelist/gmxCodelists.xml#CI_DateTypeCode" codeListValue="creation"/>
                                            </gmd:dateType>
                                        </gmd:CI_Date>
                                    </gmd:date>
                                </gmd:CI_Citation>
                            </gmd:citation>

                            <gmd:abstract>
                                <gco:CharacterString>MapProxy Created Data For Entire GeoPackage</gco:CharacterString>
                            </gmd:abstract>

                            <gmd:pointOfContact>
                                <gmd:CI_ResponsibleParty>
                                    <gmd:organisationName>
                                        <gco:CharacterString>GPEP</gco:CharacterString>
                                    </gmd:organisationName>
                                    <gmd:role>
                                        <gmd:CI_RoleCode codeList="http://api.nsgreg.nga.mil/codelist/RoleCode" codeListValue="publisher" />
                                    </gmd:role>
                                </gmd:CI_ResponsibleParty>
                            </gmd:pointOfContact>

                            <gmd:resourceConstraints>
                                <nas:MD_SecurityConstraints>
                                    <gmd:classification>
                                        <gmd:MD_ClassificationCode codeList="http://api.nsgreg.nga.mil/codelist/ClassificationCode" codeListValue="unclassified" />
                                    </gmd:classification>
                                    <gmd:classificationSystem>
                                        <nas:ClassificationSystem>US CAPCO</nas:ClassificationSystem>
                                    </gmd:classificationSystem>
                                    <nas:capcoMarking ism:classification="U" ism:ownerProducer="USA" />
                                </nas:MD_SecurityConstraints>
                            </gmd:resourceConstraints>

                            <gmd:language>
                                <gmd:LanguageCode codeList="http://api.nsgreg.nga.mil/codelist/ISO639-2" codeListValue="eng"/>
                            </gmd:language>

                            <gmd:characterSet>
                                <gmd:MD_CharacterSetCode codeList="http://api.nsgreg.nga.mil/codelist/CharacterSetCode" codeListValue="utf8" />
                            </gmd:characterSet>

                            <gmd:extent>
                                <gmd:EX_Extent>
                                    <gmd:geographicElement>
                                        <gmd:EX_GeographicBoundingBox>
                                            <gmd:westBoundLongitude>
                                                <gco:Decimal>{west}</gco:Decimal>
                                            </gmd:westBoundLongitude>
                                            <gmd:eastBoundLongitude>
                                                <gco:Decimal>{east}</gco:Decimal>
                                            </gmd:eastBoundLongitude>
                                            <gmd:southBoundLatitude>
                                                <gco:Decimal>{south}</gco:Decimal>
                                            </gmd:southBoundLatitude>
                                            <gmd:northBoundLatitude>
                                                <gco:Decimal>{north}</gco:Decimal>
                                            </gmd:northBoundLatitude>
                                        </gmd:EX_GeographicBoundingBox>
                                    </gmd:geographicElement>
                                </gmd:EX_Extent>
                            </gmd:extent>

                            <nas:languageCountry>
                                <nas:LanguageCountryCode codeList="http://api.nsgreg.nga.mil/geo-political/GENC/3/2-1" codeListValue="USA" />
                            </nas:languageCountry>

                            <nas:resourceCategory>
                                <nas:ResourceCategoryCode codeList="http://api.nsgreg.nga.mil/codelist/ResourceCategoryCode" codeListValue="other" />
                            </nas:resourceCategory>
                        </nas:MD_DataIdentification>
                    </gmd:identificationInfo>

                    <gmd:metadataConstraints>
                        <nas:MD_SecurityConstraints>
                            <gmd:classification>
                                    <gmd:MD_ClassificationCode codeList="http://api.nsgreg.nga.mil/codelist/ClassificationCode" codeListValue="unclassified" />
                            </gmd:classification>
                            <gmd:classificationSystem>
                                    <nas:ClassificationSystem>US CAPCO</nas:ClassificationSystem>
                            </gmd:classificationSystem>
                            <nas:capcoMarking ism:classification="U" ism:ownerProducer="USA" />
                        </nas:MD_SecurityConstraints>
                    </gmd:metadataConstraints>

                </nas:MD_Metadata>""".format(
            create_date=datetime.date.today().isoformat(),
            srs_id=self.__projection.srs_id,
            srs_organization=self.__projection.srs_organization,
            west=top_level.min_x,
            east=top_level.max_x,
            south=top_level.min_y,
            north=top_level.max_y,
            indentification_info_datetime=datetime.datetime.now().isoformat(),
            table_name=self.tile_table_name,
        )

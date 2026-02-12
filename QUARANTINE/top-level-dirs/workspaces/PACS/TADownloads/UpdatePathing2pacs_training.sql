-- NOTE: This section updates the databases with the updated file paths
--        PACS_SYSTEM, Taappsvr comp_config, and other necessary PACS tables are updated.

--         RUN ON THE DATABASE NEEDING TO BE UPDATED and RESTART THE APPSVR AFTER


    DECLARE @ENV_BASE VARCHAR(250) 
    DECLARE @DBNAME VARCHAR(250)
    DECLARE @ENV_PATH VARCHAR(250) 
    DECLARE @FIND VARCHAR(250)
    DECLARE @ENV_ID INT

	SET @DBNAME = (select db_name())

	SET @ENV_BASE = '\\JCHARRISPACS\OLTP' --this needs to be the oltp folder

    SET @ENV_PATH = @ENV_BASE + '\' + @DBNAME 

    SET @FIND = '\\JCHARRISPACS\oltp\pacs_oltp' 

    SET @ENV_ID = (select lEnvironmentID from TAAppSvr.dbo.tb_ta_transaction_environment where szSQLServerDBName = @DBNAME)

	Print 'Environment ID: ' + CAST(@ENV_ID as VARCHAR)
    Print 'Database Name: ' + @DBNAME
	Print 'Environment Path: ' + @ENV_PATH

--Miscellaneous Pathing changes

    UPDATE pacs_config SET szConfigValue = @ENV_PATH + '\PACSDrop\client_info.xml'  
      WHERE szConfigName = 'SVRCONFIGFILE' 

    UPDATE pacs_objects SET base_dir = @ENV_PATH + '\Audio'
       WHERE type = 'AUDIO'
    
    UPDATE pacs_objects SET base_dir = @ENV_PATH + '\Events'
       WHERE type = 'EVENT'
    
    UPDATE pacs_imaging SET base_dir = @ENV_PATH + '\Images'


--All Pacs System Pathing
    
    UPDATE pacs_system SET distribution_path = @ENV_PATH + '\PACSDrop'
    
    UPDATE pacs_system SET letter_path = @ENV_PATH + '\Letters'

    UPDATE pacs_system SET face_map_path = @ENV_PATH + '\Maps' 
    
    UPDATE pacs_system SET cold_location = @ENV_PATH + '\Objects'
    
    UPDATE pacs_system SET export_path = @ENV_PATH + '\ExportPath'
    
    UPDATE pacs_system SET mineral_import_format_file_path = @ENV_PATH + '\ReportPath'




--REPLACES ALL OLD PATHING  

    UPDATE gis
      SET location = REPLACE(location, @FIND, @ENV_PATH) 
      WHERE location IS NOT NULL 
    
    UPDATE gis 
      SET penpad_location = REPLACE(penpad_location , @FIND, @ENV_PATH) 
      WHERE penpad_location IS NOT NULL

    UPDATE gis_attributes
      SET layer = REPLACE(layer, @FIND, @ENV_PATH) 
      WHERE layer IS NOT NULL 

    UPDATE Gis_images
      SET image = REPLACE(image, @FIND, @ENV_PATH) 
      WHERE image IS NOT NULL 

    UPDATE Property_val
      SET image_path = REPLACE(image_path, @FIND, @ENV_PATH) 
      WHERE image_path IS NOT NULL 
      AND image_path <> ''

    UPDATE pacs_image 
      SET location = REPLACE(location, @FIND, @ENV_PATH) 
      WHERE location IS NOT NULL

    UPDATE event_object 
      SET location = REPLACE(location, @FIND, @ENV_PATH) 
      WHERE location IS NOT NULL


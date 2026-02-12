    SELECT szConfigValue from pacs_config  
      WHERE szConfigName = 'SVRCONFIGFILE' 

    SELECT base_dir from pacs_objects
       WHERE type = 'AUDIO'
    
    SELECT base_dir from pacs_objects
       WHERE type = 'EVENT'
    
    SELECT base_dir from pacs_imaging 
    
    SELECT distribution_path from pacs_system 
    
    SELECT letter_path from pacs_system

    SELECT face_map_path from pacs_system 
    
    SELECT cold_location from pacs_system
    
    SELECT export_path from pacs_system

    --SELECT report_path from pacs_system
    
    SELECT mineral_import_format_file_path from pacs_system



    DECLARE @ENV_ID INT

    SET @ENV_ID = 0  --this needs to be changed
   

    SELECT szConfigValue from TAAppSvr.dbo.tb_ta_transaction_component_config 
      WHERE lEnvironmentID = @ENV_ID
      and szConfigName = 'ExportDataPath'

    SELECT szConfigValue from TAAppSvr.dbo.tb_ta_transaction_component_config
      WHERE lEnvironmentID = @ENV_ID
      and szConfigName = 'ExportPath'

    SELECT szConfigValue from TAAppSvr.dbo.tb_ta_transaction_component_config
      WHERE lEnvironmentID = @ENV_ID
      and szConfigName = 'ImportDataPath'

    SELECT szConfigValue from TAAppSvr.dbo.tb_ta_transaction_component_config
      WHERE lEnvironmentID = @ENV_ID
      and szConfigName = 'BulkInsertFormatPath'

    SELECT szConfigValue from TAAppSvr.dbo.tb_ta_transaction_component_config
      WHERE lEnvironmentID = @ENV_ID
      and szConfigName = 'CustomReportPath'

    SELECT szConfigValue from TAAppSvr.dbo.tb_ta_transaction_component_config
      WHERE lEnvironmentID = @ENV_ID
      and szConfigName = 'PenpadCheckOutData'

    SELECT szConfigValue from TAAppSvr.dbo.tb_ta_transaction_component_config
      WHERE lEnvironmentID = @ENV_ID
      and szConfigName = 'ReportPath'

    SELECT szConfigValue from TAAppSvr.dbo.tb_ta_transaction_component_config
      WHERE lEnvironmentID = @ENV_ID
      and szConfigName = 'WebPortalExportPath'

    SELECT szConfigValue from TAAppSvr.dbo.tb_ta_transaction_component_config
      WHERE lEnvironmentID = @ENV_ID
      and szConfigName = 'PathRepositoryClientAppData'

    SELECT szConfigValue from TAAppSvr.dbo.tb_ta_transaction_component_config
      WHERE lEnvironmentID = @ENV_ID
      and szConfigName = 'PathRepositoryClientAssembly'

    SELECT szConfigValue from TAAppSvr.dbo.tb_ta_transaction_component_config
      WHERE lEnvironmentID = @ENV_ID
      and szConfigName = 'PathRepositoryDataFileImport'
    
    SELECT szConfigValue from TAAppSvr.dbo.tb_ta_transaction_component_config
      WHERE lEnvironmentID = @ENV_ID
      and szConfigName = 'PathRepositoryReportExport'

    SELECT szConfigValue from TAAppSvr.dbo.tb_ta_transaction_component_config
      WHERE lEnvironmentID = @ENV_ID
      and szConfigName = 'PathRepositoryTempStorage'

    SELECT szConfigValue from TAAppSvr.dbo.tb_ta_transaction_component_config
      WHERE lEnvironmentID = @ENV_ID
      and szConfigName = 'PaymentImportFilesPath'

    SELECT szConfigValue from TAAppSvr.dbo.tb_ta_transaction_component_config
      WHERE lEnvironmentID = @ENV_ID
      and szConfigName = 'PaymentImportProcessedFilesPath'






CREATE PROCEDURE DataTransferImport_CreateTempTables
     @input_temp_table_name     varchar(100), 
     @input_unc_file_path       varchar(500),
     @input_datasource_name     varchar(100),
     @input_uid                 varchar(50),
     @input_pwd                 varchar(50), 
     @input_main_table_name     varchar(100) 
AS
    DECLARE @dynamic_sql  varchar( 2000 ) 
    DECLARE @BCP_TAIL_CMD varchar( 500  )
    DECLARE @BCP_CMD      varchar( 2500 )
    /*
     * Build the BCP Tail 
     */
    SET @BCP_TAIL_CMD =  ' in '+ @input_unc_file_path  + ' -U' + @input_uid +
                     ' -P' + @input_pwd +
                     ' -c  -S' + @input_datasource_name + ''
    /*
     * Drop the temp table
     */    
    IF EXISTS (select name from tempdb.dbo.sysobjects where name = @input_temp_table_name)
    BEGIN
          set @dynamic_sql = 'drop table  '+@input_temp_table_name  
          EXEC(@dynamic_sql)
    END      
    /*
     *  Create the temp table with no records
     */ 
    set @dynamic_sql = 'SELECT * INTO ' + @input_temp_table_name + ' FROM '+@input_main_table_name+' WHERE 1=2 '
    --
    EXEC(@dynamic_sql)
    --
    /*
     *  Create the BCP Command and execute the import
     */
    set  @BCP_CMD = 'BCP ' + @input_temp_table_name  + ' ' + @BCP_TAIL_CMD
    --PRINT @BCP_CMD 
   	EXEC master..xp_cmdshell @BCP_CMD

GO


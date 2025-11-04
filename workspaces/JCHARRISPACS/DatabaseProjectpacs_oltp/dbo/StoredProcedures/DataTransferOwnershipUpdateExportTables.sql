
/*  
    *  RonaldEspejo 4/05/2006
    *  DataTransferOwnershipUpdateExportTables : Called by the Data Transfer Export Wizard
    *  @input_export_mode_chr: 'address' - Export the address table
    *                          'OWNR' - Export the owner table                           
    *                          'ACCT' - Export the account table 
    *                          'AGNT' - Export the agent table
    *   
    * @input_filename : Full UNC file path where the table is to be output to
    * 
    * @input_username : User login name to the db
    * 
    * @input_password : User password to the db
    * 
    * @input_servername: DB server name
    * 
    * @input_props_dataset_id: The unique identifier for the current run to the ##data_transfr_props table
    *
    * @input_ent_dataset_id: The unique identifier for the current run to the ##data_transfr_entities table
    */
CREATE PROCEDURE DataTransferOwnershipUpdateExportTables
            @run_mode               char(1),
            @input_tablename        varchar(25),
            @input_filename         varchar(255),
            @input_username         varchar(20),
            @input_password         varchar(20),
            @input_servername       varchar(50),
            @input_databasename     varchar(25),
            @input_props_dataset_id varchar(25),
            @input_ent_dataset_id   varchar(25)
 
   
AS
SET NOCOUNT ON
 
DECLARE @ExportQuery varchar(1000)
DECLARE @BCP_CMD     varchar(2500)
DECLARE @BCP_TAIL_CMD varchar(500)
--bcp "SELECT TOP 10 * FROM [pacs_oltp]..[property_val] WHERE prop_val_yr = 2005 " queryout "\\DTDEV304XP\Exports\properties_03-31-06.txt" -U"sa" -P"monitor107" -c  -Ssvdevdb03e\travis
SET @BCP_TAIL_CMD =  ' queryout "'+ @input_filename  + '" -U"' + @input_username +
                     '" -P"'+ @input_password +
                     '" -c  -S"' + @input_servername + '"'

   /*
    *  Export the 'address' table :  
    */
    IF (@input_tablename='address')
    BEGIN    
        SET @ExportQuery = 'SELECT * FROM ' + @input_databasename + '..address  a with(nolock) '
        SET @ExportQuery = @ExportQuery + ' INNER JOIN '+ @input_databasename + '..owner o with(nolock)'
        SET @ExportQuery = @ExportQuery + ' on a.acct_id = o.owner_id'
        SET @ExportQuery = @ExportQuery + ' INNER JOIN ##data_transfr_props dtp with(nolock)'
        SET @ExportQuery = @ExportQuery + ' on o.owner_tax_yr = dtp.prop_val_yr '
        SET @ExportQuery = @ExportQuery + ' AND o.prop_id     = dtp.prop_id'
        SET @ExportQuery = @ExportQuery + ' AND o.sup_num     = dtp.sup_num' 
        SET @ExportQuery = @ExportQuery + ' AND dtp.dataset_id = ' + @input_props_dataset_id 
    END
   /* 
    *  Export the 'account' table : PROP
    */
    IF (@input_tablename='account')
    BEGIN
        SET @ExportQuery = 'SELECT * FROM ' + @input_databasename + '..account a WITH(NOLOCK) '
        SET @ExportQuery = @ExportQuery + ' INNER JOIN '+ @input_databasename + '..owner o with(nolock)'
        SET @ExportQuery = @ExportQuery + ' on a.acct_id = o.owner_id'
        SET @ExportQuery = @ExportQuery + ' INNER JOIN ##data_transfr_props dtp WITH(NOLOCK)'
        SET @ExportQuery = @ExportQuery + ' on o.owner_tax_yr = dtp.prop_val_yr '
        SET @ExportQuery = @ExportQuery + ' AND o.prop_id     = dtp.prop_id'
        SET @ExportQuery = @ExportQuery + ' AND o.sup_num     = dtp.sup_num' 
        SET @ExportQuery = @ExportQuery + ' AND dtp.dataset_id = ' + @input_props_dataset_id 
    END
   /*
    *  Export the 'property_profile' table : PPFL
    */
    IF (@input_tablename='owner')
    BEGIN
        SET @ExportQuery = 'SELECT * FROM ' + @input_databasename + '..owner o WITH(NOLOCK) '
        SET @ExportQuery = @ExportQuery + ' INNER JOIN ##data_transfr_props dtp WITH(NOLOCK)'
        SET @ExportQuery = @ExportQuery + ' on o.owner_tax_yr = dtp.prop_val_yr '
        SET @ExportQuery = @ExportQuery + ' AND o.prop_id     = dtp.prop_id'
        SET @ExportQuery = @ExportQuery + ' AND o.sup_num     = dtp.sup_num' 
        SET @ExportQuery = @ExportQuery + ' AND dtp.dataset_id = ' + @input_props_dataset_id 
    END
   /*
    *  Export the 'entity' table
    */
    IF (@input_tablename='entity')
    BEGIN
        SET @ExportQuery = 'SELECT entity_id, entity_cd FROM ##data_transfr_entities WITH(NOLOCK) WHERE dataset_id = ' + @input_ent_dataset_id   
    END   
   /*
    *  Build the BCP Command
    *
    */
IF (@run_mode = '0')
BEGIN
	SELECT LEN(@ExportQuery)
END
  ELSE IF (@run_mode = '2')
  BEGIN
	SELECT @ExportQuery
  END
ELSE
BEGIN
    SET @BCP_CMD = 'BCP "' + @ExportQuery + ' "' + @BCP_TAIL_CMD
    PRINT @BCP_CMD
    EXEC master..xp_cmdshell @BCP_CMD
END

GO


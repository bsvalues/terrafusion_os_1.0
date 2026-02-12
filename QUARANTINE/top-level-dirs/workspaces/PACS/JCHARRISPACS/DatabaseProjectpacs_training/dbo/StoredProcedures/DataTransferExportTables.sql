
/*  
    *  RonaldEspejo 3/31/2006
    *  DataTransferExportTables : Called by the Data Transfer TAAppSvr component
	*  @run_mode               : 0 - Test table support
	*                          : 1 - Export Mode
    *  @input_table_name: 'PSYS' - Export the pacs_system table
    *                          'PROP' - Export the property table                           
    *                          'PPFL' - Export the property_profile table
    *                          'PVAL' - Export the property_val table
    *                          'PVSC' - Export the property_val_state_code table
    *                          'OWNR' - Export the owner table
    *                          'PREX' - Export the property_exemption table
    *                          'PSEE' - Export the property_special_entity_exemption table
    *                          'EPAS' - Export the entity_prop_assoc table
    *                          'POEV' - Export the prop_owner_entity_val table
    *                          'PEEX' - Export the property_entity_exemption table
    *                          'POES' - Export the property_owner_entity_state_cd table
    *                          'POEC' - Export the property_owenr_entity_cad_state_cd table
    *                          'ACCT' - Export the account table
    *                          'ADDR' - Export the address table
    *                          'AGAS' - Export the agent_assoc table
    *                          'STCD' - Export the state_code table
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
CREATE PROCEDURE DataTransferExportTables
                 @run_mode               char(1),
                 @input_table_name       varchar(100),
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

--Init vars
SET @ExportQuery = ''
SET @BCP_CMD     = ''
SEt @BCP_TAIL_CMD = ''

--bcp "SELECT TOP 10 * FROM [pacs_oltp]..[property_val] WHERE prop_val_yr = 2005 " queryout "\\DTDEV304XP\Exports\properties_03-31-06.txt" -U"sa" -P"monitor107" -c  -Ssvdevdb03e\travis
SET @BCP_TAIL_CMD =  ' queryout "'+ @input_filename  + '" -U"' + @input_username +
                     '" -P"' + @input_password +
                     '" -c  -S"' + @input_servername + '"'

   /*
    *  Export the 'pacs_system' table : 
    */

    IF (@input_table_name='pacs_system')
    BEGIN    
        SET @ExportQuery = 'SELECT * FROM ' + @input_databasename + '..pacs_system  WHERE system_type =''A'''        
    END
   /* 
    *  Export the 'property' table :  
    */
    IF (@input_table_name='property')
    BEGIN
        SET @ExportQuery = 'SELECT * FROM ' + @input_databasename + '..property p WITH(NOLOCK) '
        SET @ExportQuery = @ExportQuery + ' INNER JOIN ##data_transfr_props dtp WITH(NOLOCK) ON '
        SET @ExportQuery = @ExportQuery + ' p.prop_id = dtp.prop_id '
        SET @ExportQuery = @ExportQuery + ' AND dtp.dataset_id = ' + @input_props_dataset_id 
    
	END
   /*
    *  Export the 'property_profile' table :  
    */
    IF (@input_table_name='property_profile')
    BEGIN
        SET @ExportQuery = 'SELECT * FROM ' + @input_databasename + '..property_profile ppf WITH(NOLOCK) '
        SET @ExportQuery = @ExportQuery + ' INNER JOIN ##data_transfr_props dtp WITH(NOLOCK)'
        SET @ExportQuery = @ExportQuery + ' ON  ppf.prop_id = dtp.prop_id '
        SET @ExportQuery = @ExportQuery + ' AND ppf.prop_val_yr = dtp.prop_val_yr '
        SET @ExportQuery = @ExportQuery + ' AND dtp.dataset_id = ' + @input_props_dataset_id 
        PRINT 'Query PPFL:' + @ExportQuery
    END
   /*
    *  Export the 'property_val' table :  
    */
    IF (@input_table_name='property_val')
    BEGIN
        SET @ExportQuery = 'SELECT * FROM ' + @input_databasename + '..property_val pv WITH(NOLOCK) '
        SET @ExportQuery = @ExportQuery + ' INNER JOIN ##data_transfr_props dtp WITH(NOLOCK)'
        SET @ExportQuery = @ExportQuery + ' ON  pv.prop_id = dtp.prop_id '
        SET @ExportQuery = @ExportQuery + ' AND pv.prop_val_yr = dtp.prop_val_yr '
        SET @ExportQuery = @ExportQuery + ' AND pv.sup_num = dtp.sup_num '
        SET @ExportQuery = @ExportQuery + ' AND dtp.dataset_id = ' + @input_props_dataset_id 
    
	END
   /*
    *  Export the 'property_val_state_cd' table :   
    */
    IF (@input_table_name='property_val_state_cd')
    BEGIN
        SET @ExportQuery = 'SELECT * FROM ' + @input_databasename + '..property_val_state_cd pvsc WITH(NOLOCK) '
        SET @ExportQuery = @ExportQuery + ' INNER JOIN ##data_transfr_props dtp WITH(NOLOCK)'
        SET @ExportQuery = @ExportQuery + ' ON  pvsc.prop_id = dtp.prop_id '
        SET @ExportQuery = @ExportQuery + ' AND pvsc.prop_val_yr = dtp.prop_val_yr '
        SET @ExportQuery = @ExportQuery + ' AND pvsc.sup_num = dtp.sup_num '
        SET @ExportQuery = @ExportQuery + ' AND dtp.dataset_id = ' + @input_props_dataset_id 
    END
   /*
    *  Export the 'owner' table :   
    */
    IF (@input_table_name='owner')
    BEGIN
        SET @ExportQuery = 'SELECT * FROM ' + @input_databasename + '..owner o WITH(NOLOCK) '
        SET @ExportQuery = @ExportQuery + ' INNER JOIN ##data_transfr_props dtp WITH(NOLOCK)'
        SET @ExportQuery = @ExportQuery + ' ON  o.prop_id = dtp.prop_id '
        SET @ExportQuery = @ExportQuery + ' AND o.owner_tax_yr = dtp.prop_val_yr '
        SET @ExportQuery = @ExportQuery + ' AND o.sup_num = dtp.sup_num '
        SET @ExportQuery = @ExportQuery + ' AND dtp.dataset_id = ' + @input_props_dataset_id 
    END
   /*
    *  Export the 'property_exemption' table :  
    */
    IF (@input_table_name='property_exemption')
    BEGIN
        SET @ExportQuery = 'SELECT * FROM ' + @input_databasename + '..property_exemption pe WITH(NOLOCK) '
        SET @ExportQuery = @ExportQuery + ' INNER JOIN ##data_transfr_props dtp WITH(NOLOCK)'
        SET @ExportQuery = @ExportQuery + ' ON  PE.prop_id = dtp.prop_id '
        SET @ExportQuery = @ExportQuery + ' AND PE.owner_tax_yr = dtp.prop_val_yr '
        SET @ExportQuery = @ExportQuery + ' AND PE.sup_num = dtp.sup_num '
        SET @ExportQuery = @ExportQuery + ' AND dtp.dataset_id = ' + @input_props_dataset_id 
    END 
   /*
    *  Export the 'property_special_entity_exemption' table :  
    */
    IF (@input_table_name='property_special_entity_exemption')
    BEGIN
        SET @ExportQuery = 'SELECT * FROM ' + @input_databasename + '..property_special_entity_exemption psee WITH(NOLOCK) '
        SET @ExportQuery = @ExportQuery + ' INNER JOIN ##data_transfr_props dtp WITH(NOLOCK)'
        SET @ExportQuery = @ExportQuery + ' ON  psee.prop_id = dtp.prop_id '
        SET @ExportQuery = @ExportQuery + ' AND psee.owner_tax_yr = dtp.prop_val_yr '
        SET @ExportQuery = @ExportQuery + ' AND psee.sup_num = dtp.sup_num '
        SET @ExportQuery = @ExportQuery + ' AND dtp.dataset_id = ' + @input_props_dataset_id 
        SET @ExportQuery = @ExportQuery + ' WHERE psee.entity_id in (SELECT entity_id FROM ##data_transfr_entities WITH(NOLOCK) WHERE dataset_id = ' + @input_ent_dataset_id+')'

    END
   /*
    *  Export the 'entity_prop_assoc' table :  
    */
    IF (@input_table_name='entity_prop_assoc')
    BEGIN
        SET @ExportQuery = 'SELECT * FROM ' + @input_databasename + '..entity_prop_assoc epas WITH(NOLOCK) '
        SET @ExportQuery = @ExportQuery + ' INNER JOIN ##data_transfr_props dtp WITH(NOLOCK)'
        SET @ExportQuery = @ExportQuery + ' ON  epas.prop_id = dtp.prop_id '
        SET @ExportQuery = @ExportQuery + ' AND epas.tax_yr = dtp.prop_val_yr '
        SET @ExportQuery = @ExportQuery + ' AND epas.sup_num = dtp.sup_num '
        SET @ExportQuery = @ExportQuery + ' AND dtp.dataset_id = ' + @input_props_dataset_id 
        SET @ExportQuery = @ExportQuery + ' WHERE epas.entity_id in (SELECT entity_id FROM ##data_transfr_entities WITH(NOLOCK) WHERE dataset_id = ' + @input_ent_dataset_id+')'
        
    END
   /*
    *  Export the 'prop_owner_entity_val' table :  
    *  Notes: We need to find out if we should do anything with the owner_id
    */
    IF (@input_table_name='prop_owner_entity_val')
    BEGIN
        SET @ExportQuery = 'SELECT * FROM ' + @input_databasename + '..prop_owner_entity_val poev WITH(NOLOCK) '
        SET @ExportQuery = @ExportQuery + ' INNER JOIN ##data_transfr_props dtp WITH(NOLOCK)'
        SET @ExportQuery = @ExportQuery + ' ON  poev.prop_id = dtp.prop_id '
        SET @ExportQuery = @ExportQuery + ' AND poev.sup_yr = dtp.prop_val_yr '
        SET @ExportQuery = @ExportQuery + ' AND poev.sup_num = dtp.sup_num '
        SET @ExportQuery = @ExportQuery + ' AND dtp.dataset_id = ' + @input_props_dataset_id 
        SET @ExportQuery = @ExportQuery + ' WHERE poev.entity_id in (SELECT entity_id FROM ##data_transfr_entities WITH(NOLOCK) WHERE dataset_id = ' + @input_ent_dataset_id+')'
        
    END
   /*
    *  Export the 'property_entity_exemption' table :  
    */
    IF (@input_table_name='property_entity_exemption')
    BEGIN
        SET @ExportQuery = 'SELECT * FROM ' + @input_databasename + '..property_entity_exemption peex WITH(NOLOCK) '
        SET @ExportQuery = @ExportQuery + ' INNER JOIN ##data_transfr_props dtp WITH(NOLOCK)'
        SET @ExportQuery = @ExportQuery + ' ON  peex.prop_id = dtp.prop_id '
        SET @ExportQuery = @ExportQuery + ' AND peex.exmpt_tax_yr = dtp.prop_val_yr '
        SET @ExportQuery = @ExportQuery + ' AND peex.sup_num = dtp.sup_num '
        SET @ExportQuery = @ExportQuery + ' AND dtp.dataset_id = ' + @input_props_dataset_id 
        SET @ExportQuery = @ExportQuery + ' WHERE peex.entity_id in (SELECT entity_id FROM ##data_transfr_entities WITH(NOLOCK) WHERE dataset_id = ' + @input_ent_dataset_id +')'

    END
   /*
    *  Export the 'property_owner_entity_state_cd' table :  
    */
    IF (@input_table_name='property_owner_entity_state_cd')
    BEGIN
        SET @ExportQuery = 'SELECT * FROM ' + @input_databasename + '..property_owner_entity_state_cd poes WITH(NOLOCK) '
        SET @ExportQuery = @ExportQuery + ' INNER JOIN ##data_transfr_props dtp WITH(NOLOCK)'
        SET @ExportQuery = @ExportQuery + ' ON  poes.prop_id = dtp.prop_id '
        SET @ExportQuery = @ExportQuery + ' AND poes.year = dtp.prop_val_yr '
        SET @ExportQuery = @ExportQuery + ' AND poes.sup_num = dtp.sup_num '
        SET @ExportQuery = @ExportQuery + ' AND dtp.dataset_id = ' + @input_props_dataset_id 
        SET @ExportQuery = @ExportQuery + ' WHERE poes.entity_id in (SELECT entity_id FROM ##data_transfr_entities WITH(NOLOCK) WHERE dataset_id = ' + @input_ent_dataset_id +')'
        
    END
 
   /*
    *  Export the 'property_owner_entity_cad_state_cd' table :  
    */
    IF (@input_table_name='property_owner_entity_cad_state_cd')
    BEGIN
        SET @ExportQuery = 'SELECT * FROM ' + @input_databasename + '..property_owner_entity_cad_state_cd poec WITH(NOLOCK) '
        SET @ExportQuery = @ExportQuery + ' INNER JOIN ##data_transfr_props dtp WITH(NOLOCK)'
        SET @ExportQuery = @ExportQuery + ' ON  poec.prop_id = dtp.prop_id '
        SET @ExportQuery = @ExportQuery + ' AND poec.year = dtp.prop_val_yr '
        SET @ExportQuery = @ExportQuery + ' AND poec.sup_num = dtp.sup_num '
        SET @ExportQuery = @ExportQuery + ' AND dtp.dataset_id = ' + @input_props_dataset_id 
        SET @ExportQuery = @ExportQuery + ' WHERE poec.entity_id in (SELECT entity_id FROM ##data_transfr_entities WITH(NOLOCK) WHERE dataset_id = ' + @input_ent_dataset_id +')'
        
    END
 
   /*
    *  Export the 'account' table :   
    */
    IF (@input_table_name='account')
    BEGIN
        SET @ExportQuery = 'SELECT * FROM ' + @input_databasename + '..account acct WITH(NOLOCK) '
        SET @ExportQuery = @ExportQuery + ' INNER JOIN ' + @input_databasename + '..owner o WITH(NOLOCK)' 
        SET @ExportQuery = @ExportQuery + ' ON acct.acct_id = o.owner_id '
        SET @ExportQuery = @ExportQuery + ' INNER JOIN ##data_transfr_props dtp WITH(NOLOCK)'
        SET @ExportQuery = @ExportQuery + ' ON  o.prop_id  = dtp.prop_id '
        SET @ExportQuery = @ExportQuery + ' AND o.owner_tax_yr = dtp.prop_val_yr '
        SET @ExportQuery = @ExportQuery + ' AND o.sup_num = dtp.sup_num ' 
        SET @ExportQuery = @ExportQuery + ' WHERE dtp.dataset_id = ' + @input_props_dataset_id

    END
   /*  
    *  Export the 'address' table :  
    */
    IF (@input_table_name='address')
    BEGIN
        SET @ExportQuery = 'SELECT * FROM ' + @input_databasename + '..address addr WITH(NOLOCK) '
        SET @ExportQuery = @ExportQuery + ' INNER JOIN ' + @input_databasename + '..owner o WITH(NOLOCK)' 
        SET @ExportQuery = @ExportQuery + ' ON addr.acct_id = o.owner_id '
        SET @ExportQuery = @ExportQuery + ' INNER JOIN ##data_transfr_props dtp WITH(NOLOCK)'
        SET @ExportQuery = @ExportQuery + ' ON  o.prop_id  = dtp.prop_id '
        SET @ExportQuery = @ExportQuery + ' AND o.owner_tax_yr = dtp.prop_val_yr '
        SET @ExportQuery = @ExportQuery + ' AND o.sup_num = dtp.sup_num ' 
        SET @ExportQuery = @ExportQuery + ' WHERE dtp.dataset_id = ' + @input_props_dataset_id
        
    
	END 
   /*  
    *  Export the 'agent_assoc' table : AGAS
    */
    IF (@input_table_name='agent_assoc')
    BEGIN
        SET @ExportQuery = 'SELECT * FROM ' + @input_databasename + '..agent_assoc agas WITH(NOLOCK) '
        SET @ExportQuery = @ExportQuery + ' INNER JOIN ' + @input_databasename + '..owner o WITH(NOLOCK)' 
        SET @ExportQuery = @ExportQuery + ' ON agas.owner_id = o.owner_id '
        SET @ExportQuery = @ExportQuery + ' AND agas.prop_id = o.prop_id'     
        SET @ExportQuery = @ExportQuery + ' INNER JOIN ##data_transfr_props dtp WITH(NOLOCK)'
        SET @ExportQuery = @ExportQuery + ' ON  o.prop_id  = dtp.prop_id '
        SET @ExportQuery = @ExportQuery + ' AND o.owner_tax_yr = dtp.prop_val_yr '
        SET @ExportQuery = @ExportQuery + ' AND o.sup_num = dtp.sup_num ' 
        SET @ExportQuery = @ExportQuery + ' AND agas.owner_tax_yr = dtp.prop_val_yr' 
        SET @ExportQuery = @ExportQuery + ' WHERE dtp.dataset_id = ' + @input_props_dataset_id
    
	END 
   /*  
    *  Export the 'state_code' table :  
    */
    IF (@input_table_name='state_code')
    BEGIN
        SET @ExportQuery = 'SELECT * FROM ' + @input_databasename + '..state_code WITH(NOLOCK) '         
    
	END
   /*
    *    Export the 'property_freeze' table:
    */
	IF (@input_table_name='property_freeze')
    BEGIN
        SET @ExportQuery = 'SELECT * FROM ' + @input_databasename + '..property_freeze pf WITH(NOLOCK) '
        SET @ExportQuery = @ExportQuery + ' INNER JOIN ##data_transfr_props dtp WITH(NOLOCK)'
        SET @ExportQuery = @ExportQuery + ' ON  pf.prop_id = dtp.prop_id '
        SET @ExportQuery = @ExportQuery + ' AND pf.owner_tax_yr = dtp.prop_val_yr '
        SET @ExportQuery = @ExportQuery + ' AND pf.sup_num = dtp.sup_num '
        SET @ExportQuery = @ExportQuery + ' AND dtp.dataset_id = ' + @input_props_dataset_id 
        SET @ExportQuery = @ExportQuery + ' WHERE pf.entity_id in (SELECT entity_id FROM ##data_transfr_entities WITH(NOLOCK) WHERE dataset_id = ' + @input_ent_dataset_id +')'
         
    END 
    IF (@input_table_name='imprv')
    BEGIN
        SET @ExportQuery = 'SELECT * FROM ' + @input_databasename + '..imprv i WITH(NOLOCK) ' 
        SET @ExportQuery = @ExportQuery + ' INNER JOIN ##data_transfr_props dtp WITH(NOLOCK)'
        SET @ExportQuery = @ExportQuery + ' ON  i.prop_id  = dtp.prop_id '
        SET @ExportQuery = @ExportQuery + ' AND i.prop_val_yr = dtp.prop_val_yr '
        SET @ExportQuery = @ExportQuery + ' AND i.sup_num = dtp.sup_num ' 
        SET @ExportQuery = @ExportQuery + ' WHERE dtp.dataset_id = ' + @input_props_dataset_id
 
    END
	IF (@input_table_name='situs')
    BEGIN
        SET @ExportQuery = 'SELECT * FROM ' + @input_databasename + '..situs s WITH(NOLOCK) ' 
        SET @ExportQuery = @ExportQuery + ' INNER JOIN ##data_transfr_props dtp WITH(NOLOCK)'
        SET @ExportQuery = @ExportQuery + ' ON  s.prop_id  = dtp.prop_id ' 
        SET @ExportQuery = @ExportQuery + ' WHERE dtp.dataset_id = ' + @input_props_dataset_id
 
    END
   /*
    *  Export the entities the user selected
    */
    IF (@input_table_name='entity')
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


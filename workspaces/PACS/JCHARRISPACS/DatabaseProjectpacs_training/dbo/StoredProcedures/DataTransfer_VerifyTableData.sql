
/*  
    *  RonaldEspejo 3/30/2006
    *  DataTransfer_VerifyTableData
    *  @input_run_mode - 'T' for test mode, verifyies all the tables in the  ##data_transfer_verify_data_map are supported
    *                    'R' run more, does all the verifycation for all the tables in the ##data_transfer_verify_data_map 
                         'P' print queries mode
    *  @input_main_table_name - 
    */
CREATE PROCEDURE DataTransfer_VerifyTableData
    @input_run_mode            char(1), 
    @input_dataset_id          bigint 
AS
SET NOCOUNT ON
 
    DECLARE @id         int
    DECLARE @table_name varchar(50)
    DECLARE @temp_table_name varchar(50)
    DECLARE @is_ownership_update bit
    --
    DECLARE @dynamic_sql varchar(2500)

--Init
set @id                   = 0
set @table_name           = ''  
set @temp_table_name      = ''
set @is_ownership_update  = 0
set @dynamic_sql          = ''
--
UPDATE ##data_transfer_verify_data_map SET  table_is_supported = 0  WHERE
                   [dataset_id] = @input_dataset_id
--
DECLARE tables_cursor CURSOR FOR
        SELECT [id], table_name, temp_table_name, is_ownership_update FROM 
        ##data_transfer_verify_data_map where dataset_id = @input_dataset_id
--
OPEN tables_cursor
--
FETCH NEXT FROM tables_cursor INTO @id, @table_name,@temp_table_name,@is_ownership_update
WHILE(@@FETCH_STATUS = 0)
BEGIN
--
    set @dynamic_sql          = ''
    --*************************************************
    /*  
     * pacs_system
     */
    IF @table_name = 'pacs_system' 
    BEGIN
        IF(@input_run_mode='T') 
        BEGIN
            UPDATE ##data_transfer_verify_data_map SET  table_is_supported = 1  WHERE
                   [ID] = @id
        END
        ELSE
        BEGIN 
            set @dynamic_sql = 'DECLARE @count int '
            set @dynamic_sql = @dynamic_sql + ' SET @count = 0'
             
        END  
    END
    --*************************************************
    /*  
     *  property
     */
    IF @table_name = 'property' 
    BEGIN
        IF(@input_run_mode='T') 
        BEGIN
            UPDATE ##data_transfer_verify_data_map SET  table_is_supported = 1  WHERE
                   [ID] = @id
        END
        ELSE
        BEGIN 
            set @dynamic_sql = 'DECLARE @count int '
            set @dynamic_sql = @dynamic_sql + ' SET @count = 0'
             
        END  
    END
    --*************************************************
    /*  
     *  property_profile
     */
    IF @table_name = 'property_profile' 
    BEGIN
        IF(@input_run_mode='T') 
        BEGIN
            UPDATE ##data_transfer_verify_data_map SET  table_is_supported = 1  WHERE
                   [ID] = @id
        END
        ELSE
        BEGIN 
            set @dynamic_sql = 'DECLARE @count int '
            set @dynamic_sql = @dynamic_sql + ' SET @count = 0'
             
        END  
    END
    
    /*  
     * property_val table
     */
    IF @table_name = 'property_val' 
    BEGIN
        IF(@input_run_mode='T') 
        BEGIN
            UPDATE ##data_transfer_verify_data_map SET table_is_supported = 1 WHERE
                   [ID] = @id
        END
        ELSE
        BEGIN
            -- drop table v
            -- if the sup_num, prop_va_yr combination exists in the main table then error
            -- select top 10 * into ##PropertyDataproperty_val_711_712 from property_val
            -- SELECT top 10 * FROM property_val  
              --zindrt 
            -- select * from ##PropertyDataproperty_val_711_712
            -- select * from ##data_transfer_verify_data_map   
            -- INSERT ##PropertyDataproperty_val_711_712  SELECT top 10 * FROM property_val 
            set @dynamic_sql = 'DECLARE @count int '
            set @dynamic_sql = @dynamic_sql + ' SET @count = 0'
            set @dynamic_sql = @dynamic_sql + ' SELECT @count = count(*) FROM property_val as pv '
            set @dynamic_sql = @dynamic_sql + ' INNER JOIN ##PropertyDataproperty_val_711_712 as tpv '
            set @dynamic_sql = @dynamic_sql + ' ON tpv.prop_val_yr = pv.prop_val_yr '
            set @dynamic_sql = @dynamic_sql + ' AND tpv.sup_num    = pv.sup_num '
            set @dynamic_sql = @dynamic_sql + ' IF (@count > 0 )  '
            set @dynamic_sql = @dynamic_sql + ' BEGIN'
            set @dynamic_sql = @dynamic_sql + '    UPDATE ##data_transfer_verify_data_map set n_conflicts = @count,'
            set @dynamic_sql = @dynamic_sql + '    error_hint = ''Properties with supplement number and property value year combination already exist.'' '
            set @dynamic_sql = @dynamic_sql + '    WHERE [ID] = @id'
            set @dynamic_sql = @dynamic_sql + ' END'
        END  
    END
    /*
     *  property_val_state_cd
     */
    IF @table_name = 'property_val_state_cd' 
    BEGIN
        IF(@input_run_mode='T') 
        BEGIN
            UPDATE ##data_transfer_verify_data_map SET table_is_supported = 1 WHERE
                   [ID] = @id
        END
        ELSE
        BEGIN 
            set @dynamic_sql = 'DECLARE @count int '
            set @dynamic_sql = @dynamic_sql + ' SET @count = 0'
             
        END  
    END
    --*************************************************
    /*  
     *  owner
     */
    IF @table_name = 'owner' 
    BEGIN
        IF(@input_run_mode='T') 
        BEGIN
            UPDATE ##data_transfer_verify_data_map SET table_is_supported = 1 WHERE
                   [ID] = @id
        END
        ELSE
        BEGIN 
            set @dynamic_sql = 'DECLARE @count int '
            set @dynamic_sql = @dynamic_sql + ' SET @count = 0'
             
        END  
    END
    --*************************************************
    /*  
     *  property_exemption
     */
    IF @table_name = 'property_exemption' 
    BEGIN
        IF(@input_run_mode='T') 
        BEGIN
            UPDATE ##data_transfer_verify_data_map SET table_is_supported = 1 WHERE
                   [ID] = @id
        END
        ELSE
        BEGIN 
            set @dynamic_sql = 'DECLARE @count int '
            set @dynamic_sql = @dynamic_sql + ' SET @count = 0'
             
        END  
    END
    --*************************************************
    /*  
     *  property_special_entity_exemption
     */
    IF @table_name = 'property_special_entity_exemption' 
    BEGIN
        IF(@input_run_mode='T') 
        BEGIN
            UPDATE ##data_transfer_verify_data_map SET table_is_supported = 1 WHERE
                   [ID] = @id
        END
        ELSE
        BEGIN 
            set @dynamic_sql = 'DECLARE @count int '
            set @dynamic_sql = @dynamic_sql + ' SET @count = 0'
             
        END  
    END
    --*************************************************
    /*  
     *  entity_prop_assoc
     */
    IF @table_name = 'entity_prop_assoc' 
    BEGIN
        IF(@input_run_mode='T') 
        BEGIN
            UPDATE ##data_transfer_verify_data_map SET table_is_supported = 1 WHERE
                   [ID] = @id
        END
        ELSE
        BEGIN 
            set @dynamic_sql = 'DECLARE @count int '
            set @dynamic_sql = @dynamic_sql + ' SET @count = 0'
             
        END  
    END
    --*************************************************
    /*  
     *  prop_owner_entity_val
     */
    IF @table_name = 'prop_owner_entity_val' 
    BEGIN
        IF(@input_run_mode='T') 
        BEGIN
            UPDATE ##data_transfer_verify_data_map SET table_is_supported = 1 WHERE
                   [ID] = @id
        END
        ELSE
        BEGIN 
            set @dynamic_sql = 'DECLARE @count int '
            set @dynamic_sql = @dynamic_sql + ' SET @count = 0'
             
        END  
    END
    --*************************************************
    /*  
     *  property_entity_exemption
     */
    IF @table_name = 'property_entity_exemption' 
    BEGIN
        IF(@input_run_mode='T') 
        BEGIN
            UPDATE ##data_transfer_verify_data_map SET table_is_supported = 1 WHERE
                   [ID] = @id
        END
        ELSE
        BEGIN 
            set @dynamic_sql = 'DECLARE @count int '
            set @dynamic_sql = @dynamic_sql + ' SET @count = 0'
             
        END  
    END
    --*************************************************
    /*  
     *  property_owner_entity_state_cd
     */
    IF @table_name = 'property_owner_entity_state_cd' 
    BEGIN
        IF(@input_run_mode='T') 
        BEGIN
            UPDATE ##data_transfer_verify_data_map SET table_is_supported = 1 WHERE
                   [ID] = @id
        END
        ELSE
        BEGIN 
            set @dynamic_sql = 'DECLARE @count int '
            set @dynamic_sql = @dynamic_sql + ' SET @count = 0'
             
        END  
    END
    --*************************************************
    /*  
     *  property_owner_entity_cad_state_cd
     */
    IF @table_name = 'property_owner_entity_cad_state_cd' 
    BEGIN
        IF(@input_run_mode='T') 
        BEGIN
            UPDATE ##data_transfer_verify_data_map SET table_is_supported = 1 WHERE
                   [ID] = @id
        END
        ELSE
        BEGIN 
            set @dynamic_sql = 'DECLARE @count int '
            set @dynamic_sql = @dynamic_sql + ' SET @count = 0'
             
        END  
    END
    --*************************************************
    /*  
     *  account
     */
    IF @table_name = 'account' 
    BEGIN
        IF(@input_run_mode='T') 
        BEGIN
            UPDATE ##data_transfer_verify_data_map SET table_is_supported = 1 WHERE
                   [ID] = @id
        END
        ELSE
        BEGIN 
            set @dynamic_sql = 'DECLARE @count int '
            set @dynamic_sql = @dynamic_sql + ' SET @count = 0'
             
        END  
    END
    --*************************************************
    /*  
     *  address
     */
    IF @table_name = 'address' 
    BEGIN
        IF(@input_run_mode='T') 
        BEGIN
            UPDATE ##data_transfer_verify_data_map SET table_is_supported = 1 WHERE
                   [ID] = @id
        END
        ELSE
        BEGIN 
            set @dynamic_sql = 'DECLARE @count int '
            set @dynamic_sql = @dynamic_sql + ' SET @count = 0'
             
        END  
    END
    --*************************************************
    /*  
     *  agent_assoc
     */
    IF @table_name = 'agent_assoc' 
    BEGIN
        IF(@input_run_mode='T') 
        BEGIN
            UPDATE ##data_transfer_verify_data_map SET table_is_supported = 1 WHERE
                   [ID] = @id
        END
        ELSE
        BEGIN 
            set @dynamic_sql = 'DECLARE @count int '
            set @dynamic_sql = @dynamic_sql + ' SET @count = 0'
             
        END  
    END
    --*************************************************
    /*  
     *  state_code
     */
    IF @table_name = 'state_code' 
    BEGIN
        IF(@input_run_mode='T') 
        BEGIN
            UPDATE ##data_transfer_verify_data_map SET table_is_supported = 1 WHERE
                   [ID] = @id
        END
        ELSE
        BEGIN 
            set @dynamic_sql = 'DECLARE @count int '
            set @dynamic_sql = @dynamic_sql + ' SET @count = 0'
             
        END  
    END
    --*************************************************
    /*  
     *  property_freeze
     */
    IF @table_name = 'property_freeze' 
    BEGIN
        IF(@input_run_mode='T') 
        BEGIN
            UPDATE ##data_transfer_verify_data_map SET table_is_supported = 1 WHERE
                   [ID] = @id
        END
        ELSE
        BEGIN 
            set @dynamic_sql = 'DECLARE @count int '
            set @dynamic_sql = @dynamic_sql + ' SET @count = 0'
             
        END  
    END
    --*************************************************
    /*  
     *  imprv
     */
    IF @table_name = 'imprv' 
    BEGIN
        IF(@input_run_mode='T') 
        BEGIN
            UPDATE ##data_transfer_verify_data_map SET table_is_supported = 1 WHERE
                   [ID] = @id
        END
        ELSE
        BEGIN 
            set @dynamic_sql = 'DECLARE @count int '
            set @dynamic_sql = @dynamic_sql + ' SET @count = 0'
             
        END  
    END
    --*************************************************
    /*  
     *  situs
     */
    IF @table_name = 'situs' 
    BEGIN
        IF(@input_run_mode='T') 
        BEGIN
            UPDATE ##data_transfer_verify_data_map SET table_is_supported = 1 WHERE
                   [ID] = @id
        END
        ELSE
        BEGIN 
            set @dynamic_sql = 'DECLARE @count int '
            set @dynamic_sql = @dynamic_sql + ' SET @count = 0'
             
        END  
    END
    --*************************************************
    /*  
     *  address
     */
    IF @table_name = 'address' AND  @is_ownership_update = 1
    BEGIN
        IF(@input_run_mode='T') 
        BEGIN
            UPDATE ##data_transfer_verify_data_map SET table_is_supported = 1 WHERE
                   [ID] = @id AND is_ownership_update=1
        END
        ELSE
        BEGIN 
            set @dynamic_sql = 'DECLARE @count int '
            set @dynamic_sql = @dynamic_sql + ' SET @count = 0'
             
        END  
    END
    --*************************************************
    /*  
     *  property
     */
    IF @table_name = 'property' AND  @is_ownership_update = 1
    BEGIN
        IF(@input_run_mode='T') 
        BEGIN
            UPDATE ##data_transfer_verify_data_map SET table_is_supported = 1 WHERE
                   [ID] = @id AND is_ownership_update=1
        END
        ELSE
        BEGIN 
            set @dynamic_sql = 'DECLARE @count int '
            set @dynamic_sql = @dynamic_sql + ' SET @count = 0'
             
        END  
    END

    /*  
     *  entity for ownership property data transfer
     */
    IF @table_name = 'entity' and @is_ownership_update = 0 
    BEGIN
        IF(@input_run_mode='T') 
        BEGIN
            UPDATE ##data_transfer_verify_data_map SET table_is_supported = 1 WHERE
                   [ID] = @id AND is_ownership_update= 0
        END
        ELSE
        BEGIN 
            set @dynamic_sql = 'DECLARE @count int '
            set @dynamic_sql = @dynamic_sql + ' SET @count = 0'
             
        END  
    END
    /*  
     *  entity for ownership update
     */
    IF @table_name = 'entity' and @is_ownership_update = 1 
    BEGIN
        IF(@input_run_mode='T') 
        BEGIN
            UPDATE ##data_transfer_verify_data_map SET table_is_supported = 1 WHERE
                   [ID] = @id AND is_ownership_update=1
        END
        ELSE
        BEGIN 
            set @dynamic_sql = 'DECLARE @count int '
            set @dynamic_sql = @dynamic_sql + ' SET @count = 0'
             
        END  
    END
    --*************************************************
    /*  select * from ##data_transfer_verify_data_map
     *  table name
     * */
    /*IF @table_name = '' 
    BEGIN
        IF(@input_run_mode='T') 
        BEGIN
            UPDATE ##data_transfer_verify_data_map SET table_is_supported = 1 WHERE
                   [ID] = @id
        END
        ELSE
        BEGIN 
            set @dynamic_sql = 'DECLARE @count int '
            set @dynamic_sql = @dynamic_sql + ' SET @count = 0'
             
        END  
    END */


 












    FETCH NEXT FROM tables_cursor INTO @id, @table_name,@temp_table_name,@is_ownership_update
--
END --WHILE CURSOR

CLOSE tables_cursor
DEALLOCATE tables_cursor

GO


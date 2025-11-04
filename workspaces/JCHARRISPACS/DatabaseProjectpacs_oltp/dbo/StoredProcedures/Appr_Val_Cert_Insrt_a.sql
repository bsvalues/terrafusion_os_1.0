

CREATE PROCEDURE Appr_Val_Cert_Insrt_a 
  @pacs_user_id_ int,
  @prop_id int,  
  @owner_id int,
  @sup_num int,
  @owner_tax_yr int
 AS 
--temps
DECLARE 
        @per_val_yr int,  
        @entity_cd char(5),
        @entity_name varchar(60),
        @land_MKT  int,
        @land_appr int,
        @impr_mkt int,
        @impr_appr int,
        @MKT int,
        @appraised int,
        @CAP int,
        @assesed int,
        @taxable int,
        @entity_id int
   
--set the cursor to retrieve all the entities
DECLARE entities_cursor CURSOR FOR
SELECT entity_id, taxable_val, assessed_val, ten_percent_cap,
       land_hstd_val+land_non_hstd_val+ag_use_val+timber_use,
       land_hstd_val+land_non_hstd_val+ag_market+timber_market,
       imprv_hstd_val + imprv_non_hstd_val,
       imprv_hstd_val + imprv_non_hstd_val,
       appraised_val,
       market_val
FROM prop_owner_entity_val_preview
WHERE pacs_user_id = @pacs_user_id_ AND owner_id=@owner_id AND prop_id=@prop_id

OPEN entities_cursor
FETCH NEXT FROM entities_cursor

INTO @entity_id,@taxable,@assesed,@CAP, @land_appr, @land_MKT, @impr_appr, @impr_mkt, @appraised, @MKT
WHILE ( @@FETCH_STATUS = 0)
BEGIN 
  select @entity_cd   = (select entity_cd from entity where entity_id=@entity_id)
  select @entity_name = (select file_as_name from TAX_ENTITY_VW WHERE entity_entity_id = @entity_id)  
  --fill the exemptions db 'value_cert_notice_entity_exemp
  exec Appr_Val_Cert_Insrt_exemptions @pacs_user_id_, @prop_id, @entity_id, @owner_id, @sup_num, @owner_tax_yr 
  --insert the value into the db
  INSERT INTO value_cert_notice_entity(pacs_user_id,
                                        prop_id,
                                        owner_id,
                                        entity_cd,
                                        entity_name,
                                        taxable,
                                        assessed,
					cap,
                                        entity_id,
                                        land_appr,
                                        land_mkt,
                                        imprv_appr,
                                        imprv_mkt,
                                        appraised,
                                        mkt,
                                        sup_num
                                        ) 
          VALUES(@pacs_user_id_,
                 @prop_id,
                 @owner_id,
                 @entity_cd,
                 @entity_name,
                 @taxable,
                 @assesed,
                 @CAP,
                 @entity_id,
                 @land_appr,
                 @land_MKT,
                 @impr_appr,
                 @impr_mkt,
                 @appraised,
                 @MKT,
                 @sup_num)
   -- This is executed as long as the previous fetch succeeds.
   FETCH NEXT FROM entities_cursor
   INTO @entity_id,@taxable,@assesed,@CAP, @land_appr, @land_MKT, @impr_appr, @impr_mkt, @appraised, @MKT
END

CLOSE entities_cursor
DEALLOCATE entities_cursor

GO


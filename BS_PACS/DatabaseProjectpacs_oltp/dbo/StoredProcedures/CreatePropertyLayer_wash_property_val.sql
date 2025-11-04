CREATE   PROCEDURE CreatePropertyLayer_wash_property_val
	@lInputFromYear numeric(4,0),
    @lCopyToYear numeric(4,0),
    @CalledBy varchar(50) 
 
AS
 
/* Top of each procedure to capture input parameters */
SET NOCOUNT ON
DECLARE @Rows int
DECLARE @qry varchar(255)
 declare @proc varchar(500)
 set @proc = object_name(@@procid)
 
 SET @qry = 'Start - ' + @proc + ' ' + convert(char(4),@lInputFromYear)
         + ',' + convert(char(4),@lCopyToYear) + ',' + @CalledBy
 
 exec dbo.CurrentActivityLogInsert @proc, @qry

-- set variable for final status entry
 set @qry = Replace(@qry,'Start','End')
 
/* End top of each procedure to capture parameters */
INSERT INTO 
    wash_property_val
(
    prop_val_yr
   ,sup_num
   ,prop_id
   ,appraised_classified
   ,appraised_non_classified
   ,snr_imprv
   ,snr_land
   ,snr_new_val
   ,snr_qualify_yr
   ,snr_qualify_yr_override
   ,snr_frz_imprv_hs
   ,snr_frz_land_hs
   ,snr_frz_imprv_hs_override
   ,snr_frz_land_hs_override
   ,snr_taxable_portion
   ,snr_exempt_loss
   ,snr_portion_applied
   ,snr_new_val_override
   ,comment_update_date
   ,comment_update_user
   ,snr_comment
   --,tsRowVersion  timestamp column
   ,snr_imprv_lesser
   ,snr_land_lesser
   ,recalc_error_validate_flag
   ,recalc_error_validate_date
   ,recalc_error_validate_user_id
	 ,snr_imprv_hs
	 ,snr_imprv_hs_override
	 ,snr_land_hs
	 ,snr_land_hs_override
	 ,snr_ag_hs
	 ,snr_ag_hs_override
	 ,snr_timber_hs
	 ,snr_timber_hs_override
)
SELECT 
    @lCopyToYear
    ,0  --upv.sup_num
    ,upv.prop_id
    ,upv.appraised_classified
    ,upv.appraised_non_classified
    ,upv.snr_imprv
    ,upv.snr_land
    ,0 --upv.snr_new_val
    ,upv.snr_qualify_yr
    ,upv.snr_qualify_yr_override
    ,upv.snr_frz_imprv_hs + upv.snr_new_val --snr_frz_imprv_hs
    ,upv.snr_frz_land_hs
    ,0 --upv.snr_frz_imprv_hs_override
    ,0 --upv.snr_frz_land_hs_override
    ,upv.snr_taxable_portion
    ,upv.snr_exempt_loss
    ,upv.snr_portion_applied
    ,0 --upv.snr_new_val_override
    ,upv.comment_update_date
    ,upv.comment_update_user
    ,upv.snr_comment
    --,upv.tsRowVersion  timestamp column
    ,upv.snr_imprv_lesser
    ,upv.snr_land_lesser
   ,upv.recalc_error_validate_flag
   ,upv.recalc_error_validate_date
   ,upv.recalc_error_validate_user_id
	 ,upv.snr_imprv_hs
	 ,upv.snr_imprv_hs_override
	 ,upv.snr_land_hs
	 ,upv.snr_land_hs_override
	 ,upv.snr_ag_hs
	 ,upv.snr_ag_hs_override
	 ,upv.snr_timber_hs
	 ,upv.snr_timber_hs_override
 FROM create_property_layer_prop_list as cplpl with(tablockx) join 
      wash_property_val as upv  with(tablockx) 
   on upv.prop_val_yr = cplpl.prop_val_yr
 and upv.sup_num = cplpl.sup_num
 and upv.prop_id = cplpl.prop_id

-- update log
exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR

GO


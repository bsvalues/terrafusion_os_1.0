CREATE   PROCEDURE [dbo].[CreateFY_NY_SL_destroyed_property]
	@lInputFromYear numeric(4,0),
    @lCopyToYear numeric(4,0),
    @CalledBy varchar(10) 
 
AS
 
/* Top of each procedure to capture input parameters */
SET NOCOUNT ON
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
    destroyed_property
(
    prop_val_yr
   ,sup_num
   ,prop_id
   ,date_destroyed
   ,january_one_value
   ,january_one_land_value
   ,january_one_imprv_value
   ,jan1_taxable_classified
   ,jan1_taxable_non_classified
   ,after_destruction_value
   ,after_destruction_land_value
   ,after_destruction_imprv_value
   ,reduction_value
   ,reduction_land_value
   ,reduction_imprv_value
   ,percent_destroyed
   ,days_prior
   ,days_after
   ,cause
   ,date_approved
   ,appraiser
)
SELECT 
    @lCopyToYear
    ,0 --ll.sup_num
    ,ll.prop_id
    ,ll.date_destroyed
    ,ll.january_one_value
    ,ll.january_one_land_value
    ,ll.january_one_imprv_value
    ,ll.jan1_taxable_classified
    ,ll.jan1_taxable_non_classified
    ,ll.after_destruction_value
    ,ll.after_destruction_land_value
    ,ll.after_destruction_imprv_value
    ,ll.reduction_value
    ,ll.reduction_land_value
    ,ll.reduction_imprv_value
    ,ll.percent_destroyed
    ,ll.days_prior
    ,ll.days_after
    ,ll.cause
    ,ll.date_approved
    ,ll.appraiser
 FROM 
    destroyed_property as ll LEFT JOIN 
     (select @lInputFromYear as prop_val_yr,sup_num,prop_id
        from destroyed_property with (nolock) 
       where prop_val_yr = @lCopyToYear) as fy_ll
   on ll.prop_val_yr = fy_ll.prop_val_yr
   join property_val as pv
   on ll.prop_id = pv.prop_id and 
   ll.prop_val_yr = pv.prop_val_yr and 
   ll.sup_num = pv.sup_num
 and ll.sup_num = fy_ll.sup_num
 and ll.prop_id = fy_ll.prop_id
 and ll.sup_num = fy_ll.sup_num
 and ll.prop_id = fy_ll.prop_id

  where ll.prop_val_yr = @lInputFromYear
 and fy_ll.prop_val_yr is null -- only return those not already inserted
 
 
-- update log
exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR

GO


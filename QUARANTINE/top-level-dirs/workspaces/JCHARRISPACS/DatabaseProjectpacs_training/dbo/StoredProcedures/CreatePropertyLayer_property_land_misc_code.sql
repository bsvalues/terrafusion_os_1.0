CREATE   PROCEDURE CreatePropertyLayer_property_land_misc_code
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
    property_land_misc_code
(
    prop_id
   ,prop_val_yr
   ,sup_num
   ,sale_id
   ,misc_id
   ,county_indicator
   ,cycle
   ,region_cd
   ,hood_cd
   ,subset_cd
   ,misc_code
   ,[value]
   ,[index]
   ,indexed_value
)
SELECT 
    plmc.prop_id
    ,@lCopyToYear
    ,0  --plmc.sup_num
    ,0	--plmc.sale_id
    ,plmc.misc_id
    ,plmc.county_indicator
    ,plmc.cycle
    ,plmc.region_cd
    ,plmc.hood_cd
    ,plmc.subset_cd
    ,plmc.misc_code
    ,plmc.[value]
    ,plmc.[index]
    ,plmc.indexed_value
 FROM create_property_layer_prop_list as cplpl with(tablockx) join 
      property_land_misc_code as plmc  with(tablockx) 
   on plmc.prop_val_yr = cplpl.prop_val_yr
 and plmc.sup_num = cplpl.sup_num
 and plmc.prop_id = cplpl.prop_id
 and plmc.sale_id = 0
 
-- update log
exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR

GO


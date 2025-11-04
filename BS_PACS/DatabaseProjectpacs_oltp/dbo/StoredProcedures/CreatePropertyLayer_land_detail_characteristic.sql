CREATE   PROCEDURE CreatePropertyLayer_land_detail_characteristic
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
    land_detail_characteristic
(
    prop_id
   ,prop_val_yr
   ,sup_num
   ,sale_id
   ,land_seg_id
   ,characteristic_cd
   ,[override]
   ,determinant_cd
   ,is_from_property
)
SELECT 
    ldc.prop_id
    ,@lCopyToYear
    ,0   --ldc.sup_num
    ,0   --ldc.sale_id
    ,ldc.land_seg_id
    ,ldc.characteristic_cd
    ,ldc.override
    ,ldc.determinant_cd
    ,ldc.is_from_property
 FROM create_property_layer_prop_list as cplpl with(tablockx) join 
      land_detail_characteristic as ldc  with(tablockx) 
   on ldc.prop_val_yr = cplpl.prop_val_yr
 and ldc.sup_num = cplpl.sup_num
 and ldc.sale_id = 0
 and ldc.prop_id = cplpl.prop_id
 
-- update log

exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR

GO


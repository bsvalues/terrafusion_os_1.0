CREATE   PROCEDURE CreatePropertyLayer_prop_characteristic_assoc
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
    prop_characteristic_assoc
(
    prop_val_yr
   ,sup_num
   ,sale_id
   ,prop_id
   ,characteristic_cd
   ,attribute_cd
)
SELECT 
    @lCopyToYear
    ,0  --psa.sup_num
    ,0  --pca.sale_id
    ,pca.prop_id
    ,pca.characteristic_cd
    ,pca.attribute_cd
 FROM create_property_layer_prop_list as cplpl with(tablockx) join 
      prop_characteristic_assoc as pca  with(tablockx) 
   on pca.prop_val_yr = cplpl.prop_val_yr
 and pca.sup_num = cplpl.sup_num
 and pca.prop_id = cplpl.prop_id
 and pca.sale_id = 0
 
-- update log

exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR

GO


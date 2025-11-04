CREATE   PROCEDURE CreatePropertyLayer_property_income_characteristic_amount
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
    property_income_characteristic_amount
(
    year
   ,sup_num
   ,prop_id
   ,pic_id
   ,code
   ,quality
   ,[type]
)
SELECT 
    @lCopyToYear
    ,0  --pica.sup_num
    ,pica.prop_id
    ,pica.pic_id
    ,pica.code
    ,pica.quality
    ,pica.[type]
 FROM create_property_layer_prop_list as cplpl with(tablockx) join 
      property_income_characteristic_amount as pica  with(tablockx) 
   on pica.year = cplpl.prop_val_yr
 and pica.sup_num = cplpl.sup_num
 and pica.prop_id = cplpl.prop_id
 
-- update log
exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR

GO


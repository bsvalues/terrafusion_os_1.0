CREATE   PROCEDURE CreatePropertyLayer_property_legal_description
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
    property_legal_description
(
    prop_val_yr
   ,sup_num
   ,prop_id
   ,metes_and_bounds
)
SELECT 
    @lCopyToYear
    ,0  --pld.sup_num
    ,pld.prop_id
    ,pld.metes_and_bounds
 FROM create_property_layer_prop_list as cplpl with(tablockx) join 
      property_legal_description as pld  with(tablockx) 
   on pld.prop_val_yr = cplpl.prop_val_yr
 and pld.sup_num = cplpl.sup_num
 and pld.prop_id = cplpl.prop_id

-- update log
exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR

GO


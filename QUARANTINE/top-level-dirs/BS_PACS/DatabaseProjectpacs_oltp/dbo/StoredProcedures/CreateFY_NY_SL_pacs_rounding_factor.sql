CREATE   PROCEDURE CreateFY_NY_SL_pacs_rounding_factor
	@lInputFromYear numeric(4,0),
    @lCopyToYear numeric(4,0),
    @CalledBy varchar(10) 
 
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
 
/* End top of each procedure to capture parameters */
INSERT INTO 
    pacs_rounding_factor
(
    prop_val_yr
   ,rounding_factor
   ,rounding_income_factor
)
SELECT 
    @lCopyToYear
    ,prf.rounding_factor
    ,prf.rounding_income_factor
 FROM 
    pacs_rounding_factor as prf LEFT JOIN 
     (select @lInputFromYear as prop_val_yr
        from pacs_rounding_factor with (nolock) 
       where prop_val_yr = @lCopyToYear) as fy_prf
   on prf.prop_val_yr = fy_prf.prop_val_yr

  where prf.prop_val_yr = @lInputFromYear
 and fy_prf.prop_val_yr is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO


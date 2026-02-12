CREATE   PROCEDURE CreateFY_NY_SL_ms_multi_mult
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
    ms_multi_mult
(
    ms_year
   ,masonary_local_mult
   ,masonary_cost_mult
   ,frame_local_mult
   ,frame_cost_mult
)
SELECT 
    @lCopyToYear
    ,mmm.masonary_local_mult
    ,mmm.masonary_cost_mult
    ,mmm.frame_local_mult
    ,mmm.frame_cost_mult
 FROM 
    ms_multi_mult as mmm LEFT JOIN 
     (select @lInputFromYear as ms_year
        from ms_multi_mult with (nolock) 
       where ms_year = @lCopyToYear) as fy_mmm
   on mmm.ms_year = fy_mmm.ms_year

  where mmm.ms_year = @lInputFromYear
 and fy_mmm.ms_year is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO


CREATE   PROCEDURE CreateFY_NY_SL_ms_manuf_mult
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
    ms_manuf_mult
(
    ms_year
   ,local_mult
   ,cost_mult
)
SELECT 
    @lCopyToYear
    ,mmmm.local_mult
    ,mmmm.cost_mult
 FROM 
    ms_manuf_mult as mmmm LEFT JOIN 
     (select @lInputFromYear as ms_year
        from ms_manuf_mult with (nolock) 
       where ms_year = @lCopyToYear) as fy_mmmm
   on mmmm.ms_year = fy_mmmm.ms_year

  where mmmm.ms_year = @lInputFromYear
 and fy_mmmm.ms_year is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO


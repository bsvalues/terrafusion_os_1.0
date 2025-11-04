CREATE   PROCEDURE CreateFY_NY_SL_land_sched_ff_detail
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
    land_sched_ff_detail
(
    ls_detail_id
   ,ls_id
   ,ls_year
   ,ls_range_max
   ,ls_range_price
   ,ls_range_pc
   ,ls_range_adj_price
   ,ls_range_interpolate_inc
)
SELECT 
    lsfd.ls_detail_id
    ,lsfd.ls_id
    ,@lCopyToYear
    ,lsfd.ls_range_max
    ,lsfd.ls_range_price
    ,lsfd.ls_range_pc
    ,lsfd.ls_range_adj_price
    ,lsfd.ls_range_interpolate_inc
 FROM 
    land_sched_ff_detail as lsfd LEFT JOIN 
     (select ls_id,@lInputFromYear as ls_year,ls_detail_id
        from land_sched_ff_detail with (nolock) 
       where ls_year = @lCopyToYear) as fy_lsfd
   on lsfd.ls_id = fy_lsfd.ls_id
 and lsfd.ls_year = fy_lsfd.ls_year
 and lsfd.ls_detail_id = fy_lsfd.ls_detail_id

  where lsfd.ls_year = @lInputFromYear
 and fy_lsfd.ls_year is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO


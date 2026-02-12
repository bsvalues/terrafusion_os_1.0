CREATE   PROCEDURE CreateFY_NY_SL_land_sched_detail
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
    land_sched_detail
(
    ls_detail_id
   ,ls_id
   ,ls_year
   ,ls_range_max
   ,ls_range_price
   ,ls_range_pc
   ,ls_range_adj_price
   ,ls_range_interpolate_inc
   ,land_price_type
)
SELECT 
    lsd.ls_detail_id
    ,lsd.ls_id
    ,@lCopyToYear
    ,lsd.ls_range_max
    ,lsd.ls_range_price
    ,lsd.ls_range_pc
    ,lsd.ls_range_adj_price
    ,lsd.ls_range_interpolate_inc
    ,lsd.land_price_type
 FROM 
    land_sched_detail as lsd LEFT JOIN 
     (select ls_id,@lInputFromYear as ls_year,ls_detail_id
        from land_sched_detail with (nolock) 
       where ls_year = @lCopyToYear) as fy_lsd
   on lsd.ls_id = fy_lsd.ls_id
 and lsd.ls_year = fy_lsd.ls_year
 and lsd.ls_detail_id = fy_lsd.ls_detail_id

  where lsd.ls_year = @lInputFromYear
 and fy_lsd.ls_year is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO


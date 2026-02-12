CREATE   PROCEDURE CreateFY_NY_SL_rendition_penalty_config
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
    rendition_penalty_config
(
    year
   ,start_date
   ,end_date
   ,penalty_percent
   ,penalty_id
)
SELECT 
    @lCopyToYear
    ,dateadd(year, 1, rpc.start_date)
    ,dateadd(year, 1, rpc.end_date)
    ,rpc.penalty_percent	
    ,rpc.penalty_id
 FROM 
    rendition_penalty_config as rpc LEFT JOIN 
     (select @lInputFromYear as year
        from rendition_penalty_config with (nolock) 
       where year = @lCopyToYear) as fy_rpc
   on rpc.year = fy_rpc.year

  where rpc.year = @lInputFromYear
 and fy_rpc.year is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO


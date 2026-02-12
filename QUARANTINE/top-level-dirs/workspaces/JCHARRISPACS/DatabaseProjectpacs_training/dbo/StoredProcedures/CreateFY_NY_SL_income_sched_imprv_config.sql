CREATE PROCEDURE CreateFY_NY_SL_income_sched_imprv_config
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
		income_sched_imprv_config
(
		[year],
		match_by_economic_area
)
SELECT 
    @lCopyToYear,
		prf.match_by_economic_area
    
 FROM 
    income_sched_imprv_config as prf LEFT JOIN 
     (select @lInputFromYear as [year]
        from income_sched_imprv_config with (nolock) 
       where [year] = @lCopyToYear) as fy_prf
   on prf.[year] = fy_prf.[year]

  where prf.[year] = @lInputFromYear
 and fy_prf.[year] is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO


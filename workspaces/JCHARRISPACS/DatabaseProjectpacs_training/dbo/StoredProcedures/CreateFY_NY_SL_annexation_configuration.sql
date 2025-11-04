CREATE   PROCEDURE CreateFY_NY_SL_annexation_configuration
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
    annexation_configuration
(
    year
   ,coterminous_start_date
   ,coterminous_cutoff_date
   ,non_coterminous_start_date
   ,non_coterminous_cutoff_date
)
SELECT 
    @lCopyToYear
    ,ac.coterminous_start_date
    ,ac.coterminous_cutoff_date
    ,ac.non_coterminous_start_date
    ,ac.non_coterminous_cutoff_date
 FROM 
    annexation_configuration as ac LEFT JOIN 
     (select @lInputFromYear as year
        from annexation_configuration with (nolock) 
       where year = @lCopyToYear) as fy_ac
   on ac.year = fy_ac.year

  where ac.year = @lInputFromYear
 and fy_ac.year is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO


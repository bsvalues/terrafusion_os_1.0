CREATE   PROCEDURE CreateFY_NY_SL_ms_comm_local_mult
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
    ms_comm_local_mult
(
    ms_year
   ,local_class
   ,local_value
)
SELECT 
    @lCopyToYear
    ,mclm.local_class
    ,mclm.local_value
 FROM 
    ms_comm_local_mult as mclm LEFT JOIN 
     (select @lInputFromYear as ms_year,local_class
        from ms_comm_local_mult with (nolock) 
       where ms_year = @lCopyToYear) as fy_mclm
   on mclm.ms_year = fy_mclm.ms_year
 and mclm.local_class = fy_mclm.local_class

  where mclm.ms_year = @lInputFromYear
 and fy_mclm.ms_year is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO


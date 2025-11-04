CREATE   PROCEDURE CreateFY_NY_SL_ms_comm_cost_mult
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
    ms_comm_cost_mult
(
    ms_year
   ,cost_class
   ,cost_section
   ,cost_value
)
SELECT 
    @lCopyToYear
    ,mccm.cost_class
    ,mccm.cost_section
    ,mccm.cost_value
 FROM 
    ms_comm_cost_mult as mccm LEFT JOIN 
     (select @lInputFromYear as ms_year,cost_class,cost_section
        from ms_comm_cost_mult with (nolock) 
       where ms_year = @lCopyToYear) as fy_mccm
   on mccm.ms_year = fy_mccm.ms_year
 and mccm.cost_class = fy_mccm.cost_class
 and mccm.cost_section = fy_mccm.cost_section

  where mccm.ms_year = @lInputFromYear
 and fy_mccm.ms_year is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO


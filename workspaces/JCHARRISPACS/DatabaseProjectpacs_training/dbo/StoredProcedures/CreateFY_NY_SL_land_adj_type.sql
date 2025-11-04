CREATE   PROCEDURE CreateFY_NY_SL_land_adj_type
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
    land_adj_type
(
    land_adj_type_year
   ,land_adj_type_cd
   ,land_adj_type_desc
   ,land_adj_type_usage
   ,land_adj_type_amt
   ,land_adj_type_pct
   ,rc_type
	 ,inactive
)
SELECT 
    @lCopyToYear
    ,lat.land_adj_type_cd
    ,lat.land_adj_type_desc
    ,lat.land_adj_type_usage
    ,lat.land_adj_type_amt
    ,lat.land_adj_type_pct
    ,lat.rc_type
		,lat.inactive
 FROM 
    land_adj_type as lat LEFT JOIN 
     (select @lInputFromYear as land_adj_type_year,land_adj_type_cd
        from land_adj_type with (nolock) 
       where land_adj_type_year = @lCopyToYear) as fy_lat
   on lat.land_adj_type_year = fy_lat.land_adj_type_year
 and lat.land_adj_type_cd = fy_lat.land_adj_type_cd

  where lat.land_adj_type_year = @lInputFromYear
 and fy_lat.land_adj_type_year is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO


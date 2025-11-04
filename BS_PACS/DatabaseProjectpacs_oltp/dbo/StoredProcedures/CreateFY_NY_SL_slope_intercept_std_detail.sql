CREATE   PROCEDURE CreateFY_NY_SL_slope_intercept_std_detail
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
    slope_intercept_std_detail
(
    sid_hood_cd
   ,sid_type_cd
   ,sid_year
   ,sid_detail_id
   ,condition_cd
   ,heat_ac_cd
   ,age_max
   ,slope
   ,y_intercept
)
SELECT 
    sisd.sid_hood_cd
    ,sisd.sid_type_cd
    ,@lCopyToYear
    ,sisd.sid_detail_id
    ,sisd.condition_cd
    ,sisd.heat_ac_cd
    ,sisd.age_max
    ,sisd.slope
    ,sisd.y_intercept
 FROM 
    slope_intercept_std_detail as sisd LEFT JOIN 
     (select @lInputFromYear as sid_year,sid_hood_cd,sid_type_cd,sid_detail_id
        from slope_intercept_std_detail with (nolock) 
       where sid_year = @lCopyToYear) as fy_sisd
   on sisd.sid_year = fy_sisd.sid_year
 and sisd.sid_hood_cd = fy_sisd.sid_hood_cd
 and sisd.sid_type_cd = fy_sisd.sid_type_cd
 and sisd.sid_detail_id = fy_sisd.sid_detail_id

  where sisd.sid_year = @lInputFromYear
 and fy_sisd.sid_year is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO


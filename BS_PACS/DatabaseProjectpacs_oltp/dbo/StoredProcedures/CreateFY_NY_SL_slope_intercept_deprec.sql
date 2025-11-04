CREATE   PROCEDURE CreateFY_NY_SL_slope_intercept_deprec
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
    slope_intercept_deprec
(
    sid_hood_cd
   ,sid_type_cd
   ,sid_year
)
SELECT 
    sid.sid_hood_cd
    ,sid.sid_type_cd
    ,@lCopyToYear
 FROM 
    slope_intercept_deprec as sid LEFT JOIN 
     (select @lInputFromYear as sid_year,sid_hood_cd,sid_type_cd
        from slope_intercept_deprec with (nolock) 
       where sid_year = @lCopyToYear) as fy_sid
   on sid.sid_year = fy_sid.sid_year
 and sid.sid_hood_cd = fy_sid.sid_hood_cd
 and sid.sid_type_cd = fy_sid.sid_type_cd

  where sid.sid_year = @lInputFromYear
 and fy_sid.sid_year is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO


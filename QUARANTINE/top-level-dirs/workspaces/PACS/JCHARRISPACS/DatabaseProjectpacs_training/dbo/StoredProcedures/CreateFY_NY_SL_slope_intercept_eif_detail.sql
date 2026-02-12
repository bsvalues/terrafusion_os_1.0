CREATE   PROCEDURE CreateFY_NY_SL_slope_intercept_eif_detail
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
    slope_intercept_eif_detail
(
    sid_hood_cd
   ,sid_type_cd
   ,sid_year
   ,sid_detail_id
   ,condition_cd
   ,eif
)
SELECT 
    sied.sid_hood_cd
    ,sied.sid_type_cd
    ,@lCopyToYear
    ,sied.sid_detail_id
    ,sied.condition_cd
    ,sied.eif
 FROM 
    slope_intercept_eif_detail as sied LEFT JOIN 
     (select @lInputFromYear as sid_year,sid_hood_cd,sid_type_cd,condition_cd
        from slope_intercept_eif_detail with (nolock) 
       where sid_year = @lCopyToYear) as fy_sied
   on sied.sid_year = fy_sied.sid_year
 and sied.sid_hood_cd = fy_sied.sid_hood_cd
 and sied.sid_type_cd = fy_sied.sid_type_cd
 and sied.condition_cd = fy_sied.condition_cd

  where sied.sid_year = @lInputFromYear
 and fy_sied.sid_year is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO


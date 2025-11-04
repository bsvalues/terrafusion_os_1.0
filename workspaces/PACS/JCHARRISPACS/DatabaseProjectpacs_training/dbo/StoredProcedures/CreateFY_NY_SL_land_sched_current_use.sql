CREATE   PROCEDURE CreateFY_NY_SL_land_sched_current_use
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
    land_sched_current_use
(
    ls_id
   ,ls_year
   ,soil_type_cd
   ,calculate
   ,rental_rate
   ,cap_rate
   ,rate_per_acre
)
SELECT 
    lscu.ls_id
    ,@lCopyToYear
    ,lscu.soil_type_cd
    ,lscu.calculate
    ,lscu.rental_rate
    ,lscu.cap_rate
    ,lscu.rate_per_acre
 FROM 
    land_sched_current_use as lscu LEFT JOIN 
     (select ls_id,@lInputFromYear as ls_year,soil_type_cd
        from land_sched_current_use with (nolock) 
       where ls_year = @lCopyToYear) as fy_lscu
   on lscu.ls_id = fy_lscu.ls_id
 and lscu.ls_year = fy_lscu.ls_year
 and lscu.soil_type_cd = fy_lscu.soil_type_cd

  where lscu.ls_year = @lInputFromYear
 and fy_lscu.ls_year is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO


CREATE   PROCEDURE CreateFY_NY_SL_land_sched_soil_detail
	@lInputFromYear numeric(4,0),
    @lCopyToYear numeric(4,0),
    @CalledBy varchar(50) 
 
AS
 
/* Top of each procedure to capture input parameters */
SET NOCOUNT ON
DECLARE @StartProc datetime
    SET @StartProc = getdate()
DECLARE @StartStep datetime
DECLARE @LogTotRows int
DECLARE @LogStatus varchar(200)
DECLARE @LogErrCode int
DECLARE @qry varchar(1000)
 declare @proc varchar(100)
 set @proc = object_name(@@procid)
 
 SET @qry = 'Start - ' + @proc  
 + ' @lInputFromYear =' +  convert(varchar(30),@lInputFromYear) + ','
 + ' @lCopyToYear =' +  convert(varchar(30),@lCopyToYear) + ','
 + ' @CalledBy =' + @CalledBy 
 
 exec dbo.CurrentActivityLogInsert @proc, @qry
 
-- set variable for final status entry
 set @qry = @qry + ' Total Duration in secs: '
 set @qry = Replace(@qry,'Start','End')
 
/* End top of each procedure to capture parameters */
 
set @StartStep = getdate()  --logging capture start time of step

INSERT INTO 
    land_sched_soil_detail
(
    ls_id
   ,ls_year
   ,land_soil_code
   ,calculate_rate
   ,rental_rate
   ,cap_rate
   ,rate_per_acre
)SELECT 
    lssd.ls_id
    ,@lCopyToYear
    ,lssd.land_soil_code
    ,lssd.calculate_rate
    ,lssd.rental_rate
    ,lssd.cap_rate
    ,lssd.rate_per_acre
 FROM 
    land_sched_soil_detail as lssd 
    LEFT JOIN 
     (select ls_id,@lInputFromYear as ls_year,land_soil_code
        from land_sched_soil_detail with (nolock) 
       where ls_year = @lCopyToYear) as fy_lssd
   on lssd.ls_id = fy_lssd.ls_id
 and lssd.ls_year = fy_lssd.ls_year
 and lssd.land_soil_code = fy_lssd.land_soil_code
     inner join
     land_sched as ls  -- fk relationship,so verify key values exists in parent table for New Year
   on lssd.ls_id = ls.ls_id
  and ls.ls_year = @lCopyToYear
  where lssd.ls_year = @lInputFromYear
 and fy_lssd.ls_year is null -- only return those not already inserted

 -- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogStatus =  'Step 1 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 
 
-- end of procedure update log
SET @qry = @qry + convert(varchar(30),datediff(s,@StartProc,getdate()))
exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR

GO


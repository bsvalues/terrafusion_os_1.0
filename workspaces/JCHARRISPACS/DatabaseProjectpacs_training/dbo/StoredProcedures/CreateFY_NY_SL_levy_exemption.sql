CREATE   PROCEDURE CreateFY_NY_SL_levy_exemption
	@lInputFromYear numeric(4,0),
    @lCopyToYear numeric(4,0),
    @CalledBy varchar(10) 
 
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

INSERT INTO 
    levy_exemption
(
    year
   ,tax_district_id
   ,levy_cd
   ,exmpt_type_cd
)
SELECT 
    @lCopyToYear
    ,le.tax_district_id
    ,le.levy_cd
    ,le.exmpt_type_cd
 FROM 
    levy as l with (nolock) 
 JOIN
    levy_exemption as le 
   ON l.year = @lCopyToYear -- only get records where matching levy records have been copied 
  and le.year = @lInputFromYear
  and l.tax_district_id = le.tax_district_id
  and l.levy_cd = le.levy_cd

 LEFT JOIN 
     (select @lInputFromYear as year,tax_district_id,levy_cd,exmpt_type_cd
        from levy_exemption with (nolock) 
       where year = @lCopyToYear) as fy_le
   on le.year = fy_le.year
 and le.tax_district_id = fy_le.tax_district_id
 and le.levy_cd = fy_le.levy_cd
 and le.exmpt_type_cd = fy_le.exmpt_type_cd
  where le.year = @lInputFromYear
 and fy_le.year is null -- only return those not already inserted

SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR  
 
-- end of procedure update log
SET @qry = @qry + convert(varchar(30),datediff(s,@StartProc,getdate()))
exec dbo.CurrentActivityLogInsert @proc, @qry,@LogTotRows,@LogErrCode

GO


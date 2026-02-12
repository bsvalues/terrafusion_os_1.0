CREATE   PROCEDURE CreateFY_NY_SL_holiday_year
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
declare @newId int
declare @CopyFromId int

SELECT @CopyFromId = holiday_id
  FROM holiday_year 
 WHERE holiday_yr = @lInputFromYear

IF NOT EXISTS(SELECT * FROM holiday_year WHERE holiday_yr = @lCopyToYear)
   begin
   INSERT INTO holiday_year (holiday_yr)
    VALUES (@lCopyToYear)

   set @newId = SCOPE_IDENTITY()

   if NOT EXISTS(SELECT 1 FROM holiday_schedule WHERE YEAR(holiday_date) = @lCopyToYear)
      begin
	   INSERT INTO 
		holiday_schedule
	(
		holiday_id
	   ,holiday_date
	   ,holiday_desc
	   ,holiday_days
	   ,office_holiday
	   ,bank_holiday
	)
	SELECT 
		@newId
		,convert(varchar(2),month(holiday_date)) + '/' 
		   + convert(varchar(2),day(holiday_date)) + '/' 
		   + convert(char(4),@lCopyToYear)
		,prf.holiday_desc
		,prf.holiday_days
		,prf.office_holiday
		,prf.bank_holiday
	 FROM 
		holiday_schedule as prf 
	  where YEAR(prf.holiday_date) = @lInputFromYear 
        and holiday_id = @CopyFromId
   end
 end
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO



-- exec WATaxStatementLevyCreate_DeleteEvents 1,2011,1,1

create procedure WATaxStatementLevyCreate_DeleteEvents
	@pacs_user_id int,
	@year numeric(4,0),
	@group_id int,
	@run_id int

as


/* Top of each procedure to capture input parameters */
SET NOCOUNT ON


DECLARE @StartProc datetime
    SET @StartProc = getdate()
DECLARE @StartStep datetime
DECLARE @LogTotRows int
DECLARE @LogStatus varchar(200)
DECLARE @LogErrCode int
DECLARE @qry varchar(255)
 declare @proc varchar(500)
 set @proc = object_name(@@procid)

 SET @qry = 'Start - ' + @proc  
 + ' @pacs_user_id =' +  convert(varchar(30),@pacs_user_id) + ','
 + ' @year =' +  convert(varchar(30),@year) + ','
 + ' @group_id =' +  convert(varchar(30),@group_id) + ','
 + ' @run_id =' +  convert(varchar(30),@run_id)
 
 exec dbo.CurrentActivityLogInsert @proc, @qry
 
-- set variable for final status entry
 set @qry = @qry + ' Total Duration in secs: '
 set @qry = Replace(@qry,'Start','End')
 
/* End top of each procedure to capture parameters */

set @StartStep = getdate()
SET @LogStatus =  'Step 1 Start '

BEGIN TRY   --- SET UP ERROR HANDLING

declare @pacs_user varchar(30)
    set @pacs_user = convert(varchar(30),@pacs_user_id)


create table #deletes (event_id int)

insert into #deletes
 ( event_id)
   select event_id

     from [event] as e 
    where ref_id1 = @group_id
      and ref_year = @year
      and ref_id3 = @run_id
      and event_type = 'SYSTEM'
      and system_type = 'C'
      and pacs_user = @pacs_user_id

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus =  'Step 1 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus =  'Step 2 Start '
	 
create clustered index idx_event_id on #deletes(event_id)



SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus =  'Step 2 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus =  'Step 3 Start '
 
delete pea
  from prop_event_assoc as pea
       join
       #deletes as d 
    on pea.event_id = d.event_id

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus =  'Step 3 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus =  'Step 4 Start '

delete aea
  from account_event_assoc as aea
       join
       #deletes as d 
    on aea.event_id = d.event_id

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus =  'Step 4 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

set @StartStep = getdate()
SET @LogStatus =  'Step 5 Start '

delete e
  from [event] as e 
       join
       #deletes as d 
    on e.event_id = d.event_id

SELECT @LogTotRows = @@ROWCOUNT,
	 @LogErrCode = @@ERROR
SET @LogStatus =  'Step 5 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

-- end of procedure update log
SET @qry = @qry + convert(varchar(30),datediff(s,@StartProc,getdate()))
exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR

END TRY  

BEGIN CATCH

	DECLARE
	@ERROR_SEVERITY INT,
	@ERROR_STATE INT,
	@ERROR_NUMBER INT,
	@ERROR_LINE INT,
	@ERROR_MESSAGE VARCHAR(245),
    @AppMsg varchar(2000)
    
	SELECT
	@ERROR_SEVERITY = ERROR_SEVERITY(),
	@ERROR_STATE = ERROR_STATE(),
	@ERROR_NUMBER = ERROR_NUMBER(),
	@ERROR_LINE = ERROR_LINE(),
	@ERROR_MESSAGE = ERROR_MESSAGE(),
	@AppMsg = 'Error in proc: ' + @proc + ' ' + @LogStatus + @ERROR_MESSAGE
	
	exec dbo.CurrentActivityLogInsert @proc, @AppMsg,0,@ERROR_NUMBER


    RAISERROR(@AppMsg , 16, 1) 

END CATCH

GO


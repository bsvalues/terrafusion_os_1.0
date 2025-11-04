
-- exec WAInsertApprNoticeEvent 2009,8,1,'B','E'
CREATE PROCEDURE WAInsertApprNoticeEvent

@input_notice_yr	numeric(4),
@input_notice_num	int,
@input_user		varchar(60),
@input_owner_agent	varchar(1),
@input_undeliverable	varchar(1),
@input_user_id	int

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
 + ' @input_notice_yr =' +  convert(varchar(30),@input_notice_yr) + ','
 + ' @input_notice_num =' +  convert(varchar(30),@input_notice_num) + ','
 + ' @input_user =' + @input_user + ','
 + ' @input_owner_agent =' + @input_owner_agent + ','
 + ' @input_undeliverable =' + @input_undeliverable
 
 exec dbo.CurrentActivityLogInsert @proc, @qry
 
-- set variable for final status entry
 set @qry = @qry + ' Total Duration in secs: '
 set @qry = Replace(@qry,'Start','End')
 
/* End top of each procedure to capture parameters */
 
declare @notice_yr char(4)
    set @notice_yr = convert(char(4),@input_notice_yr)

declare @event_id	int
declare @event_count int

-- set up variable for where criteria selection
declare @addr_mail_undeliverable bit
if @input_undeliverable = 'I'
   set @addr_mail_undeliverable = NULL
if @input_undeliverable = 'E' 
   set @addr_mail_undeliverable = 0
if @input_undeliverable = 'U' 
   set @addr_mail_undeliverable = 1

-- create temp table with identity column for event_id numbering
create table #temp_appraisal_notice_event
(
      event_id int not null identity(0,1),
      prop_id int not null,
      owner_id int not null,
      notice_acct_name varchar(70) null
)

-- retrieve records for the year and notice run
if (@input_owner_agent = 'B')
begin
    set @StartStep = getdate()  --logging capture start time of step

	insert into #temp_appraisal_notice_event
	select prop_id, owner_id, notice_acct_name

	 from wash_appraisal_notice_prop_info with (nolock)
	where notice_year = @input_notice_yr
	  and notice_run_id = @input_notice_num
      and (ISNULL(addr_mail_undeliverable,0) = @addr_mail_undeliverable
       or  @addr_mail_undeliverable IS NULL)

    select @event_count = @@ROWCOUNT,
           @LogErrCode = @@ERROR

	SET @LogTotRows = @event_count
	SET @LogStatus =  'Step 1 @input_owner_agent = B End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 


end

if (@input_owner_agent = 'O')
begin
    set @StartStep = getdate()  --logging capture start time of step

	insert into #temp_appraisal_notice_event
	select prop_id, owner_id, notice_acct_name
	  from wash_appraisal_notice_prop_info with (nolock)
	 where notice_year = @input_notice_yr
	   and notice_run_id = @input_notice_num
       and owner_id = notice_acct_id
       and (ISNULL(addr_mail_undeliverable,0) = @addr_mail_undeliverable
        or  @addr_mail_undeliverable IS NULL)

    select @event_count = @@ROWCOUNT,
           @LogErrCode = @@ERROR

	SET @LogTotRows = @event_count
	SET @LogStatus =  'Step 1 @input_owner_agent = O End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 


end

if (@input_owner_agent = 'A')
begin
    set @StartStep = getdate()  --logging capture start time of step

	insert into #temp_appraisal_notice_event
	select prop_id, owner_id, notice_acct_name
	  from wash_appraisal_notice_prop_info with (nolock)
	 where notice_year = @input_notice_yr
	   and notice_run_id = @input_notice_num
       and agent_copy = 1
       and (ISNULL(addr_mail_undeliverable,0) = @addr_mail_undeliverable
        or  @addr_mail_undeliverable IS NULL)

    select @event_count = @@ROWCOUNT,
           @LogErrCode = @@ERROR

	SET @LogTotRows = @event_count
	SET @LogStatus =  'Step 1 @input_owner_agent = A End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

end

if @event_count > 0
   begin
    set @StartStep = getdate()  --logging capture start time of step

	exec dbo.GetUniqueID 'event', @event_id output, @event_count, 0 

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 

    SET @LogStatus =  'Step 2 Get Id Values End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
    exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	-- final 
    set @StartStep = getdate()  --logging capture start time of step

	insert event 
		(event_id, system_type, 
		 event_type, event_date,
		 pacs_user,
		 event_desc, 
		 ref_evt_type, ref_year,
		 ref_num, ref_id1, ref_id2, pacs_user_id) 
	select event_id + @event_id , 'A',
		   'SYSTEM', @StartProc,
		   @input_user,
		   @notice_yr +  ' Appraisal Notice printed for ' +  notice_acct_name,
		   'AN',@input_notice_yr, 
		   @input_notice_num, prop_id,owner_id, @input_user_id
	from #temp_appraisal_notice_event 

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 

    SET @LogStatus =  'Step 3 Insert Event End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
    exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	insert prop_event_assoc 
	(prop_id, event_id) 
	select prop_id, event_id + @event_id
	from #temp_appraisal_notice_event

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 


   SET @LogStatus =  'Step 4 Insert prop_event_assoc End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
   exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 
  end


-- end of procedure update log
SET @qry = @qry + convert(varchar(30),datediff(s,@StartProc,getdate()))
exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR
 
drop table #temp_appraisal_notice_event

GO


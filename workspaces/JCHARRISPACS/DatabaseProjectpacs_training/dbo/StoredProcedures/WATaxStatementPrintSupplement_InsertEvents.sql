
-- exec WATaxStatementLevyCreate_InsertEvents 1,2011,1,1,5,5,'C','1/1/2011'

create procedure WATaxStatementPrintSupplement_InsertEvents
	@pacs_user_id int,
	@year numeric(4,0),
	@group_id int,
	@run_id int,
	@statement_count int,
	@owner_statement_count int,
	@run_type char(1),
	@dtNow datetime,
	@history_id int

as

-- insert event records for each copy_type = 0 record

/* Top of each procedure to capture input parameters */
SET NOCOUNT ON

BEGIN TRY   --- SET UP ERROR HANDLING

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
 + ' @run_id =' +  convert(varchar(30),@run_id) + ','
 + ' @statement_count =' +  isnull(convert(varchar(30),@statement_count),'') + ','
 + ' @owner_statement_count =' +  isnull(convert(varchar(30),@owner_statement_count),'') + ','
 + ' @run_type  =' +  isnull(@run_type,'') + ','
 + ' @dtNow datetime =' +  convert(varchar(30),@statement_count) 
 
 exec dbo.CurrentActivityLogInsert @proc, @qry
 
-- set variable for final status entry
 set @qry = @qry + ' Total Duration in secs: '
 set @qry = Replace(@qry,'Start','End')
 
/* End top of each procedure to capture parameters */

set @StartStep = getdate()
SET @LogStatus =  'Step 1 Start '

if @run_type = 'S'
begin
  select @statement_count = count(statement_id) 
  from 
  wa_tax_statement_print_history_statement_assoc wtsphsa with (nolock)
  where wtsphsa.group_id = @group_id 
  and wtsphsa.run_id = @run_id 
  and wtsphsa.year = @year
  and wtsphsa.history_id = @history_id
  
  select @owner_statement_count = count(wtphs.statement_id) 
  from wa_tax_statement_print_history_statement_assoc wtphs with (nolock)
  where wtphs.group_id = @group_id 
  and wtphs.run_id = @run_id 
  and wtphs.year = @year
  and wtphs.history_id = @history_id
  and isnull(wtphs.owner_id, 0) = 0 
  group by wtphs.owner_id
  declare @wa_tax_statement_run table (statement_id int)

 insert into @wa_tax_statement_run (statement_id)
 (select statement_id from wa_tax_statement_print_history_statement_assoc with (nolock)
 where run_id= @run_id and group_id = @group_id and year = @year and history_id = @history_id)
	
if @statement_count > 0
   begin  
	declare @lNextEventID int
	exec dbo.GetUniqueID 'event', @lNextEventID output, @statement_count, 0

	declare @event_type_cd char(20)
	set @event_type_cd = 'STS'
	
	create table #tblEvent	
	(
		statement_seq int identity(0,1) not null,
		statement_id int not null
	)
		
	insert #tblEvent(statement_id)
	select wtst.statement_id	
	  from  
	@wa_tax_statement_run as wtst 
	  
	create clustered index idx_statement_id on #tblEvent(statement_id)
	  
	SELECT @LogTotRows = @@ROWCOUNT,
		 @LogErrCode = @@ERROR
	SET @LogStatus =  'Step 1 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

	set @StartStep = getdate()
	SET @LogStatus =  'Step 2 Start '
			
	-- This is based on the SP InsertTaxStatementEvent
	insert event  (
		event_id,
		system_type,
		event_type,
		event_date,
		pacs_user,
		event_desc,
		ref_evt_type,
		ref_year,
		ref_id1,
		ref_id2,
		ref_id3,
		ref_id4,
		ref_id5,
		ref_id6,
		pacs_user_id
	)
	select
		distinct(t.statement_seq) + @lNextEventID,  -- event_id
		'C',       -- system_type
		'SYSTEM',  -- event_type
		@dtNow,    -- event_date
		@pacs_user_id,  -- pacs_user
		case 
		   when @event_type_cd = 'DELQNOTICE' then 'Delinquent Notice Created' 
		   else 'Tax Statement Created' 
		   end,  -- event_desc
		@event_type_cd,  -- ref_evt_type
		@year,  -- ref_year
		@group_id,  -- ref_id1
		wts.sup_num,  -- ref_id2
		@run_id,   -- ref_id3
		wts.prop_id,  -- ref_id4
		wts.owner_id, -- ref_id5
		wts.statement_id,  -- ref_id6
		@pacs_user_id  -- pacs_user_id
	from wa_tax_statement as wts with(nolock)
	join @wa_tax_statement_run as wtst 
	  on wts.statement_id = wtst.statement_id
	join #tblEvent as t on
		t.statement_id = wts.statement_id
	where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id
	

	SELECT @LogTotRows = @@ROWCOUNT,
		 @LogErrCode = @@ERROR
	SET @LogStatus =  'Step 2 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode


	set @StartStep = getdate()
	SET @LogStatus =  'Step 3 Start '

	insert prop_event_assoc 
	(
		event_id,
		prop_id
	)
	select
		distinct(t.statement_seq) + @lNextEventID,  -- event_id
		wts.prop_id
	from wa_tax_statement as wts with(nolock)
	join @wa_tax_statement_run as wtst 
	  on wts.statement_id = wtst.statement_id
	join #tblEvent as t on
		t.statement_id = wts.statement_id
	where wts.group_id = @group_id and wts.year = @year and wts.run_id = @run_id
	--  and wts.copy_type = 0
	  
	SELECT @LogTotRows = @@ROWCOUNT,
		 @LogErrCode = @@ERROR
	SET @LogStatus =  'Step 3 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode
end  -- end tax statement event inserts

set @StartStep = getdate()

if @owner_statement_count > 0
   begin
        SET @LogStatus =  'Step 4 Start '

		exec dbo.GetUniqueID 'event', @lNextEventID output, @owner_statement_count, 0

		SELECT @LogTotRows = @@ROWCOUNT,
			 @LogErrCode = @@ERROR
		SET @LogStatus =  'Step 4 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

		set @StartStep = getdate()
        SET @LogStatus =  'Step 5 Start '
        		
		if (@run_type = 'C')
			set @event_type_cd = 'TaxpayerCTS'
		else -- 'L'
			set @event_type_cd = 'TaxpayerTS'
			
		create table #tblTaxpayerEvent  (
			statement_seq int identity(0,1) not null,
			owner_id int not null,
		)

				
		insert #tblTaxpayerEvent(owner_id)
		select wtso.owner_id	
		from wa_tax_statement_owner as wtso with(nolock)
		where wtso.group_id = @group_id and wtso.year = @year and wtso.run_id = @run_id

		SELECT @LogTotRows = @@ROWCOUNT,
			 @LogErrCode = @@ERROR
		SET @LogStatus =  'Step 5 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

		set @StartStep = getdate()
        SET @LogStatus =  'Step 6 Start '
				
		-- This is based on the SP InsertTaxStatementEvent
		insert event  (
			event_id,
			system_type,
			event_type,
			event_date,
			pacs_user,
			event_desc,
			ref_evt_type,
			ref_year,
			ref_id1,
			ref_id2,
			ref_id3,
			ref_id4,
			ref_id5,
			ref_id6
		)
		select
			t.statement_seq + @lNextEventID, -- event_id 
			'C',   -- system_type
			'SYSTEM',  -- event_type
			@dtNow,  -- event_date
			@pacs_user_id,  -- pacs_user
			'Taxpayer Tax Statement Created', -- event_desc
			@event_type_cd,   -- ref_evt_type
			@year,    -- ref_year
			@group_id,  -- ref_id1
			NULL,  -- ref_id2
			@run_id,  --- ref_id3
			NULL,  -- ref_id4
			t.owner_id,  -- ref_id5
			NULL    -- ref_id6
		from #tblTaxpayerEvent as t

		SELECT @LogTotRows = @@ROWCOUNT,
			 @LogErrCode = @@ERROR
		SET @LogStatus =  'Step 6 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

		set @StartStep = getdate()
        SET @LogStatus =  'Step 7 Start '
        
		insert account_event_assoc 
		(
			event_id,
			acct_id
		)
		select
			t.statement_seq + @lNextEventID, -- event_id ,
			t.owner_id
		from #tblTaxpayerEvent as t 

		SELECT @LogTotRows = @@ROWCOUNT,
			 @LogErrCode = @@ERROR
		SET @LogStatus =  'Step 7 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode
   end -- taxpayer tax statement events
   
-- end of procedure update log
SET @qry = @qry + convert(varchar(30),datediff(s,@StartProc,getdate()))
exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR
end

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


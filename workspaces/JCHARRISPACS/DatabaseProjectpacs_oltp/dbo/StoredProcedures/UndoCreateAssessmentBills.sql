
/******************************************************************************************
 Procedure: UndoCreateAssessmentBills
 Synopsis:				
			
 Call From:	App Server
******************************************************************************************/

create procedure UndoCreateAssessmentBills
	@pacs_user_id	int,
	@year	numeric(4,0) = 0,
	@datasetID bigint = -1
as 

/* Top of each procedure to capture input parameters */
SET NOCOUNT ON
DECLARE @StartProc datetime
    SET @StartProc = getdate()
DECLARE @StartStep datetime
DECLARE @LogTotRows int
DECLARE @LogStatus varchar(200)
DECLARE @LogErrCode int
DECLARE @qry varchar(400)
 declare @proc varchar(100)
 set @proc = object_name(@@procid)
 
 SET @qry = 'Start - ' + @proc  
 + ' @pacs_user_id =' +  convert(varchar(30),@pacs_user_id) + ','
 + ' @year =' +  convert(varchar(30),@year) + ','
 + ' @datasetID =' +  convert(varchar(30),@datasetID)
 
 exec dbo.CurrentActivityLogInsert @proc, @qry
 
-- set variable for final status entry
 set @qry = @qry + ' Total Duration in secs: '
 set @qry = Replace(@qry,'Start','End')
 
/* End top of each procedure to capture parameters */
 

	-- Set Year to the current year layer if it is not received on input
	if @year = 0
	begin
		select top 1 @year = appr_yr from pacs_system with(nolock)
	end

	-- Construct the working list of special assessments
	declare @assessment_bill_list table 
	(
		[year] numeric(4,0) not null,
		agency_id int not null,
		bill_id int not null,
		primary key clustered 
		(
			bill_id
		)
	)
	
	
	-- Construct a table variable for bill_fee
	-- this will contain fees added when these bills were created
	declare @bill_fee table
	(
		fee_id int not null,
		primary key clustered 
		(
			fee_id
		)
	)
	
	-- If dataset = -1, then working set of assessments is the set of all assessments
	-- in the provided tax_year and 
	-- for as a safety check the query also checks if the join returns the assessments 
	-- in 'Bill Created' status
	if @datasetID = -1
	begin
		set @StartStep = getdate()  --logging capture start time
		exec dbo.CurrentActivityLogInsert @proc, 'Step 1 Start' --logging 

		insert @assessment_bill_list
		select 
				ab.[year], 
				ab.agency_id, 
				ab.bill_id
		from assessment_bill as ab with(nolock)
		join bill as b with(nolock) on
				ab.bill_id				= b.bill_id
		where	ab.[year]				= @year
		and		b.bill_type				= 'A'
		and		isnull(b.is_active, 0)	= 0

		-- logging end of step 
		SELECT @LogTotRows = @@ROWCOUNT, 
			   @LogErrCode = @@ERROR 
		   SET @LogStatus =  'Step 1 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 
		
	end
	else
	begin
		set @StartStep = getdate()  --logging capture start time
		exec dbo.CurrentActivityLogInsert @proc, 'Step 2 Start' --logging 

		insert @assessment_bill_list
		select 
				ab.[year], 
				ab.agency_id, 
				ab.bill_id	
		from ##assessments_list_for_bill_functions as al with(nolock)
		join assessment_bill as ab with(nolock)on 
				ab.agency_id			= al.agency_id
		join bill as b with(nolock) on
				ab.bill_id				= b.bill_id		
		where	al.dataset_id			= @datasetID
		and		ab.[year]				= @year
		and		b.bill_type				= 'A'
		and		isnull(b.is_active, 0)	= 0		

		-- logging end of step 
		SELECT @LogTotRows = @@ROWCOUNT, 
			   @LogErrCode = @@ERROR 
		   SET @LogStatus =  'Step 2 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 
		
	end

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 3 Start' --logging 
	
	-- Populate @bill_fee table data type
	insert @bill_fee
	select distinct bfa.fee_id
	from @assessment_bill_list as abl
	join bill_fee_assoc as bfa with(nolock) on
		abl.bill_id = bfa.bill_id

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 3 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 4 Start' --logging 
		
	-- delete bill_payment_due
	delete from bill_payments_due
	from bill_payments_due as bpd
	join @assessment_bill_list as abl on
		abl.bill_id = bpd.bill_id

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 4 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 5 Start' --logging 
		
	-- delete assessment_bill
	delete from assessment_bill
	from assessment_bill as ab 
	join @assessment_bill_list as abl on
		abl.bill_id = ab.bill_id

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 5 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 6 Start' --logging 
		
	-- delete bill_fee_assoc
	delete from bill_fee_assoc
	from bill_fee_assoc as bfe
	join @assessment_bill_list as abl on
		abl.bill_id = bfe.bill_id 

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 6 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 7 Start' --logging 
		
	-- delete pending_coll_transaction (bill)
	delete from pending_coll_transaction
	from pending_coll_transaction as pct
	join @assessment_bill_list as abl on
			abl.bill_id				= pct.trans_group_id	
	where	pct.transaction_type	= 'CAB'	

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 7 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 8 Start' --logging 
			
	-- delete pending_coll_transaction (fee)
	delete from pending_coll_transaction
	from pending_coll_transaction as pct
	join @bill_fee as bf on
			bf.fee_id				= pct.trans_group_id	
	where	pct.transaction_type	= 'CF'

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 8 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 9 Start' --logging 
		
	-- delete fee_payments_due
	delete from fee_payments_due
	from fee_payments_due as fpd
	join @bill_fee as bf on
		bf.fee_id	= fpd.fee_id		

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 9 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 10 Start' --logging 
		
	-- delete fee
	delete from fee
	from fee 
	join @bill_fee as bf on
		bf.fee_id	= fee.fee_id	

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 10 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 11 Start' --logging 
		
	-- delete trans group (fee)
	delete from trans_group
	from trans_group as tg
	join @bill_fee as bf on
			bf.fee_id				= tg.trans_group_id	
	where	tg.trans_group_type		= 'F'

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 11 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 12 Start' --logging 
		
	-- delete bill
	delete from bill
	from bill as b
	join @assessment_bill_list as abl on
			abl.bill_id	= b.bill_id

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 12 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 13 Start' --logging 
			
	-- delete trans_group (bill)
	delete from trans_group
	from trans_group as tg
	join @assessment_bill_list as abl on
			abl.bill_id				= tg.trans_group_id	
	where	tg.trans_group_type		= 'AB'

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 13 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	-- Update the status on the assessments in the working set to 'Bill Created'
	if @datasetID = -1
	begin
		set @StartStep = getdate()  --logging capture start time
		exec dbo.CurrentActivityLogInsert @proc, 'Step 14 Start' --logging 
			
		update special_assessment
		set status_cd = 'CERT', bill_create_date = NULL, bills_createdby = NULL
		from special_assessment as sa with(nolock)
		where sa.[year]			= @year
		and sa.status_cd		= 'BC'

		-- logging end of step 
		SELECT @LogTotRows = @@ROWCOUNT, 
			   @LogErrCode = @@ERROR 
		   SET @LogStatus =  'Step 14 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	end
	else
	begin
		set @StartStep = getdate()  --logging capture start time
		exec dbo.CurrentActivityLogInsert @proc, 'Step 15 Start' --logging 
		
		update special_assessment
		set status_cd = 'CERT', bill_create_date = NULL, bills_createdby = NULL
		from special_assessment as sa with(nolock)
		join ##assessments_list_for_bill_functions as al with(nolock) on
			sa.agency_id	= al.agency_id
		where sa.year = @year
		and al.dataset_id = @datasetID
		and sa.status_cd = 'BC'

		-- logging end of step 
		SELECT @LogTotRows = @@ROWCOUNT, 
			   @LogErrCode = @@ERROR 
		   SET @LogStatus =  'Step 15 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	end

-- end of procedure update log
SET @qry = @qry + convert(varchar(30),datediff(s,@StartProc,getdate()))
exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR

GO


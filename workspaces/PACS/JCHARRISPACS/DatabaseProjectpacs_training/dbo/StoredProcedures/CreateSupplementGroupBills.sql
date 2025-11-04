
CREATE PROCEDURE [dbo].[CreateSupplementGroupBills]
	@effective_due_date datetime,
	@omitted_effective_due_date datetime,
	@pacs_user_id		int,
	@sup_group_id	int	= 0,
	@batch_id int = 0,
	@accept_prop_id int = 0,
	@accept_prop_yr int = 0
AS
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
 + ' @effective_due_date =' +  convert(varchar(30),@effective_due_date,120) + ','
 + ' @omitted_effective_due_date =' +  convert(varchar(30),@omitted_effective_due_date,120) + ','
 + ' @pacs_user_id =' +  convert(varchar(30),@pacs_user_id) + ','
 + ' @sup_group_id =' +  convert(varchar(30),@sup_group_id) + ','
 + ' @batch_id =' +  convert(varchar(30),@batch_id) + ','
 + ' @accept_prop_id =' +  convert(varchar(30),@accept_prop_id) + ','
 + ' @accept_prop_yr =' +  convert(varchar(30),@accept_prop_yr)
 
 exec dbo.CurrentActivityLogInsert @proc, @qry
 
-- set variable for final status entry
 set @qry = @qry + ' Total Duration in secs: '
 set @qry = Replace(@qry,'Start','End')
 
/* End top of each procedure to capture parameters */
 

	if @sup_group_id < 0 or not exists (
		select *
		from sup_group as sg with (nolock)
		where sg.sup_group_id = @sup_group_id
	)
	begin
		raiserror('Invalid Supplement Group.', 18, 1)
		return
	end

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 1 CreateSupplementLevyBills Start' --logging 
	
	delete from supplement_idlist
	where sup_group_id = @sup_group_id
	
	--Create Bills
	exec CreateSupplementLevyBills			@effective_due_date, @omitted_effective_due_date, @pacs_user_id,
											@sup_group_id, @batch_id, @accept_prop_id, @accept_prop_yr
		
	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 1 CreateSupplementLevyBills End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 2 CreateSupplementAssessmentBills Start' --logging 

	exec CreateSupplementAssessmentBills	@effective_due_date, @pacs_user_id, @sup_group_id, @batch_id, @accept_prop_id, @accept_prop_yr

	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 2 CreateSupplementAssessmentBills End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	
	if (@accept_prop_id > 0)
	begin
		set @StartStep = getdate()  --logging capture start time
		exec dbo.CurrentActivityLogInsert @proc, 'Step 3 Update property_val Start' --logging 

		update property_val
		set accept_create_id = @pacs_user_id,
		accept_create_dt = getdate()
		from property_val as pv with (nolock)
		
		join prop_supp_assoc as psa with (nolock)
			on psa.prop_id = pv.prop_id
			and psa.owner_tax_yr = pv.prop_val_yr
			and psa.sup_num = pv.sup_num
		
		join supplement as s with (nolock)
			on s.sup_tax_yr = psa.owner_tax_yr
			and s.sup_num = psa.sup_num

		join sup_group as sg with (nolock)
			on sg.sup_group_id = s.sup_group_id
		
		where pv.prop_id = @accept_prop_id
			and sg.sup_group_id = @sup_group_id
			and pv.prop_val_yr = @accept_prop_yr

		SELECT @LogTotRows = @@ROWCOUNT, 
			   @LogErrCode = @@ERROR 
		   SET @LogStatus =  'Step 3 Update property_val End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 
		
	end
	else
	begin
		set @StartStep = getdate()  --logging capture start time
		exec dbo.CurrentActivityLogInsert @proc, 'Step 4 CreateSupplementRollbackBills Start' --logging 

		exec CreateSupplementRollbackBills		@pacs_user_id, @sup_group_id, @batch_id

		SELECT @LogTotRows = @@ROWCOUNT, 
			   @LogErrCode = @@ERROR 
		   SET @LogStatus =  'Step 4 CreateSupplementRollbackBills End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

		set @StartStep = getdate()  --logging capture start time
		exec dbo.CurrentActivityLogInsert @proc, 'Step 5 CreateSupplementVoidRollbackBills Start' --logging 
		
		exec CreateSupplementVoidRollbackBills	@pacs_user_id, @sup_group_id, @batch_id

		SELECT @LogTotRows = @@ROWCOUNT, 
			   @LogErrCode = @@ERROR 
		   SET @LogStatus =  'Step 5 CreateSupplementVoidRollbackBills End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

		set @StartStep = getdate()  --logging capture start time
		exec dbo.CurrentActivityLogInsert @proc, 'Step 6 update sup_group Start' --logging 
		
		update sup_group
		set sup_bill_create_dt = getdate(),
		status_cd = 'BC',
		sup_bill_status = 'BC',
		sup_bills_created_by_id	= @pacs_user_id,
		sup_bills_batch_id = @batch_id
		where sup_group_id = @sup_group_id

		SELECT @LogTotRows = @@ROWCOUNT, 
			   @LogErrCode = @@ERROR 
		   SET @LogStatus =  'Step 6 update sup_group End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

		set @StartStep = getdate()  --logging capture start time
		exec dbo.CurrentActivityLogInsert @proc, 'Step 7 SupGroupPreprocess_UpdateTaxAmounts Start' --logging 
				
		exec SupGroupPreprocess_UpdateTaxAmounts @sup_group_id, @batch_id

		SELECT @LogTotRows = @@ROWCOUNT, 
			   @LogErrCode = @@ERROR 
		   SET @LogStatus =  'Step 7 SupGroupPreprocess_UpdateTaxAmounts End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	end
	
	delete from supplement_idlist
	where sup_group_id = @sup_group_id

-- end of procedure update log
SET @qry = @qry + convert(varchar(30),datediff(s,@StartProc,getdate()))
exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR

GO


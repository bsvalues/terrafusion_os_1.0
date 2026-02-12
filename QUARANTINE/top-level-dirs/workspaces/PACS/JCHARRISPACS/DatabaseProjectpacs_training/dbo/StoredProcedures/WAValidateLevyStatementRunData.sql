
create proc WAValidateLevyStatementRunData
	@year int,
	@taxStatementDatasetID_PropID bigint,
	@taxStatementDatasetID_BillIDLevy bigint,
	@taxStatementDatasetID_BillIDAssessment bigint,
	@taxStatementDatasetID_FeeID bigint
as
	/* Top of each procedure to capture input parameters */
	set nocount on
	declare @StartProc datetime
		set @StartProc = getdate()
	declare @StartStep datetime
	declare @LogTotRows int
	declare @LogStatus varchar(200)
	declare @LogErrCode int
	declare @qry varchar(1000)
	declare @proc varchar(100)
	set @proc = object_name(@@procid)

	set @qry = 'Start - ' + @proc  
	 + ' @year =' +  convert(varchar(30),@year) + ','
	 + ' @taxStatementDatasetID_PropID =' +  convert(varchar(30),@taxStatementDatasetID_PropID) + ','
	 + ' @taxStatementDatasetID_BillIDLevy =' +  convert(varchar(30),@taxStatementDatasetID_BillIDLevy) + ','
	 + ' @taxStatementDatasetID_BillIDAssessment =' +  convert(varchar(30),@taxStatementDatasetID_BillIDAssessment) + ','
	 + ' @taxStatementDatasetID_FeeID =' +  convert(varchar(30),@taxStatementDatasetID_FeeID)
	 
	exec dbo.CurrentActivityLogInsert @proc, @qry
	 
	-- set variable for final status entry
	set @qry = @qry + ' Total Duration in secs: '
	set @qry = Replace(@qry,'Start','End')
	 
	/* End top of each procedure to capture parameters */


	declare @errorCount int,
			@errorMessage varchar(256)

	---------------------------------------------------
	-- validate coll_transaction to verify that each --
	-- bill/fee has a coll_transaction row           --
	---------------------------------------------------
	set @StartStep = getdate()  --logging capture start time of step

	select @errorCount = count(*)
	from tax_statement_idlist as tsil with(nolock)
	where tsil.dataset_id in (@taxStatementDatasetID_BillIDLevy,
							  @taxStatementDatasetID_BillIDAssessment,
							  @taxStatementDatasetID_FeeID)
	and not exists (
		select top 1 *
		from coll_transaction as ct with(nolock)
		where ct.trans_group_id = tsil.id
	)

	-- logging end of step 
	select @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   set @LogStatus =  'Step 1 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc, @LogStatus, @LogTotRows, @LogErrCode


	if (@errorCount > 0)
	begin
		set @errorMessage = 'One or more tax due objects are missing from coll_transaction.'
	end



	----------------------------------
	-- validate wash_prop_owner_val --
	----------------------------------
	set @StartStep = getdate()  --logging capture start time of step

	select @errorCount = count(*)
	from tax_statement_idlist as tsil with(nolock)
	where tsil.dataset_id = @taxStatementDatasetID_PropID
	and not exists (
		select top 1 *
		from prop_bills_created_supp_assoc_vw as psa with(nolock)
		join wash_prop_owner_val as wpov with(nolock) on
			wpov.year = psa.owner_tax_yr and
			wpov.sup_num = psa.sup_num and
			wpov.prop_id = psa.prop_id
		where psa.owner_tax_yr = @year and psa.prop_id = tsil.id
	)

	-- logging end of step 
	select @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   set @LogStatus =  'Step 2 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc, @LogStatus, @LogTotRows, @LogErrCode

	if (@errorCount > 0)
	begin
		set @errorMessage = 'One or more properties are missing from wash_prop_owner_val.'
	end


	--------------------------------
	-- validate property_tax_area --
	--------------------------------
	set @StartStep = getdate()  --logging capture start time of step

	select @errorCount = count(*)
	from tax_statement_idlist as tsil with(nolock)
	where tsil.dataset_id = @taxStatementDatasetID_PropID
	and not exists (
		select top 1 *
		from prop_bills_created_supp_assoc_vw as psa with(nolock)
		join property_tax_area as pta with(nolock) on
			pta.year = psa.owner_tax_yr and
			pta.sup_num = psa.sup_num and
			pta.prop_id = psa.prop_id
		where psa.owner_tax_yr = @year and psa.prop_id = tsil.id
	)

	-- logging end of step 
	select @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   set @LogStatus =  'Step 3 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc, @LogStatus, @LogTotRows, @LogErrCode

	if ( @errorCount  > 0)
	begin
		set @errorMessage = 'One or more properties are missing from property_tax_area.'
	end

	------------------------------------
	-- validate the collections owner --
	------------------------------------
	set @StartStep = getdate()  --logging capture start time of step

	select @errorCount = count(*)
	from tax_statement_idlist as tsil with(nolock)
	where tsil.dataset_id = @taxStatementDatasetID_PropID
	and not exists (
		select *
		from property as p with(nolock)
		join account as a with(nolock) on
			a.acct_id = p.col_owner_id
		where p.prop_id = tsil.id
	)

	-- logging end of step 
	select @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   set @LogStatus =  'Step 4 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc, @LogStatus, @LogTotRows, @LogErrCode

	if ( @errorCount  > 0)
	begin
		set @errorMessage = 'One or more properties have missing or invalid collection owner ID.'
	end

	-- end of procedure update log
	set @qry = @qry + convert(varchar(30),datediff(s,@StartProc,getdate()))
	exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR

	return @errorCount

GO


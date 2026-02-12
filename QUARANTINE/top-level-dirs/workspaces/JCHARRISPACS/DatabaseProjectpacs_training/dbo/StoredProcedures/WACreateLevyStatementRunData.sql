
create procedure WACreateLevyStatementRunData
	@year int,
	@groupID int,
	@runID int,
	@propIDList varchar(max)	-- comma-separated list '1,4,7' or select statement
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
	declare @oldDatasetIds table(dataset_id int)
	set @proc = object_name(@@procid)
	
	--Delete old records from tax_statement_idlist table
	insert into @oldDatasetIds(dataset_id)
	(select dataset_id from 
	tax_statement_idlist_log with (nolock) 
	where DATEDIFF(DAY, datecreated, GETDATE()) > 1)
	
	delete from tax_statement_idlist where dataset_id in 
	(select dataset_id from @oldDatasetIds)
	
    delete from tax_statement_idlist_log where 
    DATEDIFF(DAY, datecreated, GETDATE()) > 180
	
	set @qry = 'Start - ' + @proc  
	 + ' @year =' +  convert(varchar(30),@year) + ','
	 + ' @groupID =' +  convert(varchar(30),@groupID) + ','
	 + ' @runID =' +  convert(varchar(30),@runID) + ','
	 + ' @propIDList =' + @propIDList
	 
	exec dbo.CurrentActivityLogInsert @proc, @qry
	 
	-- set variable for final status entry
	set @qry = @qry + ' Total Duration in secs: '
	set @qry = Replace(@qry,'Start','End')
	 
	/* End top of each procedure to capture parameters */

	declare @sql varchar(max)


	--------------------
	-- input checking --
	--------------------
	set @propIDList = isnull(@propIDList, '')

	-----------------------------------------------------------------------
	-- look up whether we need to include property taxes and assessments --
	-----------------------------------------------------------------------
	set @StartStep = getdate()  --logging capture start time of step

	declare @includePropertyTaxes bit,
			@includeAssessments bit
	select	@includePropertyTaxes = include_property_taxes,
			@includeAssessments = include_assessments
	from wa_tax_statement_group with(nolock)
	where year = @year and group_id = @groupID

	-- logging end of step 
	select @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   set @LogStatus =  'Step 1 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc, @LogStatus, @LogTotRows, @LogErrCode

	-- TODO: throw exception if @includePropertyTaxes and @includeAssessments are both false

	------------------------------------------------------------------
	-- store the current OCR scanline and barcode options with the run
	------------------------------------------------------------------
	set @StartStep = getdate()  --logging capture start time of step

	declare @ocrDelqOption varchar(511),
		@barcodeOption varchar(511)

	select @ocrDelqOption = szConfigValue
	from pacs_config
	where szGroup = 'Tax Statement Config'
	and szConfigName = 'OCR Scanline Delinquent Fields'

	select @barcodeOption = szConfigValue
	from pacs_config
	where szGroup = 'Tax Statement Config'
	and szConfigName = 'Barcodes'

	update wa_tax_statement_run
	set
		ocr_include_delq_when_needed = case when @ocrDelqOption = 'WhenDelinquent' then 1 else 0 end,
		ocr_always_include_delq = case when @ocrDelqOption = 'Always' then 1 else 0 end,
		barcode_statement_or_property = case when @barcodeOption = 'PropertyID' then 1 else 0 end
	where year = @year and group_id = @groupID and run_id = @runID

		-- logging end of step 
	select @LogTotRows = @@ROWCOUNT, @LogErrCode = @@ERROR 
	set @LogStatus =  'Step 1a End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc, @LogStatus, @LogTotRows, @LogErrCode

	-------------------------------------------
	-- look up our tax statement run options --
	-------------------------------------------
	set @StartStep = getdate()  --logging capture start time of step

	declare @includePropertyReal bit,
			@includePropertyPersonal bit,
			@includePropertyMobileHome bit,
			@includePropertyIOLL bit,
			@firstHalfPayment bit,
			@effectiveDate datetime,
			@runType char(1),
			@supGroupID int
	select	@includePropertyReal = include_real_property,
			@includePropertyPersonal = include_personal_property,
			@includePropertyMobileHome = include_mobile_home_property,
			@includePropertyIOLL = include_ioll_property,
			@firstHalfPayment = first_half_payment,
			@effectiveDate = effective_date,
			@runType = type,
			@supGroupID = sup_group_id
	from wa_tax_statement_run with(nolock)
	where year = @year and group_id = @groupID and run_id = @runID

	-- make sure this is set to at least a default value
	set @supGroupID = isnull(@supGroupID, -1)

	-- logging end of step 
	select @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   set @LogStatus =  'Step 2 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc, @LogStatus, @LogTotRows, @LogErrCode

	-- TODO: throw an exception if @runType<>'L' and @propIDList=''



	---------------------------------------------------------
	-- allocate some unique tax_statement_idlist ID values --
	---------------------------------------------------------
	set @StartStep = getdate()  --logging capture start time of step

	declare @taxStatementDatasetID_PropID bigint,
			@taxStatementDatasetID_BillIDLevy bigint,
			@taxStatementDatasetID_BillIDAssessment bigint,
			@taxStatementDatasetID_FeeID bigint,
			@taxStatementDatasetID_DelqBill bigint,
			@taxStatementDatasetID_DelqFee bigint

	exec dbo.GetUniqueID 'tax_statement_idlist', @taxStatementDatasetID_PropID output, 6, 0
	set @taxStatementDatasetID_BillIDLevy = @taxStatementDatasetID_PropID + 1
	set @taxStatementDatasetID_BillIDAssessment = @taxStatementDatasetID_PropID + 2
	set @taxStatementDatasetID_FeeID = @taxStatementDatasetID_PropID + 3
	set @taxStatementDatasetID_DelqBill = @taxStatementDatasetID_PropID + 4
	set @taxStatementDatasetID_DelqFee = @taxStatementDatasetID_PropID + 5
	
	--Add ID's to log table to delete old unprocessed records in case process fails
	
	if not exists (select dataset_id from tax_statement_idlist_log where dataset_id in 
	(@taxStatementDatasetID_PropID,@taxStatementDatasetID_BillIDLevy,
	@taxStatementDatasetID_BillIDAssessment,@taxStatementDatasetID_FeeID,
	@taxStatementDatasetID_DelqBill,@taxStatementDatasetID_DelqFee))
	begin
	
	INSERT INTO tax_statement_idlist_log (dataset_id, datecreated)
	VALUES (@taxStatementDatasetID_PropID,GETDATE())
   
	INSERT INTO tax_statement_idlist_log (dataset_id, datecreated)
	VALUES (@taxStatementDatasetID_BillIDLevy,GETDATE())
    
	INSERT INTO tax_statement_idlist_log (dataset_id, datecreated)
	VALUES (@taxStatementDatasetID_BillIDAssessment,GETDATE())
    
	INSERT INTO tax_statement_idlist_log (dataset_id, datecreated)
	VALUES (@taxStatementDatasetID_FeeID,GETDATE())
    
	INSERT INTO tax_statement_idlist_log (dataset_id, datecreated)
	VALUES (@taxStatementDatasetID_DelqBill,GETDATE())
    
	INSERT INTO tax_statement_idlist_log (dataset_id, datecreated)
	VALUES (@taxStatementDatasetID_DelqFee,GETDATE())
	
	end

	-- logging end of step 
	select @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   set @LogStatus =  'Step 3 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc, @LogStatus, @LogTotRows, @LogErrCode


	--------------------------------------
	-- make ID strings									--
	--------------------------------------

	declare @sYear varchar(12)
	set @sYear = convert(varchar, @year)
	
	declare @sGroupID varchar(12)
	set @sGroupID = convert(varchar, @groupID)
	
	declare @sRunID varchar(12)
	set @sRunID = convert(varchar, @runID)
	
	declare @sPropID varchar(12)
	set @sPropID = convert(varchar, @taxStatementDatasetID_PropID)

	declare @sBillIDLevy varchar(12)
	set @sBillIDLevy = convert(varchar, @taxStatementDatasetID_BillIDLevy)
	
	declare @sBillIDAssessment varchar(12)
	set @sBillIDAssessment = convert(varchar, @taxStatementDatasetID_BillIDAssessment)

	declare @sFeeID varchar(12)
	set @sFeeID = convert(varchar, @taxStatementDatasetID_FeeID)
	
	declare @sDelqBill varchar(12)
	set @sDelqBill = convert(varchar, @taxStatementDatasetID_DelqBill)
	
	declare @sDelqFee varchar(12)
	set @sDelqFee = convert(varchar, @taxStatementDatasetID_DelqFee)
	
	--------------------------------------
	-- build our list of property types --
	--------------------------------------
	set @StartStep = getdate()  --logging capture start time of step

	declare @propTypeList varchar(100)
	set @propTypeList = '';
	if @includePropertyReal = 1
	begin
		set @propTypeList = '''R''';
	end
	if @includePropertyMobileHome = 1
	begin
		if @propTypeList = ''
		begin
			set @propTypeList = '''MH'''
		end
		else
		begin
			set @propTypeList = @propTypeList + ', ''MH'''
		end
	end
	if @includePropertyPersonal = 1
	begin
		if @propTypeList = ''
		begin
			set @propTypeList = '''P'', ''A'', ''MN'''
		end
		else
		begin
			set @propTypeList = @propTypeList + ', ''P'', ''A'', ''MN'''
		end
	end
	if @includePropertyIOLL = 1
	begin
		if @propTypeList = ''
		begin
			set @propTypeList = '''IOLL'''
		end
		else
		begin
			set @propTypeList = @propTypeList + ', ''IOLL'''
		end
	end


	----------------------------------
	-- build our list of properties --
	----------------------------------
	set @sql =
		'
		insert tax_statement_idlist(dataset_id, id)
		select distinct ' + @sPropID + ', psa.prop_id
		from prop_bills_created_supp_assoc_vw as psa with(nolock)
		join property as p with(nolock) 
			on p.prop_id = psa.prop_id
		join current_year_property_type_ioll_vw as cypt with(nolock)
			on p.prop_id = cypt.prop_id
		where psa.owner_tax_yr = ' + @sYear + '
			and cypt.property_type in ( ' + @propTypeList + ' )
			
			' + case when isnull(@propIDList,'') <> '' then 'and psa.prop_id in (' + @propIDList + ')' else '' end + '
			
		order by psa.prop_id asc'

	exec (@sql)
	
	

	-- logging end of step 
	select @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   set @LogStatus =  'Step 4 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc, @LogStatus, @LogTotRows, @LogErrCode


		
	-------------------------------------
	-- build the list of levy bill IDs --
	-------------------------------------
	if @includePropertyTaxes = 1
	begin
		set @StartStep = getdate()  --logging capture start time of step

		set @sql =
			'
			insert tax_statement_idlist(dataset_id, id)
			select ' + @sBillIDLevy + ', b.bill_id
				from bill as b with(nolock)
				join tax_statement_idlist as tsil with(nolock) on
					tsil.dataset_id = ' + @sPropID + '
					and tsil.id = b.prop_id
				join levy_bill as lb with(nolock) on
					lb.bill_id = b.bill_id
				left join payout_agreement_bill_assoc as pa
					on b.bill_id = pa.bill_id
				where b.year = ' + @sYear + '
					and b.is_active = 1
					and pa.bill_id is NULL
			' +
			
			case when @runType = 'L' and @firstHalfPayment = 1 or @runType = 'S'
			then '' else 'and isNull(b.statement_id, 0) <> 0' end
		
		exec (@sql)
		
		

		-- logging end of step 
		select @LogTotRows = @@ROWCOUNT, 
			   @LogErrCode = @@ERROR 
		   set @LogStatus =  'Step 5 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc, @LogStatus, @LogTotRows, @LogErrCode
	end



	-------------------------------------------
	-- build the list of assessment bill IDs --
	-------------------------------------------
	if @includeAssessments = 1
	begin
		set @StartStep = getdate()  --logging capture start time of step

		set @sql =
		'
			insert tax_statement_idlist(dataset_id, id)
				select ' + @sBillIDAssessment + ', b.bill_id
				from bill as b with(nolock)
				join assessment_bill as ab with(nolock) on
					ab.bill_id = b.bill_id
				left join payout_agreement_bill_assoc as pa
					on b.bill_id = pa.bill_id
				join wa_tax_statement_assessment as wtsa with(nolock) on
					wtsa.group_id = ' + @sGroupID + '
					and wtsa.year = ' + @sYear + '
					and wtsa.agency_id = ab.agency_id
				join tax_statement_idlist as tsil with(nolock) on
					tsil.dataset_id = ' + @sPropID + '
					and tsil.id = b.prop_id
				where b.year = ' + @sYear + '
					and b.is_active = 1
					and pa.bill_id is NULL
		' +
			case when @runType = 'L' and @firstHalfPayment = 1 or @runType = 'S' 
			then '' else 'and isNull(b.statement_id, 0) <> 0 ' end

		exec (@sql)
        
		
		-- logging end of step 
		select @LogTotRows = @@ROWCOUNT, 
			   @LogErrCode = @@ERROR 
		   set @LogStatus =  'Step 6 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc, @LogStatus, @LogTotRows, @LogErrCode
	end


	-------------------------------
	-- build the list of fee IDs --
	-------------------------------

	-- first, the fees associated with bills we've identified
	set @StartStep = getdate()  --logging capture start time of step

	set @sql = '
		insert tax_statement_idlist(dataset_id, id)
		select distinct ' + @sFeeID + ', bfa.fee_id
		from tax_statement_idlist as tsil with(nolock)
		join bill_fee_assoc as bfa with(nolock)
			on bfa.bill_id = tsil.id
		join fee as f with(nolock)
			on f.fee_id = bfa.fee_id 
			and f.is_active = 1
			and f.payout_agreement_id is null
		where tsil.dataset_id in (' + @sBillIDLevy + ',' + @sBillIDAssessment + ')
		order by bfa.fee_id asc
		'
		
		exec (@sql)
		

	-- logging end of step 
	select @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   set @LogStatus =  'Step 7 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc, @LogStatus, @LogTotRows, @LogErrCode



	-- next, any other fee types we know of, unrelated to a bill
	if (@includePropertyTaxes = 1)
	begin
		set @StartStep = getdate()  --logging capture start time of step

		set @sql =
		'
			insert tax_statement_idlist(dataset_id, id)
			select distinct ' + @sFeeID + ', fpa.fee_id
			from tax_statement_idlist as tsil with(nolock)
			join fee_property_vw as fpa with(nolock)
				on fpa.prop_id = tsil.id
			join fee as f with(nolock)
				on f.fee_id = fpa.fee_id
				and f.year = ' + @sYear + '
				and f.is_active = 1 
				and f.payout_agreement_id is null
			where tsil.dataset_id = ' + @sPropID + '
			and not exists (
				select 1
				from tax_statement_idlist tl with(nolock)
				where tl.dataset_id = ' + @sFeeID + '
				and tl.id = f.fee_id
			)
			and f.statement_id > 0
			order by fpa.fee_id asc
		'

		exec(@sql)

		-- logging end of step 
		select @LogTotRows = @@ROWCOUNT, 
			   @LogErrCode = @@ERROR 
		   set @LogStatus =  'Step 8 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc, @LogStatus, @LogTotRows, @LogErrCode
	end

	----------------------------------------------
	-- build a list of delinquent levy bill IDs --
	----------------------------------------------
	if (@includePropertyTaxes = 1)
	begin
		set @StartStep = getdate()  --logging capture start time of step

		set @sql =
		'
			insert tax_statement_idlist (dataset_id, id)
			select ' + @sDelqBill + ', b.bill_id
			from bill as b with(nolock)
			join levy_bill as lb with(nolock)
				on lb.bill_id = b.bill_id
			left join payout_agreement_bill_assoc as pa
				on b.bill_id = pa.bill_id
			join tax_statement_idlist as tsil with(nolock)
				on tsil.dataset_id = ' + @sPropID	+ '
				and tsil.id = b.prop_id
			where b.year < ' + @sYear + '
				and b.current_amount_due > b.amount_paid
				and b.is_active = 1
				and pa.bill_id is NULL
			order by b.bill_id asc
		'

		exec (@sql)
		

		-- logging end of step 
		select @LogTotRows = @@ROWCOUNT, 
			   @LogErrCode = @@ERROR 
		   set @LogStatus =  'Step 9 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc, @LogStatus, @LogTotRows, @LogErrCode
	end



	-------------------------------------------------
	-- build a list of delinquent assessment bills --
	-------------------------------------------------
	if (@includeAssessments = 1)
	begin
		set @StartStep = getdate()  --logging capture start time of step

		set @sql =
		'
			insert tax_statement_idlist(dataset_id, id)
			select ' + @sDelqBill	+ ', b.bill_id
			from bill as b with(nolock)
			join assessment_bill as ab with(nolock)
				on ab.bill_id = b.bill_id
			left join payout_agreement_bill_assoc as pa
				on b.bill_id = pa.bill_id
			join wa_tax_statement_assessment as wtsa with(nolock)
				on wtsa.group_id = ' + @sGroupID + '
				and wtsa.year = ' + @sYear + '
				and wtsa.agency_id = ab.agency_id
			join tax_statement_idlist as tsil with(nolock)
				on tsil.dataset_id = ' + @sPropID + '
				and tsil.id = b.prop_id
			where b.year < ' + @sYear	+ '
				and b.current_amount_due > b.amount_paid
				and b.is_active = 1
				and pa.bill_id is NULL
				order by b.bill_id asc
				
		'

		exec (@sql)

		-- logging end of step 
		select @LogTotRows = @@ROWCOUNT, 
			   @LogErrCode = @@ERROR 
		   set @LogStatus =  'Step 10 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc, @LogStatus, @LogTotRows, @LogErrCode
	end



	-----------------------------------------------------------
	-- build a list of fees associated with delinquent bills --
	-----------------------------------------------------------
	set @StartStep = getdate()  --logging capture start time of step

	set @sql =
	'
		insert tax_statement_idlist(dataset_id, id)
		select distinct ' + @sDelqFee	+ ', bfa.fee_id
		from tax_statement_idlist as tsil with(nolock)
		join bill_fee_assoc as bfa with(nolock)
			on bfa.bill_id = tsil.id
		join fee as f with(nolock)
			on f.fee_id = bfa.fee_id
			and f.current_amount_due > f.amount_paid
			and f.is_active = 1
			and f.payout_agreement_id is null
		where tsil.dataset_id = ' + @sDelqBill + '
		order by bfa.fee_id asc
	'

	exec (@sql)
        
	-- logging end of step 
	select @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   set @LogStatus =  'Step 11 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc, @LogStatus, @LogTotRows, @LogErrCode



	------------------------------------------------------
	-- build a list of other standalone delinquent fees --
	------------------------------------------------------
	if @includePropertyTaxes = 1
	begin
		set @StartStep = getdate()  --logging capture start time of step

		set @sql =
		'
			insert tax_statement_idlist(dataset_id, id)
			select distinct ' + @sDelqFee + ', fpa.fee_id
			from tax_statement_idlist as tsil with(nolock)
			join fee_property_vw as fpa with(nolock) 
				on fpa.prop_id = tsil.id
			join fee as f with(nolock)
				on f.fee_id = fpa.fee_id
				and f.year < ' + @sYear + '
				and f.current_amount_due > f.amount_paid
				and f.is_active = 1 
				and f.payout_agreement_id is null
			where tsil.dataset_id = ' + @sPropID + '
				and not exists (
					select 1
					from tax_statement_idlist tl with(nolock)
					where tl.dataset_id = ' + @sDelqFee + '
						and tl.id = f.fee_id
				)
				and f.statement_id > 0
			order by fpa.fee_id asc
		'

		exec (@sql)

		-- logging end of step 
		select @LogTotRows = @@ROWCOUNT, 
			   @LogErrCode = @@ERROR 
		   set @LogStatus =  'Step 12 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc, @LogStatus, @LogTotRows, @LogErrCode
	end


	-----------------------------------------------------------------------------
	-- Clean the property, bill, and fee lists
	-----------------------------------------------------------------------------

	set @StartStep = getdate()  --logging capture start time of step

	set @sql =
	'
		set nocount on
		
		-- Cache bill and fee information
		
		create table #bills (bill_id int primary key, prop_id int)
		
		insert #bills (bill_id, prop_id)
		select b.bill_id, b.prop_id
		from tax_statement_idlist as tsi_b with(nolock)
		join bill b with(nolock) 
			on b.bill_id = tsi_b.id
		where tsi_b.dataset_id in (' + @sBillIDLevy + ',' + @sBillIDAssessment + ')

		create table #fees (fee_id int primary key, prop_id int)

		insert #fees (fee_id, prop_id)
		select fpv.fee_id, fpv.prop_id
		from tax_statement_idlist as tsi_f with(nolock)
		join fee_property_vw fpv with(nolock)
			on fpv.fee_id = tsi_f.id
		where tsi_f.dataset_id = ' + @sFeeID + '

		create table #delq_bills (bill_id int primary key, prop_id int, year numeric(4,0))
		
		insert #delq_bills (bill_id, prop_id, year)
		select b.bill_id, b.prop_id, b.year
		from tax_statement_idlist tsi_db with(nolock)
		join bill b with(nolock)
			on b.bill_id = tsi_db.id
		where tsi_db.dataset_id = ' + @sDelqBill + '

		create table #delq_fees (fee_id int primary key, prop_id int, year numeric(4,0))

		insert #delq_fees (fee_id, prop_id, year)
		select f.fee_id, fpv.prop_id, f.year
		from tax_statement_idlist as tsi_df with(nolock)
		join fee f with(nolock)
			on f.fee_id = tsi_df.id
		join fee_property_vw fpv with(nolock)
			on fpv.fee_id = f.fee_id
		where tsi_df.dataset_id = ' + @sDelqFee + '
		
		
		-- Identify properties that have no bills or fees in the statement run year
		
		create table #props_with_no_bills_in_year (prop_id int primary key)

		insert #props_with_no_bills_in_year (prop_id)
		select id
		from tax_statement_idlist as tsi_p
		where tsi_p.dataset_id = ' + @sPropID + '
		and not exists (
			select 1
			from #bills b
			where b.prop_id = tsi_p.id
		)
		and not exists (
			select 1
			from #fees f
			where f.prop_id = tsi_p.id
		)
		
		
		-- From these properties, find the ones that have delinquent bills or fees,
		-- and store data on them for later.
		
		insert wa_tax_statement_deleted_property
		(group_id, year, run_id, prop_id, latest_year_with_value)
		
		select ' + @sGroupID + ', ' + @sYear + ', ' + @sRunID + ', q.prop_id, max(q.year)
		from (
			select b.prop_id, b.year
			from #delq_bills b
			join #props_with_no_bills_in_year pn
				on b.prop_id = pn.prop_id

			union all		

			select f.prop_id, f.year
			from #delq_fees f
			join #props_with_no_bills_in_year pn
				on f.prop_id = pn.prop_id
		)q
		group by q.prop_id

		--Now remove unnecessary properties from wa_tax_statement_deleted_property table
		--as it should only contains bills and fees for deleted properties in the run year
		
		delete  
		from wa_tax_statement_deleted_property  
		where 
			group_id = ' + @sGroupID + ' AND year = ' + @sYear + ' AND run_id = ' + @sRunID +
			
			' AND prop_id NOT IN (select prop_id from property_val where prop_inactive_dt is not NULL
and prop_val_yr = ' + @sYear + ')
		 
		-- Now remove the properties with no bills or fees in the run year, and any
		-- delinquent bills and fees that were found for them.
		
		delete tsi_p
		from tax_statement_idlist tsi_p
		join #props_with_no_bills_in_year pn
			on tsi_p.id = pn.prop_id
		where tsi_p.dataset_id = ' + @sPropID + '
		
		delete tsi_db
		from tax_statement_idlist tsi_db with(nolock)
		join #delq_bills b
			on b.bill_id = tsi_db.id
		join #props_with_no_bills_in_year pn
			on b.prop_id = pn.prop_id
		where tsi_db.dataset_id = ' + @sDelqBill + '
		
		delete tsi_df
		from tax_statement_idlist tsi_df with(nolock)
		join #delq_fees f
			on f.fee_id = tsi_df.id
		join #props_with_no_bills_in_year pn
			on f.prop_id = pn.prop_id
		where tsi_df.dataset_id = ' + @sDelqFee + '
						
						
		-- cleanup
		drop table #props_with_no_bills_in_year
		drop table #bills
		drop table #fees
		drop table #delq_bills
		drop table #delq_fees
	'

	exec (@sql)

	-- logging end of step 
	select @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   set @LogStatus =  'Step 13 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc, @LogStatus, @LogTotRows, @LogErrCode

	
	--------------------------------
	-- validation/sanity checking --
	--------------------------------
	set @StartStep = getdate()  --logging capture start time of step

	declare @validationErrors int
	exec @validationErrors = WAValidateLevyStatementRunData
								@year,
								@taxStatementDatasetID_PropID,
								@taxStatementDatasetID_BillIDLevy,
								@taxStatementDatasetID_BillIDAssessment,
								@taxStatementDatasetID_FeeID

	-- logging end of step 
	select @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   set @LogStatus =  'Step 14 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc, @LogStatus, @LogTotRows, @LogErrCode






	-- end of procedure update log
	set @qry = @qry + convert(varchar(30),datediff(s,@StartProc,getdate()))
	exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR
   
	-----------------------------------
	-- return the values of interest --
	-----------------------------------
	select	@runType as runType,
			@includePropertyTaxes as includePropertyTaxes,
			@includeAssessments as includeAssessments,
			@firstHalfPayment as firstHalfPayment,
			@effectiveDate as effectiveDate,
			@supGroupID as supGroupID,
			@taxStatementDatasetID_PropID as tsid_PropID,
			@taxStatementDatasetID_BillIDLevy as tsid_BillIDLevy,
			@taxStatementDatasetID_BillIDAssessment as tsid_BillIDAssessment,
			@taxStatementDatasetID_FeeID as tsid_FeeID,
			@taxStatementDatasetID_DelqBill as tsid_DelqBill,
			@taxStatementDatasetID_DelqFee as tsid_DelqFee

GO


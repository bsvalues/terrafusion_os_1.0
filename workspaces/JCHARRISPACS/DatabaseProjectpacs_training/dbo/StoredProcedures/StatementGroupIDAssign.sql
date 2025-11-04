
create procedure StatementGroupIDAssign
	@queryIDLevyBill int,
	@queryIDAssessmentBill int,
	@queryIDFee int,
	@taxStatementDatasetID_DelqBill int,
	@taxStatementDatasetID_DelqFee int
with recompile
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
 + ' @queryIDLevyBill =' +  convert(varchar(30),@queryIDLevyBill) + ','
 + ' @queryIDAssessmentBill =' +  convert(varchar(30),@queryIDAssessmentBill) + ','
 + ' @queryIDFee =' +  convert(varchar(30),@queryIDFee) + ','
 + ' @taxStatementDatasetID_DelqBill =' +  convert(varchar(30),@taxStatementDatasetID_DelqBill) + ','
 + ' @taxStatementDatasetID_DelqFee =' +  convert(varchar(30),@taxStatementDatasetID_DelqFee)
 
 exec dbo.CurrentActivityLogInsert @proc, @qry
 
-- set variable for final status entry
 set @qry = @qry + ' Total Duration in secs: '
 set @qry = Replace(@qry,'Start','End')
 
/* End top of each procedure to capture parameters */
 
	create table #tblTaxDue (
		tax_due_id int not null,
		year numeric(4,0) not null,
		statement_id int not null,
		tax_due_type char(1) not null, -- B or F (Bill or Fee)
		prop_id int not null,
		item_num int identity(0,1) not null,
		
		primary key clustered (tax_due_id)
		with fillfactor = 100,
		unique nonclustered (item_num)
		with fillfactor = 100
	)
	
	-- Build list of all tax due IDs specified in the queries
	
	if (@queryIDLevyBill > 0)
	begin
		set @StartStep = getdate()
		exec dbo.CurrentActivityLogInsert @proc, 'Step 1 Start',@@ROWCOUNT,@@ERROR

		insert #tblTaxDue (tax_due_id, year, statement_id, tax_due_type, prop_id)
		select
			q.[id], b.year, isnull(b.statement_id, 0), 'B', b.prop_id
		from user_input_query_idlist as q with(nolock)
		join bill as b with(nolock) on
			b.bill_id = q.[id] and
			isnull(case when b.bill_type = 'RR' then 0 else b.rollback_id end, 0) <= 0
		where q.query_id = @queryIDLevyBill

		SELECT @LogTotRows = @@ROWCOUNT,
			 @LogErrCode = @@ERROR
		SET @LogStatus =  'Step 1 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

	end

	if (@queryIDAssessmentBill > 0)
	begin
		set @StartStep = getdate()
		exec dbo.CurrentActivityLogInsert @proc, 'Step 2 Start',@@ROWCOUNT,@@ERROR

		insert #tblTaxDue (tax_due_id, year, statement_id, tax_due_type, prop_id)
		select
			q.[id], b.year, isnull(b.statement_id, 0), 'B', b.prop_id
		from user_input_query_idlist as q with(nolock)
		join bill as b with(nolock) on
			b.bill_id = q.[id] and
			isnull(b.rollback_id, 0) <= 0
		where q.query_id = @queryIDAssessmentBill
		and not exists ( -- Verify IDs not specified more than once
			select *
			from #tblTaxDue as t
			where t.tax_due_id = q.[id]
		)

		SELECT @LogTotRows = @@ROWCOUNT,
			 @LogErrCode = @@ERROR
		SET @LogStatus =  'Step 2 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

	end
	
	if (@queryIDFee > 0)
	begin
		set @StartStep = getdate()
		exec dbo.CurrentActivityLogInsert @proc, 'Step 3 Start',@@ROWCOUNT,@@ERROR

		insert #tblTaxDue (tax_due_id, year, statement_id, tax_due_type, prop_id)
		select
			q.[id], f.year, isnull(f.statement_id, 0), 'F', fpa.prop_id
		from user_input_query_idlist as q with(nolock)
		join fee as f with(nolock) on
			f.fee_id = q.[id] and
			isnull(f.rollback_id, 0) <= 0
		join fee_property_vw as fpa with(nolock) on
			fpa.fee_id = f.fee_id
		where q.query_id = @queryIDFee
		and not exists ( -- Verify IDs not specified more than once ; shouldn't matter b/c there is only one fee query, but just in case
			select *
			from #tblTaxDue as t
			where t.tax_due_id = q.[id]
		)

		SELECT @LogTotRows = @@ROWCOUNT,
			 @LogErrCode = @@ERROR
		SET @LogStatus =  'Step 3 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

	end

	set @StartStep = getdate()
	exec dbo.CurrentActivityLogInsert @proc, 'Step 4 Create Index Start',@@ROWCOUNT,@@ERROR

	create nonclustered index idx_year_prop_id on #tblTaxDue(year, prop_id) with fillfactor = 100

	SELECT @LogTotRows = @@ROWCOUNT,
		 @LogErrCode = @@ERROR
	SET @LogStatus =  'Step 4 Create Index End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

	-- Count of tax due items
	set @StartStep = getdate()
	exec dbo.CurrentActivityLogInsert @proc, 'Step 5 Get count Start',@@ROWCOUNT,@@ERROR

	declare @countTaxDue int
	select @countTaxDue = count(*)
	from #tblTaxDue

	SELECT @LogTotRows = @@ROWCOUNT,
		 @LogErrCode = @@ERROR
	SET @LogStatus =  'Step 5 Get count End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode


	declare @tblAssignID table (
		year numeric(4,0) not null,
		prop_id int not null,
		statement_id int not null,
		payment_group_id int not null,
		
		primary key clustered (year, prop_id)
		with fillfactor = 100
	)
	-- Build list of distinct layers (year + prop ID)

	set @StartStep = getdate()
	exec dbo.CurrentActivityLogInsert @proc, 'Step 6 Start',@@ROWCOUNT,@@ERROR

	insert @tblAssignID (year, prop_id, statement_id, payment_group_id)
	select distinct year, prop_id, 0, 0
	from #tblTaxDue
	order by year asc, prop_id asc

	SELECT @LogTotRows = @@ROWCOUNT,
		 @LogErrCode = @@ERROR
	SET @LogStatus =  'Step 6 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

	-- Bring over the statement IDs already in existence
	set @StartStep = getdate()
	exec dbo.CurrentActivityLogInsert @proc, 'Step 7 Start',@@ROWCOUNT,@@ERROR

	update t
	set t.statement_id = max_stmt.maxid
	from @tblAssignID as t
	join (
		select distinct taxdue.year, taxdue.prop_id, maxid = max(taxdue.statement_id)
		from #tblTaxDue as taxdue
		where taxdue.statement_id > 0
		group by taxdue.year, taxdue.prop_id
	) as max_stmt on
		max_stmt.year = t.year and
		max_stmt.prop_id = t.prop_id
	
	SELECT @LogTotRows = @@ROWCOUNT,
		 @LogErrCode = @@ERROR
	SET @LogStatus =  'Step 7 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

	-- For each year
	set @StartStep = getdate()
	exec dbo.CurrentActivityLogInsert @proc, 'Step 8 Cursor Start',@@ROWCOUNT,@@ERROR

	declare @year numeric(4,0)
	declare curYear cursor
	for
		select distinct year
		from @tblAssignID
		order by year asc
	for read only
	
	open curYear
	fetch next from curYear into @year
	
	declare @countUnassigned int
	declare @nextIDStatement int

	while (@@fetch_status = 0)
	begin
		select @countUnassigned = count(*)
		from @tblAssignID
		where
			year = @year and
			statement_id = 0
		
		if (@countUnassigned > 0)
		begin
			exec dbo.GetNextStatementID @year, @nextIDStatement output, 0, @countUnassigned
			-- ... we have reserved ids from:
			--		@nextIDStatement + @countUnassigned - 1
			
			update t
			set t.statement_id = assign.statement_id
			from @tblAssignID as t
			join (
				select t2.prop_id, statement_id = @nextIDStatement - 1 + ( row_number() over(order by t2.prop_id) )
				from @tblAssignID as t2
				where t2.year = @year and t2.statement_id = 0
			) as assign on
				assign.prop_id = t.prop_id
			where
				t.year = @year and
				t.statement_id = 0			
		end

		fetch next from curYear into @year
	end
	
	close curYear
	deallocate curYear

	SELECT @LogTotRows = @@ROWCOUNT,
		 @LogErrCode = @@ERROR
	SET @LogStatus =  'Step 8 Cursor End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode
	
	declare @countProps int
	declare @tblDistinctPID table (
		prop_id int not null,
		payment_group_id int not null,
		primary key clustered (prop_id)
		with fillfactor = 100
	)

	set @StartStep = getdate()
	exec dbo.CurrentActivityLogInsert @proc, 'Step 9 Start',@@ROWCOUNT,@@ERROR

	insert @tblDistinctPID (prop_id, payment_group_id)
	select distinct prop_id, 0
	from @tblAssignID

	set @countProps = @@rowcount

	SELECT @LogTotRows = @countProps,
		 @LogErrCode = @@ERROR
	SET @LogStatus =  'Step 9 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

	if @countProps > 0
	begin
		declare @nextIDPaymentGroup int
		
		exec dbo.GetUniqueID 'payment_group_id', @nextIDPaymentGroup output, @countProps, 0
		-- ... we have reserved ids from:
		--		@nextIDPaymentGroup + @countProps - 1

		set @StartStep = getdate()
		exec dbo.CurrentActivityLogInsert @proc, 'Step 10 Start',@@ROWCOUNT,@@ERROR
		
		update t
		set t.payment_group_id = assign.payment_group_id		
		from @tblDistinctPID as t
		join (
			select t2.prop_id, payment_group_id = @nextIDPaymentGroup - 1 + ( row_number() over(order by t2.prop_id) )
			from @tblDistinctPID as t2
		) as assign on
			assign.prop_id = t.prop_id

		SELECT @LogTotRows = @@ROWCOUNT,
			 @LogErrCode = @@ERROR
		SET @LogStatus =  'Step 10 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode
	
		set @StartStep = getdate()
		exec dbo.CurrentActivityLogInsert @proc, 'Step 11 Start',@@ROWCOUNT,@@ERROR
			
		update t
		set t.payment_group_id = assign.payment_group_id		
		from @tblAssignID as t
		join @tblDistinctPID as assign on
			assign.prop_id = t.prop_id

		SELECT @LogTotRows = @@ROWCOUNT,
			 @LogErrCode = @@ERROR
		SET @LogStatus =  'Step 11 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
		exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode
	end

	-- Now for the actual work of updating the bills & fees
	
	declare @lItemsPerUpdate int
	set @lItemsPerUpdate = 50000
	
	declare @lIndex int
	set @lIndex = 0
	
	declare @lBegin int
	declare @lEnd int

	set @StartStep = getdate()
	exec dbo.CurrentActivityLogInsert @proc, 'Step 12 While Start',@@ROWCOUNT,@@ERROR
			
	while (@lIndex < @countTaxDue)
	begin
		set @lBegin = @lIndex
		set @lEnd = @lBegin + @lItemsPerUpdate
		
		update bill
		set
			bill.statement_id = case
				when bill.statement_id > 0
				then bill.statement_id
				else ta.statement_id
			end,
			bill.payment_group_id = ta.payment_group_id
		from bill
		join #tblTaxDue as td on
			td.tax_due_id = bill.bill_id and -- tax_due_type check not necessary b/c this will not join when not a bill
			td.item_num >= @lBegin and
			td.item_num < @lEnd
		join @tblAssignID as ta on
			ta.year = td.year and
			ta.prop_id = td.prop_id
		
		update fee
		set
			fee.statement_id = case
				when fee.statement_id > 0
				then fee.statement_id
				else ta.statement_id
			end,
			fee.payment_group_id = ta.payment_group_id
		from fee
		join #tblTaxDue as td on
			td.tax_due_id = fee.fee_id and -- tax_due_type check not necessary b/c this will not join when not a fee
			td.item_num >= @lBegin and
			td.item_num < @lEnd
		join @tblAssignID as ta on
			ta.year = td.year and
			ta.prop_id = td.prop_id

		set @lIndex = @lIndex + @lItemsPerUpdate
	end

	SELECT @LogTotRows = @@ROWCOUNT,
		 @LogErrCode = @@ERROR
	SET @LogStatus =  'Step 12 While End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode
	
	-- Now update the delinquent bills, giving them the same payment group ID as the current year
	set @StartStep = getdate()
	exec dbo.CurrentActivityLogInsert @proc, 'Step 13 Start',@@ROWCOUNT,@@ERROR
		
	update b
	set b.payment_group_id = t.payment_group_id
	from bill as b with(tablock)
	join tax_statement_idlist as tsil with(nolock) on
		tsil.dataset_id = @taxStatementDatasetID_DelqBill and
		tsil.id = b.bill_id
	join @tblDistinctPID as t on
		t.prop_id = b.prop_id
	where isnull(case when b.bill_type = 'RR' then 0 else b.rollback_id end, 0) <= 0

	SELECT @LogTotRows = @@ROWCOUNT,
		 @LogErrCode = @@ERROR
	SET @LogStatus =  'Step 13 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode
		
	-- Now update the delinquent fees, giving them the same payment group ID as the current year
	-- SQL is being a supersloth when fee_property_vw is used in this case,
	-- so do this is 2 steps so SQL will come up with a better execution plan.

	set @StartStep = getdate()
	exec dbo.CurrentActivityLogInsert @proc, 'Step 14 Start',@@ROWCOUNT,@@ERROR
		
	update f
	set f.payment_group_id = t.payment_group_id
	from fee as f with(tablock)
	join tax_statement_idlist as tsil with(nolock) on
		tsil.dataset_id = @taxStatementDatasetID_DelqFee and
		tsil.id = f.fee_id
	join fee_prop_assoc as fpa with(nolock) on
		fpa.fee_id = f.fee_id
	join @tblDistinctPID as t on
		t.prop_id = fpa.prop_id
	where isnull(f.rollback_id, 0) <= 0

	SELECT @LogTotRows = @@ROWCOUNT,
		 @LogErrCode = @@ERROR
	SET @LogStatus =  'Step 14 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

	set @StartStep = getdate()
	exec dbo.CurrentActivityLogInsert @proc, 'Step 15 Start',@@ROWCOUNT,@@ERROR
				
	update f
	set f.payment_group_id = t.payment_group_id
	from fee as f with(tablock)
	join tax_statement_idlist as tsil with(nolock) on
		tsil.dataset_id = @taxStatementDatasetID_DelqFee and
		tsil.id = f.fee_id
	join bill_fee_assoc as bfa with(nolock) on
		bfa.fee_id = f.fee_id
	join bill as b with(nolock) on
		b.bill_id = bfa.bill_id
	join @tblDistinctPID as t on
		t.prop_id = b.prop_id
	where isnull(f.rollback_id, 0) <= 0


	SELECT @LogTotRows = @@ROWCOUNT,
		 @LogErrCode = @@ERROR
	SET @LogStatus =  'Step 15 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode

-- end of procedure update log
SET @qry = @qry + convert(varchar(30),datediff(s,@StartProc,getdate()))
exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR

GO


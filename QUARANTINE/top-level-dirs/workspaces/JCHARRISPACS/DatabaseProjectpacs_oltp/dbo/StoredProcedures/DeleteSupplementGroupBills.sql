
CREATE PROCEDURE [dbo].[DeleteSupplementGroupBills]
	@sup_group_id	int
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
 + ' @sup_group_id =' +  convert(varchar(30),@sup_group_id)
 
 exec dbo.CurrentActivityLogInsert @proc, @qry
 
-- set variable for final status entry
 set @qry = @qry + ' Total Duration in secs: '
 set @qry = Replace(@qry,'Start','End')
 
/* End top of each procedure to capture parameters */
 

 
	declare @return_message varchar(255)

	--*****************Create Temp Table***************** 
	if exists(select id from tempdb..sysobjects where id = object_id('tempdb..#trans_group'))
	begin
		drop table #trans_group
	end

	create table #trans_group (trans_group_id int)

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 1 Start' --logging 


	--insert Voided and Created Rollback Bills
	insert into #trans_group (trans_group_id)
	select distinct trans_group_id 
	from coll_transaction ct with (nolock) 
	join bill b with (nolock)
		on b.bill_id = ct.trans_group_id
	join bill_adjustment as ba with (nolock)
		on ba.bill_id = b.bill_id
	join ag_rollback as ar with (nolock)
		on ar.ag_rollbk_id = b.rollback_id
	where (isNull(ar.void_sup_group_id, -1) = @sup_group_id or isNull(ar.accept_sup_group_id, -1) = @sup_group_id)
		and isNull(ar.accept_sup_group_id, -1) <> isNull(ar.void_sup_group_id, -1)
		and ba.bill_calc_type_cd = 'SM'

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 1 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 2 Start' --logging 
			
	--insert Voided and Created Rollback Fees
	insert into #trans_group (trans_group_id)
	select distinct trans_group_id 
	from coll_transaction ct with (nolock) 
	join fee as f with(nolock)
		on f.fee_id = ct.trans_group_id
	join fee_adjustment as fa with (nolock)
		on fa.fee_id = f.fee_id
	join ag_rollback as ar with (nolock)
		on ar.ag_rollbk_id = f.rollback_id
	where (isNull(ar.void_sup_group_id, -1) = @sup_group_id or isNull(ar.accept_sup_group_id, -1) = @sup_group_id)
		and isNull(ar.accept_sup_group_id, -1) <> isNull(ar.void_sup_group_id, -1)
		and fa.bill_calc_type_cd = 'SM'

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 2 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 3 Start' --logging 
			
	--insert Bills
	insert into #trans_group (trans_group_id)
	select distinct trans_group_id 
	from coll_transaction ct with (nolock) 
	join bill as b with(nolock)
		on b.bill_id = ct.trans_group_id	
	join bill_adjustment as ba with (nolock)
		on ba.bill_id = b.bill_id
	join supplement as s with (nolock)
		on s.sup_num = ba.sup_num
		and s.sup_tax_yr = b.[year]
	where s.sup_group_id = @sup_group_id
		and ba.bill_calc_type_cd = 'SM'	

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 3 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 4 Start' --logging 
		
	--insert Fees
	insert into #trans_group (trans_group_id)
	select distinct trans_group_id 
	from coll_transaction ct with (nolock) 
	join fee as f with(nolock)
		on f.fee_id = ct.trans_group_id
	join fee_adjustment as fa with (nolock)
		on fa.fee_id = f.fee_id
	join supplement as s with (nolock)
		on s.sup_num = fa.sup_num
		and s.sup_tax_yr = f.[year]
	where s.sup_group_id = @sup_group_id
		and fa.bill_calc_type_cd = 'SM'

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 4 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 5 Start' --logging 
			
					
	--*****************Undo Void Rollback Records***************** 
	update ag_rollback 
	set bills_created = 'T' 
	where isNull(void_sup_group_id, -1) = @sup_group_id

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 5 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 6 Start' --logging 
		
	--Fees
	--F1. set fee records back to previous values
	update fee 
	set current_amount_due = fa.previous_base_amount,
	code = fa.previous_bill_fee_cd,
	effective_due_date = fa.previous_effective_due_dt
	from fee as f with(nolock)
	join fee_adjustment as fa with (nolock)
		on fa.fee_id = f.fee_id
	join ag_rollback as ar with (nolock)
		on ar.ag_rollbk_id = f.rollback_id
	where isNull(ar.void_sup_group_id, -1) = @sup_group_id
		and isNull(ar.accept_sup_group_id, -1) <> isNull(ar.void_sup_group_id, -1)
		and fa.bill_calc_type_cd = 'SM'
		and f.fee_id not in (select trans_group_id 
								from #trans_group 
								where trans_group_id = f.fee_id)


	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 6 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 7 Start' --logging 
		
	--F2. delete Void adjustments
	delete from fee_adjustment
	from fee_adjustment as fa with (nolock)
	join fee as f with (nolock)
		on f.fee_id = fa.fee_id
	join ag_rollback as ar with (nolock)
		on ar.ag_rollbk_id = f.rollback_id
	where isNull(ar.void_sup_group_id, -1) = @sup_group_id
		and isNull(ar.accept_sup_group_id, -1) <> ar.void_sup_group_id
		and fa.bill_calc_type_cd = 'SM'
		and f.fee_id not in (select trans_group_id 
								from #trans_group 
								where trans_group_id = f.fee_id)
	

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 7 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 8 Start' --logging 
		
	--F3. delete pending transactions for Void fees
	delete from pending_coll_transaction 
	from pending_coll_transaction as pct with (nolock)
	join fee as f with (nolock)
		on f.fee_id = pct.trans_group_id
	join ag_rollback as ar with (nolock)
		on ar.ag_rollbk_id = f.rollback_id
		and isNull(ar.accept_sup_group_id, -1) <> isNull(ar.void_sup_group_id, -1)
	where isNull(ar.void_sup_group_id, -1) = @sup_group_id
		and f.fee_id not in (select trans_group_id 
								from #trans_group 
								where trans_group_id = f.fee_id)

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 8 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 9 Start' --logging 
		
	--Bills
	--B1. set (voided) bills back to previous values
	update bill 
	set current_amount_due = ba.previous_base_tax,
	code = ba.previous_bill_fee_cd,
	effective_due_date = ba.previous_effective_due_dt
	from bill as b with(nolock)
	join bill_adjustment as ba with (nolock)
		on ba.bill_id = b.bill_id
	join ag_rollback as ar with (nolock)
		on ar.ag_rollbk_id = b.rollback_id
	where isNull(ar.void_sup_group_id, -1) = @sup_group_id
		and isNull(ar.accept_sup_group_id, -1) <> isNull(ar.void_sup_group_id, -1)
		and ba.bill_calc_type_cd = 'SM'
		and b.bill_id not in (select trans_group_id 
									from #trans_group 
									where trans_group_id = b.bill_id)

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 9 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 10 Start' --logging 
			
	--B2. delete Void adjustments
	delete from bill_adjustment
	from bill_adjustment as ba with (nolock)
	join bill as b with (nolock)
		on b.bill_id = ba.bill_id
	join ag_rollback as ar with (nolock)
		on ar.ag_rollbk_id = b.rollback_id
	where isNull(ar.void_sup_group_id, -1) = @sup_group_id
		and isNull(ar.accept_sup_group_id, -1) <> ar.void_sup_group_id
		and ba.bill_calc_type_cd = 'SM'
		and b.bill_id not in (select trans_group_id 
									from #trans_group 
									where trans_group_id = b.bill_id)


	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 10 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 11 Start' --logging 
		
	--B3. delete pending transactions
	delete from pending_coll_transaction 
	from pending_coll_transaction as pct with (nolock)
	join bill as b with (nolock)
		on b.bill_id = pct.trans_group_id
	join ag_rollback as ar with (nolock)
		on ar.ag_rollbk_id = b.rollback_id
	where isNull(ar.void_sup_group_id, -1) = @sup_group_id
	and isNull(ar.accept_sup_group_id, -1) <> isNull(ar.void_sup_group_id, -1)
	and b.bill_id not in (select trans_group_id 
									from #trans_group 
									where trans_group_id = b.bill_id)

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 11 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 12 Start' --logging 
	
	--*****************End of Undo Void Rollback Records*****************


    --*****************Undo Created Rollback Records*****************
	update ag_rollback 
	set bills_created = 'F' 
	where isNull(accept_sup_group_id, -1) = @sup_group_id

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 12 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 13 Start' --logging 
		
	--Fees
	--F1. delete pending transactions for Void fees
	delete from pending_coll_transaction 
	from pending_coll_transaction as pct with (nolock)
	join fee as f with (nolock)
		on f.fee_id = pct.trans_group_id
	join ag_rollback as ar with (nolock)
		on ar.ag_rollbk_id = f.rollback_id
	where isNull(ar.accept_sup_group_id, -1) = @sup_group_id
		and f.fee_id not in (select trans_group_id 
								from #trans_group 
								where trans_group_id = f.fee_id)

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 13 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 14 Start' --logging 
	
	--F2. delete fee_payments due
	delete from fee_payments_due 
	from fee_payments_due as fpd with (nolock)
	join fee as f with (nolock)
		on f.fee_id = fpd.fee_id
	join ag_rollback as ar with (nolock)
		on ar.ag_rollbk_id = f.rollback_id
	where isNull(ar.accept_sup_group_id, -1) = @sup_group_id
		and f.fee_id not in (select trans_group_id 
								from #trans_group 
								where trans_group_id = f.fee_id)

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 14 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 15 Start' --logging 
	
	--F3. delete fee_prop_assoc
	delete from fee_prop_assoc 
	from fee_prop_assoc as fpa with (nolock)
	join fee as f with (nolock)
		on f.fee_id = fpa.fee_id
	join ag_rollback as ar with (nolock)
		on ar.ag_rollbk_id = f.rollback_id
	where isNull(ar.accept_sup_group_id, -1) = @sup_group_id
		and f.fee_id not in (select trans_group_id 
								from #trans_group 
								where trans_group_id = f.fee_id)

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 15 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 16 Start' --logging 
	
	--F4. delete fee_adjustment records
	delete from fee_adjustment
	from fee_adjustment as fa with (nolock)
	join fee as f with (nolock)
		on fa.fee_id = f.fee_id
	join ag_rollback as ar with (nolock)
		on ar.ag_rollbk_id = f.rollback_id
	where isNull(ar.accept_sup_group_id, -1) = @sup_group_id
		and fa.bill_calc_type_cd = 'SM'
		and f.fee_id not in (select trans_group_id 
								from #trans_group 
								where trans_group_id = f.fee_id)
	
	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 16 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 17 Start' --logging 
	
	--F5. delete fee records
	delete from fee
	from fee as f with (nolock)
	join ag_rollback as ar with (nolock)
		on ar.ag_rollbk_id = f.rollback_id
	where isNull(ar.accept_sup_group_id, -1) = @sup_group_id
		and f.fee_id not in (select trans_group_id 
								from #trans_group 
								where trans_group_id = f.fee_id)

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 17 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 18 Start' --logging 
	
	--Bills
	--B1. delete records from pending_coll_transaction
	delete from pending_coll_transaction 
	from pending_coll_transaction as pct with (nolock)
	join bill as b with (nolock)
		on b.bill_id = pct.trans_group_id
	join ag_rollback as ar with (nolock)
		on ar.ag_rollbk_id = b.rollback_id
	where isNull(ar.accept_sup_group_id, -1) = @sup_group_id
		and b.bill_id not in (select trans_group_id 
									from #trans_group 
									where trans_group_id = b.bill_id)

	
	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 18 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 19 Start' --logging 
	
	--B2. delete from bill_payments_due
	delete from bill_payments_due 
	from bill_payments_due as bpd with (nolock)
	join bill as b with (nolock)
		on b.bill_id = bpd.bill_id
	join ag_rollback as ar with (nolock)
		on ar.ag_rollbk_id = b.rollback_id
	where isNull(ar.accept_sup_group_id, -1) = @sup_group_id
		and b.bill_id not in (select trans_group_id 
									from #trans_group 
									where trans_group_id = b.bill_id)

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 19 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 20 Start' --logging 
	

	--B3. delete from bill_adjustment
	delete from bill_adjustment 
	from bill_adjustment as ba with (nolock)
	join bill as b with (nolock)
		on b.bill_id = ba.bill_id
	join ag_rollback as ar with (nolock)
		on ar.ag_rollbk_id = b.rollback_id
	where isNull(ar.accept_sup_group_id, -1) = @sup_group_id
		and ba.bill_calc_type_cd = 'SM'
		and b.bill_id not in (select trans_group_id 
									from #trans_group 
									where trans_group_id = b.bill_id)

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 20 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 21 Start' --logging 
	
	--B7. delete from levy_bill
	delete from levy_bill
	from levy_bill as lb with (nolock)
	join bill as b with (nolock)
		on b.bill_id = lb.bill_id
	join ag_rollback as ar with (nolock)
		on ar.ag_rollbk_id = b.rollback_id
	where isNull(ar.accept_sup_group_id, -1) = @sup_group_id
		and b.bill_id not in (select trans_group_id 
									from #trans_group 
									where trans_group_id = b.bill_id)

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 21 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 22 Start' --logging 
	
	--B6. delete from bill
	delete from bill
	from bill as b with (nolock)
	join ag_rollback as ar with (nolock)
		on ar.ag_rollbk_id = b.rollback_id
	where isNull(ar.accept_sup_group_id, -1) = @sup_group_id
		and b.bill_id not in (select trans_group_id 
									from #trans_group 
									where trans_group_id = b.bill_id)

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 22 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 23 Start' --logging 
	
	delete from trans_group
	from trans_group as tg with (nolock)
	left join bill as b with (nolock)
		on b.bill_id = tg.trans_group_id
	where isNull(b.bill_id, -1) = -1
		and trans_group_type in ('LB', 'AB')
		and tg.trans_group_id not in (select trans_group_id 
									from #trans_group 
									where trans_group_id = tg.trans_group_id)
		and tg.trans_group_id not in (select trans_group_id 
								from coll_transaction ct with (nolock)
								where ct.trans_group_id = tg.trans_group_id)
		and tg.trans_group_id not in (select trans_group_id 
								from pending_coll_transaction ct with (nolock)
								where ct.trans_group_id = tg.trans_group_id)


	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 23 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 24 Start' --logging 
	
	--*****************End of Undo Created Rollback Bills*****************
	
	--*****************Undo Fee Records*****************
	update fee 
	set current_amount_due = fa.previous_base_amount,
	code = fa.previous_bill_fee_cd,
	effective_due_date = fa.previous_effective_due_dt
	from fee as f with(nolock)
	join fee_adjustment as fa with (nolock)
		on fa.fee_id = f.fee_id
	join supplement as s with (nolock)
		on s.sup_num = fa.sup_num
		and s.sup_tax_yr = f.[year]
	where s.sup_group_id = @sup_group_id
		and fa.bill_calc_type_cd = 'SM'

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 24 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 25 Start' --logging 
	
	delete from fee_adjustment
	from fee_adjustment as fa with (nolock)
	join fee as f with (nolock)
		on f.fee_id = fa.fee_id
	join supplement as s with (nolock)
		on s.sup_num = fa.sup_num
		and s.sup_tax_yr = f.[year]
	where s.sup_group_id = @sup_group_id
		and fa.bill_calc_type_cd = 'SM'
		and fa.sup_num = s.sup_num 
		and f.is_active = 0

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 25 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 26 Start' --logging 
	
	delete from pending_coll_transaction 
	from pending_coll_transaction as pct with (nolock)
	join fee as f with (nolock)
		on f.fee_id = pct.trans_group_id
	join supplement s
		on s.sup_num = f.sup_num
		and s.sup_tax_yr = f.[year]
	where s.sup_group_id = @sup_group_id

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 26 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 27 Start' --logging 
	
	delete from fee_payments_due 
	from fee_payments_due as fpd with (nolock)
	join fee as f with (nolock)
		on f.fee_id = fpd.fee_id
	join supplement s
		on s.sup_num = f.sup_num
		and s.sup_tax_yr = f.[year]
	where s.sup_group_id = @sup_group_id
		and f.fee_id not in (	select distinct fa.fee_id 
								from fee_adjustment as fa with (nolock))
		and f.is_active = 0
		and f.fee_id not in (select trans_group_id 
								from #trans_group 
								where trans_group_id = f.fee_id)

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 27 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 28 Start' --logging 
		
	delete from fee_prop_assoc 
	from fee_prop_assoc as fpa with (nolock)
	join fee as f with (nolock)
		on f.fee_id = fpa.fee_id
	join supplement s
		on s.sup_num = f.sup_num
		and s.sup_tax_yr = f.[year]
	where s.sup_group_id = @sup_group_id
		and f.fee_id not in (	select distinct fa.fee_id 
								from fee_adjustment as fa with (nolock))
		and f.is_active = 0
		and f.fee_id not in (select trans_group_id 
								from #trans_group 
								where trans_group_id = f.fee_id)

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 28 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 29 Start' --logging 
		
	delete from bill_fee_assoc 
	from bill_fee_assoc as bfa with (nolock)
	join fee as f with (nolock)
		on f.fee_id = bfa.fee_id
	join supplement s
		on s.sup_num = f.sup_num
		and s.sup_tax_yr = f.[year]
	where s.sup_group_id = @sup_group_id
		and f.fee_id not in (	select distinct fa.fee_id 
								from fee_adjustment as fa with (nolock))
		and f.is_active = 0
		and f.fee_id not in (select trans_group_id 
								from #trans_group 
								where trans_group_id = f.fee_id)

	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 29 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 30 Start' --logging 
		
	delete from fee 
	from fee as f with (nolock)
	join supplement s
		on s.sup_num = f.sup_num
		and s.sup_tax_yr = f.[year]
	where s.sup_group_id = @sup_group_id
		and f.fee_id not in (	select distinct fa.fee_id 
								from fee_adjustment as fa with (nolock))
		and f.is_active = 0
		and f.fee_id not in (	select trans_group_id 
								from coll_transaction 
								where trans_group_id = f.fee_id)

	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 30 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 31 Start' --logging 
	
	update fee
		set sup_num = (select isNull(max(fa.sup_num), 0) 
						from fee_adjustment as fa with (nolock)
						where fa.fee_id = f.fee_id)  
	from fee as f with (nolock) 
	join supplement s
		on s.sup_num = f.sup_num
		and s.sup_tax_yr = f.[year]
	where s.sup_group_id = @sup_group_id
		--and f.is_active = 0

	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 31 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 32 Start' --logging 
	
	delete from trans_group
	from trans_group as tg with (nolock)
	left join fee as f with (nolock)
		on f.fee_id = tg.trans_group_id
	where isNull(f.fee_id, -1) = -1
		and trans_group_type in ('F')
		and tg.trans_group_id not in (select trans_group_id 
									from #trans_group 
									where trans_group_id = tg.trans_group_id)
		and tg.trans_group_id not in (select trans_group_id 
								from coll_transaction ct with (nolock)
								where ct.trans_group_id = tg.trans_group_id)
		and tg.trans_group_id not in (select trans_group_id 
								from pending_coll_transaction ct with (nolock)
								where ct.trans_group_id = tg.trans_group_id)

	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 32 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	--*****************End Undo Fee Records*****************
	

	--*****************Undo Bill Records*****************

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 32.5 Start' --logging 

	delete from tif_area_bill_values
	from tif_area_bill_values
	join bill on 
			tif_area_bill_values.year		= bill.[year]
		and tif_area_bill_values.sup_num		= bill.sup_num
		and tif_area_bill_values.prop_id		= bill.prop_id
	where	--bill.bill_type				= 'L'
		bill.[year]					= tif_area_bill_values.year
		and isnull(bill.is_active, 0)	= 0
		and bill.created_by_type_cd		= 'SUP'

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 32.5 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 


	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 33 Start' --logging 

	update bill 
	set current_amount_due = ba.previous_base_tax,
	code = ba.previous_bill_fee_cd,
	effective_due_date = ba.previous_effective_due_dt
	from bill as b with(nolock)
	join bill_adjustment as ba with (nolock)
		on ba.bill_id = b.bill_id
	join supplement as s with (nolock)
		on s.sup_num = ba.sup_num
		and s.sup_tax_yr = b.[year]
	where s.sup_group_id = @sup_group_id
		and ba.bill_calc_type_cd = 'SM'

	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 33 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 34 Start' --logging 
	
	delete from bill_adjustment
	from bill_adjustment as ba with (nolock)
	join bill as b with (nolock)
		on b.bill_id = ba.bill_id
	join supplement as s with (nolock)
		on s.sup_num = ba.sup_num
		and s.sup_tax_yr = b.[year]
	where s.sup_group_id = @sup_group_id
		and ba.bill_calc_type_cd = 'SM'
		and ba.sup_num = s.sup_num
		--and b.is_active = 0

	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 34 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 35 Start' --logging 
	
	delete from pending_coll_transaction 
	from pending_coll_transaction as pct with (nolock)
	join bill as b with (nolock)
		on b.bill_id = pct.trans_group_id
	join supplement s
		on s.sup_num = b.sup_num
		and s.sup_tax_yr = b.[year]
	where s.sup_group_id = @sup_group_id

	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 35 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 36 Start' --logging 
	
	delete from bill_payments_due 
	from bill_payments_due as bpd with (nolock)
	join bill as b with (nolock)
		on b.bill_id = bpd.bill_id
	join supplement s
		on s.sup_num = b.sup_num
		and s.sup_tax_yr = b.[year]
	where s.sup_group_id = @sup_group_id
		and b.bill_id not in (	select distinct ba.bill_id 
								from bill_adjustment as ba with (nolock))
		and b.created_by_type_cd = 'SUP'
		and b.is_active = 0
		and b.bill_id not in (select trans_group_id 
									from #trans_group 
									where trans_group_id = b.bill_id)

	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 36 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 37 Start' --logging 
		

	delete from levy_bill 
	from levy_bill as lb with (nolock)
	left join bill as b with (nolock)
		on b.bill_id = lb.bill_id
	join supplement as s with (nolock)
		on s.sup_num = b.sup_num
		and s.sup_tax_yr = b.[year]
	where s.sup_group_id = @sup_group_id
		and b.bill_id not in (	select distinct ba.bill_id 
								from bill_adjustment as ba with (nolock))
		and b.created_by_type_cd = 'SUP'
		and b.is_active = 0
		and b.bill_id not in (select trans_group_id 
									from #trans_group 
									where trans_group_id = b.bill_id)
		

	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 37 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 38 Start' --logging 
	
	delete from assessment_bill 
	from assessment_bill as ab with (nolock)
	join bill as b with (nolock)
		on b.bill_id = ab.bill_id
	join supplement as s with (nolock)
		on s.sup_num = b.sup_num
		and s.sup_tax_yr = b.[year]
	where s.sup_group_id = @sup_group_id
		and b.bill_id not in (	select distinct ba.bill_id 
								from bill_adjustment as ba with (nolock))
		and b.created_by_type_cd = 'SUP'
		and b.is_active = 0
		and b.bill_id not in (select trans_group_id 
									from #trans_group 
									where trans_group_id = b.bill_id)

	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 38 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 39 Start' --logging 
	
	delete from bill
	from bill as b with (nolock)
	join supplement s
		on s.sup_num = b.sup_num
		and s.sup_tax_yr = b.[year]
	where s.sup_group_id = @sup_group_id
		and b.bill_id not in (	select distinct ba.bill_id 
								from bill_adjustment as ba with (nolock))
		and b.created_by_type_cd = 'SUP'
		and b.is_active = 0
		and b.bill_id not in (select trans_group_id 
									from #trans_group 
									where trans_group_id = b.bill_id)

	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 39 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 40 Start' --logging 
		
	delete from trans_group
	from trans_group as tg with (nolock)
	left join bill as b with (nolock)
		on b.bill_id = tg.trans_group_id
	where isNull(b.bill_id, -1) = -1
		and trans_group_type in ('LB', 'AB')
		and b.is_active = 0
		and tg.trans_group_id not in (select trans_group_id 
									from #trans_group 
									where trans_group_id = tg.trans_group_id)
		and tg.trans_group_id not in (select trans_group_id 
								from coll_transaction ct with (nolock)
								where ct.trans_group_id = tg.trans_group_id)
		and tg.trans_group_id not in (select trans_group_id 
								from pending_coll_transaction ct with (nolock)
								where ct.trans_group_id = tg.trans_group_id)

	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 40 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 41 Start' --logging 
	
	update bill
		set sup_num = (select isNull(max(ba.sup_num), 0) 
						from bill_adjustment as ba with (nolock)
						where ba.bill_id = b.bill_id)  
	from bill as b with (nolock) 
	join supplement s
		on s.sup_num = b.sup_num
		and s.sup_tax_yr = b.[year]
	where s.sup_group_id = @sup_group_id

	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 41 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 42 Start' --logging 

	
	--*****************Undo Remove Bill Records*****************

	update sup_group
	set sup_bill_create_dt = null,
	status_cd = 'A',
	sup_bill_status = null,
	sup_bills_created_by_id	= null,
	sup_bills_batch_id = null
	where sup_group_id = @sup_group_id

	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 42 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	drop table #trans_group

-- end of procedure update log
SET @qry = @qry + convert(varchar(30),datediff(s,@StartProc,getdate()))
exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR

GO


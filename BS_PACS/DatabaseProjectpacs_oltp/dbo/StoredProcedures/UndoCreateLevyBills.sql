
/******************************************************************************************
 Procedure: UndoCreateLevyBills
 Synopsis:	Deletes created Levy Bill Records for the most recent Levy Certification
			Run with a 'Bills Created' status.  This removes records created in 
			levy_supp_assoc, trans_group, bill, levy_bill, and pending_coll_transaction.
			
 Call From:	App Server
 ******************************************************************************************/
CREATE PROCEDURE UndoCreateLevyBills
	@pacs_user_id		int,
	-- optional, if not provided the first 'Accepted' status Levy Certification Run is used
	@year				numeric(4, 0) = 0,		
	@levy_cert_run_id	int	= 0

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
 + ' @pacs_user_id =' +  convert(varchar(30),@pacs_user_id) + ','
 + ' @year =' +  convert(varchar(30),@year) + ','
 + ' @levy_cert_run_id =' +  convert(varchar(30),@levy_cert_run_id)
 
 exec dbo.CurrentActivityLogInsert @proc, @qry
 
-- set variable for final status entry
 set @qry = @qry + ' Total Duration in secs: '
 set @qry = Replace(@qry,'Start','End')
 
/* End top of each procedure to capture parameters */
 

	declare @return_message varchar(255)
	
	if @year = 0 or @levy_cert_run_id = 0
		begin
			-- get the current certified year for which a Levy Certification Run 
			-- exists that Levy Bills have not been created but not activated.

			if not exists(
				select * 
				from levy_cert_run as lcr with (nolock) 
				join pacs_year as py with (nolock) on
					py.tax_yr = lcr.[year]
				where	lcr.status = 'Bills Created'
--						and py.certification_dt is not null 
			)
			begin
				set @return_message = 'No Levy Certification Run exists for which levy bills have been created, but not activated.' 
				goto quit
			end
			
			select 
				@levy_cert_run_id = lcr.levy_cert_run_id,
				@year = lcr.[year]
			from levy_cert_run as lcr with (nolock) 
			join pacs_year as py with (nolock) on py.tax_yr = lcr.[year]
			where 
					lcr.status = 'Bills Created'
--				and py.certification_dt is not null 
					
		end
	else
		begin
			if not exists
			(
				select * 
				from levy_cert_run as lcr with (nolock) 
				join pacs_year as py with (nolock) on
					py.tax_yr = lcr.[year]
				where 
						lcr.levy_cert_run_id	= @levy_cert_run_id
					and lcr.[year]				= @year
					and lcr.status				= 'Bills Created'
--					and py.certification_dt		is not null 
			)
			begin
				set @return_message = 'The specified Levy Certification Run must have an "Bills Created" status.'
				goto quit
			end
		end

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 1 Start' --logging 

	--delete bpp fees
	delete from fee_payments_due
	from fee_payments_due
	join bill_fee_assoc as bfa with (nolock) on
			bfa.fee_id = fee_payments_due.fee_id 
	join bill with (nolock) on
			bill.bill_id = bfa.bill_id
	join levy_supp_assoc as lsa on 
			lsa.sup_yr		= bill.[year]
		and lsa.sup_num		= bill.sup_num
		and lsa.prop_id		= bill.prop_id
		and lsa.[type]		= bill.bill_type
	where	bill.bill_type				= 'L'
		and bill.[year]					= @year
		and isnull(bill.is_active, 0)	= 0
		and bill.created_by_type_cd		= 'CERT'

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 1 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 2 Start' --logging 
	
	delete from pending_coll_transaction 
	from pending_coll_transaction 
	join fee with (nolock) on
			fee.fee_id = pending_coll_transaction.trans_group_id
	join bill_fee_assoc as bfa with(nolock)
		on bfa.fee_id = fee.fee_id
	join bill with(nolock)
		on bill.bill_id = bfa.bill_id
	join levy_supp_assoc as lsa on 
			lsa.sup_yr		= bill.[year]
		and lsa.sup_num		= bill.sup_num
		and lsa.prop_id		= bill.prop_id
		and lsa.[type]		= bill.bill_type
	where	bill.bill_type				= 'L'
		and bill.[year]					= @year
		and isnull(bill.is_active, 0)	= 0
		and pending_coll_transaction.transaction_type = 'CF'

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 2 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 3 Start' --logging 
	
	delete from bill_fee_assoc
	from bill_fee_assoc
	join bill with (nolock) on
			bill.bill_id = bill_fee_assoc.bill_id
	join levy_supp_assoc as lsa on 
			lsa.sup_yr		= bill.[year]
		and lsa.sup_num		= bill.sup_num
		and lsa.prop_id		= bill.prop_id
		and lsa.[type]		= bill.bill_type
	where	bill.bill_type				= 'L'
		and bill.[year]					= @year
		and isnull(bill.is_active, 0)	= 0
		and bill.created_by_type_cd		= 'CERT'

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 3 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 4 Start' --logging 
	
	create table #trans_group (trans_group_id int)
	
	insert into #trans_group (trans_group_id)
	select fee.fee_id
	from fee
	where	fee.fee_id not in (select trans_group_id from coll_transaction union 
								select trans_group_id from pending_coll_transaction)
		and	fee.[year] = @year
		and fee.is_active = 0 

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 4 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 


	create index #ndx_trans_group on #trans_group (trans_group_id)

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 5 Start' --logging 
			
	delete from fee
	from fee
	where	fee.fee_id not in (select trans_group_id from coll_transaction union 
								select trans_group_id from pending_coll_transaction)
		and	fee.[year] = @year
		and fee.is_active = 0 

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 5 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 


	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 5.5 Start' --logging 

	-- delete levy bill adjustments
	-- These should not exist, but it was possible to create some before activating the bills
	delete ct
	from coll_transaction ct
	join bill_adjustment ba
		on ba.bill_id = ct.trans_group_id
	join bill with(nolock)
		on bill.bill_id = ba.bill_id
	where bill.bill_type = 'L'
		and bill.[year] = @year
		and isnull(bill.is_active, 0) = 0
		and bill.created_by_type_cd = 'CERT'
		and ct.transaction_type = 'ADJLB'

	delete from ba
	from bill_adjustment ba
	join bill with(nolock)
		on bill.bill_id = ba.bill_id
	where bill.bill_type = 'L'
		and bill.[year] = @year
		and isnull(bill.is_active, 0) = 0
		and bill.created_by_type_cd = 'CERT'

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 5.5 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 


	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 6 Start' --logging 
		
	--delete bills
	delete from bill_payments_due
	from bill_payments_due
	join bill with (nolock) on
			bill.bill_id = bill_payments_due.bill_id
	join levy_supp_assoc as lsa on 
			lsa.sup_yr		= bill.[year]
		and lsa.sup_num		= bill.sup_num
		and lsa.prop_id		= bill.prop_id
		and lsa.[type]		= bill.bill_type
	where	bill.bill_type				= 'L'
		and bill.[year]					= @year
		and isnull(bill.is_active, 0)	= 0
		and bill.created_by_type_cd		= 'CERT'

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 6 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 


	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 7 Start' --logging 
		
	delete from levy_bill
	from levy_bill
	join bill with (nolock) on
			bill.bill_id = levy_bill.bill_id
	join levy_supp_assoc as lsa on 
			lsa.sup_yr		= bill.[year]
		and lsa.sup_num		= bill.sup_num
		and lsa.prop_id		= bill.prop_id
		and lsa.[type]		= bill.bill_type
	where	bill.bill_type				= 'L'
		and bill.[year]					= @year
		and isnull(bill.is_active, 0)	= 0
		and bill.created_by_type_cd		= 'CERT'

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 7 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 


	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 8 Start' --logging 
		
	delete from pending_coll_transaction 
	from pending_coll_transaction 
	join bill with (nolock) on
			bill.bill_id = pending_coll_transaction.trans_group_id
	join levy_supp_assoc as lsa on 
			lsa.sup_yr		= bill.[year]
		and lsa.sup_num		= bill.sup_num
		and lsa.prop_id		= bill.prop_id
		and lsa.[type]		= bill.bill_type
	where	bill.bill_type				= 'L'
		and bill.[year]					= @year
		and isnull(bill.is_active, 0)	= 0
		and bill.created_by_type_cd		= 'CERT'
		and pending_coll_transaction.transaction_type = 'CLB'

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 8 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 


	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 9 Start' --logging 
	
	
	insert into #trans_group (trans_group_id)
	select trans_group.trans_group_id 
	from trans_group
	join bill with (nolock) on
			bill.bill_id = trans_group.trans_group_id
	join levy_supp_assoc as lsa on 
			lsa.sup_yr		= bill.[year]
		and lsa.sup_num		= bill.sup_num
		and lsa.prop_id		= bill.prop_id
		and lsa.[type]		= bill.bill_type
	where	bill.bill_type				= 'L'
		and bill.[year]					= @year
		and isnull(bill.is_active, 0)	= 0
		and bill.created_by_type_cd		= 'CERT'
		and trans_group.trans_group_type = 'LB'

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 9 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 


	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 10 Start' --logging 
	
	delete from levy_supp_assoc
	from levy_supp_assoc
	join bill on 
			levy_supp_assoc.sup_yr		= bill.[year]
		and levy_supp_assoc.sup_num		= bill.sup_num
		and levy_supp_assoc.prop_id		= bill.prop_id
		and levy_supp_assoc.[type]		= bill.bill_type
	where	bill.bill_type				= 'L'
		and bill.[year]					= @year
		and isnull(bill.is_active, 0)	= 0
		and bill.created_by_type_cd		= 'CERT'

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 10 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 


-----------------------------------


	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 10B Start' --logging 
	
	delete from tif_area_bill_values
	from tif_area_bill_values
	join bill on 
			tif_area_bill_values.year		= bill.[year]
		and tif_area_bill_values.sup_num		= bill.sup_num
		and tif_area_bill_values.prop_id		= bill.prop_id
	where	bill.bill_type				= 'L'
		and bill.[year]					= @year
		and isnull(bill.is_active, 0)	= 0
		and bill.created_by_type_cd		= 'CERT'

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 10B End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 


	
-----------------------------------



	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 11 Start' --logging 
	
	delete from bill
	where	bill.bill_type				= 'L'
		and bill.[year]					= @year
		and isnull(bill.is_active, 0)	= 0
		and bill.created_by_type_cd		= 'CERT'

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 11 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 


	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 12 Start' --logging 
	
	delete from trans_group
	from trans_group
	join #trans_group on #trans_group.trans_group_id = trans_group.trans_group_id

	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 12 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	drop table #trans_group

	set @StartStep = getdate()  --logging capture start time
	exec dbo.CurrentActivityLogInsert @proc, 'Step 13 Start' --logging 
	
	update levy_cert_run set
		bills_created_date = null,
		bills_created_by_id = null,
		[status] = 'Accepted'
	where	levy_cert_run_id = @levy_cert_run_id
		and [year] = @year

	update sup_group set 
		sup_bill_create_dt = null,
		sup_bills_created_by_id = null,
		status_cd = 'A'
	from sup_group
	where sup_group_id in 
		(	select sup_group_id
			from supplement s
			where s.sup_tax_yr = @year
			and s.levy_cert_run_id = @levy_cert_run_id) and
		sup_group_id not in 
		(	select sup_group_id
			from supplement
			where sup_tax_yr <> @year) and
		isNull(status_cd, 'C') = 'BC'


	-- logging end of step 
	SELECT @LogTotRows = @@ROWCOUNT, 
		   @LogErrCode = @@ERROR 
	   SET @LogStatus =  'Step 13 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

quit:
	select @return_message as return_message
	set nocount off

-- end of procedure update log
SET @qry = @qry + convert(varchar(30),datediff(s,@StartProc,getdate()))
exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR

GO


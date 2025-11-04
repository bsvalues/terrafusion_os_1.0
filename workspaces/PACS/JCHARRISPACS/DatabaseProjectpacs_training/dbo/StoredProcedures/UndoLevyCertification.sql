
/******************************************************************************************
 Procedure: UndoLevyCertification
 Synopsis:	Deletes created Levy Bill Records for the most recent Levy Certification
			Run with a 'Bills Created' status.  This removes records created in 
			levy_supp_assoc, trans_group, bill, levy_bill, and pending_coll_transaction.
			
 Call From:	App Server
 ******************************************************************************************/
CREATE PROCEDURE UndoLevyCertification
	@pacs_user_id		int,
	@year				numeric(4, 0) = 0,		
	@levy_cert_run_id	int	= 0,
	@batch_id			int

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
DECLARE @proc varchar(100)
DECLARE @transaction_id int
DECLARE @count int -- to hold count of entries inserted into offset entry tables
DECLARE @bills_created_date DATETIME

 set @proc = object_name(@@procid)
 
 SET @qry = 'Start - ' + @proc  
 + ' @pacs_user_id =' +  convert(varchar(30),@pacs_user_id) + ','
 + ' @year =' +  convert(varchar(30),@year) + ','
 + ' @levy_cert_run_id =' +  convert(varchar(30),@levy_cert_run_id) + ','
 + ' @batch_id = ' + convert(varchar(30), @batch_id)
 
 exec dbo.CurrentActivityLogInsert @proc, @qry
 
-- set variable for final status entry
 set @qry = @qry + ' Total Duration in secs: '
 set @qry = Replace(@qry,'Start','End')
 
/* End top of each procedure to capture parameters */
 

	declare @return_message varchar(255)
	
	if not exists
	(
		select * 
		from levy_cert_run as lcr with (nolock) 
		join pacs_year as py with (nolock) on
			py.tax_yr = lcr.[year]
		where 
				lcr.levy_cert_run_id	= @levy_cert_run_id
			and lcr.[year]				= @year
			and lcr.status				= 'Bills Activated'
--					and py.certification_dt		is not null 
	)
	begin
		set @return_message = 'The specified Levy Certification Run must have an "Bills Activated" status.'
		goto quit
	end

-- Get the activated datetime
select @bills_created_date = bills_created_date
from levy_cert_run (nolock) 
where levy_cert_run_id = @levy_cert_run_id

-- Start Transaction and get exclusive locks for tables involved.
set xact_abort on  -- roll everything back if we have an error
BEGIN TRANSACTION UndoLevyCert

create table #junk
(
	junk_id int
)

-- Grab exclusive locks on all the tables we want to use
insert into #junk
SELECT bill_id FROM BILL WITH(TABLOCKX) WHERE 1 = 0 
insert into #junk
SELECT bill_id FROM bill_payments_due WITH(TABLOCKX) WHERE 1 = 0 
insert into #junk
SELECT bill_id FROM bill_adjustment WITH(TABLOCKX) WHERE 1 = 0 
insert into #junk
SELECT fee_id FROM fee WITH(TABLOCKX) WHERE 1 = 0 
insert into #junk
SELECT bill_id FROM bill_fee_assoc WITH(TABLOCKX) WHERE 1 = 0 
insert into #junk
SELECT fee_id FROM fee_adjustment WITH(TABLOCKX) WHERE 1 = 0 
insert into #junk
SELECT fee_id FROM fee_payments_due WITH(TABLOCKX) WHERE 1 = 0 
insert into #junk
SELECT bill_id FROM levy_bill WITH(TABLOCKX) WHERE 1 = 0 
drop table #junk

	-----------------------------------------------------------------------------
	--                    Offset entry for bills
	-----------------------------------------------------------------------------
--	set @StartStep = getdate()  --logging capture start time
--	SELECT @LogTotRows = @@ROWCOUNT, 
--		   @LogErrCode = @@ERROR 
--	   SET @LogStatus =  'Step 1 Start: Offsetting entries to coll_transaction for Bills. ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
--	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	-- insert a row into the history table
	insert into levy_cert_reset_history
	values
	( @levy_cert_run_id, @year, @batch_id, @pacs_user_id, GETDATE(), null )
	
	-- off set bills
	--SET @LogStatus =  'Start Selecting bill entries to temp table.  '
	--exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

    -- get bill entries only before matching with coll_transaction table, prevents duplicates
    create table #bill_entries
     (
         bill_id int
        ,payment_status_type_cd varchar(10)
        ,transaction_id int
     )

	-- This gets all the bills that are active for the selected year
    insert into #bill_entries
     (
         bill_id 
        ,payment_status_type_cd 
        ,transaction_id 
     )
	select 
		  b.bill_id, b.payment_status_type_cd, 0 as transaction_id 
	from bill b 
	where 1=1
		and b.year					= @year
		and b.amount_paid			= 0
		and b.bill_type				= 'L'
		and isnull(b.is_active, 0)	= 1

	create index idx_be on #bill_entries(bill_id)

	--	SET @LogTotRows = @@ROWCOUNT
	--	SET @LogStatus =  'End Selecting bill entries to temp table.  '
	--	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

    -- declare temp table first. Select Into statements can lock temp db and create blocking situations
    create table #bill_offset_entry
     (
         bill_id int
				,bill_adj_id int
        ,payment_status_type_cd varchar(10)
        ,transaction_id int
        ,adj_amt numeric(14,2)
     )

    insert into #bill_offset_entry
     (
         bill_id 
				,bill_adj_id
        ,payment_status_type_cd 
        ,transaction_id 
        ,adj_amt 
     )
	select 
		  b.bill_id, 0, b.payment_status_type_cd, b.transaction_id,
		  sum(ct.base_amount) *-1 as adj_amt  
	from #bill_entries b (nolock)
	join coll_transaction ct (nolock)
		  on ct.trans_group_id = b.bill_id
	where 1=1
		and ct.transaction_date > @bills_created_date
	group by
		  b.bill_id, b.payment_status_type_cd, b.transaction_id
	having sum(ct.base_amount) *-1 <> 0  -- don't create adjustment records if none are needed.

	set @count = @@ROWCOUNT  -- captures # of records inserted into #bill_offset_entry

if @count > 0
    begin
     -- reserve a block of unique transaction id's
	exec GetUniqueID 'coll_transaction', @transaction_id output,@count,0
		-- ... we have reserved ids from:
		--		@transaction_id + @count - 1

		update b
		set b.transaction_id = assign.transaction_id		
		from #bill_offset_entry as b
		join (
			select b2.bill_id, transaction_id = @transaction_id - 1 + ( row_number() over(order by b2.bill_id) )
			from #bill_offset_entry as b2
		) as assign on
			assign.bill_id = b.bill_id
    end

	-- Now update the coll_transaction table with the offsetting value
	insert into coll_transaction WITH(TABLOCKX) 
	select oe.transaction_id, oe.bill_id, oe.adj_amt, 0,
	0, 0, 0, 'ADJLB', 0, 0, 0, @pacs_user_id, GETDATE(),
	@batch_id, GETDATE()
	from #bill_offset_entry as oe

	-- Update the bill table
	Update BILL	WITH(TABLOCKX) 
	set initial_amount_due = 0,
	current_amount_due = 0,
	is_active = 0,
	last_modified = GETDATE(),
	payment_status_type_cd = 'FULL'
	where bill_id in (select bill_id from #bill_entries)

	-- update the bill_payments_due table.  
	-- First get rid of additional entries for the same bill_id
	delete from bill_payments_due WITH(TABLOCKX) 
	where bill_payment_id > 0
	and bill_id in (select bill_id from #bill_entries)

	-- Now set those values to zero
	update bill_payments_due WITH(TABLOCKX) 
	set amount_due = 0
	where bill_id in (select bill_id from #bill_offset_entry)

	select @count = count(ba.bill_id)
	from bill_adjustment ba (nolock) 
	join #bill_offset_entry oe on ba.bill_id = oe.bill_id
	where ba.bill_id in (select bill_id from #bill_offset_entry)

	declare @bill_adj_id int

	if @count > 0
	begin
		exec GetUniqueID 'bill_adjustment', @bill_adj_id output, @count, 0

		update b
		set b.bill_adj_id = assign.bill_adj_id		
		from #bill_offset_entry as b
		join (
			select b2.bill_id, bill_adj_id = @bill_adj_id - 1 + ( row_number() over(order by b2.bill_id) )
			from bill_adjustment ba (nolock) 
			join #bill_offset_entry b2 on ba.bill_id = b2.bill_id
			where ba.bill_id in (select bill_id from #bill_offset_entry)
		) as assign on
			assign.bill_id = b.bill_id
	end

	-- Update bill_adjustment table.
	-- will have a transaction_id from coll_transaction
	-- previous and current amount
	insert into bill_adjustment WITH(TABLOCKX) 
	(bill_adj_id, bill_id, batch_id, 
		modify_cd, modify_reason, 
		tax_area_id, previous_base_tax, base_tax, transaction_id )
	select  distinct oe.bill_adj_id
		,oe.bill_id, @batch_id, 
		'UNDO_LEVY', 'Levy Bill reversal due to Levy Certification Undo', 
		lb.tax_area_id, oe.adj_amt * -1, 0, oe.transaction_id
	from bill_adjustment ba (nolock) 
	join #bill_offset_entry oe on ba.bill_id = oe.bill_id
	join levy_bill lb (nolock) on lb.bill_id = oe.bill_id
		and lb.year = @year
	where ba.bill_id in (select bill_id from #bill_offset_entry)


	-----------------------------------------------------------------------------
	--                    Offset entry for fees
	-----------------------------------------------------------------------------

    -- get fee entries only before matching with coll_transaction table, prevents duplicates
    create table #fee_entries
     (
         fee_id int
				,fee_type_cd varchar(10)
        ,transaction_id int
     )

    insert into #fee_entries
     (
         fee_id 
        ,fee_type_cd 
        ,transaction_id 
     )

	select 
		  f.fee_id, f.fee_type_cd, 0 as transaction_id 
	from fee f 
	join bill_fee_assoc as bfa with(nolock)
		on bfa.fee_id = f.fee_id
	join #bill_entries be (nolock)
		on bfa.bill_id = be.bill_id
	where 1=1
		and f.year						= @year
		and f.amount_paid				= 0

	create index idx_fe on #fee_entries(fee_id)

    -- declare temp table first. Select Into statements can lock temp db and create blocking situations
    create table #fee_offset_entry
     (
         fee_id int
 		 		,fee_adj_id int
				,fee_type_cd varchar(10)
        ,transaction_id int
        ,adj_amt numeric(14,2)
     )

    insert into #fee_offset_entry
     (
         fee_id 
        ,fee_adj_id
        ,fee_type_cd 
        ,transaction_id 
        ,adj_amt 
     )
	select 
		  f.fee_id, 0, f.fee_type_cd, f.transaction_id,
		  sum(ct.base_amount) *-1 as adj_amt  
	from #fee_entries f (nolock)
	join coll_transaction ct 
		  on ct.trans_group_id = f.fee_id
	where 1=1
		and ct.transaction_date > @bills_created_date
group by
		  f.fee_id, f.fee_type_cd, f.transaction_id
having sum(ct.base_amount) *-1 <> 0  -- don't create adjustment records if none are needed.

set @count = @@ROWCOUNT  -- captures # of records inserted into #fee_offset_entry

--SET @LogStatus =  '	Adding Transacion ID values to the fee offset entry.  '
--exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

if @count > 0
    begin
			 -- reserve a block of unique transaction id's
			exec GetUniqueID 'coll_transaction', @transaction_id output,@count,0
			-- ... we have reserved ids from:
			--		@transaction_id + @count - 1

			update b
			set b.transaction_id = assign.transaction_id		
			from #fee_offset_entry as b
			join (
				select b2.fee_id, transaction_id = @transaction_id - 1 + ( row_number() over(order by b2.fee_id) )
				from #fee_offset_entry as b2
			) as assign on
				assign.fee_id = b.fee_id
    end

	insert into coll_transaction WITH(TABLOCKX) 
	select oe.transaction_id, oe.fee_id, oe.adj_amt, 0,
	0, 0, 0, 'ADJLB', 0, 0, 0, @pacs_user_id, GETDATE(),
	@batch_id, GETDATE()
	from #fee_offset_entry as oe

	-- Update the fee table
	Update FEE	WITH(TABLOCKX) 
	set initial_amount_due = 0,
	current_amount_due = 0,
	is_active = 0,
	last_modified = GETDATE()
	where fee_id in (select fee_id from #fee_entries)

	-- update the fee_payments_due table.  Delete entries
	-- with more than one of the same bill_id
	-- First get rid of additional entries for the same bill_id
	delete from fee_payments_due WITH(TABLOCKX) 
	where fee_payment_id > 0
	and fee_id in (select  fee_id from #fee_offset_entry)

	-- Now set those values to zero
	update fee_payments_due WITH(TABLOCKX) 
	set amount_due = 0
	where fee_id in (select  fee_id from #fee_offset_entry)

	select @count = count(fa.fee_id)
	from fee_adjustment fa (nolock) 
	join #fee_offset_entry oe on fa.fee_id = oe.fee_id
	where fa.fee_id in (select fee_id from #fee_offset_entry)

	declare @fee_adj_id int

	if @count > 0
	begin
		exec GetUniqueID 'fee_adjustment', @fee_adj_id output, @count, 0

		update b
		set b.fee_adj_id = assign.fee_adj_id		
		from #fee_offset_entry as b
		join (
			select b2.fee_id, fee_adj_id = @fee_adj_id - 1 + ( row_number() over(order by b2.fee_id) )
			from fee_adjustment ba (nolock) 
			join #fee_offset_entry b2 on ba.fee_id = b2.fee_id
			where ba.fee_id in (select fee_id from #fee_offset_entry)
		) as assign on
			assign.fee_id = b.fee_id
	end

	-- Update fee_adjustment table.
	-- will have a transaction_id from coll_transaction
	-- previous and current amount
	insert into fee_adjustment WITH(TABLOCKX) 
	(fee_adj_id, fee_id, batch_id, 
		modify_cd, modify_reason, 
		previous_base_amount, base_amount, transaction_id, pacs_user_id )
	select distinct oe.fee_adj_id
		,oe.fee_id, @batch_id, 
		'UNDO_LEVY', 'Levy Bill reversal due to Levy Certification Undo', 
		 oe.adj_amt * -1, 0, oe.transaction_id, @pacs_user_id
	from #fee_offset_entry as oe
	join fee_adjustment fa (nolock) on fa.fee_id = oe.fee_id
	where fa.fee_id in (select fee_id from #fee_offset_entry)

	-- logging end of step 
--	SELECT @LogTotRows = @@ROWCOUNT, 
--		   @LogErrCode = @@ERROR 
--	   SET @LogStatus =  'Step 2 End: Offsetting entries for fees: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
--	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	-----------------------------------------------------------------------------
	--                    Updates for other tables
	-----------------------------------------------------------------------------
	-- logging start of step 
--	SELECT @LogTotRows = @@ROWCOUNT, 
--		   @LogErrCode = @@ERROR 
--	   SET @LogStatus =  'Step 3 Start: Update sup_group, levy_bill, levy_cert_run, levy_cert_reset_history: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
--	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

	update sup_group set 
		sup_bill_create_dt = null,
		sup_bills_created_by_id = null,
		status_cd = 'A',
		sup_bill_status = null,
		sup_bills_batch_id = null
	from sup_group
	where sup_group_id in 
		(	select sup_group_id
			from supplement s
			where s.sup_tax_yr = @year)
	and sup_group_id not in 
		(	select sup_group_id
			from supplement
			where sup_tax_yr <> @year) and
		isNull(status_cd, 'C') = 'BC'

	update levy_bill WITH(TABLOCKX) 
	set taxable_val = 0
	where bill_id in (select bill_id from #bill_offset_entry)
	and year = @year;

	update levy_cert_run 
		set
		bills_created_date = null,
		bills_created_by_id = null,
		bills_activated_date = null,
		bills_activated_by_id = null,
		accepted_date = null,
		accepted_by_id = null,
		updated_date = null,
		updated_by_id = null,
		[status] = 'Coding'
	where	levy_cert_run_id = @levy_cert_run_id

	-- Set the certification_date field in the levy table to null.
	update levy
	set certification_date = null
	from dbo.levy_cert_run_detail lcrd (nolock)
	join levy on levy.levy_cd = lcrd.levy_cd
		and levy.year = lcrd.year
		and lcrd.year = @year
		and lcrd.levy_cert_run_id = @levy_cert_run_id

	-- Update the end date in the history table
	update levy_cert_reset_history
	set stop_dt = GETDATE()
	where levy_cert_run_id = @levy_cert_run_id
	and [year] = @year
	
	-- logging end of step 
--	SELECT @LogTotRows = @@ROWCOUNT, 
--		   @LogErrCode = @@ERROR 
--	   SET @LogStatus =  'Step 3 End Total Duration in seconds: ' + convert(varchar(30),datediff(s,@StartStep,getdate()))
--	exec dbo.CurrentActivityLogInsert @proc,@LogStatus,@LogTotRows,@LogErrCode 

COMMIT TRANSACTION UndoLevyCert

drop table #fee_entries
drop table #fee_offset_entry
drop table #bill_entries
drop table #bill_offset_entry

quit:
	select @return_message as return_message
	set nocount off

-- end of procedure update log
SET @qry = @qry + convert(varchar(30),datediff(s,@StartProc,getdate()))
exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR

GO


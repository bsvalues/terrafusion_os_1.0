
CREATE procedure BatchCloseDay
	@balance_date datetime,
	@pacs_user_id int,
	@close_date datetime
as

-- copy records from coll_transaction to posted_coll_transaction
-- for batch records whose close_dt is null
insert into posted_coll_transaction (
	transaction_id, trans_group_id, base_amount, base_amount_pd,
	penalty_amount_pd, interest_amount_pd, bond_interest_pd, transaction_type,
	underage_amount_pd, overage_amount_pd, other_amount_pd, 
	pacs_user_id, transaction_date, posted_date, effective_date, recorded_date, is_reopen ) 
select
	ct.transaction_id, ct.trans_group_id, ct.base_amount, isnull(ct.base_amount_pd, 0),
	isnull(ct.penalty_amount_pd, 0), isnull(ct.interest_amount_pd, 0), 
	isnull(ct.bond_interest_pd, 0), isnull(ct.transaction_type, 0),
	isnull(ct.underage_amount_pd, 0), isnull(ct.overage_amount_pd, 0), 
	isnull(ct.other_amount_pd, 0), ct.pacs_user_id, ct.transaction_date, 
	@close_date, b.balance_dt, getdate(), 0
from coll_transaction as ct with (nolock)
join batch as b with (nolock) on 
		b.batch_id = ct.batch_id
where b.balance_dt = @balance_date
and b.close_dt is null


-- deal with bills that are *not* part of an annexation and with bills that *are* part 
-- of an annexation whose transactions are *not* associated with any annexation adjustments 
insert into levy_bill_transaction_assoc 
(posted_transaction_id, fund_id)
select 
	pct.posted_transaction_id, f.fund_id
from posted_coll_transaction as pct with (nolock)
join coll_transaction as ct with (nolock) on
		ct.transaction_id = pct.transaction_id
join batch with (nolock) on
		batch.batch_id = ct.batch_id
join bill as b with (nolock) on
		b.bill_id = pct.trans_group_id
join levy_bill as lb with (nolock) on 
		lb.bill_id = b.bill_id
join tax_area_fund_assoc as tafa with (nolock) on
		tafa.[year] = lb.[year]
	and tafa.tax_district_id = lb.tax_district_id
	and tafa.levy_cd = lb.levy_cd
	and tafa.tax_area_id = 
					dbo.fn_GetCurrentTaxAreaID(b.prop_id, b.[year], pct.effective_date, b.sup_num)
join fund as f with (nolock) on
		f.[year] = tafa.[year]
	and f.tax_district_id = tafa.tax_district_id
	and f.levy_cd = tafa.levy_cd
	and f.fund_id = tafa.fund_id
	and pct.effective_date >= convert(datetime, convert(varchar, f.begin_date, 101), 101)
	and (
			f.end_date is null 
		 or pct.effective_date < dateadd(day, 1, convert(datetime, convert(varchar, f.end_date, 101), 101))
		)
where pct.transaction_id 
	not in (
		select transaction_id 
		from bill_adjustment (nolock)
		where annexation_adjustment = 1 
	)
and pct.effective_date = @balance_date
and pct.posted_transaction_id not in (select posted_transaction_id from levy_bill_transaction_assoc)
and batch.close_dt is null


-- deal with transactions that *are* part of an annexation adjustment
-- that occurred on the balance date specified
insert into levy_bill_transaction_assoc (posted_transaction_id, fund_id)
select 
	pct.posted_transaction_id, f.fund_id
from posted_coll_transaction as pct with (nolock)
join coll_transaction as ct with (nolock) on
		ct.transaction_id = pct.transaction_id
join batch with (nolock) on
		batch.batch_id = ct.batch_id
join bill as b with (nolock) on
		b.bill_id = pct.trans_group_id
join levy_bill as lb with (nolock) on 
		lb.bill_id = b.bill_id
join (
	-- match the transactions from annexation bill_adjustment records
	-- to get the old and new tax areas involved
	select 
		min(pct.transaction_id) as transaction_id,
		pct.trans_group_id, 
		pct.effective_date, 
		-- if an annexation occurred today, then we need the tax area on the property as of yesterday
		-- associated with the min(transaction_id) for the trans_group_id
		dbo.fn_GetCurrentTaxAreaID(b.prop_id, b.[year], dateadd(day,-1,pct.effective_date), b.sup_num) as tax_area_id
	from posted_coll_transaction as pct with (nolock)
	join bill as b with (nolock) on 
			b.bill_id = pct.trans_group_id
	join bill_adjustment as ba with (nolock) on
		ba.transaction_id = pct.transaction_id
	where	ba.annexation_adjustment = 1
		and pct.effective_date = @balance_date
	group by 
		b.prop_id, b.[year], pct.trans_group_id, pct.effective_date, b.sup_num
	union 
	select 
		max(pct.transaction_id) as transaction_id,
		pct.trans_group_id, 
		pct.effective_date, 
		-- if an annexation occurred today, then we need the tax area on the property as of today
		-- associated with the max(transaction_id) for the trans_group_id
		dbo.fn_GetCurrentTaxAreaID(b.prop_id, b.[year], pct.effective_date, b.sup_num) as tax_area_id
	from posted_coll_transaction as pct with (nolock)
	join bill as b with (nolock) on 
			b.bill_id = pct.trans_group_id
	join bill_adjustment as ba with (nolock) on
		ba.transaction_id = pct.transaction_id
	where	ba.annexation_adjustment = 1
		and pct.effective_date = @balance_date
	group by 
		b.prop_id, b.[year], pct.trans_group_id, pct.effective_date, b.sup_num
) as annexation_adjustments_tax_area on
	annexation_adjustments_tax_area.transaction_id = pct.transaction_id
join tax_area_fund_assoc as tafa with (nolock) on
		tafa.[year] = lb.[year]
	and tafa.tax_district_id = lb.tax_district_id
	and tafa.levy_cd = lb.levy_cd
	and tafa.tax_area_id = annexation_adjustments_tax_area.tax_area_id
join fund as f with (nolock) on
		f.[year] = tafa.[year]
	and f.tax_district_id = tafa.tax_district_id
	and f.levy_cd = tafa.levy_cd
	and f.fund_id = tafa.fund_id
	and pct.effective_date >= convert(datetime, convert(varchar, f.begin_date, 101), 101)
	and (
			f.end_date is null 
		 or pct.effective_date < dateadd(day, 1, convert(datetime, convert(varchar, f.end_date, 101), 101))
		)
where pct.effective_date = @balance_date
and pct.posted_transaction_id not in (select posted_transaction_id from levy_bill_transaction_assoc)
and batch.close_dt is null


-- update batches whose balance date is the date specified
update batch
set close_dt = @close_date 
where balance_dt = @balance_date
and close_dt is null


-- insert a record into batch_close_day
insert into batch_close_day (balance_dt, close_by_id, close_dt)
values (@balance_date, @pacs_user_id, @close_date)


-- log message in history table 
declare @message varchar(100)
declare @pacs_user_name varchar(50)
declare @str_close_date varchar(20)
declare @str_balance_date varchar(30)
select @pacs_user_name = pacs_user_name
from pacs_user with (nolock)
where pacs_user_id = @pacs_user_id

set @str_close_date = convert(varchar, @close_date, 102)
set @str_balance_date = convert(varchar, @balance_date, 102)

set @message = 'Closed by user: ' + @pacs_user_name + ' on ' + @str_close_date
exec BatchInsertHistory  'CD', @message, @pacs_user_id, @str_balance_date

GO


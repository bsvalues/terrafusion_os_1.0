
create procedure [dbo].[BatchReopenBatch]
	@batch_id int,
	@pacs_user_id int
as

begin try
	begin tran

	-- capture the latest posted_transaction_id for each transaction_id
	-- prior to adding new posted_coll_transaction records
	select 
		pct.transaction_id, 
		max(pct.posted_transaction_id) as posted_transaction_id
	into #temp
	from posted_coll_transaction as pct with (nolock)
	join coll_transaction as ct with (nolock) on
		ct.transaction_id = pct.transaction_id
	where ct.batch_id = @batch_id
	group by pct.transaction_id


	-- reverse the posted_coll_transaction records associated with the batch
	declare @reopen_date datetime
	set @reopen_date = getdate()

	insert into posted_coll_transaction (
		transaction_id, trans_group_id, transaction_type,
		base_amount, 
		base_amount_pd,
		penalty_amount_pd, 
		interest_amount_pd, 
		bond_interest_pd, 
		underage_amount_pd, 
		overage_amount_pd, 
		other_amount_pd, 
		pacs_user_id, transaction_date, posted_date, effective_date, is_reopen ) 
	select
		pct.transaction_id, pct.trans_group_id, pct.transaction_type,
		-1 * sum(pct.base_amount), 
		-1 * sum(pct.base_amount_pd),
		-1 * sum(pct.penalty_amount_pd), 
		-1 * sum(pct.interest_amount_pd), 
		-1 * sum(pct.bond_interest_pd), 
		-1 * sum(pct.underage_amount_pd), 
		-1 * sum(pct.overage_amount_pd), 
		-1 * sum(pct.other_amount_pd), 
		@pacs_user_id, @reopen_date, @reopen_date, pct.effective_date, 1
	from posted_coll_transaction as pct with (nolock)
	join coll_transaction as ct with (nolock) on
			ct.transaction_id = pct.transaction_id
	join batch as b with (nolock) on 
			b.batch_id = ct.batch_id
	where b.batch_id = @batch_id
	group by 
		pct.transaction_id, pct.trans_group_id, pct.transaction_type, pct.effective_date


	-- create reversing levy_bill_transaction_assoc records
	insert into levy_bill_transaction_assoc 
		(posted_transaction_id, fund_id)
	select 
		max(pct.posted_transaction_id) as posted_transaction_id,
		lbta.fund_id
	from #temp as tmp 
	join posted_coll_transaction as pct with (nolock) on
			pct.transaction_id = tmp.transaction_id
	join levy_bill_transaction_assoc as lbta with (nolock) on
			lbta.posted_transaction_id = tmp.posted_transaction_id
	group by tmp.posted_transaction_id, lbta.fund_id

	drop table #temp

		
	-- null the close date of the batch
	update batch 
	set close_dt = null
	where batch_id = @batch_id

	commit tran
end try
begin catch
	rollback tran
end catch

GO


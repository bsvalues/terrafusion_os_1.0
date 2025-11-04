
create procedure AdjustPACollectionFeesForPayment
	@payment_id int,
	@pacs_user_id int,
	@batch_id int
as

-- Select the payout agreements that were affected by the payment, and
-- are active and have a collection fee

declare @agreements table
(
	payout_agreement_id int,
	collection_fee_annual_amount numeric(14,2),
	collection_fee_id int,
	change bit,
	total_change_amount numeric(14,2)
)

insert @agreements
(payout_agreement_id, collection_fee_annual_amount, collection_fee_id,
	change, total_change_amount)
select payout_agreement_id, collection_fee_annual_amount, collection_fee_id, 0, 0

from payout_agreement pa with(nolock)

where pa.payout_agreement_id in
(
	select paba.payout_agreement_id
	from payment_transaction_assoc pta with(nolock)

	join coll_transaction ct with(nolock)
	on ct.transaction_id = pta.transaction_id

	join payout_agreement_bill_assoc paba with(nolock)
	on paba.bill_id = ct.trans_group_id

	where payment_id = @payment_id 

	UNION

	select f.payout_agreement_id
	from payment_transaction_assoc pta with(nolock)

	join coll_transaction ct with(nolock)
	on ct.transaction_id = pta.transaction_id

	join fee f with(nolock)
	on f.fee_id = ct.trans_group_id

	where payment_id = @payment_id 
	and f.payout_agreement_id is not null
)

and pa.collection_fee_id is not null
and pa.status_cd = 'A'


-- get the current and corrected balance for each collection fee payment

declare @collection_fee_payments table
(
	payout_agreement_id int,
	fee_id int,
	fee_payment_id int,
	due_date datetime,
	year numeric(4,0),
	current_balance numeric(14,2),
	billfee_balance numeric(14,2),
	is_paid bit,
	correct_balance numeric(14,2),
	change bit,
	change_amount numeric(14,2)
)


insert @collection_fee_payments
(payout_agreement_id, fee_id, fee_payment_id, due_date, year, current_balance, 
	billfee_balance, is_paid, correct_balance, change, change_amount)
select a.payout_agreement_id, fpd.fee_id, fpd.fee_payment_id, 
	fpd.due_date, datepart(year, fpd.due_date) year, (fpd.amount_due - fpd.amount_paid) current_balance, 
	0, 0, 0, 0, 0

from @agreements a

join fee f with(nolock)
on f.payout_agreement_id = a.payout_agreement_id
and f.fee_id = a.collection_fee_id

join fee_payments_due fpd with(nolock)
on f.fee_id = fpd.fee_id
and fpd.is_payout_payment = 1



update cfp
set billfee_balance = billfee.balance,
	is_paid = case when billfee.balance > 0 then 0 else 1 end

from @collection_fee_payments cfp
join
(
select payout_agreement_id, fee_payment_id, SUM(balance) balance
from
(
	select cfp.payout_agreement_id, cfp.fee_payment_id, bpd.amount_due - bpd.amount_paid balance
	from @collection_fee_payments cfp

	join payout_agreement_bill_assoc paba with(nolock)
	on cfp.payout_agreement_id = paba.payout_agreement_id

	join bill_payments_due bpd with(nolock)
	on bpd.bill_id = paba.bill_id
	and bpd.due_date = cfp.due_date

	UNION ALL

	select cfp.payout_agreement_id, cfp.fee_payment_id, fpd.amount_due - fpd.amount_paid balance
	from @collection_fee_payments cfp

	join fee f with(nolock)
	on f.payout_agreement_id = cfp.payout_agreement_id
	and f.fee_id <> cfp.fee_id

	join fee_payments_due fpd with(nolock)
	on fpd.fee_id = f.fee_id
	and fpd.due_date = cfp.due_date
)q
group by payout_agreement_id, fee_payment_id
)billfee
on cfp.payout_agreement_id = billfee.payout_agreement_id
and cfp.fee_payment_id = billfee.fee_payment_id


update cfp
set correct_balance = case when is_paid = 1 then 0 else isnull(scheduled_fee_amount, current_balance) end
from @collection_fee_payments cfp

outer apply
(
	select top 1 collection_fee_amount scheduled_fee_amount
	from payout_agreement_schedule pas with(nolock)
	where pas.payout_agreement_id = cfp.payout_agreement_id
	and pas.due_date = cfp.due_date
) sch


update @collection_fee_payments
set change = case when current_balance <> correct_balance then 1 else 0 end,
	change_amount = correct_balance - current_balance

update a
set total_change_amount = (
	select SUM(change_amount) 
	from @collection_fee_payments cfp 
	where cfp.payout_agreement_id = a.payout_agreement_id
)
from @agreements a

update @agreements
set change = case when total_change_amount <> 0 then 1 else 0 end


-- modify the marked fees
declare pa_cursor cursor forward_only for
select payout_agreement_id, collection_fee_id, total_change_amount
from @agreements
where change = 1

declare @payout_agreement_id int
declare @collection_fee_id int
declare @total_change_amount numeric(14,2)
declare @transaction_id int
declare @fee_adj_id int

open pa_cursor
fetch next from pa_cursor into @payout_agreement_id, @collection_fee_id, @total_change_amount

while @@FETCH_STATUS = 0
begin
	-- create a modify fee transaction
	exec dbo.GetUniqueID 'coll_transaction', @transaction_id output, 1
	
	insert coll_transaction
	(transaction_id, trans_group_id, base_amount, transaction_type, 
		pacs_user_id, transaction_date, batch_id)
	select @transaction_id, @collection_fee_id, @total_change_amount, 'ADJF',
		@pacs_user_id, GETDATE(), @batch_id
	
	-- create a fee adjustment record
	exec GetUniqueID 'fee_adjustment', @fee_adj_id output, 1

	insert fee_adjustment
	(fee_adj_id, fee_id, transaction_id, modify_reason,
		previous_effective_due_dt, effective_due_dt, bill_calc_type_cd,
		previous_base_amount, base_amount, batch_id,
		previous_payment_status_type_cd, payment_status_type_cd, adjustment_date, pacs_user_id)
	
	select @fee_adj_id, @collection_fee_id, @transaction_id, 'Automatic collection fee update',
		f.effective_due_date, f.effective_due_date, 'MN',
		f.current_amount_due, f.current_amount_due + @total_change_amount, @batch_id,
		f.payment_status_type_cd, f.payment_status_type_cd, GETDATE(), @pacs_user_id
	from fee f with(nolock)
	where f.fee_id = @collection_fee_id

	-- update the fee record
	update fee
	set current_amount_due = current_amount_due + @total_change_amount,
		last_modified = GETDATE()
	where fee_id = @collection_fee_id

	-- update the fee payments due records
	update fpd
	set amount_due = amount_due + cfp.change_amount
	from fee_payments_due fpd with(nolock)
	join @collection_fee_payments cfp 
	on cfp.payout_agreement_id = @payout_agreement_id
	and cfp.fee_id = fpd.fee_id
	and cfp.fee_payment_id = fpd.fee_payment_id
	where cfp.change = 1

	fetch next from pa_cursor into @payout_agreement_id, @collection_fee_id, @total_change_amount
end

close pa_cursor
deallocate pa_cursor

GO


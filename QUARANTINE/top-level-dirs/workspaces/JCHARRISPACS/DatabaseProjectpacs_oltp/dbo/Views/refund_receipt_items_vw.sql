
create view refund_receipt_items_vw as

select rta.refund_id, rta.year, 
case when rt.core_refund_type = 1 then null else rta.year+1 end as display_year, 
p.prop_id, isnull(p.col_owner_id, r.account_id) as taxpayer_id, 
isnull(owner_account.file_as_name, r.refund_to_name) as owner_name,
ma2.loan_number, 
case when isnull(oc.description, '') <> '' then oc.description else rt.refund_reason end as reason,

 -sum(	isnull(pending_refund_trans.base_amount_pd,0) + 
		isnull(pending_refund_trans.interest_amount_pd,0) +
		isnull(pending_refund_trans.penalty_amount_pd,0) +
		isnull(pending_refund_trans.other_amount_pd,0) +

		isnull(refund_trans.base_amount_pd,0) + 
		isnull(refund_trans.interest_amount_pd,0) +
		isnull(refund_trans.penalty_amount_pd,0) +
		isnull(refund_trans.other_amount_pd,0)) 

as refund_amount

from refund_transaction_assoc rta

join refund r 
on r.refund_id = rta.refund_id

left outer join property p
on p.prop_id = rta.prop_id

left outer join account owner_account
on owner_account.acct_id = p.col_owner_id

outer apply (
	select top 1 ltrim(rtrim(mortgage_acct_id)) mortgage_acct_id
	from mortgage_assoc ma_sub
	where ma_sub.prop_id = p.prop_id
	and ma_sub.mortgage_acct_id is not null
) ma

outer apply (
	-- Loan number: if the account ID is numeric, strip leading zeros
	select case when mortgage_acct_id is null or isnumeric(mortgage_acct_id) = 0 then mortgage_acct_id
	else substring(mortgage_acct_id, patindex('%[^0]%', mortgage_acct_id + '.'), len(mortgage_acct_id))
	end loan_number
) ma2

left outer join refund_type rt
on rt.refund_type_cd = rta.refund_type_cd
and rt.year = rta.refund_type_year

left outer join coll_transaction refund_trans
on refund_trans.transaction_id = rta.transaction_id

left outer join pending_coll_transaction pending_refund_trans
on pending_refund_trans.pending_transaction_id = rta.transaction_id

left outer join overpayment_credit oc
on oc.overpmt_credit_id = refund_trans.trans_group_id

group by rta.refund_id, rt.core_refund_type, rta.year, p.prop_id, p.col_owner_id, 
	owner_account.file_as_name, ma2.loan_number, rt.refund_reason, oc.description, 
	r.account_id, r.refund_to_name

GO


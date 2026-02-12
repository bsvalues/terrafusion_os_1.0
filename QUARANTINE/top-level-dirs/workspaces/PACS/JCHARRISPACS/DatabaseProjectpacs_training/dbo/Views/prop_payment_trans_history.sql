
create view [dbo].[prop_payment_trans_history]
as

SELECT 
	'Property Taxes' as display_type,
	bill.prop_id,
	bill.year,
	bill.sup_num,
	bill.owner_id,
	bill.statement_id,
	acct.file_as_name,
	td.tax_district_desc as title,
	ct.base_amount_pd + ct.penalty_amount_pd + ct.interest_amount_pd + ct.bond_interest_pd + ct.other_amount_pd as amount,
	ct.underage_amount_pd,
	ct.overage_amount_pd,
	ct.base_amount_pd,
	ct.penalty_amount_pd,
	ct.interest_amount_pd + ct.bond_interest_pd as interest_amount_pd
FROM bill with(nolock)
JOIN levy_bill as lb with(nolock)
ON bill.bill_id = lb.bill_id
JOIN account as acct with(nolock)
ON bill.owner_id = acct.acct_id
JOIN tax_district as td with(nolock)
ON td.tax_district_id = lb.tax_district_id
JOIN coll_transaction as ct with(nolock)
ON ct.trans_group_id = bill.bill_id
JOIN transaction_type as tt with(nolock)
ON ct.transaction_type = tt.transaction_type
AND tt.core_transaction_type = 2	

UNION

SELECT 
	'Special Assessments' as display_type,
	bill.prop_id,
	bill.year,
	bill.sup_num,
	bill.owner_id,
	bill.statement_id,
	acct.file_as_name,
	saa.assessment_description as title,
	ct.base_amount_pd + ct.penalty_amount_pd + ct.interest_amount_pd + ct.bond_interest_pd + ct.other_amount_pd as amount,
	ct.underage_amount_pd,
	ct.overage_amount_pd,
	ct.base_amount_pd,
	ct.penalty_amount_pd,
	ct.interest_amount_pd + ct.bond_interest_pd as interest_amount_pd
FROM bill with(nolock)
JOIN assessment_bill as ab with(nolock)
ON bill.bill_id = ab.bill_id
JOIN account as acct with(nolock)
ON bill.owner_id = acct.acct_id
JOIN special_assessment_agency as saa with(nolock)
ON saa.agency_id = ab.agency_id
JOIN coll_transaction as ct with(nolock)
ON ct.trans_group_id = bill.bill_id
JOIN transaction_type as tt with(nolock)
ON ct.transaction_type = tt.transaction_type
AND tt.core_transaction_type = 2	

UNION

SELECT 
	'Fees' as display_type,
	fpa.prop_id,
	fee.year,
	0 as sup_num,
	fee.owner_id,
	fee.statement_id,
	acct.file_as_name,
	ft.fee_type_desc as title,
	ct.base_amount_pd + ct.penalty_amount_pd + ct.interest_amount_pd + ct.bond_interest_pd + ct.other_amount_pd as amount,
	ct.underage_amount_pd,
	ct.overage_amount_pd,
	ct.base_amount_pd,
	ct.penalty_amount_pd,
	ct.interest_amount_pd + ct.bond_interest_pd as interest_amount_pd
FROM fee with(nolock)
JOIN fee_prop_assoc as fpa with(nolock)
ON fpa.fee_id = fee.fee_id
JOIN fee_type as ft with(nolock)
ON ft.fee_type_cd = fee.fee_type_cd
JOIN account as acct with(nolock)
ON fee.owner_id = acct.acct_id
JOIN coll_transaction as ct with(nolock)
ON ct.trans_group_id = fee.fee_id
JOIN transaction_type as tt with(nolock)
ON ct.transaction_type = tt.transaction_type
AND tt.core_transaction_type = 2	

UNION

SELECT 
	'Escrow' as display_type,
	esc.prop_id,
	esc.year,
	0 as sup_num,
	esc.owner_id,
	esc.escrow_id,
	acct.file_as_name,
	etc.escrow_type_desc as title,
	ct.base_amount_pd + ct.penalty_amount_pd + ct.interest_amount_pd + ct.bond_interest_pd + ct.other_amount_pd as amount,
	ct.underage_amount_pd,
	ct.overage_amount_pd,
	ct.base_amount_pd,
	ct.penalty_amount_pd,
	ct.interest_amount_pd + ct.bond_interest_pd as interest_amount_pd
FROM escrow as esc with(nolock)
JOIN account as acct with(nolock)
ON esc.owner_id = acct.acct_id
JOIN escrow_type_code as etc with(nolock)
ON etc.escrow_type_cd = esc.escrow_type_cd
JOIN coll_transaction as ct with(nolock)
ON ct.trans_group_id = esc.escrow_id
JOIN transaction_type as tt with(nolock)
ON ct.transaction_type = tt.transaction_type
AND tt.core_transaction_type = 2	

UNION

SELECT 
	'Overpayment Credit' as display_type,
	oc.prop_id,
	0 as year,
	0 as sup_num,
	0.owner_id,
	oc.overpmt_credit_id,
	'' as file_as_name,
	'' as title,
	ct.base_amount_pd + ct.penalty_amount_pd + ct.interest_amount_pd + ct.bond_interest_pd + ct.other_amount_pd as amount,
	ct.underage_amount_pd,
	ct.overage_amount_pd,
	ct.base_amount_pd,
	ct.penalty_amount_pd,
	ct.interest_amount_pd + ct.bond_interest_pd as interest_amount_pd
FROM overpayment_credit as oc with(nolock)
JOIN coll_transaction as ct with(nolock)
ON ct.trans_group_id = oc.overpmt_credit_id
JOIN transaction_type as tt with(nolock)
ON ct.transaction_type = tt.transaction_type
AND tt.core_transaction_type = 2

GO


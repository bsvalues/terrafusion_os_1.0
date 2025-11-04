CREATE view [dbo].[payment_receipt_transaction_rollup_vw]

as

SELECT pta.payment_id
,'Property Taxes' AS object_type
,1 as sort_order
,b.prop_id
,b.[year]
,b.statement_id 
,sum(t.base_amount_pd) AS base_amount
,sum(t.interest_amount_pd + t.bond_interest_pd + t.other_amount_pd) as interest
,sum(t.penalty_amount_pd) as penalty
,sum(t.base_amount_pd + t.interest_amount_pd + t.bond_interest_pd + t.other_amount_pd +
     t.penalty_amount_pd) as amount_paid
, NULL AS ExciseNumber
FROM bill b WITH (NOLOCK)
   JOIN levy_bill lb WITH (NOLOCK)
    ON lb.bill_id = b.bill_id
  JOIN coll_transaction t WITH (NOLOCK)
    ON t.trans_group_id = b.bill_id
  JOIN payment_transaction_assoc pta WITH (NOLOCK)
    ON t.transaction_id = pta.transaction_id
GROUP BY payment_id, b.prop_id, b.year, b.statement_id

UNION ALL 

SELECT pta.payment_id
,'Special Assessments' AS object_type
,2 as sort_order
,b.prop_id
,b.[year]
,b.statement_id 
,sum(t.base_amount_pd) AS base_amount
,sum(t.interest_amount_pd + t.bond_interest_pd + t.other_amount_pd) as interest
,sum(t.penalty_amount_pd) penalty
,sum(t.base_amount_pd + t.interest_amount_pd + t.bond_interest_pd + t.other_amount_pd +
     t.penalty_amount_pd) as amount_paid
, NULL AS ExciseNumber
FROM bill b WITH (NOLOCK)
   JOIN assessment_bill ab WITH (NOLOCK)
    ON ab.bill_id = b.bill_id
  JOIN coll_transaction t WITH (NOLOCK)
    ON t.trans_group_id = b.bill_id
  JOIN payment_transaction_assoc pta WITH (NOLOCK)
    ON t.transaction_id = pta.transaction_id
GROUP BY pta.payment_id, b.prop_id, b.year, b.statement_id

UNION ALL

SELECT pta.payment_id
,object_type = 'Fee - ' + case 
	when isnull(pta.treasurer_rcpt_number, '') <> '' then 
		f.fee_type_cd + ': ' + convert(varchar, pta.treasurer_rcpt_number)
	else
		f.fee_type_cd
	end
,3 as sort_order
,fpv.prop_id
,f.year
,f.statement_id
,sum(t.base_amount_pd) AS base_amount
,sum(t.interest_amount_pd + t.bond_interest_pd + t.other_amount_pd) as interest
,sum(t.penalty_amount_pd) as penalty
,sum(t.base_amount_pd + t.interest_amount_pd + t.bond_interest_pd + t.other_amount_pd +
     t.penalty_amount_pd) as amount_paid
, NULL AS ExciseNumber
FROM fee_property_vw fpv WITH (NOLOCK)
  JOIN fee f WITH (NOLOCK)
    ON f.fee_id = fpv.fee_id
  JOIN coll_transaction t WITH (NOLOCK)
    ON t.trans_group_id = f.fee_id
  JOIN payment_transaction_assoc pta WITH (NOLOCK)
    ON t.transaction_id = pta.transaction_id
where 
	---- exclude Non-Taxable REET Fees
	not exists 
	(select * from reet r WITH (NOLOCK)
		JOIN reet_type_code rtc WITH (NOLOCK)
			ON rtc.reet_type_cd = r.reet_type_cd and rtc.taxable = 0
		JOIN reet_fee_assoc rfa WITH (NOLOCK)
			ON rfa.reet_id = r.reet_id
		where rfa.fee_id = f.fee_id)    
GROUP BY pta.payment_id, 'Fee - ' + case 
	when isnull(pta.treasurer_rcpt_number, '') <> '' then 
		f.fee_type_cd + ': ' + convert(varchar, pta.treasurer_rcpt_number)
	else
		f.fee_type_cd
	end, fpv.prop_id, f.year, f.statement_id

UNION ALL

SELECT pta.payment_id
,object_type = 'Fee - ' + case 
	when isnull(pta.treasurer_rcpt_number, '') <> '' then 
		f.fee_type_cd + ': ' + convert(varchar, pta.treasurer_rcpt_number)
	else
		f.fee_type_cd
	end
,3 as sort_order
,null as prop_id
,f.year
,f.statement_id
,sum(t.base_amount_pd) AS base_amount
,sum(t.interest_amount_pd + t.bond_interest_pd + t.other_amount_pd) as interest
,sum(t.penalty_amount_pd) penalty
,sum(t.base_amount_pd + t.interest_amount_pd + t.bond_interest_pd + t.other_amount_pd +
     t.penalty_amount_pd) as amount_paid
, NULL AS ExciseNumber
FROM fee f WITH (NOLOCK)
  JOIN coll_transaction t WITH (NOLOCK)
    ON t.trans_group_id = f.fee_id
  JOIN payment_transaction_assoc pta WITH (NOLOCK)
    ON t.transaction_id = pta.transaction_id
where not exists (select * from fee_property_vw fpv
			      where fpv.fee_id = f.fee_id)
GROUP BY pta.payment_id, 'Fee - ' + case 
	when isnull(pta.treasurer_rcpt_number, '') <> '' then 
		f.fee_type_cd + ': ' + convert(varchar, pta.treasurer_rcpt_number)
	else
		f.fee_type_cd
	end, f.year, f.statement_id
	
	
------ Non-Taxable REET FEES ------------------------
UNION ALL

SELECT pta.payment_id
,object_type = 'Fee - ' + 
case 
	when ISNULL(r.excise_number, '') <> '' then 
		f.fee_type_cd + ': ' + convert(varchar, r.excise_number)
	else
		f.fee_type_cd
	end
,3 as sort_order
,(select top 1 prop_id from property_reet_assoc where reet_id = r.reet_id) as prop_id
,f.year
,f.statement_id
,sum(t.base_amount_pd) AS base_amount
,sum(t.interest_amount_pd + t.bond_interest_pd + t.other_amount_pd) as interest
,sum(t.penalty_amount_pd) as penalty
,sum(t.base_amount_pd + t.interest_amount_pd + t.bond_interest_pd + t.other_amount_pd +
     t.penalty_amount_pd) as amount_paid
, r.excise_number AS ExciseNumber
FROM fee f WITH (NOLOCK)
JOIN coll_transaction t WITH (NOLOCK)
	ON t.trans_group_id = f.fee_id
JOIN payment_transaction_assoc pta WITH (NOLOCK)
	ON t.transaction_id = pta.transaction_id
JOIN reet r with (NOLOCK)
	ON pta.payment_id = r.payment_id 
JOIN reet_fee_assoc fra WITH (NOLOCK)
	ON fra.fee_id = f.fee_id and fra.reet_id = r.reet_id 
JOIN reet_type_code rtc WITH (NOLOCK)
	ON rtc.reet_type_cd = r.reet_type_cd and rtc.taxable = 0
GROUP BY pta.payment_id, r.reet_id,
	'Fee - ' + 
	case 
	when ISNULL(r.excise_number, '') <> '' then 
		f.fee_type_cd + ': ' + convert(varchar, r.excise_number)
	else
		f.fee_type_cd
	end,
	r.excise_number,
	prop_id, f.year, f.statement_id
------------------------
	

UNION ALL

SELECT pta.payment_id
,'Escrow' AS object_type
,4 as sort_order
,escrow.prop_id
,escrow.[year]
,NULL AS statement_id
,sum(t.base_amount_pd) AS base_amount
,sum(t.interest_amount_pd + t.bond_interest_pd) as interest
,sum(t.penalty_amount_pd) as penalty
,sum(t.base_amount_pd + t.interest_amount_pd + t.bond_interest_pd +
     t.penalty_amount_pd) as amount_paid
, NULL AS ExciseNumber
FROM escrow WITH (NOLOCK)
  JOIN coll_transaction t WITH (NOLOCK)
    ON t.trans_group_id = escrow_id
  JOIN payment_transaction_assoc pta WITH (NOLOCK)
    ON t.transaction_id = pta.transaction_id
GROUP BY pta.payment_id, escrow.prop_id, escrow.year

UNION ALL

SELECT pta.payment_id
,case when oc.acct_id is null then 'Overpayment Credit'
	else 'Overpayment Credit - Account ' + convert(varchar(20), oc.acct_id)
	end AS object_type
,5 as sort_order
,oc.prop_id
,NULL AS [year]
,NULL AS statement_id
,sum(t.base_amount_pd) AS base_amount
,sum(t.interest_amount_pd + t.bond_interest_pd) as interest
,sum(t.penalty_amount_pd) as penalty
,sum(t.base_amount_pd + t.interest_amount_pd + t.bond_interest_pd +
     t.penalty_amount_pd) as amount_paid
, NULL AS ExciseNumber
FROM overpayment_credit oc WITH (NOLOCK)
   JOIN coll_transaction t WITH (NOLOCK)
    ON t.trans_group_id = oc.overpmt_credit_id
  JOIN payment_transaction_assoc pta WITH (NOLOCK)
    ON t.transaction_id = pta.transaction_id
GROUP BY pta.payment_id, oc.prop_id, oc.acct_id

UNION ALL

SELECT pta.payment_id, 
case when r.excise_number is null
	then 'REET - ' + ISNULL(rr.rate_type_cd, '') + ' : ' + ISNULL(rr.description, '') 
	else 'REET - ' + ISNULL(rr.rate_type_cd, '') + ' : ' + ISNULL(rr.description, '') + ' : ' + ISNULL(CAST(r.excise_number AS varchar(15)), '') 
	end AS object_type
,6 as sort_order
, (select top 1 prop_id from property_reet_assoc where reet_id = r.reet_id) as prop_id
, NULL AS year
, NULL AS statement_id
,sum(t.base_amount_pd) AS base_amount
,sum(t.interest_amount_pd + t.bond_interest_pd) as interest
,sum(t.penalty_amount_pd) as penalty
,sum(t.base_amount_pd + t.interest_amount_pd + t.bond_interest_pd +
     t.penalty_amount_pd) as amount_paid
,r.excise_number AS ExciseNumber
FROM reet as r WITH (NOLOCK)
JOIN reet_tax_district_transaction as rta WITH(NOLOCK)
ON rta.reet_id = r.reet_id
join reet_rate as rr with (nolock)
on rr.reet_rate_id = rta.reet_rate_id
JOIN coll_transaction t WITH (NOLOCK)
ON t.trans_group_id = rta.trans_group_id
JOIN payment_transaction_assoc pta WITH (NOLOCK)
ON t.transaction_id = pta.transaction_id
GROUP BY pta.payment_id, r.reet_id, rr.rate_type_cd, rr.description,r.excise_number

GO


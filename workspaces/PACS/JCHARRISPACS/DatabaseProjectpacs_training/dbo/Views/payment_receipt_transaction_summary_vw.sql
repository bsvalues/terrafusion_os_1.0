CREATE view [dbo].[payment_receipt_transaction_summary_vw]

as

SELECT pta.payment_id
,'Tax District - ' + td.tax_district_desc AS object_type
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
, pta.treasurer_rcpt_number
FROM bill b WITH (NOLOCK)
   JOIN levy_bill lb WITH (NOLOCK)
    ON lb.bill_id = b.bill_id
  JOIN levy l WITH (NOLOCK)
    ON l.levy_cd = lb.levy_cd AND l.tax_district_id = lb.tax_district_id
    AND l.levy_cd = lb.levy_cd AND l.year = lb.year
  JOIN tax_district td WITH (NOLOCK)
    ON td.tax_district_id = l.tax_district_id
  JOIN coll_transaction t WITH (NOLOCK)
    ON t.trans_group_id = b.bill_id
  JOIN payment_transaction_assoc pta WITH (NOLOCK)
    ON t.transaction_id = pta.transaction_id
GROUP BY payment_id, td.tax_district_id, td.tax_district_desc,
         b.prop_id, b.year, b.statement_id, pta.treasurer_rcpt_number

UNION ALL 

SELECT pta.payment_id
,'ASMT - ' + saa.assessment_description AS object_type
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
, pta.treasurer_rcpt_number
FROM bill b WITH (NOLOCK)
   JOIN assessment_bill ab WITH (NOLOCK)
    ON ab.bill_id = b.bill_id
 JOIN special_assessment_agency saa WITH (NOLOCK)
    ON saa.agency_id = ab.agency_id 
  JOIN coll_transaction t WITH (NOLOCK)
    ON t.trans_group_id = b.bill_id
  JOIN payment_transaction_assoc pta WITH (NOLOCK)
    ON t.transaction_id = pta.transaction_id
GROUP BY pta.payment_id, saa.agency_id, saa.assessment_description,
         b.prop_id, b.year, b.statement_id, pta.treasurer_rcpt_number

--------------------
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
, pta.treasurer_rcpt_number
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
GROUP BY pta.payment_id, f.fee_type_cd, pta.treasurer_rcpt_number, fpv.prop_id, f.year, f.statement_id


------------------------
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
, pta.treasurer_rcpt_number
FROM fee f WITH (NOLOCK)
  JOIN coll_transaction t WITH (NOLOCK)
    ON t.trans_group_id = f.fee_id
  JOIN payment_transaction_assoc pta WITH (NOLOCK)
    ON t.transaction_id = pta.transaction_id
where 
	not exists 
		(select * from fee_property_vw fpv where fpv.fee_id = f.fee_id) 
GROUP BY pta.payment_id, fee_type_cd, pta.treasurer_rcpt_number, f.year, f.statement_id


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
, pta.treasurer_rcpt_number
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
GROUP BY pta.payment_id, r.reet_id, f.fee_type_cd, pta.treasurer_rcpt_number, r.excise_number, f.year, f.statement_id
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
, pta.treasurer_rcpt_number
FROM escrow WITH (NOLOCK)
  JOIN coll_transaction t WITH (NOLOCK)
    ON t.trans_group_id = escrow_id
  JOIN payment_transaction_assoc pta WITH (NOLOCK)
    ON t.transaction_id = pta.transaction_id
GROUP BY pta.payment_id, escrow.prop_id, escrow.year, pta.treasurer_rcpt_number

UNION ALL

SELECT pta.payment_id
,case when oc.acct_id is null then 'Overpayment Credit'
	else 'Overpayment Credit - Account ' + convert(varchar(20), oc.acct_id)
	end AS object_type
,5 as sort_order
,isnull(oc.prop_id, 0) prop_id
,NULL AS [year]
,NULL AS statement_id
,sum(t.base_amount_pd) AS base_amount
,sum(t.interest_amount_pd + t.bond_interest_pd) as interest
,sum(t.penalty_amount_pd) as penalty
,sum(t.base_amount_pd + t.interest_amount_pd + t.bond_interest_pd +
     t.penalty_amount_pd) as amount_paid
, NULL AS ExciseNumber
, pta.treasurer_rcpt_number
FROM overpayment_credit oc WITH (NOLOCK)
   JOIN coll_transaction t WITH (NOLOCK)
    ON t.trans_group_id = oc.overpmt_credit_id
  JOIN payment_transaction_assoc pta WITH (NOLOCK)
    ON t.transaction_id = pta.transaction_id
GROUP BY pta.payment_id, oc.prop_id, oc.acct_id, pta.treasurer_rcpt_number

UNION ALL
	SELECT     pta.payment_id, 
	case when r.excise_number is null then
		'REET - ' + ISNULL(rr.rate_type_cd, '') + ' : ' + ISNULL(rr.description, '') 
	else
	'REET - ' + ISNULL(rr.rate_type_cd, '') + ' : ' + ISNULL(rr.description, '') + ' : ' + ISNULL(CAST(r.excise_number AS varchar(15)), '') 
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
,pta.treasurer_rcpt_number 
FROM reet as r WITH (NOLOCK)
   JOIN reet_tax_district_transaction as rta WITH(NOLOCK)
	ON rta.reet_id = r.reet_id
   join reet_rate as rr with (nolock)
   on rr.reet_rate_id = rta.reet_rate_id
   JOIN coll_transaction t WITH (NOLOCK)
    ON t.trans_group_id = rta.trans_group_id
  JOIN payment_transaction_assoc pta WITH (NOLOCK)
    ON t.transaction_id = pta.transaction_id

GROUP BY pta.payment_id, r.reet_id, rr.rate_type_cd, rr.description, r.excise_number, pta.treasurer_rcpt_number

GO



CREATE view [dbo].[payment_receipt_transaction_vw]

as

 SELECT pta.payment_id, b.bill_id AS [object_id]
,'Levy - ' + l.levy_cd AS object_type
,1 as sort_order
,b.prop_id
,b.[year]
,l.levy_rate
,isNull(lb.taxable_val,0) as taxable_value
,b.statement_id, 
t.base_amount_pd AS base_amount
,t.interest_amount_pd + t.bond_interest_pd as interest
,t.penalty_amount_pd penalty
,t.base_amount_pd + t.interest_amount_pd + t.bond_interest_pd + t.penalty_amount_pd as amount_paid
FROM bill b WITH (NOLOCK)
   JOIN levy_bill lb WITH (NOLOCK)
    ON lb.bill_id = b.bill_id
  JOIN levy l WITH (NOLOCK)
    ON l.levy_cd = lb.levy_cd AND l.tax_district_id = lb.tax_district_id
    AND l.levy_cd = lb.levy_cd AND l.year = lb.year
  JOIN coll_transaction t WITH (NOLOCK)
    ON t.trans_group_id = b.bill_id
  JOIN payment_transaction_assoc pta WITH (NOLOCK)
    ON t.transaction_id = pta.transaction_id

union all 

 SELECT pta.payment_id, b.bill_id AS [object_id]
,'ASMT - ' + saa.assessment_type_cd AS object_type
,2 as sort_order
,b.prop_id
,b.[year]
,cast(NULL AS decimal(13,10)) levy_rate
,cast(NULL AS decimal(14,2)) taxable_value
,b.statement_id, 
t.base_amount_pd AS base_amount
,t.interest_amount_pd + t.bond_interest_pd as interest
,t.penalty_amount_pd penalty
,t.base_amount_pd + t.interest_amount_pd + t.bond_interest_pd + t.penalty_amount_pd as amount_paid
FROM bill b WITH (NOLOCK)
   JOIN assessment_bill ab WITH (NOLOCK)
    ON ab.bill_id = b.bill_id
 JOIN special_assessment_agency saa WITH (NOLOCK)
    ON saa.agency_id = ab.agency_id 
  JOIN coll_transaction t WITH (NOLOCK)
    ON t.trans_group_id = b.bill_id
  JOIN payment_transaction_assoc pta WITH (NOLOCK)
    ON t.transaction_id = pta.transaction_id




UNION ALL
SELECT pta.payment_id
,f.fee_id AS [object_id]
,'Fee (' + convert(varchar(10), f.fee_id) + ') - ' + f.fee_type_cd AS object_type
,3 as sort_order
,fpa.prop_id
,f.year
,cast(NULL AS decimal(13,10)) levy_rate
,cast(NULL AS decimal(14,2)) taxable_value
,f.statement_id,
t.base_amount_pd AS base_amount
,t.interest_amount_pd + t.bond_interest_pd as interest
,t.penalty_amount_pd penalty
,t.base_amount_pd + t.interest_amount_pd + t.bond_interest_pd + t.penalty_amount_pd as amount_paid

FROM fee_prop_assoc fpa WITH (NOLOCK)
  JOIN fee f WITH (NOLOCK)
    ON f.fee_id = fpa.fee_id
  JOIN coll_transaction t WITH (NOLOCK)
    ON t.trans_group_id = f.fee_id
  JOIN payment_transaction_assoc pta WITH (NOLOCK)
    ON t.transaction_id = pta.transaction_id

UNION ALL
SELECT pta.payment_id
,f.fee_id AS [object_id]
,'Fee (' + convert(varchar(10), f.fee_id) + ') - ' + f.fee_type_cd AS object_type
,3 as sort_order
,0 as prop_id
,f.year
,cast(NULL AS decimal(13,10)) levy_rate
,cast(NULL AS decimal(14,2)) taxable_value
,f.statement_id,
t.base_amount_pd AS base_amount
,t.interest_amount_pd + t.bond_interest_pd as interest
,t.penalty_amount_pd penalty
,t.base_amount_pd + t.interest_amount_pd + t.bond_interest_pd + t.penalty_amount_pd as amount_paid

FROM fee f WITH (NOLOCK)
  JOIN coll_transaction t WITH (NOLOCK)
    ON t.trans_group_id = f.fee_id
  JOIN payment_transaction_assoc pta WITH (NOLOCK)
    ON t.transaction_id = pta.transaction_id
where not exists (select * from fee_prop_assoc fpa
			      where fpa.fee_id = f.fee_id)



UNION ALL
SELECT pta.payment_id
,escrow_id AS [object_id]
,'Escrow' AS object_type
,4 as sort_order
,escrow.prop_id
,escrow.[year]
,cast(NULL AS decimal(13,10)) levy_rate
,cast(NULL AS decimal(14,2)) taxable_value
,NULL AS statement_id,
t.base_amount_pd AS base_amount
,t.interest_amount_pd + t.bond_interest_pd as interest
,t.penalty_amount_pd penalty
,t.base_amount_pd + t.interest_amount_pd + t.bond_interest_pd + t.penalty_amount_pd as amount_paid
FROM escrow WITH (NOLOCK)
  JOIN coll_transaction t WITH (NOLOCK)
    ON t.trans_group_id = escrow_id
  JOIN payment_transaction_assoc pta WITH (NOLOCK)
    ON t.transaction_id = pta.transaction_id
where transaction_type <> 'AE'

UNION ALL
SELECT pta.payment_id, overpmt_credit_id AS [object_id]
,'Overpayment Credit' AS object_type
,5 as sort_order
,isnull(overpayment_credit.prop_id, 0) prop_id
,NULL AS [year]
,NULL levy_rate
,NULL taxable_value
,NULL AS statement_id,
t.base_amount_pd AS base_amount
,t.interest_amount_pd + t.bond_interest_pd as interest
,t.penalty_amount_pd penalty
,t.base_amount_pd + t.interest_amount_pd + t.bond_interest_pd + t.penalty_amount_pd as amount_paid
FROM overpayment_credit WITH (NOLOCK)
   JOIN coll_transaction t WITH (NOLOCK)
    ON t.trans_group_id = overpmt_credit_id
  JOIN payment_transaction_assoc pta WITH (NOLOCK)
    ON t.transaction_id = pta.transaction_id

GO


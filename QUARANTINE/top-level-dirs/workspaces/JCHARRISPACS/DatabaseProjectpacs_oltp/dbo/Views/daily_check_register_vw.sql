
CREATE VIEW daily_check_register_vw
AS

SELECT prop_id =
	CASE 
	when T_bill_payment_prop.prop_id is not null then T_bill_payment_prop.prop_id
	when T_fee_payment_prop.prop_id is not null then T_fee_payment_prop.prop_id	
	when T_escrow_payment_prop.prop_id is not null then T_escrow_payment_prop.prop_id	
	when T_oc_payment_prop.prop_id is not null then T_oc_payment_prop.prop_id	
	when T_reet_payment_prop.prop_id is not null then T_reet_payment_prop.prop_id
	When T_PTA.prop_id is not null then T_PTA.prop_id	
	else null
	end,
	B.batch_id, 
	B.balance_dt, 
	P.receipt_num,
	NullIf(T.ref_number, '') AS check_num,
	T.amount AS check_amt, 
	B.description, 
	P.void_batch_id, 
	P.payee_id, 
	P.payee_name AS paid_by,
	A.file_AS_name, 
	P.payment_id,
	P.cash_drawer_id,
	TT.tender_type_desc
FROM batch B 

JOIN payment P 
ON B.batch_id = P.batch_id

JOIN tender T
ON P.payment_id = T.payment_id
AND T.tender_type_cd in ('CK', 'MO', 'NONUSCK') 

JOIN tender_type TT 
ON TT.tender_type_cd = T.tender_type_cd
  
LEFT JOIN account A
ON P.payee_id = A.acct_id

LEFT JOIN (
select distinct
	pta.payment_id as payment_id, 
	max(b.prop_id) as prop_id
	from bill as b WITH (NOLOCK)
	JOIN coll_transaction as ct WITH (NOLOCK)
	ON ct.trans_group_id = b.bill_id
	JOIN payment_transaction_assoc as pta WITH (NOLOCK)
	ON ct.transaction_id = pta.transaction_id
	group by pta.payment_id 
	) as T_bill_payment_prop
ON T_bill_payment_prop.payment_id = P.payment_id

LEFT JOIN (
select distinct
	pta.payment_id as payment_id, 
	max(fpa.prop_id) as prop_id
	FROM fee_prop_assoc fpa WITH (NOLOCK)
	JOIN fee f WITH (NOLOCK)
    ON f.fee_id = fpa.fee_id
    JOIN coll_transaction t WITH (NOLOCK)
    ON t.trans_group_id = f.fee_id
    JOIN payment_transaction_assoc pta WITH (NOLOCK)
    ON t.transaction_id = pta.transaction_id
    group by pta.payment_id 
) as T_fee_payment_prop
ON T_fee_payment_prop.payment_id = P.payment_id  
  
LEFT JOIN (
SELECT distinct
	pta.payment_id as payment_id,
	max(escrow.prop_id) as prop_id
	FROM escrow WITH (NOLOCK)
	JOIN coll_transaction t WITH (NOLOCK)
	ON t.trans_group_id = escrow.escrow_id
	JOIN payment_transaction_assoc pta WITH (NOLOCK)
	ON t.transaction_id = pta.transaction_id
	group by pta.payment_id  
) as T_escrow_payment_prop
ON T_escrow_payment_prop.payment_id = P.payment_id  

LEFT JOIN (
	SELECT distinct
	pta.payment_id as payment_id, 
	max(overpayment_credit.prop_id)as prop_id
	FROM overpayment_credit WITH (NOLOCK)
	JOIN coll_transaction t WITH (NOLOCK)
	ON t.trans_group_id = overpayment_credit.overpmt_credit_id
	JOIN payment_transaction_assoc pta WITH (NOLOCK)
    ON t.transaction_id = pta.transaction_id
    group by pta.payment_id 
 ) as T_oc_payment_prop
ON T_oc_payment_prop.payment_id = P.payment_id  
 
LEFT JOIN (
	SELECT distinct
	pta.payment_id as payment_id,
	max(pra.prop_id) as prop_id
	FROM reet as r WITH (NOLOCK)
	JOIN reet_tax_district_transaction as rta WITH(NOLOCK)
	ON rta.reet_id = r.reet_id
	JOIN property_reet_assoc as pra WITH(NOLOCK)
	on pra.reet_id = r.reet_id
	JOIN coll_transaction t WITH (NOLOCK)
    ON t.trans_group_id = rta.trans_group_id
    JOIN payment_transaction_assoc pta WITH (NOLOCK)
    ON t.transaction_id = pta.transaction_id   
    group by  pta.payment_id 
 ) as T_reet_payment_prop
ON T_reet_payment_prop.payment_id = P.payment_id
 
LEFT JOIN (
select distinct
	pta.payment_id as payment_id, 
	max(pta.prop_id) as prop_id
	from payment_transaction_assoc pta
	group by pta.payment_id
) as T_PTA
ON T_PTA.payment_id = P.payment_id

GO


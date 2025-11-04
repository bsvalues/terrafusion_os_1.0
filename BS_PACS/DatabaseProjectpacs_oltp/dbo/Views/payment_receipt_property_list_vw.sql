CREATE view [dbo].[payment_receipt_property_list_vw]

as

SELECT pta.payment_id, b.prop_id
FROM bill b WITH (NOLOCK)
  JOIN coll_transaction t WITH (NOLOCK)
    ON t.trans_group_id = b.bill_id
  JOIN payment_transaction_assoc pta WITH (NOLOCK)
    ON t.transaction_id = pta.transaction_id


UNION ALL
SELECT pta.payment_id,fpa.prop_id
FROM fee_prop_assoc fpa WITH (NOLOCK)
  JOIN fee f WITH (NOLOCK)
    ON f.fee_id = fpa.fee_id
  JOIN coll_transaction t WITH (NOLOCK)
    ON t.trans_group_id = f.fee_id
  JOIN payment_transaction_assoc pta WITH (NOLOCK)
    ON t.transaction_id = pta.transaction_id


Union ALL
SELECT pta.payment_id,null as prop_id
FROM fee f with (nolock)
  JOIN coll_transaction t WITH (NOLOCK)
    ON t.trans_group_id = f.fee_id
  JOIN payment_transaction_assoc pta WITH (NOLOCK)
    ON t.transaction_id = pta.transaction_id
where 
	not exists 
	(select * from fee_prop_assoc fpa where fpa.fee_id = f.fee_id) and
	not exists
	(select * from reet_fee_assoc rfa where rfa.fee_id = f.fee_id)
	
	
---- REET FEES
Union ALL
SELECT pta.payment_id,
(select top 1 prop_id from property_reet_assoc where reet_id = r.reet_id) AS prop_id
FROM reet r WITH (NOLOCK)
JOIN payment_transaction_assoc pta WITH (NOLOCK)
    on pta.payment_id = r.payment_id
JOIN coll_transaction t WITH (NOLOCK)
    ON t.transaction_id = pta.transaction_id 
JOIN fee f with (nolock)
	on f.fee_id = t.trans_group_id 
JOIN reet_fee_assoc rfa WITH (NOLOCK)
	on rfa.fee_id = f.fee_id and rfa.reet_id = r.reet_id
	


UNION ALL
SELECT pta.payment_id,escrow.prop_id
FROM escrow WITH (NOLOCK)
  JOIN coll_transaction t WITH (NOLOCK)
    ON t.trans_group_id = escrow_id
  JOIN payment_transaction_assoc pta WITH (NOLOCK)
    ON t.transaction_id = pta.transaction_id

UNION ALL
SELECT pta.payment_id, isnull(overpayment_credit.prop_id, 0) prop_id
FROM overpayment_credit WITH (NOLOCK)
   JOIN coll_transaction t WITH (NOLOCK)
    ON t.trans_group_id = overpmt_credit_id
  JOIN payment_transaction_assoc pta WITH (NOLOCK)
    ON t.transaction_id = pta.transaction_id

union all 
-- this query may be inefficent and will need to be 
-- monitored for performance
SELECT pta.payment_id,
(select top 1 prop_id from property_reet_assoc where reet_id = rta.reet_id) AS prop_id
FROM reet as r WITH (NOLOCK)
   JOIN reet_tax_district_transaction as rta WITH(NOLOCK)
	ON rta.reet_id = r.reet_id
  JOIN coll_transaction t WITH (NOLOCK)
    ON t.trans_group_id = rta.trans_group_id
  JOIN payment_transaction_assoc pta WITH (NOLOCK)
    ON t.transaction_id = pta.transaction_id

GO


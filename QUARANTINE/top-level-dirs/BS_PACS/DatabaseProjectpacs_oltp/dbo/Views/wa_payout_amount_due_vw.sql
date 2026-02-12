
CREATE VIEW wa_payout_amount_due_vw
AS
select run_id, statement_id, 
Year(payment_date) as year, 
sum (base_amount) as base_amount, 
sum (bond_interest) as bond_interest,
sum (delinquent) as delinquent,
sum (penalty) as penalty,
sum (collection_fee) as collection_fee,
sum (total_due) as total_due
from wa_payout_amount_due
group by run_id, statement_id, Year(payment_date)

GO


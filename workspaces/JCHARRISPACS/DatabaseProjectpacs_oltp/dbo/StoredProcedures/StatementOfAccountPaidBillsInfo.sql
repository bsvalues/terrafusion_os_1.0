
CREATE PROCEDURE StatementOfAccountPaidBillsInfo

@input_prop_id		int = 0,
@input_owner_id	int = 0,
@input_year		int = 0,
@input_sup_num	int = 0


AS


declare @count		int

select @count = (select count(bill.bill_id)
from bill, payment_trans, payment, entity
where bill.entity_id = entity.entity_id
--and bill.sup_tax_yr <= @input_year
and bill.bill_id = payment_trans.bill_id
and payment_trans.payment_id = payment.payment_id
and bill.active_bill = 'T'
and bill.prop_id = @input_prop_id
--and bill.owner_id = @input_owner_id
)


if (@count > 0)
begin
	select 1 as DumbID,
		entity.entity_cd,
		bill.sup_num,
		bill.sup_tax_yr as year,
		bill.stmnt_id as statement_id,
		payment_trans.mno_amt + payment_trans.ins_amt as tax_paid,
		isnull(payment_trans.penalty_mno_amt, 0) + isnull(payment_trans.penalty_ins_amt, 0) + 
			isnull(payment_trans.interest_mno_amt, 0) + isnull(payment_trans.interest_ins_amt, 0) +
			isnull(payment_trans.discount_mno_amt, 0) + isnull(payment_trans.discount_ins_amt, 0) as disc_pi_paid,
		payment_trans.attorney_fee_amt,
		isnull(payment_trans.overage_mno_amt, 0) + isnull(payment_trans.overage_ins_amt, 0) + isnull(payment_trans.underage_mno_amt, 0) + isnull(payment_trans.underage_ins_amt, 0) as under_over_refund,
		payment.post_date as posting_date,
		payment_trans.mno_amt + payment_trans.ins_amt +
		payment_trans.penalty_mno_amt + penalty_ins_amt + interest_mno_amt + interest_ins_amt +
		payment_trans.attorney_fee_amt +
		payment_trans.overage_mno_amt + payment_trans.overage_ins_amt + payment_trans.underage_mno_amt + payment_trans.underage_ins_amt as amount_paid
	from bill, payment_trans, payment, entity
	where bill.entity_id = entity.entity_id
	--and bill.sup_tax_yr <= @input_year
	and bill.bill_id = payment_trans.bill_id
	and payment_trans.payment_id = payment.payment_id
	and bill.active_bill = 'T'
	and bill.prop_id = @input_prop_id
	--and bill.owner_id = @input_owner_id
	and isnull(entity.rendition_entity, 0) = 0
	--order by bill.sup_tax_yr, entity.entity_cd, bill.stmnt_id

	UNION ALL

	SELECT 
		1 AS DumbID,
		'BPP' AS entity_cd,
		NULL as sup_num,
		bill.sup_tax_yr as year,
		bill.stmnt_id as statement_id,
		SUM(payment_trans.mno_amt + payment_trans.ins_amt) as tax_paid,
		SUM (
			isnull(payment_trans.penalty_mno_amt, 0) + isnull(payment_trans.penalty_ins_amt, 0) + 
			isnull(payment_trans.interest_mno_amt, 0) + isnull(payment_trans.interest_ins_amt, 0) +
			isnull(payment_trans.discount_mno_amt, 0) + isnull(payment_trans.discount_ins_amt, 0)
		) AS disc_pi_paid,
 		SUM(payment_trans.attorney_fee_amt) as attorney_fee_amt,
		SUM (
			isnull(payment_trans.overage_mno_amt, 0) + 
			isnull(payment_trans.overage_ins_amt, 0) + 
			isnull(payment_trans.underage_mno_amt, 0) + 
			isnull(payment_trans.underage_ins_amt, 0)
		 ) as under_over_refund,
		MAX(payment.post_date)as posting_date,
		SUM (
			payment_trans.mno_amt + 
			payment_trans.ins_amt +
			payment_trans.penalty_mno_amt + 
			penalty_ins_amt + 
			interest_mno_amt + 
			interest_ins_amt +
			payment_trans.attorney_fee_amt +
			payment_trans.overage_mno_amt + 
			payment_trans.overage_ins_amt + 
			payment_trans.underage_mno_amt + 
			payment_trans.underage_ins_amt 
		) as amount_paid
	FROM 
		bill 
		INNER JOIN
		entity
			ON  bill.prop_id = @input_prop_id
			AND bill.entity_id = entity.entity_id
			AND isnull(entity.rendition_entity, 0) = 1
		INNER JOIN
		payment_trans
			ON bill.bill_id = payment_trans.bill_id
		INNER JOIN
		payment
			ON
			payment_trans.payment_id = payment.payment_id
				
	WHERE 	
		bill.active_bill = 'T'

	GROUP BY
		bill.prop_id,
		bill.sup_tax_yr,
		--bill.sup_num,
		bill.stmnt_id
			
order by bill.sup_tax_yr, entity.entity_cd, bill.stmnt_id	
			
end
else
begin
	select 0 as DumbID
end

GO


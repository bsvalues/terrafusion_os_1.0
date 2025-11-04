




CREATE PROCEDURE StatementOfAccountPaidRefundsInfo

@input_prop_id 		int = 0,
@input_owner_id		int = 0,
@input_year		int = 0,
@input_sup_num		int = 0

AS


declare @count		int

select @count = (select count(bill.bill_id)
from bill, entity, refund, refund_trans
where bill.entity_id = entity.entity_id
and bill.bill_id = refund_trans.bill_id
and refund_trans.refund_id = refund.refund_id
and bill.active_bill = 'T'
and bill.prop_id = @input_prop_id
--and bill.owner_id = @input_owner_id
)


if @count > 0
begin
	select 1 as DumbID,
		entity.entity_cd as entity,
		bill.sup_tax_yr as year,
		bill.stmnt_id as statement_id,
		refund.date_refunded,
		( refund_trans.refund_m_n_o_pd  +
refund_trans.refund_i_n_s_pd  +
refund_trans.refund_pen_m_n_o_pd +
refund_trans.refund_pen_i_n_s_pd +
refund_trans.refund_int_m_n_o_pd +
refund_trans.refund_int_i_n_s_pd +
refund_trans.refund_atty_fee_pd )as refund_amount_paid
	from bill, entity, refund, refund_trans
	where bill.entity_id = entity.entity_id
	and bill.bill_id = refund_trans.bill_id
	and refund_trans.refund_id = refund.refund_id
	and bill.active_bill = 'T'
	and bill.prop_id = @input_prop_id
	--and bill.owner_id = @input_owner_id
	order by entity.entity_cd
end
else
begin
	select 0 as DumbID
end

GO


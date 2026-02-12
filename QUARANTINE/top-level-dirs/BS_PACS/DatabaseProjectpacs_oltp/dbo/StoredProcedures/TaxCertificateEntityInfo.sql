


CREATE PROCEDURE TaxCertificateEntityInfo

@input_prop_id		int,
@input_fee_id		int

AS


SET NOCOUNT ON


declare @tax_yr		int

select @tax_yr = tax_yr
from pacs_system


declare @count		int


select @count = (select count(bill.owner_id)
		from bill, fee_prop_entity_assoc, entity, account
		where bill.entity_id = entity.entity_id
		and bill.entity_id = account.acct_id
		and bill.entity_id = fee_prop_entity_assoc.entity_id
		and fee_prop_entity_assoc.fee_id = @input_fee_id
		and bill.sup_tax_yr = @tax_yr
		and bill.active_bill = 'T'
		and bill.active_bill is not null
		and bill.coll_status_cd <> 'RS'
		and bill.prop_id = @input_prop_id)

if (@count > 0)
begin

	select 	1 as DumbID,
	col_owner_id as owner_id,
		entity.entity_cd,
		account.file_as_name as entity_name,
		sum((bill.bill_m_n_o_pd
			+ bill.bill_i_n_s_pd)
			- ( bill.refund_m_n_o_pd 
			+ refund_i_n_s_pd )) as entity_paid
	from bill, entity, account, fee_prop_entity_assoc,property
	where bill.entity_id = entity.entity_id
	and bill.entity_id = account.acct_id
	and bill.entity_id = fee_prop_entity_assoc.entity_id
	and fee_prop_entity_assoc.fee_id = @input_fee_id
	and bill.sup_tax_yr = @tax_yr
	and bill.active_bill = 'T'
	and bill.active_bill is not null
	and bill.coll_status_cd <> 'RS'
	and bill.prop_id = @input_prop_id
	and property.prop_id=bill.prop_id
	group by bill.prop_id,col_owner_id, bill.entity_id, entity.entity_cd, account.file_as_name
end
else
begin
	select 0
end

GO


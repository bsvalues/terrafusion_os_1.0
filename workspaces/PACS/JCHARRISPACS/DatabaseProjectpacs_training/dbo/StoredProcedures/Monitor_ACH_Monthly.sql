

CREATE procedure [dbo].[Monitor_ACH_Monthly]


@tax_year		int,

@half_payment	int

as  

SET NOCOUNT ON   


/*
declare @tax_year int
declare @half_payment int

  
set @tax_year = 2020
Set @half_payment = 1
*/

select p.geo_id as parcel_number, a.file_as_name as taxpayer_name, min(b.statement_id) statement_id,
	sum((isnull(bpd.amount_due, 0) - isnull(bpd.amount_paid, 0)) + (isnull(fpd.amount_due, 0) - isnull(fpd.amount_paid, 0))) half_due
from bill b with(nolock)
join property p with(nolock)
	on p.prop_id = b.prop_id
join prop_group_assoc pga with(nolock)
	on pga.prop_id = b.prop_id
join account a with(nolock)
	on a.acct_id = p.col_owner_id
left join bill_payments_due bpd with(nolock)
	on bpd.bill_id = b.bill_id
left join bill_fee_assoc bfa with(nolock)
	on bfa.bill_id = b.bill_id
left join fee f with(nolock)
	on f.fee_id = bfa.fee_id
left join fee_payments_due fpd with(nolock)
	on f.fee_id = fpd.fee_id
	and fpd.fee_payment_id = bpd.bill_payment_id
where pga.prop_group_cd = 'ACH-MO'
and b.display_year = @tax_year
and bpd.bill_payment_id = case when @half_payment = 1 then 0
								else 1
							end
group by p.geo_id, a.file_as_name

GO


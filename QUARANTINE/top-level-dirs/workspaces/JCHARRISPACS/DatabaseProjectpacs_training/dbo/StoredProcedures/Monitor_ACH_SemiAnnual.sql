







CREATE procedure [dbo].[Monitor_ACH_SemiAnnual]



  



@tax_year		int

--, @half_payment	int



  



as  



  







SET NOCOUNT ON   








/* ---ORIGINAL MONITOR






select p.geo_id as parcel_number, a.file_as_name as taxpayer_name, min(b.statement_id) statement_id,



	sum((isnull(bpd.amount_due, 0) - isnull(bpd.amount_paid, 0)) + (isnull(fpd.amount_due, 0) - isnull(fpd.amount_paid, 0))) half_due



from bill b with(nolock)



join property p with(nolock)



	on p.prop_id = b.prop_id



join prop_group_assoc pga with(nolock)



	on pga.prop_id = b.prop_id



left join account a with(nolock)



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



where pga.prop_group_cd = 'ACH-SA'



and b.display_year = @tax_year



and bpd.bill_payment_id = case when @half_payment = 1 then 0



								else 1



							end



group by p.geo_id, a.file_as_name




*/

---NEW MONITOR


select p.geo_id as parcel_number, a.file_as_name as taxpayer_name, min(b.statement_id) statement_id,
	sum((isnull(bpd.amount_due, 0) - isnull(bpd.amount_paid, 0)) + (isnull(fpd.amount_due, 0) - isnull(fpd.amount_paid, 0))) first_half_due,
	sum((isnull(bpd2.amount_due, 0) - isnull(bpd2.amount_paid, 0)) + (isnull(fpd2.amount_due, 0) - isnull(fpd2.amount_paid, 0))) second_half_due
from bill b with(nolock)
join property p with(nolock)
	on p.prop_id = b.prop_id
join prop_group_assoc pga with(nolock)
	on pga.prop_id = b.prop_id
join account a with(nolock)
	on a.acct_id = p.col_owner_id
join bill_payments_due bpd with(nolock)
	on bpd.bill_id = b.bill_id
	and bpd.bill_payment_id = 0
left join bill_fee_assoc bfa with(nolock)
	on bfa.bill_id = b.bill_id
left join fee f with(nolock)
	on f.fee_id = bfa.fee_id
left join fee_payments_due fpd with(nolock)
	on f.fee_id = fpd.fee_id
	and fpd.fee_payment_id = bpd.bill_payment_id
left join bill_payments_due bpd2 with(nolock)
	on bpd2.bill_id = b.bill_id
	and bpd2.bill_payment_id = 1
left join fee_payments_due fpd2 with(nolock)
	on f.fee_id = fpd2.fee_id
	and fpd2.fee_payment_id = bpd2.bill_payment_id
where pga.prop_group_cd = 'ACH-SA'
and b.display_year = @tax_year
group by p.geo_id, a.file_as_name

GO


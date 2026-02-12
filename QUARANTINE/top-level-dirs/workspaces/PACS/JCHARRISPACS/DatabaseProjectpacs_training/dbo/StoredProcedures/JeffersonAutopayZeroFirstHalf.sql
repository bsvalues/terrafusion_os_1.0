
--{call JeffersonAutopayZeroFirstHalf('2013')}

CREATE   PROCEDURE [dbo].[JeffersonAutopayZeroFirstHalf]

@tax_yr			numeric(4,0)

as


select distinct
	b.year, 
	b.prop_id,
	sum(b.current_amount_due) as base_amount_due,
	(sum(b.current_amount_due) - sum(amount_paid)) as current_amount_due
from bill b with(nolock)
inner join autopay_enrollment ae with(nolock)
	on ae.prop_id = b.prop_id
	and ae.canceled_date is NULL
where b.display_year = @tax_yr
	and b.payment_status_type_cd = 'HALF'
group by 
	b.year, 
	b.prop_id 
having (sum(b.current_amount_due) - sum(amount_paid)) = (sum(b.current_amount_due) / 2)
	or (sum(b.current_amount_due) - sum(amount_paid)) = ((sum(b.current_amount_due) / 2) - 0.005)

GO


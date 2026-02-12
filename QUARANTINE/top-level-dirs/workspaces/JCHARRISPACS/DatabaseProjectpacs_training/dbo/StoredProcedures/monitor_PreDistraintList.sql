
/*



exec dbo.monitor_PreDistraintList 2018



*/

CREATE procedure [dbo].[monitor_PreDistraintList]  



/*********



--This monitor was written for Benton to provide them a list of properties subject to distraint.  

--Properties are subject to distraint if no payment has been made toward the year specified OR 

--if any property has a balance due for a year prior to the year specified.  



--This list can be used as a review prior to the distraint process.



Requirements from Barb Bader

Question 1:  This query should be returning properties subject to distraint and there are 2 situations that will cause a property to be subject to distraint. 

1)	If the tax year (display_year) specified has nothing paid to the first half of that year and the first half due date is 4/30 of the tax year.

2)	If the property has any balance due for any year prior to the tax year specified.



Question 2:  The input will be display_year.  Display_year is a computed field based on year (year + 1). 

  I don’t know if it’s easier to build an index on display_year or just calculate year for purposes of the query.





*/





  @tax_year	numeric(4,0) 



AS     



SET NOCOUNT ON  



declare @filter_yr numeric(4,0) = @tax_year - 1



select b.prop_id, p.geo_id, p.prop_type_cd, p.col_owner_id, a.file_as_name, b.display_year, b.statement_id, b.code,

sum((b.current_amount_due- b.amount_paid) + (isnull(f.current_amount_due, 0) - isnull(f.amount_paid, 0))) base_due,

isnull(l.cause_num, '') as current_litigation, pv.sub_type, dbo.fn_GetExemptions (pv.prop_id, pv.prop_val_yr, pv.sup_num) as exemptions

from bill b with(nolock)

join property p with(nolock)

	on p.prop_id = b.prop_id


join account a with(nolock)

	on a.acct_id = p.col_owner_id

left join property_val pv with (nolock)
	on b.prop_id = pv.prop_id
	and b.year = pv.prop_val_yr

left join property_exemption pe with (nolock)
	on p.prop_id = pe.prop_id


left join bill_fee_assoc bfa with(nolock)

	on bfa.bill_id = b.bill_id

left join fee f with(nolock)

	on f.fee_id = bfa.fee_id

left join litigation_statement_assoc lsa with(nolock)

	on lsa.prop_id = b.prop_id

left join litigation l with(nolock)

	on l.litigation_id = lsa.litigation_id

where  b.[year] = @filter_yr -- ( display_year is a computed column - [year]+(1))  -- old code b.display_year = @tax_year 

and b.is_active = 1

and p.prop_type_cd in ('P', 'MH') or pv.sub_type = 'IOLL'

group by b.prop_id, p.geo_id, p.prop_type_cd, pv.sub_type,p.col_owner_id, a.file_as_name, b.display_year, b.statement_id, b.code, l.cause_num,
pv.prop_id, pv.prop_val_yr, pv.sup_num

having sum(b.current_amount_due - b.amount_paid) > 0



--and sum(b.amount_paid) = 0



union ALL



select b.prop_id, p.geo_id, p.prop_type_cd, p.col_owner_id, a.file_as_name, b.display_year, b.statement_id, b.code,

sum((b.current_amount_due- b.amount_paid) + (isnull(f.current_amount_due, 0) - isnull(f.amount_paid, 0))) base_due,

isnull(l.cause_num, '') as current_litigation, pv.sub_type, dbo.fn_GetExemptions (pv.prop_id, pv.prop_val_yr, pv.sup_num) as exemptions

from bill b with(nolock)

join property p with(nolock)

	on p.prop_id = b.prop_id

join account a with(nolock)

	on a.acct_id = p.col_owner_id
	left join property_val pv with (nolock)
	on b.prop_id = pv.prop_id
	and b.year = pv.prop_val_yr

left join property_exemption pe with (nolock)
	on p.prop_id = pe.prop_id


left join bill_fee_assoc bfa with(nolock)

	on bfa.bill_id = b.bill_id

left join fee f with(nolock)

	on f.fee_id = bfa.fee_id


left join litigation_statement_assoc lsa with(nolock)

	on lsa.prop_id = b.prop_id

left join litigation l with(nolock)

	on l.litigation_id = lsa.litigation_id

where b.[year] < @filter_yr -- ( display_year is a computed column - [year]+(1))  -- old code  b.display_year < @tax_year 

and b.is_active = 1

and p.prop_type_cd in ('P', 'MH') or pv.sub_type = 'IOLL'

group by b.prop_id, p.geo_id, p.prop_type_cd, p.col_owner_id, a.file_as_name, b.display_year, b.statement_id, b.code, l.cause_num,
pv.prop_id, pv.prop_val_yr, pv.sup_num,pv.sub_type

having sum(b.current_amount_due - b.amount_paid) > 0

order by b.prop_id, b.display_year

GO


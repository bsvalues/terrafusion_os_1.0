CREATE PROCEDURE monitor_REETwithExemptions

/*************
This monitor was created for Benton to identify REET records on properties with a specified exemption within a specified date range.

{Call monitor_REETwithExemptions('11/1/2018', '11/30/2018', 'EX')}
*************/

@begin_date		datetime,
@end_date		datetime,
@exmpt_type_cd	varchar(10)


as


select Distinct rip.prop_id, p.geo_id, ria.name buyer, ria2.name seller, r.completion_date, wpoe.exmpt_type_cd, wpoe.exempt_sub_type_cd, r.excise_number
from reet r with(nolock)
join reet_import_property rip with(Nolock)
	on rip.reet_id = r.reet_id
join property p with(Nolock)
	on p.prop_id = rip.prop_id
left join reet_import_account ria with(nolock)
	on ria.reet_id = rip.reet_id
	and ria.account_type_cd = 'B'
left join reet_import_account ria2 with(Nolock)
	on ria2.reet_id = ria.reet_id
	and ria2.account_type_cd = 'S'
join wash_prop_owner_exemption wpoe with(nolock)
	on wpoe.prop_id = rip.prop_id
	and wpoe.year = rip.year
	and wpoe.sup_num = rip.sup_num
where r.completion_date >= @begin_date	---'11/1/2018'
and r.completion_date <=  @end_date	---'11/30/2018'
and wpoe.exmpt_type_cd = @exmpt_type_cd
order by completion_date, excise_number

GO


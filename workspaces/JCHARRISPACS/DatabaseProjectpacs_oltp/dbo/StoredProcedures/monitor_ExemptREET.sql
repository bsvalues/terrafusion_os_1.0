


CREATE PROCEDURE [dbo].[monitor_ExemptREET]

/***************
This monitor was created for Benton to provide them a list of all REET records
that were created during the specified date range that include a WAC code.  
The inputs are begin date and end date. Each date must be surrounded by single quotes.
The dates are inclusive.
{CALL monitor_ExemptREET ('10/1/2018', '10/15/2018')}

***************/

@begin_date		datetime,
@end_date datetime


as


select r.reet_id, r.excise_number, rip.prop_id, p.geo_id, r.sale_date, r.completion_date, r.wac_number_type_cd,
	w.wac_desc, r.reet_type_cd, r.instrument_type_cd,  ria.account_type_cd, ria.name, ria.addr_line1, ria.addr_line2, 
	ria.addr_line3, ria.addr_city, ria.addr_zip, ria.addr_country_cd, r.comment
from reet r with(nolock)
join reet_import_property rip with(nolock)
	on r.reet_id = rip.reet_id
join property p with(nolock)
	on p.prop_id = rip.prop_id
left join reet_wac_code w with(nolock)
	on w.wac_cd = r.wac_number_type_cd
	join reet_import_account ria with (nolock)
	on r.reet_id = ria.reet_id
where r.completion_date >= '7/1/2019'---@begin_date
and r.completion_date <= '7/22/2019'---@end_date
---and r.wac_number_type_cd is not NULL
order by r.excise_number

GO


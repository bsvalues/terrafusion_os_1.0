
--- Monitor Name REET Rates Not Mapped
---- monitor command to run this monitor -- {call _Monitor_REET_rates_Not_mapped}

--- --THESE TAX DISTRICTS ARE NOT MAPPED TO ANY REET rates for the Current Year


Create procedure [dbo].[_Monitor_REET_rates_Not_mapped]


as


Select td.tax_district_id, td.tax_district_desc, td.tax_district_type_cd, rr.reet_rate_id, rr.rate_type_cd, rr.description
from tax_district td
left join reet_rate rr
on td.tax_district_id = rr.tax_district_id
where rr.end_date is null and rr.reet_rate_id is null
order by td.tax_district_id

GO




--- Monitor Name REET Rates Mapped Prior Years ----
-- -monitor command to run this monitor -- {call _Monitor_REET_rates_mapped_PriorYears}

--- This monitor Displays  REET Rates that are mapped for Prior Years Not Active


CREATE procedure [dbo].[_Monitor_REET_rates_mapped_PriorYears]


as

select rr.reet_rate_id, td.tax_district_id, td.tax_district_cd, td.tax_district_desc, td.tax_district_type_cd, ta.tax_area_number, ta.tax_area_description, rr.reet_rate, rr.rate_type_cd
from tax_area ta
inner join tax_area_reet_rate_assoc tarra on tarra.tax_area_id = ta.tax_area_id
inner join reet_rate rr  on rr.reet_rate_id = tarra.reet_rate_id
inner join tax_district td on td.tax_district_id = rr.tax_district_id
where  ta.inactive_after_year is not null  --- this is what selects Non Current mapping
order by rr.reet_rate_id

GO


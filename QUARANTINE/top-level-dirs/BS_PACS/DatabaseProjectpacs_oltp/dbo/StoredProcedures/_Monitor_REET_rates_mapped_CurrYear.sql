

--- Monitor Name REET Rates Mapped Current ----
-- -monitor command to run this monitor -- {call _Monitor_REET_rates_mapped_CurrYear}

--- This monitor Displays Current REET Rates that are mapped


CREATE procedure [dbo].[_Monitor_REET_rates_mapped_CurrYear]


as

select rr.reet_rate_id, td.tax_district_id, td.tax_district_cd, td.tax_district_desc, td.tax_district_type_cd, ta.tax_area_number, ta.tax_area_description, rr.reet_rate, rr.rate_type_cd
from tax_area ta
inner join tax_area_reet_rate_assoc tarra on tarra.tax_area_id = ta.tax_area_id
inner join reet_rate rr  on rr.reet_rate_id = tarra.reet_rate_id
inner join tax_district td on td.tax_district_id = rr.tax_district_id
where  ta.inactive_after_year is null  --- this is what selects current year mapping
order by rr.reet_rate_id

GO


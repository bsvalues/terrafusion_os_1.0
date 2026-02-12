
---this is how it is used in a query

--WHERE pv.prop_val_yr = 2017
--AND pv.sup_num = dbo.fn_AsOfSup_num(pv.prop_id, 2017, 54)


Create FUNCTION [dbo].[fn_AsOfSup_num] ( @input_prop_id int, @input_year numeric(4,0), @sup_num int )
RETURNS varchar(100)
AS
BEGIN
	declare @output_codes   int
	set @output_codes = 0

set @output_codes =	
(select max(pv.sup_num)
from property_val as pv with (nolock) 
inner join (select s.sup_tax_yr,max(s.sup_num)as last_accptd_sup_num
			from sup_group as sg with (nolock) 
			inner join supplement as s with (nolock) 
			on sg.sup_group_id = s.sup_group_id
			and s.sup_num = @sup_num
			group by s.sup_tax_yr) as sup
	on pv.prop_val_yr = sup.sup_tax_yr
	and pv.sup_num <= sup.last_accptd_sup_num
where pv.prop_val_yr = @input_year
and pv.prop_id = @input_prop_id
group by pv.prop_id,pv.prop_val_yr)


	RETURN (@output_codes)
END

GO


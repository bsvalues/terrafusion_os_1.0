-- this function is used for Value Notice (specifically Clark)
create function fn_GetExemptionsDesc(@input_prop_id int, @input_year numeric(4,0), @input_sup_num int )
returns varchar(600) -- but currently, it returns only up to 100 chars to fit into wash_appraisal_notice_prop_info.exemptions
as
begin
	declare @output_codes varchar(600)

	declare @current_year int
 	select @current_year = min(tax_yr) 
	from pacs_year where certification_dt is null
 
	select @output_codes = dbo.CommaListConcatenate(
		et.exmpt_desc + 
		case when (pe.effective_dt is not null and datepart(year, pe.effective_dt) = @current_year) 
			or (pe.termination_dt is not null and datepart(year, pe.termination_dt) = @current_year)
		then ' - Prorate' else '' end)
	from property_exemption pe with(nolock)
	join exmpt_type et with(nolock)
		on et.exmpt_type_cd = pe.exmpt_type_cd
	where pe.exmpt_tax_yr = @input_year
	and pe.owner_tax_yr = @input_year
	and pe.sup_num = @input_sup_num
	and pe.prop_id = @input_prop_id


	return left(@output_codes, 100)
end

GO


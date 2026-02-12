

CREATE FUNCTION dbo.fn_GetPropertySpecialExemptions (
  @input_prop_id int,
  @input_year numeric(4,0),
  @input_sup_num int)
RETURNS varchar(100)
AS
BEGIN
  declare @output_codes varchar(100), @delimiter varchar(2)
  set @output_codes = ''
  set @delimiter = ', '

	select @output_codes = @output_codes + @delimiter + code 
	from
	(
		select distinct pe.exmpt_type_cd + 
			case when isnull(pe.exempt_qualify_cd,'*') <> '*' 
			then '-' + pe.exempt_qualify_cd else '' end code
		
		from property_exemption pe with(nolock)

		join special_assessment_exemption sae with(nolock)
		on sae.year = pe.exmpt_tax_yr
		and sae.exmpt_type_cd = pe.exmpt_type_cd
		and ( (sae.exempt_qualify_cd = pe.exempt_qualify_cd) or
				(sae.exempt_qualify_cd = '*') )

		where pe.prop_id = @input_prop_id
		and pe.exmpt_tax_yr = @input_year
		and pe.sup_num = @input_sup_num
	)x

  if @output_codes <> ''
    set @output_codes = Right(@output_codes, Len(@output_codes) - Len(@delimiter))
  
  return @output_codes
END

GO


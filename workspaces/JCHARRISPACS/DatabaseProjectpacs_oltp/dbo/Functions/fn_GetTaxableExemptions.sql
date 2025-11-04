

CREATE  FUNCTION fn_GetTaxableExemptions ( @input_prop_id int, @input_owner_id int,
					  @input_entity_id int, @input_year int, @input_sup_num int )
RETURNS varchar(100)
AS
BEGIN
	declare @output_codes   varchar(100)
	declare @single_code	varchar(10)
	set @output_codes = ''

	DECLARE CODES CURSOR
	FOR select exmpt_type_cd
	    from property_entity_exemption
	    where prop_id    = @input_prop_id
	    and owner_id     = @input_owner_id
	    and entity_id    = @input_entity_id
	    and exmpt_tax_yr = @input_year
	    and sup_num      = @input_sup_num

	OPEN CODES
	FETCH NEXT FROM CODES into @single_code
	
	while (@@FETCH_STATUS = 0)
	begin
	   if (@output_codes = '')
	   begin 
	      select @output_codes = rtrim(@single_code)
	   end
	   else 
	   begin
	      select @output_codes = @output_codes + ' ' + rtrim(@single_code)
	   end
  
  	 FETCH NEXT FROM CODES into @single_code

	end
	CLOSE CODES
	DEALLOCATE CODES
	RETURN (@output_codes)
END

GO


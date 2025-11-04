

CREATE FUNCTION fn_GetOwnerExemptions ( @input_owner_id int, @input_prop_id int, @input_year numeric(4,0), @input_sup_num int )
RETURNS varchar(500)
AS
BEGIN
	declare @output_codes   varchar(500)
	declare @single_code	varchar(10)
	set @output_codes = ''

	DECLARE CODES CURSOR
	FOR select exmpt_type_cd
	    from property_exemption with(nolock)
	    where exmpt_tax_yr = @input_year and
		owner_tax_yr = @input_year and
	    sup_num = @input_sup_num and
		prop_id = @input_prop_id and
		owner_id = @input_owner_id

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
	      select @output_codes = @output_codes + ', ' + rtrim(@single_code)
	   end
  
  	 FETCH NEXT FROM CODES into @single_code

	end
	CLOSE CODES
	DEALLOCATE CODES
	RETURN (@output_codes)
END

GO


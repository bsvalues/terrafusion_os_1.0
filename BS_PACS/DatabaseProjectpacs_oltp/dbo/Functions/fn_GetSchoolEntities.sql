
CREATE FUNCTION fn_GetSchoolEntities ( @input_prop_id int, @input_year int, @input_sup_num int )
RETURNS varchar(100)
AS
BEGIN
	declare @output_codes   varchar(100)
	declare @single_code	varchar(10)
	set @output_codes = ''

	DECLARE CODES CURSOR
	FOR select entity_cd
	    from entity_prop_assoc epa, entity e
	    where epa.entity_id = e.entity_id
	    and   epa.prop_id = @input_prop_id
	    and   epa.tax_yr = @input_year
	    and   epa.sup_num = @input_sup_num
	    and   e.entity_type_cd = 'S'

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



CREATE FUNCTION fn_GetProtestReasonCodes ( @input_prop_id int, @input_year int, @input_case_id int )
RETURNS varchar(255)
AS
BEGIN
	declare @output_codes   varchar(100)
	declare @single_code	varchar(10)
	set @output_codes = ''

	DECLARE CODES CURSOR
	FOR select reason_cd 
            FROM _arb_protest_reason 
	    WHERE prop_id=@input_prop_id
	    AND prop_val_yr = @input_year 
	    AND case_id = @input_case_id 

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


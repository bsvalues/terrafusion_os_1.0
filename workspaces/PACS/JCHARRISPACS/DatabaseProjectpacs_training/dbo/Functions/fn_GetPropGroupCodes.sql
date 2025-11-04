


CREATE  FUNCTION [dbo].[fn_GetPropGroupCodes] ( @input_prop_id int)
RETURNS varchar(200)
AS
BEGIN
	declare @output_codes   varchar(200)
	declare @single_code    varchar(20)
	set @output_codes = ''

	DECLARE CODES CURSOR
	FOR select prop_group_cd
	    from prop_group_assoc with (nolock)
	    where prop_id = @input_prop_id
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


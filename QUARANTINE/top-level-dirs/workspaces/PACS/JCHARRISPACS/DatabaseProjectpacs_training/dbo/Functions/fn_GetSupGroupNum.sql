
CREATE FUNCTION fn_GetSupGroupNum( @sup_group int )
RETURNS varchar(1000)
AS
BEGIN
	declare @output_codes   varchar(1000)
	declare @single_code	varchar(10)
	set @output_codes = ''

	DECLARE CODES CURSOR
	FOR select distinct convert(varchar(10),sup_num)
		from supplement
		where sup_group_id=@sup_group

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
	      select @output_codes = @output_codes + ',' + rtrim(@single_code)
	   end
  
  	 FETCH NEXT FROM CODES into @single_code

	end
	CLOSE CODES
	DEALLOCATE CODES
	RETURN (@output_codes)
END

GO


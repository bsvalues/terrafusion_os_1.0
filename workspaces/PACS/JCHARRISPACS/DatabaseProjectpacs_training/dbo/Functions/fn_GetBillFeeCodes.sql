
CREATE FUNCTION fn_GetBillFeeCodes ( @input_prop_id int, @input_year numeric(4,0))
RETURNS varchar(max)
AS
BEGIN
	declare @output_codes   varchar(max)
	declare @single_code	varchar(500)
	set @output_codes = ''

	DECLARE COMMENTS CURSOR
	FOR select distinct code 
		from (
			select distinct isNull(code, '') code
			from bill with (nolock)
			where year = @input_year
			and prop_id = @input_prop_id

			union all 

			select distinct isNull(code, '') code
			from fee with (nolock)
			join fee_property_vw as fpv with(nolock) on
				fpv.fee_id = fee.fee_id
			where year = @input_year
			and prop_id = @input_prop_id
		) codes

	OPEN COMMENTS
	FETCH NEXT FROM COMMENTS into @single_code
	
	while (@@FETCH_STATUS = 0)
	begin
	   if (LEN(@output_codes) = 0)
	   begin 
	      select @output_codes = rtrim(@single_code)
	   end
	   else 
	   begin
	      select @output_codes = @output_codes + ', ' + rtrim(@single_code)
	   end
  
  	 FETCH NEXT FROM COMMENTS into @single_code

	end
	CLOSE COMMENTS
	DEALLOCATE COMMENTS
	RETURN (@output_codes)
END

GO


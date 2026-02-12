
CREATE FUNCTION fn_GetEntities ( @input_prop_id int, @input_year numeric(4,0), @input_sup_num int )
RETURNS varchar(100)
AS
BEGIN
	declare @output_codes   varchar(100)
	declare @single_code	varchar(10)
	set @output_codes = ''

	DECLARE CODES CURSOR
	FOR select e.entity_cd
	    from entity_prop_assoc as epa with(nolock)
		join entity as e with(nolock) on
			e.entity_id = epa.entity_id
	    where
			epa.tax_yr = @input_year
		and	epa.sup_num = @input_sup_num
	    and	epa.prop_id = @input_prop_id

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


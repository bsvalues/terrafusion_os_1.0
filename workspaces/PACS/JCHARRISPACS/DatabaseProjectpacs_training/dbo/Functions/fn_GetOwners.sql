


CREATE FUNCTION fn_GetOwners ( @input_prop_id int, @input_year int, @input_sup_num int )
RETURNS varchar(2048)
AS
BEGIN
	declare @output_owners  varchar(2048)
	declare @single_owner	varchar(70)
	declare @acct_id	int

	set @output_owners = ''

	DECLARE OWNER CURSOR FAST_FORWARD
	FOR select a.file_as_name, a.acct_id
		from owner o with (nolock) inner join account a with (nolock)
			on o.owner_id = a.acct_id
			and o.prop_id = @input_prop_id
			and o.owner_tax_yr = @input_year
			and o.sup_num = @input_sup_num

	OPEN OWNER

	FETCH NEXT FROM OWNER into @single_owner, @acct_id
	
	while (@@FETCH_STATUS = 0)
	begin
		if (@output_owners = '')
		begin 
			select @output_owners = rtrim(@single_owner) + ' (' + rtrim(cast(@acct_id as varchar(14))) + ')'
		end
		else 
		begin
			select @output_owners = @output_owners + '; ' + rtrim(@single_owner) + ' (' + rtrim(cast(@acct_id as varchar(14))) + ')'
		end
  
		FETCH NEXT FROM OWNER into @single_owner, @acct_id
	end

	CLOSE OWNER
	DEALLOCATE OWNER

	RETURN (@output_owners)
END

GO


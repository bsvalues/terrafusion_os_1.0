
CREATE FUNCTION fn_GetChgOfOwnerPropIDs ( @chg_of_owner_id int, @second_half bit )
RETURNS varchar(50)
AS
BEGIN
	declare @output_ids   varchar(100)
	declare @single_id	varchar(10)
	set @output_ids = ''

	DECLARE ID_CSR CURSOR FOR 
		select prop_id from chg_of_owner_prop_assoc
		where chg_of_owner_id = @chg_of_owner_id

	OPEN ID_CSR
	FETCH NEXT FROM ID_CSR into @single_id
	
	while (@@FETCH_STATUS = 0)
	begin
	   if (@output_ids = '')
	   begin 
	      select @output_ids = rtrim(@single_id)
	   end
	   else 
	   begin
	      select @output_ids = @output_ids + ', ' + rtrim(@single_id)
	   end
  
  	 FETCH NEXT FROM ID_CSR into @single_id

	end
	CLOSE ID_CSR
	DEALLOCATE ID_CSR
	if @second_half = 0
	begin
		SET @output_ids = LEFT(@output_ids, 50)
	end
	else
	begin
		SET @output_ids = SUBSTRING(@output_ids, 51, 50)
	end
	RETURN @output_ids
END

GO


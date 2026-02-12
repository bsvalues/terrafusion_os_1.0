
create procedure ScalarInputValueSetDate
	@dateVal datetime
as

set nocount on

	update scalar_input_value
	set dateVal = @dateVal
	where spid = @@spid
	
	if ( @@rowcount = 0 )
	begin
		insert scalar_input_value (spid, dateVal)
		values (@@spid, @dateVal)
	end

GO


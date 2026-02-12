
create procedure TriggerGetEnabled
	@szTableName sysname
as

/* Returns:  Boolean indicating if trigger should be enabled */

set nocount on

	declare @bEnabled bit
	set @bEnabled = null

	select @bEnabled = bEnabled
	from pacs_trigger_enable with(nolock)
	where szTableName = @szTableName

	if ( @bEnabled is null )
	begin
		return(1)
	end
	else
	begin
		return(@bEnabled)
	end

GO


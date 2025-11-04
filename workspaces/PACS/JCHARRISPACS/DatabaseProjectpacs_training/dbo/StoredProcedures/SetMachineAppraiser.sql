

create procedure SetMachineAppraiser
	@szMachineName varchar(256),
	@lAppraiserID int
as

set nocount on

	update appraiser_machine set
		appraiser_id = @lAppraiserID
	where
		machine_name = @szMachineName
	if ( @@rowcount = 0 )
	begin
		insert appraiser_machine (
			appraiser_id, machine_name
		) values (
			@lAppraiserID, @szMachineName
		)
	end

set nocount off

GO


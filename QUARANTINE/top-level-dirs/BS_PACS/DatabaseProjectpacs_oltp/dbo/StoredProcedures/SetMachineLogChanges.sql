
create procedure SetMachineLogChanges
	@input_log int,
	@lPacsUserID int = 0 -- Only used by taappsvr connections
as

set nocount on

	if ( app_name() like '%TAAppSvr%' )
	begin
		declare @l64ContextInfo bigint

		set @l64ContextInfo = @input_log
		set @l64ContextInfo = @l64ContextInfo * 4294967296 -- Left shift 32 bits
		set @l64ContextInfo = @l64ContextInfo + @lPacsUserID
		
		set context_info @l64ContextInfo
	end
	else
	begin
		declare @host_name varchar(50)
		select @host_name = host_name()

		if ( app_name() like '%SyncService%' )
		begin
			set @host_name = @host_name + '_SS'
		end

		update dbo.chg_log_user with(rowlock)
		set log_changes = @input_log
		where machine = host_name()
		and hostid = host_id()
	end

GO


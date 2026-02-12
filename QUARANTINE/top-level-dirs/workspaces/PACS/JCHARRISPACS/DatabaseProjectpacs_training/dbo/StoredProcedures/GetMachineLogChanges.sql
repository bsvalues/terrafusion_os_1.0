
create procedure GetMachineLogChanges
	@output_log int output,
	@lPacsUserID int = null output
as

	if ( app_name() like '%TAAppSvr%' )
	begin
		select
			@output_log = convert(int, substring([context_info], 1, 4)),
			@lPacsUserID = convert(int, substring([context_info], 5, 4))
		from master.dbo.sysprocesses
		where spid = @@spid
	end
	else
	begin
		declare @host_name varchar(50)
		select @host_name = host_name()

		if ( app_name() like '%SyncService%' )
		begin
			set @host_name = @host_name + '_SS'
		end

		select
			@output_log = log_changes,
			@lPacsUserID = pacs_user_id
		from dbo.chg_log_user with(nolock)
		where machine = @host_name
		and hostid = host_id()

		if ( @output_log is null )
		begin
			set @output_log = 1
		end

		if ( @lPacsUserID is null )
		begin
			set @lPacsUserID = 0
		end
	end

GO


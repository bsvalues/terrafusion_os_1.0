
create procedure sp_AddTableReplication
	@szTableName sysname
as

	declare @szPublicationName sysname
	set @szPublicationName = 'table_pacs_' + @szTableName

	if exists (
		select *
		from syspublications
		where name = @szPublicationName
	)
	begin
		-- Publication already exists
		return
	end

	-- Determine server & database names
	declare
		@szPublicationDBName sysname,
		@szServerName sysname

	set @szPublicationDBName = db_name(db_id())
	set @szServerName = lower(@@servername)

	declare
		@szLogReaderJobName sysname,
		@szSnapshotJobName sysname

	set @szLogReaderJobName = @szServerName + '-' + @szPublicationDBName + '-logreader'
	set @szSnapshotJobName = @szServerName + '-' + @szPublicationDBName + '-' + @szPublicationName

	-- Add the publication
	exec sp_addpublication
		@publication = @szPublicationName,
		@restricted = N'false', @sync_method = N'native', @repl_freq = N'continuous',
		@description = @szPublicationName,
		@status = N'active', @allow_push = N'true', @allow_pull = N'true', @allow_anonymous = N'false',
		@enabled_for_internet = N'false', @independent_agent = N'false', @immediate_sync = N'false',
		@allow_sync_tran = N'false', @autogen_sync_procs = N'false', @retention = 336,
		@allow_queued_tran = N'false', @snapshot_in_defaultfolder = N'true', @compress_snapshot = N'false',
		@ftp_port = 21, @ftp_login = N'anonymous', @allow_dts = N'false',
		@allow_subscription_copy = N'false', @add_to_active_directory = N'false',
		@logreader_job_name = @szLogReaderJobName

	-- Add the snapshot
	exec sp_addpublication_snapshot
		@publication = @szPublicationName,
		@frequency_type = 4, @frequency_interval = 1, @frequency_relative_interval = 1,
		@frequency_recurrence_factor = 0, @frequency_subday = 8, @frequency_subday_interval = 1,
		@active_start_date = 0, @active_end_date = 0,
		@active_start_time_of_day = 0, @active_end_time_of_day = 235959,
		@snapshot_job_name = @szSnapshotJobName

	-- Disable the agent job for the snapshot
	declare @uuidJob uniqueidentifier
	select @uuidJob = convert(uniqueidentifier, snapshot_jobid)
	from syspublications
	where name = @szPublicationName
	exec ta_sqlsvr_dss.msdb.dbo.sp_update_job @job_id = @uuidJob, @enabled = 0

	-- Add the table to the publication
	declare
		@szCmdINS sysname,
		@szCmdDEL sysname,
		@szCmdUPD sysname
	set @szCmdINS = 'CALL sp_MSins_' + @szTableName
	set @szCmdDEL = 'CALL sp_MSdel_' + @szTableName
	set @szCmdUPD = 'CALL sp_MSupd_' + @szTableName
	exec sp_addarticle
		@publication = @szPublicationName,
		@article = @szTableName,
		@source_owner = N'dbo',
		@source_object = @szTableName,
		@destination_table = @szTableName,
		@type = N'logbased', @creation_script = null, @description = null, @pre_creation_cmd = N'drop',
		@schema_option = 0x00000000000000F3, @status = 16, @vertical_partition = N'false',
		@ins_cmd = @szCmdINS,
		@del_cmd = @szCmdDEL,
		@upd_cmd = @szCmdUPD,
		@filter = null, @sync_object = null, @auto_identity_range = N'false'

	-- Add the subscriptions
	declare
		@szDestServer sysname,
		@szDestDB sysname

	declare curSubscriptions insensitive cursor
	for
		select distinct szDestServer, szDestDB
		from replication_subscription_dropped
		where
			szTableName = @szTableName
	for read only

	open curSubscriptions
	fetch next from curSubscriptions into @szDestServer, @szDestDB

	while ( @@fetch_status = 0 )
	begin
		exec sp_addsubscription
			@publication = @szPublicationName,
			@article = N'all',
			@subscriber = @szDestServer, @destination_db = @szDestDB,
			@sync_type = N'automatic', @update_mode = N'read only', @offloadagent = 0,
			@dts_package_location = N'distributor'

		fetch next from curSubscriptions into @szDestServer, @szDestDB
	end

	close curSubscriptions
	deallocate curSubscriptions

	delete replication_subscription_dropped
	where szTableName = @szTableName

GO


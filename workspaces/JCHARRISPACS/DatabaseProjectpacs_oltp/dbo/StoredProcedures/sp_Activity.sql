
create procedure sp_Activity

as

set nocount on

	/* Get the list of processes that are actually doing something, not including SQL Server system processes */
	select distinct
		spid, blocked, cmd, last_batch, rtrim(hostname) as host, db_name(dbid) as dbname, sum(cpu) as cpu, sum(physical_io) as io
	into #tmp_processes
	from master..sysprocesses with(nolock)
	where
		not spid = @@spid
		and not cmd in (
			'AWAITING COMMAND',
			'TASK MANAGER',
			'LOG WRITER',
			'SIGNAL HANDLER',
			'LOCK MONITOR',
			'LAZY WRITER',
			'CHECKPOINT SLEEP',
			'CHECKPOINT'
		)
	group by spid, blocked, cmd, last_batch, hostname, db_name(dbid)

	declare
		@spid int,
		@blocked int,
		@cmd varchar(16),
		@last_batch datetime,
		@host varchar(128),
		@dbname sysname,
		@cpu int,
		@io int

	declare @szPacsUser varchar(255)

	declare curProcs cursor
	for
		select
			spid, blocked, cmd, last_batch, host, dbname, cpu, io
		from #tmp_processes
		order by
			last_batch asc
	for read only

	open curProcs
	fetch next from curProcs into
		@spid, @blocked, @cmd, @last_batch, @host, @dbname, @cpu, @io

	/* For each */
	while @@fetch_status = 0
	begin
		set @szPacsUser = null
		select @szPacsUser = p.pacs_user_name
		from chg_log_user as c with(nolock)
		join pacs_user as p with(nolock) on
			c.pacs_user_id = p.pacs_user_id
		where
			c.machine = @host

		print '/******************************************************************************/'
		print convert(varchar(8), @spid) + '(' + @host + '-' + isnull(@szPacsUser, '') + ') --> ' + @cmd
		print 'This command began running at ' + convert(varchar(32), @last_batch)
		if ( @blocked <> 0 )
		begin
			print 'This process is blocked by process ID ' + convert(varchar(8), @blocked)
		end
		print 'Process stats: cpu = ' + convert(varchar(16), @cpu) + ' ; io = ' + convert(varchar(16), @io)

		dbcc inputbuffer(@spid)

		print ''

		fetch next from curProcs into
			@spid, @blocked, @cmd, @last_batch, @host, @dbname, @cpu, @io
	end

	close curProcs
	deallocate curProcs

	print '/******************************************************************************/'
	print '/* The following are processes that are blocking other processes from running */'
	print '/******************************************************************************/'

	exec sp_Blocks

set nocount off

GO


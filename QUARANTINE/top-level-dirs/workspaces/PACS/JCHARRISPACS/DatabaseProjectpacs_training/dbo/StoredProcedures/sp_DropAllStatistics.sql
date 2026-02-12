
create procedure sp_DropAllStatistics

as

set nocount on

	declare
		@szTableName sysname,
		@szStatsName sysname,
		@szSQL varchar(8000)

	if (not @@version like '%Microsoft SQL Server  7%')
	begin
		print 'sp_DropAllStatistics only implemented on SQL Server 7.0'
		return(0)
	end

	declare curStats insensitive cursor
	for
		select
			so.name, si.name
		from sysindexes as si with(nolock)
		join sysobjects as so with(nolock) on
			si.id = so.id
		where
			so.xtype = 'U' and
			(si.status & 64) = 64 /* Statistics only */
	for read only

	open curStats
	fetch next from curStats into @szTableName, @szStatsName

	while ( @@fetch_status = 0 )
	begin
		set @szSQL = 'drop statistics ' + @szTableName + '.' + @szStatsName
		exec(@szSQL)
		fetch next from curStats into @szTableName, @szStatsName
	end

	close curStats
	deallocate curStats


set nocount off

GO


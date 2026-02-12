
create procedure sp_DropPrimaryKey
	@szTableName sysname
as

set nocount on

	declare @szSQL varchar(2048)

	-- First, determine if replication is installed
	if object_id('sysarticles') is not null
	begin
		-- And if so, determine if table is replicated and if so, remove it from replication
		exec sp_DropTableReplication @szTableName
	end

	-- Next, drop all foreign keys to this table
	declare
		@szTableRef sysname,
		@szCFK sysname
	declare curFK insensitive cursor
	for
		select distinct object_name(fkeyid), object_name(constid)
		from sysforeignkeys
		where rkeyid = object_id(@szTableName)
	for read only

	open curFK
	fetch next from curFK into @szTableRef, @szCFK

	while ( @@fetch_status = 0 )
	begin
		set @szSQL = 'alter table ' + @szTableRef + ' drop constraint ' + @szCFK
		exec(@szSQL)

		fetch next from curFK into @szTableRef, @szCFK
	end

	close curFK
	deallocate curFK

	declare @szPKName sysname
	set @szPKName = null
	select @szPKName = name
	from sysobjects as so
	where
		so.parent_obj = object_id(@szTableName) and
		objectproperty(so.id, 'IsPrimaryKey') = 1

	if @szPKName is not null
	begin
		set @szSQL = 'alter table [' + @szTableName + '] drop constraint [' + @szPKName + ']'

		exec(@szSQL)
	end

GO


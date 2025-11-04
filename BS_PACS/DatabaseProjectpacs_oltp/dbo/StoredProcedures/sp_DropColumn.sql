
create procedure sp_DropColumn
	@szTable sysname,
	@szColumn sysname
as

	declare @lColID smallint

	select @lColID = colid
	from syscolumns
	where id = object_id(@szTable)
	and name = @szColumn

	if ( @lColID is null )
	begin
		return
	end

	declare @szSQL varchar(8000)
	declare @szIndexName sysname

	-- Drop any indexes in which the column exists
	declare curIndexes insensitive cursor
	for
		select distinct si.name
		from sysindexkeys as sik
		join sysindexes as si on
			sik.id = si.id and
			sik.indid = si.indid and
			(si.status & 64) = 0
		where
			sik.id = object_id(@szTable) and
			sik.colid = @lColID
	for read only

	open curIndexes
	fetch next from curIndexes into @szIndexName

	while ( @@fetch_status = 0 )
	begin
		set @szSQL = 'drop index ' + @szTable + '.' + @szIndexName
		exec(@szSQL)

		fetch next from curIndexes into @szIndexName
	end

	close curIndexes
	deallocate curIndexes

	-- Drop the default constraint for the column if one exists
	declare @szDefaultConstraint sysname
	select
		@szDefaultConstraint = so.name
	from syscolumns as sc
	join sysobjects as so on
		so.id = sc.cdefault
	where
		sc.id = object_id(@szTable) and
		sc.name = @szColumn
	if ( @szDefaultConstraint is not null )
	begin
		set @szSQL = 'alter table [' + @szTable + '] drop constraint [' + @szDefaultConstraint + ']'
		exec(@szSQL)
	end

	create table #tmpRepl
	(
		bRepl bit not null
	)

	insert #tmpRepl (bRepl) values (0)

	if ( object_id('sysarticles') is not null )
	begin
		set @szSQL = '
			if exists (
				select *
				from sysarticles
				where objid = object_id(''' + @szTable + ''')
			)
			begin
				update #tmpRepl set bRepl = 1
			end
		'

		exec(@szSQL)
	end

	if exists (
		select *
		from #tmpRepl
		where bRepl = 1
	)
	begin
		set @szSQL = 'exec sp_repldropcolumn ''' + @szTable + ''', ''' + @szColumn + ''''
	end
	else
	begin
		set @szSQL = 'alter table ' + @szTable + ' drop column ' + @szColumn
	end

	exec(@szSQL)

GO


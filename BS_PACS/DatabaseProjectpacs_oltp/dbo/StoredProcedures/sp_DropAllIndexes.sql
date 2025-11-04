
create procedure sp_DropAllIndexes
	@szTableName sysname = null /* Leave null to specify all indexes on all tables */
as

declare curIndexes insensitive cursor
for
	select
		so.name,
		si.name
	from sysindexes as si
	join sysobjects as so on
		si.id = so.id
	where
		si.indid between 1 and 254 and /* Not a table within sysindexes */
		so.xtype = 'U' and /* Not system tables */
		(si.status & 64) = 0 and /* In order to filter rows from sysindexes that aren't actually indexes.  Taken from sp_helpindex. */
		(so.name = @szTableName or @szTableName is null) and
		not exists (
			select
				sc.constid
			from sysconstraints as sc
			join sysobjects as t_constraints on
				sc.constid = t_constraints.id
			join sysobjects as t_tables on
				sc.id = t_tables.id
			where
				t_constraints.name = si.name and
				t_tables.name = so.name and
				(sc.status & 15) in (1, 2) /* Only primary key and unique constraints */
		) /* Primary key and unique indexes should be dropped by dropping the constraint */
	order by
		si.indid desc /* Nonclustered before clustered */
for read only

/* For processing the cursor */
declare @szIndexName sysname

/* SQL for dropping an index */
declare @szSQL varchar(560)

open curIndexes
fetch next from curIndexes
into
	@szTableName,
	@szIndexName

/* For each constraint */
while @@fetch_status = 0
begin
	set @szSQL =
		'drop index ' + @szTableName + '.' + @szIndexName

	exec(@szSQL)

	fetch next from curIndexes
	into
		@szTableName,
		@szIndexName
end

close curIndexes
deallocate curIndexes

GO


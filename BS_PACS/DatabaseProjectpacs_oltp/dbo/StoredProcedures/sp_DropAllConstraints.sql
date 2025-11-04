
create procedure sp_DropAllConstraints

as

declare curConstraints insensitive cursor
for
	select
		t_constraints.name,
		t_tables.name,
		(sc.status & 15) as lConstraintType
	from sysconstraints as sc
	join sysobjects as t_constraints on
		sc.constid = t_constraints.id
	join sysobjects as t_tables on
		sc.id = t_tables.id
	where
		t_tables.xtype = 'U'
	order by
		lConstraintType desc /* Drop foreign keys before primary keys */
for read only

/* For processing the cursor */
declare
	@szConstraintName sysname,
	@szTableName sysname,
	@lConstraintType int

/* SQL for dropping a constraint */
declare @szSQL varchar(2048)

open curConstraints
fetch next from curConstraints
into
	@szConstraintName,
	@szTableName,
	@lConstraintType

/* For each constraint */
while @@fetch_status = 0
begin
	set @szSQL =
		'alter table ' + @szTableName + ' drop constraint ' + @szConstraintName

	exec(@szSQL)

	fetch next from curConstraints
	into
		@szConstraintName,
		@szTableName,
		@lConstraintType
end

close curConstraints
deallocate curConstraints

GO


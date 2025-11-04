
create procedure sp_EnforceNameConvention_DefaultConstraints

as

set nocount on

	declare
		@szTable sysname,
		@szConstraintName sysname,
		@lConstraintID int,
		@lTableID int,
		@lColumnID smallint

	declare @szColumnName sysname
	declare @szNewName varchar(8000)

	declare curDefaults cursor
	for
		select st.name, so.name, sc.constid, sc.id, sc.colid
		from sysconstraints as sc
		join sysobjects as so on
			sc.constid = so.id
		join sysobjects as st on
			sc.id = st.id
		where ( sc.status & 15) = 5
		and st.xtype = 'U'
	for read only

	open curDefaults
	fetch next from curDefaults into @szTable, @szConstraintName, @lConstraintID, @lTableID, @lColumnID

	while ( @@fetch_status = 0 )
	begin
		/* Get the column name */
		select @szColumnName = name
		from syscolumns
		where
			id = @lTableID and
			colid = @lColumnID

		set @szNewName = 'CDF_' + @szTable + '_' + @szColumnName
		exec sp_rename @szConstraintName, @szNewName, 'OBJECT'

		fetch next from curDefaults into @szTable, @szConstraintName, @lConstraintID, @lTableID, @lColumnID
	end

	close curDefaults
	deallocate curDefaults

set nocount off

GO


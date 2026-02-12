
create procedure sp_ScriptAllCheckConstraints
	@bUseTableList bit = 0
as

set nocount on

	declare
		@szTable sysname,
		@szConstraintName sysname,
		@lConstraintID int

	declare @szConstraintDefinition varchar(8000)
	declare @szSQL varchar(8000)

	if ( @bUseTableList = 1 )
	begin
		declare curChecks cursor
		for
			select st.name, so.name, sc.constid
			from sysconstraints as sc
			join sysobjects as so on
				sc.constid = so.id
			join sysobjects as st on
				sc.id = st.id
			where ( sc.status & 15 ) = 4 and
			st.xtype = 'U' and
			objectproperty(st.id, 'IsMSShipped') = 0 and
			st.name in (
				select szTableName from #tmp_tables
			)
			order by st.name asc, so.name asc
		for read only
	end
	else
	begin
		declare curChecks cursor
		for
			select st.name, so.name, sc.constid
			from sysconstraints as sc
			join sysobjects as so on
				sc.constid = so.id
			join sysobjects as st on
				sc.id = st.id
			where ( sc.status & 15 ) = 4 and
			st.xtype = 'U' and
			objectproperty(st.id, 'IsMSShipped') = 0
			order by st.name asc, so.name asc
		for read only
	end

	open curChecks
	fetch next from curChecks into @szTable, @szConstraintName, @lConstraintID

	while ( @@fetch_status = 0 )
	begin
		/* Get the check constraint definition from syscomments */
		set @szConstraintDefinition = null
		select @szConstraintDefinition = convert(varchar(8000), text)
		from syscomments
		where
			id = @lConstraintID

		if ( @szConstraintDefinition is null )
		begin
			print '/* No entry in syscomments for check constraint ' + @szConstraintName + ' on table ' + @szTable + '*/'
		end
		else
		begin
			set @szSQL = 'alter table ' + @szTable + ' add constraint ' + @szConstraintName + ' check ' + @szConstraintDefinition
			print @szSQL
			print 'go'
			print ''
		end
		
		fetch next from curChecks into @szTable, @szConstraintName, @lConstraintID
	end

	close curChecks
	deallocate curChecks

set nocount off

GO



create procedure PenpadScriptTable
	@szTableName sysname
as

set nocount on

	declare @lID int
	set @lID = object_id(@szTableName)

	/* Ensure table exists */
	if ( @lID is null )
	begin
		return(-1)
	end

	declare
		@szSQL varchar(max),
		@szTemp varchar(max)

	declare
		@szColName sysname,
		@szDataType sysname,
		@iLength smallint,
		@iPrecision smallint,
		@lScale int,
		@lNullable int,
		@bIdentity tinyint,
		@iColID smallint,
		@bIsComputed smallint,
		@szComputedDefinition varchar(max),
		@bIsPersisted smallint
		
	declare
		@lDefaultConstraintID int,
		@szDefaultConstraintName sysname,
		@szDefaultDefinition varchar(max)

	set @szSQL = 'create table ' + @szTableName + '(bPenpadRowStatusCode tinyint not null default 1'

	declare curColumns cursor
	for
		select
			sc.name, st.name, sc.length, sc.prec, sc.scale, sc.isnullable, sc.status & 0x80, sc.colid,
				sc.iscomputed, ssc.definition, ssc.is_persisted
		from syscolumns as sc
		join systypes as st on
			sc.xtype = st.xtype and
			sc.xusertype = st.xusertype and
			not st.name = 'timestamp'
		left outer join sys.computed_columns as ssc
		with (nolock)
		on sc.id = ssc.object_id
		and sc.name = ssc.name
		where
			sc.id = @lID
		order by
			sc.colid
	for read only

	open curColumns

	fetch next from curColumns into @szColName, @szDataType, @iLength, @iPrecision, @lScale, @lNullable, @bIdentity, @iColID, @bIsComputed, @szComputedDefinition, @bIsPersisted

	while ( @@fetch_status = 0 )
	begin
		set @szTemp = ', [' + @szColName + '] '
		
		if @bIsComputed = 0
		begin
			set @szTemp = @szTemp + @szDataType

			if (
				@szDataType = 'char' or
				@szDataType = 'varchar' or
				@szDataType = 'binary' or
				@szDataType = 'varbinary' or
				@szDataType = 'nchar' or
				@szDataType = 'nvarchar'
			)
			begin
				if (@iLength = -1)
				begin
					set @szTemp = @szTemp + '(max)'
				end
				else
				begin
					set @szTemp = @szTemp + '(' + convert(varchar(16), @iLength) + ')'
				end
			end
			else if (
				@szDataType = 'numeric' or
				@szDataType = 'decimal'
			)
			begin
				set @szTemp = @szTemp + '(' + convert(varchar(16), @iPrecision) + ',' + convert(varchar(16), @lScale) + ')'
			end
			else if ( @szDataType = 'float' )
			begin
				set @szTemp = @szTemp + '(' + convert(varchar(16), @iPrecision) + ')'
			end

			if ( @bIdentity > 0 )
			begin
				/* Column is an identity column */
				set @szTemp = @szTemp + ' identity(' +
					convert(varchar(64), ident_seed(@szTableName)) + ',' + convert(varchar(64), ident_incr(@szTableName)) +
					')'
			end

			if ( @lNullable = 0 )
			begin
				set @szTemp = @szTemp + ' not'
			end
			set @szTemp = @szTemp + ' null'

			-- Check to see if the column has a default constraint
			set @lDefaultConstraintID = null
			select
				@lDefaultConstraintID = sc.constid,
				@szDefaultConstraintName = so.name
			from sysconstraints as sc
			join sysobjects as so on
				so.id = sc.constid and
				so.xtype = 'D'
			where sc.id = @lID and sc.colid = @iColID
			
			if ( @lDefaultConstraintID is not null )
			begin
				select @szDefaultDefinition = convert(varchar(max), text)
				from syscomments
				where id = @lDefaultConstraintID
				
				set @szTemp = @szTemp + ' constraint [' + @szDefaultConstraintName + '] default ' + @szDefaultDefinition
			end
			
		end
		else
		begin
			set @szTemp = @szTemp + 'as ' + @szComputedDefinition
			
			if @bIsPersisted = 1
			begin
				set @szTemp = @szTemp + ' persisted'
			end
		end
			
		set @szSQL = @szSQL + @szTemp

		fetch next from curColumns into @szColName, @szDataType, @iLength, @iPrecision, @lScale, @lNullable, @bIdentity, @iColID, @bIsComputed, @szComputedDefinition, @bIsPersisted
	end

	/* Determine if the table has a primary key */
	create table #tmp_pk_columns
	(
		szColumnName sysname not null,
		szColumnDataType sysname not null,
		iColumnSeq smallint not null
	)
	declare
		@lIndexID smallint,
		@szPKConstraintName sysname
	exec PenpadGetPrimaryKey @szTableName, @lIndexID output, @szPKConstraintName output
	
	if ( @lIndexID is not null )
	begin
		/* Table has a primary key */

		set @szTemp = ', constraint ' + @szPKConstraintName + ' primary key '
		if ( @lIndexID = 1 )
		begin
			set @szTemp = @szTemp + 'clustered'
		end
		else
		begin
			set @szTemp = @szTemp + 'nonclustered'
		end

		set @szTemp = @szTemp + '('

		declare
			@lIndex int,
			@szColumnName sysname

		declare curKeys cursor
		for
			select szColumnName
			from #tmp_pk_columns
			order by iColumnSeq asc
		for read only

		open curKeys
		fetch next from curKeys into @szColumnName

		set @lIndex = 0
		while ( @@fetch_status = 0 )
		begin
			if ( @lIndex > 0 )
			begin
				set @szTemp = @szTemp + ', '
			end

			set @szTemp = @szTemp + @szColumnName

			set @lIndex = @lIndex + 1
			fetch next from curKeys into @szColumnName
		end

		close curKeys
		deallocate curKeys

		set @szTemp = @szTemp + ')'

		/* Add the PK DDL to the SQL */
		set @szSQL = @szSQL + @szTemp
	end

	set @szSQL = @szSQL + ')'

	close curColumns
	deallocate curColumns
	
set nocount off

	select szSQL = @szSQL

GO


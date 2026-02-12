
create procedure sp_ScriptTable
	@szTableName sysname,
	@szSQL1 varchar(8000) output,
	@szSQL2 varchar(8000) output
as

set nocount on

	declare @lID int
	set @lID = object_id(@szTableName)

	/* Ensure table exists */
	if ( @lID is null )
	begin
		return(-1)
	end

	/*
		We need two variables since there are some tables (ex: income & maybe others)
		whose create table DDL exceeds 8000 characters
	*/
	declare
		@szTemp varchar(8000),
		@szComputedDefinition varchar(8000),
		@lIndex int

	declare
		@szColName sysname,
		@szDataType sysname,
		@iLength smallint,
		@iPrecision smallint,
		@lScale int,
		@lNullable int,
		@bIdentity tinyint,
		@lIsComputed int,
		@lColID smallint

	set @szSQL1 = 'create table ' + @szTableName + char(13) + char(10) + '(' + char(13) + char(10)
	set @szSQL2 = ''

	declare curColumns cursor
	for
		select
			sc.name, st.name, sc.length, sc.prec, sc.scale, sc.isnullable, sc.status & 0x80, sc.iscomputed, sc.colid
		from syscolumns as sc
		join systypes as st on
			sc.xtype = st.xtype and
			sc.xusertype = st.xusertype
		where
			sc.id = @lID
		order by
			sc.colid
	for read only

	open curColumns

	fetch next from curColumns into @szColName, @szDataType, @iLength, @iPrecision, @lScale, @lNullable, @bIdentity, @lIsComputed, @lColID

	set @lIndex = 0
	while ( @@fetch_status = 0 )
	begin
		if ( @lIndex > 0 )
		begin
			set @szTemp = char(13) + char(10) + char(9)
		end
		else
		begin
			set @szTemp = char(9)
		end

		set @szTemp = @szTemp + '[' + @szColName + '] '

		if ( @lIsComputed = 0 )
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
                if @iLength < 0 
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
		end
		else
		begin
			/* Computed column */
			select @szComputedDefinition = convert(varchar(8000), text)
			from syscomments
			where
				id = @lID and
				number = @lColID

			set @szTemp = @szTemp + 'as ' + @szComputedDefinition
		end

		set @lIndex = @lIndex + 1
		fetch next from curColumns into @szColName, @szDataType, @iLength, @iPrecision, @lScale, @lNullable, @bIdentity, @lIsComputed, @lColID

		/* If there will be another column */
		if ( @@fetch_status = 0 )
		begin
			set @szTemp = @szTemp + ','
		end

		if ( (len(@szSQL1) + len(@szTemp)) > 8000 )
		begin
			set @szSQL2 = @szSQL2 + @szTemp
		end
		else
		begin
			set @szSQL1 = @szSQL1 + @szTemp
		end
	end

	set @szTemp = char(13) + char(10) + ')'

	if ( @szSQL2 <> '' )
	begin
		set @szSQL2 = @szSQL2 + @szTemp
	end
	else
	begin
		set @szSQL1 = @szSQL1 + @szTemp
	end

	close curColumns
	deallocate curColumns

set nocount off

	return(0)

GO


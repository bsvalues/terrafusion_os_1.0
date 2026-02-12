
create procedure sp_ScriptAllViewIndexes

as

set nocount on

	declare curIndexes insensitive cursor
	for
		select
			t_views.name,
			si.name,
			t_views.id,
			si.indid,
			si.OrigFillFactor,
			sfg.groupname
		from sysindexes as si
		join sysobjects as t_views on
			si.id = t_views.id
		join sysfilegroups as sfg on
			si.groupid = sfg.groupid
		where
			si.indid between 1 and 254 and /* Shouldn't be any views (unlike tables) within sysindexes, but just in case */
			t_views.xtype = 'V' and /* Not system views */
			objectproperty(t_views.id, 'IsMSShipped') = 0 and
			(si.status & 64) = 0 /* discovered in sp_helpindex - ask James for more detail */
		order by
			t_views.name asc,
			si.indid asc /* Clustered indexes first */
	for read only

	/* For processing the indexes cursor */
	declare
		@szViewName sysname,
		@szIndexName sysname,
		@lViewID int,
		@lIndexID smallint,
		@lFillFactor tinyint,
		@szFileGroupName sysname

	/* To determine if we must add a comma in the index column list */
	declare @lCount int

	/* For processing the index columns cursor */
	declare @szColumnName sysname

	/* SQL for creating an index */
	declare @szSQL varchar(2048)

	open curIndexes
	fetch next from curIndexes
	into @szViewName, @szIndexName, @lViewID, @lIndexID, @lFillFactor, @szFileGroupName

	/* For each index */
	while @@fetch_status = 0
	begin
		if @lIndexID = 1
		begin
			set @szSQL = 'create unique clustered index '
		end
		else
		begin
			set @szSQL = 'create nonclustered index '
		end

		set @szSQL = @szSQL + @szIndexName + ' on ' + @szViewName + '('

		declare curColumns insensitive cursor
		for
			select
				sc.name
			from sysindexkeys as sik
			join syscolumns as sc on
				sik.id = sc.id and
				sik.colid = sc.colid
			where
				sik.id = @lViewID and
				sik.indid = @lIndexID
			order by sik.keyno asc
		for read only

		open curColumns
		fetch next from curColumns
		into
			@szColumnName

		set @lCount = 0

		/* For each column */
		while @@fetch_status = 0
		begin
			if @lCount > 0
			begin
				set @szSQL = @szSQL + ', '
			end

			set @lCount = @lCount + 1

			set @szSQL = @szSQL + '[' + @szColumnName + ']'

			fetch next from curColumns
			into
				@szColumnName
		end

		close curColumns
		deallocate curColumns

		/* Finish building SQL */
		set @szSQL = @szSQL + ')'

		if ( @lFillFactor > 0 )
		begin
			set @szSQL = @szSQL + ' with fillfactor = ' + convert(varchar(3), @lFillFactor)
		end
		
		set @szSQL = @szSQL + ' on [primary]'

		print @szSQL
		print 'go'
		print ''

		fetch next from curIndexes
		into @szViewName, @szIndexName, @lViewID, @lIndexID, @lFillFactor, @szFileGroupName
	end

	close curIndexes
	deallocate curIndexes

GO


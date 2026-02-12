
create procedure UpdateNextIDs
	@bOnlyDoYearTables bit = 0
as

set nocount on

	-- First, do the per-year IDs
	declare @yearIDInfo table (
		next_id_table_name sysname not null,
		next_id_columnname_year sysname not null,
		next_id_columnname_id sysname not null,
		
		buildfrom_table_name sysname not null,
		buildfrom_columnname_year sysname not null,
		buildfrom_columnname_id sysname not null
	)
	insert @yearIDInfo values (
		'_arb_inquiry_next_case_id', 'arb_inquiry_year', 'arb_inquiry_next_case_id',
		'_arb_inquiry', 'prop_val_yr', 'case_id'
	)
	insert @yearIDInfo values (
		'_arb_protest_next_case_id', 'arb_protest_year', 'arb_protest_next_case_id',
		'_arb_protest', 'prop_val_yr', 'case_id'
	)
	insert @yearIDInfo values (
		'next_arbitration_id', 'prop_val_yr', 'next_arbitration_id',
		'arbitration', 'prop_val_yr', 'arbitration_id'
	)
	insert @yearIDInfo values (
		'next_appr_notice_id', 'notice_yr', 'next_notice_id',
		'appr_notice_selection_criteria', 'notice_yr', 'notice_num'
	)
	insert @yearIDInfo values (
		'next_statement_id', 'statement_yr', 'next_statement_id',
		'UpdateNextIDs_Statement_vw', 'year', 'statement_id'
	)
	insert @yearIDInfo values (
		'next_supp_id', 'sup_year', 'next_sup_id',
		'UpdateNextIDs_Supplement_vw', 'sup_tax_yr', 'sup_num'
	)
	
	create table #build_from_results
	(
		year numeric(4,0) not null,
		max_id int not null
	)
	
	declare
		@next_id_table_name sysname,
		@next_id_columnname_year sysname,
		@next_id_columnname_id sysname,
		@buildfrom_table_name sysname,
		@buildfrom_columnname_year sysname,
		@buildfrom_columnname_id sysname
	declare
		@szSQL varchar(max)

	declare curPerYear cursor
	for
		select *
		from @yearIDInfo
	for read only
	
	open curPerYear
	fetch next from curPerYear into
		@next_id_table_name,
		@next_id_columnname_year,
		@next_id_columnname_id,
		@buildfrom_table_name,
		@buildfrom_columnname_year,
		@buildfrom_columnname_id

	while (@@fetch_status = 0)
	begin
		truncate table #build_from_results
		
		set @szSQL = '
			insert #build_from_results (year, max_id)
			select ' + @buildfrom_columnname_year + ', max(' + @buildfrom_columnname_id + ')
			from ' + @buildfrom_table_name + ' with(tablockx)
			where ' + @buildfrom_columnname_year + ' is not null and ' + @buildfrom_columnname_id + ' is not null
			group by ' + @buildfrom_columnname_year
		exec(@szSQL)
		
		set @szSQL = '
			update nidt
			set nidt.' + @next_id_columnname_id + ' = (t.max_id + 1)
			from ' + @next_id_table_name + ' as nidt
			join #build_from_results as t on t.year = nidt.' + @next_id_columnname_year + '
			where nidt.' + @next_id_columnname_id + ' < (t.max_id + 1)'
		exec(@szSQL)
		
		set @szSQL = '
			insert ' + @next_id_table_name + ' (' + @next_id_columnname_year + ', ' + @next_id_columnname_id + ')
			select py.tax_yr, isnull(t.max_id, 0) + 1
			from (
				select tax_yr
				from pacs_year
				union
				select tax_yr = 0 -- Future year
			) as py
			left outer join #build_from_results as t on
				t.year = py.tax_yr
			where not exists (
				select *
				from ' + @next_id_table_name + ' as nidt
				where nidt.' + @next_id_columnname_year + ' = py.tax_yr
			)
		'
		exec(@szSQL)
		
		fetch next from curPerYear into
			@next_id_table_name,
			@next_id_columnname_year,
			@next_id_columnname_id,
			@buildfrom_table_name,
			@buildfrom_columnname_year,
			@buildfrom_columnname_id
	end
	
	close curPerYear
	deallocate curPerYear

	
	-- Get out if per-year IDs was only request
	if (@bOnlyDoYearTables = 1)
		return
	
	
	-- Now do all other IDs
	
	declare
		@id_name varchar(63),
		@usage_table sysname,
		@usage_column sysname,
		@is_custom_autofix bit
		
	declare curIDs cursor
	for
		select id_name, usage_table, usage_column, is_custom_autofix
		from next_unique_id
		where allow_autofix = 1
	for read only
	
	open curIDs
	fetch next from curIDs into @id_name, @usage_table, @usage_column, @is_custom_autofix
	
	while (@@fetch_status = 0)
	begin
		if (@is_custom_autofix = 1)
		begin
			exec dbo.UpdateNextIDs_Custom @id_name
		end
		else
		begin
			if (@usage_table <> '' and @usage_column <> '')
			begin
				set @szSQL = '
					declare @maxID bigint
					select @maxID = max(' + @usage_column + ')
					from ' + @usage_table + ' with(tablockx)
					where ' + @usage_column + ' is not null
					
					set @maxID = isnull(@maxID, 0) + 1
					
					update next_unique_id
					set id = @maxID
					where id_name = ''' + @id_name + '''
					and id < @maxID
				'
				exec(@szSQL)
			end
		end
		
		fetch next from curIDs into @id_name, @usage_table, @usage_column, @is_custom_autofix
	end
	
	close curIDs
	deallocate curIDs

GO



create procedure WACalcTaxableSetAssoc
	@szPropQuery varchar(max)
as

set nocount on

	/*
		We are given a query with 3 columns, in this order:
			year, sup num, prop ID
		Each row of the results must be unique per year & prop ID (ignore the PK in @tblPropQuery, that is just for performance)
		
		First, gather the results of that query into a table.
		Then, build a list of all layers (multiple sup nums)
		for each given year & prop ID whose sup num is
		<= that specified in the input query
	*/
	
	declare @szSQL varchar(max)
	set @szSQL = '
	
		declare @tblPropQuery table (
			year numeric(4,0) not null,
			sup_num int not null,
			prop_id int not null,
			primary key clustered (year, sup_num, prop_id)
			with fillfactor = 100
		)
		insert @tblPropQuery (year, sup_num, prop_id)
		' + @szPropQuery + '
		
		truncate table #taxable_property_list
		
		insert #taxable_property_list (year, sup_num, prop_id)
		select wpov.year, wpov.sup_num, wpov.prop_id
		from wash_prop_owner_val as wpov with(nolock)
		join @tblPropQuery as t on
			t.year = wpov.year and
			t.prop_id = wpov.prop_id and
			wpov.sup_num <= t.sup_num
		group by wpov.year, wpov.sup_num, wpov.prop_id
	'
	exec(@szSQL)
	
	declare @lPacsUserID int
	-- 1 is a heuristic, any # other than 0 will do
	set @lPacsUserID = 1
	
	begin transaction
	exec dbo.WACalcTaxableDeleteAssocLevy 0, 0, 0, @lPacsUserID
	exec dbo.WACalcTaxableInsertAssocLevy 0, 0, 0, @lPacsUserID
	if @@trancount > 0 commit transaction

	begin transaction
	exec dbo.WACalcTaxableDeleteAssocTaxArea 0, 0, 0, @lPacsUserID
	exec dbo.WACalcTaxableInsertAssocTaxArea 0, 0, 0, @lPacsUserID
	if @@trancount > 0 commit transaction

	begin transaction
	exec dbo.WACalcTaxableDeleteAssocTaxDistrict 0, 0, 0, @lPacsUserID
	exec dbo.WACalcTaxableInsertAssocTaxDistrict 0, 0, 0, @lPacsUserID
	if @@trancount > 0 commit transaction

GO


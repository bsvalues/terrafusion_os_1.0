
create procedure CalculateTaxableListSetDivision
	@division_num int
as

set nocount on

	truncate table #taxable_property_list

	insert #taxable_property_list (year, sup_num, prop_id)
	select year, sup_num, prop_id
	from #taxable_property_list_by_division
	where division_num = @division_num

GO


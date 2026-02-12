



create procedure SupplementalRollSummaryYearInfo
	@input_sup_group_id int

as

	select 	supplement.sup_tax_yr,
		supplement.sup_num
	from	supplement
	where	supplement.sup_group_id = @input_sup_group_id
	order by supplement.sup_tax_yr, supplement.sup_num

GO


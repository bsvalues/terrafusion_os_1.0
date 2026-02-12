
create procedure ImportPropertyProfile
	@input_prop_id int,
	@input_tax_year numeric(4,0),
	@bAsync bit = 0
as

	if ( db_name(db_id()) = 'penpad' )
	begin
		return
	end

	exec RecalcProperty @input_prop_id, @input_tax_year, 0, 'T', 0, 1, @bAsync

GO


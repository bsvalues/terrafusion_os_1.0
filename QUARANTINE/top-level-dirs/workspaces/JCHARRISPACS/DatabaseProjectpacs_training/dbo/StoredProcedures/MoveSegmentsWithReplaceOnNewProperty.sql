

create procedure MoveSegmentsWithReplaceOnNewProperty
	@input_from_prop_id int,
	@input_to_prop_id int,
	@input_year numeric(4,0),
	@input_sup_num int,
	@input_owner_id int
as



exec MoveSegmentsLandWithReplaceOnNewProperty @input_from_prop_id, @input_to_prop_id, @input_year, @input_sup_num, @input_owner_id
exec MoveSegmentsImprvWithReplaceOnNewProperty @input_from_prop_id, @input_to_prop_id, @input_year, @input_sup_num, @input_owner_id
exec MoveSegmentsPersPropWithReplaceOnNewProperty @input_from_prop_id, @input_to_prop_id, @input_year, @input_sup_num, @input_owner_id

GO


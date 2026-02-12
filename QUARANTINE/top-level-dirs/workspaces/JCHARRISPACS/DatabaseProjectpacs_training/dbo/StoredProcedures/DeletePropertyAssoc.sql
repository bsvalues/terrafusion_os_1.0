
CREATE  PROCEDURE DeletePropertyAssoc

	@parent_prop_id int,
	@child_prop_id int,
	@prop_val_yr numeric(4,0),
	@sup_num int

AS

	DELETE FROM property_assoc 
	where 
	parent_prop_id = @parent_prop_id AND
	child_prop_id = @child_prop_id AND
	prop_val_yr = @prop_val_yr AND
	sup_num = @sup_num

	DELETE FROM property_assoc
	from property_assoc as pa
	with (nolock)
	join prop_supp_assoc as psa
	with (nolock)
	on pa.parent_prop_id = psa.prop_id
	and pa.prop_val_yr = psa.owner_tax_yr
	and pa.sup_num = psa.sup_num
	where parent_prop_id = @child_prop_id 
	AND child_prop_id = @parent_prop_id

GO


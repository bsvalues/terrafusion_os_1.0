
CREATE  PROCEDURE AddPropertyAssoc

	@parent_prop_id int,
	@child_prop_id int,
	@prop_val_yr numeric(4,0),
	@sup_num int,
	@link_type_cd varchar(5),
	@link_sub_type_cd varchar(5)

AS

	INSERT property_assoc 
	(parent_prop_id, child_prop_id, prop_val_yr, sup_num, link_type_cd, link_sub_type_cd) 
	values 
	(@parent_prop_id, @child_prop_id, @prop_val_yr, @sup_num, @link_type_cd, @link_sub_type_cd)

	INSERT property_assoc 
	(parent_prop_id, child_prop_id, prop_val_yr, sup_num, link_type_cd, link_sub_type_cd) 

	select @child_prop_id, @parent_prop_id, @prop_val_yr, psa.sup_num,
			@link_type_cd, @link_sub_type_cd
	from prop_supp_assoc as psa
	with (nolock)
	where owner_tax_yr = @prop_val_yr
	and prop_id = @child_prop_id

GO


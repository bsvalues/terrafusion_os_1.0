
-- This stored procedure copies property information to a new property.
-- Tables affected:
--	property
--	property_val
--	situs
--	entity_prop_assoc
--	property_exemption
--	property_special_entity_exemption
--	prop_supp_assoc
--	rendition
--	shared_prop
--	shared_prop_value
--
-- History:
-- TrentN	05/01/2004	Created
-- TrentN	07/02/2004	Added situs

CREATE PROCEDURE CopyPropertyToNewProperty
	@old_prop_id 		int,
	@old_sup_num 		int,
	@old_prop_val_yr 	numeric(4,0),
	@new_prop_id 		int,
	@new_sup_num 		int,
	@new_prop_val_yr 	numeric(4,0)
AS


if exists (
	select * from property where prop_id = @new_prop_id
)
begin
	return(0)
end


exec dbo.LayerCopyTableProperty @old_prop_id, @new_prop_id, 1


exec dbo.LayerCopyTablePropertyVal
	@old_prop_val_yr,
	@old_sup_num,
	@old_prop_id,
	@new_prop_val_yr,
	@new_sup_num,
	@new_prop_id,
	'CPTNP'


exec dbo.LayerCopyTableSitus @old_prop_id, @new_prop_id


exec dbo.LayerCopyTableEntityPropAssoc
	@old_prop_val_yr,
	@old_sup_num,
	@old_prop_id,
	@new_prop_val_yr,
	@new_sup_num,
	@new_prop_id


exec dbo.LayerCopyExemption
	@old_prop_val_yr,
	@old_sup_num,
	@old_prop_id,
	@new_prop_val_yr,
	@new_sup_num,
	@new_prop_id,
	null, -- All owners
	null, -- Same destination owner_id
	null, -- All exemption type codes
	0 -- Do not need to first check that the destination doesn't exist


-- prop_supp_assoc
-- may need to change to copy all supplements for the property
exec dbo.LayerSetPropSuppAssoc @new_prop_val_yr, @new_prop_id, @new_sup_num, 'ADD'


exec dbo.LayerCopyRendition
	@old_prop_val_yr,
	@old_sup_num,
	@old_prop_id,
	@new_prop_val_yr,
	@new_sup_num,
	@new_prop_id,
	1, 1 -- Skip pp_rendition_tracking & pp_rendition_prop_penalty* tables


exec dbo.LayerCopyShared
	@old_prop_val_yr,
	@old_sup_num,
	@old_prop_id,
	@new_prop_val_yr,
	@new_sup_num,
	@new_prop_id

GO


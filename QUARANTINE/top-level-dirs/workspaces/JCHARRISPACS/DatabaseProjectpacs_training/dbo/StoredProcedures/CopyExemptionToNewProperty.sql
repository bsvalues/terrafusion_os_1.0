

-- This stored procedure copies exemption information from one property-owner combination to
-- another property-owner combination.  The following tables are affected:
-- 	property_exemption
-- 	property_special_entity_exemption
-- 
-- History:
-- TrentN	05/01/2004	Created

CREATE PROCEDURE CopyExemptionToNewProperty
	@exempt_type_cd varchar(10),
	@old_owner_id int,
	@old_prop_id int,
	@old_sup_num int,
	@old_prop_val_yr numeric(4,0),
	@new_owner_id int,
	@new_prop_id int,
	@new_sup_num int,
	@new_prop_val_yr numeric(4,0)


AS


exec dbo.LayerCopyExemption
	-- From
	@old_prop_val_yr,
	@old_sup_num,
	@old_prop_id,
	-- To
	@new_prop_val_yr,
	@new_sup_num,
	@new_prop_id,
	@old_owner_id, -- Specific owner
	@new_owner_id, -- Destination owner_id
	@exempt_type_cd, -- Specific exemption type code
	1 -- Need to first check that the destination doesn't exist

declare @temp_owner_id int

SELECT top 1 @temp_owner_id = owner_id
FROM	imprv_exemption_assoc WITH (NOLOCK)
WHERE	prop_id 	= @old_prop_id AND 
	sup_num 	= @old_sup_num AND 
	prop_val_yr 	= @old_prop_val_yr AND
	exmpt_type_cd 	= @exempt_type_cd 

INSERT INTO imprv_exemption_assoc
	(
		prop_id, 
		sup_num, 
		prop_val_yr, 
		imprv_id, 
		sale_id, 
		entity_id, 
		exmpt_type_cd,
		owner_id,
		amount,
		exempt_pct,
		value_type
	)
	SELECT
	   	@new_prop_id, 
		@new_sup_num, 
		@new_prop_val_yr, 
		imprv_id, 
	   	sale_id, 
		entity_id, 
		exmpt_type_cd,
		@new_owner_id,
		amount,
		exempt_pct,
		value_type
	FROM	imprv_exemption_assoc WITH (NOLOCK)
	WHERE	prop_id 	= @old_prop_id AND 
		sup_num 	= @old_sup_num AND 
		prop_val_yr 	= @old_prop_val_yr AND
		exmpt_type_cd 	= @exempt_type_cd AND
		owner_id	= @temp_owner_id AND
	NOT EXISTS (
		SELECT 	*
		FROM 	imprv_exemption_assoc AS iea WITH (NOLOCK)
		WHERE 	iea.prop_id 		= @new_prop_id AND
			iea.sup_num 		= @new_sup_num AND
			iea.prop_val_yr 	= @new_prop_val_yr AND
			iea.owner_id 		= @new_owner_id AND
			iea.imprv_id		= imprv_exemption_assoc.imprv_id AND
			iea.exmpt_type_cd 	= @exempt_type_cd AND
			iea.entity_id		= imprv_exemption_assoc.entity_id
		)



SELECT top 1 @temp_owner_id = owner_id
FROM	land_exemption_assoc WITH (NOLOCK)
WHERE	prop_id 	= @old_prop_id AND 
	sup_num 	= @old_sup_num AND 
	prop_val_yr 	= @old_prop_val_yr AND
	exmpt_type_cd 	= @exempt_type_cd 

INSERT INTO land_exemption_assoc
	(
		prop_id, 
		sup_num, 
		prop_val_yr, 
		land_seg_id, 
		sale_id, 
		entity_id, 
		exmpt_type_cd,
		owner_id,
		amount,
		exempt_pct,
		value_type
	)
	SELECT
	   	@new_prop_id, 
		@new_sup_num, 
		@new_prop_val_yr, 
		land_seg_id, 
	   	sale_id, 
		entity_id, 
		exmpt_type_cd,
		@new_owner_id,
		amount,
		exempt_pct,
		value_type
	FROM	land_exemption_assoc WITH (NOLOCK)
	WHERE	prop_id 	= @old_prop_id AND 
		sup_num 	= @old_sup_num AND 
		prop_val_yr 	= @old_prop_val_yr AND
		exmpt_type_cd	= @exempt_type_cd AND
		owner_id	= @temp_owner_id AND
	NOT EXISTS (
		SELECT 	*
		FROM 	land_exemption_assoc AS lea WITH (NOLOCK)
		WHERE 	lea.prop_id 		= @new_prop_id AND
			lea.sup_num 		= @new_sup_num AND
			lea.prop_val_yr 	= @new_prop_val_yr AND
			lea.owner_id 		= @new_owner_id AND
			lea.land_seg_id		= land_exemption_assoc.land_seg_id AND
			lea.exmpt_type_cd 	= @exempt_type_cd AND
			lea.entity_id		= land_exemption_assoc.entity_id
	)


SELECT top 1 @temp_owner_id = owner_id
FROM	pers_prop_exemption_assoc WITH (NOLOCK)
WHERE	prop_id 	= @old_prop_id AND 
	sup_num 	= @old_sup_num AND 
	prop_val_yr 	= @old_prop_val_yr AND
	exmpt_type_cd 	= @exempt_type_cd 

INSERT INTO pers_prop_exemption_assoc
	(
		prop_id, 
		sup_num, 
		prop_val_yr, 
		pp_seg_id, 
		sale_id, 
		entity_id, 
		exmpt_type_cd,
		owner_id,
		amount,
		exempt_pct,
		value_type
	)
	SELECT
	   	@new_prop_id, 
		@new_sup_num, 
		@new_prop_val_yr, 
		pp_seg_id, 
	   	sale_id, 
		entity_id, 
		exmpt_type_cd,
		@new_owner_id,
		amount,
		exempt_pct,
		value_type
	FROM	pers_prop_exemption_assoc WITH (NOLOCK)
	WHERE	prop_id 	= @old_prop_id AND 
		sup_num 	= @old_sup_num AND 
		prop_val_yr 	= @old_prop_val_yr AND
		exmpt_type_cd 	= @exempt_type_cd AND
		owner_id	= @temp_owner_id AND
	NOT EXISTS (
		SELECT 	*
		FROM 	pers_prop_exemption_assoc AS ppea WITH (NOLOCK)
		WHERE 	ppea.prop_id 		= @new_prop_id AND
			ppea.sup_num 		= @new_sup_num AND
			ppea.prop_val_yr 	= @new_prop_val_yr AND
			ppea.owner_id 		= @new_owner_id AND
			ppea.pp_seg_id		= pers_prop_exemption_assoc.pp_seg_id AND
			ppea.exmpt_type_cd 	= @exempt_type_cd AND
			ppea.entity_id		= pers_prop_exemption_assoc.entity_id
	)

GO


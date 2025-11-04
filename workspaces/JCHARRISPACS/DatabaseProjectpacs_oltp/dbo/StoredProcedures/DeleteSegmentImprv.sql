

-- This stored procedure deletes all imprv data for an improvement segment (specified as a parameter).:
-- The following tables have data deleted:
-- 	imprv
--	imprv_detail
--	imprv_det_adj
--	imprv_adj
--	imprv_owner_assoc
--	imprv_entity_assoc
--	imprv_exemption_assoc
--  imprv_sketch
--  imprv_sketch_note
--  pacs_image
--	imprv_detail_cms_estimate
--	imprv_detail_cms_section
--	imprv_detail_cms_occupancy
--	imprv_detail_cms_component
--	imprv_detail_cms_addition

CREATE PROCEDURE DeleteSegmentImprv
	@seg_id int,
	@old_prop_id int,
	@old_sup_num int,
	@old_prop_val_yr numeric(4,0)
AS

-- imprv_detail_cms_addition
DELETE FROM imprv_detail_cms_addition
WHERE imprv_id = @seg_id AND
			prop_id = @old_prop_id AND
			sup_num = @old_sup_num AND
			prop_val_yr = @old_prop_val_yr

-- imprv_detail_cms_component
DELETE FROM imprv_detail_cms_component
WHERE imprv_id = @seg_id AND
			prop_id = @old_prop_id AND
			sup_num = @old_sup_num AND
			prop_val_yr = @old_prop_val_yr
			
-- imprv_detail_cms_occupancy
DELETE FROM imprv_detail_cms_occupancy
WHERE imprv_id = @seg_id AND
			prop_id = @old_prop_id AND
			sup_num = @old_sup_num AND
			prop_val_yr = @old_prop_val_yr
			
-- imprv_detail_cms_section
DELETE FROM imprv_detail_cms_section
WHERE imprv_id = @seg_id AND
			prop_id = @old_prop_id AND
			sup_num = @old_sup_num AND
			prop_val_yr = @old_prop_val_yr

-- imprv_detail_cms_estimate
DELETE FROM imprv_detail_cms_estimate
WHERE imprv_id = @seg_id AND
			prop_id = @old_prop_id AND
			sup_num = @old_sup_num AND
			prop_val_yr = @old_prop_val_yr
						
-- imprv_attr
DELETE FROM imprv_attr
WHERE imprv_id 		= @seg_id AND 
      prop_id 		= @old_prop_id AND
      sup_num		= @old_sup_num AND 
      prop_val_yr 	= @old_prop_val_yr

-- imprv_exemption_assoc
DELETE FROM imprv_exemption_assoc 
WHERE imprv_id 		= @seg_id AND 
      prop_id 		= @old_prop_id AND
      sup_num		= @old_sup_num AND 
      prop_val_yr 	= @old_prop_val_yr

-- imprv_entity_assoc
DELETE FROM imprv_entity_assoc 
WHERE imprv_id 		= @seg_id AND 
      prop_id 		= @old_prop_id AND
      sup_num		= @old_sup_num AND 
      prop_val_yr 	= @old_prop_val_yr

-- imprv_owner_assoc
DELETE FROM imprv_owner_assoc 
WHERE imprv_id 		= @seg_id AND 
      prop_id 		= @old_prop_id AND
      sup_num		= @old_sup_num AND 
      prop_val_yr 	= @old_prop_val_yr

-- imprv_adj
DELETE FROM imprv_adj 
WHERE imprv_id 		= @seg_id AND 
      prop_id 		= @old_prop_id AND
      sup_num		= @old_sup_num AND 
      prop_val_yr 	= @old_prop_val_yr

-- imprv_det_adj
DELETE FROM imprv_det_adj
WHERE imprv_id 		= @seg_id AND 
      prop_id 		= @old_prop_id AND
      sup_num		= @old_sup_num AND 
      prop_val_yr 	= @old_prop_val_yr

-- imprv_detail
DELETE FROM imprv_detail
WHERE imprv_id 		= @seg_id AND 
      prop_id 		= @old_prop_id AND
      sup_num		= @old_sup_num AND 
      prop_val_yr 	= @old_prop_val_yr

-- imprv_sketch_note
DELETE FROM imprv_sketch_note
WHERE imprv_id		= @seg_id AND
      prop_id		= @old_prop_id AND
      sup_num		= @old_sup_num AND
      prop_val_yr	= @old_prop_val_yr

-- imprv_sketch
DELETE FROM imprv_sketch
WHERE imprv_id		= @seg_id AND
      prop_id		= @old_prop_id AND
      sup_num		= @old_sup_num AND
      prop_val_yr	= @old_prop_val_yr

-- pacs_image
declare @location varchar(255)
declare @cmd varchar(4000)

declare imprv_images cursor fast_forward for
select location from pacs_image
where ref_type in ('SKTCH', 'PI')
and ref_id = @old_prop_id
and ref_id1 = @seg_id
and ref_id2 = @old_sup_num
and ref_year = @old_prop_val_yr

open imprv_images
fetch next from imprv_images into @location

while @@fetch_status = 0
begin
	set @cmd = 'del "' + @location + '"'
	exec xp_cmdshell @cmd
	fetch next from imprv_images into @location
end

close imprv_images
deallocate imprv_images

delete pacs_image
where ref_type in ('SKTCH', 'PI')
and ref_id = @old_prop_id
and ref_id1 = @seg_id
and ref_id2 = @old_sup_num
and ref_year = @old_prop_val_yr

-- property_exemption_dor_detail
delete from dbo.property_exemption_dor_detail
where exmpt_tax_yr = @old_prop_val_yr and
	owner_tax_yr = @old_prop_val_yr and
	sup_num = @old_sup_num and
	prop_id = @old_prop_id and
	item_type = 'I' and
	item_id = @seg_id

-- imprv
DELETE FROM imprv
WHERE imprv_id 		= @seg_id AND 
      prop_id 		= @old_prop_id AND
      sup_num		= @old_sup_num AND 
      prop_val_yr 	= @old_prop_val_yr

GO


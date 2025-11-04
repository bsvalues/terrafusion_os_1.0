

CREATE  PROCEDURE add_ov65_exemption
@prop_id as int,
@owner_id as int,
@sup_num as int, 
@owner_tax_yr as int,
@qualify_yr as int,
@msgout as varchar (256)OUTPUT 	-- return msg
AS
if exists -- check coding supplement 
(
SELECT * 
FROM [pacs_year]
WHERE [tax_yr] = @owner_tax_yr and [certification_dt] is not null
) and exists 
(
SELECT s.sup_group_id 
FROM supplement as s join sup_group as sg on s.sup_group_id = sg.sup_group_id 
WHERE s.sup_num = @sup_num and s.sup_tax_yr = @owner_tax_yr and sg.status_cd not in ('C', 'TO', 'P')
)
begin
	set @msgout = 'Exemption should not be added to a property in a certified year without coding supplement! '
	return 
end
else if exists -- check UDI Parent
(SELECT udi_parent 
FROM 	property_val
WHERE 	[udi_parent] = 'T' and [prop_id] = @prop_id and [prop_val_yr] = @owner_tax_yr and [sup_num] = @sup_num
)
begin
	set @msgout = 'Exemption should not be added to a UDI parent property! '
	return 
end
else if exists -- check OV65
( 
SELECT exmpt_type_cd 
FROM property_exemption 
WHERE [prop_id] = @prop_id and [owner_id] = @owner_id and [owner_tax_yr] = @owner_tax_yr and [sup_num] = @sup_num and [exmpt_type_cd] = 'OV65'
)
begin
	set @msgout = 'OV65 should not be added to a current OV65 holder! '
	return 
end
else if exists	-- check OV65S
(
SELECT exmpt_type_cd 
FROM property_exemption 
WHERE [prop_id] = @prop_id and [owner_id] = @owner_id and  [owner_tax_yr] = @owner_tax_yr and [sup_num] = @sup_num and [exmpt_type_cd] = 'OV65S'
)
	DELETE FROM [property_exemption] WHERE [prop_id] = @prop_id and [owner_id] = @owner_id and 
				[owner_tax_yr] = @owner_tax_yr and [sup_num] = @sup_num and [exmpt_type_cd] = 'OV65S'

-- grant Ov65 here
INSERT INTO [property_exemption]
(		[prop_id], [owner_id], [exmpt_tax_yr], [owner_tax_yr], [prop_type_cd], [exmpt_type_cd],
		[applicant_nm], [birth_dt], [spouse_birth_dt], [prop_exmpt_dl_num], [prop_exmpt_ss_num], [effective_dt],
		[termination_dt], [apply_pct_owner], [sup_num], [effective_tax_yr], [qualify_yr], [sp_date_approved],
		[sp_expiration_date], [sp_comment], [sp_value_type], [sp_value_option], [absent_flag], [absent_expiration_date],
		[absent_comment], [deferral_date], [apply_local_option_pct_only], [apply_no_exemption_amount] )
SELECT 	[prop_id], [owner_id], [exmpt_tax_yr], [owner_tax_yr], [prop_type_cd], 'OV65',
		[applicant_nm], [birth_dt], [spouse_birth_dt], [prop_exmpt_dl_num], [prop_exmpt_ss_num], [effective_dt],
		[termination_dt], [apply_pct_owner], [sup_num], @qualify_yr, @qualify_yr, [sp_date_approved],
		[sp_expiration_date], [sp_comment], [sp_value_type], [sp_value_option], [absent_flag], [absent_expiration_date],
		[absent_comment], [deferral_date], [apply_local_option_pct_only], [apply_no_exemption_amount] 
FROM 	[property_exemption] 
WHERE	[prop_id] = @prop_id and [owner_id] = @owner_id and [owner_tax_yr] = @owner_tax_yr and 
		[sup_num] = @sup_num and exmpt_type_cd = 'HS'

set @msgout = null
return

GO


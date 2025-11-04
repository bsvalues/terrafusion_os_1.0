




/****** History:
	Date		Who		Reason
	==========	====		=======================================
	10/05/2000	RAA		Make check for null state codes in pers_prop_seg and 
					prop_type_cd <> 'P', but vit_flag = 'T'
	10/07/2000	RAA		Fix typo PERS_PROP_SEGS instead of VIT.
*/

CREATE procedure ptd_prescan_codes

@input_yr 	numeric(4),
@input_cad_id	char(3)

as

--
-- This procedure will check the Entity codes and State Codes to make sure there are no errors
-- with the Taxing Unit Number on the Entities and the PTD State Code on the State Codes.
--

-- Declare Entity Chk variables
declare @ec_entity_id		int
declare @ec_entity_cd		varchar(5)
declare @ec_taxing_unit_num	varchar(10)
declare @ec_entity_type_cd	varchar(5)
declare @ec_ptd_multi_unit	varchar(1)

-- Declare State Chk variables
declare @sc_state_cd		varchar(5)
declare @sc_ptd_state_cd	varchar(5)

-- Declare Land Type Chk variables
declare @land_type_cd		varchar(5)
declare @state_land_type_desc	varchar(24)

-- Declare other variables
declare @prop_id		int
declare @prop_type_cd		varchar(5)
declare @message		varchar(150)

--
-- First delete all errors in the ptd_errors table
--

truncate table ptd_errors
--delete from ptd_errors where record_type = 'PTD'

declare ENTITY_CHK CURSOR FORWARD_ONLY
for 	select distinct entity_prop_assoc.entity_id,entity_cd,taxing_unit_num,entity_type_cd,ptd_multi_unit 
	from entity_prop_assoc,entity,tax_rate
	where entity_prop_assoc.entity_id = entity.entity_id
	and entity_prop_assoc.tax_yr = @input_yr
	and entity.entity_id = tax_rate.entity_id
	and tax_rate.tax_rate_yr = @input_yr
	and tax_rate.ptd_option = 'T'

OPEN ENTITY_CHK

FETCH NEXT FROM ENTITY_CHK into	@ec_entity_id,
					@ec_entity_cd,
					@ec_taxing_unit_num,
					@ec_entity_type_cd,
					@ec_ptd_multi_unit

while (@@FETCH_STATUS = 0)
begin

	if (@ec_taxing_unit_num not like '[0-9][0-9][0-9]-[0-9][0-9][0-9]-[0-9][0-9]')
	begin
		select @message = 'Entity ' + @ec_entity_cd + ': Invalid taxing unit number'
		exec ptd_insert_error 'PTD', 0, @ec_taxing_unit_num, @message
	end
	else
	begin
		if (isnull(@ec_taxing_unit_num,'') = '')
		begin
			select @message = 'Entity ' + @ec_entity_cd + ': Missing taxing unit number'
			exec ptd_insert_error 'PTD', 0, 'null', @message
		end
		else
		begin
			if (left(@ec_taxing_unit_num,3) <> @input_cad_id and (@ec_entity_type_cd = 'G' or @ec_entity_type_cd = 'C' or @ec_entity_type_cd = 'S'))
			begin
				select @message = 'Entity ' + @ec_entity_cd + ': First 3 digits must match CAD ID Code'
				exec ptd_insert_error 'PTD', 0, 'null', @message
			end
			if ((right(left(@ec_taxing_unit_num, 7), 3) <> '000') and (right(@ec_taxing_unit_num, 2) = '01'))
			begin
				select @message = 'Entity ' + @ec_entity_cd + ': Middle 3 digits must be 000'
				exec ptd_insert_error 'PTD', 0, 'null', @message
			end
			if (cast(right(@ec_taxing_unit_num, 2) as int) > 50)
			begin
				select @message = 'Entity ' + @ec_entity_cd + ': Last 2 digits must be between 02 and 50'
				exec ptd_insert_error 'PTD', 0, 'null', @message
			end
		end
	end

	if ((@ec_entity_type_cd = 'G' or @ec_entity_type_cd = 'R') and right(@ec_taxing_unit_num, 2) = '00')
	begin
		if (isnull(@ec_ptd_multi_unit,'') = '')
		begin
			select @message = 'Entity ' + @ec_entity_cd + ': Missing Multi-Taxing Unit indicator'
			exec ptd_insert_error 'PTD', 0, 'null', @message
		end
	end

	if (@ec_entity_type_cd = 'A' and right(@ec_taxing_unit_num,2) <> '01')
	begin
		select @message = 'Entity ' + @ec_entity_cd + ':  Incorrect taxing unit number'
		exec ptd_insert_error 'PTD', 0, 'null', @message
	end

	FETCH NEXT FROM ENTITY_CHK into	@ec_entity_id,
						@ec_entity_cd,
						@ec_taxing_unit_num,
						@ec_entity_type_cd,
						@ec_ptd_multi_unit
end

CLOSE ENTITY_CHK
DEALLOCATE ENTITY_CHK


--
-- Now check State Codes for PTD State Code
--


--
-- First check the ones used in imprv table
--

declare STATE_CD_IMPRV_CHK CURSOR FORWARD_ONLY
FOR select distinct imprv_state_cd, ptd_state_cd from imprv,state_code, ptd_supp_assoc
	where prop_val_yr = @input_yr
	and imprv.imprv_state_cd = state_code.state_cd
	and imprv.prop_id = ptd_supp_assoc.prop_id
	and imprv.sup_num = ptd_supp_assoc.sup_num
	and imprv.prop_val_yr = ptd_supp_assoc.sup_yr
OPEN STATE_CD_IMPRV_CHK

FETCH NEXT FROM STATE_CD_IMPRV_CHK  into	@sc_state_cd,
							@sc_ptd_state_cd

while (@@FETCH_STATUS = 0)
begin
	if (isnull(@sc_ptd_state_cd,'') = '')
	begin
		select @message = 'State Code: ' + @sc_state_cd + ' is missing PTD State Code'
		exec ptd_insert_error 'PTD', 0, 'null', @message
	end

	FETCH NEXT FROM STATE_CD_IMPRV_CHK into	@sc_state_cd,
								@sc_ptd_state_cd
end

CLOSE STATE_CD_IMPRV_CHK
DEALLOCATE STATE_CD_IMPRV_CHK


--
-- Next check the ones used in the land_detail table
--

declare STATE_CD_LAND_CHK CURSOR FORWARD_ONLY
FOR select distinct land_detail.state_cd, ptd_state_cd from land_detail,state_code, ptd_supp_assoc
	where prop_val_yr = @input_yr
	and land_detail.state_cd = state_code.state_cd
	and land_detail.prop_id = ptd_supp_assoc.prop_id
	and land_detail.sup_num = ptd_supp_assoc.sup_num
	and land_detail.prop_val_yr = ptd_supp_assoc.sup_yr

OPEN STATE_CD_LAND_CHK

FETCH NEXT FROM STATE_CD_LAND_CHK  into	@sc_state_cd,
							@sc_ptd_state_cd

while (@@FETCH_STATUS = 0)
begin
	if (isnull(@sc_ptd_state_cd,'') = '')
	begin
		select @message = 'State Code: ' + @sc_state_cd + ' is missing PTD State Code'
		exec ptd_insert_error 'PTD', 0, 'null', @message
	end

	FETCH NEXT FROM STATE_CD_LAND_CHK into	@sc_state_cd,
								@sc_ptd_state_cd
end

CLOSE STATE_CD_LAND_CHK
DEALLOCATE STATE_CD_LAND_CHK


--
-- Check the ones used in the pers_prop_seg table
--

declare STATE_CD_PP_CHK CURSOR FORWARD_ONLY
FOR select distinct pp_state_cd, ptd_state_cd from pers_prop_seg,state_code, ptd_supp_assoc
	where prop_val_yr = @input_yr
	and pp_state_cd = state_code.state_cd
	and pers_prop_seg.prop_id = ptd_supp_assoc.prop_id
	and pers_prop_seg.sup_num = ptd_supp_assoc.sup_num
	and pers_prop_seg.prop_val_yr = ptd_supp_assoc.sup_yr

OPEN STATE_CD_PP_CHK

FETCH NEXT FROM STATE_CD_PP_CHK  into	@sc_state_cd,
						@sc_ptd_state_cd

while (@@FETCH_STATUS = 0)
begin
	if (isnull(@sc_ptd_state_cd,'') = '')
	begin
		select @message = 'State Code: ' + @sc_state_cd + ' is missing PTD State Code'
		exec ptd_insert_error 'PTD', 0, 'null', @message
	end

	FETCH NEXT FROM STATE_CD_PP_CHK into	@sc_state_cd,
							@sc_ptd_state_cd
end

CLOSE STATE_CD_PP_CHK
DEALLOCATE STATE_CD_PP_CHK


--
-- Finally check the property for state codes
--

declare STATE_CD_PROP_CHK CURSOR FORWARD_ONLY
FOR select distinct property.state_cd, ptd_state_cd from property,property_val,state_code, ptd_supp_assoc
	where prop_val_yr = @input_yr
	and prop_inactive_dt is null
	and property_val.prop_id = property.prop_id
	and property.state_cd = state_code.state_cd
	and property_val.prop_id = ptd_supp_assoc.prop_id
	and property_val.sup_num = ptd_supp_assoc.sup_num
	and property_val.prop_val_yr = ptd_supp_assoc.sup_yr

OPEN STATE_CD_PROP_CHK

FETCH NEXT FROM STATE_CD_PROP_CHK  into	@sc_state_cd,
							@sc_ptd_state_cd

while (@@FETCH_STATUS = 0)
begin
	if (isnull(@sc_ptd_state_cd,'') = '')
	begin
		select @message = 'State Code: ' + @sc_state_cd + ' is missing PTD State Code'
		exec ptd_insert_error 'PTD', 0, 'null', @message
	end

	FETCH NEXT FROM STATE_CD_PROP_CHK into	@sc_state_cd,
								@sc_ptd_state_cd
end

CLOSE STATE_CD_PROP_CHK
DEALLOCATE STATE_CD_PROP_CHK


--
-- Now check Land Type codes
--


declare LAND_TYPE_CD CURSOR FORWARD_ONLY
FOR 	select distinct 	land_type.land_type_cd,
			land_type.state_land_type_desc
	from land_detail,land_type, ptd_supp_assoc
	where prop_val_yr = @input_yr
	and (land_detail.ag_use_cd = '1D' or land_detail.ag_use_cd = '1D1' or land_detail.ag_use_cd = 'TIM')
	and ag_apply = 'T'
	and land_detail.land_type_cd = land_type.land_type_cd
	and land_detail.sale_id = 0
	and land_detail.prop_id = ptd_supp_assoc.prop_id
	and land_detail.sup_num = ptd_supp_assoc.sup_num
	and land_detail.prop_val_yr = ptd_supp_assoc.sup_yr

OPEN LAND_TYPE_CD

FETCH NEXT FROM LAND_TYPE_CD into	@land_type_cd,
						@state_land_type_desc

while (@@FETCH_STATUS = 0)
begin
	if (isnull(@state_land_type_desc,'') = '')
	begin
		select @message = 'Land Type Code: ' + @land_type_cd + ' is missing a State Land Type Code'
		exec ptd_insert_error 'PTD', 0, 'null', @message
	end
	else
	begin
		if (len(@state_land_type_desc) <> 4)
		begin
			select @message = 'Land Type Code: ' + @land_type_cd + ' has an invalid State Land Type Code'
			exec ptd_insert_error 'PTD', 0, @state_land_type_desc, @message
		end
	end

	FETCH NEXT FROM LAND_TYPE_CD into	@land_type_cd,
							@state_land_type_desc
end

CLOSE LAND_TYPE_CD
DEALLOCATE LAND_TYPE_CD


declare PERS_PROP_SEGS CURSOR FORWARD_ONLY
FOR	select pers_prop_seg.prop_id 
	from pers_prop_seg, property_val, ptd_supp_assoc
	where pers_prop_seg.prop_id = property_val.prop_id
	and pers_prop_seg.prop_val_yr = property_val.prop_val_yr
	and pers_prop_seg.sup_num = pers_prop_seg.sup_num
	and property_val.prop_inactive_dt is null
	and pp_state_cd is null 
	and pers_prop_seg.prop_val_yr = @input_yr 
	and pp_active_flag = 'T'
	and pers_prop_seg.prop_id = ptd_supp_assoc.prop_id
	and pers_prop_seg.sup_num = ptd_supp_assoc.sup_num
	and pers_prop_seg.prop_val_yr = ptd_supp_assoc.sup_yr
	order by pers_prop_seg.prop_id

OPEN PERS_PROP_SEGS

FETCH NEXT FROM PERS_PROP_SEGS into	@prop_id

while (@@FETCH_STATUS = 0)
begin
	select @message = 'Missing state codes on personal property segment(s)'
	exec ptd_insert_error 'PTD', @prop_id, 'null', @message

	FETCH NEXT FROM PERS_PROP_SEGS into	@prop_id
end

CLOSE PERS_PROP_SEGS
DEALLOCATE PERS_PROP_SEGS



declare VIT CURSOR FORWARD_ONLY
FOR	select property_val.prop_id, property.prop_type_cd
	from property_val,property, ptd_supp_assoc
	where property_val.prop_id = property.prop_id
	and property_val.prop_inactive_dt is null
	and property_val.vit_flag = 'T'
	and property.prop_type_cd <> 'P'
	and property_val.prop_val_yr = @input_yr
	and property_val.prop_id = ptd_supp_assoc.prop_id
	and property_val.sup_num = ptd_supp_assoc.sup_num
	and property_val.prop_val_yr = ptd_supp_assoc.sup_yr
	order by property_val.prop_id

OPEN VIT

FETCH NEXT FROM VIT into	@prop_id, @prop_type_cd

while (@@FETCH_STATUS = 0)
begin
	select @message = 'VIT Property not coded as Personal Property'
	exec ptd_insert_error 'PTD', @prop_id, @prop_type_cd, @message

	FETCH NEXT FROM VIT into	@prop_id, @prop_type_cd
end

CLOSE VIT
DEALLOCATE VIT

GO


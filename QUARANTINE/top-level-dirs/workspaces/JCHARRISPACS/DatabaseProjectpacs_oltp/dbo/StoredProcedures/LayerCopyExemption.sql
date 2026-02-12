
create procedure LayerCopyExemption
	@lYear_From numeric(4,0),
	@lSupNum_From int,
	@lPropID_From int,
	@lYear_To numeric(4,0),
	@lSupNum_To int,
	@lPropID_To int,
	
	@lOwnerIDFrom int = null,
	/*
		Meaning:
			null		All exemptions
			not null	Exemptions on a specific owner
	*/
	@lOwnerIDTo int = null,
	/*
		Meaning:
			null		Same owner_id for destination
			not null	Different owner_id for destination
	*/
	@szExemptTypeCode varchar(10) = null,
	/*
		Meaning:
			null		All exemptions
			not null	A specific exemption
	*/
	
	@bFirstCheckDestinationExists bit = 0,
	@bDeleteViaProrateDate bit = 0
as

set nocount on

	insert dbo.property_exemption with(rowlock) (
		prop_id,
		owner_id,
		exmpt_tax_yr,
		owner_tax_yr,
		prop_type_cd,
		exmpt_type_cd,
		applicant_nm,
		birth_dt,
		spouse_birth_dt,
		prop_exmpt_dl_num,
		prop_exmpt_ss_num,
		effective_dt,
		termination_dt,
		apply_pct_owner,
		sup_num,
		effective_tax_yr,
		qualify_yr,
		sp_date_approved,
		sp_expiration_date,
		sp_comment,
		sp_value_type,
		sp_value_option,
		absent_flag,
		absent_expiration_date,
		absent_comment,
		deferral_date,
		apply_local_option_pct_only,
		apply_no_exemption_amount,
		exmpt_subtype_cd,
		exemption_pct,
		combined_disp_income,
		exempt_qualify_cd,
		review_last_year,
		dor_value_type,
		dor_exmpt_amount,
		dor_exmpt_percent
	)
	select
		@lPropID_To,
		/* owner_id = */ case when @lOwnerIDTo is not null then @lOwnerIDTo else pe.owner_id end,
		@lYear_To,
		@lYear_To,
		prop_type_cd,
		exmpt_type_cd,
		applicant_nm,
		birth_dt,
		spouse_birth_dt,
		prop_exmpt_dl_num,
		prop_exmpt_ss_num,
		effective_dt,
		termination_dt,
		apply_pct_owner,
		@lSupNum_To,
		effective_tax_yr,
		qualify_yr,
		sp_date_approved,
		sp_expiration_date,
		sp_comment,
		sp_value_type,
		sp_value_option,
		absent_flag,
		absent_expiration_date,
		absent_comment,
		deferral_date,
		apply_local_option_pct_only,
		apply_no_exemption_amount,
		exmpt_subtype_cd,
		exemption_pct,
		combined_disp_income,
		exempt_qualify_cd,
		review_last_year,
		dor_value_type,
		dor_exmpt_amount,
		dor_exmpt_percent
	from dbo.property_exemption as pe with(nolock)
	where
		pe.exmpt_tax_yr = @lYear_From and
		pe.owner_tax_yr = @lYear_From and
		pe.sup_num = @lSupNum_From and
		pe.prop_id = @lPropID_From and
		(@lOwnerIDFrom is null or pe.owner_id = @lOwnerIDFrom) and
		(@szExemptTypeCode is null or pe.exmpt_type_cd = @szExemptTypeCode) and
		(
			@bFirstCheckDestinationExists = 0
			or
			not exists (
				select peto.exmpt_tax_yr
				from dbo.property_exemption as peto with(nolock)
				where
					peto.exmpt_tax_yr = @lYear_To and
					peto.owner_tax_yr = @lYear_To and
					peto.sup_num = @lSupNum_To and
					peto.prop_id = @lPropID_To and
					peto.owner_id = case when @lOwnerIDTo is not null then @lOwnerIDTo else pe.owner_id end and
					peto.exmpt_type_cd = pe.exmpt_type_cd
			)
		)


	if ( @@rowcount = 0 )
	begin
		-- If nothing was copied, we can skip the rest of the tables
		return(0)
	end
	
	insert dbo.property_exemption_income with(rowlock) (
		exmpt_tax_yr,
		owner_tax_yr,
		sup_num,
		prop_id,
		owner_id,
		exmpt_type_cd,
		inc_id,
		active,
		income_year,
		created_date,
		created_by_id,
		tax_return,
		deny_exemption,
		comment
	)
	select
		@lYear_To,
		@lYear_To,
		@lSupNum_To,
		@lPropID_To,
		/* owner_id = */ case when @lOwnerIDTo is not null then @lOwnerIDTo else pei.owner_id end,
		exmpt_type_cd,
		inc_id,
		active,
		income_year,
		created_date,
		created_by_id,
		tax_return,
		deny_exemption,
		comment
	from dbo.property_exemption_income as pei with(nolock)
	where
		pei.exmpt_tax_yr = @lYear_From and
		pei.owner_tax_yr = @lYear_From and
		pei.sup_num = @lSupNum_From and
		pei.prop_id = @lPropID_From and
		(@lOwnerIDFrom is null or pei.owner_id = @lOwnerIDFrom) and
		(@szExemptTypeCode is null or pei.exmpt_type_cd = @szExemptTypeCode) and
		pei.active = 1 and
		(
			@bFirstCheckDestinationExists = 0
			or
			not exists (
				select peto.exmpt_tax_yr
				from dbo.property_exemption_income as peto with(nolock)
				where
					peto.exmpt_tax_yr = @lYear_To and
					peto.owner_tax_yr = @lYear_To and
					peto.sup_num = @lSupNum_To and
					peto.prop_id = @lPropID_To and
					peto.owner_id = case when @lOwnerIDTo is not null then @lOwnerIDTo else pei.owner_id end and
					peto.exmpt_type_cd = pei.exmpt_type_cd
			)
		)
		
	insert dbo.property_exemption_income_detail with(rowlock) (
		exmpt_tax_yr,
		owner_tax_yr,
		sup_num,
		prop_id,
		owner_id,
		exmpt_type_cd,
		inc_id,
		inc_detail_id,
		id_flag,
		code,
		amount
	)
	select
		@lYear_To,
		@lYear_To,
		@lSupNum_To,
		@lPropID_To,
		/* owner_id = */ case when @lOwnerIDTo is not null then @lOwnerIDTo else peid.owner_id end,
		peid.exmpt_type_cd,
		peid.inc_id,
		peid.inc_detail_id,
		peid.id_flag,
		peid.code,
		peid.amount
	from dbo.property_exemption_income as pei with(nolock)
	join dbo.property_exemption_income_detail as peid
	on pei.exmpt_tax_yr = peid.exmpt_tax_yr
	and pei.owner_tax_yr = peid.owner_tax_yr
	and pei.sup_num = peid.sup_num
	and pei.prop_id = peid.prop_id
	and pei.owner_id = peid.owner_id
	and pei.exmpt_type_cd = peid.exmpt_type_cd
	and pei.inc_id = peid.inc_id
	where 
		pei.exmpt_tax_yr = @lYear_From and
		pei.owner_tax_yr = @lYear_From and
		pei.sup_num = @lSupNum_From and
		pei.prop_id = @lPropID_From and
		(@lOwnerIDFrom is null or pei.owner_id = @lOwnerIDFrom) and
		(@szExemptTypeCode is null or pei.exmpt_type_cd = @szExemptTypeCode) and
		pei.active = 1 and
		(
			@bFirstCheckDestinationExists = 0
			or
			not exists (
				select peto.exmpt_tax_yr
				from dbo.property_exemption_income_detail as peto with(nolock)
				where
					peto.exmpt_tax_yr = @lYear_To and
					peto.owner_tax_yr = @lYear_To and
					peto.sup_num = @lSupNum_To and
					peto.prop_id = @lPropID_To and
					peto.owner_id = case when @lOwnerIDTo is not null then @lOwnerIDTo else pei.owner_id end and
					peto.exmpt_type_cd = pei.exmpt_type_cd
			)
		)

	insert dbo.property_exemption_dor_detail with(rowlock) (
		exmpt_tax_yr,
		owner_tax_yr,
		sup_num,
		prop_id,
		owner_id,
		exmpt_type_cd,
		item_type,
		item_id,
		value_type,
		exmpt_amount,
		exmpt_percent
	)
	select
		@lYear_To,
		@lYear_To,
		@lSupNum_To,
		@lPropID_To,
		/* owner_id = */ case when @lOwnerIDTo is not null then @lOwnerIDTo else pedd.owner_id end,
		exmpt_type_cd,
		item_type,
		item_id,
		value_type,
		exmpt_amount,
		exmpt_percent
	from dbo.property_exemption_dor_detail as pedd with(nolock)
	where
		pedd.exmpt_tax_yr = @lYear_From and
		pedd.owner_tax_yr = @lYear_From and
		pedd.sup_num = @lSupNum_From and
		pedd.prop_id = @lPropID_From and
		(@lOwnerIDFrom is null or pedd.owner_id = @lOwnerIDFrom) and
		(@szExemptTypeCode is null or pedd.exmpt_type_cd = @szExemptTypeCode) and
		(
			@bFirstCheckDestinationExists = 0
			or
			not exists (
				select peto.exmpt_tax_yr
				from dbo.property_exemption_dor_detail as peto with(nolock)
				where
					peto.exmpt_tax_yr = @lYear_To and
					peto.owner_tax_yr = @lYear_To and
					peto.sup_num = @lSupNum_To and
					peto.prop_id = @lPropID_To and
					peto.owner_id = case when @lOwnerIDTo is not null then @lOwnerIDTo else pedd.owner_id end and
					peto.exmpt_type_cd = pedd.exmpt_type_cd
			)
		)
		
	insert dbo.property_freeze with(rowlock) (
		prop_id,
		owner_id,
		exmpt_tax_yr,
		owner_tax_yr,
		sup_num,
		entity_id,
		exmpt_type_cd,
		use_freeze,
		transfer_dt,
		prev_tax_due,
		prev_tax_nofrz,
		freeze_yr,
		freeze_ceiling,
		transfer_pct,
		transfer_pct_override,
		pacs_freeze,
		pacs_freeze_date,
		pacs_freeze_ceiling,
		pacs_freeze_run,
		freeze_override
	)
	select
		@lPropID_To,
		/* owner_id = */ case when @lOwnerIDTo is not null then @lOwnerIDTo else pf.owner_id end,
		@lYear_To,
		@lYear_To,
		@lSupNum_To,
		pf.entity_id,
		pf.exmpt_type_cd,
		pf.use_freeze,
		pf.transfer_dt,
		pf.prev_tax_due,
		pf.prev_tax_nofrz,
		pf.freeze_yr,
		pf.freeze_ceiling,
		pf.transfer_pct,
		pf.transfer_pct_override,
		pf.pacs_freeze,
		pf.pacs_freeze_date,
		pf.pacs_freeze_ceiling,
		pf.pacs_freeze_run,
		pf.freeze_override
	from dbo.property_freeze as pf with(nolock)
	join dbo.entity_exmpt as ee with(nolock) on
		ee.exmpt_tax_yr = @lYear_To and
		ee.entity_id = pf.entity_id and
		ee.exmpt_type_cd = pf.exmpt_type_cd and
		ee.freeze_flag = 1
	join dbo.entity_prop_assoc as epa with(nolock) on
		epa.tax_yr = @lYear_To and
		epa.sup_num = @lSupNum_To and
		epa.prop_id = @lPropID_To and
		epa.entity_id = pf.entity_id
	where
		pf.exmpt_tax_yr = @lYear_From and
		pf.owner_tax_yr = @lYear_From and
		pf.sup_num = @lSupNum_From and
		pf.prop_id = @lPropID_From and
		(@lOwnerIDFrom is null or pf.owner_id = @lOwnerIDFrom) and
		(@szExemptTypeCode is null or pf.exmpt_type_cd = @szExemptTypeCode) and
		(
			@bFirstCheckDestinationExists = 0
			or
			not exists (
				select pfto.exmpt_tax_yr
				from dbo.property_freeze as pfto with(nolock)
				where
					pfto.exmpt_tax_yr = @lYear_To and
					pfto.owner_tax_yr = @lYear_To and
					pfto.sup_num = @lSupNum_To and
					pfto.prop_id = @lPropID_To and
					pfto.owner_id = case when @lOwnerIDTo is not null then @lOwnerIDTo else pf.owner_id end and
					pfto.entity_id = pf.entity_id and
					pfto.exmpt_type_cd = pf.exmpt_type_cd
			)
		)


	insert dbo.property_special_entity_exemption with(rowlock) (
		prop_id,
		owner_id,
		sup_num,
		exmpt_tax_yr,
		owner_tax_yr,
		exmpt_type_cd,
		entity_id,
		sp_amt,
		sp_pct,
		exmpt_amt,
		sp_value_type,
		sp_value_option,
		sp_segment_amt
	)
	select
		@lPropID_To,
		/* owner_id = */ case when @lOwnerIDTo is not null then @lOwnerIDTo else psee.owner_id end,
		@lSupNum_To,
		@lYear_To,
		@lYear_To,
		psee.exmpt_type_cd,
		psee.entity_id,
		psee.sp_amt,
		psee.sp_pct,
		psee.exmpt_amt,
		psee.sp_value_type,
		psee.sp_value_option,
		psee.sp_segment_amt
	from dbo.property_special_entity_exemption as psee with(nolock)
	join dbo.entity_prop_assoc as epa with(nolock) on
		epa.tax_yr = @lYear_To and
		epa.sup_num = @lSupNum_To and
		epa.prop_id = @lPropID_To and
		epa.entity_id = psee.entity_id
	where
		psee.exmpt_tax_yr = @lYear_From and
		psee.owner_tax_yr = @lYear_From and
		psee.sup_num = @lSupNum_From and
		psee.prop_id = @lPropID_From and
		(@lOwnerIDFrom is null or psee.owner_id = @lOwnerIDFrom) and
		(@szExemptTypeCode is null or psee.exmpt_type_cd = @szExemptTypeCode) and
		(
			@bFirstCheckDestinationExists = 0
			or
			not exists (
				select pseeto.exmpt_tax_yr
				from dbo.property_special_entity_exemption as pseeto with(nolock)
				where
					pseeto.exmpt_tax_yr = @lYear_To and
					pseeto.owner_tax_yr = @lYear_To and
					pseeto.sup_num = @lSupNum_To and
					pseeto.prop_id = @lPropID_To and
					pseeto.owner_id = case when @lOwnerIDTo is not null then @lOwnerIDTo else psee.owner_id end and
					pseeto.entity_id = psee.entity_id and
					pseeto.exmpt_type_cd = psee.exmpt_type_cd
			)
		)

	
	if ( @bDeleteViaProrateDate = 1 )
	begin
		declare @dtProrateDelete datetime
		if ( @lYear_To = 0 )
		begin
			declare @lFutureYear numeric(4,0)
			select @lFutureYear = future_yr
			from pacs_system with(nolock)

			set @dtProrateDelete = convert(varchar(4), @lFutureYear) + '-01-01'
		end
		else
		begin
			set @dtProrateDelete = convert(varchar(4), @lYear_To) + '-01-01'
		end

		delete property_exemption with(rowlock)
		where
			exmpt_tax_yr = @lYear_To and
			owner_tax_yr = @lYear_To and
			sup_num = @lSupNum_To and
			prop_id = @lPropID_To and
			(@lOwnerIDFrom is null or owner_id = @lOwnerIDFrom) and
			(@szExemptTypeCode is null or exmpt_type_cd = @szExemptTypeCode) and
			termination_dt < @dtProrateDelete
	end

	return(0)

GO



create procedure DORAssessedValue
	@dataset_id int,
	@dataset_id_asof bigint,
	@year numeric(4,0),
	@tax_areas varchar(max)

as


set nocount on




	-- Just to be sure clear out all temporary tables with the specified dataset id
	delete ##dor_report_header where dataset_id = @dataset_id
	delete ##dor_report where dataset_id = @dataset_id
	delete ##dor_report_prop_assoc where dataset_id = @dataset_id
	delete ##dor_report_general where dataset_id = @dataset_id
	delete ##dor_report_real where dataset_id = @dataset_id
	delete ##dor_report_personal where dataset_id = @dataset_id
	delete ##dor_report_real_by_land_use where dataset_id = @dataset_id
	delete ##dor_pp_seg_max where dataset_id = @dataset_id

    insert into ##dor_report_header
    select distinct @dataset_id, eqc.exemption_code, income_min, income_max from ##as_of asof
    inner join exmpt_qualify_code eqc on
    asof.year = eqc.year
    where  asof.dataset_id = @dataset_id_asof

	declare @combine_DFL_timber_values char(1)
	select @Combine_DFL_Timber_Values = 
		szConfigValue
		from pacs_config
		where szGroup = 'DORAssessedValueReport' 
		and szConfigName = 'Combine_DFL_Timber_Values'
		
	declare @Assess_Using_GEO_ID char(1)
	select @Assess_Using_GEO_ID = 
		szConfigValue
		from pacs_config
		where szGroup = 'DORAssessedValueReport' 
		and szConfigName = 'Assess_Using_GEO_ID'

	-- The county will be retrieved from the system address table
	insert ##dor_report
	(dataset_id, [year], county_name, tax_area_list, Assess_Using_GEO_ID)
	select @dataset_id, @year, sa.county_name, @tax_areas, @Assess_Using_GEO_ID
	from system_address as sa with(nolock)
	where system_type = 'A'

	declare @sql varchar(max)

	---- calculate facility new values
	declare @facility_imprv_value numeric(14,0)
	declare @facility_land_value numeric(14,0)
	declare @facility_personal_value numeric(14,0)
	
	declare @current_use_agreements int
	declare @new_current_use_agreements int	
	
	declare @other_imprv_freeze	numeric(14,0)
	declare @other_imprv_nonfreeze	numeric(14,0)
	declare @other_imprv	numeric(14,0)
	declare @other_senior	numeric(14,0)	
	
	declare @dfl_market_land_levy2	numeric(14,0)
	declare @osp_land_levy2	numeric(14,0)
	declare @ag_land_levy2	numeric(14,0)
	declare @tim_land_levy2	numeric(14,0)
	declare @other_land_levy2 numeric(14,0)
	declare @other_imprv_levy2 numeric(14,0)
	declare @other_senior_levy2 numeric(14,0)
	declare @other_total_levy2 numeric(14,0)
	declare @total_land_levy2 numeric(14,0)
	declare @total_imprv_levy2 numeric(14,0)
	declare @total_senior_levy2 numeric(14,0)
	declare @total_total_levy2 numeric(14,0)	
	
	
	declare @ag_me_local_count		int
	declare @ag_me_local_mkt_val	numeric(14,0)
	declare @ag_me_state_count		int
	declare @ag_me_state_mkt_val	numeric(14,0)
	declare @industrial_me_count	int
	declare @industrial_me_mkt_val	numeric(14,0)
	declare @other_me_count			int
	declare @other_me_mkt_val		numeric(14,0)
	declare @supplies_count			int
	declare @supplies_mkt_val		numeric(14,0)
	declare @franchise_count		int
	declare @franchise_mkt_val		numeric(14,0)
	declare @taxable_imprv_count	int
	declare @taxable_imprv_mkt_val	numeric(14,0)
	declare @misc_pers_prop_count	int
	declare @misc_pers_prop_mkt_val	numeric(14,0)
	declare @hof_exempt_count		int
	declare @hof_exempt_amount		numeric(14,0)
	declare @u500_exempt_count		int
	declare @u500_exempt_amount		numeric(14,0)
	declare @dor_exempt_amount		numeric(14,0)
	
	declare @taxable_imprv_count_levy2		int
	declare @taxable_imprv_mkt_val_levy2	numeric(14,0)
	declare @misc_pers_prop_count_levy2	int
	declare @misc_pers_prop_mkt_val_levy2	numeric(14,0)
	declare @hof_exempt_count_levy2		int
	declare @hof_exempt_amount_levy2		numeric(14,0)
	declare @u500_exempt_count_levy2		int
	declare @u500_exempt_amount_levy2		numeric(14,0)
	
	
	declare @single_family_count		int
	declare @single_family_land			numeric(14,0)
	declare @single_family_imprv		numeric(14,0)
	declare @single_family_exempt		numeric(14,0)
	declare @multi_family_count			int
	declare @multi_family_land			numeric(14,0)
	declare @multi_family_imprv			numeric(14,0)
	declare @multi_family_exempt		numeric(14,0)
	declare @manufacturing_count		int
	declare @manufacturing_land			numeric(14,0)
	declare @manufacturing_imprv		numeric(14,0)
	declare @manufacturing_exempt		numeric(14,0)
	declare @commercial_count			int
	declare @commercial_land			numeric(14,0)
	declare @commercial_imprv			numeric(14,0)
	declare @commercial_exempt			numeric(14,0)
	declare @ag_real_count				int
	declare @ag_real_land				numeric(14,0)
	declare @ag_real_imprv				numeric(14,0)
	declare @ag_real_exempt				numeric(14,0)
	declare @other_real_count			int
	declare @other_real_land			numeric(14,0)
	declare @other_real_imprv			numeric(14,0)
	declare @other_real_exempt			numeric(14,0)

	declare @u500_real_count			int
	declare @u500_real_land				numeric(14,0)
	declare @u500_real_imprv			numeric(14,0)
	declare @u500_real_exempt			numeric(14,0)	
	
	declare @single_family_exempt_levy2	numeric(14,0)
	declare @multi_family_exempt_levy2		numeric(14,0)
	declare @manufacturing_exempt_levy2	numeric(14,0)
	declare @commercial_exempt_levy2		numeric(14,0)
	declare @ag_real_exempt_levy2				numeric(14,0)
	declare @other_real_exempt_levy2			numeric(14,0)
	
	declare @u500_real_exempt_levy2			numeric(14,0)	
	

	--declare @dfl_imprv	numeric(14,0)

	
	declare @osp_imprv_freeze	numeric(14,0)
	declare @osp_imprv_nonfreeze	numeric(14,0)
	declare @osp_imprv	numeric(14,0)
	

	declare @ag_imprv_freeze	numeric(14,0)
	declare @ag_imprv_nonfreeze	numeric(14,0)
	declare @ag_imprv	numeric(14,0)
		
	
	declare @dfl_senior	numeric(14,0)
	declare @dfl_senior_levy2 numeric(14,0)	

	declare @dfl_senior_adjust	numeric(14,0) -- holds values to be applied afterwards since not directly accessible
	declare @dfl_senior_levy2_adjust numeric(14,0) -- holds values to be applied afterwards since not directly accessible

	declare @osp_senior	numeric(14,0)
	declare @osp_senior_levy2 numeric(14,0)	
	
	declare @ag_senior	numeric(14,0)
	declare @ag_senior_levy2 numeric(14,0)		
	
	declare @tim_senior	numeric(14,0)
	declare @tim_senior_levy2 numeric(14,0)		
			
	/*
		Establish ##dor_report_prop_assoc
		This table will be used to join into the various tables to pull the correct version of the 
		property information.  This will also exclude any unnecessary properties from being included 
		in the report.
	*/


	/*
		TFS#36626 - Allow option to report UDI by parcel # (geo ID) for DOR Abstract Report and Stratification report
		Real property assessments (page 2) only impacts acres by deducting duplicate acres from duplicate GEO ID groups so those are run first
		Because Personal Properties (page 3) are not impacted by GEO ID that page will be executed second
		The other pages are subsequently in either the PROPERTY section or the GEO ID section
		Because the population of ##dor_report_prop_assoc is commong for Personal Property but different for other types
			that table will be populated for page 3 then the contents rebuilt for the GEO ID data
	*/

	
	set @sql = '
	insert ##dor_report_prop_assoc
	(dataset_id, prop_id, sup_num, prop_val_yr, u500_flag, snr_flag)

	select ' + convert(varchar(24), @dataset_id) + ', asof.prop_id, asof.sup_num, asof.year,
	case when wpoe_u500.prop_id is not null then 1 else 0 end,
	case when wpoe_snr.prop_id is not null then 1 else 0 end
	from ##as_of as asof with(nolock)
	join property_val as pv with(nolock) on
		pv.prop_val_yr = asof.year and
		pv.sup_num = asof.sup_num and
		pv.prop_id = asof.prop_id
	join property as p with(nolock) on
		p.prop_id = asof.prop_id
	join property_tax_area as pta with(nolock) on
		pv.prop_val_yr = pta.year and
		pv.sup_num = pta.sup_num and
		pv.prop_id = pta.prop_id
	join tax_area as ta with(nolock) on
		pta.tax_area_id = ta.tax_area_id
	left outer join property_sub_type as pst with(nolock) on
		pv.sub_type = pst.property_sub_cd
	left outer join wash_prop_owner_exemption as wpoe_u500 with(nolock) on
		wpoe_u500.year = asof.year and
		wpoe_u500.sup_num = asof.sup_num and
		wpoe_u500.prop_id = asof.prop_id and
		wpoe_u500.exmpt_type_cd = ''U500''
	left outer join wash_prop_owner_exemption as wpoe_snr with(nolock) on
		wpoe_snr.year = asof.year and
		wpoe_snr.sup_num = asof.sup_num and
		wpoe_snr.prop_id = asof.prop_id and
		wpoe_snr.exmpt_type_cd = ''SNR/DSBL''
	left outer join wash_prop_owner_exemption as wpoe_ex with(nolock) on
		wpoe_ex.year = asof.year and
		wpoe_ex.sup_num = asof.sup_num and
		wpoe_ex.prop_id = asof.prop_id and
		wpoe_ex.exmpt_type_cd = ''EX''
	left outer join wash_prop_owner_exemption as wpoe_exempt with(nolock) on
		wpoe_exempt.year = asof.year and
		wpoe_exempt.sup_num = asof.sup_num and
		wpoe_exempt.prop_id = asof.prop_id and
		wpoe_exempt.exmpt_type_cd = ''DOR''
	where asof.dataset_id = ' + convert(varchar(24), @dataset_id_asof) + '
	and pv.prop_inactive_dt is null
	and isnull(pv.prop_state, '''') <> ''P''
	and isnull(p.reference_flag, '''') <> ''T''
	and isnull(pst.state_assessed_utility, 0) = 0
	and isnull(pst.local_assessed_utility, 0) = 0
	and wpoe_ex.prop_id is null
	'

	if ( @tax_areas <> '<All>' and @tax_areas <> '' )
	begin
		set @sql = @sql + 'and ta.tax_area_number in (' + @tax_areas + ')'
	end
	
	exec(@sql)




		-------------------------------------------------------------------------------
		-- BEGIN PAGE 3
		-------------------------------------------------------------------------------



	set @ag_me_local_count		= 0
	set @ag_me_local_mkt_val	= 0
	set @ag_me_state_count		= 0
	set @ag_me_state_mkt_val	= 0
	set @industrial_me_count	= 0
	set @industrial_me_mkt_val	= 0
	set @other_me_count			= 0
	set @other_me_mkt_val		= 0
	set @supplies_count			= 0
	set @supplies_mkt_val		= 0
	set @franchise_count		= 0
	set @franchise_mkt_val		= 0
	set @taxable_imprv_count	= 0
	set @taxable_imprv_mkt_val	= 0
	set @misc_pers_prop_count	= 0
	set @misc_pers_prop_mkt_val	= 0
	set @hof_exempt_count		= 0
	set @hof_exempt_amount		= 0
	set @u500_exempt_count		= 0
	set @u500_exempt_amount		= 0
	set @dor_exempt_amount		= 0

	set @taxable_imprv_count_levy2	= 0
	set @taxable_imprv_mkt_val_levy2	= 0
	set @misc_pers_prop_count_levy2	= 0
	set @misc_pers_prop_mkt_val_levy2	= 0
	set @hof_exempt_count_levy2		= 0
	set @hof_exempt_amount_levy2		= 0
	set @u500_exempt_count_levy2		= 0
	set @u500_exempt_amount_levy2		= 0
	
	select
		identity(int,0,1) as id, 
		pps.prop_id,
		ppt.asset_listing_type_cd,
		isnull(pps.farm_asset,0) as farm_asset,
		sum(isnull(case pv.appr_method when 'C' then pps.pp_mkt_val when 'D' then pps.dist_val when 'A' then pps.arb_val end, 0)) as mkt_val
	into #dor_pp_seg_temp
	from ##dor_report_prop_assoc as drpa with(nolock)
	join pers_prop_seg as pps with(nolock) on
		drpa.prop_val_yr = pps.prop_val_yr
		and drpa.sup_num = pps.sup_num
		and drpa.prop_id = pps.prop_id
		and pps.pp_active_flag = 'T'
	join pp_type as ppt with(nolock) on
		pps.pp_type_cd = ppt.pp_type_cd
	join wash_prop_owner_val wpov with(nolock) on
		drpa.prop_val_yr = wpov.year
		and drpa.sup_num = wpov.sup_num
		and drpa.prop_id = wpov.prop_id
	join property_val as pv with(nolock) on
		pv.prop_val_yr = pps.prop_val_yr and
		pv.sup_num = pps.sup_num and
		pv.prop_id = pps.prop_id
	where drpa.dataset_id = @dataset_id and drpa.u500_flag = 0
	group by pps.prop_id, ppt.asset_listing_type_cd, pps.farm_asset
	order by pps.prop_id, ppt.asset_listing_type_cd, pps.farm_asset


	select prop_id, asset_listing_type_cd, farm_asset, mkt_val
	into #dor_pp_seg_max_temp
	from #dor_pp_seg_temp dps
	where id in (
		select top 1 id
		from #dor_pp_seg_temp dps1
		where dps.prop_id = dps1.prop_id
		order by mkt_val desc, dps1.id asc
	)


	insert into ##dor_pp_seg_max (dataset_id, prop_id, asset_listing_type_cd, farm_asset, mkt_val)
	select @dataset_id, prop_id, asset_listing_type_cd, 0 as farm_asset, sum(mkt_val)
	from #dor_pp_seg_max_temp
	where asset_listing_type_cd <> 'A'
	group by prop_id, asset_listing_type_cd

	insert into ##dor_pp_seg_max (dataset_id, prop_id, asset_listing_type_cd, farm_asset, mkt_val)
	select @dataset_id, prop_id, asset_listing_type_cd, farm_asset, sum(mkt_val)
	from #dor_pp_seg_max_temp
	where asset_listing_type_cd = 'A'
	group by prop_id, asset_listing_type_cd, farm_asset

	drop table #dor_pp_seg_temp
	drop table #dor_pp_seg_max_temp


	select
			@ag_me_local_count = sum(case when isnull(asset_listing_type_cd,'') = 'A'then 1 else 0 end),
			@ag_me_state_count = sum(case when isnull(asset_listing_type_cd,'') = 'A' and isnull(farm_asset,0) = 0 then 1 else 0 end),
			@industrial_me_count = sum(case when isnull(asset_listing_type_cd,'') = 'I' then 1 else 0 end),
			@other_me_count = sum(case when isnull(asset_listing_type_cd,'') = 'O' then 1 else 0 end),
			@supplies_count = sum(case when isnull(asset_listing_type_cd,'') = 'S' then 1 else 0 end),
			@franchise_count = sum(case when isnull(asset_listing_type_cd,'') = 'F' then 1 else 0 end),
			@taxable_imprv_count = sum(case when isnull(asset_listing_type_cd,'') = 'T' then 1 else 0 end),
			@misc_pers_prop_count = sum(case when isnull(asset_listing_type_cd,'') = 'P' then 1 else 0 end)		
	from ##dor_pp_seg_max with(nolock)
	where dataset_id = @dataset_id

	select
			@taxable_imprv_count_levy2 = sum(case when isnull(asset_listing_type_cd,'') = 'T' then 1 else 0 end),
			@misc_pers_prop_count_levy2 = sum(case when isnull(asset_listing_type_cd,'') = 'P' then 1 else 0 end)			
	from ##dor_pp_seg_max with(nolock)
		join ##dor_report_prop_assoc as drpa on
			##dor_pp_seg_max.dataset_id = drpa.dataset_id and
			##dor_pp_seg_max.prop_id = drpa.prop_id
	
					join (
						select distinct drpa.prop_id, drpa.prop_val_yr, drpa.sup_num
						from ##dor_report_prop_assoc drpa
						join wash_prop_owner_tax_district_assoc wpotda
						on drpa.prop_id = wpotda.prop_id and
						drpa.sup_num = wpotda.sup_num and
						drpa.prop_val_yr = wpotda.year
						join levy l
						on l.tax_district_id = wpotda.tax_district_id
						and l.year = wpotda.year
						join levy_type lt
						on l.levy_type_cd = lt.levy_type_cd and
						lt.levy_part = 2
						where drpa.dataset_id = @dataset_id		
					) LEVY2
					on drpa.prop_id = LEVY2.prop_id and
					drpa.prop_val_yr = LEVY2.prop_val_yr and
					drpa.sup_num = LEVY2.sup_num	
	where ##dor_pp_seg_max.dataset_id = @dataset_id


	select
		@ag_me_local_mkt_val = sum(case when isnull(ppt.asset_listing_type_cd, '') = 'A' then isnull(case pv.appr_method when 'C' then pps.pp_mkt_val when 'D' then pps.dist_val when 'A' then pps.arb_val end,0) else 0 end),
		@ag_me_state_mkt_val = sum(case when isnull(ppt.asset_listing_type_cd, '') = 'A' and isnull(pps.farm_asset,0) = 0 then isnull(case pv.appr_method when 'C' then pps.pp_mkt_val when 'D' then pps.dist_val when 'A' then pps.arb_val end,0) else 0 end),
		@industrial_me_mkt_val = sum(case when isnull(ppt.asset_listing_type_cd, '') = 'I' then isnull(case pv.appr_method when 'C' then pps.pp_mkt_val when 'D' then pps.dist_val when 'A' then pps.arb_val end,0) else 0 end),
		@other_me_mkt_val = sum(case when isnull(ppt.asset_listing_type_cd, '') = 'O' then isnull(case pv.appr_method when 'C' then pps.pp_mkt_val when 'D' then pps.dist_val when 'A' then pps.arb_val end,0) else 0 end),
		@supplies_mkt_val = sum(case when isnull(ppt.asset_listing_type_cd, '') = 'S' then isnull(case pv.appr_method when 'C' then pps.pp_mkt_val when 'D' then pps.dist_val when 'A' then pps.arb_val end,0) else 0 end),
		@franchise_mkt_val = sum(case when isnull(ppt.asset_listing_type_cd, '') = 'F' then isnull(case pv.appr_method when 'C' then pps.pp_mkt_val when 'D' then pps.dist_val when 'A' then pps.arb_val end,0) else 0 end),
		@taxable_imprv_mkt_val = sum(case when isnull(ppt.asset_listing_type_cd, '') = 'T' then isnull(case pv.appr_method when 'C' then pps.pp_mkt_val when 'D' then pps.dist_val when 'A' then pps.arb_val end,0) else 0 end),
		@misc_pers_prop_mkt_val = sum(case when isnull(ppt.asset_listing_type_cd, '') = 'P' then isnull(case pv.appr_method when 'C' then pps.pp_mkt_val when 'D' then pps.dist_val when 'A' then pps.arb_val end,0) else 0 end)
	from ##dor_report_prop_assoc as drpa with(nolock)
	join pers_prop_seg as pps with(nolock) on
		drpa.prop_val_yr = pps.prop_val_yr
		and drpa.sup_num = pps.sup_num
		and drpa.prop_id = pps.prop_id
		and pps.pp_active_flag = 'T'
	join pp_type as ppt with(nolock) on
		pps.pp_type_cd = ppt.pp_type_cd
	join wash_prop_owner_val as wpov with(nolock) on
		drpa.prop_val_yr = wpov.year
		and drpa.sup_num = wpov.sup_num
		and drpa.prop_id = wpov.prop_id
	join property_val as pv with(nolock) on
		pv.prop_val_yr = pps.prop_val_yr and
		pv.sup_num = pps.sup_num and
		pv.prop_id = pps.prop_id
	where drpa.dataset_id = @dataset_id and drpa.u500_flag = 0

	select
		@taxable_imprv_mkt_val_levy2 = sum(case when isnull(ppt.asset_listing_type_cd, '') = 'T' then isnull(case pv.appr_method when 'C' then pps.pp_mkt_val when 'D' then pps.dist_val when 'A' then pps.arb_val end,0) else 0 end),
		@misc_pers_prop_mkt_val_levy2 = sum(case when isnull(ppt.asset_listing_type_cd, '') = 'P' then isnull(case pv.appr_method when 'C' then pps.pp_mkt_val when 'D' then pps.dist_val when 'A' then pps.arb_val end,0) else 0 end)
	from ##dor_report_prop_assoc as drpa with(nolock)
	join pers_prop_seg as pps with(nolock) on
		drpa.prop_val_yr = pps.prop_val_yr
		and drpa.sup_num = pps.sup_num
		and drpa.prop_id = pps.prop_id
		and pps.pp_active_flag = 'T'
	join pp_type as ppt with(nolock) on
		pps.pp_type_cd = ppt.pp_type_cd
	join wash_prop_owner_val as wpov with(nolock) on
		drpa.prop_val_yr = wpov.year
		and drpa.sup_num = wpov.sup_num
		and drpa.prop_id = wpov.prop_id
	join property_val as pv with(nolock) on
		pv.prop_val_yr = pps.prop_val_yr and
		pv.sup_num = pps.sup_num and
		pv.prop_id = pps.prop_id
					join (
						select distinct drpa.prop_id, drpa.prop_val_yr, drpa.sup_num
						from ##dor_report_prop_assoc drpa
						join wash_prop_owner_tax_district_assoc wpotda
						on drpa.prop_id = wpotda.prop_id and
						drpa.sup_num = wpotda.sup_num and
						drpa.prop_val_yr = wpotda.year
						join levy l
						on l.tax_district_id = wpotda.tax_district_id
						and l.year = wpotda.year
						join levy_type lt
						on l.levy_type_cd = lt.levy_type_cd and
						lt.levy_part = 2
						where drpa.dataset_id = @dataset_id		
					) LEVY2
					on drpa.prop_id = LEVY2.prop_id and
					drpa.prop_val_yr = LEVY2.prop_val_yr and
					drpa.sup_num = LEVY2.sup_num		
	where drpa.dataset_id = @dataset_id and drpa.u500_flag = 0
	
	select @taxable_imprv_mkt_val = isnull(@taxable_imprv_mkt_val, 0)
		+ isnull(sum(isnull(wpov.taxable_classified, 0) + isnull(wpov.taxable_non_classified, 0)),0),
			@taxable_imprv_count = isnull(@taxable_imprv_count,0) + count(p.prop_id)
	from ##dor_report_prop_assoc as drpa with(nolock)
	join property as p with(nolock) on
			drpa.prop_id = p.prop_id 
		and p.prop_type_cd in ('R')
	join wash_prop_owner_val as wpov
	with (nolock)
	on drpa.prop_val_yr = wpov.[year]
	and drpa.sup_num = wpov.sup_num
	and drpa.prop_id = wpov.prop_id
	join property_val as pv with (nolock) on
			pv.prop_val_yr = drpa.prop_val_yr
		and pv.sup_num = drpa.sup_num
		and pv.prop_id = drpa.prop_id
	join property_sub_type as pst with(nolock) on
			pst.property_sub_cd = pv.sub_type
		and pst.imp_leased_land = 1
	where drpa.dataset_id = @dataset_id and drpa.u500_flag = 0

	select @hof_exempt_count   = count(distinct drpa.prop_id), 
		   @hof_exempt_amount = sum(IsNull(wpoe.exempt_value,0))
	from ##dor_report_prop_assoc as drpa with(nolock)
	join property as p with(nolock) on
		drpa.prop_id = p.prop_id and
		p.prop_type_cd in ('P','A')
	join wash_prop_owner_exemption as wpoe with(nolock) on
		drpa.prop_val_yr = wpoe.year
		and drpa.sup_num = wpoe.sup_num
		and drpa.prop_id = wpoe.prop_id
		and wpoe.exmpt_type_cd = 'HOF'
	where drpa.dataset_id = @dataset_id and drpa.u500_flag = 0 -- Should be redundant unless data is messed up (should only have 1 exemption)
	
		
	select @u500_exempt_count   = count(distinct drpa.prop_id), 
		   @u500_exempt_amount = sum(IsNull(wpoe.exempt_value,0))
	from ##dor_report_prop_assoc as drpa with(nolock)
	join property as p with(nolock) on
		drpa.prop_id = p.prop_id and
		p.prop_type_cd in ('P','A')
	join wash_prop_owner_exemption wpoe with(nolock) on
		drpa.prop_val_yr = wpoe.year
		and drpa.sup_num = wpoe.sup_num
		and drpa.prop_id = wpoe.prop_id
		and wpoe.exmpt_type_cd = 'U500'
	where drpa.dataset_id = @dataset_id and drpa.u500_flag = 1

	select @dor_exempt_amount = sum(IsNull(wpoe.exempt_value,0))
	from ##dor_report_prop_assoc as drpa with(nolock)
	join property as p with(nolock) on
		drpa.prop_id = p.prop_id --and
		--p.prop_type_cd in ('P','A')
	join wash_prop_owner_exemption as wpoe with(nolock) on
		drpa.prop_val_yr = wpoe.year
		and drpa.sup_num = wpoe.sup_num
		and drpa.prop_id = wpoe.prop_id
		and wpoe.exmpt_type_cd = 'DOR'
	where drpa.dataset_id = @dataset_id and drpa.u500_flag = 0 -- Should be redundant unless data is messed up (should only have 1 exemption)

	select @taxable_imprv_mkt_val_levy2 = @taxable_imprv_mkt_val_levy2
		+ isnull(sum(isnull(wpov.taxable_classified, 0) + isnull(wpov.taxable_non_classified, 0)),0),
			@taxable_imprv_count_levy2 = @taxable_imprv_count_levy2 + count(p.prop_id)
	from ##dor_report_prop_assoc as drpa with(nolock)
	join property as p with(nolock) on
			drpa.prop_id = p.prop_id 
		and p.prop_type_cd in ('R')
	join wash_prop_owner_val as wpov
	with (nolock)
	on drpa.prop_val_yr = wpov.[year]
	and drpa.sup_num = wpov.sup_num
	and drpa.prop_id = wpov.prop_id
	join property_val as pv with (nolock) on
			pv.prop_val_yr = drpa.prop_val_yr
		and pv.sup_num = drpa.sup_num
		and pv.prop_id = drpa.prop_id
	join property_sub_type as pst with(nolock) on
			pst.property_sub_cd = pv.sub_type
		and pst.imp_leased_land = 1
	where drpa.dataset_id = @dataset_id and drpa.u500_flag = 0
	select @hof_exempt_count_levy2   = count(distinct drpa.prop_id), 
		   @hof_exempt_amount_levy2 = sum(IsNull(wpoe.exempt_value,0))
	from ##dor_report_prop_assoc as drpa with(nolock)
	join property as p with(nolock) on
		drpa.prop_id = p.prop_id and
		p.prop_type_cd in ('P','A')
	join wash_prop_owner_exemption as wpoe with(nolock) on
		drpa.prop_val_yr = wpoe.year
		and drpa.sup_num = wpoe.sup_num
		and drpa.prop_id = wpoe.prop_id
		and wpoe.exmpt_type_cd = 'HOF'
					join (
						select distinct drpa.prop_id, drpa.prop_val_yr, drpa.sup_num
						from ##dor_report_prop_assoc drpa
						join wash_prop_owner_tax_district_assoc wpotda
						on drpa.prop_id = wpotda.prop_id and
						drpa.sup_num = wpotda.sup_num and
						drpa.prop_val_yr = wpotda.year
						join levy l
						on l.tax_district_id = wpotda.tax_district_id
						and l.year = wpotda.year
						join levy_type lt
						on l.levy_type_cd = lt.levy_type_cd and
						lt.levy_part = 2
						where drpa.dataset_id = @dataset_id		
					) LEVY2
					on drpa.prop_id = LEVY2.prop_id and
					drpa.prop_val_yr = LEVY2.prop_val_yr and
					drpa.sup_num = LEVY2.sup_num		
	where drpa.dataset_id = @dataset_id and drpa.u500_flag = 0 -- Should be redundant unless data is messed up (should only have 1 exemption)
	
		
	select @u500_exempt_count_levy2   = count(distinct drpa.prop_id), 
		   @u500_exempt_amount_levy2 = sum(IsNull(wpoe.exempt_value,0))
	from ##dor_report_prop_assoc as drpa with(nolock)
	join property as p with(nolock) on
		drpa.prop_id = p.prop_id and
		p.prop_type_cd in ('P','A')
	join wash_prop_owner_exemption wpoe with(nolock) on
		drpa.prop_val_yr = wpoe.year
		and drpa.sup_num = wpoe.sup_num
		and drpa.prop_id = wpoe.prop_id
		and wpoe.exmpt_type_cd = 'U500'
					join (
						select distinct drpa.prop_id, drpa.prop_val_yr, drpa.sup_num
						from ##dor_report_prop_assoc drpa
						join wash_prop_owner_tax_district_assoc wpotda
						on drpa.prop_id = wpotda.prop_id and
						drpa.sup_num = wpotda.sup_num and
						drpa.prop_val_yr = wpotda.year
						join levy l
						on l.tax_district_id = wpotda.tax_district_id
						and l.year = wpotda.year
						join levy_type lt
						on l.levy_type_cd = lt.levy_type_cd and
						lt.levy_part = 2
						where drpa.dataset_id = @dataset_id		
					) LEVY2
					on drpa.prop_id = LEVY2.prop_id and
					drpa.prop_val_yr = LEVY2.prop_val_yr and
					drpa.sup_num = LEVY2.sup_num		
	where drpa.dataset_id = @dataset_id and drpa.u500_flag = 1



	insert into ##dor_report_personal
	(
	dataset_id,
	ag_me_local_count,
	ag_me_local_mkt_val,
	ag_me_state_count,
	ag_me_state_mkt_val,
	industrial_me_count,
	industrial_me_mkt_val,
	other_me_count,
	other_me_mkt_val,
	supplies_count,
	supplies_mkt_val,
	franchise_count,
	franchise_mkt_val,
	taxable_imprv_count,
	taxable_imprv_mkt_val,
	misc_pers_prop_count,
	misc_pers_prop_mkt_val,
	hof_exempt_count,
	hof_exempt_amount,
	u500_exempt_count,
	u500_exempt_amount,
	
	taxable_imprv_count_levy2,
	taxable_imprv_mkt_val_levy2,
	misc_pers_prop_count_levy2,
	misc_pers_prop_mkt_val_levy2,
	hof_exempt_count_levy2,
	hof_exempt_amount_levy2
	)
	values
	(
	@dataset_id,
	@ag_me_local_count,
	@ag_me_local_mkt_val,
	@ag_me_state_count,
	@ag_me_state_mkt_val,
	@industrial_me_count,
	@industrial_me_mkt_val,
	@other_me_count,
	@other_me_mkt_val,
	@supplies_count,
	@supplies_mkt_val,
	@franchise_count,
	@franchise_mkt_val,
	@taxable_imprv_count,
	@taxable_imprv_mkt_val,
	@misc_pers_prop_count,
	@misc_pers_prop_mkt_val,
	@hof_exempt_count,
	(@hof_exempt_amount * -1),
	@u500_exempt_count,
	@u500_exempt_amount,
	
	@taxable_imprv_count_levy2,
	@taxable_imprv_mkt_val_levy2,
	@misc_pers_prop_count_levy2,
	@misc_pers_prop_mkt_val_levy2,
	@hof_exempt_count_levy2,
	(@hof_exempt_amount_levy2 * -1)
	)

	-------------------------------------------------------------------------------
	-- END PAGE 3
	-------------------------------------------------------------------------------


	-- PROPERTY ID REPORTS
	if (@Assess_Using_GEO_ID = 0) begin		

		-------------------------------------------------------------------------------
		-- BEGIN PAGE 1
		-------------------------------------------------------------------------------

		insert ##dor_report_general (
			dataset_id, senior1_count, senior1_market, senior1_frozen, senior1_exempt,
			senior2_count, senior2_market, senior2_frozen, senior2_exempt,
			senior3_count, senior3_market, senior3_frozen, senior3_exempt,
			current_use_agreements, new_current_use_agreements, remodel_count, remodel_value,
			new_construction_imprv, 
			new_construction_land, 
			new_construction_personal,
			new_construction_windturbine,
			new_construction_solar,
			new_construction_biomass,
			new_construction_geothermal,
			new_construction,
			new_construction_levy2
		)
		select drpa.dataset_id,
		sum(case when wpoe_snr.exempt_qualify_cd = '1' then 1 else 0 end) as senior1_count,
		sum(case when wpoe_snr.exempt_qualify_cd = '1' then isnull(wpov.land_hstd_val,0) + isnull(wpov.ag_hs_use_val,0) + isnull(wpov.imprv_hstd_val,0) else 0 end) as senior1_market,
		sum(case when wpoe_snr.exempt_qualify_cd = '1' then isnull(wpv.snr_frz_imprv_hs,0) + isnull(wpv.snr_frz_land_hs,0) + isnull(wpv.snr_new_val,0) else 0 end) as senior1_frozen,
		sum(case when wpoe_snr.exempt_qualify_cd = '1' then isnull(wpv.snr_exempt_loss,0) else 0 end) as senior1_exempt,
		sum(case when wpoe_snr.exempt_qualify_cd = '2' then 1 else 0 end) as senior2_count,
		sum(case when wpoe_snr.exempt_qualify_cd = '2' then isnull(wpov.land_hstd_val,0) + isnull(wpov.ag_hs_use_val,0) + isnull(wpov.imprv_hstd_val,0) else 0 end) as senior2_market,
		sum(case when wpoe_snr.exempt_qualify_cd = '2' then isnull(wpv.snr_frz_imprv_hs,0) + isnull(wpv.snr_frz_land_hs,0) + isnull(wpv.snr_new_val,0) else 0 end) as senior2_frozen,
		sum(case when wpoe_snr.exempt_qualify_cd = '2' then isnull(wpv.snr_exempt_loss,0) else 0 end) as senior2_exempt,
		sum(case when wpoe_snr.exempt_qualify_cd = '3' then 1 else 0 end) as senior3_count,
		sum(case when wpoe_snr.exempt_qualify_cd = '3' then isnull(wpov.land_hstd_val,0) + isnull(wpov.ag_hs_use_val,0) + isnull(wpov.imprv_hstd_val,0) else 0 end) as senior3_market,
		sum(case when wpoe_snr.exempt_qualify_cd = '3' then isnull(wpv.snr_frz_imprv_hs,0) + isnull(wpv.snr_frz_land_hs,0) + isnull(wpv.snr_new_val,0) else 0 end) as senior3_frozen,
		sum(case when wpoe_snr.exempt_qualify_cd = '3' then isnull(wpv.snr_exempt_loss,0) else 0 end) as senior3_exempt,
		0 as current_use_agreements, -- Will calculate later
		0 as current_use_agreements, -- Will calculate later
		sum(case when isnull(pv.remodel_val_curr_yr,0) <> 0 then 1 else 0 end) as remodel_count,
		sum(isnull(pv.remodel_val_curr_yr,0)) as remodel_value,
		0 as new_construction_imprv,
		0 as new_consruction_land,
		0 as new_consruction_personal,
		0 as new_construction_windturbine,
		0 as new_construction_solar,
		0 as new_construction_biomass,
		0 as new_construction_geothermal,
		0 as new_construction_value,
		0 as new_construction_value_levy2
		from ##dor_report_prop_assoc as drpa with(nolock)
		join wash_prop_owner_val as wpov with(nolock) on
			drpa.prop_val_yr = wpov.year
			and drpa.sup_num = wpov.sup_num
			and drpa.prop_id = wpov.prop_id
		join wash_property_val as wpv with(nolock) on
			wpov.year = wpv.prop_val_yr
			and wpov.sup_num = wpv.sup_num
			and wpov.prop_id = wpv.prop_id
		join property_val as pv with(nolock) on
			drpa.prop_val_yr = pv.prop_val_yr
			and drpa.sup_num = pv.sup_num
			and drpa.prop_id = pv.prop_id
		left outer join wash_prop_owner_exemption as wpoe_snr with(nolock) on
			wpov.year = wpoe_snr.year
			and wpov.sup_num = wpoe_snr.sup_num
			and wpov.prop_id = wpoe_snr.prop_id
			and wpov.owner_id = wpoe_snr.owner_id
			and wpoe_snr.exmpt_type_cd = 'SNR/DSBL'
		where drpa.dataset_id = @dataset_id and drpa.u500_flag = 0
		group by drpa.dataset_id
		
		if ( @@rowcount = 0 )
		begin
			insert into ##dor_report_general(
				dataset_id, senior1_count, senior1_market, senior1_frozen, senior1_exempt,
				senior2_count, senior2_market, senior2_frozen, senior2_exempt,
				senior3_count, senior3_market, senior3_frozen, senior3_exempt,
				current_use_agreements, new_current_use_agreements, remodel_count, remodel_value,
				new_construction_imprv, 
				new_construction_land, 
				new_construction_personal,
				new_construction_windturbine,
				new_construction_solar,
				new_construction_biomass,
				new_construction_geothermal,
				new_construction,
				new_construction_levy2
			)
			values (
				@dataset_id, 0, 0, 0, 0,
				0, 0, 0, 0, 
				0, 0, 0, 0, 
				0, 0, 0, 0, 
				0, 0, 0, 0, 0, 0, 0, 0, 0
			)
		end 	


		---- senior 1 exempt State Levy Part 2
		update ##dor_report_general
		set senior1_levy2 = (
			select sum(isnull(snr_taxable_portion,0))
			from ##dor_report_prop_assoc as drpa with(nolock)
			join property_val as pv with (nolock) on
					pv.prop_val_yr = drpa.prop_val_yr
				and pv.prop_id = drpa.prop_id
				and pv.sup_num = drpa.sup_num
			join wash_prop_owner_val as wpov with(nolock) on
				drpa.prop_val_yr = wpov.year
				and drpa.sup_num = wpov.sup_num
				and drpa.prop_id = wpov.prop_id
			join wash_property_val as wpv with(nolock) on
				wpov.year = wpv.prop_val_yr
				and wpov.sup_num = wpv.sup_num
				and wpov.prop_id = wpv.prop_id
			left outer join wash_prop_owner_exemption as wpoe_snr with(nolock) on
				wpov.year = wpoe_snr.year
				and wpov.sup_num = wpoe_snr.sup_num
				and wpov.prop_id = wpoe_snr.prop_id
				and wpov.owner_id = wpoe_snr.owner_id
				and wpoe_snr.exmpt_type_cd = 'SNR/DSBL'				
			--join property_tax_area as pta with(nolock) on
			--	pta.prop_id = pv.prop_id and
			--	pta.year = pv.prop_val_yr and
			--	pta.sup_num = pv.sup_num
			--join tax_area_fund_assoc as tfa with(nolock) 
			--	on pta.[year] = tfa.[year] and pta.tax_area_id = tfa.tax_area_id
			--join levy as l with(nolock)
			--	on tfa.[year] = l.[year] and tfa.tax_district_id = l.tax_district_id and tfa.levy_cd = l.levy_cd 
			--join levy_type as lt with(nolock) on l.levy_type_cd = lt.levy_type_cd
					join (
						select distinct drpa.prop_id, drpa.prop_val_yr, drpa.sup_num
						from ##dor_report_prop_assoc drpa
						join wash_prop_owner_tax_district_assoc wpotda
						on drpa.prop_id = wpotda.prop_id and
						drpa.sup_num = wpotda.sup_num and
						drpa.prop_val_yr = wpotda.year
						join levy l
						on l.tax_district_id = wpotda.tax_district_id
						and l.year = wpotda.year
						join levy_type lt
						on l.levy_type_cd = lt.levy_type_cd and
						lt.levy_part = 2
						where drpa.dataset_id = @dataset_id		
					) LEVY2
					on drpa.prop_id = LEVY2.prop_id and
					drpa.prop_val_yr = LEVY2.prop_val_yr and
					drpa.sup_num = LEVY2.sup_num			
						
			--left join property_sub_type as pst with (nolock) on
			--	pst.property_sub_cd = pv.sub_type 
			where 
				--lt.levy_part = 2 and
				drpa.dataset_id = @dataset_id and 
				wpoe_snr.exempt_qualify_cd = '1'
				--drpa.u500_flag = 0 and
				--isnull(pst.facility_type, '') not in('W', 'S', 'B', 'G') )
		)


		---- senior 2 exempt State Levy Part 2
		update ##dor_report_general
		set senior2_levy2 = (
			select sum(isnull(snr_taxable_portion,0))
			from ##dor_report_prop_assoc as drpa with(nolock)
			join property_val as pv with (nolock) on
					pv.prop_val_yr = drpa.prop_val_yr
				and pv.prop_id = drpa.prop_id
				and pv.sup_num = drpa.sup_num
			join wash_prop_owner_val as wpov with(nolock) on
				drpa.prop_val_yr = wpov.year
				and drpa.sup_num = wpov.sup_num
				and drpa.prop_id = wpov.prop_id
			join wash_property_val as wpv with(nolock) on
				wpov.year = wpv.prop_val_yr
				and wpov.sup_num = wpv.sup_num
				and wpov.prop_id = wpv.prop_id
			left outer join wash_prop_owner_exemption as wpoe_snr with(nolock) on
				wpov.year = wpoe_snr.year
				and wpov.sup_num = wpoe_snr.sup_num
				and wpov.prop_id = wpoe_snr.prop_id
				and wpov.owner_id = wpoe_snr.owner_id
				and wpoe_snr.exmpt_type_cd = 'SNR/DSBL'				
			--join property_tax_area as pta with(nolock) on
			--	pta.prop_id = pv.prop_id and
			--	pta.year = pv.prop_val_yr and
			--	pta.sup_num = pv.sup_num
			--join tax_area_fund_assoc as tfa with(nolock) 
			--	on pta.[year] = tfa.[year] and pta.tax_area_id = tfa.tax_area_id
			--join levy as l with(nolock)
			--	on tfa.[year] = l.[year] and tfa.tax_district_id = l.tax_district_id and tfa.levy_cd = l.levy_cd 
			--join levy_type as lt with(nolock) on l.levy_type_cd = lt.levy_type_cd
						
					join (
						select distinct drpa.prop_id, drpa.prop_val_yr, drpa.sup_num
						from ##dor_report_prop_assoc drpa
						join wash_prop_owner_tax_district_assoc wpotda
						on drpa.prop_id = wpotda.prop_id and
						drpa.sup_num = wpotda.sup_num and
						drpa.prop_val_yr = wpotda.year
						join levy l
						on l.tax_district_id = wpotda.tax_district_id
						and l.year = wpotda.year
						join levy_type lt
						on l.levy_type_cd = lt.levy_type_cd and
						lt.levy_part = 2
						where drpa.dataset_id = @dataset_id		
					) LEVY2
					on drpa.prop_id = LEVY2.prop_id and
					drpa.prop_val_yr = LEVY2.prop_val_yr and
					drpa.sup_num = LEVY2.sup_num						
			--left join property_sub_type as pst with (nolock) on
			--	pst.property_sub_cd = pv.sub_type 
			where 
				--lt.levy_part = 2 and
				drpa.dataset_id = @dataset_id and 
				wpoe_snr.exempt_qualify_cd = '2'
				--drpa.u500_flag = 0 and
				--isnull(pst.facility_type, '') not in('W', 'S', 'B', 'G') )
		)
		
		---- senior 3 exempt State Levy Part 2
		update ##dor_report_general
		set senior3_levy2 = (
			select sum(isnull(snr_taxable_portion,0))
			from ##dor_report_prop_assoc as drpa with(nolock)
			join property_val as pv with (nolock) on
					pv.prop_val_yr = drpa.prop_val_yr
				and pv.prop_id = drpa.prop_id
				and pv.sup_num = drpa.sup_num
			join wash_prop_owner_val as wpov with(nolock) on
				drpa.prop_val_yr = wpov.year
				and drpa.sup_num = wpov.sup_num
				and drpa.prop_id = wpov.prop_id
			join wash_property_val as wpv with(nolock) on
				wpov.year = wpv.prop_val_yr
				and wpov.sup_num = wpv.sup_num
				and wpov.prop_id = wpv.prop_id
			left outer join wash_prop_owner_exemption as wpoe_snr with(nolock) on
				wpov.year = wpoe_snr.year
				and wpov.sup_num = wpoe_snr.sup_num
				and wpov.prop_id = wpoe_snr.prop_id
				and wpov.owner_id = wpoe_snr.owner_id
				and wpoe_snr.exmpt_type_cd = 'SNR/DSBL'				
					join (
						select distinct drpa.prop_id, drpa.prop_val_yr, drpa.sup_num
						from ##dor_report_prop_assoc drpa
						join wash_prop_owner_tax_district_assoc wpotda
						on drpa.prop_id = wpotda.prop_id and
						drpa.sup_num = wpotda.sup_num and
						drpa.prop_val_yr = wpotda.year
						join levy l
						on l.tax_district_id = wpotda.tax_district_id
						and l.year = wpotda.year
						join levy_type lt
						on l.levy_type_cd = lt.levy_type_cd and
						lt.levy_part = 2
						where drpa.dataset_id = @dataset_id		
					) LEVY2
					on drpa.prop_id = LEVY2.prop_id and
					drpa.prop_val_yr = LEVY2.prop_val_yr and
					drpa.sup_num = LEVY2.sup_num		
			where 
				drpa.dataset_id = @dataset_id and 
				wpoe_snr.exempt_qualify_cd = '3'
			)		
				

		---- new_construction_imprv
		update ##dor_report_general
		set new_construction_imprv = (
			select sum(isnull(pv.new_val_imprv_hs, 0) + isnull(pv.new_val_imprv_nhs, 0))
			from ##dor_report_prop_assoc as drpa with(nolock)
			join (
				select distinct drpa.prop_id, drpa.prop_val_yr, drpa.sup_num
				from ##dor_report_prop_assoc drpa
				join wash_prop_owner_tax_district_assoc wpotda
				on drpa.prop_id = wpotda.prop_id and
				drpa.sup_num = wpotda.sup_num and
				drpa.prop_val_yr = wpotda.year
				join levy l
				on l.tax_district_id = wpotda.tax_district_id
				and l.year = wpotda.year
				join levy_type lt
				on l.levy_type_cd = lt.levy_type_cd and
				lt.levy_part = 1
				where drpa.dataset_id = @dataset_id		
			) LEVY1
			on drpa.prop_id = LEVY1.prop_id and
			drpa.prop_val_yr = LEVY1.prop_val_yr and
			drpa.sup_num = LEVY1.sup_num
			join property_val as pv with (nolock) on
					pv.prop_val_yr = drpa.prop_val_yr
				and pv.prop_id = drpa.prop_id
				and pv.sup_num = drpa.sup_num
			left join property_sub_type as pst with (nolock) on
				pst.property_sub_cd = pv.sub_type 
			where 
				drpa.dataset_id = @dataset_id and 
				drpa.u500_flag = 0 and
				isnull(pst.facility_type, '') not in('W', 'S', 'B', 'G') )


		update ##dor_report_general
		set new_construction_imprv_levy2 = (
			select sum(isnull(pv.new_val_imprv_hs, 0) + isnull(pv.new_val_imprv_nhs, 0))
			from ##dor_report_prop_assoc as drpa with(nolock)
			join (
				select distinct case when pe.exmpt_type_cd <> 'SNR/DSBL' or pe.exmpt_type_cd Is Null then drpa.prop_id else NULL end prop_id, drpa.prop_val_yr, drpa.sup_num
				from ##dor_report_prop_assoc drpa
				join wash_prop_owner_tax_district_assoc wpotda
				on drpa.prop_id = wpotda.prop_id and
				drpa.sup_num = wpotda.sup_num and
				drpa.prop_val_yr = wpotda.year
				left join property_exemption as pe with(nolock) on
				pe.prop_id = wpotda.prop_id and
				pe.owner_tax_yr = wpotda.year and
				pe. sup_num = wpotda.sup_num
				join levy l
				on l.tax_district_id = wpotda.tax_district_id
				and l.year = wpotda.year
				join levy_type lt
				on l.levy_type_cd = lt.levy_type_cd and
				lt.levy_part = 2
				where drpa.dataset_id = @dataset_id		
			) LEVY2
			on drpa.prop_id = LEVY2.prop_id and
			drpa.prop_val_yr = LEVY2.prop_val_yr and
			drpa.sup_num = LEVY2.sup_num
			join property_val as pv with (nolock) on
					pv.prop_val_yr = drpa.prop_val_yr
				and pv.prop_id = drpa.prop_id
				and pv.sup_num = drpa.sup_num
			left join property_sub_type as pst with (nolock) on
				pst.property_sub_cd = pv.sub_type 
			where 
				drpa.dataset_id = @dataset_id and 
				drpa.u500_flag = 0 and
				isnull(pst.facility_type, '') not in('W', 'S', 'B', 'G') )	
			

		---- new_construction_land
		update ##dor_report_general
		set new_construction_land = (
		select sum(isnull(pv.new_val_land_hs, 0) + isnull(pv.new_val_land_nhs, 0))
		from ##dor_report_prop_assoc as drpa with(nolock)
			join (
				select distinct drpa.prop_id, drpa.prop_val_yr, drpa.sup_num
				from ##dor_report_prop_assoc drpa
				join wash_prop_owner_tax_district_assoc wpotda
				on drpa.prop_id = wpotda.prop_id and
				drpa.sup_num = wpotda.sup_num and
				drpa.prop_val_yr = wpotda.year
				join levy l
				on l.tax_district_id = wpotda.tax_district_id
				and l.year = wpotda.year
				join levy_type lt
				on l.levy_type_cd = lt.levy_type_cd and
				lt.levy_part = 1
				where drpa.dataset_id = @dataset_id		
			) LEVY1
			on drpa.prop_id = LEVY1.prop_id and
			drpa.prop_val_yr = LEVY1.prop_val_yr and
			drpa.sup_num = LEVY1.sup_num
		join [property] as p with (nolock) on
				p.prop_id = drpa.prop_id
		join property_val as pv with (nolock) on
				drpa.prop_val_yr = pv.prop_val_yr
			and drpa.sup_num = pv.sup_num
			and drpa.prop_id = pv.prop_id
		left join property_sub_type as pst with (nolock) on
				pst.property_sub_cd = pv.sub_type
		where 
			drpa.dataset_id = @dataset_id and 
			drpa.u500_flag = 0 and
			(isnull(pst.facility_type, '') not in('W', 'S', 'B', 'G')) and
			(p.prop_type_cd <> 'R' 
				or 
			(p.prop_type_cd = 'R' and isnull(pst.imp_leased_land, 0) = 0)
			))

		update ##dor_report_general
		set new_construction_land_levy2 = (
		select sum(isnull(pv.new_val_land_hs, 0) + isnull(pv.new_val_land_nhs, 0))
		from ##dor_report_prop_assoc as drpa with(nolock)
		join (
			select distinct case when pe.exmpt_type_cd <> 'SNR/DSBL' or pe.exmpt_type_cd Is Null then drpa.prop_id else NULL end prop_id, drpa.prop_val_yr, drpa.sup_num
			from ##dor_report_prop_assoc drpa
			join wash_prop_owner_tax_district_assoc wpotda
			on drpa.prop_id = wpotda.prop_id and
			drpa.sup_num = wpotda.sup_num and
			drpa.prop_val_yr = wpotda.year
	left join property_exemption as pe with(nolock) on
		pe.prop_id = wpotda.prop_id and
		pe.owner_tax_yr = wpotda.year and
		pe. sup_num = wpotda.sup_num
			join levy l
			on l.tax_district_id = wpotda.tax_district_id
			and l.year = wpotda.year
			join levy_type lt
			on l.levy_type_cd = lt.levy_type_cd and
			lt.levy_part = 2
			where drpa.dataset_id = @dataset_id		
		) LEVY2
		on drpa.prop_id = LEVY2.prop_id and
		drpa.prop_val_yr = LEVY2.prop_val_yr and
		drpa.sup_num = LEVY2.sup_num
		join [property] as p with (nolock) on
				p.prop_id = drpa.prop_id
		join property_val as pv with (nolock) on
				drpa.prop_val_yr = pv.prop_val_yr
			and drpa.sup_num = pv.sup_num
			and drpa.prop_id = pv.prop_id
		left join property_sub_type as pst with (nolock) on
				pst.property_sub_cd = pv.sub_type
		where 
			drpa.dataset_id = @dataset_id and 
			drpa.u500_flag = 0 and
			(isnull(pst.facility_type, '') not in('W', 'S', 'B', 'G')) and
			(p.prop_type_cd <> 'R' 
				or 
			(p.prop_type_cd = 'R' and isnull(pst.imp_leased_land, 0) = 0)
			))
		
		
		--- new_construction_personal
		update ##dor_report_general
		set new_construction_personal = (
		select sum(isnull(pv.new_val_p, 0))
		from ##dor_report_prop_assoc as drpa with(nolock)
			join (
				select distinct drpa.prop_id, drpa.prop_val_yr, drpa.sup_num
				from ##dor_report_prop_assoc drpa
				join wash_prop_owner_tax_district_assoc wpotda
				on drpa.prop_id = wpotda.prop_id and
				drpa.sup_num = wpotda.sup_num and
				drpa.prop_val_yr = wpotda.year
				join levy l
				on l.tax_district_id = wpotda.tax_district_id
				and l.year = wpotda.year
				join levy_type lt
				on l.levy_type_cd = lt.levy_type_cd and
				lt.levy_part = 1
				where drpa.dataset_id = @dataset_id		
			) LEVY1
			on drpa.prop_id = LEVY1.prop_id and
			drpa.prop_val_yr = LEVY1.prop_val_yr and
			drpa.sup_num = LEVY1.sup_num
		join [property] as p with (nolock) on
			p.prop_id = drpa.prop_id
		join property_val as pv with (nolock) on
			drpa.prop_val_yr = pv.prop_val_yr and
			drpa.sup_num = pv.sup_num and
			drpa.prop_id = pv.prop_id
		left join property_sub_type as pst with (nolock) on
			pst.property_sub_cd = pv.sub_type
		where 
			drpa.dataset_id = @dataset_id and 
			drpa.u500_flag = 0 and 
			(isnull(pst.facility_type, '') not in('W', 'S', 'B', 'G')) and
			p.prop_type_cd = 'P')
		
	


		update ##dor_report_general
		set new_construction_personal_levy2 = (
		select sum(isnull(pv.new_val_p, 0))
		from ##dor_report_prop_assoc as drpa with(nolock)
		join (
			select distinct case when pe.exmpt_type_cd <> 'SNR/DSBL' or pe.exmpt_type_cd Is Null then drpa.prop_id else NULL end prop_id, drpa.prop_val_yr, drpa.sup_num
			from ##dor_report_prop_assoc drpa
			join wash_prop_owner_tax_district_assoc wpotda
			on drpa.prop_id = wpotda.prop_id and
			drpa.sup_num = wpotda.sup_num and
			drpa.prop_val_yr = wpotda.year
	left join property_exemption as pe with(nolock) on
		pe.prop_id = wpotda.prop_id and
		pe.owner_tax_yr = wpotda.year and
		pe. sup_num = wpotda.sup_num
			join levy l
			on l.tax_district_id = wpotda.tax_district_id
			and l.year = wpotda.year
			join levy_type lt
			on l.levy_type_cd = lt.levy_type_cd and
			lt.levy_part = 2
			where drpa.dataset_id = @dataset_id		
		) LEVY2
		on drpa.prop_id = LEVY2.prop_id and
		drpa.prop_val_yr = LEVY2.prop_val_yr and
		drpa.sup_num = LEVY2.sup_num
		join [property] as p with (nolock) on
			p.prop_id = drpa.prop_id
		join property_val as pv with (nolock) on
			drpa.prop_val_yr = pv.prop_val_yr and
			drpa.sup_num = pv.sup_num and
			drpa.prop_id = pv.prop_id
		left join property_sub_type as pst with (nolock) on
			pst.property_sub_cd = pv.sub_type
		where 
			drpa.dataset_id = @dataset_id and 
			drpa.u500_flag = 0 and 
			(isnull(pst.facility_type, '') not in('W', 'S', 'B', 'G')) and
			p.prop_type_cd = 'P')

	update ##dor_report_general
	set new_construction = new_construction_imprv + new_construction_personal + new_construction_land + new_construction_solar + new_construction_biomass + new_construction_geothermal
	where dataset_id = @dataset_id

	update ##dor_report_general
	set new_construction_levy2 = new_construction_imprv_levy2 + new_construction_personal_levy2 + new_construction_land_levy2
	where dataset_id = @dataset_id

		
		set @facility_imprv_value = 0
		set @facility_land_value = 0
		set @facility_personal_value = 0
		
		---- new_construction_windturbine --------
		set @facility_imprv_value = 
		(
			select sum(isnull(pv.new_val_imprv_hs, 0) + isnull(pv.new_val_imprv_nhs, 0))
			from ##dor_report_prop_assoc as drpa with(nolock)
			join property_val as pv with (nolock) on
				pv.prop_val_yr = drpa.prop_val_yr and
				pv.prop_id = drpa.prop_id and
				pv.sup_num = drpa.sup_num
			join property_sub_type as pst with (nolock) on
				pst.property_sub_cd = pv.sub_type 
			where 
				drpa.dataset_id = @dataset_id and 
				drpa.u500_flag = 0 and
				(isnull(pst.facility_type, '') = 'W')  
		)
					
		
		set @facility_land_value = 
		(
			select sum(isnull(pv.new_val_land_hs, 0) + isnull(pv.new_val_land_nhs, 0))
			from ##dor_report_prop_assoc as drpa with(nolock)
			join [property] as p with (nolock) on
				p.prop_id = drpa.prop_id
			join property_val as pv with (nolock) on
				drpa.prop_val_yr = pv.prop_val_yr and
				drpa.sup_num = pv.sup_num and
				drpa.prop_id = pv.prop_id
			join property_sub_type as pst with (nolock) on
				pst.property_sub_cd = pv.sub_type
			where 
				drpa.dataset_id = @dataset_id and 
				drpa.u500_flag = 0 and
				(isnull(pst.facility_type, '') = 'W') and
				(p.prop_type_cd <> 'R' 
					or 
				(p.prop_type_cd = 'R' and isnull(pst.imp_leased_land, 0) = 0) )
		)
		
		
		set @facility_personal_value = 
		(
			select sum(isnull(pv.new_val_p, 0))
			from ##dor_report_prop_assoc as drpa with(nolock)
			join (
				select distinct drpa.prop_id, drpa.prop_val_yr, drpa.sup_num
				from ##dor_report_prop_assoc drpa
				join wash_prop_owner_tax_district_assoc wpotda
				on drpa.prop_id = wpotda.prop_id and
				drpa.sup_num = wpotda.sup_num and
				drpa.prop_val_yr = wpotda.year
				join levy l
				on l.tax_district_id = wpotda.tax_district_id
				and l.year = wpotda.year
				join levy_type lt
				on l.levy_type_cd = lt.levy_type_cd and
				lt.levy_part = 1
				where drpa.dataset_id = @dataset_id		
			) LEVY1
			on drpa.prop_id = LEVY1.prop_id and
				drpa.prop_val_yr = LEVY1.prop_val_yr and
				drpa.sup_num = LEVY1.sup_num
			join [property] as p with (nolock) on
					p.prop_id = drpa.prop_id
			join property_val as pv with (nolock) on
				drpa.prop_val_yr = pv.prop_val_yr and
				drpa.sup_num = pv.sup_num and
				drpa.prop_id = pv.prop_id
			join property_sub_type as pst with (nolock) on
				pst.property_sub_cd = pv.sub_type
			where 
				drpa.dataset_id = @dataset_id and 
				drpa.u500_flag = 0 and 
				(isnull(pst.facility_type, '') = 'W') and
				p.prop_type_cd = 'P'
		)
			
			
		update ##dor_report_general
		set new_construction_windturbine =
			isnull(@facility_imprv_value, 0) + 
			isnull(@facility_land_value, 0) + 
			isnull(@facility_personal_value, 0)
			
		
		---- new_construction_solar --------
		set @facility_imprv_value = 0
		set @facility_land_value = 0
		set @facility_personal_value = 0
		
		set @facility_imprv_value = 
		(
			select sum(isnull(pv.new_val_imprv_hs, 0) + isnull(pv.new_val_imprv_nhs, 0))
			from ##dor_report_prop_assoc as drpa with(nolock)
			join property_val as pv with (nolock) on
				pv.prop_val_yr = drpa.prop_val_yr and
				pv.prop_id = drpa.prop_id and
				pv.sup_num = drpa.sup_num
			join property_sub_type as pst with (nolock) on
				pst.property_sub_cd = pv.sub_type 
			where 
				drpa.dataset_id = @dataset_id and 
				drpa.u500_flag = 0 and
				(isnull(pst.facility_type, '') = 'S')
		)
					
		
		set @facility_land_value = 
		(
			select sum(isnull(pv.new_val_land_hs, 0) + isnull(pv.new_val_land_nhs, 0))
			from ##dor_report_prop_assoc as drpa with(nolock)
			join [property] as p with (nolock) on
				p.prop_id = drpa.prop_id
			join property_val as pv with (nolock) on
				drpa.prop_val_yr = pv.prop_val_yr and
				drpa.sup_num = pv.sup_num and
				drpa.prop_id = pv.prop_id
			join property_sub_type as pst with (nolock) on
				pst.property_sub_cd = pv.sub_type
			where 
				drpa.dataset_id = @dataset_id and 
				drpa.u500_flag = 0 and
				(isnull(pst.facility_type, '') = 'S') and
				(p.prop_type_cd <> 'R' 
					or 
				(p.prop_type_cd = 'R' and isnull(pst.imp_leased_land, 0) = 0) )
		)
		
		
		set @facility_personal_value = 
		(
			select sum(isnull(pv.new_val_p, 0))
			from ##dor_report_prop_assoc as drpa with(nolock)
			join (
				select distinct drpa.prop_id, drpa.prop_val_yr, drpa.sup_num
				from ##dor_report_prop_assoc drpa
				join wash_prop_owner_tax_district_assoc wpotda
				on drpa.prop_id = wpotda.prop_id and
				drpa.sup_num = wpotda.sup_num and
				drpa.prop_val_yr = wpotda.year
				join levy l
				on l.tax_district_id = wpotda.tax_district_id
				and l.year = wpotda.year
				join levy_type lt
				on l.levy_type_cd = lt.levy_type_cd and
				lt.levy_part = 1
				where drpa.dataset_id = @dataset_id		
			) LEVY1
			on drpa.prop_id = LEVY1.prop_id and
				drpa.prop_val_yr = LEVY1.prop_val_yr and
				drpa.sup_num = LEVY1.sup_num
			join [property] as p with (nolock) on
					p.prop_id = drpa.prop_id
			join property_val as pv with (nolock) on
				drpa.prop_val_yr = pv.prop_val_yr and
				drpa.sup_num = pv.sup_num and
				drpa.prop_id = pv.prop_id
			join property_sub_type as pst with (nolock) on
				pst.property_sub_cd = pv.sub_type
			where 
				drpa.dataset_id = @dataset_id and 
				drpa.u500_flag = 0 and 
				(isnull(pst.facility_type, '') = 'S') and
				p.prop_type_cd = 'P'
		)
			
			
		update ##dor_report_general
		set new_construction_solar =
			isnull(@facility_imprv_value, 0) + 
			isnull(@facility_land_value, 0) + 
			isnull(@facility_personal_value, 0)
				

		---- new_construction_biomass --------
		set @facility_imprv_value = 0
		set @facility_land_value = 0
		set @facility_personal_value = 0
		
		set @facility_imprv_value = 
		(
			select sum(isnull(pv.new_val_imprv_hs, 0) + isnull(pv.new_val_imprv_nhs, 0))
			from ##dor_report_prop_assoc as drpa with(nolock)
			join property_val as pv with (nolock) on
				pv.prop_val_yr = drpa.prop_val_yr and
				pv.prop_id = drpa.prop_id and
				pv.sup_num = drpa.sup_num
			join property_sub_type as pst with (nolock) on
				pst.property_sub_cd = pv.sub_type 
			where 
				drpa.dataset_id = @dataset_id and 
				drpa.u500_flag = 0 and
				(isnull(pst.facility_type, '') = 'B')
		)
					
		
		set @facility_land_value = 
		(
			select sum(isnull(pv.new_val_land_hs, 0) + isnull(pv.new_val_land_nhs, 0))
			from ##dor_report_prop_assoc as drpa with(nolock)
			join [property] as p with (nolock) on
				p.prop_id = drpa.prop_id
			join property_val as pv with (nolock) on
				drpa.prop_val_yr = pv.prop_val_yr and
				drpa.sup_num = pv.sup_num and
				drpa.prop_id = pv.prop_id
			join property_sub_type as pst with (nolock) on
				pst.property_sub_cd = pv.sub_type
			where 
				drpa.dataset_id = @dataset_id and 
				drpa.u500_flag = 0 and
				(isnull(pst.facility_type, '') = 'B') and
				(p.prop_type_cd <> 'R' 
					or 
				(p.prop_type_cd = 'R' and isnull(pst.imp_leased_land, 0) = 0) )
		)
		
		
		--- new_construction_personal
		set @facility_personal_value = 
		(
			select sum(isnull(pv.new_val_p, 0))
			from ##dor_report_prop_assoc as drpa with(nolock)
			join (
				select distinct drpa.prop_id, drpa.prop_val_yr, drpa.sup_num
				from ##dor_report_prop_assoc drpa
				join wash_prop_owner_tax_district_assoc wpotda
				on drpa.prop_id = wpotda.prop_id and
				drpa.sup_num = wpotda.sup_num and
				drpa.prop_val_yr = wpotda.year
				join levy l
				on l.tax_district_id = wpotda.tax_district_id
				and l.year = wpotda.year
				join levy_type lt
				on l.levy_type_cd = lt.levy_type_cd and
				lt.levy_part = 1
				where drpa.dataset_id = @dataset_id		
			) LEVY1
			on drpa.prop_id = LEVY1.prop_id and
			drpa.prop_val_yr = LEVY1.prop_val_yr and
			drpa.sup_num = LEVY1.sup_num
			join [property] as p with (nolock) on
					p.prop_id = drpa.prop_id
			join property_val as pv with (nolock) on
				drpa.prop_val_yr = pv.prop_val_yr and
				drpa.sup_num = pv.sup_num and
				drpa.prop_id = pv.prop_id
			join property_sub_type as pst with (nolock) on
				pst.property_sub_cd = pv.sub_type
			where 
				drpa.dataset_id = @dataset_id and 
				drpa.u500_flag = 0 and 
				(isnull(pst.facility_type, '') = 'B') and
				p.prop_type_cd = 'P'
		)
			
			
		update ##dor_report_general
		set new_construction_biomass =
			isnull(@facility_imprv_value, 0) + 
			isnull(@facility_land_value, 0) + 
			isnull(@facility_personal_value, 0)
			
			
		---- new_construction_geothermal --------
		set @facility_imprv_value = 0
		set @facility_land_value = 0
		set @facility_personal_value = 0
		
		set @facility_imprv_value = 
		(
			select sum(isnull(pv.new_val_imprv_hs, 0) + isnull(pv.new_val_imprv_nhs, 0))
			from ##dor_report_prop_assoc as drpa with(nolock)
			join property_val as pv with (nolock) on
				pv.prop_val_yr = drpa.prop_val_yr and
				pv.prop_id = drpa.prop_id and
				pv.sup_num = drpa.sup_num
			join property_sub_type as pst with (nolock) on
				pst.property_sub_cd = pv.sub_type 
			where 
				drpa.dataset_id = @dataset_id and 
				drpa.u500_flag = 0 and
				(isnull(pst.facility_type, '') = 'G')
		)
					
		
		set @facility_land_value = 
		(
			select sum(isnull(pv.new_val_land_hs, 0) + isnull(pv.new_val_land_nhs, 0))
			from ##dor_report_prop_assoc as drpa with(nolock)
			join [property] as p with (nolock) on
				p.prop_id = drpa.prop_id
			join property_val as pv with (nolock) on
				drpa.prop_val_yr = pv.prop_val_yr and
				drpa.sup_num = pv.sup_num and
				drpa.prop_id = pv.prop_id
			join property_sub_type as pst with (nolock) on
				pst.property_sub_cd = pv.sub_type
			where 
				drpa.dataset_id = @dataset_id and 
				drpa.u500_flag = 0 and
				(isnull(pst.facility_type, '') = 'G') and
				(p.prop_type_cd <> 'R' 
					or 
				(p.prop_type_cd = 'R' and isnull(pst.imp_leased_land, 0) = 0) )
		)
		
		
		set @facility_personal_value = 
		(
			select sum(isnull(pv.new_val_p, 0))
			from ##dor_report_prop_assoc as drpa with(nolock)
			join (
				select distinct drpa.prop_id, drpa.prop_val_yr, drpa.sup_num
				from ##dor_report_prop_assoc drpa
				join wash_prop_owner_tax_district_assoc wpotda
				on drpa.prop_id = wpotda.prop_id and
				drpa.sup_num = wpotda.sup_num and
				drpa.prop_val_yr = wpotda.year
				join levy l
				on l.tax_district_id = wpotda.tax_district_id
				and l.year = wpotda.year
				join levy_type lt
				on l.levy_type_cd = lt.levy_type_cd and
				lt.levy_part = 1
				where drpa.dataset_id = @dataset_id		
			) LEVY1
			on drpa.prop_id = LEVY1.prop_id and
				drpa.prop_val_yr = LEVY1.prop_val_yr and
				drpa.sup_num = LEVY1.sup_num
			join [property] as p with (nolock) on
					p.prop_id = drpa.prop_id
			join property_val as pv with (nolock) on
				drpa.prop_val_yr = pv.prop_val_yr and
				drpa.sup_num = pv.sup_num and
				drpa.prop_id = pv.prop_id
			join property_sub_type as pst with (nolock) on
				pst.property_sub_cd = pv.sub_type
			where 
				drpa.dataset_id = @dataset_id and 
				drpa.u500_flag = 0 and 
				(isnull(pst.facility_type, '') = 'G') and
				p.prop_type_cd = 'P'
		)
			
			
		update ##dor_report_general
		set new_construction_geothermal =
			isnull(@facility_imprv_value, 0) + 
			isnull(@facility_land_value, 0) + 
			isnull(@facility_personal_value, 0)
			
					
		/*
		update ##dor_report_general
		set new_construction_windturbine = (
			select	
				##dor_report_general.new_construction_land + 
				##dor_report_general.new_construction_imprv +
				##dor_report_general.new_construction_personal
			from ##dor_report_prop_assoc as drpa with(nolock)
			join property_val as pv with (nolock) on
				pv.prop_val_yr = drpa.prop_val_yr and
				pv.prop_id = drpa.prop_id and
				pv.sup_num = drpa.sup_num 
			join property_sub_type as pst with (nolock) on
				pst.property_sub_cd = pv.sub_type 
			where 
				drpa.dataset_id = @dataset_id and 
				drpa.u500_flag = 0 and
				pst.facility_type = 'W')
		*/		
		
		
		/*
		---- new_construction_solar --------
		update ##dor_report_general
		set new_construction_solar = (
			select	
				##dor_report_general.new_construction_land + 
				##dor_report_general.new_construction_imprv +
				##dor_report_general.new_construction_personal
			from ##dor_report_prop_assoc as drpa with(nolock)
			join property_val as pv with (nolock) on
				pv.prop_val_yr = drpa.prop_val_yr and
				pv.prop_id = drpa.prop_id and
				pv.sup_num = drpa.sup_num 
			join property_sub_type as pst with (nolock) on
				pst.property_sub_cd = pv.sub_type 
			where 
				drpa.dataset_id = @dataset_id and 
				drpa.u500_flag = 0 and
				pst.facility_type = 'S')	
				
		
		update ##dor_report_general
		set new_construction_solar = 0
		where dataset_id = @dataset_id and (isnull(new_construction_solar, 0) <= 0)
				
		---- new_construction_biomass --------
		update ##dor_report_general
		set new_construction_biomass = (
			select	
				##dor_report_general.new_construction_land + 
				##dor_report_general.new_construction_imprv +
				##dor_report_general.new_construction_personal
			from ##dor_report_prop_assoc as drpa with(nolock)
			join property_val as pv with (nolock) on
				pv.prop_val_yr = drpa.prop_val_yr and
				pv.prop_id = drpa.prop_id and
				pv.sup_num = drpa.sup_num 
			join property_sub_type as pst with (nolock) on
				pst.property_sub_cd = pv.sub_type 
			where 
				drpa.dataset_id = @dataset_id and 
				drpa.u500_flag = 0 and
				pst.facility_type = 'B')	
				
				
		update ##dor_report_general
		set new_construction_biomass = 0
		where dataset_id = @dataset_id and (isnull(new_construction_biomass, 0) <= 0)	
						
		---- new_construction_biomass --------
		update ##dor_report_general
		set new_construction_geothermal = (
			select	
				##dor_report_general.new_construction_land + 
				##dor_report_general.new_construction_imprv +
				##dor_report_general.new_construction_personal
			from ##dor_report_prop_assoc as drpa with(nolock)
			join property_val as pv with (nolock) on
				pv.prop_val_yr = drpa.prop_val_yr and
				pv.prop_id = drpa.prop_id and
				pv.sup_num = drpa.sup_num 
			join property_sub_type as pst with (nolock) on
				pst.property_sub_cd = pv.sub_type 
			where 
				drpa.dataset_id = @dataset_id and 
				drpa.u500_flag = 0 and
				pst.facility_type = 'G')	
				
				
		update ##dor_report_general
		set new_construction_geothermal = 0
		where dataset_id = @dataset_id and (isnull(new_construction_geothermal, 0) <= 0)		
								
		*/

	/*		
		---- solar --------
		update ##dor_report_general
		set new_construction_solar = (
			select isnull(i.imp_new_val, 0)
			--select isnull(sum(isnull(pv.new_val_imprv_hs, 0) + isnull(pv.new_val_imprv_nhs, 0)), 0)
			from ##dor_report_prop_assoc as drpa with(nolock)
			join property_val as pv with (nolock) on
					pv.prop_val_yr = drpa.prop_val_yr and
					pv.prop_id = drpa.prop_id and
					pv.sup_num = drpa.sup_num
			join imprv as i with(nolock) on
					pv.prop_val_yr = i.prop_val_yr and
					pv.prop_id = i.prop_id and
					pv.sup_num = i.sup_num
			join imprv_type as it with(nolock) on
					it.imprv_type_cd = i.imprv_type_cd and
					it.facility_type = 'S'		
			where drpa.dataset_id = @dataset_id and drpa.u500_flag = 0)
			
		
		---- biomass --------
		update ##dor_report_general
		set new_construction_biomass = (
			select isnull(i.imp_new_val, 0)
			--select isnull(sum(isnull(pv.new_val_imprv_hs, 0) + isnull(pv.new_val_imprv_nhs, 0)), 0)
			from ##dor_report_prop_assoc as drpa with(nolock)
			join property_val as pv with (nolock) on
					pv.prop_val_yr = drpa.prop_val_yr and
					pv.prop_id = drpa.prop_id and
					pv.sup_num = drpa.sup_num
			join imprv as i with(nolock) on
					pv.prop_val_yr = i.prop_val_yr and
					pv.prop_id = i.prop_id and
					pv.sup_num = i.sup_num
			join imprv_type as it with(nolock) on
					it.imprv_type_cd = i.imprv_type_cd and
					it.facility_type = 'B'		
			where drpa.dataset_id = @dataset_id and drpa.u500_flag = 0)
			
		
		---- geothermal --------
		update ##dor_report_general
		set new_construction_geothermal = (
			select isnull(i.imp_new_val, 0)
			--select isnull(sum(isnull(pv.new_val_imprv_hs, 0) + isnull(pv.new_val_imprv_nhs, 0)), 0)
			from ##dor_report_prop_assoc as drpa with(nolock)
			join property_val as pv with (nolock) on
					pv.prop_val_yr = drpa.prop_val_yr and
					pv.prop_id = drpa.prop_id and
					pv.sup_num = drpa.sup_num
			join imprv as i with(nolock) on
					pv.prop_val_yr = i.prop_val_yr and
					pv.prop_id = i.prop_id and
					pv.sup_num = i.sup_num
			join imprv_type as it with(nolock) on
					it.imprv_type_cd = i.imprv_type_cd and
					it.facility_type = 'G'		
			where drpa.dataset_id = @dataset_id and drpa.u500_flag = 0)
		*/	


		
		select
			@current_use_agreements = count(distinct ld.application_number)
		from ##dor_report_prop_assoc as drpa with(nolock)
		join land_detail as ld with(nolock) on
			ld.prop_val_yr = drpa.prop_val_yr and
			ld.sup_num = drpa.sup_num and
			ld.sale_id = 0 and
			ld.prop_id = drpa.prop_id and
			ld.ag_apply = 'T' and
			ld.application_number is not null		
					
		select
			@new_current_use_agreements = count(distinct ld.application_number)
		from ##dor_report_prop_assoc as drpa with(nolock)
		join land_detail as ld with(nolock) on
			ld.prop_val_yr = drpa.prop_val_yr and
			ld.sup_num = drpa.sup_num and
			ld.sale_id = 0 and
			ld.prop_id = drpa.prop_id and
			ld.ag_apply = 'T' and
			ld.application_number is not null and
			ld.assessment_yr_qualified = drpa.prop_val_yr

		update ##dor_report_general
		set
			current_use_agreements = @current_use_agreements,
			new_current_use_agreements = @new_current_use_agreements
		where dataset_id = @dataset_id
		
		-- Do not allow new construction to go negative
		update ##dor_report_general
		set new_construction = 0
		where dataset_id = @dataset_id and new_construction < 0

		-- Do not allow new construction to go negative
		update ##dor_report_general
		set new_construction_levy2 = 0
		where dataset_id = @dataset_id and new_construction_levy2 < 0

		-------------------------------------------------------------------------------
		-- END PAGE 1
		-------------------------------------------------------------------------------




		-------------------------------------------------------------------------------
		-- BEGIN PAGE 2
		-------------------------------------------------------------------------------

		-- BEGIN - Distribute the freeze loss values to the land segments
		/*
		declare @tblLand table (
			prop_val_yr numeric(4,0) not null,
			sup_num int not null,
			sale_id int not null,
			prop_id int not null,
			land_seg_id int not null,
			mkt_val numeric(14,0) not null,
			ag_val numeric(14,0) not null,
			ag_apply bit not null,
			frz_loss numeric(14,0) not null,
			
			primary key clustered (prop_val_yr, sup_num, sale_id, prop_id, land_seg_id)
			with fillfactor = 100
		)
		insert @tblLand (
			prop_val_yr, sup_num, sale_id, prop_id, land_seg_id,
			mkt_val,
			ag_val,
			ag_apply,
			frz_loss
		)
		select
			ld.prop_val_yr, ld.sup_num, ld.sale_id, ld.prop_id, ld.land_seg_id,
			isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0) * case when ld.hs_pct_override = 0 then 1.0 else (ld.hs_pct / 100.0) end,
			case
				when isnull(ld.ag_val, 0) < isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0)
				then isnull(ld.ag_val, 0) * case when ld.hs_pct_override = 0 then 1.0 else (ld.hs_pct / 100.0) end
				else isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0) * case when ld.hs_pct_override = 0 then 1.0 else (ld.hs_pct / 100.0) end
			end,
			case
				when ld.ag_apply = 'T' and (au.dfl = 1 or au.timber = 1 or au.ag = 1 or au.osp = 1)
				then 1
				else 0
			end,
			0 -- We will calculate later
		from ##dor_report_prop_assoc as drpa with(nolock)
		join property as p with(nolock) on
			p.prop_id = drpa.prop_id and
			p.prop_type_cd in ('R','MH')
		join land_detail as ld with(nolock) on
			drpa.prop_val_yr = ld.prop_val_yr
			and drpa.sup_num = ld.sup_num
			and drpa.prop_id = ld.prop_id
			and ld.sale_id = 0
			and ld.land_seg_homesite = 'T'
		left outer join ag_use as au with(nolock) on
			au.ag_use_cd = ld.ag_use_cd
		--BEGIN - The page 2 totals must match the page 4 totals,
		--therefore we must be certain we use only the same properties,
		--i.e. only those with a valid property use code with a valid DOR land use code
		join property_val as pv with(nolock) on
			pv.prop_val_yr = drpa.prop_val_yr and
			pv.sup_num = drpa.sup_num and
			pv.prop_id = drpa.prop_id
		join property_use as pu with(nolock) on
			pu.property_use_cd = pv.property_use_cd
		join dor_land_use_code as dor with(nolock) on
			dor.code = pu.dor_use_code
		--END - that is the only purpose of these joins
		where drpa.dataset_id = @dataset_id and drpa.u500_flag = 0 and drpa.snr_flag = 1

		-- For each property with land
		declare curProps cursor
		for
			select distinct t.prop_val_yr, t.sup_num, t.prop_id, wpv.snr_land, wpv.snr_frz_loss_land, count(*)
			from @tblLand as t
			join wash_property_val as wpv with(nolock) on
				wpv.prop_val_yr = t.prop_val_yr and
				wpv.sup_num = t.sup_num and
				wpv.prop_id = t.prop_id
			group by t.prop_val_yr, t.sup_num, t.prop_id, wpv.snr_land, wpv.snr_frz_loss_land
		for read only
		
		declare
			@prop_yr numeric(4,0),
			@prop_sup int,
			@prop_id int,
			@snr_land numeric(14,0),
			@snr_frz_loss_land numeric(14,0),
			@num_land_segs int
		declare
			@land_seg_id int,
			@land_seg_val numeric(14,0)
		declare
			@frz_loss_remain numeric(14,0),
			@seg_num int,
			@land_seg_frz_loss numeric(14,0)
			
		open curProps
		fetch next from curProps into @prop_yr, @prop_sup, @prop_id, @snr_land, @snr_frz_loss_land, @num_land_segs
		
		while ( @@fetch_status = 0 )
		begin
			set @frz_loss_remain = @snr_frz_loss_land
			
			declare curLandSeg cursor
			for
				select
					t.land_seg_id,
					val = case when t.ag_apply = 1 then t.ag_val else t.mkt_val end
				from @tblLand as t
				where
					t.prop_val_yr = @prop_yr and
					t.sup_num = @prop_sup and
					t.sale_id = 0 and
					t.prop_id = @prop_id
				order by t.land_seg_id asc
			for read only
			
			open curLandSeg
			fetch next from curLandSeg into @land_seg_id, @land_seg_val
			
			set @seg_num = 0
			while ( @@fetch_status = 0 )
			begin
				set @seg_num = @seg_num + 1
				
				if ( @seg_num = @num_land_segs )
				begin
					-- Give last segment the remainder
					set @land_seg_frz_loss = @frz_loss_remain
				end
				else
				begin
					-- Give this segment a percentage of the freeze loss
					if ( @snr_land <> 0 )
					begin
						set @land_seg_frz_loss = (@land_seg_val / @snr_land) * @snr_frz_loss_land
					end
					else
					begin
						set @land_seg_frz_loss = 0
					end
				end
				
				set @frz_loss_remain = @frz_loss_remain - @land_seg_frz_loss
				
				update @tblLand
				set frz_loss = @land_seg_frz_loss
				where
					prop_val_yr = @prop_yr and
					sup_num = @prop_sup and
					sale_id = 0 and
					prop_id = @prop_id and
					land_seg_id = @land_seg_id				

				fetch next from curLandSeg into @land_seg_id, @land_seg_val
			end
			
			close curLandSeg
			deallocate curLandSeg
			
			fetch next from curProps into @prop_yr, @prop_sup, @prop_id, @snr_land, @snr_frz_loss_land, @num_land_segs
		end
		
		close curProps
		deallocate curProps
		*/
		-- END - Distribute the freeze loss values to the land segments

		insert ##dor_report_real (
			dataset_id, dfl_acres, dfl_market_land, osp_acres, osp_market_land, osp_land,
			tim_acres, tim_market_land, tim_land, ag_acres, ag_market_land, ag_land,
			other_land, combine_DFL_timber_values
		)
		select
			drpa.dataset_id,
			sum(case when au.dfl = 1 and ld.ag_apply = 'T' then isnull(ld.size_acres,0) else 0 end) as dfl_acres,
			sum(case when au.dfl = 1 and ld.ag_apply = 'T' then case when isnull(ld.ag_val, 0) < isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0) then isnull(ld.ag_val, 0) else isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0) end /*- isnull(lfi.frz_loss, 0)*/ else 0 end) as dfl_market_land,
		
			sum(case when au.osp = 1 and ld.ag_apply = 'T' then isnull(ld.size_acres,0) else 0 end) as osp_acres,
			sum(case when au.osp = 1 and ld.ag_apply = 'T' then isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end,0) else 0 end) as osp_market_land,
			sum(case when au.osp = 1 and ld.ag_apply = 'T' then case when isnull(ld.ag_val, 0) < isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0) then isnull(ld.ag_val, 0) else isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0) end /*- isnull(lfi.frz_loss, 0)*/ else 0 end) as osp_land,
		
			sum(case when au.timber = 1 and ld.ag_apply = 'T' then isnull(ld.size_acres,0) else 0 end) as tim_acres,
			sum(case when au.timber = 1 and ld.ag_apply = 'T' then isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end,0) else 0 end) as tim_market_land,
			sum(case when au.timber = 1 and ld.ag_apply = 'T' then case when isnull(ld.ag_val, 0) < isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0) then isnull(ld.ag_val, 0) else isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0) end /*- isnull(lfi.frz_loss, 0)*/ else 0 end) as tim_land,
		
			sum(case when au.ag = 1 and ld.ag_apply = 'T' then isnull(ld.size_acres,0) else 0 end) as ag_acres,
			sum(case when au.ag = 1 and ld.ag_apply = 'T' then isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end,0) else 0 end) as ag_market_land,
			sum(case when au.ag = 1 and ld.ag_apply = 'T' then case when isnull(ld.ag_val, 0) < isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0) then isnull(ld.ag_val, 0) else isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0) end /*- isnull(lfi.frz_loss, 0)*/ else 0 end) as ag_land,
			sum(
				case
					when
						isnull(ld.ag_apply, 'F') <> 'T'
						or (
							isnull(au.dfl, 0) = 0 and
							isnull(au.osp, 0) = 0 and
							isnull(au.timber, 0) = 0 and
							isnull(au.ag, 0) = 0
						)
					then
						isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0) /*- isnull(lfi.frz_loss, 0)*/
					else 0
				end
			) as other_land,
			@combine_DFL_timber_values
		from ##dor_report_prop_assoc as drpa with(nolock)
		join property as p with(nolock) on
			p.prop_id = drpa.prop_id and
			p.prop_type_cd in ('R','MH')
		join land_detail as ld with(nolock) on
			drpa.prop_val_yr = ld.prop_val_yr
			and drpa.sup_num = ld.sup_num
			and drpa.prop_id = ld.prop_id
			and ld.sale_id = 0
		/*
		left outer join @tblLand as lfi on
			lfi.prop_val_yr = ld.prop_val_yr and
			lfi.sup_num = ld.sup_num and
			lfi.sale_id = ld.sale_id and
			lfi.prop_id = ld.prop_id and
			lfi.land_seg_id = ld.land_seg_id
		*/
		left outer join ag_use as au with(nolock) on
			ld.ag_use_cd = au.ag_use_cd
		/*
			BEGIN - The page 2 totals must match the page 4 totals,
			therefore we must be certain we use only the same properties,
			i.e. only those with a valid property use code with a valid DOR land use code
		*/	
		join property_val as pv with(nolock) on
			pv.prop_val_yr = drpa.prop_val_yr and
			pv.sup_num = drpa.sup_num and
			pv.prop_id = drpa.prop_id
		join property_use as pu with(nolock) on
			pu.property_use_cd = pv.property_use_cd
		join dor_land_use_code as dor with(nolock) on
			dor.code = pu.dor_use_code
		/* END - that is the only purpose of these joins */
					join (
						select distinct drpa.prop_id, drpa.prop_val_yr, drpa.sup_num
						from ##dor_report_prop_assoc drpa
						join wash_prop_owner_tax_district_assoc wpotda
						on drpa.prop_id = wpotda.prop_id and
						drpa.sup_num = wpotda.sup_num and
						drpa.prop_val_yr = wpotda.year
						join levy l
						on l.tax_district_id = wpotda.tax_district_id
						and l.year = wpotda.year
						join levy_type lt
						on l.levy_type_cd = lt.levy_type_cd and
						lt.levy_part = 1
						--where drpa.dataset_id = @dataset_id		
					) LEVY1
					on drpa.prop_id = LEVY1.prop_id and
					drpa.prop_val_yr = LEVY1.prop_val_yr and
					drpa.sup_num = LEVY1.sup_num			
		where drpa.dataset_id = @dataset_id and drpa.u500_flag = 0
		group by drpa.dataset_id

		if ( @@rowcount = 0 )
		begin
			insert into ##dor_report_real(
				dataset_id, dfl_acres, dfl_market_land, osp_acres, osp_market_land,
				osp_land, tim_acres, tim_market_land, tim_land, ag_acres, ag_market_land, ag_land,
				other_land, combine_DFL_timber_values
			)
			values (
				@dataset_id, 0, 0, 0, 0,
				0, 0, 0, 0, 0, 0, 0,
				0, @combine_DFL_timber_values
			)
		end 

		set @dfl_market_land_levy2		= 0
		set @osp_land_levy2		= 0
		set @ag_land_levy2		= 0
		set @tim_land_levy2		= 0
		set @other_land_levy2		= 0
		set @other_imprv_levy2		= 0
		set @other_senior_levy2		= 0
		set @other_total_levy2		= 0
		set @total_land_levy2		= 0
		set @total_imprv_levy2		= 0
		set @total_senior_levy2		= 0
		set @total_total_levy2		= 0
		
		select
			@dfl_market_land_levy2 = sum(case when au.dfl = 1 and ld.ag_apply = 'T' then case when isnull(ld.ag_val, 0) < isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0) then isnull(ld.ag_val, 0) else isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0) end /*- isnull(lfi.frz_loss, 0)*/ else 0 end),
			@osp_land_levy2 = sum(case when au.osp = 1 and ld.ag_apply = 'T' then case when isnull(ld.ag_val, 0) < isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0) then isnull(ld.ag_val, 0) else isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0) end /*- isnull(lfi.frz_loss, 0)*/ else 0 end),
			@tim_land_levy2 = sum(case when au.timber = 1 and ld.ag_apply = 'T' then case when isnull(ld.ag_val, 0) < isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0) then isnull(ld.ag_val, 0) else isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0) end /*- isnull(lfi.frz_loss, 0)*/ else 0 end),
			@ag_land_levy2 = sum(case when au.ag = 1 and ld.ag_apply = 'T' then case when isnull(ld.ag_val, 0) < isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0) then isnull(ld.ag_val, 0) else isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0) end /*- isnull(lfi.frz_loss, 0)*/ else 0 end),
			@other_land_levy2 = 			sum(
				case
					when
						isnull(ld.ag_apply, 'F') <> 'T'
						or (
							isnull(au.dfl, 0) = 0 and
							isnull(au.osp, 0) = 0 and
							isnull(au.timber, 0) = 0 and
							isnull(au.ag, 0) = 0
						)
					then
						isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0) /*- isnull(lfi.frz_loss, 0)*/
					else 0
				end
			)
			--@combine_DFL_timber_values
		from ##dor_report_prop_assoc as drpa with(nolock)
		join property as p with(nolock) on
			p.prop_id = drpa.prop_id and
			p.prop_type_cd in ('R','MH')
		join land_detail as ld with(nolock) on
			drpa.prop_val_yr = ld.prop_val_yr
			and drpa.sup_num = ld.sup_num
			and drpa.prop_id = ld.prop_id
			and ld.sale_id = 0
		/*
		left outer join @tblLand as lfi on
			lfi.prop_val_yr = ld.prop_val_yr and
			lfi.sup_num = ld.sup_num and
			lfi.sale_id = ld.sale_id and
			lfi.prop_id = ld.prop_id and
			lfi.land_seg_id = ld.land_seg_id
		*/
		left outer join ag_use as au with(nolock) on
			ld.ag_use_cd = au.ag_use_cd
		/*
			BEGIN - The page 2 totals must match the page 4 totals,
			therefore we must be certain we use only the same properties,
			i.e. only those with a valid property use code with a valid DOR land use code
		*/	
		join property_val as pv with(nolock) on
			pv.prop_val_yr = drpa.prop_val_yr and
			pv.sup_num = drpa.sup_num and
			pv.prop_id = drpa.prop_id
		join property_use as pu with(nolock) on
			pu.property_use_cd = pv.property_use_cd
		join dor_land_use_code as dor with(nolock) on
			dor.code = pu.dor_use_code
					join (
						select distinct drpa.prop_id, drpa.prop_val_yr, drpa.sup_num
						from ##dor_report_prop_assoc drpa
						join wash_prop_owner_tax_district_assoc wpotda
						on drpa.prop_id = wpotda.prop_id and
						drpa.sup_num = wpotda.sup_num and
						drpa.prop_val_yr = wpotda.year
						join levy l
						on l.tax_district_id = wpotda.tax_district_id
						and l.year = wpotda.year
						join levy_type lt
						on l.levy_type_cd = lt.levy_type_cd and
						lt.levy_part = 2
						where drpa.dataset_id = @dataset_id		
					) LEVY2
					on drpa.prop_id = LEVY2.prop_id and
					drpa.prop_val_yr = LEVY2.prop_val_yr and
					drpa.sup_num = LEVY2.sup_num			
		/* END - that is the only purpose of these joins */
		where drpa.dataset_id = @dataset_id and drpa.u500_flag = 0
		group by drpa.dataset_id
		
		update ##dor_report_real
		set 
			dfl_market_land_levy2 = @dfl_market_land_levy2,
			osp_land_levy2 = @osp_land_levy2,
			tim_land_levy2 = @tim_land_levy2,
			ag_land_levy2 = @ag_land_levy2,
			other_land_levy2 = @other_land_levy2
		where dataset_id = 	@dataset_id	
		
		

				

		
		
		--OPEN SPACE (OSP) IMPROVEMENT
		set @osp_imprv_freeze		= 0
		
		select
			@osp_imprv_freeze = sum(
				case
					when drpa.snr_flag = 1
					then wpov.imprv_non_hstd_val + wpv.snr_imprv_lesser
					else 0
				end
			)
		from ##dor_report_prop_assoc as drpa with(nolock) 
		join wash_property_val as wpv with(nolock) on
			wpv.prop_val_yr = drpa.prop_val_yr and
			wpv.sup_num = drpa.sup_num and
			wpv.prop_id = drpa.prop_id
		join wash_prop_owner_val as wpov with(nolock) on
			wpov.year = drpa.prop_val_yr and
			wpov.sup_num = drpa.sup_num and
			wpov.prop_id = drpa.prop_id
		join dbo.property as p1 with(nolock) on
					p1.[prop_id] = drpa.[prop_id]
		join dbo.property_val as pv1 with(nolock) on
					pv1.[prop_id] = wpv.[prop_id] and
					pv1.[prop_val_yr] = wpv.[prop_val_yr] and
					pv1.sup_num = wpv.sup_num
		join property_sub_type as pst with(nolock) on
			pst.property_sub_cd = pv1.sub_type
			and pst.imp_leased_land <> 1
		join property_use as pu with(nolock) on
					pu.property_use_cd = pv1.property_use_cd
		where
					pu.dor_use_code in ('94') and
					pv1.[prop_inactive_dt] is null 
					and dataset_id = @dataset_id						

		set @osp_imprv_nonfreeze		= 0

		select
			@osp_imprv_nonfreeze = sum(case
					when drpa.snr_flag = 1
					then  0
					else wpov.imprv_non_hstd_val + wpov.imprv_hstd_val
				end)
		from ##dor_report_prop_assoc as drpa with(nolock)
		join wash_prop_owner_val as wpov with(nolock) on
			wpov.year = drpa.prop_val_yr and
			wpov.sup_num = drpa.sup_num and
			wpov.prop_id = drpa.prop_id			
		join dbo.property as p1 with(nolock) on
					p1.[prop_id] = drpa.[prop_id]
		join dbo.property_val as pv1 with(nolock) on
					pv1.[prop_id] = wpov.[prop_id] and
					pv1.[prop_val_yr] = wpov.year and
					pv1.sup_num = wpov.sup_num
		join property_sub_type as pst with(nolock) on
			pst.property_sub_cd = pv1.sub_type
			and pst.imp_leased_land <> 1
		join property_use as pu with(nolock) on
					pu.property_use_cd = pv1.property_use_cd
		where
					pu.dor_use_code in ('94') and
					pv1.[prop_inactive_dt] is null 
					and dataset_id = @dataset_id						




		set @osp_imprv = isnull(@osp_imprv_freeze, 0) + isnull(@osp_imprv_nonfreeze, 0)
		
		
						
						
		--AG / FARM IMPROVEMENT
		set @ag_imprv_freeze		= 0
		
		select
			@ag_imprv_freeze = sum(
				case
					when drpa.snr_flag = 1
					then  wpov.imprv_non_hstd_val + wpv.snr_imprv_lesser
					else 0
				end
				)
		from ##dor_report_prop_assoc as drpa with(nolock)
		join wash_property_val as wpv with(nolock) on
			wpv.prop_val_yr = drpa.prop_val_yr and
			wpv.sup_num = drpa.sup_num and
			wpv.prop_id = drpa.prop_id
		join wash_prop_owner_val as wpov with(nolock) on
			wpov.year = drpa.prop_val_yr and
			wpov.sup_num = drpa.sup_num and
			wpov.prop_id = drpa.prop_id
		join dbo.property as p1 with(nolock) on
					p1.[prop_id] = drpa.[prop_id]
		join dbo.property_val as pv1 with(nolock) on
					pv1.[prop_id] = wpv.[prop_id] and
					pv1.[prop_val_yr] = wpv.[prop_val_yr] and
					pv1.sup_num = wpv.sup_num
		join property_sub_type as pst with(nolock) on
			pst.property_sub_cd = pv1.sub_type
			and pst.imp_leased_land <> 1
		join property_use as pu with(nolock) on
					pu.property_use_cd = pv1.property_use_cd
		where
					pu.dor_use_code in ('83') and
					pv1.[prop_inactive_dt] is null 
					and dataset_id = @dataset_id						


		set @ag_imprv_nonfreeze		= 0

		select
			@ag_imprv_nonfreeze =  sum(
				case
					when drpa.snr_flag = 1
					then  0
					else wpov.imprv_non_hstd_val + wpov.imprv_hstd_val
				end
				)
		from ##dor_report_prop_assoc as drpa with(nolock)
		join wash_prop_owner_val as wpov with(nolock) on
			wpov.year = drpa.prop_val_yr and
			wpov.sup_num = drpa.sup_num and
			wpov.prop_id = drpa.prop_id			
		join dbo.property as p1 with(nolock) on
					p1.[prop_id] = drpa.[prop_id]
		join dbo.property_val as pv1 with(nolock) on
					pv1.[prop_id] = wpov.[prop_id] and
					pv1.[prop_val_yr] = wpov.year and
					pv1.sup_num = wpov.sup_num
		join property_sub_type as pst with(nolock) on
			pst.property_sub_cd = pv1.sub_type
			and pst.imp_leased_land <> 1
		join property_use as pu with(nolock) on
					pu.property_use_cd = pv1.property_use_cd
		where
					pu.dor_use_code in ('83') and
					pv1.[prop_inactive_dt] is null 
					and dataset_id = @dataset_id	
		
	
		set @ag_imprv = isnull(@ag_imprv_freeze, 0) + isnull(@ag_imprv_nonfreeze, 0)
		
										
		
		--OTHER IMPROVEMENT
		set @other_imprv_freeze		= 0
		
		select
			@other_imprv_freeze = sum(
				case
					when drpa.snr_flag = 1
					then  wpov.imprv_non_hstd_val + wpv.snr_imprv_lesser
					else 0
				end
			)
		from ##dor_report_prop_assoc as drpa with(nolock)
		join wash_property_val as wpv with(nolock) on
			wpv.prop_val_yr = drpa.prop_val_yr and
			wpv.sup_num = drpa.sup_num and
			wpv.prop_id = drpa.prop_id
		join wash_prop_owner_val as wpov with(nolock) on
			wpov.year = drpa.prop_val_yr and
			wpov.sup_num = drpa.sup_num and
			wpov.prop_id = drpa.prop_id
		/*
			BEGIN - The page 2 totals must match the page 4 totals,
			therefore we must be certain we use only the same properties,
			i.e. only those with a valid property use code with a valid DOR land use code
		*/
		join property_val as pv with(nolock) on
			pv.prop_val_yr = drpa.prop_val_yr and
			pv.sup_num = drpa.sup_num and
			pv.prop_id = drpa.prop_id
		join property_sub_type as pst with(nolock) on
			pst.property_sub_cd = pv.sub_type
			and pst.imp_leased_land <> 1
		join property_use as pu with(nolock) on
			pu.property_use_cd = pv.property_use_cd
		join dor_land_use_code as dor with(nolock) on
			dor.code = pu.dor_use_code
		/* END - that is the only purpose of these joins */
		where drpa.dataset_id = @dataset_id and drpa.u500_flag = 0
		and pu.dor_use_code not in ('94', '83')
		group by drpa.dataset_id

		set @other_imprv_nonfreeze		= 0
		
		select
			@other_imprv_nonfreeze = sum(
				case
					when drpa.snr_flag = 1
					then  0
					else wpov.imprv_non_hstd_val + wpov.imprv_hstd_val
				end
			)
		from ##dor_report_prop_assoc as drpa with(nolock)
		join wash_property_val as wpv with(nolock) on
			wpv.prop_val_yr = drpa.prop_val_yr and
			wpv.sup_num = drpa.sup_num and
			wpv.prop_id = drpa.prop_id
		join wash_prop_owner_val as wpov with(nolock) on
			wpov.year = drpa.prop_val_yr and
			wpov.sup_num = drpa.sup_num and
			wpov.prop_id = drpa.prop_id
		/*
			BEGIN - The page 2 totals must match the page 4 totals,
			therefore we must be certain we use only the same properties,
			i.e. only those with a valid property use code with a valid DOR land use code
		*/
		join property_val as pv with(nolock) on
			pv.prop_val_yr = drpa.prop_val_yr and
			pv.sup_num = drpa.sup_num and
			pv.prop_id = drpa.prop_id
		join property_sub_type as pst with(nolock) on
			pst.property_sub_cd = pv.sub_type
			and pst.imp_leased_land <> 1
		join property_use as pu with(nolock) on
			pu.property_use_cd = pv.property_use_cd
		join dor_land_use_code as dor with(nolock) on
			dor.code = pu.dor_use_code
		/* END - that is the only purpose of these joins */
		where drpa.dataset_id = @dataset_id and drpa.u500_flag = 0
		and pu.dor_use_code not in ('94', '83')
		group by drpa.dataset_id

		set @other_imprv = isnull(@other_imprv_freeze, 0) + isnull(@other_imprv_nonfreeze, 0) - isnull(@dor_exempt_amount, 0)

		--OTHER SENIOR
		set @other_senior		= 0
		
		select
			@other_senior = sum(
				isnull(wpv.snr_exempt_loss, 0)
			) 
		from ##dor_report_prop_assoc as drpa with(nolock)
		join wash_property_val as wpv with(nolock) on
			wpv.prop_val_yr = drpa.prop_val_yr and
			wpv.sup_num = drpa.sup_num and
			wpv.prop_id = drpa.prop_id
		join wash_prop_owner_val as wpov with(nolock) on
			wpov.year = drpa.prop_val_yr and
			wpov.sup_num = drpa.sup_num and
			wpov.prop_id = drpa.prop_id
		/*
			BEGIN - The page 2 totals must match the page 4 totals,
			therefore we must be certain we use only the same properties,
			i.e. only those with a valid property use code with a valid DOR land use code
		*/
		join property_val as pv with(nolock) on
			pv.prop_val_yr = drpa.prop_val_yr and
			pv.sup_num = drpa.sup_num and
			pv.prop_id = drpa.prop_id
		join property_sub_type as pst with(nolock) on
			pst.property_sub_cd = pv.sub_type
			and pst.imp_leased_land <> 1
		join property_use as pu with(nolock) on
			pu.property_use_cd = pv.property_use_cd
		join dor_land_use_code as dor with(nolock) on
			dor.code = pu.dor_use_code
		/* END - that is the only purpose of these joins */
		where drpa.dataset_id = @dataset_id and drpa.u500_flag = 0
		and pu.dor_use_code not in ('88', '94', '83', '95') -- THESE CODES ARE HANDLED BY OTHER FIELDS SO SHOULD NOT BE INCLUDED IN THE OTHER CATEGORY
		group by drpa.dataset_id

		--set @other_senior = isnull(@other_senior, 0) NEED TO SUBTRACT DFL SO MOVED LOWER

		
				
		--DFL SENIOR
		set @dfl_senior		= 0
		
		select
			@dfl_senior_adjust = sum(wpv1.snr_exempt_loss),
			@dfl_senior = sum((isnull(pv1.ag_hs_use_val, 0) + isnull(pv1.timber_hs_use_val,0)) * isnull(eqc.percentage,100)) --OVER ()
		from ##dor_report_prop_assoc as drpa with(nolock)
		join dbo.property as p1 with(nolock) on
					p1.[prop_id] = drpa.[prop_id]
		join dbo.property_val as pv1 with(nolock) on
					pv1.[prop_id] = drpa.[prop_id] and
					pv1.[prop_val_yr] = drpa.[prop_val_yr] and
					pv1.[sup_num] = drpa.[sup_num]
		join property_sub_type as pst with(nolock) on
			pst.property_sub_cd = pv1.sub_type
			and pst.imp_leased_land <> 1
		join property_use as pu with(nolock) on
					pu.property_use_cd = pv1.property_use_cd
		join dbo.property_exemption as pe1 with(nolock) on
					pe1.[exmpt_tax_yr] = drpa.[prop_val_yr] and
					pe1.[owner_tax_yr] = drpa.[prop_val_yr] and
					pe1.[prop_id] = drpa.[prop_id] and
					pe1.[sup_num] = pv1.[sup_num]
		left join exmpt_qualify_code as eqc with(nolock) on
					eqc.year = pe1.exmpt_tax_yr and
					eqc.exempt_type_cd = pe1.exmpt_type_cd and
					eqc.income_min <= pv1.income_value and
					eqc.income_max >= pv1.income_value
		join dbo.property_tax_area as pta1 with(nolock) on
					pta1.[prop_id] = drpa.[prop_id] and
					pta1.[year] = drpa.[prop_val_yr] and
					pta1.[sup_num] = pv1.[sup_num]
		join dbo.tax_area as ta1 with(nolock) on
					ta1.[tax_area_id] = pta1.[tax_area_id]
		join dbo.wash_prop_owner_val as wpov1 with(nolock) on
					wpov1.[prop_id] = drpa.[prop_id] and
					wpov1.[year] = drpa.[prop_val_yr] and
					wpov1.[sup_num] = pv1.[sup_num]
		join dbo.wash_property_val as wpv1 with(nolock) on
					wpv1.[prop_id] = drpa.[prop_id] and
					wpv1.[prop_val_yr] = drpa.[prop_val_yr] and
					wpv1.[sup_num] = drpa.[sup_num]
		where
					pe1.[exmpt_type_cd] like '%snr%' and
					pv1.[prop_inactive_dt] is null and
					pu.dor_use_code in ('88')-- and
					and dataset_id = @dataset_id	
			
		set @dfl_senior_levy2		= 0
		
		select
			@dfl_senior_levy2_adjust = sum(wpv1.snr_taxable_portion),
			@dfl_senior_levy2 = sum(isnull(pv1.ag_hs_use_val, 0) + isnull(pv1.timber_hs_use_val,0)) --OVER ()
		from ##dor_report_prop_assoc as drpa with(nolock)
		join dbo.property as p1 with(nolock) on
					p1.[prop_id] = drpa.[prop_id]
		join dbo.property_val as pv1 with(nolock) on
					pv1.[prop_id] = drpa.[prop_id] and
					pv1.[prop_val_yr] = drpa.[prop_val_yr] and
					pv1.[sup_num] = drpa.[sup_num]
		join property_sub_type as pst with(nolock) on
			pst.property_sub_cd = pv1.sub_type
			and pst.imp_leased_land <> 1
		join property_use as pu with(nolock) on
					pu.property_use_cd = pv1.property_use_cd
		join dbo.property_exemption as pe1 with(nolock) on
					pe1.[exmpt_tax_yr] = drpa.[prop_val_yr] and
					pe1.[owner_tax_yr] = drpa.[prop_val_yr] and
					pe1.[prop_id] = drpa.[prop_id] and
					pe1.[sup_num] = pv1.[sup_num]
		join dbo.property_tax_area as pta1 with(nolock) on
					pta1.[prop_id] = drpa.[prop_id] and
					pta1.[year] = drpa.[prop_val_yr] and
					pta1.[sup_num] = pv1.[sup_num]
		join dbo.tax_area as ta1 with(nolock) on
					ta1.[tax_area_id] = pta1.[tax_area_id]
		join dbo.wash_prop_owner_val as wpov1 with(nolock) on
					wpov1.[prop_id] = drpa.[prop_id] and
					wpov1.[year] = drpa.[prop_val_yr] and
					wpov1.[sup_num] = pv1.[sup_num]
		join dbo.wash_property_val as wpv1 with(nolock) on
					wpv1.[prop_id] = drpa.[prop_id] and
					wpv1.[prop_val_yr] = drpa.[prop_val_yr] and
					wpv1.[sup_num] = drpa.[sup_num]
					join (
						select distinct drpa.prop_id, drpa.prop_val_yr, drpa.sup_num
						from ##dor_report_prop_assoc drpa
						join wash_prop_owner_tax_district_assoc wpotda
						on drpa.prop_id = wpotda.prop_id and
						drpa.sup_num = wpotda.sup_num and
						drpa.prop_val_yr = wpotda.year
						join levy l
						on l.tax_district_id = wpotda.tax_district_id
						and l.year = wpotda.year
						join levy_type lt
						on l.levy_type_cd = lt.levy_type_cd and
						lt.levy_part = 2
						where drpa.dataset_id = @dataset_id		
					) LEVY2
					on drpa.prop_id = LEVY2.prop_id and
					drpa.prop_val_yr = LEVY2.prop_val_yr and
					drpa.sup_num = LEVY2.sup_num					
		where
					pe1.[exmpt_type_cd] like '%snr%' and
					pv1.[prop_inactive_dt] is null and
					pu.dor_use_code in ('88')
					and dataset_id = @dataset_id						

		set @dfl_senior = isnull(@dfl_senior, 0)
		set @dfl_senior_levy2 = isnull(@dfl_senior_levy2, 0)	

		set @other_senior = isnull(@other_senior, 0) + isnull(@dfl_senior_adjust,0) - isnull(@dfl_senior,0)

		
		--OPEN SPACE (OSP) SENIOR
		set @osp_senior		= 0
		
		select
			@osp_senior = sum(wpv1.snr_exempt_loss) --OVER ()
		from ##dor_report_prop_assoc as drpa with(nolock)
		join dbo.property as p1 with(nolock) on
					p1.[prop_id] = drpa.[prop_id]
		join dbo.property_val as pv1 with(nolock) on
					pv1.[prop_id] = drpa.[prop_id] and
					pv1.[prop_val_yr] = drpa.[prop_val_yr] and
					pv1.[sup_num] = drpa.[sup_num]
		join property_sub_type as pst with(nolock) on
			pst.property_sub_cd = pv1.sub_type
			and pst.imp_leased_land <> 1
		join property_use as pu with(nolock) on
					pu.property_use_cd = pv1.property_use_cd
		join dbo.property_exemption as pe1 with(nolock) on
					pe1.[exmpt_tax_yr] = drpa.[prop_val_yr] and
					pe1.[owner_tax_yr] = drpa.[prop_val_yr] and
					pe1.[prop_id] = drpa.[prop_id] and
					pe1.[sup_num] = pv1.[sup_num]
		join dbo.property_tax_area as pta1 with(nolock) on
					pta1.[prop_id] = drpa.[prop_id] and
					pta1.[year] = drpa.[prop_val_yr] and
					pta1.[sup_num] = pv1.[sup_num]
		join dbo.tax_area as ta1 with(nolock) on
					ta1.[tax_area_id] = pta1.[tax_area_id]
		join dbo.wash_prop_owner_val as wpov1 with(nolock) on
					wpov1.[prop_id] = drpa.[prop_id] and
					wpov1.[year] = drpa.[prop_val_yr] and
					wpov1.[sup_num] = pv1.[sup_num]
		join dbo.wash_property_val as wpv1 with(nolock) on
					wpv1.[prop_id] = drpa.[prop_id] and
					wpv1.[prop_val_yr] = drpa.[prop_val_yr] and
					wpv1.[sup_num] = drpa.[sup_num]
		where
					pe1.[exmpt_type_cd] like '%snr%' and
					pv1.[prop_inactive_dt] is null and
					pu.dor_use_code in ('94') 
					and dataset_id = @dataset_id	
					
		set @osp_senior_levy2		= 0

		select
			@osp_senior_levy2 = sum(wpv1.snr_taxable_portion) --OVER ()
		from ##dor_report_prop_assoc as drpa with(nolock)
		join dbo.property as p1 with(nolock) on
					p1.[prop_id] = drpa.[prop_id]
		join dbo.property_val as pv1 with(nolock) on
					pv1.[prop_id] = drpa.[prop_id] and
					pv1.[prop_val_yr] = drpa.[prop_val_yr] and
					pv1.[sup_num] = drpa.[sup_num]
		join property_sub_type as pst with(nolock) on
			pst.property_sub_cd = pv1.sub_type
			and pst.imp_leased_land <> 1
		join property_use as pu with(nolock) on
					pu.property_use_cd = pv1.property_use_cd
		join dbo.property_exemption as pe1 with(nolock) on
					pe1.[exmpt_tax_yr] = drpa.[prop_val_yr] and
					pe1.[owner_tax_yr] = drpa.[prop_val_yr] and
					pe1.[prop_id] = drpa.[prop_id] and
					pe1.[sup_num] = pv1.[sup_num]
		join dbo.property_tax_area as pta1 with(nolock) on
					pta1.[prop_id] = drpa.[prop_id] and
					pta1.[year] = drpa.[prop_val_yr] and
					pta1.[sup_num] = pv1.[sup_num]
		join dbo.tax_area as ta1 with(nolock) on
					ta1.[tax_area_id] = pta1.[tax_area_id]
		join dbo.wash_prop_owner_val as wpov1 with(nolock) on
					wpov1.[prop_id] = drpa.[prop_id] and
					wpov1.[year] = drpa.[prop_val_yr] and
					wpov1.[sup_num] = pv1.[sup_num]
		join dbo.wash_property_val as wpv1 with(nolock) on
					wpv1.[prop_id] = drpa.[prop_id] and
					wpv1.[prop_val_yr] = drpa.[prop_val_yr] and
					wpv1.[sup_num] = drpa.[sup_num]
					join (
						select distinct drpa.prop_id, drpa.prop_val_yr, drpa.sup_num
						from ##dor_report_prop_assoc drpa
						join wash_prop_owner_tax_district_assoc wpotda
						on drpa.prop_id = wpotda.prop_id and
						drpa.sup_num = wpotda.sup_num and
						drpa.prop_val_yr = wpotda.year
						join levy l
						on l.tax_district_id = wpotda.tax_district_id
						and l.year = wpotda.year
						join levy_type lt
						on l.levy_type_cd = lt.levy_type_cd and
						lt.levy_part = 2
						where drpa.dataset_id = @dataset_id		
					) LEVY2
					on drpa.prop_id = LEVY2.prop_id and
					drpa.prop_val_yr = LEVY2.prop_val_yr and
					drpa.sup_num = LEVY2.sup_num					
		where
					pe1.[exmpt_type_cd] like '%snr%' and
					pv1.[prop_inactive_dt] is null and
					pu.dor_use_code in ('94') 
					and dataset_id = @dataset_id	

		set @osp_senior = isnull(@osp_senior, 0)
		set @osp_senior_levy2 = isnull(@osp_senior_levy2, 0)	
		
		
		--AG / FARM SENIOR
		set @ag_senior		= 0
		
		select
			@ag_senior = sum(wpv1.snr_exempt_loss) --OVER ()
		from ##dor_report_prop_assoc as drpa with(nolock)
		join dbo.property as p1 with(nolock) on
					p1.[prop_id] = drpa.[prop_id]
		join dbo.property_val as pv1 with(nolock) on
					pv1.[prop_id] = drpa.[prop_id] and
					pv1.[prop_val_yr] = drpa.[prop_val_yr] and
					pv1.[sup_num] = drpa.[sup_num]
		join property_sub_type as pst with(nolock) on
			pst.property_sub_cd = pv1.sub_type
			and pst.imp_leased_land <> 1
		join property_use as pu with(nolock) on
					pu.property_use_cd = pv1.property_use_cd
		join dbo.property_exemption as pe1 with(nolock) on
					pe1.[exmpt_tax_yr] = drpa.[prop_val_yr] and
					pe1.[owner_tax_yr] = drpa.[prop_val_yr] and
					pe1.[prop_id] = drpa.[prop_id] and
					pe1.[sup_num] = pv1.[sup_num]
		join dbo.property_tax_area as pta1 with(nolock) on
					pta1.[prop_id] = drpa.[prop_id] and
					pta1.[year] = drpa.[prop_val_yr] and
					pta1.[sup_num] = pv1.[sup_num]
		join dbo.tax_area as ta1 with(nolock) on
					ta1.[tax_area_id] = pta1.[tax_area_id]
		join dbo.wash_prop_owner_val as wpov1 with(nolock) on
					wpov1.[prop_id] = drpa.[prop_id] and
					wpov1.[year] = drpa.[prop_val_yr] and
					wpov1.[sup_num] = pv1.[sup_num]
		join dbo.wash_property_val as wpv1 with(nolock) on
					wpv1.[prop_id] = drpa.[prop_id] and
					wpv1.[prop_val_yr] = drpa.[prop_val_yr] and
					wpv1.[sup_num] = drpa.[sup_num]
		where
					pe1.[exmpt_type_cd] like '%snr%' and
					pv1.[prop_inactive_dt] is null and
					pu.dor_use_code in ('83')
					and dataset_id = @dataset_id	
				
		set @ag_senior_levy2		= 0
		
		select
			@ag_senior_levy2 = sum(wpv1.snr_taxable_portion) --OVER ()
		from ##dor_report_prop_assoc as drpa with(nolock)
		join dbo.property as p1 with(nolock) on
					p1.[prop_id] = drpa.[prop_id]
		join dbo.property_val as pv1 with(nolock) on
					pv1.[prop_id] = drpa.[prop_id] and
					pv1.[prop_val_yr] = drpa.[prop_val_yr] and
					pv1.[sup_num] = drpa.[sup_num]
		join property_sub_type as pst with(nolock) on
			pst.property_sub_cd = pv1.sub_type
			and pst.imp_leased_land <> 1
		join property_use as pu with(nolock) on
					pu.property_use_cd = pv1.property_use_cd
		join dbo.property_exemption as pe1 with(nolock) on
					pe1.[exmpt_tax_yr] = drpa.[prop_val_yr] and
					pe1.[owner_tax_yr] = drpa.[prop_val_yr] and
					pe1.[prop_id] = drpa.[prop_id] and
					pe1.[sup_num] = pv1.[sup_num]
		join dbo.property_tax_area as pta1 with(nolock) on
					pta1.[prop_id] = drpa.[prop_id] and
					pta1.[year] = drpa.[prop_val_yr] and
					pta1.[sup_num] = pv1.[sup_num]
		join dbo.tax_area as ta1 with(nolock) on
					ta1.[tax_area_id] = pta1.[tax_area_id]
		join dbo.wash_prop_owner_val as wpov1 with(nolock) on
					wpov1.[prop_id] = drpa.[prop_id] and
					wpov1.[year] = drpa.[prop_val_yr] and
					wpov1.[sup_num] = pv1.[sup_num]
		join dbo.wash_property_val as wpv1 with(nolock) on
					wpv1.[prop_id] = drpa.[prop_id] and
					wpv1.[prop_val_yr] = drpa.[prop_val_yr] and
					wpv1.[sup_num] = drpa.[sup_num]
					join (
						select distinct drpa.prop_id, drpa.prop_val_yr, drpa.sup_num
						from ##dor_report_prop_assoc drpa
						join wash_prop_owner_tax_district_assoc wpotda
						on drpa.prop_id = wpotda.prop_id and
						drpa.sup_num = wpotda.sup_num and
						drpa.prop_val_yr = wpotda.year
						join levy l
						on l.tax_district_id = wpotda.tax_district_id
						and l.year = wpotda.year
						join levy_type lt
						on l.levy_type_cd = lt.levy_type_cd and
						lt.levy_part = 2
						where drpa.dataset_id = @dataset_id		
					) LEVY2
					on drpa.prop_id = LEVY2.prop_id and
					drpa.prop_val_yr = LEVY2.prop_val_yr and
					drpa.sup_num = LEVY2.sup_num					
		where
					pe1.[exmpt_type_cd] like '%snr%' and
					pv1.[prop_inactive_dt] is null and
					pu.dor_use_code in ('83')
					and dataset_id = @dataset_id	

		set @ag_senior = isnull(@ag_senior, 0)
		set @ag_senior_levy2 = isnull(@ag_senior_levy2, 0)	
		
		
		
		--TIM SENIOR
		set @tim_senior		= 0
		
		select
			@tim_senior = sum(wpv1.snr_exempt_loss) --OVER ()
		from ##dor_report_prop_assoc as drpa with(nolock)
		join dbo.property as p1 with(nolock) on
					p1.[prop_id] = drpa.[prop_id]
		join dbo.property_val as pv1 with(nolock) on
					pv1.[prop_id] = drpa.[prop_id] and
					pv1.[prop_val_yr] = drpa.[prop_val_yr] and
					pv1.[sup_num] = drpa.[sup_num]
		join property_sub_type as pst with(nolock) on
			pst.property_sub_cd = pv1.sub_type
			and pst.imp_leased_land <> 1
		join property_use as pu with(nolock) on
					pu.property_use_cd = pv1.property_use_cd
		join dbo.property_exemption as pe1 with(nolock) on
					pe1.[exmpt_tax_yr] = drpa.[prop_val_yr] and
					pe1.[owner_tax_yr] = drpa.[prop_val_yr] and
					pe1.[prop_id] = drpa.[prop_id] and
					pe1.[sup_num] = pv1.[sup_num]
		join dbo.property_tax_area as pta1 with(nolock) on
					pta1.[prop_id] = drpa.[prop_id] and
					pta1.[year] = drpa.[prop_val_yr] and
					pta1.[sup_num] = pv1.[sup_num]
		join dbo.tax_area as ta1 with(nolock) on
					ta1.[tax_area_id] = pta1.[tax_area_id]
		join dbo.wash_prop_owner_val as wpov1 with(nolock) on
					wpov1.[prop_id] = drpa.[prop_id] and
					wpov1.[year] = drpa.[prop_val_yr] and
					wpov1.[sup_num] = pv1.[sup_num]
		join dbo.wash_property_val as wpv1 with(nolock) on
					wpv1.[prop_id] = drpa.[prop_id] and
					wpv1.[prop_val_yr] = drpa.[prop_val_yr] and
					wpv1.[sup_num] = drpa.[sup_num]
		where
					pe1.[exmpt_type_cd] like '%snr%' and
					pv1.[prop_inactive_dt] is null and
					pu.dor_use_code in ('95') 
					and dataset_id = @dataset_id	
				
		set @tim_senior_levy2		= 0
		
		select
			@tim_senior_levy2 = sum(wpv1.snr_taxable_portion) --OVER ()
		from ##dor_report_prop_assoc as drpa with(nolock)
		join dbo.property as p1 with(nolock) on
					p1.[prop_id] = drpa.[prop_id]
		join dbo.property_val as pv1 with(nolock) on
					pv1.[prop_id] = drpa.[prop_id] and
					pv1.[prop_val_yr] = drpa.[prop_val_yr] and
					pv1.[sup_num] = drpa.[sup_num]
		join property_sub_type as pst with(nolock) on
			pst.property_sub_cd = pv1.sub_type
			and pst.imp_leased_land <> 1
		join property_use as pu with(nolock) on
					pu.property_use_cd = pv1.property_use_cd
		join dbo.property_exemption as pe1 with(nolock) on
					pe1.[exmpt_tax_yr] = drpa.[prop_val_yr] and
					pe1.[owner_tax_yr] = drpa.[prop_val_yr] and
					pe1.[prop_id] = drpa.[prop_id] and
					pe1.[sup_num] = pv1.[sup_num]
		join dbo.property_tax_area as pta1 with(nolock) on
					pta1.[prop_id] = drpa.[prop_id] and
					pta1.[year] = drpa.[prop_val_yr] and
					pta1.[sup_num] = pv1.[sup_num]
		join dbo.tax_area as ta1 with(nolock) on
					ta1.[tax_area_id] = pta1.[tax_area_id]
		join dbo.wash_prop_owner_val as wpov1 with(nolock) on
					wpov1.[prop_id] = drpa.[prop_id] and
					wpov1.[year] = drpa.[prop_val_yr] and
					wpov1.[sup_num] = pv1.[sup_num]
		join dbo.wash_property_val as wpv1 with(nolock) on
					wpv1.[prop_id] = drpa.[prop_id] and
					wpv1.[prop_val_yr] = drpa.[prop_val_yr] and
					wpv1.[sup_num] = drpa.[sup_num]
					join (
						select distinct drpa.prop_id, drpa.prop_val_yr, drpa.sup_num
						from ##dor_report_prop_assoc drpa
						join wash_prop_owner_tax_district_assoc wpotda
						on drpa.prop_id = wpotda.prop_id and
						drpa.sup_num = wpotda.sup_num and
						drpa.prop_val_yr = wpotda.year
						join levy l
						on l.tax_district_id = wpotda.tax_district_id
						and l.year = wpotda.year
						join levy_type lt
						on l.levy_type_cd = lt.levy_type_cd and
						lt.levy_part = 2
						where drpa.dataset_id = @dataset_id		
					) LEVY2
					on drpa.prop_id = LEVY2.prop_id and
					drpa.prop_val_yr = LEVY2.prop_val_yr and
					drpa.sup_num = LEVY2.sup_num					
		where
					pe1.[exmpt_type_cd] like '%snr%' and
					--psa1.[owner_tax_yr] = 2006 and
					pv1.[prop_inactive_dt] is null and
					pu.dor_use_code in ('95') 
					--pv1.[sup_num] = 0
					and dataset_id = @dataset_id	

		set @tim_senior = isnull(@tim_senior, 0)
		set @tim_senior_levy2 = isnull(@tim_senior_levy2, 0)								
				
		/*
			Note that:
				total senior is the same as other_senior
				total imprv is the same as other_imprv
			... because we lump all of both into line 6
		*/
		update ##dor_report_real
		set
			other_imprv = @other_imprv,
			other_senior = @other_senior * -1,

--			dfl_imprv = @dfl_imprv,
--			dfl_imprv_levy2 = @dfl_imprv,
			osp_imprv = @osp_imprv,
--			osp_imprv_levy2 = @osp_imprv,
			ag_imprv = @ag_imprv,
--			ag_imprv_levy2 = @ag_imprv,
--			tim_imprv = @tim_imprv,
--			tim_imprv_levy2 = @tim_imprv,
			dfl_senior = @dfl_senior,
			dfl_senior_levy2 = @dfl_senior_levy2,
			osp_senior = @osp_senior,
			osp_senior_levy2 = @osp_senior_levy2,
			ag_senior = @ag_senior,
			ag_senior_levy2 = @ag_senior_levy2,
			tim_senior = @tim_senior,
			tim_senior_levy2 = @tim_senior_levy2,
			total_imprv =  @osp_imprv + @ag_imprv + @other_imprv,
			total_senior = (@dfl_senior + @osp_senior + @ag_senior + case when combine_DFL_timber_values = 1 then 0 else @tim_senior end + @other_senior) * -1			
		where dataset_id = @dataset_id
		
		
		set @other_imprv_levy2		= 0
	
		select
			@other_imprv_levy2 = sum(
				case
					when drpa.snr_flag = 1
					then wpov.imprv_non_hstd_val + wpv.snr_imprv_lesser
					else wpov.imprv_non_hstd_val + wpov.imprv_hstd_val
				end
			)
		from ##dor_report_prop_assoc as drpa with(nolock)
		join wash_property_val as wpv with(nolock) on
			wpv.prop_val_yr = drpa.prop_val_yr and
			wpv.sup_num = drpa.sup_num and
			wpv.prop_id = drpa.prop_id
		join wash_prop_owner_val as wpov with(nolock) on
			wpov.year = drpa.prop_val_yr and
			wpov.sup_num = drpa.sup_num and
			wpov.prop_id = drpa.prop_id
		/*
			BEGIN - The page 2 totals must match the page 4 totals,
			therefore we must be certain we use only the same properties,
			i.e. only those with a valid property use code with a valid DOR land use code
		*/
		join property_val as pv with(nolock) on
			pv.prop_val_yr = drpa.prop_val_yr and
			pv.sup_num = drpa.sup_num and
			pv.prop_id = drpa.prop_id
		join property_use as pu with(nolock) on
			pu.property_use_cd = pv.property_use_cd
		join dor_land_use_code as dor with(nolock) on
			dor.code = pu.dor_use_code
		/* END - that is the only purpose of these joins */
					join (
						select distinct drpa.prop_id, drpa.prop_val_yr, drpa.sup_num
						from ##dor_report_prop_assoc drpa
						join wash_prop_owner_tax_district_assoc wpotda
						on drpa.prop_id = wpotda.prop_id and
						drpa.sup_num = wpotda.sup_num and
						drpa.prop_val_yr = wpotda.year
						join levy l
						on l.tax_district_id = wpotda.tax_district_id
						and l.year = wpotda.year
						join levy_type lt
						on l.levy_type_cd = lt.levy_type_cd and
						lt.levy_part = 2
						where drpa.dataset_id = @dataset_id		
					) LEVY2
					on drpa.prop_id = LEVY2.prop_id and
					drpa.prop_val_yr = LEVY2.prop_val_yr and
					drpa.sup_num = LEVY2.sup_num		
		where drpa.dataset_id = @dataset_id and drpa.u500_flag = 0
		group by drpa.dataset_id



		

		set @other_imprv_levy2 = isnull(@other_imprv_levy2, 0)






		set @other_senior_levy2		= 0
	
		select
			@other_senior_levy2 = 
			sum(
				isnull(wpv.snr_taxable_portion, 0)
			)
		from ##dor_report_prop_assoc as drpa with(nolock)
		join wash_property_val as wpv with(nolock) on
			wpv.prop_val_yr = drpa.prop_val_yr and
			wpv.sup_num = drpa.sup_num and
			wpv.prop_id = drpa.prop_id
		join wash_prop_owner_val as wpov with(nolock) on
			wpov.year = drpa.prop_val_yr and
			wpov.sup_num = drpa.sup_num and
			wpov.prop_id = drpa.prop_id
		/*
			BEGIN - The page 2 totals must match the page 4 totals,
			therefore we must be certain we use only the same properties,
			i.e. only those with a valid property use code with a valid DOR land use code
		*/
		join property_val as pv with(nolock) on
			pv.prop_val_yr = drpa.prop_val_yr and
			pv.sup_num = drpa.sup_num and
			pv.prop_id = drpa.prop_id
		join property_sub_type as pst with(nolock) on
			pst.property_sub_cd = pv.sub_type
			and pst.imp_leased_land <> 1
		join property_use as pu with(nolock) on
			pu.property_use_cd = pv.property_use_cd
		join dor_land_use_code as dor with(nolock) on
			dor.code = pu.dor_use_code
		/* END - that is the only purpose of these joins */
					join (
						select distinct drpa.prop_id, drpa.prop_val_yr, drpa.sup_num
						from ##dor_report_prop_assoc drpa
						join wash_prop_owner_tax_district_assoc wpotda
						on drpa.prop_id = wpotda.prop_id and
						drpa.sup_num = wpotda.sup_num and
						drpa.prop_val_yr = wpotda.year
						join levy l
						on l.tax_district_id = wpotda.tax_district_id
						and l.year = wpotda.year
						join levy_type lt
						on l.levy_type_cd = lt.levy_type_cd and
						lt.levy_part = 2
						--where drpa.dataset_id = @dataset_id		
					) LEVY2
					on drpa.prop_id = LEVY2.prop_id and
					drpa.prop_val_yr = LEVY2.prop_val_yr and
					drpa.sup_num = LEVY2.sup_num		
		where drpa.dataset_id = @dataset_id and drpa.u500_flag = 0
		and pu.dor_use_code not in ('88', '94', '83', '95') -- THESE CODES ARE HANDLED BY OTHER FIELDS SO SHOULD NOT BE INCLUDED IN THE OTHER CATEGORY
		group by drpa.dataset_id

		set @other_senior_levy2 = isnull(@other_senior_levy2, 0) + isnull(@dfl_senior_levy2_adjust,0) - isnull(@dfl_senior_levy2,0)


		/*
			Note that:
				total senior is the same as other_senior
				total imprv is the same as other_imprv
			... because we lump all of both into line 6
		*/
		update ##dor_report_real
		set
			other_imprv_levy2 = @other_imprv_levy2,
			total_imprv_levy2 = @other_imprv_levy2,
			other_senior_levy2 = @other_senior_levy2 * -1
		where dataset_id = @dataset_id

		update ##dor_report_real
		set
			total_senior_levy2 = (@dfl_senior_levy2 + @osp_senior_levy2 + @ag_senior_levy2 + case when combine_DFL_timber_values = 1 then 0 else @tim_senior_levy2 end + @other_senior_levy2) * -1
		where dataset_id = @dataset_id

		---- if combine DFL and Timer values
		if @combine_DFL_timber_values = '1'
		BEGIN	
			update ##dor_report_real
			set
				dfl_acres = dfl_acres + tim_acres,
				dfl_market_land = dfl_market_land + tim_land,
				dfl_market_land_levy2 = dfl_market_land_levy2 + tim_land_levy2
			where dataset_id = @dataset_id 
			 
			update ##dor_report_real
			set
				tim_acres = 0,
				tim_land = 0,
				tim_market_land = 0,   ------ not used in this sql procedure, item 10 on report
				tim_land_levy2 = 0
			where dataset_id = @dataset_id		
		END
			   
		-- Totals

		update ##dor_report_real
		set
			other_total = other_imprv + other_land + other_senior - isnull(@dor_exempt_amount,0),
			total_land = other_land + dfl_market_land + osp_land + ag_land + tim_land,

			total_total =
				other_imprv + other_land + other_senior +
				dfl_market_land + osp_land + ag_land + tim_land,
				
			other_total_levy2 = other_imprv + other_land + other_senior_levy2, -- row should add up: Land + Imp - Exempt
			total_land_levy2 = other_land_levy2 + dfl_market_land_levy2 + osp_land_levy2 + ag_land_levy2 + tim_land_levy2,

			total_total_levy2 =
				other_imprv + other_land + other_senior_levy2 +
				dfl_market_land_levy2 + osp_land_levy2 + ag_land_levy2 + tim_land_levy2
				

		where dataset_id = @dataset_id


	
	
		-------------------------------------------------------------------------------
		-- END PAGE 2
		-------------------------------------------------------------------------------


		-------------------------------------------------------------------------------
		-- BEGIN PAGE 4
		-------------------------------------------------------------------------------

	set @ag_land_levy2 = 0
	set @other_land_levy2 = 0
	set @other_imprv_levy2 = 0
	set @u500_exempt_amount_levy2 = 0

		select
		
			@single_family_count	= sum(
				case when dor.dor_report_category = 'SFR' then 1 else 0 end
			),
			@single_family_land		= sum(
				case
					when
						dor.dor_report_category = 'SFR'
					then
						case
							when drpa.snr_flag = 1
							then wpov.land_non_hstd_val + wpov.ag_use_val + wpv.snr_land_lesser
							else wpov.land_hstd_val + wpov.land_non_hstd_val + wpov.ag_use_val + wpov.ag_hs_use_val
						end
					else 0
				end
			),
			@single_family_imprv	= sum(
				case
					when
						dor.dor_report_category = 'SFR'
					then
						case
							when drpa.snr_flag = 1
							then wpov.imprv_non_hstd_val + wpv.snr_imprv_lesser
							else wpov.imprv_hstd_val + wpov.imprv_non_hstd_val
						end
					else 0
				end
			),
			@single_family_exempt	= sum(
				case when dor.dor_report_category = 'SFR' then wpv.snr_exempt_loss else 0 end
			),

			@multi_family_count	= sum(
				case when dor.dor_report_category = 'MFR' then 1 else 0 end
			),
			@multi_family_land		= sum(
				case
					when
						dor.dor_report_category = 'MFR'
					then
						case
							when drpa.snr_flag = 1
							then wpov.land_non_hstd_val + wpov.ag_use_val + wpv.snr_land_lesser
							else wpov.land_hstd_val + wpov.land_non_hstd_val + wpov.ag_use_val + wpov.ag_hs_use_val
						end
					else 0
				end
			),
			@multi_family_imprv	= sum(
				case
					when
						dor.dor_report_category = 'MFR'
					then
						case
							when drpa.snr_flag = 1
							then wpov.imprv_non_hstd_val + wpv.snr_imprv_lesser
							else wpov.imprv_hstd_val + wpov.imprv_non_hstd_val
						end
					else 0
				end
			),
			@multi_family_exempt	= sum(
				case when dor.dor_report_category = 'MFR' then wpv.snr_exempt_loss else 0 end
			),

			@manufacturing_count	= sum(
				case when dor.dor_report_category = 'MAN' then 1 else 0 end
			),
			@manufacturing_land		= sum(
				case
					when
						dor.dor_report_category = 'MAN'
					then
						case
							when drpa.snr_flag = 1
							then wpov.land_non_hstd_val + wpov.ag_use_val + wpv.snr_land_lesser
							else wpov.land_hstd_val + wpov.land_non_hstd_val + wpov.ag_use_val + wpov.ag_hs_use_val
						end
					else 0
				end
			),
			@manufacturing_imprv	= sum(
				case
					when
						dor.dor_report_category = 'MAN'
					then
						case
							when drpa.snr_flag = 1
							then wpov.imprv_non_hstd_val + wpv.snr_imprv_lesser
							else wpov.imprv_hstd_val + wpov.imprv_non_hstd_val
						end
					else 0
				end
			),
			@manufacturing_exempt	= sum(
				case when dor.dor_report_category = 'MAN' then wpv.snr_exempt_loss else 0 end
			),

			@commercial_count	= sum(
				case when dor.dor_report_category = 'COM' then 1 else 0 end
			),
			@commercial_land		= sum(
				case
					when
						dor.dor_report_category = 'COM'
					then
						case
							when drpa.snr_flag = 1
							then wpov.land_non_hstd_val + wpov.ag_use_val + wpv.snr_land_lesser
							else wpov.land_hstd_val + wpov.land_non_hstd_val + wpov.ag_use_val + wpov.ag_hs_use_val
						end
					else 0
				end
			),
			@commercial_imprv	= sum(
				case
					when
						dor.dor_report_category = 'COM'
					then
						case
							when drpa.snr_flag = 1
							then wpov.imprv_non_hstd_val + wpv.snr_imprv_lesser
							else wpov.imprv_hstd_val + wpov.imprv_non_hstd_val
						end
					else 0
				end
			),
			@commercial_exempt	= sum(
				case when dor.dor_report_category = 'COM' then wpv.snr_exempt_loss else 0 end
			),

			@ag_real_count	= sum(
				case when dor.dor_report_category = 'ANC' then 1 else 0 end
			),
			@ag_real_land		= sum(
				case
					when
						dor.dor_report_category = 'ANC'
					then
						case
							when drpa.snr_flag = 1
							then wpov.land_non_hstd_val + wpov.ag_use_val + wpv.snr_land_lesser
							else wpov.land_hstd_val + wpov.land_non_hstd_val + wpov.ag_use_val + wpov.ag_hs_use_val
						end
					else 0
				end
			),
			@ag_real_imprv	= sum(
				case
					when
						dor.dor_report_category = 'ANC'
					then
						case
							when drpa.snr_flag = 1
							then wpov.imprv_non_hstd_val + wpv.snr_imprv_lesser
							else wpov.imprv_hstd_val + wpov.imprv_non_hstd_val
						end
					else 0
				end
			),
			@ag_real_exempt	= sum(
				case when dor.dor_report_category = 'ANC' then wpv.snr_exempt_loss else 0 end
			),

			@other_real_count	= sum(
				case when dor.dor_report_category = 'ORP' then 1 else 0 end
			),
			@other_real_land		= sum(
				case
					when
						dor.dor_report_category = 'ORP'
					then
						case
							when drpa.snr_flag = 1
							then wpov.land_non_hstd_val + wpov.ag_use_val + wpv.snr_land_lesser
							else wpov.land_hstd_val + wpov.land_non_hstd_val + wpov.ag_use_val + wpov.ag_hs_use_val
						end
					else 0
				end
			),
			@other_real_imprv	= sum(
				case
					when
						dor.dor_report_category = 'ORP'
					then
						case
							when drpa.snr_flag = 1
							then wpov.imprv_non_hstd_val + wpv.snr_imprv_lesser
							else wpov.imprv_hstd_val + wpov.imprv_non_hstd_val
						end
					else 0
				end
			),
			@other_real_exempt	= sum(
				case when dor.dor_report_category = 'ORP' then wpv.snr_exempt_loss else 0 end
			)

		from ##dor_report_prop_assoc as drpa with(nolock)
		join property as p with(nolock) on
			p.prop_id = drpa.prop_id and
			p.prop_type_cd in ('R','MH')
		join property_val as pv with(nolock) on
			pv.prop_val_yr = drpa.prop_val_yr and
			pv.sup_num = drpa.sup_num and
			pv.prop_id = drpa.prop_id
		join property_sub_type as pst with(nolock) on
			pst.property_sub_cd = pv.sub_type
			and pst.imp_leased_land <> 1
		join property_use as pu with(nolock) on
			pu.property_use_cd = pv.property_use_cd
		join dor_land_use_code as dor with(nolock) on
			dor.code = pu.dor_use_code
		join wash_prop_owner_val as wpov with(nolock) on
			wpov.year = pv.prop_val_yr and
			wpov.sup_num = pv.sup_num and
			wpov.prop_id = pv.prop_id
		join wash_property_val as wpv with(nolock) on
			wpv.prop_val_yr = pv.prop_val_yr and
			wpv.sup_num = pv.sup_num and
			wpv.prop_id = pv.prop_id
		where drpa.dataset_id = @dataset_id and drpa.u500_flag = 0

		select
			@u500_real_count = count(distinct drpa.prop_id), 
			@u500_real_land = sum(
				wpov.land_hstd_val + wpov.land_non_hstd_val + wpov.ag_market + wpov.ag_hs_market
			),
			@u500_real_imprv = sum(
				wpov.imprv_hstd_val + wpov.imprv_non_hstd_val
			)
		from ##dor_report_prop_assoc as drpa with(nolock)
		join property as p with(nolock) on
			p.prop_id = drpa.prop_id and
			p.prop_type_cd in ('R','MH')
		join wash_prop_owner_val as wpov with(nolock) on
			wpov.year = drpa.prop_val_yr and
			wpov.sup_num = drpa.sup_num and
			wpov.prop_id = drpa.prop_id
		where drpa.dataset_id = @dataset_id and drpa.u500_flag = 1

		set @u500_real_exempt = @u500_real_imprv + @u500_real_land
		
		
		
		select
			@single_family_exempt_levy2	= sum(
				case when dor.dor_report_category = 'SFR' then wpv.appraised_classified else 0 end
			),


			@multi_family_exempt_levy2	= sum(
				case when dor.dor_report_category = 'MFR' then wpv.appraised_classified else 0 end
			),


			@manufacturing_exempt_levy2	= sum(
				case when dor.dor_report_category = 'MAN' then wpv.appraised_classified else 0 end
			),


			@commercial_exempt_levy2	= sum(
				case when dor.dor_report_category = 'COM' then wpv.appraised_classified else 0 end
			),


			@ag_real_exempt_levy2	= sum(
				case when dor.dor_report_category = 'ANC' then wpv.appraised_classified else 0 end
			),

			@other_real_exempt_levy2	= sum(
				case when dor.dor_report_category = 'ORP' then wpv.appraised_classified else 0 end
			)

		from ##dor_report_prop_assoc as drpa with(nolock)
		join property as p with(nolock) on
			p.prop_id = drpa.prop_id and
			p.prop_type_cd in ('R','MH')
		join property_val as pv with(nolock) on
			pv.prop_val_yr = drpa.prop_val_yr and
			pv.sup_num = drpa.sup_num and
			pv.prop_id = drpa.prop_id
		join property_sub_type as pst with(nolock) on
			pst.property_sub_cd = pv.sub_type
			and pst.imp_leased_land <> 1
		join property_use as pu with(nolock) on
			pu.property_use_cd = pv.property_use_cd
		join dor_land_use_code as dor with(nolock) on
			dor.code = pu.dor_use_code
		join wash_prop_owner_val as wpov with(nolock) on
			wpov.year = pv.prop_val_yr and
			wpov.sup_num = pv.sup_num and
			wpov.prop_id = pv.prop_id
		join wash_property_val as wpv with(nolock) on
			wpv.prop_val_yr = pv.prop_val_yr and
			wpv.sup_num = pv.sup_num and
			wpv.prop_id = pv.prop_id
		join (
			select distinct drpa.prop_id, drpa.prop_val_yr, drpa.sup_num
			from ##dor_report_prop_assoc drpa
			join wash_prop_owner_tax_district_assoc wpotda
			on drpa.prop_id = wpotda.prop_id and
			drpa.sup_num = wpotda.sup_num and
			drpa.prop_val_yr = wpotda.year
			join levy l
			on l.tax_district_id = wpotda.tax_district_id
			and l.year = wpotda.year
			join levy_type lt
			on l.levy_type_cd = lt.levy_type_cd and
			lt.levy_part = 2
			where drpa.dataset_id = @dataset_id		
		) LEVY2
		on drpa.prop_id = LEVY2.prop_id and
			drpa.prop_val_yr = LEVY2.prop_val_yr and
			drpa.sup_num = LEVY2.sup_num				
		where drpa.dataset_id = @dataset_id 
			and drpa.u500_flag = 0
		and exists(
			select 1 from wash_prop_owner_exemption e
			where drpa.prop_id = e.prop_id
			and drpa.prop_val_yr = e.year
			and drpa.sup_num = e.sup_num	
			and e.exmpt_type_cd in ('SNR/DSBL')
		)


		

		insert into ##dor_report_real_by_land_use (
			dataset_id,
			single_family_count, single_family_land, single_family_imprv, single_family_exempt,
			multi_family_count, multi_family_land, multi_family_imprv, multi_family_exempt,
			manufacturing_count, manufacturing_land, manufacturing_imprv, manufacturing_exempt,
			commercial_count, commercial_land, commercial_imprv, commercial_exempt,
			ag_count, ag_land, ag_imprv, ag_exempt,
			other_count, other_land, other_imprv, other_exempt,
			u500_exempt_count, u500_land, u500_imprv, u500_exempt_amount,
			
single_family_exempt_levy2,
multi_family_exempt_levy2,
manufacturing_exempt_levy2,
commercial_exempt_levy2,
ag_exempt_levy2,
other_exempt_levy2,
u500_exempt_amount_levy2		
			
		) values (
			@dataset_id,
			isnull(@single_family_count, 0), isnull(@single_family_land, 0), isnull(@single_family_imprv, 0), isnull((@single_family_exempt * -1), 0),
			isnull(@multi_family_count, 0), isnull(@multi_family_land, 0), isnull(@multi_family_imprv, 0), isnull((@multi_family_exempt * -1), 0),
			isnull(@manufacturing_count, 0), isnull(@manufacturing_land, 0), isnull(@manufacturing_imprv, 0), isnull((@manufacturing_exempt * -1), 0),
			isnull(@commercial_count, 0), isnull(@commercial_land, 0), isnull(@commercial_imprv, 0), isnull((@commercial_exempt * -1), 0),
			isnull(@ag_real_count, 0), isnull(@ag_real_land, 0), isnull(@ag_real_imprv, 0), isnull((@ag_real_exempt * -1), 0),
			isnull(@other_real_count, 0), isnull(@other_real_land, 0), isnull(@other_real_imprv, 0) - isnull(@dor_exempt_amount,0), isnull((@other_real_exempt * -1), 0),
			isnull(@u500_real_count, 0), isnull(@u500_real_land, 0), isnull(@u500_real_imprv, 0), isnull(@u500_real_exempt, 0),
			
isnull(@single_family_exempt_levy2 * -1, 0),
isnull(@multi_family_exempt_levy2 * -1, 0),
isnull(@manufacturing_exempt_levy2 * -1, 0),
isnull(@commercial_exempt_levy2 * -1, 0),
isnull(@ag_real_exempt_levy2 * -1, 0),
isnull(@other_real_exempt_levy2 * -1, 0),
isnull(@u500_exempt_amount_levy2 * -1, 0)
		)

		-------------------------------------------------------------------------------
		-- END PAGE 4
		-------------------------------------------------------------------------------

		-- TEMPORARY fix
		
		-- ... to page 2 line 6 land value (and adjusting buckets that total it)
		update drr
		set
			drr.other_land =
				isnull(drlu.single_family_land, 0) +
				isnull(drlu.multi_family_land, 0) +
				isnull(drlu.manufacturing_land, 0) +
				isnull(drlu.commercial_land, 0) +
				isnull(drlu.ag_land, 0) +
				isnull(drlu.other_land, 0)
				- isnull(drr.dfl_market_land, 0)
				- isnull(drr.osp_land, 0)
				- isnull(drr.ag_land, 0)
				- isnull(drr.tim_land, 0)
		from ##dor_report_real as drr
		join ##dor_report_real_by_land_use as drlu on
			drlu.dataset_id = drr.dataset_id
		where drr.dataset_id = @dataset_id
		
		update drr
		set
			drr.other_land_levy2 =
				isnull(drlu.single_family_land, 0) +
				isnull(drlu.multi_family_land, 0) +
				isnull(drlu.manufacturing_land, 0) +
				isnull(drlu.commercial_land, 0) +
				isnull(drlu.ag_land, 0) +
				isnull(drlu.other_land, 0)
				- isnull(drr.dfl_market_land, 0)
				- isnull(drr.osp_land, 0)
				- isnull(drr.ag_land, 0)
				- isnull(drr.tim_land, 0)
		from ##dor_report_real as drr
		join ##dor_report_prop_assoc as drpa on
			drr.dataset_id = drpa.dataset_id
		join ##dor_report_real_by_land_use as drlu on
			drlu.dataset_id = drr.dataset_id
					join (
						select distinct drpa.prop_id, drpa.prop_val_yr, drpa.sup_num
						from ##dor_report_prop_assoc drpa
						join wash_prop_owner_tax_district_assoc wpotda
						on drpa.prop_id = wpotda.prop_id and
						drpa.sup_num = wpotda.sup_num and
						drpa.prop_val_yr = wpotda.year
						join levy l
						on l.tax_district_id = wpotda.tax_district_id
						and l.year = wpotda.year
						join levy_type lt
						on l.levy_type_cd = lt.levy_type_cd and
						lt.levy_part = 2
						where drpa.dataset_id = @dataset_id		
					) LEVY2
					on drpa.prop_id = LEVY2.prop_id and
					drpa.prop_val_yr = LEVY2.prop_val_yr and
					drpa.sup_num = LEVY2.sup_num			
		where drr.dataset_id = @dataset_id		

		update ##dor_report_real
		set
			other_total = other_imprv + other_land + other_senior - isnull(@dor_exempt_amount,0),
			total_land = other_land + dfl_market_land + osp_land + ag_land + tim_land,

			total_total =
				other_imprv + other_land + other_senior +
				dfl_market_land + osp_land + ag_land + tim_land,
				
			other_total_levy2 = other_imprv + other_land + other_senior_levy2,
			total_land_levy2 = other_land_levy2 + dfl_market_land_levy2 + osp_land_levy2 + ag_land_levy2 + tim_land_levy2,

			total_total_levy2 =
				other_imprv + other_land + other_senior_levy2 +
				dfl_market_land_levy2 + osp_land_levy2 + ag_land_levy2 + tim_land_levy2				

		where dataset_id = @dataset_id
	end
















	-- GEO ID REPORTS
	else begin
		
			delete from ##dor_report_prop_assoc where dataset_id = @dataset_id
				
			select distinct a.dataset_id, a.year, a.sup_num, p.prop_id, p.geo_id 
			into #as_of_geo_id 
			from ##as_of a with(nolock)
			left join property p with(nolock)
			on a.prop_id = p.prop_id
			where p.geo_id is not null
					

					
			set @sql = '
			insert ##dor_report_prop_assoc
			(dataset_id, prop_id, geo_id, sup_num, prop_val_yr, u500_flag, snr_flag)

			select ' + convert(varchar(24), @dataset_id) + ', asof.prop_id, asof.geo_id, asof.sup_num, asof.year,
			case when wpoe_u500.prop_id is not null then 1 else 0 end,
			case when wpoe_snr.prop_id is not null then 1 else 0 end
			from #as_of_geo_id as asof with(nolock)
			join property as p with(nolock) on
				p.geo_id = asof.geo_id and
				p.prop_id = asof.prop_id			
			join property_val as pv with(nolock) on
				pv.prop_val_yr = asof.year and
				pv.sup_num = asof.sup_num and
				pv.prop_id = p.prop_id
			join property_tax_area as pta with(nolock) on
				pv.prop_val_yr = pta.year and
				pv.sup_num = pta.sup_num and
				pv.prop_id = pta.prop_id
			join tax_area as ta with(nolock) on
				pta.tax_area_id = ta.tax_area_id
			left outer join property_sub_type as pst with(nolock) on
				pv.sub_type = pst.property_sub_cd
			left outer join wash_prop_owner_exemption as wpoe_u500 with(nolock) on
				wpoe_u500.year = asof.year and
				wpoe_u500.sup_num = asof.sup_num and
				wpoe_u500.prop_id = pv.prop_id and
				wpoe_u500.exmpt_type_cd = ''U500''
			left outer join wash_prop_owner_exemption as wpoe_snr with(nolock) on
				wpoe_snr.year = asof.year and
				wpoe_snr.sup_num = asof.sup_num and
				wpoe_snr.prop_id = pv.prop_id and
				wpoe_snr.exmpt_type_cd = ''SNR/DSBL''
			left outer join wash_prop_owner_exemption as wpoe_ex with(nolock) on
				wpoe_ex.year = asof.year and
				wpoe_ex.sup_num = asof.sup_num and
				wpoe_ex.prop_id = pv.prop_id and
				wpoe_ex.exmpt_type_cd = ''EX''
			left outer join wash_prop_owner_exemption as wpoe_exempt with(nolock) on
				wpoe_exempt.year = asof.year and
				wpoe_exempt.sup_num = asof.sup_num and
				wpoe_exempt.prop_id = asof.prop_id and
				wpoe_exempt.exmpt_type_cd = ''DOR''
			where asof.dataset_id = ' + convert(varchar(24), @dataset_id_asof) + '
			and pv.prop_inactive_dt is null
			and isnull(pv.prop_state, '''') <> ''P''
			and isnull(p.reference_flag, '''') <> ''T''
			and isnull(pst.state_assessed_utility, 0) = 0
			and isnull(pst.local_assessed_utility, 0) = 0
			and wpoe_ex.prop_id is null
			'
			
			if ( @tax_areas <> '<All>' and @tax_areas <> '' )
			begin
				set @sql = @sql + 'and ta.tax_area_number in (' + @tax_areas + ')'
			end

			exec(@sql)
		
			drop table #as_of_geo_id

		
		


		

		-------------------------------------------------------------------------------
		-- BEGIN PAGE 1
		-------------------------------------------------------------------------------


		insert ##dor_report_general (
			dataset_id,
			senior1_count, senior1_market, senior1_frozen, senior1_exempt,
			senior2_count, senior2_market, senior2_frozen, senior2_exempt,
			senior3_count, senior3_market, senior3_frozen, senior3_exempt,
			current_use_agreements, new_current_use_agreements, remodel_count, remodel_value,
			new_construction_imprv, 
			new_construction_land, 
			new_construction_personal,
			new_construction_windturbine,
			new_construction_solar,
			new_construction_biomass,
			new_construction_geothermal,
			new_construction,
			new_construction_levy2
		)
		select drpa.dataset_id,
		sum(case when wpoe_snr.exempt_qualify_cd = '1' then 1 else 0 end) as senior1_count,
		sum(case when wpoe_snr.exempt_qualify_cd = '1' then isnull(wpov.land_hstd_val,0) + isnull(wpov.ag_hs_use_val,0) + isnull(wpov.imprv_hstd_val,0) else 0 end) as senior1_market,
		sum(case when wpoe_snr.exempt_qualify_cd = '1' then isnull(wpv.snr_frz_imprv_hs,0) + isnull(wpv.snr_frz_land_hs,0) + isnull(wpv.snr_new_val,0) else 0 end) as senior1_frozen,
		sum(case when wpoe_snr.exempt_qualify_cd = '1' then isnull(wpv.snr_exempt_loss,0) else 0 end) as senior1_exempt,
		sum(case when wpoe_snr.exempt_qualify_cd = '2' then 1 else 0 end) as senior2_count,
		sum(case when wpoe_snr.exempt_qualify_cd = '2' then isnull(wpov.land_hstd_val,0) + isnull(wpov.ag_hs_use_val,0) + isnull(wpov.imprv_hstd_val,0) else 0 end) as senior2_market,
		sum(case when wpoe_snr.exempt_qualify_cd = '2' then isnull(wpv.snr_frz_imprv_hs,0) + isnull(wpv.snr_frz_land_hs,0) + isnull(wpv.snr_new_val,0) else 0 end) as senior2_frozen,
		sum(case when wpoe_snr.exempt_qualify_cd = '2' then isnull(wpv.snr_exempt_loss,0) else 0 end) as senior2_exempt,
		sum(case when wpoe_snr.exempt_qualify_cd = '3' then 1 else 0 end) as senior3_count,
		sum(case when wpoe_snr.exempt_qualify_cd = '3' then isnull(wpov.land_hstd_val,0) + isnull(wpov.ag_hs_use_val,0) + isnull(wpov.imprv_hstd_val,0) else 0 end) as senior3_market,
		sum(case when wpoe_snr.exempt_qualify_cd = '3' then isnull(wpv.snr_frz_imprv_hs,0) + isnull(wpv.snr_frz_land_hs,0) + isnull(wpv.snr_new_val,0) else 0 end) as senior3_frozen,
		sum(case when wpoe_snr.exempt_qualify_cd = '3' then isnull(wpv.snr_exempt_loss,0) else 0 end) as senior3_exempt,
		0 as current_use_agreements, -- Will calculate later
		0 as current_use_agreements, -- Will calculate later
		sum(case when isnull(pv.remodel_val_curr_yr,0) <> 0 then 1 else 0 end) as remodel_count,
		sum(isnull(pv.remodel_val_curr_yr,0)) as remodel_value,
		0 as new_construction_imprv,
		0 as new_consruction_land,
		0 as new_consruction_personal,
		0 as new_construction_windturbine,
		0 as new_construction_solar,
		0 as new_construction_biomass,
		0 as new_construction_geothermal,
		0 as new_construction_value,
		0 as new_construction_value_levy2

		from ##dor_report_prop_assoc as drpa with(nolock)
		inner join property p with(nolock)
			on drpa.geo_id = p.geo_id and
			drpa.prop_id = p.prop_id
			--and drpa.snr_flag = 1				
		join wash_prop_owner_val as wpov with(nolock) on
			drpa.prop_val_yr = wpov.year
			and drpa.sup_num = wpov.sup_num
			and p.prop_id = wpov.prop_id
		join wash_property_val as wpv with(nolock) on
			wpov.year = wpv.prop_val_yr
			and wpov.sup_num = wpv.sup_num
			and wpov.prop_id = wpv.prop_id
		join property_val as pv with(nolock) on
			drpa.prop_val_yr = pv.prop_val_yr
			and drpa.sup_num = pv.sup_num
			and p.prop_id = pv.prop_id
		left outer join wash_prop_owner_exemption as wpoe_snr with(nolock) on
			wpov.year = wpoe_snr.year
			and wpov.sup_num = wpoe_snr.sup_num
			and wpov.prop_id = wpoe_snr.prop_id
			and wpov.owner_id = wpoe_snr.owner_id
			and wpoe_snr.exmpt_type_cd = 'SNR/DSBL'
		where drpa.dataset_id = @dataset_id and drpa.u500_flag = 0 
		group by drpa.dataset_id
			--wpoe_snr.exempt_qualify_cd	

		if ( @@rowcount = 0 )
		begin
			insert into ##dor_report_general(
				dataset_id, senior1_count, senior1_market, senior1_frozen, senior1_exempt,
				senior2_count, senior2_market, senior2_frozen, senior2_exempt,
				senior3_count, senior3_market, senior3_frozen, senior3_exempt,
				current_use_agreements, new_current_use_agreements, remodel_count, remodel_value,
				new_construction_imprv, 
				new_construction_land, 
				new_construction_personal,
				new_construction_windturbine,
				new_construction_solar,
				new_construction_biomass,
				new_construction_geothermal,
				new_construction
			)
			values (
				@dataset_id, 0, 0, 0, 0,
				0, 0, 0, 0, 
				0, 0, 0, 0, 
				0, 0, 0, 0, 
				0, 0, 0, 0, 0, 0, 0, 0
			)
		end 	



		---- senior 1 exempt State Levy Part 2
		update ##dor_report_general
		set senior1_levy2 = (
			select sum(isnull(wpv.snr_taxable_portion,0))
					from ##dor_report_prop_assoc as drpa with(nolock)
					inner join property p with(nolock)
						on drpa.geo_id = p.geo_id and
						drpa.prop_id = p.prop_id
						--and drpa.snr_flag = 1				
					join wash_prop_owner_val as wpov with(nolock) on
						drpa.prop_val_yr = wpov.year
						and drpa.sup_num = wpov.sup_num
						and p.prop_id = wpov.prop_id
					join wash_property_val as wpv with(nolock) on
						wpov.year = wpv.prop_val_yr
						and wpov.sup_num = wpv.sup_num
						and wpov.prop_id = wpv.prop_id
					join property_val as pv with(nolock) on
						drpa.prop_val_yr = pv.prop_val_yr
						and drpa.sup_num = pv.sup_num
						and p.prop_id = pv.prop_id
					left outer join wash_prop_owner_exemption as wpoe_snr with(nolock) on
						wpov.year = wpoe_snr.year
						and wpov.sup_num = wpoe_snr.sup_num
						and wpov.prop_id = wpoe_snr.prop_id
						and wpov.owner_id = wpoe_snr.owner_id
						and wpoe_snr.exmpt_type_cd = 'SNR/DSBL'
					join (
						select distinct drpa.prop_id, drpa.prop_val_yr, drpa.sup_num
						from ##dor_report_prop_assoc drpa
						join wash_prop_owner_tax_district_assoc wpotda
						on drpa.prop_id = wpotda.prop_id and
						drpa.sup_num = wpotda.sup_num and
						drpa.prop_val_yr = wpotda.year
						join levy l
						on l.tax_district_id = wpotda.tax_district_id
						and l.year = wpotda.year
						join levy_type lt
						on l.levy_type_cd = lt.levy_type_cd and
						lt.levy_part = 2
						where drpa.dataset_id = @dataset_id		
					) LEVY2
					on drpa.prop_id = LEVY2.prop_id and
					drpa.prop_val_yr = LEVY2.prop_val_yr and
					drpa.sup_num = LEVY2.sup_num

					where --drpa.dataset_id = @dataset_id and 
					drpa.u500_flag = 0 	and		
				wpoe_snr.exempt_qualify_cd = '1' 
		)


		---- senior 2 exempt State Levy Part 2
		update ##dor_report_general
		set senior2_levy2 = (
			select sum(isnull(snr_taxable_portion,0))
					from ##dor_report_prop_assoc as drpa with(nolock)
					inner join property p with(nolock)
						on drpa.geo_id = p.geo_id and
						drpa.prop_id = p.prop_id
						--and drpa.snr_flag = 1				
					join wash_prop_owner_val as wpov with(nolock) on
						drpa.prop_val_yr = wpov.year
						and drpa.sup_num = wpov.sup_num
						and p.prop_id = wpov.prop_id
					join wash_property_val as wpv with(nolock) on
						wpov.year = wpv.prop_val_yr
						and wpov.sup_num = wpv.sup_num
						and wpov.prop_id = wpv.prop_id
					join property_val as pv with(nolock) on
						drpa.prop_val_yr = pv.prop_val_yr
						and drpa.sup_num = pv.sup_num
						and p.prop_id = pv.prop_id
					left outer join wash_prop_owner_exemption as wpoe_snr with(nolock) on
						wpov.year = wpoe_snr.year
						and wpov.sup_num = wpoe_snr.sup_num
						and wpov.prop_id = wpoe_snr.prop_id
						and wpov.owner_id = wpoe_snr.owner_id
						and wpoe_snr.exmpt_type_cd = 'SNR/DSBL'
					join (
						select distinct drpa.prop_id, drpa.prop_val_yr, drpa.sup_num
						from ##dor_report_prop_assoc drpa
						join wash_prop_owner_tax_district_assoc wpotda
						on drpa.prop_id = wpotda.prop_id and
						drpa.sup_num = wpotda.sup_num and
						drpa.prop_val_yr = wpotda.year
						join levy l
						on l.tax_district_id = wpotda.tax_district_id
						and l.year = wpotda.year
						join levy_type lt
						on l.levy_type_cd = lt.levy_type_cd and
						lt.levy_part = 2
						where drpa.dataset_id = @dataset_id		
					) LEVY2
					on drpa.prop_id = LEVY2.prop_id and
					drpa.prop_val_yr = LEVY2.prop_val_yr and
					drpa.sup_num = LEVY2.sup_num

					where --drpa.dataset_id = @dataset_id and 
					drpa.u500_flag = 0 	and		
				wpoe_snr.exempt_qualify_cd = '2' 
			)
		
		---- senior 3 exempt State Levy Part 2
		update ##dor_report_general
		set senior3_levy2 = (
			select sum(isnull(snr_taxable_portion,0))
					from ##dor_report_prop_assoc as drpa with(nolock)
					inner join property p with(nolock)
						on drpa.geo_id = p.geo_id and
						drpa.prop_id = p.prop_id
						--and drpa.snr_flag = 1				
					join wash_prop_owner_val as wpov with(nolock) on
						drpa.prop_val_yr = wpov.year
						and drpa.sup_num = wpov.sup_num
						and p.prop_id = wpov.prop_id
					join wash_property_val as wpv with(nolock) on
						wpov.year = wpv.prop_val_yr
						and wpov.sup_num = wpv.sup_num
						and wpov.prop_id = wpv.prop_id
					join property_val as pv with(nolock) on
						drpa.prop_val_yr = pv.prop_val_yr
						and drpa.sup_num = pv.sup_num
						and p.prop_id = pv.prop_id
					left outer join wash_prop_owner_exemption as wpoe_snr with(nolock) on
						wpov.year = wpoe_snr.year
						and wpov.sup_num = wpoe_snr.sup_num
						and wpov.prop_id = wpoe_snr.prop_id
						and wpov.owner_id = wpoe_snr.owner_id
						and wpoe_snr.exmpt_type_cd = 'SNR/DSBL'
					join (
						select distinct drpa.prop_id, drpa.prop_val_yr, drpa.sup_num
						from ##dor_report_prop_assoc drpa
						join wash_prop_owner_tax_district_assoc wpotda
						on drpa.prop_id = wpotda.prop_id and
						drpa.sup_num = wpotda.sup_num and
						drpa.prop_val_yr = wpotda.year
						join levy l
						on l.tax_district_id = wpotda.tax_district_id
						and l.year = wpotda.year
						join levy_type lt
						on l.levy_type_cd = lt.levy_type_cd and
						lt.levy_part = 2
						where drpa.dataset_id = @dataset_id		
					) LEVY2
					on drpa.prop_id = LEVY2.prop_id and
					drpa.prop_val_yr = LEVY2.prop_val_yr and
					drpa.sup_num = LEVY2.sup_num

					where --drpa.dataset_id = @dataset_id and 
					drpa.u500_flag = 0 	and		
				wpoe_snr.exempt_qualify_cd = '3' 
			)				
		
		---- new_construction_imprv
		update ##dor_report_general
		set new_construction_imprv = (
			select sum(isnull(pv.new_val_imprv_hs, 0) + isnull(pv.new_val_imprv_nhs, 0))
			from ##dor_report_prop_assoc as drpa with(nolock)
			join (
				select distinct drpa.prop_id, drpa.prop_val_yr, drpa.sup_num
				from ##dor_report_prop_assoc drpa
				join wash_prop_owner_tax_district_assoc wpotda
				on drpa.prop_id = wpotda.prop_id and
				drpa.sup_num = wpotda.sup_num and
				drpa.prop_val_yr = wpotda.year
				join levy l
				on l.tax_district_id = wpotda.tax_district_id
				and l.year = wpotda.year
				join levy_type lt
				on l.levy_type_cd = lt.levy_type_cd and
				lt.levy_part = 1
				where drpa.dataset_id = @dataset_id		
			) LEVY1
			on drpa.prop_id = LEVY1.prop_id and
			drpa.prop_val_yr = LEVY1.prop_val_yr and
			drpa.sup_num = LEVY1.sup_num
			join property p with(nolock)
				on drpa.geo_id = p.geo_id
				and drpa.prop_id = p.prop_id
			join property_val as pv with (nolock) on
					pv.prop_val_yr = drpa.prop_val_yr
				and pv.prop_id = p.prop_id
				and pv.sup_num = drpa.sup_num
			left join property_sub_type as pst with (nolock) on
				pst.property_sub_cd = pv.sub_type 
			where 
				drpa.dataset_id = @dataset_id and 
				drpa.u500_flag = 0 and
				isnull(pst.facility_type, '') not in('W', 'S', 'B', 'G') )

		update ##dor_report_general
		set new_construction_imprv_levy2 = (
			select sum(isnull(pv.new_val_imprv_hs, 0) + isnull(pv.new_val_imprv_nhs, 0))
			from ##dor_report_prop_assoc as drpa with(nolock)
			join (
				select distinct case when pe.exmpt_type_cd <> 'SNR/DSBL' or pe.exmpt_type_cd Is Null then drpa.prop_id else NULL end prop_id, drpa.prop_val_yr, drpa.sup_num
				from ##dor_report_prop_assoc drpa
				join wash_prop_owner_tax_district_assoc wpotda
				on drpa.prop_id = wpotda.prop_id and
				drpa.sup_num = wpotda.sup_num and
				drpa.prop_val_yr = wpotda.year
	left join property_exemption as pe with(nolock) on
		pe.prop_id = wpotda.prop_id and
		pe.owner_tax_yr = wpotda.year and
		pe. sup_num = wpotda.sup_num
				join levy l
				on l.tax_district_id = wpotda.tax_district_id
				and l.year = wpotda.year
				join levy_type lt
				on l.levy_type_cd = lt.levy_type_cd and
				lt.levy_part = 2
				where drpa.dataset_id = @dataset_id		
			) LEVY2
			on drpa.prop_id = LEVY2.prop_id and
			drpa.prop_val_yr = LEVY2.prop_val_yr and
			drpa.sup_num = LEVY2.sup_num
			join property p with(nolock)
				on drpa.geo_id = p.geo_id
				and drpa.prop_id = p.prop_id
			join property_val as pv with (nolock) on
					pv.prop_val_yr = drpa.prop_val_yr
				and pv.prop_id = p.prop_id
				and pv.sup_num = drpa.sup_num
			left join property_sub_type as pst with (nolock) on
				pst.property_sub_cd = pv.sub_type 
			where 
				drpa.dataset_id = @dataset_id and 
				drpa.u500_flag = 0 and
				isnull(pst.facility_type, '') not in('W', 'S', 'B', 'G') )

			

		---- new_construction_land
		update ##dor_report_general
		set new_construction_land = (
		select sum(isnull(pv.new_val_land_hs, 0) + isnull(pv.new_val_land_nhs, 0))
		from ##dor_report_prop_assoc as drpa with(nolock)
			join (
				select distinct drpa.prop_id, drpa.prop_val_yr, drpa.sup_num
				from ##dor_report_prop_assoc drpa
				join wash_prop_owner_tax_district_assoc wpotda
				on drpa.prop_id = wpotda.prop_id and
				drpa.sup_num = wpotda.sup_num and
				drpa.prop_val_yr = wpotda.year
				join levy l
				on l.tax_district_id = wpotda.tax_district_id
				and l.year = wpotda.year
				join levy_type lt
				on l.levy_type_cd = lt.levy_type_cd and
				lt.levy_part = 1
				where drpa.dataset_id = @dataset_id		
			) LEVY1
			on drpa.prop_id = LEVY1.prop_id and
			drpa.prop_val_yr = LEVY1.prop_val_yr and
			drpa.sup_num = LEVY1.sup_num
		join [property] as p with (nolock) on
				p.geo_id = drpa.geo_id
				and drpa.prop_id = p.prop_id				
		join property_val as pv with (nolock) on
				drpa.prop_val_yr = pv.prop_val_yr
			and drpa.sup_num = pv.sup_num
			and p.prop_id = pv.prop_id
		left join property_sub_type as pst with (nolock) on
				pst.property_sub_cd = pv.sub_type
		where 
			drpa.dataset_id = @dataset_id and 
			drpa.u500_flag = 0 and
			(isnull(pst.facility_type, '') not in('W', 'S', 'B', 'G')) and
			(p.prop_type_cd <> 'R' 
				or 
			(p.prop_type_cd = 'R' and isnull(pst.imp_leased_land, 0) = 0)
			))

		update ##dor_report_general
		set new_construction_land_levy2 = (
		select sum(isnull(pv.new_val_land_hs, 0) + isnull(pv.new_val_land_nhs, 0))
		from ##dor_report_prop_assoc as drpa with(nolock)
		join (
			select distinct case when pe.exmpt_type_cd <> 'SNR/DSBL' or pe.exmpt_type_cd Is Null then drpa.prop_id else NULL end prop_id, drpa.prop_val_yr, drpa.sup_num
			from ##dor_report_prop_assoc drpa
			join wash_prop_owner_tax_district_assoc wpotda
			on drpa.prop_id = wpotda.prop_id and
			drpa.sup_num = wpotda.sup_num and
			drpa.prop_val_yr = wpotda.year
	left join property_exemption as pe with(nolock) on
		pe.prop_id = wpotda.prop_id and
		pe.owner_tax_yr = wpotda.year and
		pe. sup_num = wpotda.sup_num
			join levy l
			on l.tax_district_id = wpotda.tax_district_id
			and l.year = wpotda.year
			join levy_type lt
			on l.levy_type_cd = lt.levy_type_cd and
			lt.levy_part = 2
			where drpa.dataset_id = @dataset_id		
		) LEVY2
		on drpa.prop_id = LEVY2.prop_id and
		drpa.prop_val_yr = LEVY2.prop_val_yr and
		drpa.sup_num = LEVY2.sup_num
		join [property] as p with (nolock) on
				p.geo_id = drpa.geo_id
				and drpa.prop_id = p.prop_id				
		join property_val as pv with (nolock) on
				drpa.prop_val_yr = pv.prop_val_yr
			and drpa.sup_num = pv.sup_num
			and p.prop_id = pv.prop_id
		left join property_sub_type as pst with (nolock) on
				pst.property_sub_cd = pv.sub_type
		where 
			drpa.dataset_id = @dataset_id and 
			drpa.u500_flag = 0 and
			(isnull(pst.facility_type, '') not in('W', 'S', 'B', 'G')) and
			(p.prop_type_cd <> 'R' 
				or 
			(p.prop_type_cd = 'R' and isnull(pst.imp_leased_land, 0) = 0)
			))
		
		
		--- new_construction_personal
		update ##dor_report_general
		set new_construction_personal = (
		select sum(isnull(pv.new_val_p, 0))
		from ##dor_report_prop_assoc as drpa with(nolock)
			join (
				select distinct drpa.prop_id, drpa.prop_val_yr, drpa.sup_num
				from ##dor_report_prop_assoc drpa
				join wash_prop_owner_tax_district_assoc wpotda
				on drpa.prop_id = wpotda.prop_id and
				drpa.sup_num = wpotda.sup_num and
				drpa.prop_val_yr = wpotda.year
				join levy l
				on l.tax_district_id = wpotda.tax_district_id
				and l.year = wpotda.year
				join levy_type lt
				on l.levy_type_cd = lt.levy_type_cd and
				lt.levy_part = 1
				where drpa.dataset_id = @dataset_id		
			) LEVY1
			on drpa.prop_id = LEVY1.prop_id and
			drpa.prop_val_yr = LEVY1.prop_val_yr and
			drpa.sup_num = LEVY1.sup_num
		join [property] as p with (nolock) on
			p.geo_id = drpa.geo_id
			and drpa.prop_id = p.prop_id				
		join property_val as pv with (nolock) on
			drpa.prop_val_yr = pv.prop_val_yr and
			drpa.sup_num = pv.sup_num and
			p.prop_id = pv.prop_id
		left join property_sub_type as pst with (nolock) on
			pst.property_sub_cd = pv.sub_type
		where 
			drpa.dataset_id = @dataset_id and 
			drpa.u500_flag = 0 and 
			(isnull(pst.facility_type, '') not in('W', 'S', 'B', 'G')) and
			p.prop_type_cd = 'P')

		update ##dor_report_general
		set new_construction_personal_levy2 = (
		select sum(isnull(pv.new_val_p, 0))
		from ##dor_report_prop_assoc as drpa with(nolock)
		join (
			select distinct case when pe.exmpt_type_cd <> 'SNR/DSBL' or pe.exmpt_type_cd Is Null then drpa.prop_id else NULL end prop_id, drpa.prop_val_yr, drpa.sup_num
			from ##dor_report_prop_assoc drpa
			join wash_prop_owner_tax_district_assoc wpotda
			on drpa.prop_id = wpotda.prop_id and
			drpa.sup_num = wpotda.sup_num and
			drpa.prop_val_yr = wpotda.year
	left join property_exemption as pe with(nolock) on
		pe.prop_id = wpotda.prop_id and
		pe.owner_tax_yr = wpotda.year and
		pe. sup_num = wpotda.sup_num
			join levy l
			on l.tax_district_id = wpotda.tax_district_id
			and l.year = wpotda.year
			join levy_type lt
			on l.levy_type_cd = lt.levy_type_cd and
			lt.levy_part = 2
			where drpa.dataset_id = @dataset_id		
		) LEVY2
		on drpa.prop_id = LEVY2.prop_id and
		drpa.prop_val_yr = LEVY2.prop_val_yr and
		drpa.sup_num = LEVY2.sup_num
		join [property] as p with (nolock) on
			p.geo_id = drpa.geo_id
			and drpa.prop_id = p.prop_id				
		join property_val as pv with (nolock) on
			drpa.prop_val_yr = pv.prop_val_yr and
			drpa.sup_num = pv.sup_num and
			p.prop_id = pv.prop_id
		left join property_sub_type as pst with (nolock) on
			pst.property_sub_cd = pv.sub_type
		where 
			drpa.dataset_id = @dataset_id and 
			drpa.u500_flag = 0 and 
			(isnull(pst.facility_type, '') not in('W', 'S', 'B', 'G')) and
			p.prop_type_cd = 'P')
		
		

		
		set @facility_imprv_value = 0
		set @facility_land_value = 0
		set @facility_personal_value = 0
		
		---- new_construction_windturbine --------
		set @facility_imprv_value = 
		(
			select sum(isnull(pv.new_val_imprv_hs, 0) + isnull(pv.new_val_imprv_nhs, 0))
			from ##dor_report_prop_assoc as drpa with(nolock)
			join property p with(nolock)
				on drpa.geo_id = p.geo_id
				and drpa.prop_id = p.prop_id				
			join property_val as pv with (nolock) on
				pv.prop_val_yr = drpa.prop_val_yr and
				pv.prop_id = p.prop_id and
				pv.sup_num = drpa.sup_num
			join property_sub_type as pst with (nolock) on
				pst.property_sub_cd = pv.sub_type 
			where 
				drpa.dataset_id = @dataset_id and 
				drpa.u500_flag = 0 and
				(isnull(pst.facility_type, '') = 'W')  
		)
					
		
		set @facility_land_value = 
		(
			select sum(isnull(pv.new_val_land_hs, 0) + isnull(pv.new_val_land_nhs, 0))
			from ##dor_report_prop_assoc as drpa with(nolock)
			join [property] as p with (nolock) on
				p.geo_id = drpa.geo_id
				and drpa.prop_id = p.prop_id				
			join property_val as pv with (nolock) on
				drpa.prop_val_yr = pv.prop_val_yr and
				drpa.sup_num = pv.sup_num and
				p.prop_id = pv.prop_id
			join property_sub_type as pst with (nolock) on
				pst.property_sub_cd = pv.sub_type
			where 
				drpa.dataset_id = @dataset_id and 
				drpa.u500_flag = 0 and
				(isnull(pst.facility_type, '') = 'W') and
				(p.prop_type_cd <> 'R' 
					or 
				(p.prop_type_cd = 'R' and isnull(pst.imp_leased_land, 0) = 0) )
		)
		
		
		set @facility_personal_value = 
		(
			select sum(isnull(pv.new_val_p, 0))
			from ##dor_report_prop_assoc as drpa with(nolock)
			join (
				select distinct drpa.prop_id, drpa.prop_val_yr, drpa.sup_num
				from ##dor_report_prop_assoc drpa
				join wash_prop_owner_tax_district_assoc wpotda
				on drpa.prop_id = wpotda.prop_id and
				drpa.sup_num = wpotda.sup_num and
				drpa.prop_val_yr = wpotda.year
				join levy l
				on l.tax_district_id = wpotda.tax_district_id
				and l.year = wpotda.year
				join levy_type lt
				on l.levy_type_cd = lt.levy_type_cd and
				lt.levy_part = 1
				where drpa.dataset_id = @dataset_id		
			) LEVY1
			on drpa.prop_id = LEVY1.prop_id and
				drpa.prop_val_yr = LEVY1.prop_val_yr and
				drpa.sup_num = LEVY1.sup_num
			join [property] as p with (nolock) on
					p.geo_id = drpa.geo_id
					and drpa.prop_id = p.prop_id				
			join property_val as pv with (nolock) on
				drpa.prop_val_yr = pv.prop_val_yr and
				drpa.sup_num = pv.sup_num and
				p.prop_id = pv.prop_id
			join property_sub_type as pst with (nolock) on
				pst.property_sub_cd = pv.sub_type
			where 
				drpa.dataset_id = @dataset_id and 
				drpa.u500_flag = 0 and 
				(isnull(pst.facility_type, '') = 'W') and
				p.prop_type_cd = 'P'
		)
			
			
		update ##dor_report_general
		set new_construction_windturbine =
			isnull(@facility_imprv_value, 0) + 
			isnull(@facility_land_value, 0) + 
			isnull(@facility_personal_value, 0)

	update ##dor_report_general
	set new_construction = new_construction_imprv + new_construction_personal + new_construction_land + new_construction_solar + new_construction_biomass + new_construction_geothermal
	where dataset_id = @dataset_id

	update ##dor_report_general
	set new_construction_levy2 = new_construction_imprv_levy2 + new_construction_personal_levy2 + new_construction_land_levy2
	where dataset_id = @dataset_id
			
		
		---- new_construction_solar --------
		set @facility_imprv_value = 0
		set @facility_land_value = 0
		set @facility_personal_value = 0
		
		set @facility_imprv_value = 
		(
			select sum(isnull(pv.new_val_imprv_hs, 0) + isnull(pv.new_val_imprv_nhs, 0))
			from ##dor_report_prop_assoc as drpa with(nolock)
			join property p with(nolock)
				on drpa.geo_id = p.geo_id
				and drpa.prop_id = p.prop_id				
			join property_val as pv with (nolock) on
				pv.prop_val_yr = drpa.prop_val_yr and
				pv.prop_id = p.prop_id and
				pv.sup_num = drpa.sup_num
			join property_sub_type as pst with (nolock) on
				pst.property_sub_cd = pv.sub_type 
			where 
				drpa.dataset_id = @dataset_id and 
				drpa.u500_flag = 0 and
				(isnull(pst.facility_type, '') = 'S')
		)
					
		
		set @facility_land_value = 
		(
			select sum(isnull(pv.new_val_land_hs, 0) + isnull(pv.new_val_land_nhs, 0))
			from ##dor_report_prop_assoc as drpa with(nolock)
			join [property] as p with (nolock) on
				p.geo_id = drpa.geo_id
				and drpa.prop_id = p.prop_id				
			join property_val as pv with (nolock) on
				drpa.prop_val_yr = pv.prop_val_yr and
				drpa.sup_num = pv.sup_num and
				p.prop_id = pv.prop_id
			join property_sub_type as pst with (nolock) on
				pst.property_sub_cd = pv.sub_type
			where 
				drpa.dataset_id = @dataset_id and 
				drpa.u500_flag = 0 and
				(isnull(pst.facility_type, '') = 'S') and
				(p.prop_type_cd <> 'R' 
					or 
				(p.prop_type_cd = 'R' and isnull(pst.imp_leased_land, 0) = 0) )
		)
		
		
		set @facility_personal_value = 
		(
			select sum(isnull(pv.new_val_p, 0))
			from ##dor_report_prop_assoc as drpa with(nolock)
			join (
				select distinct drpa.prop_id, drpa.prop_val_yr, drpa.sup_num
				from ##dor_report_prop_assoc drpa
				join wash_prop_owner_tax_district_assoc wpotda
				on drpa.prop_id = wpotda.prop_id and
				drpa.sup_num = wpotda.sup_num and
				drpa.prop_val_yr = wpotda.year
				join levy l
				on l.tax_district_id = wpotda.tax_district_id
				and l.year = wpotda.year
				join levy_type lt
				on l.levy_type_cd = lt.levy_type_cd and
				lt.levy_part = 1
				where drpa.dataset_id = @dataset_id		
			) LEVY1
			on drpa.prop_id = LEVY1.prop_id and
				drpa.prop_val_yr = LEVY1.prop_val_yr and
				drpa.sup_num = LEVY1.sup_num
			join [property] as p with (nolock) on
					p.geo_id = drpa.geo_id
					and drpa.prop_id = p.prop_id				
			join property_val as pv with (nolock) on
				drpa.prop_val_yr = pv.prop_val_yr and
				drpa.sup_num = pv.sup_num and
				p.prop_id = pv.prop_id
			join property_sub_type as pst with (nolock) on
				pst.property_sub_cd = pv.sub_type
			where 
				drpa.dataset_id = @dataset_id and 
				drpa.u500_flag = 0 and 
				(isnull(pst.facility_type, '') = 'S') and
				p.prop_type_cd = 'P'
		)
			
			
		update ##dor_report_general
		set new_construction_solar =
			isnull(@facility_imprv_value, 0) + 
			isnull(@facility_land_value, 0) + 
			isnull(@facility_personal_value, 0)
				

		---- new_construction_biomass --------
		set @facility_imprv_value = 0
		set @facility_land_value = 0
		set @facility_personal_value = 0
		
		set @facility_imprv_value = 
		(
			select sum(isnull(pv.new_val_imprv_hs, 0) + isnull(pv.new_val_imprv_nhs, 0))
			from ##dor_report_prop_assoc as drpa with(nolock)
			join property p with(nolock)
				on drpa.geo_id = p.geo_id
				and drpa.prop_id = p.prop_id				
			join property_val as pv with (nolock) on
				pv.prop_val_yr = drpa.prop_val_yr and
				pv.prop_id = p.prop_id and
				pv.sup_num = drpa.sup_num
			join property_sub_type as pst with (nolock) on
				pst.property_sub_cd = pv.sub_type 
			where 
				drpa.dataset_id = @dataset_id and 
				drpa.u500_flag = 0 and
				(isnull(pst.facility_type, '') = 'B')
		)
					
		
		set @facility_land_value = 
		(
			select sum(isnull(pv.new_val_land_hs, 0) + isnull(pv.new_val_land_nhs, 0))
			from ##dor_report_prop_assoc as drpa with(nolock)
			join [property] as p with (nolock) on
				p.geo_id = drpa.geo_id
				and drpa.prop_id = p.prop_id				
			join property_val as pv with (nolock) on
				drpa.prop_val_yr = pv.prop_val_yr and
				drpa.sup_num = pv.sup_num and
				p.prop_id = pv.prop_id
			join property_sub_type as pst with (nolock) on
				pst.property_sub_cd = pv.sub_type
			where 
				drpa.dataset_id = @dataset_id and 
				drpa.u500_flag = 0 and
				(isnull(pst.facility_type, '') = 'B') and
				(p.prop_type_cd <> 'R' 
					or 
				(p.prop_type_cd = 'R' and isnull(pst.imp_leased_land, 0) = 0) )
		)
		
		
		--- new_construction_personal
		set @facility_personal_value = 
		(
			select sum(isnull(pv.new_val_p, 0))
			from ##dor_report_prop_assoc as drpa with(nolock)
			join (
				select distinct drpa.prop_id, drpa.prop_val_yr, drpa.sup_num
				from ##dor_report_prop_assoc drpa
				join wash_prop_owner_tax_district_assoc wpotda
				on drpa.prop_id = wpotda.prop_id and
				drpa.sup_num = wpotda.sup_num and
				drpa.prop_val_yr = wpotda.year
				join levy l
				on l.tax_district_id = wpotda.tax_district_id
				and l.year = wpotda.year
				join levy_type lt
				on l.levy_type_cd = lt.levy_type_cd and
				lt.levy_part = 1
				where drpa.dataset_id = @dataset_id		
			) LEVY1
			on drpa.prop_id = LEVY1.prop_id and
			drpa.prop_val_yr = LEVY1.prop_val_yr and
			drpa.sup_num = LEVY1.sup_num
			join [property] as p with (nolock) on
					p.geo_id = drpa.geo_id
					and drpa.prop_id = p.prop_id				
			join property_val as pv with (nolock) on
				drpa.prop_val_yr = pv.prop_val_yr and
				drpa.sup_num = pv.sup_num and
				p.prop_id = pv.prop_id
			join property_sub_type as pst with (nolock) on
				pst.property_sub_cd = pv.sub_type
			where 
				drpa.dataset_id = @dataset_id and 
				drpa.u500_flag = 0 and 
				(isnull(pst.facility_type, '') = 'B') and
				p.prop_type_cd = 'P'
		)
			
			
		update ##dor_report_general
		set new_construction_biomass =
			isnull(@facility_imprv_value, 0) + 
			isnull(@facility_land_value, 0) + 
			isnull(@facility_personal_value, 0)
			
			
		---- new_construction_geothermal --------
		set @facility_imprv_value = 0
		set @facility_land_value = 0
		set @facility_personal_value = 0
		
		set @facility_imprv_value = 
		(
			select sum(isnull(pv.new_val_imprv_hs, 0) + isnull(pv.new_val_imprv_nhs, 0))
			from ##dor_report_prop_assoc as drpa with(nolock)
			join property p with(nolock)
				on drpa.geo_id = p.geo_id
				and drpa.prop_id = p.prop_id				
			join property_val as pv with (nolock) on
				pv.prop_val_yr = drpa.prop_val_yr and
				pv.prop_id = p.prop_id and
				pv.sup_num = drpa.sup_num
			join property_sub_type as pst with (nolock) on
				pst.property_sub_cd = pv.sub_type 
			where 
				drpa.dataset_id = @dataset_id and 
				drpa.u500_flag = 0 and
				(isnull(pst.facility_type, '') = 'G')
		)
					
		
		set @facility_land_value = 
		(
			select sum(isnull(pv.new_val_land_hs, 0) + isnull(pv.new_val_land_nhs, 0))
			from ##dor_report_prop_assoc as drpa with(nolock)
			join [property] as p with (nolock) on
				p.geo_id = drpa.geo_id
				and drpa.prop_id = p.prop_id				
			join property_val as pv with (nolock) on
				drpa.prop_val_yr = pv.prop_val_yr and
				drpa.sup_num = pv.sup_num and
				p.prop_id = pv.prop_id
			join property_sub_type as pst with (nolock) on
				pst.property_sub_cd = pv.sub_type
			where 
				drpa.dataset_id = @dataset_id and 
				drpa.u500_flag = 0 and
				(isnull(pst.facility_type, '') = 'G') and
				(p.prop_type_cd <> 'R' 
					or 
				(p.prop_type_cd = 'R' and isnull(pst.imp_leased_land, 0) = 0) )
		)
		
		
		set @facility_personal_value = 
		(
			select sum(isnull(pv.new_val_p, 0))
			from ##dor_report_prop_assoc as drpa with(nolock)
			join [property] as p with (nolock) on
					p.geo_id = drpa.geo_id
					and drpa.prop_id = p.prop_id				
			join property_val as pv with (nolock) on
				drpa.prop_val_yr = pv.prop_val_yr and
				drpa.sup_num = pv.sup_num and
				p.prop_id = pv.prop_id
			join property_sub_type as pst with (nolock) on
				pst.property_sub_cd = pv.sub_type
			where 
				drpa.dataset_id = @dataset_id and 
				drpa.u500_flag = 0 and 
				(isnull(pst.facility_type, '') = 'G') and
				p.prop_type_cd = 'P'
		)
			
			
		update ##dor_report_general
		set new_construction_geothermal =
			isnull(@facility_imprv_value, 0) + 
			isnull(@facility_land_value, 0) + 
			isnull(@facility_personal_value, 0)
			
					
		/*
		update ##dor_report_general
		set new_construction_windturbine = (
			select	
				##dor_report_general.new_construction_land + 
				##dor_report_general.new_construction_imprv +
				##dor_report_general.new_construction_personal
			from ##dor_report_prop_assoc as drpa with(nolock)
			join property_val as pv with (nolock) on
				pv.prop_val_yr = drpa.prop_val_yr and
				pv.prop_id = drpa.prop_id and
				pv.sup_num = drpa.sup_num 
			join property_sub_type as pst with (nolock) on
				pst.property_sub_cd = pv.sub_type 
			where 
				drpa.dataset_id = @dataset_id and 
				drpa.u500_flag = 0 and
				pst.facility_type = 'W')
		*/		
		
		
		/*
		---- new_construction_solar --------
		update ##dor_report_general
		set new_construction_solar = (
			select	
				##dor_report_general.new_construction_land + 
				##dor_report_general.new_construction_imprv +
				##dor_report_general.new_construction_personal
			from ##dor_report_prop_assoc as drpa with(nolock)
			join property_val as pv with (nolock) on
				pv.prop_val_yr = drpa.prop_val_yr and
				pv.prop_id = drpa.prop_id and
				pv.sup_num = drpa.sup_num 
			join property_sub_type as pst with (nolock) on
				pst.property_sub_cd = pv.sub_type 
			where 
				drpa.dataset_id = @dataset_id and 
				drpa.u500_flag = 0 and
				pst.facility_type = 'S')	
				
		
		update ##dor_report_general
		set new_construction_solar = 0
		where dataset_id = @dataset_id and (isnull(new_construction_solar, 0) <= 0)
				
		---- new_construction_biomass --------
		update ##dor_report_general
		set new_construction_biomass = (
			select	
				##dor_report_general.new_construction_land + 
				##dor_report_general.new_construction_imprv +
				##dor_report_general.new_construction_personal
			from ##dor_report_prop_assoc as drpa with(nolock)
			join property_val as pv with (nolock) on
				pv.prop_val_yr = drpa.prop_val_yr and
				pv.prop_id = drpa.prop_id and
				pv.sup_num = drpa.sup_num 
			join property_sub_type as pst with (nolock) on
				pst.property_sub_cd = pv.sub_type 
			where 
				drpa.dataset_id = @dataset_id and 
				drpa.u500_flag = 0 and
				pst.facility_type = 'B')	
				
				
		update ##dor_report_general
		set new_construction_biomass = 0
		where dataset_id = @dataset_id and (isnull(new_construction_biomass, 0) <= 0)	
						
		---- new_construction_biomass --------
		update ##dor_report_general
		set new_construction_geothermal = (
			select	
				##dor_report_general.new_construction_land + 
				##dor_report_general.new_construction_imprv +
				##dor_report_general.new_construction_personal
			from ##dor_report_prop_assoc as drpa with(nolock)
			join property_val as pv with (nolock) on
				pv.prop_val_yr = drpa.prop_val_yr and
				pv.prop_id = drpa.prop_id and
				pv.sup_num = drpa.sup_num 
			join property_sub_type as pst with (nolock) on
				pst.property_sub_cd = pv.sub_type 
			where 
				drpa.dataset_id = @dataset_id and 
				drpa.u500_flag = 0 and
				pst.facility_type = 'G')	
				
				
		update ##dor_report_general
		set new_construction_geothermal = 0
		where dataset_id = @dataset_id and (isnull(new_construction_geothermal, 0) <= 0)		
								
		*/

	/*		
		---- solar --------
		update ##dor_report_general
		set new_construction_solar = (
			select isnull(i.imp_new_val, 0)
			--select isnull(sum(isnull(pv.new_val_imprv_hs, 0) + isnull(pv.new_val_imprv_nhs, 0)), 0)
			from ##dor_report_prop_assoc as drpa with(nolock)
			join property_val as pv with (nolock) on
					pv.prop_val_yr = drpa.prop_val_yr and
					pv.prop_id = drpa.prop_id and
					pv.sup_num = drpa.sup_num
			join imprv as i with(nolock) on
					pv.prop_val_yr = i.prop_val_yr and
					pv.prop_id = i.prop_id and
					pv.sup_num = i.sup_num
			join imprv_type as it with(nolock) on
					it.imprv_type_cd = i.imprv_type_cd and
					it.facility_type = 'S'		
			where drpa.dataset_id = @dataset_id and drpa.u500_flag = 0)
			
		
		---- biomass --------
		update ##dor_report_general
		set new_construction_biomass = (
			select isnull(i.imp_new_val, 0)
			--select isnull(sum(isnull(pv.new_val_imprv_hs, 0) + isnull(pv.new_val_imprv_nhs, 0)), 0)
			from ##dor_report_prop_assoc as drpa with(nolock)
			join property_val as pv with (nolock) on
					pv.prop_val_yr = drpa.prop_val_yr and
					pv.prop_id = drpa.prop_id and
					pv.sup_num = drpa.sup_num
			join imprv as i with(nolock) on
					pv.prop_val_yr = i.prop_val_yr and
					pv.prop_id = i.prop_id and
					pv.sup_num = i.sup_num
			join imprv_type as it with(nolock) on
					it.imprv_type_cd = i.imprv_type_cd and
					it.facility_type = 'B'		
			where drpa.dataset_id = @dataset_id and drpa.u500_flag = 0)
			
		
		---- geothermal --------
		update ##dor_report_general
		set new_construction_geothermal = (
			select isnull(i.imp_new_val, 0)
			--select isnull(sum(isnull(pv.new_val_imprv_hs, 0) + isnull(pv.new_val_imprv_nhs, 0)), 0)
			from ##dor_report_prop_assoc as drpa with(nolock)
			join property_val as pv with (nolock) on
					pv.prop_val_yr = drpa.prop_val_yr and
					pv.prop_id = drpa.prop_id and
					pv.sup_num = drpa.sup_num
			join imprv as i with(nolock) on
					pv.prop_val_yr = i.prop_val_yr and
					pv.prop_id = i.prop_id and
					pv.sup_num = i.sup_num
			join imprv_type as it with(nolock) on
					it.imprv_type_cd = i.imprv_type_cd and
					it.facility_type = 'G'		
			where drpa.dataset_id = @dataset_id and drpa.u500_flag = 0)
		*/	


		
		select
			@current_use_agreements = count(distinct ld.application_number)
		from ##dor_report_prop_assoc as drpa with(nolock)
		join property p with(nolock)
			on drpa.geo_id = p.geo_id
			and drpa.prop_id = p.prop_id				
		join land_detail as ld with(nolock) on
			ld.prop_val_yr = drpa.prop_val_yr and
			ld.sup_num = drpa.sup_num and
			ld.sale_id = 0 and
			ld.prop_id = p.prop_id and
			ld.ag_apply = 'T' and
			ld.application_number is not null		
					
		select
			@new_current_use_agreements = count(distinct ld.application_number)
		from ##dor_report_prop_assoc as drpa with(nolock)
		join property p with(nolock)
			on drpa.geo_id = p.geo_id	
			and drpa.prop_id = p.prop_id							
		join land_detail as ld with(nolock) on
			ld.prop_val_yr = drpa.prop_val_yr and
			ld.sup_num = drpa.sup_num and
			ld.sale_id = 0 and
			ld.prop_id = p.prop_id and
			ld.ag_apply = 'T' and
			ld.application_number is not null and
			ld.assessment_yr_qualified = drpa.prop_val_yr

		update ##dor_report_general
		set
			current_use_agreements = @current_use_agreements,
			new_current_use_agreements = @new_current_use_agreements
		where dataset_id = @dataset_id
		
		-- Do not allow new construction to go negative
		update ##dor_report_general
		set new_construction = 0
		where dataset_id = @dataset_id and new_construction < 0

		-------------------------------------------------------------------------------
		-- END PAGE 1
		-------------------------------------------------------------------------------



		-------------------------------------------------------------------------------
		-- BEGIN PAGE 2
		-------------------------------------------------------------------------------

		-- BEGIN - Distribute the freeze loss values to the land segments
		/*
		declare @tblLand table (
			prop_val_yr numeric(4,0) not null,
			sup_num int not null,
			sale_id int not null,
			prop_id int not null,
			land_seg_id int not null,
			mkt_val numeric(14,0) not null,
			ag_val numeric(14,0) not null,
			ag_apply bit not null,
			frz_loss numeric(14,0) not null,
			
			primary key clustered (prop_val_yr, sup_num, sale_id, prop_id, land_seg_id)
			with fillfactor = 100
		)
		insert @tblLand (
			prop_val_yr, sup_num, sale_id, prop_id, land_seg_id,
			mkt_val,
			ag_val,
			ag_apply,
			frz_loss
		)
		select
			ld.prop_val_yr, ld.sup_num, ld.sale_id, ld.prop_id, ld.land_seg_id,
			isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0) * case when ld.hs_pct_override = 0 then 1.0 else (ld.hs_pct / 100.0) end,
			case
				when isnull(ld.ag_val, 0) < isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0)
				then isnull(ld.ag_val, 0) * case when ld.hs_pct_override = 0 then 1.0 else (ld.hs_pct / 100.0) end
				else isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0) * case when ld.hs_pct_override = 0 then 1.0 else (ld.hs_pct / 100.0) end
			end,
			case
				when ld.ag_apply = 'T' and (au.dfl = 1 or au.timber = 1 or au.ag = 1 or au.osp = 1)
				then 1
				else 0
			end,
			0 -- We will calculate later
		from ##dor_report_prop_assoc as drpa with(nolock)
		join property as p with(nolock) on
			p.prop_id = drpa.prop_id and
			p.prop_type_cd in ('R','MH')
		join land_detail as ld with(nolock) on
			drpa.prop_val_yr = ld.prop_val_yr
			and drpa.sup_num = ld.sup_num
			and drpa.prop_id = ld.prop_id
			and ld.sale_id = 0
			and ld.land_seg_homesite = 'T'
		left outer join ag_use as au with(nolock) on
			au.ag_use_cd = ld.ag_use_cd
		--BEGIN - The page 2 totals must match the page 4 totals,
		--therefore we must be certain we use only the same properties,
		--i.e. only those with a valid property use code with a valid DOR land use code
		join property_val as pv with(nolock) on
			pv.prop_val_yr = drpa.prop_val_yr and
			pv.sup_num = drpa.sup_num and
			pv.prop_id = drpa.prop_id
		join property_use as pu with(nolock) on
			pu.property_use_cd = pv.property_use_cd
		join dor_land_use_code as dor with(nolock) on
			dor.code = pu.dor_use_code
		--END - that is the only purpose of these joins
		where drpa.dataset_id = @dataset_id and drpa.u500_flag = 0 and drpa.snr_flag = 1

		-- For each property with land
		declare curProps cursor
		for
			select distinct t.prop_val_yr, t.sup_num, t.prop_id, wpv.snr_land, wpv.snr_frz_loss_land, count(*)
			from @tblLand as t
			join wash_property_val as wpv with(nolock) on
				wpv.prop_val_yr = t.prop_val_yr and
				wpv.sup_num = t.sup_num and
				wpv.prop_id = t.prop_id
			group by t.prop_val_yr, t.sup_num, t.prop_id, wpv.snr_land, wpv.snr_frz_loss_land
		for read only
		
		declare
			@prop_yr numeric(4,0),
			@prop_sup int,
			@prop_id int,
			@snr_land numeric(14,0),
			@snr_frz_loss_land numeric(14,0),
			@num_land_segs int
		declare
			@land_seg_id int,
			@land_seg_val numeric(14,0)
		declare
			@frz_loss_remain numeric(14,0),
			@seg_num int,
			@land_seg_frz_loss numeric(14,0)
			
		open curProps
		fetch next from curProps into @prop_yr, @prop_sup, @prop_id, @snr_land, @snr_frz_loss_land, @num_land_segs
		
		while ( @@fetch_status = 0 )
		begin
			set @frz_loss_remain = @snr_frz_loss_land
			
			declare curLandSeg cursor
			for
				select
					t.land_seg_id,
					val = case when t.ag_apply = 1 then t.ag_val else t.mkt_val end
				from @tblLand as t
				where
					t.prop_val_yr = @prop_yr and
					t.sup_num = @prop_sup and
					t.sale_id = 0 and
					t.prop_id = @prop_id
				order by t.land_seg_id asc
			for read only
			
			open curLandSeg
			fetch next from curLandSeg into @land_seg_id, @land_seg_val
			
			set @seg_num = 0
			while ( @@fetch_status = 0 )
			begin
				set @seg_num = @seg_num + 1
				
				if ( @seg_num = @num_land_segs )
				begin
					-- Give last segment the remainder
					set @land_seg_frz_loss = @frz_loss_remain
				end
				else
				begin
					-- Give this segment a percentage of the freeze loss
					if ( @snr_land <> 0 )
					begin
						set @land_seg_frz_loss = (@land_seg_val / @snr_land) * @snr_frz_loss_land
					end
					else
					begin
						set @land_seg_frz_loss = 0
					end
				end
				
				set @frz_loss_remain = @frz_loss_remain - @land_seg_frz_loss
				
				update @tblLand
				set frz_loss = @land_seg_frz_loss
				where
					prop_val_yr = @prop_yr and
					sup_num = @prop_sup and
					sale_id = 0 and
					prop_id = @prop_id and
					land_seg_id = @land_seg_id				

				fetch next from curLandSeg into @land_seg_id, @land_seg_val
			end
			
			close curLandSeg
			deallocate curLandSeg
			
			fetch next from curProps into @prop_yr, @prop_sup, @prop_id, @snr_land, @snr_frz_loss_land, @num_land_segs
		end
		
		close curProps
		deallocate curProps
		*/
		-- END - Distribute the freeze loss values to the land segments

		insert ##dor_report_real (
			dataset_id, dfl_acres, dfl_market_land, osp_acres, osp_market_land, osp_land,
			tim_acres, tim_market_land, tim_land, ag_acres, ag_market_land, ag_land,
			other_land, combine_DFL_timber_values
		)
		select
			drpa.dataset_id,
			sum(case when au.dfl = 1 and ld.ag_apply = 'T' then isnull(ld.size_acres,0) else 0 end) as dfl_acres,
			sum(case when au.dfl = 1 and ld.ag_apply = 'T' then case when isnull(ld.ag_val, 0) < isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0) then isnull(ld.ag_val, 0) else isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0) end /*- isnull(lfi.frz_loss, 0)*/ else 0 end) as dfl_market_land,
		
			sum(case when au.osp = 1 and ld.ag_apply = 'T' then isnull(ld.size_acres,0) else 0 end) as osp_acres,
			sum(case when au.osp = 1 and ld.ag_apply = 'T' then isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end,0) else 0 end) as osp_market_land,
			sum(case when au.osp = 1 and ld.ag_apply = 'T' then case when isnull(ld.ag_val, 0) < isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0) then isnull(ld.ag_val, 0) else isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0) end /*- isnull(lfi.frz_loss, 0)*/ else 0 end) as osp_land,
		
			sum(case when au.timber = 1 and ld.ag_apply = 'T' then isnull(ld.size_acres,0) else 0 end) as tim_acres,
			sum(case when au.timber = 1 and ld.ag_apply = 'T' then isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end,0) else 0 end) as tim_market_land,
			sum(case when au.timber = 1 and ld.ag_apply = 'T' then case when isnull(ld.ag_val, 0) < isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0) then isnull(ld.ag_val, 0) else isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0) end /*- isnull(lfi.frz_loss, 0)*/ else 0 end) as tim_land,
		
			sum(case when au.ag = 1 and ld.ag_apply = 'T' then isnull(ld.size_acres,0) else 0 end) as ag_acres,
			sum(case when au.ag = 1 and ld.ag_apply = 'T' then isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end,0) else 0 end) as ag_market_land,
			sum(case when au.ag = 1 and ld.ag_apply = 'T' then case when isnull(ld.ag_val, 0) < isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0) then isnull(ld.ag_val, 0) else isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0) end /*- isnull(lfi.frz_loss, 0)*/ else 0 end) as ag_land,
			sum(
				case
					when
						isnull(ld.ag_apply, 'F') <> 'T'
						or (
							isnull(au.dfl, 0) = 0 and
							isnull(au.osp, 0) = 0 and
							isnull(au.timber, 0) = 0 and
							isnull(au.ag, 0) = 0
						)
					then
						isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0) /*- isnull(lfi.frz_loss, 0)*/
					else 0
				end
			) as other_land,
			@combine_DFL_timber_values
		from ##dor_report_prop_assoc as drpa with(nolock)
		join property as p with(nolock) on
			p.prop_id = drpa.prop_id and
			p.prop_type_cd in ('R','MH')
		join land_detail as ld with(nolock) on
			drpa.prop_val_yr = ld.prop_val_yr
			and drpa.sup_num = ld.sup_num
			and drpa.prop_id = ld.prop_id
			and ld.sale_id = 0
		/*
		left outer join @tblLand as lfi on
			lfi.prop_val_yr = ld.prop_val_yr and
			lfi.sup_num = ld.sup_num and
			lfi.sale_id = ld.sale_id and
			lfi.prop_id = ld.prop_id and
			lfi.land_seg_id = ld.land_seg_id
		*/
		left outer join ag_use as au with(nolock) on
			ld.ag_use_cd = au.ag_use_cd
		/*
			BEGIN - The page 2 totals must match the page 4 totals,
			therefore we must be certain we use only the same properties,
			i.e. only those with a valid property use code with a valid DOR land use code
		*/	
		join property_val as pv with(nolock) on
			pv.prop_val_yr = drpa.prop_val_yr and
			pv.sup_num = drpa.sup_num and
			pv.prop_id = drpa.prop_id
		join property_use as pu with(nolock) on
			pu.property_use_cd = pv.property_use_cd
		join dor_land_use_code as dor with(nolock) on
			dor.code = pu.dor_use_code
		/* END - that is the only purpose of these joins */
					join (
						select distinct drpa.prop_id, drpa.prop_val_yr, drpa.sup_num
						from ##dor_report_prop_assoc drpa
						join wash_prop_owner_tax_district_assoc wpotda
						on drpa.prop_id = wpotda.prop_id and
						drpa.sup_num = wpotda.sup_num and
						drpa.prop_val_yr = wpotda.year
						join levy l
						on l.tax_district_id = wpotda.tax_district_id
						and l.year = wpotda.year
						join levy_type lt
						on l.levy_type_cd = lt.levy_type_cd and
						lt.levy_part = 1
						--where drpa.dataset_id = @dataset_id		
					) LEVY1
					on drpa.prop_id = LEVY1.prop_id and
					drpa.prop_val_yr = LEVY1.prop_val_yr and
					drpa.sup_num = LEVY1.sup_num			
		where drpa.dataset_id = @dataset_id and drpa.u500_flag = 0
		group by drpa.dataset_id

		if ( @@rowcount = 0 )
		begin
			insert into ##dor_report_real(
				dataset_id, dfl_acres, dfl_market_land, osp_acres, osp_market_land,
				osp_land, tim_acres, tim_market_land, tim_land, ag_acres, ag_market_land, ag_land,
				other_land, combine_DFL_timber_values
			)
			values (
				@dataset_id, 0, 0, 0, 0,
				0, 0, 0, 0, 0, 0, 0,
				0, @combine_DFL_timber_values
			)
		end 

		set @dfl_market_land_levy2		= 0
		set @osp_land_levy2		= 0
		set @ag_land_levy2		= 0
		set @tim_land_levy2		= 0
		set @other_land_levy2		= 0
		set @other_imprv_levy2		= 0
		set @other_senior_levy2		= 0
		set @other_total_levy2		= 0
		set @total_land_levy2		= 0
		set @total_imprv_levy2		= 0
		set @total_senior_levy2		= 0
		set @total_total_levy2		= 0
		
		select
			@dfl_market_land_levy2 = sum(case when au.dfl = 1 and ld.ag_apply = 'T' then case when isnull(ld.ag_val, 0) < isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0) then isnull(ld.ag_val, 0) else isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0) end /*- isnull(lfi.frz_loss, 0)*/ else 0 end),
			@osp_land_levy2 = sum(case when au.osp = 1 and ld.ag_apply = 'T' then case when isnull(ld.ag_val, 0) < isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0) then isnull(ld.ag_val, 0) else isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0) end /*- isnull(lfi.frz_loss, 0)*/ else 0 end),
			@tim_land_levy2 = sum(case when au.timber = 1 and ld.ag_apply = 'T' then case when isnull(ld.ag_val, 0) < isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0) then isnull(ld.ag_val, 0) else isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0) end /*- isnull(lfi.frz_loss, 0)*/ else 0 end),
			@ag_land_levy2 = sum(case when au.ag = 1 and ld.ag_apply = 'T' then case when isnull(ld.ag_val, 0) < isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0) then isnull(ld.ag_val, 0) else isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0) end /*- isnull(lfi.frz_loss, 0)*/ else 0 end),
			@other_land_levy2 = 			sum(
				case
					when
						isnull(ld.ag_apply, 'F') <> 'T'
						or (
							isnull(au.dfl, 0) = 0 and
							isnull(au.osp, 0) = 0 and
							isnull(au.timber, 0) = 0 and
							isnull(au.ag, 0) = 0
						)
					then
						isnull(case pv.appr_method when 'C' then ld.land_seg_mkt_val when 'I' then ld.land_seg_mkt_val when 'D' then ld.dist_val when 'A' then ld.arb_val when 'G' then ld.mktappr_val end, 0) /*- isnull(lfi.frz_loss, 0)*/
					else 0
				end
			)
			--@combine_DFL_timber_values
		from ##dor_report_prop_assoc as drpa with(nolock)
		join property as p with(nolock) on
			p.prop_id = drpa.prop_id and
			p.prop_type_cd in ('R','MH')
		join land_detail as ld with(nolock) on
			drpa.prop_val_yr = ld.prop_val_yr
			and drpa.sup_num = ld.sup_num
			and drpa.prop_id = ld.prop_id
			and ld.sale_id = 0
		/*
		left outer join @tblLand as lfi on
			lfi.prop_val_yr = ld.prop_val_yr and
			lfi.sup_num = ld.sup_num and
			lfi.sale_id = ld.sale_id and
			lfi.prop_id = ld.prop_id and
			lfi.land_seg_id = ld.land_seg_id
		*/
		left outer join ag_use as au with(nolock) on
			ld.ag_use_cd = au.ag_use_cd
		/*
			BEGIN - The page 2 totals must match the page 4 totals,
			therefore we must be certain we use only the same properties,
			i.e. only those with a valid property use code with a valid DOR land use code
		*/	
		join property_val as pv with(nolock) on
			pv.prop_val_yr = drpa.prop_val_yr and
			pv.sup_num = drpa.sup_num and
			pv.prop_id = drpa.prop_id
		join property_use as pu with(nolock) on
			pu.property_use_cd = pv.property_use_cd
		join dor_land_use_code as dor with(nolock) on
			dor.code = pu.dor_use_code
					join (
						select distinct drpa.prop_id, drpa.prop_val_yr, drpa.sup_num
						from ##dor_report_prop_assoc drpa
						join wash_prop_owner_tax_district_assoc wpotda
						on drpa.prop_id = wpotda.prop_id and
						drpa.sup_num = wpotda.sup_num and
						drpa.prop_val_yr = wpotda.year
						join levy l
						on l.tax_district_id = wpotda.tax_district_id
						and l.year = wpotda.year
						join levy_type lt
						on l.levy_type_cd = lt.levy_type_cd and
						lt.levy_part = 2
						where drpa.dataset_id = @dataset_id		
					) LEVY2
					on drpa.prop_id = LEVY2.prop_id and
					drpa.prop_val_yr = LEVY2.prop_val_yr and
					drpa.sup_num = LEVY2.sup_num			
		/* END - that is the only purpose of these joins */
		where drpa.dataset_id = @dataset_id and drpa.u500_flag = 0
		group by drpa.dataset_id
		
		update ##dor_report_real
		set 
			dfl_market_land_levy2 = @dfl_market_land_levy2,
			osp_land_levy2 = @osp_land_levy2,
			tim_land_levy2 = @tim_land_levy2,
			ag_land_levy2 = @ag_land_levy2,
			other_land_levy2 = @other_land_levy2
		where dataset_id = 	@dataset_id	
		
		

				

		
		
		--OPEN SPACE (OSP) IMPROVEMENT
		set @osp_imprv_freeze		= 0
		
		select
			@osp_imprv_freeze = sum(
				case
					when drpa.snr_flag = 1
					then wpov.imprv_non_hstd_val + wpv.snr_imprv_lesser
					else 0
				end
			)
		from ##dor_report_prop_assoc as drpa with(nolock) 
		join wash_property_val as wpv with(nolock) on
			wpv.prop_val_yr = drpa.prop_val_yr and
			wpv.sup_num = drpa.sup_num and
			wpv.prop_id = drpa.prop_id
		join wash_prop_owner_val as wpov with(nolock) on
			wpov.year = drpa.prop_val_yr and
			wpov.sup_num = drpa.sup_num and
			wpov.prop_id = drpa.prop_id
		join dbo.property as p1 with(nolock) on
					p1.[prop_id] = drpa.[prop_id]
		join dbo.property_val as pv1 with(nolock) on
					pv1.[prop_id] = wpv.[prop_id] and
					pv1.[prop_val_yr] = wpv.[prop_val_yr] and
					pv1.sup_num = wpv.sup_num
		join property_use as pu with(nolock) on
					pu.property_use_cd = pv1.property_use_cd
		where
					pu.dor_use_code in ('94') and
					pv1.[prop_inactive_dt] is null 
					and dataset_id = @dataset_id						

		set @osp_imprv_nonfreeze		= 0

		select
			@osp_imprv_nonfreeze = sum(case
					when drpa.snr_flag = 1
					then  0
					else wpov.imprv_non_hstd_val + wpov.imprv_hstd_val
				end)
		from ##dor_report_prop_assoc as drpa with(nolock)
		join wash_prop_owner_val as wpov with(nolock) on
			wpov.year = drpa.prop_val_yr and
			wpov.sup_num = drpa.sup_num and
			wpov.prop_id = drpa.prop_id			
		join dbo.property as p1 with(nolock) on
					p1.[prop_id] = drpa.[prop_id]
		join dbo.property_val as pv1 with(nolock) on
					pv1.[prop_id] = wpov.[prop_id] and
					pv1.[prop_val_yr] = wpov.year and
					pv1.sup_num = wpov.sup_num
		join property_use as pu with(nolock) on
					pu.property_use_cd = pv1.property_use_cd
		where
					pu.dor_use_code in ('94') and
					pv1.[prop_inactive_dt] is null 
					and dataset_id = @dataset_id						




		set @osp_imprv = isnull(@osp_imprv_freeze, 0) + isnull(@osp_imprv_nonfreeze, 0)
		
		
						
						
		--AG / FARM IMPROVEMENT
		set @ag_imprv_freeze		= 0
		
		select
			@ag_imprv_freeze = sum(
				case
					when drpa.snr_flag = 1
					then  wpov.imprv_non_hstd_val + wpv.snr_imprv_lesser
					else 0
				end
				)
		from ##dor_report_prop_assoc as drpa with(nolock)
		join wash_property_val as wpv with(nolock) on
			wpv.prop_val_yr = drpa.prop_val_yr and
			wpv.sup_num = drpa.sup_num and
			wpv.prop_id = drpa.prop_id
		join wash_prop_owner_val as wpov with(nolock) on
			wpov.year = drpa.prop_val_yr and
			wpov.sup_num = drpa.sup_num and
			wpov.prop_id = drpa.prop_id
		join dbo.property as p1 with(nolock) on
					p1.[prop_id] = drpa.[prop_id]
		join dbo.property_val as pv1 with(nolock) on
					pv1.[prop_id] = wpv.[prop_id] and
					pv1.[prop_val_yr] = wpv.[prop_val_yr] and
					pv1.sup_num = wpv.sup_num
		join property_sub_type as pst with(nolock) on
			pst.property_sub_cd = pv1.sub_type
			and pst.imp_leased_land <> 1
		join property_use as pu with(nolock) on
					pu.property_use_cd = pv1.property_use_cd
		where
					pu.dor_use_code in ('83') and
					pv1.[prop_inactive_dt] is null 
					and dataset_id = @dataset_id						


		set @ag_imprv_nonfreeze		= 0

		select
			@ag_imprv_nonfreeze =  sum(
				case
					when drpa.snr_flag = 1
					then  0
					else wpov.imprv_non_hstd_val + wpov.imprv_hstd_val
				end
				)
		from ##dor_report_prop_assoc as drpa with(nolock)
		join wash_prop_owner_val as wpov with(nolock) on
			wpov.year = drpa.prop_val_yr and
			wpov.sup_num = drpa.sup_num and
			wpov.prop_id = drpa.prop_id			
		join dbo.property as p1 with(nolock) on
					p1.[prop_id] = drpa.[prop_id]
		join dbo.property_val as pv1 with(nolock) on
					pv1.[prop_id] = wpov.[prop_id] and
					pv1.[prop_val_yr] = wpov.year and
					pv1.sup_num = wpov.sup_num
		join property_sub_type as pst with(nolock) on
			pst.property_sub_cd = pv1.sub_type
			and pst.imp_leased_land <> 1
		join property_use as pu with(nolock) on
					pu.property_use_cd = pv1.property_use_cd
		where
					pu.dor_use_code in ('83') and
					pv1.[prop_inactive_dt] is null 
					and dataset_id = @dataset_id	
		
	
		set @ag_imprv = isnull(@ag_imprv_freeze, 0) + isnull(@ag_imprv_nonfreeze, 0)
		
										
		
		--OTHER IMPROVEMENT
		set @other_imprv_freeze		= 0
		
		select
			@other_imprv_freeze = sum(
				case
					when drpa.snr_flag = 1
					then  wpov.imprv_non_hstd_val + wpv.snr_imprv_lesser
					else 0
				end
			)
		from ##dor_report_prop_assoc as drpa with(nolock)
		join wash_property_val as wpv with(nolock) on
			wpv.prop_val_yr = drpa.prop_val_yr and
			wpv.sup_num = drpa.sup_num and
			wpv.prop_id = drpa.prop_id
		join wash_prop_owner_val as wpov with(nolock) on
			wpov.year = drpa.prop_val_yr and
			wpov.sup_num = drpa.sup_num and
			wpov.prop_id = drpa.prop_id
		/*
			BEGIN - The page 2 totals must match the page 4 totals,
			therefore we must be certain we use only the same properties,
			i.e. only those with a valid property use code with a valid DOR land use code
		*/
		join property_val as pv with(nolock) on
			pv.prop_val_yr = drpa.prop_val_yr and
			pv.sup_num = drpa.sup_num and
			pv.prop_id = drpa.prop_id
		join property_sub_type as pst with(nolock) on
			pst.property_sub_cd = pv.sub_type
			and pst.imp_leased_land <> 1
		join property_use as pu with(nolock) on
			pu.property_use_cd = pv.property_use_cd
		join dor_land_use_code as dor with(nolock) on
			dor.code = pu.dor_use_code
		/* END - that is the only purpose of these joins */
		where drpa.dataset_id = @dataset_id and drpa.u500_flag = 0
		and pu.dor_use_code not in ('94', '83')
		group by drpa.dataset_id

		set @other_imprv_nonfreeze		= 0
		
		select
			@other_imprv_nonfreeze = sum(
				case
					when drpa.snr_flag = 1
					then  0
					else wpov.imprv_non_hstd_val + wpov.imprv_hstd_val
				end
			)
		from ##dor_report_prop_assoc as drpa with(nolock)
		join wash_property_val as wpv with(nolock) on
			wpv.prop_val_yr = drpa.prop_val_yr and
			wpv.sup_num = drpa.sup_num and
			wpv.prop_id = drpa.prop_id
		join wash_prop_owner_val as wpov with(nolock) on
			wpov.year = drpa.prop_val_yr and
			wpov.sup_num = drpa.sup_num and
			wpov.prop_id = drpa.prop_id
		/*
			BEGIN - The page 2 totals must match the page 4 totals,
			therefore we must be certain we use only the same properties,
			i.e. only those with a valid property use code with a valid DOR land use code
		*/
		join property_val as pv with(nolock) on
			pv.prop_val_yr = drpa.prop_val_yr and
			pv.sup_num = drpa.sup_num and
			pv.prop_id = drpa.prop_id
		join property_sub_type as pst with(nolock) on
			pst.property_sub_cd = pv.sub_type
			and pst.imp_leased_land <> 1
		join property_use as pu with(nolock) on
			pu.property_use_cd = pv.property_use_cd
		join dor_land_use_code as dor with(nolock) on
			dor.code = pu.dor_use_code
		/* END - that is the only purpose of these joins */
		where drpa.dataset_id = @dataset_id and drpa.u500_flag = 0
		and pu.dor_use_code not in ('94', '83')
		group by drpa.dataset_id

		set @other_imprv = isnull(@other_imprv_freeze, 0) + isnull(@other_imprv_nonfreeze, 0) - isnull(@dor_exempt_amount, 0)
		
		
		--OTHER SENIOR
		set @other_senior		= 0
		
		select
			@other_senior = sum(
				isnull(wpv.snr_exempt_loss, 0)
			)
		from ##dor_report_prop_assoc as drpa with(nolock)
		join wash_property_val as wpv with(nolock) on
			wpv.prop_val_yr = drpa.prop_val_yr and
			wpv.sup_num = drpa.sup_num and
			wpv.prop_id = drpa.prop_id
		join wash_prop_owner_val as wpov with(nolock) on
			wpov.year = drpa.prop_val_yr and
			wpov.sup_num = drpa.sup_num and
			wpov.prop_id = drpa.prop_id
		/*
			BEGIN - The page 2 totals must match the page 4 totals,
			therefore we must be certain we use only the same properties,
			i.e. only those with a valid property use code with a valid DOR land use code
		*/
		join property_val as pv with(nolock) on
			pv.prop_val_yr = drpa.prop_val_yr and
			pv.sup_num = drpa.sup_num and
			pv.prop_id = drpa.prop_id
		join property_use as pu with(nolock) on
			pu.property_use_cd = pv.property_use_cd
		join dor_land_use_code as dor with(nolock) on
			dor.code = pu.dor_use_code
		/* END - that is the only purpose of these joins */
		where drpa.dataset_id = @dataset_id and drpa.u500_flag = 0
		and pu.dor_use_code not in ('88', '94', '83', '95') -- THESE CODES ARE HANDLED BY OTHER FIELDS SO SHOULD NOT BE INCLUDED IN THE OTHER CATEGORY
		group by drpa.dataset_id

		--set @other_senior = isnull(@other_senior, 0) NEED TO SUBTRACT DFL SO MOVED LOWER

		
				
		--DFL SENIOR
		set @dfl_senior		= 0
		
		select
			@dfl_senior_adjust = sum(wpv1.snr_exempt_loss),
			@dfl_senior = sum((isnull(pv1.ag_hs_use_val, 0) + isnull(pv1.timber_hs_use_val,0)) * isnull(eqc.percentage,100)) --OVER ()
		from ##dor_report_prop_assoc as drpa with(nolock)
		join dbo.property as p1 with(nolock) on
					p1.[prop_id] = drpa.[prop_id]
		join dbo.property_val as pv1 with(nolock) on
					pv1.[prop_id] = drpa.[prop_id] and
					pv1.[prop_val_yr] = drpa.[prop_val_yr] and
					pv1.[sup_num] = drpa.[sup_num]
		join property_use as pu with(nolock) on
					pu.property_use_cd = pv1.property_use_cd
		join dbo.property_exemption as pe1 with(nolock) on
					pe1.[exmpt_tax_yr] = drpa.[prop_val_yr] and
					pe1.[owner_tax_yr] = drpa.[prop_val_yr] and
					pe1.[prop_id] = drpa.[prop_id] and
					pe1.[sup_num] = pv1.[sup_num]
		left join exmpt_qualify_code as eqc with(nolock) on
					eqc.year = pe1.exmpt_tax_yr and
					eqc.exempt_type_cd = pe1.exmpt_type_cd and
					eqc.income_min <= pv1.income_value and
					eqc.income_max >= pv1.income_value
		join dbo.property_tax_area as pta1 with(nolock) on
					pta1.[prop_id] = drpa.[prop_id] and
					pta1.[year] = drpa.[prop_val_yr] and
					pta1.[sup_num] = pv1.[sup_num]
		join dbo.tax_area as ta1 with(nolock) on
					ta1.[tax_area_id] = pta1.[tax_area_id]
		join dbo.wash_prop_owner_val as wpov1 with(nolock) on
					wpov1.[prop_id] = drpa.[prop_id] and
					wpov1.[year] = drpa.[prop_val_yr] and
					wpov1.[sup_num] = pv1.[sup_num]
		join dbo.wash_property_val as wpv1 with(nolock) on
					wpv1.[prop_id] = drpa.[prop_id] and
					wpv1.[prop_val_yr] = drpa.[prop_val_yr] and
					wpv1.[sup_num] = drpa.[sup_num]
		where
					pe1.[exmpt_type_cd] like '%snr%' and
					pv1.[prop_inactive_dt] is null and
					pu.dor_use_code in ('88')-- and
					and dataset_id = @dataset_id	
			
		set @dfl_senior_levy2		= 0
		
		select
			@dfl_senior_levy2 = sum(isnull(pv1.ag_hs_use_val, 0) + isnull(pv1.timber_hs_use_val,0)) --OVER ()
		from ##dor_report_prop_assoc as drpa with(nolock)
		join dbo.property as p1 with(nolock) on
					p1.[prop_id] = drpa.[prop_id]
		join dbo.property_val as pv1 with(nolock) on
					pv1.[prop_id] = drpa.[prop_id] and
					pv1.[prop_val_yr] = drpa.[prop_val_yr] and
					pv1.[sup_num] = drpa.[sup_num]
		join property_use as pu with(nolock) on
					pu.property_use_cd = pv1.property_use_cd
		join dbo.property_exemption as pe1 with(nolock) on
					pe1.[exmpt_tax_yr] = drpa.[prop_val_yr] and
					pe1.[owner_tax_yr] = drpa.[prop_val_yr] and
					pe1.[prop_id] = drpa.[prop_id] and
					pe1.[sup_num] = pv1.[sup_num]
		join dbo.property_tax_area as pta1 with(nolock) on
					pta1.[prop_id] = drpa.[prop_id] and
					pta1.[year] = drpa.[prop_val_yr] and
					pta1.[sup_num] = pv1.[sup_num]
		join dbo.tax_area as ta1 with(nolock) on
					ta1.[tax_area_id] = pta1.[tax_area_id]
		join dbo.wash_prop_owner_val as wpov1 with(nolock) on
					wpov1.[prop_id] = drpa.[prop_id] and
					wpov1.[year] = drpa.[prop_val_yr] and
					wpov1.[sup_num] = pv1.[sup_num]
		join dbo.wash_property_val as wpv1 with(nolock) on
					wpv1.[prop_id] = drpa.[prop_id] and
					wpv1.[prop_val_yr] = drpa.[prop_val_yr] and
					wpv1.[sup_num] = drpa.[sup_num]
					join (
						select distinct drpa.prop_id, drpa.prop_val_yr, drpa.sup_num
						from ##dor_report_prop_assoc drpa
						join wash_prop_owner_tax_district_assoc wpotda
						on drpa.prop_id = wpotda.prop_id and
						drpa.sup_num = wpotda.sup_num and
						drpa.prop_val_yr = wpotda.year
						join levy l
						on l.tax_district_id = wpotda.tax_district_id
						and l.year = wpotda.year
						join levy_type lt
						on l.levy_type_cd = lt.levy_type_cd and
						lt.levy_part = 2
						where drpa.dataset_id = @dataset_id		
					) LEVY2
					on drpa.prop_id = LEVY2.prop_id and
					drpa.prop_val_yr = LEVY2.prop_val_yr and
					drpa.sup_num = LEVY2.sup_num					
		where
					pe1.[exmpt_type_cd] like '%snr%' and
					pv1.[prop_inactive_dt] is null and
					pu.dor_use_code in ('88')
					and dataset_id = @dataset_id						

		set @dfl_senior = isnull(@dfl_senior, 0)
		set @dfl_senior_levy2 = isnull(@dfl_senior_levy2, 0)	

		set @other_senior = isnull(@other_senior, 0) + isnull(@dfl_senior_adjust,0) - isnull(@dfl_senior,0)
		set @other_senior_levy2 = isnull(@other_senior_levy2, 0) + isnull(@dfl_senior_levy2_adjust,0) - isnull(@dfl_senior_levy2,0)

		

		
		--OPEN SPACE (OSP) SENIOR
		set @osp_senior		= 0
		
		select
			@osp_senior = sum(wpv1.snr_exempt_loss) --OVER ()
		from ##dor_report_prop_assoc as drpa with(nolock)
		join dbo.property as p1 with(nolock) on
					p1.[prop_id] = drpa.[prop_id]
		join dbo.property_val as pv1 with(nolock) on
					pv1.[prop_id] = drpa.[prop_id] and
					pv1.[prop_val_yr] = drpa.[prop_val_yr] and
					pv1.[sup_num] = drpa.[sup_num]
		join property_use as pu with(nolock) on
					pu.property_use_cd = pv1.property_use_cd
		join dbo.property_exemption as pe1 with(nolock) on
					pe1.[exmpt_tax_yr] = drpa.[prop_val_yr] and
					pe1.[owner_tax_yr] = drpa.[prop_val_yr] and
					pe1.[prop_id] = drpa.[prop_id] and
					pe1.[sup_num] = pv1.[sup_num]
		join dbo.property_tax_area as pta1 with(nolock) on
					pta1.[prop_id] = drpa.[prop_id] and
					pta1.[year] = drpa.[prop_val_yr] and
					pta1.[sup_num] = pv1.[sup_num]
		join dbo.tax_area as ta1 with(nolock) on
					ta1.[tax_area_id] = pta1.[tax_area_id]
		join dbo.wash_prop_owner_val as wpov1 with(nolock) on
					wpov1.[prop_id] = drpa.[prop_id] and
					wpov1.[year] = drpa.[prop_val_yr] and
					wpov1.[sup_num] = pv1.[sup_num]
		join dbo.wash_property_val as wpv1 with(nolock) on
					wpv1.[prop_id] = drpa.[prop_id] and
					wpv1.[prop_val_yr] = drpa.[prop_val_yr] and
					wpv1.[sup_num] = drpa.[sup_num]
		where
					pe1.[exmpt_type_cd] like '%snr%' and
					pv1.[prop_inactive_dt] is null and
					pu.dor_use_code in ('94') 
					and dataset_id = @dataset_id	
					
		set @osp_senior_levy2		= 0

		select
			@osp_senior_levy2 = sum(wpv1.snr_taxable_portion) --OVER ()
		from ##dor_report_prop_assoc as drpa with(nolock)
		join dbo.property as p1 with(nolock) on
					p1.[prop_id] = drpa.[prop_id]
		join dbo.property_val as pv1 with(nolock) on
					pv1.[prop_id] = drpa.[prop_id] and
					pv1.[prop_val_yr] = drpa.[prop_val_yr] and
					pv1.[sup_num] = drpa.[sup_num]
		join property_use as pu with(nolock) on
					pu.property_use_cd = pv1.property_use_cd
		join dbo.property_exemption as pe1 with(nolock) on
					pe1.[exmpt_tax_yr] = drpa.[prop_val_yr] and
					pe1.[owner_tax_yr] = drpa.[prop_val_yr] and
					pe1.[prop_id] = drpa.[prop_id] and
					pe1.[sup_num] = pv1.[sup_num]
		join dbo.property_tax_area as pta1 with(nolock) on
					pta1.[prop_id] = drpa.[prop_id] and
					pta1.[year] = drpa.[prop_val_yr] and
					pta1.[sup_num] = pv1.[sup_num]
		join dbo.tax_area as ta1 with(nolock) on
					ta1.[tax_area_id] = pta1.[tax_area_id]
		join dbo.wash_prop_owner_val as wpov1 with(nolock) on
					wpov1.[prop_id] = drpa.[prop_id] and
					wpov1.[year] = drpa.[prop_val_yr] and
					wpov1.[sup_num] = pv1.[sup_num]
		join dbo.wash_property_val as wpv1 with(nolock) on
					wpv1.[prop_id] = drpa.[prop_id] and
					wpv1.[prop_val_yr] = drpa.[prop_val_yr] and
					wpv1.[sup_num] = drpa.[sup_num]
					join (
						select distinct drpa.prop_id, drpa.prop_val_yr, drpa.sup_num
						from ##dor_report_prop_assoc drpa
						join wash_prop_owner_tax_district_assoc wpotda
						on drpa.prop_id = wpotda.prop_id and
						drpa.sup_num = wpotda.sup_num and
						drpa.prop_val_yr = wpotda.year
						join levy l
						on l.tax_district_id = wpotda.tax_district_id
						and l.year = wpotda.year
						join levy_type lt
						on l.levy_type_cd = lt.levy_type_cd and
						lt.levy_part = 2
						where drpa.dataset_id = @dataset_id		
					) LEVY2
					on drpa.prop_id = LEVY2.prop_id and
					drpa.prop_val_yr = LEVY2.prop_val_yr and
					drpa.sup_num = LEVY2.sup_num					
		where
					pe1.[exmpt_type_cd] like '%snr%' and
					pv1.[prop_inactive_dt] is null and
					pu.dor_use_code in ('94') 
					and dataset_id = @dataset_id	

		set @osp_senior = isnull(@osp_senior, 0)
		set @osp_senior_levy2 = isnull(@osp_senior_levy2, 0)	
		
		
		--AG / FARM SENIOR
		set @ag_senior		= 0
		
		select
			@ag_senior = sum(wpv1.snr_exempt_loss) --OVER ()
		from ##dor_report_prop_assoc as drpa with(nolock)
		join dbo.property as p1 with(nolock) on
					p1.[prop_id] = drpa.[prop_id]
		join dbo.property_val as pv1 with(nolock) on
					pv1.[prop_id] = drpa.[prop_id] and
					pv1.[prop_val_yr] = drpa.[prop_val_yr] and
					pv1.[sup_num] = drpa.[sup_num]
		join property_use as pu with(nolock) on
					pu.property_use_cd = pv1.property_use_cd
		join dbo.property_exemption as pe1 with(nolock) on
					pe1.[exmpt_tax_yr] = drpa.[prop_val_yr] and
					pe1.[owner_tax_yr] = drpa.[prop_val_yr] and
					pe1.[prop_id] = drpa.[prop_id] and
					pe1.[sup_num] = pv1.[sup_num]
		join dbo.property_tax_area as pta1 with(nolock) on
					pta1.[prop_id] = drpa.[prop_id] and
					pta1.[year] = drpa.[prop_val_yr] and
					pta1.[sup_num] = pv1.[sup_num]
		join dbo.tax_area as ta1 with(nolock) on
					ta1.[tax_area_id] = pta1.[tax_area_id]
		join dbo.wash_prop_owner_val as wpov1 with(nolock) on
					wpov1.[prop_id] = drpa.[prop_id] and
					wpov1.[year] = drpa.[prop_val_yr] and
					wpov1.[sup_num] = pv1.[sup_num]
		join dbo.wash_property_val as wpv1 with(nolock) on
					wpv1.[prop_id] = drpa.[prop_id] and
					wpv1.[prop_val_yr] = drpa.[prop_val_yr] and
					wpv1.[sup_num] = drpa.[sup_num]
		where
					pe1.[exmpt_type_cd] like '%snr%' and
					pv1.[prop_inactive_dt] is null and
					pu.dor_use_code in ('83')
					and dataset_id = @dataset_id	
				
		set @ag_senior_levy2		= 0
		
		select
			@ag_senior_levy2 = sum(wpv1.snr_taxable_portion) --OVER ()
		from ##dor_report_prop_assoc as drpa with(nolock)
		join dbo.property as p1 with(nolock) on
					p1.[prop_id] = drpa.[prop_id]
		join dbo.property_val as pv1 with(nolock) on
					pv1.[prop_id] = drpa.[prop_id] and
					pv1.[prop_val_yr] = drpa.[prop_val_yr] and
					pv1.[sup_num] = drpa.[sup_num]
		join property_use as pu with(nolock) on
					pu.property_use_cd = pv1.property_use_cd
		join dbo.property_exemption as pe1 with(nolock) on
					pe1.[exmpt_tax_yr] = drpa.[prop_val_yr] and
					pe1.[owner_tax_yr] = drpa.[prop_val_yr] and
					pe1.[prop_id] = drpa.[prop_id] and
					pe1.[sup_num] = pv1.[sup_num]
		join dbo.property_tax_area as pta1 with(nolock) on
					pta1.[prop_id] = drpa.[prop_id] and
					pta1.[year] = drpa.[prop_val_yr] and
					pta1.[sup_num] = pv1.[sup_num]
		join dbo.tax_area as ta1 with(nolock) on
					ta1.[tax_area_id] = pta1.[tax_area_id]
		join dbo.wash_prop_owner_val as wpov1 with(nolock) on
					wpov1.[prop_id] = drpa.[prop_id] and
					wpov1.[year] = drpa.[prop_val_yr] and
					wpov1.[sup_num] = pv1.[sup_num]
		join dbo.wash_property_val as wpv1 with(nolock) on
					wpv1.[prop_id] = drpa.[prop_id] and
					wpv1.[prop_val_yr] = drpa.[prop_val_yr] and
					wpv1.[sup_num] = drpa.[sup_num]
					join (
						select distinct drpa.prop_id, drpa.prop_val_yr, drpa.sup_num
						from ##dor_report_prop_assoc drpa
						join wash_prop_owner_tax_district_assoc wpotda
						on drpa.prop_id = wpotda.prop_id and
						drpa.sup_num = wpotda.sup_num and
						drpa.prop_val_yr = wpotda.year
						join levy l
						on l.tax_district_id = wpotda.tax_district_id
						and l.year = wpotda.year
						join levy_type lt
						on l.levy_type_cd = lt.levy_type_cd and
						lt.levy_part = 2
						where drpa.dataset_id = @dataset_id		
					) LEVY2
					on drpa.prop_id = LEVY2.prop_id and
					drpa.prop_val_yr = LEVY2.prop_val_yr and
					drpa.sup_num = LEVY2.sup_num					
		where
					pe1.[exmpt_type_cd] like '%snr%' and
					pv1.[prop_inactive_dt] is null and
					pu.dor_use_code in ('83')
					and dataset_id = @dataset_id	

		set @ag_senior = isnull(@ag_senior, 0)
		set @ag_senior_levy2 = isnull(@ag_senior_levy2, 0)	
		
		
		
		--TIM SENIOR
		set @tim_senior		= 0
		
		select
			@tim_senior = sum(wpv1.snr_exempt_loss) --OVER ()
		from ##dor_report_prop_assoc as drpa with(nolock)
		join dbo.property as p1 with(nolock) on
					p1.[prop_id] = drpa.[prop_id]
		join dbo.property_val as pv1 with(nolock) on
					pv1.[prop_id] = drpa.[prop_id] and
					pv1.[prop_val_yr] = drpa.[prop_val_yr] and
					pv1.[sup_num] = drpa.[sup_num]
		join property_use as pu with(nolock) on
					pu.property_use_cd = pv1.property_use_cd
		join dbo.property_exemption as pe1 with(nolock) on
					pe1.[exmpt_tax_yr] = drpa.[prop_val_yr] and
					pe1.[owner_tax_yr] = drpa.[prop_val_yr] and
					pe1.[prop_id] = drpa.[prop_id] and
					pe1.[sup_num] = pv1.[sup_num]
		join dbo.property_tax_area as pta1 with(nolock) on
					pta1.[prop_id] = drpa.[prop_id] and
					pta1.[year] = drpa.[prop_val_yr] and
					pta1.[sup_num] = pv1.[sup_num]
		join dbo.tax_area as ta1 with(nolock) on
					ta1.[tax_area_id] = pta1.[tax_area_id]
		join dbo.wash_prop_owner_val as wpov1 with(nolock) on
					wpov1.[prop_id] = drpa.[prop_id] and
					wpov1.[year] = drpa.[prop_val_yr] and
					wpov1.[sup_num] = pv1.[sup_num]
		join dbo.wash_property_val as wpv1 with(nolock) on
					wpv1.[prop_id] = drpa.[prop_id] and
					wpv1.[prop_val_yr] = drpa.[prop_val_yr] and
					wpv1.[sup_num] = drpa.[sup_num]
		where
					pe1.[exmpt_type_cd] like '%snr%' and
					pv1.[prop_inactive_dt] is null and
					pu.dor_use_code in ('95') 
					and dataset_id = @dataset_id	
				
		set @tim_senior_levy2		= 0
		
		select
			@tim_senior_levy2 = sum(wpv1.snr_taxable_portion) --OVER ()
		from ##dor_report_prop_assoc as drpa with(nolock)
		join dbo.property as p1 with(nolock) on
					p1.[prop_id] = drpa.[prop_id]
		join dbo.property_val as pv1 with(nolock) on
					pv1.[prop_id] = drpa.[prop_id] and
					pv1.[prop_val_yr] = drpa.[prop_val_yr] and
					pv1.[sup_num] = drpa.[sup_num]
		join property_use as pu with(nolock) on
					pu.property_use_cd = pv1.property_use_cd
		join dbo.property_exemption as pe1 with(nolock) on
					pe1.[exmpt_tax_yr] = drpa.[prop_val_yr] and
					pe1.[owner_tax_yr] = drpa.[prop_val_yr] and
					pe1.[prop_id] = drpa.[prop_id] and
					pe1.[sup_num] = pv1.[sup_num]
		join dbo.property_tax_area as pta1 with(nolock) on
					pta1.[prop_id] = drpa.[prop_id] and
					pta1.[year] = drpa.[prop_val_yr] and
					pta1.[sup_num] = pv1.[sup_num]
		join dbo.tax_area as ta1 with(nolock) on
					ta1.[tax_area_id] = pta1.[tax_area_id]
		join dbo.wash_prop_owner_val as wpov1 with(nolock) on
					wpov1.[prop_id] = drpa.[prop_id] and
					wpov1.[year] = drpa.[prop_val_yr] and
					wpov1.[sup_num] = pv1.[sup_num]
		join dbo.wash_property_val as wpv1 with(nolock) on
					wpv1.[prop_id] = drpa.[prop_id] and
					wpv1.[prop_val_yr] = drpa.[prop_val_yr] and
					wpv1.[sup_num] = drpa.[sup_num]
					join (
						select distinct drpa.prop_id, drpa.prop_val_yr, drpa.sup_num
						from ##dor_report_prop_assoc drpa
						join wash_prop_owner_tax_district_assoc wpotda
						on drpa.prop_id = wpotda.prop_id and
						drpa.sup_num = wpotda.sup_num and
						drpa.prop_val_yr = wpotda.year
						join levy l
						on l.tax_district_id = wpotda.tax_district_id
						and l.year = wpotda.year
						join levy_type lt
						on l.levy_type_cd = lt.levy_type_cd and
						lt.levy_part = 2
						where drpa.dataset_id = @dataset_id		
					) LEVY2
					on drpa.prop_id = LEVY2.prop_id and
					drpa.prop_val_yr = LEVY2.prop_val_yr and
					drpa.sup_num = LEVY2.sup_num					
		where
					pe1.[exmpt_type_cd] like '%snr%' and
					--psa1.[owner_tax_yr] = 2006 and
					pv1.[prop_inactive_dt] is null and
					pu.dor_use_code in ('95') 
					--pv1.[sup_num] = 0
					and dataset_id = @dataset_id	

		set @tim_senior = isnull(@tim_senior, 0)
		set @tim_senior_levy2 = isnull(@tim_senior_levy2, 0)								
				
		/*
			Note that:
				total senior is the same as other_senior
				total imprv is the same as other_imprv
			... because we lump all of both into line 6
		*/
		update ##dor_report_real
		set
			other_imprv = @other_imprv,
			other_senior = @other_senior * -1,

--			dfl_imprv = @dfl_imprv,
--			dfl_imprv_levy2 = @dfl_imprv,
			osp_imprv = @osp_imprv,
--			osp_imprv_levy2 = @osp_imprv,
			ag_imprv = @ag_imprv,
--			ag_imprv_levy2 = @ag_imprv,
--			tim_imprv = @tim_imprv,
--			tim_imprv_levy2 = @tim_imprv,
			dfl_senior = @dfl_senior,
			dfl_senior_levy2 = @dfl_senior_levy2,
			osp_senior = @osp_senior,
			osp_senior_levy2 = @osp_senior_levy2,
			ag_senior = @ag_senior,
			ag_senior_levy2 = @ag_senior_levy2,
			tim_senior = @tim_senior,
			tim_senior_levy2 = @tim_senior_levy2,
			total_imprv =  @osp_imprv + @ag_imprv + @other_imprv,
			total_senior = (@dfl_senior + @osp_senior + @ag_senior + case when combine_DFL_timber_values = 1 then 0 else @tim_senior end + @other_senior) * -1			
		where dataset_id = @dataset_id
		
		
		set @other_imprv_levy2		= 0
	
		select
			@other_imprv_levy2 = sum(
				case
					when drpa.snr_flag = 1
					then wpov.imprv_non_hstd_val + wpv.snr_imprv_lesser
					else wpov.imprv_non_hstd_val + wpov.imprv_hstd_val
				end
			)
		from ##dor_report_prop_assoc as drpa with(nolock)
		join wash_property_val as wpv with(nolock) on
			wpv.prop_val_yr = drpa.prop_val_yr and
			wpv.sup_num = drpa.sup_num and
			wpv.prop_id = drpa.prop_id
		join wash_prop_owner_val as wpov with(nolock) on
			wpov.year = drpa.prop_val_yr and
			wpov.sup_num = drpa.sup_num and
			wpov.prop_id = drpa.prop_id
		/*
			BEGIN - The page 2 totals must match the page 4 totals,
			therefore we must be certain we use only the same properties,
			i.e. only those with a valid property use code with a valid DOR land use code
		*/
		join property_val as pv with(nolock) on
			pv.prop_val_yr = drpa.prop_val_yr and
			pv.sup_num = drpa.sup_num and
			pv.prop_id = drpa.prop_id
		join property_use as pu with(nolock) on
			pu.property_use_cd = pv.property_use_cd
		join dor_land_use_code as dor with(nolock) on
			dor.code = pu.dor_use_code
		/* END - that is the only purpose of these joins */
					join (
						select distinct drpa.prop_id, drpa.prop_val_yr, drpa.sup_num
						from ##dor_report_prop_assoc drpa
						join wash_prop_owner_tax_district_assoc wpotda
						on drpa.prop_id = wpotda.prop_id and
						drpa.sup_num = wpotda.sup_num and
						drpa.prop_val_yr = wpotda.year
						join levy l
						on l.tax_district_id = wpotda.tax_district_id
						and l.year = wpotda.year
						join levy_type lt
						on l.levy_type_cd = lt.levy_type_cd and
						lt.levy_part = 2
						where drpa.dataset_id = @dataset_id		
					) LEVY2
					on drpa.prop_id = LEVY2.prop_id and
					drpa.prop_val_yr = LEVY2.prop_val_yr and
					drpa.sup_num = LEVY2.sup_num		
		where drpa.dataset_id = @dataset_id and drpa.u500_flag = 0
		group by drpa.dataset_id



		

		set @other_imprv_levy2 = isnull(@other_imprv_levy2, 0)






		set @other_senior_levy2		= 0
	
		select
			@other_senior_levy2 = 
			sum(
				isnull(wpv.snr_taxable_portion, 0)
			)
		from ##dor_report_prop_assoc as drpa with(nolock)
		join wash_property_val as wpv with(nolock) on
			wpv.prop_val_yr = drpa.prop_val_yr and
			wpv.sup_num = drpa.sup_num and
			wpv.prop_id = drpa.prop_id
		join wash_prop_owner_val as wpov with(nolock) on
			wpov.year = drpa.prop_val_yr and
			wpov.sup_num = drpa.sup_num and
			wpov.prop_id = drpa.prop_id
		/*
			BEGIN - The page 2 totals must match the page 4 totals,
			therefore we must be certain we use only the same properties,
			i.e. only those with a valid property use code with a valid DOR land use code
		*/
		join property_val as pv with(nolock) on
			pv.prop_val_yr = drpa.prop_val_yr and
			pv.sup_num = drpa.sup_num and
			pv.prop_id = drpa.prop_id
		join property_use as pu with(nolock) on
			pu.property_use_cd = pv.property_use_cd
		join dor_land_use_code as dor with(nolock) on
			dor.code = pu.dor_use_code
		/* END - that is the only purpose of these joins */
					join (
						select distinct drpa.prop_id, drpa.prop_val_yr, drpa.sup_num
						from ##dor_report_prop_assoc drpa
						join wash_prop_owner_tax_district_assoc wpotda
						on drpa.prop_id = wpotda.prop_id and
						drpa.sup_num = wpotda.sup_num and
						drpa.prop_val_yr = wpotda.year
						join levy l
						on l.tax_district_id = wpotda.tax_district_id
						and l.year = wpotda.year
						join levy_type lt
						on l.levy_type_cd = lt.levy_type_cd and
						lt.levy_part = 2
						--where drpa.dataset_id = @dataset_id		
					) LEVY2
					on drpa.prop_id = LEVY2.prop_id and
					drpa.prop_val_yr = LEVY2.prop_val_yr and
					drpa.sup_num = LEVY2.sup_num		
		where drpa.dataset_id = @dataset_id and drpa.u500_flag = 0
		and pu.dor_use_code not in ('88', '94', '83', '95') -- THESE CODES ARE HANDLED BY OTHER FIELDS SO SHOULD NOT BE INCLUDED IN THE OTHER CATEGORY
		group by drpa.dataset_id

		set @other_senior_levy2 = isnull(@other_senior_levy2, 0)


		/*
			Note that:
				total senior is the same as other_senior
				total imprv is the same as other_imprv
			... because we lump all of both into line 6
		*/
		update ##dor_report_real
		set
			other_imprv_levy2 = @other_imprv_levy2,
			total_imprv_levy2 = @other_imprv_levy2,
			other_senior_levy2 = @other_senior_levy2 * -1
		where dataset_id = @dataset_id

		update ##dor_report_real
		set
			total_senior_levy2 = (@dfl_senior_levy2 + @osp_senior_levy2 + @ag_senior_levy2 + case when combine_DFL_timber_values = 1 then 0 else @tim_senior_levy2 end + @other_senior_levy2) * -1
		where dataset_id = @dataset_id
		
		
		if (@Assess_Using_GEO_ID = 1) begin	
			declare @reduce_dfl_acres int
			declare @reduce_osp_acres int
			declare @reduce_tim_acres int
			declare @reduce_ag_acres int

			select @reduce_dfl_acres = sum(acres_remove) from (
				select  size_acres * (count(size_acres)-1) acres_remove from  ##dor_report_prop_assoc as drpa with(nolock) 
				inner join land_detail ld with(nolock) on
					ld.prop_val_yr = drpa.prop_val_yr and
					ld.sup_num = drpa.sup_num and
					ld.prop_id = drpa.prop_id		
				inner join property p on
							p.prop_id = ld.prop_id
							and ld.sale_id = 0
				left outer join ag_use as au with(nolock) on
					ld.ag_use_cd = au.ag_use_cd							
				where 	ld.ag_apply = 'T'
				and ld.prop_val_yr = @year	
				and  au.dfl = 1	
				group by size_acres, p.geo_id,   drpa.prop_val_yr, ag_apply
				having 
				 count(size_acres) > 1		
			 ) WORKING		
			 
			select @reduce_osp_acres = sum(acres_remove) from (
				select  size_acres * (count(size_acres)-1) acres_remove from  ##dor_report_prop_assoc as drpa with(nolock) 
				inner join land_detail ld with(nolock) on
					ld.prop_val_yr = drpa.prop_val_yr and
					ld.sup_num = drpa.sup_num and
					ld.prop_id = drpa.prop_id		
				inner join property p on
							p.prop_id = ld.prop_id
							and ld.sale_id = 0
				left outer join ag_use as au with(nolock) on
					ld.ag_use_cd = au.ag_use_cd							
				where 	ld.ag_apply = 'T'
				and ld.prop_val_yr = @year	
				and  au.osp = 1	
				group by size_acres, p.geo_id,   drpa.prop_val_yr, ag_apply
				having 
				 count(size_acres) > 1		
			 ) WORKING				 					

			select @reduce_tim_acres = sum(acres_remove) from (
				select  size_acres * (count(size_acres)-1) acres_remove from  ##dor_report_prop_assoc as drpa with(nolock) 
				inner join land_detail ld with(nolock) on
					ld.prop_val_yr = drpa.prop_val_yr and
					ld.sup_num = drpa.sup_num and
					ld.prop_id = drpa.prop_id		
				inner join property p on
							p.prop_id = ld.prop_id
							and ld.sale_id = 0
				left outer join ag_use as au with(nolock) on
					ld.ag_use_cd = au.ag_use_cd							
				where 	ld.ag_apply = 'T'
				and ld.prop_val_yr = @year	
				and  au.timber = 1	
				group by size_acres, p.geo_id,   drpa.prop_val_yr, ag_apply
				having 
				 count(size_acres) > 1		
			 ) WORKING	
			 
			select @reduce_ag_acres = sum(acres_remove) from (
				select  size_acres * (count(size_acres)-1) acres_remove from  ##dor_report_prop_assoc as drpa with(nolock) 
				inner join land_detail ld with(nolock) on
					ld.prop_val_yr = drpa.prop_val_yr and
					ld.sup_num = drpa.sup_num and
					ld.prop_id = drpa.prop_id		
				inner join property p on
							p.prop_id = ld.prop_id
							and ld.sale_id = 0
				left outer join ag_use as au with(nolock) on
					ld.ag_use_cd = au.ag_use_cd							
				where 	ld.ag_apply = 'T'
				and ld.prop_val_yr = @year	
				and  au.ag = 1	
				group by size_acres, p.geo_id,   drpa.prop_val_yr, ag_apply
				having 
				 count(size_acres) > 1		
			 ) WORKING		
			 
			 
			update ##dor_report_real
			set
				dfl_acres = dfl_acres - isnull(@reduce_dfl_acres,0),
				osp_acres = osp_acres - isnull(@reduce_osp_acres,0),
				tim_acres = tim_acres - isnull(@reduce_tim_acres,0),
				ag_acres = ag_acres - isnull( @reduce_ag_acres,0)
			where dataset_id = @dataset_id 			 		 										
			
		end		

		---- if combine DFL and Timer values
		if @combine_DFL_timber_values = '1'
		BEGIN	
			update ##dor_report_real
			set
				dfl_acres = dfl_acres + tim_acres,
				dfl_market_land = dfl_market_land + tim_land,
				dfl_market_land_levy2 = dfl_market_land_levy2 + tim_land_levy2
			where dataset_id = @dataset_id 
			 
			update ##dor_report_real
			set
				tim_acres = 0,
				tim_land = 0,
				tim_market_land = 0,   ------ not used in this sql procedure, item 10 on report
				tim_land_levy2 = 0
			where dataset_id = @dataset_id		
		END
			   
		-- Totals

		update ##dor_report_real
		set
			other_total = other_imprv + other_land + other_senior - isnull(@dor_exempt_amount,0),
			total_land = other_land + dfl_market_land + osp_land + ag_land + tim_land,

			total_total =
				other_imprv + other_land + other_senior +
				dfl_market_land + osp_land + ag_land + tim_land,
				
			other_total_levy2 = other_imprv + other_land + other_senior_levy2, -- row should add up: Land + Imp - Exempt
			total_land_levy2 = other_land_levy2 + dfl_market_land_levy2 + osp_land_levy2 + ag_land_levy2 + tim_land_levy2,

			total_total_levy2 =
				other_imprv + other_land + other_senior_levy2 +
				dfl_market_land_levy2 + osp_land_levy2 + ag_land_levy2 + tim_land_levy2
				

		where dataset_id = @dataset_id


	
	
		-------------------------------------------------------------------------------
		-- END PAGE 2
		-------------------------------------------------------------------------------


		-------------------------------------------------------------------------------
		-- BEGIN PAGE 4
		-------------------------------------------------------------------------------

		select
			@single_family_count	= count(distinct drpa.geo_id),		
			@single_family_land		= sum(case
											when drpa.snr_flag = 1
											then wpov.land_non_hstd_val + wpov.ag_use_val + wpv.snr_land_lesser
											else wpov.land_hstd_val + wpov.land_non_hstd_val + wpov.ag_use_val + wpov.ag_hs_use_val
										end	),
			@single_family_imprv	= sum(case
											when drpa.snr_flag = 1
											then wpov.imprv_non_hstd_val + wpv.snr_imprv_lesser
											else wpov.imprv_hstd_val + wpov.imprv_non_hstd_val
										end),
			@single_family_exempt	= sum(wpv.snr_exempt_loss)
		from ##dor_report_prop_assoc as drpa with(nolock)
		join property as p with(nolock) on
			p.geo_id = drpa.geo_id and
			p.prop_id = drpa.prop_id and
			p.prop_type_cd in ('R','MH')
		join property_val as pv with(nolock) on
			pv.prop_val_yr = drpa.prop_val_yr and
			pv.sup_num = drpa.sup_num and
			pv.prop_id = p.prop_id and
			pv.prop_inactive_dt is null	
		join property_sub_type as pst with(nolock) on
			pst.property_sub_cd = pv.sub_type
			and pst.imp_leased_land <> 1			
		join property_use as pu with(nolock) on
			pu.property_use_cd = pv.property_use_cd
		join dor_land_use_code as dor with(nolock) on
			dor.code = pu.dor_use_code
		join wash_prop_owner_val as wpov with(nolock) on
			wpov.year = pv.prop_val_yr and
			wpov.sup_num = pv.sup_num and
			wpov.prop_id = pv.prop_id
		join wash_property_val as wpv with(nolock) on
			wpv.prop_val_yr = pv.prop_val_yr and
			wpv.sup_num = pv.sup_num and
			wpv.prop_id = pv.prop_id
		where  drpa.dataset_id = @dataset_id and 
			drpa.u500_flag = 0 
			and dor.dor_report_category = 'SFR'
		
		select
			@multi_family_count	= count(distinct drpa.geo_id),		
			@multi_family_land		= sum(case
											when drpa.snr_flag = 1
											then wpov.land_non_hstd_val + wpov.ag_use_val + wpv.snr_land_lesser
											else wpov.land_hstd_val + wpov.land_non_hstd_val + wpov.ag_use_val + wpov.ag_hs_use_val
										end	),
			@multi_family_imprv	= sum(case
											when drpa.snr_flag = 1
											then wpov.imprv_non_hstd_val + wpv.snr_imprv_lesser
											else wpov.imprv_hstd_val + wpov.imprv_non_hstd_val
										end),
			@multi_family_exempt	= sum(wpv.snr_exempt_loss)
		from ##dor_report_prop_assoc as drpa with(nolock)
		join property as p with(nolock) on
			p.geo_id = drpa.geo_id and
			p.prop_id = drpa.prop_id and
			p.prop_type_cd in ('R','MH')
		join property_val as pv with(nolock) on
			pv.prop_val_yr = drpa.prop_val_yr and
			pv.sup_num = drpa.sup_num and
			pv.prop_id = p.prop_id and
			pv.prop_inactive_dt is null
		join property_sub_type as pst with(nolock) on
			pst.property_sub_cd = pv.sub_type
			and pst.imp_leased_land <> 1			
		join property_use as pu with(nolock) on
			pu.property_use_cd = pv.property_use_cd
		join dor_land_use_code as dor with(nolock) on
			dor.code = pu.dor_use_code
		join wash_prop_owner_val as wpov with(nolock) on
			wpov.year = pv.prop_val_yr and
			wpov.sup_num = pv.sup_num and
			wpov.prop_id = pv.prop_id
		join wash_property_val as wpv with(nolock) on
			wpv.prop_val_yr = pv.prop_val_yr and
			wpv.sup_num = pv.sup_num and
			wpv.prop_id = pv.prop_id
		where  drpa.dataset_id = @dataset_id and drpa.u500_flag = 0 and dor.dor_report_category = 'MFR'	
		
		select
			@manufacturing_count	= count(distinct drpa.geo_id),		
			@manufacturing_land		= sum(case
											when drpa.snr_flag = 1
											then wpov.land_non_hstd_val + wpov.ag_use_val + wpv.snr_land_lesser
											else wpov.land_hstd_val + wpov.land_non_hstd_val + wpov.ag_use_val + wpov.ag_hs_use_val
										end	),
			@manufacturing_imprv	= sum(case
											when drpa.snr_flag = 1
											then wpov.imprv_non_hstd_val + wpv.snr_imprv_lesser
											else wpov.imprv_hstd_val + wpov.imprv_non_hstd_val
										end),
			@manufacturing_exempt	= sum(wpv.snr_exempt_loss)
		from ##dor_report_prop_assoc as drpa with(nolock)
		join property as p with(nolock) on
			p.geo_id = drpa.geo_id and
			p.prop_id = drpa.prop_id and
			p.prop_type_cd in ('R','MH')
		join property_val as pv with(nolock) on
			pv.prop_val_yr = drpa.prop_val_yr and
			pv.sup_num = drpa.sup_num and
			pv.prop_id = p.prop_id and
			pv.prop_inactive_dt is null	
		join property_sub_type as pst with(nolock) on
			pst.property_sub_cd = pv.sub_type
			and pst.imp_leased_land <> 1			
		join property_use as pu with(nolock) on
			pu.property_use_cd = pv.property_use_cd
		join dor_land_use_code as dor with(nolock) on
			dor.code = pu.dor_use_code
		join wash_prop_owner_val as wpov with(nolock) on
			wpov.year = pv.prop_val_yr and
			wpov.sup_num = pv.sup_num and
			wpov.prop_id = pv.prop_id
		join wash_property_val as wpv with(nolock) on
			wpv.prop_val_yr = pv.prop_val_yr and
			wpv.sup_num = pv.sup_num and
			wpv.prop_id = pv.prop_id
		where  drpa.dataset_id = @dataset_id and drpa.u500_flag = 0 and dor.dor_report_category = 'MAN'	
		
		select
			@commercial_count	= count(distinct drpa.geo_id),		
			@commercial_land		= sum(case
											when drpa.snr_flag = 1
											then wpov.land_non_hstd_val + wpov.ag_use_val + wpv.snr_land_lesser
											else wpov.land_hstd_val + wpov.land_non_hstd_val + wpov.ag_use_val + wpov.ag_hs_use_val
										end	),
			@commercial_imprv	= sum(case
											when drpa.snr_flag = 1
											then wpov.imprv_non_hstd_val + wpv.snr_imprv_lesser
											else wpov.imprv_hstd_val + wpov.imprv_non_hstd_val
										end),
			@commercial_exempt	= sum(wpv.snr_exempt_loss)
		from ##dor_report_prop_assoc as drpa with(nolock)
		join property as p with(nolock) on
			p.geo_id = drpa.geo_id and
			p.prop_id = drpa.prop_id and
			p.prop_type_cd in ('R','MH')
		join property_val as pv with(nolock) on
			pv.prop_val_yr = drpa.prop_val_yr and
			pv.sup_num = drpa.sup_num and
			pv.prop_id = p.prop_id and
			pv.prop_inactive_dt is null		
		join property_sub_type as pst with(nolock) on
			pst.property_sub_cd = pv.sub_type
			and pst.imp_leased_land <> 1			
		join property_use as pu with(nolock) on
			pu.property_use_cd = pv.property_use_cd
		join dor_land_use_code as dor with(nolock) on
			dor.code = pu.dor_use_code
		join wash_prop_owner_val as wpov with(nolock) on
			wpov.year = pv.prop_val_yr and
			wpov.sup_num = pv.sup_num and
			wpov.prop_id = pv.prop_id
		join wash_property_val as wpv with(nolock) on
			wpv.prop_val_yr = pv.prop_val_yr and
			wpv.sup_num = pv.sup_num and
			wpv.prop_id = pv.prop_id
		where  drpa.dataset_id = @dataset_id and drpa.u500_flag = 0 and dor.dor_report_category = 'COM'	
		
		select
			@ag_real_count	= count(distinct drpa.geo_id),		
			@ag_real_land		= sum(case
											when drpa.snr_flag = 1
											then wpov.land_non_hstd_val + wpov.ag_use_val + wpv.snr_land_lesser
											else wpov.land_hstd_val + wpov.land_non_hstd_val + wpov.ag_use_val + wpov.ag_hs_use_val
										end	),
			@ag_real_imprv	= sum(case
											when drpa.snr_flag = 1
											then wpov.imprv_non_hstd_val + wpv.snr_imprv_lesser
											else wpov.imprv_hstd_val + wpov.imprv_non_hstd_val
										end),
			@ag_real_exempt	= sum(wpv.snr_exempt_loss)
		from ##dor_report_prop_assoc as drpa with(nolock)
		join property as p with(nolock) on
			p.geo_id = drpa.geo_id and
			p.prop_id = drpa.prop_id and
			p.prop_type_cd in ('R','MH')
		join property_val as pv with(nolock) on
			pv.prop_val_yr = drpa.prop_val_yr and
			pv.sup_num = drpa.sup_num and
			pv.prop_id = p.prop_id and
			pv.prop_inactive_dt is null			
		join property_use as pu with(nolock) on
			pu.property_use_cd = pv.property_use_cd
		join dor_land_use_code as dor with(nolock) on
			dor.code = pu.dor_use_code
		join wash_prop_owner_val as wpov with(nolock) on
			wpov.year = pv.prop_val_yr and
			wpov.sup_num = pv.sup_num and
			wpov.prop_id = pv.prop_id
		join wash_property_val as wpv with(nolock) on
			wpv.prop_val_yr = pv.prop_val_yr and
			wpv.sup_num = pv.sup_num and
			wpv.prop_id = pv.prop_id
		where  drpa.dataset_id = @dataset_id and drpa.u500_flag = 0 and dor.dor_report_category = 'ANC'
		
		select
			@other_real_count	= count(distinct drpa.geo_id),		
			@other_real_land		= sum(case
											when drpa.snr_flag = 1
											then wpov.land_non_hstd_val + wpov.ag_use_val + wpv.snr_land_lesser
											else wpov.land_hstd_val + wpov.land_non_hstd_val + wpov.ag_use_val + wpov.ag_hs_use_val
										end	),
			@other_real_imprv	= sum(case
											when drpa.snr_flag = 1
											then wpov.imprv_non_hstd_val + wpv.snr_imprv_lesser
											else wpov.imprv_hstd_val + wpov.imprv_non_hstd_val
										end),
			@other_real_exempt	= sum(wpv.snr_exempt_loss)
		from ##dor_report_prop_assoc as drpa with(nolock)
		join property as p with(nolock) on
			p.geo_id = drpa.geo_id and
			p.prop_id = drpa.prop_id and
			p.prop_type_cd in ('R','MH')
		join property_val as pv with(nolock) on
			pv.prop_val_yr = drpa.prop_val_yr and
			pv.sup_num = drpa.sup_num and
			pv.prop_id = p.prop_id and
			pv.prop_inactive_dt is null			
		join property_use as pu with(nolock) on
			pu.property_use_cd = pv.property_use_cd
		join dor_land_use_code as dor with(nolock) on
			dor.code = pu.dor_use_code
		join wash_prop_owner_val as wpov with(nolock) on
			wpov.year = pv.prop_val_yr and
			wpov.sup_num = pv.sup_num and
			wpov.prop_id = pv.prop_id
		join wash_property_val as wpv with(nolock) on
			wpv.prop_val_yr = pv.prop_val_yr and
			wpv.sup_num = pv.sup_num and
			wpv.prop_id = pv.prop_id
		where  drpa.dataset_id = @dataset_id and drpa.u500_flag = 0 and dor.dor_report_category = 'ORP'											
				



		select
			@u500_real_count = count(distinct drpa.geo_id),  -- used prop here instead of geo_id because geo_id can duplicate and this is DISTCINT
			@u500_real_land = sum(
				wpov.land_hstd_val + wpov.land_non_hstd_val + wpov.ag_market + wpov.ag_hs_market
			),
			@u500_real_imprv = sum(
				wpov.imprv_hstd_val + wpov.imprv_non_hstd_val
			)
		from ##dor_report_prop_assoc as drpa with(nolock)
		join property as p with(nolock) on
			p.geo_id = drpa.geo_id and
			p.prop_id = drpa.prop_id and
			p.prop_type_cd in ('R','MH')
		join wash_prop_owner_val as wpov with(nolock) on
			wpov.year = drpa.prop_val_yr and
			wpov.sup_num = drpa.sup_num and
			wpov.prop_id = p.prop_id
		where drpa.dataset_id = @dataset_id and drpa.u500_flag = 1
		
		set @u500_real_exempt = @u500_real_imprv + @u500_real_land
		
		
		--------------------------------
		



		select
			@single_family_exempt_levy2	= sum(
				case when dor.dor_report_category = 'SFR' then wpv.appraised_classified else 0 end
			),


			@multi_family_exempt_levy2	= sum(
				case when dor.dor_report_category = 'MFR' then wpv.appraised_classified else 0 end
			),


			@manufacturing_exempt_levy2	= sum(
				case when dor.dor_report_category = 'MAN' then wpv.appraised_classified else 0 end
			),


			@commercial_exempt_levy2	= sum(
				case when dor.dor_report_category = 'COM' then wpv.appraised_classified else 0 end
			),


			@ag_real_exempt_levy2	= sum(
				case when dor.dor_report_category = 'ANC' then wpv.appraised_classified else 0 end
			),

			@other_real_exempt_levy2	= sum(
				case when dor.dor_report_category = 'ORP' then wpv.appraised_classified else 0 end
			)
		from ##dor_report_prop_assoc as drpa with(nolock)
		join property as p with(nolock) on
			p.geo_id = drpa.geo_id and
			p.prop_id = drpa.prop_id and
			p.prop_type_cd in ('R','MH')
		join property_val as pv with(nolock) on
			pv.prop_val_yr = drpa.prop_val_yr and
			pv.sup_num = drpa.sup_num and
			pv.prop_id = p.prop_id and
			pv.prop_inactive_dt is null			
		join property_use as pu with(nolock) on
			pu.property_use_cd = pv.property_use_cd
		join dor_land_use_code as dor with(nolock) on
			dor.code = pu.dor_use_code
		join wash_prop_owner_val as wpov with(nolock) on
			wpov.year = pv.prop_val_yr and
			wpov.sup_num = pv.sup_num and
			wpov.prop_id = pv.prop_id
		join wash_property_val as wpv with(nolock) on
			wpv.prop_val_yr = pv.prop_val_yr and
			wpv.sup_num = pv.sup_num and
			wpv.prop_id = pv.prop_id
		join (
			select distinct drpa.prop_id, drpa.prop_val_yr, drpa.sup_num
			from ##dor_report_prop_assoc drpa
			join wash_prop_owner_tax_district_assoc wpotda
			on drpa.prop_id = wpotda.prop_id and
			drpa.sup_num = wpotda.sup_num and
			drpa.prop_val_yr = wpotda.year
			join levy l
			on l.tax_district_id = wpotda.tax_district_id
			and l.year = wpotda.year
			join levy_type lt
			on l.levy_type_cd = lt.levy_type_cd and
			lt.levy_part = 2
			where drpa.dataset_id = @dataset_id		
		) LEVY2
			on drpa.prop_id = LEVY2.prop_id and
			drpa.prop_val_yr = LEVY2.prop_val_yr and
			drpa.sup_num = LEVY2.sup_num	
		where  drpa.dataset_id = @dataset_id 
			and drpa.u500_flag = 0
		and exists(
			select 1 from wash_prop_owner_exemption e
			where drpa.prop_id = e.prop_id
			and drpa.prop_val_yr = e.year
			and drpa.sup_num = e.sup_num	
			and e.exmpt_type_cd in ('SNR/DSBL')
		)	
		--------------------------------
		

		insert into ##dor_report_real_by_land_use (
			dataset_id,
			single_family_count, single_family_land, single_family_imprv, single_family_exempt,
			multi_family_count, multi_family_land, multi_family_imprv, multi_family_exempt,
			manufacturing_count, manufacturing_land, manufacturing_imprv, manufacturing_exempt,
			commercial_count, commercial_land, commercial_imprv, commercial_exempt,
			ag_count, ag_land, ag_imprv, ag_exempt,
			other_count, other_land, other_imprv, other_exempt,
			u500_exempt_count, u500_land, u500_imprv, u500_exempt_amount,
			
			single_family_exempt_levy2,
			multi_family_exempt_levy2,
			manufacturing_exempt_levy2,
			commercial_exempt_levy2,
			ag_exempt_levy2,
			other_exempt_levy2,
			u500_exempt_amount_levy2
		
			
		) values (
			@dataset_id,
			isnull(@single_family_count, 0), isnull(@single_family_land, 0), isnull(@single_family_imprv, 0), isnull((@single_family_exempt * -1), 0),
			isnull(@multi_family_count, 0), isnull(@multi_family_land, 0), isnull(@multi_family_imprv, 0), isnull((@multi_family_exempt * -1), 0),
			isnull(@manufacturing_count, 0), isnull(@manufacturing_land, 0), isnull(@manufacturing_imprv, 0), isnull((@manufacturing_exempt * -1), 0),
			isnull(@commercial_count, 0), isnull(@commercial_land, 0), isnull(@commercial_imprv, 0), isnull((@commercial_exempt * -1), 0),
			isnull(@ag_real_count, 0), isnull(@ag_real_land, 0), isnull(@ag_real_imprv, 0), isnull((@ag_real_exempt * -1), 0),
			isnull(@other_real_count, 0), isnull(@other_real_land, 0), isnull(@other_real_imprv, 0), isnull((@other_real_exempt * -1), 0),
			isnull(@u500_real_count, 0), isnull(@u500_real_land, 0), isnull(@u500_real_imprv, 0), isnull(@u500_real_exempt, 0),
			
			isnull((@single_family_exempt_levy2 * -1), 0),
			isnull((@multi_family_exempt_levy2 * -1), 0),
			isnull((@manufacturing_exempt_levy2 * -1), 0),
			isnull((@commercial_exempt_levy2 * -1), 0),
			isnull((@ag_real_exempt_levy2 * -1), 0),
			isnull((@other_real_exempt_levy2 * -1), 0),
			isnull(@u500_real_exempt_levy2, 0)
			
			
			
		)

		-------------------------------------------------------------------------------
		-- END PAGE 4
		-------------------------------------------------------------------------------

		-- TEMPORARY fix
		
		-- ... to page 2 line 6 land value (and adjusting buckets that total it)
		update drr
		set
			drr.other_land =
				isnull(drlu.single_family_land, 0) +
				isnull(drlu.multi_family_land, 0) +
				isnull(drlu.manufacturing_land, 0) +
				isnull(drlu.commercial_land, 0) +
				isnull(drlu.ag_land, 0) +
				isnull(drlu.other_land, 0)
				- isnull(drr.dfl_market_land, 0)
				- isnull(drr.osp_land, 0)
				- isnull(drr.ag_land, 0)
				- isnull(drr.tim_land, 0)
		from ##dor_report_real as drr
		join ##dor_report_real_by_land_use as drlu on
			drlu.dataset_id = drr.dataset_id
		where drr.dataset_id = @dataset_id



		update drr
		set
			drr.other_land_levy2 =
				isnull(drlu.single_family_land, 0) +
				isnull(drlu.multi_family_land, 0) +
				isnull(drlu.manufacturing_land, 0) +
				isnull(drlu.commercial_land, 0) +
				isnull(drlu.ag_land, 0) +
				isnull(drlu.other_land, 0)
				- isnull(drr.dfl_market_land, 0)
				- isnull(drr.osp_land, 0)
				- isnull(drr.ag_land, 0)
				- isnull(drr.tim_land, 0)
		from ##dor_report_real as drr
		join ##dor_report_prop_assoc as drpa on
			drr.dataset_id = drpa.dataset_id
		join ##dor_report_real_by_land_use as drlu on
			drlu.dataset_id = drr.dataset_id
					join (
						select distinct drpa.prop_id, drpa.prop_val_yr, drpa.sup_num
						from ##dor_report_prop_assoc drpa
						join wash_prop_owner_tax_district_assoc wpotda
						on drpa.prop_id = wpotda.prop_id and
						drpa.sup_num = wpotda.sup_num and
						drpa.prop_val_yr = wpotda.year
						join levy l
						on l.tax_district_id = wpotda.tax_district_id
						and l.year = wpotda.year
						join levy_type lt
						on l.levy_type_cd = lt.levy_type_cd and
						lt.levy_part = 2
						where drpa.dataset_id = @dataset_id		
					) LEVY2
					on drpa.prop_id = LEVY2.prop_id and
					drpa.prop_val_yr = LEVY2.prop_val_yr and
					drpa.sup_num = LEVY2.sup_num			
		where drr.dataset_id = @dataset_id	
		
		update ##dor_report_real
		set
			other_total = other_imprv + other_land + other_senior - isnull(@dor_exempt_amount,0),
			total_land = other_land + dfl_market_land + osp_land + ag_land + tim_land,

			total_total =
				other_imprv + other_land + other_senior +
				dfl_market_land + osp_land + ag_land + tim_land,
				
			other_total_levy2 = other_imprv + other_land + other_senior_levy2,
			total_land_levy2 = other_land_levy2 + dfl_market_land_levy2 + osp_land_levy2 + ag_land_levy2 + tim_land_levy2,

			total_total_levy2 =
				other_imprv + other_land + other_senior_levy2 +
				dfl_market_land_levy2 + osp_land_levy2 + ag_land_levy2 + tim_land_levy2				

		where dataset_id = @dataset_id	
	end

GO


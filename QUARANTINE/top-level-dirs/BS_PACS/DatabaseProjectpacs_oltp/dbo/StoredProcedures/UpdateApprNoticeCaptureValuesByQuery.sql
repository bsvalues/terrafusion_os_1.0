
--The query must return prop_id, prop_type_cd

CREATE    procedure UpdateApprNoticeCaptureValuesByQuery
 
@input_yr           int,
@input_pacs_user_id	int,
@input_action		varchar(1)

as
 
--preprocessing: remove any UDI children and deleted properties
--from the set of properties to process
--
-- 2006.07.11 - Jeremy Smith - HS 38689 - only remove these properties when capturing,
-- because if by chance they have already been captured (which has happened), we want to allow them to be uncaptured
if (@input_action = 'C')
begin
	delete from #cap_vals_properties
	where prop_id in
	(
	select tcvp.prop_id from #cap_vals_properties tcvp with (nolock)
	
	inner join property_val pv with (nolock)
	on tcvp.prop_id = pv.prop_id
	
	inner join prop_supp_assoc psa with (nolock)
	on pv.prop_id = psa.prop_id
	and pv.prop_val_yr = psa.owner_tax_yr
	and pv.sup_num = psa.sup_num

	-- remove properties where the year matches, and... from the list
	where pv.prop_val_yr = @input_yr and
	(
		-- it's a non-suspended UDI child
		(pv.UDI_parent_prop_id > -1
		 and isnull(pv.UDI_status, '') <> 'S' )
	
		-- or inactive and not a parent
		or  (not prop_inactive_dt is null
		 and isnull(udi_parent, '') <> 'T' )
	
		-- or a deleted parent
		or  (udi_parent = 'D')
	))

	-- remove properties that have recalc errors from the list
	delete from #cap_vals_properties 
	where prop_id in 
	(select distinct prop_id from prop_recalc_errors with (nolock)
	where sup_yr = @input_yr)

end

-- add back all children of the selected parents

insert into #cap_vals_properties
select pv.prop_id, tcvp.prop_type_cd

from #cap_vals_properties tcvp with (nolock), property_val pv with (nolock) 

inner join prop_supp_assoc psa with (nolock)
on pv.prop_id = psa.prop_id
and pv.prop_val_yr = psa.owner_tax_yr
and pv.sup_num = psa.sup_num

where pv.prop_val_yr = @input_yr
and pv.UDI_parent_prop_id = tcvp.prop_id
and isnull(pv.UDI_status, '') <> 'S'
and pv.prop_inactive_dt is null 

-- 
/* capture the values */
if (@input_action = 'C')
begin
 
			--if object_id('tempdb..#tempUpdateApprNCVByQuery') is not null
			--begin
			--	drop table #tempUpdateApprNCVByQuery
			--end
			--
			--select tcvp.prop_id, tcvp.prop_type_cd into #tempUpdateApprNCVByQuery
			--from #cap_vals_properties   tcvp with(nolock)
			--inner join prelim_property  prp with(nolock) on
			--	tcvp.prop_id = prp.prop_id
			 

 
			/* clear out tables first */
			delete from prelim_prop_owner_entity_val    
			from #cap_vals_properties TT
			where TT.prop_id = prelim_prop_owner_entity_val.prop_id  
		
			delete from prelim_property_entity_exemption
			from #cap_vals_properties TT
			where TT.prop_id = prelim_property_entity_exemption.prop_id 
			
			delete from prelim_property_owner_entity_state_cd
			from #cap_vals_properties TT
			where TT.prop_id = prelim_property_owner_entity_state_cd.prop_id 
		 
			delete from prelim_property_owner_entity_cad_state_cd
			from #cap_vals_properties TT
			where TT.prop_id = prelim_property_owner_entity_cad_state_cd.prop_id 
			
			delete from prelim_entity_prop_assoc
			from #cap_vals_properties TT
			where TT.prop_id = prelim_entity_prop_assoc.prop_id 
			
			delete from prelim_property_freeze
			from #cap_vals_properties TT
			where TT.prop_id = prelim_property_freeze.prop_id 
			
			delete from prelim_property_exemption
			from #cap_vals_properties TT
			where TT.prop_id = prelim_property_exemption.prop_id 
			
			delete from prelim_owner
			from #cap_vals_properties TT
			where TT.prop_id = prelim_owner.prop_id 
			
			delete from prelim_property_val
			from #cap_vals_properties TT
			where TT.prop_id = prelim_property_val.prop_id 
			
			delete from prelim_property
			from #cap_vals_properties TT
			where TT.prop_id = prelim_property.prop_id

	 	--Must delete the temp table
		--if object_id('tempdb..#tempUpdateApprNCVByQuery') is not null
		--begin
		--	drop table #tempUpdateApprNCVByQuery
		--end
			
						 
			/* insert into prelim tables */ 
			insert into prelim_property
			(
				prop_id,
				prop_type_cd, 
				prop_create_dt, 
				ref_id1,    
				ref_id2,    
				geo_id,
				ams_load_dt,    
				prop_cmnt,   
				prop_sic_cd, 
				dba_name,   
				alt_dba_name,    
				exmpt_reset, 
				gpm_irrig,   
				utilities,  
				topography, 
				road_access,
				other, 
				zoning,
				remarks,
				state_cd, 
				mass_created_from 
			)
			select 
				property.prop_id,
				property.prop_type_cd, 
				property.prop_create_dt, 
				property.ref_id1,    
				property.ref_id2,    
				property.geo_id,
				property.ams_load_dt,    
				property.prop_cmnt,   
				property.prop_sic_cd, 
				property.dba_name,   
				property.alt_dba_name,    
				property.exmpt_reset, 
				property.gpm_irrig,   
				property.utilities,  
				property.topography, 
				property.road_access,
				property.other, 
				property.zoning,
				property.remarks,
				property.state_cd, 
				property.mass_created_from 
			from
				property  with(nolock)
				INNER JOIN #cap_vals_properties as tcvp with(nolock) ON
					property.prop_id      = tcvp.prop_id
			  
			insert into prelim_property_val
			(
				prop_id    , 
				prop_val_yr ,
				prop_val   , 
				chg_dt    ,
				notice_mail_dt   ,   
				land_hstd_val   , 
				land_non_hstd_val ,
				imprv_hstd_val   ,
				imprv_non_hstd_val ,
				appraised_val  ,  
				assessed_val    , 
				market   ,   
				ag_use_val    ,   
				ag_market,   
				freeze_ceiling ,  
				freeze_yr ,
				ag_loss  ,   
				ag_late_loss   ,  
				timber_78,   
				timber_market  ,  
				timber_use,  
				timber_loss, 
				timber_late_loss ,
				rendered_val  ,   
				rendered_yr ,
				new_val,
				new_yr ,
				mineral_int_pct ,
				orig_appraised_val ,
				ten_percent_cap  ,
				sup_num,
				legal_desc, 
				legal_desc_2   , 
				abated_pct ,
				abated_amt,  
				abated_yr ,
				eff_size_acres   ,
				shared_prop_val  ,
				shared_prop_cad_code, 
				legal_acreage    ,
				vit_flag ,
				recalc_flag, 
				vit_declaration_filed_dt, 
				prev_sup_num ,
				sup_cd,
				sup_desc    ,
				sup_dt  ,  
				sup_action ,
				appr_company_id, 
				prop_inactive_dt,    
				hscap_qualify_yr ,
				hscap_override_prevhsval_flag, 
				hscap_prevhsval  ,
				hscap_prevhsval_pacsuser, 
				hscap_prevhsval_comment  , 
				hscap_prevhsval_date ,    
				hscap_override_newhsval_flag ,
				hscap_newhsval   ,
				hscap_newhsval_pacsuser, 
				hscap_newhsval_comment  ,  
				hscap_newhsval_date ,
				last_appraisal_yr ,
				oil_wells   ,
				irr_wells   ,
				irr_acres   ,
				irr_capacity,
				oil_wells_apply_adjust ,
				tif_imprv_val    ,
				tif_land_val,
				tif_flag ,
				accept_create_id, 
				accept_create_dt ,   
				abs_subdv_cd ,
				hood_cd    ,
				block  ,    
				tract_or_lot ,   
				mbl_hm_park   ,  
				mbl_hm_space   , 
				rgn_cd ,
				subset_cd, 
				map_id    , 
				auto_build_legal, 
				image_path  ,    
				hscap_prev_reappr_yr, 
				hscap_base_yr ,
				hscap_base_yr_override, 
				hscap_base_yr_pacsuser ,
				hscap_base_yr_comment   ,  
				hscap_base_yr_date,
				next_appraiser_id,
				last_appraiser_id,
				next_appraisal_dt,
				last_appraisal_dt,
				next_appraisal_rsn,
				mapsco,
				value_appraiser_id,
				land_appraiser_id,
				cost_value,
				income_value,
				shared_value,
				appr_method,
				cost_land_hstd_val,
				cost_land_non_hstd_val,
				cost_imprv_hstd_val,
				cost_imprv_non_hstd_val,
				cost_market,
				cost_ag_use_val,
				cost_ag_market,
				cost_ag_loss,
				cost_timber_market,
				cost_timber_use,
				cost_timber_loss,
				income_land_hstd_val,
				income_land_non_hstd_val,
				income_imprv_hstd_val,
				income_imprv_non_hstd_val,
				income_market,
				income_ag_use_val,
				income_ag_market,
				income_ag_loss,
				income_timber_use,
				income_timber_loss,
				shared_land_hstd_val,
				shared_land_non_hstd_val,
				shared_imprv_hstd_val,
				shared_imprv_non_hstd_val,
				shared_market,
				shared_ag_use_val,
				shared_ag_market,
				shared_ag_loss,
				shared_timber_market,
				shared_timber_use,
				shared_timber_loss,
				shared_other_val,
				sub_type  
			)
			select
				property_val.prop_id    , 
				property_val.prop_val_yr ,
				property_val.prop_val   , 
				property_val.chg_dt    ,
				property_val.notice_mail_dt   ,   
				property_val.land_hstd_val   , 
				property_val.land_non_hstd_val ,
				property_val.imprv_hstd_val   ,
				property_val.imprv_non_hstd_val ,
				property_val.appraised_val  ,  
				property_val.assessed_val    , 
				property_val.market   ,   
				property_val.ag_use_val    ,   
				property_val.ag_market,   
				property_val.freeze_ceiling ,  
				property_val.freeze_yr ,
				property_val.ag_loss  ,   
				property_val.ag_late_loss   ,  
				property_val.timber_78,   
				property_val.timber_market  ,  
				property_val.timber_use,  
				property_val.timber_loss, 
				property_val.timber_late_loss ,
				property_val.rendered_val  ,   
				property_val.rendered_yr ,
				property_val.new_val,
				property_val.new_yr ,
				property_val.mineral_int_pct ,
				property_val.orig_appraised_val ,
				property_val.ten_percent_cap  ,
				property_val.sup_num,
				property_val.legal_desc, 
				property_val.legal_desc_2   , 
				property_val.abated_pct ,
				property_val.abated_amt,  
				property_val.abated_yr ,
				property_val.eff_size_acres   ,
				property_val.shared_prop_val  ,
				property_val.shared_prop_cad_code, 
				property_val.legal_acreage    ,
				property_val.vit_flag ,
				property_val.recalc_flag, 
				property_val.vit_declaration_filed_dt, 
				property_val.prev_sup_num ,
				property_val.sup_cd,
				property_val.sup_desc    ,
				property_val.sup_dt  ,  
				property_val.sup_action ,
				property_val.appr_company_id, 
				property_val.prop_inactive_dt,    
				property_val.hscap_qualify_yr ,
				property_val.hscap_override_prevhsval_flag, 
				property_val.hscap_prevhsval  ,
				property_val.hscap_prevhsval_pacsuser, 
				property_val.hscap_prevhsval_comment  , 
				property_val.hscap_prevhsval_date ,    
				property_val.hscap_override_newhsval_flag ,
				property_val.hscap_newhsval   ,
				property_val.hscap_newhsval_pacsuser, 
				property_val.hscap_newhsval_comment  ,  
				property_val.hscap_newhsval_date ,
				property_val.last_appraisal_yr ,
				property_val.oil_wells   ,
				property_val.irr_wells   ,
				property_val.irr_acres   ,
				property_val.irr_capacity,
				property_val.oil_wells_apply_adjust ,
				property_val.tif_imprv_val    ,
				property_val.tif_land_val,
				property_val.tif_flag ,
				property_val.accept_create_id, 
				property_val.accept_create_dt ,   
				property_val.abs_subdv_cd ,
				property_val.hood_cd    ,
				property_val.block  ,    
				property_val.tract_or_lot ,   
				property_val.mbl_hm_park   ,  
				property_val.mbl_hm_space   , 
				property_val.rgn_cd ,
				property_val.subset_cd, 
				property_val.map_id    , 
				property_val.auto_build_legal, 
				property_val.image_path  ,    
				property_val.hscap_prev_reappr_yr, 
				property_val.hscap_base_yr ,
				property_val.hscap_base_yr_override, 
				property_val.hscap_base_yr_pacsuser ,
				property_val.hscap_base_yr_comment   ,  
				property_val.hscap_base_yr_date,   
				property_val.next_appraiser_id,
				property_val.last_appraiser_id,
				property_val.next_appraisal_dt,
				property_val.last_appraisal_dt,
				property_val.next_appraisal_rsn,
				property_val.mapsco,
				property_val.value_appraiser_id,
				property_val.land_appraiser_id,
				property_val.cost_value,
				property_val.income_value,
				property_val.shared_value,
				property_val.appr_method,
				property_val.cost_land_hstd_val,
				property_val.cost_land_non_hstd_val,
				property_val.cost_imprv_hstd_val,
				property_val.cost_imprv_non_hstd_val,
				property_val.cost_market,
				property_val.cost_ag_use_val,
				property_val.cost_ag_market,
				property_val.cost_ag_loss,
				property_val.cost_timber_market,
				property_val.cost_timber_use,
				property_val.cost_timber_loss,
				property_val.income_land_hstd_val,
				property_val.income_land_non_hstd_val,
				property_val.income_imprv_hstd_val,
				property_val.income_imprv_non_hstd_val,
				property_val.income_market,
				property_val.income_ag_use_val,
				property_val.income_ag_market,
				property_val.income_ag_loss,
				property_val.income_timber_use,
				property_val.income_timber_loss,
				property_val.shared_land_hstd_val,
				property_val.shared_land_non_hstd_val,
				property_val.shared_imprv_hstd_val,
				property_val.shared_imprv_non_hstd_val,
				property_val.shared_market,
				property_val.shared_ag_use_val,
				property_val.shared_ag_market,
				property_val.shared_ag_loss,
				property_val.shared_timber_market,
				property_val.shared_timber_use,
				property_val.shared_timber_loss,
				property_val.shared_other_val,
				property_val.sub_type  
			from
				property_val   with(nolock)
				INNER JOIN #cap_vals_properties as tcvp with(nolock) ON
				property_val.prop_id = tcvp.prop_id 
				and	property_val.prop_val_yr = @input_yr 
			 
			insert into prelim_owner
			(
				owner_id    ,
				owner_tax_yr ,
				prop_id,
				updt_dt ,  
				pct_ownership ,  
				owner_cmnt, 
				over_65_defer ,
				over_65_date   ,
				ag_app_filed ,
				apply_pct_exemptions, 
				sup_num,
				type_of_int ,
				hs_prop,
				birth_dt,  
				roll_exemption   ,
				roll_state_code   ,    
				roll_entity 
			)
			select 
				owner.owner_id    ,
				owner.owner_tax_yr ,
				owner.prop_id,
				owner.updt_dt ,  
				owner.pct_ownership ,  
				owner.owner_cmnt, 
				owner.over_65_defer ,
				owner.over_65_date   ,
				owner.ag_app_filed ,
				owner.apply_pct_exemptions, 
				owner.sup_num,
				owner.type_of_int ,
				owner.hs_prop, 
				owner.birth_dt,  
				owner.roll_exemption   ,
				owner.roll_state_code   ,    
				owner.roll_entity
			from
				owner with(nolock)
			INNER JOIN #cap_vals_properties as tcvp with(nolock) ON
				owner.prop_id = tcvp.prop_id
			and	owner.owner_tax_yr = @input_yr 
			

			insert into prelim_property_exemption
			(
				prop_id,
				owner_id    ,
				exmpt_tax_yr ,
				owner_tax_yr ,
				prop_type_cd ,
				exmpt_type_cd ,
				applicant_nm   , 
				birth_dt   ,    
				spouse_birth_dt  ,   
				prop_exmpt_dl_num ,
				prop_exmpt_ss_num ,
				effective_dt , 
				termination_dt    ,  
				apply_pct_owner ,
				sup_num,
				effective_tax_yr, 
				qualify_yr ,
				sp_date_approved ,   
				sp_expiration_date,  
				sp_comment    ,   
				sp_value_type ,
				sp_value_option
			)
			select
				property_exemption.prop_id,
				property_exemption.owner_id    ,
				property_exemption.exmpt_tax_yr ,
				property_exemption.owner_tax_yr ,
				property_exemption.prop_type_cd ,
				property_exemption.exmpt_type_cd ,
				property_exemption.applicant_nm   , 
				property_exemption.birth_dt   ,    
				property_exemption.spouse_birth_dt  ,   
				property_exemption.prop_exmpt_dl_num ,
				property_exemption.prop_exmpt_ss_num ,
				property_exemption.effective_dt , 
				property_exemption.termination_dt    ,  
				property_exemption.apply_pct_owner ,
				property_exemption.sup_num,
				property_exemption.effective_tax_yr, 
				property_exemption.qualify_yr ,
				property_exemption.sp_date_approved ,   
				property_exemption.sp_expiration_date,  
				property_exemption.sp_comment    ,   
				property_exemption.sp_value_type ,
				property_exemption.sp_value_option 
			from
				property_exemption with(nolock)
			INNER JOIN #cap_vals_properties as tcvp with(nolock) ON
 				property_exemption.prop_id = tcvp.prop_id
			and	property_exemption.owner_tax_yr = @input_yr
			


			insert into prelim_property_freeze
			(
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
				pacs_freeze,
				pacs_freeze_date,
				pacs_freeze_ceiling,
				pacs_freeze_run,
				freeze_override
			)	
			select
				pf.prop_id,
				pf.owner_id,
				pf.exmpt_tax_yr,
				pf.owner_tax_yr,
				pf.sup_num,
				pf.entity_id,
				pf.exmpt_type_cd,
				pf.use_freeze,
				pf.transfer_dt,
				pf.prev_tax_due,
				pf.prev_tax_nofrz,
				pf.freeze_yr,
				pf.freeze_ceiling,
				pf.transfer_pct,
				pf.pacs_freeze,
				pf.pacs_freeze_date,
				pf.pacs_freeze_ceiling,
				pf.pacs_freeze_run,
				pf.freeze_override
			from
				property_freeze as pf with (nolock)
			 JOIN #cap_vals_properties as tcvp with (nolock) ON
				 
				pf.prop_id = tcvp.prop_id 
			where
				pf.owner_tax_yr = @input_yr
			and	pf.exmpt_tax_yr = @input_yr 
			
			print 'prelim_entity_prop_assoc'
			insert into prelim_entity_prop_assoc
			(
				entity_id   ,
				prop_id,
				entity_prop_id   ,    
				entity_prop_pct ,
				conv_taxable_val ,
				conv_taxable_value ,
				sup_num,
				tax_yr ,
				annex_yr ,
				entity_taxable_val 
			)
			select 
				entity_prop_assoc.entity_id   ,
				entity_prop_assoc.prop_id,
				entity_prop_assoc.entity_prop_id   ,    
				entity_prop_assoc.entity_prop_pct ,
				entity_prop_assoc.conv_taxable_val ,
				entity_prop_assoc.conv_taxable_value ,
				entity_prop_assoc.sup_num,
				entity_prop_assoc.tax_yr ,
				entity_prop_assoc.annex_yr ,
				entity_prop_assoc.entity_taxable_val 
			from
				entity_prop_assoc with (nolock)
			JOIN #cap_vals_properties as tcvp with (nolock) ON
				entity_prop_assoc.prop_id = tcvp.prop_id
			and	entity_prop_assoc.tax_yr = @input_yr 
			
			 
			insert into prelim_prop_owner_entity_val
			(
				prop_id   ,  
				owner_id   , 
				sup_num    , 
				sup_yr ,
				entity_id,   
				taxable_val, 
				assessed_val,
				frz_taxable_val,  
				frz_assessed_val, 
				frz_actual_tax,   
				frz_tax_rate   , 
				frz_levy_actual_tax, 
				weed_taxable_acres ,
				land_hstd_val    ,
				land_non_hstd_val ,
				imprv_hstd_val   ,
				imprv_non_hstd_val, 
				ag_market   ,
				ag_use_val  ,
				timber_market    ,
				timber_use  ,
				ten_percent_cap  ,
				exempt_val  ,
				prop_type_cd ,
				tax_increment_flag, 
				tax_increment_imprv_val, 
				tax_increment_land_val ,
				arb_status,
				freeze_type,
				freeze_ceiling,
				freeze_yr,
				transfer_freeze_assessed,
				transfer_freeze_taxable,
				transfer_entity_taxable,
				transfer_taxable_adjustment,
				transfer_flag
			)
			select 
				prop_owner_entity_val.prop_id   ,  
				prop_owner_entity_val.owner_id   , 
				prop_owner_entity_val.sup_num    , 
				prop_owner_entity_val.sup_yr ,
				prop_owner_entity_val.entity_id,   
				prop_owner_entity_val.taxable_val, 
				prop_owner_entity_val.assessed_val,
				prop_owner_entity_val.frz_taxable_val,  
				prop_owner_entity_val.frz_assessed_val, 
				prop_owner_entity_val.frz_actual_tax,   
				prop_owner_entity_val.frz_tax_rate   , 
				prop_owner_entity_val.frz_levy_actual_tax, 
				prop_owner_entity_val.weed_taxable_acres ,
				prop_owner_entity_val.land_hstd_val    ,
				prop_owner_entity_val.land_non_hstd_val ,
				prop_owner_entity_val.imprv_hstd_val   ,
				prop_owner_entity_val.imprv_non_hstd_val, 
				prop_owner_entity_val.ag_market   ,
				prop_owner_entity_val.ag_use_val  ,
				prop_owner_entity_val.timber_market    ,
				prop_owner_entity_val.timber_use  ,
				prop_owner_entity_val.ten_percent_cap  ,
				prop_owner_entity_val.exempt_val  ,
				prop_owner_entity_val.prop_type_cd ,
				prop_owner_entity_val.tax_increment_flag, 
				prop_owner_entity_val.tax_increment_imprv_val, 
				prop_owner_entity_val.tax_increment_land_val ,
				prop_owner_entity_val.arb_status,
				prop_owner_entity_val.freeze_type,
				prop_owner_entity_val.freeze_ceiling,
				prop_owner_entity_val.freeze_yr,
				transfer_freeze_assessed,
				transfer_freeze_taxable,
				transfer_entity_taxable,
				transfer_taxable_adjustment,
				transfer_flag
			from
				prop_owner_entity_val with (nolock)
			INNER JOIN #cap_vals_properties as tcvp with (nolock) ON
				prop_owner_entity_val.prop_id = tcvp.prop_id
			and	prop_owner_entity_val.sup_yr = @input_yr 
			
			
			insert into prelim_property_entity_exemption
			(
				prop_id ,    
				owner_id ,   
				sup_num   ,  
				exmpt_tax_yr, 
				owner_tax_yr ,
				exmpt_type_cd ,
				entity_id   ,
				state_amt   ,
				local_amt    ,    
				prorate_pct 
			)
			select 
				property_entity_exemption.prop_id ,    
				property_entity_exemption.owner_id ,   
				property_entity_exemption.sup_num   ,  
				property_entity_exemption.exmpt_tax_yr, 
				property_entity_exemption.owner_tax_yr ,
				property_entity_exemption.exmpt_type_cd ,
				property_entity_exemption.entity_id   ,
				property_entity_exemption.state_amt   ,
				property_entity_exemption.local_amt    ,    
				property_entity_exemption.prorate_pct 
			from
				property_entity_exemption with (nolock)
			INNER JOIN #cap_vals_properties as tcvp with (nolock) ON
				property_entity_exemption.prop_id = tcvp.prop_id
			and	property_entity_exemption.owner_tax_yr = @input_yr 

			 
			insert into prelim_property_owner_entity_state_cd
			(
				prop_id ,    
				year,   
				sup_num   ,  
				owner_id   , 
				entity_id  , 
				state_cd ,
				acres, 
				front_foot ,
				ag_acres   ,
				ag_use_val  ,
				ag_market   ,
				market  ,    
				imprv_hstd_val,   
				imprv_non_hstd_val, 
				land_hstd_val    ,
				land_non_hstd_val ,
				timber_use  ,
				timber_market    ,
				appraised_val    ,
				ten_percent_cap  ,
				assessed_val,
				taxable_val ,
				homestead_val    ,
				pct_ownership   ,
				entity_pct ,
				state_cd_pct    ,
				temp_type ,
				new_val    , 
				arb_status ,
				hs_pct,
				tax_increment_imprv_val,
				tax_increment_land_val
			)
			select 
				property_owner_entity_state_cd.prop_id ,    
				property_owner_entity_state_cd.year,   
				property_owner_entity_state_cd.sup_num   ,  
				property_owner_entity_state_cd.owner_id   , 
				property_owner_entity_state_cd.entity_id  , 
				property_owner_entity_state_cd.state_cd ,
				property_owner_entity_state_cd.acres, 
				property_owner_entity_state_cd.front_foot ,
				property_owner_entity_state_cd.ag_acres   ,
				property_owner_entity_state_cd.ag_use_val  ,
				property_owner_entity_state_cd.ag_market   ,
				property_owner_entity_state_cd.market  ,    
				property_owner_entity_state_cd.imprv_hstd_val,   
				property_owner_entity_state_cd.imprv_non_hstd_val, 
				property_owner_entity_state_cd.land_hstd_val    ,
				property_owner_entity_state_cd.land_non_hstd_val ,
				property_owner_entity_state_cd.timber_use  ,
				property_owner_entity_state_cd.timber_market    ,
				property_owner_entity_state_cd.appraised_val    ,
				property_owner_entity_state_cd.ten_percent_cap  ,
				property_owner_entity_state_cd.assessed_val,
				property_owner_entity_state_cd.taxable_val ,
				property_owner_entity_state_cd.homestead_val    ,
				property_owner_entity_state_cd.pct_ownership   ,
				property_owner_entity_state_cd.entity_pct ,
				property_owner_entity_state_cd.state_cd_pct    ,
				property_owner_entity_state_cd.temp_type ,
				property_owner_entity_state_cd.new_val    , 
				property_owner_entity_state_cd.arb_status ,
				property_owner_entity_state_cd.hs_pct,
				property_owner_entity_state_cd.tax_increment_imprv_val,
				property_owner_entity_state_cd.tax_increment_land_val
			from
				property_owner_entity_state_cd with(nolock)
			INNER JOIN #cap_vals_properties as tcvp with (nolock) ON
				property_owner_entity_state_cd.prop_id = tcvp.prop_id
			and	property_owner_entity_state_cd.year = @input_yr
			  
			insert into prelim_property_owner_entity_cad_state_cd
			(
				prop_id ,    
				year,   
				sup_num   ,  
				owner_id   , 
				entity_id  , 
				state_cd ,
				acres, 
				front_foot ,
				ag_acres   ,
				ag_use_val  ,
				ag_market   ,
				market  ,    
				imprv_hstd_val,   
				imprv_non_hstd_val, 
				land_hstd_val    ,
				land_non_hstd_val ,
				timber_use  ,
				timber_market    ,
				appraised_val    ,
				ten_percent_cap  ,
				assessed_val,
				taxable_val ,
				homestead_val    ,
				pct_ownership   ,
				entity_pct ,
				state_cd_pct    ,
				temp_type ,
				new_val    , 
				arb_status ,
				hs_pct,
				tax_increment_imprv_val,
				tax_increment_land_val
			)
			select 
				property_owner_entity_cad_state_cd.prop_id ,    
				property_owner_entity_cad_state_cd.year,   
				property_owner_entity_cad_state_cd.sup_num   ,  
				property_owner_entity_cad_state_cd.owner_id   , 
				property_owner_entity_cad_state_cd.entity_id  , 
				property_owner_entity_cad_state_cd.state_cd ,
				property_owner_entity_cad_state_cd.acres, 
				property_owner_entity_cad_state_cd.front_foot ,
				property_owner_entity_cad_state_cd.ag_acres   ,
				property_owner_entity_cad_state_cd.ag_use_val  ,
				property_owner_entity_cad_state_cd.ag_market   ,
				property_owner_entity_cad_state_cd.market  ,    
				property_owner_entity_cad_state_cd.imprv_hstd_val,   
				property_owner_entity_cad_state_cd.imprv_non_hstd_val, 
				property_owner_entity_cad_state_cd.land_hstd_val    ,
				property_owner_entity_cad_state_cd.land_non_hstd_val ,
				property_owner_entity_cad_state_cd.timber_use  ,
				property_owner_entity_cad_state_cd.timber_market    ,
				property_owner_entity_cad_state_cd.appraised_val    ,
				property_owner_entity_cad_state_cd.ten_percent_cap  ,
				property_owner_entity_cad_state_cd.assessed_val,
				property_owner_entity_cad_state_cd.taxable_val ,
				property_owner_entity_cad_state_cd.homestead_val    ,
				property_owner_entity_cad_state_cd.pct_ownership   ,
				property_owner_entity_cad_state_cd.entity_pct ,
				property_owner_entity_cad_state_cd.state_cd_pct    ,
				property_owner_entity_cad_state_cd.temp_type ,
				property_owner_entity_cad_state_cd.new_val    , 
				property_owner_entity_cad_state_cd.arb_status ,
				property_owner_entity_cad_state_cd.hs_pct,
				property_owner_entity_cad_state_cd.tax_increment_imprv_val,
				property_owner_entity_cad_state_cd.tax_increment_land_val
			from
				property_owner_entity_cad_state_cd with(nolock)
			INNER JOIN #cap_vals_properties as tcvp with (nolock) ON
				property_owner_entity_cad_state_cd.prop_id = tcvp.prop_id
			and	property_owner_entity_cad_state_cd.year = @input_yr  
			
end
else
begin
	 
	/* undo the initial capture */
	--if object_id('tempdb..#tempUpdateApprNCVByQuerya') is not null
	--begin
	--	drop table #tempUpdateApprNCVByQuerya
	--end
	
	--select tcvp.prop_id into #tempUpdateApprNCVByQuerya
	--from #cap_vals_properties   tcvp with(nolock)
	--inner join prelim_property  prp with(nolock) on
	--	tcvp.prop_id = prp.prop_id


	/* clear out tables first */
	delete from prelim_prop_owner_entity_val    
	from #cap_vals_properties TT
	where TT.prop_id = prelim_prop_owner_entity_val.prop_id  

	delete from prelim_property_entity_exemption
	from #cap_vals_properties TT
	where TT.prop_id = prelim_property_entity_exemption.prop_id 
	
	delete from prelim_property_owner_entity_state_cd
	from #cap_vals_properties TT
	where TT.prop_id = prelim_property_owner_entity_state_cd.prop_id 
 
	delete from prelim_property_owner_entity_cad_state_cd
	from #cap_vals_properties TT
	where TT.prop_id = prelim_property_owner_entity_cad_state_cd.prop_id 
	
	delete from prelim_entity_prop_assoc
	from #cap_vals_properties TT
	where TT.prop_id = prelim_entity_prop_assoc.prop_id 
	
	delete from prelim_property_freeze
	from #cap_vals_properties TT
	where TT.prop_id = prelim_property_freeze.prop_id 
	
	delete from prelim_property_exemption
	from #cap_vals_properties TT
	where TT.prop_id = prelim_property_exemption.prop_id 
	
	delete from prelim_owner
	from #cap_vals_properties TT
	where TT.prop_id = prelim_owner.prop_id 
	
	delete from prelim_property_val
	from #cap_vals_properties TT
	where TT.prop_id = prelim_property_val.prop_id 
	
	delete from prelim_property
	from #cap_vals_properties TT
	where TT.prop_id = prelim_property.prop_id 

	--Must delete the temp table
--if object_id('tempdb..#tempUpdateApprNCVByQuerya') is not null
--begin
--	drop table #tempUpdateApprNCVByQuerya
--end

end

GO


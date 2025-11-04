
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
--The query must return prop_id, prop_type_cd

CREATE    procedure WAUpdateApprNoticeCaptureValuesByQuery
 
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
 
			/* clear out tables first */
					
			delete from prelim_property_freeze
			from #cap_vals_properties TT
			where TT.prop_id = prelim_property_freeze.prop_id 
			
			delete from prelim_property_exemption
			from #cap_vals_properties TT
			where TT.prop_id = prelim_property_exemption.prop_id 
			
			delete from prelim_property_tax_area
			from #cap_vals_properties TT
			where TT.prop_id = prelim_property_tax_area.prop_id

			delete from prelim_owner
			from #cap_vals_properties TT
			where TT.prop_id = prelim_owner.prop_id 
			
			delete from prelim_property_val
			from #cap_vals_properties TT
			where TT.prop_id = prelim_property_val.prop_id 
			
			delete from prelim_property
			from #cap_vals_properties TT
			where TT.prop_id = prelim_property.prop_id

	--wash_perlim
 	
			delete from prelim_wash_prop_owner_exemption
			from #cap_vals_properties TT
			where TT.prop_id = prelim_wash_prop_owner_exemption.prop_id

			delete from prelim_wash_prop_owner_levy_assoc
			from #cap_vals_properties TT
			where TT.prop_id = prelim_wash_prop_owner_levy_assoc.prop_id
			
			delete from prelim_wash_prop_owner_tax_area_assoc
			from #cap_vals_properties TT
			where TT.prop_id = prelim_wash_prop_owner_tax_area_assoc.prop_id
			
			delete from prelim_wash_prop_owner_tax_district_assoc
			from #cap_vals_properties TT
			where TT.prop_id = prelim_wash_prop_owner_tax_district_assoc.prop_id
			
			delete from prelim_wash_prop_owner_val
			from #cap_vals_properties TT
			where TT.prop_id = prelim_wash_prop_owner_val.prop_id
			
			delete from prelim_wash_property_val
			from #cap_vals_properties TT
			where TT.prop_id = prelim_wash_property_val.prop_id



					 
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
				remodel_val_curr_yr  
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
				property_val.remodel_val_curr_yr
			from
				property_val   with(nolock)
				INNER JOIN #cap_vals_properties as tcvp with(nolock) ON
				property_val.prop_id = tcvp.prop_id 
				and	property_val.prop_val_yr = @input_yr 

			insert prelim_property_tax_area
			(
				year,
				sup_num,
				prop_id,
				tax_area_id,
				tax_area_id_pending,
				effective_date
			)
			select pta.year,
					pta.sup_num,
					pta.prop_id,
					pta.tax_area_id,
					pta.tax_area_id_pending,
					pta.effective_date
			from property_tax_area as pta
			with (nolock)
			join #cap_vals_properties as tcvp
			with (nolock)
			on pta.year = @input_yr
			and pta.prop_id = tcvp.prop_id
			
				
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
			
						
			/*wash region*/

		INSERT INTO prelim_wash_prop_owner_exemption 
				 (year 
				 ,sup_num 
				 ,prop_id 
				 ,owner_id 
				 ,exmpt_type_cd 
				 ,exempt_value 
				 ,exempt_sub_type_cd 
				 ,exempt_qualify_cd )
			select 	 
          wpoe.year
				 ,wpoe.sup_num 
				 ,wpoe.prop_id 
				 ,wpoe.owner_id 
				 ,wpoe.exmpt_type_cd 
				 ,wpoe.exempt_value 
				 ,wpoe.exempt_sub_type_cd 
				 ,wpoe.exempt_qualify_cd
			from
				wash_prop_owner_exemption as wpoe with (nolock)
			 JOIN #cap_vals_properties as tcvp with (nolock) ON				 
				wpoe.prop_id = tcvp.prop_id 
			where
				wpoe.year = @input_yr

INSERT INTO  prelim_wash_prop_owner_levy_assoc 
           (year 
           ,sup_num 
           ,prop_id 
           ,owner_id 
           ,levy_cd 
           ,tax_district_id 
           ,tax_area_id 
           ,pending )
     select
					 wpola.year 
           ,wpola.sup_num 
           ,wpola.prop_id 
           ,wpola.owner_id 
           ,wpola.levy_cd 
           ,wpola.tax_district_id 
           ,wpola.tax_area_id 
           ,wpola.pending 
		from
				wash_prop_owner_levy_assoc as wpola with (nolock)
			 JOIN #cap_vals_properties as tcvp with (nolock) ON				 
				wpola.prop_id = tcvp.prop_id 
			where
				wpola.year = @input_yr
-------------------------------------------------------------

INSERT INTO prelim_wash_prop_owner_tax_area_assoc
           (year
           ,sup_num
           ,prop_id
           ,owner_id
           ,tax_area_id
           ,pending)
     select
					 wpotaa.year
           ,wpotaa.sup_num
           ,wpotaa.prop_id
           ,wpotaa.owner_id
           ,wpotaa.tax_area_id
           ,wpotaa.pending
		from
				wash_prop_owner_tax_area_assoc as wpotaa with (nolock)
			 JOIN #cap_vals_properties as tcvp with (nolock) ON				 
				wpotaa.prop_id = tcvp.prop_id 
			where
				wpotaa.year = @input_yr

-------------------------------------------------------

INSERT INTO prelim_wash_prop_owner_tax_district_assoc
           (year
           ,sup_num
           ,prop_id
           ,owner_id
           ,tax_district_id)
     select
					 wpotda.year
           ,wpotda.sup_num
           ,wpotda.prop_id
           ,wpotda.owner_id
           ,wpotda.tax_district_id
		from
				wash_prop_owner_tax_district_assoc as wpotda with (nolock)
			 JOIN #cap_vals_properties as tcvp with (nolock) ON				 
				wpotda.prop_id = tcvp.prop_id 
			where
				wpotda.year = @input_yr

------------------------------------------------------


INSERT INTO prelim_wash_prop_owner_val
           (year
           ,sup_num
           ,prop_id
           ,owner_id
           ,land_hstd_val
           ,land_non_hstd_val
           ,imprv_hstd_val
           ,imprv_non_hstd_val
           ,ag_use_val
           ,ag_market
           ,ag_loss
           ,ag_hs_use_val
           ,ag_hs_market
           ,ag_hs_loss
           ,timber_use_val
           ,timber_market
           ,timber_loss
           ,timber_hs_use_val
           ,timber_hs_market
           ,timber_hs_loss
           ,new_val_hs
           ,new_val_nhs
           ,new_val_p
           ,appraised
           ,market
           ,snr_frz_imprv_hs
           ,snr_frz_land_hs
           ,appraised_classified
           ,appraised_non_classified
           ,taxable_classified
           ,taxable_non_classified
           ,state_assessed
           ,destroyed_prop
           ,destroyed_jan1_value
           ,destroyed_prorate_pct
           ,prorate_type
           ,prorate_begin
           ,prorate_end
           ,boe_status
           ,destroyed_jan1_classified_value
           ,destroyed_jan1_non_classified_value)
     select
          wpov.year
           ,wpov.sup_num
           ,wpov.prop_id
           ,wpov.owner_id
           ,wpov.land_hstd_val
           ,wpov.land_non_hstd_val
           ,wpov.imprv_hstd_val
           ,wpov.imprv_non_hstd_val
           ,wpov.ag_use_val
           ,wpov.ag_market
           ,wpov.ag_loss
           ,wpov.ag_hs_use_val
           ,wpov.ag_hs_market
           ,wpov.ag_hs_loss
           ,wpov.timber_use_val
           ,wpov.timber_market
           ,wpov.timber_loss
           ,wpov.timber_hs_use_val
           ,wpov.timber_hs_market
           ,wpov.timber_hs_loss
           ,wpov.new_val_hs
           ,wpov.new_val_nhs
           ,wpov.new_val_p
           ,wpov.appraised
           ,wpov.market
           ,wpov.snr_frz_imprv_hs
           ,wpov.snr_frz_land_hs
           ,wpov.appraised_classified
           ,wpov.appraised_non_classified
           ,wpov.taxable_classified
           ,wpov.taxable_non_classified
           ,wpov.state_assessed
           ,wpov.destroyed_prop
           ,wpov.destroyed_jan1_value
           ,wpov.destroyed_prorate_pct
           ,wpov.prorate_type
           ,wpov.prorate_begin
           ,wpov.prorate_end
           ,wpov.boe_status
           ,wpov.destroyed_jan1_classified_value
           ,wpov.destroyed_jan1_non_classified_value
		from
				wash_prop_owner_val as wpov with (nolock)
			 JOIN #cap_vals_properties as tcvp with (nolock) ON				 
				wpov.prop_id = tcvp.prop_id 
			where
				wpov.year = @input_yr

-----------------------------------




INSERT INTO prelim_wash_property_val
           (prop_val_yr
           ,sup_num
           ,prop_id
           ,appraised_classified
           ,appraised_non_classified
           ,snr_imprv
           ,snr_land
           ,snr_new_val
           ,snr_qualify_yr
           ,snr_qualify_yr_override
           ,snr_frz_imprv_hs
           ,snr_frz_land_hs
           ,snr_frz_imprv_hs_override
           ,snr_frz_land_hs_override
           ,snr_taxable_portion
           ,snr_exempt_loss
           ,snr_portion_applied
           ,snr_new_val_override
           ,comment_update_date
           ,comment_update_user
           ,snr_comment
           ,snr_imprv_lesser
           ,snr_land_lesser)
     select
					wpv.prop_val_yr
           ,wpv.sup_num
           ,wpv.prop_id
           ,wpv.appraised_classified
           ,wpv.appraised_non_classified
           ,wpv.snr_imprv
           ,wpv.snr_land
           ,wpv.snr_new_val
           ,wpv.snr_qualify_yr
           ,wpv.snr_qualify_yr_override
           ,wpv.snr_frz_imprv_hs
           ,wpv.snr_frz_land_hs
           ,wpv.snr_frz_imprv_hs_override
           ,wpv.snr_frz_land_hs_override
           ,wpv.snr_taxable_portion
           ,wpv.snr_exempt_loss
           ,wpv.snr_portion_applied
           ,wpv.snr_new_val_override
           ,wpv.comment_update_date
           ,wpv.comment_update_user
           ,wpv.snr_comment
           ,wpv.snr_imprv_lesser
           ,wpv.snr_land_lesser
		from
				wash_property_val as wpv with (nolock)
			 JOIN #cap_vals_properties as tcvp with (nolock) ON				 
				wpv.prop_id = tcvp.prop_id 
			where
				wpv.prop_val_yr = @input_yr
          
			
end
else
begin
	 
	
	delete from prelim_property_freeze
	from #cap_vals_properties TT
	where TT.prop_id = prelim_property_freeze.prop_id 
	
	delete from prelim_property_exemption
	from #cap_vals_properties TT
	where TT.prop_id = prelim_property_exemption.prop_id 
	
	delete from prelim_owner
	from #cap_vals_properties TT
	where TT.prop_id = prelim_owner.prop_id 
	
	delete from prelim_property_tax_area
	from #cap_vals_properties TT
	where TT.prop_id = prelim_property_tax_area.prop_id

	delete from prelim_property_val
	from #cap_vals_properties TT
	where TT.prop_id = prelim_property_val.prop_id 
	
	delete from prelim_property
	from #cap_vals_properties TT
	where TT.prop_id = prelim_property.prop_id 

--wash_perlim
 	

			
	delete from prelim_wash_prop_owner_exemption
	from #cap_vals_properties TT
	where TT.prop_id = prelim_wash_prop_owner_exemption.prop_id

	
	delete from prelim_wash_prop_owner_levy_assoc
	from #cap_vals_properties TT
	where TT.prop_id = prelim_wash_prop_owner_levy_assoc.prop_id
	
	delete from prelim_wash_prop_owner_tax_area_assoc
	from #cap_vals_properties TT
	where TT.prop_id = prelim_wash_prop_owner_tax_area_assoc.prop_id
	
	delete from prelim_wash_prop_owner_tax_district_assoc
	from #cap_vals_properties TT
	where TT.prop_id = prelim_wash_prop_owner_tax_district_assoc.prop_id
	
	delete from prelim_wash_prop_owner_val
	from #cap_vals_properties TT
	where TT.prop_id = prelim_wash_prop_owner_val.prop_id
	
	delete from prelim_wash_property_val
	from #cap_vals_properties TT
	where TT.prop_id = prelim_wash_property_val.prop_id

end


-- ** 'End csp.WAUpdateApprNoticeCaptureValuesByQuery.sql'

GO


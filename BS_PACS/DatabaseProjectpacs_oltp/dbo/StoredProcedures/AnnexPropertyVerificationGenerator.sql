
create procedure AnnexPropertyVerificationGenerator
	@datasetID int,
	@taxDistrictID int = null,
	@annexationID int = null,
	@year int = null
as

	insert into ##annexation_prop_verification_report
	select 
		@datasetID,
		prop_id,
		start_year,
		annexation_code,
		annexation_description,
		owner_name,
		land_value,
		imprv_value,
		(imprv_value + (case when is_state_assessed = 0 then land_value else 0 end)) as total_value,
		exemption_amount,
		(case when taxable_value < 0 then 0 else taxable_value end) as taxable_value,
		current_use,
		local_assessed,
		prop_type_cd,
		legal_acreage		
	from 
		(select distinct
			apa.prop_id,
			a.start_year,
			a.annexation_code,
			a.annexation_description,
			aa.file_as_name as owner_name,
			case when p.prop_type_cd in ('P', 'MN') or state_assessed > 0 then 1 else 0 end as is_state_assessed,
			wpov.land_hstd_val + wpov.land_non_hstd_val + wpov.ag_market as land_value,
			case when p.prop_type_cd in ('P', 'MN') or state_assessed > 0
				then wpov.appraised_classified + wpov.appraised_non_classified
				else wpov.imprv_hstd_val + wpov.imprv_non_hstd_val
			end as imprv_value,

			-- exemption amount
			(
				(case when p.prop_type_cd in ('P', 'MN') or state_assessed > 0
					then wpov.appraised_classified + wpov.appraised_non_classified
					else 
						(case when wpov.snr_frz_land_hs > 0 
							then wpv.snr_land_lesser + wpov.land_non_hstd_val + wpov.ag_use_val
							else wpov.land_hstd_val + wpov.land_non_hstd_val + wpov.ag_use_val + wpov.ag_hs_use_val
						end + 
						case when wpov.snr_frz_imprv_hs > 0 
							then wpv.snr_imprv_lesser + wpov.imprv_non_hstd_val
							else wpov.imprv_hstd_val + wpov.imprv_non_hstd_val
						end)
				end) - (wpov.taxable_classified + wpov.taxable_non_classified)
			) as exemption_amount,

			--taxable value
			(
				case when p.prop_type_cd in ('P', 'MN') or state_assessed > 0
					then wpov.appraised_classified + wpov.appraised_non_classified
					else 
						(case when wpov.snr_frz_land_hs > 0 
							then wpv.snr_land_lesser + wpov.land_non_hstd_val + wpov.ag_use_val
							else wpov.land_hstd_val + wpov.land_non_hstd_val + wpov.ag_use_val + wpov.ag_hs_use_val
						end + 
						case when wpov.snr_frz_imprv_hs > 0 
							then wpv.snr_imprv_lesser + wpov.imprv_non_hstd_val
							else wpov.imprv_hstd_val + wpov.imprv_non_hstd_val
						end)
				end
				- 
				((case when p.prop_type_cd in ('P', 'MN') or state_assessed > 0
						then wpov.appraised_classified + wpov.appraised_non_classified
						else 
						(case when wpov.snr_frz_land_hs > 0 
							then wpv.snr_land_lesser + wpov.land_non_hstd_val + wpov.ag_use_val
							else wpov.land_hstd_val + wpov.land_non_hstd_val + wpov.ag_use_val + wpov.ag_hs_use_val
						end + 
						case when wpov.snr_frz_imprv_hs > 0 
							then wpv.snr_imprv_lesser + wpov.imprv_non_hstd_val
							else wpov.imprv_hstd_val + wpov.imprv_non_hstd_val
						end)
				end) - (wpov.taxable_classified + wpov.taxable_non_classified))
			) as taxable_value,			
			case when wpov.ag_use_val + wpov.ag_hs_use_val > 0 then 'Y' else 'N' end as current_use,
			case when pst.local_assessed_utility = 0 then 'N' else 'Y' end as local_assessed,
			p.prop_type_cd,
			isnull(legal_acreage, 0) as legal_acreage
		from  annexation a (nolock)
		join annexation_property_assoc apa (nolock)
			on a.annexation_id = apa.annexation_id
		join property p (nolock)
			on apa.prop_id = p.prop_id
		join prop_supp_assoc psa (nolock)
			on apa.prop_id = psa.prop_id
			and a.start_year = psa.owner_tax_yr
		join wash_prop_owner_val wpov (nolock)
			on wpov.prop_id = apa.prop_id
			and wpov.year = psa.owner_tax_yr
			and wpov.sup_num = psa.sup_num
		join property_val pv (nolock)
			on pv.prop_id = wpov.prop_id
			and pv.prop_val_yr = wpov.year
			and pv.sup_num = psa.sup_num
		join wash_property_val as wpv (nolock)
			on wpov.prop_id = wpv.prop_id
				and wpov.sup_num = wpv.sup_num
			and wpov.year = wpv.prop_val_yr
		join account aa (nolock)
			on aa.acct_id = owner_id
		left join property_sub_type pst (nolock)
			on pst.property_sub_cd = pv.sub_type
		where (@taxDistrictID is null or a.tax_district_id = @taxDistrictID) and
			(@annexationID is null or a.annexation_id = @annexationID) and
			(@year is null or a.start_year = @year)
	) as tt

GO


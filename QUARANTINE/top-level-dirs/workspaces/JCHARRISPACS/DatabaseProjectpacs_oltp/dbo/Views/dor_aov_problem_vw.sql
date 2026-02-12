
create view dor_aov_problem_vw
as

	select *
	from dor_aov_property_vw
	where
		(
			num_exemptions > 1
			or
			(is_state_assessed = 1 and is_local_assessed = 1)
			or
			has_invalid_asset_type_code = 1
			or
			is_reference_not_deleted = 1
			or
			is_pp_sum_wrong = 1
			or
			is_wrong_pp_appr_method = 1
			or
			has_pp_farm_and_u500 = 1
			or
			has_pp_farm_and_ex = 1
			or
			has_pp_farm_code_invalid = 1
			or
			has_rmh_invalid_dor_code = 1
		)

GO


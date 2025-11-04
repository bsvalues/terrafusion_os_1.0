
create procedure CalculateTaxableSelectStateCodeCAD
	@lYear numeric(4,0),
	@lSupNum int,
	@bUseList bit
as

	if ( @bUseList = 1 )
	begin
		select
			isnull(assessed_val, 0),
			isnull(land_hstd_val, 0),
			isnull(land_non_hstd_val, 0),
			isnull(imprv_hstd_val, 0),
			isnull(imprv_non_hstd_val, 0),
			isnull(ag_market, 0),
			isnull(ag_use_val, 0),
			isnull(timber_market, 0),
			isnull(timber_use, 0),
			isnull(ten_percent_cap, 0),
			upper(rtrim(state_cd)),
			isnull(imp_new_val, 0),
			isnull(ag_acres, 0.0),
			isnull(pp_new_val, 0),
			isnull(land_new_val, 0),
			isnull(effective_front, 0.0),
			isnull(acres, 0.0),
			prop_id
		from property_val_cad_state_cd with(nolock)
		where
			prop_val_yr = @lYear and
			sup_num = @lSupNum and
			prop_id in (
				select prop_id from #totals_prop_list
			)
		order by prop_id asc, state_cd asc

	end
	else
	begin
		select
			isnull(assessed_val, 0),
			isnull(land_hstd_val, 0),
			isnull(land_non_hstd_val, 0),
			isnull(imprv_hstd_val, 0),
			isnull(imprv_non_hstd_val, 0),
			isnull(ag_market, 0),
			isnull(ag_use_val, 0),
			isnull(timber_market, 0),
			isnull(timber_use, 0),
			isnull(ten_percent_cap, 0),
			upper(rtrim(state_cd)),
			isnull(imp_new_val, 0),
			isnull(ag_acres, 0.0),
			isnull(pp_new_val, 0),
			isnull(land_new_val, 0),
			isnull(effective_front, 0.0),
			isnull(acres, 0.0),
			prop_id
		from property_val_cad_state_cd with(nolock)
		where
			prop_val_yr = @lYear and
			sup_num = @lSupNum
		order by prop_id asc, state_cd asc
	end

	return(@@rowcount)

GO


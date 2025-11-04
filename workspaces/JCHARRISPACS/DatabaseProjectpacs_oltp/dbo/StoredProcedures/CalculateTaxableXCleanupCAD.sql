
create procedure CalculateTaxableXCleanupCAD
	@lYear int,
	@lSupNum int,
	@bUseList bit
as

set nocount on

	create table #x_props
	(
		prop_id int not null,
		primary key clustered (prop_id) with fillfactor = 100
	)

	if ( @bUseList = 1 )
	begin
		insert #x_props (prop_id)
		select distinct poesc.prop_id
		from property_owner_entity_state_cd as poesc with(nolock)
		where
			poesc.year = @lYear and
			poesc.sup_num = @lSupNum and
			poesc.state_cd in ('ERROR','X') and
			poesc.prop_id in (select prop_id from #totals_prop_list)
	end
	else
	begin
		insert #x_props (prop_id)
		select distinct poesc.prop_id
		from property_owner_entity_state_cd as poesc with(nolock)
		where
			poesc.year = @lYear and
			poesc.sup_num = @lSupNum and
			poesc.state_cd in ('ERROR','X')
	end

	/* Remove all rows related to the properties we updated */
	delete property_owner_entity_cad_state_cd with(tablock)
	where
		year = @lYear and
		sup_num = @lSupNum and
		prop_id in (
			select prop_id from #x_props
		)

	/* Make the CAD code for these properties NOT the CAD code but the SPTB code */
	insert property_owner_entity_cad_state_cd with(tablock)
	(
		prop_id,
		year,
		sup_num,
		owner_id,
		entity_id,
		state_cd,
		acres,
		front_foot,
		ag_acres,
		ag_use_val,
		ag_market,
		market,
		imprv_hstd_val,
		imprv_non_hstd_val,
		land_hstd_val,
		land_non_hstd_val,
		timber_use,
		timber_market,
		appraised_val,
		ten_percent_cap,
		assessed_val,
		taxable_val,
		homestead_val,
		pct_ownership,
		entity_pct,
		state_cd_pct,
		temp_type,
		new_val,
		arb_status,
		hs_pct,
		tax_increment_imprv_val,
		tax_increment_land_val
	)
	select
		prop_id,
		year,
		sup_num,
		owner_id,
		entity_id,
		state_cd,
		acres,
		front_foot,
		ag_acres,
		ag_use_val,
		ag_market,
		market,
		imprv_hstd_val,
		imprv_non_hstd_val,
		land_hstd_val,
		land_non_hstd_val,
		timber_use,
		timber_market,
		appraised_val,
		ten_percent_cap,
		assessed_val,
		taxable_val,
		homestead_val,
		pct_ownership,
		entity_pct,
		state_cd_pct,
		temp_type,
		new_val,
		arb_status,
		hs_pct,
		tax_increment_imprv_val,
		tax_increment_land_val
	from property_owner_entity_state_cd with(nolock)
	where
		year = @lYear and
		sup_num = @lSupNum and
		prop_id in (select prop_id from #x_props)

GO



create procedure CalculateTaxableXCleanup
	@lYear int,
	@lSupNum int,
	@bUseList bit
as

set nocount on

	declare @szSQL varchar(8000)

	create table #x_state_code
	(
		prop_id int not null,
		year int not null,
		sup_num int not null,
		owner_id int not null,
		entity_id int not null,
		state_cd char(5) not null,
		acres numeric(18,4) null,
		front_foot numeric(18,2) null,
		ag_acres numeric(18,4) null,
		ag_use_val numeric(14,0) null,
		ag_market numeric(14,0) null,
		market numeric(14,0) null,
		imprv_hstd_val numeric(14,0) null,
		imprv_non_hstd_val numeric(14,0) null,
		land_hstd_val numeric(14,0) null,
		land_non_hstd_val numeric(14,0) null,
		timber_use numeric(14,0) null,
		timber_market numeric(14,0) null,
		appraised_val numeric(14,0) null,
		ten_percent_cap numeric(14,0) null,
		assessed_val numeric(14,0) null,
		taxable_val numeric(14,0) null,
		homestead_val numeric(14,0) null,
		pct_ownership numeric(13,10) null,
		entity_pct numeric(13,10) null,
		state_cd_pct numeric(13,10) null,
		temp_type varchar(2)  null,
		new_val numeric(14,0) null,
		arb_status varchar(1) null,
		hs_pct numeric(13,10) null,
		tax_increment_imprv_val numeric(14,0) null,
		tax_increment_land_val numeric(14,0) null
	)

	create clustered index idx_x_state_code on #x_state_code(year, sup_num, entity_id, prop_id, owner_id, state_cd)
	with fillfactor = 90

	create table #x_props
	(
		prop_id int not null
	)

	create clustered index idx_x_props on #x_props(prop_id) with fillfactor = 90
	
	if ( @bUseList = 1 )
	begin
		insert #x_props (prop_id)
		select distinct psc.prop_id
		from property_owner_entity_state_cd as psc with(nolock)
		join property_entity_exemption as pee with(nolock) on
			pee.owner_tax_yr = @lYear and
			pee.exmpt_tax_yr = @lYear and
			pee.sup_num = @lSupNum and
			psc.entity_id = pee.entity_id and
			psc.prop_id = pee.prop_id and
			psc.owner_id = pee.owner_id and
			(
				pee.exmpt_type_cd  = 'EX366'
				or (
					pee.exmpt_type_cd  = 'EX' and
					pee.prorate_pct = 1
				)
			)
		where
			psc.year = @lYear and
			psc.sup_num = @lSupNum and
			psc.prop_id in (select prop_id from #totals_prop_list)

		insert #x_props (prop_id)
		select distinct psc.prop_id
		from property_owner_entity_state_cd as psc with(nolock)
		where
			psc.year = @lYear and
			psc.sup_num = @lSupNum and
			psc.prop_id in (select prop_id from #totals_prop_list) and
			state_cd = 'X' and
			not exists (
				select pee.prop_id
				from property_entity_exemption as pee with(nolock)
				where
					pee.owner_tax_yr = @lYear and
					pee.exmpt_tax_yr = @lYear and
					pee.sup_num = @lSupNum and
					pee.entity_id = psc.entity_id and
					pee.prop_id = psc.prop_id and
					pee.owner_id = psc.owner_id and
					pee.exmpt_type_cd in ('EX','EX366')
			)
	end
	else
	begin
		insert #x_props (prop_id)
		select distinct psc.prop_id
		from property_owner_entity_state_cd as psc with(nolock)
		join property_entity_exemption as pee with(nolock) on
			pee.owner_tax_yr = @lYear and
			pee.exmpt_tax_yr = @lYear and
			pee.sup_num = @lSupNum and
			psc.entity_id = pee.entity_id and
			psc.prop_id = pee.prop_id and
			psc.owner_id = pee.owner_id and
			(
				pee.exmpt_type_cd  = 'EX366'
				or (
					pee.exmpt_type_cd  = 'EX' and
					pee.prorate_pct = 1
				)
			)
		where
			psc.year = @lYear and
			psc.sup_num = @lSupNum

		insert #x_props (prop_id)
		select distinct psc.prop_id
		from property_owner_entity_state_cd as psc with(nolock)
		where
			psc.year = @lYear and
			psc.sup_num = @lSupNum and
			state_cd = 'X' and
			not exists (
				select pee.prop_id
				from property_entity_exemption as pee with(nolock)
				where
					pee.owner_tax_yr = @lYear and
					pee.exmpt_tax_yr = @lYear and
					pee.sup_num = @lSupNum and
					pee.entity_id = psc.entity_id and
					pee.prop_id = psc.prop_id and
					pee.owner_id = psc.owner_id and
					pee.exmpt_type_cd in ('EX','EX366')
			)
	end

	insert #x_state_code
	select *
	from property_owner_entity_state_cd with(nolock)
	where
		year = @lYear and
		sup_num = @lSupNum and
		prop_id in (
			select prop_id from #x_props
		)

	/* Flag all properties that have a full EX exemption with a state code of X */
	update #x_state_code
	set
		state_cd = 'X'
	from #x_state_code as xsc with(tablock)
	join property_entity_exemption as pee with(nolock) on
		pee.owner_tax_yr = @lYear
		and pee.exmpt_tax_yr = @lYear
		and pee.sup_num = @lSupNum
		and xsc.entity_id = pee.entity_id
		and xsc.prop_id = pee.prop_id
		and xsc.owner_id = pee.owner_id
		and (
			pee.exmpt_type_cd  = 'EX366'
			or (
				pee.exmpt_type_cd  = 'EX' and
				pee.prorate_pct = 1
			)
		)

	/*
		Flag all properties that have a state code of X
		but no EX/EX366 exemption with a state code of ERROR
	*/
	update #x_state_code
	set
		state_cd = 'ERROR'
	from #x_state_code as xsc with(tablock)
	where 
		state_cd = 'X'
		and not exists (
			select pee.owner_tax_yr
			from property_entity_exemption as pee with(nolock)
			where pee.owner_tax_yr  = @lYear
			and   pee.exmpt_tax_yr  = @lYear
			and   pee.sup_num = @lSupNum
			and   pee.entity_id = xsc.entity_id
			and   pee.prop_id = xsc.prop_id
			and   pee.owner_id = xsc.owner_id
			and pee.exmpt_type_cd in ('EX','EX366')
		)

	/* Remove all rows related to the properties we updated */
	delete property_owner_entity_state_cd with(tablock)
	where
		year = @lYear and
		sup_num = @lSupNum and
		prop_id in (
			select prop_id from #x_props
		)

	/* Insert the properly updated and aggregated values */
	insert property_owner_entity_state_cd with(tablock)
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
	select distinct
		prop_id,
		year,
		sup_num,
		owner_id,
		entity_id,
		state_cd,
		sum(acres),
		sum(front_foot),
		sum(ag_acres),
		sum(ag_use_val),
		sum(ag_market),
		sum(market),
		sum(imprv_hstd_val),
		sum(imprv_non_hstd_val),
		sum(land_hstd_val),
		sum(land_non_hstd_val),
		sum(timber_use),
		sum(timber_market),
		sum(appraised_val),
		sum(ten_percent_cap),
		sum(assessed_val),
		sum(taxable_val),
		sum(homestead_val),
		null,
		null,
		1,  
		null,
		sum(new_val),
		arb_status,
		sum(hs_pct),
		sum(tax_increment_imprv_val),
		sum(tax_increment_land_val)
	from #x_state_code
	group by
		prop_id,
		year,
		sup_num,
		owner_id,
		entity_id,
		state_cd,
		arb_status
	order by
		year,
		sup_num,
		entity_id,
		prop_id,
		owner_id,
		state_cd

GO


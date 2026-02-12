
create procedure PopulatePropertyValStateCd
	@lYear numeric(4,0),
	@lSupNum int,
	@bCalculate bit = 0,
	@bForcePVAgreement bit = 0,
	@bPropList bit = 0 -- If 1, caller must first create & populate #tmp_props - one column prop_id
	                   -- Implies @bCalculate = 0 at the present time
as

set nocount on

	/* PTD only calculation */
	if ( @bCalculate = 1 and @bPropList = 0 )
	begin
		exec RecalcProperty 0, @lYear, @lSupNum, 'T', 1
	end

	if ( @bForcePVAgreement = 0 )
	begin
		return
	end

	declare
		@lPropID int,
		@lDiff_ImprvHS numeric(14,0),
		@lDiff_ImprvNHS numeric(14,0),
		@lDiff_LandHS numeric(14,0),
		@lDiff_LandNHS numeric(14,0),
		@lDiff_AgUse numeric(14,0),
		@lDiff_AgMarket numeric(14,0),
		@lDiff_TimUse numeric(14,0),
		@lDiff_TimMarket numeric(14,0),
		@lDiff_TenPercentCap numeric(14,0),
		@lDiff_ImpNewVal numeric(14,0)

	declare
		@lDiff_Personal numeric(14,0),
		@lDiff_PPNew numeric(14,0)




	/**************************************************************************/
	/**************************************************************************/
	/* Begin - property_val_state_cd (SPTB code) */
	/**************************************************************************/
	/**************************************************************************/

	/**************************************************************************/
	/* Begin - Real / Mobile Home */
	/**************************************************************************/

	/* This table represents a "property_val similar" table that is built from property_val_state_cd */

	create table #rmh_ptd_pvsc
	(
		prop_id int not null,
		imprv_hstd_val numeric(14,0) null,
		imprv_non_hstd_val numeric(14,0) null,
		land_hstd_val numeric(14,0) null,
		land_non_hstd_val numeric(14,0) null,
		ag_use_val numeric(14,0) null,
		ag_market numeric(14,0) null,
		timber_use numeric(14,0) null,
		timber_market numeric(14,0) null,
		ten_percent_cap numeric(14,0) null,
		imp_new_val numeric(14,0) null,

		primary key clustered (prop_id)
		with fillfactor = 100
	)

	/* One row per property */
	if ( @bPropList = 1 )
	begin
		insert #rmh_ptd_pvsc with(tablockx)
		select distinct pvsc.prop_id,
		sum(isnull(pvsc.imprv_hstd_val,0)),
		sum(isnull(pvsc.imprv_non_hstd_val,0)),
		sum(isnull(pvsc.land_hstd_val,0)),
		sum(isnull(pvsc.land_non_hstd_val,0)),
		sum(isnull(pvsc.ag_use_val,0)),
		sum(isnull(pvsc.ag_market,0)),
		sum(isnull(pvsc.timber_use,0)),
		sum(isnull(pvsc.timber_market,0)),
		sum(isnull(pvsc.ten_percent_cap,0)),
		sum(isnull(pvsc.imp_new_val,0))
		from property_val_state_cd as pvsc with(nolock)
		join property as p with(nolock) on
			pvsc.prop_id = p.prop_id and
			p.prop_type_cd in ('R','MH')
		where
			pvsc.prop_val_yr = @lYear and
			pvsc.sup_num = @lSupNum and
			pvsc.prop_id in (select t.prop_id from #tmp_props as t with(nolock))
		group by pvsc.prop_id
		order by pvsc.prop_id
	end
	else
	begin
		insert #rmh_ptd_pvsc with(tablockx)
		select distinct pvsc.prop_id,
		sum(isnull(pvsc.imprv_hstd_val,0)),
		sum(isnull(pvsc.imprv_non_hstd_val,0)),
		sum(isnull(pvsc.land_hstd_val,0)),
		sum(isnull(pvsc.land_non_hstd_val,0)),
		sum(isnull(pvsc.ag_use_val,0)),
		sum(isnull(pvsc.ag_market,0)),
		sum(isnull(pvsc.timber_use,0)),
		sum(isnull(pvsc.timber_market,0)),
		sum(isnull(pvsc.ten_percent_cap,0)),
		sum(isnull(pvsc.imp_new_val,0))
		from property_val_state_cd as pvsc with(nolock)
		join property as p with(nolock) on
			pvsc.prop_id = p.prop_id and
			p.prop_type_cd in ('R','MH')
		where
			pvsc.prop_val_yr = @lYear and
			pvsc.sup_num = @lSupNum
		group by pvsc.prop_id
		order by pvsc.prop_id
	end

	/* This table will represent what percentage of the total value each state code has in each bucket */

	create table #rmh_ptd_pvsc_pct (
		prop_id int not null,
		state_cd char(5) not null,
		pct_imprv_hstd_val numeric(38,10) null,
		pct_imprv_non_hstd_val numeric(38,10) null,
		pct_land_hstd_val numeric(38,10) null,
		pct_land_non_hstd_val numeric(38,10) null,
		pct_ag_use_val numeric(38,10) null,
		pct_ag_market numeric(38,10) null,
		pct_timber_use numeric(38,10) null,
		pct_timber_market numeric(38,10) null,
		pct_ten_percent_cap numeric(38,10) null,
		pct_imp_new_val numeric(38,10) null,

		primary key clustered (prop_id, state_cd)
		with fillfactor = 100
	)

	insert #rmh_ptd_pvsc_pct with(tablockx)
	select pvsc.prop_id, pvsc.state_cd,
	case
	when ptd.imprv_hstd_val > 0
	then pvsc.imprv_hstd_val / ptd.imprv_hstd_val
	else 0
	end,
	case
	when ptd.imprv_non_hstd_val > 0
	then pvsc.imprv_non_hstd_val / ptd.imprv_non_hstd_val
	else 0
	end,
	case
	when ptd.land_hstd_val > 0
	then pvsc.land_hstd_val / ptd.land_hstd_val
	else 0
	end,
	case
	when ptd.land_non_hstd_val > 0
	then pvsc.land_non_hstd_val / ptd.land_non_hstd_val
	else 0
	end,
	case
	when ptd.ag_use_val > 0
	then pvsc.ag_use_val / ptd.ag_use_val
	else 0
	end,
	case
	when ptd.ag_market > 0
	then pvsc.ag_market / ptd.ag_market
	else 0
	end,
	case
	when ptd.timber_use > 0
	then pvsc.timber_use / ptd.timber_use
	else 0
	end,
	case
	when ptd.timber_market > 0
	then pvsc.timber_market / ptd.timber_market
	else 0
	end,
	case
	when ptd.ten_percent_cap > 0
	then pvsc.ten_percent_cap / ptd.ten_percent_cap
	else 0
	end,
	case
	when ptd.imp_new_val > 0
	then pvsc.imp_new_val / ptd.imp_new_val
	else 0
	end
	from property_val_state_cd as pvsc with(nolock)
	join #rmh_ptd_pvsc as ptd with(nolock) on
		pvsc.prop_id = ptd.prop_id
	where
		pvsc.prop_val_yr = @lYear and
		pvsc.sup_num = @lSupNum
	order by pvsc.prop_id, pvsc.state_cd

	/*
		This reconciles property_val_state_cd to agree/balance w/ property_val,
		maintaining distribution of all buckets across state codes per the percentages we calculated
	*/

	update property_val_state_cd with(tablockx)
	set
	property_val_state_cd.imprv_hstd_val = pct.pct_imprv_hstd_val * isnull(pv.imprv_hstd_val, 0),
	property_val_state_cd.imprv_non_hstd_val = pct.pct_imprv_non_hstd_val * isnull(pv.imprv_non_hstd_val, 0),
	property_val_state_cd.land_hstd_val = pct.pct_land_hstd_val * isnull(pv.land_hstd_val, 0),
	property_val_state_cd.land_non_hstd_val = pct.pct_land_non_hstd_val * isnull(pv.land_non_hstd_val, 0),
	property_val_state_cd.ag_use_val = pct.pct_ag_use_val * isnull(pv.ag_use_val, 0),
	property_val_state_cd.ag_market = pct.pct_ag_market * isnull(pv.ag_market, 0),
	property_val_state_cd.timber_use = pct.pct_timber_use * isnull(pv.timber_use, 0),
	property_val_state_cd.timber_market = pct.pct_timber_market * isnull(pv.timber_market, 0),
	property_val_state_cd.ten_percent_cap = pct.pct_ten_percent_cap * isnull(pv.ten_percent_cap, 0),
	property_val_state_cd.imp_new_val = pct.pct_imp_new_val * (isnull(pv.new_val_hs, 0) + isnull(pv.new_val_nhs, 0))
	from property_val_state_cd with(tablockx)
	join property_val as pv with(nolock) on
		pv.prop_id = property_val_state_cd.prop_id and
		pv.prop_val_yr = @lYear and
		pv.sup_num = @lSupNum
	join #rmh_ptd_pvsc_pct as pct with(nolock) on
		pct.prop_id = property_val_state_cd.prop_id and
		pct.state_cd = property_val_state_cd.state_cd
	where
		property_val_state_cd.prop_val_yr = @lYear and
		property_val_state_cd.sup_num = @lSupNum

	/*
		This table is just like #rmh_ptd_pvsc.
		It will be used to verify that the new property_val_state_cd looks good.
	*/
	create table #rmh_ptd_pvsc_new
	(
		prop_id int not null,
		imprv_hstd_val numeric(14,0) null,
		imprv_non_hstd_val numeric(14,0) null,
		land_hstd_val numeric(14,0) null,
		land_non_hstd_val numeric(14,0) null,
		ag_use_val numeric(14,0) null,
		ag_market numeric(14,0) null,
		timber_use numeric(14,0) null,
		timber_market numeric(14,0) null,
		ten_percent_cap numeric(14,0) null,
		imp_new_val numeric(14,0) null,

		primary key clustered (prop_id)
		with fillfactor = 100
	)

	if ( @bPropList = 1 )
	begin
		insert #rmh_ptd_pvsc_new with(tablockx)
		select distinct pvsc.prop_id,
		sum(isnull(pvsc.imprv_hstd_val,0)),
		sum(isnull(pvsc.imprv_non_hstd_val,0)),
		sum(isnull(pvsc.land_hstd_val,0)),
		sum(isnull(pvsc.land_non_hstd_val,0)),
		sum(isnull(pvsc.ag_use_val,0)),
		sum(isnull(pvsc.ag_market,0)),
		sum(isnull(pvsc.timber_use,0)),
		sum(isnull(pvsc.timber_market,0)),
		sum(isnull(pvsc.ten_percent_cap,0)),
		sum(isnull(pvsc.imp_new_val,0))
		from property_val_state_cd as pvsc with(nolock)
		join property as p with(nolock) on
			pvsc.prop_id = p.prop_id and
			p.prop_type_cd in ('R','MH')
		where
			pvsc.prop_val_yr = @lYear and
			pvsc.sup_num = @lSupNum and
			pvsc.prop_id in (select t.prop_id from #tmp_props as t with(nolock))
		group by pvsc.prop_id
		order by pvsc.prop_id

	end
	else
	begin
		insert #rmh_ptd_pvsc_new with(tablockx)
		select distinct pvsc.prop_id,
		sum(isnull(pvsc.imprv_hstd_val,0)),
		sum(isnull(pvsc.imprv_non_hstd_val,0)),
		sum(isnull(pvsc.land_hstd_val,0)),
		sum(isnull(pvsc.land_non_hstd_val,0)),
		sum(isnull(pvsc.ag_use_val,0)),
		sum(isnull(pvsc.ag_market,0)),
		sum(isnull(pvsc.timber_use,0)),
		sum(isnull(pvsc.timber_market,0)),
		sum(isnull(pvsc.ten_percent_cap,0)),
		sum(isnull(pvsc.imp_new_val,0))
		from property_val_state_cd as pvsc with(nolock)
		join property as p with(nolock) on
			pvsc.prop_id = p.prop_id and
			p.prop_type_cd in ('R','MH')
		where
			pvsc.prop_val_yr = @lYear and
			pvsc.sup_num = @lSupNum
		group by pvsc.prop_id
		order by pvsc.prop_id
	end

	/*
		Due to the possibility that the amounts don't add up correctly (due to multiple state codes),
		find these and assign the remaining values (virtually always < 2 dollars) to one of the state codes
	*/

	declare curProps cursor
	for
		select
			pv.prop_id,
			isnull(pv.imprv_hstd_val, 0) - isnull(pvsc.imprv_hstd_val, 0),
			isnull(pv.imprv_non_hstd_val, 0) - isnull(pvsc.imprv_non_hstd_val, 0),
			isnull(pv.land_hstd_val, 0) - isnull(pvsc.land_hstd_val, 0),
			isnull(pv.land_non_hstd_val, 0) - isnull(pvsc.land_non_hstd_val, 0),
			isnull(pv.ag_use_val, 0) - isnull(pvsc.ag_use_val, 0),
			isnull(pv.ag_market, 0) - isnull(pvsc.ag_market, 0),
			isnull(pv.timber_use, 0) - isnull(pvsc.timber_use, 0),
			isnull(pv.timber_market, 0) - isnull(pvsc.timber_market, 0),
			isnull(pv.ten_percent_cap, 0) - isnull(pvsc.ten_percent_cap, 0),
			isnull(pv.new_val_hs, 0) + isnull(pv.new_val_nhs, 0) - isnull(pvsc.imp_new_val, 0)
		from property_val as pv with(nolock)
		join #rmh_ptd_pvsc_new as pvsc with(nolock) on
			pv.prop_id = pvsc.prop_id
		where
			pv.prop_val_yr = @lYear and
			pv.sup_num = @lSupNum and (
				isnull(pv.imprv_hstd_val, 0) <> isnull(pvsc.imprv_hstd_val, 0) or
				isnull(pv.imprv_non_hstd_val, 0) <> isnull(pvsc.imprv_non_hstd_val, 0) or
				isnull(pv.land_hstd_val, 0) <> isnull(pvsc.land_hstd_val, 0) or
				isnull(pv.land_non_hstd_val, 0) <> isnull(pvsc.land_non_hstd_val, 0) or
				isnull(pv.ag_use_val, 0) <> isnull(pvsc.ag_use_val, 0) or
				isnull(pv.ag_market, 0) <> isnull(pvsc.ag_market, 0) or
				isnull(pv.timber_use, 0) <> isnull(pvsc.timber_use, 0) or
				isnull(pv.timber_market, 0) <> isnull(pvsc.timber_market, 0) or
				isnull(pv.ten_percent_cap, 0) <> isnull(pvsc.ten_percent_cap, 0) or
				(isnull(pv.new_val_hs, 0) + isnull(pv.new_val_nhs, 0)) <> isnull(pvsc.imp_new_val, 0)
			)
	for read only

	open curProps
	fetch next from curProps into
		@lPropID,
		@lDiff_ImprvHS,
		@lDiff_ImprvNHS,
		@lDiff_LandHS,
		@lDiff_LandNHS,
		@lDiff_AgUse,
		@lDiff_AgMarket,
		@lDiff_TimUse,
		@lDiff_TimMarket,
		@lDiff_TenPercentCap,
		@lDiff_ImpNewVal

	while ( @@fetch_status = 0 )
	begin

		set rowcount 1
		/*
			Give the rest to one state code.
			We could give it based on the code itself (ex: certain buckets must have certain codes),
			but since state code errors are possible, just give it to something that already has some in that bucket.

			Note that we must check to see if the value was assigned, and if not,
			then be less discriminate and assign it elsewhere because
			the percentages may be zero but the property_val bucket > 0
		*/

		if ( @lDiff_ImprvHS <> 0 )
		begin
			update property_val_state_cd with(tablockx)
			set
				imprv_hstd_val = isnull(imprv_hstd_val, 0) + @lDiff_ImprvHS
			where
				prop_id = @lPropID and
				prop_val_yr = @lYear and
				sup_num = @lSupNum and
				imprv_hstd_val > 0

			if ( @@rowcount = 0 )
			begin
				update property_val_state_cd with(tablockx)
				set
					imprv_hstd_val = isnull(imprv_hstd_val, 0) + @lDiff_ImprvHS
				where
					prop_id = @lPropID and
					prop_val_yr = @lYear and
					sup_num = @lSupNum
			end
		end

		if ( @lDiff_ImprvNHS <> 0 )
		begin
			update property_val_state_cd with(tablockx)
			set
				imprv_non_hstd_val = isnull(imprv_non_hstd_val, 0) + @lDiff_ImprvNHS
			where
				prop_id = @lPropID and
				prop_val_yr = @lYear and
				sup_num = @lSupNum and
				imprv_non_hstd_val > 0

			if ( @@rowcount = 0 )
			begin
				update property_val_state_cd with(tablockx)
				set
					imprv_non_hstd_val = isnull(imprv_non_hstd_val, 0) + @lDiff_ImprvNHS
				where
					prop_id = @lPropID and
					prop_val_yr = @lYear and
					sup_num = @lSupNum
			end
		end

		if ( @lDiff_LandHS <> 0 )
		begin
			update property_val_state_cd with(tablockx)
			set
				land_hstd_val = isnull(land_hstd_val, 0) + @lDiff_LandHS
			where
				prop_id = @lPropID and
				prop_val_yr = @lYear and
				sup_num = @lSupNum and
				land_hstd_val > 0

			if ( @@rowcount = 0 )
			begin
				update property_val_state_cd with(tablockx)
				set
					land_hstd_val = isnull(land_hstd_val, 0) + @lDiff_LandHS
				where
					prop_id = @lPropID and
					prop_val_yr = @lYear and
					sup_num = @lSupNum
			end
		end

		if ( @lDiff_LandNHS <> 0 )
		begin
			update property_val_state_cd with(tablockx)
			set
				land_non_hstd_val = isnull(land_non_hstd_val, 0) + @lDiff_LandNHS
			where
				prop_id = @lPropID and
				prop_val_yr = @lYear and
				sup_num = @lSupNum and
				land_non_hstd_val > 0

			if ( @@rowcount = 0 )
			begin
				update property_val_state_cd with(tablockx)
				set
					land_non_hstd_val = isnull(land_non_hstd_val, 0) + @lDiff_LandNHS
				where
					prop_id = @lPropID and
					prop_val_yr = @lYear and
					sup_num = @lSupNum
			end
		end

		if ( @lDiff_AgUse <> 0 )
		begin
			update property_val_state_cd with(tablockx)
			set
				ag_use_val = isnull(ag_use_val, 0) + @lDiff_AgUse
			where
				prop_id = @lPropID and
				prop_val_yr = @lYear and
				sup_num = @lSupNum and
				ag_use_val > 0

			if ( @@rowcount = 0 )
			begin
				update property_val_state_cd with(tablockx)
				set
					ag_use_val = isnull(ag_use_val, 0) + @lDiff_AgUse
				where
					prop_id = @lPropID and
					prop_val_yr = @lYear and
					sup_num = @lSupNum
			end
		end

		if ( @lDiff_AgMarket <> 0 )
		begin
			update property_val_state_cd with(tablockx)
			set
				ag_market = isnull(ag_market, 0) + @lDiff_AgMarket
			where
				prop_id = @lPropID and
				prop_val_yr = @lYear and
				sup_num = @lSupNum and
				ag_market > 0

			if ( @@rowcount = 0 )
			begin
				update property_val_state_cd with(tablockx)
				set
					ag_market = isnull(ag_market, 0) + @lDiff_AgMarket
				where
					prop_id = @lPropID and
					prop_val_yr = @lYear and
					sup_num = @lSupNum
			end
		end

		if ( @lDiff_TimUse <> 0 )
		begin
			update property_val_state_cd with(tablockx)
			set
				timber_use = isnull(timber_use, 0) + @lDiff_TimUse
			where
				prop_id = @lPropID and
				prop_val_yr = @lYear and
				sup_num = @lSupNum and
				timber_use > 0

			if ( @@rowcount = 0 )
			begin
				update property_val_state_cd with(tablockx)
				set
					timber_use = isnull(timber_use, 0) + @lDiff_TimUse
				where
					prop_id = @lPropID and
					prop_val_yr = @lYear and
					sup_num = @lSupNum
			end
		end

		if ( @lDiff_TimMarket <> 0 )
		begin
			update property_val_state_cd with(tablockx)
			set
				timber_market = isnull(timber_market, 0) + @lDiff_TimMarket
			where
				prop_id = @lPropID and
				prop_val_yr = @lYear and
				sup_num = @lSupNum and
				timber_market > 0

			if ( @@rowcount = 0 )
			begin
				update property_val_state_cd with(tablockx)
				set
					timber_market = isnull(timber_market, 0) + @lDiff_TimMarket
				where
					prop_id = @lPropID and
					prop_val_yr = @lYear and
					sup_num = @lSupNum
			end
		end

		if ( @lDiff_TenPercentCap <> 0 )
		begin
			update property_val_state_cd with(tablockx)
			set
				ten_percent_cap = isnull(ten_percent_cap, 0) + @lDiff_TenPercentCap
			where
				prop_id = @lPropID and
				prop_val_yr = @lYear and
				sup_num = @lSupNum and
				ten_percent_cap > 0

			if ( @@rowcount = 0 )
			begin
				update property_val_state_cd with(tablockx)
				set
					ten_percent_cap = isnull(ten_percent_cap, 0) + @lDiff_TenPercentCap
				where
					prop_id = @lPropID and
					prop_val_yr = @lYear and
					sup_num = @lSupNum
			end
		end

		if ( @lDiff_ImpNewVal <> 0 )
		begin
			update property_val_state_cd with(tablockx)
			set
				imp_new_val = isnull(imp_new_val, 0) + @lDiff_ImpNewVal
			where
				prop_id = @lPropID and
				prop_val_yr = @lYear and
				sup_num = @lSupNum

			if ( @@rowcount = 0 )
			begin
				update property_val_state_cd with(tablockx)
				set
					imp_new_val = isnull(imp_new_val, 0) + @lDiff_ImpNewVal
				where
					prop_id = @lPropID and
					prop_val_yr = @lYear and
					sup_num = @lSupNum
			end
		end

		fetch next from curProps into
			@lPropID,
			@lDiff_ImprvHS,
			@lDiff_ImprvNHS,
			@lDiff_LandHS,
			@lDiff_LandNHS,
			@lDiff_AgUse,
			@lDiff_AgMarket,
			@lDiff_TimUse,
			@lDiff_TimMarket,
			@lDiff_TenPercentCap,
			@lDiff_ImpNewVal
	end

	close curProps
	deallocate curProps

	set rowcount 0

	/* Now set the overall buckets */
	if ( @bPropList = 1 )
	begin
		update property_val_state_cd with(tablockx)
		set
			market_val =
				isnull(imprv_hstd_val, 0) + isnull(imprv_non_hstd_val, 0) +
				isnull(land_hstd_val, 0) + isnull(land_non_hstd_val, 0) +
				isnull(ag_market, 0) + isnull(timber_market, 0)
			,
			appraised_val =
				isnull(imprv_hstd_val, 0) + isnull(imprv_non_hstd_val, 0) +
				isnull(land_hstd_val, 0) + isnull(land_non_hstd_val, 0) +
				isnull(ag_use_val, 0) + isnull(timber_use, 0)
			,
			assessed_val =
				isnull(imprv_hstd_val, 0) + isnull(imprv_non_hstd_val, 0) +
				isnull(land_hstd_val, 0) + isnull(land_non_hstd_val, 0) +
				isnull(ag_use_val, 0) + isnull(timber_use, 0) - isnull(ten_percent_cap, 0)
			,
			land_new_val = 0
		from property_val_state_cd with(tablockx)
		join property as p with(nolock) on
			property_val_state_cd.prop_id = p.prop_id and
			p.prop_type_cd in ('R','MH')
		where
			property_val_state_cd.prop_val_yr = @lYear and
			property_val_state_cd.sup_num = @lSupNum and
			property_val_state_cd.prop_id in (select t.prop_id from #tmp_props as t with(nolock))
	end
	else
	begin
		update property_val_state_cd with(tablockx)
		set
			market_val =
				isnull(imprv_hstd_val, 0) + isnull(imprv_non_hstd_val, 0) +
				isnull(land_hstd_val, 0) + isnull(land_non_hstd_val, 0) +
				isnull(ag_market, 0) + isnull(timber_market, 0)
			,
			appraised_val =
				isnull(imprv_hstd_val, 0) + isnull(imprv_non_hstd_val, 0) +
				isnull(land_hstd_val, 0) + isnull(land_non_hstd_val, 0) +
				isnull(ag_use_val, 0) + isnull(timber_use, 0)
			,
			assessed_val =
				isnull(imprv_hstd_val, 0) + isnull(imprv_non_hstd_val, 0) +
				isnull(land_hstd_val, 0) + isnull(land_non_hstd_val, 0) +
				isnull(ag_use_val, 0) + isnull(timber_use, 0) - isnull(ten_percent_cap, 0)
			,
			land_new_val = 0
		from property_val_state_cd with(tablockx)
		join property as p with(nolock) on
			property_val_state_cd.prop_id = p.prop_id and
			p.prop_type_cd in ('R','MH')
		where
			prop_val_yr = @lYear and
			sup_num = @lSupNum
	end

	/**************************************************************************/
	/* End - Real / Mobile Home */
	/**************************************************************************/

	/**************************************************************************/
	/* Begin - Personal / Auto */
	/**************************************************************************/

	/* This table represents a "property_val similar" table that is built from property_val_state_cd */

	create table #pa_ptd_pvsc
	(
		prop_id int not null,
		personal_val numeric(14,0) null,
		pp_new_val numeric(14,0) null,

		primary key clustered (prop_id)
		with fillfactor = 100
	)

	/* One row per property */
	if ( @bPropList = 1 )
	begin
		insert #pa_ptd_pvsc with(tablockx)
		select distinct pvsc.prop_id,
		sum(isnull(pvsc.personal_val,0)),
		sum(isnull(pvsc.pp_new_val,0))
		from property_val_state_cd as pvsc with(nolock)
		join property as p with(nolock) on
			pvsc.prop_id = p.prop_id and
			p.prop_type_cd in ('P','A')
		where
			pvsc.prop_val_yr = @lYear and
			pvsc.sup_num = @lSupNum and
			pvsc.prop_id in (select t.prop_id from #tmp_props as t with(nolock))
		group by pvsc.prop_id
		order by pvsc.prop_id
	end
	else
	begin
		insert #pa_ptd_pvsc with(tablockx)
		select distinct pvsc.prop_id,
		sum(isnull(pvsc.personal_val,0)),
		sum(isnull(pvsc.pp_new_val,0))
		from property_val_state_cd as pvsc with(nolock)
		join property as p with(nolock) on
			pvsc.prop_id = p.prop_id and
			p.prop_type_cd in ('P','A')
		where
			pvsc.prop_val_yr = @lYear and
			pvsc.sup_num = @lSupNum
		group by pvsc.prop_id
		order by pvsc.prop_id
	end

	/* This table will represent what percentage of the total value each state code has in each bucket */

	create table #pa_ptd_pvsc_pct (
		prop_id int not null,
		state_cd char(5) not null,
		pct_personal_val numeric(38,10) null,
		pct_pp_new_val numeric(38,10) null,

		primary key clustered (prop_id, state_cd)
		with fillfactor = 100
	)

	insert #pa_ptd_pvsc_pct with(tablockx)
	select pvsc.prop_id, pvsc.state_cd,
	case
	when ptd.personal_val > 0
	then pvsc.personal_val / ptd.personal_val
	else 0
	end,
	case
	when ptd.pp_new_val > 0
	then pvsc.pp_new_val / ptd.pp_new_val
	else 0
	end
	from property_val_state_cd as pvsc with(nolock)
	join #pa_ptd_pvsc as ptd with(nolock) on
		pvsc.prop_id = ptd.prop_id
	where
		pvsc.prop_val_yr = @lYear and
		pvsc.sup_num = @lSupNum
	order by pvsc.prop_id, pvsc.state_cd

	/*
		This reconciles property_val_state_cd to agree/balance w/ property_val,
		maintaining distribution of all buckets across state codes per the percentages we calculated
	*/

	update property_val_state_cd with(tablockx)
	set
	property_val_state_cd.personal_val = pct.pct_personal_val * isnull(pv.market, 0),
	property_val_state_cd.pp_new_val = pct.pct_pp_new_val * isnull(pv.new_val_p, 0)
	from property_val_state_cd with(tablockx)
	join property_val as pv with(nolock) on
		pv.prop_id = property_val_state_cd.prop_id and
		pv.prop_val_yr = @lYear and
		pv.sup_num = @lSupNum
	join #pa_ptd_pvsc_pct as pct with(nolock) on
		pct.prop_id = property_val_state_cd.prop_id and
		pct.state_cd = property_val_state_cd.state_cd
	where
		property_val_state_cd.prop_val_yr = @lYear and
		property_val_state_cd.sup_num = @lSupNum

	/*
		This table is just like #pa_ptd_pvsc.
		It will be used to verify that the new property_val_state_cd looks good.
	*/
	create table #pa_ptd_pvsc_new
	(
		prop_id int not null,
		personal_val numeric(14,0) null,
		pp_new_val numeric(14,0) null,

		primary key clustered (prop_id)
		with fillfactor = 100
	)

	if ( @bPropList = 1 )
	begin
		insert #pa_ptd_pvsc_new with(tablockx)
		select distinct pvsc.prop_id,
		sum(isnull(pvsc.personal_val,0)),
		sum(isnull(pvsc.pp_new_val,0))
		from property_val_state_cd as pvsc with(nolock)
		join property as p with(nolock) on
			pvsc.prop_id = p.prop_id and
			p.prop_type_cd in ('P','A')
		where
			pvsc.prop_val_yr = @lYear and
			pvsc.sup_num = @lSupNum and
			pvsc.prop_id in (select t.prop_id from #tmp_props as t with(nolock))
		group by pvsc.prop_id
		order by pvsc.prop_id
	end
	else
	begin
		insert #pa_ptd_pvsc_new with(tablockx)
		select distinct pvsc.prop_id,
		sum(isnull(pvsc.personal_val,0)),
		sum(isnull(pvsc.pp_new_val,0))
		from property_val_state_cd as pvsc with(nolock)
		join property as p with(nolock) on
			pvsc.prop_id = p.prop_id and
			p.prop_type_cd in ('P','A')
		where
			pvsc.prop_val_yr = @lYear and
			pvsc.sup_num = @lSupNum
		group by pvsc.prop_id
		order by pvsc.prop_id
	end

	/*
		Due to the possibility that the amounts don't add up correctly (due to multiple state codes),
		find these and assign the remaining values (virtually always < 2 dollars) to one of the state codes
	*/

	declare curProps cursor
	for
		select
			pv.prop_id,
			isnull(pv.market, 0) - isnull(pvsc.personal_val, 0),
			isnull(pv.new_val_p, 0) - isnull(pvsc.pp_new_val, 0)
		from property_val as pv with(nolock)
		join #pa_ptd_pvsc_new as pvsc with(nolock) on
			pv.prop_id = pvsc.prop_id
		where
			pv.prop_val_yr = @lYear and
			pv.sup_num = @lSupNum and (
				isnull(pv.market, 0) <> isnull(pvsc.personal_val, 0) or
				isnull(pv.new_val_p, 0) <> isnull(pvsc.pp_new_val, 0)
			)
	for read only

	open curProps
	fetch next from curProps into
		@lPropID,
		@lDiff_Personal,
		@lDiff_PPNew

	while ( @@fetch_status = 0 )
	begin

		set rowcount 1
		/*
			Give the rest to one state code.
			We could give it based on the code itself (ex: certain buckets must have certain codes),
			but since state code errors are possible, just give it to something that already has some in that bucket.

			Note that we must check to see if the value was assigned, and if not,
			then be less discriminate and assign it elsewhere because
			the percentages may be zero but the property_val bucket > 0
		*/

		if ( @lDiff_Personal <> 0 )
		begin
			update property_val_state_cd with(tablockx)
			set
				personal_val = isnull(personal_val, 0) + @lDiff_Personal
			where
				prop_id = @lPropID and
				prop_val_yr = @lYear and
				sup_num = @lSupNum and
				personal_val > 0

			if ( @@rowcount = 0 )
			begin
				update property_val_state_cd with(tablockx)
				set
					personal_val = isnull(personal_val, 0) + @lDiff_Personal
				where
					prop_id = @lPropID and
					prop_val_yr = @lYear and
					sup_num = @lSupNum
			end
		end

		if ( @lDiff_PPNew <> 0 )
		begin
			update property_val_state_cd with(tablockx)
			set
				pp_new_val = isnull(pp_new_val, 0) + @lDiff_PPNew
			where
				prop_id = @lPropID and
				prop_val_yr = @lYear and
				sup_num = @lSupNum and
				pp_new_val > 0

			if ( @@rowcount = 0 )
			begin
				update property_val_state_cd with(tablockx)
				set
					pp_new_val = isnull(pp_new_val, 0) + @lDiff_PPNew
				where
					prop_id = @lPropID and
					prop_val_yr = @lYear and
					sup_num = @lSupNum
			end
		end

		fetch next from curProps into
			@lPropID,
			@lDiff_Personal,
			@lDiff_PPNew
	end

	close curProps
	deallocate curProps

	set rowcount 0

	/* Now set the overall buckets */
	if ( @bPropList = 1 )
	begin
		update property_val_state_cd with(tablockx)
		set
			market_val = isnull(personal_val, 0),
			appraised_val = isnull(personal_val, 0),
			assessed_val = isnull(personal_val, 0)
		from property_val_state_cd with(tablockx)
		join property as p with(nolock) on
			property_val_state_cd.prop_id = p.prop_id and
			p.prop_type_cd in ('P','A')
		where
			property_val_state_cd.prop_val_yr = @lYear and
			property_val_state_cd.sup_num = @lSupNum and
			property_val_state_cd.prop_id in (select t.prop_id from #tmp_props as t with(nolock))
	end
	else
	begin
		update property_val_state_cd with(tablockx)
		set
			market_val = isnull(personal_val, 0),
			appraised_val = isnull(personal_val, 0),
			assessed_val = isnull(personal_val, 0)
		from property_val_state_cd with(tablockx)
		join property as p with(nolock) on
			property_val_state_cd.prop_id = p.prop_id and
			p.prop_type_cd in ('P','A')
		where
			prop_val_yr = @lYear and
			sup_num = @lSupNum
	end

	/**************************************************************************/
	/* End - Personal / Auto */
	/**************************************************************************/

	/**************************************************************************/
	/* Begin - Mineral */
	/**************************************************************************/

	/* Since minerals only have one row, we can do a single update */
	if ( @bPropList = 1 )
	begin
		update property_val_state_cd with(tablockx)
		set
			property_val_state_cd.market_val = pv.market,
			property_val_state_cd.appraised_val = pv.appraised_val,
			property_val_state_cd.assessed_val = pv.assessed_val,
			property_val_state_cd.personal_val = case
				when property_val_state_cd.state_cd like 'G%'
				then 0
				else pv.assessed_val
			end,
			property_val_state_cd.mineral_val = case
				when property_val_state_cd.state_cd like 'G%'
				then pv.assessed_val
				else 0
			end
		from property_val_state_cd with(tablockx)
		join property as p with(nolock) on
			property_val_state_cd.prop_id = p.prop_id and
			p.prop_type_cd = 'MN'
		join property_val as pv with(nolock) on
			property_val_state_cd.prop_id = pv.prop_id and
			pv.prop_val_yr = @lYear and
			pv.sup_num = @lSupNum
		where
			property_val_state_cd.prop_val_yr = @lYear and
			property_val_state_cd.sup_num = @lSupNum and
			property_val_state_cd.prop_id in (select t.prop_id from #tmp_props as t with(nolock))
	end
	else
	begin
		update property_val_state_cd with(tablockx)
		set
			property_val_state_cd.market_val = pv.market,
			property_val_state_cd.appraised_val = pv.appraised_val,
			property_val_state_cd.assessed_val = pv.assessed_val,
			property_val_state_cd.personal_val = case
				when property_val_state_cd.state_cd like 'G%'
				then 0
				else pv.assessed_val
			end,
			property_val_state_cd.mineral_val = case
				when property_val_state_cd.state_cd like 'G%'
				then pv.assessed_val
				else 0
			end
		from property_val_state_cd with(tablockx)
		join property as p with(nolock) on
			property_val_state_cd.prop_id = p.prop_id and
			p.prop_type_cd = 'MN'
		join property_val as pv with(nolock) on
			property_val_state_cd.prop_id = pv.prop_id and
			pv.prop_val_yr = @lYear and
			pv.sup_num = @lSupNum
		where
			property_val_state_cd.prop_val_yr = @lYear and
			property_val_state_cd.sup_num = @lSupNum
	end

	/**************************************************************************/
	/* End - Mineral */
	/**************************************************************************/

	/**************************************************************************/
	/**************************************************************************/
	/* End - property_val_state_cd (SPTB code) */
	/**************************************************************************/
	/**************************************************************************/




	/**************************************************************************/
	/**************************************************************************/
	/* Begin - property_val_cad_state_cd (CAD code) */
	/**************************************************************************/
	/**************************************************************************/

	/**************************************************************************/
	/* Begin - Real / Mobile Home */
	/**************************************************************************/

	/* This table represents a "property_val similar" table that is built from property_val_cad_state_cd */

	create table #rmh_ptd_pvcsc
	(
		prop_id int not null,
		imprv_hstd_val numeric(14,0) null,
		imprv_non_hstd_val numeric(14,0) null,
		land_hstd_val numeric(14,0) null,
		land_non_hstd_val numeric(14,0) null,
		ag_use_val numeric(14,0) null,
		ag_market numeric(14,0) null,
		timber_use numeric(14,0) null,
		timber_market numeric(14,0) null,
		ten_percent_cap numeric(14,0) null,
		imp_new_val numeric(14,0) null,

		primary key clustered (prop_id)
		with fillfactor = 100
	)

	/* One row per property */
	if ( @bPropList = 1 )
	begin
		insert #rmh_ptd_pvcsc with(tablockx)
		select distinct pvcsc.prop_id,
		sum(isnull(pvcsc.imprv_hstd_val,0)),
		sum(isnull(pvcsc.imprv_non_hstd_val,0)),
		sum(isnull(pvcsc.land_hstd_val,0)),
		sum(isnull(pvcsc.land_non_hstd_val,0)),
		sum(isnull(pvcsc.ag_use_val,0)),
		sum(isnull(pvcsc.ag_market,0)),
		sum(isnull(pvcsc.timber_use,0)),
		sum(isnull(pvcsc.timber_market,0)),
		sum(isnull(pvcsc.ten_percent_cap,0)),
		sum(isnull(pvcsc.imp_new_val,0))
		from property_val_cad_state_cd as pvcsc with(nolock)
		join property as p with(nolock) on
			pvcsc.prop_id = p.prop_id and
			p.prop_type_cd in ('R','MH')
		where
			pvcsc.prop_val_yr = @lYear and
			pvcsc.sup_num = @lSupNum and
			pvcsc.prop_id in (select t.prop_id from #tmp_props as t with(nolock))
		group by pvcsc.prop_id
		order by pvcsc.prop_id
	end
	else
	begin
		insert #rmh_ptd_pvcsc with(tablockx)
		select distinct pvcsc.prop_id,
		sum(isnull(pvcsc.imprv_hstd_val,0)),
		sum(isnull(pvcsc.imprv_non_hstd_val,0)),
		sum(isnull(pvcsc.land_hstd_val,0)),
		sum(isnull(pvcsc.land_non_hstd_val,0)),
		sum(isnull(pvcsc.ag_use_val,0)),
		sum(isnull(pvcsc.ag_market,0)),
		sum(isnull(pvcsc.timber_use,0)),
		sum(isnull(pvcsc.timber_market,0)),
		sum(isnull(pvcsc.ten_percent_cap,0)),
		sum(isnull(pvcsc.imp_new_val,0))
		from property_val_cad_state_cd as pvcsc with(nolock)
		join property as p with(nolock) on
			pvcsc.prop_id = p.prop_id and
			p.prop_type_cd in ('R','MH')
		where
			pvcsc.prop_val_yr = @lYear and
			pvcsc.sup_num = @lSupNum
		group by pvcsc.prop_id
		order by pvcsc.prop_id
	end

	/* This table will represent what percentage of the total value each state code has in each bucket */

	create table #rmh_ptd_pvcsc_pct (
		prop_id int not null,
		state_cd char(5) not null,
		pct_imprv_hstd_val numeric(38,10) null,
		pct_imprv_non_hstd_val numeric(38,10) null,
		pct_land_hstd_val numeric(38,10) null,
		pct_land_non_hstd_val numeric(38,10) null,
		pct_ag_use_val numeric(38,10) null,
		pct_ag_market numeric(38,10) null,
		pct_timber_use numeric(38,10) null,
		pct_timber_market numeric(38,10) null,
		pct_ten_percent_cap numeric(38,10) null,
		pct_imp_new_val numeric(38,10) null,

		primary key clustered (prop_id, state_cd)
		with fillfactor = 100
	)

	insert #rmh_ptd_pvcsc_pct with(tablockx)
	select pvcsc.prop_id, pvcsc.state_cd,
	case
	when ptd.imprv_hstd_val > 0
	then pvcsc.imprv_hstd_val / ptd.imprv_hstd_val
	else 0
	end,
	case
	when ptd.imprv_non_hstd_val > 0
	then pvcsc.imprv_non_hstd_val / ptd.imprv_non_hstd_val
	else 0
	end,
	case
	when ptd.land_hstd_val > 0
	then pvcsc.land_hstd_val / ptd.land_hstd_val
	else 0
	end,
	case
	when ptd.land_non_hstd_val > 0
	then pvcsc.land_non_hstd_val / ptd.land_non_hstd_val
	else 0
	end,
	case
	when ptd.ag_use_val > 0
	then pvcsc.ag_use_val / ptd.ag_use_val
	else 0
	end,
	case
	when ptd.ag_market > 0
	then pvcsc.ag_market / ptd.ag_market
	else 0
	end,
	case
	when ptd.timber_use > 0
	then pvcsc.timber_use / ptd.timber_use
	else 0
	end,
	case
	when ptd.timber_market > 0
	then pvcsc.timber_market / ptd.timber_market
	else 0
	end,
	case
	when ptd.ten_percent_cap > 0
	then pvcsc.ten_percent_cap / ptd.ten_percent_cap
	else 0
	end,
	case
	when ptd.imp_new_val > 0
	then pvcsc.imp_new_val / ptd.imp_new_val
	else 0
	end
	from property_val_cad_state_cd as pvcsc with(nolock)
	join #rmh_ptd_pvcsc as ptd with(nolock) on
		pvcsc.prop_id = ptd.prop_id
	where
		pvcsc.prop_val_yr = @lYear and
		pvcsc.sup_num = @lSupNum
	order by pvcsc.prop_id, pvcsc.state_cd

	/*
		This reconciles property_val_cad_state_cd to agree/balance w/ property_val,
		maintaining distribution of all buckets across state codes per the percentages we calculated
	*/

	update property_val_cad_state_cd with(tablockx)
	set
	property_val_cad_state_cd.imprv_hstd_val = pct.pct_imprv_hstd_val * isnull(pv.imprv_hstd_val, 0),
	property_val_cad_state_cd.imprv_non_hstd_val = pct.pct_imprv_non_hstd_val * isnull(pv.imprv_non_hstd_val, 0),
	property_val_cad_state_cd.land_hstd_val = pct.pct_land_hstd_val * isnull(pv.land_hstd_val, 0),
	property_val_cad_state_cd.land_non_hstd_val = pct.pct_land_non_hstd_val * isnull(pv.land_non_hstd_val, 0),
	property_val_cad_state_cd.ag_use_val = pct.pct_ag_use_val * isnull(pv.ag_use_val, 0),
	property_val_cad_state_cd.ag_market = pct.pct_ag_market * isnull(pv.ag_market, 0),
	property_val_cad_state_cd.timber_use = pct.pct_timber_use * isnull(pv.timber_use, 0),
	property_val_cad_state_cd.timber_market = pct.pct_timber_market * isnull(pv.timber_market, 0),
	property_val_cad_state_cd.ten_percent_cap = pct.pct_ten_percent_cap * isnull(pv.ten_percent_cap, 0),
	property_val_cad_state_cd.imp_new_val = pct.pct_imp_new_val * (isnull(pv.new_val_hs, 0) + isnull(pv.new_val_nhs, 0))
	from property_val_cad_state_cd with(tablockx)
	join property_val as pv with(nolock) on
		pv.prop_id = property_val_cad_state_cd.prop_id and
		pv.prop_val_yr = @lYear and
		pv.sup_num = @lSupNum
	join #rmh_ptd_pvcsc_pct as pct with(nolock) on
		pct.prop_id = property_val_cad_state_cd.prop_id and
		pct.state_cd = property_val_cad_state_cd.state_cd
	where
		property_val_cad_state_cd.prop_val_yr = @lYear and
		property_val_cad_state_cd.sup_num = @lSupNum

	/*
		This table is just like #rmh_ptd_pvcsc.
		It will be used to verify that the new property_val_cad_state_cd looks good.
	*/
	create table #rmh_ptd_pvcsc_new
	(
		prop_id int not null,
		imprv_hstd_val numeric(14,0) null,
		imprv_non_hstd_val numeric(14,0) null,
		land_hstd_val numeric(14,0) null,
		land_non_hstd_val numeric(14,0) null,
		ag_use_val numeric(14,0) null,
		ag_market numeric(14,0) null,
		timber_use numeric(14,0) null,
		timber_market numeric(14,0) null,
		ten_percent_cap numeric(14,0) null,
		imp_new_val numeric(14,0) null,

		primary key clustered (prop_id)
		with fillfactor = 100
	)

	if ( @bPropList = 1 )
	begin
		insert #rmh_ptd_pvcsc_new with(tablockx)
		select distinct pvcsc.prop_id,
		sum(isnull(pvcsc.imprv_hstd_val,0)),
		sum(isnull(pvcsc.imprv_non_hstd_val,0)),
		sum(isnull(pvcsc.land_hstd_val,0)),
		sum(isnull(pvcsc.land_non_hstd_val,0)),
		sum(isnull(pvcsc.ag_use_val,0)),
		sum(isnull(pvcsc.ag_market,0)),
		sum(isnull(pvcsc.timber_use,0)),
		sum(isnull(pvcsc.timber_market,0)),
		sum(isnull(pvcsc.ten_percent_cap,0)),
		sum(isnull(pvcsc.imp_new_val,0))
		from property_val_cad_state_cd as pvcsc with(nolock)
		join property as p with(nolock) on
			pvcsc.prop_id = p.prop_id and
			p.prop_type_cd in ('R','MH')
		where
			pvcsc.prop_val_yr = @lYear and
			pvcsc.sup_num = @lSupNum and
			pvcsc.prop_id in (select t.prop_id from #tmp_props as t with(nolock))
		group by pvcsc.prop_id
		order by pvcsc.prop_id
	end
	else
	begin
		insert #rmh_ptd_pvcsc_new with(tablockx)
		select distinct pvcsc.prop_id,
		sum(isnull(pvcsc.imprv_hstd_val,0)),
		sum(isnull(pvcsc.imprv_non_hstd_val,0)),
		sum(isnull(pvcsc.land_hstd_val,0)),
		sum(isnull(pvcsc.land_non_hstd_val,0)),
		sum(isnull(pvcsc.ag_use_val,0)),
		sum(isnull(pvcsc.ag_market,0)),
		sum(isnull(pvcsc.timber_use,0)),
		sum(isnull(pvcsc.timber_market,0)),
		sum(isnull(pvcsc.ten_percent_cap,0)),
		sum(isnull(pvcsc.imp_new_val,0))
		from property_val_cad_state_cd as pvcsc with(nolock)
		join property as p with(nolock) on
			pvcsc.prop_id = p.prop_id and
			p.prop_type_cd in ('R','MH')
		where
			pvcsc.prop_val_yr = @lYear and
			pvcsc.sup_num = @lSupNum
		group by pvcsc.prop_id
		order by pvcsc.prop_id
	end

	/*
		Due to the possibility that the amounts don't add up correctly (due to multiple state codes),
		find these and assign the remaining values (virtually always < 2 dollars) to one of the state codes
	*/

	declare curProps cursor
	for
		select
			pv.prop_id,
			isnull(pv.imprv_hstd_val, 0) - isnull(pvcsc.imprv_hstd_val, 0),
			isnull(pv.imprv_non_hstd_val, 0) - isnull(pvcsc.imprv_non_hstd_val, 0),
			isnull(pv.land_hstd_val, 0) - isnull(pvcsc.land_hstd_val, 0),
			isnull(pv.land_non_hstd_val, 0) - isnull(pvcsc.land_non_hstd_val, 0),
			isnull(pv.ag_use_val, 0) - isnull(pvcsc.ag_use_val, 0),
			isnull(pv.ag_market, 0) - isnull(pvcsc.ag_market, 0),
			isnull(pv.timber_use, 0) - isnull(pvcsc.timber_use, 0),
			isnull(pv.timber_market, 0) - isnull(pvcsc.timber_market, 0),
			isnull(pv.ten_percent_cap, 0) - isnull(pvcsc.ten_percent_cap, 0),
			isnull(pv.new_val_hs, 0) + isnull(pv.new_val_nhs, 0) - isnull(pvcsc.imp_new_val, 0)
		from property_val as pv with(nolock)
		join #rmh_ptd_pvcsc_new as pvcsc with(nolock) on
			pv.prop_id = pvcsc.prop_id
		where
			pv.prop_val_yr = @lYear and
			pv.sup_num = @lSupNum and (
				isnull(pv.imprv_hstd_val, 0) <> isnull(pvcsc.imprv_hstd_val, 0) or
				isnull(pv.imprv_non_hstd_val, 0) <> isnull(pvcsc.imprv_non_hstd_val, 0) or
				isnull(pv.land_hstd_val, 0) <> isnull(pvcsc.land_hstd_val, 0) or
				isnull(pv.land_non_hstd_val, 0) <> isnull(pvcsc.land_non_hstd_val, 0) or
				isnull(pv.ag_use_val, 0) <> isnull(pvcsc.ag_use_val, 0) or
				isnull(pv.ag_market, 0) <> isnull(pvcsc.ag_market, 0) or
				isnull(pv.timber_use, 0) <> isnull(pvcsc.timber_use, 0) or
				isnull(pv.timber_market, 0) <> isnull(pvcsc.timber_market, 0) or
				isnull(pv.ten_percent_cap, 0) <> isnull(pvcsc.ten_percent_cap, 0) or
				(isnull(pv.new_val_hs, 0) + isnull(pv.new_val_nhs, 0)) <> isnull(pvcsc.imp_new_val, 0)
			)
	for read only

	open curProps
	fetch next from curProps into
		@lPropID,
		@lDiff_ImprvHS,
		@lDiff_ImprvNHS,
		@lDiff_LandHS,
		@lDiff_LandNHS,
		@lDiff_AgUse,
		@lDiff_AgMarket,
		@lDiff_TimUse,
		@lDiff_TimMarket,
		@lDiff_TenPercentCap,
		@lDiff_ImpNewVal

	while ( @@fetch_status = 0 )
	begin

		set rowcount 1
		/*
			Give the rest to one state code.
			We could give it based on the code itself (ex: certain buckets must have certain codes),
			but since state code errors are possible, just give it to something that already has some in that bucket.

			Note that we must check to see if the value was assigned, and if not,
			then be less discriminate and assign it elsewhere because
			the percentages may be zero but the property_val bucket > 0
		*/

		if ( @lDiff_ImprvHS <> 0 )
		begin
			update property_val_cad_state_cd with(tablockx)
			set
				imprv_hstd_val = isnull(imprv_hstd_val, 0) + @lDiff_ImprvHS
			where
				prop_id = @lPropID and
				prop_val_yr = @lYear and
				sup_num = @lSupNum and
				imprv_hstd_val > 0

			if ( @@rowcount = 0 )
			begin
				update property_val_cad_state_cd with(tablockx)
				set
					imprv_hstd_val = isnull(imprv_hstd_val, 0) + @lDiff_ImprvHS
				where
					prop_id = @lPropID and
					prop_val_yr = @lYear and
					sup_num = @lSupNum
			end
		end

		if ( @lDiff_ImprvNHS <> 0 )
		begin
			update property_val_cad_state_cd with(tablockx)
			set
				imprv_non_hstd_val = isnull(imprv_non_hstd_val, 0) + @lDiff_ImprvNHS
			where
				prop_id = @lPropID and
				prop_val_yr = @lYear and
				sup_num = @lSupNum and
				imprv_non_hstd_val > 0

			if ( @@rowcount = 0 )
			begin
				update property_val_cad_state_cd with(tablockx)
				set
					imprv_non_hstd_val = isnull(imprv_non_hstd_val, 0) + @lDiff_ImprvNHS
				where
					prop_id = @lPropID and
					prop_val_yr = @lYear and
					sup_num = @lSupNum
			end
		end

		if ( @lDiff_LandHS <> 0 )
		begin
			update property_val_cad_state_cd with(tablockx)
			set
				land_hstd_val = isnull(land_hstd_val, 0) + @lDiff_LandHS
			where
				prop_id = @lPropID and
				prop_val_yr = @lYear and
				sup_num = @lSupNum and
				land_hstd_val > 0

			if ( @@rowcount = 0 )
			begin
				update property_val_cad_state_cd with(tablockx)
				set
					land_hstd_val = isnull(land_hstd_val, 0) + @lDiff_LandHS
				where
					prop_id = @lPropID and
					prop_val_yr = @lYear and
					sup_num = @lSupNum
			end
		end

		if ( @lDiff_LandNHS <> 0 )
		begin
			update property_val_cad_state_cd with(tablockx)
			set
				land_non_hstd_val = isnull(land_non_hstd_val, 0) + @lDiff_LandNHS
			where
				prop_id = @lPropID and
				prop_val_yr = @lYear and
				sup_num = @lSupNum and
				land_non_hstd_val > 0

			if ( @@rowcount = 0 )
			begin
				update property_val_cad_state_cd with(tablockx)
				set
					land_non_hstd_val = isnull(land_non_hstd_val, 0) + @lDiff_LandNHS
				where
					prop_id = @lPropID and
					prop_val_yr = @lYear and
					sup_num = @lSupNum
			end
		end

		if ( @lDiff_AgUse <> 0 )
		begin
			update property_val_cad_state_cd with(tablockx)
			set
				ag_use_val = isnull(ag_use_val, 0) + @lDiff_AgUse
			where
				prop_id = @lPropID and
				prop_val_yr = @lYear and
				sup_num = @lSupNum and
				ag_use_val > 0

			if ( @@rowcount = 0 )
			begin
				update property_val_cad_state_cd with(tablockx)
				set
					ag_use_val = isnull(ag_use_val, 0) + @lDiff_AgUse
				where
					prop_id = @lPropID and
					prop_val_yr = @lYear and
					sup_num = @lSupNum
			end
		end

		if ( @lDiff_AgMarket <> 0 )
		begin
			update property_val_cad_state_cd with(tablockx)
			set
				ag_market = isnull(ag_market, 0) + @lDiff_AgMarket
			where
				prop_id = @lPropID and
				prop_val_yr = @lYear and
				sup_num = @lSupNum and
				ag_market > 0

			if ( @@rowcount = 0 )
			begin
				update property_val_cad_state_cd with(tablockx)
				set
					ag_market = isnull(ag_market, 0) + @lDiff_AgMarket
				where
					prop_id = @lPropID and
					prop_val_yr = @lYear and
					sup_num = @lSupNum
			end
		end

		if ( @lDiff_TimUse <> 0 )
		begin
			update property_val_cad_state_cd with(tablockx)
			set
				timber_use = isnull(timber_use, 0) + @lDiff_TimUse
			where
				prop_id = @lPropID and
				prop_val_yr = @lYear and
				sup_num = @lSupNum and
				timber_use > 0

			if ( @@rowcount = 0 )
			begin
				update property_val_cad_state_cd with(tablockx)
				set
					timber_use = isnull(timber_use, 0) + @lDiff_TimUse
				where
					prop_id = @lPropID and
					prop_val_yr = @lYear and
					sup_num = @lSupNum
			end
		end

		if ( @lDiff_TimMarket <> 0 )
		begin
			update property_val_cad_state_cd with(tablockx)
			set
				timber_market = isnull(timber_market, 0) + @lDiff_TimMarket
			where
				prop_id = @lPropID and
				prop_val_yr = @lYear and
				sup_num = @lSupNum and
				timber_market > 0

			if ( @@rowcount = 0 )
			begin
				update property_val_cad_state_cd with(tablockx)
				set
					timber_market = isnull(timber_market, 0) + @lDiff_TimMarket
				where
					prop_id = @lPropID and
					prop_val_yr = @lYear and
					sup_num = @lSupNum
			end
		end

		if ( @lDiff_TenPercentCap <> 0 )
		begin
			update property_val_cad_state_cd with(tablockx)
			set
				ten_percent_cap = isnull(ten_percent_cap, 0) + @lDiff_TenPercentCap
			where
				prop_id = @lPropID and
				prop_val_yr = @lYear and
				sup_num = @lSupNum and
				ten_percent_cap > 0

			if ( @@rowcount = 0 )
			begin
				update property_val_cad_state_cd with(tablockx)
				set
					ten_percent_cap = isnull(ten_percent_cap, 0) + @lDiff_TenPercentCap
				where
					prop_id = @lPropID and
					prop_val_yr = @lYear and
					sup_num = @lSupNum
			end
		end

		if ( @lDiff_ImpNewVal <> 0 )
		begin
			update property_val_cad_state_cd with(tablockx)
			set
				imp_new_val = isnull(imp_new_val, 0) + @lDiff_ImpNewVal
			where
				prop_id = @lPropID and
				prop_val_yr = @lYear and
				sup_num = @lSupNum

			if ( @@rowcount = 0 )
			begin
				update property_val_cad_state_cd with(tablockx)
				set
					imp_new_val = isnull(imp_new_val, 0) + @lDiff_ImpNewVal
				where
					prop_id = @lPropID and
					prop_val_yr = @lYear and
					sup_num = @lSupNum
			end
		end

		fetch next from curProps into
			@lPropID,
			@lDiff_ImprvHS,
			@lDiff_ImprvNHS,
			@lDiff_LandHS,
			@lDiff_LandNHS,
			@lDiff_AgUse,
			@lDiff_AgMarket,
			@lDiff_TimUse,
			@lDiff_TimMarket,
			@lDiff_TenPercentCap,
			@lDiff_ImpNewVal
	end

	close curProps
	deallocate curProps

	set rowcount 0

	/* Now set the overall buckets */
	if ( @bPropList = 1 )
	begin
		update property_val_cad_state_cd with(tablockx)
		set
			market_val =
				isnull(imprv_hstd_val, 0) + isnull(imprv_non_hstd_val, 0) +
				isnull(land_hstd_val, 0) + isnull(land_non_hstd_val, 0) +
				isnull(ag_market, 0) + isnull(timber_market, 0)
			,
			appraised_val =
				isnull(imprv_hstd_val, 0) + isnull(imprv_non_hstd_val, 0) +
				isnull(land_hstd_val, 0) + isnull(land_non_hstd_val, 0) +
				isnull(ag_use_val, 0) + isnull(timber_use, 0)
			,
			assessed_val =
				isnull(imprv_hstd_val, 0) + isnull(imprv_non_hstd_val, 0) +
				isnull(land_hstd_val, 0) + isnull(land_non_hstd_val, 0) +
				isnull(ag_use_val, 0) + isnull(timber_use, 0) - isnull(ten_percent_cap, 0)
			,
			land_new_val = 0
		from property_val_cad_state_cd with(tablockx)
		join property as p with(nolock) on
			property_val_cad_state_cd.prop_id = p.prop_id and
			p.prop_type_cd in ('R','MH')
		where
			property_val_cad_state_cd.prop_val_yr = @lYear and
			property_val_cad_state_cd.sup_num = @lSupNum and
			property_val_cad_state_cd.prop_id in (select t.prop_id from #tmp_props as t with(nolock))
	end
	else
	begin
		update property_val_cad_state_cd with(tablockx)
		set
			market_val =
				isnull(imprv_hstd_val, 0) + isnull(imprv_non_hstd_val, 0) +
				isnull(land_hstd_val, 0) + isnull(land_non_hstd_val, 0) +
				isnull(ag_market, 0) + isnull(timber_market, 0)
			,
			appraised_val =
				isnull(imprv_hstd_val, 0) + isnull(imprv_non_hstd_val, 0) +
				isnull(land_hstd_val, 0) + isnull(land_non_hstd_val, 0) +
				isnull(ag_use_val, 0) + isnull(timber_use, 0)
			,
			assessed_val =
				isnull(imprv_hstd_val, 0) + isnull(imprv_non_hstd_val, 0) +
				isnull(land_hstd_val, 0) + isnull(land_non_hstd_val, 0) +
				isnull(ag_use_val, 0) + isnull(timber_use, 0) - isnull(ten_percent_cap, 0)
			,
			land_new_val = 0
		from property_val_cad_state_cd with(tablockx)
		join property as p with(nolock) on
			property_val_cad_state_cd.prop_id = p.prop_id and
			p.prop_type_cd in ('R','MH')
		where
			prop_val_yr = @lYear and
			sup_num = @lSupNum
	end

	/**************************************************************************/
	/* End - Real / Mobile Home */
	/**************************************************************************/

	/**************************************************************************/
	/* Begin - Personal / Auto */
	/**************************************************************************/

	/* This table represents a "property_val similar" table that is built from property_val_cad_state_cd */

	create table #pa_ptd_pvcsc
	(
		prop_id int not null,
		personal_val numeric(14,0) null,
		pp_new_val numeric(14,0) null,

		primary key clustered (prop_id)
		with fillfactor = 100
	)

	/* One row per property */
	if ( @bPropList = 1 )
	begin
		insert #pa_ptd_pvcsc with(tablockx)
		select distinct pvcsc.prop_id,
		sum(isnull(pvcsc.personal_val,0)),
		sum(isnull(pvcsc.pp_new_val,0))
		from property_val_cad_state_cd as pvcsc with(nolock)
		join property as p with(nolock) on
			pvcsc.prop_id = p.prop_id and
			p.prop_type_cd in ('P','A')
		where
			pvcsc.prop_val_yr = @lYear and
			pvcsc.sup_num = @lSupNum and
			pvcsc.prop_id in (select t.prop_id from #tmp_props as t with(nolock))
		group by pvcsc.prop_id
		order by pvcsc.prop_id
	end
	else
	begin
		insert #pa_ptd_pvcsc with(tablockx)
		select distinct pvcsc.prop_id,
		sum(isnull(pvcsc.personal_val,0)),
		sum(isnull(pvcsc.pp_new_val,0))
		from property_val_cad_state_cd as pvcsc with(nolock)
		join property as p with(nolock) on
			pvcsc.prop_id = p.prop_id and
			p.prop_type_cd in ('P','A')
		where
			pvcsc.prop_val_yr = @lYear and
			pvcsc.sup_num = @lSupNum
		group by pvcsc.prop_id
		order by pvcsc.prop_id
	end

	/* This table will represent what percentage of the total value each state code has in each bucket */

	create table #pa_ptd_pvcsc_pct (
		prop_id int not null,
		state_cd char(5) not null,
		pct_personal_val numeric(38,10) null,
		pct_pp_new_val numeric(38,10) null,

		primary key clustered (prop_id, state_cd)
		with fillfactor = 100
	)

	insert #pa_ptd_pvcsc_pct with(tablockx)
	select pvcsc.prop_id, pvcsc.state_cd,
	case
	when ptd.personal_val > 0
	then pvcsc.personal_val / ptd.personal_val
	else 0
	end,
	case
	when ptd.pp_new_val > 0
	then pvcsc.pp_new_val / ptd.pp_new_val
	else 0
	end
	from property_val_cad_state_cd as pvcsc with(nolock)
	join #pa_ptd_pvcsc as ptd with(nolock) on
		pvcsc.prop_id = ptd.prop_id
	where
		pvcsc.prop_val_yr = @lYear and
		pvcsc.sup_num = @lSupNum
	order by pvcsc.prop_id, pvcsc.state_cd

	/*
		This reconciles property_val_cad_state_cd to agree/balance w/ property_val,
		maintaining distribution of all buckets across state codes per the percentages we calculated
	*/

	update property_val_cad_state_cd with(tablockx)
	set
	property_val_cad_state_cd.personal_val = pct.pct_personal_val * isnull(pv.market, 0),
	property_val_cad_state_cd.pp_new_val = pct.pct_pp_new_val * isnull(pv.new_val_p, 0)
	from property_val_cad_state_cd with(tablockx)
	join property_val as pv with(nolock) on
		pv.prop_id = property_val_cad_state_cd.prop_id and
		pv.prop_val_yr = @lYear and
		pv.sup_num = @lSupNum
	join #pa_ptd_pvcsc_pct as pct with(nolock) on
		pct.prop_id = property_val_cad_state_cd.prop_id and
		pct.state_cd = property_val_cad_state_cd.state_cd
	where
		property_val_cad_state_cd.prop_val_yr = @lYear and
		property_val_cad_state_cd.sup_num = @lSupNum

	/*
		This table is just like #pa_ptd_pvcsc.
		It will be used to verify that the new property_val_cad_state_cd looks good.
	*/
	create table #pa_ptd_pvcsc_new
	(
		prop_id int not null,
		personal_val numeric(14,0) null,
		pp_new_val numeric(14,0) null,

		primary key clustered (prop_id)
		with fillfactor = 100
	)

	if ( @bPropList = 1 )
	begin
		insert #pa_ptd_pvcsc_new with(tablockx)
		select distinct pvcsc.prop_id,
		sum(isnull(pvcsc.personal_val,0)),
		sum(isnull(pvcsc.pp_new_val,0))
		from property_val_cad_state_cd as pvcsc with(nolock)
		join property as p with(nolock) on
			pvcsc.prop_id = p.prop_id and
			p.prop_type_cd in ('P','A')
		where
			pvcsc.prop_val_yr = @lYear and
			pvcsc.sup_num = @lSupNum and
			pvcsc.prop_id in (select t.prop_id from #tmp_props as t with(nolock))
		group by pvcsc.prop_id
		order by pvcsc.prop_id
	end
	else
	begin
		insert #pa_ptd_pvcsc_new with(tablockx)
		select distinct pvcsc.prop_id,
		sum(isnull(pvcsc.personal_val,0)),
		sum(isnull(pvcsc.pp_new_val,0))
		from property_val_cad_state_cd as pvcsc with(nolock)
		join property as p with(nolock) on
			pvcsc.prop_id = p.prop_id and
			p.prop_type_cd in ('P','A')
		where
			pvcsc.prop_val_yr = @lYear and
			pvcsc.sup_num = @lSupNum
		group by pvcsc.prop_id
		order by pvcsc.prop_id
	end

	/*
		Due to the possibility that the amounts don't add up correctly (due to multiple state codes),
		find these and assign the remaining values (virtually always < 2 dollars) to one of the state codes
	*/

	declare curProps cursor
	for
		select
			pv.prop_id,
			isnull(pv.market, 0) - isnull(pvcsc.personal_val, 0),
			isnull(pv.new_val_p, 0) - isnull(pvcsc.pp_new_val, 0)
		from property_val as pv with(nolock)
		join #pa_ptd_pvcsc_new as pvcsc with(nolock) on
			pv.prop_id = pvcsc.prop_id
		where
			pv.prop_val_yr = @lYear and
			pv.sup_num = @lSupNum and (
				isnull(pv.market, 0) <> isnull(pvcsc.personal_val, 0) or
				isnull(pv.new_val_p, 0) <> isnull(pvcsc.pp_new_val, 0)
			)
	for read only

	open curProps
	fetch next from curProps into
		@lPropID,
		@lDiff_Personal,
		@lDiff_PPNew

	while ( @@fetch_status = 0 )
	begin

		set rowcount 1
		/*
			Give the rest to one state code.
			We could give it based on the code itself (ex: certain buckets must have certain codes),
			but since state code errors are possible, just give it to something that already has some in that bucket.

			Note that we must check to see if the value was assigned, and if not,
			then be less discriminate and assign it elsewhere because
			the percentages may be zero but the property_val bucket > 0
		*/

		if ( @lDiff_Personal <> 0 )
		begin
			update property_val_cad_state_cd with(tablockx)
			set
				personal_val = isnull(personal_val, 0) + @lDiff_Personal
			where
				prop_id = @lPropID and
				prop_val_yr = @lYear and
				sup_num = @lSupNum and
				personal_val > 0

			if ( @@rowcount = 0 )
			begin
				update property_val_cad_state_cd with(tablockx)
				set
					personal_val = isnull(personal_val, 0) + @lDiff_Personal
				where
					prop_id = @lPropID and
					prop_val_yr = @lYear and
					sup_num = @lSupNum
			end
		end

		if ( @lDiff_PPNew <> 0 )
		begin
			update property_val_cad_state_cd with(tablockx)
			set
				pp_new_val = isnull(pp_new_val, 0) + @lDiff_PPNew
			where
				prop_id = @lPropID and
				prop_val_yr = @lYear and
				sup_num = @lSupNum and
				pp_new_val > 0

			if ( @@rowcount = 0 )
			begin
				update property_val_cad_state_cd with(tablockx)
				set
					pp_new_val = isnull(pp_new_val, 0) + @lDiff_PPNew
				where
					prop_id = @lPropID and
					prop_val_yr = @lYear and
					sup_num = @lSupNum
			end
		end

		fetch next from curProps into
			@lPropID,
			@lDiff_Personal,
			@lDiff_PPNew
	end

	close curProps
	deallocate curProps

	set rowcount 0

	/* Now set the overall buckets */
	if ( @bPropList = 1 )
	begin
		update property_val_cad_state_cd with(tablockx)
		set
			market_val = isnull(personal_val, 0),
			appraised_val = isnull(personal_val, 0),
			assessed_val = isnull(personal_val, 0)
		from property_val_cad_state_cd with(tablockx)
		join property as p with(nolock) on
			property_val_cad_state_cd.prop_id = p.prop_id and
			p.prop_type_cd in ('P','A')
		where
			property_val_cad_state_cd.prop_val_yr = @lYear and
			property_val_cad_state_cd.sup_num = @lSupNum and
			property_val_cad_state_cd.prop_id in (select t.prop_id from #tmp_props as t with(nolock))
	end
	else
	begin
		update property_val_cad_state_cd with(tablockx)
		set
			market_val = isnull(personal_val, 0),
			appraised_val = isnull(personal_val, 0),
			assessed_val = isnull(personal_val, 0)
		from property_val_cad_state_cd with(tablockx)
		join property as p with(nolock) on
			property_val_cad_state_cd.prop_id = p.prop_id and
			p.prop_type_cd in ('P','A')
		where
			prop_val_yr = @lYear and
			sup_num = @lSupNum
	end

	/**************************************************************************/
	/* End - Personal / Auto */
	/**************************************************************************/

	/**************************************************************************/
	/* Begin - Mineral */
	/**************************************************************************/

	/* Since minerals only have one row, we can do a single update */
	if ( @bPropList = 1 )
	begin
		update property_val_cad_state_cd with(tablockx)
		set
			property_val_cad_state_cd.market_val = pv.market,
			property_val_cad_state_cd.appraised_val = pv.appraised_val,
			property_val_cad_state_cd.assessed_val = pv.assessed_val,
			property_val_cad_state_cd.personal_val = case
				when property_val_cad_state_cd.state_cd like 'G%'
				then 0
				else pv.assessed_val
			end,
			property_val_cad_state_cd.mineral_val = case
				when property_val_cad_state_cd.state_cd like 'G%'
				then pv.assessed_val
				else 0
			end
		from property_val_cad_state_cd with(tablockx)
		join property as p with(nolock) on
			property_val_cad_state_cd.prop_id = p.prop_id and
			p.prop_type_cd = 'MN'
		join property_val as pv with(nolock) on
			property_val_cad_state_cd.prop_id = pv.prop_id and
			pv.prop_val_yr = @lYear and
			pv.sup_num = @lSupNum
		where
			property_val_cad_state_cd.prop_val_yr = @lYear and
			property_val_cad_state_cd.sup_num = @lSupNum and
			property_val_cad_state_cd.prop_id in (select t.prop_id from #tmp_props as t with(nolock))
	end
	else
	begin
		update property_val_cad_state_cd with(tablockx)
		set
			property_val_cad_state_cd.market_val = pv.market,
			property_val_cad_state_cd.appraised_val = pv.appraised_val,
			property_val_cad_state_cd.assessed_val = pv.assessed_val,
			property_val_cad_state_cd.personal_val = case
				when property_val_cad_state_cd.state_cd like 'G%'
				then 0
				else pv.assessed_val
			end,
			property_val_cad_state_cd.mineral_val = case
				when property_val_cad_state_cd.state_cd like 'G%'
				then pv.assessed_val
				else 0
			end
		from property_val_cad_state_cd with(tablockx)
		join property as p with(nolock) on
			property_val_cad_state_cd.prop_id = p.prop_id and
			p.prop_type_cd = 'MN'
		join property_val as pv with(nolock) on
			property_val_cad_state_cd.prop_id = pv.prop_id and
			pv.prop_val_yr = @lYear and
			pv.sup_num = @lSupNum
		where
			property_val_cad_state_cd.prop_val_yr = @lYear and
			property_val_cad_state_cd.sup_num = @lSupNum
	end

	/**************************************************************************/
	/* End - Mineral */
	/**************************************************************************/

	/**************************************************************************/
	/**************************************************************************/
	/* End - property_val_cad_state_cd (CAD code) */
	/**************************************************************************/
	/**************************************************************************/

GO


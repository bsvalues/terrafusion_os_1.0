
CREATE PROCEDURE SalesCompCommercialTaxpayerEvidenceReports

	@type varchar(5),
	@yr   numeric(4,0)	
AS

	declare @prop_id int
	declare @sale_id int

	delete from ##sales_equity_summary_reports where spid = @@spid and report_type = @type


--	DECLARE CURSORONE CURSOR FOR SELECT prop_id,cast (var1 as int) FROM ##temp_propid_spid
	DECLARE CURSORONE CURSOR FOR SELECT prop_id, int1 FROM ##temp_propid_spid where spid = @@spid and type = @type
	OPEN CURSORONE
	FETCH NEXT FROM CURSORONE INTO @prop_id, @sale_id
	while @@FETCH_STATUS = 0
	BEGIN
	

		insert into ##sales_equity_summary_reports
			(
			spid,
			report_type,
			prop_id,
			situs,
			property_use_cd,
			sub_market_cd,
			market,
			gba,
			gba_sqft,
			nra,
			nra_sqft,
			eff_yr,
			actual_yr,
			lbratio,
			imprv_class,
			region,
			vac_pct,
			cap_rate,
			dba_name,
			sale_price,
			sale_price_sqft,
			living_area,
			mkt_val_sqft,
			state_cd,
			condition_cd,
			heat_ac_cd,
			land_total_sqft,
			land_total_acres,
			additive_val,
			percent_complete,
			sale_date,
			imprv_sub_class,
			heat_only_code_attribute,
			cool_only_code_attribute,
			num_stories,	
			hood_cd
			)   
		select
			@@spid,
			@type,
			pp.prop_id,
			s.situs_display,
			pp.property_use_cd,
			pp.sub_market_cd,
			isnull(pv.market,0),
			isnull(pp.living_area,0),
			case when isnull(pp.living_area,0) >0 then isnull(pv.market,0) / isnull(pp.living_area,0) else 0 end,
			isnull(iv.NRA,0),
			case when isnull(iv.NRA,0) >0 then isnull(pv.market,0) / isnull(iv.NRA,0) else 0 end,
			pp.eff_yr_blt,
			pp.yr_blt,
			case when isnull(pp.living_area,0) >0 then isnull(pp.land_total_sqft,0) / isnull(pp.living_area,0) else 0 end,
			pp.class_cd,
			pp.region,
			isnull(iv.VR,0),
			isnull(iv.CAPR,0),
			p.dba_name,
			isnull(sa.sl_price,0),
			case when isnull(pp.living_area,0) >0 then isnull(sa.sl_price,0) / isnull(pp.living_area,0) else 0 end,
			isnull(pp.living_area,0),
			case when isnull(pp.living_area,0) >0 then isnull(pv.market,0) / isnull(pp.living_area,0) else 0 end,
			pp.state_cd,
			pp.condition_cd,
			pp.heat_ac_code,
			isnull(pp.land_total_sqft,0),
			isnull(pp.land_total_acres,0),
			isnull(pp.imprv_add_val,0),
			isnull(pp.percent_complete,0),
			sa.sl_dt,
			pp.imprv_det_sub_class_cd,
			'',
			'',
			'0',
			pv.hood_cd
		from property_val as pv with(nolock)
		inner 	join prop_supp_assoc psa  with(nolock) on
			psa.prop_id = pv.prop_id
			and psa.owner_tax_yr = pv.prop_val_yr
			and psa.sup_num = pv.sup_num
		inner 	join property_profile as pp with(nolock) on
			pp.prop_id = pv.prop_id
			and pp.prop_val_yr = pv.prop_val_yr
			and pp.sup_num = pv.sup_num
		inner 	join property as p with(nolock) on
			p.prop_id = pv.prop_id
		left 	outer join situs as s with(nolock) on
			s.prop_id = pv.prop_id
		left 	outer join chg_of_owner_prop_assoc  as co with(nolock) on
			co.prop_id = pv.prop_id
			and co.chg_of_owner_id = @sale_id
		left 	outer join sale as sa  with(nolock) on
			sa.chg_of_owner_id = co.chg_of_owner_id
		left 	outer join income_prop_assoc as ipa with(nolock)  on
			ipa.prop_id = pv.prop_id
			and ipa.prop_val_yr = pv.prop_val_yr
			and ipa.sup_num = pv.sup_num
		left 	outer join income_vw as iv with(nolock)  on
			iv.income_id = ipa.income_id
			and iv.income_yr = pv.prop_val_yr
			and iv.sup_num = pv.sup_num
		where 	pv.prop_id = @prop_id
			and pv.prop_val_yr=@yr
 --	31389
	 		and (iv.income_id = dbo.fn_GetCompIncome(pv.prop_id, pv.prop_val_yr, pv.sup_num)
				or iv.income_id is null)



		FETCH NEXT FROM CURSORONE INTO @prop_id, @sale_id
	END--while
	CLOSE CURSORONE
	DEALLOCATE CURSORONE 


	update rpt
	set rpt.num_stories = (
--	select ISNULL(max(id.num_stories),0)
	select top 1 ISNULL(id.stories,'0')
	from prop_supp_assoc as psa with(nolock)
--	join imprv_detail as id with(nolock) on
	join imprv as id with(nolock) on
	    id.prop_val_yr = psa.owner_tax_yr and
	    id.sup_num = psa.sup_num and
	    id.sale_id = 0 and
	    id.prop_id = psa.prop_id
	where
	psa.owner_tax_yr = @yr and
	psa.prop_id = rpt.prop_id
	order by id.imprv_val DESC
	)
	from ##sales_equity_summary_reports as rpt
	where rpt.spid = @@SPID and rpt.report_type = @type


	declare @heatid int
	declare @coolid int
	select 
		@heatid = heat_only_code_attribute_id, 
		@coolid = cool_only_code_attribute_id 
	from 	pacs_system
	where	system_type='A' or system_type = 'B'
	
	update rpt
	set rpt.heat_only_code_attribute = (
	select top 1 isnull(id.i_attr_val_cd,'')
	from prop_supp_assoc as psa with(nolock)
	join pacs_system as ps with(nolock)on
	    ps.system_type='A' or
	    ps.system_type='B'
	join imprv_attr as id with(nolock) on
	    id.prop_val_yr = psa.owner_tax_yr and
	    id.sup_num = psa.sup_num and
	    id.sale_id = 0 and
	    id.prop_id = psa.prop_id and
	    id.i_attr_val_id = ps.heat_only_code_attribute_id
	where
	psa.owner_tax_yr = @yr and
	psa.prop_id = rpt.prop_id
	)
	from ##sales_equity_summary_reports as rpt
	where rpt.spid = @@SPID and rpt.report_type = @type
-- for now
	update ##sales_equity_summary_reports 
	set heat_only_code_attribute = ''
	where spid = @@SPID 
	and report_type = @type
	and heat_only_code_attribute is null
	



--	if (@heatid <> @coolid)
--	begin
		update rpt
		set rpt.cool_only_code_attribute = (
		select top 1 isnull(id.i_attr_val_cd,'')
		from prop_supp_assoc as psa with(nolock)
		join pacs_system as ps with(nolock)on
		    ps.system_type='A' or
		    ps.system_type='B'
		join imprv_attr as id with(nolock) on
		    id.prop_val_yr = psa.owner_tax_yr and
		    id.sup_num = psa.sup_num and
		    id.sale_id = 0 and
		    id.prop_id = psa.prop_id and
		    id.i_attr_val_id = ps.cool_only_code_attribute_id
		where
		psa.owner_tax_yr = @yr and
		psa.prop_id = rpt.prop_id
		)
		from ##sales_equity_summary_reports as rpt
		where rpt.spid = @@SPID and rpt.report_type = @type
--	end

GO


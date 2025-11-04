
create view dbo.penpad_recalc_report_vw

as

	select
		pc.run_id,
		pc.prop_id,
		case when CHARINDEX(CHAR(13), situs.situs_display) = 0 then isnull(situs.situs_display, '')
		else LEFT(isnull(situs.situs_display, ''), CHARINDEX(CHAR(13), situs.situs_display)-1) 
		end  situs_address,
		pv.legal_desc,
		pv.hood_cd,
		pc.market_val_check_out,
		pc.market_val_check_in,
		(pc.market_val_check_in - pc.market_val_check_out) as market_diff
	from penpad_checkout as pc
	join pacs_system as ps on
		0 = 0 /* Always join */
	join prop_supp_assoc as psa on
		pc.prop_id = psa.prop_id and
		ps.appr_yr = psa.owner_tax_yr
	join property_val as pv on
		pc.prop_id = pv.prop_id and
		ps.appr_yr = pv.prop_val_yr and
		psa.sup_num = pv.sup_num
	join property p on
		pv.prop_id=p.prop_id
	left outer join situs on
		pc.prop_id = situs.prop_id and
		situs.primary_situs = 'Y'
where IsNull(p.reference_flag, 'F') <> 'T'

GO


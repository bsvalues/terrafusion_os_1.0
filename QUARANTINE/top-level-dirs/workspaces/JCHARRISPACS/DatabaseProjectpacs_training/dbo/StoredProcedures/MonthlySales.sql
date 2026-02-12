
--monitor command {call ChelanMonthlySales ('01/01/2012')}
-- 1st variable = sale date  

CREATE procedure [dbo].[MonthlySales]


@bdate		datetime,
@edate		datetime


as


SELECT DISTINCT pv.prop_id, p.geo_id, 
pv.hood_cd as 'NBHD', pv.rgn_cd as 'Region',
Sale_Price,
convert(varchar (20), Deed_Dt, 111) as Deed_Date, 
convert(varchar (20), Sale_Dt, 111) as Sale_Date,
pp.state_cd, s.situs_num, s.situs_street_prefx, 
s.situs_street, s.situs_street_sufix, s.situs_city, 
pv.legal_acreage,pp.living_area, Basement_Area, 
Part_Finish, Minimal_Finish, pp.yr_blt as 'Year Built', 
Width, Length, Bedrooms, Bathrooms, Heat_Cool, 
Number_of_Units, Garage_Area, 
case when POOL = 'POOL' then 'Y' else 'N' end as Pool,
case when FIREPLACE = 'FIREPLACE' then 'Y' else 'N' end as FIREPLACE,
Number_of_Fireplaces, Deed_Type, Reject_Code, Aff_#, 
Auditor_File_#, 
replace('$'+ convert(varchar, cast((round(pv.market, 0)) as money), 1),'.00','') as Market, 
Buyer, Seller, ta.tax_area_number as 'Tax Area'
FROM property_val pv WITH (nolock) 
INNER JOIN prop_supp_assoc psa WITH (nolock) ON
     pv.prop_id = psa.prop_id
     AND pv.prop_val_yr = psa.owner_tax_yr
     AND pv.sup_num = psa.sup_num
INNER JOIN property p WITH (nolock) ON
	pv.prop_id = p.prop_id
INNER JOIN property_profile pp WITH (nolock) ON
	pv.prop_id = pp.prop_id 
	AND pv.prop_val_yr = pp.prop_val_yr
	AND pv.sup_num = pp.sup_num
INNER JOIN wash_prop_owner_tax_area_assoc wta WITH (nolock) ON 
	wta.year = pv.prop_val_yr
	AND wta.prop_id = pv.prop_id
	AND wta.sup_num = pv.sup_num
INNER JOIN tax_area ta WITH (nolock) ON  
	ta.tax_area_id = wta.tax_area_id
INNER JOIN pacs_system py WITH (nolock) ON
	pv.prop_val_yr = py.appr_yr
LEFT OUTER JOIN
    (select copa.prop_id, ac1.file_as_name as Seller, 
    ac2.file_as_name as Buyer, 
	coo.deed_dt as Deed_Dt, 
    coo.excise_number as Aff_#, coo.deed_num as Auditor_File_#,
	sl.sl_dt as Sale_Dt, 
	sl.sl_ratio_type_cd as Reject_Code, coo.deed_type_cd as Deed_Type,
	replace('$'+ convert(varchar, cast((round(sl.sl_price, 0)) as money), 1),'.00','') as Sale_Price
    from chg_of_owner_prop_assoc copa with (nolock)
    inner join chg_of_owner coo with (nolock) on
        copa.chg_of_owner_id = coo.chg_of_owner_id
	inner join sale sl with (nolock) on
		copa.chg_of_owner_id = sl.chg_of_owner_id
		and sl.sl_price > 0
    left outer join seller_assoc sa with (nolock) on
        copa.prop_id = sa.prop_id
        and copa.chg_of_owner_id = sa.chg_of_owner_id
    left outer join account ac1 with (nolock) on
        sa.seller_id = ac1.acct_id
    left outer join buyer_assoc ba with (nolock) on
        coo.chg_of_owner_id = ba.chg_of_owner_id 
    left outer join account ac2 with (nolock) on 
        ba.buyer_id = ac2.acct_id) as sb
    on pv.prop_id = sb.prop_id
LEFT OUTER JOIN situs s WITH (nolock) ON
	pv.prop_id = s.prop_id
	AND isnull(s.primary_situs, 'N') = 'Y'
LEFT OUTER JOIN
		(select idt.prop_id, idt.width as Width,
		idt.length as Length
		from imprv_detail idt with (nolock)
		inner join pacs_system py with (nolock) on
			idt.prop_val_yr = py.appr_yr
		where idt.prop_val_yr = py.appr_yr
		and idt.sale_id = 0
		and idt.imprv_det_type_cd = 'MA') as x
		on pv.prop_id = x.prop_id

LEFT OUTER JOIN
		(select idt1.prop_id, idt1.imprv_det_area as Basement_Area
		from imprv_detail idt1 with (nolock)
		inner join pacs_system py1 with (nolock) on
			idt1.prop_val_yr = py1.appr_yr
		where idt1.prop_val_yr = py1.appr_yr
		and idt1.sale_id = 0
		and idt1.imprv_det_type_cd like 'BS-UFC%') as a
		on pv.prop_id = a.prop_id
LEFT OUTER JOIN
		(select idt2.prop_id, idt2.imprv_det_area as Part_Finish
		from imprv_detail idt2 with (nolock)
		inner join pacs_system py2 with (nolock) on
			idt2.prop_val_yr = py2.appr_yr
		where idt2.prop_val_yr = py2.appr_yr
		and idt2.sale_id = 0
		and idt2.imprv_det_type_cd like 'BS-PF') as b
		on pv.prop_id = b.prop_id
LEFT OUTER JOIN
		(select idt3.prop_id, idt3.imprv_det_area as Minimal_Finish
		from imprv_detail idt3 with (nolock)
		inner join pacs_system py3 with (nolock) on
			idt3.prop_val_yr = py3.appr_yr
		where idt3.prop_val_yr = py3.appr_yr
		and idt3.sale_id = 0
		and idt3.imprv_det_type_cd like 'BS-MF') as c
		on pv.prop_id = c.prop_id
LEFT OUTER JOIN
		(select idt4.prop_id, idt4.imprv_det_area as Garage_Area
		from imprv_detail idt4 with (nolock)
		inner join pacs_system py4 with (nolock) on
			idt4.prop_val_yr = py4.appr_yr
		where idt4.prop_val_yr = py4.appr_yr
		and idt4.sale_id = 0
		and idt4.imprv_det_type_cd like 'GAR-%') as d
		on pv.prop_id = d.prop_id		
LEFT OUTER JOIN
		(select idt5.prop_id, idt5.imprv_det_type_cd as POOL
		from imprv_detail idt5 with (nolock)
		inner join pacs_system py5 with (nolock) on
			idt5.prop_val_yr = py5.appr_yr
		where idt5.prop_val_yr = py5.appr_yr
		and idt5.sale_id = 0
		and idt5.imprv_det_type_cd = 'POOL') as e
		on pv.prop_id = e.prop_id
LEFT OUTER JOIN
		(select idt6.prop_id, ia1.i_attr_val_cd as Bedrooms
		from imprv_detail idt6 with (nolock)
		inner join pacs_system py6 with (nolock) on
			idt6.prop_val_yr = py6.appr_yr
		left outer join imprv_attr ia1 with (nolock) on
			idt6.prop_id = ia1.prop_id
			and idt6.prop_val_yr = ia1.prop_val_yr
			and idt6.imprv_id = ia1.imprv_id
			and idt6.imprv_det_id = ia1.imprv_det_id
			and ia1.sale_id = 0
		left outer join attribute a1 with (nolock) on
			ia1.i_attr_val_id = a1.imprv_attr_id
		where idt6.prop_val_yr = py6.appr_yr
		and idt6.sale_id = 0
		and idt6.imprv_det_type_cd = 'MA'
		and a1.imprv_attr_id = 15) as f
		on pv.prop_id = f.prop_id	
LEFT OUTER JOIN
		(select idt7.prop_id, ia2.i_attr_val_cd as Bathrooms
		from imprv_detail idt7 with (nolock)
		inner join pacs_system py7 with (nolock) on
			idt7.prop_val_yr = py7.appr_yr
		left outer join imprv_attr ia2 with (nolock) on
			idt7.prop_id = ia2.prop_id
			and idt7.prop_val_yr = ia2.prop_val_yr
			and idt7.imprv_id = ia2.imprv_id
			and idt7.imprv_det_id = ia2.imprv_det_id
			and ia2.sale_id = 0
		left outer join attribute a2 with (nolock) on
			ia2.i_attr_val_id = a2.imprv_attr_id
		where idt7.prop_val_yr = py7.appr_yr
		and idt7.sale_id = 0
		and idt7.imprv_det_type_cd = 'MA'
		and a2.imprv_attr_id = 8) as g
		on pv.prop_id = g.prop_id			
LEFT OUTER JOIN
		(select idt8.prop_id, ia3.i_attr_val_cd as Heat_Cool,
		ia3.i_attr_unit as Number_of_Units
		from imprv_detail idt8 with (nolock)
		inner join pacs_system py8 with (nolock) on
			idt8.prop_val_yr = py8.appr_yr
		left outer join imprv_attr ia3 with (nolock) on
			idt8.prop_id = ia3.prop_id
			and idt8.prop_val_yr = ia3.prop_val_yr
			and idt8.imprv_id = ia3.imprv_id
			and idt8.imprv_det_id = ia3.imprv_det_id
			and ia3.sale_id = 0
		left outer join attribute a3 with (nolock) on
			ia3.i_attr_val_id = a3.imprv_attr_id
		where idt8.prop_val_yr = py8.appr_yr
		and idt8.sale_id = 0
		and idt8.imprv_det_type_cd = 'MA'
		and a3.imprv_attr_id = 9) as h
		on pv.prop_id = h.prop_id
LEFT OUTER JOIN
		(select idt9.prop_id, a4.imprv_attr_desc as Fireplace,
		ia4.i_attr_unit as Number_of_Fireplaces
		from imprv_detail idt9 with (nolock)
		inner join pacs_system py9 with (nolock) on
			idt9.prop_val_yr = py9.appr_yr
		left outer join imprv_attr ia4 with (nolock) on
			idt9.prop_id = ia4.prop_id
			and idt9.prop_val_yr = ia4.prop_val_yr
			and idt9.imprv_id = ia4.imprv_id
			and idt9.imprv_det_id = ia4.imprv_det_id
			and ia4.sale_id = 0
		left outer join attribute a4 with (nolock) on
			ia4.i_attr_val_id = a4.imprv_attr_id
		where idt9.prop_val_yr = py9.appr_yr
		and idt9.sale_id = 0
		and idt9.imprv_det_type_cd = 'MA'
		and a4.imprv_attr_id = 10) as i
		on pv.prop_id = i.prop_id

WHERE pv.prop_val_yr = py.appr_yr
AND (pv.prop_inactive_dt is null or udi_parent = 'T')
AND Sale_Dt between @bdate and @edate
ORDER BY 5

GO


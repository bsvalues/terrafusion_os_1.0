create view __City_Richland_Sales as 

select pv.prop_id as PacelID, p.geo_id, pv.cycle,
coo.excise_number																						as 'Excise_Affidavit',
convert(varchar (20), sl_dt, 101)																	    as 'Sale_Date', 
sale.sl_price  as Sale_Price,		
sale.adjusted_sl_price as 'AdjSalePrice',
pv.market																								as 'AP_Mrkt',
																				
ta.tax_area_number as 'tca', coo.grantor_cv,
replace(ac.file_as_name, ',', '') as 'owner',
a.addr_line1, a.addr_line2, a.addr_line3, 
a.addr_city, a.addr_state, a.addr_zip,
s.situs_num, s.situs_street_prefx, s.situs_street, s.situs_street_sufix,
s.situs_city, s.situs_state, s.situs_zip, s.situs_unit,
pv.township_section as 'section', pv.township_code as 'township', 
pv.range_code as 'range', pv.township_q_section as '1_4_section',
(pv.imprv_hstd_val + pv.imprv_non_hstd_val) as 'imprv_value',
(pv.land_hstd_val + pv.land_non_hstd_val + pv.ag_market + pv.timber_market) as 'land_val', 
pv.market, pp.imprv_type_cd, pv.property_use_cd as 'primary_use_code',
pu.property_use_desc as 'primary_use_code_desc', 
dbo.fn_getexemptions(pv.prop_id, pv.prop_val_yr, pv.sup_num) as exemptions
,XCoord
,YCoord

from property_val pv with (nolock)
inner join prop_supp_assoc psa with (nolock) on
                pv.prop_id = psa.prop_id 
                and pv.prop_val_yr = psa.owner_tax_yr 
                and pv.sup_num = psa.sup_num
inner join property p with (nolock) on
                pv.prop_id = p.prop_id
inner join owner o with (nolock) on
                pv.prop_id = o.prop_id
                and pv.prop_val_yr = o.owner_tax_yr
                and pv.sup_num = o.sup_num
inner join account ac with (nolock) on
                o.owner_id = ac.acct_id
inner join address a with (nolock) on
                ac.acct_id = a.acct_id
                and isnull(a.primary_addr, 0) = 'y'
inner join property_tax_area pta with (nolock) on
                pv.prop_id = pta.prop_id
                and pv.prop_val_yr = pta.year
                and pv.sup_num = pta.sup_num 
inner join tax_area ta with (nolock) on
                pta.tax_area_id = ta.tax_area_id
inner join property_profile pp with (nolock) on
                pv.prop_id = pp.prop_id
                and pv.prop_val_yr = pp.prop_val_yr
inner join property_use pu with (nolock) on
                pv.property_use_cd = pu.property_use_cd
left outer join situs s with (nolock) on
                pv.prop_id = s.prop_id
                and isnull(s.primary_situs, 'n') = 'y'
				INNER JOIN chg_of_owner_prop_assoc copa ON
	pv.prop_id = copa.prop_id 
INNER JOIN chg_of_owner coo  ON
	copa.chg_of_owner_id = coo.chg_of_owner_id
INNER JOIN sale   ON
	copa.chg_of_owner_id = sale.chg_of_owner_id
			inner join 

  (SELECT 
[Parcel_ID],
ROW_NUMBER() 
over 
(partition by prop_id 
ORDER BY [OBJECTID] DESC) 
AS order_id,[Prop_ID], [CENTROID_X]as XCoord, [CENTROID_Y]  as YCoord ,shape


FROM 
[Benton_spatial_data].[dbo].[PARCEL]) sp on sp.Prop_ID=pv.prop_id

where pv.prop_val_yr = (select appr_yr  from [pacs_oltp].[dbo].pacs_system)
and pv.prop_inactive_dt is null and coo.grantor_cv like 'city of RIchland%'

GO


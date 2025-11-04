create view __gain_loss as 

select distinct p.prop_type_cd as 'type', 
pv.prop_id as 'ParcelID',
p.geo_id as 'geo_id',
pv.hood_cd as 'nbhd', 
pv.cycle as 'cycle', 
a.file_as_name as 'owner',
pv.legal_acreage as 'legal_acres', 
i.imprv_type_cd as 'imprv_type',
pp.yr_blt as 'year_blt',
ap.appraiser_nm as 'next_appr',
ap1.appraiser_nm as 'last_appr',
(pv.land_hstd_val + pv.land_non_hstd_val + pv.ag_market + pv.timber_market) as 'current_land_val',
prior_year_land_val,
(pv.imprv_hstd_val + pv.imprv_non_hstd_val) as 'current_imprv_val', 
prior_year_imprv_val,
pv.market as 'current_mkt_value', 
prior_year_mkt_val, (pv.market - prior_year_mkt_val) as 'gain_loss',
case when prior_year_mkt_val <> 0 then cast(round((pv.market / prior_year_mkt_val) * 100 - 100, 2) 
as decimal(10, 2)) else 0 end as pct_chg,
i.imp_new_val as 'imprv_new_value',
pv.ag_use_val as 'current_use_val',
prior_year_current_use_val,
i.adjusted_val as 'current_imprv_adj_val',
i.flat_val as 'current_imprv_flat_val',
i.imprv_val_source as 'method',
pv.legal_desc


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
inner join account a with (nolock) on 
	o.owner_id = a.acct_id
inner join property_profile pp with (nolock) on
	pv.prop_id = pp.prop_id 
	and pv.prop_val_yr = pp.prop_val_yr
left outer join imprv i with (nolock) on
	pv.prop_id = i.prop_id
	and pv.prop_val_yr = i.prop_val_yr
	and pv.sup_num = i.sup_num
	and i.sale_id = 0
left outer join appraiser ap with (nolock) on
	pv.next_appraiser_id = ap.appraiser_id
left outer join appraiser ap1 with (nolock) on
	pv.last_appraiser_id = ap1.appraiser_id
left outer join
	(select pv1.prop_id, pv1.prop_val_yr, pv1.sup_num, 
	(pv1.imprv_hstd_val + pv1.imprv_non_hstd_val) as prior_year_imprv_val,
	(pv1.land_hstd_val + pv1.land_non_hstd_val + pv1.ag_market + pv1.timber_market) as prior_year_land_val,
	pv1.market as prior_year_mkt_val, pv1.ag_use_val as prior_year_current_use_val
	from property_val pv1 with (nolock) 
	inner join prop_supp_assoc psa1 with (nolock) on
		pv1.prop_id = psa1.prop_id 
		and pv1.prop_val_yr = psa1.owner_tax_yr
		and pv1.sup_num = psa1.sup_num
	where pv1.prop_val_yr = (select appr_yr-1 from pacs_oltp.dbo.pacs_system)
	and prop_inactive_dt is null
	
	) as x----change year as needed, should be prior year
	
	
	on pv.prop_id = x.prop_id

where pv.prop_val_yr = (select appr_yr from pacs_oltp.dbo.pacs_system)----change year as needed, should be current year
and pv.prop_inactive_dt is null 
and prop_inactive_dt is null
--and cycle=-1
--and i.imprv_type_cd='c'


group by p.prop_type_cd, pv.prop_id, p.geo_id, pv.hood_cd, pv.cycle, a.file_as_name,
pv.legal_acreage, i.imprv_type_cd, pp.yr_blt, ap.appraiser_nm, ap1.appraiser_nm,
(pv.land_hstd_val + pv.land_non_hstd_val + pv.ag_market + pv.timber_market),
prior_year_land_val, (pv.imprv_hstd_val + pv.imprv_non_hstd_val),
prior_year_imprv_val, pv.market, prior_year_mkt_val, prior_year_imprv_val,
i.imp_new_val, pv.ag_use_val, prior_year_current_use_val, i.adjusted_val,
i.flat_val, i.imprv_val_source, pv.legal_desc

--order by pv.cycle, p.geo_id

GO


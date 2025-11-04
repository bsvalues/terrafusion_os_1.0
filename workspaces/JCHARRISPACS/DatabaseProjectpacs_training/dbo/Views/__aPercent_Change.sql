create view __aPercent_Change as 
select 
	pv1.prop_id as prop_id,
	pv1.prop_val_yr as year_one,
	pv1.market as market_val_yr_one,
	pv2.prop_val_yr as year_two,
 	pv2.market as market_val_yr_two,

	(cast( ( isnull(pv2.market,0) - isnull(pv1.market,0) )as decimal(10, 0))	 /	(case when pv1.market is null then 1  when pv1.market = 0 then 1 else pv1.market end))
percent_change,
	( isnull(pv2.new_val_hs,0) + isnull(pv2.new_val_nhs,0) + isnull(pv2.new_val_p, 0) ) as new_val,
	pp.yr_blt as last_yr_blt,
 	pp.property_use_cd, 
	pp.region,
	pp.neighborhood

	from	property_val as pv1
	inner join
	prop_supp_assoc as psa1
		on psa1.prop_id = pv1.prop_id
		   and psa1.owner_tax_yr = pv1.prop_val_yr
		   and psa1.sup_num = pv1.sup_num
		   
	inner join 
	property_val as pv2
		on pv2.prop_id = pv1.prop_id
	inner join 
	prop_supp_assoc as psa2
		on psa2.prop_id = pv2.prop_id
		   and psa2.owner_tax_yr = pv2.prop_val_yr
		   and psa2.sup_num = pv2.sup_num	
	inner join
	property_profile as pp
		on pp.prop_id = pv2.prop_id
		   and pp.prop_val_yr = pv2.prop_val_yr
		   where pv1.prop_val_yr=(select appr_yr-1 from pacs_oltp.dbo.pacs_system) and pv2.prop_val_yr=(select appr_yr from pacs_oltp.dbo.pacs_system)

GO


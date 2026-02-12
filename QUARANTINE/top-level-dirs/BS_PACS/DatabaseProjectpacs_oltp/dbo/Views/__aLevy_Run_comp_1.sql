


create view [dbo].[__aLevy_Run_comp_1] as 

select distinct pv.prop_id,
 pv.prop_val_yr,
pv.market,
pv.assessed_val,
  pv.sup_num, 
  ta.tax_area_id, 
  ta.tax_area_number, 
  ta.tax_area_description, 
	td.tax_district_cd, 
	td.tax_district_desc,
		lcrd.levy_cert_run_id, 
	lcrd.[year],
	lcrd.tax_district_id,
	td.tax_district_desc as tax_district_name,
	lcrd.levy_cd,
	levy.levy_description,
	levy.levy_type_cd,
	levy_type.levy_type_desc,
	levy.voted,
	lcrd.budget_amount,
	lcrd.tax_base,
	lcrd.levy_rate,
	lcrd.final_levy_rate,
	lcrd.outstanding_item_cnt
	
	



from property_val pv with(nolock)
join 
	prop_supp_assoc psa with(nolock)
		on psa.prop_id = pv.prop_id
		and psa.owner_tax_yr = pv.prop_val_yr
		and psa.sup_num = pv.sup_num
join 
	property_tax_area pta with(Nolock)
		on pta.prop_id = pv.prop_id
		and pta.year = pv.prop_val_yr
		and pta.sup_num = pv.sup_num
join
	tax_area ta with(nolock)
		on ta.tax_area_id = pta.tax_area_id
join 
	tax_area_fund_assoc tafa with(nolock)
		on tafa.tax_area_id = ta.tax_area_id
		and tafa.year = pv.prop_val_yr
join
	 tax_district td 
		on td.tax_district_id = tafa.tax_district_id
		--and td.tax_district_type_cd = '2CITY'
		jOIN 
	levy_cert_run_detail as lcrd 
	on 	td.tax_district_id = lcrd.tax_district_id

JOIN
	levy 
		on	levy.[year]				= lcrd.[year]
		and levy.tax_district_id	= lcrd.tax_district_id
		and levy.levy_cd			= lcrd.levy_cd
		and lcrd.[year]=pv.prop_val_yr-1
JOIN 
	levy_type 
		on levy_type.levy_type_cd	= levy.levy_type_cd




where pv.prop_inactive_dt is NULL
and pv.prop_val_yr =(select appr_yr from pacs_oltp.dbo.pacs_system)-- and levy.levy_type_cd = 'Reg'
 --and 
--tax_district_cd like 'fir006'
-- and 
--levy.levy_type_cd like 'reg'

GO


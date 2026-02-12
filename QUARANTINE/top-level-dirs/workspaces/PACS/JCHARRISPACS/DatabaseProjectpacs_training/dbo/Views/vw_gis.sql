


--12.3 Gis Version 1 

--A query used to extract data from PACS for purposes of updating a GIS data layer. 
create view [dbo].[vw_gis]
as 

SELECT  pv.prop_id 

 ,p.geo_id 

 ,ac.file_as_name 

 ,ad.addr_line1 

 ,ad.addr_line2 

 ,ad.addr_line3 

 ,ad.addr_city 

 ,ad.addr_state 

 ,ad.zip 

 ,s.situs_display

 ,s.situs_num 

 ,s.situs_street_prefx 

 ,s.situs_street 

 ,s.situs_street_sufix 

 ,s.situs_city 

 ,s.situs_state 

 ,s.situs_zip 
 ,pl.metes_and_bounds

 ,pv.market 

 ,(wpov.taxable_non_classified + wpov.taxable_classified) 
AS 'assessed_value' 

 ,(pv.imprv_hstd_val + pv.imprv_non_hstd_val) AS 'imprv_value' 

 ,(pv.land_hstd_val + pv.land_non_hstd_val + pv.ag_market 
+ pv.timber_market) AS 'land_val' 

 ,pv.legal_acreage 

 ,dbo.fn_getexemptions(pv.prop_id, pv.prop_val_yr, 
pv.sup_num) AS exemptions 
,sp.centroid_x
,sp.centroid_y
,sp.geometry



FROM property_val pv WITH (NOLOCK) 

INNER JOIN property p WITH (NOLOCK) ON pv.prop_id = 
p.prop_id 

INNER JOIN prop_supp_assoc psa WITH (NOLOCK) ON pv.prop_id = 
psa.prop_id 

 AND pv.prop_val_yr = psa.owner_tax_yr 

 AND pv.sup_num = psa.sup_num 

INNER JOIN OWNER o 

WITH (NOLOCK) ON pv.prop_id = o.prop_id 

 AND pv.prop_val_yr = o.owner_tax_yr 

 AND pv.sup_num = o.sup_num 

INNER JOIN account ac WITH (NOLOCK) ON o.owner_id = 
ac.acct_id 

INNER JOIN address ad WITH (NOLOCK) ON ac.acct_id = 
ad.acct_id 

 AND ad.primary_addr = 'y' 

INNER JOIN wash_prop_owner_val wpov WITH (NOLOCK) ON 
pv.prop_id = wpov.prop_id 

 AND pv.prop_val_yr = wpov.year 

 AND pv.sup_num = wpov.sup_num 

 AND o.owner_id = wpov.owner_id 

 left join 
  [Spatial].[dbo].[parcel1] sp
  on 
  sp.prop_id=pv.prop_id

  inner join 
  property_legal_description as pl

on 
pv.prop_id=pl.prop_id
and
pv.prop_val_yr=pl.prop_val_yr
and 
pv.sup_num=pl.sup_num

LEFT OUTER JOIN situs s WITH (NOLOCK) ON pv.prop_id = 
s.prop_id 

 AND s.primary_situs = 'y' 

INNER JOIN pacs_system ON pv.prop_val_yr = 
pacs_system.appr_yr 


WHERE pv.prop_inactive_dt IS NULL 

 AND p.prop_type_cd = 'r'

GO



CREATE PROCEDURE dbo.GIS_Get_Accounts

AS

SET NOCOUNT ON

SELECT DISTINCT 
       pv.prop_id
     , a.file_as_name
     , pv.legal_acreage 
     , pev.school
     , pev.city
     , pv.legal_desc
     , pv.tract_or_lot
     , pv.abs_subdv_cd
     , p.geo_id
     , pv.block
     , pv.map_id
     , s.situs_num
     , s.situs_street_prefx
     , s.situs_street
     , s.situs_street_sufix
     , s.situs_city
     , s.situs_state 
     , s.situs_zip
     , ad.addr_line1
     , ad.addr_line2
     , ad.addr_line3 
     , ad.addr_city
     , ad.addr_state
     , ad.zip
   --, o.pct_ownership
FROM property_val pv WITH (nolock)
INNER JOIN property  p WITH (nolock) ON  
                pv.prop_id = p.prop_id 
INNER JOIN prop_supp_assoc psa WITH (nolock) ON
                pv.prop_id = psa.prop_id 
                AND pv.prop_val_yr = psa.owner_tax_yr 
                AND pv.sup_num = psa.sup_num 
INNER JOIN _prop_entity_vw pev WITH (nolock) ON
                pv.prop_id = pev.prop_id 
                AND pv.prop_val_yr = pev.prop_val_yr 
                AND pv.sup_num = pev.sup_num  
INNER JOIN owner o WITH (nolock) ON
                pv.prop_id = o.prop_id 
                AND pv.prop_val_yr = o.owner_tax_yr
                AND pv.sup_num = o.sup_num
INNER JOIN account a WITH (nolock) ON 
                o.owner_id = a.acct_id
INNER JOIN address ad WITH (nolock) ON
                a.acct_id = ad.acct_id
INNER JOIN pacs_system ps WITH (nolock) ON
                pv.prop_val_yr = ps.appr_yr
LEFT OUTER JOIN situs s WITH (nolock) ON
                p.prop_id = s.prop_id 
                AND s.primary_situs = 'Y' 
WHERE pv.prop_val_yr = ps.appr_yr 
AND p.prop_type_cd = 'R'
AND (pv.prop_inactive_dt IS NULL OR pv.udi_parent = 'T')
AND o.pct_ownership >= 100
AND pv.prop_id in (select prop_id 
                                  from land_detail 
                                  where prop_val_yr = ps.appr_yr 
                                  and sale_id = 0)

GO


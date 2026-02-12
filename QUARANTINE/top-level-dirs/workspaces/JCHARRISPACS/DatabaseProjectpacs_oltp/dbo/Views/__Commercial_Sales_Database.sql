create view __Commercial_Sales_Database as

SELECT DISTINCT 
convert(varchar(20), s.sl_dt, 101)				as 'Sale_Date', 
s.sl_price										as 'Sale_Price', 
r.excise_number									as 'Excise_Number', 
s.sl_type_cd									as 'Sale_Code', 

s.num_days_on_market							as 'Days_on_Mkt', 
p.geo_id										as 'Parcel_ID', 
' '												as 'Economic_Unit',
si.situs_display								as 'Situs_Address', 
'Benton'										as 'Situs_County',
pv.legal_acreage								as 'land_acres', 
pp.state_cd										as 'property_code',
p.zoning										as 'zoning',
idt.num_units									as 'number_of_units',
i.imprv_desc									as 'structure_type',
--pv.subset_cd as 'structure_type',
pp.living_area									as 'structure_sqft',
pp.class_cd										as 'quality',
pp.condition_cd									as 'condition',
COMM_Framing_Class_Feature						as 'structure_framing_class',
pv.property_use_cd								as 'primary_use_code',
isnull(pv.property_use_cd, '100%')				as 'primary_use_percentage',
pv.secondary_use_cd as secondary_use_code,
isnull(pv.secondary_use_cd, '100%')				as 'secondary_use_percentage',
pp.eff_yr_blt									as 'effective_yr_built',
(pv.land_hstd_val + pv.land_non_hstd_val + pv.timber_market + pv.ag_market) as 'assessed_land_value',
(pv.imprv_hstd_val + pv.imprv_non_hstd_val)		as 'assessed_imp_value',
pv.income_market as income_approach_value,
pv.cost_value as cost_approach_value,
Cap_Rate, 
' '											    as 'notes'
FROM
 property_val pv WITH (nolock)
INNER JOIN 
prop_supp_assoc psa WITH (nolock) ON 
       pv.prop_id = psa.prop_id 
       AND pv.prop_val_yr = psa.owner_tax_yr
       AND pv.sup_num = psa.sup_num
INNER JOIN 
property p WITH (nolock) ON
       pv.prop_id = p.prop_id
INNER JOIN 
imprv i WITH (nolock) ON      
       pv.prop_id = i.prop_id 
       AND pv.prop_val_yr = i.prop_val_yr
       AND pv.sup_num = i.sup_num
       AND i.sale_id = 0
       AND i.imprv_type_cd = 'C'
INNER JOIN 
imprv_detail idt WITH (nolock) ON    
       pv.prop_id = idt.prop_id 
       AND pv.prop_val_yr = idt.prop_val_yr
       AND pv.sup_num = idt.sup_num
       AND idt.sale_id = 0
       AND i.imprv_id = idt.imprv_id
INNER JOIN 
property_profile pp WITH (nolock) ON 
       pv.prop_id = pp.prop_id 
       AND pv.prop_val_yr = pp.prop_val_yr
INNER JOIN 
chg_of_owner_prop_assoc copa WITH (nolock) ON      
       pv.prop_id = copa.prop_id 
INNER JOIN 
chg_of_owner coo WITH (nolock) ON    
       copa.chg_of_owner_id = coo.chg_of_owner_id
INNER JOIN 
sale s WITH (nolock) ON 
       copa.chg_of_owner_id = s.chg_of_owner_id
INNER JOIN 
reet r WITH (nolock) ON
       coo.excise_number = r.excise_number
LEFT OUTER JOIN 
situs si WITH (nolock) ON
       pv.prop_id = si.prop_id
       AND isnull(si.primary_situs, 'N') = 'Y'

--this will get the COMM Framing Class info
LEFT OUTER JOIN
       (select distinct idt1.prop_id, idt1.prop_val_yr, 
       a1.imprv_attr_desc as COMM_Framing_Class,
       ia1.i_attr_val_cd as COMM_Framing_Class_Feature
       from 
	   imprv_detail idt1 with (nolock)
       left outer join 
	   imprv_attr ia1 with (nolock) on
              idt1.prop_id = ia1.prop_id
              and idt1.prop_val_yr = ia1.prop_val_yr
              and idt1.sup_num = ia1.sup_num
              and idt1.imprv_id = ia1.imprv_id
              and idt1.imprv_det_id = ia1.imprv_det_id
              and ia1.sale_id = 0
       left outer join 
	   attribute a1 with (nolock) on
              ia1.i_attr_val_id = a1.imprv_attr_id
       where idt1.sale_id = 0
       and a1.imprv_attr_id = 39) as a
       on pv.prop_id = a.prop_id
       and pv.prop_val_yr = a.prop_val_yr

---this gets the Cap Rate
LEFT OUTER JOIN 
       (select distinct ipa.prop_id, ipa.prop_val_yr, ipa.sup_num,
       inc.income_value as Income_Value, inc.DC_CAPR as Cap_Rate
       from 
	   income_prop_assoc ipa with (nolock) 
       left outer join 
	   income inc with (nolock) on
       ipa.income_id = inc.income_id 
              and ipa.prop_val_yr = inc.income_yr
              and ipa.sup_num = inc.sup_num) as b
       on pv.prop_id = b.prop_id
       and pv.prop_val_yr = b.prop_val_yr
WHERE
 pv.prop_val_yr = (select appr_yr from pacs_oltp.dbo.pacs_system)
AND pv.prop_inactive_dt is null 
AND s.sl_price > 0
AND coo.deed_dt >= '01/01/2010'---you can change the date as needed

GO


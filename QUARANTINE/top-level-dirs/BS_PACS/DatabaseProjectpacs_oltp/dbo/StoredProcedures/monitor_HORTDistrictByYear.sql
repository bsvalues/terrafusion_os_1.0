

CREATE procedure [dbo].[monitor_HORTDistrictByYear]  

/*

	This monitor was written for Benton to provide them a list 
	of properties in the Horticulture Special Assessment for 
	the specified assessment year.

	Name: Horticulture District Parcel List

	Variable: Year needed

	Command: {Call monitor_HORTDistrictByYear (2022)}

*/


@year	int


as  

SELECT DISTINCT pv.Prop_ID, p.geo_id as Parcel_Number, 
ac.file_as_name as Owner_Name,
saa.Assessment_CD, pv.Property_Use_Cd, pu.Property_Use_Desc, 
dbo.fn_GetExemptions(pv.prop_id, pv.prop_val_yr, pv.sup_num) as Exemptions,
pv.prop_val_yr
FROM property_val pv WITH (nolock)
INNER JOIN prop_supp_assoc psa WITH (nolock) ON
	pv.prop_id = psa.prop_id
	AND pv.prop_val_yr = psa.owner_tax_yr
	AND pv.sup_num = psa.sup_num
INNER JOIN property p WITH (nolock) ON
	pv.prop_id = p.prop_id
INNER JOIN owner o WITH (nolock) ON
	pv.prop_id = o.prop_id
	AND pv.prop_val_yr = o.owner_tax_yr
	AND pv.sup_num = o.sup_num
INNER JOIN account ac WITH (nolock) ON
	ac.acct_id = o.owner_id
INNER JOIN property_special_assessment psaa WITH (nolock) ON
	pv.prop_id = psaa.prop_id
	AND pv.prop_val_yr = psaa.year
	AND pv.sup_num = psaa.sup_num
INNER JOIN special_assessment_agency saa WITH (nolock) ON
	psaa.agency_id = saa.agency_id
	AND saa.assessment_cd = 'HORT'
LEFT OUTER JOIN property_use pu WITH (nolock) ON
	pv.property_use_cd = pu.property_use_cd
WHERE pv.prop_val_yr = @year
AND pv.prop_inactive_dt is null
ORDER BY p.geo_id

GO




/*
	This monitor was written for Benton Co.
	It returns all props that have are totally
	exempt for the current year.
	
	Name: Totally exempt properties
	
	command: {call MonitorEXprops}
	
	
	if object_id('dbo.MonitorEXprops') is not null
   begin
      drop procedure dbo.MonitorEXprops
   end
   
GO
*/

CREATE procedure [dbo].MonitorEXprops


as


SELECT DISTINCT pv.prop_id, p.geo_id, ac.file_as_name, pe.exmpt_subtype_cd,
dbo.fn_GetExemptions(pv.prop_id, pv.prop_val_yr, pv.sup_num) as Exemptions,
pv.legal_desc, pv.prop_val_yr
FROM property_val pv WITH (nolock)
INNER JOIN prop_supp_assoc psa WITH (nolock) ON
	pv.prop_id = psa.prop_id
	AND pv.prop_val_yr = psa.owner_tax_yr
	AND pv.sup_num = psa.sup_num
INNER JOIN property p with (nolock) ON
	p.prop_id = pv.prop_id
INNER JOIN owner o with (nolock) ON
	pv.prop_id = o.prop_id
	and pv.prop_val_yr = o.owner_tax_yr
	and pv.sup_num = o.sup_num
INNER JOIN account ac with (nolock) ON
	o.owner_id = ac.acct_id
INNER JOIN property_exemption pe WITH (nolock) ON
	pv.prop_id = pe.prop_id
	AND pv.prop_val_yr = pe.owner_tax_yr
	AND pv.sup_num = pe.sup_num
	AND o.owner_id = pe.owner_id
	AND pe.exmpt_type_cd = 'EX'
INNER JOIN pacs_system ps WITH (nolock) ON
	pv.prop_val_yr = ps.appr_yr
WHERE pv.prop_val_yr = ps.appr_yr
AND pv.prop_inactive_dt is null
ORDER BY p.geo_id

GO


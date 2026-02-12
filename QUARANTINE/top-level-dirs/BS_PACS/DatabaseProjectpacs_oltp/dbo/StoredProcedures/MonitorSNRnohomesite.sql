


/*
	This monitor was written for Benton Co.
	It returns all props that have a SNR/DSBL
	and the improvement homesite is not checked
	for the current year.
	
	Name: SNR/DSBL props with improvement homesite not checked
	
	command: {call MonitorSNRnohomesite}
	
	
	if object_id('dbo.MonitorSNRnohomesite') is not null
   begin
      drop procedure dbo.MonitorSNRnohomesite
   end
   
GO
*/

CREATE procedure [dbo].MonitorSNRnohomesite


as


SELECT DISTINCT pv.prop_id, p.geo_id, pv.prop_val_yr, ac.file_as_name, 
i.imprv_id, i.imprv_homesite, pe.exmpt_subtype_cd,
dbo.fn_GetExemptions(pv.prop_id, pv.prop_val_yr, pv.sup_num) as Exemptions,
pv.legal_desc
FROM property_val pv WITH (nolock)
INNER JOIN prop_supp_assoc psa WITH (nolock) ON
	pv.prop_id = psa.prop_id
	AND pv.prop_val_yr = psa.owner_tax_yr
	AND pv.sup_num = psa.sup_num
INNER JOIN property p with (nolock)
	on p.prop_id = pv.prop_id
	and p.prop_type_cd = 'R'
INNER JOIN owner o with (nolock) on
	pv.prop_id = o.prop_id
	and pv.prop_val_yr = o.owner_tax_yr
	and pv.sup_num = o.sup_num
INNER JOIN account ac with (nolock) on
	o.owner_id = ac.acct_id
INNER JOIN imprv i WITH (nolock) ON
	pv.prop_id = i.prop_id
	AND pv.prop_val_yr = i.prop_val_yr
	AND pv.sup_num = i.sup_num
	AND i.sale_id = 0
INNER JOIN property_exemption pe WITH (nolock) ON
	pv.prop_id = pe.prop_id
	AND pv.prop_val_yr = pe.owner_tax_yr
	AND pv.sup_num = pe.sup_num
	AND o.owner_id = pe.owner_id
	AND pe.exmpt_type_cd = 'SNR/DSBL'
INNER JOIN pacs_system ps WITH (nolock) ON
	pv.prop_val_yr = ps.appr_yr
WHERE pv.prop_val_yr = ps.appr_yr
AND pv.prop_inactive_dt is null
AND not exists (select * from imprv i with (nolock)
				where isnull(i.imprv_homesite, 'N') = 'Y'
				and i.sale_id = 0
				and pv.prop_id = i.prop_id
				and pv.prop_val_yr = i.prop_val_yr)
ORDER BY p.geo_id

GO


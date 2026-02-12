/***
	This monitor was written for Benton Co. It returns
	all properties that the Improvement Actual Year Built
	does not equal the Improvement Detail Actual Year Built
	for MA's with and overide on the Improvement Detail 
	Actual Year Built.  This monitor runs for whatever the
	current year is.


	Name: Imprv Actual Yr Blt not equal to Detail Yr Blt

	Command:  {call monitorActualYrBlt}


***/

CREATE PROCEDURE [dbo].[monitorActualYrBlt]


as


SELECT DISTINCT pv.prop_id, i.imprv_id,
i.actual_year_built as 'Imprv Actual Yr Built',
idt.yr_built as 'Imprv Detail Actual Yr Built', 
idt.actual_year_built_override as 'Imprv Detail Actual Yr Built Override',
pv.prop_val_yr
FROM property_val pv WITH (nolock)
INNER JOIN prop_supp_assoc psa WITH (nolock) ON
	pv.prop_id = psa.prop_id
  	AND pv.prop_val_yr = psa.owner_tax_yr
  	AND pv.sup_num = psa.sup_num
INNER JOIN imprv i WITH (nolock) ON
	pv.prop_id = i.prop_id
	AND pv.prop_val_yr = i.prop_val_yr
	AND pv.sup_num = i.sup_num
	AND i.sale_id = 0	
INNER JOIN imprv_detail idt WITH (nolock) ON
	pv.prop_id = idt.prop_id
	AND pv.prop_val_yr = idt.prop_val_yr
	AND pv.sup_num = idt.sup_num
	AND idt.sale_id = 0
	AND idt.imprv_det_type_cd = 'MA'
	AND i.imprv_id = idt.imprv_id
WHERE pv.prop_val_yr = 2018
AND pv.prop_inactive_dt is null
AND i.actual_year_built <> idt.yr_built
AND idt.actual_year_built_override = 1
ORDER BY pv.prop_id

GO


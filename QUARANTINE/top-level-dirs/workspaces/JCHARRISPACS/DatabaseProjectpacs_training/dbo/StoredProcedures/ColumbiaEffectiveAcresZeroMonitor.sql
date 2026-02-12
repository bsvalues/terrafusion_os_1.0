
CREATE PROCEDURE [dbo].[ColumbiaEffectiveAcresZeroMonitor]

as


select 	pv.prop_id, 
	pv.prop_val_yr, 
	pv.eff_size_acres as 'Property Effective Acres',
	pv.legal_acreage,
	pv.eff_size_acres - pv.legal_acreage as 'Difference'
       
from property_val as pv with (nolock)
join pacs_system py with (nolock)
	on py.appr_yr = pv.prop_val_yr
where pv.eff_size_acres = 0
and pv.legal_acreage > 0
order by 5, pv.prop_id




SET QUOTED_IDENTIFIER OFF

GO



CREATE procedure ProTax_ProtesterExport

as

set nocount on

select a.prop_id, a.prop_val_yr, a.case_id, 
	case when pa.confidential_flag = 'T' then 'CONFIDENTIAL FLAG' else pa.file_as_name end as protest_by_name, 
	appba.prot_by_type, appba.primary_protester as is_primary_protester
from _arb_protest as a
with (nolock)
inner join _arb_protest_protest_by_assoc as appba
with (nolock)
on appba.case_id = a.case_id
and appba.prop_id = a.prop_id
and appba.prop_val_yr = a.prop_val_yr
inner join account as pa
with (nolock)
on appba.prot_by_id = pa.acct_id
order by a.prop_val_yr, a.prop_id, a.case_id, is_primary_protester desc, protest_by_name

GO


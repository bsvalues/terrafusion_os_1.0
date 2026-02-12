

CREATE procedure [dbo].[monitor_LitigationExemptions]

/*************************

This monitor was written for Benton County to return a list of all 
properties associated with a given litigation record that have an exemption on the property

*************************/

@litigation_id datetime

as

select pv.prop_id, (max(lsa.year) + 1) as max_yr, pe.exmpt_type_cd
from property_val pv with(nolock)
join prop_supp_assoc psa with(nolock)
	on psa.prop_id = pv.prop_id
	and psa.owner_tax_yr = pv.prop_val_yr
	and psa.sup_num = pv.sup_num
join property_exemption pe with(nolock)
	on pe.prop_id = pv.prop_id
	and pe.exmpt_tax_yr = pv.prop_val_yr
	and pe.sup_num = pv.sup_num
join litigation_statement_assoc lsa with(nolock)
	on lsa.prop_id = pv.prop_id
where pv.prop_val_yr >= lsa.year
and lsa.litigation_id = @litigation_id
group by pv.prop_id, pe.exmpt_type_cd

GO


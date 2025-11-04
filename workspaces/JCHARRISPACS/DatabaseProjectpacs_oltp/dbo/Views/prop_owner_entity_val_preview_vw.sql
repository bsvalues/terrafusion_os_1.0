


create view prop_owner_entity_val_preview_vw
as
select
	ev_preview.prop_id, 
    ev_preview.owner_id, 
    ev_preview.sup_num, 
    ev_preview.sup_yr, 
    ev_preview.entity_id, entity.entity_cd, 
    ev_preview.taxable_val, 
    ev_preview.assessed_val, 
    sum(e_exemption.state_amt) as state_amt, 
    sum(e_exemption.local_amt) as local_amt
from entity
inner join prop_owner_entity_val_preview as ev_preview on
    entity.entity_id = ev_preview.entity_id
left outer join property_entity_exemption_preview as e_exemption on
    ev_preview.entity_id = e_exemption.entity_id
     AND 
    ev_preview.sup_yr = e_exemption.exmpt_tax_yr
     AND 
    ev_preview.sup_num = e_exemption.sup_num
     AND 
    ev_preview.prop_id = e_exemption.prop_id
     AND 
    ev_preview.owner_id = e_exemption.owner_id
group by
	ev_preview.prop_id, 
    ev_preview.owner_id, 
    ev_preview.sup_num, 
    ev_preview.sup_yr, 
    ev_preview.entity_id,
	entity.entity_cd, 
    ev_preview.taxable_val, 
    ev_preview.assessed_val

GO


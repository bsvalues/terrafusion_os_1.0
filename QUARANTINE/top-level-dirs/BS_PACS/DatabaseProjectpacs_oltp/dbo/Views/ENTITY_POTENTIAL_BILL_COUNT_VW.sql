












create view ENTITY_POTENTIAL_BILL_COUNT_VW
as
SELECT count(*)as bill_count, 
       entity_prop_assoc.entity_id, 
       entity_prop_assoc.tax_yr,
       entity_prop_assoc.sup_num
FROM entity_prop_assoc INNER JOIN
    owner ON entity_prop_assoc.prop_id = owner.prop_id AND 
    entity_prop_assoc.tax_yr = owner.owner_tax_yr AND 
    entity_prop_assoc.sup_num = owner.sup_num
group by entity_prop_assoc.entity_id, 
         entity_prop_assoc.tax_yr,
         entity_prop_assoc.sup_num

GO







CREATE VIEW dbo.PTD_AUD_VW
AS
SELECT property_owner_entity_state_cd.prop_id, 
    property_owner_entity_state_cd.year, 
    property_owner_entity_state_cd.sup_num, 
    property_owner_entity_state_cd.owner_id, 
    property_owner_entity_state_cd.entity_id, 
    property_owner_entity_state_cd.state_cd, 
    land_type.state_land_type_desc, land_detail.size_acres, 
    land_detail.land_seg_mkt_val, land_detail.ag_use_cd, 
    land_detail.ag_val, entity.taxing_unit_num
FROM property_owner_entity_state_cd INNER JOIN
    land_detail ON 
    property_owner_entity_state_cd.prop_id = land_detail.prop_id AND
     property_owner_entity_state_cd.year = land_detail.prop_val_yr
     AND 
    property_owner_entity_state_cd.sup_num = land_detail.sup_num
     AND land_detail.sale_id = 0 INNER JOIN
    land_type ON 
    land_detail.land_type_cd = land_type.land_type_cd INNER JOIN
    entity ON 
    property_owner_entity_state_cd.entity_id = entity.entity_id INNER
     JOIN
    tax_rate ON 
    property_owner_entity_state_cd.entity_id = tax_rate.entity_id AND
     property_owner_entity_state_cd.year = tax_rate.tax_rate_yr
WHERE (tax_rate.ptd_option = 'T') AND 
    (ISNULL(entity.ptd_multi_unit, '') <> 'D') AND 
    (ISNULL(entity.ptd_multi_unit, '') <> 'X')

GO


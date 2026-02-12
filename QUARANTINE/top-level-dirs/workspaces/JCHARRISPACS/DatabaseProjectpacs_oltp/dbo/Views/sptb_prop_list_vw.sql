





CREATE VIEW dbo.sptb_prop_list_vw
AS
SELECT DISTINCT 
    sptb_prop_state_vw.state_cd, sptb_prop_state_vw.prop_id, 
    sptb_prop_state_vw.owner_tax_yr, 
    sptb_prop_state_vw.sup_num, 
    entity_prop_assoc.entity_id
FROM sptb_prop_state_vw INNER JOIN
    entity_prop_assoc ON 
    sptb_prop_state_vw.prop_id = entity_prop_assoc.prop_id AND 
    sptb_prop_state_vw.owner_tax_yr = entity_prop_assoc.tax_yr AND
     sptb_prop_state_vw.sup_num = entity_prop_assoc.sup_num
WHERE EXISTS
        (SELECT *
      FROM land_detail
      WHERE sptb_prop_state_vw.prop_id = land_detail.prop_id AND
            sptb_prop_state_vw.owner_tax_yr = land_detail.prop_val_yr
            AND 
           sptb_prop_state_vw.sup_num = land_detail.sup_num AND
            sptb_prop_state_vw.state_cd = land_detail.state_cd) OR
    EXISTS
        (SELECT *
      FROM imprv
      WHERE sptb_prop_state_vw.prop_id = imprv.prop_id AND 
           sptb_prop_state_vw.owner_tax_yr = imprv.prop_val_yr AND
            sptb_prop_state_vw.sup_num = imprv.sup_num AND 
           sptb_prop_state_vw.state_cd = imprv.imprv_state_cd) OR
    EXISTS
        (SELECT *
      FROM pers_prop_seg
      WHERE sptb_prop_state_vw.prop_id = pers_prop_seg.prop_id
            AND 
           sptb_prop_state_vw.owner_tax_yr = pers_prop_seg.prop_val_yr
            AND 
           sptb_prop_state_vw.sup_num = pers_prop_seg.sup_num
            AND 
           sptb_prop_state_vw.state_cd = pers_prop_seg.pp_state_cd)

GO


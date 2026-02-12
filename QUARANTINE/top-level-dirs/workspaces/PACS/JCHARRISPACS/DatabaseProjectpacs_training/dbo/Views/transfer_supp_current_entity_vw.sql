
--Revision 1.0 HS 14736 PratimaV Changed outer to inner join

CREATE VIEW dbo.transfer_supp_current_entity_vw
AS
SELECT     dbo.entity.entity_cd, dbo.entity.entity_type_cd, CONVERT(varchar(50), dbo.account.file_as_name) AS file_as_name, 
                      dbo.entity_prop_assoc.entity_prop_id, dbo.prop_owner_entity_val.prop_id, dbo.prop_owner_entity_val.owner_id, dbo.prop_owner_entity_val.sup_num,
                       dbo.prop_owner_entity_val.sup_yr, dbo.prop_owner_entity_val.taxable_val, dbo.prop_owner_entity_val.assessed_val, 
                      dbo.prop_owner_entity_val.entity_id, ISNULL(dbo.entity_prop_assoc.entity_prop_pct, 0) as entity_prop_pct , dbo.prop_owner_entity_val.market_val, 
                      dbo.prop_owner_entity_val.appraised_val, dbo.prop_owner_entity_val.ten_percent_cap, dbo.prop_owner_entity_val.ag_late_loss, 
                      dbo.prop_owner_entity_val.freeport_late_loss, dbo.prop_owner_entity_val.land_hstd_val, dbo.prop_owner_entity_val.land_non_hstd_val, 
                      dbo.prop_owner_entity_val.imprv_hstd_val, dbo.prop_owner_entity_val.imprv_non_hstd_val, dbo.prop_owner_entity_val.ag_market, 
                      dbo.prop_owner_entity_val.ag_use_val, dbo.prop_owner_entity_val.timber_market, dbo.prop_owner_entity_val.timber_use, 
                      dbo.property_val.sup_action
FROM         dbo.entity_prop_assoc  INNER JOIN -- RIGHT OUTER JOIN HS 14736 PratimaV Changed outer to inner join
                      dbo.entity INNER JOIN
                      dbo.account ON dbo.entity.entity_id = dbo.account.acct_id INNER JOIN
                      dbo.prop_owner_entity_val ON dbo.entity.entity_id = dbo.prop_owner_entity_val.entity_id INNER JOIN
                      dbo.property_val INNER JOIN
                      dbo.transfer_appraisal_info_supp_assoc ON dbo.property_val.prop_id = dbo.transfer_appraisal_info_supp_assoc.prop_id AND 
                      dbo.property_val.prop_val_yr = dbo.transfer_appraisal_info_supp_assoc.owner_tax_yr AND 
                      dbo.property_val.sup_num = dbo.transfer_appraisal_info_supp_assoc.sup_num ON 
                      dbo.prop_owner_entity_val.prop_id = dbo.property_val.prop_id AND dbo.prop_owner_entity_val.sup_yr = dbo.property_val.prop_val_yr AND 
                      dbo.prop_owner_entity_val.sup_num = dbo.property_val.sup_num ON dbo.entity_prop_assoc.entity_id = dbo.prop_owner_entity_val.entity_id AND 
                      dbo.entity_prop_assoc.prop_id = dbo.prop_owner_entity_val.prop_id AND dbo.entity_prop_assoc.sup_num = dbo.prop_owner_entity_val.sup_num AND
                       dbo.entity_prop_assoc.tax_yr = dbo.prop_owner_entity_val.sup_yr

GO


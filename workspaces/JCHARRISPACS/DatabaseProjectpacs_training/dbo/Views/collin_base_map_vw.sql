
CREATE VIEW dbo.collin_base_map_vw
AS
SELECT DISTINCT 
                      dbo.abs_subdv.abs_subdv_cd, dbo.abs_subdv.abs_subdv_desc, dbo.property_val.block, dbo.property_val.tract_or_lot, dbo.situs.situs_num, 
                      dbo.situs.situs_street, dbo.property_val.prop_id
FROM         dbo.situs WITH (nolock) RIGHT OUTER JOIN
                      dbo.property_val WITH (nolock) INNER JOIN
                      dbo.prop_supp_assoc WITH (nolock) ON dbo.property_val.prop_id = dbo.prop_supp_assoc.prop_id AND 
                      dbo.property_val.prop_val_yr = dbo.prop_supp_assoc.owner_tax_yr AND dbo.property_val.sup_num = dbo.prop_supp_assoc.sup_num INNER JOIN
                      dbo.abs_subdv WITH (nolock) ON dbo.property_val.abs_subdv_cd = dbo.abs_subdv.abs_subdv_cd AND 
                      dbo.property_val.prop_val_yr = dbo.abs_subdv.abs_subdv_yr INNER JOIN
                      dbo.pacs_system WITH (nolock) ON dbo.prop_supp_assoc.owner_tax_yr = dbo.pacs_system.appr_yr ON 
                      dbo.situs.prop_id = dbo.prop_supp_assoc.prop_id
WHERE     (dbo.property_val.abs_subdv_cd <> 'N') AND (dbo.property_val.abs_subdv_cd IS NOT NULL)

GO


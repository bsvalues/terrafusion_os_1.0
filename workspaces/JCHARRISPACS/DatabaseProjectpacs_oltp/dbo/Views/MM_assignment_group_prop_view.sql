

CREATE VIEW [dbo].[MM_assignment_group_prop_view] AS 
SELECT     pp.prop_id, m.mobile_assignment_group_id, pp.abs_subdv, pp.map_id, pp.neighborhood, pp.region, pp.state_cd, pp.subset,
(select
   distinct 
    stuff((
        select ', ' + u.prop_group_cd
        from prop_group_assoc u (nolock)
        where 1=1
        --u.prop_group_cd = p.prop_group_cd
        and m.prop_id=u.prop_id
        order by u.prop_group_cd
        for xml path('')
    ),1,1,'')) as group_codes,
(select
   distinct 
    stuff((
        select ', ' + e.entity_cd
        from entity_prop_assoc epa
			join entity e on
			epa.entity_id=e.entity_id 
        where 1=1
        --u.prop_group_cd = p.prop_group_cd
        and m.prop_id=epa.prop_id
        and m.prop_val_yr=epa.tax_yr
        and m.sup_num=epa.sup_num
        order by e.entity_cd
        for xml path('')
    ),1,1,'')) as entities,
   pp.property_use_cd
FROM         dbo.ccProperty AS m INNER JOIN
(SELECT     prop_id, abs_subdv, neighborhood, subset, map_id, region, state_cd, property_use_cd
FROM          dbo.property_profile p (nolock)
WHERE      (prop_val_yr IN
(SELECT     appr_yr
FROM          dbo.pacs_system))) AS pp ON m.prop_id = pp.prop_id AND m.prop_val_yr = m.prop_val_yr

GO


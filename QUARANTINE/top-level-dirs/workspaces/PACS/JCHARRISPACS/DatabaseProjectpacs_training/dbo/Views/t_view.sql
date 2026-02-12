
create view t_view

as

Select p.prop_id,  o.owner_id

From property p LEFT OUTER JOIN owner o ON p.prop_id = o.prop_id AND p.prop_type_cd = 'p' AND o.owner_tax_yr = 2003

INNER JOIN property_val pv ON p.prop_id = pv.prop_id and pv.prop_val_yr = 2003 AND o.prop_id = pv.prop_id 

INNER JOIN pp_rendition_tracking rt ON rt.prop_id = p.prop_id and pv.prop_val_yr = rt.prop_val_yr 

LEFT OUTER JOIN pers_prop_rendition ppr ON ppr.prop_id = p.prop_id AND ppr.rendition_year = 2003

GO


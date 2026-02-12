CREATE VIEW pers_prop_rendition_column_layout_vw 
AS
SELECT pprc.pp_type_cd, pt.pp_type_desc,
       ppr_col.pp_rend_column, ppr_col.column_display,
       ppr_col.column_order, ppr_col.default_pp_type_cd
FROM   pers_prop_rendition_columns AS ppr_col
       INNER JOIN pers_prop_rendition_config AS pprc
       INNER JOIN pp_type AS pt
       ON pprc.pp_type_cd = pt.pp_type_cd
       ON ppr_col.pp_rend_column = pprc.pp_rend_column

GO


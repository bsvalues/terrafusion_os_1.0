







CREATE VIEW dbo.SHARED_PROP_VALUE_TOTAL_VW
AS
SELECT shared_prop.pacs_prop_id, shared_prop.shared_year, 
    shared_prop.shared_cad_code, 
    shared_prop_land_imprv_total_vw.shared_imp_land_value_total,
     shared_prop_prod_value_total_vw.shared_prod_value_total,
	 shared_prop.sup_num
FROM shared_prop_prod_value_total_vw RIGHT OUTER JOIN
    shared_prop ON 
    shared_prop_prod_value_total_vw.pacs_prop_id = shared_prop.pacs_prop_id
     AND 
    shared_prop_prod_value_total_vw.shared_year = shared_prop.shared_year
     AND 
    shared_prop_prod_value_total_vw.shared_cad_code = shared_prop.shared_cad_code
     AND 
    shared_prop_prod_value_total_vw.sup_num = shared_prop.sup_num
     LEFT OUTER JOIN
    shared_prop_land_imprv_total_vw ON 
    shared_prop.pacs_prop_id = shared_prop_land_imprv_total_vw.pacs_prop_id
     AND 
    shared_prop.shared_year = shared_prop_land_imprv_total_vw.shared_year
     AND 
    shared_prop.shared_cad_code = shared_prop_land_imprv_total_vw.shared_cad_code

GO


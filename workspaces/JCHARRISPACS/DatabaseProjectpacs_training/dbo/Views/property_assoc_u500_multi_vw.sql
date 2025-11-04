
CREATE VIEW property_assoc_u500_multi_vw
AS
SELECT DISTINCT
	u500_multi.prop_val_yr, 
	u500_multi.sup_num, 
	u500_multi.prop_id, 
	u500_multi.prop_id_linked
FROM (
	SELECT
		prop_val_yr,
		sup_num,
		prop_id = parent_prop_id,
		prop_id_linked = child_prop_id
	FROM property_assoc AS pa
	JOIN link_sub_type AS lst ON
		lst.link_sub_type_cd = pa.link_sub_type_cd AND lst.u500 = 1

	UNION ALL

	SELECT
		prop_val_yr,
		sup_num,
		prop_id = child_prop_id,
		prop_id_linked = parent_prop_id
	FROM property_assoc AS pa
	JOIN link_sub_type AS lst ON
		lst.link_sub_type_cd = pa.link_sub_type_cd AND lst.u500 = 1

	UNION ALL

	SELECT
		prop_val_yr,
		sup_num,
		prop_id = parent_prop_id,
		prop_id_linked = parent_prop_id
	FROM property_assoc AS pa
	JOIN link_sub_type AS lst ON
		lst.link_sub_type_cd = pa.link_sub_type_cd AND lst.u500 = 1
) 
AS u500_multi

GO


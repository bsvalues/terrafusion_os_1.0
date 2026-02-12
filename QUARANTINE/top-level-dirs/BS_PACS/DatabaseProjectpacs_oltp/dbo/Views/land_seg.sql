	create view land_seg as
	
	SELECT ld.prop_id,ld.land_seg_id, lt.land_type_desc
	FROM land_detail as ld
	WITH (NOLOCK)

	INNER JOIN land_type as lt
	WITH (NOLOCK)
	ON ld.land_type_cd = lt.land_type_cd

	WHERE ld.prop_val_yr =(select appr_yr from pacs_system)
	AND ld.sup_num = 0
	AND ld.sale_id = 0
	--AND ld.prop_id = lt.prop_id

GO


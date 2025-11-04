

CREATE  PROCEDURE MMGetPropertyInfo

	@prop_id int

with recompile
AS

	SET NOCOUNT ON

	declare @appr_year numeric(4,0)

	SELECT @appr_year = appr_yr
	FROM pacs_system
	WHERE system_type = 'A'
	OR system_type = 'B'

	SELECT a.file_as_name,
			REPLACE(isnull(s.situs_display, ''), CHAR(13) + CHAR(10), ' ') as situs ,
			p.geo_id,
			pv.prop_inactive_dt,
			CONVERT(varchar(50), '') as extra1

	FROM property as p
	WITH (NOLOCK)

	INNER JOIN property_val as pv
	WITH (NOLOCK)
	ON p.prop_id = pv.prop_id

	INNER JOIN owner as o
	WITH (NOLOCK)
	ON pv.prop_id = o.prop_id
	AND pv.prop_val_yr = o.owner_tax_yr
	AND pv.sup_num = o.sup_num

	INNER JOIN account as a
	WITH (NOLOCK)
	ON o.owner_id = a.acct_id

	LEFT OUTER JOIN situs as s
	WITH (NOLOCK)
	ON p.prop_id = s.prop_id
	AND s.primary_situs = 'Y'

	WHERE p.prop_id = @prop_id
	and pv.prop_val_yr = @appr_year
	and pv.sup_num = 0


	SELECT i.imprv_id, it.imprv_type_desc, id.imprv_det_id, 
			rtrim(id.imprv_det_type_cd) + ' - ' + idt.imprv_det_typ_desc as imprv_det_desc
	FROM imprv as i
	WITH (NOLOCK)

	INNER JOIN imprv_type as it
	WITH (NOLOCK)
	ON i.imprv_type_cd = it.imprv_type_cd

	LEFT OUTER JOIN imprv_detail as id
	WITH (NOLOCK)
	ON i.prop_val_yr = id.prop_val_yr
	AND i.prop_val_yr = id.prop_val_yr
	AND i.sup_num = id.sup_num
	AND i.sale_id = id.sale_id
	AND i.imprv_id = id.imprv_id

	LEFT OUTER JOIN imprv_det_type as idt
	ON id.imprv_det_type_cd = idt.imprv_det_type_cd

	WHERE i.prop_val_yr = @appr_year
	AND i.sup_num = 0
	AND i.sale_id = 0
	AND i.prop_id = @prop_id

	ORDER BY i.imprv_id


	SELECT ld.land_seg_id, lt.land_type_desc
	FROM land_detail as ld
	WITH (NOLOCK)

	INNER JOIN land_type as lt
	WITH (NOLOCK)
	ON ld.land_type_cd = lt.land_type_cd

	WHERE ld.prop_val_yr = @appr_year
	AND ld.sup_num = 0
	AND ld.sale_id = 0
	AND ld.prop_id = @prop_id

	ORDER BY ld.land_seg_id


	SELECT bp.bldg_permit_id, bp.bldg_permit_num, bpt.bld_permit_desc
	FROM prop_building_permit_assoc as pbpa
	WITH (NOLOCK)

	INNER JOIN building_permit as bp
	ON pbpa.bldg_permit_id = bp.bldg_permit_id

	LEFT OUTER JOIN bld_permit_type as bpt
	ON bp.bldg_permit_type_cd = bpt.bld_permit_type_cd

	WHERE pbpa.prop_id = @prop_id

	ORDER BY bp.bldg_permit_issue_dt DESC

GO


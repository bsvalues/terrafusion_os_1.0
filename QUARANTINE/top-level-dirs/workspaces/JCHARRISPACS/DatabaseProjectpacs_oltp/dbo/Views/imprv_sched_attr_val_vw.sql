












CREATE VIEW dbo.imprv_sched_attr_val_vw
AS
SELECT
	imprv_sched_attr.imprv_det_meth_cd, 
    	imprv_sched_attr.imprv_det_type_cd,
	imprv_sched_attr.imprv_det_class_cd,
	imprv_sched_attr.imprv_yr,
	imprv_sched_attr.imprv_attr_id,
	attribute_val.imprv_attr_val_cd,
	imprv_attr_val.imprv_attr_up,
	imprv_attr_val.imprv_attr_incr,
	imprv_attr_val.imprv_attr_pct,
	imprv_attr_val.imprv_attr_base_up,
	imprv_attr_val.imprv_attr_base_incr,
	attribute.bModifierFactor
FROM
	attribute_val
INNER JOIN
	imprv_sched_attr
ON
	attribute_val.imprv_attr_id = imprv_sched_attr.imprv_attr_id
INNER JOIN
	attribute
ON
	imprv_sched_attr.imprv_attr_id = attribute.imprv_attr_id
LEFT OUTER JOIN
	imprv_attr_val
ON
	attribute_val.imprv_attr_id = imprv_attr_val.imprv_attr_id
AND	attribute_val.imprv_attr_val_cd = imprv_attr_val.imprv_attr_val_cd
AND	imprv_sched_attr.imprv_det_meth_cd = imprv_attr_val.imprv_det_meth_cd
AND	imprv_sched_attr.imprv_det_type_cd = imprv_attr_val.imprv_det_type_cd
AND	imprv_sched_attr.imprv_det_class_cd = imprv_attr_val.imprv_det_class_cd
AND	imprv_sched_attr.imprv_yr = imprv_attr_val.imprv_yr
AND	imprv_sched_attr.imprv_attr_id = imprv_attr_val.imprv_attr_id

GO


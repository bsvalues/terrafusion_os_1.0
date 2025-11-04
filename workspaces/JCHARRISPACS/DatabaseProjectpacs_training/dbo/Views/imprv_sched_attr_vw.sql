
CREATE VIEW imprv_sched_attr_vw
AS
SELECT  dbo.imprv_sched_attr.imprv_det_meth_cd, 
		dbo.imprv_sched_attr.imprv_det_type_cd, 
		dbo.imprv_sched_attr.imprv_det_class_cd, 
        dbo.imprv_sched_attr.imprv_yr, 
		dbo.imprv_sched_attr.imprv_attr_id, 
		dbo.attribute.imprv_attr_desc,
		dbo.imprv_sched_attr.use_up_for_pct_base, 
        dbo.attribute.bModifierFactor
FROM    dbo.imprv_sched_attr INNER JOIN
             dbo.attribute ON dbo.imprv_sched_attr.imprv_attr_id = dbo.attribute.imprv_attr_id

GO


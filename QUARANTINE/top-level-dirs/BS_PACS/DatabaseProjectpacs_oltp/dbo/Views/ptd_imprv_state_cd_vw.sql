







CREATE VIEW dbo.ptd_imprv_state_cd_vw
AS
SELECT DISTINCT 
    imprv_state_cd, prop_id, prop_val_yr, sup_num
FROM imprv
WHERE (sale_id = 0)
and    imprv_id in (select min(imprv_id)
		    from imprv as i1
		    where i1.prop_id = imprv.prop_id
		    and   i1.sup_num = imprv.sup_num
		    and   i1.prop_val_yr = imprv.prop_val_yr
		    and   i1.sale_id = 0)
GROUP BY imprv_state_cd, prop_id, prop_val_yr, sup_num

GO


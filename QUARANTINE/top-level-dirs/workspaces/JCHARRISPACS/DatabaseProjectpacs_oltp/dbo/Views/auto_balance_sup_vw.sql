

CREATE VIEW dbo.auto_balance_sup_vw
AS

SELECT 
	vt_cur.validation_id,
	sg_tot.sup_group_id,
	vt_cur.prop_val_yr,
	vt_cur.sup_num,
	vt_cur.entity_id as entity_id,
	et.entity_cd as entity_cd,
	vt_cur.taxable_val as vt_cur_taxable_val,
	vt_prev.taxable_val as vt_prev_taxable_val,
	sg_tot.gl_taxable,
	vt_cur.assessed_val as vt_cur_assessed_val,
	vt_prev.assessed_val as vt_prev_assessed_val,
	sg_tot.gl_assessed,
	vt_cur.total_exemption_amount as vt_cur_total_exemption,
	vt_prev.total_exemption_amount as vt_prev_total_exemption,
	sg_tot.gl_exemptions
FROM
validation_totals AS vt_prev
INNER JOIN validation_totals AS vt_cur
ON vt_prev.validation_id = vt_cur.validation_id
AND vt_prev.entity_id = vt_cur.entity_id
AND vt_prev.arb_status = '0'
AND vt_cur.arb_status = '0'
AND vt_cur.sup_num = vt_prev.sup_num + 1
AND vt_cur.prop_val_yr = vt_prev.prop_val_yr
INNER JOIN entity as et
ON vt_cur.entity_id = et.entity_id
INNER JOIN sup_group_entity_subtotal as sg_tot
ON vt_cur.pacs_user_id = sg_tot.pacs_user_id
AND vt_cur.sup_num = sg_tot.sup_num
AND vt_cur.prop_val_yr = sg_tot.sup_yr
AND vt_cur.entity_id = sg_tot.entity_id
AND sg_tot.sup_action = 'T'

GO


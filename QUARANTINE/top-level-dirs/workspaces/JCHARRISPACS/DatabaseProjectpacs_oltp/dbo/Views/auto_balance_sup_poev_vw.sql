

CREATE VIEW dbo.auto_balance_sup_poev_vw
AS

SELECT 
	sgei_cur.sup_group_id as sup_group_id,
	sgei_cur.sup_action as sup_action,
	sgei_cur.sup_num as cur_sup_num,
	sgei_cur.sup_yr as cur_sup_yr,
	sgei_prev.sup_num as prev_sup_num,
	sgei_prev.sup_yr as prev_sup_yr,
	sgei_cur.prop_id as prop_id,
	sgei_cur.entity_id as entity_id,
	case sgei_cur.sup_action
		when 'A' then sgei_cur.taxable
		when 'D' then -sgei_prev.taxable
		else sgei_cur.taxable - sgei_prev.taxable
	end as sup_gl_taxable,
	case sgei_cur.sup_action
		when 'A' then poev_cur.taxable_val
		when 'D' then -poev_prev.taxable_val
		else poev_cur.taxable_val - poev_prev.taxable_val 
	end as poev_gl_taxable,
	case sgei_cur.sup_action
		when 'A' then sgei_cur.assessed
		when 'D' then -sgei_prev.assessed
		else sgei_cur.assessed - sgei_prev.assessed
	end as sup_gl_assessed,
	case sgei_cur.sup_action
		when 'A' then poev_cur.assessed_val
		when 'D' then -poev_prev.assessed_val
		else poev_cur.assessed_val - poev_prev.assessed_val 
	end as poev_gl_assessed
FROM
sup_group_entity_info AS sgei_prev
INNER JOIN sup_group_entity_info AS sgei_cur
ON sgei_prev.sup_group_id = sgei_cur.sup_group_id
AND sgei_prev.sup_yr = sgei_cur.sup_yr
AND sgei_prev.prop_id = sgei_cur.prop_id
AND sgei_prev.entity_id = sgei_cur.entity_id
LEFT OUTER JOIN prop_owner_entity_val as poev_cur
ON poev_cur.sup_num = sgei_cur.sup_num
AND poev_cur.sup_yr = sgei_cur.sup_yr
AND poev_cur.prop_id = sgei_cur.prop_id
AND poev_cur.entity_id = sgei_cur.entity_id
LEFT OUTER JOIN prop_owner_entity_val as poev_prev
ON poev_prev.sup_num = sgei_prev.sup_num
AND poev_prev.sup_yr = sgei_prev.sup_yr
AND poev_prev.prop_id = sgei_prev.prop_id
AND poev_prev.entity_id = sgei_prev.entity_id
WHERE sgei_prev.data_flag = 1
AND sgei_cur.data_flag = 0

GO


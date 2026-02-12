

CREATE VIEW dbo.auto_balance_sup_pv_vw
AS

SELECT 
	sgpi_cur.sup_group_id as sup_group_id,
	sgpi_cur.sup_action as sup_action,
	sgpi_cur.sup_num as cur_sup_num,
	sgpi_cur.sup_yr as cur_sup_yr,
	sgpi_prev.sup_num as prev_sup_num,
	sgpi_prev.sup_yr as prev_sup_yr,
	sgpi_cur.prop_id as prop_id,
		case sgpi_cur.sup_action
		when 'A' then pv_cur.land_hstd_val
		when 'D' then -pv_prev.land_hstd_val
		else pv_cur.land_hstd_val - pv_prev.land_hstd_val
	end as pv_gl_land_hstd_val,
	case sgpi_cur.sup_action
		when 'A' then sgpi_cur.land_hstd_val
		when 'D' then -sgpi_prev.land_hstd_val
		else sgpi_cur.land_hstd_val - sgpi_prev.land_hstd_val
	end as sup_gl_land_hstd_val,
	case sgpi_cur.sup_action
		when 'A' then pv_cur.land_non_hstd_val
		when 'D' then -pv_prev.land_non_hstd_val
		else pv_cur.land_non_hstd_val - pv_prev.land_non_hstd_val
	end as pv_gl_land_non_hstd_val,
	case sgpi_cur.sup_action
		when 'A' then sgpi_cur.land_non_hstd_val
		when 'D' then -sgpi_prev.land_non_hstd_val
		else sgpi_cur.land_non_hstd_val - sgpi_prev.land_non_hstd_val
	end as sup_gl_land_non_hstd_val,
	case sgpi_cur.sup_action
		when 'A' then pv_cur.imprv_hstd_val
		when 'D' then -pv_prev.imprv_hstd_val
		else pv_cur.imprv_hstd_val - pv_prev.imprv_hstd_val
	end as pv_gl_imprv_hstd_val,
	case sgpi_cur.sup_action
		when 'A' then sgpi_cur.imprv_hstd_val
		when 'D' then -sgpi_prev.imprv_hstd_val
		else sgpi_cur.imprv_hstd_val - sgpi_prev.imprv_hstd_val
	end as sup_gl_imprv_hstd_val,
	case sgpi_cur.sup_action
		when 'A' then pv_cur.imprv_non_hstd_val
		when 'D' then -pv_prev.imprv_non_hstd_val
		else pv_cur.imprv_non_hstd_val - pv_prev.imprv_non_hstd_val
	end as pv_gl_imprv_non_hstd_val,
	case sgpi_cur.sup_action
		when 'A' then sgpi_cur.imprv_non_hstd_val
		when 'D' then -sgpi_prev.imprv_non_hstd_val
		else sgpi_cur.imprv_non_hstd_val - sgpi_prev.imprv_non_hstd_val
	end as sup_gl_imprv_non_hstd_val,
	case sgpi_cur.sup_action
		when 'A' then pv_cur.appraised_val
		when 'D' then -pv_prev.appraised_val
		else pv_cur.appraised_val - pv_prev.appraised_val
	end as pv_gl_appraised_val,
	case sgpi_cur.sup_action
		when 'A' then sgpi_cur.appraised_val
		when 'D' then -sgpi_prev.appraised_val
		else sgpi_cur.appraised_val - sgpi_prev.appraised_val
	end as sup_gl_appraised_val,
	case sgpi_cur.sup_action
		when 'A' then pv_cur.assessed_val
		when 'D' then -pv_prev.assessed_val
		else pv_cur.assessed_val - pv_prev.assessed_val
	end as pv_gl_assessed_val,
	case sgpi_cur.sup_action
		when 'A' then sgpi_cur.assessed_val
		when 'D' then -sgpi_prev.assessed_val
		else sgpi_cur.assessed_val - sgpi_prev.assessed_val
	end as sup_gl_assessed_val,
	case sgpi_cur.sup_action
		when 'A' then pv_cur.market
		when 'D' then -pv_prev.market
		else pv_cur.market - pv_prev.market
	end as pv_gl_market,
	case sgpi_cur.sup_action
		when 'A' then sgpi_cur.market
		when 'D' then -sgpi_prev.market
		else sgpi_cur.market - sgpi_prev.market
	end as sup_gl_market,
	case sgpi_cur.sup_action
		when 'A' then pv_cur.ag_use_val
		when 'D' then -pv_prev.ag_use_val
		else pv_cur.ag_use_val - pv_prev.ag_use_val
	end as pv_gl_ag_use_val,
	case sgpi_cur.sup_action
		when 'A' then sgpi_cur.ag_use_val
		when 'D' then -sgpi_prev.ag_use_val
		else sgpi_cur.ag_use_val - sgpi_prev.ag_use_val
	end as sup_gl_ag_use_val,
	case sgpi_cur.sup_action
		when 'A' then pv_cur.ag_market
		when 'D' then -pv_prev.ag_market
		else pv_cur.ag_market - pv_prev.ag_market
	end as pv_gl_ag_market,
	case sgpi_cur.sup_action
		when 'A' then sgpi_cur.ag_market
		when 'D' then -sgpi_prev.ag_market
		else sgpi_cur.ag_market - sgpi_prev.ag_market
	end as sup_gl_ag_market,
	case sgpi_cur.sup_action
		when 'A' then pv_cur.timber_market
		when 'D' then -pv_prev.timber_market
		else pv_cur.timber_market - pv_prev.timber_market
	end as pv_gl_timber_market,
	case sgpi_cur.sup_action
		when 'A' then sgpi_cur.timber_market
		when 'D' then -sgpi_prev.timber_market
		else sgpi_cur.timber_market - sgpi_prev.timber_market
	end as sup_gl_timber_market,
	case sgpi_cur.sup_action
		when 'A' then pv_cur.timber_use
		when 'D' then -pv_prev.timber_use
		else pv_cur.timber_use - pv_prev.timber_use
	end as pv_gl_timber_use,
	case sgpi_cur.sup_action
		when 'A' then sgpi_cur.timber_use
		when 'D' then -sgpi_prev.timber_use
		else sgpi_cur.timber_use - sgpi_prev.timber_use
	end as sup_gl_timber_use

FROM
sup_group_property_info AS sgpi_prev
INNER JOIN sup_group_property_info AS sgpi_cur
ON sgpi_prev.sup_group_id = sgpi_cur.sup_group_id
AND sgpi_prev.sup_yr = sgpi_cur.sup_yr
AND sgpi_prev.prop_id = sgpi_cur.prop_id
LEFT OUTER JOIN property_val as pv_cur
ON pv_cur.sup_num = sgpi_cur.sup_num
AND pv_cur.prop_val_yr = sgpi_cur.sup_yr
AND pv_cur.prop_id = sgpi_cur.prop_id
LEFT OUTER JOIN property_val as pv_prev
ON pv_prev.sup_num = sgpi_prev.sup_num
AND pv_prev.prop_val_yr = sgpi_prev.sup_yr
AND pv_prev.prop_id = sgpi_prev.prop_id
WHERE sgpi_prev.data_flag = 1
AND sgpi_cur.data_flag = 0

GO


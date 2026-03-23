
SELECT DISTINCT 
		pv.prop_val_yr,
		p.geo_id,
		pv.prop_id as Property_ID,
		pv.hood_cd,
		pv.property_use_cd,
		pv.appr_method,
		pv.market,
		pv.imprv_val [Imprv_Val],
		pp.actual_year_built,
		pp.eff_yr_blt,
		pp.living_area,
		pp.imprv_det_quality_cd,
		CASE 
			WHEN pv.property_use_cd = '00100' THEN md1.cell_value
			WHEN pv.property_use_cd = '00200' THEN md2.cell_value
			WHEN pv.property_use_cd = '00600' THEN md3.cell_value
			END [B-NBHD-Factor],
		pv.land_hstd_val + pv.land_non_hstd_val + pv.timber_market + pv.ag_market [Land_Val],
		pv.legal_acreage,
		pp.land_appr_method,
		pp.land_unit_price,
		pp.main_land_total_adj,
		pp.main_land_unit_price,
		ic.Improvement_Count,
		lc.Land_Line_Count,
		ISNULL(ifv.Imprv_Flat_Value, 'NO') [Imprv_Flat_Value],
		ISNULL(lfv.Land_Flat_Value, 'NO') [Land_Flat_Value],
		ISNULL(pegs.Nonzero_PEGS, 'NO') [Nonzero_PEGS],
		ISNULL(cl.Conditioned_Land, 'NO') [Conditioned_Land],
		ISNULL(ll.Not_1_Lot,'NO') [Not_1_Lot],
		-- Create calculated fields to sum as "Potential Error" later. These won't exist in final output but "Potential Error" will
		CASE WHEN ic.Improvement_Count > 1 THEN 1
		ELSE 0 END [Counter1],
		CASE WHEN lc.Land_Line_Count > 1 THEN 1
		ELSE 0 END [Counter2],
		CASE WHEN ifv.Imprv_Flat_Value = 'YES' THEN 1
		ELSE 0 END [Counter3],
		CASE WHEN lfv.Land_Flat_Value = 'YES' THEN 1
		ELSE 0 END [Counter4],
		CASE WHEN pegs.Nonzero_PEGS = 'YES' THEN 1
		ELSE 0 END [Counter5],
		CASE WHEN cl.Conditioned_Land = 'YES' THEN 1
		ELSE 0 END [Counter6],
		CASE WHEN ll.Not_1_Lot = 'YES' THEN 1
		ELSE 0 END [Counter7],
		sales.sl_price,
		sales.sl_dt,
		sales.sl_county_ratio_cd,
		sales.Grantor,
		sales.Grantee
FROM
		dbo.property p
		LEFT JOIN dbo.property_val pv on p.prop_id = pv.prop_id 
		INNER JOIN dbo.prop_supp_assoc psa ON psa.owner_tax_yr = pv.prop_val_yr and psa.sup_num = pv.sup_num and psa.prop_id = pv.prop_id
		LEFT JOIN dbo.property_profile pp on pp.prop_id = p.prop_id and pp.prop_val_yr = pv.prop_val_yr and pp.sup_num = pv.sup_num
		-- for the P01 nbhd matrix, only affecting PUSE00100
		LEFT JOIN dbo.matrix_detail md1 on md1.matrix_yr = pv.prop_val_yr and md1.axis_2_value = pv.hood_cd and md1.matrix_id = 914
		-- for the P02 nbhd matrix, only affecting PUSE00200
		LEFT JOIN dbo.matrix_detail md2 on md2.matrix_yr = pv.prop_val_yr and md2.axis_2_value = pv.hood_cd and md2.matrix_id = 915
		-- for the P94 nbhd matrix, only affecting PUSE00600
		LEFT JOIN dbo.matrix_detail md3 on md3.matrix_yr = pv.prop_val_yr and md3.axis_2_value = pv.hood_cd and md3.matrix_id = 917
		-- Create field = number of improvement lines
		LEFT JOIN 
		(
			SELECT pv.prop_id, COUNT(i.imprv_id) [Improvement_Count]
			FROM dbo.property_val pv
			INNER JOIN dbo.prop_supp_assoc psa On psa.prop_id = pv.prop_id and psa.owner_tax_yr = pv.prop_val_yr and psa.sup_num = pv.sup_num
			LEFT JOIN dbo.imprv i on i.prop_id = pv.prop_id and i.prop_val_yr = pv.prop_val_yr and i.sup_num = pv.sup_num
			WHERE 
				i.imprv_desc NOT LIKE '%SOH%' and
				(i.sale_id = 0 or i.sale_id is null) and
				pv.prop_val_yr = @TAXYEAR and 
				pv.prop_inactive_dt is null 
				
			GROUP BY pv.prop_id
		) ic on ic.prop_id = p.prop_id
		-- Create field = number of land lines
		LEFT JOIN
		(
			SELECT pv.prop_id, COUNT(ld.land_seg_id) [Land_Line_Count]
			FROM dbo.property_val pv
			INNER JOIN dbo.prop_supp_assoc psa On psa.prop_id = pv.prop_id and psa.owner_tax_yr = pv.prop_val_yr and psa.sup_num = pv.sup_num
			LEFT JOIN dbo.land_detail ld on ld.prop_id = pv.prop_id and ld.prop_val_yr = pv.prop_val_yr and ld.sup_num = pv.sup_num 
			WHERE
				pv.prop_val_yr = @TAXYEAR and 
				pv.prop_inactive_dt is null and
				(ld.sale_id = 0 or ld.sale_id is null)
			GROUP BY pv.prop_id
		) lc on lc.prop_id = p.prop_id
		-- Create field = Flat value on imprv (not going to bother with detail lines, just main.. also, do flat details force flat dbo.imprv?)
		LEFT JOIN
		(
			SELECT pv.prop_id, 'YES' [Imprv_Flat_Value]
			FROM dbo.property_val pv
			INNER JOIN dbo.prop_supp_assoc psa On psa.prop_id = pv.prop_id and psa.owner_tax_yr = pv.prop_val_yr and psa.sup_num = pv.sup_num
			LEFT JOIN dbo.imprv i on i.prop_id = pv.prop_id and i.prop_val_yr = pv.prop_val_yr and i.sup_num = pv.sup_num
			WHERE 
				i.imprv_desc NOT LIKE '%SOH%' and
				i.imprv_val_source = 'F' and
				(i.sale_id = 0 or i.sale_id is null) and
				pv.prop_val_yr = @TAXYEAR and 
				pv.prop_inactive_dt is null 
			GROUP BY pv.prop_id
		) ifv on ifv.prop_id = p.prop_id
		-- Create field = Flat value on land detail
		LEFT JOIN 
		(
			SELECT pv.prop_id, 'YES' [Land_Flat_Value]
			FROM dbo.property_val pv
			INNER JOIN dbo.prop_supp_assoc psa On psa.prop_id = pv.prop_id and psa.owner_tax_yr = pv.prop_val_yr and psa.sup_num = pv.sup_num
			LEFT JOIN dbo.land_detail ld on ld.prop_id = pv.prop_id and ld.prop_val_yr = pv.prop_val_yr and ld.sup_num = pv.sup_num 
			WHERE
				ld.mkt_val_source = 'F' and
				pv.prop_val_yr = @TAXYEAR and 
				pv.prop_inactive_dt is null  and
				(ld.sale_id = 0 or ld.sale_id is null)
			GROUP BY pv.prop_id
		) lfv on lfv.prop_id = p.prop_id
		-- Create field = nonzero PEGS
		LEFT JOIN
		(
			SELECT pv.prop_id, 'YES' [Nonzero_PEGS]
			FROM dbo.property_val pv
			INNER JOIN dbo.prop_supp_assoc psa On psa.prop_id = pv.prop_id and psa.owner_tax_yr = pv.prop_val_yr and psa.sup_num = pv.sup_num
			LEFT JOIN dbo.imprv i on i.prop_id = pv.prop_id and i.prop_val_yr = pv.prop_val_yr and i.sup_num = pv.sup_num
			WHERE 
				i.imprv_desc NOT LIKE '%SOH%' and
				i.imprv_val_source = 'F' and
				(i.sale_id = 0 or i.sale_id is null) and
				pv.prop_val_yr = @TAXYEAR and 
				pv.prop_inactive_dt is null and
				i.economic_pct + i.functional_pct + i.physical_pct <> 0 
			GROUP BY pv.prop_id	
		) pegs on pegs.prop_id = p.prop_id
		-- Create field = Conditioned Land
		LEFT JOIN
		(
			SELECT pv.prop_id, 'YES' [Conditioned_Land]
			FROM dbo.property_val pv 
			INNER JOIN dbo.prop_supp_assoc psa On psa.prop_id = pv.prop_id and psa.owner_tax_yr = pv.prop_val_yr and psa.sup_num = pv.sup_num
			LEFT JOIN dbo.land_detail ld on ld.prop_id = pv.prop_id and ld.prop_val_yr = pv.prop_val_yr and ld.sup_num = pv.sup_num 
			WHERE
				ld.land_adj_factor <> '1' and
				pv.prop_val_yr = @TAXYEAR and 
				pv.prop_inactive_dt is null  and
				(ld.sale_id = 0 or ld.sale_id is null)
			GROUP BY pv.prop_id
		) cl on cl.prop_id = p.prop_id
		-- Creating not equal to 1 lot binary variable
		LEFT JOIN
		(
			SELECT pv.prop_id, 'YES' [Not_1_Lot]
			FROM dbo.property_val pv 
			INNER JOIN dbo.prop_supp_assoc psa On psa.prop_id = pv.prop_id and psa.owner_tax_yr = pv.prop_val_yr and psa.sup_num = pv.sup_num
			LEFT JOIN dbo.land_detail ld on ld.prop_id = pv.prop_id and ld.prop_val_yr = pv.prop_val_yr and ld.sup_num = pv.sup_num 
			WHERE
				ld.num_lots <> 1 and
				pv.prop_val_yr = @TAXYEAR and 
				pv.prop_inactive_dt is null  and
				(ld.sale_id = 0 or ld.sale_id is null)
			GROUP BY pv.prop_id
		) ll on ll.prop_id = pv.prop_id
		left join (
					SELECT DISTINCT 
					p.geo_id,
					p.prop_id,
					s.sl_price,
					s.sl_dt,
					s.sl_county_ratio_cd,
					grantor.file_as_name [Grantor],
					grantee.file_as_name [Grantee],
					copa.seq_num
			--INTO #sales
			FROM
					dbo.property p 
					LEFT JOIN dbo.property_val pv on p.prop_id = pv.prop_id 
					INNER JOIN dbo.prop_supp_assoc psa ON psa.owner_tax_yr = pv.prop_val_yr and psa.sup_num = pv.sup_num and psa.prop_id = pv.prop_id
					LEFT JOIN dbo.chg_of_owner_prop_assoc copa on p.prop_id = copa.prop_id
					LEFT JOIN dbo.sale s on copa.chg_of_owner_id = s.chg_of_owner_id 
					LEFT JOIN dbo.chg_of_owner co on copa.chg_of_owner_id = co.chg_of_owner_id 
					INNER JOIN (
					SELECT DISTINCT
						p.prop_id,
						MAX(s.sl_dt) [Recent_Sale_Date],
						MAX(s.sl_price) [Max_Sale_Price],
						MIN(copa.seq_num) [Min_Seq_Num]
					FROM
						dbo.property p
						INNER JOIN dbo.chg_of_owner_prop_assoc copa on p.prop_id = copa.prop_id
						INNER JOIN dbo.sale s on copa.chg_of_owner_id = s.chg_of_owner_id 
						INNER JOIN dbo.chg_of_owner co on copa.chg_of_owner_id = co.chg_of_owner_id 
					WHERE s.sl_county_ratio_cd IN ('01','02') and YEAR(s.sl_dt) = CAST(@TAXYEAR as INT) 
					GROUP BY p.prop_id
					--ORDER BY pv.prop_id
					) s2 on s2.Recent_Sale_Date = s.sl_dt and s2.prop_id = p.prop_id and s2.Max_Sale_Price = s.sl_price and s2.Min_Seq_Num = copa.seq_num
					LEFT JOIN 
					(
					select vw.chg_of_owner_id, vw.prop_id, a.file_as_name
					from dbo.chg_of_owner_first_seller_vw vw
					join dbo.owner o on o.owner_id = vw.seller_id
					join dbo.account a on a.acct_id = o.owner_id
					) grantor on grantor.chg_of_owner_id = s.chg_of_owner_id and grantor.prop_id = p.prop_id
					LEFT JOIN 
					(
					select vw.chg_of_owner_id, vw.prop_id, a.file_as_name
					from dbo.chg_of_owner_first_buyer_vw vw
					join dbo.owner o on o.owner_id = vw.buyer_id
					join dbo.account a on a.acct_id = o.owner_id 
					) grantee on grantee.chg_of_owner_id = s.chg_of_owner_id and grantee.prop_id = p.prop_id  
			WHERE
					pv.prop_inactive_dt is null and
					pv.prop_val_yr = @TAXYEAR  and
					s.sl_price > 100 and
					--s.sl_county_ratio_cd IN ('01','02') and
					YEAR(s.sl_dt) = CAST(@TAXYEAR as INT) - 1
		) sales on sales.prop_id = p.prop_id
WHERE
		pv.prop_inactive_dt is null and
		pv.prop_val_yr = @TAXYEAR and
		p.prop_id in @KEYFIELD_IDS
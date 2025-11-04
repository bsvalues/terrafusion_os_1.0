create view [dbo].[__aLand_Detailgis] as
SELECT TOP 0 [prop_id]
	, [prop_id] as ParcelID
      ,[prop_val_yr]
      ,[land_seg_id]
      ,[sup_num]
      ,[sale_id]
      ,[ls_mkt_id]
      ,[ls_ag_id]
      ,[land_type_cd]
      ,[land_seg_desc]
      ,[land_seg_sl_lock]
      ,[state_cd]
      ,[land_seg_homesite]
      ,[size_acres]
      ,[size_square_feet]
      ,[effective_front]
      ,[effective_depth]
      ,[mkt_unit_price]
      ,[land_seg_mkt_val]
      ,[mkt_calc_val]
      ,[mkt_adj_val]
      ,[mkt_flat_val]
      ,[ag_loss]
      ,[mkt_val_source]
      ,[ag_use_cd]
      ,[ag_unit_price]
      ,[ag_apply]
      ,[ag_val]
      ,[ag_calc_val]
      ,[ag_adj_val]
      ,[ag_flat_val]
      
      ,[ag_val_source]
 
      ,[ag_apply_yr]
      ,[land_seg_orig_val]

      
      ,[land_adj_amt]
      ,[land_adj_factor]
      ,[land_mass_adj_factor]
      
      ,[num_lots]
      ,[new_ag]
      ,[new_ag_prev_val]
      ,[new_ag_prev_val_override]
      ,[appraisal_cd]
      ,[arb_val]
      ,[land_class_code]
      ,[land_influence_code]
      ,[size_useable_acres]
      ,[size_useable_square_feet]
      ,[dist_val]
     
      ,[assessment_yr_qualified]
      ,[current_use_effective_acres]
      ,[primary_use_cd]

  FROM [pacs_oltp].[dbo].[land_detail]
  where prop_val_yr=2019
  and sale_id=0
  --and ag_use_cd is not null

GO


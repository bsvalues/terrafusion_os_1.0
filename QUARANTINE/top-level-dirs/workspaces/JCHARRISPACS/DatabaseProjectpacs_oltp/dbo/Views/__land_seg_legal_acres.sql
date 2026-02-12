
create view __land_seg_legal_acres as
  select ld.prop_id,SUM(size_acres)as sum_of_land_segs,  pv.legal_acreage as legal_acreage,SUM(land_seg_mkt_val) as sum_of_land_seg_mrkt_val,
   sum([ag_unit_price]) as  total_ag_unit_price
      ,[ag_apply]
      ,Sum([ag_val])as total_ag_val
      ,sum([ag_calc_val])as total_ag_calc_val
      ,sum([ag_adj_val])as total_ag_adj_val
      ,sum([ag_flat_val])as total_ag_flat_val
    FROM [pacs_oltp].[dbo].[land_detail] ld
	left join property_val pv ON ld.prop_id = pv.prop_id AND pv.prop_val_yr =(select appr_yr from pacs_oltp.dbo.pacs_system)

  where ld.prop_val_yr=(select appr_yr from pacs_oltp.dbo.pacs_system) --and ld.prop_id=10025
  group by ld.prop_id,[ag_apply], pv.legal_acreage

GO


CREATE VIEW [CO\ANTHONYV].BuildingPermitsOpen
AS
SELECT DISTINCT 
                         bp.bldg_permit_id, bp.bldg_permit_num, pba.prop_id, pp.property_use_cd, bp.bldg_permit_desc, bp.bldg_permit_county_percent_complete, bp.active_bit, pv.cycle, pv.hood_cd, CONVERT(char(20), pv.last_appraisal_dt, 101) 
                         AS last_appraisal_dt, CONVERT(char(20), bp.bldg_permit_issue_dt, 101) AS Issue_date, CONVERT(char(20), bp.bldg_permit_limit_dt, 101) AS permit_limit_date, CONVERT(char(20), bp.bldg_permit_dt_complete, 101) 
                         AS complete_date, CONVERT(char(20), bp.bldg_permit_dt_worked, 101) AS Worked_date, CONVERT(char(20), bp.bldg_permit_last_chg, 101) AS last_change, ap.appraiser_full_name, ap.appraiser_id, 
                         bp.bldg_permit_appraiser_id, bp.bldg_permit_status, bp.bldg_permit_cad_status, bp.bldg_permit_active, bp.bldg_permit_type_cd, bp.bldg_permit_issuer, dbo.fn_getexemptions(pv.prop_id, pv.prop_val_yr, pv.sup_num) 
                         AS exemptions, bp.bldg_permit_val, bp.bldg_permit_calc_value, bp.bldg_permit_area, bp.bldg_permit_dt_worked, bp.bldg_permit_pct_complete, bp.bldg_permit_builder, bp.bldg_permit_builder_phone, bp.bldg_permit_cmnt, 
                         bp.bldg_permit_issued_to, bp.bldg_permit_owner_phone, bp.bldg_permit_res_com, bp.bldg_permit_street_num, bp.bldg_permit_street_prefix, bp.bldg_permit_street_name, bp.bldg_permit_street_suffix, 
                         bp.bldg_permit_unit_type, bp.bldg_permit_unit_number, bp.bldg_permit_sub_division, bp.bldg_permit_plat, bp.bldg_permit_block, bp.bldg_permit_lot, bp.bldg_permit_city, bp.bldg_permit_source, bp.bldg_permit_land_use, 
                         bp.bldg_permit_pct_complete_override, bp.bldg_permit_bldg_number, XCoord, YCoord
FROM            building_permit bp LEFT OUTER JOIN
                         prop_building_permit_assoc pba ON bp.bldg_permit_id = pba.bldg_permit_id INNER JOIN
                             (SELECT        prop_id, abs_subdv, neighborhood, subset, map_id, region, state_cd, property_use_cd
                               FROM            pacs_oltp.dbo.property_profile p
                               WHERE        (prop_val_yr IN
                                                             (SELECT        appr_yr
                                                               FROM            pacs_oltp.dbo.pacs_system))) AS pp ON pba.prop_id = pp.prop_id INNER JOIN
                             (SELECT        *
                               FROM            property_val
                               WHERE        prop_inactive_dt IS NULL AND (prop_val_yr IN
                                                             (SELECT        appr_yr
                                                               FROM            pacs_oltp.dbo.pacs_system))) AS pv ON pba.prop_id = pv.prop_id LEFT JOIN
                         appraiser ap ON pv.last_appraiser_id = ap.appraiser_id INNER JOIN
                             (SELECT        [Parcel_ID], ROW_NUMBER() OVER (partition BY prop_id
                               ORDER BY [OBJECTID] DESC) AS order_id, [Prop_ID], [Shape].STCentroid().STX AS XCoord, [Shape].STCentroid().STY AS YCoord
/* ,[CENTROID_Y] as YCoord*/ FROM [Benton_spatial_data].[dbo].[parcel]) AS coords ON pv.prop_id = coords.Prop_ID AND coords.order_id = 1
WHERE        /*bldg_permit_status='open'*/ bldg_permit_cad_status = 'open' /*and bldg_permit_res_com='c'*/ AND bldg_permit_dt_complete IS NULL

GO

EXECUTE sp_addextendedproperty @name = N'MS_DiagramPane1', @value = N'[0E232FF0-B466-11cf-A24F-00AA00A3EFFF, 1.00]
Begin DesignProperties = 
   Begin PaneConfigurations = 
      Begin PaneConfiguration = 0
         NumPanes = 4
         Configuration = "(H (1[40] 4[20] 2[20] 3) )"
      End
      Begin PaneConfiguration = 1
         NumPanes = 3
         Configuration = "(H (1 [50] 4 [25] 3))"
      End
      Begin PaneConfiguration = 2
         NumPanes = 3
         Configuration = "(H (1 [50] 2 [25] 3))"
      End
      Begin PaneConfiguration = 3
         NumPanes = 3
         Configuration = "(H (4 [30] 2 [40] 3))"
      End
      Begin PaneConfiguration = 4
         NumPanes = 2
         Configuration = "(H (1 [56] 3))"
      End
      Begin PaneConfiguration = 5
         NumPanes = 2
         Configuration = "(H (2 [66] 3))"
      End
      Begin PaneConfiguration = 6
         NumPanes = 2
         Configuration = "(H (4 [50] 3))"
      End
      Begin PaneConfiguration = 7
         NumPanes = 1
         Configuration = "(V (3))"
      End
      Begin PaneConfiguration = 8
         NumPanes = 3
         Configuration = "(H (1[56] 4[18] 2) )"
      End
      Begin PaneConfiguration = 9
         NumPanes = 2
         Configuration = "(H (1 [75] 4))"
      End
      Begin PaneConfiguration = 10
         NumPanes = 2
         Configuration = "(H (1[66] 2) )"
      End
      Begin PaneConfiguration = 11
         NumPanes = 2
         Configuration = "(H (4 [60] 2))"
      End
      Begin PaneConfiguration = 12
         NumPanes = 1
         Configuration = "(H (1) )"
      End
      Begin PaneConfiguration = 13
         NumPanes = 1
         Configuration = "(V (4))"
      End
      Begin PaneConfiguration = 14
         NumPanes = 1
         Configuration = "(V (2))"
      End
      ActivePaneConfig = 0
   End
   Begin DiagramPane = 
      Begin Origin = 
         Top = 0
         Left = 0
      End
      Begin Tables = 
      End
   End
   Begin SQLPane = 
   End
   Begin DataPane = 
      Begin ParameterDefaults = ""
      End
      Begin ColumnWidths = 9
         Width = 284
         Width = 1500
         Width = 1500
         Width = 1500
         Width = 1500
         Width = 1500
         Width = 1500
         Width = 1500
         Width = 1500
      End
   End
   Begin CriteriaPane = 
      Begin ColumnWidths = 11
         Column = 1440
         Alias = 900
         Table = 1170
         Output = 720
         Append = 1400
         NewValue = 1170
         SortType = 1350
         SortOrder = 1410
         GroupBy = 1350
         Filter = 1350
         Or = 1350
         Or = 1350
         Or = 1350
      End
   End
End
', @level0type = N'SCHEMA', @level0name = N'CO\ANTHONYV', @level1type = N'VIEW', @level1name = N'BuildingPermitsOpen';


GO

EXECUTE sp_addextendedproperty @name = N'MS_DiagramPaneCount', @value = 1, @level0type = N'SCHEMA', @level0name = N'CO\ANTHONYV', @level1type = N'VIEW', @level1name = N'BuildingPermitsOpen';


GO


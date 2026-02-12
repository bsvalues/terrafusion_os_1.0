CREATE VIEW dbo.Parcel_Assess09112023
AS
SELECT DISTINCT 
                         a.file_as_name AS owner_name, pv.prop_id, p.geo_id, pv.legal_desc, RTRIM(LTRIM(ad.addr_line1)) + RTRIM(LTRIM(ad.addr_line2)) + RTRIM(LTRIM(ad.addr_line3)) + RTRIM(LTRIM(ad.addr_city)) + RTRIM(LTRIM(ad.addr_state)) 
                         + RTRIM(LTRIM(ad.addr_zip)) AS owner_address, s.situs_display AS situs_address, ta.tax_area_number AS tax_code_area, pv.imprv_hstd_val + pv.imprv_non_hstd_val AS ImpVal, CASE WHEN pv.land_hstd_val IS NULL OR
                         pv.land_hstd_val = 0 THEN pv.land_non_hstd_val ELSE CASE WHEN pv.land_non_hstd_val IS NULL OR
                         pv.land_non_hstd_val = 0 THEN pv.land_hstd_val ELSE pv.land_hstd_val + pv.land_non_hstd_val END END AS LandVal, pv.market AS MarketValue, pv.appraised_val, pv.ag_use_val, hood.hood_name AS neighborhood_name, 
                         pv.hood_cd AS neighborhood_code, pv.legal_acreage AS legal_acres, pp.land_sqft, pp.yr_blt AS year_blt, pp.property_use_cd AS primary_use, pv.cycle
FROM            dbo.property_val AS pv INNER JOIN
                         dbo.owner AS o WITH (nolock) ON pv.prop_id = o.prop_id AND pv.prop_val_yr = o.owner_tax_yr AND pv.sup_num = o.sup_num INNER JOIN
                         dbo.property AS p WITH (nolock) ON pv.prop_id = p.prop_id AND p.prop_type_cd = 'r' INNER JOIN
                         dbo.property_tax_area AS pta WITH (nolock) ON pv.prop_id = pta.prop_id AND pv.sup_num = pta.sup_num AND pv.prop_val_yr = pta.year INNER JOIN
                         dbo.account AS a WITH (nolock) ON o.owner_id = a.acct_id INNER JOIN
                         dbo.property_profile AS pp WITH (nolock) ON pv.prop_id = pp.prop_id AND pv.prop_val_yr = pp.prop_val_yr LEFT OUTER JOIN
                         dbo.address AS ad WITH (nolock) ON o.owner_id = ad.acct_id AND ad.primary_addr = 'y' LEFT OUTER JOIN
                         dbo.situs AS s WITH (nolock) ON pv.prop_id = s.prop_id AND s.primary_situs = 'y' LEFT OUTER JOIN
                         dbo.neighborhood AS hood WITH (nolock) ON pv.hood_cd = hood.hood_cd AND pv.prop_val_yr = hood.hood_yr LEFT OUTER JOIN
                         dbo.tax_area AS ta WITH (nolock) ON pta.tax_area_id = ta.tax_area_id LEFT OUTER JOIN
                         dbo.situs ON pv.prop_id = dbo.situs.prop_id
WHERE        (pv.prop_val_yr =
                             (SELECT        appr_yr
                               FROM            dbo.pacs_system)) AND (pv.prop_inactive_dt IS NULL) AND (pv.sup_num = 0)

GO

EXECUTE sp_addextendedproperty @name = N'MS_DiagramPaneCount', @value = 2, @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'VIEW', @level1name = N'Parcel_Assess09112023';


GO

EXECUTE sp_addextendedproperty @name = N'MS_DiagramPane2', @value = N'End
         Begin Table = "s"
            Begin Extent = 
               Top = 138
               Left = 385
               Bottom = 268
               Right = 564
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "hood"
            Begin Extent = 
               Top = 138
               Left = 602
               Bottom = 268
               Right = 784
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "ta"
            Begin Extent = 
               Top = 138
               Left = 822
               Bottom = 268
               Right = 1021
            End
            DisplayFlags = 280
            TopColumn = 2
         End
         Begin Table = "situs"
            Begin Extent = 
               Top = 138
               Left = 1059
               Bottom = 268
               Right = 1238
            End
            DisplayFlags = 280
            TopColumn = 0
         End
      End
   End
   Begin SQLPane = 
   End
   Begin DataPane = 
      Begin ParameterDefaults = ""
      End
   End
   Begin CriteriaPane = 
      Begin ColumnWidths = 11
         Column = 3120
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
', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'VIEW', @level1name = N'Parcel_Assess09112023';


GO

EXECUTE sp_addextendedproperty @name = N'MS_DiagramPane1', @value = N'[0E232FF0-B466-11cf-A24F-00AA00A3EFFF, 1.00]
Begin DesignProperties = 
   Begin PaneConfigurations = 
      Begin PaneConfiguration = 0
         NumPanes = 4
         Configuration = "(H (1[40] 4[20] 2[35] 3) )"
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
         Begin Table = "pv"
            Begin Extent = 
               Top = 6
               Left = 38
               Bottom = 136
               Right = 326
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "o"
            Begin Extent = 
               Top = 6
               Left = 364
               Bottom = 136
               Right = 571
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "p"
            Begin Extent = 
               Top = 6
               Left = 609
               Bottom = 136
               Right = 810
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "pta"
            Begin Extent = 
               Top = 6
               Left = 848
               Bottom = 136
               Right = 1044
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "a"
            Begin Extent = 
               Top = 6
               Left = 1082
               Bottom = 136
               Right = 1306
            End
            DisplayFlags = 280
            TopColumn = 25
         End
         Begin Table = "pp"
            Begin Extent = 
               Top = 138
               Left = 38
               Bottom = 268
               Right = 347
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "ad"
            Begin Extent = 
               Top = 6
               Left = 1344
               Bottom = 136
               Right = 1537
            End
            DisplayFlags = 280
            TopColumn = 22
         ', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'VIEW', @level1name = N'Parcel_Assess09112023';


GO


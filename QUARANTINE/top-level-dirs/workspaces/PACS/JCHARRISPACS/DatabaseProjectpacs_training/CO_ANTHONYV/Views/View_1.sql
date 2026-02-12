CREATE VIEW [CO\ANTHONYV].View_1
AS
SELECT DISTINCT a.file_as_name AS owner_name, pv.prop_id, p.geo_id, dbo.property_legal_description.metes_and_bounds
FROM            dbo.property_val AS pv INNER JOIN
                         dbo.owner AS o WITH (nolock) ON pv.prop_id = o.prop_id AND pv.prop_val_yr = o.owner_tax_yr AND pv.sup_num = o.sup_num INNER JOIN
                         dbo.property AS p WITH (nolock) ON pv.prop_id = p.prop_id AND p.prop_type_cd = 'r' INNER JOIN
                         dbo.property_tax_area AS pta WITH (nolock) ON pv.prop_id = pta.prop_id AND pv.sup_num = pta.sup_num AND pv.prop_val_yr = pta.year INNER JOIN
                         dbo.account AS a WITH (nolock) ON o.owner_id = a.acct_id INNER JOIN
                         dbo.property_profile AS pp WITH (nolock) ON pv.prop_id = pp.prop_id AND pv.prop_val_yr = pp.prop_val_yr INNER JOIN
                         dbo.property_legal_description ON pv.prop_val_yr = dbo.property_legal_description.prop_val_yr AND pv.sup_num = dbo.property_legal_description.sup_num AND 
                         pv.prop_id = dbo.property_legal_description.prop_id LEFT OUTER JOIN
                         dbo.address AS ad WITH (nolock) ON o.owner_id = ad.acct_id AND ad.primary_addr = 'y' LEFT OUTER JOIN
                         dbo.situs AS s WITH (nolock) ON pv.prop_id = s.prop_id AND s.primary_situs = 'y' LEFT OUTER JOIN
                         dbo.neighborhood AS hood WITH (nolock) ON pv.hood_cd = hood.hood_cd AND pv.prop_val_yr = hood.hood_yr LEFT OUTER JOIN
                         dbo.tax_area AS ta WITH (nolock) ON pta.tax_area_id = ta.tax_area_id LEFT OUTER JOIN
                         dbo.situs ON pv.prop_id = dbo.situs.prop_id
WHERE        (pv.prop_val_yr =
                             (SELECT        appr_yr
                               FROM            dbo.pacs_system)) AND (pv.prop_inactive_dt IS NULL) AND (pv.sup_num = 0)

GO

EXECUTE sp_addextendedproperty @name = N'MS_DiagramPaneCount', @value = 2, @level0type = N'SCHEMA', @level0name = N'CO\ANTHONYV', @level1type = N'VIEW', @level1name = N'View_1';


GO

EXECUTE sp_addextendedproperty @name = N'MS_DiagramPane1', @value = N'[0E232FF0-B466-11cf-A24F-00AA00A3EFFF, 1.00]
Begin DesignProperties = 
   Begin PaneConfigurations = 
      Begin PaneConfiguration = 0
         NumPanes = 4
         Configuration = "(H (1[40] 4[22] 2[18] 3) )"
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
         Begin Table = "p"
            Begin Extent = 
               Top = 6
               Left = 246
               Bottom = 136
               Right = 447
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "pv"
            Begin Extent = 
               Top = 6
               Left = 485
               Bottom = 136
               Right = 773
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "property_legal_description (dbo)"
            Begin Extent = 
               Top = 216
               Left = 412
               Bottom = 346
               Right = 603
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "o"
            Begin Extent = 
               Top = 6
               Left = 38
               Bottom = 136
               Right = 245
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "pta"
            Begin Extent = 
               Top = 6
               Left = 811
               Bottom = 136
               Right = 1007
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "a"
            Begin Extent = 
               Top = 6
               Left = 1045
               Bottom = 136
               Right = 1269
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "pp"
            Begin Extent = 
               Top = 6
               Left = 1307
               Bottom = 136
               Right = 1616
            End
            DisplayFlags = 280
       ', @level0type = N'SCHEMA', @level0name = N'CO\ANTHONYV', @level1type = N'VIEW', @level1name = N'View_1';


GO

EXECUTE sp_addextendedproperty @name = N'MS_DiagramPane2', @value = N'     TopColumn = 0
         End
         Begin Table = "ad"
            Begin Extent = 
               Top = 6
               Left = 1654
               Bottom = 136
               Right = 1847
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "s"
            Begin Extent = 
               Top = 138
               Left = 38
               Bottom = 268
               Right = 217
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "hood"
            Begin Extent = 
               Top = 138
               Left = 641
               Bottom = 268
               Right = 823
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "ta"
            Begin Extent = 
               Top = 138
               Left = 861
               Bottom = 268
               Right = 1060
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "situs (dbo)"
            Begin Extent = 
               Top = 138
               Left = 1098
               Bottom = 268
               Right = 1277
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
      Begin ColumnWidths = 9
         Width = 284
         Width = 9360
         Width = 1500
         Width = 1500
         Width = 5805
         Width = 1500
         Width = 1500
         Width = 1500
         Width = 1500
      End
   End
   Begin CriteriaPane = 
      Begin ColumnWidths = 11
         Column = 5895
         Alias = 2445
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
', @level0type = N'SCHEMA', @level0name = N'CO\ANTHONYV', @level1type = N'VIEW', @level1name = N'View_1';


GO


CREATE VIEW [CO\ANTHONYV].ImprvTypeCd_MHome
AS
SELECT        i1.imprv_type_cd, p1.geo_id
FROM            dbo.imprv AS i1 WITH (nolock) INNER JOIN
                         dbo.prop_supp_assoc AS psa1 WITH (nolock) ON psa1.prop_id = i1.prop_id AND psa1.owner_tax_yr = i1.prop_val_yr AND psa1.sup_num = i1.sup_num INNER JOIN
                         dbo.property AS p1 WITH (nolock) ON p1.prop_id = psa1.prop_id INNER JOIN
                         dbo.property_val AS pv1 WITH (nolock) ON pv1.prop_id = i1.prop_id AND pv1.prop_val_yr = i1.prop_val_yr AND pv1.sup_num = i1.sup_num
WHERE        (i1.imprv_type_cd IN ('MHOME')) AND (i1.prop_val_yr = 2021) AND (pv1.prop_inactive_dt IS NULL)

GO

EXECUTE sp_addextendedproperty @name = N'MS_DiagramPaneCount', @value = 2, @level0type = N'SCHEMA', @level0name = N'CO\ANTHONYV', @level1type = N'VIEW', @level1name = N'ImprvTypeCd_MHome';


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
         Begin Table = "i1"
            Begin Extent = 
               Top = 345
               Left = 54
               Bottom = 475
               Right = 355
            End
            DisplayFlags = 280
            TopColumn = 79
         End
         Begin Table = "psa1"
            Begin Extent = 
               Top = 6
               Left = 377
               Bottom = 119
               Right = 547
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "p1"
            Begin Extent = 
               Top = 7
               Left = 865
               Bottom = 137
               Right = 1066
            End
            DisplayFlags = 280
            TopColumn = 2
         End
         Begin Table = "pv1"
            Begin Extent = 
               Top = 297
               Left = 1012
               Bottom = 427
               Right = 1300
            End
            DisplayFlags = 280
            TopColumn = 101
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
         Width = 1500
         Width = 6525
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
End', @level0type = N'SCHEMA', @level0name = N'CO\ANTHONYV', @level1type = N'VIEW', @level1name = N'ImprvTypeCd_MHome';


GO

EXECUTE sp_addextendedproperty @name = N'MS_DiagramPane2', @value = N'
', @level0type = N'SCHEMA', @level0name = N'CO\ANTHONYV', @level1type = N'VIEW', @level1name = N'ImprvTypeCd_MHome';


GO


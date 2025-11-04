CREATE VIEW [CO\ANTHONYV].Lease
AS
SELECT DISTINCT pv.prop_id AS Lease_Hold_Prop_ID, p.geo_id AS Lease_Hold_Geo_ID, p.prop_type_cd, pa.child_prop_id AS Linked_Real_Prop_ID, pa1.geo_id AS Linked_Real_Geo_ID, ac.file_as_name
FROM            dbo.property_val AS pv WITH (nolock) INNER JOIN
                         dbo.prop_supp_assoc AS psa WITH (nolock) ON pv.prop_id = psa.prop_id AND pv.prop_val_yr = psa.owner_tax_yr AND pv.sup_num = psa.sup_num INNER JOIN
                         dbo.property AS p WITH (nolock) ON pv.prop_id = p.prop_id INNER JOIN
                         dbo.owner AS o WITH (nolock) ON pv.prop_id = o.prop_id AND pv.prop_val_yr = o.owner_tax_yr AND pv.sup_num = o.sup_num INNER JOIN
                         dbo.account AS ac WITH (nolock) ON o.owner_id = ac.acct_id INNER JOIN
                         dbo.property_assoc AS pa WITH (nolock) ON pv.prop_id = pa.parent_prop_id AND pv.prop_val_yr = pa.prop_val_yr INNER JOIN
                         dbo.property AS pa1 WITH (nolock) ON pa1.prop_id = pa.child_prop_id
WHERE        (pv.prop_val_yr = 2021) AND (pv.prop_inactive_dt IS NULL) AND (p.geo_id LIKE '7%' OR
                         p.geo_id LIKE '8%') AND (pa.child_prop_id IN
                             (SELECT        prop_id
                               FROM            dbo.property
                               WHERE        (prop_type_cd = 'R')))

GO

EXECUTE sp_addextendedproperty @name = N'MS_DiagramPane1', @value = N'[0E232FF0-B466-11cf-A24F-00AA00A3EFFF, 1.00]
Begin DesignProperties = 
   Begin PaneConfigurations = 
      Begin PaneConfiguration = 0
         NumPanes = 4
         Configuration = "(H (1[40] 4[3] 2[37] 3) )"
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
         Begin Table = "psa"
            Begin Extent = 
               Top = 6
               Left = 364
               Bottom = 119
               Right = 534
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "p"
            Begin Extent = 
               Top = 6
               Left = 572
               Bottom = 136
               Right = 773
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "o"
            Begin Extent = 
               Top = 6
               Left = 811
               Bottom = 136
               Right = 1017
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "ac"
            Begin Extent = 
               Top = 6
               Left = 1055
               Bottom = 136
               Right = 1279
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "pa"
            Begin Extent = 
               Top = 6
               Left = 1317
               Bottom = 136
               Right = 1495
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "pa1"
            Begin Extent = 
               Top = 120
               Left = 364
               Bottom = 250
               Right = 565
            End
            DisplayFlags = 280
            TopColumn = 0
         ', @level0type = N'SCHEMA', @level0name = N'CO\ANTHONYV', @level1type = N'VIEW', @level1name = N'Lease';


GO

EXECUTE sp_addextendedproperty @name = N'MS_DiagramPane2', @value = N'End
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
', @level0type = N'SCHEMA', @level0name = N'CO\ANTHONYV', @level1type = N'VIEW', @level1name = N'Lease';


GO

EXECUTE sp_addextendedproperty @name = N'MS_DiagramPaneCount', @value = 2, @level0type = N'SCHEMA', @level0name = N'CO\ANTHONYV', @level1type = N'VIEW', @level1name = N'Lease';


GO


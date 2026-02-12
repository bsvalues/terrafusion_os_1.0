CREATE VIEW dbo.COR_Dan_DT_Project
AS
SELECT DISTINCT 
                         TOP (100) PERCENT p.geo_id, REPLACE(ac.file_as_name, ',', '') AS owner, a.addr_line1, a.addr_line2, a.addr_line3, a.addr_city, a.addr_state, a.addr_zip, s.situs_num, s.situs_street_prefx, s.situs_street, s.situs_street_sufix, 
                         s.situs_city, s.situs_state, pp.yr_blt AS [Year Built]
FROM            dbo.property_val AS pv WITH (nolock) INNER JOIN
                         dbo.prop_supp_assoc AS psa WITH (nolock) ON pv.prop_id = psa.prop_id AND pv.prop_val_yr = psa.owner_tax_yr AND pv.sup_num = psa.sup_num INNER JOIN
                         dbo.property AS p WITH (nolock) ON pv.prop_id = p.prop_id INNER JOIN
                         dbo.owner AS o WITH (nolock) ON pv.prop_id = o.prop_id AND pv.prop_val_yr = o.owner_tax_yr AND pv.sup_num = o.sup_num INNER JOIN
                         dbo.account AS ac WITH (nolock) ON o.owner_id = ac.acct_id INNER JOIN
                         dbo.address AS a WITH (nolock) ON ac.acct_id = a.acct_id AND ISNULL(a.primary_addr, 0) = 'y' INNER JOIN
                         dbo.property_tax_area AS pta WITH (nolock) ON pv.prop_id = pta.prop_id AND pv.prop_val_yr = pta.year AND pv.sup_num = pta.sup_num INNER JOIN
                         dbo.tax_area AS ta WITH (nolock) ON pta.tax_area_id = ta.tax_area_id INNER JOIN
                         dbo.property_profile AS pp WITH (nolock) ON pv.prop_id = pp.prop_id AND pv.prop_val_yr = pp.prop_val_yr INNER JOIN
                         dbo.property_use AS pu WITH (nolock) ON pv.property_use_cd = pu.property_use_cd INNER JOIN
                         dbo.situs AS s WITH (nolock) ON pv.prop_id = s.prop_id AND ISNULL(s.primary_situs, 'n') = 'y'
WHERE        (pv.prop_val_yr = YEAR(GETDATE())) AND (pv.prop_inactive_dt IS NULL) AND (pv.township_code = '10') AND (pv.range_code = '28') AND (pv.township_section <> '31') OR
                         (pv.prop_val_yr = YEAR(GETDATE())) AND (pv.prop_inactive_dt IS NULL) AND (pv.township_code = '09') AND (pv.range_code = '28') AND (pv.township_section NOT IN ('6', '7', '18')) OR
                         (pv.prop_val_yr = YEAR(GETDATE())) AND (pv.prop_inactive_dt IS NULL) AND (pv.township_code = '08') AND (pv.range_code = '28') AND (pv.township_section BETWEEN '01' AND '12') OR
                         (pv.prop_val_yr = YEAR(GETDATE())) AND (pv.prop_inactive_dt IS NULL) AND (pv.township_code = '09') AND (pv.range_code = '29') AND (pv.township_section IN ('18', '19', '20', '29', '30')) OR
                         (pv.prop_val_yr = YEAR(GETDATE())) AND (pv.prop_inactive_dt IS NULL) AND (pv.township_code = '10') AND (pv.range_code = '27') AND (pv.township_section IN ('01', '02', '11', '12', '13', '14', '24', '25')) OR
                         (pv.prop_val_yr = YEAR(GETDATE())) AND (pv.prop_inactive_dt IS NULL) AND (pv.township_code = '11') AND (pv.range_code = '28') AND (pv.township_section IN ('33', '34', '35'))

GO

EXECUTE sp_addextendedproperty @name = N'MS_DiagramPane2', @value = N'  End
         Begin Table = "ta"
            Begin Extent = 
               Top = 138
               Left = 38
               Bottom = 268
               Right = 237
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "pp"
            Begin Extent = 
               Top = 216
               Left = 550
               Bottom = 346
               Right = 859
            End
            DisplayFlags = 280
            TopColumn = 8
         End
         Begin Table = "pu"
            Begin Extent = 
               Top = 202
               Left = 919
               Bottom = 315
               Right = 1105
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "s"
            Begin Extent = 
               Top = 138
               Left = 1169
               Bottom = 268
               Right = 1348
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
      Begin ColumnWidths = 14
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
         Or = 1980
         Or = 1350
         Or = 1350
         Or = 1350
         Or = 1350
         Or = 1350
      End
   End
End
', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'VIEW', @level1name = N'COR_Dan_DT_Project';


GO

EXECUTE sp_addextendedproperty @name = N'MS_DiagramPaneCount', @value = 2, @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'VIEW', @level1name = N'COR_Dan_DT_Project';


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
         Begin Table = "pv"
            Begin Extent = 
               Top = 6
               Left = 38
               Bottom = 136
               Right = 326
            End
            DisplayFlags = 280
            TopColumn = 218
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
               Right = 1018
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "ac"
            Begin Extent = 
               Top = 6
               Left = 1056
               Bottom = 136
               Right = 1280
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "a"
            Begin Extent = 
               Top = 6
               Left = 1318
               Bottom = 136
               Right = 1511
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "pta"
            Begin Extent = 
               Top = 178
               Left = 300
               Bottom = 308
               Right = 496
            End
            DisplayFlags = 280
            TopColumn = 0
       ', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'VIEW', @level1name = N'COR_Dan_DT_Project';


GO


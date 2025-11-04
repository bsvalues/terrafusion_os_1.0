CREATE VIEW [CO\ANTHONYV].[Sales]
AS
SELECT        coopa.prop_id, coopa.chg_of_owner_id, CASE ISNULL(s.sl_dt, '') WHEN '' THEN '' ELSE CONVERT(varchar(10), s.sl_dt, 101) END AS sale_dt, ISNULL(s.sl_price, - 1) AS sale_price, ISNULL(s.sl_type_cd, '') AS type, 
                         ISNULL(s.sl_ratio_type_cd, '') AS ratio_cd, ISNULL(s.sl_financing_cd, '') AS fin_cd, ISNULL(s.finance_yrs, - 1) AS fin_term, ISNULL(s.sl_living_area, - 1) AS la_sqft, ISNULL(a.file_as_name, '') AS grantor, 
                         ISNULL(a.confidential_file_as_name, '') AS C_Name, ISNULL(coo.consideration, '') AS consid, ISNULL(coo.deed_type_cd, '') AS deed, ISNULL(coo.deed_book_id, '') AS book_id, ISNULL(coo.deed_book_page, '') AS deed_page, 
                         ISNULL(a.first_name, '') AS Fname, ISNULL(a.last_name, '') AS Lname, s.sl_type_cd, s.sl_dt, s.sl_yr_blt, s.sl_living_area, s.sl_imprv_unit_price
FROM            dbo.chg_of_owner_prop_assoc AS coopa WITH (NOLOCK) INNER JOIN
                         dbo.chg_of_owner AS coo WITH (NOLOCK) ON coopa.chg_of_owner_id = coo.chg_of_owner_id LEFT OUTER JOIN
                         dbo.seller_assoc AS sa WITH (NOLOCK) ON coopa.chg_of_owner_id = sa.chg_of_owner_id AND coopa.prop_id = sa.prop_id LEFT OUTER JOIN
                         dbo.account AS a WITH (NOLOCK) ON sa.seller_id = a.acct_id LEFT OUTER JOIN
                         dbo.sale AS s WITH (NOLOCK) ON coopa.chg_of_owner_id = s.chg_of_owner_id

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
         Begin Table = "coopa"
            Begin Extent = 
               Top = 6
               Left = 38
               Bottom = 136
               Right = 240
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "coo"
            Begin Extent = 
               Top = 6
               Left = 278
               Bottom = 136
               Right = 463
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "sa"
            Begin Extent = 
               Top = 6
               Left = 501
               Bottom = 119
               Right = 679
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "a"
            Begin Extent = 
               Top = 6
               Left = 717
               Bottom = 136
               Right = 941
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "s"
            Begin Extent = 
               Top = 6
               Left = 979
               Bottom = 136
               Right = 1200
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
', @level0type = N'SCHEMA', @level0name = N'CO\ANTHONYV', @level1type = N'VIEW', @level1name = N'Sales';


GO

EXECUTE sp_addextendedproperty @name = N'MS_DiagramPane2', @value = N'', @level0type = N'SCHEMA', @level0name = N'CO\ANTHONYV', @level1type = N'VIEW', @level1name = N'Sales';


GO

EXECUTE sp_addextendedproperty @name = N'MS_DiagramPaneCount', @value = 2, @level0type = N'SCHEMA', @level0name = N'CO\ANTHONYV', @level1type = N'VIEW', @level1name = N'Sales';


GO


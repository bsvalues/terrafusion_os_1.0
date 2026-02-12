CREATE VIEW dbo.sales_GIS
AS
SELECT        chg_of_owner_prop_assoc.prop_id, sale.sl_ratio, sale.sl_financing_cd, sale.sl_ratio_type_cd, sale.sl_adj_cd, sale.sl_type_cd, sale.sl_state_cd, sale.sl_class_cd, sale.sl_price, CASE WHEN (CONVERT(date, sale.sl_dt, 101)) 
                         IS NULL THEN '' ELSE (CONVERT(date, sale.sl_dt, 101)) END AS sl_dt, CASE WHEN (CONVERT(date, chg_of_owner.deed_dt, 101)) IS NULL THEN '' ELSE (CONVERT(date, chg_of_owner.deed_dt, 101)) END AS deed_dt, 
                         sale.adjusted_sl_price AS adjusted_sale_price, sale.suppress_on_ratio_rpt_cd AS ratio_code, sale.suppress_on_ratio_rsn, sale.sl_adj_sl_pct, sale.sl_adj_sl_amt, sale.sl_adj_rsn, sale.sl_comment, 
                         chg_of_owner.chg_of_owner_id, chg_of_owner.deed_type_cd, chg_of_owner.deed_num, chg_of_owner.deed_book_id AS book_id, chg_of_owner.deed_book_page AS book_page, chg_of_owner.consideration, 
                         chg_of_owner.comment, sales_mult_prop_val_vw.prop_count AS multi_prop_count, sales_mult_prop_val_vw.total_land_market AS mp_totalLandMarket, sales_mult_prop_val_vw.total_imp_market AS mp_totalImpMarket, 
                         sales_mult_prop_val_vw.total_market AS mp_totalMarket, sales_mult_prop_val_vw.sup_tax_yr AS mp_sup_tax_year, sales_mult_prop_val_vw.total_acres AS mp_total_aces, XCoord, YCoord
FROM            chg_of_owner INNER JOIN
                         sale ON chg_of_owner.chg_of_owner_id = sale.chg_of_owner_id INNER JOIN
                         chg_of_owner_prop_assoc ON chg_of_owner.chg_of_owner_id = chg_of_owner_prop_assoc.chg_of_owner_id LEFT OUTER JOIN
                         sales_mult_prop_val_vw ON chg_of_owner.chg_of_owner_id = sales_mult_prop_val_vw.chg_of_owner_id LEFT OUTER JOIN
                         sale_conf ON sale.chg_of_owner_id = sale_conf.chg_of_owner_id INNER JOIN
                             (SELECT        [Parcel_ID], ROW_NUMBER() OVER (partition BY prop_id
                               ORDER BY [OBJECTID] DESC) AS order_id, [Prop_ID], shape, [Shape].STCentroid().STX AS XCoord, [Shape].STCentroid().STY AS YCoord
FROM            [Benton_spatial_data].[dbo].[parcel]) AS coords ON chg_of_owner_prop_assoc.prop_id = coords.Prop_ID AND coords.order_id = 1

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
         Begin Table = "chg_of_owner"
            Begin Extent = 
               Top = 6
               Left = 38
               Bottom = 136
               Right = 224
            End
            DisplayFlags = 280
            TopColumn = 14
         End
         Begin Table = "sale"
            Begin Extent = 
               Top = 6
               Left = 262
               Bottom = 136
               Right = 483
            End
            DisplayFlags = 280
            TopColumn = 11
         End
         Begin Table = "chg_of_owner_prop_assoc"
            Begin Extent = 
               Top = 6
               Left = 521
               Bottom = 136
               Right = 723
            End
            DisplayFlags = 280
            TopColumn = 6
         End
         Begin Table = "sales_mult_prop_val_vw"
            Begin Extent = 
               Top = 6
               Left = 761
               Bottom = 136
               Right = 956
            End
            DisplayFlags = 280
            TopColumn = 7
         End
         Begin Table = "sale_conf"
            Begin Extent = 
               Top = 6
               Left = 994
               Bottom = 136
               Right = 1195
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
    ', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'VIEW', @level1name = N'sales_GIS';


GO

EXECUTE sp_addextendedproperty @name = N'MS_DiagramPane2', @value = N'     Or = 1350
         Or = 1350
      End
   End
End
', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'VIEW', @level1name = N'sales_GIS';


GO

EXECUTE sp_addextendedproperty @name = N'MS_DiagramPaneCount', @value = 2, @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'VIEW', @level1name = N'sales_GIS';


GO


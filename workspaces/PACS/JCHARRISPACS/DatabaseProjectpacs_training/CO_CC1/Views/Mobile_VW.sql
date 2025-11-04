CREATE VIEW [CO\CC1].Mobile_VW
AS
SELECT        dbo.property_val.prop_id, dbo.property_val.prop_val_yr, dbo.imprv_detail.imprv_det_type_cd, dbo.imprv_detail.imprv_det_class_cd, dbo.imprv_detail.imprv_det_meth_cd, dbo.imprv_detail.permanent_crop_acres, 
                         dbo.imprv_detail.permanent_crop_irrigation_acres, dbo.imprv_detail.permanent_crop_age_group, dbo.imprv_detail.permanent_crop_trellis, dbo.imprv_detail.permanent_crop_irrigation_system_type AS perm_cp_irri_sys_type, 
                         dbo.imprv_detail.permanent_crop_irrigation_sub_class, dbo.imprv_detail.permanent_crop_density, dbo.imprv.imprv_type_cd, dbo.imprv.sale_id, dbo.property_val.prop_inactive_dt
FROM            dbo.property_val INNER JOIN
                         dbo.imprv_detail ON dbo.property_val.prop_id = dbo.imprv_detail.prop_id INNER JOIN
                         dbo.imprv ON dbo.property_val.prop_val_yr = dbo.imprv.prop_val_yr AND dbo.property_val.sup_num = dbo.imprv.sup_num AND dbo.property_val.prop_id = dbo.imprv.prop_id AND 
                         dbo.imprv_detail.prop_val_yr = dbo.imprv.prop_val_yr AND dbo.imprv_detail.sup_num = dbo.imprv.sup_num AND dbo.imprv_detail.sale_id = dbo.imprv.sale_id AND dbo.imprv_detail.prop_id = dbo.imprv.prop_id AND 
                         dbo.imprv_detail.imprv_id = dbo.imprv.imprv_id
WHERE        (dbo.property_val.prop_val_yr = 2021) AND (dbo.imprv.sale_id = 0) AND (dbo.imprv.imprv_type_cd = 'PERMC') AND (dbo.property_val.prop_inactive_dt IS NULL)

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
         Begin Table = "property_val (dbo)"
            Begin Extent = 
               Top = 6
               Left = 38
               Bottom = 136
               Right = 326
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "imprv_detail (dbo)"
            Begin Extent = 
               Top = 138
               Left = 38
               Bottom = 268
               Right = 337
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "imprv (dbo)"
            Begin Extent = 
               Top = 270
               Left = 38
               Bottom = 400
               Right = 339
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
', @level0type = N'SCHEMA', @level0name = N'CO\CC1', @level1type = N'VIEW', @level1name = N'Mobile_VW';


GO

EXECUTE sp_addextendedproperty @name = N'MS_DiagramPaneCount', @value = 1, @level0type = N'SCHEMA', @level0name = N'CO\CC1', @level1type = N'VIEW', @level1name = N'Mobile_VW';


GO


CREATE VIEW [CO\ANTHONYV].CoR_2023
AS
SELECT DISTINCT 
                         TOP (100) PERCENT pv.prop_id, p.geo_id, pv.cycle, ta.tax_area_number AS TCA, REPLACE(ac.file_as_name, ',', '') AS Owner, ISNULL(a.addr_line1, '') AS Expr1, ISNULL(a.addr_line2, '') AS Expr2, ISNULL(a.addr_line3, '') 
                         AS Expr3, ISNULL(a.addr_city, '') AS Expr4, ISNULL(a.addr_state, '') AS Expr5, ISNULL(a.addr_zip, '') AS Expr6, ISNULL(s.situs_num, '') AS Expr7, ISNULL(s.situs_street_prefx, '') AS Expr8, ISNULL(s.situs_street, '') AS Expr9, 
                         ISNULL(s.situs_street_sufix, '') AS Expr10, ISNULL(s.situs_city, '') AS Expr11, ISNULL(s.situs_state, '') AS Expr12, ISNULL(s.situs_zip, '') AS Expr13, ISNULL(s.situs_unit, '') AS Expr14, pv.township_section AS Section, 
                         pv.township_code AS Township, pv.range_code AS Range, pv.township_q_section AS Qtr_Section, pv.imprv_hstd_val + pv.imprv_non_hstd_val AS Imprv_Value, 
                         pv.land_hstd_val + pv.land_non_hstd_val + pv.ag_market + pv.timber_market AS Land_val, pv.market, pp.imprv_type_cd, pv.property_use_cd AS Primary_Use_Code, pu.property_use_desc AS Primary_Use_Code_Desc, 
                         dbo.fn_GetExemptions(pv.prop_id, pv.prop_val_yr, pv.sup_num) AS Exemptions, pp.living_area, pp.condition_cd, f.Bedrooms, h.Full_Bathrooms, i.Half_Bathrooms, k.Foundation, l.Exterior_Wall, m.Roof_Covering, n.HVAC, 
                         q.Fireplace, r.Fixture_Count, pp.class_cd
FROM            dbo.property_val AS pv WITH (nolock) INNER JOIN
                         dbo.prop_supp_assoc AS psa WITH (nolock) ON pv.prop_id = psa.prop_id AND pv.prop_val_yr = psa.owner_tax_yr AND pv.sup_num = psa.sup_num INNER JOIN
                         dbo.property AS p WITH (nolock) ON pv.prop_id = p.prop_id INNER JOIN
                         dbo.owner AS o WITH (nolock) ON pv.prop_id = o.prop_id AND pv.prop_val_yr = o.owner_tax_yr AND pv.sup_num = o.sup_num INNER JOIN
                         dbo.account AS ac WITH (nolock) ON o.owner_id = ac.acct_id INNER JOIN
                         dbo.address AS a WITH (nolock) ON ac.acct_id = a.acct_id AND ISNULL(a.primary_addr, 'N') = 'Y' INNER JOIN
                         dbo.property_tax_area AS pta WITH (nolock) ON pv.prop_id = pta.prop_id AND pv.prop_val_yr = pta.year AND pv.sup_num = pta.sup_num INNER JOIN
                         dbo.tax_area AS ta WITH (nolock) ON pta.tax_area_id = ta.tax_area_id INNER JOIN
                         dbo.property_profile AS pp WITH (nolock) ON pv.prop_id = pp.prop_id AND pv.prop_val_yr = pp.prop_val_yr INNER JOIN
                         dbo.property_use AS pu WITH (nolock) ON pv.property_use_cd = pu.property_use_cd LEFT OUTER JOIN
                         dbo.situs AS s WITH (nolock) ON pv.prop_id = s.prop_id AND ISNULL(s.primary_situs, 'N') = 'Y' LEFT OUTER JOIN
                             (SELECT DISTINCT idt1.prop_id, ia1.i_attr_unit AS Bedrooms
                               FROM            dbo.imprv_detail AS idt1 WITH (nolock) LEFT OUTER JOIN
                                                         dbo.imprv_attr AS ia1 WITH (nolock) ON idt1.prop_id = ia1.prop_id AND idt1.prop_val_yr = ia1.prop_val_yr AND idt1.imprv_id = ia1.imprv_id AND idt1.imprv_det_id = ia1.imprv_det_id AND 
                                                         ia1.sale_id = 0 LEFT OUTER JOIN
                                                         dbo.attribute AS a1 WITH (nolock) ON ia1.i_attr_val_id = a1.imprv_attr_id
                               WHERE        (idt1.prop_val_yr = YEAR(GETDATE())) AND (idt1.sale_id = 0) AND (idt1.imprv_det_type_cd = 'MA') AND (a1.imprv_attr_id = 15)) AS f ON pv.prop_id = f.prop_id LEFT OUTER JOIN
                             (SELECT DISTINCT idt2.prop_id, ia2.i_attr_unit AS Full_Bathrooms
                               FROM            dbo.imprv_detail AS idt2 WITH (nolock) LEFT OUTER JOIN
                                                         dbo.imprv_attr AS ia2 WITH (nolock) ON idt2.prop_id = ia2.prop_id AND idt2.prop_val_yr = ia2.prop_val_yr AND idt2.imprv_id = ia2.imprv_id AND idt2.imprv_det_id = ia2.imprv_det_id AND 
                                                         ia2.sale_id = 0 LEFT OUTER JOIN
                                                         dbo.attribute AS a2 WITH (nolock) ON ia2.i_attr_val_id = a2.imprv_attr_id
                               WHERE        (idt2.prop_val_yr = YEAR(GETDATE())) AND (idt2.sale_id = 0) AND (idt2.imprv_det_type_cd = 'MA') AND (a2.imprv_attr_id = 45)) AS h ON pv.prop_id = h.prop_id LEFT OUTER JOIN
                             (SELECT DISTINCT idt3.prop_id, ia3.i_attr_unit AS Half_Bathrooms
                               FROM            dbo.imprv_detail AS idt3 WITH (nolock) LEFT OUTER JOIN
                                                         dbo.imprv_attr AS ia3 WITH (nolock) ON idt3.prop_id = ia3.prop_id AND idt3.prop_val_yr = ia3.prop_val_yr AND idt3.imprv_id = ia3.imprv_id AND idt3.imprv_det_id = ia3.imprv_det_id AND 
                                                         ia3.sale_id = 0 LEFT OUTER JOIN
                                                         dbo.attribute AS a3 WITH (nolock) ON ia3.i_attr_val_id = a3.imprv_attr_id
                               WHERE        (idt3.prop_val_yr = YEAR(GETDATE())) AND (idt3.sale_id = 0) AND (idt3.imprv_det_type_cd = 'MA') AND (a3.imprv_attr_id = 46)) AS i ON pv.prop_id = i.prop_id LEFT OUTER JOIN
                             (SELECT DISTINCT idt4.prop_id, ia4.i_attr_val_cd AS Foundation
                               FROM            dbo.imprv_detail AS idt4 WITH (nolock) LEFT OUTER JOIN
                                                         dbo.imprv_attr AS ia4 WITH (nolock) ON idt4.prop_id = ia4.prop_id AND idt4.prop_val_yr = ia4.prop_val_yr AND idt4.imprv_id = ia4.imprv_id AND idt4.imprv_det_id = ia4.imprv_det_id AND 
                                                         ia4.sale_id = 0 LEFT OUTER JOIN
                                                         dbo.attribute AS a4 WITH (nolock) ON ia4.i_attr_val_id = a4.imprv_attr_id
                               WHERE        (idt4.prop_val_yr = YEAR(GETDATE())) AND (idt4.sale_id = 0) AND (idt4.imprv_det_type_cd = 'MA') AND (a4.imprv_attr_id = 2)) AS k ON pv.prop_id = k.prop_id LEFT OUTER JOIN
                             (SELECT DISTINCT idt5.prop_id, ia5.i_attr_val_cd AS Exterior_Wall
                               FROM            dbo.imprv_detail AS idt5 WITH (nolock) LEFT OUTER JOIN
                                                         dbo.imprv_attr AS ia5 WITH (nolock) ON idt5.prop_id = ia5.prop_id AND idt5.prop_val_yr = ia5.prop_val_yr AND idt5.imprv_id = ia5.imprv_id AND idt5.imprv_det_id = ia5.imprv_det_id AND 
                                                         ia5.sale_id = 0 LEFT OUTER JOIN
                                                         dbo.attribute AS a5 WITH (nolock) ON ia5.i_attr_val_id = a5.imprv_attr_id
                               WHERE        (idt5.prop_val_yr = YEAR(GETDATE())) AND (idt5.sale_id = 0) AND (idt5.imprv_det_type_cd = 'MA') AND (a5.imprv_attr_id = 3)) AS l ON pv.prop_id = l.prop_id LEFT OUTER JOIN
                             (SELECT DISTINCT idt6.prop_id, ia6.i_attr_val_cd AS Roof_Covering
                               FROM            dbo.imprv_detail AS idt6 WITH (nolock) LEFT OUTER JOIN
                                                         dbo.imprv_attr AS ia6 WITH (nolock) ON idt6.prop_id = ia6.prop_id AND idt6.prop_val_yr = ia6.prop_val_yr AND idt6.imprv_id = ia6.imprv_id AND idt6.imprv_det_id = ia6.imprv_det_id AND 
                                                         ia6.sale_id = 0 LEFT OUTER JOIN
                                                         dbo.attribute AS a6 WITH (nolock) ON ia6.i_attr_val_id = a6.imprv_attr_id
                               WHERE        (idt6.prop_val_yr = YEAR(GETDATE())) AND (idt6.sale_id = 0) AND (idt6.imprv_det_type_cd = 'MA') AND (a6.imprv_attr_id = 6)) AS m ON pv.prop_id = m.prop_id LEFT OUTER JOIN
                             (SELECT DISTINCT idt7.prop_id, ia7.i_attr_val_cd AS HVAC
                               FROM            dbo.imprv_detail AS idt7 WITH (nolock) LEFT OUTER JOIN
                                                         dbo.imprv_attr AS ia7 WITH (nolock) ON idt7.prop_id = ia7.prop_id AND idt7.prop_val_yr = ia7.prop_val_yr AND idt7.imprv_id = ia7.imprv_id AND idt7.imprv_det_id = ia7.imprv_det_id AND 
                                                         ia7.sale_id = 0 LEFT OUTER JOIN
                                                         dbo.attribute AS a7 WITH (nolock) ON ia7.i_attr_val_id = a7.imprv_attr_id
                               WHERE        (idt7.prop_val_yr = YEAR(GETDATE())) AND (idt7.sale_id = 0) AND (idt7.imprv_det_type_cd = 'MA') AND (a7.imprv_attr_id = 9)) AS n ON pv.prop_id = n.prop_id LEFT OUTER JOIN
                             (SELECT DISTINCT idt8.prop_id, ia8.i_attr_unit AS Fireplace
                               FROM            dbo.imprv_detail AS idt8 WITH (nolock) LEFT OUTER JOIN
                                                         dbo.imprv_attr AS ia8 WITH (nolock) ON idt8.prop_id = ia8.prop_id AND idt8.prop_val_yr = ia8.prop_val_yr AND idt8.imprv_id = ia8.imprv_id AND idt8.imprv_det_id = ia8.imprv_det_id AND 
                                                         ia8.sale_id = 0 LEFT OUTER JOIN
                                                         dbo.attribute AS a8 WITH (nolock) ON ia8.i_attr_val_id = a8.imprv_attr_id
                               WHERE        (idt8.prop_val_yr = YEAR(GETDATE())) AND (idt8.sale_id = 0) AND (idt8.imprv_det_type_cd = 'MA') AND (a8.imprv_attr_id = 10)) AS q ON pv.prop_id = q.prop_id LEFT OUTER JOIN
                             (SELECT DISTINCT idt9.prop_id, ia9.i_attr_unit AS Fixture_Count
                               FROM            dbo.imprv_detail AS idt9 WITH (nolock) LEFT OUTER JOIN
                                                         dbo.imprv_attr AS ia9 WITH (nolock) ON idt9.prop_id = ia9.prop_id AND idt9.prop_val_yr = ia9.prop_val_yr AND idt9.imprv_id = ia9.imprv_id AND idt9.imprv_det_id = ia9.imprv_det_id AND 
                                                         ia9.sale_id = 0 LEFT OUTER JOIN
                                                         dbo.attribute AS a9 WITH (nolock) ON ia9.i_attr_val_id = a9.imprv_attr_id
                               WHERE        (idt9.prop_val_yr = YEAR(GETDATE())) AND (idt9.sale_id = 0) AND (idt9.imprv_det_type_cd = 'MA') AND (a9.imprv_attr_id = 47)) AS r ON pv.prop_id = r.prop_id
WHERE        (pv.prop_val_yr = YEAR(GETDATE())) AND (pv.prop_inactive_dt IS NULL) AND (pv.township_code = '10') AND (pv.range_code = '28') AND (pv.township_section BETWEEN '01' AND '31') OR
                         (pv.prop_val_yr = YEAR(GETDATE())) AND (pv.prop_inactive_dt IS NULL) AND (pv.township_code = '09') AND (pv.range_code = '28') AND (pv.township_section NOT IN ('06', '07', '18')) OR
                         (pv.prop_val_yr = YEAR(GETDATE())) AND (pv.prop_inactive_dt IS NULL) AND (pv.township_code = '08') AND (pv.range_code = '28') AND (pv.township_section BETWEEN '01' AND '12') OR
                         (pv.prop_val_yr = YEAR(GETDATE())) AND (pv.prop_inactive_dt IS NULL) AND (pv.township_code = '09') AND (pv.range_code = '29') AND (pv.township_section IN ('18', '19', '20', '29', '30')) OR
                         (pv.prop_val_yr = YEAR(GETDATE())) AND (pv.prop_inactive_dt IS NULL) AND (pv.township_code = '10') AND (pv.range_code = '27') AND (pv.township_section IN ('01', '02', '11', '12', '13', '14', '24', '25')) OR
                         (pv.prop_val_yr = YEAR(GETDATE())) AND (pv.prop_inactive_dt IS NULL) AND (pv.township_code = '11') AND (pv.range_code = '27') AND (pv.township_section IN ('35', '36')) OR
                         (pv.prop_val_yr = YEAR(GETDATE())) AND (pv.prop_inactive_dt IS NULL) AND (pv.township_code = '11') AND (pv.range_code = '28') AND (pv.township_section IN ('31', '32', '33', '34', '35'))
ORDER BY 'Section', 'Township', 'Range'

GO

EXECUTE sp_addextendedproperty @name = N'MS_DiagramPane3', @value = N' = 1500
         Width = 1500
         Width = 1500
         Width = 1500
         Width = 1500
         Width = 1500
         Width = 1500
         Width = 1500
         Width = 1500
         Width = 1500
         Width = 1500
         Width = 1500
         Width = 1500
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
      Begin ColumnWidths = 15
         Column = 4860
         Alias = 1710
         Table = 2265
         Output = 1395
         Append = 1400
         NewValue = 1170
         SortType = 1350
         SortOrder = 1410
         GroupBy = 1350
         Filter = 1350
         Or = 2190
         Or = 2685
         Or = 2775
         Or = 4185
         Or = 1350
         Or = 1350
         Or = 1350
      End
   End
End
', @level0type = N'SCHEMA', @level0name = N'CO\ANTHONYV', @level1type = N'VIEW', @level1name = N'CoR_2023';


GO

EXECUTE sp_addextendedproperty @name = N'MS_DiagramPaneCount', @value = 3, @level0type = N'SCHEMA', @level0name = N'CO\ANTHONYV', @level1type = N'VIEW', @level1name = N'CoR_2023';


GO

EXECUTE sp_addextendedproperty @name = N'MS_DiagramPane1', @value = N'[0E232FF0-B466-11cf-A24F-00AA00A3EFFF, 1.00]
Begin DesignProperties = 
   Begin PaneConfigurations = 
      Begin PaneConfiguration = 0
         NumPanes = 4
         Configuration = "(H (1[33] 4[31] 2[32] 3) )"
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
               Bottom = 497
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
               Bottom = 122
               Right = 773
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "o"
            Begin Extent = 
               Top = 6
               Left = 811
               Bottom = 144
               Right = 1017
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "ac"
            Begin Extent = 
               Top = 6
               Left = 1055
               Bottom = 144
               Right = 1279
            End
            DisplayFlags = 280
            TopColumn = 1
         End
         Begin Table = "a"
            Begin Extent = 
               Top = 6
               Left = 1317
               Bottom = 140
               Right = 1510
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "pta"
            Begin Extent = 
               Top = 6
               Left = 1548
               Bottom = 143
               Right = 1743
            End
            DisplayFlags = 280
            TopColumn = 0
         ', @level0type = N'SCHEMA', @level0name = N'CO\ANTHONYV', @level1type = N'VIEW', @level1name = N'CoR_2023';


GO

EXECUTE sp_addextendedproperty @name = N'MS_DiagramPane2', @value = N'End
         Begin Table = "ta"
            Begin Extent = 
               Top = 6
               Left = 1781
               Bottom = 136
               Right = 1980
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "pp"
            Begin Extent = 
               Top = 149
               Left = 794
               Bottom = 435
               Right = 1103
            End
            DisplayFlags = 280
            TopColumn = 4
         End
         Begin Table = "pu"
            Begin Extent = 
               Top = 120
               Left = 364
               Bottom = 238
               Right = 550
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "s"
            Begin Extent = 
               Top = 138
               Left = 588
               Bottom = 253
               Right = 766
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "f"
            Begin Extent = 
               Top = 144
               Left = 1141
               Bottom = 240
               Right = 1311
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "h"
            Begin Extent = 
               Top = 240
               Left = 364
               Bottom = 336
               Right = 535
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "i"
            Begin Extent = 
               Top = 240
               Left = 1141
               Bottom = 336
               Right = 1315
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "k"
            Begin Extent = 
               Top = 258
               Left = 573
               Bottom = 354
               Right = 743
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "l"
            Begin Extent = 
               Top = 336
               Left = 364
               Bottom = 432
               Right = 534
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "m"
            Begin Extent = 
               Top = 336
               Left = 1141
               Bottom = 432
               Right = 1311
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "n"
            Begin Extent = 
               Top = 354
               Left = 572
               Bottom = 450
               Right = 742
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "q"
            Begin Extent = 
               Top = 432
               Left = 364
               Bottom = 528
               Right = 534
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "r"
            Begin Extent = 
               Top = 432
               Left = 1141
               Bottom = 528
               Right = 1311
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
      Begin ColumnWidths = 31
         Width = 284
         Width = 1500
         Width = 1500
         Width = 1500
         Width = 1500
         Width = 1500
         Width = 1500
         Width = 1500
         Width = 1500
         Width = 1500
         Width', @level0type = N'SCHEMA', @level0name = N'CO\ANTHONYV', @level1type = N'VIEW', @level1name = N'CoR_2023';


GO


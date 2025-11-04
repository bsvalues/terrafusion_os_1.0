CREATE VIEW [dbo].[CURR_PROPERTY_OWNER_VW]
AS
SELECT        o.owner_id, ac.acct_id AS acct_acct_id, ac.ref_id1 AS acct_ref_id1, psa.owner_tax_yr AS sup_yr, psa.sup_num, o.owner_tax_yr, o.hs_prop, o.updt_dt, 
                         o.pct_ownership, o.ag_app_filed, o.owner_cmnt, o.over_65_defer, o.over_65_date, ac.first_name, ac.dl_num, ac.last_name, ac.file_as_name, ac.merged_acct_id, 
                         ac.dl_state, ac.acct_create_dt, ac.dl_expir_dt, ac.opening_balance, pv.abs_subdv_cd, p.prop_create_dt, pv.prop_val_yr, pv.hood_cd, pv.cycle, pv.block, 
                         pv.tract_or_lot, pv.mbl_hm_park, pv.mbl_hm_space, pv.auto_build_legal, p.ref_id1, p.ref_id2, p.geo_id, pv.rgn_cd, pv.subset_cd, pv.map_id, p.ams_load_dt, 
                         p.prop_cmnt, p.prop_sic_cd, p.dba_name, p.alt_dba_name, pv.last_appraiser_id, p.exmpt_reset, pv.next_appraiser_id, p.gpm_irrig, pv.last_appraisal_dt, 
                         pv.next_appraisal_dt, pv.next_appraisal_rsn, p.utilities, p.topography, p.road_access, p.other, p.zoning, p.remarks, p.prop_type_cd, t.prop_type_desc, s.situs_id, 
                         s.primary_situs, s.situs_num, s.situs_street_prefx, s.situs_street, s.situs_street_sufix, s.situs_unit, s.situs_city, s.situs_state, s.situs_zip, s.situs_display, 
                         pv.legal_desc, pv.legal_desc_2, pv.legal_acreage, CASE WHEN ISNULL(lease_flag, 0) = 0 THEN ma.lease_id ELSE lpa.lease_id END AS lease_id, 
                         p.prop_id AS owner_prop_id, pv.prop_inactive_dt, pv.eff_size_acres, pv.orig_appraised_val, pv.appraised_val, pv.assessed_val, pv.recalc_flag, 
                         pv.appraised_val - pv.orig_appraised_val AS convert_gain_loss, pv.appr_company_id, pv.land_hstd_val, pv.land_non_hstd_val, pv.imprv_hstd_val, 
                         pv.imprv_non_hstd_val, pv.ag_use_val, pv.ag_market, pv.vit_flag, ac.confidential_flag, ac.confidential_file_as_name, ac.confidential_first_name, 
                         ac.confidential_last_name, p.simple_geo_id, pv.udi_parent, pv.udi_parent_prop_id, pv.udi_status, pv.market
FROM            dbo.property_val AS pv INNER JOIN
                         dbo.prop_supp_assoc AS psa ON pv.prop_id = psa.prop_id AND pv.prop_val_yr = psa.owner_tax_yr AND pv.sup_num = psa.sup_num INNER JOIN
                         dbo.property AS p ON pv.prop_id = p.prop_id INNER JOIN
                         dbo.property_type AS t ON p.prop_type_cd = t.prop_type_cd INNER JOIN
                         dbo.owner AS o ON pv.prop_id = o.prop_id AND pv.prop_val_yr = o.owner_tax_yr AND pv.sup_num = o.sup_num INNER JOIN
                         dbo.account AS ac ON o.owner_id = ac.acct_id INNER JOIN
                         dbo.pacs_system ON dbo.pacs_system.system_type IN ('A', 'B') LEFT OUTER JOIN
                         dbo.situs AS s ON pv.prop_id = s.prop_id AND s.primary_situs = 'Y' LEFT OUTER JOIN
                         dbo.mineral_acct AS ma ON pv.prop_id = ma.prop_id LEFT OUTER JOIN
                         dbo.lease_prop_assoc AS lpa ON pv.prop_id = lpa.prop_id AND pv.prop_val_yr = lpa.lease_yr AND pv.sup_num = lpa.sup_num AND lpa.rev_num =
                             (SELECT        MAX(rev_num) AS Expr1
                               FROM            dbo.lease_prop_assoc
                               WHERE        (lpa.prop_id = prop_id) AND (lpa.lease_id = lease_id) AND (lpa.lease_yr = lease_yr) AND (lpa.sup_num = sup_num))
WHERE        (pv.prop_val_yr IN
                             (SELECT        MAX(owner_tax_yr) AS Expr1
                               FROM            dbo.prop_supp_assoc
                               WHERE        (prop_id = p.prop_id)))

GO

EXECUTE sp_addextendedproperty @name = N'MS_DiagramPane2', @value = N'umn = 0
         End
         Begin Table = "s"
            Begin Extent = 
               Top = 666
               Left = 38
               Bottom = 795
               Right = 216
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "ma"
            Begin Extent = 
               Top = 402
               Left = 300
               Bottom = 531
               Right = 471
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "lpa"
            Begin Extent = 
               Top = 666
               Left = 254
               Bottom = 795
               Right = 428
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
', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'VIEW', @level1name = N'CURR_PROPERTY_OWNER_VW';


GO

EXECUTE sp_addextendedproperty @name = N'MS_DiagramPaneCount', @value = 2, @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'VIEW', @level1name = N'CURR_PROPERTY_OWNER_VW';


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
         Top = -192
         Left = 0
      End
      Begin Tables = 
         Begin Table = "pv"
            Begin Extent = 
               Top = 6
               Left = 38
               Bottom = 135
               Right = 326
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "psa"
            Begin Extent = 
               Top = 138
               Left = 38
               Bottom = 250
               Right = 208
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "p"
            Begin Extent = 
               Top = 138
               Left = 246
               Bottom = 267
               Right = 447
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "t"
            Begin Extent = 
               Top = 252
               Left = 38
               Bottom = 347
               Right = 209
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "o"
            Begin Extent = 
               Top = 270
               Left = 247
               Bottom = 399
               Right = 453
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "ac"
            Begin Extent = 
               Top = 402
               Left = 38
               Bottom = 531
               Right = 262
            End
            DisplayFlags = 280
            TopColumn = 0
         End
         Begin Table = "pacs_system (dbo)"
            Begin Extent = 
               Top = 534
               Left = 38
               Bottom = 663
               Right = 365
            End
            DisplayFlags = 280
            TopCol', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'VIEW', @level1name = N'CURR_PROPERTY_OWNER_VW';


GO


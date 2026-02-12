create view __aApprEst_Compair as

SELECT        __aApprEst.ParcelID, __aApprEst.TotalArea, apy.TotalArea AS TotalArea_prior,apy.finished_basement,
apy.finished_basement AS Finished_basement_prior, 
                         __aApprEst.unfinished_basement, 
						 apy.unfinished_basement AS Unfinished_Basement_prior, __aApprEst
						 .Total_Basement, apy.Total_Basement AS Total_Basement_Prior, 
                         __aApprEst.YearBuilt, apy.YearBuilt AS Year_built_Prior, __aApprEst.class_cd, 
						 apy.class_cd AS class_cd_prior, __aApprEst.class_subclass_cd, 
                         apy.class_subclass_cd AS class_subclass_cd_prior, __aApprEst.Condition, apy.Condition AS Condition_Prior, __aApprEst.Style, apy.Style AS Style_Prior,
                          __aApprEst.fixture_count, apy.fixture_count AS fixture_count_prior, __aApprEst.Current_Ratio,apy.Current_Ratio AS Ratio_prior, __aApprEst.Imprv_unit_price_at_sale, 
                        apy.Imprv_unit_price_at_sale AS imprv_unit_price_at_sale_prior, __aApprEst.Current_unit_price, apy.Current_unit_price AS Unit_price_prior, 
						 __aApprEst.Land_unit_price_at_sale,  apy.Land_unit_price_at_sale AS land_unit_Price_prior, __aApprEst.Land_UnitVal, apy.Land_UnitVal as land_unitVal_prior, __aApprEst.Imprv_AdjVal, 
                        apy.Imprv_AdjVal AS Imprv_AdjVal_prior, __aApprEst.TotalMarketValue, apy.TotalMarketValue AS TotalMarketValue_Prior, __aApprEst.ImpVal, 
                       apy.ImpVal AS Imprv_val_prior, __aApprEst.LandVal,apy.LandVal AS LandVal_Prior, __aApprEst.land_only_sale, __aApprEst.adj_physical_pct, 
                       apy.adj_physical_pct AS adj_phy_prior, __aApprEst.adj_economic_pct, apy.adj_economic_pct AS adj_eco_prior, __aApprEst.adj_functional_pct, 
                      apy.adj_functional_pct AS adj_functional_prior, __aApprEst.adj_factor, apy.adj_factor AS adj_factor_prior, __aApprEst.effective_year, 
                        apy.effective_year AS Eff_yr_prior, __aApprEst.mass_adj_factor, apy.mass_adj_factor AS mass_adj_prior, __aApprEst.gain_loss, 
                       apy.gain_loss AS gain_loss_prior
FROM            __aApprEst   INNER JOIN
                         __aApprEst_prior_year  apy ON __aApprEst.ParcelID = apy.ParcelID

GO


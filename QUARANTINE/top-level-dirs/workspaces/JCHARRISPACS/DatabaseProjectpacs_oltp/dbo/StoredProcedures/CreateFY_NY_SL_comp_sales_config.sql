CREATE   PROCEDURE CreateFY_NY_SL_comp_sales_config
	@lInputFromYear numeric(4,0),
    @lCopyToYear numeric(4,0),
    @CalledBy varchar(10) 
 
AS
 
/* Top of each procedure to capture input parameters */
SET NOCOUNT ON
DECLARE @Rows int
DECLARE @qry varchar(255)
 declare @proc varchar(500)
 set @proc = object_name(@@procid)
 
 SET @qry = 'Start - ' + @proc + ' ' + convert(char(4),@lInputFromYear)
         + ',' + convert(char(4),@lCopyToYear) + ',' + @CalledBy
 
 exec dbo.CurrentActivityLogInsert @proc, @qry
 
/* End top of each procedure to capture parameters */
INSERT INTO 
    comp_sales_config
(
    main_area_adj_pct_factor
   ,time_adj_pct_factor
   ,fPctBuildingArea
   ,fPctLandArea
   ,fPctBusinessValue
   ,lNumCompsResidential
   ,lNumCompsCorp
   ,szGridNameARBInquiry
   ,szGridNameARBProtest
   ,lYear
   ,lnum_res_list
   ,lnum_com_list
   ,flbratio_low
   ,flbratio_high
   ,lnum_land_sales_list
   ,lnum_res_equity_list
   ,lnum_com_equity_list
   ,lNumCompsResidentialEquity
   ,lNumCompsCorpEquity
   ,fMktLeveler
   ,bUseEffYearBltAdj
   ,bUsePctGoodAdj
   ,bMoveMAAdjOutOfSegments
   ,bAdjSegmentsWithStraitCalc
   ,bAdjSegmentsWithMktLevelerCalc
   ,bAdjustClassWithUnitPrice
   ,bStaticDefaultResidentialSales
   ,bStaticDefaultResidentialEquity
   ,bStaticDefaultCorpSales
   ,bStaticDefaultCorpEquity
   ,bSearchIncludeChild
   ,bSearchIncludeParent
   ,bSearchIncludeDeleted
   ,bAdjustHighValueImprov
   ,bExcludeIncompleteProps
   ,bUseImprovTypeInclusion
   ,bForceScoreBase100
   ,bClassAdjRCNEqualize
   ,bUseHighValueImprovClass
   ,bUseHighValueImprovSubClass
   ,bUseHighValueImprovArea
   ,bAdj_URAR_MA
   ,bMultiImpAdjUsesDetailRCNLDSum
   ,bMultiImpAdjTimesSysMAAdjFactor
   ,lBaseYearMonthsSinceSale
		,bUseResidentialMarketModifier
		,bUseResidentialMarketModifierWeighting
		,bUseResidentialScoringWeighting
		,bUseLandMarketModifier
		,bUseLandMarketModifierWeighting
		,bUseLandScoringWeighting
		,bFeaturesValue
		,time_adj_pct_residential
		,time_adj_pct_commercial
		,time_adj_pct_land
		,bSimpleMAAdj
		,market_approach_value_option
		,market_approach_calc_option
)
SELECT 
    csc.main_area_adj_pct_factor
    ,csc.time_adj_pct_factor
    ,csc.fPctBuildingArea
    ,csc.fPctLandArea
    ,csc.fPctBusinessValue
    ,csc.lNumCompsResidential
    ,csc.lNumCompsCorp
    ,csc.szGridNameARBInquiry
    ,csc.szGridNameARBProtest
    ,@lCopyToYear
    ,csc.lnum_res_list
    ,csc.lnum_com_list
    ,csc.flbratio_low
    ,csc.flbratio_high
    ,csc.lnum_land_sales_list
    ,csc.lnum_res_equity_list
    ,csc.lnum_com_equity_list
    ,csc.lNumCompsResidentialEquity
    ,csc.lNumCompsCorpEquity
    ,csc.fMktLeveler
    ,csc.bUseEffYearBltAdj
    ,csc.bUsePctGoodAdj
    ,csc.bMoveMAAdjOutOfSegments
    ,csc.bAdjSegmentsWithStraitCalc
    ,csc.bAdjSegmentsWithMktLevelerCalc
    ,csc.bAdjustClassWithUnitPrice
    ,csc.bStaticDefaultResidentialSales
    ,csc.bStaticDefaultResidentialEquity
    ,csc.bStaticDefaultCorpSales
    ,csc.bStaticDefaultCorpEquity
    ,csc.bSearchIncludeChild
    ,csc.bSearchIncludeParent
    ,csc.bSearchIncludeDeleted
    ,csc.bAdjustHighValueImprov
    ,csc.bExcludeIncompleteProps
    ,csc.bUseImprovTypeInclusion
    ,csc.bForceScoreBase100
    ,csc.bClassAdjRCNEqualize
    ,csc.bUseHighValueImprovClass
    ,csc.bUseHighValueImprovSubClass
    ,csc.bUseHighValueImprovArea
    ,csc.bAdj_URAR_MA
    ,csc.bMultiImpAdjUsesDetailRCNLDSum
    ,csc.bMultiImpAdjTimesSysMAAdjFactor
    ,csc.lBaseYearMonthsSinceSale -- Yes, the same value.  Reqs dictate it should not change in the NYL.  User will change it as required.
		,bUseResidentialMarketModifier
		,bUseResidentialMarketModifierWeighting
		,bUseResidentialScoringWeighting
		,bUseLandMarketModifier
		,bUseLandMarketModifierWeighting
		,bUseLandScoringWeighting
		,bFeaturesValue
		,time_adj_pct_residential
		,time_adj_pct_commercial
		,time_adj_pct_land
		,bSimpleMAAdj
		,market_approach_value_option
		,market_approach_calc_option
 FROM 
    comp_sales_config as csc LEFT JOIN 
     (select @lInputFromYear as lYear
        from comp_sales_config with (nolock) 
       where lYear = @lCopyToYear) as fy_csc
   on csc.lYear = fy_csc.lYear

  where csc.lYear = @lInputFromYear
 and fy_csc.lYear is null -- only return those not already inserted
 
set @Rows  = @@Rowcount


-- update log
set @qry = Replace(@qry,'Start','End')
exec dbo.CurrentActivityLogInsert @proc, @qry,@Rows,@@ERROR

GO


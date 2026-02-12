CREATE TABLE [dbo].[comp_sales_config] (
    [main_area_adj_pct_factor]               REAL           NOT NULL,
    [time_adj_pct_factor]                    REAL           NOT NULL,
    [fPctBuildingArea]                       REAL           NOT NULL,
    [fPctLandArea]                           REAL           NOT NULL,
    [fPctBusinessValue]                      REAL           NOT NULL,
    [lNumCompsResidential]                   INT            CONSTRAINT [CDF_comp_sales_config_lNumCompsResidential] DEFAULT (4) NOT NULL,
    [lNumCompsCorp]                          INT            CONSTRAINT [CDF_comp_sales_config_lNumCompsCorp] DEFAULT (4) NOT NULL,
    [szGridNameARBInquiry]                   VARCHAR (64)   CONSTRAINT [CDF_comp_sales_config_szGridNameARBInquiry] DEFAULT ('ARB Inquiry') NOT NULL,
    [szGridNameARBProtest]                   VARCHAR (64)   CONSTRAINT [CDF_comp_sales_config_szGridNameARBProtest] DEFAULT ('ARB Protest') NOT NULL,
    [lYear]                                  NUMERIC (4)    NOT NULL,
    [lnum_res_list]                          INT            CONSTRAINT [CDF_comp_sales_config_lnum_res_list] DEFAULT (200) NOT NULL,
    [lnum_com_list]                          INT            CONSTRAINT [CDF_comp_sales_config_lnum_com_list] DEFAULT (50) NOT NULL,
    [flbratio_low]                           REAL           CONSTRAINT [CDF_comp_sales_config_flbratio_low] DEFAULT ((-15.0)) NOT NULL,
    [flbratio_high]                          REAL           CONSTRAINT [CDF_comp_sales_config_flbratio_high] DEFAULT (15.0) NOT NULL,
    [lnum_land_sales_list]                   INT            NOT NULL,
    [lnum_res_equity_list]                   INT            NOT NULL,
    [lnum_com_equity_list]                   INT            NOT NULL,
    [lNumCompsResidentialEquity]             INT            NOT NULL,
    [lNumCompsCorpEquity]                    INT            NOT NULL,
    [fMktLeveler]                            REAL           NULL,
    [bUseEffYearBltAdj]                      BIT            NULL,
    [bUsePctGoodAdj]                         BIT            NULL,
    [bMoveMAAdjOutOfSegments]                BIT            NULL,
    [bAdjSegmentsWithStraitCalc]             BIT            NULL,
    [bAdjSegmentsWithMktLevelerCalc]         BIT            NULL,
    [bAdjustClassWithUnitPrice]              BIT            NULL,
    [bStaticDefaultResidentialSales]         BIT            NULL,
    [bStaticDefaultResidentialEquity]        BIT            NULL,
    [bStaticDefaultCorpSales]                BIT            NULL,
    [bStaticDefaultCorpEquity]               BIT            NULL,
    [bSearchIncludeChild]                    BIT            NULL,
    [bSearchIncludeParent]                   BIT            NULL,
    [bSearchIncludeDeleted]                  BIT            NULL,
    [bAdjustHighValueImprov]                 BIT            NULL,
    [bExcludeIncompleteProps]                BIT            NULL,
    [bUseImprovTypeInclusion]                BIT            NULL,
    [bForceScoreBase100]                     BIT            NULL,
    [bClassAdjRCNEqualize]                   BIT            NULL,
    [bUseHighValueImprovClass]               BIT            NULL,
    [bUseHighValueImprovSubClass]            BIT            NULL,
    [bUseHighValueImprovArea]                BIT            NULL,
    [bAdj_URAR_MA]                           BIT            NULL,
    [bMultiImpAdjUsesDetailRCNLDSum]         BIT            NULL,
    [bMultiImpAdjTimesSysMAAdjFactor]        BIT            NULL,
    [lBaseYearMonthsSinceSale]               NUMERIC (4)    NULL,
    [bUseResidentialMarketModifier]          BIT            CONSTRAINT [CDF_comp_sales_config_bUseResidentialMarketModifier] DEFAULT ((0)) NOT NULL,
    [bUseResidentialMarketModifierWeighting] BIT            CONSTRAINT [CDF_comp_sales_config_bUseResidentialMarketModifierWeighting] DEFAULT ((0)) NOT NULL,
    [bUseResidentialScoringWeighting]        BIT            CONSTRAINT [CDF_comp_sales_config_bUseResidentialScoringWeighting] DEFAULT ((0)) NOT NULL,
    [bUseLandMarketModifier]                 BIT            CONSTRAINT [CDF_comp_sales_config_bUseLandMarketModifier] DEFAULT ((0)) NOT NULL,
    [bUseLandMarketModifierWeighting]        BIT            CONSTRAINT [CDF_comp_sales_config_bUseLandMarketModifierWeighting] DEFAULT ((0)) NOT NULL,
    [bUseLandScoringWeighting]               BIT            CONSTRAINT [CDF_comp_sales_config_bUseLandScoringWeighting] DEFAULT ((0)) NOT NULL,
    [bFeaturesValue]                         BIT            NULL,
    [time_adj_pct_residential]               NUMERIC (7, 4) CONSTRAINT [CDF_comp_sales_config_time_adj_pct_residential] DEFAULT ((0)) NULL,
    [time_adj_pct_commercial]                NUMERIC (7, 4) CONSTRAINT [CDF_comp_sales_config_time_adj_pct_commercial] DEFAULT ((0)) NULL,
    [time_adj_pct_land]                      NUMERIC (7, 4) CONSTRAINT [CDF_comp_sales_config_time_adj_pct_land] DEFAULT ((0)) NULL,
    [bSimpleMAAdj]                           BIT            CONSTRAINT [CDF_comp_sales_config_bSimpleMAAdj] DEFAULT ((0)) NOT NULL,
    [market_approach_value_option]           VARCHAR (4)    CONSTRAINT [CDF_comp_sales_config_market_approach_value_option] DEFAULT ('MCSA') NOT NULL,
    [market_approach_calc_option]            VARCHAR (24)   CONSTRAINT [CDF_comp_sales_config_market_approach_calc_option] DEFAULT ('DistributeToImprv') NOT NULL,
    CONSTRAINT [CPK_comp_sales_config] PRIMARY KEY CLUSTERED ([lYear] ASC) WITH (FILLFACTOR = 100)
);


GO



create trigger tr_comp_sales_config_delete_insert_update_MemTable
on comp_sales_config
for delete, insert, update
not for replication
as
 
if ( @@rowcount = 0 )
begin
	return
end
 
set nocount on
 
update table_cache_status with(rowlock)
set lDummy = 0
where szTableName = 'comp_sales_config'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Use Residential Market Modifier flag', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'comp_sales_config', @level2type = N'COLUMN', @level2name = N'bUseResidentialMarketModifier';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Setting that indicates how to push the grid indicated value(s) to the property market approach value.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'comp_sales_config', @level2type = N'COLUMN', @level2name = N'market_approach_value_option';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The time adj percentage for commercial properties', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'comp_sales_config', @level2type = N'COLUMN', @level2name = N'time_adj_pct_commercial';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Land Market Modifier Indicator', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'comp_sales_config', @level2type = N'COLUMN', @level2name = N'bUseLandMarketModifier';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The time adj percentage for land properties', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'comp_sales_config', @level2type = N'COLUMN', @level2name = N'time_adj_pct_land';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Feature Values Adj Flag', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'comp_sales_config', @level2type = N'COLUMN', @level2name = N'bFeaturesValue';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Use Residential Market Modifier Weighting flag', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'comp_sales_config', @level2type = N'COLUMN', @level2name = N'bUseResidentialMarketModifierWeighting';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Defines how to distribute the calculated market approach value to the land and improvements.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'comp_sales_config', @level2type = N'COLUMN', @level2name = N'market_approach_calc_option';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Land Market Modifier Weighting Indicator', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'comp_sales_config', @level2type = N'COLUMN', @level2name = N'bUseLandMarketModifierWeighting';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Indicates whether or not to use the Simple MA Adjustment', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'comp_sales_config', @level2type = N'COLUMN', @level2name = N'bSimpleMAAdj';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The time adj percentage for residential properties', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'comp_sales_config', @level2type = N'COLUMN', @level2name = N'time_adj_pct_residential';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Residential Scoring Weighting Indicator', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'comp_sales_config', @level2type = N'COLUMN', @level2name = N'bUseResidentialScoringWeighting';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Land Scoring Weighting Indicator', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'comp_sales_config', @level2type = N'COLUMN', @level2name = N'bUseLandScoringWeighting';


GO


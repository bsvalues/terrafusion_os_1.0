CREATE TABLE [dbo].[comp_equity_commercial_summary_print] (
    [report_type]            VARCHAR (10)    NOT NULL,
    [pacs_user_id]           INT             NOT NULL,
    [subject_prop_id]        INT             NOT NULL,
    [prop_val_yr]            NUMERIC (4)     NOT NULL,
    [sequence]               INT             NOT NULL,
    [item_description]       VARCHAR (50)    NULL,
    [prop_id]                INT             NULL,
    [situs]                  VARCHAR (150)   NULL,
    [NRA]                    NUMERIC (14)    NULL,
    [lb_ratio]               NUMERIC (5, 2)  NULL,
    [eff_yr_blt]             NUMERIC (4)     NULL,
    [market]                 NUMERIC (14)    NULL,
    [market_sqft]            NUMERIC (14, 2) NULL,
    [lu_cost]                NUMERIC (14)    NULL,
    [land]                   NUMERIC (14)    NULL,
    [CAPR]                   NUMERIC (5, 2)  NULL,
    [stabilized_market]      NUMERIC (14)    NULL,
    [stabilized_market_sqft] NUMERIC (14, 2) NULL,
    [stabilized_NOI]         NUMERIC (14, 2) NULL,
    CONSTRAINT [CPK_comp_equity_commercial_summary_print] PRIMARY KEY CLUSTERED ([report_type] ASC, [pacs_user_id] ASC, [subject_prop_id] ASC, [prop_val_yr] ASC, [sequence] ASC) WITH (FILLFACTOR = 70)
);


GO


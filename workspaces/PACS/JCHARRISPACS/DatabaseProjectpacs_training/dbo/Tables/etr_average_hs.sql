CREATE TABLE [dbo].[etr_average_hs] (
    [entity_id]                    INT          NOT NULL,
    [sup_yr]                       NUMERIC (4)  NOT NULL,
    [pacs_user_id]                 INT          NOT NULL,
    [curr_yr_hs_count]             NUMERIC (14) NULL,
    [curr_yr_average_market]       NUMERIC (14) NULL,
    [curr_yr_average_hs_exemption] NUMERIC (14) NULL,
    [curr_yr_average_taxable]      NUMERIC (14) NULL,
    [prev_yr_hs_count]             NUMERIC (14) NULL,
    [prev_yr_average_market]       NUMERIC (14) NULL,
    [prev_yr_average_hs_exemption] NUMERIC (14) NULL,
    [prev_yr_average_taxable]      NUMERIC (14) NULL,
    [run_date]                     DATETIME     NULL,
    CONSTRAINT [CPK_etr_average_hs] PRIMARY KEY CLUSTERED ([entity_id] ASC, [sup_yr] ASC, [pacs_user_id] ASC) WITH (FILLFACTOR = 90)
);


GO


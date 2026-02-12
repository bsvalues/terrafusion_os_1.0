CREATE TABLE [dbo].[etr_protest_value] (
    [prop_id]          INT           NOT NULL,
    [prop_sup]         INT           NOT NULL,
    [prop_yr]          NUMERIC (4)   NOT NULL,
    [owner_id]         INT           NOT NULL,
    [entity_id]        INT           NOT NULL,
    [pacs_user_id]     INT           NOT NULL,
    [geo_id]           VARCHAR (50)  NULL,
    [legal_desc]       VARCHAR (255) NULL,
    [prev_yr_market]   NUMERIC (14)  NULL,
    [prev_yr_taxable]  NUMERIC (14)  NULL,
    [prev_yr_ag]       NUMERIC (14)  NULL,
    [prev_yr_exempt]   NUMERIC (14)  NULL,
    [curr_yr_market]   NUMERIC (14)  NULL,
    [curr_yr_taxable]  NUMERIC (14)  NULL,
    [curr_yr_ag]       NUMERIC (14)  NULL,
    [curr_yr_exempt]   NUMERIC (14)  NULL,
    [opinion_of_value] NUMERIC (14)  NULL,
    [protest_value]    NUMERIC (14)  NULL,
    [run_date]         DATETIME      NULL,
    CONSTRAINT [CPK_etr_protest_value] PRIMARY KEY CLUSTERED ([prop_id] ASC, [prop_yr] ASC, [owner_id] ASC, [entity_id] ASC, [pacs_user_id] ASC) WITH (FILLFACTOR = 90)
);


GO


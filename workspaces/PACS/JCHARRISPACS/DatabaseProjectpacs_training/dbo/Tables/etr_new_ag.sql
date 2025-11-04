CREATE TABLE [dbo].[etr_new_ag] (
    [prop_id]             INT           NOT NULL,
    [sup_yr]              NUMERIC (4)   NOT NULL,
    [owner_id]            INT           NOT NULL,
    [entity_id]           INT           NOT NULL,
    [pacs_user_id]        INT           NOT NULL,
    [geo_id]              VARCHAR (50)  NULL,
    [legal_desc]          VARCHAR (255) NULL,
    [curr_yr_prod_use]    NUMERIC (14)  NULL,
    [prev_yr_land_market] NUMERIC (14)  NULL,
    [run_date]            DATETIME      NULL,
    CONSTRAINT [CPK_etr_new_ag] PRIMARY KEY CLUSTERED ([prop_id] ASC, [sup_yr] ASC, [owner_id] ASC, [entity_id] ASC, [pacs_user_id] ASC) WITH (FILLFACTOR = 90)
);


GO


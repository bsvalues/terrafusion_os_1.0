CREATE TABLE [dbo].[market_approach_grid_run] (
    [run_id]                INT           NOT NULL,
    [pacs_user_id]          INT           NOT NULL,
    [date_create]           DATETIME      NOT NULL,
    [date_process]          DATETIME      NULL,
    [date_set_method]       DATETIME      NULL,
    [criteria_text_query]   VARCHAR (MAX) NULL,
    [criteria_text_prop_id] VARCHAR (MAX) NULL,
    [create_new_grid]       BIT           NOT NULL,
    CONSTRAINT [CPK_market_approach_grid_run] PRIMARY KEY CLUSTERED ([run_id] ASC) WITH (FILLFACTOR = 100)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Contains list of Market Approach Grid Maintenance runs', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'market_approach_grid_run';


GO


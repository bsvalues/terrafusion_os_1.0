CREATE TABLE [dbo].[market_approach_grid_run_criteria] (
    [run_id]        INT           NOT NULL,
    [criteria_type] VARCHAR (12)  NOT NULL,
    [criteria_text] VARCHAR (MAX) NOT NULL,
    CONSTRAINT [CPK_market_approach_grid_run_criteria] PRIMARY KEY CLUSTERED ([run_id] ASC, [criteria_type] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_market_approach_grid_run_criteria_run_id] FOREIGN KEY ([run_id]) REFERENCES [dbo].[market_approach_grid_run] ([run_id]) ON DELETE CASCADE
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Contains list of Market Approach Grid Maintenance run criteria', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'market_approach_grid_run_criteria';


GO


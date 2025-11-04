CREATE TABLE [dbo].[comp_search_grid_setting] (
    [setting_id]         INT            NOT NULL,
    [search_field]       INT            NOT NULL,
    [grid_type]          VARCHAR (1)    NOT NULL,
    [selection_criteria] VARCHAR (8000) NOT NULL,
    [end_range]          VARCHAR (23)   NOT NULL,
    CONSTRAINT [CPK_comp_search_grid_setting] PRIMARY KEY CLUSTERED ([setting_id] ASC, [search_field] ASC) WITH (FILLFACTOR = 100)
);


GO


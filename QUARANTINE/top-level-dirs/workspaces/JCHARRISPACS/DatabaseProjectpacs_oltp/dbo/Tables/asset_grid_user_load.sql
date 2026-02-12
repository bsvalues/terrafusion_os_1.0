CREATE TABLE [dbo].[asset_grid_user_load] (
    [pacs_user_id] INT          NOT NULL,
    [config_name]  VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_asset_grid_user_load] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC) WITH (FILLFACTOR = 100)
);


GO


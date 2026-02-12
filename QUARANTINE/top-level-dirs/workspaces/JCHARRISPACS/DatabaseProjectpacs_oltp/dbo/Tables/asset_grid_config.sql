CREATE TABLE [dbo].[asset_grid_config] (
    [config_name]    VARCHAR (50) NOT NULL,
    [seq_num]        INT          NOT NULL,
    [column_num]     INT          NOT NULL,
    [column_width]   INT          NOT NULL,
    [column_visible] BIT          NOT NULL,
    [pacs_user_id]   INT          NOT NULL,
    CONSTRAINT [CPK_asset_grid_config] PRIMARY KEY CLUSTERED ([config_name] ASC, [seq_num] ASC) WITH (FILLFACTOR = 100)
);


GO


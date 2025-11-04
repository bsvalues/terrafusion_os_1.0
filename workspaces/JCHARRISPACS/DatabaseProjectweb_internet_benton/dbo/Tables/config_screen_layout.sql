CREATE TABLE [dbo].[config_screen_layout] (
    [screen_name]   VARCHAR (63)  NOT NULL,
    [table_name]    VARCHAR (127) NOT NULL,
    [column_name]   VARCHAR (127) NOT NULL,
    [display_order] INT           NOT NULL,
    CONSTRAINT [CPK_config_screen_layout] PRIMARY KEY CLUSTERED ([screen_name] ASC, [table_name] ASC, [column_name] ASC) WITH (FILLFACTOR = 90)
);


GO


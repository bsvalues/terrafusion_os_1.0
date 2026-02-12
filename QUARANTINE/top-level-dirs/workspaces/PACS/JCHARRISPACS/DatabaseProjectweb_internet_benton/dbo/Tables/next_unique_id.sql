CREATE TABLE [dbo].[next_unique_id] (
    [id_name]           VARCHAR (63) NOT NULL,
    [id]                BIGINT       NOT NULL,
    [allow_autofix]     BIT          NOT NULL,
    [usage_table]       [sysname]    NOT NULL,
    [usage_column]      [sysname]    NOT NULL,
    [is_custom_autofix] BIT          NOT NULL,
    CONSTRAINT [CPK_next_unique_id] PRIMARY KEY CLUSTERED ([id_name] ASC) WITH (FILLFACTOR = 100)
);


GO


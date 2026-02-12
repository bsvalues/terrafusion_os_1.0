CREATE TABLE [dbo].[next_unique_id] (
    [id_name]           VARCHAR (63) NOT NULL,
    [id]                BIGINT       NOT NULL,
    [allow_autofix]     BIT          CONSTRAINT [CDF_next_unique_id_allow_autofix] DEFAULT ((1)) NOT NULL,
    [usage_table]       [sysname]    NOT NULL,
    [usage_column]      [sysname]    NOT NULL,
    [is_custom_autofix] BIT          CONSTRAINT [CDF_next_unique_id_is_custom_autofix] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_next_unique_id] PRIMARY KEY CLUSTERED ([id_name] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CCK_next_unique_id_id_name] CHECK (NOT [id_name] like '##%'),
    CONSTRAINT [CCK_next_unique_id_ValidDefinition] CHECK ([usage_table]<>'' AND [usage_column]<>'' OR [usage_table]='' AND [usage_column]='')
);


GO


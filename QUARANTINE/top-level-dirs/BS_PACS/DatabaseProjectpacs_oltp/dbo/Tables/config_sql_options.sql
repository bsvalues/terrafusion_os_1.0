CREATE TABLE [dbo].[config_sql_options] (
    [szOptionName]  VARCHAR (64) NOT NULL,
    [szOptionValue] VARCHAR (64) NOT NULL,
    CONSTRAINT [CPK_config_sql_options] PRIMARY KEY CLUSTERED ([szOptionName] ASC) WITH (FILLFACTOR = 100)
);


GO


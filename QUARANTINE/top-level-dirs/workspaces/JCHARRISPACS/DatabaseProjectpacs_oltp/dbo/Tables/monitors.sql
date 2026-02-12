CREATE TABLE [dbo].[monitors] (
    [monitor_id]   INT            IDENTITY (1, 1) NOT NULL,
    [name]         VARCHAR (50)   NOT NULL,
    [query]        VARCHAR (3000) NOT NULL,
    [monitor_type] VARCHAR (50)   NOT NULL,
    [refresh_rate] INT            NOT NULL,
    [disable_sort] INT            NULL,
    CONSTRAINT [CPK_monitors] PRIMARY KEY CLUSTERED ([monitor_id] ASC) WITH (FILLFACTOR = 90)
);


GO


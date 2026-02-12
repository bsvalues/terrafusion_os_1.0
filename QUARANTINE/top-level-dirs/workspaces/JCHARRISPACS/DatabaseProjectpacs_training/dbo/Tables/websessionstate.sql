CREATE TABLE [dbo].[websessionstate] (
    [ID]            UNIQUEIDENTIFIER NOT NULL,
    [Last_Accessed] DATETIME         NOT NULL,
    [Data]          IMAGE            NULL,
    CONSTRAINT [CPK_websessionstate] PRIMARY KEY CLUSTERED ([ID] ASC)
);


GO


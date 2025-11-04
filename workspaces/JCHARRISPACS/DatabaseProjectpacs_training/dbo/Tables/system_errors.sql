CREATE TABLE [dbo].[system_errors] (
    [dataset_id]          BIGINT        IDENTITY (1, 1) NOT NULL,
    [process_description] VARCHAR (255) NOT NULL,
    [date]                DATETIME      NOT NULL,
    [error_message]       VARCHAR (255) NOT NULL,
    CONSTRAINT [CPK_system_errors] PRIMARY KEY CLUSTERED ([dataset_id] ASC) WITH (FILLFACTOR = 100)
);


GO


CREATE TABLE [dbo].[certified_mailer_batch] (
    [certified_mailer_batch_id] INT           IDENTITY (1, 1) NOT NULL,
    [batch_date]                SMALLDATETIME NOT NULL,
    CONSTRAINT [CPK_certified_mailer_batch] PRIMARY KEY CLUSTERED ([certified_mailer_batch_id] ASC) WITH (FILLFACTOR = 100)
);


GO


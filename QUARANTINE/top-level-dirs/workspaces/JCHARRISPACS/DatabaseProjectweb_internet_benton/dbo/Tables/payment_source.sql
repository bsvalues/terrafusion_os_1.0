CREATE TABLE [dbo].[payment_source] (
    [payment_source_id]   INT          NOT NULL,
    [payment_source_cd]   VARCHAR (5)  NULL,
    [payment_source_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_payment_source] PRIMARY KEY CLUSTERED ([payment_source_id] ASC) WITH (FILLFACTOR = 90)
);


GO


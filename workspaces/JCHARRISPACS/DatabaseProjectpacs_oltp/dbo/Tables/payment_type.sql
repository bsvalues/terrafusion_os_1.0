CREATE TABLE [dbo].[payment_type] (
    [payment_cd]   CHAR (5)     NOT NULL,
    [payment_desc] VARCHAR (25) NULL,
    CONSTRAINT [CPK_payment_type] PRIMARY KEY CLUSTERED ([payment_cd] ASC) WITH (FILLFACTOR = 100)
);


GO


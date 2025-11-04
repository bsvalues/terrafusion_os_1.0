CREATE TABLE [dbo].[payment_method] (
    [payment_cd]   CHAR (5)     NOT NULL,
    [payment_desc] VARCHAR (25) NULL,
    CONSTRAINT [CPK_payment_method] PRIMARY KEY CLUSTERED ([payment_cd] ASC) WITH (FILLFACTOR = 100)
);


GO


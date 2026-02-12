CREATE TABLE [dbo].[payment_code] (
    [pay_type_cd]   CHAR (5)        NOT NULL,
    [pay_type_desc] VARCHAR (50)    NULL,
    [pay_type_amt]  NUMERIC (14, 2) NULL,
    CONSTRAINT [CPK_payment_code] PRIMARY KEY CLUSTERED ([pay_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO


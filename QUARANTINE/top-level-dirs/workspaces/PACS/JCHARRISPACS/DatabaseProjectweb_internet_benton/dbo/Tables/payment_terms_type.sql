CREATE TABLE [dbo].[payment_terms_type] (
    [payment_terms_type_cd]   VARCHAR (10) NOT NULL,
    [payment_terms_type_desc] VARCHAR (64) NOT NULL,
    CONSTRAINT [CPK_payment_terms_type] PRIMARY KEY CLUSTERED ([payment_terms_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO


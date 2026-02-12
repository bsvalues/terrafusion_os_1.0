CREATE TABLE [dbo].[tax_statement_forms_maint] (
    [lKey]          INT          IDENTITY (1, 1) NOT NULL,
    [lTaxYr]        NUMERIC (4)  NOT NULL,
    [szDefaultForm] VARCHAR (50) NOT NULL,
    [dtExpire]      DATETIME     NULL,
    CONSTRAINT [CPK_tax_statement_forms_maint] PRIMARY KEY CLUSTERED ([lKey] ASC, [lTaxYr] ASC, [szDefaultForm] ASC)
);


GO


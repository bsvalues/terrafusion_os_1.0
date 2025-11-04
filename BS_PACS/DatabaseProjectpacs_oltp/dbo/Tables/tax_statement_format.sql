CREATE TABLE [dbo].[tax_statement_format] (
    [szDefaultForm] VARCHAR (50) NOT NULL,
    [lSequence]     INT          NOT NULL,
    CONSTRAINT [CPK_tax_statement_format] PRIMARY KEY CLUSTERED ([szDefaultForm] ASC, [lSequence] ASC)
);


GO


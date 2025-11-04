CREATE TABLE [dbo].[wa_tax_statement_option_type] (
    [statement_option]        INT          NOT NULL,
    [statement_option_desc]   VARCHAR (70) NULL,
    [property_statement_type] BIT          NULL,
    PRIMARY KEY CLUSTERED ([statement_option] ASC)
);


GO


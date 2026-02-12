CREATE TABLE [dbo].[wa_tax_statement_print_back_option_type] (
    [print_option]            INT          NOT NULL,
    [print_option_desc]       VARCHAR (70) NULL,
    [property_statement_type] BIT          NULL,
    [tax_statement_type]      BIT          NULL,
    PRIMARY KEY CLUSTERED ([print_option] ASC)
);


GO


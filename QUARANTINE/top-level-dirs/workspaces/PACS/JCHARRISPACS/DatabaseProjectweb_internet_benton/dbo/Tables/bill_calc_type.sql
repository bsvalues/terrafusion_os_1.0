CREATE TABLE [dbo].[bill_calc_type] (
    [bill_calc_type_cd]   VARCHAR (10) NOT NULL,
    [bill_calc_type_desc] VARCHAR (50) NULL,
    [modify_wizard]       BIT          NOT NULL,
    CONSTRAINT [CPK_bill_calc_type] PRIMARY KEY CLUSTERED ([bill_calc_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO


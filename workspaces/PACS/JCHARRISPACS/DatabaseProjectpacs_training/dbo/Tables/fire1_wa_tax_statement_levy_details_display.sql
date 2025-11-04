CREATE TABLE [dbo].[fire1_wa_tax_statement_levy_details_display] (
    [group_id]            INT              NOT NULL,
    [year]                NUMERIC (4)      NOT NULL,
    [run_id]              INT              NOT NULL,
    [statement_id]        INT              NOT NULL,
    [tax_district_id]     INT              NOT NULL,
    [levy_cd]             VARCHAR (10)     NOT NULL,
    [levy_description]    VARCHAR (32)     NOT NULL,
    [voted]               BIT              NOT NULL,
    [levy_rate]           NUMERIC (13, 10) NOT NULL,
    [tax_amount]          NUMERIC (14, 2)  NOT NULL,
    [taxable_value]       NUMERIC (14)     NULL,
    [order_num]           INT              NULL,
    [row_num]             INT              NULL,
    [gross_tax_amount]    NUMERIC (14, 2)  NULL,
    [prior_yr_tax_amount] NUMERIC (14, 2)  NOT NULL
);


GO


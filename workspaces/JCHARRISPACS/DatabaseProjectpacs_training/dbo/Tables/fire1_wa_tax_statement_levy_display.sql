CREATE TABLE [dbo].[fire1_wa_tax_statement_levy_display] (
    [group_id]            INT              NOT NULL,
    [year]                NUMERIC (4)      NOT NULL,
    [run_id]              INT              NOT NULL,
    [statement_id]        INT              NOT NULL,
    [tax_district_id]     INT              NOT NULL,
    [voted]               BIT              NOT NULL,
    [levy_rate]           NUMERIC (13, 10) NOT NULL,
    [tax_amount]          NUMERIC (14, 2)  NOT NULL,
    [order_num]           INT              NULL,
    [taxable_value]       NUMERIC (18)     NULL,
    [levy_cd]             VARCHAR (20)     NOT NULL,
    [levy_description]    VARCHAR (255)    NULL,
    [main]                BIT              NOT NULL,
    [prior_yr_tax_amount] NUMERIC (14, 2)  NOT NULL
);


GO


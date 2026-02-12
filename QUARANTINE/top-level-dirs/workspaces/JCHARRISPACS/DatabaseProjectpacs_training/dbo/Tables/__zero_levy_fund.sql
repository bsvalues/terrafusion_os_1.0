CREATE TABLE [dbo].[__zero_levy_fund] (
    [year]                NUMERIC (4)  NOT NULL,
    [tax_district_id]     INT          NOT NULL,
    [levy_cd]             VARCHAR (10) NOT NULL,
    [fund_id]             INT          NOT NULL,
    [fund_number]         NUMERIC (14) NULL,
    [begin_date]          DATETIME     NULL,
    [end_date]            DATETIME     NULL,
    [fund_description]    VARCHAR (50) NULL,
    [disburse]            BIT          NOT NULL,
    [disburse_acct_id]    INT          NULL,
    [display_fund_number] VARCHAR (10) NULL,
    [annexation_id]       INT          NULL
);


GO


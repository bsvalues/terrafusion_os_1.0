CREATE TABLE [dbo].[fund] (
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
    [display_fund_number] AS           (right('0000000000'+CONVERT([varchar],[fund_number],(0)),(10))),
    [annexation_id]       INT          NULL,
    CONSTRAINT [CPK_fund] PRIMARY KEY CLUSTERED ([year] ASC, [tax_district_id] ASC, [levy_cd] ASC, [fund_id] ASC) WITH (FILLFACTOR = 90)
);


GO

CREATE NONCLUSTERED INDEX [IDX_fund_fund_number]
    ON [dbo].[fund]([fund_number] ASC) WITH (FILLFACTOR = 90);


GO


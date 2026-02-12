CREATE TABLE [dbo].[fire1_fin_event_fund_assoc] (
    [fin_account_id]     INT          NOT NULL,
    [event_cd]           VARCHAR (15) NOT NULL,
    [action]             BIT          NOT NULL,
    [year]               NUMERIC (4)  NOT NULL,
    [tax_district_id]    INT          NOT NULL,
    [levy_cd]            VARCHAR (10) NOT NULL,
    [fund_id]            INT          NOT NULL,
    [is_primary_account] BIT          NULL
);


GO


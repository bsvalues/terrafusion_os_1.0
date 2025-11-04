CREATE TABLE [dbo].[special_assessment] (
    [year]                          NUMERIC (4)     NOT NULL,
    [agency_id]                     INT             NOT NULL,
    [calculate_fee]                 BIT             NOT NULL,
    [flat_fee]                      BIT             NOT NULL,
    [has_additional_fee]            BIT             NOT NULL,
    [has_flat_additional_fee]       BIT             NOT NULL,
    [fee_type_cd]                   VARCHAR (10)    NULL,
    [assessment_fee_amt]            NUMERIC (10, 2) NULL,
    [additional_fee_amt]            NUMERIC (10, 2) NULL,
    [recalculate_during_supplement] BIT             NOT NULL,
    [calc_source]                   IMAGE           NULL,
    [status_cd]                     VARCHAR (10)    NULL,
    [created_date]                  DATETIME        NULL,
    [calculated_date]               DATETIME        NULL,
    [bill_create_date]              DATETIME        NULL,
    [createdby]                     VARCHAR (50)    NULL,
    [calculatedby]                  VARCHAR (50)    NULL,
    [bills_createdby]               VARCHAR (50)    NULL,
    [has_additional_fee_as_percent] BIT             NOT NULL,
    [additional_fee_as_percent]     NUMERIC (10, 2) NULL,
    [disburse]                      BIT             NOT NULL,
    [disburse_acct_id]              INT             NULL,
    [rule_id]                       INT             NULL,
    [import_or_calculate]           BIT             NOT NULL,
    [end_year]                      NUMERIC (4)     NULL,
    CONSTRAINT [CPK_special_assessment] PRIMARY KEY CLUSTERED ([year] ASC, [agency_id] ASC) WITH (FILLFACTOR = 100)
);


GO


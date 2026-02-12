CREATE TABLE [dbo].[fee_type] (
    [fee_type_cd]            VARCHAR (10)    NOT NULL,
    [fee_type_desc]          VARCHAR (60)    NULL,
    [fee_type_amt]           NUMERIC (14, 2) NULL,
    [allow_partial_payments] BIT             NULL,
    [include_on_tax_cert]    BIT             NULL,
    [reet_fee_type]          BIT             NULL,
    [allow_half_pay]         BIT             NOT NULL,
    [technology_fee]         BIT             NOT NULL,
    [state_level]            BIT             NOT NULL,
    [local_level_1]          BIT             NOT NULL,
    [local_level_2]          BIT             NOT NULL,
    [inactive]               BIT             NOT NULL,
    CONSTRAINT [CPK_fee_type] PRIMARY KEY CLUSTERED ([fee_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO


CREATE TABLE [dbo].[wash_ag_rollback_levy_assoc] (
    [ag_rollbk_id]    INT              NOT NULL,
    [year]            INT              NOT NULL,
    [senior]          BIT              NOT NULL,
    [tax_district_id] INT              NOT NULL,
    [levy_cd]         VARCHAR (10)     NOT NULL,
    [levy_rate]       NUMERIC (13, 10) NULL,
    [taxable_val]     NUMERIC (14, 2)  NULL,
    [base_tax_amt]    NUMERIC (14, 2)  NULL,
    [tax_override]    BIT              NULL,
    [year_type]       VARCHAR (1)      CONSTRAINT [CDF_wash_ag_rollback_levy_assoc_year_type] DEFAULT ('') NOT NULL,
    CONSTRAINT [CPK_wash_ag_rollback_levy_assoc] PRIMARY KEY CLUSTERED ([ag_rollbk_id] ASC, [year] ASC, [senior] ASC, [tax_district_id] ASC, [levy_cd] ASC, [year_type] ASC)
);


GO


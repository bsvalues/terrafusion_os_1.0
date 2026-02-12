CREATE TABLE [dbo].[ptd_mt_state_report_entity_tax_limitation] (
    [entity_id]          VARCHAR (10)    NOT NULL,
    [entity_type_cd]     CHAR (5)        NOT NULL,
    [year]               NUMERIC (4)     NOT NULL,
    [as_of_sup_num]      INT             NOT NULL,
    [date]               DATETIME        NULL,
    [ov65_count]         NUMERIC (14)    NULL,
    [ov65_appraised_val] NUMERIC (14)    NULL,
    [freeze_loss]        NUMERIC (14)    NULL,
    [state_amt]          NUMERIC (14)    NULL,
    [local_amt]          NUMERIC (14)    NULL,
    [entity_tax_rate]    NUMERIC (14, 6) NULL,
    [actual_levy]        NUMERIC (14, 2) NULL,
    [dataset_id]         BIGINT          NOT NULL,
    CONSTRAINT [CPK_ptd_mt_state_report_entity_tax_limitation] PRIMARY KEY CLUSTERED ([dataset_id] ASC, [entity_id] ASC, [year] ASC, [as_of_sup_num] ASC) WITH (FILLFACTOR = 100)
);


GO


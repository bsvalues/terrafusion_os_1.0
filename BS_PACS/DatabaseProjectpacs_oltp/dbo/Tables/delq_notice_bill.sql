CREATE TABLE [dbo].[delq_notice_bill] (
    [delq_notice_id]      INT              NOT NULL,
    [bill_id]             INT              NOT NULL,
    [stmnt_id]            INT              NULL,
    [entity_id]           INT              NULL,
    [entity_file_as_name] VARCHAR (50)     NULL,
    [tax_yr]              NUMERIC (4)      NULL,
    [taxable_val]         NUMERIC (18)     NULL,
    [tax_rate]            NUMERIC (13, 10) NULL,
    [base_tax]            NUMERIC (14, 2)  NULL,
    [disc_pi1]            NUMERIC (14, 2)  NULL,
    [attorney_fee1]       NUMERIC (14, 2)  NULL,
    [tax_due1]            NUMERIC (14, 2)  NULL,
    [disc_pi2]            NUMERIC (14, 2)  NULL,
    [attorney_fee2]       NUMERIC (14, 2)  NULL,
    [tax_due2]            NUMERIC (14, 2)  NULL,
    [disc_pi3]            NUMERIC (14, 2)  NULL,
    [attorney_fee3]       NUMERIC (14, 2)  NULL,
    [tax_due3]            NUMERIC (14, 2)  NULL,
    [q_bill]              VARCHAR (1)      NULL,
    [adjustment_code]     VARCHAR (10)     NULL,
    [entity_cd]           CHAR (5)         NULL,
    [prop_id]             INT              NULL,
    [sup_num]             INT              NULL,
    CONSTRAINT [CPK_delq_notice_bill] PRIMARY KEY CLUSTERED ([delq_notice_id] ASC, [bill_id] ASC) WITH (FILLFACTOR = 90)
);


GO


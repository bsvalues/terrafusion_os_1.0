CREATE TABLE [dbo].[delq_roll] (
    [pacs_user_id]      INT             NOT NULL,
    [bill_id]           INT             NOT NULL,
    [entity_id]         INT             NULL,
    [sup_tax_yr]        NUMERIC (4)     NULL,
    [tax_due]           NUMERIC (14, 2) NULL,
    [disc_pi]           NUMERIC (14, 2) NULL,
    [att_fee]           NUMERIC (14, 2) NULL,
    [tax_due1]          NUMERIC (14, 2) NULL,
    [disc_pi1]          NUMERIC (14, 2) NULL,
    [att_fee1]          NUMERIC (14, 2) NULL,
    [tax_due2]          NUMERIC (14, 2) NULL,
    [disc_pi2]          NUMERIC (14, 2) NULL,
    [att_fee2]          NUMERIC (14, 2) NULL,
    [last_payment_date] DATETIME        NULL,
    [last_payment_amt]  NUMERIC (14, 2) NULL,
    [prop_type_cd]      CHAR (5)        NULL,
    [prop_id]           INT             NULL,
    [owner_id]          INT             NULL,
    [stmnt_id]          INT             NULL,
    [adjustment_code]   VARCHAR (10)    NULL,
    [bill_m_n_o]        NUMERIC (14, 2) NULL,
    [bill_i_n_s]        NUMERIC (14, 2) NULL,
    [bill_m_n_o_due]    NUMERIC (14, 2) NULL,
    [bill_i_n_s_due]    NUMERIC (14, 2) NULL,
    CONSTRAINT [CPK_delq_roll] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [bill_id] ASC) WITH (FILLFACTOR = 100)
);


GO


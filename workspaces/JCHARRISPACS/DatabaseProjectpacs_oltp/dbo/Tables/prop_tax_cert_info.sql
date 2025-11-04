CREATE TABLE [dbo].[prop_tax_cert_info] (
    [fee_id]      INT             NOT NULL,
    [tax_cert_id] INT             NOT NULL,
    [prop_id]     INT             NOT NULL,
    [owner_id]    INT             NOT NULL,
    [tax_yr]      NUMERIC (4)     NOT NULL,
    [entity_id]   INT             NOT NULL,
    [entity_cd]   CHAR (5)        NOT NULL,
    [bill_id]     INT             NOT NULL,
    [stmnt_id]    INT             NOT NULL,
    [tax_due]     NUMERIC (14, 2) NULL,
    [disc_pi]     NUMERIC (14, 2) NULL,
    [att_fee]     NUMERIC (14, 2) NULL,
    [tax_due1]    NUMERIC (14, 2) NULL,
    [disc_pi1]    NUMERIC (14, 2) NULL,
    [att_fee1]    NUMERIC (14, 2) NULL,
    [tax_due2]    NUMERIC (14, 2) NULL,
    [disc_pi2]    NUMERIC (14, 2) NULL,
    [att_fee2]    NUMERIC (14, 2) NULL,
    CONSTRAINT [CPK_prop_tax_cert_info] PRIMARY KEY CLUSTERED ([fee_id] ASC, [tax_cert_id] ASC, [prop_id] ASC, [owner_id] ASC, [tax_yr] ASC, [entity_id] ASC, [bill_id] ASC, [stmnt_id] ASC) WITH (FILLFACTOR = 80)
);


GO


CREATE TABLE [dbo].[prop_tax_due] (
    [pacs_user_id] INT             NULL,
    [prop_id]      INT             NULL,
    [owner_id]     INT             NULL,
    [tax_yr]       NUMERIC (4)     NULL,
    [entity_id]    INT             NULL,
    [entity_cd]    CHAR (5)        NULL,
    [bill_id]      INT             NULL,
    [stmnt_id]     INT             NULL,
    [effective_dt] DATETIME        NULL,
    [tax_due]      NUMERIC (14, 2) NULL,
    [disc_pi]      NUMERIC (14, 2) NULL,
    [att_fee]      NUMERIC (14, 2) NULL,
    [tax_due1]     NUMERIC (14, 2) NULL,
    [disc_pi1]     NUMERIC (14, 2) NULL,
    [att_fee1]     NUMERIC (14, 2) NULL,
    [tax_due2]     NUMERIC (14, 2) NULL,
    [disc_pi2]     NUMERIC (14, 2) NULL,
    [att_fee2]     NUMERIC (14, 2) NULL,
    [lKey]         INT             IDENTITY (1, 1) NOT NULL,
    CONSTRAINT [CPK_prop_tax_due] PRIMARY KEY CLUSTERED ([lKey] ASC) WITH (FILLFACTOR = 100)
);


GO


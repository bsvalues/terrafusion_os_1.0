CREATE TABLE [dbo].[monthly_as_of_recap_escrow_tax_cert] (
    [pacs_user_id]   INT             NOT NULL,
    [entity_id]      INT             NOT NULL,
    [tax_cert]       NUMERIC (14, 2) NULL,
    [escrow]         NUMERIC (14, 2) NULL,
    [prior_tax_cert] NUMERIC (14, 2) NULL,
    [prior_escrow]   NUMERIC (14, 2) NULL,
    CONSTRAINT [CPK_monthly_as_of_recap_escrow_tax_cert] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [entity_id] ASC) WITH (FILLFACTOR = 100)
);


GO


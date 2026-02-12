CREATE TABLE [dbo].[fee_tax_cert_assoc] (
    [fee_id]       INT            NOT NULL,
    [prop_id]      INT            NOT NULL,
    [tax_cert_num] INT            NOT NULL,
    [ref_num]      VARCHAR (30)   NULL,
    [effective_dt] DATETIME       NULL,
    [num_copies]   NUMERIC (2)    NULL,
    [comment]      VARCHAR (2048) NULL,
    CONSTRAINT [CPK_fee_tax_cert_assoc] PRIMARY KEY CLUSTERED ([fee_id] ASC, [prop_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_fee_tax_cert_assoc_prop_id] FOREIGN KEY ([prop_id]) REFERENCES [dbo].[property] ([prop_id])
);


GO


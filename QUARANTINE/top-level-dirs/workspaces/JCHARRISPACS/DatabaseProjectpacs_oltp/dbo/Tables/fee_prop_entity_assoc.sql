CREATE TABLE [dbo].[fee_prop_entity_assoc] (
    [fee_id]           INT             NOT NULL,
    [prop_id]          INT             NOT NULL,
    [entity_id]        INT             NOT NULL,
    [entity_amt]       NUMERIC (14, 2) NULL,
    [bill_entity_flag] CHAR (1)        NULL,
    CONSTRAINT [CPK_fee_prop_entity_assoc] PRIMARY KEY CLUSTERED ([fee_id] ASC, [prop_id] ASC, [entity_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_fee_prop_entity_assoc_fee_id_prop_id] FOREIGN KEY ([fee_id], [prop_id]) REFERENCES [dbo].[fee_tax_cert_assoc] ([fee_id], [prop_id])
);


GO


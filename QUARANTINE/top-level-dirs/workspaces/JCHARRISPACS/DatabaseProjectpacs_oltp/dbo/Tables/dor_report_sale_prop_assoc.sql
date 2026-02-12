CREATE TABLE [dbo].[dor_report_sale_prop_assoc] (
    [dataset_id]      INT         NOT NULL,
    [chg_of_owner_id] INT         NOT NULL,
    [year]            NUMERIC (4) NOT NULL,
    [sup_num]         INT         NOT NULL,
    [prop_id]         INT         NOT NULL,
    CONSTRAINT [CPK_dor_report_sale_prop_assoc] PRIMARY KEY CLUSTERED ([dataset_id] ASC, [chg_of_owner_id] ASC, [year] ASC, [sup_num] ASC, [prop_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_dor_report_sale_prop_assoc_dataset_id_chg_of_owner_id] FOREIGN KEY ([dataset_id], [chg_of_owner_id]) REFERENCES [dbo].[dor_report_sale] ([dataset_id], [chg_of_owner_id]) ON DELETE CASCADE
);


GO


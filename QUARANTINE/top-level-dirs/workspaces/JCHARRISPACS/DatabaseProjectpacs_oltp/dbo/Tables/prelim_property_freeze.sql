CREATE TABLE [dbo].[prelim_property_freeze] (
    [prop_id]               INT             NOT NULL,
    [owner_id]              INT             NOT NULL,
    [exmpt_tax_yr]          NUMERIC (4)     NOT NULL,
    [owner_tax_yr]          NUMERIC (4)     NOT NULL,
    [sup_num]               INT             NOT NULL,
    [entity_id]             INT             NOT NULL,
    [exmpt_type_cd]         VARCHAR (10)    NOT NULL,
    [use_freeze]            CHAR (1)        NULL,
    [transfer_dt]           DATETIME        NULL,
    [prev_tax_due]          NUMERIC (14, 2) NULL,
    [prev_tax_nofrz]        NUMERIC (14, 2) NULL,
    [freeze_yr]             NUMERIC (4)     NULL,
    [freeze_ceiling]        NUMERIC (14, 2) NULL,
    [transfer_pct]          NUMERIC (9, 6)  NULL,
    [transfer_pct_override] CHAR (1)        NULL,
    [pacs_freeze]           CHAR (1)        NULL,
    [pacs_freeze_date]      DATETIME        NULL,
    [pacs_freeze_ceiling]   NUMERIC (14, 2) NULL,
    [pacs_freeze_run]       INT             NULL,
    [freeze_override]       BIT             CONSTRAINT [CDF_prelim_property_freeze_freeze_override] DEFAULT (0) NOT NULL,
    CONSTRAINT [CPK_prelim_property_freeze] PRIMARY KEY CLUSTERED ([exmpt_tax_yr] ASC, [owner_tax_yr] ASC, [sup_num] ASC, [prop_id] ASC, [owner_id] ASC, [entity_id] ASC, [exmpt_type_cd] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_prelim_property_freeze_entity_id] FOREIGN KEY ([entity_id]) REFERENCES [dbo].[entity] ([entity_id]),
    CONSTRAINT [CFK_prelim_property_freeze_entity_id_exmpt_tax_yr_exmpt_type_cd] FOREIGN KEY ([entity_id], [exmpt_tax_yr], [exmpt_type_cd]) REFERENCES [dbo].[entity_exmpt] ([entity_id], [exmpt_tax_yr], [exmpt_type_cd]),
    CONSTRAINT [CFK_prelim_property_freeze_exmpt_tax_yr_sup_num_prop_id_entity_id] FOREIGN KEY ([exmpt_tax_yr], [sup_num], [prop_id], [entity_id]) REFERENCES [dbo].[entity_prop_assoc] ([tax_yr], [sup_num], [prop_id], [entity_id]) ON DELETE CASCADE,
    CONSTRAINT [CFK_prelim_property_freeze_exmpt_type_cd] FOREIGN KEY ([exmpt_type_cd]) REFERENCES [dbo].[exmpt_type] ([exmpt_type_cd])
);


GO


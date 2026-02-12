CREATE TABLE [dbo].[income_land_detail_assoc] (
    [income_yr]   NUMERIC (4)  NOT NULL,
    [sup_num]     INT          NOT NULL,
    [sale_id]     AS           ((0)) PERSISTED NOT NULL,
    [income_id]   INT          NOT NULL,
    [prop_id]     INT          NOT NULL,
    [land_seg_id] INT          NOT NULL,
    [included]    BIT          CONSTRAINT [CDF_income_land_detail_assoc_included] DEFAULT ((0)) NOT NULL,
    [value]       NUMERIC (14) CONSTRAINT [CDF_income_land_detail_assoc_value] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_income_land_detail_assoc] PRIMARY KEY CLUSTERED ([income_yr] ASC, [sup_num] ASC, [income_id] ASC, [prop_id] ASC, [land_seg_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_income_land_detail_assoc_income] FOREIGN KEY ([income_yr], [sup_num], [income_id]) REFERENCES [dbo].[income] ([income_yr], [sup_num], [income_id]) ON DELETE CASCADE,
    CONSTRAINT [CFK_income_land_detail_assoc_land_detail] FOREIGN KEY ([income_yr], [sup_num], [sale_id], [prop_id], [land_seg_id]) REFERENCES [dbo].[land_detail] ([prop_val_yr], [sup_num], [sale_id], [prop_id], [land_seg_id]) ON DELETE CASCADE
);


GO

CREATE NONCLUSTERED INDEX [idx_income_yr_sup_num_prop_id]
    ON [dbo].[income_land_detail_assoc]([income_yr] ASC, [sup_num] ASC, [prop_id] ASC) WITH (FILLFACTOR = 90);


GO


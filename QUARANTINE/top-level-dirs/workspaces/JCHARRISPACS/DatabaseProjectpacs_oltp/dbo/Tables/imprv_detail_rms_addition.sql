CREATE TABLE [dbo].[imprv_detail_rms_addition] (
    [prop_val_yr]                NUMERIC (4)     NOT NULL,
    [sup_num]                    INT             NOT NULL,
    [sale_id]                    INT             NOT NULL,
    [prop_id]                    INT             NOT NULL,
    [imprv_id]                   INT             NOT NULL,
    [imprv_det_id]               INT             NOT NULL,
    [pacs_addition_id]           INT             NOT NULL,
    [tsRowVersion]               ROWVERSION      NOT NULL,
    [AdditionTypeID]             INT             NOT NULL,
    [AdditionDesc]               VARCHAR (255)   NOT NULL,
    [Units]                      INT             NOT NULL,
    [CostValue]                  NUMERIC (18, 2) NOT NULL,
    [UseLocalMultiplier]         BIT             NOT NULL,
    [ApplyTrend]                 BIT             NOT NULL,
    [DeprPct]                    NUMERIC (5, 2)  NOT NULL,
    [DeprOverride]               BIT             NOT NULL,
    [EffectiveYearBuilt]         INT             NOT NULL,
    [EffectiveYearBuiltOverride] BIT             NOT NULL,
    [TypicalLife]                INT             NOT NULL,
    [TypicalLifeOverride]        BIT             NOT NULL,
    [BaseDate]                   DATETIME        NULL,
    [AdditionValueRCN]           INT             NOT NULL,
    [AdditionValueRCNLD]         INT             NOT NULL,
    CONSTRAINT [CPK_imprv_detail_rms_addition] PRIMARY KEY CLUSTERED ([prop_val_yr] ASC, [sup_num] ASC, [sale_id] ASC, [prop_id] ASC, [imprv_id] ASC, [imprv_det_id] ASC, [pacs_addition_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CCK_imprv_detail_rms_addition_Percentages] CHECK ([DeprPct]>=(0) AND [DeprPct]<=(100)),
    CONSTRAINT [CFK_imprv_detail_rms_addition_prop_val_yr_sup_num_sale_id_prop_id_imprv_id_imprv_det_id] FOREIGN KEY ([prop_val_yr], [sup_num], [sale_id], [prop_id], [imprv_id], [imprv_det_id]) REFERENCES [dbo].[imprv_detail_rms_estimate] ([prop_val_yr], [sup_num], [sale_id], [prop_id], [imprv_id], [imprv_det_id]) ON DELETE CASCADE
);


GO


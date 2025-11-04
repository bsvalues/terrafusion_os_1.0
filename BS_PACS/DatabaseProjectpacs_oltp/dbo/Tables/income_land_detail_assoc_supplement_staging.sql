CREATE TABLE [dbo].[income_land_detail_assoc_supplement_staging] (
    [income_yr]   NUMERIC (4)  NOT NULL,
    [sup_num]     INT          NOT NULL,
    [sale_id]     AS           ((0)) PERSISTED NOT NULL,
    [income_id]   INT          NOT NULL,
    [prop_id]     INT          NOT NULL,
    [land_seg_id] INT          NOT NULL,
    [included]    BIT          NOT NULL,
    [value]       NUMERIC (14) NOT NULL
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'temporary placeholder for ILDA data when moving between supplements', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'income_land_detail_assoc_supplement_staging';


GO


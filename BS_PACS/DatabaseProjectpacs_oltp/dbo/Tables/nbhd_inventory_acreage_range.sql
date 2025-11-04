CREATE TABLE [dbo].[nbhd_inventory_acreage_range] (
    [range_id]  INT             NOT NULL,
    [min_value] NUMERIC (18, 4) NOT NULL,
    [max_value] NUMERIC (18, 4) NOT NULL,
    PRIMARY KEY CLUSTERED ([range_id] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Stratification settings for NBHD Acreage Range report', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'nbhd_inventory_acreage_range';


GO




Create view [dbo].[__totalval] as

select distinct prop_id, prop_val_yr, land_hstd_val + land_non_hstd_val as land_val,
imprv_hstd_val + imprv_non_hstd_val as imprv_val

from property_val

GO



create procedure ComparableGridSelectCommercialOptions
	@lTempPropGridID int
as

	select
		convert(bit, case when cSystemBPP = 'T' then 1 else 0 end),
		isnull(lBPPValue, 0),
		isnull(lOGBValue, 0)
	from comp_sales_temp_corp_grid_options with(nolock)
	where lTempPropGridID = @lTempPropGridID

GO


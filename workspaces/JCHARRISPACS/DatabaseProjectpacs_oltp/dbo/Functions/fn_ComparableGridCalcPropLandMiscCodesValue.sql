
CREATE FUNCTION dbo.fn_ComparableGridCalcPropLandMiscCodesValue(
	@Year Numeric(4,0),
	@PropID Int,
	@SupNum Int
)
RETURNS Decimal(28,2)
WITH SCHEMABINDING
AS
BEGIN
  Declare @PropLandMiscCodesValue Decimal(28,2);

	if('T' = (select szConfigValue
						from dbo.pacs_config
						where (			('Land' = szGroup)
										and ('Miscellaneous Code' = szConfigName)
									)
						)
		)
			Set @PropLandMiscCodesValue =		IsNull(
																			( 
																				select 																	
																					Sum(IsNull(ld.misc_value, 0)) as PropLandMiscCodesValue
																				from dbo.land_detail as ld with(nolock)
																				where (			(ld.sale_id = 0)
																								and (ld.prop_val_yr = @Year)
																								and (ld.sup_num = @SupNum) 
																								and (ld.prop_id = @PropID)
																							)
																			), 0);


	--It should be expected that the value may be uninitialized
		--It is left uninitialized either if it impossible to calc it 
		--or if the configuration disables the calculation
	return @PropLandMiscCodesValue; 
end

GO



CREATE FUNCTION [dbo].[fn_GetREETRateTaxAreas] (
  @reet_rate_id int,
  @use_area_number int
)
RETURNS varchar(1000)
AS
BEGIN
  declare @output_values varchar(1000), @delimiter varchar(2)
  set @output_values = ''
  set @delimiter = ', '

  select @output_values = @output_values + @delimiter +
    (case when @use_area_number = 1 then ta.tax_area_number else cast(ta.tax_area_id as varchar(23)) end)
  from tax_area_reet_rate_assoc tarra with (nolock)
    join tax_area ta with (nolock) on ta.tax_area_id = tarra.tax_area_id
  where tarra.reet_rate_id = @reet_rate_id

  if @output_values <> ''
    set @output_values = Right(@output_values, Len(@output_values) - Len(@delimiter))

  return LTRIM(@output_values)
END

GO


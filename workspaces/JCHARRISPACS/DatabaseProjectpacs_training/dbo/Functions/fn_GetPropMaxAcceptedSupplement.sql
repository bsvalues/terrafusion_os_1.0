
CREATE FUNCTION [dbo].[fn_GetPropMaxAcceptedSupplement] ( 
	@input_prop_id int,
	@input_year int)
RETURNS int
AS
BEGIN
	DECLARE @maxSupNum int
	
	SELECT @maxSupNum = max(pv.sup_num)
	FROM property_val as pv with(nolock)
	JOIN supplement as s with(nolock)
	ON pv.sup_num = s.sup_num
	AND pv.prop_val_yr = s.sup_tax_yr
	JOIN sup_group as sg with(nolock)
	ON sg.sup_group_id = s.sup_group_id
	WHERE pv.prop_id = @input_prop_id
	AND pv.prop_val_yr = @input_year
	AND isnull(sg.sup_accept_dt,'') <> ''

	RETURN @maxSupNum
END

GO


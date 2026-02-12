
CREATE FUNCTION [dbo].[fn_GetTotalImpDetNewVal] 
(
    @input_prop_id int,
    @input_year int,
    @input_sup_num int
) 
RETURNS varchar(max) 
AS 
BEGIN 
    declare @output varchar(max) 
    select @output = sum(new_value)
    from imprv_detail
    where prop_id = @input_prop_id 
    and prop_val_yr = @input_year
    and sup_num = @input_sup_num
    and sale_id = 0
    group by prop_id
 
    return (@output) 
END

GO


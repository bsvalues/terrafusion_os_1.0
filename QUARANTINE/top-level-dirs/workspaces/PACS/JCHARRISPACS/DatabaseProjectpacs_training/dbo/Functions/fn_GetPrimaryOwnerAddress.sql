CREATE FUNCTION [dbo].[fn_GetPrimaryOwnerAddress] 
(
    @input_owner_id int,
    @input_year int,
    @input_sup_num int
) 
RETURNS varchar(max) 
AS 
BEGIN 
    declare @output varchar(max) 
    select @output =
	CONCAT(RTRIM(LTRIM(ad.addr_line1))+'  ',RTRIM(LTRIM(ad.addr_line2))+'  ',RTRIM(LTRIM(ad.addr_line3))+'  ',RTRIM(LTRIM(ad.addr_city)) + 
	',  ',RTRIM(LTRIM(ad.addr_state)) +' ',RTRIM(LTRIM(ad.addr_zip)))
    from [OWNER] as o
    
    inner join [address] as ad with (nolock)
		on o.owner_id = ad.acct_id
    
    where o.owner_id = @input_owner_id 
    and o.owner_tax_yr = @input_year
    and o.sup_num = @input_sup_num
    and ad.primary_addr = 'Y'
 
    return (@output) 
END

GO


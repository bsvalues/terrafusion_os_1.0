
CREATE FUNCTION dbo.fn_PA_GetFileAsName_CommaDelimited(@chg_of_owner_id int, @Type char(1),@prop_id int = NULL)
RETURNS VARCHAR(1000) AS

-- function returns comma separated list of buyer,seller, or owner names for request
-- prop_id is required if type request is for seller names or owner names
BEGIN
   DECLARE @FileName varchar(1000)

IF @Type = 'B' -- get buyer names
   begin
      select 
       @FileName = COALESCE(@FileName + ', ', '') + b.buyer
               
      from 
           _PA_buyers as b with(nolock)  -- pk cluster chg_of_owner_id, buyer_id
        where b.chg_of_owner_id = @chg_of_owner_id


   end

IF @Type = 'S' -- get seller names
   begin
      select 
       @FileName = COALESCE(@FileName + ', ', '') + s.seller
      from _PA_sellers as s with(nolock)  
     where s.chg_of_owner_id = @chg_of_owner_id 
       and s.prop_id = @prop_id
    end

IF @Type = 'O' -- get owner names
   begin
      select 
       @FileName = COALESCE(@FileName + ', ', '') + o.owner_name
      from _PA_owners as o with(nolock)  
     where o.prop_id = @prop_id
    end

   RETURN @FileName
END

GO


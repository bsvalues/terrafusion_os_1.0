
CREATE PROCEDURE ReportPersonalPropRendFillBlanks
	@prop_id   int = null,	
	@SPID int = null,
	@FirstPageNItems int,
	@LastPageNItems int , 
 	@MiddlePageNItems int 

AS
 
DECLARE @nItemsCount as int 
DECLARE @lastPageTotal as int 
DECLARE @startCounterAt as int  
DECLARE @tempInt as int 
select @nItemsCount = count(session_id) FROM ##pers_prop_rend_work where session_id = @SPID  
select @tempInt = @MiddlePageNItems - ((@MiddlePageNItems-@FirstPageNItems)+(@MiddlePageNItems-@LastPageNItems))  
if  @nItemsCount <= @tempInt  
BEGIN       
	select @lastPageTotal = @tempInt       
	select @startCounterAt = @nItemsCount  
END 
ELSE --in this case we need to complete for the first page and the last page
IF  @nItemsCount < @FirstPageNItems 	
BEGIN  		
	select @lastPageTotal = (@FirstPageNItems - @nItemsCount) + @LastPageNItems 
	select @startCounterAt =  0 	
END   	 
ELSE if (@nItemsCount <= (@LastPageNItems+@FirstPageNItems) ) 	
BEGIN 	    
	select @lastPageTotal = @FirstPageNItems + @LastPageNItems             
	select @startCounterAt =  @nItemsCount 	
END 
ELSE IF (@nItemsCount > @FirstPageNItems+@LastPageNItems )      	
BEGIN 	--complete for the middle page and the last page
	--1-Leave first page full 
	select @nItemsCount = @nItemsCount - @FirstPageNItems
	--2-how many items do we have left after filling all the
	--  middle pages?.
	DECLARE @leftovers as int
	SELECT @leftovers = @nItemsCount%@MiddlePageNItems
	if @leftovers <= @LastPageNItems
        BEGIN
		select @lastPageTotal = @LastPageNItems - @leftovers
		select @startCounterAt = 0 		
	END
	ELSE
	BEGIN--complete for middle page and last page
	 	select @lastPageTotal = (@MiddlePageNItems-@leftovers) + @LastPageNItems
		select @startCounterAt = 0 	
	END	
END  
while (@startCounterAt < @lastPageTotal) 
BEGIN 	
	INSERT ##pers_prop_rend_work VALUES (@SPID,@prop_id,'','', NULL, NULL, 1000 )  	
	select @startCounterAt = @startCounterAt + 1 
END

GO


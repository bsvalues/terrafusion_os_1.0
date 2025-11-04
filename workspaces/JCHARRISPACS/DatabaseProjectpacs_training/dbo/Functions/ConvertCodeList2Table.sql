
Create FUNCTION ConvertCodeList2Table(
	@CodeList xml
) 
RETURNS TABLE
AS
RETURN 
(	
	SELECT 
	 Code = cast(Item.value('@val', 'VarChar(500)')as VarChar(500))
	from @CodeList.nodes('/Root/Cd') as Rs(Item)
);

GO


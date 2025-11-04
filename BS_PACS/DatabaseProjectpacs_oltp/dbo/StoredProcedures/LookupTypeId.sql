
CREATE PROCEDURE [dbo].[LookupTypeId]	@TypeFullName				nvarchar(128)
										,@AssemblyFullName			nvarchar(256)
										,@TypeId					int OUTPUT
AS
 BEGIN
	SET NOCOUNT ON

	SELECT 	@TypeId = [TypeId]
	FROM	[dbo].[Type]
	WHERE	[TypeFullName] = @TypeFullName
	AND		[AssemblyFullName] = @AssemblyFullName

 END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[LookupTypeId] TO [tracking_reader]
    AS [dbo];


GO


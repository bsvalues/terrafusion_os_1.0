

-----------------------------------------------------------------------------
-- Procedure: GetUniqueIDRS
--
-- Purpose: Get a named unique id
-----------------------------------------------------------------------------
CREATE PROCEDURE GetUniqueIDRS
	@name varchar(63),
	@idCount int = 1
AS

declare @IID bigint
exec dbo.GetUniqueID @name, @IID output, @idCount, 1

GO


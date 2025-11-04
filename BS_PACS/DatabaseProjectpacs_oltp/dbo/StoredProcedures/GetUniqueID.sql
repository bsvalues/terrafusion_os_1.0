

-----------------------------------------------------------------------------
-- Procedure: GetUniqueID
--
-- Purpose: Get a named unique id
-----------------------------------------------------------------------------
CREATE PROCEDURE GetUniqueID
	@name varchar(63),
	@IID bigint output,
	@idCount int = 1,
	@bOutputRS bit = 0
AS
SET NOCOUNT ON

if (db_name(db_id()) <> 'master')
begin
	if not exists (
		select *
		from next_unique_id with(nolock)
		where id_name = @name
	)
	begin
		-- Row not in the pacs database ; it must be a global ID
		declare @retVal int
		exec @retVal = master.dbo.GetUniqueID @name, @IID output, @idCount, @bOutputRS
		return @retVal
	end
end

if(@idCount < 1)
begin
	RAISERROR('GetUniqueID::Number of IDs to be reserved, @idCount, is incorrect. It must be greater than zero.', 16, 0);
	return;
end

begin transaction

select @IID = ID
from next_unique_id with(rowlock, holdlock, updlock)
where id_name = @name

update next_unique_id with(rowlock, holdlock)
set ID = @IID + @idCount
where id_name = @name

commit transaction

set nocount off

if ( @bOutputRS = 1 )
	select IID = @IID

GO


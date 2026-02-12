


-----------------------------------------------------------------------------
-- Procedure: GetUniqueObjectID
--
-- Purpose: Get a named unique id
-----------------------------------------------------------------------------
CREATE PROCEDURE GetUniqueObjectID
	@name varchar(32),
	@files_per_dir int = 1000
AS
SET NOCOUNT ON

declare	@IID int 
declare	@SUB_DIR int 
declare	@BASE_DIR varchar(255) 
declare @NEW_DIR int

set @NEW_DIR=0

begin transaction


select @IID = next_object_id,@SUB_DIR=sub_dir,@BASE_DIR=base_dir
from pacs_objects with(rowlock, holdlock, updlock)
where type = @name
if @SUB_DIR%@files_per_dir = 0
begin
	set @SUB_DIR=@SUB_DIR+1
	set @NEW_DIR=1
end

update pacs_objects with(rowlock, holdlock)
set next_object_id = @IID + 1,sub_dir=@SUB_DIR
where type = @name

commit transaction

select  @IID as IID,@SUB_DIR as sub_dir,@BASE_DIR as base_dir, @NEW_DIR as new_dir

GO


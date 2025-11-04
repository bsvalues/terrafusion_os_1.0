

CREATE PROCEDURE dbo.sp_DeleteMetaComponentLevel
           @component_level_id int 
AS 
SET NOCOUNT ON
/***********************************************************
Parameter description:
@component_level_id: value of row to be deleted
*/

-- verify that this id exists:
IF NOT EXISTS(SELECT 1 FROM dbo.meta_component_level 
                WHERE component_level_id = @component_level_id)
   begin
       print object_name(@@procid) + ': @component_level_id '
        + convert(varchar(30),@component_level_id )
        + ' is not in table, delete bypassed'
       return
   end

declare @component_type int
declare @component_id int
declare @parent_level int
declare @modified_display_order int

-- retrieve parent and component type info for re-order proc
select @parent_level = parent_level
      ,@component_id = component_id
  from dbo.meta_component_level
   where component_level_id = @component_level_id

if @component_id IS NULL
   set @component_type = NULL
else
   set @component_type = (select component_type from dbo.meta_component 
                             where component_id = @component_id )
 


-- now delete the requested entry
delete from dbo.meta_component_level 
   where component_level_id = @component_level_id

-- make sure existing display_order values within this parent_level
-- and component_type are in ascending order starting from zero
-- by calling the reorder proc with -1 display order
exec dbo.sp_ReOrderMetaComponentLevel -1,@parent_level,@component_type,
                                         @modified_display_order OUTPUT


-- need to add recursive delete for each entry that has this 
-- record as a parent_level id
-- delete any entries that have the passed id as a parent
declare @cl_id int
declare cparent CURSOR LOCAL FAST_FORWARD
for
   select component_level_id from dbo.meta_component_level 
     where parent_level = @component_level_id
for read only

	open cparent
	fetch next from cparent into @cl_id 

	/* For each index */
	while @@fetch_status = 0
	  begin
        exec dbo.sp_DeleteMetaComponentLevel @cl_id
        fetch next from cparent into @cl_id
      end

close cparent
deallocate cparent

GO


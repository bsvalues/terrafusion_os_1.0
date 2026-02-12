
CREATE PROCEDURE dbo.sp_ReOrderExistingMetaComponentLevel
 @in_display_order int
,@current_display_order int
,@parent_level  int
,@component_type  int
,@in_component_level_id int
,@parent_or_type_changed bit
,@modified_display_order int OUTPUT

AS
-- call to update an existing records display order
-- within a given parent_level/component_type
-- @in_component_level_id is the entry being updated
-- @in_display_order is order requested for this id
-- this procedure will bump display orders for surrounding records


declare @component_level_id int
declare @rec_count int
declare @max_display_order int
declare @cur_display_order int
declare @display_order int
declare @update_order int

-- determine how many records are in this parent/type combination
SELECT @rec_count = count(*)
  from  dbo.fn_Return_meta_component_level_parent_type_entries(@parent_level,@component_type)

-- since display order starts at 0, subtract 1 from the record count
-- to get the maximum display order value for current record set
set @max_display_order = @rec_count - 1
if @max_display_order < 0 -- no records were found
   set @max_display_order = 0

-- if display_order being inserted is greater than
-- current maximimum, reset passed value
if @in_display_order > @max_display_order 
   begin
     set @modified_display_order = @max_display_order 
     set @in_display_order = @modified_display_order
     -- in value is greater than record count, no records 
     -- need to be bumped
     return
   end
else -- set modified value to passed value
   set @modified_display_order = @in_display_order

-- set starting point for updates - updates in descending order
IF @in_display_order = @max_display_order /*updated record is max display val*/
   set @display_order = @max_display_order -1 /*start reorder one less than max*/
else   
   set @display_order = @max_display_order 

declare cOrder cursor FAST_FORWARD
for
  /*loop thru all records except record that was updated*/
   select component_level_id,display_order
       from  dbo.fn_Return_meta_component_level_parent_type_entries(@parent_level,@component_type)
       WHERE component_level_id <> @in_component_level_id
    order by display_order desc

open cOrder
  fetch next from cOrder into @component_level_id,@cur_display_order
   
while ( @@fetch_status = 0 )
begin
   -- skip display order for record being updated
   if @display_order = @in_display_order
      set @display_order = @display_order - 1
      
   set @update_order = @display_order

/*assumption: if entry being changed had a display value of zero
then a current entry with a display_order of 1 will be the new zero
within same parent/type combination*/
   if @parent_or_type_changed = 0 /*did not change*/
      if @current_display_order = 0 -- entry being changed was zero
         if @cur_display_order = 1 -- this will be new zero
            set @update_order = 0		
	        
   UPDATE dbo.meta_component_level
      SET display_order = @update_order 
    WHERE component_level_id = @component_level_id


  set @display_order = @display_order - 1
     
  fetch next from cOrder into @component_level_id,@cur_display_order

end

close cOrder
deallocate cOrder

GO


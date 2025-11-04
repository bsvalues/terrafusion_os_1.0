
CREATE PROCEDURE dbo.sp_ReOrderMetaComponentLevel 
 @display_order int
,@parent_level  int
,@component_type  int
,@modified_display_order int OUTPUT

AS
-- call with -1 display_order value to resort all existing entries
-- within a given parent_level/component_type

declare @component_level_id int
declare @rec_count int
declare @max_display_order int

-- create temp table to process on
SELECT mcl.component_level_id,mcl.display_order
      ,ISNULL(mcl.parent_level,-1) as parent_level
      ,component_type =(SELECT component_type FROM meta_component mc WHERE mc.component_id = mcl.component_id)
INTO #tmp
from dbo.meta_component_level mcl

SELECT @rec_count = count(*)
from #tmp
where ISNULL(parent_level,-1) = ISNULL(@parent_level,-1)
and  ISNULL(component_type,-1) = ISNULL(@component_type,-1)

-- since display order starts at 0, subtract 1 from the record count
-- to get the maximum display order value for current record set
set @max_display_order = @rec_count - 1
if @max_display_order < 0 -- no records were found
   set @max_display_order = 0

-- if display_order being inserted is more than 1 greater than
-- current maximimum, reset passed value
if @display_order > @max_display_order + 1
   begin
     set @modified_display_order = @max_display_order + 1
     set @display_order = @modified_display_order
   end
else -- set modified value to passed value
   set @modified_display_order = @display_order


declare cOrder cursor FAST_FORWARD
for
   select component_level_id
     from #tmp
    where ISNULL(parent_level,-1) = ISNULL(@parent_level,-1)
      and  ISNULL(component_type,-1) = ISNULL(@component_type,-1)
      and display_order >= @display_order
    order by display_order

open cOrder
  fetch next from cOrder into @component_level_id
   
while ( @@fetch_status = 0 )
begin
        set @display_order = @display_order + 1
        UPDATE dbo.meta_component_level
           SET display_order = @display_order 
         WHERE component_level_id = @component_level_id

        fetch next from cOrder into @component_level_id

end

close cOrder
deallocate cOrder

GO


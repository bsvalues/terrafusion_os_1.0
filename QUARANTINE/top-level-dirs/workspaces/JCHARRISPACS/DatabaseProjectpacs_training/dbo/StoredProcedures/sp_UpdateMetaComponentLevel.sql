

CREATE PROCEDURE dbo.sp_UpdateMetaComponentLevel 
            @component_level_id int
           ,@component_type  int 
           ,@component_verb int  
           ,@display_text  varchar(50) 
           ,@display_order  int
           ,@parent_level  int 
           ,@description  varchar(255) 

AS 
SET NOCOUNT ON
-- NOTE: call proc sp_MetaComponentLevel_GenerateUpdateSQL with 
-- component_level_id value to generate the execution sql
-- for this procedure. SQL generated will be current values
-- for the component_level_id value
-- modify generated sql for your update needs
-- NOTE:this procedure will update all values based on parameter values
-- so make sure the parameters are correct for all fields, not just
-- one that might be changing.
/***********************************************************
Parameter description:
@component_type : pass NULL for top of hierarchy; otherwise,valid type
                  from meta_component table
                  0=display in main application menu
                  1=display in search band
@component_verb : pass component_verb from meta_component table
 -- NOTE: if @component_type and @component_verb are null, this is not
          an action item entry, just for navigation.
          if @component_type and @component_verb are not nulll, but 
          do not have a corresponding entry in the meta_component table,
          an entry will be added for this combination. 
@display_text   : display value
@display_order  : pass display order within parent/component
 NOTE: use value that you want it to appear, do not base it on any current
       values in the display_order field. For first entry - value is 0
@parent_level   : component_level_id of parent;NULL if this is top of hierarchy
@description    : optional description value

OUTPUT Parm: 
@component_level_id: -1 = component_type is null but component_verb has value
          -2 = component_verb is null but component_type has value
*/

-- verify that this id exists:
IF NOT EXISTS(SELECT 1 FROM dbo.meta_component_level 
                WHERE component_level_id = @component_level_id)
   begin
       print object_name(@@procid) + ': @component_level_id '
        + convert(varchar(30),@component_level_id )
        + ' is not in table, update bypassed'
       return
   end

declare @component_id int
declare @modified_display_order int
declare @parent_or_type_changed bit


-- retrieve existing information for this record 
declare    @cur_component_id int
           ,@cur_component_type  int 
           ,@cur_component_verb int 
           ,@cur_display_text  varchar(50) 
           ,@cur_display_order  int 
           ,@cur_parent_level  int 



select @cur_parent_level = parent_level
      ,@cur_component_id = component_id
      ,@cur_display_text = display_text
      ,@cur_display_order = display_order
      ,@cur_parent_level = parent_level
  from dbo.meta_component_level
   where component_level_id = @component_level_id


if @cur_component_id IS NULL
   begin
     set @cur_component_type = NULL
     set @cur_component_verb = NULL
   end
else
   begin
     select @cur_component_type = component_type 
           ,@cur_component_verb = component_verb
       from dbo.meta_component 
      where component_id = @cur_component_id 
   end

--********end retrieve current info ****
-- set flag if parent_level or component_type value changed
-- used in display reorder procedures
if (ISNULL(@cur_parent_level,-1) <> ISNULL(@parent_level,-1))
   or (ISNULL(@cur_component_type,-1) <> ISNULL(@component_type,-1))
   set @parent_or_type_changed = 1
ELSE
   set @parent_or_type_changed = 0
   
   
-- check parameter values

if @cur_display_order <> ISNULL(@display_order,-1)
   begin -- display order changed, check for valid values
	if ISNULL(@display_order,-1) < 0 
	   begin
		 print object_name(@@procid) + ': display_order value must be greater than or equal to zero'
		 return
	   end
   end

if LEN(ISNULL(@display_text,'')) = 0 
   begin
	 print object_name(@@procid) + ': display_text value is required'
	 return
   end

-- see if parent_level passed is valid
IF @parent_level IS NOT NULL
   IF NOT EXISTS(select 1 from dbo.meta_component_level
                   where component_level_id = @parent_level)
      begin
        print object_name(@@procid) + ': parent_level value not found in meta_component_level table'
        return
      end
-- see if component_type and component_verb parms are valid
IF @component_type IS NULL 
   IF @component_verb IS NULL 
      -- ok,this is hierarchy level,not action item
      -- entry will be for navigational purposes only
      begin
      --print 'null type and verb - ok'
      SET @component_id = NULL
      end
   ELSE
      begin
        set @component_level_id = -1 
      -- type is null but verb is not, invalid combo
        print object_name(@@procid) + ': error: @component_type was null but @component_verb was not'
        print 'both must be null or both must have values'
        return
      end
ELSE -- type has value, check for verb
   begin
      IF @component_verb IS NULL
         begin
           set @component_level_id = -2 
           -- type has value but verb is null, invalid combo
           print object_name(@@procid) + ': error: @component_type had value but @component_verb was null'
           return

         end
      -- if here, have a value for type and verb, find matching component_id
      SET @component_id = (select ISNULL(component_id,-1) 
                             from meta_component 
                            where component_type = @component_type
                              and component_verb = @component_verb
                       )
      -- if null value is returned, set id to -1
      SET @component_id = ISNULL(@component_id,-1)

   end

if @component_id = -1
   begin
    -- type and verb passed but no match was found, add new entry
    -- in meta_component table
     exec dbo.sp_AddMetaComponent @component_type,
                                     @component_verb,
                                     @component_id OUTPUT
   
     if @component_id < 0 
        begin
          print object_name(@@procid) + ': error creating new meta_component entry. ret val: ' + convert(varchar(30),@component_id)
          return
        end
   end 

-- check to see if this display_text value already exists 
-- within this parent_level and component_type, if does, exit
if @cur_display_text <> ISNULL(@display_text,-1)
   begin  -- display text changed, check for duplicates
      IF EXISTS(select 1 
         from  dbo.GetExistingMetaComponentLevelEntries(@parent_level,@component_type)
         where display_text = @display_text)
	   begin
		  print object_name(@@procid) + ': info: display_text value: ' + @display_text
		  print 'already exists for component_type: ' + ISNULL(convert(varchar(30),@component_type),'NULL')
		  print 'and parent_level: ' + ISNULL(convert(varchar(30),@parent_level),'NULL') + ' combination - no insert occurred'
		  --print @msg
		  return
	   end
   end
   
-- make sure existing display_order values within this parent_level
-- and component_type are in ascending order starting from zero
-- by calling the reorder proc with -1 display order
exec dbo.sp_ReOrderMetaComponentLevel -1,@parent_level,@component_type,
                                         @modified_display_order OUTPUT

-- now update the record
UPDATE dbo.meta_component_level
   SET component_id   = @component_id
       ,display_text  = @display_text
       ,description   = @description
       ,display_order = @display_order
       ,parent_level  = @parent_level
WHERE component_level_id = @component_level_id

if @@rowcount <> 1
   begin
     print object_name(@@procid) + 'error updating meta_component_level entry.'
     return
   end

exec dbo.sp_ReOrderExistingMetaComponentLevel
                                      @display_order,
                                      @cur_display_order,
                                      @parent_level,
                                      @component_type,
                                      @component_level_id,
                                      @parent_or_type_changed,
                                      @modified_display_order OUTPUT

if ISNULL(@modified_display_order,-1) <> @display_order
   begin
      -- @display_order value was modified by the reorder proc, use it
      UPDATE dbo.meta_component_level
         SET display_order = @modified_display_order
       WHERE component_level_id = @component_level_id
  
      print object_name(@@procid) + ': information: display_order requested was modified.'
      print convert(varchar(30),@display_order) + ' was changed to ' + convert(varchar(30),@modified_display_order)

   end

-- determine what changed and if any adjustments need to be made accordingly
if @parent_or_type_changed =1
   begin
     -- type or parent has changed, reorder cur parent,type combination entries
     -- to adjust for removal of this entry from that combination
     exec dbo.sp_ReOrderMetaComponentLevel -1,@cur_parent_level,
                                           @cur_component_type,
                                           @modified_display_order OUTPUT
   end

GO


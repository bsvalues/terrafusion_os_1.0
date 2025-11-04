

CREATE PROCEDURE dbo.sp_AddMetaComponentLevel
           @display_text  varchar(50)
		   ,@description  varchar(255) = NULL
           ,@display_order  int 
		   ,@component_type  int 
           ,@component_verb int 
           ,@parent_level  int
           ,@context varchar(100) = NULL
           ,@component_level_id int output
		   ,@component_id int output
AS 
SET NOCOUNT ON
/***********************************************************
Parameter description:
@component_type : pass NULL for top of hierarchy; otherwise,valid type
                  from meta_component table
                  0=display in main application menu
                  1=display in search band
@component_verb : pass component_verb from meta_component table
 -- NOTE: if @component_type and @component_verb are null, this is not
          an action item entry, just for navigation.
          if @component_type and @component_verb are not null, but 
          do not have a corresponding entry in the meta_component table,
          an entry will be added for this combination. 
@display_text   : display value
@display_order  : pass display order within parent/component
 NOTE: use value that you want it to appear, do not base it on any current
       values in the display_order field. For first entry - value is 0
@parent_level   : component_level_id of parent;NULL if this is top of hierarchy
@context				: The context for the Meta Component Level. Used for hiding via core_config
									by setting szGroup = 'MenuConext' szConfigName = @context and szConfigValue = True/False
@description    : optional description value

OUTPUT Parm: 
@component_level_id: -1 = component_type is null but component_verb has value
          -2 = component_verb is null but component_type has value
*/


--declare @component_id int
SET @component_id = NULL
declare @modified_display_order int
-- check parameter values
if ISNULL(@display_order,-1) < 0 
   begin
     print object_name(@@procid) + ': display_order value must be greater than or equal to zero'
     return
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

--print 'created component_id: ' + convert(varchar(30),@component_id)

-- check to see if this display_text value already exists 
-- within this parent_level and component_type, if does, exit
--   IF EXISTS(select 1 
--         from  dbo.fn_GetExistingMetaComponentLevelEntries(@parent_level,@component_type)
--         where display_text = @display_text)
--   begin
--      print object_name(@@procid) + ': info: display_text value: ' + @display_text
--      print 'already exists for component_type: ' + ISNULL(convert(varchar(30),@component_type),'NULL')
--      print 'and parent_level: ' + ISNULL(convert(varchar(30),@parent_level),'NULL') + ' combination - no insert occurred'
--      --print @msg
--      return
--   end

-- make sure existing display_order values within this parent_level
-- and component_type are in ascending order starting from zero
-- by calling the reorder proc with -1 display order
--exec dbo.sp_ReOrderMetaComponentLevel -1,@parent_level,@component_type,
--                                        @modified_display_order OUTPUT

-- nowresort the existing records in the parent_level and component_id
-- to accomodate this change - proc will bump up any rows with 
-- passed display_order or higher within the parent/component combination
--exec dbo.sp_ReOrderMetaComponentLevel @display_order,@parent_level,
--                                      @component_type,
--                                      @modified_display_order OUTPUT

--if ISNULL(@modified_display_order,-1) <> @display_order
--   begin
      -- @display_order value was modified by the reorder proc, use it
--      print object_name(@@procid) + ': information: display_order requested was modified.'
--      print convert(varchar(30),@display_order) + ' was changed to ' + convert(varchar(30),@modified_display_order)

--      set @display_order = @modified_display_order
--   end
--get next id value
set @component_level_id =(SELECT ISNULL(MAX(component_level_id),-1) + 1 
                            from dbo.meta_component_level)

if ISNULL(@component_level_id,-1) < 0 
   begin
      print object_name(@@procid) + ': error retrieving new component_level_id value'
      return
   end
-- now insert the new record
INSERT INTO dbo.meta_component_level
           (component_level_id
           ,component_id
           ,display_text
           ,description
           ,display_order
           ,parent_level
           ,context)
     VALUES
           (
            @component_level_id
           ,@component_id
           ,@display_text
           ,@description
           ,@display_order
           ,@parent_level
           ,@context
           )

--print @component_level_id

GO


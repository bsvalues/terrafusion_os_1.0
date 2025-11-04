
CREATE PROCEDURE dbo.sp_AddMetaComponent 
            @component_type  int 
           ,@component_verb int
           ,@component_id int OUTPUT 

AS
SET NOCOUNT ON

IF NOT EXISTS (SELECT component_id 
                 FROM dbo.meta_component
                WHERE component_type = @component_type
                  AND component_verb = @component_verb
              )
   begin
     -- this should be only method to add new entry, so max function
     -- should work for getting the next id value
     set @component_id =(SELECT MAX(component_id) + 1 from dbo.meta_component)

	set @component_id = ISNULL(@component_id, 1)

     INSERT INTO dbo.meta_component
           (component_id
           ,component_type
           ,component_verb)
     VALUES
           (
            @component_id
           ,@component_type
           ,@component_verb
            )

   end
ELSE
   begin
   SET @component_id = -99
   declare @msg varchar(200)
   set @msg = 'error in proc ' + object_name(@@procid) + ': '
   set @msg = @msg + 'component_type: '
   set @msg = @msg + convert(varchar(20),@component_type)
   set @msg = @msg + '  and component_verb: ' 
   set @msg = @msg + convert(varchar(20),@component_verb)
   set @msg = @msg + ' combination already exists.'

   print @msg
   end

GO


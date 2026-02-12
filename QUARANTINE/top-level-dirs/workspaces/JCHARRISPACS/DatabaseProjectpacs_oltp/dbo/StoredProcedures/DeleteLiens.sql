


CREATE PROCEDURE [dbo].[DeleteLiens]
   @input_prop_id int,
   @userid int
AS

begin
		
    DECLARE @count_liens int
	
	select @count_liens = COUNT(*)
	from property_lien_holder WITH (NOLOCK)
	where prop_id = @input_prop_id
	

	if (@count_liens > 0)
	begin	

    DECLARE @Lien_Holder_ID int
    DECLARE @Acct_ID int
	DECLARE @DESCRIPTION varchar(2048)

	declare LienCursor CURSOR FAST_FORWARD
	for SELECT lien_holder_id, acct_id
		FROM property_lien_holder WITH (NOLOCK)
		WHERE prop_id = @input_prop_id

		OPEN LienCursor

		FETCH NEXT FROM LienCursor 
		INTO @Lien_Holder_ID, @Acct_ID
		
		WHILE @@FETCH_STATUS = 0
		BEGIN
			SET  @DESCRIPTION = 'Lien Holder ID: ' + CAST(@Lien_Holder_ID AS VARCHAR) + ', Account ID: ' +  CAST(@Acct_ID AS VARCHAR) + ' was removed'
			exec InsertEvent @input_prop_id, 'SYSTEM', @DESCRIPTION, @userid, 'A', NULL, NULL, NULL, @Lien_Holder_ID, @Acct_ID, NULL, null, null
			FETCH NEXT FROM LienCursor INTO @Lien_Holder_ID, @Acct_ID
		END

	CLOSE LienCursor
	DEALLOCATE LienCursor

	end	

	DELETE FROM property_lien_holder WHERE prop_id = @input_prop_id

end



-- ** 'End csp.DeleteLiens.sql'

GO


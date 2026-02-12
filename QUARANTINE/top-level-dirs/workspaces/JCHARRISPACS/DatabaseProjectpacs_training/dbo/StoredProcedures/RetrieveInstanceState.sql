Create Procedure [dbo].[RetrieveInstanceState]
@uidInstanceID uniqueidentifier,
@ownerID uniqueidentifier = NULL,
@ownedUntil datetime = NULL,
@result int output,
@currentOwnerID uniqueidentifier output
As
Begin
    declare @localized_string_RetrieveInstanceState_Failed_Ownership nvarchar(256)
    set @localized_string_RetrieveInstanceState_Failed_Ownership = N'Instance ownership conflict'
    set @result = 0
    set @currentOwnerID = @ownerID

	SET TRANSACTION ISOLATION LEVEL REPEATABLE READ
	BEGIN TRANSACTION
	
    -- Possible workflow status: 0 for executing; 1 for completed; 2 for suspended; 3 for terminated; 4 for invalid

	if @ownerID IS NOT NULL	-- if id is null then just loading readonly state, so ignore the ownership check
	begin
		  Update [dbo].[InstanceState]  
		  set	ownerID = @ownerID,
				ownedUntil = @ownedUntil
		  where uidInstanceID = @uidInstanceID AND (    ownerID = @ownerID 
													 OR ownerID IS NULL 
													 OR ownedUntil<GETUTCDATE()
													)
		  if ( @@ROWCOUNT = 0 )
		  BEGIN
			-- RAISERROR(@localized_string_RetrieveInstanceState_Failed_Ownership, 16, -1)
			select @currentOwnerID=ownerID from [dbo].[InstanceState] Where uidInstanceID = @uidInstanceID 
			if (  @@ROWCOUNT = 0 )
				set @result = -1
			else
				set @result = -2
			GOTO DONE
		  END
	end
	
    Select state from [dbo].[InstanceState]  
    Where uidInstanceID = @uidInstanceID
    
	set @result = @@ROWCOUNT;
    if ( @result = 0 )
	begin
		set @result = -1
		GOTO DONE
	end
	
DONE:
	COMMIT TRANSACTION
	RETURN

End

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[RetrieveInstanceState] TO [state_persistence_users]
    AS [dbo];


GO


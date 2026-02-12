Create Procedure [dbo].[InsertInstanceState]
@uidInstanceID uniqueidentifier,
@state image,
@status int,
@unlocked int,
@blocked int,
@info ntext,
@ownerID uniqueidentifier = NULL,
@ownedUntil datetime = NULL,
@nextTimer datetime,
@result int output,
@currentOwnerID uniqueidentifier output
As
    declare @localized_string_InsertInstanceState_Failed_Ownership nvarchar(256)
    set @localized_string_InsertInstanceState_Failed_Ownership = N'Instance ownership conflict'
    set @result = 0
    set @currentOwnerID = @ownerID
    declare @now datetime
    set @now = GETUTCDATE()

    SET TRANSACTION ISOLATION LEVEL READ COMMITTED
    set nocount on

    IF @status=1 OR @status=3
    BEGIN
	DELETE FROM [dbo].[InstanceState] WHERE uidInstanceID=@uidInstanceID AND ((ownerID = @ownerID AND ownedUntil>=@now) OR (ownerID IS NULL AND @ownerID IS NULL ))
	if ( @@ROWCOUNT = 0 )
	begin
		set @currentOwnerID = NULL
    		select  @currentOwnerID=ownerID from [dbo].[InstanceState] Where uidInstanceID = @uidInstanceID
		if ( @currentOwnerID IS NOT NULL )
		begin	-- cannot delete the instance state because of an ownership conflict
			-- RAISERROR(@localized_string_InsertInstanceState_Failed_Ownership, 16, -1)				
			set @result = -2
			return
		end
	end
	else
	BEGIN
		DELETE FROM [dbo].[CompletedScope] WHERE uidInstanceID=@uidInstanceID
	end
    END
    
    ELSE BEGIN

  	    if not exists ( Select 1 from [dbo].[InstanceState] Where uidInstanceID = @uidInstanceID )
		  BEGIN
			  --Insert Operation
			  IF @unlocked = 0
			  begin
			     Insert into [dbo].[InstanceState] 
			     Values(@uidInstanceID,@state,@status,@unlocked,@blocked,@info,@now,@ownerID,@ownedUntil,@nextTimer) 
			  end
			  else
			  begin
			     Insert into [dbo].[InstanceState] 
			     Values(@uidInstanceID,@state,@status,@unlocked,@blocked,@info,@now,null,null,@nextTimer) 
			  end
		  END
		  
		  ELSE BEGIN

				IF @unlocked = 0
				begin
					Update [dbo].[InstanceState]  
					Set state = @state,
						status = @status,
						unlocked = @unlocked,
						blocked = @blocked,
						info = @info,
						modified = @now,
						ownedUntil = @ownedUntil,
						nextTimer = @nextTimer
					Where uidInstanceID = @uidInstanceID AND ((ownerID = @ownerID AND ownedUntil>=@now) OR (ownerID IS NULL AND @ownerID IS NULL ))
					if ( @@ROWCOUNT = 0 )
					BEGIN
						-- RAISERROR(@localized_string_InsertInstanceState_Failed_Ownership, 16, -1)
						select @currentOwnerID=ownerID from [dbo].[InstanceState] Where uidInstanceID = @uidInstanceID  
						set @result = -2
						return
					END
				end
				else
				begin
					Update [dbo].[InstanceState]  
					Set state = @state,
						status = @status,
						unlocked = @unlocked,
						blocked = @blocked,
						info = @info,
						modified = @now,
						ownerID = NULL,
						ownedUntil = NULL,
						nextTimer = @nextTimer
					Where uidInstanceID = @uidInstanceID AND ((ownerID = @ownerID AND ownedUntil>=@now) OR (ownerID IS NULL AND @ownerID IS NULL ))
					if ( @@ROWCOUNT = 0 )
					BEGIN
						-- RAISERROR(@localized_string_InsertInstanceState_Failed_Ownership, 16, -1)
						select @currentOwnerID=ownerID from [dbo].[InstanceState] Where uidInstanceID = @uidInstanceID  
						set @result = -2
						return
					END
				end
				
		  END


    END
		RETURN
Return

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[InsertInstanceState] TO [state_persistence_users]
    AS [dbo];


GO


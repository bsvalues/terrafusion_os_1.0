

create procedure LitigationSetOwner
	@lLitigationID int,
	@lOwnerID int
as

set nocount on

	/* If the record already exists, we can ignore this request */
	if exists (
		select litigation_id
		from litigation_owner_history with(nolock)
		where
			litigation_id = @lLitigationID and
			owner_id = @lOwnerID and
			date_removed is null
	)
	begin
		return(0)
	end

	declare @dtNow datetime
	set @dtNow = getdate()

	/* Mark the previous litigation owner as removed */
	update litigation_owner_history with(rowlock) set
		date_removed = @dtNow
	where
		litigation_id = @lLitigationID and
		date_removed is null

	/* Add the new owner to the history */
	insert litigation_owner_history with(rowlock) (
		litigation_id, owner_id, date_added, date_removed
	) values (
		@lLitigationID, @lOwnerID, @dtNow, null
	)

	/* Set the owner on the litigation record */
	update litigation with(rowlock) set
		owner_id = @lOwnerID
	where
		litigation_id = @lLitigationID

set nocount off

GO


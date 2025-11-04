
CREATE procedure [dbo].[QueryBuilderInsertUpdateQuery]
	@lQueryID int,
	@lPacsUserID int,
	@szQueryName varchar(63),
	@szQueryDesc varchar(1023),
	@bDistinct bit,
	@dtExpire datetime,
	@szSQL varchar(8000),
	@bEmptyDependentTables bit,
	@binClientAppData image = null
as

set nocount on

	if ( @lQueryID = 0 )
	begin
		insert query_builder_query with(rowlock) (lPacsUserID, szQueryName, szQueryDesc, bDistinct, dtCreate, dtExpire, binClientAppData)
		values (@lPacsUserID, @szQueryName, @szQueryDesc, @bDistinct, getdate(), @dtExpire, @binClientAppData)
		set @lQueryID = scope_identity()

		if ( @szSQL <> '' )
		begin
			insert query_builder_query_usersql with(rowlock) (lQueryID, szSQL)
			values (@lQueryID, @szSQL)
		end
	end
	else
	begin
		update query_builder_query with(rowlock)
		set
			lPacsUserID = @lPacsUserID,
			szQueryName = @szQueryName,
			szQueryDesc = @szQueryDesc,
			bDistinct = @bDistinct,
			dtExpire = @dtExpire,
			binClientAppData = @binClientAppData
		where
			lQueryID = @lQueryID

		if ( @szSQL <> '' )
		begin
			update query_builder_query_usersql with(rowlock)
			set szSQL = @szSQL
			where lQueryID = @lQueryID

			if ( @@rowcount = 0 )
			begin
				insert query_builder_query_usersql with(rowlock) (lQueryID, szSQL)
				values (@lQueryID, @szSQL)
			end
		end
		else
		begin
			delete query_builder_query_usersql with(rowlock)
			where lQueryID = @lQueryID
		end

		if ( @bEmptyDependentTables = 1 )
		begin
			delete query_builder_query_orderby where lQueryID = @lQueryID
			delete query_builder_query_whereincriteria where lQueryID = @lQueryID
			delete query_builder_query_wherecriteria where lQueryID = @lQueryID
			delete query_builder_query_outputcolumn where lQueryID = @lQueryID
			delete query_builder_query_joincriteria where lQueryID = @lQueryID
			delete query_builder_query_fromjointbl where lQueryID = @lQueryID
		end

	end
	
	IF (OBJECT_ID('WorkflowTaskQueryInsertUpdate') IS NOT NULL)
	   exec WorkflowTaskQueryInsertUpdate @lqueryId

set nocount off


	select lQueryID = @lQueryID

GO


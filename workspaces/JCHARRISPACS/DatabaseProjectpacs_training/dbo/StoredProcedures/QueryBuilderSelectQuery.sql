
create procedure QueryBuilderSelectQuery
	@lQueryID int,
	@lPacsUserID int
as

	if ( @lQueryID > 0 )
	begin
		select q.lQueryID, q.szQueryName, q.szQueryDesc, q.bDistinct, q.lPacsUserID, q.dtCreate, q.dtExpire, qsql.szSQL, datalength(q.binClientAppData), q.binClientAppData
		from query_builder_query as q with(nolock)
		left outer join query_builder_query_usersql as qsql with(nolock) on
			qsql.lQueryID = q.lQueryID
		where
			q.lQueryID = @lQueryID
		order by q.lQueryID asc
	end
	else
	begin
		select q.lQueryID, q.szQueryName, q.szQueryDesc, q.bDistinct, q.lPacsUserID, q.dtCreate, q.dtExpire, qsql.szSQL, datalength(q.binClientAppData), q.binClientAppData
		from query_builder_query as q with(nolock)
		left outer join query_builder_query_usersql as qsql with(nolock) on
			qsql.lQueryID = q.lQueryID
		where
			q.lPacsUserID = @lPacsUserID
		order by q.lQueryID asc
	end

	return( @@rowcount )

GO


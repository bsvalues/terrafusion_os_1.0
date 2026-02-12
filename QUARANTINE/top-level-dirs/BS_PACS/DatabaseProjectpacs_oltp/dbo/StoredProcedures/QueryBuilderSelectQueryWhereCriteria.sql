
create procedure QueryBuilderSelectQueryWhereCriteria
	@lQueryID int
as

	select
		q.lOrder,
		q.lUniqueColumnID, q.lComparisonOperator, q.lBooleanOperator, q.lTable, q.lUniqueColumnID_Operand, q.lTable_Operand,
		q.bNullOperand, q.szOperand1, q.szOperand2, q.lBetweenOperandColumn1, q.lBetweenOperandColumn2, q.lBetweenOperandTable1, q.lBetweenOperandTable2
	from query_builder_query_wherecriteria as q with(nolock)
	where
		q.lQueryID = @lQueryID
	order by q.lOrder asc

	return( @@rowcount )

GO


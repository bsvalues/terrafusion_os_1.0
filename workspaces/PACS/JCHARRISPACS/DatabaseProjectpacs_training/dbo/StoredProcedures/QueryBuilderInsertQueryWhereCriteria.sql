
create procedure QueryBuilderInsertQueryWhereCriteria
	@lQueryID int,
	@lOrder int,
	@lUniqueColumnID int,
	@lComparisonOperator int,
	@lBooleanOperator int,
	@lTable int,
	@lUniqueColumnID_Operand int,
	@lTable_Operand int,
	@bNullOperand bit,
	@szOperand1 varchar(255),
	@szOperand2 varchar(255),
	@lBetweenOperandColumn1 int,
	@lBetweenOperandColumn2 int,
	@lBetweenOperandTable1 int,
	@lBetweenOperandTable2 int
as

set nocount on

	insert query_builder_query_wherecriteria with(rowlock) (
		lQueryID, lOrder,
		lUniqueColumnID, lComparisonOperator, lBooleanOperator, lTable, lUniqueColumnID_Operand, lTable_Operand,
		bNullOperand, szOperand1, szOperand2, lBetweenOperandColumn1, lBetweenOperandColumn2, lBetweenOperandTable1, lBetweenOperandTable2
	) values (
		@lQueryID, @lOrder,
		@lUniqueColumnID, @lComparisonOperator, @lBooleanOperator, @lTable, @lUniqueColumnID_Operand, @lTable_Operand,
		@bNullOperand, @szOperand1, @szOperand2, @lBetweenOperandColumn1, @lBetweenOperandColumn2, @lBetweenOperandTable1, @lBetweenOperandTable2
	)

GO


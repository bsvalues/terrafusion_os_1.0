CREATE   PROCEDURE CopyCalculationRuleToAgency
	@lInputFromRuleID int,
	@ruleID int output,
	@lCopyToRuleID int = -1
	
AS
SET NOCOUNT ON

declare @conditionID int,
		@conditionFragmentID int,
		@expressionID int,
		@expressionFragmentID int,
		@op1ExpressionID int,
		@op2expressionID int,
		@rowcount int,

		@fromConditionID int,
		@fromResultExpressionID int,
		@fromOp1ExpressionID int,
		@fromOp2ExpressionID int,
		@fromFragmentID int

set @rowcount = 0
		
--Get the next rule id if it was not provided
if(@lCopyToRuleID = -1)
begin
	exec GetUniqueID 'calculation_rule', @lCopyToRuleID output, 1, 0
end

set @ruleID = @lCopyToRuleID

--Calculation Rule Copy--
insert into calculation_rule (rule_id, rule_name, rule_description)
select @ruleID, rule_name, rule_description
from calculation_rule
where rule_id = @lInputFromRuleID

--Calculation Rule Condition Copy--
select @rowcount = count(*) 
from calculation_rule_condition
where rule_id = @lInputFromRuleID

if (@rowcount > 0)
begin 
	exec GetUniqueID 'calculation_rule_condition', @conditionID output, @rowcount, 0

		declare conditionData cursor fast_forward for
			select condition_id, result_expression_id
			from calculation_rule_condition
			where rule_id = @lInputFromRuleID
		open conditionData
		fetch next from conditionData into @fromConditionID, @fromResultExpressionID

		while @@fetch_status = 0
		begin
			set @expressionID = null
			if(isNull(@fromResultExpressionID, 0) > 0)
			begin
				exec GetUniqueID 'expression', @expressionID output, 1, 0
			end

			insert into calculation_rule_condition 
				([condition_id], [rule_id], [condition_order], [result_expression_id], 
				[result_table_dot_field], [result_constant], [result_function], 
				[result_parameter])
			select @conditionID, @ruleID, [condition_order], @expressionID, 
				[result_table_dot_field], [result_constant], [result_function], 
				[result_parameter]
			from calculation_rule_condition
			where rule_id = @lInputFromRuleID and
				condition_id = @fromConditionID	
			
			--Result Expression
			if(@fromResultExpressionID > 0)
			begin
					insert into expression (expression_id, expression_name, expression_description)
					select @expressionID, expression_name, expression_description
					from expression
					where expression_id = @fromResultExpressionID
				
				--Expression Fragments
				select @rowcount = count(*) from expression_fragment
				where expression_id = @fromResultExpressionID
				
				if(@rowcount > 0)
				begin
					exec GetUniqueID 'expression_fragment', @expressionFragmentID output, @rowcount, 0					

					declare expressionData cursor fast_forward for
						select fragment_id from expression_fragment
						where expression_id = @fromResultExpressionID
					open expressionData 
					fetch next from expressionData into @fromFragmentID
					while @@fetch_status = 0
					begin
						insert into expression_fragment 
							([fragment_id], [expression_id], [fragment_order], [operand_one_table_dot_field], 
								[operand_one_constant], [math_operator], [operand_two_table_dot_field], 
								[operand_two_constant], [operand_one_function], [operand_one_parameter], 
								[operand_two_function], [operand_two_parameter])
						select @expressionFragmentID, @expressionID, [fragment_order], [operand_one_table_dot_field], 
								[operand_one_constant], [math_operator], [operand_two_table_dot_field], 
								[operand_two_constant], [operand_one_function], [operand_one_parameter], 
								[operand_two_function], [operand_two_parameter]
						from expression_fragment
						where fragment_id = @fromFragmentID
							and expression_id = @fromResultExpressionID
					
						set @expressionFragmentID = @expressionFragmentID + 1
						fetch next from expressionData into @fromFragmentID
					end
					close expressionData
					deallocate expressionData
				end
			end

			--Condition Fragments
			select @rowcount = count(*)
			from calculation_rule_condition_fragment
			where condition_id = @fromConditionID
			
			if(@rowcount > 0)
			begin
				exec GetUniqueID 'calculation_rule_condition_fragment', @conditionFragmentID output, @rowcount, 0
				
				declare conditionFragmentData cursor fast_forward for
					select	condition_fragment_id, 
							operand_one_expression_id, 
							operand_two_expression_id
					from calculation_rule_condition_fragment
					where condition_id = @fromConditionID
				open conditionFragmentData 
				fetch next from conditionFragmentData into 
					@fromFragmentID, @fromOp1ExpressionID, @fromOp2ExpressionID
				while @@fetch_status = 0
				begin
					set @op1ExpressionID = null
					set @op2ExpressionID = null

					if(isNull(@fromOp1ExpressionID, 0) > 0)
					begin
						exec GetUniqueID 'expression', @op1ExpressionID output, 1, 0
					end	

					if(isNull(@fromOp2ExpressionID, 0) > 0)
					begin
						exec GetUniqueID 'expression', @op2ExpressionID output, 1, 0
					end	

					insert into calculation_rule_condition_fragment 
						 ([condition_fragment_id], [condition_id], [condition_fragment_order], 
							[operand_one_expression_id], [operand_one_table_dot_field], [comparison_operator], 
							[operand_two_expression_id], [operand_two_table_dot_field], [operand_two_constant], 
							[logical_operator], [operand_one_function], [operand_one_parameter], [operand_two_function], 
							[operand_two_parameter])
					select @conditionFragmentID, @conditionID, [condition_fragment_order], 
							@op1ExpressionID, [operand_one_table_dot_field], [comparison_operator], 
							@op2ExpressionID, [operand_two_table_dot_field], [operand_two_constant], 
							[logical_operator], [operand_one_function], [operand_one_parameter], [operand_two_function], 
							[operand_two_parameter]	
					from calculation_rule_condition_fragment
					where condition_id = @fromConditionID
						and condition_fragment_id = @fromFragmentID

					--Operand 1 Expression
					if(isNull(@op1ExpressionID, 0) > 0)
					begin
						insert into expression (expression_id, expression_name, expression_description)
						select @op1ExpressionID, expression_name, expression_description
						from expression
						where expression_id = @fromOp1ExpressionID
				
						--Expression Fragments
						select @rowcount = count(*) from expression_fragment
						where expression_id = @fromOp1ExpressionID
						
						if(@rowcount > 0)
						begin
							exec GetUniqueID 'expression_fragment', @expressionFragmentID output, @rowcount, 0					

							declare expressionData cursor fast_forward for
								select fragment_id from expression_fragment
								where expression_id = @fromOp1ExpressionID
							open expressionData 
							fetch next from expressionData into @fromFragmentID
							while @@fetch_status = 0
							begin
								insert into expression_fragment 
									([fragment_id], [expression_id], [fragment_order], [operand_one_table_dot_field], 
										[operand_one_constant], [math_operator], [operand_two_table_dot_field], 
										[operand_two_constant], [operand_one_function], [operand_one_parameter], 
										[operand_two_function], [operand_two_parameter])
								select @expressionFragmentID, @op1ExpressionID, [fragment_order], [operand_one_table_dot_field], 
										[operand_one_constant], [math_operator], [operand_two_table_dot_field], 
										[operand_two_constant], [operand_one_function], [operand_one_parameter], 
										[operand_two_function], [operand_two_parameter]
								from expression_fragment
								where fragment_id = @fromFragmentID
									and expression_id = @fromOp1ExpressionID
							
								set @expressionFragmentID = @expressionFragmentID + 1
								fetch next from expressionData into @fromFragmentID
							end
							close expressionData
							deallocate expressionData
						end
					end

					--Operand 2 Expression
					if(isNull(@op2ExpressionID, 0) > 0)
					begin
						insert into expression (expression_id, expression_name, expression_description)
						select @op2ExpressionID, expression_name, expression_description
						from expression
						where expression_id = @fromOp2ExpressionID
				
						--Expression Fragments
						select @rowcount = count(*) from expression_fragment
						where expression_id = @fromOp2ExpressionID
						
						if(@rowcount > 0)
						begin
							exec GetUniqueID 'expression_fragment', @expressionFragmentID output, @rowcount, 0					

							declare expressionData cursor fast_forward for
								select fragment_id from expression_fragment
								where expression_id = @fromOp2ExpressionID
							open expressionData 
							fetch next from expressionData into @fromFragmentID
							while @@fetch_status = 0
							begin
								insert into expression_fragment 
									([fragment_id], [expression_id], [fragment_order], [operand_one_table_dot_field], 
										[operand_one_constant], [math_operator], [operand_two_table_dot_field], 
										[operand_two_constant], [operand_one_function], [operand_one_parameter], 
										[operand_two_function], [operand_two_parameter])
								select @expressionFragmentID, @op2ExpressionID, [fragment_order], [operand_one_table_dot_field], 
										[operand_one_constant], [math_operator], [operand_two_table_dot_field], 
										[operand_two_constant], [operand_one_function], [operand_one_parameter], 
										[operand_two_function], [operand_two_parameter]
								from expression_fragment
								where fragment_id = @fromFragmentID
									and expression_id = @fromOp2ExpressionID
							
								set @expressionFragmentID = @expressionFragmentID + 1
								fetch next from expressionData into @fromFragmentID
							end
							close expressionData
							deallocate expressionData
						end
					end
															
					set @conditionFragmentID = @conditionFragmentID + 1
					fetch next from conditionFragmentData into 
						@fromFragmentID, @fromOp1ExpressionID, @fromOp2ExpressionID
				end				
				close conditionFragmentData
				deallocate conditionFragmentData
			end
		
			set @conditionID = @conditionID + 1 	
			fetch next from conditionData into @fromConditionID, @fromResultExpressionID
		end
	
	close conditiondata
	deallocate conditiondata
end

GO


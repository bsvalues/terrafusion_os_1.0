CREATE   PROCEDURE DeleteCalculationRule
	@ruleID int
AS
SET NOCOUNT ON

--Result Expression ID
delete from ex
from expression as ex with (nolock)
join calculation_rule_condition as crc with (nolock)
on crc.result_expression_id  = ex.expression_id
where crc.rule_id = @ruleID

delete from ex
from expression_fragment as ex with (nolock)
join calculation_rule_condition as crc with (nolock)
on crc.result_expression_id  = ex.expression_id
where crc.rule_id = @ruleID


--Operand 1 Expression ID
delete from ex
from expression as ex with (nolock)
join calculation_rule_condition_fragment as crcf with (nolock)
on ex.expression_id = crcf.operand_one_expression_id 
join calculation_rule_condition as crc with (nolock)
on crc.condition_id = crcf.condition_id
where crc.rule_id = @ruleID

delete from ex
from expression_fragment as ex with (nolock)
join calculation_rule_condition_fragment as crcf with (nolock)
on ex.expression_id = crcf.operand_one_expression_id 
join calculation_rule_condition as crc with (nolock)
on crc.condition_id = crcf.condition_id
where crc.rule_id = @ruleID


--Operand 2 Expression ID
delete from ex
from expression as ex with (nolock)
join calculation_rule_condition_fragment as crcf with (nolock)
on ex.expression_id = crcf.operand_two_expression_id 
join calculation_rule_condition as crc with (nolock)
on crc.condition_id = crcf.condition_id
where crc.rule_id = @ruleID

delete from ex
from expression_fragment as ex with (nolock)
join calculation_rule_condition_fragment as crcf with (nolock)
on ex.expression_id = crcf.operand_two_expression_id 
join calculation_rule_condition as crc with (nolock)
on crc.condition_id = crcf.condition_id
where crc.rule_id = @ruleID


--calculation_rule_condition_fragment
delete from crcf
from calculation_rule_condition_fragment as crcf with (nolock)
join calculation_rule_condition as crc with (nolock)
on crc.condition_id = crcf.condition_id
where crc.rule_id = @ruleID


--calculation_rule_condition
delete from crc
from calculation_rule_condition as crc with (nolock)
where crc.rule_id = @ruleID

GO


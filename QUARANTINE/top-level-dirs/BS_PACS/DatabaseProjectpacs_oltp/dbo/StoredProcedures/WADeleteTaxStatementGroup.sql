
CREATE procedure [dbo].[WADeleteTaxStatementGroup]

@input_group_id int,
@input_group_yr numeric(4,0),
@input_run	int

as

if not exists(select * from wa_tax_statement_run where year = @input_group_yr and group_id = @input_group_id)
begin

delete from wa_tax_statement_group with(tablock)
where group_id = @input_group_id and
	  year = @input_group_yr

delete from wa_tax_statement_assessment with(tablock)
where group_id = @input_group_id and
	  year = @input_group_yr

end

GO


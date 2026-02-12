


CREATE procedure SetStmntSalesTaxRate

@input_yr	numeric(4)

as

declare @stmnt_id	int
declare @group_yr	numeric(4)
declare @entity_1_id	int
declare @entity_2_id	int
declare @entity_3_id	int
declare @entity_4_id	int
declare @entity_5_id	int
declare @entity_6_id	int
declare @entity_7_id	int
declare @entity_8_id	int
declare @entity_9_id	int
declare @entity_10_id	int
declare @entity_1_taxable	numeric(14)
declare @entity_2_taxable	numeric(14)
declare @entity_3_taxable	numeric(14)
declare @entity_4_taxable	numeric(14)
declare @entity_5_taxable	numeric(14)
declare @entity_6_taxable	numeric(14)
declare @entity_7_taxable	numeric(14)
declare @entity_8_taxable	numeric(14)
declare @entity_9_taxable	numeric(14)
declare @entity_10_taxable	numeric(14)

declare @taxes_saved		numeric(14,2)
declare @sales_tax_pct		numeric(13,10)


declare stmnt_info scroll cursor  
for select transfer_tax_stmnt_1105.stmnt_id,
	   transfer_tax_stmnt_1105.levy_group_yr,
	   transfer_tax_stmnt_1105.entity_1_id,
	   transfer_tax_stmnt_1105.entity_1_taxable,
	   transfer_tax_stmnt_1105.entity_2_id,
	   transfer_tax_stmnt_1105.entity_2_taxable,
	   transfer_tax_stmnt_1105.entity_3_id,
	   transfer_tax_stmnt_1105.entity_3_taxable,
	   transfer_tax_stmnt_1105.entity_4_id,
	   transfer_tax_stmnt_1105.entity_4_taxable,
	   transfer_tax_stmnt_1105.entity_5_id,
	   transfer_tax_stmnt_1105.entity_5_taxable,
	   transfer_tax_stmnt_1105.entity_6_id,
	   transfer_tax_stmnt_1105.entity_6_taxable,
	   transfer_tax_stmnt_1105.entity_7_id,
	   transfer_tax_stmnt_1105.entity_7_taxable,
	   transfer_tax_stmnt_1105.entity_8_id,
	   transfer_tax_stmnt_1105.entity_8_taxable,
	   transfer_tax_stmnt_1105.entity_9_id,
	   transfer_tax_stmnt_1105.entity_9_taxable,
	   transfer_tax_stmnt_1105.entity_10_id,
	   transfer_tax_stmnt_1105.entity_10_taxable
    from transfer_tax_stmnt_1105
    where levy_group_yr = @input_yr

open stmnt_info
fetch next from stmnt_info into @stmnt_id,
			        @group_yr,
				@entity_1_id,
				@entity_1_taxable,
				@entity_2_id,
				@entity_2_taxable,
				@entity_3_id,
				@entity_3_taxable,
				@entity_4_id,
				@entity_4_taxable,
				@entity_5_id,
				@entity_5_taxable,
				@entity_6_id,
				@entity_6_taxable,
				@entity_7_id,
				@entity_7_taxable,
				@entity_8_id,
				@entity_8_taxable,
				@entity_9_id,
				@entity_9_taxable,
				@entity_10_id,
				@entity_10_taxable

while (@@FETCH_STATUS = 0)
begin
    
	select @taxes_saved = 0 

	/* entity 1 id */
	if exists (select * from tax_rate where entity_id = @entity_1_id
		   and tax_rate_yr = @group_yr and sales_tax_pct is not null)
	begin
		   select @sales_tax_pct = sales_tax_pct
		   from tax_rate where entity_id = @entity_1_id
		   and  tax_rate_yr = @group_yr

		   select @taxes_saved = @taxes_saved + (@entity_1_taxable * @sales_tax_pct/100)
	end

	/* entity 2 id */
	if exists (select * from tax_rate where entity_id = @entity_2_id
		   and tax_rate_yr = @group_yr and sales_tax_pct is not null)
	begin
		   select @sales_tax_pct = sales_tax_pct
		   from tax_rate where entity_id = @entity_2_id
		   and  tax_rate_yr = @group_yr

		   select @taxes_saved = @taxes_saved + (@entity_2_taxable * @sales_tax_pct/100)
	end

	/* entity 3 id */
	if exists (select * from tax_rate where entity_id = @entity_3_id
		   and tax_rate_yr = @group_yr and sales_tax_pct is not null)
	begin
		   select @sales_tax_pct = sales_tax_pct
		   from tax_rate where entity_id = @entity_3_id
		   and  tax_rate_yr = @group_yr

		   select @taxes_saved = @taxes_saved + (@entity_3_taxable * @sales_tax_pct/100)
	end

	/* entity 4 id */
	if exists (select * from tax_rate where entity_id = @entity_4_id
		   and tax_rate_yr = @group_yr and sales_tax_pct is not null)
	begin
		   select @sales_tax_pct = sales_tax_pct
		   from tax_rate where entity_id = @entity_4_id
		   and  tax_rate_yr = @group_yr

		   select @taxes_saved = @taxes_saved + (@entity_4_taxable * @sales_tax_pct/100)
	end

	/* entity 5 id */
	if exists (select * from tax_rate where entity_id = @entity_5_id
		   and tax_rate_yr = @group_yr and sales_tax_pct is not null)
	begin
		   select @sales_tax_pct = sales_tax_pct
		   from tax_rate where entity_id = @entity_5_id
		   and  tax_rate_yr = @group_yr

		   select @taxes_saved = @taxes_saved + (@entity_5_taxable * @sales_tax_pct/100)
	end


	
	/* entity 6 id */
	if exists (select * from tax_rate where entity_id = @entity_6_id
		   and tax_rate_yr = @group_yr and sales_tax_pct is not null)
	begin
		   select @sales_tax_pct = sales_tax_pct
		   from tax_rate where entity_id = @entity_6_id
		   and  tax_rate_yr = @group_yr

		   select @taxes_saved = @taxes_saved + (@entity_6_taxable * @sales_tax_pct/100)
	end

	/* entity 7 id */
	if exists (select * from tax_rate where entity_id = @entity_7_id
		   and tax_rate_yr = @group_yr and sales_tax_pct is not null)
	begin
		   select @sales_tax_pct = sales_tax_pct
		   from tax_rate where entity_id = @entity_7_id
		   and  tax_rate_yr = @group_yr

		   select @taxes_saved = @taxes_saved + (@entity_7_taxable * @sales_tax_pct/100)
	end

	/* entity 8 id */
	if exists (select * from tax_rate where entity_id = @entity_8_id
		   and tax_rate_yr = @group_yr and sales_tax_pct is not null)
	begin
		   select @sales_tax_pct = sales_tax_pct
		   from tax_rate where entity_id = @entity_8_id
		   and  tax_rate_yr = @group_yr

		   select @taxes_saved = @taxes_saved + (@entity_8_taxable * @sales_tax_pct/100)
	end

	/* entity 9 id */
	if exists (select * from tax_rate where entity_id = @entity_9_id
		   and tax_rate_yr = @group_yr and sales_tax_pct is not null)
	begin
		   select @sales_tax_pct = sales_tax_pct
		   from tax_rate where entity_id = @entity_9_id
		   and  tax_rate_yr = @group_yr

		   select @taxes_saved = @taxes_saved + (@entity_9_taxable * @sales_tax_pct/100)
	end

	/* entity 10 id */
	if exists (select * from tax_rate where entity_id = @entity_10_id
		   and tax_rate_yr = @group_yr and sales_tax_pct is not null)
	begin
		   select @sales_tax_pct = sales_tax_pct
		   from tax_rate where entity_id = @entity_10_id
		   and  tax_rate_yr = @group_yr

		   select @taxes_saved = @taxes_saved + (@entity_10_taxable * @sales_tax_pct/100)
	end


	update transfer_tax_stmnt_1105 set taxes_saved = @taxes_saved
	where  stmnt_id      = @stmnt_id
	and    levy_group_yr = @group_yr

	fetch next from stmnt_info into @stmnt_id,
			        @group_yr,
				@entity_1_id,
				@entity_1_taxable,
				@entity_2_id,
				@entity_2_taxable,
				@entity_3_id,
				@entity_3_taxable,
				@entity_4_id,
				@entity_4_taxable,
				@entity_5_id,
				@entity_5_taxable,
				@entity_6_id,
				@entity_6_taxable,
				@entity_7_id,
				@entity_7_taxable,
				@entity_8_id,
				@entity_8_taxable,
				@entity_9_id,
				@entity_9_taxable,
				@entity_10_id,
				@entity_10_taxable

end

close stmnt_info
deallocate stmnt_info

GO


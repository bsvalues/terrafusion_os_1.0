







CREATE procedure CreateTransferTaxStmntEntityTotalsTemp

@input_group_id	int,
@input_run_id		int,
@input_stmnt_yr		numeric(4),
@input_sup_num	int

as

declare @levy_group_id		int
declare @levy_group_yr		numeric(4)
declare @levy_run_id		int
declare @stmnt_id		int
declare @prop_id		int
declare @owner_id		int
declare @entity_1_id		int
declare @entity_1_tax_amt	numeric(14,2)
declare @entity_1_taxable     	numeric(14)
declare @entity_1_tax_rate	numeric(13,10)
declare @entity_2_id		int
declare @entity_2_tax_amt	numeric(14,2)
declare @entity_2_taxable     	numeric(14)
declare @entity_2_tax_rate	numeric(13,10)
declare @entity_3_id		int
declare @entity_3_tax_amt	numeric(14,2)
declare @entity_3_taxable     	numeric(14)
declare @entity_3_tax_rate	numeric(13,10)
declare @entity_4_id		int
declare @entity_4_tax_amt	numeric(14,2)
declare @entity_4_taxable     	numeric(14)
declare @entity_4_tax_rate	numeric(13,10)
declare @entity_5_id		int
declare @entity_5_tax_amt	numeric(14,2)
declare @entity_5_taxable     	numeric(14)
declare @entity_5_tax_rate	numeric(13,10)
declare @entity_6_id		int
declare @entity_6_tax_amt	numeric(14,2)
declare @entity_6_taxable     	numeric(14)
declare @entity_6_tax_rate	numeric(13,10)
declare @entity_7_id		int
declare @entity_7_tax_amt	numeric(14,2)
declare @entity_7_taxable     	numeric(14)
declare @entity_7_tax_rate	numeric(13,10)
declare @entity_8_id		int
declare @entity_8_tax_amt	numeric(14,2)
declare @entity_8_taxable     	numeric(14)
declare @entity_8_tax_rate	numeric(13,10)
declare @entity_9_id		int
declare @entity_9_tax_amt	numeric(14,2)
declare @entity_9_taxable     	numeric(14)
declare @entity_9_tax_rate	numeric(13,10)
declare @entity_10_id		int
declare @entity_10_tax_amt	numeric(14,2)
declare @entity_10_taxable     	numeric(14)
declare @entity_10_tax_rate	numeric(13,10)



declare stmnt_cursor SCROLL CURSOR
    FOR select 	distinct
		levy_group_id,
		levy_group_yr,
		levy_run_id,
		stmnt_id,
		prop_id,
		owner_id,
		entity_1_id,
		entity_1_tax_amt,
		entity_1_taxable,
		entity_1_tax_rate,
		entity_2_id,
		entity_2_tax_amt,
		entity_2_taxable,
		entity_2_tax_rate,
		entity_3_id,
		entity_3_tax_amt,
		entity_3_taxable,
		entity_3_tax_rate,
		entity_4_id,
		entity_4_tax_amt,
		entity_4_taxable,
		entity_4_tax_rate,
		entity_5_id,
		entity_5_tax_amt,
		entity_5_taxable,
		entity_5_tax_rate,
		entity_6_id,
		entity_6_tax_amt,
		entity_6_taxable,
		entity_6_tax_rate,
		entity_7_id,
		entity_7_tax_amt,
		entity_7_taxable,
		entity_7_tax_rate,
		entity_8_id,
		entity_8_tax_amt,
		entity_8_taxable,
		entity_8_tax_rate,
		entity_9_id,
		entity_9_tax_amt,
		entity_9_taxable,
		entity_9_tax_rate,
		entity_10_id,
		entity_10_tax_amt,
		entity_10_taxable,
		entity_10_tax_rate
    from   transfer_tax_stmnt
    where  levy_group_id = @input_group_id
    and    levy_group_yr = @input_stmnt_yr
    and    levy_run_id   = @input_run_id
   
open stmnt_cursor
fetch next from stmnt_cursor into 
		@levy_group_id,
		@levy_group_yr,
		@levy_run_id,
		@stmnt_id,
		@prop_id,
		@owner_id,
		@entity_1_id,
		@entity_1_tax_amt,
		@entity_1_taxable,
		@entity_1_tax_rate,
		@entity_2_id,
		@entity_2_tax_amt,
		@entity_2_taxable,
		@entity_2_tax_rate,
		@entity_3_id,
		@entity_3_tax_amt,
		@entity_3_taxable,
		@entity_3_tax_rate,
		@entity_4_id,
		@entity_4_tax_amt,
		@entity_4_taxable,
		@entity_4_tax_rate,
		@entity_5_id,
		@entity_5_tax_amt,
		@entity_5_taxable,
		@entity_5_tax_rate,
		@entity_6_id,
		@entity_6_tax_amt,
		@entity_6_taxable,
		@entity_6_tax_rate,
		@entity_7_id,
		@entity_7_tax_amt,
		@entity_7_taxable,
		@entity_7_tax_rate,
		@entity_8_id,
		@entity_8_tax_amt,
		@entity_8_taxable,
		@entity_8_tax_rate,
		@entity_9_id,
		@entity_9_tax_amt,
		@entity_9_taxable,
		@entity_9_tax_rate,
		@entity_10_id,
		@entity_10_tax_amt,
		@entity_10_taxable,
		@entity_10_tax_rate



while (@@FETCH_STATUS = 0)
begin

	/* process entity 1 */
	if (@entity_1_id <> 0)
	begin
		if (@entity_1_tax_amt is null)
		begin
			select @entity_1_tax_amt = 0
		end

		if not exists (select * from transfer_tax_stmnt_entity_totals_temp
		       	where levy_group_id = @levy_group_id
		       	and   levy_run_id   = @levy_run_id
		       	and   levy_group_yr = @levy_group_yr
		       	and   stmnt_id      = @stmnt_id
		       	and   entity_id     = @entity_1_id)
		begin
			insert into transfer_tax_stmnt_entity_totals_temp
			(
			levy_group_id, 
			levy_group_yr, 
			levy_run_id, 
			stmnt_id,   
			entity_id,   
			tax_amt,
			taxable_val,
			tax_rate
			)
			values
			(
			@levy_group_id, 
			@levy_group_yr, 
			@levy_run_id, 
			@stmnt_id,   
			@entity_1_id,   
			@entity_1_tax_amt,
			@entity_1_taxable,
			@entity_1_tax_rate
			)
		end
		else
		begin
			update transfer_tax_stmnt_entity_totals_temp
			set tax_amt = tax_amt + @entity_1_tax_amt,
			      taxable_val = taxable_val + @entity_1_taxable
			where levy_group_id = @levy_group_id
			and   levy_group_yr = @levy_group_yr
			and   levy_run_id   = @levy_run_id
			and   stmnt_id      = @stmnt_id
			and   entity_id     = @entity_1_id
		
		end
	end

	if (@entity_2_id <> 0)
	begin
		/* process entity 2 */
		if (@entity_2_tax_amt is null)
		begin
			select @entity_2_tax_amt = 0
		end

		if not exists (select * from transfer_tax_stmnt_entity_totals_temp
		       	where levy_group_id = @levy_group_id
		       	and   levy_run_id   = @levy_run_id
		      	 and   levy_group_yr = @levy_group_yr
		       	and   stmnt_id      = @stmnt_id
		       	and   entity_id     = @entity_2_id)
		begin
			insert into transfer_tax_stmnt_entity_totals_temp
			(
			levy_group_id, 
			levy_group_yr, 
			levy_run_id, 
			stmnt_id,   
			entity_id,   
			tax_amt,
			taxable_val,
			tax_rate     
			)
			values
			(
			@levy_group_id, 
			@levy_group_yr, 
			@levy_run_id, 
			@stmnt_id,   
			@entity_2_id,   
			@entity_2_tax_amt,
			@entity_2_taxable,
			@entity_2_tax_rate      
			)
		end
		else
		begin
			update transfer_tax_stmnt_entity_totals_temp
			set tax_amt = tax_amt + @entity_2_tax_amt,
			      taxable_val = taxable_val + @entity_2_taxable
			where levy_group_id = @levy_group_id
			and   levy_group_yr = @levy_group_yr
			and   levy_run_id   = @levy_run_id
			and   stmnt_id      = @stmnt_id
			and   entity_id     = @entity_2_id
		
		end
	end


	/* process entity 3 */
	if (@entity_3_id <> 0)
	begin
		if (@entity_3_tax_amt is null)
		begin
			select @entity_3_tax_amt = 0
		end

		if not exists (select * from transfer_tax_stmnt_entity_totals_temp
		       where levy_group_id = @levy_group_id
		       and   levy_run_id   = @levy_run_id
		       and   levy_group_yr = @levy_group_yr
		       and   stmnt_id      = @stmnt_id
		       and   entity_id     = @entity_3_id)
		begin
			insert into transfer_tax_stmnt_entity_totals_temp
			(
			levy_group_id, 
			levy_group_yr, 
			levy_run_id, 
			stmnt_id,   
			entity_id,   
			tax_amt,
			taxable_val,
			tax_rate      
			)
			values
			(
			@levy_group_id, 
			@levy_group_yr, 
			@levy_run_id, 
			@stmnt_id,   
			@entity_3_id,   
			@entity_3_tax_amt,
			@entity_3_taxable,
			@entity_3_tax_rate     
			)
		end
		else
		begin
			update transfer_tax_stmnt_entity_totals_temp
			set tax_amt = tax_amt + @entity_3_tax_amt,
			      taxable_val = taxable_val + @entity_3_taxable
			where levy_group_id = @levy_group_id
			and   levy_group_yr = @levy_group_yr
			and   levy_run_id   = @levy_run_id
			and   stmnt_id      = @stmnt_id
			and   entity_id     = @entity_3_id
		
		end
	end


	/* process entity 4 */
	if (@entity_4_id <> 0)
	begin
		if (@entity_4_tax_amt is null)
		begin
			select @entity_4_tax_amt = 0
		end

		if not exists (select * from transfer_tax_stmnt_entity_totals_temp
		       where levy_group_id = @levy_group_id
		       and   levy_run_id   = @levy_run_id
		       and   levy_group_yr = @levy_group_yr
		       and   stmnt_id      = @stmnt_id
		       and   entity_id     = @entity_4_id)
		begin
			insert into transfer_tax_stmnt_entity_totals_temp
			(
			levy_group_id, 
			levy_group_yr, 
			levy_run_id, 
			stmnt_id,   
			entity_id,   
			tax_amt,
			taxable_val,
			tax_rate      
			)
			values
			(
			@levy_group_id, 
			@levy_group_yr, 
			@levy_run_id, 
			@stmnt_id,   
			@entity_4_id,   
			@entity_4_tax_amt,
			@entity_4_taxable,
			@entity_4_tax_rate      
			)
		end
		else
		begin
			update transfer_tax_stmnt_entity_totals_temp
			set tax_amt = tax_amt + @entity_4_tax_amt,
			      taxable_val = taxable_val + @entity_4_taxable
			where levy_group_id = @levy_group_id
			and   levy_group_yr = @levy_group_yr
			and   levy_run_id   = @levy_run_id
			and   stmnt_id      = @stmnt_id
			and   entity_id     = @entity_4_id
		
		end
	end
	

	/* process entity 5 */
	if (@entity_5_id <> 0)
	begin
		if (@entity_5_tax_amt is null)
		begin
			select @entity_5_tax_amt = 0
		end

		if not exists (select * from transfer_tax_stmnt_entity_totals_temp
		       where levy_group_id = @levy_group_id
		       and   levy_run_id   = @levy_run_id
		       and   levy_group_yr = @levy_group_yr
		       and   stmnt_id      = @stmnt_id
		       and   entity_id     = @entity_5_id)
		begin
			insert into transfer_tax_stmnt_entity_totals_temp
			(
			levy_group_id, 
			levy_group_yr, 
			levy_run_id, 
			stmnt_id,   
			entity_id,   
			tax_amt,
			taxable_val,
			tax_rate      
			)
			values
			(
			@levy_group_id, 
			@levy_group_yr, 
			@levy_run_id, 
			@stmnt_id,   
			@entity_5_id,   
			@entity_5_tax_amt,
			@entity_5_taxable,
			@entity_5_tax_rate      
			)
		end
		else
		begin
			update transfer_tax_stmnt_entity_totals_temp
			set tax_amt = tax_amt + @entity_5_tax_amt,
			      taxable_val = taxable_val + @entity_5_taxable
			where levy_group_id = @levy_group_id
			and   levy_group_yr = @levy_group_yr
			and   levy_run_id   = @levy_run_id
			and   stmnt_id      = @stmnt_id
			and   entity_id     = @entity_5_id
		
		end
	end


	
	/* process entity 6 */
	if (@entity_6_id <> 0)
	begin
		if (@entity_6_tax_amt is null)
		begin
			select @entity_6_tax_amt = 0
		end


		if not exists (select * from transfer_tax_stmnt_entity_totals_temp
		       where levy_group_id = @levy_group_id
		       and   levy_run_id   = @levy_run_id
		       and   levy_group_yr = @levy_group_yr
		       and   stmnt_id      = @stmnt_id
		       and   entity_id     = @entity_6_id)
		begin
			insert into transfer_tax_stmnt_entity_totals_temp
			(
			levy_group_id, 
			levy_group_yr, 
			levy_run_id, 
			stmnt_id,   
			entity_id,   
			tax_amt,
			taxable_val,
			tax_rate      
			)
			values
			(
			@levy_group_id, 
			@levy_group_yr, 
			@levy_run_id, 
			@stmnt_id,   
			@entity_6_id,   
			@entity_6_tax_amt,
			@entity_6_taxable,
			@entity_6_tax_rate      
			)
		end
		else
		begin
			update transfer_tax_stmnt_entity_totals_temp
			set tax_amt = tax_amt + @entity_6_tax_amt,
			      taxable_val = taxable_val + @entity_6_taxable
			where levy_group_id = @levy_group_id
			and   levy_group_yr = @levy_group_yr
			and   levy_run_id   = @levy_run_id
			and   stmnt_id      = @stmnt_id
			and   entity_id     = @entity_6_id
		
		end
	end

	
	/* process entity 7 */
	if (@entity_7_id <> 0)
	begin
		if (@entity_7_tax_amt is null)
		begin
			select @entity_7_tax_amt = 0
		end
	
		if not exists (select * from transfer_tax_stmnt_entity_totals_temp
		       where levy_group_id = @levy_group_id
		       and   levy_run_id   = @levy_run_id
		       and   levy_group_yr = @levy_group_yr
		       and   stmnt_id      = @stmnt_id
		       and   entity_id     = @entity_7_id)
		begin
			insert into transfer_tax_stmnt_entity_totals_temp
			(
			levy_group_id, 
			levy_group_yr, 
			levy_run_id, 
			stmnt_id,   
			entity_id,   
			tax_amt,
			taxable_val,
			tax_rate      
			)
			values
			(
			@levy_group_id, 
			@levy_group_yr, 
			@levy_run_id, 
			@stmnt_id,   
			@entity_7_id,   
			@entity_7_tax_amt,
			@entity_7_taxable,
			@entity_7_tax_rate      
			)
		end
		else
		begin
			update transfer_tax_stmnt_entity_totals_temp
			set tax_amt = tax_amt + @entity_7_tax_amt,
			      taxable_val = taxable_val + @entity_7_taxable
			where levy_group_id = @levy_group_id
			and   levy_group_yr = @levy_group_yr
			and   levy_run_id   = @levy_run_id
			and   stmnt_id      = @stmnt_id
			and   entity_id     = @entity_7_id
		
		end
	end


	/* process entity 8 */
	if (@entity_8_id <> 0)
	begin
		if not exists (select * from transfer_tax_stmnt_entity_totals_temp
		       where levy_group_id = @levy_group_id
		       and   levy_run_id   = @levy_run_id
		       and   levy_group_yr = @levy_group_yr
		       and   stmnt_id      = @stmnt_id
		       and   entity_id     = @entity_8_id)
		begin
			insert into transfer_tax_stmnt_entity_totals_temp
			(
			levy_group_id, 
			levy_group_yr, 
			levy_run_id, 
			stmnt_id,   
			entity_id,   
			tax_amt,
			taxable_val,
			tax_rate      
			)
			values
			(
			@levy_group_id, 
			@levy_group_yr, 
			@levy_run_id, 
			@stmnt_id,   
			@entity_8_id,   
			@entity_8_tax_amt,
			@entity_8_taxable,
			@entity_8_tax_rate     
			)
		end
		else
		begin
			update transfer_tax_stmnt_entity_totals_temp
			set tax_amt = tax_amt + @entity_8_tax_amt,
			      taxable_val = taxable_val + @entity_8_taxable
			where levy_group_id = @levy_group_id
			and   levy_group_yr = @levy_group_yr
			and   levy_run_id   = @levy_run_id
			and   stmnt_id      = @stmnt_id
			and   entity_id     = @entity_8_id
		
		end
	end


	
	/* process entity 9 */
	if (@entity_9_id <> 0)
	begin
		if not exists (select * from transfer_tax_stmnt_entity_totals_temp
		       where levy_group_id = @levy_group_id
		       and   levy_run_id   = @levy_run_id
		       and   levy_group_yr = @levy_group_yr
		       and   stmnt_id      = @stmnt_id
		       and   entity_id     = @entity_9_id)
		begin
			insert into transfer_tax_stmnt_entity_totals_temp
			(
			levy_group_id, 
			levy_group_yr, 
			levy_run_id, 
			stmnt_id,   
			entity_id,   
			tax_amt,
			taxable_val,
			tax_rate      
			)
			values
			(
			@levy_group_id, 
			@levy_group_yr, 
			@levy_run_id, 
			@stmnt_id,   
			@entity_9_id,   
			@entity_9_tax_amt,
			@entity_9_taxable,
			@entity_9_tax_rate     
			)
		end
		else
		begin
			update transfer_tax_stmnt_entity_totals_temp
			set tax_amt = tax_amt + @entity_9_tax_amt,
			      taxable_val = taxable_val + @entity_9_taxable
			where levy_group_id = @levy_group_id
			and   levy_group_yr = @levy_group_yr
			and   levy_run_id   = @levy_run_id
			and   stmnt_id      = @stmnt_id
			and   entity_id     = @entity_9_id
		
		end
	end


	
	/* process entity 10 */
	if (@entity_10_id <> 0)
	begin
		if not exists (select * from transfer_tax_stmnt_entity_totals_temp
		       where levy_group_id = @levy_group_id
		       and   levy_run_id   = @levy_run_id
		       and   levy_group_yr = @levy_group_yr
		       and   stmnt_id      = @stmnt_id
		       and   entity_id     = @entity_10_id)
		begin
			insert into transfer_tax_stmnt_entity_totals_temp
			(
			levy_group_id, 
			levy_group_yr, 
			levy_run_id, 
			stmnt_id,   
			entity_id,   
			tax_amt,
			taxable_val,
			tax_rate      
			)
			values
			(
			@levy_group_id, 
			@levy_group_yr, 
			@levy_run_id, 
			@stmnt_id,   
			@entity_10_id,   
			@entity_10_tax_amt,
			@entity_10_taxable,
			@entity_10_tax_rate      
			)
		end
		else
		begin
			update transfer_tax_stmnt_entity_totals_temp
			set tax_amt = tax_amt + @entity_10_tax_amt,
			      taxable_val = taxable_val + @entity_10_taxable
			where levy_group_id = @levy_group_id
			and   levy_group_yr = @levy_group_yr
			and   levy_run_id   = @levy_run_id
			and   stmnt_id      = @stmnt_id
			and   entity_id     = @entity_10_id
		
		end
	end

	fetch next from stmnt_cursor into 
		@levy_group_id,
		@levy_group_yr,
		@levy_run_id,
		@stmnt_id,
		@prop_id,
		@owner_id,
		@entity_1_id,
		@entity_1_tax_amt,
		@entity_1_taxable,
		@entity_1_tax_rate,
		@entity_2_id,
		@entity_2_tax_amt,
		@entity_2_taxable,
		@entity_2_tax_rate,
		@entity_3_id,
		@entity_3_tax_amt,
		@entity_3_taxable,
		@entity_3_tax_rate,
		@entity_4_id,
		@entity_4_tax_amt,
		@entity_4_taxable,
		@entity_4_tax_rate,
		@entity_5_id,
		@entity_5_tax_amt,
		@entity_5_taxable,
		@entity_5_tax_rate,
		@entity_6_id,
		@entity_6_tax_amt,
		@entity_6_taxable,
		@entity_6_tax_rate,
		@entity_7_id,
		@entity_7_tax_amt,
		@entity_7_taxable,
		@entity_7_tax_rate,
		@entity_8_id,
		@entity_8_tax_amt,
		@entity_8_taxable,
		@entity_8_tax_rate,
		@entity_9_id,
		@entity_9_tax_amt,
		@entity_9_taxable,
		@entity_9_tax_rate,
		@entity_10_id,
		@entity_10_tax_amt,
		@entity_10_taxable,
		@entity_10_tax_rate
end

close stmnt_cursor
deallocate stmnt_cursor

GO


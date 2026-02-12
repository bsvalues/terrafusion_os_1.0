







CREATE procedure CreateTransferTaxStmntEntityTotals

@input_group_id	int,
@input_run_id		int,
@input_stmnt_yr		numeric(4),
@input_sup_num	int

as

declare @levy_group_id		int
declare @levy_group_yr		numeric(4)
declare @levy_run_id		int
declare @stmnt_id		int
declare @entity_id		int
declare @entity_name		varchar(70)
declare @entity_tax_amt		numeric(14,2)
declare @taxable_val		numeric(14)
declare @tax_rate		numeric(13,10)


declare @entity_1_id		int
declare @entity_1_name		varchar(70)
declare @entity_1_tax_amt	numeric(14,2)
declare @entity_1_taxable	numeric(14)
declare @entity_1_tax_rate	numeric(13,10)
declare @entity_2_id		int
declare @entity_2_name		varchar(70)
declare @entity_2_tax_amt	numeric(14,2)
declare @entity_2_taxable	numeric(14)
declare @entity_2_tax_rate	numeric(13,10)
declare @entity_3_id		int
declare @entity_3_name		varchar(70)
declare @entity_3_tax_amt	numeric(14,2)
declare @entity_3_taxable	numeric(14)
declare @entity_3_tax_rate	numeric(13,10)
declare @entity_4_id		int
declare @entity_4_name		varchar(70)
declare @entity_4_tax_amt	numeric(14,2)
declare @entity_4_taxable	numeric(14)
declare @entity_4_tax_rate	numeric(13,10)
declare @entity_5_id		int
declare @entity_5_name		varchar(70)
declare @entity_5_tax_amt	numeric(14,2)
declare @entity_5_taxable	numeric(14)
declare @entity_5_tax_rate	numeric(13,10)
declare @entity_6_id		int
declare @entity_6_name		varchar(70)
declare @entity_6_tax_amt	numeric(14,2)
declare @entity_6_taxable	numeric(14)
declare @entity_6_tax_rate	numeric(13,10)
declare @entity_7_id		int
declare @entity_7_name		varchar(70)
declare @entity_7_tax_amt	numeric(14,2)
declare @entity_7_taxable	numeric(14)
declare @entity_7_tax_rate	numeric(13,10)
declare @entity_8_id		int
declare @entity_8_name		varchar(70)
declare @entity_8_tax_amt	numeric(14,2)
declare @entity_8_taxable	numeric(14)
declare @entity_8_tax_rate	numeric(13,10)
declare @entity_9_id		int
declare @entity_9_name		varchar(70)
declare @entity_9_tax_amt	numeric(14,2)
declare @entity_9_taxable	numeric(14)
declare @entity_9_tax_rate	numeric(13,10)
declare @entity_10_id		int
declare @entity_10_name		varchar(70)
declare @entity_10_tax_amt	numeric(14,2)
declare @entity_10_taxable	numeric(14)
declare @entity_10_tax_rate	numeric(13,10)
declare @entity_11_id		int
declare @entity_11_name		varchar(70)
declare @entity_11_tax_amt	numeric(14,2)
declare @entity_11_taxable	numeric(14)
declare @entity_11_tax_rate	numeric(13,10)
declare @entity_12_id		int
declare @entity_12_name		varchar(70)
declare @entity_12_tax_amt	numeric(14,2)
declare @entity_12_taxable	numeric(14)
declare @entity_12_tax_rate	numeric(13,10)
declare @entity_13_id		int
declare @entity_13_name		varchar(70)
declare @entity_13_tax_amt	numeric(14,2)
declare @entity_13_taxable	numeric(14)
declare @entity_13_tax_rate	numeric(13,10)
declare @entity_14_id		int
declare @entity_14_name		varchar(70)
declare @entity_14_tax_amt	numeric(14,2)
declare @entity_14_taxable	numeric(14)
declare @entity_14_tax_rate	numeric(13,10)
declare @entity_15_id		int
declare @entity_15_name		varchar(70)
declare @entity_15_tax_amt	numeric(14,2)
declare @entity_15_taxable	numeric(14)
declare @entity_15_tax_rate	numeric(13,10)
declare @entity_16_id		int
declare @entity_16_name		varchar(70)
declare @entity_16_tax_amt	numeric(14,2)
declare @entity_16_taxable	numeric(14)
declare @entity_16_tax_rate	numeric(13,10)
declare @entity_17_id		int
declare @entity_17_name		varchar(70)
declare @entity_17_tax_amt	numeric(14,2)
declare @entity_17_taxable	numeric(14)
declare @entity_17_tax_rate	numeric(13,10)
declare @entity_18_id		int
declare @entity_18_name		varchar(70)
declare @entity_18_tax_amt	numeric(14,2)
declare @entity_18_taxable	numeric(14)
declare @entity_18_tax_rate	numeric(13,10)
declare @entity_19_id		int
declare @entity_19_name		varchar(70)
declare @entity_19_tax_amt	numeric(14,2)
declare @entity_19_taxable	numeric(14)
declare @entity_19_tax_rate	numeric(13,10)
declare @entity_20_id		int
declare @entity_20_name		varchar(70)
declare @entity_20_tax_amt	numeric(14,2)
declare @entity_20_taxable	numeric(14)
declare @entity_20_tax_rate	numeric(13,10)
declare @entity_21_id		int
declare @entity_21_name		varchar(70)
declare @entity_21_tax_amt	numeric(14,2)
declare @entity_21_taxable	numeric(14)
declare @entity_21_tax_rate	numeric(13,10)
declare @entity_22_id		int
declare @entity_22_name		varchar(70)
declare @entity_22_tax_amt	numeric(14,2)
declare @entity_22_taxable	numeric(14)
declare @entity_22_tax_rate	numeric(13,10)
declare @entity_23_id		int
declare @entity_23_name		varchar(70)
declare @entity_23_tax_amt	numeric(14,2)
declare @entity_23_taxable	numeric(14)
declare @entity_23_tax_rate	numeric(13,10)
declare @entity_24_id		int
declare @entity_24_name		varchar(70)
declare @entity_24_tax_amt	numeric(14,2)
declare @entity_24_taxable	numeric(14)
declare @entity_24_tax_rate	numeric(13,10)
declare @entity_25_id		int
declare @entity_25_name		varchar(70)
declare @entity_25_tax_amt	numeric(14,2)
declare @entity_25_taxable	numeric(14)
declare @entity_25_tax_rate	numeric(13,10)
declare @entity_26_id		int
declare @entity_26_name		varchar(70)
declare @entity_26_tax_amt	numeric(14,2)
declare @entity_26_taxable	numeric(14)
declare @entity_26_tax_rate	numeric(13,10)
declare @entity_27_id		int
declare @entity_27_name		varchar(70)
declare @entity_27_tax_amt	numeric(14,2)
declare @entity_27_taxable	numeric(14)
declare @entity_27_tax_rate	numeric(13,10)
declare @entity_28_id		int
declare @entity_28_name		varchar(70)
declare @entity_28_tax_amt	numeric(14,2)
declare @entity_28_taxable	numeric(14)
declare @entity_28_tax_rate	numeric(13,10)
declare @entity_29_id		int
declare @entity_29_name		varchar(70)
declare @entity_29_tax_amt	numeric(14,2)
declare @entity_29_taxable	numeric(14)
declare @entity_29_tax_rate	numeric(13,10)
declare @entity_30_id		int
declare @entity_30_name		varchar(70)
declare @entity_30_tax_amt	numeric(14,2)
declare @entity_30_taxable	numeric(14)
declare @entity_30_tax_rate	numeric(13,10)



declare @use_entity1		int
declare @use_entity2		int
declare @use_entity3		int
declare @use_entity4		int
declare @use_entity5		int
declare @use_entity6		int
declare @use_entity7		int
declare @use_entity8		int
declare @use_entity9		int
declare @use_entity10		int
declare @use_entity11		int
declare @use_entity12		int
declare @use_entity13		int
declare @use_entity14		int
declare @use_entity15		int
declare @use_entity16		int
declare @use_entity17		int
declare @use_entity18		int
declare @use_entity19		int
declare @use_entity20		int
declare @use_entity21		int
declare @use_entity22		int
declare @use_entity23		int
declare @use_entity24		int
declare @use_entity25		int
declare @use_entity26		int
declare @use_entity27		int
declare @use_entity28		int
declare @use_entity29		int
declare @use_entity30		int

declare @prev_stmnt_id		int
select @prev_stmnt_id	= 0


insert into transfer_tax_stmnt_entity_totals
(
levy_group_id,
levy_group_yr,
levy_run_id,
stmnt_id
)
select distinct
	levy_group_id,
	levy_group_yr,
	levy_run_id,
	stmnt_id
from   transfer_tax_stmnt
where  levy_group_id = @input_group_id
and    levy_group_yr = @input_stmnt_yr
and    levy_run_id   = @input_run_id

declare entity_temp_cursor SCROLL CURSOR
    FOR select 	distinct
		levy_group_id,
		levy_group_yr,
		levy_run_id,
		stmnt_id,
		entity_id,
		tax_amt,
		taxable_val,	
		tax_rate,
		file_as_name
    from   transfer_tax_stmnt_entity_totals_temp, account
    where  levy_group_id = @input_group_id
    and    levy_group_yr = @input_stmnt_yr
    and    levy_run_id   = @input_run_id
    and    entity_id     = acct_id
    order by stmnt_id, entity_id
   
open entity_temp_cursor
fetch next from entity_temp_cursor into 
		@levy_group_id,
		@levy_group_yr,
		@levy_run_id,
		@stmnt_id,

		@entity_id,
		@entity_tax_amt,
		@taxable_val,
		@tax_rate,
		@entity_name

while (@@FETCH_STATUS = 0)
begin

	if (@prev_stmnt_id <> @stmnt_id)
	begin
		
		update transfer_tax_stmnt_entity_totals
		set entity_1_id 	= @entity_1_id,
		    entity_1_name 	= @entity_1_name,
		    entity_1_tax_amt 	= @entity_1_tax_amt,
		    entity_1_taxable 	= @entity_1_taxable,
		    entity_1_tax_rate	= @entity_1_tax_rate,
		    entity_2_id 	= @entity_2_id,
		    entity_2_name 	= @entity_2_name,
		    entity_2_tax_amt 	= @entity_2_tax_amt,
		    entity_2_taxable 	= @entity_2_taxable,
		    entity_2_tax_rate	= @entity_2_tax_rate,
		    entity_3_id 	= @entity_3_id,
		    entity_3_name 	= @entity_3_name,
		    entity_3_tax_amt 	= @entity_3_tax_amt,
		    entity_3_taxable 	= @entity_3_taxable,
		    entity_3_tax_rate	= @entity_3_tax_rate,
		    entity_4_id 	= @entity_4_id,
		    entity_4_name 	= @entity_4_name,
		    entity_4_tax_amt 	= @entity_4_tax_amt,
		    entity_4_taxable 	= @entity_4_taxable,
		    entity_4_tax_rate	= @entity_4_tax_rate,
		    entity_5_id 	= @entity_5_id,
		    entity_5_name 	= @entity_5_name,
		    entity_5_tax_amt 	= @entity_5_tax_amt,
		    entity_5_taxable 	= @entity_5_taxable,
		    entity_5_tax_rate	= @entity_5_tax_rate,
		    entity_6_id 	= @entity_6_id,
		    entity_6_name 	= @entity_6_name,
		    entity_6_tax_amt 	= @entity_6_tax_amt,
		    entity_6_taxable 	= @entity_6_taxable,
		    entity_6_tax_rate	= @entity_6_tax_rate,
		    entity_7_id 	= @entity_7_id,
		    entity_7_name 	= @entity_7_name,
		    entity_7_tax_amt 	= @entity_7_tax_amt,
	            entity_7_taxable 	= @entity_7_taxable,
		    entity_7_tax_rate	= @entity_7_tax_rate,
		    entity_8_id 	= @entity_8_id,
		    entity_8_name 	= @entity_8_name,
		    entity_8_tax_amt 	= @entity_8_tax_amt,
		    entity_8_taxable 	= @entity_8_taxable,
		    entity_8_tax_rate	= @entity_8_tax_rate,
		    entity_9_id 	= @entity_9_id,
		    entity_9_name 	= @entity_9_name,
		    entity_9_tax_amt 	= @entity_9_tax_amt,
		    entity_9_taxable 	= @entity_9_taxable,
		    entity_9_tax_rate	= @entity_9_tax_rate,
		    entity_10_id 	= @entity_10_id,
		    entity_10_name 	= @entity_10_name,
		    entity_10_tax_amt 	= @entity_10_tax_amt,
		    entity_10_taxable 	= @entity_10_taxable,
		    entity_10_tax_rate	= @entity_10_tax_rate,

		    entity_11_id 	= @entity_11_id,
		    entity_11_name 	= @entity_11_name,
		    entity_11_tax_amt 	= @entity_11_tax_amt,
		    entity_11_taxable 	= @entity_11_taxable,
		    entity_11_tax_rate	= @entity_11_tax_rate,
		    entity_12_id 	= @entity_12_id,
		    entity_12_name 	= @entity_12_name,
		    entity_12_tax_amt 	= @entity_12_tax_amt,
		    entity_12_taxable 	= @entity_12_taxable,
		    entity_12_tax_rate	= @entity_12_tax_rate,
		    entity_13_id 	= @entity_13_id,
		    entity_13_name 	= @entity_13_name,
		    entity_13_tax_amt 	= @entity_13_tax_amt,
		    entity_13_taxable 	= @entity_13_taxable,
		    entity_13_tax_rate	= @entity_13_tax_rate,
		    entity_14_id 	= @entity_14_id,
		    entity_14_name 	= @entity_14_name,
		    entity_14_tax_amt 	= @entity_14_tax_amt,
		    entity_14_taxable 	= @entity_14_taxable,
		    entity_14_tax_rate	= @entity_14_tax_rate,
		    entity_15_id 	= @entity_15_id,
		    entity_15_name 	= @entity_15_name,
		    entity_15_tax_amt 	= @entity_15_tax_amt,
		    entity_15_taxable 	= @entity_15_taxable,
		    entity_15_tax_rate	= @entity_15_tax_rate,
		    entity_16_id 	= @entity_16_id,
		    entity_16_name 	= @entity_16_name,
		    entity_16_tax_amt 	= @entity_16_tax_amt,
		    entity_16_taxable 	= @entity_16_taxable,
		    entity_16_tax_rate	= @entity_16_tax_rate,
		    entity_17_id 	= @entity_17_id,
		    entity_17_name 	= @entity_17_name,
		    entity_17_tax_amt 	= @entity_17_tax_amt,	
		    entity_17_taxable 	= @entity_17_taxable,
		    entity_17_tax_rate	= @entity_17_tax_rate,
		    entity_18_id 	= @entity_18_id,
		    entity_18_name 	= @entity_18_name,
		    entity_18_tax_amt 	= @entity_18_tax_amt,
		    entity_18_taxable 	= @entity_18_taxable,
		    entity_18_tax_rate	= @entity_18_tax_rate,
		    entity_19_id 	= @entity_19_id,
		    entity_19_name 	= @entity_19_name,
		    entity_19_tax_amt 	= @entity_19_tax_amt,
		    entity_19_taxable 	= @entity_19_taxable,
		    entity_19_tax_rate	= @entity_19_tax_rate,
		    entity_20_id 	= @entity_20_id,
		    entity_20_name 	= @entity_20_name,
		    entity_20_tax_amt 	= @entity_20_tax_amt,
		    entity_20_taxable 	= @entity_20_taxable,
		    entity_20_tax_rate	= @entity_20_tax_rate,

		    entity_21_id 	= @entity_21_id,
		    entity_21_name 	= @entity_21_name,
		    entity_21_tax_amt 	= @entity_21_tax_amt,
		    entity_21_taxable 	= @entity_21_taxable,
		    entity_21_tax_rate	= @entity_21_tax_rate,
		    entity_22_id 	= @entity_22_id,
		    entity_22_name 	= @entity_22_name,
		    entity_22_tax_amt 	= @entity_22_tax_amt,
		    entity_22_taxable 	= @entity_22_taxable,
		    entity_22_tax_rate	= @entity_22_tax_rate,
		    entity_23_id 	= @entity_23_id,
		    entity_23_name 	= @entity_23_name,
		    entity_23_tax_amt 	= @entity_23_tax_amt,
		    entity_23_taxable 	= @entity_23_taxable,
		    entity_23_tax_rate	= @entity_23_tax_rate,
		    entity_24_id 	= @entity_24_id,
		    entity_24_name 	= @entity_24_name,
		    entity_24_tax_amt 	= @entity_24_tax_amt,
		    entity_24_taxable 	= @entity_24_taxable,
		    entity_24_tax_rate	= @entity_24_tax_rate,
		    entity_25_id 	= @entity_25_id,
		    entity_25_name 	= @entity_25_name,
		    entity_25_tax_amt 	= @entity_25_tax_amt,
		    entity_25_taxable 	= @entity_25_taxable,
		    entity_25_tax_rate	= @entity_25_tax_rate,
		    entity_26_id 	= @entity_26_id,
		    entity_26_name 	= @entity_26_name,
		    entity_26_tax_amt 	= @entity_26_tax_amt,
		    entity_26_taxable 	= @entity_26_taxable,
		    entity_26_tax_rate	= @entity_26_tax_rate,
		    entity_27_id 	= @entity_27_id,
		    entity_27_name 	= @entity_27_name,
		    entity_27_tax_amt 	= @entity_27_tax_amt,
		    entity_27_taxable 	= @entity_27_taxable,
		    entity_27_tax_rate	= @entity_27_tax_rate,
		    entity_28_id 	= @entity_28_id,
		    entity_28_name 	= @entity_28_name,
		    entity_28_tax_amt 	= @entity_28_tax_amt,
		    entity_28_taxable 	= @entity_20_taxable,
		    entity_28_tax_rate	= @entity_20_tax_rate,
		    entity_29_id 	= @entity_29_id,
		    entity_29_name 	= @entity_29_name,
		    entity_29_tax_amt 	= @entity_29_tax_amt,
		    entity_29_taxable 	= @entity_29_taxable,
		    entity_29_tax_rate	= @entity_29_tax_rate,
		    entity_30_id 	= @entity_30_id,
		    entity_30_name 	= @entity_30_name,
		    entity_30_tax_amt 	= @entity_30_tax_amt,
		    entity_30_taxable 	= @entity_30_taxable,
		    entity_30_tax_rate	= @entity_30_tax_rate
       
		where  levy_group_id = @input_group_id
    		and    levy_group_yr = @input_stmnt_yr
    		and    levy_run_id   = @input_run_id
		and    stmnt_id      = @prev_stmnt_id

		select @prev_stmnt_id = @stmnt_id
		
		select @use_entity1 = 1
		select @use_entity2 = 1
		select @use_entity3 = 1
		select @use_entity4 = 1
		select @use_entity5 = 1
		select @use_entity6 = 1
		select @use_entity7 = 1
		select @use_entity8 = 1
		select @use_entity9 = 1
		select @use_entity10 = 1
		select @use_entity11 = 1
		select @use_entity12 = 1
		select @use_entity13 = 1
		select @use_entity14 = 1
		select @use_entity15 = 1
		select @use_entity16 = 1
		select @use_entity17 = 1
		select @use_entity18 = 1
		select @use_entity19 = 1
		select @use_entity20 = 1
		select @use_entity21 = 1
		select @use_entity22 = 1
		select @use_entity23 = 1
		select @use_entity24 = 1
		select @use_entity25 = 1
		select @use_entity26 = 1
		select @use_entity27 = 1
		select @use_entity28 = 1
		select @use_entity29 = 1
		select @use_entity30 = 1

		select @entity_1_id      = NULL
		select @entity_1_name    = NULL
		select @entity_1_tax_amt = NULL
		select @entity_1_taxable = NULL
		select @entity_1_tax_rate= NULL

		select @entity_2_id      = NULL
		select @entity_2_name    = NULL
		select @entity_2_tax_amt = NULL
		select @entity_2_taxable = NULL
		select @entity_2_tax_rate= NULL
		select @entity_3_id      = NULL
		select @entity_3_name    = NULL
		select @entity_3_tax_amt = NULL
		select @entity_3_taxable = NULL
		select @entity_3_tax_rate= NULL
		select @entity_4_id      = NULL
		select @entity_4_name    = NULL
		select @entity_4_tax_amt = NULL
		select @entity_4_taxable = NULL
		select @entity_4_tax_rate= NULL
		select @entity_5_id      = NULL
		select @entity_5_name    = NULL
		select @entity_5_tax_amt = NULL
		select @entity_5_taxable = NULL
		select @entity_5_tax_rate= NULL
		select @entity_6_id      = NULL
		select @entity_6_name    = NULL
		select @entity_6_tax_amt = NULL
		select @entity_6_taxable = NULL
		select @entity_6_tax_rate= NULL
		select @entity_7_id      = NULL
		select @entity_7_name    = NULL
		select @entity_7_tax_amt = NULL
		select @entity_7_taxable = NULL
		select @entity_7_tax_rate= NULL
		select @entity_8_id      = NULL
		select @entity_8_name    = NULL
		select @entity_8_tax_amt = NULL
		select @entity_8_taxable = NULL
		select @entity_8_tax_rate= NULL
		select @entity_9_id      = NULL
		select @entity_9_name    = NULL
		select @entity_9_tax_amt = NULL
		select @entity_9_taxable = NULL
		select @entity_9_tax_rate= NULL
		select @entity_10_id      = NULL
		select @entity_10_name    = NULL
		select @entity_10_tax_amt = NULL
		select @entity_10_taxable = NULL
		select @entity_10_tax_rate= NULL

		select @entity_11_id      = NULL
		select @entity_11_name    = NULL
		select @entity_11_tax_amt = NULL
		select @entity_11_taxable = NULL
		select @entity_11_tax_rate= NULL
		select @entity_12_id      = NULL
		select @entity_12_name    = NULL
		select @entity_12_tax_amt = NULL
		select @entity_12_taxable = NULL
		select @entity_12_tax_rate= NULL
		select @entity_13_id      = NULL
		select @entity_13_name    = NULL
		select @entity_13_tax_amt = NULL
		select @entity_13_taxable = NULL
		select @entity_13_tax_rate= NULL
		select @entity_14_id      = NULL
		select @entity_14_name    = NULL
		select @entity_14_tax_amt = NULL
		select @entity_14_taxable = NULL
		select @entity_14_tax_rate= NULL
		select @entity_15_id      = NULL
		select @entity_15_name    = NULL
		select @entity_15_tax_amt = NULL
		select @entity_15_taxable = NULL
		select @entity_15_tax_rate= NULL
		select @entity_16_id      = NULL
		select @entity_16_name    = NULL
		select @entity_16_tax_amt = NULL
		select @entity_16_taxable = NULL
		select @entity_16_tax_rate= NULL
		select @entity_17_id      = NULL
		select @entity_17_name    = NULL
		select @entity_17_tax_amt = NULL
		select @entity_17_taxable = NULL
		select @entity_17_tax_rate= NULL
		select @entity_18_id      = NULL
		select @entity_18_name    = NULL
		select @entity_18_tax_amt = NULL
		select @entity_18_taxable = NULL
		select @entity_18_tax_rate= NULL
		select @entity_19_id      = NULL
		select @entity_19_name    = NULL
		select @entity_19_tax_amt = NULL
		select @entity_19_taxable = NULL
		select @entity_19_tax_rate= NULL
		select @entity_20_id      = NULL
		select @entity_20_name    = NULL
		select @entity_20_tax_amt = NULL
		select @entity_1_taxable = NULL
		select @entity_1_tax_rate= NULL

		select @entity_21_id      = NULL
		select @entity_21_name    = NULL
		select @entity_21_tax_amt = NULL
		select @entity_21_taxable = NULL
		select @entity_21_tax_rate= NULL
		select @entity_22_id      = NULL
		select @entity_22_name    = NULL
		select @entity_22_tax_amt = NULL
		select @entity_22_taxable = NULL
		select @entity_22_tax_rate= NULL
		select @entity_23_id      = NULL
		select @entity_23_name    = NULL
		select @entity_23_tax_amt = NULL
		select @entity_23_taxable = NULL

		select @entity_23_tax_rate= NULL
		select @entity_24_id      = NULL
		select @entity_24_name    = NULL
		select @entity_24_tax_amt = NULL
		select @entity_24_taxable = NULL
		select @entity_24_tax_rate= NULL
		select @entity_25_id      = NULL
		select @entity_25_name    = NULL
		select @entity_25_tax_amt = NULL
		select @entity_25_taxable = NULL
		select @entity_25_tax_rate= NULL
		select @entity_26_id      = NULL
		select @entity_26_name    = NULL
		select @entity_26_tax_amt = NULL
		select @entity_26_taxable = NULL
		select @entity_26_tax_rate= NULL
		select @entity_27_id      = NULL
		select @entity_27_name    = NULL
		select @entity_27_tax_amt = NULL
		select @entity_27_taxable = NULL
		select @entity_27_tax_rate= NULL
		select @entity_28_id      = NULL
		select @entity_28_name    = NULL
		select @entity_28_tax_amt = NULL
		select @entity_28_taxable = NULL
		select @entity_28_tax_rate= NULL
		select @entity_29_id      = NULL
		select @entity_29_name    = NULL
		select @entity_29_tax_amt = NULL
		select @entity_29_taxable = NULL
		select @entity_29_tax_rate= NULL
		select @entity_30_id      = NULL
		select @entity_30_name    = NULL
		select @entity_30_tax_amt = NULL
		select @entity_30_taxable = NULL
		select @entity_30_tax_rate= NULL
	end

	if (@use_entity1 = 1)
	begin
		
		select @entity_1_id       = @entity_id
		select @entity_1_name     = @entity_name
		select @entity_1_tax_amt  = @entity_tax_amt
		select @entity_1_taxable  = @taxable_val
		select @entity_1_tax_rate = @tax_rate
					
		select @use_entity1 = 0
	end
	else if (@use_entity2 = 1)
	begin
		
		select @entity_2_id       = @entity_id
		select @entity_2_name     = @entity_name
		select @entity_2_tax_amt  = @entity_tax_amt
		select @entity_2_taxable  = @taxable_val
		select @entity_2_tax_rate = @tax_rate
					
		select @use_entity2 = 0
	end
	else if (@use_entity3 = 1)
	begin
		
		select @entity_3_id       = @entity_id
		select @entity_3_name     = @entity_name
		select @entity_3_tax_amt  = @entity_tax_amt
		select @entity_3_taxable  = @taxable_val
		select @entity_3_tax_rate = @tax_rate
					
		select @use_entity3 = 0
	end
	else if (@use_entity4 = 1)
	begin
		
		select @entity_4_id       = @entity_id
		select @entity_4_name     = @entity_name
		select @entity_4_tax_amt  = @entity_tax_amt
		select @entity_4_taxable  = @taxable_val
		select @entity_4_tax_rate = @tax_rate
					
		select @use_entity4 = 0
	end
	else if (@use_entity5 = 1)
	begin
		
		select @entity_5_id       = @entity_id
		select @entity_5_name     = @entity_name
		select @entity_5_tax_amt  = @entity_tax_amt
		select @entity_5_taxable  = @taxable_val
		select @entity_5_tax_rate = @tax_rate
					
		select @use_entity5 = 0
	end
	else if (@use_entity6 = 1)
	begin
		
		select @entity_6_id       = @entity_id
		select @entity_6_name     = @entity_name
		select @entity_6_tax_amt  = @entity_tax_amt
		select @entity_6_taxable  = @taxable_val
		select @entity_6_tax_rate = @tax_rate
					
		select @use_entity6 = 0
	end
	else if (@use_entity7 = 1)
	begin
		
		select @entity_7_id       = @entity_id
		select @entity_7_name     = @entity_name
		select @entity_7_tax_amt  = @entity_tax_amt
		select @entity_7_taxable  = @taxable_val
		select @entity_7_tax_rate = @tax_rate
					
		select @use_entity7 = 0
	end
	else if (@use_entity8 = 1)
	begin
		
		select @entity_8_id       = @entity_id
		select @entity_8_name     = @entity_name
		select @entity_8_tax_amt  = @entity_tax_amt
		select @entity_8_taxable  = @taxable_val
		select @entity_8_tax_rate = @tax_rate
					
		select @use_entity8 = 0
	end
	else if (@use_entity9 = 1)
	begin
		
		select @entity_9_id       = @entity_id
		select @entity_9_name     = @entity_name
		select @entity_9_tax_amt  = @entity_tax_amt
		select @entity_9_taxable  = @taxable_val
		select @entity_9_tax_rate = @tax_rate
					
		select @use_entity9 = 0
	end
	else if (@use_entity10 = 1)
	begin
		
		select @entity_10_id       = @entity_id
		select @entity_10_name     = @entity_name
		select @entity_10_tax_amt  = @entity_tax_amt
		select @entity_10_taxable  = @taxable_val
		select @entity_10_tax_rate = @tax_rate
					
		select @use_entity10 = 0
	end

	else if (@use_entity11 = 1)
	begin
		
		select @entity_11_id       = @entity_id
		select @entity_11_name     = @entity_name
		select @entity_11_tax_amt  = @entity_tax_amt
		select @entity_11_taxable  = @taxable_val
		select @entity_11_tax_rate = @tax_rate
					
		select @use_entity11 = 0
	end

	else if (@use_entity12 = 1)
	begin
		
		select @entity_12_id       = @entity_id
		select @entity_12_name     = @entity_name
		select @entity_12_tax_amt  = @entity_tax_amt
		select @entity_12_taxable  = @taxable_val
		select @entity_12_tax_rate = @tax_rate
					
		select @use_entity12 = 0
	end
	else if (@use_entity13 = 1)
	begin
		
		select @entity_13_id       = @entity_id
		select @entity_13_name     = @entity_name
		select @entity_13_tax_amt  = @entity_tax_amt
		select @entity_13_taxable  = @taxable_val
		select @entity_13_tax_rate = @tax_rate
					
		select @use_entity13 = 0
	end
	else if (@use_entity14 = 1)
	begin
		
		select @entity_14_id       = @entity_id
		select @entity_14_name     = @entity_name
		select @entity_14_tax_amt  = @entity_tax_amt
		select @entity_14_taxable  = @taxable_val
		select @entity_14_tax_rate = @tax_rate
					
		select @use_entity14 = 0
	end
	else if (@use_entity15 = 1)
	begin
		
		select @entity_15_id       = @entity_id
		select @entity_15_name     = @entity_name
		select @entity_15_tax_amt  = @entity_tax_amt
		select @entity_15_taxable  = @taxable_val
		select @entity_15_tax_rate = @tax_rate
					
		select @use_entity15 = 0
	end
	else if (@use_entity16 = 1)
	begin
		
		select @entity_16_id       = @entity_id
		select @entity_16_name     = @entity_name
		select @entity_16_tax_amt  = @entity_tax_amt
		select @entity_16_taxable  = @taxable_val
		select @entity_16_tax_rate = @tax_rate
					
		select @use_entity16 = 0
	end
	else if (@use_entity17 = 1)
	begin
		
		select @entity_17_id       = @entity_id
		select @entity_17_name     = @entity_name
		select @entity_17_tax_amt  = @entity_tax_amt
		select @entity_17_taxable  = @taxable_val
		select @entity_17_tax_rate = @tax_rate
				
		select @use_entity17 = 0
	end
	else if (@use_entity18 = 1)
	begin
		
		select @entity_18_id       = @entity_id
		select @entity_18_name     = @entity_name
		select @entity_18_tax_amt  = @entity_tax_amt
		select @entity_18_taxable  = @taxable_val
		select @entity_18_tax_rate = @tax_rate
					
		select @use_entity18 = 0
	end
	else if (@use_entity19 = 1)
	begin
		
		select @entity_19_id       = @entity_id
		select @entity_19_name     = @entity_name
		select @entity_19_tax_amt  = @entity_tax_amt
		select @entity_19_taxable  = @taxable_val
		select @entity_19_tax_rate = @tax_rate
					
		select @use_entity19 = 0
	end
	else if (@use_entity20 = 1)
	begin
		
		select @entity_20_id       = @entity_id
		select @entity_20_name     = @entity_name
		select @entity_20_tax_amt  = @entity_tax_amt
		select @entity_20_taxable  = @taxable_val
		select @entity_20_tax_rate = @tax_rate
					
		select @use_entity20 = 0
	end
             else 	if (@use_entity21 = 1)
	begin
		
		select @entity_21_id       = @entity_id
		select @entity_21_name     = @entity_name
		select @entity_21_tax_amt  = @entity_tax_amt
		select @entity_21_taxable  = @taxable_val
		select @entity_21_tax_rate = @tax_rate
					
		select @use_entity21 = 0
	end
	else if (@use_entity22 = 1)
	begin
		
		select @entity_22_id       = @entity_id
		select @entity_22_name     = @entity_name
		select @entity_22_tax_amt  = @entity_tax_amt
		select @entity_22_taxable  = @taxable_val
		select @entity_22_tax_rate = @tax_rate
					
		select @use_entity22 = 0
	end
	else if (@use_entity23 = 1)
	begin
		
		select @entity_23_id       = @entity_id
		select @entity_23_name     = @entity_name
		select @entity_23_tax_amt  = @entity_tax_amt
		select @entity_23_taxable  = @taxable_val
		select @entity_23_tax_rate = @tax_rate
					
		select @use_entity23 = 0
	end
	else if (@use_entity24 = 1)
	begin
		
		select @entity_24_id       = @entity_id
		select @entity_24_name     = @entity_name
		select @entity_24_tax_amt  = @entity_tax_amt
		select @entity_24_taxable  = @taxable_val
		select @entity_24_tax_rate = @tax_rate
					
		select @use_entity24 = 0
	end
	else if (@use_entity25 = 1)
	begin
		
		select @entity_25_id       = @entity_id
		select @entity_25_name     = @entity_name
		select @entity_25_tax_amt  = @entity_tax_amt
		select @entity_25_taxable  = @taxable_val
		select @entity_25_tax_rate = @tax_rate
					
		select @use_entity25 = 0
	end
	else if (@use_entity26 = 1)
	begin
		
		select @entity_26_id       = @entity_id
		select @entity_26_name     = @entity_name
		select @entity_26_tax_amt  = @entity_tax_amt
		select @entity_26_taxable  = @taxable_val
		select @entity_26_tax_rate = @tax_rate
					
		select @use_entity26 = 0
	end
	else if (@use_entity27 = 1)
	begin
		
		select @entity_27_id       = @entity_id
		select @entity_27_name     = @entity_name
		select @entity_27_tax_amt  = @entity_tax_amt
		select @entity_27_taxable  = @taxable_val
		select @entity_27_tax_rate = @tax_rate
					
		select @use_entity27 = 0
	end
	else if (@use_entity28 = 1)
	begin
		
		select @entity_28_id       = @entity_id
		select @entity_28_name     = @entity_name
		select @entity_28_tax_amt  = @entity_tax_amt
		select @entity_28_taxable  = @taxable_val
		select @entity_28_tax_rate = @tax_rate
					
		select @use_entity28 = 0
	end
	else if (@use_entity29 = 1)
	begin
		
		select @entity_29_id       = @entity_id
		select @entity_29_name     = @entity_name
		select @entity_29_tax_amt  = @entity_tax_amt
		select @entity_29_taxable  = @taxable_val
		select @entity_29_tax_rate = @tax_rate
					
		select @use_entity29 = 0
	end
	else if (@use_entity30 = 1)
	begin
		
		select @entity_30_id       = @entity_id
		select @entity_30_name     = @entity_name
		select @entity_30_tax_amt  = @entity_tax_amt
		select @entity_30_taxable  = @taxable_val
		select @entity_30_tax_rate = @tax_rate
					
		select @use_entity30 = 0
	end
	
	

	fetch next from entity_temp_cursor into 
		@levy_group_id,
		@levy_group_yr,
		@levy_run_id,
		@stmnt_id,
		@entity_id,
		@entity_tax_amt,
		@taxable_val,
		@tax_rate,
		@entity_name
end


/* make the final update for the last statement id...*/
update transfer_tax_stmnt_entity_totals
		set entity_1_id 	= @entity_1_id,
		    entity_1_name 	= @entity_1_name,
		    entity_1_tax_amt 	= @entity_1_tax_amt,
		    entity_1_taxable 	= @entity_1_taxable,
		    entity_1_tax_rate	= @entity_1_tax_rate,
		    entity_2_id 	= @entity_2_id,
		    entity_2_name 	= @entity_2_name,
		    entity_2_tax_amt 	= @entity_2_tax_amt,
		    entity_2_taxable 	= @entity_2_taxable,
		    entity_2_tax_rate	= @entity_2_tax_rate,
		    entity_3_id 	= @entity_3_id,
		    entity_3_name 	= @entity_3_name,
		    entity_3_tax_amt 	= @entity_3_tax_amt,
		    entity_3_taxable 	= @entity_3_taxable,
		    entity_3_tax_rate	= @entity_3_tax_rate,
		    entity_4_id 	= @entity_4_id,
		    entity_4_name 	= @entity_4_name,
		    entity_4_tax_amt 	= @entity_4_tax_amt,
		    entity_4_taxable 	= @entity_4_taxable,
		    entity_4_tax_rate	= @entity_4_tax_rate,
		    entity_5_id 	= @entity_5_id,
		    entity_5_name 	= @entity_5_name,
		    entity_5_tax_amt 	= @entity_5_tax_amt,
		    entity_5_taxable 	= @entity_5_taxable,
		    entity_5_tax_rate	= @entity_5_tax_rate,
		    entity_6_id 	= @entity_6_id,
		    entity_6_name 	= @entity_6_name,
		    entity_6_tax_amt 	= @entity_6_tax_amt,
		    entity_6_taxable 	= @entity_6_taxable,
		    entity_6_tax_rate	= @entity_6_tax_rate,
		    entity_7_id 	= @entity_7_id,
		    entity_7_name 	= @entity_7_name,
		    entity_7_tax_amt 	= @entity_7_tax_amt,
	            entity_7_taxable 	= @entity_7_taxable,
		    entity_7_tax_rate	= @entity_7_tax_rate,
		    entity_8_id 	= @entity_8_id,
		    entity_8_name 	= @entity_8_name,
		    entity_8_tax_amt 	= @entity_8_tax_amt,
		    entity_8_taxable 	= @entity_8_taxable,
		    entity_8_tax_rate	= @entity_8_tax_rate,
		    entity_9_id 	= @entity_9_id,
		    entity_9_name 	= @entity_9_name,
		    entity_9_tax_amt 	= @entity_9_tax_amt,
		    entity_9_taxable 	= @entity_9_taxable,
		    entity_9_tax_rate	= @entity_9_tax_rate,
		    entity_10_id 	= @entity_10_id,
		    entity_10_name 	= @entity_10_name,
		    entity_10_tax_amt 	= @entity_10_tax_amt,
		    entity_10_taxable 	= @entity_10_taxable,
		    entity_10_tax_rate	= @entity_10_tax_rate,

		    entity_11_id 	= @entity_11_id,
		    entity_11_name 	= @entity_11_name,
		    entity_11_tax_amt 	= @entity_11_tax_amt,
		    entity_11_taxable 	= @entity_11_taxable,
		    entity_11_tax_rate	= @entity_11_tax_rate,
		    entity_12_id 	= @entity_12_id,
		    entity_12_name 	= @entity_12_name,
		    entity_12_tax_amt 	= @entity_12_tax_amt,
		    entity_12_taxable 	= @entity_12_taxable,
		    entity_12_tax_rate	= @entity_12_tax_rate,
		    entity_13_id 	= @entity_13_id,
		    entity_13_name 	= @entity_13_name,
		    entity_13_tax_amt 	= @entity_13_tax_amt,
		    entity_13_taxable 	= @entity_13_taxable,
		    entity_13_tax_rate	= @entity_13_tax_rate,
		    entity_14_id 	= @entity_14_id,
		    entity_14_name 	= @entity_14_name,
		    entity_14_tax_amt 	= @entity_14_tax_amt,
		    entity_14_taxable 	= @entity_14_taxable,
		    entity_14_tax_rate	= @entity_14_tax_rate,
		    entity_15_id 	= @entity_15_id,
		    entity_15_name 	= @entity_15_name,
		    entity_15_tax_amt 	= @entity_15_tax_amt,
		    entity_15_taxable 	= @entity_15_taxable,
		    entity_15_tax_rate	= @entity_15_tax_rate,
		    entity_16_id 	= @entity_16_id,
		    entity_16_name 	= @entity_16_name,
		    entity_16_tax_amt 	= @entity_16_tax_amt,
		    entity_16_taxable 	= @entity_16_taxable,
		    entity_16_tax_rate	= @entity_16_tax_rate,
		    entity_17_id 	= @entity_17_id,
		    entity_17_name 	= @entity_17_name,
		    entity_17_tax_amt 	= @entity_17_tax_amt,	
		    entity_17_taxable 	= @entity_17_taxable,
		    entity_17_tax_rate	= @entity_17_tax_rate,
		    entity_18_id 	= @entity_18_id,
		    entity_18_name 	= @entity_18_name,
		    entity_18_tax_amt 	= @entity_18_tax_amt,
		    entity_18_taxable 	= @entity_18_taxable,
		    entity_18_tax_rate	= @entity_18_tax_rate,
		    entity_19_id 	= @entity_19_id,
		    entity_19_name 	= @entity_19_name,
		    entity_19_tax_amt 	= @entity_19_tax_amt,
		    entity_19_taxable 	= @entity_19_taxable,
		    entity_19_tax_rate	= @entity_19_tax_rate,
		    entity_20_id 	= @entity_20_id,
		    entity_20_name 	= @entity_20_name,
		    entity_20_tax_amt 	= @entity_20_tax_amt,
		    entity_20_taxable 	= @entity_20_taxable,
		    entity_20_tax_rate	= @entity_20_tax_rate,

		    entity_21_id 	= @entity_21_id,
		    entity_21_name 	= @entity_21_name,
		    entity_21_tax_amt 	= @entity_21_tax_amt,
		    entity_21_taxable 	= @entity_21_taxable,
		    entity_21_tax_rate	= @entity_21_tax_rate,
		    entity_22_id 	= @entity_22_id,
		    entity_22_name 	= @entity_22_name,
		    entity_22_tax_amt 	= @entity_22_tax_amt,
		    entity_22_taxable 	= @entity_22_taxable,
		    entity_22_tax_rate	= @entity_22_tax_rate,
		    entity_23_id 	= @entity_23_id,
		    entity_23_name 	= @entity_23_name,
		    entity_23_tax_amt 	= @entity_23_tax_amt,
		    entity_23_taxable 	= @entity_23_taxable,
		    entity_23_tax_rate	= @entity_23_tax_rate,
		    entity_24_id 	= @entity_24_id,
		    entity_24_name 	= @entity_24_name,
		    entity_24_tax_amt 	= @entity_24_tax_amt,
		    entity_24_taxable 	= @entity_24_taxable,
		    entity_24_tax_rate	= @entity_24_tax_rate,
		    entity_25_id 	= @entity_25_id,
		    entity_25_name 	= @entity_25_name,
		    entity_25_tax_amt 	= @entity_25_tax_amt,
		    entity_25_taxable 	= @entity_25_taxable,
		    entity_25_tax_rate	= @entity_25_tax_rate,
		    entity_26_id 	= @entity_26_id,
		    entity_26_name 	= @entity_26_name,
		    entity_26_tax_amt 	= @entity_26_tax_amt,
		    entity_26_taxable 	= @entity_26_taxable,
		    entity_26_tax_rate	= @entity_26_tax_rate,
		    entity_27_id 	= @entity_27_id,
		    entity_27_name 	= @entity_27_name,
		    entity_27_tax_amt 	= @entity_27_tax_amt,
		    entity_27_taxable 	= @entity_27_taxable,
		    entity_27_tax_rate	= @entity_27_tax_rate,
		    entity_28_id 	= @entity_28_id,
		    entity_28_name 	= @entity_28_name,
		    entity_28_tax_amt 	= @entity_28_tax_amt,
		    entity_28_taxable 	= @entity_20_taxable,
		    entity_28_tax_rate	= @entity_20_tax_rate,
		    entity_29_id 	= @entity_29_id,
		    entity_29_name 	= @entity_29_name,
		    entity_29_tax_amt 	= @entity_29_tax_amt,
		    entity_29_taxable 	= @entity_29_taxable,
		    entity_29_tax_rate	= @entity_29_tax_rate,
		    entity_30_id 	= @entity_30_id,
		    entity_30_name 	= @entity_30_name,
		    entity_30_tax_amt 	= @entity_30_tax_amt,
		    entity_30_taxable 	= @entity_30_taxable,
		    entity_30_tax_rate	= @entity_30_tax_rate
       
		where  levy_group_id = @input_group_id
    		and    levy_group_yr = @input_stmnt_yr
    		and    levy_run_id   = @input_run_id
		and    stmnt_id      = @prev_stmnt_id


close entity_temp_cursor
deallocate entity_temp_cursor




if exists (select * from sysobjects where id = object_id(N'[dbo].[temp_transfer_tax_stmnt]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
begin
	drop table [dbo].[temp_transfer_tax_stmnt]
end

select 	levy_group_id, 
	levy_group_yr, 
	levy_run_id,  
	stmnt_id,
    sum(IsNull(transfer_tax_stmnt.oct_tax_due, 0)) as oct_tax_due, 
    sum(IsNull(transfer_tax_stmnt.oct_pi_due, 0))  as oct_pi_due,
    sum(IsNull(transfer_tax_stmnt.nov_tax_due, 0)) as nov_tax_due,
    sum(IsNull(transfer_tax_stmnt.nov_pi_due, 0))  as nov_pi_due,
    sum(IsNull(transfer_tax_stmnt.dec_tax_due, 0)) as dec_tax_due,
    sum(IsNull(transfer_tax_stmnt.dec_pi_due, 0))  as dec_pi_due,
    sum(IsNull(transfer_tax_stmnt.jan_tax_due, 0)) as jan_tax_due,
    sum(IsNull(transfer_tax_stmnt.jan_pi_due, 0))  as jan_pi_due,
    sum(IsNull(transfer_tax_stmnt.feb_tax_due, 0)) as feb_tax_due,
    sum(IsNull(transfer_tax_stmnt.feb_pi_due, 0))  as feb_pi_due,
    sum(IsNull(transfer_tax_stmnt.mar_tax_due, 0)) as mar_tax_due,
    sum(IsNull(transfer_tax_stmnt.mar_pi_due, 0))  as mar_pi_due,
    sum(IsNull(transfer_tax_stmnt.apr_tax_due, 0)) as apr_tax_due,
    sum(IsNull(transfer_tax_stmnt.apr_pi_due, 0))  as apr_pi_due,
    sum(IsNull(transfer_tax_stmnt.may_tax_due, 0)) as may_tax_due,
    sum(IsNull(transfer_tax_stmnt.may_pi_due, 0))  as may_pi_due,
    sum(IsNull(transfer_tax_stmnt.june_tax_due, 0))   as june_tax_due,
    sum(IsNull(transfer_tax_stmnt.june_pi_due, 0))    as june_pi_due,
    sum(IsNull(tax_saved_city + tax_saved_county, 0)) as taxes_saved

into [dbo].[temp_transfer_tax_stmnt]

from transfer_tax_stmnt
where levy_group_yr = @input_stmnt_yr
and   levy_run_id = @input_run_id
and   levy_group_id = @input_group_id
and   mail_to_type = 'O'

group by levy_group_id, levy_group_yr, levy_run_id, stmnt_id




update transfer_tax_stmnt_entity_totals
set oct_tax_due = (temp_transfer_tax_stmnt.oct_tax_due), 
    oct_pi_due  = (temp_transfer_tax_stmnt.oct_pi_due),
    nov_tax_due = (temp_transfer_tax_stmnt.nov_tax_due),
    nov_pi_due  = (temp_transfer_tax_stmnt.nov_pi_due),
    dec_tax_due = (temp_transfer_tax_stmnt.dec_tax_due),
    dec_pi_due  = (temp_transfer_tax_stmnt.dec_pi_due),
    jan_tax_due = (temp_transfer_tax_stmnt.jan_tax_due),
    jan_pi_due  = (temp_transfer_tax_stmnt.jan_pi_due),
    feb_tax_due = (temp_transfer_tax_stmnt.feb_tax_due),
    feb_pi_due  = (temp_transfer_tax_stmnt.feb_pi_due),
    mar_tax_due = (temp_transfer_tax_stmnt.mar_tax_due),
    mar_pi_due  = (temp_transfer_tax_stmnt.mar_pi_due),
    apr_tax_due = (temp_transfer_tax_stmnt.apr_tax_due),
    apr_pi_due  = (temp_transfer_tax_stmnt.apr_pi_due),
    may_tax_due = (temp_transfer_tax_stmnt.may_tax_due),
    may_pi_due  = (temp_transfer_tax_stmnt.may_pi_due),
    june_tax_due = (temp_transfer_tax_stmnt.june_tax_due),
    june_pi_due  = (temp_transfer_tax_stmnt.june_pi_due),
    taxes_saved  = (temp_transfer_tax_stmnt.taxes_saved)
from temp_transfer_tax_stmnt
where transfer_tax_stmnt_entity_totals.levy_group_id = temp_transfer_tax_stmnt.levy_group_id
and   transfer_tax_stmnt_entity_totals.levy_group_yr = temp_transfer_tax_stmnt.levy_group_yr
and   transfer_tax_stmnt_entity_totals.levy_run_id   = temp_transfer_tax_stmnt.levy_run_id
and   transfer_tax_stmnt_entity_totals.stmnt_id      = temp_transfer_tax_stmnt.stmnt_id
and   transfer_tax_stmnt_entity_totals.levy_group_yr = @input_stmnt_yr
and   transfer_tax_stmnt_entity_totals.levy_run_id   = @input_run_id
and   transfer_tax_stmnt_entity_totals.levy_group_id  = @input_group_id

GO


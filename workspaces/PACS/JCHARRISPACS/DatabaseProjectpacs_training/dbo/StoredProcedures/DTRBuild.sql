
--Revision 1.0 Pratimav HS 18131 - made corrections for Bill adj codes



CREATE   procedure DTRBuild

@input_pacs_user_id		int,
@input_entity_list		varchar(1000),
@input_effective_dt		varchar(50),
@input_report_type		varchar(1),
@input_year			varchar(1) = '',
@input_geo_id_option		varchar(1)= '',
@input_geo_id			varchar(50)= '',
@input_property_type_list	varchar(1000)= '',
@input_bill_adjustment_option	varchar(1)= '',
@input_bill_adjustment_list	varchar(1000)= '',
@input_print_all_entities	bit = 0 -- HS 15231  - check to see if all or just one entity needs to be printed Pratimav


as

--Revision # History (Search for Revision # in text)
--1.00 Created
--1.10 Revised EricZ, must check for @input_entity_list = '<ALL>'
--1.11 Revised EricZ, added index 'CPK_bill' to #bill table
--1.12 Revised EricZ, added last payment logic

declare @strPropList		varchar(1000)
declare @strBillList		varchar(1000)
declare @effective_dt		datetime
declare @tax_year		numeric(4)
declare @last_payment_date 	datetime
declare @last_payment_amt	numeric(14,2)
declare @sql			varchar(8000)

set @effective_dt = dateadd(dd, 1, @input_effective_dt)


delete from delq_roll_totals where pacs_user_id = @input_pacs_user_id
delete from delq_roll where pacs_user_id = @input_pacs_user_id

select	@tax_year = tax_yr
from	pacs_system

create table #prop_list
(
prop_id	int
)

create table #bill_list
(
bill_id	int
)

if (@input_report_type = 'D')
begin
	-- in case you are wondering, why we are doing this. The clients requested that all of the properties bills print on the
	-- delinquent tax roll, even when they select for just one entity. So for example, if I select to print the city of plainview
	-- delinquent roll, I will only select the properties within the city of plainview but I will print all of the bills for the property.
	-- but, I will only print totals for the city of plainview.

	set @strPropList = 'insert into #prop_list (prop_id) '
	set @strPropList = @strPropList + 'select distinct property.prop_id'
	set @strPropList = @strPropList + ' from property, bill'
	set @strPropList = @strPropList + ' where property.prop_id = bill.prop_id'

	--1.10
	if (@input_entity_list <> '<ALL>') and (@input_entity_list <> '')
	begin
		set @strPropList = @strPropList + ' and bill.entity_id in (' + @input_entity_list + ')'
	end

	set @strPropList = @strPropList + ' and bill.coll_status_cd <> ''RS'''
	set @strPropList = @strPropList + ' and (bill.active_bill = ''T'' or bill.active_bill is null)'

	if (@input_year = 'C')
	begin
		set @strPropList = @strPropList + ' and bill.sup_tax_yr = ' + convert(varchar(4), @tax_year)
	end
	else if (@input_year = 'D')
	begin
		set @strPropLIst = @strPropList + ' and bill.sup_tax_yr < ' + convert(varchar(4), @tax_year)
	end

	if (@input_geo_id_option = 'L')
	begin
		set @strPropList = @strPropList + ' and property.geo_id like ''' + @input_geo_id + '%'''
	end
	else if (@input_geo_id_option = 'E')
	begin
		set @strPropList = @strPropList + ' and property.geo_id = ''' + @input_geo_id + ''''
	end

	if (@input_property_type_list <> '<ALL>' and @input_property_type_list <> '')
	begin
		set @strPropList = @strPropList + ' and property.prop_type_cd in (' + @input_property_type_list + ')'
	end

	if (@input_bill_adjustment_option = 'I')
	begin
		if (@input_bill_adjustment_list <> '<ALL>' and @input_bill_adjustment_list <> '')
		begin
			set @strPropList = @strPropList + ' and bill.adjustment_code in (' + @input_bill_adjustment_list +')'
		end
	end
	else if (@input_bill_adjustment_option = 'E')
	begin
		if (@input_bill_adjustment_list <> '<ALL>' and @input_bill_adjustment_list <> '')
		begin
		 	set @strPropList = @strPropList + ' and (bill.adjustment_code not in ('+ @input_bill_adjustment_list + ') or bill.adjustment_code is null)'
		end
	end
--print @strPropList
	
	exec (@strPropList)
	

	set @strBillList = 'insert into #bill_list (bill_id) '
	set @strBillList = @strBillList + 'select distinct bill.bill_id' 
	set @strBillList = @strBillList + ' from bill, #prop_list, property'
	set @strBillList = @strBillList + ' where bill.prop_id = #prop_list.prop_id'
	set @strBillList = @strBillList + ' and   bill.prop_id = property.prop_id'
	set @strBillList = @strBillList + ' and   bill.coll_status_cd <> ''RS'''
	set @strBillList = @strBillList + ' and   (bill.active_bill = ''T'' or bill.active_bill is null)'
	
	if (@input_year = 'C')
	begin
		set @strBillList = @strBillList + ' and bill.sup_tax_yr = ' + convert(varchar(4), @tax_year)
	end
	else if (@input_year = 'D')

	begin
		set @strBillList = @strBillList + ' and bill.sup_tax_yr < ' + convert(varchar(4), @tax_year)
	end

	if (@input_geo_id_option = 'L')
	begin
		set @strBillList = @strBillList + ' and property.geo_id like ''' + @input_geo_id + '%'''
	end
	else if (@input_geo_id_option = 'E')
	begin
		set @strBillList = @strBillList + ' and property.geo_id = ''' + @input_geo_id + ''''
	end

	if (@input_property_type_list <> '<ALL>' and @input_property_type_list <> '')
	begin
		set @strBillList = @strBillList + ' and property.prop_type_cd in (' + @input_property_type_list + ')'
	end

	if (@input_bill_adjustment_option = 'I')
	begin
		if (@input_bill_adjustment_list <> '<ALL>' and @input_bill_adjustment_list <> '')
		begin
			set @strBillList = @strBillList + ' and bill.adjustment_code in (' + @input_bill_adjustment_list +')'
		end
	end
	else if (@input_bill_adjustment_option = 'E')
	begin
		if (@input_bill_adjustment_list <> '<ALL>' and @input_bill_adjustment_list <> '')
		begin
			set @strBillList = @strBillList + ' and (bill.adjustment_code not in ('+ @input_bill_adjustment_list + ') or bill.adjustment_code is null)'
		end
	end
--print @strBillList
	
	exec (@strBillList)
end
else
begin
	set @strBillList = 'insert into #bill_list (bill_id) '
	set @strBillList = @strBillList + 'select distinct bill.bill_id ' 
	set @strBillList = @strBillList + 'from bill, property '
	set @strBillList = @strBillList + 'where bill.coll_status_cd <> ''RS'' '

	--1.10
	if (@input_entity_list <> '<ALL>') and (@input_entity_list <> '')
	begin
		set @strBillList = @strBillList + ' and bill.entity_id in (' + @input_entity_list + ')'
	end

	set @strBillList = @strBillList + 'and   (bill.active_bill = ''T'' or bill.active_bill is null) '
	set @strBillList = @strBillList + 'and   bill.prop_id = property.prop_id '
	
	if (@input_year = 'C')
	begin
		set @strBillList = @strBillList + ' and bill.sup_tax_yr = ' + convert(varchar(4), @tax_year)
	end
	else if (@input_year = 'D')
	begin
		set @strBillList = @strBillList + ' and bill.sup_tax_yr < ' + convert(varchar(4), @tax_year)
	end

	if (@input_geo_id_option = 'L')
	begin
		set @strBillList = @strBillList + ' and property.geo_id like ''' + @input_geo_id + '%'''
	end
	else if (@input_geo_id_option = 'E')
	begin
		set @strBillList = @strBillList + ' and property.geo_id = ''' + @input_geo_id + ''''
	end

	if (@input_property_type_list <> '<ALL>' and @input_property_type_list <> '')
	begin
		set @strBillList = @strBillList + ' and property.prop_type_cd in (' + @input_property_type_list + ')'
	end

	if (@input_bill_adjustment_option = 'I')
	begin
		if (@input_bill_adjustment_list <> '<ALL>' and @input_bill_adjustment_list <> '')
		begin
			set @strBillList = @strBillList + ' and bill.adjustment_code in (' + @input_bill_adjustment_list +')'
		end
	end
	else if (@input_bill_adjustment_option = 'E')
	begin
		if (@input_bill_adjustment_list <> '<ALL>' and @input_bill_adjustment_list <> '')
		begin
			set @strBillList = @strBillList + ' and (bill.adjustment_code not in ('+ @input_bill_adjustment_list + ') or bill.adjustment_code is null)'
		end
	end
--print @strBillList
		
	exec (@strBillList)
end
	


select
	bill.bill_id,
	sup_tax_yr,
	sup_num,
	entity_id,
	bill.prop_id,
	col_owner_id as owner_id,
	adjustment_code,
	adj_effective_dt,
	adj_expiration_dt,
	adj_comment,
	rollback_id,
	coll_status_cd,
	bill_type,
	effective_due_dt,
	bill_m_n_o,
	bill_i_n_s,
	bill_m_n_o + sum(IsNull(mno_adj, 0)) as bill_adj_m_n_o,
	bill_i_n_s + sum(IsNull(ins_adj, 0)) as bill_adj_i_n_s,
	bill_prot_i_n_s,
	bill_late_ag_penalty,
	sum(IsNull(mno_amt, 0))      as bill_m_n_o_pd,
	sum(IsNull(ins_amt, 0))      as bill_i_n_s_pd,
	sum(IsNull(pen_mno_amt, 0))  as penalty_m_n_o_pd,
	sum(IsNull(pen_ins_amt, 0))  as penalty_i_n_s_pd,
	sum(IsNull(int_mno_amt, 0))  as interest_m_n_o_pd,
	sum(IsNull(int_ins_amt, 0))  as interest_i_n_s_pd,
	sum(IsNull(atty_fee_amt, 0)) as attorney_fees_pd,
	bill_assessed_value,
	bill_taxable_val,
	stmnt_id,
	sum(IsNull(disc_mno_amt, 0))   as discount_mno_pd,
	sum(IsNull(disc_ins_amt, 0))   as discount_ins_pd,
	prev_bill_id,
	new_bill_id,
	create_dt,
	bill.ref_id1,
	bill.ref_id2,
	ref_id3,
	ref_id4,
	ref_id5,
	discount_offered,
	levy_group_id,
	levy_run_id,
	active_bill,
	0 as refund_m_n_o_pd,
	0 as refund_i_n_s_pd,
	0 as refund_pen_m_n_o_pd,
	0 as refund_pen_i_n_s_pd,
	0 as refund_int_m_n_o_pd,
	0 as refund_int_i_n_s_pd,
	0 as refund_atty_fee_pd,
	sum(IsNull(under_mno_amt, 0)) as underage_mno_pd,
	sum(IsNull(under_ins_amt, 0)) as underage_ins_pd,
	sum(IsNull(over_mno_amt,  0)) as overage_mno_pd,
	sum(IsNull(over_ins_amt,  0)) as overage_ins_pd,
	0 as refund_disc_mno_pd,
	0 as refund_disc_ins_pd,
	ia_id,
	pay_type,
	pay1_amt,
	pay1_paid,
	pay1_due_dt,
	pay2_amt,
	pay2_paid,
	pay2_due_dt,
	pay3_amt,
	pay3_paid,
	pay3_due_dt,
	pay4_amt,
	pay4_paid,
	pay4_due_dt,
	pay_created_dt,
	pay_removed_dt,
	pay_created_by,
	pay_removed_by
into #bill
from bill with (nolock)
	inner join property as p with(nolock) on
	bill.prop_id=p.prop_id
	inner join #bill_list 
	on    bill.bill_id = #bill_list.bill_id
	left outer join recap_trans rt with (nolock)     
	on    bill.bill_id = rt.bill_id
	and   rt.balance_dt <  @effective_dt
group by
	bill.bill_id,
	sup_tax_yr,
	sup_num,
	entity_id,
	bill.prop_id,
	col_owner_id,
	adjustment_code,
	adj_effective_dt,
	adj_expiration_dt,
	adj_comment,
	rollback_id,
	coll_status_cd,
	bill_type,
	effective_due_dt,
	bill_m_n_o,
	bill_i_n_s,
	bill_prot_i_n_s,
	bill_late_ag_penalty,
	bill_assessed_value,
	bill_taxable_val,
	stmnt_id,
	prev_bill_id,
	new_bill_id,
	create_dt,
	bill.ref_id1,
	bill.ref_id2,
	ref_id3,
	ref_id4,
	ref_id5,
	discount_offered,
	levy_group_id,
	levy_run_id,
	active_bill,
	ia_id,
	pay_type,
	pay1_amt,
	pay1_paid,
	pay1_due_dt,
	pay2_amt,
	pay2_paid,
	pay2_due_dt,
	pay3_amt,
	pay3_paid,
	pay3_due_dt,
	pay4_amt,
	pay4_paid,
	pay4_due_dt,
	pay_created_dt,
	pay_removed_dt,
	pay_created_by,
	pay_removed_by

--HS 15231 print only the entity selected PratimaV

if ((@input_print_all_entities = 0) and (@input_entity_list <> '') and @input_entity_list <> '<ALL>' )
begin
	set @sql = 'delete from #bill '
	set @sql = @sql + 'where entity_id not in (' + @input_entity_list + ')'

	exec(@sql)
end

--1.11
alter table #bill
	add primary key clustered (bill_id)
with fillfactor = 100
on [primary]

/***********************************************/
/*********** process the details ***************/
/***********************************************/
if (@input_report_type = 'D')
begin
	declare @bill_id	int
	declare @bill_entity_id	int
	declare @sup_tax_yr	numeric(4)
	declare @prop_type_cd	varchar(5)
	declare @prop_id	int 
	declare @owner_id 	int
	declare @stmnt_id 	int
	declare @adjustment_code varchar(10)
	declare @bill_m_n_o 	 numeric(14,2)
	declare @bill_i_n_s	 numeric(14,2)
	declare @bill_m_n_o_pd	 numeric(14,2)
	declare @bill_i_n_s_pd	 numeric(14,2)
	declare @bill_adj_m_n_o  numeric(14,2)
	declare @bill_adj_i_n_s  numeric(14,2)

	declare @date1		varchar(100)
	declare @date2		varchar(100)
	declare @date3		varchar(100)

	declare @str_base_tax 	  varchar(100)
	declare @str_penalty_mno  varchar(100)
	declare @str_penalty_ins  varchar(100)
	declare @str_interest_mno varchar(100)
	declare @str_interest_ins varchar(100)
	declare @str_attorney_fee varchar(100)
	declare @str_total	  varchar(100)

	declare @tax_due1	numeric(14,2)
	declare @disc_pi1	numeric(14,2)

	declare @att_fee1	numeric(14,2)
	declare @tax_due2	numeric(14,2)
	declare @disc_pi2	numeric(14,2)
	declare @att_fee2	numeric(14,2)
	declare @tax_due3	numeric(14,2)
	declare @disc_pi3	numeric(14,2)
	declare @att_fee3	numeric(14,2)

	set @date1 = convert(varchar(100), @input_effective_dt)
	set @date2 = convert(varchar(100), dateadd(m, 1, @input_effective_dt))
	set @date3 = convert(varchar(100), dateadd(m, 2, @input_effective_dt))

	declare DTR_BILL cursor fast_forward for
	select bill_id, entity_id, sup_tax_yr, prop_type_cd, property.prop_id, owner_id, stmnt_id, adjustment_code, 
			bill_m_n_o, bill_i_n_s, bill_m_n_o_pd, bill_i_n_s_pd, bill_adj_m_n_o, bill_adj_i_n_s

	from #bill, property
	where #bill.prop_id = property.prop_id
	and (#bill.bill_adj_m_n_o + bill_adj_i_n_s) - 
            ((#bill.bill_m_n_o_pd + #bill.bill_i_n_s_pd + discount_mno_pd + discount_ins_pd + underage_mno_pd +  underage_ins_pd) - 
            (#bill.refund_m_n_o_pd + #bill.refund_i_n_s_pd + #bill.refund_disc_mno_pd + #bill.refund_disc_ins_pd)) <> 0 


	open DTR_BILL
	fetch next from DTR_BILL into @bill_id, @bill_entity_id, @sup_tax_yr, @prop_type_cd, @prop_id,
				      @owner_id, @stmnt_id, @adjustment_code, @bill_m_n_o, @bill_i_n_s,
				      @bill_m_n_o_pd, @bill_i_n_s_pd, @bill_adj_m_n_o, @bill_adj_i_n_s
	
	while (@@FETCH_STATUS = 0)
	begin
		set @tax_due1   = 0
		set @disc_pi1   = 0
		set @att_fee1   = 0
		set @tax_due2  = 0
		set @disc_pi2  = 0
		set @att_fee2  = 0
		set @tax_due3  = 0
		set @disc_pi3  = 0
		set @att_fee3  = 0

		-- month1
		exec GetBillTaxDue @bill_id, 0,  'I', @date1,
				   @str_base_tax output, @str_penalty_mno output, @str_penalty_ins output,
              			   @str_interest_mno output, @str_interest_ins output, @str_attorney_fee output, @str_total output
 
		set @tax_due1 = convert(numeric(14,2), @str_base_tax)
		set @disc_pi1 = convert(numeric(14,2), @str_penalty_mno) +
			       convert(numeric(14,2), @str_penalty_ins) + 
			       convert(numeric(14,2), @str_interest_mno) + 
			       convert(numeric(14,2), @str_interest_ins)
		set @att_fee1 = convert(numeric(14,2), @str_attorney_fee)
		
		-- month2
		exec GetBillTaxDue @bill_id, 0,  'I', @date2,
				   @str_base_tax output, @str_penalty_mno output, @str_penalty_ins output,
              			   @str_interest_mno output, @str_interest_ins output, @str_attorney_fee output, @str_total output
 
		set @tax_due2 = convert(numeric(14,2), @str_base_tax)
		set @disc_pi2 = convert(numeric(14,2), @str_penalty_mno) +
			        convert(numeric(14,2), @str_penalty_ins) + 
			        convert(numeric(14,2), @str_interest_mno) + 
			        convert(numeric(14,2), @str_interest_ins)
		set @att_fee2 = convert(numeric(14,2), @str_attorney_fee)

		-- month3
		exec GetBillTaxDue @bill_id, 0,  'I', @date3,
				   @str_base_tax output, @str_penalty_mno output, @str_penalty_ins output,
              			   @str_interest_mno output, @str_interest_ins output, @str_attorney_fee output, @str_total output
 
		set @tax_due3 = convert(numeric(14,2), @str_base_tax)
		set @disc_pi3 = convert(numeric(14,2), @str_penalty_mno) +
			        convert(numeric(14,2), @str_penalty_ins) + 
			        convert(numeric(14,2), @str_interest_mno) + 
			        convert(numeric(14,2), @str_interest_ins)
		set @att_fee3 = convert(numeric(14,2), @str_attorney_fee)

		--Get last payment info, 1.12
		set @last_payment_date = NULL
		set @last_payment_amt = 0
	
		if exists (select * from payment_trans with (nolock) where bill_id = @bill_id)
		begin
			select top 1 @last_payment_date = payment.date_paid,
			          @last_payment_amt  = (payment_trans.mno_amt + payment_trans.ins_amt
	     					+ payment_trans.penalty_mno_amt + payment_trans.penalty_ins_amt
	     					+ payment_trans.interest_mno_amt + payment_trans.interest_ins_amt
	     					+ payment_trans.attorney_fee_amt + payment_trans.overage_mno_amt + payment_trans.overage_ins_amt)
			from payment with (nolock), payment_trans with (nolock), batch with (nolock)
			where payment.payment_id = payment_trans.payment_id
				and payment_trans.bill_id = @bill_id
				and payment.batch_id = batch.batch_id
				and batch.balance_dt <= @input_effective_dt
			order by payment.date_paid desc
		end

		insert into delq_roll
		(
			pacs_user_id,
			bill_id,
			entity_id,
			sup_tax_yr,
			tax_due,
			disc_pi,
			att_fee,
			tax_due1,
			disc_pi1,
			att_fee1,
			tax_due2,
			disc_pi2,
			att_fee2,
			prop_type_cd,
			prop_id,
			owner_id, 
			stmnt_id, 
			adjustment_code, 
			bill_m_n_o, 

			bill_i_n_s,
			bill_m_n_o_due,
			bill_i_n_s_due,
			last_payment_date,
			last_payment_amt
		)
		values
		(
			@input_pacs_user_id,
			@bill_id,
			@bill_entity_id,
			@sup_tax_yr,
			@tax_due1,
			@disc_pi1,
			@att_fee1,
			@tax_due2,
			@disc_pi2,
			@att_fee2,
			@tax_due3,
			@disc_pi3,
			@att_fee3,
			@prop_type_cd,
			@prop_id,
			@owner_id, 
			@stmnt_id, 
			@adjustment_code, 
			@bill_m_n_o, 
			@bill_i_n_s,
			@bill_adj_m_n_o - @bill_m_n_o_pd,
			@bill_adj_i_n_s - @bill_i_n_s_pd,
			@last_payment_date,
			@last_payment_amt
		)

		

		fetch next from DTR_BILL into @bill_id, @bill_entity_id, @sup_tax_yr, @prop_type_cd, @prop_id,
				      @owner_id, @stmnt_id, @adjustment_code, @bill_m_n_o, @bill_i_n_s,
				      @bill_m_n_o_pd, @bill_i_n_s_pd, @bill_adj_m_n_o, @bill_adj_i_n_s
	end

	close DTR_BILL
	deallocate DTR_BILL
end
/***********************************************/
/*********** process the totals ****************/
/***********************************************/

declare @Cursor 		varchar(1000)
declare @entity_id		int

set @Cursor = 'declare ENTITY cursor fast_forward for ' 
set @Cursor = @Cursor + ' select entity_id '
set @Cursor = @Cursor + ' from entity '

--1.10
if (@input_entity_list <> '<ALL>') and (@input_entity_list <> '')
begin
	set @Cursor = @Cursor + ' where entity_id in (' +  @input_entity_list + ')'
end

exec (@cursor)

open ENTITY
fetch next from ENTITY into @entity_id

while (@@FETCH_STATUS = 0)
begin

	declare @curr_year	numeric(4)

	select @curr_year = max(tax_rate_yr)
	from tax_rate
	where entity_id = @entity_id
	and   bills_created_dt < @effective_dt

	insert into delq_roll_totals
	(
		pacs_user_id, 
		entity_id,
		sup_tax_yr,
		num_bills,   
		base_tax_due,     
		real_tax_due,     
		mobile_tax_due,   
		mineral_tax_due,  
		personal_tax_due, 
		auto_tax_due     
	)
	select @input_pacs_user_id,
	       entity_id,
	       sup_tax_yr,
	       sum(case when IsNull((#bill.bill_adj_m_n_o + bill_adj_i_n_s) - 
		   ((#bill.bill_m_n_o_pd + #bill.bill_i_n_s_pd + discount_mno_pd + discount_ins_pd + underage_mno_pd +  underage_ins_pd) - 
		   (#bill.refund_m_n_o_pd + #bill.refund_i_n_s_pd + #bill.refund_disc_mno_pd + #bill.refund_disc_ins_pd)), 0) > 0 then 1 else 0 end),
	       sum((#bill.bill_adj_m_n_o + bill_adj_i_n_s) - 
		  ((#bill.bill_m_n_o_pd + #bill.bill_i_n_s_pd + discount_mno_pd + discount_ins_pd + underage_mno_pd +  underage_ins_pd) - 
		  (#bill.refund_m_n_o_pd + #bill.refund_i_n_s_pd + #bill.refund_disc_mno_pd + #bill.refund_disc_ins_pd))),    
		sum(case when prop_type_cd = 'R'  then IsNull((#bill.bill_adj_m_n_o + bill_adj_i_n_s) - 
		   ((#bill.bill_m_n_o_pd + #bill.bill_i_n_s_pd + discount_mno_pd + discount_ins_pd + underage_mno_pd +  underage_ins_pd) - 
		   (#bill.refund_m_n_o_pd + #bill.refund_i_n_s_pd + #bill.refund_disc_mno_pd + #bill.refund_disc_ins_pd)), 0) else 0 end),
	       sum(case when prop_type_cd = 'MH' then IsNull((#bill.bill_adj_m_n_o + bill_adj_i_n_s) - 
 		  ((#bill.bill_m_n_o_pd + #bill.bill_i_n_s_pd + discount_mno_pd + discount_ins_pd + underage_mno_pd +  underage_ins_pd) - 
 		  (#bill.refund_m_n_o_pd + #bill.refund_i_n_s_pd + #bill.refund_disc_mno_pd + #bill.refund_disc_ins_pd)), 0) else 0 end),
	       sum(case when prop_type_cd = 'MN' then IsNull((#bill.bill_adj_m_n_o + bill_adj_i_n_s) - 
 		  ((#bill.bill_m_n_o_pd + #bill.bill_i_n_s_pd + discount_mno_pd + discount_ins_pd + underage_mno_pd +  underage_ins_pd) - 
 		  (#bill.refund_m_n_o_pd + #bill.refund_i_n_s_pd + #bill.refund_disc_mno_pd + #bill.refund_disc_ins_pd)), 0) else 0 end),
	       sum(case when prop_type_cd = 'P'  then IsNull((#bill.bill_adj_m_n_o + bill_adj_i_n_s) - 
 		  ((#bill.bill_m_n_o_pd + #bill.bill_i_n_s_pd + discount_mno_pd + discount_ins_pd + underage_mno_pd +  underage_ins_pd) - 
 		  (#bill.refund_m_n_o_pd + #bill.refund_i_n_s_pd + #bill.refund_disc_mno_pd + #bill.refund_disc_ins_pd)), 0) else 0 end),
	       sum(case when prop_type_cd = 'A'  then IsNull((#bill.bill_adj_m_n_o + bill_adj_i_n_s) - 
 		  ((#bill.bill_m_n_o_pd + #bill.bill_i_n_s_pd + discount_mno_pd + discount_ins_pd + underage_mno_pd +  underage_ins_pd) - 
 		  (#bill.refund_m_n_o_pd + #bill.refund_i_n_s_pd + #bill.refund_disc_mno_pd + #bill.refund_disc_ins_pd)), 0) else 0 end)
	     
	from #bill, property 
	where #bill.prop_id = property.prop_id
	and   #bill.sup_tax_yr <= @curr_year
	and   #bill.entity_id  =  @entity_id
	group by entity_id, sup_tax_yr
	
	fetch next from ENTITY into @entity_id
end

close entity
deallocate entity

drop table #prop_list
drop table #bill_list
drop table #bill

GO


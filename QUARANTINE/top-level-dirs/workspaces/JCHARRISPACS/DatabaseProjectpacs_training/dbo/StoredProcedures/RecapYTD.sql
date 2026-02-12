



















CREATE                  procedure RecapYTD
@input_pacs_user_id		int,
@input_entity_list	varchar(1000),
@input_month		int,
@input_year		numeric(4),
@input_begin_dt		varchar(50) = '',
@input_end_dt		varchar(50) = ''

as


declare @begin_dt	datetime
declare @end_dt		datetime
declare @entity_id	int

if (@input_month <> 0)
begin
	select  @begin_dt = begin_date,
		@end_dt   = end_date
	from recap_month
	where tax_month = @input_month
	and   tax_yr    = @input_year
end
else
begin
	set @begin_dt = @input_begin_dt
	set @end_dt   = @input_end_dt
end


set @end_dt = dateadd(dd, 1, @end_dt)

-- year to date recap report
delete from year_to_date_recap  	where pacs_user_id = @input_pacs_user_id
delete from year_to_date_recap_delq	where pacs_user_id = @input_pacs_user_id
delete from year_to_date_recap_refund 	where pacs_user_id = @input_pacs_user_id


declare @Cursor 		varchar(1000)

set @Cursor = 'declare ENTITY cursor fast_forward for ' 
set @Cursor = @Cursor + ' select entity_id '
set @Cursor = @Cursor + ' from  entity '
set @Cursor = @Cursor + ' where entity_id in (' +  @input_entity_list + ')'

exec (@cursor)

open ENTITY
fetch next from ENTITY into @entity_id

while (@@FETCH_STATUS = 0)
begin
	declare @curr_year	numeric(4)

	select @curr_year = max(tax_rate_yr)
	from tax_rate
	where entity_id = @entity_id
	and   bills_created_dt < @end_dt

	select    
	bill.bill_id,
	bill.entity_id,
	bill.sup_tax_yr,
	(bill_m_n_o + bill_i_n_s)					as orig_tax,
	sum(IsNull(mno_adj, 0) + IsNull(ins_adj, 0)) 			as adj,         
	sum(IsNull(mno_amt, 0) + IsNull(ins_amt, 0)) 			as tax_pd,  
	sum(IsNull(disc_mno_amt, 0) + IsNull(disc_ins_amt, 0)) 		as disc_pd,
	sum(IsNull(pen_mno_amt, 0) + IsNull(pen_ins_amt, 0)) 		as pen_pd, 
	sum(IsNull(int_mno_amt, 0) + IsNull(int_ins_amt, 0)) 		as int_pd, 
	sum(IsNull(atty_fee_amt, 0))					as att_fee_pd,
	sum(IsNull(over_mno_amt, 0) + IsNull(over_ins_amt, 0))		as over_pd,
	sum(IsNull(under_mno_amt, 0) + IsNull(under_ins_amt, 0))	as under_pd,
	0 as balance
	
	into #ytd_bill
	
	from bill with (nolock)
	left outer join recap_trans rt with (nolock)     
	on    bill.bill_id = rt.bill_id
	and   rt.balance_dt <  @end_dt
	where bill.sup_tax_yr <= @curr_year
	and   bill.entity_id  =  @entity_id
	and   bill.coll_status_cd <> 'RS'
	and   (bill.active_bill = 'T' or bill.active_bill is null)
	group by bill.bill_id, bill.entity_id, bill.sup_tax_yr, bill.bill_m_n_o, bill.bill_i_n_s
	
	
	
	
	insert into year_to_date_recap
	(
	pacs_user_id ,
	entity_id,   
	recap_yr, 
	orig_tax,         
	adj_tax,         
	tax_pd,           
	disc_pd,          
	penalty_pd,       
	interest_pd,      
	att_fee_pd,       
	overage_pd,       
	underage_pd ,
	num_owe,
	balance,
	coll_month,
	coll_year,
	adjustments,
	payments,
	eff_tax_pd,
	pct_collected,
	begin_dt,
	end_dt
	)
	select    
	@input_pacs_user_id,
	#ytd_bill.entity_id,
	#ytd_bill.sup_tax_yr,
	sum(orig_tax),
	sum(orig_tax + adj),
	sum(tax_pd),
	sum(disc_pd),
	sum(pen_pd),
	sum(int_pd),
	sum(att_fee_pd),
	sum(over_pd),
	sum(under_pd),
	sum(case when (orig_tax + adj) - (tax_pd + disc_pd + under_pd) > 0 then 1 else 0 end),
	sum((orig_tax + adj) - (tax_pd + disc_pd + under_pd)),
	@input_month,
	@input_year,
	sum((orig_tax + adj) - (orig_tax)),
	sum(tax_pd + pen_pd + int_pd + att_fee_pd + over_pd),
	sum(tax_pd + disc_pd + under_pd),
	0,
	@input_begin_dt,
	@input_end_dt
	from #ytd_bill
	
	group by #ytd_bill.entity_id, #ytd_bill.sup_tax_yr


	update year_to_date_recap set pct_collected =  ((tax_pd/adj_tax) * 100)
	where adj_tax > 0 


	insert into year_to_date_recap_delq
	(
	pacs_user_id ,
	entity_id,   
	recap_yr, 
	orig_tax,         
	adj_tax,         
	tax_pd,           
	disc_pd,          
	penalty_pd,       
	interest_pd,      
	att_fee_pd,       
	overage_pd,       
	underage_pd ,
	num_owe,
	balance,
	adjustments,
	payments,
	eff_tax_pd
	)
	select    
	pacs_user_id ,
	entity_id,   
	0, 
	sum(orig_tax),         
	sum(adj_tax),         
	sum(tax_pd),           
	sum(disc_pd),          
	sum(penalty_pd),       
	sum(interest_pd),      
	sum(att_fee_pd),       
	sum(overage_pd),       
	sum(underage_pd),
	sum(num_owe),
	sum(balance),
	sum(adjustments),
	sum(payments),
	sum(eff_tax_pd)
	from year_to_date_recap
	where pacs_user_id = @input_pacs_user_id
	and   entity_id    = @entity_id
	and   recap_yr     < @curr_year
	group by pacs_user_id, entity_id

	if (@@rowcount = 0)
	begin
		insert into year_to_date_recap_delq
		(
		pacs_user_id ,
		entity_id,   
		recap_yr, 
		orig_tax,         
		adj_tax,         
		tax_pd,           
		disc_pd,          
		penalty_pd,       
		interest_pd,      
		att_fee_pd,       
		overage_pd,       
		underage_pd ,
		num_owe,
		balance,
		adjustments,
		payments,
		eff_tax_pd
		)
		values
		(@input_pacs_user_id, @entity_id,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0)
	end
	
	
	insert into year_to_date_recap_refund
	(
	pacs_user_id, 
	entity_id,   
	refund_paid,      
	base_tax_pd,     
	disc_pd,          
	penalty_pd,       
	interest_pd,
	att_fee_pd
	)
	select
	@input_pacs_user_id,
	#ytd_bill.entity_id,
	sum(mno_amt + ins_amt + pen_mno_amt + pen_ins_amt + int_mno_amt + int_ins_amt + atty_fee_amt),
	sum(mno_amt + ins_amt),  
	sum(disc_mno_amt + disc_ins_amt),
	sum(pen_mno_amt + pen_ins_amt), 
	sum(int_mno_amt + int_ins_amt), 
	sum(atty_fee_amt)
	from recap_trans rt with (nolock)
	
	inner join #ytd_bill with (nolock)     
	on    rt.bill_id = #ytd_bill.bill_id
	and   rt.balance_dt <  @end_dt
	and   (rt.type = 'R'
	or     rt.type = 'VR')
	where #ytd_bill.sup_tax_yr <= @curr_year
	group by #ytd_bill.entity_id

	if (@@rowcount = 0)
	begin
		insert into year_to_date_recap_refund
		(
		pacs_user_id, 
		entity_id,   
		refund_paid,      
		base_tax_pd,     
		disc_pd,          
		penalty_pd,       
		interest_pd,
		att_fee_pd
		)
		values
		(
		@input_pacs_user_id,
		@entity_id,
		0,0,0,0,0,0
		)
	end


	-- insert entry into the self balancing
 	-- table
	delete from recap_balance
	where type = 'YTD'
	and   entity_id = @entity_id
	and   tax_month = @input_month
	and   tax_yr    = @input_year

	insert into recap_balance
	(
	type,
	entity_id,
	tax_month,
	tax_yr,
	balance
	)
	select 'YTD',
	       @entity_id,
	       @input_month,
	       @input_year,
	       sum(balance)
	from year_to_date_recap
	where pacs_user_id = @input_pacs_user_id
	and   entity_id    = @entity_id
		
	
	drop table #ytd_bill

	fetch next from ENTITY into @entity_id
end

close ENTITY
deallocate ENTITY

GO


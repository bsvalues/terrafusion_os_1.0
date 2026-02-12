








CREATE                               procedure RecapFYTD
@input_pacs_user_id		int,
@input_entity_list	varchar(1000),
@input_month		int,
@input_year		numeric(4),
@input_begin_dt		varchar(50) = '',
@input_end_dt		varchar(50) = ''

as


declare @begin_dt	datetime
declare @end_dt		datetime
declare @act_end_dt	datetime
declare @entity_id	int

if (@input_month <> 0)
begin
	select  @begin_dt = begin_date,
		@act_end_dt   = end_date
	from recap_month
	where tax_month = @input_month
	and   tax_yr    = @input_year
end
else
begin
	set @begin_dt = @input_begin_dt
	set @act_end_dt   = @input_end_dt
end

set @end_dt = dateadd(dd, 1, @act_end_dt)


-- year to date recap report
delete from fiscal_year_to_date_recap  	        where pacs_user_id = @input_pacs_user_id
delete from fiscal_year_to_date_recap_delq	where pacs_user_id = @input_pacs_user_id
delete from fiscal_year_to_date_recap_refund 	where pacs_user_id = @input_pacs_user_id

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

	declare @fiscal_year		varchar(20)
	declare @fiscal_begin_dt	datetime
	
	
	select @fiscal_year     = fiscal_year,
	       @fiscal_begin_dt = begin_date
	from recap_fiscal
	where begin_date <= @begin_dt
	and   end_date   >= @act_end_dt
	and   entity_id   = @entity_id
	
	select    
	recap_fiscal_totals.entity_id,
	recap_fiscal_totals.coll_year,
	recap_fiscal_totals.beg_mno + recap_fiscal_totals.beg_ins	as orig_tax,
	sum(IsNull(mno_adj, 0) + IsNull(ins_adj, 0)) 			as adj,         
	sum(IsNull(mno_amt, 0) + IsNull(ins_amt, 0)) 			as tax_pd,  
	sum(IsNull(disc_mno_amt, 0) + IsNull(disc_ins_amt, 0)) 		as disc_pd,
	sum(IsNull(pen_mno_amt, 0) + IsNull(pen_ins_amt, 0)) 		as pen_pd, 
	sum(IsNull(int_mno_amt, 0) + IsNull(int_ins_amt, 0)) 		as int_pd, 
	sum(IsNull(atty_fee_amt, 0))					as att_fee_pd,
	sum(IsNull(over_mno_amt, 0) + IsNull(over_ins_amt, 0))		as over_pd,
	sum(IsNull(under_mno_amt, 0) + IsNull(under_ins_amt, 0))	as under_pd,


	recap_fiscal_totals.beg_mno 					as orig_mno_tax, 
	recap_fiscal_totals.beg_ins					as orig_ins_tax,
	sum(IsNull(mno_adj, 0))						as mno_adj,
	sum(IsNull(ins_adj, 0)) 					as ins_adj,         
	sum(IsNull(mno_amt, 0))						as tax_mno_pd, 
	sum(IsNull(ins_amt, 0)) 					as tax_ins_pd,  
	sum(IsNull(disc_mno_amt, 0))					as disc_mno_pd, 
	sum(IsNull(disc_ins_amt, 0)) 					as disc_ins_pd,
	sum(IsNull(under_mno_amt, 0))					as under_mno_pd, 
	sum(IsNull(under_ins_amt, 0))					as under_ins_pd

	
	into #fytd_totals
	
	from recap_fiscal_totals
	left outer join bill with (nolock) 
	on    bill.entity_id  = recap_fiscal_totals.entity_id
	and   bill.sup_tax_yr = recap_fiscal_totals.coll_year
	and   bill.sup_tax_yr <= @curr_year   
	and   bill.coll_status_cd <> 'RS'
	and   (bill.active_bill = 'T' or bill.active_bill is null)
	

	left outer join  recap_trans rt with (nolock)   
	on    bill.bill_id = rt.bill_id
	and   rt.balance_dt >= @fiscal_begin_dt
	and   rt.balance_dt <  @end_dt
	where recap_fiscal_totals.fiscal_year = @fiscal_year
	and   recap_fiscal_totals.entity_id   = @entity_id
	

	group by recap_fiscal_totals.entity_id,
	recap_fiscal_totals.coll_year, recap_fiscal_totals.beg_mno + recap_fiscal_totals.beg_ins,
	recap_fiscal_totals.beg_mno , recap_fiscal_totals.beg_ins

	
	insert into fiscal_year_to_date_recap
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
	balance,
	coll_month,
	coll_year ,
	adjustments,
	payments,
	eff_tax_pd,
	fiscal_year,
	pct_collected,
	begin_dt,
	end_dt
	)
	select    
	@input_pacs_user_id,
	entity_id,
	coll_year,
	(orig_tax),
	(orig_tax + adj),

	(tax_pd),
	(disc_pd),
	(pen_pd),
	(int_pd),
	(att_fee_pd),
	(over_pd),
	(under_pd),
	((orig_tax + adj) - (tax_pd + disc_pd + under_pd)),
	@input_month,
	@input_year,
	(orig_tax + adj) - (orig_tax),
	tax_pd + pen_pd + int_pd + att_fee_pd + over_pd,
	tax_pd + disc_pd + under_pd,
	@fiscal_year,
	case when ((orig_tax + adj)) > 0 then (((tax_pd + disc_pd + under_pd))/(orig_tax + adj)) 
						      else 0
						      end,
	@input_begin_dt,
	@input_end_dt

	from #fytd_totals

	insert into fiscal_year_to_date_recap_delq
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
	sum(balance),
	sum(adjustments),
	sum(payments),
	sum(eff_tax_pd)
	from fiscal_year_to_date_recap
	where pacs_user_id = @input_pacs_user_id
	and   entity_id    = @entity_id
	and   recap_yr     < @curr_year   
	group by pacs_user_id, entity_id

	if (@@ROWCOUNT = 0)
	begin
		insert into fiscal_year_to_date_recap_delq
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
		balance,
		adjustments,
		payments,
		eff_tax_pd
		)
		values (@input_pacs_user_id, @entity_id, 0, 0, 0,0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)
	end
	

	
	insert into fiscal_year_to_date_recap_refund
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
	entity_id,
	sum(mno_amt + ins_amt + pen_mno_amt + pen_ins_amt + int_mno_amt + int_ins_amt + atty_fee_amt),
	sum(mno_amt + ins_amt),  
	sum(disc_mno_amt + disc_ins_amt),
	sum(pen_mno_amt + pen_ins_amt), 
	sum(int_mno_amt + int_ins_amt), 
	sum(atty_fee_amt)
	from recap_trans rt with (nolock)
	inner join bill with (nolock)     
	on    rt.bill_id = bill.bill_id
	and   rt.balance_dt >= @fiscal_begin_dt
	and   rt.balance_dt <  @end_dt
	and   (rt.type = 'R'
	or     rt.type = 'VR')
	where bill.entity_id = @entity_id
	group by bill.entity_id

	if (@@ROWCOUNT = 0)
	begin
		insert into fiscal_year_to_date_recap_refund
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
		0, 0, 0, 0, 0, 0
		)
	end

	delete from recap_balance
	where type = 'FYTD'
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
	select 'FYTD',
	       @entity_id,
	       @input_month,
	       @input_year,
	       sum(balance)
	from fiscal_year_to_date_recap
	where pacs_user_id = @input_pacs_user_id
	and   entity_id    = @entity_id

	delete from recap_fiscal_balance
	where entity_id = @entity_id
	and   tax_month = @input_month
	and   tax_year    = @input_year

	insert into recap_fiscal_balance
	(
	entity_id,
	tax_month,
	tax_year,
	coll_year,
	balance_mno,
	balance_ins
	)
	select @entity_id,
	       @input_month,
	       @input_year,
	       coll_year,
	       ((orig_mno_tax + mno_adj) - (tax_mno_pd + disc_mno_pd + under_mno_pd)),
		    --PraitmaV HS 14387 changed disc_mno_pd to disc_ins_Pd to calculate the correct discount for ins
	       ((orig_ins_tax + ins_adj) - (tax_ins_pd + disc_ins_pd + under_ins_pd))
	from #fytd_totals	
		




	drop table #fytd_totals

	fetch next from ENTITY into @entity_id
end

close ENTITY
deallocate ENTITY

GO


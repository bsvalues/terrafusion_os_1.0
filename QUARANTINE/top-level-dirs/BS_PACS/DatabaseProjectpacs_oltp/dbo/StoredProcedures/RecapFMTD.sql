
























CREATE                         procedure RecapFMTD
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
delete from fiscal_month_to_date_recap  	where pacs_user_id = @input_pacs_user_id
delete from fiscal_month_to_date_recap_delq	where pacs_user_id = @input_pacs_user_id
delete from fiscal_month_to_date_recap_refund 	where pacs_user_id = @input_pacs_user_id

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

	declare @fiscal_year	varchar(20)
	
	select @fiscal_year = fiscal_year
	from recap_fiscal
	where begin_date <= @begin_dt
	and   end_date   >= @act_end_dt
	and   entity_id   = @entity_id


	select distinct coll_year as sup_tax_yr into #fmtd_year 
	From recap_fiscal_totals
	where entity_id = @entity_id
	and   fiscal_year = @fiscal_year



	insert into fiscal_month_to_date_recap
	(
	pacs_user_id,
	entity_id,
	recap_yr,
	adjustments,
	tax_pd,
	disc_pd,
	penalty_pd,
	interest_pd,
	att_fee_pd,
	overage_pd,
	underage_pd,
	coll_month,
	coll_year,
	payments,
	eff_tax_pd,
	fiscal_year,
	begin_dt,
	end_dt
	)
	select
	@input_pacs_user_id,
	bill.entity_id,
	#fmtd_year.sup_tax_yr,
	sum(IsNull(mno_adj, 0) + IsNull(ins_adj, 0)) 			as adj,         
	sum(IsNull(mno_amt, 0) + IsNull(ins_amt, 0)) 			as tax_pd,  
	sum(IsNull(disc_mno_amt, 0) + IsNull(disc_ins_amt, 0)) 		as disc_pd,
	sum(IsNull(pen_mno_amt, 0) + IsNull(pen_ins_amt, 0)) 		as pen_pd, 
	sum(IsNull(int_mno_amt, 0) + IsNull(int_ins_amt, 0)) 		as int_pd, 
	sum(IsNull(atty_fee_amt, 0))					as att_fee_pd,
	sum(IsNull(over_mno_amt, 0) + IsNull(over_ins_amt, 0))		as over_pd,
	sum(IsNull(under_mno_amt, 0) + IsNull(under_ins_amt, 0))	as under_pd,
	@input_month,
	@input_year,
	sum(IsNull(mno_amt, 0) + IsNull(ins_amt, 0) + IsNull(pen_mno_amt, 0) + IsNull(pen_ins_amt, 0) +IsNull(int_mno_amt, 0) + IsNull(int_ins_amt, 0) + IsNull(atty_fee_amt, 0) +IsNull(over_mno_amt, 0) + IsNull(over_ins_amt, 0))  ,
	sum(IsNull(mno_amt, 0) + IsNull(ins_amt, 0) + IsNull(disc_mno_amt, 0) + IsNull(disc_ins_amt, 0) + IsNull(under_mno_amt, 0) + IsNull(under_ins_amt, 0)) ,
	@fiscal_year,
	@input_begin_dt,
	@input_end_dt
	
	from #fmtd_year with (nolock)
	left outer join bill with (nolock) on
	#fmtd_year.sup_tax_yr = bill.sup_tax_yr
	left outer join recap_trans rt with (nolock)     
	on    bill.bill_id = rt.bill_id
	and   rt.balance_dt >= @begin_dt
	and   rt.balance_dt <  @end_dt
	where bill.entity_id = @entity_id
	and   bill.coll_status_cd <> 'RS'
	and   (bill.active_bill = 'T' or bill.active_bill is null)
	
	group by bill.entity_id, #fmtd_year.sup_tax_yr
	order by bill.entity_id, #fmtd_year.sup_tax_yr

	/*update fiscal_month_to_date_recap
	set payments   = tax_pd + penalty_pd  + interest_pd + att_fee_pd + overage_pd,
	    eff_tax_pd = tax_pd + underage_pd + disc_pd
	where entity_id = @entity_id
	and   pacs_user_id = @input_pacs_user_id*/

	insert into fiscal_month_to_date_recap_delq
	(
	pacs_user_id,
	entity_id,
	recap_yr,
	adjustments,
	tax_pd,
	disc_pd,
	penalty_pd,
	interest_pd,
	att_fee_pd,
	overage_pd,
	underage_pd,
	payments,
	eff_tax_pd
	)
	select
	pacs_user_id,
	entity_id,
	0,
	sum(adjustments),
	sum(tax_pd),
	sum(disc_pd),
	sum(penalty_pd),
	sum(interest_pd),
	sum(att_fee_pd),
	sum(overage_pd),
	sum(underage_pd),
	sum(payments),
	sum(eff_tax_pd)
	from fiscal_month_to_date_recap
	where pacs_user_id = @input_pacs_user_id
	and   entity_id    = @entity_id
	and   recap_yr     < @curr_year
	group by pacs_user_id, entity_id


	if (@@ROWCOUNT = 0)
	begin
		insert into fiscal_month_to_date_recap_delq
		(
		pacs_user_id,
		entity_id,
		recap_yr,
		adjustments,
		tax_pd,
		disc_pd,
		penalty_pd,
		interest_pd,
		att_fee_pd,
		overage_pd,
		underage_pd,
		payments,
		eff_tax_pd
		)
		values
		(
		@input_pacs_user_id,
		@entity_id,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0	
		)
	end

	
		
	insert into fiscal_month_to_date_recap_refund
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
	bill.entity_id,
	sum(mno_amt + ins_amt + pen_mno_amt + pen_ins_amt + int_mno_amt + int_ins_amt + atty_fee_amt),
	sum(mno_amt + ins_amt),  
	sum(disc_mno_amt + disc_ins_amt),
	sum(pen_mno_amt + pen_ins_amt), 
	sum(int_mno_amt + int_ins_amt), 
	sum(atty_fee_amt)
	from recap_trans rt with (nolock)
	inner join bill with (nolock)     
	on    rt.bill_id = bill.bill_id
	and   rt.balance_dt >= @begin_dt
	and   rt.balance_dt <  @end_dt
	and   bill.entity_id = @entity_id
	and   (rt.type = 'R'
	or     rt.type = 'VR')
	group by bill.entity_id

	if (@@ROWCOUNT = 0)
	begin
		insert into fiscal_month_to_date_recap_refund
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
	where type = 'FMTD'
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
	select 'FMTD',
	       @entity_id,
	       @input_month,
	       @input_year,
	       sum(eff_tax_pd) - sum(adjustments)
	from fiscal_month_to_date_recap
	where pacs_user_id = @input_pacs_user_id
	and   entity_id    = @entity_id


	drop table #fmtd_year

	fetch next from ENTITY into @entity_id
end

close ENTITY
deallocate ENTITY

GO


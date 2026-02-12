


CREATE          procedure RecapMAOR
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
delete from monthly_as_of_recap_summary 	where pacs_user_id = @input_pacs_user_id
delete from monthly_as_of_recap_mno     	where pacs_user_id = @input_pacs_user_id
delete from monthly_as_of_recap_ins     	where pacs_user_id = @input_pacs_user_id
delete from monthly_as_of_recap_escrow_tax_cert where pacs_user_id = @input_pacs_user_id

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

	declare @fiscal_year		varchar(20)
	declare @fiscal_begin_dt	datetime
	declare @fiscal_end_dt		datetime

	-- I didn't want to loop through each year within the entity, so I elected to do a mass
	-- insert into a temp table for the majority of the adjustment orig tax information and then
	-- from there, we do an update into the temp table for the current and prior year information request
	-- jcoco 10/13/2003
	
	
	select @fiscal_year     = fiscal_year,
	       @fiscal_begin_dt = begin_date,
	       @fiscal_end_dt	= end_date
	from recap_fiscal
	where begin_date <= @begin_dt
	and   end_date   >= @act_end_dt
	and   entity_id   = @entity_id

	-- get maximum year for this fiscal year
	select @curr_year = max(coll_year)
	from recap_fiscal_totals
	where recap_fiscal_totals.fiscal_year = @fiscal_year
	and   recap_fiscal_totals.entity_id   = @entity_id

	
	select    
	recap_fiscal_totals.entity_id,
	recap_fiscal_totals.coll_year,

	-- totals section
	recap_fiscal_totals.beg_mno + recap_fiscal_totals.beg_ins	as orig_tax,
	sum(IsNull(mno_adj, 0) + IsNull(ins_adj, 0)) 			as adj,   
	
	convert(numeric(14,2), 0.00) as prior_collections,
	convert(numeric(14,2), 0.00) as curr_collections,
	convert(numeric(14,2), 0.00) as base_tax,
	convert(numeric(14,2), 0.00) as disc,
	convert(numeric(14,2), 0.00) as underage,
	convert(numeric(14,2), 0.00) as balance,
	
	convert(numeric(14,2), 0.00) as p_i,
	convert(numeric(14,2), 0.00) as atty_fees,
	convert(numeric(14,2), 0.00) as overage    ,  

	-- mno section
	recap_fiscal_totals.beg_mno 					as orig_mno_tax, 
	sum(IsNull(mno_adj, 0))						as mno_adj,  

	convert(numeric(14,2), 0.00) as prior_collections_mno,
	convert(numeric(14,2), 0.00) as curr_collections_mno,
	convert(numeric(14,2), 0.00) as base_tax_mno,
	convert(numeric(14,2), 0.00) as disc_mno,
	convert(numeric(14,2), 0.00) as underage_mno,
	convert(numeric(14,2), 0.00) as balance_mno,
	convert(numeric(14,2), 0.00) as p_i_mno,
	convert(numeric(14,2), 0.00) as overage_mno ,

	-- ins section
	recap_fiscal_totals.beg_ins 					as orig_ins_tax, 
	sum(IsNull(ins_adj, 0))						as ins_adj,  
	
	convert(numeric(14,2), 0.00) as prior_collections_ins,
	convert(numeric(14,2), 0.00) as curr_collections_ins,
	convert(numeric(14,2), 0.00) as base_tax_ins,
	convert(numeric(14,2), 0.00) as disc_ins,
	convert(numeric(14,2), 0.00) as underage_ins,
	convert(numeric(14,2), 0.00) as balance_ins,
	convert(numeric(14,2), 0.00) as p_i_ins,
	convert(numeric(14,2), 0.00) as overage_ins
	
	
	into #maor_totals
	
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


	-- get the prior month collections information
		
	select    
	bill.entity_id,
	bill.sup_tax_yr as coll_year,
	
	sum(IsNull(mno_amt, 0) + IsNull(ins_amt, 0) + 
	    IsNull(disc_mno_amt, 0) + IsNull(disc_ins_amt, 0) + 
	    IsNull(under_mno_amt, 0) + IsNull(under_ins_amt, 0))  	as collections_pd,
	sum(IsNull(mno_amt, 0) + IsNull(ins_amt, 0)) 			as base_tax_pd,
	sum(IsNull(disc_mno_amt, 0) + IsNull(disc_ins_amt, 0))		as disc_pd,
	sum(IsNull(under_mno_amt, 0) + IsNull(under_ins_amt, 0))	as under_pd,

	sum(IsNull(mno_amt, 0) +  
	    IsNull(disc_mno_amt, 0) + 
	    IsNull(under_mno_amt, 0))  					as mno_collections_pd,
	sum(IsNull(mno_amt, 0)) 					as mno_base_tax_pd,
	sum(IsNull(disc_mno_amt, 0))					as mno_disc_pd,
	sum(IsNull(under_mno_amt, 0))					as mno_under_pd,
	sum(IsNull(ins_amt, 0) + 
	    IsNull(disc_ins_amt, 0) + 
	    IsNull(under_ins_amt, 0) )  				as ins_collections_pd,
	sum(IsNull(ins_amt, 0)) 					as ins_base_tax_pd,
	sum(IsNull(disc_ins_amt, 0))					as ins_disc_pd,
	sum(IsNull(under_ins_amt, 0))					as ins_under_pd
  	
	into #maor_prior_totals
	
	from bill
	left outer join  recap_trans rt with (nolock)   
	on    bill.bill_id = rt.bill_id
	and   rt.balance_dt >= @fiscal_begin_dt
	and   rt.balance_dt <  @begin_dt
	where bill.sup_tax_yr <= @curr_year   
	and   bill.coll_status_cd <> 'RS'
	and   (bill.active_bill = 'T' or bill.active_bill is null)
	
	group by bill.entity_id, bill.sup_tax_yr

	-- get the current month collections information

	select    
	bill.entity_id,
	bill.sup_tax_yr as coll_year,
	
	sum(IsNull(mno_amt, 0) + IsNull(ins_amt, 0) + 
	    IsNull(disc_mno_amt, 0) + IsNull(disc_ins_amt, 0) + 
	    IsNull(under_mno_amt, 0) + IsNull(under_ins_amt, 0))  	as collections_pd,
	sum(IsNull(mno_amt, 0) + IsNull(ins_amt, 0)) 			as base_tax_pd,
	sum(IsNull(disc_mno_amt, 0) + IsNull(disc_ins_amt, 0))		as disc_pd,
	sum(IsNull(under_mno_amt, 0) + IsNull(under_ins_amt, 0))	as under_pd,

	sum(IsNull(mno_amt, 0) +  
	    IsNull(disc_mno_amt, 0) + 
	    IsNull(under_mno_amt, 0))  					as mno_collections_pd,
	sum(IsNull(mno_amt, 0)) 					as mno_base_tax_pd,
	sum(IsNull(disc_mno_amt, 0))					as mno_disc_pd,
	sum(IsNull(under_mno_amt, 0))					as mno_under_pd,

	sum(IsNull(ins_amt, 0) + 
	    IsNull(disc_ins_amt, 0) + 
	    IsNull(under_ins_amt, 0) )  				as ins_collections_pd,
	sum(IsNull(ins_amt, 0)) 					as ins_base_tax_pd,
	sum(IsNull(disc_ins_amt, 0))					as ins_disc_pd,
	sum(IsNull(under_ins_amt, 0))					as ins_under_pd,
	
	sum(IsNull(pen_mno_amt,0) + IsNull(pen_ins_amt,0) + 
	    IsNull(int_mno_amt,0) + IsNull(int_ins_amt, 0)) 		as pi_pd,
	sum(IsNull(pen_mno_amt,0)  + 
	    IsNull(int_mno_amt,0) ) 					as mno_pi_pd,
	sum(IsNull(pen_ins_amt,0) + 
	    IsNull(int_ins_amt, 0)) 					as ins_pi_pd,

	sum(IsNull(over_mno_amt,0) + IsNull(over_ins_amt,0)) 		as overage_pd,
	sum(IsNull(over_mno_amt,0)) 					as mno_overage_pd,
	sum(IsNull(over_ins_amt,0)) 					as ins_overage_pd,
	sum(IsNull(atty_fee_amt, 0))					as atty_fee_pd
	 	
	into #maor_curr_totals
	
	from bill
	left outer join  recap_trans rt with (nolock)   
	on    bill.bill_id = rt.bill_id
	and   rt.balance_dt >= @begin_dt
	and   rt.balance_dt <  @end_dt
	where bill.sup_tax_yr <= @curr_year   
	and   bill.coll_status_cd <> 'RS'
	and   (bill.active_bill = 'T' or bill.active_bill is null)
	
	group by bill.entity_id, bill.sup_tax_yr


	-- update prior collections information
	update #maor_totals
	set prior_collections 	  = #maor_prior_totals.collections_pd,
	    prior_collections_mno = #maor_prior_totals.mno_collections_pd,
	    prior_collections_ins = #maor_prior_totals.ins_collections_pd
	from #maor_prior_totals
	where #maor_totals.entity_id = #maor_prior_totals.entity_id
	and   #maor_totals.coll_year = #maor_prior_totals.coll_year


	-- update curr collections information
	update #maor_totals
	set 	curr_collections	= #maor_curr_totals.collections_pd,
		base_tax		= #maor_curr_totals.base_tax_pd,
		disc			= #maor_curr_totals.disc_pd,
		underage		= #maor_curr_totals.under_pd,
		balance			= (orig_tax + adj) - (prior_collections + #maor_curr_totals.collections_pd),
		p_i			= #maor_curr_totals.pi_pd,
		atty_fees		= #maor_curr_totals.atty_fee_pd,
		overage   		= #maor_curr_totals.overage_pd,
		curr_collections_mno	= #maor_curr_totals.mno_collections_pd,
		base_tax_mno		= #maor_curr_totals.mno_base_tax_pd,
		disc_mno		= #maor_curr_totals.mno_disc_pd,
		underage_mno		= #maor_curr_totals.mno_under_pd,
		balance_mno		= (orig_mno_tax + mno_adj) - (prior_collections_mno + #maor_curr_totals.mno_collections_pd),
		p_i_mno			= #maor_curr_totals.mno_pi_pd,
		overage_mno 		= #maor_curr_totals.mno_overage_pd,
		curr_collections_ins	= #maor_curr_totals.ins_collections_pd,
		base_tax_ins		= #maor_curr_totals.ins_base_tax_pd,
		disc_ins		= #maor_curr_totals.ins_disc_pd,
		underage_ins		= #maor_curr_totals.ins_under_pd,
		balance_ins		= (orig_ins_tax + ins_adj) - (prior_collections_ins + #maor_curr_totals.ins_collections_pd),
		p_i_ins			= #maor_curr_totals.ins_pi_pd,
		overage_ins    		= #maor_curr_totals.ins_overage_pd
	from #maor_curr_totals
	where #maor_totals.entity_id = #maor_curr_totals.entity_id
	and   #maor_totals.coll_year = #maor_curr_totals.coll_year

	
	declare @year_minus_ten	numeric(4)


	set @year_minus_ten = @curr_year - 10


	-- 10 years of data.

	insert into monthly_as_of_recap_summary
	(
	pacs_user_id, 
	entity_id  , 
	tax_year, 
	tax_year_desc,             
	beg_balance,     
	adj,              
	adj_balance,      
	prior_collection, 
	curr_collections, 
	base_tax,
	disc,
	underage,
	balance,          
	p_i,              
	atty_fees,        
	overage,          
	total,            
	pct_outstanding,  
	tax_cert,         
	escrow,           
	coll_month,  
	coll_year,
	max_year,
	fiscal_year,
	fiscal_begin_dt,
	fiscal_end_dt,
	begin_dt,
	end_dt
	)
	select 	@input_pacs_user_id,
		entity_id,
		coll_year,
		convert(varchar(4), coll_year),
		orig_tax,
		adj,   
		orig_tax + adj,
		prior_collections,
		curr_collections,
		base_tax,
		disc,
		underage,
		balance,
		p_i,
		atty_fees,
		overage,
		base_tax + p_i + overage + atty_fees,
		case when (orig_tax + adj) > 0 then (balance/(orig_tax + adj)) * 100 else 0 end,
		0,
		0,
		@input_month,
		@input_year,
		@curr_year,
		@fiscal_year,
		@fiscal_begin_dt,
		@fiscal_end_dt,
		@input_begin_dt,
		@input_end_dt
		
		
	from #maor_totals
	where coll_year > @year_minus_ten


	-- other years 
	insert into monthly_as_of_recap_summary
	(
	pacs_user_id, 
	entity_id  , 
	tax_year, 
	tax_year_desc,             
	beg_balance,     
	adj,              
	adj_balance,      
	prior_collection, 
	curr_collections,
	base_tax,
	disc,
	underage,
	balance,          
	p_i,              
	atty_fees,        
	overage,          
	total,            
	pct_outstanding,  
	tax_cert,         
	escrow,           
	coll_month,  
	coll_year,
	max_year,
	fiscal_year,
	fiscal_begin_dt,
	fiscal_end_dt,
	begin_dt,
	end_dt
	)
	select 	@input_pacs_user_id,
		entity_id,
		@year_minus_ten,
		convert(varchar(4), @year_minus_ten) + ' AND PRIOR' ,
		sum(orig_tax),
		sum(adj),   
		sum(orig_tax + adj),
		sum(prior_collections),
		sum(curr_collections),
		sum(base_tax),
		sum(disc),
		sum(underage),
		sum(balance),
		sum(p_i),
		sum(atty_fees),
		sum(overage),
		sum(base_tax + p_i + overage + atty_fees),
		case when sum(orig_tax + adj) > 0 then (sum(balance)/sum(orig_tax + adj)) * 100 else 0 end,
		0,
		0,
		@input_month,
		@input_year,
		@curr_year,
		@fiscal_year,
		@fiscal_begin_dt,
		@fiscal_end_dt,
		@input_begin_dt,
		@input_end_dt
		
		
	from #maor_totals
	where coll_year <= @year_minus_ten
	group by entity_id


	-- mno breakdown
	insert into monthly_as_of_recap_mno
	(
	pacs_user_id, 
	entity_id  , 
	tax_year, 
	tax_year_desc,             
	beg_balance_mno,     
	adj_mno,              
	adj_balance_mno,      
	prior_collection_mno, 
	curr_collections_mno, 
	base_tax_mno,
	disc_mno,
	underage_mno,
	balance_mno,          
	p_i_mno,              
	overage_mno,          
	total_mno,            
	pct_outstanding_mno,  
	coll_month,  
	coll_year,
	max_year
	)
	select 	@input_pacs_user_id,
		entity_id,
		coll_year,
		convert(varchar(4), coll_year),
		orig_mno_tax,
		mno_adj,   
		orig_mno_tax + mno_adj,
		prior_collections_mno,
		curr_collections_mno,
		base_tax_mno,
		disc_mno,
		underage_mno,
		balance_mno,
		p_i_mno,
		overage_mno,
		base_tax_mno + p_i_mno + overage_mno,
		case when (orig_mno_tax + mno_adj) > 0 then (balance_mno/(orig_mno_tax + mno_adj)) * 100 else 0 end,
		@input_month,
		@input_year,
		@curr_year
		
		
	from #maor_totals
	order by coll_year desc

	-- ins breakdown
	insert into monthly_as_of_recap_ins
	(
	pacs_user_id, 
	entity_id  , 
	tax_year, 
	tax_year_desc,             
	beg_balance_ins,     
	adj_ins,              
	adj_balance_ins,      
	prior_collection_ins, 
	curr_collections_ins, 
	base_tax_ins,
	disc_ins,
	underage_ins,
	balance_ins,          
	p_i_ins,              
	overage_ins,          
	total_ins,            
	pct_outstanding_ins,  
	coll_month,  
	coll_year,
	max_year
	)
	select 	@input_pacs_user_id,
		entity_id,
		coll_year,
		convert(varchar(4), coll_year),
		orig_ins_tax,
		ins_adj,   
		orig_ins_tax + ins_adj,
		prior_collections_ins,
		curr_collections_ins,
		base_tax_ins,
		disc_ins,
		underage_ins,
		balance_ins,
		p_i_ins,
		overage_ins,
		base_tax_ins + p_i_ins + overage_ins,
		case when (orig_ins_tax + ins_adj) > 0 then (balance_ins/(orig_ins_tax + ins_adj)) * 100 else 0 end,
		@input_month,
		@input_year,
		@curr_year
		
		
	from #maor_totals
	order by coll_year

	-- make entries for fees and tax certificates
	declare @tax_cert numeric(14,2)

	set @tax_cert = 0

	select @tax_cert = sum(fee_amt)
	from fee with (nolock), fee_prop_entity_assoc fea with (nolock),
	payment p with (nolock), payment_trans pt with (nolock), batch with (nolock)
	where fee.fee_id = fea.fee_id
	and   pt.fee_id = fee.fee_id
	and   pt.payment_id = p.payment_id
	and   p.batch_id = batch.batch_id
	and   batch.balance_dt >= @begin_dt
	and   batch.balance_dt <  @end_dt
	and   fea.entity_id = @entity_id
	and   fee.type_cd = 'TC'
	
	insert into monthly_as_of_recap_escrow_tax_cert
	(
	pacs_user_id,
	entity_id,
	tax_cert,
	escrow
	)
	values
	(
	@input_pacs_user_id,
	@entity_id,
	@tax_cert,
	0
	)
	
	

	drop table #maor_totals
	drop table #maor_prior_totals
	drop table #maor_curr_totals


	fetch next from ENTITY into @entity_id
end

close ENTITY
deallocate ENTITY

GO


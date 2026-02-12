
CREATE       procedure ExportCollectionData

@Entities		varchar(1000),
@Option		varchar(5),
@Year			numeric(4),
@BillAdjustmentCodes	varchar(1000),
@PropertyTypes	varchar(1000),
@PaidBills		varchar(1),
@BillsWithRefundDue	varchar(1),
@AsOfDate		varchar(25),
@bGenerateEvent		int

as

--Revision History
--1.0 Created
--1.1 12/10/2003 ELZ; The zip code was being updated from the country_cd field... reported by a couple clients, HelpSTAR #13167
--1.2 1/23/2004 Darren; The adjustment codes should now be showing in the coll_data file  HS#13929
--1.3  HS 13061 PratimaV ,the collections transfer totals were not balancing DTR

truncate table transfer_delq_tax
truncate table transfer_delq_tax_totals


declare @end_dt			varchar(100)
declare @strSQL			varchar(8000)
declare @CollYear		numeric(4)
declare @new_event_id	numeric(10)
declare @prop_id		numeric(10)
declare @Cursor 		varchar(1000)
declare @entity_id		int


select @CollYear = tax_yr from pacs_system
set @end_dt = convert(varchar(100), dateadd(dd, 1, convert(datetime, @AsOfDate)))

-- create a temp table to outer join on that contai
select entity_id, max(tax_rate_yr) as tax_rate_yr
into #tax_rate
from tax_rate with (nolock)
where bills_created_dt < @end_dt
group by entity_id

create index #tax_rate_entity_id_ndx ON #tax_rate(entity_id)

create table #transfer_delq_tax
(
	[prop_id] [int] NULL ,
	[prop_type_cd] [char] (5)  NULL ,
	[geo_id] [char] (50)  NULL ,
	[owner_id] [int] NULL ,
	[owner_name] [char] (70)  NULL ,
	[addr_line1] [char] (60)  NULL ,
	[addr_line2] [char] (60)  NULL ,
	[addr_line3] [char] (60)  NULL ,
	[addr_city] [char] (50)  NULL ,
	[addr_state] [char] (50)  NULL ,
	[addr_zip] [char] (50)  NULL ,
	[addr_country_cd] [char] (5)  NULL ,
	[addr_deliverable] [char] (1)  NULL ,
	[legal_desc] [char] (255)  NULL ,
	[freeze_yr] [char] (4)  NULL ,
	[freeze_ceiling] [char] (16)  NULL ,
	[bill_id] [int] NULL ,
	[entity_id] [int] NULL ,
	[entity_cd] [char] (5)  NULL ,
	[entity_tax_yr] [char] (4)  NULL ,
	[stmnt_id] [int] NULL ,
	[assessed_val] [numeric](14, 0) NULL ,
	[taxable_val] [numeric](14, 0) NULL ,
	[effective_due_dt] [char] (25)  NULL ,
	[base_mno] [numeric](14, 2) NULL ,
	[base_ins] [numeric](14, 2) NULL ,
	[base_mno_due] [numeric](14, 2) NULL ,
	[base_ins_due] [numeric](14, 2) NULL ,
	[adjustment_code] [char] (10)  NULL ,
	[suit_num] [char] (50)  NULL ,
	[bankruptcy_num] [char] (50)  NULL ,
	[judgement_date] [char] (25)  NULL ,
	[judge_from_yr] [char] (4)  NULL ,
	[judge_to_yr] [char] (4)  NULL ,
	[mortgage_lender] [char] (70)  NULL ,
	[mortgage_acct_no] [char] (50)  NULL ,
	[deferral_begin] [char] (25)  NULL ,
	[deferral_end] [char] (25)  NULL ,
	[mh_lein_date] [char] (25)  NULL ,
	[mh_release_date] [char] (25)  NULL,
)

create index #transfer_delq_tax_ndx ON #transfer_delq_tax(prop_id)

set @strSQL = ' insert into #transfer_delq_tax '
set @strSQL = @strSQL + ' (prop_id, owner_id, bill_id, entity_id, entity_cd, entity_tax_yr, stmnt_id, assessed_val, '
set @strSQL = @strSQL + ' taxable_val, effective_due_dt, base_mno, base_ins, base_mno_due, base_ins_due, '
set @strSQL = @strSQL + ' deferral_begin, deferral_end, adjustment_code) '
set @strSQL = @strSQL + ' select '
set @strSQL = @strSQL + ' bill.prop_id, '
set @strSQL = @strSQL + ' p.col_owner_id, '
set @strSQL = @strSQL + ' bill.bill_id,  '   
set @strSQL = @strSQL + ' bill.entity_id,   ' 
set @strSQL = @strSQL + ' entity.entity_cd, '
set @strSQL = @strSQL + ' bill.sup_tax_yr, ' 
set @strSQL = @strSQL + ' bill.stmnt_id, ' 
set @strSQL = @strSQL + ' bill.bill_assessed_value, '
set @strSQL = @strSQL + ' bill.bill_taxable_val, '
set @strSQL = @strSQL + ' bill.effective_due_dt, '                                   
set @strSQL = @strSQL + ' bill.bill_m_n_o, '
set @strSQL = @strSQL + ' bill.bill_i_n_s, '
set @strSQL = @strSQL + ' (bill_m_n_o + sum(IsNull(mno_adj, 0)))  - (sum(IsNull(mno_amt, 0)) + sum(IsNull(disc_mno_amt, 0)) + sum(IsNull(under_mno_amt, 0))), '  
set @strSQL = @strSQL + ' (bill_i_n_s + sum(IsNull(ins_adj, 0)))  - (sum(IsNull(ins_amt, 0)) + sum(IsNull(disc_ins_amt, 0)) + sum(IsNull(under_ins_amt, 0))), '
set @strSQL = @strSQL + ' bill.adj_effective_dt, '                                                                                                               
set @strSQL = @strSQL + ' bill.adj_expiration_dt, '
--	set @strSQL = @strSQL + ' bill.adjustment_code '
set @strSQL = @strSQL + ' case when bill.adjustment_code = ''N'' and bill.pay_type = ''Q'' then ''QTR_S''  '
	set @strSQL = @strSQL + '      when bill.adjustment_code = ''N'' and bill.pay_type = ''H'' then ''HALF_S''  '
set @strSQL = @strSQL + '      else bill.adjustment_code end  '
set @strSQL = @strSQL + ' from bill with (nolock)'
set @strSQL = @strSQL + ' inner join property as p with (nolock) on '
set @strSQL = @strSQL + ' bill.prop_id = p.prop_id  '

if (@PropertyTypes <> '')
begin
	set @strSQL = @strSQL + ' and p.prop_type_cd in (' + @PropertyTypes + ')'
end

set @strSQL = @strSQL + ' inner join entity with (nolock) on '
set @strSQL = @strSQL + ' bill.entity_id = entity.entity_id  '
set @strSQL = @strSQL + ' left outer join recap_trans rt with (nolock)  '   
set @strSQL = @strSQL + ' on    bill.bill_id = rt.bill_id'
set @strSQL = @strSQL + ' and   rt.balance_dt < ''' +  convert(varchar(20), @end_dt) + ''''

if (@BillAdjustmentCodes <> '')
begin
	set @strSQL = @strSQL + ' inner join bill_adjust_code with (nolock) on '
	set @strSQL = @strSQL + ' bill_adjust_code.adjust_cd = bill.adjustment_code and '
	set @strSQL = @strSQL + ' bill_adjust_code.adjust_cd not in (' + @BillAdjustmentCodes + ')'
end

set @strSQL = @strSQL + ' left outer join #tax_rate with (nolock) on '
set @strSQL = @strSQL + ' bill.entity_id = #tax_rate.entity_id '
	
if (@Entities = '')
begin
	set @strSQL = @strSQL + ' inner join entity_collect_for_vw with (nolock) on'
	set @strSQL = @strSQL + ' entity_collect_for_vw.entity_id = bill.entity_id'
end

if (@Entities <> '')
begin
	set @strSQL = @strSQL + ' where bill.entity_id in (' +  @Entities + ')'
	set @strSQL = @strSQL + ' and 	bill.coll_status_cd <> ''RS'''
	set @strSQL = @strSQL + ' and   isnull(bill.active_bill,''T'') = ''T'' '
end
else
begin
	set @strSQL = @strSQL + ' where bill.coll_status_cd <> ''RS'''
	set @strSQL = @strSQL + ' and   isnull(bill.active_bill,''T'') = ''T'' '
end

if (@Option = 'D')
begin
	set @strSQL = @strSQL + ' and bill.sup_tax_yr <  CASE WHEN ' + convert(varchar(4), @CollYear)
	set @strSQL = @strSQL + ' > #tax_rate.tax_rate_yr THEN #tax_rate.tax_rate_yr+1 ELSE '
	set @strSQL = @strSQL + convert(varchar(4), @CollYear) + ' END '
end
else if (@Option = 'S')
begin
	set @strSQL = @strSQL + ' and bill.sup_tax_yr = '
	set @strSQL = @strSQL + convert(varchar(4), @Year)
end

set @strSQL = @strSQL + ' group by'
set @strSQL = @strSQL + ' bill.prop_id, '
set @strSQL = @strSQL + ' p.col_owner_id, '
set @strSQL = @strSQL + ' bill.bill_id,  '
set @strSQL = @strSQL + ' bill.entity_id,     '     
set @strSQL = @strSQL + ' entity.entity_cd, '
set @strSQL = @strSQL + ' bill.sup_tax_yr, '
set @strSQL = @strSQL + ' bill.stmnt_id, '
set @strSQL = @strSQL + ' bill.bill_assessed_value, '
set @strSQL = @strSQL + ' bill.bill_taxable_val, '
set @strSQL = @strSQL + ' bill.effective_due_dt, '                
set @strSQL = @strSQL + ' bill.bill_m_n_o,'
set @strSQL = @strSQL + ' bill.bill_i_n_s, '
set @strSQL = @strSQL + ' bill.adj_effective_dt , '
set @strSQL = @strSQL + ' bill.adj_expiration_dt, '
--	set @strSQL = @strSQL + ' bill.adjustment_code, '	
set @strSQL = @strSQL + ' case when bill.adjustment_code = ''N'' and bill.pay_type = ''Q'' then ''QTR_S''  '
set @strSQL = @strSQL + '      when bill.adjustment_code = ''N'' and bill.pay_type = ''H'' then ''HALF_S''  '
set @strSQL = @strSQL + '      else bill.adjustment_code end	'		

print @strSQL
exec (@strSQL)
	

if (@BillsWithRefundDue = 'F')
begin
	delete from #transfer_delq_tax where (base_mno_due + base_ins_due) < 0
end

if (@PaidBills = 'F')
begin
	delete from #transfer_delq_tax where (base_mno_due + base_ins_due) = 0
end

-- make the following queries a lot easier  we want the latest tax year <= @CollYear and the 
-- sup_num for that tax year for each property
select psa.prop_id, psa.sup_num, psa.owner_tax_yr
into #prop_supp_assoc
from
(
	select prop_id, max(owner_tax_yr) as owner_tax_yr
	from prop_supp_assoc with (nolock)
	where owner_tax_yr <= @CollYear
	group by prop_id, sup_num
) as tmp_psa
inner join prop_supp_assoc as psa with (nolock) 
on psa.prop_id = tmp_psa.prop_id and psa.owner_tax_yr = tmp_psa.owner_tax_yr

create index #prop_supp_assoc_ndx ON #prop_supp_assoc(prop_id, sup_num)

-- set property information

update #transfer_delq_tax
set
	prop_type_cd = property.prop_type_cd,
	geo_id = property.geo_id,
	legal_desc = property_val.legal_desc,
	owner_name = account.file_as_name,
	addr_line1 = address.addr_line1,
	addr_line2 = address.addr_line2,
	addr_line3 = address.addr_line3,
	addr_city = address.addr_city,
	addr_state = address.addr_state,
	addr_zip = address.addr_zip,
	addr_country_cd = address.country_cd,
	addr_deliverable = address.ml_deliverable,
	mortgage_lender = mortgage_account.file_as_name,
	mortgage_acct_no = mortgage_acct_id
from
	property with (nolock)
inner join
	#transfer_delq_tax with (nolock)
on
	#transfer_delq_tax.prop_id = property.prop_id
inner join
	property_val with (nolock)
on
	property.prop_id = property_val.prop_id
inner join
	#prop_supp_assoc with (nolock)
on
	property_val.prop_id = #prop_supp_assoc.prop_id
and	property_val.sup_num = #prop_supp_assoc.sup_num
and	property_val.prop_val_yr = #prop_supp_assoc.owner_tax_yr
inner join
	account with (nolock)
on
	#transfer_delq_tax.owner_id = account.acct_id
inner join
	address with (nolock)
on
	account.acct_id = address.acct_id
and	address.primary_addr = 'Y'
left outer join
	mortgage_assoc with (nolock)
on
	#transfer_delq_tax.prop_id = mortgage_assoc.prop_id 
left outer join
	account as mortgage_account with (nolock)
on
	mortgage_assoc.mortgage_co_id = mortgage_account.acct_id


update #transfer_delq_tax
set
	freeze_yr = property_freeze.freeze_yr,
	freeze_ceiling = property_freeze.freeze_ceiling
from
	property with (nolock)
inner join
	#transfer_delq_tax with (nolock)
on
	#transfer_delq_tax.prop_id = property.prop_id
inner join
	property_val with (nolock)
on
	property.prop_id = property_val.prop_id
inner join
	#prop_supp_assoc with (nolock)
on
	property_val.prop_id = #prop_supp_assoc.prop_id
and	property_val.sup_num = #prop_supp_assoc.sup_num
and	property_val.prop_val_yr = #prop_supp_assoc.owner_tax_yr
inner join
	property_freeze with (Nolock)
on
	property_val.prop_id = property_freeze.prop_id
and	property_val.sup_num = property_freeze.sup_num
and	property_val.prop_val_yr = property_freeze.owner_tax_yr
and 	property_val.prop_val_yr = property_freeze.exmpt_tax_yr
and	#transfer_delq_tax.owner_id = property_freeze.owner_id
and	#transfer_delq_tax.entity_id = property_freeze.entity_id
and	property_freeze.use_freeze = 'T'
inner join
	account with (nolock)
on
	#transfer_delq_tax.owner_id = account.acct_id



set @strSQL = 'insert into transfer_delq_tax
(
prop_id,     
prop_type_cd, 
geo_id,                                             
owner_id,    
owner_name,                                                             
addr_line1,                                                   
addr_line2,                                                   
addr_line3,                                                   
addr_city,                                          
addr_state,                                         
addr_zip,                                           
addr_country_cd, 
addr_deliverable, 
legal_desc,                                                                                                                                                                                                                                                   ..  
freeze_yr, 
freeze_ceiling,   
bill_id,     
entity_id,   
entity_cd, 
entity_tax_yr, 
stmnt_id,    
assessed_val,     
taxable_val,      
effective_due_dt,          
base_mno,        
base_ins,         
base_mno_due,     
base_ins_due,     
adjustment_code, 
suit_num,                                           
bankruptcy_num,                                     
judgement_date,            
judge_from_yr, 
judge_to_yr, 
mortgage_lender,                                                        
mortgage_acct_no,                                   
deferral_begin,           
deferral_end,              
mh_lein_date,             
mh_release_date           
)
select
prop_id,     
prop_type_cd, 
geo_id,                                             
owner_id,    
owner_name,                                                             
addr_line1,                                                   
addr_line2,                                                   
addr_line3,                                                   
addr_city,                                          
addr_state,                                         
addr_zip,                                           
addr_country_cd, 
addr_deliverable, 
legal_desc,                                                                                                                                                                                                                                                   ..  
freeze_yr, 
freeze_ceiling,   
bill_id,     
entity_id,   
entity_cd, 
entity_tax_yr, 
stmnt_id,    
assessed_val,     
taxable_val,      
effective_due_dt,          
base_mno,        
base_ins,         
base_mno_due,     
base_ins_due,     
adjustment_code, 
suit_num,                                           
bankruptcy_num,                                     
judgement_date,            
judge_from_yr, 
judge_to_yr, 
mortgage_lender,                                                        
mortgage_acct_no,                                   
deferral_begin,           
deferral_end,              
mh_lein_date,             
mh_release_date           
from #transfer_delq_tax '

exec (@strSQL)

if(@bGenerateEvent = 1)
begin

	exec dbo.GetUniqueID 'event', @new_event_id output, 1, 0

		insert into event values 
		(
		@new_event_id,
		'C',
		'SYSTEM',
		GETDATE(),
		'SYSTEM',
		'The Collection Data was exported as of date '+ @AsOfDate ,
		NULL,
		NULL,
		NULL,
		0,
		0,
		0,
		0,
		0,
		0
		)

		insert into prop_event_assoc (prop_id, event_id)
		select distinct prop_id, @new_event_id from transfer_delq_tax 
end


insert into transfer_delq_tax_totals
(
entity_id  , 
entity_cd ,
entity_tax_yr, 
bill_count,  
base_mno,         
base_ins ,        
mno_due  ,        
ins_due          
)
select
entity_id,
entity_cd,
entity_tax_yr,
count(*),
sum(base_mno),
sum(base_ins),
sum(base_mno_due),
sum(base_ins_due)
from transfer_delq_tax
group by entity_id, entity_cd, entity_tax_yr

drop table #transfer_delq_tax
drop table #prop_supp_assoc
drop table #tax_rate

GO



---here is how you set up the monitor call:  {Call monitor_UnpaidStatements}    

     



CREATE procedure [dbo].monitor_UnpaidStatements          


as 

set nocount on


--drop table #bill_tmp
    
     

select p.prop_id, p.geo_id, p.col_owner_id, a.file_as_name, b.display_year, b.statement_id,		---62754
	sum((b.current_amount_due - b.amount_paid) + (isnull(bf.base_due, 0)))  base_due
into #bill_tmp
from bill b with(Nolock)
join property p with(nolock)
	on p.prop_id = b.prop_id
join account a with(Nolock)
	on a.acct_id = p.col_owner_id
left join (select bfa.bill_id, f.display_year, f.statement_id, sum(f.current_amount_due - f.amount_paid) base_due
			from fee f with(nolock)
			join bill_fee_assoc bfa with(nolock)
				on bfa.fee_id = f.fee_id
			where f.is_active = 1
			and (f.current_amount_due - f.amount_paid) <> 0
			group by bfa.bill_id, f.display_year, f.statement_id) bf
	on bf.bill_id = b.bill_id
	and bf.display_year = b.display_year
	and bf.statement_id = b.statement_id
where b.is_active = 1
group by p.prop_id, p.geo_id, p.col_owner_id, a.file_as_name, b.display_year, b.statement_id
having sum((b.current_amount_due - b.amount_paid) + (isnull(bf.base_due, 0)))  <> 0
order by p.prop_id, b.display_year


select fpa.prop_id, p.geo_id, p.col_owner_id, a.file_as_name,
	f.display_year, f.statement_id, sum(f.current_amount_due - f.amount_paid) base_due		--(908 row(s) affected)
into #fee_tmp
from fee_prop_assoc fpa with(nolock)
join property p with(nolock)
	on p.prop_id = fpa.prop_id
join account a with(nolock)
	on a.acct_id = p.col_owner_id
join fee f with(Nolock)
	on f.fee_id = fpa.fee_id
where f.is_active = 1
and (f.current_amount_due - f.amount_paid) <> 0
group by fpa.prop_id, p.geo_id, p.col_owner_id, a.file_as_name,
	f.display_year, f.statement_id

--drop table #fee_tmp


select b.prop_id, b.geo_id, b.col_owner_id, b.file_as_name, b.display_year, b.statement_id, (b.base_due + isnull(f.base_due,0)) base_due
from #bill_tmp b
left join #fee_tmp f
	on f.prop_id = b.prop_id
	and f.display_year = b.display_year
	and f.statement_id = b.statement_id

union


select f.prop_id, f.geo_id, f.col_owner_id, f.file_as_name, f.display_year, f.statement_id, f.base_due
from #fee_tmp f 
where not exists 
	(select * from #bill_tmp
	where prop_id = f.prop_id
	and display_year = f.display_year
	and statement_id = f.statement_id)

GO


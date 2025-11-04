

CREATE procedure [dbo].[MONITOR_MissingTransactionSearch]


as

SET NOCOUNT ON

select tgt.trans_group_type_cd, tgt.trans_group_type_desc, 	'Missing Payment Transaction' as MissingRecord	
into #monitor_trans_group
from trans_group tg with(nolock)
join trans_group_type tgt with(nolock)
	on tgt.trans_group_type_cd = tg.trans_group_type
where mrtransid_pay is NULL
and trans_group_id in 
	(select trans_group_id from coll_transaction ct with(nolock)
		where transaction_type like 'p%')

insert into #monitor_trans_group
select tgt.trans_group_type_cd, tgt.trans_group_type_desc, 	'Missing Adjust Transaction' as MissingRecord	
from trans_group tg with(nolock)
join trans_group_type tgt with(nolock)
	on tgt.trans_group_type_cd = tg.trans_group_type
where mrtransid_adj is NULL
and tgt.trans_group_type_cd in ('AB', 'LB')
and trans_group_id in 
	(select trans_group_id from coll_transaction ct with(nolock)
		where transaction_type like 'adj%')



begin

if not exists (select * from #monitor_trans_group)
	
	select 'No Missing Transactions' as Comment

else 
	 
		select * from #monitor_trans_group
end

GO


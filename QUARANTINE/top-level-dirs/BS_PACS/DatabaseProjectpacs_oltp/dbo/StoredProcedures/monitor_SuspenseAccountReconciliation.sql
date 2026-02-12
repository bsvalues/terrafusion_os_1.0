  
  
CREATE procedure [dbo].[monitor_SuspenseAccountReconciliation]  

/*  This monitor was written for Benton Treasurer to provide them with a list of all financial transactions 
related to escrow that they can use to tie back the account balances to the properties in PACS.

{Call monitor_SuspenseAccountReconciliation ('6411101.239.11')}
*/
  
@account_number	 varchar(259)
  
as  
  
SET NOCOUNT ON   

select fa.account_number, fa.account_description, 
	ft.fin_transaction_id as ID, ft.transaction_date as Date, ft.fin_event_cd as Type, ft.description as Description, 
	case when ft.fin_event_cd ='GJ'then  0
		when fin_event_cd <>'GJ'and ft.debit_amount is NULL then isnull(c.escrow_id, 0)
		when fin_event_cd <>'GJ'and ft.credit_amount is NULL then isnull(d.escrow_id, 0)else''end as EscrowID,
	case when ft.fin_event_cd ='GJ'then 0 
		when fin_event_cd <>'GJ'and ft.debit_amount is NULL then isnull(c.prop_id, 0)
		when fin_event_cd <>'GJ'and ft.credit_amount is NULL then isnull(d.prop_id, 0)else''end as PropID,
	case when ft.fin_event_cd ='GJ'then''
		when fin_event_cd <>'GJ'and ft.debit_amount is NULL then isnull(c.geo_id,'')
		when fin_event_cd <>'GJ'and ft.credit_amount is NULL then isnull(d.geo_id,'')else''end as Parcel#,
	case when ft.fin_event_cd ='GJ'then 0
		when fin_event_cd <>'GJ'and ft.debit_amount is NULL then isnull(c.year, 0)
		when fin_event_cd <>'GJ'and ft.credit_amount is NULL then isnull(d.year, 0)else''end as Year,
	case when ft.fin_event_cd ='GJ'and ft.credit_amount is NULL then ft.debit_amount
		when fin_event_cd <>'GJ'and ft.credit_amount is NULL then isnull(d.base, 0)else 0 end as Debit,
	case when ft.fin_event_cd ='GJ'and ft.debit_amount is NULL then ft.credit_amount
		when fin_event_cd <>'GJ'and ft.debit_amount is NULL then isnull(c.base, 0)else 0 end as  Credit
from fin_transaction ft with(nolock)
join fin_account fa with(nolock)
	on fa.fin_account_id = ft.fin_account_id
left join (select fcta.fin_transaction_id, e.escrow_id, e.prop_id, p.geo_id, e.year,sum(pct.base_amount_pd) base	
			from fin_coll_transaction_assoc fcta with(nolock)
			join posted_coll_transaction pct with(nolock)
				on pct.posted_transaction_id = fcta.posted_transaction_id
			join escrow e with(nolock)
				on e.escrow_id = pct.trans_group_id
			join property p with(nolock)
				on p.prop_id = e.prop_id
			group by fcta.fin_transaction_id, e.escrow_id, e.prop_id, p.geo_id, e.year)  c
	on c.fin_transaction_id = ft.fin_transaction_id 
	and ft.debit_amount is NULL
left join (select fcta.fin_transaction_id, e.escrow_id, e.prop_id, p.geo_id, e.year,sum(-1*pct.base_amount_pd) base
			from fin_coll_transaction_assoc fcta with(nolock)
			join posted_coll_transaction pct with(nolock)
				on pct.posted_transaction_id = fcta.posted_transaction_id
			join escrow e with(nolock)
				on e.escrow_id = pct.trans_group_id
			join property p with(nolock)
				on p.prop_id = e.prop_id
			group by fcta.fin_transaction_id, e.escrow_id, e.prop_id, p.geo_id, e.year) d
	on d.fin_transaction_id = ft.fin_transaction_id
	and ft.credit_amount is NULL
where fa.account_number = @account_number
and (ft.fin_event_cd = 'GJ' 
	or ft.create_process_id not in (select distribution_id from distribution where undo_distribution_id is not NULL or distribution_type = 'U'))
order by ft.transaction_date, ft.fin_transaction_id

GO


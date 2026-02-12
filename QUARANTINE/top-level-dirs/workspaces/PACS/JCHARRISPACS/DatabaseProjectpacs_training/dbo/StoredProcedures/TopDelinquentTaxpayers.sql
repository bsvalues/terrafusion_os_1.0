

CREATE procedure TopDelinquentTaxpayers
as

----------------------------------------------------------------------
-- Top 50 Delinquent Taxpayers by Owner_ID
----------------------------------------------------------------------
set nocount on
--drop table #top_taxpayers3
create table #top_taxpayers3 (owner_id int, total_base_tax_due numeric(14,2))


	insert into #top_taxpayers3(owner_id, total_base_tax_due)

	select top 50 owner_id, sum((bill.bill_adj_m_n_o + bill_adj_i_n_s) - 
                 		  ((bill.bill_m_n_o_pd + bill.bill_i_n_s_pd + discount_mno_pd + discount_ins_pd + underage_mno_pd +  underage_ins_pd) - 
		 		  (bill.refund_m_n_o_pd + bill.refund_i_n_s_pd + bill.refund_disc_mno_pd + bill.refund_disc_ins_pd))) as total_base_tax_due
	from bill
	where  (bill.coll_status_cd <> 'RS') and ( bill.active_bill = 'T' or bill.active_bill is null)
	group by owner_id
	order by total_base_tax_due desc


set nocount off

print 'Totals of top 50 taxpayers grouped by Owner_Id'
select a.owner_id, file_as_name, total_base_tax_due
from #top_taxpayers3 as a
join account on
		account.acct_id = a.owner_id
order by total_base_tax_due desc


----------------------------------------------------------------------
-- Top 50 Delinquent Taxpayers Grouped by Prop_ID
----------------------------------------------------------------------
set nocount on
--drop table #top_taxpayers2
create table #top_taxpayers2 (prop_id int, owner_id int, total_base_tax_due numeric(14,2))


	insert into #top_taxpayers2(prop_id, owner_id, total_base_tax_due)

	select top 50 prop_id, owner_id, sum((bill.bill_adj_m_n_o + bill_adj_i_n_s) - 
                 		  ((bill.bill_m_n_o_pd + bill.bill_i_n_s_pd + discount_mno_pd + discount_ins_pd + underage_mno_pd +  underage_ins_pd) - 
		 		  (bill.refund_m_n_o_pd + bill.refund_i_n_s_pd + bill.refund_disc_mno_pd + bill.refund_disc_ins_pd))) as total_base_tax_due
	from bill
	where  (bill.coll_status_cd <> 'RS') and ( bill.active_bill = 'T' or bill.active_bill is null)
	group by prop_id, owner_id
	order by total_base_tax_due desc


set nocount off

print 'Totals of top 50 taxpayers grouped by Prop_ID'
select #top_taxpayers2.prop_id, #top_taxpayers2.owner_id, file_as_name, total_base_tax_due
from #top_taxpayers2
join CURR_TAX_PROP_INFO_VW ctpiv on
		ctpiv.prop_id = #top_taxpayers2.prop_id and
		ctpiv.owner_id = #top_taxpayers2.owner_id
order by total_base_tax_due desc

----------------------------------------------------------------------
-- Top 20 Taxpayers Grouped by Entity
----------------------------------------------------------------------

set nocount on

declare @entity_id int

--drop table #top_taxpayers
create table #top_taxpayers (prop_id int, owner_id int, entity_id int, total_base_tax_due numeric(14,2))

DECLARE ENTITY_ITEM SCROLL CURSOR
FOR select distinct entity_id from bill

OPEN ENTITY_ITEM
FETCH NEXT FROM ENTITY_ITEM into	@entity_id

while (@@FETCH_STATUS = 0)
begin

	insert into #top_taxpayers(prop_id, owner_id, entity_id, total_base_tax_due)

	select top 20 prop_id, owner_id, entity_id, sum((bill.bill_adj_m_n_o + bill_adj_i_n_s) - 
                 		  ((bill.bill_m_n_o_pd + bill.bill_i_n_s_pd + discount_mno_pd + discount_ins_pd + underage_mno_pd +  underage_ins_pd) - 
		 		  (bill.refund_m_n_o_pd + bill.refund_i_n_s_pd + bill.refund_disc_mno_pd + bill.refund_disc_ins_pd))) as total_base_tax_due
	from bill
	where  (bill.coll_status_cd <> 'RS') and ( bill.active_bill = 'T' or bill.active_bill is null)
		and entity_id = @entity_id
	group by prop_id, owner_id, entity_id
	order by total_base_tax_due desc

	FETCH NEXT FROM ENTITY_ITEM into @entity_id
end
CLOSE ENTITY_ITEM
DEALLOCATE ENTITY_ITEM
set nocount off

select count(*) from #top_taxpayers

print 'Totals of top 20 taxpayers grouped by Entity_ID'
select #top_taxpayers.prop_id, #top_taxpayers.owner_id, file_as_name, entity_cd, total_base_tax_due
from #top_taxpayers
join CURR_TAX_PROP_INFO_VW ctpiv on
		ctpiv.prop_id = #top_taxpayers.prop_id and
		ctpiv.owner_id = #top_taxpayers.owner_id
left outer join entity on
		entity.entity_id = #top_taxpayers.entity_id
where total_base_tax_due > 0
order by entity_cd, total_base_tax_due desc

GO


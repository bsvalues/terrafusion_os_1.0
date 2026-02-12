
CREATE procedure [dbo].[WorkflowGetRefundCredits]
as

declare @refund_search table
(
        trans_group_id int,
        prop_id int null,
        owner_name varchar(70),
        taxpayer_id int,
        sup_num int,
        sup_group_id int,
        tax_year numeric(4,0),
        statement_id int,
        payee_id int,
        owner_id int,
        last_adjustment_date datetime,
        last_payment_date datetime,
        levy_or_rollback bit,
        type_desc varchar(70),
        last_payor_id int,
        last_payor_name varchar(70),
        operator_or_source varchar(50),
        last_modify_cd varchar(10),
        year numeric(4,0),
        refund_type_cd varchar(20),
        refund_reason varchar(50),
        interest_check bit,
        interest_to_refund_amount numeric(6,4),
        credit_description varchar(500),
        --
        latest_adjustment_trans_id int,
        latest_payment_trans_id int,
        latest_payment_id int,
        owner_at_time_of_latest_payment int,
        current_set bit,
        passed_criteria bit
)

declare @tax_year numeric(4,0)
declare @current_year numeric(4,0)

select top 1 @tax_year = tax_yr
from pacs_system (nolock)

select @current_year = MAX(tax_yr)
from pacs_year (nolock)


-- find the search result credits

insert @refund_search (trans_group_id, prop_id, tax_year, owner_id, taxpayer_id,
        type_desc, last_modify_cd, credit_description, statement_id, current_set, 
        passed_criteria, levy_or_rollback)
select opc.overpmt_credit_id, opc.prop_id, @tax_year, opc.acct_id, opc.acct_id,
        '', '', opc.description, NULL, 1, 0, 0
from overpayment_credit opc with(nolock)
inner join trans_group as tg with(nolock) on tg.trans_group_id = opc.overpmt_credit_id
inner join coll_transaction as ct with(nolock) on ct.transaction_id = tg.mrtransid_opc
inner join batch as bt with(nolock) on bt.batch_id = ct.batch_id
where opc.apply_status = 'P' 
and (DATEDIFF(DAY, bt.balance_dt, GETDATE()) >= 10)
order by opc.overpmt_credit_id desc

-- set the passed_criteria flag
update @refund_search
set passed_criteria = 1
from overpayment_credit opc with(nolock)
inner join trans_group as tg with(nolock) on tg.trans_group_id = opc.overpmt_credit_id
inner join coll_transaction as ct with(nolock) on ct.transaction_id = tg.mrtransid_opc
inner join batch as bt with(nolock) on bt.batch_id = ct.batch_id
where opc.apply_status = 'P'
and opc.ready_for_refund = 1
and (DATEDIFF(DAY, bt.balance_dt, GETDATE()) >= 10)
and ct.trans_group_id = [@refund_search].trans_group_id

---- add property information

update @refund_search
set sup_num = psa.sup_num, 
sup_group_id = sup.sup_group_id
from prop_supp_assoc psa with(nolock)
join supplement sup (nolock) on psa.sup_num = sup.sup_num
	and psa.owner_tax_yr = sup.sup_tax_yr
where psa.prop_id = [@refund_search].prop_id
and psa.owner_tax_yr = @tax_year

update @refund_search
set owner_id = p.col_owner_id,
taxpayer_id = p.col_owner_id
from property p with(nolock)
where p.prop_id = [@refund_search].prop_id

update @refund_search
set owner_name = acc.file_as_name
from account acc with(nolock)
where acc.acct_id = [@refund_search].owner_id

-- add last-payment information

update @refund_search
set latest_payment_trans_id = tg.mrtransid_opc,
latest_adjustment_trans_id = tg.mrtransid_opc
from trans_group tg with(nolock)
where tg.trans_group_id = [@refund_search].trans_group_id

update @refund_search
set last_payment_date = date_paid,
last_adjustment_date = create_date
from coll_transaction ct with(nolock)
join payment_transaction_assoc pta with (nolock)
on pta.transaction_id = ct.transaction_id
join payment p with (nolock)
on p.payment_id = pta.payment_id
where [@refund_search].latest_payment_trans_id = ct.transaction_id

update @refund_search
set latest_payment_id = pta.payment_id,
owner_at_time_of_latest_payment = pta.item_paid_owner_id
from payment_transaction_assoc pta with(nolock)
where [@refund_search].latest_payment_trans_id = pta.transaction_id

update @refund_search
set payee_id = p.payee_id,
last_payor_id = p.payee_id,
last_payor_name = p.payee_name,
operator_or_source = isnull(ps.payment_source_desc, isnull(pu.full_name, ''))
from payment p with(nolock)
left join payment_source ps with(nolock) on p.payment_source_id = ps.payment_source_id
left join pacs_user pu with(nolock) on p.pacs_user_id = pu.pacs_user_id
where p.payment_id = [@refund_search].latest_payment_id

-- Current Year Information
update @refund_search
set year = @current_year

-- refund type code information

update @refund_search
set 
--year = @tax_year,
refund_type_cd = rt.refund_type_cd,
refund_reason = rt.refund_reason,
interest_check = rt.interest_check,
interest_to_refund_amount = case
        when isnull(rt.interest_check, 0) = 1
        then isnull(rt.interest_to_refund_amount, 0)
        else 0 end
from (
        select top 1 *
        from refund_type with(nolock)
        where core_refund_type = 1
        and year = @tax_year
) rt

-- Make sure the refund_type is set
update @refund_search
set refund_type_cd = 'OC'
where refund_type_cd is null

update @refund_search
set current_set = 0


--------------------------------------------------
      ---------  BILL DATA  ---------
--------------------------------------------------

insert @refund_search 
(trans_group_id, prop_id, tax_year, sup_num, owner_id, taxpayer_id, statement_id, 
current_set, passed_criteria, levy_or_rollback)
select  b.bill_id, b.prop_id, b.year, b.sup_num, b.owner_id, b.owner_id, b.statement_id, 1, 0, 0
from bill b with(nolock)
inner join trans_group as tg with(nolock) on tg.trans_group_id = b.bill_id
inner join coll_transaction as latest_payment_trans with(nolock) on latest_payment_trans.transaction_id = tg.mrtransid_adj
where 1=1
and b.is_overpaid = 1
order by b.bill_id desc

update @refund_search
set passed_criteria = 1
from bill b with(nolock)
inner join trans_group as tg with(nolock) on tg.trans_group_id = b.bill_id
inner join coll_transaction as latest_payment_trans with(nolock) on latest_payment_trans.transaction_id = tg.mrtransid_adj
where 1=1
and b.is_overpaid = 1
and (DATEDIFF(DAY, latest_payment_trans.create_date, GETDATE()) >= 2)
and latest_payment_trans.trans_group_id = [@refund_search].trans_group_id

-- add missing statement items
insert @refund_search 
(trans_group_id, prop_id, tax_year, sup_num, owner_id, statement_id, current_set, 
passed_criteria, levy_or_rollback)
select b.bill_id, b.prop_id, b.year, b.sup_num, b.owner_id, b.statement_id, 1, 1, 0
from bill b with(nolock)
join @refund_search stmt on stmt.tax_year = b.year
        and stmt.prop_id = b.prop_id and stmt.statement_id = b.statement_id
left join @refund_search rsExisting on rsExisting.trans_group_id = b.bill_id
where b.is_overpaid = 1
and isNull(rsExisting.trans_group_id, -1) = -1


update @refund_search
set sup_group_id = sup.sup_group_id

from prop_supp_assoc psa with(nolock)
join supplement sup (nolock) on psa.sup_num = sup.sup_num
	and psa.owner_tax_yr = sup.sup_tax_yr
where psa.prop_id = [@refund_search].prop_id
and psa.owner_tax_yr = @tax_year

-- add property collections owner
update @refund_search
set taxpayer_id = a.acct_id,
owner_name = a.file_as_name
from property p with(nolock)
join account a with(nolock) on a.acct_id = p.col_owner_id
where p.prop_id = [@refund_search].prop_id
and [@refund_search].current_set = 1

-- add the bill type

update @refund_search
set type_desc = l.levy_description
from levy_bill lb with(nolock)
join levy l with(nolock)
on l.year = lb.year
and l.tax_district_id = lb.tax_district_id
and l.levy_cd = lb.levy_cd
where lb.bill_id = [@refund_search].trans_group_id
and [@refund_search].current_set = 1

update @refund_search
set levy_or_rollback = 1
from bill b (nolock)
where ( b.bill_type = 'L' or b.bill_type = 'R' or b.rollback_id > 0 )
and [@refund_search].trans_group_id = b.bill_id
and [@refund_search].current_set = 1

update @refund_search
set type_desc = saa.assessment_description
from assessment_bill ab with(nolock)
join special_assessment_agency saa with(nolock)
on saa.agency_id = ab.agency_id
where ab.bill_id = [@refund_search].trans_group_id
and [@refund_search].current_set = 1

-- add last-adjustment information

update @refund_search
set latest_adjustment_trans_id = tg.mrtransid_adj
from trans_group tg with(nolock)
where tg.trans_group_id = [@refund_search].trans_group_id
and [@refund_search].current_set = 1

update @refund_search
set last_adjustment_date = create_date
from coll_transaction with(nolock)
where transaction_id = [@refund_search].latest_adjustment_trans_id
and [@refund_search].current_set = 1

update @refund_search
set last_modify_cd = ba.modify_cd,
credit_description = ba.modify_reason
from bill_adjustment ba with(nolock)
where ba.bill_id = [@refund_search].trans_group_id
and ba.transaction_id = [@refund_search].latest_adjustment_trans_id
and [@refund_search].current_set = 1

-- add last-payment information

update @refund_search
set latest_payment_trans_id = tg.mrtransid_pay
from trans_group tg with(nolock)
where tg.trans_group_id = [@refund_search].trans_group_id
and [@refund_search].current_set = 1

update @refund_search
set last_payment_date = date_paid
from coll_transaction ct with(nolock)
join payment_transaction_assoc pta with (nolock)
on pta.transaction_id = ct.transaction_id
join payment p with (nolock)
on p.payment_id = pta.payment_id
where [@refund_search].latest_payment_trans_id = ct.transaction_id
and [@refund_search].current_set = 1

update @refund_search
set latest_payment_id = pta.payment_id,
owner_at_time_of_latest_payment = pta.item_paid_owner_id
from payment_transaction_assoc pta with(nolock)
where [@refund_search].latest_payment_trans_id = pta.transaction_id
and [@refund_search].current_set = 1

update @refund_search
set payee_id = p.payee_id,
last_payor_id = p.payee_id,
last_payor_name = p.payee_name,
operator_or_source = isnull(ps.payment_source_desc, isnull(pu.full_name, ''))
from payment p with(nolock)
left join payment_source ps with(nolock) on p.payment_source_id = ps.payment_source_id
left join pacs_user pu with(nolock) on p.pacs_user_id = pu.pacs_user_id
where p.payment_id = [@refund_search].latest_payment_id
and [@refund_search].current_set = 1


-- Current Year Information
update @refund_search
set year = @current_year

update @refund_search
set 
--year = rt.[year],
refund_type_cd = rt.refund_type_cd,
refund_reason =  rt.refund_reason,
interest_check = rt.interest_check,
interest_to_refund_amount = case
        when isnull(rt.interest_check, 0) = 1
        then isnull(rt.interest_to_refund_amount, 0)
        else 0 end
from refund_type as rt with(nolock)
where rt.modify_cd = [@refund_search].last_modify_cd
and rt.year = year([@refund_search].last_payment_date) - 1
and [@refund_search].current_set = 1

-- the refund type might not be set, make sure it gets marked
update @refund_search
set refund_type_cd = 'AC'
where refund_type_cd is null
and current_set = 1

update @refund_search
set current_set = 0

--------------------------------------------------
       ---------  FEE DATA  ---------
--------------------------------------------------

insert @refund_search 
(trans_group_id, tax_year, sup_num, owner_id, taxpayer_id, statement_id, current_set, 
passed_criteria, levy_or_rollback)
select f.fee_id, f.year, f.sup_num, f.owner_id, f.owner_id, f.statement_id, 1, 0, 0
from fee f with(nolock)
inner join trans_group as tg with(nolock) on tg.trans_group_id = f.fee_id
inner join coll_transaction as latest_payment_trans with(nolock) on latest_payment_trans.transaction_id = tg.mrtransid_adj
where f.is_overpaid = 1
order by f.fee_id desc

update @refund_search
set passed_criteria = 1
from fee f with(nolock)
inner join trans_group as tg with(nolock) on tg.trans_group_id = f.fee_id
inner join coll_transaction as latest_payment_trans with(nolock) on latest_payment_trans.transaction_id = tg.mrtransid_adj
where f.is_overpaid = 1
and (DATEDIFF(DAY, latest_payment_trans.create_date, GETDATE()) >= 2)
and tg.trans_group_id = [@refund_search].trans_group_id

-- add missing statement items
insert @refund_search 
(trans_group_id, prop_id, tax_year, sup_num, owner_id, statement_id, current_set, passed_criteria, levy_or_rollback)
select f.fee_id, fpv.prop_id, f.year, f.sup_num, f.owner_id, f.statement_id, 1, 1, 0
from fee f with(nolock)
join fee_property_vw fpv with (nolock) on fpv.fee_id = f.fee_id
join @refund_search stmt on stmt.tax_year = f.year
        and stmt.prop_id = fpv.prop_id and stmt.statement_id = f.statement_id
left join @refund_search rsExisting on rsExisting.trans_group_id = f.fee_id
inner join supplement sup (nolock) on f.sup_num = sup.sup_num
	and f.year = sup.sup_tax_yr
where f.is_overpaid = 1
        and isNull(rsExisting.trans_group_id, -1) = -1
and stmt.current_set is null


update @refund_search
set sup_group_id = sup.sup_group_id

from prop_supp_assoc psa with(nolock)
join supplement sup (nolock) on psa.sup_num = sup.sup_num
	and psa.owner_tax_yr = sup.sup_tax_yr
where psa.prop_id = [@refund_search].prop_id
and psa.owner_tax_yr = @tax_year

-- add property and property collections owner

update @refund_search
set prop_id = fpa.prop_id
from fee_property_vw fpa with(nolock)
where fpa.fee_id = [@refund_search].trans_group_id
and [@refund_search].current_set = 1

update @refund_search
set taxpayer_id = a.acct_id,
owner_name = a.file_as_name
from property p with(nolock)
join account a with(nolock)
on p.col_owner_id = a.acct_id
where p.prop_id = [@refund_search].prop_id
and [@refund_search].current_set = 1

-- add the fee type

update @refund_search
set type_desc = ft.fee_type_desc
from fee f with(nolock)
inner join fee_type ft with(nolock)
on ft.fee_type_cd = f.fee_type_cd
where f.fee_id = [@refund_search].trans_group_id
and [@refund_search].current_set = 1

---- add last-adjustment information

update @refund_search
set latest_adjustment_trans_id = tg.mrtransid_adj
from trans_group tg with(nolock)
where tg.trans_group_id = [@refund_search].trans_group_id
and [@refund_search].current_set = 1

update @refund_search
set last_adjustment_date = create_date
from coll_transaction with(nolock)
where transaction_id = [@refund_search].latest_adjustment_trans_id
and [@refund_search].current_set = 1

update @refund_search
set last_modify_cd = fa.modify_cd,
credit_description = fa.modify_reason
from fee_adjustment fa with(nolock)
where fa.fee_id = [@refund_search].trans_group_id
and fa.transaction_id = [@refund_search].latest_adjustment_trans_id
and [@refund_search].current_set = 1


-- Current Year Information
update @refund_search
set year = @current_year

update @refund_search
set 
--year = rt.[year],
refund_type_cd = rt.refund_type_cd,
refund_reason =  rt.refund_reason,
interest_check = rt.interest_check,
interest_to_refund_amount = case
        when isnull(rt.interest_check, 0) = 1
        then isnull(rt.interest_to_refund_amount, 0)
        else 0 end
from refund_type as rt with(nolock)
where rt.modify_cd = [@refund_search].last_modify_cd
and rt.year = [@refund_search].tax_year --year([@refund_search].last_payment_date)
and [@refund_search].current_set = 1

-- add last-payment information

update @refund_search
set latest_payment_trans_id = tg.mrtransid_pay
from trans_group tg with(nolock)
where tg.trans_group_id = [@refund_search].trans_group_id
and [@refund_search].current_set = 1

update @refund_search
set last_payment_date = date_paid
from coll_transaction ct with(nolock)
join payment_transaction_assoc pta with (nolock)
on pta.transaction_id = ct.transaction_id
join payment p with (nolock)
on p.payment_id = pta.payment_id
where [@refund_search].latest_payment_trans_id = ct.transaction_id
and [@refund_search].current_set = 1

update @refund_search
set latest_payment_id = pta.payment_id,
owner_at_time_of_latest_payment = pta.item_paid_owner_id
from payment_transaction_assoc pta with(nolock)
where [@refund_search].latest_payment_trans_id = pta.transaction_id
and [@refund_search].current_set = 1

update @refund_search
set payee_id = p.payee_id,
last_payor_id = p.payee_id,
last_payor_name = p.payee_name,
operator_or_source = isnull(ps.payment_source_desc, isnull(pu.full_name, ''))
from payment p with(nolock)
left join payment_source ps with(nolock) on p.payment_source_id = ps.payment_source_id
left join pacs_user pu with(nolock) on p.pacs_user_id = pu.pacs_user_id

where p.payment_id = [@refund_search].latest_payment_id
and [@refund_search].current_set = 1

-- the refund type might not be set, make sure it gets marked
update @refund_search
set refund_type_cd = 'AC'
where refund_type_cd is null
and current_set = 1

update @refund_search
set current_set = 0

set nocount off

select
        ISNULL(trans_group_id, 0) as trans_group_id, 
        ISNULL(prop_id, 0) as prop_id, 
        passed_criteria, 
        levy_or_rollback,
        ISNULL(sup_num, 0) as sup_num,  
        ISNULL(sup_group_id, 0) as sup_group_id,  
        ISNULL(year, @current_year) as year,
		ISNULL(refund_type_cd, '') as refund_type_cd,
        ISNULL(latest_payment_id, 0) as payment_id,
        ISNULL(statement_id, 0) as statement_id
        --taxpayer_id, 
        --ISNULL(owner_name, '') as owner_name, 
        --tax_year, 
        --type_desc, 
        --operator_or_source,
        --last_payment_date, 
        --ISNULL(last_payor_id, 0) as last_payor_id, 
        --ISNULL(last_payor_name,'') as last_payor_name, 
        --ISNULL(last_modify_cd, '') as last_modify_cd,
        --ISNULL(refund_reason, '') as refund_reason, 
        --ISNULL(interest_check, 0) as interest_check, 
        --ISNULL(interest_to_refund_amount, 0) as interest_to_refund_amount,
        --ISNULL(credit_description, '') as credit_description, 
        --ISNULL(owner_at_time_of_latest_payment, 0) as owner_at_time_of_latest_payment
from @refund_search
order by refund_type_cd, prop_id, trans_group_id

GO



-- sample exec
--  exec TaxRollReport 4,'BGGAR,CAMGAR', 0

create procedure TaxRollReport 
 @sup_num int,
 @dataset_id int,
 @showDetail bit,
 @year int,
 @taxAreaList varchar(4000)
AS
SET NOCOUNT ON

declare @taxAreas table(taxareaid int)

insert into @taxAreas
	select id from dbo.fn_ReturnTableFromCommaSepValues(@taxAreaList)


if object_id('tempdb..#bill_levy_bill') is not null 
drop table #bill_levy_bill

create table #bill_levy_bill(
	bill_id int NOT NULL,
	levy_cd varchar(10) NOT NULL,
	year numeric(4, 0) NOT NULL,
	tax_district_id int NOT NULL,
	taxable_val numeric(14, 0) NULL,
	tax_area_id int NULL,
	prop_id int NULL,
	sup_num int NULL,
	initial_amount_due numeric(14, 2) NULL)

insert into #bill_levy_bill 
select lb.*, b.prop_id, b.sup_num, b.initial_amount_due
from levy_bill as lb with (nolock)
join bill as b with (nolock) on b.bill_id = lb.bill_id
where isnull(b.rollback_id, 0) = 0 and b.created_by_type_cd = 'CERT' -- MC (manually created) properties are included on CertToTaxroll Report but are not needed here
and lb.[year] = @year
create index #ndx_bill_levy_bill_keys on #bill_levy_bill
([year], prop_id, tax_district_id, levy_cd)

create index #ndx_bill_levy_bill_id on #bill_levy_bill
(bill_id)


delete ##wash_tax_roll
where dataset_id = @dataset_id

insert into ##wash_tax_roll
select
    @dataset_id,
    wpola.tax_area_id,
    ta.tax_area_number,
    wpola.[year],
    wpola.prop_id,
    wpola.sup_num,
    wpola.owner_id,
    a.file_as_name,
    isnull(pv.legal_desc, '') + isnull(pv.legal_desc_2, ''),
                cypt.property_type,
                cypt.property_type_desc,
    wpov.taxable_classified,
    wpov.taxable_non_classified,
    b.taxable_val,
    wpola.tax_district_id,
    td.tax_district_desc,
    tdt.priority,
    wpola.levy_cd,
    f.fund_number,
    case
    when p.prop_type_cd in ('R', 'MH') and exists (
        select * from levy_exemption as le with(nolock)
        where le.[year] = wpola.[year] and le.tax_district_id = wpola.tax_district_id
        and le.levy_cd = wpola.levy_cd and exmpt_type_cd = 'SNR/DSBL'
      ) then 1
    when p.prop_type_cd = 'P' and exists (
        select * from levy_exemption as le with(nolock)
        where le.[year] = wpola.[year] and le.tax_district_id = wpola.tax_district_id
        and le.levy_cd = wpola.levy_cd and exmpt_type_cd = 'FARM'
    ) then 1
    else 0 end,
    l.levy_rate,
    b.initial_amount_due

from #bill_levy_bill as b
join wash_prop_owner_levy_assoc as wpola with (nolock)
    on b.[year] = wpola.[year]
    and b.prop_id = wpola.prop_id
    and b.tax_district_id = wpola.tax_district_id
    and b.levy_cd = wpola.levy_cd
    and isnull(wpola.pending, 0) = 0
    and wpola.[year] = @year
	join (
		select prop_id, year, max(sup_num) sup_num from wash_prop_owner_levy_assoc where sup_num <= @sup_num group by prop_id, year having year = @year
	) sup_check
	on sup_check.year = wpola.year
	and sup_check.prop_id = wpola.prop_id
	and sup_check.sup_num = wpola.sup_num
join wash_prop_owner_val as wpov with (nolock)
    on wpov.prop_id = wpola.prop_id
    and wpov.[year] = wpola.[year]
    and wpov.sup_num = wpola.sup_num
    and wpov.owner_id = wpola.owner_id
join levy_supp_assoc as lsa with (nolock)
    on lsa.sup_yr = wpov.[year]
    and lsa.prop_id = wpov.prop_id
    and lsa.sup_num = wpov.sup_num
    and lsa.[type] = 'L'
join [property] as p with (nolock)
    on p.prop_id = wpola.prop_id
join property_val as pv with (nolock) on
    pv.prop_id = lsa.prop_id
    and pv.prop_val_yr = lsa.sup_yr
    and pv.sup_num = lsa.sup_num
join [property_type] as pt with (nolock) on
    pt.prop_type_cd = p.prop_type_cd
join current_year_property_type_ioll_vw as cypt with (nolock) on
                p.prop_id = cypt.prop_id
join levy as l with (nolock)
    on l.[year] = wpola.[year]
    and l.tax_district_id = wpola.tax_district_id
    and l.levy_cd = wpola.levy_cd
join tax_area as ta with (nolock) on
    ta.tax_area_id = wpola.tax_area_id
join @taxareas tas on ta.tax_area_id = tas.taxareaid
join tax_district as td with (nolock) on
    td.tax_district_id = wpola.tax_district_id
join tax_district_type as tdt with (nolock) on
    tdt.tax_district_type_cd = td.tax_district_type_cd
join account as a with (nolock) on
    a.acct_id = wpola.owner_id
cross apply(
	select top 1 pct.*, lbta.fund_id
    from posted_coll_transaction pct with(nolock)
    join levy_bill_transaction_assoc lbta with(nolock)
		on lbta.posted_transaction_id = pct.posted_transaction_id
    where pct.trans_group_id = b.bill_id 
		and pct.transaction_type = 'CLB'
	order by pct.posted_transaction_id desc
) last_pct
join fund f with(nolock) 
	on f.[year] = b.[year]
    and f.tax_district_id = b.tax_district_id
    and f.levy_cd = b.levy_cd
    and f.fund_id = last_pct.fund_id
	and last_pct.is_reopen = 0
where isnull(pv.udi_parent,'') = ''
        order by
                wpola.tax_area_id,
                wpola.[year],
                wpola.prop_id,
                wpola.sup_num,
                wpola.owner_id,
                tdt.priority,
                wpola.levy_cd ;

drop table #bill_levy_bill ;


delete ##tax_roll_totals
where dataset_id = @dataset_id

insert into ##tax_roll_totals
select
	wtr.dataset_id,
	ta.tax_area_number,
	wtr.[year],
	tdt.priority,
	td.tax_district_desc,
	wtr.levy_cd + ' (' + l.levy_description + ')' as levy_code_desc,
	count(prop_id) as number_of_props,
	sum(isnull(levy_taxable_val, 0)) as levy_total_taxable_val,
	sum(isnull(total_tax, 0)) as total_tax_due
from ##wash_tax_roll as wtr with (nolock)
	join tax_area as ta with (nolock)
		on ta.tax_area_id = wtr.tax_area_id
	join tax_district as td with (nolock)
		on td.tax_district_id = wtr.tax_district_id
	join tax_district_type as tdt with (nolock)
		on tdt.tax_district_type_cd = td.tax_district_type_cd
	join levy as l with (nolock)
		on l.[year] = wtr.[year]
		and l.tax_district_id = wtr.tax_district_id
		and l.levy_cd = wtr.levy_cd
where
	wtr.dataset_id = @dataset_id
group by
	wtr.dataset_id,
	wtr.[year],
	ta.tax_area_number,
	tdt.priority,
	td.tax_district_desc,
	wtr.levy_cd,
	l.levy_description

GO


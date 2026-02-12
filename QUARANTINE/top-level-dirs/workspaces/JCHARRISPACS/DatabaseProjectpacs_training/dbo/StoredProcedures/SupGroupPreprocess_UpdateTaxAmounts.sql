
CREATE procedure [dbo].SupGroupPreprocess_UpdateTaxAmounts

	@sup_group_id int,
	@pacs_user_id int

as

set nocount on

exec SupGroupResetTables @sup_group_id, 1



/*
 * Create temp table srr_tax_assoc
 */

if exists(select id from tempdb..sysobjects where id = object_id('tempdb..#srr_tax_assoc'))
drop table #srr_tax_assoc

create table #srr_tax_assoc
(
	sup_group_id int not null,
	prop_id int not null,
	bill_id int not null,
	sup_yr numeric(4,0) null,
	sup_num int null,
	bill_adj_id int null,
	curr_tax_area_id int null,
	prev_tax_area_id int null,
	tax numeric(14,2) null,
	previous_tax numeric(14,2) null
)

/*
 * Do insert/update to #srr_tax_assoc
 */

insert #srr_tax_assoc
(sup_group_id, prop_id, bill_id, sup_yr, sup_num, bill_adj_id, curr_tax_area_id, prev_tax_area_id)

select @sup_group_id sup_group_id, b.prop_id, b.bill_id, b.year, b.sup_num, 
	max_bill_adj_id, curr_tax_area_id, prev_tax_area_id
from 
(
	select distinct bi.prop_id, bi.bill_id, bi.year, bi.sup_num
	from bill bi with(nolock)
	join levy_bill lb with(nolock)
		on lb.[year] = bi.[year] 
		and lb.bill_id = bi.bill_id
	join td_sup_group_property_info tsgpi with(nolock)
		on tsgpi.prop_id = bi.prop_id
		and tsgpi.sup_yr = bi.year
		and tsgpi.sup_num = bi.sup_num
	where tsgpi.sup_group_id = @sup_group_id
) b
outer apply (
	select max(ba.bill_adj_id) max_bill_adj_id
	from bill_adjustment ba with(nolock)
		where b.bill_id = ba.bill_id
		and b.sup_num = ba.sup_num
		and ba.bill_calc_type_cd = 'SM'
) max_ba
outer apply (
	select top 1 tax_area_id curr_tax_area_id
	from td_sup_group_property_info tsgpi with(nolock)
	where tsgpi.prop_id = b.prop_id
	and tsgpi.sup_yr = b.year
	and tsgpi.sup_group_id = @sup_group_id
	and tsgpi.data_flag = 0
) curr_ta
outer apply (
	select top 1 tax_area_id prev_tax_area_id
	from td_sup_group_property_info tsgpi with(nolock)
	where tsgpi.prop_id = b.prop_id
	and tsgpi.sup_yr = b.year
	and tsgpi.sup_group_id = @sup_group_id
	and tsgpi.data_flag = 1
) prev_ta


update #srr_tax_assoc
set tax =	case when isnull(sup.levy_cert_run_id, 0) = 0 
				then isnull(ba.base_tax, b.current_amount_due)
				else 0 
			end,
previous_tax =	--if the supplement was part of the mass create levy bill process, then previous tax was 0
				case when isnull(sup.levy_cert_run_id, 0) = 0 
					then isnull(ba.previous_base_tax, b.initial_amount_due)
					else 0
				end
from #srr_tax_assoc as s
with (nolock)
join supplement sup 
with (nolock)
on s.sup_yr = sup.sup_tax_yr 
and s.sup_num = sup.sup_num
left outer join bill as b
with (nolock)
on s.bill_id = b.bill_id
and s.prop_id = b.prop_id
and s.sup_yr = b.year
and s.sup_num = b.sup_num
left outer join bill_adjustment as ba
with (nolock)
on s.bill_adj_id = ba.bill_adj_id
where s.sup_group_id = @sup_group_id

/*
 * Update td_sup_group_tax_area_summary (curr_tax)
 */
 --Added where condition to updates records present in group
 --Added isnull for curr_tax & prev_tax to default to 0 even if record does not exits.

update td_sup_group_tax_area_summary
set curr_tax = isnull((select sum(isnull(s.tax, 0))
				from #srr_tax_assoc as s
				left join td_sup_group_property_info as tsgpi with (nolock)
				on tsgpi.prop_id = s.prop_id
				and tsgpi.sup_yr = s.sup_yr
				and tsgpi.sup_num = s.sup_num 
				and tsgpi.tax_area = tsgtas.tax_area_number
				where tsgtas.prop_id = s.prop_id
				and tsgtas.sup_yr = s.sup_yr
				and tsgtas.sup_num = s.sup_num
				and tsgtas.sup_group_id = s.sup_group_id
				and tsgtas.sup_group_id = @sup_group_id
				and tsgtas.tax_area_id = isnull(s.curr_tax_area_id, tsgtas.tax_area_id)),0),

prev_tax = isnull((select sum(isnull(s.previous_tax, 0))
			from #srr_tax_assoc as s
			left join td_sup_group_property_info as tsgpi with (nolock)
			on tsgpi.prop_id = s.prop_id
			and tsgpi.sup_yr = s.sup_yr
			and tsgpi.sup_num = s.sup_num 
			and tsgpi.tax_area = tsgtas.tax_area_number
			where tsgtas.prop_id = s.prop_id
			and tsgtas.sup_yr = s.sup_yr
			and tsgtas.sup_num = s.sup_num
			and tsgtas.sup_group_id = s.sup_group_id
			and tsgtas.sup_group_id = @sup_group_id
			and tsgtas.tax_area_id = isnull(s.prev_tax_area_id, tsgtas.tax_area_id)),0)
from td_sup_group_tax_area_summary as tsgtas with (nolock)
where tsgtas.sup_group_id = @sup_group_id



/*
 * Update td_sup_group_tax_area_summary (gl_tax)
 */
update td_sup_group_tax_area_summary
set gl_tax = curr_tax - prev_tax
where sup_group_id = @sup_group_id

update td_sup_group_tax_area_summary
set curr_tax = isnull(curr_tax, 0),
		prev_tax = isnull(prev_tax, 0),
		gl_tax = isnull(gl_tax, 0)
where sup_group_id = @sup_group_id

/*
 * Update td_sup_group_tax_area_subtotal 
 */
update td_sup_group_tax_area_subtotal
set curr_tax = t.curr_tax,
prev_tax = t.prev_tax,
gl_tax = t.gl_tax
from td_sup_group_tax_area_subtotal as sub
with (nolock)
join
(
select sup_group_id, sup_yr, sup_num, tax_area_id, sup_action,
sum(isnull(curr_tax,0)) as curr_tax,
sum(isnull(prev_tax,0)) as prev_tax,
sum(isnull(gl_tax,0)) as gl_tax
from td_sup_group_tax_area_summary
with (nolock)
where sup_group_id = @sup_group_id
group by sup_group_id, sup_yr, sup_num, tax_area_id, sup_action
) as t
on sub.sup_group_id = t.sup_group_id
and sub.sup_yr = t.sup_yr
and sub.sup_num = t.sup_num
and sub.tax_area_id = t.tax_area_id
and sub.sup_action = t.sup_action

/*
 * Update td_sup_group_tax_area_subtotal Totals
 */

update td_sup_group_tax_area_subtotal
with (tablock)
set curr_tax = t.curr_tax1,
	prev_tax = t.prev_tax1
from td_sup_group_tax_area_subtotal as sub
join
(
	select sup_group_id, sup_yr, sup_num, tax_area_id,
			sum(curr_tax) as curr_tax1,
			sum(prev_tax) as prev_tax1
	from td_sup_group_tax_area_subtotal as sub1
	where sub1.sup_group_id = @sup_group_id
	and sub1.sup_action <> 'T'
	group by sup_group_id, sup_yr, sup_num, tax_area_id
) as t
on sub.sup_group_id = t.sup_group_id
and sub.sup_yr = t.sup_yr
and sub.tax_area_id = t.tax_area_id
and sub.sup_num = t.sup_num
where sub.sup_group_id = @sup_group_id
and sub.sup_action = 'T'

update td_sup_group_tax_area_subtotal
with (tablock)
set gl_tax = curr_tax - prev_tax
where sup_group_id = @sup_group_id

/*
 * ALL td_srr* tables are updated in SRRInsertOptions at the time
 * the report is run.
 */

if exists(select id from tempdb..sysobjects where id = object_id('tempdb..#srr_tax_assoc'))
drop table #srr_tax_assoc

GO


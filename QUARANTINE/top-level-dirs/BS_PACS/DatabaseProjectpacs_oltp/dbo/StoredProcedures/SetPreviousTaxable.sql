


CREATE procedure SetPreviousTaxable

@input_notice_yr	numeric(4),
@input_notice_num	int

as

if object_id('tempdb..#psa') is not null
begin
	 -- Object exists
	delete #psa with(tablockx)
end


declare @sup_num	int


select
	@sup_num = max(s.sup_num)
from
	supplement as s with (nolock)
join
	sup_group as sg with (nolock)
on
	s.sup_group_id = sg.sup_group_id
where
	s.sup_tax_yr = (@input_notice_yr - 1)
and	sg.status_cd in ('A', 'BC')


select @sup_num


select
	prop_id,
	prop_val_yr as owner_tax_yr,
	max(sup_num) as sup_num
into
	#psa
from
	property_val with (nolock)
where
	prop_val_yr = (@input_notice_yr - 1)
and	sup_num <= @sup_num
group by
	prop_id,
	prop_val_yr


update
	appr_notice_prop_list_bill 
set
	prev_taxable_val = prop_owner_entity_val.taxable_val
from
	#psa,
	prop_owner_entity_val,
	appr_notice_prop_list
where
	appr_notice_prop_list_bill.notice_num = @input_notice_num
and	appr_notice_prop_list_bill.notice_yr = @input_notice_yr
and	appr_notice_prop_list_bill.prop_id = appr_notice_prop_list.prop_id
and	appr_notice_prop_list_bill.owner_id = appr_notice_prop_list.owner_id
and	appr_notice_prop_list_bill.sup_num = appr_notice_prop_list.sup_num
and	appr_notice_prop_list_bill.sup_yr = appr_notice_prop_list.sup_yr
and	appr_notice_prop_list_bill.notice_num = appr_notice_prop_list.notice_num
and	appr_notice_prop_list_bill.notice_yr = appr_notice_prop_list.notice_yr
and	appr_notice_prop_list_bill.prop_id = #psa.prop_id
and	#psa.owner_tax_yr = (appr_notice_prop_list_bill.sup_yr - 1)
and	#psa.prop_id = prop_owner_entity_val.prop_id
and	#psa.owner_tax_yr = prop_owner_entity_val.sup_yr
and	#psa.sup_num = prop_owner_entity_val.sup_num
and	prop_owner_entity_val.entity_id = appr_notice_prop_list_bill.entity_id


update
	appr_notice_prop_list_bill
set
	prev_taxable_val = 0
where
	appr_notice_prop_list_bill.notice_num = @input_notice_num
and	appr_notice_prop_list_bill.notice_yr = @input_notice_yr
and	prev_taxable_val is null

GO


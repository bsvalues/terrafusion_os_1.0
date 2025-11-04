
create view modified_bill_report_vw
as
select
	bat.sup_num,
	bat.sup_tax_yr,
	bat.modify_dt,
	bat.modify_cd,
	convert(
		varchar(255),
		case
			when bat.modify_reason = 'Supplemental Modification'
			then pv.sup_desc
			else bat.modify_reason
		end
	) as modify_reason,
	bat.curr_mno_tax,
	bat.curr_ins_tax,
	bat.prev_mno_tax,
	bat.prev_ins_tax,
	bat.curr_adj_code,
	bat.prop_id,
	bat.entity_id,
	bat.owner_id,
	pv.sup_cd,
	bill.active_bill
from bill_adj_trans as bat with (nolock)
left outer join property_val as pv  with (nolock) on 
	bat.prop_id = pv.prop_id and	
	bat.sup_tax_yr = pv.prop_val_yr and
	bat.sup_num = pv.sup_num
inner join bill with (nolock) on
	bill.bill_id = bat.bill_id
where bill.active_bill = 'T'

GO


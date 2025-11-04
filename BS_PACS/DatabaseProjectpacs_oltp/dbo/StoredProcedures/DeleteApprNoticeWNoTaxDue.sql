




CREATE procedure DeleteApprNoticeWNoTaxDue

@input_notice_yr 	numeric(4),
@input_notice_num	int

as

update appr_notice_prop_list set delete_flag = 'T'
from appr_notice_prop_list_exemption
where appr_notice_prop_list.notice_yr		 = @input_notice_yr
and   appr_notice_prop_list.notice_num		 = @input_notice_num
and   appr_notice_prop_list_exemption.prop_id    = appr_notice_prop_list.prop_id
and   appr_notice_prop_list_exemption.owner_id   = appr_notice_prop_list.notice_owner_id
and   appr_notice_prop_list_exemption.sup_num    = appr_notice_prop_list.sup_num
and   appr_notice_prop_list_exemption.sup_yr     = appr_notice_prop_list.sup_yr
and   appr_notice_prop_list_exemption.notice_num = appr_notice_prop_list.notice_num
and   appr_notice_prop_list_exemption.notice_yr  = appr_notice_prop_list.notice_yr
and   (appr_notice_prop_list_exemption.exmpt_type_cd = 'EX'
or    appr_notice_prop_list_exemption.exmpt_type_cd = 'EX366')
and    exists (select sum(appr_notice_prop_list_bill.taxable_val)
	      from appr_notice_prop_list_bill
	      where appr_notice_prop_list_bill.prop_id    = appr_notice_prop_list.prop_id
	      and   appr_notice_prop_list_bill.owner_id   = appr_notice_prop_list.notice_owner_id
	      and   appr_notice_prop_list_bill.sup_num    = appr_notice_prop_list.sup_num
	      and   appr_notice_prop_list_bill.sup_yr     = appr_notice_prop_list.sup_yr
	      and   appr_notice_prop_list_bill.notice_num = appr_notice_prop_list.notice_num
	      and   appr_notice_prop_list_bill.notice_yr  = appr_notice_prop_list.notice_yr
	      having sum(appr_notice_prop_list_bill.taxable_val) = 0)


delete from appr_notice_prop_list_group_code
from appr_notice_prop_list
where appr_notice_prop_list.notice_num 	    = @input_notice_num
and   appr_notice_prop_list.notice_yr  	    = @input_notice_yr
and   appr_notice_prop_list.delete_flag	    = 'T'
and   appr_notice_prop_list.prop_id 	    = appr_notice_prop_list_group_code.prop_id
and   appr_notice_prop_list.notice_yr	    = appr_notice_prop_list_group_code.notice_yr
and   appr_notice_prop_list.notice_num	    = appr_notice_prop_list_group_code.notice_num


delete from appr_notice_prop_list_entity_exemption
from appr_notice_prop_list
where appr_notice_prop_list.notice_num 	    = @input_notice_num
and   appr_notice_prop_list.notice_yr  	    = @input_notice_yr
and   appr_notice_prop_list.delete_flag	    = 'T'
and   appr_notice_prop_list.prop_id 	    = appr_notice_prop_list_entity_exemption.prop_id
and   appr_notice_prop_list.owner_id             = appr_notice_prop_list_entity_exemption.owner_id
and   appr_notice_prop_list.sup_yr	    = appr_notice_prop_list_entity_exemption.sup_yr
and   appr_notice_prop_list.sup_num	    = appr_notice_prop_list_entity_exemption.sup_num
and   appr_notice_prop_list.notice_yr	    = appr_notice_prop_list_entity_exemption.notice_yr
and   appr_notice_prop_list.notice_num	    = appr_notice_prop_list_entity_exemption.notice_num

delete from appr_notice_prop_list_exemption 
from appr_notice_prop_list
where appr_notice_prop_list.notice_num 	    = @input_notice_num
and   appr_notice_prop_list.notice_yr  	    = @input_notice_yr
and   appr_notice_prop_list.delete_flag	    = 'T'
and   appr_notice_prop_list.prop_id 	    = appr_notice_prop_list_exemption.prop_id
and   appr_notice_prop_list.owner_id             = appr_notice_prop_list_exemption.owner_id
and   appr_notice_prop_list.sup_yr	    = appr_notice_prop_list_exemption.sup_yr
and   appr_notice_prop_list.sup_num	    = appr_notice_prop_list_exemption.sup_num
and   appr_notice_prop_list.notice_yr	    = appr_notice_prop_list_exemption.notice_yr
and   appr_notice_prop_list.notice_num	    = appr_notice_prop_list_exemption.notice_num

delete from appr_notice_prop_list_bill
from appr_notice_prop_list
where appr_notice_prop_list.notice_num 	    = @input_notice_num
and   appr_notice_prop_list.notice_yr  	    = @input_notice_yr
and   appr_notice_prop_list.delete_flag	    = 'T'
and   appr_notice_prop_list.prop_id 	    = appr_notice_prop_list_bill.prop_id
and   appr_notice_prop_list.owner_id             = appr_notice_prop_list_bill.owner_id
and   appr_notice_prop_list.sup_yr	    = appr_notice_prop_list_bill.sup_yr
and   appr_notice_prop_list.sup_num	    = appr_notice_prop_list_bill.sup_num
and   appr_notice_prop_list.notice_yr	    = appr_notice_prop_list_bill.notice_yr
and   appr_notice_prop_list.notice_num	    = appr_notice_prop_list_bill.notice_num


delete from appr_notice_prop_list_shared_cad
from appr_notice_prop_list
where appr_notice_prop_list.notice_num 	    = @input_notice_num
and   appr_notice_prop_list.notice_yr  	    = @input_notice_yr
and   appr_notice_prop_list.delete_flag	    = 'T'
and   appr_notice_prop_list.prop_id 	    = appr_notice_prop_list_shared_cad.prop_id
and   appr_notice_prop_list.owner_id             = appr_notice_prop_list_shared_cad.owner_id
and   appr_notice_prop_list.sup_yr	    = appr_notice_prop_list_shared_cad.sup_yr
and   appr_notice_prop_list.sup_num	    = appr_notice_prop_list_shared_cad.sup_num
and   appr_notice_prop_list.notice_yr	    = appr_notice_prop_list_shared_cad.notice_yr
and   appr_notice_prop_list.notice_num	    = appr_notice_prop_list_shared_cad.notice_num


delete from appr_notice_prop_list 
where appr_notice_prop_list.notice_num 	    = @input_notice_num
and   appr_notice_prop_list.notice_yr  	    = @input_notice_yr
and   appr_notice_prop_list.delete_flag	    = 'T'

GO


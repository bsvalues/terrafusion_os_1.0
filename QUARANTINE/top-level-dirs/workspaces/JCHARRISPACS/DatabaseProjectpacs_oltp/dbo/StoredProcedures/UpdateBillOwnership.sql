




CREATE procedure UpdateBillOwnership

@input_tax_yr	numeric(4)

as

if exists (select * from sysobjects where id = object_id(N'[dbo].[bill_levy_backup]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
drop table bill_levy_backup

select * into bill_levy_backup from bill

update bill set owner_id = owner.owner_id
from levy_supp_assoc, owner
where levy_supp_assoc.prop_id = owner.prop_id
and   levy_supp_assoc.sup_num = owner.sup_num
and   levy_supp_assoc.sup_yr  = owner.owner_tax_yr
and   levy_supp_assoc.prop_id = bill.prop_id
and   levy_supp_assoc.sup_yr  = @input_tax_yr
and   bill.sup_tax_yr < @input_tax_yr
and   bill.owner_id not in (select owner_id from owner as o1
			    where  o1.prop_id  = levy_supp_assoc.prop_id
			    and   o1.sup_num  = levy_supp_assoc.sup_num
			    and   o1.owner_tax_yr = levy_supp_assoc.sup_yr)

GO





create procedure UpdateTSEvents
as

update event set ref_id6 = transfer_tax_stmnt.stmnt_id
from transfer_tax_stmnt
where  event.ref_year = transfer_tax_stmnt.levy_group_yr AND 
    event.ref_id1 = transfer_tax_stmnt.levy_group_id AND 
    event.ref_id2 = transfer_tax_stmnt.sup_num AND 
    event.ref_id3 = transfer_tax_stmnt.levy_run_id AND 
    event.ref_id4 = transfer_tax_stmnt.prop_id AND 
    event.ref_id5 = transfer_tax_stmnt.owner_id

GO


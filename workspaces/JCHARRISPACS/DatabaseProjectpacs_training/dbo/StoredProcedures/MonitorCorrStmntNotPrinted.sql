
CREATE procedure [dbo].[MonitorCorrStmntNotPrinted]


@group_id int,
@run_id int,
@year numeric (4,0) 

as

select wts.owner_addr_is_deliverable as stmnt_deliverable_flag,  wts.prop_id, wts.owner_id, wts.year, wts.group_id, wts.run_id, wts.mailto_name as stmnt_name,
wts.owner_addr_line1 as stmnt_addr1, wts.owner_addr_line2 as stmnt_addr2, wts.owner_addr_city as stmnt_city, wts.owner_addr_state as stmnt_state,
wts.owner_addr_zip as stmnt_zip, addr.ml_deliverable as current_deliverable_statusonAddr, addr.addr_line1, addr.addr_line2, addr.addr_city, addr.addr_state, addr.addr_zip,
addr.last_change_dt, addr.chg_reason_cd
from wa_tax_statement wts
left  join address addr
on wts.owner_id = addr.acct_id
where wts.group_id = @group_id 
and wts.run_id = @run_id
and wts.year = @year
and wts.owner_addr_is_deliverable = 0
and isnull(wts.owner_addr_is_deliverable,0) = 0
and addr.ml_deliverable is Null

GO


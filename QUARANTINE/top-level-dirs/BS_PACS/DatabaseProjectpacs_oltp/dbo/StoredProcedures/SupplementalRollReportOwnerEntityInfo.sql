



CREATE   PROCEDURE SupplementalRollReportOwnerEntityInfo
	@input_prop_id int,
	@input_year int,
	@input_sup_num int,
	@input_entity_ids varchar(1000),
	@input_primary_supp	int 
as

SET NOCOUNT ON



declare @sup_group_id	int
declare @strSQL varchar(8000)
declare @bLevy  varchar(1)
declare @numOwner	int


set @NumOwner = 0

select @numOwner = count(*)
from owner
where prop_id = @input_prop_id
and   sup_num = @input_sup_num
and   owner_tax_yr = @input_year

select @sup_group_id = sup_group_id
from supplement
where sup_num = @input_primary_supp
and     sup_tax_yr = @input_year




/* we have to determine if this prop_id, sup_num, year has supplemental tax information, if not
     then we have to pull the tax information from the bill itself */
if exists (select * from bill_adj_trans where prop_id = @input_prop_id
				  and    sup_num = @input_sup_num
				  and    sup_tax_yr = @input_year)
begin
	set @bLevy = 'F'
end
else
begin
	set @bLevy = 'T'
end


set @strSQL = 'SELECT DISTINCT 1  as DumbID, '
set @strSQL = @strSQL + 'owner.sup_num, '
set @strSQL = @strSQL + 'owner.owner_id, '
set @strSQL = @strSQL + 'owner.pct_ownership, '
set @strSQL = @strSQL + 'pv.prop_inactive_dt, '
set @strSQL = @strSQL + 'account.file_as_name, '
set @strSQL = @strSQL + 'address.addr_line1, '
set @strSQL = @strSQL + 'address.addr_line2, '
set @strSQL = @strSQL + 'address.addr_line3, '
set @strSQL = @strSQL + 'address.addr_city, '
set @strSQL = @strSQL + 'address.addr_state, '
set @strSQL = @strSQL + 'address.country_cd, '
set @strSQL = @strSQL + 'address.is_international, '
set @strSQL = @strSQL + 'country.country_name, '
set @strSQL = @strSQL + 'address.addr_zip, '
set @strSQL = @strSQL + 'agent_account.file_as_name as agent_name, '
set @strSQL = @strSQL + 'entity.entity_id, '
set @strSQL = @strSQL + 'entity.entity_cd, '
set @strSQL = @strSQL + 'entity_account.file_as_name as entity_desc, '
set @strSQL = @strSQL + 'epa.entity_prop_pct, '
set @strSQL = @strSQL + 'bill.stmnt_id, '
set @strSQL = @strSQL + 'case when prop_inactive_dt is not null then 0 else poev.assessed_val end as assessed_val, '
set @strSQL = @strSQL + 'case when prop_inactive_dt is not null then 0 else poev.taxable_val  end as taxable_val, '
set @strSQL = @strSQL + 'poev1.freeze_type, '
set @strSQL = @strSQL + 'poev1.freeze_ceiling, '
set @strSQL = @strSQL + 'poev1.freeze_yr, '
set @strSQL = @strSQL + 'poev2.transfer_flag, '
set @strSQL = @strSQL + 'poev2.transfer_pct, '

if (@input_sup_num <> @input_primary_supp)
begin
	set @strSQL = @strSQL + 'isnull(bill_adj_trans.prev_mno_tax, 0) + isnull(bill_adj_trans.prev_ins_tax, 0) as tax '
end
else
begin
      	set @strSQL = @strSQL + 'isnull(bill_adj_trans.curr_mno_tax, 0) + isnull(bill_adj_trans.curr_ins_tax, 0)as tax '
end

set @strSQL = @strSQL + 'FROM owner '

set @strSQL = @strSQL + 'INNER JOIN property_val as pv '
set @strSQL = @strSQL + 'ON    owner.prop_id = pv.prop_id '
set @strSQL = @strSQL + 'AND   owner.owner_tax_yr = pv.prop_val_yr '
set @strSQL = @strSQL + 'AND   owner.sup_num = pv.sup_num '

set @strSQL = @strSQL + 'INNER JOIN account '
set @strSQL = @strSQL + 'ON    account.acct_id = owner.owner_id '

set @strSQL = @strSQL + 'LEFT OUTER JOIN entity_prop_assoc as epa '
set @strSQL = @strSQL + 'ON    owner.prop_id = epa.prop_id '
set @strSQL = @strSQL + 'AND   owner.sup_num = epa.sup_num '
set @strSQL = @strSQL + 'AND   owner.owner_tax_yr = epa.tax_yr '
--HS 19878
if @input_entity_ids <> ''
begin
	set @strSQL = @strSQL + 'AND	epa.entity_id IN (' + @input_entity_ids + ')'
end

set @strSQL = @strSQL + 'LEFT OUTER JOIN tax_rate '
set @strSQL = @strSQL + 'ON    epa.entity_id = tax_rate.entity_id '
set @strSQL = @strSQL + 'AND   epa.tax_yr = tax_rate.tax_rate_yr '

set @strSQL = @strSQL + 'LEFT OUTER JOIN entity '
set @strSQL = @strSQL + 'ON    epa.entity_id = entity.entity_id '

set @strSQL = @strSQL + 'LEFT OUTER JOIN account as entity_account '
set @strSQL = @strSQL + 'ON    entity.entity_id = entity_account.acct_id '

set @strSQL = @strSQL + 'LEFT OUTER JOIN prop_owner_entity_val as poev '
set @strSQL = @strSQL + 'ON    owner.prop_id = poev.prop_id '
set @strSQL = @strSQL + 'AND   owner.owner_tax_yr = poev.sup_yr '
set @strSQL = @strSQL + 'AND   owner.sup_num = poev.sup_num '
set @strSQL = @strSQL + 'AND   owner.owner_id = poev.owner_id '
set @strSQL = @strSQL + 'AND   epa.entity_id = poev.entity_id '

set @strSQL = @strSQL + 'LEFT OUTER JOIN prop_owner_entity_val as poev1 '
set @strSQL = @strSQL + 'ON	owner.prop_id = poev1.prop_id '
set @strSQL = @strSQL + 'AND	owner.owner_tax_yr = poev1.sup_yr '
set @strSQL = @strSQL + 'AND	owner.sup_num = poev1.sup_num '
set @strSQL = @strSQL + 'AND	owner.owner_id = poev1.owner_id '
set @strSQL = @strSQL + 'AND	epa.entity_id = poev1.entity_id '
set @strSQL = @strSQL + 'AND	EXISTS '
set @strSQL = @strSQL + '	( '
set @strSQL = @strSQL + '	SELECT	* '
set @strSQL = @strSQL + '	FROM	entity_exmpt as ee '
set @strSQL = @strSQL + '	WHERE	ee.entity_id = poev1.entity_id '
set @strSQL = @strSQL + '	AND	ee.exmpt_tax_yr = poev1.sup_yr '
set @strSQL = @strSQL + '	AND	rtrim(ee.exmpt_type_cd) = rtrim(poev1.freeze_type) '
set @strSQL = @strSQL + '	) '

set @strSQL = @strSQL + 'LEFT OUTER JOIN prop_owner_entity_val as poev2 '
set @strSQL = @strSQL + 'ON	owner.prop_id = poev2.prop_id '
set @strSQL = @strSQL + 'AND	owner.owner_tax_yr = poev2.sup_yr '
set @strSQL = @strSQL + 'AND	owner.sup_num = poev2.sup_num '
set @strSQL = @strSQL + 'AND	owner.owner_id = poev2.owner_id '
set @strSQL = @strSQL + 'AND	epa.entity_id = poev2.entity_id '
set @strSQL = @strSQL + 'AND	EXISTS '
set @strSQL = @strSQL + '	( '
set @strSQL = @strSQL + '	SELECT	* '
set @strSQL = @strSQL + '	FROM	entity_exmpt as ee '
set @strSQL = @strSQL + '	WHERE	ee.entity_id = poev2.entity_id '
set @strSQL = @strSQL + '	AND	ee.exmpt_tax_yr = poev2.sup_yr '
set @strSQL = @strSQL + '	AND	(rtrim(ee.exmpt_type_cd) + ''T'') = rtrim(poev2.freeze_type) '
set @strSQL = @strSQL + '	) '




if (@numOwner = 1)
begin
	set @strSQL = @strSQL + 'LEFT OUTER JOIN bill_adj_trans '
	set @strSQL = @strSQL + 'ON    owner.prop_id = bill_adj_trans.prop_id '
	set @strSQL = @strSQL + 'AND   owner.owner_tax_yr = bill_adj_trans.sup_tax_yr '
	set @strSQL = @strSQL + 'AND   poev.entity_id = bill_adj_trans.entity_id '
	set @strSQL = @strSQL + 'AND   bill_adj_trans.sup_group_id = ' + convert(varchar(12), @sup_group_id) + ' '
	set @strSQL = @strSQL + 'AND   bill_adj_trans.modify_reason like ''Supplemental Modification%'' '
	set @strSQL = @strSQL + 'AND   bill_adj_trans.sup_num = ' + convert(Varchar(12), @input_primary_supp) + ''
	
	
	set @strSQL = @strSQL + ' LEFT OUTER JOIN bill '
	set @strSQL = @strSQL + 'ON bill_adj_trans.bill_id = bill.bill_id '
end
else
begin
	set @strSQL = @strSQL + 'LEFT OUTER JOIN bill_adj_trans '
	set @strSQL = @strSQL + 'ON    owner.prop_id = bill_adj_trans.prop_id '
	set @strSQL = @strSQL + 'AND   owner.owner_tax_yr = bill_adj_trans.sup_tax_yr '
	set @strSQL = @strSQL + 'AND   poev.entity_id = bill_adj_trans.entity_id '
	set @strSQL = @strSQL + 'AND   bill_adj_trans.sup_group_id = ' + convert(varchar(12), @sup_group_id) + ' '
	set @strSQL = @strSQL + 'AND   bill_adj_trans.modify_reason like ''Supplemental Modification%'' '
	set @strSQL = @strSQL + 'AND   bill_adj_trans.sup_num = ' + convert(Varchar(12), @input_primary_supp) + ''
	
	
	set @strSQL = @strSQL + ' LEFT OUTER JOIN bill '
	set @strSQL = @strSQL + 'ON bill_adj_trans.bill_id = bill.bill_id '
end
	
	

set @strSQL = @strSQL + 'LEFT OUTER JOIN agent_assoc '
set @strSQL = @strSQL + 'ON    owner.prop_id = agent_assoc.prop_id '
set @strSQL = @strSQL + 'AND   owner.owner_id = agent_assoc.owner_id '
set @strSQL = @strSQL + 'AND   owner.owner_tax_yr = agent_assoc.owner_tax_yr '
set @strSQL = @strSQL + 'AND   agent_assoc.ca_mailings = ''T'' '
--HS 14888 
set @strSQL = @strSQL + 'AND   agent_assoc.exp_dt > GetDate() '

set @strSQL = @strSQL + 'LEFT OUTER JOIN account as agent_account '
set @strSQL = @strSQL + 'ON    agent_assoc.agent_id = agent_account.acct_id '

set @strSQL = @strSQL + 'LEFT OUTER JOIN address '
set @strSQL = @strSQL + 'ON    owner.owner_id = address.acct_id '
set @strSQL = @strSQL + 'AND   address.primary_addr = ''Y'' '

set @strSQL = @strSQL + 'LEFT OUTER JOIN country '
set @strSQL = @strSQL + 'ON country.country_cd = address.country_cd '

set @strSQL = @strSQL + 'WHERE	owner.owner_tax_yr = ' + CONVERT(varchar(5), @input_year) + ' '

set @strSQL = @strSQL + 'AND	owner.prop_id = ' + CONVERT(varchar(12), @input_prop_id) + ' '
set @strSQL = @strSQL + 'AND	owner.sup_num = ' + CONVERT(varchar(5), @input_sup_num) + ' '

/*if @input_entity_ids <> ''
begin
	set @strSQL = @strSQL + 'AND	epa.entity_id IN (' + @input_entity_ids + ')'
end
*/
set @strSQL = @strSQL + 'ORDER BY account.file_as_name, entity.entity_cd'


exec(@strSQL)

GO


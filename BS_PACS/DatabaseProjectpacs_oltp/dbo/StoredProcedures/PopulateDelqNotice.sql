

CREATE PROCEDURE PopulateDelqNotice

@input_sql	varchar(2048),
@input_bill_sql	varchar(2048),
@input_agent	varchar(1),
@input_user_id	int

AS

declare @exec_sql varchar(4096)

SET NOCOUNT ON

--First, get rid of all delq_notice and delq_notice_bill records where the delq_notice.status = 'F'... They are fair game to be deleted at this point.
delete from delq_notice
where status = 'F'
	and pacs_user_id = @input_user_id

delete from delq_notice_bill
where delq_notice_id not in
(
	select delq_notice_id
	from delq_notice
)

--Build the SQL
/*
set @exec_sql = '
insert into delq_notice
(
	pacs_user_id,
	print_dt,
	prop_id,
	owner_id,
	payee_id,
	agent_id,
	prop_type_cd,
	ml_deliverable
)
select distinct
	' + cast(@input_user_id as varchar(20)) + ',
	GetDate(),
	prop_id,
	owner_id,
	owner_id,
	agent_id,
	prop_type_cd,
	ml_deliverable
from delq_notice_prep_vw ' + @input_sql
*/

set @exec_sql = '
insert into delq_notice
(
	pacs_user_id,
	print_dt,
	prop_id,
	owner_id,
	payee_id,
	agent_id,
	prop_type_cd,
	ml_deliverable
)
select distinct
	' + cast(@input_user_id as varchar(20)) + ',
	GetDate(),
	prop_id,
	owner_id,
	owner_id,
	null,
	prop_type_cd,
	ml_deliverable
from delq_notice_prep_vw with (nolock) ' + @input_sql

--Execute the SQL
exec(@exec_sql)

/*
 * Now put the agent_id in here.  Only want one or it will
 * double the value and bills on the delq notice.
 *
 * It doesn't matter which agent goes in the delq_notice
 * table because it's just used to print a message saying
 * that a copy has been sent to the agent.
 */

declare @prop_id int
declare @owner_id int
declare @agent_id int

declare AGENTS CURSOR FAST_FORWARD
FOR select distinct p.prop_id, p.col_owner_id, p.col_agent_id
	from property as p
	with (nolock)

	inner join delq_notice as dn
	with (nolock)
	on p.prop_id = dn.prop_id
	and p.col_owner_id = dn.owner_id
	where dn.status is null
	and dn.owner_id = dn.payee_id
	and dn.pacs_user_id = @input_user_id

OPEN AGENTS

FETCH NEXT FROM AGENTS INTO @prop_id, @owner_id, @agent_id

WHILE @@FETCH_STATUS = 0
BEGIN
	update delq_notice
	set agent_id = @agent_id
	where prop_id = @prop_id
		and owner_id = @owner_id
		and status is null
		and pacs_user_id = @input_user_id

	FETCH NEXT FROM AGENTS INTO @prop_id, @owner_id, @agent_id
END

CLOSE AGENTS
DEALLOCATE AGENTS

--If the agent wants a copy, then add more records
if (@input_agent = 'T')
begin
	set @exec_sql = '
	insert into delq_notice
	(
		pacs_user_id,
		print_dt,
		prop_id,
		owner_id,
		payee_id,
		agent_id,
		prop_type_cd,
		ml_deliverable
	)
	select distinct
		' + cast(@input_user_id as varchar(20)) + ',
		GetDate(),
		prop_id,
		owner_id,
		agent_id,
		null,
		prop_type_cd,
		ml_deliverable
	from delq_notice_prep_vw with (nolock) ' + @input_sql + (case when @input_sql = '' then 'where agent_id is not null' else ' and agent_id is not null' end)

	--Execute the SQL
	exec(@exec_sql)
end

--Update status
update delq_notice set status = 'F' where pacs_user_id = @input_user_id and status is null

--Populate the delq_notice_bills table with the bill_id's, etc.
--Build the SQL
set @exec_sql = '
insert into delq_notice_bill
(
	delq_notice_id,
	bill_id,
	stmnt_id,
	entity_id,
	entity_file_as_name,
	tax_yr,
	taxable_val,
	tax_rate,
	base_tax,
	disc_pi1,
	attorney_fee1,
	tax_due1,
	disc_pi2,
	attorney_fee2,
	tax_due2,
	disc_pi3,
	attorney_fee3,
	tax_due3,
	q_bill
	)
select distinct
	delq_notice.delq_notice_id,
	bill.bill_id,
	bill.stmnt_id,
	bill.entity_id,
	cast(account.file_as_name as varchar(50)),
	bill.sup_tax_yr,
	bill.bill_taxable_val,
	tax_rate.m_n_o_tax_pct + tax_rate.i_n_s_tax_pct,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	bill.pay_type
from delq_notice with (nolock), bill with (nolock), account with (nolock), tax_rate with (nolock), entity with (nolock)
where delq_notice.prop_id = bill.prop_id
and bill.entity_id = account.acct_id
and bill.entity_id = entity.entity_id
and bill.entity_id = tax_rate.entity_id
and bill.sup_tax_yr = tax_rate.tax_rate_yr
and bill.coll_status_cd <> ''RS''
and bill.active_bill = ''T''
and bill.entity_id in (select entity_id from entity_collect_for_vw)
and (bill.bill_adj_m_n_o + bill_adj_i_n_s) - 
    ((bill.bill_m_n_o_pd + bill.bill_i_n_s_pd + discount_mno_pd + discount_ins_pd + underage_mno_pd +  underage_ins_pd) - 
    (bill.refund_m_n_o_pd + bill.refund_i_n_s_pd + bill.refund_disc_mno_pd + bill.refund_disc_ins_pd)) > 0
and bill.prop_id > 0
and delq_notice.pacs_user_id = ' + cast(@input_user_id as varchar(20)) + '
and delq_notice.status = ''F'''

--Append criteria from the GUI
if len(@input_bill_sql) > 0
begin
	set @exec_sql = @exec_sql + @input_bill_sql
end

--Execute the SQL
exec(@exec_sql)

GO


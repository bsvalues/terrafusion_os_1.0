





CREATE PROCEDURE StatementOfAccountUnpaidBillsInfo

@input_prop_id		int = 0,
@input_owner_id	int = 0,
@input_year		int = 0,
@input_sup_num	int = 0,
@input_pacs_user_id	int = 0

AS


declare @count		int

select @count = (select count(prop_tax_due.entity_id)
from prop_tax_due, bill, tax_rate
where prop_tax_due.bill_id = bill.bill_id
and prop_tax_due.entity_id = bill.entity_id
and prop_tax_due.prop_id = bill.prop_id
--and prop_tax_due.owner_id = bill.owner_id
and prop_tax_due.entity_id = tax_rate.entity_id
and prop_tax_due.tax_yr = tax_rate.tax_rate_yr
and bill.active_bill = 'T'
and prop_tax_due.prop_id = @input_prop_id
--and prop_tax_due.owner_id = @input_owner_id
--and prop_tax_due.tax_yr <= @input_year
and prop_tax_due.pacs_user_id = @input_pacs_user_id)

if (@count > 0)
begin
	select 1 as DumbID,
		prop_tax_due.entity_cd as entity,
		prop_tax_due.tax_yr as year,
		prop_tax_due.stmnt_id as statement_id,
		tax_rate.m_n_o_tax_pct + tax_rate.i_n_s_tax_pct + tax_rate.prot_i_n_s_tax_pct as tax_rate,
		bill.bill_type as type,
		prop_tax_due.tax_due,
		prop_tax_due.disc_pi,
		prop_tax_due.att_fee,
		prop_tax_due.tax_due + prop_tax_due.disc_pi + prop_tax_due.att_fee as total_due,
		case when month(prop_tax_due.effective_dt) = 12
			then dateadd(dd, -1, '1/1/' + cast((year(prop_tax_due.effective_dt) + 1) as varchar(4)))
			else dateadd(dd, -1, cast(month(prop_tax_due.effective_dt)+1 as varchar(2)) + '/1/' + cast(year(prop_tax_due.effective_dt) as varchar(4)))
			end as paid_by_date,
		prop_tax_due.owner_id as owner_id
	from prop_tax_due, bill, tax_rate, entity
	where prop_tax_due.bill_id = bill.bill_id
	and prop_tax_due.entity_id = bill.entity_id
	and prop_tax_due.prop_id = bill.prop_id
	--and prop_tax_due.owner_id = bill.owner_id
	and prop_tax_due.entity_id = tax_rate.entity_id
	and prop_tax_due.tax_yr = tax_rate.tax_rate_yr
	and bill.active_bill = 'T'
	and prop_tax_due.prop_id = @input_prop_id
	--and prop_tax_due.owner_id = @input_owner_id
	--and prop_tax_due.tax_yr <= @input_year
	and prop_tax_due.pacs_user_id = @input_pacs_user_id
	and entity.entity_id = tax_rate.entity_id
	and isnull(entity.rendition_entity, 0) = 0
	--order by prop_tax_due.owner_id, prop_tax_due.tax_yr, prop_tax_due.entity_cd, prop_tax_due.stmnt_id
	
	UNION

	SELECT
		1 as DumbID,
		'BPP' as entity,
		prop_tax_due.tax_yr as year,
		prop_tax_due.stmnt_id as statement_id,
		SUM (tax_rate.m_n_o_tax_pct + tax_rate.i_n_s_tax_pct + tax_rate.prot_i_n_s_tax_pct) as tax_rate,
		'' as type,
		SUM (prop_tax_due.tax_due) as tax_due,
		SUM (prop_tax_due.disc_pi) as disc_pi,
		SUM (prop_tax_due.att_fee) as att_fee,
		SUM (prop_tax_due.tax_due + prop_tax_due.disc_pi + prop_tax_due.att_fee) as total_due,
--		NULL as paid_by_date,
		case when month(prop_tax_due.effective_dt) = 12
			then dateadd(dd, -1, '1/1/' + cast((year(prop_tax_due.effective_dt) + 1) as varchar(4)))
			else dateadd(dd, -1, cast(month(prop_tax_due.effective_dt)+1 as varchar(2)) + '/1/' + cast(year(prop_tax_due.effective_dt) as varchar(4)))
			end as paid_by_date,
		prop_tax_due.owner_id as owner_id
	
	FROM
		prop_tax_due
		INNER JOIN 
		bill
			ON  prop_tax_due.prop_id = @input_prop_id
			AND prop_tax_due.bill_id = bill.bill_id
			AND prop_tax_due.entity_id = bill.entity_id
			AND prop_tax_due.prop_id = bill.prop_id
		INNER JOIN tax_rate
			ON prop_tax_due.entity_id = tax_rate.entity_id
			AND prop_tax_due.tax_yr = tax_rate.tax_rate_yr
		INNER JOIN entity
			ON tax_rate.entity_id = entity.entity_id
			AND isnull(entity.rendition_entity, 0) = 1
	
	WHERE
		prop_tax_due.pacs_user_id = @input_pacs_user_id
		and bill.active_bill = 'T'

	GROUP BY
		prop_tax_due.prop_id,
		prop_tax_due.tax_yr,
		prop_tax_due.stmnt_id,
		prop_tax_due.owner_id,
		prop_tax_due.effective_dt

order by prop_tax_due.owner_id, prop_tax_due.tax_yr, prop_tax_due.entity_cd, prop_tax_due.stmnt_id		
		
end
else
begin
	select 0 as DumbID
end

GO


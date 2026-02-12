

CREATE PROCEDURE PropFreezeLM
	@id1 		int,
	@id2 		int,
	@year 		numeric(4,0) = null,
	@sup_num 	int = null

AS

if (@id1 <> 0)
begin
	if (@year is null)
	begin
		if exists (select * from pacs_system with (nolock) where system_type in ('A', 'B'))
		begin
			select
				@year = appr_yr
			from
				pacs_system with (nolock)
			where
				system_type in ('A', 'B')
		end
		else
		begin
			select
				@year = appr_yr
			from
				pacs_system with (nolock)
			where
				system_type = 'C'
		end
	end

	if (@sup_num is null)
	begin
		select
			@sup_num = sup_num
		from
			prop_supp_assoc with (nolock)
		where
			prop_id = @id1
		and	owner_tax_yr = @year
	end

	select
		rtrim(e.entity_cd) as ENTITY,
		rtrim(pf.exmpt_type_cd) as EXEMPTION,
		case when pf.transfer_dt is null
			then ''
			else convert(varchar(20), pf.transfer_dt, 101)
		end as TRANSFER_DATE,
		case when pf.prev_tax_due is null
			then ''
			else convert(varchar(20), pf.prev_tax_due)
		end as PREV_TAX_DUE,
		case when pf.prev_tax_nofrz is null
			then ''
			else convert(varchar(20), pf.prev_tax_nofrz)
		end AS PREV_TAX_NOFRZ,
		case when ((isnull(pf.use_freeze, 'F') = 'F') or pf.freeze_yr is null)
			then ''
			else convert(varchar(4), pf.freeze_yr)
		end as FREEZE_YEAR,
		case when ((isnull(pf.use_freeze, 'F') = 'F') or pf.freeze_ceiling is null)
			then ''
			else convert(varchar(20), pf.freeze_ceiling)
		end as FREEZE_CEILING,
		case when pf.transfer_pct is null
			then ''
			else convert(varchar(20), pf.transfer_pct)
		end as TRANSFER_PCT,
		isnull(pf.transfer_pct_override, 'F') as TRANSFER_PCT_OVERRIDE
	from
		property_freeze as pf with (nolock)
	join
		entity as e with (nolock)
	on
		pf.entity_id = e.entity_id
	where
		pf.prop_id = @id1
	and	pf.owner_id = @id2
	and	pf.exmpt_tax_yr = @year
	and	pf.owner_tax_yr = @year
	and	pf.sup_num = @sup_num
	and	pf.use_freeze = 'T'
	order by
		e.entity_cd,
		pf.exmpt_type_cd,
		pf.freeze_ceiling
end
else
begin
	select
		'Entity' as ENTITY,
		'Exemption' as EXEMPTION,
		'Transfer Date' as TRANSFER_DATE,
		'Previous Tax' as PREV_TAX_DUE,
		'Previous Tax - No Freeze' as PREV_TAX_NOFRZ,
		'Freeze Year' AS FREEZE_YEAR,
		'Freeze Ceiling' AS FREEZE_CEILING,
		'Transfer Pct.' AS TRANSFER_PCT,
		'Transfer Pct. Override' AS TRANSFER_PCT_OVERRIDE
end

GO


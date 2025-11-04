
CREATE procedure HSCapValueVerificationReport

	@input_year int,
	@input_entities varchar(500)

as

	declare @strSQL varchar(3000)


set nocount on

	if exists(select * from sysobjects where object_name(id) = 'hs_cap_report' and xtype = 'U')
	begin
		drop table dbo.hs_cap_report
	end

	set @strSQL = 'SELECT epa.entity_id, '
	set @strSQL = @strSQL + 'e.entity_cd, '
	set @strSQL = @strSQL + 'ea.file_as_name as entity_name, '
	set @strSQL = @strSQL + 'p.prop_id, '
	set @strSQL = @strSQL + 'p.geo_id, '
	set @strSQL = @strSQL + 'a.file_as_name as owner_name, '
	set @strSQL = @strSQL + 'pv.land_hstd_val as curr_land_hstd_val, '
	set @strSQL = @strSQL + 'pv.imprv_hstd_val as curr_imprv_hstd_val, '
	set @strSQL = @strSQL + 'ppv.land_hstd_val as prev_land_hstd_val, '
	set @strSQL = @strSQL + 'ppv.imprv_hstd_val as prev_imprv_hstd_val, '
	set @strSQL = @strSQL + 'case when pv.prop_val_yr - isnull(pv.hscap_base_yr, pv.prop_val_yr) > 3 '
	set @strSQL = @strSQL + 'then convert(numeric(14,0), pv.hscap_prevhsval + (pv.hscap_prevhsval * .30) + pv.hscap_newhsval) '
	set @strSQL = @strSQL + 'else convert(numeric(14,0), pv.hscap_prevhsval + (pv.hscap_prevhsval * (pv.prop_val_yr - isnull(pv.hscap_base_yr,pv.prop_val_yr)) * .10) + pv.hscap_newhsval) '
	set @strSQL = @strSQL + 'end as hs_cap_amount, '
	set @strSQL = @strSQL + 'pv.ten_percent_cap '
	
	set @strSQL = @strSQL + 'into dbo.hs_cap_report '
	
	set @strSQL = @strSQL + 'FROM property_val as pv '
	set @strSQL = @strSQL + 'WITH (NOLOCK) '

	set @strSQL = @strSQL + 'INNER JOIN prop_supp_assoc as psa '
	set @strSQL = @strSQL + 'WITH (NOLOCK) '
	set @strSQL = @strSQL + 'ON pv.prop_id = psa.prop_id '
	set @strSQL = @strSQL + 'AND pv.prop_val_yr = psa.owner_tax_yr '
	set @strSQL = @strSQL + 'AND pv.sup_num = psa.sup_num '

	set @strSQL = @strSQL + 'INNER JOIN owner as o '
	set @strSQL = @strSQL + 'WITH (NOLOCK) '
	set @strSQL = @strSQL + 'ON pv.prop_id = o.prop_id '
	set @strSQL = @strSQL + 'AND pv.prop_val_yr = o.owner_tax_yr '
	set @strSQL = @strSQL + 'AND pv.sup_num = o.sup_num '

	set @strSQL = @strSQL + 'INNER JOIN account as a '
	set @strSQL = @strSQL + 'WITH (NOLOCK) '
	set @strSQL = @strSQL + 'ON o.owner_id = a.acct_id '

	set @strSQL = @strSQL + 'INNER JOIN property as p '
	set @strSQL = @strSQL + 'WITH (NOLOCK) '
	set @strSQL = @strSQL + 'ON pv.prop_id = p.prop_id '

	set @strSQL = @strSQL + 'INNER JOIN prop_supp_assoc as ppsa '
	set @strSQL = @strSQL + 'WITH (NOLOCK) '
	set @strSQL = @strSQL + 'ON pv.prop_id = ppsa.prop_id '
	set @strSQL = @strSQL + 'AND pv.prop_val_yr -1 = ppsa.owner_tax_yr '

	set @strSQL = @strSQL + 'INNER JOIN property_val as ppv '
	set @strSQL = @strSQL + 'WITH (NOLOCK) '
	set @strSQL = @strSQL + 'ON ppsa.prop_id = ppv.prop_id '
	set @strSQL = @strSQL + 'AND ppsa.owner_tax_yr = ppv.prop_val_yr '
	set @strSQL = @strSQL + 'AND ppsa.sup_num = ppv.sup_num '

	set @strSQL = @strSQL + 'INNER JOIN entity_prop_assoc as epa '
	set @strSQL = @strSQL + 'WITH (NOLOCK) '
	set @strSQL = @strSQL + 'ON pv.prop_id = epa.prop_id '
	set @strSQL = @strSQL + 'AND pv.prop_val_yr = epa.tax_yr '
	set @strSQL = @strSQL + 'AND pv.sup_num = epa.sup_num '

	set @strSQL = @strSQL + 'INNER JOIN entity as e '
	set @strSQL = @strSQL + 'WITH (NOLOCK) '
	set @strSQL = @strSQL + 'ON epa.entity_id = e.entity_id '

	set @strSQL = @strSQL + 'INNER JOIN account as ea '
	set @strSQL = @strSQL + 'WITH (NOLOCK) '
	set @strSQL = @strSQL + 'ON epa.entity_id = ea.acct_id '

	set @strSQL = @strSQL + 'WHERE pv.prop_inactive_dt IS NULL '
	set @strSQL = @strSQL + 'AND pv.ten_percent_cap > 0 '
	set @strSQL = @strSQL + 'AND pv.prop_val_yr = ' + convert(varchar(4), @input_year) + ' '

	if @input_entities <> ''
	begin
		set @strSQL = @strSQL + 'AND e.entity_cd IN (' + @input_entities + ') '
	end

	set @strSQL = @strSQL + 'ORDER BY ea.file_as_name '

	exec(@strSQL)

GO


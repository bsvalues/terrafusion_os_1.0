
CREATE PROCEDURE GainLossReport

	@input_min_assessed_gain numeric(14,0),
	@input_min_assessed_loss numeric(14,0),
	@input_include_zero_assessed bit,
	@input_include_real bit,
	@input_include_personal bit,
	@input_include_mobile bit,
	@input_include_mineral bit,
	@input_include_auto bit,
	@input_abs_subdv varchar(50),
	@input_entities varchar(500)

AS

	declare @strSQL varchar(3000)
	declare @strTypes varchar(100)
	declare @appr_yr int

set nocount on

	select @appr_yr = appr_yr
	from pacs_system
	with (nolock)
	where system_type in ('A','B')

	if exists(select * from sysobjects where object_name(id) = 'gain_loss_report' and xtype = 'U')
	begin
		drop table dbo.gain_loss_report
	end

	set @strSQL = 'SELECT epa.entity_id, '
	set @strSQL = @strSQL + 'e.entity_cd, '
	set @strSQL = @strSQL + 'ea.file_as_name as entity_name, '
	set @strSQL = @strSQL + 'p.prop_type_cd, '
	set @strSQL = @strSQL + 'p.prop_id, '
	set @strSQL = @strSQL + 'pv.abs_subdv_cd, '
	set @strSQL = @strSQL + 'p.geo_id, '
	set @strSQL = @strSQL + 'pv.legal_desc, '
	set @strSQL = @strSQL + 'a.file_as_name as owner_name, '
	set @strSQL = @strSQL + 'pv.appraised_val as curr_appraised_val, '
	set @strSQL = @strSQL + 'ppv.appraised_val as prev_appraised_val, '
	set @strSQL = @strSQL + 'pv.appraised_val - ppv.appraised_val as gain_loss, '
	set @strSQL = @strSQL + 'pv.hood_cd, '
	set @strSQL = @strSQL + 'pp.imprv_type_cd, '
	set @strSQL = @strSQL + 'case when pv.appraised_val>0 then ROUND((((pv.appraised_val - ppv.appraised_val)/pv.appraised_val)*100.0),2) else 0 end as pct_change '


	set @strSQL = @strSQL + 'into dbo.gain_loss_report '
	
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

	set @strSQL = @strSQL + 'LEFT OUTER JOIN property_profile as pp '
	set @strSQL = @strSQL + 'WITH (NOLOCK) '
	set @strSQL = @strSQL + 'ON pv.prop_id = pp.prop_id '
	set @strSQL = @strSQL + 'AND pv.prop_val_yr = pp.prop_val_yr '
	set @strSQL = @strSQL + 'AND pv.sup_num = pp.sup_num '

	set @strSQL = @strSQL + 'WHERE pv.prop_inactive_dt IS NULL '
	set @strSQL = @strSQL + 'AND pv.prop_val_yr = ' + convert(varchar(4), @appr_yr) + ' '

	set @strSQL = @strSQL + 'AND (pv.appraised_val - ppv.appraised_val >= ' + convert(varchar(20), @input_min_assessed_gain) + ' '
	set @strSQL = @strSQL + 'OR pv.appraised_val - ppv.appraised_val <= ' + convert(varchar(20), @input_min_assessed_loss) + ') '

	if @input_include_zero_assessed = 0
	begin
		set @strSQL = @strSQL + 'AND pv.assessed_val <> 0 '
	end

	set @strSQL = @strSQL + 'AND p.prop_type_cd IN ('

	set @strTypes = ''

	if @input_include_real = 1
	begin
		set @strTypes = '''R'''
	end

	if @input_include_personal = 1
	begin
		if @strTypes <> ''
		begin
			set @strTypes = @strTypes + ','
		end
		set @strTypes = @strTypes + '''P'''
	end

	if @input_include_mobile = 1
	begin
		if @strTypes <> ''
		begin
			set @strTypes = @strTypes + ','
		end
		set @strTypes = @strTypes + '''MH'''
	end

	if @input_include_mineral = 1
	begin
		if @strTypes <> ''
		begin
			set @strTypes = @strTypes + ','
		end
		set @strTypes = @strTypes + '''MN'''
	end

	if @input_include_auto = 1
	begin
		if @strTypes <> ''
		begin
			set @strTypes = @strTypes + ','
		end
		set @strTypes = @strTypes + '''A'''
	end

	set @strSQL = @strSQL + @strTypes + ') '

	if @input_abs_subdv <> ''
	begin
		set @strSQL = @strSQL + 'AND pv.abs_subdv_cd = ''' + @input_abs_subdv + ''' '
	end

	if @input_entities <> ''
	begin
		set @strSQL = @strSQL + 'AND e.entity_cd IN (' + @input_entities + ') '
	end

	set @strSQL = @strSQL + 'ORDER BY ea.file_as_name '

	exec(@strSQL)

GO


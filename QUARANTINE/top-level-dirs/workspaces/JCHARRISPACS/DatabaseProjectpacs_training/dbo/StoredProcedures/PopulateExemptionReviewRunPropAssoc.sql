
create procedure PopulateExemptionReviewRunPropAssoc

	@run_id int,
	@year numeric(4,0),
	@type_flag char(1),
	@criteria_type_flag char(1),
	@begin_date varchar(20),
	@end_date varchar(20),
	@qualify_year numeric(4,0),
	@last_review_year numeric(4,0),
	@query varchar(4000) = ''

as 

declare @sqlInsert varchar(4000)
declare @sqlJoin varchar(4000)
declare @sqlWhere varchar(4000)

set @sqlJoin = ''
set @query = isnull(@query,'')

set @sqlInsert = 'insert exemption_review_run_prop_assoc
		(run_id, prop_id)

		select ' + convert(varchar, @run_id) + ', pe.prop_id
		from property_exemption as pe
		with (nolock)
		join property_val as pv
		with (nolock)
		on pe.exmpt_tax_yr = pv.prop_val_yr
		and pe.owner_tax_yr = pv.prop_val_yr
		and pe.sup_num = pv.sup_num
		and pe.prop_id = pv.prop_id
		join property as p
		with (nolock)
		on pv.prop_id = p.prop_id
'

set @sqlWhere = 'where pe.exmpt_tax_yr = ' + convert(varchar, @year) + '
		and pe.owner_tax_yr = ' + convert(varchar, @year) + '
		and pe.sup_num = 0
		and pe.exmpt_type_cd = ''SNR/DSBL''
		and pv.prop_inactive_dt is null
		and isnull(p.reference_flag, '''') <> ''T''
		and pv.prop_id not in
		(
			select prop_id
			from exemption_review_run_prop_assoc as errpa
			with (nolock)
			join exemption_review_run as err
			with (nolock)
			on errpa.run_id = err.run_id
			where err.[year] = ' + convert(varchar, @year) + '
		)
'

if @type_flag = 'S'
begin
	if @criteria_type_flag = 'O'
	begin
		set @sqlJoin = '
		join
		(
			select distinct coopa.prop_id, chg_of_owner_id = max(coopa.chg_of_owner_id)
			from chg_of_owner_prop_assoc as coopa 
			with (nolock)
			group by coopa.prop_id
		) as tcoopa
		on pv.prop_id = tcoopa.prop_id
		join chg_of_owner as coo
		with (nolock)
		on tcoopa.chg_of_owner_id = coo.chg_of_owner_id
		'

		set @sqlWhere = @sqlWhere + '
		and coo.coo_sl_dt >= ''' + convert(varchar, @begin_date) + '''
		and coo.coo_sl_dt <= ''' + convert(varchar, @end_date) + '''
		'
	end
	else if @criteria_type_flag = 'Q'
	begin
		set @sqlWhere = @sqlWhere + '
		and pe.qualify_yr = ' + convert(varchar, @qualify_year) + '
		'
	end
	else if @criteria_type_flag = 'L'
	begin
		set @sqlWhere = @sqlWhere + '
		and pe.review_last_year = ' + convert(varchar, @last_review_year) + '
		'
	end
end
else if @type_flag = 'Q'
begin
	set @sqlWhere = @sqlWhere + '
	and pv.prop_id in '
	
	set @query = '(' + @query + ')'
	
end

exec(@sqlInsert + @sqlJoin + @sqlWhere + @query)

GO


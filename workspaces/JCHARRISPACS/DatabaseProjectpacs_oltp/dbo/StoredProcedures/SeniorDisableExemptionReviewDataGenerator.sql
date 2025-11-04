
create procedure SeniorDisableExemptionReviewDataGenerator
	@dataset_id int,
	@run_id int,
	@year numeric(4,0),
	@status varchar(1000),
	@begin_date varchar(10),
	@end_date varchar(10),
	@qualify_year varchar(1000)

as

set nocount on

declare @sql varchar(4000)

if @run_id is not null
begin
	set @sql = '
	insert ##senior_disable_exemption_review
	(dataset_id, prop_id, owner_name, request_date, review_status_cd,
	 exemption_sub_type, qualify_year, comment)

	select ' + convert(varchar, @dataset_id) + ', errpa.prop_id, a.file_as_name, pe.review_request_date,
		pe.review_status_cd, pe.exmpt_subtype_cd, pe.qualify_yr, left(isnull(pe.sp_comment, ''''), 100)
	from exemption_review_run_prop_assoc as errpa
	with (nolock)
	join prop_supp_assoc as psa
	with (nolock)
	on psa.owner_tax_yr = ' + convert(varchar, @year) + '
	and errpa.prop_id = psa.prop_id
	join property_exemption as pe
	with (nolock)
	on pe.exmpt_tax_yr = psa.owner_tax_yr
	and pe.owner_tax_yr = psa.owner_tax_yr
	and pe.sup_num = psa.sup_num
	and pe.prop_id = psa.prop_id
	join owner as o
	with (nolock)
	on pe.exmpt_tax_yr = o.owner_tax_yr
	and pe.owner_tax_yr = o.owner_tax_yr
	and pe.sup_num = o.sup_num
	and pe.prop_id = o.prop_id
	join account as a
	with (nolock)
	on o.owner_id = a.acct_id
	where errpa.run_id = ' + convert(varchar, @run_id) + '
	and pe.exmpt_type_cd = ''SNR/DSBL'''
end
else
begin
	set @sql = '
	insert ##senior_disable_exemption_review
	(dataset_id, prop_id, owner_name, request_date, review_status_cd,
	 exemption_sub_type, qualify_year, comment)

	select ' + convert(varchar, @dataset_id) + ', pe.prop_id, a.file_as_name, pe.review_request_date,
		pe.review_status_cd, pe.exmpt_subtype_cd, pe.qualify_yr, left(isnull(pe.sp_comment, ''''), 100)
	from property_exemption as pe
	with (nolock)
	join prop_supp_assoc as psa
	with (nolock)
	on pe.exmpt_tax_yr = psa.owner_tax_yr
	and pe.owner_tax_yr = psa.owner_tax_yr
	and pe.sup_num = psa.sup_num
	and pe.prop_id = psa.prop_id
	join owner as o
	with (nolock)
	on pe.exmpt_tax_yr = o.owner_tax_yr
	and pe.owner_tax_yr = o.owner_tax_yr
	and pe.sup_num = o.sup_num
	and pe.prop_id = o.prop_id
	join account as a
	with (nolock)
	on o.owner_id = a.acct_id
	where pe.exmpt_tax_yr = ' + convert(varchar, @year) + '
	and pe.owner_tax_yr = ' + convert(varchar, @year) + '
	and pe.exmpt_type_cd = ''SNR/DSBL''
	and pe.review_request_date >= ''' + @begin_date + ' 00:00''
	and pe.review_request_date <= ''' + @end_date + ' 23:59'' '

	if len(@status) > 0
	begin
		set @sql = @sql + '
  and case when len(''' + replace(@status, '''', '''''') + ''') > 0 and pe.review_status_cd in (' + @status + ') then 1
					when len(''' + replace(@status, '''', '''''') + ''') = 0 then 1
					else 0 end = 1
		'
	end

	if len(@qualify_year) > 0
	begin
		set @sql = @sql + '
	and case when len(''' + @qualify_year + ''') > 0 and pe.qualify_yr in (' + @qualify_year + ') then 1
					when len(''' + @qualify_year + ''') = 0 then 1
					else 0 end = 1
	'
	end
end

exec(@sql)

GO


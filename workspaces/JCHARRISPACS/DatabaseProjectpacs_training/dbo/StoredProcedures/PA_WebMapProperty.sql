

CREATE PROCEDURE [dbo].[PA_WebMapProperty]
	@szServerDBSource sysname

as

declare @sql varchar(8000);
declare @year varchar (8000)

set @sql = 'select
	p.prop_id,
	p.prop_val_yr,
	p.geo_id,
	p.prop_type_cd,
	p.prop_type_desc,
	p.dba_name,
	case
		when y.certification_dt is null then ''N/A''
		when ISNULL(p.show_values,''T'') = ''F'' then ''N/A''
		else ''$'' + convert(varchar(20), p.appraised_val)
	end as appraised_val,
	p.abs_subdv_cd,
	p.mapsco,
	p.map_id,
	p.agent_cd,
	p.hood_cd,
	p.hood_name,
	case
		when a.confidential_flag = ''T'' then
		(
			select
				isnull(confidential_file_as_name, ''Confidential'') as confidential_file_as_name
			from
				' +@szServerDBSource+'.dbo.pacs_system
		)
		else
			p.owner_name
	end as owner_name,
	p.owner_id,
	case
		when a.confidential_flag = ''T'' then
		(
			select
				''Confidential'' as confidential_addr_line1
		)
		else
			p.addr_line1
	end as addr_line1,
	case
		when a.confidential_flag = ''T'' then
		(
			select
				''Confidential'' as confidential_addr_line2
		)
		else
			p.addr_line2
	end as addr_line2,
	case
		when a.confidential_flag = ''T'' then
		(
			select
				''Confidential'' as confidential_addr_line3
		)
		else
			p.addr_line3
	end as addr_line3,
	p.addr_city,
	p.addr_state,
	p.addr_zip,
	p.country_cd,
	p.pct_ownership,
	p.exemptions,
	p.state_cd,
	p.legal_desc,
	replace(replace(replace(p.situs_display, char(10), ''''), char(13), '' ''), ''  '', '' '') as situs,
	p.jurisdictions
from '+@szServerDBSource+'.dbo._clientdb_property as p with (nolock)
join '+@szServerDBSource+'.dbo._clientdb_pacs_year as y with (nolock)
on p.prop_val_yr = y.tax_yr
join '+@szServerDBSource+'.dbo.account as a with (nolock)
on a.acct_id = p.owner_id
where
	(a.web_suppression = ''0'' or a.web_suppression is null) AND p.prop_val_yr IN (select max(prop_val_yr) from property_val)'
exec(@sql)

GO


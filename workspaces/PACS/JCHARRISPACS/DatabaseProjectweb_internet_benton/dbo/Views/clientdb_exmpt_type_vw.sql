
			create view dbo.clientdb_exmpt_type_vw
			as
			select rtrim(exmpt_type_cd) as code, exmpt_desc as description
			from web_internet_benton.dbo._clientdb_exmpt_type with (nolock)

GO


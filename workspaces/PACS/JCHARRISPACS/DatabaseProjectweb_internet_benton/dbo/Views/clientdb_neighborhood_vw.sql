
			create view dbo.clientdb_neighborhood_vw
			as
			select rtrim(hood_cd) as code, hood_name as description
			from _clientdb_neighborhood	with (nolock)

GO


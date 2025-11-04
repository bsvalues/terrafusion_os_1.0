
			create view dbo.clientdb_subdivision_vw
			as
			select abs_subdv_ind, rtrim(abs_subdv_cd) as code, abs_subdv_desc as description
			from _clientdb_abs_subdv with (nolock)

GO


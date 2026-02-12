create view __aaClientdb_Hood as 
			select [code]
      ,[description]
			from web_internet_benton.dbo.clientdb_neighborhood_vw	with (nolock)

GO


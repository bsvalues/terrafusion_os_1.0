create view __aaAddress as 
SELECT       property.prop_id, address.acct_id, address.addr_line1, address.addr_line2, address.addr_line3, address.addr_city, address.addr_state, address.zip, address.primary_addr, XCoord,ycoord
--owner.prop_id

FROM            address INNER JOIN
                         account ON address.acct_id = account.acct_id INNER JOIN
                         owner ON account.acct_id = owner.owner_id INNER JOIN
                         property ON owner.prop_id = property.prop_id
						 LEFT JOIN 
	(SELECT [Parcel_ID],ROW_NUMBER() over (partition by prop_id ORDER BY [OBJECTID] DESC) AS order_id,[Prop_ID],[Shape].STCentroid().STX as XCoord,	[Shape].STCentroid().STY as YCoord 
		FROM [Benton_spatial_data].[dbo].[PARCELSANDASSESS]) as coords on coords.Prop_ID=property.prop_id
WHERE primary_addr = 'Y'
and owner_tax_yr=2020
and XCoord is not null
and [prop_type_cd]='r'

GO


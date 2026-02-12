
create view __mosquito as
SELECT     distinct b.prop_id,ab.year, ab.agency_id, ab.bill_id, sas.assessment_fee_amt, saa.assessment_cd, saa.assessment_description,XCoord,ycoord
					
FROM            assessment_bill AS ab INNER JOIN
                         special_assessment AS sas WITH (nolock) ON sas.agency_id = ab.agency_id AND sas.year = ab.year INNER JOIN
                         special_assessment_agency AS saa WITH (nolock) ON saa.agency_id = sas.agency_id INNER JOIN
                         bill AS b WITH (nolock) ON b.bill_id = ab.bill_id INNER JOIN
                         account AS acc WITH (nolock) ON acc.acct_id = b.owner_id INNER JOIN

                         property_val ON b.prop_id = property_val.prop_id LEFT OUTER JOIN

                             (SELECT        year, agency_id, SUM(CASE WHEN (t .has_minimum_amount = 1) AND (t .minimum_amount > t .amount_chosen) THEN t .minimum_amount ELSE t .amount_chosen END) AS ex_amount
                               FROM            (SELECT        sae.year, sae.agency_id, sae.exmpt_type_cd, sae.exemption_amount_selection, sae.amount, sae.pct, sae.has_minimum_amount, sae.minimum_amount, 
                                                                                   (CASE WHEN sae.exemption_amount_selection = 'P' THEN sa.assessment_fee_amt * sae.pct ELSE (CASE WHEN sae.exemption_amount_selection IS NULL 
                                                                                   THEN 0 ELSE sae.amount END) END) AS amount_chosen
                                                         FROM            special_assessment_exemption AS sae WITH (nolock) INNER JOIN
                                                                                   special_assessment AS sa WITH (nolock) ON sa.year = sae.year AND sa.agency_id = sae.agency_id) AS t
                               GROUP BY year, agency_id) AS sae_1 ON sae_1.year = sas.year AND sae_1.agency_id = sas.agency_id
							   LEFT JOIN 
	(SELECT [Parcel_ID],ROW_NUMBER() over (partition by prop_id ORDER BY [OBJECTID] DESC) AS order_id,[Prop_ID],[Shape].STCentroid().STX as XCoord,	[Shape].STCentroid().STY as YCoord 
		FROM [Benton_spatial_data].[dbo].[PARCELSANDASSESS]) as coords
			ON b.prop_id = coords.Prop_ID AND coords.order_id = 1
			
		

	

WHERE        (ab.year = (select tax_yr from pacs_oltp.dbo.pacs_system))and prop_inactive_dt is null and [assessment_description] ='MOSQUITO'

GO


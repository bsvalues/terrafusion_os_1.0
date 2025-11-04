
create view [dbo].[special_assessments_MOSQUITO] as 

SELECT    ab.year, ab.agency_id, ab.bill_id, sas.assessment_fee_amt, saa.assessment_cd, saa.assessment_description, saa.assessment_description AS agency_name, acc.file_as_name AS tax_payer, b.prop_id, 
                         b.sup_num, b.statement_id, b.bill_type, b.code, b.last_modified, b.amount_paid, b.current_amount_due, b.effective_due_date, b.payment_status_type_cd AS bill_payment_status_type_cd, 
                         sae_1.ex_amount AS exemption_amount, b.owner_id, b.display_year, sas.has_additional_fee, sas.has_flat_additional_fee, sas.fee_type_cd, saa.assessment_type_cd, saa.start_date, saa.end_date, 
                         saa.resolution_date, saa.resolution_num, property_val.land_hstd_val+ property_val.land_non_hstd_val as LandVal, property_val.imprv_hstd_val+ property_val.imprv_non_hstd_val as ImprvVal, property_val.legal_acreage, 
                         property_val.prop_inactive_dt, property_val.property_use_cd, property_val.cycle, property_val.legal_desc, property_val.sup_num AS Expr1
						 ,XCoord,YCoord,x,y
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

(SELECT 
[Parcel_ID],
ROW_NUMBER() 
over 
(partition by prop_id 
ORDER BY [OBJECTID] DESC) 
AS order_id,
[Prop_ID],
Geometry,
[Geometry].STCentroid().STX as XCoord,
[Geometry].STCentroid().STY as YCoord ,

      [CENTROID_X] as x
      ,[CENTROID_Y] as y

FROM 

[Benton_spatial_data].[dbo].[parcel]) sp
on sp.Prop_ID=property_val.prop_id

WHERE        (ab.year = 2018)and prop_inactive_dt is null and [assessment_description] ='MOSQUITO'

GO


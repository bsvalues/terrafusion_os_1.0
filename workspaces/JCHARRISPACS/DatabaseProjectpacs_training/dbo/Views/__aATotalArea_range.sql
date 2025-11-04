create view __aATotalArea_range as
SELECT  __aaApprEst_ppsf.prop_id,
        TotalArea,
		case
WHEN	TotalArea	=	0.00					Then	 'None'
WHEN	TotalArea	>	0.01	and	TotalArea	<=	500.00	Then	 '1_to_500'
WHEN	TotalArea	>	500.00	and	TotalArea	<=	1000.00	Then	 '500_to_1000'
WHEN	TotalArea	>	1000.00	and	TotalArea	<=	1500.00	Then	 '1000_to_1500'
WHEN	TotalArea	>	1500.00	and	TotalArea	<=	2000.00	Then	 '1500_to_2000'
WHEN	TotalArea	>	2000.00	and	TotalArea	<=	3000.00	Then	 '2000_to_3000'
WHEN	TotalArea	>	3000.00	and	TotalArea	<=	4000.00	Then	 '3000_to_4000'
WHEN	TotalArea	>	4000.00				Then	 '4000<'
					else	null		end	as	GLA_range	,

				

		  
		   __AAPARCEL_.CENTROID_X, __AAPARCEL_.CENTROID_Y
        

		   from __aaApprEst_ppsf
		                       inner join    __AAPARCEL_ ON __aaApprEst_ppsf.prop_id = __AAPARCEL_.Prop_ID
GROUP BY __aaApprEst_ppsf.prop_id,  __aaApprEst_ppsf.prop_id, TotalArea,  __AAPARCEL_.CENTROID_X, __AAPARCEL_.CENTROID_Y

GO


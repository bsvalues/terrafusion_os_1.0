create view __aGain_loss_range_shp as
SELECT        __aaApprEst_ppsf.prop_id, __aaApprEst_ppsf.gain_loss, CASE WHEN gain_loss > - 1000000000 AND gain_loss <= - 100000 THEN '-100000_down' WHEN gain_loss > - 100000 AND 
                         gain_loss <= - 50000 THEN '-100000 _to_-50000' WHEN gain_loss > - 50000 AND gain_loss <= - 25000 THEN '-50000 _to_-25000' WHEN gain_loss > - 25000 AND 
                         gain_loss <= - 10000 THEN '-25000 _to_-10000' WHEN gain_loss > - 100000 AND gain_loss <= - .01 THEN '-10000 _to_-.01' WHEN gain_loss = 0 THEN '0' WHEN gain_loss > .01 AND 
                         gain_loss <= 10000 THEN '.01 _to_10000' WHEN gain_loss > 10000 AND gain_loss <= 25000 THEN '10000_To_25000' WHEN gain_loss > 25000 AND 
                         gain_loss <= 50000 THEN '25000_to_50000' WHEN gain_loss > 50000 AND gain_loss <= 75000 THEN '50000_to_75000' WHEN gain_loss > 75000 THEN '500000_up' ELSE NULL END AS gain_loss_range, 
                      
						  __AAPARCEL_.CENTROID_X, __AAPARCEL_.CENTROID_Y
FROM            __aaApprEst_ppsf INNER JOIN
                         __AAPARCEL_ ON __aaApprEst_ppsf.prop_id = __AAPARCEL_.Prop_ID
GROUP BY __aaApprEst_ppsf.prop_id, __aaApprEst_ppsf.gain_loss,  __AAPARCEL_.CENTROID_X, __AAPARCEL_.Prop_ID, __AAPARCEL_.CENTROID_Y

GO


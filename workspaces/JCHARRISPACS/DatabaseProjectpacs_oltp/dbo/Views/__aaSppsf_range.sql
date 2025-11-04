
create view __aaSppsf_range as 
SELECT prop_id,Reval, neighborhood,
        SPPSF,
        CASE
           WHEN SPPSF = 0 THEN '0'
           WHEN SPPSF > 0 AND SPPSF<= 50 THEN '0 _to_50'
           WHEN SPPSF > 50 AND SPPSF <= 80 THEN '50_To_80'
           WHEN SPPSF > 80 AND SPPSF <=120 THEN '80_to_120'
           WHEN SPPSF> 120	AND SPPSF <= 150 THEN '120_to_150'
           WHEN SPPSF > 150 AND SPPSF <= 200 THEN '150_to_200'
		   WHEN SPPSF > 200 AND SPPSF <= 300 THEN '200_to_300'
           WHEN SPPSF > 300 THEN '300_up'
		   else null end as sppsf_range

		   from __aaApprEst_ppsf

GO


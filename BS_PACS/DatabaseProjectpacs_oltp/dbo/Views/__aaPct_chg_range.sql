
create view [dbo].[__aaPct_chg_range] as 

SELECT prop_id,Reval, neighborhood,
        pct_chg,
		case
		 WHEN  pct_chg>-1000 AND pct_chg<=-50  THEN '-50_down'
		 WHEN pct_chg > -50 AND pct_chg<= .01 THEN '-50 _to_.01'
		   WHEN pct_chg = 0 THEN '0'
           WHEN pct_chg >.01 AND pct_chg<= 50 THEN '.01 _to_50'
           WHEN pct_chg > 50 AND pct_chg <= 80 THEN '50_To_80'
           WHEN pct_chg > 80 AND pct_chg <=120 THEN '80_to_120'
           WHEN pct_chg> 120	AND pct_chg <= 150 THEN '120_to_150'
		   WHEN pct_chg > 150 THEN '50_up' else null end as pct_chg_range

        

		   from __aAppraisalEst_all

		   group by prop_id, Reval, neighborhood,pct_chg

GO


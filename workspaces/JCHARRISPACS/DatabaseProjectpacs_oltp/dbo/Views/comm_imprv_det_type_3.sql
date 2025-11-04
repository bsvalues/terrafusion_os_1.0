
create view comm_imprv_det_type_3 as 
 SELECT distinct --row_number() over (partition by prop_id order by "imprv_id" ASC) as "num", 
id.prop_id,
m.Comm_basement,m.Comm_basement_unfinished,m.Comm_basement_partial_finished, m.Comm_basement_semifinished,
m.mezzanine_finished_divided, m.mezzanine_finished_open,m.mezzanine_low_cost_unfinished,m.mezzanine_semifinished, m.mezzanine_unfinished,
m.Balcony,m.deck,m.Canopy, m.Canopy_light, m.Canopy_industrial



FROM pacs_oltp.dbo.imprv_detail  id
			left join 
			( SELECT --row_number() over (partition by prop_id order by "imprv_id" ASC) as "num", 
 prop_id,
			
			CASE WHEN rtrim(imprv_det_type_cd) like 'deck%'			THEN imprv_det_area ELSE 0 END AS deck, 
				CASE WHEN rtrim(imprv_det_type_cd) like'mezzFD'		THEN imprv_det_area ELSE 0 END AS mezzanine_finished_divided,
				CASE WHEN rtrim(imprv_det_type_cd) like'mezzFO'		THEN imprv_det_area ELSE 0 END AS mezzanine_finished_open,
				CASE WHEN rtrim(imprv_det_type_cd) like'mezzLCU'	THEN imprv_det_area ELSE 0 END AS mezzanine_low_cost_unfinished,
				CASE WHEN rtrim(imprv_det_type_cd) like'mezzSF'		THEN imprv_det_area ELSE 0 END AS mezzanine_semifinished,
				CASE WHEN rtrim(imprv_det_type_cd) like'mezzUF'		THEN imprv_det_area ELSE 0 END AS mezzanine_unfinished,
				CASE WHEN rtrim(imprv_det_type_cd) like'balcony%'	THEN imprv_det_area ELSE 0 END AS Balcony, 
			    CASE WHEN rtrim(imprv_det_type_cd) like'Canopy%'	THEN imprv_det_area ELSE 0 END AS Canopy,
			    CASE WHEN rtrim(imprv_det_type_cd) like'CanopyL%'	THEN imprv_det_area ELSE 0 END AS Canopy_light,
			    CASE WHEN rtrim(imprv_det_type_cd) like'CanopyI%'	THEN imprv_det_area ELSE 0 END AS Canopy_industrial,
				CASE WHEN rtrim(imprv_det_type_cd)like'C-BSmtfin'   THEN imprv_det_area ELSE 0 END AS Comm_basement,
				CASE WHEN rtrim(imprv_det_type_cd)like'C-BSmtufin'	THEN imprv_det_area ELSE 0 END AS Comm_basement_unfinished,
				CASE WHEN rtrim(imprv_det_type_cd)like'C-BSMTFWPF'	THEN imprv_det_area ELSE 0 END AS Comm_basement_partial_finished,
				CASE WHEN rtrim(imprv_det_type_cd)like'C-BSMTSFIN'	THEN imprv_det_area ELSE 0 END AS Comm_basement_semifinished

						
						FROM pacs_oltp.dbo.imprv_detail 

						) as m
							on m.prop_id = id.prop_id

GO


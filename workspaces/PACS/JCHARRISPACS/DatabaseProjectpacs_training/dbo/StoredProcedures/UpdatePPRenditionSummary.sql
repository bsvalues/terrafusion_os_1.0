
CREATE PROCEDURE UpdatePPRenditionSummary

@input_prop_id int,
@input_prop_val_yr int,
@dataset_id bigint,
@ffe_rendered_val numeric(14,0),
@veh_rendered_val numeric(14,0)

AS

	DECLARE @pp_yr_acquired int
	DECLARE @pp_rend_column varchar(10)
 	DECLARE @pp_new_orig_cost numeric(14,0)
 	DECLARE @PPSegmentID int
	DECLARE @pp_rend_column_seg varchar(10)
	
	-- Open Cursor to temp table
	DECLARE UPDATE_REND_TOTAL CURSOR FAST_FORWARD
	FOR SELECT pp_yr_acquired, pp_rend_column, pp_new_orig_cost
	FROM ##pp_rend_entry WITH (NOLOCK)
	WHERE dataset_id = @dataset_id

	OPEN UPDATE_REND_TOTAL
	FETCH NEXT FROM UPDATE_REND_TOTAL INTO @pp_yr_acquired, @pp_rend_column, @pp_new_orig_cost
	-- @pp_rend_column is always in {FFE, OFFE, COMP, MEQT, VEH}
	
	-- New Updates on Feb 1 2006	
	-- There have been some changes requested by the clients and these are documented below

	-- OLD DESIGN
	--------------------------------------------------------------------------------------------------------
	-- The Steps taken by the stored proc can be summarised as 
	-- 1) If there are any sub-segments grouped under the current column type "@pp_rend_column"
	--    delete all of them
	-- 2.a) If a segment with type = "@pp_rend_column does not exist then 
	--      insert a new segment and get the new segment id
	-- 2.b) Or if there exists a segment but no sub-segments and user tried to modify the orig cost
	--	on this segment, delete this segment and insert a new one ( we will later add a new sub-segment  
	--	to capture the new orig cost)
	-- 3)	Insert a new sub segment use the seg id from step 2 with the new original cost and 
	--    other attributes
		
	-- Please Note that all this is assuming there is always only one segment per @pp_rend_column 
	---------------------------------------------------------------------------------------------------------	

	-- NEW DESIGN
	---------------------------------------------------------------------------------------------------------
	-- The Steps taken by the stored proc can be summarised as 
	-- 1) If there is a sub-segment that has been acquired in @pp_yr_acquired and belongs to the segment
	--    having pp_type = one of the pp_types configured under the rendering column "FFE" Or "VEH", then 
	--    delete all of these 
	--    This means essentially we would be touching only those sub-segments that belong to segments that have
	--    one of these types
	-- 2) There will be two execution flows in this stored procedure:
	-- 2.a) FFE,OFFE,COMP,MEQT types - all will be treated as FFE
	-- 2.b) VEH will be treated as it is 
	----------------------------------------------------------------------------------------------------------

	WHILE @@FETCH_STATUS = 0
	BEGIN	
	
		DECLARE @SubSegExists bit
		SET @SubSegExists = 0
	
		DECLARE @newPPSubSegmentID int	
		-- There are two execution flows
		-- FLOW 1 : VEH types - Treated as it is 
		-- FLOW 1 : FFE,OFFE,COMP,MEQT types - all will be treated as FFE
		
		IF @pp_rend_column = 'VEH'
		   SET @pp_rend_column_seg = 'VEH'
		ELSE 
		   SET @pp_rend_column_seg = 'FFE'				

		
		IF @pp_rend_column <> 'VEH'
		BEGIN

				-- If the year acquired is 15 years earlier then delete everything beyond
				-- 15 years

			IF (@input_prop_val_yr-@pp_yr_acquired) <> 15
			BEGIN
				-- STEP 1
				IF EXISTS  -- step 1
				(
				  -- If there are any sub-segments with type = @pp_rend_column
				  SELECT * 
			          FROM 
					pers_prop_sub_seg AS ppss
					INNER JOIN 
					pers_prop_rendition_config AS pprc
						ON pprc.pp_rend_column = @pp_rend_column
						AND pprc.pp_type_cd = ppss.pp_type_cd
						AND ppss.pp_yr_aquired = @pp_yr_acquired
					INNER JOIN 
					pers_prop_seg pps
						INNER JOIN 
						prop_supp_assoc AS psa
							ON pps.prop_id = @input_prop_id
								AND pps.prop_val_yr = @input_prop_val_yr
								AND pps.prop_id = psa.prop_id
								AND pps.sup_num = psa.sup_num
								AND pps.prop_val_yr = psa.owner_tax_yr
								AND pps.sale_id IS NOT NULL
								AND pps.pp_active_flag = 'T'
								AND pps.pp_type_cd = 'FFE'
						ON ppss.prop_id = pps.prop_id
							AND ppss.sup_num = pps.sup_num 
							AND ppss.prop_val_yr = pps.prop_val_yr
							AND ppss.pp_seg_id = pps.pp_seg_id						
					--INNER JOIN 
					--pers_prop_rendition_config AS pprc2
					--	ON pprc2.pp_rend_column = @pp_rend_column_seg
					--		AND pps.pp_type_cd = pprc2.pp_type_cd		
				)
				BEGIN
					SET @SubSegExists = 1
					DELETE 
					FROM 
						pers_prop_sub_seg
					FROM 
						pers_prop_sub_seg AS ppss
						INNER JOIN 
						pers_prop_rendition_config AS pprc
							ON pprc.pp_rend_column = @pp_rend_column
								AND pprc.pp_type_cd = ppss.pp_type_cd
								AND ppss.pp_yr_aquired = @pp_yr_acquired
						INNER JOIN 
						pers_prop_seg pps
							INNER JOIN 
							prop_supp_assoc AS psa
								ON pps.prop_id = @input_prop_id
									AND pps.prop_val_yr = @input_prop_val_yr
									AND pps.prop_id = psa.prop_id
									AND pps.sup_num = psa.sup_num
									AND pps.prop_val_yr = psa.owner_tax_yr
									AND pps.sale_id IS NOT NULL
									AND pps.pp_active_flag = 'T'
									AND pps.pp_type_cd = 'FFE'
							ON ppss.prop_id = pps.prop_id
								AND ppss.sup_num = pps.sup_num 
								AND ppss.prop_val_yr = pps.prop_val_yr
								AND ppss.pp_seg_id = pps.pp_seg_id
						--INNER JOIN 
						--pers_prop_rendition_config AS pprc2
						--	ON pprc2.pp_rend_column = @pp_rend_column_seg
						--		AND pps.pp_type_cd = pprc2.pp_type_cd		
						
				END -- end of step 1
			END -- end of if (15 years or more)

			ELSE
			BEGIN
				-- STEP 1
				IF EXISTS  -- step 1
				(
				  -- If there are any sub-segments with type = @pp_rend_column
				  SELECT * 
			          FROM 
					pers_prop_sub_seg AS ppss
					INNER JOIN 
					pers_prop_rendition_config AS pprc
						ON pprc.pp_rend_column = @pp_rend_column
						AND pprc.pp_type_cd = ppss.pp_type_cd
						AND ppss.pp_yr_aquired <= @pp_yr_acquired
					INNER JOIN 
					pers_prop_seg pps
						INNER JOIN 
						prop_supp_assoc AS psa
							ON pps.prop_id = @input_prop_id
								AND pps.prop_val_yr = @input_prop_val_yr
								AND pps.prop_id = psa.prop_id
								AND pps.sup_num = psa.sup_num
								AND pps.prop_val_yr = psa.owner_tax_yr
								AND pps.sale_id IS NOT NULL
								AND pps.pp_active_flag = 'T'
								AND pps.pp_type_cd = 'FFE'
						ON ppss.prop_id = pps.prop_id
							AND ppss.sup_num = pps.sup_num 
							AND ppss.prop_val_yr = pps.prop_val_yr
							AND ppss.pp_seg_id = pps.pp_seg_id						
					--INNER JOIN 
					--pers_prop_rendition_config AS pprc2
					--	ON pprc2.pp_rend_column = @pp_rend_column_seg
					--		AND pps.pp_type_cd = pprc2.pp_type_cd		
				)
				BEGIN
					SET @SubSegExists = 1
					DELETE 
					FROM 
						pers_prop_sub_seg
					FROM 
						pers_prop_sub_seg AS ppss
						INNER JOIN 
						pers_prop_rendition_config AS pprc
							ON pprc.pp_rend_column = @pp_rend_column
								AND pprc.pp_type_cd = ppss.pp_type_cd
								AND ppss.pp_yr_aquired <= @pp_yr_acquired
						INNER JOIN 
						pers_prop_seg pps
							INNER JOIN 
							prop_supp_assoc AS psa
								ON pps.prop_id = @input_prop_id
									AND pps.prop_val_yr = @input_prop_val_yr
									AND pps.prop_id = psa.prop_id
									AND pps.sup_num = psa.sup_num
									AND pps.prop_val_yr = psa.owner_tax_yr
									AND pps.sale_id IS NOT NULL
									AND pps.pp_active_flag = 'T'
									AND pps.pp_type_cd = 'FFE'
							ON ppss.prop_id = pps.prop_id
								AND ppss.sup_num = pps.sup_num 
								AND ppss.prop_val_yr = pps.prop_val_yr
								AND ppss.pp_seg_id = pps.pp_seg_id
						--INNER JOIN 
						--pers_prop_rendition_config AS pprc2
						--	ON pprc2.pp_rend_column = @pp_rend_column_seg
						--		AND pps.pp_type_cd = pprc2.pp_type_cd		
						
				END -- end of step 1
			 END
			
				-- Step 2
				SELECT 
				@PPSegmentID = pp_seg_id
				FROM 
					pers_prop_seg AS pps
					INNER JOIN 
					prop_supp_assoc AS psa
						ON pps.prop_id = @input_prop_id
							AND pps.prop_val_yr = @input_prop_val_yr
							AND pps.prop_id = psa.prop_id
							AND pps.sup_num = psa.sup_num
							AND pps.prop_val_yr = psa.owner_tax_yr
							AND pps.pp_active_flag = 'T'
							AND pps.sale_id IS NOT NULL
							AND pps.pp_type_cd = 'FFE'
					--INNER JOIN 
					--pers_prop_rendition_config AS pprc
					--	ON pprc.pp_rend_column = @pp_rend_column_seg
					--		AND pprc.pp_type_cd = pps.pp_type_cd
					 
				-- Step 2.a
				--IF @PPSegmentID IS NULL OR @SubSegExists = 0
				IF @PPSegmentID IS NULL
				BEGIN
					exec dbo.GetUniqueID 'pers_prop_seg', @PPSegmentID output, 1, 0

					-- Insert a new segment 
					INSERT INTO
						pers_prop_seg	
					(
						prop_id,
						prop_val_yr,
						sup_num,
						pp_seg_id,
						sale_id,
						pp_type_cd,
						pp_unit_count,
						pp_yr_aquired,
						pp_state_cd,
						pp_sic_cd,
						pp_deprec_type_cd,
						pp_deprec_deprec_cd,
						pp_active_flag,
						pp_description,
						pp_appraise_meth
					)
					SELECT 
						@input_prop_id,
						@input_prop_val_yr,
						psa.sup_num,
						@PPSegmentID,
						0,
						-- pprc.default_pp_type_cd,
						'FFE',
						1.0000,
						@pp_yr_acquired,
						'L1',
						p.prop_sic_cd,
						CASE 
							WHEN dm.dep_type_cd IS NOT NULL THEN dm.dep_type_cd
							WHEN dm2.dep_type_cd IS NOT NULL THEN dm2.dep_type_cd
							ELSE NULL
						END,
						CASE 
							WHEN dm.dep_deprec_cd IS NOT NULL THEN dm.dep_deprec_cd
							WHEN dm2.dep_deprec_cd IS NOT NULL THEN dm2.dep_deprec_cd
							ELSE NULL
						END,
						'T',
						pt.pp_type_desc,
						'SUB'
					FROM 
						property_val AS pv
						INNER JOIN 
						prop_supp_assoc AS psa
							ON pv.prop_id = @input_prop_id
							AND pv.prop_val_yr = @input_prop_val_yr
							AND pv.prop_id = psa.prop_id
							AND pv.sup_num = psa.sup_num
							AND pv.prop_val_yr = psa.owner_tax_yr
						INNER JOIN 
						property AS p
							ON p.prop_id = pv.prop_id
						INNER JOIN pp_type as pt
							ON pt.pp_type_cd =  'FFE'
					--	INNER JOIN 
					--	pers_prop_rendition_columns AS pprc
					--		ON pprc.pp_rend_column = @pp_rend_column_seg	
						LEFT OUTER JOIN
							pp_depreciation_method_maintenance AS dm
								ON dm.pp_type_cd = 'FFE'
								AND dm.prop_val_yr = @input_prop_val_yr
								AND (dm.sic_cd = p.prop_sic_cd)
						LEFT OUTER JOIN
							pp_depreciation_method_maintenance AS dm2
								ON dm2.pp_type_cd = 'FFE'
								AND dm2.prop_val_yr = @input_prop_val_yr
								AND (dm2.sic_cd = '*')
		
					--END -- -- Step 2.b		
		
					END  -- Step 2.a
					-- STEP 3
					
					IF @pp_new_orig_cost > 0 
					BEGIN
						exec dbo.GetUniqueID 'pers_prop_sub_seg', @newPPSubSegmentID output, 1, 0

			 			INSERT 
						INTO 
							pers_prop_sub_seg 
						(
							prop_id,
							prop_val_yr, 
							sup_num, 
							pp_seg_id, 
							pp_sub_seg_id, 
							pp_type_cd,
							pp_yr_aquired, 
							pp_orig_cost, 
							descrip,
							calc_method_flag,
							pp_dep_type_cd,
							pp_dep_deprec_cd
						)
						SELECT 
							pps.prop_id, 
							pps.prop_val_yr, 
							psa.sup_num, 
							pps.pp_seg_id,				
							@newPPSubSegmentID, 
							pprc.default_pp_type_cd, 
							@pp_yr_acquired, 
							@pp_new_orig_cost,
							pt.pp_type_desc,
							'C',
							CASE 
								WHEN dm.dep_type_cd IS NOT NULL THEN dm.dep_type_cd
								WHEN dm2.dep_type_cd IS NOT NULL THEN dm2.dep_type_cd
								ELSE NULL
							END,
							CASE 
								WHEN dm.dep_deprec_cd IS NOT NULL THEN dm.dep_deprec_cd
								WHEN dm2.dep_deprec_cd IS NOT NULL THEN dm2.dep_deprec_cd
								ELSE NULL
							END
							
						FROM
							pers_prop_seg AS pps
							INNER JOIN 
							prop_supp_assoc AS psa
								ON pps.prop_id = @input_prop_id
								AND pps.prop_val_yr = @input_prop_val_yr
								AND pps.prop_id = psa.prop_id
								AND pps.sup_num = psa.sup_num
								AND pps.prop_val_yr = psa.owner_tax_yr
								AND pps.pp_seg_id = @PPSegmentID
								AND pps.pp_active_flag = 'T'
								AND pps.sale_id IS NOT NULL
							INNER JOIN 
							pers_prop_rendition_columns AS pprc
								ON pprc.pp_rend_column = @pp_rend_column	
							INNER JOIN pp_type as pt
								ON pt.pp_type_cd = pprc.default_pp_type_cd
							LEFT OUTER JOIN
							pp_depreciation_method_maintenance AS dm
								ON dm.pp_type_cd = pprc.default_pp_type_cd
								AND dm.prop_val_yr = @input_prop_val_yr
								AND (dm.sic_cd = pps.pp_sic_cd)
							LEFT OUTER JOIN
							pp_depreciation_method_maintenance AS dm2
								ON dm2.pp_type_cd = pprc.default_pp_type_cd
								AND dm2.prop_val_yr = @input_prop_val_yr
								AND (dm2.sic_cd = '*')
					 END		
					 -- end step 3
		END -- end of if rendering column is {FFE, OFFE, COMP, MEQT}
					
		ELSE -- it is VEH 
		BEGIN
			IF (@input_prop_val_yr-@pp_yr_acquired) <> 15
			BEGIN
				-- STEP 1
				IF EXISTS  -- step 1
				(
				  -- If there are any sub-segments with type = @pp_rend_column
				  SELECT * 
			          FROM 
					pers_prop_sub_seg AS ppss
					INNER JOIN 
					pers_prop_rendition_config AS pprc
						ON pprc.pp_rend_column = @pp_rend_column
						AND pprc.pp_type_cd = ppss.pp_type_cd
						AND ppss.pp_yr_aquired = @pp_yr_acquired
					INNER JOIN 
					pers_prop_seg pps
						INNER JOIN 
						prop_supp_assoc AS psa
							ON pps.prop_id = @input_prop_id
								AND pps.prop_val_yr = @input_prop_val_yr
								AND pps.prop_id = psa.prop_id
								AND pps.sup_num = psa.sup_num
								AND pps.prop_val_yr = psa.owner_tax_yr
								AND pps.sale_id IS NOT NULL
								AND pps.pp_active_flag = 'T'
								AND pps.pp_type_cd = 'VEH'
						ON ppss.prop_id = pps.prop_id
							AND ppss.sup_num = pps.sup_num 
							AND ppss.prop_val_yr = pps.prop_val_yr
							AND ppss.pp_seg_id = pps.pp_seg_id						
					--INNER JOIN 
					--pers_prop_rendition_config AS pprc2
					--	ON pprc2.pp_rend_column = @pp_rend_column_seg
					--		AND pps.pp_type_cd = pprc2.pp_type_cd		
				)
				BEGIN
					SET @SubSegExists = 1
					DELETE 
					FROM 
						pers_prop_sub_seg
					FROM 
						pers_prop_sub_seg AS ppss
						INNER JOIN 
						pers_prop_rendition_config AS pprc
							ON pprc.pp_rend_column = @pp_rend_column
								AND pprc.pp_type_cd = ppss.pp_type_cd
								AND ppss.pp_yr_aquired = @pp_yr_acquired
						INNER JOIN 
						pers_prop_seg pps
							INNER JOIN 
							prop_supp_assoc AS psa
								ON pps.prop_id = @input_prop_id
									AND pps.prop_val_yr = @input_prop_val_yr
									AND pps.prop_id = psa.prop_id
									AND pps.sup_num = psa.sup_num
									AND pps.prop_val_yr = psa.owner_tax_yr
									AND pps.sale_id IS NOT NULL
									AND pps.pp_active_flag = 'T'
									AND pps.pp_type_cd = 'VEH'
							ON ppss.prop_id = pps.prop_id
								AND ppss.sup_num = pps.sup_num 
								AND ppss.prop_val_yr = pps.prop_val_yr
								AND ppss.pp_seg_id = pps.pp_seg_id
						--INNER JOIN 
						--pers_prop_rendition_config AS pprc2
						--	ON pprc2.pp_rend_column = @pp_rend_column_seg
						--		AND pps.pp_type_cd = pprc2.pp_type_cd		
						
				END -- end of step 1
			END
			ELSE
			BEGIN
				IF EXISTS  -- step 1
				(
				  -- If there are any sub-segments with type = @pp_rend_column
				  SELECT * 
			          FROM 
					pers_prop_sub_seg AS ppss
					INNER JOIN 
					pers_prop_rendition_config AS pprc
						ON pprc.pp_rend_column = @pp_rend_column
						AND pprc.pp_type_cd = ppss.pp_type_cd
						AND ppss.pp_yr_aquired <= @pp_yr_acquired
					INNER JOIN 
					pers_prop_seg pps
						INNER JOIN 
						prop_supp_assoc AS psa
							ON pps.prop_id = @input_prop_id
								AND pps.prop_val_yr = @input_prop_val_yr
								AND pps.prop_id = psa.prop_id
								AND pps.sup_num = psa.sup_num
								AND pps.prop_val_yr = psa.owner_tax_yr
								AND pps.sale_id IS NOT NULL
								AND pps.pp_active_flag = 'T'
								AND pps.pp_type_cd = 'VEH'
						ON ppss.prop_id = pps.prop_id
							AND ppss.sup_num = pps.sup_num 
							AND ppss.prop_val_yr = pps.prop_val_yr
							AND ppss.pp_seg_id = pps.pp_seg_id						
					--INNER JOIN 
					--pers_prop_rendition_config AS pprc2
					--	ON pprc2.pp_rend_column = @pp_rend_column_seg
					--		AND pps.pp_type_cd = pprc2.pp_type_cd		
				)
				BEGIN
					SET @SubSegExists = 1
					DELETE 
					FROM 
						pers_prop_sub_seg
					FROM 
						pers_prop_sub_seg AS ppss
						INNER JOIN 
						pers_prop_rendition_config AS pprc
							ON pprc.pp_rend_column = @pp_rend_column
								AND pprc.pp_type_cd = ppss.pp_type_cd
								AND ppss.pp_yr_aquired <= @pp_yr_acquired
						INNER JOIN 
						pers_prop_seg pps
							INNER JOIN 
							prop_supp_assoc AS psa
								ON pps.prop_id = @input_prop_id
									AND pps.prop_val_yr = @input_prop_val_yr
									AND pps.prop_id = psa.prop_id
									AND pps.sup_num = psa.sup_num
									AND pps.prop_val_yr = psa.owner_tax_yr
									AND pps.sale_id IS NOT NULL
									AND pps.pp_active_flag = 'T'
									AND pps.pp_type_cd = 'VEH'
							ON ppss.prop_id = pps.prop_id
								AND ppss.sup_num = pps.sup_num 
								AND ppss.prop_val_yr = pps.prop_val_yr
								AND ppss.pp_seg_id = pps.pp_seg_id
						--INNER JOIN 
						--pers_prop_rendition_config AS pprc2
						--	ON pprc2.pp_rend_column = @pp_rend_column_seg
						--		AND pps.pp_type_cd = pprc2.pp_type_cd		
						
				END -- end of step 1
			END
			
				-- Step 2
				SELECT 
				@PPSegmentID = pp_seg_id
				FROM 
					pers_prop_seg AS pps
					INNER JOIN 
					prop_supp_assoc AS psa
						ON pps.prop_id = @input_prop_id
							AND pps.prop_val_yr = @input_prop_val_yr
							AND pps.prop_id = psa.prop_id
							AND pps.sup_num = psa.sup_num
							AND pps.prop_val_yr = psa.owner_tax_yr
							AND pps.pp_active_flag = 'T'
							AND pps.sale_id IS NOT NULL
							AND pps.pp_type_cd = 'VEH'
					--INNER JOIN 
					--pers_prop_rendition_config AS pprc
					--	ON pprc.pp_rend_column = @pp_rend_column_seg
					--		AND pprc.pp_type_cd = pps.pp_type_cd
					 
				
				-- Step 2.a
				--IF @PPSegmentID IS NULL OR @SubSegExists = 0
				IF @PPSegmentID IS NULL
				BEGIN
					exec dbo.GetUniqueID 'pers_prop_seg', @PPSegmentID output, 1, 0
									
					-- Insert a new segment 
					INSERT INTO
						pers_prop_seg	
					(
						prop_id,
						prop_val_yr,
						sup_num,
						pp_seg_id,
						sale_id,
						pp_type_cd,
						pp_unit_count,
						pp_yr_aquired,
						pp_state_cd,
						pp_sic_cd,
						pp_deprec_type_cd,
						pp_deprec_deprec_cd,
						pp_active_flag,
						pp_description,
						pp_appraise_meth
					)
					SELECT 
						@input_prop_id,
						@input_prop_val_yr,
						psa.sup_num,
						@PPSegmentID,
						0,
						-- pprc.default_pp_type_cd,
						'VEH',
						1.0000,
						@pp_yr_acquired,
						'L1',
						p.prop_sic_cd,
						CASE 
							WHEN dm.dep_type_cd IS NOT NULL THEN dm.dep_type_cd
							WHEN dm2.dep_type_cd IS NOT NULL THEN dm2.dep_type_cd
							ELSE NULL
						END,
						CASE 
							WHEN dm.dep_deprec_cd IS NOT NULL THEN dm.dep_deprec_cd
							WHEN dm2.dep_deprec_cd IS NOT NULL THEN dm2.dep_deprec_cd
							ELSE NULL
						END,
						'T',
						pt.pp_type_desc,
						'SUB'
					FROM 
						property_val AS pv
						INNER JOIN 
						prop_supp_assoc AS psa
							ON pv.prop_id = @input_prop_id
							AND pv.prop_val_yr = @input_prop_val_yr
							AND pv.prop_id = psa.prop_id
							AND pv.sup_num = psa.sup_num
							AND pv.prop_val_yr = psa.owner_tax_yr
						INNER JOIN 
						property AS p
							ON p.prop_id = pv.prop_id
						INNER JOIN pp_type as pt
							ON pt.pp_type_cd =  'VEH'
					--	INNER JOIN 
					--	pers_prop_rendition_columns AS pprc
					--		ON pprc.pp_rend_column = @pp_rend_column_seg	
						LEFT OUTER JOIN
							pp_depreciation_method_maintenance AS dm
								ON dm.pp_type_cd = 'VEH'
								AND dm.prop_val_yr = @input_prop_val_yr
								AND (dm.sic_cd = p.prop_sic_cd)
						LEFT OUTER JOIN
							pp_depreciation_method_maintenance AS dm2
								ON dm2.pp_type_cd = 'VEH'
								AND dm2.prop_val_yr = @input_prop_val_yr
								AND (dm2.sic_cd = '*')
		
					--END -- -- Step 2.b		
		
					END  -- Step 2.a
								
					-- STEP 3
					IF @pp_new_orig_cost > 0 
					BEGIN
						exec dbo.GetUniqueID 'pers_prop_sub_seg', @newPPSubSegmentID output, 1, 0
							
						INSERT 
						INTO 
							pers_prop_sub_seg 
						(
							prop_id,
							prop_val_yr, 
							sup_num, 
							pp_seg_id, 
							pp_sub_seg_id, 
							pp_type_cd,
							pp_yr_aquired, 
							pp_orig_cost, 
							descrip,
							calc_method_flag,
							pp_dep_type_cd,
							pp_dep_deprec_cd
						)
						SELECT 
							pps.prop_id, 
							pps.prop_val_yr, 
							psa.sup_num, 
							pps.pp_seg_id,				
							@newPPSubSegmentID, 
							pprc.default_pp_type_cd, 
							@pp_yr_acquired, 
							@pp_new_orig_cost,
							pt.pp_type_desc,
							'C',
							CASE 
							WHEN dm.dep_type_cd IS NOT NULL THEN dm.dep_type_cd
							WHEN dm2.dep_type_cd IS NOT NULL THEN dm2.dep_type_cd
							ELSE NULL
							END,
							CASE 
								WHEN dm.dep_deprec_cd IS NOT NULL THEN dm.dep_deprec_cd
								WHEN dm2.dep_deprec_cd IS NOT NULL THEN dm2.dep_deprec_cd
								ELSE NULL
							END
						FROM
							pers_prop_seg AS pps
							INNER JOIN 
							prop_supp_assoc AS psa
								ON pps.prop_id = @input_prop_id
								AND pps.prop_val_yr = @input_prop_val_yr
								AND pps.prop_id = psa.prop_id
								AND pps.sup_num = psa.sup_num
								AND pps.prop_val_yr = psa.owner_tax_yr
								AND pps.pp_seg_id = @PPSegmentID
								AND pps.pp_active_flag = 'T'
								AND pps.sale_id IS NOT NULL
							INNER JOIN 
							pers_prop_rendition_columns AS pprc
								ON pprc.pp_rend_column = @pp_rend_column	
							INNER JOIN pp_type as pt
								ON pt.pp_type_cd = pprc.default_pp_type_cd
							LEFT OUTER JOIN
							pp_depreciation_method_maintenance AS dm
								ON dm.pp_type_cd = pprc.default_pp_type_cd
								AND dm.prop_val_yr = @input_prop_val_yr
								AND (dm.sic_cd = pps.pp_sic_cd)
							LEFT OUTER JOIN
							pp_depreciation_method_maintenance AS dm2
								ON dm2.pp_type_cd = pprc.default_pp_type_cd
								AND dm2.prop_val_yr = @input_prop_val_yr
								AND (dm2.sic_cd = '*')
					 END 	
					 -- end step 3
		END -- end of else rendering column is {VEH}		
		SET @PPSegmentID = NULL							
		FETCH NEXT FROM UPDATE_REND_TOTAL INTO @pp_yr_acquired, @pp_rend_column, @pp_new_orig_cost

	END -- end of fetch

	CLOSE UPDATE_REND_TOTAL
	DEALLOCATE UPDATE_REND_TOTAL	

	
		
	-- Step 4 :Update GFE Totals 
	-- a) Insert pp_rend_column (FFE & VEH) and their rendered values (input parameters) into the temp table	
	-- b) If a segment of type pp_rend_column does not exist insert it with the pp_rendered_val
	-- c) else (in case found) just update the pp_renderd_val of the segment
  
	 -- Step 4.a:
	IF object_id('tempdb..#GFE_Totals') is not null
	begin
		drop table #GFE_Totals
	end
	
	CREATE TABLE #GFE_Totals 
	(
	 pp_rend_column varchar(10),
	 pp_rendered_val numeric(14,0)			
	)
	
	--IF @ffe_rendered_val <> 0
	INSERT INTO #GFE_Totals (pp_rend_column, pp_rendered_val) Values ('FFE', @ffe_rendered_val)

	--IF @veh_rendered_val <> 0
	INSERT INTO #GFE_Totals (pp_rend_column, pp_rendered_val) Values ('VEH', @veh_rendered_val)

	-- Open Cursor to temp table
	DECLARE GFE_TOTAL CURSOR FAST_FORWARD
	FOR SELECT pp_rend_column, pp_rendered_val 
	FROM #GFE_Totals

	DECLARE @pp_rendered_val numeric(14,0)

	OPEN GFE_TOTAL
	FETCH NEXT FROM GFE_TOTAL INTO @pp_rend_column, @pp_rendered_val

	WHILE @@FETCH_STATUS = 0
	BEGIN
		-- step 4.b 
		SET @PPSegmentID = NULL

		--DECLARE @GFESegmentID int		
		SELECT 
			@PPSegmentID = pp_seg_id
			FROM 
			pers_prop_seg AS pps
			--INNER JOIN 
			--pers_prop_rendition_config AS pprc
			--	ON pprc.pp_rend_column = @pp_rend_column
			--		AND pprc.pp_type_cd = pps.pp_type_cd
			INNER JOIN prop_supp_assoc AS psa
				ON pps.prop_id = @input_prop_id
					AND pps.prop_val_yr = @input_prop_val_yr
					AND pps.prop_id = psa.prop_id
					AND pps.sup_num = psa.sup_num
					AND pps.prop_val_yr = psa.owner_tax_yr
					AND pps.pp_active_flag = 'T'
					AND pps.sale_id IS NOT NULL 
					AND pps.pp_type_cd = @pp_rend_column
		

		IF @PPSegmentID IS NOT NULL
		BEGIN
		  UPDATE pers_prop_seg
		  SET pp_rendered_val = @pp_rendered_val
		  FROM 
			pers_prop_seg AS pps
			INNER JOIN 
			prop_supp_assoc AS psa
			ON pps.prop_id = @input_prop_id
			AND pps.prop_val_yr = @input_prop_val_yr
			AND pps.prop_id = psa.prop_id
			AND pps.sup_num = psa.sup_num
			AND pps.prop_val_yr = psa.owner_tax_yr
			AND pps.pp_seg_id = @PPSegmentID
			AND pps.pp_active_flag = 'T'
			AND pps.sale_id IS NOT NULL

		END
		ELSE 
			IF @pp_rendered_val <> 0
			BEGIN
			-- Insert a new segment
			
			exec dbo.GetUniqueID 'pers_prop_seg', @PPSegmentID output, 1, 0
 
	
			INSERT INTO
				pers_prop_seg	
				(
					prop_id,
					prop_val_yr,
					sup_num,
					pp_seg_id,
					sale_id,
					pp_type_cd,
					pp_unit_count,
					pp_state_cd,
					pp_sic_cd,
					pp_deprec_type_cd,
					pp_deprec_deprec_cd,
					pp_active_flag,
					pp_rendered_val,
					pp_description,
					pp_appraise_meth
				)
				SELECT 
				@input_prop_id,
				@input_prop_val_yr,
				psa.sup_num,
				@PPSegmentID,
				0,
			--	pprc.default_pp_type_cd,
				 @pp_rend_column,
				1.0000,
				'L1',
				p.prop_sic_cd,
				CASE 
					WHEN dm.dep_type_cd IS NOT NULL THEN dm.dep_type_cd
					WHEN dm2.dep_type_cd IS NOT NULL THEN dm2.dep_type_cd
					ELSE NULL
				END,
				CASE 
					WHEN dm.dep_deprec_cd IS NOT NULL THEN dm.dep_deprec_cd
					WHEN dm2.dep_deprec_cd IS NOT NULL THEN dm2.dep_deprec_cd
					ELSE NULL
				END,
				'T',
				@pp_rendered_val,
				pt.pp_type_desc,
				'R'
				
				FROM 
				property_val AS pv
				INNER JOIN 
				prop_supp_assoc AS psa
					ON pv.prop_id = @input_prop_id
						AND pv.prop_val_yr = @input_prop_val_yr
						AND pv.prop_id = psa.prop_id
						AND pv.sup_num = psa.sup_num
						AND pv.prop_val_yr = psa.owner_tax_yr
				INNER JOIN 
				property AS p
					ON p.prop_id = pv.prop_id
				INNER JOIN pp_type as pt
					ON pt.pp_type_cd = @pp_rend_column
			--	INNER JOIN 
			--	pers_prop_rendition_columns AS pprc
			--		ON pprc.pp_rend_column = @pp_rend_column	
				LEFT OUTER JOIN
							pp_depreciation_method_maintenance AS dm
								ON dm.pp_type_cd = @pp_rend_column
								AND dm.prop_val_yr = @input_prop_val_yr
								AND (dm.sic_cd = p.prop_sic_cd)
							LEFT OUTER JOIN
							pp_depreciation_method_maintenance AS dm2
								ON dm2.pp_type_cd = @pp_rend_column
								AND dm2.prop_val_yr = @input_prop_val_yr
								AND (dm2.sic_cd = '*')

			END -- end of if rendered_val<> 0
	
 	
	 	
		FETCH NEXT FROM GFE_TOTAL INTO @pp_rend_column, @pp_rendered_val
	END -- end of while (step 4)

	CLOSE GFE_TOTAL
	DEALLOCATE GFE_TOTAL

GO


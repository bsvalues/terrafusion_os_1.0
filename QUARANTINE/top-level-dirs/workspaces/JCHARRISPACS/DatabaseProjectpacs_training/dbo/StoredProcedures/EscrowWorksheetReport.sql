

CREATE procedure [dbo].[EscrowWorksheetReport]
	@dataset_id int,
	@user varchar(30),
	@escrow_id int
as
BEGIN
		INSERT INTO escrow_worksheet_print_history
				(history_id,
				 escrow_id,
				 address,
				 prop_id,
				 escrow_type_desc,
				 comment,
				 preparer_name,
				 calculation_date,
				 advance_year,
				 tax_area_number,
				 levy_assessed_value,
				 levy_rate,
				 levy_advance_taxes,
				 sa_advance_taxes,
				 advance_taxes_due,
				 advance_taxes_override,
				 additional_fee_desc,
				 additional_fee_amount,
				 creation_date)

		SELECT 
				@dataset_id,
				ew.escrow_id,
				(
					acct.file_as_name + CHAR(13) + 
					(case when LEN(ISNULL(a.addr_line1,'')) > 0 then ISNULL(a.addr_line1,'') + CHAR(13)
					else '' end ) +
					( case when LEN(ISNULL(a.addr_line2,'')) > 0 then ISNULL(a.addr_line2,'') + CHAR(13) 
					else '' end ) +
					( case when LEN(ISNULL(a.addr_line3,'')) > 0 then ISNULL(a.addr_line3,'') + CHAR(13)
					else '' end ) +
					( case when LEN(ISNULL(a.addr_city,'')) > 0 then ISNULL(a.addr_city,'') 
					else '' end ) +
					( case when LEN(ISNULL(a.addr_state,'')) > 0 then ', ' + ISNULL(a.addr_state,'') 
					else '' end ) +
					( case when LEN(ISNULL(a.addr_zip,'')) > 0 then ' ' + ISNULL(a.addr_zip,'') 
					else '' end ) +
					( case when a.is_international = 1 then CHAR(13) + c.country_name
					else '' end )
				 )as address,
				ew.prop_id, 
				ewt.escrow_type_desc,	
				ew.comment, 
				@user, 
				ewcalc.posting_date,
				ew.year +1,
				ta.tax_area_number,
				ewcalc.levy_assessed_value,
				ewcalc.levy_rate,
				isnull(ewcalc.levy_advance_taxes,0),
				isnull(ewcalc.sa_advance_taxes,0),
				ISNULL(ewcalc.advance_taxes_due,ew.amount_due),
				isnull(ewcalc.advance_taxes_override,0),
				ft.fee_type_desc,
				isnull(ewcalc.additional_fee_amt,0),
				ew.date_created
				
			FROM escrow ew with (nolock)

			join account acct (nolock) on ew.owner_id = acct.acct_id
			
			LEFT JOIN escrow_type ewt with (nolock)
			ON ewt.escrow_type_cd = ew.escrow_type_cd and ewt.year = ew.year

			LEFT JOIN escrow_calculation ewcalc with (nolock)
			ON ewcalc.escrow_id = ew.escrow_id

			LEFT OUTER JOIN address a with (nolock)
			ON a.acct_id = ew.owner_id 
			AND  a.primary_addr = 'Y'
				
			LEFT OUTER JOIN country c with (nolock)
			ON c.country_cd = a.country_cd
			
			LEFT JOIN prop_supp_assoc psa with (nolock)
			ON psa.prop_id = ew.prop_id AND psa.owner_tax_yr = ew.year
			
			LEFT JOIN property_tax_area pta with (nolock)
			ON pta.prop_id = ew.prop_id AND pta.year = ew.year AND pta.sup_num = psa.sup_num
				
			LEFT JOIN tax_area ta with (nolock)
			ON ta.tax_area_id = pta.tax_area_id
			
			LEFT JOIN fee f with (nolock)
			ON f.fee_id = ewcalc.additional_fee_id AND ew.year = f.year
				
			LEFT JOIN fee_type ft with (nolock)
			ON ft.fee_type_cd = f.fee_type_cd

			WHERE ew.escrow_id = @escrow_id


			INSERT INTO escrow_worksheet_amounts_due_print_history
				(history_id,tax_year,levy_amount,sa_amount,fee_amount, total)

			SELECT 
				@dataset_id,
				ead.year+1,
				ead.levy_amount,
				ead.sa_amount,
				ead.fee_amount,
				ead.levy_amount + ead.sa_amount + ead.fee_amount
			FROM escrow_amounts_due ead with (nolock)
			WHERE ead.escrow_id = @escrow_id

			--Insert EscrowWorksheet event on each property processed
			declare @next_event_id	int
			exec dbo.GetUniqueID 'event', @next_event_id output, 1, 0
	
			INSERT INTO event
				(event_id,system_type,event_type,event_date,pacs_user,event_desc,ref_year,
				ref_id1,pacs_user_id)
			SELECT
				@next_event_id,
				'C',
				'EscrowWorksheet',
				GETDATE(),	
				@user,
				'Printed a worksheet for escrow ID : '+ cast(@escrow_id as char),
				ewph.advance_year,
				ewph.history_id,
				p.pacs_user_id
			FROM escrow_worksheet_print_history ewph
			LEFT JOIN pacs_user p
			ON p.pacs_user_name = @user
			WHERE ewph.history_id = @dataset_id

			insert into prop_event_assoc(prop_id,event_id)
			SELECT 	ewph.prop_id,@next_event_id
			FROM escrow_worksheet_print_history ewph
			WHERE ewph.history_id = @dataset_id

END

GO


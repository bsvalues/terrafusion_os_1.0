

CREATE procedure [dbo].[EscrowPlatLetterReport]
	@dataset_id int,
	@user varchar(30),
	@escrow_id int
as
BEGIN
		INSERT INTO escrow_plat_letter_print_history
				(history_id,escrow_id,prop_id,year,amount_due,legal_desc,
				comment,owner_name,owner_address,preparer_name,receipt_number)

		SELECT 
				@dataset_id,
				ew.escrow_id,
				ew.prop_id, 
				ew.year,
				ew.amount_due,
				pv.legal_desc,
				ew.comment,
				acc.file_as_name,
				(
					acc.file_as_name + CHAR(13) + 
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
				@user, 
				pay.receipt_num
				
			FROM escrow ew with (nolock)

			LEFT JOIN escrow_type ewt with (nolock)
			ON ewt.escrow_type_cd = ew.escrow_type_cd and ewt.year = ew.year

			LEFT OUTER JOIN address a with (nolock)
			ON a.acct_id = ew.owner_id 
			AND  a.primary_addr = 'Y'
				
			LEFT OUTER JOIN country c with (nolock)
			ON c.country_cd = a.country_cd
			
			LEFT JOIN prop_supp_assoc psa with (nolock)
			ON psa.prop_id = ew.prop_id AND psa.owner_tax_yr = ew.year
			
			LEFT JOIN property_val pv with (nolock)
			ON pv.prop_id = ew.prop_id AND pv.prop_val_yr = ew.year AND pv.sup_num = psa.sup_num
				
			LEFT JOIN account acc with (nolock)
			ON acc.acct_id = ew.owner_id
			
			cross apply (
				select top 1 isnull(p.receipt_num,pta.payment_id) as receipt_num
					from coll_transaction ct with(nolock)

					join payment_transaction_assoc pta with(nolock)
						on pta.transaction_id = ct.transaction_id
					join payment p on p.payment_id = pta.payment_id

					where ct.transaction_type = 'PE' and ct.trans_group_id = ew.escrow_id
					group by pta.payment_id, ct.transaction_type, ct.trans_group_id, receipt_num
					order by pta.payment_id desc
				) pay

			WHERE ew.escrow_id = @escrow_id


		--Insert EscrowPlatCert event on each property processed
			declare @next_event_id	int
			exec dbo.GetUniqueID 'event', @next_event_id output, 1, 0
	
			INSERT INTO event
				(event_id,system_type,event_type,event_date,pacs_user,event_desc,ref_year,
				ref_id1,pacs_user_id)
			SELECT
				@next_event_id,
				'C',
				'EscrowPlatCert',
				GETDATE(),	
				@user,
				'Printed a Plat Certification Letter for escrow ID : '+ cast(@escrow_id as char),
				eplp.year,
				eplp.history_id,
				p.pacs_user_id
			FROM escrow_plat_letter_print_history eplp
			LEFT JOIN pacs_user p
			ON p.pacs_user_name = @user
			WHERE eplp.history_id = @dataset_id

			insert into prop_event_assoc(prop_id,event_id)
			SELECT 	eplp.prop_id,@next_event_id
			FROM escrow_plat_letter_print_history eplp
			WHERE eplp.history_id = @dataset_id

END

GO


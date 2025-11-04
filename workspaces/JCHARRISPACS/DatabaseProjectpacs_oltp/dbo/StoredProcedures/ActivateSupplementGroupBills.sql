
CREATE PROCEDURE [dbo].[ActivateSupplementGroupBills]
      @sup_group_id     int,
      @pacs_user_id     int,
      @batch_id					int = 0

AS
      set nocount on
      declare @return_message varchar(255),
              @id             int,
              @payment_count  int,
              @payment_status_type_cd varchar(10),
              @prop_id        int

			-- if a new batch id was passed to the proc, then update sup group
			if(@batch_id > 0 and @batch_id <> (	select isNull(sup_bills_batch_id, 0) 
																					from sup_group with (nolock)
																					where sup_group_id = @sup_group_id ))
			begin
				update sup_group
				set sup_bills_batch_id = @batch_id
				where sup_group_id = @sup_group_id
			end
			-- else grab the batch used to create the bills
			else if (@batch_id <= 0)
			begin
				select @batch_id = sup_bills_batch_id
				from sup_group with (nolock)
				where sup_group_id = @sup_group_id
			end
						

			--validate that the batch is not closed
			if @batch_id <= 0 or exists (	select * 
																		from batch with (nolock)
																		where batch_id = @batch_id
																		and isNull(close_dt, '') <> '') 
			begin
				set @return_message = 'The selected batch must be open to activate the bills'
				goto quit
			end								


			if exists(select id from tempdb..sysobjects where id = object_id('tempdb..#ASGB_tmpIDs'))
			begin
				drop table #ASGB_tmpIDs
			end		
			
			if exists(select id from tempdb..sysobjects where id = object_id('tempdb..#ASGB_tmpRBIDs'))
			begin
				drop table #ASGB_tmpRBIDs
			end		
			
			select prop_id, prop_val_yr as year, pv.sup_num
			into #ASGB_tmpIDs
			from property_val pv
			join supplement s with (nolock) on s.sup_tax_yr = pv.prop_val_yr
			and s.sup_num = pv.sup_num
			where sup_group_id = @sup_group_id
			
			select ag_rollbk_id as rollback_id, prop_id 
			into #ASGB_tmpRBIDs
			from ag_rollback as ar with (nolock)
            where (isNull(ar.accept_sup_group_id, -1) = @sup_group_id
                  or isNull(ar.void_sup_group_id, -1) = @sup_group_id)
                  and isNull(ar.accept_sup_group_id, -1) <> isNull(ar.void_sup_group_id, -1)
			
			            
			--Copy fee pending_coll_transaction records to coll_transaction
			insert into coll_transaction
			(
						transaction_id,
						trans_group_id,
						base_amount,
						base_amount_pd,
						penalty_amount_pd,
						interest_amount_pd,
						bond_interest_pd,
						transaction_type,
						underage_amount_pd,
						overage_amount_pd,
						other_amount_pd,
						pacs_user_id,
						transaction_date,
						batch_id
			)
			select
						pending_transaction_id,
						trans_group_id,
						base_amount,
						base_amount_pd,
						penalty_amount_pd,
						interest_amount_pd,
						bond_interest_pd,
						transaction_type,
						underage_amount_pd,
						overage_amount_pd,
						other_amount_pd,
						@pacs_user_id,
						getdate(),
						@batch_id
			from pending_coll_transaction as pct with (nolock) 
			join fee as f with (nolock) 
						on f.fee_id = pct.trans_group_id
			join fee_property_vw fpv on fpv.fee_id = f.fee_id
			join #ASGB_tmpIDs ids 
				on fpv.prop_id = ids.prop_id
				and f.year = ids.year
				and f.sup_num = ids.sup_num
						where pending_transaction_id not in (	select transaction_id 
													from coll_transaction
													where transaction_id = pending_transaction_id)

						delete from pending_coll_transaction
						from pending_coll_transaction as pct with (nolock) 
						join fee as f with (nolock) 
									on f.fee_id = pct.trans_group_id
						join fee_property_vw fpv on fpv.fee_id = f.fee_id
						join #ASGB_tmpIDs ids 
				on fpv.prop_id = ids.prop_id
				and f.year = ids.year
				and f.sup_num = ids.sup_num
						where pending_transaction_id in (	select transaction_id 
												from coll_transaction
												where transaction_id = pending_transaction_id)

      --Copy bill pending_coll_transaction records to coll_transaction
      insert into coll_transaction
      (
            transaction_id,
            trans_group_id,
            base_amount,
            base_amount_pd,
            penalty_amount_pd,
            interest_amount_pd,
            bond_interest_pd,
            transaction_type,
            underage_amount_pd,
            overage_amount_pd,
            other_amount_pd,
            pacs_user_id,
            transaction_date,
            batch_id
      )
      select
            pending_transaction_id,
            trans_group_id,
            base_amount,
            base_amount_pd,
            penalty_amount_pd,
            interest_amount_pd,
            bond_interest_pd,
            transaction_type,
            underage_amount_pd,
            overage_amount_pd,
            other_amount_pd,
            @pacs_user_id,
            getdate(),
            @batch_id
      from pending_coll_transaction as pct with (nolock) 
      join bill as b with (nolock) 
            on b.bill_id = pct.trans_group_id
      join #ASGB_tmpIDs ids 
				on ids.prop_id = b.prop_id
				and ids.year = b.year
				and ids.sup_num = b.sup_num
						where pending_transaction_id not in (	select transaction_id 
													from coll_transaction
													where transaction_id = pending_transaction_id)


      delete from pending_coll_transaction
      from pending_coll_transaction as pct with (nolock) 
      join bill as b with (nolock) 
            on b.bill_id = pct.trans_group_id
      join #ASGB_tmpIDs ids 
				on ids.prop_id = b.prop_id
				and ids.year = b.year
				and ids.sup_num = b.sup_num
						where pending_transaction_id in (	select transaction_id 
												from coll_transaction
												where transaction_id = pending_transaction_id)

            
      update bill 
            set is_active = 1
      from bill as b with (nolock)
      join #ASGB_tmpIDs ids 
				on ids.prop_id = b.prop_id
				and ids.year = b.year
				and ids.sup_num = b.sup_num
            where isnull(b.is_active, 0) = 0

			update fee
						set is_active = 1
			from fee as f with (nolock)
			join fee_property_vw fpv on fpv.fee_id = f.fee_id
			join #ASGB_tmpIDs ids 
				on fpv.prop_id = ids.prop_id
				and f.year = ids.year
				and f.sup_num = ids.sup_num
            where isnull(f.is_active, 0) = 0
            
			--Copy fee pending_coll_transaction records to coll_transaction - Rollback
			insert into coll_transaction
			(
						transaction_id,
						trans_group_id,
						base_amount,
						base_amount_pd,
						penalty_amount_pd,
						interest_amount_pd,
						bond_interest_pd,
						transaction_type,
						underage_amount_pd,
						overage_amount_pd,
						other_amount_pd,
						pacs_user_id,
						transaction_date,
						batch_id
			)
			select
						pending_transaction_id,
						trans_group_id,
						base_amount,
						base_amount_pd,
						penalty_amount_pd,
						interest_amount_pd,
						bond_interest_pd,
						transaction_type,
						underage_amount_pd,
						overage_amount_pd,
						other_amount_pd,
						@pacs_user_id,
						getdate(),
						@batch_id
			from pending_coll_transaction as pct with (nolock) 
			join fee as f with (nolock) 
					on f.fee_id = pct.trans_group_id
			join fee_property_vw fpv on fpv.fee_id = f.fee_id
			join #ASGB_tmpRBIDs ids
				on ids.prop_id = fpv.prop_id
				and ids.rollback_id = isNull(f.rollback_id, -1)
						where pending_transaction_id not in (	select transaction_id 
													from coll_transaction
													where transaction_id = pending_transaction_id)  
				    
						delete from pending_coll_transaction
						from pending_coll_transaction as pct with (nolock) 
						join fee as f with (nolock) 
									on f.fee_id = pct.trans_group_id
				join fee_property_vw fpv on fpv.fee_id = f.fee_id
						join #ASGB_tmpRBIDs ids
				on ids.prop_id = fpv.prop_id
				and ids.rollback_id = isNull(f.rollback_id, -1)
						where pending_transaction_id in (	select transaction_id 
												from coll_transaction
												where transaction_id = pending_transaction_id)


      --Copy bill pending_coll_transaction records to coll_transaction - Rollback
      insert into coll_transaction
      (
            transaction_id,
            trans_group_id,
            base_amount,
            base_amount_pd,
            penalty_amount_pd,
            interest_amount_pd,
            bond_interest_pd,
            transaction_type,
            underage_amount_pd,
            overage_amount_pd,
            other_amount_pd,
            pacs_user_id,
            transaction_date,
            batch_id
      )
      select
            pending_transaction_id,
            trans_group_id,
            base_amount,
            base_amount_pd,
            penalty_amount_pd,
            interest_amount_pd,
            bond_interest_pd,
            transaction_type,
            underage_amount_pd,
            overage_amount_pd,
            other_amount_pd,
            @pacs_user_id,
            getdate(),
            @batch_id
      from pending_coll_transaction as pct with (nolock) 
      join bill as b with (nolock) 
            on b.bill_id = pct.trans_group_id
			join #ASGB_tmpRBIDs ids
				on ids.prop_id = b.prop_id
				and ids.rollback_id = isNull(b.rollback_id, -1)
						where pending_transaction_id not in (	select transaction_id 
													from coll_transaction
													where transaction_id = pending_transaction_id)

            
      delete from pending_coll_transaction
      from pending_coll_transaction as pct with (nolock) 
      join bill as b with (nolock) 
            on b.bill_id = pct.trans_group_id
      join #ASGB_tmpRBIDs ids
				on ids.prop_id = b.prop_id
				and ids.rollback_id = isNull(b.rollback_id, -1)
      where pending_transaction_id in (	select transaction_id 
									from coll_transaction
									where transaction_id = pending_transaction_id)
            

      update bill
      set is_active = 1
      from bill as b with (nolock) 
      join #ASGB_tmpRBIDs ids
				on ids.prop_id = b.prop_id
				and ids.rollback_id = isNull(b.rollback_id, -1)


      update fee
      set is_active = 1
      from fee as f with (nolock) 
      join fee_property_vw fpv with (nolock)
				on fpv.fee_id = f.fee_id
			join #ASGB_tmpRBIDs ids
				on ids.prop_id = fpv.prop_id
				and ids.rollback_id = isNull(f.rollback_id, -1)
            
			--Generate Zero Due Rollback Bills: This is needed in case there are rollback statements that need to be printed
			--that only have delinquent rollback bill amounts			
			if isNull(@batch_id, 0) > 0
			begin
				exec GenerateRollbackZeroBills @pacs_user_id, @batch_id
			end
			
			update sup_group
      set sup_bill_status = 'BA'
      where sup_group_id = @sup_group_id

quit:
	select @return_message as return_message
	set nocount off

GO


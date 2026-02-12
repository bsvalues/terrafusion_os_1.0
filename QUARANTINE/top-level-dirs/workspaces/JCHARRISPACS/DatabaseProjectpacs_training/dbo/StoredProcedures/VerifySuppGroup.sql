


CREATE PROCEDURE VerifySuppGroup

	@input_sup_group_id int

AS

	/*
	 * There are 9 things that can cause balancing problems
	 * between the Totals report and the Roll report.
	 *
	 * 1. Missing sup_action will cause the Roll report to
	 *    not know where to put the values on the totals
	 *    pages.  (Additions/Modifications/Deletions)
	 *    This will throw off the Gain/Loss totals.
	 *
	 * 2. For whatever reason, sometimes sup_num =
	 *    prev_sup_num or prev_sup_num = NULL in property_val.
	 *    This will throw off the previous values which
	 *    will then throw off the Gain/Loss totals.
	 *
	 * 3. Multiple primary address records
	 *
	 * 4. Multiple primary situs records
	 *
	 * 5. Multiple agent_assoc records with ca_mailings = 'T'
	 *
	 * 6. property_val.prev_sup_num doesn't equal the previous property_val.sup_num (different than #2)
	 *
	 * 7. POEV records that have no PV record
	 *
	 * 8. POEV records with an owner ID that don't match the current owner ID (rare)
	 *
	 * 9. Properties that are accepted with a recalc status <> 'C', therefore causing a potential POEV issue
	 */

	/*
	 * Phase 1, check for sup_action
	 */

	SELECT pv.prop_id, pv.prop_val_yr, pv.sup_num, pv.sup_action
	FROM property_val as pv
	WITH (NOLOCK)

	INNER JOIN supplement as s
	WITH (NOLOCK)
	ON pv.prop_val_yr = s.sup_tax_yr
	AND pv.sup_num = s.sup_num

	WHERE s.sup_group_id = @input_sup_group_id
	AND pv.sup_action IS NULL

	IF @@ROWCOUNT = 0
	BEGIN
		print 'No missing sup_action''s found.'
	END


	/*
	 * Phase 2, check for sup_num = prev_sup_num or
	 * prev_sup_num = NULL.  Now there's a catch to
	 * this.  If the property was created new for this
	 * supplement, there will be no sup_num = 0 and the
	 * prev_sup_num will equal the sup_num.  So disregard
	 * those.
	 */

	SELECT pv.prop_id, pv.prop_val_yr, pv.sup_num, pv.prev_sup_num
	FROM property_val as pv
	WITH (NOLOCK)

	INNER JOIN supplement as s
	WITH (NOLOCK)
	ON pv.prop_val_yr = s.sup_tax_yr
	AND pv.sup_num = s.sup_num

	WHERE s.sup_group_id = @input_sup_group_id
	AND pv.sup_num > 0
	AND pv.sup_num = pv.prev_sup_num 
	AND pv.sup_action <> 'A'

	IF @@ROWCOUNT = 0
	BEGIN
		print 'No wrong sup_num''s found.'
	END

	/*
	 * Phase 3, check for multiple primary address records
	 */

	select acct_id, count(acct_id)
	from address with (nolock)
	where primary_addr = 'Y'
	group by acct_id
	having count(acct_id) > 1

	IF @@ROWCOUNT = 0
	BEGIN
		print 'No multiple primary address records found.'
	END

	/*
	 * Phase 4, check for multiple primary situs records
	 */

	select prop_id, count(prop_id)
	from situs with (nolock)
	where primary_situs = 'Y'
	group by prop_id
	having count(prop_id) > 1

	IF @@ROWCOUNT = 0
	BEGIN
		print 'No multiple primary situs records found.'
	END

	/*
	 * Phase 5, Multiple agent_assoc records with ca_mailings = 'T'
	 */

	select aa.owner_tax_yr, aa.prop_id, aa.owner_id, count(aa.owner_id) as agent_assoc_count
	from agent_assoc as aa with (nolock), property_val as pv with (nolock), supplement as s with (nolock)
	where pv.prop_val_yr = s.sup_tax_yr
		and pv.sup_num = s.sup_num
		and s.sup_group_id = @input_sup_group_id
		and pv.prop_id = aa.prop_id
		and pv.prop_val_yr = aa.owner_tax_yr
		and aa.ca_mailings = 'T'
		and aa.exp_dt > GetDate()
	group by aa.owner_tax_yr, aa.prop_id, aa.owner_id
	having count(aa.owner_id) > 1
	order by aa.owner_tax_yr, aa.prop_id, aa.owner_id

	IF @@ROWCOUNT = 0
	BEGIN
		print 'No multiple agent_assoc records found with ca_mailings = ''T''.'
	END

	/*
	 * Phase 6, prev_sup_num not calculating correctly
	 */

	select pv.prop_id,
		pv.prop_val_yr,
		pv.sup_num,
		(
			select max(sup_num)
			from property_val pv1 with (nolock)
			where pv1.prop_id = pv.prop_id
			and   pv1.prop_val_yr = pv.prop_val_yr
			and   pv1.sup_num <> pv.sup_num) as calc_sup_num, prev_sup_num
	into #temp_list
	from property_val as pv with (nolock), supplement as s with (nolock)
	where pv.prop_val_yr = s.sup_tax_yr
		and pv.sup_num = s.sup_num
		and s.sup_group_id = @input_sup_group_id

	select * from #temp_list
	where prev_sup_num <> calc_sup_num
	order by prop_id, prop_val_yr, sup_num

	IF @@ROWCOUNT = 0
	BEGIN
		print 'Previous sup nums OK'
	END

	/*
	 * Phase 7, POEV records that have no PV record
	 */
	select poev.prop_id, poev.owner_id, poev.entity_id, poev.sup_yr, poev.sup_num
	from prop_owner_entity_val poev with (nolock), supplement s with (nolock)
	where poev.sup_yr = s.sup_tax_yr
		and poev.sup_num = s.sup_num
		and s.sup_group_id = @input_sup_group_id
		and not exists
		(
			select * from property_val pv with (nolock)
			where poev.prop_id = pv.prop_id
			and poev.sup_num = pv.sup_num
			and poev.sup_yr = pv.prop_val_yr
		)
	order by poev.prop_id, poev.owner_id, poev.entity_id, poev.sup_yr, poev.sup_num

	IF @@ROWCOUNT = 0
	BEGIN
		print 'POEV records ok'
	END

	/*
	 * Phase 8, POEV records with an owner ID that don't match the current owner ID
	 */

	select poev.prop_id, poev.owner_id, poev.entity_id, poev.sup_yr, poev.sup_num
	from prop_owner_entity_val poev with (nolock), supplement s with (nolock)
	where poev.sup_yr = s.sup_tax_yr
		and poev.sup_num = s.sup_num
		and s.sup_group_id = @input_sup_group_id
		and not exists
		(
			select *
			from owner o with (nolock)
			where poev.prop_id = o.prop_id
				and poev.sup_num = o.sup_num
				and poev.sup_yr = o.owner_tax_yr
				and poev.owner_id = o.owner_id
		)
	order by poev.prop_id

	IF @@ROWCOUNT = 0
	BEGIN
		print 'POEV record owner ID''s ok'
	END

	/*
	 * Phase 9, Properties that are accepted with a recalc status <> 'C', therefore causing a potential POEV issue
	 */

	select pv.prop_id,
		pv.prop_val_yr,
		pv.sup_num,
		pv.recalc_flag
	from property_val pv with (nolock), property p with (nolock), supplement s with (nolock)
	where pv.prop_val_yr = s.sup_tax_yr
		and pv.sup_num = s.sup_num
		and s.sup_group_id = @input_sup_group_id
		and pv.prop_id = p.prop_id
		and isnull(pv.recalc_flag, 'M') <> 'C'
		and pv.prop_inactive_dt is null
		and pv.sup_num in
		(
			select s.sup_num
			from supplement s with (nolock) inner join sup_group sg with (nolock)
			on s.sup_tax_yr = pv.prop_val_yr
				and s.sup_group_id = sg.sup_group_id
				and sg.sup_accept_dt is not null
		)
	order by pv.prop_id

	IF @@ROWCOUNT = 0
	BEGIN
		print 'Recalc status'' ok'
	END

GO


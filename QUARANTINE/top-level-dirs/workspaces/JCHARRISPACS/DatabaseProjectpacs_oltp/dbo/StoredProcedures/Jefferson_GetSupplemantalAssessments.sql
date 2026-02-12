
CREATE PROCEDURE [dbo].[Jefferson_GetSupplemantalAssessments]
  @AssessmentYear char(4),
  @PeriodStartDate date,
  @PeriodEndDate date
 
AS
DECLARE
@TaxSupYear int,
@AssessYear int

SET NOCOUNT ON

SET @AssessYear = Cast(@AssessmentYear As Int)
SET @TaxSupYear = @AssessYear - 1

IF object_id('TEMPDB..#PACS_TaxSupplemental_Assessment') is not null
BEGIN
    DROP TABLE #PACS_TaxSupplemental_Assessment
END

CREATE TABLE #PACS_TaxSupplemental_Assessment
(
tax_district_id   	int null,
levy_cd				varchar(10) null,
prop_id				int null,
apply_yr            int null,
supplement_yr		int null,
previous_base_tax	numeric(14,2)null,
base_tax		    numeric(14,2) null,
adjustment		    numeric(14,2) null,
modify_cd           varchar(10) null,
modify_reason       varchar(500) null,
transaction_id      int null,
transaction_type    varchar(25) null,
core_transaction_type  int null,
rollback_id         int null,
rollback_amt		numeric(14,2) null,
rollback_dt         datetime null,
has_refund_seg      varchar(3) null
)
 
INSERT INTO #PACS_TaxSupplemental_Assessment(tax_district_id, levy_cd, prop_id, apply_yr, supplement_yr, previous_base_tax, base_tax, adjustment, modify_cd, modify_reason, transaction_id, transaction_type, core_transaction_type, rollback_id, rollback_amt, has_refund_seg)
SELECT e.tax_district_id, d.levy_cd, c.prop_id, @TaxSupYear, d.year, a.previous_base_tax, a.base_tax,  a.base_tax - a.previous_base_tax As adjustment, a.modify_cd, a.modify_reason, b.transaction_id, b.transaction_type , f.core_transaction_type, 0, 0, 'N'
  FROM bill_adjustment As a, coll_transaction As b, bill As c, levy_bill As d, tax_district As e, transaction_type As f
  WHERE a.transaction_id = b.transaction_id AND a.bill_id = c.bill_id AND c.bill_id = d.bill_id and d.tax_district_id = e.tax_district_id AND b.transaction_type = f.transaction_type
  AND b.create_date BETWEEN @PeriodStartDate AND @PeriodEndDate
  --AND Isnull(a.modify_cd,'') <> '' 

INSERT INTO #PACS_TaxSupplemental_Assessment(tax_district_id, levy_cd, prop_id, apply_yr, supplement_yr, previous_base_tax, base_tax, adjustment, modify_cd, modify_reason, transaction_id, transaction_type, core_transaction_type, rollback_id, rollback_amt, has_refund_seg)
SELECT e.tax_district_id, d.levy_cd, b.prop_id, @TaxSupYear, d.year, 0, 0, c.base_amount_pd As adjustment, 'REFUND', 'Refund', c.transaction_id, f.transaction_type , f.core_transaction_type, 0, 0, 'N/A'
  FROM refund As a, refund_transaction_assoc As b, coll_transaction As c, levy_bill As d, tax_district As e, transaction_type As f
  WHERE a.refund_id = b.refund_id AND b.transaction_id = c.transaction_id AND c.trans_group_id = d.bill_id and d.tax_district_id = e.tax_district_id AND c.transaction_type = f.transaction_type
   AND c.create_date BETWEEN @PeriodStartDate AND @PeriodEndDate
 -- AND a.refund_date BETWEEN @PeriodStartDate AND @PeriodEndDate

-- Mark Refund - Bill Duplicates 
UPDATE #PACS_TaxSupplemental_Assessment SET has_refund_seg = 'Y'
FROM #PACS_TaxSupplemental_Assessment As a, refund As b, refund_transaction_assoc As c, coll_transaction As d
WHERE a.prop_id = c.prop_id AND b.refund_id = c.refund_id AND c.transaction_id = d.transaction_id
AND a.has_refund_seg = 'N' AND  a.adjustment = d.base_amount_pd
AND b.refund_date BETWEEN @PeriodStartDate AND @PeriodEndDate
-- Delete Refund - Bill Duplicates (done at the report level!!!!)
--DELETE FROM ##PACS_TaxSupplemental_Assessment WHERE has_refund_seg = 'Y'

-- Add Bill Processed Rollbacks
INSERT INTO #PACS_TaxSupplemental_Assessment(tax_district_id, levy_cd, prop_id, apply_yr, supplement_yr, previous_base_tax, base_tax, adjustment, modify_cd, modify_reason, transaction_id, transaction_type, core_transaction_type, rollback_id, rollback_amt, rollback_dt, has_refund_seg)
 SELECT c.tax_district_id,  b.levy_cd, a.prop_id, @TaxSupYear, b.year, 0, 0, 0, 'ROLLBACK', 'Comp Tax', 0, '', 0,  d.ag_rollbk_id, a.current_amount_due, d.ag_rollbk_dt, 'N/A'
  FROM bill As a, levy_bill As b, tax_district As c, ag_rollback As d
  WHERE a.bill_id = b.bill_id and b.tax_district_id = c.tax_district_id AND a.rollback_id = d.ag_rollbk_id
  AND  d.ag_rollbk_dt BETWEEN @PeriodStartDate AND @PeriodEndDate

-- Build Tax District Table
IF object_id('TEMPDB..#PACS_District_Levy_Table') is not null
BEGIN
    DROP TABLE [#PACS_District_Levy_Table]
END

CREATE TABLE #PACS_District_Levy_Table
(
tax_district_priority		int null,
tax_district_type_cd        varchar(10) null,
tax_district_type_desc		varchar(50) null,
tax_district_cd             varchar(20) null,
tax_district_desc			varchar(50) null,
tax_district_id   			int null,
levy_year					numeric(4,0) null,
levy_cd						varchar(10) null,
levy_description            varchar(50) null,
levy_rate                   numeric(13,10) null,
levy_voted					int null,
levy_type                   varchar(10) null,
supplemental_refunds		numeric(14,2) null,
supplemental_additions		numeric(14,2) null,
supplemental_reductions		numeric(14,2) null,
supplemental_rollbacks		numeric(14,2) null,
first_rollback_id           int,
first_rollback_dt           datetime,
last_rollback_id            int,
last_rollback_dt            datetime
)

INSERT INTO #PACS_District_Levy_Table (tax_district_priority, tax_district_type_cd, tax_district_type_desc, tax_district_cd, tax_district_desc, tax_district_id, levy_year, levy_cd, levy_description, levy_rate, levy_voted, levy_type, supplemental_refunds, supplemental_additions, supplemental_reductions, supplemental_rollbacks, first_rollback_id, last_rollback_id)
SELECT a.priority, a.tax_district_type_cd, a.tax_district_desc, b.tax_district_cd, b.tax_district_desc, b.tax_district_id, c.year, c.levy_cd, c.levy_description, c.levy_rate, c.voted, c.levy_type_cd, 0, 0, 0, 0, 0, 0
FROM tax_district_type As a, tax_district As b, levy As c
WHERE a.tax_district_type_cd = b.tax_district_type_cd AND b.tax_district_id = c.tax_district_id AND c.year = @TaxSupYear  AND IsNull(c.end_year, 2999) > @AssessYear
-- Include Flood Zones
INSERT INTO #PACS_District_Levy_Table (tax_district_priority, tax_district_type_cd, tax_district_type_desc, tax_district_cd, tax_district_desc, tax_district_id, levy_year, levy_cd, levy_description, levy_rate, levy_voted, levy_type, supplemental_refunds, supplemental_additions, supplemental_reductions, supplemental_rollbacks, first_rollback_id, last_rollback_id)
VALUES(15,'FZ', 'FLOOD ZONE', 'Z1', 'FLOOD ZONE #1', 100000, @TaxSupYear, 'FZ1', 'FLOOD ZONE #1 (no levy)', 0, 0, 'GEN', 0, 0, 0, 0, 0, 0)
INSERT INTO #PACS_District_Levy_Table (tax_district_priority, tax_district_type_cd, tax_district_type_desc, tax_district_cd, tax_district_desc, tax_district_id, levy_year, levy_cd, levy_description, levy_rate, levy_voted, levy_type, supplemental_refunds, supplemental_additions, supplemental_reductions, supplemental_rollbacks, first_rollback_id, last_rollback_id)
VALUES(15,'FZ', 'FLOOD ZONE', 'Z2', 'FLOOD ZONE #2', 100001, @TaxSupYear, 'FZ2', 'FLOOD ZONE #2 (no levy)', 0, 0, 'GEN', 0, 0, 0, 0, 0, 0)
INSERT INTO #PACS_District_Levy_Table (tax_district_priority, tax_district_type_cd, tax_district_type_desc, tax_district_cd, tax_district_desc, tax_district_id, levy_year, levy_cd, levy_description, levy_rate, levy_voted, levy_type, supplemental_refunds, supplemental_additions, supplemental_reductions, supplemental_rollbacks, first_rollback_id, last_rollback_id)
VALUES(15,'FZ', 'FLOOD ZONE', 'Z3', 'FLOOD ZONE #3', 100002, @TaxSupYear, 'FZ3', 'FLOOD ZONE #3 (no levy)', 0, 0, 'GEN', 0, 0, 0, 0, 0, 0)

UPDATE #PACS_District_Levy_Table SET tax_district_type_desc = 'FIRE DISTRICT' WHERE tax_district_type_cd = 'FD'  OR tax_district_type_cd = 'FD-P'

--Change Priorities for reports
UPDATE #PACS_District_Levy_Table SET tax_district_priority = 0 WHERE tax_district_type_cd = 'ST' --State Schools
UPDATE #PACS_District_Levy_Table SET tax_district_priority = 1 WHERE tax_district_type_cd = 'CO' --County
UPDATE #PACS_District_Levy_Table SET tax_district_priority = 2 WHERE tax_district_type_cd = 'CF' --Conservation Futures
UPDATE #PACS_District_Levy_Table SET tax_district_priority = 3 WHERE tax_district_type_cd = 'RO' --Roads
UPDATE #PACS_District_Levy_Table SET tax_district_priority = 4 WHERE tax_district_type_cd = 'CI' OR tax_district_type_cd = 'CITY' --City Of PT
UPDATE #PACS_District_Levy_Table SET tax_district_priority = 5 WHERE tax_district_type_cd = 'CE' OR tax_district_type_cd = 'CEM' --Cemetery
UPDATE #PACS_District_Levy_Table SET tax_district_priority = 6 WHERE tax_district_type_cd = 'FI' OR tax_district_type_cd = 'FD'  OR tax_district_type_cd = 'FD-P' --Fire
UPDATE #PACS_District_Levy_Table SET tax_district_priority = 7 WHERE tax_district_type_cd = 'EMS' --EMS
UPDATE #PACS_District_Levy_Table SET tax_district_priority = 8 WHERE tax_district_type_cd = 'HOSP' --Hospital
UPDATE #PACS_District_Levy_Table SET tax_district_priority = 9 WHERE tax_district_type_cd = 'LI' OR tax_district_type_cd = 'LIB' --Library
UPDATE #PACS_District_Levy_Table SET tax_district_priority = 10 WHERE tax_district_type_cd = 'PO' OR tax_district_type_cd = 'PORT' --Port
UPDATE #PACS_District_Levy_Table SET tax_district_priority = 11, tax_district_type_desc = 'PUD' WHERE tax_district_cd = 'PUD1'  OR tax_district_type_cd = 'PUD' --PUD
UPDATE #PACS_District_Levy_Table SET tax_district_priority = 12 WHERE tax_district_type_cd = 'SD' --Schools
UPDATE #PACS_District_Levy_Table SET tax_district_priority = 13 WHERE tax_district_type_cd = 'FZ' --Flood Zones

UPDATE #PACS_District_Levy_Table  --Add Refunds
SET supplemental_refunds = b.Refunds
FROM #PACS_District_Levy_Table As a,
(SELECT levy_cd, SUM(adjustment) As Refunds FROM #PACS_TaxSupplemental_Assessment
WHERE core_transaction_type = 4 GROUP BY levy_cd) As b
WHERE a.levy_cd = b.levy_cd

UPDATE #PACS_District_Levy_Table  --Add Positive Adjustments
SET supplemental_additions = b.TaxAdd
FROM #PACS_District_Levy_Table As a,
(SELECT levy_cd, SUM(adjustment) As TaxAdd FROM #PACS_TaxSupplemental_Assessment
WHERE adjustment > 0 AND core_transaction_type <> 4 GROUP BY levy_cd) As b
WHERE a.levy_cd = b.levy_cd

UPDATE #PACS_District_Levy_Table  --Add Reduction Adjustments
SET supplemental_reductions = b.TaxReduce
FROM #PACS_District_Levy_Table As a,
(SELECT levy_cd, SUM(adjustment) As TaxReduce FROM #PACS_TaxSupplemental_Assessment
WHERE adjustment < 0 AND core_transaction_type <> 4 GROUP BY levy_cd) As b
WHERE a.levy_cd = b.levy_cd

UPDATE #PACS_District_Levy_Table  --Add Bill Processed Rollbacks
SET supplemental_rollbacks = b.TaxRollback
FROM #PACS_District_Levy_Table As a,
(SELECT levy_cd, SUM(rollback_amt) As TaxRollback FROM #PACS_TaxSupplemental_Assessment
WHERE rollback_amt > 0 GROUP BY levy_cd) As b
WHERE a.levy_cd = b.levy_cd

UPDATE #PACS_District_Levy_Table  --Remove Rollbacks from Supplemental Additions
SET supplemental_additions = supplemental_additions - supplemental_rollbacks

UPDATE #PACS_District_Levy_Table  --Add First Rollback ID And Date for Bill Processed Rollbacks
SET first_rollback_id = (SELECT Min(rollback_id) FROM #PACS_TaxSupplemental_Assessment WHERE rollback_id > 0), first_rollback_dt = (SELECT Min(rollback_dt) FROM #PACS_TaxSupplemental_Assessment)

UPDATE #PACS_District_Levy_Table  --Add Last Rollback ID And Date for Bill Processed Rollbacks
SET last_rollback_id = (SELECT Max(rollback_id) FROM #PACS_TaxSupplemental_Assessment), last_rollback_dt = (SELECT Max(rollback_dt) FROM #PACS_TaxSupplemental_Assessment)

SELECT * FROM #PACS_District_Levy_Table ORDER BY tax_district_priority, tax_district_desc
--SELECT * FROM #PACS_TaxSupplemental_Assessment WHERE (transaction_type = 'ADJLB' OR transaction_type = 'RLB') ORDER BY prop_id, tax_district_id, modify_cd -- tax_district_id = 1036

-- SELECT UnProcessed Rollbacks
--SELECT b.ag_rollbk_id As rollback_id, a.prop_id, b.classification, b.taxes, b.penalty, c.tax_area_number, b.tax_year, b.num_years_removed
--  FROM ag_rollback As a, wash_ag_rollback As b, tax_area As c
--  WHERE a.ag_rollbk_id = b.ag_rollbk_id AND b.tax_area_id = c.tax_area_id
--  AND a.ag_rollbk_dt BETWEEN '1/1/' + Cast(@TaxSupYear+1 As char(4)) AND '12/31/'  + Cast(@TaxSupYear+1 As char(4))
--  AND a.status_cd = 'C' and a.bills_created = 'F'
--ORDER BY b.ag_rollbk_id

GRANT EXECUTE ON [dbo].[Jefferson_GetSupplemantalAssessments] TO [COUNTY\Assesor's Office]
GRANT EXECUTE ON [dbo].[Jefferson_GetSupplemantalAssessments] TO [PUBLIC]

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_GetSupplemantalAssessments] TO PUBLIC
    AS [dbo];


GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_GetSupplemantalAssessments] TO [COUNTY\Assesor's Office]
    AS [dbo];


GO


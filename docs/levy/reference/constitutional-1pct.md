# LEV-113 - WA Constitutional 1% Levy Limit Calculation

## Legal Basis

Article VII, Section 2 of the Washington State Constitution limits the
aggregate of all regular property tax levies on any parcel to 1% of its
true and fair value ($10.00 per $1,000 of assessed value).

## Applicable Levies

The 1% limit applies to **regular levies** only. The following are excluded:

- Voter-approved excess levies (bonds, M&O)
- Port district industrial development levies
- State levies explicitly exempt by statute

## Calculation Method

1. For each tax code area (TCA), sum the regular levy rates of all
   overlapping districts.
2. If the aggregate exceeds $10.00 per $1,000 AV, pro-ration is required.
3. Pro-ration reduces junior district levies proportionally until the
   aggregate meets the $10.00 ceiling.

## Priority Order (Senior to Junior)

1. State school levy
2. County current expense
3. County road
4. City / town
5. Fire district
6. Library district
7. Hospital district
8. Other junior districts

## Pro-Ration Formula

```
reduced_rate = original_rate * (available_capacity / total_junior_rates)
```

Where `available_capacity = 10.00 - sum_of_senior_rates`.

## System Implementation

BCBSLevy performs the 1% check automatically during levy certification.
Districts flagged for pro-ration are marked in the compliance dashboard.

## References

- WA Constitution Art. VII, Sec. 2
- RCW 84.52.010 -- Limitations upon regular property taxes
- RCW 84.52.010(3) -- Pro-ration procedures

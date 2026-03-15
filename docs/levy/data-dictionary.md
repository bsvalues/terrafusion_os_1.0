# LEV-119 - Data Dictionary

## Overview

Field definitions for all BCBSLevy database tables.

---

## tax_districts

| Column          | Type         | Nullable | Description                          |
|-----------------|--------------|----------|--------------------------------------|
| id              | varchar(20)  | NO       | Primary key, district code           |
| name            | varchar(200) | NO       | Official district name               |
| district_type   | varchar(50)  | NO       | COUNTY, CITY, FIRE, SCHOOL, etc.     |
| priority_order  | int          | NO       | Pro-ration seniority (1 = highest)   |
| active          | boolean      | NO       | Whether district is currently active |
| created_at      | timestamp    | NO       | Audit: creation timestamp            |
| updated_at      | timestamp    | NO       | Audit: last update timestamp         |

## levy_rates

| Column          | Type         | Nullable | Description                          |
|-----------------|--------------|----------|--------------------------------------|
| id              | int          | NO       | Primary key                          |
| district_id     | varchar(20)  | NO       | FK to tax_districts                  |
| tax_year        | int          | NO       | Assessment year                      |
| regular_rate    | decimal(12,6)| NO       | Regular levy rate per $1,000 AV      |
| excess_rate     | decimal(12,6)| YES      | Voter-approved excess rate           |
| total_rate      | decimal(12,6)| NO       | Computed: regular + excess           |
| certified_levy  | decimal(15,2)| NO       | Total certified dollar amount        |

## tax_code_districts

| Column          | Type         | Nullable | Description                          |
|-----------------|--------------|----------|--------------------------------------|
| tax_code        | varchar(10)  | NO       | Composite PK part 1                  |
| district_id     | varchar(20)  | NO       | Composite PK part 2, FK             |
| levy_type       | varchar(20)  | NO       | REGULAR, EXCESS, BOND               |
| effective_year  | int          | NO       | First year mapping is active         |
| expired_year    | int          | YES      | Year mapping was superseded          |

## properties

| Column              | Type         | Nullable | Description                      |
|---------------------|--------------|----------|----------------------------------|
| parcel_number       | varchar(30)  | NO       | Primary key                      |
| tax_code            | varchar(10)  | NO       | FK to tax_code_districts         |
| assessed_land       | decimal(15,2)| NO       | Land assessed value              |
| assessed_improvement| decimal(15,2)| NO       | Improvement assessed value       |
| total_assessed      | decimal(15,2)| NO       | Computed: land + improvement     |
| exemption_amount    | decimal(15,2)| YES      | Exemption (senior, disabled, etc)|

## compliance_flags

| Column          | Type         | Nullable | Description                          |
|-----------------|--------------|----------|--------------------------------------|
| id              | int          | NO       | Primary key                          |
| district_id     | varchar(20)  | NO       | FK to tax_districts                  |
| tax_year        | int          | NO       | Assessment year                      |
| rule            | varchar(50)  | NO       | CONST_1PCT, HLL_CAP, PRORATION      |
| severity        | varchar(20)  | NO       | WARNING, VIOLATION                   |
| message         | text         | NO       | Human-readable description           |
| resolved        | boolean      | NO       | Whether the flag has been addressed  |

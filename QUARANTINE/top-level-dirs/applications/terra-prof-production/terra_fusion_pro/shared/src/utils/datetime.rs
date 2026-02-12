use chrono::{DateTime, Datelike, Duration, NaiveDate, TimeZone, Utc};

/// Format a datetime as a string (ISO 8601 format)
pub fn format_datetime(datetime: &DateTime<Utc>) -> String {
    datetime.to_rfc3339()
}

/// Format a datetime as a human-readable string
pub fn format_datetime_human(datetime: &DateTime<Utc>) -> String {
    datetime.format("%B %d, %Y at %H:%M:%S").to_string()
}

/// Format a date only (YYYY-MM-DD)
pub fn format_date(datetime: &DateTime<Utc>) -> String {
    datetime.format("%Y-%m-%d").to_string()
}

/// Format a date in a human-readable format
pub fn format_date_human(datetime: &DateTime<Utc>) -> String {
    datetime.format("%B %d, %Y").to_string()
}

/// Calculate age in years from a date
pub fn calculate_age(birth_date: &NaiveDate) -> i32 {
    let today = Utc::now().date_naive();
    
    let mut age = today.year() - birth_date.year();
    
    // Adjust age if birthday hasn't occurred yet this year
    if today.month() < birth_date.month() || 
       (today.month() == birth_date.month() && today.day() < birth_date.day()) {
        age -= 1;
    }
    
    age
}

/// Calculate time difference in a human-readable format
pub fn time_ago(datetime: &DateTime<Utc>) -> String {
    let now = Utc::now();
    let duration = now.signed_duration_since(*datetime);
    
    if duration.num_seconds() < 60 {
        return format!("{} seconds ago", duration.num_seconds());
    }
    
    if duration.num_minutes() < 60 {
        return format!("{} minutes ago", duration.num_minutes());
    }
    
    if duration.num_hours() < 24 {
        return format!("{} hours ago", duration.num_hours());
    }
    
    if duration.num_days() < 30 {
        return format!("{} days ago", duration.num_days());
    }
    
    if duration.num_days() < 365 {
        return format!("{} months ago", duration.num_days() / 30);
    }
    
    format!("{} years ago", duration.num_days() / 365)
}

/// Parse a date string (YYYY-MM-DD) into a NaiveDate
pub fn parse_date(date_str: &str) -> Option<NaiveDate> {
    NaiveDate::parse_from_str(date_str, "%Y-%m-%d").ok()
}

/// Parse a datetime string (ISO 8601) into a DateTime<Utc>
pub fn parse_datetime(datetime_str: &str) -> Option<DateTime<Utc>> {
    DateTime::parse_from_rfc3339(datetime_str).ok().map(|dt| dt.with_timezone(&Utc))
}

/// Get the start of a day (midnight) for a given date
pub fn start_of_day(datetime: &DateTime<Utc>) -> DateTime<Utc> {
    let naive_date = datetime.date_naive();
    Utc.from_utc_datetime(&naive_date.and_hms_opt(0, 0, 0).unwrap())
}

/// Get the end of a day (23:59:59) for a given date
pub fn end_of_day(datetime: &DateTime<Utc>) -> DateTime<Utc> {
    let naive_date = datetime.date_naive();
    Utc.from_utc_datetime(&naive_date.and_hms_opt(23, 59, 59).unwrap())
}

/// Calculate the date that is a specified number of days in the future
pub fn days_from_now(days: i64) -> DateTime<Utc> {
    Utc::now() + Duration::days(days)
}

/// Calculate the date that is a specified number of days in the past
pub fn days_ago(days: i64) -> DateTime<Utc> {
    Utc::now() - Duration::days(days)
}
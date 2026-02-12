/// Format a currency value
pub fn format_currency(amount: f64) -> String {
    format!("${:.2}", amount)
}

/// Format an address into a single line
pub fn format_address_single_line(
    street1: &str,
    street2: Option<&str>,
    city: &str,
    state: &str,
    postal_code: &str,
) -> String {
    if let Some(street2_val) = street2 {
        format!(
            "{}, {} {}, {} {}",
            street1, street2_val, city, state, postal_code
        )
    } else {
        format!("{}, {}, {} {}", street1, city, state, postal_code)
    }
}

/// Format a person's full name
pub fn format_name(first_name: &str, last_name: &str) -> String {
    format!("{} {}", first_name, last_name)
}

/// Format a phone number
pub fn format_phone(phone: &str) -> String {
    if phone.len() == 10 {
        format!(
            "({}) {}-{}",
            &phone[0..3],
            &phone[3..6],
            &phone[6..10]
        )
    } else {
        phone.to_string()
    }
}

/// Format a percentage
pub fn format_percentage(value: f64) -> String {
    format!("{:.2}%", value * 100.0)
}

/// Truncate a long string to a given length with an ellipsis
pub fn truncate_string(s: &str, max_len: usize) -> String {
    if s.len() <= max_len {
        s.to_string()
    } else {
        format!("{}...", &s[0..max_len - 3])
    }
}

/// Format square footage
pub fn format_square_feet(sqft: f64) -> String {
    format!("{:.0} sq ft", sqft)
}

/// Format dollars per square foot
pub fn format_price_per_sqft(price: f64, sqft: f64) -> String {
    if sqft > 0.0 {
        format!("${:.2}/sq ft", price / sqft)
    } else {
        "N/A".to_string()
    }
}
use cookie::Cookie;
use http::HeaderValue;

pub fn get_session_id(cookies: Option<&HeaderValue>) -> Option<Cookie> {
    if cookies.is_none() {
        return None;
    }

    let cookie_result = Cookie::parse(cookies.unwrap().to_str().unwrap());

    if cookie_result.is_err() {
        return None;
    }

    Some(cookie_result.unwrap())
}

pub fn encode(s: &str) -> u64 {
    let base = 36; // 26 letters + 10 digits
    s.chars().fold(0, |acc, c| {
        acc * base
            + match c {
                '0'..='9' => c as u64 - '0' as u64,
                'a'..='z' => c as u64 - 'a' as u64 + 10,
                _ => panic!("Invalid character"),
            }
    })
}

pub fn decode(mut n: u64) -> String {
    if n == 0 {
        return "0".to_string();
    }

    let base = 36;
    let mut result = Vec::new();

    while n > 0 {
        let rem = (n % base) as u8;
        result.push(if rem < 10 {
            (rem + b'0') as char
        } else {
            ((rem - 10) + b'a') as char
        });
        n /= base;
    }

    result.into_iter().rev().collect()
}

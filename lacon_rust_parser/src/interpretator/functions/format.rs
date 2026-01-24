use crate::interpretator::patterns::{FUNCTION_STORE, REGEX_STORE};

pub type FormatFunction = fn(&str, &[FormatValue]) -> Result<String, String>;

#[derive(Debug, Clone)]
pub enum FormatValue {
    String(String),
    Integer(i64),
    Hex(i64),
}

impl FormatValue {
    fn as_str(&self) -> String {
        match self {
            FormatValue::String(s) => s.clone(),
            FormatValue::Integer(n) => n.to_string(),
            FormatValue::Hex(n) => format!("{:#X}", n), // Заглавные буквы
        }
    }
}

fn parse_arguments(args_str: &str) -> Result<Vec<FormatValue>, String> {
    let mut arguments = Vec::new();
    let mut current_arg = String::new();
    let mut in_string = false;
    let mut chars = args_str.chars().peekable();

    while let Some(ch) = chars.next() {
        match ch {
            '"' => {
                in_string = !in_string;
                current_arg.push(ch);
            }
            ',' if !in_string => {
                // Пропускаем опциональный пробел после запятой
                if chars.peek() == Some(&' ') {
                    chars.next();
                }

                if !current_arg.trim().is_empty() {
                    arguments.push(parse_value(current_arg.trim())?);
                    current_arg.clear();
                }
            }
            _ => {
                current_arg.push(ch);
            }
        }
    }

    // Добавляем последний аргумент
    if !current_arg.trim().is_empty() {
        arguments.push(parse_value(current_arg.trim())?);
    }

    Ok(arguments)
}

fn parse_value(value: &str) -> Result<FormatValue, String> {
    if value.starts_with('"') && value.ends_with('"') {
        let content = &value[1..value.len() - 1];
        return Ok(FormatValue::String(content.to_string()));
    }

    if value.starts_with("0x") || value.starts_with("0X") {
        return i64::from_str_radix(&value[2..], 16)
            .map(FormatValue::Hex)
            .map_err(|e| format!("Failed to parse hex number '{}': {}", value, e));
    }

    if let Ok(num) = value.parse::<i64>() {
        return Ok(FormatValue::Integer(num));
    }

    Ok(FormatValue::String(value.to_string()))
}

pub fn format_function(pattern: &str, args: &[FormatValue]) -> Result<String, String> {
    let mut result = String::new();
    let mut chars = pattern.chars().peekable();
    let mut arg_index = 0;

    while let Some(ch) = chars.next() {
        if ch == '{' {
            // Собираем всё содержимое внутри {}
            let mut format_spec = String::new();
            let mut found_close = false;

            while let Some(&next_ch) = chars.peek() {
                if next_ch == '}' {
                    chars.next(); // consume '}'
                    found_close = true;
                    break;
                }
                format_spec.push(next_ch);
                chars.next();
            }

            if !found_close {
                result.push(ch);
                result.push_str(&format_spec);
                continue;
            }

            if arg_index >= args.len() {
                return Err(format!(
                    "Not enough arguments: pattern requires at least {}, but only {} provided",
                    arg_index + 1,
                    args.len()
                ));
            }

            // Применяем форматирование
            let formatted = format_with_spec(&args[arg_index], &format_spec)?;
            result.push_str(&formatted);
            arg_index += 1;
        } else {
            result.push(ch);
        }
    }

    Ok(result)
}

fn format_with_spec(value: &FormatValue, spec: &str) -> Result<String, String> {
    if spec.is_empty() {
        // Без спецификации - обычный вывод
        return Ok(value.as_str());
    }

    // Парсим спецификацию формата: [:][fill][align][sign][#][0][width][.precision][type]
    let spec = spec.trim_start_matches(':');

    // Простой парсинг для поддержки основных случаев
    let mut width: Option<usize> = None;
    let mut fill_char = ' ';
    let mut pad_with_zero = false;
    let mut format_type = None;

    let mut chars = spec.chars().peekable();

    // Проверяем 0-padding
    if chars.peek() == Some(&'0') {
        pad_with_zero = true;
        fill_char = '0';
        chars.next();
    }

    // Парсим ширину
    let mut width_str = String::new();
    while let Some(&ch) = chars.peek() {
        if ch.is_ascii_digit() {
            width_str.push(ch);
            chars.next();
        } else {
            break;
        }
    }

    if !width_str.is_empty() {
        width = width_str.parse().ok();
    }

    // Парсим тип форматирования
    if let Some(&ch) = chars.peek() {
        format_type = Some(ch);
    }

    // Применяем форматирование
    let base_str = match (value, format_type) {
        (FormatValue::Integer(n), Some('X')) | (FormatValue::Hex(n), Some('X')) => {
            format!("{:X}", n)
        }
        (FormatValue::Integer(n), Some('x')) | (FormatValue::Hex(n), Some('x')) => {
            format!("{:x}", n)
        }
        _ => value.as_str(),
    };

    // Применяем ширину с заполнением
    if let Some(w) = width {
        if base_str.len() < w {
            let padding = w - base_str.len();
            let pad_str: String = std::iter::repeat(fill_char).take(padding).collect();
            return Ok(format!("{}{}", pad_str, base_str));
        }
    }

    Ok(base_str)
}

pub fn process_format_call(input: &str) -> Result<String, String> {
    let format_regex = REGEX_STORE.get("format").unwrap();

    if let Some(captures) = format_regex.captures(input) {
        let pattern = captures.get(1).unwrap().as_str();
        let args_str = captures.get(2).unwrap().as_str();

        let args = parse_arguments(args_str)?;

        if let Some(func) = FUNCTION_STORE.get("format") {
            return func(pattern, &args);
        }
    }

    Err("Invalid format call".to_string())
}

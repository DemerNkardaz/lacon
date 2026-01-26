use crate::lexer::error::{LexicalError, LexicalErrorType};
use crate::lexer::keywords::get_keyword_token;
use crate::lexer::operators::match_operator;
use crate::lexer::position::Position;
use crate::lexer::token::Token;
use crate::lexer::token_type::TokenType;

pub struct Scanner {
    source: Vec<char>,
    tokens: Vec<Token>,
    start: usize,
    current: usize,
    position: Position,
    start_position: Position,
    indent_stack: Vec<usize>,
    context_stack: Vec<TokenType>,
    string_stack: Vec<(char, bool)>,
    is_at_line_start: bool,
    had_whitespace: bool,
    pub errors: Vec<LexicalError>,
}

impl Scanner {
    pub fn new(source: String) -> Self {
        let start_pos = Position::start();
        Self {
            source: source.chars().collect(),
            tokens: Vec::new(),
            start: 0,
            current: 0,
            position: start_pos,
            start_position: start_pos,
            indent_stack: vec![0],
            context_stack: Vec::new(),
            string_stack: Vec::new(),
            is_at_line_start: true,
            had_whitespace: true,
            errors: Vec::new(),
        }
    }

    pub fn scan_tokens(&mut self) -> &Vec<Token> {
        self.add_token_raw(TokenType::BOF);

        while !self.is_at_end() {
            self.start = self.current;
            self.start_position = self.position;

            if self.is_at_line_start {
                self.handle_indentation();
            }
            if !self.is_at_end() {
                self.scan_token();
            }
        }

        while self.indent_stack.len() > 1 {
            self.indent_stack.pop();
            self.add_token_raw(TokenType::Dedent);
        }

        self.tokens.push(Token::eof(self.position));
        &self.tokens
    }

    fn scan_token(&mut self) {
        let c = self.advance();

        match c {
            ' ' | '\t' | '\r' => {
                self.had_whitespace = true;
                if c != '\r' && self.is_assign_whitespace() {
                    self.add_token_raw(TokenType::Whitespace);
                }
                self.start = self.current;
                self.start_position = self.position;
            }
            '\n' => {
                self.had_whitespace = true;
                self.add_token_raw(TokenType::Newline);
                self.is_at_line_start = true;
                self.start = self.current;
                self.start_position = self.position;
            }

            '"' => {
                self.had_whitespace = false;
                self.scan_string('"');
            }
            '\'' => {
                self.had_whitespace = false;
                self.scan_string('\'');
            }
            '`' => {
                self.had_whitespace = false;
                self.scan_string('`');
            }

            '(' | '[' | '{' => {
                let t_type = match c {
                    '(' => TokenType::LeftParen,
                    '[' => TokenType::LeftBracket,
                    _ => TokenType::LeftBrace,
                };
                self.context_stack.push(t_type);
                self.handle_operator(c);
                self.had_whitespace = false;
            }

            ')' | ']' | '}' => {
                if !self.context_stack.is_empty() {
                    self.context_stack.pop();
                }
                self.handle_operator(c);
                self.had_whitespace = false;

                if c == '}' {
                    if let Some((quote, is_multiline)) = self.string_stack.pop() {
                        self.start = self.current;
                        self.start_position = self.position;
                        self.continue_string_scan(quote, is_multiline);
                    }
                }
            }

            '-' => {
                self.had_whitespace = false;
                let next = self.peek();
                let next_next = self.peek_next(); // Здесь peek_next() это current + 1

                if next == Some('>') {
                    self.handle_operator(c);
                } else if next.map_or(false, |n| n.is_alphabetic() || n == '_')
                    || (next == Some('$') && next_next == Some('{'))
                {
                    // Если видим -${, то дефис считается началом идентификатора
                    self.scan_identifier();
                } else {
                    self.handle_operator(c);
                }
            }

            _ => {
                self.had_whitespace = false;
                self.is_at_line_start = false;

                if c.is_digit(10) {
                    self.scan_number();
                } else if c.is_alphabetic() || c == '_' {
                    self.scan_identifier();
                } else {
                    self.handle_operator(c);
                }
            }
        }
    }

    fn scan_identifier(&mut self) {
        // Мы попадаем сюда, когда ПЕРВЫЙ символ уже поглощен (через advance)
        // Но цикл while let Some(c) = self.peek() корректно обработает последующие символы
        while let Some(c) = self.peek() {
            // Остановка перед началом интерполяции
            if c == '$' && self.peek_next() == Some('{') {
                break;
            }

            if c == '-' {
                let next = self.peek_next(); // Это символ после '-'
                let next_next = self.peek_at(2); // Это символ через один после '-'

                // Проверяем: прилипает ли дефис к ID?
                // Вариант А: за ним буква/цифра (apple-word)
                let is_normal_id_part =
                    next.map_or(false, |n| n.is_alphanumeric()) && next != Some('>');
                // Вариант Б: за ним сразу интерполяция (winter-${)
                let is_link_to_interpolation = next == Some('$') && next_next == Some('{');

                if is_normal_id_part || is_link_to_interpolation {
                    self.advance(); // Поглощаем '-'
                    continue; // Продолжаем цикл сканирования ID
                } else {
                    break; // Дефис — это отдельный оператор, выходим
                }
            }

            if c.is_alphanumeric() || c == '_' {
                self.advance();
            } else {
                break;
            }
        }

        let text = self.get_lexeme();
        let t_type = get_keyword_token(&text).unwrap_or(TokenType::Identifier);
        self.add_token(t_type);
    }

    // Вспомогательный метод для заглядывания вперед
    fn peek_at(&self, distance: usize) -> Option<char> {
        self.source.get(self.current + distance).copied()
    }

    fn scan_number(&mut self) {
        while self.peek().map_or(false, |c| c.is_digit(10)) {
            self.advance();
        }

        if self.peek() == Some('.') && self.peek_next().map_or(false, |c| c.is_digit(10)) {
            self.advance();
            while self.peek().map_or(false, |c| c.is_digit(10)) {
                self.advance();
            }
        }

        let value_literal = self.get_slice(self.start, self.current);

        if let Some(c) = self.peek() {
            if c == '%' {
                self.advance();
                self.add_token_with_literal(TokenType::UnitPercent, value_literal);
                return;
            }

            if c.is_alphabetic() || c == 'µ' || c == 'μ' || c == 'Ω' || c == '\u{00B0}' {
                let suffix_start = self.current;
                let pos_before_suffix = self.position;

                while let Some(nc) = self.peek() {
                    if nc.is_alphanumeric()
                        || nc == '/'
                        || nc == 'µ'
                        || nc == 'μ'
                        || nc == 'Ω'
                        || nc == '\u{00B0}'
                    {
                        self.advance();
                    } else {
                        break;
                    }
                }

                let suffix = self.get_slice(suffix_start, self.current);
                let unit_type = match suffix.as_str() {
                    "Hz" | "kHz" | "MHz" | "GHz" | "THz" => Some(TokenType::UnitFrequency),
                    "b" | "B" | "Kb" | "MB" | "GB" | "TB" => Some(TokenType::UnitSize),
                    "deg" | "rad" | "\u{00B0}" => Some(TokenType::UnitDegree),
                    "µm" | "μm" | "nm" | "mm" | "cm" | "m" | "km" | "Mm" | "ft" | "mi" | "em"
                    | "rem" | "pt" | "in" | "px" | "pc" => Some(TokenType::UnitLength),
                    "ns" | "μs" | "µs" | "ms" | "sec" | "min" | "hour" | "day" | "week"
                    | "month" | "year" => Some(TokenType::UnitTime),
                    "D" => Some(TokenType::UnitDimension),
                    "ng" | "μg" | "mg" | "g" | "kg" | "t" | "kt" | "lb" | "oz" => {
                        Some(TokenType::UnitWeight)
                    }
                    "m/s" | "m/h" | "km/s" | "km/h" | "fps" | "ft/s" | "mph" | "mi/h" | "kn" => {
                        Some(TokenType::UnitSpeed)
                    }
                    "degC" | "degF" | "degN" | "degD" | "degL" | "degW" | "degRa" | "degRo"
                    | "degRe" | "degDa" | "degH" | "K" | "\u{00B0}C" | "\u{00B0}F"
                    | "\u{00B0}N" | "\u{00B0}D" | "\u{00B0}L" | "\u{00B0}W" | "\u{00B0}Ra"
                    | "\u{00B0}Ro" | "\u{00B0}Re" | "\u{00B0}Da" | "\u{00B0}H" => {
                        Some(TokenType::UnitTemperature)
                    }
                    "V" | "mV" | "kV" | "MV" => Some(TokenType::UnitElectricVoltage),
                    "A" | "mA" | "uA" | "μA" | "kA" => Some(TokenType::UnitElectricCurrent),
                    "C" | "mC" | "uC" | "μC" => Some(TokenType::UnitElectricCharge),
                    "ohm" | "Ω" | "kohm" | "Mohm" => Some(TokenType::UnitElectricResistance),
                    "S" | "mS" | "uS" | "μS" => Some(TokenType::UnitElectricConductance),
                    "F" | "uF" | "μF" | "nF" | "pF" => Some(TokenType::UnitElectricCapacitance),
                    "W" | "mW" | "kW" | "MW" | "GW" => Some(TokenType::UnitElectricPower),
                    "Pa" | "hPa" | "kPa" | "MPa" | "bar" | "mbar" | "psi" => {
                        Some(TokenType::UnitPressure)
                    }
                    "J" | "kJ" | "MJ" | "cal" | "kcal" | "Wh" | "kWh" => {
                        Some(TokenType::UnitEnergy)
                    }
                    _ => None,
                };

                if let Some(t_type) = unit_type {
                    self.add_token_with_literal(t_type, value_literal);
                    return;
                } else {
                    self.current = suffix_start;
                    self.position = pos_before_suffix;
                }
            }
        }

        self.add_token_with_literal(TokenType::Number, value_literal);
    }

    fn scan_string(&mut self, quote: char) {
        let is_multiline = quote == '"' && self.match_char('"') && self.match_char('"');
        self.continue_string_scan(quote, is_multiline);
    }

    fn continue_string_scan(&mut self, quote: char, is_multiline: bool) {
        let quote_len = if is_multiline { 3 } else { 1 };
        let content_start = self.current;

        while !self.is_at_end() {
            if self.peek() == Some('\\') && self.peek_next() == Some('$') {
                self.advance();
                self.advance();
                continue;
            }

            if self.peek() == Some('$') && self.peek_next() == Some('{') {
                let literal = self.get_slice(content_start, self.current);
                let t_type = self.get_string_token_type(quote, is_multiline);
                self.add_token_with_literal(t_type, literal);

                self.string_stack.push((quote, is_multiline));

                self.start = self.current;
                self.start_position = self.position;
                self.advance(); // $
                self.advance(); // {
                self.add_token(TokenType::DollarLeftBrace);
                return;
            }

            if is_multiline {
                if self.peek() == Some('"')
                    && self.peek_next() == Some('"')
                    && self.peek_at(2) == Some('"')
                {
                    break;
                }
            } else {
                if self.peek() == Some(quote) || self.peek() == Some('\n') {
                    break;
                }
            }

            let c = self.advance();
            if c == '\\' && !self.is_at_end() {
                self.advance();
            }
        }

        if self.is_at_end() || (!is_multiline && self.peek() == Some('\n')) {
            self.report_error(LexicalErrorType::UnterminatedString, "Unclosed string");
            return;
        }

        let literal = self.get_slice(content_start, self.current);

        for _ in 0..quote_len {
            self.advance();
        }

        let t_type = self.get_string_token_type(quote, is_multiline);
        self.add_token_with_literal(t_type, literal);
    }

    fn get_string_token_type(&self, quote: char, is_multiline: bool) -> TokenType {
        match quote {
            '"' if is_multiline => TokenType::MultilineString,
            '"' => TokenType::String,
            '\'' => TokenType::SingleQuotedString,
            '`' => TokenType::GraveQuotedString,
            _ => TokenType::String,
        }
    }

    fn is_assign_whitespace(&self) -> bool {
        let last = self.tokens.last().map(|t| &t.token_type);
        if !matches!(
            last,
            Some(TokenType::Identifier)
                | Some(TokenType::RightParen)
                | Some(TokenType::RightBracket)
                | Some(TokenType::Number)
                | Some(TokenType::UnitPercent)
                | Some(TokenType::String)
                | Some(TokenType::SingleQuotedString)
                | Some(TokenType::GraveQuotedString)
                | Some(TokenType::MultilineString)
        ) {
            return false;
        }

        let mut look = self.current;
        while look < self.source.len() && (self.source[look] == ' ' || self.source[look] == '\t') {
            look += 1;
        }
        if look >= self.source.len() {
            return false;
        }

        let next_c = self.source[look];
        next_c.is_alphanumeric()
            || matches!(
                next_c,
                '-' | '"' | '\'' | '`' | '{' | '[' | '(' | '_' | '#' | '$' | '\\'
            )
    }

    fn handle_indentation(&mut self) {
        let mut spaces = 0;
        while let Some(c) = self.peek() {
            match c {
                ' ' => {
                    spaces += 1;
                    self.advance();
                }
                '\t' => {
                    spaces += 4;
                    self.advance();
                }
                _ => break,
            }
        }

        if matches!(self.peek(), Some('\n') | Some('\r')) {
            return;
        }

        if self.peek() == Some('/')
            && (self.peek_next() == Some('|') || self.peek_next() == Some('*'))
        {
            return;
        }

        if !self.context_stack.is_empty() {
            self.is_at_line_start = false;
            self.start = self.current;
            self.start_position = self.position;
            return;
        }

        let last_indent = *self.indent_stack.last().unwrap();
        if spaces > last_indent {
            self.indent_stack.push(spaces);
            self.add_token_raw(TokenType::Indent);
        } else if spaces < last_indent {
            while spaces < *self.indent_stack.last().unwrap() {
                self.indent_stack.pop();
                self.add_token_raw(TokenType::Dedent);
            }
        }

        self.is_at_line_start = false;
        self.start = self.current;
        self.start_position = self.position;
    }

    fn handle_operator(&mut self, c: char) {
        let op = match_operator(c, self.peek(), self.peek_next());
        match op.token_type {
            TokenType::LineComment => {
                for _ in 0..op.consume_count {
                    self.advance();
                }
                while self.peek() != Some('\n') && !self.is_at_end() {
                    self.advance();
                }
            }
            TokenType::BlockComment => {
                for _ in 0..op.consume_count {
                    self.advance();
                }
                while !self.is_at_end() {
                    if self.peek() == Some('*') && self.peek_next() == Some('/') {
                        self.advance();
                        self.advance();
                        break;
                    }
                    self.advance();
                }
            }
            _ => {
                for _ in 0..op.consume_count {
                    self.advance();
                }
                self.add_token(op.token_type);
            }
        }
    }

    fn advance(&mut self) -> char {
        let c = self.source[self.current];
        self.current += 1;
        self.position.advance(c);
        c
    }

    fn peek(&self) -> Option<char> {
        self.source.get(self.current).copied()
    }
    fn peek_next(&self) -> Option<char> {
        self.source.get(self.current + 1).copied()
    }
    fn is_at_end(&self) -> bool {
        self.current >= self.source.len()
    }
    fn match_char(&mut self, expected: char) -> bool {
        if self.peek() == Some(expected) {
            self.advance();
            true
        } else {
            false
        }
    }
    fn get_lexeme(&self) -> String {
        self.source[self.start..self.current].iter().collect()
    }
    fn get_slice(&self, start: usize, end: usize) -> String {
        self.source[start..end].iter().collect()
    }

    fn add_token_raw(&mut self, t_type: TokenType) {
        self.tokens
            .push(Token::new(t_type, "".into(), None, self.start_position, 0));
    }
    fn add_token(&mut self, t_type: TokenType) {
        let text = self.get_lexeme();
        let len = text.len();
        self.tokens
            .push(Token::new(t_type, text, None, self.start_position, len));
    }
    fn add_token_with_literal(&mut self, t_type: TokenType, literal: String) {
        let text = self.get_lexeme();
        let len = text.len();
        self.tokens.push(Token::new(
            t_type,
            text,
            Some(literal),
            self.start_position,
            len,
        ));
    }

    fn report_error(&mut self, error_type: LexicalErrorType, message: &str) {
        self.errors.push(LexicalError {
            message: message.to_string(),
            position: self.start_position,
            error_type,
        });
        self.add_token(TokenType::Error);
    }
}

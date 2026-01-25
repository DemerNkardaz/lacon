use crate::lexer::keywords::get_keyword_token;
use crate::lexer::operators::{OpMatch, match_operator};
use crate::lexer::position::Position;
use crate::lexer::token::Token;
use crate::lexer::token_type::TokenType;

pub struct Scanner {
    source: Vec<char>,
    tokens: Vec<Token>,
    start: usize,
    current: usize,
    position: Position,
    indent_stack: Vec<usize>,
    context_stack: Vec<TokenType>,
    is_at_line_start: bool,
}

impl Scanner {
    pub fn new(source: String) -> Self {
        Self {
            source: source.chars().collect(),
            tokens: Vec::new(),
            start: 0,
            current: 0,
            position: Position::start(),
            indent_stack: vec![0],
            context_stack: Vec::new(),
            is_at_line_start: true,
        }
    }

    pub fn scan_tokens(&mut self) -> &Vec<Token> {
        self.tokens.push(Token::new(
            TokenType::BOF,
            "".to_string(),
            None,
            self.position,
            0,
        ));

        while !self.is_at_end() {
            self.start = self.current;
            if self.is_at_line_start {
                self.handle_indentation();
            }
            if !self.is_at_end() {
                self.scan_token();
            }
        }

        while self.indent_stack.len() > 1 {
            self.indent_stack.pop();
            self.add_token(TokenType::Dedent);
        }

        self.tokens.push(Token::eof(self.position));
        &self.tokens
    }

    fn scan_token(&mut self) {
        let c = self.advance();

        match c {
            ' ' | '\t' => {
                if self.is_assign_whitespace() {
                    self.add_token(TokenType::Whitespace);
                }
                self.start = self.current;
            }
            '\r' => {
                self.start = self.current;
            }
            '\n' => {
                self.add_token(TokenType::Newline);
                self.is_at_line_start = true;
                self.start = self.current;
            }

            '"' => self.scan_string(),

            // Исправленная обработка комментариев
            '/' => {
                if self.peek() == Some('/') {
                    self.skip_line_comment();
                } else if self.peek() == Some('*') {
                    self.skip_block_comment();
                } else {
                    self.handle_operator(c);
                }
            }

            '(' => {
                self.context_stack.push(TokenType::LeftParen);
                self.handle_operator(c);
            }
            ')' => {
                if !self.context_stack.is_empty() {
                    self.context_stack.pop();
                }
                self.handle_operator(c);
            }
            '{' => {
                self.context_stack.push(TokenType::LeftBrace);
                self.handle_operator(c);
            }
            '}' => {
                if !self.context_stack.is_empty() {
                    self.context_stack.pop();
                }
                self.handle_operator(c);
            }
            '[' => {
                self.context_stack.push(TokenType::LeftBracket);
                self.handle_operator(c);
            }
            ']' => {
                if !self.context_stack.is_empty() {
                    self.context_stack.pop();
                }
                self.handle_operator(c);
            }

            _ => {
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

    fn skip_line_comment(&mut self) {
        while self.peek() != Some('\n') && !self.is_at_end() {
            self.advance();
        }
        self.start = self.current; // Игнорируем текст комментария
    }

    fn skip_block_comment(&mut self) {
        self.advance(); // Поглотить '*'
        while !self.is_at_end() {
            if self.peek() == Some('*') && self.peek_next() == Some('/') {
                self.advance(); // *
                self.advance(); // /
                break;
            }
            self.advance();
        }
        self.start = self.current; // Игнорируем текст комментария
    }

    fn is_assign_whitespace(&self) -> bool {
        let last_token_type = self.tokens.last().map(|t| &t.token_type);

        // Теперь учитываем строки и числа для whitespace-присваивания
        if !matches!(
            last_token_type,
            Some(TokenType::Identifier)
                | Some(TokenType::RightParen)
                | Some(TokenType::RightBracket)
                | Some(TokenType::String)
                | Some(TokenType::MultilineString)
                | Some(TokenType::Number)
                | Some(TokenType::UnitPercent)
                | Some(TokenType::UnitDegree)
        ) {
            return false;
        }

        let mut look_ahead = self.current;
        while look_ahead < self.source.len() {
            let next_c = self.source[look_ahead];
            if next_c == ' ' || next_c == '\t' {
                look_ahead += 1;
                continue;
            }
            // Комментарий или новая строка отменяют присваивание в строке
            if next_c == '\n' || next_c == '\r' || next_c == '/' {
                return false;
            }

            return next_c.is_alphanumeric()
                || next_c == '"'
                || next_c == '{'
                || next_c == '['
                || next_c == '('
                || next_c == '_'
                || next_c == '$'
                || next_c == '#';
        }
        false
    }

    fn handle_indentation(&mut self) {
        let mut spaces = 0;
        while let Some(c) = self.peek() {
            if c == ' ' {
                spaces += 1;
                self.advance();
            } else if c == '\t' {
                spaces += 4;
                self.advance();
            } else {
                break;
            }
        }

        self.start = self.current;

        // Если это пустая строка или комментарий — не меняем уровень отступа
        if let Some('\n') | Some('\r') = self.peek() {
            return;
        }
        if self.peek() == Some('/')
            && (self.peek_next() == Some('/') || self.peek_next() == Some('*'))
        {
            return;
        }

        let last_indent = *self.indent_stack.last().unwrap();
        if spaces > last_indent {
            self.indent_stack.push(spaces);
            self.add_token(TokenType::Indent);
        } else if spaces < last_indent {
            while spaces < *self.indent_stack.last().unwrap() {
                self.indent_stack.pop();
                self.add_token(TokenType::Dedent);
            }
        }
        self.is_at_line_start = false;
        self.start = self.current;
    }

    fn handle_operator(&mut self, c: char) {
        let next = self.peek();
        let next_next = self.peek_next();
        let op_match = match_operator(c, next, next_next);

        if op_match.token_type == TokenType::Unknown {
            if c == '-' || c == '_' {
                self.scan_identifier();
            } else {
                self.add_token(TokenType::Error);
            }
        } else {
            for _ in 0..op_match.consume_count {
                self.advance();
            }
            self.add_token(op_match.token_type);
        }
    }

    fn scan_identifier(&mut self) {
        while let Some(c) = self.peek() {
            if c.is_alphanumeric() || c == '_' || c == '-' {
                self.advance();
            } else {
                break;
            }
        }
        let text: String = self.source[self.start..self.current].iter().collect();
        let t_type = get_keyword_token(&text).unwrap_or(TokenType::Identifier);
        self.add_token(t_type);
    }

    fn scan_number(&mut self) {
        while let Some(c) = self.peek() {
            if c.is_digit(10) {
                self.advance();
            } else {
                break;
            }
        }
        if self.peek() == Some('.') && self.peek_next().map_or(false, |c| c.is_digit(10)) {
            self.advance();
            while let Some(c) = self.peek() {
                if c.is_digit(10) {
                    self.advance();
                } else {
                    break;
                }
            }
        }

        let number_value: String = self.source[self.start..self.current].iter().collect();

        if let Some(c) = self.peek() {
            if c.is_alphabetic() || c == '%' {
                let unit_start = self.current;
                if c == '%' {
                    self.advance();
                    self.add_token_with_literal(TokenType::UnitPercent, number_value);
                    return;
                }
                while let Some(nc) = self.peek() {
                    if nc.is_alphabetic() {
                        self.advance();
                    } else {
                        break;
                    }
                }
                let unit: String = self.source[unit_start..self.current].iter().collect();
                if let Some(unit_type) = get_keyword_token(&unit) {
                    self.add_token_with_literal(unit_type, number_value);
                    return;
                }
            }
        }
        self.add_token_with_literal(TokenType::Number, number_value);
    }

    fn scan_string(&mut self) {
        if self.peek() == Some('"') && self.peek_next() == Some('"') {
            self.advance(); // второй "
            self.advance(); // третий "
            self.scan_multiline_string();
            return;
        }
        while let Some(c) = self.peek() {
            if c == '"' {
                break;
            }
            self.advance();
        }
        if self.is_at_end() {
            self.add_token(TokenType::Error);
            return;
        }
        self.advance(); // закрывающая кавычка
        let value: String = self.source[self.start + 1..self.current - 1]
            .iter()
            .collect();
        self.add_token_with_literal(TokenType::String, value);
    }

    fn scan_multiline_string(&mut self) {
        while !self.is_at_end() {
            if self.peek() == Some('"')
                && self.peek_next() == Some('"')
                && self.source.get(self.current + 2) == Some(&'"')
            {
                break;
            }
            self.advance();
        }
        if self.is_at_end() {
            self.add_token(TokenType::Error);
            return;
        }
        // Поглощаем """
        for _ in 0..3 {
            self.advance();
        }
        let value: String = self.source[self.start + 3..self.current - 3]
            .iter()
            .collect();
        self.add_token_with_literal(TokenType::MultilineString, value);
    }

    fn is_at_end(&self) -> bool {
        self.current >= self.source.len()
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

    fn add_token(&mut self, t_type: TokenType) {
        let text: String = self.source[self.start..self.current].iter().collect();
        self.tokens.push(Token::new(
            t_type,
            text,
            None,
            self.position,
            self.current - self.start,
        ));
    }

    fn add_token_with_literal(&mut self, t_type: TokenType, literal: String) {
        let text: String = self.source[self.start..self.current].iter().collect();
        self.tokens.push(Token::new(
            t_type,
            text,
            Some(literal),
            self.position,
            self.current - self.start,
        ));
    }
}

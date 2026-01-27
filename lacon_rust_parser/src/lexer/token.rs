use crate::lexer::position::Position;
use crate::lexer::token_type::TokenType;
use bitflags::bitflags;
use std::fmt;

bitflags! {
    /// Набор компактных флагов для токена (занимает 1 байт)
    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub struct TokenFlags: u8 {
        /// Токен является первым значимым элементом на строке
        const AT_LINE_START = 0b0000_0001;
        /// Перед токеном был хотя бы один пробельный символ
        const HAS_PRECEDING_WHITESPACE = 0b0000_0010;
    }
}

/// Структура Token представляет собой минимальную лексическую единицу языка Lacon.
#[derive(Debug, Clone, PartialEq)]
pub struct Token {
    // Сначала крупные поля (указатели/String)
    pub lexeme: String,
    pub literal: Option<String>,
    pub position: Position,

    // Затем мелкие поля для плотной упаковки
    pub token_type: TokenType,
    pub length: u32,
    pub flags: TokenFlags,
}

impl Token {
    /// Создает новый токен.
    pub fn new(
        token_type: TokenType,
        is_at_line_start: bool,
        has_whitespace: bool,
        lexeme: String,
        literal: Option<String>,
        position: Position,
        length: usize,
    ) -> Self {
        let mut flags = TokenFlags::empty();
        if is_at_line_start {
            flags.insert(TokenFlags::AT_LINE_START);
        }
        if has_whitespace {
            flags.insert(TokenFlags::HAS_PRECEDING_WHITESPACE);
        }

        Self {
            token_type,
            lexeme,
            literal,
            position,
            length: length as u32, // Приводим usize к u32
            flags,
        }
    }

    /// Создает токен конца файла.
    pub fn eof(position: Position) -> Self {
        Self {
            token_type: TokenType::EOF,
            lexeme: String::new(),
            literal: None,
            position,
            length: 0,
            flags: TokenFlags::empty(),
        }
    }

    /// Вспомогательный метод для создания токена ошибки.
    pub fn error(message: String, position: Position) -> Self {
        Self {
            token_type: TokenType::Error,
            lexeme: message,
            literal: None,
            position,
            length: 0,
            flags: TokenFlags::empty(),
        }
    }
}

impl fmt::Display for Token {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let literal_str = match &self.literal {
            Some(l) => format!(" (value: {})", l),
            None => String::new(),
        };

        let mut markers = String::new();
        if self.flags.contains(TokenFlags::AT_LINE_START) {
            markers.push_str(" [SOL]"); // Start of Line
        }
        if self.flags.contains(TokenFlags::HAS_PRECEDING_WHITESPACE) {
            markers.push_str(" [WS]"); // Whitespace
        }

        write!(
            f,
            "[{:?}{}] '{}'{} at {}",
            self.token_type, markers, self.lexeme, literal_str, self.position
        )
    }
}

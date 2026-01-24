use crate::lexer::position::Position;
use crate::lexer::token_type::TokenType;
use std::fmt;

/// Структура Token представляет собой минимальную лексическую единицу языка Lacon.
#[derive(Debug, Clone, PartialEq)]
pub struct Token {
    /// Тип токена из расширенного перечисления TokenType
    pub token_type: TokenType,

    /// Исходный текст токена из кода (например, "180deg" или "function")
    pub lexeme: String,

    /// Опциональное типизированное значение.
    /// Для строк здесь хранится текст без кавычек, для чисел — строковое представление для парсера.
    pub literal: Option<String>,

    /// Точное местоположение токена в исходном коде
    pub position: Position,

    /// Длина токена в символах (для удобства диагностики и IDE)
    pub length: usize,
}

impl Token {
    /// Создает новый токен.
    pub fn new(
        token_type: TokenType,
        lexeme: String,
        literal: Option<String>,
        position: Position,
        length: usize,
    ) -> Self {
        Self {
            token_type,
            lexeme,
            literal,
            position,
            length,
        }
    }

    /// Создает токен конца файла.
    pub fn eof(position: Position) -> Self {
        Self {
            token_type: TokenType::EOF,
            lexeme: String::from(""),
            literal: None,
            position,
            length: 0,
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
        }
    }
}

impl fmt::Display for Token {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let literal_str = match &self.literal {
            Some(l) => format!(" (value: {})", l),
            None => String::new(),
        };

        write!(
            f,
            "[{:?}] '{}'{} at {}",
            self.token_type, self.lexeme, literal_str, self.position
        )
    }
}

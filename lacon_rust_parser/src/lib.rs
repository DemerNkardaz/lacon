// pub mod ast;
// pub mod interpreter;
// pub mod lexer;
// // use crate::interpretator::*;
// use wasm_bindgen::prelude::*;

// #[wasm_bindgen]
// pub fn add(left: u64, right: u64) -> u64 {
//     left + right
// }

// #[wasm_bindgen]
// pub fn greet(name: &str) -> String {
//     format!("Привет, {}! Rust + WASM + VS Code работают сообща.", name)
// }

// #[cfg(test)]
// mod tests {
//     use super::*;

//     #[test]
//     fn it_works() {
//         let result = add(2, 2);
//         assert_eq!(result, 4);
//     }
// }

pub mod lexer;

#[cfg(test)]
mod tests {
    use crate::lexer::scanner::Scanner;
    use std::fs::File;
    use std::io::Write;

    #[test]
    fn test_lexer_to_file() {
        // Твой тестовый код
        let source = r#"
// 1. Неоднозначность минуса: вычитание vs часть имени
a - b      // Вычитание (Identifier, Operator, Identifier)
a-b        // Единый идентификатор (Identifier)
a -2       // Whitespace-присваивание отрицательного числа?

// 2. Сложные отступы и пустые строки
if true
    
    // Пустые строки с пробелами внутри не должны ломать Indent/Dedent
    
    sub-block
        
        target
    
// Резкий выход из двойной вложенности

// 3. Крайние случаи Whitespace-присваивания
key(arg) value    // После закрывающей скобки
list[0] item      // После квадратной скобки
"string" property // После строки (может ли строка быть ключом?)

// 4. Слипшиеся операторы и точки
Math.sqrt(2).to-string()
1..10 // Диапазон (если поддерживается) или ошибка?
#abc+10% // Цвет + Оператор + Процент

// 5. Комментарии в неожиданных местах
let x /* комментарий */ 10
"#;

        let mut scanner = Scanner::new(source.to_string());
        let tokens = scanner.scan_tokens();

        let mut file = File::create("lexer_test.txt").expect("Не удалось создать файл");

        writeln!(
            file,
            "{:<20} | {:<15} | {:<10}",
            "TYPE", "LEXEME", "LITERAL"
        )
        .unwrap();
        writeln!(file, "{}", "-".repeat(50)).unwrap();

        for token in tokens {
            let literal_str = match &token.literal {
                Some(l) => l.clone(),
                None => "None".to_string(),
            };

            writeln!(
                file,
                "{:<20} | {:<15} | {:<10}",
                format!("{:?}", token.token_type),
                token.lexeme.replace("\n", "\\n"),
                literal_str
            )
            .unwrap();
        }
    }
}

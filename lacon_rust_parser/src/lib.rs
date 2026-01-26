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
        let source = r#"
a - b     
a-b       
a -2      
a - 2       
a b - 2       
a b -2  

global const const-name a - b     
global const const-name a-b       
global const const-name a -2      
global const const-name a - 2       
global const const-name a b - 2       
global const const-name a b -2  
/|\ 1. Смешанный режим: отступы + явные скобки
container App
    /|\ Внутри App работают отступы
    styles {
        /|\ Внутри скобок отступы могут плавать
        width: 100%
    padding: 20px
          color: #fff
    }

    /|\ Снова возвращаемся к строгим отступам
    logic
        if status == "active"
            opacity -1.0
        else
            opacity 0

/|\ 2. Тест "слипшихся" отрицательных чисел и операторов
calc-result = base-val -5 --2 + -10%
/|\ Ожидаем: [id(calc-result), eq, id(base-val), ws, num(-5), minus, num(-2), plus, num(-10%)]

/|\ 3. Многострочные строки и вызовы в цепочке
text-data = """
    Line 1
    Line 2
    """.trim().to-upper()

/|\ 4. Крайний случай индентации и пустых строк
root
    level1
        
        /|\ Комментарий на пустой строке не должен прерывать блок
        level2
            target-node

/|\ 5. Ловушка для комментариев и операторов
x = 10 / 2 /* деление */ + 5 /|\ сумма
y = (5 * 2)z /|\ Whitespace-assign после скобок
private const superstring<String> = "this is \"super\" string"

let speed 278mi/h
let length 25pc
const generator-power 15kW
const vector-shield-dimension 2D
const fule-energy 1.5MJ

let string "string"
let string 'string'
let string `string`
let interpolated-string "string with ${first-word} and ${second-word}, \${escaped}"

const first-word snow
const second-word=fall
const winter-${first-word}${second-word} #dbebed
const winter-${first-word}-${second-word} #dbebed
const winter-${first-word}_${second-word} #dbebed
winter-${a}-${b} value
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

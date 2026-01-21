/**
 * Препроцессор LACON - обработка директив и функций перед парсингом
 */

import { expandEmitDirective, expandEmitBlock, parseEmitDirective } from './directives/emit-parser';
import { unwrapQuotes } from './utils';

/**
 * Извлекает глобальные переменные из текста (для препроцессора)
 */
function extractGlobalVariables(lines: string[]): Record<string, string> {
    const vars: Record<string, string> = {};
    const varRegex = /^\s*\$(\w[\w-]+)\s+(.+)$/;

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('/*')) {
            continue;
        }

        const match = trimmed.match(varRegex);
        if (match) {
            const [, varName, value] = match;
            vars[varName] = unwrapQuotes(value.trim());
        }
    }

    return vars;
}

/**
 * Препроцессинг текста LACON:
 * 1. Извлекает глобальные переменные
 * 2. Раскрывает директивы <emit>
 * 3. Обрабатывает функции @f
 */
export function preprocessLacon(text: string): string {
    const lines = text.split('\n');
    const globalVars = extractGlobalVariables(lines);
    const result: string[] = [];

    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();

        // Пропускаем комментарии
        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
            result.push(line);
            i++;
            continue;
        }

        // Проверяем, есть ли директива <emit>
        if (trimmed.includes('<emit:')) {
            const directive = parseEmitDirective(line);
            
            if (directive) {
                // Получаем следующую строку для проверки
                const nextLine = i + 1 < lines.length ? lines[i + 1] : undefined;
                
                // Проверяем, это блок или просто строка
                // Блок - если после директивы есть { в restOfLine или на следующей строке
                const hasOpenBrace = directive.restOfLine.trim().endsWith('{');
                const nextLineHasBrace = nextLine && nextLine.trim().endsWith('{');
                
                if (hasOpenBrace || nextLineHasBrace) {
                    // Это блок - раскрываем блок
                    const { expandedLines, endIndex } = expandEmitBlock(lines, i, globalVars);
                    result.push(...expandedLines);
                    i = endIndex + 1; // Пропускаем закрывающую скобку
                } else {
                    // Это просто строка
                    const indent = line.match(/^(\s*)/)?.[1] || '';
                    const { lines: expanded, consumedNextLine } = expandEmitDirective(
                        line,
                        nextLine,
                        globalVars,
                        indent
                    );
                    result.push(...expanded);
                    i++;
                    // Если следующая строка была использована как ключ, пропускаем её
                    if (consumedNextLine) {
                        i++;
                    }
                }
            } else {
                // Не смогли распарсить директиву, оставляем как есть
                result.push(line);
                i++;
            }
        } else {
            result.push(line);
            i++;
        }
    }

    return result.join('\n');
}
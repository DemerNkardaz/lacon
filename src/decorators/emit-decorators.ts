/**
 * Декораторы для emit директив
 */

import * as vscode from 'vscode';
import * as l10n from '@vscode/l10n';
import { parseEmitDirective } from '../laconToJson/directives/emit-parser';
import { createDecoratorStyle, createDecorationOptions, COLOR_SCHEMES } from './styles';
import { DecoratorContext } from './types';

/**
 * Создает декораторы для emit директив на видимых строках
 * @param context - Контекст декоратора
 * @param visibleRange - Видимый диапазон редактора
 * @param activeLines - Набор активных строк (с курсором)
 * @returns Массив опций декораторов
 */
export function createEmitDecorators(
  context: DecoratorContext,
  visibleRange: vscode.Range,
  activeLines: Set<number>
): vscode.DecorationOptions[] {
  const decorations: vscode.DecorationOptions[] = [];
  const { editor } = context;

  const startLine = Math.max(0, visibleRange.start.line - 5);
  const endLine = Math.min(editor.document.lineCount - 1, visibleRange.end.line + 5);

  for (let i = startLine; i <= endLine; i++) {
    if (activeLines.has(i)) continue;

    const line = editor.document.lineAt(i);
    if (!line.text.includes('<emit:')) continue;

    const directive = parseEmitDirective(line.text);
    if (!directive) continue;

    // 1. Вычисляем общее количество итераций (абсолютная разница)
    const count = Math.abs(directive.end - directive.start);
    
    // 2. Определяем шаг (1 или -1) на основе направления
    const step = directive.direction === '+' ? 1 : -1;

    // 3. Вычисляем последнее значение, которое будет выведено
    // Если count = 1, то actualEnd = start
    // Если count > 1, то идем от start на (count - 1) шагов
    const actualEnd = count > 0 
      ? directive.start + step * (count - 1) 
      : directive.start;

    let startStr: string, endStr: string;

    if (directive.isHex) {
      startStr = formatHex(directive.start);
      endStr = formatHex(actualEnd);
    } else {
      startStr = formatDecimal(directive.start);
      endStr = formatDecimal(actualEnd);
    }

    const label = `${count} ${l10n.t('emit.entries')} [ ${startStr}...${endStr} ]`;
    const emitStart = line.text.indexOf('<emit:');
    const emitEnd = line.text.indexOf('>', emitStart) + 1;

    const style = createDecoratorStyle({
      contentText: label,
      fontStyle: 'normal',
      ...COLOR_SCHEMES.emit,
    });

    decorations.push(createDecorationOptions(new vscode.Range(i, emitStart, i, emitEnd), style));
  }

  return decorations;
}

/**
 * Форматирует число в Hex с правильным отображением отрицательного знака
 */
function formatHex(value: number): string {
  const prefix = value < 0 ? '\u2212' : '';
  const hex = Math.abs(value).toString(16).toUpperCase().padStart(4, '0');
  return `${prefix}${hex}`;
}

/**
 * Форматирует десятичное число с использованием типографского минуса
 */
function formatDecimal(value: number): string {
  return value < 0 ? `\u2212${Math.abs(value)}` : value.toString();
}
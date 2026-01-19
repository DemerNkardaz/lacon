"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LaconJsonProvider = void 0;
const vscode = require("vscode");
const laconToJson_1 = require("./laconToJson");
class LaconJsonProvider {
    constructor() {
        this._onDidChange = new vscode.EventEmitter();
        this.onDidChange = this._onDidChange.event;
    }
    /**
     * Вызывает обновление контента провайдера.
     */
    update(uri) {
        setImmediate(() => {
            this._onDidChange.fire(uri);
        });
    }
    /**
     * Основной метод, который генерирует JSON для предпросмотра.
     */
    provideTextDocumentContent(uri) {
        // Извлекаем URI исходного .lacon файла из параметров запроса
        const sourceUriString = decodeURIComponent(uri.query);
        const sourceUri = vscode.Uri.parse(sourceUriString);
        // Пытаемся найти открытый документ в редакторе
        const document = vscode.workspace.textDocuments.find(d => d.uri.toString() === sourceUri.toString());
        if (!document) {
            return JSON.stringify({
                error: "Source document not found",
                uri: sourceUri.toString()
            }, null, 2);
        }
        try {
            /**
             * Вызываем парсер.
             * Передаем getText() для текущего содержимого (даже если оно не сохранено)
             * и document.uri.fsPath, чтобы парсер мог найти папку для @import.
             */
            return (0, laconToJson_1.laconToJson)(document.getText(), document.uri.fsPath);
        }
        catch (e) {
            return JSON.stringify({
                error: "Parser error",
                message: e.message || String(e),
                details: "Check if all @import paths are correct and there are no circular dependencies."
            }, null, 2);
        }
    }
}
exports.LaconJsonProvider = LaconJsonProvider;
LaconJsonProvider.scheme = 'lacon-json';
//# sourceMappingURL=previewProvider.js.map
import  {window, TextEditor, Range, Position} from 'vscode';

export function addDeco (
    contentText: string,
    line: number,
    column: number,
    activeEditor: TextEditor
  )  {
    const decorationType = window.createTextEditorDecorationType({
      after: {
        contentText,
        margin: "20px",
      },
    });
  
    const range = new Range(
      new Position(line, column),
      new Position(line, column)
    );
  
    activeEditor.setDecorations(decorationType, [{ range }]);
  };
﻿import * as ts from "typescript";
import * as errors from "./../errors";
import {Node, SourceFile} from "./../compiler";
import {getInsertErrorMessageText} from "./getInsertErrorMessageText";

export function insertCreatingSyntaxList(sourceFile: SourceFile, insertPos: number, newText: string) {
    const compilerFactory = sourceFile.global.compilerFactory;
    const currentText = sourceFile.getFullText();
    const newFileText = currentText.substring(0, insertPos) + newText + currentText.substring(insertPos);
    const tempSourceFile = compilerFactory.createTempSourceFileFromText(newFileText, sourceFile.getFilePath());

    handleNode(sourceFile, tempSourceFile);

    function handleNode(currentNode: Node, newNode: Node) {
        /* istanbul ignore if */
        if (currentNode.getKind() !== newNode.getKind())
            throw new errors.InvalidOperationError(getInsertErrorMessageText("Error creating syntax list!", currentNode, newNode));

        const currentNodeChildren = currentNode.getChildrenIterator();
        const newNodeChildren = newNode.getChildrenIterator();
        let currentNodeChildIteratorResult = currentNodeChildren.next();

        for (const newNodeChild of newNodeChildren) {
            if (newNodeChild.getKind() === ts.SyntaxKind.SyntaxList && currentNodeChildIteratorResult.value.getKind() !== ts.SyntaxKind.SyntaxList) {
                newNodeChild.setSourceFile(sourceFile);
                continue;
            }

            handleNode(currentNodeChildIteratorResult.value, newNodeChild);
            currentNodeChildIteratorResult = currentNodeChildren.next();
        }

        compilerFactory.replaceCompilerNode(currentNode, newNode.compilerNode);
    }
}

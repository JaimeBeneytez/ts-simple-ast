﻿import {expect} from "chai";
import {VariableStatement} from "./../../../compiler";
import {InitializerExpressionableNodeStructure} from "./../../../structures";
import {getInfoFromText} from "./../../compiler/testHelpers";
import {fillInitializerExpressionableNodeFromStructure} from "./../../../manipulation/fillMixinFunctions";

function doTest(startingCode: string, structure: InitializerExpressionableNodeStructure, expectedCode: string) {
    const {firstChild, sourceFile} = getInfoFromText<VariableStatement>(startingCode);
    const firstDeclaration = firstChild.getDeclarationList().getDeclarations()[0];
    fillInitializerExpressionableNodeFromStructure(firstDeclaration, structure);
    expect(sourceFile.getText()).to.equal(expectedCode);
}

describe(nameof(fillInitializerExpressionableNodeFromStructure), () => {
    it("should modify when setting", () => {
        doTest("var num = 5;", { initializer: "4" }, "var num = 4;");
    });

    it("should not modify anything if the structure doesn't change anything", () => {
        doTest("var num = 5;", {}, "var num = 5;");
    });
});

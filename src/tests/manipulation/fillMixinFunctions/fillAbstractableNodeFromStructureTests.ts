﻿import {expect} from "chai";
import {ClassDeclaration} from "./../../../compiler";
import {AbstractableNodeStructure} from "./../../../structures";
import {getInfoFromText} from "./../../compiler/testHelpers";
import {fillAbstractableNodeFromStructure} from "./../../../manipulation/fillMixinFunctions";

function doTest(startingCode: string, structure: AbstractableNodeStructure, expectedCode: string) {
    const {firstChild, sourceFile} = getInfoFromText<ClassDeclaration>(startingCode);
    fillAbstractableNodeFromStructure(firstChild, structure);
    expect(firstChild.getText()).to.equal(expectedCode);
}

describe(nameof(fillAbstractableNodeFromStructure), () => {
    it("should not modify anything if the structure doesn't change anything", () => {
        doTest("class MyClass {}", {}, "class MyClass {}");
    });

    it("should not modify anything if the structure doesn't change anything and the node has everything set", () => {
        doTest("abstract class MyClass {}", {}, "abstract class MyClass {}");
    });

    it("should modify when setting as abstract", () => {
        doTest("class MyClass {}", { isAbstract: true }, "abstract class MyClass {}");
    });
});

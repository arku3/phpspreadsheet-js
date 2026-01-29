import { expect, test, describe } from "bun:test";
import { RichText } from "../../src/rich-text/rich-text.ts";
import { Run } from "../../src/rich-text/run.ts";
import { TextElement } from "../../src/rich-text/text-element.ts";
import { Font } from "../../src/style/font.ts";
import { Color } from "../../src/style/color.ts";

describe("RichText", () => {
    test("TextElement basic functionality", () => {
        const te = new TextElement("Hello");
        expect(te.getText()).toBe("Hello");
        expect(te.getFont()).toBeNull();
        
        te.setText("World");
        expect(te.getText()).toBe("World");
        
        const hash1 = te.getHashCode();
        te.setText("Hello");
        const hash2 = te.getHashCode();
        expect(hash1).not.toBe(hash2);
    });

    test("Run basic functionality", () => {
        const run = new Run("Hello");
        expect(run.getText()).toBe("Hello");
        expect(run.getFont()).toBeInstanceOf(Font);
        
        const font = run.getFont()!;
        font.setBold(true);
        font.getColor().setARGB(Color.COLOR_RED);
        
        expect(font.getBold()).toBe(true);
        expect(font.getColor().getARGB()).toBe(Color.COLOR_RED);
        
        const hash1 = run.getHashCode();
        font.setBold(false);
        const hash2 = run.getHashCode();
        expect(hash1).not.toBe(hash2);
    });

    test("RichText composition", () => {
        const rt = new RichText();
        rt.createText("Hello ");
        const run = rt.createTextRun("World");
        run.getFont()?.setBold(true);
        
        expect(rt.getPlainText()).toBe("Hello World");
        expect(rt.toString()).toBe("Hello World");
        expect(rt.getRichTextElements()).toHaveLength(2);
        expect(rt.getRichTextElements()[0]).toBeInstanceOf(TextElement);
        expect(rt.getRichTextElements()[1]).toBeInstanceOf(Run);
        
        const hash1 = rt.getHashCode();
        run.getFont()?.setBold(false);
        const hash2 = rt.getHashCode();
        expect(hash1).not.toBe(hash2);
    });
});

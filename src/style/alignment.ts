import { createHash } from 'node:crypto';
import { Supervisor } from './supervisor.ts';

/**
 * Alignment style.
 */
export class Alignment extends Supervisor {
    // Rotation constants
    public static readonly TEXTROTATION_STACK_EXCEL = 255;
    public static readonly TEXTROTATION_STACK_PHPSPREADSHEET = -165;

    // Horizontal alignment styles
    public static readonly HORIZONTAL_GENERAL = 'general';
    public static readonly HORIZONTAL_LEFT = 'left';
    public static readonly HORIZONTAL_RIGHT = 'right';
    public static readonly HORIZONTAL_CENTER = 'center';
    public static readonly HORIZONTAL_CENTER_CONTINUOUS = 'centerContinuous';
    public static readonly HORIZONTAL_JUSTIFY = 'justify';
    public static readonly HORIZONTAL_FILL = 'fill';
    public static readonly HORIZONTAL_DISTRIBUTED = 'distributed';

    // Vertical alignment styles
    public static readonly VERTICAL_BOTTOM = 'bottom';
    public static readonly VERTICAL_TOP = 'top';
    public static readonly VERTICAL_CENTER = 'center';
    public static readonly VERTICAL_JUSTIFY = 'justify';
    public static readonly VERTICAL_DISTRIBUTED = 'distributed';

    // Read order
    public static readonly READORDER_CONTEXT = 0;
    public static readonly READORDER_LTR = 1;
    public static readonly READORDER_RTL = 2;

    /**
     * Horizontal alignment.
     */
    #horizontal: string = Alignment.HORIZONTAL_GENERAL;

    /**
     * Vertical alignment.
     */
    #vertical: string = Alignment.VERTICAL_BOTTOM;

    /**
     * Text rotation.
     */
    #textRotation: number = 0;

    /**
     * Wrap text.
     */
    #wrapText: boolean = false;

    /**
     * Shrink to fit.
     */
    #shrinkToFit: boolean = false;

    /**
     * Indent.
     */
    #indent: number = 0;

    /**
     * Read order.
     */
    #readOrder: number = 0;

    /**
     * Justify last line.
     */
    #justifyLastLine: boolean = false;

    constructor(isSupervisor: boolean = false) {
        super(isSupervisor);
    }

    /**
     * Get shared component.
     */
    public getSharedComponent(): Alignment {
        if (!this.parent) {
            throw new Error('No parent found.');
        }
        return (this.parent as any).getSharedComponent().getAlignment();
    }

    /**
     * Build style array from subcomponents.
     */
    public getStyleArray(array: any): any {
        return { alignment: array };
    }

    /**
     * Get horizontal.
     */
    public getHorizontal(): string {
        if (this.isSupervisor) {
            return this.getSharedComponent().getHorizontal();
        }
        return this.#horizontal;
    }

    /**
     * Set horizontal.
     */
    public setHorizontal(horizontal: string): this {
        if (this.isSupervisor) {
            const styleArray = this.getStyleArray({ horizontal: horizontal });
            (this.parent as any).applyFromArray(styleArray);
        } else {
            this.#horizontal = horizontal;
        }
        return this;
    }

    /**
     * Get vertical.
     */
    public getVertical(): string {
        if (this.isSupervisor) {
            return this.getSharedComponent().getVertical();
        }
        return this.#vertical;
    }

    /**
     * Set vertical.
     */
    public setVertical(vertical: string): this {
        if (this.isSupervisor) {
            const styleArray = this.getStyleArray({ vertical: vertical });
            (this.parent as any).applyFromArray(styleArray);
        } else {
            this.#vertical = vertical;
        }
        return this;
    }

    /**
     * Get text rotation.
     */
    public getTextRotation(): number {
        if (this.isSupervisor) {
            return this.getSharedComponent().getTextRotation();
        }
        return this.#textRotation;
    }

    /**
     * Set text rotation.
     */
    public setTextRotation(rotation: number): this {
        if (!Number.isFinite(rotation) || !Number.isInteger(rotation)) {
            throw new Error('Text rotation should be a value between -90 and 90.');
        }

        // Excel2007 value 255 => PhpSpreadsheet value -165
        let normalized = rotation;
        if (normalized === Alignment.TEXTROTATION_STACK_EXCEL) {
            normalized = Alignment.TEXTROTATION_STACK_PHPSPREADSHEET;
        }

        if (!((normalized >= -90 && normalized <= 90) || normalized === Alignment.TEXTROTATION_STACK_PHPSPREADSHEET)) {
            throw new Error('Text rotation should be a value between -90 and 90.');
        }

        if (this.isSupervisor) {
            const styleArray = this.getStyleArray({ textRotation: normalized });
            (this.parent as any).applyFromArray(styleArray);
        } else {
            this.#textRotation = normalized;
        }
        return this;
    }

    /**
     * Get wrap text.
     */
    public getWrapText(): boolean {
        if (this.isSupervisor) {
            return this.getSharedComponent().getWrapText();
        }
        return this.#wrapText;
    }

    /**
     * Set wrap text.
     */
    public setWrapText(wrapText: boolean): this {
        if (this.isSupervisor) {
            const styleArray = this.getStyleArray({ wrapText: wrapText });
            (this.parent as any).applyFromArray(styleArray);
        } else {
            this.#wrapText = wrapText;
        }
        return this;
    }

    /**
     * Get shrink to fit.
     */
    public getShrinkToFit(): boolean {
        if (this.isSupervisor) {
            return this.getSharedComponent().getShrinkToFit();
        }
        return this.#shrinkToFit;
    }

    /**
     * Set shrink to fit.
     */
    public setShrinkToFit(shrinkToFit: boolean): this {
        if (this.isSupervisor) {
            const styleArray = this.getStyleArray({ shrinkToFit: shrinkToFit });
            (this.parent as any).applyFromArray(styleArray);
        } else {
            this.#shrinkToFit = shrinkToFit;
        }
        return this;
    }

    /**
     * Get indent.
     */
    public getIndent(): number {
        if (this.isSupervisor) {
            return this.getSharedComponent().getIndent();
        }
        return this.#indent;
    }

    /**
     * Set indent.
     */
    public setIndent(indent: number): this {
        if (this.isSupervisor) {
            const styleArray = this.getStyleArray({ indent: indent });
            (this.parent as any).applyFromArray(styleArray);
        } else {
            this.#indent = indent;
        }
        return this;
    }

    /**
     * Get read order.
     */
    public getReadOrder(): number {
        if (this.isSupervisor) {
            return this.getSharedComponent().getReadOrder();
        }
        return this.#readOrder;
    }

    /**
     * Set read order.
     */
    public setReadOrder(readOrder: number): this {
        if (this.isSupervisor) {
            const styleArray = this.getStyleArray({ readOrder: readOrder });
            (this.parent as any).applyFromArray(styleArray);
        } else {
            this.#readOrder = readOrder;
        }
        return this;
    }

    /**
     * Get justify last line.
     */
    public getJustifyLastLine(): boolean {
        if (this.isSupervisor) {
            return this.getSharedComponent().getJustifyLastLine();
        }
        return this.#justifyLastLine;
    }

    /**
     * Set justify last line.
     */
    public setJustifyLastLine(justifyLastLine: boolean): this {
        if (this.isSupervisor) {
            const styleArray = this.getStyleArray({ justifyLastLine: justifyLastLine });
            (this.parent as any).applyFromArray(styleArray);
        } else {
            this.#justifyLastLine = justifyLastLine;
        }
        return this;
    }

    /**
     * Apply styles from array.
     *
     * @param styleArray Array containing style information
     */
    public applyFromArray(styleArray: Record<string, unknown>): this {
        if (this.isSupervisor) {
            const styleArrayLocal = this.getStyleArray(styleArray);
            (this.parent as any).applyFromArray(styleArrayLocal);
            return this;
        }

        if (styleArray.horizontal !== undefined) {
            let horizontal = String(styleArray.horizontal).toLowerCase();
            if (horizontal === 'centercontinuous') {
                horizontal = Alignment.HORIZONTAL_CENTER_CONTINUOUS;
            }
            this.setHorizontal(horizontal);
        }
        if (styleArray.vertical !== undefined) {
            this.setVertical(String(styleArray.vertical).toLowerCase());
        }
        if (styleArray.textRotation !== undefined) {
            this.setTextRotation(Number(styleArray.textRotation));
        }
        if (styleArray.wrapText !== undefined) {
            this.setWrapText(Boolean(styleArray.wrapText));
        }
        if (styleArray.shrinkToFit !== undefined) {
            this.setShrinkToFit(Boolean(styleArray.shrinkToFit));
        }
        if (styleArray.indent !== undefined) {
            this.setIndent(Number(styleArray.indent));
        }
        if (styleArray.readOrder !== undefined) {
            this.setReadOrder(Number(styleArray.readOrder));
        }
        if (styleArray.justifyLastLine !== undefined) {
            this.setJustifyLastLine(Boolean(styleArray.justifyLastLine));
        }
        return this;
    }

    /**
     * Get hash code.
     */
    public getHashCode(): string {
        if (this.isSupervisor) {
            return this.getSharedComponent().getHashCode();
        }
        return createHash('md5')
            .update(
                this.#horizontal +
                this.#vertical +
                this.#textRotation +
                (this.#wrapText ? 't' : 'f') +
                (this.#shrinkToFit ? 't' : 'f') +
                this.#indent +
                this.#readOrder +
                (this.#justifyLastLine ? 't' : 'f') +
                'Alignment'
            )
            .digest('hex');
    }
}

import { Color } from '../../style/color.ts';

/**
 * Data label configuration for chart series.
 * Mirrors PhpSpreadsheet Layout data label properties.
 */
export interface DataLabelOptions {
    showValue?: boolean | null;
    showCategoryName?: boolean | null;
    showSeriesName?: boolean | null;
    showPercent?: boolean | null;
    showLegendKey?: boolean | null;
    showBubbleSize?: boolean | null;
    showLeaderLines?: boolean | null;
    position?: DataLabelPosition | null;
    fillColor?: Color | null;
    borderColor?: Color | null;
}

export type DataLabelPosition = 'outEnd' | 'inEnd' | 'ctr' | 'inBase' | 'outBase' | 'bestFit' | 't';

export class DataLabels {
    #showValue: boolean | null = null;
    #showCategoryName: boolean | null = null;
    #showSeriesName: boolean | null = null;
    #showPercent: boolean | null = null;
    #showLegendKey: boolean | null = null;
    #showBubbleSize: boolean | null = null;
    #showLeaderLines: boolean | null = null;
    #position: DataLabelPosition | null = null;
    #fillColor: Color | null = null;
    #borderColor: Color | null = null;

    constructor(options?: DataLabelOptions) {
        if (options) {
            this.#showValue = options.showValue ?? null;
            this.#showCategoryName = options.showCategoryName ?? null;
            this.#showSeriesName = options.showSeriesName ?? null;
            this.#showPercent = options.showPercent ?? null;
            this.#showLegendKey = options.showLegendKey ?? null;
            this.#showBubbleSize = options.showBubbleSize ?? null;
            this.#showLeaderLines = options.showLeaderLines ?? null;
            this.#position = options.position ?? null;
            this.#fillColor = options.fillColor ?? null;
            this.#borderColor = options.borderColor ?? null;
        }
    }

    /** Check if any data label is configured. */
    hasAnyLabel(): boolean {
        return (
            this.#showValue === true ||
            this.#showCategoryName === true ||
            this.#showSeriesName === true ||
            this.#showPercent === true ||
            this.#showLegendKey === true ||
            this.#showBubbleSize === true ||
            this.#showLeaderLines === true
        );
    }

    // Getters and setters
    getShowValue(): boolean | null {
        return this.#showValue;
    }

    setShowValue(value: boolean | null): this {
        this.#showValue = value;
        return this;
    }

    getShowCategoryName(): boolean | null {
        return this.#showCategoryName;
    }

    setShowCategoryName(value: boolean | null): this {
        this.#showCategoryName = value;
        return this;
    }

    getShowSeriesName(): boolean | null {
        return this.#showSeriesName;
    }

    setShowSeriesName(value: boolean | null): this {
        this.#showSeriesName = value;
        return this;
    }

    getShowPercent(): boolean | null {
        return this.#showPercent;
    }

    setShowPercent(value: boolean | null): this {
        this.#showPercent = value;
        return this;
    }

    getShowLegendKey(): boolean | null {
        return this.#showLegendKey;
    }

    setShowLegendKey(value: boolean | null): this {
        this.#showLegendKey = value;
        return this;
    }

    getShowBubbleSize(): boolean | null {
        return this.#showBubbleSize;
    }

    setShowBubbleSize(value: boolean | null): this {
        this.#showBubbleSize = value;
        return this;
    }

    getShowLeaderLines(): boolean | null {
        return this.#showLeaderLines;
    }

    setShowLeaderLines(value: boolean | null): this {
        this.#showLeaderLines = value;
        return this;
    }

    getPosition(): DataLabelPosition | null {
        return this.#position;
    }

    setPosition(position: DataLabelPosition | null): this {
        this.#position = position;
        return this;
    }

    getFillColor(): Color | null {
        return this.#fillColor;
    }

    setFillColor(color: Color | null): this {
        this.#fillColor = color;
        return this;
    }

    getBorderColor(): Color | null {
        return this.#borderColor;
    }

    setBorderColor(color: Color | null): this {
        this.#borderColor = color;
        return this;
    }
}

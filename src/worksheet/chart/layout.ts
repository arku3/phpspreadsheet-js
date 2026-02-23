/**
 * Chart layout settings.
 * Ported from PhpSpreadsheet Chart/Layout.php
 */

import { Font } from '../../style/font.ts';
import { ChartColor } from './chart-color.ts';
import { Properties } from './properties.ts';

export type LayoutTarget = 'inner' | 'outer';
export type LayoutMode = 'edge' | 'factor';

export interface LayoutOptions {
    layoutTarget?: LayoutTarget | string | null;
    xMode?: LayoutMode | string | null;
    yMode?: LayoutMode | string | null;
    x?: number | null;
    y?: number | null;
    w?: number | null;
    h?: number | null;
    dLblPos?: string | null;
    labelFont?: Font | null;
    labelFontColor?: ChartColor | null;
    labelEffects?: Properties | null;
    numFmtCode?: string | null;
    showLegendKey?: boolean | null;
    showVal?: boolean | null;
    showCatName?: boolean | null;
    showSerName?: boolean | null;
    showPercent?: boolean | null;
    showBubbleSize?: boolean | null;
    showLeaderLines?: boolean | null;
    numFmtLinked?: boolean | null;
    labelFillColor?: ChartColor | null;
    labelBorderColor?: ChartColor | null;
}

export class Layout {
    #layoutTarget: string | null = null;
    #xMode: string | null = null;
    #yMode: string | null = null;
    #xPos: number | null = null;
    #yPos: number | null = null;
    #width: number | null = null;
    #height: number | null = null;
    #dLblPos: string = '';
    #numFmtCode: string = '';
    #numFmtLinked: boolean = false;
    #showLegendKey: boolean | null = null;
    #showVal: boolean | null = null;
    #showCatName: boolean | null = null;
    #showSerName: boolean | null = null;
    #showPercent: boolean | null = null;
    #showBubbleSize: boolean | null = null;
    #showLeaderLines: boolean | null = null;
    #labelFillColor: ChartColor | null = null;
    #labelBorderColor: ChartColor | null = null;
    #labelFontColor: ChartColor | null = null;
    #labelFont: Font | null = null;
    #labelEffects: Properties | null = null;

    /**
     * Create a new Layout.
     */
    constructor(layout: LayoutOptions = {}) {
        if (layout.layoutTarget !== undefined) {
            this.#layoutTarget = layout.layoutTarget === null ? null : String(layout.layoutTarget);
        }
        if (layout.xMode !== undefined) {
            this.#xMode = layout.xMode === null ? null : String(layout.xMode);
        }
        if (layout.yMode !== undefined) {
            this.#yMode = layout.yMode === null ? null : String(layout.yMode);
        }
        if (layout.x !== undefined) {
            this.#xPos = layout.x === null ? null : Number(layout.x);
        }
        if (layout.y !== undefined) {
            this.#yPos = layout.y === null ? null : Number(layout.y);
        }
        if (layout.w !== undefined) {
            this.#width = layout.w === null ? null : Number(layout.w);
        }
        if (layout.h !== undefined) {
            this.#height = layout.h === null ? null : Number(layout.h);
        }
        if (layout.dLblPos !== undefined && layout.dLblPos !== null) {
            this.#dLblPos = String(layout.dLblPos);
        }
        if (layout.numFmtCode !== undefined && layout.numFmtCode !== null) {
            this.#numFmtCode = String(layout.numFmtCode);
        }
        this.initBoolean(layout, 'showLegendKey');
        this.initBoolean(layout, 'showVal');
        this.initBoolean(layout, 'showCatName');
        this.initBoolean(layout, 'showSerName');
        this.initBoolean(layout, 'showPercent');
        this.initBoolean(layout, 'showBubbleSize');
        this.initBoolean(layout, 'showLeaderLines');
        this.initBoolean(layout, 'numFmtLinked');
        this.initColor(layout, 'labelFillColor');
        this.initColor(layout, 'labelBorderColor');
        if (layout.labelFont instanceof Font) {
            this.#labelFont = layout.labelFont;
        }
        if (layout.labelFontColor instanceof ChartColor) {
            this.setLabelFontColor(layout.labelFontColor);
        }
        if (layout.labelEffects instanceof Properties) {
            this.#labelEffects = layout.labelEffects;
        }
    }

    private initBoolean(layout: LayoutOptions, name: keyof LayoutOptions): void {
        const value = layout[name];
        if (value !== undefined && value !== null) {
            const boolValue = Boolean(value);
            switch (name) {
                case 'showLegendKey':
                    this.#showLegendKey = boolValue;
                    break;
                case 'showVal':
                    this.#showVal = boolValue;
                    break;
                case 'showCatName':
                    this.#showCatName = boolValue;
                    break;
                case 'showSerName':
                    this.#showSerName = boolValue;
                    break;
                case 'showPercent':
                    this.#showPercent = boolValue;
                    break;
                case 'showBubbleSize':
                    this.#showBubbleSize = boolValue;
                    break;
                case 'showLeaderLines':
                    this.#showLeaderLines = boolValue;
                    break;
                case 'numFmtLinked':
                    this.#numFmtLinked = boolValue;
                    break;
                default:
                    break;
            }
        }
    }

    private initColor(layout: LayoutOptions, name: 'labelFillColor' | 'labelBorderColor'): void {
        const value = layout[name];
        if (value instanceof ChartColor) {
            if (name === 'labelFillColor') {
                this.#labelFillColor = value;
            } else {
                this.#labelBorderColor = value;
            }
        }
    }

    /**
     * Get layout target.
     */
    public getLayoutTarget(): string | null {
        return this.#layoutTarget;
    }

    /**
     * Set layout target.
     */
    public setLayoutTarget(target: string | null): this {
        this.#layoutTarget = target;
        return this;
    }

    /**
     * Get X mode.
     */
    public getXMode(): string | null {
        return this.#xMode;
    }

    /**
     * Set X mode.
     */
    public setXMode(mode: string | null): this {
        this.#xMode = mode === null ? null : String(mode);
        return this;
    }

    /**
     * Get Y mode.
     */
    public getYMode(): string | null {
        return this.#yMode;
    }

    /**
     * Set Y mode.
     */
    public setYMode(mode: string | null): this {
        this.#yMode = mode === null ? null : String(mode);
        return this;
    }

    /**
     * Get X position.
     */
    public getXPosition(): number | null {
        return this.#xPos;
    }

    /**
     * Set X position.
     */
    public setXPosition(position: number): this {
        this.#xPos = position;
        return this;
    }

    /**
     * Get Y position.
     */
    public getYPosition(): number | null {
        return this.#yPos;
    }

    /**
     * Set Y position.
     */
    public setYPosition(position: number): this {
        this.#yPos = position;
        return this;
    }

    /**
     * Get width.
     */
    public getWidth(): number | null {
        return this.#width;
    }

    /**
     * Set width.
     */
    public setWidth(width: number | null): this {
        this.#width = width;
        return this;
    }

    /**
     * Get height.
     */
    public getHeight(): number | null {
        return this.#height;
    }

    /**
     * Set height.
     */
    public setHeight(height: number | null): this {
        this.#height = height;
        return this;
    }

    public getShowLegendKey(): boolean | null {
        return this.#showLegendKey;
    }

    /**
     * Set show legend key.
     */
    public setShowLegendKey(showLegendKey: boolean | null): this {
        this.#showLegendKey = showLegendKey;
        return this;
    }

    public getShowVal(): boolean | null {
        return this.#showVal;
    }

    /**
     * Set show value.
     */
    public setShowVal(showDataLabelValues: boolean | null): this {
        this.#showVal = showDataLabelValues;
        return this;
    }

    public getShowCatName(): boolean | null {
        return this.#showCatName;
    }

    /**
     * Set show category name.
     */
    public setShowCatName(showCategoryName: boolean | null): this {
        this.#showCatName = showCategoryName;
        return this;
    }

    public getShowSerName(): boolean | null {
        return this.#showSerName;
    }

    /**
     * Set show series name.
     */
    public setShowSerName(showSeriesName: boolean | null): this {
        this.#showSerName = showSeriesName;
        return this;
    }

    public getShowPercent(): boolean | null {
        return this.#showPercent;
    }

    /**
     * Set show percent.
     */
    public setShowPercent(showPercentage: boolean | null): this {
        this.#showPercent = showPercentage;
        return this;
    }

    public getShowBubbleSize(): boolean | null {
        return this.#showBubbleSize;
    }

    /**
     * Set show bubble size.
     */
    public setShowBubbleSize(showBubbleSize: boolean | null): this {
        this.#showBubbleSize = showBubbleSize;
        return this;
    }

    public getShowLeaderLines(): boolean | null {
        return this.#showLeaderLines;
    }

    /**
     * Set show leader lines.
     */
    public setShowLeaderLines(showLeaderLines: boolean | null): this {
        this.#showLeaderLines = showLeaderLines;
        return this;
    }

    public getLabelFillColor(): ChartColor | null {
        return this.#labelFillColor;
    }

    public setLabelFillColor(chartColor: ChartColor | null): this {
        this.#labelFillColor = chartColor;
        return this;
    }

    public getLabelBorderColor(): ChartColor | null {
        return this.#labelBorderColor;
    }

    public setLabelBorderColor(chartColor: ChartColor | null): this {
        this.#labelBorderColor = chartColor;
        return this;
    }

    public getLabelFont(): Font | null {
        return this.#labelFont;
    }

    public setLabelFont(labelFont: Font | null): this {
        this.#labelFont = labelFont;
        return this;
    }

    public getLabelEffects(): Properties | null {
        return this.#labelEffects;
    }

    public setLabelEffects(labelEffects: Properties | null): this {
        this.#labelEffects = labelEffects;
        return this;
    }

    public getLabelFontColor(): ChartColor | null {
        if (this.#labelFont === null) {
            return this.#labelFontColor;
        }
        if (
            typeof (this.#labelFont as unknown as { getChartColor?: () => ChartColor | null }).getChartColor ===
            'function'
        ) {
            return (this.#labelFont as unknown as { getChartColor: () => ChartColor | null }).getChartColor();
        }
        return this.#labelFontColor;
    }

    public setLabelFontColor(chartColor: ChartColor | null): this {
        this.#labelFontColor = chartColor;
        if (this.#labelFont === null) {
            this.#labelFont = new Font();
        }
        if (
            typeof (this.#labelFont as unknown as { setChartColorFromObject?: (color: ChartColor | null) => void })
                .setChartColorFromObject === 'function'
        ) {
            (
                this.#labelFont as unknown as { setChartColorFromObject: (color: ChartColor | null) => void }
            ).setChartColorFromObject(chartColor);
        }
        return this;
    }

    public getDLblPos(): string {
        return this.#dLblPos;
    }

    public setDLblPos(dLblPos: string): this {
        this.#dLblPos = dLblPos;
        return this;
    }

    public getNumFmtCode(): string {
        return this.#numFmtCode;
    }

    public setNumFmtCode(numFmtCode: string): this {
        this.#numFmtCode = numFmtCode;
        return this;
    }

    public getNumFmtLinked(): boolean {
        return this.#numFmtLinked;
    }

    public setNumFmtLinked(numFmtLinked: boolean): this {
        this.#numFmtLinked = numFmtLinked;
        return this;
    }

    /**
     * Create a deep clone of this Layout.
     */
    public clone(): Layout {
        const cloned = new Layout();
        cloned.#layoutTarget = this.#layoutTarget;
        cloned.#xMode = this.#xMode;
        cloned.#yMode = this.#yMode;
        cloned.#xPos = this.#xPos;
        cloned.#yPos = this.#yPos;
        cloned.#width = this.#width;
        cloned.#height = this.#height;
        cloned.#dLblPos = this.#dLblPos;
        cloned.#numFmtCode = this.#numFmtCode;
        cloned.#numFmtLinked = this.#numFmtLinked;
        cloned.#showLegendKey = this.#showLegendKey;
        cloned.#showVal = this.#showVal;
        cloned.#showCatName = this.#showCatName;
        cloned.#showSerName = this.#showSerName;
        cloned.#showPercent = this.#showPercent;
        cloned.#showBubbleSize = this.#showBubbleSize;
        cloned.#showLeaderLines = this.#showLeaderLines;
        cloned.#labelFillColor = this.#labelFillColor
            ? new ChartColor(
                  this.#labelFillColor.getValue(),
                  this.#labelFillColor.getAlpha(),
                  this.#labelFillColor.getType() || undefined,
                  this.#labelFillColor.getBrightness() || undefined,
                  this.#labelFillColor.getLastClr() || undefined,
              )
            : null;
        cloned.#labelBorderColor = this.#labelBorderColor
            ? new ChartColor(
                  this.#labelBorderColor.getValue(),
                  this.#labelBorderColor.getAlpha(),
                  this.#labelBorderColor.getType() || undefined,
                  this.#labelBorderColor.getBrightness() || undefined,
                  this.#labelBorderColor.getLastClr() || undefined,
              )
            : null;
        cloned.#labelFontColor = this.#labelFontColor
            ? new ChartColor(
                  this.#labelFontColor.getValue(),
                  this.#labelFontColor.getAlpha(),
                  this.#labelFontColor.getType() || undefined,
                  this.#labelFontColor.getBrightness() || undefined,
                  this.#labelFontColor.getLastClr() || undefined,
              )
            : null;
        cloned.#labelFont = this.#labelFont ? this.#labelFont.clone() : null;
        cloned.#labelEffects = this.#labelEffects ? this.#labelEffects.clone() : null;
        return cloned;
    }
}

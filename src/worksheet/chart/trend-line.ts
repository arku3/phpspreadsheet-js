/**
 * TrendLine - represents a trend line for chart data series.
 *
 * Ported from PhpSpreadsheet Chart/TrendLine.php
 */

import type { ChartColor } from './chart-color';
import { Properties } from './properties';

export const TRENDLINE_EXPONENTIAL = 'exp';
export const TRENDLINE_LINEAR = 'linear';
export const TRENDLINE_LOGARITHMIC = 'log';
export const TRENDLINE_POLYNOMIAL = 'poly';
export const TRENDLINE_POWER = 'power';
export const TRENDLINE_MOVING_AVERAGE = 'movingAvg';
export const TRENDLINE_MOVING_AVG = TRENDLINE_MOVING_AVERAGE;

export const TRENDLINE_TYPES = [
    TRENDLINE_EXPONENTIAL,
    TRENDLINE_LINEAR,
    TRENDLINE_LOGARITHMIC,
    TRENDLINE_POLYNOMIAL,
    TRENDLINE_POWER,
    TRENDLINE_MOVING_AVERAGE,
] as const;

export type TrendLineType = (typeof TRENDLINE_TYPES)[number];

export class TrendLine extends Properties {
    #trendLineType: TrendLineType = TRENDLINE_LINEAR;
    #order: number = 2;
    #period: number = 3;
    #displayRSquared: boolean = false;
    #displayEquation: boolean = false;
    #name: string = '';
    #backward: number = 0.0;
    #forward: number = 0.0;
    #intercept: number = 0.0;
    #lineColor: ChartColor | null = null;
    #lineWidth: number | null = null;
    #lineStyle: string | null = null;

    constructor(
        trendLineType: TrendLineType | '' = '',
        order: number | null = null,
        period: number | null = null,
        displayRSquared: boolean = false,
        displayEquation: boolean = false,
        backward: number | null = null,
        forward: number | null = null,
        intercept: number | null = null,
        name: string | null = null,
    ) {
        super();
        this.setTrendLineProperties(
            trendLineType,
            order,
            period,
            displayRSquared,
            displayEquation,
            backward,
            forward,
            intercept,
            name,
        );
    }

    public getTrendLineType(): TrendLineType {
        return this.#trendLineType;
    }

    public setTrendLineType(trendLineType: TrendLineType): this {
        this.#trendLineType = trendLineType;
        return this;
    }

    public getOrder(): number {
        return this.#order;
    }

    public setOrder(order: number): this {
        this.#order = order;
        return this;
    }

    public getPeriod(): number {
        return this.#period;
    }

    public setPeriod(period: number): this {
        this.#period = period;
        return this;
    }

    public getDisplayRSquared(): boolean {
        return this.#displayRSquared;
    }

    public getDispRSqr(): boolean {
        return this.#displayRSquared;
    }

    public setDisplayRSquared(displayRSquared: boolean): this {
        this.#displayRSquared = displayRSquared;
        return this;
    }

    public setDispRSqr(displayRSquared: boolean): this {
        return this.setDisplayRSquared(displayRSquared);
    }

    public getDisplayEquation(): boolean {
        return this.#displayEquation;
    }

    public getDispEq(): boolean {
        return this.#displayEquation;
    }

    public setDisplayEquation(displayEquation: boolean): this {
        this.#displayEquation = displayEquation;
        return this;
    }

    public setDispEq(displayEquation: boolean): this {
        return this.setDisplayEquation(displayEquation);
    }

    public getName(): string {
        return this.#name;
    }

    public setName(name: string): this {
        this.#name = name;
        return this;
    }

    public getBackward(): number {
        return this.#backward;
    }

    public setBackward(backward: number): this {
        this.#backward = backward;
        return this;
    }

    public getForward(): number {
        return this.#forward;
    }

    public setForward(forward: number): this {
        this.#forward = forward;
        return this;
    }

    public getIntercept(): number {
        return this.#intercept;
    }

    public setIntercept(intercept: number): this {
        this.#intercept = intercept;
        return this;
    }

    public override getLineColor(): ChartColor {
        return this.#lineColor ?? super.getLineColor();
    }

    public setLineColor(lineColor: ChartColor | null): this {
        this.#lineColor = lineColor;
        return this;
    }

    public getLineWidth(): number | null {
        return this.#lineWidth;
    }

    public setLineWidth(lineWidth: number | null): this {
        this.#lineWidth = lineWidth;
        return this;
    }

    public getLineStyle(): string | null {
        return this.#lineStyle;
    }

    public setLineStyle(lineStyle: string | null): this {
        this.#lineStyle = lineStyle;
        return this;
    }

    public setTrendLineProperties(
        trendLineType: TrendLineType | '' | null = null,
        order: number | null = null,
        period: number | null = null,
        displayRSquared: boolean | null = null,
        displayEquation: boolean | null = null,
        backward: number | null = null,
        forward: number | null = null,
        intercept: number | null = null,
        name: string | null = null,
    ): this {
        if (trendLineType !== null && trendLineType !== '') {
            this.setTrendLineType(trendLineType);
        }
        if (order !== null) {
            this.setOrder(order);
        }
        if (period !== null) {
            this.setPeriod(period);
        }
        if (displayRSquared !== null) {
            this.setDisplayRSquared(displayRSquared);
        }
        if (displayEquation !== null) {
            this.setDisplayEquation(displayEquation);
        }
        if (backward !== null) {
            this.setBackward(backward);
        }
        if (forward !== null) {
            this.setForward(forward);
        }
        if (intercept !== null) {
            this.setIntercept(intercept);
        }
        if (name !== null) {
            this.setName(name);
        }

        return this;
    }

    public override clone(): TrendLine {
        const cloned = new TrendLine(
            this.#trendLineType,
            this.#order,
            this.#period,
            this.#displayRSquared,
            this.#displayEquation,
            this.#backward,
            this.#forward,
            this.#intercept,
            this.#name,
        );
        cloned.copyLineStyles(this);
        cloned.#lineColor = this.#lineColor ? this.#lineColor.clone() : null;
        cloned.#lineWidth = this.#lineWidth;
        cloned.#lineStyle = this.#lineStyle;
        return cloned;
    }
}

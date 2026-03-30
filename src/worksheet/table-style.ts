import { Style } from '../style/style.ts';
import { TableDxfsStyle } from './table-dxfs-style.ts';
import type { Table } from './table.ts';

export class TableStyle {
    public static readonly TABLE_STYLE_NONE = '';
    public static readonly TABLE_STYLE_LIGHT1 = 'TableStyleLight1';
    public static readonly TABLE_STYLE_LIGHT2 = 'TableStyleLight2';
    public static readonly TABLE_STYLE_LIGHT3 = 'TableStyleLight3';
    public static readonly TABLE_STYLE_LIGHT4 = 'TableStyleLight4';
    public static readonly TABLE_STYLE_LIGHT5 = 'TableStyleLight5';
    public static readonly TABLE_STYLE_LIGHT6 = 'TableStyleLight6';
    public static readonly TABLE_STYLE_LIGHT7 = 'TableStyleLight7';
    public static readonly TABLE_STYLE_LIGHT8 = 'TableStyleLight8';
    public static readonly TABLE_STYLE_LIGHT9 = 'TableStyleLight9';
    public static readonly TABLE_STYLE_LIGHT10 = 'TableStyleLight10';
    public static readonly TABLE_STYLE_LIGHT11 = 'TableStyleLight11';
    public static readonly TABLE_STYLE_LIGHT12 = 'TableStyleLight12';
    public static readonly TABLE_STYLE_LIGHT13 = 'TableStyleLight13';
    public static readonly TABLE_STYLE_LIGHT14 = 'TableStyleLight14';
    public static readonly TABLE_STYLE_LIGHT15 = 'TableStyleLight15';
    public static readonly TABLE_STYLE_LIGHT16 = 'TableStyleLight16';
    public static readonly TABLE_STYLE_LIGHT17 = 'TableStyleLight17';
    public static readonly TABLE_STYLE_LIGHT18 = 'TableStyleLight18';
    public static readonly TABLE_STYLE_LIGHT19 = 'TableStyleLight19';
    public static readonly TABLE_STYLE_LIGHT20 = 'TableStyleLight20';
    public static readonly TABLE_STYLE_LIGHT21 = 'TableStyleLight21';
    public static readonly TABLE_STYLE_MEDIUM1 = 'TableStyleMedium1';
    public static readonly TABLE_STYLE_MEDIUM2 = 'TableStyleMedium2';
    public static readonly TABLE_STYLE_MEDIUM3 = 'TableStyleMedium3';
    public static readonly TABLE_STYLE_MEDIUM4 = 'TableStyleMedium4';
    public static readonly TABLE_STYLE_MEDIUM5 = 'TableStyleMedium5';
    public static readonly TABLE_STYLE_MEDIUM6 = 'TableStyleMedium6';
    public static readonly TABLE_STYLE_MEDIUM7 = 'TableStyleMedium7';
    public static readonly TABLE_STYLE_MEDIUM8 = 'TableStyleMedium8';
    public static readonly TABLE_STYLE_MEDIUM9 = 'TableStyleMedium9';
    public static readonly TABLE_STYLE_MEDIUM10 = 'TableStyleMedium10';
    public static readonly TABLE_STYLE_MEDIUM11 = 'TableStyleMedium11';
    public static readonly TABLE_STYLE_MEDIUM12 = 'TableStyleMedium12';
    public static readonly TABLE_STYLE_MEDIUM13 = 'TableStyleMedium13';
    public static readonly TABLE_STYLE_MEDIUM14 = 'TableStyleMedium14';
    public static readonly TABLE_STYLE_MEDIUM15 = 'TableStyleMedium15';
    public static readonly TABLE_STYLE_MEDIUM16 = 'TableStyleMedium16';
    public static readonly TABLE_STYLE_MEDIUM17 = 'TableStyleMedium17';
    public static readonly TABLE_STYLE_MEDIUM18 = 'TableStyleMedium18';
    public static readonly TABLE_STYLE_MEDIUM19 = 'TableStyleMedium19';
    public static readonly TABLE_STYLE_MEDIUM20 = 'TableStyleMedium20';
    public static readonly TABLE_STYLE_MEDIUM21 = 'TableStyleMedium21';
    public static readonly TABLE_STYLE_MEDIUM22 = 'TableStyleMedium22';
    public static readonly TABLE_STYLE_MEDIUM23 = 'TableStyleMedium23';
    public static readonly TABLE_STYLE_MEDIUM24 = 'TableStyleMedium24';
    public static readonly TABLE_STYLE_MEDIUM25 = 'TableStyleMedium25';
    public static readonly TABLE_STYLE_MEDIUM26 = 'TableStyleMedium26';
    public static readonly TABLE_STYLE_MEDIUM27 = 'TableStyleMedium27';
    public static readonly TABLE_STYLE_MEDIUM28 = 'TableStyleMedium28';
    public static readonly TABLE_STYLE_DARK1 = 'TableStyleDark1';
    public static readonly TABLE_STYLE_DARK2 = 'TableStyleDark2';
    public static readonly TABLE_STYLE_DARK3 = 'TableStyleDark3';
    public static readonly TABLE_STYLE_DARK4 = 'TableStyleDark4';
    public static readonly TABLE_STYLE_DARK5 = 'TableStyleDark5';
    public static readonly TABLE_STYLE_DARK6 = 'TableStyleDark6';
    public static readonly TABLE_STYLE_DARK7 = 'TableStyleDark7';
    public static readonly TABLE_STYLE_DARK8 = 'TableStyleDark8';
    public static readonly TABLE_STYLE_DARK9 = 'TableStyleDark9';
    public static readonly TABLE_STYLE_DARK10 = 'TableStyleDark10';
    public static readonly TABLE_STYLE_DARK11 = 'TableStyleDark11';

    #theme: string = 'TableStyleMedium2';
    #showFirstColumn: boolean = false;
    #showLastColumn: boolean = false;
    #showRowStripes: boolean = false;
    #showColumnStripes: boolean = false;
    #tableStyle: TableDxfsStyle | null = null;
    #table: Table | null = null;

    public getTheme(): string {
        return this.#theme;
    }

    public setTheme(theme: string): this {
        this.#theme = theme;
        return this;
    }

    public getShowFirstColumn(): boolean {
        return this.#showFirstColumn;
    }

    public setShowFirstColumn(value: boolean): this {
        this.#showFirstColumn = value;
        return this;
    }

    public getShowLastColumn(): boolean {
        return this.#showLastColumn;
    }

    public setShowLastColumn(value: boolean): this {
        this.#showLastColumn = value;
        return this;
    }

    public getShowRowStripes(): boolean {
        return this.#showRowStripes;
    }

    public setShowRowStripes(value: boolean): this {
        this.#showRowStripes = value;
        return this;
    }

    public getShowColumnStripes(): boolean {
        return this.#showColumnStripes;
    }

    public setShowColumnStripes(value: boolean): this {
        this.#showColumnStripes = value;
        return this;
    }

    public getTableDxfsStyle(): TableDxfsStyle | null {
        return this.#tableStyle;
    }

    public setTableDxfsStyle(tableStyle: TableDxfsStyle, dxfs: Style[] = []): this {
        this.#tableStyle = tableStyle;
        if (dxfs.length > 0) {
            this.applyDxfsStyles(dxfs);
        }
        return this;
    }

    public getTable(): Table | null {
        return this.#table;
    }

    public setTable(table: Table | null): this {
        this.#table = table;
        return this;
    }

    public applyDxfsStyles(dxfs: Style[]): void {
        if (!this.#tableStyle) {
            return;
        }
        const headerRow = this.#tableStyle.getHeaderRow();
        if (headerRow !== null && dxfs[headerRow]) {
            this.#tableStyle.setHeaderRowStyle(dxfs[headerRow]);
        }
        const firstRowStripe = this.#tableStyle.getFirstRowStripe();
        if (firstRowStripe !== null && dxfs[firstRowStripe]) {
            this.#tableStyle.setFirstRowStripeStyle(dxfs[firstRowStripe]);
        }
        const secondRowStripe = this.#tableStyle.getSecondRowStripe();
        if (secondRowStripe !== null && dxfs[secondRowStripe]) {
            this.#tableStyle.setSecondRowStripeStyle(dxfs[secondRowStripe]);
        }
    }

    public clone(table: Table | null = null): TableStyle {
        const cloned = new TableStyle();
        cloned.setTheme(this.#theme);
        cloned.setShowFirstColumn(this.#showFirstColumn);
        cloned.setShowLastColumn(this.#showLastColumn);
        cloned.setShowRowStripes(this.#showRowStripes);
        cloned.setShowColumnStripes(this.#showColumnStripes);
        cloned.setTable(table);

        if (this.#tableStyle !== null) {
            cloned.setTableDxfsStyle(this.#tableStyle.clone());
        }

        return cloned;
    }
}

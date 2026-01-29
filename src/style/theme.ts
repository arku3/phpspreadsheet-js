/**
 * Theme.
 */
export class Theme {
    private themeColorName: string = 'Office';
    private themeFontName: string = 'Office';

    public static readonly HYPERLINK_THEME = 10;
    
    public static readonly COLOR_SCHEME_2013_2022_NAME = 'Office 2013-2022';
    public static readonly COLOR_SCHEME_2013_2022: Record<string, string> = {
        'dk1': '000000',
        'lt1': 'FFFFFF',
        'dk2': '44546A',
        'lt2': 'E7E6E6',
        'accent1': '4472C4',
        'accent2': 'ED7D31',
        'accent3': 'A5A5A5',
        'accent4': 'FFC000',
        'accent5': '5B9BD5',
        'accent6': '70AD47',
        'hlink': '0563C1',
        'folHlink': '954F72',
    };

    public static readonly COLOR_SCHEME_2007_2010_NAME = 'Office 2007-2010';
    public static readonly COLOR_SCHEME_2007_2010: Record<string, string> = {
        'dk1': '000000',
        'lt1': 'FFFFFF',
        'dk2': '1F497D',
        'lt2': 'EEECE1',
        'accent1': '4F81BD',
        'accent2': 'C0504D',
        'accent3': '9BBB59',
        'accent4': '8064A2',
        'accent5': '4BACC6',
        'accent6': 'F79646',
        'hlink': '0000FF',
        'folHlink': '800080',
    };

    public static readonly COLOR_SCHEME_2023_PLUS_NAME = 'Office 2023+';
    public static readonly COLOR_SCHEME_2023_PLUS: Record<string, string> = {
        'dk1': '000000',
        'lt1': 'FFFFFF',
        'dk2': '0E2841',
        'lt2': 'E8E8E8',
        'accent1': '156082',
        'accent2': 'E97132',
        'accent3': '196B24',
        'accent4': '0F9ED5',
        'accent5': 'A02B93',
        'accent6': '4EA72E',
        'hlink': '467886',
        'folHlink': '96607D',
    };

    public static readonly FONTS_TIMES_SUBSTITUTIONS: Record<string, string> = {
        'Jpan': 'ＭＳ Ｐゴシック',
        'Hang': '맑은 고딕',
        'Hans': '宋体',
        'Hant': '新細明體',
        'Arab': 'Times New Roman',
        'Hebr': 'Times New Roman',
        'Thai': 'Tahoma',
        'Ethi': 'Nyala',
        'Beng': 'Vrinda',
        'Gujr': 'Shruti',
        'Khmr': 'MoolBoran',
        'Knda': 'Tunga',
        'Guru': 'Raavi',
        'Cans': 'Euphemia',
        'Cher': 'Plantagenet Cherokee',
        'Yiii': 'Microsoft Yi Baiti',
        'Tibt': 'Microsoft Himalaya',
        'Thaa': 'MV Boli',
        'Deva': 'Mangal',
        'Telu': 'Gautami',
        'Taml': 'Latha',
        'Syrc': 'Estrangelo Edessa',
        'Orya': 'Kalinga',
        'Mlym': 'Kartika',
        'Laoo': 'DokChampa',
        'Sinh': 'Iskoola Pota',
        'Mong': 'Mongolian Baiti',
        'Viet': 'Times New Roman',
        'Uigh': 'Microsoft Uighur',
        'Geor': 'Sylfaen',
    };

    public static readonly FONTS_ARIAL_SUBSTITUTIONS: Record<string, string> = {
        'Jpan': 'ＭＳ Ｐゴシック',
        'Hang': '맑은 고딕',
        'Hans': '宋体',
        'Hant': '新細明體',
        'Arab': 'Arial',
        'Hebr': 'Arial',
        'Thai': 'Tahoma',
        'Ethi': 'Nyala',
        'Beng': 'Vrinda',
        'Gujr': 'Shruti',
        'Khmr': 'DaunPenh',
        'Knda': 'Tunga',
        'Guru': 'Raavi',
        'Cans': 'Euphemia',
        'Cher': 'Plantagenet Cherokee',
        'Yiii': 'Microsoft Yi Baiti',
        'Tibt': 'Microsoft Himalaya',
        'Thaa': 'MV Boli',
        'Deva': 'Mangal',
        'Telu': 'Gautami',
        'Taml': 'Latha',
        'Syrc': 'Estrangelo Edessa',
        'Orya': 'Kalinga',
        'Mlym': 'Kartika',
        'Laoo': 'DokChampa',
        'Sinh': 'Iskoola Pota',
        'Mong': 'Mongolian Baiti',
        'Viet': 'Arial',
        'Uigh': 'Microsoft Uighur',
        'Geor': 'Sylfaen',
    };

    private themeColors: Record<string, string> = { ...Theme.COLOR_SCHEME_2007_2010 };
    private majorFontLatin: string = 'Cambria';
    private majorFontEastAsian: string = '';
    private majorFontComplexScript: string = '';
    private minorFontLatin: string = 'Calibri';
    private minorFontEastAsian: string = '';
    private minorFontComplexScript: string = '';

    private majorFontSubstitutions: Record<string, string> = { ...Theme.FONTS_TIMES_SUBSTITUTIONS };
    private minorFontSubstitutions: Record<string, string> = { ...Theme.FONTS_ARIAL_SUBSTITUTIONS };

    public getThemeColors(): Record<string, string> {
        return this.themeColors;
    }

    public setThemeColor(key: string, value: string): this {
        this.themeColors[key] = value;
        return this;
    }

    public getThemeColorName(): string {
        return this.themeColorName;
    }

    public setThemeColorName(name: string, themeColors: Record<string, string> | null = null): this {
        if (name === 'Office 2013+') {
            name = Theme.COLOR_SCHEME_2013_2022_NAME;
        }
        this.themeColorName = name;
        if (name === Theme.COLOR_SCHEME_2007_2010_NAME) {
            themeColors = themeColors ?? Theme.COLOR_SCHEME_2007_2010;
            this.majorFontLatin = 'Cambria';
            this.minorFontLatin = 'Calibri';
        } else if (name === Theme.COLOR_SCHEME_2013_2022_NAME) {
            themeColors = themeColors ?? Theme.COLOR_SCHEME_2013_2022;
            this.majorFontLatin = 'Calibri Light';
            this.minorFontLatin = 'Calibri';
        } else if (name === Theme.COLOR_SCHEME_2023_PLUS_NAME) {
            themeColors = themeColors ?? Theme.COLOR_SCHEME_2023_PLUS;
            this.majorFontLatin = 'Aptos Display';
            this.minorFontLatin = 'Aptos Narrow';
        }

        if (themeColors !== null) {
            this.themeColors = { ...themeColors };
        }

        return this;
    }

    public getMajorFontLatin(): string {
        return this.majorFontLatin;
    }

    public getMajorFontEastAsian(): string {
        return this.majorFontEastAsian;
    }

    public getMajorFontComplexScript(): string {
        return this.majorFontComplexScript;
    }

    public getMajorFontSubstitutions(): Record<string, string> {
        return this.majorFontSubstitutions;
    }

    public setMajorFontValues(latin: string | null, eastAsian: string | null, complexScript: string | null, substitutions: Record<string, string> | null): this {
        if (latin) {
            this.majorFontLatin = latin;
        }
        if (eastAsian !== null) {
            this.majorFontEastAsian = eastAsian;
        }
        if (complexScript !== null) {
            this.majorFontComplexScript = complexScript;
        }
        if (substitutions !== null) {
            this.majorFontSubstitutions = { ...substitutions };
        }
        return this;
    }

    public getMinorFontLatin(): string {
        return this.minorFontLatin;
    }

    public getMinorFontEastAsian(): string {
        return this.minorFontEastAsian;
    }

    public getMinorFontComplexScript(): string {
        return this.minorFontComplexScript;
    }

    public getMinorFontSubstitutions(): Record<string, string> {
        return this.minorFontSubstitutions;
    }

    public setMinorFontValues(latin: string | null, eastAsian: string | null, complexScript: string | null, substitutions: Record<string, string> | null): this {
        if (latin) {
            this.minorFontLatin = latin;
        }
        if (eastAsian !== null) {
            this.minorFontEastAsian = eastAsian;
        }
        if (complexScript !== null) {
            this.minorFontComplexScript = complexScript;
        }
        if (substitutions !== null) {
            this.minorFontSubstitutions = { ...substitutions };
        }
        return this;
    }

    public getThemeFontName(): string {
        return this.themeFontName;
    }

    public setThemeFontName(name: string | null): this {
        if (name) {
            this.themeFontName = name;
        }
        return this;
    }
}

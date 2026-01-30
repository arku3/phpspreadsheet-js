import { create } from 'xmlbuilder2';
import { Spreadsheet } from '../../core/spreadsheet.ts';
import { Theme as CoreTheme } from '../../style/theme.ts';
import { WriterPart } from './writer-part.ts';

/**
 * Generates theme1.xml.
 */
export class Theme extends WriterPart {
    /**
     * Write theme to XML format.
     */
    public writeTheme(spreadsheet: Spreadsheet): string {
        const theme = spreadsheet.getTheme();
        const root = create({ version: '1.0', encoding: 'UTF-8', standalone: true }).ele(
            'a:theme',
            {
                'xmlns:a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
                name: 'Office Theme',
            },
        );

        const themeElements = root.ele('a:themeElements');

        // clrScheme
        const clrScheme = themeElements.ele('a:clrScheme', { name: theme.getThemeColorName() });
        this.writeColourScheme(clrScheme, theme);

        // fontScheme
        const fontScheme = themeElements.ele('a:fontScheme', { name: theme.getThemeFontName() });

        const majorFont = fontScheme.ele('a:majorFont');
        this.writeFonts(
            majorFont,
            theme.getMajorFontLatin(),
            theme.getMajorFontEastAsian(),
            theme.getMajorFontComplexScript(),
            theme.getMajorFontSubstitutions(),
        );

        const minorFont = fontScheme.ele('a:minorFont');
        this.writeFonts(
            minorFont,
            theme.getMinorFontLatin(),
            theme.getMinorFontEastAsian(),
            theme.getMinorFontComplexScript(),
            theme.getMinorFontSubstitutions(),
        );

        // fmtScheme (Fixed boilerplate for "Office" theme)
        const fmtScheme = themeElements.ele('a:fmtScheme', { name: 'Office' });

        const fillStyleLst = fmtScheme.ele('a:fillStyleLst');
        fillStyleLst.ele('a:solidFill').ele('a:schemeClr', { val: 'phClr' });

        const gradFill1 = fillStyleLst.ele('a:gradFill', { rotWithShape: '1' });
        const gsLst1 = gradFill1.ele('a:gsLst');
        gsLst1
            .ele('a:gs', { pos: '0' })
            .ele('a:schemeClr', { val: 'phClr' })
            .ele('a:tint', { val: '50000' })
            .up()
            .ele('a:satMod', { val: '300000' });
        gsLst1
            .ele('a:gs', { pos: '35000' })
            .ele('a:schemeClr', { val: 'phClr' })
            .ele('a:tint', { val: '37000' })
            .up()
            .ele('a:satMod', { val: '300000' });
        gsLst1
            .ele('a:gs', { pos: '100000' })
            .ele('a:schemeClr', { val: 'phClr' })
            .ele('a:tint', { val: '15000' })
            .up()
            .ele('a:satMod', { val: '350000' });
        gradFill1.ele('a:lin', { ang: '16200000', scaled: '1' });

        const gradFill2 = fillStyleLst.ele('a:gradFill', { rotWithShape: '1' });
        const gsLst2 = gradFill2.ele('a:gsLst');
        gsLst2
            .ele('a:gs', { pos: '0' })
            .ele('a:schemeClr', { val: 'phClr' })
            .ele('a:shade', { val: '51000' })
            .up()
            .ele('a:satMod', { val: '130000' });
        gsLst2
            .ele('a:gs', { pos: '80000' })
            .ele('a:schemeClr', { val: 'phClr' })
            .ele('a:shade', { val: '93000' })
            .up()
            .ele('a:satMod', { val: '130000' });
        gsLst2
            .ele('a:gs', { pos: '100000' })
            .ele('a:schemeClr', { val: 'phClr' })
            .ele('a:shade', { val: '94000' })
            .up()
            .ele('a:satMod', { val: '135000' });
        gradFill2.ele('a:lin', { ang: '16200000', scaled: '0' });

        const lnStyleLst = fmtScheme.ele('a:lnStyleLst');
        const ln1 = lnStyleLst.ele('a:ln', { w: '9525', cap: 'flat', cmpd: 'sng', algn: 'ctr' });
        ln1.ele('a:solidFill')
            .ele('a:schemeClr', { val: 'phClr' })
            .ele('a:shade', { val: '95000' })
            .up()
            .ele('a:satMod', { val: '105000' });
        ln1.ele('a:prstDash', { val: 'solid' });

        const ln2 = lnStyleLst.ele('a:ln', { w: '25400', cap: 'flat', cmpd: 'sng', algn: 'ctr' });
        ln2.ele('a:solidFill').ele('a:schemeClr', { val: 'phClr' });
        ln2.ele('a:prstDash', { val: 'solid' });

        const ln3 = lnStyleLst.ele('a:ln', { w: '38100', cap: 'flat', cmpd: 'sng', algn: 'ctr' });
        ln3.ele('a:solidFill').ele('a:schemeClr', { val: 'phClr' });
        ln3.ele('a:prstDash', { val: 'solid' });

        const effectStyleLst = fmtScheme.ele('a:effectStyleLst');
        effectStyleLst
            .ele('a:effectStyle')
            .ele('a:effectLst')
            .ele('a:outerShdw', {
                blurRad: '40000',
                dist: '20000',
                dir: '5400000',
                rotWithShape: '0',
            })
            .ele('a:srgbClr', { val: '000000' })
            .ele('a:alpha', { val: '38000' });
        effectStyleLst
            .ele('a:effectStyle')
            .ele('a:effectLst')
            .ele('a:outerShdw', {
                blurRad: '40000',
                dist: '23000',
                dir: '5400000',
                rotWithShape: '0',
            })
            .ele('a:srgbClr', { val: '000000' })
            .ele('a:alpha', { val: '35000' });

        const effectStyle3 = effectStyleLst.ele('a:effectStyle');
        effectStyle3
            .ele('a:effectLst')
            .ele('a:outerShdw', {
                blurRad: '40000',
                dist: '23000',
                dir: '5400000',
                rotWithShape: '0',
            })
            .ele('a:srgbClr', { val: '000000' })
            .ele('a:alpha', { val: '35000' });
        effectStyle3
            .ele('a:scene3d')
            .ele('a:camera', { prst: 'orthographicFront' })
            .ele('a:rot', { lat: '0', lon: '0', rev: '0' })
            .up()
            .up()
            .ele('a:lightRig', { rig: 'threePt', dir: 't' })
            .ele('a:rot', { lat: '0', lon: '0', rev: '1200000' });
        effectStyle3.ele('a:sp3d').ele('a:bevelT', { w: '63500', h: '25400' });

        const bgFillStyleLst = fmtScheme.ele('a:bgFillStyleLst');
        bgFillStyleLst.ele('a:solidFill').ele('a:schemeClr', { val: 'phClr' });

        const bgGradFill1 = bgFillStyleLst.ele('a:gradFill', { rotWithShape: '1' });
        const bgGsLst1 = bgGradFill1.ele('a:gsLst');
        bgGsLst1
            .ele('a:gs', { pos: '0' })
            .ele('a:schemeClr', { val: 'phClr' })
            .ele('a:tint', { val: '40000' })
            .up()
            .ele('a:satMod', { val: '350000' });
        bgGsLst1
            .ele('a:gs', { pos: '40000' })
            .ele('a:schemeClr', { val: 'phClr' })
            .ele('a:tint', { val: '45000' })
            .up()
            .ele('a:shade', { val: '99000' })
            .up()
            .ele('a:satMod', { val: '350000' });
        bgGsLst1
            .ele('a:gs', { pos: '100000' })
            .ele('a:schemeClr', { val: 'phClr' })
            .ele('a:shade', { val: '20000' })
            .up()
            .ele('a:satMod', { val: '255000' });
        bgGradFill1
            .ele('a:path', { path: 'circle' })
            .ele('a:fillToRect', { l: '50000', t: '-80000', r: '50000', b: '180000' });

        const bgGradFill2 = bgFillStyleLst.ele('a:gradFill', { rotWithShape: '1' });
        const bgGsLst2 = bgGradFill2.ele('a:gsLst');
        bgGsLst2
            .ele('a:gs', { pos: '0' })
            .ele('a:schemeClr', { val: 'phClr' })
            .ele('a:tint', { val: '80000' })
            .up()
            .ele('a:satMod', { val: '300000' });
        bgGsLst2
            .ele('a:gs', { pos: '100000' })
            .ele('a:schemeClr', { val: 'phClr' })
            .ele('a:shade', { val: '30000' })
            .up()
            .ele('a:satMod', { val: '200000' });
        bgGradFill2
            .ele('a:path', { path: 'circle' })
            .ele('a:fillToRect', { l: '50000', t: '50000', r: '50000', b: '50000' });

        root.ele('a:objectDefaults');
        root.ele('a:extraClrSchemeLst');

        return root.end({ prettyPrint: true });
    }

    private writeFonts(
        parent: any,
        latinFont: string,
        eastAsianFont: string,
        complexScriptFont: string,
        fontSet: Record<string, string>,
    ): void {
        parent.ele('a:latin', { typeface: latinFont });
        parent.ele('a:ea', { typeface: eastAsianFont });
        parent.ele('a:cs', { typeface: complexScriptFont });

        for (const [script, typeface] of Object.entries(fontSet)) {
            parent.ele('a:font', { script, typeface });
        }
    }

    private writeColourScheme(parent: any, theme: CoreTheme): void {
        const themeColors = theme.getThemeColors();
        const mapping: Record<string, string> = {
            dk1: 'windowText',
            lt1: 'window',
        };

        const keys = [
            'dk1',
            'lt1',
            'dk2',
            'lt2',
            'accent1',
            'accent2',
            'accent3',
            'accent4',
            'accent5',
            'accent6',
            'hlink',
            'folHlink',
        ];

        for (const key of keys) {
            const el = parent.ele(`a:${key}`);
            const val = themeColors[keys.indexOf(key)];
            if (mapping[key]) {
                el.ele('a:sysClr', { val: mapping[key], lastClr: val || '000000' });
            } else {
                el.ele('a:srgbClr', { val: val || '000000' });
            }
        }
    }
}

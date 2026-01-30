import { create } from 'xmlbuilder2';
import { Spreadsheet } from '../../core/spreadsheet.ts';
import { Properties } from '../../document/properties.ts';
import { WriterPart } from './writer-part.ts';

/**
 * Generates docProps/*.xml.
 */
export class DocProps extends WriterPart {
    /**
     * Write docProps/app.xml to XML format.
     */
    public writeDocPropsApp(spreadsheet: Spreadsheet): string {
        const properties = spreadsheet.getProperties();
        const root = create({ version: '1.0', encoding: 'UTF-8', standalone: true }).ele('Properties', {
            xmlns: 'http://schemas.openxmlformats.org/officeDocument/2006/extended-properties',
            'xmlns:vt': 'http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes',
        });

        root.ele('Application').txt('phpspreadsheet-js');
        root.ele('DocSecurity').txt('0');
        root.ele('ScaleCrop').txt('false');

        const headingPairs = root.ele('HeadingPairs');
        const vector1 = headingPairs.ele('vt:vector', { size: '2', baseType: 'variant' });
        vector1.ele('vt:variant').ele('vt:lpstr').txt('Worksheets');
        vector1.ele('vt:variant').ele('vt:i4').txt(String(spreadsheet.getSheetCount()));

        const titlesOfParts = root.ele('TitlesOfParts');
        const vector2 = titlesOfParts.ele('vt:vector', {
            size: String(spreadsheet.getSheetCount()),
            baseType: 'lpstr',
        });
        for (let i = 0; i < spreadsheet.getSheetCount(); i++) {
            vector2.ele('vt:lpstr').txt(spreadsheet.getSheet(i).getTitle());
        }

        root.ele('Company').txt(properties.getCompany());
        root.ele('Manager').txt(properties.getManager());
        root.ele('LinksUpToDate').txt('false');
        root.ele('SharedDoc').txt('false');
        root.ele('HyperlinkBase').txt(properties.getHyperlinkBase());
        root.ele('HyperlinksChanged').txt('false');
        root.ele('AppVersion').txt('12.0000');

        return root.end({ prettyPrint: true });
    }

    /**
     * Write docProps/core.xml to XML format.
     */
    public writeDocPropsCore(spreadsheet: Spreadsheet): string {
        const properties = spreadsheet.getProperties();
        const root = create({ version: '1.0', encoding: 'UTF-8', standalone: true }).ele('cp:coreProperties', {
            'xmlns:cp': 'http://schemas.openxmlformats.org/package/2006/metadata/core-properties',
            'xmlns:dc': 'http://purl.org/dc/elements/1.1/',
            'xmlns:dcterms': 'http://purl.org/dc/terms/',
            'xmlns:dcmitype': 'http://purl.org/dc/dcmitype/',
            'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        });

        root.ele('dc:creator').txt(properties.getCreator());
        root.ele('cp:lastModifiedBy').txt(properties.getLastModifiedBy());

        const createdDate = new Date(properties.getCreated() * 1000).toISOString().split('.')[0] + 'Z';
        root.ele('dcterms:created', { 'xsi:type': 'dcterms:W3CDTF' }).txt(createdDate);

        const modifiedDate = new Date(properties.getModified() * 1000).toISOString().split('.')[0] + 'Z';
        root.ele('dcterms:modified', { 'xsi:type': 'dcterms:W3CDTF' }).txt(modifiedDate);

        root.ele('dc:title').txt(properties.getTitle());
        root.ele('dc:description').txt(properties.getDescription());
        root.ele('dc:subject').txt(properties.getSubject());
        root.ele('cp:keywords').txt(properties.getKeywords());
        root.ele('cp:category').txt(properties.getCategory());

        return root.end({ prettyPrint: true });
    }

    /**
     * Write docProps/custom.xml to XML format.
     */
    public writeDocPropsCustom(spreadsheet: Spreadsheet): string | null {
        const properties = spreadsheet.getProperties();
        const customPropertyList = properties.getCustomProperties();
        if (customPropertyList.length === 0) {
            return null;
        }

        const root = create({ version: '1.0', encoding: 'UTF-8', standalone: true }).ele('Properties', {
            xmlns: 'http://schemas.openxmlformats.org/officeDocument/2006/custom-properties',
            'xmlns:vt': 'http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes',
        });

        customPropertyList.forEach((propName, index) => {
            const value = properties.getCustomPropertyValue(propName);
            const type = properties.getCustomPropertyType(propName);

            const prop = root.ele('property', {
                fmtid: '{D5CDD505-2E9C-101B-9397-08002B2CF9AE}',
                pid: String(index + 2),
                name: propName,
            });

            switch (type) {
                case Properties.PROPERTY_TYPE_INTEGER:
                    prop.ele('vt:i4').txt(String(value));
                    break;
                case Properties.PROPERTY_TYPE_FLOAT:
                    prop.ele('vt:r8').txt(String(value));
                    break;
                case Properties.PROPERTY_TYPE_BOOLEAN:
                    prop.ele('vt:bool').txt(value ? 'true' : 'false');
                    break;
                case Properties.PROPERTY_TYPE_DATE:
                    const dateVal = new Date((value as number) * 1000).toISOString().split('.')[0] + 'Z';
                    prop.ele('vt:filetime').txt(dateVal);
                    break;
                default:
                    prop.ele('vt:lpwstr').txt(String(value));
                    break;
            }
        });

        return root.end({ prettyPrint: true });
    }
}

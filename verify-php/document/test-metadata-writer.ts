import { Spreadsheet } from '../../src/core/spreadsheet.ts';
import { XlsxWriter } from '../../src/io/xlsx-writer.ts';

async function main() {
    const spreadsheet = new Spreadsheet();
    const props = spreadsheet.getProperties();

    props
        .setCreator('Agent Opencode')
        .setLastModifiedBy('Agent Opencode')
        .setTitle('Metadata Verification')
        .setSubject('Testing Document Properties')
        .setDescription('This is a test file for metadata.')
        .setKeywords('metadata, test, phpspreadsheet-js')
        .setCategory('Test')
        .setCompany('The Spreadsheet Company')
        .setManager('Metadata Manager');

    props
        .setCustomProperty('Project', 'phpspreadsheet-js')
        .setCustomProperty('Version', '1.0.0')
        .setCustomProperty('IsInternal', true)
        .setCustomProperty('Progress', 0.5);

    const sheet = spreadsheet.getActiveSheet();
    sheet.setCellValue('A1', 'Check properties in this file.');

    const writer = new XlsxWriter(spreadsheet);
    const filename = 'verify-php/document/metadata-test.xlsx';
    console.log(`Saving to ${filename}...`);
    await writer.save(filename);
    console.log('Done!');
}

main().catch(console.error);

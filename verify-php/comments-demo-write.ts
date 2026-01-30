import path from 'node:path';
import process from 'node:process';
import { Spreadsheet } from '../src/core/spreadsheet.ts';
import { XlsxWriter } from '../src/io/xlsx-writer.ts';
import { RichText } from '../src/rich-text/rich-text.ts';

async function main(): Promise<void> {
    const outPath = process.argv[2]
        ? path.resolve(process.argv[2])
        : path.join(process.cwd(), 'verify-php', 'comments-demo.xlsx');

    const spreadsheet = new Spreadsheet();
    const sheet = spreadsheet.getActiveSheet();
    sheet.setTitle('Comments');

    sheet.setCellValue('A1', 'Has comment');
    sheet.setCellValue('C3', 'Has comment too');

    const a1Text = new RichText();
    a1Text.createText('Hello from JS');
    sheet.getComment('A1').setAuthor('Alice').setText(a1Text);

    const c3Text = new RichText();
    c3Text.createText('Second comment');
    sheet.getComment('C3').setAuthor('Bob').setText(c3Text);

    const writer = new XlsxWriter(spreadsheet);
    writer.setPreCalculateFormulas(true);
    await writer.save(outPath);
}

main().catch((error: unknown) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exitCode = 1;
});

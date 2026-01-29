<?php
require 'php-src/vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Style\Fill;

$filename = 'full-parity-test.xlsx';
if (!file_exists($filename)) {
    echo "File not found: $filename\n";
    exit(1);
}

try {
    echo "Loading $filename with PhpSpreadsheet...\n";
    $spreadsheet = IOFactory::load($filename);
    $sheet = $spreadsheet->getActiveSheet();

    // 1. Verify Theme for Fill (A1)
    echo "\n--- A1 (Fill Theme) ---\n";
    $styleA1 = $sheet->getStyle('A1');
    $fillA1 = $styleA1->getFill();
    echo "Fill Type: " . $fillA1->getFillType() . "\n";
    $startColor = $fillA1->getStartColor();
    echo "Theme Index: " . $startColor->getTheme() . "\n";
    echo "Resolved ARGB: " . $startColor->getARGB() . "\n";

    // 2. Verify Theme for Font (A2)
    echo "\n--- A2 (Font Theme) ---\n";
    $styleA2 = $sheet->getStyle('A2');
    $fontA2 = $styleA2->getFont();
    $fontColor = $fontA2->getColor();
    echo "Font Theme Index: " . $fontColor->getTheme() . "\n";
    echo "Resolved ARGB: " . $fontColor->getARGB() . "\n";

    // 3. Verify Conditional Formatting (B1:B2)
    echo "\n--- B1:B2 (Conditional Formatting) ---\n";
    $cfRules = $sheet->getConditionalStyles('B1:B2');
    echo "Rule Count: " . count($cfRules) . "\n";
    foreach ($cfRules as $index => $rule) {
        echo "Rule " . ($index + 1) . " Type: " . $rule->getConditionType() . "\n";
        echo "Rule " . ($index + 1) . " Operator: " . $rule->getOperatorType() . "\n";
        echo "Rule " . ($index + 1) . " Style Bold: " . ($rule->getStyle()->getFont()->getBold() ? 'Yes' : 'No') . "\n";
        echo "Rule " . ($index + 1) . " Style Color: " . $rule->getStyle()->getFont()->getColor()->getARGB() . "\n";
    }

    // 4. Verify Border Theme (C1)
    echo "\n--- C1 (Border Theme) ---\n";
    $styleC1 = $sheet->getStyle('C1');
    $border = $styleC1->getBorders()->getBottom();
    echo "Bottom Border Style: " . $border->getBorderStyle() . "\n";
    echo "Bottom Border Theme: " . $border->getColor()->getTheme() . "\n";

    echo "\nVerification Finished.\n";
} catch (\Exception $e) {
    echo "Verification Failed: " . $e->getMessage() . "\n";
    exit(1);
}

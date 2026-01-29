<?php
require 'php-src/vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\IOFactory;

try {
    $filename = 'verify-php/document/metadata-test.xlsx';
    if (!file_exists($filename)) {
        echo "File not found: $filename\n";
        exit(1);
    }

    echo "Loading $filename with PhpSpreadsheet...\n";
    $spreadsheet = IOFactory::load($filename);
    $props = $spreadsheet->getProperties();

    echo "Creator: " . $props->getCreator() . "\n";
    echo "Title: " . $props->getTitle() . "\n";
    echo "Subject: " . $props->getSubject() . "\n";
    echo "Description: " . $props->getDescription() . "\n";
    echo "Keywords: " . $props->getKeywords() . "\n";
    echo "Category: " . $props->getCategory() . "\n";
    echo "Company: " . $props->getCompany() . "\n";
    echo "Manager: " . $props->getManager() . "\n";

    echo "Custom Properties:\n";
    foreach ($props->getCustomProperties() as $customProp) {
        $val = $props->getCustomPropertyValue($customProp);
        $type = gettype($val);
        echo " - $customProp ($type): " . ($type === 'boolean' ? ($val ? 'true' : 'false') : $val) . "\n";
    }

    if ($props->getCreator() !== 'Agent Opencode') throw new Exception("Creator mismatch");
    if ($props->getTitle() !== 'Metadata Verification') throw new Exception("Title mismatch");
    if ($props->getCustomPropertyValue('Project') !== 'phpspreadsheet-js') throw new Exception("Custom property mismatch");

    echo "Verification Successful!\n";
} catch (\Exception $e) {
    echo "Verification Failed: " . $e->getMessage() . "\n";
    exit(1);
}

<?php

require 'php-src/vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\IOFactory;

$filename = $argv[1] ?? 'verify-php/comments-demo.xlsx';
if (!file_exists($filename)) {
    fwrite(STDERR, "File not found: $filename\n");
    exit(1);
}

$spreadsheet = IOFactory::load($filename);
$sheet = $spreadsheet->getActiveSheet();

$assertComment = function (string $cell, string $author, string $text) use ($sheet): void {
    $comment = $sheet->getComment($cell);
    if ($comment === null) {
        throw new RuntimeException("Missing comment at $cell");
    }
    $actualAuthor = $comment->getAuthor();
    $actualText = $comment->getText()->getPlainText();
    if ($actualAuthor !== $author) {
        throw new RuntimeException("$cell author mismatch: expected '$author', got '$actualAuthor'");
    }
    if ($actualText !== $text) {
        throw new RuntimeException("$cell text mismatch: expected '$text', got '$actualText'");
    }
};

try {
    $assertComment('A1', 'Alice', 'Hello from JS');
    $assertComment('C3', 'Bob', 'Second comment');
    echo "OK: comments verified\n";
    exit(0);
} catch (Throwable $e) {
    fwrite(STDERR, "FAILED: " . $e->getMessage() . "\n");
    exit(1);
}

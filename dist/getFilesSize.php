<?php
error_reporting(E_ALL | E_STRICT);//| E_STRICT );

// при копировании массива из входного потока в $_POST точка (.) изменяется на подчеркивание (_)
// поэтому получаем данные напрямую, но потенциально небезопасно
// file_get_contents('php://input') => $_POST
// $_SERVER['QUERY_STRING']         => $_GET
// $_SERVER['HTTP_COOKIE']          => $_COOKIE
// 1. переопределить эти переменные с исправлениями или брать напрямую
// 2. кодировать в клиенте в base64, декодировать на сервере (больше кода)
$files = json_decode(file_get_contents('php://input'));

// изменяем массив $files из {index => fileName} в {index => fileSize}
forEach ($files as $index => &$fileSize) {
    $fileSize = __DIR__ . '/'. $fileSize; // файл находится в корне
    // $fileSize = dirname(__DIR__) . '/'. $fileSize; // файл находится в поддиректории
    $fileSize = str_replace('\\', '/', $fileSize);
    $fileSize = str_replace('..', '', $fileSize);
    $fileSize = str_replace('./', '/', $fileSize);
    $fileSize = filesize($fileSize);
}

if(is_array(error_get_last())) {
    die("file not found: " .
        error_get_last()['message'] . ",
        in file: " . error_get_last()['file'] . ",
        at line: " . error_get_last()['line']);
}

echo json_encode($files,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);

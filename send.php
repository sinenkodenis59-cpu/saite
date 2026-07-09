<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

function respond(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['ok' => false, 'message' => 'Метод не поддерживается.']);
}

$honeypot = trim((string)($_POST['company'] ?? ''));
if ($honeypot !== '') {
    respond(200, ['ok' => true]);
}

$name = trim((string)($_POST['name'] ?? ''));
$phone = trim((string)($_POST['phone'] ?? ''));

$name = preg_replace('/[\r\n]+/u', ' ', $name) ?? '';
$phone = preg_replace('/[\r\n]+/u', ' ', $phone) ?? '';

if ($name === '' || mb_strlen($name, 'UTF-8') > 80) {
    respond(400, ['ok' => false, 'message' => 'Укажите имя.']);
}

if ($phone === '' || mb_strlen($phone, 'UTF-8') > 40) {
    respond(400, ['ok' => false, 'message' => 'Укажите телефон.']);
}

$to = 'zdorovya.in@yandex.ru';
$subject = 'Новая заявка с сайта Гармония';
$host = $_SERVER['HTTP_HOST'] ?? 'гармония-ялта.рф';
$ip = $_SERVER['REMOTE_ADDR'] ?? 'не определен';
$date = date('d.m.Y H:i:s');

$message = "Новая заявка с сайта Гармония\n\n"
    . "Имя: {$name}\n"
    . "Телефон: {$phone}\n"
    . "Дата: {$date}\n"
    . "IP: {$ip}\n"
    . "Сайт: {$host}\n";

$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'From: Гармония <no-reply@xn----7sbbj0ateiis2a7mb.xn--p1ai>',
    'Reply-To: no-reply@xn----7sbbj0ateiis2a7mb.xn--p1ai',
    'X-Mailer: PHP/' . phpversion(),
];

$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
$sent = mail($to, $encodedSubject, $message, implode("\r\n", $headers));

if (!$sent) {
    respond(500, ['ok' => false, 'message' => 'Не удалось отправить заявку. Попробуйте позже.']);
}

respond(200, ['ok' => true, 'message' => 'Заявка отправлена.']);

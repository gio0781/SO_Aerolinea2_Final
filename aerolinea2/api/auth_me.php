<?php
require __DIR__ . '/db.php';
require __DIR__ . '/session.php';
json_response(['ok'=>true,'user'=>($_SESSION['user'] ?? null)]);

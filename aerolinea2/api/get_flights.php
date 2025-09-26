<?php
require __DIR__ . '/db.php';
$pdo = get_pdo();
$r = $pdo->query("SELECT * FROM flights ORDER BY date,time")->fetchAll();
json_response(['ok'=>true,'flights'=>$r]);

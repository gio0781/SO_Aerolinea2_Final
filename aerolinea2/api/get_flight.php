<?php
require __DIR__ . '/db.php';
$pdo = get_pdo();
$code = $_GET['code'] ?? '';
$stmt = $pdo->prepare("SELECT * FROM flights WHERE flight_number=?");
$stmt->execute([$code]);
$f = $stmt->fetch();
if(!$f) json_response(['ok'=>false,'error'=>'Vuelo no encontrado'],404);
json_response(['ok'=>true,'flight'=>$f]);
